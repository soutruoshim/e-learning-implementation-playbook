---
title: "PHASE 15 — Kafka / Event Architecture"
---

# PHASE 15 — Kafka / Event Architecture

> **Purpose:** Implement the platform-wide Kafka and event architecture used for durable asynchronous business facts and selected asynchronous commands. This phase defines cluster/environment strategy, topic ownership, naming, partitioning, consumer groups, event envelopes, schema governance, producer/consumer configuration, Outbox/Inbox, retry/DLQ, replay, retention, compaction, security, observability, capacity, testing, DR, and governance.
>
> **Previous Phase:** Phase 14 — Distributed Transactions / Saga
>
> **Next Phase in the Implementation Roadmap:** Phase 16 — Loyalty Service
>
> **Architecture Source Note:** PART 23 architecturally hands off to PART 24 — Redis / Caching. The implementation roadmap intentionally schedules Redis later at Phase 20, so this Phase 15 completes Kafka first and then returns to business-service implementation with Loyalty.
>
> **Primary Architecture Basis:** PART 23 — Kafka / Event Architecture, supported by PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 22 — Distributed Transactions, PART 25 — Testing, PART 31 — Observability, PART 36 — Backup / DR, and the service-specific event contracts from Ordering, Payment, Wallet, Promotion, Loyalty, Mission, Notification, and Integration.
>
> **Primary Stack:** Apache Kafka, Java, Spring Boot, PostgreSQL, Schema Registry, OpenTelemetry, Prometheus, Grafana.
>
> **Status:** Platform Implementation Specification

---

# 1. Phase 15 Goal

Phase 15 implements the platform's durable asynchronous communication backbone.

Kafka is used for:

```text
Domain Events
Integration Events
Asynchronous Commands
Read-Model Projection Events
Operational Events where justified
```

Examples:

```text
OrderCompleted
PaymentCaptured
WalletTopUpCompleted
PointsEarned
MissionCompleted
RewardAssigned
CouponRedeemed
NotificationFailed
```

---

# 2. Core Principle

```text
Kafka is durable event infrastructure,
not a substitute for domain ownership
or transactional correctness.
```

Kafka transports facts and commands.

It does not decide business rules.

---

# 3. Kafka Responsibilities

Kafka provides:

```text
durable record storage
ordered records within a partition
consumer-group fan-out
replay
high-throughput asynchronous transport
producer/consumer decoupling
```

---

# 4. Kafka Non-Responsibilities

Kafka does not automatically provide:

```text
business idempotency
cross-service ACID
domain correctness
schema compatibility
compensation
financial reconciliation
```

Those remain application/platform responsibilities.

---

# 5. Event Platform Goals

The platform should be:

```text
durable
observable
secure
versioned
replayable
operationally predictable
idempotent at consumers
```

---

# 6. Event Platform Anti-Goals

Avoid:

```text
topic sprawl
ambiguous events
unbounded payloads
consumer coupling
replay surprises
silent schema breaks
PII-heavy event payloads
```

---

# 7. What Belongs on Kafka

Good candidates:

```text
business facts already committed
cross-domain integration facts
secondary workflows
projection updates
asynchronous work with durable delivery
```

---

# 8. What Should Not Use Kafka

Avoid Kafka for:

```text
simple immediate queries
low-latency synchronous validation
small one-off RPC
raw database replication as domain contract
large binary payloads
secrets
tokens
```

---

# 9. Domain Event

A domain event means:

```text
a business fact already happened
```

Examples:

```text
OrderCreated
OrderCompleted
PaymentCaptured
WalletFundsReserved
CouponRedeemed
```

Use past tense.

---

# 10. Integration Event

An integration event communicates a fact across service boundaries.

It may be:

```text
the same domain fact
```

or:

```text
a translated external fact
```

Example:

```text
DeliveryPartnerStatusReceived
```

---

# 11. Asynchronous Command

An asynchronous command requests:

```text
one logical receiver
perform one action
```

Examples:

```text
GenerateMonthlyStatement
SyncTopUpToERP
SendBroadcastBatch
```

---

# 12. Event vs Command

Event:

```text
past tense
multiple consumers allowed
producer does not depend on one specific handler
```

Command:

```text
imperative intent
one logical receiver
success/failure semantics
```

---

# 13. Kafka Environment Isolation

Use separate Kafka environments for:

```text
DEV
UAT / STAGING
PROD
```

Production topics must not be shared with non-production workloads.

---

# 14. Initial Cluster Strategy

Source recommendation:

```text
one production cluster
one non-production cluster per controlled environment
```

unless scale/compliance/region requirements justify more.

---

# 15. Kafka Criticality

Production Kafka is:

```text
Tier-1 shared infrastructure
```

because services depend on it for:

```text
eventual consistency
recovery
replay
secondary workflows
```

---

# 16. Production Broker Count

Do not run production critical Kafka on:

```text
one broker
```

Minimum practical HA baseline:

```text
3 brokers
```

Actual count depends on:

```text
throughput
storage
partition count
failure domains
```

---

# 17. Replication Factor

Recommended production default for critical topics:

```text
replication.factor = 3
```

---

# 18. Minimum In-Sync Replicas

Recommended:

```text
min.insync.replicas = 2
```

for critical topics.

---

# 19. Producer Acknowledgements

Critical producers use:

```text
acks=all
```

---

# 20. Producer Idempotence

Critical producers use:

```text
enable.idempotence=true
```

This protects Kafka producer retry behavior.

It does not replace business idempotency.

---

# 21. Unclean Leader Election

For critical topics:

```text
disable unclean leader election
```

to reduce acknowledged data-loss risk.

---

# 22. Zone / Rack Awareness

Distribute replicas across:

```text
availability zones
racks
failure domains
```

where supported.

---

# 23. Controller Architecture

Use the modern Kafka controller architecture supported by the selected Kafka version.

Operations owns:

```text
controller quorum health
broker health
partition leadership
```

---

# 24. Topic Ownership

Every topic must have:

```text
business owner
technical owner
producer owner
schema owner
retention policy
```

No anonymous topics.

---

# 25. Topic Naming

Recommended:

```text
<domain>.<stream>.v<major>
```

Examples:

```text
order.events.v1
payment.events.v1
wallet.events.v1
loyalty.events.v1
mission.events.v1
promotion.events.v1
notification.events.v1
```

---

# 26. Command Topic Naming

If asynchronous commands are used:

```text
<receiver>.commands.v1
```

Examples:

```text
notification.commands.v1
integration.commands.v1
```

---

# 27. Retry Topic Naming

Choose one platform convention.

Possible:

```text
order.events.v1.retry.1
order.events.v1.retry.2
```

or:

```text
<consumer>.retry.<delay>
```

Decision:

```text
KAFKA_RETRY_TOPIC_NAMING = TBD_PLATFORM_POLICY
```

---

# 28. DLQ Topic Naming

Recommended:

```text
<source-topic>.<consumer>.dlq
```

Example:

```text
order.events.v1.mission-service.dlq
```

---

# 29. Topic-per-Domain vs Topic-per-Event

Initial recommendation:

```text
coherent domain event stream
```

Example:

```text
order.events.v1
```

containing related Order lifecycle events.

---

# 30. When to Split Topics

Use separate topics when materially different:

```text
retention
security
throughput
partition key
consumer population
compaction requirement
```

---

# 31. Avoid One Global Topic

Do not create:

```text
platform.events
```

for every domain.

Problems:

```text
security coupling
retention coupling
schema governance
partition strategy
operational isolation
```

---

# 32. Avoid Topic Sprawl

Do not create a topic for every tiny business event.

Too many topics increase:

```text
partition count
ACL complexity
monitoring noise
operational overhead
```

---

# 33. Partition

A Kafka partition provides:

```text
ordered append-only log
```

and is a unit of:

```text
consumer parallelism
```

---

# 34. Partition Key Principle

Choose the key from the aggregate whose ordering matters.

Examples:

```text
order_id
payment_id
wallet_id
customer_id
mission_progress_id
```

---

# 35. Order Event Key

Use:

```text
order_id
```

for Order lifecycle events.

---

# 36. Payment Event Key

Use:

```text
payment_id
```

---

# 37. Wallet Event Key

Use:

```text
wallet_id
```

---

# 38. Loyalty Event Key

Depending on stream:

```text
customer_id
```

or:

```text
points_account_id
```

---

# 39. Mission Event Key

Depending on event semantics:

```text
customer_id
```

or:

```text
progress_id
```

---

# 40. Null Partition Keys

Avoid null keys when ordering matters.

Null keys provide distribution without stable aggregate ordering.

---

# 41. Hot Partition Risk

Hot key examples:

```text
one global campaign ID
shared system account
single tenant ID
```

Monitor skew.

---

# 42. Partition Count Determines

```text
consumer parallelism ceiling
broker overhead
ordering scope
operational complexity
```

---

# 43. Partition Count Planning

Estimate from:

```text
peak events/sec
average record size
consumer processing rate
target parallelism
growth
```

---

# 44. Partition Count Is Hard to Shrink

Partitions can be increased.

But increasing partitions changes key-to-partition mapping for future records.

Do not resize casually when ordering assumptions matter.

---

# 45. Partition Count Example

Illustrative source example:

```text
Peak: 5,000 events/sec
One consumer: 500 events/sec
Required parallelism ≈ 10
```

Potential initial range after load test:

```text
12–18 partitions
```

This is illustrative, not a production decision.

---

# 46. Consumer Group

A consumer group is:

```text
one logical consumer application
```

