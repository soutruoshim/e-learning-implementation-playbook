---
title: "PART 11 — INVENTORY SERVICE"
---

# PART 11 — INVENTORY SERVICE

> **Document Role:** Defines the complete architecture, domain model, persistence model, concurrency strategy, contracts, event model, reconciliation rules, testing strategy, and production standards for the Inventory Service.  
> **Previous Part:** PART 10 — Catalog Service  
> **Next Part:** PART 12 — Cart Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, gRPC/REST, Kafka  
> **Audience:** Backend engineers, software architects, QA engineers, operations engineers, DevOps engineers, SREs, technical leads.

---

# 1349 — Purpose

The Inventory Service owns the authoritative state required to answer:

```text
How much stock is available?
Can a requested quantity be reserved?
Has inventory already been reserved for an order?
When should a reservation expire?
When should stock be released?
When should stock be permanently deducted?
How are manual stock adjustments recorded?
```

The Inventory Service protects against:

```text
overselling
double reservation
duplicate deduction
lost updates
negative stock
stale reservations
concurrent checkout races
```

The Inventory Service does **not** own:

```text
Product descriptions
Menu categories
Base product price
Order lifecycle
Payment lifecycle
Wallet balance
Promotion rules
Customer profile
```

Catalog defines what a product is.

Inventory defines whether the required stock can be fulfilled.

---

# 1350 — Inventory Service Responsibilities

Inventory Service owns:

```text
Stock items
Store-level stock
Available quantity
Reserved quantity
Inventory reservations
Reservation expiry
Reservation release
Stock deduction
Manual stock adjustments
Inventory reconciliation
Inventory availability state
Inventory movement history
Inventory events
```

Possible future responsibilities:

```text
Warehouse stock
Ingredient-level stock
Recipe consumption
Inter-store transfer
Purchase order receiving
Supplier receiving
Batch / lot tracking
Expiry date tracking
Inventory forecasting
Low-stock alerting
```

---

# 1351 — Non-Responsibilities

Inventory does not own:

```text
Product name
Product image
Menu visibility
Base price
Coupon discount
Order total
Payment state
Wallet ledger
Loyalty points
```

It may reference:

```text
product_id
store_id
order_id
```

without owning those domains.

---

# 1352 — Inventory Boundary

High-level architecture:

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
   ↓ product_id/store_id
Inventory
```

Inventory does not read Catalog database.

---

# 1353 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Stock Item | Inventory-controlled representation of a sellable/consumable product |
| On-Hand Quantity | Physical/logical quantity currently recorded |
| Reserved Quantity | Quantity temporarily held for pending fulfillment |
| Available Quantity | Quantity available for new reservations |
| Reservation | Temporary allocation of stock to a business reference |
| Deduction | Permanent reduction of stock after fulfillment |
| Release | Return of reserved quantity back to available stock |
| Adjustment | Manual/system correction of inventory quantity |
| Stock Movement | Immutable record of inventory quantity change |
| Reservation Expiry | Time after which unused reservation is released |
| Availability | Whether sufficient quantity is available for a request |

---

# 1354 — Inventory Formula

A common formula:

```text
available_quantity
=
on_hand_quantity
-
reserved_quantity
```

Example:

```text
on_hand = 100
reserved = 20

available = 80
```

If the system uses additional concepts such as:

```text
damaged
blocked
safety stock
```

the formula may become:

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

The exact business formula must be documented.

---

# 1355 — Stock Item Aggregate

Possible aggregate root:

```text
StockItem
```

Possible state:

```text
stock_item_id
store_id
product_id
on_hand_quantity
reserved_quantity
status
version
updated_at
```

Behavior:

```text
reserve(quantity)
release(quantity)
deduct(quantity)
adjust(delta)
```

---

# 1356 — Stock Item Status

Possible:

```text
ACTIVE
INACTIVE
BLOCKED
```

Meaning:

```text
ACTIVE   → normal reservation allowed
INACTIVE → item not inventory-controlled / temporarily inactive
BLOCKED  → reservation forbidden due to operational issue
```

---

# 1357 — Inventory Invariants

Examples:

```text
on_hand_quantity >= 0 unless explicit backorder model exists
reserved_quantity >= 0
reserved_quantity <= on_hand_quantity unless business explicitly allows oversell
available_quantity >= 0
reservation quantity > 0
released quantity <= remaining reservation
deducted quantity <= remaining reservation
duplicate reference must not create duplicate reservation
```

---

# 1358 — Stock Scope

Initial scope:

```text
store_id + product_id
```

Example:

```text
STORE001 + PROD001
```

uniquely identifies a stock item.

Future models may include:

```text
warehouse
location
batch
ingredient
variant
```

---

# 1359 — Stock Item Identifier

Possible:

```text
stock_item_id
```

with unique business constraint:

```text
(store_id, product_id)
```

This supports stable internal identity plus business uniqueness.

---

# 1360 — Store-Level Inventory

Each store has independent stock state.

Example:

```text
Americano
Store A → available
Store B → unavailable
```

Inventory must not assume global stock when fulfillment is store-specific.

---

# 1361 — Product Availability

Basic availability:

```text
available_quantity >= requested_quantity
```

But final availability may also require:

```text
stock item active
store open
catalog item sellable
channel allowed
```

Inventory owns stock availability only.

---

# 1362 — Inventory vs Catalog Availability

Catalog:

```text
Is this item configured to be sold?
```

Inventory:

```text
Is sufficient stock currently available?
```

Final orderability:

```text
Catalog sellable
AND
Inventory available
```

---

# 1363 — Unlimited / Non-Tracked Items

Some items may not require quantity tracking.

Possible policy:

```text
inventory_mode = TRACKED
inventory_mode = UNLIMITED
```

For unlimited items:

```text
reservation may always succeed
```

unless blocked.

Do not represent unlimited stock using an arbitrary huge number.

---

# 1364 — Inventory Modes

Possible:

```text
TRACKED
UNLIMITED
EXTERNAL
```

Meaning:

```text
TRACKED  → Inventory Service owns quantity
UNLIMITED → quantity not constrained
EXTERNAL → authoritative availability comes from external system
```

---

# 1365 — Reservation Concept

A reservation temporarily protects stock for:

```text
checkout
order creation
payment authorization
store acceptance
```

Reservation prevents another order from consuming the same stock.

---

# 1366 — Reservation Lifecycle

Recommended:

```text
PENDING / ACTIVE
      ↓
