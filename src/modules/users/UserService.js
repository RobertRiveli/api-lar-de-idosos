import bcrypt from "bcrypt";
import userSchema from "../../validators/userValidation.js";
import { prisma } from "../../database/prisma.js";
import ConflictError from "../../errors/ConflictError.js";
import ValidationError from "../../errors/ValidationError.js";
import NotFoundError from "../../errors/NotFoundError.js";
import { validatePhone } from "../../utils/phoneValidator.js";
import UserRepository from "./UserRepository.js";
import CompanyService from "../companies/CompanyService.js";

class UserService {
  registerUser = async (userData, userRole, companyId) => {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem adicionar usuários",
      );
    }

    const role = userData.role || "caregiver";

    if (!["admin", "caregiver"].includes(role)) {
      throw new ValidationError("role", "Cargo inválido");
    }

    await this.validateUserData(userData);
    await this.checkConflict(userData);

    const { password, ...userDataWithoutPassword } = userData;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await UserRepository.create({
      ...userDataWithoutPassword,
      companyId,
      role,
      passwordHash,
    });

    const data = {
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return data;
  };

  getProfile = async (userId) => {
    const user = await UserRepository.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        cpf: true,
        createdAt: true,
        role: true,
        company: {
          select: {
            id: true,
            legalName: true,
            tradeName: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new ValidationError("id", "Usuário não encontrado");
    }

    return user;
  };

  getManyByCompany = async (companyId) => {
    const companyExists = CompanyService.companyExists(companyId);

    if (!companyExists) {
      throw new NotFoundError("Empresa não existe ou está inativa");
    }

    const users = UserRepository.findManyByCompanyId(companyId);

    return users;
  };

  checkConflict = async (userData) => {
    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { phone: userData.phone },
          { cpf: userData.cpf },
        ],
      },
    });

    if (duplicate) {
      const messages = {
        email: "Email já cadastrado",
        phone: "Telefone já cadastrado",
        cpf: "CPF já cadastrado",
      };

      const field = Object.keys(messages).find((key) => {
        return userData[key] === duplicate[key];
      });

      console.log(
        `Conflict detected on field: ${field} with value: ${userData[field]}`,
      );

      throw new ConflictError(field, messages[field]);
    }
  };

  validateUserData = async (userData) => {
    const validation = userSchema.safeParse(userData);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      console.log(
        `Validation failed on field: ${field} with message: ${firstIssue.message}`,
      );

      throw new ValidationError(field, firstIssue.message);
    }

    this.validatePhone(userData.phone);
  };

  validatePhone(phone) {
    if (!phone) return;

    if (!validatePhone(phone)) {
      throw new ValidationError("phone", "Telefone inválido");
    }
  }
}

export default new UserService();
