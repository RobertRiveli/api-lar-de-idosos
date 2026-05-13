import { prisma } from "../../../database/prisma.js";

class ResidentAccessCodeRepository {
  async create(data, db = prisma) {
    return await db.residentAccessCode.create({ data });
  }

  async findActiveByResidentAndCompany(residentId, companyId, db = prisma) {
    const codes = await db.residentAccessCode.findMany({
      where: {
        residentId,
        companyId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    return codes.filter((code) => code.usesCount < code.maxUses);
  }

  async findByCode(code, db = prisma) {
    return await db.residentAccessCode.findUnique({
      where: { code },
    });
  }

  async incrementUses(id, db = prisma) {
    return await db.residentAccessCode.update({
      where: { id },
      data: {
        usesCount: {
          increment: 1,
        },
      },
    });
  }

  async deactivate(id, db = prisma) {
    return await db.residentAccessCode.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

export default new ResidentAccessCodeRepository();