CAPTURED / DEDUCTED
```

or:

```text
ACTIVE
  ├──> RELEASED
  ├──> EXPIRED
  └──> CONSUMED
```

Use names consistently.

---

# 1367 — Reservation Status

Possible statuses:

```text
ACTIVE
CONSUMED
RELEASED
EXPIRED
CANCELLED
```

`RELEASED` may cover manual/order cancellation.

---

# 1368 — Reservation Aggregate

Possible fields:

```text
reservation_id
reference_type
reference_id
store_id
status
expires_at
created_at
updated_at
```

Reservation lines:

```text
reservation_item_id
reservation_id
stock_item_id
quantity
consumed_quantity
released_quantity
```

---

# 1369 — Reservation Reference

Reference example:

```text
reference_type = ORDER
reference_id = ORD001
```

Unique reservation scope may be:

```text
(reference_type, reference_id)
```

or:

```text
(reference_type, reference_id, reservation_type)
```

depending on requirements.

---

# 1370 — Reservation Idempotency

Repeated:

```text
ReserveInventory(order_id = ORD001)
```

must not reserve twice.

Options:

```text
unique business reference
idempotency_key
request_hash
```

Recommended:

```text
order_id / reservation reference
+
idempotency key where needed
```

---

# 1371 — Reservation Request

Example internal request:

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
  "expires_at": "2026-10-11T14:05:00Z"
}
```

---

# 1372 — Reservation Response

Example:

```json
{
  "reservation_id": "RES001",
  "status": "ACTIVE",
  "expires_at": "2026-10-11T14:05:00Z",
  "items": [
    {
      "product_id": "PROD001",
      "reserved_quantity": 2
    }
  ]
}
```

---

# 1373 — Reservation Failure

Possible:

```text
INSUFFICIENT_STOCK
STOCK_ITEM_BLOCKED
PRODUCT_NOT_TRACKED
INVALID_QUANTITY
RESERVATION_ALREADY_EXISTS_WITH_DIFFERENT_REQUEST
```

The failure should identify enough information for caller to react safely.

---

# 1374 — All-or-Nothing Reservation

Recommended initial order reservation behavior:

```text
all requested inventory lines reserve
OR
none reserve
```

Example:

```text
Coffee available
Cake unavailable
```

result:

```text
whole reservation fails
```

unless business explicitly supports partial fulfillment.

---

# 1375 — Partial Reservation

If partial fulfillment is needed later, contract must explicitly return:

```text
reserved lines
failed lines
available quantity
```

Do not accidentally create partial behavior.

---

# 1376 — Reservation Expiry

Reservations should not hold stock forever.

Example:

```text
reservation TTL = 5 minutes
```

Exact duration depends on:

```text
payment flow
order acceptance
business process
```

---

# 1377 — Expiry Timestamp

Store explicit:

```text
expires_at
```

Do not derive only from:

```text
created_at + current configuration
```

because configuration may change later.

---

# 1378 — Reservation Expiry Worker

Worker:

```text
Find ACTIVE reservations where expires_at <= now
      ↓
Lock reservation
      ↓
Verify still active
      ↓
Release quantities
      ↓
Mark EXPIRED
      ↓
Publish InventoryReservationExpired
```

---

# 1379 — Expiry Idempotency

Worker may process same reservation more than once.

State transition must ensure:

```text
ACTIVE → EXPIRED
```

occurs once.

Subsequent attempts:

```text
no-op
```

---

# 1380 — Reservation Extension

If business allows:

```text
ExtendReservation
```

must validate:

```text
current status ACTIVE
new expiry later than current
maximum allowed extension
authorization
```

Avoid unlimited reservation extension.

---

# 1381 — Release

Release returns reserved quantity.

Example:

```text
Order cancelled
      ↓
Release inventory
```

Formula:

```text
reserved_quantity
=
reserved_quantity
-
released_quantity
```

Available increases.

---

# 1382 — Release Idempotency

Repeated release must not increase stock twice.

Use:

```text
reservation status
line remaining quantity
idempotency reference
```

---

# 1383 — Consume / Deduct

When stock is fulfilled:

```text
reserved stock
      ↓
consume/deduct
      ↓
on_hand decreases
reserved decreases
```

Example:

```text
on_hand 100
reserved 10

consume 4

on_hand = 96
reserved = 6
available = 90
```

---

# 1384 — Deduction Formula

For reserved quantity `q`:

```text
on_hand_new
=
on_hand_old - q

reserved_new
=
reserved_old - q
```

Available quantity remains unchanged by consume if quantity was already reserved:

```text
before:
on_hand=100
reserved=10
available=90

consume 5:

on_hand=95
reserved=5
available=90
```

This is an important invariant.

---

# 1385 — Direct Deduction

Some operations may deduct without reservation.

Examples:

```text
POS sale
manual correction
external fulfillment
```

