import { prisma } from "../database/prisma.js";

class UserRepository {
  async create(data, db = prisma) {
    return await db.user.create({ data });
  }
}

export default new UserRepository();
