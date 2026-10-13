---
title: "Claude Code Agent Development Kit — Full Setup Tutorial"
---

# Claude Code Agent Development Kit — Full Setup Tutorial

This guide explains how to build a structured Claude Code development environment using:

**CLAUDE.md → Skills → Hooks → Subagents → MCP → Plugins → Agent Teams**

The goal is to turn Claude Code from a simple AI coding assistant into a repeatable, safer, team-ready development workflow.

---

## 1. Architecture Overview

```text
                     ┌───────────────────┐
                     │     CLAUDE.md     │
                     │ Project knowledge │
                     └─────────┬─────────┘
                               │
                ┌──────────────▼──────────────┐
                │           SKILLS            │
                │ Repeatable procedures       │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │           HOOKS             │
                │ Automatic enforcement       │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼──────────────┐
                │         SUBAGENTS           │
                │ Specialized workers         │
                └──────────────┬──────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
       MCP                 Plugins              Agent Teams
 External tools        Distribution         Parallel workers
```

A simple way to remember the system:

| Need | Use |
|---|---|
| Claude should always know something | `CLAUDE.md` |
| Claude should follow a repeatable procedure | Skill |
| Something must happen automatically | Hook |
| A specialist should work separately | Subagent |
| Claude needs an external service/tool | MCP |
| You want to distribute your configuration | Plugin |
| Multiple Claude workers should collaborate | Agent Team |

---

# 2. Recommended Project Structure

```text
my-backend-project/
│
├── CLAUDE.md
├── .mcp.json
├── .gitignore
│
├── .claude/
│   ├── settings.json
│   ├── settings.local.json
│   │
│   ├── skills/
│   │   ├── api-review/
│   │   │   ├── SKILL.md
│   │   │   ├── references/
│   │   │   ├── scripts/
│   │   │   └── templates/
│   │   │
│   │   └── debug-api/
│   │       └── SKILL.md
│   │
│   ├── agents/
│   │   ├── code-reviewer.md
│   │   ├── test-runner.md
│   │   └── explorer.md
│   │
│   └── hooks/
│       └── validate-php.ps1
│
├── src/
├── tests/
└── ...
```

---

# 3. Install Claude Code on Windows

Open **PowerShell**.

## Option A — Native installer

```powershell
irm https://claude.ai/install.ps1 | iex
```

Check installation:

```powershell
claude --version
```

## Option B — WinGet

```powershell
winget install Anthropic.ClaudeCode
```

Then move into your project:

```powershell
cd C:\xampp\htdocs\my-project
```

Start Claude Code:

```powershell
claude
```

On first launch, sign in.

Inside Claude Code you can also run:

```text
/login
```

---

# 4. Initialize the Project

Inside your project:

```powershell
claude
```

Then in Claude Code:

```text
/init
```

This inspects your repository and creates a starter `CLAUDE.md`.

Check what context is loaded:

```text
/context
```

---

# 5. Layer 1 — CLAUDE.md

Think of `CLAUDE.md` as:

> Everything a senior developer should know before touching this project.

Use it for information Claude needs frequently.

Do not put every procedure or every long document inside it.

---

## 5.1 Global CLAUDE.md

A global file can contain your personal development preferences.

On Windows:

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude"
notepad "$HOME\.claude\CLAUDE.md"
```

Example:

```markdown
# Personal Development Preferences

## Communication

- Explain the root cause before changing code.
- Keep technical explanations clear and concise.
- Show important SQL and API behavior explicitly.
- Do not modify unrelated code.

## Coding

- Prefer readable code over clever code.
- Avoid unnecessary abstractions.
- Preserve backward compatibility unless explicitly asked otherwise.
- Follow existing project naming conventions.

## Git

Before making large changes:

1. Check `git status`.
2. Inspect the current diff.
3. Review existing patterns.

Do not automatically force-push.

## Database

Before modifying SQL:

- Identify the database engine.
- Verify MySQL vs SQL Server syntax.
- Explain migration risk.
- Never assume production schema can be changed.

## Security

Never intentionally print:

- passwords
- access tokens
- private keys
- database credentials
- API secrets
```

---

## 5.2 Project CLAUDE.md

Create:

```text
my-project/CLAUDE.md
```

Example for a PHP backend:

```markdown
# Project Instructions

