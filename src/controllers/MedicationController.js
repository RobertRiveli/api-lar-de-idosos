import MedicationService from "../services/MedicationService.js";

class MedicationController {
  create = async (req, res, next) => {
    try {
      const { companyId, role } = req.user;

      const medicationData = req.body;

      const newMedication = await MedicationService.create(
        medicationData,
        companyId,
        role,
      );
      res.status(201).json({
        success: true,
        message: "Medicamento cadastrado com sucesso",
        medication: newMedication,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const { companyId } = req.user;

      const medications = await MedicationService.list(companyId);

      res.status(200).json({ success: true, medications });
    } catch (error) {
      next(error);
    }
  };
}

export default new MedicationController();
