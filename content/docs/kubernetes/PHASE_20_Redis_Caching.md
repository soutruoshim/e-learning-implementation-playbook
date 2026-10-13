---
title: "PHASE 20 — Redis / Caching"
---

# PHASE 20 — Redis / Caching

> **Purpose:** Implement the platform Redis and application-caching standard for fast, temporary, derived, and coordination state without allowing Redis to silently become the authoritative source of critical business truth. This phase defines cache ownership, cache-aside, key naming, serialization, TTLs, versioning, invalidation, stampede protection, negative caching, hot-key mitigation, memory/eviction planning, workload separation, Redis HA, distributed locks, atomic rate limiting, session/temporary state, idempotency acceleration, service-specific cache rules, client/fallback behavior, security, observability, testing, runbooks, governance, and production readiness.
>
> **Previous Phase:** Phase 19 — Integration / Anti-Corruption Layer
>
> **Next Phase:** Phase 21 — Testing
>
> **Primary Architecture Basis:** PART 24 — Redis / Caching, supported by completed phases for Identity, Catalog, Inventory, Cart, Ordering, Payment, Wallet, Loyalty, Promotion, Mission, Notification, Service Communication, Kafka/Event Architecture, and Integration/ACL.
>
> **Primary Stack:** Redis, Java, Spring Boot, Lettuce, PostgreSQL, Kafka, OpenTelemetry, Prometheus, Grafana.
>
> **Status:** Platform Implementation Specification

---

# 1. Phase 20 Goal

Build a production-ready Redis standard that can answer:

```text
What is cached?
Who owns each key?
What is the source of truth?
What is the key format?
How long does it live?
How is it invalidated?
Can stale data be served?
What happens when Redis is unavailable?
How is stampede prevented?
Can this workload be evicted?
How are rate limits enforced atomically?
Can this lock safely fail?
How is memory/capacity planned?
How is the cache rebuilt after loss?
```

---

# 2. Central Rule

```text
Redis improves speed and coordination.

Redis must not silently become
the authoritative source of truth
for critical business state.
```

---

# 3. Redis Suitable Responsibilities

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
Feature / Configuration Cache
```

---

# 4. Redis Is Generally Not Authoritative For

```text
Wallet balance
Points ledger
Order state
Payment state
Inventory reservation
Promotion redemption
Mission completion
```

These remain in durable domain storage.

---

# 5. Cache Is a Copy

Default:

```text
PostgreSQL / authoritative service
= source of truth

Redis
= copy / projection / acceleration
```

---

# 6. Redis Loss Test

For every cache ask:

```text
If every Redis key disappears now,
does business correctness remain intact?
```

For cache-only workloads:

```text
YES
```

must be the answer.

---

# 7. Cache Ownership

Each service owns its logical cache namespace.

Examples:

```text
catalog:*
cart:*
identity:*
inventory:*
loyalty:*
mission:*
notification:*
promotion:*
```

---

# 8. No Cross-Service Cache Mutation

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

# 9. Platform vs Service Ownership

Platform/SRE owns:

```text
Redis infrastructure
HA
capacity
security baseline
monitoring
backup/persistence where configured
```

Service teams own:

```text
key semantics
TTL
serialization
invalidation
fallback behavior
data classification
```

---

# 10. Cache Categories

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

# 11. Reference Data Cache

Examples:

```text
store configuration
catalog metadata
promotion definitions
mission definitions
translation mappings
```

Typical:

```text
read-heavy
low/medium change frequency
```

---

# 12. Query Result Cache

Examples:

```text
menu by store/channel
customer mission list
customer rewards list
admin summary
```

Key must include relevant query dimensions.

---

# 13. Entity Cache

Example:

```text
catalog:product:{product_id}
```

Stores one entity representation.

---

# 14. Computed Result Cache

Examples:

```text
effective menu projection
promotion candidate set
permission matrix
```

Use only when:

```text
computation is expensive
and
staleness is acceptable
```

---

# 15. Temporary State

Examples:

```text
password reset challenge state
device verification
guest cart mapping
temporary OAuth/PKCE state
short-lived flow state
```

Durability requirements must be explicit.

---

# 16. Rate-Limit State

Redis is well suited to:

```text
per IP
per user
per device
per identifier
per endpoint
per operation
```

because it provides atomic operations + TTL.

---

# 17. Coordination State

Possible:

```text
short-lived refresh lock
leader helper
single-flight marker
```

Use carefully.

---

# 18. Database Invariants Remain Primary

Redis coordination does not replace:

```text
unique constraints
row locks
atomic DB updates
version checks
transactional invariants
```

---

# 19. Default Cache Pattern

Use:

```text
CACHE-ASIDE
```

as the platform default.

---

# 20. Cache-Aside Flow

```text
Request
   ↓
Redis GET
   ├── HIT → return
   └── MISS
        ↓
      authoritative source
        ↓
      populate Redis
        ↓
      return
```

---

# 21. Cache-Aside Benefits

```text
simple
service-controlled
only requested data cached
Redis failure can fall back
```

---

# 22. Cache-Aside Risks

```text
stale data
stampede
invalidation race
cache penetration
```

Mitigate deliberately.

---

# 23. Read-Through

May be used through a framework, but is not required as default.

Risks:

```text
hidden source loads
cache-framework coupling
```

---

# 24. Write-Through

Risk:

```text
database + cache dual-write consistency
```

Avoid as default unless explicitly designed.

---

# 25. Write-Behind

Do not use Redis write-behind as the authoritative path for:

```text
financial state
stock
redemption
order transitions
reward assignment
```

without a separate durable architecture.

---

# 26. Default Write Flow

```text
write authoritative DB
      ↓
commit
      ↓
invalidate / version cache
```

Redis remains secondary.

---

# 27. Cache Consistency Models

Possible:

```text
Strong-ish Read-After-Write
Eventual
TTL-Based
Version-Keyed
```

Choose per cache.

---

# 28. Strong-ish Read-After-Write

Local-service pattern:

```text
write DB
commit
delete/update cache
```

Subsequent reads reload fresh source.

---

# 29. Eventual Cache Consistency

Pattern:

```text
source update
      ↓
Kafka event
      ↓
cache invalidation/update consumer
```

Small lag is expected.

---

# 30. TTL-Only Consistency

Use only where:

```text
known stale window is acceptable
```

---

# 31. Version-Keyed Consistency

Example:

```text
catalog:menu:B001:APP:v42
```

When version changes:

```text
v43 becomes current
v42 expires naturally
```

---

# 32. Key Naming Standard

Recommended:

```text
<service>:<domain>:<resource>:<identifier>:<dimensions>:<version?>
```

---

# 33. Key Examples

```text
catalog:menu:B001:APP:v42
catalog:product:PRD001:v7
loyalty:summary:CUS001
mission:list:CUS001:km
identity:rate:login:ip:{hash}
```

---

# 34. Service Prefix

Every service receives a unique prefix.

Examples:

```text
identity:
catalog:
inventory:
cart:
order:
payment:
wallet:
promotion:
loyalty:
mission:
notification:
integration:
```

---

# 35. Environment Isolation

Prefer physical/infrastructure isolation between:

```text
DEV
UAT
PROD
```

Do not rely solely on a key prefix to separate production from non-production.

---

# 36. Redis Logical DB Warning

Redis logical database numbers are not strong isolation.

Prefer:

```text
separate instances/clusters
or
prefix + ACL isolation
```

---

# 37. Key Length

Keys should be:

```text
descriptive
bounded
predictable
```

Avoid embedding large JSON/query payloads.

---

# 38. Sensitive Data in Keys

Do not put raw:

```text
email
phone
access token
OTP
full card number
password reset token
```

into key names.

---

# 39. Sensitive Identifier Keys

For email/phone-driven rate limits:

```text
normalize
hash
use hash in key
```

---

# 40. Key Version Types

Distinguish:

```text
cache schema version
business content version
entity version
menu publication version
```

Do not mix their meanings.

---

# 41. Versioned Menu Key Example

```text
catalog:menu:B001:APP:cache:v6:content:v42
```

---

# 42. Serialization Default

Start with:

```text
JSON
```

unless profiling proves binary serialization is beneficial.

---

# 43. Alternative Serialization

Possible:

```text
MessagePack
Protobuf
```

where justified.

---

# 44. No Native Java Serialization

Do not use native Java object serialization.

Reasons:

```text
security
class coupling
compatibility
rolling deploy risk
```

---

# 45. Cache Payload Schema Version

For long-lived values:

```json
{
  "schema_version": 2
}
```

may be included.

---

# 46. Rolling Deployment Compatibility

Old/new application pods must safely coexist.

If payload is incompatible:

```text
use new key version
```

---

# 47. TTL Rule

Every cache key should have:

```text
explicit TTL
```

unless permanent behavior is intentionally documented and operationally managed.

---

# 48. TTL Selection Inputs

Choose based on:

```text
freshness tolerance
change frequency
source load
rebuild cost
memory cost
personalization
security sensitivity
```

---

# 49. Illustrative TTL Categories

Source examples:

```text
fast-changing personalized data: 30–60 sec
menu/customer projection: 1–5 min
reference configuration: 5–30 min
static metadata: longer
```

These are examples, not mandatory values.

---

# 50. Existing Menu Cache Example

Known menu TTLs:

```text
MENU_SOURCE       300 sec
SPECIAL_META      300 sec
FAVORITE           60 sec
LAST_ORDER         60 sec
MENU_META           60 sec
MENU_GUEST_FINAL   300 sec
MENU_USER_FINAL     60 sec
```

---

# 51. Menu TTL Principle

```text
shared/static content → longer TTL
personalized content → shorter TTL
```

---

# 52. TTL Jitter

Add jitter:

```text
base TTL ± percentage
```

Example:

```text
300 sec ± 10%
```

---

# 53. Why TTL Jitter

Without jitter:

```text
many keys expire together
      ↓
