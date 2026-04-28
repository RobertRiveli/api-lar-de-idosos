import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import { sanitizeAuthData } from "../middlewares/sanitizeData.js";

const router = Router();

router.post("/", sanitizeAuthData, AuthController.login);

export default router;
