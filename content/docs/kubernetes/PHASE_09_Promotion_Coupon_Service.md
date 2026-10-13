---
title: "PHASE 09 — Promotion / Coupon Service"
---

# PHASE 09 — Promotion / Coupon Service

> **Purpose:** Implement the platform Promotion / Coupon Service as the authoritative owner of transaction-time discount eligibility, promotion rules, immutable promotion versions, coupon issuance and assignment, coupon reservation/redemption/release, usage and budget limits, deterministic stacking, redemption history, and promotion reconciliation.
>
> **Previous Phase:** Phase 08 — Cart Service
>
> **Next Phase:** Phase 10 — Ordering Service
>
> **Primary Architecture Basis:** PART 17 — Promotion / Coupon Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 22 — Distributed Transactions / Saga, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Roadmap Note:** The architecture source places Promotion after Loyalty, but this implementation roadmap intentionally builds Promotion in Phase 09 and Loyalty later in Phase 16. Therefore the Promotion core is implemented fully now, while Loyalty-tier and Loyalty-reward integrations remain contract-ready and are activated when Phase 16 is implemented.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, Redis where appropriate, REST/gRPC, Kafka, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 9 Goal

Phase 9 builds:

```text
promotion-service
```

Promotion / Coupon Service owns:

```text
Promotion Definition
Promotion Rule
Promotion Version
Coupon Definition
Coupon Instance / Code
Coupon Issuance
Customer Coupon Assignment
Eligibility
Discount Calculation
Promotion Priority
Stacking / Exclusivity
Coupon Reservation
Coupon Redemption
Coupon Release
Usage Limits
Per-Customer Limits
Global Limits
Budget Limits
Store / Channel Scope
Product / Category Scope
Time Window
Promotion Events
Promotion Reconciliation
```

It answers:

```text
Which promotions are active?
Which promotions apply to this cart/order?
Is this customer eligible?
Is this coupon valid?
Does the coupon belong to this customer?
What discount should apply?
Can multiple promotions combine?
Is there remaining global usage capacity?
Is there remaining customer usage capacity?
Is there remaining campaign budget?
Can a coupon/usage slot be reserved?
Can a reservation be redeemed?
Can a reservation be released?
Has the coupon already been used?
```

---

# 2. Non-Responsibilities

Promotion does not own:

```text
Order lifecycle
Product master
Catalog base price
Inventory stock
Wallet balance
Loyalty points ledger
Mission progress
Customer profile master
Payment provider state
```

Boundary:

```text
Catalog
= authoritative base price / product definition

Promotion
= discount and coupon logic

Ordering
= durable transaction snapshot

Loyalty
= points / tier / reward value

Inventory
= stock
```

---

# 3. Phase 9 Success State

Core promotion lifecycle:

```text
Promotion Draft
      ↓
Validate
      ↓
Publish Immutable Version
      ↓
Schedule / Activate
      ↓
Evaluate Cart / Order
      ↓
Reserve Coupon / Usage / Budget
      ↓
Order Created
      ↓
Redeem
```

Failure path:

```text
Reserve
   ↓
Checkout / Order fails
   ↓
Release
```

Cart preview:

```text
Cart
   ↓
EvaluatePromotions
   ↓
Preview only
```

Checkout:

```text
Ordering
   ↓
Authoritative Evaluation
   ↓
ReservePromotion
   ↓
Create Order
   ↓
RedeemPromotion
```

---

# 4. Core Promotion Equation

Conceptually:

```text
Eligibility
+
Scope
+
Rule
+
Benefit
+
Stacking
+
Usage Limits
+
Budget Limits
=
Applied Promotion
```

---

# 5. Non-Negotiable Correctness Rules

The service must preserve:

```text
Catalog owns base price.
Promotion owns discount logic.
Published promotion versions are immutable.
Preview is not redemption.
Coupon reservation is not redemption.
Reservation protects scarce usage/budget capacity.
Redemption is idempotent.
Release is idempotent.
Global usage limits are concurrency-safe.
Per-customer usage limits are concurrency-safe.
Budget limits are concurrency-safe.
Stacking order is deterministic.
Discount calculation is deterministic.
Usage counters can be reconciled from immutable history.
Client-provided discount values are never trusted.
Historical Order snapshots are never rewritten.
```

---

# 6. Source-Defined Open Decisions

Freeze before production:

```text
Promotion ID strategy
Promotion code policy
Initial promotion types
Coupon code strategies
Coupon code length/alphabet
Coupon normalization
Coupon assignment model
Reservation TTL
Reservation/reference uniqueness
Global usage behavior
Per-customer usage behavior
Budget reservation semantics
Rounding policy
Stacking policies
Stacking groups
Tie-breakers
Discount allocation rule
Minimum-spend basis
Cancellation restoration policy
Refund restoration policy
Promotion scheduling timezone
Admin approval workflow
High-value coupon security
Rate-limit thresholds
Cache TTLs
Reconciliation schedule
Legacy migration scope
DR RPO/RTO
```

Use explicit:

```text
TBD_POLICY
TBD_SECURITY
TBD_ARCHITECTURE
TBD_SCOPE
TBD_DR
```

until approved.

---

# 7. Promotion Boundary

```text
                Cart / Order
                     │
                     ▼
             Promotion Service
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
   Promotion       Coupon      Eligibility
    Rules          State         Engine
       │             │             │
       └─────────────┼─────────────┘
                     ▼
                promotion_db
                     │
                     ▼
                    Kafka
```

Potential dependencies:

```text
Catalog
Customer
Loyalty
Store / Location
```

through contracts or projections only.

---

# 8. Ubiquitous Language

| Term | Meaning |
|---|---|
| Promotion | Offer configuration producing a discount/benefit |
| Promotion Version | Immutable published revision |
| Promotion Rule | Condition plus benefit logic |
| Coupon Definition | Template/policy for coupons |
| Coupon Instance | Specific redeemable code/assignment |
| Eligibility | Whether context satisfies promotion conditions |
| Discount | Monetary reduction |
| Reservation | Temporary hold on coupon/usage/budget capacity |
| Redemption | Final consumption of entitlement |
| Release | Return of reserved capacity |
| Usage Limit | Count constraint |
| Budget Limit | Monetary discount constraint |
| Stack | Apply multiple promotions |
| Exclusive | Cannot combine with other promotions |
| Scope | Customer/store/channel/product/category/time dimensions |

---

# 9. Promotion Aggregate

Primary aggregate:

```text
Promotion
```

Possible state:

```text
promotion_id
promotion_code
name
status
promotion_type
priority
stacking_policy
starts_at
ends_at
usage_limit
per_customer_limit
configuration
active_version
created_at
updated_at
```

Published behavior is defined by immutable:

```text
PromotionVersion
```

---

# 10. Promotion Status

Source-defined:

```text
DRAFT
SCHEDULED
ACTIVE
PAUSED
EXPIRED
ARCHIVED
```

---

# 11. Promotion State Meaning

```text
DRAFT
→ editable, not customer-eligible

SCHEDULED
→ published/configured for future start

ACTIVE
→ may evaluate/apply

PAUSED
→ temporarily disabled

EXPIRED
→ time window finished

ARCHIVED
→ historical / no new redemption
```

---

# 12. Promotion State Transitions

```text
DRAFT
  ├──> SCHEDULED
  ├──> ACTIVE
  └──> ARCHIVED

SCHEDULED
  ├──> ACTIVE
  ├──> PAUSED
  └──> ARCHIVED

ACTIVE
  ├──> PAUSED
  ├──> EXPIRED
  └──> ARCHIVED

PAUSED
  ├──> ACTIVE
  └──> ARCHIVED
```

---

# 13. Promotion Invariants

Enforce:

```text
promotion_code unique
starts_at <= ends_at
discount cannot make payable amount negative
usage limits cannot be negative
per_customer_limit cannot exceed global limit when both exist
ACTIVE promotion must have valid published rule configuration
ARCHIVED promotion cannot receive new redemption
```

---

# 14. Promotion Code

Recommended format:

```text
UPPERCASE_WITH_UNDERSCORES
```

Examples:

```text
WELCOME_20_OFF
PICKUP_1_DOLLAR_OFF
FREE_DELIVERY_WEEKEND
BROWN_MEMBER_10_PERCENT
```

Avoid changing code after publish.

---

# 15. Promotion Types

Source candidates:

```text
PERCENTAGE_DISCOUNT
FIXED_AMOUNT_DISCOUNT
FREE_ITEM
BUY_X_GET_Y
FREE_DELIVERY
PRICE_OVERRIDE
BONUS_POINTS
COUPON_ONLY
```

Do not implement every type initially.

---

# 16. Recommended Initial Promotion Types

For Phase 09 minimum production scope:

```text
FIXED_AMOUNT_DISCOUNT
PERCENTAGE_DISCOUNT
```

Add only when required:

```text
FREE_DELIVERY
PRICE_OVERRIDE
```

Defer complex:

```text
BUY_X_GET_Y
FREE_ITEM
BONUS_POINTS
```

unless required now.

---

# 17. Coupon Definition vs Coupon Instance

Separate:

```text
Coupon Definition
```

from:

```text
Coupon Instance
```

Definition owns:

```text
rules
validity policy
code strategy
per-coupon usage limit
assignment requirement
```

Instance owns:

```text
specific code
owner
status
issued time
validity
usage
source
```

---

# 18. Coupon Definition

Possible fields:

```text
coupon_definition_id
promotion_id
code_strategy
status
starts_at
ends_at
per_coupon_usage_limit
customer_assignment_required
```

---

# 19. Coupon Instance

Possible fields:

```text
coupon_id
coupon_definition_id
coupon_code
customer_id optional
status
issued_at
valid_from
expires_at
usage_count
reservation_count
source_type
source_reference
version
```

---

# 20. Coupon Status

Source-defined:

```text
ISSUED
ACTIVE
RESERVED
REDEEMED
EXPIRED
REVOKED
DISABLED
```

Reusable coupons may remain:

```text
ACTIVE
```

after a redemption until their usage limit is exhausted.

---

# 21. Coupon Code Strategy

Possible:

```text
STATIC
GENERATED_UNIQUE
CUSTOMER_SPECIFIC
BATCH_IMPORT
```

Decision:

```text
COUPON_CODE_STRATEGIES = TBD_POLICY
```

---

# 22. Coupon Code Security

If possession of a code carries value:

```text
use high entropy
use unpredictable code generation
rate limit validation
bind to customer where appropriate
avoid sequential enumerable codes
```

---

# 23. Coupon Code Normalization

Define:

```text
trim
uppercase/lowercase rule
allowed characters
case sensitivity
```

Recommended example:

```text
" welcome20 "
→
"WELCOME20"
```

Normalize before:

```text
lookup
uniqueness check
hashing
comparison
```

---

# 24. Coupon Issuance Sources

Coupon may be issued by:

```text
Promotion Admin
Registration
Referral
Partner Campaign
Import
Mission Reward
Loyalty Reward
```

Each issuance records:

```text
source_type
source_reference
```

---

# 25. Roadmap Staging — Loyalty/Mission Sources

Because this implementation roadmap reaches:

```text
Loyalty → Phase 16
Mission → Phase 17
```

Phase 09 should define source contracts now but should not hard-depend on those services during the initial deployment.

Implement generic source references such as:

```text
source_type
source_reference
```

so later phases can issue coupons idempotently without schema redesign.

---

# 26. Issuance Idempotency

Same upstream reward/assignment must not issue duplicate coupons.

Candidate unique key:

```text
(source_type, source_reference, coupon_definition_id, customer_id)
```

---

# 27. Customer-Assigned Coupon

If coupon belongs to:

```text
customer_id
```

redemption requires:

```text
authenticated / authoritative customer
==
assigned customer
```

---

# 28. Public Coupon

A public code such as:

```text
WELCOME20
```

may have no customer assignment.

It still obeys:

```text
eligibility
global usage
per-customer usage
budget
time
scope
```

---

# 29. Single-Use Coupon

Example:

```text
per_coupon_usage_limit = 1
```

After successful final redemption:

```text
REDEEMED
```

---

# 30. Multi-Use Coupon

Example:

```text
per_coupon_usage_limit = 10
```

Coupon can remain active until:

```text
redeemed_count >= limit
```

---

# 31. Per-Customer Usage Limit

Example:

```text
1 use per customer
```

Track:

```text
promotion_id + customer_id
```

with reserved and redeemed counts.

---

# 32. Global Usage Limit

Example:

```text
first 10,000 redemptions
```

The service must prevent concurrent over-allocation.

---

# 33. Budget Limit

Example:

```text
maximum total discount = 10,000 USD
```

Must reserve monetary capacity atomically.

---

# 34. Usage vs Budget

Usage:

```text
number of redemptions
```

Budget:

```text
total discount value
```

They are independent constraints.

---

# 35. Promotion Scope Dimensions

Possible:

```text
customer
segment
tier
store
channel
fulfillment
product
category
payment method
currency
time
minimum spend
maximum spend
```

Only implement dimensions required by current business rules.

---

# 36. Store Scope

Possible:

```text
ALL
INCLUDE stores
EXCLUDE stores
store group
region
```

Store IDs are logical external references.

---

# 37. Channel Scope

Examples:

```text
APP
WEB
PICKUP
DELIVERY
DINE_IN
PARTNER
```

Canonical values must come from shared contracts.

Do not infer channel from unrelated fields.

---

# 38. Product Scope

Possible:

```text
all products
included products
excluded products
included categories
excluded categories
```

Catalog remains authoritative for product/category identity.

---

# 39. Customer Scope

Possible:

```text
all customers
specific customers
new customers
segment
tier
member type
journey eligibility
```

Do not store unnecessary customer profile data in Promotion.

---

# 40. New Customer Rule

Define precisely.

Possible meanings:

```text
registration date
first order
first paid order
no prior redemption
```

Never implement a vague:

```text
is_new_user
```

without documented semantics.

---

# 41. Loyalty Tier Eligibility

Architecture supports tier rules such as:

```text
GOLD
PLATINUM
```

but Promotion must consume:

```text
trusted Loyalty contract/projection
```

not `loyalty_db`.

For this roadmap:

```text
tier-based promotions = contract-ready, activated after Phase 16
```

unless an existing trusted tier source is explicitly used.

---

# 42. Minimum Spend

Example:

```text
subtotal >= 10.00 USD
```

Must define basis:

```text
before promotions?
after item-level discounts?
exclude fees?
include tax?
eligible-item subtotal only?
```

Decision:

```text
MINIMUM_SPEND_BASIS = TBD_POLICY
```

---

# 43. Maximum Discount

Percentage promotions should support:

```text
max_discount_amount
```

Example:

```text
20% off
max $5
```

---

# 44. Fixed Amount Discount

Formula:

```text
discount
=
min(configured_amount, eligible_amount)
```

Payable amount cannot become negative.

---

# 45. Percentage Discount

Formula:

```text
discount
=
eligible_amount
×
percentage
```

Then apply:

```text
rounding
max_discount cap
```

---

# 46. Free Delivery

Formula:

```text
delivery_fee_discount
=
min(delivery_fee, configured_cap)
```

Do not mutate product subtotal.

---

# 47. Price Override

Example:

```text
Latte = 1.50 USD
```

Must define:

```text
eligible product
quantity limit
original price source
override priority
interaction with other promotions
```

---

# 48. Buy-X-Get-Y — Future/Conditional

Must define:

```text
qualifying items
reward items
thresholds
cheapest/selected behavior
repeat limit
```

Do not implement as a vague generic discount.

---

# 49. Free Item — Future/Conditional

May be represented as:

```text
discount allocated to specific item/quantity
```

rather than silently adding products to Cart.

---

# 50. Bonus Points — Deferred Integration

Promotion may calculate a:

```text
BONUS_POINTS
```

benefit, but Loyalty owns the actual points credit.

In this roadmap, final points-ledger integration is deferred to Phase 16.

---

# 51. Promotion Rule Model

Concept:

```text
Conditions
+
Benefits
+
Priority
+
Stacking Policy
```

---

# 52. Condition Types

Source examples:

```text
MIN_SPEND
STORE_IN
CHANNEL_IN
FULFILLMENT_IN
PRODUCT_IN
CATEGORY_IN
CUSTOMER_SEGMENT
LOYALTY_TIER
FIRST_ORDER
DATE_TIME_WINDOW
PAYMENT_METHOD
```

---

# 53. Benefit Types

Source examples:

```text
PERCENT_OFF
AMOUNT_OFF
FREE_DELIVERY
FREE_ITEM
PRICE_OVERRIDE
BONUS_POINTS
```

---

# 54. Rule Engine Strategy

Initial recommendation:

```text
typed Java rule implementations
```

Avoid early general-purpose expression language.

Reasons:

```text
debugging
security
testability
versioning
determinism
```

---

# 55. Rule Configuration

Example:

```json
{
  "minimum_spend": "10.00",
  "percentage": "20",
  "max_discount": "5.00",
  "currency": "USD"
}
```

Configuration must be validated before publication/activation.

---

# 56. Promotion Versioning

Published rule changes create:

```text
promotion_version + 1
```

Never silently mutate historical published behavior.

---

# 57. Promotion Version Model

Possible fields:

```text
promotion_id
version
configuration_json
starts_at
ends_at
published_at
published_by
status
```

Order must preserve:

```text
applied promotion version
```

---

# 58. Draft vs Published

Lifecycle:

```text
Draft
   ↓
Validate
   ↓
Publish Immutable Version
   ↓
Schedule / Activate
```

Evaluation uses:

```text
published version
```

not draft edits.

---

# 59. Publish Validation

Before publish validate:

```text
time window
discount values
usage limits
budget
scope references
stacking policy
currency
rule schema
coupon strategy
```

---

# 60. Atomic Publish

Recommended pattern:

```text
immutable version row
+
active_version_id pointer
```

Publication must not expose partially edited/mixed configuration.

---

# 61. Promotion Publish Transaction

```text
BEGIN

validate draft
insert immutable promotion version
set published/active version pointer as appropriate
insert outbox PromotionPublished
write audit

COMMIT
```

---

# 62. Evaluation Context

Input may contain:

```text
customer_id
store_id
channel
fulfillment_type
currency
items[]
subtotal
delivery_fee
payment_method optional
coupon_code optional
evaluation_time
loyalty_tier optional
```

Input must be server-controlled for authoritative checkout.

---

# 63. Evaluation Result

Return:

```text
eligible promotions
promotion_id
promotion_code
promotion_version
discount type
discount amount
total discount
currency
reason codes
allocation where required
```

---

# 64. Pure Evaluation

`EvaluatePromotions` should be:

```text
deterministic
side-effect free
```

where possible.

Do not reserve usage or redeem during preview evaluation.

---

# 65. Preview vs Authoritative Evaluation

Cart:

```text
preview
```

Ordering checkout:

```text
authoritative validation/evaluation
```

Preview can become stale.

---

# 66. Coupon Validation Endpoint

Possible:

```text
POST /api/v1/promotions/coupons/validate
```

Returns:

```text
eligible
promotion
discount preview
currency
promotion version
reason if invalid
```

No usage is consumed.

---

# 67. Evaluate Promotions Endpoint

Possible:

```text
POST /api/v1/promotions/evaluate
```

Used by:

```text
Cart
Ordering
```

with server-derived pricing/product context.

---

# 68. Coupon Reservation

Limited coupons/usage/budgets need:

```text
reservation during checkout
```

to avoid races.

---

# 69. Reservation Entity

Possible fields:

```text
reservation_id
coupon_id optional
promotion_id
promotion_version
customer_id
reference_type
reference_id
discount_amount
currency
status
expires_at
created_at
updated_at
idempotency_key
```

---

# 70. Reservation Status

Source:

```text
ACTIVE
REDEEMED
RELEASED
EXPIRED
```

---

# 71. Reserve Promotion Flow

```text
Validate context
      ↓
Claim idempotency
      ↓
Re-evaluate authoritative eligibility
      ↓
Lock scarce counters / coupon
      ↓
Validate customer/global/coupon/budget capacity
      ↓
Reserve usage
      ↓
Reserve budget
      ↓
Create reservation
      ↓
Write outbox
      ↓
Commit
```

