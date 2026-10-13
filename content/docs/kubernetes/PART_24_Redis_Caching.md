---
title: "PART 24 — REDIS / CACHING"
---

# PART 24 — REDIS / CACHING

> **Document Role:** Defines the complete architecture, standards, ownership rules, key design, invalidation model, reliability controls, temporary-state patterns, rate limiting, distributed coordination guidance, observability, testing strategy, and production requirements for Redis and application caching.  
> **Previous Part:** PART 23 — Kafka / Event Architecture  
> **Next Part:** PART 25 — Testing Strategy  
> **Status:** Platform Architecture / Implementation Specification  
> **Primary Stack:** Redis, Java, Spring Boot, PostgreSQL, Kafka, OpenTelemetry, Prometheus, Grafana  
> **Audience:** Backend engineers, software architects, platform engineers, DevOps engineers, SREs, QA engineers, security engineers, technical leads.

---

# 4563 — Purpose

Redis / Caching defines how the platform uses fast, temporary, and derived state safely.

It answers:

```text
What should be cached?
Who owns the cache?
Which data must never depend on Redis for correctness?
How should keys be named?
How long should data live?
How is cache invalidated?
How do we prevent cache stampedes?
How do we handle hot keys?
When may Redis be used for locking or rate limiting?
What happens when Redis is unavailable?
How do we operate Redis in production?
```

The central rule is:

```text
Redis improves speed and coordination.

Redis must not silently become the authoritative
source of truth for critical business state
unless a use case is explicitly designed that way.
```

---

# 4564 — Redis Responsibilities

Redis is suitable for:

```text
Cache
Temporary State
Rate Limiting
Short-Lived Session State
Distributed Coordination
Deduplication Acceleration
Read Projections
Counters
Feature/Configuration Cache
```

Redis is generally not the authoritative owner of:

```text
Wallet balance
Points ledger
Order state
Payment state
Inventory reservation
Promotion redemption
Mission completion
```

Those belong in durable domain storage.

---

# 4565 — Platform Caching Goals

Caching should improve:

```text
latency
database load
external dependency load
throughput
resilience for read-heavy features
```

without compromising:

```text
correctness
security
freshness requirements
recoverability
```

---

# 4566 — Cache Is a Copy

For most platform data:

```text
PostgreSQL / authoritative service
= source of truth

Redis
= copy / projection / acceleration layer
```

If cache disappears:

```text
system must be able to rebuild it
```

unless explicitly documented otherwise.

---

# 4567 — Cache Ownership

Each service owns its own cache keys.

Example:

```text
Catalog Service
→ catalog:* keys

Cart Service
→ cart:* keys

Identity Service
→ identity:* keys

Notification Service
→ notification:* keys
```

---

# 4568 — No Shared Cache Tablespace Semantics

Do not let multiple services directly manipulate the same logical cache record unless there is a deliberate shared platform contract.

Bad:

```text
Order writes Catalog cache
Catalog deletes Order cache
```

Good:

```text
Catalog owns Catalog cache
Order consumes Catalog API/event
```

---

# 4569 — Redis Deployment Ownership

Platform/SRE owns:

```text
Redis infrastructure
HA
backups if configured
monitoring
security baseline
capacity
```

Service teams own:

```text
key semantics
TTL
serialization
invalidation
fallback behavior
```

---

# 4570 — Cache Categories

Main categories:

```text
Reference Data Cache
Query Result Cache
Entity Cache
Computed Result Cache
Session / Temporary State
Rate-Limit State
Coordination State
Idempotency Acceleration
```

---

# 4571 — Reference Data Cache

Examples:

```text
store configuration
catalog metadata
campaign definitions
mission definitions
translation mappings
```

Usually:

```text
read-heavy
low-to-medium change frequency
```

---

# 4572 — Query Result Cache

Examples:

```text
menu by store/channel
customer mission list
customer rewards list
admin summary
```

Key includes relevant query dimensions.

---

# 4573 — Entity Cache

Example:

```text
catalog:product:{product_id}
```

Cache one entity representation.

---

# 4574 — Computed Result Cache

Examples:

```text
effective menu projection
promotion preview candidate set
permission matrix
```

Use only where computation is expensive and staleness acceptable.

---

# 4575 — Session / Temporary State

Examples:

```text
password reset challenge state
temporary device verification
guest cart session mapping
short-lived flow state
```

Durability requirements must be explicit.

---

# 4576 — Rate-Limit State

Redis is well suited for:

```text
per-IP limits
per-user limits
per-device limits
per-operation limits
```

because:

```text
atomic counters
TTL
high throughput
```

---

# 4577 — Coordination State

Possible:

```text
short-lived locks
leader election helper
single-flight marker
```

Use carefully.

Redis coordination must not replace:

```text
database invariants
```

---

# 4578 — Cache-Aside

Recommended default pattern:

```text
Application
   ↓
Check Redis
   ├── HIT → return
   └── MISS
        ↓
      Load authoritative source
        ↓
      Put Redis
        ↓
      return
```

---

# 4579 — Cache-Aside Benefits

Benefits:

```text
simple
service-controlled
cache failure can fall back
only requested data cached
```

---

# 4580 — Cache-Aside Risk

Potential:

```text
stale cache
stampede
race during invalidation
```

Need:

```text
TTL
versioning
invalidation
single-flight where necessary
```

---

# 4581 — Read-Through Cache

Cache layer loads data automatically on miss.

Can simplify code but adds:

```text
cache framework coupling
hidden dependency calls
```

Not required as default.

---

# 4582 — Write-Through Cache

Application writes:

```text
cache + database
```

through cache abstraction.

Risk:

```text
dual-write consistency
```

Avoid unless framework/design explicitly guarantees correct ownership.

---

# 4583 — Write-Behind Cache

Redis accepts writes and database updates later.

Do not use for:

```text
critical financial/business state
```

without an explicit durable architecture.

---

# 4584 — Recommended Default

Use:

```text
database/source-of-truth write
      ↓
commit
      ↓
invalidate/update cache
```

Cache is secondary.

---

# 4585 — Cache Consistency Models

Possible:

```text
Strong-ish Read-After-Write
Eventual
TTL-Based
Version-Keyed
```

Choose per use case.

---

# 4586 — Strong Read-After-Write

For local service:

```text
write DB
commit
delete/update cache
```

Then subsequent reads should fetch fresh data.

---

# 4587 — Eventual Cache Consistency

For event-driven projection:

```text
source change
      ↓
Kafka event
      ↓
consumer invalidates/updates cache
```

Small lag is expected.

---

# 4588 — TTL-Only Consistency

Cache expires after:

```text
fixed time
```

Simplest, but stale until expiry.

Suitable only when:

```text
freshness tolerance is clear
```

---

# 4589 — Versioned Cache Consistency

Use a version token in key.

Example:

```text
menu:store:B001:v42
```

When version changes:

```text
new reads use v43
```

Old key naturally expires.

---

# 4590 — Cache Key Naming

