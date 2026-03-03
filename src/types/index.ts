import { Timestamp } from "firebase/firestore";

// Roles
export type UserRole = "admin" | "member" | "child";

// Theme keys
export type ThemeKey = "midnight" | "slate" | "petal" | "sky" | "system";

// View mode for shopping list
export type ViewMode = "simple" | "detailed";

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
}

// Item memory at /households/{hid}/itemMemory/{normalisedName}
export interface ItemMemory {
  name: string;
  brand: string | null;
  brandBackup: string | null;
  section: string | null;
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
  snacks: string | null;
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
