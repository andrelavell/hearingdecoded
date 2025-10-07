// Shared helpers for admin session cookies using Web Crypto HMAC

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  // Prefer Buffer in Node, fallback to btoa in Edge
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (B && typeof B.from === 'function') {
    return B.from(bytes).toString('base64');
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // @ts-ignore btoa is available in Edge runtime
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (B && typeof B.from === 'function') {
    return new Uint8Array(B.from(b64, 'base64'));
  }
  // @ts-ignore atob is available in Edge runtime
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function toBase64UrlFromBytes(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toBase64UrlFromString(s: string): string {
  return toBase64UrlFromBytes(encoder.encode(s));
}

function fromBase64UrlToBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return fromBase64(b64);
}

async function importKeyFromPassword(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signPayload(payload: string, password: string): Promise<string> {
  const key = await importKeyFromPassword(password);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64UrlFromBytes(new Uint8Array(sig));
}

export async function verifySignature(payload: string, signatureB64Url: string, password: string): Promise<boolean> {
  const key = await importKeyFromPassword(password);
  const ok = await crypto.subtle.verify('HMAC', key, fromBase64UrlToBytes(signatureB64Url), encoder.encode(payload));
  return ok;
}

export type AdminToken = {
  v: 1;
  exp: number; // epoch seconds
};

export function encodeToken(t: AdminToken): string {
  return toBase64UrlFromString(JSON.stringify(t));
}

export function decodeToken(b64url: string): AdminToken | null {
  try {
    const bytes = fromBase64UrlToBytes(b64url);
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json);
    if (typeof obj === 'object' && obj && typeof obj.exp === 'number') {
      return { v: 1, exp: obj.exp };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSessionToken(password: string, maxAgeSeconds = 60 * 60 * 24 * 30): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payloadB64 = encodeToken({ v: 1, exp: now + maxAgeSeconds });
  const sig = await signPayload(payloadB64, password);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token: string, password: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const parsed = decodeToken(payloadB64);
  if (!parsed) return false;
  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return false;
  return verifySignature(payloadB64, sig, password);
}
