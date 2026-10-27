import { z } from "zod";

/** Esquema de alta/edición de campaña (§10 flujo de publicación). */
export const campanaSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  property_id: z.coerce.string().optional().nullable(),
  connection_id: z.coerce.string().optional().nullable(),
  objetivo: z.enum(["mensajes", "formularios", "visitas", "trafico", "branding"], {
    message: "Selecciona un objetivo.",
  }),
  destino: z.enum(["whatsapp", "formulario", "landing"], {
    message: "Selecciona un destino.",
  }),
  presupuesto_maximo: z
    .number({ message: "Debe ser un número." })
    .positive("El presupuesto debe ser mayor a cero."),
  titulo: z.string().trim().max(120, "Máximo 120 caracteres.").optional().nullable(),
  copy: z
    .string()
    .trim()
    .min(10, "El copy debe tener al menos 10 caracteres.")
    .max(500, "Máximo 500 caracteres."),
  cta: z.string().trim().max(60, "Máximo 60 caracteres.").optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
});

export type CampanaFormData = z.input<typeof campanaSchema>;
