---
title: "PART 12 — CART SERVICE"
---

# PART 12 — CART SERVICE

> **Document Role:** Defines the complete architecture, domain model, persistence model, validation rules, contracts, pricing-preview behavior, lifecycle, testing strategy, and operational standards for the Cart Service.  
> **Previous Part:** PART 11 — Inventory Service  
> **Next Part:** PART 13 — Ordering Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL or Redis-backed persistence depending on final decision, REST, optional Kafka  
> **Audience:** Backend engineers, software architects, mobile/web engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 1526 — Purpose

The Cart Service owns pre-order shopping intent.

It answers:

```text
What items has the customer selected?
Which quantities were selected?
Which modifiers were selected?
Which store/channel does the cart belong to?
What is the latest calculated preview total?
Is the cart still valid?
Has the cart expired?
Can the cart be converted into an order?
```

A cart is temporary.

A cart is not:

```text
an order
a payment
a stock reservation
a financial transaction
```

The Cart Service exists to improve:

```text
shopping experience
checkout preparation
validation
client synchronization
temporary selection persistence
```

---

# 1527 — Cart Service Responsibilities

Cart Service may own:

```text
Cart
Cart Items
Selected Modifiers
Selected Sub-Modifiers
Item Quantity
Store Selection
Sales Channel
Fulfillment Type Preview
Price Preview
Promotion Preview
Cart Expiration
Cart Version
Cart Validation State
Guest Cart
Authenticated Cart
Cart Merge
```

Possible future responsibilities:

```text
Saved cart
Multiple carts
Scheduled ordering cart
Shared cart
Cross-device cart sync
Cart recommendations metadata
```

---

# 1528 — Non-Responsibilities

Cart Service does not own:

```text
Product definition
Authoritative product price
Inventory stock
Inventory reservation
Promotion rule definition
Coupon entitlement
Order lifecycle
Payment state
Wallet balance
Loyalty balance
```

Cart may call or consume data from:

```text
Catalog
Inventory
Promotion
Customer
```

but does not become the authoritative owner of those facts.

---

# 1529 — Cart vs Order

The most important boundary:

```text
Cart != Order
```

Cart:

```text
temporary
editable
expirable
non-financial
may contain stale preview data
```

Order:

```text
business transaction
auditable
status-controlled
contains historical snapshots
must preserve authoritative checkout result
```

---

# 1530 — Cart Boundary

High-level architecture:

```text
Mobile / Web
     │
     ▼
 Cart Service
 ┌───┼──────────────┐
 │   │              │
 ▼   ▼              ▼
Cart Items      Validation
 │                 │
 └─────────┬───────┘
           ▼
       cart store
           │
           ├── Catalog
           ├── Inventory
           └── Promotion
```

Order flow:

```text
Cart
  ↓ checkout
Order Service
```

Order Service performs authoritative transactional validation.

---

# 1531 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Cart | Temporary customer shopping state |
| Cart Item | Product selection inside a cart |
| Selected Modifier | Modifier chosen for an item |
| Price Preview | Non-final calculated cart price |
| Cart Version | Revision used for concurrency/client synchronization |
| Cart Expiry | Time after which cart is removed or considered invalid |
| Guest Cart | Cart not yet linked to authenticated customer |
| Customer Cart | Cart linked to authenticated customer |
| Cart Merge | Combining guest and customer carts |
| Checkout Token | Optional short-lived reference passed to Ordering for checkout |
| Validation State | Result of current catalog/inventory/promotion checks |

---

# 1532 — Cart Aggregate

Possible aggregate root:

```text
Cart
```

State:

```text
cart_id
customer_id optional
guest_id optional
store_id
channel
status
currency
items
coupon_code optional
price_preview
expires_at
created_at
updated_at
version
```

---

# 1533 — Cart Status

Possible statuses:

```text
ACTIVE
CHECKOUT_IN_PROGRESS
CONVERTED
EXPIRED
ABANDONED
```

Meaning:

```text
ACTIVE               → editable
CHECKOUT_IN_PROGRESS → temporarily protected from conflicting edits if used
CONVERTED            → successfully converted into an order
EXPIRED              → expiration reached
ABANDONED            → explicitly cleared/closed
```

Initial implementation may only require:

```text
ACTIVE
CONVERTED
EXPIRED
```

---

# 1534 — Cart State Transitions

Example:

```text
ACTIVE
  ├──> CHECKOUT_IN_PROGRESS
  ├──> ABANDONED
  └──> EXPIRED

CHECKOUT_IN_PROGRESS
  ├──> ACTIVE
  └──> CONVERTED
```

If checkout locking is not used:

```text
ACTIVE → CONVERTED
ACTIVE → EXPIRED
```

---

# 1535 — Cart Invariants

Examples:

```text
cart_id is immutable
cart belongs to one store at a time
cart belongs to one sales channel at a time
cart currency is consistent
item quantity > 0
item must reference a valid product
modifier selections must belong to selected product configuration
expired cart cannot be edited
converted cart cannot be edited
cart total preview cannot be negative
```

---

# 1536 — Single-Store Cart

Recommended initial design:

```text
one cart = one store
```

Reason:

```text
pricing differs by store
availability differs by store
fulfillment differs by store
tax/configuration may differ
```

If customer switches store:

```text
clear cart
or
revalidate entire cart
```

Business UX decides behavior.

---

# 1537 — Multi-Store Cart

Avoid initially.

A multi-store cart introduces:

```text
multiple fulfillment flows
multiple inventory scopes
multiple pricing contexts
potentially multiple orders/payments
```

If required later, model as:

```text
shopping basket containing per-store carts
```

rather than one undifferentiated cart.

---

# 1538 — Cart Channel

Possible:

```text
APP
WEB
PARTNER
```

Channel may affect:

```text
catalog
price
promotion
fulfillment options
```

Store and channel should be stable inside cart unless explicitly changed.

---

# 1539 — Fulfillment Type

Cart may track intended:

```text
PICKUP
DELIVERY
DINE_IN
```

but Ordering owns final order fulfillment state.

Cart uses fulfillment type for:

```text
price preview
availability
delivery fee preview
promotion eligibility
```

---

# 1540 — Cart Item

Possible state:

```text
cart_item_id
product_id
quantity
selected_modifiers
price_preview
notes
created_at
updated_at
```

---

# 1541 — Cart Item Identity

A cart item may use:

```text
cart_item_id
```

even if two lines have same product.

Why?

Different modifier combinations may require separate lines.

Example:

```text
Latte, hot, no sugar
Latte, iced, normal sugar
```

---

# 1542 — Line Merge Rule

Items may merge only when the full selection identity matches.

Possible merge key:

