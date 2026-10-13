---
title: "PHASE 08 — Cart Service"
---

# PHASE 08 — Cart Service

> **Purpose:** Implement the platform Cart capability as the authoritative owner of temporary pre-order shopping intent, including selected items, quantities, modifiers, store/channel context, guest/customer carts, price and promotion previews, cart expiry, concurrency/versioning, validation, merge behavior, and checkout preparation.
>
> **Previous Phase:** Phase 07 — Inventory Service
>
> **Next Phase:** Phase 09 — Promotion / Coupon Service
>
> **Primary Architecture Basis:** PART 12 — Cart Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL as recommended initial authoritative store, Redis optional for cache, REST, optional Kafka, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 8 Goal

Phase 8 builds the Cart capability.

Recommended deployable unit:

```text
cart-service
```

However, PART 12 explicitly allows the capability to remain a module inside Ordering initially when:

```text
team is small
cart is simple
traffic is low
guest sync is unnecessary
deployment cadence is shared
```

The same domain, contracts, persistence rules, and ownership boundaries still apply either way.

Cart owns:

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
Validation State
Guest Cart
Authenticated Cart
Guest → Customer Merge
```

Cart does **not** own:

```text
Product definition
Authoritative base price
Inventory stock
Inventory reservation
Promotion rules
Coupon entitlement
Order lifecycle
Payment state
Wallet state
Loyalty state
```

---

# 2. Fundamental Rule

The most important boundary is:

```text
Cart != Order
```

Cart is:

```text
temporary
editable
expirable
non-financial
allowed to contain stale preview information
```

Order is:

```text
durable
auditable
status-controlled
transactional
historical
authoritative after checkout
```

---

# 3. Phase 8 Success State

The main lifecycle must work:

```text
Create Cart
    ↓
Add / Edit Items
    ↓
Validate Catalog
    ↓
Preview Price
    ↓
Preview Inventory Availability
    ↓
Preview Promotion
    ↓
Revalidate
    ↓
Checkout Preparation
    ↓
Ordering Creates Order
    ↓
Cart CONVERTED
```

For guest users:

```text
Create Guest Cart
    ↓
Opaque Guest Token
    ↓
Add/Edit Items
    ↓
User Logs In
    ↓
Merge Guest + Customer Cart
    ↓
Revalidate
    ↓
Customer Cart
```

For concurrency:

```text
Client reads version 5
    ↓
Another device writes version 6
    ↓
Old client writes version 5
    ↓
CART_VERSION_CONFLICT
```

---

# 4. Non-Negotiable Architectural Rules

Phase 8 must preserve:

```text
Cart is not Order.
Cart price is not final.
Cart does not reserve Inventory by default.
Client totals are never trusted.
Catalog remains authoritative for product configuration.
Inventory remains authoritative for stock.
Promotion remains authoritative for discount rules.
Checkout revalidates everything important.
Guest cart ownership uses an opaque token.
Cart merge is idempotent.
Cross-device writes use versioning.
Cart data expires.
Cart retention is limited.
```

---

# 5. Source-Defined Open Decisions

Freeze required production choices before release:

```text
Cart as independent service vs Ordering module
One active cart globally vs per store/channel
Store-switch behavior
Channel-switch behavior
Fulfillment-switch behavior
Cart expiry duration
Sliding vs absolute expiry
Maximum cart lifetime
Guest token TTL
Guest merge policy
Different-store merge behavior
Cart storage mode
Cart operation idempotency requirements
Inventory-unavailable add-item UX
Promotion-down UX
Catalog-down read behavior
Redis TTL
Checkout lock vs version-only conversion
Converted-cart retention
Abandoned-cart retention
Maximum cart size
Supported currencies
Rounding policy reference
```

All unresolved items are:

```text
TBD_POLICY
TBD_ARCHITECTURE
TBD_SECURITY
TBD_SCOPE
```

as appropriate.

---

# 6. Service vs Module Decision

Decision:

```text
CART_DEPLOYMENT_MODEL = TBD_ARCHITECTURE
```

Options:

```text
INDEPENDENT_SERVICE
ORDERING_MODULE
```

Keep inside Ordering initially when:

```text
small team
simple cart
low traffic
no complex guest merge
no independent scaling need
```

Split independently when:

```text
cart traffic is high
cart changes much faster than order domain
guest/auth merge is complex
multiple clients require synchronization
independent scaling/deployment is required
```

---

# 7. Cart Boundary

```text
Mobile / Web
     │
     ▼
 Cart Service
 ┌───┼──────────────┐
 │   │              │
 ▼   ▼              ▼
Items / Context   Validation
     │              │
     └──────┬───────┘
            ▼
       Cart Store
         │  │  │
         │  │  └── Promotion
         │  └───── Inventory
         └──────── Catalog
```

Checkout transition:

```text
Cart
  ↓
Ordering Service
  ↓
Authoritative Checkout
  ↓
Durable Order
```

---

# 8. Cart vs Catalog

Catalog owns:

```text
product definition
product active status
current base price
store/channel sellability
modifier configuration
catalog version
```

Cart stores:

```text
references
temporary display snapshot
temporary price preview
```

Cart must revalidate against Catalog.

---

# 9. Cart vs Inventory

Inventory owns:

```text
stock availability
reservation
release
consume
```

Cart may request:

```text
availability preview
```

but this remains advisory.

Normal Add-to-Cart must not create an inventory reservation.

---

# 10. Cart vs Promotion

Promotion owns:

```text
promotion rules
coupon validity
eligibility
usage limits
discount calculation
```

Cart stores only:

```text
promotion preview
coupon input/reference
preview discount
```

Checkout performs authoritative revalidation.

---

# 11. Cart vs Ordering

Cart owns:

```text
shopping intent
```

Ordering owns:

```text
order creation
order snapshot
checkout orchestration
order lifecycle
payment/wallet/inventory coordination
```

Cart must never become a durable order record.

---

# 12. Ubiquitous Language

| Term | Meaning |
|---|---|
| Cart | Temporary pre-order shopping state |
| Cart Item | One product selection/configuration in a cart |
| Selected Modifier | User-selected modifier reference |
| Price Preview | Non-final calculated amount |
| Promotion Preview | Non-final discount/eligibility result |
| Validation State | Current preview validation result |
| Cart Version | Optimistic-concurrency revision |
| Cart Expiry | Time after which the cart is invalid |
| Guest Cart | Cart owned by anonymous opaque token |
| Customer Cart | Cart owned by authenticated customer |
| Cart Merge | Combining guest/customer carts |
| Checkout Preparation | Revalidated temporary result before order creation |
| Checkout Token | Optional short-lived checkout reference |

---

# 13. Cart Aggregate

Primary aggregate:

```text
Cart
```

Possible state:

```text
cart_id
customer_id optional
guest_id optional
store_id
channel
fulfillment_type
status
currency
items
coupon_code optional
price_preview
validation_state
expires_at
created_at
updated_at
version
```

Optional checkout fields:

```text
checkout_lock_expires_at
needs_revalidation
validated_at
catalog_version
promotion_version
```

---

# 14. Cart Status

Source statuses:

```text
ACTIVE
CHECKOUT_IN_PROGRESS
CONVERTED
EXPIRED
ABANDONED
```

Minimum initial implementation may use:

```text
ACTIVE
CONVERTED
EXPIRED
```

Decision:

```text
INITIAL_CART_STATUSES = TBD_POLICY
```

---

# 15. Cart State Transitions

Full model:

```text
ACTIVE
  ├──> CHECKOUT_IN_PROGRESS
  ├──> ABANDONED
  └──> EXPIRED

CHECKOUT_IN_PROGRESS
  ├──> ACTIVE
  └──> CONVERTED
