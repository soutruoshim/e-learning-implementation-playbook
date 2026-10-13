---
title: "PART 16 — LOYALTY SERVICE"
---

# PART 16 — LOYALTY SERVICE

> **Document Role:** Defines the complete architecture, domain model, points accounting model, reward model, tier model, earning/redeeming rules, event-driven integrations, reconciliation, testing strategy, and production standards for the Loyalty Service.  
> **Previous Part:** PART 15 — Wallet Service  
> **Next Part:** PART 17 — Promotion / Coupon Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, loyalty engineers, product engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 2381 — Purpose

The Loyalty Service owns the platform's non-cash customer reward value and loyalty state.

It answers:

```text
Does the customer have a points account?
How many points are available?
How many points are pending or reserved?
How were points earned?
How were points redeemed?
When do points expire?
What tier does the customer belong to?
Which rewards has the customer earned?
Has a reward already been assigned?
Has the reward been claimed?
Can every loyalty balance change be explained?
```

Loyalty must protect against:

```text
duplicate earning
duplicate redemption
negative points
duplicate reward assignment
duplicate reward claim
replayed events
expired point misuse
tier miscalculation
reward over-allocation
ledger inconsistency
```

---

# 2382 — Loyalty Service Responsibilities

Loyalty Service owns:

```text
Points Account
Available Points
Reserved Points if required
Points Ledger
Earn
Redeem
Expiry
Adjustment
Reversal
Tier
Tier Progress
Reward Definition references
Reward Assignment
Reward Claim
Reward Expiry
Loyalty Rules
Loyalty Reconciliation
Loyalty Events
```

Depending on the service-boundary decision from PART 03, Loyalty may initially contain modules for:

```text
Mission
Promotion
Campaign
Reward Distribution
```

Later these may split into separate services.

---

# 2383 — Non-Responsibilities

Loyalty does not own:

```text
Wallet balance
Payment provider state
Order lifecycle
Product price
Inventory
Customer profile master
Notification delivery
```

It consumes business facts such as:

```text
OrderCompleted
WalletTopUpCompleted
CustomerCreated
```

and applies loyalty rules.

---

# 2384 — Loyalty Boundary

High-level:

```text
             Order / Wallet / Customer
                     │
                     ▼
                Kafka Events
                     │
                     ▼
               Loyalty Service
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
  Points Account    Tier         Rewards
      │              │              │
      └──────────────┼──────────────┘
                     ▼
                loyalty_db
```

Possible modules:

```text
points
tier
reward
campaign
mission
```

---

# 2385 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Points Account | Customer account holding loyalty points |
| Available Points | Points currently redeemable |
| Reserved Points | Points temporarily held for redemption, if reservation model is used |
| Points Ledger | Immutable record of points movement |
| Earn | Credit points based on qualifying business activity |
| Redeem | Spend points for a benefit |
| Expiry | Automatic removal of expired points |
| Tier | Customer loyalty level |
| Tier Progress | Metric used to determine tier eligibility |
| Reward | Benefit that may be assigned and claimed |
| Reward Assignment | Association of a reward with a customer |
| Reward Claim | Customer action consuming an assigned reward |
| Loyalty Rule | Rule deciding earn/redeem/tier behavior |
| Campaign | Time-bounded loyalty configuration |
| Mission | Goal-based customer engagement rule |

---

# 2386 — Loyalty Account Aggregate

Possible aggregate root:

```text
PointsAccount
```

State:

```text
account_id
customer_id
status
available_points
reserved_points
lifetime_earned_points
lifetime_redeemed_points
current_tier
version
created_at
updated_at
```

---

# 2387 — Account Status

Recommended:

```text
ACTIVE
SUSPENDED
BLOCKED
CLOSED
```

---

# 2388 — Loyalty Invariants

Examples:

```text
available_points >= 0
reserved_points >= 0
redeem amount > 0
reserved points cannot exceed available + reserved total semantics
duplicate earn reference cannot credit twice
duplicate redemption cannot debit twice
expired points cannot be redeemed
reward cannot be claimed twice unless explicitly repeatable
closed account cannot receive normal transactions
```

---

# 2389 — Points vs Wallet

Important separation:

```text
Wallet
= monetary stored value

Loyalty Points
= non-cash reward value
```

Points must not be treated as cash unless business/legal policy explicitly defines conversion.

---

# 2390 — Points Data Type

Use integer points where possible.

Example:

```text
20 points
50 points
168 points
```

If fractional points are required, use exact numeric type.

Avoid floating point.

---

# 2391 — Points Balance

Simple model:

```text
available_points
```

Optional:

```text
reserved_points
```

if redemptions require a reserve/capture pattern.

---

# 2392 — Points Ledger Principle

Every change to points must create an immutable ledger entry.

Never modify historical points movements directly.

Correction:

```text
new reversal/adjustment entry
```

---

# 2393 — Points Ledger Types

Possible:

```text
EARN
REDEEM
EXPIRE
ADJUST_CREDIT
ADJUST_DEBIT
REVERSAL
OPENING_BALANCE
RESERVE
RELEASE
```

---

# 2394 — Points Ledger Entry

Possible fields:

```text
ledger_entry_id
account_id
entry_type
points_delta
reference_type
reference_id
rule_code
campaign_code
expires_at
occurred_at
created_at
idempotency_key
balance_after
```

---

# 2395 — Points Expiry Buckets

If points expire individually, each earning may create an expiry bucket.

Example:

```text
Earn 100 points on 1 Jan
Expires 31 Dec

Earn 50 points on 1 Mar
Expires 28 Feb next year
```

Redemption may consume oldest-expiring points first.

---

# 2396 — FIFO by Expiry

Recommended redemption strategy:

```text
FEFO
First Expire, First Out
```

Meaning:

```text
consume points with nearest expiry first
```

This improves customer fairness.

---

# 2397 — Point Lot Model

Possible table:

```text
points_lots
-----------
id
account_id
source_ledger_entry_id
earned_points
remaining_points
expires_at
status
created_at
```

---

# 2398 — Lot Status

Possible:

```text
ACTIVE
CONSUMED
EXPIRED
```

---

# 2399 — Earn Points

Possible earning sources:

```text
Order completion
Top-up
Campaign
Mission
Manual adjustment
Referral
Registration
Store exploration
```

Rules determine amount.

---

# 2400 — Event-Driven Earning

Preferred:

```text
OrderCompleted
      ↓
Loyalty Service
      ↓
Evaluate earn rule
      ↓
Credit points exactly once
```

This keeps Ordering independent from Loyalty implementation.

---

# 2401 — Earn Idempotency

Critical.

Unique earning reference:

```text
(source_type, source_reference, rule_code)
```

Example:

```text
ORDER + ORD001 + PURCHASE_POINTS
```

must credit once.

---

# 2402 — Earn Request

Internal command/event context may include:

```text
customer_id
member_id
order_id
store_id
gross_amount
discount_amount
net_amount
currency
sale_channel
completed_at
```

Only use fields needed by the loyalty rule.

---

# 2403 — Earn Rule

Example:

```text
1 point per $1 eligible spend
```

or:

```text
fixed points per transaction
```

or:

```text
campaign multiplier
```

Rules must be versioned.

---

# 2404 — Earn Rule Version

Store:

```text
rule_code
rule_version
```

on ledger transaction.

This allows future explanation:

```text
Why did this order earn 20 points?
```

---

# 2405 — Eligible Amount

Define explicitly:

```text
gross
net
after discount
before tax
after tax
excluding delivery fee
```

Do not leave ambiguity.

---

# 2406 — Currency Conversion for Earning

If earning across currencies:

```text
eligible amount
      ↓
approved exchange rate
      ↓
points formula
```

Store rate/version if needed.

---

# 2407 — Earn Rounding

Example:

```text
floor
round
ceiling
```

must be defined.

Do not allow hidden language/runtime rounding differences.

---

# 2408 — Earn Transaction

