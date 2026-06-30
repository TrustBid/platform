export const formatUsd = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

export const formatNumber = (n: number): string => new Intl.NumberFormat('en-US').format(n);

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );

export const pct = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 100) : 0;
