import e from "express";
import { prisma } from "../database/prisma.js";
import ConflictError from "../errors/ConflictError.js";
import ValidationError from "../errors/ValidationError.js";
import CompanyRepository from "../repositories/CompanyRepository.js";
import companySchema from "../validators/companyValidator.js";

class CompanyService {
  async resgisterCompany(companyData) {
    await this.validateCompanyData(companyData);
    await this.checkConflict(companyData);

    return await CompanyRepository.create(companyData);
  }

  async checkConflict(companyData) {
    const duplicate = await prisma.company.findFirst({
      where: {
        OR: [
          { email: companyData.email },
          { taxId: companyData.taxId },
          { legalName: companyData.legalName },
        ],
      },
    });

    if (duplicate) {
      const field = Object.keys(companyData).find(
        (key) => companyData[key] === duplicate[key],
      );
      const messages = {
        email: "Email já cadastrado",
        taxId: "CNPj já cadastrado",
        legalName: "Razão Social já cadastrada",
      };

      console.log(
        `Conflict detected on field: ${field} with value: ${companyData[field]}`,
      );
      throw new ConflictError(field, messages[field]);
    }
  }

  async validateCompanyData(companyData) {
    const validation = companySchema.safeParse(companyData);

    if (!validation.success) {
      const errorMessage = validation.error._zod.def.reduce((acc, err) => {
        const field = err.path;
        acc[field] = err.message;
        return acc;
      }, {});
      const field = Object.keys(errorMessage)[0];

      throw new ValidationError(field, errorMessage[field]);
    }
  }
}
export default new CompanyService();
