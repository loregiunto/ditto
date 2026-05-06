import { describe, it, expect } from "vitest";
import {
  compactCellsToRules,
  rulesToCells,
  weeklyRulesToSlots,
  type ActiveCells,
  type WeeklyRule,
} from "@/lib/listings/availability";
import {
  availabilityInputSchema,
  MINUTES_IN_DAY,
} from "@/lib/validation/availability";

const ROWS_30 = MINUTES_IN_DAY / 30;

function emptyCells(): ActiveCells {
  return Array.from({ length: 7 }, () => new Array<boolean>(ROWS_30).fill(false));
}

describe("compactCellsToRules / rulesToCells", () => {
  it("round-trips contiguous and non-contiguous ranges", () => {
    const cells = emptyCells();
    // Lun (0): 9–13 (rows 18..25 inclusive, end 26)
    for (let r = 18; r < 26; r++) cells[0][r] = true;
    // Mer (2): 18–22 (rows 36..43 inclusive, end 44)
    for (let r = 36; r < 44; r++) cells[2][r] = true;
    // Mer (2): also 23–24 (separate range, gap)
    for (let r = 46; r < 48; r++) cells[2][r] = true;

    const rules = compactCellsToRules(cells);
    expect(rules).toEqual([
      { dayOfWeek: 0, startMinute: 540, endMinute: 780 },
      { dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
      { dayOfWeek: 2, startMinute: 1380, endMinute: 1440 },
    ]);

    const back = rulesToCells(rules);
    expect(back).toEqual(cells);
  });

  it("handles fully empty and fully full days", () => {
    const cells = emptyCells();
    for (let r = 0; r < ROWS_30; r++) cells[5][r] = true; // sat full
    const rules = compactCellsToRules(cells);
    expect(rules).toEqual([
      { dayOfWeek: 5, startMinute: 0, endMinute: 1440 },
    ]);
    expect(rulesToCells(rules)).toEqual(cells);
  });

  it("ignores out-of-range dayOfWeek in rulesToCells", () => {
    const rules: WeeklyRule[] = [
      { dayOfWeek: 0, startMinute: 0, endMinute: 30 },
      { dayOfWeek: 9, startMinute: 0, endMinute: 30 },
    ];
    const cells = rulesToCells(rules);
    expect(cells[0][0]).toBe(true);
    expect(cells.length).toBe(7);
  });

  it("throws when given an invalid grid shape", () => {
    expect(() => compactCellsToRules([] as ActiveCells)).toThrow();
  });
});

describe("weeklyRulesToSlots", () => {
  it("enumerates 30-min slots within the date range", () => {
    // Mon 5 May 2025 was a Monday in our fictional week; use a real Monday
    const from = new Date("2025-05-05T00:00:00"); // Mon
    const to = new Date("2025-05-12T00:00:00"); // following Mon (exclusive)
    const rules: WeeklyRule[] = [
      { dayOfWeek: 0, startMinute: 540, endMinute: 600 }, // Mon 9:00–10:00 → 2 slots
      { dayOfWeek: 2, startMinute: 1080, endMinute: 1140 }, // Wed 18:00–19:00 → 2 slots
    ];
    const slots = weeklyRulesToSlots(rules, from, to);
    expect(slots).toHaveLength(4);
    expect(slots[0].startsAt.getHours()).toBe(9);
    expect(slots[0].endsAt.getMinutes()).toBe(30);
  });

  it("excludes slots overlapping bookings", () => {
    const from = new Date("2025-05-05T00:00:00");
    const to = new Date("2025-05-06T00:00:00");
    const rules: WeeklyRule[] = [
      { dayOfWeek: 0, startMinute: 540, endMinute: 660 }, // 9:00–11:00 → 4 slots
    ];
    const bookings = [
      {
        startsAt: new Date("2025-05-05T09:30:00"),
        endsAt: new Date("2025-05-05T10:30:00"),
      },
    ];
    const slots = weeklyRulesToSlots(rules, from, to, 30, bookings);
    // Only 9:00 and 10:30 should remain
    expect(slots).toHaveLength(2);
    expect(slots[0].startsAt.getHours()).toBe(9);
    expect(slots[0].startsAt.getMinutes()).toBe(0);
    expect(slots[1].startsAt.getHours()).toBe(10);
    expect(slots[1].startsAt.getMinutes()).toBe(30);
  });

  it("returns empty when range is reversed", () => {
    const slots = weeklyRulesToSlots(
      [{ dayOfWeek: 0, startMinute: 0, endMinute: 60 }],
      new Date("2025-05-05T00:00:00"),
      new Date("2025-05-04T00:00:00"),
    );
    expect(slots).toEqual([]);
  });
});

describe("availabilityInputSchema", () => {
  it("accepts a valid payload", () => {
    const r = availabilityInputSchema.safeParse({
      rules: [
        { dayOfWeek: 0, startMinute: 540, endMinute: 780 },
        { dayOfWeek: 0, startMinute: 900, endMinute: 1080 },
        { dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
      ],
    });
    expect(r.success).toBe(true);
  });

  it("rejects intra-day overlap", () => {
    const r = availabilityInputSchema.safeParse({
      rules: [
        { dayOfWeek: 0, startMinute: 540, endMinute: 780 },
        { dayOfWeek: 0, startMinute: 720, endMinute: 900 }, // overlaps
      ],
    });
    expect(r.success).toBe(false);
  });

  it("rejects start >= end", () => {
    const r = availabilityInputSchema.safeParse({
      rules: [{ dayOfWeek: 0, startMinute: 600, endMinute: 600 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects values not multiple of 30", () => {
    const r = availabilityInputSchema.safeParse({
      rules: [{ dayOfWeek: 0, startMinute: 545, endMinute: 600 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects dayOfWeek out of range", () => {
    const r = availabilityInputSchema.safeParse({
      rules: [{ dayOfWeek: 7, startMinute: 0, endMinute: 60 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects more than 12 windows in a single day", () => {
    const rules = Array.from({ length: 13 }, (_, i) => ({
      dayOfWeek: 0,
      startMinute: i * 60,
      endMinute: i * 60 + 30,
    }));
    const r = availabilityInputSchema.safeParse({ rules });
    expect(r.success).toBe(false);
  });

  it("accepts an empty rules array", () => {
    const r = availabilityInputSchema.safeParse({ rules: [] });
    expect(r.success).toBe(true);
  });
});
