import healthConditionRepository from "./healthConditionRepository.js";

class healthConditionService {
  async list() {
    const conditions = await healthConditionRepository.findAll();

    return conditions;
  }
}

export default new healthConditionService();
