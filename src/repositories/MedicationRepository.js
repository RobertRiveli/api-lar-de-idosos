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
    return await prisma.medication.findFirst({
      where: { id: medicationId, companyId, isActive: true },
    });
  }

  async findDuplicateByMedicationData(data, companyId, medicationIdToIgnore) {
    return await prisma.medication.findFirst({
      where: {
        companyId,
        genericName: data.genericName,
        form: data.form,
        strength: data.strength,
        isActive: true,
        ...(medicationIdToIgnore && {
          id: { not: medicationIdToIgnore },
        }),
      },
    });
  }

  async update(medicationId, data) {
    return await prisma.medication.update({
      where: { id: medicationId },
      data,
    });
  }

  async deactivate(medicationId) {
    return await prisma.medication.update({
      where: { id: medicationId },
      data: { isActive: false },
    });
  }
}

export default new MedicationRepository();
