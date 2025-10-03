import { expect, test, describe } from "bun:test";
import { generateTOTP, generateTOTPSecret, verifyTOTP, generateTOTPURI } from "../src/totp";

describe("TOTP Library", () => {
	const secret = generateTOTPSecret();

	test("should generate a 6-digit TOTP by default", async () => {
		const code = await generateTOTP(secret);
		expect(code).toBeString();
		expect(code.length).toBe(6);
	});

	test("should verify a valid TOTP (default SHA1)", async () => {
		const code = await generateTOTP(secret);
		const isValid = await verifyTOTP(code, secret);
		expect(isValid).toBe(true);
	});

	test("should reject an invalid TOTP", async () => {
		const isValid = await verifyTOTP("000000", secret);
		expect(isValid).toBe(false);
	});

	test("should allow small time drift (+/- 1 timestep)", async () => {
		const timestamp = Date.now();
		const code = await generateTOTP(secret, { timeStep: 30, digits: 6, timestamp });
		const isValid = await verifyTOTP(code, secret, { window: 1, timeStep: 30, digits: 6, timestamp: timestamp + 15000 });
		expect(isValid).toBe(true);
	});

	test("should fail with big time drift (>1 timestep)", async () => {
		const timestamp = Date.now();
		const code = await generateTOTP(secret, { timeStep: 30, digits: 6, timestamp });
		const isValid = await verifyTOTP(code, secret, { window: 1, timeStep: 30, digits: 6, timestamp: timestamp + 120000 });
		expect(isValid).toBe(false);
	});

	// Test SHA variants
	const algorithms: ("SHA-1" | "SHA-256" | "SHA-512")[] = ["SHA-1", "SHA-256", "SHA-512"];
	for (const algo of algorithms) {
		test(`should generate and verify TOTP using ${algo}`, async () => {
			const timestamp = Date.now();
			const code = await generateTOTP(secret, { algorithm: algo, timestamp });
			expect(code).toBeString();
			expect(code.length).toBe(6);

			const isValid = await verifyTOTP(code, secret, { algorithm: algo, timestamp });
			expect(isValid).toBe(true);
		});
	}

	test("should generate secrets of correct length", () => {
		const secret10 = generateTOTPSecret(10);
		const secret32 = generateTOTPSecret(32);
		expect(secret10.length).toBe(10);
		expect(secret32.length).toBe(32);
	});

	test("should generate correct TOTP URI for QR code", () => {
		const uri = generateTOTPURI({
			accountName: "info@rabbit-company.com",
			issuer: "Rabbit Company",
			secret,
			algorithm: "SHA-256",
			digits: 8,
			period: 60,
		});

		expect(uri).toContain("otpauth://totp/");
		expect(uri).toContain("info%40rabbit-company.com");
		expect(uri).toContain("Rabbit%20Company");
		expect(uri).toContain(`secret=${secret}`);
		expect(uri).toContain("algorithm=SHA256");
		expect(uri).toContain("digits=8");
		expect(uri).toContain("period=60");
	});
});
