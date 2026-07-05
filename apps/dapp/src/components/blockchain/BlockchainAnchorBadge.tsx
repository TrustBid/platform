'use client';

import { ExternalLink } from 'lucide-react';
import { explorerTxUrl, shortCode } from '@/lib/stellar-explorer';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  anchored: 'Ancorado',
  failed: 'Falló',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  anchored: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400',
};

interface BlockchainAnchorProps {
  txHash?: string | null;
  status?: string | null;
  label?: string;
}

export function BlockchainAnchorBadge({ txHash, status, label = 'Blockchain' }: BlockchainAnchorProps) {
  const resolvedStatus = status ?? (txHash ? 'anchored' : null);
  if (!resolvedStatus && !txHash) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      {resolvedStatus && (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 font-medium ${
            STATUS_COLORS[resolvedStatus] ?? 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {STATUS_LABELS[resolvedStatus] ?? resolvedStatus}
        </span>
      )}
      {txHash && (
        <a
          href={explorerTxUrl(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-blue-600 hover:underline dark:text-blue-400"
        >
          {shortCode(txHash, 8)}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

interface VerifyOnChainButtonProps {
  onVerify: () => Promise<void>;
  verifying?: boolean;
}

export function VerifyOnChainButton({ onVerify, verifying }: VerifyOnChainButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onVerify()}
      disabled={verifying}
      className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
    >
      {verifying ? 'Verificando…' : 'Verificar na blockchain'}
    </button>
  );
}
