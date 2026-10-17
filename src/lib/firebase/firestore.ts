import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type {
  MemberProfile,
  UserDoc,
  Household,
  Invite,
  ShoppingItem,
  ItemMemory,
  Meal,
  WeekPlan,
  DayPlan,
  CalendarEvent,
  Store,
  CustomList,
  CustomListItem,
  Attachment,
  Meeting,
  WhanauTask,
  ChoreList,
  ChoreRoomDef,
  ChoreRoomProgress,
  ChoreWeek,
  ChoreRedoNote,
  ChoreJob,
  LedgerEntry,
  ThemeKey,
  ViewMode,
  UserRole,
} from "@/types";

// ── User Document ──

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function createUserDoc(uid: string, householdId: string) {
  await setDoc(doc(db, "users", uid), { householdId } satisfies UserDoc);
}

// ── Household ──

export async function createHousehold(
  uid: string,
  email: string,
  displayName: string
) {
  const householdRef = doc(collection(db, "households"));
  const hid = householdRef.id;

  const household: Household = {
    name: `${displayName}'s Home`,
    createdBy: uid,
    createdAt: Timestamp.now(),
  };
  await setDoc(householdRef, household);

  const memberProfile: MemberProfile = {
    uid,
    name: displayName,
    email,
    role: "admin",
    theme: "petal",
    colour: "#FF6B6B",
    viewMode: "detailed",
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, "households", hid, "members", uid), memberProfile);
  await createUserDoc(uid, hid);

  return hid;
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, "households", householdId));
  return snap.exists() ? (snap.data() as Household) : null;
}

export async function updateHouseholdCalendarEmail(householdId: string, email: string) {
  await updateDoc(doc(db, "households", householdId), { calendarEmail: email });
}

export function subscribeToHousehold(
  householdId: string,
  callback: (household: import("@/types").Household) => void
) {
  return onSnapshot(doc(db, "households", householdId), (snap) => {
    if (snap.exists()) callback(snap.data() as import("@/types").Household);
  });
}

export async function updateHouseholdMealSlots(householdId: string, mealSlots: string[]) {
  await updateDoc(doc(db, "households", householdId), { mealSlots });
}

// ── Member Profile ──

export async function getMemberProfile(
  householdId: string,
  uid: string
): Promise<MemberProfile | null> {
  const snap = await getDoc(doc(db, "households", householdId, "members", uid));
  return snap.exists() ? (snap.data() as MemberProfile) : null;
}

export async function updateMemberName(householdId: string, uid: string, name: string) {
  await updateDoc(doc(db, "households", householdId, "members", uid), { name });
}

export async function updateMemberColour(householdId: string, uid: string, colour: string) {
  await updateDoc(doc(db, "households", householdId, "members", uid), { colour });
}

export async function updateMemberTheme(householdId: string, uid: string, theme: ThemeKey) {
  await updateDoc(doc(db, "households", householdId, "members", uid), { theme });
}

export async function updateMemberViewMode(householdId: string, uid: string, viewMode: ViewMode) {
  await updateDoc(doc(db, "households", householdId, "members", uid), { viewMode });
}

export async function updateMemberTextSize(householdId: string, uid: string, textSize: "sm" | "md" | "lg") {
  await updateDoc(doc(db, "households", householdId, "members", uid), { textSize });
}

// ── Household Members ──

export async function getHouseholdMembers(householdId: string): Promise<MemberProfile[]> {
  const snap = await getDocs(collection(db, "households", householdId, "members"));
  return snap.docs.map((d) => d.data() as MemberProfile);
}

export async function removeMember(householdId: string, uid: string) {
  await deleteDoc(doc(db, "households", householdId, "members", uid));
  await deleteDoc(doc(db, "users", uid));
}

export async function joinHousehold(
  householdId: string,
  uid: string,
  email: string,
  name: string,
  role: UserRole,
  colour?: string
) {
  const memberProfile: MemberProfile = {
    uid,
    name,
    email,
    role,
    theme: "petal",
    colour: colour ?? "#FF6B6B",
    viewMode: role === "child" ? "simple" : "detailed",
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, "households", householdId, "members", uid), memberProfile);
  await createUserDoc(uid, householdId);
  return memberProfile;
}

// ── Invites ──