---

# 72. Reservation Idempotency

Same checkout/reference must not reserve twice.

Candidate uniqueness:

```text
coupon_id + reference_type + reference_id
```

or explicit:

```text
idempotency_key + request_hash
```

---

# 73. Reservation TTL

Source example:

```text
5–15 minutes
```

Exact duration must align with checkout/payment behavior.

Decision:

```text
PROMOTION_RESERVATION_TTL = TBD_POLICY
```

---

# 74. Reservation Expiry Worker

```text
Find ACTIVE reservations where expires_at <= now
      ↓
Lock
      ↓
Return reserved usage/budget
      ↓
Mark EXPIRED
      ↓
Outbox if needed
```

Must be idempotent.

---

# 75. Redeem Promotion

Final business success:

```text
ACTIVE Reservation
      ↓
REDEEMED
```

Update:

```text
promotion redeemed count
customer redeemed count
coupon redeemed count
budget reserved → redeemed
immutable redemption history
coupon status where applicable
```

---

# 76. Redemption Idempotency

Repeated:

```text
RedeemPromotion
```

for the same business operation must return the same semantic result.

Never increment counters twice.

---

# 77. Release Promotion

If checkout/order fails:

```text
ACTIVE Reservation
      ↓
RELEASED
```

Return:

```text
reserved usage capacity
reserved customer capacity
reserved coupon capacity
reserved budget
```

exactly once.

---

# 78. Reservation vs Redemption

Reservation:

```text
temporary capacity hold
```

Redemption:

```text
final usage
```

Preview must never increment final usage counters.

---

# 79. Global Usage Concurrency

Example:

```text
remaining = 1
100 concurrent reserve attempts
```

Expected:

```text
exactly <=1 succeeds
```

Use:

```text
atomic update
or
pessimistic lock
```

---

# 80. Atomic Usage Reservation

Conceptual:

```sql
UPDATE promotion_usage_counters
SET reserved_count = reserved_count + 1
WHERE promotion_id = :promotion_id
  AND (
        usage_limit IS NULL
        OR redeemed_count + reserved_count < usage_limit
      );
```

Check affected row count.

---

# 81. Per-Customer Concurrency

For:

```text
per_customer_limit = 1
```

two devices from the same customer must not reserve twice.

Protect:

```text
promotion_customer_usage
```

transactionally.

---

# 82. Budget Concurrency

Example:

```text
remaining budget = 5
two concurrent discounts = 4 + 4
```

Only one may reserve.

---

# 83. Budget Counter

Possible:

```text
budget_total
budget_reserved
budget_redeemed
```

Invariant:

```text
budget_reserved
+
budget_redeemed
<=
budget_total
```

---

# 84. Atomic Budget Reservation

Conceptual:

```sql
UPDATE promotion_usage_counters
SET budget_reserved = budget_reserved + :discount
WHERE promotion_id = :promotion_id
  AND budget_redeemed + budget_reserved + :discount <= budget_total;
```

---

# 85. Promotion Customer Usage

Possible:

```text
promotion_id
customer_id
reserved_count
redeemed_count
updated_at
version
```

Unique:

```text
(promotion_id, customer_id)
```

---

# 86. Coupon Usage

Possible:

```text
coupon_id
reserved_count
redeemed_count
```

Use when coupon-level limits require it.

---

# 87. Counters Are Operational State

Counters support efficient concurrency checks.

Authoritative history should exist in:

```text
coupon_reservations
promotion_redemptions
reversal history
```

Counters must be rebuildable/reconcilable.

---

# 88. Redemption History

Immutable:

```text
redemption_id
promotion_id
promotion_version
coupon_id
customer_id
reference_type
reference_id
order_id
discount_amount
currency
redeemed_at
reservation_id
```

---

# 89. Order Promotion Snapshot

Ordering must store:

```text
promotion_id
promotion_code
promotion_version
coupon_code if relevant
discount_type
discount_amount
discount allocation if required
```

This becomes historical transaction truth.

---

# 90. Promotion Stacking Policies

Possible:

```text
STACKABLE
EXCLUSIVE
BEST_ONLY
STACK_WITH_SAME_GROUP
STACK_EXCEPT_GROUP
```

Use explicit policy.

---

# 91. Exclusive Promotion

When exclusive promotion applies:

```text
other discounts do not apply
```

unless specifically configured otherwise.

---

# 92. Best-Only Promotion

Algorithm:

```text
evaluate eligible candidates
      ↓
calculate benefit
      ↓
select highest customer benefit
      ↓
apply deterministic tie-breaker
```

---

# 93. Tie-Breaker

Must be deterministic.

Possible ordering:

```text
higher discount
higher priority
lower/earlier stable promotion code/id
```

Decision:

```text
BEST_ONLY_TIE_BREAKER = TBD_POLICY
```

---

# 94. Promotion Priority

`priority` may determine evaluation order.

Priority must not be the only rule if stacking semantics remain ambiguous.

---

# 95. Promotion Groups

Possible:

```text
ORDER_DISCOUNT
ITEM_DISCOUNT
DELIVERY_DISCOUNT
LOYALTY_BENEFIT
```

Stacking may be configured by group.

---

# 96. Deterministic Stacking Order

Source example:

```text
1. Item price override
2. Item percentage/fixed discount
3. Order subtotal discount
4. Delivery discount
5. Tax/fee adjustments where applicable
```

Exact business order:

```text
TBD_POLICY
```

---

# 97. Discount Base

For each stacked promotion define whether calculation uses:

```text
original amount
remaining amount
eligible-line subtotal
```

Never rely on hidden assumptions.

---

# 98. Double Discount Prevention

Do not apply:

```text
same promotion twice
same coupon twice
same promotion version twice
```

Dedupe by stable promotion/version/reference.

---

# 99. Discount Allocation

Order-level discounts may need allocation to lines for:

```text
refund
tax
reporting
accounting
```

---

# 100. Proportional Allocation

Formula:

```text
line eligible subtotal
/
total eligible subtotal
×
order discount
```

---

# 101. Rounding Remainder

Rounding remainder must be deterministic.

Possible:

```text
largest remainder method
```

or:

```text
assign remainder to final deterministic eligible line
```

Decision:

```text
DISCOUNT_ALLOCATION_REMAINDER_RULE = TBD_POLICY
```

---

# 102. Free Item Allocation

Free-item benefit should map to:

```text
specific item
specific quantity
```

when refund logic needs precise attribution.

---

# 103. Minimum Spend + Stacking

Define whether minimum spend is checked:

```text
before other discounts
```

or:

```text
after item-level discounts
```

Decision:

```text
MINIMUM_SPEND_STACKING_ORDER = TBD_POLICY
```

---

# 104. Eligibility Reason Codes

Stable source reasons:

```text
NOT_STARTED
EXPIRED
CUSTOMER_NOT_ELIGIBLE
STORE_NOT_ELIGIBLE
CHANNEL_NOT_ELIGIBLE
PRODUCT_NOT_ELIGIBLE
MINIMUM_SPEND_NOT_MET
USAGE_LIMIT_REACHED
CUSTOMER_LIMIT_REACHED
BUDGET_EXHAUSTED
COUPON_INVALID
COUPON_EXPIRED
COUPON_ALREADY_USED
```

---

# 105. Friendly Messages

Promotion returns:

```text
stable machine reason code
```

UI/translation layer renders localized customer text.

Do not put localization logic inside the promotion rule engine.

---

# 106. Promotion Database

Logical DB:

```text
promotion_db
```

Only Promotion Service writes authoritative state.

---

# 107. Core Tables

Source model:

```text
promotions
promotion_versions
promotion_conditions
promotion_benefits
promotion_store_scope
promotion_channel_scope
promotion_product_scope
promotion_category_scope
coupon_definitions
coupons
coupon_assignments
promotion_usage_counters
promotion_customer_usage
coupon_reservations
promotion_redemptions
promotion_idempotency
processed_events
outbox_events
promotion_reconciliation_runs
promotion_reconciliation_mismatches
```

Optional reversal table:

```text
promotion_redemption_reversals
```

---

# 108. Promotions Table

Concept:

```text
id
promotion_code
name
promotion_type
status
priority
stacking_policy
active_version
starts_at
ends_at
created_at
updated_at
```

Unique:

```text
promotion_code
```

---

# 109. Promotion Versions Table

Concept:

```text
id
promotion_id
version
configuration_json
starts_at
ends_at
published_at
published_by
status
```

Unique:

```text
(promotion_id, version)
```

---

# 110. Conditions Table

Optional normalized model:

```text
id
promotion_version_id
condition_type
operator
configuration_json
display_order
```

---

# 111. Benefits Table

```text
id
promotion_version_id
benefit_type
configuration_json
display_order
```

---

# 112. Scope Tables

Possible:

```text
promotion_store_scope
promotion_channel_scope
promotion_product_scope
promotion_category_scope
```

with:

```text
INCLUDE
EXCLUDE
```

semantics.

---

# 113. Coupon Definitions Table

Concept:

```text
id
promotion_id
code_strategy
status
valid_from
valid_to
usage_limit_per_coupon
assignment_required
created_at
updated_at
```

---

# 114. Coupons Table

Concept:

```text
id
coupon_definition_id
coupon_code
customer_id
status
issued_at
valid_from
expires_at
reserved_count
redeemed_count
source_type
source_reference
version
```

Unique:

```text
coupon_code
```

after normalization strategy.

---

# 115. Usage Counters Table

```text
promotion_id
reserved_count
redeemed_count
budget_total
budget_reserved
budget_redeemed
updated_at
version
```

---

# 116. Customer Usage Table

```text
promotion_id
customer_id
reserved_count
redeemed_count
updated_at
version
```

Unique:

```text
(promotion_id, customer_id)
```

---

# 117. Coupon Reservations Table

```text
id
coupon_id
promotion_id
promotion_version
customer_id
reference_type
reference_id
discount_amount
currency
status
expires_at
created_at
updated_at
idempotency_key
```

---

# 118. Redemptions Table

```text
id
promotion_id
promotion_version
coupon_id
customer_id
reference_type
reference_id
order_id
discount_amount
currency
redeemed_at
reservation_id
```

