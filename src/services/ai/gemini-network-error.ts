/** Safe classification for Node.js fetch errors. Never expose URLs, key values, or raw error messages. */
export type GeminiTransportCode = 'AI_TIMEOUT' | 'AI_DNS' | 'AI_TLS' | 'AI_CONNECTION' | 'AI_NETWORK';

export function classifyGeminiTransportError(error: unknown): { code: GeminiTransportCode; message: string; reason: string } {
  const outer = error instanceof Error ? error : undefined;
  const cause = outer && 'cause' in outer ? (outer as Error & { cause?: unknown }).cause : undefined;
  const causeRecord = cause && typeof cause === 'object' ? cause as { code?: unknown; errors?: unknown[] } : undefined;
  const outerCode = outer && 'code' in outer ? (outer as Error & { code?: unknown }).code : undefined;
  const nested = Array.isArray(causeRecord?.errors) ? causeRecord.errors : [];
  const codes = [outerCode, causeRecord?.code, ...nested.map((e) => e && typeof e === 'object' ? (e as { code?: unknown }).code : undefined)]
    .filter((c): c is string => typeof c === 'string');
  const reason = codes.find((c) => /^[A-Z0-9_]+$/.test(c)) || 'UNSPECIFIED';
  if (outer?.name === 'TimeoutError' || outer?.name === 'AbortError' || codes.includes('ETIMEDOUT') || codes.includes('UND_ERR_CONNECT_TIMEOUT'))
    return { code: 'AI_TIMEOUT', message: 'Waktu koneksi atau respons Gemini habis.', reason };
  if (codes.some((c) => ['ENOTFOUND', 'EAI_AGAIN', 'ENODATA'].includes(c)))
    return { code: 'AI_DNS', message: 'Server gagal menemukan alamat DNS Gemini. Periksa DNS, VPN, atau proxy pada komputer/server.', reason };
  if (codes.some((c) => c.startsWith('ERR_TLS') || c.startsWith('CERT_') || ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(c)))
    return { code: 'AI_TLS', message: 'Koneksi TLS/sertifikat HTTPS ke Gemini gagal. Periksa proxy atau sertifikat jaringan.', reason };
  if (codes.some((c) => ['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_SOCKET'].includes(c)))
    return { code: 'AI_CONNECTION', message: 'Koneksi ke Gemini ditolak atau terputus. Periksa firewall, VPN, atau proxy.', reason };
  return { code: 'AI_NETWORK', message: 'Server tidak dapat menyelesaikan koneksi ke Gemini. Periksa DNS, firewall, VPN, atau proxy.', reason };
}
