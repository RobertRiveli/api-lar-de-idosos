import { prisma } from "../../database/prisma.js";

class UserRepository {
  async create(data, db = prisma) {
    return await db.user.create({ data });
  }

  async findUnique({ where, select, db = prisma }) {
    return await db.user.findUnique({ where, select });
  }

  async findManyByCompanyId(companyId, db = prisma) {
    return await db.user.findMany({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        email: true,
        fullName: true,
        phone: true,
        cpf: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export default new UserRepository();
