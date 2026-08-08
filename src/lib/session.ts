// 会话令牌：HMAC-SHA256 签名，防伪造。
//
// 设计约束：
// - 不依赖 Node 专属模块（如 `crypto` 的 createHmac）、不使用 `Buffer`，
//   以便同一份代码既能在 Next.js 路由（Node 运行时）运行，
//   也能被自定义 server（tsup 打包进 dist/server.js）使用。
// - 仅使用 Web Crypto（`crypto.subtle`）、`btoa`/`atob`、`TextEncoder/Decoder`，
//   这些在 Node 18+ 与 Edge 运行时均为全局可用。

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length > 0) return s;
  if (process.env.NODE_ENV === 'production') {
    // 生产环境必须配置，否则任何人都可能用默认密钥伪造会话。
    throw new Error('SESSION_SECRET 未设置：生产环境必须在环境变量中配置 SESSION_SECRET');
  }
  console.warn(
    '[session] 警告：SESSION_SECRET 未设置，使用不安全的开发默认密钥。生产环境请通过环境变量配置 SESSION_SECRET。',
  );
  return 'dev-insecure-secret-change-me';
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(encoder.encode(getSecret())),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** 将 Uint8Array 转为独立的 ArrayBuffer，避免 TS 5.x+ 对 Uint8Array<ArrayBufferLike> 与 BufferSource 的泛型冲突。 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(0);
}

export interface SessionData {
  id: number;
  username: string;
  displayName: string;
  role: string;
  exp: number;
}

/** 签发签名会话令牌，格式：<base64url(payload)>.<base64url(hmac)> */
export async function signSession(data: SessionData): Promise<string> {
  const payload = bytesToB64url(encoder.encode(JSON.stringify(data)));
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, toArrayBuffer(encoder.encode(payload)));
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** 校验签名与会话有效期；失败（含伪造、过期）返回 null */
export async function verifySession(token: string | undefined | null): Promise<SessionData | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  try {
    const key = await getKey();
    const ok = await crypto.subtle.verify('HMAC', key, toArrayBuffer(b64urlToBytes(sig)), toArrayBuffer(encoder.encode(payload)));
    if (!ok) return null;
    const data = JSON.parse(decoder.decode(b64urlToBytes(payload))) as SessionData;
    if (typeof data.exp === 'number' && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** 解析 Cookie 头为键值对 */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}
