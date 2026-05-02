import { Router } from "express";
import MedicationAdministrationController from "./MedicationAdministrationController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

class MedicationAdministrationRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post(
      "/manual",
      authMiddleware,
      MedicationAdministrationController.create,
    );
    this.router.get(
      "/today",
      authMiddleware,
      MedicationAdministrationController.listToday,
    );
    this.router.get(
      "/:id",
      authMiddleware,
      MedicationAdministrationController.findById,
    );
    this.router.patch(
      "/:id/administer",
      authMiddleware,
      MedicationAdministrationController.administer,
    );
    this.router.patch(
      "/:id/refuse",
      authMiddleware,
      MedicationAdministrationController.refuse,
    );
    this.router.patch(
      "/:id/miss",
      authMiddleware,
      MedicationAdministrationController.miss,
    );
    this.router.patch(
      "/:id/cancel",
      authMiddleware,
      MedicationAdministrationController.cancel,
    );
  }
}

export default new MedicationAdministrationRouter().router;
