import { Router } from "express";
import UserController from "./UserController.js";
import { sanitizeUserData } from "../../middlewares/sanitizeData.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import authorizeRoles from "../../middlewares/authorizeRoles.js";
class UserRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post(
      "/",
      authMiddleware,
      sanitizeUserData,
      UserController.create,
    );
    this.router.get("/profile", authMiddleware, UserController.profile);
    this.router.get(
      "/",
      authMiddleware,
      authorizeRoles("admin"),
      UserController.getAllByCompany,
    );
  }
}

export default new UserRouter().router;
