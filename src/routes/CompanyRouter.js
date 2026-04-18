import { Router } from "express";
import companyController from "../controllers/CompanyCotroller.js";

class CompanyRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", companyController.create);
  }
}

export default new CompanyRouter().router;
