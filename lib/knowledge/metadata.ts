import fs from 'node:fs';
import path from 'node:path';
import {
  CollectionMetadata,
  KnowledgeType,
  VALID_KNOWLEDGE_TYPES,
} from './types';

/**
 * Validates that a string is a valid KnowledgeType.
 * Throws a clear error during development/build if invalid.
 */
export function validateKnowledgeType(
  type: unknown,
  collectionSlug: string
): KnowledgeType {
  if (
    typeof type === 'string' &&
    VALID_KNOWLEDGE_TYPES.includes(type as KnowledgeType)
  ) {
    return type as KnowledgeType;
  }

  throw new Error(
    `[KnowledgeBase Error] Invalid collection type "${type}" found in collection "${collectionSlug}". ` +
      `Allowed types are strictly: ${VALID_KNOWLEDGE_TYPES.join(', ')}.`
  );
}

/**
 * Simple key-value / line parser for lightweight YAML files (e.g. _meta.yml)
 * without requiring heavy external dependencies.
 */
function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val: string | number = trimmed.slice(colonIdx + 1).trim();

    // Remove quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    } else if (!Number.isNaN(Number(val)) && val !== '') {
      val = Number(val);
    }

    result[key] = val;
  }

  return result;
}

/**
 * Loads collection metadata from a folder.
 * Looks for _meta.json, _meta.yaml, _meta.yml, or meta.json.
 */
export function loadCollectionMetadata(
  collectionDir: string,
  slug: string
): CollectionMetadata {
  const candidateFiles = [
    '_meta.json',
    '_meta.yaml',
    '_meta.yml',
    'meta.json',
  ];

  for (const file of candidateFiles) {
    const fullPath = path.join(collectionDir, file);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const data: Record<string, unknown> = file.endsWith('.json')
        ? JSON.parse(raw)
        : parseSimpleYaml(raw);

      // Extract and validate
      const rawType = data.type;
      const type = validateKnowledgeType(rawType, slug);
      const title =
        typeof data.title === 'string' && data.title.trim()
          ? data.title.trim()
          : slug;
      const description =
        typeof data.description === 'string'
          ? data.description.trim()
          : '';
      const order =
        typeof data.order === 'number'
          ? data.order
          : typeof data.order === 'string' && !Number.isNaN(Number(data.order))
          ? Number(data.order)
          : undefined;
      const icon = typeof data.icon === 'string' ? data.icon : undefined;

      return {
        title,
        type,
        description,
        order,
        icon,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('[KnowledgeBase Error]')) {
        throw err;
      }
      throw new Error(
        `[KnowledgeBase Error] Failed to parse metadata file "${file}" in "${slug}": ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  throw new Error(
    `[KnowledgeBase Error] Missing collection metadata for "${slug}". ` +
      `Each collection under content/docs/ must contain a _meta.json or _meta.yml with "type" and "title".`
  );
}
