/**
 * Clears all Firestore-related IndexedDB databases.
 * Call this when Firestore throws a persistent cache/schema error,
 * then reload the page so Firestore re-initialises from scratch.
 */
export async function clearFirestoreCache(): Promise<void> {
  if (typeof indexedDB === "undefined") return;

  const databases = await indexedDB.databases?.() ?? [];
  const firestoreDbs = databases
    .map((d) => d.name)
    .filter((name): name is string =>
      !!name && (name.startsWith("firestore/") || name.includes("firestore"))
    );

  await Promise.all(
    firestoreDbs.map(
      (name) =>
        new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve(); // best-effort
          req.onblocked = () => resolve();
        })
    )
  );
}