## Project

Backend API for the mobile application.

## Technology

- PHP
- MySQL
- REST APIs
- JSON
- Git

## Architecture

Important areas:

- `api/` - API endpoints
- `helper/` - business logic
- `config/` - configuration
- `tests/` - automated tests

Controllers should remain thin.

Business logic belongs in helper/service functions.

## API Rules

Every endpoint should:

1. Validate required input.
2. Validate authentication when required.
3. Call business logic.
4. Return the existing JSON response format.
5. Handle unexpected errors safely.

Never return raw PHP exceptions to clients.

## Database Rules

- Use parameterized queries.
- Never concatenate user input directly into SQL.
- Check existing indexes before adding new indexes.
- Avoid schema changes unless explicitly required.
- Explain version-specific SQL syntax.

## PHP

After changing PHP:

```bash
php -l <file>
```

Run relevant tests when available.

## Git

Before implementation:

```bash
git status
git diff
```

After implementation:

```bash
git diff
```

Do not commit automatically unless requested.

## Security

Never expose:

- `.env`
- access tokens
- passwords
- private keys
- production database credentials
```

---

# 6. Layer 2 — Skills

Skills are reusable procedures.

Use a Skill when you keep giving Claude the same long prompt.

Examples:

```text
/api-review
/debug-api
/create-migration
/release-check
/security-review
```

Project skills live under:

```text
.claude/skills/<skill-name>/SKILL.md
```

Personal skills can live under:

```text
~/.claude/skills/<skill-name>/SKILL.md
```

---

# 7. Create an API Review Skill

Create the folder:

```powershell
New-Item -ItemType Directory -Force ".claude\skills\api-review"
notepad ".claude\skills\api-review\SKILL.md"
```

Put this inside:

```markdown
---
name: api-review
description: Review backend API implementations for correctness, validation, security, database safety, response consistency, and maintainability.
---

# API Review

Review the requested API systematically.

## 1. Understand the endpoint

Identify:

- endpoint purpose
- HTTP method
- request structure
- authentication
- database tables
- external services
- expected response

Do not modify code yet.

## 2. Input validation

Check:

- required fields
- empty strings
- null values
- type validation
- numeric ranges
- enum values
- date/time format

## 3. Security

Check:

- authentication
- authorization
- SQL injection
- secrets in logs
- sensitive data in responses
- unsafe file operations

## 4. Database

Check:

- prepared statements
- transactions
- duplicate requests
- race conditions
- missing indexes
- N+1 queries

Do not suggest schema changes unless necessary.

## 5. Business logic

Check:

- edge cases
- invalid states
- duplicate processing
- idempotency
- status transitions

## 6. Error handling

Check:

- unexpected exceptions
- DB errors
- network errors
- malformed responses

## 7. Response

Verify the endpoint follows the existing project response conventions.

## Output

### Critical
Issues that can cause security problems or data corruption.

### High
Bugs or incorrect business logic.

### Medium
Maintainability/performance issues.

### Low
Minor improvements.

### Verdict

PASS

or

CHANGES REQUIRED
```

Then use:

```text
/api-review
```

Or say:

```text
Review this endpoint using the API review procedure.
```

---

# 8. Advanced Skill Structure

A Skill can include more than one file:

```text
.claude/
└── skills/
    └── api-review/
        ├── SKILL.md
        ├── references/
        │   ├── api-standard.md
        │   ├── response-codes.md
        │   └── database-rules.md
        ├── scripts/
        │   └── validate-api.ps1
        └── templates/
            └── review-report.md
```

Use this when a workflow needs:

- reference documentation
- scripts
- templates
- example files
- validation helpers

---

# 9. Layer 3 — Hooks

Hooks are automatic actions.

Example:

```text
Claude edits PHP
      ↓
Hook runs
      ↓
php -l
      ↓
