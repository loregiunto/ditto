import { describe, it, expect } from "vitest";
import {
  shouldRevealAddress,
  classifyStatus,
} from "@/lib/bookings/confirmation-policy";

describe("shouldRevealAddress", () => {
  it("only CONFIRMED reveals the address", () => {
    expect(shouldRevealAddress("CONFIRMED")).toBe(true);
    for (const status of [
      "PENDING_PAYMENT",
      "PENDING_HOST_APPROVAL",
      "REJECTED",
      "EXPIRED",
      "CANCELLED",
      "REFUNDED",
      "anything-else",
    ]) {
      expect(shouldRevealAddress(status)).toBe(false);
    }
  });
});

describe("classifyStatus", () => {
  it("maps known booking statuses", () => {
    expect(classifyStatus("CONFIRMED")).toBe("CONFIRMED");
    expect(classifyStatus("PENDING_HOST_APPROVAL")).toBe("PENDING_HOST_APPROVAL");
    expect(classifyStatus("REJECTED")).toBe("REJECTED");
    expect(classifyStatus("EXPIRED")).toBe("EXPIRED");
    expect(classifyStatus("PENDING_PAYMENT")).toBe("PENDING_PAYMENT");
  });

  it("falls back to OTHER for unknown statuses", () => {
    expect(classifyStatus("FOO")).toBe("OTHER");
  });
});
