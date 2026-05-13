import AppError from "./AppError.js";

export default class ConflictError extends AppError {
  constructor(field, customMessage, responseMessage = "Conflito de dados") {
    const details = { [field]: customMessage };
    super(responseMessage, 409, "CONFLICT_ERROR", details);
  }
}
