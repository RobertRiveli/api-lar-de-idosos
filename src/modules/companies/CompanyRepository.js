import { prisma } from "../../database/prisma.js";

class CompanyRepository {
  async create(data, db = prisma) {
    return await db.company.create({ data });
  }

  async findByTaxId(taxId, db = prisma) {
    return await db.company.findUnique({ where: { taxId } });
  }
}

export default new CompanyRepository();
