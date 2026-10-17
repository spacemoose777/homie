import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getFCMToken } from "@/lib/firebase/messaging";

// Called from the Settings > Notifications toggle, not on page load — the
// browser's permission prompt should only ever appear because someone just
// asked for notifications, never as a surprise on first visit.
export async function registerFCMToken(userId: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  if (Notification.permission === "default") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return false;
  }
  if (Notification.permission !== "granted") return false;

  const token = await getFCMToken();
  if (!token) return false;

  await setDoc(doc(db, "users", userId, "fcm_tokens", token), {
    token,
    updatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
  });
  return true;
}

export async function unregisterFCMToken(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const token = await getFCMToken();
    if (!token) return;
    await deleteDoc(doc(db, "users", userId, "fcm_tokens", token));
  } catch {
    // Token may already be gone
  }
}
