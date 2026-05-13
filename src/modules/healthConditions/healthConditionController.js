import healthConditionService from "./healthConditionService.js";

class healthConditionController {
  index = async (req, res, next) => {
    try {
      const conditions = await healthConditionService.list();

      res.status(200).json({
        success: true,
        message: "Condições de saúde listadas com sucesso.",
        conditions,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new healthConditionController();
