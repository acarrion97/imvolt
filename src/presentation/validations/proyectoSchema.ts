import { z } from "zod";

/** Esquema de alta/edición de proyecto (§ catálogo inmobiliario). */
export const proyectoSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  tipo: z.enum(["lotizacion", "urbanizacion", "edificio", "proyecto_planos", "individual"], {
    message: "Selecciona un tipo de proyecto.",
  }),
  descripcion: z.string().trim().max(1000, "Máximo 1000 caracteres.").optional().nullable(),
  ubicacion: z.string().trim().max(500, "Máximo 500 caracteres.").optional().nullable(),
  total_lotes: z
    .number({ message: "Debe ser un número." })
    .int("Debe ser un número entero.")
    .positive("Debe ser mayor a cero.")
    .optional()
    .nullable(),
});

export type ProyectoFormData = z.input<typeof proyectoSchema>;
