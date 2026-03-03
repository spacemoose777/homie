// ================================================================
// HOMIE CALENDAR SYNC  —  Google Apps Script
// ================================================================

var HOUSEHOLD_ID = "uTHYPaP5RxxHdsNopfMT";

var SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@homie-8d36f.iam.gserviceaccount.com";

var PRIVATE_KEY = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDToKH0CQOjMmeo\nQz+LJgUIuu/PlpqR02SGdYG/eZfsCmAiC8IflWDgmeFNWIOUqO50/oPwsfE6tOqV\nUxLmsaB5RFvyxmGxcoMyryPaduH/cPiYb0PEQZTkTITRfvdYxU0eLowQCxIWsDaH\nV0r2psMcHH8ID5nZWOfUeV7JNjtH0D2FegvQiofwCjD1uous1z1+eBqEAl7m8Rxm\nasOBDCL65zc3ev9ZNtzw2j6kBlmd5BNry8m+hC6vWYqXvojdh04BBtN4sMGHhJ2C\n1eqBmVO0P4IkHtA9l9iT1gIgzkkq/9Lq96WhV5Kbhe5eDeLccbZLyO3Yz0IAfZNm\nbSGWrazJAgMBAAECggEABo/5XbAm3vlp6feV4Zp+9veXBqSoq+N2f03nBVk/qwfi\nVcPwE9sluylCaYvYXrSDWnjm/gCClruz94fxMtqou4HxaPyaXG6M33Y7YiOkG+/0\noYN3wj73X0H5L2bkxCmwG8K9QKUbPT1fH4DHOBFRRQ6kKMuVDX6ah8XwuMQYAADI\nYeuvd9iAMWKIRcNBSYDKp+Lt6pkd1Lwg+BF9wO3plc1OJMsZBPeo6PUJt3amgpSq\nLESm0WDqCla+USjqDGBTiYR+VdqZ+8sC62EwIm0wQmUd/gglo4mqTAZWVIOIipKt\naT2utfVb8/ds4qjR9n9mRPqsaNbiqvgpvaoXqH/MAQKBgQD6sPVMeKwTyOcejgYR\nK1XQXI07GEf5xgOZp83EPKX3ld0Dm+rSi/IPJdtOL8Bm8z3B3VwCuVo8JnR5sEc6\nOcffxpOyFyroreBfzYUr4FcYHvU2mTI/msp8CivJL4RmrZS9tOsEGuzsNDy/gv7s\nDTNmrLBtMpmtaY5RmkpGAx0myQKBgQDYG+ccjmLHbsDcAy2viabx6aFU8joi40Vp\nRikg2Q2EZWZq5UGH9qiOGdvd15W4kN32/kmZGcsidykRzFJ3cssP5btcSmJQF8a6\nzxgOkvvK9OJysz9+cRG4aHSL6Wa5gVPH2FkpvhYCmmGrzldZZy3WpM2QrVo0dlR6\nWP1/s8FWAQKBgQD41/tGo2o8YWp5/AStulR+dcCDboDTwOkF93nbV1BvyUUQNg8M\nXHo06yEcJW5ZQw6Eh9Szp4WYu5tWx9KMS5rJ2HX3i+O+AAr/TiTo/tG1UdWbEsq8\nNEzWf8oi9JX6zkcdYJ8A/jE77kZ22/NsIVZqjvS6EEZXyrXI7tzXTnP7cQKBgHtk\nkzVu51/QETaOaguMoVIHgCKsnB1Hf154vQsQY/NwomXuuNgVMnDQuwWUDtzveo2I\n7CUK4T2wpDaRX5Tsap2NIsmzfycULFiF3sqTikl8QcAUMPDVRrTwj3tDrW/GNDwr\nf92ht5eM5q/ehWl6zGV+fBFbqeHCnsGtBjFgRcgBAoGAeOaEZUx4YtfTE688uHpO\nXujPs/JDKKEqNXx523TmeyaPNQjvu/BHL0v04OjMhMzVWA3CcM0vOdNoV6HY2HSW\nASO7MrVYk3YHeOgL33DcYkGkYTHlnK2MLQpiTTsUKvn7Pk8jJE42SzRKru/V2/lO\noNQu9DncIYNIVTHqwHhsYRs=';

var PROJECT_ID     = "homie-8d36f";
var SYNC_TOKEN_KEY = "homie_gcal_sync_token";
var EVENT_COLOUR   = "#4D96FF";


// ================================================================
// MAIN — attach a time-based trigger to this function
// ================================================================

function syncCalendar() {
  try {
    acceptPendingInvitations();
    syncEventsToFirestore();
  } catch (e) {
    Logger.log("ERROR: " + e.toString());
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
    timeMin:      now.toISOString(),
    timeMax:      oneYearOn.toISOString(),
    singleEvents: true,
    maxResults:   250,
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
// ================================================================

function syncEventsToFirestore() {
  var props      = PropertiesService.getScriptProperties();
  var savedToken = props.getProperty(SYNC_TOKEN_KEY);
  var events     = [];
  var newToken   = null;

  if (savedToken) {
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
      Logger.log("Sync token expired; running full sync");
      props.deleteProperty(SYNC_TOKEN_KEY);
      syncEventsToFirestore();
      return;
    }
  } else {
    var now2      = new Date();
    var timeMin   = new Date(now2.getTime() -  90 * 86400000).toISOString();
    var timeMax   = new Date(now2.getTime() + 365 * 86400000).toISOString();
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
      pageToken = page2.nextPageToken || null;
      newToken  = page2.nextSyncToken || newToken;
    } while (pageToken);

    Logger.log("Full sync: " + events.length + " event(s)");
  }

  if (newToken) props.setProperty(SYNC_TOKEN_KEY, newToken);
  if (events.length === 0) return;

  var token    = getFirestoreToken();
  var upserted = 0;
  var removed  = 0;

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
    var sp  = ev.start.date.split("-").map(Number);
    startMs = new Date(sp[0], sp[1] - 1, sp[2], 0, 0, 0).getTime();
    var ep  = ev.end.date.split("-").map(Number);
    endMs   = new Date(ep[0], ep[1] - 1, ep[2], 0, 0, 0).getTime() - 1000;
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
    method:             "patch",
    contentType:        "application/json",
    headers:            { Authorization: "Bearer " + token },
    payload:            JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });

  if (resp.getResponseCode() >= 400) {
    Logger.log("Firestore error for '" + ev.summary + "': " + resp.getContentText());
  }
}

function firestoreDelete(token, docId) {
  UrlFetchApp.fetch(firestoreDocUrl(docId), {
    method:             "delete",
    headers:            { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  });
}

function firestoreDocUrl(docId) {
  return "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID
       + "/databases/(default)/documents/households/" + HOUSEHOLD_ID
       + "/calendarEvents/" + encodeURIComponent(docId);
}

function fStr(v)  { return { stringValue:   String(v) }; }
function fBool(v) { return { booleanValue:  !!v }; }
function fNull()  { return { nullValue:     null }; }
function fTs(ms)  { return { timestampValue: new Date(ms).toISOString() }; }
function fArr(vs) { return { arrayValue:    { values: vs } }; }


// ================================================================
// Service-account JWT authentication
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
  var key       = "-----BEGIN PRIVATE KEY-----\n" + PRIVATE_KEY + "\n-----END PRIVATE KEY-----";
  var signature = b64url(Utilities.computeRsaSha256Signature(unsigned, key));
  var jwt       = unsigned + "." + signature;

  var resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method:             "post",
    contentType:        "application/x-www-form-urlencoded",
    payload:            "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
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
