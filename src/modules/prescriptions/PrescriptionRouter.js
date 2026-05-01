import { Router } from "express";
import PrescriptionController from "./PrescriptionController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

class PrescriptionRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", authMiddleware, PrescriptionController.create);
    this.router.get("/", authMiddleware, PrescriptionController.findMany);
    this.router.get("/:id", authMiddleware, PrescriptionController.findById);
    this.router.patch("/:id", authMiddleware, PrescriptionController.update);
    this.router.delete(
      "/:id",
      authMiddleware,
      PrescriptionController.deactivate,
    );
  }
}

export default new PrescriptionRouter().router;
