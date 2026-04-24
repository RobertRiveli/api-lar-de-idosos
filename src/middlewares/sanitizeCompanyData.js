import { cleanNumberFields } from "../utils/cleanNumberFields.js";

export const sanitizeCompanyData = (req, res, next) => {
  const { taxId, phone, email, admin } = req.body;
  req.body = {
    ...req.body,
    ...(taxId && { taxId: cleanNumberFields(taxId) }),
    ...(phone && { phone: cleanNumberFields(phone) }),
    ...(email && { email: email.toLowerCase().trim() }),
    admin: admin
      ? {
          ...admin,
          email: admin.email.toLowerCase().trim(),
          phone: cleanNumberFields(admin.phone),
          cpf: cleanNumberFields(admin.cpf),
        }
      : undefined,
  };

  next();
};

export const sanitizeUserData = (req, res, next) => {
  const { phone, email, cpf } = req.body;
  req.body = {
    ...req.body,
    ...(phone && { phone: cleanNumberFields(phone) }),
    ...(email && { email: email.toLowerCase().trim() }),
    ...(cpf && { cpf: cleanNumberFields(cpf) }),
  };

  next();
};

export const sanitizeAuthData = (req, res, next) => {
  const { cpf, password } = req.body;
  req.body = {
    ...req.body,
    ...(cpf && { cpf: cleanNumberFields(cpf) }),
    ...(password && { password: password.trim() }),
  };

  next();
};
