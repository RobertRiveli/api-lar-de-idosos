import AppError from "./AppError.js";

export default class ValidationError extends AppError {
  constructor(field, customMessage) {
    const details = { [field]: customMessage };
    super("Dados de entrada inválidos", 400, "ValidationError", details);
  }
}
