import { App as AntApp } from "antd";
import { AppRouter } from "./app/router/AppRouter";
import { AuthProvider } from "@/presentation/auth/AuthProvider";

/**
 * `<AntApp>` de AntD provee el contexto de `App.useApp()` (message, modal y
 * notification) usado por todas las páginas. No confundir con este componente.
 *
 * `AuthProvider` resuelve la sesión (solo con VITE_DATA_PROVIDER=rest) antes
 * de que el router monte cualquier ruta protegida.
 */
export function App() {
  return (
    <AntApp>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AntApp>
  );
}
