import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

/**
 * `navigator.onLine` es una señal rápida y solo del cliente: sirve para el
 * indicador de conectividad y para bloquear envíos obvios. NO es la
 * autoridad de si una escritura funcionó (eso lo decide la respuesta del
 * backend).
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
