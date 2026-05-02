-- CreateEnum
CREATE TYPE "MedicationAdministrationStatus" AS ENUM ('pending', 'administered', 'refused', 'missed', 'canceled');

-- CreateTable
CREATE TABLE "medication_administrations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "caregiver_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "administered_at" TIMESTAMP(3),
    "status" "MedicationAdministrationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_administrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_administrations_company_id_idx" ON "medication_administrations"("company_id");

-- CreateIndex
CREATE INDEX "medication_administrations_prescription_id_idx" ON "medication_administrations"("prescription_id");

-- CreateIndex
CREATE INDEX "medication_administrations_resident_id_idx" ON "medication_administrations"("resident_id");

-- CreateIndex
CREATE INDEX "medication_administrations_caregiver_id_idx" ON "medication_administrations"("caregiver_id");

-- CreateIndex
CREATE INDEX "medication_administrations_scheduled_at_idx" ON "medication_administrations"("scheduled_at");

-- CreateIndex
CREATE INDEX "medication_administrations_status_idx" ON "medication_administrations"("status");

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