If allowed, direct deduction requires:

```text
explicit command
idempotency
authorization
stock check
movement history
```

---

# 1386 — Stock Adjustment

Adjustment represents correction.

Examples:

```text
stock count correction
waste
damage
receiving
manual increase
manual decrease
```

Possible types:

```text
RECEIVE
CORRECTION_INCREASE
CORRECTION_DECREASE
DAMAGE
WASTE
TRANSFER_IN
TRANSFER_OUT
```

---

# 1387 — Adjustment Invariants

Require:

```text
reason
actor/source
reference
quantity
resulting stock valid
```

Sensitive manual adjustments should be audited.

---

# 1388 — Stock Movement Ledger

Maintain immutable movement history.

Example:

```text
inventory_movements
-------------------
RECEIVE +50
RESERVE 0 physical change
CONSUME -2
RELEASE 0 physical change
ADJUST -1
```

Depending on design, reservation movement may be represented separately.

---

# 1389 — Inventory Movement Fields

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

# 1390 — Movement Immutability

Do not edit historical movement.

Correction should create a new adjustment movement.

This improves:

```text
audit
reconciliation
debugging
```

---

# 1391 — Current Balance + Movement History

Use both:

```text
stock_items
```

for current state.

```text
inventory_movements
```

for immutable history.

Updates should occur atomically.

---

# 1392 — Reservation + Movement Transaction

Example:

```text
BEGIN

Lock stock item
Check available
Increase reserved quantity
Insert reservation
Insert movement/audit if used
Insert outbox

COMMIT
```

---

# 1393 — Consumption Transaction

```text
BEGIN

Lock reservation
Lock stock item
Validate remaining reserved quantity
Decrease on_hand
Decrease reserved
Mark line consumed
Update reservation status if fully consumed
Insert movement
Insert outbox

COMMIT
```

---

# 1394 — Release Transaction

```text
BEGIN

Lock reservation
Lock stock item
Validate releasable quantity
Decrease reserved
Mark released quantity
Update reservation state
Insert movement
Insert outbox

COMMIT
```

---

# 1395 — Concurrency Problem: Oversell

Initial:

```text
available = 1
```

Two requests:

```text
A reads available 1
B reads available 1
A reserves 1
B reserves 1
```

Result:

```text
reserved = 2
```

This must never happen if oversell is forbidden.

---

# 1396 — Atomic Reservation

Possible SQL approach:

```sql
UPDATE stock_items
SET reserved_quantity = reserved_quantity + :qty,
    version = version + 1
WHERE id = :stock_item_id
  AND status = 'ACTIVE'
  AND (on_hand_quantity - reserved_quantity) >= :qty;
```

Check:

```text
affected rows = 1 → success
affected rows = 0 → insufficient/conflict
```

---

# 1397 — Row Lock Reservation

Alternative:

```sql
SELECT *
FROM stock_items
WHERE id = ?
FOR UPDATE;
```

Then:

```text
validate available
update reserved
```

This is simple and safe but can reduce concurrency under high contention.

---

# 1398 — Optimistic Locking

Alternative:

```text
version
```

Read version.

Update:

```text
WHERE version = old_version
```

If conflict:

```text
retry bounded
```

Suitable when contention is lower.

---

# 1399 — Concurrency Strategy

Recommended initial approach for critical stock:

```text
atomic conditional update
```

or:

```text
pessimistic row lock
```

Measure with realistic load.

Correctness is more important than theoretical throughput.

---

# 1400 — Multi-Item Reservation Deadlock

When reserving multiple products:

```text
Order A locks Product 1 then Product 2
Order B locks Product 2 then Product 1
```

may deadlock.

Mitigation:

```text
sort stock_item_id
lock in deterministic order
```

---

# 1401 — Multi-Line Reservation Algorithm

Recommended:

```text
Normalize requested items
      ↓
Sort by stock_item_id
      ↓
Begin transaction
      ↓
Lock/update each item in deterministic order
      ↓
If any fail:
ROLLBACK
      ↓
Else:
create reservation
commit
```

---

# 1402 — Duplicate Product Lines

Request:

```text
PROD001 qty 1
PROD001 qty 2
```

Normalize before reservation:

```text
PROD001 qty 3
```

This reduces inconsistencies.

---

# 1403 — Quantity Type

For countable products:

```text
integer quantity
```

For weight/volume:

```text
decimal quantity
+
unit
```

Initial food-menu use case may use integer quantity.

Do not assume every future inventory item is integer-based.

---

# 1404 — Unit of Measure

Possible:

```text
EA
KG
G
L
ML
```

If needed:

```text
quantity
unit_of_measure
```

Conversions must be explicit.

---

# 1405 — Ingredient-Level Inventory

Future design:

```text
Menu Product
   ↓ recipe
Ingredients
   ↓
Inventory
```

Example:

```text
Latte
  consumes:
  1 espresso dose
  200ml milk
```

This is more complex than product-level inventory.

Do not introduce until required.

---

# 1406 — Recipe Model

Possible future:

```text
recipes
recipe_components
```

Catalog/Recipe ownership must be decided separately.

Inventory owns ingredient stock, not necessarily recipe business configuration.

---

# 1407 — Safety Stock

Optional:

```text
safety_stock_quantity
```

Available formula:

```text
on_hand
-
reserved
-
safety_stock
```

Use when operational buffer is required.

---

# 1408 — Blocked Quantity

Optional:

```text
blocked_quantity
```

for:

```text
quality hold
damage investigation
manual hold
```

Do not mix blocked quantity with reserved customer orders.

---

# 1409 — Stock Availability Status

Derived statuses:

```text
IN_STOCK
LOW_STOCK
OUT_OF_STOCK
BLOCKED
UNTRACKED
```

Thresholds may be configured.

---

# 1410 — Low Stock Threshold

Possible:

```text
low_stock_threshold
```

or central policy.

Event:

```text
InventoryLow
```

may notify operations.

---

# 1411 — Zero Stock

If:

```text
available_quantity = 0
```

availability:

```text
OUT_OF_STOCK
```

Catalog may receive projection/event to update display.

---

# 1412 — Negative Stock

If business forbids oversell:

```text
negative available stock must never occur
```

Database/application constraints should detect/prevent it.

If negative stock is allowed for special operational reasons, it must be explicit.

---

# 1413 — External Inventory Mode

Some stock may be authoritative in:

```text
POS
ERP
warehouse system
```

Inventory Service may act as:

```text
integration facade
projection
reservation coordinator
```

Ownership must be clarified.

---

# 1414 — Anti-Corruption Layer

External stock statuses:

```text
A
O
H
```

should be mapped into canonical:

```text
AVAILABLE
OUT_OF_STOCK
BLOCKED
```

through Integration/ACL.

---

# 1415 — Inventory Synchronization

Possible:

```text
External system
   ↓
Integration Service
   ↓ event
Inventory Service
   ↓
Update stock projection
```

If Inventory is not source of truth, mark data accordingly.

---

# 1416 — Synchronization Version

External updates may include:

```text
source_version
source_updated_at
```

Reject stale updates where appropriate.

---

# 1417 — Inventory Reconciliation

Reconciliation verifies:

```text
current stock state
movement history
external stock source
reservation state
```

---

# 1418 — Internal Reconciliation

Example:

```text
initial balance
+
sum(quantity movements)
=
current on_hand
```

For reservation:

```text
sum(active remaining reservation quantities)
=
stock_items.reserved_quantity
```

---

# 1419 — Reservation Reconciliation

Check:

```text
ACTIVE reservation past expiry
reservation line > stock reserved
orphan reservation
consumed + released > reserved amount
```

---

# 1420 — External Reconciliation

If POS/ERP is authoritative:

```text
compare store/product quantity
```

Detect:

```text
missing item
quantity mismatch
stale sync
duplicate source update
```

---

# 1421 — Reconciliation Mismatch

Do not silently repair high-risk mismatch.

Create:

```text
inventory_reconciliation_mismatch
```

with status:

```text
OPEN
INVESTIGATING
RESOLVED
IGNORED_APPROVED
```

---

# 1422 — Reconciliation Run

Possible table:

```text
inventory_reconciliation_runs
-----------------------------
id
scope
started_at
completed_at
status
items_checked
mismatch_count
```

---

# 1423 — Stock Count

Physical stock count may create:

```text
COUNT_ADJUSTMENT
```

Example:

```text
system on-hand = 20
physical count = 18
adjustment = -2
```

Audit actor and reason.

---

# 1424 — Admin Inventory Operations

Potential endpoints:

```text
GET  /api/v1/admin/inventory/stores/{storeId}
POST /api/v1/admin/inventory/{stockItemId}/adjust
POST /api/v1/admin/inventory/{stockItemId}/block
POST /api/v1/admin/inventory/{stockItemId}/unblock
GET  /api/v1/admin/inventory/reconciliation
```

---

# 1425 — Internal Reservation Contract

Recommended internal gRPC:

```text
ReserveInventory
ReleaseInventory
ConsumeInventory
GetAvailability
```

REST may be used initially if preferred.

---

# 1426 — gRPC Service Example

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

---

# 1427 — Reserve Request Contract

Example conceptual fields:

```text
reference_id
store_id
items[]
expires_at
idempotency_key
```

---

# 1428 — Reserve Response Contract

Return:

```text
reservation_id
status
expires_at
reserved items
```

Do not return internal database lock/version details.

---

# 1429 — Availability Query

Example:

```text
GetAvailability(
  store_id,
  product_ids[]
)
```

Response:

```text
product_id
status
available_quantity if allowed
```

Customer-facing systems may only need:

```text
AVAILABLE / UNAVAILABLE
```

rather than exact quantity.

---

# 1430 — Quantity Exposure

Do not expose exact stock quantity publicly unless product requires it.

Exact stock may be:

```text
internal operational data
```

Public catalog may receive only:

```text
IN_STOCK / OUT_OF_STOCK
```

---

# 1431 — Inventory REST Admin Contract

Example adjustment:

```text
POST /api/v1/admin/inventory/{stockItemId}/adjust
```

Request:

```json
{
  "quantity_delta": -2,
  "reason_code": "DAMAGE",
  "comment": "Damaged during handling"
}
```

---

# 1432 — Inventory Error Catalog

Candidate:

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

---

# 1433 — Error Mapping

Example:

| Error | gRPC / HTTP |
|---|---|
| STOCK_ITEM_NOT_FOUND | NOT_FOUND / 404 |
| INSUFFICIENT_STOCK | FAILED_PRECONDITION / 422 |
| STOCK_ITEM_BLOCKED | FAILED_PRECONDITION / 409/422 |
| RESERVATION_NOT_FOUND | NOT_FOUND / 404 |
| RESERVATION_CONFLICT | ALREADY_EXISTS / 409 |
| INVENTORY_CONCURRENCY_CONFLICT | ABORTED / 409 |
| INVALID_QUANTITY | INVALID_ARGUMENT / 400 |

---

# 1434 — Inventory Events Published

Candidate:

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

---

