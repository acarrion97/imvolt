import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/**
 * Casos de uso CRUD genéricos (Clean Architecture).
 *
 * Cada entidad no reinventa el ABM: el container ensambla estos casos de uso
 * apuntando al repositorio concreto. Las operaciones de negocio específicas
 * (p.ej. recargar créditos) viven en casos de uso propios del dominio.
 *
 * Nota: se evitan los parámetros de constructor con modificador (`private readonly`)
 * porque el proyecto usa `erasableSyntaxOnly`.
 */

export class ListEntities<T, TId, TCreate> {
  private readonly repo: CrudRepository<T, TId, TCreate>;

  constructor(repo: CrudRepository<T, TId, TCreate>) {
    this.repo = repo;
  }

  execute(filters?: FilterParams): Promise<T[]> {
    return this.repo.getAll(filters);
  }
}

export class GetEntityById<T, TId, TCreate> {
  private readonly repo: CrudRepository<T, TId, TCreate>;

  constructor(repo: CrudRepository<T, TId, TCreate>) {
    this.repo = repo;
  }

  execute(id: TId): Promise<T | null> {
    return this.repo.getById(id);
  }
}

export class CreateEntity<T, TId, TCreate> {
  private readonly repo: CrudRepository<T, TId, TCreate>;

  constructor(repo: CrudRepository<T, TId, TCreate>) {
    this.repo = repo;
  }

  execute(data: TCreate): Promise<T> {
    return this.repo.create(data);
  }
}

export class UpdateEntity<T, TId, TCreate> {
  private readonly repo: CrudRepository<T, TId, TCreate>;

  constructor(repo: CrudRepository<T, TId, TCreate>) {
    this.repo = repo;
  }

  execute(id: TId, data: Partial<T>): Promise<T> {
    return this.repo.update(id, data);
  }
}

export class DeleteEntity<T, TId, TCreate> {
  private readonly repo: CrudRepository<T, TId, TCreate>;

  constructor(repo: CrudRepository<T, TId, TCreate>) {
    this.repo = repo;
  }

  execute(id: TId): Promise<void> {
    return this.repo.delete(id);
  }
}

/** Conjunto CRUD completo de un dominio, tal como lo consume la presentación. */
export interface CrudUseCases<T, TId, TCreate> {
  list: ListEntities<T, TId, TCreate>;
  byId: GetEntityById<T, TId, TCreate>;
  create: CreateEntity<T, TId, TCreate>;
  update: UpdateEntity<T, TId, TCreate>;
  remove: DeleteEntity<T, TId, TCreate>;
}

export function buildCrudUseCases<T, TId, TCreate>(
  repo: CrudRepository<T, TId, TCreate>,
): CrudUseCases<T, TId, TCreate> {
  return {
    list: new ListEntities(repo),
    byId: new GetEntityById(repo),
    create: new CreateEntity(repo),
    update: new UpdateEntity(repo),
    remove: new DeleteEntity(repo),
  };
}
