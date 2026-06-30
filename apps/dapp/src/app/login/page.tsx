'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  const handleConnectWallet = async () => {
    setWalletError(null);
    setConnecting(true);
    try {
      const address = await connectWalletWithModal();
      if (address) router.push('/dashboard');
    } catch {
      setWalletError('No se pudo conectar la wallet.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-background">

      {/* LADO IZQUIERDO: Imagen institucional con la marca de Stellar (Espejo del Login) */}
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

      {/* LADO DERECHO: El formulario de Login (Fondo Blanco puro) */}
      <div className="flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 text-zinc-900">
        <div className="w-full max-w-sm space-y-8">

          {/* Encabezado */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
              Welcome back
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              Sign in to manage your projects
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.99] transition-all text-sm"
            >
              Sign in
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium text-zinc-400">or</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Login con wallet nativa de Stellar */}
          <button
            type="button"
            onClick={handleConnectWallet}
            disabled={connecting}
            className="w-full py-2.5 px-4 bg-white border border-zinc-200 text-zinc-700 font-semibold rounded-lg shadow-sm hover:bg-zinc-50 active:scale-[0.99] transition-all text-sm disabled:opacity-60"
          >
            {connecting ? 'Conectando…' : 'Connect Stellar wallet'}
          </button>
          {walletError && <p className="text-sm font-medium text-red-600">{walletError}</p>}

          {/* Registro */}
          <div className="text-center text-sm font-medium text-zinc-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Create account
            </button>
          </div>

        </div>
      </div>

    </main>
  );
}
