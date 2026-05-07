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

export type BookingRequestPayload = BookingConfirmedPayload & {
  hostDecisionDeadline: Date;
};

export type BookingDecisionPayload = BookingConfirmedPayload & {
  addressFull?: string;
};

export type BookingExpiredPayload = BookingConfirmedPayload;

export interface BookingConfirmedNotifier {
  notifyHost(payload: BookingConfirmedPayload): Promise<void>;
  notifyHostOfRequest?(payload: BookingRequestPayload): Promise<void>;
  notifyGuestOfApproval?(payload: BookingDecisionPayload): Promise<void>;
  notifyGuestOfRejection?(payload: BookingDecisionPayload): Promise<void>;
  notifyGuestOfExpiration?(payload: BookingExpiredPayload): Promise<void>;
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

  async notifyHostOfRequest(payload: BookingRequestPayload): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    console.info("[booking-request] notify host", {
      bookingId: payload.bookingId,
      hostEmail: payload.hostEmail,
      deadline: payload.hostDecisionDeadline.toISOString(),
    });
  }

  async notifyGuestOfApproval(payload: BookingDecisionPayload): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    console.info("[booking-approved] notify guest", {
      bookingId: payload.bookingId,
      guestEmail: payload.guestEmail,
    });
  }

  async notifyGuestOfRejection(payload: BookingDecisionPayload): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    console.info("[booking-rejected] notify guest", {
      bookingId: payload.bookingId,
      guestEmail: payload.guestEmail,
    });
  }

  async notifyGuestOfExpiration(payload: BookingExpiredPayload): Promise<void> {
    if (process.env.NODE_ENV === "test") return;
    console.info("[booking-expired] notify guest", {
      bookingId: payload.bookingId,
      guestEmail: payload.guestEmail,
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
