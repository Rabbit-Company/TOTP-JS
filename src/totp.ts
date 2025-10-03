/**
 * Convert a number to an 8-byte Uint8Array (big-endian).
 * Used for HOTP counter encoding.
 *
 * @param {number} num - The number to convert
 * @returns {Uint8Array} 8-byte representation
 */
function toUint8Array(num: number): BufferSource {
	const buffer = new ArrayBuffer(8);
	const view = new DataView(buffer);
	view.setBigUint64(0, BigInt(num));
	return new Uint8Array(buffer);
}

/**
 * Decode a Base32-encoded string into a Uint8Array.
 *
 * @param {string} input - Base32 encoded secret
 * @returns {Uint8Array} Decoded bytes
 * @throws {Error} If the input contains invalid Base32 characters
 */
function base32Decode(input: string): BufferSource {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let bits = "";
	const output: number[] = [];

	input = input.replace(/=+$/, "").toUpperCase();

	for (const char of input) {
		const val = alphabet.indexOf(char);
		if (val === -1) throw new Error("Invalid Base32 character in secret");
		bits += val.toString(2).padStart(5, "0");
	}

	for (let i = 0; i + 8 <= bits.length; i += 8) {
		output.push(parseInt(bits.substring(i, i + 8), 2));
	}

	return new Uint8Array(output);
}

/**
 * Generate a random Base32 secret for TOTP.
 *
 * @param {number} [length=32] - Length of the secret
 * @returns {string} Base32 secret
 */
export function generateTOTPSecret(length = 32): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let secret = "";
	const randomValues = new Uint8Array(length);
	globalThis.crypto.getRandomValues(randomValues);

	for (let i = 0; i < length; i++) {
		secret += alphabet[randomValues[i]! % alphabet.length];
	}

	return secret;
}

/** HOTP options */
export interface HOTPOptions {
	digits?: number;
	algorithm?: "SHA-1" | "SHA-256" | "SHA-512";
}

/** TOTP options */
export interface TOTPOptions extends HOTPOptions {
	timeStep?: number;
	timestamp?: number;
	window?: number;
}

/** TOTP URI options */
export interface TOTPURIOptions {
	accountName: string;
	issuer: string;
	secret: string;
	digits?: number;
	period?: number;
	algorithm?: "SHA-1" | "SHA-256" | "SHA-512";
}

/**
 * Generate an HMAC-based one-time password (HOTP)
 *
 * @param {BufferSource} key - Raw secret
 * @param {number} counter - Counter (time step)
 * @param {HOTPOptions} [options] - HOTP options
 * @returns {Promise<string>} HOTP code
 */
async function hotp(key: BufferSource, counter: number, options: HOTPOptions = {}): Promise<string> {
	const { digits = 6, algorithm = "SHA-1" } = options;

	const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, { name: "HMAC", hash: algorithm }, false, ["sign"]);

	const hmac = new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", cryptoKey, toUint8Array(counter)));

	const offset = hmac[hmac.length - 1]! & 0x0f;
	const binary = ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff);

	const code = (binary % 10 ** digits).toString();
	return code.padStart(digits, "0");
}

/**
 * Generate a TOTP code (time-based one-time password)
 *
 * @param {string} secret - Base32 encoded secret
 * @param {TOTPOptions} [options] - TOTP options
 * @returns {Promise<string>} TOTP code
 */
export async function generateTOTP(secret: string, options: TOTPOptions = {}): Promise<string> {
	const { timeStep = 30, digits = 6, timestamp = Date.now(), algorithm = "SHA-1" } = options;
	const decodedSecret = base32Decode(secret);
	const counter = Math.floor(timestamp / 1000 / timeStep);
	return hotp(decodedSecret, counter, { digits, algorithm });
}

/**
 * Verify a TOTP code
 *
 * @param {string} token - OTP to verify
 * @param {string} secret - Base32 encoded secret
 * @param {TOTPOptions} [options] - Verification options
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyTOTP(token: string, secret: string, options: TOTPOptions = {}): Promise<boolean> {
	const { window = 1, timeStep = 30, digits = 6, timestamp = Date.now(), algorithm = "SHA-1" } = options;
	const decodedSecret = base32Decode(secret);
	const counter = Math.floor(timestamp / 1000 / timeStep);

	for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
		const otp = await hotp(decodedSecret, counter + errorWindow, { digits, algorithm });
		if (otp === token) return true;
	}

	return false;
}

/**
 * Generate an `otpauth://` URI for TOTP QR code generation
 *
 * @param {TOTPURIOptions} options - Options for TOTP URI
 * @returns {string} TOTP URI for QR code generation
 */
export function generateTOTPURI(options: TOTPURIOptions): string {
	const { accountName, issuer, secret, digits = 6, period = 30, algorithm = "SHA-1" } = options;
	const label = encodeURIComponent(`${issuer}:${accountName}`);
	const params = new URLSearchParams({
		secret,
		issuer,
		algorithm: algorithm.replace(/-/g, ""),
		digits: digits.toString(),
		period: period.toString(),
	});
	return `otpauth://totp/${label}?${params.toString()}`;
}
