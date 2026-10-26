import { z } from "zod";
import { ROLES_ORG } from "@/domain/identity";

/** Invitar miembro (`POST /v1/usuarios/invitaciones`): espejo de `invitacionRequest` del API. */
export const invitacionSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  email: z.string().trim().email("Email inválido."),
  telefono: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres.")
    .regex(/^[+0-9()\s-]*$/, "Teléfono inválido (solo números, +, espacios y guiones).")
    .optional()
    .nullable(),
  rol: z.enum(ROLES_ORG, { message: "Selecciona el rol del miembro." }),
});

export type InvitacionFormData = z.input<typeof invitacionSchema>;

/** Perfil de la organización (`PATCH /v1/empresas/{id}`). */
export const empresaSchema = z.object({
  razon_social: z
    .string()
    .trim()
    .min(3, "La razón social debe tener al menos 3 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  ruc: z.string().trim().regex(/^\d{13}$/, "El RUC debe tener 13 dígitos."),
});

export type EmpresaFormData = z.input<typeof empresaSchema>;
