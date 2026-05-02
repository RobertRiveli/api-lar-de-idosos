import PrescriptionRepository from "./PrescriptionRepository.js";
import ResidentRepository from "../residents/ResidentRepository.js";
import MedicationRepository from "../medications/MedicationRepository.js";
import MeasurementUnitRepository from "../measurementUnits/MeasurementUnitRepository.js";
import MedicationAdministrationService from "../medicationAdministrations/MedicationAdministrationService.js";
import { prisma } from "../../database/prisma.js";
import ValidationError from "../../errors/ValidationError.js";
import NotFoundError from "../../errors/NotFoundError.js";
import {
  createPrescriptionSchema,
  parsePrescriptionDate,
  updatePrescriptionSchema,
} from "../../validators/prescriptionValidator.js";

class PrescriptionService {
  async createPrescription(user, prescriptionData) {
    this.ensureAdminRole(
      user.role,
      "Apenas administradores podem cadastrar prescrições",
    );

    const parsedPrescriptionData = this.validatePrescriptionData(
      createPrescriptionSchema,
      prescriptionData,
    );

    const { companyId } = user;

    await this.ensureResidentBelongsToCompany(
      parsedPrescriptionData.residentId,
      companyId,
    );
    await this.ensureMedicationBelongsToCompany(
      parsedPrescriptionData.medicationId,
      companyId,
    );
    await this.ensureMeasurementUnitExists(
      parsedPrescriptionData.measurementUnitId,
    );

    const normalizedPrescriptionData =
      this.normalizePrescriptionData(parsedPrescriptionData);

    return await prisma.$transaction(async (db) => {
      const prescription = await PrescriptionRepository.create(
        {
          ...normalizedPrescriptionData,
          companyId,
        },
        db,
      );

      const generatedAdministrations =
        await MedicationAdministrationService.generateFromPrescription(
          prescription,
          db,
        );

      return {
        prescription,
        generatedAdministrations,
      };
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

    const parsedPrescriptionData = this.validatePrescriptionData(
      updatePrescriptionSchema,
      prescriptionData,
    );

    const prescription = await this.getPrescriptionById(user, id);
    const { companyId } = user;

    if (parsedPrescriptionData.residentId) {
      await this.ensureResidentBelongsToCompany(
        parsedPrescriptionData.residentId,
        companyId,
      );
    }

    if (parsedPrescriptionData.medicationId) {
      await this.ensureMedicationBelongsToCompany(
        parsedPrescriptionData.medicationId,
        companyId,
      );
    }

    if (parsedPrescriptionData.measurementUnitId) {
      await this.ensureMeasurementUnitExists(
        parsedPrescriptionData.measurementUnitId,
      );
    }

    this.validateUpdateDateRange(prescription, parsedPrescriptionData);

    const normalizedPrescriptionData =
      this.normalizePrescriptionData(parsedPrescriptionData);

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

    return validation.data;
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
        ? prescriptionData.endDate &&
          parsePrescriptionDate(prescriptionData.endDate)
        : currentPrescription.endDate;
    const firstScheduledAt = prescriptionData.firstScheduledAt
      ? parsePrescriptionDate(prescriptionData.firstScheduledAt)
      : currentPrescription.firstScheduledAt;

    if (endDate && endDate < startDate) {
      throw new ValidationError(
        "endDate",
        "endDate não pode ser menor que startDate",
      );
    }

    if (firstScheduledAt < startDate) {
      throw new ValidationError(
        "firstScheduledAt",
        "firstScheduledAt não pode ser menor que startDate",
      );
    }

    if (endDate && firstScheduledAt > endDate) {
      throw new ValidationError(
        "firstScheduledAt",
        "firstScheduledAt não pode ser maior que endDate",
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

    if ("firstScheduledAt" in normalizedData) {
      normalizedData.firstScheduledAt = parsePrescriptionDate(
        normalizedData.firstScheduledAt,
      );
    }

    if ("endDate" in normalizedData) {
      normalizedData.endDate = normalizedData.endDate
        ? parsePrescriptionDate(normalizedData.endDate)
        : null;
    }

    return normalizedData;
  }

  ensureAdminRole(role, message) {
    if (role !== "admin") {
      throw new ValidationError("role", message);
    }
  }
}

export default new PrescriptionService();
