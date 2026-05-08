import { Router } from "express";
import { familyAuthMiddleware } from "../../middlewares/familyAuthMiddleware.js";
import ResidentFamilyAccessController from "./ResidentFamilyAccessController.js";
import {
  validateRedeemResidentAccessCode,
  validateResidentFamilyAccessParams,
} from "./ResidentFamilyAccessSchema.js";

class ResidentFamilyAccessRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/residents",
      familyAuthMiddleware,
      ResidentFamilyAccessController.listResidents,
    );

    this.router.get(
      "/residents/:residentId",
      familyAuthMiddleware,
      validateResidentFamilyAccessParams,
      ResidentFamilyAccessController.getResidentDetails,
    );

    this.router.post(
      "/access-codes/redeem",
      familyAuthMiddleware,
      validateRedeemResidentAccessCode,
      ResidentFamilyAccessController.redeemAccessCode,
    );
  }
}

export default new ResidentFamilyAccessRouter().router;
