// import companyService from "../services/CompanyService.js";
import { prisma } from "../database/prisma.js";

class CompanyCotroller {
  create = async (req, res) => {
    try {
      const data = req.body;

      const newCompany = await prisma.company.create({ data: req.body });

      return res.status(201).json(newCompany);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}

export default new CompanyCotroller();
