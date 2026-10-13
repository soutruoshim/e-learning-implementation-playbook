export type KnowledgeType = 'PROJECT' | 'ROADMAP' | 'GUIDE' | 'DOCUMENTATION';

export const VALID_KNOWLEDGE_TYPES: readonly KnowledgeType[] = [
  'PROJECT',
  'ROADMAP',
  'GUIDE',
  'DOCUMENTATION',
] as const;

export const KNOWLEDGE_GROUP_ORDER: readonly KnowledgeType[] = [
  'PROJECT',
  'ROADMAP',
  'GUIDE',
  'DOCUMENTATION',
] as const;

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  PROJECT: 'Projects',
  ROADMAP: 'Roadmaps',
  GUIDE: 'Guides',
  DOCUMENTATION: 'Documentation',
};

export const KNOWLEDGE_TYPE_DESCRIPTIONS: Record<KnowledgeType, string> = {
  PROJECT: 'End-to-end project specifications, architecture blueprints, and delivery plans.',
  ROADMAP: 'Structured technology roadmaps, deep-dive architectures, and engineering phases.',
  GUIDE: 'Hands-on practical guides, foundation frameworks, and step-by-step tutorials.',
  DOCUMENTATION: 'Technical reference documentation, API specifications, and operational manuals.',
};

export interface CollectionMetadata {
  title: string;
  type: KnowledgeType;
  description: string;
  order?: number;
  icon?: string;
}

export interface CollectionItem {
  slug: string;
  title: string;
  type: KnowledgeType;
  description: string;
  order: number;
  icon?: string;
  path: string;
  docCount: number;
}

export interface DocumentItem {
  title: string;
  slug: string;
  url: string;
  description?: string;
  order?: number;
}
