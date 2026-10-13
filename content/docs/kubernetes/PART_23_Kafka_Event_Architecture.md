---
title: "PART 23 — KAFKA / EVENT ARCHITECTURE"
---

# PART 23 — KAFKA / EVENT ARCHITECTURE

> **Document Role:** Defines the complete platform architecture, standards, reliability model, schema strategy, operational controls, security posture, testing approach, and production-readiness requirements for Kafka-based event communication.  
> **Previous Part:** PART 22 — Distributed Transactions  
> **Next Part:** PART 24 — Redis / Caching  
> **Status:** Platform Architecture / Implementation Specification  
> **Primary Stack:** Apache Kafka, Java, Spring Boot, PostgreSQL, Schema Registry, OpenTelemetry, Prometheus, Grafana  
> **Audience:** Backend engineers, software architects, platform engineers, DevOps engineers, SREs, QA engineers, security engineers, technical leads.

---

# 4201 — Purpose

Kafka / Event Architecture defines how the platform transports durable asynchronous business facts and selected asynchronous commands.

It answers:

```text
What belongs on Kafka?
How are topics named?
How many partitions are needed?
What is the partition key?
How is ordering preserved?
How are duplicates handled?
How are events versioned?
How are schemas validated?
How are failed events retried?
How does DLQ work?
How do we replay safely?
How do outbox and inbox integrate with Kafka?
How do we monitor lag, throughput, and failures?
How is Kafka secured?
How much capacity do we need?
```

The core principle is:

```text
Kafka is durable event infrastructure,
not a substitute for domain ownership or transactional correctness.
```

---

# 4202 — Kafka Responsibilities

Kafka provides:

```text
durable event storage
ordered records within partitions
consumer-group fan-out
replay
high-throughput asynchronous transport
decoupling between producers and consumers
```

Kafka does not provide:

```text
business idempotency
cross-service ACID
automatic domain correctness
automatic schema compatibility
automatic compensation
```

---

# 4203 — Platform Eventing Goals

The event platform should be:

```text
durable
observable
secure
versioned
replayable
idempotent at consumers
operationally predictable
```

It should avoid:

```text
topic sprawl
event ambiguity
unbounded payloads
consumer coupling
replay surprises
silent schema breaks
```

---

# 4204 — Eventing Use Cases

Primary:

```text
Domain Events
Asynchronous Commands
Integration Events
Read-Model Projection Events
Operational Events where appropriate
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

# 4205 — What Should Not Use Kafka

Avoid Kafka for:

```text
simple immediate queries
low-latency synchronous validation
small one-off internal RPC
direct DB replication without semantic model
huge binary payloads
secrets/tokens
```

---

# 4206 — Domain Event

Domain event states:

```text
a business fact already occurred
```

Examples:

```text
OrderCreated
OrderCompleted
PaymentCaptured
WalletFundsReserved
CouponRedeemed
```

---

# 4207 — Integration Event

Integration event communicates a domain fact across service boundary.

It may be:

```text
same semantic event
```

or a translated external fact.

Example:

```text
DeliveryPartnerStatusReceived
```

---

# 4208 — Asynchronous Command

Command requests:

```text
one logical handler perform an action
```

Examples:

```text
GenerateMonthlyStatement
SyncTopUpToERP
SendBroadcastBatch
```

---

# 4209 — Event vs Command Rule

Event:

```text
past tense
multiple consumers allowed
producer does not expect one specific handler
```

Command:

```text
imperative intent
one logical receiver
success/failure semantics
```

---

# 4210 — Kafka Cluster

Production Kafka cluster should be treated as:

```text
Tier-1 shared infrastructure
```

because many services rely on it for:

```text
eventual consistency
recovery
replay
secondary workflows
```

---

# 4211 — Environment Isolation

Use separate Kafka environments for:

```text
DEV
UAT/STAGING
PROD
```

Do not share production topics with non-production workloads.

---

# 4212 — Cluster Isolation Options

Possible:

```text
one cluster per environment
multiple clusters by criticality/region
managed Kafka service
self-managed Kafka
```

Initial recommendation:

```text
one production cluster
one non-production cluster per controlled environment
```

unless scale/compliance requires more.

---

# 4213 — Broker Count

Production should not run:

```text
single broker
```

Minimum practical highly available deployment:

```text
3 brokers
```

Actual count depends on:

```text
throughput
storage
partition count
fault domains
```

---

# 4214 — Replication Factor

Recommended production default:

```text
replication.factor = 3
```

for critical topics.

---

# 4215 — Minimum In-Sync Replicas

Recommended:

```text
min.insync.replicas = 2
```

with producer:

```text
acks = all
```

for critical domain events.

---

# 4216 — Producer Durability

For critical events:

```text
acks=all
enable.idempotence=true
```

and sensible retry/delivery timeout settings.

---

# 4217 — Unclean Leader Election

For critical topics:

```text
disable unclean leader election
```

to avoid acknowledged data loss.

---

# 4218 — Rack / Zone Awareness

Distribute replicas across:

```text
availability zones
racks
failure domains
```

when infrastructure supports it.

---

# 4219 — Controller Architecture

Use modern Kafka controller architecture supported by chosen Kafka version.

Operational team owns:

```text
controller quorum health
broker health
partition leadership
```

---

# 4220 — Topic Ownership

Every topic has:

```text
business owner
technical owner
producer owner
schema owner
retention policy
```

---

# 4221 — Topic Naming

Recommended pattern:

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

# 4222 — Command Topic Naming

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

# 4223 — Retry Topic Naming

Example:

```text
order.events.v1.retry.1
order.events.v1.retry.2
```

or:

```text
<consumer>.retry.<delay>
```

Choose one platform convention.

---

# 4224 — DLQ Topic Naming

Recommended:

```text
<source-topic>.<consumer>.dlq
```

Example:

```text
order.events.v1.mission-service.dlq
```

---

# 4225 — Topic-per-Domain vs Topic-per-Event

Option A:

```text
order.events.v1
```

contains multiple Order events.

Option B:

```text
order.completed.v1
order.cancelled.v1
```

Initial recommendation:

```text
coherent domain event stream
```

unless different retention/security/throughput requires separate topics.

---

# 4226 — Avoid One Global Topic

Do not create:

```text
platform.events
```

for every domain.

Problems:

```text
security
retention
schema governance
partitioning
operational isolation
```

---

# 4227 — Avoid Excessive Topic Sprawl

Do not create a new topic for every small business event without need.

Too many topics increase:

```text
partition count
operational overhead
ACL complexity
monitoring noise
```

---

# 4228 — Topic Granularity Decision

Separate topic when there is materially different:

```text
retention
security
throughput
partition key
consumer population
compaction requirement
```

---

# 4229 — Partition

A partition provides:

```text
ordered append-only log
```

and unit of consumer parallelism.

---

# 4230 — Partition Key

Choose key from the aggregate whose ordering matters.

Examples:

```text
order_id
payment_id
wallet_id
customer_id
mission_progress_id
```

---

# 4231 — Order Event Partition Key

Use:

```text
order_id
```

for Order lifecycle.

---

# 4232 — Payment Event Partition Key

Use:

```text
payment_id
```

---

# 4233 — Wallet Event Partition Key

Use:

```text
wallet_id
```

---

# 4234 — Loyalty Event Partition Key

Depending stream:

```text
customer_id
```

or:

```text
points_account_id
```

---

# 4235 — Mission Event Partition Key

For mission progress sourced from customer events:

```text
customer_id
```

may improve customer-level ordering.

If specific progress aggregate is produced:

```text
progress_id
```

may be used.

---

# 4236 — Null Keys

Avoid null partition keys for events requiring ordering.

Null key produces distribution without stable aggregate ordering.

---

# 4237 — Hot Partition

Risk:

```text
one key receives very high traffic
```

Examples:

```text
global campaign ID
shared system account
```

Monitor skew.

---

# 4238 — Partition Count

Partition count determines:

```text
maximum consumer parallelism
broker overhead
ordering scope
```

---

# 4239 — Partition Count Planning

Estimate from:

```text
peak records/sec
average record size
consumer processing rate
target parallelism
growth
```

---

# 4240 — Partition Count Is Hard to Decrease

Increasing partitions is possible.

But it changes key-to-partition mapping for future records.

Do not resize casually when ordering assumptions matter.

---

# 4241 — Partition Count Example

Illustrative:

```text
Peak = 5,000 events/sec
One consumer instance = 500 events/sec
Required processing parallelism ≈ 10
```

Start above minimum with growth headroom, e.g.:

```text
12–18 partitions
```

after load testing.

---

# 4242 — Consumer Group

Consumer group represents:

```text
one logical consumer application
```

Each partition is processed by one group member at a time.

---

# 4243 — Independent Consumers

Example:

```text
OrderCompleted
```

may have groups:

```text
loyalty-service
mission-service
notification-service
analytics-service
```

Each processes independently.

---

# 4244 — Group ID Naming

Recommended:

```text
<service>-<purpose>-v1
```

Example:

```text
mission-service-order-events-v1
```

---

# 4245 — Consumer Parallelism

Maximum active consumers in one group:

```text
<= partition count
```

Extra consumers remain idle.

---

# 4246 — Rebalance

Consumer membership changes can trigger rebalance.

Rebalance may temporarily pause processing.

---

# 4247 — Cooperative Rebalancing

Prefer modern cooperative assignment where supported to reduce disruption.

---

# 4248 — Static Membership

Can reduce unnecessary rebalances for stable instances.

Evaluate with Kubernetes lifecycle carefully.

---

# 4249 — Consumer Processing Time

Must respect:

```text
max.poll.interval.ms
```

Long processing should not accidentally trigger rebalance.

---

# 4250 — Poll Batch Size

Set:

```text
max.poll.records
```

based on processing time.

Avoid receiving huge batch that cannot finish before poll interval.

---

# 4251 — Producer Event Envelope

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

# 4252 — Event ID

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

# 4253 — Aggregate ID

Identifies:

```text
business aggregate that produced the event
```

Useful for:

```text
partitioning
ordering
debugging
```

---

# 4254 — Aggregate Version

Optional but strongly useful where event sequence matters.

Example:

```text
Order version = 12
```

---

# 4255 — Correlation ID

Tracks larger business workflow.

Example:

```text
checkout request
```

through multiple events/services.

---

# 4256 — Causation ID

Identifies:

```text
command/event that caused this event
```

Supports event-chain debugging.

---

# 4257 — Occurred At

Use business event time:

```text
UTC instant
```

not consumer processing time.

---

# 4258 — Published At

Optional metadata:

```text
published_at
```

may differ from `occurred_at` due to outbox delay.

---

# 4259 — Producer Field

Use stable service identity:

```text
order-service
wallet-service
```

not pod name.

---

# 4260 — Event Data

Contains only:

```text
facts relevant to event meaning
```

Avoid full aggregate serialization.

---

# 4261 — Event Payload Size

Keep events small.

Recommended soft target:

```text
well below Kafka broker message limits
```

Avoid:

```text
images
documents
full product catalogs
large arrays
```

---

# 4262 — Large Payload Pattern

Store large payload elsewhere:

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

# 4263 — Event Privacy

Do not publish unnecessary:

```text
email
phone
address
tokens
password-reset codes
payment secrets
```

---

# 4264 — PII in Events

If PII is required:

```text
document purpose
restrict topic ACL
encrypt transport/storage
define retention
```

---

# 4265 — Schema Format

Possible:

```text
Protobuf
Avro
JSON Schema
```

For strongly typed Java microservices:

```text
Protobuf
```

or:

```text
Avro
```

are good candidates.

---

# 4266 — Schema Registry

Use schema registry to provide:

```text
schema storage
compatibility validation
version discovery
serialization support
```

---

# 4267 — Compatibility Mode

Recommended default:

```text
BACKWARD
```

or:

```text
BACKWARD_TRANSITIVE
```

depending platform policy.

---

# 4268 — Backward Compatibility

New producer schema can be read by existing consumers.

Typical safe change:

```text
add optional/defaulted field
```

---

# 4269 — Breaking Schema Change

Examples:

```text
remove required field
change type incompatibly
change field meaning
reuse Protobuf field number
```

Require:

```text
new major event version
```

---

# 4270 — Semantic Compatibility

Schema compatibility does not guarantee semantic compatibility.

Example:

```text
field remains integer
but meaning changes from cents to dollars
```

is breaking even if registry accepts it.

---

# 4271 — Event Version

Include:

```text
event_version
```

in envelope.

Used for:

```text
consumer branching
migration
debugging
```

---

# 4272 — Major vs Minor Version

Major:

```text
breaking semantic/schema change
```

Minor/additive changes may remain same event major version depending schema policy.

---

# 4273 — Event Deprecation

Process:

```text
identify consumers
publish replacement
support overlap
migrate consumers
stop old producer
retain old schema/history
```

---

# 4274 — Producer Schema Validation

CI should fail on incompatible schema change.

---

# 4275 — Consumer Compatibility Tests

Consumers should test:

```text
current version
older supported version
future additive fields
```

---

# 4276 — Unknown Event Version

Consumer should not silently parse incompatible version.

Options:

```text
reject to DLQ
route to version-specific handler
```

---

# 4277 — Producer Configuration

Critical producer recommended:

```text
acks=all
enable.idempotence=true
retries bounded by delivery timeout
compression enabled
```

---

# 4278 — Producer Idempotence

Kafka producer idempotence protects against duplicate records caused by producer retry within session semantics.

It does not replace:

```text
business event idempotency
```

---

# 4279 — Producer Retries

Kafka producer can retry transient broker errors.

Set:

```text
delivery.timeout.ms
request.timeout.ms
retry backoff
```

appropriately.

---

# 4280 — Compression

Good options:

```text
lz4
zstd
snappy
```

depending broker/client support.

Compression reduces:

```text
network
storage
```

at CPU cost.

---

# 4281 — Batching

Producer may batch via:

```text
linger.ms
batch.size
```

Tune by latency/throughput need.

Transactional domain events typically prefer:

```text
small bounded batching
```

---

# 4282 — Producer Buffer

Monitor:

```text
buffer exhaustion
```

Do not allow indefinite producer blocking.

---

# 4283 — Kafka Transactions

Kafka transactions can atomically write:

```text
multiple Kafka records/topics
```

and coordinate consumed-offset commits in Kafka-only pipelines.

---

# 4284 — Kafka Transactions Limitation

They do not make:

```text
PostgreSQL update
+
Kafka publish
```

atomic.

Use:

```text
Outbox
```

for DB + Kafka.

---

# 4285 — Outbox Pattern

Producer local DB transaction:

```text
BEGIN

update business state
insert outbox event

COMMIT
```

Publisher later sends to Kafka.

---

# 4286 — Outbox Table

Example:

```text
outbox_events
-------------
id
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

# 4287 — Outbox ID

Prefer:

```text
event_id
```

as outbox primary/business key.

---

# 4288 — Outbox Uniqueness

Unique:

```text
event_id
```

and optionally:

```text
aggregate_id + aggregate_version + event_type
```

where domain semantics require.

---

# 4289 — Outbox Publisher

Possible implementations:

```text
polling publisher
CDC/Debezium
transactional log capture
```

