import ResidentConditionService from "./ResidentConditionService.js";

class ResidentConditionController {
  create = async (req, res, next) => {
    try {
      const companyId = req.user.companyId;

      const residentCondition = await ResidentConditionService.create(
        req.body,
        companyId,
      );

      return res.status(201).json({
        success: true,
        residentCondition,
      });
    } catch (error) {
      next(error);
    }
  };

  findManyByResident = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const companyId = req.user.companyId;

      const healthConditions =
        await ResidentConditionService.findManyByResident(
          residentId,
          companyId,
        );

      return res.status(200).json({
        success: true,
        healthConditions,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;

      const residentCondition = await ResidentConditionService.delete(
        id,
        companyId,
      );

      return res.status(200).json({
        success: true,
        message: "Condição do residente removida com sucesso",
        residentCondition,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ResidentConditionController();
