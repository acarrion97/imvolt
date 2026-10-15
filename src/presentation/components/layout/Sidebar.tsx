import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Typography } from "antd";
import { useOnlineStatus } from "@/presentation/hooks";
import { ImvoltLogo } from "@/presentation/components/brand/ImvoltLogo";
import {
  DashboardOutlined,
  ProjectOutlined,
  HomeOutlined,
  LayoutOutlined,
  RobotOutlined,
  NotificationOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

const groupLabel = (text: string) => (
  <Text
    style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1.2,
      color: "rgba(255,255,255,0.55)",
      textTransform: "uppercase",
    }}
  >
    {text}
  </Text>
);

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Mapa de navegación del documento maestro:
 * Dashboard · Proyectos · Propiedades · Plantillas · Estudio IA · Campañas ·
 * Contactos · Analítica · Configuración
 */
const OPERACION: NavItem[] = [
  { key: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
  { key: "/proyectos", label: "Proyectos", icon: <ProjectOutlined /> },
  { key: "/propiedades", label: "Propiedades", icon: <HomeOutlined /> },
];

const CREATIVE: NavItem[] = [
  { key: "/plantillas", label: "Plantillas", icon: <LayoutOutlined /> },
  { key: "/estudio", label: "Estudio IA", icon: <RobotOutlined /> },
];

const CRECIMIENTO: NavItem[] = [
  { key: "/campanas", label: "Campañas", icon: <NotificationOutlined /> },
  { key: "/contactos", label: "Contactos", icon: <UsergroupAddOutlined /> },
  { key: "/analitica", label: "Analítica", icon: <BarChartOutlined /> },
];

const SISTEMA: NavItem[] = [
  { key: "/configuracion", label: "Configuración", icon: <SettingOutlined /> },
];

const toMenu = (items: NavItem[]): MenuItem[] =>
  items.map((item) => ({ key: item.key, icon: item.icon, label: item.label }));

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  const menuItems: MenuItem[] = useMemo(
    () => [
      { key: "grupo-operacion", label: groupLabel("Operación"), type: "group", children: toMenu(OPERACION) },
      { key: "grupo-creative", label: groupLabel("Creative AI"), type: "group", children: toMenu(CREATIVE) },
      { key: "grupo-crecimiento", label: groupLabel("Crecimiento"), type: "group", children: toMenu(CRECIMIENTO) },
      { key: "grupo-sistema", label: groupLabel("Sistema"), type: "group", children: toMenu(SISTEMA) },
    ],
    [],
  );

  const selectedKeys = [location.pathname === "/" ? "/dashboard" : location.pathname];
  const openKeys = useMemo(
    () => ["grupo-operacion", "grupo-creative", "grupo-crecimiento", "grupo-sistema"].filter(() => !collapsed),
    [collapsed],
  );

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => navigate(key);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 8,
        }}
      >
        {collapsed ? (
          <ImvoltLogo variant="isotipo-oscuro" height={28} />
        ) : (
          <ImvoltLogo variant="horizontal-oscuro" height={34} />
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={collapsed ? [] : openKeys}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, background: "transparent" }}
        />
      </div>

      {!collapsed && (
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isOnline ? "#00D94B" : "#E8C25C",
                boxShadow: isOnline ? "0 0 8px #00D94B" : "0 0 8px #E8C25C",
              }}
            />
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              {isOnline ? "Plataforma activa" : "Sin conexión"}
            </Text>
          </div>
          <Text
            style={{
              display: "block",
              marginTop: 10,
              color: "rgba(255,255,255,0.35)",
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: 1.4,
            }}
          >
            MARKETING INMOBILIARIO AI
          </Text>
        </div>
      )}
    </div>
  );
}
