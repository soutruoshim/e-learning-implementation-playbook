---
title: "PART 21 — SERVICE COMMUNICATION"
---

# PART 21 — SERVICE COMMUNICATION

> **Document Role:** Defines the complete architecture, patterns, contracts, reliability rules, and production standards for communication between platform services.  
> **Previous Part:** PART 20 — Integration / Anti-Corruption Layer  
> **Next Part:** PART 22 — Distributed Transactions  
> **Status:** Platform Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, REST, gRPC, Kafka, PostgreSQL, Redis where appropriate, OpenTelemetry  
> **Audience:** Backend engineers, software architects, platform engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 3696 — Purpose

Service Communication defines how independent platform services exchange:

```text
commands
queries
events
responses
errors
correlation context
```

It answers:

```text
Should this interaction be synchronous or asynchronous?
Should we use REST, gRPC, or Kafka?
Who owns the contract?
What timeout applies?
Can the request be retried?
What happens when the dependency is slow or unavailable?
How do we prevent retry storms?
How do we preserve trace context?
How do we evolve contracts safely?
How do we avoid turning microservices into a distributed monolith?
```

The core principle is:

```text
Choose communication based on business semantics,
not technology preference.
```

---

# 3697 — Communication Goals

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

It should avoid:

```text
hidden coupling
unbounded retries
long synchronous chains
shared database access
implicit contracts
provider-specific leakage
```

---

# 3698 — Communication Categories

Primary categories:

```text
Synchronous Request/Response
Asynchronous Command
Asynchronous Event
Streaming
Batch
```

This chapter focuses on:

```text
REST
gRPC
Kafka
```

for internal service communication.

---

# 3699 — Synchronous Communication

Synchronous communication means:

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

# 3700 — Asynchronous Communication

Asynchronous communication means:

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

# 3701 — Synchronous Decision Rule

Use synchronous communication when:

```text
caller cannot proceed without the answer
```

Examples:

```text
Can inventory be reserved?
Is this coupon valid right now?
Did payment authorize?
What is the current catalog price?
```

---

# 3702 — Asynchronous Decision Rule

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

# 3703 — Avoid Synchronous-by-Default

Do not make every service call another service synchronously simply because REST/gRPC is easy.

Long chains create:

```text
latency multiplication
availability multiplication
failure propagation
tight coupling
```

---

# 3704 — Avoid Event-Driven-by-Default

Do not publish events for every simple query.

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

# 3705 — Communication Decision Matrix

| Need | Preferred Pattern |
|---|---|
| Immediate answer required | REST/gRPC |
| Internal typed low-latency RPC | gRPC |
| Public/external-facing API | REST |
| Domain fact broadcast | Kafka event |
| Fire-and-forget business command | Kafka command where appropriate |
| Large asynchronous workload | Kafka |
| Read current state | REST/gRPC |
| Cross-domain eventual consistency | Kafka |
| Human/admin integration | REST |

---

# 3706 — REST

REST is preferred for:

```text
client-facing APIs
admin APIs
simple internal APIs
debuggable HTTP workflows
resource-oriented access
```

---

# 3707 — gRPC

gRPC is preferred for:

```text
internal service-to-service RPC
strongly typed contracts
low latency
high request volume
streaming where needed
```

---

# 3708 — Kafka

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

# 3709 — REST vs gRPC

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

# 3710 — gRPC Is Not Automatically Better

Do not migrate every internal endpoint to gRPC without clear benefit.

Operational complexity includes:

```text
protobuf lifecycle
gateway translation
debug tooling
load balancing behavior
HTTP/2 requirements
```

---

# 3711 — Kafka Is Not RPC

Avoid using Kafka for:

```text
simple immediate request-response queries
```

unless there is a strong architectural reason.

Kafka should not become:

```text
a distributed function-call bus
```

---

# 3712 — Communication Semantics

Every interaction must be classified as one of:

```text
COMMAND
QUERY
EVENT
```

---

# 3713 — Command

A command asks another service to perform an action.

Examples:

```text
ReserveInventory
AuthorizePayment
CaptureWalletFunds
SendNotification
AssignReward
```

A command can fail.

A command has:

```text
one logical owner/handler
```

---

# 3714 — Query

A query requests information.

Examples:

```text
GetProduct
GetOrderableItem
GetCustomerSummary
GetWalletBalance
GetPaymentStatus
```

Query should:

```text
not change business state
```

---

# 3715 — Event

An event states:

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

# 3716 — Command vs Event

Correct:

```text
Command:
ReserveInventory

Event:
InventoryReserved
```

Incorrect:

```text
event named ReserveInventory
```

because that is an instruction, not a fact.

---

# 3717 — Event Naming

Use past tense:

```text
OrderCreated
OrderAccepted
OrderCompleted
PaymentCaptured
PointsEarned
CouponRedeemed
```

---

# 3718 — Command Naming

Use imperative intent:

```text
CreateOrder
ReserveInventory
CapturePayment
ReleaseWalletFunds
AssignReward
```

---

# 3719 — Query Naming

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

# 3720 — Contract Ownership

The provider service owns:

```text
request/response/event schema
semantic meaning
compatibility policy
```

Consumers do not redefine provider contracts independently.

---

# 3721 — Contract Registry

Maintain contracts in:

```text
OpenAPI
Protobuf
Kafka schema definitions
```

with version control.

---

# 3722 — Contract Repository Options

Possible:

```text
shared contract repository
service-owned contract folder
schema registry
generated client package
```

Ownership must remain with provider service.

---

# 3723 — Shared Library Warning

Do not share:

```text
domain entities
JPA entities
service internals
```

as common libraries.

Share only:

```text
contract DTOs
protobuf definitions
platform utilities
```

when justified.

---

# 3724 — Shared DTO Coupling

Generated API client is acceptable.

Shared Java domain model across services is not.

Services must remain independently deployable.

---

# 3725 — REST Contract Structure

Internal REST request should include:

```text
business fields
idempotency key where required
correlation ID
authorization context
```

---

# 3726 — gRPC Contract Structure

Protobuf message should use:

```text
stable field numbers
explicit enum values
well-defined optional fields
```

Never reuse removed field numbers.

---

# 3727 — Kafka Event Structure

Recommended envelope:

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

# 3728 — Event ID

Every integration/domain event should have:

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

# 3729 — Correlation ID

Correlation ID follows one business workflow.

Example:

```text
client request
→ Order
→ Inventory
→ Payment
→ Kafka events
→ Loyalty
```

Same correlation context should be propagated.

---

# 3730 — Request ID

Request ID identifies:

```text
one transport request
```

Correlation ID identifies:

```text
larger business flow
```

They are not always identical.

---

# 3731 — Trace Context

Use OpenTelemetry / W3C Trace Context:

```text
traceparent
tracestate
```

for synchronous calls.

Kafka headers propagate trace context asynchronously.

---

# 3732 — Baggage

Use trace baggage carefully.

Do not propagate:

```text
PII
tokens
secrets
large context
```

---

# 3733 — Authentication

Every service-to-service call must authenticate.

Possible:

```text
mTLS
service JWT
OAuth2 client credentials
service mesh identity
```

Security architecture from PART 06 applies.

---

# 3734 — Authorization

Authentication answers:

```text
who is calling?
```

Authorization answers:

```text
is this service allowed to perform this operation?
```

---

# 3735 — Service Identity

Use service identities such as:

```text
order-service
payment-service
wallet-service
```

not generic:

```text
backend
internal
system
```

---

# 3736 — Internal Scope Examples

Examples:

```text
inventory.reserve
payment.authorize
wallet.reserve
promotion.evaluate
notification.send
```

---

# 3737 — User Context Propagation

Do not forward raw user access token to every downstream service automatically.

Prefer:

```text
service authentication
+
minimal user context
```

where downstream authorization requires it.

---

# 3738 — Delegated User Context

If service must enforce user-specific authorization, propagate signed claims such as:

```text
user_id
roles/scopes
session context
```

or use token exchange.

---

# 3739 — Avoid Token Chaining

Long synchronous chains that pass the same end-user JWT everywhere increase:

```text
security exposure
coupling
```

Use platform service identity model.

---

# 3740 — Synchronous Call Budget

Each request has a total deadline.

Example:

```text
Gateway request budget = 2 seconds
```

Downstream calls must fit inside this budget.

---

# 3741 — Deadline Propagation

Caller sends:

```text
remaining deadline
```

to dependency.

Dependency must not use a longer timeout than caller's remaining budget.

---

# 3742 — Timeout Hierarchy

Example:

```text
Client timeout      3.0s
Gateway timeout     2.5s
Order budget        2.0s
Catalog call        300ms
Inventory call      500ms
Payment call        800ms
```

Illustrative only.

---

# 3743 — Timeout Rule

Timeouts must be:

```text
explicit
short enough
operation-specific
```

Never use one global 30-second timeout for every dependency.

---

# 3744 — Connect Timeout

Protects:

```text
connection establishment
```

Typically shorter than read timeout.

---

# 3745 — Read Timeout

Protects:

```text
response wait
```

Must align with dependency SLO.

---

# 3746 — Overall Deadline

Overall deadline includes:

```text
connection
processing
retries
serialization
```

---

# 3747 — Retry Rule

Retry only if operation is:

```text
idempotent
or
protected by idempotency key
```

---

# 3748 — Safe Retry Examples

Usually safe:

```text
GET
idempotent gRPC query
ReserveInventory with idempotency key
CreatePayment with idempotency key
```

---

# 3749 — Unsafe Retry Example

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

# 3750 — Retry Count

Prefer:

```text
small bounded retry
```

Example:

```text
0–2 retries
```

depending operation.

Do not use 10 automatic retries in request path.

---

# 3751 — Retry Backoff

Use:

```text
exponential backoff
+
jitter
```

to avoid synchronized retry storms.

---

# 3752 — Retry Budget

A service may enforce:

```text
maximum fraction of traffic allowed as retries
```

Example:

```text
10% retry budget
```

to protect degraded systems.

---

# 3753 — Retry Storm

Failure pattern:

```text
dependency slows
↓
callers timeout
↓
all callers retry
↓
dependency load doubles/triples
↓
dependency fails harder
```

Prevent with:

```text
bounded retries
jitter
circuit breaker
load shedding
```

---

# 3754 — Circuit Breaker

Use around unstable synchronous dependency.

States:

```text
CLOSED
OPEN
HALF_OPEN
```

---

# 3755 — Circuit Breaker Trigger

May open based on:

```text
failure rate
slow-call rate
minimum sample size
```

---

# 3756 — Circuit Breaker Behavior

When open:

```text
fail fast
```

or return approved fallback.

Do not wait for guaranteed timeout.

---

# 3757 — Circuit Breaker Scope

Per:

```text
service
operation
provider
```

not one global breaker for all dependencies.

---

# 3758 — Bulkhead

Isolate resource pools.

Examples:

```text
Payment client pool
Catalog client pool
Legacy integration pool
```

One dependency must not consume all threads/connections.

---

# 3759 — Connection Pool

Set bounded:

```text
max connections
pending acquisition
idle timeout
```

Do not let connection count grow unbounded.

