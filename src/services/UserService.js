import e from "express";
import bcrypt from "bcrypt";
import userSchema from "../validators/userValidation.js";
import { prisma } from "../database/prisma.js";
import ConflictError from "../errors/ConflictError.js";
import ValidationError from "../errors/ValidationError.js";

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

    return true;
  };

  checkConflict = async (userData) => {
    const duplicate = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { phone: userData.phone }],
      },
    });

    if (duplicate) {
      const messages = {
        email: "Email já cadastrado",
        phone: "Telefone já cadastrado",
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
      const errorMessage = validation.error._zod.def.reduce((acc, err) => {
        const field = err.path;
        acc[field] = err.message;
        return acc;
      }, {});

      const field = Object.keys(errorMessage)[0];

      console.log(
        `Validation failed on field: ${field} with message: ${errorMessage[field]}`,
      );

      throw new ValidationError(field, errorMessage[field]);
    }
  };
}

export default new UserService();
