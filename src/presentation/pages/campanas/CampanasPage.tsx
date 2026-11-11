import { useEffect, useMemo, useState } from "react";
import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FacebookOutlined,
  PlusOutlined,
  SendOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { DataTable } from "@/presentation/components/common/DataTable";
import { EstadoCampanaTag, formatFecha, formatPrecio } from "@/presentation/components/common/status";
import {
  useCampanas,
  useConexiones,
  useCreateCampana,
  useDeleteCampana,
  useMetaAdLocations,
  useMetaPages,
  useAprobarCampana,
  useGenerarEstrategiaCampana,
  usePropiedades,
  usePublicarCampana,
  useSolicitarAprobacionCampana,
  useSincronizarEstadoMetaCampana,
  useUpdateCampana,
  useValidarCampana,
} from "@/presentation/hooks";
import { campanaSchema } from "@/presentation/validations";
import type {
  Campana,
  CampanaDestino,
  CampanaEstado,
  CampanaObjetivo,
  EstrategiaCampana,
  VarianteEstrategia,
} from "@/domain/campana";
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
  connection_id?: string | null;
  objetivo: CampanaObjetivo;
  destino: CampanaDestino;
  presupuesto_maximo: number;
  publico_objetivo?: string;
  titulo?: string | null;
  copy: string;
  cta?: string | null;
  fechas?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  creative_url?: string | null;
  media_type?: "image" | "video";
  meta_page_id?: string | null;
  meta_instagram_id?: string | null;
  target_location_key?: string | null;
  target_location_name?: string | null;
  target_location_country_code?: string | null;
  privacy_policy_url?: string | null;
}

const publishStorageKey = (campaignId: string): string => `imvolt:campaign-publish:${campaignId}`;

