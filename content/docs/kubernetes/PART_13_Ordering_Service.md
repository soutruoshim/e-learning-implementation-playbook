---
title: "PART 13 — ORDERING SERVICE"
---

# PART 13 — ORDERING SERVICE

> **Document Role:** Complete architecture and implementation specification for the Ordering Service.  
> **Previous Part:** PART 12 — Cart Service  
> **Next Part:** PART 14 — Payment Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, QA engineers, operations engineers, DevOps engineers, SREs, technical leads.

---

# 1738 — Purpose

The Ordering Service owns the authoritative lifecycle of a customer order.

It answers:

```text
Was an order created?
Which items were ordered?
Which prices and modifiers were accepted?
Which store owns fulfillment?
What fulfillment type was selected?
What is the current order status?
Can the order move to the requested next state?
Can the order be cancelled?
Has the order been completed?
```

An order is a durable business transaction.

Unlike Cart, Order must preserve:

```text
transaction snapshots
business state
financial references
fulfillment references
audit history
idempotency
event history
```

---

# 1739 — Responsibilities

Ordering owns:

```text
Order
Order Number
Order Items
Item / Modifier Snapshots
Store Snapshot
Customer Snapshot
Fulfillment Type
Delivery Address Snapshot
Price Breakdown Snapshot
Promotion/Coupon Snapshot
Order Status
Order Status History
Cancellation
Completion
Create-Order Idempotency
Checkout Orchestration
Order Events
Order Read Models
```

Possible future capabilities:

```text
Scheduled orders
Partial fulfillment
Split orders
Reorder
Order amendment
Kitchen status
Delivery projection
```

---

# 1740 — Non-Responsibilities

Ordering does not own:

```text
Product master
Base catalog price
Inventory stock
Payment ledger
Wallet balance
Loyalty points
Mission progress
Promotion rules
Customer profile master
Notification delivery
```

It stores transaction-time snapshots of external facts that were accepted during checkout.

---

# 1741 — Core Boundary

```text
Client / Cart
     │
     ▼
Order Service
     │
     ├── Catalog
     ├── Inventory
     ├── Promotion
     ├── Payment
     ├── Wallet
     └── Customer
     │
     ▼
  order_db
     │
     ▼
 Kafka Events
```

The Order database is authoritative for:

```text
order lifecycle
```

not for:

```text
wallet
payment
stock
points
```

---

# 1742 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Order | Durable customer purchase request |
| Order Item | Product snapshot inside an order |
| Order Number | Human/business-facing order reference |
| Order Status | Current lifecycle state |
| Fulfillment Type | Pickup, Delivery, Dine-In, etc. |
| Order Snapshot | Historical copy of external values accepted at checkout |
| Checkout | Process converting shopping intent into a durable order |
| Cancellation | Business process terminating an eligible order |
| Completion | Terminal successful order state |
| Order Command | Requested state-changing action |
| Order Event | Business fact that already occurred |
| Order Version | Optimistic concurrency version |

---

# 1743 — Order Aggregate

Possible aggregate root:

```text
Order
```

State:

```text
order_id
order_number
customer_id
store_id
status
fulfillment_type
currency
subtotal
discount_total
fee_total
tax_total
grand_total
items
payment_reference
wallet_reference
inventory_reservation_id
created_at
accepted_at
completed_at
cancelled_at
version
```

---

# 1744 — Order Item Entity

Possible fields:

```text
order_item_id
product_id
product_code_snapshot
product_name_snapshot
quantity
unit_price_snapshot
modifier_total
line_subtotal
discount_total
line_total
notes
```

The order preserves what was actually purchased.

---

# 1745 — Modifier Snapshot

Store:

```text
modifier_group_id
modifier_id
name_snapshot
price_delta_snapshot
```

and sub-modifier snapshots where required.

Never reconstruct an old order using only current Catalog state.

---

# 1746 — Customer Snapshot

Possible:

```text
customer_id
display_name_snapshot
phone_snapshot
member_id_snapshot
```

Only store what fulfillment, receipt, support, or audit truly requires.

---

# 1747 — Store Snapshot

Possible:

```text
store_id
store_code_snapshot
store_name_snapshot
```

Historical orders remain readable even if Store master data changes.

---

# 1748 — Address Snapshot

For Delivery, snapshot:

```text
recipient_name
phone
address lines
province
district
commune
postal_code
latitude
longitude
delivery instructions
```

Changing a saved Customer address later must not mutate the order.

---

# 1749 — Fulfillment Types

Canonical examples:

```text
PICKUP
DELIVERY
DINE_IN
```

Legacy values such as:

```text
pickup
delivery
selfdinein
```

must be translated through an adapter/ACL.

---

# 1750 — Fulfillment Invariants

Examples:

```text
DELIVERY requires address
PICKUP requires store
DINE_IN may require table/reference if supported
```

---

# 1751 — Order Status Model

Recommended canonical states:

```text
PENDING
ACCEPTED
PREPARING
READY
DELIVERING
DONE
CANCELLATION_REQUESTED
CANCELLED
```

Not every fulfillment type must use every state.

---

# 1752 — Legacy Status Mapping

Example:

```text
1  → PENDING
2  → ACCEPTED
3  → READY / FINISH_COOKING
4  → DELIVERING
5  → DONE
-1 → CANCELLATION_REQUESTED
-2 → CANCELLED
```

Keep numeric legacy codes outside the domain.

---

# 1753 — State Machine

```text
PENDING
  ├──> ACCEPTED
  ├──> CANCELLATION_REQUESTED
  └──> CANCELLED

ACCEPTED
  ├──> PREPARING
  ├──> CANCELLATION_REQUESTED
  └──> CANCELLED

PREPARING
  ├──> READY
  └──> cancellation path if business allows

READY
  ├──> DELIVERING
  ├──> DONE
  └──> cancellation path only if policy allows

DELIVERING
  └──> DONE

CANCELLATION_REQUESTED
  └──> CANCELLED

DONE       → terminal
CANCELLED  → terminal
```

Exact transitions must be approved by operations.

---

# 1754 — Status Invariants

```text
DONE is terminal.
CANCELLED is terminal.
Cancelled order cannot become DONE.
Completed order cannot move backward.
Every transition must be valid and auditable.
```

---

# 1755 — Creation Invariants