Each partition is processed by one group member at a time.

---

# 47. Independent Consumers

One:

```text
OrderCompleted
```

stream may be independently consumed by:

```text
loyalty-service
mission-service
notification-service
analytics-service
integration-service
```

---

# 48. Consumer Group Naming

Recommended:

```text
<service>-<purpose>-v1
```

Example:

```text
mission-service-order-events-v1
```

---

# 49. Consumer Parallelism

Maximum active consumers in one group:

```text
<= partition count
```

Extra consumers become idle.

---

# 50. Rebalance

Membership changes can trigger:

```text
partition rebalance
```

which may briefly pause processing.

---

# 51. Cooperative Rebalancing

Prefer cooperative assignment where supported to reduce disruption.

---

# 52. Static Membership

May reduce unnecessary rebalances for stable instances.

Evaluate carefully with Kubernetes lifecycle.

---

# 53. Consumer Processing Time

Ensure processing does not accidentally exceed:

```text
max.poll.interval.ms
```

causing unnecessary rebalance.

---

# 54. Poll Batch Size

Tune:

```text
max.poll.records
```

to realistic processing duration.

Avoid huge batches that cannot finish before poll interval.

---

# 55. Standard Event Envelope

Recommended:

```json
{
  "event_id": "evt_01...",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "producer": "order-service",
  "aggregate_type": "ORDER",
  "aggregate_id": "ORD001",
  "aggregate_version": 12,
  "occurred_at": "2026-10-11T12:30:00Z",
  "correlation_id": "cor_...",
  "causation_id": "cmd_...",
  "data": {}
}
```

---

# 56. Event ID

Must be:

```text
globally unique
immutable
```

Used for:

```text
dedupe
audit
replay
incident investigation
```

---

# 57. Aggregate ID

Identifies the business aggregate that produced the event.

Useful for:

```text
partitioning
ordering
debugging
```

---

# 58. Aggregate Version

Optional but strongly recommended when event sequence matters.

Example:

```text
Order aggregate version = 12
```

---

# 59. Correlation ID

Tracks the larger business flow.

Example:

```text
checkout request
```

across services/events.

---

# 60. Causation ID

Identifies:

```text
the command/event that caused this event
```

Useful for reconstructing chains.

---

# 61. Occurred At

Use:

```text
UTC business event time
```

not consumer processing time.

---

# 62. Published At

Optional:

```text
published_at
```

May differ from:

```text
occurred_at
```

because of Outbox delay.

---

# 63. Producer Identity

Use stable service identity:

```text
order-service
wallet-service
```

not pod name.

---

# 64. Event Data

Payload contains:

```text
facts relevant to event meaning
```

Do not serialize the entire aggregate by default.

---

# 65. Event Payload Size

Keep events small.

Avoid:

```text
images
documents
full product catalog
very large arrays
```

---

# 66. Large Payload Pattern

Store large data in:

```text
object storage
database
```

Event carries:

```text
reference
checksum
metadata
```

---

# 67. Event Privacy

Do not publish unnecessary:

```text
email
phone
address
access token
password reset code
payment secrets
```

---

# 68. PII in Events

If PII is genuinely required:

```text
document purpose
restrict ACL
encrypt transport/storage
define retention
```

---

# 69. Schema Format

Possible:

```text
Protobuf
Avro
JSON Schema
```

For strongly typed Java microservices, source recommends:

```text
Protobuf
or
Avro
```

as strong candidates.

Final standard:

```text
TBD_PLATFORM_POLICY
```

---

# 70. Schema Registry

Use Schema Registry for:

```text
schema storage
compatibility validation
version discovery
serialization support
```

---

# 71. Compatibility Mode

Recommended default:

```text
BACKWARD
```

or:

```text
BACKWARD_TRANSITIVE
```

Decision:

```text
KAFKA_SCHEMA_COMPATIBILITY = TBD_PLATFORM_POLICY
```

---

# 72. Backward-Compatible Change

Typical safe change:

```text
add optional/defaulted field
```

---

# 73. Breaking Change

Examples:

```text
remove required field
incompatible type change
semantic meaning change
reuse Protobuf field number
```

Requires:

```text
new major event version
```

---

# 74. Semantic Compatibility

Registry compatibility is not enough.

Example:

```text
integer field stays integer
but changes from cents to dollars
```

is semantically breaking.

---

# 75. Event Version

Envelope contains:

```text
event_version
```

Used for:

```text
consumer branching
migration
debugging
```

---

# 76. Major Version

Use a new major version for:

```text
breaking schema change
breaking semantic change
```

---

# 77. Event Deprecation

Process:

```text
identify consumers
publish replacement
support overlap
migrate consumers
stop old producer
retain old schema/history as required
```

---

# 78. Producer Schema CI

CI must fail on incompatible schema change.

---

# 79. Consumer Compatibility Tests

Test:

```text
current version
older supported version
future additive fields
```

---

# 80. Unsupported Event Version

Consumer must not silently parse incompatible versions.

Options:

```text
version-specific handler
DLQ + alert
```

---

# 81. Producer Configuration

Critical producer baseline:

```text
acks=all
enable.idempotence=true
bounded by delivery.timeout.ms
compression enabled
```

---

# 82. Producer Idempotence Limitation

Kafka producer idempotence helps with duplicate sends caused by transport retries.

It does not replace:

```text
event_id
business uniqueness
consumer idempotency
```

---

# 83. Producer Retry Settings

Define:

```text
delivery.timeout.ms
request.timeout.ms
retry backoff
```

explicitly.

---

# 84. Compression

Possible:

```text
lz4
zstd
snappy
```

depending selected broker/client support.

Compression trades:

```text
less network/storage
for CPU
```

---

# 85. Producer Batching

Tune:

```text
linger.ms
batch.size
```

Transactional business events generally prefer:

```text
small bounded batching
```

---

# 86. Producer Buffer

Monitor:

```text
buffer exhaustion
```

Do not allow indefinite blocking.

---

# 87. Kafka Transactions

Kafka transactions can atomically write:

```text
multiple Kafka records/topics
```

and coordinate offsets in Kafka-only pipelines.

---

# 88. Kafka Transaction Limitation

Kafka transactions do not make:

```text
PostgreSQL update
+
Kafka publish
```

atomic.

For DB + Kafka use:

```text
Transactional Outbox
```

---

# 89. Transactional Outbox

Producer local transaction:

```text
BEGIN
update business state
insert outbox event
COMMIT
```

Outbox publisher sends later.

---

# 90. Outbox Table

Example:

```text
outbox_events
-------------
id / event_id
aggregate_type
aggregate_id
aggregate_version
event_type
event_version
payload
headers
occurred_at
created_at
published_at
publish_attempt_count
last_error
```

---

# 91. Outbox Event ID

Prefer:

```text
event_id
```

as primary/business key.

---

# 92. Outbox Uniqueness

Always unique:

```text
event_id
```

Optional domain uniqueness:

```text
aggregate_id
+
aggregate_version
+
event_type
```

where justified.

---

# 93. Outbox Publisher Options

Possible:

```text
polling publisher
CDC / Debezium
transactional log capture
```

---

# 94. Initial Outbox Recommendation

Unless CDC scale requirements already exist:

```text
polling publisher
```

is the simpler initial implementation.

If source-approved architecture selects CDC, implement it explicitly.

---

# 95. Polling Publisher Flow

```text
select unpublished
      ↓
publish Kafka
      ↓
mark published
```

Use:

```text
FOR UPDATE SKIP LOCKED
```

for concurrent publishers.

---

# 96. Outbox Poll Query

Example:

```sql
SELECT *
FROM outbox_events
WHERE published_at IS NULL
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

---

# 97. Publish Then Mark Risk

Possible:

```text
Kafka publish succeeds
process crashes
before published_at update
```

Result:

```text
same event may publish again
```

Consumers must be idempotent.

---

# 98. Never Mark Then Publish

Never:

```text
mark published
then publish Kafka
```

because a crash may permanently lose the event.

---

# 99. CDC Outbox

Debezium can stream committed outbox rows from DB logs.

Benefits:

```text
low polling overhead
high throughput
```

Costs:

```text
CDC infrastructure
connector operations
```

---

# 100. Outbox Ordering

If strict order per aggregate matters:

```text
aggregate_version
```

helps publisher avoid:

```text
version 12 before 11
```

---

# 101. Outbox Backlog Metrics

Monitor:

```text
unpublished count
oldest unpublished age
publish failures
```

---

# 102. Inbox Pattern

Consumer records:

```text
processed event IDs
```

inside its local DB.

---

# 103. Processed Events Table

Example:

```text
processed_events
----------------
event_id
consumer_name
processed_at
source_topic
source_partition
source_offset
```

Unique:

```text
(event_id, consumer_name)
```

---

# 104. Inbox Local Transaction

```text
BEGIN
check event not processed
apply business effect
insert processed_events
insert local outbox if needed
COMMIT
```

---

# 105. Duplicate Consumer Delivery

If:

```text
event_id already processed
```

then:

```text
acknowledge / no-op
```

---

# 106. Business Dedupe

Financial or entitlement consumers should also enforce business uniqueness.

Examples:

```text
one Wallet Top-Up per payment_id
one Mission completion per progress
one reward assignment per completion
```

Event ID alone may not catch semantic duplicate production.

---

# 107. Offset Commit Rule

Commit offset only after:

```text
business processing succeeds
```

or after event is durably routed to retry/DLQ according to policy.

---

# 108. Crash After DB Commit

If:

```text
consumer DB committed
offset not committed
```

Kafka replays the message.

Inbox makes replay safe.

---

# 109. Consumer Failure Classification

Classify:

```text
RETRYABLE
NON_RETRYABLE
UNKNOWN
```

---

# 110. Retryable Consumer Errors

Examples:

```text
DB temporarily unavailable
transient downstream failure
network timeout
```

---

# 111. Non-Retryable Consumer Errors

Examples:

```text
unsupported schema
invalid required data
permanent configuration error
```

---

# 112. Retry Strategy

Avoid infinite blocking on one bad record.

Use:

```text
bounded immediate retry
then delayed retry
then DLQ
```

---

# 113. Immediate Retry

Source example:

```text
1–3 attempts
```

for fast transient failures.

Exact count:

```text
TBD_PLATFORM_POLICY
```

---

# 114. Delayed Retry

Kafka has no native per-record delay.

Patterns:

```text
retry topics
scheduler DB
external retry queue
```

Choose one platform standard.

---

# 115. Retry Topic Flow

Example:

```text
main
→ retry-30s
→ retry-5m
→ DLQ
```

---

# 116. Retry Headers

Preserve:

```text
original_topic
original_partition
original_offset
retry_count
first_failed_at
last_error_code
```

---

# 117. Retry Event Identity

Preserve original:

```text
event_id
```

Do not create a new business event ID for transport retry.

---

# 118. Retry Ordering Tradeoff

Moving one event to retry topic allows later original-partition events to continue.

That may break strict processing order for that key.

---

# 119. Strict Ordering Failure Strategy

If strict ordering is essential:

```text
pause partition/key
```

or:

```text
design consumer to tolerate later events
```

This is a deliberate tradeoff.

---

# 120. DLQ

DLQ is:

```text
operational quarantine
```

for events that exceeded retry or cannot be processed.

It is not a garbage bin.

---

# 121. DLQ Record

Include:

```text
original event
failure category
consumer
attempt count
first failure time
last failure time
safe error summary
```

---

# 122. DLQ Retention

Long enough for:

```text
investigation
bug fix
replay
```

but bounded by:

```text
storage
privacy
retention policy
```

---

# 123. DLQ Ownership

Consumer team owns its DLQ.

Producer is not automatically responsible for every consumer failure.

---

# 124. DLQ Alerting

For critical consumers:

```text
any DLQ entry may alert
```

For lower criticality:

```text
threshold-based alert
```

---

# 125. DLQ Replay Preconditions

Replay only after:

```text
root cause fixed
schema supported
mapping fixed
dependency restored
```

---

# 126. Replay Identity

Replay preserves:

```text
event_id
aggregate_id
aggregate_version
correlation_id
causation_id
```

where applicable.

---

# 127. Replay Audit

Record:

```text
actor
source DLQ/topic
time
offset/range/count
reason
target consumer/group
```

---

# 128. Historical Topic Replay

Can rebuild:

```text
read models
analytics
derived projections
```

---

# 129. Replay Safety

Before replay:

```text
consumer idempotency verified
external side effects disabled or guarded
target projection cleared/versioned if required
```

---

# 130. Dangerous Replay

Never blindly replay historical events into consumers that would:

```text
send notifications again
charge Payment
credit Wallet
issue Reward
```

unless explicit replay mode/idempotency makes it safe.

---

# 131. Replay Consumer Group

Use a new group ID for projection rebuild.

Example:

```text
analytics-rebuild-202610
```

---

# 132. Replay Window

Define:

```text
from offset
from timestamp
full retention
```

---

# 133. Retention Types

Kafka retention may be:

```text
time-based
size-based
compacted
```

---

# 134. Event Retention Policy

Do not use one retention period for every topic.

Business-critical events may require:

```text
days
weeks
months
```

depending need.

---

# 135. Retention Factors

Consider:

```text
replay need
audit need
storage cost
privacy
DR
consumer outage tolerance
```

---

# 136. Short Retention Risk

If a consumer is offline longer than retention:

```text
events may disappear before processing
```

Therefore:

```text
retention > maximum expected recovery window
```

where required.

---

# 137. Long Retention Risk

Long retention increases:

```text
storage
PII exposure duration
replay complexity
```

---

# 138. Log Compaction

Compaction retains:

```text
latest value per key
```

over time.

---

# 139. Good Compaction Use Cases

Examples:

```text
reference data
configuration projection
latest customer tier
latest store mapping
```

---

# 140. Compaction Is Not Full History

Do not use compacted topic as the sole audit/event history when full chronology matters.

---

# 141. Tombstone

In compacted topics:

```text
key + null value
```

may represent deletion.

Consumers must handle it.

---

# 142. Cleanup Policy

Choose per topic:

```text
delete
compact
compact,delete
```

---

# 143. Kafka Ordering Guarantee

Kafka guarantees:

```text
record order inside one partition
```

not across all partitions.

---

# 144. Producer Ordering

With idempotent producer and correct settings:

```text
send order per partition
```

can be preserved.

---

# 145. One Authoritative Producer per Aggregate Lifecycle

Avoid multiple services independently publishing authoritative lifecycle events for the same aggregate.

Example:

```text
Order Service
```

owns authoritative:

```text
OrderAccepted
OrderCompleted
OrderCancelled
```

---

# 146. Late Events

Events can arrive late because of:

```text
retry
network delay
Outbox backlog
```

Use:

```text
occurred_at
aggregate_version
idempotency
```

---

# 147. Cross-Topic Ordering

Do not assume:

```text
PaymentCaptured
```

always arrives before:

```text
OrderCompleted
```

across topics.

Saga/domain logic must coordinate business correctness.

---

# 148. Event Time vs Processing Time

Track both:

```text
occurred_at
processed_at
```

---

# 149. Analytics Watermarks

Watermarks may be useful for analytics/stream processing.

Transactional consumers primarily rely on:

```text
aggregate version
idempotency
```

---

# 150. Business Exactly-Once Expectation

Platform goal is:

```text
effectively-once business behavior
```

through:

```text
at-least-once Kafka transport
+
idempotent producer/consumer behavior
+
business uniqueness
```

---

# 151. Kafka Exactly-Once Limit

Kafka EOS helps Kafka-to-Kafka pipelines.

It does not remove need for:

```text
DB idempotency
external API idempotency
Saga compensation
```

---

# 152. Eventual Consistency

Kafka enables eventual propagation.

Consumers may lag.

Applications must know which projections may be stale.

---

# 153. Critical Decision Rule

For critical business decisions:

```text
query authoritative service
```

rather than rely on a stale projection.

---

# 154. Event Fan-Out

One producer event may serve many consumer groups.

Producer should not know every consumer.

---

# 155. Consumer Independence

Each consumer group owns its own:

```text
offset
retry
DLQ
processing SLO
```

---

# 156. Slow Consumer

A slow consumer group should not block other consumer groups.

It owns its lag.

---

# 157. Consumer External Side Effects

If consumer calls an external API, still apply:

```text
idempotency
timeout
retry
UNKNOWN handling
```

Kafka does not make external calls safe automatically.

---

# 158. Event Handler Design

Handler should be:

```text
small
deterministic
idempotent
```

Delegate business work to application use cases.

---

# 159. Avoid Business Logic in Listener

Bad:

```text
@KafkaListener
contains hundreds of lines of business logic
```

Good:

```text
deserialize
validate envelope
route handler
invoke use case
classify result
```

---

# 160. Consumer Local Transaction

Use one local DB transaction around:

```text
Inbox
business change
local Outbox
```

---

# 161. Offset Commit Separation

Kafka offset commit is separate from local DB transaction.

Inbox protects against replay.

---

# 162. Poison Pill

Malformed records may fail before business handler.

Need:

```text
error-handling deserializer
safe raw-record capture
DLQ
```

---

# 163. Unsupported Event Type

For multi-event domain topic:

```text
irrelevant type
→ ignore/filter
```

Relevant type but unsupported major version:

```text
DLQ / alert
```

---

# 164. Event Routing

Use explicit:

```text
event_type
```

and handler registry.

---

# 165. Handler Registry

Example:

```text
ORDER_COMPLETED
→ OrderCompletedHandler

