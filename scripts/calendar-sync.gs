// ================================================================
// HOMIE CALENDAR SYNC  —  Google Apps Script
// Paste this entire file into script.google.com (see instructions)
//
// What it does (runs every 5 minutes):
//   1. Auto-accepts any pending calendar invitations sent to this
//      Google account (jensenhomie@gmail.com)
//   2. Syncs all calendar events into the Homie app's Firestore so
//      they appear in the Homie calendar
//
// First-run setup: fill in the three values in the CONFIG block
// below, then run syncCalendar() once manually to test.
// ================================================================


// ── ① FILL THESE IN ─────────────────────────────────────────────

var HOUSEHOLD_ID = "PASTE_YOUR_HOUSEHOLD_ID_HERE";
// Find it: Firebase Console → Firestore Database → households collection
// → click the one document → copy the document ID from the URL/breadcrumb

var SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-xxxxx@homie-8d36f.iam.gserviceaccount.com";
// Find it: Firebase Console → Project Settings (gear icon) →
// Service Accounts tab → copy the "Service account" email shown there

var PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nPASTE_YOUR_KEY_HERE\n-----END PRIVATE KEY-----\n";
// Find it: same page as above → click "Generate new private key" →
// open the downloaded JSON file → copy the value of the "private_key" field
// (include the -----BEGIN/END PRIVATE KEY----- lines and the \n characters)


// ── ② LEAVE THESE ALONE ─────────────────────────────────────────

var PROJECT_ID     = "homie-8d36f";
var SYNC_TOKEN_KEY = "homie_gcal_sync_token";
var EVENT_COLOUR   = "#4D96FF";  // blue — visually distinct from manually-added events


// ================================================================
// MAIN — attach a time-based trigger to this function
// ================================================================

function syncCalendar() {
  try {
    acceptPendingInvitations();
    syncEventsToFirestore();
  } catch (e) {
    Logger.log("ERROR: " + e.toString());
    // Wipe the sync token so the next run does a clean full sync
    PropertiesService.getScriptProperties().deleteProperty(SYNC_TOKEN_KEY);
  }
}


// ================================================================
// PART 1 — Auto-accept invitations
// ================================================================

function acceptPendingInvitations() {
  var now       = new Date();
  var oneYearOn = new Date(now.getTime() + 365 * 86400000);

  var page = Calendar.Events.list("primary", {
    timeMin:       now.toISOString(),
    timeMax:       oneYearOn.toISOString(),
    singleEvents:  true,
    maxResults:    250,
  });

  var count = 0;
  (page.items || []).forEach(function(event) {
    var me = (event.attendees || []).filter(function(a) { return a.self; })[0];
    if (me && me.responseStatus === "needsAction") {
      var updated = (event.attendees || []).map(function(a) {
        return a.self ? Object.assign({}, a, { responseStatus: "accepted" }) : a;
      });
      try {
        Calendar.Events.patch({ attendees: updated }, "primary", event.id);
        Logger.log("Accepted: " + event.summary);
        count++;
      } catch (e) {
        Logger.log("Could not accept '" + event.summary + "': " + e);
      }
    }
  });

  if (count > 0) Logger.log("Auto-accepted " + count + " invitation(s)");
}


// ================================================================
// PART 2 — Sync events to Firestore
// Uses Google Calendar's incremental sync (syncToken) so only
// changed events are processed after the first full run.
// ================================================================

function syncEventsToFirestore() {
  var props      = PropertiesService.getScriptProperties();
  var savedToken = props.getProperty(SYNC_TOKEN_KEY);
  var events     = [];
  var newToken   = null;

  if (savedToken) {
    // ── Incremental sync ──────────────────────────────────────
    try {
      var resp = Calendar.Events.list("primary", {
        syncToken:    savedToken,
        singleEvents: true,
        showDeleted:  true,
      });
      events   = resp.items || [];
      newToken = resp.nextSyncToken;
      Logger.log("Incremental sync: " + events.length + " change(s)");
    } catch (e) {
      // HTTP 410 means the sync token expired — fall back to full sync
      Logger.log("Sync token expired; running full sync");
      props.deleteProperty(SYNC_TOKEN_KEY);
      syncEventsToFirestore();
      return;
    }
  } else {
    // ── Full sync (first run or after token expiry) ───────────
    var now     = new Date();
    var timeMin = new Date(now.getTime() -  90 * 86400000).toISOString(); // 90 days back
    var timeMax = new Date(now.getTime() + 365 * 86400000).toISOString(); // 1 year forward
    var pageToken = null;

    do {
      var params = {
        timeMin:      timeMin,
        timeMax:      timeMax,
        singleEvents: true,
        showDeleted:  true,
        maxResults:   2500,
      };
      if (pageToken) params.pageToken = pageToken;

      var page2 = Calendar.Events.list("primary", params);
      events    = events.concat(page2.items || []);
      pageToken = page2.nextPageToken  || null;
      newToken  = page2.nextSyncToken  || newToken;
    } while (pageToken);

    Logger.log("Full sync: " + events.length + " event(s)");
  }

  if (newToken) props.setProperty(SYNC_TOKEN_KEY, newToken);
  if (events.length === 0) return;

  var token   = getFirestoreToken();
  var upserted = 0, removed = 0;

  events.forEach(function(ev) {
    if (ev.status === "cancelled") {
      firestoreDelete(token, ev.id);
      removed++;
    } else {
      firestoreUpsert(token, ev);
      upserted++;
    }
  });

  Logger.log("Sync complete — " + upserted + " upserted, " + removed + " removed");
}


