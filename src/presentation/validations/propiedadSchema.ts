import { z } from "zod";
import { MEDIOS_AUTORIZADOS } from "@/domain/propiedad";

/**
 * Esquema de alta/edición de propiedad: replica las validaciones Joi de
 * `api/src/requests/property.request.ts` (nombre 3-50, ubicación y
 * descripción obligatorias, precio positivo, canales del catálogo).
 */
export const propiedadSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(50, "Máximo 50 caracteres."),
  tipo_propiedad_id: z.coerce
    .number({ message: "Selecciona la categoría." })
    .int("Selecciona la categoría.")
    .positive("Selecciona la categoría.")
    .transform(String),
  proyecto_id: z.string().nullable().optional(),
  ubicacion: z
    .string()
    .trim()
    .min(3, "Describe la ubicación (mínimo 3 caracteres).")
    .max(500, "Máximo 500 caracteres."),
  precio: z
    .number({ message: "Indica el precio de referencia." })
    .positive("El precio debe ser mayor a 0."),
  disponibilidad: z.enum(["disponible", "reservada", "vendida", "no_disponible"], {
    message: "Selecciona la disponibilidad.",
  }),
  descripcion: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria.")
    .max(2000, "Máximo 2000 caracteres."),
  medios_autorizados: z
    .array(z.enum(MEDIOS_AUTORIZADOS))
    .max(MEDIOS_AUTORIZADOS.length, "Máximo 8 canales.")
    .default([]),
});

export type PropiedadFormData = z.input<typeof propiedadSchema>;
