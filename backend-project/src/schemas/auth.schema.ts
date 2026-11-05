import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters");

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

// Only these three fields are accepted. Anything else a client sends
// (such as "role": "admin") is dropped by Zod, so nobody can sign up as an admin.
export const registerSchema = z.object({ name, email, password: newPassword });

// Login only checks that a password was typed. The strict rules apply when it is created.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;