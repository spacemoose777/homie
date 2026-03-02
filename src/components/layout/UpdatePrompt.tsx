"use client";

import { useEffect, useState } from "react";

export default function UpdatePrompt() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (sessionStorage.getItem("sw-just-updated")) {
      sessionStorage.removeItem("sw-just-updated");
      setShowConfirmation(true);
      requestAnimationFrame(() => setConfirmationVisible(true));
      const fadeOut = setTimeout(() => setConfirmationVisible(false), 2500);
      const unmount = setTimeout(() => setShowConfirmation(false), 3000);
      return () => {
        clearTimeout(fadeOut);
        clearTimeout(unmount);
      };
    }

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      if (reg.waiting) setWaitingSW(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingSW(newSW);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  function applyUpdate() {
    if (!waitingSW) return;
    setWaitingSW(null);
    sessionStorage.setItem("sw-just-updated", "1");
    waitingSW.postMessage("SKIP_WAITING");
  }

  if (showConfirmation) {
    return (
      <div
        style={{ transition: "opacity 0.5s ease" }}
        className={`fixed top-4 left-4 right-4 z-[9999] flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 shadow-lg ${
          confirmationVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-green-600">Update complete</span>
      </div>
    );
  }

  if (!waitingSW) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-white px-4 py-3 shadow-lg">
      <span className="text-sm text-gray-600">Update available</span>
      <button
        onClick={applyUpdate}
        className="rounded-xl bg-coral px-3 py-1.5 text-sm font-medium text-white"
        style={{ backgroundColor: "#FF6B6B" }}
      >
        Refresh
      </button>
    </div>
  );
}
