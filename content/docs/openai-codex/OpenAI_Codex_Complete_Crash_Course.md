---
title: "OpenAI Codex — Complete Crash Course for Developers"
description: "Comprehensive guide to OpenAI Codex CLI, worktree sandboxing, AGENTS.md, skills, subagents, and MCP."
---

# OpenAI Codex — Complete Crash Course for Developers

> **Updated:** October 17, 2026  
> **Audience:** Developers using Codex for real software projects.  
> **Focus:** CLI, desktop app, IDE extension, cloud, Git worktrees, AGENTS.md, skills, subagents, MCP, plugins, hooks, sandboxing, reviews, automation, SDKs, and practical PHP/MySQL workflows.

---

# Table of Contents

1. What Codex Is
2. The Codex Product Family
3. Which Codex Surface Should You Use?
4. Install Codex CLI
5. Windows Installation and WSL
6. Sign In
7. Start Codex in the Correct Project
8. Your First Task
9. The Codex Coding Loop
10. Models and Reasoning Effort
11. Permissions
12. Sandbox Modes
13. Working with Files
14. Shell Commands
15. Web Search and Images
16. Steering an Active Turn
17. Sessions: Resume, Fork, Compact
18. AGENTS.md
19. Nested AGENTS.md and Overrides
20. Skills
21. Subagents
22. Goals
23. MCP
24. Plugins
25. Hooks
26. config.toml
27. Worktrees
28. Codex Desktop App
29. Codex IDE Extension
30. Codex Cloud
31. Code Review
32. codex exec
33. Structured Output and CI
34. Remote Control
35. Automations
36. Git Workflow
37. Context Management
38. Testing and Verification
39. Codex SDK — TypeScript
40. Codex SDK — Python
41. Agents API vs Codex SDK vs Agents SDK
42. Recommended PHP/MySQL Project Setup
43. Real PHP Debugging Workflow
44. Real Refactoring Workflow
45. API Review Workflow
46. Database Race-Condition Workflow
47. Frontend / Browser Verification
48. Parallel Agent Workflow
49. Production-Safe Workflow
50. Common Mistakes
51. Codex vs Claude Code vs Antigravity
52. Recommended Learning Path
53. Complete Mental Model
54. Official Documentation

---

# 1. What Codex Is

Codex is OpenAI's agentic software-development system.

It is not only a chatbot that returns code snippets.

Codex can work directly with a repository and development environment:

```text
Repository
│
├── Source files
├── Tests
├── Git history
├── Build tools
├── Terminal
└── Documentation
       │
       ↓
      Codex
       │
       ├── Read/search files
       ├── Edit files
       ├── Run commands
       ├── Run tests
       ├── Review diffs
       ├── Search the web
       ├── Use MCP/tools
       ├── Spawn subagents
       ├── Work in Git worktrees
       └── Continue work locally or in cloud
```

The important mental model is:

```text
Codex = coding agent + tools + repository context + execution environment
```

Instead of this:

```text
Copy PHP code
    ↓
Paste into AI
    ↓
Copy answer
    ↓
Paste back into VS Code
```

you can do:

```text
cd project
codex
```

and ask:

```text
Trace why this endpoint can assign the same reward twice.

Do not modify anything yet.

Identify:
- all callers
- database writes
- transaction boundaries
- race conditions
- existing duplicate protections
```

Codex can investigate the repository itself.

---

# 2. The Codex Product Family

Codex is available through several surfaces:

```text
Codex
│
├── ChatGPT desktop app / Codex experience
├── Codex CLI
├── IDE extension
├── Codex Cloud
├── Mobile / Remote workflows
├── Codex SDK
├── App Server
└── Agents API / agent platform
```

## Codex CLI

Best for:

- terminal-first development
- backend development
- local debugging
- code review
- scripting
- CI/CD
- SSH and remote machines

Command:

```bash
codex
```

## Desktop App

Best for:

- multiple parallel chats
- worktrees
- integrated terminal
- long-running tasks
- Git review
- Computer Use
- automations
- skills/plugins
- remote workflows

The Codex desktop experience is available on macOS and Windows.

## IDE Extension

Best for:

- VS Code
- compatible VS Code forks
- JetBrains-supported workflows
- focused edits
- reviewing changes beside the code
- sending larger work to cloud

## Codex Cloud

Best for:

- work that should continue while your computer is asleep
- reusable development environments
- multiple isolated tasks
- cloud-hosted repository work
- cloud code review and integrations

## Codex SDK

Best for:

- CI/CD automation
- internal developer tools
- custom agent workflows
- controlling local Codex programmatically

Both TypeScript and Python SDKs are available.

---

# 3. Which Codex Surface Should You Use?

For a PHP/MySQL/API developer using VS Code:

```text
Daily work
   ↓
Codex CLI or IDE Extension
```

For large parallel features:

```text
Desktop App
   ↓
Worktrees
   ↓
Multiple Codex agents
```

For tasks that should run remotely:

```text
Codex Cloud
```

For automation:

```text
codex exec
```

or:

```text
Codex SDK
```

Recommended learning order:

```text
CLI
 ↓
AGENTS.md
 ↓
Permissions + Sandbox
 ↓
Git / Review
 ↓
Skills
 ↓
Subagents
 ↓
Worktrees
 ↓
MCP / Plugins / Hooks
 ↓
Cloud
 ↓
SDK
```

---

# 4. Install Codex CLI

## macOS / Linux standalone installer

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## npm

If Node.js/npm is installed:

```bash
npm install -g @openai/codex@latest
```

## Verify

```bash
codex --version
```

## Update

Depending on installation method:

```bash
codex update
```

or update through the installer/package manager you used.

---

# 5. Windows Installation and WSL

Codex supports native Windows workflows as well as WSL2.

## Native Windows

The standalone Windows installer is available from:

```text
https://chatgpt.com/codex/install.ps1
```

For managed installs, the documented PowerShell pattern is:

```powershell
irm https://chatgpt.com/codex/install.ps1 | iex
```

You can also use npm:

```powershell
npm install -g @openai/codex@latest
```

Then:

```powershell
codex --version
```

## WSL2

If your development environment is Linux-oriented:

```powershell
wsl --install
```

Then inside WSL:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
codex
```

For best WSL filesystem performance, keep repositories under:

```text
~/code/
```

rather than:

```text
/mnt/c/...
```

when possible.

Example:

```bash
mkdir -p ~/code
cd ~/code
git clone <repo>
cd <repo>
codex
```

---

# 6. Sign In

Start:

```bash
codex
```

The first launch lets you choose an available authentication method.

Common options include:

```text
Sign in with ChatGPT
API key
organization-managed authentication
```

You can also use:

```bash
codex login
```

and:

```bash
codex logout
```

With ChatGPT sign-in, model and feature availability depends on your plan, workspace settings, and rollout.

With API-key sign-in, availability follows the API organization/project associated with the key.

---

# 7. Start Codex in the Correct Project

This matters a lot.

Example:

```powershell
cd C:\xampp\htdocs\central_api_git_local
codex
```

Codex now treats that repository as the main working directory.

Recommended:

```text
C:\xampp\htdocs\
│
├── project-a/
├── project-b/
└── central_api_git_local/
                 ↑
              codex
```

Avoid starting a coding agent from:

```text
C:\
```

unless that broad access is intentionally required.

You can explicitly choose a directory:

```bash
codex -C /path/to/project
```

---

# 8. Your First Task

Do not begin with:

```text
Improve everything.
```

Start with discovery:

```text
Explain this repository.

Focus on:
- entry points
- API structure
- database access layer
- authentication
- tests
- configuration

Do not modify any files.
```

Then ask:

```text
Find where reward assignment happens.

List all callers and database tables involved.

Do not modify code.
```

This helps Codex build correct repository context before editing.

---

# 9. The Codex Coding Loop

A strong Codex workflow is:

```text
EXPLORE
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
VERIFY
   ↓
REVIEW
   ↓
COMMIT
```

## Explore

```text
Trace the full request path for this endpoint.

Do not change anything.
```

## Plan

```text
Create a safe implementation plan.

Include:
- files affected
- functions affected
- database effects
- edge cases
- test plan

Do not implement yet.
```

## Implement

```text
Implement the approved plan.

Do not change unrelated code.
```

## Verify

```text
Run:
- syntax checks
- unit/integration tests
- relevant application checks
```

## Review

```text
Review the diff for bugs, race conditions,
backward-compatibility problems, and unintended behavior.
```

## Commit

Only after human review.

---

# 10. Models and Reasoning Effort

As of October 2026, current Codex-capable models include options such as:

```text
GPT-6 Astra
GPT-6.1 Sol
GPT-6 Sol
GPT-6 Luna
```

Availability depends on:

- plan
- workspace
- sign-in method
- client
- rollout

Inside interactive Codex:

```text
/model
```

Or launch with:

```bash
codex --model gpt-6.1-sol
```

Short form:

```bash
codex -m gpt-6.1-sol
```

General selection:

```text
Very hard architecture / multi-step work
        ↓
GPT-6 Astra

Complex coding with better cost efficiency
        ↓
GPT-6.1 Sol

Focused high-volume coding
        ↓
GPT-6 Luna
```

Reasoning effort can also be adjusted.

Higher effort can help with:

- architecture
- difficult debugging
- concurrency
- migrations
- security reviews

but uses more time/tokens.

---

# 11. Permissions

Use:

```text
/permissions
```

to inspect or change what Codex may do without asking.

A safe mental model:

```text
Read only
   ↓
Inspect

Workspace write
   ↓
Edit repository

Elevated / broad access
   ↓
Potentially affect system/network
```

For important repositories, start conservatively.

Example:

```text
Read files                    → allowed
Search files                  → allowed
Edit workspace                → allowed when needed
Run PHP syntax checks         → allowed
git status                    → allowed
git diff                      → allowed
git push                      → ask
package install               → ask
external network access       → ask
destructive command           → deny
```

---

# 12. Sandbox Modes

Codex CLI supports sandbox policies including:

```text
read-only
workspace-write
danger-full-access
```

A recommended interactive configuration is:

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

## read-only

Use for:

- repository analysis
- code review
- architecture investigation

## workspace-write

Use for most development.

Codex can work inside the repository while remaining constrained.

## danger-full-access

Use only when you have a clear reason and the surrounding environment is already isolated.

Avoid casually using:

```bash
--dangerously-bypass-approvals-and-sandbox
```

or:

```bash
--yolo
```

Those flags intentionally remove important safety boundaries.

---

# 13. Working with Files

In the interactive CLI, type:

```text
@
```

to search for a file and add it to your prompt.

Example:

```text
Review @functions/digital_stamp.php
```

Then:

```text
Focus on estamp_reset_progress_if_expired().