export async function createInvite(
  householdId: string,
  email: string,
  role: UserRole,
  createdBy: string
): Promise<string> {
  const inviteRef = doc(collection(db, "households", householdId, "invites"));
  const token = inviteRef.id;

  const invite: Invite = {
    email,
    role,
    expiry: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    used: false,
    createdBy,
    createdAt: Timestamp.now(),
  };
  await setDoc(inviteRef, invite);
  return token;
}

export async function getInvite(householdId: string, token: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, "households", householdId, "invites", token));
  return snap.exists() ? (snap.data() as Invite) : null;
}

export async function findInviteByToken(
  token: string
): Promise<{ householdId: string; invite: Invite } | null> {
  const snap = await getDocs(query(collectionGroup(db, "invites")));
  for (const inviteDoc of snap.docs) {
    if (inviteDoc.id === token) {
      const pathParts = inviteDoc.ref.path.split("/");
      const householdId = pathParts[1];
      return { householdId, invite: inviteDoc.data() as Invite };
    }
  }
  return null;
}

export async function markInviteUsed(householdId: string, token: string) {
  await updateDoc(doc(db, "households", householdId, "invites", token), { used: true });
}

export async function getHouseholdInvites(
  householdId: string
): Promise<Array<Invite & { token: string }>> {
  const snap = await getDocs(collection(db, "households", householdId, "invites"));
  return snap.docs.map((d) => ({ ...(d.data() as Invite), token: d.id }));
}

// ── Shopping Items ──

export function subscribeToShoppingItems(
  householdId: string,
  callback: (items: ShoppingItem[]) => void
) {
  const ref = collection(db, "households", householdId, "shoppingItems");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items: ShoppingItem[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<ShoppingItem, "id">),
      id: d.id,
    }));
    callback(items);
  });
}

export async function addShoppingItem(
  householdId: string,
  item: Omit<ShoppingItem, "id" | "createdAt">
) {
  const ref = collection(db, "households", householdId, "shoppingItems");
  const docRef = await addDoc(ref, { ...item, createdAt: Timestamp.now() });

  if (item.brand || item.section) {
    await saveItemMemory(householdId, item.name, {
      name: item.name,
      brand: item.brand,
      brandBackup: item.brandBackup,
      section: item.section,
    });
  }
  return docRef.id;
}

export async function updateShoppingItem(
  householdId: string,
  itemId: string,
  updates: Partial<Omit<ShoppingItem, "id" | "createdAt" | "addedBy">>
) {
  await updateDoc(doc(db, "households", householdId, "shoppingItems", itemId), updates);

  if (updates.name && (updates.brand || updates.section)) {
    await saveItemMemory(householdId, updates.name, {
      name: updates.name,
      brand: updates.brand ?? null,
      brandBackup: updates.brandBackup ?? null,
      section: updates.section ?? null,
    });
  }
}

export async function toggleShoppingItem(householdId: string, itemId: string, checked: boolean) {
  await updateDoc(doc(db, "households", householdId, "shoppingItems", itemId), { checked });
}

export async function updateShoppingItemSortOrder(householdId: string, itemId: string, sortOrder: number) {
  await updateDoc(doc(db, "households", householdId, "shoppingItems", itemId), { sortOrder });
}

export async function deleteShoppingItem(householdId: string, itemId: string) {
  await deleteDoc(doc(db, "households", householdId, "shoppingItems", itemId));
}

export async function clearCompletedItems(householdId: string) {
  const ref = collection(db, "households", householdId, "shoppingItems");
  const snapshot = await getDocs(ref);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    if ((d.data() as ShoppingItem).checked) batch.delete(d.ref);
  });
  await batch.commit();
}

export async function updateShoppingItemAttachments(
  householdId: string,
  itemId: string,
  attachments: Attachment[]
) {
  await updateDoc(doc(db, "households", householdId, "shoppingItems", itemId), { attachments });
}

// ── Item Memory ──

function normaliseItemName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function saveItemMemory(householdId: string, name: string, memory: ItemMemory) {
  const key = normaliseItemName(name);
  if (!key) return;
  await setDoc(doc(db, "households", householdId, "itemMemory", key), memory);
}

export async function loadAllItemMemory(householdId: string): Promise<ItemMemory[]> {
  const ref = collection(db, "households", householdId, "itemMemory");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((d) => d.data() as ItemMemory);
}

// ── Meals ──