many cache misses
      ↓
database/source spike
```

---

# 54. Cache Invalidation Strategies

Use one or more:

```text
delete key
version bump
event-driven invalidation
short TTL
```

---

# 55. Direct Invalidation

After local DB commit:

```text
delete affected cache key
```

---

# 56. Update-In-Place Cache

Possible but riskier:

```text
write new cache value immediately
```

because cache-update bugs can diverge from DB.

Delete-on-write is simpler.

---

# 57. Version Bump

For complex derived caches:

```text
increment business/content version
```

New readers use new namespace/key.

---

# 58. Kafka Invalidation

Example:

```text
ProductUpdated
      ↓
Catalog invalidation consumer
      ↓
delete/version affected cache
```

---

# 59. Invalidation Event Payload

May include:

```text
entity_id
new_version
scope
```

Avoid sending entire cache payload unless projection genuinely needs it.

---

# 60. Cache Dependency Graph

Document dependencies.

Example:

```text
Product price change
      ↓
product entity cache
menu projection
search projection
store menu
```

---

# 61. No Broad Flush

Avoid:

```text
FLUSHALL
FLUSHDB
delete entire service prefix
```

for normal business changes.

---

# 62. Production Cache Flush

High-risk operation.

Require:

```text
permission
reason
impact estimate
source-load estimate
warm-up plan
```

---

# 63. Warm-Up

After deploy/flush:

```text
preload only important high-traffic keys
```

if necessary.

---

# 64. Lazy Warm-Up Default

Default:

```text
load on demand
```

with stampede protection.

---

# 65. Cache Stampede

Occurs:

```text
popular key expires
      ↓
many concurrent misses
      ↓
all call source
```

---

# 66. Stampede Mitigations

```text
single-flight
distributed refresh lock
stale-while-revalidate
TTL jitter
pre-warming
```

---

# 67. Local Single-Flight

Within one application process:

```text
one source load per missing key
```

Other callers wait/reuse result.

---

# 68. Distributed Single-Flight

Across pods:

```text
SET cache:refresh:{key_hash} {token} NX PX {ttl}
```

only one pod refreshes.

---

# 69. Refresh Lock TTL

Must be:

```text
short
bounded
```

to prevent permanent blockage after crash.

---

# 70. Stale-While-Revalidate

```text
fresh
→ serve

soft expired but hard-valid
→ serve stale
→ one refresher

