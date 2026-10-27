import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/presentation/components/layout/AppLayout";
import { LoginPage } from "@/presentation/pages/auth/LoginPage";
import { RegisterPage } from "@/presentation/pages/auth/RegisterPage";
import { RequireAuth } from "./RequireAuth";
import { RequirePermiso } from "./RequirePermiso";
import { DashboardPage } from "@/presentation/pages/dashboard/DashboardPage";
import { ProyectosPage } from "@/presentation/pages/proyectos/ProyectosPage";
import { PropiedadesPage } from "@/presentation/pages/propiedades/PropiedadesPage";
import { PlantillasPage } from "@/presentation/pages/plantillas/PlantillasPage";
import { BrandKitPage } from "@/presentation/pages/brand-kit/BrandKitPage";
import { EstudioPage } from "@/presentation/pages/estudio/EstudioPage";
import { CampanasPage } from "@/presentation/pages/campanas/CampanasPage";
import { ContactosPage } from "@/presentation/pages/contactos/ContactosPage";
import { AnaliticaPage } from "@/presentation/pages/analitica/AnaliticaPage";
import { MediosPage } from "@/presentation/pages/medios/MediosPage";
import { EquipoPage } from "@/presentation/pages/equipo/EquipoPage";
import { ConfiguracionPage } from "@/presentation/pages/configuracion/ConfiguracionPage";

/**
 * Navegación principal IMVOLT — mapa del prototipo (UI Concept 01):
 *
 *   Inicio, Mis propiedades, Estudio IA, Plantillas, Campañas Meta,
 *   Contactos, Analítica y Configuración.
 *
 * Las rutas de Proyectos, Medios, Brand Kit y Equipo se conservan, pero no
 * aparecen como secciones independientes del menú.
 *
 * Todas las rutas de la app pasan por `RequireAuth`: con el API real exige
 * sesión (token en localStorage) y en modo mock deja pasar sin login.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/inicio" element={<DashboardPage />} />
          <Route path="/propiedades" element={<PropiedadesPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/plantillas" element={<PlantillasPage />} />
          <Route path="/brand-kit" element={<BrandKitPage />} />
          <Route path="/estudio" element={<EstudioPage />} />
          <Route path="/campanas" element={<CampanasPage />} />
          <Route path="/contactos" element={<ContactosPage />} />
          <Route path="/analitica" element={<AnaliticaPage />} />
          <Route path="/medios" element={<MediosPage />} />
          <Route
            path="/equipo"
            element={
              <RequirePermiso capacidad="puedeGestionarUsuarios">
                <EquipoPage />
              </RequirePermiso>
            }
          />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