export function subscribeToMeals(householdId: string, callback: (meals: Meal[]) => void) {
  const ref = collection(db, "households", householdId, "meals");
  const q = query(ref, orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const meals: Meal[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Meal, "id">),
      id: d.id,
    }));
    callback(meals);
  });
}

export async function addMeal(householdId: string, meal: Omit<Meal, "id" | "createdAt">) {
  const ref = collection(db, "households", householdId, "meals");
  const docRef = await addDoc(ref, { ...meal, createdAt: Timestamp.now() });
  return docRef.id;
}

export async function updateMeal(
  householdId: string,
  mealId: string,
  updates: Partial<Omit<Meal, "id" | "createdAt" | "createdBy">>
) {
  await updateDoc(doc(db, "households", householdId, "meals", mealId), updates);
}

export async function deleteMeal(householdId: string, mealId: string) {
  await deleteDoc(doc(db, "households", householdId, "meals", mealId));
}

// ── Week Plans ──

export function subscribeToWeekPlan(
  householdId: string,
  weekStartDate: string,
  callback: (plan: WeekPlan | null) => void
) {
  return onSnapshot(
    doc(db, "households", householdId, "weekPlans", weekStartDate),
    (snap) => callback(snap.exists() ? (snap.data() as WeekPlan) : null)
  );
}

export async function saveWeekPlan(householdId: string, weekPlan: WeekPlan) {
  await setDoc(
    doc(db, "households", householdId, "weekPlans", weekPlan.weekStartDate),
    weekPlan
  );
}

export async function updateDaySlot(
  householdId: string,
  weekStartDate: string,
  date: string,
  slot: keyof DayPlan,
  value: string | null
) {
  const docRef = doc(db, "households", householdId, "weekPlans", weekStartDate);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    const existing = snap.data() as WeekPlan;
    const existingDay = existing.days[date] ?? {
      breakfast: null,
      lunch: null,
      dinner: null,
      dinnerAlt: null,
      snacks: null,
      cook: null,
    };
    await updateDoc(docRef, { [`days.${date}`]: { ...existingDay, [slot]: value } });
  } else {
    const emptyDay: DayPlan = { breakfast: null, lunch: null, dinner: null, dinnerAlt: null, snacks: null, cook: null };
    const days: Record<string, DayPlan> = {};
    days[date] = { ...emptyDay, [slot]: value };
    await setDoc(docRef, { weekStartDate, days });
  }
}

export async function updateDayCook(
  householdId: string,
  weekStartDate: string,
  date: string,
  cook: string | null
) {
  const docRef = doc(db, "households", householdId, "weekPlans", weekStartDate);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await updateDoc(docRef, { [`days.${date}.cook`]: cook });
  } else {
    const emptyDay: DayPlan = { breakfast: null, lunch: null, dinner: null, dinnerAlt: null, snacks: null, cook };
    const days: Record<string, DayPlan> = {};
    days[date] = emptyDay;
    await setDoc(docRef, { weekStartDate, days });
  }
}

// ── Calendar Events ──

export function subscribeToCalendarEvents(
  householdId: string,
  callback: (events: CalendarEvent[]) => void
) {
  const ref = collection(db, "households", householdId, "calendarEvents");
  const q = query(ref, orderBy("startDate", "asc"));
  return onSnapshot(q, (snapshot) => {
    const events: CalendarEvent[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<CalendarEvent, "id">),
      id: d.id,
    }));
    callback(events);
  });
}

export async function addCalendarEvent(
  householdId: string,
  event: Omit<CalendarEvent, "id" | "createdAt">
) {
  const ref = collection(db, "households", householdId, "calendarEvents");
  const docRef = await addDoc(ref, { ...event, createdAt: Timestamp.now() });
  return docRef.id;
}

export async function updateCalendarEvent(
  householdId: string,
  eventId: string,
  updates: Partial<Omit<CalendarEvent, "id" | "createdAt" | "createdBy">>
) {
  await updateDoc(doc(db, "households", householdId, "calendarEvents", eventId), updates);
}

export async function deleteCalendarEvent(householdId: string, eventId: string) {
  await deleteDoc(doc(db, "households", householdId, "calendarEvents", eventId));
}

// ── Stores ──

export function subscribeToStores(householdId: string, callback: (stores: Store[]) => void) {
  const ref = collection(db, "households", householdId, "stores");
  const q = query(ref, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const stores: Store[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Store, "id">),
      id: d.id,
    }));
    callback(stores);
  });
}

