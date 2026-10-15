import { useMemo } from "react";
import { Card, Col, Empty, Row, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { EstadoLeadTag } from "@/presentation/components/common/status";
import { useCampanas, useGeneraciones, useLeads, useTransacciones } from "@/presentation/hooks";
import { brand } from "@/presentation/theme/brand";
import type { LeadEstado } from "@/domain/lead";

const { Text } = Typography;

interface LeadRow {
  estado: LeadEstado;
  total: number;
  porcentaje: number;
}

interface CampanaRow {
  campaign_id: string;
  nombre: string;
  leads: number;
  presupuesto: number;
}

export function AnaliticaPage() {
  const { data: leads } = useLeads();
  const { data: campanas } = useCampanas();
  const { data: generaciones } = useGeneraciones();
  const { data: transacciones } = useTransacciones();

  const totalLeads = leads?.length ?? 0;

  const leadsPorEstado = useMemo<LeadRow[]>(() => {
    const counts = new Map<LeadEstado, number>();
    for (const l of leads ?? []) counts.set(l.estado, (counts.get(l.estado) ?? 0) + 1);
    return [...counts.entries()]
      .map(([estado, total]) => ({
        estado,
        total,
        porcentaje: totalLeads ? Math.round((total / totalLeads) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads, totalLeads]);

  const leadsPorCampana = useMemo<CampanaRow[]>(() => {
    const counts = new Map<string, number>();
    for (const l of leads ?? []) {
      if (l.campaign_id) counts.set(l.campaign_id, (counts.get(l.campaign_id) ?? 0) + 1);
    }
    return (campanas ?? [])
      .map((c) => ({
        campaign_id: c.campaign_id,
        nombre: c.nombre,
        leads: counts.get(c.campaign_id) ?? 0,
        presupuesto: c.presupuesto_maximo,
      }))
      .sort((a, b) => b.leads - a.leads);
  }, [leads, campanas]);

  const resumenGeneraciones = useMemo(() => {
    const rows = generaciones ?? [];
    const completadas = rows.filter((g) => g.status === "completed").length;
    const fallidas = rows.filter((g) => g.status === "failed").length;
    const creditos = rows.reduce((sum, g) => sum + (g.status === "completed" ? g.credits_cost : 0), 0);
    const tasa = rows.length ? Math.round((completadas / rows.length) * 100) : 0;
    return { total: rows.length, completadas, fallidas, creditos, tasa };
  }, [generaciones]);

  const gastoCreditos = useMemo(() => {
    const rows = transacciones ?? [];
    return rows
      .filter((t) => t.monto < 0)
      .reduce((sum, t) => sum + Math.abs(t.monto), 0);
  }, [transacciones]);

  const leadColumns: ColumnsType<LeadRow> = [
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado: LeadEstado) => <EstadoLeadTag estado={estado} />,
    },
    { title: "Leads", dataIndex: "total", key: "total", width: 90 },
    {
      title: "Participación",
      dataIndex: "porcentaje",
      key: "porcentaje",
      width: 140,
      render: (p: number) => `${p}%`,
    },
  ];

  const campanaColumns: ColumnsType<CampanaRow> = [
    { title: "Campaña", dataIndex: "nombre", key: "nombre" },
    { title: "Leads", dataIndex: "leads", key: "leads", width: 90 },
    {
      title: "Presupuesto/día",
      dataIndex: "presupuesto",
      key: "presupuesto",
      width: 150,
      render: (v: number) => `$${v}`,
    },
    {
      title: "Leads por $",
      key: "ratio",
      width: 120,
      render: (_, row) =>
        row.presupuesto > 0 ? (row.leads / row.presupuesto).toFixed(2) : "—",
    },
  ];

  return (
    <div>
      <PageToolbar
        title="Analítica"
        subtitle="Conversión de leads, rendimiento de campañas y consumo de créditos."
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title={<Text type="secondary">Total leads</Text>}
              value={totalLeads}
              valueStyle={{ fontWeight: 700, color: brand.light.primary }}
            />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title={<Text type="secondary">Tasa de generación IA</Text>}
              value={resumenGeneraciones.tasa}
              suffix="%"
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title={<Text type="secondary">Generaciones completadas</Text>}
              value={resumenGeneraciones.completadas}
              suffix={`/ ${resumenGeneraciones.total}`}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card hoverable style={{ borderRadius: 12 }}>
            <Statistic
              title={<Text type="secondary">Créditos consumidos</Text>}
              value={resumenGeneraciones.creditos}
              valueStyle={{ fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Leads por estado" size="small" style={{ borderRadius: 12 }}>
            {leadsPorEstado.length === 0 ? (
              <Empty description="Sin datos de leads" />
            ) : (
              <Table<LeadRow>
                columns={leadColumns}
                dataSource={leadsPorEstado}
                rowKey="estado"
                size="small"
                pagination={false}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Rendimiento por campaña" size="small" style={{ borderRadius: 12 }}>
            {leadsPorCampana.length === 0 ? (
              <Empty description="Sin campañas registradas" />
            ) : (
              <Table<CampanaRow>
                columns={campanaColumns}
                dataSource={leadsPorCampana}
                rowKey="campaign_id"
                size="small"
                pagination={false}
              />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Consumo de créditos" size="small" style={{ borderRadius: 12 }}>
            <Statistic
              title={<Text type="secondary">Total consumido en generaciones IA</Text>}
              value={gastoCreditos}
              suffix="créditos"
              valueStyle={{ fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
              Los créditos se reservan al cotizar y se consumen al completarse la generación. Las
              generaciones fallidas se devuelven automáticamente (§09).
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
