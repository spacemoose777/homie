import type { ChoreRoomDef } from "@/types";

// Built-in checklist templates a parent can load with one tap, rather than
// typing out every room and task by hand.

interface ChoreTemplate {
  name: string;
  amount: number; // cents
  rooms: Array<{ name: string; tasks: string[] }>;
}

export const SAM_WEEKLY_CLEAN_TEMPLATE: ChoreTemplate = {
  name: "Sam's Weekly Clean",
  amount: 2000, // $20.00 — adjust after loading
  rooms: [
    {
      name: "Living Room",
      tasks: [
        "Clear flat surfaces and put items away",
        "Dust sideboards and coffee table",
        "Straighten cushions and blankets",
        "Vacuum floor and rugs",
        "Mop floor",
      ],
    },
    {
      name: "Kitchen",
      tasks: [
        "Wipe down all kitchen benches",
        "Clean kitchen tap",
        "Wipe dishwasher and fridge exterior",
        "Wipe windowsill",
        "Clean inside the microwave",
        "Load or unload the dishwasher",
        "Empty the kitchen rubbish bin",
        "Vacuum floor",
        "Mop floor",
      ],
    },
    {
      name: "Main Bathroom (with Shower & Toilet)",
      tasks: [
        "Clean sink and vanity",
        "Clean toilet bowl and exterior",
        "Clean shower tray and glass",
        "Wipe shelves and windowsill",
        "Clean mirror",
        "Vacuum floor",
        "Mop floor",
      ],
    },
    {
      name: "Sam's Bathroom (Separate Toilet & Basin)",
      tasks: [
        "Clean toilet bowl and exterior",
        "Clean basin and taps",
        "Clean mirror",
        "Vacuum and mop floor",
      ],
    },
    {
      name: "Office Bathroom (Separate Toilet & Basin)",
      tasks: [
        "Clean toilet bowl and exterior",
        "Clean basin and taps",
        "Clean mirror",
        "Wipe bench",
        "Vacuum and mop floor",
      ],
    },
    {
      name: "Entryway",
      tasks: [
        "Organise clutter on shoe rack and entry table",
        "Shake out or vacuum the mats",
        "Sweep or vacuum the floor",
      ],
    },
    {
      name: "Laundry",
      tasks: [
        "Vacuum entire floor, including behind rolling shelves",
        "Wipe laundry tub",
        "Wipe washing machine exterior",
        "Clean up any loose pet food",
        "Wipe down cat mat and place pet bowls in dishwasher",
      ],
    },
    {
      name: "Office and Spare Room",
      tasks: ["Vacuum entire floor"],
    },
  ],
};

/** Turns a template into the ChoreRoomDef[] shape a ChoreList stores, with
 * fresh ids and sortOrders. */
export function materializeTemplateRooms(template: ChoreTemplate): ChoreRoomDef[] {
  return template.rooms.map((room, roomIndex) => ({
    id: crypto.randomUUID(),
    name: room.name,
    sortOrder: roomIndex,
    tasks: room.tasks.map((label, taskIndex) => ({
      id: crypto.randomUUID(),
      label,
      sortOrder: taskIndex,
    })),
  }));
}
