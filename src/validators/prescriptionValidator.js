import z from "zod";

const requiredString = (message) => z.string().trim().min(1, message);
const uuidSchema = (fieldName) =>
  z.uuid(`${fieldName} deve ser um UUID válido`);

const dateLabels = {
  startDate: "startDate",
  endDate: "endDate",
  firstScheduledAt: "firstScheduledAt",
};

export const parsePrescriptionDate = (date) => {
  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const dateTimeString = (fieldName) =>
  z
    .string()
    .trim()
    .min(1, `${dateLabels[fieldName]} é obrigatório`)
    .datetime({
      offset: true,
      message: `${dateLabels[fieldName]} deve estar em formato ISO`,
    });

const optionalDateTimeString = (fieldName) =>
  z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim() === "") return null;

      return value;
    },
    dateTimeString(fieldName).nullable().optional(),
  );

const intervalHoursSchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") return undefined;
    if (typeof value === "string") return Number(value);

    return value;
  },
  z
    .number({
      message: "intervalHours é obrigatório",
    })
    .int("intervalHours deve ser um número inteiro")
    .min(1, "intervalHours deve ser maior que zero"),
);

const validateDateRange = (data, ctx) => {
  const startDate = data.startDate && parsePrescriptionDate(data.startDate);
  const endDate = data.endDate && parsePrescriptionDate(data.endDate);
  const firstScheduledAt =
    data.firstScheduledAt && parsePrescriptionDate(data.firstScheduledAt);

  if (startDate && endDate && endDate < startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "endDate não pode ser menor que startDate",
    });
  }

  if (startDate && firstScheduledAt && firstScheduledAt < startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["firstScheduledAt"],
      message: "firstScheduledAt não pode ser menor que startDate",
    });
  }

  if (endDate && firstScheduledAt && firstScheduledAt > endDate) {
    ctx.addIssue({
      code: "custom",
      path: ["firstScheduledAt"],
      message: "firstScheduledAt não pode ser maior que endDate",
    });
  }
};

export const createPrescriptionSchema = z
  .object({
    residentId: uuidSchema("residentId"),
    medicationId: uuidSchema("medicationId"),
    measurementUnitId: uuidSchema("measurementUnitId"),
    dosage: requiredString("Dosagem é obrigatória"),
    route: requiredString("Forma de consumo é obrigatória"),
    frequency: requiredString("Frequência é obrigatória"),
    intervalHours: intervalHoursSchema,
    firstScheduledAt: dateTimeString("firstScheduledAt"),
    prescribedBy: requiredString("Prescritor é obrigatório"),
    startDate: dateTimeString("startDate"),
    endDate: optionalDateTimeString("endDate"),
  })
  .superRefine(validateDateRange);

export const updatePrescriptionSchema = z
  .object({
    residentId: uuidSchema("residentId").optional(),
    medicationId: uuidSchema("medicationId").optional(),
    measurementUnitId: uuidSchema("measurementUnitId").optional(),
    dosage: requiredString("Dosagem é obrigatória").optional(),
    route: requiredString("Forma de consumo é obrigatória").optional(),
    frequency: requiredString("Frequência é obrigatória").optional(),
    intervalHours: intervalHoursSchema.optional(),
    firstScheduledAt: dateTimeString("firstScheduledAt").optional(),
    prescribedBy: requiredString("Prescritor é obrigatório").optional(),
    startDate: dateTimeString("startDate").optional(),
    endDate: optionalDateTimeString("endDate"),
  })
  .superRefine(validateDateRange);
