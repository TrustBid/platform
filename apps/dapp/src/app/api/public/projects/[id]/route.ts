export const runtime = 'edge';

import { API_BASE_URL as API } from '@/lib/api/base-url';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(`${API}/projects/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
