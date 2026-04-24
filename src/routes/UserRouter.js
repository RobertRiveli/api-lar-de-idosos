import { Router } from "express";
import UserController from "../controllers/UserController.js";
import { sanitizeUserData } from "../middlewares/sanitizeCompanyData.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

class UserRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", sanitizeUserData, UserController.create);
    this.router.get("/profile", authMiddleware, UserController.profile);
  }
}

export default new UserRouter().router;
