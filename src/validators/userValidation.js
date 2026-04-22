import z from "zod";
import { emailSchema, phoneSchema } from "./common.js";

const userSchema = z.object({
  fullName: z
    .string()
    .min(3, "O nome completo deve ter pelo menos 3 caracteres")
    .max(160),
  email: emailSchema,
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres"),
});

export default userSchema;
