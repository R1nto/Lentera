import { request } from 'node:https';

// Used by long-running AI generation only. Node's built-in fetch/Undici can
// time out while establishing a socket before AbortSignal.timeout is reached.
// No retry, redirects, proxy credentials, or API keys in URLs/log messages.
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MAX_RESPONSE_BYTES = 3 * 1024 * 1024;

/** Return a standard Response so provider error handling remains unchanged. */
export function postGeminiInteraction(
  apiKey: string,
  payload: unknown,
  timeoutMs = 65_000,
): Promise<Response> {
  const body = JSON.stringify(payload);
  return new Promise<Response>((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const req = request(GEMINI_INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-goog-api-key': apiKey,
        'Connection': 'close',
      },
      // Node https.request does not impose Undici's default 10s connect timeout.
      agent: false,
      // Node 20+ enables automatic address-family selection by default.
    }, (res) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      res.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) {
          req.destroy(new Error('AI_OUTPUT_INVALID: Respons Gemini terlalu besar.'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('error', rejectOnce);
      res.on('end', () => {
        if (settled) return;
        settled = true;
        const status = res.statusCode || 502;
        resolve(new Response(Buffer.concat(chunks), {
          status,
          headers: { 'Content-Type': String(res.headers['content-type'] || 'application/json') },
        }));
      });
    });
    req.on('error', rejectOnce);
    // One total request deadline, from connect through complete response body.
    const timeout = setTimeout(() => {
      const error = new Error('Koneksi atau respons Gemini melebihi waktu tunggu.', {
        cause: { code: 'ETIMEDOUT' },
      });
      req.destroy(error);
    }, timeoutMs);
    timeout.unref();
    req.on('close', () => clearTimeout(timeout));
    req.end(body);
  });
}
