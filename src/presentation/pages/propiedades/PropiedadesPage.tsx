import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Spin } from "antd";
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  badgeDeEstado,
  CATEGORIA_LABEL,
  MEDIOS_LABEL,
  artVariant,
} from "@/presentation/components/common/propiedadArt";
import { formatPrecio } from "@/presentation/components/common/status";
import { useAuth } from "@/presentation/auth/AuthProvider";
import {
  useCreatePropiedad,
  useDeletePropiedad,
  usePropiedades,
  useProyectos,
  useTiposPropiedad,
  useUpdatePropiedad,
} from "@/presentation/hooks";
import { propiedadSchema } from "@/presentation/validations";
import {
  categoriaDe,
  MEDIOS_AUTORIZADOS,
  type MedioAutorizado,
  type Propiedad,
  type PropiedadCategoria,
  type PropiedadDisponibilidad,
} from "@/domain/propiedad";

interface FormValues {
  nombre: string;
  tipo_propiedad_id: string;
  proyecto_id?: string | null;
  ubicacion: string;
  precio: number;
  disponibilidad: PropiedadDisponibilidad;
  medios_autorizados: MedioAutorizado[];
  descripcion: string;
}

/**
 * Mis propiedades — CRUD completo contra `/api/v1/propiedades`:
 * nombre, categoría (`tipos-propiedad`), ubicación, precio, disponibilidad
 * y medios (canales) de publicación autorizados.
 *
 * Rejilla de tarjetas con ilustración, filtros por categoría / disponibilidad
 * / medio autorizado y alta-edición en Drawer.
 */
