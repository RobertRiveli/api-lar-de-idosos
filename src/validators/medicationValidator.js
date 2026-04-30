import z from "zod";

const medicationSchema = z.object({
  genericName: z
    .string()
    .min(2, "O nome deve ter no mínimo 2 caracteres")
    .max(120, "O nome deve ter no máximo 120 caracteres"),

  brandName: z
    .string()
    .max(120, "O nome da marca deve ter no máximo 120 caracteres")
    .nullable()
    .optional(),

  form: z.string().min(2, "A forma do medicamento é obrigatória"),

  strength: z
    .string()
    .max(80, "A dosagem do medicamento deve ter no máximo 80 caracteres")
    .nullable()
    .optional(),
});

export default medicationSchema;
