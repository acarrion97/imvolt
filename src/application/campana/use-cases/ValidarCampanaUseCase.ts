import type { Campana, CampanaRepository } from "@/domain/campana";

/**
 * Avance del flujo de aprobación de campañas (§10).
 *
 * local_draft → validated → awaiting_approval
 *
 * La validación verifica los campos mínimos de publicación (presupuesto,
 * destino, copy y conexión Meta asociada). El resto de transiciones
 * (approve/publish) son endpoints de la API en la fase de integración Meta.
 */
const TRANSICIONES: Record<string, string> = {
  local_draft: "validated",
  validated: "awaiting_approval",
};

export class ValidarCampanaUseCase {
  private readonly campanaRepo: CampanaRepository;

  constructor(campanaRepo: CampanaRepository) {
    this.campanaRepo = campanaRepo;
  }

  async execute(campaignId: string): Promise<Campana> {
    const campana = await this.campanaRepo.getById(campaignId);
    if (!campana) throw new Error("La campaña no existe.");

    const siguiente = TRANSICIONES[campana.estado];
    if (!siguiente) {
      throw new Error(`La campaña en estado "${campana.estado}" no puede avanzar de validación.`);
    }

    const problemas: string[] = [];
    if (!campana.presupuesto_maximo || campana.presupuesto_maximo <= 0) {
      problemas.push("Define un presupuesto máximo mayor a cero.");
    }
    if (!campana.destino) {
      problemas.push("Selecciona el destino del lead (WhatsApp, formulario o landing).");
    }
    if (!campana.copy || campana.copy.trim().length < 10) {
      problemas.push("El copy debe tener al menos 10 caracteres.");
    }
    if (siguiente === "awaiting_approval" && !campana.connection_id) {
      problemas.push("Asocia una conexión de Meta publicitaria antes de enviar a aprobación.");
    }
    if (problemas.length > 0) {
      throw new Error(problemas.join(" "));
    }

    return this.campanaRepo.update(campaignId, {
      estado: siguiente as Campana["estado"],
      updated_at: new Date().toISOString(),
    });
  }
}
