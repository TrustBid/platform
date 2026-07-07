'use client';

import { useState } from 'react';
import { authHeaders } from '@/lib/auth/sep10';

import { API_BASE_URL as API } from '@/lib/api/base-url';

interface Props {
  onSaved: (name: string) => void;
}

export function OnboardingNameModal({ onSaved }: Props) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      onSaved(trimmed);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Bienvenido a TrustBid</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ¿Cómo te llamas? Lo usaremos para personalizar tu experiencia.
          </p>
        </div>

        <input
          type="text"
          autoFocus
          placeholder="Tu nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0F52BA]/20 focus:border-[#0F52BA] transition"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-3 bg-[#0F52BA] hover:bg-blue-700 text-white font-semibold rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {saving && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saving ? 'Guardando…' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}
