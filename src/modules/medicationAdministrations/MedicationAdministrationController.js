import MedicationAdministrationService from "./MedicationAdministrationService.js";

class MedicationAdministrationController {
  create = async (req, res, next) => {
    try {
      const administration =
        await MedicationAdministrationService.createAdministration(
          req.user,
          req.body,
        );

      res.status(201).json({
        success: true,
        message: "Administração manual de medicamento criada com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };

  listToday = async (req, res, next) => {
    try {
      const administrations =
        await MedicationAdministrationService.listTodayAdministrations(
          req.user,
          req.query,
        );

      res.status(200).json({
        success: true,
        message: "Administrações de medicamentos listadas com sucesso.",
        data: administrations,
      });
    } catch (error) {
      next(error);
    }
  };

  listByResident = async (req, res, next) => {
    try {
      const { residentId } = req.params;

      const administrations =
        await MedicationAdministrationService.listResidentAdministrations(
          req.user,
          residentId,
          req.query,
        );

      res.status(200).json({
        success: true,
        message: "Administrações de medicamentos listadas com sucesso.",
        data: administrations,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const administration =
        await MedicationAdministrationService.getAdministrationById(
          req.user,
          id,
        );

      res.status(200).json({
        success: true,
        message: "Administração de medicamento encontrada com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };

  administer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const administration =
        await MedicationAdministrationService.markAsAdministered(
          req.user,
          id,
          req.body,
        );

      res.status(200).json({
        success: true,
        message: "Medicamento marcado como administrado com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };

  refuse = async (req, res, next) => {
    try {
      const { id } = req.params;
      const administration = await MedicationAdministrationService.markAsRefused(
        req.user,
        id,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Medicamento marcado como recusado com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };

  miss = async (req, res, next) => {
    try {
      const { id } = req.params;
      const administration = await MedicationAdministrationService.markAsMissed(
        req.user,
        id,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Medicamento marcado como perdido com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const { id } = req.params;
      const administration =
        await MedicationAdministrationService.cancelAdministration(
          req.user,
          id,
          req.body,
        );

      res.status(200).json({
        success: true,
        message: "Administração de medicamento cancelada com sucesso.",
        data: administration,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new MedicationAdministrationController();
