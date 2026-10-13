---
title: "PART 17 — PROMOTION / COUPON SERVICE"
---

# PART 17 — PROMOTION / COUPON SERVICE

> **Document Role:** Defines the complete architecture, domain model, promotion-rule model, coupon lifecycle, eligibility evaluation, discount calculation, reservation/redemption, concurrency, idempotency, reconciliation, testing strategy, and production standards for the Promotion / Coupon Service.  
> **Previous Part:** PART 16 — Loyalty Service  
> **Next Part:** PART 18 — Mission Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, promotion engineers, product engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 2646 — Purpose

The Promotion / Coupon Service owns transaction-time discount and offer eligibility.

It answers:

```text
Which promotions are active?
Which coupon belongs to which customer?
Is a coupon currently valid?
Is the customer eligible?
Does the cart/order meet the promotion conditions?
How much discount should be applied?
Can the coupon be reserved?
Can the coupon be redeemed?
Has the coupon already been used?
Has the promotion reached its usage limit?
Can multiple promotions be combined?
```

Promotion logic is evaluated at checkout time.

Loyalty may grant a coupon or reward, but Promotion owns:

```text
discount eligibility
coupon lifecycle
redemption rules
usage limits
promotion stacking
discount calculation
```

---

# 2647 — Promotion Service Responsibilities

Promotion Service owns:

```text
Promotion Definition
Promotion Rule
Promotion Version
Coupon Definition
Coupon Code
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
Store / Channel Scope
Product / Category Scope
Time Window
Promotion Events
Promotion Reconciliation
```

Possible future responsibilities:

```text
Voucher marketplace
Referral coupons
Partner coupons
Dynamic offers
Segment-based promotions
Personalized discounts
Buy-X-Get-Y
Bundle offers
Free shipping
Tier-exclusive offers
```

---

# 2648 — Non-Responsibilities

Promotion Service does not own:

```text
Order lifecycle
Product master
Catalog base price
Wallet balance
Loyalty point balance
Mission progress
Customer profile master
Inventory stock
Payment provider state
```

It may consume:

```text
customer_id
store_id
product_id
category_id
cart/order amounts
loyalty tier
campaign assignment
```

through contracts or projections.

---

# 2649 — Promotion Boundary

High-level:

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

External dependencies may include:

```text
Catalog
Customer
Loyalty
Store/Location
```

but Promotion remains the owner of discount/coupon state.

---

# 2650 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Promotion | Offer configuration that may produce a discount/benefit |
| Coupon | Redeemable code or assigned entitlement |
| Eligibility | Whether a customer/cart/order satisfies conditions |
| Discount | Monetary reduction produced by a promotion |
| Promotion Rule | Condition + benefit logic |
| Promotion Version | Immutable published revision of a promotion |
| Reservation | Temporary hold on coupon/usage capacity during checkout |
| Redemption | Final consumption of coupon/promotion entitlement |
| Release | Cancellation of a prior reservation |
| Usage Limit | Constraint on how many times promotion/coupon may be used |
| Stack | Apply multiple promotions together |
| Exclusive Promotion | Promotion that cannot combine with others |
| Scope | Products, categories, stores, channels, customers, or time periods affected |

---

# 2651 — Promotion Aggregate

Possible aggregate root:

```text
Promotion
```

State:

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
version
created_at
updated_at
```

---

# 2652 — Promotion Status

Recommended:

```text
DRAFT
SCHEDULED
ACTIVE
PAUSED
EXPIRED
ARCHIVED
```

Meaning:

```text
DRAFT     → editable, not eligible
SCHEDULED → configured for future activation
ACTIVE    → may apply
PAUSED    → temporarily disabled
EXPIRED   → time window finished
ARCHIVED  → historical
```

---

# 2653 — Promotion State Transitions

Example:

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

# 2654 — Promotion Invariants

Examples:

```text
promotion_code is unique
starts_at <= ends_at
discount cannot make payable amount negative
usage limits cannot be negative
per-customer limit cannot exceed global limit if both exist
active promotion must have valid rule configuration
archived promotion cannot be newly redeemed
```

---

# 2655 — Promotion Code

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

Once published, avoid changing the code.

---

# 2656 — Promotion Types

Possible canonical types:

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

Do not implement all types initially.

Start with business-required types.

---

# 2657 — Coupon Definition vs Coupon Instance

Separate:

```text
Coupon Definition
```

from:

```text
Coupon Instance / Assignment
```

Definition describes:

```text
rules
benefit
validity
usage policy
```

Instance describes:

```text
specific code
owner
status
usage
expiry
```

---

# 2658 — Coupon Definition

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

# 2659 — Coupon Instance

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
```

---

# 2660 — Coupon Status

Recommended:

```text
ISSUED
ACTIVE
RESERVED
REDEEMED
EXPIRED
REVOKED
DISABLED
```

If reusable coupon:

```text
ACTIVE
```

may remain after redemption until usage limit reached.

---

# 2661 — Coupon Code Strategy

Possible:

```text
STATIC
GENERATED_UNIQUE
CUSTOMER_SPECIFIC
BATCH_IMPORT
```

Examples:

```text
WELCOME20
AB12CD34EF
```

Generated codes should be sufficiently unpredictable if possession grants value.

---

# 2662 — Coupon Code Normalization

Define:

```text
trim
uppercase
allowed characters
case sensitivity
```

Example:

```text
" welcome20 "
→
"WELCOME20"
```

Normalize before lookup/uniqueness.

---

# 2663 — Coupon Code Security

For high-value coupons:

```text
longer random codes
rate-limited validation
customer assignment
usage controls
```

Avoid easily enumerable sequential codes.

---

# 2664 — Coupon Issuance

Coupon may be issued by:

```text
Promotion admin
Loyalty reward
Mission reward
Registration
Referral
Partner campaign
Import
```

Each issuance needs:

```text
source_type
source_reference
```

---

# 2665 — Issuance Idempotency

Same source reward/mission must not issue duplicate coupon.

Unique candidate:

```text
(source_type, source_reference, coupon_definition_id, customer_id)
```

---

# 2666 — Customer-Assigned Coupon

Coupon may be bound to:

```text
customer_id
```

Then redemption requires:

```text
authenticated customer == assigned customer
```

---

# 2667 — Public Coupon

Coupon may be shared:

```text
WELCOME20
```

No customer assignment.

Usage limits and eligibility still apply.

---

# 2668 — Single-Use Coupon

Example:

```text
usage_limit = 1
```

After redemption:

```text
REDEEMED
```

---

# 2669 — Multi-Use Coupon

Example:

```text
per_coupon_usage_limit = 10
```

Coupon stays active until:

```text
usage_count >= limit
```

---

# 2670 — Per-Customer Usage Limit

Promotion may allow:

```text
1 use per customer
```

even if coupon code is public.

Track usage by:

```text
promotion_id + customer_id
```

---

# 2671 — Global Usage Limit

Promotion may have:

```text
global_usage_limit
```

Example:

```text
first 10,000 orders
```

Concurrency must prevent exceeding the limit.

---

# 2672 — Budget Limit

Promotion may have:

```text
discount_budget
```

Example:

```text
maximum total discount = $10,000
```

Need atomic budget reservation/redemption.

---

# 2673 — Usage Limit vs Budget Limit

Usage:

```text
number of redemptions
```

Budget:

```text
total discount value
```

They are different constraints.

---

# 2674 — Promotion Scope

Possible scope dimensions:

```text
customer
segment
tier
store
channel
fulfillment type
product
category
payment method
currency
time
minimum spend
maximum spend
```

---

# 2675 — Store Scope

Possible:

```text
all stores
included stores
excluded stores
store group
region
```

Store IDs are logical references.

---

# 2676 — Channel Scope

Examples:

```text
APP
WEB
PICKUP
DELIVERY
DINE_IN
PARTNER
```

Do not infer channel from unrelated fields.

---

# 2677 — Product Scope

Possible:

```text
all products
specific products
specific categories
exclude products
exclude categories
```

---

# 2678 — Category Scope

Promotion may apply to:

```text
Coffee category only
Food only
Selected seasonal category
```

Catalog remains source of product/category definition.

---

# 2679 — Customer Scope

Possible:

```text
all customers
new customers
specific customer IDs
segment
tier
member type
journey eligibility
```

---

# 2680 — New Customer Rule

Define precisely:

```text
registration date
first order
first paid order
no prior redemption
```

Avoid vague "new user" semantics.

---

# 2681 — Tier Eligibility

Promotion may require:

```text
GOLD
PLATINUM
```

Consume tier projection/contract from Loyalty.

Do not query Loyalty DB.

---

# 2682 — Minimum Spend

Example:

```text
subtotal >= 10.00 USD
```

Define whether minimum spend uses:

```text
before promotion
after item-level discounts
excluding fees
including taxes
```

---

# 2683 — Maximum Discount

Percentage promotion should support:

```text
max_discount_amount
```

Example:

```text
20% off, maximum $5
```

---

# 2684 — Fixed Discount

Example:

```text
$2 off
```

Final discount:

```text
min(2, eligible_amount)
```

Do not make payable amount negative.

---

# 2685 — Percentage Discount

Formula:

```text
discount
=
eligible_amount
*
percentage
```

then apply:

```text
rounding
max_discount
```

---

# 2686 — Free Delivery

Benefit:

```text
delivery_fee_discount
=
min(delivery_fee, configured_cap)
```

Do not alter product subtotal.

---

# 2687 — Price Override

Example:

```text
Latte = $1.50
```

This must define:

```text
eligible product
quantity limit
original price source
override priority
```

---

# 2688 — Buy-X-Get-Y

Example:

```text
Buy 2 Coffee
Get 1 Coffee Free
```

Need explicit:

```text
qualifying items
reward items
quantity thresholds
cheapest/selected item behavior
maximum repeats
```

This is more complex than fixed/percentage discount.

---

# 2689 — Free Item Benefit

May produce:

```text
discount line
```

rather than automatically inserting product into cart.

UX/business decides.

---

# 2690 — Bonus Points Promotion

Promotion may produce:

```text
bonus points
```

but Loyalty should own actual points credit.

Promotion outputs an entitlement/result.

Loyalty applies the points ledger effect.

---

# 2691 — Promotion Rule Model

Possible:

```text
conditions
+
benefits
+
priority
+
stacking policy
```

---

# 2692 — Rule Condition Types

Examples:

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

# 2693 — Benefit Types

Examples:

```text
PERCENT_OFF
AMOUNT_OFF
FREE_DELIVERY
FREE_ITEM
PRICE_OVERRIDE
BONUS_POINTS
```

---

# 2694 — Rule Engine Complexity

Start with typed Java rule implementations.

Avoid a fully dynamic expression language until real business requirements justify it.

Reason:

```text
debugging
security
testability
versioning
```

---

# 2695 — Rule Configuration

Example:

```json
{
  "minimum_spend": "10.00",
  "percentage": "20",
  "max_discount": "5.00",
  "currency": "USD"
}
```

Validate before activation.

---

# 2696 — Rule Versioning

Published rule changes should create:

```text
promotion_version + 1
```

instead of silently changing historical behavior.

---

# 2697 — Promotion Version

Possible:

```text
promotion_versions
```

Fields:

```text
promotion_id
version
configuration_json
starts_at
ends_at
published_at
published_by
```

Historical orders store applied version.

---

# 2698 — Draft vs Published Promotion

Recommended lifecycle:

```text
Draft
  ↓
Validate
  ↓
Publish Version
  ↓
Activate/Schedule
```

Customer evaluation uses:

```text
published version
```

not partially edited draft.

---

# 2699 — Promotion Validation Before Publish

Validate:

```text
time window
discount values
usage limits
budget
scope references
stacking rules
currency
rule schema
coupon strategy
```

---

# 2700 — Atomic Publish

Promotion publication should avoid mixed configuration.

Possible:

```text
immutable version row
+
active_version_id pointer
```

---

# 2701 — Promotion Evaluation Context

