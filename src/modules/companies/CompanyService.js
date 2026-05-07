import MailService from "../../services/MailService.js";
import { prisma } from "../../database/prisma.js";
import ConflictError from "../../errors/ConflictError.js";
import ValidationError from "../../errors/ValidationError.js";
import CompanyRepository from "./CompanyRepository.js";
import companySchema from "../../validators/companyValidator.js";
import { isCNPJ } from "validation-br";
import { validatePhone } from "../../utils/phoneValidator.js";
import UserRepository from "../users/UserRepository.js";
import userSchema from "../../validators/userValidation.js";
import bcrypt from "bcrypt";

class CompanyService {
  constructor() {
    this.emailService = new MailService();
  }

  async resgisterCompany(companyData) {
    const { admin, ...companyInfo } = companyData;

    this.validateCompanyData(companyInfo);
    this.validateAdminData(admin);

    await this.checkConflict(companyInfo);

    const result = await prisma.$transaction(async (tx) => {
      const newCompany = await CompanyRepository.create(companyInfo, tx);

      const passwordHash = await bcrypt.hash(admin.password, 10);

      const newAdmin = await UserRepository.create(
        {
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          companyId: newCompany.id,
          cpf: admin.cpf,
          role: "admin",
          passwordHash,
        },
        tx,
      );

      return { newCompany, newAdmin };
    });

    try {
      await this.emailService.sendEmail(
        companyData.email,
        "Bem-vindo!",
        `Olá!
        Sua empresa foi cadastrada com sucesso.`,
      );
    } catch (e) {
      console.error("Erro ao enviar email:", e);
    }

    return result.newCompany;
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

  validateCompanyData(companyData) {
    const validation = companySchema.safeParse(companyData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }

    this.validateTaxId(companyData.taxId);
    this.validatePhone(companyData.phone);
  }

  async companyExists(companyId) {
    const company = await CompanyRepository.findById(companyId);

    if (!company) return false;

    return true;
  }

  validateAdminData(adminData) {
    const validation = userSchema.safeParse(adminData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }

  validateTaxId(taxId) {
    if (!isCNPJ(taxId)) {
      throw new ValidationError("taxId", "CNPJ inválido");
    }
  }

  validatePhone(phone) {
    if (!validatePhone(phone)) {
      throw new ValidationError("phone", "Telefone inválido");
    }
  }
}
export default new CompanyService();
