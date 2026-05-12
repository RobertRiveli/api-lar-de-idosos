import ResidentRepository from "./ResidentRepository.js";
import ValidationError from "../../errors/ValidationError.js";
import residentSchema, {
  updateResidentSchema,
} from "../../validators/residentValidator.js";
import NotFoundError from "../../errors/NotFoundError.js";
import ConflictError from "../../errors/ConflictError.js";
import CompanyService from "../companies/CompanyService.js";
import ResidentConditionService from "./residentConditions/ResidentConditionService.js";
import PrescriptionService from "../prescriptions/PrescriptionService.js";
import MedicationAdministrationService from "../medicationAdministrations/MedicationAdministrationService.js";

class ResidentService {
  async create(residentData, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem adicionar residentes",
      );
    }

    this.validateResidentData(residentData);

    await this.checkConflict(residentData.cpf, companyId);

    const data = {
      ...residentData,
      companyId,
      birthDate: this.parseDate(residentData.birthDate),
      admissionDate: this.parseDate(residentData.admissionDate),
    };

    const resident = await ResidentRepository.create(data);

    return resident;
  }

  async list(companyId) {
    return await ResidentRepository.findManyByCompany(companyId);
  }

  async getResidentById(id, companyId) {
    const resident = await ResidentRepository.findByIdAndComanyId(
      id,
      companyId,
    );

    if (!resident) {
      throw new NotFoundError("Residente não encontrado");
    }

    return resident;
  }

  async getResidentDetails(residentId, companyId, user) {
    const resident = await this.exists(residentId, companyId);

    const [residentHealthConditions, residentPrescriptions, administrations] =
      await Promise.all([
        ResidentConditionService.findManyByResident(residentId),
        PrescriptionService.listPrescriptionsByResident(user, residentId),
        MedicationAdministrationService.listResidentAdministrations(
          user,
          residentId,
        ),
      ]);

    const residentOverview = {
      resident,
      healthConditions: residentHealthConditions,
      prescriptions: residentPrescriptions,
      administrations,
    };

    return residentOverview;
  }

  async exists(residentId, companyId) {
    const residentExists = await this.getResidentById(residentId, companyId);

    if (!residentExists) throw new NotFoundError("Residente não encontrado");

    return residentExists;
  }

  validateResidentData(residentData) {
    const validation = residentSchema.safeParse(residentData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
  }

  parseDate(dateString) {
    const [day, month, year] = dateString.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  async checkConflict(cpf, companyId) {
    if (!cpf) return;

    const duplicate = await ResidentRepository.findByCpfAndCompanyId(
      cpf,
      companyId,
    );

    if (duplicate) {
      throw new ConflictError("cpf", "CPF já cadastrado");
    }
  }

  async deactivate(id, companyId, userRole) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem desativar residentes",
      );
    }

    const resident = await this.exists(id, companyId);

    if (!resident) {
      throw new NotFoundError("Residente não encontrado");
    }

    if (resident.companyId !== companyId) {
      return;
    }

    if (resident.status === "inactive") {
      throw new ConflictError("resident", "Residente já está inativo");
    }

    return await ResidentRepository.deactivate(id, companyId);
  }

  async updateResident(residentId, companyId, userRole, residentData) {
    if (userRole !== "admin") {
      throw new ValidationError(
        "role",
        "Apenas administradores podem editar residentes",
      );
    }

    const validData = this.validateResidentUpdateData(residentData);

    const residentExists = await ResidentRepository.findByIdAndCompanyId(
      residentId,
      companyId,
    );

    if (!residentExists) {
      throw new NotFoundError("Residente não encontrado");
    }

    if (validData.cpf) {
      const duplicate = await ResidentRepository.findByCpfAndCompanyId(
        validData.cpf,
        companyId,
      );

      if (duplicate && duplicate.id !== residentId) {
        throw new ConflictError("cpf", "CPF já cadastrado");
      }
    }

    const data = { ...validData };

    if (data.birthDate) {
      data.birthDate = this.parseDate(data.birthDate);
    }

    if (data.admissionDate) {
      data.admissionDate = this.parseDate(data.admissionDate);
    }

    const updatedResident = await ResidentRepository.update(
      residentId,
      companyId,
      data,
    );

    if (!updatedResident) {
      throw new NotFoundError("Residente não encontrado");
    }

    return updatedResident;
  }

  validateResidentUpdateData(residentData) {
    const validation = updateResidentSchema.safeParse(residentData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }

    return validation.data;
  }
}
export default new ResidentService();
