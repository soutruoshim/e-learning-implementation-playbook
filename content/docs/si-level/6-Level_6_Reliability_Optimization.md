---
title: "Level 6 — Reliability & Optimization"
---

# Level 6 — Reliability & Optimization

## Primary Objective

Track system performance, monitor operational behavior, and manage resource expenditures.

---

# Core Competencies

## 1. AI Evaluation Suite

The roadmap requires continuous regression testing to ensure:

- Accuracy
- Safety
- Groundedness
- Appropriate tool selection

The goal is to make AI quality measurable instead of relying on manual impressions.

---

# 2. Continuous Regression Testing

Every meaningful change to the AI system should be evaluated.

Changes may include:

```text
Prompt updates
Model changes
Provider changes
Tool changes
Retrieval changes
Schema changes
Context changes
```

### Conceptual Flow

```text
AI Change
   ↓
Run Evaluation Suite
   ↓
Compare Against Baseline
   ↓
Check Quality Metrics
   ↓
Pass / Fail
```

---

# 3. Accuracy Evaluation

Accuracy measures whether the system produces the expected answer or classification.

Example:

```text
Total Test Cases = 100
Correct Results  = 91
```

Then:

```text
Accuracy = 91%
```

### Formula

```text
Accuracy =
Correct Predictions
-------------------
Total Predictions
```

---

# 4. Safety Evaluation

The roadmap requires testing whether the AI system behaves safely.

Safety evaluation may include checking whether the system:

```text
Follows allowed behavior
Avoids disallowed actions
Rejects unsafe tool execution
Respects authorization boundaries
Does not expose sensitive information
```

The exact safety checks depend on the application.

---

# 5. Groundedness Evaluation

Groundedness measures whether generated answers are actually supported by the source context.

For a RAG system:

```text
Retrieved Documents
        ↓
LLM Answer
        ↓
Groundedness Check
```

A grounded answer should be traceable to retrieved information.

### Bad Example

```text
Retrieved documents:
No information about refund timing.

Model answer:
"Refunds always arrive within 24 hours."
```

That answer is not grounded in the provided source.

---

# 6. Tool Selection Evaluation

The roadmap explicitly requires evaluating appropriate tool selection.

If the assistant has multiple tools:

```text
get_order_status
get_store_info
search_policy
get_customer_profile
```

the evaluation should verify whether the correct tool is selected for each task.

### Example

User asks:

```text
What is the status of order ORD-1001?
```

Expected:

```text
get_order_status
```

Incorrect:

```text
search_policy
```

---

# 7. Evaluation Dataset

Maintain a stable test set.

Example structure:

```json
[
  {
    "input": "What is the status of order ORD-1001?",
    "expected_tool": "get_order_status"
  },
  {
    "input": "What is the refund policy?",
    "expected_tool": "search_policy"
  }
]
```

You can expand this with:

```text
Expected answer
Expected category
Expected source
Expected tool
Expected safety behavior
```

---

# 8. Evaluation Baseline

Before making changes, record a baseline.

Example:

```text
Prompt Version: v2
Model: model-x

Accuracy: 92%
Groundedness: 95%
Correct Tool Selection: 97%
```

After a change:

```text
Prompt Version: v3

Accuracy: 94%
Groundedness: 93%
Correct Tool Selection: 96%
```

Now you can see where quality improved and where it degraded.

---

# Distributed Tracing & Observability

## 9. End-to-End Tracing

The roadmap requires tracing execution pathways across:

- Model endpoints
- Vector databases
- API gateways

### High-Level Trace

```text
Client Request
    ↓
API Gateway
    ↓
Application Service
    ↓
Vector Database
    ↓
LLM Provider
    ↓
Internal Tool
    ↓
Final Response
```

A trace should connect all of these steps using a shared identifier.

---

# 10. Request / Trace ID

Every request should have a traceable identifier.

Example:

```text
trace_id = trc_20261008_001
```

Use it across:

```text
API Gateway
Application logs
LLM calls
Vector searches
Tool calls
Error logs
```

This allows you to follow one request end to end.

---

# 11. Observability Data

Useful operational data may include:

```text
trace_id
request_id
feature
endpoint
model
provider
prompt_version
latency_ms
input_tokens
output_tokens
retrieval_time_ms
tool_time_ms
retry_count
status
error_code
```

---

# 12. Example Trace

```text
trace_id: trc_001

API Gateway
  20 ms

Application
  15 ms

Vector Search
  120 ms

LLM
  850 ms

Tool Call
  140 ms

Final Response
  Total: 1,145 ms
```

