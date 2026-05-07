import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";

const constructEvent = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEvent: { findUnique: vi.fn(), create: vi.fn() },
    booking: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((async (ops: unknown) => (Array.isArray(ops) ? ops : [])) as never),
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent } }),
  getStripeWebhookSecret: () => "whsec_dummy",
}));

const notifyHost = vi.fn();
const notifyHostOfRequest = vi.fn();
vi.mock("@/lib/notifications/booking-confirmed", () => ({
  getBookingConfirmedNotifier: () => ({ notifyHost, notifyHostOfRequest }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "@/app/api/payments/webhook/route";
import { prisma } from "@/lib/prisma";

function makeRequest(body: string): Request {
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": "sig" },
    body,
  });
}

const requestBookingFixture = {
  id: "bk-req-1",
  status: "PENDING_PAYMENT" as const,
  listingId: "list-r",
  userId: "user-1",
  amountCents: 600,
  platformFeeCents: 60,
  startsAt: new Date("2030-01-07T10:00:00Z"),
  endsAt: new Date("2030-01-07T10:30:00Z"),
  listing: {
    id: "list-r",
    title: "Bagno Sara",
    hostId: "host-1",
    bookingMode: "REQUEST" as const,
  },
  user: { id: "user-1", email: "marco@example.com", name: "Marco" },
};

describe("POST /api/payments/webhook (REQUEST mode)", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    notifyHost.mockReset();
    notifyHostOfRequest.mockReset();
    vi.mocked(prisma.stripeEvent.findUnique).mockReset();
    vi.mocked(prisma.stripeEvent.create).mockReset();
    vi.mocked(prisma.booking.findUnique).mockReset();
    vi.mocked(prisma.booking.update).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (ops: unknown) => (Array.isArray(ops) ? ops : [])) as never,
    );
  });

  it("transitions REQUEST booking to PENDING_HOST_APPROVAL with deadline + notifies host of request", async () => {
    constructEvent.mockReturnValue({
      id: "evt_req_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_req_1",
          metadata: { bookingId: "bk-req-1" },
          payment_intent: "pi_req_1",
        },
      },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(
      requestBookingFixture as never,
    );
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "host-1",
      email: "sara@example.com",
    } as never);

    const before = Date.now();
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PENDING_HOST_APPROVAL");

    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
    const updateCall = vi.mocked(prisma.booking.update).mock.calls[0]![0]!;
    const data = updateCall.data as {
      status: string;
      stripePaymentIntentId: string;
      hostDecisionDeadline: Date;
      confirmedAt?: Date;
    };
    expect(data.status).toBe("PENDING_HOST_APPROVAL");
    expect(data.stripePaymentIntentId).toBe("pi_req_1");
    expect(data.confirmedAt).toBeUndefined();
    const deadlineMs = data.hostDecisionDeadline.getTime();
    expect(deadlineMs - before).toBeGreaterThanOrEqual(29 * 60_000);
    expect(deadlineMs - before).toBeLessThanOrEqual(31 * 60_000);

    expect(notifyHostOfRequest).toHaveBeenCalledTimes(1);
    expect(notifyHost).not.toHaveBeenCalled();
  });

  it("is idempotent: a second event for an already PENDING_HOST_APPROVAL booking does not re-notify", async () => {
    constructEvent.mockReturnValue({
      id: "evt_req_2",
      type: "checkout.session.completed",
      data: { object: { metadata: { bookingId: "bk-req-1" } } },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...requestBookingFixture,
      status: "PENDING_HOST_APPROVAL",
    } as never);

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(notifyHostOfRequest).not.toHaveBeenCalled();
  });
});
