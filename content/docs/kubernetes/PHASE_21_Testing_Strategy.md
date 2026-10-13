---
title: "PHASE 21 — Testing Strategy"
---

# PHASE 21 — Testing Strategy

> **Purpose:** Implement the complete verification strategy for the microservices platform so architecture decisions, domain invariants, contracts, persistence rules, distributed workflows, concurrency controls, security requirements, performance expectations, migrations, resilience, observability, and recovery behavior are proven by repeatable evidence before production.
>
> **Previous Phase:** Phase 20 — Redis / Caching
>
> **Next Phase:** Phase 22 — Docker
>
> **Primary Architecture Basis:** PART 25 — Testing Strategy, supported by all completed implementation phases 00–20.
>
> **Primary Stack:** Java, Spring Boot, JUnit 5, AssertJ, Mockito, Testcontainers, PostgreSQL, Kafka, Redis, REST/gRPC, OpenAPI, Protobuf, WireMock/MockWebServer, Awaitility, Gatling/JMeter/k6 where selected, OWASP/security tooling, GitLab CI/CD.
>
> **Status:** Platform Quality Engineering / Implementation Specification

---

# 1. Phase 21 Goal

Build a production-grade testing system that can prove:

```text
business rules are correct
service contracts remain compatible
database constraints and locking behave correctly
critical writes are idempotent
concurrent requests preserve invariants
distributed workflows converge
failure paths recover safely
security controls work
performance meets approved targets
migrations are safe
deployments remain backward compatible
backup/restore actually works
observability and operational recovery are usable
```

---

# 2. Testing Goal

The goal is not:

```text
maximum number of tests
maximum coverage percentage
```

The goal is:

```text
confidence proportional to business risk
```

---

# 3. Core Testing Principles

```text
test behavior, not implementation trivia
test invariants close to the domain
test real infrastructure where integration matters
test failure paths as seriously as happy paths
test idempotency explicitly
test concurrency explicitly
test contracts independently of deployment
test migrations before production
test observability
test recovery behavior
```

---

# 4. Risk-Based Testing

Higher-risk areas require deeper evidence.

Highest-risk examples:

```text
Payment
Wallet
Inventory reservation
Promotion redemption
Order Saga
Authentication
Password reset
Reward assignment
Idempotency
Concurrency
Data migration
```

---

# 5. Lower-Risk Areas

Examples:

```text
display-only metadata
non-critical cache
read-only informational endpoint
```

These still require correctness but not the same test depth as financial/scarce state.

---

# 6. Test Pyramid

Recommended:

```text
                 E2E
              /       \
        Integration / Contract
       /                   \
 Application / Component Tests
      /                     \
          Unit / Domain Tests
```

---

# 7. Pyramid Principle

Most tests should be:

```text
fast
deterministic
local
```

Fewer tests should be:

```text
slow
cross-service
end-to-end
```

---

# 8. Primary Test Layers

```text
Unit
Domain
Application
Persistence
Integration
Contract
Messaging
Concurrency
Security
Performance
E2E
Chaos / Failure
Migration
Operational
```

---

# 9. Unit Test

Verifies:

```text
one small behavior
without real external infrastructure
```

Examples:

```text
money rounding
state transition
eligibility rule
discount formula
reward distribution score
```

---

# 10. Domain Test

Verifies:

```text
aggregate invariants
value objects
business policies
state machines
```

Domain tests should not require:

```text
Spring
PostgreSQL
Kafka
Redis
HTTP server
```

---

# 11. Application Test

Verifies:

```text
use-case orchestration
port interactions
transaction decisions
event creation
failure mapping
compensation choice
```

Use mocks/fakes at external ports.

---

# 12. Persistence Test

Verifies real:

```text
PostgreSQL behavior
constraints
locking
isolation
indexes
custom SQL
repositories
migrations
```

---

# 13. Integration Test

Uses realistic infrastructure:

```text
PostgreSQL
Kafka
Redis
HTTP mock provider
gRPC client/server
```

---

# 14. Contract Test

Proves provider/consumer agreement for:

```text
REST
OpenAPI
gRPC
Protobuf
Kafka event schema
webhook schema
external adapter contract
```

---

# 15. E2E Test

Proves a complete deployed business journey.

Examples:

```text
checkout
wallet top-up
coupon redemption
mission completion
order cancellation/refund
```

---

# 16. Chaos / Failure Test

Tests behavior under:

```text
timeouts
pod restarts
DB failure
Kafka outage
Redis outage
provider outage
network latency
duplicate messages
partial workflow failure
```

---

# 17. Test at the Lowest Effective Level

Examples:

```text
discount formula
→ Domain test

PostgreSQL uniqueness
→ Persistence integration test

Order → Payment contract
→ Contract test

Full checkout
→ E2E
```

---

# 18. Avoid E2E-Only Testing

E2E-only strategy becomes:

```text
slow
fragile
expensive
hard to diagnose
```

Push logic down to lower levels.

---

# 19. Avoid Unit-Only Testing

Mocks cannot prove:

```text
SQL semantics
row locking
transaction isolation
Kafka delivery/replay
Redis TTL
HTTP serialization
Flyway migration
```

Real integration tests are mandatory.

---

# 20. Test Naming

Recommended:

```text
given_condition_when_action_then_expected
```

or:

```text
should_expected_when_condition
```

Consistency matters most.

---

# 21. Arrange / Act / Assert

Use:

```text
Arrange
Act
Assert
```

Keep business intent visible.

---

# 22. One Primary Behavior Per Test

One test should mainly explain:

```text
one rule
one invariant
one failure mode
```

Avoid huge unrelated assertion blocks.

---

# 23. Deterministic Tests

Tests must not depend on:

```text
real current clock
uncontrolled random values
internet access
shared mutable test data
execution order
```

---

# 24. Clock Control

Inject:

```java
java.time.Clock
```

or platform time abstraction.

Critical for:

```text
expiry
promotion windows
mission periods
JWT expiry
reservation TTL
reward expiry
points expiry
scheduled notifications
```

---

# 25. Randomness Control

Inject/randomize deterministically for:

```text
reward selection
coupon/reference generation
controlled randomness
```

Use seed or RandomSource abstraction.

---

# 26. UUID / ID Control

Normally assert:

```text
non-null
valid format
stable across retry
```

Inject ID generator only when exact identity matters.

---

# 27. Test Fixtures

Maintain domain-oriented fixtures:

```text
OrderFixture
PaymentFixture
WalletFixture
MissionFixture
PromotionFixture
CustomerFixture
InventoryFixture
```

---

# 28. Fixture Readability

Good:

```text
anActivePromotion()
aCompletedPickupOrder()
aCustomerRegisteredOn(...)
aWalletWithAvailableBalance(...)
```

Avoid opaque constructors with dozens of positional fields.

---

# 29. Test Data Builder Rule

Builders provide:

```text
safe defaults
valid domain state
explicit overrides
```

---

# 30. Invalid Fixtures

For invalid-state tests:

```text
explicit invalid test helper
```

Do not weaken production domain invariants.

---

# 31. Test Isolation

Each test:

```text
creates own data
cleans up automatically
does not depend on another test
```

---

# 32. Parallel Test Safety

Use:

```text
unique IDs
isolated schema/container where needed
no fixed ports
no shared mutable globals
```

---

# 33. Test Tags

Recommended:

```text
unit
integration
contract
e2e
performance
security
migration
chaos
```

---

# 34. Execution Frequency

Illustrative source strategy:

```text
Every commit:
  unit
  application
  fast integration

Merge request:
  unit
  integration
  contract
  migration

Main / nightly:
  E2E
  security
  longer integration
  larger concurrency

Scheduled / pre-release:
  performance
  chaos
  DR / restore
```

---

# 35. Java Testing Standard

Use:

```text
JUnit 5
AssertJ
Mockito
```

---

# 36. JUnit 5

Default unit/application/integration test framework for Java services.

---

# 37. AssertJ

Use for readable domain assertions.

---

# 38. Mockito

Appropriate for:

```text
application port interaction
provider port
clock
ID generator
exception/failure path
call verification when meaningful
```

---

# 39. What Not to Mock

Avoid unnecessary mocking of:

```text
value objects
simple entities
domain policies
money objects
```

---

# 40. Over-Mocking Risk

Example:

```text
mock repository says save succeeds
real PostgreSQL unique constraint rejects
```

Mocks cannot replace persistence tests.

---

# 41. Domain Coverage Priorities

Prioritize:

```text
state machines
money
eligibility
limits
concurrency policy
compensation decisions
```

before getters/setters.

---

# 42. Money Tests

Test:

```text
decimal precision
scale
rounding
currency mismatch
negative amount rejection
maximum values
```

Use exact decimal representations.

---

# 43. Boundary-Value Testing

Example minimum spend:

```text
9.99
10.00
10.01
```

---

# 44. State-Machine Tests

For every aggregate lifecycle:

```text
valid transitions
invalid transitions
terminal-state behavior
repeated command behavior
```

---

# 45. Property-Based Testing

Useful for invariants with many combinations.

Examples:

```text
refund total <= captured amount
wallet available >= 0
discount <= eligible amount
inventory available >= 0
```

---

# 46. Mutation Testing

Optional for critical domain modules.

Use selectively to identify tests that execute code but fail to verify meaningful behavior.

---

# 47. Application Use-Case Tests

Verify:

```text
ports called
call order where business-significant
failure mapping
transaction decision
event creation
compensation decision
```

---

# 48. Create Order Application Test

Possible mocked ports:

```text
CatalogPort
InventoryPort
PaymentPort
PromotionPort
WalletPort
```

Assert orchestration policy.

---

# 49. Application vs Integration

Application test proves:

```text
orchestration decisions
```

Integration test proves:

```text
actual transport/persistence behavior
```

---

# 50. Spring Boot Context

Use:

```text
@SpringBootTest
```

only when full context provides real value.

Do not start Spring for every domain test.

---

# 51. Slice Tests

Useful:

```text
@WebMvcTest
@DataJpaTest
```

for focused framework integration.

---

# 52. Testcontainers Standard

Preferred real infrastructure:

```text
PostgreSQL
Kafka
Redis
```

---

# 53. Avoid H2 for PostgreSQL Semantics

H2 differs in:

```text
SQL
locking
JSONB
indexes
constraints
transactions
```

Use actual PostgreSQL container.

---

# 54. PostgreSQL Testcontainer

Test:

```text
Flyway
constraints
indexes
locking
isolation
JSONB
custom SQL
queries
```

---

# 55. Testcontainer Lifecycle

Options:

```text
one container per class
reusable container per suite
```

Balance:

```text
speed
isolation
```

---

# 56. Database Cleanup

Use deterministic:

```text
transaction rollback
TRUNCATE
schema reset
container recreation
```

depending suite.

---

# 57. Flyway Fresh Install Test

Start empty PostgreSQL and run all migrations.

Expected:

```text
all migrations apply
schema matches expected state
```

---

# 58. Migration Upgrade Test

For risky migrations:

```text
previous production schema
→ new schema
```

---

# 59. Rolling Migration Compatibility

Verify required deployment window:

```text
old app + new schema
```

still works during expand/contract rollout.

---

# 60. Destructive Migration Test

Never test only empty DB.

Use representative previous data.

---

# 61. Database Constraint Tests

Test:

```text
UNIQUE
FOREIGN KEY
CHECK
NOT NULL
partial index behavior
```

---

# 62. Business Uniqueness Constraints

Examples:

```text
one reward assignment per source
one wallet top-up per payment/reference
one coupon redemption reference
one idempotency key per scope
```

---

# 63. Repository Tests

Test:

```text
save
find
pagination
locking query
optimistic version
custom SQL
```

---

# 64. Index Validation

Functional tests do not prove index performance.

For critical queries use:

```sql
EXPLAIN ANALYZE
```

in performance validation.

---

# 65. Query Plan Testing

Track acceptable plan shape for high-volume queries.

Avoid brittle exact-plan matching.

---

# 66. Transaction Isolation Tests

Real race scenarios required for:

```text
wallet reserve
inventory reserve
promotion usage
reward quantity
```

