import { prisma } from "../../database/prisma.js";

const prescriptionInclude = {
  resident: {
    select: {
      id: true,
      fullName: true,
    },
  },
  medication: {
    select: {
      id: true,
      genericName: true,
      brandName: true,
    },
  },
  measurementUnit: {
    select: {
      id: true,
      name: true,
      abbreviation: true,
    },
  },
};

class PrescriptionRepository {
  async create(data, db = prisma) {
    return await db.prescription.create({
      data,
      include: prescriptionInclude,
    });
  }

  async findManyByCompany(companyId) {
    return await prisma.prescription.findMany({
      where: {
        companyId,
        isActive: true,
        resident: {
          companyId,
          status: "active",
        },
      },
      include: prescriptionInclude,
      orderBy: { startDate: "desc" },
    });
  }

  async findManyByResident(residentId, companyId) {
    return await prisma.prescription.findMany({
      where: {
        residentId,
        companyId,
        isActive: true,
        resident: {
          companyId,
          status: "active",
        },
      },
      include: prescriptionInclude,
      orderBy: { startDate: "desc" },
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.prescription.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
        resident: {
          companyId,
          status: "active",
        },
      },
      include: prescriptionInclude,
    });
  }

  async update(id, data) {
    return await prisma.prescription.update({
      where: { id },
      data,
      include: prescriptionInclude,
    });
  }

  async deactivate(id) {
    return await prisma.prescription.update({
      where: { id },
      data: { isActive: false },
      include: prescriptionInclude,
    });
  }
}

export default new PrescriptionRepository();
