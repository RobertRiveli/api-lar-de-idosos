export default async function seedMeasurementUnit(database) {
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
    await database.measurementUnit.upsert({
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
