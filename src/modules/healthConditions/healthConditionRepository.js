import { prisma } from "../../database/prisma.js";

class healthCondition {
  async findAll() {
    return await prisma.healthCondition.findMany({
      orderBy: { name: "asc" },
    });
  }
}

export default new healthCondition();