Recommended pattern:

```text
<service>:<domain>:<resource>:<identifier>:<version?>
```

Examples:

```text
catalog:menu:B001:APP:v42
catalog:product:PRD001:v7
loyalty:summary:CUS001
mission:list:CUS001:km
identity:rate:login:ip:HASH
```

---

# 4591 — Key Prefix

Every service gets unique prefix.

Examples:

```text
catalog:
order:
wallet:
loyalty:
mission:
notification:
```

---

# 4592 — Environment Isolation

Use separate Redis environment or prefix/database per environment.

Prefer infrastructure isolation:

```text
DEV
UAT
PROD
```

Do not rely only on key prefix for production/non-production isolation.

---

# 4593 — Key Length

Keep keys:

```text
descriptive
bounded
```

Avoid embedding huge request JSON.

---

# 4594 — Sensitive Data in Key

Do not put:

```text
access token
email
phone
OTP
full card number
```

directly into key.

Use:

```text
internal ID
hash
```

---

# 4595 — User Identifier Hashing

For rate-limit keys based on email/phone:

```text
normalize
hash
```

before key construction when privacy requires.

---

# 4596 — Key Version

Possible:

```text
schema version
content version
menu version
```

Example:

```text
catalog:menu:B001:APP:v5:source:v42
```

Avoid confusing:

```text
cache implementation version
```

with:

```text
business content version
```

---

# 4597 — Serialization

Recommended:

```text
JSON
MessagePack
Protobuf
```

depending performance and interoperability.

Start with:

```text
JSON
```

unless profiling proves need for binary serialization.

---

# 4598 — Serialization Version

Cache payload may include:

```text
schema_version
```

if long TTL or rolling deployment compatibility matters.

---

# 4599 — Java Serialization Warning

Do not use native Java object serialization for shared Redis data.

Reasons:

```text
security
compatibility
class coupling
```

---

# 4600 — TTL

Every cache key should have:

```text
explicit TTL
```

unless deliberately permanent and operationally managed.

---

# 4601 — TTL Selection

Choose based on:

```text
freshness tolerance
source load
change frequency
rebuild cost
memory cost
```

---

# 4602 — Example TTL Categories

Illustrative:

```text
Fast-changing personalized data: 30–60 sec
Menu/customer projection: 1–5 min
Reference configuration: 5–30 min
Static metadata: longer
```

Actual values are service-specific.

---

# 4603 — Existing Menu Cache Example

A known menu architecture may use:

```text
MENU_SOURCE          300 sec
SPECIAL_META         300 sec
FAVORITE              60 sec
LAST_ORDER            60 sec
MENU_META              60 sec
MENU_GUEST_FINAL      300 sec
MENU_USER_FINAL        60 sec
```

The principle is:

```text
shared/static content gets longer TTL
personalized content gets shorter TTL
```

---

# 4604 — TTL Jitter

Avoid mass expiration at exactly same time.

Add small random jitter:

```text
base TTL ± percentage
```

Example:

```text
300 sec ± 10%
```

---

# 4605 — Why TTL Jitter

Without jitter:

```text
thousands of keys expire simultaneously
      ↓
database spike
      ↓
cache stampede
```

---

# 4606 — Cache Invalidation

Hard problem:

```text
when source changes,
cached representation must stop being trusted.
```

Methods:

```text
delete key
version bump
event-driven invalidation
short TTL
```

---

# 4607 — Direct Invalidation

After local write:

```text
delete affected cache key
```

Then next read reloads.

---

# 4608 — Update Cache

Alternative:

```text
write new cache value immediately
```

Risk:

```text
cache update bug diverges from DB
```

Delete-on-write is often simpler.

---

# 4609 — Version Bump

For complex derived cache:

```text
increment content version
```

New key automatically selected.

Old values expire later.

---

# 4610 — Event-Driven Invalidation

Example:

```text
ProductUpdated
      ↓
Catalog cache invalidation consumer
```

Useful for distributed read projections.

---

# 4611 — Invalidation Event Payload

May include:

```text
entity_id
new_version
scope
```

Avoid transmitting full cache data unless projection requires.

---

# 4612 — Cache Dependency Graph

One source change may affect many derived keys.

Example:

```text
Product price changes
      ↓
product cache
menu cache
search cache
store menu cache
```

Document dependency.

---

# 4613 — Broad Invalidation

Avoid:

```text
FLUSHALL
```

or deleting all service keys on every change.

Use targeted invalidation or versioning.

---

# 4614 — Cache Flush

Production cache flush is high-risk.

Require:

```text
permission
reason
impact estimate
rate-aware warm-up
```

---

# 4615 — Cache Warm-Up

After deployment/flush:

```text
preload high-traffic keys
```

where needed.

Avoid warming millions of low-value keys.

---

# 4616 — Lazy Warm-Up

Default:

```text
populate on demand
```

with stampede protection.

---

# 4617 — Cache Stampede

Occurs when:

```text
popular key expires
      ↓
many requests miss
      ↓
all hit database
```

---

# 4618 — Stampede Protection Patterns

Use:

```text
single-flight
distributed short lock
stale-while-revalidate
TTL jitter
pre-warming
```

---

# 4619 — Single-Flight

One application instance/process allows only one load per missing key.

Other callers wait/reuse result.

---

# 4620 — Distributed Single-Flight

Across pods:

```text
SET lock:key value NX PX ttl
```

can allow one refresher.

Use carefully.

---

# 4621 — Lock TTL

Distributed cache refresh lock must have:

```text
short bounded TTL
```

so crashed worker does not block forever.

---

# 4622 — Stale-While-Revalidate

Pattern:

```text
fresh cache → return

soft-expired but hard-valid cache
→ return stale
→ one worker refreshes

hard-expired
→ authoritative load
```

Useful for non-critical read-heavy data.

---

# 4623 — Stale Data Policy

Only use stale response where business permits.

Good:

```text
menu image metadata
store description
```

Bad:

```text
wallet spendable balance
coupon final eligibility
inventory reservation
```

---

# 4624 — Cache Penetration

Occurs when repeated requests for nonexistent IDs always hit DB.

Mitigations:

```text
negative caching
Bloom filter
validation
rate limiting
```

---

# 4625 — Negative Cache

Cache:

```text
NOT_FOUND
```

for a short TTL.

Example:

```text
catalog:product:UNKNOWN → NOT_FOUND, 30 sec
```

---

# 4626 — Negative Cache Risk

If entity is created soon after:

```text
negative cache may hide it briefly
```

Use short TTL or explicit invalidation on create.

---

# 4627 — Hot Key

One Redis key receives very high traffic.

Examples:

```text
global home config
very popular menu
global rate counter
```

---

# 4628 — Hot Key Symptoms

```text
single Redis shard high CPU/network
latency spike
other keys affected
```

---

# 4629 — Hot Key Mitigations

Possible:

```text
local in-process cache
replica reads for safe read-only data
sharded counters
key replication
short local cache
```

