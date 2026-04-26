import z from "zod";

export const emailSchema = z.email("E-mail inválido").toLowerCase().trim();
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter mais de 8 caracteres")
  .max(128, "A senha deve ter no máximo 128 caracteres");
export const phoneSchema = z.string().min(10, "Número inválido").optional();
export const fullNameSchema = z
  .string()
  .min(3, "O nome deve ter pelo menos 3 caracteres")
  .max(160, "O nome deve ter no máximo 160 caracteres");
