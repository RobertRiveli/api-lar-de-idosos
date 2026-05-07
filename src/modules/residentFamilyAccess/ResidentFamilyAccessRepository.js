import { prisma } from "../../database/prisma.js";

class ResidentFamilyAccessRepository {
  async create(data, db = prisma) {
    return await db.residentFamilyAccess.create({
      data,
      select: {
        id: true,
        residentId: true,
        familyMemberId: true,
        relationship: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findByResidentAndFamilyMember(
    residentId,
    familyMemberId,
    db = prisma,
  ) {
    return await db.residentFamilyAccess.findUnique({
      where: {
        residentId_familyMemberId: {
          residentId,
          familyMemberId,
        },
      },
    });
  }
}

export default new ResidentFamilyAccessRepository();
