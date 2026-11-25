/**
 * LENTERA runs Gemini with server-only environment configuration.
 * Do not read platform_settings: historical Admin settings must never override env.
 * Do not expose the API key to client components or responses.
 */
export type AIProviderName = 'anthropic' | 'openai' | 'gemini' | 'mock';

export interface ServerAISettings {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  isConfigured: boolean;
  source: 'database' | 'environment' | 'mock';
}

export async function getServerAISettings(): Promise<ServerAISettings> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  const model = (process.env.GEMINI_MODEL || '').trim().replace(/^models\//, '');
  return {
    provider: 'gemini',
    model,
    apiKey,
    isConfigured: Boolean(apiKey && model),
    source: 'environment',
  };
}
