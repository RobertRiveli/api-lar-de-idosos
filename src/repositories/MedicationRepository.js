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
}

export default new MedicationRepository();
