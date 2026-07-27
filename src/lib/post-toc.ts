import GithubSlugger from "github-slugger";

export type TocHeading = {
	depth: 2 | 3;
	text: string;
	slug: string;
};

/** Strip common markdown inline markers so slug text matches rehype-slug. */
function cleanHeadingText(raw: string): string {
	return raw
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/[*_`~]+/g, "")
		.replace(/\{#[^}]+\}/g, "")
		.replace(/<\/?[^>]+>/g, "")
		.trim();
}

/**
 * Extract h2/h3 headings from markdown source for TOC.
 * Uses github-slugger so ids match rehype-slug on the rendered HTML.
 */
export function extractPostHeadings(markdown: string): TocHeading[] {
	const slugger = new GithubSlugger();
	const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
	const headings: TocHeading[] = [];

	for (const line of withoutFences.split("\n")) {
		const match = /^(#{2,3})\s+(.+)$/.exec(line.trim());
		if (!match) continue;

		const depth = match[1].length as 2 | 3;
		const text = cleanHeadingText(match[2]);
		if (!text) continue;

		headings.push({
			depth,
			text,
			slug: slugger.slug(text),
		});
	}

	return headings;
}
