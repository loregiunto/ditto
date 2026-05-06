import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import {
  canPublish,
  CAN_PUBLISH_REASON_MESSAGES,
} from "@/lib/listings/can-publish";

const bodySchema = z
  .object({
    status: z.enum(["active", "inactive"]),
  })
  .strict();

export async function PATCH(
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

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(raw);
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
    select: { id: true, hostId: true, status: true },
  });

  if (!listing || listing.hostId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus = body.status === "active" ? "ACTIVE" : "INACTIVE";

  if (nextStatus === "ACTIVE") {
    const gate = canPublish(user);
    if (!gate.ok) {
      return NextResponse.json(
        {
          error: CAN_PUBLISH_REASON_MESSAGES[gate.reason],
          reason: gate.reason,
        },
        { status: 422 },
      );
    }
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: nextStatus },
    select: { id: true, status: true },
  });

  revalidatePath("/host/dashboard");
  revalidatePath("/");

  return NextResponse.json(updated, { status: 200 });
}
