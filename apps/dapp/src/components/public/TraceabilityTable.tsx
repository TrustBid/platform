'use client';

import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { explorerTxUrl, shortCode } from '@/lib/stellar-explorer';
import { formatDate, formatNumber } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TraceabilityEntry } from '@/types/public';

export function TraceabilityTable({ entries }: { entries: TraceabilityEntry[] }) {
  const { t } = useLanguage();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('trace.date')}</TableHead>
          <TableHead>{t('trace.concept')}</TableHead>
          <TableHead className="text-right">{t('trace.amount')}</TableHead>
          <TableHead>{t('trace.code')}</TableHead>
          <TableHead>{t('trace.status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
              {formatDate(e.date)}
            </TableCell>
            <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{e.concept}</TableCell>
            <TableCell className="whitespace-nowrap text-right font-semibold text-zinc-900 dark:text-white">
              {formatNumber(e.amount)} {e.currency}
            </TableCell>
            <TableCell>
              <a
                href={explorerTxUrl(e.verificationCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                title="Ver en Stellar Expert"
              >
                {shortCode(e.verificationCode)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </TableCell>
            <TableCell>
              {e.status === 'verified' ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {t('trace.verified')}
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1">
                  <Clock className="h-3 w-3" /> {t('trace.pending')}
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