```text
product_id
+
selected modifiers
+
selected sub-modifiers
+
special instructions if business treats them as distinct
```

Otherwise keep separate lines.

---

# 1543 — Cart Item Quantity

Rules:

```text
quantity > 0
quantity <= configured max
```

Maximum may come from:

```text
product rule
store rule
channel rule
anti-abuse rule
```

---

# 1544 — Quantity Update

Endpoint:

```text
PATCH /api/v1/cart/items/{cartItemId}
```

Request:

```json
{
  "quantity": 3
}
```

If quantity becomes zero:

prefer explicit:

```text
DELETE
```

rather than hidden delete-through-zero unless contract defines otherwise.

---

# 1545 — Selected Modifiers

Cart must preserve user selections.

Example:

```text
Product: Latte
Size: Large
Sugar: 50%
Milk: Oat
Extra Shot: 1
```

Cart does not own modifier definitions.

It stores selection references and current preview data.

---

# 1546 — Modifier Validation

On add/update:

```text
Cart
  ↓
Catalog validation
```

Check:

```text
modifier belongs to item
required groups satisfied
min/max respected
selected modifiers active
sub-modifiers valid
```

---

# 1547 — Modifier Snapshot

Cart may temporarily store:

```text
modifier_id
display_name_preview
price_delta_preview
```

But authoritative checkout values are refreshed before order creation.

---

# 1548 — Product Snapshot in Cart

Cart may cache:

```text
product_name
image
price preview
```

for fast display.

These are temporary.

Order Service must create final immutable snapshot from authoritative checkout validation.

---

# 1549 — Price Preview

Cart price is a preview.

It should be labeled conceptually as:

```text
estimated
preview
subject to final checkout validation
```

because:

```text
catalog price may change
promotion may expire
inventory may change
delivery fee may change
```

---

# 1550 — Price Preview Formula

Example:

```text
Item Subtotal
=
(base price + modifier deltas)
× quantity
```

Cart subtotal:

```text
sum(item subtotals)
```

Then:

```text
subtotal
- promotion preview
+ fee preview
+ tax preview
=
grand total preview
```

Exact pricing ownership is defined across Catalog, Promotion, Ordering, and Payment.

---

# 1551 — Price Preview Components

Possible structure:

```text
subtotal
discount
delivery_fee
service_fee
tax
grand_total
currency
```

Do not store only one opaque total if UI/business needs breakdown.

---

# 1552 — Currency

One cart should normally have one currency.

For current platform examples:

```text
USD
KHR
```

Currency mixing inside one cart should be avoided unless explicit conversion logic exists.

---

# 1553 — Price Drift

Scenario:

```text
Cart shows $2.50
Catalog changes to $2.75
Customer checks out
```

Checkout must:

```text
revalidate price
```

If changed, UX may:

```text
update cart and ask customer to confirm
```

or proceed under a defined price-lock policy.

---

# 1554 — Price Locking

Initial recommendation:

```text
Cart does not lock price.
```

Price becomes authoritative during order creation.

If future business requires price lock:

```text
price lock duration
scope
expiry
promotion interaction
```

must be explicitly designed.

---

# 1555 — Inventory Preview

Cart may show:

```text
AVAILABLE
LOW_STOCK
UNAVAILABLE
```

using Inventory query/projection.

This is advisory.

---

# 1556 — No Inventory Reservation on Normal Add-to-Cart

Recommended:

```text
Adding item to cart does not reserve stock.
```

Reason:

```text
users may abandon carts
reservation pressure
oversell protection belongs at checkout
```

Inventory reservation should normally begin during checkout/order creation.

---

# 1557 — When Cart Reservation Might Be Needed

Possible exceptions:

```text
limited release
ticketing
scarce item
short flash sale
```

Then cart reservation becomes a different business model and must be explicitly designed.

---

# 1558 — Promotion Preview

Cart may ask Promotion Service for:

```text
eligible discounts
coupon preview
campaign preview
```

But Promotion Service owns the rules.

Cart stores only preview result.

---

# 1559 — Coupon Code in Cart

Cart may hold:

```text
coupon_code
```

to show expected benefit.

Coupon redemption must not be permanently consumed at simple cart stage unless business requires temporary reservation.

---

# 1560 — Coupon Revalidation

During checkout:

```text
coupon eligibility
usage limit
expiry
customer eligibility
```

must be validated again.

---

# 1561 — Customer Cart

Authenticated cart:

```text
customer_id
```

comes from authenticated identity/customer mapping.

Client must not arbitrarily choose another customer ID.

---

# 1562 — Guest Cart

Guest cart may use:

```text
guest_cart_token
guest_id
anonymous_session_id
```

It must not require full customer registration.

---

# 1563 — Guest Cart Token

Properties:

```text
unguessable
short/medium-lived
scoped only to cart
rotatable
not a general access token
```

Do not expose database numeric IDs alone as proof of guest cart ownership.

---

# 1564 — Guest Cart Security

Guest operations must verify:

```text
guest cart token
cart ownership
expiry
```

Do not allow:

```text
GET /cart/{id}
```

with only predictable ID.

---

# 1565 — Guest to Customer Merge

When guest logs in:

```text
Guest Cart
   +
Existing Customer Cart
   ↓
Merge Policy
   ↓
Customer Cart
```

The merge policy must be deterministic.

---

# 1566 — Cart Merge Strategies

Possible:

```text
REPLACE
COMBINE
ASK_USER
```

Recommended if same store:

```text
COMBINE
```

with item normalization.

If different stores:

```text
ASK_USER
or
choose newest cart
```

---

# 1567 — Merge Same Product

If product + modifiers match:

```text
sum quantity
```

subject to max quantity.

If configuration differs:

```text
keep separate lines
```

---

# 1568 — Merge Price Preview

After merge:

```text
discard old totals
revalidate catalog
recalculate promotion
refresh inventory preview
```

Do not sum stale totals.

---

# 1569 — Merge Idempotency

Login/retry may trigger merge more than once.

Use:

```text
merge_id
guest_cart_id
target_cart_id
status
```

or mark guest cart as merged.

Repeated merge must not duplicate items.

---

# 1570 — Cart Expiration

Carts should expire.

Possible:

```text
24 hours
7 days
30 days
```

depending on product UX.

Exact policy should be configurable.

---

# 1571 — Sliding Expiry

Option:

```text
each meaningful cart update
extends expires_at
```

Maximum lifetime may still apply.

---

# 1572 — Absolute Expiry

Alternative:

```text
created_at + fixed duration
```

Simpler but may surprise active users.

---

# 1573 — Expiry Storage

Store explicit:

```text
expires_at
```

Do not recalculate solely from current config.

---

# 1574 — Cart Expiry Worker

If using PostgreSQL:

```text
Find ACTIVE cart where expires_at <= now
      ↓
Mark EXPIRED
      ↓
optional event
```

If using Redis with TTL:

```text
expiry may be automatic
```

but business history may be lost.

---

# 1575 — Redis-Only Cart Option

Advantages:

```text
fast
automatic TTL
simple high-volume temporary state
```

Risks:

```text
data loss under misconfiguration
weaker history
harder audit
persistence complexity
```

Suitable if cart is truly disposable.

---

# 1576 — PostgreSQL Cart Option

Advantages:

```text
durability
queryability
versioning
cross-device persistence
easier support
```

Costs:

```text
more writes
cleanup required
```

---

# 1577 — Recommended Initial Storage

For a production learning platform:

```text
PostgreSQL authoritative cart
+
Redis cache optional
```

This is easier to reason about.

If scale later justifies it:

```text
Redis-first cart
```

can be introduced.

---

# 1578 — Cart Persistence Model

Possible tables:

```text
carts
cart_items
cart_item_modifiers
cart_item_sub_modifiers
cart_price_previews
cart_merge_history
idempotency_records
outbox_events optional
```

---

# 1579 — Carts Table

Example:

```text
carts
-----
id
customer_id
guest_token_hash
store_id
channel
fulfillment_type
status
currency
coupon_code
expires_at
created_at
updated_at
version
```

Indexes:

```text
customer_id
guest_token_hash
(status, expires_at)
```

---

# 1580 — Cart Items Table

```text
cart_items
----------
id
cart_id
product_id
quantity
product_name_preview
base_price_preview
currency
notes
created_at
updated_at
version
```

---

# 1581 — Cart Item Modifiers Table

```text
cart_item_modifiers
-------------------
id
cart_item_id
modifier_group_id
modifier_id
name_preview
price_delta_preview
created_at
```

---

# 1582 — Cart Item Sub-Modifiers Table

Optional:

```text
cart_item_sub_modifiers
-----------------------
id
cart_item_modifier_id
sub_modifier_id
name_preview
price_delta_preview
```

---

# 1583 — Cart Price Preview Table

Optional if not stored in cart:

```text
cart_price_previews
-------------------
cart_id
subtotal
discount
fees
tax
grand_total
currency
calculated_at
catalog_version
promotion_version
```

---

# 1584 — Cart Merge History

Possible:

```text
cart_merge_history
------------------
id
source_cart_id
target_cart_id
merge_strategy
merged_at
result
```

Useful for debugging login/cart-sync issues.

---

# 1585 — Cart Version

Use optimistic version:

```text
version
```

to prevent stale clients overwriting newer cart state.

---

# 1586 — Optimistic Concurrency

Example:

```text
Phone A reads cart version 5
Phone B reads cart version 5

Phone A updates → version 6
Phone B updates using version 5
```

Response:

```text
CART_VERSION_CONFLICT
```

Client refreshes and retries/merges.

---

# 1587 — If-Match

REST can use:

```http
If-Match: "5"
```

or version field.

Server updates only if version matches.

---

# 1588 — Cart Version Response

Return:

```json
{
  "cart_id": "CRT001",
  "version": 6
}
```

Client stores latest version.

---

# 1589 — Add Item Endpoint

Example:

```text
POST /api/v1/cart/items
```

Request:

```json
{
  "product_id": "PROD001",
  "quantity": 2,
  "modifiers": [
    {
      "modifier_group_id": "SIZE",
      "modifier_id": "LARGE"
    }
  ]
}
```

---

# 1590 — Add Item Flow

```text
Resolve cart
      ↓
Check cart active/not expired
      ↓
Get current orderable item from Catalog
      ↓
Validate modifiers
      ↓
Check advisory availability
      ↓
Merge/add line
      ↓
Recalculate preview
      ↓
Save
      ↓
Return updated cart
```

---

# 1591 — Advisory Inventory Check

On add:

```text
Inventory says unavailable
```

possible behavior:

```text
reject add
```

or:

```text
allow but mark unavailable
```

Choose UX policy.

Even if add succeeds, checkout still revalidates.

---

# 1592 — Remove Item Endpoint

```text
DELETE /api/v1/cart/items/{cartItemId}
```

Response:

```text
updated cart
```

or:

```text
204
```

Choose contract consistently.

---

# 1593 — Clear Cart

Endpoint:

```text
DELETE /api/v1/cart
```

or:

```text
POST /api/v1/cart/clear
```

Clearing should be idempotent.

---

# 1594 — Get Cart

```text
GET /api/v1/cart
```

For authenticated user:

derive customer identity from token.

For guest:

guest cart token identifies cart.

---

# 1595 — Cart Response

Example:

```json
{
  "data": {
    "cart_id": "CRT001",
    "store_id": "STORE001",
    "channel": "APP",
    "status": "ACTIVE",
    "version": 12,
    "items": [
      {
        "cart_item_id": "CI001",
        "product_id": "PROD001",
        "name": "Latte",
        "quantity": 2,
        "unit_price_preview": {
          "amount": "3.00",
          "currency": "USD"
        }
      }
    ],
    "pricing": {
      "subtotal": {
        "amount": "6.00",
        "currency": "USD"
      },
      "discount": {
        "amount": "1.00",
        "currency": "USD"
      },
      "grand_total": {
        "amount": "5.00",
        "currency": "USD"
      }
    },
    "expires_at": "..."
  }
}
```

---

# 1596 — Change Store

Possible endpoint:

```text
PUT /api/v1/cart/store
```

Request:

```json
{
  "store_id": "STORE002"
}
```

Policy options:

```text
clear
revalidate
reject if non-empty
```

Recommended simple behavior:

```text
require explicit confirmation and revalidate everything
```

---

# 1597 — Change Channel

Changing:

```text
APP → DELIVERY_PARTNER
```

may alter:

```text
menu
price
promotion
```

Treat as major cart context change.

Recalculate from authoritative services.

---

# 1598 — Change Fulfillment Type

Changing:

```text
PICKUP → DELIVERY
```

may alter:

```text
fees
address requirement
promotion
availability
```

Recalculate preview.

---

# 1599 — Delivery Address in Cart

Cart may reference:

```text
customer_address_id
```

or temporary address selection.

Order Service must snapshot actual delivery address during checkout.

Do not depend on saved address later.

---

# 1600 — Delivery Fee Preview

If a delivery/fee service exists:

```text
Cart
  ↓
Fee calculation
```

Store preview only.

Ordering recalculates authoritative fee at checkout.

---

# 1601 — Special Instructions

Cart item may include:

```text
notes
special_instructions
```

Rules:

```text
length limit
safe characters
no HTML execution
```

Order stores final snapshot.

---

