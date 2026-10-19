---
title: "Stop Vibe Coding — Full Explanation and Summary"
description: "Why AI should not replace engineer decision making, and how to use the AI Blueprint workflow for production systems."
---

# Stop Vibe Coding: There's A Better Way To Use AI
## Full Explanation and Summary

The PDF explains a development workflow called **AI Blueprint**. Its main argument is that AI should **not replace the engineer’s decision-making**.

Instead:

- **Human = Architect + Decision Maker + Reviewer**
- **AI = Planner Assistant + Code Writer + Tester + Auditor**

The developer remains in control of architecture, features, design, standards, and whether code gets accepted. AI handles implementation inside a structured workflow.

---

## 1. What “Stop Vibe Coding” Means

“Vibe coding” means working like this:

```text
Build me this app.
```

Then letting AI generate a large amount of code without carefully planning, reviewing, testing, or understanding what changed.

The better approach is:

```text
Plan
↓
Break work into features
↓
Review the feature specification
↓
Implement a small part
↓
Test it
↓
Audit it
↓
Review the diff
↓
Accept or reject it
```

The key idea is:

> Do not let AI own the software project. Let AI execute a software-engineering process that you own.

---

## 2. What AI Blueprint Is

**AI Blueprint** is an overlay added to a new or existing project.

It mainly consists of carefully written Markdown files and AI skills that control how the coding agent works.

Example structure:

```text
Your Project
│
├── app/
├── components/
├── package.json
│
└── Blueprint
    ├── plans/
    ├── context/
    ├── skills/
    ├── history/
    └── current-feature.md
```

It is not a programming framework.

It is a structured workflow for AI-assisted development.

---

## 3. The Main Workflow

There are two main phases.

### One-time project setup

```text
Scaffold Project
↓
Install Blueprint
↓
Onboard
↓
Create Project Plan
↓
Create Build Plan
↓
Generate Overview
↓
Optional Prototype
```

### Repeating build loop

```text
/feature or /fix
↓
Review current-feature.md
↓
/implement
↓
/check
↓
/audit
↓
Human review
↓
/complete
↓
Next feature
```

---

# Project Setup

## 4. Step 1 — Scaffold the Application

Create the normal application first.

Example for Next.js:

```bash
npx create-next-app@latest
```

Example for Laravel:

```bash
composer create-project laravel/laravel my-project
```

The Blueprint is added after the basic project exists.

---

## 5. Step 2 — Install AI Blueprint

Example:

```bash
npx create-ai-blueprint
```

During setup, the tool may ask which AI coding environment you use, such as:

```text
Claude Code
Codex
Both
```

The Blueprint files stay inside the project.

---

## 6. Step 3 — Run `/onboard`

Run:

```text
/onboard
```

Onboarding analyzes the project and adjusts AI instructions based on the tech stack.

For example:

```text
Next.js
React
TypeScript
Tailwind
```

or:

```text
PHP
Laravel
MySQL
Existing project architecture
```

It can update coding standards and project-level AI context.

Example custom rules:

```text
Use the existing project architecture.

Do not change database schema without permission.

Do not rename existing functions unless necessary.

Preserve API response compatibility.

Ask before large refactors.

Use prepared statements.

Keep changes small and focused.
```

---

## 7. Blueprint Files and Git

Blueprint can be:

```text
Committed to Git
```

or:

```text
Kept local only
```

If committed, the team can share:

- project context
- AI coding rules
- development standards
- feature history
- workflow instructions

If kept local, Blueprint-related files can be added to `.gitignore`.

---

# Planning

## 8. Step 4 — Project Plan

Create:

```text
project-plan.md
```

The Project Plan explains what the application is.

It should answer:

```text
What problem are we solving?

Who uses the system?

What is the goal?

What should the application look like?

What technologies are involved?

What are the important constraints?
```

Example:

```text
Problem:
Course certificates are created manually in Canva.

Goal:
Create an application where a user can enter:

- recipient name
- course
- date
- template

Then generate a certificate automatically.
```

It may also include UI/UX requirements.

Example:

```text
One-screen interface.

Left side:
Form controls.

Right side:
Certificate preview.
```

