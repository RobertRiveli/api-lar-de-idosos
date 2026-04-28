import express from "express";
import companyRouter from "./routes/CompanyRouter.js";
import userRouter from "./routes/UserRouter.js";
import authRouter from "./routes/AuthRouter.js";
import MedicationRouter from "./routes/MedicationRouter.js";
import ResidentRouter from "./routes/ResidentRouter.js";
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
    this.app.use("/companies", companyRouter);
    this.app.use("/users", userRouter);
    this.app.use("/auth", authRouter);
    this.app.use("/residents", ResidentRouter);
    this.app.use("/medications", MedicationRouter);
  }

  errorMiddleware() {
    this.app.use(errorHandler);
  }
}

export default new App().app;
