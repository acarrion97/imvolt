import { useQuery } from "@tanstack/react-query";
import { http } from "@/infrastructure/http/httpClient";

export interface CampaignAnalyticsItem {
  campaign_id: string;
  campaign_name: string | null;
  fuente: "meta";
  gasto: number | null;
  impresiones: number | null;
  clics: number | null;
  leads: number | null;
  ctr: number | null;
  cpl: number | null;
  metricas_disponibles: boolean;
  actualizado_en: string | null;
}

export interface CampaignAnalyticsResponse {
  items: CampaignAnalyticsItem[];
  pagination: { limit: number; offset: number; total: number; has_more: boolean };
  formulas: { ctr: string; cpl: string };
  datos: { fuente: string; actualizado_en: string; antiguedad: string };
}

export interface CampaignAnalyticsFilters {
  desde: string;
  hasta: string;
  fuente: "meta";
  campania_id?: string;
  limit: number;
  offset: number;
  enabled?: boolean;
}

export function useCampaignAnalytics(filters: CampaignAnalyticsFilters) {
  const params = new URLSearchParams({
    desde: filters.desde,
    hasta: filters.hasta,
    fuente: filters.fuente,
    limit: String(filters.limit),
    offset: String(filters.offset),
  });
  if (filters.campania_id) params.set("campania_id", filters.campania_id);

  return useQuery({
    queryKey: ["campaign-analytics", filters.desde, filters.hasta, filters.fuente, filters.campania_id ?? "all", filters.limit, filters.offset],
    queryFn: () => http.get<CampaignAnalyticsResponse>(`/v1/campaigns/reports/analytics?${params.toString()}`),
    enabled: filters.enabled ?? true,
    staleTime: 60_000,
  });
}