ORDER_CANCELLED
→ OrderCancelledHandler
```

---

# 166. Consumer Schema Validation

Validate:

```text
envelope
event version
required payload
```

before domain processing.

---

# 167. Consumer Backpressure

Use:

```text
max.poll.records
pause/resume
bounded worker pool
```

Do not fetch unbounded work into memory.

---

# 168. Consumer Concurrency

Spring Kafka concurrency should not exceed useful partition count.

---

# 169. Parallel Processing Within Partition

Avoid when ordering matters.

If parallelizing, preserve:

```text
per-key ordering
```

---

# 170. Batch Consumer

Can improve throughput.

Only use when:

```text
partial failure semantics
transaction size
error handling
```

are understood.

---

# 171. Batch Failure

One bad record must not cause endless replay of a massive batch with no visibility.

---

# 172. High-Volume Outbox

May require:

```text
batch publish
parallel workers
partition-aware ordering
```

---

# 173. Outbox Table Growth

Archive/delete published rows after support/reconciliation window.

Do not let Outbox grow forever.

---

# 174. Kafka Is Not Automatically an Event Store

Kafka is durable log infrastructure.

The architecture does not require full event sourcing.

Services remain:

```text
state-based
+
domain events
```

unless a domain explicitly adopts event sourcing.

---

# 175. Event Sourcing Warning

Do not confuse:

```text
publishing domain events
```

with:

```text
event-sourced aggregate
```

---

# 176. Kafka Security Areas

```text
transport encryption
authentication
authorization
credential management
topic ACLs
schema registry security
audit
```

---

# 177. TLS

Use TLS for production broker/client communication.

---

# 178. Authentication Options

Possible:

```text
mTLS
SASL/SCRAM
SASL/OAUTHBEARER
cloud IAM
```

Choose platform-supported mechanism.

Decision:

```text
KAFKA_AUTH_MECHANISM = TBD_SECURITY
```

---

# 179. Authorization

Use Kafka ACLs or managed-service equivalent.

Principle:

```text
least privilege
```

---

# 180. Producer ACL

Example:

```text
order-service
WRITE order.events.v1
```

It must not automatically write:

```text
payment.events.v1
```

---

# 181. Consumer ACL

Example:

```text
mission-service
READ order.events.v1
GROUP mission-service-order-events-v1
```

---

# 182. Topic Creation Permission

Application services should not have unrestricted:

```text
CREATE topic
ALTER cluster
```

in production.

Platform/IaC owns provisioning.

---

# 183. Schema Registry Security

Protect:

```text
schema read/write
compatibility configuration
subject deletion
```

---

# 184. Kafka Credentials

Store in:

```text
Secret Manager / Vault
```

not source code.

---

# 185. Credential Rotation

Clients must support credential rotation without long outage.

---

# 186. Topic Data Classification

Classify:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

Most domain streams are at least:

```text
INTERNAL / CONFIDENTIAL
```

---

# 187. Restricted Topics

Financial/security examples:

```text
payment
wallet
identity security events
```

Require stricter access.

---

# 188. PII Minimization

Prefer:

```text
customer_id
```

instead of:

```text
email
phone
address
```

unless required by event purpose.

---

# 189. Encryption at Rest

Use broker/storage encryption supported by the platform/cloud.

---

# 190. Kafka Audit

Audit:

```text
ACL changes
topic creation/deletion
schema compatibility changes
manual replay
DLQ replay
consumer offset reset
```

---

# 191. Offset Reset Governance

Offset reset is high risk.

Require:

```text
permission
reason
group
topic
partition
new offset
impact review
audit
```

---

# 192. Offset Reset Targets

Possible:

```text
earliest
latest
timestamp
specific offset
```

only after replay review.

---

# 193. Consumer Group Deletion

Do not delete consumer-group state casually.

It may cause:

```text
full replay
or
skipped historical work
```

depending new behavior.

---

# 194. Topic Deletion

Production topic deletion requires:

```text
change control
consumer inventory review
backup/export if required
```

---

# 195. Topic Configuration as Code

Manage through IaC where possible:

```text
topic
partitions
replication
retention
cleanup policy
ACLs
```

---

# 196. Kafka Capacity Planning

Plan:

```text
ingress bytes/sec
egress bytes/sec
retained storage
partition count
consumer count
replication overhead
```

---

# 197. Ingress Formula

```text
events/sec × average event bytes
```

---

# 198. Storage Approximation

```text
logical ingress bytes
× retention duration
× replication factor
```

plus overhead/compression effects.

---

# 199. Egress Amplification

Approximate logical consumer read traffic:

```text
topic ingress
× active consumer groups
```

---

# 200. Capacity Example

Illustrative:

```text
2,000 events/sec
1 KB average
≈ 2 MB/sec logical ingress

RF=3
≈ 6 MB/sec replicated writes before overhead