Explain:
1. how expiration is calculated
2. how reset occurs
3. what happens after completion
4. where reward assignment happens
5. whether duplicate assignment is possible

Do not modify anything.
```

Referencing specific files reduces ambiguity.

---

# 14. Shell Commands

Prefix a line with:

```text
!
```

to run a local command under the current permission/sandbox configuration.

Examples:

```text
!git status
```

```text
!git diff
```

```text
!php -v
```

```text
!php -l functions/digital_stamp.php
```

```text
!composer test
```

This is useful when you want deterministic terminal execution rather than a natural-language request.

---

# 15. Web Search and Images

Start Codex with live web search:

```bash
codex --search
```

Use this for tasks depending on current:

- framework documentation
- package versions
- APIs
- standards
- security advisories

Attach an image:

```bash
codex --image screenshot.png
```

or:

```bash
codex -i screenshot.png
```

Useful for:

- UI bugs
- error screenshots
- architecture diagrams
- visual references

---

# 16. Steering an Active Turn

Codex can be steered while it is working.

While Codex is running:

```text
Enter
```

can inject new instructions into the current turn.

Example:

```text
Do not modify the database layer.
Only fix the validation logic.
```

Use:

```text
Tab
```

to queue a follow-up for the next turn.

This is useful when Codex is doing a long investigation and you notice a constraint it should know immediately.

---

# 17. Sessions: Resume, Fork, Compact

## Resume

```bash
codex resume
```

Continue a saved session.

## Fork

```bash
codex fork
```

Create a new branch of a conversation while preserving the original.

This is useful when:

```text
Current investigation
      │
      ├── Approach A
      └── Approach B
```

## Compact

Inside Codex:

```text
/compact
```

summarizes older context.

Codex can also compact automatically.

Use compaction when the conversation is becoming long but you still want to keep working on the same coherent task.

## Clear / New Session

For unrelated work, start a fresh session rather than allowing old unrelated context to accumulate.

---

# 18. AGENTS.md

`AGENTS.md` is one of the most important Codex configuration mechanisms.

Codex reads applicable `AGENTS.md` files as durable repository guidance.

Generate a starting file with:

```text
/init
```

A useful PHP example:

```markdown
# Project

This repository contains a PHP/MySQL backend API.

## PHP

- Preserve compatibility with the current PHP version.
- Follow existing naming conventions.
- Do not add frameworks unless explicitly requested.
- Preserve public function signatures unless the task requires changing them.

## API

- Preserve existing API response structures.
- Do not expose raw exceptions to clients.
- Preserve backward compatibility unless explicitly requested.

## Database

- Use prepared statements for dynamic SQL.
- Preserve transaction boundaries unless intentionally changing them.
- Check repeated requests and race conditions.
- Never DROP or TRUNCATE tables unless explicitly instructed.

## Git

- Never force-push.
- Do not push automatically.
- Review `git diff` before suggesting a commit.

## Verification

For modified PHP files:
- run `php -l`
- run relevant tests
- inspect `git diff`
- report behavioral changes
```

Keep `AGENTS.md` useful and concise.

Do not put every possible procedure inside it.

---

# 19. Nested AGENTS.md and Overrides

Codex can discover repository instructions from the root toward the current working directory.

Conceptually:

```text
repo/
├── AGENTS.md
├── api/
│   ├── AGENTS.md
│   └── ...
└── frontend/
    ├── AGENTS.md
    └── ...
```

Root:

```text
General project rules
```

API:

```text
Backend-specific rules
```

Frontend:

```text
Frontend-specific rules
```

More specific directory instructions can refine broader instructions.

Codex also supports override-style agent guidance such as:

```text
AGENTS.override.md
```

when configured/applicable.

Use directory-level guidance for large repositories rather than creating one enormous global instruction file.

---

# 20. Skills

Skills are reusable workflows stored as instruction bundles with:

```text
SKILL.md
```

A skill can contain:

- instructions
- reference material
- scripts
- templates
- supporting files

Example conceptual structure:

```text
.codex/
└── skills/
    └── php-api-review/
        ├── SKILL.md
        └── references/
            └── checklist.md
```

Example:

```markdown
---
name: php-api-review
description: Review a PHP API endpoint for correctness, security, compatibility, and data consistency.
---

Review the requested endpoint.

Check:

1. request validation
2. SQL injection risk
3. null handling
4. transaction behavior
5. duplicate inserts
6. concurrent requests
7. status transitions
8. API response compatibility
9. exception handling
10. relevant tests

Do not modify files unless requested.

