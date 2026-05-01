import express from "express";
import CompanyRouter from "./modules/companies/CompanyRouter.js";
import UserRouter from "./modules/users/UserRouter.js";
import AuthRouter from "./modules/auth/AuthRouter.js";
import MedicationRouter from "./modules/medications/MedicationRouter.js";
import ResidentRouter from "./modules/residents/ResidentRouter.js";
import MeasurementUnitRouter from "./modules/measurementUnits/MeasurementUnitRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";

class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
    this.errorMiddleware();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/companies", CompanyRouter);
    this.app.use("/users", UserRouter);
    this.app.use("/auth", AuthRouter);
    this.app.use("/residents", ResidentRouter);
    this.app.use("/medications", MedicationRouter);
    this.app.use("/measurement-units", MeasurementUnitRouter);
  }

  errorMiddleware() {
    this.app.use(errorHandler);
  }
}

export default new App().app;