```

Simpler initial model:

```text
ACTIVE → CONVERTED
ACTIVE → EXPIRED
```

---

# 16. Cart Invariants

Enforce:

```text
cart_id immutable
one store per cart
one channel per cart
currency consistent
quantity > 0
product reference valid when mutation is accepted
modifier configuration valid when mutation is accepted
EXPIRED cart cannot be edited
CONVERTED cart cannot be edited
preview total cannot be negative
```

---

# 17. Active Cart Ownership Policy

Potential uniqueness:

```text
one ACTIVE cart per customer + store + channel
```

or:

```text
one ACTIVE cart per customer globally
```

Source simple mobile recommendation:

```text
one active cart per customer
```

Decision:

```text
ACTIVE_CART_UNIQUENESS = TBD_POLICY
```

---

# 18. Single-Store Cart

Recommended initial model:

```text
one cart = one store
```

Why:

```text
price differs by store
inventory differs by store
fulfillment differs by store
menu differs by store
promotion may differ by store
```

Avoid multi-store cart initially.

---

# 19. Multi-Store Future Model

If required later, prefer:

```text
Shopping Basket
  ├── Store Cart A
  └── Store Cart B
```

rather than one cart containing mixed-store items.

---

# 20. Sales Channel

Possible Cart channel values:

```text
APP
WEB
PARTNER
```

Exact canonical values must follow platform contract standards.

Decision:

```text
CART_CHANNELS = TBD_POLICY
```

---

# 21. Fulfillment Type

Cart may preview:

```text
PICKUP
DELIVERY
DINE_IN
```

Ordering remains authoritative for final fulfillment state.

Changing fulfillment may affect:

```text
fees
address requirement
promotion
availability
```

---

# 22. Cart Item

Possible state:

```text
cart_item_id
product_id
quantity
selected_modifiers
selected_sub_modifiers
product_name_preview
base_price_preview
price_preview
notes
created_at
updated_at
version
```

---

# 23. Cart Item Identity

Use:

```text
cart_item_id
```

because two selections of the same product may differ.

Example:

```text
Latte / Hot / No Sugar

Latte / Iced / Normal Sugar
```

These are distinct cart lines.

---

# 24. Line Merge Rule

Merge only when full selection identity matches.

Possible merge identity:

```text
product_id
+ selected modifiers
+ selected sub-modifiers
+ special instructions when semantically distinct
```

Otherwise:

```text
keep separate line
```

---

# 25. Quantity Rules

Require:

```text
quantity > 0
quantity <= configured maximum
```

Maximum can originate from:

```text
product rule
store rule
channel rule
anti-abuse rule
```

Decision:

```text
MAX_ITEM_QUANTITY = TBD_POLICY
MAX_TOTAL_QUANTITY = TBD_POLICY
```

---

# 26. Zero Quantity

Prefer explicit deletion:

```text
DELETE /api/v1/cart/items/{cartItemId}
```

rather than interpreting quantity `0` as hidden deletion unless contract explicitly defines it.

---

# 27. Modifier Selection

Cart stores user selections:

```text
modifier_group_id
modifier_id
sub_modifier_id where applicable
```

and may store temporary preview:

```text
name_preview
price_delta_preview
```

Catalog owns modifier definitions.

---

# 28. Modifier Validation

On Add/Update validate through Catalog:

```text
modifier belongs to item
required groups satisfied
min/max rules valid
selected modifier active
sub-modifier belongs to parent
```

---

# 29. Product Preview Snapshot

Cart may temporarily cache:

```text
product name
image
current preview price
modifier display text
```

These are not historical business snapshots.

Ordering builds the final immutable checkout snapshot.

---

# 30. Price Preview Principle

Cart price must be conceptualized as:

```text
estimated
preview
subject to checkout validation
```

Reasons:

```text
Catalog price can change
Promotion can expire
Inventory can change
Delivery fee can change
Tax/fee context can change
```

---

# 31. Price Preview Formula

Source example:

```text
Item Subtotal
=
(base price + modifier deltas)
× quantity
```

Cart-level:

```text
subtotal
- promotion preview
+ fee preview
+ tax preview
=
grand total preview
```

---

# 32. Preview Components

Store/display explicit components where required:

```text
subtotal
discount
delivery_fee
service_fee
tax
grand_total
currency
```

Avoid one opaque total if UI/business needs a breakdown.

---

# 33. Currency Rule

One cart should normally contain:

```text
one currency
```

Source examples:

```text
USD
KHR
```

Do not mix currencies without explicit conversion semantics.

---

# 34. Price Drift

Example:

```text
Cart preview: 2.50
Catalog current: 2.75
```

Checkout must:

```text
revalidate
```

Possible UX:

```text
update cart
show change
require confirmation
```

or use an explicit future price-lock policy.

---

# 35. Price Locking

Source initial recommendation:

```text
Cart does not lock price.
```

Price becomes authoritative during order creation.

Decision:

```text
CART_PRICE_LOCKING = false
```

unless a future design defines:

```text
lock duration
lock scope
expiry
promotion interaction
```

---

# 36. Inventory Preview

Cart may display:

```text
AVAILABLE
LOW_STOCK
UNAVAILABLE
UNKNOWN
```

`UNKNOWN` is useful when Inventory dependency is unavailable.

---

# 37. No Reservation on Normal Add-to-Cart

Recommended rule:

```text
Adding an item to cart does not reserve Inventory.
```

Reason:

```text
users abandon carts
reservation pressure would be high
checkout is the correct correctness boundary
```

---

# 38. Inventory Reservation Exceptions

Possible future exceptions:

```text
limited release
ticketing
scarce item
flash sale
```

These require a different business model and explicit design.

Do not accidentally turn ordinary cart mutations into inventory holds.

---

# 39. Promotion Preview

Cart may request:

```text
eligible discounts
coupon preview
campaign preview
```

Promotion remains authoritative.

---

# 40. Coupon in Cart

Cart may store:

```text
coupon_code
```

for preview.

Do not permanently redeem the coupon at ordinary cart stage.

---

# 41. Coupon Revalidation

Checkout must revalidate:

```text
coupon active
expiry
eligibility
minimum spend
scope
usage limits
customer eligibility
```

---

# 42. Authenticated Cart

For authenticated users:

```text
customer_id
```

comes from trusted authenticated identity/customer mapping.

Client must not choose another customer's ID.

---

# 43. Guest Cart

Guest cart may use:

```text
guest_cart_token
guest_id
anonymous_session_id
```

It must not require full registration.

---

# 44. Guest Token Properties

Require token to be:

```text
unguessable
short/medium-lived
cart-scoped
rotatable
not a platform access token
```

---

# 45. Guest Token Storage

Recommended source pattern:

```text
generate random raw token
return raw token once
store only hash
```

Possible stored representation:

```text
SHA-256(raw token)
```

or secure keyed hash.

Never store/log raw token unnecessarily.

---

# 46. Guest Token Transport

Possible:

```http
X-Guest-Cart-Token: <opaque-token>
```

or:

```text
secure cookie
```

Never place sensitive guest token in URL.

---

# 47. Guest Security

Every guest operation must validate:

```text
token
ownership
cart active state
token/cart expiry
```

Do not allow predictable numeric cart ID to prove ownership.

---

# 48. Guest to Customer Merge

Flow:

```text
Guest Cart
   +
Customer Cart
   ↓
Merge Policy
   ↓
