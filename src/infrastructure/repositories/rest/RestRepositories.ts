import type {
  AuthRepository,
  AuthRol,
  AuthUsuario,
  LoginInput,
  Perfil,
  RegisterInput,
  RegisterResult,
  Session,
} from "@/domain/auth";
import type {
  Campana,
  CampanaCreate,
  PublicacionCampana,
  CampanaRepository,
} from "@/domain/campana";
import type {
  Conexion,
  ConexionCreate,
  ConexionRepository,
} from "@/domain/conexion";
import type {
  Generacion,
  GeneracionCreate,
  GeneracionRepository,
} from "@/domain/generacion";
import type { Lead, LeadCreate, LeadRepository } from "@/domain/lead";
import type { Modelo, ModeloCreate, ModeloRepository } from "@/domain/modelo";
import type {
  BrandAsset,
  BrandAssetCreate,
  BrandAssetDescarga,
  BrandAssetRepository,
  BrandAssetVersion,
  BrandColor,
  BrandColorCreate,
  BrandColorRepository,
} from "@/domain/brand-kit";
import type {
  Plantilla,
  PlantillaCreate,
  PlantillaRepository,
  TipoPlantilla,
  TipoPlantillaCreate,
  TipoPlantillaRepository,
} from "@/domain/plantilla";
import type {
  Propiedad,
  PropiedadCreate,
  PropiedadRepository,
  TipoPropiedad,
  TipoPropiedadCreate,
  TipoPropiedadRepository,
} from "@/domain/propiedad";
import type { Proyecto, ProyectoCreate, ProyectoRepository } from "@/domain/proyecto";
import type {
  MediaAsset,
  MediaAssetCreate,
  MediaAssetDescarga,
  MediaAssetRepository,
  MediaAssetVersion,
} from "@/domain/media-asset";
import type {
  AsignacionRol,
  AuditoriaLog,
  AuditoriaRepository,
  Empresa,
  EmpresaRepository,
  EmpresaUpdate,
  InvitacionMiembro,
  InvitacionResultado,
  Miembro,
  MiembroCreate,
  MiembroRepository,
  Rol,
  RolRepository,
} from "@/domain/identity";
import type { FilterParams } from "@/domain/core/repositories/CrudRepository";
import type {
  TransaccionCredito,
  TransaccionCreditoCreate,
  TransaccionRepository,
  Wallet,
  WalletRepository,
} from "@/domain/credito";

import { RestCrudRepository } from "@/infrastructure/repositories/rest/RestCrudRepository";
import { ApiError, buildQuery, http } from "@/infrastructure/http/httpClient";

/**
 * Repositorios REST: una línea de recurso por entidad, alineada con el
 * montaje de la API (`/api/v1/...` + VITE_API_URL):
 *
 *   proyectos          → /v1/proyectos
 *   propiedades        → /v1/propiedades
 *   plantillas         → /v1/plantillas
 *   modelos            → /v1/modelos
 *   generaciones       → /v1/creative/generations
 *   conexiones         → /v1/conexiones
 *   campañas           → /v1/campaigns
 *   leads              → /v1/leads
 *   billetera          → /v1/billing/...
 */

export class RestProyectoRepository
  extends RestCrudRepository<Proyecto, string, ProyectoCreate>
  implements ProyectoRepository
{
  constructor() {
    super("v1/proyectos");
  }
}

// ── Tipos de propiedad (catálogo de categorías) ──────────────────────────────
export class RestTipoPropiedadRepository
  extends RestCrudRepository<TipoPropiedad, string, TipoPropiedadCreate>
  implements TipoPropiedadRepository
{
  constructor() {
    super("v1/tipos-propiedad");
  }
}

// ── Propiedades ──────────────────────────────────────────────────────────────
export class RestPropiedadRepository
  extends RestCrudRepository<Propiedad, string, PropiedadCreate>
  implements PropiedadRepository
{
  constructor() {
    super("v1/propiedades");
  }
}

