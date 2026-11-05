import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import {
  ApiOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  useCompletarOAuthMeta,
  useConexiones,
  useDeleteConexion,
  useDesconectarIntegracionEmpresa,
  useGuardarIntegracionEmpresa,
  useIniciarOAuthMeta,
  useIntegracionesEmpresa,
} from "@/presentation/hooks";
import { useAuth } from "@/presentation/auth/AuthProvider";
import type { Conexion } from "@/domain/conexion";
import type {
  EmpresaIntegracionConfig,
  GuardarIntegracionInput,
  IntegracionCatalogo,
} from "@/domain/identity";

interface IntegracionFormValues {
  referencia: string;
  entorno: "sandbox" | "produccion";
  api_key: string;
  app_secret?: string;
}

const ES_REST =
  String(import.meta.env.VITE_DATA_PROVIDER ?? "mock")
    .trim()
    .toLowerCase() === "rest";

let facebookSdkPromise: Promise<void> | null = null;

function loadFacebookSdk(): Promise<void> {
  const appId = import.meta.env.VITE_META_APP_ID?.trim();
  const version = import.meta.env.VITE_META_GRAPH_API_VERSION?.trim() || "v24.0";
  if (!appId) return Promise.reject(new Error("Configura VITE_META_APP_ID en frontend/.env."));

  const initialize = () => {
    if (!window.FB) throw new Error("El SDK de Facebook no quedó disponible.");
    window.FB.init({ appId, cookie: true, xfbml: true, version });
  };
  if (window.FB) {
    initialize();
    return Promise.resolve();
  }
  if (facebookSdkPromise) return facebookSdkPromise;

  facebookSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => {
      facebookSdkPromise = null;
      reject(new Error("No se pudo cargar el SDK de Facebook."));
    };
    window.fbAsyncInit = () => {
      try {
        initialize();
        resolve();
      } catch (error) {
        facebookSdkPromise = null;
        reject(error);
      }
    };
    document.head.appendChild(script);
  });
  return facebookSdkPromise;
}

