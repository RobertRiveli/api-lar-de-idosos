import MeasurementUnitRepository from "./MeasurementUnitRepository.js";
import AppError from "../../errors/AppError.js";
class MeasurementUnitService {
  async list() {
    return await MeasurementUnitRepository.findAll();
  }

  async getById(id) {
    const unit = await MeasurementUnitRepository.findById(id);

    if (!unit) {
      throw new AppError("Unidade não encontrada", 404, "NOT_FOUND");
    }

    return unit;
  }
}

export default new MeasurementUnitService();
