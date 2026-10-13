---
title: "PHASE 13 — Service Communication"
---

# PHASE 13 — Service Communication

> **Purpose:** Implement the platform-wide communication standard for all microservices, defining how services exchange commands, queries, events, responses, errors, authentication/authorization context, correlation context, deadlines, retries, failure semantics, and observability through REST, gRPC, and Kafka.
>
> **Previous Phase:** Phase 12 — Wallet Service
>
> **Next Phase:** Phase 14 — Distributed Transactions / Saga
>
> **Primary Architecture Basis:** PART 21 — Service Communication, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 21 itself for communication semantics, PART 22 — Distributed Transactions, PART 23 — Kafka / Event Architecture, PART 30 — Networking / Gateway / TLS, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, REST, gRPC, Kafka, PostgreSQL, Redis where appropriate, OpenTelemetry.
>
> **Status:** Platform Implementation Specification

---

# 1. Phase 13 Goal

Phase 13 does not create a new business domain.

It creates the platform communication standard used by:

```text
Identity
Customer
Catalog
Inventory
Cart
Promotion
Ordering
Payment
Wallet
and all later services
```

It defines how services exchange:

```text
commands
queries
events
responses
errors
correlation context
authentication context
authorization context
trace context
```

---

# 2. Core Principle

The primary rule is:

```text
Choose communication based on business semantics,
not technology preference.
```

Do not choose:

```text
REST because the team already knows REST
gRPC because it is faster
Kafka because the architecture is microservices
```

Choose based on what the business interaction actually means.

---

# 3. Communication Goals

Platform communication should be:

```text
explicit
typed
observable
bounded
resilient
idempotent where required
versionable
secure
```

---

# 4. Communication Anti-Goals

Avoid:

```text
hidden coupling
unbounded retries
long synchronous chains
shared database access
implicit contracts
provider-specific leakage
```

---

# 5. Communication Categories

Primary categories:

```text
Synchronous Request/Response
Asynchronous Command
Asynchronous Event
Streaming
Batch
```

Phase 13 focuses on:

```text
REST
gRPC
Kafka
```

for platform service-to-service communication.

---

# 6. Synchronous Communication

Synchronous means:

```text
caller waits for dependency response
```

Examples:

```text
Order → Catalog validation
Order → Inventory reservation
Order → Payment authorization
Cart → Promotion preview
Gateway → Customer profile
```

---

# 7. Asynchronous Communication

Asynchronous means:

```text
caller does not wait for downstream business processing
```

Examples:

```text
OrderCompleted → Loyalty
OrderCompleted → Mission
OrderReady → Notification
WalletTopUpCompleted → Mission
RewardAssigned → Notification
```

---

# 8. Synchronous Decision Rule

Use synchronous communication when:

```text
caller cannot proceed without the answer
```

Examples:

```text
Can Inventory reserve this stock?
Is this coupon valid right now?
Did Payment authorize?
What is the current Catalog price?
```

---

# 9. Asynchronous Decision Rule

Use asynchronous communication when:

```text
the caller's core transaction is already valid
and downstream work may complete later
```

Examples:

```text
send notification
earn loyalty points
update analytics
progress mission
sync legacy reporting
```

---

# 10. Avoid Synchronous-by-Default

Do not make every service call another service synchronously because RPC is easy.

Long chains create:

```text
latency multiplication
availability multiplication
failure propagation
tight coupling
```

---

# 11. Avoid Event-Driven-by-Default

Do not publish events for simple current-state queries.

Example:

```text
Get current product price
```

is naturally a synchronous query.

Event-driven architecture does not mean:

```text
everything must use Kafka
```

---

# 12. Communication Decision Matrix

| Need | Preferred Pattern |
|---|---|
| Immediate answer required | REST / gRPC |
| Internal typed low-latency RPC | gRPC |
| Public/external-facing API | REST |
| Domain fact broadcast | Kafka Event |
| Fire-and-forget business instruction | Kafka Command where appropriate |
| Large asynchronous workload | Kafka |
| Read current state | REST / gRPC |
| Cross-domain eventual consistency | Kafka |
| Human/admin integration | REST |

---

# 13. REST

REST is preferred for:

```text
client-facing APIs
admin APIs
simple internal APIs
debuggable HTTP workflows
resource-oriented access
```

---

# 14. gRPC

gRPC is preferred for:

```text
internal service-to-service RPC
strongly typed contracts
low latency
high request volume
streaming where genuinely required
```

---

# 15. Kafka

Kafka is preferred for:

```text
domain events
asynchronous commands
fan-out
event replay
decoupled secondary processing
high-throughput event pipelines
```

---

# 16. REST vs gRPC Rule

Use REST when:

```text
human readability matters
browser/tool interoperability matters
public API compatibility matters
simple CRUD/read patterns dominate
```

Use gRPC when:

```text
internal typed RPC
performance matters
schema control matters
many internal calls
```

---

# 17. gRPC Is Not Automatically Better

Do not migrate every internal endpoint to gRPC without evidence.

Operational complexity includes:

```text
Protobuf lifecycle
gateway translation
debug tooling
load balancing behavior
HTTP/2 requirements
```

---

# 18. Kafka Is Not RPC

Avoid Kafka for:

```text
simple immediate request-response queries
```

Kafka must not become:

```text
a distributed function-call bus
```

---

# 19. Interaction Classification

Every cross-service interaction must be one of:

```text
COMMAND
QUERY
EVENT
```

This classification is mandatory before protocol selection.

---

# 20. Command

A Command asks another service to perform an action.

Examples:

```text
ReserveInventory
AuthorizePayment
CaptureWalletFunds
SendNotification
AssignReward
```

A Command:

```text
can fail
has one logical owner/handler
may require idempotency
```

---

# 21. Query

A Query asks for information.

Examples:

```text
GetProduct
GetOrderableItem
GetCustomerSummary
GetWalletBalance
GetPaymentStatus
```

A Query:

```text
must not change business state
```

---

# 22. Event

An Event states:

```text
something already happened
```

Examples:

```text
OrderCompleted
PaymentCaptured
WalletTopUpCompleted
MissionCompleted
RewardAssigned
```

Events are facts.

---

# 23. Command vs Event

Correct:

```text
Command:
ReserveInventory

Event:
InventoryReserved
```

Incorrect:

```text
Event:
ReserveInventory
```

because that is an instruction, not a fact.

---

# 24. Event Naming

Use past tense:

```text
OrderCreated
OrderAccepted
OrderCompleted
PaymentCaptured
PointsEarned
CouponRedeemed
WalletTopUpCompleted
```

---

# 25. Command Naming

Use imperative intent:

```text
CreateOrder
ReserveInventory
CapturePayment
ReleaseWalletFunds
AssignReward
```

---

# 26. Query Naming

Use:

```text
Get
List
Search
Find
Resolve
```

Examples:

```text
GetOrderableItem
ListCustomerRewards
ResolveExternalReference
```

---

# 27. Contract Ownership

The provider service owns:

```text
request schema
response schema
event schema
semantic meaning
compatibility policy
deprecation policy
```

Consumers do not redefine provider contracts independently.

---

# 28. Contract Registry

Maintain published contracts in:

```text
OpenAPI
Protobuf
Kafka schemas
```

with version control.

---

# 29. Contract Repository Options

Possible organization:

```text
shared contract repository
service-owned contract folder
schema registry
generated client package
```

Ownership remains with the provider service.

---

# 30. Shared Library Warning

Do not share:

```text
domain entities
JPA entities
service internals
```

as platform common libraries.

---

# 31. Safe Shared Artifacts

Share only where justified:

```text
contract DTOs
Protobuf definitions
generated clients
platform technical utilities
```

---

# 32. Shared DTO Coupling

Acceptable:

```text
generated API client
```

Not acceptable:

```text
shared Java Order domain model
shared Payment JPA entity
shared Wallet aggregate
```

Services remain independently deployable.

---

# 33. Phase 03 Relationship

Phase 03 already defines the contract foundation.

Phase 13 operationalizes those contracts with:

```text
protocol selection
timeouts
deadlines
retries
service authentication
load behavior
failure behavior
observability
```

Phase 13 does not replace Phase 03.

---

# 34. Internal REST Contract

An internal REST request should carry:

```text
business fields
idempotency key where required
correlation ID
authorization context
```

Transport metadata remains separate from domain logic.

---

# 35. gRPC Contract

Protobuf must use:

```text
stable field numbers
explicit enums
well-defined optional fields
```

Never reuse removed field numbers.

---

# 36. Kafka Event Envelope

Recommended:

```json
{
  "event_id": "evt_...",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "producer": "order-service",
  "occurred_at": "...",
  "correlation_id": "...",
  "data": {}
}
```

---

# 37. Event ID

