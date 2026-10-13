import fs from 'node:fs';
import path from 'node:path';
import {
  CollectionItem,
  DocumentItem,
  KnowledgeType,
  KNOWLEDGE_GROUP_ORDER,
} from './types';
import { loadCollectionMetadata } from './metadata';

const DOCS_ROOT = path.join(process.cwd(), 'content/docs');

/**
 * Counts markdown/mdx documents in a directory recursively.
 */
function countDocsInDir(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countDocsInDir(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))
    ) {
      count++;
    }
  }

  return count;
}

/**
 * Extracts frontmatter title and description from a markdown file if present.
 */
function extractDocMeta(filePath: string): {
  title?: string;
  description?: string;
  order?: number;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.startsWith('---')) {
      const h1 = content.split('\n').find((l) => l.startsWith('# '));
      return {
        title: h1 ? h1.replace(/^#\s+/, '').trim() : undefined,
      };
    }

    const endIdx = content.indexOf('\n---', 3);
    if (endIdx === -1) return {};

    const fm = content.slice(3, endIdx).trim();
    const lines = fm.split('\n');
    let title: string | undefined;
    let description: string | undefined;
    let order: number | undefined;

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }

      if (key === 'title') title = val;
      if (key === 'description') description = val;
      if (key === 'order' && !Number.isNaN(Number(val))) order = Number(val);
    }

    return { title, description, order };
  } catch {
    return {};
  }
}

/**
 * Discovers all collections under content/docs/ dynamically.
 * Sorts collections by their configured order, then title.
 */
export function getAllCollections(): CollectionItem[] {
  if (!fs.existsSync(DOCS_ROOT)) return [];

  const entries = fs.readdirSync(DOCS_ROOT, { withFileTypes: true });
  const collections: CollectionItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name.startsWith('_')) {
      continue;
    }

    const slug = entry.name;
    const collectionDir = path.join(DOCS_ROOT, slug);
    const metadata = loadCollectionMetadata(collectionDir, slug);
    const docCount = countDocsInDir(collectionDir);

    collections.push({
      slug,
      title: metadata.title,
      type: metadata.type,
      description: metadata.description,
      order: metadata.order ?? 999,
      icon: metadata.icon,
      path: `content/docs/${slug}`,
      docCount,
    });
  }

  // Sort by order ascending, then title alphabetically
  collections.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  });

  return collections;
}

/**
 * Returns collections grouped by the 4 root KnowledgeTypes in the mandatory order:
 * 1. PROJECT
 * 2. ROADMAP
 * 3. GUIDE
 * 4. DOCUMENTATION
 */
export function getGroupedCollections(): Record<KnowledgeType, CollectionItem[]> {
  const all = getAllCollections();
  const grouped: Record<KnowledgeType, CollectionItem[]> = {
    PROJECT: [],
    ROADMAP: [],
    GUIDE: [],
    DOCUMENTATION: [],
  };

  for (const item of all) {
    if (grouped[item.type]) {
      grouped[item.type].push(item);
    }
  }

  // Ensure each group is sorted
  for (const type of KNOWLEDGE_GROUP_ORDER) {
    grouped[type].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  }

  return grouped;
}

/**
 * Gets a single collection by its slug.
 */
export function getCollection(slug: string): CollectionItem | undefined {
  const all = getAllCollections();
  return all.find((c) => c.slug === slug);
}

/**
 * Retrieves document items for a specific collection.
 */
export function getCollectionDocs(collectionSlug: string): DocumentItem[] {
  const dirPath = path.join(DOCS_ROOT, collectionSlug);
  if (!fs.existsSync(dirPath)) return [];

  const docs: DocumentItem[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) &&
      !entry.name.startsWith('_') &&
      !entry.name.startsWith('.')
    ) {
      const fileNameWithoutExt = entry.name.replace(/\.(md|mdx)$/, '');
      const filePath = path.join(dirPath, entry.name);
      const meta = extractDocMeta(filePath);

      const title =
        meta.title ||
        fileNameWithoutExt
          .replace(/^(\d+)[-_]/, '$1. ')
          .replace(/[-_]/g, ' ');

      const isIndex = fileNameWithoutExt === 'index';
      const docSlug = isIndex ? collectionSlug : `${collectionSlug}/${fileNameWithoutExt}`;
      const url = `/docs/${docSlug}`;

      docs.push({
        title,
        slug: fileNameWithoutExt,
        url,
        description: meta.description,
        order: isIndex ? -1 : meta.order ?? 999,
      });
    }
  }

  docs.sort((a, b) => {
    if (a.order !== b.order) return (a.order ?? 999) - (b.order ?? 999);
    return a.title.localeCompare(b.title);
  });

  return docs;
}
