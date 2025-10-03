# TOTP-JS

A simple and lightweight TOTP (Time-based One-Time Password) library implemented in TypeScript.

This library provides secure generation and verification of TOTP codes for two-factor authentication (2FA).

## Features

- Generate and verify TOTP codes
- Support for multiple hash algorithms (SHA-1, SHA-256, SHA-512)
- Generate Base32 secrets
- Create QR code URIs for authenticator apps
- Zero dependencies
- Fully typed with TypeScript

## Usage

### 1. Download library

```bash
npm i --save @rabbit-company/totp
```

### 2. Import library

```js
import { generateTOTP, verifyTOTP, generateTOTPSecret, generateTOTPURI } from "@rabbit-company/totp";
```

### 3. Generate TOTP Secret

```js
// Generate a random Base32 secret (32 characters by default)
const secret = generateTOTPSecret();

// Generate a 16 character secret
const shortSecret = generateTOTPSecret(16);
```

### 4. Generate TOTP Code

```js
/*

  Parameters:
  1. secret (String) - Base32 encoded secret
  2. options (Object) <optional>
     - timeStep (Number) <30> - Time step in seconds
     - digits (Number) <6> - Length of the OTP
     - timestamp (Number) <Date.now()> - Current timestamp
     - algorithm (String) <"SHA-1"> - Hash algorithm ("SHA-1", "SHA-256", or "SHA-512")

*/

// Generate a 6-digit TOTP code using default settings
const code = await generateTOTP(secret);

// Generate an 8-digit TOTP code
const code8 = await generateTOTP(secret, { digits: 8 });

// Generate a TOTP code with SHA-256
const codeSHA256 = await generateTOTP(secret, { algorithm: "SHA-256" });
```

### 5. Verify TOTP Code

```js
/*

  Parameters:
  1. token (String) - The TOTP code to verify
  2. secret (String) - Base32 encoded secret
  3. options (Object) <optional>
     - window (Number) <1> - Number of time steps in each direction to allow
     - timeStep (Number) <30> - Time step in seconds
     - digits (Number) <6> - Length of the OTP
     - timestamp (Number) <Date.now()> - Current timestamp
     - algorithm (String) <"SHA-1"> - Hash algorithm

*/

// Verify a TOTP code
const isValid = await verifyTOTP("123456", secret);

// Verify with a larger time window (allows ±2 time steps)
const isValidWindow = await verifyTOTP("123456", secret, { window: 2 });
```

### 6. Generate QR Code URI

```js
/*

  Parameters:
  1. options (Object)
     - accountName (String) - User's account name
     - issuer (String) - Service/Company name
     - secret (String) - Base32 encoded secret
     - digits (Number) <6> - Length of the OTP
     - period (Number) <30> - Time step in seconds
     - algorithm (String) <"SHA-1"> - Hash algorithm

*/

// Generate a URI for QR code generation
const uri = generateTOTPURI({
	accountName: "info@rabbit-company.com",
	issuer: "Rabbit Company",
	secret: secret,
	digits: 6,
	period: 30,
	algorithm: "SHA-1",
});

// Output: otpauth://totp/Rabbit%20Company%3Ainfo%40rabbit-company.com?secret=ZP7SHYXX6MLPFYUQAA5RDHRSHJCYOQR5&issuer=Rabbit+Company&algorithm=SHA1&digits=6&period=30
```

## Full Example

```js
import { generateTOTPSecret, generateTOTP, verifyTOTP, generateTOTPURI } from "@rabbit-company/totp";

// 1. Generate a secret for the user
const secret = generateTOTPSecret();

// 2. Create a QR code URI
const uri = generateTOTPURI({
	accountName: "info@rabbit-company.com",
	issuer: "Rabbit Company",
	secret: secret,
});

// 3. User scans QR code with their authenticator app

// 4. Generate current TOTP code (server-side)
const serverCode = await generateTOTP(secret);
console.log("Current code:", serverCode);

// 5. Verify user-provided code
const userCode = "123456"; // Code from user's authenticator app
const isValid = await verifyTOTP(userCode, secret);
console.log("Code is valid:", isValid);
```
