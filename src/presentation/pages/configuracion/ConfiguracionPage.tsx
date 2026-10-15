import { useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined, LinkOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { ImvoltLogo } from "@/presentation/components/brand/ImvoltLogo";
import { formatFecha } from "@/presentation/components/common/status";
import {
  useConexiones,
  useCreateConexion,
  useRecargarCreditos,
  useTransacciones,
  useWallet,
} from "@/presentation/hooks";
import { brand } from "@/presentation/theme/brand";
import type { Conexion } from "@/domain/conexion";
import type { TransaccionCredito } from "@/domain/credito";

const { Text, Paragraph } = Typography;

export function ConfiguracionPage() {
  const { message } = App.useApp();
  const [recargaOpen, setRecargaOpen] = useState(false);
  const [monto, setMonto] = useState<number>(100);
  const [conexionForm] = Form.useForm<{ cuenta_publicitaria_id: string; nombre_cuenta: string }>();

  const { data: wallet } = useWallet();
  const { data: transacciones, isLoading: loadingTx } = useTransacciones();
  const { data: conexiones, isLoading: loadingConex } = useConexiones();
  const recargar = useRecargarCreditos();
  const createConexion = useCreateConexion();

  const handleRecargar = async () => {
    try {
      await recargar.mutateAsync({ monto });
      message.success(`Recarga de ${monto} créditos registrada.`);
      setRecargaOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo recargar.");
    }
  };

  const handleConectar = async () => {
    const values = await conexionForm.validateFields().catch(() => null);
    if (!values) return;
    try {
      await createConexion.mutateAsync({
        cuenta_publicitaria_id: values.cuenta_publicitaria_id,
        nombre_cuenta: values.nombre_cuenta,
        estado: "pendiente",
      });
      message.success("Conexión registrada. Completa la autorización en Meta.");
      conexionForm.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo registrar la conexión.");
    }
  };

  const conexionColumns: ColumnsType<Conexion> = [
    {
      title: "Cuenta publicitaria",
      dataIndex: "nombre_cuenta",
      key: "nombre_cuenta",
      render: (nombre: string, row) => (
        <div>
          <Text strong>{nombre}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.cuenta_publicitaria_id}
          </Text>
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 130,
      render: (estado: Conexion["estado"]) => {
        const color =
          estado === "conectada" ? "success" : estado === "pendiente" ? "gold" : "red";
        return <Tag color={color}>{estado.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Creada",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (v: string) => formatFecha(v),
    },
  ];

  const txColumns: ColumnsType<TransaccionCredito> = [
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      render: (desc: string | null, row) => (
        <div>
          <Text>{desc ?? row.tipo}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatFecha(row.created_at)}
          </Text>
        </div>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      key: "tipo",
      width: 120,
      render: (tipo: string) => <Tag>{tipo.toUpperCase()}</Tag>,
    },
    {
      title: "Monto",
      dataIndex: "monto",
      key: "monto",
      width: 110,
      align: "right",
      render: (monto: number) => (
        <Text strong style={{ color: monto >= 0 ? brand.light.primary : brand.light.error }}>
          {monto >= 0 ? "+" : ""}
          {monto} cr.
        </Text>
      ),
    },
  ];

  return (
    <div>
      <PageToolbar
        title="Configuración"
        subtitle="Créditos, conexiones de publicidad e información de la cuenta."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Créditos IMVOLT"
            style={{ borderRadius: 12 }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setRecargaOpen(true)}
              >
                Recargar
              </Button>
            }
          >
            <Statistic
              title={<Text type="secondary">Saldo disponible</Text>}
              value={wallet?.saldo ?? 0}
              suffix="créditos"
              valueStyle={{ fontWeight: 700, color: brand.light.primary, fontSize: 32 }}
            />
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
              Los créditos se consumen al generar contenido con IA. Cada modelo cotiza un costo
              base según §09 del documento maestro.
            </Paragraph>

            <Table<TransaccionCredito>
              style={{ marginTop: 16 }}
              columns={txColumns}
              dataSource={transacciones ?? []}
              rowKey="transaction_id"
              loading={loadingTx}
              size="small"
              pagination={{ pageSize: 5, hideOnSinglePage: true }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Conexión con Meta Ads"
            style={{ borderRadius: 12 }}
            extra={
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: "Conectar con Meta",
                    content:
                      "En modo simulado la conexión se registra localmente. En producción, esto redirige al OAuth de Meta para autorizar la cuenta publicitaria.",
                    okText: "Entendido",
                    cancelButtonProps: { style: { display: "none" } },
                  });
                }}
              >
                Conectar
              </Button>
            }
          >
            <Table<Conexion>
              columns={conexionColumns}
              dataSource={conexiones ?? []}
              rowKey="connection_id"
              loading={loadingConex}
              size="small"
              pagination={false}
            />

            <Form
              form={conexionForm}
              layout="vertical"
              requiredMark={false}
              style={{ marginTop: 16 }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Agregar cuenta manualmente
              </Text>
              <Space size={12} style={{ display: "flex" }} align="start">
                <Form.Item
                  name="cuenta_publicitaria_id"
                  label="ID de cuenta publicitaria"
                  rules={[{ required: true, message: "Requerido." }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="act_123456789" maxLength={40} />
                </Form.Item>
                <Form.Item
                  name="nombre_cuenta"
                  label="Nombre"
                  rules={[{ required: true, message: "Requerido." }]}
                  style={{ flex: 1 }}
                >
                  <Input placeholder="Imvolt Ads Principal" maxLength={80} />
                </Form.Item>
                <Form.Item label=" " style={{ flexShrink: 0 }}>
                  <Button onClick={handleConectar} loading={createConexion.isPending}>
                    Agregar
                  </Button>
                </Form.Item>
              </Space>
            </Form>

            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              La publicación real de campañas requiere credenciales de Meta (§12). Sin ellas, el
              sistema opera en modo simulado y las campañas se quedan como borradores validados.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Cuenta" style={{ borderRadius: 12 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <div style={{ padding: 16 }}>
                  <ImvoltLogo variant="horizontal" height={40} />
                  <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
                    Marketing Inmobiliario AI — de la propiedad al anuncio: crear, publicar y medir.
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={16}>
                <Space direction="vertical" size={4}>
                  <Text>
                    <Text strong>Organización:</Text> Equipo IMVOLT (demo)
                  </Text>
                  <Text>
                    <Text strong>Plan:</Text> Business
                  </Text>
                  <Text>
                    <Text strong>Proveedor de datos:</Text>{" "}
                    {String(import.meta.env.VITE_DATA_PROVIDER ?? "mock")}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Los datos de esta sesión provienen del proveedor configurado en VITE_DATA_PROVIDER.
                    Cambia a "rest" y define VITE_API_URL para conectar con la API real.
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Recargar créditos"
        open={recargaOpen}
        onCancel={() => setRecargaOpen(false)}
        onOk={handleRecargar}
        okText="Recargar"
        cancelText="Cancelar"
        confirmLoading={recargar.isPending}
      >
        <Paragraph type="secondary">
          Registra una recarga de créditos para la organización. En modo simulado la pasarela
          confirma al instante.
        </Paragraph>
        <InputNumber
          min={1}
          step={10}
          value={monto}
          onChange={(v) => setMonto(v ?? 0)}
          style={{ width: "100%" }}
          placeholder="Monto en créditos"
          suffix="créditos"
        />
      </Modal>
    </div>
  );
}
