import { Router } from "express";
import MeasurementUnitController from "./MeasurementUnitController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

class MeasurementUnitRouter {
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get("/", authMiddleware, MeasurementUnitController.index);
  }
}

export default new MeasurementUnitRouter().router;