# 1602 — Item Notes vs Order Notes

Keep separate:

```text
item instruction
order instruction
delivery instruction
```

Do not overload one field.

---

# 1603 — Maximum Cart Size

Protect system from abuse.

Possible limits:

```text
max distinct items
max quantity per item
max total quantity
max payload size
```

Exact limits configurable.

---

# 1604 — Cart Validation

Validation types:

```text
structural
catalog
inventory
promotion
store/channel
expiry
customer eligibility
```

---

# 1605 — Structural Validation

Check:

```text
cart active
items present
quantity valid
currency consistent
store present
channel present
```

---

# 1606 — Catalog Validation

Check:

```text
product active
menu item exists
price available
modifier configuration valid
channel/store allowed
```

---

# 1607 — Inventory Validation

Preview:

```text
availability
```

Checkout:

```text
authoritative reserve
```

Cart validation should clearly distinguish:

```text
AVAILABLE_NOW
```

from:

```text
RESERVED
```

---

# 1608 — Promotion Validation

Check:

```text
coupon active
eligibility
minimum spend
product/store/channel scope
usage limits
```

Preview is not final redemption.

---

# 1609 — Validation Result

Example:

```json
{
  "valid": false,
  "issues": [
    {
      "code": "PRICE_CHANGED",
      "cart_item_id": "CI001"
    },
    {
      "code": "PRODUCT_UNAVAILABLE",
      "cart_item_id": "CI002"
    }
  ]
}
```

---

# 1610 — Cart Revalidation

Triggers:

```text
cart fetch after long gap
checkout
store change
channel change
coupon apply
catalog version change
manual refresh
```

---

# 1611 — Lazy Revalidation

Do not necessarily call every dependency on every GET.

Possible:

```text
preview_valid_until
catalog_version
promotion_valid_until
```

Use cached preview until invalidation/age threshold.

---

# 1612 — Dependency Call Budget

Avoid:

```text
GET /cart
  → Catalog per line
  → Inventory per line
  → Promotion per line
```

Use:

```text
batch APIs
cached projections
version checks
```

---

# 1613 — Batch Catalog Validation

Prefer:

```text
GetOrderableItems(product_ids[])
```

rather than N calls.

---

# 1614 — Batch Availability

Prefer:

```text
GetAvailability(store_id, product_ids[])
```

---

# 1615 — Promotion Calculation

Prefer one cart-level request:

```text
EvaluateCartPromotion
```

rather than one per line.

---

# 1616 — Checkout Preparation

Cart can create a checkout preparation result:

```text
validated cart snapshot
```

but Order Service still owns order creation.

Possible flow:

```text
Client
  ↓
POST /cart/validate
  ↓
validated preview
  ↓
POST /orders
```

---

# 1617 — Checkout Token

Optional optimization:

```text
Cart Service
  ↓
signed/opaque checkout_token
```

containing/reference:

```text
cart_id
cart_version
validation timestamp
catalog version
```

Order Service verifies/loads it.

Use only if it meaningfully simplifies checkout.

---

# 1618 — Checkout Token Limit

A checkout token must not become:

```text
payment authorization
inventory reservation
final price guarantee
```

unless those semantics are explicitly designed.

---

# 1619 — Checkout Lock

Optional:

```text
ACTIVE
  ↓
CHECKOUT_IN_PROGRESS
```

This may stop cart edits during order creation.

Potential timeout:

```text
checkout_lock_expires_at
```

If Order creation fails:

```text
unlock cart
```

---

# 1620 — Checkout Lock Trade-Off

Advantages:

```text
prevents client edits during conversion
```

Disadvantages:

```text
stuck carts
recovery complexity
```

Initial implementation may instead use:

```text
cart version check
```

without lock.

---

# 1621 — Cart Conversion

After successful Order creation:

```text
Cart Service marks cart CONVERTED
```

This may be triggered:

```text
synchronously by client/order result
```

or:

```text
OrderCreated event
```

Event-based marking is resilient.

---

# 1622 — OrderCreated Consumer

Flow:

```text
OrderCreated(cart_id)
      ↓
Cart Service
      ↓
Check processed event
      ↓
Mark cart CONVERTED
```

Only if order creation includes `cart_id`.

---

# 1623 — Conversion Idempotency

Duplicate OrderCreated event:

```text
CONVERTED → no-op
```

Do not create a new cart or change it twice.

---

# 1624 — Cart After Conversion

Options:

```text
return converted cart read-only
create new empty cart automatically
```

Recommended client UX:

```text
next GET /cart returns a new active cart
```

while converted cart remains historical for a short retention period if useful.

---

# 1625 — Abandoned Cart

Cart may become:

```text
ABANDONED
```

when:

```text
user explicitly clears
new store replaces old cart
guest cart merge discards source
```

---

# 1626 — Abandoned Cart Analytics

If product needs:

```text
abandoned cart analytics
```

publish minimal event:

```text
CartAbandoned
```

Avoid exposing unnecessary customer data.

---

# 1627 — Cart Events Published

Candidate:

```text
CartCreated
CartUpdated
CartCleared
CartMerged
CartConverted
CartExpired
CartAbandoned
```

Not every small quantity change needs a platform-wide event.

---

# 1628 — Event Noise Policy

Do not publish:

```text
CartItemQuantityChanged
```

to Kafka for every tap unless a real consumer needs it.

High-volume ephemeral cart changes can create unnecessary event traffic.

Prefer only lifecycle events.

---

# 1629 — CartCreated Event

Example:

```json
{
  "event_type": "CART_CREATED",
  "data": {
    "cart_id": "CRT001",
    "customer_id": "CUS001",
    "store_id": "STORE001"
  }
}
```

If no consumer needs it, do not publish it.

---

# 1630 — CartConverted Event

Potential:

```text
cart_id
order_id
customer_id
converted_at
```

Useful for analytics.

---

# 1631 — CartExpired Event

May support:

```text
analytics
remarketing
cleanup
```

Marketing use must respect consent/privacy.

---

# 1632 — Events Consumed

Possible:

```text
OrderCreated
CatalogChanged
CustomerClosed
```

Avoid consuming every catalog update if version-based lazy validation is sufficient.

---

# 1633 — CatalogChanged Reaction

Option:

```text
do nothing immediately
mark affected carts stale
```

Do not recalculate millions of carts on every price update unless necessary.

---

# 1634 — Stale Cart Marker

Possible fields:

```text
needs_revalidation
validated_at
catalog_version
```

On catalog change:

```text
mark by store/channel/version
```

or rely on version comparison during read/checkout.

---

# 1635 — Customer Closed Reaction

On:

```text
CustomerClosed
```

Cart Service may:

```text
expire/abandon active carts
```

subject to retention policy.

---

