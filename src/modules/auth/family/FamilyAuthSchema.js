import z from "zod";
import { emailSchema, passwordSchema } from "../../../validators/common.js";

const familyLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export default familyLoginSchema;
