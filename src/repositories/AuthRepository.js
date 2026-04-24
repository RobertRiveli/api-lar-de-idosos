import { prisma } from "../database/prisma.js";

class AuthRepository {
  async findUserByCpf(cpf) {
    return await prisma.user.findFirst({
      where: { cpf },
      include: {
        company: true,
      },
    });
  }
}

export default new AuthRepository();