# 1636 — Cart Database Overview

Possible tables:

```text
carts
cart_items
cart_item_modifiers
cart_item_sub_modifiers
cart_price_previews
cart_merge_history
processed_events
idempotency_records
outbox_events
```

---

# 1637 — Cart Unique Rules

Potential:

```text
one ACTIVE cart per customer + store + channel
```

or:

```text
one ACTIVE cart per customer globally
```

Business must choose.

Recommended simple mobile flow:

```text
one active cart per customer
```

if one-store shopping is enforced.

---

# 1638 — Guest Cart Uniqueness

Guest token maps to one active cart.

Unique:

```text
guest_token_hash
```

for active guest cart.

---

# 1639 — Cart Retention

Possible:

```text
ACTIVE → until expiry
CONVERTED → 30–90 days or shorter
EXPIRED → short retention
ABANDONED → analytics retention
```

Exact policy must be approved.

---

# 1640 — Cleanup

Scheduled cleanup:

```text
expired carts
old converted carts
old merge history
old idempotency records
```

Do not delete active carts accidentally.

---

# 1641 — Cart Service Clean Architecture

Recommended:

```text
cart-service/
│
├── domain/
│   ├── cart/
│   ├── item/
│   ├── pricing/
│   ├── merge/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── get/
│   ├── additem/
│   ├── updateitem/
│   ├── removeitem/
│   ├── clear/
│   ├── validate/
│   ├── merge/
│   └── convert/
│
├── adapter/in/
│   ├── rest/
│   └── kafka/
│
├── adapter/out/
│   ├── persistence/
│   ├── catalog/
│   ├── inventory/
│   ├── promotion/
│   ├── redis/
│   └── kafka/
│
└── config/
```

---

# 1642 — Input Ports

Examples:

```text
GetCartUseCase
AddCartItemUseCase
UpdateCartItemUseCase
RemoveCartItemUseCase
ClearCartUseCase
ChangeStoreUseCase
ChangeFulfillmentUseCase
ApplyCouponPreviewUseCase
ValidateCartUseCase
MergeGuestCartUseCase
MarkCartConvertedUseCase
```

---

# 1643 — Output Ports

Examples:

```text
LoadCartPort
SaveCartPort
CatalogPort
InventoryAvailabilityPort
PromotionPreviewPort
CustomerPort
CartCachePort
ProcessedEventPort
OutboxPort
ClockPort
```

---

# 1644 — Catalog Port

Example:

```java
public interface CatalogPort {

    OrderableItemSnapshot getOrderableItem(
        StoreId storeId,
        ProductId productId,
        SalesChannel channel
    );
}
```

For multiple items:

```text
batch variant preferred
```

---

# 1645 — Inventory Availability Port

```java
public interface InventoryAvailabilityPort {

    Map<ProductId, Availability>
        getAvailability(
            StoreId storeId,
            Collection<ProductId> productIds
        );
}
```

No reservation here.

---

# 1646 — Promotion Preview Port

```java
public interface PromotionPreviewPort {

    PromotionPreview evaluate(
        CartPricingContext context
    );
}
```

Promotion Service remains authoritative.

---

# 1647 — Guest Token Port

If generating guest token:

```java
public interface GuestCartTokenGenerator {

    GeneratedGuestToken generate();
}
```

Store hash, return raw once.

---

# 1648 — Cart Error Catalog

Candidate:

```text
CART_NOT_FOUND
CART_EXPIRED
CART_ALREADY_CONVERTED
CART_VERSION_CONFLICT
CART_STORE_CONFLICT
CART_CHANNEL_CONFLICT
CART_ITEM_NOT_FOUND
INVALID_QUANTITY
PRODUCT_NOT_ORDERABLE
PRODUCT_UNAVAILABLE
INVALID_MODIFIER_SELECTION
PRICE_CHANGED
COUPON_INVALID
CART_LIMIT_EXCEEDED
GUEST_CART_TOKEN_INVALID
CART_MERGE_CONFLICT
```

---

# 1649 — HTTP Error Mapping

Example:

| Error | HTTP |
|---|---:|
| CART_NOT_FOUND | 404 |
| CART_EXPIRED | 410 |
| CART_ALREADY_CONVERTED | 409 |
| CART_VERSION_CONFLICT | 409 / 412 |
| CART_ITEM_NOT_FOUND | 404 |
| INVALID_QUANTITY | 400 |
| PRODUCT_NOT_ORDERABLE | 422 |
| INVALID_MODIFIER_SELECTION | 422 |
| CART_LIMIT_EXCEEDED | 422 |
| GUEST_CART_TOKEN_INVALID | 401/403 |

---

# 1650 — Authorization

Authenticated cart:

```text
user may access only own cart
```

Admin/support usually should not modify customer cart unless a specific support capability exists.

Guest:

```text
guest token must prove ownership
```

---

# 1651 — `/me` Cart Pattern

Prefer:

```text
GET /api/v1/cart
```

using authenticated identity.

Avoid:

```text
GET /api/v1/users/{userId}/cart
```

for normal customer flow.

---

# 1652 — Guest Cart Header

Possible:

```http
X-Guest-Cart-Token: <opaque-token>
```

or secure cookie.

Do not put sensitive token in URL.

---

# 1653 — Guest Cart Token Hash

Store:

```text
SHA-256(raw token)
```

or secure keyed hash.

Compare securely.

If database leaks, raw guest cart token should not be recoverable.

---

# 1654 — Cart Input Validation

Validate:

```text
product ID format
quantity
modifier list size
notes length
store ID
channel
coupon format
payload size
```

---

# 1655 — Cart Security

Primary risks:

```text
IDOR
guest cart token guessing
payload abuse
coupon abuse
price tampering
client-submitted total
```

Never trust client price totals.

---

# 1656 — Client Price Tampering

Request may submit:

```text
price = 0.01
```

Ignore it.

Server obtains current price from Catalog/Promotion.

---

# 1657 — Client Availability Tampering

Client saying:

```text
available = true
```

has no authority.

Server validates through Inventory.

---

# 1658 — Client Promotion Tampering

Client cannot set:

```text
discount_amount
```

authoritatively.

Server calculates preview.

---

# 1659 — Cart Audit

Cart normally does not require financial-grade audit.

Useful lifecycle history may include:

```text
merge
conversion
support modification
```

Do not create excessive audit overhead for every quantity click unless required.

---

# 1660 — Redis Cache

If PostgreSQL is source of truth:

Redis may cache:

```text
cart by customer
cart summary
preview
```

Use short TTL.

---

# 1661 — Cache Key

Example:

```text
cart:customer:{customer_id}
cart:guest:{token_hash}
```

Do not put raw guest token in logs or metrics.

---