---

# 67. Concurrency Test Environment

Use:

```text
multiple threads
multiple DB connections
real PostgreSQL
```

---

# 68. Inventory Concurrency Example

```text
available = 1
100 simultaneous reservations

Expected:
1 success
99 failure
stock never negative
```

---

# 69. Optimistic Lock Test

Two readers load:

```text
version = 5
```

Both modify.

Expected where applicable:

```text
one commits
one version conflict
```

---

# 70. Pessimistic Lock Test

Verify:

```sql
SELECT ... FOR UPDATE
```

actually serializes the critical section.

---

# 71. Deadlock Test

For multi-row operations:

```text
test deterministic lock ordering
```

and expose deadlock risk with concurrent transactions.

---

# 72. Deadlock Retry Test

If deadlock retry is supported:

```text
retry is bounded
business effect occurs once
```

---

# 73. Idempotency Test Standard

Every critical write tests:

```text
same key + same request
same key + changed request
concurrent same key
response lost + retry
in-progress duplicate
```

---

# 74. Same Key / Same Request

Expected:

```text
same logical result
same resource reference
no duplicate side effect
```

---

# 75. Same Key / Different Request

Expected:

```text
IDEMPOTENCY_KEY_REUSED
```

or equivalent conflict.

---

# 76. Concurrent Same Key

Expected:

```text
one request executes
other reuses / waits / receives in-progress
```

---

# 77. Lost Response Retry

Simulate:

```text
server commits
client never receives response
client retries
```

Expected:

```text
committed result returned
no duplicate operation
```

---

# 78. Permanent Business Uniqueness

Where appropriate, critical financial/scarce operation is also protected by permanent unique business reference.

---

# 79. REST API Tests

Verify:

```text
request validation
authentication
authorization
status code
response schema
error code
pagination
idempotency header
```

---

# 80. Controller Test Scope

Controller test focuses on:

```text
transport mapping
```

not re-testing domain rules.

---

# 81. HTTP Status Tests

Include:

```text
400 invalid request
401 unauthenticated
403 unauthorized
404 not found
409 conflict
422 failed precondition/business rule
429 rate limit
503 dependency unavailable
```

---

# 82. Error Envelope Test

Verify:

```text
code
message
request_id
details
```

according to platform contract.

---

# 83. Pagination Tests

Test:

```text
first page
middle page
last page
empty page
invalid cursor
maximum page size
```

---

# 84. Keyset Pagination

During concurrent inserts verify:

```text
stable ordering
no duplicate records
no skipped records
```

within contract semantics.

---

# 85. REST Serialization

Verify:

```text
datetime
money/decimal
enum
null behavior
language
```

---

# 86. OpenAPI Validation

CI verifies implementation/documentation compatibility.

---

# 87. REST Contract Test

Verify:

```text
required fields
response fields
errors
status mapping
backward-compatible change
```

---

# 88. gRPC Tests

Verify:

```text
request/response mapping
deadline
auth metadata
status code
protobuf compatibility
```

---

# 89. gRPC Status Tests

Include:

```text
INVALID_ARGUMENT
NOT_FOUND
ALREADY_EXISTS
FAILED_PRECONDITION
ABORTED
RESOURCE_EXHAUSTED
UNAVAILABLE
DEADLINE_EXCEEDED
```

---

# 90. Protobuf Compatibility

CI rejects:

```text
field number reuse
incompatible type changes
breaking enum changes
```

---

# 91. Deadline Propagation

Verify deadlines propagate and expensive downstream work stops where safe after cancellation/deadline.

---

# 92. Kafka Testcontainers

Use real Kafka for:

```text
producer
consumer
partition key
headers
serialization
retry
DLQ
```

---

# 93. Kafka Producer Test

Assert:

```text
topic
key
event envelope
schema
headers
```

---

# 94. Kafka Consumer Test

Assert:

```text
event deserialized
handler invoked
business transaction succeeds
offset commits after success
```

---

# 95. Duplicate Kafka Event

Publish same:

```text
event_id
```

twice.

Expected:

```text
one business effect
```

---

# 96. Kafka Consumer Crash

Simulate:

```text
DB commit
consumer crash before offset commit
```

Replay must become safe no-op via Inbox/idempotency.

---

# 97. Outbox Test

Assert:

```text
business state change
+
outbox row
```

commit atomically.

---

# 98. Outbox Retry

Kafka unavailable:

```text
business transaction commits
outbox remains pending
publisher retries
```

---

# 99. Duplicate Outbox Publish

Simulate:

```text
Kafka publish succeeds
publisher crashes before published flag update
```

Downstream duplicate remains safe.

---

# 100. Retry Topic Test

```text
transient failure
→ retry
→ success
```

Metadata remains preserved.

---

# 101. DLQ Test

Permanent failure:

```text
bounded retry
→ DLQ
```

DLQ contains:

```text
original event
failure metadata
```

---

# 102. Replay Test

Replay DLQ/historical event with same event identity.

Expected:

```text
idempotent safe behavior
```

---

# 103. Event Ordering Test

For same aggregate key:

```text
v1
v2
v3
```

arrives/processed according to partition-order contract.

---

# 104. Stale Event Test

If current version is 5 and event version 3 arrives:

```text
ignore/reconcile according to consumer contract
```

---

# 105. Schema Evolution Test

Older consumer must continue with supported additive event changes.

---

# 106. Unsupported Event Version

Expected:

```text
DLQ / alert
```

not silent interpretation.

---

# 107. Redis Testcontainers

Use real Redis to test:

```text
TTL
Lua
rate limits
cache serialization
locks
atomic operations
```

---

# 108. Cache Hit/Miss Test

```text
first request → source
second request → Redis
```

---

# 109. Cache Expiry Test

Expired cache reloads from source.

---

# 110. Cache Invalidation Test

After source update:

```text
old representation is not served
```

---

# 111. Cache Stampede Test

Many requests after expiration:

```text
source requests remain bounded
```

---

# 112. Redis Failure Test

Redis unavailable:

```text
cache falls back
business correctness remains intact
```

for cache workloads.

---

# 113. Rate-Limit Atomicity Test

Concurrent requests at boundary must produce exact permitted count.

---

# 114. Redis Lock Test

Verify:

```text
one owner
wrong owner cannot release
TTL expiry
```

---

# 115. Security Rate-Limit Redis Failure

When Redis unavailable verify documented:

```text
fail-open
or
fail-closed/local fallback
```

per endpoint.

---

# 116. External Provider Test Harness

Use:

```text
WireMock
MockWebServer
```

for:

```text
HTTP status
latency
malformed payload
disconnect
headers
timeouts
```

---

# 117. Provider Adapter Test

Verify:

```text
authentication headers
request body
timeout
status mapping
error mapping
idempotency/reference headers
```

---

# 118. Provider Timeout Test

Delay response beyond timeout.

Expected canonical result:

```text
TIMEOUT
or
UNKNOWN
```

according to side-effect semantics.

---

# 119. Provider Unknown Outcome

Simulate:

```text
external side effect committed
connection dropped
```

System must not classify automatically as final failure.

---

# 120. Webhook Test

Verify:

```text
valid signature
invalid signature
duplicate event
expired/old timestamp
unsupported version
unknown reference
```

---

# 121. Raw-Body Signature Test

When provider signs raw body:

```text
verification happens before transformations that alter bytes
```

---

# 122. Webhook Replay Test

Same provider event twice:

```text
one business effect
```

---

# 123. Contract Scope

Contracts include:

```text
REST
gRPC
Kafka
webhooks
external providers
```

---

# 124. Contract Ownership

Provider service defines canonical contract.

Consumer verifies assumptions independently.

---

# 125. Consumer-Driven Contract

Useful when:

```text
many consumers
independent deployment cadence
```

Do not force provider to preserve accidental implementation details.

---

# 126. Pact-Style Testing

Optional.

Alternative:

```text
OpenAPI
generated examples
integration tests
```

---

# 127. Schema Registry Gate

Kafka/event schema compatibility checked before merge.

---

# 128. Breaking Contract Gate

Reject unauthorized:

```text
field removal
required-property change
incompatible protobuf
breaking event schema
```

---

# 129. Breaking Compatibility Exception

Requires:

```text
new major contract version
migration plan
consumer inventory
rollout plan
```

---

# 130. Per-Service Test Matrix

Each service maintains:

```text
Domain
Application
DB
API
Events
Concurrency
Failure
Security
Performance
```

---

# 131. Identity Test Matrix

Highest-risk Identity areas:

```text
registration
login
password hashing
JWT
key rotation
refresh rotation
reuse detection
logout/revocation
password reset
rate limits
MFA/passkey if used
```

---

# 132. Password Hash Test

Verify:

```text
correct password accepted
wrong password rejected
hash never exposed
rehash policy
```

---

# 133. JWT Test

Verify:

```text
signature
issuer
audience
expiry
not-before
kid
claims
```

---

# 134. Key Rotation Test

Verify:

```text
old valid token works during grace
new tokens use new kid
old key eventually rejected
```

---

# 135. Refresh Rotation Test

Verify:

```text
refresh token used once
new token issued
old token reuse triggers family revocation
```

when that model applies.

---

# 136. Password Reset Test

Verify:

```text
request
generic response/enumeration protection
rate limits
cooldown
OTP/challenge
attempt count
expiry
verify
confirm
password change
session/token invalidation
```

---

# 137. Customer Service Test Focus

```text
profile updates
contact boundaries
addresses
consent/preferences
anonymization
concurrency
```

---

# 138. Address Snapshot Test

Order address snapshot remains unchanged when Customer later edits address.

---

# 139. Catalog Tests

Focus:

```text
product/menu
modifiers
effective price
publication/versioning
store/channel
cache
```

---

# 140. Catalog Publication Test

Draft changes do not alter active published menu before publish.

---

# 141. Catalog Version Test

Historical Order snapshot remains interpretable after new Catalog version.

---

# 142. Inventory Tests

Focus:

```text
reserve
release
consume
expiry
adjustment
concurrency
reconciliation
```

---

# 143. Inventory Non-Negative Invariant

Under concurrent flows:

```text
available never negative
```

---

# 144. Inventory Expiry

Expired reservation releases quantity exactly once.

---

# 145. Cart Tests

Focus:

```text
item merge
modifier identity
optimistic version
guest/auth merge
expiry
validation
```

---

# 146. Cart Line Identity

Same product + exact same modifiers:

```text
merge quantity
```

Different modifier selection:

```text
separate line
```

---

# 147. Cart Optimistic Concurrency

Two clients modify same version.

Expected:

```text
one accepted
one conflict/reload path
```

---

# 148. Order Tests

Focus:

```text
state machine
snapshots
idempotency
checkout Saga
cancellation
completion
history
```

---

# 149. Order State Matrix

Test:

```text
every allowed transition
every invalid transition
terminal behavior
duplicate command
```

---

# 150. Order Snapshot Test

Historical:

```text
name
price
modifier
address
promotion
```

does not mutate when source changes.

---

# 151. Order Idempotency

Retry CreateOrder with same key:

```text
same Order
```

---

# 152. Payment Tests

Focus:

```text
intent
attempt
authorization
capture
void
refund
provider webhook
UNKNOWN
reconciliation
```

---

# 153. Payment Money Invariant

Where auth/capture model exists:

```text
captured <= authorized
```

---

# 154. Refund Limit

Concurrent refunds must satisfy:

```text
successful_refund_total <= captured_amount
```

---

# 155. Payment Webhook

Duplicate/out-of-order callbacks must not regress financial state.

---

# 156. Payment Unknown Outcome

Simulate:

```text
provider charge succeeds
response lost
```

Expected:

```text
UNKNOWN
query/reconcile
no second charge
```

---

# 157. Wallet Tests

Focus:

```text
ledger
reserve
capture
release
top-up
refund
reversal
concurrency
reconciliation
```

---

# 158. Wallet Ledger Test

Every balance effect produces immutable ledger entry.

---

# 159. Wallet Balance Invariant

Unless overdraft explicitly allowed:

```text
available >= 0
reserved >= 0
```

