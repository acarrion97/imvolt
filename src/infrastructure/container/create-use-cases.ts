import type { Repositories } from "./create-repositories";
import type { CrudUseCases } from "@/application/core/crud-use-cases";

import type { LoginInput, Perfil, Session } from "@/domain/auth";
import type { Campana, CampanaCreate } from "@/domain/campana";
import type { Conexion, ConexionCreate } from "@/domain/conexion";
import type { Generacion, GeneracionCreate } from "@/domain/generacion";
import type { Lead, LeadCreate } from "@/domain/lead";
import type {
  BrandAsset,
  BrandAssetCreate,
  BrandAssetDescarga,
  BrandAssetVersion,
  BrandColor,
  BrandColorCreate,
} from "@/domain/brand-kit";
import type { Modelo, ModeloCreate } from "@/domain/modelo";
import type { Plantilla, PlantillaCreate, TipoPlantilla, TipoPlantillaCreate } from "@/domain/plantilla";
import type {
  Propiedad,
  PropiedadCreate,
  TipoPropiedad,
  TipoPropiedadCreate,
} from "@/domain/propiedad";
import type { Proyecto, ProyectoCreate } from "@/domain/proyecto";
import type { TransaccionCredito, TransaccionCreditoCreate, Wallet } from "@/domain/credito";

import { buildCrudUseCases } from "@/application/core/crud-use-cases";
import { RecargarCreditosUseCase } from "@/application/credito/use-cases/RecargarCreditosUseCase";
import { ValidarCampanaUseCase } from "@/application/campana/use-cases/ValidarCampanaUseCase";

/** Casos de uso expuestos a la presentación: `container.proyectos.list.execute(...)`. */
export interface UseCases {
  proyectos: CrudUseCases<Proyecto, string, ProyectoCreate>;
  propiedades: CrudUseCases<Propiedad, string, PropiedadCreate>;
  tiposPropiedad: CrudUseCases<TipoPropiedad, string, TipoPropiedadCreate>;
  tiposPlantilla: CrudUseCases<TipoPlantilla, string, TipoPlantillaCreate>;

  plantillas: CrudUseCases<Plantilla, string, PlantillaCreate>;
  modelos: CrudUseCases<Modelo, string, ModeloCreate>;
  generaciones: CrudUseCases<Generacion, string, GeneracionCreate>;
  conexiones: CrudUseCases<Conexion, string, ConexionCreate>;
  campanas: CrudUseCases<Campana, string, CampanaCreate>;
  leads: CrudUseCases<Lead, string, LeadCreate>;
  transacciones: CrudUseCases<TransaccionCredito, string, TransaccionCreditoCreate>;

  // Brand Kit: CRUD de archivos + operaciones de storage (versiones/descarga)
  // y CRUD de colores de la paleta.
  brandAssets: CrudUseCases<BrandAsset, string, BrandAssetCreate>;
  brandColors: CrudUseCases<BrandColor, string, BrandColorCreate>;
  brandAssetStorage: {
    listarVersiones(assetId: string): Promise<BrandAssetVersion[]>;
    subirVersion(assetId: string, file: File, nota?: string | null): Promise<BrandAssetVersion>;
    descargar(assetId: string): Promise<BrandAssetDescarga>;
    descargarVersion(assetId: string, versionId: string): Promise<BrandAssetDescarga>;
    restaurarVersion(assetId: string, versionId: string): Promise<BrandAsset>;
    eliminarVersion(assetId: string, versionId: string): Promise<void>;
  };

  // casos de uso de negocio (no CRUD)
  getWallet: { execute(): Promise<Wallet> };
  getTransacciones: { execute(): Promise<TransaccionCredito[]> };
  recargarCreditos: RecargarCreditosUseCase;
  validarCampana: ValidarCampanaUseCase;

  // autenticación (solo con VITE_DATA_PROVIDER=rest)
  login: { execute(input: LoginInput): Promise<Session> };
  obtenerPerfil: { execute(): Promise<Perfil> };
}

export function createUseCases(repos: Repositories): UseCases {
  return {
    proyectos: buildCrudUseCases(repos.proyectoRepo),
    propiedades: buildCrudUseCases(repos.propiedadRepo),
    tiposPropiedad: buildCrudUseCases(repos.tipoPropiedadRepo),
    tiposPlantilla: buildCrudUseCases(repos.tipoPlantillaRepo),
    plantillas: buildCrudUseCases(repos.plantillaRepo),
    modelos: buildCrudUseCases(repos.modeloRepo),
    generaciones: buildCrudUseCases(repos.generacionRepo),
    conexiones: buildCrudUseCases(repos.conexionRepo),
    campanas: buildCrudUseCases(repos.campanaRepo),
    leads: buildCrudUseCases(repos.leadRepo),
    transacciones: buildCrudUseCases(repos.transaccionRepo),

    brandAssets: buildCrudUseCases(repos.brandAssetRepo),
    brandColors: buildCrudUseCases(repos.brandColorRepo),
    brandAssetStorage: {
      listarVersiones: (assetId) => repos.brandAssetRepo.listarVersiones(assetId),
      subirVersion: (assetId, file, nota) => repos.brandAssetRepo.subirVersion(assetId, file, nota),
      descargar: (assetId) => repos.brandAssetRepo.descargar(assetId),
      descargarVersion: (assetId, versionId) =>
        repos.brandAssetRepo.descargarVersion(assetId, versionId),
      restaurarVersion: (assetId, versionId) =>
        repos.brandAssetRepo.restaurarVersion(assetId, versionId),
      eliminarVersion: (assetId, versionId) =>
        repos.brandAssetRepo.eliminarVersion(assetId, versionId),
    },

    getWallet: { execute: () => repos.walletRepo.getWallet() },
    getTransacciones: { execute: () => repos.walletRepo.getTransacciones() },
    recargarCreditos: new RecargarCreditosUseCase(repos.walletRepo),
    validarCampana: new ValidarCampanaUseCase(repos.campanaRepo),

    login: { execute: (input) => repos.authRepo.login(input) },
    obtenerPerfil: { execute: () => repos.authRepo.me() },
  };
}
