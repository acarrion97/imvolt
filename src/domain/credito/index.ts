import type { CrudRepository, FilterParams } from "@/domain/core/repositories/CrudRepository";

/** Entidad `public.credit_wallets` — billetera de créditos de la organización. */
export interface Wallet {
  wallet_id: string;
  organization_id: string;
  saldo: number;
  updated_at: string;
}

export type TransaccionTipo =
  | "reserva"
  | "consumo"
  | "devolucion"
  | "recarga"
  | "ajuste";

/** Entidad `public.credit_transactions` — `monto` cambia saldo; `creditos` registra el volumen del evento. */
export interface TransaccionCredito {
  transaction_id: string;
  wallet_id: string;
  organization_id: string;
  tipo: TransaccionTipo;
  monto: number;
  creditos: number;
  generation_id: string | null;
  descripcion: string | null;
  idempotency_key: string | null;
  created_at: string;
}

export type TransaccionCreditoCreate = Omit<
  TransaccionCredito,
  "transaction_id" | "wallet_id" | "organization_id" | "created_at"
>;

export interface WalletRepository {
  getWallet(): Promise<Wallet>;
  getTransacciones(filters?: FilterParams): Promise<TransaccionCredito[]>;
  /** Recarga (stub de pasarela: POST /billing/recharge). */
  recargar(monto: number, idempotencyKey: string): Promise<Wallet>;
}

export type TransaccionRepository = CrudRepository<
  TransaccionCredito,
  string,
  TransaccionCreditoCreate
>;
