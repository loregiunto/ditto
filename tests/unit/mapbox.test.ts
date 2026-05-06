import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { __testing, geocodeAddress, GeocodingError } from "@/lib/mapbox";

const { deriveDisplay } = __testing;

describe("deriveDisplay", () => {
  it("uses neighborhood + place when both present", () => {
    expect(
      deriveDisplay({
        place_name: "Via Roma 1, Centro Storico, Firenze, Italia",
        center: [11.25, 43.77],
        text: "Via Roma 1",
        context: [
          { id: "neighborhood.1", text: "Centro Storico" },
          { id: "place.1", text: "Firenze" },
          { id: "region.1", text: "Toscana" },
          { id: "country.1", text: "Italia" },
        ],
      }),
    ).toBe("Centro Storico, Firenze");
  });

  it("falls back to locality when neighborhood missing", () => {
    expect(
      deriveDisplay({
        place_name: "Address",
        center: [0, 0],
        text: "x",
        context: [
          { id: "locality.1", text: "Settignano" },
          { id: "place.1", text: "Firenze" },
        ],
      }),
    ).toBe("Settignano, Firenze");
  });

  it("returns city only when zone missing", () => {
    expect(
      deriveDisplay({
        place_name: "x",
        center: [0, 0],
        text: "x",
        context: [{ id: "place.1", text: "Firenze" }],
      }),
    ).toBe("Firenze");
  });

  it("falls back to feature.text when context empty", () => {
    expect(
      deriveDisplay({
        place_name: "Some Place, Country",
        center: [0, 0],
        text: "Some Place",
        context: [],
      }),
    ).toBe("Some Place");
  });
});

describe("geocodeAddress", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.MAPBOX_ACCESS_TOKEN = "test-token";
  });
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("throws when token missing", async () => {
    delete process.env.MAPBOX_ACCESS_TOKEN;
    await expect(geocodeAddress("Via Roma 1")).rejects.toBeInstanceOf(
      GeocodingError,
    );
  });

  it("throws on empty address", async () => {
    await expect(geocodeAddress("   ")).rejects.toBeInstanceOf(GeocodingError);
  });

  it("throws on Mapbox HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;
    await expect(geocodeAddress("Via Roma 1")).rejects.toBeInstanceOf(
      GeocodingError,
    );
  });

  it("throws when no features returned", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    }) as unknown as typeof fetch;
    await expect(geocodeAddress("Via NonEsiste")).rejects.toBeInstanceOf(
      GeocodingError,
    );
  });

  it("returns parsed result on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            place_name: "Via Roma 1, Firenze, Italia",
            center: [11.25, 43.77],
            text: "Via Roma 1",
            context: [
              { id: "neighborhood.1", text: "Centro" },
              { id: "place.1", text: "Firenze" },
            ],
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const result = await geocodeAddress("Via Roma 1");
    expect(result).toEqual({
      addressFull: "Via Roma 1, Firenze, Italia",
      addressDisplay: "Centro, Firenze",
      latitude: 43.77,
      longitude: 11.25,
    });
  });
});
