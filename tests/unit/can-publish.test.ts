import { describe, it, expect } from "vitest";
import { canPublish } from "@/lib/listings/can-publish";

describe("canPublish", () => {
  it("ok when both stripeAccountId and identityStatus='verified' are present", () => {
    expect(
      canPublish({
        stripeAccountId: "acct_123",
        identityStatus: "verified",
      }),
    ).toEqual({ ok: true });
  });

  it("returns STRIPE_NOT_CONNECTED when stripeAccountId is null", () => {
    expect(
      canPublish({
        stripeAccountId: null,
        identityStatus: "verified",
      }),
    ).toEqual({ ok: false, reason: "STRIPE_NOT_CONNECTED" });
  });

  it("returns STRIPE_NOT_CONNECTED when stripeAccountId is missing even if identity not verified", () => {
    expect(
      canPublish({
        stripeAccountId: null,
        identityStatus: null,
      }),
    ).toEqual({ ok: false, reason: "STRIPE_NOT_CONNECTED" });
  });

  it("returns IDENTITY_NOT_VERIFIED when identityStatus is null", () => {
    expect(
      canPublish({
        stripeAccountId: "acct_123",
        identityStatus: null,
      }),
    ).toEqual({ ok: false, reason: "IDENTITY_NOT_VERIFIED" });
  });

  it("returns IDENTITY_NOT_VERIFIED when identityStatus is 'pending'", () => {
    expect(
      canPublish({
        stripeAccountId: "acct_123",
        identityStatus: "pending",
      }),
    ).toEqual({ ok: false, reason: "IDENTITY_NOT_VERIFIED" });
  });

  it("returns IDENTITY_NOT_VERIFIED when identityStatus is 'failed'", () => {
    expect(
      canPublish({
        stripeAccountId: "acct_123",
        identityStatus: "failed",
      }),
    ).toEqual({ ok: false, reason: "IDENTITY_NOT_VERIFIED" });
  });
});