Revalidated Customer Cart
```

Merge must be deterministic.

---

# 49. Merge Strategies

Source options:

```text
REPLACE
COMBINE
ASK_USER
```

Recommended same-store behavior:

```text
COMBINE
```

with line normalization.

Different-store behavior must be approved.

Decision:

```text
SAME_STORE_MERGE_POLICY = TBD_POLICY
DIFFERENT_STORE_MERGE_POLICY = TBD_POLICY
```

---

# 50. Merge Same Selection

When:

```text
product + modifiers + sub-modifiers + distinct instructions
```

match:

```text
sum quantity
```

subject to quantity limit.

Otherwise:

```text
keep lines separate
```

---

# 51. Merge Price Rule

After merge:

```text
discard old totals
revalidate Catalog
recalculate Promotion
refresh Inventory preview
```

Never sum stale price previews from both carts.

---

# 52. Merge Idempotency

Repeated login callbacks must not duplicate lines.

Possible implementation:

```text
merge_id
source_cart_id
target_cart_id
status
```

or source-cart `merged` marker.

---

# 53. Merge History

Persist enough history to debug:

```text
source_cart_id
target_cart_id
strategy
merged_at
result
```

---

# 54. Cart Expiration

Cart must expire.

Possible source examples:

```text
24 hours
7 days
30 days
```

Decision:

```text
CART_EXPIRY_DURATION = TBD_POLICY
```

---

# 55. Sliding Expiry

Optional:

```text
meaningful update extends expires_at
```

Maximum lifetime may still apply.

Decision:

```text
CART_EXPIRY_MODE = TBD_POLICY
MAX_CART_LIFETIME = TBD_POLICY
```

---

# 56. Absolute Expiry

Alternative:

```text
expires_at = created_at + fixed duration
```

Simple, but may expire while user is active.

---

# 57. Expiry Storage

Always persist:

```text
expires_at
```

explicitly.

Do not recalculate only from current configuration.

---

# 58. Expiry Worker

For PostgreSQL-backed carts:

```text
Find ACTIVE carts with expires_at <= now
    ↓
Mark EXPIRED
    ↓
Optional lifecycle event
```

Use batching for scale.

---

# 59. Cart Storage Options

Supported architecture choices:

```text
Redis-only
PostgreSQL authoritative + optional Redis
```

---

# 60. Recommended Initial Storage

Source recommendation:

```text
PostgreSQL authoritative
+
Redis optional cache
```

because it provides:

```text
durability
versioning
queryability
cross-device persistence
supportability
```

Decision:

```text
INITIAL_CART_STORAGE = POSTGRESQL
```

unless formally changed.

---

# 61. Redis-Only Trade-Off

Advantages:

```text
fast
natural TTL
high temporary-state throughput
```

Risks:

```text
data loss
weaker history
harder support
persistence complexity
```

Only use when carts are intentionally disposable.

---

# 62. Cart Database

Logical database:

```text
cart_db
```

if deployed independently.

If Cart is a module inside Ordering, ownership boundaries must still be explicit.

---

# 63. Cart Tables

Possible source tables:

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

# 64. Carts Table

Concept:

```text
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

Potential additional fields:

```text
needs_revalidation
validated_at
checkout_lock_expires_at
```

---

# 65. Cart Indexes

Source guidance:

```text
customer_id
guest_token_hash
(status, expires_at)
```

Uniqueness depends on the active-cart policy.

---

# 66. Cart Items Table

Concept:

```text
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

# 67. Cart Item Modifiers Table

Concept:

```text
id
cart_item_id
modifier_group_id
modifier_id
name_preview
price_delta_preview
created_at
```

---

# 68. Sub-Modifiers Table

If used:

```text
id
cart_item_modifier_id
sub_modifier_id
name_preview
price_delta_preview
```

---

# 69. Cart Price Preview Table

Optional:

```text
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
exchange_rate_version where needed
```

---

# 70. Cart Merge History Table

Concept:

```text
id
source_cart_id
target_cart_id
merge_strategy
merged_at
result
```

---

# 71. Processed Events

If consuming:

```text
OrderCreated
CustomerClosed
```

use:

```text
processed_events
```

for deduplication.

---

# 72. Idempotency Records

For unreliable mobile operations such as Add Item, optional but recommended pattern:

```text
operation
idempotency_key
request_hash
response/reference
created_at
expires_at
```

---

# 73. Outbox

Only use lifecycle events when there is a real consumer.

Candidate:

```text
CartCreated
CartMerged
CartConverted
CartExpired
CartAbandoned
```

Avoid platform-wide Kafka event for every quantity tap.

---

# 74. Cart Version

Use optimistic:

```text
version
```

to prevent stale writes.

---

# 75. Cross-Device Concurrency Example

```text
Phone A reads version 5
Phone B reads version 5

Phone A updates → version 6
Phone B writes version 5
```

Result:

```text
CART_VERSION_CONFLICT
```

---

# 76. REST If-Match

Possible contract:

```http
If-Match: "5"
```

or an explicit:

```text
version
```

request field.

Server mutates only when expected version matches.

---

# 77. Version Conflict Response

Return:

```text
stable error
current/latest cart where helpful
```

so client can refresh or replay its intended command.

---

# 78. Command-Based Sync

For complex mobile/offline sync, prefer operations such as:

```text
ADD_ITEM
REMOVE_ITEM
SET_QUANTITY
SET_STORE
SET_COUPON
```

instead of replacing an entire cart snapshot.

---

# 79. Add-Item Idempotency

Same:

```text
Idempotency-Key
+
same request
```

returns same semantic result.

Same key with different request returns:

```text
IDEMPOTENCY_KEY_REUSED
```

or approved equivalent.

---

# 80. GET Cart

Recommended endpoint:

```text
GET /api/v1/cart
```

Authenticated identity is derived from token.

Guest identity is derived from guest-cart token.

Avoid normal customer path:

```text
GET /users/{userId}/cart
```

---

# 81. Add Item

Example:

```text
POST /api/v1/cart/items
```

Request includes:

```text
product_id
quantity
modifiers
sub_modifiers if needed
notes if allowed
expected cart version / If-Match where required
```

Never accept client-supplied authoritative price.

---

# 82. Add Item Flow

```text
Resolve Cart
    ↓
Check ACTIVE / not expired
    ↓
Validate expected version
    ↓
Fetch current orderable product from Catalog
    ↓
Validate modifiers
    ↓
Get advisory Inventory availability
    ↓
Merge/add line
    ↓
Recalculate full preview
    ↓
Apply Promotion preview
    ↓
Extend expiry if sliding
    ↓
Persist version+1
    ↓
