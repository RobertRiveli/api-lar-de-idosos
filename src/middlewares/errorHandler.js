import AppError from "../errors/AppError.js";
export const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let response = {
    success: false,
    message: "Erro interno no servidor",
    errorType: "INTERNAL_ERROR",
  };

  // Validation Error
  if (error.type === "ValidationError") {
    statusCode = 400;
    response = {
      success: false,
      message: "Dados Inválidos",
      errors: error.details,
      errorType: "VALIDATION_ERROR",
    };
  }

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    response = {
      success: false,
      message: error.message,
      errors: error.details,
      errorType: error.errorType,
    };
  }

  console.error(`[${response.errorType}] - ${req.method} ${req.url}`);
  console.error(error);
  return res.status(statusCode).json(response);
};