Input may include:

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
timestamp
loyalty_tier optional
```

---

# 2702 — Evaluation Result

Possible:

```json
{
  "eligible": true,
  "applied_promotions": [
    {
      "promotion_id": "PR001",
      "promotion_code": "WELCOME_20_OFF",
      "version": 3,
      "discount_amount": "2.00"
    }
  ],
  "total_discount": "2.00",
  "currency": "USD"
}
```

---

# 2703 — Evaluation Is Pure Where Possible

Promotion calculation should ideally be:

```text
deterministic
side-effect free
```

Reservation/redemption are separate state-changing steps.

---

# 2704 — Preview vs Final Validation

Cart:

```text
promotion preview
```

Order checkout:

```text
authoritative promotion validation
```

Preview may become stale.

---

# 2705 — Coupon Apply Preview

Example:

```text
POST /api/v1/promotions/evaluate
```

Input:

```text
cart context + coupon code
```

Output:

```text
eligibility
discount
reason if invalid
```

No redemption yet.

---

# 2706 — Coupon Reservation

To prevent race on single-use/limited coupon:

```text
reserve during checkout
```

Possible state:

```text
ACTIVE → RESERVED
```

or separate reservation entity.

---

# 2707 — Coupon Reservation Entity

Possible fields:

```text
reservation_id
coupon_id
promotion_id
customer_id
reference_type
reference_id
discount_amount
status
expires_at
created_at
```

---

# 2708 — Reservation Status

Possible:

```text
ACTIVE
REDEEMED
RELEASED
EXPIRED
```

---

# 2709 — Reserve Coupon Flow

```text
Validate coupon
      ↓
Validate promotion
      ↓
Validate customer/cart context
      ↓
Check usage/budget
      ↓
Lock usage counters/coupon
      ↓
Create reservation
      ↓
Reserve usage/budget
      ↓
Return discount snapshot
```

---

# 2710 — Reservation Idempotency

Same checkout/order reference must not reserve twice.

Unique candidate:

```text
coupon_id + reference_type + reference_id
```

or explicit idempotency key.

---

# 2711 — Coupon Reservation Expiry

Reservation should expire if checkout is abandoned.

Example:

```text
5–15 minutes
```

Exact duration must align with checkout/payment flow.

---

# 2712 — Reservation Expiry Worker

```text
Find ACTIVE expired reservations
      ↓
lock
      ↓
release usage/budget reservation
      ↓
mark EXPIRED
```

Idempotent.

---

# 2713 — Redeem Coupon

Final order creation/success:

```text
reservation
      ↓
REDEEMED
```

Update:

```text
coupon usage
customer usage
promotion usage
discount budget
```

---

# 2714 — Redemption Idempotency

Repeated redeem command:

```text
same result
```

must not increment usage twice.

---

# 2715 — Release Coupon

If checkout/order fails:

```text
ACTIVE reservation
      ↓
RELEASED
```

Return usage/budget capacity.

---

# 2716 — Coupon Reservation vs Redemption

Reservation:

```text
temporary capacity hold
```

Redemption:

```text
final usage
```

Do not increment final usage counter at preview stage.

---

# 2717 — Global Usage Concurrency

Example:

```text
global remaining = 1
```

Two customers redeem concurrently.

Only one succeeds.

Use:

```text
atomic counter update
row lock
```

---

# 2718 — Atomic Usage Reservation

Possible:

```sql
UPDATE promotion_usage_counters
SET reserved_count = reserved_count + 1
WHERE promotion_id = :promotion_id
  AND (usage_limit IS NULL OR
       redeemed_count + reserved_count < usage_limit);
```

Check row count.

---

# 2719 — Budget Concurrency

For budget-limited promotion:

```text
remaining budget = $5
```

Two $4 discounts cannot both reserve.

Use atomic monetary reservation.

---

# 2720 — Budget Counter Model

Possible fields:

```text
budget_total
budget_reserved
budget_redeemed
```

Invariant:

```text
budget_reserved + budget_redeemed <= budget_total
```

---

# 2721 — Budget Reservation SQL

Conceptual:

```sql
UPDATE promotion_usage_counters
SET budget_reserved = budget_reserved + :discount
WHERE promotion_id = :id
  AND budget_redeemed + budget_reserved + :discount <= budget_total;
```

---

# 2722 — Customer Usage Counter

Possible:

```text
promotion_customer_usage
```

Fields:

```text
promotion_id
customer_id
reserved_count
redeemed_count
```

---

# 2723 — Coupon Usage Counter

Possible:

```text
coupon_usage
```

Fields:

```text
coupon_id
reserved_count
redeemed_count
```

---

# 2724 — Usage Counter Reconciliation

Counters are operational projections.

Authoritative history should exist in:

```text
promotion_redemptions
coupon_reservations
```

Counters can be reconciled/rebuilt.

---

# 2725 — Redemption History

Immutable:

```text
promotion_redemptions
---------------------
redemption_id
promotion_id
promotion_version
coupon_id
customer_id
order_id
discount_amount
currency
redeemed_at
```

---

# 2726 — Applied Promotion Snapshot

Order Service should store:

```text
promotion_id
promotion_code
promotion_version
coupon_code if relevant
discount_type
discount_amount
```

This preserves transaction history.

---

# 2727 — Promotion Stacking

Possible policies:

```text
STACKABLE
EXCLUSIVE
BEST_ONLY
STACK_WITH_SAME_GROUP
STACK_EXCEPT_GROUP
```

Keep policy explicit.

---

# 2728 — Exclusive Promotion

If exclusive promotion applies:

```text
other discounts do not apply
```

unless exceptions are defined.

---

# 2729 — Best Promotion

For `BEST_ONLY`:

```text
evaluate candidates
      ↓
calculate discount
      ↓
select highest benefit
```

Tie-breaker must be deterministic.

---

# 2730 — Promotion Priority

Possible field:

```text
priority
```

Higher priority may evaluate first.

Priority alone must not create ambiguous calculation.

---

# 2731 — Promotion Groups

Possible:

```text
ORDER_DISCOUNT
ITEM_DISCOUNT
DELIVERY_DISCOUNT
LOYALTY_BENEFIT
```

Stacking can be controlled per group.

---

# 2732 — Deterministic Stacking Order

Example:

```text
1. Item price overrides
2. Item percentage/fixed discounts
3. Order subtotal discounts
4. Delivery discount
5. Tax/fee adjustments if applicable
```

Business rules must define exact order.

---

# 2733 — Discount Base

For stacked promotions, each promotion must define whether it calculates from:

```text
original amount
remaining amount
eligible line subtotal
```

---

# 2734 — Double Discount Prevention

Do not accidentally apply:

```text
same promotion twice
same coupon twice
same rule version twice
```

Use dedupe by promotion ID/version/reference.

---

# 2735 — Product-Level Discount Allocation

Order-level discount may need allocation across order lines.

Reasons:

```text
refunds
tax
reporting
accounting
```

---

# 2736 — Proportional Allocation

Example:

```text
line eligible subtotal / total eligible subtotal
*
order discount
```

Rounding remainder must be allocated deterministically.

---

# 2737 — Rounding Remainder

Example:

```text
discount = 1.00
3 equal lines
```

Cannot allocate:

```text
0.333...
```

Use deterministic remainder rule, e.g.:

```text
largest remainder
or
last eligible line
```

Document it.

---

# 2738 — Free Item Allocation

Free item discount should map to:

```text
specific item/quantity
```

not generic order discount if refund logic needs to know the benefit.

---

# 2739 — Minimum Spend with Stacking

Define whether minimum spend is evaluated:

```text
before other promotions
after item discounts
```

Do not leave hidden ordering assumptions.

---

# 2740 — Promotion Eligibility Reasons

Return stable reasons:

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

# 2741 — Friendly Message vs Error Code

Service returns stable code.

Client/translation layer renders customer-friendly message.

Do not hard-code all localized text in rule engine.

---

# 2742 — Promotion Database Overview

Possible tables:

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

---

# 2743 — Promotions Table

Example:

```text
promotions
----------
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