export async function addStore(
  householdId: string,
  store: Omit<Store, "id" | "createdAt">
): Promise<Store> {
  const ref = collection(db, "households", householdId, "stores");
  const docRef = await addDoc(ref, { ...store, createdAt: Timestamp.now() });
  return { ...store, id: docRef.id, createdAt: Timestamp.now() };
}

export async function updateStore(
  householdId: string,
  storeId: string,
  updates: Partial<Omit<Store, "id" | "createdAt">>
) {
  await updateDoc(doc(db, "households", householdId, "stores", storeId), updates);
}

export async function deleteStore(householdId: string, storeId: string) {
  await deleteDoc(doc(db, "households", householdId, "stores", storeId));
}

// ── Custom Lists ──

export function subscribeToCustomList(
  householdId: string,
  listId: string,
  callback: (list: CustomList | null) => void
) {
  return onSnapshot(
    doc(db, "households", householdId, "customLists", listId),
    (snap) => callback(snap.exists() ? { ...(snap.data() as Omit<CustomList, "id">), id: snap.id } : null)
  );
}

export function subscribeToCustomLists(
  householdId: string,
  callback: (lists: CustomList[]) => void
) {
  const ref = collection(db, "households", householdId, "customLists");
  const q = query(ref, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const lists: CustomList[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<CustomList, "id">),
      id: d.id,
    }));
    callback(lists);
  });
}

export async function createCustomList(
  householdId: string,
  list: Omit<CustomList, "id" | "createdAt">
): Promise<string> {
  const ref = collection(db, "households", householdId, "customLists");
  // Omit emoji if undefined — Firestore rejects documents with undefined fields
  const data: Record<string, unknown> = {
    name: list.name,
    createdBy: list.createdBy,
    createdAt: Timestamp.now(),
  };
  if (list.emoji) data.emoji = list.emoji;
  const docRef = await addDoc(ref, data);
  return docRef.id;
}

export async function updateCustomList(
  householdId: string,
  listId: string,
  updates: { name?: string; emoji?: string | null }
) {
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  // Pass null to clear the emoji field, a string to set it, omit to leave unchanged
  if (updates.emoji !== undefined) data.emoji = updates.emoji || null;
  await updateDoc(doc(db, "households", householdId, "customLists", listId), data);
}

export async function deleteCustomList(householdId: string, listId: string) {
  const itemsRef = collection(db, "households", householdId, "customLists", listId, "items");
  const snapshot = await getDocs(itemsRef);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "households", householdId, "customLists", listId));
  await batch.commit();
}

export function subscribeToCustomListItems(
  householdId: string,
  listId: string,
  callback: (items: CustomListItem[]) => void
) {
  const ref = collection(db, "households", householdId, "customLists", listId, "items");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items: CustomListItem[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<CustomListItem, "id">),
      id: d.id,
    }));
    callback(items);
  });
}

export async function addCustomListItem(
  householdId: string,
  listId: string,
  item: Omit<CustomListItem, "id" | "createdAt">
) {
  const ref = collection(db, "households", householdId, "customLists", listId, "items");
  const docRef = await addDoc(ref, { ...item, createdAt: Timestamp.now() });
  return docRef.id;
}

export async function updateCustomListItem(
  householdId: string,
  listId: string,
  itemId: string,
  updates: Partial<Omit<CustomListItem, "id" | "createdAt" | "addedBy">>
) {
  await updateDoc(
    doc(db, "households", householdId, "customLists", listId, "items", itemId),
    updates
  );
}

export async function toggleCustomListItem(
  householdId: string,
  listId: string,
  itemId: string,
  checked: boolean
) {
  await updateDoc(
    doc(db, "households", householdId, "customLists", listId, "items", itemId),
    { checked }
  );
}

export async function updateCustomListItemSortOrder(
  householdId: string,
  listId: string,
  itemId: string,
  sortOrder: number
) {
  await updateDoc(
    doc(db, "households", householdId, "customLists", listId, "items", itemId),
    { sortOrder }
  );
}

export async function deleteCustomListItem(
  householdId: string,
  listId: string,
  itemId: string
) {
  await deleteDoc(
    doc(db, "households", householdId, "customLists", listId, "items", itemId)
  );
}

