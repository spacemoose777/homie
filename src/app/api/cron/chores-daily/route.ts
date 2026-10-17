// Runs once a day (Vercel Cron, free on the Hobby plan — see vercel.json)
// and covers two of the brief's reminder types with a single daily call,
// since Hobby limits a cron to once/day:
//   - Monday (NZ time): "a new week has started", to every assignee
//   - Saturday (NZ time): "you haven't submitted this week yet", to anyone
//     whose current week is still in_progress (or never even started)
//
// The schedule is a fixed UTC time (see vercel.json) chosen to land in NZ
// morning — it can drift an hour across the DST changeover since cron
// expressions aren't timezone-aware, which is an accepted tradeoff for a
// once-a-day reminder.

import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore, getAdminMessaging } from "@/lib/firebase/admin";
import type { ChoreList, ChoreWeek, MemberProfile, NotificationPrefs } from "@/types";
import { getCurrentWeekBounds } from "@/lib/chores/week";

function prefEnabled(prefs: NotificationPrefs | undefined, key: keyof NotificationPrefs): boolean {
  return prefs?.[key] !== false;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nzWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Auckland",
    weekday: "long",
  }).format(new Date());

  if (nzWeekday !== "Monday" && nzWeekday !== "Saturday") {
    return NextResponse.json({ ok: true, skipped: nzWeekday });
  }

  const db = getAdminFirestore();
  const messaging = getAdminMessaging();
  const { weekStart } = getCurrentWeekBounds();

  const listsSnap = await db.collectionGroup("choreLists").where("active", "==", true).get();

  let sent = 0;
  for (const listDoc of listsSnap.docs) {
    const list = listDoc.data() as ChoreList;
    const householdId = listDoc.ref.parent.parent?.id;
    if (!householdId) continue;

    const memberDoc = await db.doc(`households/${householdId}/members/${list.assigneeUid}`).get();
    const member = memberDoc.data() as MemberProfile | undefined;
    if (!member) continue;

    let title: string;
    let body: string;

    if (nzWeekday === "Monday") {
      if (!prefEnabled(member.notificationPrefs, "choreWeekStarted")) continue;
      title = "New week!";
      body = `${list.name} has started`;
    } else {
      if (!prefEnabled(member.notificationPrefs, "choreReminder")) continue;
      const weekDoc = await db.doc(`households/${householdId}/choreLists/${listDoc.id}/weeks/${weekStart}`).get();
      const week = weekDoc.data() as ChoreWeek | undefined;
      if (week && week.status !== "in_progress" && week.status !== "redo") continue; // already submitted/approved
      title = "Don't forget";
      body = `${list.name} isn't submitted yet this week`;
    }

    const tokensSnap = await db.collection(`users/${list.assigneeUid}/fcm_tokens`).get();
    if (tokensSnap.empty) continue;
    const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);
    if (tokens.length === 0) continue;

    const result = await messaging.sendEach(
      tokens.map((token) => ({
        token,
        webpush: {
          notification: { title, body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" },
          fcm_options: { link: "/chores" },
        },
      }))
    );
    sent += result.successCount;

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

  return NextResponse.json({ ok: true, day: nzWeekday, sent });
}