Add a unique business reference according to the final checkout model.

---

# 119. Promotion Idempotency Table

```text
id
operation
scope_id
idempotency_key
request_hash
status
response_code
response_body
created_at
expires_at
```

---

# 120. Processed Events Table

```text
event_id
consumer_name
processed_at
```

Unique:

```text
(event_id, consumer_name)
```

---

# 121. Outbox

Use transactional outbox for:

```text
PromotionPublished
PromotionActivated
PromotionPaused
PromotionExpired
CouponIssued
CouponAssigned
CouponReserved
CouponReleased
CouponRedeemed
CouponExpired
PromotionUsageLimitReached
PromotionBudgetExhausted
```

as actual consumers require.

---

# 122. Reconciliation Tables

```text
promotion_reconciliation_runs
promotion_reconciliation_mismatches
```

---

# 123. Coupon Issue Transaction

```text
BEGIN

dedupe source
validate coupon definition
generate / normalize code
enforce uniqueness
insert coupon
insert assignment if modeled separately
insert outbox CouponIssued

COMMIT
```

---

# 124. Reserve Transaction

```text
BEGIN

claim idempotency
lock promotion usage counter
lock customer usage counter
lock coupon if relevant
re-evaluate eligibility
reserve global usage
reserve customer usage
reserve coupon capacity
reserve budget
insert reservation
insert outbox CouponReserved
complete idempotency

COMMIT
```

---

# 125. Redeem Transaction

```text
BEGIN

claim idempotency
lock reservation
lock relevant counters
validate ACTIVE
move reserved → redeemed
mark reservation REDEEMED
insert immutable redemption
update coupon counts/status
insert outbox CouponRedeemed
complete idempotency

COMMIT
```

---

# 126. Release Transaction

```text
BEGIN

claim idempotency
lock reservation
validate releasable state
decrease reserved global/customer/coupon counters
release reserved budget
mark RELEASED
insert outbox CouponReleased
complete idempotency

COMMIT
```

---

# 127. Reservation Expiry Transaction

Same compensation semantics as Release, but final state:

```text
EXPIRED
```

Expiry worker must be idempotent.

---

# 128. Deterministic Lock Ordering

Use one consistent ordering such as:

```text
promotion usage row
→ customer usage row
→ coupon row
→ reservation row
```

or another documented fixed sequence.

This reduces deadlock risk.

---

# 129. Locking Strategy

Evaluation:

```text
read-only
```

Reservation/redemption:

```text
pessimistic lock
or
atomic conditional update
```

for scarce capacity.

---

# 130. Internal Promotion Contracts

Core:

```text
EvaluatePromotions
ReservePromotion
RedeemPromotion
ReleasePromotion
```

Possible internal transport:

```text
gRPC
```

or REST according to Phase 13 service communication decisions.

---

# 131. ReservePromotion Contract

Fields:

```text
customer_id
coupon_code optional
reference_type
reference_id
context
idempotency_key
expires_at
```

---

# 132. RedeemPromotion Contract

Fields:

```text
reservation_id
order_id
idempotency_key
```

---

# 133. ReleasePromotion Contract

Fields:

```text
reservation_id
reason_code
idempotency_key
```

---

# 134. Query-by-Reference Capability

For Saga recovery/unknown outcome, support finding reservation/redemption using stable:

```text
reference_type
reference_id
```

or another approved business key.

This becomes important in later Saga implementation.

---

# 135. Promotion Error Catalog

Source candidates:

```text
PROMOTION_NOT_FOUND
PROMOTION_NOT_ACTIVE
PROMOTION_NOT_STARTED
PROMOTION_EXPIRED
PROMOTION_NOT_ELIGIBLE
PROMOTION_USAGE_LIMIT_REACHED
PROMOTION_CUSTOMER_LIMIT_REACHED
PROMOTION_BUDGET_EXHAUSTED
COUPON_NOT_FOUND
COUPON_INVALID
COUPON_EXPIRED
COUPON_REVOKED
COUPON_ALREADY_USED
COUPON_NOT_ASSIGNED_TO_CUSTOMER
COUPON_RESERVATION_NOT_FOUND
COUPON_RESERVATION_EXPIRED
COUPON_ALREADY_REDEEMED
COUPON_ALREADY_RELEASED
MINIMUM_SPEND_NOT_MET
STACKING_CONFLICT
CURRENCY_NOT_SUPPORTED
IDEMPOTENCY_KEY_REUSED
```

---

# 136. Error Mapping

Examples:

| Error | HTTP / gRPC |
|---|---|
| PROMOTION_NOT_FOUND | 404 / NOT_FOUND |
| PROMOTION_NOT_ACTIVE | 422 / FAILED_PRECONDITION |
| COUPON_NOT_FOUND | 404 / NOT_FOUND |
| COUPON_EXPIRED | 410 / FAILED_PRECONDITION |
| COUPON_ALREADY_USED | 409 / ALREADY_EXISTS |
| PROMOTION_USAGE_LIMIT_REACHED | 409 / RESOURCE_EXHAUSTED |
| MINIMUM_SPEND_NOT_MET | 422 / FAILED_PRECONDITION |
| IDEMPOTENCY_KEY_REUSED | 409 / ALREADY_EXISTS |

---

# 137. Promotion Events Published

Candidate:

```text
PromotionPublished
PromotionActivated
PromotionPaused
PromotionExpired
CouponIssued
CouponAssigned
CouponReserved
CouponReleased
CouponRedeemed
CouponExpired
PromotionUsageLimitReached
PromotionBudgetExhausted
```

---

# 138. CouponIssued Event

Avoid publishing raw coupon code unless a consumer truly needs it.

Prefer:

```text
coupon_id
promotion_id
customer_id
expires_at
```

---

# 139. CouponRedeemed Event

Potential consumers:

```text
Analytics
Notification
Finance Reporting
Loyalty
```

Data may include:

```text
coupon_id
promotion_id
customer_id
order_id
discount_amount
currency
```

---

# 140. Limit-Reached Events

Operational events:

```text
PromotionUsageLimitReached
PromotionBudgetExhausted
```

may trigger:

```text
admin notification
automatic pause
operational alert
```

according to policy.

---

# 141. Events Consumed

Potential future/source events:

```text
RewardAssigned
RewardClaimed
CustomerClosed
OrderCancelled
OrderCompleted
```

Enable only according to explicit integration strategy.

---

# 142. Reward-to-Coupon Issuance — Deferred Activation

Source pattern:

```text
RewardAssigned
    ↓
Promotion Service
    ↓
Issue Coupon Exactly Once
```

Use stable:

```text
reward_assignment_id
```

as source/idempotency reference.

Implementation should be prepared in Phase 09 but activated when Phase 16 Loyalty exists.

---

# 143. Order Cancellation Policy

If an order using a redeemed promotion is cancelled, possible policy:

```text
restore usage
reissue coupon
do nothing
```

Decision:

```text
ORDER_CANCELLATION_COUPON_POLICY = TBD_POLICY
```

---

# 144. Coupon Restoration

If restoration is allowed:

```text
OrderCancelled
    ↓
validate restoration policy
    ↓
write reversal/restoration history
    ↓
restore counters/coupon through controlled transaction
```

Never simply decrement usage counters without historical evidence.

---

# 145. Refund Policy

Possible:

```text
never restore
full cancellation only
proportional restore
replacement coupon
```

Decision:

```text
REFUND_PROMOTION_RESTORATION_POLICY = TBD_POLICY
```

---

# 146. Redemption Reversal

Where required, use explicit history:

```text
promotion_redemption_reversals
```

or equivalent immutable reversal record.

---

# 147. Promotion Reconciliation

Verify:

```text
redemptions vs global counters
active reservations vs reserved counters
customer usage vs history
coupon redeemed count vs redemptions
budget counters vs discount history
```

---

# 148. Global Usage Reconciliation

Expected:

```text
COUNT(active reservations)
=
reserved_count
```

and:

```text
COUNT(final redemptions)
=
redeemed_count
```

subject to reversal policy.

---

# 149. Budget Reconciliation

Expected:

```text
SUM(active reservation discount)
=
budget_reserved
```

and:

```text
SUM(net final redemption discount)
=
budget_redeemed
```

---

# 150. Customer Usage Reconciliation

Per customer:

```text
active reservation count
redeemed history count
```

must match persisted operational counters.

---

# 151. Coupon Reconciliation

For single-use coupon:

```text
redeemed_count <= 1
```

and status must agree with history.

---

# 152. No Silent Counter Repair

Counters can be rebuilt from immutable history.

Any rebuild must be:

```text
audited
observable
reviewable
```

Do not hide underlying race conditions.

---

# 153. Reconciliation Run

Possible fields:

```text
id
scope
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 154. Reconciliation Mismatch

Possible fields:

```text
id
run_id
promotion_id
coupon_id
customer_id
mismatch_type
expected_value
actual_value
status
detected_at
resolved_at
```

---

# 155. Redis Usage

Redis may cache:

```text
active promotion versions
candidate promotion lists by store/channel
coupon lookup summary
eligibility reference data
```

Do not use Redis as authoritative source for:

```text
usage capacity
budget
reservation
redemption
coupon final state
```

---

# 156. Cache Keys

Examples:

```text
promotion:active:{store}:{channel}
promotion:version:{promotion_id}:{version}
coupon:summary:{coupon_code_hash}
```

Avoid raw high-value coupon codes in logs/telemetry.

---

# 157. Cache Invalidation

Invalidate on:

```text
publish
activate
pause
expire
coupon revoke
```

Final reservation never trusts stale cache counters.

---

# 158. Evaluation Performance

Pre-filter candidates by:

```text
status
time
store
channel
coupon
customer scope
product/category scope
```

before expensive rule calculation.

---

# 159. Candidate Promotion Projection

Possible read model:

```text
active promotions by store/channel/time
```

to avoid scanning every promotion.

---

# 160. Rule Compilation — Future Optimization

Published configuration may later be compiled into runtime structures.

Requirement:

```text
same semantics on all nodes
```

---

# 161. Deterministic Evaluation

Given the same:

```text
promotion version
evaluation context
evaluation timestamp
```

the same result must be produced.

---

# 162. Evaluation Timestamp

Use one:

```text
evaluation_time
```

for the whole request.

Do not call current time repeatedly during one evaluation.

---

# 163. Timezone

Admin may configure:

```text
local time + timezone
```

Actual boundaries should be stored/compared using an unambiguous instant where possible.

---

# 164. Boundary-Time Testing

Test:

```text
start instant
end instant
23:59:59
00:00:00
timezone conversion
```

according to supported regions/timezones.

---

# 165. Clean Architecture Layout

```text
promotion-service/
│
├── domain/
│   ├── promotion/
│   ├── coupon/
│   ├── eligibility/
│   ├── discount/
│   ├── reservation/
│   ├── redemption/
│   ├── reconciliation/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── evaluate/
│   ├── publish/
│   ├── issue/
│   ├── reserve/
│   ├── redeem/
│   ├── release/
│   ├── query/
│   └── reconciliation/
│
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── catalog/
│   ├── customer/
│   ├── loyalty/
│   ├── redis/
│   └── kafka/
│
└── config/
```

Loyalty adapter may exist only as interface/stub until Phase 16.

---

# 166. Input Ports

Recommended:

```text
EvaluatePromotionsUseCase
ValidateCouponUseCase
PublishPromotionUseCase
IssueCouponUseCase
ReservePromotionUseCase
RedeemPromotionUseCase
ReleasePromotionUseCase
RevokeCouponUseCase
ListCustomerCouponsUseCase
ReconcilePromotionUseCase
```

---

# 167. Output Ports

Recommended:

```text
PromotionRepositoryPort
CouponRepositoryPort
PromotionQueryPort
UsageCounterPort
RedemptionPort
IdempotencyPort
OutboxPort
ProcessedEventPort
CatalogReferencePort
CustomerEligibilityPort
LoyaltyTierPort
ClockPort
CouponCodeGeneratorPort
AuditPort
PromotionCachePort
```

---

# 168. EvaluatePromotionsUseCase

```text
Validate context
      ↓
Load candidate promotions
      ↓
Filter status/time/store/channel
      ↓
Evaluate customer eligibility
      ↓
Evaluate item/category scope
      ↓
Calculate benefits
      ↓
Apply stacking policy
      ↓
Allocate discount
      ↓
Return deterministic result
```

No usage side effects.

---

# 169. ReservePromotionUseCase

```text
Validate context
      ↓
Claim idempotency
      ↓
Re-evaluate authoritative eligibility
      ↓
Lock scarce capacity
      ↓
Reserve usage/budget/coupon
      ↓
Create reservation
      ↓
Outbox
```

---

# 170. RedeemPromotionUseCase

```text
Load reservation
      ↓
Claim idempotency
      ↓
Lock reservation/counters
      ↓
Validate ACTIVE
      ↓
Move reserved → redeemed
      ↓
Write immutable redemption
      ↓
Update coupon state
      ↓
Outbox
```

---

# 171. ReleasePromotionUseCase

```text
Load reservation
      ↓
Claim idempotency
      ↓
Lock
      ↓
Return reserved capacity
      ↓
Mark RELEASED
      ↓
Outbox
```

---

# 172. IssueCouponUseCase

```text
Validate definition
      ↓
Deduplicate source
      ↓
Generate / normalize code
      ↓
Persist coupon
      ↓
Outbox
```

---

# 173. Coupon Code Generator

Use cryptographically secure random generation for private/high-value generated coupons.

Do not use predictable:

```text
incrementing integer
timestamp-only code
customer ID directly
```

---

# 174. Customer Coupon Query

Possible endpoint:

```text
GET /api/v1/promotions/coupons/me
```

Returns only coupons available/assigned to the authenticated customer.

---

# 175. Coupon Detail

Possible:

```text
GET /api/v1/promotions/coupons/{couponId}
```

Allowed to:

```text
assigned customer
or
privileged admin
```

---

# 176. Admin APIs

Possible:

```text
GET    /api/v1/admin/promotions
POST   /api/v1/admin/promotions
PATCH  /api/v1/admin/promotions/{id}
POST   /api/v1/admin/promotions/{id}/publish
POST   /api/v1/admin/promotions/{id}/activate
POST   /api/v1/admin/promotions/{id}/pause
GET    /api/v1/admin/promotions/{id}/usage
POST   /api/v1/admin/coupons/issue
POST   /api/v1/admin/coupons/{id}/revoke
```

---

# 177. Admin Permissions

Possible:

```text
promotion.read
promotion.manage
promotion.publish
promotion.activate
coupon.issue
coupon.revoke
promotion.reconcile
```

Separate editing from publishing high-impact changes.

---

# 178. High-Risk Changes

Changes to:

```text
discount percentage
fixed amount
budget
usage limit
stacking
```

may require:

```text
review
approval
audit
MFA
```

Decision:

```text
PROMOTION_APPROVAL_POLICY = TBD_SECURITY
```

---

# 179. Promotion Audit

Audit:

```text
promotion created
version published
promotion activated
promotion paused
budget changed
usage limit changed
coupon manually issued
coupon revoked
manual reconciliation repair
```

---

# 180. Data Classification

Likely:

```text
INTERNAL:
promotion rules
usage counters
campaign budgets

CONFIDENTIAL:
customer coupon assignments
redemption history
private high-value codes
```

Public-facing promotion content may be public.

---

# 181. Privacy

Use:

```text
customer_id
segment/tier projection
```

rather than storing full Customer profile data.

---

# 182. Coupon Logging

Do not log private coupon codes in full.

Prefer:

```text
coupon_id
masked code
hash
```

---

# 183. Rate Limiting

Protect:

```text
coupon validation
coupon brute-force attempts
coupon claim endpoints
coupon issue admin endpoints
```

Possible dimensions:

```text
IP
customer
device
coupon prefix/hash
```

---

# 184. Coupon Enumeration Protection

For high-value private coupons, avoid detailed responses that allow an attacker to distinguish:

```text
valid unused
valid assigned
invalid
```

when such distinction enables enumeration.

---

# 185. Abuse Monitoring

Monitor:

```text
invalid-code spike
same public code across many customers
rapid reserve/release loops
unexpected budget drain
high rejection rate
```

---

# 186. Fraud Relationship

Future fraud/risk systems may consume:

```text
CouponRedeemed
PromotionAbuseSignal
```

Promotion itself still enforces hard usage limits.

---

# 187. Metrics

Business:

```text
promotion_evaluation_total
promotion_applied_total
coupon_issued_total
coupon_reserved_total
coupon_redeemed_total
coupon_released_total
discount_amount_total
promotion_budget_used
```

Operational:

```text
promotion_evaluation_latency
coupon_validation_failure_total
usage_limit_reached_total
budget_exhausted_total
reservation_expiry_backlog
reconciliation_mismatch_total
DB lock/deadlock metrics
outbox backlog
```

---

# 188. SLIs

Potential:

```text
P95 evaluation latency
coupon validation availability
reservation success rate
redemption success rate
event publication lag
reconciliation health
```

Targets:

```text
TBD_SLO
```

---

# 189. Alerts

Alert on:

```text
unexpected discount spike
budget exhausted unexpectedly early
usage counter mismatch
coupon brute-force spike
reservation expiry backlog
redemption failure spike
outbox backlog
DB deadlock spike
```

---

# 190. Dashboard

Show:

```text
active promotions
evaluation volume
coupon issued/reserved/redeemed
discount amount
budget remaining
top rejection reasons
reservation backlog
reconciliation mismatches
lock/deadlock indicators
```

---

# 191. Structured Logging

Safe fields:

```text
promotion_id
promotion_code
promotion_version
coupon_id
customer_id where permitted
reference_id
operation
result
reason_code
request_id
correlation_id
```

Avoid full private coupon codes.

---

# 192. Tracing

Trace:

```text
Cart / Order
   ↓
Promotion Evaluate
   ↓
Candidate Lookup
   ↓
Rule Engine
   ↓
Reservation / PostgreSQL
   ↓
