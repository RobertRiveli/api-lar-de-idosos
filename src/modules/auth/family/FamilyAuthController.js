import FamilyAuthService from "./FamilyAuthService.js";

class FamilyAuthController {
  login = async (req, res, next) => {
    try {
      const result = await FamilyAuthService.login(req.body);

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

export default new FamilyAuthController();