---

# 160. Wallet Double-Spend Test

Concurrent reservations exceeding balance:

```text
only allowable total succeeds
```

---

# 161. Wallet Top-Up Idempotency

Same external payment/top-up reference:

```text
credits once
```

---

# 162. Loyalty Tests

Focus:

```text
earn
redeem
expiry
tier
reward assignment
distribution
reconciliation
```

---

# 163. Points Ledger Reconciliation

```text
sum of immutable ledger entries
=
account projection
```

according to defined model.

---

# 164. Points Expiry

Expired lots reduce redeemable balance exactly per policy.

---

# 165. FEFO Test

Redeem earliest-expiring eligible points first where FEFO is the approved rule.

---

# 166. Reward Distribution

For proportional distribution:

```text
actual assignment converges toward configured weights
```

within approved tolerance/sample.

---

# 167. Controlled Randomness

Randomized selection still respects:

```text
quantity limits
eligibility
configured weighting policy
```

---

# 168. Promotion Tests

Focus:

```text
eligibility
discount math
stacking
coupon lifecycle
usage limits
budget
concurrency
```

---

# 169. Promotion Percentage/Cap

Example:

```text
20% off
max $5
```

test below/at/above cap.

---

# 170. Promotion Global Limit

One usage slot remains.

Many concurrent reservations.

Expected:

```text
exactly one success
```

---

# 171. Promotion Budget

Concurrent reservation/redemption must not exceed configured budget.

---

# 172. Coupon Ownership

Assigned coupon cannot be redeemed by another customer.

---

# 173. Mission Tests

Focus:

```text
Journey eligibility
Campaign eligibility
COUNT
SUM
DISTINCT_COUNT
FIRST_OCCURRENCE
completion
reward
expiry
```

---

# 174. Journey Period Boundary

Test customer registration:

```text
before
exactly at
after
user_period_start
```

---

# 175. Prior Journey Completion

If completed before eligible period:

```text
hidden
no duplicate reward
```

according to Mission policy.

---

# 176. First Pickup

Only canonical:

```text
OrderCompleted + PICKUP
```

completes First Pickup.

---

# 177. First Dine-In

Only canonical:

```text
DINE_IN
```

qualifies.

---

# 178. First Feedback

All configured feedback types count according to approved business rule.

---

# 179. Explore Stores

Use distinct store count.

Repeated same store does not advance.

---

# 180. Mission Completion Race

Two qualifying events concurrently cross target.

Expected:

```text
one completion
one reward trigger
```

---

# 181. Notification Tests

Focus:

```text
dedupe
templates
localization
preferences
scheduling
expiry
provider retry
device tokens
```

---

# 182. Notification Dedupe

Replay same OrderReady business event.

Expected:

```text
one logical notification
```

---

# 183. Notification Localization

Khmer missing:

```text
fallback English
```

when configured.

---

# 184. Marketing Preference

Opted-out customer:

```text
marketing notification not sent
```

---

# 185. Mandatory Security Notification

Verify security/mandatory policy independently of marketing preference.

---

# 186. Notification Provider Failure

```text
429/503 → bounded retry
invalid token → final failure/deactivation
```

---

# 187. Integration / ACL Tests

Focus:

```text
mapping
sentinel values
idempotency
webhook
polling
UNKNOWN
reconciliation
```

---

# 188. Legacy Sentinel Test

Canonical:

```text
guest = true
```

Legacy sentinel appears only inside adapter.

Core remains sentinel-free.

---

# 189. Status Mapping

Every known external status maps explicitly.

Unknown status:

```text
rejected / quarantined
```

according to integration policy.

---

# 190. Polling Watermark

Restart poller.

Expected:

```text
no missing business records
no duplicate business effect
```

---

# 191. Saga Testing Standard

Every critical Saga tests:

```text
happy path
failure of every forward step
every compensation
UNKNOWN result
crash recovery
concurrency
manual intervention
```

---

# 192. Checkout Saga Happy Path

Final state converges according to selected workflow:

```text
Order confirmed
Inventory correct
Payment correct
Promotion correct
Saga completed
```

---

# 193. Saga Failure Matrix

For every step:

```text
force failure
verify compensation
verify final state
verify no duplicate side effect
```

---

# 194. Compensation Failure

Temporary compensation failure enters:

```text
COMPENSATION_PENDING
```

or canonical equivalent, then recovers.

---

# 195. Manual Intervention

Permanent compensation failure results in:

```text
MANUAL_INTERVENTION
alert
operator visibility
```

where defined.

---

# 196. Saga Crash Matrix

Crash at:

```text
before participant call
after participant success
before Saga state update
after Saga update
before next step
during compensation
```

Verify recovery.

---

# 197. Saga Unknown Outcome

Response lost after side effect.

Recovery queries by stable business reference.

---

# 198. Saga Client Retry

Retry same checkout idempotency key.

Expected:

```text
same Saga / Order result
```

---

# 199. Concurrency Testing Strategy

Explicitly test:

```text
races
locks
versions
unique constraints
```

---

# 200. Concurrency Harness

Use:

```java
ExecutorService
CountDownLatch
CyclicBarrier
```

to coordinate simultaneous operations.

---

# 201. Start Barrier

All threads wait until common start signal.

This increases chance of exposing race conditions.

---

# 202. Repeat Critical Races

Nightly/CI may run:

```text
100–1000 iterations
```

for important nondeterministic races.

---

# 203. Concurrency Assertions

Assert final invariant after all threads finish.

Do not only inspect individual HTTP responses.

---

# 204. Concurrency Invariants

Examples:

```text
inventory never negative
wallet never double-spent
coupon limit not exceeded
reward quantity not exceeded
one mission completion
one idempotent order
```

---

# 205. Lock Timeout Test

When DB/coordination lock cannot be acquired in bounded time:

```text
retryable conflict
```

or documented failure; never hang indefinitely.

---

# 206. Security Test Strategy

Includes:

```text
authentication
authorization
object authorization
input validation
rate limiting
token handling
secret leakage
injection
dependency scanning
```

---

# 207. Authentication Tests

Verify:

```text
missing token
expired token
invalid signature
wrong issuer
wrong audience
revoked session where enforced
```

---

# 208. Authorization Tests

For privileged endpoint:

```text
allowed role/scope
denied role/scope
cross-customer/cross-tenant denial
```

---

# 209. Object-Level Authorization

Test Customer A cannot access Customer B's:

```text
orders
rewards
missions
notifications
addresses
wallet
```

---

# 210. Mass Assignment

Client cannot set protected:

```text
status
balance
role
discount
reward status
```

through generic binding.

---

# 211. SQL Injection

Target:

```text
search
filter
sort
legacy dynamic query
```

Use parameterized SQL / validated sort mapping.

---

# 212. XSS

Test user/admin-rendered:

```text
notification templates
feedback
promotion copy
mission copy
```

for proper escaping/sanitization.

---

# 213. SSRF

Configurable integration URLs cannot reach prohibited:

```text
metadata services
localhost
private networks
```

where policy blocks them.

---

# 214. XXE

SOAP/XML parsers reject external entity attacks.

---

# 215. Security Rate Limits

Test:

```text
bursts
distributed calls
identifier rotation
IP rotation where relevant
cooldown
```

---

# 216. Brute Force

Test repeated guesses for:

```text
login
password reset
coupon validation
```

where applicable.

---

# 217. Secret Leakage Test

Search responses/logs for:

```text
access token
refresh token
OTP
private key
provider secret
raw payment/card data
```

---

# 218. Log Redaction

Inject known secret marker.

Assert absent from logs.

---

# 219. SCA

CI runs software composition analysis against dependency vulnerabilities.

---

# 220. SAST

Static analysis checks:

```text
injection
unsafe crypto
hard-coded credentials
dangerous deserialization
```

---

# 221. DAST

Against isolated deployed environment, test:

```text
auth
headers
input validation
common web vulnerabilities
```

---

# 222. SBOM

Build produces a Software Bill of Materials and it is retained/scanned according to CI/security policy.

---

# 223. Performance Strategy

Prove:

```text
latency
throughput
resource use
scaling behavior
```

under expected and peak load.

---

# 224. Performance Test Types

```text
Baseline
Load
Stress
Spike
Soak
Capacity
Scalability
```

---

# 225. Baseline Test

Low controlled load establishes:

```text
normal latency
CPU
memory
DB calls
```

---

# 226. Load Test

Apply expected production peak and verify SLOs.

---

# 227. Stress Test

Increase past expected peak to identify:

```text
breaking point
failure mode
recovery behavior
```

---

# 228. Spike Test

Sudden burst examples:

```text
campaign launch
morning order burst
push-driven traffic
```

---

# 229. Soak Test

Long-duration load detects:

```text
memory leaks
connection leaks
cache growth
queue accumulation
GC issues
```

---

# 230. Capacity Test

Answers:

```text
requests per pod
DB connection demand
Kafka events/sec
Redis ops/sec
worker throughput
```

---

# 231. Performance Tool Standard

Select one primary tool:

```text
Gatling
k6
JMeter
```

For Java-heavy team, source identifies Gatling as a strong option.

---

# 232. Performance Environment

Match production characteristics:

```text
PostgreSQL version
Kafka version
Redis version
network topology
resource limits
```

Scale may differ but ratios/behavior should remain meaningful.

---

# 233. Production-Like Data

Include realistic:

```text
table size
index size
order/customer history
cache cardinality
mission data
promotion data
```

---

# 234. Load Model

Define:

```text
requests/sec
concurrent users
think time
endpoint mix
payload distribution
```

---

# 235. Peak Model

Use business peak estimates plus safety margin.

Do not test only averages.

---

# 236. Performance Assertions

Examples:

```text
P95 CreateOrder < approved target
P99 menu < approved target
error rate < approved target
Kafka lag < approved target
```

Actual targets come from NFR/SLO.

---

# 237. Resource Assertions

Observe:

```text
CPU
heap
GC
DB connections
Redis connections
Kafka lag
thread pools
```

---

# 238. Database Performance

Test high-volume queries at representative scale.

Examples from source:

```text
access-token query
order history
active mission
promotion candidate
outbox scan
```

---

# 239. Index Regression

Compare critical query latency/plan before release.

---

# 240. Cache Performance

Measure:

```text
hit ratio
miss load
stampede
Redis latency
DB fallback
```

---

# 241. Kafka Performance

Measure:

```text
producer throughput
consumer throughput
lag
partition skew
serialization cost
```

---

# 242. Saga Performance

Measure:

```text
checkout duration
participant latency
retry behavior
```

---

# 243. External Provider Load Tests

Do not load-test real partner without approval.

Use:

```text
mock
sandbox
```

with realistic latency/failure profiles.

---

# 244. Rate-Limiter Performance

Ensure rate limiter itself does not become bottleneck.

---

# 245. Performance Regression Gate

Critical endpoint degradation beyond approved threshold blocks release review.

Use noise tolerance.

---

# 246. Chaos Testing Principle

Chaos validates:

```text
resilience assumptions
```

not random destruction.

---

# 247. Chaos Experiment Definition

Every chaos experiment defines:

```text
hypothesis
blast radius
expected behavior
stop condition
```

---

# 248. Chaos Scenarios

```text
kill service pod
kill Kafka broker
stop Redis
inject DB latency
drop provider traffic
increase network delay
```

---

# 249. Pod Kill Test

Kill Order/Payment/consumer during workflow.

Verify:

```text
durable state not lost
recovery resumes
```

---

# 250. DB Failure

Temporarily deny/slow DB.

Verify:

```text
bounded timeout
no thread exhaustion
recovery after restore
```

---

# 251. Redis Outage Chaos

Verify:

```text
cache bypass/fallback
source protection
security rate-limit failure policy
```

---

# 252. Kafka Outage Chaos

Verify:

```text
Outbox accumulates
business transaction continues where designed
events publish after recovery
```

---

# 253. Network Latency

Inject downstream latency.

Verify:

```text
deadline
circuit breaker
retry budget
```

---

# 254. Provider 503 Storm

Verify:

```text
bounded retry
circuit breaker opens
no retry storm
```

