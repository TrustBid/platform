import type {
  DonationInput,
  DonationIntent,
  NgoInfo,
  Project,
  ProjectSummary,
  ProjectsQuery,
} from '@/types/public';

/**
 * Cliente del portal público: consume los Route Handlers (`/api/public/*`).
 * Usado por componentes cliente (búsqueda/filtro, flujo de donación). Los Server
 * Components leen de la repository directamente.
 */

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchProjects(query: ProjectsQuery = {}): Promise<ProjectSummary[]> {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category && query.category !== 'all') params.set('category', query.category);
  const qs = params.toString();
  return getJson<ProjectSummary[]>(`/api/public/projects${qs ? `?${qs}` : ''}`);
}

export function fetchProject(id: string): Promise<Project> {
  return getJson<Project>(`/api/public/projects/${id}`);
}

export function fetchCategories(): Promise<string[]> {
  return getJson<string[]>('/api/public/categories');
}

export function fetchNgo(): Promise<NgoInfo> {
  return getJson<NgoInfo>('/api/public/ngo');
}

export async function submitDonation(input: DonationInput): Promise<DonationIntent> {
  const res = await fetch('/api/public/donate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `POST /api/public/donate → ${res.status}`);
  }
  return res.json() as Promise<DonationIntent>;
}