---

# 4290 — Polling Outbox Publisher

Flow:

```text
select unpublished
      ↓
publish Kafka
      ↓
mark published
```

Use:

```text
SKIP LOCKED
```

for multiple publishers.

---

# 4291 — Outbox Poll Query

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

# 4292 — Publish Then Mark Risk

Sequence:

```text
publish succeeds
process crashes
before published_at update
```

Event will publish again.

Consumer idempotency is therefore required.

---

# 4293 — Mark Then Publish Risk

Never:

```text
mark published
then publish
```

because crash may permanently lose event.

---

# 4294 — CDC Outbox

Debezium can stream committed outbox rows from DB log.

Benefits:

```text
low polling overhead
good throughput
```

Costs:

```text
CDC infrastructure complexity
connector operations
```

---

# 4295 — Outbox Ordering

For one aggregate:

```text
aggregate_version
```

helps maintain event sequence.

Publisher should avoid publishing version 12 before 11 when strict ordering matters.

---

# 4296 — Outbox Backlog

Monitor:

```text
unpublished row count
oldest unpublished age
publish failures
```

---

# 4297 — Inbox Pattern

Consumer records:

```text
processed event IDs
```

inside its local DB.

---

# 4298 — Inbox Table

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

# 4299 — Inbox Transaction

```text
BEGIN

check event not processed
apply business effect
insert processed_events
insert local outbox if needed

COMMIT
```

---

# 4300 — Duplicate Consumer Delivery

If same event arrives again:

```text
processed_events exists
→ acknowledge/no-op
```

---

# 4301 — Business Dedupe

For financial operations, also use:

```text
business reference uniqueness
```

because event ID alone may not catch semantically duplicated producer events.

---

# 4302 — Consumer Offset Commit

Commit offset only after:

```text
business processing succeeds
```

or event is durably routed to retry/DLQ according to policy.

---

# 4303 — Crash After DB Commit

If:

```text
DB committed
offset not committed
```

Kafka replays event.

Inbox makes replay safe.

---

# 4304 — Consumer Error Classification

Classify:

```text
RETRYABLE
NON_RETRYABLE
UNKNOWN
```

---

# 4305 — Retryable Consumer Error

Examples:

```text
DB temporarily unavailable
downstream transient failure
network timeout
```

---

# 4306 — Non-Retryable Consumer Error

Examples:

```text
unsupported schema
invalid required data
permanent business configuration error
```

---

# 4307 — Retry Strategy

Avoid infinite blocking on one bad record.

Use:

```text
bounded immediate retry
then delayed retry
then DLQ
```

---

# 4308 — Immediate Retry

Small count:

```text
1–3 attempts
```

for fast transient failures.

---

# 4309 — Delayed Retry

Kafka itself does not natively delay per record.

Patterns:

```text
retry topics
scheduler DB
external retry queue
```

---

# 4310 — Retry Topic Pattern

Example:

```text
main
→ retry-30s
→ retry-5m
→ DLQ
```

---

# 4311 — Retry Topic Headers

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

# 4312 — Retry Event ID

Preserve original:

```text
event_id
```

Do not generate a new business event ID for retry.

---

# 4313 — Retry Ordering Tradeoff

Sending one event to retry topic allows later events from original partition to continue.

This may break strict per-key processing order.

---

# 4314 — Strict Ordering Failure Strategy

If strict order is essential:

```text
pause key/partition
```

or design consumer state to tolerate later events.

This is a deliberate tradeoff.

---

# 4315 — DLQ

DLQ stores events that exceeded retry or are non-processable.

DLQ is:

```text
operational quarantine
```

not permanent garbage bin.

---

# 4316 — DLQ Record

Include:

```text
original event
failure category
consumer
attempt count
first/last failure
stack/error summary safe
```

---

# 4317 — DLQ Retention

Long enough for:

```text
investigation
bug fix
replay
```

but bounded by storage/privacy policy.

---

# 4318 — DLQ Ownership

Consumer team owns its DLQ.

Producer is not automatically responsible for all consumer failures.

---

# 4319 — DLQ Alert

Alert when:

```text
DLQ rate > threshold
```

or any event enters DLQ for critical consumer.

---

# 4320 — DLQ Replay

Replay after:

```text
root cause fixed
schema supported
mapping fixed
dependency restored
```

---

# 4321 — Replay Preserve Identity

Replay must preserve:

```text
event_id
aggregate_id
aggregate_version
correlation_id
```

---

# 4322 — Replay Audit

Record:

```text
who triggered replay
source DLQ
time
range/count
reason
```

---

# 4323 — Topic Replay

Full historical replay may be used to rebuild:

```text
read models
analytics
derived projections
```

---

# 4324 — Replay Safety

Before replay:

```text
consumer idempotency verified
external side effects disabled or guarded
target projection cleared/versioned if needed
```

---

# 4325 — Dangerous Replay

Never replay historical events into a consumer that would:

```text
send notifications again
charge payment
credit wallet
issue reward
```

unless consumer has explicit historical replay mode/idempotency.

---

# 4326 — Replay Consumer Group

Use a new group ID for rebuilding projection.

Example:

```text
analytics-rebuild-202610
```

---

# 4327 — Replay Window

Define:

```text
from offset
from timestamp
full retention
```

---

# 4328 — Retention

Kafka topic retention may be:

```text
time-based
size-based
compacted
```

---

# 4329 — Event Retention Policy

Business-critical domain events:

```text
days/weeks/months
```

depending replay and compliance needs.

Do not use one retention for every topic.

---

# 4330 — Retention Factors

Consider:

```text
replay need
audit need
storage cost
privacy
disaster recovery
consumer outage tolerance
```

---

# 4331 — Short Retention Risk

If consumer is down longer than retention:

```text
events disappear before processing
```

Need:

```text
retention > maximum recovery window
```

---

# 4332 — Long Retention Risk

Long retention increases:

```text
storage
PII exposure duration
replay complexity
```

---

# 4333 — Log Compaction

Compaction retains:

```text
latest value per key
```

over time.

Good for:

```text
reference data
configuration projections
latest customer tier
latest store mapping
```

---

# 4334 — Compaction Is Not History

Compacted topic does not guarantee full event history.

Do not use it as only source for audit ledger.

---

# 4335 — Tombstone

In compacted topic:

```text
key + null value
```

may signal deletion.

Consumers must handle.

---

# 4336 — Topic Cleanup Policy

Possible:

```text
delete
compact
compact,delete
```

Choose per semantics.

---

# 4337 — Ordering Guarantee

Kafka guarantees:

```text
record order within one partition
```

not across partitions.

---

# 4338 — Producer Ordering

With idempotent producer and appropriate settings, preserve send order per partition.

---

# 4339 — Multiple Producers Same Aggregate

Avoid multiple independent producers writing same aggregate lifecycle.

One service should own event sequence.

---

# 4340 — Aggregate Ownership

Example:

```text
Order Service
```

is the only producer of authoritative:

```text
OrderAccepted
OrderCompleted
OrderCancelled
```

---

# 4341 — Late Event

Consumer may receive valid event late due to:

```text
retry
network
outbox lag
```

Use event time/version.

---

# 4342 — Out-of-Order Cross-Topic

Do not rely on:

```text
Payment event
always arrives before Order event
```

unless explicitly coordinated.

---

# 4343 — Event Time vs Processing Time

Store/use both concepts:

```text
occurred_at
processed_at
```

---

# 4344 — Consumer Watermark

For analytics/streaming, watermark may be useful.

Transactional consumers usually rely on:

```text
aggregate version / idempotency
```

---

# 4345 — Exactly-Once Semantics

Platform expectation:

```text
effectively-once business behavior
```

through:

```text
at-least-once transport
+
idempotent producer/consumer behavior
+
business uniqueness
```

---

# 4346 — Kafka Exactly-Once Limit

Kafka EOS can help Kafka-to-Kafka pipelines.

It does not eliminate:

```text
DB idempotency
external API idempotency
Saga compensation
```

---

# 4347 — Eventual Consistency

Kafka enables eventual propagation.

Consumers may lag temporarily.

Applications must understand:

```text
which read models may be stale
```

---

# 4348 — Consumer Consistency

For critical decision:

```text
query authoritative service
```

not potentially stale Kafka projection.

---

# 4349 — Event Fan-Out

One producer event may have many consumers.

Producer should not need to know them.

---

# 4350 — Consumer Independence

Each consumer group owns:

```text
offset
retry
DLQ
processing SLO
```

---

# 4351 — Slow Consumer

A slow consumer should not block other consumer groups.

Monitor its own lag.

---

# 4352 — Consumer Side Effects

If consumer calls external API:

```text
idempotency
timeout
retry
unknown outcome
```

still apply.

Kafka does not make external side effects safe automatically.

---

# 4353 — Event Handler Design

Handler should be:

```text
small
deterministic
idempotent
```

Delegate domain work to application use cases.

---

# 4354 — Avoid Business Logic in Listener

Bad:

```text
@KafkaListener
contains 300 lines of business logic
```

Good:

```text
deserialize
validate envelope
invoke use case
handle result
```

---

# 4355 — Consumer Transactions

Use local DB transaction around:

```text
inbox
business change
local outbox
```

---

# 4356 — Kafka Offset Transaction

Offset commit is separate from local DB unless using Kafka-only transaction pattern.

Inbox handles replay.

---

# 4357 — Poison Pill

Malformed record may fail deserialization before business handler.

Need:

```text
error-handling deserializer
raw-record capture
DLQ
```

---

# 4358 — Unsupported Event Type

If topic contains multiple event types, consumer filters expected types.

Unknown type:

```text
ignore if truly irrelevant
```

Unsupported version of relevant type:

```text
DLQ/alert
```

---

# 4359 — Event Routing

Prefer explicit:

```text
event_type
```

handler registry.

---

# 4360 — Handler Registry

Example:

```text
ORDER_COMPLETED
→ OrderCompletedHandler

ORDER_CANCELLED
→ OrderCancelledHandler
```

---

# 4361 — Schema Validation at Consumer

Validate:

```text
required envelope
event version
payload
```

before domain processing.

---

# 4362 — Consumer Backpressure

Consumer may reduce processing rate by:

```text
max.poll.records
pause/resume
bounded worker pool
```

Do not fetch unbounded work into memory.

---

# 4363 — Consumer Concurrency

Spring Kafka concurrency should not exceed useful partition count.

---

# 4364 — Parallel Processing Within Partition

Avoid if event ordering matters.

If parallelizing, ensure:

```text
per-key ordering preserved
```

---

# 4365 — Batch Consumer

Batch processing can improve throughput.

Use only if:

```text
error handling
partial failures
transaction size
```

are understood.

---

# 4366 — Batch Failure

One bad record should not cause endless reprocessing of a huge batch without visibility.

---

# 4367 — Producer Outbox Throughput

High-volume outbox may require:

```text
batch publish
parallel workers
partition-aware ordering
```

---

# 4368 — Outbox Table Growth

Clean/archive published rows.

Do not let outbox grow forever.

---

# 4369 — Outbox Retention

Retain published rows for:

```text
support/reconciliation window
```

then archive/delete.

---

# 4370 — Event Store vs Kafka

Kafka is a durable log but not automatically the platform's formal event store.

If full event-sourcing is required, design separately.

---

# 4371 — Event Sourcing Decision

Current architecture does not require full event sourcing.

Services remain:

```text
state-based
+
domain events
```

unless a domain explicitly adopts event sourcing.

---

# 4372 — Event Sourcing Warning

Do not confuse:

```text
publishing events
```

with:

```text
event-sourced aggregate
```

---

# 4373 — Kafka Security

Security areas:

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

# 4374 — TLS

Use:

```text
TLS
```

for broker/client communication in production.

---

# 4375 — Authentication

Possible:

```text
mTLS
SASL/SCRAM
SASL/OAUTHBEARER
cloud IAM
```

Choose platform-supported mechanism.

---

# 4376 — Authorization

Use Kafka ACLs or managed equivalent.

Principle:

```text
least privilege
```

---

# 4377 — Producer ACL

Example:

```text
order-service
WRITE order.events.v1
```

It should not write:

```text
payment.events.v1
```

---

# 4378 — Consumer ACL

Example:

```text
mission-service
READ order.events.v1
GROUP mission-service-order-events-v1
```

---

# 4379 — Topic Create Permission

Application services should generally not have unrestricted:

```text
CREATE topic
ALTER cluster
```

in production.

Platform/IaC manages topics.

---

# 4380 — Schema Registry Security

Protect:

```text
schema read/write
compatibility configuration
subject deletion
```

---

# 4381 — Secrets

Kafka credentials stored in:

```text
secret manager
```

not source code.

---

# 4382 — Credential Rotation

Clients should support:

```text
credential rotation
```

without long outage.

---

# 4383 — Topic Data Classification

Classify each topic:

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

# 4384 — Restricted Topic

Financial/security topics require stricter ACL.

Examples:

```text
payment
wallet
identity security events
```

---

# 4385 — PII Minimization

Event design should minimize PII.

Prefer:

```text
customer_id
```

over:

```text
email/phone
```

---

# 4386 — Encryption at Rest

Use broker/storage encryption supported by platform/cloud.

---

# 4387 — Audit

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

# 4388 — Offset Reset

Offset reset is high-risk.

Require:

```text
permission
reason
target group
topic/partition
new offset
audit
```

---

# 4389 — Earliest / Latest Reset

Operations may reset:

```text
earliest
latest
timestamp
specific offset
```

Only after replay impact review.

---

# 4390 — Consumer Group Deletion

Do not delete group state casually.

May trigger:

```text
full replay
```

or skipped events depending new group behavior.

---

# 4391 — Topic Deletion

Topic deletion is destructive.

Production should require:

```text
change control
backup/export if required
consumer inventory check
```

---

# 4392 — Topic Configuration as Code

Manage:

```text
topic
partitions
replication
retention
cleanup policy
ACLs
```

through Terraform/IaC where possible.

---

# 4393 — Kafka Capacity Planning

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

# 4394 — Ingress Throughput

Formula:

```text
events/sec × average event bytes
```

---

# 4395 — Replication Storage

Approximate storage:

```text
ingress bytes
× retention duration
× replication factor
```

plus overhead.

---

# 4396 — Egress Amplification

Each consumer group reads the stream.

Approximate egress:

```text
topic ingress
× number of active consumer groups
```

---

# 4397 — Capacity Example

Illustrative:

```text
2,000 events/sec
1 KB average
≈ 2 MB/sec ingress

3 replicas
≈ 6 MB/sec broker write traffic before overhead

5 consumer groups
≈ 10 MB/sec logical consumer read traffic
```

---

# 4398 — Storage Example

Illustrative:

```text
2 MB/sec
× 86,400 sec/day
≈ 172.8 GB/day logical data
```

With replication factor 3:

```text
≈ 518 GB/day before compression/overhead
```

Compression can materially reduce this.

---

# 4399 — Partition Capacity

Avoid planning only by storage.

Partitions also affect:

```text
broker memory
file handles
controller metadata
recovery time
```

---

# 4400 — Partition Count Budget

Maintain cluster-wide partition budget.

