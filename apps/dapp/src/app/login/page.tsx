'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { getJwt, sep10Login, syncJwtCookie } from '@/lib/auth/sep10';

// Destino tras el login. Solo rutas internas para evitar open-redirect.
function getRedirectTarget(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const r = new URLSearchParams(window.location.search).get('redirect');
  return r && r.startsWith('/') && !r.startsWith('//') ? r : '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [step, setStep] = useState<'idle' | 'signing' | 'verifying'>('idle');

  // Si ya hay sesión (localStorage), espeja la cookie y entra directo.
  useEffect(() => {
    if (getJwt()) {
      syncJwtCookie();
      router.replace(getRedirectTarget());
    }
  }, [router]);

  const handleConnectWallet = async () => {
    setWalletError(null);
    setConnecting(true);
    try {
      setStep('signing');
      const address = await connectWalletWithModal();
      if (!address) { setConnecting(false); setStep('idle'); return; }

      setStep('verifying');
      await sep10Login(address);
      router.push(getRedirectTarget());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NETWORK_MISMATCH') {
        setWalletError('Tu wallet está en Mainnet. Cambia a Testnet en Freighter → Settings → Network.');
      } else if (msg === 'USER_REJECTED') {
        setWalletError('Firma cancelada. Aprueba el challenge en tu wallet para continuar.');
      } else if (msg.includes('fetch') || msg.includes('Failed')) {
        setWalletError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      } else {
        setWalletError('No se pudo conectar la wallet. Asegúrate de que esté instalada y desbloqueada.');
      }
      setStep('idle');
    } finally {
      setConnecting(false);
    }
  };

  const stepLabel = step === 'signing' ? 'Firmando challenge…' : step === 'verifying' ? 'Verificando…' : 'Connect Stellar wallet';

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-background">
      <div className="hidden md:flex relative w-full h-full bg-sidebar select-none items-center justify-center p-12">
        <div className="relative w-full h-full flex flex-col items-center justify-center max-w-lg">
          <Image
            src={elipseBg}
            alt="TrustBid Infrastructure"
            priority
            className="w-full h-auto object-contain max-h-[75vh]"
          />
          <p className="absolute bottom-16 left-0 right-0 text-center text-sm font-medium tracking-wide text-zinc-400/90 max-w-md mx-auto leading-relaxed px-4">
            Every transaction leaves a trace. Transparent fund management powered by Stellar blockchain.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 text-zinc-900">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Welcome back</h2>
            <p className="text-sm font-medium text-zinc-500">Sign in with your Stellar wallet</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleConnectWallet}
              disabled={connecting}
              className="w-full py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.99] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {connecting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {stepLabel}
            </button>

            {walletError && (
              <p className="text-sm font-medium text-red-600 text-center">{walletError}</p>
            )}

            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              Freighter · Albedo · y más wallets Stellar compatibles.<br />
              El challenge SEP-10 se firma localmente — tus claves nunca salen de tu wallet.
            </p>
          </div>

          <div className="text-center text-sm font-medium text-zinc-500">
            ¿Primera vez?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Crear organización
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