---

# 255. Chaos Safety

Start in non-production.

Production chaos requires explicit maturity, approval, and blast-radius controls.

---

# 256. DR Tests

Test:

```text
database restore
Kafka replay
active Saga reconciliation
Redis cold start
secret recovery
```

---

# 257. Backup Restore

Backup is not trusted until restored successfully in a test environment.

---

# 258. Restore Consistency

After one service restore:

```text
reconcile against other services' current state
```

especially financial/scarce workflows.

---

# 259. Test Data Principles

Test data should be:

```text
synthetic
deterministic
privacy-safe
representative
```

---

# 260. No Raw Production PII

Do not copy raw production:

```text
name
phone
email
address
token
payment data
```

to lower environments without approved anonymization.

---

# 261. Synthetic Data

Generate realistic relationships among:

```text
customers
orders
products
payments
wallets
missions
promotions
rewards
```

---

# 262. Version-Controlled Seed Data

Examples:

```text
reference stores
products
roles
promotion definitions
mission definitions
```

---

# 263. Test Accounts

Maintain explicit:

```text
QA customer
QA staff
QA admin
```

for shared/deployed environments when needed.

---

# 264. Shared Environment Reset

Automate:

```text
cleanup
reseed
```

to reduce inconsistent shared data.

---

# 265. Test Run Namespace

Include:

```text
run_id
```

in safe references to avoid collisions.

---

# 266. External Sandbox Data

Use provider-supplied:

```text
test cards
sandbox accounts
test phone numbers
```

Never real customer financial instruments.

---

# 267. Time-Based Data

Use injected Clock instead of waiting real days.

---

# 268. Large Data Fixtures

Generate high-volume datasets only for:

```text
performance
pagination
query plan
migration
```

not normal unit tests.

---

# 269. Test Environments

```text
Local
CI Ephemeral
Shared DEV
UAT / Staging
Performance
Security
Production Smoke
```

---

# 270. Local

Developer can run:

```text
unit
Testcontainers integration
selected local service stack
```

without depending on shared infrastructure where possible.

---

# 271. CI Ephemeral

Create isolated:

```text
PostgreSQL
Kafka
Redis
service process
```

per job/suite.

---

# 272. Shared DEV

Useful for:

```text
manual integration
cross-team testing
```

Not the sole automated test environment.

---

# 273. UAT

Used for:

```text
business validation
release candidate
partner sandbox integration
```

UAT process is handled later in Phase 34.

---

# 274. Performance Environment

Isolated enough to avoid other users distorting results.

---

# 275. Security Environment

DAST/penetration tests must not target production unintentionally.

---

# 276. Environment Parity

Where possible match:

```text
Java major version
PostgreSQL major version
Kafka major version
Redis major version
```

---

# 277. Configuration Differences

May differ:

```text
URLs
credentials
scale
```

Business behavior should remain consistent.

---

# 278. Feature Flag Tests

For high-risk flags:

```text
flag off
flag on
```

must be tested.

---

# 279. Avoid Flag Combination Explosion

Test supported/realistic combinations, not every mathematical permutation.

---

# 280. Startup Configuration Tests

Missing required:

```text
environment variable
secret
URL
timeout
```

should fail clearly at startup.

---

# 281. Smoke Tests

After deployment verify safe:

```text
health
login
basic read
critical API
Kafka producer/consumer signal where safe
```

---

# 282. Production Smoke Safety

Do not trigger:

```text
real charge
notification spam
inventory corruption
```

Use dedicated synthetic accounts and non-destructive operations.

---

# 283. Synthetic Production Monitoring

Optional safe periodic synthetic:

```text
login
read flow
health/business probe
```

---

# 284. CI Pipeline

Recommended stages:

```text
compile
unit
static analysis
integration
contract
migration
package
container scan
deploy test
E2E
```

Performance/security can run scheduled/pre-release.

---

# 285. Fast Feedback

Unit/domain tests run early.

Simple failure should not wait for E2E.

---

# 286. Parallel CI

Parallelize independent suites/modules.

Avoid one giant sequential job.

---

# 287. Merge Quality Gate

Merge blocked when policy requires and:

```text
tests fail
migration fails
contract breaks
critical security finding exists
static quality gate fails
```

---

# 288. Flaky Test Policy

A flaky test is:

```text
a defect
```

not harmless noise.

---

# 289. Flaky Test Quarantine

Temporary only with:

```text
ticket
owner
expiry date
```

---

# 290. Test Retry

Automatic retry may diagnose flake but must not hide it.

Track first-run failure rate.

---

# 291. CI Failure Diagnostics

Retain:

```text
logs
JUnit XML
container logs
DB/Kafka diagnostics where useful
```

---

# 292. Test Reports

Publish:

```text
unit result
integration result
coverage
security scan
contract compatibility
performance where relevant
```

---

# 293. Coverage Philosophy

Coverage is:

```text
a signal
```

not a quality objective by itself.

---

# 294. Line Coverage

Useful for finding untested code.

Do not game with trivial tests.

---

# 295. Branch Coverage

More valuable for:

```text
business rules
state machines
failure paths
```

---

# 296. Critical Module Coverage

High-risk modules should have higher test expectations than DTO/config modules.

---

# 297. Coverage Gate

If thresholds are used:

```text
realistic per project/module
```

and combined with risk/domain review.

---

# 298. New Code Coverage

Changed business logic requires meaningful tests.

---

# 299. Static Quality Tools

May check:

```text
bugs
security hotspots
duplication
complexity
coverage
```

Do not blindly accept automated suggestions.

---

# 300. Code Review Questions

Reviewer asks:

```text
What new behavior?
What failure path?
What race?
What migration?
What test proves it?
```

---

# 301. Bug Regression

Significant bug fix should add automated reproduction first where feasible.

---

# 302. Incident Regression

Production incident should produce automated regression test where reproducible.

---

# 303. Traceability

Critical requirements may map to:

```text
test IDs
automation
acceptance evidence
```

especially UAT/compliance.

---

# 304. Acceptance Criteria

Requirement should define:

```text
happy path
edge cases
failure behavior
```

before implementation where possible.

---

# 305. BDD

Given/When/Then can be used for complex shared rules.

Not mandatory for every test.

---

# 306. BDD Example

```text
Given a coupon has one remaining use
When two customers reserve simultaneously
Then exactly one reservation succeeds
And the global usage limit is not exceeded
```

---

# 307. Golden Master

Useful temporarily for:

```text
legacy migration
large mapping behavior
```

---

# 308. Golden Master Risk

Do not accidentally preserve legacy bugs as desired behavior.

Review captured outputs.

---

# 309. Snapshot Testing

Useful selectively for:

```text
large stable JSON
event examples
```

Avoid brittle snapshots.

---

# 310. Test Double Types

Use intentionally:

```text
Stub
Mock
Fake
Spy
```

---

# 311. Fake Repository

Useful for fast Application tests.

Does not replace PostgreSQL tests.

---

# 312. Fake Clock

Strongly recommended across time-sensitive services.

---

# 313. Fake Provider

Useful for deterministic workflow tests.

Real adapter separately tested against mock server/sandbox.

---

# 314. Provider Certification

Complete required sandbox/certification scenarios before PROD for applicable partners.

---

# 315. Contract Drift Detection

Optional scheduled sandbox check can detect external provider drift.

Do not rely solely on partner documentation.

---

# 316. Mobile / Backend Contract Testing

Backend publishes stable:

```text
OpenAPI
error codes
enums
```

Mobile verifies parsing/compatibility.

---

# 317. Slow Mobile Upgrade Compatibility

Support old client request/response versions for the documented support window.

---

# 318. Error-Code Stability

Mobile may depend on stable:

```text
error code
```

even when user message changes.

---

# 319. Localization Tests

Verify:

```text
English
Khmer
fallback
missing key
```

for Mission/Promotion/Notification and other localized content.

---

# 320. Translation-Key Validation

Backend rejects invalid translation keys according to service rules.

---

# 321. Timezone Tests

Test:

```text
UTC conversion
Asia/Phnom_Penh
store-local time
midnight boundary
```

where business timing matters.

---

# 322. DST

Cambodia has no DST, but future multi-zone integrations/users may require DST testing.

---

# 323. Date Boundaries

Test:

```text
starts_at exactly now
ends_at exactly now
before/after midnight
month-end
year-end
```

---

# 324. Leap Date

Test Feb 29 where date calculations apply.

---

# 325. Currency Tests

When USD/KHR supported test:

```text
USD
KHR
rounding
conversion boundaries
```

---

# 326. Exact Decimal

Assert no floating-point drift.

---

# 327. Current Rounding Rule Example

Where legacy/current business rule still applies:

```text
(price / 1.1) * 4100
```

then round to nearest 100.

Treat this as a tested business rule only in services that intentionally adopt it.

---

# 328. Currency Presentation

Presentation formatting is tested separately from financial calculation.

---

# 329. Legacy Compatibility

During migration test:

```text
canonical API
legacy mapping
legacy statuses
sentinel conversion
```

---

# 330. DEV/UAT Schema Drift

Compare:

```text
migration version
columns
indexes
constraints
```

before deployment.

---

# 331. Schema Compatibility Report

CI/pre-deploy may generate environment schema diff.

---

# 332. Feature Test Plan Template

```text
Requirement
Risk
Test Level
Scenario
Expected
Automation
Owner
```

---

# 333. Checkout Test Plan

Must cover:

```text
catalog change
inventory insufficient
promotion invalid
payment decline
wallet insufficient
dependency timeout
idempotent retry
success
```

---

# 334. Cancellation Test Plan

Must cover:

```text
before acceptance
after acceptance
already done
refund pending
delivery cancellation
inventory release
wallet/payment compensation
```

---

# 335. Top-Up Test Plan

Must cover:

```text
provider success
provider decline
provider timeout
UNKNOWN
wallet credit
ERP sync failure
reconciliation
```

---

# 336. Mission Test Plan

Must cover:

```text
eligibility period
duplicate source events
progress type
completion race
reward assignment
expiry
auto-assignment
```

---

# 337. Promotion Test Plan

Must cover:

```text
eligibility
stacking
usage limit
budget
coupon ownership
reservation
redeem
release
```

---

# 338. Notification Test Plan

Must cover:

```text
dedupe
preferences
template
localization
provider failure
schedule
expiry
```

---

# 339. Password Reset Test Plan

Must cover:

```text
enumeration
challenge/OTP
rate limit
cooldown
wrong code
expired code
reuse
password change
session revocation
```

---

# 340. Resilience Matrix

For critical dependency:

```text
healthy
slow
timeout
503
connection reset
invalid response
```

---

# 341. Failure Policy Assertion

Assert expected:

```text
fail open
fail closed
degrade
queue
retry
```

not just exception type.

---

# 342. Circuit Breaker

Verify:

```text
closed
open
fail-fast
half-open
recovery
```

---

# 343. Retry Budget

Ensure nested retries do not multiply unexpectedly across service layers.

---

# 344. Bulkhead

One dependency hangs.

Other dependency remains responsive.

---

# 345. Connection Pool Exhaustion

Verify:

```text
bounded wait
clear error
recovery
```

---

# 346. Thread Pool Exhaustion

Ensure no unbounded queue causes memory exhaustion.

---

# 347. Backpressure

Slow consumer/provider.

Verify:

```text
queue grows predictably
service remains stable
```

---

# 348. Rate Limit Under Load

Rate limiting should protect the service, not itself become a hotspot.

---

# 349. Memory Leak

Soak test monitors:

```text
heap
GC
threads
connections
```

---

# 350. Resource Leak

Repeated operations do not leak:

```text
DB connections
HTTP connections
file handles
threads
```

---

# 351. Service Startup Test

Service starts with valid config and migrations.

---

# 352. Invalid Configuration

Missing required secret/URL should produce clear fail-fast startup.

---

# 353. Health Endpoints

Verify:

```text
liveness
readiness
```

semantics independently.

---

# 354. Liveness

External dependency outage should not automatically create pod restart loops unless process is genuinely unhealthy.

---

# 355. Readiness

