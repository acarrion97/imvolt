export type AdminEstado = "activo" | "inactivo";

export interface Plan {
  plan_id: number;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  /** Miembros del equipo que caben en el plan. */
  limite_usuarios: number;
  /**
   * Límites de uso que la API valida antes de crear cada recurso
   * (proyectos, generaciones de imagen y de video, campañas Meta).
   * `null` = sin límite para ese recurso.
   */
  limite_proyectos: number | null;
  limite_imagenes_ia: number | null;
  limite_videos_ia: number | null;
  limite_campanias_meta: number | null;
  /** Texto visible de los beneficios: lo deriva el backend desde los límites. */
  caracteristicas: string[];
  estado: AdminEstado;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Payload de alta/edición: `caracteristicas` no viaja porque el backend lo
 * genera a partir de los límites numéricos.
 */
export type PlanInput = Omit<
  Plan,
  "plan_id" | "creado_en" | "actualizado_en" | "caracteristicas"
>;

export interface EmpresaAdmin {
  empresa_id: number;
  razon_social: string;
  ruc: string | null;
  estado: AdminEstado;
  plan_id: number | null;
  creado_en: string;
  actualizado_en: string;
  plan: { nombre: string; precio_mensual: number } | null;
  cantidad_usuarios: number;
}

export interface EmpresasAdminPage {
  items: EmpresaAdmin[];
  total: number;
}

export interface ConfiguracionSistema {
  configuracion_sistema_id: number;
  clave: string;
  valor: string;
  tipo: "texto" | "numero" | "booleano";
  descripcion: string;
  creado_en: string;
  actualizado_en: string;
}

export type ConfiguracionSistemaInput = Pick<
  ConfiguracionSistema,
  "clave" | "valor" | "tipo" | "descripcion"
>;
