import { prisma } from "../database/prisma.js";
import UserService from "../services/UserService.js";

class UserController {
  create = async (req, res, next) => {
    try {
      const userData = req.body;

      await UserService.registerUser(userData);
      return res.status(201).json("Usuário criado com sucesso");
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

export default new UserController();
