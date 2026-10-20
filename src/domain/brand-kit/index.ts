import type { CrudRepository } from "@/domain/core/repositories/CrudRepository";

/**
 * Categorías de archivo del Brand Kit.
 * Catálogo fijo, idéntico al validado por la API (`CATEGORIAS_ASSET`).
 */
export const CATEGORIAS_ASSET = [
  "logo_horizontal",
  "logo_isotipo",
  "tipografia",
  "imagen_referencia",
  "plantilla_documento",
  "otro",
] as const;

export type CategoriaAsset = (typeof CATEGORIAS_ASSET)[number];

/**
 * Roles que un color puede cumplir dentro de la identidad.
 * Catálogo fijo, idéntico al validado por la API (`USOS_COLOR`).
 */
export const USOS_COLOR = ["principal", "secundario", "acento", "fondo", "texto"] as const;

export type UsoColor = (typeof USOS_COLOR)[number];

/** Estado lógico del registro (`public.*.estado`). */
export type BrandKitEstado = "activo" | "inactivo";

/** Límite de tamaño de archivo aceptado por la API (10 MB). */
export const LIMITE_BYTES_ARCHIVO = 10 * 1024 * 1024;

/** Extensiones sugeridas por el selector de archivo, por categoría. */
export const ACEPTADOS_POR_CATEGORIA: Record<CategoriaAsset, string> = {
  logo_horizontal: ".png,.svg,.webp,.jpg,.jpeg",
  logo_isotipo: ".png,.svg,.webp,.jpg,.jpeg",
  tipografia: ".woff,.woff2,.ttf,.otf",
  imagen_referencia: ".png,.jpg,.jpeg,.webp",
  plantilla_documento: ".pdf",
  otro: ".png,.jpg,.jpeg,.svg,.webp,.pdf,.woff,.woff2",
};

/**
 * MIME types permitidos por categoría. Espejo EXACTO de
 * `MIME_POR_CATEGORIA` en `api/src/services/brandkit.storage.ts`: la
 * validación de seguridad vive en el API, esta lista solo sirve para
 * anticipar el error en el formulario.
 */
export const MIME_POR_CATEGORIA: Record<CategoriaAsset, readonly string[]> = {
  logo_horizontal: ["image/png", "image/svg+xml", "image/webp", "image/jpeg"],
  logo_isotipo: ["image/png", "image/svg+xml", "image/webp", "image/jpeg"],
  tipografia: ["font/woff", "font/woff2", "font/ttf", "font/otf", "application/font-woff"],
  imagen_referencia: ["image/png", "image/jpeg", "image/webp"],
  plantilla_documento: ["application/pdf"],
  otro: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "font/woff",
    "font/woff2",
  ],
};

/**
 * MIME genéricos: el navegador no reporta el tipo real (típico en `.woff2`,
 * `.otf` y algunos arrastres), así que en ese caso se deduce de la extensión.
 */
const MIME_GENERICO = new Set(["", "application/octet-stream", "binary/octet-stream"]);

/** MIME inferido de la extensión (espejo de `brandkit.storage.ts`). */
const MIME_POR_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
};

/** Extensiones aceptadas por categoría, sin punto (`[".png", ".svg"]`). */
export function extensionesDe(categoria: CategoriaAsset): string[] {
  return (ACEPTADOS_POR_CATEGORIA[categoria] ?? ACEPTADOS_POR_CATEGORIA.otro)
    .split(",")
    .map((ext) => ext.trim())
    .filter(Boolean);
}

/** Extensión en minúscula sin punto (`Logo.SVG` → `svg`). */
export function extensionDeNombre(nombre: string): string {
  const punto = nombre.lastIndexOf(".");
  return punto > -1 ? nombre.slice(punto + 1).toLowerCase() : "";
}

/**
 * MIME efectivo del archivo: el declarado por el navegador o, si viene vacío o
 * genérico, el que corresponde a su extensión.
 */
export function resolverMimeCliente(file: File): string {
  if (!MIME_GENERICO.has(file.type)) return file.type;
  return MIME_POR_EXTENSION[extensionDeNombre(file.name)] ?? file.type;
}

/**
 * Validación CLIENTE del archivo antes de subirlo (vacío + tamaño + MIME).
 * Devuelve `null` si es válido o el mensaje de error en caso contrario.
 *
 * Es espejo EXACTO de `validarArchivo` en `api/src/services/brandkit.storage.ts`:
 * aquí solo evitamos un viaje inútil, la seguridad la aplica el API (413/415).
 */
