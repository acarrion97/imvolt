import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThunderboltOutlined, MenuOutlined } from "@ant-design/icons";
import { useWallet } from "@/presentation/hooks";

/**
 * Barra superior — UI Concept 01 del prototipo:
 * migas "IMVOLT / Página", píldoras de demo y créditos, y el CTA
 * "Crear con AI" que abre el Estudio IA.
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

  const label = ROUTE_LABELS[pathname] ?? "Inicio";

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
      </div>
    </header>
  );
}
