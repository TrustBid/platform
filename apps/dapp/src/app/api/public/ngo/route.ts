export const runtime = 'edge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export async function GET() {
  const res = await fetch(`${API}/ngo`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
