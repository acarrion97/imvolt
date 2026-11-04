import { useMemo, useState } from "react";
import { Alert, App, Button, Drawer, Form, Input, Popconfirm, Select, Space, Spin, Tag } from "antd";
import { ApiOutlined, CloudServerOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  useDesconectarIntegracionEmpresa,
  useGuardarIntegracionEmpresa,
  useIntegracionesEmpresa,
} from "@/presentation/hooks";
import { useAuth } from "@/presentation/auth/AuthProvider";
import type {
  EmpresaIntegracionConfig,
  GuardarIntegracionInput,
  IntegracionCatalogo,
} from "@/domain/identity";

interface IntegracionFormValues {
  referencia: string;
  entorno: "sandbox" | "produccion";
  api_key: string;
  api_id?: string;
  app_secret?: string;
  access_token?: string;
}

const ES_REST = String(import.meta.env.VITE_DATA_PROVIDER ?? "mock").trim().toLowerCase() === "rest";

export function IntegracionesEmpresaPanel() {
  const { message } = App.useApp();
  const { tienePermiso } = useAuth();
  const puedeGestionar = tienePermiso("gestionar_integraciones");
  const { data, isLoading, error } = useIntegracionesEmpresa(ES_REST && puedeGestionar);
  const guardar = useGuardarIntegracionEmpresa();
  const desconectar = useDesconectarIntegracionEmpresa();
  const [form] = Form.useForm<IntegracionFormValues>();
  const [open, setOpen] = useState(false);
  const [seleccion, setSeleccion] = useState<{
    integracion: IntegracionCatalogo;
    existente?: EmpresaIntegracionConfig;
  } | null>(null);

  const proveedores = useMemo(
    () => (data?.catalogo ?? []).filter((item) => ["Higgsfield", "Meta Ads"].includes(item.nombre)),
    [data?.catalogo],
  );
  const conexionDe = (integracionId: number) =>
    data?.conexiones.find(
      (item) => item.integracion_id === integracionId && item.estado === "activo",
    );

  const configurar = (integracion: IntegracionCatalogo, existente?: EmpresaIntegracionConfig) => {
    setSeleccion({ integracion, existente });
    form.resetFields();
    form.setFieldsValue({
      referencia: existente?.referencia_credencial ?? integracion.nombre,
      entorno:
        existente?.configuracion_integracion?.entorno.toLowerCase() === "produccion"
          ? "produccion"
          : "sandbox",
      api_id:
        integracion.nombre === "Meta Ads"
          ? (existente?.configuracion_integracion?.api_id ?? "")?.replace(/^act_/, "")
          : undefined,
    });
    setOpen(true);
  };

  const guardarCambios = async (values: IntegracionFormValues) => {
    if (!seleccion) return;
    const integracion = seleccion.integracion;
    const input: GuardarIntegracionInput = {
      integracion,
      existente: seleccion.existente,
      referencia: values.referencia.trim(),
      url_base:
        integracion.nombre === "Higgsfield"
          ? "https://api.higgsfield.ai"
          : "https://graph.facebook.com",
      entorno: values.entorno,
      api_key: values.api_key.trim() || undefined,
      ...(integracion.nombre === "Meta Ads"
        ? { api_id: values.api_id?.trim() ? `act_${values.api_id.trim().replace(/^act_/, "")}` : undefined }
        : {}),
      app_secret: values.app_secret?.trim() || undefined,
      access_token: values.access_token?.trim() || undefined,
    };

    try {
      await guardar.mutateAsync(input);
      message.success(`${integracion.nombre} quedó configurado para esta empresa.`);
      setOpen(false);
    } catch (saveError) {
      message.error(saveError instanceof Error ? saveError.message : "No se pudo guardar la integración.");
    }
  };

  const desconectarIntegracion = async (conexion: EmpresaIntegracionConfig) => {
    try {
      await desconectar.mutateAsync(conexion);
      message.success(`${conexion.integracion?.nombre ?? "Integración"} desconectada.`);
    } catch (disconnectError) {
      message.error(
        disconnectError instanceof Error
          ? disconnectError.message
          : "No se pudo desconectar la integración.",
      );
    }
  };

  const configuracionActual = seleccion?.existente?.configuracion_integracion;
  const esNueva = !configuracionActual;
  const esHiggsfield = seleccion?.integracion.nombre === "Higgsfield";

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div className="section-title" style={{ margin: "0 0 8px" }}>
        <h2 style={{ fontSize: 17 }}>Conexiones de esta empresa</h2>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>
        Guarda aquí las credenciales privadas de tus proveedores. No se mostrarán de nuevo después
        de guardarlas.
      </p>

      {!ES_REST ? (
        <Alert
          type="info"
          showIcon
          message="Conecta el frontend al API para administrar integraciones"
          description='Esta función requiere VITE_DATA_PROVIDER="rest" y una sesión iniciada.'
        />
      ) : !puedeGestionar ? (
        <Alert
          type="warning"
          showIcon
          message="No tienes permiso para gestionar integraciones"
          description="Solicita el permiso gestionar_integraciones al administrador de tu empresa."
        />
      ) : error ? (
        <Alert type="error" showIcon message="No se pudieron cargar las integraciones" description={error.message} />
      ) : (
        <Spin spinning={isLoading}>
          <div style={{ display: "grid", gap: 12 }}>
            {proveedores.map((integracion) => {
              const conexion = conexionDe(integracion.integracion_id);
              const configuracion = conexion?.configuracion_integracion;
              const higgsfield = integracion.nombre === "Higgsfield";

              return (
                <div className="integration" key={integracion.integracion_id}>
                  <span className="connect-logo">
                    {higgsfield ? <CloudServerOutlined /> : <ApiOutlined />}
                  </span>
                  <span className="info">
                    <b>{integracion.nombre}</b>
                    <span>
                      {conexion
                        ? `${conexion.referencia_credencial} · ${
                            configuracion?.entorno === "produccion" ? "Producción" : "Sandbox"
                          }`
                        : integracion.descripcion ?? "Sin conectar"}
                    </span>
                    {conexion && (
                      <span>
                        Credenciales guardadas:{" "}
                        {[
                          configuracion?.api_key,
                          configuracion?.app_secret,
                          configuracion?.access_token,
                        ]
                          .filter(Boolean)
                          .length || 0}
                      </span>
                    )}
                  </span>
                  {conexion ? (
                    <Tag color={configuracion?.entorno === "produccion" ? "green" : "gold"}>
                      {configuracion?.entorno === "produccion" ? "Conectado" : "Sandbox"}
                    </Tag>
                  ) : (
                    <Tag>Sin configurar</Tag>
                  )}
                  <Space>
                    <Button
                      type="primary"
                      icon={conexion ? undefined : <PlusOutlined />}
                      onClick={() => configurar(integracion, conexion)}
                    >
                      {conexion ? "Actualizar" : "Configurar"}
                    </Button>
                    {conexion && (
                      <Popconfirm
                        title={`¿Desconectar ${integracion.nombre}?`}
                        description="Se eliminarán el vínculo y las credenciales guardadas."
                        okText="Desconectar"
                        cancelText="Cancelar"
                        onConfirm={() => void desconectarIntegracion(conexion)}
                      >
                        <Button danger icon={<DeleteOutlined />} loading={desconectar.isPending} />
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              );
            })}
            {!isLoading && proveedores.length === 0 && (
              <Alert
                type="warning"
                showIcon
                message="No hay proveedores disponibles en el catálogo"
                description="Verifica que la semilla de integraciones esté aplicada en la base de datos."
              />
            )}
          </div>
        </Spin>
      )}

      <Drawer
        title={`${seleccion?.existente ? "Actualizar" : "Configurar"} ${seleccion?.integracion.nombre ?? "integración"}`}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        extra={
          <Button
            type="primary"
            loading={guardar.isPending}
            onClick={() => void form.submit()}
          >
            Guardar conexión
          </Button>
        }
      >
        {seleccion && (
          <Form<IntegracionFormValues>
            form={form}
            layout="vertical"
            onFinish={(values) => void guardarCambios(values)}
            requiredMark="optional"
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 18 }}
              message={
                esNueva
                  ? "Ingresa las credenciales del proveedor."
                  : "Deja un campo secreto vacío para conservar la credencial actual."
              }
              description="Las credenciales se envían únicamente al API y aparecen enmascaradas en la base de datos y en las respuestas."
            />

            <Form.Item
              name="referencia"
              label="Nombre de la conexión"
              rules={[{ required: true, whitespace: true, message: "Escribe un nombre." }]}
            >
              <Input maxLength={500} placeholder={seleccion.integracion.nombre} />
            </Form.Item>

            <Form.Item name="entorno" label="Entorno" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "sandbox", label: "Sandbox — operaciones simuladas" },
                  { value: "produccion", label: "Producción — usa credenciales reales" },
                ]}
              />
            </Form.Item>

            {esHiggsfield ? (
              <>
                <Form.Item
                  name="api_key"
                  label="Higgsfield API Key ID"
                  rules={[{ required: esNueva, whitespace: true, message: "Ingresa el API Key ID." }]}
                  extra={configuracionActual?.api_key ? "Ya hay una clave guardada." : undefined}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  name="app_secret"
                  label="Higgsfield API Key Secret"
                  rules={[
                    {
                      required: esNueva,
                      whitespace: true,
                      message: "Ingresa el API Key Secret.",
                    },
                  ]}
                  extra={configuracionActual?.app_secret ? "Ya hay un secreto guardado." : undefined}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  name="api_key"
                  label="Meta App ID"
                  rules={[{ required: esNueva, whitespace: true, message: "Ingresa el App ID." }]}
                  extra={configuracionActual?.api_key ? "Ya hay un App ID guardado." : undefined}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  name="api_id"
                  label="ID de cuenta publicitaria"
                  rules={[{ required: true, whitespace: true, message: "Ingresa el ID de cuenta." }]}
                  extra="Puedes copiarlo con o sin el prefijo act_."
                >
                  <Input placeholder="123456789" />
                </Form.Item>
                <Form.Item
                  name="access_token"
                  label="Token de acceso de Meta"
                  rules={[
                    {
                      required: esNueva,
                      whitespace: true,
                      message: "Ingresa el token de acceso.",
                    },
                  ]}
                  extra={configuracionActual?.access_token ? "Ya hay un token guardado." : undefined}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Drawer>
    </div>
  );
}