Readiness reflects ability to safely receive traffic.

---

# 356. Graceful Shutdown

On SIGTERM:

```text
stop taking new traffic
finish/abort safely
commit Kafka offsets appropriately
close resources
```

---

# 357. Kafka Consumer Shutdown

Do not commit offset for an unprocessed record.

---

# 358. In-Flight Request Shutdown

State-changing request:

```text
completes safely
or
client can retry idempotently
```

---

# 359. Rolling Deployment Compatibility

Test:

```text
old pod + new DB
new pod + old-compatible event
old/new cache format
old mobile client + new backend
```

---

# 360. Event Rolling Compatibility

Old/new consumers coexist without breaking schema.

---

# 361. Cache Rolling Compatibility

Old/new pods coexist using versioned cache namespace where necessary.

---

# 362. API Rolling Compatibility

Supported older client version still works.

---

# 363. Database Expand/Contract

Test:

```text
add new field/table
deploy compatible app
backfill
switch reads/writes
remove old later
```

---

# 364. Expand Migration

New nullable field/table does not break previous application version.

---

# 365. Contract Migration

Producer new contract version only after consumers can understand it.

---

# 366. Rollback Test

Can previous application image run safely against current schema?

---

# 367. Rollback Data Compatibility

Previous version does not corrupt or silently ignore critical new state.

---

# 368. Observability Testing

Verify critical workflow emits:

```text
metrics
trace context
structured error logs
```

---

# 369. Correlation ID

One checkout across:

```text
Gateway
Order
Payment
Kafka
Notification
```

preserves correlation identifier.

---

# 370. Trace Propagation

Verify:

```text
HTTP
gRPC
Kafka
```

propagate trace context.

---

# 371. Metric Label Safety

High-cardinality business IDs must not become metric labels.

---

# 372. Alert Tests

Where practical, feed synthetic metrics and verify alert rules.

---

# 373. Runbook Validation

Incident drill verifies:

```text
runbook instructions actually work
```

---

# 374. Operational Acceptance

Before PROD:

```text
dashboard exists
alerts fire
logs searchable
traces discoverable
```

---

# 375. Reconciliation Test

Create intentional mismatch.

Run reconciliation.

Expected:

```text
detected
classified
reported
```

---

# 376. Auto-Repair

Only explicitly safe mismatches auto-repair.

Audit record exists.

---

# 377. No Silent Repair

High-risk mismatch remains visible until approved resolution.

---

# 378. Backup Test

Verify backup job succeeds.

---

# 379. Restore Test

Restore into clean environment then run:

```text
schema validation
reconciliation
smoke tests
```

---

# 380. RPO Test

Measure actual recoverable point.

---

# 381. RTO Test

Measure actual restore/recovery duration.

---

# 382. DR Failover

Where DR environment exists:

```text
switch dependencies
restore traffic
verify consistency
```

---

# 383. Data Quality Tests

For migration/projection:

```text
missingness
duplicates
invalid enum
orphan reference
unexpected null
```

---

# 384. Referential Integrity

Even without cross-service foreign keys, validate local ownership/reference format.

---

# 385. Reconciliation as Test Oracle

For complex workflows, reconciliation invariants are powerful post-test assertions.

---

# 386. Financial Test Oracle

After workflow verify:

```text
order total
payment captured
wallet ledger
refund
```

reconcile.

---

# 387. Inventory Test Oracle

Example:

```text
initial stock
- consumed
- active reservations
+ releases
= expected state
```

according to final Inventory model.

---

# 388. Promotion Test Oracle

Reconcile:

```text
reserved count
redeemed count
active reservations
redemption history
budget
```

---

# 389. Loyalty Test Oracle

Reconcile:

```text
ledger sum
points account
expiry lots
```

---

# 390. Mission Test Oracle

Reconcile:

```text
source/progress events
distinct dimensions
current progress
completion
reward assignment
```

---

# 391. Property-Based Reconciliation

Generate random operation sequences.

After sequence assert reconciliation invariants.

Useful for:

```text
Wallet
Inventory
Promotion
```

---

# 392. Model-Based Testing

Compare real state machine to a simpler reference model.

Useful for:

```text
Order
Payment
Wallet reservation
Coupon
Saga
```

---

# 393. Fuzz Testing

Useful for:

```text
REST parsers
webhooks
file imports
```

---

# 394. JSON Fuzz

Send:

```text
deep nesting
huge string
wrong types
missing fields
unexpected arrays
```

Expected safe rejection.

---

# 395. File Import Fuzz

Malformed CSV/XML must not:

```text
crash parser
escape parser security
partially corrupt durable data
```

---

# 396. Canonical Contract Fixtures

Store examples in version control for:

```text
tests
docs
provider mocks
```

---

# 397. Golden Event Fixtures

Examples:

```text
OrderCompleted.v1.json
PaymentCaptured.v1.json
MissionCompleted.v1.json
```

---

# 398. Fixture Compatibility

When schema evolves, prove older supported fixtures remain readable.

---

# 399. Testing Documentation

Each service documents:

```text
unit command
integration command
Docker requirement
profiles
sandbox setup
special test dependencies
```

---

# 400. Developer Commands

Example:

```bash
./gradlew test
./gradlew integrationTest
```

Keep commands simple.

---

# 401. CI Reproducibility

Most CI failures should be reproducible locally.

---

# 402. Testcontainers Diagnostics

Differentiate:

```text
infrastructure problem
business assertion problem
```

---

# 403. Test Timeout

Every suite/test capable of hanging has bounded timeout.

---

# 404. Slow Test Budget

If integration suite becomes slow:

```text
parallelize
reuse containers carefully
split modules
```

without replacing real infrastructure.

---

# 405. Runtime Target

Exact number is team-defined.

Goal:

```text
fast enough to run frequently
```

---

# 406. Nightly Suite

May include:

```text
large concurrency
long replay
soak
schema drift
security scans
```

---

# 407. Pre-Release Suite

Before PROD:

```text
full integration
contract
migration
E2E
performance baseline
security gates
```

---

# 408. Production Smoke Suite

Minimal safe tests after deployment with rollback criteria.

---

# 409. Test Ownership

Service team owns its tests.

QA supports:

```text
strategy
cross-service scenarios
exploratory testing
UAT
```

Quality is shared responsibility.

---

# 410. Architecture Test Ownership

Platform/architecture team may own:

```text
ArchUnit
platform test libraries
contract compatibility tooling
```

---

# 411. ArchUnit

Use to enforce Clean Architecture rules.

---

# 412. Clean Architecture Tests

Examples:

```text
domain cannot import Spring
domain cannot import persistence adapter
application cannot depend on REST controller
```

---

# 413. Cross-Service DB Access Guard

Detect forbidden:

```text
datasource
repository
table access
```

where practical.

---

# 414. Dependency Cycle

Fail build on forbidden package/module cycles.

---

# 415. Public API Surface

Ensure internal classes are not accidentally exposed as public contracts.

---

# 416. SQL Migration Lint

Detect risky migration patterns:

```text
DROP COLUMN
table rewrite
unbounded UPDATE
missing index
```

---

# 417. Migration Performance

Test large-table migrations on representative row volume.

---

# 418. Online Migration Lock

Verify migration lock duration is acceptable.

---

# 419. Backfill Test

Backfill must be:

```text
idempotent
restartable
progress-tracked
```

---

# 420. Backfill Resume

Kill mid-batch then restart.

Expected:

```text
no duplicate/corrupt data
```

---

# 421. Legacy Migration

Compare old/new:

```text
counts
balances
statuses
references
```

---

# 422. Shadow Comparison

For Strangler:

```text
old result
new result
```

compare while still returning authoritative route.

---

# 423. Canary Test

Route small cohort to new service and compare:

```text
errors
latency
business outcomes
```

---

# 424. Strangler Rollback

Move cohort back.

Expected:

```text
no split brain
no data loss
```

---

# 425. Stable E2E Scenario Catalog

Maintain a small set of high-value journeys:

```text
register/login
browse menu
checkout pickup
checkout delivery
wallet top-up
coupon apply
mission complete
reward assign
order cancel/refund
```

---

# 426. E2E Principle

Assert:

```text
business outcome
```

not every internal call.

---

# 427. Checkout E2E

Example:

```text
login
menu
cart
coupon
checkout
payment
order visible
```

---

# 428. Wallet E2E

Example:

```text
top-up
wallet credited
history visible
mission progress updated
notification created
```

with eventual waits where appropriate.

---

# 429. Mission E2E

```text
qualifying action
event processed
mission complete
reward assigned
```

---

# 430. Eventual Assertions

Use bounded polling:

```text
await until condition
timeout after N seconds
```

---

# 431. Avoid Fixed Sleeps

Bad:

```text
Thread.sleep(5000)
```

Use:

```text
Awaitility
polling endpoint
event probe
```

---

# 432. Event Probe

Test-only infrastructure may expose workflow progress safely.

Do not add insecure production debug endpoints.

---

# 433. E2E Cleanup

Tag all automated E2E data by test run and clean it safely.

---

# 434. E2E External Provider

Use sandbox/mock except formal certification scenarios.

---

# 435. E2E Payment Safety

Never charge real payment instruments.

---

# 436. Exploratory Testing

Human exploratory testing remains useful for:

```text
unexpected workflow combinations
UI/API usability
operational UX
edge cases
```

---

# 437. UAT vs Automation

UAT validates:

```text
business acceptance
```

It does not replace automated correctness testing.

---

# 438. Manual Test Cases

Keep manual cases when human judgment, UI behavior, or partner process requires them.

---

# 439. Test Evidence

For release-sensitive change retain:

```text
CI result
contract report
performance report
security scan
UAT signoff where required
```

---

# 440. Risk-Based Quality Gate

Example:

```text
Payment change:
unit + integration + concurrency + contract + security + E2E

Text-only metadata:
focused unit/contract checks
```

---

# 441. Release-Blocking Defects

Examples:

```text
data loss
double charge
auth bypass
wallet inconsistency
negative stock
```

---

# 442. Known Issue Acceptance

Requires:

```text
risk assessment
owner
mitigation
target fix
```

---

# 443. Automation ROI

Automate scenarios that are:

```text
repeatable
high-risk
frequent
regression-prone
```

---

# 444. Do Not Automate for Vanity

Do not spend large effort on rare low-risk scenario when stronger coverage already exists elsewhere.

---

# 445. Testability as Architecture Quality

Good architecture makes it easy to:

```text
inject Clock
replace provider port
start service in isolation
replay event
query workflow state
```

---

# 446. Observability Improves Testability

Structured:

```text
logs
metrics
events
traces
```

improve diagnosis and integration assertions.

---

# 447. Deterministic Domain Core

Framework-independent domain enables fast, reliable tests.

---

# 448. Ports Enable Fakes

Hexagonal ports allow:

```text
fake provider
fake repository
fake clock
```

without modifying domain logic.

---

# 449. Contract-First Testability

OpenAPI/Proto/event schema allow test development before full implementation.

---

# 450. Quality Metrics

Track:

```text
pass rate
flake rate
escaped defects
mean time to detect regression
suite duration
critical scenario coverage
```

---

# 451. Escaped Defect Classification

Classify post-deploy bugs as:

```text
missing test
wrong requirement
environment difference
unanticipated concurrency
contract gap
migration gap
```

---

# 452. Test Effectiveness Review

Periodically ask:

```text
Which incidents would our current tests have caught?
```

---

# 453. Flake Rate

Track:

```text
tests that fail then pass without code change
```

Target:

```text
near zero
```

---

# 454. Suite Duration

Monitor trend to prevent CI becoming too slow.

---

# 455. Security Metrics

Track:

```text
critical vulnerabilities
high vulnerabilities
SAST findings
dependency age
```

---

# 456. Performance Regression Metrics

Track P95/P99 trends for core journeys/endpoints.

---

# 457. Test Dashboard

Potential:

```text
CI health
coverage signal
flake rate
security
performance
contract compatibility
```

---

# 458. Testing Runbooks

Required:

```text
CI integration failure
flaky test
Testcontainers failure
contract break
performance regression
security gate failure
E2E environment failure
```