Do not allow teams to create thousands of partitions without review.

---

# 4401 — Consumer Capacity

Estimate:

```text
records/sec per consumer instance
```

under realistic DB/business processing.

---

# 4402 — Scaling Consumers

Scale until:

```text
consumer count ≈ partition count
```

Beyond that no additional partition parallelism.

---

# 4403 — Partition Increase Trigger

Consider increase when:

```text
consumer lag persists
consumer CPU has headroom issue? maybe not
throughput exceeds partition capability
future scaling requires more consumers
```

Load test first.

---

# 4404 — Broker Disk

Monitor:

```text
disk utilization
disk IOPS
segment growth
retention cleanup
```

---

# 4405 — Broker Network

Monitor:

```text
bytes in
bytes out
replication traffic
consumer traffic
```

---

# 4406 — Broker CPU

Serialization/compression/TLS can affect CPU.

---

# 4407 — Cluster Headroom

Maintain operational headroom for:

```text
broker failure
traffic spike
rebalancing
replica catch-up
```

---

# 4408 — Failure Domain Capacity

Cluster should continue safely after losing one broker/AZ according to availability target.

---

# 4409 — Broker Failure

With RF=3 and min ISR=2:

```text
one replica failure
```

can still allow durable writes if ISR remains sufficient.

---

# 4410 — Under-Replicated Partition

Alert on:

```text
under-replicated partitions
```

---

# 4411 — Offline Partition

Critical alert:

```text
offline partition
```

means topic portion unavailable.

---

# 4412 — ISR Shrink

Monitor:

```text
ISR shrink/expand rate
```

as broker/network/disk health signal.

---

# 4413 — Leader Imbalance

Monitor partition leadership distribution.

---

# 4414 — Kafka Metrics

Cluster:

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

# 4415 — Producer Metrics

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

# 4416 — Consumer Metrics

```text
records_consumed_rate
records_lag
records_lag_max
fetch_latency
commit_latency
rebalance_total
```

---

# 4417 — Application Event Metrics

```text
events_published_total
events_consumed_total
event_processing_failure_total
event_duplicate_total
event_dlq_total
```

---

# 4418 — Outbox Metrics

```text
outbox_unpublished_count
outbox_oldest_age
outbox_publish_failure_total
```

---

# 4419 — Inbox Metrics

```text
duplicate_event_total
processed_event_total
```

---

# 4420 — Retry Metrics

```text
retry_event_total
retry_age
retry_exhausted_total
```

---

# 4421 — DLQ Metrics

```text
dlq_event_total
dlq_oldest_age
dlq_replay_total
```

---

# 4422 — Kafka SLIs

Potential:

```text
publish success rate
P95 publish latency
consumer processing latency
consumer lag age
outbox delay
DLQ rate
broker availability
```

---

# 4423 — Event Delivery SLO

For critical async workflow:

```text
99.x% of events processed within N seconds/minutes
```

Define by consumer.

---

# 4424 — Lag SLO

Example:

```text
95% OrderCompleted events consumed by Mission within 30 seconds
```

Illustrative.

---

# 4425 — Alerting

Critical alerts:

```text
offline partition
under-replicated partition sustained
producer failure spike
consumer lag age
outbox backlog
DLQ entries
schema incompatibility
broker disk high
```

---

# 4426 — Dashboard

Platform dashboard:

```text
broker health
topic throughput
partition health
producer errors
consumer lag by group
outbox lag
DLQ
schema errors
```

---

# 4427 — Per-Service Dashboard

Show:

```text
events produced
events consumed
processing success
duplicate count
retry
DLQ
lag
processing latency
```

---

# 4428 — Distributed Tracing

Propagate:

```text
traceparent
tracestate
correlation_id
```

through Kafka headers.

---

# 4429 — Producer Span

Span:

```text
kafka produce order.events.v1
```

---

# 4430 — Consumer Span

Span:

```text
kafka consume order.events.v1
```

Link to producer trace context.

---

# 4431 — Long Delay Trace

For long asynchronous delay, trace may expire.

Use logs with:

```text
event_id
correlation_id
causation_id
```

---

# 4432 — Structured Logging

Producer log:

```text
event_id
event_type
topic
partition
aggregate_id
```

Consumer log:

```text
event_id
consumer_group
result
retry_count
```

---

# 4433 — Avoid Payload Logging

Do not log full event payload by default.

Especially for:

```text
payment
wallet
identity
customer
```

---

# 4434 — Kafka Runbooks

Required:

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

# 4435 — Broker Outage Runbook

```text
identify failed broker
check ISR
check controller/quorum
verify producer impact
restore broker
monitor replica catch-up
```

---

# 4436 — Consumer Lag Runbook

```text
identify topic/group
check oldest lag
check consumer health
check DB latency
check poison event
check partition skew
scale consumers if partitions allow
```

---

# 4437 — Rebalance Storm Runbook

Check:

```text
pod restarts
max.poll.interval
session timeout
network
consumer processing time
deployment churn
```

---

# 4438 — Poison Event Runbook

```text
capture event safely
classify schema/data/bug
move to DLQ
fix consumer/config
replay with original ID
```

---

# 4439 — Schema Incompatibility Runbook

```text
stop incompatible producer rollout
identify schema version
rollback if needed
restore compatibility
add CI guard
```

---

# 4440 — Outbox Backlog Runbook

```text
check Kafka health
check publisher errors
check DB locks
check serialization/schema
scale publisher
monitor oldest age
```

---

# 4441 — DLQ Backlog Runbook

```text
group by failure
prioritize critical business events
fix root cause
replay bounded batch
monitor duplicates/effects
```

---

# 4442 — Disk Pressure Runbook

```text
check retention
large topics
replication
unexpected payload growth
consumer backlog not directly deleting data
expand storage or reduce safe retention
```

Do not delete critical topics impulsively.

---

# 4443 — Backup Strategy

Kafka is replicated but replication is not a backup.

Depending requirements, consider:

```text
cross-cluster replication
tiered storage
topic export
long retention
```

for disaster scenarios.

---

# 4444 — Disaster Recovery

Define:

```text
RPO
RTO
cluster rebuild
topic recreation
schema registry recovery
consumer offset recovery
outbox replay
```

---

# 4445 — Cross-Cluster Replication

Possible technologies:

```text
MirrorMaker 2
managed replication
cluster linking
```

Use only if DR requirements justify.

---

# 4446 — DR Cluster

Possible:

```text
warm standby Kafka cluster
```

with replicated critical topics.

---

# 4447 — Consumer Offset DR

Offsets may need replication or controlled reset from:

```text
timestamp
event ID
outbox/reconciliation
```

---

# 4448 — Schema Registry Backup

Back up/recover:

```text
schemas
subjects
compatibility settings
```

---

# 4449 — Topic IaC Recovery

Terraform/IaC should recreate:

```text
topics
ACLs
retention
partitions
```

---

# 4450 — Event Replay After DR

Use:

```text
idempotent consumers
reconciliation
```

because offset position may not be exact.

---

# 4451 — Spring Kafka Standards

Recommended shared conventions:

```text
standard producer factory
standard consumer factory
common envelope
error handling
OpenTelemetry interceptors
security config
```

---

# 4452 — Shared Kafka Library

A small internal library may provide:

```text
event envelope
header constants
serializer setup
trace propagation
error classification helpers
```

Do not put domain event classes from every service into one shared library.

---

# 4453 — Producer Template

Service owns its event schema.

Platform library only provides transport standards.

---

# 4454 — Consumer Listener Structure

Recommended:

```java
@KafkaListener(...)
public void onMessage(EventEnvelope<OrderCompleted> event) {
    handler.handle(event);
}
```

