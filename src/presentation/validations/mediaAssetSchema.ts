import { z } from "zod";
import { CATEGORIAS_MEDIA } from "@/domain/media-asset";

/**
 * Metadatos de un medio (espejo de `mediaAssetRequest` del API: nombre 3-80,
 * descripción ≤ 500). El blob se adjunta aparte, en multipart.
 */
export const mediaAssetSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(80, "Máximo 80 caracteres."),
  categoria: z.enum(CATEGORIAS_MEDIA, { message: "Selecciona la categoría." }),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres.").optional().or(z.literal("")),
  proyecto_id: z.string().optional().nullable(),
  propiedad_id: z.string().optional().nullable(),
});

export type MediaAssetFormData = z.input<typeof mediaAssetSchema>;
