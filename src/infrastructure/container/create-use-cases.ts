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
import type { Plantilla, PlantillaCreate } from "@/domain/plantilla";
import type {
  Propiedad,
  PropiedadCreate,
  TipoPropiedad,
  TipoPropiedadCreate,
} from "@/domain/propiedad";
import type { Proyecto, ProyectoCreate } from "@/domain/proyecto";
import type {
  MediaAsset,
  MediaAssetCreate,
  MediaAssetDescarga,
  MediaAssetVersion,
} from "@/domain/media-asset";
import type {
  AuditoriaLog,
  Empresa,
  EmpresaUpdate,
  InvitacionMiembro,
  InvitacionResultado,
  Miembro,
  MiembroCreate,
  Rol,
} from "@/domain/identity";
import type { FilterParams } from "@/domain/core/repositories/CrudRepository";
import type { TransaccionCredito, TransaccionCreditoCreate, Wallet } from "@/domain/credito";

import { buildCrudUseCases } from "@/application/core/crud-use-cases";
import { RecargarCreditosUseCase } from "@/application/credito/use-cases/RecargarCreditosUseCase";
import { ValidarCampanaUseCase } from "@/application/campana/use-cases/ValidarCampanaUseCase";

/** Casos de uso expuestos a la presentación: `container.proyectos.list.execute(...)`. */
export interface UseCases {
  proyectos: CrudUseCases<Proyecto, string, ProyectoCreate>;
  propiedades: CrudUseCases<Propiedad, string, PropiedadCreate>;
  tiposPropiedad: CrudUseCases<TipoPropiedad, string, TipoPropiedadCreate>;
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

  // Catalog: medios (CRUD de metadatos + storage con versiones).
  mediaAssets: CrudUseCases<MediaAsset, string, MediaAssetCreate>;
  mediaAssetStorage: {
    listarVersiones(assetId: string): Promise<MediaAssetVersion[]>;
    subirVersion(assetId: string, file: File, nota?: string | null): Promise<MediaAssetVersion>;
    descargar(assetId: string): Promise<MediaAssetDescarga>;
    descargarVersion(assetId: string, versionId: string): Promise<MediaAssetDescarga>;
    restaurarVersion(assetId: string, versionId: string): Promise<MediaAsset>;
    eliminarVersion(assetId: string, versionId: string): Promise<void>;
  };

  // Identity: equipo (CRUD + invitación + cambio de rol), catálogo de roles,
  // bitácora (solo lectura) y perfil de la organización.
  miembros: CrudUseCases<Miembro, string, MiembroCreate> & {
    invitar(input: InvitacionMiembro): Promise<InvitacionResultado>;
    cambiarRol(usuarioId: string, rolId: string): Promise<void>;
  };
  roles: { list: { execute(): Promise<Rol[]> } };
  auditoria: { list: { execute(filters?: FilterParams): Promise<AuditoriaLog[]> } };
  empresa: {
    obtener: { execute(): Promise<Empresa | null> };
    actualizar: { execute(data: EmpresaUpdate): Promise<Empresa> };
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

    mediaAssets: buildCrudUseCases(repos.mediaAssetRepo),
    mediaAssetStorage: {
      listarVersiones: (assetId) => repos.mediaAssetRepo.listarVersiones(assetId),
      subirVersion: (assetId, file, nota) => repos.mediaAssetRepo.subirVersion(assetId, file, nota),
      descargar: (assetId) => repos.mediaAssetRepo.descargar(assetId),
      descargarVersion: (assetId, versionId) =>
        repos.mediaAssetRepo.descargarVersion(assetId, versionId),
      restaurarVersion: (assetId, versionId) =>
        repos.mediaAssetRepo.restaurarVersion(assetId, versionId),
      eliminarVersion: (assetId, versionId) =>
        repos.mediaAssetRepo.eliminarVersion(assetId, versionId),
    },

    miembros: {
      ...buildCrudUseCases(repos.miembroRepo),
      invitar: (input) => repos.miembroRepo.invitar(input),
      cambiarRol: (usuarioId, rolId) => repos.miembroRepo.cambiarRol(usuarioId, rolId),
    },
    roles: { list: { execute: () => repos.rolRepo.listar() } },
    auditoria: { list: { execute: (filters) => repos.auditoriaRepo.listar(filters) } },
    empresa: {
      obtener: { execute: () => repos.empresaRepo.obtenerActual() },
      actualizar: { execute: (data) => repos.empresaRepo.actualizar(data) },
    },

    getWallet: { execute: () => repos.walletRepo.getWallet() },
    getTransacciones: { execute: () => repos.walletRepo.getTransacciones() },
    recargarCreditos: new RecargarCreditosUseCase(repos.walletRepo),
    validarCampana: new ValidarCampanaUseCase(repos.campanaRepo),

    login: { execute: (input) => repos.authRepo.login(input) },
    obtenerPerfil: { execute: () => repos.authRepo.me() },
  };
}