hard expired
→ source load
```

---

# 71. Safe Stale Examples

Good:

```text
menu image metadata
store description
static reference content
```

---

# 72. Unsafe Stale Examples

Bad:

```text
wallet spendable balance
coupon final eligibility
inventory reservation
payment capture state
```

---

# 73. Cache Penetration

Repeated request for nonexistent IDs may hammer DB.

Mitigations:

```text
negative cache
validation
rate limiting
Bloom filter where appropriate
```

---

# 74. Negative Cache

Example:

```text
catalog:product:UNKNOWN
→ NOT_FOUND
TTL = 30 sec
```

---

# 75. Negative Cache Creation Race

If entity is created while negative cache exists:

```text
explicitly invalidate on create
```

or use a very short TTL.

---

# 76. Hot Key

One key receives extreme traffic.

Examples:

```text
global home config
popular menu
global rate counter
```

---

# 77. Hot-Key Symptoms

```text
single shard high CPU
single shard network saturation
latency spike
unrelated keys affected
```

---

# 78. Hot-Key Mitigations

Possible:

```text
L1 in-process cache
replica reads for safe data
sharded counters
key replication
short local cache
```

---

# 79. L1 Cache

Use Caffeine/in-process cache for:

```text
very hot immutable or slow-changing reference data
```

with short TTL.

---

# 80. Two-Level Cache

```text
L1 = process memory
L2 = Redis
Source = DB/service
```

---

# 81. Two-Level Cache Risk

Invalidation becomes harder.

Use for:

```text
stable reference data
```

not critical rapidly changing state.

---

# 82. Memory Planning

Every cache defines:

```text
expected key count
average value size
TTL
growth estimate
peak multiplier
```

---

# 83. Approximate Memory Formula

```text
key count × average payload size
+
key/object overhead
+
allocator fragmentation
+
replication
+
operational headroom
```

---

# 84. Memory Headroom

Do not plan at ~100% memory.

Reserve for:

```text
traffic spikes
replication
persistence fork overhead
fragmentation
failover
```

---

# 85. maxmemory

Set:

```text
maxmemory
```

to prevent Redis consuming unbounded host/container memory.

---

# 86. Eviction Policies

Common:

```text
noeviction
allkeys-lru
allkeys-lfu
volatile-lru
volatile-ttl
```

---

# 87. Pure Cache Eviction

For disposable cache workload:

```text
allkeys-lfu
```

or similar may be suitable.

---

# 88. Mixed-Criticality Warning

Do not mix:

```text
huge disposable menu cache
password reset challenge
security rate-limit state
```

without explicitly understanding eviction behavior.

---

# 89. Workload Separation

Potential dedicated Redis workloads:

```text
CACHE
SECURITY_RATE_LIMIT
SESSION_TEMP_STATE
```

depending scale/risk.

---

# 90. Security Redis

Security workload may prefer:

```text
noeviction
```

or dedicated capacity depending fail policy.

---

# 91. Eviction Safety Rule

If a key can be evicted:

```text
application must survive its disappearance
```

unless using an explicitly dedicated no-eviction design.

---

# 92. Redis Persistence Options

```text
RDB
AOF
RDB + AOF
none
```

---

# 93. Pure Cache Persistence

For fully rebuildable cache:

```text
persistence may be unnecessary
```

depending cold-start impact.

---

# 94. Security/Temporary State Persistence

If losing state on restart is unacceptable:

```text
AOF/RDB/durable DB fallback
```

must be considered.

---

# 95. AOF

Benefits:

```text
better change durability
```

Costs:

```text
disk I/O
storage
recovery time
```

---

# 96. RDB

Provides point-in-time snapshot.

Recent state since last snapshot may be lost.

---

# 97. Persistence Does Not Make Redis a Ledger

Even with AOF:

```text
Redis != Wallet ledger
Redis != Points ledger
Redis != Payment source of truth
```

---

# 98. Production HA

Use appropriate:

```text
Redis Sentinel
Redis Cluster
Managed Redis
```

---

# 99. Sentinel

Suitable for:

```text
primary/replica monitoring
automatic failover
non-sharded topology
```

---

# 100. Redis Cluster

Provides:

```text
sharding
replication
failover
hash slots
```

---

# 101. Managed Redis

May simplify:

```text
patching
backup
monitoring
failover
```

but limits/cost must be understood.

---

# 102. Redis Cluster Hash Slots

Multi-key atomic operations may require same slot.

Hash tag example:

```text
{customer:CUS001}:a
{customer:CUS001}:b
```

Use only when needed.

---

# 103. Avoid Cross-Slot Coupling

Prefer:

```text
single-key atomic structure
```

over complex cross-slot transactions.

---

# 104. Redis Transactions

`MULTI/EXEC` provides Redis command grouping.

It is not relational ACID across Redis + PostgreSQL.

---

# 105. Lua

Good for atomic Redis-local logic:

```text
rate limit
compare-and-delete lock
atomic counter update
```

---

# 106. Lua Limits

Scripts must be:

```text
small
bounded
tested
```

Never execute unbounded heavy loops.

---

# 107. Distributed Locking

Redis can provide short-lived locks for:

```text
optional coordination
cache refresh
non-critical scheduler coordination
```

---

# 108. Lock Command

Typical:

```text
SET resource_lock {token} NX PX 5000
```

---

# 109. Lock Ownership

Use a unique owner token.

Release only when:

```text
stored token == owner token
```

via atomic compare-delete.

---

# 110. Lock Expiry

Every Redis lock requires TTL.

---

# 111. Lock Renewal

Renew only when:

```text
current owner token still matches
```

Avoid indefinite renewal.

---

# 112. Redis Lock Failure

If Redis unavailable:

```text
do not assume lock acquired
```

Choose:

```text
fail operation
fallback DB lock
skip optional optimization
```

per use case.

---

# 113. DB Locks for Critical Invariants

Use DB atomicity for:

```text
inventory reserve
wallet debit
coupon usage
reward quantity
order state transition
```

---

# 114. Redlock Warning

Do not base strict financial/business correctness solely on Redlock-style assumptions.

---

# 115. Good Redis Lock Example

```text
only one pod refreshes expensive menu cache
```

Failure effect:

```text
extra DB/source load
```

not corrupted money/stock.

---

# 116. Scheduled Job Lock

Redis may coordinate optional scheduled jobs, but durable workflow jobs may be better with:

```text
PostgreSQL SKIP LOCKED
Kubernetes leader election
durable job framework
```

---

# 117. Rate Limiting Algorithms

Possible:

```text
Fixed Window
Sliding Window
Sliding Log
Token Bucket
Leaky Bucket
```

---

# 118. Fixed Window

Example:

```text
10 requests / minute
```

Simple but allows boundary bursts.

---

# 119. Sliding Window

Provides smoother enforcement than fixed windows.

---

# 120. Sliding Log

Precise but potentially expensive in memory.

---

# 121. Token Bucket

Useful for:

```text
steady average rate
controlled bursts
```

---

# 122. Rate-Limit Dimensions

```text
IP
user ID
device ID
identifier hash
endpoint
operation
```

---

# 123. Composite Security Rate Limits

May enforce:

```text
per identifier
+
per IP
+
per shared subject/device
+
global abuse threshold
```

---

# 124. Password Reset Rate Limits

Redis may accelerate:

```text
15-minute identifier limits
IP limits
daily limits
resend cooldown
OTP attempt counter
```

Durable abuse/audit records may remain PostgreSQL-backed.

---

# 125. Rate-Limit Atomicity

Implement atomically with:

```text
Lua
INCR + EXPIRE carefully
sorted-set script
```

---

# 126. Rate-Limit Response

Return:

```text
HTTP 429
stable error code
retry_after
```

where appropriate.

---

# 127. Rate-Limit Failure Policy

Security-sensitive endpoint:

```text
fail closed
or
use local fallback
```

Low-risk endpoint may temporarily:

```text
fail open
```

Policy is per operation.

---

# 128. Cooldown Key

Example:

```text
identity:cooldown:password_reset:{subject_hash}
```

with TTL.

---

# 129. Cross-Identifier Cooldown

If cooldown follows one user/session/device:

```text
key shared subject
```

not merely the submitted identifier.

---

# 130. OTP Attempt Counter

Redis can hold:

```text
attempt count
lockout TTL
```

but challenge authority remains according to Identity security design.

---

# 131. Session/Temporary State

Possible Redis use:

```text
short-lived web session
temporary OAuth state
PKCE state
device challenge
```

---

# 132. Stateless JWT

If access token is stateless:

```text
Redis is not required for every authenticated request
```

---

# 133. Revocation Cache

Redis may accelerate:

```text
revoked jti
session denylist
```

TTL should generally match remaining token lifetime.

---

# 134. Refresh Token State

Do not store refresh-token family/reuse/audit truth only in volatile Redis if the security model needs durable detection.

Identity DB remains authoritative.

---

# 135. JWKS Cache

Consuming services may cache:

```text
identity:jwks:{kid}
```

with:

```text
bounded TTL
unknown-kid refresh
rotation refresh
```

---

# 136. Permission Cache

May cache:

```text
role → permissions
```

but revocation-latency requirements must be understood.

---

# 137. Security Cache TTL

Security-sensitive cache should generally have:

```text
shorter TTL
or
event-driven invalidation
```

---

# 138. Idempotency Cache

Redis may cache completed idempotency results for speed.

Example:

```text
order:idem:create:{key_hash}
```

---

# 139. Idempotency Cache Payload

May include:

```text
request_hash
status
response_reference
```

---

# 140. Critical Idempotency Rule

For critical write:

```text
DB unique constraint
or
durable idempotency table
```

remains required.

---

# 141. Redis Idempotency Role

Use Redis as:

```text
acceleration over durable idempotency
```

not replacement.

---

# 142. Event Deduplication Cache

`SETNX(event_id)` may accelerate low-risk dedupe.

Critical consumers still use:

```text
durable inbox
business uniqueness
```

---

# 143. Bloom Filter

May reduce repeated DB misses if:

```text
false positives are acceptable
```

Never use alone for:

```text
authorization
financial eligibility
critical rejection
```

---

# 144. Redis Counters

Good:

```text
page views
approximate activity
rate limits
temporary metrics
```

Bad as sole authority:

```text
wallet balance
coupon final usage
reward quantity
```

---

# 145. INCR

Atomic per key, but still consider:

```text
durability
eviction
reconciliation
```

---

# 146. Sorted Sets

Useful for:

```text
rate windows
non-financial ranking
temporary expiry index
```

Durable workflow scheduling may remain PostgreSQL-based.

---

# 147. Redis Pub/Sub

Ephemeral.

Offline subscriber:

```text
loses message
```

Not replacement for Kafka.

---

# 148. Redis Streams

More durable than Pub/Sub, but platform standard remains:

```text
Kafka for durable cross-service events
```

Do not introduce two event backbones without a strong reason.

---

# 149. Key Expiration Events

Redis keyspace expiration notifications are not reliable workflow triggers.

Do not use them to execute:

```text
payment cancellation
inventory release
reward expiry
coupon release
mission expiry
```

---

# 150. Durable Expiry Workflows

Use:

```text
DB timestamp
scheduler
SKIP LOCKED
Kafka if appropriate
```

for business expiry.

---

# 151. Event-Driven Invalidation

Example:

```text
CatalogUpdated
      ↓
consumer
      ↓
invalidate catalog cache
```

---

# 152. Invalidation Ordering

Out-of-order events can reintroduce stale cache.

Use:

```text
event/entity version
```

where needed.

---

# 153. Version-Aware Cache Update

Write projection only if:

```text
incoming_version >= cached_version
```

where meaningful.

---

# 154. Cache Race Example

```text
A reads old DB
B updates DB and invalidates
A writes old value into cache
```

This reintroduces stale data.

---

# 155. Race Mitigations

```text
versioned keys
short TTL
version comparison
source version in payload
delayed second delete where justified
```

---

# 156. Double Delete

Possible:

```text
delete cache
update DB
commit
delete again
```

Use carefully; versioning is often cleaner.

---

# 157. Source Version in Payload

Cache payload may store:

```text
source_version
updated_at
```

---

# 158. Menu Cache Architecture

```text
catalog source/menu config
      ↓
menu content version
      ↓
shared Redis projection
      ↓