---

# 4630 — Local Cache

Use Caffeine/in-memory cache for:

```text
very hot immutable/slow-changing reference data
```

with short TTL.

---

# 4631 — Two-Level Cache

Pattern:

```text
L1 = in-process
L2 = Redis
Source = DB/service
```

Flow:

```text
L1
↓ miss
L2
↓ miss
source
```

---

# 4632 — Two-Level Cache Risk

Invalidation is harder.

Use for:

```text
stable reference data
```

not rapidly changing critical state.

---

# 4633 — Cache Memory

Redis memory is finite.

Every key needs:

```text
expected count
average size
TTL
growth estimate
```

---

# 4634 — Memory Budget

Approximate:

```text
number of keys × average value bytes
+
key overhead
+
Redis object overhead
+
replication/headroom
```

---

# 4635 — Memory Headroom

Do not run Redis at:

```text
~100% memory
```

Maintain headroom for:

```text
traffic spikes
replication
fork/persistence overhead
```

---

# 4636 — maxmemory

Configure:

```text
maxmemory
```

to protect host/container.

---

# 4637 — Eviction Policies

Common:

```text
noeviction
allkeys-lru
allkeys-lfu
volatile-lru
volatile-ttl
```

Choose by workload.

---

# 4638 — Cache Cluster Eviction

For pure cache:

```text
allkeys-lfu
```

or similar may be suitable.

For mixed critical temporary state:

```text
separate Redis deployment
```

may be safer.

---

# 4639 — Avoid Mixed Criticality

Do not put:

```text
rate limits
password reset challenge
large disposable cache
```

into one memory pool without understanding eviction impact.

---

# 4640 — Redis Workload Separation

Possible separate logical/physical Redis:

```text
cache
security/rate-limit
session/temp state
```

depending scale and risk.

---

# 4641 — Database Number

Redis logical DB numbers are not strong isolation.

Prefer:

```text
separate clusters/instances
or clear prefixes + ACLs
```

---

# 4642 — Eviction Safety

If a key may be evicted:

```text
application correctness must survive
```

unless workload is explicitly on no-eviction dedicated Redis.

---

# 4643 — Redis Persistence

Options:

```text
RDB snapshots
AOF
both
none
```

Choice depends on whether Redis contains rebuildable cache or important temporary state.

---

# 4644 — Pure Cache Persistence

For fully rebuildable cache:

```text
persistence may be unnecessary
```

depending restart performance.

---

# 4645 — Temporary Security State Persistence

If Redis holds:

```text
rate-limit events
password reset temporary state
```

decide whether losing state on restart is acceptable.

---

# 4646 — AOF

Append Only File improves durability of Redis changes.

Costs:

```text
disk I/O
recovery time
storage
```

---

# 4647 — RDB

Snapshots provide:

```text
point-in-time Redis state
```

but recent data may be lost between snapshots.

---

# 4648 — Persistence Does Not Make Redis a Ledger

Even with AOF:

```text
Redis should not become wallet/points/payment source of truth.
```

---

# 4649 — Redis HA

Production requires appropriate high availability.

Options:

```text
Redis Sentinel
Redis Cluster
Managed Redis
```

---

# 4650 — Sentinel

Provides:

```text
primary-replica monitoring
automatic failover
```

for non-sharded Redis.

---

# 4651 — Redis Cluster

Provides:

```text
sharding
replication
failover
```

across hash slots.

---

# 4652 — Managed Redis

Cloud-managed Redis may simplify:

```text
failover
patching
backup
monitoring
```

but service limits/pricing must be understood.

---

# 4653 — Redis Cluster Key Slot

Multi-key operations may require same hash slot.

Use hash tags:

```text
{customer:CUS001}:a
{customer:CUS001}:b
```

only when truly needed.

---

# 4654 — Avoid Multi-Key Coupling

Do not design large cross-key transactions across cluster slots.

Prefer:

```text
single-key atomic structures
```

where possible.

---

# 4655 — Redis Transactions

Redis `MULTI/EXEC` gives command grouping but not relational transaction semantics.

Use only for Redis-local atomic needs.

---

# 4656 — Lua Scripts

Lua can provide atomic multi-step Redis operations.

Good for:

```text
rate limiting
compare-and-delete lock
atomic counters
```

Keep scripts:

```text
small
tested
bounded
```

---

# 4657 — Long Lua Script Risk

Redis executes script atomically and blocks other commands.

Never run:

```text
heavy/unbounded loops
```

inside Lua.

---

# 4658 — Distributed Locking

Redis can implement short-lived distributed locks.

Use only when:

```text
occasional coordination
```

not to enforce financial invariants.

---

# 4659 — Lock Command

Typical:

```text
SET resource_lock token NX PX 5000
```

---

# 4660 — Lock Ownership Token

Use unique token.

Release only if:

```text
stored token == caller token
```

via Lua/atomic compare-delete.

---

# 4661 — Lock Expiry

Every distributed lock must expire.

Otherwise crashed owner may deadlock system.

---

# 4662 — Lock Renewal

For long work:

```text
renew lease
```

only if owner still holds token.

Avoid indefinitely extending uncertain lock.

---

# 4663 — Lock Failure

If Redis unavailable:

```text
do not silently assume lock acquired
```

Choose:

```text
fail
fallback to DB lock
skip optional optimization
```

by use case.

---

# 4664 — Database Lock Preferred for Invariants

For:

```text
inventory reservation
wallet debit
coupon usage
reward quantity
```

use:

```text
database atomic update / row lock
```

Redis lock is not primary correctness mechanism.

---

# 4665 — Redlock

Distributed Redlock-style algorithms are controversial for strict correctness assumptions.

For critical invariants:

```text
prefer authoritative DB transaction
```

---

# 4666 — Cache Refresh Lock

Good Redis lock use case:

```text
only one pod refreshes expensive cache
```

If lock fails:

```text
worst effect = extra source load
```

not corrupted money/state.

---

# 4667 — Scheduled Job Lock

Redis may coordinate:

```text
one scheduler task
```

but database `SKIP LOCKED` or Kubernetes leader election may be preferable for durable workflows.

---

# 4668 — Rate Limiting

Redis is well suited for rate limiting.

Algorithms:

```text
Fixed Window
Sliding Window
Sliding Log
Token Bucket
Leaky Bucket
```

---

# 4669 — Fixed Window

Example:

```text
max 10 requests/min
```

Key:

```text
rate:login:user:HASH:202610112030
```

Simple but boundary bursts possible.

---

# 4670 — Sliding Window Counter

Uses current/previous windows or sorted sets for smoother limit.

---

# 4671 — Sliding Log

Stores each event timestamp.

Precise but memory-expensive.

---

# 4672 — Token Bucket

Good for:

```text
steady rate
allowing controlled bursts
```

---

# 4673 — Rate-Limit Dimensions

Possible:

```text
IP
user ID
device ID
identifier hash
endpoint
operation
```

---

# 4674 — Composite Rate Limits

