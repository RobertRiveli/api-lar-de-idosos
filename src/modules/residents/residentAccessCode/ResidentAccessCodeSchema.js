import z from "zod";
import ValidationError from "../../../errors/ValidationError.js";

const maxUsesSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    if (typeof value === "string") return Number(value);

    return value;
  },
  z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "maxUses é obrigatório"
          : "maxUses deve ser um número",
    })
    .int("maxUses deve ser um número inteiro")
    .min(1, "maxUses deve ser maior que zero"),
);

export const createResidentAccessCodeSchema = z.object({
  maxUses: maxUsesSchema,
});

export const validateCreateResidentAccessCode = (req, res, next) => {
  const validation = createResidentAccessCodeSchema.safeParse(req.body);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    const field = firstIssue.path[0];

    return next(new ValidationError(field, firstIssue.message));
  }

  req.body = validation.data;
  return next();
};
