import z from "zod";
import { isCPF } from "validation-br";
import ValidationError from "../../errors/ValidationError.js";

export const createFamilyMemberSchema = z.object({
  fullName: z
    .string({ error: "Nome completo é obrigatório" })
    .min(1, "Nome completo é obrigatório")
    .min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z
    .string({ error: "E-mail é obrigatório" })
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  phone: z
    .string()
    .regex(/^\d+$/, "O telefone deve conter apenas números")
    .min(10, "Telefone inválido")
    .optional(),
  cpf: z
    .string({ error: "CPF é obrigatório" })
    .min(1, "CPF é obrigatório")
    .length(11, "O CPF deve ter 11 caracteres")
    .regex(/^\d+$/, "O CPF deve conter apenas números")
    .refine((cpf) => isCPF(cpf), {
      message: "CPF inválido",
    }),
  password: z
    .string({ error: "Senha é obrigatória" })
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres"),
});

export const validateCreateFamilyMember = (req, res, next) => {
  const validation = createFamilyMemberSchema.safeParse(req.body);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const field = firstIssue.path[0];

    return next(new ValidationError(field, firstIssue.message));
  }

  req.body = validation.data;
  return next();
};
