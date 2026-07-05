'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { BlockchainAnchorBadge } from './BlockchainAnchorBadge';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface OrganizationBadgesResponse {
  organizationId: string;
  walletAddress: string | null;
  badges: Array<{
    id: string;
    badgeType: string;
    status: string;
    tokenId: number | null;
    anchorTxHash: string | null;
    issuedAt: string | null;
  }>;
  onChain: Array<{
    tokenId: number;
    badgeType: string;
    status: string;
  }>;
}

const BADGE_LABELS: Record<string, string> = {
  kyb_verified: 'KYB verificado',
  transparency_bronze: 'Transparencia Bronce',
  transparency_silver: 'Transparencia Plata',
  transparency_gold: 'Transparencia Oro',
};

interface OrgBadgesProps {
  organizationId: string;
  compact?: boolean;
}

export function OrgBadges({ organizationId, compact }: OrgBadgesProps) {
  const [data, setData] = useState<OrganizationBadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API}/organizations/${organizationId}/badges`);
        if (!res.ok) throw new Error('failed');
        const json = (await res.json()) as OrganizationBadgesResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [organizationId]);

  if (loading) {
    return compact ? null : (
      <p className="text-xs text-zinc-500">Cargando badges…</p>
    );
  }

  const issued = data?.badges.filter((b) => b.status === 'issued') ?? [];
  if (issued.length === 0 && (data?.onChain?.length ?? 0) === 0) {
    return compact ? null : (
      <p className="text-xs text-zinc-500">Sin badges emitidos</p>
    );
  }

  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <Award className="h-4 w-4 text-amber-500" />
          Badges de reputación
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {issued.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {BADGE_LABELS[b.badgeType] ?? b.badgeType}
            </p>
            {b.anchorTxHash && (
              <div className="mt-1">
                <BlockchainAnchorBadge txHash={b.anchorTxHash} status="anchored" label="" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
