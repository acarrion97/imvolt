import type {
  AuthRepository,
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
  MediaAsset,
  MediaAssetCreate,
  MediaAssetDescarga,
  MediaAssetRepository,
  MediaAssetVersion,
} from "@/domain/media-asset";
import type {
  TransaccionCredito,
  TransaccionCreditoCreate,
  TransaccionRepository,
  Wallet,
  WalletRepository,
} from "@/domain/credito";

import { InMemoryCrudRepository } from "@/infrastructure/repositories/mock/InMemoryCrudRepository";
import {
  ORGANIZATION_ID,
  seedBrandAssetVersions,
  seedBrandAssets,
  seedBrandColors,
  seedCampanas,
  seedConexiones,
  seedAuditoria,
  seedEmpresa,
  seedEmpresaIdentity,
  seedMediaAssetVersions,
  seedMediaAssets,
  seedMiembros,
  seedRoles,
  seedGeneraciones,
  seedLeads,
  seedModelos,
  seedPlantillas,
  seedPropiedades,
  seedProyectos,
  seedTiposPlantilla,
  seedTiposPropiedad,
  seedTransacciones,
  seedWallet,
} from "@/infrastructure/seeds/seeds";

const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const nowIso = (): string => new Date().toISOString();

/**
 * Repositorios mock: mismas interfaces que los REST, pero sobre las semillas
 * de `infrastructure/seeds/seeds.ts`. Los IDs son UUID de verdad para que la
 * UI (rutas con :id, filtros) se comporte igual que contra la API real.
 */

