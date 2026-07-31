'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Primitivas visuales de Configuración.
 *
 * El diseño de Figma es light-only (fondo #f5f6f8, tarjetas blancas, borde
 * #e5e7ea, acento #2563eb). Mapeamos fondo/tarjeta/borde/texto a los tokens
 * semánticos —cuyos valores claros ya coinciden con el diseño— para que el
 * modo oscuro del dashboard siga funcionando. Sólo los acentos (azul, ámbar,
 * esmeralda, rojo, violeta) van explícitos, porque no existen como token.
 */

/** Tarjeta blanca con borde y esquinas de 10px. */
export function SettingsCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-[10px] border border-border bg-card', className)}>
      {children}
    </div>
  );
}

/** Encabezado de tarjeta: título, descripción opcional y separador a sangre. */
export function SettingsCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Etiqueta de campo: 11px, semibold, gris. */
export function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-muted-foreground"
    >
      {children}
    </label>
  );
}

/** Título de sección por encima de las tarjetas (16px semibold). */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Punto de estado + texto, en el color semántico del estado. */
export function StatusDot({ className }: { className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full', className)} />;
}

/** Píldora de estado (Activo / Conectado / Pagado / Verificado…). */
export function Pill({
  tone = 'blue',
  className,
  children,
}: {
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'neutral';
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    blue: 'bg-[#edf1fe] text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    green:
      'bg-[#dbf4ec] text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber:
      'bg-[#fff5e3] text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    red: 'bg-[#fee9e8] text-red-600 dark:bg-red-950/50 dark:text-red-400',
    violet:
      'bg-[#eee6fb] text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
    neutral: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