Security flows may enforce:

```text
per identifier
+
per IP
+
global abuse threshold
```

---

# 4675 — Password Reset Rate Limit

Example architecture may enforce:

```text
identifier/15 min
IP/15 min
daily limits
resend cooldown
```

Redis can accelerate limits.

Durable abuse/audit events may still be stored in PostgreSQL.

---

# 4676 — Rate Limit Atomicity

Use:

```text
Lua
INCR + EXPIRE carefully
sorted set script
```

so concurrent requests do not bypass limit.

---

# 4677 — Rate-Limit Response

Return:

```text
429 Too Many Requests
```

with:

```text
retry_after
stable error code
```

where appropriate.

---

# 4678 — Rate-Limit Fail Policy

Security-sensitive endpoint:

```text
fail closed or use local fallback
```

when Redis unavailable.

Low-risk endpoint may:

```text
fail open
```

temporarily.

Document per operation.

---

# 4679 — Cooldown

Simple Redis key:

```text
cooldown:password_reset:{identifier_hash}
```

with TTL.

---

# 4680 — Cross-Identifier Cooldown

If policy says cooldown continues across identifiers for one user/session/device, key dimension must represent the shared subject.

Do not key only by submitted identifier.

---

# 4681 — OTP Attempt Counter

Redis can hold:

```text
attempt count
lockout TTL
```

but verification challenge source-of-truth may remain durable depending security design.

---

# 4682 — Session State

Possible Redis use:

```text
short-lived web session
temporary OAuth state
PKCE state
device challenge
```

---

# 4683 — JWT Sessions

If access tokens are stateless:

```text
Redis is not required for every request
```

May store:

```text
revocation denylist
session metadata
rate limits
```

---

# 4684 — Token Revocation

Redis may accelerate:

```text
revoked jti
session denylist
```

with TTL matching token expiry.

Durable session state remains authoritative in Identity DB where required.

---

# 4685 — Refresh Token State

Do not store only in volatile Redis if security model requires durable:

```text
reuse detection
family revocation
audit
```

PostgreSQL should own it.

---

# 4686 — Idempotency Cache

Redis may cache:

```text
completed idempotency response
```

for fast retries.

But durable business uniqueness belongs in DB for critical operations.

---

# 4687 — Idempotency Key Cache Example

```text
idem:order:create:{key_hash}
```

Value:

```text
status
response reference
request hash
```

---

# 4688 — Idempotency Cache Risk

If Redis evicts the key:

```text
operation could execute again
```

Therefore for critical writes:

```text
DB unique constraint/idempotency table
```

is required.

---

# 4689 — Idempotency Cache Recommended Use

Use Redis as:

```text
L1 acceleration
```

over durable idempotency record.

---

# 4690 — Deduplication Cache

For low-risk event dedupe:

```text
SETNX event ID
```

may help.

But critical event consumers should use durable inbox/business uniqueness.

---

# 4691 — Bloom Filter

Could reduce repeated DB/cache misses for large existence checks.

Use only when:

```text
false positives acceptable
```

Never use Bloom filter to authorize or reject critical operation alone.

---

# 4692 — Counters

Redis supports high-speed counters.

Good:

```text
page views
temporary metrics
rate limits
approximate activity
```

Bad as sole authoritative source:

```text
wallet balance
coupon final usage
reward quantity
```

---

# 4693 — Atomic INCR

`INCR` is atomic per key.

Still:

```text
durability
eviction
business reconciliation
```

must be considered.

---

# 4694 — Leaderboard

Redis sorted set may support:

```text
non-financial leaderboard
ranking
```

if business accepts Redis persistence model.

---

# 4695 — Sorted Set

Useful for:

```text
scheduled jobs
rate windows
ranking
expiry index
```

But PostgreSQL may be preferred for durable workflow scheduling.

---

# 4696 — Pub/Sub

Redis Pub/Sub is:

```text
ephemeral
```

If subscriber is offline:

```text
message lost
```

Do not use as replacement for Kafka for durable domain events.

---

# 4697 — Redis Streams

Redis Streams provide more durable messaging than Pub/Sub.

Current platform standard is:

```text
Kafka for durable cross-service events
```

Avoid running two event platforms without clear need.

---

# 4698 — Key Expiration Events

Redis keyspace notifications are not reliable enough for critical business expiry.

Do not depend on:

```text
key expired event
```

to execute:

```text
payment cancellation
reward expiry
inventory release
```

Use durable scheduler/DB.

---

# 4699 — Cache Invalidation via Kafka

Example:

```text
CatalogUpdated
      ↓
consumer
      ↓
delete catalog cache keys
```

Useful when projections exist across services.

---

# 4700 — Cache Invalidation Ordering

If events arrive out of order:

```text
versioned cache key
```

helps prevent stale update overwriting newer.

---

# 4701 — Cache Write with Version

When updating cache projection:

```text
only write if event_version >= cached_version
```

where meaningful.

---

# 4702 — Cache Race Example

Timeline:

```text
Request A reads old DB value
Request B updates DB + invalidates
Request A writes old value to cache
```

This can reintroduce stale data.

---

# 4703 — Race Mitigation

Options:

```text
versioned keys
short TTL
delayed second delete
compare version
cache after source read with version
```

---

# 4704 — Double Delete Pattern

Possible:

```text
delete cache
update DB
delete cache again after commit
```

Use carefully.

Versioning is often cleaner.

---

# 4705 — Cache Version Field

Source entity may expose:

```text
version
updated_at
```

Cache payload stores it.

---

# 4706 — Menu Cache Architecture

For menu:

```text
source/menu config
      ↓
version
      ↓
Redis menu projection
      ↓
guest/user final cache
```

Personalized layers get shorter TTL.

---

# 4707 — Menu Source Cache

Stores:

```text
shared menu source data
```

Longer TTL.

---

# 4708 — Menu Personalized Cache

Stores:

```text
favorite
last order
user-specific menu
```

Shorter TTL because state changes per user.

---

# 4709 — Guest Final Cache

Guest menu can be more reusable:

```text
store + channel + language + menu version
```

---

# 4710 — User Final Cache

User-specific key includes:

```text
customer ID
store
channel
language
menu version
```

Potentially:

```text
favorite version
last-order version
```

---

# 4711 — Cache Key Cardinality

Personalized caching can create huge key count.

Estimate:

```text
active users × stores × channels × languages
```

before enabling.

---

# 4712 — Personalized Cache Alternative

Cache shared base menu and compute small personalized overlay at request time.

Often more memory-efficient.

---

# 4713 — Catalog Cache Example

Possible keys:

```text
catalog:product:{id}:v{version}
catalog:menu:{store}:{channel}:v{menuVersion}
catalog:categories:v{version}
```

---

# 4714 — Inventory Cache Rule

Inventory may cache advisory availability.

But final:

```text
ReserveInventory
```

must use PostgreSQL authoritative stock state.

---

# 4715 — Inventory Availability Cache

Possible:

```text
inventory:availability:{store}:{stock_item}
```

TTL:

```text
short
```

Use for:

```text
menu badges
UX hints
```

not checkout guarantee.

---

# 4716 — Cart Cache Rule

Cart may use Redis as read acceleration.

Durable cart state may remain PostgreSQL.

If Redis is authoritative for guest carts:

```text
loss semantics must be accepted/documented
```

---

# 4717 — Order Cache Rule

Order detail/list may be cached selectively.

Do not rely on cache for:

```text
state transition decisions
```

Load authoritative order/version.

---

# 4718 — Payment Cache Rule

Avoid caching payment state for decisions that trigger:

```text
capture
refund
```

Use authoritative Payment DB.

---

# 4719 — Wallet Cache Rule

Wallet summary may be cached for display.

But spend/reserve decision must use:

```text
wallet_db transaction
```

---

# 4720 — Loyalty Cache Rule

Cache:

```text
summary
tier
mission/reward list
```

Final points redeem uses authoritative DB.

---

# 4721 — Promotion Cache Rule

Cache:

```text
published promotion definitions
candidate sets
```

Final reservation/redemption uses PostgreSQL usage counters.

---

# 4722 — Mission Cache Rule

Cache:

```text
active mission definitions
customer mission list
```

Progress update remains PostgreSQL-authoritative.

---

# 4723 — Notification Cache Rule

Cache:

```text
template
preference projection
provider config
```

Delivery history remains durable.

---

# 4724 — Identity Cache Rule

Cache:

```text
JWKS
permissions
rate limits
revocation
temporary challenge state
```

Credential/session authoritative state remains durable.

---

# 4725 — JWKS Cache

Services should cache public signing keys by:

```text
kid
```

with:

```text
reasonable refresh
unknown-kid refresh
```

---

# 4726 — Permission Cache

Can cache:

```text
role → permissions
```

but security revocation latency must be understood.

---

# 4727 — Security Cache TTL

Security-sensitive cache should usually be shorter or event-invalidateable.

---

# 4728 — Redis Client

Use production-grade client:

```text
Lettuce
```

is common with Spring Boot.

Configure:

```text
timeouts
pooling if needed
cluster topology refresh
```

---

# 4729 — Client Timeout

Every Redis operation should have:

```text
bounded command timeout
```

Redis latency should not stall request thread indefinitely.

---

# 4730 — Connection Pool

With Lettuce async/reactive client, pooling semantics differ from blocking clients.

Do not over-pool without evidence.

---

# 4731 — Cluster Topology Refresh

Redis Cluster clients should refresh topology:

```text
periodically
on MOVED/ASK signals
```

---

# 4732 — Retry

Redis command retry must be:

```text
bounded
```

and safe for command semantics.

---

# 4733 — Redis Timeout Failure

For cache GET:

```text
treat as cache miss/fallback
```

for non-critical caches.

For rate-limit security:

```text
use defined fail policy
```

---

# 4734 — Circuit Breaker for Redis

May be useful if Redis outage causes every request to wait on timeout.

Open breaker:

```text
skip cache
```

and go directly to source temporarily.

---

# 4735 — Cache Bypass Mode

Operational feature flag:

```text
cache.enabled=false
```

or breaker path.

Use to survive corrupted/unavailable cache.

---

# 4736 — Cache Bypass Risk

Database/source load may spike.

Protect with:

```text
rate limit
connection pool
stale cache if safe
```

---

# 4737 — Redis Failure Mode

If cache unavailable:

```text
system remains correct
```

for cache-only workloads.

Performance may degrade.

---

# 4738 — Redis Restart

Expect:

```text
cold cache
source load spike
```

Use:

```text
warm-up
jitter
single-flight
```

---

# 4739 — Redis Failover

During failover:

```text
short connection errors
role changes
```

clients must reconnect.

---

# 4740 — Replica Lag

If reading from replicas:

```text
stale reads possible
```

Use only when acceptable.

---

# 4741 — Read from Primary

For security/coordination/near-current cache state:

```text
read primary
```

where required.

---

# 4742 — Read from Replica

Possible for:

```text
large read-only cache
```

with accepted eventual consistency.

---

# 4743 — Split-Brain Risk

HA configuration must minimize:

```text
two primaries
conflicting writes
```

Use managed Redis/Cluster/Sentinel correctly.

---

# 4744 — Network Partition

Distributed locks and coordination become especially risky under partition.

Critical invariants stay in DB.

---

# 4745 — Redis Security

Security areas:

```text
TLS
authentication
ACLs
network isolation
secret management
command restrictions
data classification
```

---

# 4746 — TLS

Use Redis TLS where infrastructure supports/production policy requires.

Especially across untrusted/shared networks.

---

# 4747 — Authentication

Use:

```text
ACL username/password
managed IAM/token
```

depending platform.

---

# 4748 — ACL

Limit each service to required key prefix/commands where feasible.

---

# 4749 — Dangerous Commands

Restrict:

```text
FLUSHALL
FLUSHDB
CONFIG
DEBUG
SHUTDOWN
KEYS
```

in production application credentials.

---

# 4750 — KEYS Command

Avoid:

```text
KEYS *
```

in production.

Can block/scan huge keyspace.

Use:

```text
SCAN
```

for operational tooling.

---

# 4751 — SCAN

`SCAN` is incremental but still can create load.

Use bounded operationally.

---

# 4752 — Secret Storage

Redis credentials in:

```text
secret manager
```

not code/config repository.

---

# 4753 — Network Policy

Only approved service namespaces/workloads should connect.

---

# 4754 — Data Encryption

Sensitive temporary data may need:

```text
application-level encryption
```

in addition to TLS depending policy.

---

# 4755 — Token Data

Avoid storing raw:

```text
access tokens
refresh tokens
OTP
```

unless absolutely required.

Prefer:

```text
hash
encrypted value
reference
```

---

# 4756 — Cache Poisoning

Only trusted service code should populate privileged cache.

Validate serialized content before use.

---

# 4757 — Cache Namespace Collision

Strong prefixes prevent services overwriting each other.

---

# 4758 — Cache Deserialization Security

Never deserialize arbitrary polymorphic untrusted classes.

Use:

```text
strict DTO
JSON schema
known types
```

---

# 4759 — Redis Observability

Monitor:

```text
latency
commands/sec
memory
hit ratio
evictions
connections
CPU
network
replication
failovers
```

---

# 4760 — Cache Hit Ratio

Metric:

```text
hits / (hits + misses)
```

per use case.

Global hit ratio alone can hide bad caches.

---

# 4761 — Low Hit Ratio

Possible causes:

```text
TTL too short
key over-specific
cache cardinality high
traffic pattern not reusable
```

May indicate cache is not worth cost.

---

# 4762 — Very High Hit Ratio Warning

High hit ratio is good, but verify:

```text
freshness
invalidation correctness
```

Stale cache can have 100% hit ratio.

---

# 4763 — Eviction Metrics

Monitor:

```text
evicted_keys
```

Unexpected eviction may break:

```text
performance
security state
temporary workflows
```

---

# 4764 — Expired Keys

Monitor:

```text
expired_keys
```

for TTL behavior.

---

# 4765 — Memory Metrics

```text
used_memory
used_memory_rss
maxmemory
fragmentation_ratio
```

---

# 4766 — Fragmentation

High memory fragmentation can consume much more RSS than logical data.

Operational tuning may be needed.

---

# 4767 — Connection Metrics

Monitor:

```text
connected_clients
blocked_clients
rejected_connections
```

---

# 4768 — Command Latency

Track:

```text
GET
SET
EVAL
ZADD
```

latency where relevant.

---

# 4769 — Slow Log

Redis slowlog can reveal expensive commands/scripts.

---

# 4770 — Hot Key Detection

Use:

```text
command stats
sampling
managed Redis tools
```

Avoid exposing sensitive key names broadly.

---

# 4771 — Replication Metrics

Monitor:

```text
replica lag
link status
failover
```

---

# 4772 — Cache Metrics Per Service

Application metrics:

```text
cache_hit_total
cache_miss_total
cache_error_total
cache_load_duration
cache_invalidation_total
```

---

# 4773 — Stampede Metrics

Track:

```text
cache_refresh_lock_contention
source load spike after expiry
```

if significant.

---

# 4774 — Rate-Limit Metrics

```text
rate_limit_allowed_total
rate_limit_blocked_total
rate_limit_redis_error_total
```

---

# 4775 — Redis SLIs

Potential:

```text
P95 command latency
availability
cache hit rate
eviction rate
failover time
```

---

# 4776 — Cache SLO

Cache itself may have lower correctness criticality than DB but outage should not collapse platform due to source overload.

Define:

```text
latency/availability
```

plus:

```text
fallback load capacity
```

---

# 4777 — Alerts

Alert on:

```text
memory > threshold
evictions spike
latency spike
replica down
failover
connection saturation
blocked clients
rate-limit Redis error spike
```

---

# 4778 — Dashboard

Show:

```text
memory
CPU
ops/sec
latency
hit/miss
evictions
connections
replication
failover
hot keys
```

---

# 4779 — Service Cache Dashboard

For major cache:

```text
hit ratio
load time
key count estimate
errors
invalidations
source query volume
```

---

# 4780 — Structured Logging

For cache failures log:

```text
cache_name
operation
result
latency
fallback_used
```

Avoid raw:

```text
sensitive key
payload
token
```

---

# 4781 — Tracing

Cache spans may include:

```text
redis GET
redis SET
cache miss load
```

Sampling may be needed at high volume.

---

# 4782 — Cache Key in Trace

Do not include full high-cardinality/sensitive key by default.

Use:

```text
cache name
resource type
```

---

# 4783 — Redis Runbooks

Required:

```text
Redis unavailable
High latency
Memory exhaustion
Eviction spike
Hot key
Failover
Replication issue
Cache stampede
Corrupted cache
Rate-limit degradation
```

---

# 4784 — Redis Outage Runbook

```text
confirm scope
open cache bypass if safe
monitor source DB load
reduce non-critical traffic
restore Redis
warm critical keys gradually
```

---

# 4785 — Memory Exhaustion Runbook

```text
identify key growth
check TTL missing
check value size
check workload mix
adjust eviction/capacity
clean safe keys
```

Do not `FLUSHALL` as first response.

---

# 4786 — Eviction Spike Runbook

```text
check maxmemory
key cardinality
TTL
new deployment
workload separation
```

---

# 4787 — Hot Key Runbook

```text
identify key
check request source
add L1 cache / sharding / key replication
review architecture
```

---

# 4788 — Stampede Runbook

```text
identify expired hot keys
enable single-flight
increase/jitter TTL
pre-warm
protect source DB
```

---

# 4789 — Corrupted Cache Runbook

```text
identify namespace/version
disable/bypass cache
invalidate affected keys
bump cache schema/version
rebuild
```

---

# 4790 — Rate-Limit Redis Failure Runbook

For security endpoints:

```text
apply predefined fail-closed/local limit
alert security/platform
restore Redis
```

For low-risk endpoints:

```text
temporary fail-open may be allowed
```

---

# 4791 — Backup

For pure cache:

```text
backup may not be required
```

For important temporary state:

```text
persistence/backup may be justified
```

---

# 4792 — Restore

If restored Redis data is stale:

```text
may be worse than empty cache
```

Often safer:

```text
start cold/rebuild
```

for cache-only workload.

---

# 4793 — DR

Define:

```text
Redis rebuild time
failover strategy
cache cold-start impact
security-state implications
```

---

# 4794 — Cross-Region Redis

Use only if latency/DR requirements justify.

Cross-region synchronous Redis for global locks may create complexity.

---

# 4795 — Cache Schema Change

Changing serialized payload structure requires:

```text
versioned key
compatible deserializer
or full invalidation
```

---

# 4796 — Cache Key Version Bump

Example:

```text
MENU_CACHE_VERSION = v5
```

When schema changes:

```text
v5 → v6
```

Old keys naturally become unused.

---

# 4797 — Rolling Deployment

Old/new pods may coexist.

If cache payload incompatible:

```text
use separate key version
```

during deployment.

---

# 4798 — Cache Migration

Do not try to rewrite millions of keys unless necessary.

Prefer:

```text
new versioned namespace
```

---

# 4799 — Testing Strategy

Test:

```text
Cache hit/miss
TTL
Invalidation
Serialization
Versioning
Stampede
Failure fallback
Rate limiting
Locks
Cluster failover
Eviction
Security
Load
```

---

# 4800 — Cache-Aside Test

Verify:

```text
first request → DB + cache
second request → cache
```

---

# 4801 — TTL Test

Verify key expires at expected range including jitter.

---

# 4802 — Invalidation Test

Update source.

Verify:

```text
old cache no longer served
```

---

# 4803 — Versioned Key Test

Bump version.

Verify old key ignored.

---

# 4804 — Cache Race Test

Simulate:

```text
read old
update source
invalidate
old reader tries cache write
```

Verify versioning prevents stale overwrite where required.

---

# 4805 — Stampede Test

Expire one hot key.

Send:

```text
1,000 concurrent requests
```

Verify source load is bounded.

---

# 4806 — Negative Cache Test

Repeated unknown ID should not hammer database.

Creation invalidates negative entry appropriately.

---

# 4807 — Redis Outage Test

Stop Redis.

Verify:

```text
cache-only feature falls back
business correctness remains
```

---

# 4808 — Redis Slow Test

Inject latency.

Verify command timeout/breaker prevents request collapse.

---

# 4809 — Eviction Test

Force memory pressure.

Verify only approved workloads are affected.

---

# 4810 — Security State Eviction Test

If rate/security state shares Redis, test what happens when key evicted.

This often proves need for separate deployment/noeviction policy.

---

# 4811 — Rate-Limit Test

