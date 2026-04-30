import MedicationRepository from "./MedicationRepository.js";
import medicationSchema from "../../validators/medicationValidator.js";
import ValidationError from "../../errors/ValidationError.js";
import ConflictError from "../../errors/ConflictError.js";

class MedicationService {
  async create(medicationData, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem cadastrar medicamentos",
      );
    }

    this.validateMedicationData(medicationData);

    const normalizedMedicationData =
      this.normalizeMedicationData(medicationData);

    await this.checkConflict(normalizedMedicationData, companyId);

    const newMedication = await MedicationRepository.create({
      ...normalizedMedicationData,
      companyId,
    });
    return newMedication;
  }

  async list(companyId) {
    return await MedicationRepository.findManyByCompany(companyId);
  }

  async getById(medicationId, companyId) {
    const medication = await MedicationRepository.findByIdAndCompanyId(
      medicationId,
      companyId,
    );

    if (!medication) {
      throw new ValidationError("medication", "Medicamento não encontrado");
    }

    return medication;
  }

  async update(medicationId, medicationData, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem atualizar medicamentos",
      );
    }

    await this.getById(medicationId, companyId);
    this.validateMedicationData(medicationData);

    const normalizedMedicationData =
      this.normalizeMedicationData(medicationData);

    await this.checkConflict(
      normalizedMedicationData,
      companyId,
      medicationId,
    );

    return await MedicationRepository.update(
      medicationId,
      normalizedMedicationData,
    );
  }

  async delete(medicationId, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem deletar medicamentos",
      );
    }

    await this.getById(medicationId, companyId);

    return await MedicationRepository.deactivate(medicationId);
  }

  validateMedicationData(medicationData) {
    const validation = medicationSchema.safeParse(medicationData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }

  normalizeMedicationData(medicationData) {
    return {
      ...medicationData,
      brandName: medicationData.brandName ?? null,
      strength: medicationData.strength ?? null,
    };
  }

  async checkConflict(medicationData, companyId, medicationIdToIgnore = null) {
    const duplicate = await MedicationRepository.findDuplicateByMedicationData(
      medicationData,
      companyId,
      medicationIdToIgnore,
    );

    if (duplicate) {
      throw new ConflictError(
        "medication",
        "Medicamento já cadastrado com o mesmo nome, forma e dosagem",
      );
    }
  }
}

export default new MedicationService();
