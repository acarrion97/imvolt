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
  Steps,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { EstadoCampanaTag, formatPrecio } from "@/presentation/components/common/status";
import {
  useCampanas,
  useConexiones,
  useCreateCampana,
  useDeleteCampana,
  usePropiedades,
  useUpdateCampana,
  useValidarCampana,
} from "@/presentation/hooks";
import { campanaSchema } from "@/presentation/validations";
import type { Campana, CampanaEstado } from "@/domain/campana";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const OBJETIVO_LABELS: Record<Campana["objetivo"], string> = {
  mensajes: "Mensajes",
  formularios: "Formularios",
  visitas: "Visitas",
  trafico: "Tráfico",
  branding: "Branding",
};

const DESTINO_LABELS: Record<Campana["destino"], string> = {
  whatsapp: "WhatsApp",
  formulario: "Formulario",
  landing: "Landing",
};

/** Pasos del flujo §10 para visualizar el progreso de la campaña. */
const FLUJO: CampanaEstado[] = ["local_draft", "validated", "awaiting_approval", "approved", "active"];

function flujoIndex(estado: CampanaEstado): number {
  const i = FLUJO.indexOf(estado);
  if (i >= 0) return i;
  return estado === "published_paused" ? FLUJO.indexOf("approved") : 0;
}

interface FormValues {
  nombre: string;
  property_id?: string | null;
  connection_id?: string | null;
  objetivo: Campana["objetivo"];
  destino: Campana["destino"];
  presupuesto_maximo: number;
  titulo?: string | null;
  copy: string;
  cta?: string | null;
}