Every domain/integration event needs:

```text
globally unique event_id
```

Used for:

```text
deduplication
traceability
replay safety
```

---

# 38. Correlation ID

Correlation ID follows the larger business workflow.

Example:

```text
Client
→ Order
→ Inventory
→ Payment
→ Kafka
→ Loyalty
```

The same business correlation context should propagate.

---

# 39. Request ID

Request ID identifies:

```text
one transport request
```

Correlation ID identifies:

```text
larger business flow
```

They may differ.

---

# 40. Trace Context

Use:

```text
OpenTelemetry
W3C Trace Context
```

with:

```text
traceparent
tracestate
```

for synchronous calls.

Kafka headers carry asynchronous trace context.

---

# 41. Baggage

Use trace baggage carefully.

Never propagate unnecessary:

```text
PII
tokens
secrets
large business objects
```

---

# 42. Service Authentication

Every service-to-service call must authenticate.

Possible mechanisms from the architecture:

```text
mTLS
service JWT
OAuth2 client credentials
service-mesh identity
```

Exact production mechanism remains governed by Security and Networking phases.

---

# 43. Service Authorization

Authentication asks:

```text
who is calling?
```

Authorization asks:

```text
is this service allowed to perform this operation?
```

Both are required.

---

# 44. Service Identity

Use explicit identities:

```text
order-service
payment-service
wallet-service
inventory-service
```

Avoid generic:

```text
backend
internal
system
```

---

# 45. Internal Scope Examples

Examples:

```text
inventory.reserve
payment.authorize
wallet.reserve
promotion.evaluate
notification.send
```

Exact scopes remain owned by each service/security design.

---

# 46. User Context Propagation

Do not forward raw user access tokens through every service automatically.

Prefer:

```text
service authentication
+
minimal delegated user context
```

where downstream authorization requires it.

---

# 47. Delegated User Context

Where necessary, propagate signed/verified claims such as:

```text
user_id
roles/scopes
session context
```

or use token exchange.

---

# 48. Avoid Token Chaining

Long synchronous chains carrying the same user JWT increase:

```text
security exposure
coupling
token leakage risk
```

Prefer platform service identities.

---

# 49. Synchronous Call Budget

Every incoming request has a total deadline.

Illustrative example only:

```text
Gateway budget = 2 seconds
```

All downstream calls must fit within remaining budget.

---

# 50. Deadline Propagation

Caller passes:

```text
remaining deadline
```

Dependency must not choose a longer timeout than the caller's remaining budget.

---

# 51. Timeout Hierarchy

Illustrative source example:

```text
Client timeout       3.0s
Gateway timeout      2.5s
Order budget         2.0s
Catalog call         300ms
Inventory call       500ms
Payment call         800ms
```

These are examples, not approved production values.

---

# 52. Timeout Rule

Timeouts must be:

```text
explicit
operation-specific
short enough
aligned with dependency behavior/SLO
```

Do not use one global timeout for every dependency.

---

# 53. Connect Timeout

Protects:

```text
connection establishment
```

Normally shorter than response/read timeout.

---

# 54. Read Timeout

Protects:

```text
response wait
```

Must align with the operation and dependency SLO.

---

# 55. Overall Deadline

Overall deadline includes:

```text
connection
processing
serialization
retries
```

---

# 56. No Infinite Wait

Every remote call must have:

```text
connection timeout
read/deadline timeout
retry policy
failure behavior
```

No service call may wait indefinitely.

---

# 57. Retry Rule

Retry only if operation is:

```text
idempotent
```

or:

```text
protected by stable idempotency key/reference
```

---

# 58. Usually Safe Retries

Examples:

```text
GET
idempotent gRPC query
ReserveInventory with idempotency key
CreatePayment with idempotency key
```

---

# 59. Unsafe Retry

Danger:

```text
ChargeCard
```

without:

```text
stable payment reference
provider idempotency
```

---

# 60. Retry Count

Prefer:

```text
small bounded retry
```

Source example:

```text
0–2 retries
```

depending on operation.

Do not use 10 automatic request-path retries.

---

# 61. Retry Backoff

Use:

```text
exponential backoff
+
jitter
```

where retry is appropriate.

---

# 62. Retry Budget

A service may enforce maximum retry traffic.

Source gives illustrative example:

```text
10% retry budget
```

Exact value:

```text
TBD_PLATFORM_POLICY
```

---

# 63. Retry Storm

Failure pattern:

```text
dependency slows
      ↓
callers timeout
      ↓
all callers retry
      ↓
load multiplies
      ↓
dependency fails harder
```

---

# 64. Retry Storm Protection

Use:

```text
bounded retries
jitter
circuit breaker
load shedding
retry budget
```

---

# 65. Retry Ownership

Avoid layered retries such as:

```text
application retries 3x
mesh retries 3x
gateway retries 2x
```

which may create:

```text
18 attempts
```

Define one retry owner.

---

# 66. Recommended Retry Ownership

Source recommends:

```text
application owns business-aware retries
mesh/gateway retries disabled or minimal
for state-changing calls
```

---

# 67. Circuit Breaker

Use around unstable synchronous dependency.

States:

```text
CLOSED
OPEN
HALF_OPEN
```

---

# 68. Circuit Breaker Trigger

May use:

```text
failure rate
slow-call rate
minimum sample size
```

Exact thresholds:

```text
TBD_PLATFORM_POLICY
```

---

# 69. Circuit Breaker Open Behavior

When OPEN:

```text
fail fast
```

or return only an approved correctness-preserving fallback.

Do not wait for guaranteed timeout.

---

# 70. Circuit Breaker Scope

Prefer per:

```text
service
operation
provider
```

rather than one global breaker.

---

# 71. Bulkhead

Isolate dependency resource pools.

Examples:

```text
Payment client pool
Catalog client pool
Legacy integration pool
```

One dependency must not consume all resources.

---

# 72. Connection Pool

Set bounded:

```text
max connections
pending acquisition
idle timeout
```

No unbounded connection growth.

---

# 73. Thread / Worker Pool

For blocking clients:

```text
use bounded pool
```

For non-blocking architecture:

```text
use appropriate event-loop/reactive client
```

Do not allow one slow dependency to exhaust service threads.

---

# 74. Load Shedding

When overloaded:

```text
reject lower-priority work early
```

rather than letting all requests become infinitely slow.

---

# 75. Backpressure

Async systems must prevent producers from overwhelming consumers.

Kafka buffers work, but applications still monitor:

```text
consumer lag
processing throughput
partition utilization
```

---

# 76. Consumer Lag

Lag represents:

```text
events waiting to be processed
```

Track both:

```text
record lag
oldest event age
```

---

# 77. Backlog Age

Oldest event age can matter more than count.

Example:

```text
100,000 fast-moving events
```

may be healthy.

But:

```text
10 events waiting 30 minutes
```

may indicate a stuck partition.

---

# 78. Kafka Topic Ownership

Producer domain owns:

```text
event meaning
schema
compatibility
```

Platform team may own:

```text
Kafka cluster
topic provisioning standard
retention defaults
```

---

# 79. Topic Naming

Recommended pattern:

```text
<domain>.<event-family>.v1
```

Examples:

```text
order.events.v1
payment.events.v1
wallet.events.v1
loyalty.events.v1
```

---

# 80. Topic Granularity

Avoid:

```text
one topic for every tiny event
```

and avoid:

```text
one giant platform-events topic
```

Prefer coherent domain streams.

---

# 81. Partition Key

Use the business aggregate ID:

```text
order_id
payment_id
wallet_id
customer_id
```

depending on event family.

Goal:

```text
preserve per-aggregate ordering
```

---

# 82. No Global Ordering Dependency

Kafka does not provide useful total ordering across all partitions.

Do not design the platform around:

```text
one total event order
```

---

# 83. Per-Aggregate Ordering

Example:

```text
OrderCreated
OrderAccepted
OrderReady
OrderCompleted
```

all keyed by:

```text
order_id
```

---

# 84. Event Reordering

Consumers must tolerate:

```text
retry
late delivery
cross-topic ordering differences
```

Never assume separate topics are globally ordered.

---

# 85. Delivery Semantics

Kafka consumption is normally:

```text
at least once
```

Consumers must be idempotent.

---

# 86. Exactly-Once Misconception

Kafka broker transactions do not make:

```text
database side effect
+
external API call
+
consumer processing
```

globally exactly-once.

Use:

```text
idempotency
outbox
inbox
```

---

# 87. Consumer Idempotency

Persist:

```text
event_id
consumer_name
```

or enforce business uniqueness.

---

# 88. Inbox Pattern

Consumer local transaction:

```text
check event not processed
apply business change
mark processed
commit
```

Typical table:

```text
processed_events
```

---

