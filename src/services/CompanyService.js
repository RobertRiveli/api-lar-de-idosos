import MailService from "./MailService.js";
import { prisma } from "../database/prisma.js";
import ConflictError from "../errors/ConflictError.js";
import ValidationError from "../errors/ValidationError.js";
import CompanyRepository from "../repositories/CompanyRepository.js";
import companySchema from "../validators/companyValidator.js";
import { isCNPJ } from "validation-br";

class CompanyService {
  constructor() {
    this.emailService = new MailService();
  }

  async resgisterCompany(companyData) {
    await this.validateCompanyData(companyData);
    await this.checkConflict(companyData);

    const newCompany = await CompanyRepository.create(companyData);

    try {
      await this.emailService.sendEmail(
        companyData.email,
        "Bem-vindo!",
        `Olá!
        Sua empresa foi cadastrada com sucesso.
        Para acessar o sistema, crie sua senha no link abaixo:
        LINK EM BREVE

        Esse link expira em 1 hora.`,
      );
    } catch (e) {
      console.error("Erro ao enviar email:", e);
    }

    return newCompany;
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

    this.validateTaxId(companyData.taxId);
  }

  validateTaxId(taxId) {
    if (!isCNPJ(taxId)) {
      throw new ValidationError("taxId", "CNPJ inválido");
    }
  }
}
export default new CompanyService();