---

# 3760 — Thread Pool

Avoid blocking network clients consuming large worker thread pools.

Prefer:

```text
proper non-blocking client
or bounded blocking pool
```

depending stack.

---

# 3761 — Load Shedding

When overloaded:

```text
reject low-priority work early
```

instead of letting latency become infinite.

---

# 3762 — Backpressure

Asynchronous systems must prevent producers from overwhelming consumers.

Kafka naturally buffers, but application must monitor:

```text
consumer lag
processing throughput
partition utilization
```

---

# 3763 — Consumer Lag

Lag measures:

```text
events waiting to be processed
```

Monitor:

```text
records lag
oldest event age
```

---

# 3764 — Backlog Age

Oldest event age often matters more than count.

Example:

```text
100,000 notifications
```

may be fine if processed quickly.

But:

```text
10 events waiting 30 minutes
```

may indicate stuck partition.

---

# 3765 — Kafka Topic Ownership

Producer domain owns:

```text
event meaning
schema
compatibility
```

Platform team may own:

```text
cluster
topic provisioning standards
retention defaults
```

---

# 3766 — Topic Naming

Recommended:

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

Alternative per-event topics may be used if operational needs justify.

---

# 3767 — Topic Granularity

Avoid:

```text
one topic for every tiny event
```

and avoid:

```text
one giant platform-events topic
```

Choose coherent domain stream.

---

# 3768 — Kafka Partition Key

Use business aggregate ID:

```text
order_id
payment_id
wallet_id
customer_id
```

depending event family.

Goal:

```text
preserve ordering per aggregate
```

---

# 3769 — Global Ordering

Kafka does not provide useful global ordering across all partitions.

Do not design:

```text
entire platform depends on total event order
```

---

# 3770 — Per-Aggregate Ordering

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

# 3771 — Event Reordering

Consumers must still tolerate:

```text
retry
late delivery
cross-topic ordering differences
```

Do not assume events from separate topics arrive in exact business order.

---

# 3772 — Event Duplication

Kafka processing is normally:

```text
at least once
```

Consumers must be idempotent.

---

# 3773 — Exactly Once Misconception

Kafka transactions can improve broker-level guarantees.

They do not automatically make:

```text
database side effect
+
external API
+
consumer processing
```

globally exactly once.

Use:

```text
idempotency
outbox
inbox
```

---

# 3774 — Consumer Idempotency

Store:

```text
event_id
consumer_name
```

or business uniqueness.

---

# 3775 — Inbox Pattern

Consumer local DB:

```text
processed_events
```

records consumed events.

Transaction:

```text
check not processed
apply business change
mark processed
commit
```

---

# 3776 — Outbox Pattern

Producer local transaction:

```text
business state change
+
outbox row
```

then asynchronous publisher sends to Kafka.

---

# 3777 — Outbox Publisher

Worker:

```text
select unpublished events
publish Kafka
mark published
```

Use idempotent producer where possible.

---

# 3778 — Outbox Failure

If Kafka unavailable:

```text
business transaction remains committed
outbox backlog grows
```

Publisher retries later.

---

# 3779 — Outbox Ordering

For aggregate ordering:

```text
publish by aggregate sequence/order
```

where necessary.

---

# 3780 — Event Sequence Number

Optional:

```text
aggregate_version
```

in event.

Example:

```text
order_version = 5
```

Consumer can detect stale event.

---

# 3781 — Event Schema Evolution

Prefer:

```text
add optional field
add enum value carefully
preserve existing meaning
```

Avoid:

```text
rename/remove required field without version
change field semantics silently
```

---

# 3782 — Backward Compatibility

New producer must remain compatible with old consumers during rollout.

Use:

```text
consumer-first change
```

where required.

---

# 3783 — Breaking Event Change

Create:

```text
event_version = 2
```

or:

```text
new topic/contract
```

and run migration period.

---

# 3784 — Protobuf Compatibility

Rules:

```text
never reuse field numbers
reserve removed fields
add optional fields
avoid changing scalar type incompatibly
```

---

# 3785 — REST Compatibility

Avoid:

```text
removing response fields
changing field type
changing error meaning
```

without API versioning/deprecation.

---

# 3786 — API Versioning

Internal APIs may use:

```text
/v1/
```

or Protobuf package versions.

Version only when compatibility requires, not every deployment.

---

# 3787 — Deprecation

Contract deprecation requires:

```text
owner
consumers identified
deadline
migration path
observability
```

---

# 3788 — Consumer Inventory

Maintain list of:

```text
service
contract
version
owner
```

for important internal APIs/events.

---

# 3789 — Service Discovery

Inside Kubernetes:

```text
DNS service name
```

Example:

```text
inventory-service.namespace.svc.cluster.local
```

Applications should usually use logical service names.

---

# 3790 — Client-Side Discovery

In Kubernetes, platform networking handles discovery.

Do not add custom service registry unless needed.

---

# 3791 — Load Balancing

REST/gRPC requests may use:

```text
Kubernetes Service
service mesh
client-side load balancing
```

depending architecture.

---

# 3792 — gRPC Load Balancing

Be careful with long-lived HTTP/2 connections.

Ensure traffic distributes across pods.

Possible:

```text
service mesh
DNS resolver
client-side balancing
```

---

# 3793 — Service Mesh

Service mesh can provide:

```text
mTLS
traffic policy
telemetry
retries
circuit breaking
```

but should not hide application-level business rules.

Detailed networking is later PART 30.

---

# 3794 — Infrastructure Retry vs Application Retry

Avoid duplicate retry layers.

Example bad:

```text
application retries 3x
mesh retries 3x
gateway retries 2x
```