Test:

```text
below threshold
at threshold
over threshold
concurrent requests
TTL reset
multiple dimensions
```

---

# 4812 — Cooldown Test

Verify cooldown persists across relevant identifiers/subject dimensions.

---

# 4813 — Distributed Lock Test

Test:

```text
one winner
timeout
owner crash
wrong owner cannot release
lock expiry
```

---

# 4814 — Lock Safety Test

Prove critical business invariants do not rely solely on Redis lock.

---

# 4815 — Cluster Failover Test

Fail primary.

Verify client reconnects and behavior matches expected consistency.

---

# 4816 — Replica Lag Test

If replica reads enabled, verify stale-read tolerance.

---

# 4817 — Hot Key Load Test

Send extreme reads to one key.

Measure:

```text
shard CPU
latency
network
```

---

# 4818 — Memory Load Test

Populate realistic:

```text
key count
value size
TTL distribution
```

Measure memory overhead.

---

# 4819 — Serialization Compatibility Test

Old/new application versions must not crash reading cache during rolling deploy.

---

# 4820 — Security Tests

Verify:

```text
service cannot access unauthorized keyspace
TLS/auth required
dangerous commands blocked
secrets absent from logs
```

---

# 4821 — Definition of Done: Cache

- [ ] Source of truth identified.
- [ ] Cache owner identified.
- [ ] Key pattern defined.
- [ ] TTL defined.
- [ ] Freshness tolerance defined.
- [ ] Invalidation defined.
- [ ] Failure fallback defined.
- [ ] Stampede strategy.
- [ ] Metrics.
- [ ] Tests.

---

# 4822 — Definition of Done: Rate Limit

- [ ] Subject dimensions defined.
- [ ] Algorithm chosen.
- [ ] Threshold/window defined.
- [ ] Atomic implementation.
- [ ] Fail-open/closed policy.
- [ ] 429 contract.
- [ ] Metrics.
- [ ] Security review.
- [ ] Tests.

---

# 4823 — Definition of Done: Distributed Lock

- [ ] Lock use case justified.
- [ ] Not enforcing critical financial invariant.
- [ ] Unique owner token.
- [ ] TTL.
- [ ] Atomic release.
- [ ] Crash behavior.
- [ ] Fallback.
- [ ] Tests.

---

# 4824 — Cache Architecture Review Checklist

## Ownership

- [ ] Source of truth is explicit.
- [ ] Cache owner is explicit.
- [ ] No cross-service cache writes.
- [ ] Redis not silently authoritative.

## Freshness

- [ ] TTL.
- [ ] Invalidation.
- [ ] Versioning.
- [ ] Stale-read policy.

## Reliability

- [ ] Cache miss behavior.
- [ ] Redis-down behavior.
- [ ] Stampede protection.
- [ ] Memory/eviction policy.

---

# 4825 — Key Design Review Checklist

- [ ] Prefix.
- [ ] Resource.
- [ ] Identifier.
- [ ] Version.
- [ ] Language/store/channel dimensions.
- [ ] No sensitive raw data.
- [ ] Cardinality estimated.
- [ ] TTL present.

---

# 4826 — Security Review Checklist

- [ ] TLS/auth.
- [ ] ACL/keyspace isolation.
- [ ] Dangerous commands restricted.
- [ ] Sensitive values encrypted/hashed where needed.
- [ ] No raw token/OTP logging.
- [ ] Security rate-limit fail policy.
- [ ] Secret rotation.

---

# 4827 — Operations Review Checklist

- [ ] Memory.
- [ ] Evictions.
- [ ] Hit ratio.
- [ ] Latency.
- [ ] Connections.
- [ ] Replication.
- [ ] Failover.
- [ ] Hot keys.
- [ ] Runbooks.
- [ ] Capacity headroom.

---

# 4828 — Production Readiness Checklist

Before production:

- [ ] Redis HA configured.
- [ ] Client timeouts configured.
- [ ] Cache namespaces standardized.
- [ ] TTLs reviewed.
- [ ] Versioned keys used for incompatible payload changes.
- [ ] Invalidation tested.
- [ ] Stampede test passed.
- [ ] Redis outage fallback tested.
- [ ] Memory/eviction policy reviewed.
- [ ] Security/rate-limit workloads isolated where required.
- [ ] Dangerous commands blocked.
- [ ] Redis credentials externalized.
- [ ] Monitoring/alerts configured.
- [ ] Failover tested.
- [ ] Cold-start/source-load impact tested.
- [ ] Runbooks available.

---

# 4829 — Initial Implementation Order

Recommended:

```text
1. Redis environments/HA
2. Key naming standard
3. Cache abstraction
4. Client timeout/fallback standard
5. Catalog/menu cache
6. Versioned cache keys
7. Cache metrics
8. Stampede protection
9. Identity/rate-limit Redis
10. Session/temp-state rules
11. Loyalty/Mission read caches
12. Promotion definition cache
13. L1/L2 cache only where justified
14. Operational runbooks
15. Load/failover tests
```

---

# 4830 — Minimum Viable Redis Standard

Every Redis use case must define:

```text
owner
source of truth
key
TTL
serialization
failure behavior
invalidation
security
observability
```

Critical principles:

```text
Cache must be disposable.
Critical writes remain durable.
Rate limits are atomic.
Locks are bounded.
Eviction behavior is understood.
```

---

# 4831 — Redis Governance

Architecture review should reject:

```text
no-TTL cache keys without justification
shared unowned keyspaces
raw secrets in keys
Redis-only wallet/inventory state
unbounded KEYS usage
critical workflow depending on key-expiry notification
distributed lock used as only financial invariant
```

---

# 4832 — Cache Catalog

Maintain:

```text
Cache Name
Owner
Key Pattern
Source of Truth
TTL
Invalidation
Expected Cardinality
Value Size
Failure Mode
Data Classification
```

---

# 4833 — Example Cache Catalog Entry: Catalog Menu

```text
Name:
Catalog Menu

Owner:
Catalog Service

Key:
catalog:menu:{store}:{channel}:v{menuVersion}

Source:
catalog_db

TTL:
5 minutes + jitter

Invalidation:
menu publication/version change

Failure:
load from PostgreSQL

Classification:
INTERNAL
```

---

# 4834 — Example Cache Catalog Entry: User Mission List

```text
Name:
User Mission List

Owner:
Mission Service

Key:
mission:list:{customer_id}:{language}

Source:
mission_db

TTL:
short

Invalidation:
progress/completion/reward status change

Failure:
load from PostgreSQL

Classification:
CONFIDENTIAL
```

---

# 4835 — Example Rate-Limit Catalog Entry

```text
Name:
Password Reset Rate Limit

Owner:
Identity Service

Key:
identity:rate:password_reset:{subject_hash}

Source:
Redis counter + durable security events as required

TTL:
window-based

Failure:
security-defined fail policy

Classification:
RESTRICTED
```

---

# 4836 — Example Cache Catalog Entry: JWKS