guest/user final projection
```

---

# 159. Menu Source Cache

Stores:

```text
shared menu source
```

Longer TTL.

---

# 160. Menu Personalized Layers

Examples:

```text
favorite
last order
user-specific final menu
```

Short TTL.

---

# 161. Guest Final Menu Key

Dimensions:

```text
store
channel
language
menu version
```

---

# 162. User Final Menu Key

Dimensions may include:

```text
customer_id
store
channel
language
menu_version
favorite_version
last_order_version
```

---

# 163. Personalized Cache Cardinality

Estimate:

```text
active users
× stores
× channels
× languages
× variants
```

before implementation.

---

# 164. Better Personalization Pattern

Often prefer:

```text
shared cached base
+
small user overlay at request time
```

instead of full per-user menu cache explosion.

---

# 165. Catalog Cache

Examples:

```text
catalog:product:{id}:v{version}
catalog:menu:{store}:{channel}:{lang}:v{menuVersion}
catalog:categories:v{version}
```

---

# 166. Inventory Cache Rule

Inventory may cache:

```text
advisory availability
```

but final:

```text
ReserveInventory
```

must use Inventory DB authoritative stock.

---

# 167. Inventory Availability Key

Example:

```text
inventory:availability:{store}:{stock_item}
```

with short TTL.

---

# 168. Inventory Availability Use

Good for:

```text
menu badge
UX hint
soft availability display
```

Not:

```text
checkout guarantee
```

---

# 169. Cart Cache Rule

Cart may use Redis for read acceleration.

Durable cart state may remain PostgreSQL.

---

# 170. Guest Cart Exception

If guest cart is Redis-authoritative:

```text
data-loss semantics
TTL
eviction
restart behavior
```

must be explicitly accepted.

---

# 171. Order Cache Rule

May cache:

```text
order details
order list
```

selectively.

Do not use cached Order state to authorize/perform state transition.

---

# 172. Payment Cache Rule

Do not rely on cached Payment state to decide:

```text
capture
refund
void
```

Use Payment DB.

---

# 173. Wallet Cache Rule

Wallet summary may be cached for display.

Spend/reserve must execute against:

```text
wallet_db
```

---

# 174. Loyalty Cache Rule

Cache:

```text
points summary
tier
rewards list
```

Final redeem uses authoritative Loyalty DB.

---

# 175. Promotion Cache Rule

Cache:

```text
published promotion definitions
candidate sets
preview metadata
```

Final reserve/redemption uses durable usage counters/records.

---

# 176. Mission Cache Rule

Cache:

```text
active mission definitions
customer mission list
```

Progress update remains PostgreSQL-authoritative.

---

# 177. Mission List Key

Example:

```text
mission:list:{customer_id}:{language}
```

---

# 178. Mission Invalidation

Invalidate on:

```text
progress change
completion
reward status change
mission publication/version
```

---

# 179. Notification Cache Rule

Cache:

```text
template
preference projection
provider configuration where safe
```

Delivery history remains durable.

---

# 180. Identity Cache Rule

Cache:

```text
JWKS
permissions
rate limits
revocation acceleration
temporary challenge state
```

Durable credentials/sessions remain in Identity DB.

---

# 181. Integration Cache Rule

Integration may cache:

```text
stable reference mappings
partner configuration
provider health hints
```

but durable:

```text
integration request state
webhook dedupe where replay safety matters
polling watermark
UNKNOWN state
reconciliation
```

remains PostgreSQL-backed.

---

# 182. Redis Client

Recommended common Spring stack:

```text
Lettuce
```

---

# 183. Client Configuration

Configure:

```text
command timeout
connection behavior
cluster topology refresh
TLS
credentials
read preference if used
```

---

# 184. Command Timeout

Every Redis operation needs bounded timeout.

Redis must not stall request threads indefinitely.

---

# 185. Connection Pooling

Do not over-pool Lettuce without measurement.

Async/reactive connection model differs from blocking clients.

---

# 186. Cluster Topology Refresh

Refresh:

```text
periodically
on MOVED/ASK
```

---

# 187. Redis Command Retry

Must be:

```text
bounded
command-safe
```

---

# 188. Cache GET Timeout

For non-critical cache:

```text
treat as MISS
fallback to source
```

---

# 189. Security Redis Timeout

For rate-limit/security state:

```text
follow defined fail policy
```

not generic cache-miss behavior.

---

# 190. Redis Circuit Breaker

If Redis outage causes repeated request timeout:

```text
open breaker
skip cache
go source
```

for cache-only workloads.

---

# 191. Cache Bypass

Operational flag:

```text
cache.enabled=false
```

or breaker-based bypass.

---

# 192. Cache Bypass Risk

Source DB/API load may spike.

Protect using:

```text
rate limiting
connection limits
stale-while-revalidate
traffic shedding
```

---

# 193. Redis Failure Rule

For normal caches:

```text
performance may degrade
business correctness must not
```

---

# 194. Redis Restart

Expect:

```text
cold cache
source-load spike
```

Mitigate:

```text
jitter
single-flight
gradual warm-up
```

---

# 195. Redis Failover

Expect temporary:

```text
connection errors
role change
topology refresh
```

Client must reconnect safely.

---

# 196. Replica Reads

May be used for:

```text
large read-only stale-tolerant cache
```

---

# 197. Primary Reads

Use primary where fresher semantics matter, especially:

```text
rate limit
coordination
security state
```

---

# 198. Replica Lag

If replica reads enabled:

```text
stale data is possible
```

Must be acceptable for that cache.

---

# 199. Network Partition

Redis lock/coordination becomes especially risky.

Critical invariants remain DB-backed.

---

# 200. Redis Security Areas

```text
TLS
authentication
ACL
network isolation
secret management
command restrictions
data classification
```

---

# 201. TLS

Use Redis TLS in production according to infrastructure/security policy.

---

# 202. Authentication

Use:

```text
ACL username/password
managed IAM/token
```

depending platform.

---

# 203. Redis ACL

Where feasible restrict each service by:

```text
allowed commands
allowed key prefixes
```

---

# 204. Dangerous Commands

Application credentials should not have:

```text
FLUSHALL
FLUSHDB
CONFIG
DEBUG
SHUTDOWN
KEYS
```

---

# 205. KEYS

Do not run:

```text
KEYS *
```

in production.

Use bounded:

```text
SCAN
```

for operational tooling.

---

# 206. SCAN

Incremental but not free.

Use carefully and bounded.

---

# 207. Redis Credentials

Store in:

```text
Secret Manager
Kubernetes external secret
managed secret mechanism
```

not code repository.

---

# 208. Network Policy

Only authorized workloads/namespaces may connect.

---

# 209. Sensitive Temporary Data

May require:

```text
application-level encryption
```

in addition to TLS.

---

# 210. Token Data

Avoid storing raw:

```text
access token
refresh token
OTP
password-reset secret
```

Prefer:

```text
hash
encrypted value
reference
```

---

# 211. Cache Poisoning

Only trusted service code populates privileged cache.

Validate deserialized values before use.

---

# 212. Namespace Collision

Strong prefixes and ACLs prevent cross-service overwrite.

---

# 213. Deserialization Security

Use:

```text
strict DTO
known type
schema/version validation
```

Never arbitrary polymorphic deserialization.

---

# 214. Redis Infrastructure Metrics

Monitor:

```text
latency
commands/sec
memory
evictions
connections
CPU
network
replication
failover
```

---

# 215. Cache Hit Ratio

Per cache:

```text
hits / (hits + misses)
```

Global ratio alone is insufficient.

---

# 216. Low Hit Ratio

Potential causes:

```text
TTL too short
key too specific
high cardinality
traffic not reusable
```

May mean cache is not worth its cost.

---

# 217. High Hit Ratio Warning

100% hit ratio can still mean:

```text
stale incorrect cache
```

Verify freshness/invalidation.

---

# 218. Eviction Metrics

Monitor:

```text
evicted_keys
```

Unexpected eviction may affect performance and security/temp workflows.

---

# 219. Expiration Metrics

Monitor:

```text
expired_keys
```

to understand TTL behavior.

---

# 220. Memory Metrics

Monitor:

```text
used_memory
used_memory_rss
maxmemory
fragmentation_ratio
```

---

# 221. Connection Metrics

```text
connected_clients
blocked_clients
rejected_connections
```

---

# 222. Command Latency

Track relevant commands:

```text
GET
SET
EVAL
ZADD
```

---

# 223. Slowlog

Use Redis slowlog to identify:

```text
expensive commands
long Lua scripts
operational scans
```

---

# 224. Hot-Key Detection

Use:

```text
command stats
sampling
managed tooling
```

Do not expose sensitive key names broadly.

---

# 225. Replication Metrics

Monitor:

```text
replica lag
link state
failover
```

---

# 226. Application Cache Metrics

Per service/cache:

```text
cache_hit_total
cache_miss_total
cache_error_total
cache_load_duration
cache_invalidation_total
```

---

# 227. Stampede Metrics

Where important:

```text
cache_refresh_lock_contention
source load spike after expiry
```

---

# 228. Rate-Limit Metrics

```text
rate_limit_allowed_total
rate_limit_blocked_total
rate_limit_redis_error_total
```

---

# 229. Redis SLIs

Potential:

```text
P95 command latency
availability
cache hit rate
eviction rate
failover time
```

---

# 230. Cache SLO

Include:

```text
Redis latency/availability
+
fallback source capacity
```

A Redis outage must not immediately collapse the source database.

---

# 231. Alerts

Alert on:

```text
memory high
evictions spike
latency spike
replica down
failover
connection saturation
blocked clients
rate-limit Redis errors
```

---

# 232. Redis Dashboard

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

# 233. Service Cache Dashboard

For major caches:

```text
hit ratio
load time
key count estimate
errors
invalidations
source query volume
```

---

# 234. Cache Logging

Log:

```text
cache_name
operation
result
latency
fallback_used
```

---

# 235. Logging Privacy

Avoid raw:

```text
sensitive key
payload
token
OTP
```

---

# 236. Cache Tracing

Possible spans:

```text
redis GET
redis SET
cache miss load
cache refresh
```

Sampling may be necessary.

---

# 237. Trace Key Rule

Do not add full high-cardinality/sensitive key.

Use:

```text
cache name
resource type
```

---

# 238. Required Redis Runbooks

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

# 239. Redis Outage Runbook

```text
confirm scope
enable cache bypass if safe
monitor source DB/API load
reduce non-critical traffic
restore Redis
warm critical keys gradually
```

---

# 240. Memory Exhaustion Runbook

```text
identify key growth
find missing TTL
inspect value size
review workload mix
adjust capacity/eviction
delete only safe keys
```

Never start with:

```text
FLUSHALL
```

---

# 241. Eviction Spike Runbook

Check:

```text
maxmemory
cardinality
TTL
recent deployment
workload separation
```

---

# 242. Hot-Key Runbook

```text
identify hot resource
inspect callers
add L1 / sharding / replication if appropriate
review key design
```

---

# 243. Stampede Runbook

```text
identify expired hot key
enable single-flight
jitter TTL
pre-warm selectively
protect source DB
```

---

# 244. Corrupted Cache Runbook

```text
identify namespace/version
enable bypass
invalidate affected keys
bump schema/key version
rebuild
```

---

# 245. Rate-Limit Failure Runbook

Security endpoints:

```text
apply predefined fail-closed/local fallback
alert Security/Platform
restore Redis
```

Low-risk endpoint may use documented fail-open.

---

# 246. Redis Backup

Pure rebuildable cache:

```text
backup may be unnecessary
```

Important temporary/security state:

```text
persistence/backup may be justified
```

---

# 247. Redis Restore

Stale restored cache may be worse than empty cache.

For cache-only workloads often prefer:

```text
cold start + rebuild
```

---

# 248. Redis DR

Define:

```text
failover strategy
Redis rebuild time
cold-cache source impact
security-state loss implications
```

---

# 249. Cross-Region Redis

Use only if justified by:

```text
latency
HA
DR
```

Avoid global lock complexity without a strong requirement.

---

# 250. Cache Schema Change

Changing payload requires:

```text
new key version
compatible reader
or
full safe invalidation
```

---

# 251. Cache Key Version Bump

Example:

```text
MENU_CACHE_VERSION v5 → v6
```

Old keys naturally become unused/expire.

---

# 252. Rolling Deployment

If old/new payloads incompatible:

```text
old pods use v5
new pods use v6
```

until rollout completes.

---

# 253. Cache Migration

Prefer:

```text
new versioned namespace
```

over rewriting millions of existing keys.

---

# 254. Cache Catalog

Maintain a platform catalog for every Redis use case.

Fields:

```text
Cache Name
Owner
Key Pattern
Source of Truth
TTL
Invalidation
Expected Cardinality
Average Value Size
Failure Mode
Data Classification
Eviction Allowed?
Stampede Strategy
```

---

# 255. Catalog Menu Entry

```text
Name:
Catalog Menu

