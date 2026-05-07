import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.CRON_SECRET = "cron-secret-test";

const cancel = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { cancel } }),
}));

const notifyGuestOfExpiration = vi.fn();
vi.mock("@/lib/notifications/booking-confirmed", () => ({
  getBookingConfirmedNotifier: () => ({ notifyGuestOfExpiration }),
}));

import { expireStaleRequests } from "@/lib/bookings/expiration";
import { GET } from "@/app/api/bookings/cron/expire-requests/route";
import { prisma } from "@/lib/prisma";

const candidate = {
  id: "bk-exp-1",
  status: "PENDING_HOST_APPROVAL" as const,
  stripePaymentIntentId: "pi_exp_1",
  hostDecisionDeadline: new Date("2030-01-07T09:00:00Z"),
  amountCents: 600,
  platformFeeCents: 60,
  startsAt: new Date("2030-01-07T10:00:00Z"),
  endsAt: new Date("2030-01-07T10:30:00Z"),
  listing: { id: "list-1", title: "Bagno", hostId: "host-1" },
  user: { id: "guest-1", email: "marco@example.com", name: "Marco" },
};

describe("expireStaleRequests + cron endpoint", () => {
  beforeEach(() => {
    vi.mocked(prisma.booking.findMany).mockReset();
    vi.mocked(prisma.booking.updateMany).mockReset();
    cancel.mockReset();
    notifyGuestOfExpiration.mockReset();
  });

  it("no candidates → no-op", async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([] as never);
    const result = await expireStaleRequests();
    expect(result).toEqual({ scanned: 0, expired: 0, skipped: 0 });
    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels PI and flips to EXPIRED for each stale candidate", async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([candidate] as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 } as never);
    cancel.mockResolvedValue({});

    const result = await expireStaleRequests();
    expect(cancel).toHaveBeenCalledWith("pi_exp_1");
    expect(prisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk-exp-1", status: "PENDING_HOST_APPROVAL" },
        data: expect.objectContaining({ status: "EXPIRED" }),
      }),
    );
    expect(result.expired).toBe(1);
    expect(notifyGuestOfExpiration).toHaveBeenCalledTimes(1);
  });

  it("CAS no-op counted as skipped", async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([candidate] as never);
    vi.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 } as never);
    cancel.mockResolvedValue({});
    const result = await expireStaleRequests();
    expect(result.expired).toBe(0);
    expect(result.skipped).toBe(1);
    expect(notifyGuestOfExpiration).not.toHaveBeenCalled();
  });

  it("Stripe error propagates without marking EXPIRED", async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([candidate] as never);
    cancel.mockRejectedValue(new Error("network"));
    await expect(expireStaleRequests()).rejects.toThrow("network");
    expect(prisma.booking.updateMany).not.toHaveBeenCalled();
  });

  it("cron endpoint requires CRON_SECRET", async () => {
    const res = await GET(new Request("http://localhost/api/bookings/cron/expire-requests"));
    expect(res.status).toBe(401);
  });

  it("cron endpoint accepts bearer secret", async () => {
    vi.mocked(prisma.booking.findMany).mockResolvedValue([] as never);
    const res = await GET(
      new Request("http://localhost/api/bookings/cron/expire-requests", {
        headers: { authorization: "Bearer cron-secret-test" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
