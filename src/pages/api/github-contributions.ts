import type { APIRoute } from "astro";
import { WORK_PROFILE } from "../../data/github-profile.js";

export const prerender = false;

const PROFILES = {
	work: WORK_PROFILE.githubUsername,
} as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 370;

type ProfileKey = keyof typeof PROFILES;

type ContributionDay = {
	date: string;
	count: number;
	level: number;
};

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Cache-Control":
				status === 200
					? "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400"
					: "no-store",
			"Content-Type": "application/json; charset=utf-8",
		},
	});
}

function dateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

function getRange(url: URL) {
	const today = new Date();
	const defaultFrom = new Date(today);
	defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 119);

	const from = url.searchParams.get("from") || dateKey(defaultFrom);
	const to = url.searchParams.get("to") || dateKey(today);
	if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to) || from > to) {
		return null;
	}

	const fromDate = new Date(`${from}T00:00:00.000Z`);
	const toDate = new Date(`${to}T00:00:00.000Z`);
	const rangeDays = (toDate.getTime() - fromDate.getTime()) / 86_400_000;
	if (!Number.isFinite(rangeDays) || rangeDays > MAX_RANGE_DAYS) return null;

	return { from, to };
}

function parseContributionDays(html: string, from: string, to: string) {
	const days: ContributionDay[] = [];
	const cellPattern =
		/<td\b(?=[^>]*\bdata-date="([^"]+)")(?=[^>]*\bdata-level="([0-4])")[^>]*>[\s\S]*?<\/td>\s*<tool-tip\b[^>]*>([\s\S]*?)<\/tool-tip>/g;

	for (const match of html.matchAll(cellPattern)) {
		const [, date, rawLevel, rawLabel] = match;
		if (!date || date < from || date > to) continue;

		const label = rawLabel.replace(/<[^>]+>/g, "").trim();
		const countMatch = label.match(/([\d,]+) contributions?/i);
		days.push({
			date,
			count: countMatch ? Number(countMatch[1].replaceAll(",", "")) : 0,
			level: Number(rawLevel),
		});
	}

	return days.sort((left, right) => left.date.localeCompare(right.date));
}

export const GET: APIRoute = async ({ url }) => {
	const profile = url.searchParams.get("profile") as ProfileKey | null;
	const username = profile ? PROFILES[profile] : null;
	const range = getRange(url);

	if (!WORK_PROFILE.enabled || !username || !range) {
		return json({ error: "Unknown profile or invalid date range." }, 400);
	}

	const endpoint = new URL(
		`https://github.com/users/${username}/contributions`,
	);
	endpoint.searchParams.set("from", range.from);
	endpoint.searchParams.set("to", range.to);

	try {
		const response = await fetch(endpoint, {
			headers: {
				Accept: "text/html",
				"User-Agent": "rajinkhan.com GitHub activity dashboard",
			},
		});

		if (!response.ok) {
			return json(
				{ error: "GitHub contribution history is unavailable." },
				502,
			);
		}

		const days = parseContributionDays(
			await response.text(),
			range.from,
			range.to,
		);
		if (!days.length) {
			return json(
				{ error: "GitHub returned an empty contribution calendar." },
				502,
			);
		}

		return json({
			username,
			from: range.from,
			to: range.to,
			totalCount: days.reduce((total, day) => total + day.count, 0),
			days,
			fetchedAt: Date.now(),
		});
	} catch {
		return json({ error: "GitHub contribution history is unavailable." }, 502);
	}
};
