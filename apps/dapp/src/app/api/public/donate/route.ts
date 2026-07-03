export const runtime = 'edge';
import { z } from 'zod';
import { API_URL } from '@/lib/config';

const API = API_URL;
const schema = z.object({
  projectId: z.string().uuid(),
  amountUsd: z.number().positive().max(1_000_000),
  walletAddress: z.string().optional(),
  walletProvider: z.string().optional(),
  txHash: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: { code: 'bad_request', message: 'Invalid JSON' } }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input' } }, { status: 422 });
  const res = await fetch(`${API}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });
  return Response.json(await res.json(), { status: res.status });
}
