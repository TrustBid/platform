'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import elipseBg from '@/assets/Elipse.jpg';

export default function RegisterPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes validar que las contraseñas coincidan antes de avanzar
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // Una vez registrado, lo mandamos al dashboard
    router.push('/dashboard');
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

      {/* LADO DERECHO: El formulario de Registro (Fondo Blanco puro) */}
      <div className="flex items-center justify-center bg-white p-8 sm:p-12 md:p-16 text-zinc-900">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Encabezado */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
              Create an account
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              Get started to build and trace your impact
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo: Organización */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="organization">
                Organization Name
              </label>
              <input
                id="organization"
                type="text"
                placeholder="NGO or Company Name"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>

            {/* Campo: Email */}
            <div className="space-y-1.5">
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

            {/* Campo: Password */}
            <div className="space-y-1.5">
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

            {/* Campo: Confirmar Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-zinc-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 px-4 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm active:scale-[0.99] transition-all text-sm"
            >
              Get started
            </button>
          </form>

          {/* Volver al Login */}
          <div className="text-center text-sm font-medium text-zinc-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign in
            </button>
          </div>

        </div>
      </div>

    </main>
  );
}