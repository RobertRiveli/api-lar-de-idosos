import { Router } from "express";
import ResidentController from "../controllers/ResidentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { sanitizeResidentData } from "../middlewares/sanitizeCompanyData.js";

class ResidentRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post(
      "/",
      authMiddleware,
      sanitizeResidentData,
      ResidentController.create,
    );
    this.router.get("/", authMiddleware, ResidentController.list);
    this.router.get("/:id", authMiddleware, ResidentController.show);
  }
}

export default new ResidentRouter().router;
