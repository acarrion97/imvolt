export type AdminEstado = "activo" | "inactivo";

export interface Plan {
  plan_id: number;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  limite_usuarios: number;
  caracteristicas: string[];
  estado: AdminEstado;
  creado_en: string;
  actualizado_en: string;
}

export type PlanInput = Omit<Plan, "plan_id" | "creado_en" | "actualizado_en">;

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
