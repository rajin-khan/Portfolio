import type { Redis } from "@upstash/redis";
import type { APIRoute } from "astro";
import {
	createUnsubscribeToken,
	isValidEmail,
	maskEmail,
	normalizeEmail,
	verifyUnsubscribeToken,
} from "../../lib/newsletter";

export const prerender = false;

let redisInstance: Redis | null = null;

function getUnsubscribeSecret(): string {
	return (
		import.meta.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
		process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
		""
	);
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
			console.error("Newsletter unsubscribe is missing Redis REST credentials");
			return null;
		}

		redisInstance = new Redis({ url: redisUrl, token: redisToken });
		return redisInstance;
	} catch (error) {
		console.error(
			"Could not initialize Redis for newsletter unsubscribe",
			error,
		);
		return null;
	}
}

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(character) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#039;",
			})[character] || character,
	);
}

function pageResponse(
	title: string,
	message: string,
	options: {
		formToken?: string;
		status?: number;
	} = {},
): Response {
	const { formToken, status = 200 } = options;
	const form = formToken
		? `
      <form method="post" action="/api/unsubscribe">
        <input type="hidden" name="token" value="${escapeHtml(formToken)}" />
        <button type="submit">Unsubscribe</button>
        <a href="/">Keep me subscribed</a>
      </form>
    `
		: '<a class="home-link" href="/">Return home</a>';

	return new Response(
		`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${escapeHtml(title)} | Curated.</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background: #0a0a0a;
        color: #f5f5f5;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(100%, 30rem);
        padding: 2rem;
        border: 1px solid #292929;
        border-radius: 8px;
        background: #101010;
      }
      .brand {
        margin: 0 0 2rem;
        color: #a3a3a3;
        font-family: Georgia, serif;
        font-size: 1rem;
        font-style: italic;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: 1.5rem;
        letter-spacing: 0;
      }
      p {
        margin: 0;
        color: #a3a3a3;
        font-size: 0.95rem;
        line-height: 1.65;
      }
      form {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1.75rem;
      }
      button, a {
        min-height: 2.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.65rem 1rem;
        border-radius: 6px;
        font: inherit;
        text-decoration: none;
      }
      button {
        border: 1px solid #f5f5f5;
        background: #f5f5f5;
        color: #0a0a0a;
        cursor: pointer;
      }
      a {
        border: 1px solid #303030;
        color: #d4d4d4;
      }
      .home-link { margin-top: 1.75rem; }
      button:focus-visible, a:focus-visible {
        outline: 2px solid #f5f5f5;
        outline-offset: 3px;
      }
      @media (max-width: 30rem) {
        form { align-items: stretch; flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">curated.</p>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      ${form}
    </main>
  </body>
</html>`,
		{
			status,
			headers: {
				"Cache-Control": "no-store",
				"Content-Type": "text/html; charset=utf-8",
				"X-Robots-Tag": "noindex, nofollow, noarchive",
			},
		},
	);
}

function resolveGetToken(
	url: URL,
	secret: string,
): {
	email: string;
	token: string;
} | null {
	const token = url.searchParams.get("token");
	if (token) {
		const email = verifyUnsubscribeToken(token, secret);
		return email ? { email, token } : null;
	}

	// Preserve confirmation for links from older issues without allowing GET
	// requests or email scanners to mutate the subscriber set.
	const legacyEmail = url.searchParams.get("email");
	if (!legacyEmail) {
		return null;
	}

	const email = normalizeEmail(legacyEmail);
	if (!isValidEmail(email)) {
		return null;
	}

	return {
		email,
		token: createUnsubscribeToken(email, secret),
	};
}

async function getPostedToken(
	request: Request,
	url: URL,
): Promise<string | null> {
	const queryToken = url.searchParams.get("token");
	if (queryToken) {
		return queryToken;
	}

	const contentType = request.headers.get("content-type") || "";
	if (contentType.includes("application/json")) {
		const body = (await request.json()) as { token?: unknown };
		return typeof body.token === "string" ? body.token : null;
	}

	const formData = await request.formData();
	const token = formData.get("token");
	return typeof token === "string" ? token : null;
}

export const GET: APIRoute = async ({ url }) => {
	const secret = getUnsubscribeSecret();
	if (secret.length < 32) {
		console.error("NEWSLETTER_UNSUBSCRIBE_SECRET is missing or too short");
		return pageResponse(
			"Temporarily unavailable",
			"The unsubscribe service is not configured yet. Please try again shortly.",
			{ status: 503 },
		);
	}

	const resolved = resolveGetToken(url, secret);
	if (!resolved) {
		return pageResponse(
			"Invalid unsubscribe link",
			"This link is incomplete or no longer valid.",
			{ status: 400 },
		);
	}

	return pageResponse(
		"Leave Curated?",
		`Confirm that you want to unsubscribe ${maskEmail(
			resolved.email,
		)}. No changes have been made yet.`,
		{ formToken: resolved.token },
	);
};

export const POST: APIRoute = async ({ request, url }) => {
	try {
		const contentLength = Number(request.headers.get("content-length") || 0);
		if (contentLength > 8192) {
			return pageResponse(
				"Request too large",
				"The unsubscribe request could not be processed.",
				{ status: 413 },
			);
		}

		const secret = getUnsubscribeSecret();
		if (secret.length < 32) {
			console.error("NEWSLETTER_UNSUBSCRIBE_SECRET is missing or too short");
			return pageResponse(
				"Temporarily unavailable",
				"The unsubscribe service is not configured yet. Please try again shortly.",
				{ status: 503 },
			);
		}

		const token = await getPostedToken(request, url);
		const email = token ? verifyUnsubscribeToken(token, secret) : null;
		if (!email) {
			return pageResponse(
				"Invalid unsubscribe link",
				"This link is incomplete or no longer valid.",
				{ status: 400 },
			);
		}

		const redis = await getRedis();
		if (!redis) {
			return pageResponse(
				"Temporarily unavailable",
				"The unsubscribe service could not be reached. Please try again shortly.",
				{ status: 503 },
			);
		}

		await redis.srem("newsletter:subscribers", email);

		return pageResponse(
			"You are unsubscribed",
			"You will no longer receive new issues of Curated. You can subscribe again from the homepage at any time.",
		);
	} catch (error) {
		console.error("Could not unsubscribe newsletter recipient", error);
		return pageResponse(
			"Something went wrong",
			"The unsubscribe request could not be completed. Please try again.",
			{ status: 500 },
		);
	}
};