```text
order has at least one item
quantity > 0
items belong to one store context
currency is consistent
grand_total >= 0
checkout validation passed
idempotency key unique in scope
required fulfillment data exists
```

---

# 1756 — Financial Snapshot

Store:

```text
subtotal
discount_total
tax_total
service_fee
delivery_fee
grand_total
currency
```

These are transaction snapshots.

---

# 1757 — Pricing Formula

Example:

```text
subtotal
- discount_total
+ service_fee
+ delivery_fee
+ tax_total
=
grand_total
```

The exact formula and rounding rules must be deterministic.

---

# 1758 — Authoritative Checkout

```text
Cart / Request
      ↓
Validate Customer
      ↓
Validate Store / Fulfillment
      ↓
Validate Catalog
      ↓
Validate Modifiers
      ↓
Calculate Base Price
      ↓
Evaluate Promotion/Coupon
      ↓
Reserve Inventory
      ↓
Prepare Payment / Wallet
      ↓
Create Durable Order
```

---

# 1759 — Distributed Transaction Rule

Do not try to create one ACID transaction across:

```text
Order DB
Inventory DB
Payment DB
Wallet DB
```

Use:

```text
local transactions
idempotent commands
Saga compensation
durable workflow state
```

---

# 1760 — Checkout Orchestration

Recommended initial approach:

```text
Order Service = workflow orchestrator
```

It coordinates the workflow but does not own downstream business rules.

---

# 1761 — Orchestration Boundary

Order may decide:

```text
which step occurs next
```

Inventory decides:

```text
whether stock can be reserved
```

Payment decides:

```text
whether payment is authorized/captured
```

Wallet decides:

```text
whether wallet funds can be reserved/captured
```

Promotion decides:

```text
whether benefit is eligible
```

---

# 1762 — Create Order Request

Example:

```json
{
  "cart_id": "CRT001",
  "store_id": "STORE001",
  "fulfillment_type": "PICKUP",
  "payment_method": "WALLET"
}
```

Headers:

```text
Authorization
Idempotency-Key
X-Correlation-Id
```

Never trust a client-provided final total.

---

# 1763 — Direct Order Creation

A partner/admin flow may provide items directly instead of a cart.

Ordering must still perform:

```text
catalog validation
price calculation
modifier validation
inventory validation
promotion validation
payment handling
```

---

# 1764 — Create-Order Idempotency

Same:

```text
scope
idempotency_key
request hash
```

returns the same result.

Same key with different request:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 1765 — Idempotency Scope

Example:

```text
(user_id, CREATE_ORDER, idempotency_key)
```

or:

```text
(client_id, CREATE_ORDER, idempotency_key)
```

Choose and document one.

---

# 1766 — Idempotency Record

```text
order_idempotency
-----------------
id
scope_type
scope_id
operation
idempotency_key
request_hash
status
response_code
response_body
order_id
created_at
expires_at
```

---

# 1767 — Idempotency States

```text
IN_PROGRESS
SUCCEEDED
FAILED_RETRYABLE
FAILED_FINAL
```

---

# 1768 — Concurrent Duplicate Create

Two simultaneous requests with the same key must not create two orders.

Use:

```text
unique constraint
transaction
locking
```

---

# 1769 — Request Hash

Include important immutable checkout inputs such as:

```text
cart_id
cart_version
store_id
fulfillment_type
payment_method
direct item list if applicable
```

---

# 1770 — Catalog Validation

Retrieve:

```text
current orderable product
base price
modifier rules
store/channel eligibility
catalog version
```

Then create order snapshots.

---

# 1771 — Catalog Failure

If Catalog is unavailable:

```text
new order creation fails safely
```

unless a formally designed prevalidated snapshot protocol exists.

---

# 1772 — Inventory Reservation

Call:

```text
ReserveInventory
```

with an idempotent order/checkout reference.

---

# 1773 — Inventory Reservation Failure

Return:

```text
INSUFFICIENT_STOCK
```

and do not complete order creation as a valid purchase.

---

# 1774 — Payment Coordination

Supported payment concepts may include:

```text
External Bank/Card
Wallet
Cash
Partner-paid
```

Ordering consumes a canonical payment result.

---

# 1775 — Wallet Coordination

Typical flow:

```text
Reserve Wallet Funds
      ↓
Create/accept Order
      ↓
Capture Wallet Funds
```

Exact capture timing is business policy.

---

# 1776 — Unified Payment Abstraction

Long-term preferred:

```text
Order
  ↓
Payment Service
  ↓
provider / wallet adapter
```

If Wallet remains directly called initially, document that boundary explicitly.

---

# 1777 — Order Creation Timing

Possible approaches:

```text
reserve stock → authorize payment → create order
```

or:

```text
create durable pending workflow/order attempt
→ reserve
→ pay
→ activate order
```

If using a pre-payment order state, define semantics precisely.

---

# 1778 — Pending Payment

Possible state:

```text
PENDING_PAYMENT
```

Only add if the product needs it.

Do not overload Order Status with every Payment state.

---

# 1779 — Order Status vs Payment Status

These are separate:

```text
Order = PENDING
Payment = AUTHORIZED
```

or:

```text
Order = CANCELLED
Payment = REFUND_PENDING
```

---

# 1780 — Order Status vs Delivery Status

Delivery provider state is also separate.

Order may project selected delivery information without taking ownership of the provider domain.

---

# 1781 — Order Number

Human-facing reference:

```text
order_number
```

Requirements:

```text
stable
unique
readable
not necessarily the primary key
```

---

# 1782 — Order ID

Use an opaque stable ID such as:

```text
UUIDv7
ULID
UUID
```

---

# 1783 — Gapless Numbers

Do not require gapless order numbering unless legal/business requirements explicitly demand it.

---

# 1784 — Local Creation Transaction

```text
BEGIN

claim idempotency
insert order
insert order items
insert modifier snapshots
insert address snapshot
insert promotion snapshot
insert status history
insert outbox event
complete idempotency

COMMIT
```

Keep remote network calls outside long-held DB transactions.

---

# 1785 — Remote Call Placement

Avoid:

```text
BEGIN
call Payment
call Inventory
wait many seconds
COMMIT
```

Use durable workflow state around remote steps instead.

---

# 1786 — Checkout Workflow Record

Optional:

```text
order_workflows
---------------
workflow_id
order_id
idempotency_key
state
inventory_reservation_id
payment_id
wallet_reservation_id
last_error
retry_count
next_retry_at
created_at
updated_at
```

