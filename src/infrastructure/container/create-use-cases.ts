import type { Repositories } from "./create-repositories";
import type { CrudUseCases } from "@/application/core/crud-use-cases";

import type { LoginInput, Perfil, Session } from "@/domain/auth";
import type { Campana, CampanaCreate } from "@/domain/campana";
import type { Conexion, ConexionCreate } from "@/domain/conexion";
import type { Generacion, GeneracionCreate } from "@/domain/generacion";
import type { Lead, LeadCreate } from "@/domain/lead";
import type { Modelo, ModeloCreate } from "@/domain/modelo";
import type { Plantilla, PlantillaCreate } from "@/domain/plantilla";
import type { Propiedad, PropiedadCreate } from "@/domain/propiedad";
import type { Proyecto, ProyectoCreate } from "@/domain/proyecto";
import type { TransaccionCredito, TransaccionCreditoCreate, Wallet } from "@/domain/credito";

import { buildCrudUseCases } from "@/application/core/crud-use-cases";
import { RecargarCreditosUseCase } from "@/application/credito/use-cases/RecargarCreditosUseCase";
import { ValidarCampanaUseCase } from "@/application/campana/use-cases/ValidarCampanaUseCase";

/** Casos de uso expuestos a la presentación: `container.proyectos.list.execute(...)`. */
export interface UseCases {
  proyectos: CrudUseCases<Proyecto, string, ProyectoCreate>;
  propiedades: CrudUseCases<Propiedad, string, PropiedadCreate>;
  plantillas: CrudUseCases<Plantilla, string, PlantillaCreate>;
  modelos: CrudUseCases<Modelo, string, ModeloCreate>;
  generaciones: CrudUseCases<Generacion, string, GeneracionCreate>;
  conexiones: CrudUseCases<Conexion, string, ConexionCreate>;
  campanas: CrudUseCases<Campana, string, CampanaCreate>;
  leads: CrudUseCases<Lead, string, LeadCreate>;
  transacciones: CrudUseCases<TransaccionCredito, string, TransaccionCreditoCreate>;

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
    plantillas: buildCrudUseCases(repos.plantillaRepo),
    modelos: buildCrudUseCases(repos.modeloRepo),
    generaciones: buildCrudUseCases(repos.generacionRepo),
    conexiones: buildCrudUseCases(repos.conexionRepo),
    campanas: buildCrudUseCases(repos.campanaRepo),
    leads: buildCrudUseCases(repos.leadRepo),
    transacciones: buildCrudUseCases(repos.transaccionRepo),

    getWallet: { execute: () => repos.walletRepo.getWallet() },
    getTransacciones: { execute: () => repos.walletRepo.getTransacciones() },
    recargarCreditos: new RecargarCreditosUseCase(repos.walletRepo),
    validarCampana: new ValidarCampanaUseCase(repos.campanaRepo),

    login: { execute: (input) => repos.authRepo.login(input) },
    obtenerPerfil: { execute: () => repos.authRepo.me() },
  };
}
