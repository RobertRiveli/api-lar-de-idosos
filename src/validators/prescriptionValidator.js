import z from "zod";

const requiredString = (message) => z.string().trim().min(1, message);
const prescriptionDateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
const dateLabel = (fieldName) =>
  fieldName === "endDate" ? "Data final" : "Data de início";

export const parsePrescriptionDate = (date) => {
  const match = prescriptionDateRegex.exec(date);

  if (!match) return null;

  const [, day, month, year] = match;
  const parsedDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  const isValidDate =
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() === Number(month) - 1 &&
    parsedDate.getUTCDate() === Number(day);

  return isValidDate ? parsedDate : null;
};

const isValidPrescriptionDate = (date) => parsePrescriptionDate(date) !== null;

const dateString = (fieldName) =>
  z
    .string()
    .trim()
    .min(1, `${dateLabel(fieldName)} é obrigatória`)
    .regex(prescriptionDateRegex, {
      message: `${dateLabel(fieldName)} deve estar no formato DD-MM-AAAA`,
    })
    .refine(isValidPrescriptionDate, {
      message: `${dateLabel(fieldName)} deve ser uma data válida`,
    });

const optionalDateString = z
  .string()
  .trim()
  .refine((date) => !date || prescriptionDateRegex.test(date), {
    message: "Data final deve estar no formato DD-MM-AAAA",
  })
  .refine((date) => !date || isValidPrescriptionDate(date), {
    message: "Data final deve ser uma data válida",
  })
  .nullable()
  .optional();

const validateDateRange = (data, ctx) => {
  if (!data.startDate || !data.endDate) return;

  const startDate = parsePrescriptionDate(data.startDate);
  const endDate = parsePrescriptionDate(data.endDate);

  if (!startDate || !endDate) return;

  if (endDate < startDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "Data final não pode ser menor que data de inicio",
    });
  }
};

export const createPrescriptionSchema = z
  .object({
    residentId: requiredString("Residente é obrigatório"),
    medicationId: requiredString("Medicamento é obrigatório"),
    measurementUnitId: requiredString("Unidade de medida é obrigatória"),
    dosage: requiredString("Dosagem é obrigatória"),
    route: requiredString("Forma de consumo é obrigatória"),
    frequency: requiredString("Frequência é obrigatória"),
    prescribedBy: requiredString("Prescritor é obrigatório"),
    startDate: dateString("startDate"),
    endDate: optionalDateString,
  })
  .superRefine(validateDateRange);

export const updatePrescriptionSchema = z
  .object({
    residentId: requiredString("Residente é obrigatório").optional(),
    medicationId: requiredString("Medicamento é obrigatório").optional(),
    measurementUnitId: requiredString(
      "Unidade de medida é obrigatória",
    ).optional(),
    dosage: requiredString("Dosagem é obrigatória").optional(),
    route: requiredString("Forma de consumo é obrigatória").optional(),
    frequency: requiredString("Frequência é obrigatória").optional(),
    prescribedBy: requiredString("Prescritor é obrigatório").optional(),
    startDate: dateString("startDate").optional(),
    endDate: optionalDateString,
  })
  .superRefine(validateDateRange);
