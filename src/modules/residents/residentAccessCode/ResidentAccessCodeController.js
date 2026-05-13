import ResidentAccessCodeService from "./ResidentAccessCodeService.js";

class ResidentAccessCodeController {
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