# 1435 — InventoryReserved Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "INVENTORY_RESERVED",
  "event_version": 1,
  "producer": "inventory-service",
  "data": {
    "reservation_id": "RES001",
    "reference_id": "ORD001",
    "store_id": "STORE001",
    "expires_at": "..."
  }
}
```

No need to expose internal stock counts unless consumer requires them.

---

# 1436 — InventoryReservationFailed Event

May be useful in asynchronous saga.

Data:

```text
reference_id
store_id
failure_code
failed_product_ids
```

If reservation is synchronous, failure may remain only response rather than event.

---

# 1437 — InventoryReleased Event

Useful for:

```text
order saga
analytics
operations
```

Contains:

```text
reservation_id
reference_id
reason
```

---

# 1438 — InventoryConsumed Event

Represents permanent stock reduction.

Example:

```text
reservation_id
order_id
store_id
```

---

# 1439 — Availability Changed Event

Example:

```json
{
  "event_type": "INVENTORY_AVAILABILITY_CHANGED",
  "data": {
    "store_id": "STORE001",
    "product_id": "PROD001",
    "availability": "OUT_OF_STOCK"
  }
}
```

Catalog may maintain local projection.

---

# 1440 — Event Noise

Do not publish availability event for every tiny quantity change if status did not change.

Prefer:

```text
AVAILABLE → OUT_OF_STOCK
OUT_OF_STOCK → AVAILABLE
AVAILABLE → LOW_STOCK
```

where useful.

---

# 1441 — Inventory Events Consumed

Possible:

```text
ProductCreated
ProductArchived
StoreActivated
StoreDeactivated
OrderCancelled if release is event-driven
OrderCompleted if consume is event-driven
```

The chosen orchestration/choreography design should be explicit.

---

# 1442 — Reservation Orchestration Option

Synchronous:

```text
Order Service
      ↓ ReserveInventory
Inventory
      ↓ success/failure
Order continues
```

Simple and explicit.

---

# 1443 — Reservation Saga Option

Asynchronous:

```text
OrderCreated
      ↓
Inventory Service
      ↓
InventoryReserved / Failed
      ↓
Saga continues
```

More decoupled but more complex.

Initial implementation may prefer synchronous reservation.

---

# 1444 — Release Trigger

Possible triggers:

```text
Order cancelled
Payment failed
Reservation timeout
Manual cancellation
Saga compensation
```

Exactly one release should take effect.

---

# 1445 — Consume Trigger

Possible:

```text
Order accepted
Order completed
Store fulfillment
```

Business must decide when physical stock should become permanent deduction.

For prepared food, deduction timing may be:

```text
order accepted
```

rather than final delivery.

---

# 1446 — Deduction Timing Decision

Document per product/inventory model.

Possible choices:

```text
at reservation
at order acceptance
at preparation
at completion
```

This is a business/operations decision.

---

# 1447 — Reservation vs Immediate Deduction

If stock should be considered consumed immediately:

```text
reserve + consume
```

may happen in one transaction.

Do not add reservation complexity if business never needs holding/release.

---

# 1448 — Inventory Database Overview

Possible tables:

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

# 1449 — Stock Items Table

Example:

```text
stock_items
-----------
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

Unique:

```text
(store_id, product_id)
```

---

# 1450 — Stock Quantity Constraints

Possible:

```text
on_hand_quantity >= 0
reserved_quantity >= 0
safety_stock_quantity >= 0
```

If oversell forbidden:

```text
reserved_quantity <= on_hand_quantity
```

may be constrained, but concurrency/business details must be compatible.

---

# 1451 — Reservations Table

```text
inventory_reservations
----------------------
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

---

# 1452 — Reservation Items Table

```text
inventory_reservation_items
---------------------------
id
reservation_id
stock_item_id
requested_quantity
consumed_quantity
released_quantity
created_at
updated_at
```

Invariant:

```text
consumed + released <= requested
```

---

# 1453 — Inventory Movements Table

```text
inventory_movements
-------------------
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

# 1454 — Adjustments Table

Optional if adjustment needs workflow:

```text
inventory_adjustments
---------------------
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

For sensitive operations, use approval.

---

# 1455 — Idempotency Table

```text
idempotency_records
-------------------
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

# 1456 — Processed Events Table

```text
processed_events
----------------
event_id
consumer_name
processed_at
```

Primary:

```text
(event_id, consumer_name)
```

---

# 1457 — Outbox Table

Use for:

```text
InventoryReserved
InventoryReleased
InventoryConsumed
InventoryAvailabilityChanged
```

---

# 1458 — Reservation Indexes

Useful:

```text
(reference_type, reference_id)
(status, expires_at)
store_id
```

Expiry worker needs:

```text
status = ACTIVE
AND expires_at <= now
```

---

# 1459 — Stock Item Indexes

Core unique:

```text
(store_id, product_id)
```

Additional indexes only based on real admin/query patterns.

---

# 1460 — Expiry Query

Possible index:

```sql
CREATE INDEX idx_inventory_reservations_active_expiry
ON inventory_reservations(expires_at)
WHERE status = 'ACTIVE';
```

---

# 1461 — Expiry Worker Batching

Do not process millions at once.

Use:

```text
batch size
ordered pagination
FOR UPDATE SKIP LOCKED
```

where appropriate.

---

# 1462 — SKIP LOCKED

Multiple workers can safely process expiry:

```sql
SELECT id
FROM inventory_reservations
WHERE status = 'ACTIVE'
  AND expires_at <= NOW()
ORDER BY expires_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

Then release each batch transactionally.

---

# 1463 — Inventory Service Clean Architecture

Recommended package:

```text
inventory-service/
│
├── domain/
│   ├── stock/
│   ├── reservation/
│   ├── movement/
│   ├── adjustment/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── reserve/
│   ├── release/
│   ├── consume/
│   ├── adjust/
│   ├── availability/
│   └── reconciliation/
│
├── adapter/in/
│   ├── grpc/
│   ├── rest/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── kafka/
│   ├── redis/
│   └── external/
│
└── config/
```

---

# 1464 — Input Ports

Examples:

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

---

# 1465 — Output Ports

Examples:

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

---

# 1466 — ReserveInventoryUseCase

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
Sort locks deterministically
      ↓
Reserve all
      ↓
Create reservation
      ↓
Create movements/history
      ↓
Save outbox
      ↓
Return reservation
```

---

# 1467 — ReleaseInventoryUseCase

```text
Load reservation
      ↓
If already released/expired → idempotent success
      ↓
Lock affected stock
      ↓
Release remaining quantity
      ↓
Update reservation
      ↓
Movement + outbox
```

---

# 1468 — ConsumeInventoryUseCase

```text
Load active reservation
      ↓
Lock stock
      ↓
Validate remaining
      ↓
Deduct on-hand
      ↓
Reduce reserved
      ↓
Update reservation line
      ↓
Movement
      ↓
Outbox
```

---

# 1469 — AdjustInventoryUseCase

```text
Authorize actor
      ↓
Validate reason
      ↓
Lock stock
      ↓
Apply delta
      ↓
Validate invariant
      ↓
Movement
      ↓
Audit
      ↓
Outbox
```

---

# 1470 — Availability Use Case

```text
store_id + product_ids
      ↓
Load stock state
      ↓
Apply inventory_mode
      ↓
Calculate available
      ↓
Return status
```

This should be fast.

---

# 1471 — Redis for Availability

Redis may cache availability projection:

```text
inventory:availability:{store}:{product}
```

but authoritative reservation must use PostgreSQL/transactional store.

Never reserve based only on cached value.

---

# 1472 — Cache Race

Menu displays:

```text
AVAILABLE
```

but another order reserves last stock before checkout.

Therefore:

```text
display availability is advisory
```

Order must reserve authoritatively.

---

# 1473 — Cache Update

After commit:

```text
availability changed?
      ↓
update/invalidate Redis
      ↓
publish event
```

Do not let cache failure roll back authoritative stock transaction.

---

# 1474 — Inventory Authorization

Internal reserve/release/consume:

```text
service-to-service identity
```

Admin adjust/block:

```text
inventory.manage
inventory.adjust
inventory.block
```

Exact permissions should be separate.

---

# 1475 — Sensitive Inventory Operations

Manual negative adjustment or stock override may require:

```text
reason
audit
MFA step-up
approval
```

depending on business value.

---

# 1476 — Audit Events

Audit:

```text
manual adjustment
block/unblock
reconciliation resolution
manual reservation release
configuration change
```

Normal automated reservations may use movement history rather than privileged audit event.

---

# 1477 — Inventory Data Classification

Likely:

```text
Internal:
stock quantities
reservation state

Confidential/Internal:
supplier or cost data if ever added
```

Inventory generally contains little PII.

---

# 1478 — Inventory Metrics

Business:

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
DB pool usage
expiry backlog
outbox backlog
```

---

# 1479 — Inventory SLIs

Possible:

```text
ReserveInventory success rate
P95 reservation latency
availability query latency
reservation expiry lag
outbox publication lag
reconciliation health
```

---

# 1480 — Inventory Alerts

Alert on:

```text
reservation failure spike
DB deadlocks spike
negative stock detected
reserved > on-hand
expiry backlog
reconciliation mismatch
outbox backlog
database failure
```

---

# 1481 — Inventory Dashboard

Show:

```text
reservation throughput
reservation success/failure
top out-of-stock products
expiry backlog
adjustments
reconciliation mismatch
DB latency
lock waits
deadlocks
```

---

# 1482 — Structured Logging

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

Do not log giant reservation payloads unnecessarily.

---

# 1483 — Tracing

Reserve trace:

```text
Order Service
      ↓
Inventory gRPC
      ↓
Reservation Use Case
      ↓
PostgreSQL
      ↓
Outbox
```

Trace attributes:

```text
store_id
line_count
result
```

Avoid high-cardinality metrics labels with order ID.

---

# 1484 — Runbooks

Required:

```text
Inventory DB unavailable
High deadlock rate
Reservation expiry backlog
Negative stock detected
Incorrect stock adjustment
Outbox backlog
External stock sync failure
Reconciliation mismatch spike
```

---

# 1485 — Oversell Incident Runbook

Steps:

```text
Identify affected stock items
      ↓
Block new reservations if necessary
      ↓
Identify conflicting orders
      ↓
Reconcile current state
      ↓
Correct through adjustment/reversal
      ↓
Investigate concurrency failure
      ↓
Add regression test
```

---

# 1486 — Negative Stock Runbook

Do not simply:

```text
UPDATE quantity = 0
```

First:

```text
identify movements
identify reservations
identify race or external sync
reconcile
create approved corrective movement
```

---

# 1487 — Expiry Backlog Runbook

If expired reservations are not releasing:

```text
check scheduler
check DB locks
check worker errors
check batch throughput
scale worker if safe
manually process backlog through controlled job
```

---

# 1488 — Backup

Inventory database backup includes:

```text
stock items
reservations
movements
adjustments
reconciliation data
```

Backups must align with order/payment recovery strategy.

---

# 1489 — Restore

After restore:

```text
reconcile stock movements
reconcile active reservations
compare with orders
compare external system if applicable
review events after restore point
```

---

# 1490 — Restore Risk

Inventory state is highly time-sensitive.

Restoring an old snapshot without replay/reconciliation can:

```text
resurrect expired reservations
lose consumption
incorrectly increase availability
```

Recovery must include event/source reconciliation.

---

# 1491 — Disaster Recovery

Inventory DR must define:

```text
RPO
RTO
source-of-truth after failover
reservation handling during outage
event replay
reconciliation
```

Detailed platform DR is covered later.

---

# 1492 — Schema Migration

Example Flyway plan:

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

---

# 1493 — Quantity Type Migration

Changing:

```text
INTEGER
```

to:

```text
NUMERIC
```

for weighted inventory is a major migration.

Plan:

```text
new column
dual support
backfill
code migration
constraints
cleanup
```

---

# 1494 — Legacy Inventory Migration

Sources may include:

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
cutover time
```

