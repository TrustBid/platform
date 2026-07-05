export const runtime = 'edge';

import { API_BASE_URL as API } from '@/lib/api/base-url';

export async function GET() {
  const res = await fetch(`${API}/ngo`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
