import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";
import { ApiError, buildQuery, http } from "@/infrastructure/http/httpClient";

/**
 * Implementación REST genérica del patrón Repository.
 *
 * Cubre el CRUD completo contra un endpoint RESTful estándar:
 *
 *   GET    /{recurso}           ?campo=valor   → getAll(filters)
 *   GET    /{recurso}/{id}                     → getById(id)   (404 → null)
 *   POST   /{recurso}                          → create(data)
 *   PATCH  /{recurso}/{id}                     → update(id, data)
 *   DELETE /{recurso}/{id}                     → delete(id)
 *
 * Cada entidad solo declara `super("usuarios")` y agrega sus consultas
 * especiales (normalmente un filtro por foránea) en dos líneas.
 */
export abstract class RestCrudRepository<T, TId extends number | string, TCreate> implements CrudRepository<
  T,
  TId,
  TCreate
> {
  private readonly resource: string;

  protected constructor(resource: string) {
    this.resource = resource;
  }

  async getAll(filters?: FilterParams): Promise<T[]> {
    return http.get<T[]>(`/${this.resource}${buildQuery(filters)}`);
  }

  async getById(id: TId): Promise<T | null> {
    try {
      return await http.get<T>(`/${this.resource}/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  async create(data: TCreate): Promise<T> {
    return http.post<T>(`/${this.resource}`, data);
  }

  async update(id: TId, data: Partial<T>): Promise<T> {
    return http.patch<T>(`/${this.resource}/${id}`, data);
  }

  async delete(id: TId): Promise<void> {
    await http.del(`/${this.resource}/${id}`);
  }
}