5 consumer groups
≈ 10 MB/sec logical reads
```

---

# 201. Storage Example

Illustrative:

```text
2 MB/sec
× 86,400 sec/day
≈ 172.8 GB/day logical
```

With RF=3:

```text
≈ 518 GB/day before compression/overhead
```

---

# 202. Partition Budget

Cluster should maintain a reviewed partition budget.

Do not allow uncontrolled thousands of partitions.

---

# 203. Consumer Capacity

Measure:

```text
records/sec per consumer instance
```

with realistic DB/application processing.

---

# 204. Consumer Scaling

Scale consumer count until approximately:

```text
partition count
```

Beyond that, partition parallelism does not increase.

---

# 205. Partition Increase Trigger

Consider increase when:

```text
consumer lag persists
throughput exceeds partition capability
future scale requires more consumers
```

Load test before changing.

---

# 206. Broker Disk Metrics

Monitor:

```text
disk utilization
IOPS
segment growth
retention cleanup
```

---

# 207. Broker Network Metrics

Monitor:

```text
bytes in
bytes out
replication traffic
consumer traffic
```

---

# 208. Broker CPU

Serialization, compression, TLS, replication, and request load affect CPU.

---

# 209. Cluster Headroom

Maintain headroom for:

```text
broker failure
traffic spike
rebalance
replica catch-up
```

---

# 210. Failure-Domain Capacity

Cluster should continue safely after losing:

```text
one broker / one AZ
```

according to target architecture.

---

# 211. Broker Failure Baseline

With:

```text
RF=3
min ISR=2
acks=all
```

one replica failure can still allow durable writes if ISR remains sufficient.

---

# 212. Under-Replicated Partitions

Alert on sustained:

```text
under_replicated_partitions
```

---

# 213. Offline Partition

Critical:

```text
offline partition
```

means part of a topic is unavailable.

---

# 214. ISR Shrink

Monitor:

```text
ISR shrink / expand rate
```

as broker/network/disk signal.

---

# 215. Leader Imbalance

Monitor partition-leadership distribution.

---

# 216. Cluster Metrics

Track:

```text
under_replicated_partitions
offline_partitions
active_controller_count
request_latency
bytes_in
bytes_out
disk_usage
```

---

# 217. Producer Metrics

```text
record_send_rate
record_error_rate
request_latency
retry_rate
buffer_available
batch_size
compression_rate
```

---

# 218. Consumer Metrics

```text
records_consumed_rate
records_lag
records_lag_max
fetch_latency
commit_latency
rebalance_total
```

---

# 219. Application Event Metrics

```text
events_published_total
events_consumed_total
event_processing_failure_total
event_duplicate_total
event_dlq_total
```

---

# 220. Outbox Metrics

```text
outbox_unpublished_count
outbox_oldest_age
outbox_publish_failure_total
```

---

# 221. Inbox Metrics

```text
duplicate_event_total
processed_event_total
```

---

# 222. Retry Metrics

```text
retry_event_total
retry_age
retry_exhausted_total
```

---

# 223. DLQ Metrics

```text
dlq_event_total
dlq_oldest_age
dlq_replay_total
```

---

# 224. Kafka SLIs

Potential:

```text
publish success rate
P95 publish latency
consumer processing latency
consumer lag age
Outbox delay
DLQ rate
broker availability
```

---

# 225. Event Delivery SLO

For critical async workflows:

```text
99.x% processed within N seconds/minutes
```

Define per consumer/use case.

---

# 226. Lag SLO

Illustrative source example:

```text
95% of OrderCompleted
consumed by Mission
within 30 seconds
```

Production target remains:

```text
TBD_SLO
```

---

# 227. Kafka Alerts

Critical examples:

```text
offline partition
sustained under-replication
producer failure spike
consumer lag age
Outbox backlog
DLQ entry/rate
schema incompatibility
broker disk high
```

---

# 228. Platform Kafka Dashboard

Show:

```text
broker health
topic throughput
partition health
producer errors
consumer lag by group
Outbox lag
DLQ
schema errors
```

---

# 229. Per-Service Event Dashboard

Show:

```text
events produced
events consumed
processing success
duplicates
retries
DLQ
lag
processing latency
```

---

# 230. Kafka Trace Propagation

Propagate in headers:

```text
traceparent
tracestate
correlation_id
```

---

# 231. Producer Span

Example:

```text
kafka produce order.events.v1
```

---

# 232. Consumer Span

Example:

```text
kafka consume order.events.v1
```

Link to producer trace context.

---

# 233. Long Async Delays

A trace may expire before downstream processing.

Use durable log identifiers:

```text
event_id
correlation_id
causation_id
```

---

# 234. Structured Producer Logging

Log:

```text
event_id
event_type
topic
partition
aggregate_id
```

---

# 235. Structured Consumer Logging

Log:

```text
event_id
consumer_group
result
retry_count
```

---

# 236. Avoid Full Payload Logging

Do not log complete payload by default, especially:

```text
Payment
Wallet
Identity
Customer
```

events.

---

# 237. Required Kafka Runbooks

```text
Broker unavailable
Under-replicated partitions
Offline partition
Producer publish failures
Consumer lag
Consumer rebalance storm
Poison event
DLQ backlog
Outbox backlog
Schema incompatibility
Disk pressure
```

---

# 238. Broker Outage Runbook

```text
identify failed broker
check ISR
check controller/quorum
verify producer impact
restore broker
monitor replica catch-up
```

---

# 239. Consumer Lag Runbook

```text
identify topic/group
check oldest event age
check consumer health
check DB latency
check poison event
check partition skew
scale consumers if partition count permits
```

---

# 240. Rebalance Storm Runbook

Check:

```text
pod restarts
max.poll.interval
session timeout
network
processing time
deployment churn
```

---

# 241. Poison Event Runbook

```text
capture event safely
classify schema/data/bug
route to DLQ
fix consumer/config
replay preserving original event ID
```

---

# 242. Schema Incompatibility Runbook

```text
stop incompatible producer rollout
identify schema version
rollback if required
restore compatibility
add/repair CI guard
```

---

# 243. Outbox Backlog Runbook

```text
check Kafka health
check publisher errors
check DB locks
check serialization/schema
scale publisher if safe
monitor oldest age
```

---

# 244. DLQ Backlog Runbook

```text
group by failure
prioritize critical events
fix root cause
replay bounded batch
monitor duplicate effects
```

---

# 245. Disk Pressure Runbook

```text
check retention
identify large topics
review replication
check unexpected payload growth
expand storage or safely reduce retention
```

Do not impulsively delete critical topics.

---

# 246. Kafka Backup Principle

Kafka replication is not complete backup.

---

# 247. Backup / DR Options

Depending requirements:

```text
cross-cluster replication
tiered storage
topic export
long retention
```

---

# 248. Kafka DR Requirements

Define:

```text
RPO
RTO
cluster rebuild
topic recreation
Schema Registry recovery
consumer offset recovery
Outbox replay
```

---

# 249. Cross-Cluster Replication

Possible technologies:

```text
MirrorMaker 2
managed replication
cluster linking
```

Use only if DR requirements justify.

---

# 250. DR Cluster

Possible:

```text
warm standby Kafka cluster
```

with critical topics replicated.

---

# 251. Consumer Offset DR

Offsets may be recovered/reset using:

```text
timestamp
event ID
Outbox
reconciliation
```

depending workflow.

---

# 252. Schema Registry Backup

Back up/recover:

```text
schemas
subjects
compatibility settings
```

---

# 253. Topic IaC Recovery

IaC should recreate:

```text
topics
ACLs
retention
partitions
cleanup policies
```

---

# 254. Replay After DR

Use:

```text
idempotent consumers
reconciliation
```

because exact previous offsets may not be available.

---

# 255. Spring Kafka Platform Standard

Provide shared conventions for:

```text
producer factory
consumer factory
event envelope
error handling
OpenTelemetry interceptors
security configuration
```

---

# 256. Shared Kafka Library

A small shared technical library may contain:

```text
event envelope
header constants
serializer setup
trace propagation
error classification helpers
```

---

# 257. Shared Library Boundary

Do not place every domain event class into one global shared library.

Service teams own domain event schemas.

---

# 258. Producer Template

Service owns:

```text
event semantics
event schema
payload
```

Platform library owns:

```text
transport standards
```

---

# 259. Consumer Listener Structure

Recommended:

```java
@KafkaListener(...)
public void onMessage(EventEnvelope<OrderCompleted> event) {
    handler.handle(event);
}
```

Listener remains thin.

---

# 260. Deserialization Error Handling

Configure:

```text
error-handling deserializer
dead-letter publishing
safe raw-record capture
```

---

# 261. Auto Commit

For business-critical consumers:

```text
enable.auto.commit=false
```

Prefer explicit/container-managed commit after processing.

---

# 262. Manual Acknowledgement

Use only when processing semantics require.

Default acknowledgment behavior should be platform-standardized.

---

# 263. Offset Commit Mode

Choose a platform standard compatible with:

```text
Inbox processing
```

Decision:

```text
SPRING_KAFKA_ACK_MODE = TBD_PLATFORM_POLICY
```

---

# 264. Consumer Isolation Level

If consuming Kafka transactions:

```text
read_committed
```

may be appropriate.

---

# 265. Producer Serialization Failure

Schema/serialization failure should be detected before successful send.

Alert/fail publishing pipeline.

---

# 266. Outbox Serialization Timing

Option A:

```text
store serialized payload
```

Option B:

```text
store immutable event envelope object
serialize at publisher
```

Choose one platform standard.

---

# 267. Recommended Outbox Payload Principle

Store immutable:

```text
event envelope payload
event type/version
headers
```

so retries are deterministic.

---

# 268. Schema ID

Serializer may embed registry schema ID.

Do not hard-code schema IDs in domain code.

---

# 269. Event Headers

Potential transport headers:

```text
event_id
event_type
event_version
correlation_id
causation_id
traceparent
content_type
```

Avoid needless duplication with envelope.

---

# 270. Header vs Payload

Business-relevant immutable metadata belongs in:

```text
event envelope/payload
```

Transport-only metadata may live in:

```text
Kafka headers
```

---

# 271. Consumer Filtering

For domain topics containing multiple event types:

```text
filter by event_type
```

If irrelevant traffic becomes large, split topic based on evidence.

---

# 272. Topic Evolution

Split a topic when evidence shows materially different:

```text
security
throughput
retention
filtering cost
partitioning
```

---

# 273. Kafka and Saga

Saga may publish/consume:

```text
commands
step results
domain events
```

But durable Saga state stays in:

```text
owning service DB
```

---

# 274. Kafka and Notification

Notification consumers require dedupe to avoid repeat sends during replay.

---

# 275. Event Payload Ownership

Producer owns event semantic meaning.

Consumers must not infer undocumented meaning from fields.

---

# 276. Consumer Coupling Warning

If many consumers need a field, consider adding it.

But do not turn event into:

```text
full service database snapshot
```

---

# 277. Event Enrichment Tradeoff

Too little:

```text
forces synchronous callbacks to producer
```

Too much:

```text
coupling
privacy risk
payload bloat
```

Design intentionally.

---

# 278. Replay Modes

Side-effect consumers may expose:

```text
LIVE
REPLAY_READ_MODEL
```

In replay mode:

```text
disable notifications/external side effects
```

where appropriate.

---

# 279. Historical Backfill

If new consumer needs data older than Kafka retention, possible:

```text
source-service export
database backfill
special snapshot event
```

Do not fabricate fake historical domain events without provenance.

---

# 280. Snapshot Events

For bootstrap, possible:

```text
CustomerTierSnapshot
CatalogSnapshot
```

Keep separate from ordinary domain-event history.

---

# 281. Backfill Audit

Record:

```text
source
time range
consumer
record count
version
actor
```

---

# 282. Kafka Testing Strategy

Test:

```text
producer
consumer
schema
ordering
dedupe
retry
DLQ
replay
Outbox
Inbox
security
load
failure
DR
```

---

# 283. Producer Unit Tests

Verify:

```text
event type
event version
aggregate key
required fields
no unnecessary sensitive data
```

---

# 284. Schema Compatibility Tests

CI compares:

```text
new schema
against registry baseline
```

and rejects breaking changes.

---

# 285. Consumer Unit Tests

Test:

```text
current event
duplicate
unsupported version
missing field
business rejection
```

---

# 286. Integration Test Infrastructure

Prefer realistic broker tests using:

```text
Kafka Testcontainers
```

---

# 287. Outbox Integration Test

Using PostgreSQL + Kafka Testcontainers:

```text
business transaction
→ Outbox row
→ publisher
→ Kafka
→ consumer
```

---

# 288. Inbox Integration Test

Send same event twice.

Expected:

```text
two Kafka deliveries
one business side effect
```

---

# 289. Ordering Test

Send same aggregate key:

```text
OrderCreated
OrderAccepted
OrderCompleted
```

Verify order within partition.

---

# 290. Partition Test

Verify same aggregate key maps to the same partition.

---

# 291. Retry Test

Inject transient consumer failure.

Expected:

```text
bounded retry
event succeeds
no DLQ
```

---

# 292. DLQ Test

Inject permanent failure.

Expected:

```text
bounded retry
DLQ
metadata preserved
```

---

# 293. Replay Test

Replay historical events.

Verify:

```text
idempotency
no duplicate financial side effect
no duplicate notification when replay mode disables it
```

---

# 294. Schema Evolution Test

Old consumer must accept newly added optional field when compatibility policy says it should.

---

# 295. Unsupported Major Version Test

Consumer supporting v1 receives v2.

Verify:

```text
version-specific route
or
DLQ + alert
```

---

# 296. Consumer Crash Test

Crash after DB commit before offset commit.

Verify replay becomes no-op through Inbox.

---

# 297. Outbox Publisher Crash Test

Crash after Kafka publish before `published_at`.

Verify duplicate publish remains safe downstream.

---

# 298. Broker Failure Test

Stop one broker.

Critical topics remain available if:

```text
ISR policy is satisfied
```

---

# 299. Kafka Outage Test

Stop cluster/network.

Verify:

```text
business transactions that use Outbox can still commit
Outbox backlog grows
publisher recovers later
```

---

# 300. Consumer Lag Test

Slow a consumer.

Verify:

```text
lag metrics
oldest event age
alerts
```

---

# 301. Rebalance Test

Scale/restart consumer pods.

Verify:

```text
processing resumes
no duplicate business side effect
```

---

# 302. Hot Partition Test

Generate skewed keys.

Observe partition lag imbalance.

---

# 303. Throughput Test

Measure:

```text
events/sec
MB/sec
producer latency
consumer processing
broker CPU
broker disk
broker network
```

---

# 304. Large Payload Test

Verify oversized events are rejected/controlled before production.

---

# 305. Security Test

Verify:

```text
unauthorized producer cannot write
unauthorized consumer cannot read
TLS required
credential rotation works
```

---

# 306. Offset Reset Test

Practice controlled offset reset/replay in non-production.

---

# 307. DR Test

Simulate:

```text
cluster loss
topic recreation
schema recovery
Outbox/replicated-data replay
consumer recovery
```

---

# 308. Definition of Done — Topic

- [ ] Owner.
- [ ] Description.
- [ ] Topic name.
- [ ] Partition key.
- [ ] Partition count.
- [ ] Replication factor.
- [ ] Min ISR.
- [ ] Retention.
- [ ] Cleanup policy.
- [ ] Data classification.
- [ ] ACLs.
- [ ] Schema subject.
- [ ] Monitoring.
- [ ] Runbook.

---

# 309. Definition of Done — Domain Event

- [ ] Past-tense business fact.
- [ ] Producer owner.
- [ ] Event ID.
- [ ] Event version.
- [ ] Aggregate ID/version.
- [ ] Occurred time.
- [ ] Correlation/causation.
- [ ] Minimal purpose-driven payload.
- [ ] Schema registered.
- [ ] Compatibility tested.
- [ ] Consumer impact documented.
- [ ] Privacy reviewed.

---

# 310. Definition of Done — Consumer

- [ ] Group ID.
- [ ] Supported event types.
- [ ] Supported versions.
- [ ] Inbox/business dedupe.
- [ ] Local transaction.
- [ ] Retry classification.
- [ ] Retry limit.
- [ ] DLQ.
- [ ] Lag metrics.
- [ ] Replay behavior.
- [ ] Security ACL.
- [ ] Tests.
- [ ] Processing SLO.

---

# 311. Definition of Done — Outbox

- [ ] Same transaction as business change.
- [ ] Unique event ID.
- [ ] Immutable payload.
- [ ] Publisher.
- [ ] Retry.
- [ ] Backlog metrics.
- [ ] Cleanup policy.
- [ ] Duplicate publish tested.
- [ ] Ordering strategy defined.

---

# 312. Definition of Done — DLQ

- [ ] Naming convention.
- [ ] Failure metadata.
- [ ] Retention.
- [ ] Alert.
- [ ] Owner.
- [ ] Replay procedure.
- [ ] Audit.
- [ ] Idempotency verified before replay.

---

# 313. Kafka Architecture Review Checklist

## Topic

- [ ] Owner.
- [ ] Purpose.
- [ ] Key.
- [ ] Partitions.
- [ ] Retention.
- [ ] Cleanup.
- [ ] ACL.
- [ ] Data classification.

## Producer

- [ ] `acks=all` for critical topic.
- [ ] Producer idempotence.
- [ ] Outbox where DB change is involved.
- [ ] Schema validation.
- [ ] Trace propagation.

## Consumer

- [ ] Idempotency.
- [ ] Inbox/business uniqueness.
- [ ] Retry.
- [ ] DLQ.
- [ ] Lag monitoring.
- [ ] Replay safety.

---

# 314. Schema Review Checklist

- [ ] Stable event name.
- [ ] Event version.
- [ ] Required vs optional clear.
- [ ] No ambiguous units.
- [ ] UTC time format.
- [ ] Money representation explicit.
- [ ] No unnecessary PII.
- [ ] Compatibility mode.
- [ ] Example payload.
- [ ] Semantic change review.

---

# 315. Security Review Checklist

- [ ] TLS.
- [ ] Client authentication.
- [ ] Topic ACL.
- [ ] Group ACL.
- [ ] Schema Registry auth.
- [ ] Secrets externalized.
- [ ] PII minimized.
- [ ] Offset reset restricted.
- [ ] Replay audited.
- [ ] Topic deletion restricted.

---

# 316. Operations Review Checklist

- [ ] Broker health dashboard.
- [ ] Producer errors.
- [ ] Consumer lag.
- [ ] Outbox lag.
- [ ] Retry.
- [ ] DLQ.
- [ ] Disk.
- [ ] ISR.
- [ ] Runbooks.
- [ ] DR procedure.
- [ ] Schema alerts.

---

# 317. Production Readiness Checklist

Before production:

- [ ] Production cluster has HA replication.
- [ ] Critical topics use RF=3 or approved equivalent.
- [ ] `min.insync.replicas` configured.
- [ ] Durable producer acknowledgements configured.
- [ ] Topic definitions managed as code.
- [ ] Schemas registered.
- [ ] Compatibility checked in CI.
- [ ] Outbox tested.
- [ ] Inbox tested.
- [ ] Duplicate delivery tested.
- [ ] Retry/DLQ tested.
- [ ] Replay tested.
- [ ] Broker failure tested.
- [ ] Consumer lag alerts configured.
- [ ] DLQ alerts configured.
- [ ] Schema incompatibility guard enabled.
- [ ] Security ACLs reviewed.
- [ ] Capacity/load test passed.
- [ ] DR procedure reviewed/tested.

---

# 318. Initial Implementation Order

Follow the source order:

```text
1. Kafka cluster environments
2. Topic naming / ownership standard
3. Event envelope
4. Schema Registry
5. Producer standard
6. Consumer standard
7. Topic IaC
8. Security / TLS / ACL
9. Outbox implementation
10. Inbox implementation
11. Retry / DLQ standard
12. Trace propagation
13. Core domain topics
14. Consumer lag dashboards
15. DLQ replay tooling
16. Capacity / load testing
17. DR procedure
```

---

# 319. Minimum Viable Kafka Platform

First production-capable event platform requires:

```text
Highly available Kafka cluster
Topic ownership
Replication
Durable producer configuration
Event envelope
Schema Registry
Compatibility checks
Outbox
Consumer idempotency / Inbox
Retry
DLQ
Consumer lag monitoring
TLS / auth / ACL
Replay procedure
Capacity headroom
```

---

# 320. Controls That Must Not Be Postponed

Do not postpone:

```text
consumer idempotency
schema compatibility
Outbox
DLQ monitoring
```

---

# 321. Kafka Governance

Architecture/platform review rejects:

```text
unowned topics
unversioned events
raw DB-row events as domain contract
PII-heavy payloads
null keys where ordering is required
infinite retries
no DLQ
consumer without idempotency
manual topic/config drift
```

---

# 322. Topic Catalog Template

For each topic:

```text
Name:
Owner:
Purpose:
Producers:
Consumers:
Key:
Partitions:
Replication:
Min ISR:
Retention:
Cleanup Policy:
Schema Subject:
Data Classification:
SLO:
Runbook:
```

---

# 323. Event Catalog Template

For each event:

```text
Event Name:
Meaning:
Producer:
Topic:
Partition Key:
Version:
Aggregate:
Occurred At:
Payload:
Guarantees:
Non-Guarantees:
Consumers:
Example:
```

---

# 324. Consumer Catalog Template

For each consumer:

```text
Service:
Group ID:
Topic:
Supported Event Types:
Supported Versions:
Idempotency:
Retry:
DLQ:
Processing SLO:
Replay Mode:
Owner:
```

---

# 325. Capacity Planning Template

For each high-volume topic:

```text
Peak events/sec:
Average event size:
Peak MB/sec:
Partitions:
Consumer groups:
Retention:
Estimated storage:
Growth factor:
Failover headroom:
```

---

# 326. Core Domain Topic Baseline

Initial candidate streams from built services:

```text
identity.events.v1
customer.events.v1
catalog.events.v1
inventory.events.v1
promotion.events.v1
order.events.v1
payment.events.v1
wallet.events.v1
```

Later:

```text
loyalty.events.v1
mission.events.v1
notification.events.v1
integration.events.v1
```

Create only topics actually needed.

---

# 327. OrderCompleted Event

Topic:

```text
order.events.v1
```

Key:

```text
order_id
```

Payload may include, when source contract requires:

```text
order_id
customer_id
store_id
fulfillment_type
gross_amount
discount_amount
net_amount
currency
completed_at
```

---

# 328. OrderCompleted Consumers

Potential:

```text
loyalty-service
mission-service
notification-service
analytics
integration-service
```

Each uses its own consumer group.

---

# 329. WalletTopUpCompleted Event

Topic:

```text
wallet.events.v1
```

Key:

```text
wallet_id
```

Possible payload:

```text
topup_id
wallet_id
customer_id
amount
currency
source
completed_at
```

---

# 330. WalletTopUpCompleted Consumers

Potential:

```text
mission-service
notification-service
analytics
integration-service
```

Later Loyalty may consume it only if business rules require.

---

# 331. MissionCompleted Event

Future topic:

```text
mission.events.v1
```

Potential key:

```text
customer_id
```

Possible payload:

```text
mission_id
mission_code
progress_id
customer_id
completed_at
reward_campaign_id optional
```

---

# 332. RewardAssigned Event

Future topic:

```text
loyalty.events.v1
```

Possible key:

```text
customer_id
```

Possible payload:

```text
assignment_id
reward_id / reward_code
reward_type
customer_id
claim_expires_at
```

---

# 333. CouponRedeemed Event

Topic:

```text
promotion.events.v1
```

Possible key:

```text
promotion_id
```

or:

```text
customer_id
```

depending ordering requirements.

---

# 334. PaymentCaptured Event

Topic:

```text
payment.events.v1
```

Key:

```text
payment_id
```

Possible payload:

```text
payment_id
order_id
customer_id
amount
currency
provider
captured_at
```

Do not include raw provider secrets.

---

# 335. Financial Event Protection

Financial topics require:

```text
strict ACL
minimal payload
sufficient retention
consumer idempotency
reconciliation
```

---

# 336. Event Sequence Example

Checkout may generate:

```text
OrderCreated
PaymentAuthorized
InventoryReserved
OrderAccepted
PaymentCaptured
```

Do not expect one global ordering across topics.

Saga coordinates business correctness.

---

# 337. Event Causality

Use:

```text
correlation_id
causation_id
```

to reconstruct workflows.

---

# 338. Causation Chain Example

```text
CreateOrder command
      ↓
