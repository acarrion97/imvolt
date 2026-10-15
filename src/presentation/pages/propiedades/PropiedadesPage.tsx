import { useMemo, useState } from "react";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import {
  EstadoPropiedadTag,
  formatPrecio,
  formatFecha,
} from "@/presentation/components/common/status";
import {
  useCreatePropiedad,
  useDeletePropiedad,
  usePropiedades,
  useProyectos,
  useUpdatePropiedad,
} from "@/presentation/hooks";
import { propiedadSchema } from "@/presentation/validations";
import type { Propiedad, PropiedadCategoria } from "@/domain/propiedad";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const CATEGORIA_LABELS: Record<PropiedadCategoria, string> = {
  lote: "Lote",
  casa: "Casa",
  departamento: "Departamento",
  oficina: "Oficina",
  local: "Local",
  proyecto: "Proyecto",
};

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

export function PropiedadesPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
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
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Sin proyecto");
  }, [proyectos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (propiedades ?? []).filter((p) => {
      if (filtroProyecto && p.project_id !== filtroProyecto) return false;
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.titulo_publicacion ?? "").toLowerCase().includes(q) ||
        (p.ciudad ?? "").toLowerCase().includes(q)
      );
    });
  }, [propiedades, search, filtroProyecto, filtroEstado]);

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

  const handleDelete = async (id: string) => {
    try {
      await deletePropiedad.mutateAsync(id);
      message.success("Propiedad eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const columns: ColumnsType<Propiedad> = [
    {
      title: "Propiedad",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <Text strong>{nombre}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {CATEGORIA_LABELS[row.categoria]} · {proyectoNombre(row.project_id)}
          </Text>
        </div>
      ),
    },
    {
      title: "Precio",
      dataIndex: "precio",
      key: "precio",
      width: 130,
      render: (precio: number | null, row) => formatPrecio(precio, row.moneda),
    },
    {
      title: "Ubicación",
      key: "ubicacion",
      width: 150,
      render: (_, row) => row.ciudad ?? "—",
    },
    {
      title: "Render IA",
      key: "render",
      width: 110,
      render: (_, row) =>
        row.tiene_render_conceptual ? (
          <Text type="warning" style={{ fontSize: 12 }}>
            Conceptual
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Real
          </Text>
        ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 125,
      render: (estado: Propiedad["estado"]) => <EstadoPropiedadTag estado={estado} />,
    },
    {
      title: "Creado",
      dataIndex: "created_at",
      key: "created_at",
      width: 125,
      render: (v: string) => formatFecha(v),
    },
    {
      title: "",
      key: "acciones",
      width: 110,
      render: (_, row) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title="¿Eliminar esta propiedad?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.property_id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageToolbar
        title="Propiedades"
        subtitle="Inventario comercial: lotes, casas, departamentos y más."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por nombre, título o ciudad..." }}
        extra={
          <Space wrap>
            <Select
              allowClear
              showSearch
              placeholder="Proyecto"
              style={{ width: 200 }}
              optionFilterProp="label"
              value={filtroProyecto}
              onChange={setFiltroProyecto}
              options={(proyectos ?? []).map((p) => ({ value: p.project_id, label: p.nombre }))}
            />
            <Select
              allowClear
              placeholder="Estado"
              style={{ width: 150 }}
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={Object.values(["disponible", "reservada", "vendida", "no_disponible"] as const).map(
                (v) => ({ value: v, label: v.replace(/_/g, " ") }),
              )}
            />
          </Space>
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nueva propiedad
          </Button>
        }
      />

      <DataTable<Propiedad>
        columns={columns}
        dataSource={filtered}
        rowKey="property_id"
        loading={isLoading}
      />

      <Drawer
        title={editing ? "Editar propiedad" : "Nueva propiedad"}
        width={560}
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

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item
              name="categoria"
              label="Categoría"
              rules={[{ required: true, message: "Selecciona la categoría." }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Categoría"
                options={Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="project_id" label="Proyecto" style={{ flex: 1 }}>
              <Select
                allowClear
                placeholder="Sin proyecto"
                options={(proyectos ?? []).map((p) => ({ value: p.project_id, label: p.nombre }))}
              />
            </Form.Item>
          </Space>

          <Form.Item name="titulo_publicacion" label="Título de publicación">
            <Input placeholder="Título que verá el cliente" maxLength={150} />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="precio" label="Precio" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="USD" />
            </Form.Item>
            <Form.Item name="superficie_m2" label="Superficie (m²)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="habitaciones" label="Habitaciones" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="banos" label="Baños" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="estacionamientos" label="Estac." style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="direccion" label="Dirección" style={{ flex: 2 }}>
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="ciudad" label="Ciudad" style={{ flex: 1 }}>
              <Input maxLength={100} />
            </Form.Item>
          </Space>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="pais" label="País" initialValue="Ecuador" style={{ flex: 1 }}>
              <Input maxLength={60} />
            </Form.Item>
            {editing && (
              <Form.Item name="estado" label="Estado" style={{ flex: 1 }}>
                <Select
                  options={(["disponible", "reservada", "vendida", "no_disponible"] as const).map((v) => ({
                    value: v,
                    label: v.replace(/_/g, " "),
                  }))}
                />
              </Form.Item>
            )}
          </Space>

          <Form.Item
            name="tiene_render_conceptual"
            label="Contiene render conceptual (IA)"
            valuePropName="checked"
            tooltip="§07 fidelidad de contenido: los renders generados con IA deben etiquetarse siempre."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
