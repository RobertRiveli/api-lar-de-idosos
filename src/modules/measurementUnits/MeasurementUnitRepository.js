import { prisma } from "../../database/prisma.js";

class MeasurementUnitRepository {
  async findAll() {
    return prisma.measurementUnit.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  async findById(id) {
    return prisma.measurementUnit.findUnique({
      where: {
        id,
        isActive: true,
      },
    });
  }
}

export default new MeasurementUnitRepository();
