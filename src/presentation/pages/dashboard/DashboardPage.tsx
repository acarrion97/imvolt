import { Link, useNavigate } from "react-router-dom";
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  LayoutOutlined,
  NotificationOutlined,
  PlusOutlined,
  RobotOutlined,
  RiseOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import {
  useCampanas,
  useGeneraciones,
  useLeads,
  usePropiedades,
  useProyectos,
} from "@/presentation/hooks";
import { CATEGORIA_LABEL, artVariant } from "@/presentation/components/common/propiedadArt";
import { formatPrecio } from "@/presentation/components/common/status";

/**
 * Inicio — UI Concept 01 del prototipo: encabezado editorial, aviso de demo,
 * cuatro métricas, hero de marca (MARKETING INMOBILIARIO AI), acciones
 * rápidas y propiedades recientes.
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { data: propiedades } = usePropiedades();
  const { data: proyectos } = useProyectos();
  const { data: generaciones } = useGeneraciones();
  const { data: campanas } = useCampanas();
  const { data: leads } = useLeads();

  const recientes = [...(propiedades ?? [])]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);

  const activas = (campanas ?? []).filter((c) =>
    ["active", "published_paused", "approved"].includes(c.estado),
  ).length;
  const creativosListos = (generaciones ?? []).filter((g) => g.status === "completed").length;

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">IMVOLT · Workspace Urbaniza Capital</p>
          <h1>El crecimiento de tus proyectos, en una sola plataforma.</h1>
          <p className="sub">
            Crea contenido con AI, prepara tus campañas de Meta y haz seguimiento a tus contactos
            desde un mismo lugar.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/propiedades" className="btn btn-primary">
            Ver mis propiedades <ArrowRightOutlined />
          </Link>
        </div>
      </div>

      <div className="notice">
        <strong>Demo interactiva.</strong> Estás trabajando con datos de ejemplo: los créditos y la
        conexión con Meta están simulados hasta conectar la API.
      </div>

      <div className="grid cols4">
        <div className="card stat">
          <span className="stat-icon">
            <ApartmentOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Propiedades</span>
            <div className="stat-value">{propiedades?.length ?? 0}</div>
            <span className="delta muted">En {proyectos?.length ?? 0} proyectos</span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <RobotOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Creativos IA</span>
            <div className="stat-value">{generaciones?.length ?? 0}</div>
            <span className="delta">{creativosListos} completados</span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <NotificationOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Campañas</span>
            <div className="stat-value">{campanas?.length ?? 0}</div>
            <span className="delta">{activas} en curso</span>
          </span>
        </div>

        <div className="card stat">
          <span className="stat-icon">
            <UsergroupAddOutlined />
          </span>
          <span className="stat-body">
            <span className="stat-label">Leads reales</span>
            <div className="stat-value">{leads?.length ?? 0}</div>
            <span className="delta muted">De Meta, WhatsApp y landing</span>
          </span>
        </div>
      </div>

      {/* Hero de marca */}
      <section className="hero">
        <img src="/logo/IMVOLT_Isotipo_Sobre_Oscuro.png" alt="" className="hero-emblem" />
        <p className="eyebrow">MARKETING INMOBILIARIO AI</p>
        <h2>Tu próxima campaña comienza con una propiedad.</h2>
        <p>
          Genera el creativo con el Estudio IA, valida el flujo de aprobación y publica con
          fidelidad de contenido: cada render se etiqueta como conceptual.
        </p>
        <div className="hero-cta">
          <button type="button" className="btn btn-primary" onClick={() => navigate("/estudio")}>
            <RobotOutlined /> Crear contenido con AI
          </button>
          <Link
            to="/plantillas"
            className="btn btn-outline"
            style={{ background: "transparent", borderColor: "#2e8c58", color: "#d6efe1" }}
          >
            <LayoutOutlined /> Explorar plantillas
          </Link>
        </div>
      </section>

      {/* Acciones rápidas */}
      <div className="section-title">
        <h2>Acciones rápidas</h2>
      </div>
      <div className="grid cols3">
        <button type="button" className="quick" onClick={() => navigate("/propiedades")}>
          <span className="quick-icon">
            <PlusOutlined />
          </span>
          <strong>Nueva propiedad</strong>
          <span>Registra una unidad del proyecto en el catálogo.</span>
        </button>

        <button type="button" className="quick" onClick={() => navigate("/plantillas")}>
          <span className="quick-icon">
            <LayoutOutlined />
          </span>
          <strong>Explorar plantillas</strong>
          <span>Estructuras narrativas listas por tipo de inmueble.</span>
        </button>

        <button type="button" className="quick" onClick={() => navigate("/campanas")}>
          <span className="quick-icon">
            <NotificationOutlined />
          </span>
          <strong>Preparar campaña</strong>
          <span>Arma el borrador y envíalo al flujo de aprobación.</span>
        </button>
      </div>

      {/* Propiedades recientes */}
      <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2>Propiedades recientes</h2>
          <p className="sub">Las últimas unidades agregadas al catálogo.</p>
        </div>
        <Link to="/propiedades" className="linkbtn">
          Ver todas <ArrowRightOutlined />
        </Link>
      </div>

      <div className="grid cols3">
        {recientes.map((p) => (
          <div key={p.property_id} className="card item-card">
            <div className={`art ${artVariant(p.categoria)}`}>
              <span className="tag">{CATEGORIA_LABEL[p.categoria]}</span>
            </div>
            <div className="item-meta">
              <h3>{p.nombre}</h3>
              <span className="where">
                {p.direccion ?? "Sin dirección"} · {p.ciudad ?? "—"}
              </span>
            </div>
            <div className="item-bottom">
              <span className="price">{formatPrecio(p.precio, p.moneda)}</span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "8px 13px", fontSize: 11 }}
                onClick={() => navigate("/estudio", { state: { propertyId: p.property_id } })}
              >
                Crear <ArrowRightOutlined />
              </button>
            </div>
          </div>
        ))}
        {recientes.length === 0 && (
          <div className="card card-pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
            <p className="sub">Aún no hay propiedades registradas.</p>
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => navigate("/propiedades")}>
                <PlusOutlined /> Registrar la primera
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="section-title">
        <h2>Señales de la semana</h2>
      </div>
      <div className="grid cols2">
        <div className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="stat-icon">
            <RiseOutlined />
          </span>
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>{activas} campañas en curso</strong>
            <span className="sub">
              Siguen el flujo §10: validadas y listas para aprobación de Meta.
            </span>
          </div>
        </div>
        <div className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="stat-icon">
            <TeamOutlined />
          </span>
          <div>
            <strong style={{ display: "block", fontSize: 14 }}>
              {leads?.length ?? 0} contactos en la base
            </strong>
            <span className="sub">Consolidados con deduplicación por fuente (§11).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
