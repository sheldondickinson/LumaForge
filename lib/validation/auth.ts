import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254)
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(14, "Use at least 14 characters.")
  .max(128, "Use no more than 128 characters.")
  .refine((value) => !/^\s+$/.test(value), {
    message: "The password cannot contain only spaces.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const administratorBootstrapSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .refine(
    ({ email, password }) =>
      !password.toLowerCase().includes(email.split("@")[0] ?? ""),
    {
      message: "The password must not contain the email username.",
      path: ["password"],
    },
  );

export type UserRole = "administrator" | "editor" | "viewer";
