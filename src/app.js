import express from "express";
import CompanyRouter from "./modules/companies/CompanyRouter.js";
import UserRouter from "./modules/users/UserRouter.js";
import AuthRouter from "./modules/auth/AuthRouter.js";
import MedicationRouter from "./modules/medications/MedicationRouter.js";
import ResidentRouter from "./modules/residents/ResidentRouter.js";
import MeasurementUnitRouter from "./modules/measurementUnits/MeasurementUnitRouter.js";
import PrescriptionRouter from "./modules/prescriptions/PrescriptionRouter.js";
import MedicationAdministrationRouter from "./modules/medicationAdministrations/MedicationAdministrationRouter.js";
import healthConditionRouter from "./modules/healthConditions/healthConditionRouter.js";
import FamilyMemberRouter from "./modules/familyMember/FamilyMemberRouter.js";
import ResidentFamilyAccessRouter from "./modules/residentFamilyAccess/ResidentFamilyAccessRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";
import ResidentConditionRouter from "./modules/residents/residentConditions/ResidentConditionRouter.js";
import TestController from "./modules/tests/TestController.js";

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
    this.app.use("/prescriptions", PrescriptionRouter);
    this.app.use("/medication-administrations", MedicationAdministrationRouter);
    this.app.use("/health-conditions", healthConditionRouter);
    this.app.use("/resident-conditions", ResidentConditionRouter);
    this.app.use("/family-members", FamilyMemberRouter);
    this.app.use("/family-members", ResidentFamilyAccessRouter);
    this.app.use("/companies", CompanyRouter);
    this.app.use("/users", UserRouter);
    this.app.use("/auth", AuthRouter);
    this.app.use("/test", TestController.test);
  }

  errorMiddleware() {
    this.app.use(errorHandler);
  }
}

export default new App().app;
