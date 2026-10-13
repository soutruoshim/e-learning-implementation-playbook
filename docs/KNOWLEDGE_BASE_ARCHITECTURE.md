# Knowledge Base Architecture & Developer Guide

## 1. Overview & Principles

The Knowledge Base is a **file-based, metadata-driven documentation platform** built on **Next.js 16 (App Router)** and **Fumadocs**.

Key principles:
- **Zero code changes for content**: Adding, renaming, or updating collections and markdown documents requires **no modifications to application code**.
- **Filesystem as source of truth**: All content lives under `content/docs/`.
- **Metadata-driven logical classification**: Each collection defines its logical grouping, title, and ordering via a local `_meta.json` (or `_meta.yml`).
- **Standard static deployment**: Fully compatible with Next.js static export (`output: 'export'`) and GitHub Pages.

---

## 2. Root Knowledge Types

All documentation collections are classified into four top-level logical groups:

| Knowledge Type | Label | Description |
| :--- | :--- | :--- |
| `PROJECT` | **Projects** | End-to-end project specifications, system architectures, and delivery plans. |
| `ROADMAP` | **Roadmaps** | Technology roadmaps, deep-dive architectures, and engineering phases. |
| `GUIDE` | **Guides** | Practical guides, foundations, step-by-step tutorials, and setup instructions. |
| `DOCUMENTATION` | **Documentation** | Technical reference documentation, API specifications, and operational manuals. |

Allowed `type` values are strictly:
`PROJECT`, `ROADMAP`, `GUIDE`, `DOCUMENTATION`.

---

## 3. Directory Structure

```text
content/docs/
├── coffee/                     # Project
│   ├── _meta.json
│   ├── index.md
│   └── 01-project-brief.md...
│
├── e-learning/                 # Project
│   ├── _meta.json
│   ├── index.md
│   └── 01_project_brief.md...
│
├── kubernetes/                 # Roadmap
│   ├── _meta.json
│   ├── index.md
│   ├── meta.json               # Fumadocs sidebar ordering
│   ├── PART_01_...md
│   └── PHASE_01_...md
│
├── si-level/                   # Guide
│   ├── _meta.json
│   ├── index.md
│   └── 0-Structured_...md
│
└── [future-collection]/        # Future collection
    ├── _meta.json
    └── ...
```

---

## 4. Collection Metadata (`_meta.json`)

Every collection directory under `content/docs/<collection-name>/` should contain a `_meta.json` (or `_meta.yml`):

```json
{
  "title": "My New Project",
  "type": "PROJECT",
  "description": "Short summary of what this project covers.",
  "order": 1
}
```

### Supported Fields:
- `title` *(string, required)*: Display name in cards and navigation.
- `type` *(string, required)*: One of `PROJECT`, `ROADMAP`, `GUIDE`, `DOCUMENTATION`.
- `description` *(string, optional)*: Short summary displayed on homepage cards and collection headers.
- `order` *(number, optional)*: Sort priority within its logical group (lower numbers appear first).
- `icon` *(string, optional)*: Optional icon identifier.

---

## 5. Document Metadata (Frontmatter)

Markdown documents can specify frontmatter metadata:

```markdown
---
title: "Document Title"
description: "Optional summary of this document."
order: 1
---

# Document Title

Document content...
```

If `title` is omitted from frontmatter, the system automatically infers it from the first `# Heading` or file name.

---

## 6. How to Add a New Collection

Adding a new collection requires only adding files to the repository:

1. Create a folder under `content/docs/<your-slug>`:
   ```bash
   mkdir -p content/docs/cloud-platform
   ```
2. Add `_meta.json`:
   ```json
   {
     "title": "Cloud Platform",
     "type": "ROADMAP",
     "description": "Enterprise cloud platform roadmap",
     "order": 3
   }
   ```
3. Add an `index.md` and your markdown files:
   ```markdown
   ---
   title: "Cloud Platform Overview"
   ---

   # Cloud Platform Overview
   ```
4. Commit and push:
   The new collection automatically appears on the homepage under its configured group, in the sidebar under its group separator, in search, and in breadcrumbs.

---

## 7. How to Add a New Document

1. Create a `.md` or `.mdx` file inside any existing collection directory:
   ```bash
   content/docs/coffee/16-security-audit.md
   ```
2. Add your content:
   ```markdown
   ---
   title: "16 — Security Audit"
   ---

   # 16 — Security Audit
   ```
3. (Optional) If the collection uses Fumadocs `meta.json` for manual sidebar ordering, add your filename slug to `pages` in `meta.json`.

---

## 8. Routing & Breadcrumbs

- **URLs**: Preserves standard clean URLs: `/docs/<collection-slug>/<document-slug>`.
- **Breadcrumbs**: Automatically generated based on the logical group and hierarchy:
  - `Projects / Coffee / 01 — Project Brief`
  - `Roadmaps / Kubernetes / PART 01 — Project Definition`
  - `Guides / SI-Level / 0 — Structured Learning Roadmap`
- **Previous / Next**: Generated automatically based on collection navigation order.

---

## 9. Search

Search is statically generated at build time using the built-in Fumadocs search engine. It indexes:
- Collection title & description
- Document title & description
- Full content headings & paragraphs
- Breadcrumbs / logical groups

Globally accessible via the search dialog shortcut (`Cmd+K` or `Ctrl+K`).

---

## 10. Local Development & Deployment

```bash
# Install dependencies
npm install

# Run type check
npm run types:check

# Run local dev server
npm run dev

# Run static production build
npm run build
```