OrderCreated event
      ↓
NotificationCreated event
```

Each event records what caused it.

---

# 339. Incident Severity Guidance

Suggested source categories:

```text
SEV-1
cluster unavailable
offline partitions affecting critical topics

SEV-2
critical consumer lag
schema break
Outbox backlog threatening SLO

SEV-3
non-critical DLQ growth
single consumer issue
```

Customize operationally.

---

# 340. Broker Maintenance

During maintenance:

```text
one broker at a time
verify ISR
verify leader movement
verify client errors
```

---

# 341. Topic Expansion Change

Before increasing partitions:

```text
review partition key ordering
review consumer parallelism
review skew
update IaC
```

---

# 342. Retention Change

Reducing retention can permanently delete old events.

Requires impact review.

---

# 343. Schema Subject Deletion

Do not delete production schemas casually.

Historical events may still need them for deserialization.

---

# 344. Schema History vs Replay

Retain schema versions long enough to deserialize retained Kafka records.

---

# 345. Consumer Deployment Compatibility

Rolling deployment must support:

```text
old and new compatible event versions
```

during overlap.

---

# 346. Producer Deployment for Breaking Version

Preferred:

```text
deploy consumer support first
then producer
```

---

# 347. Dual Publish Migration

For major version transition, producer may temporarily publish:

```text
v1
+
v2
```

only when migration plan requires.

Do not leave indefinite dual publish.

---

# 348. Dual Consume Migration

Consumers may temporarily support:

```text
v1
and
v2
```

until migration completes.

---

# 349. Event Migration Completion

Remove old version only after:

```text
all consumers migrated
retention/replay requirements reviewed
observability shows no old-version traffic
```

---

# 350. Consumer Group Versioning

Incompatible consumer behavior may use a new:

```text
group ID
```

for controlled replay/migration.

---

# 351. Kafka Change Management

Changes requiring review:

```text
topic deletion
partition increase
retention reduction
schema breaking change
ACL broadening
consumer offset reset
```

---

# 352. Platform vs Service Ownership

Platform team owns:

```text
Kafka cluster
broker config
shared security
Schema Registry platform
topic provisioning automation
cluster monitoring
```

Service teams own:

```text
event semantics
producer correctness
consumer correctness
schema evolution
DLQ handling
```

---

# 353. Platform Kafka ADRs

Recommended:

```text
ADR-KAFKA-001 Cluster/environment strategy
ADR-KAFKA-002 Broker HA baseline
ADR-KAFKA-003 Topic naming
ADR-KAFKA-004 Topic granularity
ADR-KAFKA-005 Partition-key rules
ADR-KAFKA-006 Partition-count planning
ADR-KAFKA-007 Consumer-group naming
ADR-KAFKA-008 Event envelope
ADR-KAFKA-009 Schema format
ADR-KAFKA-010 Registry compatibility
ADR-KAFKA-011 Producer durability settings
ADR-KAFKA-012 Outbox publisher strategy
ADR-KAFKA-013 Inbox standard
ADR-KAFKA-014 Retry-topic strategy
ADR-KAFKA-015 DLQ standard
ADR-KAFKA-016 Replay governance
ADR-KAFKA-017 Retention framework
ADR-KAFKA-018 Compaction policy
ADR-KAFKA-019 Authentication mechanism
ADR-KAFKA-020 ACL model
ADR-KAFKA-021 Offset reset governance
ADR-KAFKA-022 DR strategy
ADR-KAFKA-023 Spring Kafka acknowledgment mode
ADR-KAFKA-024 Outbox serialization timing
```

---

# 354. Phase 15 Policy Freeze Checklist

Before production resolve:

- [ ] Kafka service/provider.
- [ ] Environment cluster topology.
- [ ] Production broker count.
- [ ] Replication-factor baseline.
- [ ] Min ISR baseline.
- [ ] Unclean leader policy.
- [ ] Zone/rack placement.
- [ ] Topic naming.
- [ ] Retry-topic naming.
- [ ] DLQ naming.
- [ ] Topic granularity policy.
- [ ] Partition-key rules.
- [ ] Partition-count review process.
- [ ] Consumer-group naming.
- [ ] Event envelope.
- [ ] Event-ID strategy.
- [ ] Aggregate-version strategy.
- [ ] Schema format.
- [ ] Schema Registry product/deployment.
- [ ] Compatibility mode.
- [ ] Schema subject naming.
- [ ] Producer compression.
- [ ] Producer delivery timeout.
- [ ] Producer retry/backoff.
- [ ] Outbox publisher method.
- [ ] Outbox batch size.
- [ ] Outbox cleanup retention.
- [ ] Inbox table standard.
- [ ] Auto-commit policy.
- [ ] Spring acknowledgment mode.
- [ ] Consumer isolation level.
- [ ] Immediate retry count.
- [ ] Delayed retry implementation.
- [ ] Retry delays.
- [ ] DLQ retention.
- [ ] DLQ alert policy.
- [ ] Replay approval process.
- [ ] Replay modes.
- [ ] Topic retention framework.
- [ ] Compaction policy.
- [ ] Kafka auth mechanism.
- [ ] ACL model.
- [ ] Credential rotation method.
- [ ] Data classification.
- [ ] Offset reset governance.
- [ ] Topic IaC implementation.
- [ ] Partition budget.
- [ ] Capacity headroom.
- [ ] Event-delivery SLOs.
- [ ] Lag thresholds.
- [ ] DR RPO/RTO.
- [ ] Cross-cluster replication requirement.

---

# 355. Recommended Phase 15 Work Breakdown

Suggested tickets:

```text
KAF-001 Select Kafka deployment model
KAF-002 Provision DEV Kafka environment
KAF-003 Provision UAT/STAGING Kafka environment
KAF-004 Provision PROD Kafka environment
KAF-005 Configure production replication
KAF-006 Configure min ISR
KAF-007 Configure unclean leader policy
KAF-008 Configure rack/AZ awareness
KAF-009 Define topic ownership standard
KAF-010 Define topic naming
KAF-011 Define command-topic naming
KAF-012 Define retry-topic naming
KAF-013 Define DLQ naming
KAF-014 Define topic-granularity standard
KAF-015 Define partition-key rules
KAF-016 Build partition-capacity worksheet
KAF-017 Define consumer-group naming
KAF-018 Define event envelope
KAF-019 Define event-ID generator
KAF-020 Define correlation/causation metadata
KAF-021 Define event-time standard
KAF-022 Define event privacy/payload limits
KAF-023 Select schema format
KAF-024 Deploy Schema Registry
KAF-025 Configure compatibility mode
KAF-026 Add schema compatibility CI
KAF-027 Define producer factory
KAF-028 Configure acks=all/idempotence
KAF-029 Configure compression/batching
KAF-030 Configure producer metrics
KAF-031 Define consumer factory
KAF-032 Disable auto commit for critical consumers
KAF-033 Define ack/commit behavior
KAF-034 Add error-handling deserializer
KAF-035 Implement common event routing
KAF-036 Implement Outbox schema
KAF-037 Implement polling Outbox publisher
KAF-038 Add SKIP LOCKED publisher concurrency
KAF-039 Add Outbox ordering protection
KAF-040 Add Outbox metrics/cleanup
KAF-041 Implement Inbox schema
KAF-042 Implement Inbox transaction pattern
KAF-043 Add business dedupe guidance
KAF-044 Implement retry classification
KAF-045 Implement immediate retry
KAF-046 Implement delayed retry
KAF-047 Implement retry metadata preservation
KAF-048 Implement DLQ publishing
KAF-049 Implement DLQ ownership/catalog
KAF-050 Implement DLQ replay tooling
KAF-051 Implement replay audit
KAF-052 Implement replay mode support
KAF-053 Implement topic retention templates
KAF-054 Implement compaction templates
KAF-055 Implement TLS
KAF-056 Implement client authentication
KAF-057 Implement producer ACLs
KAF-058 Implement consumer/group ACLs
KAF-059 Secure Schema Registry
KAF-060 Integrate Secret Manager credentials
KAF-061 Test credential rotation
KAF-062 Implement topic IaC
KAF-063 Add Kafka config drift checks
KAF-064 Define offset-reset process
KAF-065 Implement OpenTelemetry producer interceptors
KAF-066 Implement OpenTelemetry consumer interceptors
KAF-067 Implement Kafka platform dashboard
KAF-068 Implement per-service event dashboard
KAF-069 Add broker alerts
KAF-070 Add lag alerts
KAF-071 Add Outbox alerts
KAF-072 Add DLQ alerts
KAF-073 Add schema alerts
KAF-074 Build Order topic
KAF-075 Build Payment topic
KAF-076 Build Wallet topic
KAF-077 Build Promotion topic
KAF-078 Build required Identity/Customer topics
KAF-079 Register initial event schemas
KAF-080 Create topic catalog
KAF-081 Create event catalog
KAF-082 Create consumer catalog
KAF-083 Add producer unit tests
KAF-084 Add consumer unit tests
KAF-085 Add schema tests
KAF-086 Add PostgreSQL+Kafka Outbox integration tests
KAF-087 Add Inbox duplicate tests
KAF-088 Add partition/order tests
KAF-089 Add retry tests
KAF-090 Add DLQ tests
KAF-091 Add replay tests
KAF-092 Add schema-evolution tests
KAF-093 Add consumer crash tests
KAF-094 Add Outbox crash tests
KAF-095 Add broker failure tests
KAF-096 Add Kafka outage tests
KAF-097 Add consumer lag tests
KAF-098 Add rebalance tests
KAF-099 Add hot-partition tests
KAF-100 Add throughput tests
KAF-101 Add large-payload tests
KAF-102 Add security tests
KAF-103 Add offset-reset drill
KAF-104 Add DR test
KAF-105 Capacity/load test production sizing
KAF-106 Write broker outage runbook
KAF-107 Write lag runbook
KAF-108 Write rebalance runbook
KAF-109 Write poison-event runbook
KAF-110 Write schema-break runbook
KAF-111 Write Outbox backlog runbook
KAF-112 Write DLQ backlog runbook
KAF-113 Write disk-pressure runbook
KAF-114 Document DR procedure
KAF-115 Complete ADRs/policy freeze
KAF-116 Phase 15 exit review
```

---

# 356. Step 1 — Cluster Acceptance

Verify:

```text
environment isolation
3+ production brokers or approved equivalent
replication configured
min ISR configured
broker TLS/auth active
zone distribution correct
controller health monitored
```

---

# 357. Step 2 — Topic Standard Acceptance

Verify every topic has:

```text
owner
purpose
key
partitions
replication
retention
cleanup
classification
ACL
schema subject
```

---

# 358. Step 3 — Envelope Acceptance

Verify every business event includes:

```text
event_id
event_type
event_version
producer
aggregate_type
aggregate_id
occurred_at
correlation_id
```

and, where required:

```text
aggregate_version
causation_id
```

---

# 359. Step 4 — Schema Acceptance

Verify:

```text
schema registered
compatibility mode configured
breaking change rejected in CI
semantic changes reviewed
old consumer compatibility tested
```

---

# 360. Step 5 — Producer Acceptance

Verify critical producer:

```text
acks=all
idempotence enabled
bounded delivery timeout
compression configured
metrics exposed
trace propagated
```

---

# 361. Step 6 — Outbox Acceptance

Simulate:

```text
business DB commit
Kafka unavailable
```

Expected:

```text
business transaction remains committed
Outbox row remains unpublished
event publishes later
```

---

# 362. Step 7 — Duplicate Publish Acceptance

Simulate:

```text
Kafka publish succeeds
publisher crashes before mark-published
```

Expected:

```text
event published again
consumer business effect still once
```

---

# 363. Step 8 — Inbox Acceptance

Send identical event multiple times.

Expected:

```text
one business effect
duplicate counter increases
offset eventually commits
```

---

# 364. Step 9 — Retry/DLQ Acceptance

Verify:

```text
transient failure
→ bounded retry
→ success

