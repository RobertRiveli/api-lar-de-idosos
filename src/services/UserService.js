import bcrypt from "bcrypt";
import userSchema from "../validators/userValidation.js";
import { prisma } from "../database/prisma.js";
import ConflictError from "../errors/ConflictError.js";
import ValidationError from "../errors/ValidationError.js";
import { validatePhone } from "../utils/phoneValidator.js";

class UserService {
  registerUser = async (userData) => {
    await this.validateUserData(userData);
    await this.checkConflict(userData);

    const { password, ...userDataWithoutPassword } = userData;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        passwordHash,
      },
    });

    const data = {
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
    };

    return data;
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
