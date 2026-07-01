export const runtime = 'edge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const res = await fetch(`${API}/donations/${params.id}`, {
    headers: { accept: 'application/json' },
  });
  return Response.json(await res.json(), { status: res.status });
}
