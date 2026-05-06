import { SLOT_GRANULARITY_MIN, MINUTES_IN_DAY } from "@/lib/validation/availability";

export type WeeklyRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export type ActiveCells = boolean[][];

export type BookingInterval = {
  startsAt: Date;
  endsAt: Date;
};

export type ProjectedSlot = {
  startsAt: Date;
  endsAt: Date;
};

/**
 * Compact a 2D boolean grid (day × row) of active cells into contiguous rule
 * ranges per day. Cells are interpreted in the host's local time at the chosen
 * granularity (default 30 min). The first row corresponds to 00:00.
 */
export function compactCellsToRules(
  cells: ActiveCells,
  granularityMin: number = SLOT_GRANULARITY_MIN,
): WeeklyRule[] {
  if (cells.length !== 7) {
    throw new Error("compactCellsToRules expects 7 days");
  }
  const rules: WeeklyRule[] = [];
  for (let day = 0; day < 7; day++) {
    const row = cells[day];
    let i = 0;
    while (i < row.length) {
      if (!row[i]) {
        i++;
        continue;
      }
      const startCell = i;
      while (i < row.length && row[i]) i++;
      const endCell = i;
      rules.push({
        dayOfWeek: day,
        startMinute: startCell * granularityMin,
        endMinute: endCell * granularityMin,
      });
    }
  }
  return rules;
}

/**
 * Project DB rules back into a 2D boolean grid (day × row).
 */
export function rulesToCells(
  rules: WeeklyRule[],
  granularityMin: number = SLOT_GRANULARITY_MIN,
): ActiveCells {
  const rowsPerDay = MINUTES_IN_DAY / granularityMin;
  const cells: ActiveCells = Array.from({ length: 7 }, () =>
    new Array<boolean>(rowsPerDay).fill(false),
  );
  for (const rule of rules) {
    if (rule.dayOfWeek < 0 || rule.dayOfWeek > 6) continue;
    const startCell = Math.floor(rule.startMinute / granularityMin);
    const endCell = Math.floor(rule.endMinute / granularityMin);
    for (let r = startCell; r < endCell && r < rowsPerDay; r++) {
      cells[rule.dayOfWeek][r] = true;
    }
  }
  return cells;
}

/**
 * Map a JS getDay() value (0=Sunday … 6=Saturday) to our convention
 * (0=Monday … 6=Sunday).
 */
function jsDayToOurDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Enumerate concrete bookable slots from weekly rules over a date range.
 * Each slot has length `granularityMin` minutes. Slots that overlap any
 * booking interval are excluded.
 *
 * `from` is inclusive, `to` is exclusive.
 */
export function weeklyRulesToSlots(
  rules: WeeklyRule[],
  from: Date,
  to: Date,
  granularityMin: number = SLOT_GRANULARITY_MIN,
  bookings: BookingInterval[] = [],
): ProjectedSlot[] {
  if (to <= from) return [];

  const rulesByDay = new Map<number, WeeklyRule[]>();
  for (const rule of rules) {
    const list = rulesByDay.get(rule.dayOfWeek) ?? [];
    list.push(rule);
    rulesByDay.set(rule.dayOfWeek, list);
  }

  const slots: ProjectedSlot[] = [];
  const dayCursor = new Date(from);
  dayCursor.setHours(0, 0, 0, 0);

  while (dayCursor < to) {
    const dayRules = rulesByDay.get(jsDayToOurDay(dayCursor.getDay())) ?? [];
    for (const rule of dayRules) {
      for (
        let m = rule.startMinute;
        m + granularityMin <= rule.endMinute;
        m += granularityMin
      ) {
        const slotStart = new Date(dayCursor);
        slotStart.setMinutes(m);
        const slotEnd = new Date(slotStart.getTime() + granularityMin * 60_000);
        if (slotStart < from || slotEnd > to) continue;

        const overlapsBooking = bookings.some(
          (b) => slotStart < b.endsAt && slotEnd > b.startsAt,
        );
        if (overlapsBooking) continue;

        slots.push({ startsAt: slotStart, endsAt: slotEnd });
      }
    }
    dayCursor.setDate(dayCursor.getDate() + 1);
  }

  return slots;
}
