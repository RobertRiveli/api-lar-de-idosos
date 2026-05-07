-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('filho', 'filha', 'neto', 'neta', 'responsavel', 'outro');

-- CreateTable
CREATE TABLE "resident_family_access" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "family_member_id" TEXT NOT NULL,
    "relationship" "FamilyRelationship" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resident_family_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resident_family_access_resident_id_idx" ON "resident_family_access"("resident_id");

-- CreateIndex
CREATE INDEX "resident_family_access_family_member_id_idx" ON "resident_family_access"("family_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "resident_family_access_resident_id_family_member_id_key" ON "resident_family_access"("resident_id", "family_member_id");

-- AddForeignKey
ALTER TABLE "resident_family_access" ADD CONSTRAINT "resident_family_access_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_family_access" ADD CONSTRAINT "resident_family_access_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