export async function clearCompletedCustomListItems(householdId: string, listId: string) {
  const ref = collection(db, "households", householdId, "customLists", listId, "items");
  const snapshot = await getDocs(ref);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    if ((d.data() as CustomListItem).checked) batch.delete(d.ref);
  });
  await batch.commit();
}

export async function updateCustomListItemAttachments(
  householdId: string,
  listId: string,
  itemId: string,
  attachments: Attachment[]
) {
  await updateDoc(
    doc(db, "households", householdId, "customLists", listId, "items", itemId),
    { attachments }
  );
}

// ── Meetings ──

export function subscribeToMeetings(
  householdId: string,
  callback: (meetings: Meeting[]) => void
) {
  const ref = collection(db, "households", householdId, "meetings");
  const q = query(ref, orderBy("date", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meeting)));
  });
}

export async function addMeeting(
  householdId: string,
  data: { date: Timestamp; chairperson: string; otherItems: string[] },
  createdBy: string
): Promise<string> {
  const ref = collection(db, "households", householdId, "meetings");
  const docRef = await addDoc(ref, { ...data, createdBy, createdAt: Timestamp.now() });
  return docRef.id;
}

export async function updateMeeting(
  householdId: string,
  meetingId: string,
  data: Partial<{ date: Timestamp; chairperson: string; otherItems: string[] }>
) {
  await updateDoc(doc(db, "households", householdId, "meetings", meetingId), data);
}

export async function deleteMeeting(householdId: string, meetingId: string) {
  await deleteDoc(doc(db, "households", householdId, "meetings", meetingId));
}

export async function updateMeetingStandingItems(householdId: string, standingItems: string[]) {
  await updateDoc(doc(db, "households", householdId), { meetingStandingItems: standingItems });
}

// ── Whānau Tasks ──

export function subscribeToWhanauTasks(
  householdId: string,
  callback: (tasks: WhanauTask[]) => void
) {
  const ref = collection(db, "households", householdId, "whanauTasks");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const tasks: WhanauTask[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<WhanauTask, "id">),
      id: d.id,
    }));
    callback(tasks);
  });
}

export async function addWhanauTask(
  householdId: string,
  task: Omit<WhanauTask, "id" | "createdAt">
) {
  const ref = collection(db, "households", householdId, "whanauTasks");
  const docRef = await addDoc(ref, { ...task, createdAt: Timestamp.now() });
  return docRef.id;
}

export async function updateWhanauTask(
  householdId: string,
  taskId: string,
  updates: Partial<Omit<WhanauTask, "id" | "createdAt" | "addedBy">>
) {
  await updateDoc(doc(db, "households", householdId, "whanauTasks", taskId), updates);
}

export async function toggleWhanauTask(householdId: string, taskId: string, checked: boolean) {
  await updateDoc(doc(db, "households", householdId, "whanauTasks", taskId), { checked });
}

export async function updateWhanauTaskSortOrder(householdId: string, taskId: string, sortOrder: number) {
  await updateDoc(doc(db, "households", householdId, "whanauTasks", taskId), { sortOrder });
}

export async function deleteWhanauTask(householdId: string, taskId: string) {
  await deleteDoc(doc(db, "households", householdId, "whanauTasks", taskId));
}

export async function clearCompletedWhanauTasks(householdId: string) {
  const ref = collection(db, "households", householdId, "whanauTasks");
  const snapshot = await getDocs(ref);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => {
    if ((d.data() as WhanauTask).checked) batch.delete(d.ref);
  });
  await batch.commit();
}

// ── Chores ──

export function subscribeToChoreLists(
  householdId: string,
  callback: (lists: ChoreList[]) => void
) {
  const ref = collection(db, "households", householdId, "choreLists");
  const q = query(ref, where("active", "==", true));
  return onSnapshot(q, (snapshot) => {
    const lists: ChoreList[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<ChoreList, "id">),
      id: d.id,
    }));
    callback(lists);
  });
}

export async function createChoreList(
  householdId: string,
  list: Omit<ChoreList, "id" | "createdAt" | "updatedAt" | "active">
): Promise<string> {
  const ref = collection(db, "households", householdId, "choreLists");
  const now = Timestamp.now();
  const docRef = await addDoc(ref, { ...list, active: true, createdAt: now, updatedAt: now });
  return docRef.id;
}

