-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "brand_name" TEXT,
    "form" TEXT NOT NULL,
    "strength" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medications_company_id_idx" ON "medications"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "medications_generic_name_company_id_strength_form_key" ON "medications"("generic_name", "company_id", "strength", "form");

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
