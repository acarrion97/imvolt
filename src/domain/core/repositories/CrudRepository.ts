/**
 * Parámetros de filtro simples compartidos por todos los repositorios.
 *
 * En el proveedor REST se traducen a query string (?campo=valor) y en el
 * proveedor mock se aplican como coincidencia exacta en memoria.
 * Los valores `undefined`/`null` se ignoran.
 */
export type FilterParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Contrato genérico de CRUD del patrón Repository.
 *
 * Cada entidad del dominio extiende esta interfaz agregando únicamente sus
 * consultas específicas (ej: `getByEmpresaId`). El resto del CRUD ya viene
 * resuelto por las bases genéricas `RestCrudRepository` (REST) e
 * `InMemoryCrudRepository` (mock), así que agregar una entidad nueva no
 * obliga a reimplementar el ABM.
 *
 * - `T`: entidad.
 * - `TId`: tipo del identificador (number | string).
 * - `TCreate`: payload de creación (normalmente `Omit<T, "id" | "created_at">`).
 */
export interface CrudRepository<T, TId, TCreate> {
  getAll(filters?: FilterParams): Promise<T[]>;
  getById(id: TId): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: TId, data: Partial<T>): Promise<T>;
  delete(id: TId): Promise<void>;
}
