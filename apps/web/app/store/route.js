import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { belld, BellDCapabilityError } from '@belld/sdk';

export const runtime = 'nodejs';

// storage.object round trip for the cloud baseline journey (BellD WO-105, RELEASE-GATE #6):
// write → read → delete → read(missing) under the declared `/data/` prefix. The SDK sends
// `content_base64` inline; the platform's s3_compatible adapter returns `{ key, size_bytes, sha256 }`
// on write and `{ key, found, size_bytes, sha256, content_base64 }` on read.
//
// Every capability call is written out literally as `belld.storage.object.<action>(…)`. BellD's own
// source scan only recognises that exact member access, so a helper that aliases the capability and
// indexes it by a variable action reports each declared action as `declared_capability_unused`
// (warning) — which degrades verification and blocks the release. NFR §6 caps capability requests at
// 10 per execution per second, so the calls are spaced with an explicit delay instead.
export async function POST(request) {
  return belld.withRequest(request, async () => {
    try {
      const content = Buffer.from('BellD storage roundtrip');
      const key = '/data/echo';
      await delay(110);
      const written = await belld.storage.object.write({ key, bytes: content.length,
        input: { content_base64: content.toString('base64'), content_type: 'text/plain' } });
      await delay(110);
      const read = await belld.storage.object.read({ key, input: {} });
      await delay(110);
      const deleted = await belld.storage.object.delete({ key, input: {} });
      await delay(110);
      const missing = await belld.storage.object.read({ key, input: {} });
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
