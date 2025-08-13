import z from "zod";

export const loginUser = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid Email format"),
  password: z
    .string({ required_error: "Password is required" })
    .trim()
    .min(1, "Password is required"),
});
