import { useState } from "react";
import { Alert, App, Button, Card, Input, Select, Space, Spin, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/infrastructure/http/httpClient";

interface Catalogo {
  rol_id?: number;
  permiso_id?: number;
  nombre: string;
  estado: "activo" | "inactivo";
}

interface PermisoRol {
  permiso_rol_id: number;
  rol_id: number;
  permiso_id: number;
  estado: "activo" | "inactivo";
}

type Cambio =
  | { tipo: "crear-rol" | "crear-permiso"; nombre: string }
  | { tipo: "estado-rol" | "estado-permiso"; id: number; estado: "activo" | "inactivo" }
  | { tipo: "asignar"; rolId: number; permisoId: number; habilitado: boolean };

export function RolesPermisosPanel() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [nuevoRol, setNuevoRol] = useState("");
  const [nuevoPermiso, setNuevoPermiso] = useState("");
  const rolesQuery = useQuery({ queryKey: ["platform-rbac", "roles"], queryFn: () => http.get<Catalogo[]>("/v1/roles") });
  const permisosQuery = useQuery({ queryKey: ["platform-rbac", "permisos"], queryFn: () => http.get<Catalogo[]>("/v1/permisos") });
  const asignacionesQuery = useQuery({ queryKey: ["platform-rbac", "asignaciones"], queryFn: () => http.get<PermisoRol[]>("/v1/roles-permisos") });
  const guardar = useMutation({
    mutationFn: async (cambio: Cambio) => {
      if (cambio.tipo === "crear-rol") return http.post("/v1/roles", { nombre: cambio.nombre });
      if (cambio.tipo === "crear-permiso") return http.post("/v1/permisos", { nombre: cambio.nombre });
      if (cambio.tipo === "estado-rol") return http.patch(`/v1/roles/${cambio.id}`, { estado: cambio.estado });
      if (cambio.tipo === "estado-permiso") return http.patch(`/v1/permisos/${cambio.id}`, { estado: cambio.estado });
      if (cambio.tipo !== "asignar") return;
      const existing = (asignacionesQuery.data ?? []).find((item) => item.rol_id === cambio.rolId && item.permiso_id === cambio.permisoId);
      if (cambio.habilitado && !existing) return http.post("/v1/roles-permisos", { rol_id: cambio.rolId, permiso_id: cambio.permisoId });
      if (!cambio.habilitado && existing) return http.del(`/v1/roles-permisos/${existing.permiso_rol_id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform-rbac"] });
      message.success("Cambios guardados.");
    },
    onError: (error: Error) => message.error(error.message || "No se pudieron guardar los cambios."),
  });
  const roles = rolesQuery.data ?? [];
  const permisos = permisosQuery.data ?? [];
  const asignaciones = asignacionesQuery.data ?? [];
  const loading = rolesQuery.isLoading || permisosQuery.isLoading || asignacionesQuery.isLoading;
  const error = rolesQuery.error ?? permisosQuery.error ?? asignacionesQuery.error;

  const columns: TableColumnsType<Catalogo> = [
    { title: "Rol", dataIndex: "nombre", key: "nombre", render: (nombre: string) => <strong>{nombre}</strong> },
    {
      title: "Permisos asignados", key: "permisos", render: (_value, role) => {
        const roleId = Number(role.rol_id);
        const selected = asignaciones.filter((item) => item.rol_id === roleId && item.estado === "activo").map((item) => item.permiso_id);
        return <Select mode="multiple" value={selected} placeholder="Seleccionar permisos" style={{ minWidth: 300, width: "100%" }} disabled={role.estado !== "activo" || guardar.isPending} options={permisos.filter((permission) => permission.estado === "activo").map((permission) => ({ value: permission.permiso_id, label: permission.nombre }))} onChange={(ids: number[]) => {
          const next = new Set(ids);
          void Promise.all([
            ...ids.filter((id) => !selected.includes(id)).map((permisoId) => guardar.mutateAsync({ tipo: "asignar", rolId: roleId, permisoId, habilitado: true })),
            ...selected.filter((id) => !next.has(id)).map((permisoId) => guardar.mutateAsync({ tipo: "asignar", rolId: roleId, permisoId, habilitado: false })),
          ]);
        }} />;
      },
    },
    { title: "Estado", dataIndex: "estado", key: "estado", render: (estado: string) => <Tag color={estado === "activo" ? "green" : "default"}>{estado}</Tag> },
    { title: "Acción", key: "accion", render: (_value, role) => <Button size="small" disabled={guardar.isPending} onClick={() => void guardar.mutateAsync({ tipo: "estado-rol", id: Number(role.rol_id), estado: role.estado === "activo" ? "inactivo" : "activo" })}>{role.estado === "activo" ? "Desactivar" : "Activar"}</Button> },
  ];

  const crear = (tipo: "crear-rol" | "crear-permiso", nombre: string, limpiar: () => void) => {
    if (!nombre.trim()) return;
    void guardar.mutateAsync({ tipo, nombre: nombre.trim() }).then(limpiar);
  };

  return <Spin spinning={loading}>
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {error && <Alert type="error" showIcon message="No se pudo cargar la configuración de roles y permisos" description={error instanceof Error ? error.message : "Verifica el acceso de administrador de plataforma."} />}
      <Card title="Roles y permisos por rol">
        <Space.Compact style={{ marginBottom: 16 }}>
          <Input placeholder="Nombre del nuevo rol" maxLength={30} value={nuevoRol} onChange={(event) => setNuevoRol(event.target.value)} />
          <Button type="primary" loading={guardar.isPending} disabled={!nuevoRol.trim()} onClick={() => crear("crear-rol", nuevoRol, () => setNuevoRol(""))}>Crear rol</Button>
        </Space.Compact>
        <p>Define qué acciones puede realizar cada rol de las empresas. El propietario conserva todos los permisos por seguridad.</p>
        <Table rowKey="rol_id" columns={columns} dataSource={roles} pagination={false} scroll={{ x: 700 }} />
      </Card>
      <Card title="Catálogo de permisos">
        <Space.Compact style={{ marginBottom: 16 }}>
          <Input placeholder="Nombre del permiso" maxLength={60} value={nuevoPermiso} onChange={(event) => setNuevoPermiso(event.target.value)} />
          <Button type="primary" loading={guardar.isPending} disabled={!nuevoPermiso.trim()} onClick={() => crear("crear-permiso", nuevoPermiso, () => setNuevoPermiso(""))}>Crear permiso</Button>
        </Space.Compact>
        <Table rowKey="permiso_id" size="small" pagination={false} dataSource={permisos} columns={[
          { title: "Permiso", dataIndex: "nombre", key: "nombre" },
          { title: "Estado", dataIndex: "estado", key: "estado", render: (estado: string) => <Tag color={estado === "activo" ? "green" : "default"}>{estado}</Tag> },
          { title: "Acción", key: "accion", render: (_value, permission) => <Button size="small" disabled={guardar.isPending} onClick={() => void guardar.mutateAsync({ tipo: "estado-permiso", id: Number(permission.permiso_id), estado: permission.estado === "activo" ? "inactivo" : "activo" })}>{permission.estado === "activo" ? "Desactivar" : "Activar"}</Button> },
        ]} />
      </Card>
    </Space>
  </Spin>;
}