export function CampanasPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<CampanaEstado | undefined>();
  const [editing, setEditing] = useState<Campana | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: campanas, isLoading } = useCampanas();
  const { data: propiedades } = usePropiedades();
  const { data: conexiones } = useConexiones();
  const createCampana = useCreateCampana();
  const updateCampana = useUpdateCampana();
  const deleteCampana = useDeleteCampana();
  const validarCampana = useValidarCampana();
  const saving = createCampana.isPending || updateCampana.isPending;

  const propiedadNombre = useMemo(() => {
    const map = new Map((propiedades ?? []).map((p) => [p.property_id, p.nombre]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [propiedades]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (campanas ?? []).filter((c) => {
      if (filtroEstado && c.estado !== filtroEstado) return false;
      if (!q) return true;
      return c.nombre.toLowerCase().includes(q) || (c.copy ?? "").toLowerCase().includes(q);
    });
  }, [campanas, search, filtroEstado]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ objetivo: "mensajes", destino: "whatsapp" });
    setDrawerOpen(true);
  };

  const openEdit = (row: Campana) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      property_id: row.property_id,
      connection_id: row.connection_id,
      objetivo: row.objetivo,
      destino: row.destino,
      presupuesto_maximo: row.presupuesto_maximo,
      titulo: row.titulo,
      copy: row.copy ?? "",
      cta: row.cta,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = campanaSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      ...parsed.data,
      property_id: parsed.data.property_id ?? null,
      connection_id: parsed.data.connection_id ?? null,
      titulo: parsed.data.titulo ?? null,
      cta: parsed.data.cta ?? null,
      presupuesto_maximo: parsed.data.presupuesto_maximo,
      moneda: "USD",
      creative_url: null,
      fecha_inicio: parsed.data.fecha_inicio ?? null,
      fecha_fin: parsed.data.fecha_fin ?? null,
    };

    try {
      if (editing) {
        await updateCampana.mutateAsync({ id: editing.campaign_id, data: payload });
        message.success("Campaña actualizada.");
      } else {
        await createCampana.mutateAsync(payload);
        message.success("Campaña creada como borrador local.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la campaña.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCampana.mutateAsync(id);
      message.success("Campaña eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const handleValidar = async (id: string) => {
    try {
      await validarCampana.mutateAsync(id);
      message.success("Campaña validada y enviada al siguiente paso.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "La campaña no pudo validarse.");
    }
  };

  const columns: ColumnsType<Campana> = [
    {
      title: "Campaña",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <Text strong>{nombre}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {OBJETIVO_LABELS[row.objetivo]} · {DESTINO_LABELS[row.destino]} · {propiedadNombre(row.property_id)}
          </Text>
        </div>
      ),
    },
    {
      title: "Progreso",
      key: "progreso",
      width: 220,
      render: (_, row) =>
        row.estado === "rejected" || row.estado === "failed" || row.estado === "archived" ? (
          <EstadoCampanaTag estado={row.estado} />
        ) : (
          <Steps
            size="small"
            current={flujoIndex(row.estado)}
            items={FLUJO.map((f) => ({ key: f }))}
            style={{ maxWidth: 200 }}
          />
        ),
    },
    {
      title: "Presupuesto/día",
      dataIndex: "presupuesto_maximo",
      key: "presupuesto_maximo",
      width: 140,
      render: (v: number, row) => formatPrecio(v, row.moneda),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 160,
      render: (estado: CampanaEstado) => <EstadoCampanaTag estado={estado} />,
    },
    {
      title: "",
      key: "acciones",
      width: 170,
      render: (_, row) => (
        <Space>
          {(row.estado === "local_draft" || row.estado === "validated") && (
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => handleValidar(row.campaign_id)}
              loading={validarCampana.isPending && validarCampana.variables?.[0] === row.campaign_id}
            >
              Validar
            </Button>
          )}
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title="¿Eliminar esta campaña?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.campaign_id)}
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
        title="Campañas"
        subtitle="Publica en Meta Ads: de borrador local a campaña activa."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar campaña..." }}
        extra={
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 180 }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={FLUJO.concat(["rejected", "failed", "archived"] as CampanaEstado[]).map((v) => ({
              value: v,
              label: v.replace(/_/g, " "),
            }))}
          />
        }
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nueva campaña
          </Button>
        }
      />

      <DataTable<Campana>
        columns={columns}
        dataSource={filtered}
        rowKey="campaign_id"
        loading={isLoading}
      />

      <Drawer
        title={editing ? "Editar campaña" : "Nueva campaña"}
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
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre de la campaña." }]}
          >
            <Input placeholder="Ej: Lotes Vista Hermosa — Visitas" maxLength={120} />
          </Form.Item>

          <Form.Item name="property_id" label="Propiedad">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Campaña general (sin propiedad)"
              options={(propiedades ?? []).map((p) => ({ value: p.property_id, label: p.nombre }))}
            />
          </Form.Item>

          <Form.Item name="connection_id" label="Conexión Meta">
            <Select
              allowClear
              placeholder="Selecciona la cuenta publicitaria"
              options={(conexiones ?? [])
                .filter((c) => c.estado === "conectada")
                .map((c) => ({ value: c.connection_id, label: c.nombre_cuenta }))}
            />
          </Form.Item>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item
              name="objetivo"
              label="Objetivo"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Objetivo"
                options={Object.entries(OBJETIVO_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item
              name="destino"
              label="Destino del lead"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Destino"
                options={Object.entries(DESTINO_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="presupuesto_maximo"
            label="Presupuesto máximo diario (USD)"
            rules={[{ required: true, message: "Define un presupuesto mayor a cero." }]}
          >
            <InputNumber min={0.01} step={0.5} style={{ width: "100%" }} placeholder="Ej: 15.50" />
          </Form.Item>

          <Form.Item name="titulo" label="Título del anuncio">
            <Input maxLength={120} placeholder="Lotea tu futuro en Vista Hermosa" />
          </Form.Item>

          <Form.Item
            name="copy"
            label="Copy"
            rules={[{ required: true, message: "El copy es obligatorio." }]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="Texto del anuncio..." />
          </Form.Item>

          <Form.Item name="cta" label="Call to action">
            <Input maxLength={60} placeholder="Agendar visita" />
          </Form.Item>

          {editing && (
            <Form.Item label="Aprobación">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Estado actual: {editing.estado.replace(/_/g, " ")}. Usa el botón "Validar" de la tabla
                para avanzar por el flujo (§10).
              </Text>
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
