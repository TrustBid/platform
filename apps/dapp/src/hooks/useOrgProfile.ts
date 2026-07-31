'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders, getJwt } from '@/lib/auth/sep10';
import { API_BASE_URL as API } from '@/lib/api/base-url';

/**
 * Perfil extendido de la organización — `GET/PATCH /my/org/profile`.
 *
 * La API devuelve las columnas tal como están en la tabla, en snake_case, más
 * las relaciones (áreas de intervención, poblaciones, ODS). El PATCH sólo
 * escribe las columnas escalares que la lista blanca del servicio permite, y
 * exige rol admin.
 */
export interface OrgProfile {
  id: string;
  name: string;
  country: string;
  legal_name: string | null;
  acronym: string | null;
  fiscal_id: string | null;
  org_type: string | null;
  state_province: string | null;
  address_1: string | null;
  address_2: string | null;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_x: string | null;
  social_facebook: string | null;
  geographic_scope: string | null;
  annual_budget_range: string | null;
  onboarding_completed: boolean;
}

/** Valores aceptados por `org_type` en el DTO del backend. */
export const ORG_TYPES: { value: string; label: string }[] = [
  { value: 'ong', label: 'ONG' },
  { value: 'fundacion', label: 'Fundación' },
  { value: 'asociacion', label: 'Asociación' },
  { value: 'empresa_b', label: 'Empresa B' },
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'otra', label: 'Otra' },
];

/** Valores aceptados por `geographic_scope` en el DTO del backend. */
export const GEO_SCOPES: { value: string; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'nacional', label: 'Nacional' },
  { value: 'internacional', label: 'Internacional' },
];

async function loadProfile(): Promise<OrgProfile | null> {
  try {
    const res = await fetch(`${API}/my/org/profile`, { headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as OrgProfile;
  } catch {
    return null;
  }
}

export function useOrgProfile() {
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // No se invoca desde el efecto de abajo a propósito: llamar un callback con
  // setState desde un efecto es lo que marca react-hooks/set-state-in-effect.
  const refetch = useCallback(async () => {
    setProfile(await loadProfile());
  }, []);

  useEffect(() => {
    if (!getJwt()) { setLoading(false); return; }
    loadProfile().then(setProfile).finally(() => setLoading(false));
  }, []);

  return { profile, loading, refetch };
}
