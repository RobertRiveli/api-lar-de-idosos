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

  residentDetailsSelect = {
    id: true,
    fullName: true,
    birthDate: true,
    gender: true,
    bloodType: true,
    admissionDate: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  familyMemberBasicSelect = {
    id: true,
    fullName: true,
    email: true,
    phone: true,
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

  async findActiveFamilyMembersByResident(residentId, companyId, db = prisma) {
    return await db.residentFamilyAccess.findMany({
      where: {
        residentId,
        isActive: true,
        resident: {
          companyId,
        },
      },
      select: {
        id: true,
        relationship: true,
        createdAt: true,
        familyMember: {
          select: this.familyMemberBasicSelect,
        },
      },
      orderBy: {
        familyMember: {
          fullName: "asc",
        },
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

  async findByResidentAndFamilyMember(residentId, familyMemberId, db = prisma) {
    return await db.residentFamilyAccess.findUnique({
      where: {
        residentId_familyMemberId: {
          residentId,
          familyMemberId,
        },
      },
    });
  }

  async findActiveAccess(familyMemberId, residentId, db = prisma) {
    return await db.residentFamilyAccess.findFirst({
      where: {
        familyMemberId,
        residentId,
        isActive: true,
      },
    });
  }

  async findResidentDetailsForFamilyMember(
    familyMemberId,
    residentId,
    db = prisma,
  ) {
    return await db.residentFamilyAccess.findFirst({
      where: {
        familyMemberId,
        residentId,
        isActive: true,
      },
      select: {
        id: true,
        relationship: true,
        createdAt: true,
        resident: {
          select: this.residentDetailsSelect,
        },
      },
    });
  }

  async findManyByCompany(companyId) {
    return prisma.residentFamilyAccess.findMany({
      where: {
        resident: {
          companyId,
        },
      },
      select: {
        id: true,
        relationship: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        resident: {
          select: {
            id: true,
            fullName: true,
            status: true,
          },
        },

        familyMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export default new ResidentFamilyAccessRepository();
