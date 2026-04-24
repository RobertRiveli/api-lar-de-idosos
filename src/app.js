import express from "express";
import companyRouter from "./routes/CompanyRouter.js";
import userRouter from "./routes/UserRouter.js";
import authRouter from "./routes/AuthRouter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cors from "cors";
import TestController from "./controllers/TestController.js";
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
    this.app.use("/test", TestController.test);
  }

  errorMiddleware() {
    this.app.use(errorHandler);
  }
}

export default new App().app;
