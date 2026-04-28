import MedicationRepository from "../repositories/MedicationRepository.js";
import medicationSchema from "../validators/medicationValidator.js";
import ValidationError from "../errors/ValidationError.js";

class MedicationService {
  async create(medicationData, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem cadastrar medicamentos",
      );
    }

    this.validateMedicationData(medicationData);

    const newMedication = await MedicationRepository.create({
      ...medicationData,
      companyId,
    });
    return newMedication;
  }

  validateMedicationData(medicationData) {
    const validation = medicationSchema.safeParse(medicationData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }
}

export default new MedicationService();
