import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/**
 * Módulo **identity**: equipo (usuarios), roles y permisos (RBAC §13) y
 * bitácora de auditoría.
 *
 * Los catálogos de roles y permisos son fijos e idénticos a los que valida
 * la API (`ORG_ROLES` / `ORG_PERMISSIONS` en `api/src/middlewares/requireRole.ts`):
 * aquí viven para etiquetar la UI sin volver a pedirlos.
 */

/** Roles del RBAC (§13). */
export const ROLES_ORG = [
  "propietario",
  "administrador",
  "marketing",
  "agente",
  "lector",
] as const;

export type RolOrg = (typeof ROLES_ORG)[number];

export const ROL_LABEL: Record<RolOrg, string> = {
  propietario: "Propietario",
  administrador: "Administrador",
  marketing: "Marketing",
  agente: "Agente",
  lector: "Lector",
};

/** Permisos del catálogo (espejo de `ORG_PERMISSIONS` en la API). */
export const PERMISOS_ORG = [
  "gestionar_usuarios",
  "gestionar_propiedades",
  "crear_contenidos",
  "gestionar_campanas",
  "ver_analitica",
  "gestionar_integraciones",
] as const;

export type PermisoOrg = (typeof PERMISOS_ORG)[number];

export const PERMISO_LABEL: Record<PermisoOrg, string> = {
  gestionar_usuarios: "Gestionar usuarios",
  gestionar_propiedades: "Gestionar propiedades",
  crear_contenidos: "Crear contenidos",
  gestionar_campanas: "Gestionar campañas",
  ver_analitica: "Ver analítica",
  gestionar_integraciones: "Gestionar integraciones",
};

/** Estado lógico de usuarios, roles y asignaciones (`public.*.estado`). */
export type IdentityEstado = "activo" | "inactivo";

/**
 * Acciones registradas en `audit_logs` (`AuditAction` del API). `INVITE` es
 * la que emite el alta de miembros; `REGISTER`/`LOGIN` vienen del núcleo.
 */
export const ACCIONES_AUDITORIA = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "REGISTER",
  "LOGIN",
  "INVITE",
] as const;

export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

export const ACCION_LABEL: Record<AccionAuditoria, string> = {
  CREATE: "Alta",
  UPDATE: "Edición",
  DELETE: "Borrado",
  REGISTER: "Registro",
  LOGIN: "Inicio de sesión",
  INVITE: "Invitación",
};

/** Empresa en su forma mínima (FK incrustada desde `usuarios`). */
export interface IdentityEmpresa {
  empresa_id: number;
  razon_social: string;
}

/**
 * Miembro del equipo (fila de `usuarios` de la empresa activa).
 *
 * `roles` es COMPUTADO por la API: nombres de los roles activos que el
 * usuario tiene en `roles_usuarios` (no es una columna, por eso es solo
 * lectura en la UI — cambiarlo pasa por `cambiarRol`).
 */
export interface Miembro {
  usuario_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa_id: number;
  /** Caducidad de la contraseña temporal, si el miembro aún no la cambió. */
  contrasenia_temporal_hasta: string | null;
  estado: IdentityEstado;
  roles: string[];
  empresa: IdentityEmpresa | null;
  creado_en: string;
  actualizado_en: string;
}

/** Payload de alta directa (no usado por la UI: el alta es por invitación). */
export type MiembroCreate = {
  nombre: string;
  email: string;
  telefono?: string | null;
};

/** Datos del formulario "Invitar miembro". */
export interface InvitacionMiembro {
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: RolOrg;
}

/**
 * Respuesta de `POST /api/v1/usuarios/invitaciones`.
 *
 * El API no envía correo (no hay servicio de SMTP configurado), así que la
 * contraseña temporal viaja aquí y hay que comunicarla por fuera: caduca en
 * 7 días y `usuario_id`/`auth_user_id` identifican la fila creada.
 */
export interface InvitacionResultado {
  usuario_id: string;
  auth_user_id: string;
  empresa_id: number;
  rol: string;
  contrasenia_temporal: string;
  contrasenia_temporal_hasta: string;
  message?: string;
}

/** Fila del catálogo `roles` (§13). */
export interface Rol {
  rol_id: string;
  nombre: string;
  estado: IdentityEstado;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Asignación de rol (`roles_usuarios`). La lee `cambiarRol` para localizar
 * el registro que hay que actualizar; la pantalla no la muestra directamente
 * (cada miembro ya trae `roles[]` computado).
 */
export interface AsignacionRol {
  usuario_rol_id: string;
  usuario_id: string;
  rol_id: string;
  estado: IdentityEstado;
  usuario: Miembro | null;
  rol: Rol | null;
  creado_en: string;
  actualizado_en: string;
}

/** Usuario que aparece incrustado en la bitácora (`usuarios(*)`). */
export interface AuditoriaUsuario {
  usuario_id: number;
  nombre: string;
  email: string;
}

/**
 * Registro de `audit_logs` (SOLO LECTURA: lo escribe el núcleo del API en
 * cada escritura y en registro/inicio de sesión).
 */
export interface AuditoriaLog {
  audit_log_id: string;
  accion: AccionAuditoria;
  tabla: string;
  registro_id: string | null;
  usuario_id: number | null;
  empresa_id: number | null;
  detalles: Record<string, unknown> | null;
  usuario: AuditoriaUsuario | null;
  creado_en: string;
}

/** Organización activa (tabla `empresas`): lo que se edita en Configuración. */
export interface Empresa {
  empresa_id: number;
  razon_social: string;
  /** RUC de 13 dígitos; puede venir `null` si la cuenta nunca lo completó. */
  ruc: string | null;
  estado: IdentityEstado;
  creado_en: string;
  actualizado_en: string;
}

/** Payload de edición del perfil de trabajo (ambos campos opcionales). */
export type EmpresaUpdate = {
  razon_social?: string;
  ruc?: string;
};

/**
 * Repositorio de miembros: CRUD de `usuarios` + las dos operaciones de
 * equipo que orquestan varias llamadas del API:
 *
 *  - `invitar` → `POST /v1/usuarios/invitaciones` (crea credencial + fila + rol);
 *  - `cambiarRol` → localiza la asignación en `v1/roles-usuarios` y la
 *    actualiza (o la crea si el miembro no tenía rol activo).
 */
export interface MiembroRepository extends CrudRepository<Miembro, string, MiembroCreate> {
  invitar(input: InvitacionMiembro): Promise<InvitacionResultado>;
  cambiarRol(usuarioId: string, rolId: string): Promise<void>;
}

/** Catálogo de roles: la pantalla solo lo lee (`GET /v1/roles`). */
export interface RolRepository {
  listar(): Promise<Rol[]>;
}

/** Bitácora: solo lectura (`GET /v1/auditoria`, requiere propietario/admin). */
export interface AuditoriaRepository {
  listar(filters?: FilterParams): Promise<AuditoriaLog[]>;
}

/**
 * Perfil de la organización. El API acota `GET /v1/empresas` a la empresa de
 * la sesión, así que "la actual" es la única fila devuelta: no hace falta
 * propagar el id por toda la presentación.
 */
export interface EmpresaRepository {
  obtenerActual(): Promise<Empresa | null>;
  actualizar(data: EmpresaUpdate): Promise<Empresa>;
}
