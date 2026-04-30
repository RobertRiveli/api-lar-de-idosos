import { Router } from "express";
import ResidentController from "./ResidentController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { sanitizeResidentData } from "../../middlewares/sanitizeData.js";

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
