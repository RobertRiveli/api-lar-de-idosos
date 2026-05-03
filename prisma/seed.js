import { prisma } from "../src/database/prisma.js";
import seedMeasurementUnit from "./seeds/measurementUnit.seed.js";
import seedHealthConditions from "./seeds/healthCondition.seed.js";

async function main() {
  await seedMeasurementUnit(prisma);
  await seedHealthConditions(prisma);
}

main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
