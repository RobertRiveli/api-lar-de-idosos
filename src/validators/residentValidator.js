import z from "zod";
import { isCPF } from "validation-br";
import { fullNameSchema } from "./common.js";

const dateFormatRegex = /^\d{2}-\d{2}-\d{4}$/;

const isValidDate = (value) => {
  if (!dateFormatRegex.test(value)) return true;

  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const dateSchema = (requiredMessage, formatMessage, invalidMessage) =>
  z
    .string()
    .min(1, requiredMessage)
    .regex(dateFormatRegex, formatMessage)
    .refine(isValidDate, { message: invalidMessage });

const residentSchema = z.object({
  fullName: fullNameSchema,

  cpf: z
    .string()
    .optional()
    .refine((cpf) => !cpf || isCPF(cpf), {
      message: "CPF inválido",
    }),

  birthDate: dateSchema(
    "A data de nascimento é obrigatória",
    "A data de nascimento deve estar no formato DD-MM-YYYY",
    "A data de nascimento é inválida",
  ),

  gender: z.string().optional(),

  bloodType: z.string().optional(),

  admissionDate: dateSchema(
    "A data de admissão é obrigatória",
    "A data de admissão deve estar no formato DD-MM-YYYY",
    "A data de admissão é inválida",
  ),
  status: z.string().optional(),
});

export default residentSchema;
