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
        }
      : undefined,
  };

  console.log(req.body);
  next();
};

export const sanitizeUserData = (req, res, next) => {
  const { phone, email } = req.body;

  req.body = {
    ...req.body,
    ...(phone && { phone: cleanNumberFields(phone) }),
    ...(email && { email: email.toLowerCase().trim() }),
  };

  next();
};
