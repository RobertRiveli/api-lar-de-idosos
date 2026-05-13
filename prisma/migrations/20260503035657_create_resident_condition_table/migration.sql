-- CreateTable
CREATE TABLE "resident_conditions" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "health_condition_id" TEXT NOT NULL,
    "observations" TEXT,

    CONSTRAINT "resident_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resident_conditions_resident_id_health_condition_id_key" ON "resident_conditions"("resident_id", "health_condition_id");

-- AddForeignKey
ALTER TABLE "resident_conditions" ADD CONSTRAINT "resident_conditions_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_conditions" ADD CONSTRAINT "resident_conditions_health_condition_id_fkey" FOREIGN KEY ("health_condition_id") REFERENCES "health_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
