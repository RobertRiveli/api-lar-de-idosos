import { prisma } from "../../../database/prisma.js";

class ResidentAccessCodeRepository {
  async create(data) {
    return await prisma.residentAccessCode.create({ data });
  }
}

export default new ResidentAccessCodeRepository();
