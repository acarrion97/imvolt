import type { CSSProperties, ReactNode } from "react";
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
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { AUTH_ENABLED } from "@/presentation/auth/AuthProvider";
import { useAuth, useIntegracionesEmpresa } from "@/presentation/hooks";
import { capitalize, initials } from "@/presentation/components/common/userLabel";

/**
 * Barra lateral IMVOLT — UI Concept 01 del prototipo interactivo:
 * fondo carbón (#101719), logo horizontal sobre oscuro, dos secciones
 * (ESPACIO DE TRABAJO / ADMINISTRACIÓN), porcentaje de integraciones
 * habilitadas por la empresa y perfil de la organización.
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
  const { perfil, rol, tienePermiso } = useAuth();
  const esSuperAdmin = perfil?.es_super_admin === true;
  const itemsAdminEmpresa: NavItem[] = [
    ...(tienePermiso("gestionar_usuarios")
      ? [{ key: "/equipo", label: "Equipo", icon: <TeamOutlined /> }]
      : []),
    ...ADMIN,
  ];

  // Porcentaje de integraciones habilitadas por la empresa. El API aplica
  // `gestionar_integraciones` también en lectura de /v1/empresas-integraciones,
  // así que sin ese permiso no hay dato que mostrar (la tarjeta no se pinta).
  const puedeVerIntegraciones =
    AUTH_ENABLED && tienePermiso("gestionar_integraciones");
  const { data: integraciones } = useIntegracionesEmpresa(puedeVerIntegraciones);

  const catalogo = integraciones?.catalogo ?? [];
  const vinculos = integraciones?.conexiones ?? [];
  const activas = catalogo.filter((item) => item.activa && item.estado === "activo");
  const habilitadas = activas.filter((item) =>
    vinculos.some(
      (vinculo) =>
        vinculo.integracion_id === item.integracion_id &&
        vinculo.estado === "activo",
    ),
  ).length;
  const pctIntegraciones = activas.length
    ? Math.round((habilitadas / activas.length) * 100)
    : 0;

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
      <NavLink to={esSuperAdmin ? "/administracion" : "/inicio"} onClick={onNavigate} className="logo">
        <img
          src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png"
          alt="IMVOLT — Marketing Inmobiliario AI"
          className="brand-logo"
        />
      </NavLink>

      {esSuperAdmin ? (
        <>
          <div className="section-cap">Administración de plataforma</div>
          <nav className="nav">
          <NavLink
            to="/administracion"
            onClick={onNavigate}
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="symbol"><ControlOutlined /></span>
            Centro de control
          </NavLink>
          </nav>
        </>
      ) : (
        <>
          <div className="section-cap">Espacio de trabajo</div>
          <nav className="nav">{renderItems(ESPACIO)}</nav>
          <div className="section-cap">Administración</div>
          <nav className="nav">{renderItems(itemsAdminEmpresa)}</nav>
        </>
      )}

      <div className="sidebar-bottom">
        <p className="workspace-label">WORKSPACE ACTIVO</p>

        {integraciones && (
          <div
            className="quota"
            style={{ "--progress": `${pctIntegraciones}%` } as CSSProperties}
          >
            <b>{pctIntegraciones}%</b>
            <p>
              Integraciones habilitadas en esta empresa ({habilitadas} de{" "}
              {activas.length})
            </p>
            <div className="progress" />
          </div>
        )}

        <button
          type="button"
          className="sidebar-profile"
          style={{ background: "none", border: 0, width: "100%", cursor: "pointer", textAlign: "left" }}
          onClick={() => navigate(esSuperAdmin ? "/administracion" : "/configuracion")}
          title={esSuperAdmin ? "Abrir centro de control" : "Abrir configuración"}
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
