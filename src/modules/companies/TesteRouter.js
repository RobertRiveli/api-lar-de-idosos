import TestController from "../controllers/TestController.js";
class TestRouter {
  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", TestController.test);
  }
}

export default new TestRouter().router;
