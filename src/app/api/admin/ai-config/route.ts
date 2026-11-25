import { NextResponse } from 'next/server';
import { isCurrentUserPlatformAdmin } from '@/lib/admin/authorization';
import { getServerAISettings } from '@/lib/admin/ai-settings';

const noStore = { 'Cache-Control': 'no-store' };

/** Read-only status: no secrets or credentials ever leave the server. */
export async function GET() {
  const { isAdmin } = await isCurrentUserPlatformAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403, headers: noStore });

  const settings = await getServerAISettings();
  return NextResponse.json({
    provider: 'gemini',
    model: settings.model,
    keyConfigured: Boolean(settings.apiKey),
    source: 'environment',
    mockMode: false,
    ready: settings.isConfigured,
  }, { headers: noStore });
}

/** Admin must not be able to upload, replace or clear the server's Gemini key. */
export async function PUT() {
  return NextResponse.json({ error: 'Konfigurasi Gemini hanya melalui environment server.' }, { status: 405, headers: noStore });
}
export async function POST() {
  return NextResponse.json({ error: 'Konfigurasi Gemini hanya melalui environment server.' }, { status: 405, headers: noStore });
}
