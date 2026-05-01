import AppError from "./AppError.js";

export default class NotFoundError extends AppError {
  constructor(field, customMessage) {
    const details = { [field]: customMessage };
    super(customMessage, 404, "NOT_FOUND", details);
  }
}