Return findings by severity.
```

Skills are best for:

```text
"How should Codex perform this reusable workflow?"
```

`AGENTS.md` is better for:

```text
"What rules should Codex always follow in this repository?"
```

---

# 21. Subagents

Codex supports subagent workflows.

Use them when a problem can be decomposed into independent work.

Example:

```text
Main Codex
    │
    ├── Agent 1: map code flow
    ├── Agent 2: analyze database transactions
    ├── Agent 3: review security
    └── Agent 4: review tests
            │
            ↓
     Combined result
```

Prompt:

```text
Review this feature in parallel.

Spawn one agent for each:

1. correctness
2. database race conditions
3. security
4. test coverage

Do not modify code.

Wait for all agents and combine their findings.
```

Inside CLI:

```text
/subagents
```

lets you inspect/switch between subagent threads.

Subagents are especially good for:

- repository exploration
- tests
- research
- review
- log analysis
- independent investigations

Be more careful using parallel agents to edit the same files.

---

# 22. Goals

Codex supports Goals for tasks with a clear finish line but uncertain path.

Set:

```text
/goal Reduce p95 latency below 120 ms without regressing correctness tests
```

Inspect:

```text
/goal
```

Pause:

```text
/goal pause
```

Resume:

```text
/goal resume
```

Clear:

```text
/goal clear
```

Good Goal tasks:

- performance optimization
- flaky-test investigation
- dependency migration
- bug hunts
- multi-step refactors
- benchmark-driven tuning

For a trivial one-file edit, a normal prompt is usually better.

---

# 23. MCP

MCP means:

```text
Model Context Protocol
```

It connects Codex to external tools and data.

Example:

```text
Codex
  │
  ├── repository
  ├── terminal
  ├── OpenAI Docs MCP
  ├── issue tracker MCP
  └── internal tool MCP
```

Add OpenAI's public documentation MCP:

```bash
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
```

List:

```bash
codex mcp list
```

Configuration is shared between Codex CLI and the IDE extension.

MCP should be treated as part of your security boundary.

Only connect servers you trust.

---

# 24. Plugins

Plugins package reusable capabilities for ChatGPT and Codex.

A plugin can combine:

```text
Plugin
│
├── Skills
├── MCP configuration
├── Hooks
└── Supporting resources
```

Open the plugin browser in Codex:

```text
/plugins
```

CLI commands also include:

```bash
codex plugin
```

and plugin marketplace management.

Use plugins when you want an installable, reusable capability rather than manually configuring every skill/tool.

---

# 25. Hooks

Hooks run scripts or MCP tools during the Codex lifecycle.

Useful examples:

```text
User submits prompt
      ↓
Hook scans for secrets
```

```text
Codex edits file
      ↓
PostToolUse hook
      ↓
Run validator
```

```text
Turn ends
      ↓
Stop hook
      ↓
Run final checks
```

Supported lifecycle events include examples such as:

```text
PreToolUse
PermissionRequest
PostToolUse
PreCompact
PostCompact
UserPromptSubmit
SubagentStart
SubagentStop
Stop
Interrupt
SessionStart
SessionEnd
```

Hooks can live in locations such as:

```text
~/.codex/hooks.json
~/.codex/config.toml
<repo>/.codex/hooks.json
<repo>/.codex/config.toml
```

Inspect hooks:

```text
/hooks
```

Non-managed hooks require trust review.

Do not blindly trust hooks from an unknown repository.

---

# 26. config.toml

Codex local configuration is commonly stored in:

```text
~/.codex/config.toml
```

or the platform-equivalent Codex home directory.

CLI flags can override configuration:

```bash
codex -c key=value
```

Example default model:

```toml
model = "gpt-6.1-sol"
```

Codex CLI, desktop Codex workflows, and IDE extension share important configuration.

Use:

```text
/status
```

to inspect the active session/configuration.

Use:

```text
/config
```

where supported for configuration workflows.

---

# 27. Worktrees

Git worktrees are one of the best ways to run multiple Codex tasks safely.

Without worktrees:

```text
One checkout
   ↓
Agent A edits
Agent B edits
You edit
   ↓
Conflict
```

With worktrees:

```text
Repository
│
├── Local checkout
├── Codex worktree A
└── Codex worktree B
```

Each task gets isolated files/Git state.

CLI supports:

```bash
codex --worktree
```

and worktree-aware fork/exec workflows.

The desktop app can create managed worktrees for chats.

Use worktrees for:

- large features
- parallel agents
- experiments
- long-running tasks
- risky refactors

---

# 28. Codex Desktop App

The Codex experience in the ChatGPT desktop app acts as a command center for agent work.

It supports workflows including:

- multiple chats
- parallel agents
- projects
- worktrees
- diff review
- integrated terminal
- skills
- plugins
- automations
- Computer Use
- local environments
- remote workflows

A useful mental model:

```text
Desktop App
│
├── Project A
│   ├── Chat 1
│   ├── Chat 2
│   └── Worktree
│
└── Project B
    ├── Chat 1
    └── Worktree
```

Use it when you want to supervise several coding tasks at once.

---

# 29. Codex IDE Extension

The IDE extension works beside your code.

Useful for:

- focused edits
- explaining selected code
- using currently open files as context
- reviewing changes inline
- delegating larger work to Codex Cloud

Typical workflow:

```text
VS Code
│
├── Explorer
├── Code editor
├── Terminal
└── Codex panel
```

Prompt:

```text
Review the selected function.

