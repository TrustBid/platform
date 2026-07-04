export const runtime = 'edge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(`${API}/projects/${id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
