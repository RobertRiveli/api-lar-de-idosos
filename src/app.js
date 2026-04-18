import express from "express";
import companyRouter from "./routes/CompanyRouter.js";

class App {
  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/companies", companyRouter);
  }
}

export default new App().app;
