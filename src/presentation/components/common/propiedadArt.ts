import type { PropiedadCategoria, PropiedadEstado } from "@/domain/propiedad";

/** Etiqueta de categoría para el tag de la tarjeta. */
export const CATEGORIA_LABEL: Record<PropiedadCategoria, string> = {
  lote: "Terreno",
  casa: "Casa",
  departamento: "Departamento",
  oficina: "Oficina",
  local: "Local",
  proyecto: "Proyecto",
};

/**
 * Variante de ilustración del prototipo (.art.land / .house / .tower / .office):
 * el SVG correspondiente vive en presentation/theme/art.css.
 */
export function artVariant(categoria: PropiedadCategoria): "land" | "house" | "tower" | "office" {
  switch (categoria) {
    case "casa":
      return "house";
    case "departamento":
      return "tower";
    case "oficina":
    case "local":
      return "office";
    default:
      return "land";
  }
}

const ESTADO_BADGE: Record<PropiedadEstado, { label: string; cls: string }> = {
  disponible: { label: "Disponible", cls: "mini-badge" },
  reservada: { label: "Reservada", cls: "mini-badge warn" },
  vendida: { label: "Vendida", cls: "mini-badge grey" },
  no_disponible: { label: "No disponible", cls: "mini-badge red" },
};

export function badgeDeEstado(estado: PropiedadEstado): { label: string; cls: string } {
  return ESTADO_BADGE[estado] ?? { label: estado, cls: "mini-badge grey" };
}
