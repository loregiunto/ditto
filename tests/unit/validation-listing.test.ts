import { describe, it, expect } from "vitest";
import {
  listingInputSchema,
  MAX_PHOTOS,
  PRICE_MIN_CENTS,
} from "@/lib/validation/listing";

const validBase = {
  title: "Bagno luminoso in centro",
  description: "Spazio pulito e privato, riscaldato e con tutto il necessario.",
  hostType: "PRIVATE" as const,
  address: "Via Roma 1, Firenze",
  hourlyPriceCents: 400,
  photos: [{ path: "user-uid/drafts/draft-1/photo.jpg", order: 0 }],
};

describe("listingInputSchema", () => {
  it("accepts a valid payload", () => {
    expect(listingInputSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects empty title", () => {
    const r = listingInputSchema.safeParse({ ...validBase, title: "" });
    expect(r.success).toBe(false);
  });

  it("rejects too short description", () => {
    const r = listingInputSchema.safeParse({ ...validBase, description: "tiny" });
    expect(r.success).toBe(false);
  });

  it("rejects price below minimum", () => {
    const r = listingInputSchema.safeParse({
      ...validBase,
      hourlyPriceCents: PRICE_MIN_CENTS - 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects negative price", () => {
    const r = listingInputSchema.safeParse({
      ...validBase,
      hourlyPriceCents: -100,
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid hostType", () => {
    const r = listingInputSchema.safeParse({
      ...validBase,
      hostType: "OTHER" as unknown as "PRIVATE",
    });
    expect(r.success).toBe(false);
  });

  it("rejects more than MAX_PHOTOS", () => {
    const photos = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => ({
      path: `user-uid/drafts/d/${i}.jpg`,
      order: i,
    }));
    const r = listingInputSchema.safeParse({ ...validBase, photos });
    expect(r.success).toBe(false);
  });

  it("rejects empty photos array", () => {
    const r = listingInputSchema.safeParse({ ...validBase, photos: [] });
    expect(r.success).toBe(false);
  });

  it("rejects path with traversal characters", () => {
    const r = listingInputSchema.safeParse({
      ...validBase,
      photos: [{ path: "user/../other/photo.jpg", order: 0 }],
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty path", () => {
    const r = listingInputSchema.safeParse({
      ...validBase,
      photos: [{ path: "", order: 0 }],
    });
    expect(r.success).toBe(false);
  });
});