Listener remains thin.

---

# 4455 — Deserialization Error Handling

Configure:

```text
error-handling deserializer
dead-letter publishing
safe raw record capture
```

---

# 4456 — Manual Ack

Use only when processing semantics require.

Default behavior should be standardized across platform.

---

# 4457 — Auto Commit

For business-critical consumers:

```text
enable.auto.commit=false
```

Prefer explicit/container-managed commits after processing.

---

# 4458 — Offset Commit Mode

Choose platform standard consistent with:

```text
inbox processing
```

---

# 4459 — Consumer Isolation Level

If consuming Kafka transactions:

```text
read_committed
```

may be appropriate.

---

# 4460 — Producer Serialization Failure

A schema/serialization failure should occur before send.

Alert and fail publishing pipeline.

---

# 4461 — Outbox Serialization Timing

Option A:

```text
store serialized payload
```

Option B:

```text
store event object JSON
serialize at publisher
```

Choose one standard.

---

# 4462 — Recommended Outbox Payload

Store immutable:

```text
event envelope payload
event type/version
headers
```

so publication retries are deterministic.

---

# 4463 — Schema ID

Serializer may embed schema ID according to registry format.

Do not hard-code schema IDs in domain logic.

---

# 4464 — Event Headers

Potential:

```text
event_id
event_type
event_version
correlation_id
causation_id
traceparent
content_type
```

Avoid duplicating too much envelope data unnecessarily.

---

# 4465 — Header vs Payload

Business-relevant immutable metadata should be available in payload/envelope.

Transport-only data may live in headers.

---

# 4466 — Consumer Filtering

If domain topic contains multiple types:

```text
consumer can filter relevant event_type
```

But high irrelevant volume may justify separate topic later.

---

# 4467 — Topic Evolution

Split topic when:

```text
security
throughput
retention
consumer filtering cost
partitioning
```

provides evidence.

---

# 4468 — Kafka and Saga

Saga may publish/consume:

```text
commands
step results
domain events
```

But Saga durable state remains in owning service DB.

---

# 4469 — Kafka and Notification

Notification consumers should use:

```text
dedupe
```

to avoid repeat sends during replay.

---

# 4470 — Kafka and Loyalty

OrderCompleted replay must not:

```text
earn points twice
```

Use:

```text
processed_events + earning business uniqueness
```

---

# 4471 — Kafka and Mission

Mission progress uses:

```text
source event ID
```

to prevent duplicate progress.

---

# 4472 — Kafka and Wallet

Financial consumers require:

```text
event ID
business reference
local unique constraint
```

---

# 4473 — Kafka and Promotion

Reward-to-coupon issuance event must use:

```text
reward_assignment_id
```

as unique issuance reference.

---

# 4474 — Kafka and Integration

Legacy/ERP sync consumers must:

```text
dedupe
retry
reconcile
```

external side effects.

---

# 4475 — Topic Catalog

Maintain central catalog:

```text
topic
owner
description
key
schema
retention
cleanup policy
producers
consumer groups
classification
```

---

# 4476 — Event Catalog

For every event:

```text
event name
owner
meaning
version
example
partition key
schema
consumers
```

---

# 4477 — Event Documentation Rule

Document:

```text
when event fires
what is guaranteed
what is not guaranteed
```

---

# 4478 — Example Guarantee

`OrderCompleted` guarantees:

```text
Order Service has committed final completion state
```

It may not guarantee:

```text
notification delivered
points already awarded
ERP already synchronized
```

---

# 4479 — Event Contract Anti-Pattern

Avoid ambiguous field:

```text
status = 1
```

Prefer canonical enum:

```text
status = COMPLETED
```

where payload needs status.

---

# 4480 — Event Name Anti-Pattern

Avoid:

```text
OrderUpdated
```

for every behavior if consumers need precise meaning.

Prefer:

```text
OrderAccepted
OrderCancelled
OrderCompleted
```

for important business facts.

---

# 4481 — Generic Event Anti-Pattern

Avoid:

```text
EntityChanged {
  table: ...
  action: ...
}
```

for domain integration.

This exposes persistence model.

---

# 4482 — Event Payload Ownership

Producer owns semantic meaning.

Consumer must not infer undocumented fields.

---

# 4483 — Consumer Coupling Warning

If many consumers need a field, it may belong in event.

But do not turn event into:

```text
full service database snapshot
```

---

# 4484 — Event Enrichment Tradeoff

Too little data:

```text
consumer synchronous calls
```

Too much:

```text
coupling/privacy/payload bloat
```

Design intentionally.

---

# 4485 — Event Replay Mode

Consumers with side effects may implement:

```text
LIVE
REPLAY_READ_MODEL
```

mode.

In replay mode:

```text
disable notifications/external side effects
```

where appropriate.

---

# 4486 — Historical Event Backfill

If new consumer needs past events beyond retention:

Options:

```text
source-service export
database backfill
special snapshot event
```

not fabricate fake events without provenance.

---

# 4487 — Snapshot Event

For bootstrap:

```text
CustomerTierSnapshot
CatalogSnapshot
```

may be used for projection initialization.

Keep distinct from normal domain events.

---

# 4488 — Backfill Audit

Record:

```text
source
time range
consumer
records
version
```

---

# 4489 — Kafka Testing Strategy

Test:

```text
Producer
Consumer
Schema
Ordering
Dedupe
Retry
DLQ
Replay
Outbox
Inbox
Security
Load
Failure
DR
```

---

# 4490 — Producer Unit Tests

Verify:

```text
event type
event version
aggregate key
required fields
no sensitive data
```

---

# 4491 — Schema Compatibility Tests

CI tests:

```text
new schema against registry baseline
```

Reject breaking changes.

---

# 4492 — Consumer Unit Tests

Test:

```text
current event
duplicate
unsupported version
missing field
business rejection
```

---

# 4493 — Embedded Kafka vs Testcontainers

Prefer realistic integration tests with:

```text
Kafka Testcontainers
```

for broker behavior.

---

# 4494 — Outbox Integration Test

Using PostgreSQL + Kafka Testcontainers:

```text
business transaction
creates outbox
publisher sends event
consumer receives
```

---

# 4495 — Inbox Integration Test

Send same event twice.

Expected:

```text
one business side effect
two transport deliveries
```

---

# 4496 — Ordering Test

Send:

```text
OrderCreated v1
OrderAccepted v2
OrderCompleted v3
```

same key.

Verify consumer receives in order.

---

# 4497 — Partition Test

Verify same aggregate maps to same partition.

---

# 4498 — Retry Test

Inject transient consumer failure.

Verify:

```text
retry
success
no DLQ
```

---

# 4499 — DLQ Test

Inject permanent failure.

Verify:

```text
bounded retry
DLQ
metadata preserved
```

---

# 4500 — Replay Test

Replay historical events.

Verify:

```text
idempotency
no duplicate financial side effect
```

---

# 4501 — Schema Evolution Test

Old consumer processes event with new optional field.

---

# 4502 — Unsupported Major Version Test

Consumer safely routes:

```text
version 2
```

if only v1 supported.

---

# 4503 — Consumer Crash Test

Crash after DB commit before offset commit.

Verify replay becomes no-op via inbox.

---

# 4504 — Outbox Publisher Crash Test

Crash after Kafka publish before marking published.

Verify duplicate publish is safe downstream.

---

# 4505 — Broker Failure Test

Stop one broker.

Verify critical topics remain available if ISR satisfies policy.

---

# 4506 — Kafka Outage Test

Stop cluster/network.

Verify:

```text
business transactions continue where outbox allows
outbox backlog grows
recovery publishes later
```

---

# 4507 — Consumer Lag Test

