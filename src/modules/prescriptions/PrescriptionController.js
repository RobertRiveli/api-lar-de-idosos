import PrescriptionService from "./PrescriptionService.js";

class PrescriptionController {
  create = async (req, res, next) => {
    try {
      const prescription = await PrescriptionService.createPrescription(
        req.user,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: "Prescrição cadastrada com sucesso",
        prescription,
      });
    } catch (error) {
      next(error);
    }
  };

  findMany = async (req, res, next) => {
    try {
      const prescriptions =
        await PrescriptionService.listPrescriptions(req.user);

      res.status(200).json({ success: true, prescriptions });
    } catch (error) {
      next(error);
    }
  };

  findManyByResident = async (req, res, next) => {
    try {
      const { residentId } = req.params;
      const prescriptions =
        await PrescriptionService.listPrescriptionsByResident(
          req.user,
          residentId,
        );

      res.status(200).json({ success: true, prescriptions });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const prescription = await PrescriptionService.getPrescriptionById(
        req.user,
        id,
      );

      res.status(200).json({ success: true, prescription });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const prescription = await PrescriptionService.updatePrescription(
        req.user,
        id,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Prescrição atualizada com sucesso",
        prescription,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req, res, next) => {
    try {
      const { id } = req.params;
      const prescription = await PrescriptionService.deactivatePrescription(
        req.user,
        id,
      );

      res.status(200).json({
        success: true,
        message: "Prescrição desativada com sucesso",
        prescription,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new PrescriptionController();
