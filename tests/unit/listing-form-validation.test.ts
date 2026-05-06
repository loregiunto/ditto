import { describe, it, expect } from "vitest";
import {
  listingInputSchema,
  TITLE_MIN,
  TITLE_MAX,
  DESC_MIN,
  DESC_MAX,
  PRICE_MAX_CENTS,
  MAX_PHOTOS,
} from "@/lib/validation/listing";

const base = {
  title: "Bagno luminoso in centro",
  description:
    "Spazio pulito e privato, riscaldato e con tutto il necessario per gli ospiti.",
  hostType: "PRIVATE" as const,
  address: "Via Roma 1, Firenze",
  hourlyPriceCents: 400,
  photos: [{ path: "user-uid/drafts/d/a.jpg", order: 0 }],
};

describe("listing form edge cases", () => {
  it("rejects title shorter than min", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      title: "a".repeat(TITLE_MIN - 1),
    });
    expect(r.success).toBe(false);
  });

  it("rejects title longer than max", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      title: "a".repeat(TITLE_MAX + 1),
    });
    expect(r.success).toBe(false);
  });

  it("rejects description longer than max", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      description: "a".repeat(DESC_MAX + 1),
    });
    expect(r.success).toBe(false);
  });

  it("rejects description shorter than min", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      description: "a".repeat(DESC_MIN - 1),
    });
    expect(r.success).toBe(false);
  });

  it("rejects price above max", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      hourlyPriceCents: PRICE_MAX_CENTS + 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer price", () => {
    const r = listingInputSchema.safeParse({
      ...base,
      hourlyPriceCents: 4.5,
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty address", () => {
    const r = listingInputSchema.safeParse({ ...base, address: "" });
    expect(r.success).toBe(false);
  });

  it("rejects when photos exceed cap", () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => ({
      path: `user-uid/drafts/d/${i}.jpg`,
      order: i,
    }));
    const r = listingInputSchema.safeParse({ ...base, photos });
    expect(r.success).toBe(false);
  });

  it("accepts exactly MAX_PHOTOS", () => {
    const photos = Array.from({ length: MAX_PHOTOS }, (_, i) => ({
      path: `user-uid/drafts/d/${i}.jpg`,
      order: i,
    }));
    const r = listingInputSchema.safeParse({ ...base, photos });
    expect(r.success).toBe(true);
  });

  it("trims whitespace-only title to invalid", () => {
    const r = listingInputSchema.safeParse({ ...base, title: "    " });
    expect(r.success).toBe(false);
  });
});
