import { randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";
import type { APIRoute } from "astro";
import type { Resend } from "resend";
import {
	NEWSLETTER_SEND_LOCK_SECONDS,
	type NewsletterMode,
	createUnsubscribeToken,
	formatIssueNumber,
	getCampaignKeys,
	getIssueDate,
	hashEmail,
	isValidEmail,
	maskEmail,
	normalizeEmail,
	normalizeSiteUrl,
	secretsMatch,
} from "../../lib/newsletter";

export const prerender = false;

let redisInstance: Redis | null = null;
let resendInstance: Resend | null = null;

type SendRequestBody = {
	issueNumber?: string | number;
	mode?: NewsletterMode;
};

type NewsletterConfig = {
	fromEmail: string;
	siteUrl: string;
	testEmail: string;
	unsubscribeSecret: string;
};

function jsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"Cache-Control": "no-store",
			"Content-Type": "application/json",
		},
	});
}

async function getRedis(): Promise<Redis | null> {
	if (redisInstance) {
		return redisInstance;
	}

	try {
		const { Redis } = await import("@upstash/redis");
		const redisUrl =
			import.meta.env.KV_REST_API_URL ||
			import.meta.env.UPSTASH_REDIS_REST_URL ||
			process.env.KV_REST_API_URL ||
			process.env.UPSTASH_REDIS_REST_URL;
		const redisToken =
			import.meta.env.KV_REST_API_TOKEN ||
			import.meta.env.UPSTASH_REDIS_REST_TOKEN ||
			process.env.KV_REST_API_TOKEN ||
			process.env.UPSTASH_REDIS_REST_TOKEN;

		if (!redisUrl || !redisToken || !redisUrl.startsWith("https://")) {
			console.error("Newsletter sending is missing Redis REST credentials");
			return null;
		}

		redisInstance = new Redis({ url: redisUrl, token: redisToken });
		return redisInstance;
	} catch (error) {
		console.error("Could not initialize Redis for newsletter sending", error);
		return null;
	}
}

async function getResend(): Promise<Resend | null> {
	if (resendInstance) {
		return resendInstance;
	}

	try {
		const { Resend } = await import("resend");
		const apiKey =
			import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY || "";

		if (!apiKey) {
			console.error("Newsletter sending is missing RESEND_API_KEY");
			return null;
		}

		resendInstance = new Resend(apiKey);
		return resendInstance;
	} catch (error) {
		console.error("Could not initialize Resend", error);
		return null;
	}
}

function getNewsletterConfig(mode: NewsletterMode): NewsletterConfig | null {
	const fromEmail = normalizeEmail(
		import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "",
	);
	const siteUrl = normalizeSiteUrl(
		import.meta.env.SITE_URL || process.env.SITE_URL || "https://rajinkhan.com",
	);
	const testEmail = normalizeEmail(
		import.meta.env.NEWSLETTER_TEST_EMAIL ||
			process.env.NEWSLETTER_TEST_EMAIL ||
			"",
	);
	const unsubscribeSecret =
		import.meta.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
		process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
		"";

	if (!isValidEmail(fromEmail)) {
		console.error("RESEND_FROM_EMAIL is missing or invalid");
		return null;
	}

	if (unsubscribeSecret.length < 32) {
		console.error("NEWSLETTER_UNSUBSCRIBE_SECRET is missing or too short");
		return null;
	}

	if (mode === "test" && !isValidEmail(testEmail)) {
		console.error("NEWSLETTER_TEST_EMAIL is missing or invalid");
		return null;
	}

	return {
		fromEmail,
		siteUrl,
		testEmail,
		unsubscribeSecret,
	};
}

function getIntroduction(issueNumber: string): string {
	if (issueNumber === "001") {
		return "Welcome to the first issue of curated. I won't be sending you new issues every month, just whenever I find cool enough stuff to share. Hope you enjoy the read (and if you don't, you can unsubscribe anytime).";
	}

	return "A new issue of curated. is here. I only send one when I find enough cool stuff to share. Hope you enjoy the read (and if you don't, you can unsubscribe anytime).";
}

