import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
} from "antd";
import { ThunderboltOutlined, PictureOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { DataTable } from "@/presentation/components/common/DataTable";
import { EstadoGeneracionTag, formatFecha } from "@/presentation/components/common/status";
import {
  useCreateGeneracion,
  useGeneraciones,
  useModelos,
  usePlantillas,
  usePropiedades,
  useWallet,
} from "@/presentation/hooks";
import { brand } from "@/presentation/theme/brand";
import type { Generacion } from "@/domain/generacion";
import type { ColumnsType } from "antd/es/table";

const { Text, Paragraph } = Typography;

interface FormValues {
  property_id?: string;
  template_id?: string;
  model_id: string;
  modo: "facil" | "pro";
  prompt: string;
  duration?: number;
  ratio?: string;
}

export function EstudioPage() {
  const location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  const { data: plantillas } = usePlantillas();
  const { data: modelos } = useModelos();
  const { data: propiedades } = usePropiedades();
  const { data: generaciones, isLoading } = useGeneraciones();
  const { data: wallet } = useWallet();
  const createGeneracion = useCreateGeneracion();

  // Preselección desde Plantillas ("Usar en Estudio").
  const presetTemplateId = (location.state as { templateId?: string } | null)?.templateId;

  const [modeloSel, setModeloSel] = useState<string | undefined>();
  const duration = Form.useWatch("duration", form);

  const modeloActivo = useMemo(
    () => (modelos ?? []).find((m) => m.model_id === modeloSel),
    [modelos, modeloSel],
  );

  // §09: la cotización se toma SIEMPRE del registro vivo de modelos.
  const creditosCotizados = useMemo(() => {
    if (!modeloActivo) return 0;
    const extra =
      modeloActivo.media_type === "video" && modeloActivo.duracion_max_s
        ? Math.max(0, Math.ceil((duration ?? 0) / 5) - 1)
        : 0;
    return modeloActivo.quote_creditos + extra;
  }, [modeloActivo, duration]);

  useEffect(() => {
    if (presetTemplateId) {
      form.setFieldsValue({ template_id: presetTemplateId });
    }
  }, [presetTemplateId, form]);

  const saldoSuficiente = (wallet?.saldo ?? 0) >= creditosCotizados;

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    if (!saldoSuficiente) {
      message.error("Saldo de créditos insuficiente para esta generación.");
      return;
    }

    const parametros: Record<string, unknown> = {};
    if (values.duration) parametros.duration = values.duration;
    if (values.ratio) parametros.ratio = values.ratio;

    try {
      await createGeneracion.mutateAsync({
        property_id: values.property_id ?? null,
        template_id: values.template_id ?? null,
        model_id: values.model_id,
        modo: values.modo,
        prompt: values.prompt,
        parametros,
        status: "queued",
        credits_cost: creditosCotizados,
      });
      message.success("Generación encolada. El Estudio la procesará en unos segundos.");
      form.resetFields(["prompt", "duration"]);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo crear la generación.");
    }
  };

  const historialOrdenado = useMemo(
    () => [...(generaciones ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [generaciones],
  );

  const columns: ColumnsType<Generacion> = [
    {
      title: "Prompt",
      dataIndex: "prompt",
      key: "prompt",
      render: (prompt: string, row) => (
        <div>
          <Text strong ellipsis style={{ maxWidth: 380, display: "block" }}>
            {row.modo === "pro" ? "[PRO] " : ""}
            {prompt}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatFecha(row.created_at)}
          </Text>
        </div>
      ),
    },
    {
      title: "Tipo",
      key: "tipo",
      width: 90,
      render: (_, row) =>
        row.parametros?.duration ? (
          <span>
            <VideoCameraOutlined /> Video
          </span>
        ) : (
          <span>
            <PictureOutlined /> Imagen
          </span>
        ),
    },
    {
      title: "Costo",
      dataIndex: "credits_cost",
      key: "credits_cost",
      width: 90,
      render: (v: number) => `${v} cr.`,
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: Generacion["status"]) => <EstadoGeneracionTag status={status} />,
    },
  ];

  return (
    <div>
      <PageToolbar
        title="Estudio IA"
        subtitle="Genera renders y videos de tus propiedades con Higgsfield."
        extra={
          <Card size="small" style={{ borderRadius: 10, background: brand.light.primaryBg, border: "none" }}>
            <Statistic
              title={<Text type="secondary">Créditos disponibles</Text>}
              value={wallet?.saldo ?? 0}
              valueStyle={{ color: brand.light.primary, fontWeight: 700 }}
            />
          </Card>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Nueva generación" style={{ borderRadius: 12 }}>
            <Form form={form} layout="vertical" requiredMark={false} initialValues={{ modo: "facil" }}>
              <Form.Item name="property_id" label="Propiedad (opcional)">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Selecciona una propiedad"
                  options={(propiedades ?? []).map((p) => ({
                    value: p.property_id,
                    label: `${p.nombre} (${p.ciudad ?? "sin ciudad"})`,
                  }))}
                />
              </Form.Item>

              <Form.Item name="template_id" label="Plantilla (opcional)">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="Aplicar una plantilla"
                  options={(plantillas ?? [])
                    .filter((p) => p.activo)
                    .map((p) => ({ value: p.template_id, label: p.nombre }))}
                />
              </Form.Item>

              <Form.Item
                name="model_id"
                label="Modelo"
                rules={[{ required: true, message: "Selecciona un modelo." }]}
                tooltip="§09: el catálogo de modelos se lee del registro vivo, nunca está hardcodeado."
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Selecciona el modelo"
                  value={modeloSel}
                  onChange={setModeloSel}
                  options={(modelos ?? []).map((m) => ({
                    value: m.model_id,
                    label: `${m.nombre} — ${m.quote_creditos} cr.${m.status !== "activo" ? " (no disponible)" : ""}`,
                    disabled: m.status !== "activo",
                  }))}
                />
              </Form.Item>

              <Form.Item name="modo" label="Modo">
                <Select
                  options={[
                    { value: "facil", label: "Fácil (solo prompt)" },
                    { value: "pro", label: "Pro (parámetros avanzados)" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="prompt"
                label="Prompt"
                rules={[{ required: true, message: "Describe lo que quieres generar." }]}
              >
                <Input.TextArea
                  rows={3}
                  maxLength={600}
                  showCount
                  placeholder="Describe la escena: iluminación, ángulo, ambiente..."
                />
              </Form.Item>

              {modeloActivo?.media_type === "video" && (
                <Form.Item name="duration" label="Duración (segundos)">
                  <InputNumber
                    min={modeloActivo.duracion_min_s ?? 1}
                    max={modeloActivo.duracion_max_s ?? 12}
                    style={{ width: "100%" }}
                    placeholder={`${modeloActivo.duracion_min_s ?? 5}–${modeloActivo.duracion_max_s ?? 12} s`}
                  />
                </Form.Item>
              )}

              {modeloActivo?.ratios && modeloActivo.ratios.length > 0 && (
                <Form.Item name="ratio" label="Relación de aspecto">
                  <Select
                    placeholder="Selecciona el ratio"
                    options={modeloActivo.ratios.map((r) => ({ value: r, label: r }))}
                  />
                </Form.Item>
              )}

              <Divider style={{ margin: "8px 0 16px" }} />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Space direction="vertical" size={0}>
                  <Text strong>Cotización: {creditosCotizados} créditos</Text>
                  {!saldoSuficiente && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      Saldo insuficiente ({wallet?.saldo ?? 0} disponibles)
                    </Text>
                  )}
                </Space>
              </div>

              <Button
                type="primary"
                block
                icon={<ThunderboltOutlined />}
                onClick={handleSubmit}
                loading={createGeneracion.isPending}
                disabled={!saldoSuficiente}
                style={{ height: 44, fontWeight: 600 }}
              >
                Generar con IA
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Historial de generaciones" style={{ borderRadius: 12 }}>
            {historialOrdenado.length === 0 ? (
              <Empty description="Aún no has generado nada. ¡Crea tu primer render!" />
            ) : (
              <DataTable<Generacion>
                card={false}
                columns={columns}
                dataSource={historialOrdenado}
                rowKey="generation_id"
                loading={isLoading}
                pagination={false}
              />
            )}
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Los renders generados con IA son conceptuales: etíquetalos siempre como tales en tus
              publicaciones (fidelidad de contenido, §07).
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