// ── Brand Kit: archivos de marca (CRUD + storage) ───────────────────────────
/**
 * Archivos del Brand Kit: el CRUD de metadatos usa el repositorio genérico y
 * las operaciones de storage (subir versión, descargar, restaurar, borrar)
 * van a las rutas propias del API (`extraRoutes`):
 *
 *   POST   /v1/brand-assets/{id}/versiones                    (multipart)
 *   GET    /v1/brand-assets/{id}/versiones
 *   GET    /v1/brand-assets/{id}/descarga                     (URL firmada)
 *   GET    /v1/brand-assets/{id}/versiones/{vid}/descarga      (URL firmada)
 *   POST   /v1/brand-assets/{id}/versiones/{vid}/restaurar
 *   DELETE /v1/brand-assets/{id}/versiones/{vid}
 */
export class RestBrandAssetRepository
  extends RestCrudRepository<BrandAsset, string, BrandAssetCreate>
  implements BrandAssetRepository
{
  constructor() {
    super("v1/brand-assets");
  }

  async listarVersiones(assetId: string): Promise<BrandAssetVersion[]> {
    return http.get<BrandAssetVersion[]>(`/v1/brand-assets/${assetId}/versiones`);
  }

  async subirVersion(
    assetId: string,
    file: File,
    nota?: string | null,
  ): Promise<BrandAssetVersion> {
    const form = new FormData();
    form.append("archivo", file, file.name);
    if (nota) form.append("nota", nota);
    return http.postForm<BrandAssetVersion>(`/v1/brand-assets/${assetId}/versiones`, form);
  }

  async descargar(assetId: string): Promise<BrandAssetDescarga> {
    return http.get<BrandAssetDescarga>(`/v1/brand-assets/${assetId}/descarga`);
  }

  async descargarVersion(assetId: string, versionId: string): Promise<BrandAssetDescarga> {
    return http.get<BrandAssetDescarga>(
      `/v1/brand-assets/${assetId}/versiones/${versionId}/descarga`,
    );
  }

  async restaurarVersion(assetId: string, versionId: string): Promise<BrandAsset> {
    return http.post<BrandAsset>(
      `/v1/brand-assets/${assetId}/versiones/${versionId}/restaurar`,
      {},
    );
  }

  async eliminarVersion(assetId: string, versionId: string): Promise<void> {
    await http.del(`/v1/brand-assets/${assetId}/versiones/${versionId}`);
  }
}

// ── Catalog: media assets (bucket privado `media-assets`, hasta 100 MB) ──────
/**
 * Misma forma que el Brand Kit, contra `/api/v1/media-assets`:
 *   GET/POST  /{id}/versiones                  historial / subida multipart
 *   GET       /{id}/descarga                   URL firmada de la versión activa
 *   GET       /{id}/versiones/{vid}/descarga   URL firmada de una versión
 *   POST      /{id}/versiones/{vid}/restaurar  vuelve a activarla
 *   DELETE    /{id}/versiones/{vid}            borra fila + blob
 */
export class RestMediaAssetRepository
  extends RestCrudRepository<MediaAsset, string, MediaAssetCreate>
  implements MediaAssetRepository
{
  constructor() {
    super("v1/media-assets");
  }

  async listarVersiones(assetId: string): Promise<MediaAssetVersion[]> {
    return http.get<MediaAssetVersion[]>(`/v1/media-assets/${assetId}/versiones`);
  }

  async subirVersion(
    assetId: string,
    file: File,
    nota?: string | null,
  ): Promise<MediaAssetVersion> {
    const form = new FormData();
    form.append("archivo", file, file.name);
    if (nota) form.append("nota", nota);
    return http.postForm<MediaAssetVersion>(`/v1/media-assets/${assetId}/versiones`, form);
  }

  async descargar(assetId: string): Promise<MediaAssetDescarga> {
    return http.get<MediaAssetDescarga>(`/v1/media-assets/${assetId}/descarga`);
  }

  async descargarVersion(assetId: string, versionId: string): Promise<MediaAssetDescarga> {
    return http.get<MediaAssetDescarga>(
      `/v1/media-assets/${assetId}/versiones/${versionId}/descarga`,
    );
  }

  async restaurarVersion(assetId: string, versionId: string): Promise<MediaAsset> {
    return http.post<MediaAsset>(
      `/v1/media-assets/${assetId}/versiones/${versionId}/restaurar`,
      {},
    );
  }

  async eliminarVersion(assetId: string, versionId: string): Promise<void> {
    await http.del(`/v1/media-assets/${assetId}/versiones/${versionId}`);
  }
}

