-- CreateTable
CREATE TABLE "measurement_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurement_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "measurement_units_name_key" ON "measurement_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_units_abbreviation_category_key" ON "measurement_units"("abbreviation", "category");
