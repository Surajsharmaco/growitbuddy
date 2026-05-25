export interface ResourceItem {
  title: string;
  desc: string;
  tag: string;
  link: string;
}

export interface ResourcesData {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  items: ResourceItem[];
  seoTitle: string;
  seoDesc: string;
}

export const RESOURCES_DEFAULTS: ResourcesData = {
  heroEyebrow: "Resources",
  heroHeadline: "Open-source frameworks.",
  heroSubtext: "Free templates, guides and playbooks from our internal agency toolkit.",
  items: [],
  seoTitle: "Resources - GrowitBuddy",
  seoDesc: "Free templates, guides and playbooks from our internal agency toolkit.",
};
