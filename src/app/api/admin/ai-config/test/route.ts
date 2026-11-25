import { classifyGeminiTransportError } from '@/services/ai/gemini-network-error';
import { extractGeminiInteractionText } from '@/services/ai/gemini-interactions';
import { NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { getServerAISettings } from '@/lib/admin/ai-settings';

// Do not send school, teacher or student information to external providers in this test.
const noStore = { 'Cache-Control': 'no-store' };

// One active test per Node.js process. No polling, retries or new model-list fetches.
// This lock does not coordinate multiple independently deployed server instances.
let testInProgress = false;

type TestErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AI_AUTH'
  | 'AI_LIMIT'
  | 'AI_MODEL_NOT_FOUND'
  | 'AI_REQUEST_REJECTED'
  | 'AI_UPSTREAM'
  | 'AI_TIMEOUT'
  | 'AI_NETWORK'
  | 'AI_DNS'
  | 'AI_TLS'
  | 'AI_CONNECTION'
  | 'AI_OUTPUT_EMPTY'
  | 'AI_TEST_FAILED'
  | 'AI_TEST_IN_PROGRESS';

function fail(code: TestErrorCode, message: string, status = 502) {
  return NextResponse.json({ ok: false, code, error: `${message} (Kode: ${code})` }, { status, headers: noStore });
}

function describeGeminiStatus(status: number, upstreamStatus?: string): { code: TestErrorCode; message: string } {
  if (status === 401 || status === 403) return { code: 'AI_AUTH', message: 'API key Gemini tidak valid atau tidak memiliki akses ke model ini.' };
  if (status === 404) return { code: 'AI_MODEL_NOT_FOUND', message: 'Endpoint Interactions menolak model ini (HTTP 404). Periksa ID model yang digunakan oleh Google AI Studio.' };
  if (status === 429) {
    return { code: 'AI_LIMIT', message: upstreamStatus === 'RESOURCE_EXHAUSTED'
      ? 'Kuota atau rate limit Gemini tercapai. Periksa kuota dan billing Google AI Studio.'
      : 'Gemini mengembalikan HTTP 429. Periksa kuota, billing, dan rate limit.' };
  }
  if (status >= 500) return { code: 'AI_UPSTREAM', message: `Jalur API Gemini mengembalikan HTTP ${status}. Ini bukan timeout koneksi. Respons dapat berasal dari Google atau perantara jaringan.` };
  return { code: 'AI_REQUEST_REJECTED', message: `Gemini menolak permintaan uji (HTTP ${status}). Periksa model dan akses API.` };
}

/** A minimal plain-text request tests API reachability, key and model separately from JSON module generation. */
async function testGemini(model: string, apiKey: string) {
  let response: Response;
  const modelUsed = model.replace(/^models\//, '');
  try {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ model: modelUsed, input: 'Balas singkat dengan kata OK.' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const transport = classifyGeminiTransportError(error);
    console.error('Gemini connection test transport failure', { code: transport.code, reason: transport.reason });
    return fail(transport.code, transport.message, transport.code === 'AI_TIMEOUT' ? 504 : 502);
  }

  if (!response.ok) {
    // Extract only a safe error category; never send upstream bodies, prompts or credentials to browser.
    let upstreamStatus: string | undefined;
    try {
      const json: unknown = await response.json();
      if (json && typeof json === 'object' && 'error' in json) {
        const detail = (json as { error?: { status?: unknown } }).error;
        if (typeof detail?.status === 'string') upstreamStatus = detail.status;
      }
    } catch { /* Upstream may not respond with JSON. */ }
    const diagnostic = describeGeminiStatus(response.status, upstreamStatus);
    console.error('Gemini connection test rejected', { upstreamHttpStatus: response.status, code: diagnostic.code, upstreamStatus: upstreamStatus || 'not-provided', modelUsed });
    return fail(diagnostic.code, diagnostic.message, response.status >= 500 ? 502 : response.status);
  }

  let text: string;
  try {
    const payload: unknown = await response.json();
    text = extractGeminiInteractionText(payload);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('AI_')) {
      return fail('AI_OUTPUT_EMPTY', 'Gemini tidak mengembalikan hasil akhir Interactions.');
    }
    return fail('AI_TEST_FAILED', 'Gemini mengirim respons yang tidak dapat dibaca.');
  }
  if (!text) return fail('AI_OUTPUT_EMPTY', 'Gemini terhubung tetapi tidak menghasilkan jawaban pada uji sederhana.');
  return NextResponse.json({
    ok: true,
    provider: 'gemini',
    model: modelUsed,
    message: `Koneksi Gemini berhasil (model: ${modelUsed}). Uji ini tidak mengirim data siswa dan belum menguji generator Modul Ajar.`,
  }, { headers: noStore });
}

export async function POST() {
  if (testInProgress) {
    return fail('AI_TEST_IN_PROGRESS', 'Uji koneksi lain masih berlangsung. Tidak ada request baru dikirim ke Gemini.', 409);
  }
  testInProgress = true;
  try {
    const { isAdmin } = await isCurrentUserPlatformAdmin();
    if (!isAdmin) return fail('AI_AUTH', 'Akses Admin diperlukan untuk menguji AI.', 403);

    const settings = await getServerAISettings();
    if (settings.provider === 'mock' || !settings.isConfigured || !settings.apiKey || !settings.model) {
      return fail('AI_NOT_CONFIGURED', 'Konfigurasi Gemini belum lengkap. Isi GEMINI_API_KEY dan GEMINI_MODEL di .env.local, kemudian restart server.', 400);
    }

    if (settings.provider === 'gemini') {
      return await testGemini(settings.model, settings.apiKey);
    }

    return fail('AI_NOT_CONFIGURED', 'Provider AI belum terkonfigurasi sebagai Gemini.', 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const knownCodes = ['AI_AUTH', 'AI_LIMIT', 'AI_MODEL_NOT_FOUND', 'AI_REQUEST_REJECTED', 'AI_UPSTREAM', 'AI_TIMEOUT', 'AI_NETWORK', 'AI_DNS', 'AI_TLS', 'AI_CONNECTION', 'AI_OUTPUT_EMPTY'] as const;
    const code = knownCodes.find((candidate) => message.includes(candidate)) || 'AI_TEST_FAILED';
    console.error('Admin AI connection test failed', { code });
    return fail(code, code === 'AI_TEST_FAILED'
      ? 'Uji koneksi gagal di server. Periksa konfigurasi AI dan log server.'
      : 'Uji koneksi gagal. Periksa API key, model, akses layanan, atau kuota.');
  } finally {
    testInProgress = false;
  }
}
