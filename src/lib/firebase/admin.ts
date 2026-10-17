// Server-only — Firebase Admin SDK, used by the /api/notify and
// /api/cron/* routes. Lazily initialized (same reasoning as the client
// config's lazy getters): importing this module must never throw just
// because FIREBASE_SERVICE_ACCOUNT_JSON isn't set yet, or it would break
// the build / every other route that happens to import from this file's
// neighbourhood. The error only surfaces when a route actually tries to
// use it without the env var configured.
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

let app: App | undefined;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set — add it in Vercel's project environment variables."
    );
  }

  const serviceAccount = JSON.parse(raw);
  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}
