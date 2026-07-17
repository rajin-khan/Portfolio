import { getCollection, type CollectionEntry } from "astro:content";
import type {
  ProjectData,
  ProjectDetailData,
} from "./project-types";

export type { ProjectData, ProjectDetailData };
export type ProjectEntry = Omit<CollectionEntry<"project">, "data"> & {
  data: ProjectData;
};

export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = (await getCollection("project")) as ProjectEntry[];
  const orders = new Set<number>();
  const slugs = new Set<string>();

  for (const project of projects) {
    const { data } = project;
    const sourceSlug = project.id.split("/").at(-1);

    if (sourceSlug !== data.slug) {
      throw new Error(
        `Project "${data.name}" uses slug "${data.slug}" in "${project.id}". Keep the filename and slug identical.`,
      );
    }

    if (orders.has(data.order) || slugs.has(data.slug)) {
      throw new Error(
        `Project "${data.name}" duplicates an order or slug. Both must be unique.`,
      );
    }

    if (data.detail && data.href !== `/projects/${data.slug}`) {
      throw new Error(
        `Project "${data.name}" must use href "/projects/${data.slug}".`,
      );
    }

    orders.add(data.order);
    slugs.add(data.slug);
  }

  return projects.sort((a, b) => a.data.order - b.data.order);
}

export function isProjectDetail(
  project: ProjectData,
): project is ProjectDetailData {
  return project.detail;
}
