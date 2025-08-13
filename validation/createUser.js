import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .nonempty("Name is required")
    .max(50, "Name must be at least 50 characters"),

  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid Email Format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[@$!%*?&]/, "Must contain a special character"),
});
