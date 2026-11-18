/**
 * Resolución y validación de la URL base del API.
 *
 * Reglas:
 *  - Producción: solo `https://`. El token Bearer y los datos de la
 *    organización nunca deben viajar en claro.
 *  - Desarrollo: se admite `http://` hacia cualquier host (localhost, IP de la
 *    red local, ngrok…). Así el dev server en HTTP puede llamar al API local
 *    sin que el navegador bloquee la petición por "mixed content".
 *  - Nunca se aceptan credenciales embebidas (`https://user:pass@host`).
 *
 * Devuelve la URL sin barras finales, o lanza `Error` con el motivo.
 */
export function resolveApiUrl(raw: string | undefined, isProd: boolean): string {
  const value = (raw ?? "").trim();
  if (!value) return "";

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_URL no es una URL válida: "${value}".`);
  }

  if (url.username || url.password) {
    throw new Error("VITE_API_URL no debe incluir credenciales: usa la sesión de /auth/login.");
  }

  if (url.protocol === "https:") return value.replace(/\/+$/, "");

  if (url.protocol === "http:" && !isProd) {
    return value.replace(/\/+$/, "");
  }

  throw new Error(
    isProd
      ? "VITE_API_URL debe usar https:// en producción (TLS obligatorio)."
      : "VITE_API_URL debe usar https:// o, en desarrollo, http://.",
  );
}
