import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/**
 * Implementación en memoria genérica del patrón Repository.
 *
 * Es la contraparte mock de `RestCrudRepository`: mismos métodos, mismos
 * filtros (coincidencia exacta por campo), pero sin red. Sirve para
 * desarrollar la UI sin backend (`VITE_DATA_PROVIDER=mock`) y para tests.
 *
 * Cada entidad aporta tres cosas en su constructor:
 *   1. cómo leer su id,
 *   2. cómo construir la fila creada (id + created_at),
 *   3. sus datos semilla.
 */
export abstract class InMemoryCrudRepository<
  T,
  TId extends number | string,
  TCreate,
> implements CrudRepository<T, TId, TCreate> {
  private rows: T[] = [];
  private seq = 0;
  private readonly getId: (row: T) => TId;
  private readonly buildRow: (data: TCreate, id: TId) => T;

  constructor(
    getId: (row: T) => TId,
    buildRow: (data: TCreate, id: TId) => T,
    seed: T[] = [],
  ) {
    this.getId = getId;
    this.buildRow = buildRow;
    this.rows = [...seed];
    this.seq = seed.reduce((max, row) => Math.max(max, Number(this.getId(row))), 0) as never;
  }

  async getAll(filters?: FilterParams): Promise<T[]> {
    return this.applyFilters(this.rows, filters);
  }

  async getById(id: TId): Promise<T | null> {
    return this.rows.find((row) => this.getId(row) === id) ?? null;
  }

  async create(data: TCreate): Promise<T> {
    const id = (this.seq + 1) as TId;
    const row = this.buildRow(data, id);
    this.seq += 1;
    this.rows = [row, ...this.rows];
    return row;
  }

  /**
   * Variante de `create` con id explícito. La usan los repos mock de entidades
   * con ID UUID, donde el contador secuencial no aplica y el id lo genera el
   * propio repositorio (p.ej. crypto.randomUUID()).
   */
  protected async createWithId(id: TId, data: TCreate): Promise<T> {
    const row = this.buildRow(data, id);
    this.rows = [row, ...this.rows];
    return row;
  }

  async update(id: TId, data: Partial<T>): Promise<T> {
    const index = this.rows.findIndex((row) => this.getId(row) === id);
    if (index === -1) throw new Error(`No existe el registro ${id}`);
    const updated = { ...this.rows[index], ...data } as T;
    this.rows[index] = updated;
    return updated;
  }

  async delete(id: TId): Promise<void> {
    this.rows = this.rows.filter((row) => this.getId(row) !== id);
  }

  /** Filtrado exacto reutilizable por los repositorios concretos. */
  protected applyFilters(rows: T[], filters?: FilterParams): T[] {
    if (!filters) return [...rows];
    const entries = Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );
    if (entries.length === 0) return [...rows];

    return rows.filter((row) => {
      const bag = row as unknown as Record<string, unknown>;
      return entries.every(([key, value]) => String(bag[key]) === String(value));
    });
  }
}