```text
BEGIN

dedupe source/reference/rule
lock points account
calculate points
increase available
increase lifetime earned
insert points transaction
insert ledger
create point lot if expiry used
insert outbox
mark processed event
COMMIT
```

---

# 2409 — Earn Failure

Possible:

```text
RULE_NOT_FOUND
RULE_INACTIVE
EVENT_NOT_ELIGIBLE
DUPLICATE_EARNING
ACCOUNT_BLOCKED
INVALID_CURRENCY
INVALID_AMOUNT
```

Most event-driven non-eligibility should be a safe no-op rather than infrastructure failure.

---

# 2410 — Redemption

Redemption spends points for:

```text
discount
reward
coupon
benefit
```

The redemption target must be explicit.

---

# 2411 — Redemption Models

Option A:

```text
Immediate redeem
```

Option B:

```text
Reserve points
      ↓
complete checkout
      ↓
capture points
```

For order checkout, reserve/capture is safer if points redemption affects payment total.

---

# 2412 — Points Reservation

Possible entity:

```text
points_reservations
```

Fields:

```text
reservation_id
account_id
reference_type
reference_id
original_points
captured_points
released_points
status
expires_at
created_at
```

---

# 2413 — Points Reserve Flow

```text
Validate account
      ↓
Check idempotency
      ↓
Expire old points first
      ↓
Check available >= requested
      ↓
Move available → reserved
      ↓
Reserve eligible point lots
      ↓
Create transaction/ledger
      ↓
Outbox
```

---

# 2414 — Points Capture

When order succeeds:

```text
reserved points
      ↓
captured/redeemed
```

Update:

```text
reserved_points
lifetime_redeemed_points
point-lot remaining
```

---

# 2415 — Points Release

When checkout fails/cancels:

```text
reserved points
      ↓
available again
```

Preserve original lot expiry dates.

---

# 2416 — Redemption Idempotency

Same redemption reference must not debit twice.

Use:

```text
order_id
redemption_id
idempotency_key
```

---

# 2417 — Expired Points Before Redemption

Before reserving/redeeming:

```text
expire any due point lots
```

or guarantee a continuously running expiry process plus transactional check.

Do not redeem expired value.

---

# 2418 — Expiry

Expiry removes unused points after policy date.

Flow:

```text
Find ACTIVE lot expires_at <= now
      ↓
Lock account/lot
      ↓
Calculate remaining
      ↓
Decrease available
      ↓
Mark lot EXPIRED
      ↓
Ledger EXPIRE
      ↓
Outbox
```

---

# 2419 — Expiry Idempotency

Each lot can expire once.

Duplicate worker execution:

```text
no-op
```

---

# 2420 — Expiry Notification

Notification Service may consume:

```text
PointsExpiringSoon
```

generated by scheduled loyalty process.

Possible reminders:

```text
30 days
15 days
7 days
```

according to business policy.

---

# 2421 — Expiry Reminder Idempotency

Track:

```text
account
lot or expiry period
reminder window
```

so the customer does not receive duplicate reminders.

---

# 2422 — Points Reversal

If original qualifying transaction is reversed/refunded:

```text
reverse associated earned points
```

but rules must define if already spent.

---

# 2423 — Reversal When Points Already Spent

Possible policy:

```text
allow negative points debt
block future earning/redemption until recovered
create adjustment debt
cap at zero and record unrecoverable difference
```

This is business policy.

Do not silently create negative points if invariant forbids it.

---

# 2424 — Order Refund Loyalty Impact

Example options:

```text
full refund → reverse earned points
partial refund → proportional reverse
no reversal after X days
```

Must be explicitly defined.

---

# 2425 — Points Adjustment

Admin/system may:

```text
credit
debit
```

with:

```text
reason
actor
approval where required
```

---

# 2426 — Adjustment Use Cases

Examples:

```text
customer support correction
campaign correction
migration correction
fraud recovery
```

---

# 2427 — Adjustment Audit

Always capture:

```text
actor
reason code
points
before balance
after balance
ticket/reference
timestamp
```

---

# 2428 — Tier Model

Tier represents customer loyalty level.

Example:

```text
BRONZE
SILVER
GOLD
PLATINUM
```

Actual names are business-defined.

---

# 2429 — Tier Qualification Metric

Possible:

```text
spend
points earned
visit count
order count
rolling 12-month spend
```

Choose one or a combination.

---

# 2430 — Tier State

Possible fields:

```text
customer_id
tier_code
effective_from
effective_to
qualification_value
rule_version
updated_at
```

---

# 2431 — Tier Rule

Example:

```text
BRONZE     0–99
SILVER   100–499
GOLD     500–999
PLATINUM 1000+
```

Illustrative only.

---

# 2432 — Tier Evaluation Window

Possible:

```text
calendar year
rolling 12 months
lifetime
campaign period
```

Must be explicit.

---

# 2433 — Tier Upgrade

On qualifying event:

```text
recalculate tier
      ↓
if new tier higher
      ↓
update tier
      ↓
TierUpgraded
```

---

# 2434 — Tier Downgrade

Possible policies:

```text
immediate
end of evaluation period
grace period
never downgrade
```

Business-defined.

---

# 2435 — Tier History

Store:

```text
tier_history
```

with:

```text
old_tier
new_tier
reason
rule_version
effective_at
```

---

# 2436 — Tier Benefits

Benefits may include:

```text
points multiplier
free reward
priority access
birthday benefit
exclusive campaign
```

Keep benefit definition separate from account state.

---

# 2437 — Reward Model

A Reward is a customer benefit.

Examples:

```text
20 BROWN Points
50 BROWN Points
Free Americano
Free Latte
Free Meal
Coupon
Stored-value bonus
```

---

# 2438 — Reward Definition

Possible fields:

```text
reward_id
reward_code
reward_type
title
description
status
valid_from
valid_to
claim_valid_days
metadata
```

---

# 2439 — Reward Types

Possible canonical:

```text
POINTS
PRODUCT
COUPON
WALLET_CREDIT
BENEFIT
```

Each type delegates fulfillment to the owning domain.

---

# 2440 — Reward Assignment

Assignment means:

```text
Customer has been granted a specific reward
```

Possible fields:

```text
assignment_id
reward_id
customer_id
campaign_id
status
assigned_at
claim_expires_at
claimed_at
source_reference
```

---

# 2441 — Reward Assignment Status

Possible:

```text
ASSIGNED
CLAIMED
EXPIRED
REVOKED
FULFILLMENT_PENDING
FULFILLED
```

---

# 2442 — Assignment Idempotency

A campaign milestone must not assign twice.

Unique:

```text
(customer_id, source_type, source_reference, reward_rule)
```

or equivalent.

---

# 2443 — Reward Claim

Claim flow:

```text
Customer
  ↓
Claim Reward
  ↓
Validate assigned + not expired
  ↓
Mark claim in progress
  ↓
Fulfill according to reward type
  ↓
Mark CLAIMED/FULFILLED
```

---

# 2444 — Reward Claim Idempotency

Repeated claim must not fulfill twice.

Critical for:

```text
points
wallet credit
coupon
```

---

# 2445 — Product Reward Fulfillment

Possible:

```text
create coupon/entitlement
```

instead of immediately creating an order item.

Promotion/Coupon Service may own redeemable coupon artifact.

---

# 2446 — Points Reward Fulfillment

If reward is points:

```text
assignment claim
      ↓
credit Points Account
```

using unique reward assignment reference.

---

# 2447 — Wallet Credit Reward

If reward is wallet money:

```text
Loyalty
  ↓ command/event
Wallet Service
  ↓ credit exactly once
```

Loyalty does not update Wallet DB directly.

---

# 2448 — Coupon Reward

If reward creates coupon:

```text
Loyalty
  ↓
Promotion/Coupon Service
```

through command/event.

---

# 2449 — Reward Expiry

If:

```text
claim_expires_at <= now
```

and not claimed:

```text
ASSIGNED → EXPIRED
```

---

# 2450 — Auto-Assignment

