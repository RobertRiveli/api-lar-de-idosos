import ResidentService from "./ResidentService.js";

class ResidentController {
  create = async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const userRole = req.user.role;
      const residentData = req.body;

      const resident = await ResidentService.create(
        residentData,
        companyId,
        userRole,
      );

      res.status(201).json({
        success: true,
        message: "Residente adicionado com sucesso",
        resident,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const residents = await ResidentService.list(companyId);

      res.status(200).json({ success: true, residents });
    } catch (error) {
      next(error);
    }
  };

  show = async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const residentId = req.params.id;

      const resident = await ResidentService.getResidentById(
        residentId,
        companyId,
      );

      res.status(200).json({ success: true, resident });
    } catch (error) {
      next(error);
    }
  };

  overview = async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const residentId = req.params.residentId;

      const residentOverview = await ResidentService.getResidentDetails(
        residentId,
        companyId,
        req.user,
      );

      res.status(200).json({ success: true, residentOverview });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const { companyId, role } = req.user;

      const resident = await ResidentService.deactivate(
        residentId,
        companyId,
        role,
      );

      return res.status(200).json({
        success: true,
        message: "Residente excluído com sucesso",

        resident,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ResidentController();
