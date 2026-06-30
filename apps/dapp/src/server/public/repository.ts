import { randomUUID } from 'node:crypto';
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
 * Si `BACKEND_URL` está configurada, todos los datos vienen del backend real.
 * Si no, se usa el seed provisional (`./seed.ts`). La UI nunca sabe la diferencia:
 * consume estos métodos (vía Server Components) o los Route Handlers (`/api/public/*`).
 *
 * Para conectar el backend: definir `BACKEND_URL` y exponer en él las rutas equivalentes
 * (`/ngo`, `/projects`, `/projects/:id`, `/donations`). No hay que tocar la UI.
 */
const BACKEND_URL = process.env.BACKEND_URL;

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
  };
}

export async function getNgo(): Promise<NgoInfo> {
  if (BACKEND_URL) return backendGet<NgoInfo>('/ngo');
  return NGO;
}

export async function listProjects(query: ProjectsQuery = {}): Promise<ProjectSummary[]> {
  const { q, category } = query;
  if (BACKEND_URL) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    const qs = params.toString();
    return backendGet<ProjectSummary[]>(`/projects${qs ? `?${qs}` : ''}`);
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
  if (BACKEND_URL) return backendGet<string[]>('/categories');
  return Array.from(new Set(PROJECTS.map((p) => p.category)));
}

export async function getProject(id: string): Promise<Project | null> {
  if (BACKEND_URL) {
    try {
      return await backendGet<Project>(`/projects/${id}`);
    } catch {
      return null;
    }
  }
  return PROJECTS.find((p) => p.id === id) ?? null;
}

export async function createDonation(input: DonationInput): Promise<DonationIntent> {
  if (BACKEND_URL) {
    const res = await fetch(`${BACKEND_URL}/donations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Backend /donations → ${res.status}`);
    return res.json() as Promise<DonationIntent>;
  }
  // Sin backend: se crea una intención "pending". El código de verificación on-chain
  // lo completará el backend al confirmar/anclar la transacción.
  return {
    id: randomUUID(),
    projectId: input.projectId,
    amountUsd: input.amountUsd,
    status: 'pending',
    verificationCode: null,
    createdAt: new Date().toISOString(),
  };
}