Slow consumer deliberately.

Verify alert/backlog metrics.

---

# 4508 — Rebalance Test

Scale consumer pods.

Verify:

```text
processing resumes
no side-effect duplication
```

---

# 4509 — Hot Partition Test

Generate skewed keys.

Observe:

```text
partition lag imbalance
```

---

# 4510 — Throughput Test

Measure:

```text
events/sec
MB/sec
producer latency
consumer processing
broker CPU/disk/network
```

---

# 4511 — Large Payload Test

Verify oversized event rejected/controlled before production.

---

# 4512 — Security Test

Verify:

```text
unauthorized producer cannot write
unauthorized consumer cannot read
TLS required
credentials rotated
```

---

# 4513 — Offset Reset Test

In non-production, practice controlled replay.

---

# 4514 — DR Test

Simulate:

```text
cluster loss
restore/recreate topics
replay outbox/replicated data
recover consumers
```

---

# 4515 — Definition of Done: Kafka Topic

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
- [ ] Schema.
- [ ] Monitoring.

---

# 4516 — Definition of Done: Domain Event

- [ ] Past-tense business fact.
- [ ] Producer ownership.
- [ ] Event ID.
- [ ] Version.
- [ ] Aggregate ID/version.
- [ ] Occurred time.
- [ ] Correlation/causation.
- [ ] Minimal payload.
- [ ] Schema registered.
- [ ] Compatibility tested.
- [ ] Consumer impact documented.

---

# 4517 — Definition of Done: Consumer

- [ ] Group ID.
- [ ] Supported event versions.
- [ ] Inbox/business dedupe.
- [ ] Local transaction.
- [ ] Retry classification.
- [ ] Retry limit.
- [ ] DLQ.
- [ ] Lag metrics.
- [ ] Replay behavior.
- [ ] Security ACL.
- [ ] Tests.

---

# 4518 — Definition of Done: Outbox

- [ ] Same local transaction as business change.
- [ ] Unique event ID.
- [ ] Immutable payload.
- [ ] Publisher.
- [ ] Retry.
- [ ] Backlog metric.
- [ ] Cleanup policy.
- [ ] Duplicate publish tested.

---

# 4519 — Definition of Done: DLQ

- [ ] Naming convention.
- [ ] Failure metadata.
- [ ] Retention.
- [ ] Alert.
- [ ] Ownership.
- [ ] Replay procedure.
- [ ] Audit.
- [ ] Idempotency verified before replay.

---

# 4520 — Kafka Architecture Review Checklist

## Topic

- [ ] Owner.
- [ ] Purpose.
- [ ] Key.
- [ ] Partitions.
- [ ] Retention.
- [ ] Cleanup.
- [ ] ACL.
- [ ] Classification.

## Producer

- [ ] `acks=all`.
- [ ] Idempotence.
- [ ] Outbox where DB involved.
- [ ] Schema validation.
- [ ] Trace propagation.

## Consumer

- [ ] Idempotency.
- [ ] Retry.
- [ ] DLQ.
- [ ] Lag monitoring.
- [ ] Replay safety.

---

# 4521 — Schema Review Checklist

- [ ] Stable event name.
- [ ] Event version.
- [ ] Required vs optional clear.
- [ ] No ambiguous units.
- [ ] Time format.
- [ ] Money format.
- [ ] No unnecessary PII.
- [ ] Compatibility mode.
- [ ] Example payload.
- [ ] Semantic change reviewed.

---

# 4522 — Security Review Checklist

- [ ] TLS.
- [ ] Client auth.
- [ ] Topic ACL.
- [ ] Group ACL.
- [ ] Schema registry auth.
- [ ] Secrets externalized.
- [ ] PII minimized.
- [ ] Offset reset restricted.
- [ ] Replay audited.

---

# 4523 — Operations Review Checklist

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

---

# 4524 — Production Readiness Checklist

Before production:

- [ ] Production cluster has HA replication.
- [ ] Critical topics use RF=3 or approved equivalent.
- [ ] `min.insync.replicas` configured.
- [ ] Producers use durable acknowledgements.
- [ ] Topic definitions managed as code.
- [ ] Schemas registered and compatibility checked.
- [ ] Outbox tested.
- [ ] Inbox tested.
- [ ] Duplicate delivery tested.
- [ ] Retry/DLQ tested.
- [ ] Replay tested.
- [ ] Broker failure tested.
- [ ] Consumer lag alerts configured.
- [ ] DLQ alerts configured.
- [ ] Schema incompatibility CI guard enabled.
- [ ] Security ACLs reviewed.
- [ ] Capacity/load test passed.
- [ ] DR procedure reviewed/tested.

---

# 4525 — Initial Implementation Order

Recommended:

```text
1. Kafka cluster environments
2. Topic naming/ownership standard
3. Event envelope
4. Schema Registry
5. Producer standard
6. Consumer standard
7. Topic IaC
8. Security/TLS/ACL
9. Outbox implementation
10. Inbox implementation
11. Retry/DLQ standard
12. Trace propagation
13. Core domain topics
14. Consumer lag dashboards
15. DLQ replay tooling
16. Capacity/load testing
17. DR procedure
```

---

# 4526 — Minimum Viable Kafka Platform

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
Consumer idempotency/inbox
Retry
DLQ
Consumer lag monitoring
TLS/auth/ACL
Replay procedure
Capacity headroom
```

Do not postpone:

```text
consumer idempotency
schema compatibility
outbox
DLQ monitoring
```

---

# 4527 — Kafka Governance

Architecture/platform review should reject:

```text
unowned topics
unversioned events
raw DB-row events as domain contract
PII-heavy payloads
null keys where ordering is required
infinite retries
no DLQ
consumers without idempotency
manual topics/config drift
```

---

# 4528 — Topic Catalog Template

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
Retention:
Cleanup Policy:
Schema Subject:
Data Classification:
SLO:
Runbook:
```

---

# 4529 — Event Catalog Template

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

# 4530 — Consumer Catalog Template

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

# 4531 — Capacity Planning Template

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

# 4532 — Event Design Example: OrderCompleted

Topic:

```text
order.events.v1
```

Key:

```text
order_id
```

Payload may include:

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

only if these facts are part of the event contract.

---

# 4533 — OrderCompleted Consumers

Potential:

```text
loyalty-service
mission-service
notification-service
analytics
integration-service
```

Each independent.

---

# 4534 — Event Design Example: WalletTopUpCompleted

Topic:

```text
wallet.events.v1
```

Key:

```text
wallet_id
```

Payload:

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

# 4535 — WalletTopUpCompleted Consumers

Potential:

```text
mission-service
notification-service
analytics
integration-service
```

---

# 4536 — Event Design Example: MissionCompleted

Topic:

```text
mission.events.v1
```

Key:

```text
customer_id
```

Payload:

```text
mission_id
mission_code
progress_id
customer_id
completed_at
reward_campaign_id optional
```

---

# 4537 — MissionCompleted Consumers

Potential:

```text
loyalty/reward module
notification-service
analytics
```

---

# 4538 — Event Design Example: RewardAssigned

Topic:

```text
loyalty.events.v1
```

Key:

```text
customer_id
```

Payload:

```text
assignment_id
reward_id/code
reward_type
customer_id
claim_expires_at
```

---

# 4539 — RewardAssigned Consumers

Potential:

```text
promotion-service
wallet-service
notification-service
```

depending reward type/fulfillment model.

---

# 4540 — Event Design Example: CouponRedeemed

Topic:

```text
promotion.events.v1
```

Key:

```text
promotion_id
```

or:

```text
customer_id
```

depending ordering needs.

Payload:

```text
coupon_id
promotion_id
customer_id
order_id
discount_amount
currency
redeemed_at
```