# 1662 — Cache Invalidation

After write:

```text
commit
  ↓
invalidate/update cache
```

Version should prevent stale overwrites.

---

# 1663 — Cross-Device Cart

Authenticated customer may use:

```text
phone
tablet
web
```

Use one authoritative server cart.

Optimistic concurrency resolves simultaneous edits.

---

# 1664 — Cross-Device Conflict UX

If conflict:

```text
server version 8
client version 7
```

return:

```text
CART_VERSION_CONFLICT
latest cart
```

Client can refresh.

---

# 1665 — Offline Cart

Mobile may maintain local cart while offline.

On reconnect:

```text
send desired changes
```

Server must revalidate:

```text
catalog
price
availability
promotion
```

Do not assume offline preview remains valid.

---

# 1666 — Offline Merge

Possible:

```text
server cart
+
local cart
```

needs conflict policy.

Simplest:

```text
client sends operations rather than replacing whole cart
```

---

# 1667 — Command-Based Cart Sync

Possible operations:

```text
ADD_ITEM
REMOVE_ITEM
SET_QUANTITY
SET_STORE
SET_COUPON
```

This may be safer than whole-cart overwrite.

---

# 1668 — Cart Operation Idempotency

Mobile retries may duplicate `ADD_ITEM`.

Use:

```text
operation_id
```

or idempotency key for state-changing operations if needed.

---

# 1669 — Add Item Idempotency

Same:

```text
Idempotency-Key
+
same request
```

returns same result.

Different request:

```text
IDEMPOTENCY_KEY_REUSED
```

Optional but useful for unreliable mobile networks.

---

# 1670 — Cart Pricing Recalculation

Recalculate after:

```text
add
remove
quantity change
modifier change
store change
fulfillment change
coupon change
```

---

# 1671 — Incremental vs Full Recalculation

Simple/safer:

```text
recalculate whole cart
```

for moderate cart size.

Optimized later:

```text
incremental update
```

only if performance requires.

---

# 1672 — Calculation Determinism

For same inputs/version:

```text
same preview result
```

should be produced.

This simplifies debugging and contract tests.

---

# 1673 — Rounding

Cart preview must use the same documented rounding strategy as authoritative checkout.

Otherwise user sees:

```text
preview total != final total
```

for purely technical reasons.

---

# 1674 — KHR/USD Preview

If displaying converted currency:

```text
base authoritative currency
exchange rate version
rounding rule
```

must be explicit.

Converted display amount may be informational unless payment supports both currencies.

---

# 1675 — Exchange Rate Ownership

Cart should not own exchange rates.

Possible owner:

```text
Pricing/Finance configuration
```

Cart consumes the rate/version.

---

# 1676 — Price Preview Version Metadata

Useful fields:

```text
catalog_version
promotion_version
exchange_rate_version
calculated_at
```

Helps explain why preview changed.

---

# 1677 — Store Closed Validation

Cart may preview:

```text
store currently unavailable
```

But final order acceptance must validate store-operating state authoritatively.

---

# 1678 — Scheduling

If future scheduled ordering is supported:

cart may include:

```text
requested_fulfillment_at
```

which affects:

```text
menu
availability
promotion
```

This significantly increases complexity.

---

# 1679 — Cart Personalization

Recommendations should not change authoritative cart.

Example:

```text
"You may also like..."
```

belongs to recommendation/read experience.

---

# 1680 — Cart Analytics

Useful events/metrics:

```text
cart_created
cart_converted
cart_abandoned
cart_expired
```

Detailed behavioral analytics may be emitted through separate analytics tracking, not core domain events.

---

# 1681 — Privacy

Cart may contain:

```text
customer_id
address reference
product preferences
notes
```

Treat as customer-related data.

Avoid long retention unless needed.

---

# 1682 — Special Instruction PII

Users may enter PII into free text.

Logs must not capture full:

```text
notes
delivery instructions
```

without reason.

---

# 1683 — Cart Retention and Privacy

Expired/abandoned carts can usually have shorter retention than orders.

Define:

```text
business analytics need
privacy requirement
support need
```

---

# 1684 — Cart Deletion

On customer anonymization/closure:

```text
active cart → delete/expire
historical ephemeral cart → delete according to retention
```

No legal financial retention usually applies to unconverted cart.

---

# 1685 — Cart Observability

Trace:

```text
GET cart
add item
catalog validation
inventory availability
promotion preview
save cart
```

Do not put every product ID in metric labels.

---

# 1686 — Cart Metrics

Business:

```text
cart_created_total
cart_converted_total
cart_abandoned_total
cart_expired_total
cart_merge_total
cart_validation_failure_total
```

Technical:

```text
cart_read_latency
cart_write_latency
catalog_dependency_latency
inventory_dependency_latency
promotion_dependency_latency
cache_hit_ratio
version_conflict_total
```

---

# 1687 — Conversion Rate

Product metric:

```text
cart_converted_total
/
eligible_active_carts
```

Definition must be precise.

Do not casually mix analytics definitions with operational metrics.

---

# 1688 — Cart SLIs

Potential:

```text
GET cart availability
P95 cart read latency
P95 cart write latency
cart mutation success rate
dependency failure rate
```

---

# 1689 — Alerts

Alert on:

```text
high 5xx
catalog dependency failure
inventory dependency failure if blocking
DB failure
Redis failure
version conflict spike
cart validation failure spike
```

---

# 1690 — Dashboard

Show:

```text
request rate
read/write latency
active carts
conversion
expiry rate
merge rate
validation errors
dependency latency
DB pool
cache hit
```

---

# 1691 — Logging

Safe fields:

```text
cart_id
customer_id if appropriate
store_id
channel
operation
item_count
result
request_id
correlation_id
```

Avoid:

```text
guest token
full notes
full address
raw coupon if sensitive
```

---

# 1692 — Failure Mode: Catalog Down

Possible policy:

```text
GET cart returns cached/stored preview marked stale
```

but:

```text
add/update requiring validation may fail
```

Checkout definitely cannot trust stale catalog alone.

---

# 1693 — Failure Mode: Inventory Down

Cart may still:

```text
display cart
```

with availability unknown.

Mutation policy depends on UX.

Checkout must fail safely if inventory reservation is required.

---

# 1694 — Failure Mode: Promotion Down

Cart may:

```text
show subtotal without promotion
mark promotion unavailable
```

or fail coupon application only.

Do not make normal item editing unavailable if promotion service is down unless required.

---

# 1695 — Failure Mode: Redis Down

If PostgreSQL authoritative:

```text
fallback to DB
```

Performance may degrade.

---

# 1696 — Failure Mode: PostgreSQL Down

If authoritative DB unavailable:

```text
cart mutations fail
```

