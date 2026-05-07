import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { decideBooking } from "@/lib/bookings/decision";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const outcome = await decideBooking({
    action: "approve",
    bookingId: id,
    hostUserId: user.id,
    hostEmail: user.email,
  });

  switch (outcome.kind) {
    case "ok":
      return NextResponse.json({ ok: true, status: outcome.status });
    case "already_decided":
      return NextResponse.json({ ok: true, alreadyConfirmed: true });
    case "not_found":
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    case "forbidden":
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    case "invalid_status":
      return NextResponse.json(
        { error: "Invalid status", code: "invalid_status" },
        { status: 409 },
      );
    case "deadline_expired":
      return NextResponse.json(
        { error: "Decision deadline expired", code: "deadline_expired" },
        { status: 410 },
      );
  }
}
