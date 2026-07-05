import type {
  DonationInput,
  DonationIntent,
  NgoInfo,
  Project,
  ProjectSummary,
  ProjectsQuery,
} from '@/types/public';
import { NGO, PROJECTS } from './seed';

/**
 * Capa de datos del portal público — ÚNICO punto de conexión al backend.
 *
 * Por defecto consume el backend real (misma URL que los Route Handlers, vía
 * NEXT_PUBLIC_API_URL); `BACKEND_URL` permite override server-side. El seed
 * (`./seed.ts`) queda como fallback resiliente si el backend no responde, para
 * que el portal público nunca muestre una página rota.
 */
const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'https://api-production-9557.up.railway.app';

async function backendGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Backend ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

function toSummary(p: Project): ProjectSummary {
  const {
    id,
    name,
    category,
    status,
    summary,
    budgetTotalUsd,
    budgetSpentUsd,
    beneficiariesTarget,
    beneficiariesReached,
    currentStage,
    imageUrl,
  } = p;
  return {
    id,
    name,
    category,
    status,
    summary,
    budgetTotalUsd,
    budgetSpentUsd,
    beneficiariesTarget,
    beneficiariesReached,
    currentStage,
    imageUrl,
  };
}

export async function getNgo(): Promise<NgoInfo> {
  try {
    return await backendGet<NgoInfo>('/ngo');
  } catch {
    return NGO;
  }
}

export async function listProjects(query: ProjectsQuery = {}): Promise<ProjectSummary[]> {
  const { q, category } = query;
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return await backendGet<ProjectSummary[]>(`/projects${qs ? `?${qs}` : ''}`);
  } catch {
    // fallback al seed
  }
  let items = PROJECTS.map(toSummary);
  if (category && category !== 'all') {
    items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle),
    );
  }
  return items;
}

export async function listCategories(): Promise<string[]> {
  try {
    return await backendGet<string[]>('/categories');
  } catch {
    return Array.from(new Set(PROJECTS.map((p) => p.category)));
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await backendGet<Project>(`/projects/${id}`);
  } catch {
    return PROJECTS.find((p) => p.id === id) ?? null;
  }
}

export async function createDonation(input: DonationInput): Promise<DonationIntent> {
  const res = await fetch(`${BACKEND_URL}/donations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Backend /donations → ${res.status}`);
  return res.json() as Promise<DonationIntent>;
}
