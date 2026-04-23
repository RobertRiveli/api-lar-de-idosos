import { Router } from "express";
import UserController from "../controllers/UserController.js";
import { sanitizeUserData } from "../middlewares/sanitizeCompanyData.js";
class UserRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", sanitizeUserData, UserController.create);
  }
}

export default new UserRouter().router;