PASS → continue
FAIL → return error to Claude
```

Hooks are useful when something must happen every time.

Common lifecycle events include:

```text
SessionStart
PreToolUse
PostToolUse
PermissionRequest
Stop
SubagentStop
PreCompact
PostCompact
```

Project hooks/settings live in:

```text
.claude/settings.json
```

Private developer-specific settings can live in:

```text
.claude/settings.local.json
```

---

# 10. Configure Permissions First

Create:

```powershell
New-Item -ItemType Directory -Force ".claude"
notepad ".claude\settings.json"
```

Example:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(php -l *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(composer install *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

Inside Claude Code, inspect current permissions with:

```text
/permissions
```

> Note: the exact shell tool name can vary by Claude Code environment. Check `/permissions` and adjust the rules if needed.

---

# 11. Create a PHP Validation Hook

Create:

```powershell
New-Item -ItemType Directory -Force ".claude\hooks"
notepad ".claude\hooks\validate-php.ps1"
```

Add:

```powershell
$files = git diff --name-only --diff-filter=ACM |
    Where-Object {
        $_ -match '\.php$' -and (Test-Path $_)
    }

$failed = $false

foreach ($file in $files) {

    Write-Host "Checking $file"

    php -l $file

    if ($LASTEXITCODE -ne 0) {
        $failed = $true
    }
}

if ($failed) {

    [Console]::Error.WriteLine(
        "PHP syntax validation failed. Fix the PHP errors before continuing."
    )

    exit 2
}

exit 0
```

Then configure the hook:

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(git push --force *)"
    ]
  },

  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/validate-php.ps1"
          }
        ]
      }
    ]
  }
}
```

Flow:

```text
Claude edits PHP
       ↓
PostToolUse
       ↓
validate-php.ps1
       ↓
php -l changed PHP files
       ↓
PASS → continue

FAIL → Claude receives the failure and fixes it
```

Use `PreToolUse` when you want to block an action before it happens.

Use `PostToolUse` when you want validation after an action.

---

# 12. Good Hook Ideas

```text
After code edit
    ↓
run formatter

After PHP edit
    ↓
php -l

Before git push
    ↓
run tests

Before dangerous command
    ↓
block it

Session starts
    ↓
load environment context

Claude stops
    ↓
run final verification
```

---

# 13. Layer 4 — Subagents

A subagent is a separate specialist with its own context.

Example:

```text
Main Claude
   │
   ├── Code Reviewer
   │      own context
   │
   ├── Test Runner
   │      own context
   │
   └── Explorer
          own context
```

Project agents live in:

```text
.claude/agents/
```

Personal agents:

```text
~/.claude/agents/
```

---

# 14. Create a Code Reviewer Subagent

Create:

```powershell
New-Item -ItemType Directory -Force ".claude\agents"
notepad ".claude\agents\code-reviewer.md"
```

Add:

```markdown
---
name: code-reviewer
description: Review modified backend code for correctness, security, maintainability, regression risk, SQL problems, and API consistency.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior backend code reviewer.

You do not implement features.

Your responsibility is to find problems.

Start by understanding the changed code.

Use git diff when appropriate.

Check:

1. Functional bugs
2. Business logic
3. Security vulnerabilities
4. Authentication/authorization
5. SQL safety
6. Transaction correctness
7. Race conditions
8. Error handling
9. Performance
10. Backward compatibility
11. Missing tests

Do not complain about minor style unless it materially hurts maintainability.

Report findings as:

## Critical

## High

## Medium

## Low

## Positive observations

## Verdict

Choose one:

- APPROVE
- APPROVE WITH MINOR CHANGES
- REQUEST CHANGES
```

Use it with:

```text
Use the code-reviewer agent to review my current changes.
```

---

# 15. Create a Test Runner Subagent

Create:

```text
.claude/agents/test-runner.md
```

Content:

```markdown
---
name: test-runner
description: Run relevant automated tests and analyze failures after implementation changes.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are responsible for verification.

Do not redesign application architecture.

Workflow:

1. Identify changed files.
2. Identify relevant tests.
3. Run the smallest relevant tests first.
4. If successful, run broader tests when appropriate.
5. Analyze failures.
6. Determine whether each failure is:
   - caused by the new code
   - pre-existing
   - environment related

Return:

## Tests executed

## Passed

## Failed

## Root cause

## Recommended action

## Verification status

PASS or FAIL
```

Example prompt:

