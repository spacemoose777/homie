import { Timestamp } from "firebase/firestore";

// Roles
export type UserRole = "admin" | "member" | "child";

// Theme keys
export type ThemeKey = "midnight" | "slate" | "petal" | "sky" | "system";

// View mode for shopping list
export type ViewMode = "simple" | "detailed";

// Which Chores push notifications a member wants — every key defaults to
// true when absent, so existing members with no prefs doc get everything.
export interface NotificationPrefs {
  choreWeekStarted?: boolean; // to the assignee: a new week has begun
  choreReminder?: boolean; // to the assignee: week not submitted yet
  choreApproved?: boolean; // to the assignee: a week or job was approved
  choreRedo?: boolean; // to the assignee: a task/job was sent back
  choreJobAdded?: boolean; // to the assignee: a new paid job was created
  choreSubmitted?: boolean; // to parents: the assignee submitted a week
  choreJobDone?: boolean; // to parents: the assignee marked a job done
}

// User profile stored at /households/{hid}/members/{uid}
export interface MemberProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  theme: ThemeKey;
  colour: string;
  viewMode: ViewMode;
  textSize?: "sm" | "md" | "lg";
  notificationPrefs?: NotificationPrefs;
  createdAt: Timestamp;
}

// Top-level user document at /users/{uid}
export interface UserDoc {
  householdId: string;
}

// Household document at /households/{hid}
export interface Household {
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  calendarEmail?: string;
  mealSlots?: string[];
  meetingStandingItems?: string[];
}

// Invite document at /households/{hid}/invites/{token}
export interface Invite {
  email: string;
  role: UserRole;
  expiry: Timestamp;
  used: boolean;
  createdBy: string;
  createdAt: Timestamp;
}

// Shopping list item at /households/{hid}/shoppingItems/{id}
export interface ShoppingItem {
  id: string;
  name: string;
  brand: string | null;
  brandBackup: string | null;
  section: string | null;
  quantity: string | null;
  checked: boolean;
  addedBy: string;
  createdAt: Timestamp;
  urgent?: boolean;
  onlyAtStoreId?: string | null;
  sortOrder?: number;
  notes?: string | null;
  attachments?: Attachment[];
}

// Item memory at /households/{hid}/itemMemory/{normalisedName}
export interface ItemMemory {
  name: string;
  brand: string | null;
  brandBackup: string | null;
  section: string | null;
}

// Attachment for shopping / list items
export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: string;
}

// Ingredient sub-model for meals
export interface Ingredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

// Meal at /households/{hid}/meals/{id}
export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
  tags: string[];
  createdBy: string;
  createdAt: Timestamp;
}

// Day plan within a week
export interface DayPlan {
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  dinnerAlt: string | null;
  snacks: string | null;
  cook: string | null;
}

// Week plan at /households/{hid}/weekPlans/{weekStartDate}
export interface WeekPlan {
  weekStartDate: string;
  days: Record<string, DayPlan>;
}

// Recurring rule for calendar events
export interface RecurringRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  endDate: Timestamp | null;
}

// Calendar event at /households/{hid}/calendarEvents/{id}
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: Timestamp;
  endDate: Timestamp;
  allDay: boolean;
  members: string[];
  colour: string;
  recurring: RecurringRule | null;
  sourceType: "manual" | "google_calendar";
  googleEventId: string | null;
  createdBy: string;
  createdAt: Timestamp;
}

// Store at /households/{hid}/stores/{id}
export interface Store {
  id: string;
  name: string;
  departments: string[];
  createdAt: Timestamp;
}

// Meeting at /households/{hid}/meetings/{id}
export interface Meeting {
  id: string;
  date: Timestamp;
  chairperson: string;
  otherItems: string[];
  createdBy: string;
  createdAt: Timestamp;
}

// Custom list at /households/{hid}/customLists/{id}
export interface CustomList {
  id: string;
  name: string;
  emoji?: string;
  createdBy: string;
  createdAt: Timestamp;
}

