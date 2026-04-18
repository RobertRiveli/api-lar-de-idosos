import { prisma } from "../database/prisma.js";

class CompanyRepository {
  async create(data) {
    return await prisma.company.create({ data });
  }

  async findByTaxId(taxId) {
    return await prisma.company.findUnique({ where: { taxId } });
  }
}

export default new CompanyRepository();
