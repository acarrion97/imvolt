/* global URLSearchParams, window, document */

const params = new URLSearchParams(window.location.search);
if (params.get("meta_deletion") === "complete") {
  const result = document.createElement("div");
  result.className = "nota";
  result.setAttribute("role", "status");
  result.textContent =
    "Solicitud de Meta procesada. Se eliminaron las conexiones y los tokens de Meta asociados a esta cuenta. Código de confirmación: " +
    (params.get("confirmation_code") || "no disponible");
  document.querySelector("main")?.prepend(result);
}