Potential calls:

```text
18 attempts
```

Define retry ownership.

---

# 3795 — Retry Ownership

Recommended:

```text
application owns business-aware retries
mesh/gateway retries disabled or minimal for state-changing calls
```

---

# 3796 — Gateway Communication

API Gateway should handle:

```text
external auth
routing
rate limiting
request IDs
coarse validation
```

It should not orchestrate complex business workflows.

---

# 3797 — Gateway Anti-Pattern

Avoid:

```text
Gateway calls 5 services
combines business decision
writes order
```

Business orchestration belongs in domain/application service.

---

# 3798 — Backend-for-Frontend

If mobile/web needs specialized aggregation:

```text
BFF
```

may aggregate reads.

Do not put domain ownership into BFF.

---

# 3799 — Query Aggregation

For UI:

```text
Order detail
+
payment summary
+
reward summary
```

Possible approaches:

```text
BFF synchronous aggregation
read-model projection
API composition
```

---

# 3800 — Query Fan-Out Warning

BFF calling 10 services per screen creates:

```text
latency
availability coupling
```

Prefer:

```text
coarse APIs
read projections
```

where justified.

---

# 3801 — Read Model Projection

Asynchronous projection can combine events into:

```text
customer dashboard
order summary
admin view
```

without synchronous fan-out.

---

# 3802 — Data Ownership in Projection

Projection is:

```text
read-only derived data
```

not source of truth.

---

# 3803 — Stale Projection

Read model may lag.

UI must know whether eventual consistency is acceptable.

---

# 3804 — Strong Query Requirement

For financial/checkout decisions use:

```text
authoritative service
```

not stale projection.

Examples:

```text
wallet available balance
inventory reserve
coupon redemption
payment status for financial action
```

---

# 3805 — Communication Failure Categories

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

# 3806 — Technical Failure vs Business Rejection

Technical:

```text
503
timeout
connection reset
```

Business:

```text
insufficient stock
insufficient wallet balance
coupon expired
```

Do not retry business rejection blindly.

---

# 3807 — Failure Propagation

Caller should translate dependency failures into its own contract.

Example:

```text
InventoryUnavailable
```

may become:

```text
CHECKOUT_TEMPORARILY_UNAVAILABLE
```

at Order API.

---

# 3808 — Error Leakage

Do not expose:

```text
internal host
stack trace
SQL error
raw provider response
```

through service boundaries.

---

# 3809 — gRPC Error Mapping

Use canonical status codes:

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

with structured error details.

---

# 3810 — REST Error Mapping

Use platform error envelope from PART 05:

```text
code
message
details
request_id
```

---

# 3811 — Retryable Error Metadata

Internal contracts may include:

```text
retryable = true/false
```

where appropriate.

But caller should also know semantics.

---

# 3812 — Deadline Exceeded

When caller deadline expires:

```text
stop waiting
cancel downstream request where possible
```

Dependency may still have completed side effect.

For state changes, idempotency handles retry.

---

# 3813 — Cancellation Propagation

gRPC supports cancellation/deadline propagation.

Application must ensure:

```text
cancelling client wait
```

does not corrupt already committed business operation.

---

# 3814 — Request Cancellation Semantics

Example:

```text
client disconnects during CreateOrder
```

Order may still complete.

Idempotency lets client query/retry safely.

---

# 3815 — Hedged Requests

Sending duplicate reads to reduce tail latency can be used carefully for:

```text
idempotent read-only operations
```

Avoid for state-changing operations.

---

# 3816 — Cache Between Services

A caller may cache read responses when:

```text
staleness acceptable
```

Examples:

```text
catalog metadata
store configuration
```

Never cache:

```text
authoritative stock reservation result
wallet balance for spend decision
```

as a substitute for owner.

---

# 3817 — Local Projection vs Direct Query

If a service repeatedly needs external data at runtime:

```text
consider local event-driven projection
```

instead of synchronous call on every request.

---

# 3818 — Projection Candidate

Good candidate:

```text
customer tier
store metadata
product availability advisory
```

when eventual consistency is acceptable.

---

# 3819 — Projection Anti-Pattern

Do not replicate:

```text
entire source database
```

into every service.

Project only required fields.

---

# 3820 — Communication Dependency Graph

Maintain architecture graph:

```text
Order → Catalog
Order → Inventory
Order → Payment
Order → Promotion
Payment → Provider
Notification ← Order events
Loyalty ← Order events
Mission ← Order/Wallet events
```

---

# 3821 — Dependency Direction

Avoid cycles such as:

```text
Order → Loyalty
Loyalty → Order
```

for synchronous runtime dependencies.

Prefer event projection to break cycles.

---

# 3822 — Circular Dependency Risk

Circular service calls can create:

```text
deadlocks
deployment coupling
failure loops
```

Architectural review should flag cycles.

---

# 3823 — Allowed Synchronous Dependency Depth

Recommended:

```text
keep critical request chains shallow
```

Typical target:

```text
Gateway → Domain Service → 1–3 critical dependencies
```

not:

```text
A → B → C → D → E → F
```

---

# 3824 — Latency Multiplication

If:

```text
A calls B
B calls C
C calls D
```

tail latency compounds.

Measure:

```text
end-to-end P95/P99
```

not only each service average.

---

# 3825 — Availability Multiplication

If independent required dependencies each have:

```text
99.9% availability
```

combined critical path is lower.

Reduce required synchronous dependencies.

---

# 3826 — Critical Path

Document for each API:

```text
required synchronous calls
optional calls
async follow-up
```

---

# 3827 — Example: Create Order Critical Path

Potential:

```text
Gateway
  ↓
Order
  ├── Catalog
  ├── Inventory
  ├── Promotion
  └── Payment/Wallet
```

Secondary:

```text
Notification
Loyalty
Mission
Analytics
```

must remain async.

---

# 3828 — Example: Order Completion Critical Path

Critical:

```text
Order state transition
```

Possibly:

```text
inventory consumption
financial prerequisite
```

Async:

```text
Loyalty
Mission
Notification
Analytics
```

---

# 3829 — Example: Wallet Reserve Critical Path

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

during financial transaction.

---

# 3830 — Communication Budget Document

For each synchronous endpoint document:

```text
total deadline
dependency timeouts
retry count
fallback
```

---

# 3831 — Example Budget

```text
CreateOrder total target: 1500ms

Catalog:   250ms
Promotion: 250ms
Inventory: 350ms
Payment:   500ms

local work: remaining budget
```

Illustrative only.

---

# 3832 — Parallel Calls

Independent reads may execute in parallel.

Example:

```text
Catalog validation
+
Customer summary
```

if neither depends on the other.

---

# 3833 — Parallel Call Caution

Parallel calls increase:

```text
downstream burst
connection usage
```

Use bounded concurrency.

---

# 3834 — Sequential Calls

Use sequential when:

```text
next call depends on previous result
```

Example:

```text
Catalog price
→ calculate order amount
→ authorize payment
```

---

# 3835 — Fan-Out Limit

Set bounded maximum downstream parallelism.

Never fan out one request to:

```text
hundreds of service calls
```

---

# 3836 — Batch APIs

Instead of:

```text
100 GetProduct calls
```

use:

```text
BatchGetProducts
```

where appropriate.

---

# 3837 — N+1 Service Call Problem

Avoid:

```text
for each order item:
    call Catalog
```

Use batch contract.

---

# 3838 — Batch Contract

Example:

```text
GetOrderableItems(product_ids[])
```

Response preserves:

```text
per-item result
```

---

# 3839 — Batch Size Limit

Every batch API defines:

```text
max item count
payload size
timeout
```

---

# 3840 — Streaming

gRPC streaming/Kafka streams may be used for:

```text
large continuous data
real-time feeds
```

Do not use streaming for ordinary CRUD.

---

# 3841 — Request-Reply over Kafka

Possible but generally avoid for normal synchronous business API.

It adds:

```text
correlation
reply topic
timeout
complexity
```

Use only when async infrastructure is a deliberate requirement.

---

# 3842 — Kafka Commands

Asynchronous command example:

```text
GenerateStatement
SyncOrderToLegacy
SendCampaignBatch
```

One logical handler.

---

# 3843 — Command Topic Ownership

Command destination usually owned by receiver.

Example:

```text
notification.commands.v1
```

if command-based communication is selected.

---

# 3844 — Command Deduplication

Kafka commands require:

```text
command_id
idempotency
```

same as synchronous commands.

---

# 3845 — Event Fan-Out

One event can have many consumers.

Example:

```text
OrderCompleted
  ├── Loyalty
  ├── Mission
  ├── Notification
  ├── Analytics
  └── Integration
```

Producer does not know every consumer.

---

# 3846 — Consumer Independence

One consumer failure must not block others.

Each consumer group:

```text
has independent offset
retry
DLQ
```

---

# 3847 — Poison Event

An event that always fails due to:

```text
bad schema
bad data
consumer bug
```

must not block partition forever.

Use:

```text
bounded retry
DLQ
alert
```

---

# 3848 — Retry Topic

Possible pattern:

```text
main topic
→ retry topic
→ DLQ
```

or application-scheduled retry.

Choose one platform standard.

---

# 3849 — DLQ Policy

DLQ entry stores:

```text
event ID
consumer
failure reason
original topic
partition
offset
retry count
```

---

# 3850 — DLQ Replay Policy

Replay after:

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

# 3851 — Event Retention

Topic retention depends on:

```text
replay need
business importance
storage
```

Financial/business events often need longer retention than transient commands.

---

# 3852 — Compaction

Kafka compacted topic may be appropriate for:

```text
latest reference/config state
```

not for immutable event history unless semantics fit.

---

# 3853 — Consumer Offset

Consumer offset is operational position.

It is not business idempotency.

Do not rely only on:

```text
offset commit
```

to prevent duplicate side effect.

---

# 3854 — Offset Commit Timing

Common:

```text
process successfully
then commit
```

If crash after DB commit before offset commit:

```text
event replays
```

Inbox idempotency handles it.

---

# 3855 — Database + Kafka Transaction Boundary

Do not attempt distributed DB/Kafka 2PC.

Use:

```text
outbox
```

for producer.

Use:

```text
inbox/idempotency
```

for consumer.

---

# 3856 — Service Communication Security

Controls:

```text
TLS/mTLS
service identity
authorization
network policy
schema validation
rate limiting
payload size limits
```

---

# 3857 — Internal Does Not Mean Trusted

Treat internal network as:

```text
zero trust
```

Services authenticate and validate each other.

---

# 3858 — Payload Validation

Validate:

```text
required fields
ranges
enum
money
IDs
timestamps
array sizes
```

even between internal services.

---

# 3859 — Payload Size

Set limits for:

```text
REST body
gRPC message
Kafka event
```

Avoid giant events with full object graphs.

---

# 3860 — Event Payload Design

Event should include:

```text
facts needed by likely consumers
```

not:

```text
entire database entity graph
```

---

# 3861 — Event Enrichment

Too little data causes consumers to synchronously call producer.

Too much data leaks ownership.

Balance carefully.

---

# 3862 — Event Reference Pattern

Example:

```text
OrderCompleted
```

