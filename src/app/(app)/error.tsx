"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearFirestoreCache } from "@/lib/clearFirestoreCache";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  const isFirestoreError =
    error.message?.toLowerCase().includes("firestore") ||
    error.message?.toLowerCase().includes("indexeddb") ||
    error.message?.toLowerCase().includes("idb");

  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  async function handleClearAndReload() {
    setClearing(true);
    await clearFirestoreCache();
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-sm w-full text-center flex flex-col gap-4">
        <div className="text-5xl">😕</div>
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          {isFirestoreError
            ? "The local database ran into an issue. Clearing the cache usually fixes this."
            : "An unexpected error occurred in this section."}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="py-3 px-6 rounded-xl font-semibold text-white text-sm transition-opacity active:opacity-80"
            style={{ background: "#FF6B6B" }}
          >
            Try again
          </button>

          <button
            onClick={handleClearAndReload}
            disabled={clearing}
            className="py-3 px-6 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium transition-opacity disabled:opacity-60"
          >
            {clearing ? "Clearing cache…" : "Clear cache & reload"}
          </button>

          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 underline"
          >
            Go to home
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <details className="text-left text-xs text-gray-400 mt-2">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
