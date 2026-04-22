import { cleanNumberFields } from "../utils/cleanNumberFields.js";

export const sanitizeCompanyData = (req, res, next) => {
  const { taxId, phone, email } = req.body;

  req.body = {
    ...req.body,
    ...(taxId && { taxId: cleanNumberFields(taxId) }),
    ...(phone && { phone: cleanNumberFields(phone) }),
    ...(email && { email: email.toLowerCase().trim() }),
  };

  next();
};
