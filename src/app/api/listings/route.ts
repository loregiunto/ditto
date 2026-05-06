import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { listingInputSchema } from "@/lib/validation/listing";
import { geocodeAddress, GeocodingError } from "@/lib/mapbox";

const STORAGE_BUCKET = "listing-photos";

function buildPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let input;
  try {
    input = listingInputSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  // Verifica ownership: ogni foto deve vivere sotto {user.supabaseId}/...
  const userPrefix = `${user.supabaseId}/`;
  const invalidPath = input.photos.find((p) => !p.path.startsWith(userPrefix));
  if (invalidPath) {
    return NextResponse.json(
      { error: "Path foto non autorizzato" },
      { status: 403 },
    );
  }

  let geocoded;
  try {
    geocoded = await geocodeAddress(input.address);
  } catch (err) {
    const message =
      err instanceof GeocodingError ? err.message : "Errore di geocodifica";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      hostId: user.id,
      title: input.title,
      description: input.description,
      hostType: input.hostType,
      addressFull: geocoded.addressFull,
      addressDisplay: geocoded.addressDisplay,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      hourlyPriceCents: input.hourlyPriceCents,
      photos: {
        createMany: {
          data: input.photos.map((p) => ({
            url: buildPublicUrl(p.path),
            order: p.order,
          })),
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
