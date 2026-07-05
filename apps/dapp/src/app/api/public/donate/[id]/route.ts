export const runtime = 'edge';

import { API_BASE_URL as API } from '@/lib/api/base-url';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/donations/${id}`, {
    headers: { accept: 'application/json' },
  });
  return Response.json(await res.json(), { status: res.status });
}
