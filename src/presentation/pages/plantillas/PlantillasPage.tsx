import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Spin,
  Switch,
} from "antd";
import { ArrowRightOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import type {
  Plantilla,
  PlantillaCategoria,
  PlantillaFormato,
  PlantillaObjetivo,
} from "@/domain/plantilla";
import {
  useCreatePlantilla,
  useDeletePlantilla,
  usePlantillas,
  useTiposPlantilla,
  useUpdatePlantilla,
} from "@/presentation/hooks";
import { plantillaSchema } from "@/presentation/validations";

const CATEGORIA_LABELS: Record<PlantillaCategoria, string> = {
  lotizaciones: "Lotizaciones",
  casas: "Casas",
  departamentos: "Departamentos",
  proyecto_planos: "Planos",
  publicidad_comercial: "Publicidad comercial",
  marca_inmobiliaria: "Marca inmobiliaria",
};

const CATEGORIA_EMOJI: Record<PlantillaCategoria, string> = {
  lotizaciones: "ðŸ—ºï¸",
  casas: "ðŸ¡",
  departamentos: "ðŸ¢",
  proyecto_planos: "ðŸ“",
  publicidad_comercial: "ðŸ›ï¸",
  marca_inmobiliaria: "âœ¨",
};

const OBJETIVO_LABELS: Record<PlantillaObjetivo, string> = {
  visitas: "Visitas",
  mensajes: "Mensajes",
  formularios: "Formularios",
  branding: "Branding",
};

const FORMATO_LABELS: Record<PlantillaFormato, string> = {
  reels_9_16: "Reels 9:16",
  imagen_4_5: "Imagen 4:5",
  feed_1_1: "Feed 1:1",
  banner_16_9: "Banner 16:9",
};

interface FormValues {
  nombre: string;
  categoria: PlantillaCategoria;
  tipo_plantilla_id: string;
  objetivo: PlantillaObjetivo;
  media_type: "image" | "video";
  formato: PlantillaFormato;
  prompt_base: string;
  estructura_narrativa?: string | null;
  movimiento_camara?: string | null;
  estilo_visual?: string | null;
  requiere_referencia_original?: boolean;
}

/**
 * Plantillas â€” UI Concept 01: filtro por pestaÃ±as de categorÃ­a y rejilla de
 * tarjetas con icono, descripciÃ³n narrativa y acceso directo al Estudio IA.
 */
export function PlantillasPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState<PlantillaCategoria | "todas">("todas");
  const { data: tipos_plantillas } = useTiposPlantilla();

  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: plantillas, isLoading } = usePlantillas();
  const createPlantilla = useCreatePlantilla();
  const updatePlantilla = useUpdatePlantilla();
  const deletePlantilla = useDeletePlantilla();
  const saving = createPlantilla.isPending || updatePlantilla.isPending;
  const tiposPlantillaOptions = (tipos_plantillas ?? [])
    .filter((tipo) => /^\d+$/.test(tipo.tipo_plantilla_id ?? ""))
    .map((tipo) => ({
      value: String(tipo.tipo_plantilla_id),
      label: tipo.nombre,
    }));

  const filtered = useMemo(
    () =>
      (plantillas ?? []).filter(
        (p) => categoria === "todas" || p.categoria === categoria,
      ),
    [plantillas, categoria],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ media_type: "video", requiere_referencia_original: false });
    setDrawerOpen(true);
  };

  const openEdit = (row: Plantilla) => {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      nombre: row.nombre,
      categoria: row.categoria,
      tipo_plantilla_id: String(row.tipo_plantilla_id ?? ""),
      objetivo: row.objetivo,
      media_type: row.media_type,
      formato: row.formato,
      prompt_base: row.prompt_base,
      estructura_narrativa: row.estructura_narrativa ?? "",
      movimiento_camara: row.movimiento_camara ?? "",
      estilo_visual: row.estilo_visual ?? "",
      requiere_referencia_original: row.requiere_referencia_original ?? false,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = plantillaSchema.safeParse({
      ...values,
      tipo_plantilla_id: String(values.tipo_plantilla_id ?? ""),
    });
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      ...parsed.data,
      estructura_narrativa: parsed.data.estructura_narrativa ?? null,
      movimiento_camara: parsed.data.movimiento_camara ?? null,
      estilo_visual: parsed.data.estilo_visual ?? null,
      requiere_referencia_original: parsed.data.requiere_referencia_original ?? false,
    };

    try {
      if (editing) {
        if (!editing.template_id) {
          message.error("No se pudo identificar la plantilla que quieres actualizar.");
          return;
        }
        await updatePlantilla.mutateAsync({ id: editing.template_id, data: payload });
        message.success("Plantilla actualizada.");
      } else {
        await createPlantilla.mutateAsync(payload);
        message.success("Plantilla creada.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la plantilla.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlantilla.mutateAsync(id);
      message.success("Plantilla eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const iconBtn = {
    background: "transparent",
    border: 0,
    color: "#7d9187",
    cursor: "pointer",
    fontSize: 14,
    padding: 4,
  } as const;

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Creative AI</p>
          <h1>Plantillas inmobiliarias</h1>
          <p className="sub">
            Estructuras creativas del sistema: narrativa, cÃ¡mara y estilo visual por tipo de
            inmueble.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nueva plantilla
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${categoria === "todas" ? " active" : ""}`}
          onClick={() => setCategoria("todas")}
        >
          Todas ({plantillas?.length ?? 0})
        </button>
        {(Object.keys(CATEGORIA_LABELS) as PlantillaCategoria[]).map((cat) => {
          const n = (plantillas ?? []).filter((p) => p.categoria === cat).length;
          if (n === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              className={`tab${categoria === cat ? " active" : ""}`}
              onClick={() => setCategoria(cat)}
            >
              {CATEGORIA_LABELS[cat]} ({n})
            </button>
          );
        })}
      </div>

      <Spin spinning={isLoading}>
        <div className="grid cols3">
          {filtered.map((p) => (
            <div key={p.template_id} className="template-card">
              <div className="t-icon">{CATEGORIA_EMOJI[p.categoria] ?? "âœ¨"}</div>

              <div>
                <strong>{p.nombre}</strong>
                <p className="desc" style={{ marginTop: 4 }}>
                  {p.estructura_narrativa ?? p.prompt_base}
                </p>
              </div>

              <div className="meta">
                <span className="mini-badge grey">
                  {tipos_plantillas?.find(
                    (tipo) => String(tipo.tipo_plantilla_id) === String(p.tipo_plantilla_id),
                  )?.nombre ?? "Tipo sin definir"}
                </span>
                <span className="mini-badge">{OBJETIVO_LABELS[p.objetivo] ?? p.objetivo}</span>
                <span className="mini-badge grey">
                  {p.media_type === "video" ? "Video" : "Imagen"} Â·{" "}
                  {FORMATO_LABELS[p.formato] ?? p.formato}
                </span>
                {p.requiere_referencia_original && (
                  <span className="mini-badge warn">Requiere foto real</span>
                )}
              </div>

              <div className="foot">
                <span className="credits">{p.creditos_base} crÃ©ditos base</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" style={iconBtn} onClick={() => openEdit(p)} title="Editar">
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="Â¿Eliminar esta plantilla?"
                    okText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={() => handleDelete(p.template_id)}
                  >
                    <button type="button" style={iconBtn} title="Eliminar">
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "8px 13px", fontSize: 11 }}
                    onClick={() => navigate("/estudio", { state: { templateId: p.template_id } })}
                  >
                    Utilizar <ArrowRightOutlined />
                  </button>
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="card card-pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              <p className="sub">No hay plantillas en esta categorÃ­a.</p>
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                  <PlusOutlined /> Nueva plantilla
                </button>
              </div>
            </div>
          )}
        </div>
      </Spin>

      <Drawer
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Guardar
          </Button>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre de la plantilla." }]}
          >
            <Input placeholder="Ej: Reels Lote con Vista" maxLength={120} />
          </Form.Item>

          <div className="form-grid">
            <Form.Item name="categoria" label="CategorÃ­a" rules={[{ required: true }]}>
              <Select
                placeholder="CategorÃ­a"
                options={Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="tipo_plantilla_id"
              label="Tipo"
              rules={[{ required: true, message: "Selecciona el tipo." }]}
            >
              <Select
                placeholder="Tipo"
                showSearch
                optionFilterProp="label"
                options={tiposPlantillaOptions}
              />
            </Form.Item>
            <Form.Item name="objetivo" label="Objetivo" rules={[{ required: true }]}>
              <Select
                placeholder="Objetivo"
                options={Object.entries(OBJETIVO_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>

            <Form.Item name="media_type" label="Tipo de medio" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "image", label: "Imagen" },
                  { value: "video", label: "Video" },
                ]}
              />
            </Form.Item>
            <Form.Item name="formato" label="Formato" rules={[{ required: true }]}>
              <Select
                placeholder="Formato"
                options={Object.entries(FORMATO_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>

            <Form.Item name="estructura_narrativa" label="Estructura narrativa" className="full">
              <Input maxLength={300} placeholder="Gancho â†’ desarrollo â†’ llamado a la acciÃ³n" />
            </Form.Item>

            <Form.Item name="movimiento_camara" label="Movimiento de cÃ¡mara">
              <Input maxLength={200} placeholder="Travelling lateral lento" />
            </Form.Item>
            <Form.Item name="estilo_visual" label="Estilo visual">
              <Input maxLength={200} placeholder="Luz dorada, colores naturales" />
            </Form.Item>
          </div>

          <Form.Item
            name="prompt_base"
            label="Prompt base"
            rules={[{ required: true, message: "El prompt base es obligatorio." }]}
            tooltip="Usa {variable} para los campos dinÃ¡micos, p.ej. {precio}."
          >
            <Input.TextArea
              rows={3}
              maxLength={1000}
              showCount
              placeholder="Video vertical del lote en {ubicacion}, {precio}..."
            />
          </Form.Item>

          <Form.Item
            name="requiere_referencia_original"
            label="Requiere foto real de la propiedad"
            valuePropName="checked"
            tooltip="Si la plantilla parte de una fotografÃ­a real, marca esta opciÃ³n (fidelidad de contenido Â§07)."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