Return updated Cart
```

---

# 83. Add Item Inventory Policy

If Inventory reports unavailable:

Possible UX:

```text
reject add
```

or:

```text
allow line but mark unavailable
```

Decision:

```text
ADD_UNAVAILABLE_ITEM_POLICY = TBD_UX
```

Checkout still revalidates.

---

# 84. Update Quantity

Endpoint:

```text
PATCH /api/v1/cart/items/{cartItemId}
```

Validate:

```text
ownership
cart status
expected version
quantity limits
current Catalog state if policy requires
```

Then recalculate preview.

---

# 85. Remove Item

Endpoint:

```text
DELETE /api/v1/cart/items/{cartItemId}
```

Return either:

```text
updated cart
```

or:

```text
204
```

Choose one contract consistently.

Decision:

```text
REMOVE_ITEM_RESPONSE_STYLE = TBD_CONTRACT
```

---

# 86. Clear Cart

Possible:

```text
DELETE /api/v1/cart
```

or:

```text
POST /api/v1/cart/clear
```

Clearing must be idempotent.

---

# 87. Change Store

Potential:

```text
PUT /api/v1/cart/store
```

Policy options:

```text
clear cart
revalidate all lines
reject if non-empty
```

Source simple recommendation:

```text
explicit confirmation + revalidate everything
```

Decision:

```text
STORE_CHANGE_POLICY = TBD_UX
```

---

# 88. Change Channel

Changing channel is a major context change because it can change:

```text
menu
price
promotion
fulfillment
```

Always revalidate/recalculate.

---

# 89. Change Fulfillment Type

Changing:

```text
PICKUP → DELIVERY
```

may affect:

```text
fees
address
promotions
availability
```

Recalculate preview.

---

# 90. Delivery Address in Cart

Cart may reference:

```text
customer_address_id
```

or temporary address selection.

Ordering must snapshot the final actual address at checkout.

Cart must not become the historical delivery-address owner.

---

# 91. Delivery Fee Preview

If fee logic is external:

```text
Cart → Fee Service
```

Store only:

```text
fee preview
```

Ordering recalculates authoritatively.

---

# 92. Special Instructions

Allow fields such as:

```text
item_notes
special_instructions
```

with:

```text
length limit
safe character handling
no HTML execution
```

---

# 93. Notes Separation

Keep separate:

```text
item instruction
order instruction
delivery instruction
```

Do not overload one text field for all contexts.

---

# 94. Maximum Cart Size

Protect against abuse.

Possible limits:

```text
max distinct lines
max quantity per line
max total quantity
max modifiers per line
max request/response payload
```

Decision:

```text
MAX_CART_LINES = TBD_POLICY
MAX_MODIFIERS_PER_LINE = TBD_POLICY
MAX_CART_PAYLOAD = TBD_POLICY
```

---

# 95. Structural Validation

Check:

```text
cart ACTIVE
not expired
items present when required
quantity valid
currency consistent
store present
channel present
```

---

# 96. Catalog Validation

Check:

```text
product active
product exists in menu
store allowed
channel allowed
current price available
modifier configuration valid
```

---

# 97. Inventory Validation

Cart-stage validation:

```text
availability preview
```

Checkout-stage validation:

```text
authoritative reservation
```

Do not confuse:

```text
AVAILABLE_NOW
```

with:

```text
RESERVED
```

---

# 98. Promotion Validation

Check preview:

```text
promotion active
coupon active
eligibility
minimum spend
scope
usage limits
```

But final checkout revalidates.

---

# 99. Validation Result

Return machine-readable issues.

Example codes:

```text
PRICE_CHANGED
PRODUCT_UNAVAILABLE
PRODUCT_NOT_ORDERABLE
INVALID_MODIFIER_SELECTION
COUPON_INVALID
STORE_UNAVAILABLE
```

Issues should identify affected cart item where applicable.

---

# 100. Revalidation Triggers

Trigger revalidation on:

```text
cart fetch after long inactivity
checkout
store change
channel change
fulfillment change
coupon application
catalog version change
manual refresh
```

---

# 101. Lazy Revalidation

Do not call every dependency on every GET when unnecessary.

Possible metadata:

```text
preview_valid_until
catalog_version
promotion_valid_until
validated_at
needs_revalidation
```

---

# 102. Dependency Call Budget

Avoid:

```text
Catalog per line
Inventory per line
Promotion per line
```

Use:

```text
batch Catalog contract
batch Inventory availability
one cart-level Promotion evaluation
```

---

# 103. Batch Catalog Contract

Prefer:

```text
GetOrderableItems(product_ids[])
```

rather than one remote call per cart line.

---

# 104. Batch Inventory Contract

Prefer:

```text
GetAvailability(store_id, product_ids[])
```

---

# 105. Promotion Cart-Level Contract

Prefer:

```text
EvaluateCartPromotion
```

rather than line-by-line remote evaluation.

---

# 106. Price Recalculation

Recalculate after:

```text
add
remove
quantity change
modifier change
store change
channel change
fulfillment change
coupon change
```

---

# 107. Full vs Incremental Recalculation

Initial safer approach:

```text
recalculate whole cart
```

For moderate cart size.

Only optimize to incremental calculation after evidence.

---

# 108. Deterministic Preview

For same:

```text
cart state
catalog version
promotion version
exchange-rate version
rounding policy
```

the same preview result should be produced.

---

# 109. Rounding

Cart preview must use the same documented rounding strategy as authoritative checkout to avoid technical-only discrepancies.

The source does not define the exact formula here.

Decision:

```text
CART_ROUNDING_POLICY = REFERENCE_SHARED_PRICING_POLICY
```

---

# 110. KHR / USD Preview

If converted display is supported, metadata should include:

```text
base authoritative currency
exchange rate version
rounding rule
calculated_at
```

Cart does not own exchange rates.

---

# 111. Price Preview Version Metadata

Useful:

```text
catalog_version
promotion_version
exchange_rate_version
calculated_at
```

This makes price-drift debugging possible.

---

# 112. Checkout Preparation

Possible flow:

```text
POST /api/v1/cart/validate
    ↓
Validated Cart Preview
    ↓
POST /api/v1/orders
```

Cart may produce:

```text
validated cart snapshot
```

but Ordering still performs authoritative order creation.

---

# 113. Checkout Token — Optional

Possible:

```text
opaque/signed checkout_token
```

referencing:

```text
cart_id
cart_version
validation timestamp
catalog version
```

Use only if it simplifies checkout materially.

---

# 114. Checkout Token Limits

Checkout token must not automatically mean:

```text
payment authorization
inventory reservation
final price guarantee
```

unless explicitly designed.

---

# 115. Checkout Lock — Optional

Possible state:

```text
ACTIVE
  ↓
CHECKOUT_IN_PROGRESS
```

with:

```text
checkout_lock_expires_at
```

If order creation fails:

```text
unlock cart
```

---

# 116. Recommended Initial Checkout Concurrency

Source suggests simpler initial behavior may use:

```text
cart version check
```

without checkout lock.

Decision:

```text
CHECKOUT_CART_LOCK_ENABLED = TBD_POLICY
```

---

# 117. Order Conversion

After successful Order creation:

```text
Cart → CONVERTED
```

Possible trigger:

```text
synchronous order result
```

or:

```text
OrderCreated event
```

Event-based marking is more resilient.

---

# 118. OrderCreated Consumer

Flow:

```text
OrderCreated(cart_id)
    ↓
Check processed event
    ↓
Load cart
    ↓
If ACTIVE → mark CONVERTED
If CONVERTED → no-op
    ↓
Persist
```

Only if the Order contract includes `cart_id`.

---

# 119. Conversion Idempotency

Duplicate:

```text
OrderCreated
```

must not modify cart twice.

`CONVERTED → no-op`.

---

# 120. Cart After Conversion

Recommended UX:

```text
next GET /cart
→ return/create new ACTIVE cart
```

Converted cart may remain available internally for short retention.

---

# 121. Abandoned Cart

Possible reasons:

```text
user clears cart
store switch replaces cart
guest merge discards source
```

If analytics needs lifecycle distinction, mark:

```text
ABANDONED
```

---

# 122. Cart Events

Candidate lifecycle events:

```text
CartCreated
CartUpdated
CartCleared
CartMerged
CartConverted
CartExpired
CartAbandoned
```

Only publish events with a real consumer.

---

# 123. Event Noise Rule

Do not publish a Kafka event for every:

```text
quantity increment
quantity decrement
modifier click
```

High-volume ephemeral cart behavior should not flood the platform event backbone.

---

# 124. Events Consumed

Potential:

```text
OrderCreated
CatalogChanged
CustomerClosed
```

Avoid consuming every Catalog change if version-based lazy validation is sufficient.

---

# 125. CatalogChanged Handling

Possible strategies:

```text
do nothing and compare version later
mark affected carts needs_revalidation
```

Do not immediately recalculate millions of carts after every Catalog update.

---

# 126. CustomerClosed Handling

Possible:

```text
expire/abandon active cart
```

according to retention/privacy policy.

---

# 127. Clean Architecture Structure

```text
cart-service/
│
├── domain/
│   ├── cart/
│   ├── item/
│   ├── pricing/
│   ├── validation/
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

# 128. Input Ports

Recommended:

```text
GetCartUseCase
AddCartItemUseCase
UpdateCartItemUseCase
RemoveCartItemUseCase
ClearCartUseCase
ChangeStoreUseCase
ChangeChannelUseCase
ChangeFulfillmentUseCase
ApplyCouponPreviewUseCase
ValidateCartUseCase
MergeGuestCartUseCase
MarkCartConvertedUseCase
ExpireCartUseCase
```

---

# 129. Output Ports

Recommended:

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
GuestCartTokenGenerator
```

---

# 130. Catalog Port

Must expose purpose-specific orderable-item data.

For multi-item carts:

```text
batch variant preferred
```

Do not couple Cart to Catalog persistence schema.

---

# 131. Inventory Availability Port

Purpose:

```text
preview availability
```

No reservation operation belongs in normal Cart mutation.

---

# 132. Promotion Preview Port

Purpose:

```text
cart-level preview
```

Promotion Service remains authoritative.

---

# 133. Guest Token Generator Port

Generate cryptographically strong opaque token.

Persist hash.

Return raw token only to its owner.

---

# 134. Error Catalog

Source candidates:

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

Possible implementation additions must enter shared Phase 03 error catalog.

---

# 135. HTTP Error Mapping

Source examples:

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
| GUEST_CART_TOKEN_INVALID | 401 / 403 |

---

# 136. Authenticated Authorization

Authenticated customer may access only:

```text
own cart
```

Identity is derived server-side.

Admin/support modification should not exist unless separately designed.

---

# 137. IDOR Protection

Never trust a client-provided:

```text
customer_id
```

as cart ownership proof.

Use authenticated subject → customer mapping.

---

# 138. Client Price Tampering

Ignore request values such as:

```text
price = 0.01
discount = 99.00
total = 0.10
```

Server gets current facts from authoritative services.

---

# 139. Client Availability Tampering

Client:

```text
available = true
```

has no authority.

Server consults Inventory.

---

# 140. Client Promotion Tampering

Client cannot authoritatively set:

```text
discount_amount
promotion_id
eligibility
```

Server calculates preview.

---

# 141. Input Validation

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
version
```

---

# 142. Cart Audit

Cart does not normally need financial-grade audit for every mutation.

Useful lifecycle history:

```text
guest merge
conversion
support modification
```

Avoid excessive audit overhead for every quantity click.

---

# 143. Redis Cache

When PostgreSQL is authoritative, Redis may cache:

```text
cart by customer
cart summary
price preview
```

Use short TTL.

---

# 144. Cache Keys

Examples:

```text
cart:customer:{customer_id}
cart:guest:{guest_token_hash}
```

Never include raw guest token in logs, metrics, or cache-key telemetry.

---

# 145. Cache Invalidation

After DB commit:

```text
invalidate/update Redis
```

Cart version protects against stale overwrite.

---

# 146. Redis Failure

If PostgreSQL is authoritative:

```text
fallback to DB
```

Performance may degrade, but correctness remains.

---

# 147. Cross-Device Cart

Use one authoritative server cart.

Phone/tablet/web all operate through optimistic concurrency.

---

# 148. Conflict UX

When:

```text
server version 8
client version 7
```

return:

```text
CART_VERSION_CONFLICT
latest cart
```

where contract permits.

---

# 149. Offline Cart

Client may keep local state while offline.

On reconnect:

```text
send desired operations
```

Server revalidates:

```text
Catalog
price
Inventory preview
Promotion
```

---

# 150. Offline Merge

Prefer operation replay to whole-cart overwrite.

Whole-cart replacement has higher risk of overwriting newer server changes.

---

# 151. Operation Idempotency

For mobile retry-sensitive operations, support:

```text
operation_id
```

or:

```text
Idempotency-Key
```

where needed.

---

# 152. Store Availability

Cart may preview:

```text
store currently unavailable
```

but final store-operating validation belongs to authoritative checkout/order acceptance.

---

# 153. Scheduling — Future

Future:

```text
requested_fulfillment_at
```

affects:

```text
menu
availability
promotion
```

Do not include in initial scope unless required.

---

# 154. Personalization

Recommendations such as:

```text
You may also like...
```

must not mutate the authoritative cart automatically.

Recommendation is a read/UX concern.

---

# 155. Privacy

Cart may contain:

```text
customer_id
address reference
preferences
notes
coupon
product selections
```

Treat as customer-related data.

---

# 156. Free-Text PII

Users may put PII inside:

```text
notes
delivery instructions
```

Do not log full free text by default.

---

# 157. Retention

Cart retention is shorter than Order retention.

Possible source examples:

```text
ACTIVE → until expiry
CONVERTED → limited short retention
EXPIRED → short retention
ABANDONED → analytics/support retention
```

Decision:

```text
CART_RETENTION_POLICY = TBD_PRIVACY
```

---

# 158. Customer Closure / Anonymization

Possible behavior:

```text
active cart → expire/delete
historical ephemeral cart → delete according to retention
```

Unconverted carts normally do not have financial legal-retention requirements.

---

# 159. Cleanup

Scheduled cleanup may remove:

```text
old expired carts
old converted carts
old merge history
old idempotency records
```

Never delete ACTIVE carts incorrectly.

---

# 160. Cart Metrics

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

# 161. Conversion Rate

Possible product metric:

```text
cart_converted_total
/
eligible_active_carts
```

Definition must be precise and owned by analytics/product metrics.

---

# 162. SLIs

Potential:

```text
GET cart availability
P95 cart read latency
P95 cart write latency
cart mutation success rate
dependency failure rate
```

Targets:

```text
TBD_SLO
```

---

# 163. Alerts

Alert on:

```text
high 5xx
Catalog dependency failure
Inventory dependency failure if blocking
DB failure
Redis failure
version-conflict spike
validation-failure spike
cleanup backlog
```

---

# 164. Dashboard

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
cache hit ratio
```

---

# 165. Structured Logging

Safe fields:

```text
cart_id
customer_id when appropriate
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
raw guest token
full notes
full address
sensitive raw coupon
```

---

# 166. Tracing

Trace:

```text
GET cart
add item
Catalog batch validation
Inventory availability preview
Promotion preview
save cart
guest merge
checkout validation
```

Avoid product IDs as unbounded metrics labels.

---

# 167. Failure — Catalog Down

Possible read behavior:

```text
return stored/cached preview marked stale
```

Mutation requiring Catalog validation may fail safely.

Checkout must not trust stale Catalog alone.

---

# 168. Failure — Inventory Down

Cart may still display existing state with:

```text
availability = UNKNOWN
```

Mutation UX depends on policy.

Checkout must fail safely if authoritative reservation is required.

---

# 169. Failure — Promotion Down

Cart may:

```text
show subtotal without promotion
mark promotion unavailable
```

or fail only coupon application.

Normal item editing should not necessarily fail.

---

# 170. Failure — Redis Down

When PostgreSQL is authoritative:

```text
read/write via PostgreSQL
```

with performance degradation.

---

# 171. Failure — PostgreSQL Down

When PostgreSQL is authoritative:

```text
cart mutations fail
```

A cached read may be possible if marked appropriately.

Never accept writes only into Redis unless explicitly designed.

---

# 172. Failure — Kafka Down

With lifecycle outbox:

```text
cart transaction commits
outbox retries later
```

Kafka is not on the synchronous correctness path.

---

# 173. Runbooks

Required:

```text
Cart DB unavailable
High version conflict
Catalog outage
Inventory outage
Promotion outage
Cart merge bug
Cache inconsistency
Expired-cart cleanup backlog
Stale price incident
```

---

# 174. Merge Incident Runbook

If duplicate items appear after login:

```text
inspect merge history
check idempotency
check repeated login callback
reproduce source/target pair
repair merge marker/state
add regression test
```

---

# 175. Stale Price Incident Runbook

Compare:

```text
Catalog version
Promotion version
Exchange-rate version
calculated_at
```

Remember:

```text
Order snapshot is authoritative
```

not old Cart preview.

---

# 176. Backup

If PostgreSQL-backed, backup includes:

```text
active carts
items
preview
merge history
```

Cart is lower criticality than Order/Wallet/Payment but still operationally useful.

---

# 177. Restore

After restore:

```text
expire carts past expires_at
revalidate remaining active carts
clear/rebuild Redis
reconcile converted carts where necessary
```

---

# 178. DR Trade-Off

Because Cart is ephemeral, business may accept a higher RPO than:

```text
Order
Payment
Wallet
```

Decision:

```text
CART_RPO = TBD_DR
CART_RTO = TBD_DR
```

---

# 179. Flyway Plan

Source example:

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

If sub-modifiers are required, add a separate migration.

---

# 180. Redis-First Migration — Future

If moving later:

```text
dual read / bridge
shadow write
consistency comparison
cutover
rollback plan
```

Do not hide the migration.

---

# 181. Testing Strategy

Required:

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
Security
```