# 89. Outbox Pattern

Producer local transaction:

```text
business state change
+
outbox row
```

Then async publisher sends to Kafka.

---

# 90. Outbox Publisher

Worker:

```text
select unpublished events
publish Kafka
mark published
```

Use idempotent Kafka producer where appropriate.

---

# 91. Outbox Failure

When Kafka is unavailable:

```text
business transaction remains committed
outbox backlog grows
publisher retries later
```

---

# 92. Outbox Ordering

If aggregate order matters:

```text
publish in aggregate sequence/order
```

---

# 93. Aggregate Version in Event

Optional:

```text
aggregate_version
```

Example:

```text
order_version = 5
```

can help consumers detect stale events.

---

# 94. Event Schema Evolution

Prefer:

```text
add optional field
add enum carefully
preserve existing meaning
```

Avoid:

```text
remove required field silently
rename required field silently
change semantics silently
```

---

# 95. Backward Compatibility

A new producer must remain compatible with old consumers during rollout.

Use:

```text
consumer-first deployment
```

where required.

---

# 96. Breaking Event Change

For true breaking change use:

```text
event_version = 2
```

or:

```text
new topic/contract
```

with migration period.

---

# 97. Protobuf Compatibility

Rules:

```text
never reuse field numbers
reserve removed fields
add optional fields
avoid incompatible scalar-type changes
```

---

# 98. REST Compatibility

Avoid breaking:

```text
removing response fields
changing field type
changing error meaning
```

without versioning/deprecation.

---

# 99. API Versioning

Internal APIs may use:

```text
/v1/
```

or versioned Protobuf packages.

Version only when compatibility requires it.

---

# 100. Deprecation

Deprecation requires:

```text
owner
known consumers
deadline
migration path
observability
```

---

# 101. Consumer Inventory

Maintain inventory of:

```text
service
contract
version
owner
```

for critical APIs/events.

---

# 102. Service Discovery

Inside Kubernetes use:

```text
DNS service names
```

Applications should use logical service names.

Do not build a custom service registry without need.

---

# 103. Load Balancing

REST/gRPC may use:

```text
Kubernetes Service
service mesh
client-side balancing
```

depending on deployed architecture.

---

# 104. gRPC Load Balancing

Long-lived HTTP/2 channels require care.

Verify traffic spreads across pods using approved mechanism.

---

# 105. Service Mesh

A service mesh may provide:

```text
mTLS
traffic policy
telemetry
retries
circuit breaking
```

but must not hide business correctness rules.

---

# 106. Gateway Responsibility

API Gateway should handle:

```text
external authentication
routing
rate limiting
request IDs
coarse validation
```

---

# 107. Gateway Anti-Pattern

Do not make the Gateway:

```text
call 5 services
make business decisions
write Order
orchestrate checkout
```

Business orchestration belongs inside the owning service/application layer.

---

# 108. Backend-for-Frontend

A BFF may aggregate client-specific reads.

It must not own:

```text
Order rules
Payment rules
Wallet rules
Promotion rules
```

---

# 109. Query Aggregation

For UI combining:

```text
Order detail
Payment summary
Reward summary
```

possible approaches:

```text
BFF synchronous aggregation
read-model projection
API composition
```

---

# 110. Query Fan-Out Warning

A screen calling ten services may create:

```text
latency
availability coupling
connection pressure
```

Prefer:

```text
coarse APIs
read projections
```

where justified.

---

# 111. Read Model Projection

Async projections may combine events into:

```text
customer dashboard
order summary
admin view
```

---

# 112. Projection Ownership

Projection is:

```text
read-only derived data
```

not source of truth.

---

# 113. Projection Staleness

A projection may lag.

UI/business flow must explicitly decide whether eventual consistency is acceptable.

---

# 114. Strong Query Requirement

For financial/correctness decisions use the authoritative service.

Examples:

```text
wallet available balance
inventory reserve
coupon redemption
payment status for financial action
```

Never substitute stale projection.

---

# 115. Cache Between Services

A caller may cache when:

```text
staleness is acceptable
```

Examples:

```text
catalog metadata
store configuration
```

---

# 116. Cache Prohibition for Critical State

Never use cached copy as authoritative substitute for:

```text
inventory reservation result
wallet balance for spend decision
final coupon redemption state
critical payment action state
```

---

# 117. Local Projection vs Direct Query

If a service repeatedly needs data and eventual consistency is acceptable:

```text
consider event-driven local projection
```

instead of synchronous call on every request.

---

# 118. Good Projection Candidates

Examples:

```text
customer tier
store metadata
product availability advisory
```

when stale data is acceptable.

---

# 119. Projection Anti-Pattern

Do not copy:

```text
entire source database
```

into every service.

Project only fields needed for the consumer use case.

---

# 120. Dependency Graph

Maintain architecture graph such as:

```text
Order → Catalog
Order → Inventory
Order → Payment
Order → Promotion
Payment → Provider
Notification ← Order events
Loyalty ← Order events
Mission ← Order / Wallet events
```

---

# 121. Dependency Direction

Avoid cycles such as:

```text
Order → Loyalty
Loyalty → Order
```

as synchronous runtime dependencies.

Use projections/events to break cycles.

---

# 122. Circular Dependency Risk

Circular calls create:

```text
deployment coupling
failure loops
deadlock-like runtime waits
```

Architecture review must flag them.

---

# 123. Synchronous Dependency Depth

Keep critical call chains shallow.

Source typical target:

```text
Gateway
→ Domain Service
→ 1–3 critical dependencies
```

Avoid:

```text
A → B → C → D → E → F
```

---

# 124. Latency Multiplication

Tail latency compounds across dependency chains.

Measure:

```text
end-to-end P95
end-to-end P99
```

not only service averages.

---

# 125. Availability Multiplication

Multiple required dependencies reduce combined availability.

Therefore:

```text
reduce unnecessary synchronous critical dependencies
```

---

# 126. Critical Path Documentation

For every important API document:

```text
required synchronous calls
optional synchronous calls
async follow-up
```

---

# 127. CreateOrder Critical Path

Potential:

```text
Gateway
  ↓
Order
  ├── Catalog
  ├── Inventory
  ├── Promotion
  └── Payment / Wallet
```

---

# 128. CreateOrder Secondary Effects

Keep async:

```text
Notification
Loyalty
Mission
Analytics
```

---

# 129. Order Completion Critical Path

Critical:

```text
Order state transition
```

Potential required checks:

```text
inventory consumption
financial prerequisite
```

depending policy.

Async:

```text
Loyalty
Mission
Notification
Analytics
```

---

# 130. Wallet Reserve Critical Path

```text
Order
  ↓
Wallet
  ↓
wallet_db
```

Wallet should not synchronously call:

```text
Order
Customer
Notification
Analytics
```

inside the financial transaction.

---

# 131. Communication Budget Document

Every synchronous endpoint documents:

```text
total deadline
dependency timeouts
retry count
fallback
```

---

# 132. Example Budget

Illustrative source example:

```text
CreateOrder total target: 1500ms

Catalog:    250ms
Promotion:  250ms
Inventory:  350ms
Payment:    500ms
local work: remaining budget
```

These are not approved production targets.

---

# 133. Parallel Calls

Independent reads may run in parallel.

Example:

```text
Catalog validation
+
Customer summary
```

if neither depends on the other.

---

# 134. Parallel Call Caution

Parallel calls increase:

```text
downstream burst
connection usage
resource pressure
```

Use bounded concurrency.

---

# 135. Sequential Calls

Use sequential calls when:

```text
next call depends on prior result
```

Example:

```text
Catalog price
→ calculate amount
→ authorize Payment
```

---

# 136. Fan-Out Limit

Set bounded maximum downstream parallelism.

Never fan out one request into:

```text
hundreds of service calls
```

---

# 137. Batch APIs

Instead of:

```text
100 × GetProduct
```

use:

```text
BatchGetProducts
```

or purpose-specific batch contract.

---

# 138. N+1 Service Call Problem

Avoid:

```text
for each item:
    call Catalog
```

Use batch contract.

---

# 139. Batch Contract

Example:

```text
GetOrderableItems(product_ids[])
```

Response preserves:

```text
per-item result
```

---

# 140. Batch Limits

Every batch API defines:

```text
maximum item count
maximum payload size
timeout
```

---

# 141. Streaming

Use gRPC streaming/Kafka streams only for:

```text
large continuous data
real-time feeds
```

Do not use streaming for ordinary CRUD.

---

# 142. Request-Reply over Kafka

Possible but generally avoid for normal synchronous business APIs.

It adds:

```text
correlation
reply topic
timeout
complexity
```

Use only with deliberate requirement.

---

# 143. Kafka Commands

Asynchronous command examples:

```text
GenerateStatement
SyncOrderToLegacy
SendCampaignBatch
```

One logical handler.

---

# 144. Command Topic Ownership

Command destination is normally owned by receiver.

Example:

```text
notification.commands.v1
```

if that pattern is approved.

---

# 145. Kafka Command Deduplication

Require:

```text
command_id
idempotency
```

same as synchronous state-changing command.

---

# 146. Event Fan-Out

One fact may serve many consumers:

```text
OrderCompleted
  ├── Loyalty
  ├── Mission
  ├── Notification
  ├── Analytics
  └── Integration
```

Producer should not know every consumer.

---

# 147. Consumer Independence

Each consumer group has independent:

```text
offset
retry
DLQ
```

One failed consumer must not block others.

---

# 148. Poison Event

A message that always fails due to:

```text
bad schema
bad data
consumer bug
```

must not block a partition forever.

Use:

```text
bounded retry
DLQ
alert
```

---

# 149. Retry Topic

Possible:

```text
main
→ retry
→ DLQ
```

or application-scheduled retry.

Phase 15 will choose detailed Kafka standard.

---

# 150. DLQ Entry Metadata

Store:

```text
event_id
consumer
failure reason
original topic
partition
offset
retry count
```

---

# 151. DLQ Replay

Replay only after:

```text
bug fixed
mapping fixed
dependency restored
```

Preserve original:

```text
event_id
```

for idempotency.

---

# 152. Event Retention

Retention depends on:

```text
replay need
business importance
storage
```

Financial/business events may need longer retention than transient commands.

---

# 153. Compaction

Compacted topics may fit:

```text
latest reference/config state
```

not immutable event history unless semantics match.

---

# 154. Consumer Offset

Kafka offset is:

```text
operational position
```

It is not:

```text
business idempotency
```

---

# 155. Offset Commit Timing

Common:

```text
process successfully
then commit
```

If process crashes after DB commit but before offset commit:

```text
message replays
```

Inbox/idempotency must make replay safe.

---

# 156. DB + Kafka Transaction Boundary

Do not implement distributed 2PC between application DB and Kafka.

Producer:

```text
outbox
```

Consumer:

```text
inbox / idempotency
```

---

# 157. Communication Security

Controls:

```text
TLS / mTLS
service identity
authorization
network policy
schema validation
rate limiting
payload size limits
```

---

# 158. Internal Is Not Trusted

Treat internal network as:

```text
zero trust
```

Services authenticate, authorize, and validate each other.

---

# 159. Payload Validation

Validate:

```text
required fields
ranges
enum values
money
IDs
timestamps
array size
```

even for internal traffic.

---

# 160. Payload Size

Set limits for:

```text
REST body
gRPC message
Kafka event
```

Avoid giant payloads.

---

# 161. Event Payload Design

Include:

```text
facts needed by likely consumers
```

Do not publish:

```text
entire database entity graph
```

---

# 162. Event Enrichment Balance

Too little data:

```text
forces consumers to call producer synchronously
```

Too much data:

```text
leaks ownership and PII
```

Choose purpose-driven event payload.

---

# 163. OrderCompleted Event Example

May contain:

```text
order_id
customer_id
store_id
fulfillment_type
net amount
currency
```

if later Loyalty/Mission need these facts.

---

# 164. Event Privacy

Do not place unnecessary:

```text
phone
email
address
access token
```

into shared Kafka topics.

---

# 165. Communication Failure Categories

Classify:

```text
TIMEOUT
UNAVAILABLE
RATE_LIMITED
AUTHENTICATION_FAILED
AUTHORIZATION_FAILED
INVALID_REQUEST
BUSINESS_REJECTED
CONFLICT
UNKNOWN_OUTCOME
```

---

# 166. Technical Failure vs Business Rejection

Technical:

```text
503
timeout
connection reset
```

Business rejection:

```text
insufficient stock
insufficient wallet balance
coupon expired
```

Do not retry business rejection blindly.

---

# 167. Failure Propagation

Caller translates dependency failure into its own contract.

Example:

```text
Inventory UNAVAILABLE
```

may become:

```text
CHECKOUT_TEMPORARILY_UNAVAILABLE
```

at Order boundary.

---

# 168. Error Leakage Rule

Never expose through service boundary:

```text
internal hostname
stack trace
SQL error
raw provider response
```

---

# 169. gRPC Error Mapping

Use canonical codes such as:

```text
INVALID_ARGUMENT
NOT_FOUND
ALREADY_EXISTS
FAILED_PRECONDITION
ABORTED
RESOURCE_EXHAUSTED
UNAVAILABLE
DEADLINE_EXCEEDED
INTERNAL
```

with structured details.

---

# 170. REST Error Mapping

Use the platform error envelope from Phase 03:

```text
code
message
details
request_id
```

---

# 171. Retryable Error Metadata

Internal contract may include:

```text
retryable = true / false
```

where useful.

Caller must still understand business semantics.

---

# 172. Deadline Exceeded

When caller deadline expires:

```text
stop waiting
cancel downstream request where possible
```

But dependency may already have committed side effect.

State-changing retries require idempotency.

---

# 173. Cancellation Propagation

Transport cancellation must not corrupt a committed business operation.

Example:

```text
client disconnects during CreateOrder
```

Order may still complete.

Idempotency lets client retry/query safely.

---

# 174. Hedged Requests

Potentially acceptable only for:

```text
idempotent read-only operations
```

Avoid for state-changing operations.

---

# 175. Critical Dependency Classification

Classify dependency:

```text
CRITICAL
IMPORTANT
OPTIONAL
ASYNC
```

This informs:

```text
fallback
timeout
alerting
SLO
```

---

# 176. Optional Dependency

If optional dependency fails:

```text
core operation should continue
```

Examples:

```text
analytics
notification
recommendation
```

---

# 177. Critical Dependency

If critical dependency fails:

```text
operation may need to fail safely
```

Examples:

```text
Inventory reserve during checkout
Payment authorization
```

---

# 178. Fallback Rule

Fallback is allowed only when business correctness remains valid.

Good:

```text
Catalog image unavailable
→ return no image
```

Bad:

```text
Inventory unavailable
→ assume item in stock
```

---

# 179. Stale Data Fallback

Potentially acceptable:

```text
menu display
store description
```

Not acceptable for:

```text
financial amount
Inventory reservation
coupon redemption
```

---

# 180. Graceful Degradation

Examples:

```text
Notification down
→ Order still completes

Loyalty down
→ Order still completes; event waits

Analytics down
→ customer flow unaffected
```

---

# 181. Fail-Closed Cases

Examples from source:

```text
Payment unknown
Inventory unavailable
coupon final redemption unavailable
```

should generally:

```text
fail / hold / remain unresolved
```

rather than assume success.

---

# 182. Fail-Open Cases

Only for low-risk optional features.

Example:

```text
Recommendation down
→ show default content
```

---

# 183. Service Dependency Documentation

For every dependency document:

```text
purpose
owner
protocol
contract
classification
timeout
deadline
retry
failure behavior
fallback
SLO
```

---

# 184. Cross-Service Read Rule

A service reads another service's data only through:

```text
API
event projection
approved read model
```

Never:

```sql
SELECT ...
FROM another_service_db
```

---

# 185. Cross-Service Write Rule

Never:

```sql
INSERT INTO another_service_db...
UPDATE another_service_db...
```

Use:

```text
Command
API
event-driven workflow
```

---

# 186. Transaction Boundary

One service DB transaction must not span:

```text
network call to another service
```

Local DB transaction boundary remains local.

---

# 187. Relationship to Phase 14

Cross-service workflows requiring atomic-like business behavior need:

```text
Saga
compensation
outbox/inbox
```

Phase 14 defines the distributed transaction standard in detail.

---

# 188. Relationship to Phase 15

Phase 15 defines detailed:

```text
Kafka cluster
topics
partitions
schemas
producer
consumer
retry
DLQ
replay
capacity
```

Phase 13 defines the communication semantics that Phase 15 implements.

---

# 189. Relationship to Networking

Later Networking/Gateway/TLS phase expands:

```text
ingress
east-west traffic
TLS/mTLS
service mesh
DNS
network policy
```

Phase 13 defines how applications must behave regardless of implementation.

---

# 190. Relationship to Observability

Later Observability phase expands:

```text
traces
metrics
logs
dashboards
alerts
SLIs/SLOs
```

Phase 13 defines communication-specific telemetry requirements.

---

# 191. Contract Testing

Provider tests:

```text
schema
compatibility
examples
```

Consumer tests:

```text
expected fields
consumer behavior
```

---

# 192. Consumer-Driven Contract Tests

Useful for synchronous APIs.

But:

```text
provider remains semantic owner
```

Consumers must not dictate provider's whole architecture.

