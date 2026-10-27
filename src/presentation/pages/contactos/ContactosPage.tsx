import { useMemo, useState } from "react";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Spin,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
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

const FUENTE_LABELS: Record<LeadFuente, string> = {
  meta_formulario: "Meta formulario",
  whatsapp: "WhatsApp",
  landing: "Landing",
  manual: "Manual",
  lotes_al_mando: "Lotes al Mando",
};

const ESTADO_LABELS: Record<LeadEstado, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  visitado: "Visitado",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

interface FormValues {
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  fuente: LeadFuente;
  campaign_id?: string | null;
  property_id?: string | null;
  estado?: LeadEstado;
  notas?: string | null;
}

/**
 * Contactos â€” UI Concept 01: tabla del pipeline de leads con filtros, aviso
 * de demo y alta manual en Drawer.
 */
export function ContactosPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<LeadEstado | undefined>();
  const [filtroFuente, setFiltroFuente] = useState<LeadFuente | undefined>();
  const [editing, setEditing] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: leads, isLoading } = useLeads();
  const { data: propiedades } = usePropiedades();
  const { data: campanas } = useCampanas();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const saving = createLead.isPending || updateLead.isPending;

  const interesMap = useMemo(() => {
    const map = new Map((propiedades ?? []).map((p) => [String(p.propiedad_id), p.nombre]));
    return (id: string | null) => (id ? (map.get(String(id)) ?? "—") : "—");
  }, [propiedades]);

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
      telefono: row.telefono,
      email: row.email,
      fuente: row.fuente,
      campaign_id: row.campaign_id,
      property_id: row.property_id,
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
      estado: parsed.data.estado ?? ("nuevo" as const),
      notas: parsed.data.notas ?? null,
    };

    try {
      if (editing) {
        await updateLead.mutateAsync({ id: editing.lead_id, data: payload });
        message.success("Contacto actualizado.");
      } else {
        await createLead.mutateAsync(payload);
        message.success("Contacto creado.");
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
          <span style={{ fontWeight: 650, display: "block" }}>{nombre}</span>
          <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
            {row.telefono ?? "sin teléfono"} · {row.email ?? "sin email"}
          </span>
        </div>
      ),
    },
    {
      title: "Interés",
      dataIndex: "property_id",
      key: "property_id",
      render: (id: string | null) => interesMap(id),
    },
    {
      title: "Origen",
      dataIndex: "fuente",
      key: "fuente",
      width: 160,
      render: (fuente: LeadFuente) => (
        <span className={fuente === "manual" ? "mini-badge grey" : "mini-badge"}>
          {FUENTE_LABELS[fuente]}
        </span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 140,
      render: (estado: LeadEstado) => <EstadoLeadTag estado={estado} />,
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (v: string) => formatFecha(v),
    },
    {
      title: "",
      key: "acciones",
      width: 100,
      render: (_, row) => (
        <span style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "6px 11px", fontSize: 11 }}
            onClick={() => openEdit(row)}
          >
            <EditOutlined /> Editar
          </button>
          <Popconfirm
            title="¿Eliminar este contacto?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.lead_id)}
          >
            <button
              type="button"
              className="btn btn-danger"
              style={{ padding: "6px 10px", fontSize: 11 }}
            >
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Crecimiento</p>
          <h1>Contactos potenciales</h1>
          <p className="sub">
            Pipeline de leads de Meta, WhatsApp y landing con deduplicación por fuente (§11).
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nuevo contacto
          </button>
        </div>
      </div>

      <div className="notice">
        <strong>Demo interactiva.</strong> Los leads llegan simulados hasta conectar Meta y el
        webhook de captación.
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 165 }}
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={(Object.keys(ESTADO_LABELS) as LeadEstado[]).map((v) => ({
              value: v,
              label: ESTADO_LABELS[v],
            }))}
          />
          <Select
            allowClear
            placeholder="Origen"
            style={{ width: 175 }}
            value={filtroFuente}
            onChange={setFiltroFuente}
            options={(Object.keys(FUENTE_LABELS) as LeadFuente[]).map((v) => ({
              value: v,
              label: FUENTE_LABELS[v],
            }))}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} contactos</span>
        </div>
      </div>

      <Spin spinning={isLoading}>
        <div className="card" style={{ padding: "0 16px 8px" }}>
          <DataTable<Lead>
            card={false}
            columns={columns}
            dataSource={filtered}
            rowKey="lead_id"
            pagination={filtered.length > 10 ? undefined : false}
          />
        </div>
      </Spin>

      <p className="footer-note">
        Estado actual: {filtered.filter((l) => l.estado === "nuevo").length} nuevos ·{" "}
        {filtered.filter((l) => l.estado === "calificado").length} calificados ·{" "}
        {filtered.filter((l) => l.estado === "cerrado").length} cerrados
      </p>

      <Drawer
        title={editing ? "Editar contacto" : "Nuevo contacto"}
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
            label="Nombre completo"
            rules={[{ required: true, message: "Indica el nombre del contacto." }]}
          >
            <Input placeholder="Ej: Andrea Salazar" maxLength={120} />
          </Form.Item>

          <div className="form-grid">
            <Form.Item name="telefono" label="Teléfono">
              <Input placeholder="+593 99 123 4567" maxLength={20} />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input placeholder="andrea@correo.com" maxLength={120} />
            </Form.Item>

            <Form.Item
              name="fuente"
              label="Origen"
              rules={[{ required: true, message: "Selecciona la fuente." }]}
            >
              <Select
                placeholder="Fuente"
                options={Object.entries(FUENTE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item name="estado" label="Estado del pipeline">
              <Select
                placeholder="Estado"
                options={Object.entries(ESTADO_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>

            <Form.Item name="campaign_id" label="Campaña de origen">
              <Select
                allowClear
                placeholder="Sin campaña"
                options={(campanas ?? []).map((c) => ({
                  value: c.campaign_id,
                  label: c.nombre,
                }))}
              />
            </Form.Item>
            <Form.Item name="property_id" label="Propiedad de interés">
              <Select
                allowClear
                placeholder="Sin propiedad"
                options={(propiedades ?? []).map((p) => ({
                  value: p.propiedad_id,
                  label: p.nombre,
                }))}
              />
            </Form.Item>
          </div>

          <Form.Item name="notas" label="Notas">
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
