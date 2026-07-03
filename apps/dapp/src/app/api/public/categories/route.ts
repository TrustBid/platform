import { API_URL } from '@/lib/config';

export const runtime = 'edge';

const API = API_URL;

export async function GET() {
  const res = await fetch(`${API}/categories`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
