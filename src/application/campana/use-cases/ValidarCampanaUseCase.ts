import type { Campana, CampanaRepository } from "@/domain/campana";

export class ValidarCampanaUseCase {
  private readonly campanaRepo: CampanaRepository;

  constructor(campanaRepo: CampanaRepository) {
    this.campanaRepo = campanaRepo;
  }

  async execute(campaignId: string): Promise<Campana> {
    return this.campanaRepo.validar(campaignId);
  }
}
