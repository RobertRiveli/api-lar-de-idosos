import z from "zod";

export const emailSchema = z.email("E-mail inválido").toLowerCase().trim();
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter mais de 8 caracteres");

export const phoneSchema = z.string().min(10, "Número inválido").optional();
