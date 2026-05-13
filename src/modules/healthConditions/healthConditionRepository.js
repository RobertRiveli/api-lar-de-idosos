import { prisma } from "../../database/prisma.js";

class healthCondition {
  async findAll() {
    return await prisma.healthCondition.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findById(id) {
    return await prisma.healthCondition.findUnique({
      where: { id },
    });
  }
}

export default new healthCondition();
