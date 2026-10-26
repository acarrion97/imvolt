import type { AuthRepository, LoginInput, Perfil, Session } from "@/domain/auth";
import type {
  Campana,
  CampanaCreate,
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
import type { Plantilla, PlantillaCreate, PlantillaRepository, TipoPlantillaCreate, TipoPlantillaRepository } from "@/domain/plantilla";
import type {
  Propiedad,
  PropiedadCreate,
  PropiedadRepository,
  TipoPlantilla,
  TipoPropiedad,
  TipoPropiedadCreate,
  TipoPropiedadRepository,
} from "@/domain/propiedad";
import type { Proyecto, ProyectoCreate, ProyectoRepository } from "@/domain/proyecto";
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
  seedEmpresa,
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
      (row) => row.project_id,
      (data, id) => ({
        ...data,
        project_id: id,
        organization_id: ORGANIZATION_ID,
        estado: data.estado ?? "activo",
        created_at: nowIso(),
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
      (row) => row.tipo_plantilla_id,
      (data, id) => ({
        ...data,
        tipo_plantilla_id: id,
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

        return {
          ...data,
          propiedad_id: id,
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
      (row) => row.template_id,
      (data, id) => ({
        ...data,
        template_id: id,
        organization_id: null,
        variables: data.variables ?? [],
        activo: data.activo ?? true,
        creditos_base: data.creditos_base ?? 1,
        created_at: nowIso(),
      }),
      seedPlantillas,
    );
  }

  override async create(data: PlantillaCreate): Promise<Plantilla> {
    return super.createWithId(uuid(), data);
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
        created_at: nowIso(),
      }),
      seedConexiones,
    );
  }

  override async create(data: ConexionCreate): Promise<Conexion> {
    return super.createWithId(uuid(), data);
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
  async login(_input: LoginInput): Promise<Session> {
    throw new Error(AUTH_MOCK_ERROR);
  }

  async me(): Promise<Perfil> {
    throw new Error(AUTH_MOCK_ERROR);
  }
}
