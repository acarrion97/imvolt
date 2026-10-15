import { useMemo, useState } from "react";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { EstadoLeadTag, formatFecha } from "@/presentation/components/common/status";
import {
  useCampanas,
  useCreateLead,
  useDeleteLead,
  useLeads,
  usePropiedades,
  useUpdateLead,
} from "@/presentation/hooks";
import { leadSchema } from "@/presentation/validations";
import type { Lead, LeadEstado, LeadFuente } from "@/domain/lead";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const FUENTE_LABELS: Record<LeadFuente, string> = {
  meta_formulario: "Meta Formulario",
  whatsapp: "WhatsApp",
  landing: "Landing",
  manual: "Manual",
  lotes_al_mando: "Lotes al mando",
};

const ESTADOS: LeadEstado[] = ["nuevo", "contactado", "calificado", "visitado", "cerrado", "perdido"];

interface FormValues {
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  campaign_id?: string | null;
  property_id?: string | null;
  fuente: LeadFuente;
  estado?: LeadEstado;
  notas?: string | null;
}

export function ContactosPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<LeadEstado | undefined>();
  const [filtroFuente, setFiltroFuente] = useState<LeadFuente | undefined>();
  const [editing, setEditing] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: leads, isLoading } = useLeads();
  const { data: campanas } = useCampanas();
  const { data: propiedades } = usePropiedades();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const saving = createLead.isPending || updateLead.isPending;

  const campanaNombre = useMemo(() => {
    const map = new Map((campanas ?? []).map((c) => [c.campaign_id, c.nombre]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Orgánico / manual");
  }, [campanas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (filtroEstado && l.estado !== filtroEstado) return false;
      if (filtroFuente && l.fuente !== filtroFuente) return false;
      if (!q) return true;
      return (
        l.nombre.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.telefono ?? "").includes(q)
      );
    });
  }, [leads, search, filtroEstado, filtroFuente]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ fuente: "manual", estado: "nuevo" });
    setDrawerOpen(true);
  };

  const openEdit = (row: Lead) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      campaign_id: row.campaign_id,
      property_id: row.property_id,
      fuente: row.fuente,
      estado: row.estado,
      notas: row.notas,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      ...parsed.data,
      email: parsed.data.email || null,
      telefono: parsed.data.telefono || null,
      campaign_id: parsed.data.campaign_id ?? null,
      property_id: parsed.data.property_id ?? null,
      estado: parsed.data.estado ?? ("nuevo" as LeadEstado),
      notas: parsed.data.notas ?? null,
    };

    try {
      if (editing) {
        await updateLead.mutateAsync({ id: editing.lead_id, data: payload });
        message.success("Contacto actualizado.");
      } else {
        await createLead.mutateAsync(payload);
        message.success("Contacto registrado.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el contacto.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead.mutateAsync(id);
      message.success("Contacto eliminado.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const columns: ColumnsType<Lead> = [
    {
      title: "Contacto",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <Text strong>{nombre}</Text>
          <br />
          <Space size={8}>
            {row.telefono && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <PhoneOutlined /> {row.telefono}
              </Text>
            )}
            {row.email && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <MailOutlined /> {row.email}
              </Text>
            )}
          </Space>
        </div>
      ),
    },
    {
      title: "Fuente",
      dataIndex: "fuente",
      key: "fuente",
      width: 150,
      render: (fuente: LeadFuente) => FUENTE_LABELS[fuente] ?? fuente,
    },
    {
      title: "Campaña",
      dataIndex: "campaign_id",
      key: "campaign_id",
      width: 200,
      render: (id: string | null) => campanaNombre(id),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 130,
      render: (estado: LeadEstado) => <EstadoLeadTag estado={estado} />,
    },
    {
      title: "Registrado",
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
            title="¿Eliminar este contacto?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.lead_id)}
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
        title="Contactos"
        subtitle="Pipeline de leads: de la campaña a la visita y al cierre."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por nombre, email o teléfono..." }}
        extra={
          <Space wrap>
            <Select
              allowClear
              placeholder="Estado"
              style={{ width: 150 }}
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={ESTADOS.map((v) => ({ value: v, label: v }))}
            />
            <Select
              allowClear
              placeholder="Fuente"
              style={{ width: 170 }}
              value={filtroFuente}
              onChange={setFiltroFuente}
              options={Object.entries(FUENTE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Space>
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo contacto
          </Button>
        }
      />

      <DataTable<Lead> columns={columns} dataSource={filtered} rowKey="lead_id" loading={isLoading} />

      <Drawer
        title={editing ? "Editar contacto" : "Nuevo contacto"}
        width={520}
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
            label="Nombre completo"
            rules={[{ required: true, message: "Indica el nombre del contacto." }]}
          >
            <Input placeholder="Ej: María Fernanda López" maxLength={120} />
          </Form.Item>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="telefono" label="Teléfono" style={{ flex: 1 }}>
              <Input placeholder="+593 98 765 4321" maxLength={20} />
            </Form.Item>
            <Form.Item name="email" label="Email" style={{ flex: 1 }}>
              <Input placeholder="correo@ejemplo.com" maxLength={120} />
            </Form.Item>
          </Space>

          <Form.Item
            name="fuente"
            label="Fuente"
            rules={[{ required: true, message: "Selecciona la fuente." }]}
          >
            <Select
              placeholder="¿De dónde viene el lead?"
              options={Object.entries(FUENTE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>

          <Form.Item name="campaign_id" label="Campaña de origen">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin campaña (orgánico/manual)"
              options={(campanas ?? []).map((c) => ({ value: c.campaign_id, label: c.nombre }))}
            />
          </Form.Item>

          <Form.Item name="property_id" label="Propiedad de interés">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin propiedad específica"
              options={(propiedades ?? []).map((p) => ({ value: p.property_id, label: p.nombre }))}
            />
          </Form.Item>

          {editing && (
            <Form.Item name="estado" label="Estado del pipeline">
              <Select placeholder="Estado" options={ESTADOS.map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          )}

          <Form.Item name="notas" label="Notas">
            <Input.TextArea rows={3} maxLength={1000} showCount placeholder="Contexto, preferencias, siguiente paso..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