Do not edit yet.

Explain the possible duplicate-insert path.
```

Then:

```text
Implement the safest fix and preserve current API behavior.
```

---

# 30. Codex Cloud

Codex Cloud runs tasks in isolated cloud environments.

Important benefits:

```text
Task starts
   ↓
Cloud environment
   ↓
Computer may sleep
   ↓
Codex continues
   ↓
Review later
```

Cloud environments can contain:

- repositories
- dependencies
- tools
- network configuration
- allowed services
- environment variables
- secrets

Each task gets its own isolated workspace from the published environment.

Use Codex Cloud for:

- long-running tasks
- parallel tasks
- repeatable project environments
- tasks that should not depend on your laptop remaining awake

---

# 31. Code Review

Codex has dedicated code-review support.

Interactive:

```text
/review
```

CLI:

```bash
codex review
```

Review uncommitted changes:

```bash
codex review --uncommitted
```

Review against a base branch:

```bash
codex review --base main
```

Review a commit:

```bash
codex review --commit <SHA>
```

Good prompt:

```text
Review the current diff.

Prioritize:
1. correctness bugs
2. duplicate writes
3. transaction bugs
4. race conditions
5. security issues
6. backward compatibility

Do not modify files.
```

Dedicated review is better than merely asking:

```text
looks okay?
```

---

# 32. codex exec

`codex exec` runs Codex non-interactively.

Example:

```bash
codex exec "Review this repository for obvious broken tests"
```

Short form:

```bash
codex e "Review this repository"
```

Useful for:

- scripts
- CI/CD
- repeatable automation
- batch workflows

Example:

```bash
codex exec \
  --sandbox workspace-write \
  "Run the test suite, fix the failing unit tests, and summarize changes"
```

Be careful with unattended runs.

Define:

- sandbox
- approval policy
- scope
- verification
- output expectations

---

# 33. Structured Output and CI

`codex exec` supports machine-readable workflows.

JSON events:

```bash
codex exec --json "Review the current changes"
```

Save final response:

```bash
codex exec \
  --output-last-message result.txt \
  "Review the current changes"
```

Structured schema:

```bash
codex exec \
  --output-schema schema.json \
  "Analyze this change"
```

This is useful in CI.

Example concept:

```text
Git push
   ↓
CI
   ↓
codex exec
   ↓
Structured review
   ↓
Pass / report
```

---

# 34. Remote Control

Codex supports remote-control workflows for local agent sessions.

The idea:

```text
Development computer
       ↓
Codex running locally
       ↓
Secure relay
       ↓
ChatGPT mobile / another supported client
       ↓
Review / steer / approve
```

This is useful when:

- a long task is running
- you leave your desk
- you need to approve an action
- you want to redirect Codex

CLI includes:

```bash
codex remote-control
```

and remote/app-server workflows.

Your code and execution environment remain on the host machine when using local remote-control workflows.

---

# 35. Automations

The desktop Codex experience supports scheduled/repeatable work.

Examples:

```text
Every morning:
summarize failing CI jobs
```

```text
Every weekday:
triage new issues
```

```text
Daily:
produce a release summary
```

Automations can combine:

- instructions
- skills
- scheduled execution

For coding repositories, scheduled tasks can use isolated worktrees so they do not interfere with active local work.

---

# 36. Git Workflow

A safe Codex Git workflow:

```text
git status
    ↓
clean working tree
    ↓
feature branch / worktree
    ↓
Codex task
    ↓
tests
    ↓
codex review
    ↓
manual diff review
    ↓
commit
    ↓
push / PR
```

Before starting:

```bash
git status
```

Create branch:

```bash
git checkout -b feature/digital-stamp-reset
```

During work:

```bash
git diff
```

After changes:

```bash
codex review --uncommitted
```

Then commit manually once satisfied.

---

# 37. Context Management

Long chats accumulate:

- prompts
- command output
- diffs
- test logs
- exploration
- decisions

Use one chat per coherent problem.

Good:

```text
Chat 1:
Digital stamp expiration bug
```

Then:

```text
Chat 2:
Coupon reporting feature
```

Avoid:

```text
One giant chat:
login
coupons
rewards
Git
CSS
spin tickets
deployment
```

Useful tools:

```text
/compact
/resume
/fork
/subagents
/status
```

Subagents are particularly useful for preventing noisy investigations from polluting the main context.

---

# 38. Testing and Verification

Never accept:

```text
"Implemented successfully."
```

as proof.

Give Codex observable verification.

Example:

```text
Implement the fix.

Then:

1. run php -l on each modified PHP file
2. run the relevant tests
3. reproduce the original bug
4. verify duplicate execution
5. inspect git diff
6. report the exact evidence
```

For database work:

```text
Test:
- first request
- duplicate request
- concurrent request
- rollback
- retry after failure
```

For frontend work:

```text
Test:
- rendering
- user interaction
- browser console
- network request
```

The stronger the verification signal, the more useful Codex becomes.

---

# 39. Codex SDK — TypeScript

Install:

```bash
npm install @openai/codex-sdk
```

Basic example:

```typescript
import { Codex } from "@openai/codex-sdk";

