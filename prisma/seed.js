import { prisma } from "../src/database/prisma.js";

async function main() {
  const units = [
    {
      name: "Comprimido",
      abbreviation: "comp",
      category: "unidade",
    },
    {
      name: "Cápsula",
      abbreviation: "cap",
      category: "unidade",
    },
    {
      name: "Grama",
      abbreviation: "g",
      category: "massa",
    },
    {
      name: "Gota",
      abbreviation: "gota",
      category: "unidade",
    },
  ];

  for (const unit of units) {
    await prisma.measurementUnit.upsert({
      where: {
        abbreviation_category: {
          abbreviation: unit.abbreviation,
          category: unit.category,
        },
      },
      update: {},
      create: unit,
    });
  }

  console.log("Unidades de medida cadastradas com sucesso!");
}

main()
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
