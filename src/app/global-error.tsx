"use client";

import { useEffect, useState } from "react";
import { clearFirestoreCache } from "@/lib/clearFirestoreCache";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const isFirestoreError =
    error.message?.toLowerCase().includes("firestore") ||
    error.message?.toLowerCase().includes("indexeddb") ||
    error.message?.toLowerCase().includes("idb");

  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  async function handleClearAndReload() {
    setClearing(true);
    await clearFirestoreCache();
    setCleared(true);
    window.location.reload();
  }

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>😕</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {isFirestoreError
              ? "The local database ran into an issue. Clearing the cache usually fixes this."
              : "An unexpected error occurred. Try refreshing the page."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: "#FF6B6B",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>

            <button
              onClick={handleClearAndReload}
              disabled={clearing || cleared}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#555",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: clearing ? "not-allowed" : "pointer",
                opacity: clearing ? 0.7 : 1,
              }}
            >
              {clearing ? "Clearing cache…" : "Clear cache & reload"}
            </button>
          </div>

          {process.env.NODE_ENV !== "production" && (
            <details style={{ textAlign: "left", fontSize: "0.75rem", color: "#999" }}>
              <summary style={{ cursor: "pointer" }}>Error details</summary>
              <pre style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
