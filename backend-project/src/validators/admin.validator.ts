import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common";

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters");

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const adminUserListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  blocked: z.enum(["true", "false"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const createAdminUserSchema = z.object({
  name,
  email,
  password,
  role: z.enum(["user", "admin"]).default("user"),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;

export const updateAdminUserSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(),
    role: z.enum(["user", "admin"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;

export const blockUserSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Give a reason of at least 3 characters")
    .max(300, "The reason must be at most 300 characters"),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

export const adminWorkspaceListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
});

export type AdminWorkspaceListQuery = z.infer<typeof adminWorkspaceListQuerySchema>;

export const createAdminWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  description: z.string().trim().max(300).nullish(),
  ownerId: objectIdSchema,
});

export type CreateAdminWorkspaceInput = z.infer<typeof createAdminWorkspaceSchema>;

export const updateAdminWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60).optional(),
    description: z.string().trim().max(300).nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateAdminWorkspaceInput = z.infer<typeof updateAdminWorkspaceSchema>;
