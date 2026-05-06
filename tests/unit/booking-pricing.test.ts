import { describe, it, expect } from "vitest";
import {
  computeAmountCents,
  computeBookingPricing,
  computeDurationMinutes,
  computePlatformFeeCents,
} from "@/lib/bookings/pricing";

describe("booking pricing", () => {
  describe("computeDurationMinutes", () => {
    it("returns minutes for 30/60/90 minute slots", () => {
      const start = new Date("2030-01-01T10:00:00Z");
      expect(
        computeDurationMinutes(start, new Date("2030-01-01T10:30:00Z")),
      ).toBe(30);
      expect(
        computeDurationMinutes(start, new Date("2030-01-01T11:00:00Z")),
      ).toBe(60);
      expect(
        computeDurationMinutes(start, new Date("2030-01-01T11:30:00Z")),
      ).toBe(90);
    });

    it("rejects non-positive ranges", () => {
      const t = new Date("2030-01-01T10:00:00Z");
      expect(() => computeDurationMinutes(t, t)).toThrow();
      expect(() =>
        computeDurationMinutes(t, new Date("2030-01-01T09:00:00Z")),
      ).toThrow();
    });

    it("rejects sub-minute fractions", () => {
      expect(() =>
        computeDurationMinutes(
          new Date("2030-01-01T10:00:00Z"),
          new Date("2030-01-01T10:00:30Z"),
        ),
      ).toThrow();
    });
  });

  describe("computeAmountCents", () => {
    it("computes amount for round prices", () => {
      expect(computeAmountCents(400, 30)).toBe(200);
      expect(computeAmountCents(400, 60)).toBe(400);
      expect(computeAmountCents(400, 90)).toBe(600);
    });

    it("rounds amount when price/duration is not divisible", () => {
      expect(computeAmountCents(333, 30)).toBe(167);
      expect(computeAmountCents(450, 30)).toBe(225);
      expect(computeAmountCents(901, 60)).toBe(901);
    });

    it("rejects invalid inputs", () => {
      expect(() => computeAmountCents(0, 30)).toThrow();
      expect(() => computeAmountCents(-100, 30)).toThrow();
      expect(() => computeAmountCents(400, 0)).toThrow();
      expect(() => computeAmountCents(400.5, 30)).toThrow();
    });
  });

  describe("computePlatformFeeCents", () => {
    it("returns exactly 10% rounded", () => {
      expect(computePlatformFeeCents(1000)).toBe(100);
      expect(computePlatformFeeCents(905)).toBe(91);
      expect(computePlatformFeeCents(0)).toBe(0);
    });
  });

  describe("computeBookingPricing", () => {
    it("returns amount, platform fee and host net", () => {
      const result = computeBookingPricing(
        400,
        new Date("2030-01-01T10:00:00Z"),
        new Date("2030-01-01T11:00:00Z"),
      );
      expect(result).toEqual({
        durationMinutes: 60,
        amountCents: 400,
        platformFeeCents: 40,
        hostNetCents: 360,
      });
    });
  });
});