---

# 1495 — Opening Stock

Create explicit:

```text
OPENING_BALANCE / OPENING_STOCK
```

movement for migrated stock.

This gives an auditable starting point.

---

# 1496 — Migration Reconciliation

Before cutover compare:

```text
legacy stock
new stock
active order reservations
store/product mapping
```

Do not go live with unexplained differences.

---

# 1497 — Inventory Testing Strategy

Test categories:

```text
Domain
Application
Concurrency
Persistence
gRPC/REST
Kafka
Scheduler
Reconciliation
Migration
Load
Failure
```

---

# 1498 — Domain Tests

Test:

```text
reserve valid quantity
insufficient stock
release
consume
adjust
blocked stock
unlimited stock
status transitions
```

---

# 1499 — Reservation Idempotency Tests

Test:

```text
same request same key
same key changed quantity
same order repeated
duplicate network retry
```

Verify quantity changes only once.

---

# 1500 — Concurrency Tests

Critical:

```text
100 concurrent reservation requests
limited stock
```

Verify:

```text
successful reserved total <= available stock
```

No oversell.

---

# 1501 — Multi-Item Deadlock Tests

Simulate:

```text
Order A: P1 + P2
Order B: P2 + P1
```

Verify deterministic locking avoids/reduces deadlock.

---

# 1502 — Release Concurrency Tests

Test:

```text
two release requests
release + consume race
expiry + manual release race
```

Only valid transition should win.

---

# 1503 — Expiry Tests

Test:

```text
active expired reservation
not-yet-expired reservation
already consumed
already released
duplicate scheduler execution
```

---

# 1504 — Adjustment Tests

Test:

```text
increase
decrease
would go negative
unauthorized actor
missing reason
concurrent reservation
```

---

# 1505 — Persistence Tests

Using PostgreSQL Testcontainers:

```text
unique store/product
quantity constraints
reservation uniqueness
partial expiry index
locking
Flyway
```

---

# 1506 — Contract Tests

Test:

```text
ReserveInventory
ReleaseInventory
ConsumeInventory
GetAvailability
error mapping
idempotency metadata
deadlines
```

---

# 1507 — Kafka Tests

Test:

```text
InventoryReserved
InventoryReleased
InventoryConsumed
AvailabilityChanged
outbox publisher
duplicate consumer handling
```

---

# 1508 — Reconciliation Tests

Create intentional mismatches:

```text
reserved counter wrong
movement balance wrong
stale active reservation
```

Verify detection.

---

# 1509 — Load Tests

Scenarios:

```text
many orders same product
many stores different products
availability read burst
reservation expiry batch
admin adjustment during traffic
```

---

# 1510 — Hot Item Test

Example:

```text
1000 concurrent users
10 units available
```

Expected:

```text
exactly <=10 units reserved
remaining fail cleanly
no negative availability
```

---

# 1511 — Failure Tests

Inject:

```text
DB timeout
deadlock
Kafka unavailable
Redis unavailable
worker crash after DB commit
duplicate request
```

Verify safe recovery.

---

# 1512 — Inventory Security Tests

Verify:

```text
public cannot adjust stock
order-service can reserve only allowed operation
service token wrong audience rejected
admin adjustment audited
```

---

# 1513 — Definition of Done: Reservation

Complete when:

- [ ] Domain invariant defined.
- [ ] Atomic concurrency strategy implemented.
- [ ] Idempotency implemented.
- [ ] Reservation expiry stored.
- [ ] Release implemented.
- [ ] Consume implemented.
- [ ] Outbox event created.
- [ ] Concurrency tests pass.
- [ ] Metrics added.
- [ ] Alerts considered.
- [ ] Contract documented.

---

# 1514 — Definition of Done: Adjustment

Complete when:

- [ ] Permission defined.
- [ ] Reason required.
- [ ] Quantity validation.
- [ ] Movement history.
- [ ] Audit.
- [ ] Concurrency-safe update.
- [ ] Event published.
- [ ] Tests pass.

---

# 1515 — Inventory Review Checklist

## Ownership

- [ ] Stock state has one owner.
- [ ] Catalog does not own quantity.
- [ ] Order does not directly update stock DB.

## Reservation

- [ ] Idempotency.
- [ ] Expiry.
- [ ] Release.
- [ ] Consume.
- [ ] All-or-nothing semantics documented.

## Concurrency

- [ ] Oversell prevented.
- [ ] Lock ordering deterministic.
- [ ] Deadlock strategy.
- [ ] Duplicate requests safe.

## History

- [ ] Movement history immutable.
- [ ] Adjustments audited.
- [ ] Reconciliation exists.

---

# 1516 — Inventory Data Review Checklist

- [ ] `(store_id, product_id)` unique.
- [ ] Quantities use correct numeric type.
- [ ] Constraints prevent invalid state.
- [ ] Reservation indexes support expiry.
- [ ] Outbox exists.
- [ ] Processed-event table exists if consuming events.
- [ ] Retention defined.
- [ ] Migration plan defined.

