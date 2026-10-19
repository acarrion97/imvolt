import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dropdown } from "antd";
import { LogoutOutlined, ThunderboltOutlined, MenuOutlined } from "@ant-design/icons";
import { useAuth, useWallet } from "@/presentation/hooks";
import { capitalize, initials } from "@/presentation/components/common/userLabel";

/**
 * Barra superior — UI Concept 01 del prototipo:
 * migas "IMVOLT / Página", píldoras de demo y créditos, y el CTA
 * "Crear con AI" que abre el Estudio IA.
 *
 * Con el API real (VITE_DATA_PROVIDER=rest) agrega el menú de usuario:
 * avatar con iniciales, nombre + rol y el cierre de sesión.
 */

const ROUTE_LABELS: Record<string, string> = {
  "/inicio": "Inicio",
  "/propiedades": "Mis propiedades",
  "/proyectos": "Proyectos",
  "/plantillas": "Plantillas",
  "/estudio": "Estudio IA",
  "/campanas": "Campañas Meta",
  "/contactos": "Contactos",
  "/analitica": "Analítica",
  "/configuracion": "Configuración",
};

interface HeaderProps {
  onToggleMobile: () => void;
}

export function Header({ onToggleMobile }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: wallet } = useWallet();
  const { status, perfil, rol, logout } = useAuth();

  const label = ROUTE_LABELS[pathname] ?? "Inicio";

  const nombre = perfil?.usuario.nombre ?? "Mi cuenta";
  const detalle = perfil ? (rol ? capitalize(rol) : perfil.usuario.email) : "Sesión activa";

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
        <button type="button" className="burger" onClick={onToggleMobile} aria-label="Abrir menú">
          <MenuOutlined />
        </button>
        <div className="crumb">
          <span className="crumb-brand">IMVOLT</span>
          <span className="sep">/</span>
          <b>{label}</b>
        </div>
      </div>

      <div className="top-actions">
        <span className="pill demo-pill hide-sm">
          <span className="dot" />
          DEMO INTERACTIVA
        </span>
        <span className="pill hide-sm">◈ {wallet?.saldo ?? 0} créditos simulados</span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/estudio")}
        >
          <ThunderboltOutlined />
          Crear con AI
        </button>
        <Link to="/configuracion" className="pill" title="Configuración" style={{ padding: "7px 11px" }}>
          ⚙
        </Link>

        {status === "authenticated" && (
          <Dropdown
            placement="bottomRight"
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "perfil",
                  disabled: true,
                  label: (
                    <div className="user-menu-head">
                      <b>{nombre}</b>
                      <small>{detalle}</small>
                    </div>
                  ),
                },
                { type: "divider" },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "Cerrar sesión",
                  onClick: () => void logout(),
                },
              ],
            }}
          >
            <button type="button" className="user-chip" title={`${nombre} — cerrar sesión`}>
              <span className="avatar">{perfil ? initials(nombre) : "…"}</span>
              <span className="user-chip-body">
                <b>{nombre}</b>
                <small>{detalle}</small>
              </span>
            </button>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
