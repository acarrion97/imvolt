import { App as AntApp } from "antd";
import { AppRouter } from "./app/router/AppRouter";

/**
 * `<AntApp>` de AntD provee el contexto de `App.useApp()` (message, modal y
 * notification) usado por todas las páginas. No confundir con este componente.
 */
export function App() {
  return (
    <AntApp>
      <AppRouter />
    </AntApp>
  );
}