includes:

```text
order_id
customer_id
store_id
fulfillment_type
net amount
currency
```

if Loyalty/Mission need those facts.

---

# 3863 — Event Privacy

Do not put unnecessary:

```text
phone
email
address
access token
```

into shared Kafka topics.

---

# 3864 — Contract Testing

Provider tests:

```text
schema
compatibility
examples
```

Consumer tests:

```text
expected fields
behavior
```

---

# 3865 — Consumer-Driven Contract Testing

Can be useful for synchronous APIs.

Do not allow consumers to control provider architecture entirely.

Provider still owns semantic contract.

---

# 3866 — Protobuf Contract Test

CI validates:

```text
breaking field changes
enum changes
field number reuse
```

---

# 3867 — OpenAPI Contract Test

CI validates:

```text
schema
breaking changes
required fields
response compatibility
```

---

# 3868 — Kafka Schema Validation

Use:

```text
JSON Schema
Avro
Protobuf
```

with registry where appropriate.

---

# 3869 — Schema Registry

Benefits:

```text
compatibility checks
schema discovery
producer/consumer governance
```

Detailed Kafka architecture continues in PART 23.

---

# 3870 — Communication Observability

Every service call should record:

```text
dependency
operation
latency
result
timeout
retry count
```

---

# 3871 — RED Metrics

For synchronous APIs:

```text
Rate
Errors
Duration
```

---

# 3872 — Kafka Metrics

Monitor:

```text
producer error
publish latency
consumer lag
processing latency
DLQ rate
rebalances
```

---

# 3873 — Dependency Dashboard

For each service:

```text
outbound dependency matrix
success rate
P95/P99 latency
circuit state
retry rate
```

---

# 3874 — Trace Span Naming

Use stable:

```text
grpc InventoryService/Reserve
http GET /internal/v1/catalog/items
kafka consume order.events.v1
```

---

# 3875 — Trace Attributes

Include:

```text
service
operation
result
```

Avoid:

```text
PII
high-cardinality IDs as metric labels
```

Trace can include selected IDs where policy allows.

---

# 3876 — Logging Correlation

Every error log for service communication should include:

```text
request_id
correlation_id
trace_id
dependency
operation
```

---

# 3877 — Communication Metrics

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

# 3878 — Communication SLIs

Potential:

```text
dependency success rate
P95 dependency latency
consumer event latency
message publish success
DLQ rate
```

---

# 3879 — Alerts

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

# 3880 — Runbooks

Required:

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

# 3881 — Timeout Spike Runbook

```text
identify dependency
check dependency latency
check network/DNS
check connection pool
reduce retries if storm
load shed if necessary
```

---

# 3882 — Consumer Lag Runbook

```text
check processing rate
check partition count
check poison event
check DB latency
check consumer rebalances
scale consumers within partition limit
```

---

# 3883 — DLQ Runbook

```text
categorize failures
fix root cause
verify idempotency
replay controlled batch
monitor side effects
```

---

# 3884 — Contract Break Runbook

```text
identify producer deployment
rollback if necessary
compare schema versions
restore compatibility
add CI guard
```

---

# 3885 — Communication Failure Testing

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

# 3886 — REST Integration Tests

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
auth failure
```

---

# 3887 — gRPC Integration Tests

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

# 3888 — Kafka Consumer Tests

Test:

```text
normal event
duplicate
old version
new additive field
poison event
retry
DLQ
```

---

# 3889 — Deadline Tests

Verify:

```text
downstream timeout < upstream timeout
```

and request cancels appropriately.

---

# 3890 — Retry Tests

Verify:

```text
no retry on business rejection
bounded retries on transient failure
jitter/backoff
idempotency
```

---

# 3891 — Circuit Breaker Tests

Verify:

```text
opens at threshold
fails fast
half-open probes
recovers
```

---

# 3892 — Bulkhead Tests

Make one dependency hang.

Verify:

```text
other dependency calls still work
```

---

# 3893 — Load Tests

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

# 3894 — Cascading Failure Test

Simulate:

```text
Payment slows
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

# 3895 — Definition of Done: Synchronous Contract

- [ ] Command/query semantics clear.
- [ ] Owner identified.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Timeout.
- [ ] Deadline.
- [ ] Retry policy.
- [ ] Idempotency if state changing.
- [ ] Error mapping.
- [ ] Metrics/tracing.
- [ ] Contract tests.
- [ ] Runbook.

---

# 3896 — Definition of Done: Kafka Event

- [ ] Event fact named in past tense.
- [ ] Producer owner.
- [ ] Event ID.
- [ ] Version.
- [ ] Timestamp.
- [ ] Correlation ID.
- [ ] Partition key.
- [ ] Schema compatibility.
- [ ] Consumer idempotency.
- [ ] DLQ policy.
- [ ] Retention.
- [ ] Observability.

---

# 3897 — Definition of Done: Kafka Command

- [ ] Command owner.
- [ ] Command ID.
- [ ] Idempotency.
- [ ] One logical handler.
- [ ] Timeout/deadline expectation if applicable.
- [ ] Retry.
- [ ] DLQ.
- [ ] Result semantics.

---

# 3898 — Communication Review Checklist

## Semantics

- [ ] Command/query/event classified.
- [ ] Sync vs async justified.
- [ ] Contract owner clear.
- [ ] Business vs technical error separated.

## Reliability

- [ ] Timeout.
- [ ] Deadline.
- [ ] Retry.
- [ ] Circuit breaker.
- [ ] Bulkhead.
- [ ] Backpressure.
- [ ] Idempotency.

## Observability

- [ ] Correlation ID.
- [ ] Trace context.
- [ ] Metrics.
- [ ] Logs.
- [ ] Alerts.