export function IntegracionesEmpresaPanel() {
  const { message } = App.useApp();
  const { tienePermiso, perfil } = useAuth();
  const esAdministradorEmpresa = perfil?.roles.some((rol) =>
    ["propietario", "administrador"].includes(rol.nombre),
  );
  const puedeGestionar = tienePermiso("gestionar_integraciones") && Boolean(esAdministradorEmpresa);
  const { data, isLoading, error } = useIntegracionesEmpresa(ES_REST && puedeGestionar);
  const {
    data: conexiones,
    isLoading: conexionesLoading,
    error: conexionesError,
  } = useConexiones();
  const guardar = useGuardarIntegracionEmpresa();
  const desconectar = useDesconectarIntegracionEmpresa();
  const metaOAuth = useIniciarOAuthMeta();
  const refreshMetaOAuth = metaOAuth.refresh;
  const completarOAuth = useCompletarOAuthMeta();
  const eliminarConexion = useDeleteConexion();
  const facebookLoginButtonRef = useRef<HTMLDivElement>(null);
  const metaLoginResponseHandler = useRef<(response: MetaLoginResponse) => void>(() => undefined);
  const [form] = Form.useForm<IntegracionFormValues>();
  const [open, setOpen] = useState(false);
  const [facebookSdkReady, setFacebookSdkReady] = useState(false);
  const [facebookLoginStatus, setFacebookLoginStatus] = useState<
    "checking" | "connected" | "not_authorized" | "unknown"
  >("checking");
  const [facebookSdkError, setFacebookSdkError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<{
    integracion: IntegracionCatalogo;
    existente?: EmpresaIntegracionConfig;
  } | null>(null);

  const proveedores = useMemo(
    () =>
      (data?.catalogo ?? []).filter(
        (item) =>
          item.activa &&
          item.estado === "activo" &&
          item.nombre === "Higgsfield",
      ),
    [data?.catalogo],
  );
  const cuentasMeta = (conexiones ?? []).filter((item) => item.estado === "conectada");
  const metaLoginConfigId = import.meta.env.VITE_META_LOGIN_CONFIG_ID?.trim();
  const conexionDe = (integracionId: number) =>
    data?.conexiones.find((item) => item.integracion_id === integracionId);

  useEffect(() => {
    const url = new URL(window.location.href);
    const resultado = url.searchParams.get("meta");
    if (!resultado) return;

    const mensajes: Record<string, [string, "success" | "warning" | "error"]> = {
      connected: ["Cuenta(s) de Meta conectada(s).", "success"],
      cancelled: ["Cancelaste la conexión con Meta.", "warning"],
      no_accounts: ["Meta autorizó el acceso, pero no encontramos cuentas publicitarias activas.", "warning"],
      error: ["No se pudo completar la conexión con Meta. Inténtalo otra vez.", "error"],
    };
    const resultadoConocido = mensajes[resultado];
    if (resultadoConocido) message[resultadoConocido[1]](resultadoConocido[0]);

    url.searchParams.delete("meta");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [message]);

  useEffect(() => {
    if (!ES_REST || !puedeGestionar) return;
    void refreshMetaOAuth().catch(() => undefined);
  }, [puedeGestionar, refreshMetaOAuth]);

  useEffect(() => {
    if (!ES_REST || !puedeGestionar) return;
    let active = true;
    void loadFacebookSdk()
      .then(() => {
        if (!active || !window.FB) return;
        setFacebookSdkReady(true);
        window.FB.getLoginStatus((response) => {
          if (active) setFacebookLoginStatus(response.status);
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setFacebookSdkError(
            error instanceof Error ? error.message : "No se pudo inicializar Facebook Login.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [puedeGestionar]);

  useEffect(() => {
    const container = facebookLoginButtonRef.current;
    if (!facebookSdkReady || !metaOAuth.state || !metaLoginConfigId || !container || !window.FB) {
      return;
    }

    const checkLoginState = () => {
      window.FB?.getLoginStatus((response) => metaLoginResponseHandler.current(response));
    };
    window.checkLoginState = checkLoginState;
    const button = document.createElement("fb:login-button");
    button.setAttribute("config_id", metaLoginConfigId);
    button.setAttribute("onlogin", "checkLoginState();");
    container.replaceChildren(button);
    window.FB.XFBML.parse(container);

    return () => {
      if (window.checkLoginState === checkLoginState) {
        delete window.checkLoginState;
      }
      container.replaceChildren();
    };
  }, [facebookSdkReady, metaLoginConfigId, metaOAuth.state]);

  const configurar = (integracion: IntegracionCatalogo, existente?: EmpresaIntegracionConfig) => {
    setSeleccion({ integracion, existente });
    form.resetFields();
    form.setFieldsValue({
      referencia: existente?.referencia_credencial ?? integracion.nombre,
      entorno:
        existente?.configuracion_integracion?.entorno.toLowerCase() === "produccion"
          ? "produccion"
          : "sandbox",
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
        "https://api.higgsfield.ai",
      entorno: values.entorno,
      api_key: values.api_key.trim() || undefined,
      app_secret: values.app_secret?.trim() || undefined,
    };

    try {
      await guardar.mutateAsync(input);
      message.success(`${integracion.nombre} quedó configurado para esta empresa.`);
      setOpen(false);
    } catch (saveError) {
      message.error(
        saveError instanceof Error ? saveError.message : "No se pudo guardar la integración.",
      );
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

  const handleMetaLoginResponse = useCallback((response: MetaLoginResponse) => {
    const state = metaOAuth.state;
    const accessToken = response.authResponse?.accessToken;
    if (response.status !== "connected" || !accessToken) {
      setFacebookLoginStatus(response.status);
      message.warning("No se autorizó el acceso a Meta.");
      void refreshMetaOAuth().catch(() => undefined);
      return;
    }
    if (!state) {
      message.error("La autorización expiró. Inténtalo de nuevo.");
      void refreshMetaOAuth().catch(() => undefined);
      return;
    }

    setFacebookLoginStatus("connected");
    void completarOAuth
      .mutateAsync({ state, access_token: accessToken })
      .then((result) => {
        message.success(
          `Se conectaron ${result.accounts_connected} cuenta${result.accounts_connected === 1 ? "" : "s"} publicitaria${result.accounts_connected === 1 ? "" : "s"}.`,
        );
      })
      .catch((connectError: unknown) => {
        message.error(
          connectError instanceof Error
            ? connectError.message
            : "No se pudo completar la conexión con Meta.",
        );
      })
      .finally(() => {
        void refreshMetaOAuth().catch(() => undefined);
      });
  }, [completarOAuth, message, metaOAuth.state, refreshMetaOAuth]);

  useEffect(() => {
    metaLoginResponseHandler.current = handleMetaLoginResponse;
  }, [handleMetaLoginResponse]);

  const desconectarMeta = async (conexion: Conexion) => {
    try {
      await eliminarConexion.mutateAsync(conexion.connection_id);
      message.success(`Cuenta ${conexion.nombre_cuenta} desconectada.`);
    } catch (disconnectError) {
      message.error(
        disconnectError instanceof Error ? disconnectError.message : "No se pudo desconectar la cuenta.",
      );
    }
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div className="section-title" style={{ margin: "0 0 8px" }}>
        <h2 style={{ fontSize: 17 }}>Conexiones de esta empresa</h2>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>
        Conecta cuentas de Meta desde Facebook Login y configura las credenciales privadas de
        Higgsfield.
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
          description="La configuración está disponible para propietarios y administradores con permiso gestionar_integraciones."
        />
      ) : error ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las integraciones"
          description={error.message}
        />
      ) : conexionesError ? (
        <Alert
          type="error"
          showIcon
          message="No se pudieron cargar las cuentas de Meta"
          description={conexionesError.message}
        />
      ) : (
        <Spin spinning={isLoading || conexionesLoading}>
          <div style={{ display: "grid", gap: 12 }}>
            <div className="integration">
              <span className="connect-logo">
                <ApiOutlined />
              </span>
              <span className="info">
                <b>Meta Ads</b>
                <span>
                  {cuentasMeta.length
                    ? `${cuentasMeta.length} cuenta${cuentasMeta.length === 1 ? "" : "s"} conectada${cuentasMeta.length === 1 ? "" : "s"}`
                    : "Autoriza tu cuenta de Facebook para elegir una cuenta publicitaria."}
                </span>
                <span>El SDK comprueba tu sesión de Facebook. IMVOLT nunca solicita tu contraseña.</span>
              </span>
              <div ref={facebookLoginButtonRef} aria-busy={metaOAuth.isLoading || completarOAuth.isPending} />
            </div>
            {!import.meta.env.VITE_META_APP_ID && (
              <Alert
                type="warning"
                showIcon
                message="Configura VITE_META_APP_ID"
                description="Agrega el ID público de la app de Meta en frontend/.env y reinicia Vite."
              />
            )}
            {!metaLoginConfigId && (
              <Alert
                type="warning"
                showIcon
                message="Configura VITE_META_LOGIN_CONFIG_ID"
                description="Agrega el ID de la configuración de Facebook Login for Business en frontend/.env y reinicia Vite."
              />
            )}
            {facebookSdkError && (
              <Alert type="error" showIcon message="Facebook Login no está disponible" description={facebookSdkError} />
            )}
            {metaOAuth.error && (
              <Alert type="error" showIcon message="No se pudo preparar la autorización" description={metaOAuth.error.message} />
            )}
            {facebookSdkReady && facebookLoginStatus === "connected" && (
              <Alert
                type="info"
                showIcon
                message="Sesión de Facebook detectada"
                description="Usa el botón de Facebook para autorizar explícitamente las cuentas publicitarias de esta empresa."
              />
            )}
            {cuentasMeta.map((conexion) => (
              <div className="integration" key={conexion.connection_id}>
                <span className="connect-logo">
                  <ApiOutlined />
                </span>
                <span className="info">
                  <b>{conexion.nombre_cuenta}</b>
                  <span>ID de cuenta: {conexion.cuenta_publicitaria_id}</span>
                </span>
                <Tag color={conexion.autenticada ? "green" : "orange"}>
                  {conexion.autenticada ? "Conectada" : "Requiere reconexión"}
                </Tag>
                <Popconfirm
                  title={`¿Desconectar ${conexion.nombre_cuenta}?`}
                  description="Se eliminará el token guardado para esta cuenta."
                  okText="Desconectar"
                  cancelText="Cancelar"
                  onConfirm={() => void desconectarMeta(conexion)}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={eliminarConexion.isPending}
                  />
                </Popconfirm>
              </div>
            ))}

            {proveedores.map((integracion) => {
              const relacion = conexionDe(integracion.integracion_id);
              const conexion = relacion?.estado === "activo" ? relacion : undefined;
              const configuracion = conexion?.configuracion_integracion;

              return (
                <div className="integration" key={integracion.integracion_id}>
                  <span className="connect-logo"><CloudServerOutlined /></span>
                  <span className="info">
                    <b>{integracion.nombre}</b>
                    <span>
                      {conexion
                        ? `${conexion.referencia_credencial} · ${
                            configuracion?.entorno === "produccion" ? "Producción" : "Sandbox"
                          }`
                        : relacion
                          ? "Conexión desconectada"
                          : (integracion.descripcion ?? "Sin conectar")}
                    </span>
                    {conexion && (
                      <span>
                        Credenciales guardadas:{" "}
                        {[
                          configuracion?.api_key,
                          configuracion?.app_secret,
                          configuracion?.access_token,
                        ].filter(Boolean).length || 0}
                      </span>
                    )}
                  </span>
                  {conexion ? (
                    <Tag color={configuracion?.entorno === "produccion" ? "green" : "gold"}>
                      {configuracion?.entorno === "produccion" ? "Configurado" : "Sandbox"}
                    </Tag>
                  ) : relacion ? (
                    <Tag>Desconectado</Tag>
                  ) : (
                    <Tag>Sin configurar</Tag>
                  )}
                  <Space>
                    <Button
                      type="primary"
                      icon={conexion ? undefined : <PlusOutlined />}
                      onClick={() => configurar(integracion, relacion)}
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
          <Button type="primary" loading={guardar.isPending} onClick={() => void form.submit()}>
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
              description="Las credenciales se envían al API y se enmascaran en sus respuestas. La tabla las almacena sin cifrado de aplicación; limita el acceso a la base de datos."
            />

            <Form.Item
              name="referencia"
              label="Nombre de la conexión"
              rules={[{ required: true, whitespace: true, message: "Escribe un nombre." }]}
            >
              <Input
                maxLength={500}
                placeholder={seleccion.integracion.nombre}
                disabled={seleccion.existente?.estado === "activo"}
              />
            </Form.Item>

            <Form.Item name="entorno" label="Entorno" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "sandbox", label: "Sandbox — operaciones simuladas" },
                  { value: "produccion", label: "Producción — usa credenciales reales" },
                ]}
              />
            </Form.Item>

            <>
                <Form.Item
                  name="api_key"
                  label="Higgsfield API Key ID"
                  rules={[
                    {
                      required: !configuracionActual?.api_key,
                      whitespace: true,
                      message: "Ingresa el API Key ID.",
                    },
                  ]}
                  extra={configuracionActual?.api_key ? "Ya hay una clave guardada." : undefined}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  name="app_secret"
                  label="Higgsfield API Key Secret"
                  rules={[
                    {
                      required: !configuracionActual?.app_secret,
                      whitespace: true,
                      message: "Ingresa el API Key Secret.",
                    },
                  ]}
                  extra={
                    configuracionActual?.app_secret ? "Ya hay un secreto guardado." : undefined
                  }
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
            </>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