```text
Implement the feature.

After implementation:

1. ask test-runner to verify it
2. ask code-reviewer to review the diff
3. fix Critical and High findings
```

---

# 16. Skill vs Subagent

## Skill

Use when you need:

- a procedure
- a checklist
- a repeatable workflow
- reference documents
- templates

Example:

```text
/api-review
/release
/create-migration
```

The main Claude session continues using the same context.

## Subagent

Use when you need:

- independent review
- test analysis
- codebase exploration
- security review
- large search
- isolated context

A subagent has its own context and returns a result.

---

# 17. Layer 5 — MCP

MCP means:

**Model Context Protocol**

It lets Claude Code connect to external systems.

Example:

```text
Claude Code
    │
    ├──── GitHub
    ├──── Sentry
    ├──── Notion
    ├──── Databases
    ├──── APIs
    ├──── Internal services
    └──── Custom tools
```

---

# 18. Check MCP Servers

Outside Claude Code:

```powershell
claude mcp list
```

Inside Claude Code:

```text
/mcp
```

Get server details:

```powershell
claude mcp get server-name
```

Remove a server:

```powershell
claude mcp remove server-name
```

---

# 19. Add a Remote MCP Server

General syntax:

```powershell
claude mcp add --transport http <name> <url>
```

Example:

```powershell
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Then:

```powershell
claude mcp list
```

Inside Claude:

```text
/mcp
```

---

# 20. Project MCP Configuration

For a project-shared MCP:

```powershell
claude mcp add --transport http shared-server --scope project https://example.com/mcp
```

Claude can create:

```text
.mcp.json
```

Example:

```json
{
  "mcpServers": {
    "shared-server": {
      "type": "http",
      "url": "https://example.com/mcp"
    }
  }
}
```

Do not put secrets directly into `.mcp.json`.

Prefer:

- environment variables
- OAuth
- secret management
- restricted service accounts

---

# 21. Local MCP Server

General form:

```powershell
claude mcp add <name> -- <program> <arguments>
```

Example:

```powershell
claude mcp add brown-db -- node server.js
```

Or:

```powershell
claude mcp add my-tool -- npx -y some-mcp-package
```

The `--` separates Claude arguments from the MCP program command.

---

# 22. Database MCP Safety

Do not start with production root credentials.

Safer:

```text
Claude
  ↓
DB MCP
  ↓
DEV Database
  ↓
Read-only user
```

Prefer a DB account that initially allows only:

```sql
SELECT
```

Avoid immediately giving:

```text
DROP
DELETE
ALTER
UPDATE
INSERT
```

Never store production credentials directly in:

```text
CLAUDE.md
SKILL.md
.mcp.json
settings.json
```

---

# 23. Layer 6 — Plugins

Plugins package reusable Claude Code extensions.

A plugin can include:

```text
Skills
Agents
Hooks
MCP servers
Commands
Configuration
```

Use plugins when you want to reuse the same development kit across many repositories.

---

# 24. Install Existing Plugins

Inside Claude Code:

```text
/plugin
```

Typical installation form:

```text
/plugin install <plugin-name>@claude-plugins-official
```

Use the plugin browser to review:

```text
Discover
Installed
Marketplaces
Errors
```

Always inspect what a third-party plugin does before giving it permissions.

---

# 25. Create Your Own Plugin

Example:

```text
brown-backend-kit/
│
├── .claude-plugin/
│   └── plugin.json
│
├── skills/
│   ├── api-review/
│   │   └── SKILL.md
│   └── debug-api/
│       └── SKILL.md
│
├── agents/
│   ├── code-reviewer.md
│   └── test-runner.md
│
├── hooks/
│   ├── hooks.json
│   └── validate-php.ps1
│
└── .mcp.json
```

---

# 26. plugin.json

Create:

```text
brown-backend-kit/.claude-plugin/plugin.json
```

Example:

```json
{
  "name": "brown-backend-kit",
  "version": "1.0.0",
  "description": "Backend development tools for API implementation, review and testing.",
  "author": {
    "name": "Backend Team"
  }
}
```

---

# 27. Test a Plugin Locally

Use:

```powershell
claude --plugin-dir .\brown-backend-kit
```

A Skill from the plugin may appear namespaced, for example:

```text
/brown-backend-kit:api-review
```

This lets you test before publishing or installing the plugin permanently.

---

# 28. Agent Teams

Agent Teams are different from normal subagents.

A subagent is a specialist helper.

An Agent Team runs several Claude workers in parallel.

Example:

```text
                      TEAM LEAD
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
     Backend          Testing          Reviewer
      Agent            Agent            Agent
        │                │                │
        └────────────────┼────────────────┘
                         │
                  Shared task list
                         │
                  Agent messaging
