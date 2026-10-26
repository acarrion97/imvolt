import { z } from "zod";

/** Esquema de alta de plantilla creativa (§08 plantillas). */
export const plantillaSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  categoria: z.enum(
    [
      "lotizaciones",
      "casas",
      "departamentos",
      "proyecto_planos",
      "publicidad_comercial",
      "marca_inmobiliaria",
    ],
    { message: "Selecciona una categoría." },
  ),
  tipo_plantilla_id: z
    .string()
    .regex(/^\d+$/, "Selecciona un tipo de plantilla válido."),
  objetivo: z.enum(["visitas", "mensajes", "formularios", "branding"], {
    message: "Selecciona un objetivo.",
  }),
  media_type: z.enum(["image", "video"], { message: "Selecciona el tipo de medio." }),
  formato: z.enum(["reels_9_16", "imagen_4_5", "feed_1_1", "banner_16_9"], {
    message: "Selecciona un formato.",
  }),
  prompt_base: z
    .string()
    .trim()
    .min(10, "El prompt base debe tener al menos 10 caracteres.")
    .max(1000, "Máximo 1000 caracteres."),
  estructura_narrativa: z.string().trim().max(300, "Máximo 300 caracteres.").optional().nullable(),
  movimiento_camara: z.string().trim().max(200, "Máximo 200 caracteres.").optional().nullable(),
  estilo_visual: z.string().trim().max(200, "Máximo 200 caracteres.").optional().nullable(),
  requiere_referencia_original: z.boolean().optional(),
});

export type PlantillaFormData = z.input<typeof plantillaSchema>;