---

## 9. Step 5 — Build Plan

The Project Plan explains:

```text
What are we building?
```

The Build Plan explains:

```text
What features will we build, and in what order?
```

Example:

```text
Feature 1
Certificate template

Feature 2
Form and live preview

Feature 3
PNG export

Feature 4
PDF export

Feature 5
Template styling

Feature 6
Brand and logo settings
```

Features should be listed in implementation order.

This is much better than asking AI:

```text
Build the entire application.
```

Instead:

```text
Build Feature 1.
Verify it.
Complete it.

Then Feature 2.
Verify it.
Complete it.
```

---

## 10. Include Technical Decisions in the Build Plan

The Build Plan can also contain technical decisions.

Example:

```text
Use Puppeteer.

Deploy to Render early.

Use specific Chromium flags.

Validate production support before continuing.
```

For a PHP reward system, it could look like:

```text
Reward Assignment Feature

Requirements:

- use existing DbTable class
- database transactions required
- quantity_assigned must update atomically
- never assign disabled prizes
- failure must be logged
- preserve existing API response contract
```

This prevents AI from making new assumptions every session.

---

## 11. Step 6 — `/overview`

After creating the plans, run:

```text
/overview
```

This creates something like:

```text
project-overview.md
```

The overview becomes persistent AI context.

It may contain:

```text
Project purpose
Users
Tech stack
Architecture
Data model
UI/UX
Features
Constraints
```

This helps AI understand the project across multiple sessions.

---

# Persistent AI Context

## 12. Why Persistent Context Matters

Without persistent context:

```text
Session 1:
AI understands the project.

Session 2:
AI forgets important decisions.

Session 3:
AI starts using a different architecture.
```

Blueprint stores important information in files such as:

```text
project-overview.md
coding-standards.md
current-feature.md
build-plan.md
history/
```

Agent configuration files such as:

```text
CLAUDE.md
AGENTS.md
```

can point the AI to that context.

This makes the repository the long-term memory instead of relying only on chat history.

---

## 13. AI Interaction Rules

You can define how the AI should behave.

Example:

```text
Be concise and direct.

Ask before large refactors.

Do not modify database schema without approval.

Do not rewrite an entire file when only one function needs changing.

Explain security-sensitive changes.

Before coding:
1. inspect existing implementation
2. identify affected tables
3. identify affected functions
4. create an implementation plan

Never silently change API responses.
```

These rules can make AI much safer in production projects.

---

# Optional UI Prototyping

## 14. `/prototype`

Before writing real UI code, you can run:

```text
/prototype
```

It uses:

```text
Project Plan
Project Overview
UI/UX requirements
```

to generate temporary:

```text
HTML
CSS
Theme variables
```

The prototype is throwaway code.

Its purpose is to answer:

```text
Do I like this layout?

Do I like the colors?

Does the screen structure make sense?
```

Useful design ideas can later be moved into the real implementation.

---

## 15. Reference Images

Blueprint can contain:

```text
references/
```

You can place screenshots or design references there.

Example:

```text
references/
    certificate-example.png
```

Then AI can use:

```text
requirements
+
reference image
+
coding rules
+
project architecture
```

to produce better output.

---

# Browser Testing

## 16. Playwright MCP

The author recommends Playwright so AI can inspect the actual application.

It allows AI to:

```text
open the application
click buttons
inspect pages
take screenshots
compare visuals
verify UI behavior
```

Instead of:

```text
AI writes code
↓
AI assumes it works
```

you get:

```text
AI writes code
↓
AI opens the app
↓
AI sees the result
↓
AI verifies behavior
```

One downside is higher token usage.

---

# The Build Loop

## 17. `/feature`

For a new feature:

```text
/feature
```

For a bug fix:

```text
/fix
```

The important point is:

**`/feature` does not immediately write code.**

It reads the next unfinished item from the Build Plan and writes a detailed specification into:

```text
current-feature.md
```

Example:

```text
Goal:
Recreate the certificate design.

Reference:
certificate screenshot

In scope:
certificate template

Out of scope:
form binding
PNG export
PDF export
```

