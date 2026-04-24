import AuthService from "../services/AuthService.js";
import ValidationError from "../errors/ValidationError.js";

class AuthController {
  login = async (req, res, next) => {
    try {
      const result = await AuthService.login(req.body);

      return res.status(200).json({
        success: true,
        message: "Login realizado com sucesso",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
