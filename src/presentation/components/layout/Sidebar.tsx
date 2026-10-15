import type { CSSProperties, ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ApartmentOutlined,
  BarChartOutlined,
  HomeOutlined,
  LayoutOutlined,
  NotificationOutlined,
  RobotOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useWallet } from "@/presentation/hooks";

/**
 * Barra lateral IMVOLT — UI Concept 01 del prototipo interactivo:
 * fondo carbón (#101719), logo horizontal sobre oscuro, dos secciones
 * (ESPACIO DE TRABAJO / ADMINISTRACIÓN) y bloque inferior con la cuota de
 * créditos + perfil de la organización.
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

/** Cuota de referencia: el MVP simulate un límite mensual de créditos. */
const CUOTA_MENSUAL = 500;

interface SidebarProps {
  open?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { data: wallet } = useWallet();
  const saldo = wallet?.saldo ?? 0;
  const pct = Math.max(4, Math.min(100, Math.round((saldo / CUOTA_MENSUAL) * 100)));

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
      <nav className="nav">{renderItems(ADMIN)}</nav>

      <div className="sidebar-bottom">
        <p className="workspace-label">WORKSPACE ACTIVO</p>

        <div
          className="quota"
          style={{ "--progress": `${pct}%` } as CSSProperties}
        >
          <b>{saldo} créditos</b>
          <p>
            Disponibles de {CUOTA_MENSUAL} / mes
          </p>
          <div className="progress" />
        </div>

        <button
          type="button"
          className="sidebar-profile"
          style={{ background: "none", border: 0, width: "100%", cursor: "pointer", textAlign: "left" }}
          onClick={() => navigate("/configuracion")}
          title="Abrir configuración"
        >
          <span className="avatar">IV</span>
          <span className="profile">
            <b>Urbaniza Capital</b>
            <small>Organización de ejemplo</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