If campaign completes and customer did not manually claim within configured period:

```text
auto-assign reward
```

may be allowed.

The assignment must remain idempotent.

---

# 2451 — Auto-Claim vs Auto-Assign

Distinguish:

```text
Auto-Assign
= reward chosen and attached to customer

Auto-Claim
= reward immediately consumed/fulfilled
```

Do not use terms interchangeably.

---

# 2452 — Random Reward Selection

Some campaigns may choose rewards randomly.

Classic weighted random:

```text
random_int(1, total_weight)
```

then map range to reward.

This creates probabilistic distribution, not guaranteed proportional distribution.

---

# 2453 — Proportional Distribution

For controlled distribution, compare:

```text
expected assignment
vs
actual assignment
```

Example score:

```text
target_share - actual_share
```

Choose the most under-distributed reward.

This keeps allocation close to configured weights.

---

# 2454 — Controlled Randomness

A hybrid approach may:

```text
calculate proportional deficit
      ↓
create candidate set
      ↓
apply limited randomness among eligible candidates
```

This avoids overly deterministic patterns while preserving distribution.

---

# 2455 — Reward Weight Validation

For campaign-based distribution:

```text
sum(weights) = 100
```

if percentage semantics are used.

Reject invalid configuration before activation.

---

# 2456 — Reward Quantity Limits

Reward definition/campaign may include:

```text
quantity_limit
quantity_assigned
quantity_claimed
```

Selection must not exceed available quantity.

---

# 2457 — Reward Selection Concurrency

Multiple users may complete milestone simultaneously.

Protect quantity using:

```text
atomic update
row lock
reservation
```

to avoid over-allocation.

---

# 2458 — Reward Selection Transaction

```text
BEGIN

lock campaign reward candidates
calculate eligible distribution
select reward
increment quantity_assigned
insert reward assignment
insert outbox
COMMIT
```

---

# 2459 — Mission Relationship

Mission represents:

```text
goal/progress
```

Examples:

```text
First Top Up With Minimum Amount
First Pickup
First Dine-In
First Feedback
Explore 3 Stores
```

If Mission remains inside Loyalty initially, keep a separate module boundary.

---

# 2460 — Mission Progress Boundary

Mission owns:

```text
progress
completion
mission eligibility
mission period
reward trigger
```

Points account does not own mission progress.

---

# 2461 — Journey vs Campaign

Possible distinction:

```text
Journey
= onboarding / lifecycle missions for eligible new users

Campaign
= broader promotional missions for existing customer populations
```

This distinction should be explicit in mission configuration.

---

# 2462 — Mission Period Rule

A mission may define:

```text
user_period_start
mission_start
mission_end
```

Eligibility must compare:

```text
customer registration date
mission creation/start
prior completion
```

according to documented business policy.

---

# 2463 — First Top-Up Mission

Event source:

```text
WalletTopUpCompleted
```

Condition:

```text
first qualifying top-up
amount >= configured minimum
```

Idempotency by:

```text
user + mission + qualifying transaction
```

---

# 2464 — First Pickup Mission

Event source:

```text
OrderCompleted
```

Condition:

```text
fulfillment_type = PICKUP
```

---

# 2465 — First Dine-In Mission

Event source:

```text
OrderCompleted
```

Condition:

```text
fulfillment_type = DINE_IN
```

---

# 2466 — Feedback Mission

Event source:

```text
FeedbackSubmitted
```

Condition may count all configured feedback types rather than only one type.

Mission rule determines eligible categories.

---

# 2467 — Explore Stores Mission

Event source:

```text
OrderCompleted
```

Track distinct:

```text
store_id
```

until target count reached.

---

# 2468 — Mission Completion

When target reached:

```text
progress → COMPLETED
      ↓
reward assignment
```

Reward assignment must be idempotent.

---

# 2469 — Mission Progress Messages

Campaign configuration may define localized:

```text
progress_message
progress_complete_message
complete_message
```

and language variants.

Message selection should depend on:

```text
reward status
milestone completion
normal progress
```

---

# 2470 — Mission Translation

Keep translations in configuration tables or translation service.

Do not hard-code localized customer copy inside mission logic.

---

# 2471 — Promotion Relationship

Promotion/Coupon may initially live as Loyalty module but has distinct responsibilities:

```text
discount eligibility
coupon rules
redemption limits
campaign pricing benefit
```

It should eventually have its own boundary if complexity grows.

---

# 2472 — Loyalty Database Overview

Possible tables:

```text
points_accounts
points_transactions
points_ledger_entries
points_lots
points_reservations
loyalty_rules
tier_definitions
customer_tiers
tier_history
reward_definitions
reward_assignments
reward_campaigns
reward_campaign_items
mission_definitions
mission_progress
mission_progress_events
loyalty_idempotency
processed_events
outbox_events
loyalty_reconciliation_runs
loyalty_reconciliation_mismatches
```

---

# 2473 — Points Accounts Table

Example:

```text
points_accounts
---------------
id
customer_id
status
available_points
reserved_points
lifetime_earned_points
lifetime_redeemed_points
current_tier_code
version
created_at
updated_at
```

Unique:

```text
customer_id
```

---

# 2474 — Points Transactions Table

```text
points_transactions
-------------------
id
account_id
transaction_type
reference_type
reference_id
rule_code
rule_version
points
status
created_at
completed_at
```

---

# 2475 — Points Ledger Table

```text
points_ledger_entries
---------------------
id
account_id
points_transaction_id
entry_type
points_delta
balance_after
reference_type
reference_id
rule_code
campaign_code
expires_at
idempotency_key
occurred_at
created_at
```

Append-only.

---

# 2476 — Point Lots Table

```text
points_lots
-----------
id
account_id
source_ledger_entry_id
earned_points
remaining_points
expires_at
status
created_at
updated_at
```

---

# 2477 — Points Reservations Table

```text
points_reservations
-------------------
id
account_id
reference_type
reference_id
original_points
captured_points
released_points
status
expires_at
created_at
updated_at
version
```

---

# 2478 — Loyalty Rules Table

```text
loyalty_rules
-------------
id
rule_code
rule_version
rule_type
status
valid_from
valid_to
configuration_json
created_at
updated_at
```

Use JSON only for genuinely flexible rule parameters.

---

# 2479 — Tier Definitions Table

```text
tier_definitions
----------------
id
tier_code
display_name
rank
qualification_min
qualification_max
rule_version
status
```

---

# 2480 — Customer Tiers Table

```text
customer_tiers
--------------
customer_id
tier_code
qualification_value
effective_from
effective_to
rule_version
updated_at
version
```

---

# 2481 — Tier History Table

```text
tier_history
------------
id
customer_id
old_tier
new_tier
qualification_value
reason_code
rule_version
occurred_at
```

---

# 2482 — Reward Definitions Table

```text
reward_definitions
------------------
id
reward_code
reward_type
title
description
status
valid_from
valid_to
claim_valid_days
metadata_json
created_at
updated_at
```

---

# 2483 — Reward Assignments Table

```text
reward_assignments
------------------
id
reward_id
customer_id
campaign_id
source_type
source_reference
status
assigned_at
claim_expires_at
claimed_at
fulfilled_at
version
```

---

# 2484 — Reward Campaign Table

```text
reward_campaigns
----------------
id
campaign_code
name
status
starts_at
ends_at
distribution_strategy
created_at
updated_at
```

---

# 2485 — Reward Campaign Items

```text
reward_campaign_items
---------------------
id
campaign_id
reward_id
weight
quantity_limit
quantity_assigned
quantity_claimed
status
```

---

# 2486 — Mission Definitions

Possible:

```text
mission_definitions
-------------------
id
mission_code
mission_type
title_key
description_key
rule_key
status
starts_at
ends_at
user_period_start
configuration_json
reward_campaign_id
created_at
updated_at
```

---

# 2487 — Mission Progress

```text
mission_progress
----------------
id
mission_id
customer_id
current_progress
target_progress
status
progress_started_at
completed_at
progress_expires_at
reward_assignment_id
version
created_at
updated_at
```

