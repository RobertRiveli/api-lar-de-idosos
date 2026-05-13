import { Router } from "express";
import MedicationController from "./MedicationController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

class MedicationRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", authMiddleware, MedicationController.create);
    this.router.get("/", authMiddleware, MedicationController.list);
    this.router.get("/:id", authMiddleware, MedicationController.show);
    this.router.put("/:id", authMiddleware, MedicationController.update);
    this.router.delete("/:id", authMiddleware, MedicationController.delete);
  }
}

export default new MedicationRouter().router;