The developer reviews this first.

---

## 18. Break Large Features into Small Steps

A feature may be split into steps.

Example:

```text
Step 1
Theme and fonts

Step 2
Types/contracts and registry

Step 3
Certificate component
```

The current feature can also list expected files to modify.

This gives the developer a clear map of what the AI intends to do.

---

## 19. `/implement`

After reviewing the feature specification:

```text
/implement
```

This is where AI actually writes code.

Workflow:

```text
/feature

AI:
Here is exactly what I plan to change.

Human:
Review and approve.

↓

/implement

AI:
Now modify the code.
```

This separates planning from implementation.

---

## 20. Implement One Step at a Time

A key rule is:

```text
Build one step at a time.

Never build the entire large feature at once.
```

Example:

```text
Step 1 → succeeds
Step 2 → succeeds
Step 3 → fails
```

Now the problem is easier to identify.

This is much safer than generating thousands of lines in one prompt.

---

# Verification

## 21. `/check`

After implementation:

```text
/check
```

This answers:

```text
Does the feature actually work?
```

It focuses on:

- expected behavior
- requirements
- functionality
- tests
- UI interactions

---

## 22. `/audit`

Then run:

```text
/audit
```

This asks:

```text
Is the implementation good code?
```

It may inspect:

- code cleanliness
- duplication
- security
- maintainability
- architecture
- coding standards

The difference is:

```text
/check
= Does it work?

/audit
= Is it well implemented?
```

---

## 23. Human Diff Review

Even after automated checks, the developer should inspect the changes.

Ideal process:

```text
AI specification
↓
Human approval
↓
AI implementation
↓
Automated check
↓
Automated audit
↓
Human diff review
↓
Accept or reject
```

This keeps the developer as the final gatekeeper.

---

# Completion and Git

## 24. `/complete`

When satisfied:

```text
/complete
```

It can:

```text
mark the feature completed
clear current-feature.md
move feature information into history
handle Git
merge feature branch to main
```

Example history:

```text
history/
    feature-001-campaign-create.md
    feature-002-enrollment.md
    feature-003-purchase-progress.md
    fix-001-expiry-reset.md
    fix-002-duplicate-reward.md
```

This gives the project a structured AI development history.

---

## 25. Git Workflow

A feature can automatically create a branch such as:

```text
feature/certificate-template
```

Development happens there.

When complete:

```text
feature/certificate-template
          ↓
        main
```

This isolates AI-generated changes from the main branch until they are reviewed.

---

# Context Management

## 26. Why You Can Clear AI Context

Long AI sessions can become full of:

```text
old errors
old experiments
temporary code
irrelevant discussion
```

Blueprint keeps important information in repository files:

```text
project overview
current feature
build plan
coding rules
feature history
Git history
```

Therefore:

```text
Chat = temporary memory

Repository context = persistent memory
```

The AI session can be cleared while important project knowledge remains.

---

# Autopilot

## 27. `/autopilot`

Blueprint also includes an automated mode:

```text
/autopilot
```

It can run much of the workflow automatically.

However, the author does not strongly recommend it for serious projects because it moves closer to vibe coding.

It is more suitable for:

```text
small personal projects
experiments
low-risk applications
```

The important principle is:

> More automation is not always better.

Controlled automation is the goal.

---

# Example Project in the PDF

## 28. Certificate Generator

The project used in the video generates course certificates.

Input:

```text
Student name
Course
Date
Template
```

Output:

```text
PNG
PDF
```

The certificate is rendered with HTML/CSS.

---

## 29. Why Puppeteer Is Used

Puppeteer controls a headless Chrome browser.

Architecture:

```text
React Certificate
        ↓
       HTML
        ↓
        CSS
        ↓
Headless Chrome / Puppeteer
        ↓
Screenshot
        ↓
PNG / PDF
```

A browser is useful because it accurately renders:

- fonts
- layout
- borders
- spacing
- HTML
- CSS

This helps produce pixel-accurate certificates.

---

## 30. Why Deploy Early

The app uses Puppeteer, which can create production deployment complications.

Instead of:

```text
Build entire app
↓
Everything works locally
↓
Deploy
↓
Discover Puppeteer does not work
```

the plan is:

```text
Build risky Puppeteer feature
↓
Test locally
↓
Deploy early
↓
Validate production
↓
Continue development
```

This reduces technical risk.

---

## 31. Plan for Future Expansion

The first version stays simple.

Possible future features include:

```text
Authentication
Server-issued certificates
Billing
Stripe
SaaS plans
```

But these are not built immediately.

The idea is:

```text
Design for possible growth
```

without:

```text
Building every future feature now
```

---

# Why This Is Better Than Vibe Coding

## 32. Vibe Coding

```text
Idea
 ↓
Huge prompt
 ↓
AI writes lots of code
 ↓
Hope it works
 ↓
Fix random errors
 ↓
More prompts
 ↓
Architecture becomes messy
```

## Structured AI Development

```text
Idea
 ↓
Project Plan
 ↓
Build Plan
 ↓
Architecture and Context
 ↓
Select ONE feature
 ↓
Create Specification
 ↓
Human Review
 ↓
Small Implementation
 ↓
Test
 ↓
Audit
 ↓
Human Review
 ↓
Commit
 ↓
Next Feature
```

This is closer to real software engineering.

---

# Applying This to PHP / Laravel Projects

## 33. Suggested Structure

For a PHP backend project:

```text
.ai/
    project-plan.md
    build-plan.md

    context/
        project-overview.md
        architecture.md
        database-rules.md
        coding-standards.md
        current-feature.md

    history/
        features/
        fixes/

    references/
        api-examples/
        db-schema/
```

---

## 34. Example PHP AI Rules

```text
PHP Backend Rules

Use existing project architecture.

Do not introduce a new framework unless requested.

Use DbTable where the existing project uses DbTable.

Use prepared statements.

Never update reward quantity without transaction protection.

Do not modify enums without checking all usages.

Do not change database schema without explicit approval.

Preserve API compatibility.

Always inspect related database tables before implementation.

For reward assignment:
- prevent duplicate assignments
- validate quantity
- log failures
- return useful diagnostic details

For progress:
- preserve transaction history
- RESET must be explicitly logged
- reward assignment must be idempotent
```

---

# Example for an eStamp / Reward System

## 35. Build Plan

```text
01 Campaign Configuration
02 User Enrollment
03 Purchase Qualification
04 Progress Update
05 Progress Expiration
06 Progress Reset
07 Milestone Completion
08 Reward Selection
09 Reward Assignment
10 Reward Claim
11 Refund Handling
12 Admin Reports
```

---

## 36. Example Feature Specification

For:

```text
Feature 08 — Reward Selection
```

AI could create:

```text
Goal

Select a prize according to proportional
weighted distribution.


Scope

estamp_select_weighted_prize()


Rules

- ignore weight <= 0
- calculate total weight
- calculate assigned amount
- determine target ratio
- choose most under-assigned prize
- deterministic, not random


Out of Scope

- actual reward assignment
- coupon generation
- database transaction


Files

includes/estamp.php


Verification

Test weights:

20 points    = 20
50 points    = 8
Americano    = 30
Latte        = 40
Meal         = 2
```

The developer reviews this before running:

```text
/implement
```

---

# Biggest Lessons

## 37. Main Principle

The most important lesson is:

> **Do not ask AI to own the software project. Ask AI to execute a software-engineering process that you own.**

The developer should control:

```text
architecture
requirements
database design
feature boundaries
security
review
acceptance
deployment decisions
```

AI can accelerate:

```text
planning assistance
boilerplate
implementation
testing
UI inspection
auditing
documentation
Git workflow
```

---

# Full Workflow Diagram

