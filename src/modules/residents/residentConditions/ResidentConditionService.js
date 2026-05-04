import ResidentConditionRepository from "./ResidentConditionRepository.js";
import NotFoundError from "../../../errors/NotFoundError.js";
import healthConditionRepository from "../../healthConditions/healthConditionRepository.js";
import ConflictError from "../../../errors/ConflictError.js";
import ResidentRepository from "../ResidentRepository.js";
import ValidationError from "../../../errors/ValidationError.js";
import {
  createResidentConditionSchema,
  residentConditionIdSchema,
  residentConditionResidentParamsSchema,
} from "../../../validators/residentConditionValidator.js";

class ResidentConditionService {
  async create(data, companyId) {
    const parsedData = this.validateData(createResidentConditionSchema, data);

    await this.ensureResidentBelongsToCompany(parsedData.residentId, companyId);
    await this.ensureHealthConditionExists(parsedData.healthConditionId);
    await this.ensureResidentConditionDoesNotExist(
      parsedData.residentId,
      parsedData.healthConditionId,
    );

    return await ResidentConditionRepository.create({
      residentId: parsedData.residentId,
      healthConditionId: parsedData.healthConditionId,
      observations: this.normalizeNullableText(parsedData.observations),
    });
  }

  async findManyByResident(residentId, companyId) {
    const parsedParams = this.validateData(
      residentConditionResidentParamsSchema,
      { residentId },
    );

    await this.ensureResidentBelongsToCompany(
      parsedParams.residentId,
      companyId,
    );

    return await ResidentConditionRepository.findManyByResident(
      parsedParams.residentId,
    );
  }

  async delete(id, companyId) {
    const parsedParams = this.validateData(residentConditionIdSchema, { id });
    const residentCondition = await ResidentConditionRepository.findById(
      parsedParams.id,
    );

    if (!residentCondition) {
      throw new NotFoundError(
        "residentCondition",
        "Condição do residente não encontrada",
      );
    }

    if (residentCondition.resident.companyId !== companyId) {
      throw new NotFoundError(
        "residentCondition",
        "Condição do residente não encontrada",
      );
    }

    return await ResidentConditionRepository.delete(parsedParams.id);
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

  async ensureHealthConditionExists(healthConditionId) {
    const healthCondition =
      await healthConditionRepository.findById(healthConditionId);

    if (!healthCondition) {
      throw new NotFoundError(
        "healthConditionId",
        "Condição não encontrada",
      );
    }

    return healthCondition;
  }

  async ensureResidentConditionDoesNotExist(residentId, healthConditionId) {
    const alreadyExists =
      await ResidentConditionRepository.findByResidentAndHealthCondition(
        residentId,
        healthConditionId,
      );

    if (alreadyExists) {
      throw new ConflictError(
        "healthConditionId",
        "Esta condição já está vinculada ao residente",
      );
    }
  }

  normalizeNullableText(value) {
    if (value === undefined || value === null || value === "") return null;

    return value;
  }
}

export default new ResidentConditionService();
