-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "cpf" TEXT,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "blood_type" TEXT,
    "admission_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "residents_cpf_key" ON "residents"("cpf");

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
