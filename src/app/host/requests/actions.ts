"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { decideBooking } from "@/lib/bookings/decision";

export async function approveBookingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  await decideBooking({
    action: "approve",
    bookingId,
    hostUserId: user.id,
    hostEmail: user.email,
  });
}

export async function rejectBookingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return;
  await decideBooking({
    action: "reject",
    bookingId,
    hostUserId: user.id,
    hostEmail: user.email,
  });
}
