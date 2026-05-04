import z from "zod";

const uuidSchema = (fieldName) =>
  z.uuid(`${fieldName} deve ser um UUID válido`);

const optionalTextSchema = (fieldName) =>
  z
    .string()
    .trim()
    .max(1000, `${fieldName} deve ter no máximo 1000 caracteres`)
    .nullable()
    .optional();

export const residentConditionIdSchema = z.object({
  id: uuidSchema("id"),
});

export const residentConditionResidentParamsSchema = z.object({
  residentId: uuidSchema("residentId"),
});

export const createResidentConditionSchema = z.object({
  residentId: uuidSchema("residentId"),
  healthConditionId: uuidSchema("healthConditionId"),
  observations: optionalTextSchema("observations"),
});
