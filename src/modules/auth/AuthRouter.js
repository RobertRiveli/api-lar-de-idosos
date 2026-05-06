import { Router } from "express";
import AuthController from "./AuthController.js";
import FamilyAuthController from "./family/FamilyAuthController.js";
import {
  sanitizeAuthData,
  sanitizeFamilyAuthData,
} from "../../middlewares/sanitizeData.js";

const router = Router();

router.post("/", sanitizeAuthData, AuthController.login);
router.post("/family", sanitizeFamilyAuthData, FamilyAuthController.login);

export default router;
