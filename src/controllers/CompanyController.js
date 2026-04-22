import companyService from "../services/CompanyService.js";
class CompanyCotroller {
  create = async (req, res, next) => {
    try {
      const { legalName, tradeName, taxId, email, phone } = req.body;

      const newCompany = await companyService.resgisterCompany({
        legalName,
        tradeName,
        taxId,
        email,
        phone,
      });

      return res.status(201).json({ success: true, company: newCompany });
    } catch (error) {
      next(error);
    }
  };
}

export default new CompanyCotroller();
