import { useState } from "react";
import { App } from "antd";
import {
  ReloadOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  useActualizarEmpresa,
  useEmpresa,
  usePermisos,
  useRecargarCreditos,
  useTransacciones,
  useWallet,
} from "@/presentation/hooks";
import { empresaSchema } from "@/presentation/validations";
import { formatFecha } from "@/presentation/components/common/status";
import { IntegracionesEmpresaPanel } from "./IntegracionesEmpresaPanel";

const RECARGAS = [10, 50, 100];

/**
 * Configuración — UI Concept 01: integraciones (Higgsfield / Meta /
 * Lotes al Mando), billetera de créditos y perfil de trabajo.
 */
export function ConfiguracionPage() {
  const { message } = App.useApp();
  const { data: wallet } = useWallet();
  const { data: transacciones } = useTransacciones();
  const recargar = useRecargarCreditos();
  const [recargando, setRecargando] = useState<number | null>(null);
  const { data: empresa } = useEmpresa();
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

  const recargarCreditos = async (monto: number) => {
    setRecargando(monto);
    try {
      await recargar.mutateAsync({ monto, idempotencyKey: crypto.randomUUID() });
      message.success(`Recarga simulada: +${monto} créditos.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo recargar.");
    } finally {
      setRecargando(null);
    }
  };

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

      <div className="grid cols2">
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
                <span className={`amount ${t.tipo === "reserva" || t.tipo === "consumo" ? "neg" : "pos"}`}>
                  {t.tipo === "consumo"
                    ? `${t.creditos} gastados`
                    : t.tipo === "reserva"
                      ? `${t.creditos} reservados`
                      : `${Number(t.monto) > 0 ? "+" : ""}${t.monto}`}
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
      <div className="card card-pad" style={{ marginTop: 20 }}>
        <IntegracionesEmpresaPanel />
      </div>
    </div>
  );
}
