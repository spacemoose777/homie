// One-off verification that firestore.rules actually enforces the Chores
// permission model (child can tick/submit his own week; only a parent can
// approve, adjust amounts, edit the checklist, or touch the money ledger).
//
// Run against the Firestore emulator — never against the live database:
//   firebase emulators:start --only firestore --project demo-chores-test
//   node scripts/test-chores-rules.mjs
//
// Not part of the Next.js build and not run in CI — a manual check to run
// before deploying rules changes.

import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";

const HID = "test-household";
const PARENT_UID = "parent-1";
const CHILD_UID = "sam";
const OTHER_HOUSEHOLD_UID = "outsider";

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${label}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${label}`);
    console.log(`        ${err.message}`);
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: "demo-chores-test",
  firestore: {
    rules: readFileSync("firestore.rules", "utf8"),
    host: "127.0.0.1",
    port: 8080,
  },
});

// Seed baseline data, bypassing rules entirely (this is just test setup).
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "users", PARENT_UID), { householdId: HID });
  await setDoc(doc(db, "users", CHILD_UID), { householdId: HID });
  await setDoc(doc(db, "households", HID), {
    name: "Test Household",
    createdBy: PARENT_UID,
    createdAt: Timestamp.now(),
  });
  await setDoc(doc(db, "households", HID, "members", PARENT_UID), {
    uid: PARENT_UID,
    name: "Parent",
    email: "parent@example.com",
    role: "admin",
    theme: "petal",
    colour: "#FF6B6B",
    viewMode: "detailed",
    createdAt: Timestamp.now(),
  });
  await setDoc(doc(db, "households", HID, "members", CHILD_UID), {
    uid: CHILD_UID,
    name: "Sam",
    email: "sam@example.com",
    role: "child",
    theme: "petal",
    colour: "#6366f1",
    viewMode: "simple",
    createdAt: Timestamp.now(),
  });
  await setDoc(doc(db, "households", HID, "choreLists", "weekly-clean"), {
    id: "weekly-clean",
    name: "Sam's Weekly Clean",
    frequency: "weekly",
    assigneeUid: CHILD_UID,
    amount: 2000,
    rooms: [{ id: "r1", name: "Kitchen", sortOrder: 0, tasks: [{ id: "t1", label: "Wipe benches", sortOrder: 0 }] }],
    active: true,
    createdBy: PARENT_UID,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
});

const parentCtx = testEnv.authenticatedContext(PARENT_UID);
const samCtx = testEnv.authenticatedContext(CHILD_UID);
const outsiderCtx = testEnv.authenticatedContext(OTHER_HOUSEHOLD_UID);

const parentDb = parentCtx.firestore();
const samDb = samCtx.firestore();
const outsiderDb = outsiderCtx.firestore();

const weekBase = {
  listId: "weekly-clean",
  assigneeUid: CHILD_UID,
  weekStart: "2026-10-12",
  weekEnd: "2026-10-18",
  rooms: [{ id: "r1", name: "Kitchen", sortOrder: 0, tasks: [{ id: "t1", label: "Wipe benches", sortOrder: 0, done: false, doneAt: null }] }],
  amount: 2000,
  status: "in_progress",
  awardedAmount: null,
  submittedAt: null,
  approvedAt: null,
  approvedBy: null,
  parentNote: null,
  redoNotes: [],
  createdAt: Timestamp.now(),
};

console.log("\n=== choreLists ===");

await check("parent CAN create a checklist", () =>
  assertSucceeds(setDoc(doc(parentDb, "households", HID, "choreLists", "second"), {
    id: "second", name: "Second list", frequency: "weekly", assigneeUid: CHILD_UID,
    amount: 1000, rooms: [], active: true, createdBy: PARENT_UID,
    createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  }))
);

await check("Sam CANNOT create a checklist", () =>
  assertFails(setDoc(doc(samDb, "households", HID, "choreLists", "sams-own"), {
    id: "sams-own", name: "Sneaky list", frequency: "weekly", assigneeUid: CHILD_UID,
    amount: 999999, rooms: [], active: true, createdBy: CHILD_UID,
    createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
  }))
);

await check("Sam CANNOT edit the checklist amount", () =>
  assertFails(updateDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean"), {
    amount: 999999,
  }))
);

await check("outsider (different household) CANNOT read the checklist", () =>
  assertFails(getDoc(doc(outsiderDb, "households", HID, "choreLists", "weekly-clean")))
);

console.log("\n=== choreWeeks ===");

await check("Sam CAN create his own week, in_progress", () =>
  assertSucceeds(setDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), weekBase))
);

await check("Sam CANNOT create a week that's already approved", () =>
  assertFails(setDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-19"), {
    ...weekBase, weekStart: "2026-10-19", status: "approved", approvedBy: CHILD_UID,
  }))
);

await check("Sam CAN tick a task (rewrite rooms)", () =>
  assertSucceeds(updateDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), {
    rooms: [{ id: "r1", name: "Kitchen", sortOrder: 0, tasks: [{ id: "t1", label: "Wipe benches", sortOrder: 0, done: true, doneAt: Timestamp.now() }] }],
  }))
);

await check("Sam CAN submit his week", () =>
  assertSucceeds(updateDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), {
    status: "submitted",
    submittedAt: Timestamp.now(),
  }))
);

await check("Sam CANNOT approve his own week", () =>
  assertFails(updateDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), {
    status: "approved",
    approvedBy: CHILD_UID,
    approvedAt: Timestamp.now(),
    awardedAmount: 2000,
  }))
);

await check("Sam CANNOT set awardedAmount directly (even alongside an allowed field)", () =>
  assertFails(updateDoc(doc(samDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), {
    status: "submitted",
    awardedAmount: 999999,
  }))
);

await check("parent CAN approve and adjust the awarded amount", () =>
  assertSucceeds(updateDoc(doc(parentDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12"), {
    status: "approved",
    approvedBy: PARENT_UID,
    approvedAt: Timestamp.now(),
    awardedAmount: 1500,
    parentNote: "Missed the mirror, 75%",
  }))
);

await check("outsider (different household) CANNOT read Sam's week", () =>
  assertFails(getDoc(doc(outsiderDb, "households", HID, "choreLists", "weekly-clean", "weeks", "2026-10-12")))
);

console.log("\n=== choreJobs ===");

await check("parent CAN create a job", () =>
  assertSucceeds(setDoc(doc(parentDb, "households", HID, "choreJobs", "job-1"), {
    title: "Wash the car", notes: null, amount: 1000, dueDate: null, assigneeUid: CHILD_UID,
    status: "open", doneAt: null, approvedAt: null, approvedBy: null, awardedAmount: null,
    parentNote: null, createdBy: PARENT_UID, createdAt: Timestamp.now(),
  }))
);

await check("Sam CANNOT create a job", () =>
  assertFails(setDoc(doc(samDb, "households", HID, "choreJobs", "job-sneaky"), {
    title: "Pay me", notes: null, amount: 999999, dueDate: null, assigneeUid: CHILD_UID,
    status: "open", doneAt: null, approvedAt: null, approvedBy: null, awardedAmount: null,
    parentNote: null, createdBy: CHILD_UID, createdAt: Timestamp.now(),
  }))
);

await check("Sam CAN mark his own job done", () =>
  assertSucceeds(updateDoc(doc(samDb, "households", HID, "choreJobs", "job-1"), {
    status: "done", doneAt: Timestamp.now(),
  }))
);

await check("Sam CANNOT approve his own job", () =>
  assertFails(updateDoc(doc(samDb, "households", HID, "choreJobs", "job-1"), {
    status: "approved", approvedBy: CHILD_UID, approvedAt: Timestamp.now(), awardedAmount: 1000,
  }))
);

await check("parent CAN approve a job", () =>
  assertSucceeds(updateDoc(doc(parentDb, "households", HID, "choreJobs", "job-1"), {
    status: "approved", approvedBy: PARENT_UID, approvedAt: Timestamp.now(), awardedAmount: 1000,
  }))
);

console.log("\n=== ledger ===");

await check("Sam CANNOT create a ledger entry for himself", () =>
  assertFails(setDoc(doc(samDb, "households", HID, "ledger", "fake-entry"), {
    memberUid: CHILD_UID, type: "chore_week", amount: 999999, sourceId: null,
    note: null, createdBy: CHILD_UID, createdAt: Timestamp.now(),
  }))
);

await check("parent CAN create a ledger entry (e.g. recording a payout)", () =>
  assertSucceeds(setDoc(doc(parentDb, "households", HID, "ledger", "payout-1"), {
    memberUid: CHILD_UID, type: "payout", amount: -1000, sourceId: null,
    note: "Paid $10 cash", createdBy: PARENT_UID, createdAt: Timestamp.now(),
  }))
);

await check("Sam CAN read his own ledger entry", () =>
  assertSucceeds(getDoc(doc(samDb, "households", HID, "ledger", "payout-1")))
);

await check("Sam CANNOT update a ledger entry", () =>
  assertFails(updateDoc(doc(samDb, "households", HID, "ledger", "payout-1"), { amount: 0 }))
);

await check("outsider (different household) CANNOT read Sam's ledger entry", () =>
  assertFails(getDoc(doc(outsiderDb, "households", HID, "ledger", "payout-1")))
);

console.log("\n=== fcm_tokens ===");

await check("Sam CAN write his own fcm token", () =>
  assertSucceeds(setDoc(doc(samDb, "users", CHILD_UID, "fcm_tokens", "token-abc"), {
    token: "token-abc", updatedAt: new Date().toISOString(), userAgent: "test",
  }))
);

await check("parent CANNOT read Sam's fcm tokens", () =>
  assertFails(getDoc(doc(parentDb, "users", CHILD_UID, "fcm_tokens", "token-abc")))
);

console.log(`\n${passed} passed, ${failed} failed`);
await testEnv.cleanup();
process.exit(failed > 0 ? 1 : 0);
