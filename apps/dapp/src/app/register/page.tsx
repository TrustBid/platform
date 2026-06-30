'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWallet } from '@/lib/wallet/adapter';
import { sep10Login } from '@/lib/auth/sep10';

const USER_TYPES = [
  {
    id: 'admin',
    label: 'Administrador ONG',
    description: 'Gestiona proyectos, fondos y equipo de tu organización.',
    icon: '🏛️',
  },
  {
    id: 'responsable',
    label: 'Responsable de proyecto',
    description: 'Ejecuta y reporta el avance de proyectos asignados.',
    icon: '📋',
  },
  {
    id: 'donante',
    label: 'Donante / Verificador',
    description: 'Sigue el destino de tus donaciones con trazabilidad blockchain.',
    icon: '🔍',
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('CO');
  const [userType, setUserType] = useState<string>('admin');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setError(null);
    setConnecting(true);
    try {
      // Registration = connect wallet → SEP-10 auto-bootstraps org+user on first login
      const { address } = await connectWallet('freighter');
      await sep10Login(address);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'No se pudo completar el registro. Verifica que Freighter esté instalado.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 bg-background">
      <div className="hidden md:flex relative w-full h-full bg-sidebar select-none items-center justify-center p-12">
        <div className="relative w-full h-full flex flex-col items-center justify-center max-w-lg">
          <Image src={elipseBg} alt="TrustBid Infrastructure" priority className="w-full h-auto object-contain max-h-[75vh]" />
          <p className="absolute bottom-16 left-0 right-0 text-center text-sm font-medium tracking-wide text-zinc-400/90 max-w-md mx-auto leading-relaxed px-4">
            Every transaction leaves a trace. Transparent fund management powered by Stellar blockchain.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 text-zinc-900 overflow-y-auto">
        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Crear cuenta</h2>
            <p className="text-sm font-medium text-zinc-500">Registra tu organización en TrustBid</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre de la organización */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="orgName">
                Nombre de la organización *
              </label>
              <input
                id="orgName"
                type="text"
                placeholder="Ej. LATIR ONG"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
                required
              />
            </div>

            {/* País */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="country">
                País
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium"
              >
                <option value="CO">🇨🇴 Colombia</option>
                <option value="MX">🇲🇽 México</option>
                <option value="AR">🇦🇷 Argentina</option>
                <option value="PE">🇵🇪 Perú</option>
                <option value="CL">🇨🇱 Chile</option>
                <option value="US">🇺🇸 Estados Unidos</option>
                <option value="ES">🇪🇸 España</option>
              </select>
            </div>

            {/* Tipo de usuario */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700">Tipo de usuario</label>
              <div className="space-y-2">
                {USER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      userType === type.id
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{type.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{type.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{type.description}</p>
                    </div>
                    {userType === type.id && (
                      <span className="ml-auto text-blue-600 mt-0.5">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={connecting || !orgName.trim()}
              className="w-full py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.99] transition-all text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {connecting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {connecting ? 'Conectando wallet…' : 'Registrarse con Freighter'}
            </button>
          </form>

          <p className="text-xs text-zinc-400 text-center">
            Al registrarte, tu wallet Stellar firma el reto SEP-10. No se almacenan contraseñas.
          </p>

          <div className="text-center text-sm font-medium text-zinc-500">
            ¿Ya tienes cuenta?{' '}
            <button type="button" onClick={() => router.push('/login')} className="text-blue-600 hover:underline font-semibold">
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
