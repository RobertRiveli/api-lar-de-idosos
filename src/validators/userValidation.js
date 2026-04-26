import z from "zod";
import {
  passwordSchema,
  emailSchema,
  phoneSchema,
  fullNameSchema,
} from "./common.js";

const userSchema = z.object({
  fullName: fullNameSchema,

  email: emailSchema,
  phone: phoneSchema,
  cpf: z
    .string()
    .length(11, "O CPF deve ter 11 caracteres")
    .regex(/^\d+$/, "O CPF deve conter apenas números"),

  password: passwordSchema,
});

export default userSchema;