function exportDrafts(campaigns: Campana[]): void {
  const drafts = campaigns.filter((campaign) =>
    ["local_draft", "validated", "awaiting_approval", "approved", "rejected", "failed"].includes(campaign.estado),
  );
  if (!drafts.length) throw new Error("No hay borradores disponibles para exportar.");
  const blob = new Blob([JSON.stringify(drafts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `imvolt-borradores-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const [estrategia, setEstrategia] = useState<EstrategiaCampana | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");

  const { data: campanas, isLoading } = useCampanas();
  const { data: propiedades } = usePropiedades();
  const { data: conexiones } = useConexiones();
  const cuentasMeta = (conexiones ?? []).filter(
    (conexion) => conexion.estado === "conectada" && conexion.autenticada,
  );
  const createCampana = useCreateCampana();
  const updateCampana = useUpdateCampana();
  const deleteCampana = useDeleteCampana();
  const validarCampana = useValidarCampana();
  const publicarCampana = usePublicarCampana();
  const solicitarAprobacion = useSolicitarAprobacionCampana();
  const aprobarCampana = useAprobarCampana();
  const sincronizarEstadoMeta = useSincronizarEstadoMetaCampana();
  const generarEstrategia = useGenerarEstrategiaCampana();

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
  const publicoObjetivo = Form.useWatch("publico_objetivo", form);
  const copy = Form.useWatch("copy", form);
  const fechas = Form.useWatch("fechas", form);
  const selectedConnectionId = Form.useWatch("connection_id", form);
  const selectedPageId = Form.useWatch("meta_page_id", form);
  const { data: metaPages, isLoading: loadingMetaPages } = useMetaPages(selectedConnectionId ?? undefined);
  const {
    data: metaLocations,
    isLoading: loadingMetaLocations,
    error: metaLocationsError,
  } = useMetaAdLocations(selectedConnectionId ?? undefined, debouncedLocationQuery);
  const strategyPending = generarEstrategia.isPending;

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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedLocationQuery(locationQuery), 300);
    return () => window.clearTimeout(timer);
  }, [locationQuery]);

  const handleGenerarEstrategia = async () => {
    if (!propertyId || !objetivo || !presupuesto || !publicoObjetivo?.trim()) {
      message.warning("Completa propiedad, objetivo, presupuesto y público objetivo para generar la estrategia.");
      return;
    }
    try {
      setEstrategia(
        await generarEstrategia.mutateAsync({ propertyId, objective: objetivo, presupuesto: Number(presupuesto), publicoObjetivo: publicoObjetivo.trim() }),
      );
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo generar la estrategia.");
    }
  };

  const aplicarVariante = (variant: VarianteEstrategia) => {
    form.setFieldsValue({
      titulo: variant.titular,
      copy: variant.copy_corto,
      cta: variant.cta,
    });
    setEstrategia(null);
    message.success(`Variante ${variant.variante} aplicada al borrador.`);
  };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setLocationQuery("");
    setDebouncedLocationQuery("");
    form.setFieldsValue({
      objetivo: "mensajes",
      destino: "whatsapp",
      connection_id: cuentasMeta[0]?.connection_id ?? null,
      media_type: "image",
    });
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
      creative_url: row.creative_url,
      media_type: row.media_type ?? undefined,
      meta_page_id: row.meta_page_id,
      meta_instagram_id: row.meta_instagram_id,
      target_location_key: row.target_location_key,
      target_location_name: row.target_location_name,
      target_location_country_code: row.target_location_country_code,
      privacy_policy_url: row.privacy_policy_url,
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
      connection_id: values.connection_id ?? null,
      titulo: parsed.data.titulo ?? null,
      cta: parsed.data.cta ?? null,
      presupuesto_maximo: parsed.data.presupuesto_maximo,
      moneda:
        cuentasMeta.find((item) => item.connection_id === values.connection_id)?.account_currency ?? "USD",
      duration_days: values.fechas
        ? Number(((values.fechas[1].valueOf() - values.fechas[0].valueOf()) / 86_400_000).toFixed(2))
        : null,
      creative_url: values.creative_url?.trim() || null,
      media_type: values.media_type ?? null,
      meta_page_id: values.meta_page_id ?? null,
      meta_page_name: metaPages?.find((page) => page.id === values.meta_page_id)?.name ?? null,
      meta_instagram_id: values.meta_instagram_id ?? null,
      target_location_key: values.target_location_key ?? null,
      target_location_name:
        metaLocations?.find((location) => location.key === values.target_location_key)?.name ??
        values.target_location_name ??
        null,
      target_location_country_code:
        metaLocations?.find((location) => location.key === values.target_location_key)?.country_code?.toUpperCase() ??
        values.target_location_country_code ??
        null,
      privacy_policy_url: values.privacy_policy_url?.trim() || null,
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
      await solicitarAprobacion.mutateAsync(id);
      message.success("Campaña enviada a revisión. Meta no recibe anuncios antes de la aprobación explícita.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "La campaña no pudo validarse.");
    }
  };

  const handleSolicitarAprobacion = async (campaignId: string) => {
    try {
      await solicitarAprobacion.mutateAsync(campaignId);
      message.success("Campaña enviada a revisión.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo solicitar la aprobación.");
    }
  };

  const handleAprobar = async (campaignId: string) => {
    try {
      await aprobarCampana.mutateAsync(campaignId);
      message.success("Campaña aprobada. La publicación pausada ahora está habilitada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo aprobar la campaña.");
    }
  };

  const handleSincronizarEstadoMeta = async (campaignId: string) => {
    try {
      const campaign = await sincronizarEstadoMeta.mutateAsync(campaignId);
      message.success(`Estado actualizado desde Meta: ${campaign.estado}.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo sincronizar el estado con Meta.");
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
      const storageKey = publishStorageKey(row.campaign_id);
      const idempotencyKey = sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
      sessionStorage.setItem(storageKey, idempotencyKey);
      const resultado = await publicarCampana.mutateAsync({
        campaignId: row.campaign_id,
        idempotencyKey,
      });
      sessionStorage.removeItem(storageKey);
      if (resultado.simulado) {
        message.warning("La API está en modo simulado: no se creó ninguna campaña real en Meta.");
      } else if (resultado.replayed) {
        message.success(`Resultado de publicación recuperado (ID: ${resultado.meta_campaign_id}).`);
      } else {
        message.success(`Campaña enviada a Meta y creada pausada (ID: ${resultado.meta_campaign_id}).`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo enviar la campaña a Meta.");
    }
  };

  const handleExportDrafts = () => {
    try {
      exportDrafts(campanas ?? []);
      message.success("Borradores exportados. Puedes compartir el archivo manualmente mientras Meta está pendiente.");
    } catch (error) {
      message.warning(error instanceof Error ? error.message : "No se pudieron exportar los borradores.");
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
          {row.estado === "approved" && !row.meta_campaign_id && (
            <Popconfirm
              title="¿Enviar campaña a Meta?"
              description="La aprobación ya quedó registrada. La campaña, conjunto y anuncio se crearán PAUSED y no iniciarán gasto."
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
                  message.success("Validación correcta. Ahora envía el borrador a aprobación.");
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
          {row.estado === "validated" && (
            <Popconfirm
              title="¿Solicitar aprobación?"
              description="Un propietario o administrador debe aprobarlo antes de publicarlo."
              okText="Solicitar"
              cancelText="Cancelar"
              onConfirm={() => handleSolicitarAprobacion(row.campaign_id)}
            >
              <button type="button" className="btn btn-soft" style={{ padding: "6px 10px", fontSize: 11 }}>
                Solicitar aprobación
              </button>
            </Popconfirm>
          )}
          {row.estado === "awaiting_approval" && (
            <Popconfirm
              title="¿Aprobar esta campaña?"
              description="Esto habilita su publicación pausada en Meta, no inicia gasto."
              okText="Aprobar"
              cancelText="Cancelar"
              onConfirm={() => handleAprobar(row.campaign_id)}
            >
              <button type="button" className="btn btn-primary" style={{ padding: "6px 10px", fontSize: 11 }}>
                <CheckOutlined /> Aprobar
              </button>
            </Popconfirm>
          )}
          {["published_paused", "active"].includes(row.estado) && (
            <button
              type="button"
              className="btn btn-soft"
              style={{ padding: "6px 10px", fontSize: 11 }}
              onClick={() => void handleSincronizarEstadoMeta(row.campaign_id)}
              disabled={sincronizarEstadoMeta.isPending}
            >
              Sincronizar Meta
            </button>
          )}
          {["local_draft", "validated"].includes(row.estado) && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: "6px 11px", fontSize: 11 }}
              onClick={() => openEdit(row)}
            >
              <EditOutlined /> Editar
            </button>
          )}
          {["local_draft", "validated"].includes(row.estado) && (
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
          )}
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
          <button type="button" className="btn btn-outline" onClick={handleExportDrafts}>
            <DownloadOutlined /> Exportar borradores
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nueva campaña
          </button>
        </div>
      </div>

      <div className="notice">
        <strong>Aprobación explícita antes de publicar.</strong> Los borradores pueden exportarse sin
        permisos de Meta; tras la aprobación, los recursos se crean pausados.
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
              <div className="field full">
                <span className="lbl">Cuenta publicitaria de Meta</span>
                <Form.Item name="connection_id" noStyle>
                  <Select
                    allowClear
                    placeholder={
                      cuentasMeta.length
                        ? "Selecciona la cuenta publicitaria"
                        : "Conecta una cuenta desde Configuración"
                    }
                    options={cuentasMeta.map((conexion) => ({
                      value: conexion.connection_id,
                      label: `${conexion.nombre_cuenta} · ${conexion.cuenta_publicitaria_id}`,
                    }))}
                    onChange={() =>
                      form.setFieldsValue({
                        meta_page_id: undefined,
                        meta_instagram_id: undefined,
                        target_location_key: undefined,
                        target_location_name: undefined,
                        target_location_country_code: undefined,
                      })
                    }
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Página de Facebook</span>
                <Form.Item name="meta_page_id" noStyle>
                  <Select
                    loading={loadingMetaPages}
                    allowClear
                    placeholder="Selecciona una página administrada"
                    options={(metaPages ?? []).map((page) => ({ value: page.id, label: page.name }))}
                    onChange={() =>
                      form.setFieldsValue({ meta_instagram_id: undefined })
                    }
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Instagram vinculado</span>
                <Form.Item name="meta_instagram_id" noStyle>
                  <Select
                    allowClear
                    placeholder="Opcional"
                    options={(metaPages ?? [])
                      .filter((page) => page.id === selectedPageId && page.instagram_business_account)
                      .map((page) => ({
                        value: page.instagram_business_account?.id,
                        label: page.instagram_business_account?.username
                          ? `@${page.instagram_business_account.username}`
                          : page.instagram_business_account?.id,
                      }))}
                  />
                </Form.Item>
              </div>

              <div className="field full">
                <span className="lbl">Ciudad Meta · categoría especial de vivienda</span>
                <Form.Item name="target_location_key" noStyle>
                  <Select
                    showSearch
                    filterOption={false}
                    onSearch={setLocationQuery}
                    loading={loadingMetaLocations}
                    placeholder="Busca y selecciona la ciudad de la propiedad"
                    notFoundContent={debouncedLocationQuery.length < 2 ? "Escribe al menos dos caracteres" : "Sin resultados"}
                    options={(metaLocations ?? [])
                      .filter((location) => location.country_code)
                      .map((location) => ({
                        value: location.key,
                        label: [location.name, location.region, location.country_name].filter(Boolean).join(", "),
                      }))}
                    onChange={(key) => {
                      const location = metaLocations?.find((item) => item.key === key);
                      form.setFieldsValue({
                        target_location_name: location?.name ?? null,
                        target_location_country_code: location?.country_code?.toUpperCase() ?? null,
                      });
                    }}
                  />
                </Form.Item>
                {metaLocationsError && (
                  <span style={{ color: "#b42318", fontSize: 12 }}>{metaLocationsError.message}</span>
                )}
              </div>

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
                <span className="lbl">Creativo aprobado · URL pública HTTPS</span>
                <Form.Item name="creative_url" noStyle>
                  <Input type="url" placeholder="https://..." />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Formato del creativo</span>
                <Form.Item name="media_type" noStyle>
                  <Select
                    allowClear
                    options={[
                      { value: "image", label: "Imagen" },
                      { value: "video", label: "Video" },
                    ]}
                  />
                </Form.Item>
              </div>

              <div className="field">
                <span className="lbl">Política de privacidad · HTTPS</span>
                <Form.Item name="privacy_policy_url" noStyle>
                  <Input type="url" placeholder="https://tu-dominio.com/privacidad" />
                </Form.Item>
              </div>

              <div className="field full">
                <span className="lbl">Público objetivo para la estrategia</span>
                <Form.Item name="publico_objetivo" noStyle rules={[{ required: true, min: 2, max: 500, message: "Describe el público objetivo (2 a 500 caracteres)." }]}>
                  <Input maxLength={500} placeholder="Ej: Familias que buscan vivienda cerca de servicios" />
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
                <button
                  type="button"
                  className="btn btn-soft"
                  style={{ marginTop: 8 }}
                  onClick={() => void handleGenerarEstrategia()}
                  disabled={strategyPending || !propertyId || !objetivo || !presupuesto || !publicoObjetivo?.trim()}
                >
                  <BulbOutlined /> {strategyPending ? "Generando…" : "Generar estrategia y variantes A/B"}
                </button>
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
        Solo las campañas aprobadas pueden enviarse a Meta. La API crea todos los recursos en PAUSED;
        la activación del gasto se hace aparte en Ads Manager.
      </p>

      <Modal
        title={`Estrategia comercial · ${estrategia?.propiedad ?? ""}`}
        open={Boolean(estrategia)}
        onCancel={() => setEstrategia(null)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        {estrategia && (
          <div style={{ display: "grid", gap: 16 }}>
            <p>
              Propuestas construidas únicamente con los datos registrados en la ficha. Revisa y
              confirma precio, disponibilidad y condiciones antes de publicar.
            </p>
            <div className="card card-pad" style={{ display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0 }}>Contexto de la estrategia</h3>
              <p style={{ margin: 0 }}><strong>Presupuesto diario:</strong> {estrategia.presupuesto == null ? "—" : formatPrecio(estrategia.presupuesto)}</p>
              <p style={{ margin: 0 }}><strong>Público objetivo:</strong> {estrategia.publico_objetivo ?? "—"}</p>
              {estrategia.generador_version && <p style={{ margin: 0 }}><strong>Versión del generador:</strong> {estrategia.generador_version}</p>}
              {estrategia.estrategia_id != null && <p style={{ margin: 0 }}><strong>Registro de auditoría:</strong> #{estrategia.estrategia_id}{estrategia.creado_en ? ` · ${formatFecha(estrategia.creado_en)}` : ""}</p>}
              <div>
                <strong>Datos confirmados de la ficha</strong>
                {Object.keys(estrategia.datos_confirmados ?? {}).length ? (
                  <ul>{Object.entries(estrategia.datos_confirmados ?? {}).map(([field, value]) => <li key={field}><strong>{field.replaceAll("_", " ")}:</strong> {String(value)}</li>)}</ul>
                ) : <p className="sub">La ficha no contiene datos confirmados.</p>}
              </div>
              <div>
                <strong>Datos faltantes</strong>
                {estrategia.datos_faltantes?.length ? <ul>{estrategia.datos_faltantes.map((field) => <li key={field}>{field.replaceAll("_", " ")}</li>)}</ul> : <p className="sub">No se identificaron campos faltantes.</p>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {estrategia.variantes_ab.map((variant) => (
                <div key={variant.variante} className="card card-pad">
                  <p className="eyebrow">Variante {variant.variante} · {variant.enfoque}</p>
                  <h3>{variant.titular}</h3>
                  <p><strong>Copy corto:</strong> {variant.copy_corto}</p>
                  <p><strong>Copy largo:</strong> {variant.copy_largo}</p>
                  <p><strong>CTA:</strong> {variant.cta}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => aplicarVariante(variant)}
                  >
                    Usar variante {variant.variante}
                  </button>
                </div>
              ))}
            </div>
            <section>
              <h3>Ángulos recomendados</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {estrategia.angulos.map((angle) => <div className="notice" key={angle.id}><strong>{angle.nombre}</strong><p>{angle.enfoque}</p><p>{angle.copy_sugerido}</p></div>)}
              </div>
              <h3>Guion audiovisual</h3>
              <p>{estrategia.guion_audiovisual}</p>
              <h3>Formatos recomendados</h3>
              <p>{estrategia.formatos_recomendados.join(" · ")}</p>
              <h3>Guion de 15 segundos</h3>
              <p>{estrategia.guion_15s}</p>
              <h3>Guion de 30 segundos</h3>
              <p>{estrategia.guion_30s}</p>
              <h3>Checklist antes de publicar</h3>
              <ul>{estrategia.checklist_editorial.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            {estrategia.advertencias.length > 0 && (
              <div className="notice">
                <strong>Revisión editorial</strong>
                <ul>{estrategia.advertencias.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
