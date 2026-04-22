import { Router } from "express";
import companyController from "../controllers/CompanyController.js";
import { sanitizeCompanyData } from "../middlewares/sanitizeCompanyData.js";

class CompanyRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", sanitizeCompanyData, companyController.create);
  }
}

export default new CompanyRouter().router;
