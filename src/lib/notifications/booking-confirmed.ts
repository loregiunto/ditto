export type BookingConfirmedPayload = {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  hostId: string;
  hostEmail: string;
  guestName: string | null;
  guestEmail: string;
  startsAt: Date;
  endsAt: Date;
  amountCents: number;
  platformFeeCents: number;
};

export interface BookingConfirmedNotifier {
  notifyHost(payload: BookingConfirmedPayload): Promise<void>;
}

class LogNotifier implements BookingConfirmedNotifier {
  async notifyHost(payload: BookingConfirmedPayload): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    console.info("[booking-confirmed] notify host", {
      bookingId: payload.bookingId,
      hostEmail: payload.hostEmail,
      startsAt: payload.startsAt.toISOString(),
      hostNetCents: payload.amountCents - payload.platformFeeCents,
    });
  }
}

let notifier: BookingConfirmedNotifier = new LogNotifier();

export function getBookingConfirmedNotifier(): BookingConfirmedNotifier {
  return notifier;
}

export function setBookingConfirmedNotifierForTests(
  next: BookingConfirmedNotifier,
): void {
  notifier = next;
}

export function resetBookingConfirmedNotifierForTests(): void {
  notifier = new LogNotifier();
}
