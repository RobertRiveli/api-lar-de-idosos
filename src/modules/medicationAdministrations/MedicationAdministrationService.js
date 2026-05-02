import MedicationAdministrationRepository from "./MedicationAdministrationRepository.js";
import ValidationError from "../../errors/ValidationError.js";
import NotFoundError from "../../errors/NotFoundError.js";
import ConflictError from "../../errors/ConflictError.js";
import {
  administerMedicationSchema,
  cancelMedicationSchema,
  createMedicationAdministrationSchema,
  listMedicationAdministrationQuerySchema,
  medicationAdministrationIdSchema,
  missMedicationSchema,
  refuseMedicationSchema,
  residentMedicationAdministrationParamsSchema,
} from "../../validators/medicationAdministrationValidator.js";

const PENDING_STATUS = "pending";
const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const DEFAULT_GENERATION_DAYS = 7;

class MedicationAdministrationService {
  async createAdministration(user, administrationData) {
    return await this.createManualAdministration(user, administrationData);
  }

  async createManualAdministration(user, administrationData) {
    this.ensureAdminRole(
      user.role,
      "Apenas administradores podem criar administrações manualmente",
    );

    const parsedData = this.validateData(
      createMedicationAdministrationSchema,
      administrationData,
    );
    const { companyId } = user;

    const [prescription] = await Promise.all([
      this.ensurePrescriptionBelongsToCompany(
        parsedData.prescriptionId,
        companyId,
      ),
      this.ensureResidentBelongsToCompany(parsedData.residentId, companyId),
    ]);

    this.ensurePrescriptionCanGenerateAdministration(prescription, parsedData);

    const administration = await MedicationAdministrationRepository.create({
      companyId,
      prescriptionId: parsedData.prescriptionId,
      residentId: parsedData.residentId,
      scheduledAt: new Date(parsedData.scheduledAt),
      status: PENDING_STATUS,
      notes: this.normalizeNullableText(parsedData.notes),
    });

    return this.formatActionAdministration(administration);
  }

  async generateFromPrescription(prescription, db) {
    const schedule = this.calculateAdministrationSchedule(prescription);

    const result = await MedicationAdministrationRepository.createMany(
      schedule.administrations,
      db,
    );

    return {
      count: result.count,
      periodStart: schedule.periodStart
        ? schedule.periodStart.toISOString()
        : null,
      periodEnd: schedule.periodEnd ? schedule.periodEnd.toISOString() : null,
    };
  }

  calculateAdministrationSchedule(prescription) {
    if (!prescription.isActive) {
      return {
        administrations: [],
        periodStart: null,
        periodEnd: null,
      };
    }

    const firstScheduledAt = new Date(prescription.firstScheduledAt);
    const startDate = new Date(prescription.startDate);
    const intervalInMs = prescription.intervalHours * HOUR_IN_MS;
    const periodEnd = prescription.endDate
      ? new Date(prescription.endDate)
      : new Date(
          firstScheduledAt.getTime() + DEFAULT_GENERATION_DAYS * DAY_IN_MS,
        );
    const includePeriodEnd = Boolean(prescription.endDate);
    const administrations = [];

    let scheduledAt = firstScheduledAt;

    if (scheduledAt < startDate) {
      const stepsToStartDate = Math.ceil(
        (startDate.getTime() - scheduledAt.getTime()) / intervalInMs,
      );

      scheduledAt = new Date(
        scheduledAt.getTime() + stepsToStartDate * intervalInMs,
      );
    }

    while (
      includePeriodEnd ? scheduledAt <= periodEnd : scheduledAt < periodEnd
    ) {
      administrations.push({
        companyId: prescription.companyId,
        prescriptionId: prescription.id,
        residentId: prescription.residentId,
        caregiverId: null,
        scheduledAt,
        administeredAt: null,
        status: PENDING_STATUS,
        notes: null,
        reason: null,
      });

      scheduledAt = new Date(scheduledAt.getTime() + intervalInMs);
    }

    return {
      administrations,
      periodStart: administrations[0]?.scheduledAt ?? null,
      periodEnd,
    };
  }

  async listTodayAdministrations(user, query = {}) {
    const filters = this.validateData(
      listMedicationAdministrationQuerySchema,
      query,
    );
    const { startOfDay, endOfDay } = this.getTodayRange();

    const administrations =
      await MedicationAdministrationRepository.findTodayByCompany(
        user.companyId,
        {
          startOfDay,
          endOfDay,
          status: filters.status,
        },
      );

    return administrations.map((administration) =>
      this.formatAdministration(administration),
    );
  }

