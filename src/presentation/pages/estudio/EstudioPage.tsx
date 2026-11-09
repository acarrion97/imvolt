import { useMemo, useRef, useState } from "react";
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
  useQuoteGeneracion,
} from "@/presentation/hooks";
import type { Generacion } from "@/domain/generacion";
import type { Modelo } from "@/domain/modelo";
import type { ColumnsType } from "antd/es/table";
import { CrearAnuncioMetaModal } from "./CrearAnuncioMetaModal";

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
  if (!tienePrecioConfigurado(modelo)) return null;
  const unidad = modelo.precio_unidad === "segundo" ? "/ segundo" : "/ imagen";
  const desde = modelo.capabilities?.precio_desde === true ? "desde " : "";
  return `${desde}${formatPrecioUSD(modelo.precio_usd)} ${unidad}`;
}

function tienePrecioConfigurado(
  modelo: Modelo | undefined,
): modelo is Modelo & { precio_usd: number; precio_unidad: "imagen" | "segundo" } {
  return Boolean(
    modelo &&
      modelo.precio_usd != null &&
      modelo.precio_usd > 0 &&
      ((modelo.media_type === "image" && modelo.precio_unidad === "imagen") ||
        (modelo.media_type === "video" && modelo.precio_unidad === "segundo")),
  );
}

function formatPrecioUSD(value: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function calcularPrecioGeneracion(modelo: Modelo | undefined, duration: number): number | null {
  if (!tienePrecioConfigurado(modelo)) return null;
  if (modelo.media_type === "image" && modelo.precio_unidad === "imagen") {
    return modelo.precio_usd;
  }
  if (modelo.media_type === "video" && modelo.precio_unidad === "segundo") {
    return Number((modelo.precio_usd * duration).toFixed(4));
  }
  return null;
}

export function EstudioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { data: plantillas, isLoading: loadingPlantillas } = usePlantillas();
  const { data: modelos } = useModelos();
  const { data: propiedades } = usePropiedades();
  const { data: generaciones, isLoading: loadingGeneraciones } = useGeneraciones();
  const createGeneracion = useCreateGeneracion();
  const quoteGeneracion = useQuoteGeneracion();
  const generationConfirmationOpen = useRef(false);

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
  const [generacionParaAnuncio, setGeneracionParaAnuncio] = useState<Generacion | null>(null);

  const modelosFiltrados = useMemo(
    () =>
      (modelos ?? []).filter((m) => m.media_type === media && m.status === "activo"),
    [modelos, media],
  );

  const modelosConPrecio = modelosFiltrados.filter(
    tienePrecioConfigurado,
  );
  const selectedModelId = modelosConPrecio.some((m) => m.model_id === modelId)
    ? modelId
    : modelosConPrecio[0]?.model_id;

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
    () => modelosConPrecio.find((m) => m.model_id === selectedModelId),
    [modelosConPrecio, selectedModelId],
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

  const precioEstimado = calcularPrecioGeneracion(
    modelo,
    duration ?? modelo?.duracion_min_s ?? 5,
  );
  const plantillasDeMedio = (plantillas ?? []).filter(
    (p) => p.estado === "activo",
  );

  const formatoPreview = ratio ?? modelo?.ratios?.[0] ?? "Formato adaptable";
  const duracionPreview = duration ?? modelo?.duracion_min_s ?? 5;

  const handleGenerar = async () => {
    if (generationConfirmationOpen.current) return;
    if (!modelo) {
      message.error("Selecciona un modelo disponible para este medio.");
      return;
    }
    if (!promptActual) {
      message.error("Escribe o genera un prompt antes de crear la generación.");
      return;
    }
    const parametros: Record<string, unknown> = {};
    if (duration) parametros.duration = duration;
    if (ratio) parametros.ratio = ratio;

    generationConfirmationOpen.current = true;
    try {
      const quote = await quoteGeneracion.mutateAsync({
        model_id: modelo.model_id,
        parametros,
      });

      const idempotencyKey = crypto.randomUUID();
      modal.confirm({
        title: "Confirmar generación",
        content: `El precio estimado para ${modelo.nombre} es ${formatPrecioUSD(quote.price_usd)} antes de impuestos. El importe se calcula con la tarifa configurada por generación.`,
        okText: "Confirmar generación",
        cancelText: "Cancelar",
        onCancel: () => {
          generationConfirmationOpen.current = false;
        },
        onOk: async () => {
          try {
            await createGeneracion.mutateAsync({
              property_id: propertyId ?? null,
              template_id: templateId ?? null,
              model_id: modelo.model_id,
              idempotency_key: idempotencyKey,
              quoted_price_usd: quote.price_usd,
              modo,
              prompt: promptActual,
              parametros,
            });
            message.success("Generación encolada.");
          } catch (error) {
            message.error(error instanceof Error ? error.message : "No se pudo crear la generación.");
          } finally {
            generationConfirmationOpen.current = false;
          }
        },
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo crear la generación.");
      generationConfirmationOpen.current = false;
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
      title: "Precio",
      dataIndex: "price_usd",
      key: "price_usd",
      width: 130,
      render: (value: number | null) => value == null ? "—" : formatPrecioUSD(value),
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: Generacion["status"]) => <EstadoGeneracionTag status={status} />,
    },
    {
      title: "Anuncio",
      key: "meta_ad",
      width: 170,
      render: (_: unknown, row) =>
        row.provider_request_id && !["failed", "canceled"].includes(row.status) ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setGeneracionParaAnuncio(row)}
          >
            Crear anuncio Meta
          </button>
        ) : null,
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
                    label: `${m.nombre} — ${precio ?? "precio por generación no configurado"}`,
                    disabled: precio === null,
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

          {modelosFiltrados.length > 0 && !modelosConPrecio.length && (
            <div className="notice warning" role="status">
              No hay modelos con precio por generación configurado para este tipo de contenido.
            </div>
          )}
          {precioEstimado !== null && (
            <div className="notice" role="status">
              Precio estimado: {formatPrecioUSD(precioEstimado)} antes de impuestos. Videos
              adicionales y modelos premium se cotizan por generación.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleGenerar}
              disabled={!modelo || precioEstimado === null || quoteGeneracion.isPending || createGeneracion.isPending}
            >
              <RobotOutlined />
              {quoteGeneracion.isPending
                ? "Cotizando..."
                : createGeneracion.isPending
                  ? "Encolando..."
                  : "Generar propuesta"}
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
      <CrearAnuncioMetaModal
        key={generacionParaAnuncio?.generation_id ?? "closed"}
        generation={generacionParaAnuncio}
        onClose={() => setGeneracionParaAnuncio(null)}
      />
    </div>
  );
}