```text
                 NEW PROJECT
                     │
                     ▼
              Scaffold Application
                     │
                     ▼
             Install AI Blueprint
                     │
                     ▼
                  Onboard
                     │
                     ▼
          ┌──────────────────────┐
          │     Project Plan     │
          │ What are we making? │
          └──────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │      Build Plan      │
          │ What features/order? │
          └──────────────────────┘
                     │
                     ▼
                  Overview
                     │
                     ▼
           Optional Prototype
                     │
                     ▼
══════════════ BUILD LOOP ══════════════

                     │
                     ▼
                 /feature
                     │
                     ▼
             current-feature.md
                     │
                HUMAN REVIEW
                     │
                     ▼
                /implement
                     │
                     ▼
             Implement Step 1
                     │
                   Test
                     │
             Implement Step 2
                     │
                   Test
                     │
             Implement Step 3
                     │
                     ▼
                  /check
                     │
                     ▼
                  /audit
                     │
                HUMAN REVIEW
                     │
                     ▼
                /complete
                     │
                     ▼
             Feature → History
                     │
               Merge to Main
                     │
                     ▼
              NEXT FEATURE
```

---

# Final Summary

The document promotes **structured AI-assisted software engineering** instead of uncontrolled vibe coding.

The recommended pattern is:

```text
PROJECT PLAN
    ↓
BUILD PLAN
    ↓
PROJECT OVERVIEW
    ↓
FEATURE
    ↓
REVIEW SPEC
    ↓
IMPLEMENT SMALL STEPS
    ↓
CHECK
    ↓
AUDIT
    ↓
HUMAN REVIEW
    ↓
COMPLETE
    ↓
NEXT FEATURE
```

The main goal is not to make AI responsible for everything.

The goal is to make AI a powerful implementation assistant while the developer keeps control of the architecture, decisions, quality, and final approval.

> **Source note:** The original uploaded transcript ends around the 30-minute point. The supplemental sections below use the creator’s August 20, 2026 article and an independently generated summary of the full video. They are **not** a verified word-for-word transcript of the remaining footage.


---

# Supplemental Coverage: Material Beyond the Uploaded Transcript

The sections below extend the original summary using external sources, not the truncated PDF transcript. Specific UI demonstrations are reported by a third-party video summary; other commands and recommended practices are described by the creator in his own article. Because the entire second-half transcript was not available for direct examination, this is a **source-supported expanded summary**, not a claim to reproduce every minute of the video.

## 38. Real Implementation: Live Certificate Preview

The additional video summary describes a practical demonstration of wiring the certificate generator's input form to an immediate visual preview. The point was to move past planning documents and show the actual small-feature loop:

```text
Define the feature
    ↓
Implement the form / preview
    ↓
Open the application and check behavior
    ↓
Fix the issue found during verification
    ↓
Review the updated implementation
```

The demonstration reportedly included a horizontal-scrolling CSS issue detected and fixed during verification. The lesson is that AI should inspect the running interface instead of declaring success merely because the code compiles.

## 39. Unit Tests: `/tests`

The extended video summary describes an automated test-setup command, including use of Vitest in the Next.js example. The creator's later written guide uses the **`/tests`** spelling, plural. (Command naming may vary by Blueprint release; check the version installed in the project.)

The purpose is to establish a repeatable unit-testing foundation and add tests for logic that can be verified independently of the browser.

```text
/tests
    ↓
Identify testable logic
    ↓
Configure test runner
    ↓
Write automated tests
    ↓
Run tests as features are developed
```

Unit tests complement, but do not replace, real UI and production checks.

## 40. Pixel-Accurate Certificate Export

The certificate demo uses HTML/CSS for layout and Puppeteer to render in a headless Chrome instance. The additional summary describes generation of high-resolution PNG output, not simply taking an approximate image of a React component.

```text
User enters certificate details
    ↓
HTML/CSS certificate is rendered
    ↓
Puppeteer opens the rendered page
    ↓
Chrome creates the output image
    ↓
PNG returned to the user
```

The general engineering lesson: for an output that depends on browser layout, test the actual browser-rendering path rather than trusting a mock-up.

## 41. Deployment Demonstration: Render + Puppeteer

According to the supplemental video summary, the author deployed the example to Render, added a build step to install the necessary Chrome binary, and verified that the deployed service could create a PNG certificate.

What this establishes for the example:

- A feature working locally was not considered sufficient.
- The browser runtime had to exist in the production environment.
- The real deployed API/output path was tested.