# 2744 — Promotion Versions Table

```text
promotion_versions
------------------
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

# 2745 — Conditions Table

Optional normalized model:

```text
promotion_conditions
--------------------
id
promotion_version_id
condition_type
operator
configuration_json
display_order
```

---

# 2746 — Benefits Table

```text
promotion_benefits
------------------
id
promotion_version_id
benefit_type
configuration_json
display_order
```

---

# 2747 — Store Scope Table

```text
promotion_store_scope
---------------------
promotion_version_id
store_id
scope_type
```

where scope type may be:

```text
INCLUDE
EXCLUDE
```

---

# 2748 — Channel Scope Table

```text
promotion_channel_scope
-----------------------
promotion_version_id
channel
scope_type
```

---

# 2749 — Product Scope Table

```text
promotion_product_scope
-----------------------
promotion_version_id
product_id
scope_type
```

---

# 2750 — Category Scope Table

```text
promotion_category_scope
------------------------
promotion_version_id
category_id
scope_type
```

---

# 2751 — Coupon Definitions Table

```text
coupon_definitions
------------------
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

# 2752 — Coupons Table

```text
coupons
-------
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

---

# 2753 — Usage Counters Table

```text
promotion_usage_counters
------------------------
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

# 2754 — Customer Usage Table

```text
promotion_customer_usage
------------------------
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

# 2755 — Coupon Reservations Table

```text
coupon_reservations
-------------------
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

# 2756 — Redemption Table

```text
promotion_redemptions
---------------------
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

Unique business reference as appropriate.

---

# 2757 — Promotion Idempotency Table

```text
promotion_idempotency
---------------------
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

# 2758 — Processed Events

```text
processed_events
----------------
event_id
consumer_name
processed_at
```

---

# 2759 — Outbox

Candidate events:

```text
PromotionPublished
PromotionActivated
PromotionPaused
CouponIssued
CouponReserved
CouponReleased
CouponRedeemed
PromotionUsageLimitReached
PromotionBudgetExhausted
```

---

# 2760 — Reconciliation Tables

```text
promotion_reconciliation_runs
promotion_reconciliation_mismatches
```

---

# 2761 — Promotion Publish Transaction

```text
BEGIN

validate draft
insert immutable version
set active/published version
insert outbox PromotionPublished

COMMIT
```

---

# 2762 — Coupon Issue Transaction

```text
BEGIN

dedupe source
validate definition
generate/normalize code
insert coupon
insert assignment if separate
insert outbox CouponIssued

COMMIT
```

---

# 2763 — Coupon Reserve Transaction

```text
BEGIN

claim idempotency
lock coupon
lock promotion usage counter
lock customer usage counter
validate eligibility
reserve usage/budget
insert reservation
insert outbox CouponReserved
complete idempotency

COMMIT
```

---

# 2764 — Coupon Redeem Transaction

```text
BEGIN

claim idempotency
lock reservation
validate ACTIVE
move reserved → redeemed counters
mark reservation REDEEMED
insert redemption history
update coupon status/count
insert outbox CouponRedeemed
complete idempotency

COMMIT
```

---

# 2765 — Coupon Release Transaction

```text
BEGIN

claim idempotency
lock reservation
validate releasable
decrease reserved counters/budget
mark RELEASED
insert outbox CouponReleased
complete idempotency

COMMIT
```

---

# 2766 — Reservation Expiry Transaction

Same as release but reason:

```text
EXPIRED
```

Worker must be idempotent.

---

# 2767 — Coupon Concurrency

Critical cases:

```text
same single-use coupon on two orders
global last usage slot
customer last allowed use
last promotion budget amount
```

All must be protected transactionally.

---

# 2768 — Lock Ordering

Recommended deterministic order:

```text
promotion usage row
customer usage row
coupon row
reservation
```

or another fixed order.

Use one consistent pattern to reduce deadlocks.

---

# 2769 — Optimistic vs Pessimistic Locking

Promotion evaluation:

```text
read-only
```

Reservation/redemption:

```text
pessimistic lock or atomic update
```

for scarce limits.

---

# 2770 — Coupon Validation Endpoint

Example:

```text
POST /api/v1/promotions/coupons/validate
```

Request:

```json
{
  "coupon_code": "WELCOME20",
  "store_id": "STORE001",
  "channel": "APP",
  "fulfillment_type": "PICKUP",
  "items": [],
  "subtotal": "10.00",
  "currency": "USD"
}
```

---

# 2771 — Validate Response

Example:

```json
{
  "data": {
    "eligible": true,
    "promotion_code": "WELCOME_20_OFF",
    "discount_amount": "2.00",
    "currency": "USD",
    "promotion_version": 3
  }
}
```

No redemption occurs.

---

# 2772 — Evaluate Promotions Endpoint

Possible:

```text
POST /api/v1/promotions/evaluate
```

Used by Cart/Order.

Input is server-controlled cart/order context.

---

# 2773 — Reserve Coupon Contract

Internal:

```text
ReservePromotion
```

Fields:

```text
customer_id
coupon_code
reference_type
reference_id
context
idempotency_key
expires_at
```

---

# 2774 — Redeem Coupon Contract

Internal:

```text
RedeemPromotion
```

Fields:

```text
reservation_id
order_id
idempotency_key
```

---

# 2775 — Release Coupon Contract

Internal:

```text
ReleasePromotion
```

Fields:

```text
reservation_id
reason_code
idempotency_key
```

---

# 2776 — Promotion gRPC Service

Conceptual:

```proto
service PromotionService {
  rpc EvaluatePromotions(EvaluatePromotionsRequest)
      returns (EvaluatePromotionsResponse);

  rpc ReservePromotion(ReservePromotionRequest)
      returns (ReservePromotionResponse);

  rpc RedeemPromotion(RedeemPromotionRequest)
      returns (RedeemPromotionResponse);

  rpc ReleasePromotion(ReleasePromotionRequest)
      returns (ReleasePromotionResponse);
}
```

---

# 2777 — Promotion Error Catalog

Candidate:

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

# 2778 — Error Mapping

Example:

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

# 2779 — Promotion Events Published

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

# 2780 — CouponIssued Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "COUPON_ISSUED",
  "event_version": 1,
  "producer": "promotion-service",
  "data": {
    "coupon_id": "CPN001",
    "promotion_id": "PR001",
    "customer_id": "CUS001",
    "expires_at": "..."
  }
}
```

Avoid publishing raw coupon code unless consumer truly needs it.

---

# 2781 — CouponRedeemed Event

Potential consumers:

```text
Analytics
Loyalty
Notification
Finance reporting
```

Data:

```text
coupon_id
promotion_id
customer_id
order_id
discount_amount
currency
```

---

# 2782 — PromotionLimitReached Event

Useful operationally when:

```text
usage limit exhausted
budget exhausted
```

May trigger:

```text
admin notification
automatic pause
```

---

# 2783 — Events Consumed

Possible:

```text
RewardAssigned
RewardClaimed
CustomerClosed
OrderCancelled
OrderCompleted
```

depending on issuance/redemption strategy.

---

# 2784 — Reward-to-Coupon Issuance

If Loyalty reward type is COUPON:

```text
RewardAssigned / Claim command
      ↓
Promotion Service
      ↓
Issue coupon exactly once
```

Use:

```text
reward_assignment_id
```

as idempotency/source reference.

---

# 2785 — Order Cancellation Reaction

If a redeemed coupon should be restored on cancelled order:

policy may:

```text
restore usage
reissue coupon
do nothing
```

This must be explicit.

---

# 2786 — Coupon Restoration

If allowed:

```text
OrderCancelled
      ↓
validate restoration policy
      ↓
create reversal/restoration record
```

Do not simply decrement usage counters without history.

---

# 2787 — Promotion Reversal

Model:

```text
promotion_redemption_reversals
```

or explicit reversal field/history if needed.

---

# 2788 — Refund Impact

Partial order refund may or may not restore coupon value.

Possible policies:

```text
never restore
full cancellation only
proportional restore
issue replacement coupon
```

Business-defined.

---

# 2789 — Promotion Reconciliation

Critical checks:

```text
redemption rows vs usage counters
reservation rows vs reserved counters
customer usage vs history
coupon redeemed_count vs redemptions
budget counters vs discount totals
```

---

# 2790 — Usage Reconciliation Formula

For promotion:

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

subject to reversal semantics.

---

# 2791 — Budget Reconciliation Formula

```text
SUM(active reservation discount)
=
budget_reserved
```

```text
SUM(redeemed discount)
=
budget_redeemed
```

---

# 2792 — Customer Usage Reconciliation

Per customer:

```text
reservation count
redemption count
```

must match persisted counters.

---

# 2793 — Coupon Reconciliation

For single-use coupon:

```text
redeemed_count <= 1
```

and status must correspond to history.

---

# 2794 — No Silent Counter Repair

Counters may be rebuilt from immutable history.

If rebuilt:

```text
audit the operation
```

Do not silently hide underlying race bugs.

---

# 2795 — Promotion Reconciliation Run

Possible:

```text
promotion_reconciliation_runs
-----------------------------
id
scope
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 2796 — Reconciliation Mismatch

```text
promotion_reconciliation_mismatches
-----------------------------------
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

# 2797 — Redis Usage

Redis may cache:

```text
active promotion versions
store/channel promotion list
coupon lookup summary
eligibility reference data
```

Authoritative:

```text
coupon usage
reservation
redemption
budget
```

must remain transactional in PostgreSQL.

---

# 2798 — Cache Key Examples

```text
promotion:active:{store}:{channel}
promotion:version:{promotion_id}:{version}
coupon:summary:{coupon_code_hash}
```

Avoid raw high-value coupon codes in logs.

---

# 2799 — Cache Invalidation

On:

```text
publish
activate
pause
expire
coupon revoke
```

invalidate affected cache.

Usage counters generally should not rely on stale cached values for final reservation.

---

# 2800 — Promotion Evaluation Performance

Promotion evaluation may become CPU-heavy.

Optimize:

```text
pre-filter by time
store
channel
coupon
customer scope
product/category scope
```

before running benefit calculations.

---

# 2801 — Candidate Promotion Index

Build read projection:

```text
active promotions by store/channel/time
```

to avoid scanning every promotion.

---

# 2802 — Rule Compilation

Future optimization:

```text
compile published rule configuration
```

into runtime structures.

Do not change rule semantics between nodes.

---

# 2803 — Deterministic Evaluation

Given the same:

```text
promotion version
context
timestamp
```

evaluation should produce the same result.

This is essential for debugging.

---

# 2804 — Evaluation Timestamp

Use one:

```text
evaluation_time
```

for the entire request.

Do not call `now()` repeatedly and cross activation boundaries mid-calculation.

---

# 2805 — Timezone

Promotion schedules may be store-local.

Store:

```text
Instant
```

for actual boundaries where possible.

Admin UI may configure local time + timezone.

---

# 2806 — Midnight Promotions

Test boundaries around:

```text
23:59:59
00:00:00
```

and daylight/timezone changes where relevant.

---

# 2807 — Promotion Service Clean Architecture

Recommended:

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

---

# 2808 — Input Ports

Examples:

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

# 2809 — Output Ports

Examples:

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
```

---

# 2810 — EvaluatePromotionsUseCase

Pseudo:

```text
Validate context
      ↓
Load candidate promotions
      ↓
Filter by time/status/store/channel
      ↓
Evaluate customer eligibility
      ↓
Evaluate item/category eligibility
      ↓
Calculate benefits
      ↓
Apply stacking policy
      ↓
Return deterministic result
```

No usage side effects.

---

# 2811 — ReservePromotionUseCase

```text
Validate context
      ↓
Claim idempotency
      ↓
Re-evaluate authoritative eligibility
      ↓
Lock scarce counters/coupon
      ↓
Reserve usage/budget
      ↓
Create reservation
      ↓
Outbox
```

---

# 2812 — RedeemPromotionUseCase

