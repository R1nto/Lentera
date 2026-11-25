/**
 * On-demand Gemini model fallback. Never runs during page rendering or in a timer.
 * An actual generateContent HTTP 404 is the only reason to try a second model.
 * Each candidate is tried at most once; failures other than 404 are returned immediately.
 */
const alternativeModels = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];

export function geminiModelCandidates(configuredModel: string): string[] {
  const configured = configuredModel.trim().replace(/^models\//, '');
  return [...new Set([configured, ...alternativeModels].filter(Boolean))];
}

export async function requestGeminiWithFallback(
  model: string,
  request: (modelId: string) => Promise<Response>,
): Promise<{ response: Response; modelUsed: string; attempts: number }> {
  const candidates = geminiModelCandidates(model);
  let last: Response | undefined;
  for (let i = 0; i < candidates.length; i++) {
    const modelId = candidates[i];
    const response = await request(modelId);
    last = response;
    if (response.status !== 404 || i === candidates.length - 1) {
      return { response, modelUsed: modelId, attempts: i + 1 };
    }
    // A 404 is not retried against the same model, avoiding looping requests.
    console.warn('Gemini model not available; trying fallback', { model: modelId, nextModel: candidates[i + 1] });
  }
  // candidates is never empty when settings are configured.
  return { response: last!, modelUsed: candidates[candidates.length - 1], attempts: candidates.length };
}
