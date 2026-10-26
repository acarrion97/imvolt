import { Tag } from "antd";
import type { CampanaEstado } from "@/domain/campana";
import type { GeneracionStatus } from "@/domain/generacion";
import type { LeadEstado } from "@/domain/lead";
import type { PropiedadDisponibilidad } from "@/domain/propiedad";
import type { ProyectoEstado } from "@/domain/proyecto";

/**
 * Etiquetas de estado con la paleta IMVOLT.
 * Verde = positivo/activo, ámbar = pendiente, rojo = problema, gris = neutro.
 * El texto pequeño sobre fondo claro nunca usa verde vivo (§04 del manual).
 */

const CAMPAIGN_COLORS: Record<CampanaEstado, string> = {
  local_draft: "default",
  validated: "processing",
  awaiting_approval: "gold",
  approved: "cyan",
  published_paused: "orange",
  active: "success",
  rejected: "red",
  failed: "red",
  archived: "default",
};

export function EstadoCampanaTag({ estado }: { estado: CampanaEstado }) {
  const label = estado.replace(/_/g, " ");
  return <Tag color={CAMPAIGN_COLORS[estado]}>{label.toUpperCase()}</Tag>;
}

const GEN_COLORS: Record<GeneracionStatus, string> = {
  created: "default",
  quoted: "default",
  credits_reserved: "processing",
  queued: "processing",
  processing: "blue",
  completed: "success",
  failed: "red",
  canceled: "default",
};

export function EstadoGeneracionTag({ status }: { status: GeneracionStatus }) {
  return <Tag color={GEN_COLORS[status]}>{status.replace(/_/g, " ").toUpperCase()}</Tag>;
}

const LEAD_COLORS: Record<LeadEstado, string> = {
  nuevo: "blue",
  contactado: "processing",
  calificado: "gold",
  visitado: "cyan",
  cerrado: "success",
  perdido: "red",
};

export function EstadoLeadTag({ estado }: { estado: LeadEstado }) {
  return <Tag color={LEAD_COLORS[estado]}>{estado.toUpperCase()}</Tag>;
}

const PROP_COLORS: Record<PropiedadDisponibilidad, string> = {
  disponible: "success",
  reservada: "gold",
  vendida: "default",
  no_disponible: "red",
};

export function EstadoPropiedadTag({ estado }: { estado: PropiedadDisponibilidad }) {
  return <Tag color={PROP_COLORS[estado]}>{estado.replace(/_/g, " ").toUpperCase()}</Tag>;
}

const PROY_COLORS: Record<ProyectoEstado, string> = {
  activo: "success",
  inactivo: "default",
};

export function EstadoProyectoTag({ estado }: { estado: ProyectoEstado }) {
  return <Tag color={PROY_COLORS[estado]}>{estado.toUpperCase()}</Tag>;
}

/** Formatea precios (la API usa numeric; llega como number | string). */
export function formatPrecio(value: number | string | null | undefined, moneda = "USD"): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Formatea fechas ISO a locale es-EC corto. */
export function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
}
