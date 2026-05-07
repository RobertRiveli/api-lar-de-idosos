import z from "zod";
import { FamilyRelationship } from "@prisma/client";
import ValidationError from "../../errors/ValidationError.js";

const familyRelationshipValues = Object.values(FamilyRelationship);

export const redeemResidentAccessCodeSchema = z.object({
  code: z
    .string({ error: "Código é obrigatório" })
    .trim()
    .min(1, "Código é obrigatório")
    .transform((code) => code.toUpperCase()),
  relationship: z
    .string({ error: "Relacionamento é obrigatório" })
    .trim()
    .min(1, "Relacionamento é obrigatório")
    .refine((relationship) => familyRelationshipValues.includes(relationship), {
      message: "Relacionamento inválido",
    }),
});

export const validateRedeemResidentAccessCode = (req, res, next) => {
  const validation = redeemResidentAccessCodeSchema.safeParse(req.body);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const field = firstIssue.path[0];

    return next(new ValidationError(field, firstIssue.message));
  }

  req.body = validation.data;
  return next();
};
