import { API_URL } from '@/lib/config';

export const runtime = 'edge';

const API = API_URL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(`${API}/projects/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
