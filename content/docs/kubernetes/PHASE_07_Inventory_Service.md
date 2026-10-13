---
title: "PHASE 07 — Inventory Service"
---

# PHASE 07 — Inventory Service

> **Purpose:** Implement the platform Inventory Service as the authoritative owner of stock state, stock availability, reservation, release, consumption/deduction, adjustments, inventory movement history, reservation expiry, and inventory reconciliation.
>
> **Previous Phase:** Phase 06 — Catalog Service
>
> **Next Phase:** Phase 08 — Cart Service
>
> **Primary Architecture Basis:** PART 11 — Inventory Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 22 — Distributed Transactions / Saga, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, Redis where appropriate, gRPC or REST for internal contracts, Kafka, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 7 Goal

Phase 7 builds:

```text
inventory-service
```

Inventory Service is the authoritative owner of:

```text
Stock Items
Store-Level Stock
On-Hand Quantity
Reserved Quantity
Available Quantity
Inventory Reservations
Reservation Expiry
Reservation Release
Stock Consumption / Deduction
Manual Stock Adjustments
Inventory Movement History
Availability State
Inventory Reconciliation
Inventory Events
```

The service must answer:

```text
How much stock is available?
Can this quantity be reserved?
Has this order already reserved inventory?
When does this reservation expire?
When should stock be released?
When should reserved stock be permanently consumed?
How can every stock change be explained?
How do we reconcile current stock with movement history?
```

The service must protect against:

```text
Overselling
Double Reservation
Duplicate Deduction
Duplicate Release
Lost Updates
Negative Stock
Stale Reservations
Concurrent Checkout Races
Deadlock-Prone Multi-Item Reservation
Untraceable Manual Adjustments
```

The service does **not** own:

```text
Product Name
Product Description
Product Image
Menu Category
Menu Visibility
Base Price
Coupon / Promotion Rules
Order Lifecycle
Payment Lifecycle
Wallet Balance
Loyalty Points
Customer Profile
```

Catalog defines:

```text
what a product is
what may be sold
```

Inventory defines:

```text
whether the required stock can currently be fulfilled
```

---

# 2. Phase 7 Success State

Phase 7 is complete when the primary stock lifecycle works:

```text
Stock Available
     ↓
Reserve
     ↓
ACTIVE Reservation
     ├──> Consume → Permanent Deduction
     ├──> Release → Available Again
     └──> Expire  → Available Again
```

Core quantity relationship:

```text
available_quantity
=
on_hand_quantity
-
reserved_quantity
```

or the approved extended formula when blocked/safety stock is enabled.

The reservation path must work:

```text
Order Service
    ↓
ReserveInventory
    ↓
Validate Idempotency
    ↓
Normalize Lines
    ↓
Lock / Atomic Update Stock
    ↓
All Lines Succeed
    ↓
Create Reservation
    ↓
Movement / Outbox
    ↓
Commit
```

Failure behavior:

```text
Any required line fails
    ↓
ROLLBACK
    ↓
No partial reservation
```

Release path:

```text
Order Cancelled / Payment Failed / Saga Compensation
    ↓
ReleaseInventory
    ↓
Exactly One Effective Release
```

Consume path:

```text
Approved Business Trigger
    ↓
ConsumeInventory
    ↓
Reduce on_hand
    ↓
Reduce reserved
    ↓
Movement + Outbox
```

Expiry path:

```text
ACTIVE reservation
    ↓ expires_at reached
Expiry Worker
    ↓
Release remaining reserved quantity
    ↓
EXPIRED
```

The service must prove:

```text
no oversell
idempotent reserve
idempotent release
idempotent consume
deterministic multi-item locking
correct reservation expiry
movement history immutability
reconciliation
safe Redis fallback
outbox reliability
recovery correctness
```

---

# 3. Phase 7 Non-Negotiable Correctness Rule

The primary production invariant is:

```text
Do not promise stock that cannot be fulfilled.
```

Oversell protection is not a later optimization.

It is a core correctness requirement.

Therefore this phase must not be considered production-ready if it only supports:

```text
GET stock
POST quantity update
```

without:

```text
atomic reservation
idempotency
concurrency protection
release
consume
expiry
reconciliation
```

---

# 4. Source-Defined Open Decisions

PART 11 intentionally leaves several business/architecture decisions open.

Do not silently invent them.

Freeze required decisions before production.

Key decisions include:

```text
inventory ownership mode
tracked vs unlimited vs external
availability formula
quantity numeric type
unit of measure
reservation TTL
reservation reference uniqueness
reservation orchestration
consume/deduction trigger
direct deduction scope
safety stock
blocked quantity
low-stock threshold
external inventory source
reconciliation policy
cache TTL
public quantity exposure
admin permissions
adjustment approval
DR RPO/RTO
```

---

# 5. Inventory Ownership Mode

Source-supported modes:

```text
TRACKED
UNLIMITED
EXTERNAL
```

Meaning:

```text
TRACKED
→ Inventory Service owns quantity

UNLIMITED
→ quantity is not constrained by stock

EXTERNAL
→ authoritative quantity/availability comes from another system
```

Decision:

```text
INITIAL_INVENTORY_MODES = TBD_POLICY
```

---

# 6. Initial Stock Scope

Source initial scope:

```text
store_id + product_id
```

This pair identifies the business stock position.

Requirement:

```text
UNIQUE(store_id, product_id)
```

Future dimensions such as:

```text
warehouse
batch
ingredient
variant
```

are out of the initial scope unless explicitly approved.

---

# 7. Stock Item ID Strategy

Use a stable internal:

```text
stock_item_id
```

with business uniqueness:

```text
(store_id, product_id)
```

Decision:

```text
STOCK_ITEM_ID_STRATEGY = TBD_POLICY
```

The design must not depend on client-visible database sequence values.

---

# 8. Availability Formula

Source base formula:

```text
available
=
on_hand
-
reserved
```

Optional extended formula:

```text
available
=
on_hand
-
reserved
-
blocked
-
safety_stock
```

Decision:

```text
AVAILABLE_QUANTITY_FORMULA = TBD_POLICY
```

Do not implement optional terms unless they are approved.

---

# 9. Oversell Policy

Default source assumption for critical inventory:

```text
oversell forbidden
```

Then:

```text
available_quantity >= 0
reserved_quantity <= on_hand_quantity
```

must hold.

Decision:

```text
OVERSELL_ALLOWED = TBD_POLICY
```

Recommended initial production value:

```text
false
```

unless the business explicitly requires backorder/negative inventory.

---

# 10. Quantity Type

Source guidance:

For countable products:

```text
integer
```

For weight / volume:

```text
decimal quantity
+
unit_of_measure
```

Initial food-menu inventory may use integer quantity.

Decision:

```text
INITIAL_QUANTITY_TYPE = TBD_DATA_POLICY
```

Do not assume integer quantity is suitable for all future inventory.

---

# 11. Unit of Measure

Possible source values:

```text
EA
KG
G
L
ML
```

Decision:

```text
UNIT_OF_MEASURE_SCOPE = TBD_POLICY
```

If conversion is introduced:

```text
conversion rules must be explicit
```

No implicit unit conversion.

---

# 12. Reservation TTL

Source example:

```text
5 minutes
```

but the exact value depends on:

```text
payment flow
checkout flow
store acceptance
business process
```

Decision:

```text
DEFAULT_RESERVATION_TTL = TBD_POLICY
MAX_RESERVATION_EXTENSION = TBD_POLICY
```

Store explicit:

```text
expires_at
```

per reservation.

---

# 13. Reservation Reference Strategy

Typical:

```text
reference_type = ORDER
reference_id = ORD001
```

Potential uniqueness:

```text
(reference_type, reference_id)
```

or:

```text
(reference_type, reference_id, reservation_type)
```

Decision:

```text
RESERVATION_REFERENCE_UNIQUENESS = TBD_POLICY
```

---

# 14. Reservation Semantics

Recommended initial source behavior:

```text
all requested lines reserve
OR
none reserve
```

Decision:

```text
PARTIAL_RESERVATION_ALLOWED = false
```

unless business explicitly approves partial fulfillment.

---

# 15. Reservation Orchestration

Source supports:

```text
Synchronous:
Order → ReserveInventory → result

Asynchronous:
OrderCreated → Inventory → InventoryReserved / Failed
```

Source notes initial implementation may prefer synchronous reservation.

Decision:

```text
INITIAL_RESERVATION_ORCHESTRATION = TBD_ARCHITECTURE
```

Recommended for early implementation:

```text
synchronous internal contract
```

while keeping events for side effects/observability.

---

# 16. Consume / Deduction Timing

Possible source triggers:

```text
at reservation
at order acceptance
at preparation
at completion
```

Prepared-food operations may prefer:

```text
order acceptance
```

but this is a business/operations decision.

Decision:

```text
INVENTORY_CONSUME_TRIGGER = TBD_POLICY
```

---

# 17. Reservation vs Immediate Deduction

If the business never needs:

```text
temporary hold
release
expiry
```

then:

```text
reserve + consume
```

could happen together.

However PART 11 explicitly defines reservation lifecycle and release/expiry, so the default Phase 7 implementation keeps them separate unless formally changed.

---

# 18. Direct Deduction Policy

Some cases may deduct without prior reservation:

```text
POS sale
manual correction
external fulfillment
```

If enabled, direct deduction must have:

```text
explicit command
idempotency
authorization
stock check
movement history
```

Decision:

```text
DIRECT_DEDUCTION_ALLOWED = TBD_POLICY
```

---

# 19. Safety Stock Policy

Optional:

```text
safety_stock_quantity
```

Decision:

```text
SAFETY_STOCK_ENABLED = TBD_SCOPE
```

If enabled, it participates in the availability formula.

---

# 20. Blocked Quantity Policy

Optional:

```text
blocked_quantity
```

Possible uses:

```text
quality hold
damage investigation
manual hold
```

Decision:

```text
BLOCKED_QUANTITY_ENABLED = TBD_SCOPE
```

Do not mix blocked stock with customer reservation quantity.

---

# 21. Low Stock Policy

Potential:

```text
low_stock_threshold
```

Decision:

```text
LOW_STOCK_ENABLED = TBD_SCOPE
LOW_STOCK_THRESHOLD_SOURCE = TBD_POLICY
```

Threshold may be item-level or centrally configured.

---

# 22. External Inventory Mode

Some stock may remain authoritative in:

```text
POS
ERP
warehouse system
```

Decision:

```text
EXTERNAL_INVENTORY_ENABLED = TBD_SCOPE
EXTERNAL_INVENTORY_SOURCE = TBD_ARCHITECTURE
```

When enabled, Inventory may act as:

```text
facade
projection
reservation coordinator
```

but ownership must be explicit.

---

# 23. Reconciliation Policy

Freeze:

```text
reconciliation frequency
scopes
mismatch thresholds
automatic vs manual repair
approval requirements
external source priority
```

Decision:

```text
RECONCILIATION_SCHEDULE = TBD_POLICY
AUTO_REPAIR_ALLOWED = TBD_SECURITY_POLICY
```

High-risk mismatches should not be silently repaired.

---

# 24. Exact Quantity Exposure

Source guidance:

```text
do not expose exact stock publicly unless required
```

Public/catalog clients may only need:

```text
IN_STOCK
OUT_OF_STOCK
LOW_STOCK
```

Decision:

```text
PUBLIC_EXACT_QUANTITY_EXPOSURE = TBD_POLICY
```

Recommended default:

```text
false
```

---

# 25. Redis Availability Policy

Redis may cache:

```text
availability projection
```

but must never authorize reservation.

Decision:

```text
INVENTORY_AVAILABILITY_CACHE_TTL = TBD_POLICY
```

Authoritative reserve/consume/release always uses durable transactional state.

---

# 26. Admin Adjustment Approval

Sensitive negative adjustments may require:

```text
reason
audit
MFA
approval
```

Decision:

```text
ADJUSTMENT_APPROVAL_REQUIRED = TBD_SECURITY
MFA_FOR_SENSITIVE_ADJUSTMENT = TBD_SECURITY
```

---

# 27. DR Policy

Inventory DR must define:

```text
RPO
RTO
source of truth after failover
reservation handling during outage
event replay
reconciliation
```

Decision:

```text
INVENTORY_RPO = TBD_DR
INVENTORY_RTO = TBD_DR
```

---

# 28. Inventory Boundary

```text
                 Order Service
                       │
                       ▼
               Inventory Service
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
     Stock State   Reservation   Adjustment
         │             │             │
         └─────────────┼─────────────┘
                       ▼
                  inventory_db
                       │
                       ▼
                   Kafka Events
```

Catalog relationship:

```text
Catalog
   ↓ stable product_id / store_id
Inventory
```

Hard rule:

```text
Inventory must not read catalog_db directly.
```

---

# 29. Inventory vs Catalog

Catalog asks:

```text
Is this configured to be sold?
```

Inventory asks:

```text
Is enough stock available now?
```

Final orderability:

```text
Catalog sellable
AND
Inventory available
```

Neither service should absorb the other's ownership.

---

# 30. Inventory vs Ordering

Ordering owns:

```text
order lifecycle
```

Inventory owns:

```text
reservation lifecycle
stock state
```

Ordering must not:

```text
UPDATE inventory_db
```

directly.

---

# 31. Inventory vs Cart

Normal add-to-cart should generally not reserve inventory.

Cart may display:

```text
current availability
```

but this is advisory.

Authoritative reservation should normally begin during checkout/order creation.

---

# 32. Repository Location

```text
brown-platform/
└── services/
    └── inventory-service/
```

---

# 33. Java Package

Use:

```text
com.company.inventory
```

according to the shared engineering standard.

---

# 34. Inventory Service Package Structure

```text
inventory-service/
│
├── src/main/java/com/company/inventory/
│   │
│   ├── domain/
│   │   ├── stock/
│   │   ├── reservation/
│   │   ├── movement/
│   │   ├── adjustment/
│   │   ├── reconciliation/
│   │   ├── event/
│   │   ├── policy/
│   │   └── exception/
│   │
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   └── out/
│   │   ├── reserve/
│   │   ├── release/
│   │   ├── consume/
│   │   ├── adjust/
│   │   ├── availability/
│   │   ├── expiry/
│   │   └── reconciliation/
│   │
│   ├── adapter/
│   │   ├── in/
│   │   │   ├── grpc/
│   │   │   ├── rest/
│   │   │   ├── kafka/
│   │   │   └── scheduler/
│   │   └── out/
│   │       ├── persistence/
│   │       ├── kafka/
│   │       ├── redis/
│   │       └── external/
│   │
│   └── config/
│       ├── security/
│       ├── persistence/
│       ├── kafka/
│       ├── redis/
│       └── observability/
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│
└── src/test/
```

Dependency direction:

```text
Adapters
   ↓
Application
   ↓
Domain
```

---

# 35. Initial Technology Dependencies

Typical:

```text
Spring Boot Web
Spring Validation
Spring Security Resource Server
Spring Data JPA or approved persistence layer
PostgreSQL Driver
Flyway
Spring Kafka
Redis client where enabled
gRPC libraries if selected
Actuator
Micrometer
OpenTelemetry integration
JUnit 5
AssertJ
Testcontainers PostgreSQL
Testcontainers Kafka where needed
ArchUnit
```

---

# 36. Ubiquitous Language

| Term | Meaning |
|---|---|
| Stock Item | Inventory-controlled stock position for store/product |
| On-Hand Quantity | Recorded physical/logical quantity |
| Reserved Quantity | Quantity held for active reservations |
| Available Quantity | Quantity available for new reservation |
| Reservation | Temporary allocation to a reference |
| Consume | Convert reserved stock into permanent deduction |
| Release | Return reserved stock to availability |
| Expiry | Automatic release after reservation deadline |
| Adjustment | Authorized correction/increase/decrease |
| Movement | Immutable record explaining stock changes |
| Availability | Inventory's stock-based fulfillment state |
| Reconciliation | Verification of current state against history/source |

---

# 37. StockItem Aggregate

Primary aggregate:

```text
StockItem
```

Possible state:

```text
stock_item_id
store_id
product_id
inventory_mode
on_hand_quantity
reserved_quantity
safety_stock_quantity where enabled
blocked_quantity where enabled
status
version
created_at
updated_at
```

Primary behavior:

```text
reserve(quantity)
release(quantity)
consume(quantity)
adjust(delta)
block()
unblock()
```

---

# 38. Stock Item Status

Source values:

```text
ACTIVE
INACTIVE
BLOCKED
```

Meaning:

```text
ACTIVE
→ reservation allowed

INACTIVE
→ temporarily not inventory-controlled/usable

BLOCKED
→ reservation forbidden due to operational issue
```

---

# 39. Stock Invariants

Enforce according to approved oversell policy:

```text
on_hand_quantity >= 0
reserved_quantity >= 0
available_quantity >= 0
reservation quantity > 0
released quantity <= remaining reservation
consumed quantity <= remaining reservation
duplicate reference cannot reserve twice
```

When oversell is forbidden:

```text
reserved_quantity <= on_hand_quantity
```

---

# 40. Inventory Mode

Model explicitly:

```text
TRACKED
UNLIMITED
EXTERNAL
```

Do not represent unlimited stock with:

```text
999999999
```

or another artificial quantity.

---

# 41. Unlimited Inventory

For:

```text
inventory_mode = UNLIMITED
```

reservation may succeed without decrementing finite quantity unless:

```text
stock item is BLOCKED
```

The exact reservation record behavior is a policy choice.

---

# 42. External Inventory

For:

```text
inventory_mode = EXTERNAL
```

authoritative state must be clearly identified.

External statuses must pass through Integration / ACL rather than leaking provider-specific codes into the domain.

---

# 43. Stock Availability Status

Derived statuses may include:

```text
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
BLOCKED
UNTRACKED
```

---

# 44. Basic Availability

For tracked stock:

```text
available_quantity >= requested_quantity
```

plus:

```text
status == ACTIVE
```

Inventory does not decide Catalog sellability or channel validity.

---

# 45. Reservation Aggregate

Possible fields:

```text
reservation_id
reference_type
reference_id
store_id
status
expires_at
idempotency_key
request_hash
created_at
updated_at
```

Reservation items:

```text
reservation_item_id
reservation_id
stock_item_id
requested_quantity
consumed_quantity
released_quantity
created_at
updated_at
```

---

# 46. Reservation Status

Source-supported statuses:

```text
ACTIVE
CONSUMED
RELEASED
EXPIRED
CANCELLED
```

Use one consistent lifecycle.

Recommended core transitions:

```text
ACTIVE
  ├──> CONSUMED
  ├──> RELEASED
  └──> EXPIRED
```

---

# 47. Reservation Invariant

For each reservation item:

```text
consumed_quantity
+
released_quantity
<=
requested_quantity
```

The remaining active amount is:

```text
requested
-
consumed
-
released
```

---

# 48. Reservation Request

Conceptual request:

```json
{
  "reference_type": "ORDER",
  "reference_id": "ORD001",
  "store_id": "STORE001",
  "items": [
    {
      "product_id": "PROD001",
      "quantity": 2
    }
  ],
  "expires_at": "..."
}
```

The contract should also include:

```text
idempotency_key
```

when required by the Phase 03 standard.

---

# 49. Reservation Response

Return:

```text
reservation_id
status
expires_at
reserved items
```

Do not expose:

```text
database lock version
SQL row IDs as business behavior
internal concurrency implementation
```

---

# 50. Reservation Idempotency

Repeated:

```text
ReserveInventory(ORD001)
```

must not reserve twice.

Use:

```text
business reference
+
idempotency key where needed
+
request hash
```

---

# 51. Same Key / Different Request

If the same idempotency key is reused with changed:

```text
quantity
store
products
```

return deterministic conflict such as:

```text
IDEMPOTENCY_KEY_REUSED
```

or the approved stable error.

Never process the changed request as a second reservation.

---

# 52. Duplicate Product Line Normalization

Input:

```text
PROD001 qty 1
PROD001 qty 2
```

normalize to:

```text
PROD001 qty 3
```

before locking/reservation.

---

# 53. All-or-Nothing Reservation

Initial behavior:

```text
all lines succeed
OR
all lines fail
```

Example:

```text
Coffee available
Cake unavailable
```

Result:

```text
reservation fails
no Coffee stock remains reserved
```

---

# 54. Atomic Reservation Pattern

Source-supported SQL pattern:

```sql
UPDATE stock_items
SET reserved_quantity = reserved_quantity + :qty,
    version = version + 1
WHERE id = :stock_item_id
  AND status = 'ACTIVE'
  AND (on_hand_quantity - reserved_quantity) >= :qty;
```

Interpretation:

```text
affected rows = 1 → success
affected rows = 0 → unavailable/conflict
```

If safety/blocked stock are enabled, the condition must use the approved availability formula.

---

# 55. Pessimistic Row Lock Alternative

Source-supported alternative:

```sql
SELECT *
FROM stock_items
WHERE id = ?
FOR UPDATE;
```

Then:

```text
calculate availability
validate
update reserved
```

Safe but may reduce throughput on hot items.

---

# 56. Optimistic Lock Alternative

Possible:

```text
version
```

Update:

```text
WHERE version = old_version
```

Conflict:

```text
bounded retry
```

More suitable when contention is low.

---

# 57. Recommended Initial Concurrency Strategy

PART 11 recommends for critical stock:

```text
atomic conditional update
```

or:

```text
pessimistic row lock
```

Correctness takes priority over theoretical throughput.

Decision:

```text
INITIAL_RESERVATION_LOCK_STRATEGY = TBD_IMPLEMENTATION
```

This decision must be validated with realistic contention tests.

---

# 58. Multi-Item Deadlock Risk

Example:

```text
Order A → Product 1, Product 2
Order B → Product 2, Product 1
```

If locks occur in request order, this may deadlock.

---

# 59. Deterministic Lock Ordering

Mitigation:

```text
normalize lines
sort stock_item_id
lock/update in sorted order
```

Every multi-line reservation path must use the same deterministic order.

---

# 60. Multi-Line Reservation Algorithm

Recommended:

```text
Normalize requested items
      ↓
Resolve StockItems
      ↓
Sort by stock_item_id
      ↓
BEGIN
      ↓
Reserve each in deterministic order
      ↓
Any fail?
 ├── yes → ROLLBACK
 └── no
      ↓
Create reservation + lines
      ↓
Movement/history
      ↓
Outbox
      ↓
COMMIT
```

---

# 61. Reservation Transaction

Concept:

```text
BEGIN

Check idempotency/business reference
Normalize lines
Load stock identifiers
Lock/reserve deterministically
Insert reservation
Insert reservation items
Insert movement/history where used
Insert outbox

COMMIT
```

Idempotency state and business effect must be transactionally safe.

---

# 62. Reservation Expiry

Reservations must not hold stock forever.

Store:

```text
expires_at
```

explicitly.

Do not derive expiry only from current config because config may change after reservation creation.

---

# 63. Expiry Worker

Source flow:

```text
Find ACTIVE reservations where expires_at <= now
      ↓
Lock reservation
      ↓
Verify ACTIVE
      ↓
Release remaining quantity
      ↓
Mark EXPIRED
      ↓
Movement / Outbox
```

---

# 64. Expiry Worker Concurrency

Support multiple workers safely with patterns such as:

```text
FOR UPDATE SKIP LOCKED
```

and bounded batching.

---

# 65. Expiry Query

Source example:

```sql
CREATE INDEX idx_inventory_reservations_active_expiry
ON inventory_reservations(expires_at)
WHERE status = 'ACTIVE';
```

The exact migration follows naming/index standards.

---

# 66. Expiry Batching

Do not load an unbounded expiry backlog.

Use:

```text
batch size
ordered selection
SKIP LOCKED
repeat
```

with metrics for:

```text
backlog count
oldest expired reservation age
processing rate
```

---

# 67. Expiry Idempotency

Only:

```text
ACTIVE → EXPIRED
```

may release stock.

Repeated worker execution must be:

```text
no-op / idempotent success
```

---

# 68. Reservation Extension — Optional

If enabled:

```text
ExtendReservation
```

must validate:

```text
reservation ACTIVE
new expiry later than current
maximum extension
authorization
```

Do not permit unlimited extension.

---

# 69. Release

Release means:

```text
reserved quantity returns to availability
```

Formula:

```text
reserved_new
=
reserved_old
-
released_quantity
```

`on_hand` normally does not increase because reservation did not physically deduct it.

---

# 70. Release Triggers

Possible source triggers:

```text
Order cancelled
Payment failed
Reservation timeout
Manual cancellation
Saga compensation
```

Exactly one effective release must occur.

---

# 71. Release Idempotency

Repeated release must not:

```text
increase availability multiple times
```

Use:

```text
reservation state
remaining quantity
idempotency reference
```

---

# 72. Release Transaction

```text
BEGIN

Lock reservation
Validate state
Lock affected stock in deterministic order
Calculate releasable remainder
Decrease reserved quantities
Update reservation lines
Update reservation state
Insert movement
Insert outbox

COMMIT
```

---

# 73. Consume / Deduct

Consumption converts reserved quantity into permanent on-hand reduction.

For quantity `q`:

```text
on_hand_new = on_hand_old - q
reserved_new = reserved_old - q
```

---

# 74. Important Consume Invariant

If quantity was already reserved:

```text
available
```

remains unchanged at consume time.

Example:

```text
before:
on_hand = 100
reserved = 10
available = 90

consume 5:
on_hand = 95
reserved = 5
available = 90
```

This is a key accounting invariant.

---

# 75. Consume Idempotency

Repeated consume for the same reservation/line must not deduct twice.

Protect with:

```text
reservation status
consumed_quantity
idempotency key/business reference
transaction
```

---

# 76. Consume Transaction

```text
BEGIN

Lock reservation
Validate ACTIVE / consumable state
Lock stock items
Validate remaining reservation quantity
Decrease on_hand
Decrease reserved
Update consumed quantity
Mark reservation CONSUMED if complete
Insert movement
Insert outbox

COMMIT
```

---

# 77. Release vs Consume Race

Possible race:

```text
ReleaseInventory
```

and:

```text
ConsumeInventory
```

arrive at the same time.

Only one valid transition/update may win.

The loser must receive deterministic current-state behavior rather than applying a second stock mutation.

---

# 78. Expiry vs Release Race

Possible:

```text
expiry worker
```

and:

```text
manual/order release
```

race.

Both must lock/check reservation state so stock returns exactly once.

---

# 79. Expiry vs Consume Race

Possible:

```text
reservation expires
```

as the order tries to consume.

