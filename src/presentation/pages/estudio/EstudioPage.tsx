import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App, Empty, Input, Select, Spin } from "antd";
import {
  CopyOutlined,
  PictureOutlined,
  RobotOutlined,
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
import type { Modelo } from "@/domain/modelo";
import type { ColumnsType } from "antd/es/table";

type Media = "image" | "video";
type Modo = "facil" | "pro";

/**
 * Estudio IA — UI Concept 01: réplica de la sección `#studio` del prototipo
 * interactivo. Columna izquierda con modo fácil/pro, campos y acción; columna
 * derecha con la vista previa y el prompt editable. La cotización §09 se lee
 * SIEMPRE del registro vivo de modelos (nunca hardcodeada).
 */

/** Etiquetas descriptivas de formato (prototipo: "9:16 · Reels / Stories"). */
const RATIO_LABELS: Record<string, string> = {
  "9:16": "9:16 · Reels / Stories",
  "4:5": "4:5 · Feed",
  "1:1": "1:1 · Cuadrado",
  "16:9": "16:9 · Horizontal",
  "4:3": "4:3 · Clásico",
  "3:4": "3:4 · Retrato",
  "2:3": "2:3 · Vertical",
  "3:2": "3:2 · Paisaje",
};

/** Enfoques comerciales del prototipo (§06): alimentan el prompt. */
const ENFOQUES = [
  {
    value: "estilo_vida",
    label: "Estilo de vida",
    texto: "Conectar con compradores mediante estilo de vida y beneficios reales",
  },
  {
    value: "oferta_comercial",
    label: "Oferta comercial",
    texto: "Presentar precio, ubicación y formas de pago verificadas",
  },
  {
    value: "ubicacion",
    label: "Ubicación y acceso",
    texto: "Destacar ubicación, accesibilidad y ventajas comprobadas",
  },
];

/**
 * Precio de lista del proveedor en el catálogo §09:
 * imagen → USD por imagen, video → USD por segundo.
 * `capabilities.precio_desde` marca los precios que Higgsfield publica como "from".
 */
function formatoPrecioModelo(modelo: Modelo | undefined): string | null {
  if (!modelo || modelo.precio_usd == null) return null;
  const unidad = modelo.precio_unidad === "segundo" ? "/ s" : "/ img";
  const desde = modelo.capabilities?.precio_desde === true ? "desde " : "";
  return `${desde}$${modelo.precio_usd.toFixed(3)} ${unidad}`;
}

export function EstudioPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [enfoque, setEnfoque] = useState<string | undefined>(ENFOQUES[0].value);
  const [referencia, setReferencia] = useState<string | undefined>();
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
    : modelo?.duracion_min_s != null && modelo?.duracion_max_s != null
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
    const enfoqueTexto = ENFOQUES.find((e) => e.value === enfoque);
    const enfoqueParte = enfoqueTexto ? ` ENFOQUE COMERCIAL: ${enfoqueTexto.texto}.` : "";
    const referenciaParte = referencia
      ? ` REFERENCIA ADJUNTA LOCALMENTE: ${referencia} (no se envía a servidores).`
      : "";
    return `${base}${contexto}${enfoqueParte}${referenciaParte}`.trim();
  }, [plantilla, propiedad, enfoque, referencia]);

  const promptActual = (modo === "pro" ? promptPro : promptGenerado).trim();

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

  const formatoPreview = ratio ?? modelo?.ratios?.[0] ?? "Formato adaptable";
  const duracionPreview = duration ?? modelo?.duracion_min_s ?? 5;

  const handleGenerar = async () => {
    if (!modelo) {
      message.error("Selecciona un modelo disponible para este medio.");
      return;
    }
    if (!promptActual) {
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
        prompt: promptActual,
        parametros,
        status: "queued",
        credits_cost: creditosCotizados,
      });
      message.success("Generación encolada. El Estudio la procesará en unos segundos.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo crear la generación.");
    }
  };

  const handleCopiarPrompt = async () => {
    if (!promptActual) {
      message.error("No hay prompt para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(promptActual);
      message.success("Prompt copiado al portapapeles.");
    } catch {
      message.error("No se pudo copiar el prompt.");
    }
  };

  const handleReferencia = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setReferencia(file?.name);
    if (!file) event.target.value = "";
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
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="header">
        <div>
          <div className="eyebrow">Creative Studio</div>
          <h1>Crear contenido con IA</h1>
          <p className="sub">
            La plataforma redacta el prompt a partir de tu propiedad y la plantilla elegida.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate("/plantillas")}>
            Ver plantillas →
          </button>
        </div>
      </div>

      <div className="studio-grid">
        {/* ── Columna izquierda: composición ─────────────────────────────── */}
        <div className="card card-pad">
          <div className="studio-mode">
            <div>
              <strong>Experiencia de creación</strong>
              <small>Escoge cuánta configuración quieres controlar.</small>
            </div>
            <div className="mode-switch">
              <button
                type="button"
                className={modo === "facil" ? "on" : ""}
                onClick={() => setModo("facil")}
              >
                Fácil
              </button>
              <button
                type="button"
                className={modo === "pro" ? "on" : ""}
                onClick={() => {
                  if (!promptPro) setPromptPro(promptGenerado);
                  setModo("pro");
                }}
              >
                Pro
              </button>
            </div>
          </div>

          <h2 style={{ marginBottom: 17 }}>Configura tu creativo</h2>

          <div className="field">
            <label>Propiedad</label>
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
            <label>Tipo de contenido</label>
            <div className="tabset">
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
            <label>Plantilla inmobiliaria</label>
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

          <div className="field-row">
            <div className="field">
              <label>Formato</label>
              <Select
                allowClear
                placeholder={modelo?.ratios?.length ? "Relación de aspecto" : "Sin formatos"}
                style={{ width: "100%" }}
                value={ratio}
                onChange={setRatio}
                disabled={!modelo?.ratios?.length}
                options={(modelo?.ratios ?? []).map((r) => ({
                  value: r,
                  label: RATIO_LABELS[r] ?? r,
                }))}
              />
            </div>

            <div className="field">
              <label>Duración (video)</label>
              <Select
                placeholder={`${modelo?.duracion_min_s ?? 5}–${modelo?.duracion_max_s ?? 12} s`}
                style={{ width: "100%" }}
                value={duration}
                onChange={setDuration}
                disabled={media !== "video" || duracionesDisponibles.length === 0}
                options={duracionesDisponibles.map((value) => ({
                  value,
                  label: `${value} segundos`,
                }))}
              />
            </div>
          </div>

          <div className="field">
            <label>Enfoque comercial</label>
            <Select
              style={{ width: "100%" }}
              value={enfoque}
              onChange={setEnfoque}
              options={ENFOQUES.map((e) => ({ value: e.value, label: e.label }))}
            />
          </div>

          {modo === "pro" && (
            <div className="field">
              <label>Modelo de IA (catálogo vivo)</label>
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
                options={modelosFiltrados.map((m) => {
                  const precio = formatoPrecioModelo(m);
                  return {
                    value: m.model_id,
                    label: `${m.nombre} — ${m.quote_creditos} cr.${precio ? ` · ${precio}` : ""}`,
                  };
                })}
              />
            </div>
          )}

          <div className="field">
            <label>Imagen de referencia (opcional · solo en este dispositivo)</label>
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={handleReferencia}
            />
            <small className="file-note">
              {referencia
                ? `${referencia} — adjunta al prompt, no se envía a servidores.`
                : "Ningún archivo se envía a servidores en esta demo."}
            </small>
          </div>

          <div className="notice warning">
            En producción, el costo y las opciones se validarán con el modelo real de Higgsfield
            antes de generar.
          </div>

          {!saldoSuficiente && (
            <div className="notice warning" role="status" style={{ marginTop: 12 }}>
              Saldo insuficiente: esta generación requiere {creditosCotizados} créditos y tienes{" "}
              {saldo}.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleGenerar}
              disabled={!modelo || !saldoSuficiente || createGeneracion.isPending}
            >
              <RobotOutlined />
              {createGeneracion.isPending ? "Encolando..." : "Generar propuesta"}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleCopiarPrompt}>
              <CopyOutlined /> Copiar prompt
            </button>
          </div>
        </div>

        {/* ── Columna derecha: vista previa + prompt ────────────────────────── */}
        <div className="card card-pad">
          <h2 style={{ marginBottom: 14 }}>Vista previa del concepto</h2>

          <div className="studio-preview">
            <span className="demo-stamp">
              <span className="status-point" /> Vista conceptual — sin generación real
            </span>
            <div className="inner">
              <div className="symbol">
                {media === "video" ? <VideoCameraOutlined /> : <PictureOutlined />}
              </div>
              <strong>{plantilla?.nombre ?? "Una historia visual para tu inmueble"}</strong>
              <p>
                {propiedad?.nombre ?? "Selecciona una propiedad"} · {formatoPreview}
                {media === "video" ? ` · ${duracionPreview} s` : " · imagen"}. Esto es solamente
                la vista conceptual.
              </p>
            </div>
          </div>

          <div className="section-title badge-row">
            <h3>Prompt inteligente editable</h3>
            <span className="mini-badge grey">Previsualización</span>
          </div>

          {modo === "pro" ? (
            <Input.TextArea
              rows={5}
              maxLength={600}
              showCount
              value={promptPro}
              onChange={(e) => setPromptPro(e.target.value)}
              placeholder="Describe la escena: iluminación, ángulo, ambiente..."
              style={{
                width: "100%",
                background: "#f4f8f5",
                border: "1px solid #e4eee7",
                color: "#355848",
                fontSize: 12.5,
                lineHeight: 1.6,
                minHeight: 108,
                resize: "vertical",
              }}
            />
          ) : (
            <div className="promptbox">
              <div className="plabel">Prompt generado</div>
              {promptGenerado}
            </div>
          )}

          <div className="notice" style={{ marginTop: 14, marginBottom: 0 }}>
            La demo solamente construye prompts. No produce fotografías ni videos reales ni efectúa
            cargos: los precios mostrados son los de lista de Higgsfield (§09).
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