Cached read may be possible but should be marked appropriately.

Do not accept writes only in cache unless designed for it.

---

# 1697 — Failure Mode: Kafka Down

If cart lifecycle events use outbox:

```text
cart transaction commits
outbox retries
```

No direct dependency.

---

# 1698 — Cart Runbooks

Required:

```text
Cart DB unavailable
High version conflict
Catalog dependency outage
Inventory dependency outage
Promotion dependency outage
Cart merge bug
Cache inconsistency
Expired cart cleanup backlog
```

---

# 1699 — Cart Merge Incident

If users receive duplicate items after login:

```text
inspect merge history
check idempotency
check repeated login callback
reproduce same guest/target cart pair
fix merge marker
add regression test
```

---

# 1700 — Stale Price Incident

If cart preview differs unexpectedly:

```text
compare catalog version
promotion version
exchange-rate version
calculated_at
```

Remember final Order snapshot is authoritative.

---

# 1701 — Backup

If PostgreSQL cart persistence:

backup includes:

```text
active carts
items
preferences/preview
merge history
```

Cart data is lower criticality than Order/Wallet but still useful.

---

# 1702 — Restore

After restore:

```text
expire carts beyond current expiry
revalidate active carts
clear/rebuild Redis
reconcile converted carts if needed
```

---

# 1703 — Restore Trade-Off

Because carts are ephemeral, DR may accept higher RPO than:

```text
Order
Payment
Wallet
```

Product/business should define acceptable loss.

---

# 1704 — Schema Migration

Example Flyway:

```text
V1__create_carts.sql
V2__create_cart_items.sql
V3__create_cart_item_modifiers.sql
V4__create_cart_price_previews.sql
V5__create_cart_merge_history.sql
V6__create_processed_events.sql
V7__create_idempotency_records.sql
V8__create_outbox.sql
```

---

# 1705 — Redis Migration

If later moving from PostgreSQL to Redis-first:

do not perform a hidden cutover.

Plan:

```text
dual read or migration bridge
shadow write
consistency comparison
cutover
rollback plan
```

---

# 1706 — Cart Testing Strategy

Test:

```text
Domain
Application
REST
Persistence
Concurrency
Guest
Merge
Catalog integration
Inventory integration
Promotion integration
Cache
Expiry
Events
Load
Failure
```

---

# 1707 — Domain Tests

Test:

```text
add item
merge same selection
separate different modifiers
update quantity
remove item
expired cart rejects update
converted cart rejects update
```

---

# 1708 — Modifier Tests

Test:

```text
required group missing
too many selections
invalid modifier
invalid sub-modifier
price delta
```

---

# 1709 — Price Preview Tests

Test:

```text
base price
modifier delta
quantity
discount
fee
tax
rounding
currency
price change
```

---

# 1710 — Store Change Tests

Test:

```text
empty cart
non-empty cart
revalidation success
product missing in new store
price changes
modifier changes
```

---

# 1711 — Guest Cart Tests

Test:

```text
create guest cart
valid token
invalid token
expired token
token hash persistence
guest expiry
```

---

# 1712 — Merge Tests

Critical scenarios:

```text
guest only
customer only
same item same modifiers
same item different modifiers
different stores
duplicate merge request
quantity exceeds max
invalid product after login
```

---

# 1713 — Concurrency Tests

Test:

```text
two devices add item
two devices update same line
remove vs update
coupon vs item update
```

Verify:

```text
optimistic conflict
or deterministic merge
```

---

# 1714 — Idempotency Tests

Test network retry:

```text
same add-item request
same idempotency key
```

Ensure no duplicate quantity increase.

---

# 1715 — Expiry Tests

Test:

```text
active cart
expired cart
sliding expiry
cleanup
update near expiry
```

---

# 1716 — REST Contract Tests

Test:

```text
GET cart
add item
update
remove
clear
guest headers
version conflict
validation errors
```

---

# 1717 — Dependency Contract Tests

Verify:

```text
Catalog snapshot mapping
Inventory availability mapping
Promotion preview mapping
timeouts
fallback behavior
```

---

# 1718 — Cache Tests

Test:

```text
hit
miss
stale
invalidation
Redis outage
```

---

# 1719 — Event Tests

If using events:

```text
OrderCreated → cart converted
duplicate OrderCreated
CustomerClosed → cart expired
outbox lifecycle events
```

---

# 1720 — Load Tests

Scenarios:

```text
many cart reads
many add/remove operations
large carts
login-time merge spike
promotion dependency latency
cold cache
```

---

# 1721 — Large Cart Test

Test maximum allowed:

```text
distinct lines
modifiers per line
payload size
```

Ensure response remains manageable.

---

# 1722 — Dependency Failure Tests

Inject:

```text
Catalog timeout
Inventory timeout
Promotion timeout
Redis timeout
PostgreSQL timeout
```

Verify documented degradation.

---

# 1723 — Security Tests

Test:

```text
customer cannot access another cart
guest token guessing fails
client price ignored
coupon abuse
oversized payload
notes sanitization
```

---

# 1724 — Definition of Done: Add Item

Complete when:

- [ ] Product validated.
- [ ] Modifier selections validated.
- [ ] Quantity validated.
- [ ] Preview calculated.
- [ ] Version incremented.
- [ ] Idempotency defined.
- [ ] Authorization enforced.
- [ ] Tests pass.
- [ ] Metrics/logging added.

---

# 1725 — Definition of Done: Guest Merge

Complete when:

- [ ] Guest ownership validated.
- [ ] Customer ownership validated.
- [ ] Merge policy documented.
- [ ] Different-store behavior defined.
- [ ] Idempotency implemented.
- [ ] Prices revalidated.
- [ ] Availability refreshed.
- [ ] Duplicate merge prevented.
- [ ] Tests pass.

---

# 1726 — Cart Review Checklist

## Ownership

- [ ] Cart is temporary.
- [ ] Cart does not own Catalog price.
- [ ] Cart does not own Inventory stock.
- [ ] Cart does not own Promotion rules.
- [ ] Cart is separate from Order.

## Lifecycle

- [ ] Active.
- [ ] Expiry.
- [ ] Conversion.
- [ ] Abandonment.
- [ ] Guest merge.

## Correctness

- [ ] Versioning.
- [ ] Idempotency.
- [ ] Modifier validation.
- [ ] Price preview marked non-final.
- [ ] Checkout revalidation.

---

# 1727 — Cart Data Review Checklist

- [ ] Cart/customer ownership clear.
- [ ] Guest token stored securely.
- [ ] Cart/item foreign keys internal.
- [ ] Version column.
- [ ] Expiry index.
- [ ] Retention defined.
- [ ] Preview metadata versioned.
- [ ] Outbox only if needed.
- [ ] No authoritative financial data stored.

