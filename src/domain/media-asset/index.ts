import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

/**
 * Módulo **media assets** del catálogo: fotos, renders, videos y documentos
 * de la empresa, guardados en el bucket privado `media-assets` con historial
 * de versiones (§12: almacenamiento propio, sin depender del CDN del proveedor).
 *
 * Catálogos y reglas de archivo espejo de `api/src/services/media.storage.ts`:
 * la validación real vive en el API (413/415), aquí solo se anticipa el error.
 */

/** Categorías de un medio: definen qué archivos se aceptan. */
export const CATEGORIAS_MEDIA = ["imagen", "video", "documento", "otro"] as const;

export type CategoriaMedia = (typeof CATEGORIAS_MEDIA)[number];

export const CATEGORIA_MEDIA_LABEL: Record<CategoriaMedia, string> = {
  imagen: "Imagen",
  video: "Video",
  documento: "Documento",
  otro: "Otro",
};

/** Estado lógico del registro (`public.*.estado`). */
export type MediaEstado = "activo" | "inactivo";

/** Límite de carga por archivo aceptado por la API (100 MB). */
export const LIMITE_BYTES_MEDIA = 100 * 1024 * 1024;

/** MIME permitidos por categoría (espejo de `MIME_POR_CATEGORIA` del API). */
export const MIME_MEDIA_POR_CATEGORIA: Record<CategoriaMedia, readonly string[]> = {
  imagen: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/webm"],
  documento: ["application/pdf"],
  otro: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
  ],
};

/** Extensiones sugeridas al selector de archivo, por categoría. */
export const ACEPTADOS_MEDIA_POR_CATEGORIA: Record<CategoriaMedia, string> = {
  imagen: ".png,.jpg,.jpeg,.webp,.svg",
  video: ".mp4,.webm",
  documento: ".pdf",
  otro: ".png,.jpg,.jpeg,.webp,.svg,.mp4,.webm,.pdf",
};

const MIME_GENERICO = new Set(["", "application/octet-stream", "binary/octet-stream"]);

const MIME_POR_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

/** MIME efectivo: el declarado por el navegador o, si es genérico, el de la extensión. */
export function resolverMimeMedia(file: File): string {
  if (!MIME_GENERICO.has(file.type)) return file.type;
  const punto = file.name.lastIndexOf(".");
  const ext = punto > -1 ? file.name.slice(punto + 1).toLowerCase() : "";
  return MIME_POR_EXTENSION[ext] ?? file.type;
}

/**
 * Validación CLIENTE antes de subir (vacío + tamaño + MIME).
 * Devuelve `null` si es válido o el mensaje de error.
 */
export function validarArchivoMedia(file: File, categoria: CategoriaMedia): string | null {
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > LIMITE_BYTES_MEDIA) {
    return `El archivo supera el máximo de ${LIMITE_BYTES_MEDIA / 1024 / 1024} MB.`;
  }
  const permitidos = MIME_MEDIA_POR_CATEGORIA[categoria] ?? MIME_MEDIA_POR_CATEGORIA.otro;
  if (!permitidos.includes(resolverMimeMedia(file))) {
    return `Tipo de archivo no permitido para "${categoria}". Aceptados: ${permitidos.join(", ")}.`;
  }
  return null;
}

/** Referencia ligera a un proyecto (FK → proyectos). */
export interface MediaProyectoRef {
  proyecto_id: string | number;
  nombre: string;
  tipo: string;
}

/** Referencia ligera a una propiedad (FK → propiedades). */
export interface MediaPropiedadRef {
  propiedad_id: string | number;
  nombre: string;
  ubicacion: string | null;
}

/** Empresa incrustada (FK → empresas). */
export interface MediaEmpresa {
  empresa_id: number;
  razon_social: string;
}

/**
 * Versión concreta de un medio: un blob del bucket privado. El API nunca
 * expone `ruta_storage`: para ver el archivo se pide una URL firmada.
 */
export interface MediaAssetVersion {
  media_asset_version_id: string;
  media_asset_id: string;
  /** Número correlativo (1 = v1, 2 = v2...). */
  numero: number;
  nombre_archivo: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  nota: string | null;
  subido_por: number | null;
  empresa_id: number;
  estado: MediaEstado;
  creado_en: string;
  actualizado_en: string;
}

/** Medio lógico (p. ej. "Render fachada norte") con su versión activa. */
export interface MediaAsset {
  media_asset_id: string;
  nombre: string;
  categoria: CategoriaMedia;
  descripcion: string | null;
  proyecto_id: string | null;
  propiedad_id: string | null;
  /** Puntero a la versión que se sirve al previsualizar o descargar. */
  version_activa_id: string | null;
  empresa_id: number;
  estado: MediaEstado;
  empresa: MediaEmpresa | null;
  proyecto: MediaProyectoRef | null;
  propiedad: MediaPropiedadRef | null;
  version_activa: MediaAssetVersion | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Payload de creación: solo METADATOS. El blob se sube aparte (multipart)
 * con `subirVersion`. `empresa_id` NO viaja: lo inyecta la API.
 */
export type MediaAssetCreate = {
  nombre: string;
  categoria: CategoriaMedia;
  descripcion?: string | null;
  proyecto_id?: string | null;
  propiedad_id?: string | null;
};

/** Descarga autorizada: URL firmada de corta duración (bucket privado). */
export interface MediaAssetDescarga {
  url: string;
  expira_en_segundos: number;
  nombre_archivo: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  numero: number;
}

/** CRUD de metadatos + operaciones de storage (versiones, descarga, restaurar). */
export interface MediaAssetRepository
  extends CrudRepository<MediaAsset, string, MediaAssetCreate> {
  listarVersiones(assetId: string): Promise<MediaAssetVersion[]>;
  subirVersion(assetId: string, file: File, nota?: string | null): Promise<MediaAssetVersion>;
  descargar(assetId: string): Promise<MediaAssetDescarga>;
  descargarVersion(assetId: string, versionId: string): Promise<MediaAssetDescarga>;
  restaurarVersion(assetId: string, versionId: string): Promise<MediaAsset>;
  eliminarVersion(assetId: string, versionId: string): Promise<void>;
}