// ── Proyectos ────────────────────────────────────────────────────────────────
export class MockProyectoRepository
  extends InMemoryCrudRepository<Proyecto, string, ProyectoCreate>
  implements ProyectoRepository
{
  constructor() {
    super(
      (row) => row.proyecto_id,
      (data, id) => ({
        nombre: data.nombre,
        tipo: data.tipo,
        descripcion: data.descripcion ?? null,
        ubicacion: data.ubicacion ?? null,
        total_lotes: data.total_lotes ?? null,
        proyecto_id: id,
        empresa_id: seedEmpresa.empresa_id,
        empresa: seedEmpresa,
        estado: "activo",
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedProyectos,
    );
  }

  // Los IDs de las semillas no son numéricos: `create` debe generar UUID reales.
  override async create(data: ProyectoCreate): Promise<Proyecto> {
    return super.createWithId(uuid(), data);
  }
}

// ── Tipos de propiedad (catálogo de categorías) ──────────────────────────────
export class MockTipoPropiedadRepository
  extends InMemoryCrudRepository<TipoPropiedad, string, TipoPropiedadCreate>
  implements TipoPropiedadRepository
{
  constructor() {
    super(
      (row) => row.tipo_propiedad_id,
      (data, id) => ({
        ...data,
        tipo_propiedad_id: id,
        estado: "activo",
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedTiposPropiedad,
    );
  }
}
export class MockTipoPlantillaRepository
  extends InMemoryCrudRepository<TipoPlantilla, string, TipoPlantillaCreate>
  implements TipoPlantillaRepository
{
  constructor() {
    super(
      (row) => String(row.tipo_plantilla_id),
      (data, id) => ({
        ...data,
        tipo_plantilla_id: Number(id),
        estado: "activo",
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedTiposPlantilla,
    );
  }
}

// ── Propiedades ──────────────────────────────────────────────────────────────
export class MockPropiedadRepository
  extends InMemoryCrudRepository<Propiedad, string, PropiedadCreate>
  implements PropiedadRepository
{
  constructor() {
    super(
      (row) => row.propiedad_id,
      (data, id) => {
        const tipo =
          seedTiposPropiedad.find(
            (t) => String(t.tipo_propiedad_id) === String(data.tipo_propiedad_id),
          ) ?? null;
        const proyecto = data.proyecto_id
          ? (seedProyectos.find((p) => String(p.proyecto_id) === String(data.proyecto_id)) ?? null)
          : null;

        return {
          ...data,
          propiedad_id: id,
          proyecto_id: proyecto ? String(proyecto.proyecto_id) : null,
          proyecto: proyecto
            ? { proyecto_id: proyecto.proyecto_id, nombre: proyecto.nombre, tipo: proyecto.tipo }
            : null,
          empresa_id: seedEmpresa.empresa_id,
          estado: "activo",
          empresa: seedEmpresa,
          tipo_propiedad: tipo,
          creado_en: nowIso(),
          actualizado_en: nowIso(),
        };
      },
      seedPropiedades,
    );
  }

  // Los IDs de las semillas no son numéricos: `create` debe generar UUID reales.
  override async create(data: PropiedadCreate): Promise<Propiedad> {
    return super.createWithId(uuid(), data);
  }

  override async update(id: string, data: Partial<Propiedad>): Promise<Propiedad> {
    const current = await this.getById(id);
    if (!current) throw new Error(`No existe la propiedad ${id}`);
    const proyectoId =
      data.proyecto_id === undefined ? (current.proyecto_id ?? null) : data.proyecto_id;
    const proyecto =
      seedProyectos.find((item) => String(item.proyecto_id) === String(proyectoId)) ?? null;
    return super.update(id, {
      ...data,
      proyecto_id: proyectoId,
      proyecto: proyecto
        ? { proyecto_id: proyecto.proyecto_id, nombre: proyecto.nombre, tipo: proyecto.tipo }
        : null,
    });
  }
}

// ── Brand Kit: archivos de marca (con versiones) ────────────────────────────
/**
 * Repositorio mock de archivos del Brand Kit.
 *
 * Simula el bucket privado en memoria: cada versión guardada tiene un objectURL
 * (para las semillas se genera un SVG data-URL), de modo que `descargar()`
 * devuelve una URL navegable igual que la signed URL del API real.
 */
export class MockBrandAssetRepository
  extends InMemoryCrudRepository<BrandAsset, string, BrandAssetCreate>
  implements BrandAssetRepository
{
  private versiones: BrandAssetVersion[] = [...seedBrandAssetVersions];
  /** versionId → URL navegable (objectURL o data-URL de las semillas). */
  private blobs = new Map<string, string>();

  constructor() {
    super(
      (row) => row.brand_asset_id,
      (data, id) => ({
        ...data,
        descripcion: data.descripcion ?? null,
        brand_asset_id: id,
        version_activa_id: null,
        empresa_id: seedEmpresa.empresa_id,
        estado: "activo",
        empresa: seedEmpresa,
        version_activa: null,
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedBrandAssets,
    );
    // Las versiones de semilla se sirven como SVG data-URL con su color.
    for (const version of this.versiones) {
      this.blobs.set(
        version.brand_asset_version_id,
        svgPlaceholder(version.nombre_archivo, version.mime_type ?? "image/png"),
      );
    }
  }

  override async create(data: BrandAssetCreate): Promise<BrandAsset> {
    return super.createWithId(uuid(), data);
  }

  /** Devuelve la versión y la re-sincroniza dentro del archivo. */
  private async recargar(assetId: string): Promise<BrandAsset> {
    const asset = await this.getById(assetId);
    if (!asset) throw new Error(`No existe el archivo ${assetId}`);
    return asset;
  }

  private versionDe(versionId: string): BrandAssetVersion {
    const version = this.versiones.find(
      (v) => String(v.brand_asset_version_id) === String(versionId),
    );
    if (!version) throw new Error(`No existe la versión ${versionId}`);
    return version;
  }

  async listarVersiones(assetId: string): Promise<BrandAssetVersion[]> {
    return this.versiones
      .filter((v) => String(v.brand_asset_id) === String(assetId))
      .sort((a, b) => b.numero - a.numero);
  }

  async subirVersion(
    assetId: string,
    file: File,
    nota?: string | null,
  ): Promise<BrandAssetVersion> {
    const asset = await this.recargar(assetId);
    const numero = (await this.listarVersiones(assetId)).reduce(
      (max, v) => Math.max(max, v.numero),
      0,
    ) + 1;

    const version: BrandAssetVersion = {
      brand_asset_version_id: uuid(),
      brand_asset_id: assetId,
      numero,
      nombre_archivo: file.name,
      ruta_storage: `empresa_${asset.empresa_id}/${assetId}/v${numero}-${file.name}`,
      mime_type: file.type || null,
      tamano_bytes: file.size,
      nota: nota ?? null,
      subido_por: null,
      empresa_id: asset.empresa_id,
      estado: "activo",
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    };

    this.versiones = [version, ...this.versiones];
    this.blobs.set(version.brand_asset_version_id, URL.createObjectURL(file));

    // La versión recién subida pasa a ser la activa.
    await this.update(assetId, {
      version_activa_id: version.brand_asset_version_id,
      version_activa: version,
      actualizado_en: nowIso(),
    });

    return version;
  }

  async descargar(assetId: string): Promise<BrandAssetDescarga> {
    const asset = await this.recargar(assetId);
    if (!asset.version_activa_id) {
      throw new Error("Este archivo aún no tiene versiones.");
    }
    return this.descargarVersion(assetId, asset.version_activa_id);
  }

  async descargarVersion(assetId: string, versionId: string): Promise<BrandAssetDescarga> {
    const version = this.versionDe(versionId);
    if (String(version.brand_asset_id) !== String(assetId)) {
      throw new Error("La versión no pertenece a este archivo.");
    }
    const url =
      this.blobs.get(version.brand_asset_version_id) ??
      svgPlaceholder(version.nombre_archivo, version.mime_type ?? "image/png");

    return {
      url,
      expira_en_segundos: 300,
      nombre_archivo: version.nombre_archivo,
      mime_type: version.mime_type,
      tamano_bytes: version.tamano_bytes,
      numero: version.numero,
    };
  }

  async restaurarVersion(assetId: string, versionId: string): Promise<BrandAsset> {
    const version = this.versionDe(versionId);
    if (String(version.brand_asset_id) !== String(assetId)) {
      throw new Error("La versión no pertenece a este archivo.");
    }
    await this.update(assetId, {
      version_activa_id: version.brand_asset_version_id,
      version_activa: version,
      actualizado_en: nowIso(),
    });
    return (await this.getById(assetId)) as BrandAsset;
  }

  async eliminarVersion(assetId: string, versionId: string): Promise<void> {
    const version = this.versionDe(versionId);
    if (String(version.brand_asset_id) !== String(assetId)) {
      throw new Error("La versión no pertenece a este archivo.");
    }

    const restantes = (await this.listarVersiones(assetId)).filter(
      (v) => String(v.brand_asset_version_id) !== String(versionId),
    );
    this.versiones = this.versiones.filter(
      (v) => String(v.brand_asset_version_id) !== String(versionId),
    );
    this.blobs.delete(version.brand_asset_version_id);

    const asset = await this.recargar(assetId);
    if (String(asset.version_activa_id) === String(versionId)) {
      const siguiente = restantes[0] ?? null;
      await this.update(assetId, {
        version_activa_id: siguiente?.brand_asset_version_id ?? null,
        version_activa: siguiente,
        actualizado_en: nowIso(),
      });
    }
  }
}

/** SVG mínimo usado como "blob" de las semillas en modo mock. */
function svgPlaceholder(nombre: string, mime: string): string {
  if (!mime.startsWith("image/")) {
    return `data:${mime};base64,`;
  }
  const label = nombre.replace(/\.[a-z0-9]+$/i, "").slice(0, 28);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">` +
    `<rect width="320" height="180" rx="14" fill="#0f1f18"/>` +
    `<circle cx="58" cy="90" r="26" fill="#00D94B"/>` +
    `<text x="98" y="84" font-family="Segoe UI, Arial" font-size="17" fill="#ffffff">${label}</text>` +
    `<text x="98" y="108" font-family="Segoe UI, Arial" font-size="12" fill="#8fd8ac">vista previa · mock</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── Brand Kit: colores de la paleta ─────────────────────────────────────────
export class MockBrandColorRepository
  extends InMemoryCrudRepository<BrandColor, string, BrandColorCreate>
  implements BrandColorRepository
{
  constructor() {
    super(
      (row) => row.brand_color_id,
      (data, id) => ({
        ...data,
        uso: data.uso ?? "principal",
        orden: data.orden ?? 0,
        brand_color_id: id,
        empresa_id: seedEmpresa.empresa_id,
        estado: "activo",
        empresa: seedEmpresa,
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedBrandColors,
    );
  }

  override async create(data: BrandColorCreate): Promise<BrandColor> {
    return super.createWithId(uuid(), data);
  }
}

// ── Plantillas ───────────────────────────────────────────────────────────────
export class MockPlantillaRepository
  extends InMemoryCrudRepository<Plantilla, string, PlantillaCreate>
  implements PlantillaRepository
{
  constructor() {
    super(
      (row) => String(row.plantilla_id),
      (data, id) => ({
        ...data,
        plantilla_id: Number(id),
        estado: "activo",
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedPlantillas,
    );
  }

  override async create(data: PlantillaCreate): Promise<Plantilla> {
    return super.create(data);
  }
}

// ── Modelos ──────────────────────────────────────────────────────────────────
export class MockModeloRepository
  extends InMemoryCrudRepository<Modelo, string, ModeloCreate>
  implements ModeloRepository
{
  constructor() {
    super(
      (row) => row.model_id,
      (data, id) => ({ ...data, model_id: id, created_at: nowIso() }),
      seedModelos,
    );
  }

  override async create(data: ModeloCreate): Promise<Modelo> {
    return super.createWithId(uuid(), data);
  }
}

// ── Generaciones ─────────────────────────────────────────────────────────────
export class MockGeneracionRepository
  extends InMemoryCrudRepository<Generacion, string, GeneracionCreate>
  implements GeneracionRepository
{
  constructor() {
    super(
      (row) => row.generation_id,
      (data, id) => ({
        ...data,
        generation_id: id,
        organization_id: ORGANIZATION_ID,
        property_id: data.property_id ?? null,
        template_id: data.template_id ?? null,
        parametros: data.parametros ?? {},
        // §09: toda generación nueva entra a la cola simulada.
        status: data.status ?? "queued",
        credits_cost: data.credits_cost ?? 0,
        provider_request_id: null,
        error_message: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      }),
      seedGeneraciones,
    );
  }

  override async create(data: GeneracionCreate): Promise<Generacion> {
    return super.createWithId(uuid(), data);
  }

  async getByPropiedadId(propertyId: string): Promise<Generacion[]> {
    return this.applyFilters(await this.getAll(), { property_id: propertyId });
  }
}

// ── Conexiones Meta ──────────────────────────────────────────────────────────
export class MockConexionRepository
  extends InMemoryCrudRepository<Conexion, string, ConexionCreate>
  implements ConexionRepository
{
  constructor() {
    super(
      (row) => row.connection_id,
      (data, id) => ({
        ...data,
        connection_id: id,
        organization_id: ORGANIZATION_ID,
        estado: data.estado ?? "pendiente",
        permisos: null,
         autenticada: false,
         created_at: nowIso(),
      }),
      seedConexiones,
    );
  }

  override async create(data: ConexionCreate): Promise<Conexion> {
    return super.createWithId(uuid(), data);
  }

  async iniciarOAuthMeta(): Promise<{ authorization_url: string }> {
    throw new Error("La conexión OAuth de Meta requiere el proveedor REST y una app de Meta configurada.");
  }
}

// ── Campañas ─────────────────────────────────────────────────────────────────
export class MockCampanaRepository
  extends InMemoryCrudRepository<Campana, string, CampanaCreate>
  implements CampanaRepository
{
  constructor() {
    super(
      (row) => row.campaign_id,
      (data, id) => ({
        ...data,
        campaign_id: id,
        organization_id: ORGANIZATION_ID,
        connection_id: data.connection_id ?? null,
        property_id: data.property_id ?? null,
        // §10: toda campaña nace como borrador local.
        estado: data.estado ?? "local_draft",
        moneda: data.moneda || "USD",
        fecha_inicio: data.fecha_inicio ?? null,
        fecha_fin: data.fecha_fin ?? null,
        copy: data.copy ?? null,
        titulo: data.titulo ?? null,
        cta: data.cta ?? null,
        creative_url: data.creative_url ?? null,
        meta_campaign_id: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      }),
      seedCampanas,
    );
  }

  override async create(data: CampanaCreate): Promise<Campana> {
    return super.createWithId(uuid(), data);
  }

  async getByPropiedadId(propertyId: string): Promise<Campana[]> {
    return this.applyFilters(await this.getAll(), { property_id: propertyId });
  }

  async publicar(campaignId: string): Promise<PublicacionCampana> {
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("La campaña no existe.");
    if (campaign.meta_campaign_id) throw new Error("La campaña ya fue publicada en Meta.");
    const metaCampaignId = `META-SIM-${campaignId.slice(0, 8).toUpperCase()}`;
    await this.update(campaignId, {
      estado: "published_paused",
      meta_campaign_id: metaCampaignId,
    });
    return {
      message: "Campaña publicada en modo SIMULADO (pausada)",
      campania_publicitaria_id: campaignId,
      meta_campaign_id: metaCampaignId,
      meta_estado: "published_paused",
      simulado: true,
      validado_solo: false,
    };
  }
}

// ── Leads ────────────────────────────────────────────────────────────────────
export class MockLeadRepository
  extends InMemoryCrudRepository<Lead, string, LeadCreate>
  implements LeadRepository
{
  constructor() {
    super(
      (row) => row.lead_id,
      (data, id) => ({
        ...data,
        lead_id: id,
        organization_id: ORGANIZATION_ID,
        campaign_id: data.campaign_id ?? null,
        property_id: data.property_id ?? null,
        email: data.email ?? null,
        telefono: data.telefono ?? null,
        estado: data.estado ?? "nuevo",
        notas: data.notas ?? null,
        provider_lead_id: data.provider_lead_id ?? null,
        created_at: nowIso(),
      }),
      seedLeads,
    );
  }

  override async create(data: LeadCreate): Promise<Lead> {
    return super.createWithId(uuid(), data);
  }

  async getByCampanaId(campaignId: string): Promise<Lead[]> {
    return this.applyFilters(await this.getAll(), { campaign_id: campaignId });
  }
}

// ── Billetera de créditos ────────────────────────────────────────────────────
export class MockWalletRepository implements WalletRepository {
  private wallet: Wallet = { ...seedWallet };
  private transacciones: TransaccionCredito[] = [...seedTransacciones];

  async getWallet(): Promise<Wallet> {
    return { ...this.wallet };
  }

  async getTransacciones(): Promise<TransaccionCredito[]> {
    return [...this.transacciones];
  }

  async recargar(monto: number, idempotencyKey?: string): Promise<Wallet> {
    if (monto <= 0) throw new Error("El monto de la recarga debe ser mayor a cero.");
    if (idempotencyKey && this.transacciones.some((t) => t.idempotency_key === idempotencyKey)) {
      return { ...this.wallet }; // idempotente: ya procesada
    }
    this.wallet = { ...this.wallet, saldo: this.wallet.saldo + monto, updated_at: nowIso() };
    this.transacciones = [
      {
        transaction_id: uuid(),
        wallet_id: this.wallet.wallet_id,
        organization_id: this.wallet.organization_id,
        tipo: "recarga",
        monto,
        generation_id: null,
        descripcion: "Recarga de créditos",
        idempotency_key: idempotencyKey ?? null,
        created_at: nowIso(),
      },
      ...this.transacciones,
    ];
    return { ...this.wallet };
  }
}

export class MockTransaccionRepository
  extends InMemoryCrudRepository<TransaccionCredito, string, TransaccionCreditoCreate>
  implements TransaccionRepository
{
  constructor() {
    super(
      (row) => row.transaction_id,
      (data, id) => ({
        ...data,
        transaction_id: id,
        wallet_id: seedWallet.wallet_id,
        organization_id: ORGANIZATION_ID,
        created_at: nowIso(),
      }),
      seedTransacciones,
    );
  }

  override async create(data: TransaccionCreditoCreate): Promise<TransaccionCredito> {
    return super.createWithId(uuid(), data);
  }
}

// ── Autenticación ────────────────────────────────────────────────────────────
/**
 * Auth no existe en modo mock: el prototipo arranca sin backend y sin
 * login (el `AuthProvider` queda en estado "disabled"). Este implementador
 * solo existe para que el contenedor pueda ensamblarse en ambos modos.
 */
const AUTH_MOCK_ERROR =
  'La autenticación no está disponible con VITE_DATA_PROVIDER="mock". Usa "rest" para entrar con el API.';

export class MockAuthRepository implements AuthRepository {
  async register(_input: RegisterInput): Promise<RegisterResult> {
    throw new Error(AUTH_MOCK_ERROR);
  }

  async login(_input: LoginInput): Promise<Session> {
    throw new Error(AUTH_MOCK_ERROR);
  }

  async me(): Promise<Perfil> {
    throw new Error(AUTH_MOCK_ERROR);
  }
}

// ── Identity: equipo, roles, bitácora y organización ─────────────────────────
const MOCK_EMPRESA_ID = seedEmpresaIdentity[0].empresa_id;

/** Miembros del equipo: mismas reglas de negocio mínimas que el API (correo único). */
export class MockMiembroRepository
  extends InMemoryCrudRepository<Miembro, string, MiembroCreate>
  implements MiembroRepository
{
  private seqId = seedMiembros.reduce((max, m) => Math.max(max, Number(m.usuario_id)), 0);

  constructor() {
    super(
      (row) => row.usuario_id,
      (data, id) => ({
        usuario_id: id,
        nombre: data.nombre,
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono ?? null,
        empresa_id: MOCK_EMPRESA_ID,
        empresa: {
          empresa_id: MOCK_EMPRESA_ID,
          razon_social: seedEmpresaIdentity[0].razon_social,
        },
        contrasenia_temporal_hasta: null,
        estado: "activo",
        roles: [],
        creado_en: nowIso(),
        actualizado_en: nowIso(),
      }),
      seedMiembros,
    );
  }

  override async create(data: MiembroCreate): Promise<Miembro> {
    this.seqId += 1;
    return super.createWithId(String(this.seqId), data);
  }

  async invitar(input: InvitacionMiembro): Promise<InvitacionResultado> {
    const email = input.email.trim().toLowerCase();
    const existentes = await this.getAll();
    if (existentes.some((m) => m.email === email)) {
      throw new Error(`El correo ${email} ya tiene una cuenta en la plataforma`);
    }

    const creado = await this.create({
      nombre: input.nombre.trim(),
      email,
      telefono: input.telefono || null,
    });
    const hasta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.update(creado.usuario_id, {
      roles: [input.rol],
      contrasenia_temporal_hasta: hasta,
    });

    return {
      usuario_id: creado.usuario_id,
      auth_user_id: uuid(),
      empresa_id: MOCK_EMPRESA_ID,
      rol: input.rol,
      contrasenia_temporal: Math.random().toString(36).slice(2, 14).padEnd(12, "x"),
      contrasenia_temporal_hasta: hasta,
    };
  }

  async cambiarRol(usuarioId: string, rolId: string): Promise<void> {
    const rol = seedRoles.find((r) => String(r.rol_id) === String(rolId));
    if (!rol) throw new Error("El rol no existe en el catálogo");
    await this.update(usuarioId, { roles: [rol.nombre], actualizado_en: nowIso() });
  }
}

export class MockRolRepository implements RolRepository {
  async listar(): Promise<Rol[]> {
    return [...seedRoles];
  }
}

export class MockAuditoriaRepository implements AuditoriaRepository {
  async listar(filters?: FilterParams): Promise<AuditoriaLog[]> {
    const entries = Object.entries(filters ?? {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );
    return seedAuditoria
      .filter((row) =>
        entries.every(
          ([key, value]) => String((row as unknown as Record<string, unknown>)[key]) === String(value),
        ),
      )
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }
}

export class MockEmpresaRepository implements EmpresaRepository {
  private empresa: Empresa = { ...seedEmpresaIdentity[0] };

  async obtenerActual(): Promise<Empresa | null> {
    return { ...this.empresa };
  }

  async actualizar(data: EmpresaUpdate): Promise<Empresa> {
    this.empresa = { ...this.empresa, ...data, actualizado_en: nowIso() };
    return { ...this.empresa };
  }
}

// ── Catalog: media assets (bucket privado simulado en memoria) ───────────────
export class MockMediaAssetRepository
  extends InMemoryCrudRepository<MediaAsset, string, MediaAssetCreate>
  implements MediaAssetRepository
{
  private versiones: MediaAssetVersion[] = [...seedMediaAssetVersions];
  /** versionId → URL navegable (objectURL o data-URL de las semillas). */
  private blobs = new Map<string, string>();

  constructor() {
    super(
      (row) => row.media_asset_id,
      (data, id) => {
        const proyecto = data.proyecto_id
          ? (seedProyectos.find((p) => String(p.proyecto_id) === String(data.proyecto_id)) ?? null)
          : null;
        const propiedad = data.propiedad_id
          ? (seedPropiedades.find((p) => String(p.propiedad_id) === String(data.propiedad_id)) ??
            null)
          : null;
        return {
          media_asset_id: id,
          nombre: data.nombre,
          categoria: data.categoria,
          descripcion: data.descripcion ?? null,
          proyecto_id: proyecto ? String(proyecto.proyecto_id) : null,
          propiedad_id: propiedad ? String(propiedad.propiedad_id) : null,
          version_activa_id: null,
          empresa_id: seedEmpresa.empresa_id,
          estado: "activo",
          empresa: seedEmpresa,
          proyecto: proyecto
            ? { proyecto_id: proyecto.proyecto_id, nombre: proyecto.nombre, tipo: proyecto.tipo }
            : null,
          propiedad: propiedad
            ? {
                propiedad_id: propiedad.propiedad_id,
                nombre: propiedad.nombre,
                ubicacion: propiedad.ubicacion,
              }
            : null,
          version_activa: null,
          creado_en: nowIso(),
          actualizado_en: nowIso(),
        };
      },
      seedMediaAssets,
    );
    for (const version of this.versiones) {
      this.blobs.set(
        version.media_asset_version_id,
        svgPlaceholder(version.nombre_archivo, version.mime_type ?? "image/png"),
      );
    }
  }

  override async create(data: MediaAssetCreate): Promise<MediaAsset> {
    return super.createWithId(uuid(), data);
  }

  /** `update` genérico no resuelve las referencias incrustadas: se recalculan aquí. */
  override async update(id: string, data: Partial<MediaAsset>): Promise<MediaAsset> {
    const patch: Partial<MediaAsset> = { ...data, actualizado_en: nowIso() };
    if ("proyecto_id" in data) {
      const p = data.proyecto_id
        ? seedProyectos.find((x) => String(x.proyecto_id) === String(data.proyecto_id))
        : null;
      patch.proyecto = p ? { proyecto_id: p.proyecto_id, nombre: p.nombre, tipo: p.tipo } : null;
    }
    if ("propiedad_id" in data) {
      const p = data.propiedad_id
        ? seedPropiedades.find((x) => String(x.propiedad_id) === String(data.propiedad_id))
        : null;
      patch.propiedad = p
        ? { propiedad_id: p.propiedad_id, nombre: p.nombre, ubicacion: p.ubicacion }
        : null;
    }
    return super.update(id, patch);
  }

  private async recargar(assetId: string): Promise<MediaAsset> {
    const asset = await this.getById(assetId);
    if (!asset) throw new Error(`No existe el medio ${assetId}`);
    return asset;
  }

  private versionDe(assetId: string, versionId: string): MediaAssetVersion {
    const version = this.versiones.find(
      (v) => String(v.media_asset_version_id) === String(versionId),
    );
    if (!version || String(version.media_asset_id) !== String(assetId)) {
      throw new Error("La versión no pertenece a este medio.");
    }
    return version;
  }

  async listarVersiones(assetId: string): Promise<MediaAssetVersion[]> {
    return this.versiones
      .filter((v) => String(v.media_asset_id) === String(assetId))
      .sort((a, b) => b.numero - a.numero);
  }

  async subirVersion(
    assetId: string,
    file: File,
    nota?: string | null,
  ): Promise<MediaAssetVersion> {
    const asset = await this.recargar(assetId);
    const numero =
      (await this.listarVersiones(assetId)).reduce((max, v) => Math.max(max, v.numero), 0) + 1;

    const version: MediaAssetVersion = {
      media_asset_version_id: uuid(),
      media_asset_id: assetId,
      numero,
      nombre_archivo: file.name,
      mime_type: file.type || null,
      tamano_bytes: file.size,
      nota: nota ?? null,
      subido_por: null,
      empresa_id: asset.empresa_id,
      estado: "activo",
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    };

    this.versiones = [version, ...this.versiones];
    this.blobs.set(version.media_asset_version_id, URL.createObjectURL(file));
    await this.update(assetId, {
      version_activa_id: version.media_asset_version_id,
      version_activa: version,
    });
    return version;
  }

  async descargar(assetId: string): Promise<MediaAssetDescarga> {
    const asset = await this.recargar(assetId);
    if (!asset.version_activa_id) {
      throw new Error("Este medio aún no tiene versiones para descargar.");
    }
    return this.descargarVersion(assetId, asset.version_activa_id);
  }

  async descargarVersion(assetId: string, versionId: string): Promise<MediaAssetDescarga> {
    const version = this.versionDe(assetId, versionId);
    return {
      url:
        this.blobs.get(version.media_asset_version_id) ??
        svgPlaceholder(version.nombre_archivo, version.mime_type ?? "image/png"),
      expira_en_segundos: 300,
      nombre_archivo: version.nombre_archivo,
      mime_type: version.mime_type,
      tamano_bytes: version.tamano_bytes,
      numero: version.numero,
    };
  }

  async restaurarVersion(assetId: string, versionId: string): Promise<MediaAsset> {
    const version = this.versionDe(assetId, versionId);
    return this.update(assetId, {
      version_activa_id: version.media_asset_version_id,
      version_activa: version,
    });
  }

  async eliminarVersion(assetId: string, versionId: string): Promise<void> {
    const version = this.versionDe(assetId, versionId);
    this.versiones = this.versiones.filter(
      (v) => String(v.media_asset_version_id) !== String(versionId),
    );
    this.blobs.delete(version.media_asset_version_id);

    const asset = await this.recargar(assetId);
    if (String(asset.version_activa_id) === String(versionId)) {
      const siguiente = (await this.listarVersiones(assetId))[0] ?? null;
      await this.update(assetId, {
        version_activa_id: siguiente?.media_asset_version_id ?? null,
        version_activa: siguiente,
      });
    }
  }

  /** Borrar el medio elimina también sus versiones (como el API). */
  override async delete(id: string): Promise<void> {
    this.versiones = this.versiones.filter((v) => String(v.media_asset_id) !== String(id));
    await super.delete(id);
  }
}