Define transition/lock behavior so:

```text
consume after successful expiry release
```

does not deduct unreserved stock accidentally.

---

# 80. Stock Adjustment

Adjustment represents an inventory correction.

Source examples:

```text
RECEIVE
CORRECTION_INCREASE
CORRECTION_DECREASE
DAMAGE
WASTE
TRANSFER_IN
TRANSFER_OUT
```

Only implement types currently in scope.

---

# 81. Adjustment Invariants

Require:

```text
reason
actor/source
reference
quantity
valid resulting stock state
```

Sensitive manual adjustments require audit.

---

# 82. AdjustInventory Flow

```text
Authorize actor
      ↓
Validate reason
      ↓
Load / lock stock
      ↓
Apply delta
      ↓
Validate invariants
      ↓
Movement
      ↓
Audit
      ↓
Outbox
      ↓
Commit
```

---

# 83. Negative Adjustment

If a negative adjustment would violate:

```text
on_hand >= reserved
```

when oversell is forbidden, reject or require the approved reconciliation/exception workflow.

Do not silently create impossible stock state.

---

# 84. Stock Movement Ledger

Maintain append-only:

```text
inventory_movements
```

Possible movement semantics:

```text
OPENING_STOCK
RECEIVE
CONSUME
ADJUST
DAMAGE
WASTE
RESERVE metadata/reserved_delta where modeled
RELEASE metadata/reserved_delta where modeled
```

---

# 85. Movement Fields

Possible:

```text
movement_id
stock_item_id
movement_type
quantity_delta
reserved_delta
reference_type
reference_id
reservation_id
reason_code
actor_id
occurred_at
created_at
```

---

# 86. Movement Immutability

Do not edit historical movement records.

Correction means:

```text
new compensating/corrective movement
```

not rewriting history.

---

# 87. Current State + Movement History

Use:

```text
stock_items
```

for current state.

Use:

```text
inventory_movements
```

for immutable history.

Changes should happen atomically where appropriate.

---

# 88. Opening Stock

Legacy/migrated initial stock should create explicit movement:

```text
OPENING_STOCK
```

or the approved equivalent.

This creates an auditable starting point.

---

# 89. Stock Count Adjustment

Physical count example:

```text
system on_hand = 20
physical count = 18

COUNT_ADJUSTMENT = -2
```

Record:

```text
actor
reason
count reference
```

---

# 90. Reconciliation

Reconciliation verifies:

```text
current stock state
movement history
reservation state
external source when applicable
```

---

# 91. Internal Stock Reconciliation

Expected:

```text
opening balance
+
sum(quantity movements)
=
current on_hand
```

If this does not hold, record a mismatch.

---

# 92. Reserved Quantity Reconciliation

Expected:

```text
sum(active remaining reservation quantity)
=
stock_items.reserved_quantity
```

This check is critical for detecting reservation leaks.

---

# 93. Reservation Reconciliation

Detect:

```text
ACTIVE reservation past expiry
orphan reservation
reservation line > stock reserved
consumed + released > requested
missing reservation line
impossible status combination
```

---

# 94. External Reconciliation

If POS/ERP is authoritative, compare:

```text
store_id
product_id
quantity
source version/time
```

Detect:

```text
missing item
quantity mismatch
stale synchronization
duplicate source update
```

---

# 95. Reconciliation Mismatch

Do not silently repair high-risk mismatch.

Persist mismatch with workflow such as:

```text
OPEN
INVESTIGATING
RESOLVED
IGNORED_APPROVED
```

---

# 96. Reconciliation Run

Possible state:

```text
run_id
scope
started_at
completed_at
status
items_checked
mismatch_count
```

Operations must be able to trace mismatch to a specific run.

---

# 97. Reconciliation Repair

Any repair that changes stock should generate:

```text
approved adjustment
movement history
audit
```

not direct ad hoc SQL.

---

# 98. External Integration ACL

External provider codes such as:

```text
A
O
H
```

must map through Integration / ACL to canonical Inventory concepts.

Do not allow provider-specific status strings to become domain enums.

---

# 99. External Synchronization

Possible:

```text
External POS / ERP
       ↓
Integration / ACL
       ↓
Canonical Event
       ↓
Inventory Service
       ↓
Update Projection / State
```

---

# 100. External Synchronization Version

Accept metadata such as:

```text
source_version
source_updated_at
```

when available.

Reject stale update according to approved ordering/version rules.

---

# 101. Internal Service Contracts

Recommended source operations:

```text
ReserveInventory
ReleaseInventory
ConsumeInventory
GetAvailability
```

Source recommends gRPC, while REST can be used initially.

---

# 102. gRPC Interface — Concept

```proto
service InventoryService {
  rpc ReserveInventory(ReserveInventoryRequest)
      returns (ReserveInventoryResponse);

  rpc ReleaseInventory(ReleaseInventoryRequest)
      returns (ReleaseInventoryResponse);

  rpc ConsumeInventory(ConsumeInventoryRequest)
      returns (ConsumeInventoryResponse);

  rpc GetAvailability(GetAvailabilityRequest)
      returns (GetAvailabilityResponse);
}
```

Exact protobuf belongs in the Phase 03 contract repository.

---

# 103. Reserve Contract Fields

Concept:

```text
reference_type
reference_id
store_id
items[]
expires_at
idempotency_key
```

---

# 104. Release Contract

Should identify reservation/business reference safely.

Possible:

```text
reservation_id
reference_id
reason
idempotency_key
```

Exact shape must be versioned in Phase 03.

---

# 105. Consume Contract

Should identify:

```text
reservation_id
reference_id / order_id
items or full remaining reservation
idempotency_key
```

depending on whether partial consumption is supported.

---

# 106. Availability Query

Concept:

```text
GetAvailability(
  store_id,
  product_ids[]
)
```

Return:

```text
product_id
availability status
available_quantity only for approved internal consumers
```

---

# 107. Availability Is Advisory

A UI may see:

```text
AVAILABLE
```

then another order reserves the last unit.

Therefore:

```text
display availability != guaranteed reservation
```

Checkout must reserve authoritatively.

---

# 108. Public Quantity Minimization

Public clients should normally receive:

```text
IN_STOCK
OUT_OF_STOCK
LOW_STOCK
```

not exact quantity.

---

# 109. Error Catalog

Source candidates:

```text
STOCK_ITEM_NOT_FOUND
STOCK_ITEM_BLOCKED
INSUFFICIENT_STOCK
INVALID_QUANTITY
RESERVATION_NOT_FOUND
RESERVATION_EXPIRED
RESERVATION_ALREADY_CONSUMED
RESERVATION_ALREADY_RELEASED
RESERVATION_CONFLICT
IDEMPOTENCY_KEY_REUSED
INVENTORY_CONCURRENCY_CONFLICT
ADJUSTMENT_NOT_ALLOWED
```

Any implementation addition must enter the shared error catalog before public use.

---

# 110. Error Mapping

Source examples:

| Error | gRPC / HTTP |
|---|---|
| STOCK_ITEM_NOT_FOUND | NOT_FOUND / 404 |
| INSUFFICIENT_STOCK | FAILED_PRECONDITION / 422 |
| STOCK_ITEM_BLOCKED | FAILED_PRECONDITION / 409 or 422 |
| RESERVATION_NOT_FOUND | NOT_FOUND / 404 |
| RESERVATION_CONFLICT | ALREADY_EXISTS / 409 |
| INVENTORY_CONCURRENCY_CONFLICT | ABORTED / 409 |
| INVALID_QUANTITY | INVALID_ARGUMENT / 400 |

---

# 111. Inventory Events Published

Candidate source events:

```text
InventoryReserved
InventoryReservationFailed
InventoryReleased
InventoryReservationExpired
InventoryConsumed
InventoryAdjusted
InventoryAvailabilityChanged
InventoryLow
InventoryOutOfStock
InventoryRestocked
```

Publish only events another domain actually needs.

---

# 112. InventoryReserved Event

Minimum semantic content:

```text
reservation_id
reference_id
store_id
expires_at
```

Avoid exposing internal stock counts unnecessarily.

---

# 113. Reservation Failure Event

Useful primarily in asynchronous saga.

Possible data:

```text
reference_id
store_id
failure_code
failed_product_ids
```

If reserve is synchronous, response error may be sufficient.

---

# 114. InventoryReleased Event

Possible content:

```text
reservation_id
reference_id
reason
```

Useful for:

```text
order saga
analytics
operations
```

---

# 115. InventoryConsumed Event

Represents permanent stock reduction.

Possible content:

```text
reservation_id
order_id
store_id
```

---

# 116. Availability Changed Event

Example semantic transition:

```text
AVAILABLE → OUT_OF_STOCK
OUT_OF_STOCK → AVAILABLE
AVAILABLE → LOW_STOCK
```

Do not emit noisy availability events for every tiny quantity change when status remains unchanged.

---

# 117. Events Consumed

Potential:

```text
ProductCreated
ProductArchived
StoreActivated
StoreDeactivated
OrderCancelled
OrderCompleted
```

only according to explicit orchestration/choreography design.

---

# 118. Synchronous Reservation

Source option:

```text
Order Service
      ↓
ReserveInventory
      ↓
Inventory
      ↓
success/failure
```

This is the preferred simpler starting point if selected.

---

# 119. Asynchronous Reservation Saga

Alternative:

```text
OrderCreated
      ↓
Inventory
      ↓
InventoryReserved / Failed
      ↓
Saga continues
```

This is more decoupled but more operationally complex.

The definitive Saga design belongs to Phase 14.

---

# 120. Release Compensation

Distributed transaction compensation:

```text
ReserveInventory
    ↕
ReleaseInventory
```

Release must be safe to call repeatedly.

---

# 121. Reservation Query-by-Reference

For distributed recovery, Inventory should support finding reservation state by stable business reference, not only transient request state.

Recommended internal capability:

```text
GetReservationByReference
```

if required by Saga/recovery design.

This must use source-defined stable references and not expose persistence internals.

---

# 122. Inventory Database

Logical database:

```text
inventory_db
```

Only Inventory Service writes authoritative inventory state.

Other services use:

```text
gRPC / REST
Kafka
approved projections
```

not direct SQL.

---

# 123. Core Tables

Source tables:

```text
stock_items
inventory_reservations
inventory_reservation_items
inventory_movements
inventory_adjustments
inventory_reconciliation_runs
inventory_reconciliation_mismatches
processed_events
idempotency_records
outbox_events
```

Optional:

```text
inventory_external_state
inventory_batches
inventory_transfers
```

---

# 124. Stock Items Table

Concept:

```text
id
store_id
product_id
inventory_mode
status
on_hand_quantity
reserved_quantity
safety_stock_quantity
version
created_at
updated_at
```

If blocked quantity is enabled, add it through a migration.

Unique:

```text
(store_id, product_id)
```

---

# 125. Stock Quantity Constraints

Possible:

```text
on_hand_quantity >= 0
reserved_quantity >= 0
safety_stock_quantity >= 0
```

If oversell is forbidden:

```text
reserved_quantity <= on_hand_quantity
```

subject to the final formula/design.

---

# 126. Reservations Table

Concept:

```text
id
reference_type
reference_id
store_id
status
expires_at
created_at
updated_at
idempotency_key
request_hash
```

Unique candidate:

```text
(reference_type, reference_id)
```

according to final policy.

---

# 127. Reservation Items Table

Concept:

```text
id
reservation_id
stock_item_id
requested_quantity
consumed_quantity
released_quantity
created_at
updated_at
```

Constraint:

```text
consumed + released <= requested
```

---

# 128. Inventory Movements Table

Concept:

```text
id
stock_item_id
movement_type
quantity_delta
reserved_delta
reference_type
reference_id
reservation_id
reason_code
actor_id
occurred_at
created_at
```

Append-only.

---

# 129. Adjustments Table

Optional workflow table:

```text
id
stock_item_id
quantity_delta
reason_code
comment
status
requested_by
approved_by
created_at
approved_at
```

Useful when sensitive adjustments need approval.

---

# 130. Idempotency Records

Source concept:

```text
id
operation
idempotency_key
request_hash
status
response_body
created_at
expires_at
```

Unique:

```text
(operation, idempotency_key)
```

---

# 131. Processed Events

```text
event_id
consumer_name
processed_at
```

Primary:

```text
(event_id, consumer_name)
```

---

# 132. Outbox Events

Use transactional outbox for:

```text
InventoryReserved
InventoryReleased
InventoryConsumed
InventoryAdjusted
InventoryAvailabilityChanged
ReservationExpired
```

as required.

---

# 133. Reservation Indexes

Important:

```text
(reference_type, reference_id)
(status, expires_at)
store_id
```

The expiry worker must efficiently find:

```text
ACTIVE
AND expires_at <= now
```

---

# 134. Stock Item Indexes

Core:

```text
UNIQUE(store_id, product_id)
```

Add additional indexes only for actual query/admin patterns.

---

# 135. Flyway Migration Plan

Source sequence:

```text
V1__create_stock_items.sql
V2__create_inventory_reservations.sql
V3__create_reservation_items.sql
V4__create_inventory_movements.sql
V5__create_inventory_adjustments.sql
V6__create_idempotency_records.sql
V7__create_processed_events.sql
V8__create_outbox.sql
V9__create_reconciliation_tables.sql
```

Optional features get later migrations.

Never rewrite applied production migrations.

---

# 136. Quantity Type Migration

Changing:

```text
INTEGER
```

to:

```text
NUMERIC
```

for weighted stock is a major migration.

Source plan:

```text
new column
dual support
backfill
application migration
constraints
cleanup
```

---

# 137. Legacy Inventory Migration

Possible sources:

```text
POS stock
ERP stock
manual inventory tables
```

Migration must define:

```text
opening quantity
reserved quantity treatment
mapping
cutover timestamp
```

---

# 138. Migration Reconciliation

Before cutover compare:

```text
legacy stock
new stock
active order reservations
store/product mapping
```

No unexplained mismatch at go-live.

---

# 139. Input Ports

Source examples:

```text
ReserveInventoryUseCase
ReleaseInventoryUseCase
ConsumeInventoryUseCase
GetAvailabilityUseCase
AdjustInventoryUseCase
BlockStockItemUseCase
UnblockStockItemUseCase
ExpireReservationUseCase
ReconcileInventoryUseCase
```

Potential recovery/query port where required:

```text
GetReservationByReferenceUseCase
```

---

# 140. Output Ports

Source examples:

```text
LoadStockItemPort
SaveStockItemPort
ReservationPort
MovementPort
OutboxPort
IdempotencyPort
ProcessedEventPort
ExternalInventoryPort
ClockPort
```

Additional implementation ports may include:

```text
AuditPort
AvailabilityCachePort
ReconciliationPort
```

when needed.

---

# 141. ReserveInventory Use Case

Pseudo flow:

```text
Validate request
      ↓
Check idempotency
      ↓
Normalize duplicate lines
      ↓
Resolve stock items
      ↓
Apply inventory_mode
      ↓
Sort locks deterministically
      ↓
Reserve all
      ↓
Create reservation
      ↓
Create movement/history
      ↓
Save outbox
      ↓
Commit
      ↓
Return reservation
```

---

# 142. ReleaseInventory Use Case

```text
Load reservation
      ↓
Already RELEASED/EXPIRED?
 ├── yes → idempotent result
 └── no
      ↓
Lock affected stock
      ↓
Release remaining quantity
      ↓
Update lines/status
      ↓
Movement
      ↓
Outbox
```

---

# 143. ConsumeInventory Use Case

```text
Load reservation
      ↓
Validate consumable state
      ↓
Lock stock
      ↓
Validate remaining
      ↓
Deduct on_hand
      ↓
Reduce reserved
      ↓
Update consumed quantity
      ↓
Movement
      ↓
Outbox
```

---

# 144. AdjustInventory Use Case

```text
Authorize
   ↓
Validate reason
   ↓
Lock StockItem
   ↓
Apply delta
   ↓
Validate resulting state
   ↓
Movement
   ↓
Audit
   ↓
Outbox
```

---

# 145. Availability Use Case

```text
store_id + product_ids
      ↓
Load stock
      ↓
Apply inventory_mode
      ↓
Calculate available
      ↓
Derive status
      ↓
Return
```

This path should be read-optimized.

---

# 146. Redis Availability Cache

Possible key:

```text
inventory:availability:{store}:{product}
```

Cache can accelerate display availability.

Never:

```text
reserve based only on Redis
```

---

# 147. Cache Race

The following is valid behavior:

```text
Client sees AVAILABLE
another order reserves final unit
client checkout reservation fails
```

The display projection is advisory.

The reserve transaction is authoritative.

---

# 148. Cache Update

After authoritative transaction commits:

```text
availability changed?
      ↓
invalidate/update Redis
      ↓
publish AvailabilityChanged event if status changed
```

Cache failure must not roll back stock mutation.

---

# 149. Internal Authorization

Reserve/release/consume require:

```text
service-to-service identity
correct audience
approved service permissions
```

Public callers must never directly invoke privileged stock mutation.

---

# 150. Admin Permissions

Source examples:

```text
inventory.manage
inventory.adjust
inventory.block
```

Keep permissions separate.

---

# 151. Sensitive Inventory Operations

Manual negative adjustments or override may require:

```text
reason
audit
MFA step-up
approval
```

according to the security policy.

---

# 152. Inventory Audit

Audit:

```text
manual adjustment
block/unblock
manual reservation release
reconciliation resolution
configuration change
```

Normal automated reservations can be explained through:

```text
reservation
movement
request/correlation metadata
```

without privileged admin audit records for every request.

---

# 153. Data Classification

Source guidance:

```text
Internal:
stock quantities
reservation state

Confidential/Internal:
supplier/cost data if introduced
```

Inventory generally contains little PII.

