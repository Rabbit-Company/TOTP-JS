// src/totp.ts
function toUint8Array(num) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(num));
  return new Uint8Array(buffer);
}
function base32Decode(input) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  const output = [];
  input = input.replace(/=+$/, "").toUpperCase();
  for (const char of input) {
    const val = alphabet.indexOf(char);
    if (val === -1)
      throw new Error("Invalid Base32 character in secret");
    bits += val.toString(2).padStart(5, "0");
  }
  for (let i = 0;i + 8 <= bits.length; i += 8) {
    output.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(output);
}
function generateTOTPSecret(length = 32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const randomValues = new Uint8Array(length);
  globalThis.crypto.getRandomValues(randomValues);
  for (let i = 0;i < length; i++) {
    secret += alphabet[randomValues[i] % alphabet.length];
  }
  return secret;
}
async function hotp(key, counter, options = {}) {
  const { digits = 6, algorithm = "SHA-1" } = options;
  const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: algorithm }, false, ["sign"]);
  const hmac = new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", cryptoKey, toUint8Array(counter)));
  const offset = hmac[hmac.length - 1] & 15;
  const binary = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
  const code = (binary % 10 ** digits).toString();
  return code.padStart(digits, "0");
}
async function generateTOTP(secret, options = {}) {
  const { timeStep = 30, digits = 6, timestamp = Date.now(), algorithm = "SHA-1" } = options;
  const decodedSecret = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / timeStep);
  return hotp(decodedSecret, counter, { digits, algorithm });
}
async function verifyTOTP(token, secret, options = {}) {
  const { window = 1, timeStep = 30, digits = 6, timestamp = Date.now(), algorithm = "SHA-1" } = options;
  const decodedSecret = base32Decode(secret);
  const counter = Math.floor(timestamp / 1000 / timeStep);
  for (let errorWindow = -window;errorWindow <= window; errorWindow++) {
    const otp = await hotp(decodedSecret, counter + errorWindow, { digits, algorithm });
    if (otp === token)
      return true;
  }
  return false;
}
function generateTOTPURI(options) {
  const { accountName, issuer, secret, digits = 6, period = 30, algorithm = "SHA-1" } = options;
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: algorithm.replace(/-/g, ""),
    digits: digits.toString(),
    period: period.toString()
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
export {
  verifyTOTP,
  generateTOTPURI,
  generateTOTPSecret,
  generateTOTP
};
