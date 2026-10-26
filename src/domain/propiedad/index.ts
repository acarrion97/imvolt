import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";
import type { ProyectoReferencia } from "@/domain/proyecto";

/** Categorías del catálogo `public.tipos_propiedades` (semilla de la API). */
export type PropiedadCategoria =
  "lote" | "casa" | "departamento" | "oficina" | "local" | "proyecto";

/** Estado comercial (`public.propiedades.disponibilidad`). */
export type PropiedadDisponibilidad = "disponible" | "reservada" | "vendida" | "no_disponible";

/**
 * Canales de publicación donde la empresa AUTORIZA difundir la propiedad.
 * Catálogo fijo, idéntico al validado por la API (`MEDIOS_AUTORIZADOS`).
 */
export const MEDIOS_AUTORIZADOS = [
  "meta_ads",
  "facebook",
  "instagram",
  "whatsapp",
  "tiktok",
  "youtube",
  "portal_web",
  "email",
] as const;

export type MedioAutorizado = (typeof MEDIOS_AUTORIZADOS)[number];

/** Estado lógico del registro (`public.propiedades.estado`). */
export type PropiedadEstado = "activo" | "inactivo";

/** Catálogo `public.tipos_propiedades`: la "categoría" de una propiedad. */
export interface TipoPropiedad {
  tipo_propiedad_id: string;
  nombre: string;
  estado: PropiedadEstado;
  creado_en: string;
  actualizado_en: string;
}
export interface TipoPlantilla {
  tipo_plantilla_id: string;
  nombre: string;
  estado: PropiedadEstado;
  creado_en: string;
  actualizado_en: string;
}

export type TipoPropiedadCreate = {
  nombre: string;
};

/** Empresa incrustada (FK → `public.empresas`). */
export interface PropiedadEmpresa {
  empresa_id: number;
  razon_social: string;
}

/** Entidad `public.propiedades`. */
export interface Propiedad {
  propiedad_id: string;
  nombre: string;
  ubicacion: string;
  precio: number;
  disponibilidad: PropiedadDisponibilidad;
  descripcion: string;
  /** Canales de publicación autorizados para esta propiedad. */
  medios_autorizados: MedioAutorizado[];
  empresa_id: number;
  tipo_propiedad_id: string;
  /** Desarrollo al que pertenece; `null` = inmueble individual. */
  proyecto_id: string | null;
  estado: PropiedadEstado;
  /** Relación incrustada (FK → empresas). */
  empresa: PropiedadEmpresa | null;
  /** Relación incrustada (FK → tipos_propiedades). */
  tipo_propiedad: TipoPropiedad | null;
  /** Relación incrustada (FK → proyectos; referencia ligera). */
  proyecto: ProyectoReferencia | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Payload de creación: tal como lo acepta `POST /api/v1/propiedades`.
 * `empresa_id` NO viaja: lo inyecta la API desde la sesión (`assignEmpresaOnCreate`).
 */
export type PropiedadCreate = {
  nombre: string;
  ubicacion: string;
  precio: number;
  disponibilidad: PropiedadDisponibilidad;
  descripcion: string;
  medios_autorizados: MedioAutorizado[];
  tipo_propiedad_id: string;
  proyecto_id?: string | null;
};

const CATEGORIAS: string[] = ["lote", "casa", "departamento", "oficina", "local", "proyecto"];

/**
 * Categoría de una propiedad a partir del tipo incrustado.
 * La API guarda el tipo como FK; la UI necesita la categoría normalizada
 * para las etiquetas y la variante de ilustración de la tarjeta.
 */
export function categoriaDe(propiedad: Pick<Propiedad, "tipo_propiedad">): PropiedadCategoria {
  const nombre = (propiedad.tipo_propiedad?.nombre ?? "").trim().toLowerCase();
  return (CATEGORIAS.includes(nombre) ? nombre : "lote") as PropiedadCategoria;
}

export type PropiedadRepository = CrudRepository<Propiedad, string, PropiedadCreate>;

export type TipoPropiedadRepository = CrudRepository<TipoPropiedad, string, TipoPropiedadCreate>;
