import { useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, InputNumber, Select, Space, Popconfirm, Typography } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { EstadoProyectoTag, formatFecha } from "@/presentation/components/common/status";
import { useCreateProyecto, useDeleteProyecto, useProyectos, useUpdateProyecto } from "@/presentation/hooks";
import { proyectoSchema } from "@/presentation/validations";
import type { Proyecto, ProyectoTipo } from "@/domain/proyecto";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const TIPO_LABELS: Record<ProyectoTipo, string> = {
  lotizacion: "LotizaciÃ³n",
  urbanizacion: "UrbanizaciÃ³n",
  edificio: "Edificio",
  proyecto_planos: "Proyecto en planos",
  individual: "Individual",
};

interface FormValues {
  nombre: string;
  tipo: ProyectoTipo;
  descripcion?: string | null;
  ubicacion?: string | null;
  total_lotes?: number | null;
  estado?: "activo" | "pausado" | "terminado";
}

export function ProyectosPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: proyectos, isLoading } = useProyectos();
  const createProyecto = useCreateProyecto();
  const updateProyecto = useUpdateProyecto();
  const deleteProyecto = useDeleteProyecto();
  const saving = createProyecto.isPending || updateProyecto.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = proyectos ?? [];
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.ubicacion ?? "").toLowerCase().includes(q) ||
        p.tipo.toLowerCase().includes(q),
    );
  }, [proyectos, search]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (proyecto: Proyecto) => {
    setEditing(proyecto);
    form.setFieldsValue({
      nombre: proyecto.nombre,
      tipo: proyecto.tipo,
      descripcion: proyecto.descripcion,
      ubicacion: proyecto.ubicacion,
      total_lotes: proyecto.total_lotes,
      estado: proyecto.estado,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = proyectoSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    try {
      if (editing) {
        await updateProyecto.mutateAsync({ id: editing.project_id, data: parsed.data });
        message.success("Proyecto actualizado.");
      } else {
        await createProyecto.mutateAsync({
          nombre: parsed.data.nombre,
          tipo: parsed.data.tipo,
          descripcion: parsed.data.descripcion ?? null,
          ubicacion: parsed.data.ubicacion ?? null,
          total_lotes: parsed.data.total_lotes ?? null,
        });
        message.success("Proyecto creado.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProyecto.mutateAsync(id);
      message.success("Proyecto eliminado.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const columns: ColumnsType<Proyecto> = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <Text strong>{nombre}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.ubicacion ?? "Sin ubicaciÃ³n"}
          </Text>
        </div>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      render: (tipo: ProyectoTipo) => TIPO_LABELS[tipo],
    },
    {
      title: "Lotes",
      dataIndex: "total_lotes",
      key: "total_lotes",
      width: 90,
      render: (v: number | null) => v ?? "â€”",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 120,
      render: (estado: Proyecto["estado"]) => <EstadoProyectoTag estado={estado} />,
    },
    {
      title: "Creado",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
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
            title="Â¿Eliminar este proyecto?"
            description="Las propiedades asociadas quedarÃ¡n sin proyecto."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.project_id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">OperaciÃ³n</p>
          <h1>Proyectos</h1>
          <p className="sub">Lotizaciones, urbanizaciones y desarrollos de la organizaciÃ³n.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nuevo proyecto
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar por nombre o ubicaciÃ³n..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} proyectos</span>
        </div>
      </div>

      <div className="card" style={{ padding: "0 16px 8px" }}>
        <DataTable<Proyecto>
          card={false}
          columns={columns}
          dataSource={filtered}
          rowKey="project_id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      <Drawer
        title={editing ? "Editar proyecto" : "Nuevo proyecto"}
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
            rules={[{ required: true, message: "Indica el nombre del proyecto." }]}
          >
            <Input placeholder="Ej: Vista Hermosa LotizaciÃ³n" maxLength={120} />
          </Form.Item>

          <Form.Item
            name="tipo"
            label="Tipo"
            rules={[{ required: true, message: "Selecciona el tipo." }]}
          >
            <Select
              placeholder="Selecciona un tipo"
              options={Object.entries(TIPO_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>

          <Form.Item name="ubicacion" label="UbicaciÃ³n">
            <Input placeholder="Ciudad, provincia" maxLength={200} />
          </Form.Item>

          <Form.Item name="total_lotes" label="Total de lotes">
            <InputNumber min={1} style={{ width: "100%" }} placeholder="Ej: 120" />
          </Form.Item>

          <Form.Item name="descripcion" label="DescripciÃ³n">
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="DescripciÃ³n del desarrollo" />
          </Form.Item>

          {editing && (
            <Form.Item name="estado" label="Estado">
              <Select
                options={[
                  { value: "activo", label: "Activo" },
                  { value: "pausado", label: "Pausado" },
                  { value: "terminado", label: "Terminado" },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
