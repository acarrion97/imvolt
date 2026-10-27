import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { App, Empty, Input, Select, Spin } from "antd";
import {
  PictureOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { EstadoGeneracionTag, formatFecha, formatPrecio } from "@/presentation/components/common/status";
import {
  useCreateGeneracion,
  useGeneraciones,
  useModelos,
  usePlantillas,
  usePropiedades,
  useWallet,
} from "@/presentation/hooks";
import type { Generacion } from "@/domain/generacion";
import type { ColumnsType } from "antd/es/table";

type Media = "image" | "video";
type Modo = "facil" | "pro";

/**
 * Estudio IA — UI Concept 01: columna izquierda con modo fácil/pro, campos y
 * prompt generado; columna derecha con la preview oscura y la cotización
 * §09 leída SIEMPRE del registro vivo de modelos.
 */
export function EstudioPage() {
  const location = useLocation();
  const { message } = App.useApp();

  const { data: plantillas, isLoading: loadingPlantillas } = usePlantillas();
  const { data: modelos } = useModelos();
  const { data: propiedades } = usePropiedades();
  const { data: generaciones, isLoading: loadingGeneraciones } = useGeneraciones();
  const { data: wallet } = useWallet();
  const createGeneracion = useCreateGeneracion();

  const preset = location.state as { propertyId?: string; templateId?: string } | null;
  const [media, setMedia] = useState<Media>("image");
  const [modo, setModo] = useState<Modo>("facil");
  const [propertyId, setPropertyId] = useState<string | undefined>(preset?.propertyId);
  const [templateId, setTemplateId] = useState<string | undefined>(preset?.templateId);
  const [modelId, setModelId] = useState<string | undefined>();
  const [duration, setDuration] = useState<number | undefined>();
  const [ratio, setRatio] = useState<string | undefined>();
  const [promptPro, setPromptPro] = useState("");

  const modelosFiltrados = useMemo(
    () =>
      (modelos ?? []).filter((m) => m.media_type === media && m.status === "activo"),
    [modelos, media],
  );

  const selectedModelId = modelosFiltrados.some((m) => m.model_id === modelId)
    ? modelId
    : modelosFiltrados[0]?.model_id;

  const handleMediaChange = (nextMedia: Media) => {
    if (nextMedia === media) return;
    setMedia(nextMedia);
    setModelId(undefined);
    setRatio(undefined);
    setDuration(undefined);
  };

  const plantilla = useMemo(
    () => (plantillas ?? []).find((p) => String(p.plantilla_id) === templateId),
    [plantillas, templateId],
  );
  const propiedad = useMemo(
    () => (propiedades ?? []).find((p) => p.propiedad_id === propertyId),
    [propiedades, propertyId],
  );
  const modelo = useMemo(
    () => modelosFiltrados.find((m) => m.model_id === selectedModelId),
    [modelosFiltrados, selectedModelId],
  );
  const duracionesDisponibles = Array.isArray(modelo?.capabilities.duration_options)
    ? modelo.capabilities.duration_options.filter(
        (value): value is number => typeof value === "number",
      )
    : modelo?.duracion_min_s != null && modelo.duracion_max_s != null
      ? Array.from(
          { length: modelo.duracion_max_s - modelo.duracion_min_s + 1 },
          (_, index) => modelo.duracion_min_s! + index,
        )
      : [];

  /** Prompt de la plantilla + contexto de la propiedad (modo fácil). */
  const promptGenerado = useMemo(() => {
    const base =
      plantilla?.descripcion ??
      "Render fotorrealista de la propiedad con iluminación natural de tarde, ángulo amplio y ambiente premium.";
    const contexto = propiedad
      ? ` Propiedad: ${propiedad.nombre}${propiedad.ubicacion ? `, ${propiedad.ubicacion}` : ""}${
          propiedad.precio ? `, ${formatPrecio(propiedad.precio)}` : ""
        }.`
      : "";
    return `${base}${contexto}`.trim();
  }, [plantilla, propiedad]);

  // §09: la cotización sale SIEMPRE del registro vivo de modelos (sin hardcodeo).
  const creditosCotizados = useMemo(() => {
    if (!modelo) return 0;
    const extra =
      modelo.media_type === "video" && modelo.duracion_max_s
        ? Math.max(0, Math.ceil((duration ?? modelo.duracion_min_s ?? 5) / 5) - 1)
        : 0;
    return modelo.quote_creditos + extra;
  }, [modelo, duration]);

  const saldo = wallet?.saldo ?? 0;
  const saldoSuficiente = saldo >= creditosCotizados;
  const plantillasDeMedio = (plantillas ?? []).filter(
    (p) => p.estado === "activo",
  );

  const handleGenerar = async () => {
    if (!modelo) {
      message.error("Selecciona un modelo disponible para este medio.");
      return;
    }
    const prompt = (modo === "pro" ? promptPro : promptGenerado).trim();
    if (!prompt) {
      message.error("Escribe o genera un prompt antes de crear la generación.");
      return;
    }
    if (!saldoSuficiente) {
      message.error("Saldo de créditos insuficiente para esta generación.");
      return;
    }

    const parametros: Record<string, unknown> = {};
    if (duration) parametros.duration = duration;
    if (ratio) parametros.ratio = ratio;

    try {
      await createGeneracion.mutateAsync({
        property_id: propertyId ?? null,
        template_id: templateId ?? null,
        model_id: modelo.model_id,
        modo,
        prompt,
        parametros,
        status: "queued",
        credits_cost: creditosCotizados,
      });
      message.success("Generación encolada. El Estudio la procesará en unos segundos.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo crear la generación.");
    }
  };

  const historialOrdenado = useMemo(
    () => [...(generaciones ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [generaciones],
  );

  const columns: ColumnsType<Generacion> = [
    {
      title: "Prompt",
      dataIndex: "prompt",
      key: "prompt",
      render: (prompt: string, row) => (
        <div>
          <span style={{ fontWeight: 650, display: "block", maxWidth: 420 }}>{prompt}</span>
          <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
            {formatFecha(row.created_at)} · {row.modo === "pro" ? "Modo pro" : "Modo fácil"}
          </span>
        </div>
      ),
    },
    {
      title: "Costo",
      dataIndex: "credits_cost",
      key: "credits_cost",
      width: 95,
      render: (v: number) => `${v} cr.`,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: Generacion["status"]) => <EstadoGeneracionTag status={status} />,
    },
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Creative AI · Higgsfield</p>
          <h1>Crear contenido con IA</h1>
          <p className="sub">
            Elige la propiedad, la plantilla y el modelo: la cotización se lee del catálogo vivo.
          </p>
        </div>
        <div className="header-actions">
          <span className="count-pill">Saldo: {saldo} créditos</span>
        </div>
      </div>

      <div className="notice">
        <strong>Créditos simulados.</strong> La integración con Higgsfield corre en modo demo hasta
        configurar las credenciales en la API.
      </div>

      <div className="studio-grid">
        {/* ── Columna izquierda: composición ─────────────────────────────── */}
        <div className="card card-pad">
          <div className="studio-mode">
            <div>
              <strong>{modo === "facil" ? "Modo fácil" : "Modo pro"}</strong>
              <small>
                {modo === "facil"
                  ? "IMVOLT arma el prompt con la plantilla y la propiedad."
                  : "Edita el prompt y controla los parámetros avanzados."}
              </small>
            </div>
            <div className="mode-switch">
              <button
                type="button"
                className={modo === "facil" ? "on" : ""}
                onClick={() => setModo("facil")}
              >
                FÁCIL
              </button>
              <button
                type="button"
                className={modo === "pro" ? "on" : ""}
                onClick={() => {
                  if (!promptPro) setPromptPro(promptGenerado);
                  setModo("pro");
                }}
              >
                PRO
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <span className="lbl">Propiedad</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Selecciona una propiedad"
                style={{ width: "100%" }}
                value={propertyId}
                onChange={setPropertyId}
                options={(propiedades ?? []).map((p) => ({
                  value: p.propiedad_id,
                  label: `${p.nombre} (${p.ubicacion})`,
                }))}
              />
            </div>

            <div className="field">
              <span className="lbl">Plantilla</span>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Aplicar una plantilla"
                style={{ width: "100%" }}
                value={templateId}
                onChange={setTemplateId}
                loading={loadingPlantillas}
                options={plantillasDeMedio.map((p) => ({
                  value: String(p.plantilla_id),
                  label: p.nombre,
                }))}
              />
            </div>

            <div className="field full">
              <span className="lbl">Tipo de contenido</span>
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button
                  type="button"
                  className={`tab${media === "video" ? " active" : ""}`}
                  onClick={() => handleMediaChange("video")}
                >
                  <VideoCameraOutlined /> Video
                </button>
                <button
                  type="button"
                  className={`tab${media === "image" ? " active" : ""}`}
                  onClick={() => handleMediaChange("image")}
                >
                  <PictureOutlined /> Imagen
                </button>
              </div>
            </div>

            <div className="field">
              <span className="lbl">Modelo (§09 catálogo vivo)</span>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Selecciona el modelo"
                style={{ width: "100%" }}
                value={selectedModelId}
                onChange={(v) => {
                  setModelId(v);
                  setRatio(undefined);
                }}
                options={modelosFiltrados.map((m) => ({
                  value: m.model_id,
                  label: `${m.nombre} — ${m.quote_creditos} cr.`,
                }))}
              />
            </div>

            <div className="field">
              <span className="lbl">Formato</span>
              <Select
                allowClear
                placeholder={modelo?.ratios?.length ? "Relación de aspecto" : "Sin formatos"}
                style={{ width: "100%" }}
                value={ratio}
                onChange={setRatio}
                disabled={!modelo?.ratios?.length}
                options={(modelo?.ratios ?? []).map((r) => ({ value: r, label: r }))}
              />
            </div>

            {modelo?.media_type === "video" && (
              <div className="field">
                <span className="lbl">Duración (segundos)</span>
                <Select
                  placeholder={`${modelo.duracion_min_s ?? 5}–${modelo.duracion_max_s ?? 12} s`}
                  style={{ width: "100%" }}
                  value={duration}
                  onChange={setDuration}
                  options={duracionesDisponibles.map((value) => ({
                      value,
                      label: `${value} s`,
                  }))}
                />
              </div>
            )}
          </div>

          {modo === "pro" ? (
            <div className="field">
              <span className="lbl">Prompt</span>
              <Input.TextArea
                rows={4}
                maxLength={600}
                showCount
                value={promptPro}
                onChange={(e) => setPromptPro(e.target.value)}
                placeholder="Describe la escena: iluminación, ángulo, ambiente..."
              />
            </div>
          ) : (
            <div className="promptbox">
              <div className="plabel">Prompt generado</div>
              {promptGenerado}
            </div>
          )}
        </div>

        {/* ── Columna derecha: preview + cotización ──────────────────────── */}
        <div className="studio-preview">
          <div>
            <span className="demo-stamp">
              <span className="status-point" /> Créditos simulados
            </span>
            <div className="symbol" style={{ marginTop: 22 }}>
              <ThunderboltOutlined />
            </div>
            <h3>{propiedad?.nombre ?? "Vista previa creativa"}</h3>
            <p>
              {(modo === "pro" ? promptPro : promptGenerado).slice(0, 180) ||
                "Selecciona una propiedad para contextualizar el creativo."}
              …
            </p>
          </div>

          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7bd9a4" }}>
              Cotización §09
            </p>
            <div className="cost">{creditosCotizados} créditos</div>
            <p style={{ marginBottom: 15 }}>
              {modelo ? `${modelo.nombre} · ${modelo.provider}` : "Sin modelo seleccionado"} · saldo{" "}
              {saldo}
              {!saldoSuficiente && " — insuficiente"}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleGenerar}
              disabled={!modelo || !saldoSuficiente || createGeneracion.isPending}
            >
              <RobotOutlined />
              {createGeneracion.isPending ? "Encolando..." : "Generar con IA"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Historial ────────────────────────────────────────────────────── */}
      <div className="section-title">
        <h2>Historial de generaciones</h2>
        <p className="sub">
          Los renders generados con IA son conceptuales: etíquetalos siempre como tales en tus
          publicaciones (fidelidad de contenido, §07).
        </p>
      </div>

      <Spin spinning={loadingGeneraciones}>
        <div className="card" style={{ padding: "0 16px 8px" }}>
          {historialOrdenado.length === 0 ? (
            <Empty
              description="Aún no has generado nada. ¡Crea tu primer render!"
              style={{ padding: "42px 0" }}
            />
          ) : (
            <DataTable<Generacion>
              card={false}
              columns={columns}
              dataSource={historialOrdenado}
              rowKey="generation_id"
              pagination={false}
            />
          )}
        </div>
      </Spin>
    </div>
  );
}
