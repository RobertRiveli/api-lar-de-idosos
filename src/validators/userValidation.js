import z from "zod";
import { passwordSchema, emailSchema, phoneSchema } from "./common.js";

const userSchema = z.object({
  fullName: z
    .string()
    .min(3, "O nome completo deve ter pelo menos 3 caracteres")
    .max(160),
  email: emailSchema,
  phone: phoneSchema,
  cpf: z
    .string()
    .length(11, "O CPF deve ter 11 caracteres")
    .regex(/^\d+$/, "O CPF deve conter apenas números"),

  password: passwordSchema,
});

export default userSchema;
