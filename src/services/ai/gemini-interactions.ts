/** Read final text from the Gemini Interactions REST response. */
export function extractGeminiInteractionText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const data = payload as {
    status?: string;
    steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  };
  if (data.status === 'failed') {
    throw new Error('AI_UPSTREAM: Gemini Interactions melaporkan kegagalan pemrosesan.');
  }
  if (data.status && data.status !== 'completed') {
    throw new Error('AI_OUTPUT_EMPTY: Gemini belum menyelesaikan interaksi.');
  }
  if (!Array.isArray(data.steps)) return '';
  return data.steps
    .filter((step) => step?.type === 'model_output')
    .flatMap((step) => Array.isArray(step.content) ? step.content : [])
    .filter((content) => content?.type === 'text' && typeof content.text === 'string')
    .map((content) => content.text || '')
    .join('\n').trim();
}
