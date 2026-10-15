import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FilterParams } from "@/domain/core/repositories/CrudRepository";
import type { CrudUseCases } from "@/application/core/crud-use-cases";
import type { QueryDomain } from "@/infrastructure/cache/queryKeys";

import { domainKey } from "@/infrastructure/cache/queryKeys";

/**
 * Hooks TanStack Query genéricos para cualquier dominio CRUD.
 *
 * Cada página usa el conjunto completo devuelto por estas fábricas:
 *   const { useList, useCreate } = createCrudHooks(container.propiedades, "propiedades");
 *
 * Convenciones de la plantilla:
 *  - lecturas → useQuery con la query key del dominio,
 *  - escrituras → useMutation que invalida `domainKey(<dominio>)` al terminar,
 *    refrescando de un golpe todas las variantes (listados + por foránea).
 */
export interface CrudHooks<T, TId extends string, TCreate> {
  useList: (filters?: FilterParams) => ReturnType<typeof useQuery<T[]>>;
  useById: (id: TId | undefined) => ReturnType<typeof useQuery<T | null>>;
  useCreate: () => ReturnType<typeof useMutation<T, Error, TCreate>>;
  useUpdate: () => ReturnType<
    typeof useMutation<T, Error, { id: TId; data: Partial<T> }>
  >;
  useDelete: () => ReturnType<typeof useMutation<void, Error, TId>>;
}

export function createCrudHooks<T, TId extends string, TCreate>(
  useCases: CrudUseCases<T, TId, TCreate>,
  domain: QueryDomain,
): CrudHooks<T, TId, TCreate> {
  const useList = (filters?: FilterParams) =>
    useQuery({
      queryKey: [...domainKey(domain), "list", filters ?? {}] as const,
      queryFn: () => useCases.list.execute(filters),
    });

  const useById = (id: TId | undefined) =>
    useQuery({
      queryKey: [...domainKey(domain), id] as const,
      queryFn: () => useCases.byId.execute(id as TId),
      enabled: Boolean(id),
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TCreate) => useCases.create.execute(data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: domainKey(domain) }),
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: TId; data: Partial<T> }) =>
        useCases.update.execute(id, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: domainKey(domain) }),
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: TId) => useCases.remove.execute(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: domainKey(domain) }),
    });
  };

  return { useList, useById, useCreate, useUpdate, useDelete };
}
