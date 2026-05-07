import bcrypt from "bcrypt";
import ConflictError from "../../errors/ConflictError.js";
import FamilyMemberRepository from "./FamilyMemberRepository.js";

class FamilyMemberService {
  async create(data) {
    const familyMemberWithEmail = await FamilyMemberRepository.findByEmail(
      data.email,
    );

    if (familyMemberWithEmail) {
      throw new ConflictError("email", "Email já cadastrado");
    }

    const familyMemberWithCpf = await FamilyMemberRepository.findByCpf(
      data.cpf,
    );

    if (familyMemberWithCpf) {
      throw new ConflictError("cpf", "CPF já cadastrado");
    }

    const { password, ...familyMemberData } = data;
    const passwordHash = await bcrypt.hash(password, 10);

    const familyMember = await FamilyMemberRepository.create({
      ...familyMemberData,
      passwordHash,
    });

    return this.toResponse(familyMember);
  }

  toResponse(familyMember) {
    return {
      id: familyMember.id,
      fullName: familyMember.fullName,
      email: familyMember.email,
      phone: familyMember.phone,
      cpf: familyMember.cpf,
      isActive: familyMember.isActive,
      createdAt: familyMember.createdAt,
    };
  }
}

export default new FamilyMemberService();
