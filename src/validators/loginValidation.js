import z from "zod";
import { passwordSchema } from "./common.js";

const loginSchema = z.object({
  cpf: z
    .string()
    .length(11, "O CPF deve ter 11 caracteres")
    .regex(/^\d+$/, "O CPF deve conter apenas números"),
  password: passwordSchema,
});

export default loginSchema;