Unique:

```text
(mission_id, customer_id, cycle_id)
```

if mission cycles exist.

---

# 2488 — Mission Progress Events

Optional append-only:

```text
mission_progress_events
-----------------------
id
mission_progress_id
event_type
source_event_id
progress_delta
occurred_at
created_at
```

---

# 2489 — Loyalty Idempotency Table

```text
loyalty_idempotency
-------------------
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

# 2490 — Processed Events

```text
processed_events
----------------
event_id
consumer_name
processed_at
```

Critical for event-driven earn/mission processing.

---

# 2491 — Outbox

Events such as:

```text
PointsEarned
PointsRedeemed
PointsExpired
TierChanged
RewardAssigned
RewardClaimed
MissionCompleted
```

---

# 2492 — Reconciliation Tables

```text
loyalty_reconciliation_runs
loyalty_reconciliation_mismatches
```

---

# 2493 — Account Creation

Possible flow:

```text
CustomerCreated
      ↓
Loyalty Service
      ↓
Create Points Account
```

or lazy creation.

---

# 2494 — Account Creation Idempotency

Unique:

```text
customer_id
```

prevents duplicate accounts.

---

# 2495 — Earn Transaction

```text
BEGIN

dedupe source event/reference
lock account
evaluate rule
credit available points
update lifetime earned
create transaction
create ledger
create point lot
update tier progress if needed
insert outbox
mark event processed
COMMIT
```

---

# 2496 — Redeem Reservation Transaction

```text
BEGIN

claim idempotency
expire due lots
lock account/lots
validate available
move points to reserved
allocate lot consumption
create reservation
create ledger
insert outbox
COMMIT
```

---

# 2497 — Capture Redemption Transaction

```text
BEGIN

claim idempotency
lock reservation/account
validate remaining
reduce reserved
increase lifetime redeemed
finalize lot usage
create ledger
outbox
COMMIT
```

---

# 2498 — Release Redemption Transaction

```text
BEGIN

claim idempotency
lock reservation/account/lots
restore reserved points to available
restore lot remaining allocation
create ledger
outbox
COMMIT
```

---

# 2499 — Expiry Transaction

```text
BEGIN

lock due point lot
lock account
validate lot active
decrease available by remaining lot points
mark lot expired
create EXPIRE ledger
outbox
COMMIT
```

---

# 2500 — Reward Assignment Transaction

```text
BEGIN

dedupe completion/source
lock campaign reward inventory if needed
select reward
increment assigned quantity
insert assignment
link mission/campaign progress
insert outbox RewardAssigned
COMMIT
```

---

# 2501 — Reward Claim Transaction

```text
BEGIN

claim idempotency
lock assignment
validate ASSIGNED + not expired
mark FULFILLMENT_PENDING
COMMIT
      ↓
fulfill external benefit
      ↓
mark CLAIMED/FULFILLED
```

If benefit is internal points, fulfillment may be one local transaction.

---

# 2502 — External Reward Fulfillment

For:

```text
WALLET_CREDIT
COUPON
PRODUCT
```

use:

```text
idempotent command/event
```

with `assignment_id` as reference.

---

# 2503 — Fulfillment Failure

Keep state:

```text
FULFILLMENT_PENDING
```

or:

```text
FULFILLMENT_FAILED
```

with retry metadata.

Do not mark claimed if benefit was not actually delivered.

---

# 2504 — Reward Claim Expiry Race

Possible race:

```text
claim request
vs
expiry worker
```

Use row lock/version.

Only one state transition wins.

---

# 2505 — Points Concurrency

Example:

```text
available points = 100
```

Two redemptions:

```text
80
80
```

Only one may succeed.

---

# 2506 — Atomic Redemption

Possible:

```sql
UPDATE points_accounts
SET available_points = available_points - :points,
    reserved_points = reserved_points + :points,
    version = version + 1
WHERE id = :account_id
  AND status = 'ACTIVE'
  AND available_points >= :points;
```

If affected rows = 0:

```text
insufficient points / conflict
```

---

# 2507 — Lot Concurrency

Account-level balance may succeed while lot allocation races.

Perform:

```text
account update
+
lot allocation
```

in the same DB transaction.

---

# 2508 — Deterministic Lot Consumption

Sort:

```text
expires_at ASC
id ASC
```

to consume earliest-expiring points first.

---

# 2509 — Tier Concurrency

Multiple qualifying events may update tier progress simultaneously.

Use:

```text
atomic cumulative counter
or
row lock / version
```

---

# 2510 — Reward Quantity Concurrency

Use atomic reservation:

```sql
UPDATE reward_campaign_items
SET quantity_assigned = quantity_assigned + 1
WHERE id = :id
  AND (quantity_limit IS NULL OR quantity_assigned < quantity_limit);
```

combined with selection strategy.

---

# 2511 — Proportional Reward Formula

For each reward `i`:

```text
target_i
=
(total_assigned + 1)
*
(weight_i / total_weight)
```

Compare with:

```text
actual_i = quantity_assigned_i
```

Deficit:

```text
deficit_i = target_i - actual_i
```

Prefer reward with largest positive deficit, subject to quantity limits.

---

# 2512 — Controlled Random Selection

Possible score:

```text
base proportional deficit
+
small random jitter
```

or weighted random only among most under-assigned candidates.

Document the exact algorithm and seed/randomness guarantees if reproducibility matters.

---

# 2513 — Distribution Reconciliation

For each campaign:

```text
expected share
vs
actual share
```

Monitor:

```text
absolute deviation
relative deviation
quantity exhaustion
```

---

# 2514 — Reward Availability

A reward is eligible only if:

```text
status active
campaign active
quantity available
customer eligible
not already assigned when unique
```

---

# 2515 — Campaign Time Window

Use:

```text
starts_at <= now
AND ends_at >= now
```

with explicit timezone semantics.

---

# 2516 — Campaign Lookup

If multiple campaigns may overlap:

```text
priority
specificity
version
```

must determine which applies.

Do not rely on arbitrary `LIMIT 1`.

---

# 2517 — Reward Validity

Assignment may define:

```text
claim_expires_at
=
assigned_at + reward_valid_days
```

or explicit campaign/end-date rule.

Store the actual timestamp.

---

# 2518 — Reward Auto-Assignment at Expiry

For completed but unclaimed milestone:

```text
progress expires
      ↓
auto-select reward
      ↓
