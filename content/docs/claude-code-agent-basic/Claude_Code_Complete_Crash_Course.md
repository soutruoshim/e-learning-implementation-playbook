---
title: "Claude Code Crash Course for Developers"
description: "Practical guide to using Claude Code CLI, tool use, permissions, diff reviews, and VS Code workflows."
---

# Claude Code Crash Course for Developers

> Based on the uploaded **Claude Code Crash Course For Developers** PDF for the first section, then completed with additional practical guidance for the topics the PDF mentions but does not fully cover.

---

## Table of Contents

1. [What Claude Code Is](#1-what-claude-code-is)
2. [Install Claude Code](#2-install-claude-code)
3. [Open the Correct Project Directory](#3-open-the-correct-project-directory)
4. [Login and Authentication](#4-login-and-authentication)
5. [Slash Commands](#5-slash-commands)
6. [Usage and Model Selection](#6-usage-and-model-selection)
7. [Effort / Reasoning Level](#7-effort--reasoning-level)
8. [Use Claude Code in VS Code](#8-use-claude-code-in-vs-code)
9. [Your First Coding Task](#9-your-first-coding-task)
10. [Claude Code Tools](#10-claude-code-tools)
11. [Review Diffs Before Accepting](#11-review-diffs-before-accepting)
12. [Permission Modes](#12-permission-modes)
13. [Shell Mode](#13-shell-mode)
14. [Referencing Files with @](#14-referencing-files-with-)
15. [Side Questions with /btw](#15-side-questions-with-btw)
16. [Claude Code Modes](#16-claude-code-modes)
17. [Permissions](#17-permissions)
18. [Project vs User Settings](#18-project-vs-user-settings)
19. [VS Code Extension](#19-vs-code-extension)
20. [Refactoring Workflow](#20-refactoring-workflow)
21. [Context Window](#21-context-window)
22. [CLAUDE.md](#22-claudemd)
23. [Skills](#23-skills)
24. [MCP](#24-mcp)
25. [Subagents](#25-subagents)
26. [Hooks](#26-hooks)
27. [Testing and Verification](#27-testing-and-verification)
28. [Context Management](#28-context-management)
29. [Checkpoints and Rewind](#29-checkpoints-and-rewind)
30. [Git Workflow](#30-git-workflow)
31. [Useful CLI Commands](#31-useful-cli-commands)
32. [Recommended Project Structure](#32-recommended-project-structure)
33. [Real PHP Example](#33-real-php-example)
34. [Recommended Learning Order](#34-recommended-learning-order)
35. [Complete Mental Model](#35-complete-mental-model)

---

# Part 1 — Content Covered by the Uploaded PDF

## 1. What Claude Code Is

Claude Code is an agentic coding tool that works directly with your development environment.

Unlike a normal chatbot, Claude Code can work inside your codebase.

It can:

- Read files
- Create files
- Edit files
- Search files
- Run terminal commands
- Run applications
- Inspect errors
- Refactor code
- Work with Git
- Use external tools
- Use skills and MCP integrations
- Delegate work to agents

Conceptually:

```text
Your Project
│
├── index.js
├── package.json
├── src/
│   ├── api.js
│   ├── format.js
│   └── table.js
│
└── Claude Code
     │
     ├── Read files
     ├── Search files
     ├── Edit files
     ├── Create files
     ├── Run terminal commands
     └── Run/test application
```

Instead of copying code between a chatbot and VS Code, you can give Claude a task directly:

```text
Find why the login endpoint returns 500.

Fix the problem.

Do not change unrelated code.

Run the relevant test when finished.
```

---

## 2. Install Claude Code

Install Claude Code using the current installation instructions from Anthropic.

After installation, verify it:

```bash
claude --version
```

The PDF transcription contains spelling errors such as:

```text
clod
Cloud Code
```

The intended tool name is:

```text
Claude Code
```

---

## 3. Open the Correct Project Directory

Claude Code works relative to the directory where you launch it.

Example:

```powershell
cd C:\xampp\htdocs\central_api_git_local
claude
```

This means Claude works inside:

```text
central_api_git_local/
```

This is safer than launching it from:

```text
C:\
```

or:

```text
C:\xampp\htdocs
```

Recommended:

```text
C:\xampp\htdocs\central_api_git_local
                         ↑
                   Start Claude here
```

---

## 4. Login and Authentication

The first time Claude Code runs, you may need to authenticate.

Inside Claude Code:

```text
/login
```

Logout:

```text
/logout
```

After starting, Claude may show information such as:

```text
Version
Working directory
Model
Context window
Plan
```

---

## 5. Slash Commands

Type:

```text
/
```

to see available commands.

Useful commands include:

```text
/model
/usage
/effort
/context
/permissions
/login
/logout
```

The exact command set can change by Claude Code version.

Use:

```text
/help
```

to inspect the current installation.

---

## 6. Usage and Model Selection

Use:

```text
/model
```

to choose a model.

Use:

```text
/usage
```

to inspect usage.

The PDF explains that different models consume different amounts of available usage.

General idea:

```text
Simple task
   ↓
lighter model

Complex architecture/debugging
   ↓
stronger model
```

Example:

```text
Rename a variable
```

does not need the same level of reasoning as:

```text
Analyze this reward system for race conditions.
```

---

## 7. Effort / Reasoning Level

Use:

```text
/effort
```

if your Claude Code version supports effort selection.

General idea:

```text
Low / Medium
    ↓
Simple task

High
    ↓
Debugging / refactoring

Higher
    ↓
Architecture / complex bugs
```

For PHP work:

```text
Correct variable name
       ↓
Medium

Fix SQL query
       ↓
Medium / High

Debug transaction flow
       ↓
High

Analyze full reward architecture
       ↓
High
```

---

## 8. Use Claude Code in VS Code

A useful development layout:

```text
┌────────────────────────────────────────────┐
│ VS Code                                    │
├──────────────┬─────────────────────────────┤
│ Explorer     │ PHP Code                    │
│              │                             │
│ api/         │ function reward(...)        │
│ functions/   │ {                           │
│ config/      │     ...                     │
│              │ }                           │
├──────────────┴─────────────────────────────┤
│ Terminal / Claude Code                     │
│ > claude                                   │
└────────────────────────────────────────────┘
```

Open the integrated terminal and run:

```powershell
claude
```

---

## 9. Your First Coding Task

The PDF demonstration asks Claude to build a small Node.js script.

Example prompt:

```text
Create a Node script index.js that fetches the top five
crypto prices from the CoinGecko API and prints them in
a clean table with:

- name
- current price
- 24-hour change

Keep the code clean and simple.
```

Claude then inspects the directory and creates the required code.

---

## 10. Claude Code Tools

Important tools include:

```text
Read
Write
Edit
Bash
Grep
WebFetch
```

### Read

Claude reads a file:

```text
functions/reward.php
```

### Grep / Search

Example:

```text
Find everywhere earnSpinTickets is used.
```

Claude searches the project.

### Edit

Claude modifies existing code.

Example:

```php
$amount = $total;
```

to:

```php
$amount = (float) $total;
```

### Write

Claude creates new files.

Example:

```text
src/api.js
```

### Bash

Claude can run commands such as:

```bash
npm test
```

```bash
php -l index.php
```

```bash
git status
```

---

## 11. Review Diffs Before Accepting

Always review Claude's proposed changes.

Example:

```diff
+ function getCustomer()
+ {
+     ...
+ }
```

Refactoring may show:

```diff
- old code
+ new code
```

Recommended workflow:

```text
Claude proposes change
        ↓
Read diff
        ↓
Understand change
        ↓
Accept
        ↓
Run/test
        ↓
git diff
        ↓
Commit
```

Avoid:

```text
Claude proposes
       ↓
Accept everything
       ↓
Push production
```

---

## 12. Permission Modes

In default mode Claude may ask before:

```text
Creating a file
Running a command
Editing code
```

For beginners, this is safer.

Example:

```text
Claude:
Do you want to create index.js?

You:
Yes
```

Then:

```text
Claude:
Do you want to run node index.js?

You:
Yes
```

---

## 13. Shell Mode

The PDF shows shell mode using:

```text
!
```

Example:

```text
!node index.js
```

For PHP:

```text
!php -v
```

```text
!git status
```

```text
!git diff
```

```text
!composer install
```

Be careful with destructive commands.

---

## 14. Referencing Files with @

Use:

```text
@filename
```

to explicitly reference files.

Example:

```text
Review @functions/digital_stamp.php
```

A stronger prompt:

```text
Review @estamp_functions.php.

Focus on estamp_reset_progress_if_expired().

Explain:

1. when progress expires
2. when RESET is inserted
3. what happens if the target is already completed
4. whether reward assignment can happen twice

Do not modify anything yet.
```

---

## 15. Side Questions with /btw

Use:

```text
/btw
```

for side questions.

Example:

```text
/btw what does SELECT ... FOR UPDATE protect us from?
```

Then continue the original task.

---

## 16. Claude Code Modes

Modes may include behavior similar to:

```text
Normal
Accept Edits
Plan
Auto / Autonomous
```

### Normal Mode

Claude asks before important changes.

```text
Claude
 ↓
Proposes edit
 ↓
You approve
 ↓
Claude edits
```

### Accept Edits Mode

Claude can edit without asking every time.

### Plan Mode

Claude analyzes and plans without editing code.

Example:

```text
I need to add an e-stamp campaign expiration system.

Study the current implementation.

Create a plan.

Do not modify files.
```

### Autonomous / Auto Mode

Claude receives more freedom to make decisions.

Use this carefully for important production code.

---

## 17. Permissions

Use:

```text
/permissions
```

Permissions conceptually include:

```text
ALLOW
ASK
DENY
```

Example:

```text
git status
```

could be:

```text
ALLOW
```

while:

```text
git push
```

could be:

```text
ASK
```

and:

```text
rm -rf *
```

could be:

```text
DENY
```

Recommended:

```text
ALLOW

git status
git diff
git log
php -l
reading files
searching files
```

```text
ASK

git commit
git push
composer install
npm install
database migrations
commands that modify data
```

```text
DENY

rm -rf *
DROP DATABASE
DROP TABLE
TRUNCATE
force push
```

---

## 18. Project vs User Settings

Settings can apply to:

```text
Project only
```

or:

```text
All projects
```

Conceptually:

```text
User-level
~/.claude/
```

applies across projects.

Project-level configuration:

```text
project/
└── .claude/
```

applies only to that repository.

Local settings can be used for developer-specific configuration that should not be committed.

---

## 19. VS Code Extension

The Claude Code VS Code integration provides a graphical interface for:

```text
Prompting
Adding context
Reviewing files
Reviewing diffs
Switching modes
Using Claude inside the editor
```

A typical layout:

```text
┌──────────────────┬──────────────────────┐
│ Explorer         │ Code                 │
│                  │                      │
│ api              │ digital_stamp.php    │
│ config           │                      │
│ functions        │ function estamp...   │
│                  │                      │
├──────────────────┼──────────────────────┤
│                  │ Claude Code          │
│                  │ > Review this code   │
└──────────────────┴──────────────────────┘
```

---

## 20. Refactoring Workflow

A good refactor prompt includes:

```text
WHAT
WHY
HOW
CONSTRAINTS
```

Example:

```text
Refactor this for readability and maintainability.

Split it into focused modules.

Keep the output identical.

Do not add dependencies.
```

For PHP:

```text
Refactor estamp_reset_progress_if_expired()
for readability and maintainability.

Requirements:

- Keep the public function signature unchanged.
- Preserve existing database behavior.
- Do not rename database columns.
- Do not change API response format.
- Separate validation from reward redemption logic where useful.
- Keep compatibility with existing callers.

Before editing, explain the proposed changes.
```

---

## 21. Context Window

Context is Claude's temporary working memory.

It may include:

```text
Prompts
Claude responses
Files read
Search results
Tool outputs
Commands
Skills
MCP information
System instructions
```

Inspect context:

```text
/context
```

As context grows, older details may become less useful.

A better workflow is feature-based:

```text
Feature A
 ↓
Plan
 ↓
Implement
 ↓
Test
 ↓
Review
 ↓
Commit
 ↓
Finish
```

Then move to the next feature.

---

# Part 2 — Completing the Missing Topics

> The uploaded PDF stops before fully covering the following topics. The rest of this document completes the crash course as a practical developer guide.

---

## 22. CLAUDE.md

`CLAUDE.md` is used to store project instructions that Claude should know whenever it works in the repository.

Example project:

```text
central_api_git_local/
│
├── API/
├── functions/
├── config/
├── CLAUDE.md
└── .claude/
```

Example:

```markdown
# Project

BROWN Coffee Central API.

## Stack

- PHP
- MySQL
- REST APIs
- XAMPP local development

## PHP Conventions

- Preserve compatibility with the project's existing PHP version.
- Follow existing function naming patterns.
- Do not introduce frameworks or Composer packages unless requested.
- Prefer existing helper classes such as DbTable where already used.

## Database Rules

- Never DROP tables.
- Never TRUNCATE tables.
- Never modify production data.
- Never change schema unless explicitly requested.
- Use prepared statements for dynamic SQL.

## API Rules

- Preserve existing response structures.
- Do not expose internal exception messages to clients.
- Preserve backward compatibility unless explicitly requested.

## Git Rules

- Never automatically push.
- Never force push.
- Show git diff before proposing a commit.
- Never commit secrets.

## Testing

After changing PHP files:

- Run PHP syntax validation.
- Review affected execution paths.
- Check git diff.
```

Keep `CLAUDE.md` concise.

Use it for rules Claude should always know.

---

## 23. Skills

A Skill is a reusable workflow.

Example:

```text
.claude/
└── skills/
    └── php-review/
        └── SKILL.md
```

Example skill:

```markdown
---
name: php-review
description: Review PHP backend code for bugs and safety issues
---

Review the requested PHP code.

Check:

1. SQL injection
2. Race conditions
3. Duplicate inserts
4. Incorrect transactions
5. Null handling
6. Status transition errors
7. Incorrect type conversions
8. Error handling
9. API compatibility
10. Security problems

Do not modify files.

Return findings ordered:

CRITICAL
HIGH
MEDIUM
LOW
```

Run it:

```text
/php-review
```

or:

```text
/php-review @functions/digital_stamp.php
```

### CLAUDE.md vs Skills

```text
CLAUDE.md
    ↓
Things Claude should ALWAYS know

Skill
    ↓
Procedure Claude should perform SOMETIMES
```

---

## 24. MCP

MCP means:

```text
Model Context Protocol
```

It allows Claude Code to connect to external tools and systems.

Conceptually:

```text
Claude Code
    │
    ├── Your repository
    ├── GitHub
    ├── Jira
    ├── PostgreSQL
    ├── Monitoring
    ├── Figma
    └── other services
```

Example:

```text
Read Jira ENG-204 and implement the requested feature.
```

Claude could:

```text
Jira
 ↓
Read requirement
 ↓
Read repository
 ↓
Implement code
 ↓
Run tests
 ↓
git diff
```

Useful commands may include:

```bash
claude mcp add
```

and inside Claude:

```text
/mcp
```

### MCP Security

Do not connect untrusted MCP servers.

Be especially careful with:

```text
Production databases
Customer data
Payment information
Authentication tokens
Loyalty balances
Reward systems
```

---

## 25. Subagents

Subagents are specialized Claude workers with separate contexts.

Concept:

```text
                 Main Claude
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
 Debug Agent    Security Agent   DB Agent
       │             │             │
       └─────────────┼─────────────┘
                     ↓
                  Summary
```

Project agents can live in:

```text
.claude/
└── agents/
```

Example:

```text
.claude/
└── agents/
    ├── php-reviewer.md
    ├── database-reviewer.md
    └── debugger.md
```

Example agent:

```markdown
---
name: database-reviewer
description: Reviews MySQL and PHP database logic
tools: Read, Glob, Grep
---

You are a database code reviewer.

Focus on:

- transaction safety
- duplicate writes
- race conditions
- locking
- SELECT FOR UPDATE usage
- indexes
- invalid status transitions
- rollback behavior
- data consistency

Do not modify files.

Return specific findings with file and function references.
```

Use:

```text
Use the database-reviewer agent to analyze the
digital stamp reward assignment flow.
```

### Skills vs Subagents

```text
SKILL
↓
How to perform a task

SUBAGENT
↓
Who performs an isolated task
```

---

## 26. Hooks

Hooks automatically run behavior when certain events happen.

Example:

```text
Claude edits PHP file
       ↓
HOOK
       ↓
php -l file.php
```

Or:

```text
Claude tries rm -rf
       ↓
HOOK
       ↓
BLOCK
```

Hooks are useful because they provide deterministic enforcement.

### Security Hierarchy

```text
CLAUDE.md
     ↓
Natural-language rule

Permissions
     ↓
Allow / Ask / Deny

Hooks
     ↓
Programmatically enforce behavior
```

For critical actions such as:

```text
DROP DATABASE
rm -rf
git push --force
```

use permissions or hooks, not only written instructions.

---

## 27. Testing and Verification

Do not ask Claude only:

```text
Fix this.
```

Better:

```text
Fix this and prove it works.
```

Example:

```text
Fix the duplicate reward issue.

Then:

1. run PHP syntax validation
2. run relevant tests
3. test duplicate execution
4. show the output
```

Professional workflow:

```text
EXPLORE
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
VERIFY
   ↓
COMMIT
```

### Explore

```text
Analyze @functions/estamp.php.

Trace estamp_reset_progress_if_expired().

Do not modify code.
```

### Plan

```text
Create a detailed implementation plan for preventing
double reward assignment.

Identify every function and table that needs changing.

Do not edit anything.
```

### Implement

```text
Implement the approved plan.

Do not change unrelated code.
```

### Verify

```text
Run syntax validation and inspect for:

- duplicate inserts
- race conditions
- transaction issues
- incorrect statuses
```

### Review

```text
Review your own diff as a senior PHP developer.

Do not edit yet.
```

### Commit

```text
Show git diff and suggest a commit message.
```

---

## 28. Context Management

Inspect context:

```text
/context
```

Clear a conversation when appropriate:

```text
/clear
```

Recommended:

```text
Session 1
Digital Stamp
↓
complete
↓
commit
↓
/clear

Session 2
Spin Ticket
↓
complete
↓
commit
↓
/clear
```

Do not clear useful context in the middle of an investigation.

---

## 29. Checkpoints and Rewind

Claude Code can keep checkpoints during a session.

If a change goes wrong, checkpoints can help restore earlier state.

However:

```text
Claude checkpoint
```

is not a replacement for:

```text
git branch
git commit
git diff
```

Git should still be your primary source-control safety system.

---

## 30. Git Workflow

Recommended:

```text
main
 │
 └── feature/digital-stamp-expiry
          ↓
       Claude work
          ↓
       tests
          ↓
       review diff
          ↓
       commit
          ↓
       push
```

Before starting:

```bash
git status
```

Ideally:

```text
nothing to commit, working tree clean
```

Create a branch:

```bash
git checkout -b feature/estamp-reset
```

Useful commands:

```bash
git status
git diff
git log
```

Do not let Claude casually run:

```bash
git push --force
```

---

## 31. Useful CLI Commands

Start Claude:

```bash
claude
```

Start with a prompt:

```bash
claude "fix the build error"
```

One-off prompt:

```bash
claude -p "explain this function"
```

Continue a conversation:

```bash
claude -c
```

Resume a previous conversation:

```bash
claude -r
```

Useful in-session commands:

```text
/help
/clear
/exit
/context
/model
/permissions
/mcp
/login
/btw
```

Available commands can vary by version.

---

## 32. Recommended Project Structure

A mature project might look like:

```text
central_api_git_local/
│
├── CLAUDE.md
│
├── .claude/
│   │
│   ├── settings.json
│   ├── settings.local.json
│   │
│   ├── skills/
│   │   ├── php-review/
│   │   │   └── SKILL.md
│   │   │
│   │   ├── check-api/
│   │   │   └── SKILL.md
│   │   │
│   │   └── review-database/
│   │       └── SKILL.md
│   │
│   ├── agents/
│   │   ├── php-reviewer.md
│   │   ├── database-reviewer.md
│   │   └── debugger.md
│   │
│   └── hooks/
│       └── ...
│
├── API/
├── functions/
├── config/
└── ...
```

This changes Claude from:

```text
AI that generates code
```

into:

```text
AI development environment configured
specifically for your project
```

---

## 33. Real PHP Example

Suppose the issue is:

> A user completes an e-stamp campaign, expiration happens, and reward assignment may happen twice.

### Step 1 — Open Project

```powershell
cd C:\xampp\htdocs\central_api_git_local
claude
```

### Step 2 — Inspect Context

```text
/context
```

### Step 3 — Use Plan Mode

Prompt:

```text
Investigate the digital stamp campaign flow.

Focus on:
estamp_reset_progress_if_expired()

Trace:

- progress creation
- progress expiration
- progress reset
- completion
- reward assignment
- reward redemption

Identify all related tables and functions.

Specifically investigate whether concurrent requests or
repeated calls could assign the same reward twice.

Do not modify anything yet.
```

### Step 4 — Ask for Implementation Plan

```text
Create an implementation plan.

Requirements:

- preserve existing DB schema
- preserve API responses
- preserve existing callers
- prevent duplicate reward assignment
- preserve transaction behavior
```

### Step 5 — Implement

```text
Implement the plan.

Only change the files required by the plan.
```

### Step 6 — Agent Review

```text
Use the database-reviewer subagent to review the changes
for transactions, duplicate inserts and race conditions.

Do not modify anything.
```

### Step 7 — Syntax Validation

```text
Run PHP syntax validation for every modified PHP file.
```

### Step 8 — Diff Review

```text
Show me the complete git diff.

Explain every important change.
```

### Step 9 — Edge Cases

```text
Review the final implementation against these cases:

1. user is incomplete and not expired
2. user is incomplete and expired
3. user completes campaign
4. user completes exactly at expiration
5. reward assignment fails
6. request retries
7. two requests arrive simultaneously
8. reward already exists
9. progress already reset
```

### Step 10 — Commit

```text
Suggest a Git commit message.
```

---

## 34. Recommended Learning Order

### Level 1 — Fundamentals

```text
Claude
Prompts
Read / Edit / Bash
Diff review
Permissions
```

### Level 2 — Professional Workflow

```text
Plan Mode
CLAUDE.md
Context management
Git
Testing
```

### Level 3 — Advanced Features

```text
Skills
Subagents
MCP
Hooks
```

### Level 4 — Automation

```text
Automation
Multiple agents
CI workflows
Advanced hooks
Reusable team configuration
```

Start with:

```text
Claude
→ Plan
→ Edit
→ Test
→ Diff
→ Commit
```

Then add advanced automation.

---

## 35. Complete Mental Model

```text
                     CLAUDE CODE
                          │
            ┌─────────────┼──────────────┐
            │             │              │
         CONTEXT        TOOLS          RULES
            │             │              │
        CLAUDE.md        Read         Permissions
        Skills           Edit         Hooks
        Prompts          Write
        Files            Bash
                         Web
                         MCP
                           │
                    ┌──────┴──────┐
                    │             │
                 Subagents     External
                              Services
```

Your development loop:

```text
Understand requirement
        ↓
Explore code
        ↓
Plan solution
        ↓
Review plan
        ↓
Implement
        ↓
Run tests
        ↓
Review diff
        ↓
Agent review
        ↓
Manual review
        ↓
Commit
        ↓
Push / PR
```

---

# Final Recommendation

For a PHP/MySQL backend project, start by creating:

```text
CLAUDE.md
.claude/settings.json
.claude/skills/php-review/SKILL.md
.claude/skills/check-api/SKILL.md
.claude/agents/database-reviewer.md
.claude/agents/debugger.md
```

Then use this workflow for every meaningful feature:

```text
Understand
   ↓
Plan
   ↓
Implement
   ↓
Verify
   ↓
Review
   ↓
Commit
```

The main goal is not to let AI write code blindly.

The goal is to make Claude Code work like a controlled development assistant that:

- understands your repository,
- follows your rules,
- proposes small changes,
- verifies those changes,
- and leaves you in control of the final result.
