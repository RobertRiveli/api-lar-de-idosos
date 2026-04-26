import z from "zod";
import { isCPF } from "validation-br";
import { fullNameSchema } from "./common.js";
const residentSchema = z.object({
  fullName: fullNameSchema,

  cpf: z
    .string()
    .optional()
    .refine((cpf) => !cpf || isCPF(cpf), {
      message: "CPF inválido",
    }),

  birthDate: z
    .string()
    .min(1, "A data de nascimento é obrigatória")
    .regex(
      /^\d{2}-\d{2}-\d{4}$/,
      "A data de nascimento deve estar no formato DD-MM-YYYY",
    ),

  gender: z.string().optional(),

  bloodType: z.string().optional(),

  admissionDate: z.string().min(1, "A data de admissão é obrigatória"),
  status: z.string().optional(),
});

export default residentSchema;