---

# 459. Contract Break Runbook

```text
identify changed contract
inventory consumers
rollback/version
restore compatibility
add regression guard
```

---

# 460. Performance Regression Runbook

Inspect:

```text
baseline
query plan
CPU/memory
dependency latency
cache hit ratio
recent code/config
```

---

# 461. Flaky Test Runbook

```text
reproduce
find time/order/shared-state dependency
fix
temporary quarantine only
```

---

# 462. Testcontainers Runbook

Check:

```text
Docker health
image availability
network
ports
runner disk
resource limits
```

---

# 463. Security Gate Runbook

```text
confirm finding
assess exploitability
patch/upgrade
risk exception only with approval
```

---

# 464. Incident Feedback Loop

```text
Production Incident
      ↓
Root Cause
      ↓
Regression Test
      ↓
Alert / Runbook Update
```

---

# 465. Testing Definition of Done

Feature is not complete until:

```text
tests appropriate to risk exist
```

---

# 466. DoD — Domain Rule

- [ ] Happy path.
- [ ] Boundary values.
- [ ] Invalid input.
- [ ] State transitions.
- [ ] Invariants.
- [ ] Deterministic time/randomness.
- [ ] Readable names.

---

# 467. DoD — Persistence Change

- [ ] Flyway migration.
- [ ] Fresh install.
- [ ] Upgrade test where risky.
- [ ] Constraint tests.
- [ ] Repository tests.
- [ ] Concurrency where relevant.
- [ ] Performance impact reviewed.

---

# 468. DoD — REST Endpoint

- [ ] Validation.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Happy path.
- [ ] Business failure.
- [ ] HTTP mapping.
- [ ] Error envelope.
- [ ] Contract compatibility.
- [ ] Idempotency for critical write.
- [ ] Integration test.

---

# 469. DoD — Kafka Consumer

- [ ] Current event version.
- [ ] Duplicate event.
- [ ] Retryable failure.
- [ ] Permanent failure/DLQ.
- [ ] Inbox/idempotency.
- [ ] Replay.
- [ ] Metrics.
- [ ] Contract schema.

---

# 470. DoD — Saga

- [ ] Happy path.
- [ ] Failure at every step.
- [ ] Compensation.
- [ ] UNKNOWN.
- [ ] Crash recovery.
- [ ] Duplicate command.
- [ ] Concurrency.
- [ ] Reconciliation.
- [ ] Manual intervention.
- [ ] E2E scenario.

---

# 471. DoD — Security-Sensitive Change

- [ ] Positive auth.
- [ ] Negative auth.
- [ ] Object authorization.
- [ ] Rate limiting.
- [ ] Abuse scenario.
- [ ] Redaction.
- [ ] SAST/SCA.
- [ ] Security review.

---

# 472. DoD — Performance-Critical Change

- [ ] Baseline.
- [ ] Representative data.
- [ ] Load test.
- [ ] P95/P99.
- [ ] Resource metrics.
- [ ] Query plan.
- [ ] Regression threshold.

---

# 473. Service Test Review

Domain:

- [ ] Invariants.
- [ ] Boundaries.
- [ ] State transitions.
- [ ] Money/time.

Persistence:

- [ ] Real PostgreSQL.
- [ ] Migration.
- [ ] Constraint.
- [ ] Locking.

Communication:

- [ ] REST/gRPC.
- [ ] Kafka.
- [ ] Contract compatibility.
- [ ] Idempotency.

---

# 474. Distributed-System Review

- [ ] Timeout.
- [ ] Retry.
- [ ] Duplicate.
- [ ] Out-of-order.
- [ ] Crash.
- [ ] Recovery.
- [ ] Compensation.
- [ ] Reconciliation.
- [ ] Backpressure.
- [ ] DLQ.

---

# 475. Security Test Review

- [ ] Authentication.
- [ ] Authorization.
- [ ] Input validation.
- [ ] Rate limit.
- [ ] Injection.
- [ ] Secret leakage.
- [ ] Token misuse.
- [ ] Dependency vulnerabilities.

---

# 476. Performance Review

- [ ] Realistic workload.
- [ ] Realistic data.
- [ ] Peak load.
- [ ] P95/P99.
- [ ] Saturation known.
- [ ] Failure observed.
- [ ] Recovery observed.

---

# 477. CI Review

- [ ] Fast unit stage.
- [ ] Integration stage.
- [ ] Contract gate.
- [ ] Migration gate.
- [ ] Security scans.
- [ ] Reports retained.
- [ ] Flakes tracked.
- [ ] Parallelized.

---

# 478. Production Readiness Testing

Before PROD:

- [ ] Critical domain invariants tested.
- [ ] PostgreSQL integration uses compatible version.
- [ ] Flyway fresh/upgrade tests pass.
- [ ] REST/gRPC contracts pass.
- [ ] Kafka compatibility passes.
- [ ] Outbox/Inbox tests pass.
- [ ] Redis failure tests pass.
- [ ] Idempotency tests pass.
- [ ] Concurrency tests pass.
- [ ] Checkout Saga failure matrix passes.
- [ ] Payment/Wallet safety tests pass.
- [ ] Security gates pass.
- [ ] Critical E2E journeys pass.
- [ ] Performance baseline/load passes.
- [ ] Backup restore passes.
- [ ] Required chaos/resilience tests pass.
- [ ] Alerts/runbooks validated.

---

# 479. Source-Recommended Implementation Order

```text
1. JUnit/AssertJ standards
2. Domain test builders
3. PostgreSQL Testcontainers
4. Flyway integration tests
5. Repository/constraint tests
6. REST controller/integration tests
7. Protobuf/OpenAPI compatibility CI
8. Kafka Testcontainers
9. Outbox/Inbox tests
10. Redis Testcontainers
11. Idempotency/concurrency harness
12. Saga failure tests
13. Security automated tests
14. E2E critical journeys
15. Performance harness
16. Chaos/failure suite
17. DR/restore tests
```

---

# 480. Project Implementation Order

Expanded:

```text
1. Create shared testing conventions module/docs
2. Standardize JUnit 5 + AssertJ + Mockito
3. Add deterministic Clock/ID/random test support
4. Create fixture/builder libraries
5. Add test tags and Gradle source sets/tasks
6. Add PostgreSQL Testcontainers baseline
7. Run Flyway in integration tests
8. Add repository/constraint test base
9. Add concurrency test harness
10. Add REST/WebMvc test standard
11. Add gRPC integration standard
12. Add OpenAPI/Protobuf compatibility gates
13. Add Kafka Testcontainers
14. Add Outbox/Inbox/Retry/DLQ helpers
15. Add Redis Testcontainers
16. Add WireMock/MockWebServer
17. Build provider UNKNOWN/replay helpers
18. Build service-by-service test matrices
19. Implement Identity high-risk tests
20. Implement Inventory concurrency suite
21. Implement Promotion usage/budget suite
22. Implement Payment UNKNOWN/refund suite
23. Implement Wallet ledger/double-spend suite
24. Implement Order/Saga failure matrix
25. Implement Loyalty reward/points suite
26. Implement Mission eligibility/progress suite
27. Implement Notification dedupe/provider suite
28. Implement Integration mapping/webhook/poll suite
29. Add security automation
30. Add E2E critical journeys
31. Add performance harness
32. Add resilience/chaos suite
33. Add backup/restore/DR suite
34. Add observability/runbook validation
35. Add CI quality gates/reports
36. Add testing governance/templates
37. Complete Phase 21 review
38. Handoff Phase 22 Docker
```

---

# 481. Minimum Viable Testing Standard

Every production service must have:

```text
Domain / unit tests
Application use-case tests
PostgreSQL integration tests
Migration tests
REST/gRPC contract tests
Kafka tests if messaging used
Redis tests if Redis used
Authorization tests
Idempotency tests for critical writes
Concurrency tests for scarce/financial state
Critical E2E scenario
CI quality gate
```

---

# 482. High-Risk Testing Standard

For:

```text
Payment
Wallet
Inventory
Promotion redemption
Order Saga
Identity security
```

also require:

```text
failure injection
UNKNOWN-outcome tests
reconciliation tests
load/concurrency tests
manual intervention/recovery tests
```

---

# 483. Testing Governance

Architecture/code review should reject:

```text
financial logic tested only with mocks
migration without upgrade test
Kafka consumer without duplicate test
critical write without idempotency test
concurrency-sensitive feature without race test
security endpoint without negative authorization test
```

---

# 484. Test Strategy Artifact Per Service

Each service maintains:

```text
Test Matrix
Critical Scenarios
Concurrency Scenarios
Contract Tests
Performance Scenarios
Known Test Gaps
```

---

# 485. Test Matrix Template

```text
Feature:
Risk:

Unit:
Application:
DB:
Contract:
Kafka:
Redis:
Concurrency:
Security:
E2E:
Performance:

Owner:
```

---

# 486. Failure Matrix Template

```text
Dependency:
Failure:
Expected Service Behavior:
Retry:
Fallback:
Client Result:
Alert:
Test Name:
```

---

# 487. Concurrency Matrix Template

```text
Resource:
Race:
Protection:
Invariant:
Threads:
Expected Winners:
Expected Final State:
```

---

# 488. Performance Scenario Template

```text
Scenario:
Traffic:
Duration:
Dataset:
P95 Target:
P99 Target:
Error Target:
CPU Limit:
Memory Limit:
DB Pool:
Kafka Lag:
```

---

# 489. Security Scenario Template

```text
Endpoint / Flow:
Threat:
Control:
Positive Test:
Negative Test:
Rate Limit:
Audit:
Expected Error:
```

---

# 490. Example Matrix — Create Order

```text
Risk:
CRITICAL

Unit:
price / snapshot / state rules

Application:
checkout orchestration

DB:
order / idempotency / Saga persistence

Contract:
Catalog / Inventory / Payment / Promotion

Kafka:
OrderCreated / OrderCompleted

Concurrency:
duplicate CreateOrder

Security:
customer ownership

E2E:
successful checkout

Failure:
inventory/payment timeout

Performance:
peak checkout
```

---

# 491. Example Matrix — Wallet Reserve

```text
Risk:
CRITICAL

Unit:
balance invariant

DB:
row locking + ledger

Concurrency:
double spend

Idempotency:
same order reference

Security:
authorized caller

Reconciliation:
ledger/account

Performance:
high reserve throughput
```

---

# 492. Example Matrix — Mission Progress

```text
Risk:
MEDIUM / HIGH

Unit:
eligibility and progress rules

Kafka:
duplicate source event

DB:
progress/dimension uniqueness

Concurrency:
complete once

E2E:
OrderCompleted → Mission complete → Reward

Expiry:
auto-assignment/expiry behavior
```

---

# 493. Test Anti-Patterns

Reject:

```text
asserting internal method calls everywhere
shared mutable fixtures
fixed sleeps
real clock in domain tests
CI calling production dependencies
ignored tests with no owner/ticket
coverage theater
mocking DB locking
only fake Kafka
assuming Redis is always available
happy-path-only Saga tests
manual-only migration validation
ignoring observability
```

---

# 494. Method-Call Assertion Anti-Pattern

Assert outcome, not every internal implementation call.

Use call verification only when interaction itself is part of contract.

---

# 495. Shared Mutable Fixture Anti-Pattern

Tests must not depend on execution order through shared mutable state.

---

# 496. Fixed Sleep Anti-Pattern

Avoid:

```java
Thread.sleep(...)
```

Use bounded condition polling.

---

# 497. Real Time Anti-Pattern

Avoid:

```java
LocalDateTime.now()
Instant.now()
```

inside domain code that must be deterministic.

Inject Clock.

---

# 498. Production Dependency Anti-Pattern

CI must never call:

```text
production database
production Kafka
real customer API
real payment account
```

---

# 499. Disabled Test Anti-Pattern

Every ignored test requires:

```text
reason
owner
ticket
expiry/review
```

---

# 500. Coverage Theater

100% getter coverage cannot replace:

```text
race tests
failure tests
security tests
migration tests
```

---

# 501. Mocked DB Lock Anti-Pattern

