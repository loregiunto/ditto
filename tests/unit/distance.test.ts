import { describe, it, expect } from "vitest";
import {
  haversineDistanceKm,
  filterListingsByRadius,
} from "@/lib/geo/distance";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceKm({ latitude: 41.9, longitude: 12.5 }, { latitude: 41.9, longitude: 12.5 })).toBe(0);
  });

  it("approximates 111 km for 1 degree of latitude", () => {
    const d = haversineDistanceKm(
      { latitude: 41, longitude: 12 },
      { latitude: 42, longitude: 12 },
    );
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("is symmetric", () => {
    const a = { latitude: 41.9028, longitude: 12.4964 };
    const b = { latitude: 45.4642, longitude: 9.19 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 9);
  });
});

describe("filterListingsByRadius", () => {
  const center = { latitude: 41.9028, longitude: 12.4964 };
  const near = { id: "near", latitude: 41.905, longitude: 12.4964 };
  const far = { id: "far", latitude: 41.95, longitude: 12.4964 };

  it("includes points strictly inside radius", () => {
    const out = filterListingsByRadius([near, far], center, 1);
    expect(out).toEqual([near]);
  });

  it("includes points exactly on the radius boundary", () => {
    const onEdge = { id: "edge", ...center };
    const out = filterListingsByRadius([onEdge], center, 1);
    expect(out).toEqual([onEdge]);
  });

  it("returns [] for empty input", () => {
    expect(filterListingsByRadius([], center, 1)).toEqual([]);
  });
});
