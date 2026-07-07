'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { setSession } from '@/lib/auth/sep10';
import { PRIVY_ENABLED } from './privy-provider';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface RegistrationData {
  orgName?: string;
  country?: string;
  role?: string;
}

interface Props {
  registration?: RegistrationData;
  label?: string;
}

/**
 * Botón real. Usa hooks de Privy → SÓLO se monta cuando PRIVY_ENABLED (hay
 * provider). Flujo: login email/OTP → access token de Privy → POST /auth/privy
 * → JWT de TrustBid → setSession → dashboard.
 */
function PrivyEmailButton({ registration, label = 'Continuar con email' }: Props) {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useLogin({
    onComplete: async () => {
      setBusy(true);
      setError(null);
      try {
        const privyToken = await getAccessToken();
        if (!privyToken) throw new Error('no-token');

        const res = await fetch(`${API}/auth/privy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: privyToken, registration }),
        });
        if (!res.ok) throw new Error('exchange-failed');

        const { token: jwt } = await res.json();
        setSession(jwt);
        router.push('/dashboard');
      } catch {
        setError('No se pudo completar el ingreso con email. Intentá de nuevo.');
        setBusy(false);
      }
    },
    onError: () => {
      setError('Ingreso con email cancelado.');
      setBusy(false);
    },
  });

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => login()}
        disabled={busy}
        className="w-full py-3 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-semibold rounded-lg text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
      >
        {busy ? 'Verificando…' : label}
      </button>
      {error && <p className="text-xs font-medium text-red-600 text-center">{error}</p>}
    </div>
  );
}

/**
 * Punto de entrada para login/register. Decide sin usar hooks:
 *  - Privy configurado → botón real.
 *  - No configurado en producción → aviso visible (no desaparece en silencio).
 *  - No configurado en dev → nada (la app local anda sin Privy).
 */
export function PrivyEmailLogin(props: Props) {
  if (PRIVY_ENABLED) return <PrivyEmailButton {...props} />;
  if (process.env.NODE_ENV === 'production') {
    return (
      <p className="text-xs text-center text-amber-600 dark:text-amber-400">
        Ingreso con email no disponible (Privy no configurado).
      </p>
    );
  }
  return null;
}