---

# 1517 — Inventory Contract Review Checklist

- [ ] Reserve contract versioned.
- [ ] Release contract versioned.
- [ ] Consume contract versioned.
- [ ] Availability contract documented.
- [ ] Error codes stable.
- [ ] Idempotency semantics documented.
- [ ] Deadlines documented.
- [ ] Exact stock exposure reviewed.

---

# 1518 — Inventory Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Expiry worker monitoring.
- [ ] Reconciliation job.
- [ ] Backup.
- [ ] Restore test.
- [ ] Oversell runbook.
- [ ] Negative stock runbook.
- [ ] Outbox monitoring.

---

# 1519 — Inventory Production Readiness Checklist

Before production:

- [ ] Stock opening balance reconciled.
- [ ] Concurrency load test passed.
- [ ] Hot-item test passed.
- [ ] Reservation expiry tested.
- [ ] Release/consume race tested.
- [ ] DB deadlock handling tested.
- [ ] Outbox replay tested.
- [ ] External sync tested if applicable.
- [ ] Backup/restore tested.
- [ ] Reconciliation tested.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.

---

# 1520 — Initial Implementation Order

Recommended:

```text
1. StockItem aggregate
2. Stock table
3. Availability query
4. Reserve inventory
5. Idempotency
6. Release
7. Consume/deduct
8. Reservation expiry
9. Movement history
10. Outbox
11. Availability events
12. Admin adjustment
13. Block/unblock
14. Reconciliation
15. Redis availability cache
16. External inventory integration
```

---

# 1521 — Minimum Viable Inventory Service

First production-capable version:

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

Do not postpone oversell protection.

It is a core correctness requirement.

---

# 1522 — Future Enhancements

Potential:

```text
Ingredient inventory
Recipes
Warehouse inventory
Inter-store transfer
Purchase receiving
Batch/lot tracking
Expiration dates
Safety stock
Forecasting
Automated replenishment
Advanced reconciliation
```

---

# 1523 — PART 11 Deliverables

PART 11 produces:

1. Inventory Service responsibility definition.
2. Boundary from Catalog and Ordering.
3. Stock Item aggregate.
4. Inventory-mode model.
5. Availability formula.
6. Stock invariants.
7. Reservation aggregate.
8. Reservation lifecycle.
9. Reservation idempotency.
10. All-or-nothing semantics.
11. Reservation expiry.
12. Release behavior.
13. Consumption/deduction behavior.
14. Adjustment model.
15. Movement ledger/history.
16. Concurrency strategy.
17. Atomic reservation pattern.
18. Row-lock alternative.
19. Optimistic-lock alternative.
20. Multi-item lock ordering.
21. Quantity/unit guidance.
22. Safety/blocked stock guidance.
23. External inventory integration.
24. Reconciliation strategy.
25. Admin inventory APIs.
26. Internal gRPC/REST contracts.
27. Error catalog.
28. Inventory event catalog.
29. Order orchestration options.
30. Database schema.
31. Indexing strategy.
32. Expiry worker pattern.
33. Clean Architecture structure.
34. Input/output ports.
35. Redis availability guidance.
36. Authorization/audit rules.
37. Metrics/SLIs.
38. Alerts.
39. Dashboard.
40. Logging/tracing.
41. Runbooks.
42. Backup/restore.
43. DR guidance.
44. Flyway migrations.
45. Legacy migration.
46. Testing strategy.
47. Concurrency/load tests.
48. Review checklists.
49. Production readiness.
50. Implementation order.

---

# 1524 — Exit Criteria

PART 11 is complete when the team can answer:

### Ownership

```text
Who owns stock quantity and reservation state?
```

### Availability

```text
How is available quantity calculated?
```

### Reservation

```text
How does an order reserve stock exactly once?
```

### Concurrency

```text
How is overselling prevented under concurrent checkout?
```

### Expiry

```text
How are abandoned reservations released?
```

### Consumption

```text
When does reserved stock become permanent deduction?
```

### Release

```text
How are cancelled/failed orders compensated?
```

### Audit

```text
How can every stock change be explained?
```

### Reconciliation

```text
How are current quantities verified against movements and external systems?
```

### Failure

```text
What happens if DB, Redis, Kafka, or an expiry worker fails?
```

If these answers are clear and tested, Inventory Service is ready for implementation.

---

# 1525 — Handoff to PART 12

PART 12 defines Cart Service.

```text
PART 11
Inventory Service
      ↓
Authoritative Stock
Availability
Reservation
Release
Consumption
      ↓
PART 12
Cart Service
```

Cart Service will own:

```text
Pre-order shopping intent
Cart items
Selected modifiers
Quantities
Cart expiration
Price preview
Cart validation
```

Important boundary:

```text
Cart is not Order.
```

Cart may display:

```text
current catalog price
current inventory availability
promotion preview
```

but authoritative transactional validation happens during checkout/order creation.

---

# PART 11 — Summary

The Inventory Service protects one of the most important transactional invariants:

```text
Do not promise stock that cannot be fulfilled.
```

The core lifecycle is:

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

The core quantity relationship is:

```text
available
=
on_hand
-
reserved
```

The key correctness rules are:

```text
Reservations are idempotent.
Concurrent reservations cannot oversell.
Multi-item reservations are atomic where required.
Expired reservations release automatically.
Consume and release cannot both apply twice.
Every material stock change is traceable.
Inventory quantity has one authoritative owner.
Redis/cache is never authoritative for reservation.
```

For production, concurrency tests and reconciliation are as important as the normal API implementation.

---

**End of PART 11 — Inventory Service**