```

Use Agent Teams for larger work such as:

- backend + frontend + tests
- large refactor
- migration analysis
- API implementation plus independent review
- parallel exploration of a large codebase

---

# 29. Enable Agent Teams

In:

```text
.claude/settings.local.json
```

Example:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"
}
```

For Windows, `in-process` is generally the safest choice.

---

# 30. Start an Agent Team

Example prompt:

```text
We need to add a new payment API.

Create an agent team with 3 teammates:

1. backend
   Analyze and implement the API.

2. tester
   Build tests and verify edge cases.

3. reviewer
   Review security, SQL, and API compatibility.

Backend and tester may work in parallel where possible.

Reviewer should wait until implementation is available.

The lead should integrate the final result and report remaining risks.
```

---

# 31. Subagents vs Agent Teams

| Situation | Use |
|---|---|
| One independent review | Subagent |
| Large code search | Subagent |
| Run tests separately | Subagent |
| Backend + frontend + tests in parallel | Agent Team |
| Agents need to communicate | Agent Team |
| Simple bug fix | Main Claude |
| Repeatable procedure | Skill |

Do not use an Agent Team for a one-function bug fix.

---

# 32. Full Workflow Example

Suppose you ask:

```text
Implement POST /api/v1/rewards/claim.

Requirements:

- authenticated users only
- prevent duplicate claim
- transaction-safe
- existing response format
- add tests
```

The system can behave like this:

```text
USER
 │
 │ Implement rewards claim
 ▼
CLAUDE.md
 │
 │ Reads project rules
 │
 ▼
MAIN CLAUDE
 │
 ├──── Skill: API review
 │
 ├──── Explorer agent
 │       maps existing reward code
 │
 ├──── Main implementation
 │
 ├──── PostToolUse hook
 │       validates PHP
 │
 ├──── Test-runner agent
 │       runs tests
 │
 ├──── Code-reviewer agent
 │       reviews diff
 │
 └──── MCP
         can access external services
```

---

# 33. Recommended Development Workflow

## Phase A — Understand

```text
Do not modify code yet.

Analyze this feature.

Identify:

- affected files
- database tables
- existing patterns
- risks
- edge cases

Then propose an implementation plan.
```

## Phase B — Implement

```text
Implement the approved plan.

Keep changes minimal.

Do not refactor unrelated files.
```

## Phase C — Verify

```text
Use the test-runner agent to verify the implementation.
```

## Phase D — Review

```text
Use the code-reviewer agent to review the final diff.
```

## Phase E — Correct

```text
Fix Critical and High findings only.

Do not make unrelated improvements.
```

## Phase F — Final Verification

```text
Run final verification.

Show:

- changed files
- tests
- remaining risks
- migration impact
```

---

# 34. What Goes Where?

## CLAUDE.md

Use when:

```text
"I want Claude to know this all the time."
```

Examples:

- architecture
- naming conventions
- API response format
- coding rules
- repository map

---

## Skill

Use when:

```text
"I want Claude to know how to do this."
```

Examples:

- API review
- deployment checklist
- create migration
- release process
- debugging workflow

---

## Hook

Use when:

```text
"This must happen automatically."
```

Examples:

- run formatter
- run `php -l`
- block force push
- execute tests before push
- validate generated files

---

## Subagent

Use when:

```text
"I want another specialist to handle this separately."
```

Examples:

- code review
- testing
- architecture exploration
- security review

---

## MCP

Use when:

```text
"Claude needs access to something outside the repository."
```

Examples:

- GitHub
- databases
- Sentry
- Notion
- internal APIs
- custom services

---

## Plugin

Use when:

```text
"I want to distribute my Claude setup."
```

Examples:

- company backend toolkit
- shared review agents
- shared Skills
- standard Hooks
- reusable MCP configuration

---

## Agent Team

Use when:

```text
"I want multiple Claude workers working in parallel."
```

Examples:

- backend implementation
- frontend implementation
- testing
- review
- documentation

---

# 35. Recommended Setup Order

Do not build everything at once.

Recommended progression:

```text
Day 1
Claude Code
↓
CLAUDE.md

Day 2
permissions
↓
protect .env
↓
block dangerous commands

Day 3
/api-review Skill

Day 4
code-reviewer Subagent
test-runner Subagent

Day 5
PostToolUse validation Hook

Later
MCP

Much later
Plugin packaging

Only for large tasks
Agent Teams
```

---

# 36. Minimum Production-Useful Setup

A strong minimum setup is:

```text
project/
│
├── CLAUDE.md
│
└── .claude/
    │
    ├── settings.json
    │
    ├── skills/
    │   └── api-review/
    │       └── SKILL.md
    │
    ├── agents/
    │   ├── code-reviewer.md
    │   └── test-runner.md
    │
    └── hooks/
        └── validate-php.ps1
```

This gives you:

```text
Persistent project knowledge        ✔
Repeatable API procedure            ✔
Automatic PHP validation            ✔
Independent code review             ✔
Separate test verification          ✔
Dangerous command protection        ✔
Cleaner main context                ✔
Team-shareable configuration        ✔
```

You do not need MCP, plugins, or Agent Teams until you have a concrete reason for them.

---

# 37. Recommended `.gitignore`

Example:

```gitignore
# Local Claude settings
.claude/settings.local.json

# Environment files
.env
.env.*

# Secrets
secrets/
*.pem
*.key
```

Be careful before ignoring shared Claude configuration.

Usually you may want to commit:

```text
CLAUDE.md
.claude/settings.json
.claude/skills/
.claude/agents/
.claude/hooks/
```

and keep developer-specific settings private:

```text
.claude/settings.local.json
```

---

# 38. Example Final Repository

```text
my-api/
│
├── CLAUDE.md
├── .gitignore
│
├── .mcp.json
│
├── .claude/
│   ├── settings.json
│   ├── settings.local.json
│   │
│   ├── skills/
│   │   ├── api-review/
│   │   │   ├── SKILL.md
│   │   │   └── references/
│   │   │       └── api-standard.md
│   │   │
│   │   └── debug-api/
│   │       └── SKILL.md
│   │
│   ├── agents/
│   │   ├── explorer.md
│   │   ├── code-reviewer.md
│   │   └── test-runner.md
│   │
│   └── hooks/
│       └── validate-php.ps1
│
├── api/
├── helper/
├── config/
└── tests/
```

---

# 39. Final Mental Model

```text
CLAUDE.md
   ↓
sets the rules and context

Skills
   ↓
provide reusable expertise

Hooks
   ↓
enforce automatic behavior

Subagents
   ↓
handle isolated specialist work

MCP
   ↓
connects external systems

Plugins
   ↓
package and distribute the setup

Agent Teams
   ↓
coordinate multiple Claude workers
```

---

# 40. Useful Commands Cheat Sheet

```text
# Start Claude
claude

# Initialize project
/init

# Show context
/context

# Permissions
/permissions

# MCP
/mcp

# Plugins
/plugin
```

PowerShell:

```powershell
# Claude version
claude --version

# MCP servers
claude mcp list

# Get MCP server
claude mcp get <name>

# Remove MCP server
claude mcp remove <name>

# Test local plugin
claude --plugin-dir .\your-plugin
```

---

# 41. Best-Practice Rule

Use this rule whenever you are unsure where something belongs:

```text
FACT / CONVENTION
    → CLAUDE.md

PROCEDURE
    → SKILL

AUTOMATIC ENFORCEMENT
    → HOOK

SEPARATE SPECIALIST WORK
    → SUBAGENT

EXTERNAL TOOL OR SERVICE
    → MCP

REUSABLE DISTRIBUTION PACKAGE
    → PLUGIN

PARALLEL MULTI-AGENT WORK
    → AGENT TEAM
```

That is the core architecture behind the **Claude Code Agent Development Kit**.
