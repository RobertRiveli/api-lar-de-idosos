export default class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    errorType = "INTERNAL_ERROR",
    details,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
    this.isOperational = true;
  }
}
