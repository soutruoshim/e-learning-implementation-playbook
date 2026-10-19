---
title: "Google Antigravity 2.0 — Complete Crash Course"
description: "Comprehensive guide to Google Antigravity 2.0 CLI, IDE, agent orchestration, and Git worktree workflows."
---

# Google Antigravity 2.0 — Complete Crash Course for Developers

> **Updated:** October 17, 2026  
> **Audience:** Developers who want to use Google Antigravity safely and effectively for real software projects.  
> **Focus:** Practical usage, especially for PHP/MySQL/API development, Git workflows, debugging, refactoring, testing, and agent orchestration.

---

# Table of Contents

1. [What Google Antigravity Is](#1-what-google-antigravity-is)
2. [The Antigravity Product Family](#2-the-antigravity-product-family)
3. [Which Surface Should You Use?](#3-which-surface-should-you-use)
4. [Install the Antigravity App](#4-install-the-antigravity-app)
5. [Install Antigravity CLI](#5-install-antigravity-cli)
6. [Verify and Update the CLI](#6-verify-and-update-the-cli)
7. [Start Antigravity in the Correct Project](#7-start-antigravity-in-the-correct-project)
8. [First Launch and Workspace Trust](#8-first-launch-and-workspace-trust)
9. [Authentication](#9-authentication)
10. [Choose a Model and Thinking Level](#10-choose-a-model-and-thinking-level)
11. [Projects](#11-projects)
12. [Local Mode vs Git Worktree Mode](#12-local-mode-vs-git-worktree-mode)
13. [Fast Mode vs Planning Mode](#13-fast-mode-vs-planning-mode)
14. [Artifacts](#14-artifacts)
15. [Reviewing Diffs and Agent Changes](#15-reviewing-diffs-and-agent-changes)
16. [Rules: AGENTS.md and GEMINI.md](#16-rules-agentsmd-and-geminimd)
17. [Directory-Scoped Rules](#17-directory-scoped-rules)
18. [Modular Rules](#18-modular-rules)
19. [The /learn Command](#19-the-learn-command)
20. [Skills](#20-skills)
21. [Custom Subagents](#21-custom-subagents)
22. [Built-in Subagents](#22-built-in-subagents)
23. [Managing Subagents](#23-managing-subagents)
24. [The /boost Command](#24-the-boost-command)
25. [Browser Agent](#25-browser-agent)
26. [Browser Testing Workflow](#26-browser-testing-workflow)
27. [MCP](#27-mcp)
28. [Plugins](#28-plugins)
29. [Permissions](#29-permissions)
30. [Terminal Sandbox](#30-terminal-sandbox)
31. [Recommended Permission Strategy](#31-recommended-permission-strategy)
32. [Settings](#32-settings)
33. [Useful CLI Slash Commands](#33-useful-cli-slash-commands)
34. [Useful Keyboard Shortcuts](#34-useful-keyboard-shortcuts)
35. [Scheduled Tasks](#35-scheduled-tasks)
36. [Remote Control](#36-remote-control)
37. [Voice Transcription](#37-voice-transcription)
38. [Git and Version Control](#38-git-and-version-control)
39. [IDE Extensions](#39-ide-extensions)
40. [Antigravity IDE](#40-antigravity-ide)
41. [Antigravity SDK](#41-antigravity-sdk)
42. [SDK Tools, Skills, MCP, and Subagents](#42-sdk-tools-skills-mcp-and-subagents)
43. [Complete PHP/MySQL Project Setup](#43-complete-phpmysql-project-setup)
44. [Real PHP Debugging Workflow](#44-real-php-debugging-workflow)
45. [Real Refactoring Workflow](#45-real-refactoring-workflow)
46. [Real Frontend Verification Workflow](#46-real-frontend-verification-workflow)
47. [Parallel Agent Workflow](#47-parallel-agent-workflow)
48. [Safe Production Workflow](#48-safe-production-workflow)
49. [Common Mistakes](#49-common-mistakes)
50. [Antigravity vs Claude Code](#50-antigravity-vs-claude-code)
51. [Recommended Learning Path](#51-recommended-learning-path)
52. [Final Mental Model](#52-final-mental-model)
53. [Official Documentation Sources](#53-official-documentation-sources)

---

# 1. What Google Antigravity Is

Google Antigravity is Google's **agentic development platform**.

The main idea is different from a normal AI chatbot.

A normal chatbot usually works like this:

```text
You
 ↓
Paste code
 ↓
AI answers
 ↓
You copy code
 ↓
Paste into project
```

Antigravity can work directly with your development environment:

```text
Your Project
│
├── Source code
├── Git repository
├── Terminal
├── Tests
├── Browser
└── Documentation
       │
       ↓
Google Antigravity
       │
       ├── Read/search code
       ├── Edit files
       ├── Run terminal commands
       ├── Plan features
       ├── Review diffs
       ├── Run tests
       ├── Use browser automation
       ├── Spawn subagents
       ├── Use MCP tools
       └── Produce artifacts
```

Antigravity is designed around **agents doing multi-step work**, not only answering a single prompt.

---

# 2. The Antigravity Product Family

Google Antigravity currently has several surfaces.

```text
Google Antigravity
│
├── Antigravity App
│
├── Antigravity CLI
│
├── IDE Extensions
│
├── Antigravity IDE
└── Antigravity SDK
```

## Antigravity App

The standalone desktop application.

Best for:

- managing multiple agents
- parallel tasks
- worktrees
- artifacts
- scheduled tasks
- Remote Control
- longer-running workflows
- voice input

## Antigravity CLI

Command:

```bash
agy
```

Best for:

- terminal-first developers
- SSH sessions
- fast coding work
- backend work
- scripting-style workflows
- developers who prefer keyboard control

## IDE Extensions

Available for editors including:

```text
Visual Studio Code
Visual Studio
JetBrains IDEs
Zed
Xcode
```

Best if you want Antigravity inside the editor you already use.

## Antigravity IDE

A standalone agentic IDE.

It provides:

- editor
- agents
- project awareness
- planning
- artifacts
- browser/editor/terminal integration

Important current limitation:

> Gemini 4 Argon is not available in the standalone Antigravity IDE. It is available through the Antigravity App, Antigravity CLI, and supported IDE extensions.

## Antigravity SDK

Python package:

```bash
pip install google-antigravity
```

Use it when you want to **build your own agents programmatically**.

---

# 3. Which Surface Should You Use?

For a backend developer working with PHP, MySQL, APIs, Git, and VS Code:

## Recommended primary setup

```text
VS Code
+
Antigravity CLI
```

or:

```text
VS Code
+
Antigravity VS Code Extension
```

For complex parallel work:

```text
Antigravity App
+
Git worktrees
+
Subagents
```

For creating your own agent system:

```text
Antigravity SDK
```

A good starting recommendation:

```text
Beginner
   ↓
VS Code + Antigravity CLI

Intermediate
   ↓
Antigravity App + worktrees + rules + skills

Advanced
   ↓
Subagents + MCP + plugins + SDK
```

---

# 4. Install the Antigravity App

Go to the official Antigravity website:

```text
https://antigravity.google/
```

The desktop app is available for supported desktop operating systems.

Install it using the official download appropriate for your platform.

After installation:

1. Open Antigravity.
2. Sign in with your Google account.
3. Add or open a project.
4. Choose your security settings.
5. Start a conversation.

---

# 5. Install Antigravity CLI

The CLI executable is:

```text
agy
```

## Windows PowerShell

Run:

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

## Windows CMD

Run:

```cmd
curl -fsSL https://antigravity.google/cli/install.cmd -o install.cmd && install.cmd && del install.cmd
```

## macOS / Linux

Run:

```bash
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

The default binary location on macOS/Linux is:

```text
~/.local/bin/agy
```

On Windows it is installed under the current user's local application data directory.

---

# 6. Verify and Update the CLI

Check the version:

```bash
agy --version
```

Update an existing installation:

```bash
agy update
```

If `agy` is not found after installation, close and reopen the terminal so the updated `PATH` is loaded.

---

# 7. Start Antigravity in the Correct Project

The working directory is very important.

For example:

```powershell
cd C:\xampp\htdocs\central_api_git_local
agy
```

Now Antigravity works with:

```text
central_api_git_local/
```

Do not casually start an autonomous coding agent from:

```text
C:\
```

or a folder containing many unrelated projects.

Recommended:

```text
C:\xampp\htdocs\
        │
        ├── website-a/
        ├── website-b/
        └── central_api_git_local/
                     ↑
                 Start here
```

---

# 8. First Launch and Workspace Trust

The CLI first-launch flow can ask you to configure things such as:

- terminal color scheme
- terminal rendering mode
- workspace trust

You should only grant workspace trust to a repository you actually trust.

Once trusted, Antigravity can index the workspace and begin helping with code tasks.

A simple first request:

```text
Explain this repository structure.

Do not modify any files.
```

This is better than immediately asking it to rewrite your project.

---

# 9. Authentication

Antigravity uses your Google sign-in and entitlements across supported products.

Your authentication affects things such as:

- available models
- usage limits
- organization policy
- enterprise controls
- data policies

For individual use, sign in with your Google account.

Enterprise environments may use Google Cloud / Gemini Enterprise authentication.

---

# 10. Choose a Model and Thinking Level

Antigravity allows model selection.

As of October 17, 2026, documented model options include models such as:

```text
Gemini 4 Argon
Gemini 3.8 Flash
other eligible Gemini models
eligible Claude models
GPT-OSS 120B
```

Availability depends on your plan and surface.

You can also select a thinking level:

```text
Low
Medium
High
```

General recommendation:

```text
Rename variable
      ↓
Low / Medium

Small API bug
      ↓
Medium

Complex transaction bug
      ↓
High

Architecture / race condition analysis
      ↓
High
```

Do not automatically use maximum reasoning for every task.

---

# 11. Projects

The Antigravity App organizes agent work into **projects**.

A project can contain one or multiple folders.

Example:

```text
Project: BROWN Backend

Folders:
├── central_api/
├── admin_portal/
└── shared_library/
```

This is useful if one feature spans multiple repositories.

Projects can have their own:

- settings
- security configuration
- permissions
- folders
- worktree behavior
- customizations

---

# 12. Local Mode vs Git Worktree Mode

When starting work, Antigravity can use your existing checkout or create an isolated Git worktree.

## Local Mode

```text
Your existing working directory
        ↓
Agent edits directly
```

Use for:

- tiny fixes
- interactive changes
- simple tasks

Example:

```text
Rename this function parameter.
```

## New Worktree Mode

```text
Main checkout
     │
     ├── Your work
     │
     └── Agent worktree
             ↓
        Agent changes
```

Use for:

- large features
- parallel agents
- risky refactors
- background work
- long-running tasks

This prevents the agent from disturbing your active checkout.

For complex work, worktrees are strongly preferred.

---

# 13. Fast Mode vs Planning Mode

Antigravity supports two important task styles.

## Fast Mode

The agent acts directly.

Use for:

```text
Rename a variable.
Fix this typo.
Run this test.
Change this small SQL condition.
```

## Planning Mode

The agent investigates first and creates a structured implementation plan.

Use for:

```text
Add a new payment workflow.
Refactor reward assignment.
Fix duplicate transactions.
Change several database-related functions.
```

Recommended flow:

```text
Planning Mode
      ↓
Research
      ↓
Implementation Plan Artifact
      ↓
Human Review
      ↓
Implementation
      ↓
Verification
```

---

# 14. Artifacts

An **artifact** is a structured deliverable produced by the agent.

Examples include:

- implementation plans
- code diffs
- architecture diagrams
- images
- browser screenshots
- browser recordings

Artifacts are important because you do not have to watch every individual tool call.

Instead:

```text
Agent works
    ↓
Artifact produced
    ↓
You review
    ↓
Approve / comment / redirect
```

This is a core Antigravity workflow.

---

# 15. Reviewing Diffs and Agent Changes

Never treat an agent edit as automatically correct.

Use:

```text
Agent proposes
      ↓
Review artifact
      ↓
Review diff
      ↓
Comment / request changes
      ↓
Test
      ↓
Accept
```

In the CLI you can open Artifact Review.

Documented command:

```text
/artifact
```

A documented shortcut is:

```text
Ctrl + R
```

for Artifact Review.

You can also inspect file/tool details using:

```text
Tab
```

in relevant CLI views.

---

# 16. Rules: AGENTS.md and GEMINI.md

Antigravity supports persistent project instructions called **Rules**.

The simplest forms are:

```text
AGENTS.md
```

or:

```text
GEMINI.md
```

These files can define:

- coding conventions
- architecture rules
- testing requirements
- database restrictions
- security constraints
- naming conventions

Example:

```markdown
# Project Rules

This is a PHP/MySQL API project.

## PHP

- Preserve compatibility with the current PHP version.
- Follow existing naming conventions.
- Do not introduce frameworks unless requested.
- Keep existing API response formats.

## Database

- Never DROP a database.
- Never DROP or TRUNCATE a table.
- Use prepared SQL statements.
- Preserve existing schema unless explicitly requested.

## Git

- Never force-push.
- Do not push automatically.
- Show the diff before suggesting a commit.

## Verification

After modifying PHP:
- run PHP syntax validation
- review affected SQL
- inspect git diff
```

This is conceptually similar to `CLAUDE.md` in Claude Code.

---

# 17. Directory-Scoped Rules

Rules can be scoped to specific directories.

Example:

```text
project/
│
├── AGENTS.md
│
├── api/
│   └── AGENTS.md
│
└── frontend/
    └── AGENTS.md
```

The root rule might say:

```text
Never modify database schema without approval.
```

The API rule might say:

```text
All API responses must preserve:
success
message
data
```

The frontend rule might say:

```text
Use the existing component library.
```

Antigravity loads relevant rules based on the file being read or edited.

This is very useful for monorepos and large projects.

---

# 18. Modular Rules

You can also create rule files under:

```text
.agents/rules/
```

Example:

```text
.agents/
└── rules/
    ├── php.md
    ├── database.md
    └── api.md
```

These modular files use YAML frontmatter.

Example:

```markdown
---
trigger: always_on
description: Database safety rules
---

# Database Rules

- Never DROP production tables.
- Never TRUNCATE customer data.
- Always use transactions for multi-step writes.
```

Supported rule activation styles include modes such as:

```text
always_on
model_decision
glob
manual
```

Use:

```text
AGENTS.md
```

for simple always-active repository instructions.

Use modular rules when the project grows and you need more precise activation.

---

# 19. The /learn Command

Antigravity has a learning workflow that can save useful project knowledge into rules or skills.

Use:

```text
/learn
```

when you want the agent to propose saving a lesson.

Concept:

```text
You correct Antigravity
        ↓
/learn
        ↓
Agent proposes a Rule or Skill
        ↓
You review
        ↓
Approve
        ↓
Knowledge saved
```

Workspace rules may be saved to locations such as:

```text
AGENTS.md
GEMINI.md
.agents/rules/
```

Workspace skills go under:

```text
.agents/skills/
```

Do not save every small conversation detail.

Save durable knowledge.

---

# 20. Skills

A **Skill** is a reusable workflow.

Folder structure:

```text
.agents/
└── skills/
    └── php-review/
        └── SKILL.md
```

Example:

```markdown
---
name: php-review
description: Review PHP backend code for correctness, security, and data consistency.
---

# PHP Review

When reviewing PHP backend code:

1. Inspect request validation.
2. Check SQL injection risk.
3. Check transaction boundaries.
4. Check duplicate insert risk.
5. Check race conditions.
6. Check null handling.
7. Check status transitions.
8. Check API response compatibility.
9. Check exception handling.
10. Check syntax.

Do not modify files unless explicitly requested.

Return:

- Critical
- High
- Medium
- Low
- Recommended tests
```

Rules vs Skills:

```text
RULE
 ↓
Constraint / invariant

SKILL
 ↓
Reusable process
```

Example:

```text
Rule:
Never change API response structure.

Skill:
How to review an API endpoint.
```

---

# 21. Custom Subagents

Subagents are separate agent sessions that perform delegated work.

Concept:

```text
Main Agent
    │
    ├── DB Reviewer
    ├── Security Reviewer
    ├── Test Runner
    └── Research Agent
```

Workspace custom agents can be stored under:

```text
.agents/agents/
```

Example:

```text
.agents/
└── agents/
    └── database-reviewer/
        └── agent.md
```

Example agent:

```markdown
---
name: database-reviewer
description: Reviews MySQL data integrity, locking, and transaction behavior.
---

You are a database reviewer.

Focus on:

- transactions
- race conditions
- SELECT ... FOR UPDATE
- duplicate inserts
- unique constraints
- rollback behavior
- status transitions
- data consistency

Do not edit files unless explicitly instructed.

Return exact file/function references.
```

---

# 22. Built-in Subagents

Antigravity includes specialized subagent behavior.

Documented built-ins include roles such as:

```text
research
browser
self
```

## research

Useful for:

- understanding large repositories
- finding code
- tracing architecture
- documentation research

## browser

Specialized browser automation agent.

Invoked using:

```text
/browser
```

## self

A clone of the calling agent configuration.

Useful when the parent wants to parallelize similar work.

---

# 23. Managing Subagents

In Antigravity CLI:

```text
/agents
```

opens the Agent Manager panel.

You can use it to:

- see active subagents
- see completed subagents
- inspect their current step
- open detailed views
- approve protected operations
- terminate a subagent

Subagent statuses can include:

```text
running
done
error
killed
```

For parallel debugging:

```text
Main Agent
│
├── Agent 1: trace request flow
├── Agent 2: analyze DB transaction
└── Agent 3: review duplicate handling
```

This is much better than forcing one context to hold every detail.

---

# 24. The /boost Command

The CLI includes:

```text
/boost <task>
```

This is designed for deeper multi-agent reasoning.

Example:

```text
/boost Analyze why duplicate rewards can be assigned under concurrent requests.
```

Use this for difficult problems.

Do not use expensive multi-agent reasoning for a typo.

---

# 25. Browser Agent

Antigravity can control a Chrome browser for development tasks.

Use:

```text
/browser
```

Example:

```text
/browser Open http://localhost:3000/dashboard,
verify that the analytics charts render,
and report any console errors.
```

The browser agent can:

- open pages
- navigate UI
- inspect DOM
- inspect console
- inspect network behavior
- capture screenshots
- record browser sessions

The browser subagent uses Chrome DevTools integration.

---

# 26. Browser Testing Workflow

Suppose you fix a frontend issue.

Instead of:

```text
Code compiles
      ↓
Assume done
```

use:

```text
Implement
    ↓
Run local server
    ↓
/browser
    ↓
Open affected page
    ↓
Test interaction
    ↓
Check console
    ↓
Capture proof
```

Example:

```text
/browser Open http://localhost:8080/admin/campaigns.

Verify:
1. the campaign table loads
2. pagination works
3. the Edit button opens the modal
4. no console errors occur
5. capture a screenshot of the loaded table
```

This gives Antigravity a real verification loop.

---

# 27. MCP

MCP means:

```text
Model Context Protocol
```

It allows the agent to connect to external tools and services.

Concept:

```text
Antigravity
    │
    ├── Local project
    ├── Browser
    ├── MCP server A
    ├── MCP server B
    └── Company tools
```

Possible use cases:

- issue tracker
- documentation
- database tools
- monitoring systems
- internal APIs
- design systems

Security rule:

> Only connect MCP servers you trust.

An MCP tool may be capable of accessing sensitive systems.

---

# 28. Plugins

Antigravity supports plugins.

Plugins can bundle things such as:

- skills
- rules
- subagents
- MCP definitions
- hooks
- specialized workflows

This is useful for team-wide reusable development tooling.

Concept:

```text
Plugin
│
├── Rules
├── Skills
├── Agents
├── MCP
└── Hooks
```

You can manage plugin-related functionality with:

```text
/plugin
```

where supported.

---

# 29. Permissions

Antigravity has fine-grained agent permissions.

The main access lists are:

```text
DENY
ASK
ALLOW
```

Evaluation priority is:

```text
DENY
  ↓
ASK
  ↓
ALLOW
```

Meaning Deny has the strongest precedence.

Examples:

```text
command(git status)
```

could be allowed.

```text
command(git push)
```

could require approval.

```text
command(rm -rf *)
```

should generally be denied.

Permissions also cover resources such as:

- commands
- files
- URLs
- MCP tools

---

# 30. Terminal Sandbox

Antigravity provides a terminal sandbox to isolate agent-executed commands.

The goal is:

```text
Agent command
      ↓
Sandbox
      ↓
Restricted filesystem/network
      ↓
Safer execution
```

Under safer/default configurations, the agent is restricted to the workspace and permitted resources.

Network or host-level access may require approval.

Important:

> Running outside the sandbox means the command can execute with your normal host privileges.

Treat unsandboxed execution carefully.

---

# 31. Recommended Permission Strategy

For a real PHP backend project, a sensible policy is:

## Allow

```text
Read project files
Search project files
git status
git diff
git log
php -l
safe test commands
```

## Ask

```text
git commit
git push
composer install
npm install
database migrations
external network calls
commands outside workspace
```

## Deny

```text
git push --force
rm -rf *
DROP DATABASE
DROP TABLE
TRUNCATE
destructive production commands
access to unrelated sensitive folders
```

Do not use the most permissive security preset just because it is convenient.

---

# 32. Settings

Settings can exist globally and per project.

Project settings may control:

- project folders
- permission preset
- terminal execution behavior
- file access
- sandbox behavior
- customizations

For trusted development repositories you may allow more operations.

For unknown repositories:

```text
Use stricter settings.
```

Do not give an untrusted downloaded repository unrestricted access to your machine.

---

# 33. Useful CLI Slash Commands

Useful documented commands include:

```text
/add-dir <path>
```

Add another directory to the active workspace.

```text
/agents
```

Manage custom agents and background subagents.

```text
/artifact
```

Open Artifact Review.

```text
/boost <task>
```

Run deeper multi-agent reasoning.

```text
/browser <task>
```

Run a browser subagent task.

```text
/btw <query>
```

Ask a side question without interrupting primary work.

```text
/clear
```

Clear/reset active conversation context.

Alias:

```text
/new
```

```text
/config
```

Open settings/configuration.

Alias:

```text
/settings
```

```text
/learn
```

Propose saving durable knowledge as a rule or skill.

```text
/plugin
```

Manage plugins.

```text
/schedule
```

Schedule work.

```text
/usage
```

Inspect usage/quota.

```text
/exit
```

Exit the CLI.

```text
/remote-control
```

Enable or manage Remote Control for the session.

Type:

```text
/
```

to see commands supported by your installed version.

---

# 34. Useful Keyboard Shortcuts

Documented CLI shortcuts include:

```text
Ctrl + R
```

Open Artifact Review.

```text
Tab
```

Inspect details such as diffs/tool executions in relevant views.

For subagent monitoring, Antigravity documentation also references:

```text
Alt + J
```

to move into a subagent conversation.

Always check your current CLI help because shortcuts can change.

---

# 35. Scheduled Tasks

Antigravity can schedule agent instructions.

Command:

```text
/schedule
```

Example:

```text
/schedule in 10 minutes,
check whether the staging deployment finished
and summarize any errors
```

Recurring example:

```text
/schedule every weekday at 9am,
run git fetch,
list stale local branches,
and summarize open PR reviews
```

This is useful for:

- recurring repository checks
- build monitoring
- status summaries
- maintenance tasks

For persistent long-running automation, use the appropriate persistent sidecar/automation model rather than assuming a single interactive session remains alive forever.

---

# 36. Remote Control

Remote Control lets you access an Antigravity instance running on another machine through a browser.

Use cases:

```text
Desktop workstation
       ↓
Agent runs long task
       ↓
You leave desk
       ↓
Phone / laptop browser
       ↓
Monitor and approve
```

In an interactive CLI session:

```text
/remote-control
```

Disable:

```text
/remote-control off
```

Launch the CLI with Remote Control enabled:

```bash
agy --remote-control
```

Antigravity also documents a headless Remote Control daemon workflow.

Important:

- host machine must remain running
- internet connection must remain available
- use the same authenticated account

---

# 37. Voice Transcription

The Antigravity App supports live voice transcription.

This lets you speak prompts instead of typing.

Example use:

```text
"Review the current reward assignment code,
trace the transaction flow,
and don't modify anything yet."
```

Voice is useful for:

- long task descriptions
- review feedback
- quick corrections

Always review transcribed technical names before sending.

---

# 38. Git and Version Control

Antigravity includes Git-aware workflows.

The App has a VCS panel that can show:

- unstaged changes
- staged changes
- branch diffs
- agent-originated edits

It can also help with:

- staging
- unstaging
- discarding
- commits
- commit messages
- pushing

Recommended flow:

```text
Clean working tree
       ↓
Create feature branch / worktree
       ↓
Agent works
       ↓
Review diff
       ↓
Run tests
       ↓
Manual review
       ↓
Commit
       ↓
Push
```

Before agent work:

```bash
git status
```

Prefer:

```text
nothing to commit, working tree clean
```

For a new feature:

```bash
git checkout -b feature/estamp-reset
```

Do not let an agent casually force-push.

---

# 39. IDE Extensions

Antigravity integrates into several IDEs/editors.

Documented options include:

```text
VS Code
Visual Studio
JetBrains
Zed
Xcode
```

Features can include:

- dedicated agent panel
- inline diffs
- implementation plans
- multi-step tasks
- current code context

For your PHP workflow, the VS Code extension is a natural choice.

Example layout:

```text
┌──────────────────┬─────────────────────────┐
│ Explorer         │ Code                    │
│                  │                         │
│ api/             │ digital_stamp.php       │
│ functions/       │                         │
│ config/          │ function estamp...      │
│                  │                         │
├──────────────────┼─────────────────────────┤
│ Terminal         │ Antigravity Agent       │
│ php -l ...       │ Analyze this function   │
└──────────────────┴─────────────────────────┘
```

---

# 40. Antigravity IDE

Antigravity IDE is a standalone agentic development environment.

It combines:

```text
Editor
+
Agent
+
Terminal
+
Browser integration
+
Project understanding
+
Artifacts
```

Important current distinction:

```text
Antigravity App
≠
Antigravity IDE
```

The App is the broader agent command center.

The IDE is a coding environment.

Current limitation:

> Gemini 4 Argon is not available in standalone Antigravity IDE.

If you specifically want Gemini 4 Argon, use:

```text
Antigravity App
Antigravity CLI
supported IDE extension
```

---

# 41. Antigravity SDK

The Antigravity SDK is for developers building their own agents.

Install:

```bash
pip install google-antigravity
```

Set a Gemini API key:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

On Windows PowerShell, environment-variable syntax differs; configure it using standard PowerShell environment-variable handling.

Basic Python concept:

```python
import asyncio
from google.antigravity import Agent, LocalAgentConfig

async def main():
    config = LocalAgentConfig()

    async with Agent(config) as agent:
        response = await agent.chat("Explain this project.")
        print(await response.text())

asyncio.run(main())
```

The SDK handles concerns such as:

- agent runtime
- tools
- context
- policies
- subagents
- persistence
- lifecycle hooks

---

# 42. SDK Tools, Skills, MCP, and Subagents

The SDK supports built-in filesystem tools such as:

```text
list_directory
search_directory
find_file
view_file
create_file
edit_file
```

It can also use web tools.

## Custom Python Tool

Concept:

```python
from google.antigravity import Agent, LocalAgentConfig

def get_internal_status(service: str) -> str:
    return f"{service}: healthy"

config = LocalAgentConfig(
    tools=[get_internal_status]
)
```

Now your agent can call your Python function as a tool.

## Skills

You can load skill directories:

```python
config = LocalAgentConfig(
    skills_paths=["/path/to/skills/code-review"]
)
```

## MCP

The SDK can connect MCP servers.

## Subagents

You can enable/deploy subagents for multi-agent systems.

Concept:

```text
Main Python Agent
      │
      ├── Reviewer
      ├── Researcher
      └── Tester
```

The SDK is the correct level when you want to build **your own agent application**, not merely use Antigravity as a coding assistant.

---

# 43. Complete PHP/MySQL Project Setup

For a project such as:

```text
central_api_git_local/
```

a strong Antigravity setup could be:

```text
central_api_git_local/
│
├── AGENTS.md
│
├── .agents/
│   │
│   ├── rules/
│   │   ├── php.md
│   │   ├── database.md
│   │   └── api.md
│   │
│   ├── skills/
│   │   ├── php-review/
│   │   │   └── SKILL.md
│   │   ├── check-api/
│   │   │   └── SKILL.md
│   │   └── db-review/
│   │       └── SKILL.md
│   │
│   └── agents/
│       ├── database-reviewer/
│       │   └── agent.md
│       ├── php-reviewer/
│       │   └── agent.md
│       └── debugger/
│           └── agent.md
│
├── API/
├── functions/
├── config/
└── ...
```

## Recommended AGENTS.md

```markdown
# Project

PHP/MySQL backend API.

# Safety

- Never DROP or TRUNCATE database objects.
- Never run production data modifications.
- Never force-push Git.
- Never expose secrets.
- Ask before installing dependencies.

# PHP

- Preserve the existing PHP version.
- Follow current function conventions.
- Do not introduce frameworks without approval.
- Preserve existing public function signatures unless requested.

# Database

- Use prepared statements.
- Preserve transaction behavior.
- Review race conditions.
- Review duplicate inserts.
- Use locking only when justified.

# API

- Preserve current response shape.
- Preserve backward compatibility.
- Do not expose raw DB or exception errors.

# Verification

After changes:
1. run PHP syntax validation
2. run relevant tests
3. inspect git diff
4. explain behavioral changes
```

---

# 44. Real PHP Debugging Workflow

Suppose this function may assign rewards twice:

```text
estamp_reset_progress_if_expired()
```

Start in the project:

```powershell
cd C:\xampp\htdocs\central_api_git_local
agy
```

Then ask:

```text
Investigate the digital stamp reward flow.

Focus on:
estamp_reset_progress_if_expired()

Trace:

1. progress creation
2. expiration
3. reset
4. completion
5. reward assignment
6. reward redemption

Specifically check:

- duplicate calls
- concurrent requests
- transaction boundaries
- SELECT ... FOR UPDATE behavior
- duplicate reward inserts
- partial failure
- rollback behavior

Do not modify files yet.

Create an implementation plan artifact first.
```

After reviewing the plan:

```text
Implement only the approved changes.

Requirements:

- preserve current DB schema
- preserve public API response formats
- preserve existing function callers
- do not modify unrelated code
- prevent duplicate reward assignment
```

Then use parallel review:

```text
Use a database-reviewer subagent to inspect:
- locking
- transactions
- duplicates
- rollback

Use another reviewer to inspect:
- PHP logic
- null handling
- status transitions

Do not edit during review.
```

Then verify:

```text
Run PHP syntax validation for every modified PHP file.

Then show the complete diff and explain every behavior change.
```

Finally test edge cases:

```text
Review these cases:

1. incomplete and not expired
2. incomplete and expired
3. completed and not redeemed
4. completed exactly at expiration
5. reward assignment failure
6. duplicate HTTP request
7. two simultaneous requests
8. reward already assigned
9. progress already reset
```

---

# 45. Real Refactoring Workflow

Bad prompt:

```text
Make this code better.
```

Better:

```text
Refactor this module for readability and maintainability.

Goals:

- separate request validation
- separate DB operations
- separate business logic
- preserve existing output
- preserve database schema
- preserve function signatures used elsewhere
- add no new dependency

First analyze callers and dependencies.

Create a plan artifact.

Do not edit until the plan is ready.
```

Then:

```text
Implement the approved plan one logical step at a time.

After each major step:
- run relevant validation
- summarize what changed
```

This produces controlled refactoring rather than uncontrolled redesign.

---

# 46. Real Frontend Verification Workflow

Suppose Antigravity changes an admin dashboard.

Prompt:

```text
Update the campaign table so failed reward assignments
have a View Details action.

Preserve the existing design system.

After implementation:
1. start the local app
2. use the browser agent
3. open the campaign page
4. verify the table loads
5. verify View Details works
6. check console errors
7. capture screenshots
```

Then:

```text
/browser Open the local campaign page,
test the View Details action on a failed row,
check the browser console,
and capture screenshots before and after opening the detail.
```

Now "done" means the UI actually worked.

---

# 47. Parallel Agent Workflow

For a difficult system:

```text
Main Agent
    │
    ├── Research Agent
    │      ↓
    │   maps code flow
    │
    ├── Database Agent
    │      ↓
    │   reviews transactions
    │
    ├── Security Agent
    │      ↓
    │   checks trust boundaries
    │
    └── Test Agent
           ↓
        validates behavior
```

Prompt:

```text
Analyze the reward system in parallel.

Delegate:

1. code-flow mapping
2. database consistency analysis
3. duplicate/concurrency analysis
4. test coverage analysis

Do not modify code.

Return one combined report with file/function references.
```

Parallel agents are best used when tasks can be separated cleanly.

Avoid having several agents write the same files simultaneously unless isolated worktrees or clear ownership boundaries are used.

---

# 48. Safe Production Workflow

For production-related code:

```text
Requirement
    ↓
Research
    ↓
Planning Mode
    ↓
Plan Artifact
    ↓
Human Review
    ↓
Worktree / feature branch
    ↓
Implementation
    ↓
Automated tests
    ↓
Agent review
    ↓
Manual diff review
    ↓
Integration test
    ↓
Commit
    ↓
PR
    ↓
Human approval
    ↓
Deploy
```

Recommended safety rules:

```text
No automatic production deployment
No force push
No destructive DB command
No schema change without explicit request
No secret exposure
No automatic dependency upgrades
```

---

# 49. Common Mistakes

## Mistake 1 — Starting with unrestricted permissions

Bad:

```text
Give agent full machine access immediately.
```

Better:

```text
Start restricted.
Expand only when needed.
```

## Mistake 2 — Huge vague prompts

Bad:

```text
Fix the backend.
```

Better:

```text
Trace this endpoint and identify why status changes twice.
Do not edit yet.
```

## Mistake 3 — No verification

Bad:

```text
Agent says it works.
```

Better:

```text
Run tests.
Run syntax checks.
Review diff.
Use browser verification if UI is involved.
```

## Mistake 4 — Letting several agents edit the same checkout

Better:

```text
Use isolated worktrees
or clear ownership boundaries.
```

## Mistake 5 — Putting everything in rules

Rules should contain durable constraints.

Use Skills for workflows.

Use Subagents for isolated roles.

## Mistake 6 — Using the strongest model for trivial work

Use appropriate model/thinking effort.

## Mistake 7 — Connecting untrusted MCP servers/plugins

Treat third-party tools as part of your security boundary.

---

# 50. Antigravity vs Claude Code

Both are agentic development systems, but their organization differs.

| Concept | Google Antigravity | Claude Code |
|---|---|---|
| Terminal command | `agy` | `claude` |
| Project permanent guidance | `AGENTS.md` / `GEMINI.md` / rules | `CLAUDE.md` |
| Reusable workflows | Skills | Skills |
| Custom agents | `.agents/agents/` | `.claude/agents/` |
| External tools | MCP / Plugins | MCP / integrations |
| Planning | Planning Mode + Artifacts | Plan Mode |
| Parallel work | Subagents + worktrees | Subagents |
| Browser agent | Built-in `/browser` flow | Depends on Claude Code tooling/integrations |
| Desktop orchestration | Antigravity App | Claude desktop/code ecosystem |
| Python agent SDK | Antigravity SDK | Different Anthropic SDK/tooling model |
| Scheduled agent tasks | Built into Antigravity workflows | Depends on Claude environment/workflow |
| Remote browser control of local agent | Remote Control | Different workflow/tooling |

The important idea is not which product has the most features.

The important question is:

```text
Which workflow gives you:
- enough context
- safe permissions
- good verification
- clean Git isolation
- easy review
```

---

# 51. Recommended Learning Path

## Level 1 — Basic

Learn:

```text
agy
project directory
prompts
diff review
permissions
basic model selection
```

Practice:

```text
Explain this function.
Find all callers.
Fix a small bug.
Run syntax validation.
```

## Level 2 — Professional Workflow

Learn:

```text
Planning Mode
Artifacts
AGENTS.md
Git branches
worktrees
browser verification
```

Practice:

```text
Explore
→ Plan
→ Review
→ Implement
→ Verify
→ Diff
→ Commit
```

## Level 3 — Reusable Intelligence

Learn:

```text
Rules
Skills
/learn
Custom Agents
Subagents
```

Practice:

```text
Create:
- php-review skill
- database reviewer
- API rule set
```

## Level 4 — Integrations

Learn:

```text
MCP
Plugins
Browser agent
Scheduled tasks
Remote Control
```

## Level 5 — Build Your Own Agents

Learn:

```text
Antigravity SDK
custom Python tools
policies
skills
MCP
subagents
persistence
hooks
```

---

# 52. Final Mental Model

Think of Google Antigravity like this:

```text
                     GOOGLE ANTIGRAVITY
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
     CONTEXT                 TOOLS                CONTROL
        │                     │                     │
    Rules                  Files                Permissions
    Skills                 Search               Sandbox
    Prompt                  Edit                Worktrees
    Project                 Terminal            Human review
                            Browser
                            MCP
                            Plugins
                              │
                ┌─────────────┴─────────────┐
                │                           │
            Subagents                    Artifacts
                │                           │
          Parallel work               Plans / diffs /
          isolated roles              screenshots /
                                      recordings
```

The full professional development loop is:

```text
Understand requirement
        ↓
Open trusted project
        ↓
Choose local/worktree mode
        ↓
Research code
        ↓
Planning Mode
        ↓
Review implementation artifact
        ↓
Implement
        ↓
Run tests / syntax checks
        ↓
Use browser verification if needed
        ↓
Use reviewer subagents
        ↓
Review Git diff
        ↓
Manual review
        ↓
Commit
        ↓
PR / Push
```

For backend PHP/MySQL work, the most valuable starting configuration is:

```text
AGENTS.md
.agents/rules/database.md
.agents/rules/api.md
.agents/skills/php-review/SKILL.md
.agents/skills/check-api/SKILL.md
.agents/agents/database-reviewer/agent.md
.agents/agents/debugger/agent.md
```

Then use this process consistently:

```text
Explore
   ↓
Plan
   ↓
Review
   ↓
Implement
   ↓
Verify
   ↓
Diff
   ↓
Commit
```

The goal is not to give AI unlimited control.

The goal is to create a **controlled agentic development environment** where Antigravity can do substantial work while you retain control over architecture, security, correctness, and deployment.

---

# 53. Official Documentation Sources

This guide was written against current Google Antigravity documentation available on October 17, 2026.

Primary official references:

- Google Antigravity: https://antigravity.google/
- Documentation home: https://www.antigravity.google/docs/home
- Getting started: https://www.antigravity.google/docs/getting-started
- CLI getting started: https://www.antigravity.google/docs/cli-getting-started
- CLI installation/authentication: https://www.antigravity.google/docs/cli/install/
- CLI reference: https://www.antigravity.google/docs/cli/reference
- Product overview: https://www.antigravity.google/product
- Features: https://www.antigravity.google/docs/features
- Projects/worktrees: https://www.antigravity.google/docs/projects
- Models: https://www.antigravity.google/docs/models/
- Rules: https://www.antigravity.google/docs/rules/
- Skills: https://www.antigravity.google/docs/skills
- Custom subagents: https://www.antigravity.google/docs/subagents/
- Artifacts: https://www.antigravity.google/docs/artifacts
- Artifact review: https://www.antigravity.google/docs/artifact-review
- Permissions: https://www.antigravity.google/docs/permissions
- Terminal sandbox: https://www.antigravity.google/docs/sandbox/
- Browser command: https://www.antigravity.google/docs/commands/browser
- Slash commands: https://www.antigravity.google/docs/slash-commands
- Schedule command: https://www.antigravity.google/docs/commands/schedule
- Remote Control: https://www.antigravity.google/docs/remote-control/
- IDE extensions: https://www.antigravity.google/docs/ide/extensions/
- Antigravity IDE: https://www.antigravity.google/docs/ide/overview/
- SDK overview: https://www.antigravity.google/docs/sdk/overview
- SDK tools/skills: https://www.antigravity.google/docs/sdk/tools
- SDK subagents: https://www.antigravity.google/docs/sdk/subagents
- Enterprise: https://www.antigravity.google/docs/enterprise

---

## Important Version Note

Google Antigravity is evolving quickly.

Commands, model availability, security behavior, and plan limits can change.

Before relying on a time-sensitive setting, check:

```text
/help
```

inside your installed CLI and compare it with the official documentation.

For destructive or production-sensitive operations, always use your own human review regardless of agent capability.
