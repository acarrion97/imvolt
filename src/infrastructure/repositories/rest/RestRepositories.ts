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

import { RestCrudRepository } from "@/infrastructure/repositories/rest/RestCrudRepository";
import { buildQuery, http } from "@/infrastructure/http/httpClient";

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

export class RestPropiedadRepository
  extends RestCrudRepository<Propiedad, string, PropiedadCreate>
  implements PropiedadRepository
{
  constructor() {
    super("v1/propiedades");
  }

  async getByProyectoId(projectId: string): Promise<Propiedad[]> {
    return this.getAll({ project_id: projectId });
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
