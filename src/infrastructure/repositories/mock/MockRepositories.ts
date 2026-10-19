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
import type { Plantilla, PlantillaCreate, PlantillaRepository } from "@/domain/plantilla";
import type { Propiedad, PropiedadCreate, PropiedadRepository } from "@/domain/propiedad";
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
  seedCampanas,
  seedConexiones,
  seedGeneraciones,
  seedLeads,
  seedModelos,
  seedPlantillas,
  seedPropiedades,
  seedProyectos,
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

// ── Propiedades ──────────────────────────────────────────────────────────────
export class MockPropiedadRepository
  extends InMemoryCrudRepository<Propiedad, string, PropiedadCreate>
  implements PropiedadRepository
{
  constructor() {
    super(
      (row) => row.property_id,
      (data, id) => ({
        ...data,
        property_id: id,
        organization_id: ORGANIZATION_ID,
        project_id: data.project_id ?? null,
        moneda: data.moneda || "USD",
        pais: data.pais || "Ecuador",
        estado: data.estado ?? "disponible",
        tiene_render_conceptual: data.tiene_render_conceptual ?? false,
        created_at: nowIso(),
      }),
      seedPropiedades,
    );
  }

  override async create(data: PropiedadCreate): Promise<Propiedad> {
    return super.createWithId(uuid(), data);
  }

  async getByProyectoId(projectId: string): Promise<Propiedad[]> {
    return this.applyFilters(await this.getAll(), { project_id: projectId });
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
