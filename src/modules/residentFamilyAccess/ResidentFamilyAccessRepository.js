import { prisma } from "../../database/prisma.js";

class ResidentFamilyAccessRepository {
  residentBasicSelect = {
    id: true,
    fullName: true,
    birthDate: true,
    gender: true,
    bloodType: true,
    admissionDate: true,
    status: true,
    createdAt: true,
  };

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

  async findResidentsByFamilyMember(familyMemberId, db = prisma) {
    return await db.residentFamilyAccess.findMany({
      where: {
        familyMemberId,
        isActive: true,
      },
      select: {
        id: true,
        relationship: true,
        createdAt: true,
        resident: {
          select: this.residentBasicSelect,
        },
      },
      orderBy: {
        resident: {
          fullName: "asc",
        },
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