const codex = new Codex();

const thread = codex.startThread();

const result = await thread.run(
  "Make a plan to diagnose and fix the CI failures"
);

console.log(result.finalResponse);
```

Continue the same thread:

```typescript
const result2 = await thread.run(
  "Implement the approved plan"
);

console.log(result2.finalResponse);
```

Resume:

```typescript
const threadId = "<thread-id>";
const thread2 = codex.resumeThread(threadId);

const result3 = await thread2.run(
  "Continue from the previous work"
);
```

Use the Codex SDK when you want Codex embedded into:

- internal tooling
- CI/CD
- developer portals
- custom automation
- applications

---

# 40. Codex SDK — Python

Install:

```bash
pip install openai-codex
```

Requires a supported Python version.

Basic example:

```python
from openai_codex import Codex, Sandbox

with Codex() as codex:
    thread = codex.thread_start(
        model="gpt-6.1-sol",
        sandbox=Sandbox.workspace_write,
    )

    result = thread.run(
        "Make a plan to diagnose and fix the CI failures"
    )

    print(result.final_response)
```

Read-only review turn:

```python
from openai_codex import Codex, Sandbox

with Codex() as codex:
    thread = codex.thread_start(
        sandbox=Sandbox.workspace_write
    )

    thread.run("Make the requested change.")

    review = thread.run(
        "Review the diff only.",
        sandbox=Sandbox.read_only,
    )

    print(review.final_response)
```

Available high-level sandbox presets include:

```text
read_only
workspace_write
full_access
```

---

# 41. Agents API vs Codex SDK vs Agents SDK

These tools solve different problems.

## Codex CLI / App / IDE

Use when:

```text
I want Codex to help me directly.
```

## Codex SDK

Use when:

```text
I want to programmatically control local Codex agents.
```

## Agents API

Use when:

```text
I want OpenAI to manage a durable Codex-harness session
with sandboxing, tools, MCP, context compaction,
and multi-agent orchestration.
```

## Agents SDK

Use when:

```text
I want to build my own agent loop/application
with tools, handoffs, sessions, and orchestration.
```

Simplified:

```text
Developer coding assistant
      ↓
Codex

Programmatic local Codex
      ↓
Codex SDK

Managed cloud Codex harness
      ↓
Agents API

Custom agent application
      ↓
Agents SDK
```

---

# 42. Recommended PHP/MySQL Project Setup

A useful repository:

```text
central_api_git_local/
│
├── AGENTS.md
│
├── .codex/
│   ├── config.toml
│   ├── hooks.json
│   └── skills/
│       ├── php-review/
│       │   └── SKILL.md
│       ├── api-review/
│       │   └── SKILL.md
│       └── database-review/
│           └── SKILL.md
│
├── API/
├── functions/
├── config/
├── tests/
└── ...
```

A practical `AGENTS.md`:

```markdown
# Project

PHP/MySQL backend APIs.

## Safety

- Never run destructive production DB commands.
- Never DROP or TRUNCATE tables unless explicitly requested.
- Never force-push Git.
- Never commit secrets.
- Ask before installing dependencies.

## PHP

- Preserve existing PHP compatibility.
- Follow existing coding style.
- Keep public function signatures compatible.
- Reuse existing database abstractions where appropriate.

## Database

- Use parameterized queries.
- Preserve transactions.
- Check duplicate request behavior.
- Check concurrency.
- Check rollback paths.
- Do not change schema unless requested.

## API

- Preserve existing response shape.
- Preserve existing HTTP behavior unless explicitly changing it.
- Do not expose internal exception details.

## Verification

After PHP changes:

1. Run `php -l` on changed PHP files.
2. Run relevant tests.
3. Review `git diff`.
4. Run a read-only Codex review.
5. Report unresolved risks.
```

---

# 43. Real PHP Debugging Workflow

Suppose:

```text
estamp_reset_progress_if_expired()
```

may assign duplicate rewards.

Start:

```powershell
cd C:\xampp\htdocs\central_api_git_local
codex
```

Then:

```text
Analyze the digital stamp flow.

Focus on:
estamp_reset_progress_if_expired()

Do not modify files.

Trace:
1. progress lookup
2. expiration calculation
3. reset behavior
4. campaign completion
5. reward selection
6. reward assignment
7. reward redemption

Identify all related DB tables.

Specifically analyze:
- retries
- duplicate calls
- simultaneous requests
- transaction boundaries
- SELECT ... FOR UPDATE
- duplicate inserts
- partial failures
- rollback behavior
```

Then:

```text
Create an implementation plan.

Requirements:
- preserve DB schema
- preserve API responses
- preserve existing callers
- prevent double reward assignment
- minimize unrelated changes
```

After review:

```text
Implement the plan.

Make the smallest safe change.
```

Verify:

```text
Run PHP syntax checks on all modified PHP files.

Then review these cases:
1. incomplete and not expired
2. incomplete and expired
3. completed
4. completed exactly at expiry
5. assignment failure
6. retry
7. two simultaneous requests
8. reward already exists
9. progress already reset
```

Finally:

```text
/review
```

or:

```bash
codex review --uncommitted
```

---

# 44. Real Refactoring Workflow

Bad:

```text
Make this better.
```

Better:

```text
Analyze this module for readability and maintainability.

