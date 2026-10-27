import { z } from "zod";

/** Esquema de alta de plantilla creativa (§08 plantillas). */
export const plantillaSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  tipo_plantilla_id: z.coerce
    .number({ message: "Selecciona un tipo de plantilla válido." })
    .int("Selecciona un tipo de plantilla válido.")
    .positive("Selecciona un tipo de plantilla válido."),
  descripcion: z.string().trim().max(500, "Máximo 500 caracteres.").nullable().optional(),
  url_logo: z
    .union([z.string().trim().max(200).url("Ingresa una URL válida."), z.literal("")])
    .nullable()
    .optional(),
});

export type PlantillaFormData = z.input<typeof plantillaSchema>;
