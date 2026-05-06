import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

// Mocks must be declared before importing the route.
vi.mock("@/lib/user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mapbox", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mapbox")>(
    "@/lib/mapbox",
  );
  return {
    ...actual,
    geocodeAddress: vi.fn(),
  };
});

import { POST } from "@/app/api/listings/route";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { geocodeAddress, GeocodingError } from "@/lib/mapbox";

const validBody = {
  title: "Bagno luminoso in centro",
  description: "Spazio pulito e privato, riscaldato e con tutto il necessario.",
  hostType: "PRIVATE",
  address: "Via Roma 1, Firenze",
  hourlyPriceCents: 400,
  photos: [{ path: "supabase-uid/drafts/d1/photo.jpg", order: 0 }],
};

const mockUser = {
  id: "user-uuid",
  supabaseId: "supabase-uid",
  email: "host@example.com",
  name: null,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGeocode = {
  addressFull: "Via Roma 1, Firenze, Italia",
  addressDisplay: "Centro, Firenze",
  latitude: 43.77,
  longitude: 11.25,
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/listings", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(prisma.listing.create).mockReset();
    vi.mocked(geocodeAddress).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    const res = await POST(makeRequest("not-json{"));
    expect(res.status).toBe(400);
  });

  it("returns 400 on validation failure", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    const res = await POST(makeRequest({ ...validBody, title: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns 400 when geocoding fails", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(geocodeAddress).mockRejectedValue(
      new GeocodingError("Indirizzo non trovato"),
    );
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Indirizzo non trovato");
  });

  it("creates listing and returns 201 on happy path", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(geocodeAddress).mockResolvedValue(mockGeocode);
    vi.mocked(prisma.listing.create).mockResolvedValue({
      id: "listing-uuid",
    } as Awaited<ReturnType<typeof prisma.listing.create>>);

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("listing-uuid");

    expect(prisma.listing.create).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(prisma.listing.create).mock.calls[0][0];
    expect(arg.data.hostId).toBe(mockUser.id);
    expect(arg.data.addressFull).toBe(mockGeocode.addressFull);
    expect(arg.data.addressDisplay).toBe(mockGeocode.addressDisplay);
    const photos = arg.data.photos as { createMany: { data: unknown[] } };
    expect(photos.createMany.data).toHaveLength(1);
  });

  it("rejects more than 10 photos", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    const photos = Array.from({ length: 11 }, (_, i) => ({
      path: `supabase-uid/drafts/d/${i}.jpg`,
      order: i,
    }));
    const res = await POST(makeRequest({ ...validBody, photos }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when photo path does not belong to the user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    const res = await POST(
      makeRequest({
        ...validBody,
        photos: [{ path: "other-user/drafts/d/photo.jpg", order: 0 }],
      }),
    );
    expect(res.status).toBe(403);
  });

  it("persists addressFull and addressDisplay separately and saves DRAFT status", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(geocodeAddress).mockResolvedValue(mockGeocode);
    vi.mocked(prisma.listing.create).mockResolvedValue({
      id: "listing-uuid",
    } as Awaited<ReturnType<typeof prisma.listing.create>>);

    await POST(makeRequest(validBody));

    const arg = vi.mocked(prisma.listing.create).mock.calls[0][0];
    expect(arg.data.addressFull).toBe(mockGeocode.addressFull);
    expect(arg.data.addressDisplay).toBe(mockGeocode.addressDisplay);
    expect(arg.data.addressFull).not.toBe(arg.data.addressDisplay);
    // status is omitted from create — Prisma defaults to DRAFT (verified at schema level)
    expect(arg.data.status).toBeUndefined();
  });

  it("builds public URL from path using SUPABASE_URL", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(geocodeAddress).mockResolvedValue(mockGeocode);
    vi.mocked(prisma.listing.create).mockResolvedValue({
      id: "listing-uuid",
    } as Awaited<ReturnType<typeof prisma.listing.create>>);

    await POST(makeRequest(validBody));
    const arg = vi.mocked(prisma.listing.create).mock.calls[0][0];
    const photos = arg.data.photos as { createMany: { data: { url: string }[] } };
    expect(photos.createMany.data[0].url).toBe(
      "https://test.supabase.co/storage/v1/object/public/listing-photos/supabase-uid/drafts/d1/photo.jpg",
    );
  });
});
