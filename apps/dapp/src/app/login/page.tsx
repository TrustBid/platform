'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { sep10Login } from '@/lib/auth/sep10';

type Step = 'idle' | 'signing' | 'verifying';

const STEP_LABEL: Record<Step, string> = {
  idle:      'Conectar wallet Stellar',
  signing:   'Firmando challenge…',
  verifying: 'Verificando identidad…',
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]           = useState<Step>('idle');
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      setStep('signing');
      const address = await connectWalletWithModal();
      if (!address) { setConnecting(false); setStep('idle'); return; }

      setStep('verifying');
      await sep10Login(address);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NETWORK_MISMATCH') {
        setError('Tu wallet está en Mainnet. Cambia a Testnet en Freighter → Settings → Network.');
      } else if (msg === 'USER_REJECTED') {
        setError('Firma cancelada. Aprueba el challenge en tu wallet para continuar.');
      } else if (msg.includes('fetch') || msg.includes('Failed')) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      } else {
        setError('No se pudo conectar la wallet. Asegúrate de que esté instalada y desbloqueada.');
      }
      setStep('idle');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-white">
      {/* Left panel */}
      <div className="hidden md:flex relative w-full h-full bg-[#020817] select-none items-center justify-center p-12">
        <div className="relative w-full h-full flex flex-col items-center justify-center max-w-lg">
          <Image
            src={elipseBg}
            alt="TrustBid"
            priority
            className="w-full h-auto object-contain max-h-[70vh]"
          />
          <div className="absolute bottom-12 left-0 right-0 text-center px-4">
            <p className="text-sm font-semibold text-white/90 tracking-wide">TrustBid</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-xs mx-auto">
              Transparencia de fondos verificable en Stellar blockchain.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-sm space-y-8">

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Bienvenido de nuevo</h2>
            <p className="text-sm text-gray-500">Ingresa con tu wallet Stellar.</p>
          </div>

          <div className="space-y-4">
            {/* Wallet info card */}
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0F52BA]/10 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F52BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Autenticación con wallet</p>
                  <p className="text-xs text-gray-400">Protocolo SEP-10 · sin contraseñas</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Se generará un challenge que firmarás con tu wallet. Tus claves privadas nunca salen de tu dispositivo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className={cn(
                'w-full py-3.5 px-4 font-semibold rounded-xl text-sm transition-all',
                'flex items-center justify-center gap-2',
                'active:scale-[0.99] disabled:opacity-60',
                'bg-[#0F52BA] hover:bg-blue-700 text-white shadow-sm',
              )}
            >
              {connecting && (
                <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {STEP_LABEL[step]}
            </button>

            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Compatible con Freighter, Albedo y otras wallets Stellar.
            </p>
          </div>

          <p className="text-center text-sm text-gray-400">
            ¿Primera vez?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-[#0F52BA] hover:underline font-semibold"
            >
              Crear organización
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}
