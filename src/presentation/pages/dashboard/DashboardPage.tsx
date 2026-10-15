import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Col, Row, Statistic, Typography, List, Space, Empty, Spin } from "antd";
import {
  HomeOutlined,
  ProjectOutlined,
  NotificationOutlined,
  UsergroupAddOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import {
  EstadoCampanaTag,
  EstadoGeneracionTag,
  formatPrecio,
  formatFecha,
} from "@/presentation/components/common/status";
import {
  useCampanas,
  useGeneraciones,
  useLeads,
  usePropiedades,
  useProyectos,
  useWallet,
} from "@/presentation/hooks";
import { brand } from "@/presentation/theme/brand";

const { Text } = Typography;

function StatCard({
  icon,
  title,
  value,
  suffix,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  suffix?: string;
  to: string;
}) {
  return (
    <Card hoverable style={{ borderRadius: 12 }}>
      <Link to={to} style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: brand.light.primaryBg,
            color: brand.light.primary,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <Statistic
          title={<Text type="secondary">{title}</Text>}
          value={value}
          suffix={suffix}
          valueStyle={{ fontWeight: 700 }}
        />
      </Link>
    </Card>
  );
}

export function DashboardPage() {
  const { data: proyectos, isLoading: loadingProyectos } = useProyectos();
  const { data: propiedades, isLoading: loadingPropiedades } = usePropiedades();
  const { data: campanas, isLoading: loadingCampanas } = useCampanas();
  const { data: leads, isLoading: loadingLeads } = useLeads();
  const { data: generaciones } = useGeneraciones();
  const { data: wallet } = useWallet();

  const loading = loadingProyectos || loadingPropiedades || loadingCampanas || loadingLeads;

  const resumen = useMemo(() => {
    const disponibles =
      propiedades?.filter((p) => p.estado === "disponible").length ?? 0;
    const campanasActivas = campanas?.filter((c) => c.estado === "active").length ?? 0;
    const leadsNuevos = leads?.filter((l) => l.estado === "nuevo").length ?? 0;
    const leadsCerrados = leads?.filter((l) => l.estado === "cerrado").length ?? 0;
    return { disponibles, campanasActivas, leadsNuevos, leadsCerrados };
  }, [propiedades, campanas, leads]);

  const ultimasGeneraciones = useMemo(
    () => [...(generaciones ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [generaciones],
  );

  const ultimosLeads = useMemo(
    () => [...(leads ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [leads],
  );

  const proximasCampanas = useMemo(
    () =>
      (campanas ?? [])
        .filter((c) => c.estado !== "archived" && c.estado !== "rejected")
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 5),
    [campanas],
  );

  if (loading) return <Spin size="large" style={{ display: "block", margin: "80px auto" }} />;

  return (
    <div>
      <PageToolbar
        title="Dashboard"
        subtitle="De la propiedad al anuncio: crear, publicar y medir."
        extra={
          <Card size="small" style={{ borderRadius: 10, background: brand.light.primaryBg, border: "none" }}>
            <Space>
              <ThunderboltOutlined style={{ color: brand.light.primary }} />
              <Text strong>{wallet?.saldo ?? 0} créditos disponibles</Text>
            </Space>
          </Card>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            icon={<ProjectOutlined />}
            title="Proyectos"
            value={proyectos?.length ?? 0}
            to="/proyectos"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            icon={<HomeOutlined />}
            title="Propiedades disponibles"
            value={resumen.disponibles}
            suffix={`/ ${propiedades?.length ?? 0}`}
            to="/propiedades"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            icon={<NotificationOutlined />}
            title="Campañas activas"
            value={resumen.campanasActivas}
            to="/campanas"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            icon={<UsergroupAddOutlined />}
            title="Leads nuevos"
            value={resumen.leadsNuevos}
            suffix={`/ ${leads?.length ?? 0}`}
            to="/contactos"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Últimas generaciones IA"
            size="small"
            extra={<Link to="/estudio">Ver estudio</Link>}
          >
            {ultimasGeneraciones.length === 0 ? (
              <Empty description="Todavía no hay generaciones" />
            ) : (
              <List
                dataSource={ultimasGeneraciones}
                renderItem={(gen) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<EstadoGeneracionTag status={gen.status} />}
                      description={
                        <Text type="secondary" ellipsis style={{ maxWidth: 320 }}>
                          {gen.prompt}
                        </Text>
                      }
                    />
                    <Text strong>{gen.credits_cost} cr.</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Campañas recientes"
            size="small"
            extra={<Link to="/campanas">Ver campañas</Link>}
          >
            {proximasCampanas.length === 0 ? (
              <Empty description="No hay campañas" />
            ) : (
              <List
                dataSource={proximasCampanas}
                renderItem={(camp) => (
                  <List.Item>
                    <List.Item.Meta
                      title={camp.nombre}
                      description={<EstadoCampanaTag estado={camp.estado} />}
                    />
                    <Text strong>{formatPrecio(camp.presupuesto_maximo, camp.moneda)}/día</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            title="Últimos contactos"
            size="small"
            extra={<Link to="/contactos">Ver contactos</Link>}
          >
            {ultimosLeads.length === 0 ? (
              <Empty description="No hay leads registrados" />
            ) : (
              <List
                dataSource={ultimosLeads}
                renderItem={(lead) => (
                  <List.Item>
                    <List.Item.Meta
                      title={lead.nombre}
                      description={`${lead.fuente.replace(/_/g, " ")} · ${lead.telefono ?? lead.email ?? "sin contacto"}`}
                    />
                    <Text type="secondary">{formatFecha(lead.created_at)}</Text>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
