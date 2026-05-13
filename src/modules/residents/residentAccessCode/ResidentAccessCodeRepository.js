import { prisma } from "../../../database/prisma.js";

class ResidentAccessCodeRepository {
  async create(data, db = prisma) {
    return await db.residentAccessCode.create({ data });
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
