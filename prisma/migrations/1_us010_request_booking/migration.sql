-- US-010: extend BookingStatus and Booking with host approval fields

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'PENDING_HOST_APPROVAL';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "hostDecisionDeadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hostDecidedAt" TIMESTAMP(3);