---

# 154. Metrics

Business metrics:

```text
inventory_reservation_total
inventory_reservation_failure_total
inventory_release_total
inventory_consumed_total
inventory_adjustment_total
inventory_out_of_stock_total
inventory_low_stock_total
inventory_expired_reservation_total
reconciliation_mismatch_total
```

Technical:

```text
reservation_latency
lock_wait_time
deadlock_total
DB_pool_usage
expiry_backlog
outbox_backlog
```

---

# 155. SLIs

Potential:

```text
ReserveInventory success rate
P95 reservation latency
availability query latency
reservation expiry lag
outbox publication lag
reconciliation health
```

Exact SLO targets:

```text
TBD_SLO
```

---

# 156. Alerts

Alert on:

```text
reservation failure spike
DB deadlock spike
negative stock
reserved > on_hand
expiry backlog
reconciliation mismatch
outbox backlog
database failure
```

---

# 157. Dashboard

Show:

```text
reservation throughput
reservation success/failure
hot out-of-stock products
expiry backlog
adjustment activity
reconciliation mismatch
DB latency
lock waits
deadlocks
```

---

# 158. Structured Logging

Safe fields:

```text
stock_item_id
store_id
product_id
reservation_id
reference_id
operation
result
reason_code
request_id
correlation_id
```

Do not log giant item arrays unnecessarily.

---

# 159. Tracing

Reserve trace:

```text
Order Service
      ↓
Inventory RPC
      ↓
Reserve Use Case
      ↓
PostgreSQL
      ↓
Outbox
```

Useful trace attributes:

```text
store_id
line_count
result
inventory_mode summary where safe
```

Avoid high-cardinality metric labels such as order ID.

---

# 160. Runbooks

Required:

```text
Inventory DB unavailable
High deadlock rate
Reservation expiry backlog
Negative stock detected
Oversell detected
Incorrect stock adjustment
Outbox backlog
External stock sync failure
Reconciliation mismatch spike
```

---

# 161. Oversell Incident Runbook

Source flow:

```text
Identify affected stock items
      ↓
Block new reservations if necessary
      ↓
Identify conflicting orders
      ↓
Reconcile current state
      ↓
Correct through approved adjustment/reversal
      ↓
Investigate concurrency failure
      ↓
Add regression test
```

---

# 162. Negative Stock Runbook

Do not simply run:

```sql
UPDATE stock_items SET on_hand_quantity = 0;
```

First:

```text
inspect movements
inspect reservations
identify race/external sync cause
reconcile
create approved corrective movement
```

---

# 163. Expiry Backlog Runbook

Check:

```text
scheduler health
worker errors
DB locks
index/query health
batch throughput
oldest expiry age
```

Scale worker only when safe.

Use controlled backlog processing if needed.

---

# 164. PostgreSQL Failure

Because PostgreSQL is authoritative:

```text
new reservations fail safely
consume/release fail safely
```

Do not accept stock mutations only into Redis.

---

# 165. Kafka Failure

With transactional outbox:

```text
stock transaction commits
outbox remains pending
publisher retries later
```

Kafka outage must not corrupt inventory correctness.

---

# 166. Redis Failure

Availability reads may fall back to:

```text
PostgreSQL
```

according to capacity.

Authoritative mutation remains PostgreSQL-based.

---

# 167. Worker Failure

If expiry worker crashes after DB commit:

```text
reservation state remains durable
outbox remains durable
```

Another worker/run must continue safely.

---

# 168. Deadlock Handling

Even with deterministic ordering, deadlocks may occur in broader DB interactions.

Policy should define:

```text
bounded retry
retryable SQL states
max attempts
metrics
alert threshold
```

Decision:

```text
DEADLOCK_RETRY_POLICY = TBD_ENGINEERING
```

---

# 169. Backup

Inventory backup includes:

```text
stock_items
reservations
reservation_items
movements
adjustments
reconciliation data
idempotency/processed-event state where needed
outbox state
```

Backup recovery must align with Order/Payment recovery.

---

# 170. Restore Risk

Inventory is time-sensitive.

Restoring an old snapshot can:

```text
resurrect expired reservations
lose consumption
increase availability incorrectly
```

Therefore:

```text
restore alone is not recovery
```

---

# 171. Restore Verification

After restore:

```text
reconcile movement history
reconcile active reservations
compare with orders
compare external inventory if applicable
review events after restore point
rebuild cache
```

---

# 172. Disaster Recovery

Inventory DR must define:

```text
RPO
RTO
failover source of truth
write fencing
reservation behavior during outage
Kafka replay
reconciliation
```

Detailed platform mechanics are implemented in later DR phases.

---

# 173. Domain Tests

Test:

```text
valid reservation
insufficient stock
release
consume
adjust
blocked stock
unlimited stock
status transitions
availability calculation
negative-state rejection
```

---

# 174. Reservation Idempotency Tests

Test:

```text
same request same key
same key changed quantity
same order repeated
duplicate network retry
```

Verify:

```text
quantity changes exactly once
```

---

# 175. Oversell Concurrency Test

Critical scenario:

```text
100 concurrent reservation requests
limited stock
```

Verify:

```text
successful reserved total <= available stock
```

No negative availability.

---

# 176. Hot Item Test

Source example:

```text
1000 concurrent users
10 units available
```

Expected:

```text
<= 10 units reserved
remaining requests fail cleanly
no negative availability
no duplicate reservation
```

---

# 177. Multi-Item Deadlock Test

Simulate:

```text
Order A: P1 + P2
Order B: P2 + P1
```

Verify deterministic lock ordering prevents/reduces deadlock and retry behavior is safe.

---

# 178. Release Concurrency Tests

Test:

```text
release + release
release + consume
expiry + release
expiry + consume
```

Only the valid state transition(s) can mutate stock.

---

# 179. Expiry Tests

Test:

```text
active expired
active not expired
already consumed
already released
duplicate worker execution
multi-worker SKIP LOCKED behavior
```

---

# 180. Adjustment Tests

Test:

```text
increase
decrease
negative resulting state
missing reason
unauthorized actor
approval required
concurrent reservation
```

---

# 181. Persistence Tests

Use PostgreSQL Testcontainers.

Test:

```text
unique store/product
quantity constraints
reservation uniqueness
reservation-line invariant
expiry index
locking
transaction rollback
Flyway
outbox atomicity
```

---

# 182. Contract Tests

Test:

```text
ReserveInventory
ReleaseInventory
ConsumeInventory
GetAvailability
error mappings
idempotency metadata
contract versioning
deadlines/timeouts
service authentication
```

---

# 183. Kafka Tests

Test:

```text
InventoryReserved
InventoryReleased
InventoryConsumed
InventoryAdjusted
AvailabilityChanged
outbox publisher
duplicate consumer handling
event version handling
```

---

# 184. Reconciliation Tests

Create intentional:

```text
reserved counter mismatch
movement balance mismatch
stale active reservation
orphan reservation
external mismatch
```

Verify detection and mismatch workflow.

---

# 185. Failure Tests

Inject:

```text
DB timeout
deadlock
Kafka unavailable
Redis unavailable
worker crash after commit
duplicate request
network timeout with unknown client outcome
```

Verify safe recovery.

---

# 186. Unknown Outcome Test

Critical distributed scenario:

```text
Order sends ReserveInventory
Inventory commits
network response is lost
Order sees timeout
```

Retry with the same:

```text
reference
idempotency key
```

must return the existing result and must not reserve again.

---

# 187. Security Tests

Verify:

```text
public cannot adjust stock
unauthorized service cannot reserve
wrong token audience rejected
admin permission required
manual adjustment audited
block/unblock protected
```

---

# 188. Load Tests

Scenarios:

```text
many orders same hot product
many stores different products
availability read burst
reservation expiry batch
admin adjustment during checkout traffic
Redis outage under read load
```

---

# 189. Definition of Done — Reservation

Complete only when:

- [ ] Domain invariant defined.
- [ ] Atomic concurrency strategy implemented.
- [ ] Idempotency implemented.
- [ ] Business-reference uniqueness implemented.
- [ ] Reservation expiry stored.
- [ ] Release implemented.
- [ ] Consume implemented.
- [ ] Outbox implemented.
- [ ] Concurrency tests pass.
- [ ] Unknown-outcome retry passes.
- [ ] Metrics are added.
- [ ] Contract is documented.

---

# 190. Definition of Done — Adjustment

Complete only when:

- [ ] Permission defined.
- [ ] Reason required.
- [ ] Quantity validation implemented.
- [ ] Movement history written.
- [ ] Audit implemented.
- [ ] Concurrency-safe update implemented.
- [ ] Event/outbox created as required.
- [ ] Tests pass.

---

# 191. Inventory Review Checklist

## Ownership

- [ ] Inventory is the only stock-state owner.
- [ ] Catalog does not own quantity.
- [ ] Ordering does not write Inventory DB.

## Reservation

