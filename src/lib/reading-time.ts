const WORDS_PER_MINUTE = 220;

/** Strip markdown noise enough for a stable word-count estimate. */
function stripMarkdown(source: string): string {
	return source
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/[#>*_~|-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

export function estimateReadingMinutes(source: string): number {
	const words = stripMarkdown(source).split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(minutes: number): string {
	return `${minutes} min read`;
}
