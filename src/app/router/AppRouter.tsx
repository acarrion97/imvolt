import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { DashboardPage } from "@/presentation/pages/dashboard/DashboardPage";
import { ProyectosPage } from "@/presentation/pages/proyectos/ProyectosPage";
import { PropiedadesPage } from "@/presentation/pages/propiedades/PropiedadesPage";
import { PlantillasPage } from "@/presentation/pages/plantillas/PlantillasPage";
import { EstudioPage } from "@/presentation/pages/estudio/EstudioPage";
import { CampanasPage } from "@/presentation/pages/campanas/CampanasPage";
import { ContactosPage } from "@/presentation/pages/contactos/ContactosPage";
import { AnaliticaPage } from "@/presentation/pages/analitica/AnaliticaPage";
import { ConfiguracionPage } from "@/presentation/pages/configuracion/ConfiguracionPage";

/**
 * Rutas IMVOLT según el mapa de navegación del documento maestro:
 *
 *   /dashboard      Dashboard        /plantillas     Plantillas
 *   /proyectos      Proyectos        /estudio        Estudio IA
 *   /propiedades    Propiedades      /campanas       Campañas
 *                  /contactos        Contactos       /analitica      Analítica
 *                  /configuracion    Configuración
 *
 * No hay auth en el MVP mock: si lo necesitás, envolvé las rutas privadas
 * con un ProtectedRoute y agregá /login.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/propiedades" element={<PropiedadesPage />} />
          <Route path="/plantillas" element={<PlantillasPage />} />
          <Route path="/estudio" element={<EstudioPage />} />
          <Route path="/campanas" element={<CampanasPage />} />
          <Route path="/contactos" element={<ContactosPage />} />
          <Route path="/analitica" element={<AnaliticaPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