function generateEmailHtml(
	issueNumber: string,
	date: string,
	siteUrl: string,
	unsubscribeUrl: string,
): string {
	const pdfUrl = `${siteUrl}/newsletters/curated-${issueNumber}.pdf`;
	const previewImageUrl = `${siteUrl}/newsletters/curated-${issueNumber}-preview.jpg`;
	const introduction = getIntroduction(issueNumber);

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>curated. #${issueNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
  <link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; overflow: hidden;">
          <tr>
            <td style="background-color: #0a0a0a; padding: 3px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a; border-radius: 21px; overflow: hidden;">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center;">
                    <div style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 32px; font-weight: 500; color: #ffffff; margin: 0 0 8px; letter-spacing: 0;">curated.</div>
                    <div style="font-family: 'Satoshi', sans-serif; font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Issue #${issueNumber} • ${date}</div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">Hey there,</p>

                    <p style="margin: 0 0 30px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">
                      ${introduction}
                    </p>

                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${pdfUrl}" style="display: block; text-decoration: none;">
                            <img
                              src="${previewImageUrl}"
                              alt="curated. Issue ${issueNumber} Preview"
                              style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); display: block; margin: 0 auto;"
                              width="600"
                            />
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${pdfUrl}" style="display: inline-block; padding: 12px 28px; background: #ffffff; border: none; color: #0a0a0a; text-decoration: none; border-radius: 12px; font-weight: 400; font-size: 10px; font-family: 'Satoshi', sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">view newsletter</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 12px; font-size: 11px; color: rgba(255, 255, 255, 0.4); text-align: center; font-family: 'Satoshi', sans-serif;">
                      You're receiving this because you subscribed to curated, and have really good taste.
                    </p>
                    <p style="margin: 0; font-size: 11px; text-align: center; font-family: 'Satoshi', sans-serif;">
                      <a href="${unsubscribeUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: underline;">unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table role="presentation" style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3); font-family: 'Satoshi', sans-serif;">
                by <a href="${siteUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: none;">rajin khan</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateEmailText(
	issueNumber: string,
	date: string,
	siteUrl: string,
	unsubscribeUrl: string,
): string {
	return [
		`curated. Issue #${issueNumber} • ${date}`,
		"",
		"Hey there,",
		"",
		getIntroduction(issueNumber),
		"",
		`Read the issue: ${siteUrl}/newsletters/curated-${issueNumber}.pdf`,
		"",
		`Unsubscribe: ${unsubscribeUrl}`,
		"",
		"by rajin khan",
	].join("\n");
}

function getIssueUrls(
	issueNumber: string,
	siteUrl: string,
): { pdf: string; preview: string } {
	return {
		pdf: `${siteUrl}/newsletters/curated-${issueNumber}.pdf`,
		preview: `${siteUrl}/newsletters/curated-${issueNumber}-preview.jpg`,
	};
}

async function verifyIssueAssets(
	issueNumber: string,
	siteUrl: string,
): Promise<string[]> {
	const urls = getIssueUrls(issueNumber, siteUrl);
	const missing: string[] = [];

	await Promise.all(
		Object.entries(urls).map(async ([label, assetUrl]) => {
			try {
				const response = await fetch(assetUrl, {
					method: "HEAD",
					redirect: "follow",
					signal: AbortSignal.timeout(10_000),
				});

				if (!response.ok) {
					missing.push(`${label} (${response.status})`);
				}
			} catch {
				missing.push(`${label} (unreachable)`);
			}
		}),
	);

	return missing;
}

async function sendEmail(
	resend: Resend,
	input: {
		config: NewsletterConfig;
		date: string;
		idempotencyKey?: string;
		issueNumber: string;
		recipient: string;
		test: boolean;
	},
) {
	const token = createUnsubscribeToken(
		input.recipient,
		input.config.unsubscribeSecret,
	);
	const unsubscribeUrl = `${
		input.config.siteUrl
	}/api/unsubscribe?token=${encodeURIComponent(token)}`;
	const payload = {
		from: `Curated. <${input.config.fromEmail}>`,
		to: input.recipient,
		subject: `${input.test ? "[TEST] " : ""}Issue ${input.issueNumber}`,
		html: generateEmailHtml(
			input.issueNumber,
			input.date,
			input.config.siteUrl,
			unsubscribeUrl,
		),
		text: generateEmailText(
			input.issueNumber,
			input.date,
			input.config.siteUrl,
			unsubscribeUrl,
		),
		headers: {
			"List-Unsubscribe": `<${unsubscribeUrl}>`,
			"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
		},
	};

	return input.idempotencyKey
		? resend.emails.send(payload, { idempotencyKey: input.idempotencyKey })
		: resend.emails.send(payload);
}

