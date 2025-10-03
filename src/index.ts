import { generateTOTPSecret, generateTOTP, generateTOTPURI, verifyTOTP } from "./totp";

const $ = (id: string) => document.getElementById(id);

const secretInput = $("secret")! as HTMLInputElement;
const btnGenerateSecret = $("btn-generate-secret")! as HTMLButtonElement;
const btnCopySecret = $("btn-copy-secret")! as HTMLButtonElement;
const btnGenerateCode = $("btn-generate-code")! as HTMLButtonElement;
const btnRefreshCode = $("btn-refresh-code")! as HTMLButtonElement;
const codeEl = $("code")! as HTMLElement;
const countdown = $("countdown")! as HTMLElement;
const algorithmEl = $("algorithm")! as HTMLSelectElement;
const digitsEl = $("digits")! as HTMLInputElement;
const periodEl = $("period")! as HTMLInputElement;
const tokenInput = $("token")! as HTMLInputElement;
const btnVerify = $("btn-verify")! as HTMLButtonElement;
const verifyResult = $("verify-result")! as HTMLElement;

const accountInput = $("account")! as HTMLInputElement;
const issuerInput = $("issuer")! as HTMLInputElement;
const btnGenerateURI = $("btn-generate-uri")! as HTMLButtonElement;
const otpauthPre = $("otpauth")! as HTMLElement;
const btnOpenQR = $("btn-open-qr")! as HTMLButtonElement;
const qrContainer = $("qr-container")! as HTMLImageElement;

function updateSecretField(value: string) {
	secretInput.value = value;
}

btnGenerateSecret.addEventListener("click", () => {
	const secret = generateTOTPSecret();
	updateSecretField(secret);
});

btnCopySecret.addEventListener("click", async () => {
	try {
		await navigator.clipboard.writeText(secretInput.value);
		btnCopySecret.textContent = "Copied!";
		setTimeout(() => (btnCopySecret.textContent = "Copy"), 1200);
	} catch {
		alert("Copy failed — please copy manually.");
	}
});

async function refreshCode() {
	try {
		const secret = secretInput.value || generateTOTPSecret();
		const algorithm = algorithmEl.value as "SHA-1" | "SHA-256" | "SHA-512";
		const digits = Number(digitsEl.value);
		const period = Number(periodEl.value);
		const code = await generateTOTP(secret, { timeStep: period, digits, algorithm });
		codeEl.textContent = code;
		startCountdown(period);
	} catch (err) {
		codeEl.textContent = "ERR";
		console.error(err);
	}
}

btnGenerateCode.addEventListener("click", async () => {
	if (!secretInput.value) updateSecretField(generateTOTPSecret());
	await refreshCode();
});

btnRefreshCode.addEventListener("click", refreshCode);

async function verifyAction() {
	verifyResult.textContent = "";
	try {
		const token = tokenInput.value.trim();
		const secret = secretInput.value;
		if (!token || !secret) {
			verifyResult.textContent = "Enter both token and secret";
			return;
		}
		const algorithm = algorithmEl.value as "SHA-1" | "SHA-256" | "SHA-512";
		const digits = Number(digitsEl.value);
		const period = Number(periodEl.value);
		const ok = await verifyTOTP(token, secret, { window: 1, timeStep: period, digits, algorithm });
		verifyResult.textContent = ok ? "✅ Valid" : "❌ Invalid";
	} catch (err) {
		verifyResult.textContent = "Error";
		console.error(err);
	}
}

btnVerify.addEventListener("click", verifyAction);

btnGenerateURI.addEventListener("click", () => {
	const account = accountInput.value || "info@rabbit-company.com";
	const issuer = issuerInput.value || "Rabbit Company";
	const secret = secretInput.value || generateTOTPSecret();
	const digits = Number(digitsEl.value);
	const period = Number(periodEl.value);
	const algorithm = algorithmEl.value as "SHA-1" | "SHA-256" | "SHA-512";
	const uri = generateTOTPURI({ accountName: account, issuer, secret, digits, period, algorithm });
	otpauthPre.textContent = uri;
	qrContainer.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(uri)}`;
});

btnOpenQR.addEventListener("click", () => {
	const uri = otpauthPre.textContent;
	if (!uri || uri === "—") {
		alert("Generate URI first");
		return;
	}
	const encoded = encodeURIComponent(uri);
	const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}`;
	window.open(url, "_blank");
});

/* simple countdown of period */
let countdownTimer: any = null;
function startCountdown(period: number) {
	if (countdownTimer) clearInterval(countdownTimer);
	const now = Date.now();
	const current = Math.floor(now / 1000);
	const remaining = period - (current % period);
	function tick() {
		const sec = period - (Math.floor(Date.now() / 1000) % period);
		countdown.textContent = `refresh in ${sec}s`;
		if (sec <= 0) {
			refreshCode();
		}
	}
	tick();
	countdownTimer = setInterval(tick, 1000);
}

/* auto-generate default secret and initial code */
const initialSecret = generateTOTPSecret();
updateSecretField(initialSecret);
refreshCode();
