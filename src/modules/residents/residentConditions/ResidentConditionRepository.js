import { prisma } from "../../../database/prisma.js";

class ResidentConditionRepository {
  async create(data) {
    return await prisma.residentCondition.create({
      data,
      include: {
        healthCondition: true,
        resident: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findByResidentAndHealthCondition(residentId, healthConditionId) {
    return await prisma.residentCondition.findUnique({
      where: {
        residentId_healthConditionId: {
          residentId,
          healthConditionId,
        },
      },
    });
  }

  async findManyByResident(residentId) {
    return await prisma.residentCondition.findMany({
      where: {
        residentId,
      },
      include: {
        healthCondition: true,
      },
      orderBy: {
        healthCondition: {
          name: "asc",
        },
      },
    });
  }

  async findById(id) {
    return await prisma.residentCondition.findUnique({
      where: { id },
      include: {
        resident: {
          select: {
            id: true,
            fullName: true,
            companyId: true,
          },
        },
        healthCondition: true,
      },
    });
  }

  async delete(id) {
    return await prisma.residentCondition.delete({
      where: { id },
    });
  }
}

export default new ResidentConditionRepository();
