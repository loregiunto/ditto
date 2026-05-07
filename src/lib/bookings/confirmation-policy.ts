/**
 * Booking confirmation page visibility rules.
 * Pure helpers used by the confirmation page and exercised by tests so we
 * never accidentally reveal the exact address pre-capture.
 */

export function shouldRevealAddress(status: string): boolean {
  return status === "CONFIRMED";
}

export type ConfirmationStatusKey =
  | "CONFIRMED"
  | "PENDING_PAYMENT"
  | "PENDING_HOST_APPROVAL"
  | "REJECTED"
  | "EXPIRED"
  | "OTHER";

export function classifyStatus(status: string): ConfirmationStatusKey {
  if (status === "CONFIRMED") return "CONFIRMED";
  if (status === "PENDING_PAYMENT") return "PENDING_PAYMENT";
  if (status === "PENDING_HOST_APPROVAL") return "PENDING_HOST_APPROVAL";
  if (status === "REJECTED") return "REJECTED";
  if (status === "EXPIRED") return "EXPIRED";
  return "OTHER";
}
