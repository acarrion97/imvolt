import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  CheckCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import {
  useConexiones,
  useDeleteConexion,
  useDesconectarIntegracionEmpresa,
  useGuardarIntegracionEmpresa,
  useIniciarOAuthMeta,
  useIntegracionesEmpresa,
  useSincronizarLotesAlMando,
} from "@/presentation/hooks";
import { resolveApiUrl } from "@/infrastructure/http/apiUrl";
import { http } from "@/infrastructure/http/httpClient";
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
  const sincronizarLotes = useSincronizarLotesAlMando();
  const desconectar = useDesconectarIntegracionEmpresa();
  const metaOAuth = useIniciarOAuthMeta();
  const refreshMetaOAuth = metaOAuth.refresh;
  const eliminarConexion = useDeleteConexion();
  const [form] = Form.useForm<IntegracionFormValues>();
  const [open, setOpen] = useState(false);
  const [seleccion, setSeleccion] = useState<{
    integracion: IntegracionCatalogo;
    existente?: EmpresaIntegracionConfig;
  } | null>(null);
  const [threadsAccount, setThreadsAccount] = useState<{
    username: string;
    id: string;
    connected_at?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("imvolt_threads_account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const proveedores = useMemo(
    () =>
      (data?.catalogo ?? []).filter(
        (item) =>
          item.activa &&
          item.estado === "activo" &&
          item.nombre === "Lotes al Mando",
      ),
    [data?.catalogo],
  );
  const cuentasMeta = (conexiones ?? []).filter((item) => item.estado === "conectada");
  const metaLoginConfigId = import.meta.env.META_LOGIN_CONFIG_ID?.trim();
  const whatsappStatus = useQuery({
    queryKey: ["whatsapp_webhook_status"],
    queryFn: () =>
      http.get<{
        webhook_configured: boolean;
        signature_validation: boolean;
        receives_events: boolean;
        stores_messages: boolean;
        processes_messages: boolean;
      }>("/webhooks/whatsapp/status"),
    enabled: ES_REST,
    retry: false,
    staleTime: 60_000,
  });
  const whatsappMessages = useQuery({
    queryKey: ["whatsapp_messages"],
    queryFn: () =>
      http.get<Array<{
        message_id: number;
        sender_phone: string;
        sender_name: string | null;
        message_type: string;
        message_text: string | null;
        meta_timestamp: string | null;
        recibido_en: string;
      }>>("/v1/whatsapp/messages"),
    enabled: ES_REST && puedeGestionar,
    retry: false,
    refetchInterval: 15_000,
  });
  const conexionDe = (integracionId: number) =>
    data?.conexiones.find((item) => item.integracion_id === integracionId);

  useEffect(() => {
    const url = new URL(window.location.href);
    const resultado = url.searchParams.get("meta");
    if (resultado) {
      const mensajes: Record<string, [string, "success" | "warning" | "error"]> = {
        connected: ["Cuenta(s) de Meta conectada(s).", "success"],
        connected_limited: ["Autorización de Meta guardada para pruebas. Faltan ads_read y ads_management; las funciones de anuncios siguen deshabilitadas.", "warning"],
        cancelled: ["Cancelaste la conexión con Meta.", "warning"],
        no_accounts: ["Meta autorizó el acceso, pero no encontramos cuentas publicitarias activas.", "warning"],
        error: ["No se pudo completar la conexión con Meta. Inténtalo otra vez.", "error"],
      };
      const resultadoConocido = mensajes[resultado];
      if (resultadoConocido) message[resultadoConocido[1]](resultadoConocido[0]);
      url.searchParams.delete("meta");
    }

    const threadsRes = url.searchParams.get("threads");
    if (threadsRes) {
      if (threadsRes === "connected") {
        const username = url.searchParams.get("threads_username") || "";
        const id = url.searchParams.get("threads_id") || "";
        const account = { username, id, connected_at: new Date().toISOString() };
        setThreadsAccount(account);
        try {
          localStorage.setItem("imvolt_threads_account", JSON.stringify(account));
        } catch {
          // ignore
        }
        message.success(`Cuenta de Threads @${username || "autorizada"} conectada con éxito.`);
      } else if (threadsRes === "cancelled") {
        message.warning("Cancelaste la conexión con Threads.");
      } else if (threadsRes === "error") {
        message.error("No se pudo completar la conexión con Threads. Revisa la configuración del API.");
      }
      url.searchParams.delete("threads");
      url.searchParams.delete("threads_username");
      url.searchParams.delete("threads_id");
    }

    if (resultado || threadsRes) {
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [message]);

  useEffect(() => {
    if (!ES_REST || !puedeGestionar) return;
    void refreshMetaOAuth().catch(() => undefined);
  }, [puedeGestionar, refreshMetaOAuth]);

  const configurar = (integracion: IntegracionCatalogo, existente?: EmpresaIntegracionConfig) => {
    setSeleccion({ integracion, existente });
    form.resetFields();
    form.setFieldsValue({
      referencia: existente?.referencia_credencial ?? integracion.nombre,
      entorno:
        integracion.nombre === "Lotes al Mando" ||
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
      url_base: "https://lotes-al-mando-api.onrender.com",
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

  const sincronizarInventario = async () => {
    try {
      const resultado = await sincronizarLotes.mutateAsync();
      const omitidos =
        resultado.lotes_sin_precio_omitidos + resultado.lotes_sin_proyecto_omitidos;
      const detalleOmitidos = omitidos
        ? ` Se omitieron ${resultado.lotes_sin_precio_omitidos} sin precio y ${resultado.lotes_sin_proyecto_omitidos} sin relación de proyecto.`
        : "";
      message.success(
        `Sincronizados ${resultado.proyectos_sincronizados} proyectos y ${resultado.lotes_sincronizados} lotes.${detalleOmitidos}`,
        8,
      );
    } catch (syncError) {
      message.error(
        syncError instanceof Error
          ? syncError.message
          : "No se pudo sincronizar el inventario de Lotes al Mando.",
      );
    }
  };

  const configuracionActual = seleccion?.existente?.configuracion_integracion;
  const esNueva = !configuracionActual;

  const iniciarMetaLogin = () => {
    if (!metaLoginConfigId || !metaOAuth.state) {
      if (!metaOAuth.state) void refreshMetaOAuth().catch(() => undefined);
      return;
    }

    try {
      const appId = import.meta.env.META_APP_ID?.trim();
      const apiBase = resolveApiUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);
      if (!appId) throw new Error("Configura META_APP_ID en frontend/.env.");
      if (!apiBase) throw new Error("Configura VITE_API_URL en frontend/.env.");

      const version = import.meta.env.META_GRAPH_API_VERSION?.trim() || "v24.0";
      const dialog = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
      dialog.searchParams.set("client_id", appId);
      // Debe coincidir EXACTAMENTE con config.metaOAuth.callbackUrl del API
      // (PUBLIC_API_URL + /api/v1/…); VITE_API_URL es PUBLIC_API_URL + /api.
      dialog.searchParams.set("redirect_uri", `${apiBase}/v1/conexiones/meta/oauth/callback`);
      dialog.searchParams.set("config_id", metaLoginConfigId);
      // Facebook Login for Business no admite response_type=token: exige code
      // y el intercambio del código ocurre en el servidor.
      dialog.searchParams.set("response_type", "code");
      dialog.searchParams.set("state", metaOAuth.state);
      window.location.assign(dialog.toString());
    } catch (loginError) {
      message.error(
        loginError instanceof Error ? loginError.message : "No se pudo iniciar Facebook Login.",
      );
    }
  };

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

  const iniciarThreadsOAuth = () => {
    try {
      const apiBase = resolveApiUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);
      if (!apiBase) throw new Error("Configura VITE_API_URL en frontend/.env.");
      window.location.assign(`${apiBase}/v1/threads/oauth/start`);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "No se pudo iniciar la conexión con Threads.",
      );
    }
  };

  const desconectarThreads = () => {
    setThreadsAccount(null);
    try {
      localStorage.removeItem("imvolt_threads_account");
    } catch {
      // ignore
    }
    message.success("Cuenta de Threads desconectada.");
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div className="section-title" style={{ margin: "0 0 8px" }}>
        <h2 style={{ fontSize: 17 }}>Conexiones de esta empresa</h2>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>
        Conecta cuentas de Meta desde Facebook Login y configura las credenciales privadas de
        inventario.
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
                <span>Te llevaremos a Facebook para autorizar las cuentas publicitarias de esta empresa. IMVOLT nunca solicita tu contraseña.</span>
              </span>
              <Button
                type="primary"
                onClick={iniciarMetaLogin}
                disabled={!metaLoginConfigId || !metaOAuth.state}
                loading={metaOAuth.isLoading}
              >
                Conectar con Facebook
              </Button>
            </div>
            <div className="integration">
              <span className="connect-logo"><WhatsAppOutlined /></span>
              <span className="info">
                <b>WhatsApp Business</b>
                <span>
                  {whatsappStatus.data?.receives_events
                    ? "Webhook configurado y listo para recibir eventos."
                    : "Webhook pendiente de configuración en el API."}
                </span>
                <span>
                  Estado de recepción y validación de eventos de Meta.
                </span>
              </span>
              <Tag color={whatsappStatus.data?.receives_events ? "green" : "orange"}>
                {whatsappStatus.isLoading
                  ? "Verificando"
                  : whatsappStatus.data?.receives_events
                    ? "Habilitado"
                    : "Pendiente"}
              </Tag>
            </div>
            {whatsappStatus.data && (
              <Alert
                type={whatsappStatus.data.processes_messages ? "success" : "info"}
                showIcon
                message="Capacidades de WhatsApp"
                description={
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <CheckCircleOutlined style={{ color: whatsappStatus.data.webhook_configured ? "#16a34a" : "#d97706" }} />
                      <span>Webhook {whatsappStatus.data.webhook_configured ? "configurado" : "pendiente"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <CheckCircleOutlined style={{ color: whatsappStatus.data.signature_validation ? "#16a34a" : "#d97706" }} />
                      <span>Validación de firma {whatsappStatus.data.signature_validation ? "habilitada" : "pendiente"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <CheckCircleOutlined style={{ color: whatsappStatus.data.stores_messages ? "#16a34a" : "#d97706" }} />
                      <span>Guardado de mensajes {whatsappStatus.data.stores_messages ? "habilitado" : "pendiente de configurar"}</span>
                    </div>
                    <div style={{ marginTop: 8, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <b>Mensajes recibidos</b>
                        <Button size="small" icon={<ReloadOutlined />} loading={whatsappMessages.isFetching} onClick={() => void whatsappMessages.refetch()}>
                          Actualizar
                        </Button>
                      </div>
                      {whatsappMessages.data?.length ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {whatsappMessages.data.map((item) => (
                            <div key={item.message_id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <b>{item.sender_name || item.sender_phone}</b>
                                <small>{new Date(item.meta_timestamp ?? item.recibido_en).toLocaleString("es-EC")}</small>
                              </div>
                              <div>{item.message_text || `Mensaje de tipo ${item.message_type}`}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>Aún no se han recibido mensajes de WhatsApp.</span>
                      )}
                    </div>
                  </div>
                }
              />
            )}
            {whatsappStatus.error && (
              <Alert
                type="warning"
                showIcon
                message="No se pudo verificar WhatsApp"
                description="El API no respondió al estado del webhook. Revisa el despliegue del backend."
              />
            )}
            <div className="integration">
              <span className="connect-logo" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 192 192" fill="currentColor">
                  <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2109 139.019 87.8451C137.587 60.5305 122.241 44.0583 96.6579 44.0583C70.4705 44.0583 53.6499 62.4533 53.6499 90.0763C53.6499 118.067 71.0768 136.216 96.6579 136.216C112.564 136.216 124.619 128.879 130.686 115.485L113.826 105.78C109.919 113.844 103.585 117.828 96.6579 117.828C81.8211 117.828 72.8444 105.78 72.0437 87.8451C79.8732 89.9691 88.1697 91.0772 96.6579 91.0772C101.408 91.0772 106.012 90.7516 110.428 90.1171C109.782 99.4975 104.787 104.428 96.6579 104.428C91.4335 104.428 86.8523 101.693 85.0658 97.4363L68.7495 107.039C73.3444 116.175 83.8967 122.816 96.6579 122.816C115.228 122.816 128.005 111.435 128.784 89.7042C133.023 91.5036 137.042 93.6823 140.796 96.2238C145.452 99.3769 148.063 103.743 148.063 108.384C148.063 118.239 139.771 125.795 125.688 125.795C108.309 125.795 95.0449 114.502 94.6748 97.2343H76.2872C76.7118 124.788 98.4111 144.183 125.688 144.183C148.742 144.183 166.45 130.638 166.45 108.384C166.45 99.8247 161.464 92.4288 152.88 87.2796C149.336 85.1507 145.498 83.3768 141.537 81.9883V88.9883ZM96.6579 72.6884C108.823 72.6884 115.545 80.5957 116.634 92.4347C110.428 93.3087 103.738 93.7744 96.6579 93.7744C87.6973 93.7744 80.4497 92.8385 75.1278 91.0772C76.2255 79.9197 83.6705 72.6884 96.6579 72.6884Z" />
                </svg>
              </span>
              <span className="info">
                <b>Threads</b>
                <span>
                  {threadsAccount
                    ? `Cuenta autorizada: @${threadsAccount.username}`
                    : "Conecta una cuenta de Threads autorizada para consultar la información básica de su perfil."}
                </span>
                <span>
                  IMVOLT utilizaría este permiso para conectar una cuenta de Threads autorizada y permitir al usuario consultar la información básica de esa cuenta dentro de su espacio de trabajo. No se utiliza para acceder a mensajes privados ni para publicar sin una acción expresa del usuario.
                </span>
              </span>
              <Space>
                {threadsAccount ? (
                  <>
                    <Tag color="green">Conectada</Tag>
                    <Popconfirm
                      title="¿Desconectar cuenta de Threads?"
                      description="Se desvinculará la cuenta de Threads de la sesión actual."
                      okText="Desconectar"
                      cancelText="Cancelar"
                      onConfirm={desconectarThreads}
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Desconectar
                      </Button>
                    </Popconfirm>
                  </>
                ) : (
                  <Button
                    type="primary"
                    onClick={iniciarThreadsOAuth}
                    style={{ background: "#000", borderColor: "#000" }}
                  >
                    Conectar con Threads
                  </Button>
                )}
              </Space>
            </div>
            {threadsAccount && (
              <Alert
                type="success"
                showIcon
                message="Perfil de Threads consultado con éxito (threads_basic)"
                description={
                  <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                    <div><b>Usuario de Threads:</b> @{threadsAccount.username}</div>
                    <div><b>ID de perfil:</b> <code>{threadsAccount.id}</code></div>
                    <div><b>Permiso verificado:</b> <code>threads_basic</code> (consulta de ID y nombre de usuario sin acceso a mensajes ni publicación)</div>
                  </div>
                }
              />
            )}
            {!import.meta.env.META_APP_ID && (
              <Alert
                type="warning"
                showIcon
                message="Configura META_APP_ID"
                description="Agrega el ID público de la app de Meta en frontend/.env y reinicia Vite."
              />
            )}
            {!metaLoginConfigId && (
              <Alert
                type="warning"
                showIcon
                message="Configura META_LOGIN_CONFIG_ID"
                description="Agrega el ID de la configuración de Facebook Login for Business en frontend/.env y reinicia Vite."
              />
            )}
            {metaOAuth.error && (
              <Alert type="error" showIcon message="No se pudo preparar la autorización" description={metaOAuth.error.message} />
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
                    {integracion.nombre === "Lotes al Mando" && conexion && (
                      <Button
                        icon={<SyncOutlined />}
                        loading={sincronizarLotes.isPending}
                        onClick={() => void sincronizarInventario()}
                      >
                        Sincronizar inventario
                      </Button>
                    )}
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
                disabled
                options={[{ value: "produccion", label: "Producción — API de Lotes al Mando" }]}
              />
            </Form.Item>

            <Form.Item
              name="api_key"
              label="Correo de acceso de Lotes al Mando"
              rules={[
                {
                  required: !configuracionActual?.api_key,
                  type: "email",
                  message: "Ingresa un correo válido.",
                },
              ]}
              extra={configuracionActual?.api_key ? "Ya hay un correo guardado." : undefined}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="app_secret"
              label="Contraseña de Lotes al Mando"
              rules={[
                {
                  required: !configuracionActual?.app_secret,
                  whitespace: true,
                  message: "Ingresa la contraseña.",
                },
              ]}
              extra={configuracionActual?.app_secret ? "Ya hay una contraseña guardada." : undefined}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
}
