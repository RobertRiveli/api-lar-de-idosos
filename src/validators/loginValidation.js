import z from "zod";
import { passwordSchema, emailSchema } from "./common.js";

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export default loginSchema;
