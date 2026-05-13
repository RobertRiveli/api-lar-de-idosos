import { Router } from "express";
import ResidentController from "./ResidentController.js";
import PrescriptionController from "../prescriptions/PrescriptionController.js";
import MedicationAdministrationController from "../medicationAdministrations/MedicationAdministrationController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { sanitizeResidentData } from "../../middlewares/sanitizeData.js";
import ResidentConditionController from "./residentConditions/ResidentConditionController.js";
import ResidentAccessCodeController from "./residentAccessCode/ResidentAccessCodeController.js";
import { validateCreateResidentAccessCode } from "./residentAccessCode/ResidentAccessCodeSchema.js";
import authorizeRoles from "../../middlewares/authorizeRoles.js";
import ResidentFamilyAccessController from "../residentFamilyAccess/ResidentFamilyAccessController.js";
import { validateResidentFamilyAccessParams } from "../residentFamilyAccess/ResidentFamilyAccessSchema.js";

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
    this.router.patch(
      "/:residentId",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentController.update,
    );
    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentController.list,
    );

    this.router.get(
      "/:residentId/prescriptions",
      authMiddleware,
      PrescriptionController.findManyByResident,
    );
    this.router.get(
      "/:residentId/medication-administrations",
      authMiddleware,
      MedicationAdministrationController.listByResident,
    );
    this.router.get("/:id", authMiddleware, ResidentController.show);
    this.router.get(
      "/:residentId/conditions",
      authMiddleware,
      ResidentConditionController.findManyByResident,
    );

    this.router.get(
      "/:residentId/overview",
      authMiddleware,
      ResidentController.overview,
    );

    this.router.post(
      "/:residentId/access-codes",
      authMiddleware,
      authorizeRoles("admin"),
      validateCreateResidentAccessCode,
      ResidentAccessCodeController.create,
    );
    this.router.get(
      "/:residentId/access-codes",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentAccessCodeController.listActiveByResident,
    );

    this.router.get(
      "/:residentId/family-members",
      authMiddleware,
      validateResidentFamilyAccessParams,
      ResidentFamilyAccessController.listFamilyMembersByResident,
    );

    this.router.delete(
      "/:residentId",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentController.delete,
    );
  }
}

export default new ResidentRouter().router;
