import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ValidationError from "../../../errors/ValidationError.js";
import familyLoginSchema from "./FamilyAuthSchema.js";
import FamilyAuthRepository from "./FamilyAuthRepository.js";

class FamilyAuthService {
  async login(loginData) {
    this.validateLoginData(loginData);

    const { email, password } = loginData;

    const familyMember =
      await FamilyAuthRepository.findFamilyMemberByEmail(email);

    if (!familyMember) {
      throw new ValidationError("email", "Familiar não encontrado");
    }

    if (!familyMember.isActive) {
      throw new ValidationError("familyMember", "Familiar inativo");
    }

    const isMatch = await bcrypt.compare(password, familyMember.passwordHash);

    if (!isMatch) {
      throw new ValidationError("password", "Senha incorreta");
    }

    const token = jwt.sign(
      {
        familyMemberId: familyMember.id,
        email: familyMember.email,
        accountType: "family_member",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      familyMember: {
        id: familyMember.id,
        email: familyMember.email,
        fullName: familyMember.fullName,
      },
    };
  }

  validateLoginData(loginData) {
    if (!loginData.email) {
      throw new ValidationError("email", "E-mail é obrigatório");
    }

    if (!loginData.password) {
      throw new ValidationError("password", "Senha é obrigatória");
    }

    const validation = familyLoginSchema.safeParse(loginData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }
}

export default new FamilyAuthService();