---

# 193. Protobuf CI Compatibility

Validate:

```text
breaking field changes
enum changes
field-number reuse
```

---

# 194. OpenAPI CI Compatibility

Validate:

```text
schema
breaking changes
required fields
response compatibility
```

---

# 195. Kafka Schema Validation

Use:

```text
JSON Schema
Avro
Protobuf
```

with registry where appropriate.

Detailed selection belongs to Phase 15.

---

# 196. Schema Registry Purpose

Benefits:

```text
compatibility checks
schema discovery
producer/consumer governance
```

---

# 197. Communication Observability

Every service call records:

```text
dependency
operation
latency
result
timeout
retry count
```

---

# 198. RED Metrics

For synchronous APIs:

```text
Rate
Errors
Duration
```

---

# 199. Kafka Metrics

Monitor:

```text
producer errors
publish latency
consumer lag
processing latency
DLQ rate
rebalances
```

---

# 200. Dependency Dashboard

Per dependency show:

```text
outbound dependency
success rate
P95/P99 latency
circuit state
retry rate
timeout rate
```

---

# 201. Trace Span Naming

Use stable names:

```text
grpc InventoryService/Reserve
http GET /internal/v1/catalog/items
kafka consume order.events.v1
```

---

# 202. Trace Attributes

Include:

```text
service
operation
result
```

Avoid:

```text
PII
secrets
high-cardinality IDs as metric labels
```

---

# 203. Error Log Correlation

Every communication error log should include:

```text
request_id
correlation_id
trace_id
dependency
operation
```

---

# 204. Communication Metrics

Candidate:

```text
service_client_requests_total
service_client_errors_total
service_client_timeout_total
service_client_retry_total
service_client_latency
circuit_breaker_open
```

---

# 205. Communication SLIs

Potential:

```text
dependency success rate
P95 dependency latency
consumer event latency
message publish success
DLQ rate
```

Targets remain:

```text
TBD_SLO
```

---

# 206. Alerts

Alert on:

```text
dependency timeout spike
circuit open
retry spike
consumer lag
DLQ spike
event publish failure
gRPC unavailable spike
```

---

# 207. Required Runbooks

```text
Dependency timeout spike
Circuit breaker open
Kafka consumer lag
DLQ growing
gRPC connection imbalance
Retry storm
Contract incompatibility
```

---

# 208. Timeout Spike Runbook

```text
identify dependency
check dependency latency
check network/DNS
check connection pool
inspect retry rate
reduce retries if storm
load shed if needed
```

---

# 209. Consumer Lag Runbook

```text
check processing rate
check partition count
check poison event
check DB latency
check consumer rebalances
scale consumers within partition limit
```

---

# 210. DLQ Runbook

```text
categorize failures
fix root cause
verify idempotency
replay controlled batch
monitor side effects
```

---

# 211. Contract Break Runbook

```text
identify producer deployment
rollback if needed
compare schema versions
restore compatibility
add CI guard
```

---

# 212. Communication Failure Injection

Inject:

```text
timeout
connection refused
503
429
slow dependency
half-open circuit
Kafka unavailable
consumer duplicate
out-of-order event
```

---

# 213. REST Integration Tests

Test:

```text
success
400
404
409
422
429
503
timeout
retry
authentication failure
authorization failure
```

---

# 214. gRPC Integration Tests

Test:

```text
OK
INVALID_ARGUMENT
NOT_FOUND
FAILED_PRECONDITION
ABORTED
RESOURCE_EXHAUSTED
UNAVAILABLE
DEADLINE_EXCEEDED
```

---

# 215. Kafka Consumer Tests

Test:

```text
normal event
duplicate
old version
new additive field
poison event
retry
DLQ
replay
```

---

# 216. Deadline Tests

Verify:

```text
downstream timeout < upstream timeout
```

and cancellation/deadline propagation behaves correctly.

---

# 217. Retry Tests

Verify:

```text
no retry on business rejection
bounded retry on transient failure
backoff
jitter
idempotency
retry budget
```

---

# 218. Circuit Breaker Tests

Verify:

```text
opens at threshold
fails fast
half-open probes
recovers
```

---

# 219. Bulkhead Tests

Make one dependency hang.

Verify:

```text
other dependency calls still work
```

---

# 220. Load Tests

Measure:

```text
connection pools
gRPC channels
REST latency
Kafka throughput
consumer lag
retry behavior
```

---

# 221. Cascading Failure Test

Simulate:

```text
Payment becomes slow
```

Verify:

```text
Order timeouts
bounded retries
circuit breaker
no thread exhaustion
secondary services unaffected
```

---

# 222. Definition of Done — Synchronous Contract

- [ ] Command/query semantics are clear.
- [ ] Provider owner is identified.
- [ ] Protocol is justified.
- [ ] Authentication exists.
- [ ] Authorization exists.
- [ ] Timeout exists.
- [ ] Overall deadline exists.
- [ ] Retry policy is explicit.
- [ ] Idempotency exists for state-changing commands.
- [ ] Error mapping is defined.
- [ ] Failure classification exists.
- [ ] Fallback is explicitly allowed/forbidden.
- [ ] Metrics/tracing exist.
- [ ] Contract tests exist.
- [ ] Runbook exists for critical dependency.

---

# 223. Definition of Done — Kafka Event

- [ ] Event is a past-tense fact.
- [ ] Producer owner is clear.
- [ ] `event_id` exists.
- [ ] Version exists.
- [ ] Timestamp exists.
- [ ] Correlation ID exists.
- [ ] Partition key exists.
- [ ] Schema compatibility policy exists.
- [ ] Consumer idempotency exists.
- [ ] Retry/DLQ policy exists.
- [ ] Retention exists.
- [ ] Privacy reviewed.
- [ ] Observability exists.
- [ ] Replay procedure exists.

---

# 224. Definition of Done — Kafka Command

- [ ] Command owner.
- [ ] Command ID.
- [ ] Idempotency.
- [ ] One logical handler.
- [ ] Retry behavior.
- [ ] DLQ.
- [ ] Result semantics.
- [ ] Timeout/deadline expectation where applicable.
- [ ] Authentication/authorization model where applicable.
- [ ] Trace/correlation metadata.

---

# 225. Communication Review Checklist

## Semantics

- [ ] Command/query/event classified.
- [ ] Sync vs async justified.
- [ ] Protocol justified.
- [ ] Contract owner clear.
- [ ] Business vs technical failure separated.

## Reliability

- [ ] Timeout.
- [ ] Deadline.
- [ ] Retry.
- [ ] Circuit breaker.
- [ ] Bulkhead.
- [ ] Backpressure.
- [ ] Idempotency.
- [ ] Recovery semantics.

## Observability

- [ ] Correlation ID.
- [ ] Trace context.
- [ ] Metrics.
- [ ] Logs.
- [ ] Alerts.

---

# 226. REST Review Checklist

- [ ] Endpoint versioning.
- [ ] Request schema.
- [ ] Response schema.
- [ ] Error envelope.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Timeout.
- [ ] Idempotency header where required.
- [ ] Pagination for lists.
- [ ] Payload limit.
- [ ] Contract tests.
- [ ] Retry semantics.

---

# 227. gRPC Review Checklist

- [ ] Proto owner.
- [ ] Stable field numbers.
- [ ] Explicit enums.
- [ ] Optional fields defined.
- [ ] Deadlines.
- [ ] Canonical status mapping.
- [ ] Service authentication.
- [ ] Authorization scope.
- [ ] Load balancing.
- [ ] Message-size limit.
- [ ] Compatibility tests.
- [ ] Cancellation propagation reviewed.

---

# 228. Kafka Review Checklist

- [ ] Topic owner.
- [ ] Event/command semantics.
- [ ] Partition key.
- [ ] Retention.
- [ ] Schema.
- [ ] Consumer group.
- [ ] Inbox/dedupe.
- [ ] Retry.
- [ ] DLQ.
- [ ] Lag alert.
- [ ] Oldest-event-age alert.
- [ ] Replay procedure.
- [ ] Event privacy.
- [ ] Correlation/trace headers.

---

# 229. Security Review Checklist

- [ ] TLS/mTLS.
- [ ] Service identity.
- [ ] Authorization scope.
- [ ] Payload validation.
- [ ] Rate limit where needed.
- [ ] No sensitive event data.
- [ ] Token propagation minimized.
- [ ] Zero-trust internal model.
- [ ] Payload-size limits.
- [ ] Error leakage prevented.

---

# 230. Performance Review Checklist

- [ ] Critical path documented.
- [ ] Synchronous call depth controlled.
- [ ] Batch APIs used.
- [ ] N+1 calls avoided.
- [ ] Parallelism bounded.
- [ ] Connection pools sized.
- [ ] gRPC channels balanced.
- [ ] P95/P99 measured.
- [ ] Retry amplification measured.
- [ ] Kafka lag measured.