- [ ] Idempotency is defined.
- [ ] Expiry is explicit.
- [ ] Release is implemented.
- [ ] Consume is implemented.
- [ ] All-or-nothing behavior is documented.

## Concurrency

- [ ] Oversell is prevented.
- [ ] Lock/update order is deterministic.
- [ ] Deadlock behavior is defined.
- [ ] Duplicate requests are safe.

## History

- [ ] Movement history is immutable.
- [ ] Adjustments are audited.
- [ ] Reconciliation exists.

---

# 192. Inventory Data Checklist

- [ ] `(store_id, product_id)` is unique.
- [ ] Quantity type is appropriate.
- [ ] Quantity constraints exist.
- [ ] Reservation-line constraint exists.
- [ ] Reservation expiry index exists.
- [ ] Idempotency table exists.
- [ ] Outbox exists.
- [ ] Processed events exist if consuming events.
- [ ] Retention is defined.
- [ ] Migration plan exists.

---

# 193. Contract Review Checklist

- [ ] Reserve contract versioned.
- [ ] Release contract versioned.
- [ ] Consume contract versioned.
- [ ] Availability contract documented.
- [ ] Stable error codes.
- [ ] Idempotency semantics documented.
- [ ] Request deadline documented.
- [ ] Exact quantity exposure reviewed.
- [ ] Service authentication documented.
- [ ] Query-by-reference recovery contract defined if required.

---

# 194. Operations Review Checklist

- [ ] Metrics implemented.
- [ ] Alerts configured.
- [ ] Dashboard available.
- [ ] Expiry worker monitored.
- [ ] Reconciliation job monitored.
- [ ] Backup configured.
- [ ] Restore tested.
- [ ] Oversell runbook available.
- [ ] Negative-stock runbook available.
- [ ] Expiry backlog runbook available.
- [ ] Outbox monitored.

---

# 195. Production Readiness Checklist

Before production:

- [ ] Opening stock reconciled.
- [ ] Oversell policy frozen.
- [ ] Quantity type frozen.
- [ ] Reservation TTL frozen.
- [ ] Consume trigger frozen.
- [ ] Reservation orchestration frozen.
- [ ] Concurrency load test passed.
- [ ] Hot-item test passed.
- [ ] Reservation idempotency tests passed.
- [ ] Unknown-outcome retry test passed.
- [ ] Reservation expiry tested.
- [ ] Release/consume race tested.
- [ ] Expiry/release race tested.
- [ ] DB deadlock behavior tested.
- [ ] Outbox replay tested.
- [ ] Redis failure tested if enabled.
- [ ] External sync tested if applicable.
- [ ] Backup/restore/reconciliation tested.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.
- [ ] Required `TBD_*` decisions resolved.

---

# 196. Recommended Implementation Sequence

Follow the source order closely:

```text
Step 1
Bootstrap inventory-service

Step 2
Create inventory_db + Flyway

Step 3
Implement StockItem aggregate

Step 4
Implement stock_items persistence + constraints

Step 5
Implement GetAvailability

Step 6
Implement ReserveInventory with atomic concurrency control

Step 7
Implement reservation idempotency / request hashing

Step 8
Implement ReleaseInventory

Step 9
Implement ConsumeInventory

Step 10
Implement reservation expiry + worker

Step 11
Implement immutable movement history

Step 12
Implement transactional outbox

Step 13
Implement availability status events

Step 14
Implement admin stock adjustment

Step 15
Implement block / unblock

Step 16
Implement reconciliation

Step 17
Implement Redis availability cache if justified

Step 18
Implement external inventory integration if required

Step 19
Complete concurrency/failure tests

Step 20
Complete observability/runbooks

Step 21
Backup/restore/reconciliation acceptance

Step 22
Docker/local end-to-end acceptance

Step 23
Phase completion review

Step 24
Handoff to Phase 08 Cart
```

---

# 197. Step 1 — Bootstrap Acceptance

Verify:

```text
service starts
health endpoint works
inventory_db connection works
Flyway works
security config loads
internal RPC layer starts
PostgreSQL Testcontainer works
Docker image builds
ArchUnit rules pass
```

---

# 198. Step 2 — StockItem Acceptance

Verify:

```text
unique store/product
TRACKED mode works
UNLIMITED mode works if enabled
BLOCKED status prevents reservation
availability formula correct
invalid quantities rejected
version/concurrency fields persisted
```

---

# 199. Step 3 — Availability Acceptance

Verify:

```text
batch product lookup
correct IN_STOCK
correct OUT_OF_STOCK
correct BLOCKED
correct UNTRACKED/UNLIMITED behavior
exact quantity hidden from unapproved caller
```

---

# 200. Step 4 — Reserve Acceptance

Verify:

```text
valid request reserves
insufficient stock rejects
blocked item rejects
duplicate product lines normalized
multi-line all-or-nothing
same idempotency key returns same result
same key different request conflicts
same order does not reserve twice
movement/history written
outbox written
```

---

# 201. Step 5 — Oversell Acceptance

Run:

```text
high concurrency
same hot stock item
```

Verify:

```text
total successful reservation <= stock available
reserved never exceeds allowed state
available never becomes negative
```

This is mandatory before production.

---

# 202. Step 6 — Multi-Item Acceptance

Verify:

```text
P1 + P2
P2 + P1
```

concurrent reservations use deterministic locking and do not leave partial reservations.

---

# 203. Step 7 — Release Acceptance

Verify:

```text
active reservation releases
repeat release safe
release after release safe
release after consume rejected/no-op per contract
released amount not greater than remaining
availability increases exactly once
outbox/movement correct
```

---

# 204. Step 8 — Consume Acceptance

Verify:

```text
active reservation consumes
on_hand decreases
reserved decreases
available remains consistent
repeat consume does not duplicate deduction
consume after release rejected
movement/outbox correct
```

---

# 205. Step 9 — Expiry Acceptance

Verify:

```text
expired ACTIVE reservation releases
future reservation untouched
consumed reservation untouched
released reservation untouched
duplicate worker safe
multiple workers safe
expiry backlog measurable
```

---

# 206. Step 10 — Adjustment Acceptance

Verify:

```text
authorized increase
authorized decrease
reason required
invalid negative result rejected
audit written
movement immutable
concurrent checkout remains safe
```

---

# 207. Step 11 — Reconciliation Acceptance

Verify:

```text
movement mismatch detected
reserved mismatch detected
expired ACTIVE reservation detected
orphan detected
mismatch persisted
manual correction uses approved movement
```

---

# 208. Step 12 — Cache Acceptance

If enabled:

```text
availability cached
cache miss falls to DB
cache invalidates/updates after commit
Redis down does not affect reserve correctness
stale AVAILABLE can safely fail at checkout
```

---

# 209. Step 13 — Distributed Retry Acceptance

Simulate:

```text
reserve commits
response lost
caller retries
```

Verify:

```text
existing reservation returned
stock not reserved twice
```

Repeat for:

```text
release
consume
```

where idempotency keys/contracts require it.

---

# 210. Step 14 — Failure Acceptance

Exercise:

```text
PostgreSQL timeout
deadlock
Kafka down
Redis down
expiry worker crash
outbox publisher crash
external provider stale update
```

All behavior must remain correct and recoverable.

---

# 211. Step 15 — Recovery Acceptance

After restore:

```text
stock state reconciled
reservation state reconciled
order references checked
event replay controlled
cache rebuilt
no duplicate reservation/consume/release
```

---

# 212. Recommended Phase 7 Work Breakdown

Suggested tickets:

```text
INV-001 Bootstrap inventory-service
INV-002 Create inventory_db / Flyway baseline
INV-003 Implement StockItem aggregate
INV-004 Implement inventory modes
INV-005 Implement availability formula
INV-006 Implement stock-item persistence
INV-007 Add store/product uniqueness and quantity constraints
INV-008 Implement GetAvailability
INV-009 Implement Reservation aggregate
INV-010 Implement reservation persistence
INV-011 Implement reservation-line normalization
INV-012 Implement atomic reserve
INV-013 Implement deterministic multi-item locking
INV-014 Implement idempotency records/request hash
INV-015 Implement ReleaseInventory
INV-016 Implement ConsumeInventory
INV-017 Implement reservation expiry worker
INV-018 Implement SKIP LOCKED batching
INV-019 Implement inventory movements
INV-020 Implement transactional outbox
INV-021 Implement availability status events
INV-022 Implement admin adjustment
INV-023 Implement block/unblock
INV-024 Implement reconciliation run
INV-025 Implement mismatch workflow
INV-026 Implement Redis availability cache
INV-027 Implement external inventory ACL if required
INV-028 Implement internal RPC contracts
INV-029 Implement service-to-service authorization
INV-030 Implement domain tests
INV-031 Implement persistence tests
INV-032 Implement idempotency tests
INV-033 Implement hot-item concurrency tests
INV-034 Implement multi-item deadlock tests
INV-035 Implement release/consume race tests
INV-036 Implement expiry concurrency tests
INV-037 Implement Kafka/outbox tests
INV-038 Implement reconciliation tests
INV-039 Implement failure/unknown-outcome tests
INV-040 Implement admin security tests
INV-041 Implement metrics/tracing/logging
INV-042 Implement dashboard/alerts
INV-043 Write runbooks
INV-044 Backup/restore/reconciliation drill
INV-045 Legacy migration if required
INV-046 Load test
INV-047 Docker/local acceptance
INV-048 Complete ADRs/policy freeze
INV-049 Phase 7 exit review
```