// ── Brand Kit: colores de la paleta ─────────────────────────────────────────
export class RestBrandColorRepository
  extends RestCrudRepository<BrandColor, string, BrandColorCreate>
  implements BrandColorRepository
{
  constructor() {
    super("v1/brand-colors");
  }
}

export class RestPlantillaRepository
  extends RestCrudRepository<Plantilla, string, PlantillaCreate>
  implements PlantillaRepository
{
  constructor() {
    super("v1/plantillas");
  }
}
// ── Tipos de plantilla (catálogo de categorías) ──────────────────────────────
export class RestTipoPlantillaRepository
  extends RestCrudRepository<TipoPlantilla, string, TipoPlantillaCreate>
  implements TipoPlantillaRepository
{
  constructor() {
    super("v1/tipos-plantilla");
  }
}


export class RestModeloRepository
  extends RestCrudRepository<Modelo, string, ModeloCreate>
  implements ModeloRepository
{
  constructor() {
    super("v1/modelos");
  }
}

export class RestGeneracionRepository
  extends RestCrudRepository<Generacion, string, GeneracionCreate>
  implements GeneracionRepository
{
  constructor() {
    super("v1/creative/generations");
  }

  async getByPropiedadId(propertyId: string): Promise<Generacion[]> {
    return this.getAll({ property_id: propertyId });
  }
}

export class RestConexionRepository
  extends RestCrudRepository<Conexion, string, ConexionCreate>
  implements ConexionRepository
{
  constructor() {
    super("v1/conexiones");
  }
}

export class RestCampanaRepository
  extends RestCrudRepository<Campana, string, CampanaCreate>
  implements CampanaRepository
{
  constructor() {
    super("v1/campaigns");
  }

  async getByPropiedadId(propertyId: string): Promise<Campana[]> {
    return this.getAll({ property_id: propertyId });
  }

  publicar(campaignId: string): Promise<PublicacionCampana> {
    return http.post<PublicacionCampana>(`/v1/campanias-publicitarias/${campaignId}/publicar`, {});
  }
}

export class RestLeadRepository
  extends RestCrudRepository<Lead, string, LeadCreate>
  implements LeadRepository
{
  constructor() {
    super("v1/leads");
  }

  async getByCampanaId(campaignId: string): Promise<Lead[]> {
    return this.getAll({ campaign_id: campaignId });
  }
}

export class RestWalletRepository implements WalletRepository {
  async getWallet(): Promise<Wallet> {
    return http.get<Wallet>(`/v1/billing/wallet${buildQuery()}`);
  }

  async getTransacciones(): Promise<TransaccionCredito[]> {
    return http.get<TransaccionCredito[]>(`/v1/billing/transactions${buildQuery()}`);
  }

  async recargar(monto: number, idempotencyKey?: string): Promise<Wallet> {
    return http.post<Wallet>("/v1/billing/recharge", {
      monto,
      idempotency_key: idempotencyKey,
    });
  }
}

export class RestTransaccionRepository
  extends RestCrudRepository<TransaccionCredito, string, TransaccionCreditoCreate>
  implements TransaccionRepository
{
  constructor() {
    super("v1/billing/transactions");
  }
}

/**
 * Miembros del equipo (`/api/v1/usuarios`) + las dos operaciones de equipo:
 *
 *   POST   /v1/usuarios/invitaciones     alta con credencial temporal
 *   GET    /v1/roles-usuarios            localiza la asignación a actualizar
 *   PATCH  /v1/roles-usuarios/{id}       cambia el rol vigente
 *   POST   /v1/roles-usuarios            crea la asignación si no había
 *
 * `GET /v1/usuarios` ya devuelve `roles[]` computado (roles activos), así que
 * la pantalla no necesita cruzar con `roles-usuarios` para pintar la tabla.
 */