---

# 3899 — REST Review Checklist

- [ ] Endpoint versioning.
- [ ] Request/response schema.
- [ ] Error envelope.
- [ ] Auth.
- [ ] Timeout.
- [ ] Idempotency header where required.
- [ ] Pagination for list.
- [ ] Payload limit.
- [ ] Contract test.

---

# 3900 — gRPC Review Checklist

- [ ] Proto owner.
- [ ] Stable field numbers.
- [ ] Deadlines.
- [ ] Status-code mapping.
- [ ] Service auth.
- [ ] Load balancing.
- [ ] Message-size limit.
- [ ] Contract compatibility.

---

# 3901 — Kafka Review Checklist

- [ ] Topic owner.
- [ ] Event/command semantics.
- [ ] Partition key.
- [ ] Retention.
- [ ] Schema.
- [ ] Consumer group.
- [ ] Inbox/dedupe.
- [ ] Retry/DLQ.
- [ ] Lag alert.
- [ ] Replay procedure.

---

# 3902 — Security Review Checklist

- [ ] mTLS/TLS.
- [ ] Service identity.
- [ ] Authorization scope.
- [ ] Payload validation.
- [ ] No sensitive event data.
- [ ] Token propagation minimized.
- [ ] Internal zero-trust applied.

---

# 3903 — Performance Review Checklist

- [ ] Critical path documented.
- [ ] Call depth controlled.
- [ ] Batch API used where appropriate.
- [ ] N+1 avoided.
- [ ] Parallelism bounded.
- [ ] Connection pools sized.
- [ ] P95/P99 measured.

---

# 3904 — Production Readiness Checklist

Before production:

- [ ] Critical API communication matrix documented.
- [ ] Sync/async choices reviewed.
- [ ] REST/gRPC contracts versioned.
- [ ] Kafka events schema validated.
- [ ] Deadline propagation tested.
- [ ] Retry/idempotency tested.
- [ ] Circuit breaker tested.
- [ ] Bulkhead tested.
- [ ] Consumer duplicate handling tested.
- [ ] DLQ replay tested.
- [ ] Correlation/tracing tested.
- [ ] Service auth tested.
- [ ] Cascading-failure test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 3905 — Initial Implementation Order

Recommended:

```text
1. Communication standards
2. Error contract standards
3. Correlation/request IDs
4. OpenTelemetry propagation
5. Internal REST client standard
6. gRPC standard
7. Deadline propagation
8. Retry/circuit-breaker library/config
9. Service authentication
10. Kafka event envelope
11. Outbox pattern
12. Inbox/deduplication pattern
13. Retry/DLQ standard
14. Schema compatibility CI
15. Dependency dashboards
16. Failure-injection tests
```

---

# 3906 — Minimum Viable Service Communication Standard

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

Do not postpone:

```text
timeouts
idempotency
trace propagation
outbox/inbox
```

because they are foundational distributed-system controls.

---

# 3907 — Communication Governance

Architecture review should reject:

```text
direct database access
long synchronous chains
unbounded retries
unowned events
raw internal errors
shared domain entities
Kafka used as ad-hoc RPC
```

---

# 3908 — Service Communication Matrix

Maintain a document/table:

| Caller | Callee | Operation | Type | Protocol | Critical? | Timeout | Retry |
|---|---|---|---|---|---|---|---|
| Order | Catalog | Validate items | Query | gRPC/REST | Yes | Defined | Limited |
| Order | Inventory | Reserve | Command | gRPC | Yes | Defined | Idempotent |
| Order | Payment | Authorize | Command | gRPC | Yes | Defined | Idempotent |
| Order | Loyalty | OrderCompleted | Event | Kafka | No | Async | Consumer retry |
| Order | Notification | OrderReady | Event | Kafka | No | Async | Consumer retry |

Keep this current.

---

# 3909 — Critical Dependency Classification

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

# 3910 — Optional Dependency

If optional dependency fails:

```text
core operation should continue
```

Example:

```text
analytics
notification
recommendation
```

---

# 3911 — Critical Dependency

If critical dependency fails:

```text
operation may need to fail safely
```

Example:

```text
Inventory reserve during checkout
Payment authorization
```

---

# 3912 — Fallback

Fallback is allowed only when business correctness remains valid.

Good:

```text
Catalog image CDN unavailable
→ return no image
```

Bad:

```text
Inventory unavailable
→ assume item is in stock
```

---

# 3913 — Stale Data Fallback

May be allowed for:

```text
menu display
store description
```

Not for:

```text
financial amount
inventory reservation
coupon redemption
```

---

# 3914 — Graceful Degradation

Examples:

```text
Notification down
→ order still completes

Loyalty down
→ order still completes, event waits

Analytics down
→ customer flow unaffected
```

---

# 3915 — Fail-Closed Cases

Examples:

```text
Payment unknown
Inventory unavailable
Coupon final redemption unavailable
```

should generally fail/hold rather than assume success.

---

# 3916 — Fail-Open Cases

Only for low-risk optional features.

Example:

```text
recommendation service down
→ show default menu
```

---

# 3917 — Service Dependency Documentation

For each dependency document:

```text
purpose
owner
protocol
contract
timeout
retry
failure behavior
fallback
SLO
```

---

# 3918 — Cross-Service Read Rule

A service may read another service's data only through:

```text
API
event projection
approved read model
```

Never:

```text
SELECT from another service DB
```

---

# 3919 — Cross-Service Write Rule

Never:

```text
INSERT/UPDATE another service DB
```

Use:

```text
command
API
event-driven workflow
```

---

# 3920 — Transaction Boundary