---

# 1787 — Workflow States

Possible:

```text
STARTED
CATALOG_VALIDATED
INVENTORY_RESERVED
PAYMENT_AUTHORIZED
ORDER_CREATED
COMPENSATING
FAILED
COMPLETED
```

---

# 1788 — Saga Pattern

Example:

```text
Reserve Inventory
      ↓
Reserve Wallet
      ↓
Create Order
      ↓
Capture Wallet
```

If later step fails:

```text
release previous reservations
```

---

# 1789 — Compensation Is a Business Action

Compensation is not distributed rollback.

Examples:

```text
ReserveInventory → ReleaseInventory
ReserveWallet    → ReleaseWalletFunds
CapturePayment   → RefundPayment
```

---

# 1790 — Compensation Idempotency

Compensation commands must be safe to retry.

Repeated release/refund must not apply twice.

---

# 1791 — Durable Saga State

If process crashes:

```text
workflow state
```

allows recovery without guessing which side effects completed.

---

# 1792 — Saga Timeouts

Each step defines:

```text
deadline
safe retry
maximum attempts
compensation
alert threshold
```

---

# 1793 — Retry Safety

Retry only with downstream idempotency.

Use stable references such as:

```text
order_id
workflow_id
payment_reference
inventory_reference
```

---

# 1794 — Checkout Failures

Possible:

```text
CATALOG_CHANGED
INVALID_MODIFIER_SELECTION
INSUFFICIENT_STOCK
COUPON_INVALID
PRICE_CHANGED
PAYMENT_FAILED
WALLET_INSUFFICIENT_BALANCE
DEPENDENCY_TIMEOUT
ORDER_CREATION_FAILED
```

---

# 1795 — Price Changed

Recommended behavior:

```text
reject checkout
return updated authoritative pricing
ask customer to confirm
```

unless business has an explicit price-protection policy.

---

# 1796 — Item Snapshot

Store:

```text
product_id
product code
product name
unit price
modifier selections
modifier price deltas
quantity
discount
line total
```

---

# 1797 — Promotion Snapshot

Store enough to explain the transaction:

```text
promotion_id
promotion_code
coupon_code
discount_type
discount_amount
rule_version
```

---

# 1798 — Tax Snapshot

If tax applies:

```text
tax rate
tax category
tax amount
```

---

# 1799 — Fee Snapshot

Possible:

```text
delivery fee
service fee
small-order fee
```

---

# 1800 — Rounding

Authoritative Order calculation must use the platform's documented rounding rules.

Historical totals must not be recalculated from future configuration.

---

# 1801 — Currency

One order should normally use one authoritative transaction currency.

If displaying converted amounts, store exchange-rate metadata only when necessary.

---

# 1802 — Acceptance

Transition:

```text
PENDING → ACCEPTED
```

Possible preconditions:

```text
not cancelled
payment condition satisfied
store allowed
inventory state acceptable
```

---

# 1803 — Accept Endpoint

Example:

```text
POST /api/v1/admin/orders/{orderId}/accept
```

May include:

```text
expected_version
estimated_ready_at
```

---

# 1804 — Preparing

Use:

```text
PREPARING
```

only if operations need it.

---

# 1805 — Ready

Pickup:

```text
READY → DONE
```

Delivery:

```text
READY → DELIVERING
```

---

# 1806 — Delivering

For delivery:

```text
READY → DELIVERING → DONE
```

---

# 1807 — Completion

`DONE` means successful fulfillment.

Publish:

```text
OrderCompleted
```

Downstream consumers may include:

```text
Loyalty
Mission
Notification
Analytics
Reporting
```

---

# 1808 — Completion Idempotency

Repeated completion must not cause:

```text
duplicate loyalty
duplicate stock consumption
duplicate capture
duplicate notification side effect
```

Order transition and downstream consumers must be idempotent.

---

# 1809 — Completion Preconditions

Possible:

```text
valid prior fulfillment state
not cancelled
required payment state satisfied
inventory consumption handled
```

---

# 1810 — Completion Transaction

```text
BEGIN

load/lock order
validate transition
set DONE
set completed_at
insert status history
insert outbox OrderCompleted

COMMIT
```

Secondary business effects happen asynchronously.

---

# 1811 — Inventory Consumption Timing

Possible at:

```text
ACCEPTED
PREPARING
DONE
```

For food operations, earlier consumption may reflect physical usage better.

Business/operations must decide.

---

# 1812 — Cancellation Model

Cancellation source may be:

```text
CUSTOMER
STORE
SYSTEM
PAYMENT_FAILURE
FRAUD
TIMEOUT
```

Store:

```text
reason_code
reason_text
actor
requested_at
cancelled_at
```

---

# 1813 — Request vs Final Cancellation

If approval/compensation is required:

```text
CANCELLATION_REQUESTED
      ↓
CANCELLED
```

If cancellation is immediate, the intermediate state may be unnecessary.

---

# 1814 — Cancellation Policy

Example:

```text
PENDING      → cancellable
ACCEPTED     → conditionally cancellable
PREPARING    → restricted
READY        → strongly restricted
DONE         → not cancellable
```

---

# 1815 — Customer Cancel Endpoint

```text
POST /api/v1/orders/{orderId}/cancel
```

Request:

```json
{
  "reason_code": "CHANGED_MIND"
}
```

Caller must own the order.

---

# 1816 — Store Cancel Endpoint

```text
POST /api/v1/admin/orders/{orderId}/cancel
```

Possible reason codes:

```text
OUT_OF_STOCK
STORE_CLOSED
SYSTEM_ERROR
CUSTOMER_REQUEST
```

---

# 1817 — Cancellation Compensation

May require:

```text
Release Inventory
Release Wallet Reservation
Refund Payment
Cancel Delivery
Restore coupon entitlement if policy allows
```

---

# 1818 — Safe Cancellation Completion

For complex payment flows:

```text
CANCELLATION_REQUESTED
      ↓
critical compensation
      ↓
CANCELLED
```

may be safer than immediately setting `CANCELLED`.

---

# 1819 — Refund Pending

Order may be:

```text
CANCELLED
```

while Payment is:

```text
REFUND_PENDING
```

if eventual refund is accepted.

---

# 1820 — Cancellation Events

Possible:

```text
OrderCancellationRequested
OrderCancelled
```