Repository mock cannot prove:

```text
transaction isolation
row lock
deadlock
unique race
```

Use real PostgreSQL.

---

# 502. Fake Kafka Only Anti-Pattern

Fake queue cannot prove:

```text
partition
offset
rebalance
serialization
delivery semantics
```

Use Kafka Testcontainer for integration.

---

# 503. Redis-Always-Up Anti-Pattern

Every Redis-backed service tests timeout/down behavior.

---

# 504. Happy-Path-Only Saga Anti-Pattern

Saga bugs commonly appear in:

```text
mid-workflow failure
retry
crash
compensation
UNKNOWN
```

---

# 505. Manual Migration Verification Anti-Pattern

Migration correctness should be automated whenever feasible.

---

# 506. Observability Ignored Anti-Pattern

A workflow that works but cannot be diagnosed is not production-ready.

---

# 507. Testing Work Breakdown

Suggested tickets:

```text
TST-001 Publish platform testing standard
TST-002 Standardize JUnit 5
TST-003 Standardize AssertJ
TST-004 Standardize Mockito rules
TST-005 Define test naming convention
TST-006 Define Arrange/Act/Assert convention
TST-007 Add Clock test abstraction
TST-008 Add deterministic RandomSource
TST-009 Add deterministic ID generator support
TST-010 Build common fixture/builder conventions
TST-011 Add test tags
TST-012 Add Gradle unit test task
TST-013 Add Gradle integrationTest task
TST-014 Add contractTest task
TST-015 Add e2eTest task
TST-016 Add performanceTest task/profile
TST-017 Add securityTest task/profile
TST-018 Add chaosTest task/profile
TST-019 Configure bounded test timeouts
TST-020 Configure CI test reports
TST-021 Add PostgreSQL Testcontainers base
TST-022 Match production PostgreSQL major
TST-023 Run Flyway in integration test startup
TST-024 Add fresh-install migration test
TST-025 Add upgrade migration test framework
TST-026 Add schema expectation assertions
TST-027 Add constraint test helpers
TST-028 Add repository test base
TST-029 Add transaction isolation test harness
TST-030 Add optimistic-lock helpers
TST-031 Add pessimistic-lock helpers
TST-032 Add deadlock test helper
TST-033 Add concurrency ExecutorService harness
TST-034 Add start barrier helper
TST-035 Add repeated race runner
TST-036 Add idempotency test contract
TST-037 Test same key/same body
TST-038 Test same key/different body
TST-039 Test concurrent same key
TST-040 Test response-lost retry
TST-041 Add REST controller test standard
TST-042 Add REST full integration test standard
TST-043 Add error-envelope assertions
TST-044 Add pagination contract tests
TST-045 Add REST serialization tests
TST-046 Add OpenAPI compatibility validation
TST-047 Add gRPC integration test base
TST-048 Add gRPC status/deadline tests
TST-049 Add Protobuf breaking-change gate
TST-050 Add Kafka Testcontainers
TST-051 Add Kafka producer assertions
TST-052 Add Kafka consumer assertions
TST-053 Add duplicate event test helper
TST-054 Add consumer crash/replay helper
TST-055 Add Outbox atomicity test helper
TST-056 Add Outbox retry test
TST-057 Add duplicate Outbox publish test
TST-058 Add retry-topic test
TST-059 Add DLQ test
TST-060 Add replay test
TST-061 Add event ordering test
TST-062 Add stale event version test
TST-063 Add Kafka schema evolution test
TST-064 Add Redis Testcontainers
TST-065 Add TTL tests
TST-066 Add Lua/rate-limit test helper
TST-067 Add cache hit/miss test helper
TST-068 Add cache invalidation tests
TST-069 Add Redis outage helper
TST-070 Add stampede concurrency test
TST-071 Add Redis lock tests
TST-072 Add Redis security fail-policy tests
TST-073 Add WireMock/MockWebServer framework
TST-074 Add provider authentication/header assertions
TST-075 Add provider timeout simulation
TST-076 Add provider disconnect simulation
TST-077 Add UNKNOWN outcome simulation
TST-078 Add webhook signature test helper
TST-079 Add raw-body signature test
TST-080 Add webhook replay test
TST-081 Add contract testing governance
TST-082 Add breaking contract CI gate
TST-083 Add canonical contract fixture repository
TST-084 Add golden event fixtures
TST-085 Build per-service test matrix template
TST-086 Build failure matrix template
TST-087 Build concurrency matrix template
TST-088 Build performance template
TST-089 Build security template
TST-090 Implement Identity login/password tests
TST-091 Implement Identity JWT tests
TST-092 Implement key rotation tests
TST-093 Implement refresh rotation tests
TST-094 Implement password-reset security tests
TST-095 Implement enumeration tests
TST-096 Implement Customer snapshot/concurrency tests
TST-097 Implement Catalog publication/version tests
TST-098 Implement Catalog price/modifier tests
TST-099 Implement Inventory reserve tests
TST-100 Implement Inventory 100-thread race test
TST-101 Implement Inventory expiry/release race
TST-102 Implement Inventory reconciliation tests
TST-103 Implement Cart line-identity tests
TST-104 Implement Cart optimistic concurrency tests
TST-105 Implement Order state matrix
TST-106 Implement Order snapshot tests
TST-107 Implement Order idempotency tests
TST-108 Implement Checkout Saga happy path
TST-109 Implement Checkout Saga step failure matrix
TST-110 Implement compensation failure tests
TST-111 Implement Saga UNKNOWN tests
TST-112 Implement Saga crash boundary matrix
TST-113 Implement Saga manual intervention test
TST-114 Implement Payment intent/attempt tests
TST-115 Implement Payment capture invariant
TST-116 Implement concurrent refund test
TST-117 Implement Payment webhook ordering tests
TST-118 Implement Payment UNKNOWN test
TST-119 Implement Payment reconciliation test
TST-120 Implement Wallet ledger tests
TST-121 Implement Wallet reserve/capture/release tests
TST-122 Implement Wallet double-spend test
TST-123 Implement Wallet top-up idempotency
TST-124 Implement Wallet reconciliation test
TST-125 Implement Loyalty earn/redeem tests
TST-126 Implement points expiry tests
TST-127 Implement FEFO tests
TST-128 Implement reward distribution statistical tests
TST-129 Implement controlled randomness tests
TST-130 Implement Promotion eligibility tests
TST-131 Implement Promotion discount boundary tests
TST-132 Implement Promotion global-limit race
TST-133 Implement Promotion budget race
TST-134 Implement Coupon ownership test
TST-135 Implement Mission Journey period tests
TST-136 Implement Mission COUNT tests
TST-137 Implement Mission SUM tests
TST-138 Implement Mission DISTINCT_COUNT tests
TST-139 Implement Mission FIRST_OCCURRENCE tests
TST-140 Implement Mission completion race
TST-141 Implement Mission prior-completion tests
TST-142 Implement Mission reward-trigger tests
TST-143 Implement Notification dedupe tests
TST-144 Implement template/localization tests
TST-145 Implement preference/security-notification tests
TST-146 Implement provider retry tests
TST-147 Implement device-token tests
TST-148 Implement Integration sentinel tests
TST-149 Implement Integration mapping tests
TST-150 Implement polling watermark tests
TST-151 Implement Integration webhook tests
TST-152 Implement Integration UNKNOWN tests
TST-153 Implement Integration reconciliation tests
TST-154 Add authentication negative test suite
TST-155 Add authorization/object-authorization suite
TST-156 Add mass assignment suite
TST-157 Add SQL injection tests
TST-158 Add XSS tests
TST-159 Add SSRF tests
TST-160 Add XXE tests
TST-161 Add brute-force/rate-limit tests
TST-162 Add secret leakage/redaction tests
TST-163 Configure SAST
TST-164 Configure SCA
TST-165 Configure DAST environment
TST-166 Generate/validate SBOM
TST-167 Select primary performance tool
TST-168 Build baseline performance scenario
TST-169 Build peak load model
TST-170 Build stress scenario
TST-171 Build spike scenario
TST-172 Build soak scenario
TST-173 Build capacity scenario
TST-174 Generate representative performance dataset
TST-175 Add critical DB query benchmarks
TST-176 Add EXPLAIN ANALYZE review
TST-177 Add Redis performance tests
TST-178 Add Kafka performance tests
TST-179 Add Saga performance scenario
TST-180 Add performance regression gate
TST-181 Build chaos experiment framework
TST-182 Add pod-kill experiment
TST-183 Add DB latency/outage experiment
TST-184 Add Redis outage experiment
TST-185 Add Kafka outage experiment
TST-186 Add network latency experiment
TST-187 Add provider 503 storm experiment
TST-188 Add DR restore test
TST-189 Add RPO measurement
TST-190 Add RTO measurement
TST-191 Build synthetic data generator
TST-192 Create versioned reference seed data
TST-193 Define QA test accounts
TST-194 Add run_id isolation
TST-195 Add test data cleanup/reseed
TST-196 Add Local test documentation
TST-197 Add CI ephemeral environment standard
TST-198 Add UAT/performance/security environment rules
TST-199 Add feature-flag test convention
TST-200 Add smoke test suite
TST-201 Add safe production smoke suite
TST-202 Configure CI stages
TST-203 Parallelize test jobs
TST-204 Configure merge quality gates
TST-205 Add flaky-test tracking
TST-206 Add quarantine workflow
TST-207 Retain diagnostics/artifacts
TST-208 Configure coverage reports
TST-209 Configure critical-module coverage expectations
TST-210 Add bug-regression policy
TST-211 Add incident-regression policy
TST-212 Add acceptance criteria template
TST-213 Add BDD guidance
TST-214 Add Golden Master migration framework
TST-215 Add mobile compatibility checks
TST-216 Add localization tests
TST-217 Add Asia/Phnom_Penh timezone tests
TST-218 Add date-boundary tests
TST-219 Add USD/KHR exact decimal tests
TST-220 Add legacy compatibility tests
TST-221 Add DEV/UAT schema drift check
TST-222 Add resilience matrix per service
TST-223 Add circuit-breaker tests
TST-224 Add retry-budget tests
TST-225 Add bulkhead tests
TST-226 Add pool-exhaustion tests
TST-227 Add graceful shutdown tests
TST-228 Add deployment compatibility suite
TST-229 Add rollback compatibility test
TST-230 Add observability assertions
TST-231 Add correlation/trace propagation tests
TST-232 Add alert tests
TST-233 Add runbook drills
TST-234 Add reconciliation test oracles
TST-235 Add financial reconciliation assertions
TST-236 Add Inventory reconciliation oracle
TST-237 Add Promotion reconciliation oracle
TST-238 Add Loyalty reconciliation oracle
TST-239 Add Mission reconciliation oracle
TST-240 Add property-based critical invariant tests
TST-241 Add model-based state-machine tests
TST-242 Add API/webhook fuzz tests
TST-243 Add file-import fuzz tests
TST-244 Add ArchUnit
TST-245 Enforce Clean Architecture dependencies
TST-246 Detect forbidden cross-service DB access
TST-247 Add dependency-cycle checks
TST-248 Add SQL migration lint
TST-249 Add migration performance tests
TST-250 Add backfill restart tests
TST-251 Add legacy shadow comparison tests
TST-252 Add canary comparison tests
TST-253 Add Strangler rollback tests
TST-254 Build critical E2E scenario catalog
TST-255 Implement checkout E2E
TST-256 Implement wallet/top-up E2E
TST-257 Implement mission/reward E2E
TST-258 Implement cancellation/refund E2E
TST-259 Add bounded Awaitility/eventual assertion utilities
TST-260 Add E2E cleanup
TST-261 Add test evidence retention
TST-262 Add quality metrics dashboard
TST-263 Add testing runbooks
TST-264 Complete per-service test strategy artifacts
TST-265 Complete high-risk testing review
TST-266 Complete production-readiness testing review
TST-267 Phase 21 exit review
```

---

# 508. Recommended ADRs

