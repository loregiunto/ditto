import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";

const constructEvent = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    stripeEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    booking: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((async (ops: unknown) => (Array.isArray(ops) ? ops : [])) as never),
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: { constructEvent },
  }),
  getStripeWebhookSecret: () => "whsec_dummy",
}));

const notifyHost = vi.fn();
vi.mock("@/lib/notifications/booking-confirmed", () => ({
  getBookingConfirmedNotifier: () => ({ notifyHost }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { POST } from "@/app/api/payments/webhook/route";
import { prisma } from "@/lib/prisma";

function makeRequest(body: string, signature: string | null): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (signature) headers["stripe-signature"] = signature;
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    headers,
    body,
  });
}

const bookingFixture = {
  id: "bk-1",
  status: "PENDING_PAYMENT" as const,
  listingId: "list-1",
  userId: "user-1",
  amountCents: 200,
  platformFeeCents: 20,
  startsAt: new Date("2030-01-07T10:00:00Z"),
  endsAt: new Date("2030-01-07T10:30:00Z"),
  listing: { id: "list-1", title: "Bagno", hostId: "host-1" },
  user: { id: "user-1", email: "marco@example.com", name: "Marco" },
};

describe("POST /api/payments/webhook", () => {
  beforeEach(() => {
    constructEvent.mockReset();
    notifyHost.mockReset();
    vi.mocked(prisma.stripeEvent.findUnique).mockReset();
    vi.mocked(prisma.stripeEvent.create).mockReset();
    vi.mocked(prisma.booking.findUnique).mockReset();
    vi.mocked(prisma.booking.update).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(prisma.$transaction).mockImplementation((async (ops: unknown) => (Array.isArray(ops) ? ops : [])) as never);
  });

  it("rejects request without signature", async () => {
    const res = await POST(makeRequest("{}", null));
    expect(res.status).toBe(400);
  });

  it("rejects invalid signature", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("invalid");
    });
    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(400);
  });

  it("ignores duplicate events", async () => {
    constructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { metadata: { bookingId: "bk-1" } } },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue({
      id: "evt_1",
    } as never);
    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  it("ignores non checkout.session.completed events", async () => {
    constructEvent.mockReturnValue({
      id: "evt_2",
      type: "payment_intent.created",
      data: { object: {} },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.stripeEvent.create).mockResolvedValue({} as never);
    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ignored).toBe(true);
  });

  it("confirms booking on checkout.session.completed", async () => {
    constructEvent.mockReturnValue({
      id: "evt_3",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          metadata: { bookingId: "bk-1" },
          payment_intent: "pi_1",
        },
      },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.stripeEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(bookingFixture as never);
    vi.mocked(prisma.booking.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "host-1",
      email: "host@example.com",
    } as never);
    notifyHost.mockResolvedValue(undefined);

    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "bk-1" },
        data: expect.objectContaining({
          status: "CONFIRMED",
          stripePaymentIntentId: "pi_1",
          stripeCheckoutSessionId: "cs_test_1",
        }),
      }),
    );
    expect(notifyHost).toHaveBeenCalledTimes(1);
    // Address must NEVER be in the public response payload.
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/address/i);
  });

  it("returns 404 when booking is missing", async () => {
    constructEvent.mockReturnValue({
      id: "evt_4",
      type: "checkout.session.completed",
      data: { object: { metadata: { bookingId: "bk-missing" } } },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.stripeEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(404);
  });

  it("does not double-confirm an already confirmed booking", async () => {
    constructEvent.mockReturnValue({
      id: "evt_5",
      type: "checkout.session.completed",
      data: { object: { metadata: { bookingId: "bk-1" } } },
    });
    vi.mocked(prisma.stripeEvent.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.stripeEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...bookingFixture,
      status: "CONFIRMED",
    } as never);
    const res = await POST(makeRequest("{}", "sig"));
    expect(res.status).toBe(200);
    expect(prisma.booking.update).not.toHaveBeenCalled();
    expect(notifyHost).not.toHaveBeenCalled();
  });
});