// Updates the checklist template (name, amount, rooms/tasks). Does NOT touch
// any week already in progress — those keep their own snapshot, which is the
// whole point of snapshotting at week-start.
export async function updateChoreList(
  householdId: string,
  listId: string,
  updates: Partial<Pick<ChoreList, "name" | "amount" | "rooms" | "active">>
) {
  await updateDoc(doc(db, "households", householdId, "choreLists", listId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export function subscribeToChoreWeek(
  householdId: string,
  listId: string,
  weekId: string,
  callback: (week: ChoreWeek | null) => void
) {
  return onSnapshot(
    doc(db, "households", householdId, "choreLists", listId, "weeks", weekId),
    (snap) => callback(snap.exists() ? ({ ...(snap.data() as Omit<ChoreWeek, "id">), id: snap.id }) : null)
  );
}

export function subscribeToChoreWeeks(
  householdId: string,
  listId: string,
  callback: (weeks: ChoreWeek[]) => void
) {
  const ref = collection(db, "households", householdId, "choreLists", listId, "weeks");
  const q = query(ref, orderBy("weekStart", "desc"));
  return onSnapshot(q, (snapshot) => {
    const weeks: ChoreWeek[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<ChoreWeek, "id">),
      id: d.id,
    }));
    callback(weeks);
  });
}

// Deep-copies a checklist's rooms/tasks into the per-week "progress" shape
// (each task gains done/doneAt), for the week's snapshot.
function snapshotRooms(rooms: ChoreRoomDef[]): ChoreRoomProgress[] {
  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    sortOrder: room.sortOrder,
    tasks: room.tasks.map((task) => ({ ...task, done: false, doneAt: null })),
  }));
}

// Gets the current week's doc for this checklist, creating it from the
// checklist's current snapshot if it doesn't exist yet. There's no scheduled
// job that rolls weeks over — the first person to open Chores that week
// creates it. The doc id is deterministic (the week's start date), so this
// is safe to call every time the page loads.
export async function ensureChoreWeek(
  householdId: string,
  list: ChoreList,
  weekStart: string,
  weekEnd: string
): Promise<ChoreWeek> {
  const ref = doc(db, "households", householdId, "choreLists", list.id, "weeks", weekStart);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { ...(existing.data() as Omit<ChoreWeek, "id">), id: existing.id };
  }

  const week: Omit<ChoreWeek, "id"> = {
    listId: list.id,
    assigneeUid: list.assigneeUid,
    weekStart,
    weekEnd,
    rooms: snapshotRooms(list.rooms),
    amount: list.amount,
    status: "in_progress",
    awardedAmount: null,
    submittedAt: null,
    approvedAt: null,
    approvedBy: null,
    parentNote: null,
    redoNotes: [],
    createdAt: Timestamp.now(),
  };
  await setDoc(ref, week);
  return { ...week, id: weekStart };
}

// Ticks/unticks tasks — rewrites the whole (small) rooms array in one write.
export async function updateChoreWeekRooms(
  householdId: string,
  listId: string,
  weekId: string,
  rooms: ChoreRoomProgress[]
) {
  await updateDoc(doc(db, "households", householdId, "choreLists", listId, "weeks", weekId), {
    rooms,
  });
}

export async function submitChoreWeek(householdId: string, listId: string, weekId: string) {
  await updateDoc(doc(db, "households", householdId, "choreLists", listId, "weeks", weekId), {
    status: "submitted",
    submittedAt: Timestamp.now(),
  });
}

// Sends one or more tasks back for redo. The caller (UI) decides which
// tasks to un-tick and what the new redoNotes list looks like — this just
// writes it, alongside flipping the week back to "redo" status.
export async function sendChoreWeekToRedo(
  householdId: string,
  listId: string,
  weekId: string,
  rooms: ChoreRoomProgress[],
  redoNotes: ChoreRedoNote[]
) {
  await updateDoc(doc(db, "households", householdId, "choreLists", listId, "weeks", weekId), {
    rooms,
    redoNotes,
    status: "redo",
  });
}