export class RestMiembroRepository
  extends RestCrudRepository<Miembro, string, MiembroCreate>
  implements MiembroRepository
{
  constructor() {
    super("v1/usuarios");
  }

  async invitar(input: InvitacionMiembro): Promise<InvitacionResultado> {
    return http.post<InvitacionResultado>("/v1/usuarios/invitaciones", input);
  }

  async cambiarRol(usuarioId: string, rolId: string): Promise<void> {
    const asignaciones = await http.get<AsignacionRol[]>(
      `/v1/roles-usuarios${buildQuery({ usuario_id: usuarioId, estado: "activo" })}`,
    );
    const vigente = asignaciones[0];

    if (!vigente) {
      await http.post("/v1/roles-usuarios", { usuario_id: usuarioId, rol_id: rolId });
      return;
    }
    if (String(vigente.rol_id) === String(rolId)) return;

    await http.patch(`/v1/roles-usuarios/${vigente.usuario_rol_id}`, { rol_id: rolId });
  }
}

/** Catálogo de roles §13 (`GET /v1/roles`, catálogo compartido). */
export class RestRolRepository implements RolRepository {
  async listar(): Promise<Rol[]> {
    return http.get<Rol[]>("/v1/roles");
  }
}

/**
 * Bitácora de auditoría (`GET /v1/auditoria`): SOLO LECTURA (create/update/
 * remove están deshabilitados en el API) y reservada a propietario/admin.
 */
export class RestAuditoriaRepository implements AuditoriaRepository {
  async listar(filters?: FilterParams): Promise<AuditoriaLog[]> {
    return http.get<AuditoriaLog[]>(`/v1/auditoria${buildQuery(filters)}`);
  }
}

/**
 * Perfil de la organización (`/api/v1/empresas`), acotado por el API a la
 * empresa de la sesión: el listado trae una sola fila, así que "la actual"
 * es la primera. `actualizar` reutiliza ese id para el PATCH.
 */
export class RestEmpresaRepository implements EmpresaRepository {
  async obtenerActual(): Promise<Empresa | null> {
    const empresas = await http.get<Empresa[]>("/v1/empresas");
    return empresas[0] ?? null;
  }

  async actualizar(data: EmpresaUpdate): Promise<Empresa> {
    const actual = await this.obtenerActual();
    if (!actual) {
      throw new ApiError("No se encontró la organización de la sesión", 404);
    }
    return http.patch<Empresa>(`/v1/empresas/${actual.empresa_id}`, data);
  }
}

/**
 * Autenticación contra el API (`/api/auth`):
 *
 *   POST /api/auth/login  → { access_token, refresh_token, user_id }
 *   GET  /api/auth/me     → { usuario (con empresa), roles[] }
 *
 * El cierre de sesión es local (borrar la sesión persistida): el API no
 * expone logout y los tokens de Supabase caducan por sí solos.
 */
export class RestAuthRepository implements AuthRepository {
  /** POST /api/auth/register → crea usuario, empresa y rol propietario. */
  async register(input: RegisterInput): Promise<RegisterResult> {
    return http.post<RegisterResult>("/auth/register", input);
  }

  async login(input: LoginInput): Promise<Session> {
    return http.post<Session>("/auth/login", input);
  }

  async me(): Promise<Perfil> {
    const response = await http.get<{
      usuario: AuthUsuario | null;
      roles: AuthRol[];
      permisos?: string[];
    }>("/auth/me");

    if (!response.usuario) {
      throw new ApiError(
        "El usuario no tiene una cuenta registrada en la plataforma",
        404,
      );
    }

    return {
      usuario: response.usuario,
      roles: response.roles ?? [],
      permisos: response.permisos ?? [],
    };
  }
}
