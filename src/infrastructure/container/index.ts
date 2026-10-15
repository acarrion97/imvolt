import type { UseCases } from "./create-use-cases";
import { createRepositories } from "./create-repositories";
import { createUseCases } from "./create-use-cases";

/**
 * Contenedor de dependencias (composition root).
 * Se crea una única vez por sesión y lo consumen los hooks con
 * `getContainer()`. Aquí se ensambla el grafo: repositorio → use case.
 */
let container: UseCases | null = null;

export function getContainer(): UseCases {
  if (!container) {
    container = createUseCases(createRepositories());
  }
  return container;
}