Owner:
Catalog Service

Key:
catalog:menu:{store}:{channel}:{language}:v{menuVersion}

Source:
catalog_db

TTL:
5 min + jitter (example)

Invalidation:
publication/version change

Failure:
load from PostgreSQL

Classification:
INTERNAL
```

---

# 256. Mission List Entry

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

# 257. Password Reset Rate Limit Entry

```text
Name:
Password Reset Rate Limit

Owner:
Identity Service

Key:
identity:rate:password_reset:{subject_hash}

Source:
Redis atomic state + durable security events as required

TTL:
window-based

Failure:
security-defined fail policy

Classification:
RESTRICTED
```

---

# 258. JWKS Entry

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

# 259. Inventory Availability Entry

```text
Name:
Inventory Advisory Availability

Owner:
Inventory Service

Key:
inventory:availability:{store_id}:{stock_item_id}

Source:
inventory_db

TTL:
very short

Invalidation:
stock/reservation change event

Failure:
query Inventory DB

Guarantee:
NOT valid for final reservation decision
```

---

# 260. Wallet Summary Entry

```text
Name:
Wallet Display Summary

Owner:
Wallet Service

Key:
wallet:summary:{customer_id}

Source:
wallet_db

TTL:
short

Invalidation:
wallet ledger/balance change

Failure:
query wallet_db

Guarantee:
NOT used for debit/reserve
```

---

# 261. Promotion Definition Entry

```text
Name:
Published Promotion Definitions

Owner:
Promotion Service

Key:
promotion:published:{scope}:v{version}

Source:
promotion_db

TTL:
bounded

Invalidation:
publish/archive/version change

Failure:
query promotion_db

Guarantee:
final redemption does not trust cache counters
```

---

# 262. Notification Template Entry

```text
Name:
Notification Template

Owner:
Notification Service

Key:
notification:template:{code}:{language}:v{version}

Source:
notification_db

TTL:
bounded

Invalidation:
template publish/version change

Failure:
query notification_db
```

---

# 263. Integration Mapping Entry

```text
Name:
External Reference Mapping Cache

Owner:
Integration Service

Key:
integration:reference:{system}:{entity}:{external_hash}

Source:
integration_db

TTL:
bounded

Invalidation:
mapping/remap event

Failure:
query integration_db

