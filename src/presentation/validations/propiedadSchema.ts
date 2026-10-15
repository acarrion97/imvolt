import { z } from "zod";

/** Esquema de alta/edición de propiedad (§07 fidelidad de contenido). */
export const propiedadSchema = z
  .object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
    categoria: z.enum(["lote", "casa", "departamento", "oficina", "local", "proyecto"], {
      message: "Selecciona una categoría.",
    }),
    project_id: z.string().optional().nullable(),
    titulo_publicacion: z
      .string()
      .trim()
      .max(150, "Máximo 150 caracteres.")
      .optional()
      .nullable(),
    descripcion: z.string().trim().max(1000, "Máximo 1000 caracteres.").optional().nullable(),
    precio: z
      .number({ message: "Debe ser un número." })
      .min(0, "No puede ser negativo.")
      .optional()
      .nullable(),
    superficie_m2: z
      .number({ message: "Debe ser un número." })
      .min(0, "No puede ser negativo.")
      .optional()
      .nullable(),
    habitaciones: z
      .number({ message: "Debe ser un número." })
      .int("Debe ser entero.")
      .min(0, "No puede ser negativo.")
      .optional()
      .nullable(),
    banos: z
      .number({ message: "Debe ser un número." })
      .int("Debe ser entero.")
      .min(0, "No puede ser negativo.")
      .optional()
      .nullable(),
    estacionamientos: z
      .number({ message: "Debe ser un número." })
      .int("Debe ser entero.")
      .min(0, "No puede ser negativo.")
      .optional()
      .nullable(),
    direccion: z.string().trim().max(200, "Máximo 200 caracteres.").optional().nullable(),
    ciudad: z.string().trim().max(100, "Máximo 100 caracteres.").optional().nullable(),
    pais: z.string().trim().min(2, "Indica el país.").default("Ecuador"),
    estado: z.enum(["disponible", "reservada", "vendida", "no_disponible"]).optional(),
    tiene_render_conceptual: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.categoria === "lote" || data.categoria === "proyecto" || Boolean(data.habitaciones),
    {
      message: "Para este tipo de propiedad indica las habitaciones.",
      path: ["habitaciones"],
    },
  );

export type PropiedadFormData = z.input<typeof propiedadSchema>;
