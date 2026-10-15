import { theme } from "antd";

/**
 * Logos oficiales IMVOLT (activos de /public/logo generados del manual).
 *
 * Variantes:
 *  - "horizontal":        lockup horizontal a color (fondos claros).
 *  - "horizontal-oscuro": lockup horizontal en blanco (fondos carbón).
 *  - "isotipo":           solo isotipo a color.
 *  - "isotipo-oscuro":    solo isotipo en blanco.
 *
 * El isotipo son las tres piezas geométricas ascendentes; nunca se dibuja
 * con rayos ni se recolorea fuera de la paleta del manual.
 */
export type ImvoltLogoVariant = "horizontal" | "horizontal-oscuro" | "isotipo" | "isotipo-oscuro";

const SOURCES: Record<ImvoltLogoVariant, string> = {
  horizontal: "/logo/IMVOLT_Logo_Horizontal_Color.png",
  "horizontal-oscuro": "/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png",
  isotipo: "/logo/IMVOLT_Isotipo_Color.png",
  "isotipo-oscuro": "/logo/IMVOLT_Isotipo_Sobre_Oscuro.png",
};

const ALT: Record<ImvoltLogoVariant, string> = {
  horizontal: "IMVOLT — Marketing Inmobiliario AI",
  "horizontal-oscuro": "IMVOLT — Marketing Inmobiliario AI",
  isotipo: "Isotipo IMVOLT",
  "isotipo-oscuro": "Isotipo IMVOLT",
};

interface ImvoltLogoProps {
  variant?: ImvoltLogoVariant;
  /** Alto en píxeles; el ancho se escala proporcionalmente. */
  height?: number;
  style?: React.CSSProperties;
}

export function ImvoltLogo({ variant = "horizontal", height = 32, style }: ImvoltLogoProps) {
  return (
    <img
      src={SOURCES[variant]}
      alt={ALT[variant]}
      height={height}
      style={{ display: "block", width: "auto", ...style }}
      draggable={false}
    />
  );
}

/**
 * Lockup de texto para contexts donde una imagen no escala bien
 * (menú colapsado, títulos compactos): isotipo + wordmark + descriptor.
 */
export function ImvoltWordmark({ collapsed = false }: { collapsed?: boolean }) {
  const { token } = theme.useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <ImvoltLogo variant="isotipo-oscuro" height={collapsed ? 26 : 28} />
      {!collapsed && (
        <div style={{ lineHeight: 1.05, minWidth: 0 }}>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 2.5,
            }}
          >
            IMVOLT
          </div>
          <div
            style={{
              color: token.colorTextQuaternary,
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: 1.2,
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            MARKETING INMOBILIARIO AI
          </div>
        </div>
      )}
    </div>
  );
}