Now you can see which component dominates latency.

---

# 13. Centralized Logging

Instead of checking separate machines manually:

```text
Server A logs
Server B logs
Gateway logs
Worker logs
```

send logs to a centralized system.

The exact technology is not specified by the roadmap.

The key requirement is centralized observability across the AI execution path.

---

# Cost & Performance Tuning

## 14. Latency Monitoring

The roadmap explicitly includes:

```text
p50
p95
```

### p50

```text
50% of requests complete within this time.
```

### p95

```text
95% of requests complete within this time.
```

Example:

```text
p50 = 900 ms
p95 = 3,800 ms
```

This means most requests are reasonably fast, but some users experience much slower responses.

---

# 15. Why Percentiles Matter

Average latency can hide slow requests.

Example:

```text
Requests:
0.5 sec
0.6 sec
0.7 sec
0.8 sec
8.0 sec
```

The average may not tell the full story.

Percentiles help identify tail latency.

---

# 16. Token Consumption

The roadmap requires monitoring token consumption.

Track:

```text
Input tokens
Output tokens
Total tokens
```

Example:

```json
{
  "input_tokens": 1200,
  "output_tokens": 250,
  "total_tokens": 1450
}
```

---

# 17. Token Usage by Feature

Track usage by:

```text
Feature
Endpoint
Prompt version
Model
User type
Day
Environment
```

Example:

```text
Feature: Support Assistant

Average input tokens: 1800
Average output tokens: 300
```

This allows you to identify expensive workflows.

---

# 18. Prompt Length Optimization

The roadmap explicitly includes prompt-length efficiency.

### Problem

Large prompts can increase:

```text
Cost
Latency
Context pressure
Noise
```

### Optimization Flow

```text
Current Prompt
     ↓
Identify Repeated Content
     ↓
Remove Unnecessary Instructions
     ↓
Shorten Context
     ↓
Re-evaluate Quality
```

The goal is not to make prompts as short as possible.

The goal is:

```text
Minimum useful context
while preserving quality.
```

---

# 19. Cost Tracking

Track model expenditure.

Conceptually:

```text
Cost =
Input Token Cost
+
Output Token Cost
```

Track by:

```text
Model
Feature
Environment
Day
Month
```

---

# 20. Cost per Request

Example:

```text
Daily requests: 10,000

Average cost per request: $0.002
```

Then:

```text
Daily estimated cost = $20
```

This allows forecasting.

---

# 21. Cost per Feature

Different features may have different cost profiles.

Example:

```text
Feedback Classification
→ small payload
→ low cost

Document Q&A
→ retrieval context
→ larger payload
→ higher cost

Agent Workflow
→ multiple calls
→ highest cost
```

Track these separately.

---

# 22. Performance Budget

Define target thresholds.

Example:

```text
p50 latency < 1.5 sec
p95 latency < 4 sec
Error rate < 1%
Average tokens < 2,000
```

The exact targets depend on your system.

---

# 23. Error Rate Monitoring

Track:

```text
Total requests
Successful requests
Failed requests
Timeouts
Rate-limit errors
Schema failures
Tool failures
```

Example:

```text
10,000 requests

9,850 success
150 failures
```

Failure rate:

```text
1.5%
```

---

# 24. Retry Monitoring

Retries can hide instability.

Example:

```text
Request succeeds
but required 3 retries
```

The user sees success, but the system is unhealthy.

Track:

```text
retry_count
retry_reason
provider
endpoint
```

---

# 25. Model Performance Comparison

If multiple models are available, compare:

```text
Accuracy
Groundedness
Latency
Cost
Tool selection
Failure rate
```

Example:

| Metric | Model A | Model B |
|---|---:|---:|
| Accuracy | 94% | 91% |
| p95 latency | 4.1s | 1.9s |
| Avg cost/request | $0.004 | $0.0015 |

This supports informed model selection.

---

# 26. Optimization Process

A good optimization loop is:

```text
Measure
 ↓
Identify Bottleneck
 ↓
Change One Variable
 ↓
Re-test
 ↓
Compare Against Baseline
 ↓
Keep or Revert
```

Do not optimize blindly.

---

# Telemetry Dashboard

## 27. Key Deliverable

The roadmap's Level 6 deliverable is:

> Establish a comprehensive telemetry and evaluation dashboard to track expenditure and identify performance degradation.

---

# 28. Dashboard Sections

A useful dashboard may contain:

## Reliability

```text
Request volume
Success rate
Error rate
Retry rate
Timeout rate
```

