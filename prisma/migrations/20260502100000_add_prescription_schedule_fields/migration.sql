-- AlterTable
ALTER TABLE "prescriptions" ADD COLUMN "first_scheduled_at" TIMESTAMP(3);
ALTER TABLE "prescriptions" ADD COLUMN "interval_hours" INTEGER;

-- Backfill existing prescriptions so the new required fields can be enforced.
UPDATE "prescriptions"
SET
    "first_scheduled_at" = "start_date",
    "interval_hours" = 24
WHERE "first_scheduled_at" IS NULL
   OR "interval_hours" IS NULL;

-- AlterTable
ALTER TABLE "prescriptions" ALTER COLUMN "first_scheduled_at" SET NOT NULL;
ALTER TABLE "prescriptions" ALTER COLUMN "interval_hours" SET NOT NULL;

-- CreateIndex
CREATE INDEX "prescriptions_first_scheduled_at_idx" ON "prescriptions"("first_scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "medication_administrations_prescription_id_scheduled_at_key" ON "medication_administrations"("prescription_id", "scheduled_at");

-- AddConstraint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_interval_hours_check" CHECK ("interval_hours" > 0);