permanent failure
→ bounded retry
→ DLQ
```

---

# 365. Step 10 — Replay Acceptance

Replay a historical range.

Verify:

```text
identity preserved
audit created
idempotency holds
external side effects suppressed where replay mode requires
```

---

# 366. Step 11 — Ordering Acceptance

Verify same aggregate key:

```text
maps to same partition
preserves partition order
consumer handles duplicates/late events
```

---

# 367. Step 12 — Security Acceptance

Verify:

```text
producer can write only owned topics
consumer can read only approved topics/groups
Schema Registry protected
topic create/delete restricted
credentials rotate safely
PII policy enforced
```

---

# 368. Step 13 — Capacity Acceptance

Verify production sizing covers:

```text
peak ingress
peak egress
retention storage
replication
partition overhead
consumer parallelism
one-broker/AZ loss headroom
```

---

# 369. Step 14 — Observability Acceptance

Operators can see:

```text
broker health
partition health
producer errors
consumer lag
Outbox age
retry age
DLQ age
schema failures
```

---

# 370. Step 15 — DR Acceptance

Demonstrate:

```text
topic/config recreation
Schema Registry recovery
Outbox replay
consumer restart/reset
idempotent event replay
reconciliation
```

---

# 371. Exit Criteria — Topic

The team can answer:

```text
Who owns every production topic?
Why does it exist?
What data classification applies?
```

---

# 372. Exit Criteria — Partitioning

The team can explain:

```text
partition key
ordering guarantee
partition count
parallelism ceiling
hot-key risk
```

for each major topic.

---

# 373. Exit Criteria — Durability

The team can show:

```text
replication
min ISR
acks
producer idempotence
```

for critical events.

---

# 374. Exit Criteria — Schema

The team can explain:

```text
schema format
registry
compatibility mode
event versioning
breaking-change rollout
```

---

# 375. Exit Criteria — Producer

The team can answer:

```text
How does a committed DB transaction reliably produce Kafka event?
```

Expected:

```text
Transactional Outbox
```

---

# 376. Exit Criteria — Consumer

The team can prove duplicate Kafka delivery does not duplicate business effects.

Expected controls:

```text
Inbox
event_id
business uniqueness
local transaction
```

---

# 377. Exit Criteria — Retry / DLQ

The team can explain:

```text
which failures retry
how long they retry
where delayed retry waits
when DLQ is used
who owns DLQ
```

---

# 378. Exit Criteria — Replay

The team can safely replay historical events without duplicate:

```text
notifications
financial credits
payments
rewards
```

---

# 379. Exit Criteria — Security

The team can answer:

```text
Who can write each topic?
Who can read it?
Who can change schemas?
Where are credentials stored?
```

---

# 380. Exit Criteria — Operations

Operators can monitor:

```text
broker health
lag
Outbox
retry
DLQ
storage
schema compatibility
```

and have runbooks.

---

# 381. Exit Criteria — Capacity

The platform has evidence that:

```text
brokers
partitions
storage
producer throughput
consumer throughput
```

handle peak load plus failure headroom.

---

# 382. Phase 15 Completion Tree

```text
PHASE 15 — KAFKA / EVENT ARCHITECTURE

