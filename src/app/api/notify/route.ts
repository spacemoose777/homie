// Event-driven Chores push notifications. The client calls this right after
// a relevant action succeeds (submit, approve, redo, job added/done) — there
// is no Cloud Function involved, so this stays on Firebase's free Spark plan.
//
// Every notification type is re-derived from the real Firestore document the
// client points at, never from text the client sent directly — so the
// worst a compromised client can do is trigger a notification about
// something that genuinely happened, to the people who'd see it anyway.

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore, getAdminMessaging } from "@/lib/firebase/admin";
import type { ChoreWeek, ChoreJob, MemberProfile, NotificationPrefs } from "@/types";

type NotifyBody =
  | { type: "week_submitted"; listId: string; weekId: string }
  | { type: "week_approved"; listId: string; weekId: string }
  | { type: "week_redo"; listId: string; weekId: string }
  | { type: "job_done"; jobId: string }
  | { type: "job_approved"; jobId: string }
  | { type: "job_redo"; jobId: string }
  | { type: "job_added"; jobId: string };

function prefEnabled(prefs: NotificationPrefs | undefined, key: keyof NotificationPrefs): boolean {
  return prefs?.[key] !== false;
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  let callerUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const db = getAdminFirestore();

  const userDoc = await db.collection("users").doc(callerUid).get();
  const householdId = userDoc.data()?.householdId as string | undefined;
  if (!householdId) return NextResponse.json({ error: "No household" }, { status: 403 });

  const callerDoc = await db.doc(`households/${householdId}/members/${callerUid}`).get();
  const callerRole = callerDoc.data()?.role as string | undefined;
  const isAdmin = callerRole === "admin";

  let body: NotifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  async function membersMap(): Promise<Map<string, MemberProfile>> {
    const snap = await db.collection(`households/${householdId}/members`).get();
    return new Map(snap.docs.map((d) => [d.id, d.data() as MemberProfile]));
  }

  async function sendToUid(uid: string, title: string, bodyText: string, url: string) {
    const tokensSnap = await db.collection(`users/${uid}/fcm_tokens`).get();
    if (tokensSnap.empty) return;
    const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);
    if (tokens.length === 0) return;

    const messaging = getAdminMessaging();
    const result = await messaging.sendEach(
      tokens.map((token) => ({
        token,
        webpush: {
          notification: {
            title,
            body: bodyText,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            data: { url },
          },
          fcm_options: { link: url },
        },
      }))
    );

    const batch = db.batch();
    result.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          batch.delete(tokensSnap.docs[i].ref);
        }
      }
    });
    await batch.commit();
  }

  try {
    switch (body.type) {
      case "week_submitted": {
        const weekRef = db.doc(
          `households/${householdId}/choreLists/${body.listId}/weeks/${body.weekId}`
        );
        const week = (await weekRef.get()).data() as ChoreWeek | undefined;
        if (!week || week.assigneeUid !== callerUid || week.status !== "submitted") break;

        const listDoc = await db.doc(`households/${householdId}/choreLists/${body.listId}`).get();
        const members = await membersMap();
        const assigneeName = members.get(callerUid)?.name ?? "Someone";
        const listName = (listDoc.data()?.name as string) ?? "their checklist";

        for (const [uid, m] of members) {
          if (m.role === "admin" && prefEnabled(m.notificationPrefs, "choreSubmitted")) {
            await sendToUid(uid, "Chores", `${assigneeName} submitted ${listName}`, "/chores/manage");
          }
        }
        break;
      }

      case "job_done": {
        const jobRef = db.doc(`households/${householdId}/choreJobs/${body.jobId}`);
        const job = (await jobRef.get()).data() as ChoreJob | undefined;
        if (!job || job.assigneeUid !== callerUid || job.status !== "done") break;

        const members = await membersMap();
        const assigneeName = members.get(callerUid)?.name ?? "Someone";

        for (const [uid, m] of members) {
          if (m.role === "admin" && prefEnabled(m.notificationPrefs, "choreJobDone")) {
            await sendToUid(uid, "Chores", `${assigneeName} marked "${job.title}" done`, "/chores/manage");
          }
        }
        break;
      }

      case "week_approved": {
        if (!isAdmin) break;
        const weekRef = db.doc(
          `households/${householdId}/choreLists/${body.listId}/weeks/${body.weekId}`
        );
        const week = (await weekRef.get()).data() as ChoreWeek | undefined;
        if (!week || week.status !== "approved" || week.awardedAmount === null) break;

        const listDoc = await db.doc(`households/${householdId}/choreLists/${body.listId}`).get();
        const listName = (listDoc.data()?.name as string) ?? "Your checklist";
        const members = await membersMap();
        if (!prefEnabled(members.get(week.assigneeUid)?.notificationPrefs, "choreApproved")) break;

        await sendToUid(
          week.assigneeUid,
          "Chores approved! 🎉",
          `${listName} — ${dollars(week.awardedAmount)}${week.parentNote ? ` · ${week.parentNote}` : ""}`,
          "/chores"
        );
        break;
      }

      case "job_approved": {
        if (!isAdmin) break;
        const jobRef = db.doc(`households/${householdId}/choreJobs/${body.jobId}`);
        const job = (await jobRef.get()).data() as ChoreJob | undefined;
        if (!job || job.status !== "approved" || job.awardedAmount === null) break;

        const members = await membersMap();
        if (!prefEnabled(members.get(job.assigneeUid)?.notificationPrefs, "choreApproved")) break;

        await sendToUid(
          job.assigneeUid,
          "Job approved! 🎉",
          `"${job.title}" — ${dollars(job.awardedAmount)}${job.parentNote ? ` · ${job.parentNote}` : ""}`,
          "/chores"
        );
        break;
      }

      case "week_redo": {
        if (!isAdmin) break;
        const weekRef = db.doc(
          `households/${householdId}/choreLists/${body.listId}/weeks/${body.weekId}`
        );
        const week = (await weekRef.get()).data() as ChoreWeek | undefined;
        if (!week || week.status !== "redo") break;

        const listDoc = await db.doc(`households/${householdId}/choreLists/${body.listId}`).get();
        const listName = (listDoc.data()?.name as string) ?? "Your checklist";
        const members = await membersMap();
        if (!prefEnabled(members.get(week.assigneeUid)?.notificationPrefs, "choreRedo")) break;

        await sendToUid(week.assigneeUid, "Something to redo", `${listName} was sent back — check the note`, "/chores");
        break;
      }

      case "job_redo": {
        if (!isAdmin) break;
        const jobRef = db.doc(`households/${householdId}/choreJobs/${body.jobId}`);
        const job = (await jobRef.get()).data() as ChoreJob | undefined;
        if (!job) break;

        const members = await membersMap();
        if (!prefEnabled(members.get(job.assigneeUid)?.notificationPrefs, "choreRedo")) break;

        await sendToUid(job.assigneeUid, "Something to redo", `"${job.title}" was sent back`, "/chores");
        break;
      }

      case "job_added": {
        if (!isAdmin) break;
        const jobRef = db.doc(`households/${householdId}/choreJobs/${body.jobId}`);
        const job = (await jobRef.get()).data() as ChoreJob | undefined;
        if (!job) break;

        const members = await membersMap();
        if (!prefEnabled(members.get(job.assigneeUid)?.notificationPrefs, "choreJobAdded")) break;

        await sendToUid(job.assigneeUid, "New paid job", `"${job.title}" — ${dollars(job.amount)}`, "/chores");
        break;
      }
    }
  } catch (err) {
    console.error("[notify] failed:", err);
    // Never fail loudly — a notification not going out should never look
    // like the underlying chore action itself failed.
  }

  return NextResponse.json({ ok: true });
}