```text
Load reservation
      ↓
Claim idempotency
      ↓
Lock reservation/counters
      ↓
Validate not expired/released
      ↓
Move reserved → redeemed
      ↓
Write redemption history
      ↓
Outbox
```

---

# 2813 — ReleasePromotionUseCase

```text
Load reservation
      ↓
Claim idempotency
      ↓
Lock
      ↓
Return reserved usage/budget
      ↓
Mark released
      ↓
Outbox
```

---

# 2814 — IssueCouponUseCase

```text
Validate definition
      ↓
Deduplicate source
      ↓
Generate/normalize code
      ↓
Persist coupon
      ↓
Outbox
```

---

# 2815 — Coupon Code Generator

Example interface:

```java
public interface CouponCodeGenerator {
    String generate();
}
```

Use cryptographically secure randomness for high-value unique codes.

---

# 2816 — Promotion Query Model

Admin/customer query needs:

```text
active promotions
customer coupons
coupon detail
usage summary
redemption history
```

Use read DTOs.

---

# 2817 — Customer Coupon Endpoint

Example:

```text
GET /api/v1/promotions/coupons/me
```

Returns only coupons belonging/available to authenticated customer.

---

# 2818 — Coupon Detail Endpoint

```text
GET /api/v1/promotions/coupons/{couponId}
```

Authorization:

```text
assigned customer
or privileged admin
```

---

# 2819 — Admin Promotion API

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

# 2820 — Admin Authorization

Possible permissions:

```text
promotion.read
promotion.manage
promotion.publish
promotion.activate
coupon.issue
coupon.revoke
promotion.reconcile
```

---

# 2821 — High-Risk Promotion Changes

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
```

---

# 2822 — Promotion Audit

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

# 2823 — Promotion Data Classification

Likely:

```text
INTERNAL:
promotion rules
usage counters
campaign budget

CONFIDENTIAL:
customer coupon assignments
redemption history
```

Public promotion text may be public.

---

# 2824 — Privacy

Promotion should minimize direct PII.

Use:

```text
customer_id
segment/tier projection
```

instead of storing full customer profile.

---

# 2825 — Coupon Code Logging

Do not log full high-value coupon code unnecessarily.

Possible:

```text
coupon_id
masked code
hash
```

for diagnostics.

---

# 2826 — Rate Limiting

Protect:

```text
coupon validation
coupon brute-force attempts
coupon claim/issue admin endpoints
```

Dimensions:

```text
IP
customer
device
coupon prefix/hash
```

---

# 2827 — Coupon Enumeration Protection

Avoid giving attackers enough detail to discover valid unassigned coupon codes.

Generic responses may be appropriate for high-value private codes.

---

# 2828 — Abuse Monitoring

Track:

```text
many invalid coupon attempts
many customers using same code
rapid reservation/release loops
budget drain spikes
```

---

# 2829 — Fraud Relationship

A fraud/risk service may consume:

```text
CouponRedeemed
PromotionAbuseSignal
```

but Promotion itself should enforce hard usage limits.

---

# 2830 — Promotion Metrics

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
```

---

# 2831 — Promotion SLIs

Potential:

```text
P95 evaluation latency
Coupon validation availability
Reservation success rate
Redemption success rate
Event publication lag
Reconciliation health
```

---

# 2832 — Alerts

Alert on:

```text
discount spike
budget exhaustion unexpectedly early
usage counter mismatch
coupon brute-force spike
reservation expiry backlog
redeem failure spike
outbox backlog
DB deadlock spike
```

---

# 2833 — Dashboard

Show:

```text
active promotions
evaluation volume
coupon issue/reserve/redeem
discount amount
budget remaining
top rejection reasons
reservation backlog
reconciliation mismatches
```

---

# 2834 — Structured Logging

Safe fields:

```text
promotion_id
promotion_code
promotion_version
coupon_id
customer_id if permitted
order/reference_id
operation
result
reason_code
request_id
correlation_id
```

Avoid logging full secret/private coupon codes.

---

# 2835 — Tracing

Trace:

```text
Cart/Order
  ↓
Promotion Evaluate
  ↓
Candidate lookup
  ↓
Rule engine
  ↓
Reservation/DB
```

Useful span attributes:

```text
candidate_count
applied_count
result
```

---

# 2836 — Failure Mode: Catalog Down

If evaluation needs live product/category metadata:

```text
fail authoritative checkout evaluation
```

or use a validated local projection.

Do not guess product scope.

---

# 2837 — Failure Mode: Loyalty Down

If tier eligibility requires Loyalty and no trusted projection exists:

```text
fail that promotion evaluation
```

or treat promotion as unavailable according to business policy.

Do not incorrectly grant tier-only promotion.

---

# 2838 — Failure Mode: Redis Down

Fallback to PostgreSQL/read projection.

Final reservation/redemption remains transactional.

---

# 2839 — Failure Mode: Kafka Down

With outbox:

```text
promotion transaction commits
events publish later
```

---

# 2840 — Failure Mode: Expiry Worker Down

Reservations may remain held longer.

Monitor:

```text
expired active reservation count
```

and process backlog safely when worker recovers.

---

# 2841 — Runbooks

Required:

```text
Promotion gives wrong discount
Budget exhausted unexpectedly
Coupon duplicate redemption
Coupon brute-force attack
Reservation expiry backlog
Usage counter mismatch
Outbox backlog
Promotion DB unavailable
```

---

# 2842 — Wrong Discount Runbook

```text
pause promotion if needed
identify active version
reproduce context
compare rule/version/stacking
assess affected orders
publish corrected version
do not rewrite historical orders
```

---

# 2843 — Duplicate Redemption Runbook

```text
identify coupon/reference
inspect idempotency
inspect reservation/redemption history
inspect concurrent transactions
restore customer value only through approved correction
add regression test
```

---

# 2844 — Budget Incident Runbook

```text
pause promotion
compare budget counters vs redemption history
reconcile
identify over-allocation
assess customer obligations
apply approved corrective process
```

---

# 2845 — Backup

Back up:

```text
promotions
versions
coupons
usage counters
reservations
redemptions
reconciliation
outbox
```

---

# 2846 — Restore

After restore:

```text
expire stale reservations
reconcile usage counters
reconcile coupon state
reconcile budget
replay/repair outbox
```

---

# 2847 — Restore Risk

Old restore may:

```text
resurrect coupon
lose redemption
restore budget
duplicate issuance
```

Therefore:

```text
idempotent event replay
+
reconciliation
```

are mandatory.

---

# 2848 — Disaster Recovery

Define:

```text
RPO
RTO
promotion/coupon state recovery
event replay
usage/budget reconciliation
cache rebuild
```

---

# 2849 — Flyway Migration Plan

Example:

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

---

# 2850 — Legacy Promotion Migration

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

# 2851 — Legacy Coupon Migration

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

# 2852 — Legacy Rule Mapping

Create explicit mapping from legacy rule semantics to canonical:

```text
minimum spend
discount type
product scope
store scope
channel scope
usage limit
```

Do not blindly copy opaque JSON without validation.

---

# 2853 — Migration Reconciliation

Compare:

```text
active promotion count
coupon count
redeemed coupon count
remaining usage
discount totals
budget remaining
```

between old and new systems.

---

# 2854 — Testing Strategy

Test:

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

# 2855 — Promotion Domain Tests

Test:

```text
status transitions
time windows
publish validation
scope rules
usage limit validation
budget validation
```

---

# 2856 — Discount Tests

Test:

```text
fixed discount
percentage
max cap
free delivery
price override
rounding
currency
minimum spend
```

---

# 2857 — Stacking Tests

Test:

```text
stackable + stackable
exclusive + any
best-only
priority tie
item + order discount
delivery + order discount
```

---

# 2858 — Coupon Tests

Test:

```text
valid
expired
revoked
wrong customer
already used
case normalization
single use
multi use
```

---

# 2859 — Usage Limit Concurrency Tests

Example:

```text
1 remaining global use
100 concurrent reservations
```

Expected:

```text
exactly 1 succeeds
```

---

# 2860 — Budget Concurrency Tests

Example:

```text
remaining budget = $10
100 concurrent $2 reservations
```

Expected:

```text
at most 5 succeed
budget never negative
```

---

# 2861 — Customer Limit Tests

Example:

```text
per customer limit = 1
```

Concurrent devices must not reserve twice.

---

# 2862 — Reservation Tests

Test:

```text
reserve
duplicate reserve
expiry
release
redeem
redeem after expiry
release after redeem
```

---

# 2863 — Idempotency Tests

For:

```text
IssueCoupon
ReservePromotion
RedeemPromotion
ReleasePromotion
```

test:

```text
same key same request
same key changed request
concurrent duplicate
lost response + retry
```

---

# 2864 — Rule Version Tests

Verify:

```text
old order keeps old promotion version
new evaluation uses new version
draft edit does not alter active behavior
```

---

# 2865 — Event Tests

Test:

```text
RewardAssigned → coupon issue
duplicate RewardAssigned
CouponRedeemed
OrderCancelled restoration policy
outbox retry
```

---

# 2866 — Reconciliation Tests

Create:

```text
counter mismatch
budget mismatch
coupon status mismatch
reservation mismatch
```

Verify detection.

---

# 2867 — Load Tests

Scenarios:

```text
high menu/cart promotion evaluation
coupon campaign launch
global usage limit contention
hot public coupon
reservation expiry batch
```

---

# 2868 — Hot Coupon Test

Thousands of users apply the same public code.

Watch:

```text
coupon row contention
promotion counter contention
DB lock wait
evaluation cache
reservation throughput
```

---

# 2869 — Failure Tests

Inject:

```text
DB deadlock
Redis unavailable
Kafka unavailable
Catalog timeout
Loyalty timeout
worker crash
```

Verify documented recovery.

---

# 2870 — Security Tests

Verify:

```text
coupon brute-force rate limiting
wrong customer cannot use assigned coupon
client cannot submit discount amount
admin publish permission
coupon code leakage prevented
```

---

# 2871 — Definition of Done: Promotion

- [ ] Rule defined.
- [ ] Versioning.
- [ ] Scope.
- [ ] Time window.
- [ ] Discount math.
- [ ] Stacking.
- [ ] Usage/budget limits.
- [ ] Tests.
- [ ] Audit.
- [ ] Metrics.

---

# 2872 — Definition of Done: Coupon

- [ ] Code strategy.
- [ ] Normalization.
- [ ] Assignment rules.
- [ ] Validity.
- [ ] Usage limit.
- [ ] Reservation.
- [ ] Redemption.
- [ ] Release.
- [ ] Idempotency.
- [ ] Security.
- [ ] Tests.

---

# 2873 — Definition of Done: Checkout Integration

- [ ] Preview contract.
- [ ] Authoritative evaluation.
- [ ] Reservation contract.
- [ ] Redemption contract.
- [ ] Release/compensation.
- [ ] Snapshot stored in Order.
- [ ] Failure behavior.
- [ ] Distributed tracing.

---

# 2874 — Promotion Review Checklist

## Ownership

- [ ] Promotion rules owned here.
- [ ] Catalog still owns base price.
- [ ] Loyalty still owns points/tier.
- [ ] Order stores snapshots only.

## Eligibility

- [ ] Customer.
- [ ] Store.
- [ ] Channel.
- [ ] Product/category.
- [ ] Time.
- [ ] Spend.
- [ ] Usage.
- [ ] Budget.

## Correctness

- [ ] Deterministic evaluation.
- [ ] Stacking explicit.
- [ ] Rounding explicit.
- [ ] Concurrency protection.
- [ ] Idempotency.
- [ ] Reconciliation.

---

# 2875 — Data Review Checklist

- [ ] Promotion code unique.
- [ ] Immutable published versions.
- [ ] Coupon code unique.
- [ ] Usage counters.
- [ ] Customer counters.
- [ ] Reservations.
- [ ] Redemption history.
- [ ] Idempotency.
- [ ] Processed events.
- [ ] Outbox.
- [ ] Reconciliation tables.

---

# 2876 — Contract Review Checklist

- [ ] Evaluate promotions.
- [ ] Validate coupon.
- [ ] Reserve.
- [ ] Redeem.
- [ ] Release.
- [ ] Customer coupons.
- [ ] Admin APIs.
- [ ] Error catalog.
- [ ] Idempotency semantics.
- [ ] Event schemas.

---

# 2877 — Security Review Checklist

- [ ] Assigned coupon ownership enforced.
- [ ] High-value codes unpredictable.
- [ ] Validation rate limited.
- [ ] Coupon codes masked in logs.
- [ ] Admin operations authorized.
- [ ] Publish changes audited.
- [ ] Backup protected.
- [ ] Client discount values ignored.

---

