-- CreateEnum
CREATE TYPE "ConsultationKind" AS ENUM ('PRODUCT', 'INTERIOR', 'CUSTOM', 'SHOWROOM', 'MATERIAL');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "EnquiryStatus_new" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'AWAITING_RESPONSE', 'CONSULTATION_SCHEDULED', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."Enquiry" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Enquiry" ALTER COLUMN "status" TYPE "EnquiryStatus_new" USING ("status"::text::"EnquiryStatus_new");
ALTER TYPE "EnquiryStatus" RENAME TO "EnquiryStatus_old";
ALTER TYPE "EnquiryStatus_new" RENAME TO "EnquiryStatus";
DROP TYPE "public"."EnquiryStatus_old";
ALTER TABLE "Enquiry" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterTable
-- `reference` is added nullable and backfilled before the NOT NULL is set, so
-- this migration also runs on a database that already holds enquiries. The
-- backfilled value has the same shape as a generated one: MN-YYMM-XXXX.
ALTER TABLE "Enquiry" ADD COLUMN     "reference" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "response" TEXT,
ADD COLUMN     "subject" TEXT,
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

UPDATE "Enquiry"
SET "reference" = 'MN-' || to_char("createdAt", 'YYMM') || '-' ||
                  upper(substr(md5("id" || random()::text), 1, 4))
WHERE "reference" IS NULL;

ALTER TABLE "Enquiry" ALTER COLUMN "reference" SET NOT NULL;

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ConsultationKind" NOT NULL DEFAULT 'SHOWROOM',
    "status" "ConsultationStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "minutes" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "consultant" TEXT,
    "note" TEXT,
    "productId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "userId" TEXT NOT NULL,
    "enquiryUpdates" BOOLEAN NOT NULL DEFAULT true,
    "consultationReminders" BOOLEAN NOT NULL DEFAULT true,
    "productUpdates" BOOLEAN NOT NULL DEFAULT false,
    "newCollections" BOOLEAN NOT NULL DEFAULT false,
    "promotions" BOOLEAN NOT NULL DEFAULT false,
    "preferredChannel" TEXT NOT NULL DEFAULT 'email',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_reference_key" ON "Consultation"("reference");

-- CreateIndex
CREATE INDEX "Consultation_userId_idx" ON "Consultation"("userId");

-- CreateIndex
CREATE INDEX "Consultation_status_idx" ON "Consultation"("status");

-- CreateIndex
CREATE INDEX "Consultation_requestedAt_idx" ON "Consultation"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_reference_key" ON "Enquiry"("reference");

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

