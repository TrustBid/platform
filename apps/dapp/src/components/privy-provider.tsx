'use client';

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/** true si el riel Privy está configurado (hay App ID público en el env). */
export const PRIVY_ENABLED = !!APP_ID;

// En producción, un APP_ID faltante es un misconfig real (no algo opcional):
// lo gritamos en consola en vez de que el login con email desaparezca en silencio.
if (!APP_ID && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.error(
    '[Privy] NEXT_PUBLIC_PRIVY_APP_ID no está seteado — el login con email/OTP NO funcionará en producción.',
  );
}

/**
 * Envuelve la app con Privy SÓLO si hay App ID. Si no, pasa de largo (la app
 * sigue funcionando con el riel Wallet Kit / SEP-10).
 *
 * No creamos wallets EVM/Solana: la wallet Stellar la provisiona el backend
 * (Tier 2). El default del SDK ya es 'off', pero lo dejamos explícito para no
 * depender de la config del dashboard.
 */
export function PrivyClientProvider({ children }: { children: ReactNode }) {
  if (!APP_ID) return <>{children}</>;
  return (
    <PrivyProvider
      appId={APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: { theme: 'dark', accentColor: '#0F52BA' },
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'off' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
