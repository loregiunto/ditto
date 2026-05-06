import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { availabilityInputSchema } from "@/lib/validation/availability";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  });

  if (!listing || listing.hostId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rules = await prisma.availabilityRule.findMany({
    where: { listingId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startMinute: true,
      endMinute: true,
    },
  });

  return NextResponse.json({ rules }, { status: 200 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let body: { rules: { dayOfWeek: number; startMinute: number; endMinute: number }[] };
  try {
    body = availabilityInputSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, hostId: true },
  });

  if (!listing || listing.hostId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { listingId: id } }),
    prisma.availabilityRule.createMany({
      data: body.rules.map((r) => ({
        listingId: id,
        dayOfWeek: r.dayOfWeek,
        startMinute: r.startMinute,
        endMinute: r.endMinute,
      })),
    }),
  ]);

  const rules = await prisma.availabilityRule.findMany({
    where: { listingId: id },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    select: {
      id: true,
      dayOfWeek: true,
      startMinute: true,
      endMinute: true,
    },
  });

  revalidatePath("/host/dashboard");

  return NextResponse.json({ rules }, { status: 200 });
}
