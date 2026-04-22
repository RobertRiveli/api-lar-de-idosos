import { Router } from "express";
import UserController from "../controllers/UserController.js";
class UserRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", UserController.create);
  }
}

export default new UserRouter().router;
