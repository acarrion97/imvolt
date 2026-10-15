const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  proyectos: "Proyectos",
  propiedades: "Propiedades",
  plantillas: "Plantillas",
  estudio: "Estudio IA",
  campanas: "Campañas",
  contactos: "Contactos",
  analitica: "Analítica",
  configuracion: "Configuración",
};

import { useMemo } from "react";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useLocation, Link } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const items = [
      {
        title: (
          <Link to="/">
            <HomeOutlined />
          </Link>
        ),
      },
    ];

    let currentPath = "";
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] ?? segment;
      const isLast = currentPath === location.pathname;

      items.push({
        title: isLast ? <span>{label}</span> : <Link to={currentPath}>{label}</Link>,
      });
    }

    return items;
  }, [location.pathname]);

  if (location.pathname === "/") return null;

  return <Breadcrumb items={breadcrumbItems} />;
}
