/**
 * Generate a random Base32 secret for TOTP.
 *
 * @param {number} [length=32] - Length of the secret
 * @returns {string} Base32 secret
 */
export declare function generateTOTPSecret(length?: number): string;
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
 * Generate a TOTP code (time-based one-time password)
 *
 * @param {string} secret - Base32 encoded secret
 * @param {TOTPOptions} [options] - TOTP options
 * @returns {Promise<string>} TOTP code
 */
export declare function generateTOTP(secret: string, options?: TOTPOptions): Promise<string>;
/**
 * Verify a TOTP code
 *
 * @param {string} token - OTP to verify
 * @param {string} secret - Base32 encoded secret
 * @param {TOTPOptions} [options] - Verification options
 * @returns {Promise<boolean>} True if valid
 */
export declare function verifyTOTP(token: string, secret: string, options?: TOTPOptions): Promise<boolean>;
/**
 * Generate an `otpauth://` URI for TOTP QR code generation
 *
 * @param {TOTPURIOptions} options - Options for TOTP URI
 * @returns {string} TOTP URI for QR code generation
 */
export declare function generateTOTPURI(options: TOTPURIOptions): string;

export {};