Outbox
```

Useful attributes:

```text
candidate_count
applied_count
result
```

---

# 193. Failure — Catalog Down

If live product/category metadata is required and no trusted local projection exists:

```text
authoritative evaluation fails safely
```

Do not guess product scope.

Cart preview may degrade according to Cart policy.

---

# 194. Failure — Loyalty Down

For tier-based promotions after Phase 16:

```text
use trusted projection
```

or fail that promotion's eligibility safely.

Never incorrectly grant a tier-only promotion.

---

# 195. Failure — Redis Down

Fallback to:

```text
PostgreSQL / read projection
```

Final reserve/redeem remains transactional.

---

# 196. Failure — Kafka Down

With outbox:

```text
transaction commits
event remains pending
publisher retries
```

---

# 197. Failure — Expiry Worker Down

Reservations can remain held too long.

Monitor:

```text
expired ACTIVE reservation count
oldest expired reservation age
```

Process backlog safely after recovery.

---

# 198. Wrong Discount Runbook

```text
pause promotion if needed
identify active promotion version
reproduce exact evaluation context
compare rule/version/stacking/rounding
identify affected orders
publish corrected version
never rewrite historical orders
```

---

# 199. Duplicate Redemption Runbook

```text
identify coupon/reference
inspect idempotency
inspect reservation/redemption history
inspect concurrent transactions
reconcile counters
restore customer value only through approved correction
add regression test
```

---

# 200. Budget Incident Runbook

```text
pause promotion
compare counters vs redemption history
reconcile budget
identify over-allocation
assess customer obligations
apply approved correction
```

---

# 201. Additional Runbooks

Required:

```text
Promotion DB unavailable
Reservation expiry backlog
Coupon brute-force attack
Usage counter mismatch
Outbox backlog
Legacy migration mismatch
```

---

# 202. Backup

Back up:

```text
promotions
versions
coupon definitions
coupons
usage counters
reservations
redemptions
reversals where used
reconciliation
idempotency/processed events as required
outbox
```

---

# 203. Restore

After restore:

```text
expire stale reservations
reconcile global usage
reconcile customer usage
reconcile coupon state
reconcile budget
repair/replay outbox safely
rebuild cache
```

---

# 204. Restore Risk

Old restore may:

```text
resurrect already-used coupon
lose redemption
restore consumed budget
duplicate coupon issuance
```

Therefore:

```text
idempotent replay
+
reconciliation
```

are mandatory.

---

# 205. Disaster Recovery

Define:

```text
RPO
RTO
promotion/coupon state recovery
event replay
usage reconciliation
budget reconciliation
cache rebuild
```

Decision:

```text
PROMOTION_RPO = TBD_DR
PROMOTION_RTO = TBD_DR
```

---

# 206. Flyway Migration Plan

Source example:

```text
V1__create_promotions.sql
V2__create_promotion_versions.sql
V3__create_promotion_conditions.sql
V4__create_promotion_benefits.sql
V5__create_promotion_scopes.sql
V6__create_coupon_definitions.sql
V7__create_coupons.sql
V8__create_usage_counters.sql
V9__create_coupon_reservations.sql
V10__create_promotion_redemptions.sql
V11__create_promotion_idempotency.sql
V12__create_processed_events.sql
V13__create_reconciliation_tables.sql
V14__create_outbox.sql
```

Add reversal tables in later migration if policy requires them.

---

# 207. Legacy Promotion Migration

Preserve where possible:

```text
promotion code
rule configuration
coupon code
customer assignment
validity
usage count
redemption history
store/channel scope
```

---

# 208. Legacy Coupon Migration Validation

Validate:

```text
duplicate codes
expired coupons
already-used coupons
customer ownership
usage counts
```

before cutover.

---

# 209. Legacy Rule Mapping

Create explicit mapping into canonical concepts:

```text
minimum spend
discount type
product scope
store scope
channel scope
usage limit
```

Do not blindly copy opaque legacy JSON.

---

# 210. Migration Reconciliation

Compare old vs new:

```text
active promotion count
coupon count
redeemed coupon count
remaining usage
discount totals
budget remaining
```

No unexplained differences at cutover.

---

# 211. Testing Strategy

Required categories:

```text
Domain
Rule Engine
Eligibility
Discount Math
Stacking
Coupon
Reservation
Redemption
Idempotency
Concurrency
Expiry
Events
Reconciliation
Migration
Load
Failure
Security
```

---

# 212. Promotion Domain Tests

Test:

```text
status transitions
time windows
publish validation
scope rules
usage-limit validation
budget validation
archive behavior
```

---

# 213. Discount Tests

Test:

```text
fixed amount
percentage
max cap
free delivery if enabled
price override if enabled
rounding
currency
minimum spend
payable never negative
```

---

# 214. Stacking Tests

Test:

```text
stackable + stackable
exclusive + any
best-only
priority tie
item + order discount
delivery + order discount
minimum-spend interaction
same promotion dedupe
```

---

# 215. Coupon Tests

Test:

```text
valid
expired
revoked
wrong customer
already used
normalization
single-use
multi-use
private code masking
```

---

# 216. Global Usage Concurrency Test

Example:

```text
remaining global use = 1
100 concurrent reservations
```

Expected:

```text
exactly 1 succeeds
```

---

# 217. Budget Concurrency Test

Example:

```text
remaining budget = 10
100 concurrent reservation requests
discount = 2 each
```

Expected:

```text
at most 5 succeed
budget never negative
```

---

# 218. Customer Limit Concurrency Test

Example:

```text
per-customer limit = 1
two devices reserve concurrently
```

Expected:

```text
only one successful reservation
```

---

# 219. Reservation Tests

Test:

```text
reserve
duplicate reserve
expiry
release
redeem
redeem after expiry
release after redeem
release twice
expiry worker twice
```

---

# 220. Idempotency Tests

For:

```text
IssueCoupon
ReservePromotion
RedeemPromotion
ReleasePromotion
```

test:

```text
same key + same request
same key + changed request
concurrent duplicate
lost response + retry
```

---

# 221. Unknown Outcome Test

Scenario:

```text
ReservePromotion commits
network response is lost
caller retries
```

Expected:

```text
same reservation result returned
no second usage/budget reservation
```

Repeat for Redeem and Release.

---

# 222. Rule Version Tests

Verify:

```text
old order keeps old promotion version
new checkout uses current published version
draft edit does not alter active version
publish creates new immutable version
```

---

# 223. Event Tests

Test enabled integrations:

```text
CouponIssued
CouponReserved
CouponRedeemed
CouponReleased
outbox retry
duplicate consumed event
OrderCancelled restoration policy
```

Loyalty reward event tests become active in Phase 16.

---

# 224. Reconciliation Tests

Create intentional:

```text
global counter mismatch
customer counter mismatch
budget mismatch
coupon status mismatch
reservation mismatch
```

Verify detection and controlled repair workflow.

---

# 225. Load Tests

Scenarios:

```text
high Cart evaluation traffic
checkout promotion evaluation
coupon campaign launch
hot public coupon
global usage contention
reservation expiry batch
```

---

# 226. Hot Coupon Test

Thousands of users apply one code.

Observe:

```text
coupon row contention
promotion counter contention
DB lock wait
evaluation cache effectiveness
reservation throughput
deadlocks
```

---

# 227. Failure Tests

Inject:

```text
DB deadlock
Redis unavailable
Kafka unavailable
Catalog timeout
expiry worker crash
Loyalty timeout after Phase 16
```

Verify documented behavior.

---

# 228. Security Tests

Verify:

```text
coupon brute-force rate limiting
wrong customer cannot use assigned coupon
client discount ignored
client cannot choose promotion version authoritatively
admin publish permission
coupon code leakage prevention
oversized/abusive validation requests rejected
```

---

# 229. Definition of Done — Promotion

- [ ] Promotion aggregate defined.
- [ ] Rule defined.
- [ ] Immutable versioning implemented.
- [ ] Scope implemented.
- [ ] Time window implemented.
- [ ] Discount math deterministic.
- [ ] Stacking deterministic.
- [ ] Usage limits protected.
- [ ] Budget limits protected if used.
- [ ] Tests pass.
- [ ] Audit exists.
- [ ] Metrics/tracing exist.

---

# 230. Definition of Done — Coupon

- [ ] Code strategy defined.
- [ ] Normalization defined.
- [ ] Code uniqueness enforced.
- [ ] Assignment rules implemented.
- [ ] Validity implemented.
- [ ] Usage limits implemented.
- [ ] Reservation implemented.
- [ ] Redemption implemented.
- [ ] Release/expiry implemented.
- [ ] Idempotency implemented.
- [ ] Security/rate limiting implemented.
- [ ] Tests pass.

---

# 231. Definition of Done — Checkout Integration

- [ ] Preview contract defined.
- [ ] Authoritative evaluation defined.
- [ ] Reservation contract defined.
- [ ] Redemption contract defined.
- [ ] Release/compensation defined.
- [ ] Query-by-reference recovery defined if required.
- [ ] Order promotion snapshot defined.
- [ ] Failure behavior defined.
- [ ] Distributed tracing works.

---

# 232. Promotion Review Checklist

## Ownership

- [ ] Promotion rules owned here.
- [ ] Catalog still owns base price.
- [ ] Ordering stores snapshots, not rules.
- [ ] Loyalty owns points/tier when Phase 16 is active.

## Eligibility

- [ ] Customer rules.
- [ ] Store rules.
- [ ] Channel rules.
- [ ] Product/category rules.
- [ ] Time rules.
- [ ] Minimum spend.
- [ ] Usage.
- [ ] Budget.

## Correctness

- [ ] Deterministic evaluation.
- [ ] Explicit stacking.
- [ ] Explicit rounding.
- [ ] Concurrency protection.
- [ ] Idempotency.
- [ ] Reconciliation.

---

# 233. Data Review Checklist

- [ ] Promotion code unique.
- [ ] Published versions immutable.
- [ ] Coupon code unique.
- [ ] Coupon normalization defined.
- [ ] Global counters exist.
- [ ] Customer counters exist.
- [ ] Reservations exist.
- [ ] Redemption history immutable.
- [ ] Idempotency exists.
- [ ] Processed events exist.
- [ ] Outbox exists.
- [ ] Reconciliation tables exist.
- [ ] Reversal model exists if restoration enabled.

---

# 234. Contract Review Checklist

- [ ] EvaluatePromotions.
- [ ] ValidateCoupon.
- [ ] ReservePromotion.
- [ ] RedeemPromotion.
- [ ] ReleasePromotion.
- [ ] Customer coupon query.
- [ ] Admin APIs.
- [ ] Error catalog.
- [ ] Idempotency semantics.
- [ ] Timeout/deadline behavior.
- [ ] Query-by-reference behavior.
- [ ] Event schemas.
- [ ] Order snapshot contract.

---

# 235. Security Review Checklist

- [ ] Assigned-coupon ownership enforced.
- [ ] High-value codes unpredictable.
- [ ] Validation rate-limited.
- [ ] Enumeration protected.
- [ ] Coupon codes masked in logs.
- [ ] Client discounts ignored.
- [ ] Client promotion version not trusted.
- [ ] Admin operations authorized.
- [ ] Publish audited.
- [ ] Sensitive backup protected.

---

# 236. Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Expiry monitoring.
- [ ] Global/customer counter reconciliation.
- [ ] Budget reconciliation.
- [ ] Cache rebuild procedure.
- [ ] Outbox monitoring.
- [ ] Backup/restore.
- [ ] Runbooks.
- [ ] Deadlock/lock-wait monitoring.

---

# 237. Production Readiness Checklist

Before production:

- [ ] Discount math tests pass.
- [ ] Rounding rule frozen.
- [ ] Minimum-spend basis frozen.
- [ ] Stacking order frozen.
- [ ] Tie-breaker frozen.
- [ ] Global usage concurrency test passes.
- [ ] Customer limit concurrency test passes.
- [ ] Budget concurrency test passes.
- [ ] Coupon brute-force protections tested.
- [ ] Reservation expiry tested.
- [ ] Redemption idempotency tested.
- [ ] Unknown-outcome retry tested.
- [ ] Restoration policy tested.
- [ ] Reconciliation tested.
- [ ] Backup/restore tested.
- [ ] Event replay tested.
- [ ] Load/hot-coupon test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Required TBD decisions resolved.

---

# 238. Recommended Implementation Sequence

Follow the source order, adjusted only for this roadmap's later Loyalty phase:

```text
Step 1
Implement Promotion aggregate