// Approves a week and records the (possibly quality-adjusted) payout in one
// atomic batch, so a week can never end up "approved" with no ledger entry
// to match, or vice versa.
export async function approveChoreWeek(
  householdId: string,
  listId: string,
  weekId: string,
  params: {
    memberUid: string;
    awardedAmount: number;
    parentNote: string | null;
    approvedBy: string;
  }
) {
  const batch = writeBatch(db);

  const weekRef = doc(db, "households", householdId, "choreLists", listId, "weeks", weekId);
  batch.update(weekRef, {
    status: "approved",
    awardedAmount: params.awardedAmount,
    approvedAt: Timestamp.now(),
    approvedBy: params.approvedBy,
    parentNote: params.parentNote,
  });

  const ledgerRef = doc(collection(db, "households", householdId, "ledger"));
  const entry: Omit<LedgerEntry, "id"> = {
    memberUid: params.memberUid,
    type: "chore_week",
    amount: params.awardedAmount,
    sourceId: weekId,
    note: params.parentNote,
    createdBy: params.approvedBy,
    createdAt: Timestamp.now(),
  };
  batch.set(ledgerRef, entry);

  await batch.commit();
}

// ── Chore Jobs ──

export function subscribeToChoreJobs(
  householdId: string,
  callback: (jobs: ChoreJob[]) => void
) {
  const ref = collection(db, "households", householdId, "choreJobs");
  const q = query(ref, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const jobs: ChoreJob[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<ChoreJob, "id">),
      id: d.id,
    }));
    callback(jobs);
  });
}

export async function createChoreJob(
  householdId: string,
  job: Pick<ChoreJob, "title" | "notes" | "amount" | "dueDate" | "assigneeUid" | "createdBy">
): Promise<string> {
  const ref = collection(db, "households", householdId, "choreJobs");
  const doc_: Omit<ChoreJob, "id"> = {
    ...job,
    status: "open",
    doneAt: null,
    approvedAt: null,
    approvedBy: null,
    awardedAmount: null,
    parentNote: null,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(ref, doc_);
  return docRef.id;
}

export async function markChoreJobDone(householdId: string, jobId: string) {
  await updateDoc(doc(db, "households", householdId, "choreJobs", jobId), {
    status: "done",
    doneAt: Timestamp.now(),
  });
}

export async function sendChoreJobToRedo(householdId: string, jobId: string, note: string | null) {
  await updateDoc(doc(db, "households", householdId, "choreJobs", jobId), {
    status: "open",
    doneAt: null,
    parentNote: note,
  });
}

// Approves a job and records its (possibly quality-adjusted) payout in one
// atomic batch — same reasoning as approveChoreWeek.
export async function approveChoreJob(
  householdId: string,
  jobId: string,
  params: {
    memberUid: string;
    awardedAmount: number;
    parentNote: string | null;
    approvedBy: string;
  }
) {
  const batch = writeBatch(db);

  const jobRef = doc(db, "households", householdId, "choreJobs", jobId);
  batch.update(jobRef, {
    status: "approved",
    awardedAmount: params.awardedAmount,
    approvedAt: Timestamp.now(),
    approvedBy: params.approvedBy,
    parentNote: params.parentNote,
  });

  const ledgerRef = doc(collection(db, "households", householdId, "ledger"));
  const entry: Omit<LedgerEntry, "id"> = {
    memberUid: params.memberUid,
    type: "chore_job",
    amount: params.awardedAmount,
    sourceId: jobId,
    note: params.parentNote,
    createdBy: params.approvedBy,
    createdAt: Timestamp.now(),
  };
  batch.set(ledgerRef, entry);

  await batch.commit();
}

export async function deleteChoreJob(householdId: string, jobId: string) {
  await deleteDoc(doc(db, "households", householdId, "choreJobs", jobId));
}

// ── Ledger ──

export function subscribeToLedger(
  householdId: string,
  memberUid: string,
  callback: (entries: LedgerEntry[]) => void
) {
  const ref = collection(db, "households", householdId, "ledger");
  const q = query(ref, where("memberUid", "==", memberUid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const entries: LedgerEntry[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<LedgerEntry, "id">),
      id: d.id,
    }));
    callback(entries);
  });
}

// For payouts ("Paid Sam $20 cash") and manual adjustments — anything that
// isn't tied to approving a chore week or job.
export async function addLedgerEntry(
  householdId: string,
  entry: Omit<LedgerEntry, "id" | "createdAt">
) {
  const ref = collection(db, "households", householdId, "ledger");
  await addDoc(ref, { ...entry, createdAt: Timestamp.now() });
}
