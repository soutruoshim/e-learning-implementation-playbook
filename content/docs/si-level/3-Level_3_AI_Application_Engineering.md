# Level 3 — AI Application Engineering

## Objective

Move beyond elementary prompting to design scalable, maintainable AI application architectures.

---

# Core Competencies

## 1. Function & Tool Integration

Learn how to connect AI systems to internal backend capabilities in a controlled way.

### Key Focus

- Safely expose internal backend services
- Validate arguments returned by the model
- Keep model-generated arguments untrusted until validated
- Separate tool selection from actual backend execution

### Conceptual Flow

```text
User Request
    ↓
LLM
    ↓
Tool / Function Selection
    ↓
Generated Arguments
    ↓
Argument Validation
    ↓
Authorized Backend Service
    ↓
Result
    ↓
LLM / Application Response
```

### Important Principle

The model may decide which function or tool is appropriate, but your backend remains responsible for:

```text
Validation
Authorization
Permissions
Business rules
Execution
Error handling
Logging
```

### Example

Model proposes:

```json
{
  "tool": "get_order_status",
  "arguments": {
    "order_id": "ORD-10025"
  }
}
```

Your backend should validate:

```text
Is the tool allowed?
Is order_id present?
Is order_id valid?
Is the current user authorized to access this order?
```

Only after these checks should the backend service execute.

---

## 2. Prompt Registry

As AI applications grow, prompts should be managed systematically rather than scattered across controllers and services.

### Goal

Maintain prompts in a dedicated repository or registry.

### Example Structure

```text
prompts/
├── feedback_triage/
│   ├── v1.md
│   ├── v2.md
│   └── v3.md
│
├── support_assistant/
│   ├── v1.md
│   └── v2.md
│
└── order_summary/
    └── v1.md
```

### Recommended Metadata

```text
prompt_id
prompt_version
feature
model
created_at
updated_at
owner
status
```

### Example

```json
{
  "prompt_id": "support_assistant",
  "prompt_version": "2.1.0",
  "model": "model-x",
  "status": "ACTIVE"
}
```

The application should be able to identify exactly which prompt version produced a result.

---

## 3. Payload Optimization

AI requests should not include unnecessary context.

### Objective

Optimize overall context-token usage while preserving enough information for a correct answer.

### Bad Approach

```text
Send:
- entire chat history
- entire customer profile
- all internal documents
- unrelated API data
- repeated instructions
```

### Better Approach

```text
Identify task
   ↓
Select only required context
   ↓
Remove duplicate information
   ↓
Limit conversation history
   ↓
Send optimized payload
```

### Benefits

```text
Lower token usage
Lower cost
Lower latency
Less distraction for the model
Lower chance of irrelevant output
More available context space
```

---

## 4. Context Management

As application complexity grows, context must be intentionally managed.

### Possible Context Sources

```text
System prompt
User request
Conversation history
Retrieved documents
Tool results
User profile data
Application state
```

Do not automatically send everything.

Instead:

```text
Task
 ↓
Determine required context
 ↓
Select relevant data
 ↓
Build request payload
```

---

## 5. Semantic Caching

Semantic caching can reduce repeated AI calls when different user requests have essentially the same meaning.

### Traditional Cache

```text
Input:
"What are your opening hours?"

Cache Key:
Exact text
```

This may miss:

```text
"When do you open?"
```

even though the meaning is similar.

### Semantic Cache

```text
User Query
    ↓
Semantic Representation
    ↓
Search Similar Cached Queries
    ↓
Strong Match?
    ├── Yes → Return Cached Result
    └── No  → Call Model
```

### Goal

Cache common requests to improve:

```text
Latency
Cost
Scalability
Response speed
```

### Important Considerations

Do not reuse cached results when:

```text
Underlying data changed
User permissions differ
User-specific state matters
Freshness is required
The prior answer was generated from different data
```

---

## 6. Smart Routing

Not every request requires the same model.

### Objective

Direct straightforward requests to lighter models and reserve stronger models for more complex tasks.

### Example

```text
Incoming Request
      ↓
Request Classifier
      ↓
Complexity / Task Check
      ↓
 ┌───────────────┬────────────────┐
 │ Simple Task   │ Complex Task   │
 │               │                │
 │ Lighter Model │ Stronger Model │
 └───────────────┴────────────────┘
```

### Example Routing

```text
Simple classification
→ lightweight model

Short summarization
→ lightweight model

Complex reasoning
→ stronger model

High-value analysis
→ stronger model
```

### Benefits

```text
Lower cost
Better latency
Improved capacity
Better use of expensive models
```

---

# Level 3 Application Architecture

A higher-level AI application may look like:

```text
Client
  ↓
API Gateway / Application API
  ↓
Authentication
  ↓
Application Service
  ↓
Request Router
  ├── Cache Lookup
  ├── Prompt Registry
  ├── Context Builder
  └── Model Router
        ↓
     LLM Provider
        ↓
Tool Selection
        ↓
Argument Validation
        ↓
Internal Read-Only API
        ↓
Tool Result
        ↓
Final Response
```

---

# Function / Tool Safety

When exposing internal services, do not give the model unrestricted access.

### Incorrect

```text
LLM
 ↓
Direct database access
```

