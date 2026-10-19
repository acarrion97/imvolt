import { useMemo } from "react";
import {
  AimOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useCampanas, useGeneraciones, useLeads, usePropiedades, useTransacciones } from "@/presentation/hooks";
import type { LeadFuente } from "@/domain/lead";
import dayjs from "dayjs";

const FUENTE_LABELS: Record<LeadFuente, string> = {
  meta_formulario: "Meta formulario",
  whatsapp: "WhatsApp",
  landing: "Landing",
  manual: "Manual",
  lotes_al_mando: "Lotes al Mando",
};

const PUNTOS = 12;

/**
 * Analítica — UI Concept 01: cuatro métricas, gráfico de barras por día
 * (actividad real de la demo) y panel de lectura de resultados.
 */
export function AnaliticaPage() {
  const { data: leads } = useLeads();
  const { data: campanas } = useCampanas();
  const { data: generaciones } = useGeneraciones();
  const { data: propiedades } = usePropiedades();
  const { data: transacciones } = useTransacciones();

  const inversion = useMemo(
    () =>
      (transacciones ?? [])
        .filter((t) => t.tipo === "consumo")
        .reduce((acc, t) => acc + Math.abs(Number(t.monto)), 0),
    [transacciones],
  );

  const contactados = (leads ?? []).filter((l) =>
    ["contactado", "calificado", "visitado", "cerrado"].includes(l.estado),
  ).length;
  const costoPorLead = (leads ?? []).length > 0 ? inversion / (leads ?? []).length : 0;
  const activas = (campanas ?? []).filter((c) =>
    ["active", "published_paused", "approved"].includes(c.estado),
  ).length;

  /** Leads por día (últimos 12 días) a partir de los datos reales de la demo. */
  const serie = useMemo(() => {
    const hoy = dayjs().startOf("day");
    return Array.from({ length: PUNTOS }, (_, i) => {
      const d = hoy.subtract(PUNTOS - 1 - i, "day");
      const n = (leads ?? []).filter((l) => dayjs(l.created_at).isSame(d, "day")).length;
      return { key: d.format("YYYY-MM-DD"), label: d.format("DD/MM"), n };
    });
  }, [leads]);
  const maxSerie = Math.max(1, ...serie.map((p) => p.n));

  const porFuente = useMemo(() => {
    const counts = new Map<LeadFuente, number>();
    for (const l of leads ?? []) counts.set(l.fuente, (counts.get(l.fuente) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const creadosRecientes = (leads ?? []).filter((l) =>
    dayjs(l.created_at).isAfter(dayjs().subtract(7, "day")),
  ).length;

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Crecimiento</p>
          <h1>Analítica y desempeño</h1>
          <p className="sub">
            Señales del workspace: creativos, campañas, contactos e inversión en créditos.
          </p>
        </div>
      </div>

      <div className="grid cols4">
        <div className="card stat">
          <span className="stat-icon">
            <TeamOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Leads capturados</span>
            <div className="stat-value">{leads?.length ?? 0}</div>
            <span className="delta">{creadosRecientes} en los últimos 7 días</span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <AimOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Contactados</span>
            <div className="stat-value">{contactados}</div>
            <span className="delta muted">
              {leads?.length
                ? `${Math.round((contactados / (leads?.length ?? 1)) * 100)}% del total`
                : "Sin datos"}
            </span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <DollarOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Costo por lead</span>
            <div className="stat-value">
              {costoPorLead > 0 ? `${Math.round(costoPorLead)} cr.` : "—"}
            </div>
            <span className="delta muted">Créditos consumidos / leads</span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <RiseOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Inversión</span>
            <div className="stat-value">{inversion} cr.</div>
            <span className="delta muted">{activas} campañas en curso</span>
          </span>
        </div>
      </div>

      <div className="grid cols3" style={{ marginTop: 20, alignItems: "start" }}>
        <div className="card card-pad" style={{ gridColumn: "span 2" }}>
          <h2 style={{ fontSize: 17, marginBottom: 4 }}>Leads por día</h2>
          <p className="sub" style={{ marginBottom: 4 }}>
            Actividad de captación de los últimos {PUNTOS} días.
          </p>

          <div className="chart">
            {serie.map((p) => (
              <div
                key={p.key}
                className="bar"
                style={{ height: `${Math.max(4, (p.n / maxSerie) * 100)}%` }}
              >
                <em>
                  {p.label}: {p.n} leads
                </em>
              </div>
            ))}
          </div>
          <div className="chartlabel">
            {serie.map((p) => (
              <span key={p.key}>{p.label}</span>
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <h2 style={{ fontSize: 16, marginBottom: 6 }}>Lectura de resultados</h2>
            <div className="metric-pair">
              <span>Tasa de contacto</span>
              <strong>
                {leads?.length ? `${Math.round((contactados / (leads?.length ?? 1)) * 100)}%` : "—"}
              </strong>
            </div>
            <div className="metric-pair">
              <span>Campañas activas</span>
              <strong>
                {activas} de {campanas?.length ?? 0}
              </strong>
            </div>
            <div className="metric-pair">
              <span>Creativos completados</span>
              <strong>
                {(generaciones ?? []).filter((g) => g.status === "completed").length} de{" "}
                {generaciones?.length ?? 0}
              </strong>
            </div>
            <div className="metric-pair">
              <span>Propiedades con medios autorizados</span>
              <strong>
                {(propiedades ?? []).filter((p) => (p.medios_autorizados ?? []).length > 0).length} de{" "}
                {propiedades?.length ?? 0}
              </strong>
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ alignSelf: "start" }}>
          <h2 style={{ fontSize: 16, marginBottom: 10 }}>Leads por fuente</h2>
          {porFuente.length === 0 && <p className="sub">Sin leads registrados todavía.</p>}
          {porFuente.map(([fuente, n]) => (
            <div key={fuente} className="list-row">
              <span className="who">
                <span className={`list-dot${fuente === "manual" ? " grey" : ""}`} />
                {FUENTE_LABELS[fuente] ?? fuente}
              </span>
              <span className="amount">{n}</span>
            </div>
          ))}

          <div className="notice" style={{ marginTop: 18, marginBottom: 0 }}>
            Las métricas provienen de la demo: al conectar Meta y el webhook de leads pasarán a ser
            datos reales.
          </div>
        </div>
      </div>
    </div>
  );
}