---

# 231. Production Readiness Checklist

Before production:

- [ ] Critical communication matrix documented.
- [ ] Sync/async decisions reviewed.
- [ ] REST/gRPC contracts versioned.
- [ ] Kafka event schemas validated.
- [ ] Service authentication tested.
- [ ] Authorization tested.
- [ ] Deadline propagation tested.
- [ ] Retry/idempotency tested.
- [ ] Circuit breaker tested.
- [ ] Bulkhead tested.
- [ ] Load shedding behavior known.
- [ ] Consumer duplicate handling tested.
- [ ] DLQ replay tested.
- [ ] Correlation/tracing tested.
- [ ] Cascading failure test passed.
- [ ] Cross-service DB access scan passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 232. Initial Implementation Order

Follow the source order:

```text
1. Communication standards
2. Error contract standards
3. Correlation / Request IDs
4. OpenTelemetry propagation
5. Internal REST client standard
6. gRPC standard
7. Deadline propagation
8. Retry / circuit-breaker standard
9. Service authentication
10. Kafka event envelope
11. Outbox pattern
12. Inbox / deduplication pattern
13. Retry / DLQ standard
14. Schema compatibility CI
15. Dependency dashboards
16. Failure-injection tests
```

---

# 233. Minimum Viable Service Communication Standard

Every service must have:

```text
Explicit sync/async decision
Typed command/query/event contract
Service authentication
Timeout/deadline
Bounded retry
Correlation ID
Trace propagation
Structured errors
Kafka event ID/version
Consumer deduplication
Outbox for reliable domain events
DLQ/replay policy
Metrics and alerts
```

---

# 234. Foundational Controls

Do not postpone:

```text
timeouts
idempotency
trace propagation
outbox
inbox
```

These are foundational distributed-system controls.

---

# 235. Communication Governance

Architecture review should reject:

```text
direct cross-service database access
long synchronous chains
unbounded retries
unowned events
raw internal errors
shared domain entities
Kafka used as ad-hoc RPC
```

---

# 236. Service Communication Matrix

Maintain a live table:

| Caller | Callee | Operation | Type | Protocol | Criticality | Timeout | Retry |
|---|---|---|---|---|---|---|---|
| Order | Catalog | Validate items | Query | gRPC/REST | CRITICAL | Defined | Limited |
| Order | Inventory | Reserve | Command | gRPC | CRITICAL | Defined | Idempotent |
| Order | Promotion | Evaluate/Reserve | Command/Query | gRPC/REST | CRITICAL | Defined | Idempotent where state-changing |
| Order | Payment | Authorize/Capture | Command | gRPC | CRITICAL | Defined | Stable idempotency |
| Order | Wallet | Reserve/Capture | Command | gRPC | CRITICAL | Defined | Stable idempotency |
| Order | Loyalty | OrderCompleted | Event | Kafka | ASYNC | Async | Consumer retry |
| Order | Notification | OrderReady | Event | Kafka | ASYNC | Async | Consumer retry |

Exact protocol/timeout values must be frozen separately.

---

# 237. Dependency Criticality

Supported classifications:

```text
CRITICAL
IMPORTANT
OPTIONAL
ASYNC
```

---

# 238. Dependency Classification Meaning

```text
CRITICAL
→ core operation may need to fail/hold safely

IMPORTANT
→ degradation may be acceptable depending business rule

OPTIONAL
→ core operation continues

ASYNC
→ caller's core transaction does not wait
```

---

# 239. Dependency Standard Record

For each dependency create:

```text
caller
callee
operation
semantic type
protocol
owner
criticality
timeout
deadline
retry count
idempotency
circuit breaker
fallback
failure translation
SLO
trace span name
contract version
```

---

# 240. Service-to-Service Client Standard

Provide reusable technical configuration for:

```text
REST client
gRPC client
OpenTelemetry
correlation propagation
auth metadata
timeout configuration
retry hooks
circuit breaker hooks
metrics
```

Do not share business domain logic.

---

# 241. Spring REST Client Standard

Choose one approved internal HTTP client stack.

Requirements:

```text
explicit connect timeout
explicit response timeout
TLS verification
auth interceptor
correlation/trace propagation
structured error mapping
metrics
bounded connection pool
```

Exact client library:

```text
TBD_PLATFORM_STANDARD
```

---

# 242. Spring gRPC Client Standard

Requirements:

```text
generated stubs
deadline per call
service-auth interceptor
correlation/trace metadata
canonical error mapping
channel lifecycle
load balancing
message-size limits
metrics
```

---

# 243. Resilience Library Standard

One standard implementation should expose:

```text
timeout
retry
circuit breaker
bulkhead
rate limiter where needed
```

Exact Java library/config framework:

```text
TBD_PLATFORM_STANDARD
```

Do not copy different retry logic into every service manually.

---

# 244. Business-Aware Retry

Shared technical library may execute retry mechanics.

But application/service configuration decides:

```text
whether this operation is safe to retry
```

Example:

```text
GetCatalogItem
→ retry may be safe

CapturePayment
→ retry only with stable idempotency/reference contract
```

---

# 245. Default Retry Policy

There must be no hidden automatic retry.

Default should be conceptually:

```text
no retry unless operation explicitly opts in
```

State-changing financial commands require explicit review.

---

# 246. Default Timeout Policy

There may be platform defaults as safety nets, but every critical dependency must define operation-specific timeout/deadline.

Do not rely solely on one shared default.

---

# 247. Communication Configuration

Externalize environment-specific:

```text
service endpoint
connect timeout
request timeout
retry count
circuit thresholds
pool size
TLS config
```

Business semantics remain in code/contracts.

---

# 248. Configuration Validation

At service startup validate:

```text
dependency URL/service name
positive timeout
deadline hierarchy where enforceable
pool bounds
retry count bounds
TLS/auth configuration
```

Fail fast on impossible configuration.

---

# 249. Correlation Middleware

Every inbound request should:

```text
accept valid correlation ID
or create a new one
```

Then propagate it through:

```text
REST
gRPC
Kafka
logs
traces
```

---

# 250. Request ID Middleware

Every inbound transport request gets:

```text
request_id
```

even when correlation ID already exists.

---

# 251. Kafka Correlation Headers

Kafka record metadata should carry, where appropriate:

```text
correlation_id
traceparent
tracestate
producer
event version metadata
```

while the event payload remains business focused.

---

# 252. Trace and Correlation Distinction

```text
trace_id
→ observability trace instance

correlation_id
→ business workflow correlation

request_id
→ single transport request
```

Do not collapse them blindly into one identifier.

---

# 253. Error Adapter Standard

Each outbound adapter translates transport/dependency errors into application-level typed failures.

Example:

```text
gRPC UNAVAILABLE
→ DependencyUnavailable
```

Then caller's application layer maps to its public contract.

---

# 254. Business Error Preservation

When dependency returns a stable business rejection:

```text
WALLET_INSUFFICIENT_BALANCE
```

caller should preserve semantic meaning where useful rather than translating everything to:

```text
INTERNAL_ERROR
```

---

# 255. Unknown Outcome Preservation

When a state-changing dependency times out after request may have been accepted:

```text
UNKNOWN_OUTCOME
```

must be preserved.

Do not convert to definitive failure.

---

# 256. Unknown Outcome Examples

High-risk examples:

```text
Payment authorization
Wallet capture
Inventory reserve
Promotion reservation
```

Safe recovery uses:

```text
same idempotency key
same business reference
query-by-reference
reconciliation
```

---

# 257. Service Client Port Pattern

Business/application code depends on output ports such as:

```text
CatalogPort
InventoryPort
PromotionPort
PaymentPort
WalletPort
```

Adapters implement:

```text
REST
gRPC
Kafka command
```

without changing domain ownership.

---

# 258. Protocol Replacement

Because application depends on ports:

```text
Inventory REST adapter
```

can later become:

```text
Inventory gRPC adapter
```

without moving Inventory semantics into Order domain.

---

# 259. No Cross-Service Repository

Never create:

```text
InventoryRepository
```

inside Order Service pointing directly at Inventory DB.

Use:

```text
InventoryPort
```

backed by an approved service contract.

---

# 260. No Cross-Service Transaction Manager

Do not create one Spring transaction spanning:

```text
order_db
wallet_db
payment_db
```

Cross-service consistency belongs to Phase 14 Saga.

---

# 261. Critical Path Worksheet

For every important endpoint create a worksheet:

```text
Endpoint:
Owner:
Total deadline:
Required dependencies:
Optional dependencies:
Async follow-up:
Parallel calls:
Sequential calls:
Retry ownership:
Unknown outcome risks:
Fallback:
Observability:
```

