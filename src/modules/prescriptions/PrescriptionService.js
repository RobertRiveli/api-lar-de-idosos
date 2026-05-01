import PrescriptionRepository from "./PrescriptionRepository.js";
import ResidentRepository from "../residents/ResidentRepository.js";
import MedicationRepository from "../medications/MedicationRepository.js";
import MeasurementUnitRepository from "../measurementUnits/MeasurementUnitRepository.js";
import ValidationError from "../../errors/ValidationError.js";
import NotFoundError from "../../errors/NotFoundError.js";
import {
  createPrescriptionSchema,
  parsePrescriptionDate,
  updatePrescriptionSchema,
} from "../../validators/prescriptionValidator.js";

class PrescriptionService {
  async createPrescription(user, prescriptionData) {
    this.validatePrescriptionData(createPrescriptionSchema, prescriptionData);

    const { companyId } = user;

    await this.ensureResidentBelongsToCompany(
      prescriptionData.residentId,
      companyId,
    );
    await this.ensureMedicationBelongsToCompany(
      prescriptionData.medicationId,
      companyId,
    );
    await this.ensureMeasurementUnitExists(prescriptionData.measurementUnitId);

    const normalizedPrescriptionData =
      this.normalizePrescriptionData(prescriptionData);

    return await PrescriptionRepository.create({
      ...normalizedPrescriptionData,
      companyId,
    });
  }

  async listPrescriptions(user) {
    return await PrescriptionRepository.findManyByCompany(user.companyId);
  }

  async listPrescriptionsByResident(user, residentId) {
    await this.ensureResidentBelongsToCompany(residentId, user.companyId);

    return await PrescriptionRepository.findManyByResident(
      residentId,
      user.companyId,
    );
  }

  async getPrescriptionById(user, id) {
    const prescription = await PrescriptionRepository.findByIdAndCompany(
      id,
      user.companyId,
    );

    if (!prescription) {
      throw new NotFoundError("prescription", "Prescrição não encontrada");
    }

    return prescription;
  }

  async updatePrescription(user, id, prescriptionData) {
    if (Object.keys(prescriptionData).length === 0) {
      throw new ValidationError(
        "prescription",
        "Informe ao menos um campo para atualizar",
      );
    }

    this.validatePrescriptionData(updatePrescriptionSchema, prescriptionData);

    const prescription = await this.getPrescriptionById(user, id);
    const { companyId } = user;

    if (prescriptionData.residentId) {
      await this.ensureResidentBelongsToCompany(
        prescriptionData.residentId,
        companyId,
      );
    }

    if (prescriptionData.medicationId) {
      await this.ensureMedicationBelongsToCompany(
        prescriptionData.medicationId,
        companyId,
      );
    }

    if (prescriptionData.measurementUnitId) {
      await this.ensureMeasurementUnitExists(prescriptionData.measurementUnitId);
    }

    this.validateUpdateDateRange(prescription, prescriptionData);

    const normalizedPrescriptionData =
      this.normalizePrescriptionData(prescriptionData);

    return await PrescriptionRepository.update(id, normalizedPrescriptionData);
  }

  async deactivatePrescription(user, id) {
    await this.getPrescriptionById(user, id);

    return await PrescriptionRepository.deactivate(id);
  }

  validatePrescriptionData(schema, prescriptionData) {
    const validation = schema.safeParse(prescriptionData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }

  async ensureResidentBelongsToCompany(residentId, companyId) {
    const resident = await ResidentRepository.findByIdAndComanyId(
      residentId,
      companyId,
    );

    if (!resident) {
      throw new NotFoundError("resident", "Residente não encontrado");
    }

    return resident;
  }

  async ensureMedicationBelongsToCompany(medicationId, companyId) {
    const medication = await MedicationRepository.findByIdAndCompanyId(
      medicationId,
      companyId,
    );

    if (!medication) {
      throw new NotFoundError("medication", "Medicamento não encontrado");
    }

    return medication;
  }

  async ensureMeasurementUnitExists(measurementUnitId) {
    const measurementUnit =
      await MeasurementUnitRepository.findById(measurementUnitId);

    if (!measurementUnit) {
      throw new NotFoundError(
        "measurementUnit",
        "Unidade de medida não encontrada",
      );
    }

    return measurementUnit;
  }

  validateUpdateDateRange(currentPrescription, prescriptionData) {
    const startDate = prescriptionData.startDate
      ? parsePrescriptionDate(prescriptionData.startDate)
      : currentPrescription.startDate;
    const endDate =
      "endDate" in prescriptionData
        ? prescriptionData.endDate && parsePrescriptionDate(prescriptionData.endDate)
        : currentPrescription.endDate;

    if (endDate && endDate < startDate) {
      throw new ValidationError(
        "endDate",
        "endDate não pode ser menor que startDate",
      );
    }
  }

  normalizePrescriptionData(prescriptionData) {
    const normalizedData = {
      ...prescriptionData,
    };

    if ("startDate" in normalizedData) {
      normalizedData.startDate = parsePrescriptionDate(normalizedData.startDate);
    }

    if ("endDate" in normalizedData) {
      normalizedData.endDate = normalizedData.endDate
        ? parsePrescriptionDate(normalizedData.endDate)
        : null;
    }

    return normalizedData;
  }
}

export default new PrescriptionService();
