import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ApartmentOutlined,
  BarChartOutlined,
  ControlOutlined,
  HomeOutlined,
  LayoutOutlined,
  NotificationOutlined,
  RobotOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { AUTH_ENABLED } from "@/presentation/auth/AuthProvider";
import { useAuth } from "@/presentation/hooks";
import { capitalize, initials } from "@/presentation/components/common/userLabel";

/**
 * Barra lateral IMVOLT — UI Concept 01 del prototipo interactivo:
 * fondo carbón (#101719), logo horizontal sobre oscuro, dos secciones
 * (ESPACIO DE TRABAJO / ADMINISTRACIÓN) y perfil de la organización.
 */

interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
}

const ESPACIO: NavItem[] = [
  { key: "/inicio", label: "Inicio", icon: <HomeOutlined /> },
  { key: "/propiedades", label: "Mis propiedades", icon: <ApartmentOutlined /> },
  { key: "/estudio", label: "Estudio IA", icon: <RobotOutlined /> },
  { key: "/plantillas", label: "Plantillas", icon: <LayoutOutlined /> },
  { key: "/campanas", label: "Campañas Meta", icon: <NotificationOutlined /> },
  { key: "/contactos", label: "Contactos", icon: <UsergroupAddOutlined /> },
  { key: "/analitica", label: "Analítica", icon: <BarChartOutlined /> },
];

const ADMIN: NavItem[] = [
  { key: "/configuracion", label: "Configuración", icon: <SettingOutlined /> },
];

interface SidebarProps {
  open?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { perfil, rol } = useAuth();
  const esSuperAdmin = perfil?.es_super_admin === true;

  // Con sesión real: empresa activa + usuario/rol (modo mock: datos de ejemplo).
  const organizacion = perfil?.usuario.empresa?.razon_social ?? "Urbaniza Capital";
  const detalle = perfil
    ? rol
      ? capitalize(rol)
      : perfil.usuario.email
    : "Organización de ejemplo";
  const avatar = perfil ? initials(organizacion) || "IM" : "IV";

  const renderItems = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.key}
        to={item.key}
        onClick={onNavigate}
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        <span className="symbol">{item.icon}</span>
        {item.label}
      </NavLink>
    ));

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <NavLink to="/inicio" onClick={onNavigate} className="logo">
        <img
          src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png"
          alt="IMVOLT — Marketing Inmobiliario AI"
          className="brand-logo"
        />
      </NavLink>

      <div className="section-cap">Espacio de trabajo</div>
      <nav className="nav">{renderItems(ESPACIO)}</nav>

      <div className="section-cap">Administración</div>
      <nav className="nav">
        {renderItems(ADMIN)}
        {(esSuperAdmin || !AUTH_ENABLED) && (
          <NavLink
            to="/administracion"
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="symbol"><ControlOutlined /></span>
            Panel de plataforma
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <p className="workspace-label">WORKSPACE ACTIVO</p>
        <button
          type="button"
          className="sidebar-profile"
          style={{ background: "none", border: 0, width: "100%", cursor: "pointer", textAlign: "left" }}
          onClick={() => navigate("/configuracion")}
          title="Abrir configuración"
        >
          <span className="avatar">{avatar}</span>
          <span className="profile">
            <b>{organizacion}</b>
            <small>{detalle}</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
