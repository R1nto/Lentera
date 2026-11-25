import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function getEncryptionKey() {
  const encoded = process.env.APP_ENCRYPTION_KEY;
  if (!encoded) throw new Error('APP_ENCRYPTION_KEY belum dikonfigurasi di server.');

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY harus berupa 32 byte dalam format Base64.');
  }
  return key;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(payload: string) {
  const [version, ivValue, tagValue, encryptedValue] = payload.split(':');
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Format secret terenkripsi tidak dikenali.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
