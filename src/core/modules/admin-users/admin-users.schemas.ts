/**
 * Schemas de validación de usuarios admin.
 *
 * Política de contraseña (decidida en M3.x): mínimo 6 caracteres, al
 * menos una mayúscula y un dígito. Misma regex se usa en el form
 * client-side para feedback inmediato si se desea.
 */
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "Mínimo 6 caracteres.")
  .regex(/[A-Z]/, "Tiene que tener al menos una mayúscula.")
  .regex(/[0-9]/, "Tiene que tener al menos un número.");

export const createAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  name: z.string().trim().max(120).optional().nullable(),
  password: passwordSchema,
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/**
 * Schema del form de creación — todos los campos como `string` para que
 * encajen con react-hook-form. La action castea `name` vacío a `null`.
 */
export const createAdminFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  name: z.string().trim().max(120),
  password: passwordSchema,
});

export type CreateAdminFormInput = z.infer<typeof createAdminFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresá tu contraseña actual."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden.",
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
