import { API_URL } from '@/lib/config';

export const runtime = 'edge';

const API = API_URL;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/donations/${id}`, {
    headers: { accept: 'application/json' },
  });
  return Response.json(await res.json(), { status: res.status });
}
