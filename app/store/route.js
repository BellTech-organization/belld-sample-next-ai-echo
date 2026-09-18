import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { belld, BellDCapabilityError } from '@belld/sdk';

export const runtime = 'nodejs';

// storage.object round trip for the cloud baseline journey (BellD WO-105, RELEASE-GATE #6):
// write → read → delete → read(missing) under the declared `/data/` prefix. The SDK sends
// `content_base64` inline; the platform's s3_compatible adapter returns `{ key, size_bytes, sha256 }`
// on write and `{ key, found, size_bytes, sha256, content_base64 }` on read.
export async function POST(request) {
  return belld.withRequest(request, async () => {
    try {
      const storage = belld.storage.object;
      // NFR §6: at most 10 capability requests per execution/second.
      const call = async (action, options) => { await delay(110); return storage[action](options); };
      const content = Buffer.from('BellD storage roundtrip');
      const key = '/data/echo';
      const written = await call('write', { key, bytes: content.length,
        input: { content_base64: content.toString('base64'), content_type: 'text/plain' } });
      const read = await call('read', { key, input: {} });
      const deleted = await call('delete', { key, input: {} });
      const missing = await call('read', { key, input: {} });
      const sha256 = createHash('sha256').update(content).digest('hex');
      return Response.json({
        key,
        written,
        read_matches: read.found === true && Buffer.from(read.content_base64 ?? '', 'base64').equals(content),
        sha256_matches: written.sha256 === sha256 && read.sha256 === sha256,
        deleted,
        missing_after_delete: missing.found === false,
      });
    } catch (error) {
      // Forward the platform problem (code / reason / correlation_id) instead of a blank 500.
      if (error instanceof BellDCapabilityError) {
        const problem = error.toProblem();
        return Response.json(problem, {
          status: problem.status ?? 503,
          headers: { 'content-type': 'application/problem+json' },
        });
      }
      throw error;
    }
  });
}
