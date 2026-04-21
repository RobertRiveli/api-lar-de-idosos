import AppError from "./AppError.js";

export default class ConflictError extends AppError {
  constructor(field, customMessage) {
    const details = { [field]: customMessage };
    super("Conflito de dados", 409, "CONFLICT_ERROR", details);
  }
}