create assignment
```

must be idempotent and concurrency-safe.

---

# 2519 — Reward Already Assigned

If assignment lookup finds existing record:

```text
created = false
```

should semantically mean:

```text
no new assignment was created because an assignment already exists
```

Return existing assignment safely.

---

# 2520 — Loyalty REST API

Customer:

```text
GET /api/v1/loyalty
GET /api/v1/loyalty/transactions
GET /api/v1/loyalty/tier
GET /api/v1/loyalty/rewards
POST /api/v1/loyalty/rewards/{assignmentId}/claim
GET /api/v1/loyalty/missions
GET /api/v1/loyalty/missions/{missionId}
```

if Mission remains inside Loyalty.

---

# 2521 — Admin Loyalty API

Possible:

```text
GET  /api/v1/admin/loyalty/accounts/{customerId}
POST /api/v1/admin/loyalty/accounts/{customerId}/adjust
GET  /api/v1/admin/loyalty/rewards
POST /api/v1/admin/loyalty/reward-campaigns
POST /api/v1/admin/loyalty/reward-campaigns/{id}/activate
GET  /api/v1/admin/loyalty/missions
POST /api/v1/admin/loyalty/missions
```

---

# 2522 — Internal gRPC Contract

Potential:

```proto
service LoyaltyService {
  rpc GetPoints(GetPointsRequest)
      returns (GetPointsResponse);

  rpc ReservePoints(ReservePointsRequest)
      returns (ReservePointsResponse);

  rpc CapturePoints(CapturePointsRequest)
      returns (CapturePointsResponse);

  rpc ReleasePoints(ReleasePointsRequest)
      returns (ReleasePointsResponse);

  rpc GetRewardAssignments(GetRewardAssignmentsRequest)
      returns (GetRewardAssignmentsResponse);
}
```

---

# 2523 — Get Loyalty Response

Example:

```json
{
  "data": {
    "points": {
      "available": 240,
      "reserved": 20
    },
    "tier": {
      "code": "GOLD"
    }
  }
}
```

---

# 2524 — Statement Response

Possible fields:

```text
entry_type
points
direction
description
reference
occurred_at
expires_at
balance_after
```

---

# 2525 — Reward Assignment Response

Example:

```json
{
  "assignment_id": "RA001",
  "reward_code": "FREE_LATTE",
  "status": "ASSIGNED",
  "claim_expires_at": "..."
}
```

---

# 2526 — Mission Response

Possible:

```text
mission_id
title
description
current_progress
target_progress
status
progress_message
reward_status
```

---

# 2527 — Loyalty Error Catalog

Candidate:

```text
LOYALTY_ACCOUNT_NOT_FOUND
LOYALTY_ACCOUNT_BLOCKED
INSUFFICIENT_POINTS
POINTS_RESERVATION_NOT_FOUND
POINTS_RESERVATION_EXPIRED
POINTS_ALREADY_CAPTURED
POINTS_ALREADY_RELEASED
RULE_NOT_FOUND
RULE_INACTIVE
DUPLICATE_EARNING
REWARD_NOT_FOUND
REWARD_NOT_AVAILABLE
REWARD_ALREADY_ASSIGNED
REWARD_ASSIGNMENT_NOT_FOUND
REWARD_ALREADY_CLAIMED
REWARD_EXPIRED
REWARD_FULFILLMENT_FAILED
MISSION_NOT_FOUND
MISSION_NOT_ELIGIBLE
MISSION_ALREADY_COMPLETED
IDEMPOTENCY_KEY_REUSED
```

---

# 2528 — Error Mapping

Example:

| Error | HTTP / gRPC |
|---|---|
| LOYALTY_ACCOUNT_NOT_FOUND | 404 / NOT_FOUND |
| INSUFFICIENT_POINTS | 422 / FAILED_PRECONDITION |
| REWARD_ALREADY_CLAIMED | 409 / ALREADY_EXISTS |
| REWARD_EXPIRED | 410 / FAILED_PRECONDITION |
| MISSION_NOT_ELIGIBLE | 403/422 |
| IDEMPOTENCY_KEY_REUSED | 409 / ALREADY_EXISTS |

---

# 2529 — Events Published

Candidate:

```text
PointsEarned
PointsReserved
PointsRedeemed
PointsReleased
PointsExpired
PointsAdjusted
TierUpgraded
TierDowngraded
RewardAssigned
RewardClaimed
RewardExpired
MissionProgressed
MissionCompleted
```

---

# 2530 — PointsEarned Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "POINTS_EARNED",
  "event_version": 1,
  "producer": "loyalty-service",
  "data": {
    "customer_id": "CUS001",
    "points": 20,
    "reference_type": "ORDER",
    "reference_id": "ORD001",
    "rule_code": "PURCHASE_POINTS"
  }
}
```

---

# 2531 — TierChanged Event

```text
customer_id
old_tier
new_tier
effective_at
rule_version
```

---

# 2532 — RewardAssigned Event

Potential consumers:

```text
Notification
Analytics
Coupon/Wallet fulfillment
```

---

# 2533 — MissionCompleted Event

Data:

```text
mission_id
customer_id
completed_at
reward_assignment_id optional
```

---

# 2534 — Events Consumed

Likely:

```text
CustomerCreated
OrderCompleted
OrderCancelled / Refunded if reversal policy
WalletTopUpCompleted
FeedbackSubmitted
```

---

# 2535 — Event Idempotency

Every consumed business event must be deduplicated using:

```text
event_id
consumer_name
```

and/or business reference uniqueness.

---

# 2536 — OrderCompleted Consumer

Flow:

```text
Receive OrderCompleted
      ↓
Deduplicate
      ↓
Evaluate purchase-points rule
      ↓
Evaluate applicable missions
      ↓
Update tier progress
      ↓
Create points/mission/reward outputs
      ↓
Outbox
      ↓
Commit
```

One event may trigger multiple independent loyalty modules.

---

# 2537 — Top-Up Completed Consumer

Flow:

```text
WalletTopUpCompleted
      ↓
Deduplicate
      ↓
Evaluate top-up mission/rules
      ↓
Progress/complete
      ↓
Assign reward if eligible
```

---

# 2538 — Feedback Consumer

```text
FeedbackSubmitted
      ↓
Evaluate feedback missions
```

If all feedback types count, rule configuration should say:

```text
eligible_types = ALL
```

rather than hard-coded "suggestion" only.

---

# 2539 — Store Exploration Consumer

On `OrderCompleted`:

```text
record distinct store_id
```

for mission progress.

Use uniqueness:

```text
(customer, mission, store_id)
```

to avoid counting same store repeatedly.

---

# 2540 — Order Refund Consumer

If loyalty earning must reverse after refund:

```text
OrderRefunded / PaymentRefunded
```

should reference original order/earning.

Rules decide proportional/full reversal.

---

# 2541 — Reward Fulfillment Event

For external reward:

```text
RewardAssigned
      ↓
Fulfillment consumer
```

or direct command.

Use `assignment_id` as idempotency reference.

---

# 2542 — Notification Integration

Notification consumes:

```text
PointsEarned
PointsExpiringSoon
TierUpgraded
RewardAssigned
RewardExpiringSoon
MissionCompleted
```

Loyalty does not send push directly.

---

# 2543 — Redis Usage

Redis may cache:

```text
loyalty summary
tier summary
mission list
reward list
```

Authoritative financial-like points state remains PostgreSQL.

---

# 2544 — Cache Key Examples

```text
loyalty:summary:{customer_id}
loyalty:missions:{customer_id}
loyalty:rewards:{customer_id}
```

---

# 2545 — Cache Invalidation

On:

```text
points change
tier change
mission progress
reward assignment/claim
```

invalidate/update affected cache.

---

# 2546 — Cache Failure

Read falls back to PostgreSQL.

Financial-like points writes must not depend on Redis.

---

# 2547 — Loyalty Read Consistency

Points balance after earn/redeem:

```text
strong read-after-write preferred
```

Mission list may tolerate:

```text
small eventual consistency
```

if projection-based.

---

# 2548 — Loyalty Service Clean Architecture

Recommended:

```text
loyalty-service/
│
├── domain/
│   ├── points/
│   ├── ledger/
│   ├── tier/
│   ├── reward/
│   ├── campaign/
│   ├── mission/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── earn/
│   ├── redeem/
│   ├── expiry/
│   ├── tier/
│   ├── reward/
│   ├── mission/
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
│   ├── kafka/
│   ├── redis/
│   ├── wallet/
│   └── promotion/
│
└── config/
```

---

# 2549 — Input Ports

Examples:

```text
GetLoyaltySummaryUseCase
GetPointsStatementUseCase
ReservePointsUseCase
CapturePointsUseCase
ReleasePointsUseCase
AdjustPointsUseCase
EvaluateEarnUseCase
EvaluateTierUseCase
AssignRewardUseCase
ClaimRewardUseCase
GetMissionsUseCase
ProcessMissionEventUseCase
ReconcileLoyaltyUseCase
```

---

# 2550 — Output Ports

Examples:

```text
LoadPointsAccountPort
SavePointsAccountPort
PointsLedgerPort
PointsLotPort
PointsReservationPort
LoyaltyRulePort
TierPort
RewardPort
MissionPort
OutboxPort
ProcessedEventPort
WalletRewardPort
CouponRewardPort
ClockPort
```

---

# 2551 — Earn Rule Engine

Keep first version understandable.

Possible strategy:

```text
rule type
+
configuration
+
explicit Java policy implementation
```