// ================================================================
// Firestore helpers
// ================================================================

function firestoreUpsert(token, ev) {
  var isAllDay = !!(ev.start && ev.start.date);
  var startMs, endMs;

  if (isAllDay) {
    var sp = ev.start.date.split("-").map(Number);
    startMs = new Date(sp[0], sp[1]-1, sp[2], 0, 0, 0).getTime();
    var ep  = ev.end.date.split("-").map(Number);
    // Google's all-day end is exclusive (the next day at midnight).
    // Subtract 1 second to make the stored end time 23:59:59 of the real last day.
    endMs = new Date(ep[0], ep[1]-1, ep[2], 0, 0, 0).getTime() - 1000;
  } else {
    startMs = new Date(ev.start.dateTime).getTime();
    endMs   = new Date(ev.end.dateTime).getTime();
  }

  var fields = {
    title:         fStr(ev.summary || "(No title)"),
    description:   ev.description ? fStr(ev.description) : fNull(),
    startDate:     fTs(startMs),
    endDate:       fTs(endMs),
    allDay:        fBool(isAllDay),
    members:       fArr([]),
    colour:        fStr(EVENT_COLOUR),
    recurring:     fNull(),
    sourceType:    fStr("google_calendar"),
    googleEventId: fStr(ev.id),
    createdBy:     fStr("google_calendar_sync"),
    createdAt:     fTs(ev.created ? new Date(ev.created).getTime() : Date.now()),
  };

  var resp = UrlFetchApp.fetch(firestoreDocUrl(ev.id), {
    method:          "patch",
    contentType:     "application/json",
    headers:         { Authorization: "Bearer " + token },
    payload:         JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() >= 400) {
    Logger.log("Firestore error for '" + ev.summary + "': " + resp.getContentText());
  }
}

function firestoreDelete(token, docId) {
  UrlFetchApp.fetch(firestoreDocUrl(docId), {
    method:          "delete",
    headers:         { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  });
}

function firestoreDocUrl(docId) {
  return "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID
       + "/databases/(default)/documents/households/" + HOUSEHOLD_ID
       + "/calendarEvents/" + encodeURIComponent(docId);
}

// Firestore typed-value helpers
function fStr(v)  { return { stringValue:   String(v) }; }
function fBool(v) { return { booleanValue:  !!v }; }
function fNull()  { return { nullValue:     null }; }
function fTs(ms)  { return { timestampValue: new Date(ms).toISOString() }; }
function fArr(vs) { return { arrayValue:    { values: vs } }; }


// ================================================================
// Service-account JWT authentication
// Exchanges a signed JWT for a short-lived Google OAuth2 token
// that has permission to write to Firestore.
// ================================================================

function getFirestoreToken() {
  var now = Math.floor(Date.now() / 1000);

  var header  = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  var payload = b64url(JSON.stringify({
    iss:   SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  }));

  var unsigned  = header + "." + payload;
  var signature = b64url(Utilities.computeRsaSha256Signature(
    unsigned,
    PRIVATE_KEY.replace(/\\n/g, "\n")  // handle both literal \n and real newlines
  ));

  var jwt = unsigned + "." + signature;

  var resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method:      "post",
    contentType: "application/x-www-form-urlencoded",
    payload:     "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
    muteHttpExceptions: true,
  });

  var result = JSON.parse(resp.getContentText());
  if (!result.access_token) {
    throw new Error("Could not get Firestore token: " + resp.getContentText());
  }
  return result.access_token;
}

function b64url(data) {
  return Utilities.base64EncodeWebSafe(data).replace(/=+$/, "");
}
