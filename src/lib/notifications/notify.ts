import { auth } from "@/lib/firebase/config";

type NotifyPayload =
  | { type: "week_submitted"; listId: string; weekId: string }
  | { type: "week_approved"; listId: string; weekId: string }
  | { type: "week_redo"; listId: string; weekId: string }
  | { type: "job_done"; jobId: string }
  | { type: "job_approved"; jobId: string }
  | { type: "job_redo"; jobId: string }
  | { type: "job_added"; jobId: string };

// Fire-and-forget — a push notification failing to send must never surface
// as an error on the chore action itself (submit/approve/etc already
// succeeded in Firestore by the time this is called).
export function notify(payload: NotifyPayload) {
  (async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn("[notify] failed to send", err);
    }
  })();
}