---

# 213. Minimum Viable Inventory Service

Source-defined first production-capable version:

```text
Store/product stock item
Available calculation
Atomic reservation
Reservation idempotency
Release
Consume
Reservation expiry
Movement history
Outbox
Availability query
Concurrency tests
Basic reconciliation
```

Do not postpone:

```text
oversell protection
```

---

# 214. Recommended Initial Scope

Required now:

```text
store/product stock
TRACKED inventory
availability calculation
ReserveInventory
all-or-nothing reservation
idempotency
release
consume
reservation expiry
movement history
outbox
availability query
service auth
admin adjustment
basic reconciliation
hot-item concurrency tests
observability
```

Conditional:

```text
UNLIMITED mode
EXTERNAL mode
safety stock
blocked quantity
low-stock alerting
Redis availability cache
external inventory synchronization
```

---

# 215. Out of Initial Scope Unless Approved

```text
ingredient-level inventory
recipe consumption
warehouse stock
inter-store transfer
purchase receiving
supplier receiving
batch/lot tracking
expiration-date inventory
forecasting
automated replenishment
complex safety-stock planning
advanced auto-reconciliation
```

---

# 216. Phase 7 ADRs

Create/approve decisions such as:

```text
ADR-INV-001 Inventory ownership and modes
ADR-INV-002 Stock quantity type
ADR-INV-003 Availability formula
ADR-INV-004 Reservation concurrency strategy
ADR-INV-005 Reservation idempotency key/reference model
ADR-INV-006 Multi-item reservation lock ordering
ADR-INV-007 Reservation TTL
ADR-INV-008 Inventory consume trigger
ADR-INV-009 Movement ledger model
ADR-INV-010 Reconciliation model
ADR-INV-011 External inventory ownership if used
ADR-INV-012 Availability cache policy
ADR-INV-013 Internal RPC transport
```

---

# 217. Phase 7 Policy Freeze Checklist

Resolve before production:

- [ ] Inventory modes.
- [ ] Oversell policy.
- [ ] Stock scope.
- [ ] Quantity numeric type.
- [ ] Unit-of-measure scope.
- [ ] Availability formula.
- [ ] Safety stock scope.
- [ ] Blocked quantity scope.
- [ ] Low stock scope/threshold.
- [ ] Reservation uniqueness rule.
- [ ] Reservation TTL.
- [ ] Reservation extension rule.
- [ ] Partial reservation policy.
- [ ] Reservation orchestration.
- [ ] Concurrency strategy.
- [ ] Deadlock retry policy.
- [ ] Consume trigger.
- [ ] Direct deduction policy.
- [ ] Adjustment types.
- [ ] Adjustment approval/MFA rule.
- [ ] External inventory mode/source.
- [ ] External source version policy.
- [ ] Reconciliation schedule.
- [ ] Auto-repair rule.
- [ ] Exact quantity exposure.
- [ ] Cache TTL.
- [ ] Internal transport gRPC vs REST.
- [ ] Service permissions.
- [ ] Admin permissions.
- [ ] Movement retention.
- [ ] Reservation/idempotency retention.
- [ ] SLO targets.
- [ ] Alert thresholds.
- [ ] Inventory RPO.
- [ ] Inventory RTO.

---

# 218. Phase 7 Completion Tree

```text
PHASE 07 — INVENTORY SERVICE

├── Service Foundation                           ✅
│   ├── Spring Boot
│   ├── Internal RPC
│   ├── Health
│   └── Docker
│
├── Stock Domain                                 ✅
│   ├── StockItem
│   ├── InventoryMode
│   ├── Availability Formula
│   ├── Status
│   └── Quantity Invariants
│
├── Reservation                                  ✅
│   ├── Aggregate
│   ├── Idempotency
│   ├── All-or-Nothing
│   ├── Expiry
│   └── Deterministic Locking
│
├── Concurrency                                  ✅
│   ├── Atomic Reservation
│   ├── Oversell Protection
│   ├── Deadlock Strategy
│   └── Race Protection
│
├── Release                                      ✅
├── Consume                                      ✅
├── Adjustments                                  ✅
├── Movement Ledger                              ✅
├── Reconciliation                               ✅
│
├── Persistence                                  ✅
│   ├── inventory_db
│   ├── Flyway
│   ├── Constraints
│   ├── Idempotency
│   ├── Processed Events
│   └── Outbox
│
├── Contracts                                    ✅
│   ├── Reserve
│   ├── Release
│   ├── Consume
│   └── Availability
│
├── Events                                       ✅
├── Authorization / Audit                        ✅
├── Cache Guidance                               ✅
├── Testing                                      ✅
├── Observability                                ✅
├── Backup / Restore / Recovery                   ✅
├── Runbooks                                     ✅
└── Documentation / ADRs                         ✅
```

---

# 219. Exit Criteria — Ownership

The team can answer:

```text
Who owns stock quantity?
Who owns reservation state?
Can any other service write inventory_db?
```

Expected principle:

```text
Inventory Service owns authoritative stock.
```

---

# 220. Exit Criteria — Availability

The team can demonstrate:

```text
how available quantity is calculated
```

for each enabled inventory mode and optional stock component.

---

# 221. Exit Criteria — Reservation

The team can demonstrate:

```text
how one order reserves stock exactly once
```

including:

```text
network retry
duplicate request
same key/different body
```

---

# 222. Exit Criteria — Concurrency

The team can demonstrate with load tests:

```text
concurrent checkout cannot oversell
```

including hot-item scenarios.

---

# 223. Exit Criteria — Multi-Item Atomicity

The team can demonstrate:

```text
P1 succeeds
P2 fails
→ neither remains reserved
```

for all-or-nothing reservation.

---

# 224. Exit Criteria — Expiry

The team can explain and prove:

```text
how abandoned reservations return stock
```

including duplicate scheduler execution.

---

# 225. Exit Criteria — Consumption

The team can explain:

```text
exact business trigger for permanent deduction
```

and prove duplicate consume does not deduct twice.

---

# 226. Exit Criteria — Release

The team can demonstrate:

```text
cancelled / failed workflow releases inventory exactly once
```

including compensation retries.

---

# 227. Exit Criteria — Audit

The team can answer:

```text
How can every material stock change be explained?
```

using:

```text
movement history
reservation state
adjustment audit
request/correlation reference
```

---

# 228. Exit Criteria — Reconciliation

The team can demonstrate:

```text
current on_hand matches movement history
current reserved matches active reservations
external state is reconciled where applicable
```

---

# 229. Exit Criteria — Failure

The team can answer:

```text
What happens when PostgreSQL is unavailable?
What happens when Redis is unavailable?
What happens when Kafka is unavailable?
What happens when the expiry worker fails?
What happens when reserve succeeds but the caller times out?
```

---

# 230. Exit Criteria — Recovery

The team can prove:

```text
backup restore alone is not treated as complete recovery
```

and can run:

```text
restore
event/replay review
reservation reconciliation
order reconciliation
stock reconciliation
```

---

# 231. Exit Criteria — Operations

Operators can detect:

```text
oversell
negative stock
deadlocks
reservation failure spike
expiry backlog
outbox backlog
reconciliation mismatch
external sync failure
```

---

# 232. Handoff to Phase 08

After Inventory is complete, move to:

```text
PHASE 08 — Cart Service
```

Boundary:

```text
Inventory Service
    owns:
        stock
        availability
        reservation
        release
        consumption

Cart Service
    owns:
        pre-order shopping intent
        cart items
        selected modifiers
        quantities
        temporary price preview
        cart expiry
        cart validation state
```

Important:

```text
normal Add-to-Cart does not reserve Inventory
```

unless a separate scarce-item business model is explicitly approved.

Cart may display:

```text
inventory availability preview
```

but checkout must reserve authoritatively.

---

# 233. Final Phase 7 Principle

The main invariant is:

```text
Do not promise stock that cannot be fulfilled.
```

The central lifecycle is:

```text
AVAILABLE
   ↓
RESERVE
   ↓
ACTIVE
  ├── CONSUME → permanent deduction
  ├── RELEASE → available again
  └── EXPIRE  → available again
```

The implementation rules that matter most are:

```text
one authoritative inventory owner
no direct cross-service DB writes
atomic reservation
reservation idempotency
deterministic multi-item locking
all-or-nothing reservation
no oversell
release exactly once
consume exactly once
expiry exactly once
immutable movement history
reconciliation
transactional outbox
cache never authoritative for reservation
tested unknown-outcome recovery
```

---

**End of PHASE 07 — Inventory Service**