## Performance

```text
p50 latency
p95 latency
p99 latency
Vector retrieval latency
LLM latency
Tool latency
```

## Cost

```text
Input tokens
Output tokens
Total tokens
Cost per request
Daily cost
Monthly cost
Cost per feature
```

## Quality

```text
Accuracy
Groundedness
Tool-selection accuracy
Safety pass rate
Regression test pass rate
```

---

# 29. Example Dashboard View

```text
AI Reliability Dashboard
────────────────────────────

Requests Today:       24,320
Success Rate:         99.2%
Error Rate:            0.8%

p50 Latency:           820 ms
p95 Latency:         3,100 ms

Input Tokens:       18.2M
Output Tokens:       3.4M

Estimated Cost:     $42.70

Accuracy:             94%
Groundedness:         96%
Tool Accuracy:        98%
```

---

# 30. Performance Degradation Detection

Compare current metrics with baseline.

Example:

```text
Normal p95:
2.5 sec

Current p95:
5.8 sec
```

This indicates degradation.

Possible causes:

```text
Provider slowdown
Larger prompts
Vector database slowdown
More tool calls
Retry increase
Traffic increase
```

---

# 31. Alerting

The roadmap does not specify a particular alerting platform, but operational monitoring should detect abnormal behavior.

Possible alerts:

```text
p95 latency too high
Error rate too high
Token usage spike
Cost spike
Groundedness drop
Evaluation failure
Tool-selection regression
```

---

# 32. Reliability Architecture

```text
Users
  ↓
API Gateway
  ↓
Application
  ↓
 ┌──────────────┬───────────────┐
 │ Vector Store │ LLM Provider  │
 └──────────────┴───────────────┘
       ↓                ↓
   Telemetry       Telemetry
       └───────┬────────┘
               ↓
      Central Observability
               ↓
      Evaluation Dashboard
```

---

# 33. Suggested Data Tables

A telemetry system may store data such as:

## ai_request_metrics

```text
id
trace_id
feature
provider
model
prompt_version
status
latency_ms
input_tokens
output_tokens
retry_count
created_at
```

## ai_evaluation_results

```text
id
evaluation_suite
test_case_id
model
prompt_version
accuracy_result
groundedness_result
tool_selection_result
safety_result
created_at
```

## ai_cost_metrics

```text
id
feature
model
input_tokens
output_tokens
estimated_cost
created_at
```

---

# 34. Level 6 Practical Deliverable

Build a telemetry and evaluation dashboard that allows you to inspect:

```text
AI quality
Operational reliability
Latency
Token usage
Cost
Regression results
```

---

# 35. Recommended Level 6 Project Structure

```text
src/
│
├── Observability/
│   ├── TraceService.php
│   ├── MetricsCollector.php
│   └── LogService.php
│
├── Evaluation/
│   ├── EvaluationRunner.php
│   ├── AccuracyEvaluator.php
│   ├── GroundednessEvaluator.php
│   ├── SafetyEvaluator.php
│   └── ToolSelectionEvaluator.php
│
├── Cost/
│   └── CostTracker.php
│
├── Dashboard/
│   └── MetricsApi.php
│
└── Tests/
    ├── Regression/
    ├── Evaluation/
    └── Performance/
```

---

# 36. Level 6 Learning Checklist

Before considering Level 6 complete, you should be comfortable with:

- [ ] Building continuous AI regression tests
- [ ] Measuring accuracy
- [ ] Evaluating safety
- [ ] Evaluating groundedness
- [ ] Evaluating tool-selection quality
- [ ] Maintaining evaluation baselines
- [ ] Using trace IDs
- [ ] Tracing requests end to end
- [ ] Monitoring model endpoints
- [ ] Monitoring vector-database operations
- [ ] Monitoring API-gateway behavior
- [ ] Tracking p50 latency
- [ ] Tracking p95 latency
- [ ] Monitoring token usage
- [ ] Tracking cost per request
- [ ] Tracking cost per feature
- [ ] Optimizing prompt length
- [ ] Detecting performance degradation
- [ ] Building a telemetry dashboard

---

# Level 6 Final Goal

By the end of Level 6, your AI system should evolve from:

```text
AI Service
   ↓
Works in Production
```

into:

```text
AI Service
   ↓
Measured
   ↓
Traced
   ↓
Evaluated
   ↓
Cost Monitored
   ↓
Performance Optimized
   ↓
Regression Protected
```

The goal is to make AI behavior observable, measurable, and continuously evaluated so that quality, reliability, latency, and cost can be controlled over time.
