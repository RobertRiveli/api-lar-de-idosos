import z from "zod";

export const medicationAdministrationStatuses = [
  "pending",
  "administered",
  "refused",
  "missed",
  "canceled",
];

const uuidSchema = (fieldName) =>
  z.uuid(`${fieldName} deve ser um UUID válido`);

const isoDateTimeSchema = (fieldName) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} é obrigatório`)
    .datetime({
      offset: true,
      message: `${fieldName} deve estar em formato ISO`,
    });

const optionalIsoDateTimeSchema = (fieldName) =>
  isoDateTimeSchema(fieldName).optional();

const optionalTextSchema = (fieldName) =>
  z
    .string()
    .trim()
    .max(1000, `${fieldName} deve ter no máximo 1000 caracteres`)
    .nullable()
    .optional();

const requiredTextSchema = (fieldName, message) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(1000, `${fieldName} deve ter no máximo 1000 caracteres`);

export const normalizeAdministrationStatus = (status) => {
  if (typeof status !== "string") return status;

  return status.trim().toLowerCase();
};

const statusSchema = z.preprocess(
  normalizeAdministrationStatus,
  z.enum(medicationAdministrationStatuses, {
    message:
      "Status deve ser PENDING, ADMINISTERED, REFUSED, MISSED ou CANCELED",
  }),
);

export const medicationAdministrationIdSchema = z.object({
  id: uuidSchema("id"),
});

export const residentMedicationAdministrationParamsSchema = z.object({
  residentId: uuidSchema("residentId"),
});

export const createMedicationAdministrationSchema = z.object({
  prescriptionId: uuidSchema("prescriptionId"),
  residentId: uuidSchema("residentId"),
  scheduledAt: isoDateTimeSchema("scheduledAt"),
  notes: optionalTextSchema("notes"),
});

export const listMedicationAdministrationQuerySchema = z.object({
  startDate: optionalIsoDateTimeSchema("startDate"),
  endDate: optionalIsoDateTimeSchema("endDate"),
  status: statusSchema.optional(),
});

export const updateAdministrationStatusSchema = z.object({
  status: statusSchema,
  administeredAt: optionalIsoDateTimeSchema("administeredAt"),
  notes: optionalTextSchema("notes"),
  reason: optionalTextSchema("reason"),
});

export const administerMedicationSchema = z.object({
  administeredAt: optionalIsoDateTimeSchema("administeredAt"),
  notes: optionalTextSchema("notes"),
});

export const refuseMedicationSchema = z.object({
  reason: requiredTextSchema(
    "reason",
    "Justificativa é obrigatória para medicamento recusado",
  ),
  notes: optionalTextSchema("notes"),
});

export const missMedicationSchema = z.object({
  reason: requiredTextSchema(
    "reason",
    "Justificativa é obrigatória para medicamento perdido",
  ),
  notes: optionalTextSchema("notes"),
});

export const cancelMedicationSchema = z.object({
  reason: requiredTextSchema(
    "reason",
    "Justificativa é obrigatória para cancelar administração",
  ),
  notes: optionalTextSchema("notes"),
});
