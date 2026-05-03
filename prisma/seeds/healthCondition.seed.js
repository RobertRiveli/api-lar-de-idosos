export default async function seedHealthConditions(database) {
  const healthConditions = [
    {
      name: "Diabetes",
      category: "Doença crônica",
    },
    {
      name: "Hipertensão",
      category: "Cardiovascular",
    },
    { name: "Alzheimer", category: "Neurológica" },
    { name: "Parkinson", category: "Neurológica" },
    { name: "Asma", category: "Respiratória" },
    { name: "DPOC", category: "Respiratória" },
    { name: "Cardiopatia", category: "Cardiovascular" },
    { name: "Alergia medicamentosa", category: "Alergia" },
    { name: "Alergia alimentar", category: "Alergia" },
    { name: "Depressão", category: "Saúde mental" },
    { name: "Ansiedade", category: "Saúde mental" },
    { name: "Mobilidade reduzida", category: "Mobilidade" },
    { name: "Cadeirante", category: "Mobilidade" },
    { name: "Deficiência visual", category: "Sensorial" },
    { name: "Deficiência auditiva", category: "Sensorial" },
  ];

  for (const condition of healthConditions) {
    await database.healthCondition.upsert({
      where: {
        name: condition.name,
      },
      update: {
        category: condition.name,
      },
      create: condition,
    });
  }

  console.log("Condições de saúde cadastradas com sucesso!");
}
