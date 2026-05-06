import { prisma } from "../../../database/prisma.js";

class FamilyAuthRepository {
  async findFamilyMemberByEmail(email) {
    return await prisma.familyMember.findUnique({
      where: { email },
    });
  }
}

export default new FamilyAuthRepository();