```text
Name:
Identity JWKS

Owner:
Consuming Service

Key:
identity:jwks:{kid}

Source:
Identity JWKS endpoint

TTL:
bounded

Invalidation:
unknown kid / rotation refresh

Failure:
refresh from Identity
```

---

# 4837 — Cache Decision Tree

Before adding cache ask:

```text
Is the source actually slow?
Is the traffic repeated?
Is staleness acceptable?
Can invalidation be defined?
Can we estimate memory?
Can the system survive cache loss?
```

If not:

```text
do not add Redis merely because it exists.
```

---

# 4838 — When Not to Cache

Avoid caching when:

```text
data changes constantly
each query is unique
source is already fast
memory cost exceeds saved work
staleness causes correctness risk
```

---

# 4839 — Measure Before Caching

Capture baseline:

```text
DB query latency
request rate
CPU
I/O
P95/P99
```

Then verify cache improves the real bottleneck.

---

# 4840 — Cache Effectiveness

A useful cache should demonstrate:

```text
reduced source load
reduced latency
acceptable memory
acceptable staleness
```

---

# 4841 — Cache Cost

Include:

```text
Redis infrastructure
engineering complexity
invalidation bugs
cold-start behavior
observability
```

Caching is not free.

---

# 4842 — Redis and PART 25

Testing strategy must cover:

```text
Redis unavailable
stale cache
race
stampede
eviction
failover
```

in integration and resilience tests.

---

# 4843 — Redis and Kubernetes

Later Kubernetes architecture will define:

```text
network policy
secret injection
resource limits
health behavior
```

for Redis clients.

---

# 4844 — Redis and Observability

PART 31 will expand:

```text
cache metrics
Redis infrastructure metrics
tracing
dashboards
alerts
```

---

# 4845 — Redis and Security Hardening

PART 35 will expand:

```text
TLS
ACLs
secret rotation
network isolation
dangerous command restrictions
```

---

# 4846 — Redis and DR

PART 36 will expand backup/DR requirements.

---

# 4847 — PART 24 Deliverables

PART 24 produces:

1. Redis scope and ownership rules.
2. Cache categories.
3. Cache-aside default pattern.
4. Read/write-through guidance.
5. Source-of-truth principle.
6. Consistency models.
7. Key naming.
8. Environment isolation.
9. Sensitive-key guidance.
10. Serialization rules.
11. TTL strategy.
12. TTL jitter.
13. Invalidation strategies.
14. Versioned cache keys.
15. Cache dependency graph.
16. Warm-up guidance.
17. Stampede protection.
18. Single-flight.
19. Stale-while-revalidate.
20. Negative caching.
21. Hot-key mitigation.
22. L1/L2 caching.
23. Memory planning.
24. Eviction policy.
25. Workload separation.
26. Persistence guidance.
27. Redis HA/Cluster/Sentinel.
28. Lua/transactions.
29. Distributed locking.
30. Rate limiting.
31. Password-reset/cooldown guidance.
32. Session/token cache boundaries.
33. Idempotency cache boundaries.
34. Counter/Bloom filter guidance.
35. Pub/Sub/Streams boundaries.
36. Key-expiry warning.
37. Event-driven invalidation.
38. Cache-race handling.
39. Service-specific cache rules.
40. Redis client/timeouts.
41. Failure/bypass behavior.
42. Security/TLS/ACL.
43. Metrics/SLIs.
44. Alerts/dashboard.
45. Logging/tracing.
46. Runbooks.
47. Backup/DR guidance.
48. Cache schema/version migration.
49. Testing strategy.
50. Load/failover/security tests.
51. Review checklists.
52. Production readiness.
53. Redis governance.
54. Cache catalog templates.
55. Cache decision framework.

---

# 4848 — Exit Criteria

PART 24 is complete when the team can answer:

### Ownership

```text
What is the authoritative source behind every cache?
```

### Key Design

```text
What is the key format, TTL, version, and expected cardinality?
```

### Freshness

```text
How does a source update invalidate or supersede stale cache?
```

### Correctness

```text
What happens if Redis loses every key right now?
```

### Stampede

```text
How is the source protected when a hot cache entry expires?
```

### Rate Limiting

```text
How are security limits enforced atomically and what happens if Redis is down?
```

### Locking

```text
Is Redis coordination only an optimization, or is a critical invariant incorrectly relying on it?
```

### Capacity

```text
Can memory, key count, value size, eviction, and hot-key load be supported with headroom?
```

### Security

```text
Are Redis access, credentials, ACLs, sensitive values, and dangerous commands controlled?
```

### Operations

```text
How do we detect high latency, memory pressure, eviction, hot keys, replica failure, and cache stampedes?
```

If these answers are clear and tested, Redis / Caching architecture is ready for implementation.

---

# 4849 — Handoff to PART 25

PART 25 defines Testing Strategy.

```text
PART 24
Redis / Caching
      ↓
Failure / Race / Cache Behavior
      ↓
PART 25
Testing Strategy
```

PART 25 will define:

```text
Testing Pyramid
Unit Tests
Domain Tests
Application Tests
Integration Tests
Testcontainers
Contract Tests
Kafka Tests
Database Tests
Security Tests
Concurrency Tests
Saga Tests
End-to-End Tests
Performance Tests
Chaos / Failure Tests
Test Data
CI Quality Gates
Coverage Philosophy
```

The key transition is:

```text
PARTS 08–24
define implementation architecture.

PART 25
defines how we prove that architecture behaves correctly.
```

---

# PART 24 — Summary

Redis is a high-speed acceleration and temporary-state platform.

Default cache flow:

```text
Request
  ↓
Redis
 ├── HIT
 │    ↓
 │  Response
 │
 └── MISS
      ↓
   Authoritative Source
      ↓
   Populate Cache
      ↓
   Response
```

Write flow:

```text
Update Authoritative Source
      ↓
Commit
      ↓
Invalidate / Version Cache
```

Critical correctness remains outside Redis:

```text
Wallet
Inventory
Payment
Promotion redemption
Mission completion
Order transitions
```

The most important architecture rules are:

```text
Every cache has a clear owner and source of truth.
Redis cache is disposable.
Every cache key has a deliberate TTL or explicit exception.
Versioned keys simplify incompatible cache changes.
Personalized caches use shorter TTLs and careful cardinality.
TTL jitter and single-flight prevent stampedes.
Negative cache can protect repeated misses.
Hot keys require dedicated mitigation.
Rate limits use atomic Redis operations.
Critical idempotency still requires durable business uniqueness.
Redis locks are not the only protection for financial/business invariants.
Redis Pub/Sub is not a Kafka replacement.
Key-expiry notifications are not business workflow triggers.
Redis failure must degrade performance, not correctness, for cache workloads.
Security, memory, eviction, failover, and source-load fallback are tested before production.
```

The next chapter defines the verification strategy for the entire system:

```text
PART 25 — Testing Strategy
```

---

**End of PART 24 — Redis / Caching**
