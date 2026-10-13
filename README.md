# Implementation Playbook & Knowledge Base

A file-based, metadata-driven technical documentation website and knowledge repository built with **Next.js 16** and **Fumadocs**.

---

## Getting Started Locally

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Knowledge Base Structure

The Knowledge Base is organized into four top-level logical groups:

- **Projects (`PROJECT`)**: End-to-end project specifications, system architectures, and delivery plans (e.g., Coffee, E-Learning).
- **Roadmaps (`ROADMAP`)**: Technology roadmaps, deep-dive architectures, and engineering phases (e.g., Kubernetes, AWS Roadmap).
- **Guides (`GUIDE`)**: Hands-on tutorials, engineering frameworks, and setup instructions (e.g., SI-Level).
- **Documentation (`DOCUMENTATION`)**: Technical reference manuals, API specifications, and operational runbooks.

---

## How to Add Content (No Code Changes Required)

Content is 100% driven by the filesystem in `content/docs/`. Adding or editing documentation requires no React or routing code changes.

### 1. Adding a New Collection (Project, Roadmap, Guide, or Documentation)

1. Create a new folder under `content/docs/<collection-name>/`.
2. Add a `_meta.json` file inside the folder:
   ```json
   {
     "title": "My Collection Title",
     "type": "PROJECT",
     "description": "Short description of the collection",
     "order": 1
   }
   ```
   *Allowed types are strictly: `PROJECT`, `ROADMAP`, `GUIDE`, `DOCUMENTATION`.*
3. Add an `index.md` overview and any `.md` / `.mdx` documents.

### 2. Adding a New Document to an Existing Collection

1. Create a markdown file inside the collection folder (e.g. `content/docs/coffee/16-security.md`).
2. Add standard frontmatter:
   ```markdown
   ---
   title: "16 — Security Architecture"
   ---

   # 16 — Security Architecture
   ```
3. Commit and push. The document is automatically indexed, formatted, and added to search.

---

## Architecture Reference

For detailed internal architecture, data flow, metadata conventions, and navigation logic, see [docs/KNOWLEDGE_BASE_ARCHITECTURE.md](docs/KNOWLEDGE_BASE_ARCHITECTURE.md).

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack. |
| `npm run types:check` | Generates route types and runs TypeScript type checking (`tsc --noEmit`). |
| `npm run build` | Compiles MDX pages and builds the static production export for GitHub Pages. |
| `npm run start` | Runs the production build locally. |
