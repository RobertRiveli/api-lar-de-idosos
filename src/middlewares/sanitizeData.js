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

export const sanitizeFamilyAuthData = (req, res, next) => {
  const { email, password } = req.body;
  req.body = {
    ...req.body,
    ...(email !== undefined && {
      email: typeof email === "string" ? email.toLowerCase().trim() : email,
    }),
    ...(password !== undefined && {
      password: typeof password === "string" ? password.trim() : password,
    }),
  };

  next();
};

export const sanitizeResidentData = (req, res, next) => {
  const { cpf } = req.body;
  req.body = {
    ...req.body,
    ...(cpf && { cpf: cleanNumberFields(cpf) }),
  };

  next();
};

export const sanitizeFamilyMemberData = (req, res, next) => {
  const { fullName, email, cpf, phone } = req.body;
  const cleanCpf = typeof cpf === "string" ? cleanNumberFields(cpf) : cpf;
  const cleanPhone = typeof phone === "string" ? cleanNumberFields(phone) : phone;

  req.body = {
    ...req.body,
    ...(fullName !== undefined && {
      fullName: typeof fullName === "string" ? fullName.trim() : fullName,
    }),
    ...(email !== undefined && {
      email: typeof email === "string" ? email.toLowerCase().trim() : email,
    }),
    ...(cpf !== undefined && { cpf: cleanCpf }),
    ...(phone !== undefined && { phone: cleanPhone || undefined }),
  };

  next();
};