---

# 182. Domain Tests

Test:

```text
add item
merge identical selection
keep differing modifiers separate
update quantity
remove
expired mutation denied
converted mutation denied
single-store rule
currency consistency
```

---

# 183. Modifier Tests

Test:

```text
missing required group
too many selections
invalid modifier
invalid sub-modifier
price delta preview
```

---

# 184. Price Preview Tests

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
version metadata
```

---

# 185. Store Change Tests

Test:

```text
empty cart
non-empty cart
revalidation success
product unavailable in new store
price change
modifier change
```

---

# 186. Guest Cart Tests

Test:

```text
guest creation
valid token
invalid token
expired token
token hash persistence
guest expiry
ownership isolation
```

---

# 187. Merge Tests

Critical scenarios:

```text
guest only
customer only
same item / same modifiers
same item / different modifiers
different stores
duplicate merge request
quantity exceeds max
product invalid after login
```

---

# 188. Concurrency Tests

Test:

```text
two devices add item
two devices update same line
remove vs update
coupon vs item update
store change vs item update
```

Verify:

```text
optimistic conflict
or explicitly deterministic command merge
```

---

# 189. Idempotency Tests

Simulate mobile retry:

```text
same Add Item request
same Idempotency-Key
```

Verify no duplicate unintended quantity increase.

---

# 190. Expiry Tests

Test:

```text
active cart
expired cart
sliding expiry if enabled
absolute expiry
cleanup
update near expiry
```

---

# 191. REST Contract Tests

Test:

```text
GET cart
Add Item
Update Item
Remove Item
Clear Cart
Guest token header
If-Match/version conflict
Validation endpoint
Store/channel change
Error mapping
```

---

# 192. Dependency Contract Tests

Verify:

```text
Catalog snapshot mapping
Inventory availability mapping
Promotion preview mapping
timeouts
fallback behavior
batch contracts
```

---

# 193. Cache Tests

Test:

```text
hit
miss
stale version
invalidation
Redis outage
DB fallback
```

---

# 194. Event Tests

If lifecycle events used:

```text
OrderCreated → CONVERTED
duplicate OrderCreated → no-op
CustomerClosed → expire/abandon
outbox lifecycle publication
```

---

# 195. Load Tests

Scenarios:

```text
many reads
many add/remove operations
large carts
login merge spike
slow Promotion dependency
cold cache
cross-device conflict load
```

---

# 196. Large Cart Test

Test configured maximums:

```text
line count
quantity count
modifier count
payload size
response size
```

---

# 197. Dependency Failure Tests

Inject:

```text
Catalog timeout
Inventory timeout
Promotion timeout
Redis timeout
PostgreSQL timeout
Kafka outage
```

Verify documented degradation.

---

# 198. Security Tests

Test:

```text
customer cannot access another cart
guest token guessing fails
guest token not accepted after expiry
client price ignored
client discount ignored
client availability ignored
coupon abuse limits
oversized payload rejected
notes safely handled
```

---

# 199. Definition of Done — Add Item

Complete when:

- [ ] Product validated.
- [ ] Modifier selection validated.
- [ ] Quantity validated.
- [ ] Client price ignored.
- [ ] Preview recalculated server-side.
- [ ] Cart version incremented.
- [ ] Idempotency behavior defined.
- [ ] Ownership enforced.
- [ ] Expiry behavior applied.
- [ ] Tests pass.
- [ ] Metrics/logging/tracing added.

---

# 200. Definition of Done — Guest Merge

Complete when:

- [ ] Guest ownership validated.
- [ ] Customer ownership validated.
- [ ] Merge strategy defined.
- [ ] Same-selection normalization works.
- [ ] Different-store policy works.
- [ ] Merge is idempotent.
- [ ] Old previews discarded.
- [ ] Cart revalidated.
- [ ] Source cart final state defined.
- [ ] Merge history stored.
- [ ] Tests pass.

---

# 201. Definition of Done — Checkout Validation

Complete when:

- [ ] Cart is ACTIVE.
- [ ] Version is current.
- [ ] Cart not expired.
- [ ] Catalog revalidated.
- [ ] Prices refreshed.
- [ ] Modifiers revalidated.
- [ ] Inventory availability checked.
- [ ] Promotion/coupon revalidated.
- [ ] Store/channel/fulfillment validated.
- [ ] Address requirement validated.
- [ ] Server totals recalculated.
- [ ] Result is explicitly non-order/non-payment.
- [ ] Ordering contract documented.

---

# 202. Cart Architecture Review Checklist

## Ownership

- [ ] Cart does not own Catalog price.
- [ ] Cart does not own Inventory stock.
- [ ] Cart does not own Promotion rules.
- [ ] Cart remains separate from Order.

## Lifecycle

- [ ] ACTIVE behavior defined.
- [ ] Expiry defined.
- [ ] Conversion defined.
- [ ] Abandonment defined if used.
- [ ] Guest merge defined.

## Correctness

- [ ] Versioning implemented.
- [ ] Idempotency defined.
- [ ] Modifier validation implemented.
- [ ] Price preview labeled non-final.
- [ ] Checkout revalidation implemented.

---

# 203. Data Review Checklist

- [ ] Cart/customer ownership clear.
- [ ] Guest token stored as secure hash.
- [ ] Cart/item FKs remain internal.
- [ ] Version exists.
- [ ] Expiry index exists.
- [ ] Retention defined.
- [ ] Preview version metadata exists.
- [ ] Outbox exists only where justified.
- [ ] No authoritative financial state stored.

---

# 204. Contract Review Checklist

- [ ] Authenticated Cart contract defined.
- [ ] Guest Cart contract defined.
- [ ] Add/update/remove defined.
- [ ] Version conflict defined.
- [ ] Validation endpoint defined.
- [ ] Merge contract defined.
- [ ] Error catalog stable.
- [ ] Dependency timeout/fallback defined.
- [ ] No client-authoritative price.
- [ ] No client-authoritative discount.
- [ ] No client-authoritative availability.

---

# 205. Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Redis fallback.
- [ ] Cleanup monitoring.
- [ ] Merge runbook.
- [ ] Stale-price debugging.
- [ ] Backup/restore behavior.
- [ ] Dependency-outage behavior.
- [ ] Version-conflict observability.

---

# 206. Production Readiness Checklist

Before production:

- [ ] Guest-cart security tested if enabled.
- [ ] Cross-device concurrency tested.
- [ ] Merge idempotency tested.
- [ ] Cart expiry tested.
- [ ] Price-change behavior tested.
- [ ] Catalog failure behavior tested.
- [ ] Inventory failure behavior tested.
- [ ] Promotion failure behavior tested.
- [ ] PostgreSQL failure behavior tested.
- [ ] Redis failure tested if used.
- [ ] Kafka failure tested if events used.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Cart retention approved.
- [ ] Required TBD decisions resolved.

---

# 207. Recommended Implementation Sequence

Follow the PART 12 implementation order closely:

```text
Step 1
Implement Cart aggregate