# 2878 — Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Reservation expiry monitoring.
- [ ] Usage/budget reconciliation.
- [ ] Cache rebuild.
- [ ] Outbox monitoring.
- [ ] Backup/restore.
- [ ] Runbooks.

---

# 2879 — Production Readiness Checklist

Before production:

- [ ] Discount math tests pass.
- [ ] Stacking tests pass.
- [ ] Global usage concurrency test passes.
- [ ] Customer limit concurrency test passes.
- [ ] Budget concurrency test passes.
- [ ] Coupon brute-force protections tested.
- [ ] Reservation expiry tested.
- [ ] Redemption idempotency tested.
- [ ] Restoration policy tested.
- [ ] Reconciliation tested.
- [ ] Backup/restore tested.
- [ ] Event replay tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 2880 — Initial Implementation Order

Recommended:

```text
1. Promotion aggregate
2. Promotion versioning
3. Fixed/percentage discount rules
4. Scope rules
5. EvaluatePromotions
6. Coupon definition
7. Coupon issuance
8. Coupon validation
9. Usage counters
10. Reservation
11. Redemption
12. Release/expiry
13. Per-customer limits
14. Global limits
15. Budget limits
16. Stacking
17. Outbox events
18. Loyalty reward → coupon issuance
19. Reconciliation
20. Admin tooling
21. Redis candidate cache
```

---

# 2881 — Minimum Viable Promotion Service

First production-capable version:

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

# 2882 — Future Enhancements

Potential:

```text
Buy-X-Get-Y
Bundles
Free item
Dynamic segmentation
Personalized offers
Referral coupons
Partner-funded promotions
Multi-provider offer marketplace
Advanced promotion optimization
```

---

# 2883 — PART 17 Deliverables

PART 17 produces:

1. Promotion Service responsibility definition.
2. Boundary from Catalog, Loyalty, and Ordering.
3. Promotion aggregate.
4. Promotion status model.
5. Promotion code strategy.
6. Promotion types.
7. Coupon definition/instance distinction.
8. Coupon lifecycle.
9. Coupon code strategies.
10. Coupon assignment.
11. Usage limits.
12. Budget limits.
13. Promotion scopes.
14. Minimum spend.
15. Fixed/percentage discount.
16. Free delivery.
17. Price override.
18. Buy-X-Get-Y guidance.
19. Rule model.
20. Rule versioning.
21. Draft/publish workflow.
22. Evaluation context/result.
23. Preview vs final validation.
24. Coupon reservation.
25. Reservation expiry.
26. Redemption.
27. Release.
28. Concurrency protection.
29. Usage counters.
30. Budget counters.
31. Customer usage counters.
32. Redemption history.
33. Order snapshot contract.
34. Stacking/exclusivity.
35. Discount allocation.
36. Error reasons.
37. Full database schema.
38. Transaction patterns.
39. REST/gRPC contracts.
40. Error catalog.
41. Promotion events.
42. Loyalty reward integration.
43. Cancellation/refund restoration.
44. Reconciliation.
45. Redis/cache strategy.
46. Performance guidance.
47. Clean Architecture layout.
48. Input/output ports.
49. Admin authorization/audit.
50. Security/abuse protections.
51. Metrics/SLIs.
52. Alerts/dashboard.
53. Logging/tracing.
54. Failure modes.
55. Runbooks.
56. Backup/restore.
57. DR.
58. Flyway migrations.
59. Legacy migration.
60. Testing strategy.
61. Concurrency/load tests.
62. Review checklists.
63. Production readiness.
64. Implementation order.

---

# 2884 — Exit Criteria

PART 17 is complete when the team can answer:

### Ownership

```text
What does Promotion own versus Catalog, Loyalty, and Order?
```

### Eligibility

```text
How does the system decide whether a customer/cart/order qualifies?
```

### Discount

```text
How is discount calculated deterministically and rounded?
```

### Coupon

```text
How is a coupon issued, validated, reserved, redeemed, released, and expired?
```

### Concurrency

```text
How are last-usage-slot and last-budget-dollar races prevented?
```

### Stacking

```text
Which promotions can combine and in what calculation order?
```

### Idempotency

```text
How do retries avoid duplicate coupon issue or redemption?
```

### Order History

```text
Which promotion version and discount snapshot does Order preserve?
```

### Reconciliation

```text
How are usage counters, budget, reservations, and redemption history verified?
```

### Recovery

```text
How are event replay, restore, and cancellation compensation handled safely?
```

If these answers are clear and tested, Promotion / Coupon Service is ready for implementation.

---

# 2885 — Handoff to PART 18

PART 18 defines Mission Service.

```text
PART 17
Promotion / Coupon
      ↓
Coupon / Offer Benefits
Discount Eligibility
      ↓
PART 18
Mission Service
```

Mission Service will own:

```text
Mission Definition
Journey / Campaign Mission Types
Mission Eligibility
User Period
Mission Progress
Conditions
Progress Events
Completion
Reward Trigger
Mission Expiry
Mission Reset / Cycles
Mission Admin Configuration
Mission Reconciliation
```

The key separation is:

```text
Mission
= customer goal/progress engine

Promotion
= transaction-time discount engine

Loyalty
= points/tier/reward value
```

Mission may still be deployed inside `loyalty-service` initially if the coarse service boundary from PART 03 is retained.

---

# PART 17 — Summary

Promotion / Coupon Service owns transaction-time discount and offer eligibility.

Core promotion flow:

```text
Promotion Draft
      ↓
Validate
      ↓
Publish Version
      ↓
Activate
      ↓
Evaluate Cart/Order
      ↓
Reserve Usage/Coupon
      ↓
Create Order
      ↓
Redeem
```

Failure path:

```text
Reserve
  ↓
Checkout fails
  ↓
Release
```

Core discount model:

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
Usage/Budget Limits
=
Applied Promotion
```

The most important architecture rules are:

```text
Catalog owns base price.
Promotion owns discount logic.
Loyalty owns points/tier.
Order stores promotion snapshots.
Preview is not redemption.
Reservation protects scarce coupon/usage capacity.
Redemption is idempotent.
Global/customer/budget limits are concurrency-safe.
Stacking order is deterministic.
Published promotion versions are immutable.
Usage counters are reconciled against redemption history.
Client-provided discounts are never trusted.
```

The next chapter extracts the goal/progress engine into its own bounded context:

```text
PART 18 — Mission Service
```

---

**End of PART 17 — Promotion / Coupon Service**
