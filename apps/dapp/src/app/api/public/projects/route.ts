export const runtime = 'edge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
  if (searchParams.get('category')) params.set('category', searchParams.get('category')!);
  const res = await fetch(`${API}/projects?${params}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