```text
ADR-TST-001 Risk-based testing model
ADR-TST-002 Test pyramid
ADR-TST-003 JUnit/AssertJ/Mockito standard
ADR-TST-004 Deterministic Clock
ADR-TST-005 Test fixtures/builders
ADR-TST-006 Test tagging/frequency
ADR-TST-007 PostgreSQL Testcontainers
ADR-TST-008 Kafka Testcontainers
ADR-TST-009 Redis Testcontainers
ADR-TST-010 Migration testing
ADR-TST-011 Concurrency harness
ADR-TST-012 Idempotency test contract
ADR-TST-013 REST contract validation
ADR-TST-014 Protobuf compatibility
ADR-TST-015 Event compatibility
ADR-TST-016 External provider mocking
ADR-TST-017 Saga failure matrix
ADR-TST-018 Security automation
ADR-TST-019 Performance tool standard
ADR-TST-020 Chaos testing safety
ADR-TST-021 Test data/privacy
ADR-TST-022 Environment strategy
ADR-TST-023 CI quality gates
ADR-TST-024 Flaky-test governance
ADR-TST-025 Coverage philosophy
ADR-TST-026 Golden Master usage
ADR-TST-027 Mobile compatibility testing
ADR-TST-028 Reconciliation as test oracle
ADR-TST-029 ArchUnit architecture checks
ADR-TST-030 E2E scenario catalog
ADR-TST-031 Test evidence retention
```

---

# 509. Phase 21 Policy Freeze Checklist

Before platform testing is considered production-capable, approve:

- [ ] Unit/application/integration source-set structure.
- [ ] JUnit 5 version.
- [ ] AssertJ standard.
- [ ] Mockito rules.
- [ ] Clock abstraction.
- [ ] Randomness abstraction.
- [ ] Fixture ownership.
- [ ] Test tags.
- [ ] Commit/MR/nightly/pre-release suites.
- [ ] PostgreSQL Testcontainers version.
- [ ] Kafka Testcontainers version.
- [ ] Redis Testcontainers version.
- [ ] Container reuse policy.
- [ ] Integration cleanup strategy.
- [ ] Flyway fresh-install rule.
- [ ] Upgrade migration rule.
- [ ] Concurrency test iteration count.
- [ ] Idempotency expected behavior.
- [ ] OpenAPI compatibility tool.
- [ ] Protobuf compatibility tool.
- [ ] Kafka schema compatibility tool.
- [ ] Contract fixtures/versioning.
- [ ] Provider mock standard.
- [ ] Primary performance tool.
- [ ] Performance data-volume targets.
- [ ] SLO/NFR performance thresholds.
- [ ] Security scan severity gates.
- [ ] DAST environment.
- [ ] Chaos safety policy.
- [ ] Backup/restore testing frequency.
- [ ] Synthetic data approach.
- [ ] Lower-environment PII policy.
- [ ] QA account policy.
- [ ] Smoke-test scope.
- [ ] Production synthetic scope.
- [ ] CI stage layout.
- [ ] Parallelization strategy.
- [ ] Flaky test quarantine SLA.
- [ ] Coverage expectations.
- [ ] Regression-test requirements.
- [ ] Test evidence retention.
- [ ] Release-blocking defect policy.
- [ ] Known-risk acceptance process.
- [ ] Testing metrics/dashboard.
- [ ] Per-service Test Matrix ownership.

---

# 510. Acceptance — Domain

For every critical invariant the team can identify:

```text
specific automated tests
```

that prove it.

---

# 511. Acceptance — Persistence

The team can point to tests proving:

```text
Flyway migrations
PostgreSQL constraints
locking
transaction isolation
custom SQL
```

---

# 512. Acceptance — Idempotency

For every critical write there is a reproducible test proving:

```text
commit succeeds
response is lost
client retries
no duplicate side effect
```

---

# 513. Acceptance — Concurrency

For scarce/financial resources, simultaneous calls prove:

```text
stock not negative
wallet not double-spent
promotion limit not exceeded
reward quantity not exceeded
mission completes once
order creates once
```

---

# 514. Acceptance — Contracts

Breaking REST/gRPC/Kafka change is rejected before deployment.

---

# 515. Acceptance — Messaging

Duplicate event, consumer crash, retry, DLQ, and replay are tested with actual Kafka.

---

# 516. Acceptance — Redis

TTL, Lua, rate limiting, locks, cache fallback, outage, and stampede are tested with actual Redis.

---

# 517. Acceptance — Saga

Every Saga step has:

```text
forward success
failure
compensation
UNKNOWN
crash
recovery
```

tests.

---

# 518. Acceptance — Payment

Provider accepted + lost response never causes automatic second charge.

---

# 519. Acceptance — Wallet

Concurrent reserve/debit cannot exceed spendable balance.

---

# 520. Acceptance — Inventory

100 simultaneous reservations against quantity 1 result in exactly one successful reservation.

---

# 521. Acceptance — Promotion

Usage/budget limit remains correct under simultaneous reservation/redemption.

---

# 522. Acceptance — Mission

Concurrent qualifying events produce:

```text
one completion
one reward trigger
```

---

# 523. Acceptance — Security

Every privileged/customer-owned resource includes positive and negative authorization tests.

---

# 524. Acceptance — Performance

Core journeys are tested with representative data and approved P95/P99/error targets.

---

# 525. Acceptance — Resilience

The platform has explicit tests for:

```text
PostgreSQL slow/down
Redis slow/down
Kafka unavailable
provider slow/down
network latency
```

---

# 526. Acceptance — Recovery

Backup restore, event replay, Saga reconciliation, and Redis cold start are tested rather than assumed.

---

# 527. Acceptance — Migration

Risky migrations are tested from representative prior production schema/data.

---

# 528. Acceptance — Deployment

Old/new applications, contracts, schemas, and cache versions coexist safely during rollout.

---

# 529. Acceptance — CI

Merge gates fail on:

```text
failed required tests
breaking contracts
failed migrations
critical security issues
```

according to policy.

---

# 530. Acceptance — Flakes

Flaky tests are tracked as defects and cannot stay silently ignored.

---

# 531. Acceptance — Observability

Critical flows prove:

```text
correlation
trace propagation
metrics
structured logs
alerts
```

---

# 532. Acceptance — Test Evidence

Release-sensitive changes retain enough automated evidence for production-readiness review.

---

# 533. Phase 21 Completion Tree

```text
PHASE 21 — TESTING

├── Risk-Based Testing                       ✅
├── Test Pyramid                             ✅
├── Unit Testing                             ✅
├── Domain Testing                           ✅
├── Application Testing                      ✅
├── Deterministic Clock / Randomness         ✅
├── Fixtures / Builders                      ✅
├── Test Isolation                           ✅
├── Test Tags / Frequency                    ✅
├── JUnit / AssertJ / Mockito                ✅
├── Spring Slice / Context Tests             ✅
├── PostgreSQL Testcontainers                ✅
├── Flyway Fresh / Upgrade Tests             ✅
├── Constraint / Repository Tests            ✅
├── Transaction Isolation                    ✅
├── Concurrency Harness                      ✅
├── Idempotency Tests                        ✅
├── REST Tests                               ✅
├── OpenAPI Compatibility                    ✅
├── gRPC Tests                               ✅
├── Protobuf Compatibility                   ✅
├── Kafka Testcontainers                     ✅
├── Outbox / Inbox                           ✅
├── Retry / DLQ / Replay                     ✅
├── Redis Testcontainers                     ✅
├── Cache / Rate-Limit / Lock                ✅
├── Provider Mocking                         ✅
├── Webhook Security                         ✅
├── Contract Testing                         ✅
├── Identity Test Matrix                     ✅
├── Customer Test Matrix                     ✅
├── Catalog Test Matrix                      ✅
├── Inventory Test Matrix                    ✅
├── Cart Test Matrix                         ✅
├── Order / Saga Test Matrix                 ✅
├── Payment Test Matrix                      ✅
├── Wallet Test Matrix                       ✅
├── Loyalty Test Matrix                      ✅
├── Promotion Test Matrix                    ✅
├── Mission Test Matrix                      ✅
├── Notification Test Matrix                 ✅
├── Integration / ACL Test Matrix            ✅
├── Security Testing                         ✅
├── SAST / SCA / DAST / SBOM                ✅
├── Performance Testing                      ✅
├── Load / Stress / Spike / Soak            ✅
├── Capacity / Scalability                   ✅
├── Chaos / Failure                          ✅
├── DR / Restore                             ✅
├── Test Data / Privacy                      ✅
├── Local / CI / UAT Environments            ✅
├── Smoke / Synthetic                        ✅
├── CI Quality Gates                         ✅
├── Flaky Test Governance                    ✅
├── Coverage Philosophy                      ✅
├── Regression Testing                       ✅
├── BDD / Acceptance                         ✅
├── Golden Master / Legacy                   ✅
├── Mobile Compatibility                     ✅
├── Time / Currency Boundaries               ✅
├── Resilience Matrix                        ✅
├── Deployment / Rollback Compatibility      ✅
├── Observability Testing                    ✅
├── Reconciliation Oracles                   ✅
├── Property / Model / Fuzz                  ✅
├── ArchUnit / Architecture Tests            ✅
├── Critical E2E Catalog                     ✅
├── Test Documentation                       ✅
├── Quality Metrics                          ✅
├── Testing Runbooks                         ✅
├── Definition of Done                       ✅
├── Governance Templates                     ✅
└── Docker Handoff                           ✅
```

---

# 534. Handoff to Phase 22

The next official implementation phase is:

```text
PHASE 22 — Docker
```

Phase 22 will package the verified applications into reproducible deployable containers.

---

# 535. Testing → Docker Boundary

Phase 21 proves:

```text
software behavior
```

Phase 22 packages:

```text
that verified software
```

into:

```text
standardized container images
```

---

# 536. Tests Becoming Docker Gates

Phase 22 can rely on Phase 21 for:

```text
build gates
container smoke tests
image verification
startup tests
graceful-shutdown tests
security scanning evidence
SBOM generation/validation
```

---

# 537. Final Phase 21 Principle

```text
Fast Domain Tests
      ↓
Application Tests
      ↓
Real Infrastructure Integration Tests
      ↓
Contract Tests
      ↓
Focused E2E
      ↓
Performance / Security / Chaos / DR
```

High-risk workflows additionally require:

```text
Concurrency
Idempotency
Failure Injection
Unknown Outcome
Compensation
Reconciliation
Recovery
```

The most important implementation rules are:

```text
Test business risk, not vanity metrics.
Domain tests stay fast and framework-independent.
Tests use deterministic Clock and controlled randomness.
Test data is isolated and privacy-safe.
Use real PostgreSQL for constraints, transactions, and locking.
Do not use H2 as proof of PostgreSQL behavior.
Run Flyway migrations in integration tests.
Test migrations from prior production-like states, not only empty databases.
Every critical write has idempotency tests.
Every scarce or financial resource has real concurrency tests.
Concurrency tests assert final invariants, not only response codes.
Use real Kafka for producer/consumer/offset/retry/DLQ/replay behavior.
Use real Redis for TTL/Lua/rate-limit/lock behavior.
Every Kafka consumer tests duplicate delivery.
Every Outbox publisher tests duplicate publish after crash.
Every contract has compatibility tests before merge.
Provider timeouts distinguish definite failure from UNKNOWN side effects.
Webhooks test authentication, replay, duplication, and versioning.
Every Saga step tests failure, compensation, UNKNOWN, crash, and recovery.
Security-sensitive endpoints test negative authorization and abuse.
Secrets are tested for log/response leakage.
Performance uses realistic data and peak traffic, not empty databases.
Chaos tests resilience assumptions with explicit blast radius and stop conditions.
Backups are trusted only after successful restore testing.
Production incidents feed automated regression tests.
Flaky tests are defects.
Coverage is a signal, not proof of quality.
UAT does not replace automated correctness tests.
Fixed sleeps are avoided in asynchronous tests.
Rolling deployment compatibility is tested across DB/API/event/cache versions.
Observability and runbooks are part of production correctness.
Quality is owned by the service team, not delegated entirely to QA.
```

---

**End of PHASE 21 — Testing Strategy**
