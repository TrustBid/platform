'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import elipseBg from '@/assets/Elipse.jpg';
import { connectWalletWithModal } from '@/lib/wallet/adapter';
import { sep10Login, getJwt } from '@/lib/auth/sep10';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BR', name: 'Brasil' },    { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },  { code: 'CR', name: 'Costa Rica' },
  { code: 'DO', name: 'República Dominicana' }, { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },  { code: 'MX', name: 'México' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' },  { code: 'PE', name: 'Perú' },
  { code: 'UY', name: 'Uruguay' },   { code: 'VE', name: 'Venezuela' },
  { code: 'US', name: 'Estados Unidos' }, { code: 'ES', name: 'España' },
  { code: 'GB', name: 'Reino Unido' }, { code: 'CA', name: 'Canadá' },
  { code: 'DE', name: 'Alemania' },  { code: 'FR', name: 'Francia' },
];

const ROLES = [
  {
    id: 'admin',
    label: 'Administrador',
    desc: 'Gestiona proyectos, fondos y equipo.',
  },
  {
    id: 'responsable',
    label: 'Responsable de proyecto',
    desc: 'Ejecuta y reporta el avance de proyectos.',
  },
  {
    id: 'donante',
    label: 'Donante / Verificador',
    desc: 'Verifica el destino de fondos.',
  },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 ' +
  'focus:border-[#0F52BA] transition';

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName]   = useState('');
  const [country, setCountry]   = useState('');
  const [role, setRole]         = useState<RoleId>('admin');
  const [connecting, setConnecting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const canSubmit = orgName.trim().length > 0 && country !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setConnecting(true);
    try {
      const address = await connectWalletWithModal();
      if (!address) { setConnecting(false); return; }

      await sep10Login(address);

      const jwt = getJwt();
      await fetch(`${API}/my/organization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ name: orgName, country }),
      });

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
        setError(msg || 'No se pudo completar el registro. Intenta de nuevo.');
      }
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
        <div className="w-full max-w-sm space-y-7">

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Crear cuenta</h2>
            <p className="text-sm text-gray-500">Registra tu organización en TrustBid.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Org name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="orgName">
                Nombre de la organización
              </label>
              <input
                id="orgName"
                type="text"
                placeholder="Nombre de tu organización"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="country">
                País
              </label>
              <div className="relative">
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={cn(inputCls, 'appearance-none pr-10 cursor-pointer')}
                  required
                >
                  <option value="">Seleccionar país</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tu rol
              </span>
              <div className="space-y-2">
                {ROLES.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition',
                      role === id
                        ? 'border-[#0F52BA] bg-[#0F52BA]/5'
                        : 'border-gray-200 hover:border-gray-300',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', role === id ? 'text-[#0F52BA]' : 'text-gray-900')}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                    </div>
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
                      role === id ? 'border-[#0F52BA] bg-[#0F52BA]' : 'border-gray-300',
                    )} />
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={connecting || !canSubmit}
              className="w-full py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm active:scale-[0.99] transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connecting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {connecting ? 'Conectando wallet…' : 'Conectar wallet y crear cuenta'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Compatible con Freighter, Albedo y otras wallets Stellar.<br />
            Tus claves nunca salen de tu wallet.
          </p>

          <p className="text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-[#0F52BA] hover:underline font-semibold"
            >
              Iniciar sesión
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}