### Better

```text
LLM
 ↓
Approved tool contract
 ↓
Argument validator
 ↓
Authorization layer
 ↓
Read-only backend API
 ↓
Database
```

This makes the AI application easier to control and audit.

---

# Tool Contract Example

```json
{
  "name": "get_customer_order",
  "description": "Retrieve an order that the current authenticated user is authorized to view.",
  "parameters": {
    "type": "object",
    "required": [
      "order_id"
    ],
    "properties": {
      "order_id": {
        "type": "string"
      }
    }
  }
}
```

After the model produces arguments, validate them before execution.

---

# Read-Only Integration

The roadmap's Level 3 deliverable specifically focuses on an assistant integrated with an internal **read-only** system API.

This is an important design boundary.

### Safe First Stage

```text
AI Assistant
    ↓
Read-only tools
    ↓
Internal APIs
```

Examples:

```text
Get order status
Get menu information
Get product information
Get account information
Get store information
Search internal records
```

At this level, avoid allowing the assistant to directly perform destructive or irreversible actions.

---

# Prompt Registry Flow

```text
Feature Request
     ↓
Prompt ID
     ↓
Prompt Registry
     ↓
Active Version
     ↓
Context Builder
     ↓
LLM Request
```

### Example

```text
Feature:
support_assistant

Active Prompt:
support_assistant_v3

Model:
model-x
```

This allows you to control prompt changes without mixing them into application logic.

---

# Payload Optimization Flow

```text
Raw Available Context
      ↓
Filter Relevant Information
      ↓
Remove Duplicate Content
      ↓
Trim Old / Irrelevant History
      ↓
Select Required Tool Results
      ↓
Build Optimized Payload
      ↓
Send to Model
```

---

# Semantic Cache Flow

```text
User Request
     ↓
Check Semantic Cache
     ↓
Similar Valid Result Found?
     ├── Yes
     │    ↓
     │  Return Cached Result
     │
     └── No
          ↓
        Call Model
          ↓
        Validate Result
          ↓
        Save Cache Entry
```

---

# Smart Routing Flow

```text
Incoming Request
      ↓
Task Detection
      ↓
Complexity Check
      ↓
Model Selection
      ↓
Selected Model
      ↓
Generate Result
```

---

# Key Deliverable

## AI Assistant Integrated with an Internal Read-Only System API

The final Level 3 deliverable is a functional AI assistant connected to internal read-only backend services.

### Example User Request

```text
What is the status of order ORD-10025?
```

### Processing Flow

```text
User
 ↓
Assistant
 ↓
Recognize order-status task
 ↓
Select get_order_status tool
 ↓
Generate arguments
 ↓
Validate order_id
 ↓
Check user authorization
 ↓
Call internal read-only API
 ↓
Receive order status
 ↓
Generate final answer
```

### Example Tool Result

```json
{
  "order_id": "ORD-10025",
  "status": "DONE"
}
```

### Example Final Response

```text
Order ORD-10025 is complete.
```

---

# Recommended Level 3 Project Structure

```text
src/
│
├── Controllers/
│   └── AssistantController.php
│
├── Services/
│   └── AssistantService.php
│
├── AI/
│   ├── Prompts/
│   │   └── PromptRegistry.php
│   │
│   ├── Routing/
│   │   └── ModelRouter.php
│   │
│   ├── Cache/
│   │   └── SemanticCache.php
│   │
│   ├── Context/
│   │   └── ContextBuilder.php
│   │
│   ├── Tools/
│   │   ├── ToolRegistry.php
│   │   ├── ToolValidator.php
│   │   └── GetOrderStatusTool.php
│   │
│   └── Providers/
│       └── LLMClient.php
│
├── InternalApi/
│   └── OrderApiClient.php
│
└── Tests/
    ├── Unit/
    ├── Integration/
    └── Evaluation/
```

---

# Level 3 Learning Checklist

Before considering Level 3 complete, you should be comfortable with:

- [ ] Safely exposing internal backend functionality as tools
- [ ] Defining clear tool contracts
- [ ] Validating model-generated tool arguments
- [ ] Performing authorization before tool execution
- [ ] Keeping the first tool integrations read-only
- [ ] Managing prompts in a prompt registry
- [ ] Versioning prompts systematically
- [ ] Optimizing context payload size
- [ ] Removing unnecessary context
- [ ] Understanding semantic caching
- [ ] Knowing when semantic cache reuse is unsafe
- [ ] Routing simple requests to lighter models
- [ ] Routing complex requests to stronger models
- [ ] Keeping tool execution separate from model reasoning
- [ ] Building an assistant connected to an internal read-only API

---

# Level 3 Final Goal

By the end of Level 3, your application should evolve from:

```text
User
 ↓
Prompt
 ↓
LLM
 ↓
Response
```

into:

```text
User
 ↓
AI Application
 ├── Prompt Registry
 ├── Context Management
 ├── Semantic Cache
 ├── Smart Model Routing
 └── Tool Integration
        ↓
   Internal Read-Only APIs
        ↓
      LLM
        ↓
   Final Response
```

The goal is to design an AI application architecture that is scalable, maintainable, cost-aware, and safely connected to internal backend services.
