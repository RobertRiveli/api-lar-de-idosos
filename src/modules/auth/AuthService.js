import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ValidationError from "../../errors/ValidationError.js";
import AuthRepository from "./AuthRepository.js";
import loginSchema from "../../validators/loginValidation.js";

class AuthService {
  async login(loginData) {
    this.validateLoginData(loginData);

    const { cpf, password } = loginData;

    const user = await AuthRepository.findUserByCpf(cpf);
    if (!user) {
      throw new ValidationError("cpf", "Usuário não encontrado");
    }

    if (!user.isActive) {
      throw new ValidationError("user", "Usuário inativo");
    }

    if (!user.company.isActive) {
      throw new ValidationError("company", "Empresa inativa");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new ValidationError("password", "Senha incorreta");
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.company.id, role: user.role },

      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  validateLoginData(loginData) {
    if (!loginData.cpf) {
      throw new ValidationError("cpf", "CPF é obrigatório");
    }

    const validation = loginSchema.safeParse(loginData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }
}

export default new AuthService();
