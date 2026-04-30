import { prisma } from "../../database/prisma.js";

class UserRepository {
  async create(data, db = prisma) {
    return await db.user.create({ data });
  }

  async findUnique({ where, select, db = prisma }) {
    return await db.user.findUnique({ where, select });
  }
}

export default new UserRepository();
