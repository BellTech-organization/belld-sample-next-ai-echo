import { belld } from '@belld/sdk';

export const runtime = 'nodejs';
export async function POST(request) {
  return belld.withRequest(request, async () => {
    const result = await belld.ai.generate({ model_kind: 'text', max_tokens: 100, input: 'Say hello' });
    return Response.json(result);
  });
}