  async listResidentAdministrations(user, residentId, query = {}) {
    this.validateData(residentMedicationAdministrationParamsSchema, {
      residentId,
    });

    const filters = this.validateData(
      listMedicationAdministrationQuerySchema,
      query,
    );

    await this.ensureResidentBelongsToCompany(residentId, user.companyId);

    const normalizedFilters = this.normalizeListFilters(filters);

    const administrations =
      await MedicationAdministrationRepository.findByResident(
        residentId,
        user.companyId,
        normalizedFilters,
      );

    return administrations.map((administration) =>
      this.formatAdministration(administration),
    );
  }

  async getAdministrationById(user, id) {
    const administration = await this.findAdministrationOrFail(
      id,
      user.companyId,
    );

    return this.formatAdministration(administration, {
      includeTimestamps: true,
    });
  }

  async markAsAdministered(user, id, administrationData) {
    this.ensureStatusUpdateRole(user.role);
    this.validateData(medicationAdministrationIdSchema, { id });

    const parsedData = this.validateData(
      administerMedicationSchema,
      administrationData,
    );
    const administration = await this.findAdministrationOrFail(
      id,
      user.companyId,
    );

    this.ensureAdministrationIsPending(administration);

    const updatedAdministration =
      await MedicationAdministrationRepository.updateStatus(
        id,
        user.companyId,
        {
          status: "administered",
          caregiverId: user.userId,
          administeredAt: parsedData.administeredAt
            ? new Date(parsedData.administeredAt)
            : new Date(),
          reason: null,
          ...this.buildOptionalNotesUpdate(parsedData),
        },
      );

    return this.formatActionAdministration(updatedAdministration);
  }

  async markAsRefused(user, id, administrationData) {
    this.ensureStatusUpdateRole(user.role);
    this.validateData(medicationAdministrationIdSchema, { id });

    const parsedData = this.validateData(
      refuseMedicationSchema,
      administrationData,
    );
    const administration = await this.findAdministrationOrFail(
      id,
      user.companyId,
    );

    this.ensureAdministrationIsPending(administration);

    const updatedAdministration =
      await MedicationAdministrationRepository.updateStatus(
        id,
        user.companyId,
        {
          status: "refused",
          caregiverId: user.userId,
          administeredAt: null,
          reason: parsedData.reason,
          ...this.buildOptionalNotesUpdate(parsedData),
        },
      );

    return this.formatActionAdministration(updatedAdministration);
  }

  async markAsMissed(user, id, administrationData) {
    this.ensureStatusUpdateRole(user.role);
    this.validateData(medicationAdministrationIdSchema, { id });

    const parsedData = this.validateData(
      missMedicationSchema,
      administrationData,
    );
    const administration = await this.findAdministrationOrFail(
      id,
      user.companyId,
    );

    this.ensureAdministrationIsPending(administration);

    const updatedAdministration =
      await MedicationAdministrationRepository.updateStatus(
        id,
        user.companyId,
        {
          status: "missed",
          caregiverId: user.userId,
          administeredAt: null,
          reason: parsedData.reason,
          ...this.buildOptionalNotesUpdate(parsedData),
        },
      );

    return this.formatActionAdministration(updatedAdministration);
  }

  async cancelAdministration(user, id, administrationData) {
    this.ensureAdminRole(
      user.role,
      "Apenas administradores podem cancelar administrações",
    );
    this.validateData(medicationAdministrationIdSchema, { id });

    const parsedData = this.validateData(
      cancelMedicationSchema,
      administrationData,
    );
    const administration = await this.findAdministrationOrFail(
      id,
      user.companyId,
    );

    this.ensureAdministrationIsPending(administration);

    const updatedAdministration =
      await MedicationAdministrationRepository.updateStatus(
        id,
        user.companyId,
        {
          status: "canceled",
          administeredAt: null,
          reason: parsedData.reason,
          ...this.buildOptionalNotesUpdate(parsedData),
        },
      );

    return this.formatActionAdministration(updatedAdministration);
  }

  validateData(schema, data) {
    const validation = schema.safeParse(data);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0] || "request";

