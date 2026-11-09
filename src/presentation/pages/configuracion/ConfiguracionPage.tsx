import { useState } from "react";
import { App } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { useActualizarEmpresa, useEmpresa, usePermisos } from "@/presentation/hooks";
import { empresaSchema } from "@/presentation/validations";
import { IntegracionesEmpresaPanel } from "./IntegracionesEmpresaPanel";

/**
 * Configuración — UI Concept 01: integraciones (Higgsfield / Meta /
 * Lotes al Mando) y perfil de trabajo.
 */
export function ConfiguracionPage() {
  const { message } = App.useApp();
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

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Sistema</p>
          <h1>Conexiones y configuración</h1>
          <p className="sub">Integraciones del workspace y datos de la organización.</p>
        </div>
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
      <div className="grid cols2">
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Otras integraciones</h2>
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
        </div>
        <div className="card card-pad" style={{ marginTop: 20 }}>
          <IntegracionesEmpresaPanel />
        </div>
      </div>
    </div>
  );
}