---

# 262. CreateOrder Communication Worksheet

Example structure:

```text
Owner:
order-service

Required:
Catalog
Inventory
Promotion if applicable
Payment or Wallet

Optional/Async:
Notification
Loyalty
Mission
Analytics

Unknown-outcome risk:
Inventory reserve
Promotion reserve
Payment/Wallet financial command
```

---

# 263. Cart Communication Worksheet

Typical:

```text
Catalog
→ synchronous validation/price preview

Inventory
→ synchronous advisory availability

Promotion
→ synchronous preview

Ordering
→ explicit checkout transition
```

Normal Cart must not reserve stock through hidden background call.

---

# 264. Payment Communication Worksheet

Typical:

```text
Ordering → Payment
= synchronous/idempotent command for critical financial decision

Payment → external provider
= Integration/ACL boundary

PaymentCaptured
= async fact for downstream consumers
```

---

# 265. Wallet Communication Worksheet

Typical:

```text
Ordering → Wallet Reserve
= synchronous critical command

Ordering → Wallet Capture/Release
= idempotent command

WalletTopUpCompleted
= async fact
```

Wallet must remain free from reverse synchronous calls into Order during balance transaction.

---

# 266. Identity/Customer Communication Worksheet

Possible:

```text
Gateway/Service → Identity
= token verification / trusted identity contract

Service → Customer
= purpose-specific profile/customer query

Customer changes
→ events/projections where eventual consistency is acceptable
```

Exact auth architecture remains governed by Identity/Security phases.

---

# 267. Catalog Communication Worksheet

Prefer coarse operations:

```text
GetOrderableItems(product_ids[])
GetMenuForStore(...)
```

Avoid N+1 product calls from Order/Cart.

---

# 268. Inventory Communication Worksheet

Critical commands:

```text
ReserveInventory
ReleaseInventory
ConsumeInventory
```

must be:

```text
idempotent
deadline-bounded
queryable/recoverable by stable reference
```

---

# 269. Promotion Communication Worksheet

Distinguish:

```text
EvaluatePromotion
→ Query / side-effect-free

ReservePromotion
→ Command / state-changing

RedeemPromotion
→ Command / state-changing

ReleasePromotion
→ Command / state-changing
```

Do not treat all Promotion calls identically.

---

# 270. Ordering Completion Communication Worksheet

`OrderCompleted` is:

```text
EVENT
```

not:

```text
call Loyalty synchronously
call Mission synchronously
call Notification synchronously
```

---

# 271. Platform Communication ADRs

Recommended ADRs:

```text
ADR-COMM-001 Command / Query / Event classification
ADR-COMM-002 Sync vs async decision standard
ADR-COMM-003 REST vs gRPC selection
ADR-COMM-004 Service authentication
ADR-COMM-005 Correlation / request / trace IDs
ADR-COMM-006 Deadline propagation
ADR-COMM-007 Retry ownership
ADR-COMM-008 Circuit breaker / bulkhead standard
ADR-COMM-009 Kafka event envelope
ADR-COMM-010 Outbox / Inbox standard
ADR-COMM-011 Error taxonomy
ADR-COMM-012 Consumer retry / DLQ policy
ADR-COMM-013 Contract compatibility CI
ADR-COMM-014 Service discovery / load balancing
ADR-COMM-015 BFF / read projection policy
ADR-COMM-016 Payload size / event privacy
```

---

# 272. Phase 13 Policy Freeze Checklist

Before production resolve:

- [ ] Approved internal REST client.
- [ ] Approved gRPC stack.
- [ ] Service-auth mechanism.
- [ ] Service authorization/scopes.
- [ ] Correlation ID format.
- [ ] Request ID format.
- [ ] Trace propagation standard.
- [ ] Default connect-timeout safety net.
- [ ] Default response-timeout safety net.
- [ ] Critical operation timeout table.
- [ ] Deadline propagation mechanism.
- [ ] Retry ownership.
- [ ] Maximum request-path retry policy.
- [ ] Backoff/jitter policy.
- [ ] Retry budget policy.
- [ ] Circuit-breaker implementation.
- [ ] Circuit thresholds/config ownership.
- [ ] Bulkhead strategy.
- [ ] Connection pool standards.
- [ ] Load-shedding rules.
- [ ] REST internal versioning strategy.
- [ ] Protobuf package/version strategy.
- [ ] Kafka event envelope.
- [ ] Topic naming.
- [ ] Partition-key rules.
- [ ] Consumer dedupe standard.
- [ ] Outbox standard.
- [ ] Inbox standard.
- [ ] Retry/DLQ standard.
- [ ] Schema Registry strategy.
- [ ] Error taxonomy.
- [ ] Unknown-outcome semantics.
- [ ] Payload limits.
- [ ] Event privacy rules.
- [ ] Contract compatibility CI.
- [ ] Consumer inventory ownership.
- [ ] Dependency dashboard standard.
- [ ] Communication runbooks.
- [ ] SLO/alert thresholds.

---

# 273. Phase 13 Work Breakdown

Suggested tickets:

```text
COMM-001 Create platform communication standard module/docs
COMM-002 Create service communication matrix
COMM-003 Classify existing interactions as Command/Query/Event
COMM-004 Review sync vs async choices
COMM-005 Review REST vs gRPC choices
COMM-006 Define REST internal-client standard
COMM-007 Define gRPC client/server standard
COMM-008 Implement correlation ID middleware
COMM-009 Implement request ID middleware
COMM-010 Implement W3C trace propagation
COMM-011 Implement Kafka trace propagation
COMM-012 Define service-auth standard
COMM-013 Implement REST auth interceptor
COMM-014 Implement gRPC auth interceptor
COMM-015 Define service scopes
COMM-016 Define deadline propagation standard
COMM-017 Implement REST deadline handling
COMM-018 Implement gRPC deadlines
COMM-019 Define timeout configuration schema
COMM-020 Define retry ownership
COMM-021 Implement bounded retry support
COMM-022 Implement exponential backoff/jitter
COMM-023 Implement retry-budget monitoring
COMM-024 Implement circuit breaker support
COMM-025 Implement bulkhead support
COMM-026 Define connection-pool standards
COMM-027 Define load-shedding strategy
COMM-028 Define failure taxonomy
COMM-029 Implement REST error adapter
COMM-030 Implement gRPC error adapter
COMM-031 Implement unknown-outcome mapping
COMM-032 Define Kafka event envelope
COMM-033 Define Kafka command envelope
COMM-034 Define topic naming
COMM-035 Define partition-key policy
COMM-036 Implement outbox standard
COMM-037 Implement inbox/dedupe standard
COMM-038 Define consumer retry policy
COMM-039 Define DLQ metadata
COMM-040 Define DLQ replay procedure
COMM-041 Define event retention policy framework
COMM-042 Define schema compatibility policy
COMM-043 Add Protobuf compatibility CI
COMM-044 Add OpenAPI compatibility CI
COMM-045 Add Kafka schema compatibility CI
COMM-046 Create consumer inventory
COMM-047 Define service discovery standard
COMM-048 Verify gRPC load balancing
COMM-049 Review API Gateway responsibility
COMM-050 Define BFF/read projection guidance
COMM-051 Define batch API guidance
COMM-052 Audit N+1 service calls
COMM-053 Define fan-out limits
COMM-054 Define payload-size limits
COMM-055 Define event privacy standard
COMM-056 Implement communication metrics
COMM-057 Implement dependency dashboards
COMM-058 Implement timeout alerts
COMM-059 Implement retry/circuit alerts
COMM-060 Implement Kafka lag/DLQ alerts
COMM-061 Add REST integration tests
COMM-062 Add gRPC integration tests
COMM-063 Add Kafka consumer tests
COMM-064 Add deadline tests
COMM-065 Add retry tests
COMM-066 Add circuit-breaker tests
COMM-067 Add bulkhead tests
COMM-068 Add cascading-failure tests
COMM-069 Add contract compatibility tests
COMM-070 Write timeout runbook
COMM-071 Write retry-storm runbook
COMM-072 Write circuit-breaker runbook
COMM-073 Write consumer-lag runbook
COMM-074 Write DLQ runbook
COMM-075 Write contract-break runbook
COMM-076 Audit cross-service DB reads
COMM-077 Audit cross-service DB writes
COMM-078 Audit long synchronous chains
COMM-079 Audit shared-domain libraries
COMM-080 Complete ADRs / policy freeze
COMM-081 Phase 13 exit review
```

---

# 274. Step 1 — Existing Interaction Inventory

Inventory every cross-service interaction from Phases 04–12.

Capture:

```text
caller
callee
operation
business purpose
current protocol
state-changing?
current timeout?
current retry?
current auth?
```