---

# 1821 — Customer Order History

Endpoint:

```text
GET /api/v1/orders
```

Supports:

```text
pagination
status
date range
```

Use read-optimized query model.

---

# 1822 — Order Detail

```text
GET /api/v1/orders/{orderId}
```

Authorization:

```text
own order
or authorized staff/support
```

---

# 1823 — Admin Search

Possible filters:

```text
order_number
customer_id
store_id
status
date range
fulfillment type
payment method projection
```

---

# 1824 — Read Model

List projection:

```text
order_id
order_number
customer_id
store_id
store_name_snapshot
status
fulfillment_type
grand_total
currency
created_at
completed_at
```

---

# 1825 — Status History

```text
order_status_history
--------------------
id
order_id
old_status
new_status
reason_code
actor_type
actor_id
occurred_at
correlation_id
```

Append-only.

---

# 1826 — Status-Change Idempotency

If current state already equals requested target and repeating is safe:

```text
return current state
```

If order moved elsewhere:

```text
ORDER_STATE_CONFLICT
```

---

# 1827 — Optimistic Locking

Use:

```text
version
```

for concurrent state updates.

---

# 1828 — Concurrent Transition Example

```text
Store → READY
Customer → CANCEL
```

One version wins.

The other reloads and reevaluates cancellation policy.

---

# 1829 — Pessimistic Locking

For selected complex operations:

```text
SELECT ... FOR UPDATE
```

may be used.

Keep transactions short.

---

# 1830 — Database Overview

Possible tables:

```text
orders
order_items
order_item_modifiers
order_item_sub_modifiers
order_addresses
order_price_breakdowns
order_promotions
order_status_history
order_cancellations
order_idempotency
order_workflows
processed_events
outbox_events
```

---

# 1831 — Orders Table

```text
orders
------
id
order_number
customer_id
store_id
status
fulfillment_type
currency
subtotal
discount_total
fee_total
tax_total
grand_total
payment_method
payment_reference
inventory_reservation_id
cart_id
created_at
accepted_at
completed_at
cancelled_at
version
```

---

# 1832 — Order Items Table

```text
order_items
-----------
id
order_id
product_id
product_code_snapshot
product_name_snapshot
quantity
unit_price
modifier_total
discount_total
line_total
notes
```

---

# 1833 — Modifier Table

```text
order_item_modifiers
--------------------
id
order_item_id
modifier_group_id
modifier_id
name_snapshot
price_delta
```

---

# 1834 — Order Address Table

```text
order_addresses
---------------
order_id
recipient_name
phone
line1
line2
province
district
commune
postal_code
latitude
longitude
delivery_instructions
```

---

# 1835 — Promotion Table

```text
order_promotions
----------------
id
order_id
promotion_id
promotion_code
coupon_code
discount_type
discount_amount
rule_version
```

---

# 1836 — Cancellation Table

```text
order_cancellations
-------------------
id
order_id
requested_by_type
requested_by_id
reason_code
reason_text
requested_at
approved_at
cancelled_at
status
```

---

# 1837 — Workflow Table

```text
order_workflows
---------------
id
order_id
workflow_type
state
step
last_error
retry_count
next_retry_at
created_at
updated_at
```

---

# 1838 — Outbox

Use for authoritative order events:

```text
OrderCreated
OrderAccepted
OrderReady
OrderCancellationRequested
OrderCancelled
OrderCompleted
```

---

# 1839 — Processed Events

Required if Ordering consumes asynchronous provider/domain events.

Use:

```text
(event_id, consumer_name)
```

deduplication.

---

# 1840 — Indexes

Likely:

```text
UNIQUE(order_number)
(customer_id, created_at DESC)
(store_id, status, created_at)
(status, created_at)
cart_id
payment_reference
```

---

# 1841 — Customer History Index

```sql
CREATE INDEX idx_orders_customer_created
ON orders(customer_id, created_at DESC);
```

---

# 1842 — Store Queue Index

```sql
CREATE INDEX idx_orders_store_status_created
ON orders(store_id, status, created_at);
```

---

# 1843 — Partial Active Index

Possible:

```sql
CREATE INDEX idx_orders_active
ON orders(store_id, created_at)
WHERE status IN (
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'DELIVERING'
);
```

---

# 1844 — REST API

Customer:

```text
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/{orderId}
POST /api/v1/orders/{orderId}/cancel
```

Store/Admin:

```text
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/{orderId}
POST /api/v1/admin/orders/{orderId}/accept
POST /api/v1/admin/orders/{orderId}/preparing
POST /api/v1/admin/orders/{orderId}/ready
POST /api/v1/admin/orders/{orderId}/complete
POST /api/v1/admin/orders/{orderId}/cancel
```

---

# 1845 — Internal Contracts

Purpose-specific examples:

```text
GetOrderSummary
GetOrderPaymentContext
GetOrderFulfillmentContext
```

Prefer events for downstream business reactions.

---

# 1846 — Create Response

Example:

```json
{
  "data": {
    "order_id": "ORD001",
    "order_number": "BROWN-10001",
    "status": "PENDING",
    "pricing": {
      "grand_total": {
        "amount": "12.50",
        "currency": "USD"
      }
    },
    "created_at": "..."
  }
}
```

---

# 1847 — Error Catalog

```text
ORDER_NOT_FOUND
ORDER_STATE_CONFLICT
ORDER_ALREADY_CANCELLED
ORDER_ALREADY_COMPLETED
ORDER_NOT_CANCELLABLE
INVALID_FULFILLMENT_TYPE
DELIVERY_ADDRESS_REQUIRED
EMPTY_ORDER
CATALOG_CHANGED
INVALID_MODIFIER_SELECTION
INSUFFICIENT_STOCK
PAYMENT_FAILED
PAYMENT_PENDING
WALLET_INSUFFICIENT_BALANCE
COUPON_INVALID
PRICE_CHANGED
IDEMPOTENCY_KEY_REUSED
CHECKOUT_IN_PROGRESS
DEPENDENCY_UNAVAILABLE
```

---

# 1848 — Error Mapping

| Error | HTTP |
|---|---:|
| ORDER_NOT_FOUND | 404 |
| ORDER_STATE_CONFLICT | 409 |
| ORDER_NOT_CANCELLABLE | 409 |
| PRICE_CHANGED | 409 / 422 |
| INSUFFICIENT_STOCK | 422 |
| WALLET_INSUFFICIENT_BALANCE | 422 |
| PAYMENT_FAILED | 422 |
| IDEMPOTENCY_KEY_REUSED | 409 |
| DEPENDENCY_UNAVAILABLE | 503 |

