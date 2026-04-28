import { prisma } from "../database/prisma.js";

class MedicationRepository {
  async create(data, db = prisma) {
    return await db.medication.create({ data });
  }
}

export default new MedicationRepository();
