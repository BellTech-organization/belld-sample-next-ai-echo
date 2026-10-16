export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// BellD WO-607 staging check: one declared host and one undeclared host.
// Reports only the outcome, status code and duration of each request; never response bodies.
async function probe(url) {
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { 'user-agent': 'belld-wo607-egress-check' }, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    await response.arrayBuffer();
    return { ok: true, status: response.status, ms: Date.now() - started };
  } catch (error) {
    return { ok: false, error: error?.cause?.code ?? error?.name ?? 'error', ms: Date.now() - started };
  }
}

export async function GET() {
  const [declared, undeclared] = await Promise.all([probe('https://api.github.com/zen'), probe('https://example.com/')]);
  return Response.json({ declared, undeclared });
}
