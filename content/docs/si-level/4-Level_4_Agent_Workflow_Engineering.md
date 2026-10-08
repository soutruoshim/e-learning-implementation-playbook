---
title: "Level 4 — Agent & Workflow Engineering"
---

# Level 4 — Agent & Workflow Engineering

## Primary Objective

Orchestrate multi-step processes, manage explicit state transitions, and trigger external actions.

---

# Core Competencies

## 1. Workflow Orchestration

Learn how to design AI-enabled workflows that execute multiple steps in a controlled sequence.

### Key Focus

- Execution branching
- Checkpoints
- Retries
- Overall state management

### Conceptual Flow

```text
Start
  ↓
Step 1
  ↓
Decision
 ├── Path A
 │    ↓
 │  Step 2A
 │
 └── Path B
      ↓
    Step 2B
      ↓
Checkpoint
      ↓
Continue / Retry / Stop
```

The main idea is that the workflow itself should be explicit and controlled by application logic.

---

## 2. Explicit State Management

A multi-step AI workflow should know exactly what state it is currently in.

### Example States

```text
NEW
IN_PROGRESS
WAITING_FOR_REVIEW
APPROVED
REJECTED
FAILED
COMPLETED
```

### Example State Flow

```text
NEW
 ↓
IN_PROGRESS
 ↓
WAITING_FOR_REVIEW
 ├── APPROVED
 │     ↓
 │  COMPLETED
 │
 └── REJECTED
       ↓
     STOPPED
```

### Why State Matters

Without explicit state management, workflows become difficult to:

```text
Resume
Debug
Audit
Retry
Monitor
Control
```

---

## 3. Branching Logic

Workflows often need different paths depending on data or results.

### Example

```text
Customer Support Request
        ↓
Classify Issue
        ↓
Priority?
 ┌─────────────┬─────────────┐
 │ Normal      │ High Risk   │
 │             │             │
 │ Auto Flow   │ Human Review│
 └─────────────┴─────────────┘
```

The AI may help classify or interpret the situation, but the branch decision should be represented clearly in workflow logic.

---

## 4. Checkpoints

A checkpoint records progress so a workflow can stop and later resume safely.

### Example

```text
Step 1: Receive request
Step 2: Analyze request
Step 3: Create proposed action
Step 4: WAIT FOR APPROVAL
Step 5: Execute approved action
```

The workflow should persist enough information to resume from Step 4 instead of restarting from the beginning.

### Checkpoint Data May Include

```text
workflow_id
current_state
current_step
input_data
intermediate_results
approval_status
retry_count
updated_at
```

---

## 5. Retry Handling

Individual workflow steps can fail.

### Example

```text
Call External API
    ↓
Failure
    ↓
Retry Policy
    ↓
Success?
 ├── Yes → Continue
 └── No  → Mark Step Failed
```

Retries should be controlled and bounded.

### Important

Do not retry every failure blindly.

For example:

```text
Temporary network error
→ retry may be appropriate

Permission denied
→ retry is usually not appropriate
```

---

## 6. Workflow Failure Handling

A production workflow needs a clear failure strategy.

### Possible Outcomes

```text
Retry step
Skip optional step
Fallback
Escalate to human
Stop workflow
Mark workflow failed
```

### Example

```text
Tool Call
   ↓
Fails 3 times
   ↓
Set state = FAILED
   ↓
Create support alert
```

---

# Multi-Agent Coordination

## 7. What Multi-Agent Coordination Means

The roadmap describes distributing specialized sub-tasks to separate agent roles.

Instead of one AI component trying to do everything:

```text
One General Agent
```

you can divide responsibilities:

```text
Classifier Agent
Research Agent
Drafting Agent
Review Agent
```

Each agent should have a narrow role.

---

## 8. Example Multi-Agent Flow

```text
Customer Request
      ↓
Coordinator
      ↓
Classifier Agent
      ↓
Research Agent
      ↓
Drafting Agent
      ↓
Review Agent
      ↓
Final Result
```

The coordinator controls how tasks move between roles.

---

## 9. Agent Role Boundaries

Each agent should have:

```text
Clear purpose
Allowed inputs
Expected outputs
Allowed tools
Permission scope
Failure behavior
```

### Example

#### Classifier Agent

