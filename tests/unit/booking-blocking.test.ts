import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { booking: { findMany: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { getBlockingBookingsForListing } from "@/lib/bookings/queries";

type WhereClause = {
  OR: Array<{ status: string; pendingExpiresAt?: { gt: Date }; hostDecisionDeadline?: { gt: Date } }>;
};

describe("getBlockingBookingsForListing", () => {
  beforeEach(() => {
    vi.mocked(prisma.booking.findMany).mockReset();
    vi.mocked(prisma.booking.findMany).mockResolvedValue([]);
  });

  it("includes CONFIRMED, live PENDING_PAYMENT and live PENDING_HOST_APPROVAL", async () => {
    const now = new Date("2030-01-07T10:00:00Z");
    await getBlockingBookingsForListing("list-1", { now });
    const args = vi.mocked(prisma.booking.findMany).mock.calls[0]![0]!;
    const where = args.where as WhereClause;
    const statuses = where.OR.map((c) => c.status);
    expect(statuses).toEqual(
      expect.arrayContaining(["CONFIRMED", "PENDING_PAYMENT", "PENDING_HOST_APPROVAL"]),
    );
    const requestEntry = where.OR.find((c) => c.status === "PENDING_HOST_APPROVAL");
    expect(requestEntry?.hostDecisionDeadline).toEqual({ gt: now });
    const pendingPayment = where.OR.find((c) => c.status === "PENDING_PAYMENT");
    expect(pendingPayment?.pendingExpiresAt).toEqual({ gt: now });
  });

  it("returns intervals from prisma rows", async () => {
    const startsAt = new Date("2030-01-07T10:00:00Z");
    const endsAt = new Date("2030-01-07T10:30:00Z");
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { startsAt, endsAt },
    ] as never);
    const out = await getBlockingBookingsForListing("list-1");
    expect(out).toEqual([{ startsAt, endsAt }]);
  });
});