---

# 4541 — Event Design Example: PaymentCaptured

Topic:

```text
payment.events.v1
```

Key:

```text
payment_id
```

Payload:

```text
payment_id
order_id
customer_id
amount
currency
provider
captured_at
```

Avoid raw provider secrets/details.

---

# 4542 — Financial Event Protection

Financial topics require:

```text
strict ACL
minimal payload
long-enough retention
consumer idempotency
reconciliation
```

---

# 4543 — Event Sequence Example

Checkout may produce:

```text
OrderCreated
PaymentAuthorized
InventoryReserved
OrderAccepted
PaymentCaptured
```

Do not rely on one global order across topics.

Saga coordinates business correctness.

---

# 4544 — Event Causality

Use:

```text
correlation_id
causation_id
```

to reconstruct workflow.

---

# 4545 — Causation Chain Example

```text
CreateOrder command
  ↓
OrderCreated event
  ↓
NotificationCreated event
```

Each event records what caused it.

---

# 4546 — Kafka Incident Severity

Suggested:

```text
SEV-1:
offline partitions affecting critical topics
cluster unavailable

SEV-2:
critical consumer lag
schema break
outbox backlog threatening SLO

SEV-3:
non-critical DLQ growth
single consumer issue
```

Customize operationally.

---

# 4547 — Broker Maintenance

During maintenance:

```text
one broker at a time
verify ISR
verify leader movement
verify client errors
```

---

# 4548 — Topic Expansion

Before adding partitions:

```text
review key ordering
review consumer parallelism
review skew
update IaC
```

---

# 4549 — Retention Change

Changing retention can permanently delete older events.

Require impact review.

---

# 4550 — Schema Subject Deletion

Avoid deleting production schemas casually.

Consumers may need historical deserialization.

---

# 4551 — Event Replay and Schema History

Retain schema versions long enough to deserialize retained Kafka events.

---

# 4552 — Consumer Deployment

Rolling deploy must support:

```text
old and new event-compatible versions
```

during overlap.

---

# 4553 — Producer Deployment

For breaking transition:

```text
deploy consumer support first
then producer
```

---

# 4554 — Dual-Publish Migration

For major event version:

```text
producer temporarily publishes v1 + v2
```

only if migration plan requires.

Avoid indefinite dual-publish.

---

# 4555 — Dual-Consume Migration

Consumer may temporarily handle:

```text
v1 and v2
```

until producer migration completes.

---

# 4556 — Event Migration Completion

Remove old version only after:

```text
all consumers migrated
retention/replay needs evaluated
observability confirms no v1 traffic
```

---

# 4557 — Consumer Group Versioning

New incompatible consumer behavior may use new:

```text
group ID
```

for controlled replay/migration.

---

# 4558 — Kafka Change Management

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

# 4559 — Event Platform Ownership

Platform team owns:

```text
Kafka cluster
broker configuration
shared security
schema registry platform
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

# 4560 — PART 23 Deliverables

PART 23 produces:

1. Kafka platform purpose and scope.
2. Cluster/environment strategy.
3. Broker/replication guidance.
4. Topic ownership.
5. Topic naming.
6. Topic granularity.
7. Partition strategy.
8. Partition-key rules.
9. Consumer groups.
10. Producer event envelope.
11. Event IDs.
12. Aggregate IDs/versions.
13. Correlation/causation IDs.
14. Event-time semantics.
15. Payload/privacy rules.
16. Schema format guidance.
17. Schema Registry.
18. Compatibility/versioning.
19. Producer configuration.
20. Producer idempotence.
21. Kafka transaction limitations.
22. Outbox pattern.
23. Polling/CDC outbox.
24. Inbox pattern.
25. Consumer offset semantics.
26. Retry classification.
27. Retry topics.
28. Ordering tradeoffs.
29. DLQ architecture.
30. Replay architecture.
31. Retention.
32. Compaction.
33. Ordering guarantees.
34. Exactly-once limitations.
35. Eventual consistency.
36. Consumer handler design.
37. Backpressure/concurrency.
38. Event sourcing distinction.
39. Kafka security.
40. ACL design.
41. Schema Registry security.
42. Data classification.
43. Offset-reset governance.
44. Topic IaC.
45. Capacity planning.
46. Broker/producer/consumer metrics.
47. SLIs/alerts/dashboard.
48. OpenTelemetry tracing.
49. Runbooks.
50. Backup/DR.
51. Spring Kafka standards.
52. Outbox/Inbox implementation standards.
53. Event/Topic/Consumer catalogs.
54. Event design examples.
55. Schema migration rollout.
56. Testing strategy.
57. Broker/load/security/DR tests.
58. Production-readiness checklist.
59. Governance.
60. Platform/service ownership split.

---

# 4561 — Exit Criteria

PART 23 is complete when the team can answer:

### Topic

```text
Who owns each topic and why does it exist?
```

### Partitioning

```text
What is the partition key and what ordering does it guarantee?
```

### Durability

```text
What replication, ISR, and producer acknowledgment settings protect critical events?
```

### Schema

```text
How are event schemas registered, versioned, and protected from breaking changes?
```

### Producer

```text
How does a committed database transaction reliably result in a Kafka event?
```

### Consumer

```text
How does duplicate delivery avoid duplicate business effects?
```

### Retry / DLQ

```text
What failures retry, where do they wait, and when do they move to DLQ?
```

### Replay

```text
How can historical events be replayed without sending duplicate notifications, rewards, or financial effects?
```

### Security

```text
Which service can produce/consume each topic and how are credentials protected?
```

### Operations

```text
How do we monitor broker health, lag, outbox, retry, DLQ, storage, and schema compatibility?
```

### Capacity

```text
Can partitions, brokers, storage, and consumers handle expected peak traffic plus failover headroom?
```

If these answers are clear and tested, Kafka / Event Architecture is ready for production implementation.

---

# 4562 — Handoff to PART 24

PART 24 defines Redis / Caching.

```text
PART 23
Kafka / Event Architecture
      ↓
Durable Asynchronous Event Transport
      ↓
PART 24
Redis / Caching
```

PART 24 will define:

```text
Cache Ownership
Cache-Aside
Read-Through / Write-Through guidance
Key Design
TTL
Versioned Keys
Invalidation
Stampede Protection
Distributed Locking
Rate Limiting
Session / Temporary State
Idempotency Cache boundaries
Redis Cluster
Persistence
Eviction
Hot Keys
Observability
Failure Modes
```

The key separation is:

```text
Kafka
= durable asynchronous event transport

Redis
= fast temporary/derived state and coordination
```

---

# PART 23 — Summary

Kafka is the platform's durable asynchronous communication backbone.

Core publishing path:

```text
Business Transaction
      ↓
Outbox
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
Consumer failure
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

The most important architecture rules are:

```text
Kafka topics have explicit owners.
Domain events are business facts, not database-row changes.
Partition keys reflect required aggregate ordering.
Ordering exists only inside a partition.
Critical producers use durable acknowledgements and replication.
DB + Kafka reliability uses Outbox, not distributed 2PC.
Consumers are idempotent through Inbox and business uniqueness.
At-least-once transport is expected.
Schema compatibility is enforced in CI/Registry.
Retries are bounded.
DLQ is monitored and replayed deliberately.
Replay preserves event identity.
Sensitive data is minimized.
Topic/ACL/schema configuration is managed as code.
Consumer lag and outbox age are first-class operational metrics.
Kafka replication is not a complete backup strategy.
```

The next chapter defines the platform's fast cache and temporary-state architecture:

```text
PART 24 — Redis / Caching
```

---

**End of PART 23 — Kafka / Event Architecture**
