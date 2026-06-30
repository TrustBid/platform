'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, Briefcase, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { sep10Login } from '@/lib/auth/sep10';
import { COUNTRIES } from '@/lib/countries';

const USER_TYPES = [
  {
    id: 'admin',
    label: 'Administrador ONG',
    description: 'Gestiona proyectos, fondos y equipo de tu organización.',
    Icon: Building2,
  },
  {
    id: 'responsable',
    label: 'Responsable de proyecto',
    description: 'Ejecuta y reporta el avance de proyectos asignados.',
    Icon: Briefcase,
  },
  {
    id: 'donante',
    label: 'Donante / Verificador',
    description: 'Sigue el destino de tus donaciones con trazabilidad blockchain.',
    Icon: Eye,
  },
] as const;

type UserTypeId = (typeof USER_TYPES)[number]['id'];

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [userType, setUserType] = useState<UserTypeId>('admin');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !country) return;
    setError(null);
    setConnecting(true);
    try {
      const conn = await connectWalletWithModal();
      if (!conn) { setConnecting(false); return; }
      await sep10Login(conn.address, { orgName: orgName.trim(), country, role: userType, provider: conn.provider });
      router.push('/dashboard');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      if (raw === 'NETWORK_MISMATCH') {
        setError('Tu wallet está en Mainnet. Cambia a Testnet en Freighter → Settings → Network.');
      } else if (raw === 'USER_REJECTED') {
        setError('Firma cancelada. Aprueba el challenge en tu wallet para continuar.');
      } else if (raw.includes('fetch') || raw.includes('Failed')) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      } else {
        setError(raw || 'No se pudo completar el registro. Intenta de nuevo.');
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-background">
      {/* Lado izquierdo — imagen institucional */}
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

      {/* Lado derecho — formulario */}
      <div className="flex items-center justify-center bg-white dark:bg-zinc-950 p-8 sm:p-12 md:p-16 overflow-y-auto">
        <div className="w-full max-w-sm space-y-7">

          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Crear cuenta</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Registra tu organización en TrustBid
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Nombre de la organización */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300" htmlFor="orgName">
                Nombre de la organización
              </label>
              <input
                id="orgName"
                type="text"
                placeholder="Ej. LATIR ONG"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>

            {/* País de la organización */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300" htmlFor="country">
                País
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
              >
                <option value="" disabled>Selecciona un país</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Tipo de usuario */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tipo de usuario
              </label>
              <div className="space-y-2">
                {USER_TYPES.map(({ id, label, description, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUserType(id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                      userType === id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                        : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600',
                    )}
                  >
                    <div className={cn(
                      'shrink-0 p-1.5 rounded-md',
                      userType === id
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        'text-sm font-semibold',
                        userType === id ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-900 dark:text-zinc-100',
                      )}>
                        {label}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {description}
                      </p>
                    </div>
                    <div className={cn(
                      'ml-auto shrink-0 h-4 w-4 rounded-full border-2 transition-colors',
                      userType === id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-300 dark:border-zinc-600',
                    )} />
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={connecting || !orgName.trim() || !country}
              className="w-full py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.99] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {connecting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {connecting ? 'Conectando wallet…' : 'Registrarse con wallet Stellar'}
            </button>
          </form>

          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
            Compatible con Freighter, Albedo y otras wallets Stellar.<br />
            Tus claves nunca salen de tu wallet.
          </p>

          <div className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Iniciar sesión
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
