import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Spin,
  Switch,
} from "antd";
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  badgeDeEstado,
  CATEGORIA_LABEL,
  artVariant,
} from "@/presentation/components/common/propiedadArt";
import { formatPrecio } from "@/presentation/components/common/status";
import {
  useCreatePropiedad,
  useDeletePropiedad,
  usePropiedades,
  useProyectos,
  useUpdatePropiedad,
} from "@/presentation/hooks";
import { propiedadSchema } from "@/presentation/validations";
import type { Propiedad, PropiedadCategoria } from "@/domain/propiedad";

interface FormValues {
  nombre: string;
  categoria: PropiedadCategoria;
  project_id?: string | null;
  titulo_publicacion?: string | null;
  descripcion?: string | null;
  precio?: number | null;
  superficie_m2?: number | null;
  habitaciones?: number | null;
  banos?: number | null;
  estacionamientos?: number | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string;
  estado?: Propiedad["estado"];
  tiene_render_conceptual?: boolean;
}

/**
 * Mis propiedades â€” UI Concept 01: rejilla de tarjetas con ilustraciÃ³n,
 * filtros por tipo/proyecto/estado y alta en Drawer.
 */
export function PropiedadesPage() {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<PropiedadCategoria | undefined>();
  const [filtroProyecto, setFiltroProyecto] = useState<string | undefined>();
  const [filtroEstado, setFiltroEstado] = useState<Propiedad["estado"] | undefined>();
  const [editing, setEditing] = useState<Propiedad | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: propiedades, isLoading } = usePropiedades();
  const { data: proyectos } = useProyectos();
  const createPropiedad = useCreatePropiedad();
  const updatePropiedad = useUpdatePropiedad();
  const deletePropiedad = useDeletePropiedad();
  const saving = createPropiedad.isPending || updatePropiedad.isPending;

  const proyectoNombre = useMemo(() => {
    const map = new Map((proyectos ?? []).map((p) => [p.project_id, p.nombre]));
    return (id: string | null) => (id ? (map.get(id) ?? "â€”") : "Sin proyecto");
  }, [proyectos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (propiedades ?? []).filter((p) => {
      if (filtroCategoria && p.categoria !== filtroCategoria) return false;
      if (filtroProyecto && p.project_id !== filtroProyecto) return false;
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.titulo_publicacion ?? "").toLowerCase().includes(q) ||
        (p.ciudad ?? "").toLowerCase().includes(q)
      );
    });
  }, [propiedades, search, filtroCategoria, filtroProyecto, filtroEstado]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ pais: "Ecuador", tiene_render_conceptual: false });
    setDrawerOpen(true);
  };

  const openEdit = (row: Propiedad) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      categoria: row.categoria,
      project_id: row.project_id,
      titulo_publicacion: row.titulo_publicacion,
      descripcion: row.descripcion,
      precio: row.precio,
      superficie_m2: row.superficie_m2,
      habitaciones: row.habitaciones,
      banos: row.banos,
      estacionamientos: row.estacionamientos,
      direccion: row.direccion,
      ciudad: row.ciudad,
      pais: row.pais,
      estado: row.estado,
      tiene_render_conceptual: row.tiene_render_conceptual,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = propiedadSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      ...parsed.data,
      project_id: parsed.data.project_id ?? null,
      titulo_publicacion: parsed.data.titulo_publicacion ?? null,
      descripcion: parsed.data.descripcion ?? null,
      precio: parsed.data.precio ?? null,
      superficie_m2: parsed.data.superficie_m2 ?? null,
      habitaciones: parsed.data.habitaciones ?? null,
      banos: parsed.data.banos ?? null,
      estacionamientos: parsed.data.estacionamientos ?? null,
      direccion: parsed.data.direccion ?? null,
      ciudad: parsed.data.ciudad ?? null,
      pais: parsed.data.pais ?? "Ecuador",
      moneda: "USD",
      estado: parsed.data.estado ?? ("disponible" as const),
      tiene_render_conceptual: parsed.data.tiene_render_conceptual ?? false,
    };

    try {
      if (editing) {
        await updatePropiedad.mutateAsync({ id: editing.property_id, data: payload });
        message.success("Propiedad actualizada.");
      } else {
        await createPropiedad.mutateAsync(payload);
        message.success("Propiedad creada.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la propiedad.");
    }
  };

  const handleDelete = (row: Propiedad) => {
    modal.confirm({
      title: "Â¿Eliminar esta propiedad?",
      content: `${row.nombre} se quitarÃ¡ del catÃ¡logo. Las campaÃ±as y leads asociados conservarÃ¡n su referencia.`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deletePropiedad.mutateAsync(row.property_id);
          message.success("Propiedad eliminada.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
        }
      },
    });
  };

  const iconBtn: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 99,
    border: 0,
    background: "rgba(255,255,255,.91)",
    color: "#1c4e32",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 3px 14px rgba(13,38,18,.16)",
  };

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">CatÃ¡logo inmobiliario</p>
          <h1>Mis propiedades</h1>
          <p className="sub">
            Unidades del workspace listas para crear creativos y preparar campaÃ±as.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/proyectos" className="btn btn-outline">
            <FolderOpenOutlined /> Gestionar proyectos
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nueva propiedad
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar por nombre, tÃ­tulo o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Tipo"
            style={{ width: 170 }}
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select
            allowClear
            showSearch
            placeholder="Proyecto"
            style={{ width: 190 }}
            optionFilterProp="label"
            value={filtroProyecto}
            onChange={setFiltroProyecto}
            options={(proyectos ?? []).map((p) => ({ value: p.project_id, label: p.nombre }))}
          />
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 160 }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={(["disponible", "reservada", "vendida", "no_disponible"] as const).map((v) => ({
              value: v,
              label: v.replace(/_/g, " "),
            }))}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} propiedades</span>
        </div>
      </div>

      <Spin spinning={isLoading}>
        <div className="grid cols3">
          {filtered.map((p) => {
            const badge = badgeDeEstado(p.estado);
            return (
              <div key={p.property_id} className="card item-card">
                <div className={`art ${artVariant(p.categoria)}`}>
                  <span className="tag">{CATEGORIA_LABEL[p.categoria]}</span>
                  <div
                    style={{
                      position: "absolute",
                      top: 11,
                      right: 11,
                      zIndex: 2,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <button type="button" style={iconBtn} onClick={() => openEdit(p)} title="Editar">
                      <EditOutlined style={{ fontSize: 13 }} />
                    </button>
                    <Popconfirm
                      title="Â¿Eliminar esta propiedad?"
                      okText="Eliminar"
                      cancelText="Cancelar"
                      onConfirm={() => handleDelete(p)}
                    >
                      <button type="button" style={iconBtn} title="Eliminar">
                        <DeleteOutlined style={{ fontSize: 13 }} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                <div className="item-meta">
                  <h3>{p.nombre}</h3>
                  <span className="where">
                    {p.ciudad ?? "Sin ciudad"} Â· {proyectoNombre(p.project_id)}
                  </span>
                  <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                    <span className={badge.cls}>{badge.label}</span>
                    {p.tiene_render_conceptual && (
                      <span className="mini-badge warn">Render IA</span>
                    )}
                  </div>
                </div>

                <div className="item-bottom">
                  <span className="price">{formatPrecio(p.precio, p.moneda)}</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "8px 13px", fontSize: 11 }}
                    onClick={() => navigate("/estudio", { state: { propertyId: p.property_id } })}
                  >
                    Crear <ArrowRightOutlined />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !isLoading && (
            <div className="card card-pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              <p className="sub">
                {propiedades?.length
                  ? "Ninguna propiedad coincide con los filtros."
                  : "AÃºn no has registrado propiedades."}
              </p>
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                  <PlusOutlined /> Nueva propiedad
                </button>
              </div>
            </div>
          )}
        </div>
      </Spin>

      <Drawer
        title={editing ? "Editar propiedad" : "Nueva propiedad"}
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
            label="Nombre interno"
            rules={[{ required: true, message: "Indica el nombre de la propiedad." }]}
          >
            <Input placeholder="Ej: Lote 12-A Vista Hermosa" maxLength={120} />
          </Form.Item>

          <div className="form-grid">
            <Form.Item
              name="categoria"
              label="CategorÃ­a"
              rules={[{ required: true, message: "Selecciona la categorÃ­a." }]}
            >
              <Select
                placeholder="CategorÃ­a"
                options={Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item name="project_id" label="Proyecto">
              <Select
                allowClear
                placeholder="Sin proyecto"
                options={(proyectos ?? []).map((p) => ({ value: p.project_id, label: p.nombre }))}
              />
            </Form.Item>

            <Form.Item name="titulo_publicacion" label="TÃ­tulo de publicaciÃ³n" className="full">
              <Input placeholder="TÃ­tulo que verÃ¡ el cliente" maxLength={150} />
            </Form.Item>

            <Form.Item name="precio" label="Precio (USD)">
              <InputNumber min={0} style={{ width: "100%" }} placeholder="USD" />
            </Form.Item>
            <Form.Item name="superficie_m2" label="Superficie (mÂ²)">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="habitaciones" label="Habitaciones">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="banos" label="BaÃ±os">
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="direccion" label="DirecciÃ³n">
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="ciudad" label="Ciudad">
              <Input maxLength={100} />
            </Form.Item>

            <Form.Item name="pais" label="PaÃ­s" initialValue="Ecuador">
              <Input maxLength={60} />
            </Form.Item>
            {editing && (
              <Form.Item name="estado" label="Estado">
                <Select
                  options={(["disponible", "reservada", "vendida", "no_disponible"] as const).map(
                    (v) => ({ value: v, label: v.replace(/_/g, " ") }),
                  )}
                />
              </Form.Item>
            )}
          </div>

          <Form.Item name="descripcion" label="DescripciÃ³n">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>

          <Form.Item
            name="tiene_render_conceptual"
            label="Contiene render conceptual (IA)"
            valuePropName="checked"
            tooltip="Â§07 fidelidad de contenido: los renders generados con IA deben etiquetarse siempre."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
