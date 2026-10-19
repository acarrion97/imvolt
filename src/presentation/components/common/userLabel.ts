/** Iniciales para avatares (máx. 2 letras): "Andrea Salazar" → "AS". */
export function initials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

/** "propietario" → "Propietario" (etiquetas de rol en la UI). */
export function capitalize(texto: string): string {
  if (!texto) return texto;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