Guarantee:
durable mapping remains PostgreSQL authority
```

---

# 264. Cache Decision Tree

Before adding Redis:

```text
Is source actually slow?
Is traffic repeated?
Is staleness acceptable?
Can invalidation be defined?
Can cardinality/memory be estimated?
Can source survive cache loss?
Does caching materially reduce load/latency?
```

If not:

```text
do not add Redis merely because it exists
```

---

# 265. When Not to Cache

Avoid cache when:

```text
data changes constantly
queries are unique
source is already fast
staleness risks correctness
memory cost exceeds saved work
invalidation cannot be defined
```

---

# 266. Measure Before Caching

Capture baseline:

```text
DB/API latency
request rate
CPU
I/O
P95/P99
query count
```

---

# 267. Cache Effectiveness

A cache should demonstrate:

```text
lower source load
lower latency
acceptable memory
acceptable staleness
```

---

# 268. Cache Cost

Include:

```text
Redis infrastructure
engineering complexity
invalidation risk
cold-start behavior
testing
observability
operations
```

Caching is not free.

---

# 269. Testing Strategy

Required:

```text
hit/miss
TTL
jitter
invalidation
serialization
versioning
race
stampede
negative cache
outage
latency
eviction
rate limit
cooldown
distributed lock
cluster failover
replica lag
hot key
memory
security
rolling deploy
```

---

# 270. Redis Testcontainers

Use real Redis for:

```text
TTL
Lua
rate limiting
serialization
locks
atomic behavior
```

---

# 271. Cache-Aside Test

Verify:

```text
first request → source + SET
second request → Redis HIT
```

---

# 272. TTL Test

Verify expiration lies in expected range including jitter.

---

# 273. Invalidation Test

Update source.

Expected:

```text
old cache representation not served
```

---

# 274. Versioned Key Test

Bump version.

Expected:

```text
old key ignored
```

---

# 275. Cache Race Test

Simulate:

```text
read old
source update
invalidate
old reader writes stale
```

Verify versioning/version check prevents stale overwrite where required.

---

# 276. Stampede Test

Expire one hot key.

Send:

```text
1,000 concurrent requests
```

Expected:

```text
bounded source calls
```

---

# 277. Negative Cache Test

Repeated unknown entity:

```text
does not repeatedly hit source
```

Then create entity:

```text
negative cache invalidated
```

---

# 278. Redis Outage Test

Stop Redis.

Verify:

```text
normal cache falls back
business correctness intact
source survives fallback load
```

---

# 279. Redis Slow Test

Inject latency.

Verify:

```text
command timeout
breaker/bypass
no request-thread collapse
```

---

# 280. Eviction Test

Force memory pressure.

Verify only approved disposable workloads are evicted.

---

# 281. Security-State Eviction Test

If security state shares Redis:

```text
simulate eviction
```

Verify fail policy.

This may prove workload needs dedicated noeviction Redis.

---

# 282. Rate-Limit Test

Test:

```text
below threshold
at threshold
above threshold
concurrent boundary
TTL reset
multiple dimensions
```

---

# 283. Cooldown Test

Verify cooldown follows the intended subject across identifiers where required.

---

# 284. Distributed Lock Test

Test:

```text
one winner
timeout
owner crash
wrong token release
TTL expiry
renewal if used
```

---

# 285. Lock Safety Test

Prove critical business invariant still holds if Redis lock fails/disappears.

---

# 286. Cluster Failover Test

Fail primary.

Verify:

```text
client reconnect
topology refresh
documented behavior during failover
```

---

# 287. Replica Lag Test

If replica reads enabled:

```text
prove stale-read tolerance
```

---

# 288. Hot-Key Load Test

Stress a single key.

Measure:

```text
shard CPU
network
latency
ops/sec
```

---

# 289. Memory Load Test

Populate realistic:

```text
key count
value size
TTL distribution
personalized cardinality
```

Measure actual memory overhead.

---

# 290. Serialization Compatibility Test

Old/new app versions must not crash when reading cache during rolling deploy.

---

# 291. Security Tests

Verify:

```text
service cannot access unauthorized namespace
TLS/auth required
dangerous commands unavailable
credentials absent from logs
sensitive key/value handling
```

---

# 292. Definition of Done — Cache

- [ ] Source of truth identified.
- [ ] Owner identified.
- [ ] Key format documented.
- [ ] TTL documented.
- [ ] Freshness tolerance documented.
- [ ] Serialization documented.
- [ ] Invalidation documented.
- [ ] Fallback documented.
- [ ] Stampede strategy documented.
- [ ] Cardinality estimated.
- [ ] Memory estimate.
- [ ] Security classification.
- [ ] Metrics.
- [ ] Tests.

---

# 293. Definition of Done — Rate Limit

- [ ] Subject dimensions.
- [ ] Algorithm.
- [ ] Threshold/window.
- [ ] Atomic implementation.
- [ ] Fail-open/closed policy.
- [ ] 429 contract.
- [ ] Retry-after behavior.
- [ ] Security review.
- [ ] Metrics.
- [ ] Tests.

---

# 294. Definition of Done — Distributed Lock

- [ ] Lock use justified.
- [ ] Not sole critical invariant.
- [ ] Unique owner token.
- [ ] TTL.
- [ ] Atomic release.
- [ ] Crash behavior.
- [ ] Redis-down behavior.
- [ ] Tests.

---

# 295. Cache Architecture Checklist

Ownership:

- [ ] Source of truth explicit.
- [ ] Cache owner explicit.
- [ ] No cross-service cache write.
- [ ] Redis not silently authoritative.

Freshness:

- [ ] TTL.
- [ ] Invalidation.
- [ ] Versioning.
- [ ] Stale-read policy.

Reliability:

- [ ] Cache miss path.
- [ ] Redis-down path.
- [ ] Stampede protection.
- [ ] Memory/eviction behavior.

---

# 296. Key Design Checklist

- [ ] Service prefix.
- [ ] Domain/resource.
- [ ] Identifier.
- [ ] Query dimensions.
- [ ] Language/store/channel.
- [ ] Schema/content version.
- [ ] No raw sensitive data.
- [ ] Cardinality estimated.
- [ ] TTL defined.

---

# 297. Security Checklist

- [ ] TLS.
- [ ] Authentication.
- [ ] ACL.
- [ ] Network isolation.
- [ ] Credentials externalized.
- [ ] Dangerous commands blocked.
- [ ] No raw token/OTP key.
- [ ] Sensitive value encrypted/hashed if necessary.
- [ ] Rate-limit failure policy.
- [ ] Secret rotation.

---

# 298. Operations Checklist

- [ ] Memory.
- [ ] Eviction.
- [ ] Hit ratio.
- [ ] Latency.
- [ ] Connections.
- [ ] Replication.
- [ ] Failover.
- [ ] Hot keys.
- [ ] Capacity headroom.
- [ ] Source fallback capacity.
- [ ] Runbooks.

---

# 299. Production Readiness Checklist

Before production:

- [ ] Redis HA configured.
- [ ] Client timeouts configured.
- [ ] Cache namespaces standardized.
- [ ] TTLs reviewed.
- [ ] Key versions used for incompatible schema.
- [ ] Invalidation tested.
- [ ] Stampede test passed.
- [ ] Redis outage fallback tested.
- [ ] Source fallback capacity tested.
- [ ] Memory/eviction policy reviewed.
- [ ] Security workloads isolated where needed.
- [ ] Dangerous commands blocked.
- [ ] Credentials externalized.
- [ ] Monitoring/alerts configured.
- [ ] Failover tested.
- [ ] Cold-start impact tested.
- [ ] Runbooks available.

---

# 300. Source-Recommended Implementation Order

```text
1. Redis environments / HA
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
13. L1/L2 only where justified
14. Operational runbooks
15. Load/failover tests
```

---

# 301. Platform Implementation Order

Expanded implementation plan:

```text
1. Select DEV/UAT/PROD Redis topology
2. Establish cache/security workload separation
3. Configure HA/failover
4. Configure TLS/auth/ACL
5. Configure maxmemory/eviction
6. Add Spring/Lettuce platform module
7. Define command timeout/fallback standard
8. Define service key prefixes
9. Define JSON cache envelope/schema version
10. Build CacheCatalog contract
11. Build cache-aside helper/port
12. Implement TTL + jitter utility
13. Implement versioned-key utility
14. Add cache hit/miss/load metrics
15. Implement source-safe bypass/breaker
16. Implement Catalog/Menu cache
17. Implement menu publication invalidation/version
18. Implement single-flight
19. Implement distributed refresh lock
20. Implement negative cache
21. Implement Identity rate-limit framework
22. Implement cooldown framework
23. Implement revocation/JWKS cache
24. Define temp-session rules
25. Implement Inventory advisory cache if justified
26. Implement Wallet/Loyalty display summaries if justified
27. Implement Mission list cache
28. Implement Promotion definition cache
29. Implement Notification template cache
30. Implement Integration reference cache if justified
31. Add Kafka invalidation handlers where necessary
32. Test cache races/version ordering
33. Capacity/cardinality test
34. Failover/eviction/hot-key test
35. Add runbooks/dashboard/alerts
36. Complete Phase 20 review
37. Handoff Phase 21 Testing
```

---

# 302. Minimum Viable Redis Standard

Every Redis use case defines:

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

---

# 303. Minimum Redis Correctness Principles

```text
Cache is disposable.
Critical writes remain durable.
Rate limits are atomic.
Locks are bounded.
Eviction behavior is understood.
```

---

# 304. Redis Governance

Architecture review must reject:

```text
no-TTL cache without justification
shared unowned keyspace
raw secrets in keys
Redis-only wallet/inventory/payment truth
unbounded KEYS usage
business workflow triggered by key expiry event
Redis lock as only financial invariant
```

---

# 305. Redis Work Breakdown

Suggested tickets:

```text
RED-001 Select Redis topology
RED-002 Define DEV/UAT/PROD isolation
RED-003 Define workload separation
RED-004 Configure HA
RED-005 Configure maxmemory
RED-006 Select eviction policy
RED-007 Configure TLS
RED-008 Configure authentication
RED-009 Configure service ACLs
RED-010 Externalize Redis credentials
RED-011 Restrict dangerous commands
RED-012 Configure network policy requirements
RED-013 Add Lettuce dependencies
RED-014 Build shared Redis client configuration
RED-015 Add command timeout
RED-016 Add cluster topology refresh
RED-017 Define safe retry policy
RED-018 Build cache bypass feature
RED-019 Add Redis breaker/bypass behavior
RED-020 Define key naming standard
RED-021 Define service prefixes
RED-022 Define sensitive-key hashing
RED-023 Define cache schema version
RED-024 Define JSON serialization
RED-025 Build strict cache DTO rules
RED-026 Build TTL configuration standard
RED-027 Build TTL jitter utility
RED-028 Build cache-aside abstraction
RED-029 Build CacheCatalog registry
RED-030 Build versioned-key utility
RED-031 Build source-version envelope
RED-032 Implement direct invalidation helper
RED-033 Implement Kafka invalidation base handler
RED-034 Implement cache dependency documentation
RED-035 Implement local single-flight
RED-036 Implement distributed refresh lock
RED-037 Implement atomic compare-delete lock release
RED-038 Implement stale-while-revalidate helper if approved
RED-039 Implement negative caching
RED-040 Implement cache-miss validation controls
RED-041 Implement hot-key detection instrumentation
RED-042 Add L1 Caffeine abstraction if needed
RED-043 Define L1/L2 invalidation policy
RED-044 Implement Catalog product cache
RED-045 Implement Catalog category cache
RED-046 Implement shared Menu source cache
RED-047 Implement menu version key
RED-048 Implement guest final menu cache
RED-049 Implement user final menu cache only if cardinality acceptable
RED-050 Implement menu invalidation
RED-051 Implement menu cache race tests
RED-052 Implement Inventory advisory availability cache if justified
RED-053 Prevent Inventory reserve from trusting cache
RED-054 Implement Cart read cache if justified
RED-055 Document guest-cart authority decision
RED-056 Implement Order display cache if justified
RED-057 Prevent Order transition decisions from cache
RED-058 Implement Payment display cache only if justified
RED-059 Prevent capture/refund decisions from cache
RED-060 Implement Wallet summary cache if justified
RED-061 Prevent debit/reserve from cache
RED-062 Implement Loyalty summary cache
RED-063 Implement Loyalty tier cache
RED-064 Implement Rewards list cache
RED-065 Prevent point redeem from cache
RED-066 Implement Promotion definition cache
RED-067 Implement Promotion candidate cache if useful
RED-068 Prevent promotion redemption counters in cache only
RED-069 Implement Mission definition cache
RED-070 Implement Mission customer-list cache
RED-071 Implement Mission progress/reward invalidation
RED-072 Prevent Mission progress authority in Redis
RED-073 Implement Notification template cache
RED-074 Implement Notification preference projection cache if justified
RED-075 Implement Integration reference cache if justified
RED-076 Prevent durable integration state from cache-only
RED-077 Implement JWKS cache
RED-078 Implement unknown-kid refresh
RED-079 Implement permission cache
RED-080 Define security cache TTLs
RED-081 Implement revocation acceleration
RED-082 Keep durable session authority in Identity DB
RED-083 Implement rate-limit framework
RED-084 Implement Fixed Window algorithm
RED-085 Implement Token Bucket/Sliding Window as approved
RED-086 Implement atomic Lua rate limiter
RED-087 Implement per-IP dimension
RED-088 Implement per-user dimension
RED-089 Implement per-identifier-hash dimension
RED-090 Implement composite security limit
RED-091 Implement password-reset rate limiting
RED-092 Implement resend cooldown
RED-093 Implement shared-subject cooldown
RED-094 Implement OTP attempt counter if approved
RED-095 Implement fail-open/fail-closed policy
RED-096 Implement 429/retry-after contract
RED-097 Implement durable security audit linkage
RED-098 Implement idempotency-response acceleration
RED-099 Keep durable idempotency in DB
RED-100 Implement low-risk dedupe cache helper
RED-101 Define Bloom-filter policy
RED-102 Define Redis counter policy
RED-103 Explicitly reject financial counters in Redis-only design
RED-104 Document Pub/Sub boundary
RED-105 Document Streams boundary
RED-106 Prohibit key-expiry business triggers
RED-107 Add memory estimation worksheet/template
RED-108 Estimate menu cache cardinality
RED-109 Estimate personalized-key cardinality
RED-110 Validate average payload sizes
RED-111 Validate memory headroom
RED-112 Test eviction behavior
RED-113 Test security-state eviction
RED-114 Implement Redis infrastructure metrics
RED-115 Implement per-cache hit/miss metrics
RED-116 Implement cache-load latency metrics
RED-117 Implement invalidation metrics
RED-118 Implement stampede metrics
RED-119 Implement rate-limit metrics
RED-120 Implement dashboard
RED-121 Implement alerts
RED-122 Write Redis outage runbook
RED-123 Write high-latency runbook
RED-124 Write memory-exhaustion runbook
RED-125 Write eviction runbook
RED-126 Write hot-key runbook
RED-127 Write failover runbook
RED-128 Write replication runbook
RED-129 Write stampede runbook
RED-130 Write corrupted-cache runbook
RED-131 Write rate-limit degradation runbook
RED-132 Define Redis backup policy
RED-133 Define Redis restore policy
RED-134 Define cold-cache recovery procedure
RED-135 Define security-state DR behavior
RED-136 Implement cache schema/version migration standard
RED-137 Implement rolling-deploy compatibility tests
RED-138 Implement Redis Testcontainers support
RED-139 Implement cache hit/miss tests
RED-140 Implement TTL+jitter tests
RED-141 Implement invalidation tests
RED-142 Implement versioned-key tests
RED-143 Implement cache race tests
RED-144 Implement 1,000-request stampede test
RED-145 Implement negative-cache tests
RED-146 Implement Redis outage test
RED-147 Implement Redis slow-latency test
RED-148 Implement rate-limit concurrency test
RED-149 Implement cooldown tests
RED-150 Implement distributed-lock tests
RED-151 Implement lock-safety test
RED-152 Implement cluster failover test
RED-153 Implement replica-lag test
RED-154 Implement hot-key load test
RED-155 Implement realistic memory load test
RED-156 Implement serialization compatibility test
RED-157 Implement Redis security tests
RED-158 Document Cache Catalog
RED-159 Perform cache architecture review
RED-160 Complete policy freeze
RED-161 Phase 20 exit review
```

---

# 306. Recommended ADRs

```text
ADR-RED-001 Redis workload ownership
ADR-RED-002 Cache-aside as default
ADR-RED-003 Key naming standard
ADR-RED-004 Serialization standard
ADR-RED-005 TTL and jitter
ADR-RED-006 Versioned cache keys
ADR-RED-007 Invalidation strategy
ADR-RED-008 Cache dependency graph
ADR-RED-009 Stampede protection
ADR-RED-010 Negative caching
ADR-RED-011 L1/L2 cache policy
ADR-RED-012 Memory/eviction policy
ADR-RED-013 Redis workload separation
ADR-RED-014 Persistence policy
ADR-RED-015 HA topology
ADR-RED-016 Lua usage
ADR-RED-017 Distributed lock policy
ADR-RED-018 Rate-limit algorithm
ADR-RED-019 Security fail-open/fail-closed
ADR-RED-020 Session/temp-state durability
ADR-RED-021 Idempotency cache boundary
ADR-RED-022 Pub/Sub/Streams boundary
ADR-RED-023 Key-expiry workflow prohibition
ADR-RED-024 Replica-read policy
ADR-RED-025 Cache bypass policy
ADR-RED-026 Sensitive data handling
ADR-RED-027 Cache catalog/governance
ADR-RED-028 Menu cache architecture
```

---

# 307. Phase 20 Policy Freeze Checklist

Before production resolve:

- [ ] Redis deployment topology.
- [ ] Cache/security/session workload separation.
- [ ] Sentinel vs Cluster vs managed Redis.
- [ ] Persistence per workload.
- [ ] maxmemory.
- [ ] Eviction policy.
- [ ] Memory headroom.
- [ ] Environment isolation.
- [ ] Service ACL/keyspace policy.
- [ ] Client command timeout.
- [ ] Client retry behavior.
- [ ] Cache breaker/bypass policy.
- [ ] Key naming convention.
- [ ] Cache schema version format.
- [ ] Serialization format.
- [ ] TTL defaults/categories.
- [ ] Jitter percentage/range.
- [ ] Invalidation convention.
- [ ] Event-driven invalidation versioning.
- [ ] Stampede strategy.
- [ ] Negative cache TTL.
- [ ] L1/L2 policy.
- [ ] Replica read policy.
- [ ] Guest cart authority.
- [ ] Menu personalized cache/cardinality decision.
- [ ] Inventory advisory-cache TTL.
- [ ] Wallet/Loyalty/Mission list TTLs.
- [ ] Identity JWKS TTL.
- [ ] Permission cache revocation latency.
- [ ] Rate-limit algorithms.
- [ ] Password-reset dimensions.
- [ ] Cross-identifier/shared-subject cooldown.
- [ ] Security Redis fail behavior.
- [ ] OTP challenge durability.
- [ ] Session/revocation Redis boundary.
- [ ] Critical idempotency DB requirement.
- [ ] Distributed-lock allowed use cases.
- [ ] Backup/restore policy.
- [ ] Cold-start protection.
- [ ] SLOs/alerts.
- [ ] Cache catalog ownership.

---

# 308. Acceptance — Ownership

For each key the team can answer:

```text
Which service owns it?
What is the authoritative source?
Who may write it?
```

---

# 309. Acceptance — Disposable Cache

Delete every normal cache key.

Expected:

```text
system remains functionally correct
cache repopulates
```

---

# 310. Acceptance — Cache Key

Every key has documented:

```text
prefix
dimensions
version
TTL
expected cardinality
data classification
```

---

# 311. Acceptance — Freshness

For each cache the team can explain:

```text
TTL
invalidation
versioning
stale-read tolerance
```

---

# 312. Acceptance — Stampede

When one hot key expires under heavy traffic:

```text
source load remains bounded
```

---

# 313. Acceptance — Redis Outage

For cache workloads:

```text
correctness remains intact
```

and source DB/API survives planned fallback load.

---

# 314. Acceptance — Critical State

Redis loss does not corrupt:

```text
Wallet balance
Inventory reservation
Payment state
Promotion redemption
Mission completion
Order transition
Points ledger
```

---

# 315. Acceptance — Rate Limits

Concurrent requests at threshold produce exact atomic allowed/blocked behavior.

---

# 316. Acceptance — Security Failure

Redis outage follows the documented rate-limit fail policy.

---

# 317. Acceptance — Cooldown

Password-reset cooldown cannot be bypassed by switching identifier when the policy defines a shared subject.

---

# 318. Acceptance — Distributed Lock

Only the owner token releases the lock.

Lock expiry prevents permanent deadlock.

---

# 319. Acceptance — Lock Safety

Losing the Redis lock cannot violate financial/stock/reward business invariants.

---

# 320. Acceptance — Cache Race

Old reader cannot overwrite a newer cache representation where version-based freshness is required.

---

# 321. Acceptance — Menu Cache

Shared menu cache uses stable content version.

Personalized layers use shorter TTL and acceptable cardinality.

---

# 322. Acceptance — Inventory

Cached availability may affect display only.

`ReserveInventory` always validates authoritative stock.

---

# 323. Acceptance — Wallet

Display summary may be cached.

Spend/reserve does not trust Redis summary.

---

# 324. Acceptance — Promotion

Definition/candidate data may be cached.

Final reservation/redemption is durable.

---

# 325. Acceptance — Mission

Mission list may be cached.

Progress/completion remains mission_db-authoritative.

---

# 326. Acceptance — Identity

JWKS/rate-limit/revocation caches work while credential/session security truth remains durable where required.

---

# 327. Acceptance — Idempotency

Evicting Redis idempotency cache cannot cause critical operation duplicate because durable DB uniqueness remains.

---

# 328. Acceptance — Key Expiry

No critical business workflow depends on receiving Redis `expired` notification.

---

# 329. Acceptance — Kafka Boundary

Redis Pub/Sub/Streams are not used as replacement for durable cross-service Kafka events.

---

# 330. Acceptance — Memory

Realistic key count/value size/TTL distribution fits with operational headroom.

---

# 331. Acceptance — Eviction

Only workloads designed to tolerate eviction are affected under memory pressure.

---

# 332. Acceptance — Failover

Primary failure causes client recovery within approved behavior without business corruption.

---

# 333. Acceptance — Rolling Deployment

Old/new pods safely coexist with incompatible payload changes via versioned namespace.

---

# 334. Acceptance — Security

Service credentials cannot:

```text
FLUSHALL
CONFIG
DEBUG
SHUTDOWN
```

and cannot access unauthorized keyspaces.

---

# 335. Acceptance — Observability

Operators can answer:

```text
Which cache has low hit ratio?
Which cache is stale?
Are evictions occurring?
Is one key hot?
Is Redis slow?
Are rate-limit Redis errors increasing?
Can source survive bypass?
```

---

# 336. Phase 20 Completion Tree

```text
PHASE 20 — REDIS / CACHING

