import { useMemo, useState } from "react";
import { Alert, Button, DatePicker, Select, Spin } from "antd";
import { AimOutlined, DollarOutlined, RiseOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AUTH_ENABLED } from "@/presentation/auth/AuthProvider";
import { useAuth, useCampanas, useGeneraciones, useLeads } from "@/presentation/hooks";
import type { Conexion } from "@/domain/conexion";
import { http } from "@/infrastructure/http/httpClient";
import { useQuery } from "@tanstack/react-query";
import { useCampaignAnalytics } from "@/presentation/hooks/useCampaignAnalytics";

const PAGE_SIZE = 25;
const PUNTOS = 12;
const money = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 0 });
function metric(value: number | null, format: (value: number) => string): string {
  return value === null ? "No disponible" : format(value);
}

export function AnaliticaPage() {
  const { tienePermiso } = useAuth();
  const puedeVer = !AUTH_ENABLED || tienePermiso("ver_analitica");
  const { data: campanas } = useCampanas();
  const { data: leads } = useLeads();
  const { data: generaciones } = useGeneraciones();
  const { data: conexiones } = useQuery({
    queryKey: ["analytics-meta-connection"],
    queryFn: () => http.get<Conexion[]>("/v1/conexiones"),
    enabled: AUTH_ENABLED && puedeVer,
    staleTime: 60_000,
  });
  const metaConfigurado = (conexiones ?? []).some((connection) => connection.estado === "conectada" && connection.autenticada);
  const defaultHasta = dayjs().format("YYYY-MM-DD");
  const defaultDesde = dayjs().subtract(29, "day").format("YYYY-MM-DD");
  const [desdeDraft, setDesdeDraft] = useState(defaultDesde);
  const [hastaDraft, setHastaDraft] = useState(defaultHasta);
  const [sistemaDesdeDraft, setSistemaDesdeDraft] = useState(defaultDesde);
  const [sistemaHastaDraft, setSistemaHastaDraft] = useState(defaultHasta);
  const [sistemaRango, setSistemaRango] = useState({ desde: defaultDesde, hasta: defaultHasta });
  const [campaniaDraft, setCampaniaDraft] = useState<string>();
  const [filtros, setFiltros] = useState({ desde: defaultDesde, hasta: defaultHasta, campania_id: undefined as string | undefined, offset: 0 });
  const analytics = useCampaignAnalytics({
    ...filtros,
    fuente: "meta",
    limit: PAGE_SIZE,
    enabled: AUTH_ENABLED && puedeVer && metaConfigurado,
  });

  const leadsSistema = (leads ?? []).filter((lead) => {
    const date = dayjs(lead.created_at).format("YYYY-MM-DD");
    return date >= sistemaRango.desde && date <= sistemaRango.hasta;
  });
  const generacionesCompletadas = (generaciones ?? []).filter((generation) => {
    const date = dayjs(generation.created_at).format("YYYY-MM-DD");
    return generation.status === "completed" && date >= sistemaRango.desde && date <= sistemaRango.hasta;
  });
  const campanasSistema = (campanas ?? []).filter((campaign) => {
    const date = dayjs(campaign.created_at).format("YYYY-MM-DD");
    return date >= sistemaRango.desde && date <= sistemaRango.hasta;
  });
  const gastoSistema = generacionesCompletadas.reduce((total, generation) => total + Number(generation.price_usd ?? 0), 0);
  const leadsContactados = leadsSistema.filter((lead) => ["contactado", "calificado", "visitado", "cerrado"].includes(lead.estado)).length;
  const costoLeadSistema = leadsSistema.length ? gastoSistema / leadsSistema.length : null;
  const serieSistema = useMemo(() => {
    const start = dayjs(sistemaRango.desde);
    const end = dayjs(sistemaRango.hasta);
    const totalDays = Math.max(1, end.diff(start, "day") + 1);
    const buckets = Math.min(PUNTOS, totalDays);
    return Array.from({ length: buckets }, (_, index) => {
      const firstOffset = Math.floor(index * totalDays / buckets);
      const nextOffset = Math.floor((index + 1) * totalDays / buckets);
      const bucketStart = start.add(firstOffset, "day");
      const bucketEnd = start.add(Math.max(firstOffset, nextOffset - 1), "day");
      return {
        key: bucketStart.format("YYYY-MM-DD"),
        label: bucketStart.format("DD/MM"),
        count: leadsSistema.filter((lead) => {
          const date = dayjs(lead.created_at).format("YYYY-MM-DD");
          return date >= bucketStart.format("YYYY-MM-DD") && date <= bucketEnd.format("YYYY-MM-DD");
        }).length,
      };
    });
  }, [leadsSistema, sistemaRango]);
  const maxSistema = Math.max(1, ...serieSistema.map((point) => point.count));
  const items = analytics.data?.items ?? [];
  const subtotal = useMemo(() => items.length === 0
    ? { gasto: null, impresiones: null, clics: null, leads: null }
    : items.reduce((result, item) => ({
      gasto: result.gasto === null || item.gasto === null ? null : result.gasto + item.gasto,
      impresiones: result.impresiones === null || item.impresiones === null ? null : result.impresiones + item.impresiones,
      clics: result.clics === null || item.clics === null ? null : result.clics + item.clics,
      leads: result.leads === null || item.leads === null ? null : result.leads + item.leads,
    }), { gasto: 0 as number | null, impresiones: 0 as number | null, clics: 0 as number | null, leads: 0 as number | null }), [items]);
  const ctr = subtotal.impresiones !== null && subtotal.impresiones > 0 && subtotal.clics !== null
    ? subtotal.clics / subtotal.impresiones * 100 : null;
  const cpl = subtotal.leads !== null && subtotal.leads > 0 && subtotal.gasto !== null
    ? subtotal.gasto / subtotal.leads : null;
  const dateRangeValid = Boolean(desdeDraft && hastaDraft && desdeDraft <= hastaDraft &&
    dayjs(hastaDraft).diff(dayjs(desdeDraft), "day") <= 90);
  const sistemaDateRangeValid = Boolean(sistemaDesdeDraft && sistemaHastaDraft && sistemaDesdeDraft <= sistemaHastaDraft &&
    dayjs(sistemaHastaDraft).diff(dayjs(sistemaDesdeDraft), "day") <= 90);

  const aplicarFiltros = () => setFiltros({ desde: desdeDraft, hasta: hastaDraft, campania_id: campaniaDraft, offset: 0 });
  const aplicarFiltroSistema = () => setSistemaRango({ desde: sistemaDesdeDraft, hasta: sistemaHastaDraft });
  const cambiarPagina = (offset: number) => setFiltros((current) => ({ ...current, offset }));

  if (AUTH_ENABLED && !puedeVer) {
    return <Alert type="error" showIcon message="No tienes permiso para consultar analítica." />;
  }

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Inteligencia comercial</p>
          <h1>Analítica y desempeño</h1>
          <p className="sub">Indicadores internos del sistema y rendimiento de campañas conectadas.</p>
        </div>
      </div>

      <section style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <div><p className="eyebrow">Inteligencia comercial</p><h2 style={{ fontSize: 19, margin: 0 }}>Métricas del sistema</h2></div>
          <div className="analytics-date-filter">
            <DatePicker.RangePicker
              value={[dayjs(sistemaDesdeDraft), dayjs(sistemaHastaDraft)]}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={(dates) => {
                if (dates?.[0] && dates[1]) {
                  setSistemaDesdeDraft(dates[0].format("YYYY-MM-DD"));
                  setSistemaHastaDraft(dates[1].format("YYYY-MM-DD"));
                }
              }}
              aria-label="Rango de fechas de métricas del sistema"
            />
            <Button type="primary" onClick={aplicarFiltroSistema} disabled={!sistemaDateRangeValid}>Aplicar fechas</Button>
          </div>
        </div>
        {!sistemaDateRangeValid && <p className="delta" style={{ color: "#b42318", marginTop: 0 }}>Selecciona un rango válido de hasta 90 días.</p>}
        <div className="grid cols4 analytics-stats">
          <div className="card stat"><span className="stat-icon"><TeamOutlined /></span><div className="analytics-stat-body"><span className="stat-label">Leads capturados</span><span className="stat-value">{leads ? integer.format(leadsSistema.length) : "—"}</span></div></div>
          <div className="card stat"><span className="stat-icon"><AimOutlined /></span><div className="analytics-stat-body"><span className="stat-label">Contactados</span><span className="stat-value">{leads ? integer.format(leadsContactados) : "—"}</span><span className="delta muted">{leadsSistema.length ? `${Math.round(leadsContactados / leadsSistema.length * 100)}% del total` : "Sin datos"}</span></div></div>
          <div className="card stat"><span className="stat-icon"><DollarOutlined /></span><div className="analytics-stat-body"><span className="stat-label">Costo por lead</span><span className="stat-value">{costoLeadSistema !== null ? money.format(costoLeadSistema) : "—"}</span><span className="delta muted">Generaciones completadas / leads</span></div></div>
          <div className="card stat"><span className="stat-icon"><RiseOutlined /></span><div className="analytics-stat-body"><span className="stat-label">Costo de generación</span><span className="stat-value">{generaciones ? money.format(gastoSistema) : "—"}</span><span className="delta muted">{generacionesCompletadas.length} creativos completados</span></div></div>
        </div>
        <div className="grid cols2 analytics-system-panels" style={{ marginTop: 20, alignItems: "start" }}>
          <div className="card card-pad">
            <h2 style={{ fontSize: 17 }}>Contactos por día</h2>
            <p className="sub">Tendencia del rango seleccionado · hasta {PUNTOS} días en el gráfico</p>
            <div className="chart">{serieSistema.map((point) => <div key={point.key} className="bar" style={{ height: `${Math.max(4, point.count / maxSistema * 100)}%` }}><em>{point.label}: {point.count}</em></div>)}</div>
            <div className="chartlabel"><span>{serieSistema[0]?.label}</span><span>{serieSistema[Math.floor((serieSistema.length - 1) / 2)]?.label}</span><span>{serieSistema.at(-1)?.label}</span></div>
          </div>
          <div className="card card-pad">
            <h2 style={{ fontSize: 17 }}>Lectura de resultados</h2>
            <p className="sub" style={{ marginBottom: 16 }}>Actividad del sistema · {dayjs(sistemaRango.desde).format("DD/MM/YYYY")} al {dayjs(sistemaRango.hasta).format("DD/MM/YYYY")}</p>
            <div className="metric-pair"><span>Contactos del periodo</span><strong>{leads ? leadsSistema.length : "—"}</strong></div>
            <div className="metric-pair"><span>Campañas activas</span><strong>{campanasSistema.filter((campaign) => ["active", "published_paused", "approved"].includes(campaign.estado)).length}</strong></div>
            <div className="metric-pair"><span>Creativos completados</span><strong>{generacionesCompletadas.length}</strong></div>
            <div className="metric-pair"><span>Ventas atribuidas</span><strong>No conectada</strong></div>
            <div className="notice" style={{ marginTop: 16 }}>Las métricas del sistema usan los registros internos y el rango de fechas seleccionado.</div>
          </div>
        </div>
      </section>

      {!AUTH_ENABLED && <Alert type="info" showIcon message="La sección Meta requiere la API autenticada y una conexión activa." style={{ marginBottom: 16 }} />}
      {AUTH_ENABLED && !metaConfigurado && <Alert type="info" showIcon message="Meta no está configurado para esta empresa. Las métricas de Meta se ocultan hasta conectar una cuenta autenticada." style={{ marginBottom: 16 }} />}

      {metaConfigurado && <section>
      <h2 style={{ fontSize: 19, marginBottom: 12 }}>Métricas de Meta Ads</h2>

      <section className="card card-pad" aria-label="Filtros de analítica de Meta" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
          <label className="field">
            <span className="lbl">Periodo de Meta</span>
            <DatePicker.RangePicker
              value={[dayjs(desdeDraft), dayjs(hastaDraft)]}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={(dates) => {
                if (dates?.[0] && dates[1]) {
                  setDesdeDraft(dates[0].format("YYYY-MM-DD"));
                  setHastaDraft(dates[1].format("YYYY-MM-DD"));
                }
              }}
            />
          </label>
          <label className="field" style={{ minWidth: 170 }}>
            <span className="lbl">Fuente</span>
            <Select value="meta" options={[{ value: "meta", label: "Meta Ads" }]} disabled style={{ width: "100%" }} />
          </label>
          <label className="field" style={{ minWidth: 230 }}>
            <span className="lbl">Campaña</span>
            <Select
              allowClear
              value={campaniaDraft}
              onChange={(value) => setCampaniaDraft(value)}
              placeholder="Todas las campañas"
              style={{ width: "100%" }}
              options={(campanas ?? []).map((campaign) => ({ value: campaign.campaign_id, label: campaign.nombre }))}
            />
          </label>
          <Button type="primary" onClick={aplicarFiltros} disabled={!dateRangeValid || !puedeVer} loading={analytics.isFetching}>
            Aplicar filtros
          </Button>
        </div>
        {!dateRangeValid && <p className="delta" style={{ color: "#b42318", marginTop: 8 }}>El rango debe ser válido y no superar 90 días.</p>}
      </section>

      {analytics.isError && <Alert type="error" showIcon message="No se pudieron cargar las métricas." description={analytics.error instanceof Error ? analytics.error.message : "Intenta nuevamente."} action={<Button size="small" onClick={() => void analytics.refetch()}>Reintentar</Button>} style={{ marginBottom: 16 }} />}

      <div className="grid cols4">
        {[
          ["Gasto · subtotal de página", metric(subtotal.gasto, (value) => money.format(value))],
          ["Impresiones · subtotal de página", metric(subtotal.impresiones, (value) => integer.format(value))],
          ["Clics · subtotal de página", metric(subtotal.clics, (value) => integer.format(value))],
          ["Leads · subtotal de página", metric(subtotal.leads, (value) => integer.format(value))],
        ].map(([label, value]) => <div className="card stat" key={label}><span className="stat-body"><span className="stat-label">{label}</span><span className="stat-value">{value}</span></span></div>)}
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Campañas</h2>
            <p className="sub" style={{ marginBottom: 12 }}>CTR = clics / impresiones × 100. CPL = gasto / leads. Si el denominador es cero o no hay dato, se muestra como no disponible.</p>
          </div>
          {analytics.data && <span className="delta muted">Consulta: {dayjs(analytics.data.datos.actualizado_en).format("DD/MM/YYYY HH:mm")}</span>}
        </div>
        {analytics.isLoading ? <div style={{ padding: 36, textAlign: "center" }}><Spin /></div> : items.length === 0 ? <p className="sub">No hay campañas para estos filtros o Meta no tiene datos disponibles en el rango.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead><tr>{["Campaña", "Gasto", "Impresiones", "Clics", "Leads", "CTR", "CPL", "Estado de datos"].map((heading) => <th key={heading} style={{ textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e5e7eb" }}>{heading}</th>)}</tr></thead>
              <tbody>{items.map((item) => <tr key={item.campaign_id}>
                <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{item.campaign_name ?? `Campaña ${item.campaign_id}`}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.gasto, (value) => money.format(value))}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.impresiones, (value) => integer.format(value))}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.clics, (value) => integer.format(value))}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.leads, (value) => integer.format(value))}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.ctr, (value) => `${value.toFixed(2)}%`)}</td>
                <td style={{ padding: "10px 8px" }}>{metric(item.cpl, (value) => money.format(value))}</td>
                <td style={{ padding: "10px 8px" }}>{item.metricas_disponibles ? "Disponible" : "No disponible"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12 }}>
          <span className="delta muted">{analytics.data ? `${analytics.data.pagination.total} campañas · página de ${PAGE_SIZE}` : ""}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button disabled={!filtros.offset || analytics.isFetching} onClick={() => cambiarPagina(Math.max(0, filtros.offset - PAGE_SIZE))}>Anterior</Button>
            <Button disabled={!analytics.data?.pagination.has_more || analytics.isFetching} onClick={() => cambiarPagina(filtros.offset + PAGE_SIZE)}>Siguiente</Button>
          </div>
        </div>
      </div>

      <Alert type="info" showIcon style={{ marginTop: 14 }} message="Antigüedad y disponibilidad" description={analytics.data?.datos.antiguedad ?? "Meta puede tardar en actualizar o ajustar sus Insights. La hora de consulta no indica cuándo se originó cada evento. El rango máximo es de 90 días."} />
      {analytics.data && <p className="delta muted" style={{ marginTop: 8 }}>CTR agregado: {metric(ctr, (value) => `${value.toFixed(2)}%`)} · CPL agregado: {metric(cpl, (value) => money.format(value))}. Los totales corresponden a la página visible.</p>}
      </section>}
    </div>
  );
}
