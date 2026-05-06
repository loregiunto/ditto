import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GET } from "@/app/api/geocode/search/route";

const ORIGINAL_FETCH = global.fetch;

describe("GET /api/geocode/search", () => {
  beforeEach(() => {
    process.env.MAPBOX_ACCESS_TOKEN = "test-token";
  });
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  function makeReq(qs: string): Request {
    return new Request(`http://localhost/api/geocode/search${qs}`);
  }

  it("returns 400 when q is missing", async () => {
    const res = await GET(makeReq(""));
    expect(res.status).toBe(400);
  });

  it("returns 400 when q is shorter than 2 characters after trim", async () => {
    const res = await GET(makeReq("?q=%20a%20"));
    expect(res.status).toBe(400);
  });

  it("returns 200 with results array on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "address.1",
            place_name: "Via del Corso 100, Roma, Italia",
            center: [12.481, 41.901],
            text: "Via del Corso 100",
            context: [
              { id: "neighborhood.1", text: "Centro" },
              { id: "place.1", text: "Roma" },
            ],
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const res = await GET(makeReq("?q=Via%20del%20Corso"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=60");
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      id: "address.1",
      addressDisplay: "Centro, Roma",
      latitude: 41.901,
      longitude: 12.481,
    });
  });

  it("does not leak the access token in the response body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    }) as unknown as typeof fetch;
    const res = await GET(makeReq("?q=Roma"));
    const text = await res.text();
    expect(text).not.toContain("test-token");
  });

  it("returns 502 when Mapbox returns an error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;
    const res = await GET(makeReq("?q=Roma"));
    expect(res.status).toBe(502);
  });
});