Avoid a highly dynamic expression engine too early.

---

# 2552 — Rule Types

Examples:

```text
PURCHASE_POINTS
TOPUP_POINTS
BONUS_MULTIPLIER
FIXED_BONUS
MISSION_REWARD
TIER_BONUS
```

---

# 2553 — Rule Configuration

Example:

```json
{
  "points_per_usd": 1,
  "minimum_amount": "1.00",
  "rounding": "FLOOR"
}
```

Validate configuration on activation.

---

# 2554 — Rule Activation

Before activating:

```text
schema valid
time window valid
currency valid
no conflicting priority
test cases passed
```

---

# 2555 — Rule Versioning

Do not modify active historical rule in place if it changes outcomes.

Prefer:

```text
rule_version + 1
```

with effective dates.

---

# 2556 — Tier Rule Versioning

Same principle.

Past tier history should remain explainable.

---

# 2557 — Mission Rule Configuration

Possible fields:

```text
event_type
condition
target_progress
period_type
eligibility
reward_campaign
```

Keep dynamic fields validated.

---

# 2558 — Mission Condition Examples

```text
OrderCompleted where fulfillment=PICKUP
WalletTopUpCompleted where amount >= X
FeedbackSubmitted where type in configured list
OrderCompleted distinct store count >= 3
```

---

# 2559 — Mission Progress Calculation

Possible:

```text
COUNT
SUM
DISTINCT_COUNT
FIRST_OCCURRENCE
BOOLEAN
```

---

# 2560 — Mission Progress Idempotency

Same source event must not increment progress twice.

Use:

```text
source_event_id
```

in progress event table or processed-event table.

---

# 2561 — Mission Completion Race

Two events may concurrently push progress over target.

Use:

```text
row lock / atomic update
unique reward assignment
```

to ensure one completion/reward.

---

# 2562 — Mission Expiry

If mission has progress expiry:

```text
progress_expires_at
```

worker decides:

```text
expire/reset
auto-assign reward if completed but unclaimed
```

according to mission policy.

---

# 2563 — Mission Reset

For repeatable campaign:

```text
cycle_id
```

or:

```text
period_start / period_end
```

identifies each cycle.

Do not overwrite previous completed progress if history matters.

---

# 2564 — Mission Eligibility

Inputs may include:

```text
registration date
journey period
mission start
prior completion
customer segment
tier
store/channel
```

---

# 2565 — Mission Eligibility Example

If rule says:

```text
users registered before configured journey period
and mission created after period start
```

eligibility logic must be documented precisely and tested with boundary dates.

---

# 2566 — Campaign vs Journey UI Contract

Backend should expose:

```text
mission_type
```

so UI does not infer from unrelated fields.

---

# 2567 — Translation Key Validation

If mobile cannot support numeric translation keys, admin validation should enforce:

```text
allowed key character policy
```

centrally.

Do not rely only on UI.

---

# 2568 — Reward Code Naming

Recommended:

```text
UPPERCASE_WITH_UNDERSCORES
```

Example:

```text
BROWN_30_POINTS
FREE_AMERICANO
```

---

# 2569 — Campaign Code Naming

Same:

```text
UPPERCASE_WITH_UNDERSCORES
```

Stable once published.

---

# 2570 — Loyalty Admin Authorization

Permissions:

```text
loyalty.read
loyalty.adjust
loyalty.rule.manage
loyalty.tier.manage
loyalty.reward.manage
loyalty.campaign.manage
loyalty.mission.manage
loyalty.reconcile
```

---

# 2571 — Sensitive Admin Operations

Require stronger audit for:

```text
points adjustment
reward quantity change
campaign activation
tier override
manual reward assignment
```

---

# 2572 — Manual Reward Assignment

Must capture:

```text
customer
reward
reason
actor
source ticket/reference
```

and remain idempotent if retried.

---

# 2573 — Tier Override

If allowed:

```text
override tier
override expiry
reason
actor
```

Store separately from calculated tier where possible.

---

# 2574 — Loyalty Data Classification

Likely:

```text
CONFIDENTIAL:
customer loyalty history
points balance
reward history
mission progress

INTERNAL:
rule configuration
campaign distribution
```

---

# 2575 — Privacy

Loyalty references customer ID but should minimize direct PII.

For display name/profile:

```text
query Customer Service
or use authorized projection
```

Do not duplicate full customer profile.

---

# 2576 — Customer Closure

On closure:

```text
stop new earning
stop redemption
expire/revoke benefits according to policy
retain required ledger history
anonymize/pseudonymize customer linkage as required
```

---

# 2577 — Ledger Retention

Points ledger may need long retention for:

```text
balance explanation
support
fraud
reconciliation
```

---

# 2578 — Mission Retention

Mission progress may have shorter retention than points ledger unless analytics/support requires history.

---

# 2579 — Reward Retention

Reward assignment/claim history should remain long enough to resolve customer disputes.

---

# 2580 — Loyalty Reconciliation

Critical checks:

```text
ledger sum vs points account balance
active lots sum vs available balance
reserved lot sum vs reserved balance
reward assignment quantity vs campaign counters
mission completion vs reward assignment
```

---

# 2581 — Points Balance Reconciliation

Formula:

```text
opening balance
+
SUM(points_delta)
=
available + reserved
```

depending on ledger delta semantics.

---

# 2582 — Lot Reconciliation

```text
SUM(active remaining lot points)
=
available_points
```

if every available point belongs to a lot.

---

# 2583 — Reservation Reconciliation

```text
SUM(active reservation remaining)
=
reserved_points
```

---

# 2584 — Reward Distribution Reconciliation

For campaign:

```text
SUM(assignments)
=
SUM(quantity_assigned counters)
```

and per reward:

```text
assignment count
=
quantity_assigned
```

unless known pending states exist.

---

# 2585 — Mission Reward Reconciliation

Check:

```text
mission COMPLETED requiring reward
but no reward assignment
```

and:

```text
reward assignment exists
but mission not completed
```

---

# 2586 — No Silent Loyalty Repair

Do not directly change balances/counters to hide mismatch.

Use:

```text
approved adjustment
rebuild projection
corrective transaction
audit
```

---

# 2587 — Reconciliation Run

```text
loyalty_reconciliation_runs
---------------------------
id
type
scope
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 2588 — Reconciliation Mismatch

```text
loyalty_reconciliation_mismatches
---------------------------------
id
run_id
customer_id
mismatch_type
expected_value
actual_value
reference
status
detected_at
resolved_at
```

---

# 2589 — Loyalty Metrics

Business:

```text
points_earned_total
points_redeemed_total
points_expired_total
active_points_accounts
tier_upgrade_total
reward_assigned_total
reward_claimed_total
mission_completed_total
```

Operational:

```text
duplicate_event_total
reward_fulfillment_failure_total
expiry_backlog
reconciliation_mismatch_total
outbox_backlog
```

---

# 2590 — Loyalty SLIs

Potential:

```text
Points balance read availability
P95 balance read latency
Earn-event processing latency
Reward claim success rate
Mission-event processing lag
Expiry-job lag
Reconciliation health
```

---

# 2591 — Alerts

Alert on:

```text
negative points
ledger mismatch
event-consumer lag
duplicate earning spike
reward over-allocation
reward fulfillment failure
expiry backlog
mission completion/reward mismatch
outbox backlog
```

---

# 2592 — Dashboard

Show:

```text
points earned/redeemed/expired
active balances
tier distribution
rewards assigned/claimed
mission completions
consumer lag
expiry backlog
reconciliation mismatches
```

---

# 2593 — Structured Logging

Safe fields:

```text
customer_id
account_id
transaction_id
reward_assignment_id
mission_id
event_id
operation
result
request_id
correlation_id
```

Avoid sensitive customer profile data.

---

# 2594 — Tracing

Trace:

```text
Kafka event
  ↓
Loyalty consumer
  ↓
Rule evaluation
  ↓
Points/Mission/Reward transaction
  ↓
