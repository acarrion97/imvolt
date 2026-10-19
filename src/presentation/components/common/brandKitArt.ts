import type { CategoriaAsset, UsoColor } from "@/domain/brand-kit";

/**
 * Etiquetas, utilidades de formato y "arte" del módulo Brand Kit.
 * Mismo patrón que `propiedadArt.ts`: una única fuente de verdad para que la
 * presentación no repita strings ni catálogos.
 */

/** Etiqueta legible de cada categoría de archivo. */
export const CATEGORIA_ASSET_LABEL: Record<CategoriaAsset, string> = {
  logo_horizontal: "Logo horizontal",
  logo_isotipo: "Isotipo",
  tipografia: "Tipografía",
  imagen_referencia: "Imagen de referencia",
  plantilla_documento: "Plantilla / documento",
  otro: "Otro archivo",
};

/** Etiqueta legible de cada rol de color. */
export const USO_COLOR_LABEL: Record<UsoColor, string> = {
  principal: "Principal",
  secundario: "Secundario",
  acento: "Acento",
  fondo: "Fondo",
  texto: "Texto",
};

/** Extensión del archivo a partir de su nombre (sin punto). */
export function extensionDe(nombre: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(nombre);
  return match ? match[1].toLowerCase() : "file";
}

/** Tamaño legible de un archivo en bytes (KB / MB). */
export function formatTamano(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Fecha corta (es-EC) para el historial de versiones. */
export function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Indica si un archivo se puede PREVISUALIZAR como imagen en la tarjeta.
 * Solo las categorías de imagen y logo tienen vista previa inline; el resto
 * (tipografías y documentos) se muestra con un ícono.
 */
export function esImagenPreview(categoria: CategoriaAsset): boolean {
  return (
    categoria === "logo_horizontal" ||
    categoria === "logo_isotipo" ||
    categoria === "imagen_referencia"
  );
}

/** Clase del badge de uso de color, con la paleta IMVOLT como respaldo. */
export function hexASeguro(hex: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#8fa89b";
}

/**
 * Texto oscuro o claro sobre un color, para que el nombre del color sea
 * legible dentro de su propia muestrilla (regla WCAG simple).
 */
export function textoSobre(hex: string): string {
  const seguro = hexASeguro(hex).slice(1);
  const r = parseInt(seguro.slice(0, 2), 16);
  const g = parseInt(seguro.slice(2, 4), 16);
  const b = parseInt(seguro.slice(4, 6), 16);
  // Luminancia relativa aproximada.
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.6 ? "#101719" : "#ffffff";
}
