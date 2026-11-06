import { useEffect, useMemo, useState } from "react";
import { Alert, App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Spin } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Generacion } from "@/domain/generacion";
import type { CampanaCreate } from "@/domain/campana";
import {
  useConexiones,
  useCreateCampana,
  useGeneracion,
  useMetaAdLocations,
  useMetaPages,
  useModelos,
  usePropiedades,
  useSolicitarAprobacionCampana,
  useUpdateCampana,
  useValidarCampana,
} from "@/presentation/hooks";

interface FormValues {
  nombre: string;
  connection_id: string;
  meta_page_id: string;
  meta_instagram_id?: string;
  target_location_key: string;
  presupuesto_maximo: number;
  fechas: [Dayjs, Dayjs];
  titulo: string;
  copy: string;
  privacy_policy_url: string;
}

interface CrearAnuncioMetaModalProps {
  generation: Generacion | null;
  onClose: () => void;
}

const HTTPS_URL = /^https:\/\/\S+$/i;

export function CrearAnuncioMetaModal({ generation, onClose }: CrearAnuncioMetaModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [connectionId, setConnectionId] = useState<string>();
  const [locationQuery, setLocationQuery] = useState("");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const {
    data: currentGeneration,
    isLoading: checkingGeneration,
    error: generationError,
    refetch,
  } = useGeneracion(generation?.generation_id);
  const { data: connections } = useConexiones();
  const { data: pages, isLoading: loadingPages, error: pagesError } = useMetaPages(connectionId);
  const {
    data: locations,
    isLoading: loadingLocations,
    error: locationsError,
  } = useMetaAdLocations(connectionId, debouncedLocationQuery);
  const { data: properties } = usePropiedades();
  const { data: models } = useModelos();
  const createCampaign = useCreateCampana();
  const updateCampaign = useUpdateCampana();
  const validateCampaign = useValidarCampana();
  const requestApproval = useSolicitarAprobacionCampana();

  const activeConnections = (connections ?? []).filter(
    (item) => item.estado === "conectada" && item.autenticada,
  );
  const accountCurrency =
    activeConnections.find((item) => item.connection_id === connectionId)?.account_currency ?? null;
  const model = useMemo(
    () => models?.find((item) => item.model_id === currentGeneration?.model_id),
    [currentGeneration?.model_id, models],
  );
  const mediaType = model?.media_type;
  const selectedGenerationId = generation?.generation_id;
  const currentGenerationId = currentGeneration?.generation_id;
  const currentPrompt = currentGeneration?.prompt;
  const resultUrl =
    typeof currentGeneration?.parametros?.result_url === "string"
      ? currentGeneration.parametros.result_url
      : "";
  const isPublicHttpsMedia = /^https:\/\/\S+$/i.test(resultUrl);
  const property = properties?.find(
    (item) => item.propiedad_id === currentGeneration?.property_id,
  );
  const locationSearch = locationQuery || property?.ubicacion || "";
  const canCreate =
    currentGeneration?.status === "completed" &&
    isPublicHttpsMedia &&
    Boolean(mediaType);
  const saving =
    createCampaign.isPending ||
    updateCampaign.isPending ||
    validateCampaign.isPending ||
    requestApproval.isPending;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedLocationQuery(locationSearch), 300);
    return () => window.clearTimeout(timer);
  }, [locationSearch]);

  useEffect(() => {
    if (!selectedGenerationId || !currentGenerationId || !currentPrompt) return;
    const propertyName = property?.nombre ?? "inmobiliario";
    form.setFieldsValue({
      nombre: `Anuncio ${propertyName}`,
      titulo: property?.nombre ?? "",
      copy: currentPrompt.slice(0, 500),
      presupuesto_maximo: 5,
      fechas: [dayjs().add(1, "day").startOf("hour"), dayjs().add(8, "day").startOf("hour")],
    });
  }, [
    currentGenerationId,
    currentPrompt,
    form,
    selectedGenerationId,
    property?.nombre,
  ]);

  const submitForApproval = async (campaignId: string) => {
    try {
      await validateCampaign.mutateAsync(campaignId);
      await requestApproval.mutateAsync(campaignId);
      message.success("Borrador enviado a aprobación. No se ha creado ni publicado nada en Meta.");
      onClose();
    } catch (error) {
      message.error(
        error instanceof Error
          ? `El borrador quedó guardado, pero no pudo enviarse a aprobación: ${error.message}`
          : "El borrador quedó guardado, pero no pudo enviarse a aprobación.",
      );
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!currentGeneration || !resultUrl || !mediaType) {
      message.error("La generación todavía no tiene un archivo listo para anunciar.");
      return;
    }
    const [start, end] = values.fechas;
    const payload: CampanaCreate = {
      nombre: values.nombre,
      property_id: currentGeneration.property_id,
      connection_id: values.connection_id,
      objetivo: "formularios",
      destino: "formulario",
      presupuesto_maximo: values.presupuesto_maximo,
      moneda: accountCurrency ?? "",
      fecha_inicio: start.toISOString(),
      fecha_fin: end.toISOString(),
      titulo: values.titulo,
      copy: values.copy,
      cta: "SIGN_UP",
      creative_url: resultUrl,
      duration_days: Number((end.valueOf() - start.valueOf()) / 86_400_000),
      meta_page_id: values.meta_page_id,
      meta_page_name: pages?.find((page) => page.id === values.meta_page_id)?.name ?? null,
      meta_instagram_id: values.meta_instagram_id || null,
      target_location_key: values.target_location_key,
      target_location_name:
        locations?.find((location) => location.key === values.target_location_key)?.name ?? null,
      target_location_country_code:
        locations?.find((location) => location.key === values.target_location_key)?.country_code?.toUpperCase() ?? null,
      privacy_policy_url: values.privacy_policy_url,
      media_type: mediaType,
    };

    try {
      if (draftId) {
        await updateCampaign.mutateAsync({ id: draftId, data: payload });
        await submitForApproval(draftId);
        return;
      }
      const campaign = await createCampaign.mutateAsync(payload);
      setDraftId(campaign.campaign_id);
      await submitForApproval(campaign.campaign_id);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el borrador del anuncio.");
    }
  };

  const reset = () => {
    setDraftId(null);
    setConnectionId(undefined);
    setLocationQuery("");
    setDebouncedLocationQuery("");
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Crear anuncio de formulario en Meta"
      open={Boolean(generation)}
      onCancel={reset}
      footer={null}
      destroyOnHidden
      width={720}
    >
      {generation && (
        <Spin spinning={checkingGeneration}>
          <div style={{ display: "grid", gap: 16 }}>
            {generationError ? (
              <Alert
                type="error"
                showIcon
                message="No se pudo consultar la generación"
                description={generationError.message}
                action={
                  <Button size="small" onClick={() => void refetch()}>
                    Reintentar
                  </Button>
                }
              />
            ) : !canCreate ? (
              <Alert
                type={currentGeneration?.status === "completed" ? "warning" : "info"}
                showIcon
                message={
                  currentGeneration?.status === "completed"
                    ? "El archivo generado no está disponible"
                    : `Generación ${currentGeneration?.status ?? "en revisión"}`
                }
                description={
                  currentGeneration?.status === "completed"
                    ? "No encontramos una URL pública HTTPS de imagen/video o no pudimos determinar su formato."
                    : "Se consultó el estado con Higgsfield. Actualiza para comprobar de nuevo; solo se pueden anunciar generaciones completadas."
                }
                action={
                  currentGeneration?.status !== "completed" ? (
                    <Button size="small" onClick={() => void refetch()}>
                      Actualizar estado
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <Alert
                  type="info"
                  showIcon
                  message={`${mediaType === "video" ? "Video" : "Imagen"} · ${property?.nombre ?? "Creativo generado"}`}
                  description="El creativo y los datos se guardarán como borrador para revisión explícita. No se creará nada en Meta hasta que una persona autorizada apruebe la campaña."
                />
                {mediaType === "video" ? (
                  <video src={resultUrl} controls style={{ width: "100%", maxHeight: 300 }} />
                ) : (
                  <img
                    src={resultUrl}
                    alt="Creativo generado para el anuncio"
                    style={{ width: "100%", maxHeight: 300, objectFit: "contain" }}
                  />
                )}
                {draftId && (
                  <Alert
                    type="warning"
                    showIcon
                    message={`Borrador ${draftId} guardado`}
                    description="No se ha publicado. Puedes reintentar el envío a aprobación."
                  />
                )}
                {connectionId && !accountCurrency && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Reconecta la cuenta publicitaria de Meta"
                    description="No recibimos la moneda de esta cuenta. Desconéctala y vuelve a conectarla antes de crear anuncios para evitar configurar un presupuesto incorrecto."
                  />
                )}
                {!activeConnections.length && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Conecta una cuenta publicitaria de Meta"
                    description="Ve a Configuración → Integraciones y conecta la cuenta de la empresa para continuar."
                  />
                )}
                {connectionId && !loadingPages && pages?.length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="No encontramos páginas de Facebook"
                    description="Vuelve a conectar Meta y otorga acceso a la página desde la configuración de Facebook Login for Business."
                  />
                )}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={(values) => void handleSubmit(values)}
                  disabled={!canCreate || saving}
                >
                  <Form.Item
                    label="Cuenta publicitaria"
                    name="connection_id"
                    rules={[{ required: true, message: "Selecciona la cuenta publicitaria." }]}
                  >
                    <Select
                      placeholder="Selecciona una cuenta Meta conectada"
                      options={activeConnections.map((item) => ({
                        value: item.connection_id,
                        label: `${item.nombre_cuenta}${item.account_currency ? ` · ${item.account_currency}` : ""}`,
                      }))}
                      onChange={(value) => {
                        setConnectionId(value);
                        form.setFieldsValue({ meta_page_id: undefined, target_location_key: undefined });
                      }}
                    />
                  </Form.Item>
                  {pagesError && (
                    <Alert
                      type="error"
                      showIcon
                      message="No se pudieron cargar las páginas"
                      description={pagesError.message}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form.Item
                    label="Página de Facebook"
                    name="meta_page_id"
                    rules={[{ required: true, message: "Selecciona la página que publicará el anuncio." }]}
                  >
                    <Select
                      loading={loadingPages}
                      placeholder="Selecciona una página administrada"
                      options={(pages ?? []).map((page) => ({ value: page.id, label: page.name }))}
                      onChange={() => form.setFieldsValue({ meta_instagram_id: undefined })}
                    />
                  </Form.Item>
                  <Form.Item label="Cuenta de Instagram vinculada (opcional)" name="meta_instagram_id">
                    <Select
                      allowClear
                      placeholder="Selecciona una cuenta vinculada a la página"
                      options={(pages ?? [])
                        .filter(
                          (page) =>
                            page.id === form.getFieldValue("meta_page_id") &&
                            page.instagram_business_account,
                        )
                        .map((page) => ({
                          value: page.instagram_business_account?.id,
                          label: page.instagram_business_account?.username
                            ? `@${page.instagram_business_account.username}`
                            : page.instagram_business_account?.id,
                        }))}
                    />
                  </Form.Item>
                  {locationsError && (
                    <Alert
                      type="error"
                      showIcon
                      message="No se pudieron buscar ubicaciones"
                      description={locationsError.message}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form.Item
                    label="Ciudad de la propiedad (segmentación especial de vivienda)"
                    name="target_location_key"
                    rules={[{ required: true, message: "Busca y selecciona una ciudad válida de Meta." }]}
                  >
                    <Select
                      showSearch
                      filterOption={false}
                      onSearch={setLocationQuery}
                      loading={loadingLocations}
                      placeholder="Escribe al menos dos caracteres"
                      notFoundContent={locationQuery.length < 2 ? "Escribe para buscar" : "Sin resultados"}
                      options={(locations ?? []).filter((location) => location.country_code).map((location) => ({
                        value: location.key,
                        label: [location.name, location.region, location.country_name]
                          .filter(Boolean)
                          .join(", "),
                      }))}
                    />
                  </Form.Item>
                  <Form.Item label="Nombre interno" name="nombre" rules={[{ required: true, min: 3, max: 120 }]}>
                    <Input maxLength={120} />
                  </Form.Item>
                  <Form.Item
                    label={`Presupuesto diario${accountCurrency ? ` (${accountCurrency})` : ""}`}
                    name="presupuesto_maximo"
                    rules={[{ required: true, type: "number", min: 2, message: "Meta requiere al menos 2 unidades por día." }]}
                  >
                    <InputNumber min={2} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Periodo del anuncio"
                    name="fechas"
                    rules={[
                      { required: true, message: "Selecciona fecha de inicio y fin." },
                      {
                        validator: async (_rule, value: [Dayjs, Dayjs] | undefined) => {
                          if (!value?.[0] || !value[1]) return;
                          if (value[0].isAfter(dayjs()) && value[1].isAfter(value[0])) return;
                          throw new Error("El inicio debe ser futuro y el fin posterior al inicio.");
                        },
                      },
                    ]}
                  >
                    <DatePicker.RangePicker
                      showTime
                      style={{ width: "100%" }}
                      disabledDate={(date) => date.isBefore(dayjs(), "day")}
                    />
                  </Form.Item>
                  <Form.Item label="Título del anuncio" name="titulo" rules={[{ required: true, max: 120 }]}>
                    <Input maxLength={120} />
                  </Form.Item>
                  <Form.Item label="Texto del anuncio" name="copy" rules={[{ required: true, min: 10, max: 500 }]}>
                    <Input.TextArea rows={4} maxLength={500} showCount />
                  </Form.Item>
                  <Form.Item
                    label="URL de política de privacidad"
                    name="privacy_policy_url"
                    rules={[
                      { required: true, message: "Meta requiere una política de privacidad pública." },
                      {
                        validator: async (_rule, value: string | undefined) => {
                          if (!value || HTTPS_URL.test(value)) return;
                          throw new Error("Ingresa una URL pública que empiece con https://");
                        },
                      },
                    ]}
                  >
                    <Input type="url" placeholder="https://tu-dominio.com/privacidad" />
                  </Form.Item>
                  <p style={{ color: "#66756f", fontSize: 12 }}>
                    El formulario instantáneo solicitará nombre, correo y teléfono. Los anuncios de vivienda
                    tienen segmentación restringida por las políticas de Meta.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={reset}>Cancelar</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      disabled={!canCreate || !accountCurrency}
                    >
                      {draftId ? "Reintentar envío a aprobación" : "Guardar y solicitar aprobación"}
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </div>
        </Spin>
      )}
    </Modal>
  );
}
