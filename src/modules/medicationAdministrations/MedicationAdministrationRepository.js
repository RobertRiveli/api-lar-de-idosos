import { prisma } from "../../database/prisma.js";

const medicationAdministrationInclude = {
  resident: {
    select: {
      id: true,
      fullName: true,
    },
  },
  caregiver: {
    select: {
      id: true,
      fullName: true,
    },
  },
  prescription: {
    select: {
      id: true,
      dosage: true,
      route: true,
      frequency: true,
      isActive: true,
      companyId: true,
      residentId: true,
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
    },
  },
};

class MedicationAdministrationRepository {
  async create(data, db = prisma) {
    return await db.medicationAdministration.create({
      data,
      include: medicationAdministrationInclude,
    });
  }

  async createMany(data, db = prisma) {
    if (data.length === 0) {
      return { count: 0 };
    }

    return await db.medicationAdministration.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findByIdAndCompany(id, companyId) {
    return await prisma.medicationAdministration.findFirst({
      where: {
        id,
        companyId,
      },
      include: medicationAdministrationInclude,
    });
  }

  async findTodayByCompany(companyId, filters) {
    return await prisma.medicationAdministration.findMany({
      where: {
        companyId,
        scheduledAt: {
          gte: filters.startOfDay,
          lte: filters.endOfDay,
        },
        ...(filters.status && { status: filters.status }),
      },
      include: medicationAdministrationInclude,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
  }

  async findByResident(residentId, companyId, filters = {}) {
    const scheduledAt = {};

    if (filters.startDate) scheduledAt.gte = filters.startDate;
    if (filters.endDate) scheduledAt.lte = filters.endDate;

    return await prisma.medicationAdministration.findMany({
      where: {
        residentId,
        companyId,
        ...(Object.keys(scheduledAt).length > 0 && { scheduledAt }),
        ...(filters.status && { status: filters.status }),
      },
      include: medicationAdministrationInclude,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
  }

  async updateStatus(id, companyId, data) {
    const updated = await prisma.medicationAdministration.updateMany({
      where: {
        id,
        companyId,
      },
      data,
    });

    if (updated.count === 0) return null;

    return await this.findByIdAndCompany(id, companyId);
  }

  async checkPrescriptionBelongsToCompany(prescriptionId, companyId) {
    return await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        OR: [
          {
            companyId,
          },
          {
            resident: {
              companyId,
            },
          },
        ],
      },
      include: {
        resident: {
          select: {
            id: true,
            companyId: true,
            status: true,
          },
        },
      },
    });
  }

  async checkResidentBelongsToCompany(residentId, companyId) {
    return await prisma.resident.findFirst({
      where: {
        id: residentId,
        companyId,
        status: "active",
      },
    });
  }
}

export default new MedicationAdministrationRepository();