├── Redis Scope                              ✅
├── Ownership                               ✅
├── Source-of-Truth Rule                    ✅
├── Cache Categories                        ✅
├── Cache-Aside                             ✅
├── Read / Write Guidance                   ✅
├── Consistency Models                      ✅
├── Key Naming                              ✅
├── Environment Isolation                   ✅
├── Sensitive Keys                          ✅
├── Serialization                           ✅
├── TTL                                     ✅
├── TTL Jitter                              ✅
├── Invalidation                            ✅
├── Versioned Keys                          ✅
├── Dependency Graph                        ✅
├── Warm-Up                                 ✅
├── Stampede Protection                     ✅
├── Single-Flight                           ✅
├── Stale-While-Revalidate                  ✅
├── Negative Cache                          ✅
├── Hot-Key Handling                        ✅
├── L1 / L2 Cache                           ✅
├── Memory Planning                         ✅
├── Eviction                                ✅
├── Workload Separation                     ✅
├── Persistence                             ✅
├── HA / Sentinel / Cluster                 ✅
├── Redis Transactions / Lua                ✅
├── Distributed Locks                       ✅
├── Rate Limiting                           ✅
├── Cooldowns                               ✅
├── Session / Temp State                    ✅
├── JWT / Revocation Cache                  ✅
├── JWKS Cache                              ✅
├── Idempotency Acceleration                ✅
├── Bloom / Counters                        ✅
├── Pub/Sub / Streams Boundary              ✅
├── Expiry Notification Boundary            ✅
├── Kafka Invalidation                      ✅
├── Cache Race Protection                   ✅
├── Catalog/Menu Rules                      ✅
├── Inventory Rules                         ✅
├── Cart Rules                              ✅
├── Order Rules                             ✅
├── Payment Rules                           ✅
├── Wallet Rules                            ✅
├── Promotion Rules                         ✅
├── Loyalty Rules                           ✅
├── Mission Rules                           ✅
├── Notification Rules                      ✅
├── Identity Rules                          ✅
├── Integration Rules                       ✅
├── Client Timeout / Bypass                 ✅
├── Security / ACL / TLS                    ✅
├── Metrics / Alerts / Dashboard            ✅
├── Logging / Tracing                       ✅
├── Runbooks                                ✅
├── Backup / DR                             ✅
├── Cache Version Migration                 ✅
├── Testcontainers / Failure Tests          ✅
├── Redis Governance                        ✅
├── Cache Catalog                           ✅
└── Testing Handoff                         ✅
```

---

# 337. Handoff to Phase 21

The next official implementation phase is:

```text
PHASE 21 — Testing
```

Phase 21 will prove the completed architecture through:

```text
Testing Pyramid
Unit Tests
Domain Tests
Application Tests
Integration Tests
PostgreSQL Testcontainers
Redis Testcontainers
Kafka Tests
Contract Tests
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