Step 2
Implement Cart persistence

Step 3
Implement GET Cart

Step 4
Implement Add Item

Step 5
Implement Update Quantity

Step 6
Implement Remove Item

Step 7
Implement Catalog validation

Step 8
Implement Price Preview

Step 9
Implement Cart versioning / optimistic concurrency

Step 10
Implement Expiry

Step 11
Implement Inventory availability preview

Step 12
Implement Promotion preview

Step 13
Implement Guest Cart if required

Step 14
Implement Guest → Customer merge

Step 15
Implement Checkout validation

Step 16
Implement Order conversion handling

Step 17
Implement Redis cache

Step 18
Implement lifecycle analytics/events only where needed

Step 19
Complete tests

Step 20
Complete observability/runbooks

Step 21
Production-readiness review

Step 22
Handoff to Phase 09 Promotion / Coupon
```

---

# 208. Step 1 — Bootstrap Acceptance

Verify:

```text
service/module starts
health endpoint works when independent
cart DB accessible
Flyway works
security filters load
Catalog adapter starts
Inventory adapter starts
Promotion adapter starts
Testcontainers work
Docker image builds when independent
```

---

# 209. Step 2 — Cart Aggregate Acceptance

Verify:

```text
ACTIVE cart created
one-store rule enforced
one-channel rule enforced
currency consistent
expired cannot mutate
converted cannot mutate
version increments
```

---

# 210. Step 3 — Persistence Acceptance

Verify:

```text
active-cart uniqueness
guest-token uniqueness
cart-item FK integrity
modifier FK integrity
expiry index
optimistic version
migrations from zero
```

---

# 211. Step 4 — GET Cart Acceptance

Verify:

```text
customer gets own cart
guest gets token-owned cart
other customer's cart inaccessible
expired behavior correct
converted behavior correct
version returned
preview metadata returned
```

---

# 212. Step 5 — Add Item Acceptance

Verify:

```text
valid Catalog product adds
invalid product rejected
modifier rules enforced
quantity limit enforced
line merge correct
Inventory preview applied
price preview calculated
version increments
idempotent retry safe
```

---

# 213. Step 6 — Update/Remove Acceptance

Verify:

```text
quantity update
remove
stale version rejected
preview recalculated
empty cart behavior defined
expiry updated when sliding
```

---

# 214. Step 7 — Price Preview Acceptance

Verify:

```text
base price from Catalog
modifier deltas from Catalog
server calculates subtotal
Promotion preview applied
fees/tax preview where in scope
rounding matches shared policy
version metadata recorded
```

---

# 215. Step 8 — Expiry Acceptance

Verify:

```text
expired cart not editable
expiry worker marks expired
active cart protected
sliding expiry works if enabled
cleanup retains/deletes by policy
```

---

# 216. Step 9 — Inventory Preview Acceptance

Verify:

```text
batch Inventory query
AVAILABLE mapped correctly
UNAVAILABLE mapped correctly
dependency failure produces documented UNKNOWN/degraded state
no reservation created
```

---

# 217. Step 10 — Promotion Preview Acceptance

Verify:

```text
cart-level Promotion call
coupon preview
minimum spend
scope
invalid coupon returned safely
Promotion outage does not corrupt cart
checkout remains responsible for final revalidation
```

---

# 218. Step 11 — Guest Cart Acceptance

If enabled:

```text
strong token generated
raw token returned only to owner
hash stored
token in header/cookie
invalid token denied
expired token denied
raw token absent from logs
```

---

# 219. Step 12 — Merge Acceptance

Verify:

```text
same-store merge
same selection combines
different modifiers remain separate
quantity cap checked
different-store policy applied
merge retry idempotent
old previews discarded
full revalidation performed
```

---

# 220. Step 13 — Cross-Device Acceptance

Verify:

```text
two devices read same version
one succeeds
stale mutation gets CART_VERSION_CONFLICT
latest cart available to client
no silent lost update
```

---

# 221. Step 14 — Checkout Validation Acceptance

Verify:

```text
structural validation
Catalog validation
price refresh
modifier refresh
Inventory preview/required readiness
Promotion/coupon revalidation
store/channel/fulfillment validation
address requirement
version current
server total
```

Cart result must still be:

```text
checkout preparation
```

not Order.

---

# 222. Step 15 — Conversion Acceptance

Verify:

```text
OrderCreated(cart_id)
marks cart CONVERTED
duplicate event no-op
converted cart immutable
next GET creates/returns new ACTIVE cart per policy
```

---

# 223. Step 16 — Failure Acceptance

Exercise:

```text
Catalog down
Inventory down
Promotion down
Redis down
PostgreSQL down
Kafka down
```

Verify exact documented degradation.

---

# 224. Step 17 — Recovery Acceptance

After restore:

```text
expired carts marked expired
active carts revalidated
Redis rebuilt
converted state reconciled
guest token behavior reviewed
```

---

# 225. Recommended Phase 8 Work Breakdown

Suggested tickets:

```text
CART-001 Decide service vs Ordering module
CART-002 Bootstrap Cart capability
CART-003 Create cart DB/Flyway
CART-004 Implement Cart aggregate
CART-005 Implement CartStatus
CART-006 Implement active-cart uniqueness
CART-007 Implement Cart persistence
CART-008 Implement GET /cart
CART-009 Implement Add Item
CART-010 Implement line merge identity
CART-011 Implement Update Quantity
CART-012 Implement Remove Item
CART-013 Implement Clear Cart
CART-014 Implement Catalog batch validation
CART-015 Implement modifier validation
CART-016 Implement price preview
CART-017 Implement preview version metadata
CART-018 Implement cart optimistic versioning
CART-019 Implement If-Match/version contract
CART-020 Implement cart expiry
CART-021 Implement expiry cleanup worker
CART-022 Implement Inventory batch preview
CART-023 Implement Promotion preview
CART-024 Implement coupon preview
CART-025 Implement Change Store
CART-026 Implement Change Channel
CART-027 Implement Change Fulfillment
CART-028 Implement address reference
CART-029 Implement Guest token generation/hash
CART-030 Implement Guest Cart authorization
CART-031 Implement merge history
CART-032 Implement Guest → Customer merge
CART-033 Implement merge idempotency
CART-034 Implement Validate Cart
CART-035 Implement checkout preparation
CART-036 Implement OrderCreated conversion consumer
CART-037 Implement processed-event idempotency
CART-038 Implement Redis cache
CART-039 Implement lifecycle outbox if required
CART-040 Implement Cart events if required
CART-041 Implement input/payload limits
CART-042 Implement domain tests
CART-043 Implement persistence tests
CART-044 Implement REST contract tests
CART-045 Implement Catalog dependency tests
CART-046 Implement Inventory dependency tests
CART-047 Implement Promotion dependency tests
CART-048 Implement guest security tests
CART-049 Implement merge tests
CART-050 Implement concurrency/version tests
CART-051 Implement idempotency tests
CART-052 Implement expiry tests
CART-053 Implement cache tests
CART-054 Implement failure tests
CART-055 Implement load tests
CART-056 Implement metrics/traces/logs
CART-057 Implement dashboard/alerts
CART-058 Write runbooks
CART-059 Backup/restore acceptance
CART-060 Complete ADRs/policy freeze
CART-061 Phase 8 exit review
```

---

# 226. Minimum Viable Cart Capability

Source-defined first production-capable version:

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

---

# 227. Recommended Initial Scope

Required:

```text
Cart aggregate
One active customer cart
Single-store rule
Store/channel context
Cart items
Modifiers
Quantity
Catalog validation
Server-side price preview
Optimistic version
Expiry
Inventory preview
Checkout revalidation
```

Conditional:

```text
Guest cart
Guest/customer merge
Promotion preview
Coupon preview
Redis cache
Kafka lifecycle events
Checkout token
Checkout lock
```

---

# 228. Out of Initial Scope Unless Approved

```text
Saved carts
Multiple named carts
Scheduled ordering
Collaborative/shared carts
Cross-region synchronization
Delta synchronization
Inventory hold during ordinary cart stage
Personalized pricing
Advanced recommendations
Complex offline conflict-resolution engine
Multi-store checkout
```

---

# 229. Phase 8 ADRs

Recommended:

```text
ADR-CART-001 Service vs Ordering module
ADR-CART-002 Active-cart uniqueness
ADR-CART-003 Single-store cart
ADR-CART-004 Cart storage strategy
ADR-CART-005 Cart expiry model
ADR-CART-006 Optimistic versioning contract
ADR-CART-007 Guest token design
ADR-CART-008 Guest/customer merge policy
ADR-CART-009 Inventory preview/no-reservation rule
ADR-CART-010 Price preview/non-final semantics
ADR-CART-011 Dependency fallback behavior
ADR-CART-012 Checkout preparation/lock strategy
ADR-CART-013 Cart lifecycle event policy
ADR-CART-014 Retention/privacy policy
```

---

# 230. Phase 8 Policy Freeze Checklist

Before production:

- [ ] Service vs module decision.
- [ ] Active-cart uniqueness.
- [ ] Single-store rule.
- [ ] Channel codes.
- [ ] Fulfillment values.
- [ ] Store-change policy.
- [ ] Channel-change policy.
- [ ] Fulfillment-change policy.
- [ ] Maximum quantity per item.
- [ ] Maximum cart lines.
- [ ] Maximum payload.
- [ ] Supported currencies.
- [ ] Shared rounding policy.
- [ ] Price-lock policy.
- [ ] Add-unavailable-item UX.
- [ ] Cart expiry duration.
- [ ] Sliding vs absolute expiry.
- [ ] Maximum cart lifetime.
- [ ] Storage strategy.
- [ ] Redis TTL if enabled.
- [ ] Guest cart requirement.
- [ ] Guest token TTL.
- [ ] Guest-token transport.
- [ ] Same-store merge policy.
- [ ] Different-store merge policy.
- [ ] Add-item idempotency requirement.
- [ ] Checkout token scope if enabled.
- [ ] Checkout lock vs version-only.
- [ ] Cart conversion trigger.
- [ ] Converted-cart retention.
- [ ] Expired-cart retention.
- [ ] Abandoned-cart retention.
- [ ] Catalog-down behavior.
- [ ] Inventory-down behavior.
- [ ] Promotion-down behavior.
- [ ] SLO targets.
- [ ] Alert thresholds.
- [ ] Cart RPO/RTO.

---

# 231. Phase 8 Completion Tree

```text
PHASE 08 — CART

