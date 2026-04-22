import { prisma } from "../database/prisma.js";

class UserController {
  create = async (req, res, next) => {
    try {
      const { password: passwordHash, ...userData } = req.body;
      userData.passwordHash = passwordHash;

      const newUser = await prisma.user.create({ data: userData });
      return res.status(201).json(newUser);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
}

export default new UserController();
