const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_KEY_LENGTH_BITS = 256;
const PBKDF2_HASH = "SHA-256";
const SALT_BYTES = 16;

function getCrypto() {
  const maybeCrypto = globalThis?.crypto;
  return maybeCrypto?.subtle ? maybeCrypto : null;
}

function bytesToBase64(bytes) {
  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(bytes).toString("base64");
  }
  const ascii = Array.from(bytes, (value) => String.fromCharCode(value)).join("");
  return btoa(ascii);
}

function base64ToBytes(value) {
  if (typeof globalThis.Buffer !== "undefined") {
    return new Uint8Array(globalThis.Buffer.from(value, "base64"));
  }
  const ascii = atob(value);
  return Uint8Array.from(ascii, (char) => char.charCodeAt(0));
}

function timingSafeEqualText(left, right) {
  if (left.length !== right.length) return false;
  let delta = 0;
  for (let index = 0; index < left.length; index += 1) {
    delta |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return delta === 0;
}

export function hashPinLegacy(pin) {
  const text = String(pin ?? "");
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function isLegacyPinHash(value) {
  return typeof value === "string" && /^[0-9a-f]{8}$/i.test(value);
}

async function derivePbkdf2(pin, salt, iterations) {
  const cryptoApi = getCrypto();
  if (!cryptoApi) return null;
  const keyMaterial = await cryptoApi.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(pin ?? "")),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH_BITS
  );
  return bytesToBase64(new Uint8Array(bits));
}

export async function hashPin(pin) {
  const cryptoApi = getCrypto();
  if (!cryptoApi) return hashPinLegacy(pin);
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePbkdf2(pin, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${hash}`;
}

export async function verifyPin(pin, storedHash) {
  const raw = String(storedHash ?? "");
  if (!raw) return false;

  if (!raw.startsWith(`${PBKDF2_PREFIX}$`)) {
    return timingSafeEqualText(hashPinLegacy(pin), raw);
  }

  const [, iterationText, saltBase64, expectedHash] = raw.split("$");
  const iterations = Number.parseInt(iterationText, 10);
  if (!Number.isFinite(iterations) || iterations <= 0 || !saltBase64 || !expectedHash) return false;
  const derived = await derivePbkdf2(pin, base64ToBytes(saltBase64), iterations);
  if (!derived) return false;
  return timingSafeEqualText(derived, expectedHash);
}
