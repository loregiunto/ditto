import type { User } from "@prisma/client";

export type CanPublishReason =
  | "STRIPE_NOT_CONNECTED"
  | "IDENTITY_NOT_VERIFIED";

export type CanPublishResult =
  | { ok: true }
  | { ok: false; reason: CanPublishReason };

export function canPublish(
  user: Pick<User, "stripeAccountId" | "identityStatus">,
): CanPublishResult {
  if (!user.stripeAccountId) {
    return { ok: false, reason: "STRIPE_NOT_CONNECTED" };
  }
  if (user.identityStatus !== "verified") {
    return { ok: false, reason: "IDENTITY_NOT_VERIFIED" };
  }
  return { ok: true };
}

export const CAN_PUBLISH_REASON_MESSAGES: Record<CanPublishReason, string> = {
  STRIPE_NOT_CONNECTED:
    "Devi completare l'onboarding Stripe Connect prima di pubblicare il listing.",
  IDENTITY_NOT_VERIFIED:
    "Devi completare la verifica identità prima di pubblicare il listing.",
};
