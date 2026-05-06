import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { searchAddresses, GeocodingError } from "@/lib/mapbox";
import { GEOCODE_AUTOCOMPLETE_LIMIT } from "@/lib/listings/discovery";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 2, "Query must be at least 2 characters"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = { q: url.searchParams.get("q") ?? "" };

  let parsed: z.infer<typeof querySchema>;
  try {
    parsed = querySchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  try {
    const results = await searchAddresses(parsed.q, {
      limit: GEOCODE_AUTOCOMPLETE_LIMIT,
      country: "IT",
    });
    return NextResponse.json(
      { results },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=60" },
      },
    );
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json(
        { error: "Geocoding failed" },
        { status: 502 },
      );
    }
    throw err;
  }
}
