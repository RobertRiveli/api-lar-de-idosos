import { prisma } from "../database/prisma.js";

class MedicationRepository {
  async create(data, db = prisma) {
    return await db.medication.create({ data });
  }

  async findManyByCompany(companyId) {
    return await prisma.medication.findMany({
      where: { companyId, isActive: true },
      orderBy: { genericName: "asc" },
    });
  }

  async findByIdAndCompanyId(medicationId, companyId) {
    return await prisma.medication.findUnique({
      where: { id: medicationId, companyId, isActive: true },
    });
  }
}

export default new MedicationRepository();