---

# 275. Step 2 — Classify Semantics

For each interaction assign exactly one:

```text
COMMAND
QUERY
EVENT
```

Correct any ambiguous naming.

---

# 276. Step 3 — Decide Sync vs Async

For each interaction ask:

```text
Can caller complete its core transaction without the answer?
```

If no:

```text
synchronous candidate
```

If yes and it is downstream work:

```text
asynchronous candidate
```

---

# 277. Step 4 — Select Protocol

For synchronous:

```text
REST or gRPC
```

For asynchronous:

```text
Kafka
```

Only after semantic classification.

---

# 278. Step 5 — Freeze Contract Ownership

For each contract record:

```text
owner service
schema location
version
consumers
compatibility policy
```

---

# 279. Step 6 — Add Correlation

Verify:

```text
request_id
correlation_id
trace context
```

propagate across all approved transports.

---

# 280. Step 7 — Add Authentication

Verify every internal call authenticates a concrete service identity.

No trust based only on network location.

---

# 281. Step 8 — Add Authorization

Verify service scope for every critical Command.

Examples:

```text
inventory.reserve
wallet.reserve
payment.authorize
promotion.evaluate
```

---

# 282. Step 9 — Add Timeout / Deadline

Every sync call gets:

```text
connect timeout
response timeout/deadline
overall request budget
```

---

# 283. Step 10 — Add Retry

For each call document:

```text
retryable?
max attempts?
backoff?
jitter?
idempotency protection?
retry owner?
```

---

# 284. Step 11 — Add Circuit / Bulkhead

Critical dependency clients get approved:

```text
circuit breaker
bounded pool/bulkhead
```

where failure isolation is needed.

---

# 285. Step 12 — Add Outbox / Inbox

Reliable domain events use:

```text
producer Outbox
consumer Inbox/idempotency
```

No dual-write DB + Kafka without reliability pattern.

---

# 286. Step 13 — Add Retry / DLQ

Async consumer defines:

```text
retry policy
poison-message behavior
DLQ
controlled replay
```

---

# 287. Step 14 — Add Compatibility CI

CI rejects:

```text
breaking OpenAPI change
breaking Protobuf field change
invalid Kafka schema evolution
```

according to compatibility policy.

---

# 288. Step 15 — Add Observability

Every dependency produces:

```text
RED metrics
timeout/retry metrics
trace spans
correlated logs
```

Kafka produces:

```text
publish metrics
lag
oldest event age
DLQ
rebalance metrics
```

---

# 289. Step 16 — Failure Injection

Simulate:

```text
timeout
503
429
connection failure
slow Payment
Kafka outage
duplicate event
poison event
out-of-order event
```

Verify containment.

---

# 290. Phase 13 Acceptance — Semantics

The team can explain for every major interaction:

```text
Is it a Command, Query, or Event?
Why is it synchronous or asynchronous?
Why was REST/gRPC/Kafka selected?
Who owns the contract?
```

---

# 291. Phase 13 Acceptance — Time

The team can show:

```text
total request budget
downstream deadline
connect timeout
response timeout
retry time
```

without a downstream call outliving the upstream request budget unintentionally.

---

# 292. Phase 13 Acceptance — Retry

The team can prove:

```text
no unbounded retry
no duplicated retry layers
no retry on business rejection
state-changing retries are idempotent
```

---

# 293. Phase 13 Acceptance — Failure Isolation

The team can make one dependency slow and prove:

```text
circuit breaker
bulkhead
bounded pool
load-shedding
```

prevent total platform resource exhaustion.

---

# 294. Phase 13 Acceptance — Async Reliability

The team can demonstrate:

```text
producer DB commit succeeds while Kafka is down
outbox retains event
publisher later sends
consumer receives duplicate
inbox makes duplicate harmless
```

---

# 295. Phase 13 Acceptance — Contract Evolution

The team can:

```text
add backward-compatible field
detect breaking change in CI
deprecate contract with consumer inventory
migrate without synchronized big-bang deployment
```

---

# 296. Phase 13 Acceptance — Security

The team can prove:

```text
service identity is explicit
authorization scope is enforced
raw user token is not unnecessarily chained
event payload contains no unnecessary sensitive data
internal traffic is treated zero-trust
```

---

# 297. Phase 13 Acceptance — Observability

Given a checkout failure, operators can trace:

```text
Gateway
→ Order
→ Catalog
→ Inventory
→ Promotion
→ Payment / Wallet
```

and see:

```text
request_id
correlation_id
trace_id
dependency latency
timeout
retry count
result
```

---

# 298. Phase 13 Acceptance — Governance

Architecture checks reject:

```text
cross-service SQL
shared business entities
Kafka request-reply without justification
unowned event
critical call with no timeout
state-changing retry without idempotency
long synchronous chain
```

---

# 299. Phase 13 Completion Tree

```text
PHASE 13 — SERVICE COMMUNICATION

├── Semantics                                  ✅
│   ├── Command
│   ├── Query
│   └── Event
│
├── Protocol Selection                         ✅
│   ├── REST
│   ├── gRPC
│   └── Kafka
│
├── Sync / Async Standard                       ✅
├── Contract Ownership                         ✅
├── Contract Registry                          ✅
├── Request / Correlation IDs                  ✅
├── OpenTelemetry Trace Propagation            ✅
├── Service Authentication                     ✅
├── Service Authorization                      ✅
├── Timeout / Deadline                         ✅
├── Retry                                      ✅
│   ├── Bounded
│   ├── Backoff
│   ├── Jitter
│   └── Ownership
├── Circuit Breaker                            ✅
├── Bulkhead                                   ✅
├── Backpressure                               ✅
├── Load Shedding                              ✅
├── Service Discovery                          ✅
├── Load Balancing                             ✅
├── Batch / Fan-Out Rules                      ✅
├── Failure Taxonomy                           ✅
├── Outbox                                     ✅
├── Inbox / Consumer Dedupe                    ✅
├── DLQ / Replay                               ✅
├── Schema Compatibility                       ✅
├── Security / Privacy                         ✅
├── Metrics / Tracing / Logs                   ✅
├── Failure Injection                          ✅
├── Runbooks                                   ✅
└── Communication Governance                   ✅
```

---

# 300. Handoff to Phase 14

After Phase 13, continue to:

```text
PHASE 14 — Distributed Transactions / Saga
```

Phase 13 has now standardized:

```text
how services communicate
how calls time out
how calls retry
how calls authenticate
how events are delivered
how duplicate messages are tolerated
how unknown outcomes are represented
```

Phase 14 will define:

```text
how one business workflow coordinates multiple service-local transactions
```

including:

```text
Saga orchestration
Saga choreography
durable workflow state
compensation
participant idempotency
unknown outcomes
recovery
timeouts
convergence
reconciliation
```

---

# 301. Phase 14 Prerequisite Contracts

The following commands must already be safe participants:

```text
ReserveInventory
ReleaseInventory

ReservePromotion
RedeemPromotion
ReleasePromotion

Create/Authorize/CapturePayment
Refund/ReversePayment

ReserveWalletFunds
CaptureWalletFunds
ReleaseWalletFunds
RefundWalletFunds
```

Each must have:

```text
stable business reference
idempotency
timeout semantics
retry semantics
query/recovery path where required
```

---

# 302. Final Phase 13 Principle

The platform communication rule is:

```text
Business Semantics
       ↓
Command / Query / Event
       ↓
Sync or Async
       ↓
REST / gRPC / Kafka
       ↓
Timeout + Deadline
       ↓
Idempotency + Retry
       ↓
Security + Observability
       ↓
Reliable Production Communication
```

The most important implementation rules are:

```text
Choose communication from business semantics.
Do not default everything to synchronous RPC.
Do not default everything to Kafka.
Commands, Queries, and Events have different meanings.
The provider owns its contract.
REST/gRPC/Kafka models stay out of Domain.
Every synchronous call has a timeout and overall deadline.
Retries are bounded, backed off, jittered, and safe.
State-changing retries require idempotency.
Retry ownership is explicit.
Circuit breakers and bulkheads isolate failures.
Critical request chains remain shallow.
N+1 service calls are replaced by batch APIs.
Strong business decisions use authoritative services.
Stale projections are only used where business permits.
Cross-service DB reads and writes are prohibited.
Kafka delivery is treated as at-least-once.
Consumers are idempotent.
Reliable producers use transactional Outbox.
Reliable consumers use Inbox/deduplication.
Event contracts are versioned and backward-compatible.
Internal traffic is zero-trust.
Correlation and trace context propagate end to end.
Errors do not leak internal infrastructure.
Fallback never violates business correctness.
Communication behavior is tested under failure, not only success.
```

---

**End of PHASE 13 — Service Communication**