├── Kafka Environment Strategy                 ✅
├── Broker HA / Replication                    ✅
├── Topic Ownership                            ✅
├── Topic Naming                               ✅
├── Topic Granularity                          ✅
├── Partition Strategy                         ✅
├── Partition Keys                             ✅
├── Consumer Groups                            ✅
├── Event Envelope                             ✅
│   ├── Event ID
│   ├── Version
│   ├── Aggregate
│   ├── Correlation
│   ├── Causation
│   └── Event Time
├── Payload / Privacy                          ✅
├── Schema Registry                            ✅
├── Compatibility / Versioning                 ✅
├── Producer Standard                          ✅
│   ├── acks=all
│   ├── Idempotence
│   ├── Retry/Timeout
│   └── Compression
├── Transactional Outbox                       ✅
├── Consumer Standard                          ✅
│   ├── Inbox
│   ├── Offset Commit
│   ├── Idempotency
│   └── Backpressure
├── Retry Topics                               ✅
├── DLQ                                        ✅
├── Replay                                     ✅
├── Retention                                  ✅
├── Compaction                                 ✅
├── Ordering                                   ✅
├── Effectively-Once Behavior                  ✅
├── Security / ACL                             ✅
├── Topic IaC                                  ✅
├── Capacity Planning                          ✅
├── Metrics / SLO / Alerts                     ✅
├── OpenTelemetry                              ✅
├── Runbooks                                   ✅
├── Backup / DR                                ✅
├── Spring Kafka Standards                     ✅
├── Testing / Failure Testing                  ✅
└── Governance / Catalogs                      ✅
```

---

# 383. Implementation Roadmap Handoff

The architecture source next discusses:

```text
Redis / Caching
```

but the official implementation sequence now returns to business services.

The next implementation document is:

```text
PHASE 16 — Loyalty Service
```

Redis remains scheduled for:

```text
PHASE 20 — Redis / Caching
```

---

# 384. Why Loyalty Comes Next

Kafka infrastructure is now ready to transport business facts such as:

```text
OrderCompleted
WalletTopUpCompleted
PaymentCaptured
```

Loyalty can safely consume those facts using:

```text
consumer group
Inbox/idempotency
event versioning
retry/DLQ
replay policy
```

without direct database access to Ordering, Wallet, or Payment.

---

# 385. Phase 16 Prerequisites Provided by Phase 15

Loyalty implementation can rely on:

```text
stable event envelope
Schema Registry
order.events.v1
wallet.events.v1 where required
consumer-group standard
Inbox pattern
event dedupe
retry/DLQ
trace propagation
replay mode
topic ACLs
consumer lag metrics
```

---

# 386. Final Phase 15 Principle

The canonical asynchronous path is:

```text
Business Transaction
      ↓
Transactional Outbox
      ↓
Kafka Producer
      ↓
Topic Partition
      ↓
Consumer Group
      ↓
Inbox / Idempotency
      ↓
Consumer Local Transaction
```

Failure path:

```text
Consumer Failure
      ↓
Immediate Retry
      ↓
Delayed Retry
      ↓
DLQ
      ↓
Fix
      ↓
Controlled Replay
```

The most important implementation rules are:

```text
Kafka topics have explicit owners.
Events are business facts, not raw DB-row changes.
Commands and events remain semantically distinct.
Partition keys reflect aggregate ordering requirements.
Kafka ordering exists only inside one partition.
Critical topics use durable replication and acknowledgements.
DB + Kafka reliability uses Transactional Outbox.
Consumers expect at-least-once delivery.
Consumers use Inbox and business uniqueness.
Producer idempotence does not replace business idempotency.
Schema compatibility is enforced by Registry and CI.
Semantic compatibility is reviewed separately from schema compatibility.
Retries are bounded.
DLQ is monitored, owned, and replayed deliberately.
Replay preserves original event identity.
Historical replay never blindly repeats external side effects.
Retention is designed per topic.
Compaction is not equivalent to full history.
Sensitive data is minimized.
Topic/ACL/schema configuration is managed as code.
Consumer lag age and Outbox age are first-class operational signals.
Kafka replication is not a complete backup.
Capacity includes failure headroom.
Kafka does not replace Saga state, reconciliation, or authoritative service ownership.
```

---

**End of PHASE 15 — Kafka / Event Architecture**