├── Capability Boundary                         ✅
│   ├── Cart != Order
│   ├── Preview != Final Price
│   └── No Normal Inventory Reservation
│
├── Cart Domain                                 ✅
│   ├── Cart
│   ├── Cart Item
│   ├── Modifier Selection
│   ├── Store
│   ├── Channel
│   ├── Fulfillment Preview
│   └── Status
│
├── Persistence                                 ✅
│   ├── PostgreSQL recommended
│   ├── Flyway
│   ├── Expiry
│   ├── Version
│   └── Guest token hash
│
├── Cart Operations                             ✅
│   ├── GET
│   ├── Add
│   ├── Update
│   ├── Remove
│   ├── Clear
│   └── Context Changes
│
├── Authoritative Dependencies                  ✅
│   ├── Catalog Validation
│   ├── Inventory Preview
│   └── Promotion Preview
│
├── Price Preview                               ✅
│   ├── Server Side
│   ├── Deterministic
│   ├── Version Metadata
│   └── Non-Final
│
├── Guest Cart                                  ✅ / Conditional
├── Guest Merge                                 ✅ / Conditional
├── Versioning / Concurrency                    ✅
├── Expiry / Cleanup                            ✅
├── Checkout Revalidation                       ✅
├── Conversion                                  ✅
├── Security                                    ✅
├── Cache                                       ✅ / Conditional
├── Events                                      ✅ / Conditional
├── Testing                                     ✅
├── Observability                               ✅
├── Failure / Recovery                          ✅
└── Documentation / ADRs                        ✅
```

---

# 232. Exit Criteria — Ownership

The team can explain:

```text
What does Cart own?
What remains owned by Catalog?
What remains owned by Inventory?
What remains owned by Promotion?
What becomes owned by Ordering?
```

---

# 233. Exit Criteria — Price

The team can explain:

```text
Why does Cart display a price preview rather than an authoritative transaction price?
```

and demonstrate checkout refresh behavior.

---

# 234. Exit Criteria — Inventory

The team can answer:

```text
Does Add-to-Cart reserve stock?
```

Expected default:

```text
No.
```

---

# 235. Exit Criteria — Guest

The team can prove:

```text
anonymous cart ownership is secure
guest token cannot be guessed/recovered from DB
merge after login is deterministic and idempotent
```

---

# 236. Exit Criteria — Concurrency

The team can demonstrate:

```text
two-device stale writes do not silently overwrite newer cart state
```

---

# 237. Exit Criteria — Expiry

The team can explain:

```text
when cart expires
how expires_at is stored
how expired carts are cleaned
what happens to an active client near expiry
```

---

# 238. Exit Criteria — Checkout

The team can list and prove all validations repeated before durable Order creation:

```text
Cart structure
Catalog
Price
Modifiers
Inventory
Promotion
Store/channel
Fulfillment
Address requirement
Version
Server totals
```

---

# 239. Exit Criteria — Failure

The team can explain:

```text
Catalog down
Inventory down
Promotion down
Redis down
PostgreSQL down
Kafka down
```

without pretending stale preview is authoritative.

---

# 240. Exit Criteria — Service Separation

The team has explicitly decided:

```text
independent Cart Service
```

or:

```text
Cart module inside Ordering
```

and documented the reason.

---

# 241. Handoff to Phase 09

After Cart is complete, move to:

```text
PHASE 09 — Promotion / Coupon Service
```

The boundary is:

```text
Cart
    owns:
        temporary shopping state
        coupon input/reference
        promotion preview
        price preview
        validation state

Promotion / Coupon
    owns:
        promotion definitions
        coupon definitions
        coupon issuance
        eligibility
        scope
        discount rules
        usage limits
        reservation
        redemption
        release
        promotion versioning
```

Cart can request:

```text
EvaluateCartPromotion
```

but must not implement promotion rules itself.

---

# 242. Final Phase 8 Principle

The essential transition is:

```text
Temporary Cart
      ↓
Authoritative Checkout Revalidation
      ↓
Durable Order
```

At conversion time, Ordering must preserve authoritative snapshots of:

```text
items
modifiers
prices
fees
discounts
addresses
```

The most important implementation rules are:

```text
Cart is temporary.
Cart is not Order.
Price is preview only.
Normal cart does not reserve Inventory.
Never trust client totals.
Catalog validates product configuration.
Inventory owns stock.
Promotion owns discounts.
Guest ownership uses opaque token.
Merge is idempotent.
Cross-device writes use optimistic versioning.
Dependencies should be batched.
Checkout revalidates everything.
Cart data expires and is retained briefly.
```

---

**End of PHASE 08 — Cart Service**