Do not assume the same installation command, flags, or hosting configuration will work unchanged in every project. Verify the current Puppeteer and hosting requirements for your runtime.

## 42. Existing Projects: `/adopt`

The creator's written guide distinguishes:

- **`/onboard`** for new or early-stage projects.
- **`/adopt`** for existing applications that already have delivered features and conventions.

For a mature codebase, the first task is not to reinvent its architecture; it is to discover what already exists and document the important constraints before AI changes code.

## 43. Planning Through Conversation: `/discovery`

The written guide also describes **`/discovery`** as an option for developing the project plan and build plan through a guided conversation. That is useful when the developer understands the product idea but has not yet written complete requirements.

The output still needs human review. An AI-generated plan is a starting proposal, not an approved architectural decision.

## 44. Manual Acceptance Checks: `/try`

The creator describes **`/try`** as a hands-on walkthrough describing what to open, click, and expect. This gives the human developer a structured acceptance test that complements automated checks.

For example, with a certificate app:

```text
Open the app
Enter a recipient name
Select a template
Check the live preview
Generate the certificate
Open the output
Confirm layout and text
```

## 45. Engineering Support Commands

The creator's subsequent article includes several additional commands that broaden the workflow beyond feature implementation:

| Command | Purpose |
|---|---|
| `/ci` | Set up a project-specific verification command and matching GitHub checks |
| `/doctor` | Inspect the Blueprint installation, command wiring, adapters, and plans |
| `/status` | Summarize active and completed work and suggest the next action |
| `/debug` | Investigate a defect systematically before changing code |
| `/rollback` | Reverse a previously completed feature while preserving its history |
| `/release` | Check readiness for platforms such as Render or Vercel; it does not automatically deploy |

These are **documented in the creator's article**; this supplement does not claim every command was demonstrated on screen in the missing portion of the video.

## 46. A More Complete End-to-End Flow

```text
NEW OR EXISTING APPLICATION
    ↓
Initialize Git / inspect project
    ↓
Install AI Blueprint
    ↓
/onboard (new project) OR /adopt (existing project)
    ↓
/discovery (optional) → project-plan.md + build-plan.md
    ↓
/overview
    ↓
/prototype (optional)
    ↓
/doctor and /status (as needed)
    ↓
FEATURE LOOP
    /feature OR /fix
    ↓
Human reviews specification
    ↓
/implement — small, inspectable steps
    ↓
/tests and /ci — establish repeatable verification as appropriate
    ↓
/check — verify behavior against requirements
    ↓
/try — manual acceptance walkthrough
    ↓
/audit current — review code/architecture risks
    ↓
Human reviews code changes
    ↓
/complete — archive, update plan and merge after approval
    ↓
Next feature

When problems arise: /debug, or /rollback as appropriate.
Before launch: /release, then separately deploy and verify production.
```

This diagram combines the original transcript's workflow with additional commands from the creator's article; individual commands are not all mandatory for every feature.

## 47. Closing Lesson: Own Your Process

The message is not to turn every small experiment into a heavyweight project. For throwaway prototypes and small explorations, informal prompting can be appropriate. Structured specifications and human review matter more when people rely on the application, it will be maintained, or mistakes are expensive to reverse.

The more general lesson is to adapt the workflow to your own architecture, testing strategy, Git practices, security requirements, and tolerance for risk. Treat the Blueprint as a reusable process, not as a replacement for engineering judgment.

## Sources and Verification Limits

- Original summary source: the user's uploaded PDF transcript, ending around minute 30.
- Creator's article (August 20, 2026): https://www.traversymedia.com/blog/stop-vibe-coding
- Original video: https://www.youtube.com/watch?v=L4g6GGLzAyo
- Third-party full-video summary: https://tuberizer.com/share/traversy-media/stop-vibe-coding-theres-a-better-way-to-use-ai/L4g6GGLzAyo

**Verification limit:** The supplemented sections about actual UI bugs, specific tests, and the Render demonstration rely on a third-party summary of the video. The external material helps fill the large gaps, but does not verify every sentence or provide a timestamp-by-timestamp transcript of the second half.