```text
Purpose:
Identify request category and priority.

Allowed Tools:
None

Output:
Structured classification JSON
```

#### Research Agent

```text
Purpose:
Gather relevant internal information.

Allowed Tools:
Read-only search tools

Output:
Relevant evidence and citations
```

#### Drafting Agent

```text
Purpose:
Create a proposed response.

Allowed Tools:
None

Output:
Draft response
```

#### Review Agent

```text
Purpose:
Check whether the draft follows policy.

Allowed Tools:
Read-only policy lookup

Output:
APPROVE / REVISE
```

---

## 10. Coordinator Responsibility

The coordinator should handle:

```text
Task assignment
Step ordering
State transitions
Retries
Timeouts
Agent outputs
Failure handling
Human approval gates
```

Do not allow agents to coordinate themselves without application-level control when reliability matters.

---

# Human-in-the-Loop Integration

## 11. Human Approval Gates

The roadmap explicitly requires compulsory review checkpoints before destructive or high-risk actions.

### Conceptual Flow

```text
AI Proposes Action
      ↓
Application Validates
      ↓
Human Review Required?
      ├── No → Continue
      └── Yes
            ↓
        WAITING_FOR_REVIEW
            ↓
        Human Decision
         ├── Approve
         └── Reject
```

---

## 12. High-Risk Actions

Examples of actions that should often require human approval:

```text
Refunding money
Cancelling orders
Changing customer balances
Deleting records
Updating permissions
Sending sensitive communications
Executing irreversible operations
```

The roadmap does not provide a complete list, but the core requirement is that destructive or high-risk actions should have compulsory employee review checkpoints.

---

## 13. Approval Data

A human review step should record:

```text
workflow_id
action
proposed_payload
reviewer_id
decision
review_comment
reviewed_at
```

This makes the workflow auditable.

---

# Level 4 Workflow Architecture

A high-level architecture may look like:

```text
User / Event
    ↓
Workflow API
    ↓
Workflow Orchestrator
    ↓
State Store
    ↓
Task / Agent Execution
    ↓
Checkpoint
    ↓
Human Approval Gate
    ↓
External Action
    ↓
Final State
```

---

# State Store

The workflow needs persistent state.

A conceptual table:

```text
ai_workflows
```

Possible fields:

```text
id
workflow_id
workflow_type
current_state
current_step
status
input_payload
context_payload
retry_count
created_at
updated_at
completed_at
```

---

# Workflow Step Table

A separate step history can help with traceability.

```text
ai_workflow_steps
```

Possible fields:

```text
id
workflow_id
step_name
step_status
attempt
input_payload
output_payload
error_code
started_at
completed_at
```

---

# Human Approval Table

```text
ai_workflow_approvals
```

Possible fields:

```text
id
workflow_id
step_name
reviewer_id
decision
comment
created_at
reviewed_at
```

---

# Example Customer Support Workflow

The roadmap's Level 4 deliverable is a multi-step customer-support resolution workflow with human approval gates.

## Example User Request

```text
I was charged twice for the same order.
Please refund one payment.
```

## Workflow

```text
1. Receive support request

2. Classify issue

3. Retrieve relevant transaction information

4. Determine whether duplicate charge evidence exists

5. Draft recommended resolution

6. Create proposed refund action

7. Stop at human approval gate

8. Employee reviews evidence and proposed action

9. If approved:
      execute refund workflow

10. If rejected:
      return to manual support

11. Mark workflow complete
```

---

# Example State Flow

```text
NEW
 ↓
CLASSIFYING
 ↓
GATHERING_DATA
 ↓
PREPARING_RESOLUTION
 ↓
WAITING_FOR_REVIEW
 ├── APPROVED
 │     ↓
 │  EXECUTING_ACTION
 │     ↓
 │  COMPLETED
 │
 └── REJECTED
       ↓
     MANUAL_HANDLING
```

---

# Human Review Example

### Proposed Action

```json
{
  "action": "REFUND",
  "transaction_id": "TXN-1001",
  "amount": 12.50,
  "reason": "Duplicate charge detected"
}
```

### Workflow State

```text
WAITING_FOR_REVIEW
```

### Human Decision

```json
{
  "decision": "APPROVE",
  "reviewer_id": "EMP-009",
  "comment": "Duplicate payment confirmed."
}
```

