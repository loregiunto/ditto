import { z } from "zod";

export const SLOT_GRANULARITY_MIN = 30;
export const MAX_RULES_PER_DAY = 12;
export const MINUTES_IN_DAY = 1440;

export const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startMinute: z
      .number()
      .int()
      .min(0)
      .max(MINUTES_IN_DAY - SLOT_GRANULARITY_MIN)
      .refine(
        (n) => n % SLOT_GRANULARITY_MIN === 0,
        `startMinute deve essere multiplo di ${SLOT_GRANULARITY_MIN}`,
      ),
    endMinute: z
      .number()
      .int()
      .min(SLOT_GRANULARITY_MIN)
      .max(MINUTES_IN_DAY)
      .refine(
        (n) => n % SLOT_GRANULARITY_MIN === 0,
        `endMinute deve essere multiplo di ${SLOT_GRANULARITY_MIN}`,
      ),
  })
  .refine((r) => r.startMinute < r.endMinute, {
    message: "startMinute deve essere minore di endMinute",
    path: ["startMinute"],
  });

export const availabilityInputSchema = z
  .object({
    rules: z.array(availabilityRuleSchema).max(7 * MAX_RULES_PER_DAY),
  })
  .superRefine((value, ctx) => {
    const byDay = new Map<number, { startMinute: number; endMinute: number }[]>();
    for (let i = 0; i < value.rules.length; i++) {
      const r = value.rules[i];
      const list = byDay.get(r.dayOfWeek) ?? [];
      list.push({ startMinute: r.startMinute, endMinute: r.endMinute });
      byDay.set(r.dayOfWeek, list);
    }

    for (const [day, list] of byDay) {
      if (list.length > MAX_RULES_PER_DAY) {
        ctx.addIssue({
          code: "custom",
          message: `Massimo ${MAX_RULES_PER_DAY} finestre per giorno`,
          path: ["rules"],
        });
      }
      const sorted = [...list].sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          ctx.addIssue({
            code: "custom",
            message: `Sovrapposizione tra finestre nel giorno ${day}`,
            path: ["rules"],
          });
          break;
        }
      }
    }
  });

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
export type AvailabilityInput = z.infer<typeof availabilityInputSchema>;