Outbox
```

Useful attributes:

```text
rule_code
event_type
result
```

Avoid high-cardinality metric labels.

---

# 2595 — Runbooks

Required:

```text
Points balance mismatch
Duplicate earning suspected
Reward over-allocation
Reward fulfillment stuck
Mission progress mismatch
Expiry backlog
Kafka consumer lag
Outbox backlog
Incorrect admin adjustment
```

---

# 2596 — Duplicate Earning Runbook

```text
identify source event/reference
check processed_events
check transaction uniqueness
check ledger
reverse only through approved correction
add regression test
```

---

# 2597 — Reward Over-Allocation Runbook

```text
pause campaign if needed
compare assignments vs limits
identify race
block new assignment
resolve customer obligations
correct counters via approved process
```

---

# 2598 — Mission Progress Incident

If progress increments incorrectly:

```text
inspect source event
inspect dedupe state
inspect rule version
rebuild progress from event history if possible
```

---

# 2599 — Backup

Back up:

```text
points accounts
ledger
point lots
reservations
tiers
reward assignments
campaigns
mission progress
reconciliation
outbox
```

---

# 2600 — Restore

After restore:

```text
reconcile balances
reconcile lots/reservations
replay events idempotently
reconcile rewards
reconcile missions
repair outbox
```

---

# 2601 — Restore Risk

Old restore may:

```text
lose earning
duplicate earning after replay
restore expired points
lose reward claim
restore old mission progress
```

Therefore:

```text
event idempotency + reconciliation
```

are mandatory.

---

# 2602 — Disaster Recovery

Define:

```text
RPO
RTO
Kafka replay position
consumer idempotency
campaign/reward consistency
ledger reconstruction
backup/PITR
```

---

# 2603 — Flyway Migration Plan

Example:

```text
V1__create_points_accounts.sql
V2__create_points_transactions.sql
V3__create_points_ledger.sql
V4__create_points_lots.sql
V5__create_points_reservations.sql
V6__create_loyalty_rules.sql
V7__create_tier_tables.sql
V8__create_reward_tables.sql
V9__create_mission_tables.sql
V10__create_loyalty_idempotency.sql
V11__create_processed_events.sql
V12__create_reconciliation_tables.sql
V13__create_outbox.sql
```

---

# 2604 — Legacy Loyalty Migration

Preserve where possible:

```text
customer/member mapping
current point balance
historical points transactions
tier
active rewards
mission progress
```

---

# 2605 — Opening Points Balance

Create:

```text
OPENING_BALANCE
```

ledger entry from reconciled legacy balance.

Do not silently initialize balance without history.

---

# 2606 — Legacy Reward Migration

Migrate:

```text
active unclaimed rewards
claimed history if needed
expiry dates
source campaign
```

---

# 2607 — Legacy Mission Migration

For active journeys/campaigns:

```text
progress
completion state
period
reward assignment
```

must be mapped carefully.

---

# 2608 — Migration Reconciliation

Compare:

```text
legacy points balance
new account balance
ledger-derived balance
active rewards
mission completion counts
tier distribution
```

---

# 2609 — Testing Strategy

Test:

```text
Domain
Application
Persistence
Concurrency
Idempotency
Event consumers
Earn
Redeem
Expiry
Tier
Reward
Mission
Reconciliation
Load
Failure
Security
Migration
```

---

# 2610 — Points Domain Tests

Test:

```text
earn
reserve
capture
release
expire
adjust
reversal
blocked account
```

---

# 2611 — Earn Idempotency Tests

Same `OrderCompleted` event:

```text
once
twice
concurrently
```

must create one earning effect.

---

# 2612 — Redemption Concurrency Tests

Example:

```text
available = 100
100 concurrent requests redeem 10
```

Expected:

```text
at most 10 succeed
no negative points
```

---

# 2613 — Expiry Tests

Test:

```text
due lot
future lot
already consumed
already expired
expiry + redeem race
```

---

# 2614 — Lot Consumption Tests

Verify FEFO:

```text
nearest expiry consumed first
```

and release restores correct lot allocations.

---

# 2615 — Tier Tests

Test:

```text
upgrade threshold
boundary values
downgrade policy
window expiration
rule version
```

---

# 2616 — Reward Assignment Tests

Test:

```text
eligible assignment
duplicate assignment
quantity limit
concurrent allocation
campaign inactive
expired campaign
```

---

# 2617 — Weighted Distribution Tests

Run large simulation:

```text
configured weights
vs
actual assignment
```

Verify deviation remains within expected strategy.

---

# 2618 — Proportional Distribution Tests

Test:

```text
under-assigned reward selected
quantity exhausted reward skipped
tie behavior
controlled randomness bounds
```

---

# 2619 — Reward Claim Tests

Test:

```text
claim success
duplicate claim
expired assignment
fulfillment failure
retry fulfillment
wallet credit idempotency
coupon creation idempotency
```

---

# 2620 — Mission Tests

Test:

```text
first top-up
first pickup
first dine-in
feedback
distinct stores
period eligibility
duplicate source event
completion race
reward assignment once
```

---

# 2621 — Mission Period Boundary Tests

Include exact:

```text
before period start
at period start
after period start
mission created before period
mission created after period
already completed before period
```

---

# 2622 — Translation Tests

Test:

```text
English
Khmer
fallback
missing key
invalid numeric key if prohibited
```

---

# 2623 — Persistence Tests

Using PostgreSQL Testcontainers:

```text
customer unique account
ledger append-only assumptions
point-lot constraints
reward assignment uniqueness
campaign quantity constraints
mission progress uniqueness
Flyway
```

---

# 2624 — Kafka Tests

Test:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
duplicate event
out-of-order related event
consumer retry
DLQ
```

---

# 2625 — Reconciliation Tests

Create mismatches:

```text
ledger vs balance
lots vs available
reservation vs reserved
mission complete without reward
reward counter mismatch
```

Verify detection.

---

# 2626 — Load Tests

Scenarios:

```text
large OrderCompleted burst
campaign completion spike
reward assignment contention
points balance reads
mission list reads
expiry batch
```

---

# 2627 — Hot Campaign Test

Thousands of users complete the same reward campaign simultaneously.

Verify:

```text
quantity limits
no over-allocation
distribution remains valid
acceptable lock contention
```

---

# 2628 — Failure Tests

Inject:

```text
Kafka duplicate
DB timeout
deadlock
process crash after ledger commit
outbox failure
wallet reward fulfillment timeout
coupon fulfillment timeout
```

Verify safe recovery.

---

# 2629 — Security Tests

Verify:

```text
customer cannot adjust own points
admin permission required
manual reward assignment audited
cross-customer reward claim blocked
client cannot set points total
```

---

# 2630 — Definition of Done: Earn

- [ ] Rule defined/versioned.
- [ ] Source event identified.
- [ ] Eligibility defined.
- [ ] Idempotency.
- [ ] Ledger.
- [ ] Point lot if expiry applies.
- [ ] Tier impact.
- [ ] Event.
- [ ] Reconciliation.
- [ ] Tests.

---

# 2631 — Definition of Done: Redeem

- [ ] Available-point validation.
- [ ] FEFO lot allocation if used.
- [ ] Reservation model if required.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Ledger.
- [ ] Release/cancel behavior.
- [ ] Tests.

---

# 2632 — Definition of Done: Reward Assignment

- [ ] Eligibility.
- [ ] Campaign validity.
- [ ] Quantity limit.
- [ ] Selection algorithm.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Assignment expiry.
- [ ] Event.
- [ ] Tests.

---

# 2633 — Definition of Done: Mission

- [ ] Event source.
- [ ] Eligibility.
- [ ] Progress calculation.
- [ ] Period rules.
- [ ] Idempotency.
- [ ] Completion.
- [ ] Reward link.
- [ ] Translation.
- [ ] Tests.

---

# 2634 — Loyalty Review Checklist

## Ownership

- [ ] Points owned only here.
- [ ] Wallet remains monetary.
- [ ] Order remains source of completed-order fact.
- [ ] Mission/Promotion module boundaries explicit.

