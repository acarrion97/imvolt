import type { CampanaRepository } from "@/domain/campana";
import type { AuthRepository } from "@/domain/auth";
import type { ConexionRepository } from "@/domain/conexion";
import type { GeneracionRepository } from "@/domain/generacion";
import type { LeadRepository } from "@/domain/lead";
import type { BrandAssetRepository, BrandColorRepository } from "@/domain/brand-kit";
import type { ModeloRepository } from "@/domain/modelo";
import type { PlantillaRepository, TipoPlantillaRepository } from "@/domain/plantilla";
import type { PropiedadRepository, TipoPropiedadRepository } from "@/domain/propiedad";
import type { ProyectoRepository } from "@/domain/proyecto";
import type { TransaccionRepository, WalletRepository } from "@/domain/credito";

import {
  MockAuthRepository,
  MockBrandAssetRepository,
  MockBrandColorRepository,
  MockCampanaRepository,
  MockConexionRepository,
  MockGeneracionRepository,
  MockLeadRepository,
  MockModeloRepository,
  MockPlantillaRepository,
  MockPropiedadRepository,
  MockProyectoRepository,
  MockTipoPlantillaRepository,
  MockTipoPropiedadRepository,
  MockTransaccionRepository,
  MockWalletRepository,
} from "@/infrastructure/repositories/mock/MockRepositories";
import {
  RestAuthRepository,
  RestBrandAssetRepository,
  RestBrandColorRepository,
  RestCampanaRepository,
  RestConexionRepository,
  RestGeneracionRepository,
  RestLeadRepository,
  RestModeloRepository,
  RestPlantillaRepository,
  RestPropiedadRepository,
  RestProyectoRepository,
  RestTipoPlantillaRepository,
  RestTipoPropiedadRepository,
  RestTransaccionRepository,
  RestWalletRepository,
} from "@/infrastructure/repositories/rest/RestRepositories";

/**
 * Todas las dependencias "pesadas" del dominio.
 * El resto de la app solo ve esta interfaz: cambiar de proveedor de datos
 * no toca ni los use cases ni la presentación.
 */
export interface Repositories {
  proyectoRepo: ProyectoRepository;
  propiedadRepo: PropiedadRepository;
  tipoPropiedadRepo: TipoPropiedadRepository;
  tipoPlantillaRepo: TipoPlantillaRepository;
  plantillaRepo: PlantillaRepository;
  modeloRepo: ModeloRepository;
  generacionRepo: GeneracionRepository;
  conexionRepo: ConexionRepository;
  campanaRepo: CampanaRepository;
  leadRepo: LeadRepository;
  brandAssetRepo: BrandAssetRepository;
  brandColorRepo: BrandColorRepository;
  walletRepo: WalletRepository;
  transaccionRepo: TransaccionRepository;
  /** Sesión de usuario (solo útil con VITE_DATA_PROVIDER=rest). */
  authRepo: AuthRepository;
}

function createMockRepositories(): Repositories {
  return {
    proyectoRepo: new MockProyectoRepository(),
    propiedadRepo: new MockPropiedadRepository(),
    tipoPropiedadRepo: new MockTipoPropiedadRepository(),
    tipoPlantillaRepo: new MockTipoPlantillaRepository(),
    plantillaRepo: new MockPlantillaRepository(),
    modeloRepo: new MockModeloRepository(),
    generacionRepo: new MockGeneracionRepository(),
    conexionRepo: new MockConexionRepository(),
    campanaRepo: new MockCampanaRepository(),
    leadRepo: new MockLeadRepository(),
    brandAssetRepo: new MockBrandAssetRepository(),
    brandColorRepo: new MockBrandColorRepository(),
    walletRepo: new MockWalletRepository(),
    transaccionRepo: new MockTransaccionRepository(),
    authRepo: new MockAuthRepository(),
  };
}

function createRestRepositories(): Repositories {
  if (!import.meta.env.VITE_API_URL) {
    throw new Error(
      'Proveedor "rest" seleccionado pero VITE_API_URL no está definido. Configúralo en .env.',
    );
  }

  return {
    proyectoRepo: new RestProyectoRepository(),
    propiedadRepo: new RestPropiedadRepository(),
    tipoPropiedadRepo: new RestTipoPropiedadRepository(),
    tipoPlantillaRepo: new RestTipoPlantillaRepository(),
    plantillaRepo: new RestPlantillaRepository(),
    
    modeloRepo: new RestModeloRepository(),
    generacionRepo: new RestGeneracionRepository(),
    conexionRepo: new RestConexionRepository(),
    campanaRepo: new RestCampanaRepository(),
    leadRepo: new RestLeadRepository(),
    brandAssetRepo: new RestBrandAssetRepository(),
    brandColorRepo: new RestBrandColorRepository(),
    walletRepo: new RestWalletRepository(),
    transaccionRepo: new RestTransaccionRepository(),
    authRepo: new RestAuthRepository(),
  };
}

/**
 * "mock": datos en memoria con semillas IMVOLT (default).
 * "rest": API REST de `api/` (montada en /api/v1/...).
 */
export function resolveDataProvider(): "mock" | "rest" {
  const provider = String(import.meta.env.VITE_DATA_PROVIDER ?? "mock")
    .trim()
    .toLowerCase();

  if (provider === "") return "mock";
  if (provider === "mock" || provider === "rest") return provider;

  throw new Error(`VITE_DATA_PROVIDER inválido: "${provider}". Usa "mock" o "rest".`);
}

export function createRepositories(): Repositories {
  return resolveDataProvider() === "rest" ? createRestRepositories() : createMockRepositories();
}
