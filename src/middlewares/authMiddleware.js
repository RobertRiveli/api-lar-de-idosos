import jwt from "jsonwebtoken";
import ValidationError from "../errors/ValidationError.js";

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const messages = {
      TokenExpiredError: "Token expirado",
      JsonWebTokenError: "Token inválido",
      NotBeforeError: "Token ainda não está ativo",
    };

    throw new ValidationError(
      "token",
      messages[error.name] || "Erro ao validar token",
    );
  }
}

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ValidationError("token", "Token não fornecido");
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new ValidationError("token", "Formato de token inválido");
    }

    const token = parts[1];

    if (!token) {
      throw new ValidationError("token", "Token inválido");
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
