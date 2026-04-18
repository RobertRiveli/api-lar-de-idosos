import companyRepository from "../repositories/CompanyRepository.js";

class CompanyService {
  async resgisterCompany(companyData) {
    const alreadyExists = await companyRepository.findByTaxId(
      companyData.taxId,
    );

    if (alreadyExists) {
      throw new Error("Já existe uma empresa cadastrada com esse CNPJ");
    }

    return await companyRepository.create(companyData);
  }
}

export default new CompanyService();
