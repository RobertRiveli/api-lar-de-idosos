import MeasurementUnitService from "./MeasurementUnitService.js";

class MeasurementUnitController {
  index = async (req, res, next) => {
    try {
      const units = await MeasurementUnitService.list();
      return res.status(200).json({
        success: true,
        data: units,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new MeasurementUnitController();
