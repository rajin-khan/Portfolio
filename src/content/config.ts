import { defineCollection, z } from "astro:content";

const postCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.date(),
		updated: z.date().optional(),
		tags: z.array(z.string()).optional(),
		image: z.string().optional(),
	}),
});

const projectActionSchema = z.object({
	label: z.string().min(1),
	href: z.string().url(),
	primary: z.boolean(),
});

const projectCardItemSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	icon: z.string().optional(),
	emoji: z.string().optional(),
});

const projectSectionSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("prose"),
		title: z.string().min(1),
		paragraphs: z.array(z.string().min(1)).min(1),
		actions: z.array(projectActionSchema).optional(),
	}),
	z.object({
		type: z.literal("features"),
		title: z.string().min(1),
		items: z.array(projectCardItemSchema).min(1),
	}),
	z.object({
		type: z.literal("use-cases"),
		title: z.string().min(1),
		items: z.array(projectCardItemSchema).min(1),
	}),
	z.object({
		type: z.literal("cards"),
		title: z.string().min(1),
		items: z.array(projectCardItemSchema).min(1),
	}),
	z.object({
		type: z.literal("roadmap"),
		title: z.string().min(1),
		items: z
			.array(
				z.object({
					name: z.string().min(1),
					status: z.string().min(1),
				}),
			)
			.min(1),
	}),
	z.object({
		type: z.literal("team"),
		title: z.string().min(1),
		items: z
			.array(
				z.object({
					name: z.string().min(1),
					institution: z.string().min(1),
					github: z.string().url(),
				}),
			)
			.min(1),
	}),
]);

const projectBaseSchema = {
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	order: z.number().int().nonnegative(),
	name: z.string().min(1),
	cardName: z.string().min(1),
	description: z.string().min(1),
	cardDescription: z.string().min(1),
	note: z.string().min(1),
	image: z.object({
		src: z.string().startsWith("/"),
		width: z.number().int().positive(),
		height: z.number().int().positive(),
	}),
	tags: z.array(z.string().min(1)),
	accents: z.object({
		primary: z.string().regex(/^#[\da-f]{6}$/i),
		secondary: z.string().regex(/^#[\da-f]{6}$/i),
		screen: z.string().regex(/^#[\da-f]{6}$/i),
	}),
};

const projectExternalSchema = z.object({
	...projectBaseSchema,
	detail: z.literal(false),
	href: z.string().url(),
});

const projectDetailSchema = z.object({
	...projectBaseSchema,
	detail: z.literal(true),
	href: z.string().regex(/^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*$/),
	heroActions: z.array(projectActionSchema).min(1),
	sections: z.array(projectSectionSchema).min(1),
});

export const projectSchema = z.discriminatedUnion("detail", [
	projectExternalSchema,
	projectDetailSchema,
]);

export type ProjectData = z.infer<typeof projectSchema>;
export type ProjectDetailData = z.infer<typeof projectDetailSchema>;

const projectCollection = defineCollection({
	type: "data",
	schema: projectSchema,
});

export const collections = {
	post: postCollection,
	project: projectCollection,
};
