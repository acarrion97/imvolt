import { z } from "zod";

/** Esquema de alta/edición de lead (§11 pipeline de contactos). */
export const leadSchema = z
  .object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
    email: z.string().trim().email("Email inválido.").optional().nullable().or(z.literal("")),
    telefono: z
      .string()
      .trim()
      .regex(/^[+0-9()\s-]{7,20}$/, "Teléfono inválido (solo números, +, espacios y guiones).")
      .optional()
      .nullable()
      .or(z.literal("")),
    campaign_id: z.coerce.string().optional().nullable(),
    property_id: z.coerce.string().optional().nullable(),
    fuente: z.enum(["meta_formulario", "whatsapp", "landing", "manual", "lotes_al_mando"], {
      message: "Selecciona la fuente del lead.",
    }),
    estado: z
      .enum(["nuevo", "contactado", "calificado", "visitado", "cerrado", "perdido"])
      .optional(),
    notas: z.string().trim().max(1000, "Máximo 1000 caracteres.").optional().nullable(),
  })
  .refine((data) => Boolean(data.email || data.telefono), {
    message: "El lead debe tener al menos un email o un teléfono.",
    path: ["telefono"],
  });

export type LeadFormData = z.input<typeof leadSchema>;
