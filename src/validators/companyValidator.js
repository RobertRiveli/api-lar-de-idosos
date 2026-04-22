import z from "zod";
import { emailSchema, phoneSchema } from "./common.js";

const companySchema = z.object({
  legalName: z
    .string("O nome jurídico deve ter pelo menos 3 caracteres")
    .max(160),

  tradeName: z.string().min(2, "O nome comercial é obrigatório"),

  taxId: z
    .string()
    .length(14, "O CNPJ deve ter 14 caracteres")
    .regex(/^\d+$/, "O CNPJ deve conter apenas números"),

  email: emailSchema,
  phone: phoneSchema,
});

export default companySchema;
