import { useMemo, useState } from "react";
import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
} from "antd";
import { DeleteOutlined, EditOutlined, FacebookOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { EstadoCampanaTag, formatFecha, formatPrecio } from "@/presentation/components/common/status";
import {
  useCampanas,
  useCreateCampana,
  useDeleteCampana,
  usePropiedades,
  usePublicarCampana,
  useUpdateCampana,
  useValidarCampana,
} from "@/presentation/hooks";
import { campanaSchema } from "@/presentation/validations";
import type { Campana, CampanaDestino, CampanaEstado, CampanaObjetivo } from "@/domain/campana";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const OBJETIVO_LABELS: Record<CampanaObjetivo, string> = {
  mensajes: "Mensajes",
  formularios: "Formularios",
  visitas: "Visitas al sitio",
  trafico: "Tráfico",
  branding: "Alcance de marca",
};

const DESTINO_LABELS: Record<CampanaDestino, string> = {
  whatsapp: "WhatsApp",
  formulario: "Formulario",
  landing: "Landing",
};

interface FormValues {
  nombre: string;
  property_id?: string | null;
  objetivo: CampanaObjetivo;
  destino: CampanaDestino;
  presupuesto_maximo: number;
  titulo?: string | null;
  copy: string;
  cta?: string | null;
  fechas?: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

/**
 * Campañas — UI Concept 01: asistente de 3 pasos (Datos → Objetivo →
 * Revisión) con panel de resumen a la derecha, más el listado de borradores
 * con el flujo §10 (local_draft → validated → awaiting_approval).
 */
export function CampanasPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState<Campana | null>(null);

  const { data: campanas, isLoading } = useCampanas();
  const { data: propiedades } = usePropiedades();
  const createCampana = useCreateCampana();
  const updateCampana = useUpdateCampana();
  const deleteCampana = useDeleteCampana();
  const validarCampana = useValidarCampana();
  const publicarCampana = usePublicarCampana();

  const saving = createCampana.isPending || updateCampana.isPending;

  const propiedadNombre = useMemo(() => {
    const map = new Map((propiedades ?? []).map((p) => [String(p.propiedad_id), p.nombre]));
    return (id: string | null) => (id ? (map.get(String(id)) ?? "—") : "Sin propiedad");
  }, [propiedades]);

  const nombre = Form.useWatch("nombre", form);
  const propertyId = Form.useWatch("property_id", form);
  const objetivo = Form.useWatch("objetivo", form);
  const destino = Form.useWatch("destino", form);
  const presupuesto = Form.useWatch("presupuesto_maximo", form);
  const copy = Form.useWatch("copy", form);
  const fechas = Form.useWatch("fechas", form);

  const p1 = Boolean(nombre) && Boolean(propertyId);
  const p2 = p1 && Boolean(objetivo) && Boolean(destino) && Boolean(presupuesto);
  const p3 = p2 && (copy?.trim().length ?? 0) >= 10;

  const pasoClase = (n: 1 | 2 | 3): string => {
    if (n === 1) return p1 ? "done" : "current";
    if (n === 2) return p2 ? "done" : p1 ? "current" : "";
    return p3 ? "done" : p2 ? "current" : "";
  };

  const duracionDias = useMemo(() => {
    if (!fechas || !fechas[0] || !fechas[1]) return null;
    const dias = fechas[1].diff(fechas[0], "day") + 1;
    return dias > 0 ? dias : null;
  }, [fechas]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ objetivo: "mensajes", destino: "whatsapp" });
  };

  const openEdit = (row: Campana) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      property_id: row.property_id,
      objetivo: row.objetivo,
      destino: row.destino,
      presupuesto_maximo: row.presupuesto_maximo,
      titulo: row.titulo,
      copy: row.copy ?? "",
      cta: row.cta,
      fechas:
        row.fecha_inicio && row.fecha_fin
          ? [dayjs(row.fecha_inicio), dayjs(row.fecha_fin)]
          : null,
    });
  };

  /** Guarda el borrador (create/update) y devuelve el id de la campaña. */
  const guardarBorrador = async (): Promise<string | null> => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return null;

    const parsed = campanaSchema.safeParse({
      nombre: values.nombre,
      property_id: values.property_id ?? null,
      objetivo: values.objetivo,
      destino: values.destino,
      presupuesto_maximo: values.presupuesto_maximo,
      titulo: values.titulo ?? null,
      copy: values.copy,
      cta: values.cta ?? null,
      fecha_inicio: values.fechas?.[0]?.toISOString() ?? null,
      fecha_fin: values.fechas?.[1]?.toISOString() ?? null,
    });

    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos de la campaña.");
      return null;
    }

    const payload = {
      ...parsed.data,
      property_id: parsed.data.property_id ?? null,
      connection_id: null,
      titulo: parsed.data.titulo ?? null,
      cta: parsed.data.cta ?? null,
      presupuesto_maximo: parsed.data.presupuesto_maximo,
      moneda: "USD",
      creative_url: null,
      fecha_inicio: parsed.data.fecha_inicio
        ? new Date(parsed.data.fecha_inicio).toISOString()
        : null,
      fecha_fin: parsed.data.fecha_fin ? new Date(parsed.data.fecha_fin).toISOString() : null,
    };

    try {
      if (editing) {
        const updated = await updateCampana.mutateAsync({ id: editing.campaign_id, data: payload });
        setEditing(updated);
        return updated.campaign_id;
      }
      const created = await createCampana.mutateAsync(payload);
      setEditing(created);
      return created.campaign_id;
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la campaña.");
      return null;
    }
  };

  const handleGuardar = async () => {
    const id = await guardarBorrador();
    if (id) message.success("Borrador guardado.");
  };

  const handleValidar = async () => {
    const id = await guardarBorrador();
    if (!id) return;
    try {
      await validarCampana.mutateAsync(id);
      message.success("Campaña validada y enviada al flujo de aprobación.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "La campaña no pudo validarse.");
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

  const handlePublicar = async (row: Campana) => {
    try {
      const resultado = await publicarCampana.mutateAsync(row.campaign_id);
      if (resultado.simulado) {
        message.warning("La API está en modo simulado: no se creó ninguna campaña real en Meta.");
      } else {
        message.success(`Campaña enviada a Meta y creada pausada (ID: ${resultado.meta_campaign_id}).`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo enviar la campaña a Meta.");
    }
  };

  const columns: ColumnsType<Campana> = [
    {
      title: "Campaña",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <span style={{ fontWeight: 650, display: "block" }}>{nombre}</span>
          <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
            {propiedadNombre(row.property_id)} · {DESTINO_LABELS[row.destino]}
          </span>
        </div>
      ),
    },
    {
      title: "Objetivo",
      dataIndex: "objetivo",
      key: "objetivo",
      width: 130,
      render: (v: CampanaObjetivo) => OBJETIVO_LABELS[v],
    },
    {
      title: "Presupuesto",
      dataIndex: "presupuesto_maximo",
      key: "presupuesto_maximo",
      width: 130,
      render: (v: number) => formatPrecio(v),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 165,
      render: (estado: CampanaEstado) => <EstadoCampanaTag estado={estado} />,
    },
    {
      title: "Creada",
      dataIndex: "created_at",
      key: "created_at",
      width: 125,
      render: (v: string) => formatFecha(v),
    },
    {
      title: "",
      key: "acciones",
      width: 255,
      render: (_, row) => (
        <span style={{ display: "flex", gap: 6 }}>
          {!row.meta_campaign_id &&
            ["validated", "awaiting_approval", "approved"].includes(row.estado) && (
            <Popconfirm
              title="¿Enviar campaña a Meta?"
              description="Se creará pausada. No empezará a generar gasto hasta que la actives en Meta Ads."
              okText="Enviar pausada"
              cancelText="Cancelar"
              onConfirm={() => handlePublicar(row)}
            >
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: "6px 10px", fontSize: 11 }}
                disabled={publicarCampana.isPending}
              >
                <FacebookOutlined /> Enviar a Meta
              </button>
            </Popconfirm>
          )}
          {row.estado === "local_draft" && (
            <button
              type="button"
              className="btn btn-soft"
              style={{ padding: "6px 11px", fontSize: 11 }}
              onClick={async () => {
                openEdit(row);
                try {
                  await validarCampana.mutateAsync(row.campaign_id);
                  message.success("Campaña avanzada en el flujo de aprobación.");
                } catch (error) {
                  message.error(
                    error instanceof Error ? error.message : "La campaña no pudo validarse.",
                  );
                }
              }}
            >
              Validar
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "6px 11px", fontSize: 11 }}
            onClick={() => openEdit(row)}
          >
            <EditOutlined /> Editar
          </button>
          <Popconfirm
            title="¿Eliminar esta campaña?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.campaign_id)}
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
          <p className="eyebrow">Crecimiento · Meta Ads</p>
          <h1>Campañas publicitarias</h1>
          <p className="sub">
            Prepara el borrador en tres pasos y envíalo al flujo de aprobación (§10).
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nueva campaña
          </button>
        </div>
      </div>

      <div className="notice">
        <strong>Publicación directa en Meta.</strong> La API usa el token y la cuenta publicitaria
        configurados de forma privada en el backend.
      </div>

      <div className="campaign-layout">
        {/* ── Asistente ──────────────────────────────────────────────────── */}
        <div className="card card-pad">
          <div className="steps">
            <div className={`step ${pasoClase(1)}`}>
              <span className="bubble">1</span> Datos
            </div>
            <span className="step-line" />
            <div className={`step ${pasoClase(2)}`}>
              <span className="bubble">2</span> Objetivo
            </div>
            <span className="step-line" />
            <div className={`step ${pasoClase(3)}`}>
              <span className="bubble">3</span> Revisión
            </div>
          </div>

          <Form form={form} layout="vertical" requiredMark={false}>
            <div className="field">
              <span className="lbl">Nombre de la campaña</span>
              <Form.Item
                name="nombre"
                noStyle
                rules={[{ required: true, message: "Indica un nombre para la campaña." }]}
              >
                <Input placeholder="Ej: Lotes Vista Hermosa — Mensajes" maxLength={120} />
              </Form.Item>
            </div>

            <div className="form-grid">
              <div className="field">
                <span className="lbl">Propiedad</span>
                <Form.Item
                  name="property_id"
                  noStyle
                  rules={[{ required: true, message: "Selecciona la propiedad." }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Selecciona una propiedad"
                    options={(propiedades ?? []).map((p) => ({
                      value: p.propiedad_id,
                      label: p.nombre,
                    }))}
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Objetivo</span>
                <Form.Item
                  name="objetivo"
                  noStyle
                  rules={[{ required: true, message: "Selecciona un objetivo." }]}
                >
                  <Select
                    placeholder="Objetivo"
                    options={Object.entries(OBJETIVO_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Destino del lead</span>
                <Form.Item
                  name="destino"
                  noStyle
                  rules={[{ required: true, message: "Selecciona el destino." }]}
                >
                  <Select
                    placeholder="Destino"
                    options={Object.entries(DESTINO_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Presupuesto máximo (USD)</span>
                <Form.Item
                  name="presupuesto_maximo"
                  noStyle
                  rules={[{ required: true, message: "Define un presupuesto." }]}
                >
                  <InputNumber min={1} style={{ width: "100%" }} placeholder="Ej: 150" />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Duración</span>
                <Form.Item name="fechas" noStyle>
                  <DatePicker.RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <div className="field full">
                <span className="lbl">Título</span>
                <Form.Item name="titulo" noStyle>
                  <Input maxLength={120} placeholder="Título del anuncio" />
                </Form.Item>
              </div>

              <div className="field full">
                <span className="lbl">Copy del anuncio</span>
                <Form.Item
                  name="copy"
                  noStyle
                  rules={[{ required: true, message: "Escribe el copy del anuncio." }]}
                >
                  <Input.TextArea
                    rows={3}
                    maxLength={500}
                    showCount
                    placeholder="Lotes desde USD 35.000 a 15 minutos del centro. Agenda tu visita hoy."
                  />
                </Form.Item>
              </div>

              <div className="field full">
                <span className="lbl">Botón (CTA)</span>
                <Form.Item name="cta" noStyle>
                  <Input maxLength={60} placeholder="Ej: Enviar mensaje" />
                </Form.Item>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={handleGuardar} disabled={saving}>
                Guardar borrador
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleValidar}
                disabled={saving || validarCampana.isPending}
              >
                <SendOutlined /> Validar y enviar a aprobación
              </button>
            </div>
          </Form>
        </div>

        {/* ── Resumen ────────────────────────────────────────────────────── */}
        <div className="card card-pad" style={{ alignSelf: "start" }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>Resumen de la campaña</h2>

          <div className="summ-row">
            <span>Propiedad</span>
            <strong>{propertyId ? propiedadNombre(propertyId) : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Objetivo</span>
            <strong>{objetivo ? OBJETIVO_LABELS[objetivo] : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Destino</span>
            <strong>{destino ? DESTINO_LABELS[destino] : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Presupuesto máximo</span>
            <strong>{presupuesto ? formatPrecio(presupuesto) : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Duración</span>
            <strong>{duracionDias ? `${duracionDias} días` : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Copy</span>
            <strong>{copy?.trim() ? `${copy.trim().length} caracteres` : "—"}</strong>
          </div>
          <div className="summ-row">
            <span>Estado actual</span>
            <strong>
              {editing ? (
                <EstadoCampanaTag estado={editing.estado} />
              ) : (
                <span className="mini-badge grey">Borrador nuevo</span>
              )}
            </strong>
          </div>

          <div className="notice" style={{ marginTop: 18, marginBottom: 0 }}>
            El flujo §10 valida presupuesto, destino, copy y conexión antes de enviar la campaña a
            aprobación de Meta.
          </div>
        </div>
      </div>

      {/* ── Listado ──────────────────────────────────────────────────────── */}
      <div className="section-title">
        <h2>Borradores y campañas</h2>
        <p className="sub">Todas las campañas del workspace, con su fase en el flujo.</p>
      </div>

      <div className="card" style={{ padding: "0 16px 8px" }}>
        <DataTable<Campana>
          card={false}
          columns={columns}
          dataSource={campanas ?? []}
          rowKey="campaign_id"
          loading={isLoading}
          pagination={false}
        />
      </div>

      <p className="footer-note">
        Las campañas enviadas se crean pausadas en Meta; confirma el estado real en Ads Manager
        antes de activarlas.
      </p>
    </div>
  );
}