---

# 1849 — Customer Authorization

Customers may:

```text
create own order
read own order
read own history
request eligible cancellation
```

---

# 1850 — Store Authorization

Store staff may update only:

```text
orders belonging to assigned stores
```

and only transitions their permission allows.

---

# 1851 — Support Authorization

Support access should be separate from financial permissions.

Reading an order does not imply permission to:

```text
refund
capture payment
adjust wallet
```

---

# 1852 — Order Audit

Normal lifecycle is captured by status history.

Additional audit required for:

```text
support override
manual correction
admin cancellation
price override
financial override
```

---

# 1853 — Manual Correction

Avoid direct production SQL.

Use explicit privileged commands with:

```text
reason
actor
audit
compensation
```

---

# 1854 — Events Published

```text
OrderCreated
OrderAccepted
OrderPreparing
OrderReady
OrderDeliveryStarted
OrderCancellationRequested
OrderCancelled
OrderCompleted
```

---

# 1855 — OrderCreated Event

```json
{
  "event_id": "evt_...",
  "event_type": "ORDER_CREATED",
  "event_version": 1,
  "producer": "order-service",
  "correlation_id": "cor_...",
  "data": {
    "order_id": "ORD001",
    "order_number": "BROWN-10001",
    "customer_id": "CUS001",
    "store_id": "STORE001",
    "fulfillment_type": "PICKUP",
    "total": {
      "amount": "12.50",
      "currency": "USD"
    }
  }
}
```

---

# 1856 — OrderCompleted Event

Potential consumers:

```text
Loyalty
Mission
Notification
Analytics
Reporting
```

Keep payload purpose-driven, not a database dump.

---

# 1857 — OrderCancelled Event

Potential consumers:

```text
Notification
Analytics
Promotion reconciliation
Delivery
```

Critical financial compensation should be explicit workflow logic.

---

# 1858 — Event Ordering

Kafka partition key:

```text
order_id
```

to preserve per-order sequence.

---

# 1859 — Event Versioning

All integration events include:

```text
event_version
```

Prefer additive evolution.

---

# 1860 — Events Consumed

Possible:

```text
PaymentAuthorized
PaymentCaptured
PaymentFailed
PaymentRefunded
DeliveryStatusChanged
```

only if event-driven workflow is selected.

---

# 1861 — Payment Projection

Order may store a UI/read-model summary.

Payment Service remains authoritative.

---

# 1862 — Inventory Reference

Order may store:

```text
inventory_reservation_id
```

for traceability.

Inventory remains authoritative.

---

# 1863 — Delivery Projection

Order may project selected delivery status/reference for UX.

Partner status remains external until mapped.

---

# 1864 — Delivery Webhook Mapping

Partner statuses such as:

```text
DRIVER_ALLOCATED
DRIVER_ARRIVED
COLLECTED
DELIVERED
COMPLETED
BILL_PAID
REFUNDED
CANCELLED
```

must pass through an ACL mapping.

---

# 1865 — Status Mapping Example

```text
COLLECTED → DELIVERING
DELIVERED → possible DONE
CANCELLED → cancellation workflow
```

Exact mapping requires business confirmation.

---

# 1866 — Duplicate Webhooks

Deduplicate using:

```text
provider_event_id
```

or another stable key.

---

# 1867 — Out-of-Order Webhooks

Late lower-state callbacks must not move an order backward.

The state machine rejects invalid regressions.

---

# 1868 — Clean Architecture Layout

```text
order-service/
│
├── domain/
│   ├── order/
│   ├── item/
│   ├── fulfillment/
│   ├── cancellation/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── create/
│   ├── accept/
│   ├── prepare/
│   ├── ready/
│   ├── complete/
│   ├── cancel/
│   ├── query/
│   └── orchestration/
│
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   └── kafka/
│
├── adapter/out/
│   ├── persistence/
│   ├── catalog/
│   ├── inventory/
│   ├── promotion/
│   ├── payment/
│   ├── wallet/
│   ├── customer/
│   └── kafka/
│
└── config/
```

---

# 1869 — Input Ports

```text
CreateOrderUseCase
GetOrderUseCase
ListOrdersUseCase
AcceptOrderUseCase
StartPreparingOrderUseCase
MarkOrderReadyUseCase
CompleteOrderUseCase
RequestOrderCancellationUseCase
CancelOrderUseCase
```

---

# 1870 — Output Ports

```text
LoadOrderPort
SaveOrderPort
OrderQueryPort
CatalogPort
InventoryPort
PromotionPort
PaymentPort
WalletPort
CustomerPort
IdempotencyPort
OutboxPort
ClockPort
OrderNumberGenerator
```

---

# 1871 — CreateOrderUseCase Flow

```text
Validate caller
      ↓
Claim idempotency
      ↓
Load cart/request
      ↓
Validate customer/store
      ↓
Fetch catalog snapshots
      ↓
Evaluate promotion
      ↓
Calculate totals
      ↓
Reserve inventory
      ↓
Prepare/authorize payment
      ↓
Persist order
      ↓
Save outbox
      ↓
Finalize payment step if policy
      ↓
Return order
```

Compensate completed external steps on failure.

---

# 1872 — Order Number Generator

```java
public interface OrderNumberGenerator {
    String next(StoreId storeId, Instant now);
}
```

Implementation may use:

```text
DB sequence
distributed ID
business numbering service
```

---

# 1873 — Transition Policy

Domain behavior should explicitly validate:

```text
from
to
actor
fulfillment context
```

---

# 1874 — Cancellation Policy Inputs

Potential:

```text
current status
fulfillment type
payment state projection
elapsed time
store policy
actor type
```

---

# 1875 — Completion Policy

Ensures valid prior state and required operational/financial conditions.

---

# 1876 — Rich Domain Behavior

Prefer:

```text
order.accept()
order.startPreparing()
order.markReady()
order.complete()
order.requestCancellation()
order.cancel()
```

over:

```text
order.setStatus(...)
```

---

# 1877 — Status History Persistence

Persist status history in the same local transaction as the state update.

---

# 1878 — Customer History Query

