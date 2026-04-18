import companyService from "../services/CompanyService.js";

class CompanyCotroller {
  create = async (req, res) => {
    try {
      const { legalName, tradeName, taxId, email, phone } = req.body;

      const newCompany = await companyService.resgisterCompany({
        legalName,
        tradeName,
        taxId,
        email,
        phone,
      });

      return res.status(201).json(newCompany);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}

export default new CompanyCotroller();