Step 2
Implement immutable Promotion Versioning

Step 3
Implement Fixed Amount Discount

Step 4
Implement Percentage Discount

Step 5
Implement Store / Channel / Product scope

Step 6
Implement Minimum Spend

Step 7
Implement EvaluatePromotions

Step 8
Implement Coupon Definition

Step 9
Implement Coupon Issuance

Step 10
Implement Coupon Validation

Step 11
Implement Global / Customer / Coupon Usage Counters

Step 12
Implement Promotion Reservation

Step 13
Implement Redemption

Step 14
Implement Release / Expiry

Step 15
Implement Per-Customer Limits

Step 16
Implement Global Limits

Step 17
Implement Budget Limits

Step 18
Implement Stacking / Priority / Allocation

Step 19
Implement Transactional Outbox

Step 20
Implement Reconciliation

Step 21
Implement Admin Tooling / RBAC / Audit

Step 22
Implement Redis Candidate Cache

Step 23
Implement Ordering Checkout Contracts

Step 24
Implement Legacy Migration if required

Step 25
Complete Tests / Load / Failure / Security

Step 26
Complete Observability / Runbooks

Step 27
Production Readiness Review

Step 28
Handoff to Phase 10 Ordering

Later at Phase 16:
Activate Loyalty tier/reward → coupon integrations
```

---

# 239. Step 1 — Bootstrap Acceptance

Verify:

```text
service starts
health endpoint works
promotion_db connects
Flyway runs
security loads
REST/gRPC adapters start
PostgreSQL Testcontainer works
Redis optional dependency works
Docker image builds
architecture tests pass
```

---

# 240. Step 2 — Promotion Aggregate Acceptance

Verify:

```text
create DRAFT
unique promotion_code
valid state transitions
invalid transitions rejected
time window validated
invalid usage limits rejected
ARCHIVED cannot newly redeem
```

---

# 241. Step 3 — Versioning Acceptance

Verify:

```text
draft editable
publish creates immutable version 1
draft changes do not change v1
publish new changes creates v2
current pointer changes atomically
old order remains tied to v1
```

---

# 242. Step 4 — Discount Acceptance

Verify:

```text
fixed amount exact
percentage exact
max discount cap
payable never negative
rounding deterministic
currency validated
minimum spend applied consistently
```

---

# 243. Step 5 — Scope Acceptance

Verify:

```text
correct store
wrong store rejected
correct channel
wrong channel rejected
included product
excluded product
category behavior
time behavior
```

---

# 244. Step 6 — EvaluatePromotions Acceptance

Verify:

```text
evaluation is side-effect free
same inputs produce same result
one evaluation timestamp used
stable reason codes returned
candidate pre-filter works
no usage counters changed
```

---

# 245. Step 7 — Coupon Issuance Acceptance

Verify:

```text
static/generated strategy as enabled
normalization works
unique code enforced
customer assignment works
source reference stored
duplicate source does not issue twice
high-value code generation secure
```

---

# 246. Step 8 — Coupon Validation Acceptance

Verify:

```text
valid
expired
revoked
disabled
wrong customer
already used
usage limit reached
customer limit reached
budget exhausted
minimum spend failure
```

No final usage consumed.

---

# 247. Step 9 — Usage Counter Acceptance

Verify:

```text
global reserved/redeemed
customer reserved/redeemed
coupon reserved/redeemed
invariants hold
transactional updates
rebuild/reconciliation possible
```

---

# 248. Step 10 — Reservation Acceptance

Verify:

```text
eligible reserve succeeds
usage reserved exactly once
budget reserved exactly once
coupon capacity reserved exactly once
same reference retry idempotent
same key changed request conflicts
reservation TTL stored
outbox written
```

---

# 249. Step 11 — Global Concurrency Acceptance

Run:

```text
1 remaining slot
100 concurrent reserves
```

Verify:

```text
exactly one success
```

---

# 250. Step 12 — Customer Concurrency Acceptance

Run:

```text
customer limit 1
multiple concurrent devices
```

Verify:

```text
exactly one successful reservation
```

---

# 251. Step 13 — Budget Concurrency Acceptance

Run a contention test against the last remaining budget.

Verify:

```text
budget_reserved + budget_redeemed <= budget_total
```

always.

---

# 252. Step 14 — Redemption Acceptance

Verify:

```text
ACTIVE reservation redeems
reserved capacity becomes final redeemed
immutable redemption inserted
coupon status updated correctly
repeat command no-op/same result
outbox written
```

---

# 253. Step 15 — Release Acceptance

Verify:

```text
ACTIVE reservation releases
all reserved capacities returned once
repeat release safe
release after redeemed rejected/no-op by contract
outbox written
```

---

# 254. Step 16 — Expiry Acceptance

Verify:

```text
expired ACTIVE reservations found
capacity released
EXPIRED state written
duplicate worker safe
backlog observable
```

---

# 255. Step 17 — Stacking Acceptance

Verify:

```text
STACKABLE
EXCLUSIVE
BEST_ONLY
tie-breaker
group behavior
same-promotion dedupe
order of discount calculation
```

---

# 256. Step 18 — Allocation Acceptance

Verify:

```text
order-level discount allocates to eligible lines
allocation sums exactly to total discount
rounding remainder deterministic
refund-ready allocation available to Ordering
```

---

# 257. Step 19 — Checkout Contract Acceptance

Verify Ordering can:

```text
Evaluate
Reserve
Query reservation/result by reference if required
Redeem
Release
```

with:

```text
stable idempotency
stable errors
trace propagation
no direct promotion DB access
```

---

# 258. Step 20 — Reconciliation Acceptance

Verify detection of:

```text
global count mismatch
customer count mismatch
coupon count mismatch
budget mismatch
reservation mismatch
status/history mismatch
```

No silent repair.

---

# 259. Step 21 — Admin Acceptance

Verify:

```text
manage vs publish permissions separated
high-risk changes audited
manual coupon issue audited
revoke audited
usage view works
reconciliation permission protected
```

---

# 260. Step 22 — Cache Acceptance

If Redis enabled:

```text
candidate lookup cache works
version cache works
publish invalidates
pause invalidates
Redis down falls back
reserve/redeem never rely on stale cache counters
```

---

# 261. Step 23 — Failure Acceptance

Exercise:

```text
Catalog timeout
PostgreSQL timeout
deadlock
Redis outage
Kafka outage
expiry worker outage
lost response after reserve commit
lost response after redeem commit
```

Verify safe and documented behavior.

---

# 262. Step 24 — Restore Acceptance

Verify:

```text
stale reservations expired
coupon state reconciled
global counters reconciled
customer counters reconciled
budget reconciled
outbox repaired/replayed safely
cache rebuilt
no duplicate issuance/redemption
```

---

# 263. Recommended Phase 9 Work Breakdown

Suggested tickets:

```text
PROMO-001 Bootstrap promotion-service
PROMO-002 Create promotion_db / Flyway baseline
PROMO-003 Implement Promotion aggregate
PROMO-004 Implement PromotionStatus lifecycle
PROMO-005 Implement PromotionCode
PROMO-006 Implement immutable PromotionVersion
PROMO-007 Implement publish transaction
PROMO-008 Implement fixed amount discount
PROMO-009 Implement percentage discount
PROMO-010 Implement max discount
PROMO-011 Implement minimum-spend rule
PROMO-012 Implement store scope
PROMO-013 Implement channel scope
PROMO-014 Implement product/category scope
PROMO-015 Implement rule engine
PROMO-016 Implement EvaluatePromotions
PROMO-017 Implement deterministic evaluation time
PROMO-018 Implement coupon definition
PROMO-019 Implement Coupon aggregate/status
PROMO-020 Implement coupon normalization
PROMO-021 Implement secure code generator
PROMO-022 Implement coupon issuance
PROMO-023 Implement issuance idempotency
PROMO-024 Implement customer assignment
PROMO-025 Implement coupon validation
PROMO-026 Implement global usage counters
PROMO-027 Implement customer usage counters
PROMO-028 Implement coupon usage counters
PROMO-029 Implement ReservePromotion
PROMO-030 Implement reservation idempotency
PROMO-031 Implement reservation expiry worker
PROMO-032 Implement RedeemPromotion
PROMO-033 Implement redemption history
PROMO-034 Implement ReleasePromotion
PROMO-035 Implement budget counters
PROMO-036 Implement atomic budget reservation
PROMO-037 Implement stacking policies
PROMO-038 Implement BEST_ONLY tie-breaker
PROMO-039 Implement discount allocation
PROMO-040 Implement rounding remainder
PROMO-041 Implement transactional outbox
PROMO-042 Implement events
PROMO-043 Implement query-by-reference recovery
PROMO-044 Implement cancellation restoration model
PROMO-045 Implement reconciliation
PROMO-046 Implement reconciliation mismatch workflow
PROMO-047 Implement Redis candidate cache
PROMO-048 Implement customer coupon API
PROMO-049 Implement admin APIs
PROMO-050 Implement admin RBAC
PROMO-051 Implement audit
PROMO-052 Implement coupon rate limiting
PROMO-053 Implement enumeration protection
PROMO-054 Implement domain/rule tests
PROMO-055 Implement discount tests
PROMO-056 Implement stacking tests
PROMO-057 Implement coupon tests
PROMO-058 Implement global concurrency test
PROMO-059 Implement customer concurrency test
PROMO-060 Implement budget concurrency test
PROMO-061 Implement idempotency/unknown-outcome tests
PROMO-062 Implement expiry tests
PROMO-063 Implement event/outbox tests
PROMO-064 Implement reconciliation tests
PROMO-065 Implement security tests
PROMO-066 Implement load/hot-coupon tests
PROMO-067 Implement failure tests
PROMO-068 Implement metrics/traces/logs
PROMO-069 Implement dashboard/alerts
PROMO-070 Write runbooks
PROMO-071 Backup/restore/reconciliation drill
PROMO-072 Legacy migration if required
PROMO-073 Complete ADRs/policy freeze
PROMO-074 Phase 9 exit review
```

---

# 264. Minimum Viable Promotion Service

Source-defined first production-capable version:

```text
Promotion definition
Immutable versioning
Fixed amount discount
Percentage discount
Store/channel/product scope
Minimum spend
Coupon issuance
Coupon validation
Single-use/multi-use limits
Per-customer limit
Reservation
Redemption
Release
Idempotency
Order snapshot contract
Outbox
Reconciliation
```

Do not postpone:

```text
usage concurrency
idempotency
discount determinism
reservation/release
reconciliation
```

---

# 265. Recommended Initial Scope

Required for Phase 09:

```text
Promotion aggregate
Immutable versioning
Fixed discount
Percentage discount
Store/channel/product/category scope as needed
Minimum spend
Coupon definition
Coupon issuance
Coupon validation
Global usage limit
Per-customer usage limit
Coupon usage limit
Reservation
Redemption
Release / expiry
Idempotency
Deterministic stacking for supported combinations
Discount allocation
Outbox
Reconciliation
Admin RBAC/audit
Ordering integration contracts
Observability
```

Conditional:

```text
Budget limits
Free delivery
Price override
Redis cache
Legacy migration
Public customer coupon listing
```

Deferred unless required:

```text
Buy-X-Get-Y
Free item
Bonus points execution
Dynamic segment engine
Personalized offers
Partner marketplace
Advanced optimization
```

---

# 266. Phase 9 ADRs

Recommended:

```text
ADR-PROMO-001 Promotion versioning model
ADR-PROMO-002 Initial promotion types
ADR-PROMO-003 Rule engine strategy
ADR-PROMO-004 Coupon code generation/normalization
ADR-PROMO-005 Coupon assignment model
ADR-PROMO-006 Usage concurrency strategy
ADR-PROMO-007 Budget concurrency strategy
ADR-PROMO-008 Reservation TTL
ADR-PROMO-009 Stacking order
ADR-PROMO-010 BEST_ONLY tie-breaker
ADR-PROMO-011 Discount allocation/rounding
ADR-PROMO-012 Minimum-spend basis
ADR-PROMO-013 Cancellation/refund restoration
ADR-PROMO-014 Redis cache scope
ADR-PROMO-015 Loyalty integration staging
ADR-PROMO-016 Internal REST/gRPC contracts
```

---

# 267. Phase 9 Policy Freeze Checklist

Before production resolve:

- [ ] Promotion ID strategy.
- [ ] Promotion code format.
- [ ] Initial promotion types.
- [ ] Promotion publish lifecycle.
- [ ] Schedule/timezone semantics.
- [ ] Supported currencies.
- [ ] Money precision.
- [ ] Rounding policy.
- [ ] Minimum-spend basis.
- [ ] Maximum discount behavior.
- [ ] Product/category scope semantics.
- [ ] Include/exclude precedence.
- [ ] Customer eligibility sources.
- [ ] Coupon code strategies.
- [ ] Code alphabet/length/entropy.
- [ ] Normalization/case sensitivity.
- [ ] Customer assignment rules.
- [ ] Single/multi-use behavior.
- [ ] Global limit behavior.
- [ ] Per-customer limit behavior.
- [ ] Budget scope if enabled.
- [ ] Reservation uniqueness.
- [ ] Reservation TTL.
- [ ] Stacking policies.
- [ ] Stacking calculation order.
- [ ] BEST_ONLY tie-breaker.
- [ ] Discount base for stacking.
- [ ] Allocation formula.
- [ ] Rounding remainder rule.
- [ ] Cancellation restoration policy.
- [ ] Refund restoration policy.
- [ ] Admin permissions.
- [ ] Approval/MFA policy.
- [ ] Validation rate limits.
- [ ] Coupon enumeration policy.
- [ ] Cache TTLs if used.
- [ ] Reconciliation schedule.
- [ ] Legacy migration scope.
- [ ] SLO targets.
- [ ] Alert thresholds.
- [ ] RPO/RTO.

---

# 268. Phase 9 Completion Tree

```text
PHASE 09 — PROMOTION / COUPON