One service DB transaction must not span:

```text
network call to another service
```

Local transaction boundary remains local.

---

# 3921 — Communication and Distributed Transactions

Cross-service business workflows require:

```text
Saga
compensation
outbox/inbox
```

Detailed in PART 22.

---

# 3922 — Communication and Kafka Architecture

Kafka cluster/topic/schema/partition/retry details are expanded in:

```text
PART 23 — Kafka / Event Architecture
```

---

# 3923 — Communication and Service Mesh

TLS, ingress, service mesh, gateway routing are expanded in:

```text
PART 30 — Networking / Gateway / TLS
```

---

# 3924 — Communication and Observability

Tracing/metrics/log correlation are expanded in:

```text
PART 31 — Observability
```

---

# 3925 — Communication and Security

Zero Trust, service identity, scopes, certificates are expanded in:

```text
PART 06
PART 35
```

---

# 3926 — PART 21 Deliverables

PART 21 produces:

1. Synchronous vs asynchronous decision rules.
2. REST/gRPC/Kafka selection guidance.
3. Command/query/event semantics.
4. Contract ownership.
5. REST contract rules.
6. Protobuf rules.
7. Kafka event envelope.
8. Event IDs.
9. Correlation/request/trace context.
10. Service authentication/authorization.
11. User-context propagation rules.
12. Call budgets/deadlines.
13. Timeout hierarchy.
14. Retry safety.
15. Retry budgets.
16. Circuit breaker.
17. Bulkhead.
18. Connection/thread-pool guidance.
19. Load shedding/backpressure.
20. Kafka topic ownership.
21. Topic naming/granularity.
22. Partition-key rules.
23. Event ordering.
24. Consumer idempotency.
25. Outbox/inbox patterns.
26. Event versioning.
27. Protobuf/REST compatibility.
28. Service discovery.
29. gRPC load balancing.
30. Retry ownership with mesh/gateway.
31. Gateway/BFF boundaries.
32. Read projections.
33. Failure taxonomy.
34. Error propagation.
35. Deadline/cancellation semantics.
36. Cache/projection guidance.
37. Dependency graph/cycle prevention.
38. Critical path design.
39. Parallel/batch call guidance.
40. Kafka commands.
41. DLQ/replay.
42. Event retention.
43. Payload/privacy controls.
44. Contract testing.
45. Communication observability.
46. Metrics/SLIs.
47. Alerts/runbooks.
48. Failure-injection tests.
49. REST/gRPC/Kafka checklists.
50. Security/performance review.
51. Production readiness.
52. Communication governance.
53. Service communication matrix.
54. Critical/optional dependency classification.
55. Fallback/fail-open/fail-closed rules.
56. Cross-service read/write rules.

---

# 3927 — Exit Criteria

PART 21 is complete when the team can answer:

### Pattern

```text
Why is each interaction synchronous or asynchronous?
```

### Protocol

```text
Why is REST, gRPC, or Kafka used for this interaction?
```

### Semantics

```text
Is the message a command, query, or event?
```

### Reliability

```text
What timeout, deadline, retry, circuit breaker, and idempotency rules apply?
```

### Kafka

```text
What is the topic, partition key, schema version, consumer idempotency, and DLQ policy?
```

### Security

```text
How do services authenticate and authorize each other?
```

### Observability

```text
How do request IDs, correlation IDs, trace context, metrics, and logs connect one workflow?
```

### Failure

```text
What happens when a dependency is slow, unavailable, or returns an unknown outcome?
```

### Coupling

```text
Does this communication introduce a circular dependency or long synchronous chain?
```

### Ownership

```text
Who owns the contract and authoritative data?
```

If these answers are clear and tested, the platform communication architecture is ready for implementation.

---

# 3928 — Handoff to PART 22

PART 22 defines Distributed Transactions.

```text
PART 21
Service Communication
      ↓
Commands / Events / Failures
      ↓
PART 22
Distributed Transactions
```

PART 22 will define:

```text
Saga
Orchestration
Choreography
Compensation
Outbox
Inbox
Idempotent Consumers
Retry
DLQ
Ordering
Eventually Consistent Workflows
Failure Recovery
Saga Persistence
Reconciliation
```

The key transition is:

```text
PART 21
= how services communicate

PART 22
= how a business transaction remains correct
when several services participate
```

---

# PART 21 — Summary

Service Communication defines how microservices interact without becoming a distributed monolith.

The platform uses:

```text
REST / gRPC
for immediate commands and queries

Kafka
for durable asynchronous business facts and selected commands
```

Core synchronous flow:

```text
Caller
  ↓
Deadline
  ↓
Authenticated Contract
  ↓
Callee
  ↓
Structured Result
```

Core asynchronous flow:

```text
Local Transaction
      ↓
Outbox
      ↓
Kafka
      ↓
Consumer
      ↓
Inbox / Idempotency
      ↓
Local Transaction
```

The most important rules are:

```text
Choose sync vs async from business need.
Classify interactions as Command, Query, or Event.
Provider service owns the contract.
Keep synchronous chains shallow.
Every call has a timeout and deadline.
Retries are bounded and idempotent.
Do not stack retries across gateway, mesh, and application.
Circuit breakers and bulkheads limit cascading failure.
Kafka events are at-least-once and consumers are idempotent.
Outbox/inbox replace cross-service database transactions.
Correlation and trace context flow across all protocols.
Critical decisions use authoritative services, not stale projections.
Cross-service database reads/writes are forbidden.
```

The next chapter applies these communication primitives to multi-service business transactions:

```text
PART 22 — Distributed Transactions
```

---

**End of PART 21 — Service Communication**
