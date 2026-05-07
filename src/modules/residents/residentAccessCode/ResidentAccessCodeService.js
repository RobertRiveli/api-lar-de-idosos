import CompanyService from "../../companies/CompanyService.js";
import ResidentAccessCodeRepository from "./ResidentAccessCodeRepository.js";
import NotFoundError from "../../../errors/NotFoundError.js";
import ResidentService from "../ResidentService.js";

class ResidentAccessCodeService {
  async create(residentId, companyId, maxUses) {
    const companyExists = await CompanyService.companyExists(companyId);

    if (!companyExists) {
      throw new NotFoundError("Empresa relacionada não encontrada");
    }

    await ResidentService.exists(residentId);

    const code = this.generateAccessCode();
    const today = new Date();
    const expiresAt = new Date(today.setDate(today.getDate() + 1));

    const data = {
      residentId,
      companyId,
      maxUses,
      code,
      expiresAt,
    };

    const result = await ResidentAccessCodeRepository.create(data);

    return result;
  }

  generateAccessCode() {
    const chars = "ABCDEFGHIJOKLMOPQRSTUVWXYZ1234567890";
    let code = "";
    const length = 6;
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
  }
}

export default new ResidentAccessCodeService();
