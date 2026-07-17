import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNSUBSCRIBE_TOKEN_VERSION = "v1";

export const NEWSLETTER_SEND_LOCK_SECONDS = 30 * 60;

export type NewsletterMode = "test" | "send";

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
	return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function formatIssueNumber(
	issueNumber: string | number,
): { formatted: string; numeric: number } | null {
	const raw = String(issueNumber).trim();

	if (!/^\d{1,3}$/.test(raw)) {
		return null;
	}

	const numeric = Number.parseInt(raw, 10);
	if (!Number.isInteger(numeric) || numeric < 1 || numeric > 999) {
		return null;
	}

	return {
		formatted: String(numeric).padStart(3, "0"),
		numeric,
	};
}

export function getIssueDate(issueNumber: number): string {
	const startDate = new Date(2025, 11, 1);
	const targetDate = new Date(startDate);
	targetDate.setMonth(startDate.getMonth() + issueNumber - 1);

	const month = new Intl.DateTimeFormat("en", { month: "short" }).format(
		targetDate,
	);
	const year = targetDate.getFullYear().toString().slice(-2);
	return `${month} ${year}'`;
}

export function normalizeSiteUrl(siteUrl: string): string {
	return siteUrl.trim().replace(/\/+$/, "");
}

export function hashEmail(email: string): string {
	return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

export function maskEmail(email: string): string {
	const normalized = normalizeEmail(email);
	const atIndex = normalized.lastIndexOf("@");

	if (atIndex <= 0) {
		return "your email address";
	}

	const local = normalized.slice(0, atIndex);
	const domain = normalized.slice(atIndex + 1);
	const visibleLocal = local.slice(0, Math.min(2, local.length));
	return `${visibleLocal}${"*".repeat(
		Math.max(1, Math.min(5, local.length - visibleLocal.length)),
	)}@${domain}`;
}

export function createUnsubscribeToken(email: string, secret: string): string {
	const normalized = normalizeEmail(email);

	if (!isValidEmail(normalized)) {
		throw new Error("Cannot create an unsubscribe token for an invalid email");
	}

	if (secret.length < 32) {
		throw new Error(
			"Newsletter unsubscribe secret must be at least 32 characters",
		);
	}

	const payload = Buffer.from(normalized, "utf8").toString("base64url");
	const signature = createHmac("sha256", secret)
		.update(`${UNSUBSCRIBE_TOKEN_VERSION}.${payload}`)
		.digest("base64url");

	return `${UNSUBSCRIBE_TOKEN_VERSION}.${payload}.${signature}`;
}

export function verifyUnsubscribeToken(
	token: string,
	secret: string,
): string | null {
	if (!token || secret.length < 32) {
		return null;
	}

	const parts = token.split(".");
	if (parts.length !== 3) {
		return null;
	}

	const [version, payload, signature] = parts;
	if (version !== UNSUBSCRIBE_TOKEN_VERSION || !payload || !signature) {
		return null;
	}

	const expectedSignature = createHmac("sha256", secret)
		.update(`${version}.${payload}`)
		.digest();

	let suppliedSignature: Buffer;
	try {
		suppliedSignature = Buffer.from(signature, "base64url");
	} catch {
		return null;
	}

	if (
		suppliedSignature.length !== expectedSignature.length ||
		!timingSafeEqual(
			Uint8Array.from(suppliedSignature),
			Uint8Array.from(expectedSignature),
		)
	) {
		return null;
	}

	let email: string;
	try {
		email = normalizeEmail(Buffer.from(payload, "base64url").toString("utf8"));
	} catch {
		return null;
	}

	return isValidEmail(email) ? email : null;
}

export function secretsMatch(
	supplied: string | null | undefined,
	expected: string | null | undefined,
): boolean {
	if (!supplied || !expected) {
		return false;
	}

	const suppliedBuffer = Buffer.from(supplied);
	const expectedBuffer = Buffer.from(expected);

	return (
		suppliedBuffer.length === expectedBuffer.length &&
		timingSafeEqual(
			Uint8Array.from(suppliedBuffer),
			Uint8Array.from(expectedBuffer),
		)
	);
}

export function getCampaignKeys(issueNumber: string): {
	delivered: string;
	lock: string;
	recipients: string;
} {
	return {
		delivered: `newsletter:delivered:${issueNumber}`,
		lock: `newsletter:send-lock:${issueNumber}`,
		recipients: `newsletter:recipients:${issueNumber}`,
	};
}
