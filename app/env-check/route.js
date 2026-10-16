import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// BellD WO-609 staging check: reports whether the runtime variable reached the app, and its sha256.
// The value itself is never returned or logged.
export function GET() {
  const value = process.env.WO609_PROBE;
  const present = typeof value === 'string';
  return Response.json({
    present,
    length: present ? value.length : 0,
    sha256: present ? createHash('sha256').update(value).digest('hex') : null,
  });
}