├── Service Foundation                         ✅
│   ├── Spring Boot
│   ├── PostgreSQL
│   ├── Flyway
│   ├── REST/gRPC
│   └── Security
│
├── Promotion Domain                           ✅
│   ├── Promotion
│   ├── Status
│   ├── Code
│   ├── Rules
│   ├── Benefits
│   └── Scope
│
├── Versioning / Publish                       ✅
│   ├── Draft
│   ├── Validate
│   ├── Immutable Version
│   └── Active Version
│
├── Discount Engine                            ✅
│   ├── Fixed
│   ├── Percentage
│   ├── Caps
│   ├── Minimum Spend
│   ├── Deterministic Rounding
│   └── Allocation
│
├── Coupon Domain                              ✅
│   ├── Definition
│   ├── Instance
│   ├── Assignment
│   ├── Code Security
│   └── Lifecycle
│
├── Usage / Budget                             ✅
│   ├── Global
│   ├── Customer
│   ├── Coupon
│   └── Budget if enabled
│
├── Reservation                                ✅
│   ├── Idempotency
│   ├── Expiry
│   └── Concurrency
│
├── Redemption                                 ✅
├── Release / Compensation                     ✅
├── Stacking                                   ✅
├── Order Snapshot Contract                    ✅
├── Reconciliation                             ✅
├── Outbox / Events                            ✅
├── Security / Abuse Protection                ✅
├── Cache                                      ✅ / Conditional
├── Testing                                    ✅
├── Observability                              ✅
├── Backup / Restore                           ✅
├── Runbooks                                   ✅
└── ADR / Policy Freeze                        ✅
```

---

# 269. Exit Criteria — Ownership

The team can explain:

```text
Promotion vs Catalog
Promotion vs Ordering
Promotion vs Customer
Promotion vs Loyalty
```

with no cross-service DB ownership confusion.

---

# 270. Exit Criteria — Eligibility

The team can prove how eligibility is determined for:

```text
customer
store
channel
product/category
time
minimum spend
usage
budget
coupon ownership
```

---

# 271. Exit Criteria — Discount

The team can reproduce a discount calculation using:

```text
promotion version
input context
evaluation timestamp
rounding policy
stacking order
```

and receive the same result.

---

# 272. Exit Criteria — Coupon Lifecycle

The team can demonstrate:

```text
issue
validate
reserve
redeem
release
expire
revoke
```

with stable state transitions and history.

---

# 273. Exit Criteria — Concurrency

The team can prove:

```text
last global use
last customer use
last coupon use
last budget amount
```

cannot be over-allocated under concurrency.

---

# 274. Exit Criteria — Stacking

The team can answer:

```text
Which promotions can combine?
In what exact order?
On what discount base?
How are ties resolved?
How is remainder allocated?
```

---

# 275. Exit Criteria — Idempotency

The team can prove retries do not duplicate:

```text
coupon issuance
usage reservation
budget reservation
redemption
release
```

including lost-response scenarios.

---

# 276. Exit Criteria — Order History

Ordering receives enough data to preserve:

```text
promotion ID
promotion code
promotion version
coupon reference/code if allowed
discount type
discount amount
line allocation
```

without later querying mutable promotion state to explain an old order.

---

# 277. Exit Criteria — Reconciliation

The team can verify:

```text
reservations vs reserved counters
redemptions vs redeemed counters
customer history vs customer counters
coupon history vs coupon state
discount history vs budget counters
```

---

# 278. Exit Criteria — Recovery

The team can explain:

```text
event replay
old DB restore
stale reservation expiry
counter reconstruction
cancellation restoration
refund restoration
outbox recovery
```

without creating duplicate value.

---

# 279. Exit Criteria — Security

The team can prove:

```text
assigned coupon ownership
private-code unpredictability
validation rate limiting
enumeration resistance
masked logs
admin RBAC
audit
client discount rejection
```

---

# 280. Exit Criteria — Operations

Operators can detect:

```text
wrong discount
budget drain
counter mismatch
brute-force spike
reservation backlog
duplicate redemption symptom
DB deadlock
outbox backlog
```

and have runbooks for response.

---

# 281. Handoff to Phase 10

After Promotion / Coupon is complete, move to:

```text
PHASE 10 — Ordering Service
```

Ordering will integrate:

```text
Cart
Catalog
Inventory
Promotion
Payment
Wallet
```

over time.

At Phase 10, Promotion's responsibility is to provide:

```text
authoritative promotion evaluation
usage/coupon reservation
redemption
release/compensation
promotion snapshot data
```

Ordering must not:

```text
reimplement promotion rules
modify promotion_db
trust Cart preview as final
trust client discount values
```

The important checkout transition becomes:

```text
Cart Preview
    ↓
Ordering Revalidation
    ↓
Promotion Reserve
    ↓
Inventory Reserve
    ↓
Order Creation
    ↓
Promotion Redeem
```

The final exact Saga ordering will be formalized in:

```text
Phase 14 — Distributed Transactions / Saga
```

so Phase 10 should keep participant commands idempotent and recoverable by stable reference.

---

# 282. Final Phase 9 Principle

The central lifecycle is:

```text
DRAFT
  ↓
PUBLISH IMMUTABLE VERSION
  ↓
ACTIVATE
  ↓
EVALUATE
  ↓
RESERVE
  ├── RED EEM → final discount usage
  └── RELEASE / EXPIRE → capacity returned
```

Corrected spelling of final transition:

```text
RESERVE
  ├── REDEEM → final discount usage
  └── RELEASE / EXPIRE → capacity returned
```

The most important implementation rules are:

```text
Promotion owns discount logic.
Catalog owns base price.
Preview is side-effect free.
Published versions are immutable.
Reservation protects scarce capacity.
Global/customer/coupon limits are atomic.
Budget reservation is atomic.
Redemption is idempotent.
Release is idempotent.
Stacking is deterministic.
Discount rounding/allocation is deterministic.
Order stores immutable promotion snapshots.
Counters reconcile against immutable history.
Client discount values are never trusted.
Redis is not authoritative for usage/budget.
```

---

**End of PHASE 09 — Promotion / Coupon Service**