export function PropiedadesPage() {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<PropiedadCategoria | undefined>();
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<
    PropiedadDisponibilidad | undefined
  >();
  const [filtroMedio, setFiltroMedio] = useState<MedioAutorizado | undefined>();
  const [editing, setEditing] = useState<Propiedad | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  /** UX de mínimo privilegio: el API sigue siendo la autoridad (403). */
  const { tienePermiso } = useAuth();
  const puedeGestionar = tienePermiso("gestionar_propiedades");

  const { data: propiedades, isLoading } = usePropiedades();
  const { data: tipos } = useTiposPropiedad();
  const { data: proyectos } = useProyectos();
  const createPropiedad = useCreatePropiedad();
  const updatePropiedad = useUpdatePropiedad();
  const deletePropiedad = useDeletePropiedad();
  const saving = createPropiedad.isPending || updatePropiedad.isPending;

  /** Categorías visibles: derivadas del catálogo que devuelve la API. */
  const categoriaOptions = useMemo(() => {
    const map = new Map<PropiedadCategoria, string>();
    for (const tipo of tipos ?? []) {
      const cat = categoriaDe({ tipo_propiedad: tipo });
      if (!map.has(cat)) map.set(cat, CATEGORIA_LABEL[cat]);
    }
    return [...map].map(([value, label]) => ({ value, label }));
  }, [tipos]);

  const medioOptions = useMemo(
    () => MEDIOS_AUTORIZADOS.map((value) => ({ value, label: MEDIOS_LABEL[value] })),
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (propiedades ?? []).filter((p) => {
      const medios = p.medios_autorizados ?? [];
      if (filtroCategoria && categoriaDe(p) !== filtroCategoria) return false;
      if (filtroDisponibilidad && p.disponibilidad !== filtroDisponibilidad) return false;
      if (filtroMedio && !medios.includes(filtroMedio)) return false;
      if (!q) return true;
      return p.nombre.toLowerCase().includes(q) || p.ubicacion.toLowerCase().includes(q);
    });
  }, [propiedades, search, filtroCategoria, filtroDisponibilidad, filtroMedio]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ disponibilidad: "disponible", medios_autorizados: [] });
    setDrawerOpen(true);
  };

  const openEdit = (row: Propiedad) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      tipo_propiedad_id: String(row.tipo_propiedad_id),
      proyecto_id: row.proyecto_id ? String(row.proyecto_id) : null,
      ubicacion: row.ubicacion,
      precio: Number(row.precio),
      disponibilidad: row.disponibilidad,
      medios_autorizados: row.medios_autorizados ?? [],
      descripcion: row.descripcion,
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

    try {
      if (editing) {
        await updatePropiedad.mutateAsync({
          id: editing.propiedad_id,
          data: { ...parsed.data, proyecto_id: parsed.data.proyecto_id ?? null },
        });
        message.success("Propiedad actualizada.");
      } else {
        await createPropiedad.mutateAsync({ ...parsed.data, proyecto_id: parsed.data.proyecto_id ?? null });
        message.success("Propiedad creada.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la propiedad.");
    }
  };

  const handleDelete = (row: Propiedad) => {
    modal.confirm({
      title: "¿Eliminar esta propiedad?",
      content: `${row.nombre} se quitará del catálogo. Las campañas y leads asociados conservarán su referencia.`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await deletePropiedad.mutateAsync(row.propiedad_id);
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
          <p className="eyebrow">Catálogo inmobiliario</p>
          <h1>Mis propiedades</h1>
          <p className="sub">
            Unidades del workspace listas para crear creativos y preparar campañas.
          </p>
        </div>
        <div className="header-actions">
          {puedeGestionar && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusOutlined /> Nueva propiedad
            </button>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar por nombre o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Categoría"
            style={{ width: 170 }}
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={categoriaOptions}
          />
          <Select
            allowClear
            placeholder="Disponibilidad"
            style={{ width: 170 }}
            value={filtroDisponibilidad}
            onChange={setFiltroDisponibilidad}
            options={(["disponible", "reservada", "vendida", "no_disponible"] as const).map(
              (v) => ({ value: v, label: v.replace(/_/g, " ") }),
            )}
          />
          <Select
            allowClear
            placeholder="Medio autorizado"
            style={{ width: 190 }}
            value={filtroMedio}
            onChange={setFiltroMedio}
            options={medioOptions}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} propiedades</span>
        </div>
      </div>

      <Spin spinning={isLoading}>
        <div className="grid cols3">
          {filtered.map((p) => {
            const badge = badgeDeEstado(p.disponibilidad);
            const categoria = categoriaDe(p);
            const medios = p.medios_autorizados ?? [];

            return (
              <div key={p.propiedad_id} className="card item-card">
                <div className={`art ${artVariant(categoria)}`}>
                  <span className="tag">{CATEGORIA_LABEL[categoria]}</span>
                  {puedeGestionar && (
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
                      <button
                        type="button"
                        style={iconBtn}
                        onClick={() => openEdit(p)}
                        title="Editar"
                      >
                        <EditOutlined style={{ fontSize: 13 }} />
                      </button>
                      <Popconfirm
                        title="¿Eliminar esta propiedad?"
                        okText="Eliminar"
                        cancelText="Cancelar"
                        onConfirm={() => handleDelete(p)}
                      >
                        <button type="button" style={iconBtn} title="Eliminar">
                          <DeleteOutlined style={{ fontSize: 13 }} />
                        </button>
                      </Popconfirm>
                    </div>
                  )}
                </div>

                <div className="item-meta">
                  <h3>{p.nombre}</h3>
                  <span className="where">
                    {p.ubicacion}
                    {p.proyecto ? ` · ${p.proyecto.nombre}` : ""}
                  </span>
                  <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                    <span className={badge.cls}>{badge.label}</span>
                    {medios.length === 0 && (
                      <span className="mini-badge grey">Sin canales autorizados</span>
                    )}
                    {medios.slice(0, 2).map((medio) => (
                      <span key={medio} className="mini-badge grey">
                        {MEDIOS_LABEL[medio]}
                      </span>
                    ))}
                    {medios.length > 2 && (
                      <span className="mini-badge grey">+{medios.length - 2}</span>
                    )}
                  </div>
                </div>

                <div className="item-bottom">
                  <span className="price">{formatPrecio(p.precio)}</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "8px 13px", fontSize: 11 }}
                    onClick={() => navigate("/estudio", { state: { propertyId: p.propiedad_id } })}
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
                  : "Aún no has registrado propiedades."}
              </p>
              <div style={{ marginTop: 14 }}>
                {puedeGestionar && (
                  <button type="button" className="btn btn-primary" onClick={openCreate}>
                    <PlusOutlined /> Nueva propiedad
                  </button>
                )}
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
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre de la propiedad." }]}
          >
            <Input placeholder="Ej: Lote 12-A Vista Hermosa" maxLength={50} showCount />
          </Form.Item>

          <div className="form-grid">
            <Form.Item
              name="tipo_propiedad_id"
              label="Categoría"
              rules={[{ required: true, message: "Selecciona la categoría." }]}
            >
              <Select
                placeholder="Categoría"
                showSearch
                optionFilterProp="label"
                options={(tipos ?? []).map((t) => ({
                  value: String(t.tipo_propiedad_id),
                  label: t.nombre,
                }))}
              />
            </Form.Item>
            <Form.Item name="proyecto_id" label="Proyecto">
              <Select
                allowClear
                placeholder="Individual (sin proyecto)"
                showSearch
                optionFilterProp="label"
                options={(proyectos ?? []).map((p) => ({
                  value: String(p.proyecto_id),
                  label: p.nombre,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="disponibilidad"
              label="Disponibilidad"
              rules={[{ required: true, message: "Selecciona la disponibilidad." }]}
            >
              <Select
                options={(["disponible", "reservada", "vendida", "no_disponible"] as const).map(
                  (v) => ({ value: v, label: v.replace(/_/g, " ") }),
                )}
              />
            </Form.Item>

            <Form.Item
              name="ubicacion"
              label="Ubicación"
              className="full"
              rules={[{ required: true, message: "Indica la ubicación." }]}
            >
              <Input placeholder="Dirección o referencia del inmueble" maxLength={500} showCount />
            </Form.Item>

            <Form.Item
              name="precio"
              label="Precio (USD)"
              rules={[{ required: true, message: "Indica el precio." }]}
            >
              <InputNumber min={0.01} precision={2} style={{ width: "100%" }} placeholder="USD" />
            </Form.Item>
          </div>

          <Form.Item
            name="medios_autorizados"
            label="Medios autorizados"
            tooltip="Canales donde la empresa está autorizada a publicar esta propiedad (§ publicidad)."
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Selecciona los canales autorizados"
              options={medioOptions}
            />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "La descripción es obligatoria." }]}
          >
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
