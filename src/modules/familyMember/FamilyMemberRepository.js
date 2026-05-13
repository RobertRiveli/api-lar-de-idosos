import { prisma } from "../../database/prisma.js";

class FamilyMemberRepository {
  async create(data, db = prisma) {
    return await db.familyMember.create({ data });
  }

  async findByEmail(email, db = prisma) {
    return await db.familyMember.findUnique({ where: { email } });
  }

  async findByCpf(cpf, db = prisma) {
    return await db.familyMember.findUnique({ where: { cpf } });
  }
}

export default new FamilyMemberRepository();
