import { z } from "zod";
import { CATEGORIAS_ASSET, USOS_COLOR } from "@/domain/brand-kit";

/**
 * Esquema de alta/edición de un COLOR de la paleta: replica las validaciones
 * Joi de `api/src/requests/brandkit.request.ts` (nombre 2-50, hex #RRGGBB,
 * uso del catálogo, orden >= 0).
 */
export const brandColorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(50, "Máximo 50 caracteres."),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Usa el formato #RRGGBB (p. ej. #00D94B)."),
  uso: z.enum(USOS_COLOR, { message: "Selecciona el rol del color." }),
  orden: z.coerce
    .number({ message: "Indica el orden." })
    .int("El orden debe ser un número entero.")
    .min(0, "El orden no puede ser negativo.")
    .max(999, "Máximo 999."),
});

export type BrandColorFormData = z.input<typeof brandColorSchema>;

/**
 * Esquema de metadatos de un ARCHIVO de marca. El blob se adjunta aparte
 * (upload), así que aquí solo se validan nombre, categoría y descripción.
 */
export const brandAssetSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "Máximo 80 caracteres."),
  categoria: z.enum(CATEGORIAS_ASSET, { message: "Selecciona la categoría." }),
  descripcion: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .optional()
    .or(z.literal("")),
});

export type BrandAssetFormData = z.input<typeof brandAssetSchema>;