export function validarArchivoCliente(file: File, categoria: CategoriaAsset): string | null {
  if (file.size <= 0) {
    return "El archivo está vacío.";
  }
  if (file.size > LIMITE_BYTES_ARCHIVO) {
    return `El archivo supera el máximo de ${LIMITE_BYTES_ARCHIVO / 1024 / 1024} MB.`;
  }

  const permitidos = MIME_POR_CATEGORIA[categoria] ?? MIME_POR_CATEGORIA.otro;
  const mensajeTipo = `Tipo de archivo no permitido para "${categoria}". Aceptados: ${permitidos.join(", ")}.`;

  // El tipo declarado, si es conocido, debe corresponder a la categoría
  // (evita subir renombrando un .exe a .png).
  if (!MIME_GENERICO.has(file.type) && !permitidos.includes(file.type)) {
    return mensajeTipo;
  }
  // El tipo efectivo (declarado o deducido de la extensión) también.
  if (!permitidos.includes(resolverMimeCliente(file))) {
    return mensajeTipo;
  }
  return null;
}

/** Empresa incrustada (FK → `public.empresas`). */
export interface BrandKitEmpresa {
  empresa_id: number;
  razon_social: string;
}

/** Versión concreta de un archivo: un blob dentro del bucket privado. */
export interface BrandAssetVersion {
  brand_asset_version_id: string;
  brand_asset_id: string;
  /** Número correlativo de la versión (1 = v1, 2 = v2...). */
  numero: number;
  nombre_archivo: string;
  /** Ruta dentro del bucket privado; no es una URL pública. */
  ruta_storage: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  /** Qué cambió en esta versión. */
  nota: string | null;
  subido_por: number | null;
  empresa_id: number;
  estado: BrandKitEstado;
  creado_en: string;
  actualizado_en: string;
}

/** Archivo lógico del Brand Kit (p. ej. "Logo horizontal principal"). */
export interface BrandAsset {
  brand_asset_id: string;
  nombre: string;
  categoria: CategoriaAsset;
  descripcion: string | null;
  /** Puntero a la versión activa (la que se sirve al descargar). */
  version_activa_id: string | null;
  empresa_id: number;
  estado: BrandKitEstado;
  /** Relación incrustada (FK → empresas). */
  empresa: BrandKitEmpresa | null;
  /** Relación incrustada (FK → brand_asset_versions). */
  version_activa: BrandAssetVersion | null;
  creado_en: string;
  actualizado_en: string;
}

/** Color de la paleta corporativa de la empresa. */
export interface BrandColor {
  brand_color_id: string;
  nombre: string;
  /** Código hexadecimal (#RRGGBB). */
  hex: string;
  uso: UsoColor;
  /** Orden de presentación en la paleta. */
  orden: number;
  empresa_id: number;
  estado: BrandKitEstado;
  /** Relación incrustada (FK → empresas). */
  empresa: BrandKitEmpresa | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Payload de creación de archivo: solo METADATOS. El blob se sube aparte con
 * `subirVersion` (multipart), de modo que un archivo puede existir sin versión.
 * `empresa_id` NO viaja: lo inyecta la API desde la sesión.
 */
export type BrandAssetCreate = {
  nombre: string;
  categoria: CategoriaAsset;
  descripcion?: string | null;
};

/** Payload de creación de color. */
export type BrandColorCreate = {
  nombre: string;
  hex: string;
  uso?: UsoColor;
  orden?: number;
};

/**
 * Resultado de una descarga autorizada. El API valida sesión + tenant y
 * devuelve una URL firmada de corta duración (el bucket es privado).
 */
export interface BrandAssetDescarga {
  url: string;
  expira_en_segundos: number;
  nombre_archivo: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  numero: number;
}

/**
 * Repositorio de archivos: CRUD de metadatos + operaciones de storage
 * (subir versión, listar historial, descargar, restaurar y borrar versión).
 */
export interface BrandAssetRepository extends CrudRepository<BrandAsset, string, BrandAssetCreate> {
  listarVersiones(assetId: string): Promise<BrandAssetVersion[]>;
  subirVersion(assetId: string, file: File, nota?: string | null): Promise<BrandAssetVersion>;
  descargar(assetId: string): Promise<BrandAssetDescarga>;
  descargarVersion(assetId: string, versionId: string): Promise<BrandAssetDescarga>;
  restaurarVersion(assetId: string, versionId: string): Promise<BrandAsset>;
  eliminarVersion(assetId: string, versionId: string): Promise<void>;
}

export type BrandColorRepository = CrudRepository<BrandColor, string, BrandColorCreate>;
