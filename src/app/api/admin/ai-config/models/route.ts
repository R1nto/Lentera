import { NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { getServerAISettings } from '@/lib/admin/ai-settings';

const headers = { 'Cache-Control': 'no-store' };

function fail(code: string, message: string, status = 502) {
  return NextResponse.json({ ok: false, code, error: `${message} (Kode: ${code})` }, { status, headers });
}

type GeminiModel = {
  name?: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
};

/** Lists models using the encrypted key stored on the server. Never sends the key to the browser. */
export async function GET() {
  try {
    const { isAdmin } = await isCurrentUserPlatformAdmin();
    if (!isAdmin) return fail('AI_AUTH', 'Akses Admin diperlukan.', 403);

    const settings = await getServerAISettings();
    if (settings.provider !== 'gemini' || !settings.isConfigured || !settings.apiKey) {
      return fail('AI_NOT_CONFIGURED', 'Simpan provider Google Gemini dan API key terlebih dahulu.', 400);
    }

    const models: { id: string; label: string }[] = [];
    let nextPageToken: string | undefined;
    for (let page = 0; page < 5; page += 1) {
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
      url.searchParams.set('pageSize', '100');
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          headers: { 'x-goog-api-key': settings.apiKey },
          cache: 'no-store',
          signal: AbortSignal.timeout(12_000),
        });
      } catch (error) {
        const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
        return fail(timedOut ? 'AI_TIMEOUT' : 'AI_NETWORK', timedOut
          ? 'Pengambilan daftar model Gemini kehabisan waktu.'
          : 'Server tidak dapat menghubungi Google Gemini.', timedOut ? 504 : 502);
      }
      if (!response.ok) {
        const code = response.status === 401 || response.status === 403 ? 'AI_AUTH'
          : response.status === 429 ? 'AI_LIMIT' : 'AI_UPSTREAM';
        console.error('Gemini model listing failed', { status: response.status, code });
        return fail(code, response.status === 401 || response.status === 403
          ? 'API key Gemini ditolak saat mengambil daftar model.'
          : `Gemini tidak dapat mengirim daftar model (HTTP ${response.status}).`);
      }
      let data: { models?: GeminiModel[]; nextPageToken?: string };
      try { data = await response.json(); }
      catch { return fail('AI_UPSTREAM', 'Format daftar model Gemini tidak valid.'); }
      for (const model of data.models ?? []) {
        if (!model.name?.startsWith('models/') || !model.supportedGenerationMethods?.includes('generateContent')) continue;
        const id = model.name.slice('models/'.length);
        // This screen generates text/JSON; avoid displaying specialized audio, embeddings and image models.
        if (!id.startsWith('gemini-') || /(?:image|audio|tts|live|embedding|robotics|computer-use|veo)/i.test(id)) continue;
        if (!models.some((item) => item.id === id)) models.push({ id, label: model.displayName || id });
      }
      if (!data.nextPageToken) break;
      nextPageToken = data.nextPageToken;
    }
    models.sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ ok: true, models, note: 'Daftar ini bukan jaminan izin generateContent. Simpan model dan jalankan Uji koneksi.' }, { headers });
  } catch {
    return fail('AI_TEST_FAILED', 'Gagal membaca konfigurasi Gemini di server.');
  }
}