      throw new ValidationError(field, firstIssue.message);
    }

    return validation.data;
  }

  async findAdministrationOrFail(id, companyId) {
    this.validateData(medicationAdministrationIdSchema, { id });

    const administration =
      await MedicationAdministrationRepository.findByIdAndCompany(
        id,
        companyId,
      );

    if (!administration) {
      throw new NotFoundError(
        "medicationAdministration",
        "Administração de medicamento não encontrada",
      );
    }

    return administration;
  }

  async ensurePrescriptionBelongsToCompany(prescriptionId, companyId) {
    const prescription =
      await MedicationAdministrationRepository.checkPrescriptionBelongsToCompany(
        prescriptionId,
        companyId,
      );

    if (!prescription) {
      throw new NotFoundError("prescription", "Prescrição não encontrada");
    }

    return prescription;
  }

  async ensureResidentBelongsToCompany(residentId, companyId) {
    const resident =
      await MedicationAdministrationRepository.checkResidentBelongsToCompany(
        residentId,
        companyId,
      );

    if (!resident) {
      throw new NotFoundError("resident", "Residente não encontrado");
    }

    return resident;
  }

  ensurePrescriptionCanGenerateAdministration(prescription, administrationData) {
    if (!prescription.isActive) {
      throw new ValidationError(
        "prescriptionId",
        "Prescrição inativa não pode gerar novas administrações",
      );
    }

    if (prescription.residentId !== administrationData.residentId) {
      throw new ValidationError(
        "residentId",
        "Prescrição informada não pertence ao residente informado",
      );
    }
  }

  ensureAdministrationIsPending(administration) {
    if (administration.status !== PENDING_STATUS) {
      throw new ConflictError(
        "status",
        "Apenas administrações pendentes podem ser alteradas",
      );
    }
  }

  ensureStatusUpdateRole(role) {
    if (!["admin", "caregiver"].includes(role)) {
      throw new ValidationError(
        "role",
        "Usuário não possui permissão para alterar administração",
      );
    }
  }

  ensureAdminRole(role, message) {
    if (role !== "admin") {
      throw new ValidationError("role", message);
    }
  }

  getTodayRange() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  }

  normalizeListFilters(filters) {
    const normalizedFilters = {
      status: filters.status,
    };

    if (filters.startDate) {
      normalizedFilters.startDate = new Date(filters.startDate);
    }

    if (filters.endDate) {
      normalizedFilters.endDate = new Date(filters.endDate);
    }

    if (
      normalizedFilters.startDate &&
      normalizedFilters.endDate &&
      normalizedFilters.endDate < normalizedFilters.startDate
    ) {
      throw new ValidationError(
        "endDate",
        "endDate não pode ser menor que startDate",
      );
    }

    return normalizedFilters;
  }

  normalizeNullableText(value) {
    if (value === undefined || value === null || value === "") return null;

    return value;
  }

  buildOptionalNotesUpdate(data) {
    if (!Object.prototype.hasOwnProperty.call(data, "notes")) return {};

    return {
      notes: this.normalizeNullableText(data.notes),
    };
  }

  formatAdministration(administration, options = {}) {
    const { includeTimestamps = false } = options;
    const prescription = administration.prescription;

    const data = {
      id: administration.id,
      scheduledAt: administration.scheduledAt.toISOString(),
      administeredAt: administration.administeredAt
        ? administration.administeredAt.toISOString()
        : null,
      status: this.toApiStatus(administration.status),
      resident: administration.resident,
      medication: prescription.medication,
      measurementUnit: prescription.measurementUnit,
      prescription: {
        id: prescription.id,
        dosage: prescription.dosage,
        route: prescription.route,
        frequency: prescription.frequency,
      },
      caregiver: administration.caregiver,
      notes: administration.notes,
      reason: administration.reason,
    };

    if (includeTimestamps) {
      data.createdAt = administration.createdAt.toISOString();
      data.updatedAt = administration.updatedAt.toISOString();
    }

    return data;
  }

  formatActionAdministration(administration) {
    return {
      id: administration.id,
      status: this.toApiStatus(administration.status),
      scheduledAt: administration.scheduledAt.toISOString(),
      administeredAt: administration.administeredAt
        ? administration.administeredAt.toISOString()
        : null,
      reason: administration.reason,
    };
  }

  toApiStatus(status) {
    return status.toUpperCase();
  }
}

export default new MedicationAdministrationService();