---

# 1728 — Cart Contract Review Checklist

- [ ] Authenticated cart contract.
- [ ] Guest cart contract.
- [ ] Add/update/remove.
- [ ] Version conflict.
- [ ] Validation endpoint.
- [ ] Merge contract.
- [ ] Error catalog.
- [ ] Dependency timeout/fallback behavior.
- [ ] No client-authoritative price.

---

# 1729 — Cart Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Cache fallback.
- [ ] Cleanup monitoring.
- [ ] Merge runbook.
- [ ] Stale price debugging.
- [ ] DB backup/restore.
- [ ] Dependency outage behavior.

---

# 1730 — Cart Production Readiness Checklist

Before production:

- [ ] Guest cart security tested.
- [ ] Cross-device concurrency tested.
- [ ] Merge idempotency tested.
- [ ] Cart expiry tested.
- [ ] Price-change behavior tested.
- [ ] Catalog failure behavior tested.
- [ ] Inventory failure behavior tested.
- [ ] Promotion failure behavior tested.
- [ ] Redis failure tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 1731 — Initial Implementation Order

Recommended:

```text
1. Cart aggregate
2. Cart persistence
3. GET cart
4. Add item
5. Update quantity
6. Remove item
7. Catalog validation
8. Price preview
9. Cart versioning
10. Expiry
11. Inventory availability preview
12. Promotion preview
13. Guest cart
14. Guest/customer merge
15. Checkout validation
16. Order conversion event
17. Redis cache
18. Analytics lifecycle events
```

---

# 1732 — Minimum Viable Cart Service

First production-capable version:

```text
One active cart per customer
One store per cart
Cart items
Quantities
Modifier selections
Catalog validation
Price preview
Expiry
Optimistic versioning
Checkout revalidation
Guest cart if required
```

If the first application can work without an independent Cart Service, these capabilities may initially live in Order Service as a module.

Split later if:

```text
cart traffic is high
cross-device sync matters
guest carts matter
independent scaling matters
cart domain becomes complex
```

---

# 1733 — Cart as Module vs Service

PART 03 allowed Cart to remain inside Ordering initially.

Decision criteria:

Keep inside Order Service when:

```text
small team
simple cart
low traffic
no guest sync
same deployment cadence
```

Split into Cart Service when:

```text
very high cart traffic
cart changes much more frequently than orders
guest/auth merge complex
multiple clients need cart sync
independent scaling required
```

---

# 1734 — Future Enhancements

Potential:

```text
Saved carts
Multiple named carts
Scheduled orders
Collaborative/shared cart
Cart recommendations
Cross-region sync
Cart delta sync
Inventory hold during flash sale
Personalized pricing preview
```

---

# 1735 — PART 12 Deliverables

PART 12 produces:

1. Cart Service responsibility definition.
2. Cart vs Order boundary.
3. Cart aggregate.
4. Cart status lifecycle.
5. Single-store cart rule.
6. Channel/fulfillment model.
7. Cart item model.
8. Modifier-selection model.
9. Line merge rules.
10. Price preview model.
11. Price drift behavior.
12. Inventory preview behavior.
13. No-reservation-at-normal-cart rule.
14. Promotion/coupon preview.
15. Guest cart model.
16. Guest token security.
17. Guest/customer merge rules.
18. Cart expiry model.
19. Storage options.
20. PostgreSQL schema.
21. Cart versioning/concurrency.
22. REST contracts.
23. Store/channel change behavior.
24. Delivery-address reference rules.
25. Cart validation.
26. Batch dependency strategy.
27. Checkout preparation.
28. Conversion behavior.
29. Lifecycle events.
30. Clean Architecture structure.
31. Input/output ports.
32. Error catalog.
33. Authorization/security.
34. Cache strategy.
35. Cross-device behavior.
36. Offline sync guidance.
37. Pricing recalculation/rounding.
38. Privacy/retention.
39. Metrics/SLIs.
40. Alerts/dashboard.
41. Failure modes.
42. Runbooks.
43. Backup/restore.
44. Flyway migrations.
45. Testing strategy.
46. Review checklists.
47. Production readiness.
48. Implementation order.
49. Module-vs-service decision guidance.

---

# 1736 — Exit Criteria

PART 12 is complete when the team can answer:

### Ownership

```text
What does Cart own versus Catalog, Inventory, Promotion, and Order?
```

### Price

```text
Why is cart price a preview rather than final transaction price?
```

### Inventory

```text
Does adding to cart reserve stock?
```

### Guest

```text
How is an anonymous cart protected and later merged?
```

### Concurrency

```text
How are two-device updates handled?
```

### Expiry

```text
When does a cart expire and how is it cleaned?
```

### Checkout

```text
Which validations are repeated before order creation?
```

### Failure

```text
What happens when Catalog, Inventory, Promotion, Redis, or PostgreSQL is unavailable?
```

### Separation

```text
Should Cart be an independent service now or initially a module inside Ordering?
```

If these answers are clear and tested, Cart capability is ready for implementation.

---

# 1737 — Handoff to PART 13

PART 13 defines Ordering Service.

```text
PART 12
Cart
  ↓
Temporary Selection
Price Preview
Modifier Selection
Checkout Preparation
  ↓
PART 13
Ordering Service
```

Ordering Service will own:

```text
Order creation
Order snapshots
Order lifecycle
Order status transitions
Fulfillment type
Order cancellation
Order completion
Idempotent creation
Checkout orchestration
Inventory coordination
Payment/Wallet coordination
Order events
Order history
```

The critical transition is:

```text
temporary cart
      ↓ authoritative checkout validation
durable order
```

At that point:

```text
prices
selected items
modifiers
addresses
fees
discounts
```

must become durable transaction snapshots.

---

# PART 12 — Summary

Cart is a temporary customer-intent model.

The core lifecycle is:

```text
Create Cart
    ↓
Add / Edit Items
    ↓
Preview Price
    ↓
Preview Availability
    ↓
Apply Promotion Preview
    ↓
Revalidate
    ↓
Checkout
    ↓
Convert to Order
```

The most important architectural rules are:

```text
Cart is not Order.
Cart price is not final.
Cart does not reserve stock by default.
Client totals are never trusted.
Catalog remains authoritative for product configuration.
Inventory remains authoritative for stock.
Promotion remains authoritative for discounts.
Checkout revalidates everything important.
Guest cart ownership is protected by an opaque token.
Cart merging is idempotent.
Cross-device writes use versioning.
Cart data expires and has limited retention.
```

The next chapter converts this temporary intent into the platform's central durable business transaction:

```text
PART 13 — Ordering Service
```

---

**End of PART 12 — Cart Service**