Only after approval should the workflow continue.

---

# External Actions

Level 4 is where workflows may begin triggering external actions.

Examples:

```text
Send notification
Create ticket
Update support case
Trigger refund service
Request manager approval
Send email
Call internal workflow API
```

These actions should still pass through normal backend controls.

---

# Tool Execution Boundary

A safe design:

```text
Agent
 ↓
Proposed Action
 ↓
Application Validation
 ↓
Permission Check
 ↓
Human Approval if required
 ↓
Tool / API Execution
```

Not:

```text
Agent
 ↓
Direct unrestricted execution
```

---

# Idempotency in Workflows

If a workflow resumes or retries, an action should not be executed twice accidentally.

Example:

```text
Refund Step
 ↓
API call succeeds
 ↓
Network response lost
 ↓
Workflow retries
```

Without idempotency:

```text
Refund may happen twice
```

Use an idempotency key or transaction reference.

```text
workflow_id + step_name
```

can form part of an idempotency strategy.

---

# Workflow Timeouts

A workflow may remain waiting too long.

Examples:

```text
Human review pending for 48 hours
External API never responds
Tool execution gets stuck
```

You should define timeout behavior.

Example:

```text
WAITING_FOR_REVIEW
      ↓
24-hour timeout
      ↓
Escalate to supervisor
```

---

# Workflow Observability

Track:

```text
workflow_id
workflow_type
current_state
current_step
step_duration
retry_count
agent_used
tool_used
approval_status
failure_reason
total_duration
```

This makes debugging much easier.

---

# Level 4 Practical Deliverable

## Multi-Step Customer Support Resolution Workflow

The finished Level 4 project should demonstrate:

```text
Multi-step execution
Explicit workflow state
Branching
Checkpoints
Retries
Failure handling
Specialized agent roles
Human approval gates
External action triggering
Audit trail
```

---

# Recommended Level 4 Project Structure

```text
src/
│
├── Controllers/
│   └── WorkflowController.php
│
├── Workflows/
│   └── CustomerSupportWorkflow.php
│
├── Orchestration/
│   ├── WorkflowEngine.php
│   ├── StateManager.php
│   ├── StepRunner.php
│   └── RetryPolicy.php
│
├── Agents/
│   ├── ClassifierAgent.php
│   ├── ResearchAgent.php
│   ├── DraftingAgent.php
│   └── ReviewAgent.php
│
├── Approvals/
│   ├── ApprovalService.php
│   └── ApprovalRepository.php
│
├── Tools/
│   ├── ToolRegistry.php
│   └── ToolExecutor.php
│
├── Repositories/
│   ├── WorkflowRepository.php
│   ├── WorkflowStepRepository.php
│   └── ApprovalRepository.php
│
└── Tests/
    ├── Unit/
    ├── Integration/
    └── Workflow/
```

---

# Level 4 Learning Checklist

Before considering Level 4 complete, you should be comfortable with:

- [ ] Designing multi-step workflows
- [ ] Defining explicit workflow states
- [ ] Implementing state transitions
- [ ] Implementing branching logic
- [ ] Adding checkpoints
- [ ] Resuming workflows from checkpoints
- [ ] Implementing retry policies
- [ ] Handling failed workflow steps
- [ ] Coordinating specialized agent roles
- [ ] Defining clear agent boundaries
- [ ] Controlling agent execution through an orchestrator
- [ ] Adding human approval gates
- [ ] Preventing destructive actions before approval
- [ ] Recording reviewer decisions
- [ ] Triggering external actions safely
- [ ] Maintaining workflow audit history
- [ ] Applying idempotency to workflow actions
- [ ] Monitoring workflow states and failures

---

# Level 4 Final Goal

By the end of Level 4, your system should evolve from:

```text
User
 ↓
AI Assistant
 ↓
Single Response
```

into:

```text
User / Event
     ↓
Workflow Orchestrator
     ↓
Explicit State Machine
     ↓
Specialized Agents / Tasks
     ↓
Checkpoints
     ↓
Human Approval
     ↓
External Action
     ↓
Final Outcome
```

The objective is to build controlled AI workflows that can coordinate multiple steps, maintain state, recover from failure, distribute work across specialized roles, and require humans to approve destructive or high-risk actions.
