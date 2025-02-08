import { defineCollection, z } from "astro:content";

const postCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    slug: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  post: postCollection,
};