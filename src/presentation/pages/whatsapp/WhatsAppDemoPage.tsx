import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ApiError, http } from "@/infrastructure/http/httpClient";

interface WhatsAppStatus {
  whatsapp: {
    enabled: boolean;
    configured: boolean;
    graph_version: string;
    template_default: string;
    language_default: string;
    token_configured: boolean;
  };
}

interface WhatsAppMessage {
  message_id: number;
  meta_message_id: string;
  sender_phone: string;
  sender_name: string | null;
  message_type: string;
  message_text: string | null;
  meta_timestamp: string | null;
  recibido_en: string;
}

interface SendResult {
  contacts?: Array<{ wa_id?: string }>;
  messages?: Array<{ id?: string; message_status?: string }>;
}

interface FormValues {
  to: string;
  template: string;
  language: string;
}

const columns: ColumnsType<WhatsAppMessage> = [
  {
    title: "Contacto",
    dataIndex: "sender_name",
    key: "sender_name",
    render: (value: string | null, row) => value || row.sender_phone,
  },
  { title: "Número", dataIndex: "sender_phone", key: "sender_phone" },
  { title: "Mensaje recibido", dataIndex: "message_text", key: "message_text", render: (value: string | null) => value || <Typography.Text type="secondary">Mensaje sin texto</Typography.Text> },
  { title: "Tipo", dataIndex: "message_type", key: "message_type", render: (value: string) => <Tag>{value}</Tag> },
  {
    title: "Recibido",
    dataIndex: "recibido_en",
    key: "recibido_en",
    render: (value: string) => value ? new Date(value).toLocaleString("es-EC") : "—",
  },
];

/** Interfaz de demostración empresarial para probar el permiso WhatsApp. */
export function WhatsAppDemoPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [consent, setConsent] = useState(false);
  const [lastSent, setLastSent] = useState<SendResult | null>(null);

  const refresh = useCallback(async (showErrors = true) => {
    setLoading(true);
    try {
      const [nextStatus, nextMessages] = await Promise.all([
        http.get<WhatsAppStatus>("/v1/whatsapp/test/status"),
        http.get<WhatsAppMessage[]>("/v1/whatsapp/messages"),
      ]);
      setStatus(nextStatus);
      setMessages(nextMessages);
      form.setFieldsValue({
        template: nextStatus.whatsapp.template_default,
        language: nextStatus.whatsapp.language_default,
      });
    } catch (error) {
      if (showErrors) {
        message.error(error instanceof Error ? error.message : "No se pudo consultar WhatsApp.");
      }
    } finally {
      setLoading(false);
    }
  }, [form, message]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendTemplate = async (values: FormValues) => {
    if (!consent) {
      message.warning("Confirma que el destinatario aceptó recibir este mensaje.");
      return;
    }
    setSending(true);
    setLastSent(null);
    try {
      const result = await http.post<SendResult>("/v1/whatsapp/test/template", {
        to: values.to.trim(),
        template: values.template.trim(),
        language: values.language.trim(),
      });
      setLastSent(result);
      message.success("Meta aceptó la plantilla para envío.");
      await refresh(false);
    } catch (error) {
      const detail = error instanceof ApiError ? error.message : "No se pudo enviar la plantilla.";
      message.error(detail);
    } finally {
      setSending(false);
    }
  };

  const wa = status?.whatsapp;
  const serviceReady = Boolean(wa?.enabled && wa.configured && wa.token_configured);

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Canal de atención</p>
          <h1>WhatsApp Business</h1>
          <p className="sub">Envía una plantilla aprobada y revisa las respuestas recibidas en IMVOLT.</p>
        </div>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Entorno de demostración"
        description="Esta pantalla usa el número de prueba configurado por el servidor. Envía mensajes únicamente a personas que hayan dado su consentimiento. El token permanece en el backend."
        style={{ marginBottom: 18 }}
      />

      {loading && !status ? <Card><Spin /></Card> : (
        <>
          <Card title="Enviar una plantilla" style={{ marginBottom: 20 }}>
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                Las plantillas aprobadas permiten iniciar una conversación. Después de que la persona responda, sus mensajes entrantes aparecerán en la bandeja de abajo.
              </Typography.Paragraph>
              {!serviceReady && (
                <Alert
                  type="error"
                  showIcon
                  message="WhatsApp de prueba no está listo"
                  description="En el backend configura WHATSAPP_ID_TEST, WHATSAPP_TOKEN_TEST y WHATSAPP_TEST_ENABLED=true. No añadas el token al frontend."
                />
              )}
              {wa && <Typography.Text type="secondary">API {wa.graph_version} · Plantilla predeterminada: {wa.template_default} ({wa.language_default})</Typography.Text>}
              <Form<FormValues>
                form={form}
                layout="vertical"
                initialValues={{ template: wa?.template_default, language: wa?.language_default }}
                onFinish={sendTemplate}
                style={{ maxWidth: 560 }}
              >
                <Form.Item label="WhatsApp del destinatario" name="to" rules={[{ required: true, message: "Escribe el número con código de país." }]}>
                  <Input placeholder="593991234567" inputMode="tel" autoComplete="off" />
                </Form.Item>
                <Form.Item label="Nombre exacto de la plantilla aprobada" name="template" rules={[{ required: true }]}>
                  <Input placeholder="nombre_de_plantilla" autoComplete="off" />
                </Form.Item>
                <Form.Item label="Idioma de la plantilla" name="language" rules={[{ required: true }]}>
                  <Input placeholder="es_EC" autoComplete="off" />
                </Form.Item>
                <Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)}>
                  Confirmo que esta persona solicitó información o aceptó recibir mensajes.
                </Checkbox>
                <div style={{ marginTop: 18 }}>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={sending} disabled={!serviceReady}>
                    Enviar plantilla de prueba
                  </Button>
                </div>
              </Form>
              {lastSent && (
                <Alert
                  type="success"
                  showIcon
                  message="Solicitud aceptada por Meta"
                  description={<>ID del mensaje: <Typography.Text code>{lastSent.messages?.[0]?.id ?? "No devuelto"}</Typography.Text>. Confirma la recepción en WhatsApp; la aceptación de la API no garantiza la entrega.</>}
                />
              )}
            </Space>
          </Card>

          <Card
            title="Mensajes recibidos"
            extra={<Button icon={<ReloadOutlined />} onClick={() => void refresh()} loading={loading}>Actualizar</Button>}
          >
            <Typography.Paragraph type="secondary">
              Para mostrar una respuesta aquí, contesta el mensaje desde WhatsApp en el teléfono de prueba y pulsa Actualizar. La recepción requiere que el webhook de WhatsApp esté configurado.
            </Typography.Paragraph>
            <Table<WhatsAppMessage>
              rowKey="message_id"
              columns={columns}
              dataSource={messages}
              loading={loading}
              locale={{ emptyText: "Aún no hay respuestas recibidas." }}
              pagination={{ pageSize: 5, hideOnSinglePage: true }}
              scroll={{ x: 700 }}
            />
          </Card>
        </>
      )}
    </div>
  );
}