---

# 338. Redis → Testing Boundary

Phase 20 defines:

```text
what Redis behavior must be correct
```

Phase 21 defines:

```text
how the platform continuously proves it
```

Key verification areas include:

```text
Redis unavailable
stale cache
cache race
stampede
eviction
rate-limit atomicity
lock ownership
failover
hot key
memory pressure
rolling deployment
```

---

# 339. Final Phase 20 Principle

Default read:

```text
Request
  ↓
Redis
 ├── HIT → Response
 └── MISS
      ↓
   Authoritative Source
      ↓
   Populate Cache
      ↓
   Response
```

Default write:

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
Promotion Redemption
Mission Completion
Order Transitions
Points Ledger
Durable Integration State
```

The most important implementation rules are:

```text
Every cache has one clear owner.
Every cache has one authoritative source.
Services do not directly mutate another service's cache.
Redis cache is disposable.
Cache-aside is the default.
Critical writes commit durable state before cache invalidation/update.
Every cache has an explicit TTL unless exception is documented.
TTL jitter reduces synchronized expiry.
Versioned keys simplify incompatible cache schema changes.
Personalized caches require cardinality/memory review.
Delete/version on source updates rather than trusting TTL alone for important freshness.
Event-driven invalidation may use Kafka.
Out-of-order invalidation/update is protected by source versions where required.
Single-flight protects the source during hot misses.
Redis refresh locks are short and bounded.
Stale-while-revalidate is only for stale-tolerant read data.
Negative caching protects repeated misses but uses short TTL.
Hot keys require targeted L1/replica/sharding mitigation.
Memory, maxmemory, eviction, and headroom are designed explicitly.
Security/rate-limit/temp-state workloads may require separate Redis capacity.
Redis persistence does not turn Redis into a financial ledger.
Distributed locks are never the only correctness protection for financial/business invariants.
Database atomic updates remain authoritative for Inventory, Wallet, Promotion, and reward quantities.
Rate limits use atomic Redis operations.
Security rate-limit fail-open/fail-closed behavior is explicit.
Cross-identifier cooldown keys represent the real policy subject.
Refresh-token/security audit truth remains durable where required.
Redis idempotency keys accelerate durable idempotency rather than replace it.
Redis Pub/Sub is not a Kafka replacement.
Redis key-expiry notifications never drive critical business workflows.
Redis failure should degrade performance rather than business correctness for cache workloads.
Client command timeouts and cache bypass prevent Redis latency from collapsing request threads.
Dangerous Redis commands are denied to application credentials.
Sensitive keys/values are hashed/encrypted as required.
Redis HA/failover and replica-staleness behavior are tested.
Cold-cache/source-load behavior is tested before production.
Every Redis use case exists in the Cache Catalog.
Redis is added only after measuring a real caching need.
```

---

**End of PHASE 20 — Redis / Caching**