List page should not load full aggregate graphs.

Use read DTOs/projections.

---

# 1879 — Detail Query

Load:

```text
header
items
modifiers
address
pricing
selected history
```

through optimized read queries.

---

# 1880 — Pagination

Prefer cursor pagination for large histories:

```text
created_at DESC, order_id DESC
```

---

# 1881 — Store Queue

Optimize for active states:

```text
PENDING
ACCEPTED
PREPARING
READY
```

---

# 1882 — Queue Freshness

Operational store queues need near-real-time data.

Avoid analytics-style delayed projections.

---

# 1883 — Notification Integration

Publish order events.

Notification Service owns delivery.

---

# 1884 — Loyalty Integration

`OrderCompleted` drives loyalty earning.

Ordering never writes points tables.

---

# 1885 — Mission Integration

`OrderCompleted` can qualify:

```text
first pickup
first dine-in
purchase count
store exploration
```

Mission owns progress.

---

# 1886 — Campaign Integration

Campaign/spin behavior should consume stable order events rather than live inside core Order persistence.

---

# 1887 — Secondary Effects

These should not block `DONE`:

```text
Loyalty
Mission
Notification
Analytics
Marketing
```

---

# 1888 — Dependency Classification

Critical checkout:

```text
Catalog
Inventory
Payment/Wallet
Promotion when requested/required
```

Secondary:

```text
Notification
Loyalty
Mission
Analytics
```

---

# 1889 — Promotion Failure Policy

If customer supplied a coupon and Promotion is unavailable:

```text
fail safely / return promotion unavailable
```

Do not silently remove the benefit unless explicitly approved.

---

# 1890 — Customer Dependency Reduction

Avoid requiring a live Customer Service call for every order transition.

Persist necessary customer snapshot at creation.

---

# 1891 — Payment Timeout

A timeout may mean:

```text
unknown outcome
```

Do not blindly duplicate charge.

Use idempotent reference and provider-status query.

---

# 1892 — Unknown Payment State

Possible workflow state:

```text
PAYMENT_UNKNOWN
```

Resolve via:

```text
provider query
callback
reconciliation
```

---

# 1893 — Inventory Timeout

On reservation timeout:

```text
query/retry by same reference
```

rather than creating a new reservation key.

---

# 1894 — Compensation Failure

Persist:

```text
COMPENSATION_PENDING
```

and retry asynchronously with alerting.

---

# 1895 — Workflow Recovery Worker

Scans:

```text
stuck workflows
pending compensation
unknown payment outcomes
```

---

# 1896 — Retry Metadata

Store:

```text
retry_count
next_retry_at
last_error_code
last_error_at
```

Use bounded retry.

---

# 1897 — Reconciliation

Detect:

```text
DONE but payment unsettled
CANCELLED but wallet reservation active
Order created but inventory missing
DONE but inventory not consumed
```

---

# 1898 — Payment Reconciliation

Compare:

```text
order_id
payment_reference
amount
currency
status expectation
```

---

# 1899 — Inventory Reconciliation

Detect:

```text
orphan reservation
missing consumption
reservation after cancellation
```

---

# 1900 — Reconciliation Outcome

Track mismatch lifecycle:

```text
OPEN
INVESTIGATING
RESOLVED
```

Do not silently repair high-risk financial/stock mismatches.

---

# 1901 — Metrics

Business:

```text
orders_created_total
orders_accepted_total
orders_completed_total
orders_cancelled_total
checkout_failure_total
checkout_price_changed_total
checkout_stock_failure_total
```

Technical:

```text
create_order_latency
status_transition_latency
dependency_latency
workflow_compensation_pending
outbox_backlog
```

---

# 1902 — SLIs

Possible:

```text
CreateOrder success rate
P95 CreateOrder latency
Order read availability
Status transition success rate
Event publication lag
Stuck workflow count
```

---

# 1903 — Alerts

Alert on:

```text
CreateOrder 5xx spike
checkout failure spike
payment timeout spike
inventory timeout spike
stuck workflow
compensation backlog
outbox backlog
invalid transition spike
DB deadlock spike
```

---

# 1904 — Dashboard

Show:

```text
orders/minute
completion rate
cancellation rate
checkout failures by cause
latency
payment latency
inventory latency
status distribution
stuck workflows
outbox lag
```

---

# 1905 — Logging

Safe:

```text
order_id
order_number
customer_id where appropriate
store_id
status
fulfillment_type
operation
result
request_id
correlation_id
```

Avoid raw sensitive address/payment data.

---

# 1906 — Distributed Tracing

Trace:

```text
Gateway
→ Order
→ Catalog
→ Inventory
→ Payment/Wallet
→ Order DB
→ Outbox
```

Checkout is a critical distributed trace.

---

# 1907 — Correlation ID

Use one correlation ID across the whole checkout and downstream events.

---

# 1908 — Security Risks

Primary:

```text
IDOR
price tampering
unauthorized status updates
duplicate order creation
coupon abuse
cancel/refund abuse
```

Controls:

```text
authorization
server-side pricing
idempotency
state machine
audit
rate limits
```

---

# 1909 — Client Totals Are Untrusted

Never trust client-supplied:

```text
grand_total
discount
unit_price
```

---

# 1910 — Client Status Is Untrusted

A customer request cannot directly set:

```text
status = DONE
```

---

# 1911 — Store Staff Scope

Validate staff-to-store assignment for every operational transition.

---

# 1912 — Cancellation Abuse Monitoring

If relevant, monitor rapid/repeated create-cancel patterns.

---

# 1913 — Data Classification

Likely:

```text
CONFIDENTIAL:
customer/order history
delivery address
phone

INTERNAL:
store workflow
status history

FINANCIAL-SENSITIVE:
amounts
payment references
```

---

# 1914 — Retention

Orders usually require long retention for:

```text
support
finance
reconciliation
tax/business records
analytics
loyalty disputes
```

---

# 1915 — PII Retention

Historical address/contact snapshots may be reduced/anonymized after policy thresholds.

---

# 1916 — Anonymization

Possible:

```text
display name removed
phone masked/removed
address reduced/removed
customer_id retained or pseudonymized
```

Financial facts remain.

---

# 1917 — Hard Delete

Avoid hard deletion of completed financial orders unless a specific policy requires it.

---

# 1918 — Backup

Back up:

```text
orders
items
snapshots
status history
cancellations
workflow state
outbox
```

