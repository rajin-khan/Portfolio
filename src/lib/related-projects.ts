import type { ProjectDetailData } from "./projects";

export type RelatedProject = {
	slug: string;
	name: string;
	description: string;
	note: string;
	image: string;
	tags: string[];
};

/** Pick one random detail project that isn't the current one. */
export function getRelatedProject(
	current: ProjectDetailData,
	all: ProjectDetailData[],
): RelatedProject | null {
	const others = all.filter((project) => project.slug !== current.slug);
	if (others.length === 0) return null;

	const pick = others[Math.floor(Math.random() * others.length)];
	return {
		slug: pick.slug,
		name: pick.name,
		description: pick.description,
		note: pick.note,
		image: pick.image.src,
		tags: pick.tags ?? [],
	};
}
