/**
 * Tipos del portal público (donantes). Contrato compartido entre los Route Handlers
 * (`/api/public/*`), la capa de datos (`src/server/public`) y la UI.
 */

export type ProjectStatus = 'active' | 'completed' | 'paused';
export type MovementStatus = 'verified' | 'pending';
export type PipelineStatus = 'done' | 'current' | 'pending';

export interface NgoInfo {
  name: string;
  tagline: string;
  mission: string;
  totals: {
    projects: number;
    raisedUsd: number;
    spentUsd: number;
    beneficiaries: number;
  };
  /** "Cómo usamos tus fondos": distribución por categoría (para gráfica). */
  fundUsage: FundUsageSlice[];
}

export interface FundUsageSlice {
  category: string;
  amountUsd: number;
}

export interface PipelineStage {
  key: string;
  label: string;
  date: string | null; // ISO-8601 UTC | null si aún no ocurrió
  status: PipelineStatus;
}

export interface TraceabilityEntry {
  id: string;
  date: string; // ISO-8601 UTC
  concept: string;
  amount: number;
  currency: string;
  /** Hash de la tx en Stellar (código de verificación). */
  verificationCode: string;
  status: MovementStatus;
}

export interface ImpactIndicator {
  label: string;
  target: number;
  actual: number;
  unit: string;
}

/** Versión liviana para grillas/listados. */
export interface ProjectSummary {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  summary: string;
  budgetTotalUsd: number;
  budgetSpentUsd: number;
  beneficiariesTarget: number;
  beneficiariesReached: number;
  /** Etapa actual del pipeline (label) para el pill. */
  currentStage: string;
}

/** Detalle completo del proyecto. */
export interface Project extends ProjectSummary {
  description: string;
  currency: string;
  /** Dirección Stellar (testnet) de la org que recibe las donaciones. */
  recipientAddress?: string | null;
  pipeline: PipelineStage[];
  traceability: TraceabilityEntry[];
  impact: ImpactIndicator[];
}

export interface ProjectsQuery {
  q?: string;
  category?: string;
}

export interface DonationInput {
  projectId: string;
  amountUsd: number;
  walletAddress?: string;
  walletProvider?: string;
  /** Hash de la tx Stellar real (testnet) si la donación se firmó on-chain. */
  txHash?: string;
}

export interface DonationIntent {
  id: string;
  projectId: string;
  amountUsd: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'expired' | 'failed';
  /** Código de verificación on-chain (hash de la tx) una vez confirmada. */
  verificationCode: string | null;
  /** Link SEP-7 para pagar desde wallet cuando no se firmó on-chain. */
  sep7Link?: string | null;
  /** Memo de la transacción (PAY-YYYY-NNNN). */
  memoId?: string | null;
  createdAt: string;
}
