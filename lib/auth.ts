function toBase64(bytes: Uint8Array) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function fromBase64(value: string) {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index);
  return bytes;
}

export async function hashSecret(secret: string, saltValue?: string) {
  const salt = saltValue ? fromBase64(saltValue) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return { salt: saltValue ?? toBase64(salt), hash: toBase64(new Uint8Array(bits)) };
}

export async function verifySecret(secret: string, salt: string, hash: string) {
  const next = await hashSecret(secret, salt);
  return next.hash === hash;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
