-- CreateTable
CREATE TABLE "resident_access_code" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "max_uses" INTEGER NOT NULL,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resident_access_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resident_access_code_resident_id_idx" ON "resident_access_code"("resident_id");

-- CreateIndex
CREATE INDEX "resident_access_code_company_id_idx" ON "resident_access_code"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "resident_access_code_code_key" ON "resident_access_code"("code");

-- AddForeignKey
ALTER TABLE "resident_access_code" ADD CONSTRAINT "resident_access_code_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_access_code" ADD CONSTRAINT "resident_access_code_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
