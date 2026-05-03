import { Router } from "express";
import healthConditionController from "./healthConditionController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import authorizeRoles from "../../middlewares/authorizeRoles.js";
class healthConditionRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("admin"),
      healthConditionController.index,
    );
  }
}

export default new healthConditionRouter().router;
