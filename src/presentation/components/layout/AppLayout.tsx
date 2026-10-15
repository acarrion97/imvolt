import { useState, useCallback, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

/**
 * Estructura de la aplicación — UI Concept 01 del prototipo:
 * barra lateral carbón fija (256px) + barra superior pegajosa + vista con
 * padding propio. El contenido ya no vive dentro de una tarjeta contenedora:
 * cada sección maqueta sus propias tarjetas (fondo de app niebla).
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const handleToggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);

  return (
    <div className="app">
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(9, 24, 17, 0.64)",
            zIndex: 35,
          }}
        />
      )}

      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="main">
        <Header onToggleMobile={handleToggleMobile} />
        <main className="view">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
