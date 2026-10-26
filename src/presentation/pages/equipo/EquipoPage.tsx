import { useMemo, useState } from "react";
import { Alert, App, Button, Drawer, Form, Input, Modal, Popconfirm, Select, Spin, Tabs, Typography } from "antd";
import { CopyOutlined, PlusOutlined, SearchOutlined, StopOutlined, UndoOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { DataTable } from "@/presentation/components/common/DataTable";
import { formatFecha } from "@/presentation/components/common/status";
import {
  useAuditoria,
  useAuth,
  useCambiarRolMiembro,
  useInvitarMiembro,
  useMiembros,
  usePermisos,
  useRoles,
  useUpdateMiembro,
} from "@/presentation/hooks";
import { invitacionSchema } from "@/presentation/validations";
import {
  ACCION_LABEL,
  ACCIONES_AUDITORIA,
  PERMISO_LABEL,
  PERMISOS_ORG,
  ROL_LABEL,
  ROLES_ORG,
  type AccionAuditoria,
  type AuditoriaLog,
  type InvitacionResultado,
  type Miembro,
  type RolOrg,
} from "@/domain/identity";

interface InvitarValues {
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: RolOrg;
}

const rolLabel = (nombre: string | undefined) =>
  nombre ? (ROL_LABEL[nombre as RolOrg] ?? nombre) : "Sin rol";

/**
 * Equipo — miembros de la organización (invitación y cambio de rol, §13) y
 * bitácora de auditoría (solo propietario/administrador).
 */
export function EquipoPage() {
  const { message } = App.useApp();
  const { perfil } = useAuth();
  const { puedeGestionarUsuarios, puedeVerAuditoria } = usePermisos();

  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [invitacion, setInvitacion] = useState<InvitacionResultado | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [form] = Form.useForm<InvitarValues>();

  const { data: miembros, isLoading } = useMiembros();
  const { data: roles } = useRoles();
  const invitar = useInvitarMiembro();
  const cambiarRol = useCambiarRolMiembro();
  const updateMiembro = useUpdateMiembro();

  const miPropioId = perfil ? String(perfil.usuario.usuario_id) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (miembros ?? []).filter(
      (m) => !q || m.nombre.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [miembros, search]);

  const rolIdPorNombre = useMemo(
    () => new Map((roles ?? []).map((r) => [r.nombre, String(r.rol_id)])),
    [roles],
  );

  const abrirInvitar = () => {
    form.resetFields();
    form.setFieldsValue({ rol: "agente" });
    setDrawerOpen(true);
  };

  const handleInvitar = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = invitacionSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    try {
      const resultado = await invitar.mutateAsync({
        ...parsed.data,
        telefono: parsed.data.telefono || null,
      });
      setDrawerOpen(false);
      setInvitacion(resultado);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo invitar al miembro.");
    }
  };

  const handleCambiarRol = async (miembro: Miembro, nombreRol: string) => {
    const rolId = rolIdPorNombre.get(nombreRol);
    if (!rolId) {
      message.error("No se encontró el rol en el catálogo.");
      return;
    }
    setCambiando(miembro.usuario_id);
    try {
      await cambiarRol.mutateAsync({ usuarioId: miembro.usuario_id, rolId });
      message.success(`${miembro.nombre} ahora es ${rolLabel(nombreRol)}.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo cambiar el rol.");
    } finally {
      setCambiando(null);
    }
  };

  const handleEstado = async (miembro: Miembro) => {
    const estado = miembro.estado === "activo" ? "inactivo" : "activo";
    try {
      await updateMiembro.mutateAsync({ id: miembro.usuario_id, data: { estado } });
      message.success(estado === "activo" ? "Miembro reactivado." : "Acceso revocado.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo actualizar el miembro.");
    }
  };

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      message.success("Copiado.");
    } catch {
      message.error("No se pudo copiar; selecciónalo manualmente.");
    }
  };

  const columns: ColumnsType<Miembro> = [
    {
      title: "Miembro",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div>
          <span style={{ fontWeight: 650, display: "block" }}>{nombre}</span>
          <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
            {row.email}
            {row.telefono ? ` · ${row.telefono}` : ""}
          </span>
        </div>
      ),
    },
    {
      title: "Rol",
      key: "rol",
      width: 200,
      render: (_, row) =>
        puedeGestionarUsuarios && row.estado === "activo" ? (
          <Select
            style={{ width: 170 }}
            value={row.roles[0]}
            placeholder="Sin rol"
            loading={cambiando === row.usuario_id}
            disabled={cambiando !== null}
            onChange={(value) => handleCambiarRol(row, value)}
            options={ROLES_ORG.map((r) => ({ value: r, label: ROL_LABEL[r] }))}
          />
        ) : (
          <span className="mini-badge grey">{rolLabel(row.roles[0])}</span>
        ),
    },
    {
      title: "Estado",
      key: "estado",
      width: 190,
      render: (_, row) => (
        <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span className={row.estado === "activo" ? "mini-badge" : "mini-badge grey"}>
            {row.estado === "activo" ? "Activo" : "Inactivo"}
          </span>
          {row.contrasenia_temporal_hasta && (
            <span className="mini-badge warn" title="Aún no cambió la contraseña temporal">
              Invitación pendiente
            </span>
          )}
        </span>
      ),
    },
    {
      title: "Alta",
      dataIndex: "creado_en",
      key: "creado_en",
      width: 130,
      render: (v: string) => formatFecha(v),
    },
    ...(puedeGestionarUsuarios
      ? [
          {
            title: "",
            key: "acciones",
            width: 150,
            render: (_: unknown, row: Miembro) => {
              const esYo = miPropioId !== null && String(row.usuario_id) === miPropioId;
              if (esYo) return <span style={{ color: "#8b9a93", fontSize: 11.5 }}>Tú</span>;
              return row.estado === "activo" ? (
                <Popconfirm
                  title="¿Revocar el acceso de este miembro?"
                  okText="Revocar"
                  cancelText="Cancelar"
                  onConfirm={() => handleEstado(row)}
                >
                  <button type="button" className="btn btn-danger" style={{ padding: "6px 11px", fontSize: 11 }}>
                    <StopOutlined /> Desactivar
                  </button>
                </Popconfirm>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: "6px 11px", fontSize: 11 }}
                  onClick={() => handleEstado(row)}
                >
                  <UndoOutlined /> Reactivar
                </button>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Equipo y auditoría</h1>
          <p className="sub">
            Miembros de la organización, sus roles (§13) y el registro de actividad.
          </p>
        </div>
        <div className="header-actions">
          {puedeGestionarUsuarios && (
            <button type="button" className="btn btn-primary" onClick={abrirInvitar}>
              <PlusOutlined /> Invitar miembro
            </button>
          )}
        </div>
      </div>

      <Tabs
        items={[
          {
            key: "miembros",
            label: `Miembros${miembros ? ` (${miembros.length})` : ""}`,
            children: (
              <>
                <div className="card card-pad" style={{ marginBottom: 20 }}>
                  <div className="filters" style={{ marginBottom: 0 }}>
                    <Input
                      className="search"
                      allowClear
                      prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
                      placeholder="Buscar por nombre o correo..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="spacer" />
                    <span className="count-pill">{filtered.length} miembros</span>
                  </div>
                </div>

                <Spin spinning={isLoading}>
                  <div className="card" style={{ padding: "0 16px 8px" }}>
                    <DataTable<Miembro>
                      card={false}
                      columns={columns}
                      dataSource={filtered}
                      rowKey="usuario_id"
                      pagination={filtered.length > 10 ? undefined : false}
                    />
                  </div>
                </Spin>

                <div className="card card-pad" style={{ marginTop: 20 }}>
                  <h2 style={{ fontSize: 16, marginBottom: 6 }}>Permisos del catálogo</h2>
                  <p className="sub" style={{ marginBottom: 10 }}>
                    El propietario hereda todos; el resto depende de su rol.
                  </p>
                  {PERMISOS_ORG.map((p) => (
                    <span key={p} className="mini-badge grey" style={{ marginRight: 6 }}>
                      {PERMISO_LABEL[p]}
                    </span>
                  ))}
                </div>
              </>
            ),
          },
          {
            key: "auditoria",
            label: "Auditoría",
            children: puedeVerAuditoria ? (
              <AuditoriaTab />
            ) : (
              <Alert
                type="info"
                showIcon
                title="La bitácora está reservada a propietarios y administradores."
              />
            ),
          },
        ]}
      />

      <Drawer
        title="Invitar miembro"
        size="default"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={handleInvitar} loading={invitar.isPending}>
            Invitar
          </Button>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre completo"
            rules={[{ required: true, message: "Indica el nombre del miembro." }]}
          >
            <Input placeholder="Ej: Valeria Ortiz" maxLength={120} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo de acceso"
            rules={[{ required: true, message: "Indica el correo." }]}
          >
            <Input placeholder="valeria@empresa.com" maxLength={120} />
          </Form.Item>
          <Form.Item name="telefono" label="Teléfono / WhatsApp">
            <Input placeholder="+593 99 123 4567" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="rol"
            label="Rol"
            rules={[{ required: true, message: "Selecciona el rol." }]}
          >
            <Select options={ROLES_ORG.map((r) => ({ value: r, label: ROL_LABEL[r] }))} />
          </Form.Item>
          <p className="footer-note">
            No se envía correo: al invitar verás una contraseña temporal (válida 7 días) para
            compartirla por otro canal.
          </p>
        </Form>
      </Drawer>

      <Modal
        title="Miembro invitado"
        open={invitacion !== null}
        onCancel={() => setInvitacion(null)}
        footer={
          <Button type="primary" onClick={() => setInvitacion(null)}>
            Listo
          </Button>
        }
      >
        {invitacion && (
          <>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 14 }}
              title="Copia la contraseña ahora: no se volverá a mostrar."
            />
            <p style={{ marginBottom: 6 }}>Rol asignado: <b>{rolLabel(invitacion.rol)}</b></p>
            <Typography.Text code style={{ fontSize: 16 }}>
              {invitacion.contrasenia_temporal}
            </Typography.Text>{" "}
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copiar(invitacion.contrasenia_temporal)}
            >
              Copiar
            </Button>
            <p className="footer-note" style={{ marginTop: 10 }}>
              Caduca el {formatFecha(invitacion.contrasenia_temporal_hasta)}.
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}

function AuditoriaTab() {
  const [accion, setAccion] = useState<AccionAuditoria | undefined>();
  const [tabla, setTabla] = useState("");

  const { data, isLoading, isError, error } = useAuditoria(accion ? { accion } : undefined);

  const filtered = useMemo(() => {
    const q = tabla.trim().toLowerCase();
    return (data ?? []).filter((l) => !q || l.tabla.toLowerCase().includes(q));
  }, [data, tabla]);

  const columns: ColumnsType<AuditoriaLog> = [
    {
      title: "Fecha",
      dataIndex: "creado_en",
      key: "creado_en",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("es-EC"),
    },
    {
      title: "Acción",
      dataIndex: "accion",
      key: "accion",
      width: 150,
      render: (a: AccionAuditoria) => <span className="mini-badge">{ACCION_LABEL[a] ?? a}</span>,
    },
    { title: "Tabla", dataIndex: "tabla", key: "tabla", width: 160 },
    {
      title: "Registro",
      dataIndex: "registro_id",
      key: "registro_id",
      width: 110,
      render: (v: string | null) => v ?? "—",
    },
    {
      title: "Usuario",
      key: "usuario",
      render: (_, row) =>
        row.usuario ? (
          <div>
            <span style={{ fontWeight: 650, display: "block" }}>{row.usuario.nombre}</span>
            <span style={{ color: "#8b9a93", fontSize: 11.5 }}>{row.usuario.email}</span>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <>
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Filtrar por tabla..."
            value={tabla}
            onChange={(e) => setTabla(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Acción"
            style={{ width: 175 }}
            value={accion}
            onChange={setAccion}
            options={ACCIONES_AUDITORIA.map((a) => ({ value: a, label: ACCION_LABEL[a] }))}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} eventos</span>
        </div>
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          title={error instanceof Error ? error.message : "No se pudo cargar la bitácora."}
        />
      )}

      <Spin spinning={isLoading}>
        <div className="card" style={{ padding: "0 16px 8px" }}>
          <DataTable<AuditoriaLog>
            card={false}
            columns={columns}
            dataSource={filtered}
            rowKey="audit_log_id"
            expandable={{
              rowExpandable: (row) => row.detalles !== null,
              expandedRowRender: (row) => (
                <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(row.detalles, null, 2)}
                </pre>
              ),
            }}
            pagination={filtered.length > 10 ? undefined : false}
          />
        </div>
      </Spin>
    </>
  );
}
