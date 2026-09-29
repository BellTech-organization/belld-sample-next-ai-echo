import { belld, BellDCapabilityError } from '@belld/sdk';

export const runtime = 'nodejs';
export async function POST(request) {
  return belld.withRequest(request, async () => {
    try {
      // Chat-completions shaped input: the SDK never rewrites prompts (README §ai.generate).
      const result = await belld.ai.generate({
        model_kind: 'text',
        max_tokens: 100,
        input: { messages: [{ role: 'user', content: 'Say hello' }] },
      });
      return Response.json(result);
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
