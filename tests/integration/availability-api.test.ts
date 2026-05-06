import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    availabilityRule: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { GET, PUT } from "@/app/api/listings/[id]/availability/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const baseUser = {
  id: "host-1",
  supabaseId: "supa-1",
  email: "host@example.com",
  name: null,
  image: null,
  stripeAccountId: null as string | null,
  identityStatus: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ownListing = { id: "listing-1", hostId: "host-1" };
const otherListing = { id: "listing-1", hostId: "host-other" };

function makeRequest(method: "GET" | "PUT", body?: unknown): Request {
  return new Request("http://localhost/api/listings/listing-1/availability", {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body:
      body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: "listing-1" });

beforeEach(() => {
  vi.mocked(getCurrentUser).mockReset();
  vi.mocked(prisma.listing.findUnique).mockReset();
  vi.mocked(prisma.listing.update).mockReset();
  vi.mocked(prisma.listing.delete).mockReset();
  vi.mocked(prisma.availabilityRule.findMany).mockReset();
  vi.mocked(prisma.availabilityRule.deleteMany).mockReset();
  vi.mocked(prisma.availabilityRule.createMany).mockReset();
  vi.mocked(prisma.$transaction).mockReset();
  vi.mocked(revalidatePath).mockReset();
});

describe("GET /api/listings/[id]/availability", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await GET(makeRequest("GET"), { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when listing belongs to another host", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      otherListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const res = await GET(makeRequest("GET"), { params });
    expect(res.status).toBe(404);
  });

  it("returns 404 when listing not found", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);
    const res = await GET(makeRequest("GET"), { params });
    expect(res.status).toBe(404);
  });

  it("returns ordered rules on happy path", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const rows = [
      { id: "r1", dayOfWeek: 0, startMinute: 540, endMinute: 780 },
      { id: "r2", dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
    ];
    vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue(
      rows as Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>,
    );

    const res = await GET(makeRequest("GET"), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rules).toEqual(rows);

    const findArgs = vi.mocked(prisma.availabilityRule.findMany).mock.calls[0][0];
    expect(findArgs?.orderBy).toEqual([
      { dayOfWeek: "asc" },
      { startMinute: "asc" },
    ]);
  });
});

describe("PUT /api/listings/[id]/availability", () => {
  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await PUT(makeRequest("PUT", { rules: [] }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    const res = await PUT(makeRequest("PUT", "not-json{"), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 on overlapping windows", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    const res = await PUT(
      makeRequest("PUT", {
        rules: [
          { dayOfWeek: 0, startMinute: 540, endMinute: 780 },
          { dayOfWeek: 0, startMinute: 720, endMinute: 900 },
        ],
      }),
      { params },
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 on values not multiple of 30", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    const res = await PUT(
      makeRequest("PUT", {
        rules: [{ dayOfWeek: 0, startMinute: 545, endMinute: 600 }],
      }),
      { params },
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 on ownership mismatch", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      otherListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    const res = await PUT(makeRequest("PUT", { rules: [] }), { params });
    expect(res.status).toBe(404);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("replaces rules transactionally and revalidates the dashboard path", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 0 }, { count: 2 }]);
    const newRows = [
      { id: "n1", dayOfWeek: 0, startMinute: 540, endMinute: 780 },
      { id: "n2", dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
    ];
    vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue(
      newRows as Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>,
    );

    const res = await PUT(
      makeRequest("PUT", {
        rules: [
          { dayOfWeek: 0, startMinute: 540, endMinute: 780 },
          { dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
        ],
      }),
      { params },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rules).toEqual(newRows);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.availabilityRule.deleteMany).toHaveBeenCalledWith({
      where: { listingId: "listing-1" },
    });
    expect(prisma.availabilityRule.createMany).toHaveBeenCalledWith({
      data: [
        { listingId: "listing-1", dayOfWeek: 0, startMinute: 540, endMinute: 780 },
        { listingId: "listing-1", dayOfWeek: 2, startMinute: 1080, endMinute: 1320 },
      ],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/host/dashboard");

    // PUT must never touch the Listing row itself
    expect(prisma.listing.update).not.toHaveBeenCalled();
    expect(prisma.listing.delete).not.toHaveBeenCalled();
  });

  it("accepts an empty rules array (clears all availability)", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(baseUser);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(
      ownListing as Awaited<ReturnType<typeof prisma.listing.findUnique>>,
    );
    vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, { count: 0 }]);
    vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue(
      [] as Awaited<ReturnType<typeof prisma.availabilityRule.findMany>>,
    );

    const res = await PUT(makeRequest("PUT", { rules: [] }), { params });
    expect(res.status).toBe(200);
    expect(prisma.availabilityRule.createMany).toHaveBeenCalledWith({ data: [] });
  });
});