---

# 1919 — Restore

After restore:

```text
reconcile payments
reconcile inventory
repair/replay outbox
review post-restore-point orders
```

---

# 1920 — Disaster Recovery

Define:

```text
RPO
RTO
event replay
idempotent recovery
payment reconciliation
inventory reconciliation
DB failover
routing
```

---

# 1921 — Flyway Plan

Example:

```text
V1__create_orders.sql
V2__create_order_items.sql
V3__create_order_item_modifiers.sql
V4__create_order_addresses.sql
V5__create_order_promotions.sql
V6__create_order_status_history.sql
V7__create_order_cancellations.sql
V8__create_order_idempotency.sql
V9__create_order_workflows.sql
V10__create_processed_events.sql
V11__create_outbox.sql
```

---

# 1922 — Status Schema Evolution

When adding a new status:

```text
update readers first
deploy tolerant consumers
then start producing new state
```

---

# 1923 — Legacy Order Migration

Preserve where available:

```text
order number
status
store
customer mapping
items
totals
timestamps
fulfillment type
financial references
```

---

# 1924 — Legacy Status Mapping Table

Keep explicit mapping documentation/table.

Do not scatter legacy status translation throughout the codebase.

---

# 1925 — Strangler Cutover

```text
Gateway
  ├── legacy order routes
  └── new order-service routes
```

Source of truth per channel must be explicit.

---

# 1926 — Avoid Dual Write

Prefer:

```text
one authoritative order write
+
event/synchronization
```

over writing both legacy and new DB synchronously.

---

# 1927 — Testing Strategy

Test:

```text
Domain
Application
REST
Persistence
Concurrency
Idempotency
Saga
Compensation
Contracts
Kafka
Migration
Load
Failure
Security
Reconciliation
```

---

# 1928 — Domain Tests

Test:

```text
valid transitions
invalid transitions
terminal states
cancellation rules
fulfillment requirements
pricing invariants
```

---

# 1929 — Create Order Tests

Scenarios:

```text
valid cart
empty cart
catalog changed
invalid modifier
insufficient stock
coupon invalid
wallet insufficient
payment failed
dependency timeout
success
```

---

# 1930 — Idempotency Tests

Critical:

```text
same key same request
same key different request
same key concurrent requests
retry after success
retry after lost response
```

Verify one order only.

---

# 1931 — Status Concurrency Tests

Test:

```text
READY vs CANCEL
DONE vs CANCEL
ACCEPT vs CANCEL
duplicate DONE
```

---

# 1932 — Saga Tests

Test:

```text
inventory success + payment fail
inventory success + wallet fail
payment success + order DB fail
compensation failure
compensation retry
process crash between steps
```

---

# 1933 — Unknown Payment Tests

Simulate provider success with response timeout.

Verify no duplicate charge.

---

# 1934 — Unknown Inventory Tests

Simulate reservation commit followed by network timeout.

Retry by same reference.

Verify no double reservation.

---

# 1935 — Cancellation Tests

Test:

```text
pending cancel
accepted cancel
preparing cancel
ready cancel
done cancel
duplicate cancel
compensation pending
refund pending
```

---

# 1936 — Completion Tests

Test:

```text
valid READY → DONE
duplicate complete
invalid PENDING → DONE
event emitted once
consumer duplicates safe
```

---

# 1937 — REST Contract Tests

Test:

```text
create
history
detail
cancel
admin transitions
errors
authorization
idempotency header
```

---

# 1938 — Persistence Tests

Use PostgreSQL Testcontainers for:

```text
unique order number
idempotency uniqueness
status-history FK
optimistic locking
Flyway
indexes
```

---

# 1939 — Kafka Tests

Test:

```text
OrderCreated
OrderAccepted
OrderReady
OrderCancelled
OrderCompleted
outbox retry
partitioning by order_id
```

---

# 1940 — Reconciliation Tests

Create mismatches such as:

```text
DONE + unpaid
CANCELLED + wallet reserved
DONE + inventory not consumed
```

Verify detection.

---

# 1941 — Load Tests

Scenarios:

```text
checkout burst
hot store
customer history reads
store queue polling
cancellation spike
```

---

# 1942 — Hot Store Test

Watch:

```text
DB connections
inventory contention
order-number generation
payment latency
```

---

# 1943 — Failure Tests

Inject:

```text
Catalog down
Inventory down
Payment timeout
Wallet timeout
Kafka down
DB deadlock
process crash after remote success
```

---

# 1944 — Security Tests

Test:

```text
customer reads another order
staff updates another store
price tampering
status tampering
duplicate replay
malformed notes/address
```

---

# 1945 — Definition of Done: Create Order

- [ ] Server-side pricing.
- [ ] Catalog validation.
- [ ] Inventory reservation.
- [ ] Payment/Wallet strategy.
- [ ] Idempotency.
- [ ] Durable snapshots.
- [ ] Compensation.
- [ ] Outbox.
- [ ] Authorization.
- [ ] Concurrency tests.
- [ ] Failure tests.
- [ ] Metrics/tracing.
- [ ] Reconciliation path.

---

# 1946 — Definition of Done: Status Transition

- [ ] Transition allowed.
- [ ] Authorization defined.
- [ ] Concurrency behavior defined.
- [ ] Status history recorded.
- [ ] Outbox event emitted.
- [ ] Duplicate behavior safe.
- [ ] Tests pass.

---

# 1947 — Definition of Done: Cancellation

- [ ] Policy defined.
- [ ] Reason codes.
- [ ] Inventory compensation.
- [ ] Payment/Wallet compensation.
- [ ] Event.
- [ ] Audit/history.
- [ ] Retry strategy.
- [ ] Compensation recovery.
- [ ] Tests pass.

---

# 1948 — Order Review Checklist

## Ownership

- [ ] Order lifecycle owned only here.
- [ ] Payment remains external.
- [ ] Inventory remains external.
- [ ] Loyalty/Mission are downstream consumers.

## Creation

- [ ] Authoritative validation.
- [ ] Server-side pricing.
- [ ] Idempotency.
- [ ] Snapshots.
- [ ] Compensation.

## Lifecycle

- [ ] Explicit state machine.
- [ ] Terminal states protected.
- [ ] Versioning/concurrency.
- [ ] History.

---

# 1949 — Data Review Checklist