Do not edit yet.

Propose a refactor that:
- preserves behavior
- preserves public function signatures
- preserves DB schema
- preserves API output
- adds no new dependency
- avoids unnecessary abstraction

List affected files first.
```

Then:

```text
Implement only the approved refactor.

After implementation:
- run syntax checks
- run relevant tests
- compare behavior
- show the diff summary
```

This prevents Codex from turning a focused cleanup into an unnecessary redesign.

---

# 45. API Review Workflow

Prompt:

```text
Review this API endpoint.

Do not modify code.

Check:

Request:
- required parameters
- null values
- types
- invalid values

Database:
- SQL injection
- missing transaction
- duplicate insert
- race condition
- rollback

Business logic:
- invalid state transition
- duplicate execution
- incorrect calculations
- expiration edge cases

Response:
- status code
- JSON format
- leaked internal errors
- compatibility

Return findings:
CRITICAL
HIGH
MEDIUM
LOW
```

Then implement only the findings you accept.

---

# 46. Database Race-Condition Workflow

For race conditions, tell Codex to reason about **interleaving requests**, not only sequential code.

Example:

```text
Analyze this reward function under two simultaneous requests.

Simulate:

Request A                  Request B
---------                  ---------
read progress              read progress
check eligibility          check eligibility
select reward              select reward
insert reward              insert reward
update progress            update progress

Determine whether duplicate assignment is possible.

Inspect:
- transaction boundaries
- row locks
- unique constraints
- idempotency keys
- duplicate checks

Do not edit code.
```

This often finds bugs that normal line-by-line review misses.

---

# 47. Frontend / Browser Verification

When a change affects UI, do not stop at:

```text
build passed
```

Use the desktop/browser/computer-use workflow available to your setup.

Verification pattern:

```text
Implement UI
   ↓
Start application
   ↓
Open affected page
   ↓
Perform user action
   ↓
Inspect visual result
   ↓
Inspect console/network
   ↓
Capture evidence
```

Prompt:

```text
After implementing:

1. start the local app
2. open the campaign admin page
3. verify the table loads
4. open View Details
5. check console errors
6. verify the API call succeeds
7. report what you observed
```

---

# 48. Parallel Agent Workflow

Use subagents for independent investigation.

Example:

```text
Main Agent
│
├── Agent 1
│   └── code-flow analysis
│
├── Agent 2
│   └── database consistency
│
├── Agent 3
│   └── security
│
└── Agent 4
    └── test coverage
```

Prompt:

```text
Spawn four subagents.

1. Trace the code path.
2. Review transactions and race conditions.
3. Review security and validation.
4. Review tests and missing edge cases.

No agent should modify files.

Wait for all four and produce one prioritized report.
```

For parallel implementation, prefer separate worktrees or clearly separated file ownership.

---

# 49. Production-Safe Workflow

For important production code:

```text
Requirement
    ↓
Read-only exploration
    ↓
Plan
    ↓
Human approval
    ↓
Feature branch / worktree
    ↓
Implementation
    ↓
Tests
    ↓
Codex review
    ↓
Manual diff review
    ↓
Staging verification
    ↓
Commit
    ↓
PR
    ↓
Human approval
    ↓
