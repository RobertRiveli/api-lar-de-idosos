import ResidentAccessCodeService from "./ResidentAccessCodeService.js";

class ResidentAccessCodeController {
  listActiveByResident = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const companyId = req.user.companyId;

      const accessCodes = await ResidentAccessCodeService.listActiveByResident(
        residentId,
        companyId,
      );

      res.status(200).json({
        success: true,
        accessCodes,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const companyId = req.user.companyId;
      const maxUses = req.body.maxUses;

      const result = await ResidentAccessCodeService.create(
        residentId,
        companyId,
        maxUses,
      );

      res.status(201).json({
        success: true,
        message: "Código criado com sucesso",
        code: result.code,
        expiresAt: result.expiresAt,
        maxUses: result.maxUses,
        residentId,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ResidentAccessCodeController();
