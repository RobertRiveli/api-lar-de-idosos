import UserService from "../services/UserService.js";

class UserController {
  create = async (req, res, next) => {
    try {
      const userData = req.body;

      const data = await UserService.registerUser(userData);
      return res.status(201).json({
        status: true,
        message: "Usuário criado com sucesso",
        newUser: data,
      });
    } catch (error) {
      next(error);
    }
  };

  profile = async (req, res, next) => {
    try {
      const user = await UserService.getProfile(req.user.userId);

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
}

export default new UserController();
