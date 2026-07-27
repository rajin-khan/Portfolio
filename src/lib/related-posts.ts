import type { CollectionEntry } from "astro:content";

type PostEntry = CollectionEntry<"post">;

export type RelatedPost = {
	slug: string;
	title: string;
	description: string;
	image?: string;
	tags: string[];
	dateLabel: string;
	dateIso: string;
	timestamp: number;
};

function toRelated(post: PostEntry): RelatedPost {
	const date = new Date(post.data.date);
	return {
		slug: post.slug,
		title: post.data.title,
		description: post.data.description,
		image: post.data.image,
		tags: post.data.tags ?? [],
		dateLabel: date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}),
		dateIso: date.toISOString(),
		timestamp: date.getTime(),
	};
}

/** Pick one random post that isn't the current one. */
export function getRelatedPosts(
	current: PostEntry,
	all: PostEntry[],
	limit = 1,
): RelatedPost[] {
	const others = all.filter((post) => post.slug !== current.slug);
	if (others.length === 0) return [];

	const shuffled = [...others].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.max(1, limit)).map(toRelated);
}
