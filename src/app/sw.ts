/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // skipWaiting intentionally omitted — the UpdatePrompt UI handles activation
  // via the SKIP_WAITING message below. Having skipWaiting:true caused the SW
  // to activate silently and trigger window.location.reload() mid-session.
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Allow the UpdatePrompt UI to trigger activation
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Push notifications (Chores) ──

// Tapping a notification focuses an existing Homie tab (navigating it to the
// relevant page) or opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) || "/chores";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          (client as WindowClient).navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// When the API route sends webpush.notification, Chrome displays it natively
// even with the app fully closed, and event.data here carries no
// notification object to re-show — only a data-only message needs this.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: Record<string, unknown> = {};
  try {
    payload = event.data.json() as Record<string, unknown>;
  } catch {
    event.waitUntil(
      self.registration.showNotification("Homie", { body: event.data.text(), icon: "/icons/icon-192.png" })
    );
    return;
  }

  if (payload.notification) return; // already shown natively

  const title = (payload.title as string) || "Homie";
  const body = (payload.body as string) || "";
  const url = (payload.url as string) || "/chores";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: (payload.tag as string) || "chores",
      data: { url },
    } as NotificationOptions)
  );
});