async function releaseCampaignLock(
	redis: Redis,
	lockKey: string,
	lockValue: string,
): Promise<void> {
	try {
		await redis.eval(
			'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
			[lockKey],
			[lockValue],
		);
	} catch (error) {
		console.error("Could not release newsletter campaign lock", error);
	}
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const contentLength = Number(request.headers.get("content-length") || 0);
		if (contentLength > 4096) {
			return jsonResponse({ error: "Request body is too large" }, 413);
		}

		const authHeader = request.headers.get("authorization");
		const suppliedSecret = authHeader?.toLowerCase().startsWith("bearer ")
			? authHeader.slice(7).trim()
			: authHeader;
		const expectedSecret =
			import.meta.env.ADMIN_SECRET || process.env.ADMIN_SECRET || "";

		if (!secretsMatch(suppliedSecret, expectedSecret)) {
			return jsonResponse({ error: "Unauthorized" }, 401);
		}

		let body: SendRequestBody;
		try {
			body = (await request.json()) as SendRequestBody;
		} catch {
			return jsonResponse({ error: "Invalid JSON in request body" }, 400);
		}

		if (body.mode !== "test" && body.mode !== "send") {
			return jsonResponse(
				{ error: 'Mode must be either "test" or "send"' },
				400,
			);
		}

		if (
			typeof body.issueNumber !== "string" &&
			typeof body.issueNumber !== "number"
		) {
			return jsonResponse({ error: "Issue number is required" }, 400);
		}

		const issue = formatIssueNumber(body.issueNumber);
		if (!issue) {
			return jsonResponse(
				{ error: "Issue number must be between 1 and 999" },
				400,
			);
		}

		const config = getNewsletterConfig(body.mode);
		if (!config) {
			return jsonResponse(
				{ error: "Newsletter environment is incomplete or invalid" },
				503,
			);
		}

		const missingAssets = await verifyIssueAssets(
			issue.formatted,
			config.siteUrl,
		);
		if (missingAssets.length > 0) {
			return jsonResponse(
				{
					error: "Newsletter files are not available on the deployed site",
					missing: missingAssets,
				},
				409,
			);
		}

		const resend = await getResend();
		if (!resend) {
			return jsonResponse({ error: "Resend is not configured" }, 503);
		}

		const date = getIssueDate(issue.numeric);

		if (body.mode === "test") {
			const result = await sendEmail(resend, {
				config,
				date,
				issueNumber: issue.formatted,
				recipient: config.testEmail,
				test: true,
			});

			if (result.error) {
				return jsonResponse(
					{
						error: "Test email could not be sent",
						details: result.error.message,
					},
					502,
				);
			}

			return jsonResponse({
				success: true,
				mode: "test",
				issueNumber: issue.formatted,
				recipient: maskEmail(config.testEmail),
				resendId: result.data?.id,
			});
		}

		const redis = await getRedis();
		if (!redis) {
			return jsonResponse({ error: "Redis is not configured" }, 503);
		}

		const keys = getCampaignKeys(issue.formatted);
		const lockValue = randomUUID();
		const lockAcquired = await redis.set(keys.lock, lockValue, {
			ex: NEWSLETTER_SEND_LOCK_SECONDS,
			nx: true,
		});

		if (lockAcquired !== "OK") {
			return jsonResponse(
				{
					error: "This newsletter issue is already being sent",
					issueNumber: issue.formatted,
				},
				409,
			);
		}

		try {
			const subscribers = await redis.smembers<string[]>(
				"newsletter:subscribers",
			);
			if (subscribers.length === 0) {
				return jsonResponse({
					success: true,
					mode: "send",
					issueNumber: issue.formatted,
					total: 0,
					sent: 0,
					skipped: 0,
					excluded: 0,
					failed: 0,
					message: "No subscribers found",
				});
			}

			const validSubscribers = subscribers
				.map((subscriber) => normalizeEmail(String(subscriber)))
				.filter(isValidEmail)
				.map((email) => ({
					email,
					hash: hashEmail(email),
				}));
			const invalidSubscriberCount =
				subscribers.length - validSubscribers.length;

			let campaignTotal = await redis.scard(keys.recipients);
			if (campaignTotal === 0 && validSubscribers.length > 0) {
				const recipientHashes = validSubscribers.map(
					(subscriber) => subscriber.hash,
				);
				await redis.sadd(
					keys.recipients,
					recipientHashes[0],
					...recipientHashes.slice(1),
				);
				campaignTotal = await redis.scard(keys.recipients);
			}

			let sent = 0;
			let skipped = 0;
			let excluded = 0;
			let failed = invalidSubscriberCount;
			const errors: string[] = [];
			if (invalidSubscriberCount > 0) {
				errors.push(
					`${invalidSubscriberCount} invalid subscriber ${
						invalidSubscriberCount === 1 ? "entry was" : "entries were"
					} skipped`,
				);
			}

			for (const subscriber of validSubscribers) {
				const includedInCampaign = await redis.sismember(
					keys.recipients,
					subscriber.hash,
				);
				if (!includedInCampaign) {
					excluded++;
					continue;
				}

				const alreadyDelivered = await redis.sismember(
					keys.delivered,
					subscriber.hash,
				);
				if (alreadyDelivered) {
					skipped++;
					continue;
				}

				try {
					const result = await sendEmail(resend, {
						config,
						date,
						idempotencyKey: `curated/${issue.formatted}/${subscriber.hash}`,
						issueNumber: issue.formatted,
						recipient: subscriber.email,
						test: false,
					});

					if (result.error) {
						failed++;
						errors.push(
							`${maskEmail(subscriber.email)}: ${
								result.error.message || "Resend rejected the email"
							}`,
						);
						continue;
					}

					await redis.sadd(keys.delivered, subscriber.hash);
					sent++;
				} catch (error) {
					failed++;
					errors.push(
						`${maskEmail(subscriber.email)}: ${
							error instanceof Error ? error.message : "Unknown delivery error"
						}`,
					);
				}
			}

			return jsonResponse({
				success: failed === 0,
				mode: "send",
				issueNumber: issue.formatted,
				date,
				total: campaignTotal,
				sent,
				skipped,
				excluded,
				failed,
				...(errors.length > 0 && { errors: errors.slice(0, 10) }),
			});
		} finally {
			await releaseCampaignLock(redis, keys.lock, lockValue);
		}
	} catch (error) {
		console.error("Newsletter request failed", error);
		return jsonResponse(
			{
				error: "Newsletter request failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
};
