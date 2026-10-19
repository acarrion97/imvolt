/**
 * Sesión y perfil del usuario IMVOLT (API `/api/auth`).
 *
 * El API devuelve los tokens de Supabase Auth en el login y resuelve el
 * usuario local (tabla `usuarios`, con su empresa) más los roles asignados
 * en `roles_usuarios` con GET /api/auth/me.
 */

/** Tokens devueltos por `POST /api/auth/login`. */
export interface Session {
  access_token: string;
  refresh_token: string;
  user_id: string;
  /**
   * Empresa activa (tenant). No viene en el login: se completa con la
   * respuesta de `/auth/me` y viaja en cada petición como `X-Empresa-Id`.
   */
  empresa_id?: number;
}

export interface AuthEmpresa {
  empresa_id: number;
  razon_social: string;
}

/** Usuario local tal como lo devuelve `/auth/me` (FK `empresas` incrustada). */
export interface AuthUsuario {
  usuario_id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa_id: number;
  empresa: AuthEmpresa | null;
}

export interface AuthRol {
  usuario_rol_id: number;
  rol_id: number;
  /** `propietario` · `administrador` · `marketing` · `agente` · `lector` (§13). */
  nombre: string;
}

/** Perfil autenticado: usuario local + roles asignados en su empresa. */
export interface Perfil {
  usuario: AuthUsuario;
  roles: AuthRol[];
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Contrato de autenticación; lo implementa el repositorio REST. */
export interface AuthRepository {
  login(input: LoginInput): Promise<Session>;
  /** Requiere un token válido; sin sesión local el API responde 404. */
  me(): Promise<Perfil>;
}
