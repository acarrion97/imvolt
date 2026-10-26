import { useState } from "react";
import { App } from "antd";
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CloudServerOutlined,
  MessageOutlined,
  PlusOutlined,
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  useActualizarEmpresa,
  useConexiones,
  useCreateConexion,
  useDeleteConexion,
  useEmpresa,
  useMiembros,
  usePermisos,
  useRecargarCreditos,
  useTransacciones,
  useWallet,
} from "@/presentation/hooks";
import { empresaSchema } from "@/presentation/validations";
import { formatFecha } from "@/presentation/components/common/status";

const RECARGAS = [10, 50, 100];

/**
 * Configuración — UI Concept 01: integraciones (Higgsfield / Meta /
 * Lotes al Mando), billetera de créditos, perfil de trabajo y los hitos
 * pendientes antes del lanzamiento.
 */
export function ConfiguracionPage() {
  const { message } = App.useApp();
  const { data: conexiones, isLoading: loadingConexiones } = useConexiones();
  const { data: wallet } = useWallet();
  const { data: transacciones } = useTransacciones();
  const createConexion = useCreateConexion();
  const deleteConexion = useDeleteConexion();
  const recargar = useRecargarCreditos();
  const [recargando, setRecargando] = useState<number | null>(null);

  const { data: empresa } = useEmpresa();
  const { data: miembros } = useMiembros();
  const actualizarEmpresa = useActualizarEmpresa();
  const { puedeEditarEmpresa } = usePermisos();
  // Borradores del formulario: `null` = sin editar (se muestra el valor guardado).
  const [razonDraft, setRazonDraft] = useState<string | null>(null);
  const [rucDraft, setRucDraft] = useState<string | null>(null);
  const razonSocial = razonDraft ?? empresa?.razon_social ?? "";
  const ruc = rucDraft ?? empresa?.ruc ?? "";
  const setRazonSocial = setRazonDraft;
  const setRuc = setRucDraft;

  const guardarEmpresa = async () => {
    const parsed = empresaSchema.safeParse({ razon_social: razonSocial, ruc });
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos de la organización.");
      return;
    }
    try {
      await actualizarEmpresa.mutateAsync(parsed.data);
      setRazonDraft(null);
      setRucDraft(null);
      message.success("Organización actualizada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar.");
    }
  };

  const empresaSinCambios =
    !empresa || (razonSocial.trim() === empresa.razon_social && ruc.trim() === (empresa.ruc ?? ""));

  const meta = (conexiones ?? []).find((c) => c.estado === "conectada");

  const conectarMeta = async () => {
    try {
      await createConexion.mutateAsync({
        cuenta_publicitaria_id: `act_demo_${Math.floor(Math.random() * 900000 + 100000)}`,
        nombre_cuenta: "Urbaniza Capital Ads",
        estado: "conectada",
      });
      message.success("Cuenta publicitaria de Meta conectada (demo).");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo conectar Meta.");
    }
  };

  const desconectarMeta = async () => {
    if (!meta) return;
    try {
      await deleteConexion.mutateAsync(meta.connection_id);
      message.success("Conexión de Meta eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo desconectar.");
    }
  };

  const recargarCreditos = async (monto: number) => {
    setRecargando(monto);
    try {
      await recargar.mutateAsync({ monto, idempotencyKey: `demo-${Date.now()}` });
      message.success(`Recarga simulada: +${monto} créditos.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo recargar.");
    } finally {
      setRecargando(null);
    }
  };

  const hitos = [
    {
      label: "Ejecutar database/schema.sql en Supabase",
      ok: false,
      note: "20+ tablas con RLS, índices y seeds",
    },
    { label: "Conectar cuenta publicitaria de Meta", ok: Boolean(meta), note: "OAuth en la API" },
    { label: "Configurar credenciales de Higgsfield", ok: false, note: "HIGGSFIELD_API_KEY" },
    {
      label: "Invitar al equipo de marketing",
      ok: (miembros ?? []).length > 1,
      note: "Roles §13",
    },
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Sistema</p>
          <h1>Conexiones y configuración</h1>
          <p className="sub">
            Integraciones del workspace, billetera de créditos y datos de la organización.
          </p>
        </div>
        <div className="header-actions">
          <span className="count-pill">Saldo: {wallet?.saldo ?? 0} créditos</span>
        </div>
      </div>

      <div className="grid cols2" style={{ alignItems: "start" }}>
        {/* ── Integraciones ──────────────────────────────────────────────── */}
        <div className="card card-pad">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Integraciones</h2>

          <div className="integration">
            <span className="connect-logo">
              <CloudServerOutlined />
            </span>
            <span className="info">
              <b>Higgsfield</b>
              <span>Motor de generación de imágenes y video (§09).</span>
            </span>
            <span className="mini-badge warn">Simulado</span>
          </div>

          <div className="integration">
            <span className="connect-logo">
              <ApiOutlined />
            </span>
            <span className="info">
              <b>Meta Ads</b>
              <span>
                {meta ? `Conectada: ${meta.cuenta_publicitaria_id}` : "Cuenta publicitaria de "}
                Meta.
              </span>
            </span>
            {loadingConexiones ? (
              <span className="mini-badge grey">...</span>
            ) : meta ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mini-badge">
                  <span className="status-point" /> Conectada
                </span>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: "7px 11px", fontSize: 11 }}
                  onClick={desconectarMeta}
                >
                  <CloseOutlined /> Desconectar
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "8px 13px", fontSize: 11 }}
                onClick={conectarMeta}
                disabled={createConexion.isPending}
              >
                <PlusOutlined /> Conectar
              </button>
            )}
          </div>

          <div className="integration">
            <span className="connect-logo">
              <MessageOutlined />
            </span>
            <span className="info">
              <b>Lotes al Mando</b>
              <span>Captación de leads por mensajería (§11).</span>
            </span>
            <span className="mini-badge grey">Próximamente</span>
          </div>

          <div className="section-title" style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 16 }}>Hitos antes del lanzamiento</h2>
          </div>
          {hitos.map((h) => (
            <div key={h.label} className="list-row">
              <span className="who">
                <span className={`list-dot${h.ok ? "" : " grey"}`} />
                {h.label}
              </span>
              <span className="right">
                {h.ok ? (
                  <span className="mini-badge">
                    <CheckCircleOutlined /> Listo
                  </span>
                ) : (
                  <span className="mini-badge grey">{h.note}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* ── Créditos + perfil ──────────────────────────────────────────── */}
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card card-pad">
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Créditos de generación</h2>
            <p className="sub" style={{ marginBottom: 16 }}>
              Billetera de la organización. En la demo la pasarela confirma al instante.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
              <span className="stat-icon">
                <WalletOutlined />
              </span>
              <div>
                <div className="stat-value">{wallet?.saldo ?? 0}</div>
                <span className="delta muted">créditos disponibles</span>
              </div>
              <span className="spacer" style={{ flex: 1 }} />
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "8px 13px", fontSize: 11 }}
                onClick={() => recargarCreditos(10)}
                disabled={recargando !== null}
              >
                <ReloadOutlined spin={recargando === 10} /> +10
              </button>
              {RECARGAS.slice(1).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "8px 13px", fontSize: 11 }}
                  onClick={() => recargarCreditos(m)}
                  disabled={recargando !== null}
                >
                  <ReloadOutlined spin={recargando === m} /> +{m}
                </button>
              ))}
            </div>

            {(transacciones ?? []).slice(0, 5).map((t) => (
              <div key={t.transaction_id} className="list-row">
                <span className="who">
                  <span className={`list-dot${Number(t.monto) < 0 ? " grey" : ""}`} />
                  {t.descripcion ?? t.tipo}
                  <span style={{ color: "#9aaba0", fontSize: 11 }}>· {formatFecha(t.created_at)}</span>
                </span>
                <span className={`amount ${Number(t.monto) < 0 ? "neg" : "pos"}`}>
                  {Number(t.monto) > 0 ? "+" : ""}
                  {t.monto}
                </span>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <h2 style={{ fontSize: 17, marginBottom: 14 }}>Perfil de trabajo</h2>
            <div className="form-grid">
              <div className="field">
                <span className="lbl">Razón social</span>
                <input
                  className="imvolt-input"
                  value={razonSocial}
                  maxLength={120}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  disabled={!puedeEditarEmpresa}
                />
              </div>
              <div className="field">
                <span className="lbl">RUC (13 dígitos)</span>
                <input
                  className="imvolt-input"
                  value={ruc}
                  maxLength={13}
                  inputMode="numeric"
                  onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                  disabled={!puedeEditarEmpresa}
                />
              </div>
              <div className="field">
                <span className="lbl">Moneda</span>
                <select className="imvolt-select" defaultValue="USD" disabled>
                  <option value="USD">USD — Dólar</option>
                </select>
              </div>
            </div>
            {puedeEditarEmpresa ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: "8px 13px", fontSize: 11, marginTop: 10 }}
                onClick={guardarEmpresa}
                disabled={empresaSinCambios || actualizarEmpresa.isPending}
              >
                Guardar cambios
              </button>
            ) : (
              <p className="footer-note" style={{ marginTop: 4 }}>
                Solo propietarios y administradores pueden editar la organización.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