// Item in a custom list at /households/{hid}/customLists/{listId}/items/{id}
export interface CustomListItem {
  id: string;
  name: string;
  brand: string | null;
  brandBackup: string | null;
  section: string | null;
  quantity: string | null;
  checked: boolean;
  addedBy: string;
  createdAt: Timestamp;
  urgent?: boolean;
  sortOrder?: number;
  notes?: string | null;
  attachments?: Attachment[];
}

// Whānau task at /households/{hid}/whanauTasks/{id}
export interface WhanauTask {
  id: string;
  name: string;
  notes: string | null;
  owner: string | null; // member uid, null = unassigned
  category: string | null;
  urgent: boolean;
  checked: boolean;
  addedBy: string;
  createdAt: Timestamp;
  sortOrder?: number;
}

// ── Chores ──
// All money amounts are stored as integer cents ($20.00 = 2000) to avoid
// floating-point rounding bugs.

export type ChoreFrequency = "weekly";
export type ChoreWeekStatus = "in_progress" | "submitted" | "approved" | "redo";
export type ChoreJobStatus = "open" | "done" | "approved" | "redo";
export type LedgerEntryType = "chore_week" | "chore_job" | "payout" | "adjustment";

// A single task within a room, as defined on the checklist template
export interface ChoreTaskDef {
  id: string;
  label: string;
  sortOrder: number;
}

// A room grouping on the checklist template
export interface ChoreRoomDef {
  id: string;
  name: string;
  sortOrder: number;
  tasks: ChoreTaskDef[];
}

// A task as it appears inside a week's snapshot — same as ChoreTaskDef plus
// the per-week completion state
export interface ChoreTaskProgress extends ChoreTaskDef {
  done: boolean;
  doneAt: Timestamp | null;
}

// A room as it appears inside a week's snapshot
export interface ChoreRoomProgress {
  id: string;
  name: string;
  sortOrder: number;
  tasks: ChoreTaskProgress[];
}

// Checklist template at /households/{hid}/choreLists/{listId}
export interface ChoreList {
  id: string;
  name: string;
  frequency: ChoreFrequency; // only "weekly" exists in v1 — field exists so a
  // second (e.g. daily, or a second child's) checklist can slot in later
  assigneeUid: string;
  amount: number; // cents — fixed amount for completing the whole checklist
  rooms: ChoreRoomDef[];
  active: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// A send-back note on a specific task within a week
export interface ChoreRedoNote {
  taskId: string;
  note: string;
  at: Timestamp;
}

// One tracked week at /households/{hid}/choreLists/{listId}/weeks/{weekId}
// weekId is the ISO date of the Monday it starts, e.g. "2026-10-12"
export interface ChoreWeek {
  id: string;
  listId: string;
  assigneeUid: string;
  weekStart: string; // ISO date, NZ wall-clock Monday
  weekEnd: string; // ISO date, NZ wall-clock Sunday
  rooms: ChoreRoomProgress[]; // snapshot of the list's rooms/tasks at week start
  amount: number; // snapshot of the list's amount at week start
  status: ChoreWeekStatus;
  awardedAmount: number | null;
  submittedAt: Timestamp | null;
  approvedAt: Timestamp | null;
  approvedBy: string | null;
  parentNote: string | null;
  redoNotes: ChoreRedoNote[];
  createdAt: Timestamp;
}

// One-off paid job at /households/{hid}/choreJobs/{jobId}
export interface ChoreJob {
  id: string;
  title: string;
  notes: string | null;
  amount: number; // cents
  dueDate: string | null; // ISO date
  assigneeUid: string;
  status: ChoreJobStatus;
  doneAt: Timestamp | null;
  approvedAt: Timestamp | null;
  approvedBy: string | null;
  awardedAmount: number | null;
  parentNote: string | null;
  createdBy: string;
  createdAt: Timestamp;
}

// Money ledger entry at /households/{hid}/ledger/{entryId}
// A child's balance is always the live sum of their entries — never a stored
// number that could drift from reality.
export interface LedgerEntry {
  id: string;
  memberUid: string;
  type: LedgerEntryType;
  amount: number; // cents — positive = earning, negative = payout/deduction
  sourceId: string | null; // the weekId or jobId this came from, if any
  note: string | null;
  createdBy: string;
  createdAt: Timestamp;
}
