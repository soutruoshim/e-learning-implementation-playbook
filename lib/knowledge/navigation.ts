import type { Root, Node, Folder, Item, Separator } from 'fumadocs-core/page-tree';
import {
  KnowledgeType,
  KNOWLEDGE_GROUP_ORDER,
  KNOWLEDGE_TYPE_LABELS,
} from './types';
import { getAllCollections, getCollection } from './loader';

export interface BreadcrumbItem {
  title: string;
  url?: string;
}

/**
 * Extracts the top-level collection slug from a PageTree Node.
 */
function getCollectionSlugFromNode(node: Node): string | undefined {
  if (node.type === 'folder') {
    // Check $ref
    if (node.$ref?.folder) {
      const parts = node.$ref.folder.split(/[\\/]/).filter(Boolean);
      if (parts.length > 0) return parts[parts.length - 1];
    }

    // Check index url
    if (node.index?.url) {
      const segments = node.index.url.split('/').filter(Boolean);
      // e.g. ['docs', 'coffee'] -> 'coffee'
      if (segments.length >= 2 && segments[0] === 'docs') {
        return segments[1];
      }
    }

    // Check children urls
    for (const child of node.children) {
      if (child.type === 'page' && child.url) {
        const segments = child.url.split('/').filter(Boolean);
        if (segments.length >= 2 && segments[0] === 'docs') {
          return segments[1];
        }
      }
    }
  } else if (node.type === 'page' && node.url) {
    const segments = node.url.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'docs') {
      return segments[1];
    }
  }

  return undefined;
}

/**
 * Transforms the flat Fumadocs PageTree into a structured tree grouped
 * by the 4 root KnowledgeTypes in fixed order:
 * 1. Projects
 * 2. Roadmaps
 * 3. Guides
 * 4. Documentation
 */
export function getGroupedPageTree(rawTree: Root): Root {
  const collections = getAllCollections();
  const collectionMap = new Map(collections.map((c) => [c.slug, c]));

  // Bucket page tree nodes by KnowledgeType
  const groupedNodes: Record<KnowledgeType, Node[]> = {
    PROJECT: [],
    ROADMAP: [],
    GUIDE: [],
    DOCUMENTATION: [],
  };

  const unclassifiedNodes: Node[] = [];

  for (const child of rawTree.children) {
    if (child.type === 'separator') continue; // Skip existing raw separators

    const slug = getCollectionSlugFromNode(child);
    if (slug && collectionMap.has(slug)) {
      const collection = collectionMap.get(slug)!;
      groupedNodes[collection.type].push(child);
    } else {
      unclassifiedNodes.push(child);
    }
  }

  // Build the new structured children list with group separators
  const newChildren: Node[] = [];

  for (const type of KNOWLEDGE_GROUP_ORDER) {
    const nodes = groupedNodes[type];
    if (nodes.length === 0) continue;

    // Add logical group separator
    const separator: Separator = {
      type: 'separator',
      name: KNOWLEDGE_TYPE_LABELS[type],
    };
    newChildren.push(separator);

    // Sort nodes in this group by collection order
    nodes.sort((a, b) => {
      const slugA = getCollectionSlugFromNode(a);
      const slugB = getCollectionSlugFromNode(b);
      const colA = slugA ? collectionMap.get(slugA) : undefined;
      const colB = slugB ? collectionMap.get(slugB) : undefined;
      const orderA = colA?.order ?? 999;
      const orderB = colB?.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      const titleA = colA?.title ?? '';
      const titleB = colB?.title ?? '';
      return titleA.localeCompare(titleB);
    });

    newChildren.push(...nodes);
  }

  // Append any other unclassified nodes if they exist
  if (unclassifiedNodes.length > 0) {
    newChildren.push(...unclassifiedNodes);
  }

  return {
    ...rawTree,
    children: newChildren,
  };
}

/**
 * Generates breadcrumb items dynamically from the slug hierarchy.
 * Format: [Logical Group] / [Collection] / [Optional Nested Sections...] / [Document Title]
 */
export function getBreadcrumbs(
  slugs: string[] | undefined,
  currentDocTitle?: string
): BreadcrumbItem[] {
  if (!slugs || slugs.length === 0) {
    return [{ title: 'Knowledge Base', url: '/' }];
  }

  const items: BreadcrumbItem[] = [];
  const collectionSlug = slugs[0];
  const collection = getCollection(collectionSlug);

  if (collection) {
    // 1. Root group (e.g. "Projects", "Roadmaps", "Guides")
    const groupLabel = KNOWLEDGE_TYPE_LABELS[collection.type];
    items.push({
      title: groupLabel,
      url: `/#${collection.type.toLowerCase()}s`,
    });

    // 2. Collection (e.g. "Coffee", "Kubernetes")
    if (slugs.length === 1) {
      items.push({
        title: collection.title,
      });
      return items;
    }

    items.push({
      title: collection.title,
      url: `/docs/${collectionSlug}`,
    });

    // 3. Intermediate nested sections (if any)
    for (let i = 1; i < slugs.length - 1; i++) {
      const subSlug = slugs[i];
      const subTitle = subSlug
        .replace(/^(\d+)[-_]/, '$1. ')
        .replace(/[-_]/g, ' ');
      const subUrl = `/docs/${slugs.slice(0, i + 1).join('/')}`;
      items.push({
        title: subTitle,
        url: subUrl,
      });
    }

    // 4. Current Document
    const lastSlug = slugs[slugs.length - 1];
    const docTitle =
      currentDocTitle ||
      lastSlug.replace(/^(\d+)[-_]/, '$1. ').replace(/[-_]/g, ' ');
    items.push({
      title: docTitle,
    });
  } else {
    // Fallback if not recognized
    items.push({ title: 'Docs', url: '/docs' });
    for (let i = 0; i < slugs.length; i++) {
      const isLast = i === slugs.length - 1;
      const segTitle =
        isLast && currentDocTitle
          ? currentDocTitle
          : slugs[i].replace(/[-_]/g, ' ');
      items.push({
        title: segTitle,
        url: isLast ? undefined : `/docs/${slugs.slice(0, i + 1).join('/')}`,
      });
    }
  }

  return items;
}
