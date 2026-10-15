import type { WalletRepository } from "@/domain/credito";
import type { Wallet } from "@/domain/credito";

/**
 * Recarga de créditos (commerce §10 / billing).
 *
 * En modo simulado la pasarela confirma al instante; en producción este caso
 * de uso solo registra el movimiento validado por el proveedor de cobro.
 */
export class RecargarCreditosUseCase {
  private readonly walletRepo: WalletRepository;

  constructor(walletRepo: WalletRepository) {
    this.walletRepo = walletRepo;
  }

  execute(monto: number, idempotencyKey?: string): Promise<Wallet> {
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error("El monto de la recarga debe ser mayor a cero.");
    }
    return this.walletRepo.recargar(monto, idempotencyKey);
  }
}
