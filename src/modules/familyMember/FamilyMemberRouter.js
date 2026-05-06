import { Router } from "express";
import { sanitizeFamilyMemberData } from "../../middlewares/sanitizeData.js";
import FamilyMemberController from "./FamilyMemberController.js";
import { validateCreateFamilyMember } from "./FamilyMemberSchema.js";

class FamilyMemberRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post(
      "/",
      sanitizeFamilyMemberData,
      validateCreateFamilyMember,
      FamilyMemberController.create,
    );
  }
}

export default new FamilyMemberRouter().router;
