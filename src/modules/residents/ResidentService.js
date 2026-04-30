import ResidentRepository from "./ResidentRepository.js";
import ValidationError from "../../errors/ValidationError.js";
import residentSchema from "../../validators/residentValidator.js";
import ConflictError from "../../errors/ConflictError.js";

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
      birthDate: new Date(residentData.birthDate),
      admissionDate: new Date(residentData.admissionDate),
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
      throw new ValidationError("resident", "Residente não encontrado");
    }

    return resident;
  }

  validateResidentData(residentData) {
    const validation = residentSchema.safeParse(residentData);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const field = firstIssue.path[0];

      throw new ValidationError(field, firstIssue.message);
    }
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
}
export default new ResidentService();
