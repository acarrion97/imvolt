import type { Repositories } from "./create-repositories";
import type { CrudUseCases } from "@/application/core/crud-use-cases";

import type { LoginInput, Perfil, RegisterInput, RegisterResult, Session } from "@/domain/auth";
import type {
  Campana,
  CampanaCreate,
  CampanaObjetivo,
  EstrategiaCampana,
  PublicacionCampana,
} from "@/domain/campana";
import type { Conexion, ConexionCreate } from "@/domain/conexion";
import type {
  Generacion,
  GeneracionCreate,
  GeneracionQuote,
  GeneracionQuoteInput,
} from "@/domain/generacion";
import type { Lead, LeadCreate } from "@/domain/lead";
import type {
  MediaAsset,
  MediaAssetCreate,
  MediaAssetDescarga,
  MediaAssetVersion,
} from "@/domain/media-asset";
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

import { buildCrudUseCases } from "@/application/core/crud-use-cases";
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
  quoteGeneracion: { execute(input: GeneracionQuoteInput): Promise<GeneracionQuote> };
  conexiones: CrudUseCases<Conexion, string, ConexionCreate>;
  campanas: CrudUseCases<Campana, string, CampanaCreate>;
  leads: CrudUseCases<Lead, string, LeadCreate>;

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
  validarCampana: ValidarCampanaUseCase;
  solicitarAprobacionCampana: { execute(campaignId: string): Promise<Campana> };
  aprobarCampana: { execute(campaignId: string): Promise<Campana> };
  sincronizarEstadoCampanaMeta: { execute(campaignId: string): Promise<Campana> };
  generarEstrategiaCampana: {
    execute(propertyId: string, objective: CampanaObjetivo, presupuesto: number, publicoObjetivo: string): Promise<EstrategiaCampana>;
  };
  publicarCampana: {
    execute(campaignId: string, idempotencyKey: string): Promise<PublicacionCampana>;
  };

  // autenticación (solo con VITE_DATA_PROVIDER=rest)
  login: { execute(input: LoginInput): Promise<Session> };
  register: { execute(input: RegisterInput): Promise<RegisterResult> };
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
    quoteGeneracion: { execute: (input) => repos.generacionRepo.quote(input) },
    conexiones: buildCrudUseCases(repos.conexionRepo),
    campanas: buildCrudUseCases(repos.campanaRepo),
    leads: buildCrudUseCases(repos.leadRepo),

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

    validarCampana: new ValidarCampanaUseCase(repos.campanaRepo),
    solicitarAprobacionCampana: {
      execute: (campaignId) => repos.campanaRepo.solicitarAprobacion(campaignId),
    },
    aprobarCampana: { execute: (campaignId) => repos.campanaRepo.aprobar(campaignId) },
    sincronizarEstadoCampanaMeta: {
      execute: (campaignId) => repos.campanaRepo.sincronizarEstadoMeta(campaignId),
    },
    generarEstrategiaCampana: {
      execute: (propertyId, objective, presupuesto, publicoObjetivo) => repos.campanaRepo.generarEstrategia(propertyId, objective, presupuesto, publicoObjetivo),
    },
    publicarCampana: {
      execute: (campaignId, idempotencyKey) => repos.campanaRepo.publicar(campaignId, idempotencyKey),
    },

    login: { execute: (input) => repos.authRepo.login(input) },
    register: { execute: (input) => repos.authRepo.register(input) },
    obtenerPerfil: { execute: () => repos.authRepo.me() },
  };
}