Deploy
```

Strong restrictions:

```text
No automatic production deployment
No force push
No DROP/TRUNCATE
No secret exposure
No schema change without explicit scope
No dependency upgrades without explicit scope
```

---

# 50. Common Mistakes

## Mistake 1 — Vague prompts

Bad:

```text
Fix everything.
```

Better:

```text
Trace why this endpoint can create duplicate rewards.
Do not edit yet.
```

## Mistake 2 — No Git checkpoint

Before significant changes:

```bash
git status
```

Use a branch/worktree.

## Mistake 3 — Maximum permissions by default

Do not start with:

```text
danger-full-access
```

unless needed.

## Mistake 4 — No tests

Agent confidence is not verification.

## Mistake 5 — Huge AGENTS.md

Keep permanent instructions short.

Use skills for detailed procedures.

## Mistake 6 — Using one huge chat for unrelated tasks

Keep sessions coherent.

## Mistake 7 — Too many parallel writers

Parallel reading/review is easy.

Parallel writing requires isolation.

## Mistake 8 — Trusting unknown hooks/plugins/MCP servers

Review them first.

## Mistake 9 — Using the strongest model for trivial tasks

Choose the right model/effort for the work.

---

# 51. Codex vs Claude Code vs Antigravity

At a high level:

| Concept | OpenAI Codex | Claude Code | Google Antigravity |
|---|---|---|---|
| Terminal command | `codex` | `claude` | `agy` |
| Repo guidance | `AGENTS.md` | `CLAUDE.md` | `AGENTS.md` / rules |
| Reusable workflows | Skills | Skills | Skills |
| Parallel work | Subagents | Subagents | Subagents |
| External tools | MCP / Plugins | MCP | MCP / Plugins |
| Local isolation | Sandbox + worktrees | Permissions/sandboxing | Sandbox + worktrees |
| Code review | Dedicated `codex review` | Agent review workflow | Artifact/diff workflow |
| Desktop orchestration | ChatGPT/Codex desktop | Claude desktop/code surfaces | Antigravity App |
| Cloud coding | Codex Cloud | Claude ecosystem equivalents | Cloud/agent workflows |
| Programmatic SDK | Codex SDK | Anthropic SDK/tooling | Antigravity SDK |
| Persistent repo rules | AGENTS.md | CLAUDE.md | AGENTS.md/rules |

The best tool is the one that fits your repository, team controls, integrations, and verification workflow.

---

# 52. Recommended Learning Path

## Level 1 — Fundamentals

Learn:

```text
codex
@
!
/model
/permissions
/status
Git diff
```

Practice:

```text
Explain this function.
Find all callers.
Make one small change.
Run syntax validation.
```

## Level 2 — Professional Workflow

Learn:

```text
AGENTS.md
sandbox
review
resume
fork
compact
worktrees
```

Workflow:

```text
Explore
→ Plan
→ Implement
→ Verify
→ Review
→ Commit
```

## Level 3 — Advanced Codex

Learn:

```text
Skills
Subagents
Goals
MCP
Plugins
Hooks
```

## Level 4 — Scale

Learn:

```text
Desktop parallel work
Codex Cloud
Automations
Remote workflows
```

## Level 5 — Build With Codex

Learn:

```text
codex exec
Codex SDK
App Server
Agents API
Agents SDK
CI/CD integration
```

---

# 53. Complete Mental Model

```text
                         OPENAI CODEX
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
    CONTEXT                  TOOLS                CONTROL
       │                      │                      │
   AGENTS.md               Files                Permissions
   Skills                  Search               Sandbox
   Memories                Edit                 Hooks
   Prompt                   Shell                Exec policy
   Git history              Web                  Worktrees
                            MCP
                            Plugins
                              │
               ┌──────────────┴──────────────┐
               │                             │
           SUBAGENTS                      SURFACES
               │                             │
       Parallel investigation        CLI / IDE / Desktop
       Specialized review            Cloud / Mobile
       Isolated work                 SDK / API
```

Professional loop:

```text
Understand requirement
        ↓
Open correct repository
        ↓
Check Git state
        ↓
Read AGENTS.md
        ↓
Explore
        ↓
Plan
        ↓
Review plan
        ↓
Implement
        ↓
Run tests
        ↓
Use subagents for independent review
        ↓
codex review
        ↓
Manual diff review
        ↓
Commit
        ↓
Push / PR
```

The goal is not:

```text
AI writes code automatically
```

The goal is:

```text
A controlled engineering agent
that understands the repository,
works within explicit permissions,
uses tools,
verifies its work,
and leaves the developer in control.
```

---

# 54. Official Documentation

This guide was prepared using current OpenAI documentation available on October 17, 2026.

## Core Codex

- Codex developer resources  
  https://developers.openai.com/learn/codex

- Codex CLI  
  https://learn.chatgpt.com/docs/codex/cli

- CLI reference  
  https://learn.chatgpt.com/docs/cli/reference

- Developer commands  
  https://learn.chatgpt.com/docs/developer-commands

- IDE extension  
  https://learn.chatgpt.com/docs/codex/ide

- Models  
  https://learn.chatgpt.com/docs/models

- Best practices  
  https://learn.chatgpt.com/docs/learn/best-practices

## Customization

- Customization overview  
  https://learn.chatgpt.com/docs/customization/overview

- Skills  
  https://learn.chatgpt.com/docs/build-skills

- Subagents  
  https://learn.chatgpt.com/docs/agent-configuration/subagents

- Hooks  
  https://learn.chatgpt.com/docs/hooks

- MCP / OpenAI Docs MCP  
  https://developers.openai.com/learn/docs-mcp

## Environments

- Git worktrees  
  https://learn.chatgpt.com/docs/environments/git-worktrees

- Local environments  
  https://learn.chatgpt.com/docs/environments/local-environment

- Codex Cloud  
  https://learn.chatgpt.com/docs/cloud

- Cloud environments  
  https://learn.chatgpt.com/docs/environments/cloud-environments

- Windows / WSL  
  https://learn.chatgpt.com/docs/windows/wsl

## Programmatic Codex

- Codex SDK  
  https://learn.chatgpt.com/docs/codex-sdk

- Agents API  
  https://developers.openai.com/api/docs/guides/agents-api/overview

- Agents overview  
  https://developers.openai.com/api/docs/guides/agents

## Current Product Information

- Introducing the Codex app  
  https://openai.com/index/introducing-the-codex-app/

- Work with Codex from anywhere  
  https://openai.com/index/work-with-codex-from-anywhere/

- Current ChatGPT/Codex changelog  
  https://learn.chatgpt.com/docs/changelog

---

# Version Note

Codex changes quickly.

Commands, models, plans, permission behavior, and experimental features may change after this guide was written.

Before relying on a command, inspect your installed version:

```bash
codex --version
```

Inside Codex:

```text
/status
```

and:

```text
/
```

to see available commands.

For current model availability:

```text
/model
```

For permissions:

```text
/permissions
```

For production-sensitive work, always keep human review and Git-based recovery in the workflow.
