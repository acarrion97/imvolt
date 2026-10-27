import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

export const CATEGORIAS_MEDIA = ["imagen", "video", "documento", "otro"] as const;
export type CategoriaMedia = (typeof CATEGORIAS_MEDIA)[number];

export const LIMITE_BYTES_MEDIA = 100 * 1024 * 1024;

export const EXTENSIONES_MEDIA: Record<CategoriaMedia, string> = {
  imagen: ".png,.jpg,.jpeg,.webp,.svg",
  video: ".mp4,.webm",
  documento: ".pdf",
  otro: ".png,.jpg,.jpeg,.webp,.svg,.mp4,.webm,.pdf",
};

const MIME_POR_CATEGORIA: Record<CategoriaMedia, readonly string[]> = {
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

export function validarMediaArchivo(file: File, categoria: CategoriaMedia): string | null {
  if (file.size <= 0) return "El archivo está vacío.";
  if (file.size > LIMITE_BYTES_MEDIA) return "El archivo supera el máximo de 100 MB.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type || MIME_POR_EXTENSION[extension] || "";
  if (!MIME_POR_CATEGORIA[categoria].includes(mime)) {
    return `Tipo de archivo no permitido para "${categoria}".`;
  }
  return null;
}

export interface MediaAssetVersion {
  media_asset_version_id: string;
  media_asset_id: string;
  numero: number;
  nombre_archivo: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  nota: string | null;
  subido_por: number | null;
  empresa_id: number;
  estado: "activo" | "inactivo";
  creado_en: string;
  actualizado_en: string;
}

export interface MediaAssetReferencia {
  proyecto_id: string;
  nombre: string;
  tipo?: string;
}

export interface MediaPropiedadReferencia {
  propiedad_id: string;
  nombre: string;
  ubicacion: string | null;
}

export interface MediaAsset {
  media_asset_id: string;
  nombre: string;
  categoria: CategoriaMedia;
  descripcion: string | null;
  proyecto_id: string | null;
  propiedad_id: string | null;
  version_activa_id: string | null;
  empresa_id: number;
  estado: "activo" | "inactivo";
  proyecto: MediaAssetReferencia | null;
  propiedad: MediaPropiedadReferencia | null;
  version_activa: MediaAssetVersion | null;
  creado_en: string;
  actualizado_en: string;
}

export type MediaAssetCreate = {
  nombre: string;
  categoria: CategoriaMedia;
  descripcion?: string | null;
  proyecto_id?: string | null;
  propiedad_id?: string | null;
};

export interface MediaAssetDescarga {
  url: string;
  expira_en_segundos: number;
  nombre_archivo: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  numero: number;
}

export interface MediaAssetRepository extends CrudRepository<MediaAsset, string, MediaAssetCreate> {
  listarVersiones(assetId: string): Promise<MediaAssetVersion[]>;
  subirVersion(assetId: string, file: File, nota?: string | null): Promise<MediaAssetVersion>;
  descargar(assetId: string): Promise<MediaAssetDescarga>;
  descargarVersion(assetId: string, versionId: string): Promise<MediaAssetDescarga>;
  restaurarVersion(assetId: string, versionId: string): Promise<MediaAsset>;
  eliminarVersion(assetId: string, versionId: string): Promise<void>;
}