## Points

- [ ] Immutable ledger.
- [ ] Earn idempotency.
- [ ] Redeem concurrency.
- [ ] Expiry.
- [ ] Reconciliation.

## Rewards

- [ ] Assignment unique.
- [ ] Quantity protected.
- [ ] Claim idempotent.
- [ ] Fulfillment recoverable.

---

# 2635 — Data Review Checklist

- [ ] One points account per customer.
- [ ] Ledger append-only.
- [ ] Point lots if expiry used.
- [ ] Reservation constraints.
- [ ] Reward assignment uniqueness.
- [ ] Campaign counters.
- [ ] Mission progress uniqueness.
- [ ] Processed events.
- [ ] Outbox.
- [ ] Reconciliation tables.

---

# 2636 — Contract Review Checklist

- [ ] Loyalty summary.
- [ ] Statement.
- [ ] Reserve/capture/release points if needed.
- [ ] Reward list/claim.
- [ ] Mission list/detail.
- [ ] Stable errors.
- [ ] Event schemas.
- [ ] Idempotency semantics.
- [ ] No client-authoritative point balance.

---

# 2637 — Security Review Checklist

- [ ] Admin adjustments restricted.
- [ ] Manual reward assignment audited.
- [ ] Cross-customer access blocked.
- [ ] No points balance from client trusted.
- [ ] Reward fulfillment authenticated.
- [ ] Sensitive logs minimized.
- [ ] Backup protected.

---

# 2638 — Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Event lag.
- [ ] Expiry worker.
- [ ] Reward fulfillment worker.
- [ ] Reconciliation.
- [ ] Backup/restore.
- [ ] Runbooks.
- [ ] Outbox monitoring.

---

# 2639 — Production Readiness Checklist

Before production:

- [ ] Duplicate earning tests pass.
- [ ] Concurrent redemption tests pass.
- [ ] Point expiry tested.
- [ ] Reward quantity concurrency tested.
- [ ] Distribution algorithm simulation passed.
- [ ] Reward claim idempotency tested.
- [ ] Mission duplicate-event tests passed.
- [ ] Reconciliation tested.
- [ ] Backup/restore tested.
- [ ] Event replay tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.

---

# 2640 — Initial Implementation Order

Recommended:

```text
1. PointsAccount aggregate
2. Points ledger
3. Customer account creation
4. OrderCompleted earning
5. Earn idempotency
6. Loyalty summary/statement
7. Points expiry
8. Tier
9. Reward definitions
10. Reward assignments
11. Reward claim
12. Reward distribution
13. Mission module
14. WalletTopUpCompleted mission
15. Pickup/Dine-In missions
16. Feedback/Store exploration missions
17. Reconciliation
18. Admin tools
19. Redis cache
```

---

# 2641 — Minimum Viable Loyalty Service

First production-capable version:

```text
Points account
Immutable points ledger
Order-based earning
Earn idempotency
Points balance
Points statement
Points expiry
Basic tier
Reward assignment
Reward claim
Outbox events
Reconciliation
```

If missions are part of the current release:

```text
Mission progress
Event-driven progression
Completion
Reward assignment
Period eligibility
```

should also be included.

---

# 2642 — Future Enhancements

Potential:

```text
Advanced tiering
Points reservation/redemption
Family points
Referral
Birthday rewards
Personalized loyalty rules
Advanced campaign segmentation
AI-assisted offer selection
Cross-brand loyalty
Partner rewards
```

---

# 2643 — PART 16 Deliverables

PART 16 produces:

1. Loyalty Service responsibility definition.
2. Boundary from Wallet, Order, Promotion.
3. Points account aggregate.
4. Points status/invariants.
5. Points ledger.
6. Points lots/expiry.
7. FEFO redemption.
8. Earning sources.
9. Earn idempotency.
10. Rule versioning.
11. Redemption model.
12. Points reservation/capture/release.
13. Points expiry/reminders.
14. Reversal/adjustment.
15. Tier model.
16. Tier history.
17. Reward definitions.
18. Reward assignments.
19. Reward claims.
20. Reward fulfillment.
21. Reward expiry.
22. Weighted/proportional distribution.
23. Quantity limits.
24. Mission module boundary.
25. Journey/Campaign distinction.
26. Mission period rules.
27. First Top-Up mission.
28. First Pickup mission.
29. First Dine-In mission.
30. Feedback mission.
31. Explore Stores mission.
32. Mission messages/translations.
33. Promotion relationship.
34. Database schema.
35. Transaction patterns.
36. Concurrency controls.
37. REST/gRPC contracts.
38. Error catalog.
39. Events.
40. Event consumers.
41. Cache strategy.
42. Clean Architecture layout.
43. Input/output ports.
44. Rule engine guidance.
45. Admin authorization.
46. Privacy/retention.
47. Reconciliation.
48. Metrics/SLIs.
49. Alerts/dashboard.
50. Logging/tracing.
51. Runbooks.
52. Backup/restore.
53. DR.
54. Flyway migrations.
55. Legacy migration.
56. Testing strategy.
57. Load/concurrency tests.
58. Review checklists.
59. Production readiness.
60. Implementation order.

---

# 2644 — Exit Criteria

PART 16 is complete when the team can answer:

### Ownership

```text
What does Loyalty own versus Wallet, Order, Mission, and Promotion?
```

### Earn

```text
How does one completed order credit points exactly once?
```

### Redeem

```text
How are concurrent redemptions prevented from overspending points?
```

### Expiry

```text
How are expiring point lots tracked and consumed fairly?
```

### Tier

```text
How are tier qualification and rule versions represented?
```

### Rewards

```text
How are rewards selected, assigned, claimed, expired, and fulfilled exactly once?
```

### Missions

```text
How do source events update mission progress and trigger one reward?
```

### Distribution

```text
How are weighted reward distributions kept within configured limits?
```

### Reconciliation

```text
How are ledger/balance/lot/reward/mission inconsistencies detected?
```

### Recovery

```text
How do duplicate events and replay after restore remain safe?
```

If these answers are clear and tested, Loyalty Service is ready for implementation.

---

# 2645 — Handoff to PART 17

PART 17 defines Promotion / Coupon Service.

```text
PART 16
Loyalty Service
      ↓
Points
Tier
Rewards
Missions
      ↓
PART 17
Promotion / Coupon Service
```

Promotion / Coupon will own:

```text
Promotion Rules
Coupon Definition
Coupon Issuance
Coupon Eligibility
Coupon Reservation
Coupon Redemption
Usage Limits
Discount Calculation
Campaign Constraints
Promotion Reconciliation
```

The key separation is:

```text
Loyalty
= long-term customer reward state

Promotion
= transaction-time discount / offer eligibility
```

---

# PART 16 — Summary

The Loyalty Service owns non-cash customer reward value and engagement state.

Core points lifecycle:

```text
Qualifying Event
      ↓
Earn
      ↓
Available Points
      ↓
Reserve / Redeem
      ↓
Consumed
```

Expiry lifecycle:

```text
Earned Point Lot
      ↓
Approaching Expiry
      ↓
Reminder
      ↓
Expire Remaining Points
```

Reward lifecycle:

```text
Mission / Campaign / Tier
      ↓
Reward Selection
      ↓
Reward Assignment
      ↓
Claim
      ↓
Fulfillment
```

The most important architecture rules are:

```text
Points are not Wallet money.
Every points change has an immutable ledger record.
Earn is idempotent by source reference.
Redemption is concurrency-safe.
Expired points cannot be redeemed.
Tier rules are versioned.
Reward assignment is idempotent.
Reward quantity limits are concurrency-safe.
Reward fulfillment can be retried safely.
Mission progress is event-driven and deduplicated.
Reconciliation proves points/reward correctness.
```

The next chapter separates transaction-time discount logic from long-term loyalty state:

```text
PART 17 — Promotion / Coupon Service
```

---

**End of PART 16 — Loyalty Service**