- [ ] Order ID stable.
- [ ] Order number unique.
- [ ] Snapshots sufficient.
- [ ] Money exact.
- [ ] Currency explicit.
- [ ] Status indexed.
- [ ] Customer/store query indexes.
- [ ] Idempotency table.
- [ ] Workflow state if needed.
- [ ] Outbox.
- [ ] Retention/anonymization.

---

# 1950 — Contract Review Checklist

- [ ] Create contract.
- [ ] Idempotency semantics.
- [ ] History/detail.
- [ ] Cancel contract.
- [ ] Admin transition contracts.
- [ ] Error catalog.
- [ ] Event schemas.
- [ ] Dependency deadlines.
- [ ] Price-change behavior.
- [ ] Unknown-payment behavior.

---

# 1951 — Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Distributed traces.
- [ ] Recovery worker.
- [ ] Compensation monitoring.
- [ ] Reconciliation.
- [ ] Backup/restore.
- [ ] Runbooks.
- [ ] Outbox monitoring.

---

# 1952 — Production Readiness

Before production:

- [ ] Idempotency concurrency test passed.
- [ ] Inventory timeout/retry tested.
- [ ] Payment unknown outcome tested.
- [ ] Compensation tested.
- [ ] Cancellation compensation tested.
- [ ] State-machine tests complete.
- [ ] Store authorization reviewed.
- [ ] Price tampering test passed.
- [ ] Backup/restore tested.
- [ ] Order/payment reconciliation tested.
- [ ] Order/inventory reconciliation tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 1953 — Initial Implementation Order

```text
1. Order aggregate
2. Order state machine
3. Order persistence
4. Item/modifier snapshots
5. Create Order API
6. Idempotency
7. Catalog validation
8. Authoritative pricing
9. Inventory reservation
10. Payment/Wallet integration
11. Outbox
12. Order history/detail
13. Accept/Prepare/Ready
14. Completion
15. Cancellation
16. Compensation workflow
17. Workflow recovery
18. Reconciliation
19. Legacy/webhook integration
```

---

# 1954 — Minimum Viable Ordering Service

First production-capable version:

```text
Create order
Server-side price validation
Inventory reservation
Payment/Wallet integration
Idempotent creation
Durable item/price snapshots
PENDING → ACCEPTED → READY → DONE
Cancellation
Status history
Outbox events
Customer order history
Store queue
```

Do not postpone:

```text
idempotency
state machine
snapshotting
compensation
```

---

# 1955 — Future Enhancements

Potential:

```text
Scheduled orders
Partial fulfillment
Order amendment
Split order
Multi-store order
Kitchen workflow
Delivery orchestration
Reorder
Recurring order
Advanced fraud controls
Order SLA prediction
```

---

# 1956 — PART 13 Deliverables

PART 13 produces:

1. Ordering responsibility definition.
2. Boundaries from Cart/Catalog/Inventory/Payment.
3. Order aggregate.
4. Item/modifier snapshots.
5. Customer/store/address snapshots.
6. Fulfillment model.
7. Canonical status model.
8. Legacy status mapping.
9. Order invariants.
10. Financial snapshot model.
11. Authoritative checkout flow.
12. Checkout orchestration.
13. Create-order idempotency.
14. Idempotency persistence.
15. Catalog validation.
16. Inventory integration.
17. Payment/Wallet coordination.
18. Payment/order status separation.
19. Order-number strategy.
20. Local transaction pattern.
21. Workflow persistence.
22. Saga/compensation model.
23. Retry/timeout strategy.
24. Price-change behavior.
25. Acceptance/preparation/ready/completion.
26. Cancellation workflow.
27. Cancellation compensation.
28. Customer order history.
29. Store queue.
30. Status history.
31. Concurrency control.
32. Database schema.
33. Indexing strategy.
34. REST contracts.
35. Error catalog.
36. Authorization.
37. Event catalog.
38. Legacy delivery/webhook mapping.
39. Clean Architecture layout.
40. Input/output ports.
41. Reconciliation.
42. Metrics/SLIs.
43. Alerts/dashboard.
44. Logging/tracing.
45. Security controls.
46. Retention/anonymization.
47. Backup/restore.
48. DR guidance.
49. Flyway migrations.
50. Legacy migration.
51. Testing strategy.
52. Failure scenarios.
53. Review checklists.
54. Production readiness.
55. Implementation order.

---

# 1957 — Exit Criteria

The team must be able to answer:

```text
What does Ordering own?
Which checkout validations are authoritative?
How does CreateOrder remain idempotent?
Which external values become immutable snapshots?
Which state transitions are valid?
How are Inventory/Payment actions compensated?
What exactly does DONE mean?
How does cancellation recover from partial failure?
How do stuck workflows resume?
How are order/payment/inventory mismatches detected?
```

If these answers are clear and tested, Ordering Service is ready for implementation.

---

# 1958 — Handoff to PART 14

PART 14 defines Payment Service.

```text
PART 13 — Ordering
        ↓
Order Amount
Payment Intent
Order Reference
        ↓
PART 14 — Payment
```

Payment Service will own:

```text
Payment
Payment Attempt
Authorization
Capture
Provider Reference
Refund
Reversal
Callback Processing
Provider Reconciliation
Payment Idempotency
Payment Events
```

Key separation:

```text
Order Status != Payment Status
```

---

# PART 13 — Summary

The Ordering Service is the central durable business workflow for customer purchases.

Core lifecycle:

```text
Cart / Request
      ↓
Authoritative Checkout Validation
      ↓
Inventory Reservation
      ↓
Payment / Wallet
      ↓
Create Durable Order
      ↓
PENDING
      ↓
ACCEPTED
      ↓
PREPARING / READY / DELIVERING
      ↓
DONE
```

Cancellation:

```text
Eligible Order
      ↓
Cancellation Requested
      ↓
Compensate Inventory / Payment / Wallet / Delivery
      ↓
CANCELLED
```

The most important rules are:

```text
CreateOrder is idempotent.
Client prices are never trusted.
Order stores historical snapshots.
Order state has an explicit state machine.
Inventory and Payment remain separate owners.
Distributed failures use Saga compensation.
OrderCompleted drives secondary domains asynchronously.
Notification/Loyalty/Mission do not block completion.
Outbox makes events reliable.
Reconciliation detects distributed inconsistencies.
```

---

**End of PART 13 — Ordering Service**
