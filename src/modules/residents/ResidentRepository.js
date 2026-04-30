import { prisma } from "../../database/prisma.js";

class ResidentRepository {
  async create(data, db = prisma) {
    return await db.resident.create({
      data,
    });
  }

  async findManyByCompany(companyId) {
    return await prisma.resident.findMany({
      where: { companyId, status: "active" },
      orderBy: { fullName: "asc" },
    });
  }

  async findByIdAndComanyId(id, companyId) {
    return await prisma.resident.findFirst({
      where: { id, companyId, status: "active" },
    });
  }

  async findByCpfAndCompanyId(cpf, companyId) {
    return await prisma.resident.findFirst({
      where: { cpf, companyId, status: "active" },
    });
  }
}
export default new ResidentRepository();
