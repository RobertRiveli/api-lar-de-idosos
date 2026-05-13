import { Router } from "express";
import ResidentConditionController from "./ResidentConditionController.js";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import authorizeRoles from "../../../middlewares/authorizeRoles.js";

class ResidentConditionRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post(
      "/",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentConditionController.create,
    );
    this.router.delete(
      "/:id",
      authMiddleware,
      authorizeRoles("admin"),
      ResidentConditionController.delete,
    );
  }
}

export default new ResidentConditionRouter().router;
