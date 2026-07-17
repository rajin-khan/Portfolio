export interface ProjectAction {
  label: string;
  href: string;
  primary: boolean;
}

export interface ProjectImage {
  src: string;
  width: number;
  height: number;
}

export interface ProjectCardItem {
  name: string;
  description: string;
  icon?: string;
  emoji?: string;
}

export interface ProjectProseSection {
  type: "prose";
  title: string;
  paragraphs: string[];
  actions?: ProjectAction[];
}

export interface ProjectCardSection {
  type: "features" | "use-cases" | "cards";
  title: string;
  items: ProjectCardItem[];
}

export interface ProjectRoadmapSection {
  type: "roadmap";
  title: string;
  items: Array<{
    name: string;
    status: string;
  }>;
}

export interface ProjectTeamSection {
  type: "team";
  title: string;
  items: Array<{
    name: string;
    institution: string;
    github: string;
  }>;
}

export type ProjectSection =
  | ProjectProseSection
  | ProjectCardSection
  | ProjectRoadmapSection
  | ProjectTeamSection;

interface ProjectBaseData {
  slug: string;
  order: number;
  name: string;
  cardName: string;
  description: string;
  cardDescription: string;
  image: ProjectImage;
  href: string;
  tags: string[];
}

export interface ProjectExternalData extends ProjectBaseData {
  detail: false;
}

export interface ProjectDetailData extends ProjectBaseData {
  detail: true;
  accents: {
    primary: string;
    secondary: string;
  };
  heroActions: ProjectAction[];
  sections: ProjectSection[];
}

export type ProjectData = ProjectExternalData | ProjectDetailData;
