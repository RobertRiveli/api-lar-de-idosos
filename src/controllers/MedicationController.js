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

  show = async (req, res, next) => {
    try {
      const { companyId } = req.user;
      const { id } = req.params;

      const medication = await MedicationService.getById(id, companyId);

      res.status(200).json({ success: true, medication });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { companyId, role } = req.user;
      const { id } = req.params;
      const medicationData = req.body;

      const medication = await MedicationService.update(
        id,
        medicationData,
        companyId,
        role,
      );

      res.status(200).json({
        success: true,
        message: "Medicamento atualizado com sucesso",
        medication,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { companyId, role } = req.user;
      const { id } = req.params;

      const medication = await MedicationService.delete(id, companyId, role);

      res.status(200).json({
        success: true,
        message: "Medicamento deletado com sucesso",
        medication,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new MedicationController();
