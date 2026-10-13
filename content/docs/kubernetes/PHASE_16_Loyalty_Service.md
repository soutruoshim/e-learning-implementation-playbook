---
title: "PHASE 16 — Loyalty Service"
---

# PHASE 16 — Loyalty Service

> **Purpose:** Implement the Loyalty Service as the authoritative owner of non-cash customer reward value and long-term loyalty state, including Points Accounts, immutable Points Ledger, earning, expiry, optional points reservation/redemption, tier state, reward definitions/references, reward assignment, reward claim, reward fulfillment orchestration, reconciliation, events, security, observability, testing, migration, and production readiness.
>
> **Previous Phase:** Phase 15 — Kafka / Event Architecture
>
> **Next Phase in the Implementation Roadmap:** Phase 17 — Mission Service
>
> **Architecture Source Note:** PART 16 allows Mission and Promotion to exist inside Loyalty initially depending on the service-boundary decision. In the approved implementation roadmap, Promotion is already a separate Phase 09 service and Mission is implemented separately in Phase 17. Therefore Phase 16 keeps their ownership separate and implements only the integration contracts needed by Loyalty.
>
> **Primary Architecture Basis:** PART 16 — Loyalty Service, supported by the already completed implementation phases for Customer, Ordering, Promotion, Payment, Wallet, Service Communication, Distributed Transactions / Saga, and Kafka / Event Architecture.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, REST/gRPC, Kafka, Flyway, Redis later where appropriate.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 16 Goal

Build a production-capable Loyalty Service that can answer:

```text
Does the customer have a points account?
How many points are available?
How many are reserved if reservation is enabled?
How were points earned?
How were points redeemed?
When do points expire?
What tier does the customer belong to?
Which rewards has the customer earned?
Has a reward already been assigned?
Has it been claimed?
Can every balance change be explained?
```

---

# 2. Loyalty Ownership

Loyalty owns:

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

---

# 3. Non-Responsibilities

Loyalty does not own:

```text
Wallet monetary balance
Payment provider state
Order lifecycle
Product price
Inventory
Customer profile master
Notification delivery
Promotion transaction-time discount eligibility
Mission progress in the current implementation roadmap
```

---

# 4. Core Separation — Loyalty vs Wallet

```text
Wallet
= monetary stored value

Loyalty Points
= non-cash reward value
```

Points must not silently become money.

---

# 5. Core Separation — Loyalty vs Promotion

```text
Loyalty
= long-term customer reward state

Promotion
= transaction-time discount / offer eligibility
```

Promotion owns coupon reservation/redemption and discount rules.

---

# 6. Core Separation — Loyalty vs Mission

Current implementation roadmap:

```text
Loyalty
= Points + Tier + Reward Assignment/Claim

Mission
= Goal + Progress + Eligibility + Completion
```

Mission may trigger a Loyalty reward assignment but does not own the points ledger.

---

# 7. Core Separation — Loyalty vs Ordering

Ordering owns:

```text
Order lifecycle
Order completion
Order cancellation/refund facts
```

Loyalty consumes those facts.

---

# 8. Event-Driven Boundary

Preferred flow:

```text
Order / Wallet / Customer / Mission
             │
             ▼
         Kafka Events
             │
             ▼
        Loyalty Service
      ┌──────┼───────┐
      ▼      ▼       ▼
    Points  Tier   Rewards
             │
             ▼
         loyalty_db
```

---

# 9. Loyalty Threat Model

Protect against:

```text
duplicate earning
duplicate redemption
negative points
duplicate reward assignment
duplicate reward claim
replayed events
expired-point misuse
tier miscalculation
reward over-allocation
ledger inconsistency
unauthorized adjustment
cross-customer reward claim
```

---

# 10. Ubiquitous Language

| Term | Meaning |
|---|---|
| Points Account | Customer account holding loyalty points |
| Available Points | Points currently redeemable |
| Reserved Points | Points temporarily held for redemption |
| Points Ledger | Immutable record of points movement |
| Earn | Credit points from qualifying business activity |
| Redeem | Spend points |
| Point Lot | Earned point bucket with remaining amount and expiry |
| Expiry | Removal of unused expired points |
| Tier | Customer loyalty level |
| Tier Progress | Metric used to determine tier |
| Reward | Benefit assignable to a customer |
| Reward Assignment | One reward granted to one customer |
| Reward Claim | Customer action to consume/fulfill an assignment |
| Loyalty Rule | Versioned rule defining earning/tier behavior |
| Reconciliation | Proof that account/ledger/lots/rewards agree |

---

# 11. Main Aggregate

Primary aggregate root:

```text
PointsAccount
```

Possible state:

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

# 12. Account Status

Recommended:

```text
ACTIVE
SUSPENDED
BLOCKED
CLOSED
```

---

# 13. Status Meaning

```text
ACTIVE
→ normal earning/redemption allowed

SUSPENDED
→ temporary restricted behavior according to policy

BLOCKED
→ earning/redemption blocked

CLOSED
→ no normal loyalty transactions
```

Exact behavior:

```text
TBD_LOYALTY_POLICY
```

---

# 14. Core Invariants

```text
available_points >= 0
reserved_points >= 0
redeem amount > 0
expired points cannot be redeemed
duplicate earning reference cannot credit twice
duplicate redemption cannot debit twice
reward cannot be claimed twice unless explicitly repeatable
closed account cannot receive normal transactions
```

---

# 15. Points Data Type

Prefer:

```text
integer points
```

Examples:

```text
20
50
168
```

If fractional points are required:

```text
exact NUMERIC/DECIMAL
```

Never binary floating point.

---

# 16. Simple Points Balance

Minimum model:

```text
available_points
```

---

# 17. Optional Reserved Points

If checkout requires safe point redemption:

```text
available_points
reserved_points
```

Use reserve/capture/release.

---

# 18. Ledger Principle

Every points change must have:

```text
an immutable ledger entry
```

Historical point movement is never rewritten.

---

# 19. Ledger Correction Rule

Correction is:

```text
new reversal
or
new adjustment
```

not:

```text
UPDATE old ledger row
```

---

# 20. Ledger Entry Types

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

# 21. Ledger Entry Model

Possible:

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

# 22. Ledger Delta Semantics

Define once and keep consistent.

Example:

```text
EARN          +20
REDEEM        -10
EXPIRE         -5
ADJUST_CREDIT +15
ADJUST_DEBIT   -2
REVERSAL      +/- original correction
```

Reservation semantics require an explicit decision because reservation moves availability without necessarily changing total points.

---

# 23. Ledger Balance Formula

Depending reservation semantics:

```text
opening_balance
+ SUM(points_delta)
=
available_points + reserved_points
```

This formula must be testable.

---

# 24. Point Lots

Use point lots when points expire independently.

Example:

```text
Earn 100
expires 2027-01-01

Earn 50
expires 2027-03-01
```

---

# 25. Point Lot Model

Possible:

```text
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

# 26. Point Lot Status

```text
ACTIVE
CONSUMED
EXPIRED
```

---

# 27. FEFO Redemption

Recommended:

```text
First Expire, First Out
```

Consume nearest-expiry points first.

---

# 28. Deterministic Lot Ordering

Sort:

```text
expires_at ASC
id ASC
```

to ensure deterministic allocation.

---

# 29. Point Lot Invariant

For ACTIVE lots:

```text
remaining_points >= 0
remaining_points <= earned_points
```

---

# 30. Earn Sources

Possible:

```text
OrderCompleted
WalletTopUpCompleted if business rule exists
Campaign
Mission reward
Manual adjustment
Referral
Registration
Store exploration
```

Only approved sources should be active.

---

# 31. Preferred Earning Pattern

```text
OrderCompleted
      ↓
Kafka
      ↓
Loyalty
      ↓
Evaluate Rule
      ↓
Credit Exactly Once
```

Ordering stays independent of Loyalty internals.

---

# 32. Earn Idempotency

Critical uniqueness:

```text
(source_type, source_reference, rule_code)
```

Example:

```text
ORDER + ORD001 + PURCHASE_POINTS
```

credits once.

---

# 33. Event-Level Idempotency

Consumed event also deduplicates:

```text
(event_id, consumer_name)
```

Business uniqueness and event dedupe work together.

---

# 34. Earn Input Context

Possible event fields:

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

Use only fields required by the rule.

---

# 35. Earn Rule Examples

Possible:

```text
1 point per $1 eligible spend
fixed points per transaction
campaign multiplier
tier multiplier
```

All are versioned.

---

# 36. Rule Code

Examples:

```text
PURCHASE_POINTS
TOPUP_POINTS
BONUS_MULTIPLIER
FIXED_BONUS
TIER_BONUS
MISSION_REWARD
```

---

# 37. Rule Version

Store:

```text
rule_code
rule_version
```

with every earning transaction.

---

# 38. Why Rule Version Matters

Support can answer:

```text
Why did order ORD001 earn 20 points?
```

even after the current rule changes.

---

# 39. Eligible Amount Policy

Must explicitly define whether earning uses:

```text
gross
net
after discount
before tax
after tax
excluding delivery fee
```

Production value:

```text
TBD_LOYALTY_POLICY
```

---

# 40. Currency Policy

If earning can occur across currencies:

```text
eligible amount
→ approved exchange-rate source/version
→ points formula
```

Store conversion metadata where required.

---

# 41. Earn Rounding Policy

Choose exactly one per rule:

```text
FLOOR
ROUND
CEILING
```

No hidden language/runtime rounding.

---

# 42. Earn Transaction

```text
BEGIN

dedupe source/reference/rule
dedupe source event
lock points account
evaluate rule
credit available points
increase lifetime earned
insert points transaction
insert ledger
create point lot if expiry applies
update tier progress if applicable
insert Outbox
mark event processed

COMMIT
```

---

# 43. Non-Eligible Event Handling

Examples:

```text
event amount too low
wrong sale channel
rule not applicable
```

Usually:

```text
safe no-op
```

not infrastructure failure.

---

# 44. Earn Errors

Candidates:

```text
RULE_NOT_FOUND
RULE_INACTIVE
EVENT_NOT_ELIGIBLE
DUPLICATE_EARNING
ACCOUNT_BLOCKED
INVALID_CURRENCY
INVALID_AMOUNT
```

---

# 45. Account Creation Trigger

Recommended source option:

```text
CustomerCreated
      ↓
Loyalty
      ↓
Create Points Account
```

Alternative:

```text
lazy creation
```

Decision:

```text
LOYALTY_ACCOUNT_CREATION = TBD_POLICY
```

---

# 46. Account Creation Uniqueness

Unique:

```text
customer_id
```

One points account per customer.

---

# 47. Customer Closure Event

Loyalty should react to customer closure by:

```text
stop new earning
stop redemption
expire/revoke benefits according to policy
retain required ledger history
anonymize/pseudonymize linkage where required
```

---

# 48. Customer Data Boundary

Loyalty references:

```text
customer_id
```

but does not own full Customer profile.

---

# 49. Profile Display Data

If UI/admin needs customer name:

```text
query Customer Service
or
use authorized projection
```

Do not replicate full customer profile.

---

# 50. Redemption Purpose

Points may be spent for:

```text
discount
reward
coupon
benefit
```

The target must be explicit.

---

# 51. Redemption Models

Option A:

```text
Immediate Redeem
```

Option B:

```text
Reserve
→ Checkout
→ Capture
```

---

# 52. Recommended Checkout Redemption

If points affect checkout total:

```text
Reserve / Capture / Release
```

is safer.

---

# 53. Points Reservation Entity

Possible:

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
updated_at
version
```

---

# 54. Reservation Status

Recommended:

```text
ACTIVE
PARTIALLY_CAPTURED
CAPTURED
PARTIALLY_RELEASED
RELEASED
EXPIRED
```

Only implement states actually needed.

---

# 55. Reserve Flow

```text
Validate account
      ↓
Check idempotency
      ↓
Expire due lots
      ↓
Check available >= requested
      ↓
Move available → reserved
      ↓
Allocate eligible lots
      ↓
Create reservation
      ↓
Ledger / transaction
      ↓
Outbox
```

---

# 56. Reserve Idempotency

Use stable:

```text
order_id
reservation_id
idempotency_key
```

according to contract.

---

# 57. Reserve Concurrency

Example:

```text
available = 100

request A = 80
request B = 80
```

Only one may succeed.

---

# 58. Atomic Reserve

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

If zero rows:

```text
insufficient points / conflict
```

---

# 59. Lot Allocation Transaction Boundary

Account reserve and lot allocation must happen in the same PostgreSQL transaction.

---

# 60. Capture Flow

```text
lock reservation/account
validate ACTIVE remaining reservation
reduce reserved points
increase lifetime redeemed
finalize lot consumption
insert transaction
insert ledger
insert Outbox
commit
```

---

# 61. Release Flow

```text
lock reservation/account/lots
restore reserved points to available
restore lot allocation
preserve original lot expiry
insert ledger
insert Outbox
commit
```

---

# 62. Expired Points Before Redeem

Before reserve/redeem:

```text
expire due lots
```

or transactionally prove none are redeemable.

Never spend expired points.

---

# 63. Reservation Expiry

If reservation times out:

```text
reserved
→ available
```

through an idempotent release/expiry transaction.

---

# 64. Reservation and Saga

Ordering Saga may call:

```text
ReservePoints
CapturePoints
ReleasePoints
```

if point redemption is part of checkout.

---

# 65. Loyalty as Saga Participant

Loyalty owns:

```text
its points transaction
its reservation
its idempotency
```

Ordering owns the checkout Saga.

---

# 66. Saga Compensation

Forward:

```text
ReservePoints
```

Compensation:

```text
ReleasePoints
```

If already captured, compensation policy may require a new reversal/credit operation.

---

# 67. UNKNOWN Outcome

If Ordering times out after `ReservePoints`:

```text
UNKNOWN != FAILED
```

Ordering should query/retry with the same stable operation reference.

---

# 68. Query-by-Reference

Recommended internal query:

```text
GetPointsReservation(reference)
```

for recovery.

---

# 69. Points Expiry

Expiry removes unused point value after policy date.

---

# 70. Expiry Transaction

```text
BEGIN

lock due ACTIVE lot
lock account
calculate remaining
decrease available
mark lot EXPIRED
insert EXPIRE ledger
insert Outbox

COMMIT
```

---

# 71. Expiry Idempotency

Each point lot expires once.

Duplicate worker execution:

```text
no-op
```

---

# 72. Expiry Worker Selection

Possible:

```sql
SELECT id
FROM points_lots
WHERE status = 'ACTIVE'
  AND expires_at <= NOW()
ORDER BY expires_at, id
FOR UPDATE SKIP LOCKED
LIMIT :batch;
```

---

# 73. Multiple Expiry Workers

Use:

```text
SKIP LOCKED
short transactions
bounded batch size
```

---

# 74. PointsExpiringSoon

Loyalty may publish:

```text
PointsExpiringSoon
```

for Notification.

---

# 75. Reminder Windows

Source examples:

```text
30 days
15 days
7 days
```

Actual windows:

```text
TBD_LOYALTY_POLICY
```

---

# 76. Reminder Idempotency

Track:

```text
account
lot/expiry period
reminder window
```

to avoid duplicate reminders.

---

# 77. Points Reversal

If qualifying transaction is reversed/refunded:

```text
reverse associated earned points
```

according to policy.

---

# 78. Refund Loyalty Policy

Possible:

```text
full refund → full earning reversal
partial refund → proportional reversal
no reversal after policy cutoff
```

Must be explicit.

---

# 79. Reversal When Points Already Spent

Source-supported options include:

```text
allow points debt
block future earn/redeem until recovered
create adjustment debt
cap at zero and record unrecoverable difference
```

Decision:

```text
LOYALTY_NEGATIVE_BALANCE_POLICY = TBD_POLICY
```

---

# 80. Negative Points Invariant

Do not silently create negative points if current invariant says:

```text
available_points >= 0
```

---

# 81. Manual Adjustment

Admin/system may:

```text
credit
debit
```

points.

---

# 82. Adjustment Required Metadata

Capture:

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

# 83. Adjustment Use Cases

Examples:

```text
support correction
campaign correction
migration correction
fraud recovery
```

---

# 84. Adjustment Authorization

Require:

```text
loyalty.adjust
```

and stronger audit.

---

# 85. Tier Model

Tier represents:

```text
customer loyalty level
```

Example names:

```text
BRONZE
SILVER
GOLD
PLATINUM
```

Names are business-defined.

---

# 86. Tier Qualification Metrics

Possible:

```text
spend
points earned
visit count
order count
rolling 12-month spend
```

or combination.

---

# 87. Tier State

Possible:

```text
customer_id
tier_code
effective_from
effective_to
qualification_value
rule_version
updated_at
version
```

---

# 88. Tier Rule

Illustrative only:

```text
BRONZE      0–99
SILVER    100–499
GOLD      500–999
PLATINUM 1000+
```

Do not treat as final business thresholds.

---

# 89. Tier Evaluation Window

Must explicitly choose:

```text
calendar year
rolling 12 months
lifetime
campaign period
```

Decision:

```text
TIER_EVALUATION_WINDOW = TBD_POLICY
```

---

# 90. Tier Upgrade Flow

```text
qualifying event
      ↓
recalculate qualification
      ↓
higher tier?
      ↓
update tier
      ↓
TierUpgraded
```

---

# 91. Tier Downgrade Policy

Possible:

```text
immediate
end of evaluation period
grace period
never downgrade
```

Decision:

```text
TIER_DOWNGRADE_POLICY = TBD_POLICY
```

---

# 92. Tier History

Store:

```text
old_tier
new_tier
qualification_value
reason
rule_version
effective_at
```

---

# 93. Tier Benefits

Possible:

```text
points multiplier
free reward
priority access
birthday benefit
exclusive campaign
```

Benefit definition remains separate from account state.

---

# 94. Tier Override

If allowed, capture:

```text
override tier
override expiry
reason
actor
```

Prefer separate override state rather than overwriting calculated truth.

---

# 95. Tier Rule Versioning

Do not change historical outcomes by editing an active rule in place.

Use:

```text
rule_version + 1
effective dates
```

---

# 96. Reward Definition

A Reward is:

```text
a customer benefit
```

Examples:

```text
20 points
50 points
free Americano
free Latte
free meal
coupon
wallet credit
benefit
```

---

# 97. Reward Types

Canonical candidates:

```text
POINTS
PRODUCT
COUPON
WALLET_CREDIT
BENEFIT
```

---

# 98. Reward Ownership Rule

Loyalty owns:

```text
reward definition/reference
assignment
claim lifecycle
```

Actual benefit fulfillment delegates to owning domain.

---

# 99. POINTS Reward Fulfillment

```text
Reward Claim
      ↓
Credit Points Account
```

using:

```text
assignment_id
```

as unique business reference.

---

# 100. WALLET_CREDIT Reward Fulfillment

```text
Loyalty
   ↓ idempotent command/event
Wallet
   ↓
credit exactly once
```

Loyalty never updates Wallet DB.

---

# 101. COUPON Reward Fulfillment

```text
Loyalty
   ↓
Promotion Service
```

Promotion owns coupon artifact.

---

# 102. PRODUCT Reward Fulfillment

Preferred source pattern:

```text
create coupon / entitlement
```

rather than directly inserting an Order item.

---

# 103. Reward Definition Model

Possible:

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

# 104. Reward Code Naming

Recommended:

```text
UPPERCASE_WITH_UNDERSCORES
```

Examples:

```text
BROWN_30_POINTS
FREE_AMERICANO
```

---

# 105. Reward Assignment

Assignment means:

```text
a customer has been granted one specific reward
```

---

# 106. Reward Assignment Model

Possible:

```text
assignment_id
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

# 107. Assignment Status

Possible:

```text
ASSIGNED
CLAIMED
EXPIRED
REVOKED
FULFILLMENT_PENDING
FULFILLED
FULFILLMENT_FAILED
```

Implement only states needed.

---

# 108. Assignment Idempotency

Use uniqueness equivalent to:

```text
(customer_id, source_type, source_reference, reward_rule)
```

---

# 109. Existing Assignment Semantics

If assignment already exists:

```text
created = false
```

means:

```text
no new assignment was created
```

Return existing assignment safely.

---

# 110. Reward Claim Flow

```text
Customer
   ↓
Claim
   ↓
Validate ASSIGNED + not expired
   ↓
Mark FULFILLMENT_PENDING
   ↓
Fulfill by reward type
   ↓
Mark CLAIMED/FULFILLED
```

---

# 111. Reward Claim Idempotency

Repeated claim must not fulfill twice.

Critical for:

```text
POINTS
WALLET_CREDIT
COUPON
```

---

# 112. Claim Idempotency Reference

Use:

```text
assignment_id
```

plus request idempotency key where needed.

---

# 113. Reward Claim Transaction

```text
BEGIN

claim idempotency
lock assignment
validate state + expiry
mark FULFILLMENT_PENDING

COMMIT
```

Then external benefit fulfillment occurs with stable `assignment_id`.

---

# 114. Local Points Reward Optimization

For POINTS rewards, assignment state and points credit may be completed in one local transaction if designed safely.

---

# 115. External Fulfillment

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

with `assignment_id`.

---

# 116. Fulfillment Failure

Keep:

```text
FULFILLMENT_PENDING
```

or:

```text
FULFILLMENT_FAILED
```

with retry metadata.

Do not mark reward successfully claimed if benefit was not delivered.

---

# 117. Fulfillment UNKNOWN

If external service may have succeeded but response was lost:

```text
UNKNOWN must be resolved
```

using stable assignment reference/status query/idempotent retry.

---

# 118. Claim vs Expiry Race

Race:

```text
claim request
vs
expiry worker
```

Use:

```text
row lock
or
optimistic version
```

Only one transition wins.

---

# 119. Reward Expiry

If:

```text
claim_expires_at <= now
```

and unclaimed:

```text
ASSIGNED → EXPIRED
```

---

# 120. Reward Validity Timestamp

Store actual:

```text
claim_expires_at
```

rather than recalculating from current config later.

---

# 121. Auto-Assign vs Auto-Claim

```text
Auto-Assign
= reward selected and attached

Auto-Claim
= reward immediately fulfilled
```

Do not use terms interchangeably.

---

# 122. Reward Campaign

Possible fields:

```text
campaign_id
campaign_code
name
status
starts_at
ends_at
distribution_strategy
```

---

# 123. Campaign Code Naming

Recommended:

```text
UPPERCASE_WITH_UNDERSCORES
```

Stable once published.

---

# 124. Campaign Active Window

Use:

```text
starts_at <= now
AND
ends_at >= now
```

with explicit timezone semantics.

---

# 125. Overlapping Campaigns

If overlap is allowed, selection must use explicit:

```text
priority
specificity
version
```

Do not use arbitrary `LIMIT 1`.

---

# 126. Reward Campaign Item

Possible:

```text
campaign_id
reward_id
weight
quantity_limit
quantity_assigned
quantity_claimed
status
```

---

# 127. Reward Quantity Limit

Never allocate when:

```text
quantity_assigned >= quantity_limit
```

unless limit is unlimited/null by contract.

---

# 128. Quantity Concurrency

Atomic protection example:

```sql
UPDATE reward_campaign_items
SET quantity_assigned = quantity_assigned + 1
WHERE id = :id
  AND (
      quantity_limit IS NULL
      OR quantity_assigned < quantity_limit
  );
```

---

# 129. Reward Selection Transaction

```text
BEGIN

lock eligible campaign reward rows
calculate eligible distribution
select reward
increment quantity_assigned atomically
insert reward assignment
insert Outbox

COMMIT
```

---

# 130. Weighted Random Selection

Classic weighted random:

```text
random_int(1, total_weight)
```

mapped to configured ranges.

This is probabilistic.

---

# 131. Weight Validation

If weights represent percentage:

```text
SUM(weights) = 100
```

before activation.

---

# 132. Proportional Distribution

For reward `i`:

```text
target_i
=
(total_assigned + 1)
*
(weight_i / total_weight)

actual_i
=
quantity_assigned_i

deficit_i
=
target_i - actual_i
```

Prefer largest positive deficit subject to availability.

---

# 133. Controlled Randomness

Possible hybrid:

```text
calculate proportional deficit
→ build under-assigned candidate set
→ apply limited randomness
```

---

# 134. Distribution Algorithm Policy

The exact production strategy is:

```text
TBD_REWARD_DISTRIBUTION_POLICY
```

Allowed source-supported options:

```text
weighted random
proportional
controlled randomness
```

---

# 135. Reward Distribution Reconciliation

Track:

```text
expected share
actual share
absolute deviation
relative deviation
quantity exhaustion
```

---

# 136. Reward Availability

Eligible only if:

```text
reward active
campaign active
quantity available
customer eligible
not already assigned where uniqueness applies
```

---

# 137. Reward Counter Invariants

```text
quantity_assigned >= 0
quantity_claimed >= 0
quantity_claimed <= quantity_assigned
quantity_assigned <= quantity_limit when limit exists
```

---

# 138. Reward Assignment Source

Possible:

```text
MissionCompleted
TierUpgraded
Campaign rule
Admin assignment
Registration rule
```

---

# 139. Mission Integration Boundary

In the current roadmap Mission Service owns:

```text
mission definition
eligibility
progress
completion
mission period
mission cycle
```

Loyalty owns the reward assignment/points effect triggered by Mission.

---

# 140. MissionCompleted Input

Expected facts may include:

```text
mission_id
mission_code
customer_id
completed_at
reward_campaign_id
completion_reference
```

Exact contract is finalized in Phase 17.

---

# 141. Mission Reward Idempotency

A Mission completion must assign its reward once.

Use:

```text
source_type = MISSION
source_reference = mission completion/progress reference
```

---

# 142. Mission Does Not Directly Update Points DB

Mission triggers:

```text
Reward Assignment
or
Earn command/event
```

through Loyalty contract.

---

# 143. Promotion Integration Boundary

Promotion owns:

```text
coupon creation
coupon eligibility
coupon reservation
coupon redemption
usage limits
discount calculation
```

Loyalty may request coupon reward fulfillment.

---

# 144. Notification Integration Boundary

Notification consumes facts such as:

```text
PointsEarned
PointsExpiringSoon
TierUpgraded
RewardAssigned
RewardExpiringSoon
```

Loyalty does not send push/email directly.

---

# 145. Customer REST APIs

Core:

```text
GET /api/v1/loyalty
GET /api/v1/loyalty/transactions
GET /api/v1/loyalty/tier
GET /api/v1/loyalty/rewards
POST /api/v1/loyalty/rewards/{assignmentId}/claim
```

Mission endpoints are deferred to Phase 17.

---

# 146. GET /api/v1/loyalty

Returns customer-owned loyalty summary derived from authenticated identity/customer mapping.

Do not accept arbitrary customer ID from a normal `/me` style client path.

---

# 147. Loyalty Summary Response

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

# 148. Statement Endpoint

Possible response fields:

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

# 149. Statement Pagination

Use platform pagination contract.

Sort deterministically by:

```text
occurred_at DESC
id DESC
```

or equivalent stable order.

---

# 150. Reward List Endpoint

Return:

```text
assignment_id
reward_code
reward_type
status
assigned_at
claim_expires_at
claimed_at
```

plus display metadata needed by client.

---

# 151. Claim Endpoint

```text
POST /api/v1/loyalty/rewards/{assignmentId}/claim
```

Requirements:

```text
authenticated customer
assignment belongs to customer
idempotency
expiry check
state-machine validation
```

---

# 152. Admin Loyalty API

Possible:

```text
GET  /api/v1/admin/loyalty/accounts/{customerId}
POST /api/v1/admin/loyalty/accounts/{customerId}/adjust
GET  /api/v1/admin/loyalty/rewards
POST /api/v1/admin/loyalty/reward-campaigns
POST /api/v1/admin/loyalty/reward-campaigns/{id}/activate
POST /api/v1/admin/loyalty/rewards/assign
```

---

# 153. Internal gRPC Contract

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

# 154. Internal Contract Purpose

Use purpose-specific contracts.

Do not expose:

```text
GetEverythingAboutLoyalty
```

to every service.

---

# 155. ReservePoints Request

Possible:

```text
customer_id
points
reference_type
reference_id
idempotency_key
expires_at
```

---

# 156. ReservePoints Response

Possible:

```text
reservation_id
status
points
remaining_available
expires_at
```

---

# 157. CapturePoints Request

Possible:

```text
reservation_id
reference_id
points optional
idempotency_key
```

---

# 158. ReleasePoints Request

Possible:

```text
reservation_id
reference_id
points optional
idempotency_key
```

---

# 159. Loyalty Error Catalog

Candidates:

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
IDEMPOTENCY_KEY_REUSED
```

Mission-specific errors belong to Phase 17.

---

# 160. Error Mapping

Examples:

| Error | HTTP / gRPC |
|---|---|
| LOYALTY_ACCOUNT_NOT_FOUND | 404 / NOT_FOUND |
| INSUFFICIENT_POINTS | 422 / FAILED_PRECONDITION |
| REWARD_ALREADY_CLAIMED | 409 / ALREADY_EXISTS |
| REWARD_EXPIRED | 410 / FAILED_PRECONDITION |
| IDEMPOTENCY_KEY_REUSED | 409 / ALREADY_EXISTS |

---

# 161. Error Leakage Rule

Do not expose:

```text
SQL
stack trace
Kafka broker details
internal table names
provider internals
```

in customer-facing errors.

---

# 162. Events Published

Candidates:

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
RewardFulfillmentFailed
```

Mission events are Phase 17-owned.

---

# 163. PointsEarned Event

Payload may include:

```text
customer_id
points
reference_type
reference_id
rule_code
rule_version
expires_at
```

---

# 164. PointsRedeemed Event

Possible:

```text
customer_id
points
reference_type
reference_id
reservation_id optional
redeemed_at
```

---

# 165. TierChanged Event

Possible:

```text
customer_id
old_tier
new_tier
effective_at
rule_version
```

---

# 166. RewardAssigned Event

Potential consumers:

```text
Notification
Analytics
Promotion fulfillment
Wallet fulfillment
```

depending reward type.

---

# 167. RewardClaimed Event

Represents:

```text
customer claim succeeded
```

Do not publish if fulfillment is not considered successfully complete under the chosen lifecycle.

---

# 168. Events Consumed

Likely:

```text
CustomerCreated
CustomerClosed
OrderCompleted
OrderRefunded / OrderCancelled where relevant
WalletTopUpCompleted if earning rule exists
MissionCompleted
```

---

# 169. OrderCompleted Consumer

Core flow:

```text
Receive
→ validate envelope/version
→ dedupe event
→ evaluate purchase-points rules
→ update points/tier
→ write ledger/lots
→ Outbox
→ mark processed
→ commit
```

---

# 170. OrderCompleted Does Not Block Order

Order is already complete.

If Loyalty consumer is down:

```text
Order remains complete
Kafka lag grows
Loyalty catches up later
```

---

# 171. CustomerCreated Consumer

Possible:

```text
dedupe
create PointsAccount if absent
create baseline tier if policy requires
Outbox if needed
commit
```

---

# 172. OrderRefunded Consumer

If policy requires earning reversal:

```text
find original earning
calculate full/proportional reversal
apply exactly once
ledger correction
Outbox
```

---

# 173. WalletTopUpCompleted Consumer

Only if Loyalty rule says Top-Up earns points.

If only Mission uses Top-Up, defer progress logic to Mission Service.

---

# 174. MissionCompleted Consumer

Possible:

```text
Receive MissionCompleted
→ dedupe
→ resolve reward rule/campaign
→ assign exactly once
→ Outbox RewardAssigned
```

---

# 175. Event Dedupe

Every consumed business event uses:

```text
event_id
consumer_name
```

and business uniqueness where applicable.

---

# 176. Outbox

Loyalty DB transaction creates Outbox rows for published events.

---

# 177. Outbox Event Examples

```text
PointsEarned
PointsRedeemed
PointsExpired
TierUpgraded
RewardAssigned
RewardClaimed
RewardExpired
```

---

# 178. Outbox Reliability

Business state + event publication intent commit together.

Kafka publication occurs afterward.

---

# 179. Inbox / Processed Events

Use:

```text
processed_events
```

with:

```text
event_id
consumer_name
processed_at
```

---

# 180. Consumer Transaction

For event-driven earning:

```text
BEGIN
check processed event
apply loyalty change
insert ledger/lots
insert Outbox
insert processed event
COMMIT
```

---

# 181. Duplicate Event

Same Kafka event arrives again:

```text
processed event exists
→ no-op
```

---

# 182. Semantic Duplicate

Even if producer emits two different event IDs for same Order/rule:

```text
(source_type, source_reference, rule_code)
```

must prevent double earning.

---

# 183. Loyalty Database

Core Phase 16 tables:

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
loyalty_idempotency
processed_events
outbox_events
loyalty_reconciliation_runs
loyalty_reconciliation_mismatches
```

Mission tables are deferred to Phase 17.

---

# 184. points_accounts

Suggested:

```text
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

# 185. points_transactions

Suggested:

```text
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

# 186. points_ledger_entries

Suggested:

```text
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

# 187. points_lots

Suggested:

```text
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

# 188. points_reservations

Suggested:

```text
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

# 189. loyalty_rules

Suggested:

```text
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

---

# 190. JSON Rule Configuration

Use JSON only for truly flexible parameters.

Stable indexed/business-critical fields should remain typed columns where appropriate.

---

# 191. tier_definitions

Suggested:

```text
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

# 192. customer_tiers

Suggested:

```text
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

# 193. tier_history

Suggested:

```text
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

# 194. reward_definitions

Suggested:

```text
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

# 195. reward_assignments

Suggested:

```text
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

# 196. reward_campaigns

Suggested:

```text
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

# 197. reward_campaign_items

Suggested:

```text
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

# 198. loyalty_idempotency

Suggested:

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

# 199. processed_events

Suggested:

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

# 200. outbox_events

Follow Phase 15 platform Outbox standard.

Must include:

```text
event_id
aggregate
event type/version
payload
headers
occurred_at
created_at
published_at
attempt metadata
```

---

# 201. Reconciliation Tables

```text
loyalty_reconciliation_runs
loyalty_reconciliation_mismatches
```

---

# 202. Database Ownership

Only Loyalty writes:

```text
loyalty_db
```

No Order/Wallet/Promotion/Mission direct writes.

---

# 203. No Cross-Service Reads

Loyalty must not directly:

```sql
SELECT ...
FROM order_db;
```

or:

```sql
SELECT ...
FROM customer_db;
```

Use contracts/events.

---

# 204. Balance Concurrency

Use:

```text
atomic conditional update
or
short row lock
```

for points-changing operations.

---

# 205. Lot Concurrency

Account balance update + lot allocation must remain one local DB transaction.

---

# 206. Tier Concurrency

Multiple qualifying events may arrive simultaneously.

Use:

```text
atomic cumulative update
row lock
or optimistic version
```

---

# 207. Reward Allocation Concurrency

Multiple users can hit campaign completion concurrently.

Protect:

```text
quantity limit
quantity_assigned
assignment uniqueness
```

inside the allocation transaction.

---

# 208. Reward Claim Concurrency

Two claim requests on same assignment:

```text
only one fulfillment workflow
```

may start.

---

# 209. Optimistic Locking

Use `version` on mutable aggregate/state rows such as:

```text
points_accounts
points_reservations
customer_tiers
reward_assignments
```

where appropriate.

---

# 210. Database Constraints

Use DB constraints for hard invariants where practical:

```text
UNIQUE customer account
UNIQUE earning reference
UNIQUE reward assignment source
CHECK nonnegative balance
CHECK nonnegative counters
```

---

# 211. Earn Rule Engine

Start simple:

```text
rule_type
+
validated configuration
+
explicit Java policy implementation
```

Avoid a highly dynamic expression engine initially.

---

# 212. Rule Configuration Example

```json
{
  "points_per_usd": 1,
  "minimum_amount": "1.00",
  "rounding": "FLOOR"
}
```

---

# 213. Rule Activation Validation

Before activation:

```text
schema valid
time window valid
currency valid
no conflicting priority
test cases pass
```

---

# 214. Rule Versioning

Do not mutate an active historical rule in place when outcome changes.

Create:

```text
new rule_version
```

with effective dates.

---

# 215. Rule Conflict

If multiple earning rules can apply, explicitly define:

```text
stacking
priority
mutual exclusion
maximum points
```

Decision:

```text
TBD_LOYALTY_POLICY
```

---

# 216. Tier Evaluation Strategy

Implementation may update tier:

```text
on every qualifying event
```

or via:

```text
scheduled recalculation
```

or hybrid.

Exact policy:

```text
TBD_TIER_POLICY
```

---

# 217. Tier Qualification Source Data

Prefer data Loyalty can explain locally from:

```text
consumed event history
loyalty transactions
tier progress state
```

Avoid querying Order DB for every evaluation.

---

# 218. Redis Scope

Redis may later cache:

```text
loyalty summary
tier summary
reward list
```

---

# 219. PostgreSQL Remains Authoritative

Financial-like points state remains:

```text
PostgreSQL
```

Never depend on Redis for correctness.

---

# 220. Redis Failure

Read:

```text
fallback PostgreSQL
```

Write:

```text
must succeed without Redis
```

---

# 221. Phase 20 Dependency

Do not block Phase 16 correctness on Redis.

Redis optimization is implemented in:

```text
Phase 20
```

unless already provided by shared platform infrastructure.

---

# 222. Read Consistency

Points balance after earn/redeem should prefer:

```text
strong read-after-write
```

for customer-visible correctness.

---

# 223. Reward List Consistency

Small eventual consistency may be acceptable for derived/list caches.

Authoritative claim uses PostgreSQL state.

---

# 224. Clean Architecture Layout

Recommended:

```text
loyalty-service/
├── domain/
│   ├── points/
│   ├── ledger/
│   ├── tier/
│   ├── reward/
│   ├── campaign/
│   ├── event/
│   ├── policy/
│   └── exception/
├── application/
│   ├── account/
│   ├── earn/
│   ├── redeem/
│   ├── expiry/
│   ├── tier/
│   ├── reward/
│   ├── query/
│   └── reconciliation/
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   ├── kafka/
│   └── scheduler/
├── adapter/out/
│   ├── persistence/
│   ├── kafka/
│   ├── wallet/
│   ├── promotion/
│   └── customer/
└── config/
```

---

# 225. Domain Layer

Contains:

```text
PointsAccount
PointLot
PointsReservation
Tier
RewardAssignment
RewardCampaign
domain policies
domain events
```

No Spring/Kafka/JPA dependency.

---

# 226. Application Layer

Coordinates:

```text
transactions
repositories
ports
idempotency
events
workers
```

---

# 227. Inbound Adapters

```text
REST
gRPC
Kafka
Scheduler
```

---

# 228. Outbound Adapters

```text
PostgreSQL
Kafka Outbox publisher
Wallet reward fulfillment client
Promotion reward fulfillment client
Customer query client if needed
```

---

# 229. Input Ports

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
ExpirePointsUseCase
ExpireRewardsUseCase
ReconcileLoyaltyUseCase
```

---

# 230. Output Ports

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
OutboxPort
ProcessedEventPort
WalletRewardPort
CouponRewardPort
ClockPort
```

---

# 231. Persistence Adapter Rule

JPA entities stay inside persistence adapter.

Domain objects remain persistence-independent.

---

# 232. Kafka Listener Rule

Listener stays thin:

```text
deserialize
validate envelope
invoke application use case
map/classify result
```

---

# 233. Scheduler Rule

Expiry/reconciliation schedulers invoke application use cases.

They do not contain domain logic.

---

# 234. Loyalty Admin Permissions

Source candidates:

```text
loyalty.read
loyalty.adjust
loyalty.rule.manage
loyalty.tier.manage
loyalty.reward.manage
loyalty.campaign.manage
loyalty.reconcile
```

Mission admin permission moves to Phase 17.

---

# 235. Sensitive Admin Operations

Stronger audit for:

```text
points adjustment
reward quantity change
campaign activation
tier override
manual reward assignment
```

---

# 236. Manual Reward Assignment

Capture:

```text
customer
reward
reason
actor
ticket/reference
```

and keep retry idempotent.

---

# 237. Customer Authorization

A customer may:

```text
read own loyalty
read own statement
read own rewards
claim own assignment
```

A customer may not:

```text
adjust points
claim another customer's reward
change tier
edit reward inventory
```

---

# 238. Data Classification

Likely:

```text
CONFIDENTIAL
customer loyalty history
points balance
reward history

INTERNAL
rule configuration
campaign distribution
```

---

# 239. Privacy

Minimize direct PII.

Prefer:

```text
customer_id
```

rather than duplicated phone/email/name.

---

# 240. Ledger Retention

May require long retention for:

```text
balance explanation
support
fraud
reconciliation
```

Exact retention:

```text
TBD_RETENTION_POLICY
```

---

# 241. Reward History Retention

Keep long enough to resolve customer disputes and fulfillment questions.

---

# 242. Reconciliation Goal

Prove that:

```text
account balance
ledger
point lots
reservations
reward counters
reward assignments
```

agree.

---

# 243. Points Balance Reconciliation

Formula:

```text
opening balance
+
SUM(points_delta)
=
available + reserved
```

depending final ledger semantics.

---

# 244. Lot Reconciliation

If every available point belongs to a lot:

```text
SUM(active remaining lot points)
=
available_points
```

---

# 245. Reservation Reconciliation

```text
SUM(active reservation remaining)
=
reserved_points
```

---

# 246. Reward Distribution Reconciliation

Per campaign:

```text
assignment count
=
quantity_assigned
```

for each reward, except explicitly documented pending states.

---

# 247. Reward Claim Reconciliation

Detect:

```text
assignment FULFILLED but no downstream benefit
downstream benefit exists but assignment pending
claimed count mismatch
```

where applicable.

---

# 248. Mission Reward Reconciliation

Phase 17 integration check:

```text
Mission COMPLETED requiring reward
but no reward assignment
```

and:

```text
reward assignment sourced from Mission
but no matching completion
```

through service contracts/events, not DB joins.

---

# 249. No Silent Repair

Do not directly change balances/counters to hide mismatch.

Use:

```text
approved adjustment
corrective transaction
rebuild projection
audited repair
```

---

# 250. Reconciliation Run

Possible fields:

```text
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

# 251. Reconciliation Mismatch

Possible:

```text
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

# 252. Reconciliation Frequency

Possible:

```text
continuous targeted checks
hourly
daily full scan
```

Exact schedule:

```text
TBD_OPERATIONS_POLICY
```

---

# 253. Auto-Repair Policy

Only auto-repair when:

```text
safe
idempotent
well-understood
```

Financial-like balance corrections should generally be explicit and audited.

---

# 254. Business Metrics

Candidate:

```text
points_earned_total
points_redeemed_total
points_expired_total
reward_assigned_total
reward_claimed_total
tier_upgrade_total
```

---

# 255. Technical Metrics

Candidate:

```text
earn_processing_failure_total
duplicate_event_total
points_reserve_conflict_total
reward_allocation_conflict_total
reward_fulfillment_failure_total
reconciliation_mismatch_total
outbox_oldest_age
consumer_lag
```

---

# 256. Balance Metrics Warning

Do not use raw customer IDs as metric labels.

Avoid high cardinality.

---

# 257. Loyalty SLIs

Potential:

```text
GET loyalty availability
earn event processing success
earn event processing latency
reward claim success
reward fulfillment latency
Kafka consumer lag age
reconciliation mismatch rate
```

---

# 258. SLO Targets

Remain:

```text
TBD_SLO
```

Do not invent production targets from architecture examples.

---

# 259. Alerts

Candidate:

```text
OrderCompleted consumer lag high
earn failures spike
Outbox backlog
points reconciliation mismatch
reward over-allocation attempt spike
reward fulfillment stuck
expiry worker stalled
DB pool saturation
```

---

# 260. Dashboard

Show:

```text
points earn/redeem/expire
consumer lag
Outbox backlog
reward assignment/claim
fulfillment pending
tier changes
reconciliation mismatches
DB health
```

---

# 261. Structured Logging

Include where appropriate:

```text
customer_id masked/controlled
account_id
transaction_id
ledger_entry_id
assignment_id
event_id
correlation_id
rule_code
rule_version
result
error_code
```

---

# 262. Sensitive Logging

Do not log full:

```text
customer profile
access tokens
Wallet secrets
coupon secrets
```

---

# 263. Distributed Tracing

Trace:

```text
Kafka consume OrderCompleted
→ Loyalty earn use case
→ PostgreSQL
→ Outbox
```

and reward fulfillment calls to Wallet/Promotion.

---

# 264. Required Runbooks

```text
OrderCompleted consumer lag
Duplicate earning investigation
Points balance mismatch
Point lot mismatch
Expiry worker stalled
Reward allocation contention
Reward fulfillment stuck
Reward claim dispute
Outbox backlog
Reconciliation mismatch
```

---

# 265. Duplicate Earning Runbook

```text
identify customer/order/rule
check processed_events
check business uniqueness
check points transaction
check ledger
verify producer duplication
apply correction only if duplicate effect exists
```

---

# 266. Balance Mismatch Runbook

```text
freeze risky manual action if needed
compare account vs ledger
compare lots
compare reservations
identify first divergence
create audited correction
re-run reconciliation
```

---

# 267. Reward Fulfillment Runbook

```text
inspect assignment
inspect downstream stable reference
query Wallet/Promotion status
retry same assignment reference if safe
do not create new reward effect
```

---

# 268. Backup Scope

Back up:

```text
points accounts
transactions
ledger
point lots
reservations
rules
tier state/history
reward definitions
reward assignments
campaigns
idempotency
processed events
Outbox
reconciliation history
```

---

# 269. Restore Risk

Database restore may rewind Loyalty while Kafka/downstream domains remain ahead.

---

# 270. Restore Rule

After restore:

```text
reconcile points/ledger
verify processed-event window
verify Outbox
verify reward fulfillment references
control Kafka replay
```

before normal high-risk repair.

---

# 271. Kafka Replay After Restore

Inbox/business uniqueness must make duplicate events safe.

---

# 272. Reward Replay Safety

`MissionCompleted` replay must not assign a second reward.

`RewardAssigned` replay must not create a second Wallet credit/coupon.

---

# 273. Flyway Migrations

Suggested sequence:

```text
V1__create_points_accounts.sql
V2__create_points_transactions.sql
V3__create_points_ledger_entries.sql
V4__create_points_lots.sql
V5__create_points_reservations.sql
V6__create_loyalty_rules.sql
V7__create_tier_tables.sql
V8__create_reward_tables.sql
V9__create_loyalty_idempotency.sql
V10__create_processed_events.sql
V11__create_outbox_events.sql
V12__create_reconciliation_tables.sql
```

Adjust to repository migration numbering.

---

# 274. Expand/Contract Migration

Use backward-compatible DB migration during rolling deployment.

Avoid dropping columns still used by old replicas.

---

# 275. Legacy Migration

Legacy loyalty migration may require:

```text
customer/card mapping
opening points balance
historical or summarized ledger strategy
expiry lots
tier mapping
existing rewards
dedupe source references
```

Exact mapping requires legacy source analysis.

---

# 276. Opening Balance Migration

If full historic ledger cannot be imported:

```text
OPENING_BALANCE
```

may establish auditable starting state.

Document provenance.

---

# 277. Migration Reconciliation

Before cutover verify:

```text
customer count
points balance totals
sample customer histories
tiers
active rewards
expired points
duplicate mappings
```

---

# 278. Migration Freeze / Delta

Migration must define how changes occurring during cutover are captured:

```text
freeze
CDC/delta
dual-write bridge
event replay
```

Exact strategy:

```text
TBD_MIGRATION_PLAN
```

---

# 279. Testing Strategy

Required:

```text
Domain
Application
Persistence
Concurrency
Idempotency
Event Consumers
Earn
Redeem
Expiry
Tier
Reward
Reconciliation
Load
Failure
Security
Migration
```

---

# 280. Points Domain Tests

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
closed account
```

---

# 281. Earn Idempotency Tests

Same `OrderCompleted` event:

```text
once
twice
concurrently
```

must create one earning effect.

---

# 282. Semantic Duplicate Earn Test

Two different event IDs for same:

```text
Order + Rule
```

must still credit once.

---

# 283. Redemption Concurrency Test

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

# 284. Expiry Tests

Test:

```text
due lot
future lot
already consumed
already expired
expiry + redeem race
```

---

# 285. FEFO Tests

Verify nearest expiry is consumed first.

Verify release restores correct lot allocations.

---

# 286. Tier Tests

Test:

```text
upgrade threshold
boundary value
downgrade policy
window expiration
rule version
concurrent qualifying events
```

---

# 287. Reward Assignment Tests

Test:

```text
eligible assignment
duplicate assignment
quantity limit
concurrent allocation
inactive campaign
expired campaign
```

---

# 288. Weighted Distribution Tests

Simulate large sample:

```text
configured weights
vs
actual assignments
```

Verify expected statistical behavior for chosen algorithm.

---

# 289. Proportional Distribution Tests

Test:

```text
under-assigned reward chosen
exhausted reward skipped
tie behavior
controlled randomness bounds
```

---

# 290. Reward Claim Tests

Test:

```text
claim success
duplicate claim
expired assignment
cross-customer claim
fulfillment failure
retry fulfillment
Wallet credit idempotency
coupon creation idempotency
```

---

# 291. Persistence Tests

Use PostgreSQL Testcontainers for:

```text
one customer account
append-only ledger behavior
point-lot constraints
reward assignment uniqueness
campaign counters
Flyway migrations
```

---

# 292. Kafka Tests

Test:

```text
CustomerCreated
OrderCompleted
OrderRefunded
MissionCompleted
duplicate event
consumer retry
DLQ
replay
```

---

# 293. Reconciliation Tests

Intentionally create:

```text
ledger vs balance mismatch
lots vs available mismatch
reservation vs reserved mismatch
reward counter mismatch
Mission completion vs reward assignment mismatch
```

Verify detection.

---

# 294. Load Tests

Scenarios:

```text
large OrderCompleted burst
reward assignment spike
points balance reads
expiry batch
reward claim spike
reconciliation scan
```

---

# 295. Hot Campaign Test

Thousands of users qualify simultaneously.

Verify:

```text
quantity limits
no over-allocation
distribution behavior
acceptable lock contention
```

---

# 296. Failure Tests

Inject:

```text
Kafka duplicate
DB timeout
deadlock
process crash after ledger commit
Outbox failure
Wallet fulfillment timeout
Coupon fulfillment timeout
```

Verify safe recovery.

---

# 297. Crash After DB Commit

If consumer DB commits but Kafka offset does not:

```text
event replays
Inbox makes no duplicate effect
```

---

# 298. Crash During Reward Fulfillment

If downstream Wallet/Promotion fulfilled but Loyalty did not record response:

```text
resolve by assignment reference
do not issue second independent effect
```

---

# 299. Security Tests

Verify:

```text
customer cannot adjust own points
admin permission required
manual reward assignment audited
cross-customer claim blocked
client cannot set points total
unauthorized service cannot call adjustment/fulfillment commands
```

---

# 300. Definition of Done — Earn

- [ ] Rule defined.
- [ ] Rule versioned.
- [ ] Source event identified.
- [ ] Eligibility defined.
- [ ] Eligible amount defined.
- [ ] Rounding defined.
- [ ] Idempotency implemented.
- [ ] Ledger written.
- [ ] Point lot created if expiry applies.
- [ ] Tier impact implemented.
- [ ] Outbox event written.
- [ ] Reconciliation covers it.
- [ ] Tests pass.

---

# 301. Definition of Done — Redeem

- [ ] Available-points validation.
- [ ] FEFO lot allocation if expiry lots are used.
- [ ] Reservation/capture/release model if checkout redemption is enabled.
- [ ] Idempotency.
- [ ] Concurrency protection.
- [ ] Ledger.
- [ ] Release/cancel behavior.
- [ ] UNKNOWN recovery.
- [ ] Tests.

---

# 302. Definition of Done — Tier

- [ ] Qualification metric.
- [ ] Window.
- [ ] Thresholds.
- [ ] Upgrade behavior.
- [ ] Downgrade behavior.
- [ ] Versioning.
- [ ] History.
- [ ] Concurrency.
- [ ] Event.
- [ ] Tests.

---

# 303. Definition of Done — Reward Assignment

- [ ] Source.
- [ ] Eligibility.
- [ ] Campaign validity.
- [ ] Quantity limit.
- [ ] Selection algorithm.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Assignment expiry.
- [ ] Outbox event.
- [ ] Reconciliation.
- [ ] Tests.

---

# 304. Definition of Done — Reward Claim

- [ ] Assignment ownership.
- [ ] Expiry validation.
- [ ] Idempotency.
- [ ] State machine.
- [ ] Downstream stable reference.
- [ ] Failure/UNKNOWN recovery.
- [ ] Final status.
- [ ] Audit.
- [ ] Tests.

---

# 305. Ownership Review Checklist

- [ ] Points owned only by Loyalty.
- [ ] Wallet remains monetary.
- [ ] Ordering remains Order fact owner.
- [ ] Promotion owns coupon/discount transaction behavior.
- [ ] Mission owns mission progress/completion.
- [ ] Notification owns delivery.
- [ ] Customer remains customer-profile authority.

---

# 306. Points Review Checklist

- [ ] Immutable ledger.
- [ ] Earn idempotency.
- [ ] Redeem concurrency.
- [ ] Expiry.
- [ ] FEFO.
- [ ] Reversal.
- [ ] Adjustment audit.
- [ ] Reconciliation.

---

# 307. Reward Review Checklist

- [ ] Assignment unique.
- [ ] Quantity protected.
- [ ] Claim idempotent.
- [ ] Fulfillment recoverable.
- [ ] Expiry race protected.
- [ ] Distribution reconciled.
- [ ] Downstream ownership respected.

---

# 308. Data Review Checklist

- [ ] One account/customer.
- [ ] Ledger append-only.
- [ ] Lots if expiry used.
- [ ] Reservation constraints if enabled.
- [ ] Reward assignment uniqueness.
- [ ] Campaign counters.
- [ ] Processed events.
- [ ] Outbox.
- [ ] Reconciliation tables.

---

# 309. Contract Review Checklist

- [ ] Loyalty summary.
- [ ] Statement.
- [ ] Reserve/capture/release points where required.
- [ ] Reward list/claim.
- [ ] Admin adjustment.
- [ ] Stable errors.
- [ ] Event schemas.
- [ ] Idempotency semantics.
- [ ] No client-authoritative balance.

---

# 310. Security Review Checklist

- [ ] Admin adjustments restricted.
- [ ] Manual reward assignment audited.
- [ ] Cross-customer access blocked.
- [ ] Client balance never trusted.
- [ ] Reward fulfillment authenticated.
- [ ] Service authorization enforced.
- [ ] Sensitive logs minimized.
- [ ] Backup protected.

---

# 311. Operations Review Checklist

- [ ] Metrics.
- [ ] SLOs.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Kafka lag.
- [ ] Expiry worker.
- [ ] Reward fulfillment worker.
- [ ] Reconciliation.
- [ ] Backup/restore.
- [ ] Runbooks.
- [ ] Outbox monitoring.

---

# 312. Production Readiness Checklist

Before production:

- [ ] Duplicate earning tests pass.
- [ ] Semantic duplicate tests pass.
- [ ] Concurrent redemption tests pass if redemption enabled.
- [ ] Point expiry tested.
- [ ] Reward quantity concurrency tested.
- [ ] Distribution simulation passed.
- [ ] Reward claim idempotency tested.
- [ ] External reward fulfillment recovery tested.
- [ ] Reconciliation tested.
- [ ] Backup/restore tested.
- [ ] Kafka replay tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.
- [ ] Rule/tier/reward policy decisions frozen.

---

# 313. Initial Implementation Order

Adapted from the source to the current implementation roadmap:

```text
1. Bootstrap loyalty-service
2. loyalty_db + Flyway
3. PointsAccount aggregate
4. Immutable points ledger
5. CustomerCreated account creation
6. OrderCompleted consumer
7. Earn rule engine
8. Earn idempotency
9. Points lots / expiry
10. Loyalty summary
11. Points statement
12. Tier model
13. Tier history/versioning
14. Reward definitions
15. Reward campaigns/items
16. Reward assignment
17. Reward distribution
18. Reward claim state machine
19. POINTS reward fulfillment
20. WALLET_CREDIT fulfillment integration
21. COUPON fulfillment integration
22. Reversal / refund earning correction
23. Optional reserve/capture/release points
24. Reconciliation
25. Admin tools
26. Observability/runbooks
27. Full tests/load/failure tests
28. Production readiness review
29. Handoff to Phase 17 Mission
```

---

# 314. Minimum Production-Capable Loyalty Scope

Required:

```text
Points Account
Immutable Points Ledger
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
Authorization/audit
Observability
Testing
```

---

# 315. Conditional Scope — Points Redemption

If current product checkout uses points as spendable value:

```text
ReservePoints
CapturePoints
ReleasePoints
FEFO allocation
reservation expiry
Saga integration
```

must be included.

Otherwise it may remain a later Loyalty enhancement.

---

# 316. Conditional Scope — Wallet/Coupon Reward

If active rewards include:

```text
WALLET_CREDIT
COUPON
```

implement fulfillment integrations in Phase 16.

If not currently used, keep contract-ready but do not overbuild.

---

# 317. Explicitly Deferred to Phase 17

Mission implementation:

```text
mission definitions
mission progress
journey eligibility
campaign mission rules
mission period
mission completion
mission UI/admin rules
mission translations
```

belongs to Phase 17.

---

# 318. Explicitly Deferred to Phase 20

Redis optimization:

```text
loyalty summary cache
reward list cache
tier cache
cache invalidation
```

belongs to Phase 20.

---

# 319. Future Loyalty Enhancements

Source candidates:

```text
advanced tiering
family points
referral
birthday rewards
personalized loyalty rules
advanced segmentation
AI-assisted offer selection
cross-brand loyalty
partner rewards
```

Points reservation/redemption is future only if not required now.

---

# 320. Phase 16 Work Breakdown

Suggested tickets:

```text
LOY-001 Bootstrap loyalty-service
LOY-002 Create loyalty_db
LOY-003 Add Flyway baseline
LOY-004 Implement PointsAccount aggregate
LOY-005 Implement account statuses/invariants
LOY-006 Create points_accounts table
LOY-007 Create points_transactions table
LOY-008 Create immutable points_ledger_entries
LOY-009 Create points_lots
LOY-010 Create processed_events
LOY-011 Create Outbox
LOY-012 Implement CustomerCreated consumer
LOY-013 Add customer-account uniqueness
LOY-014 Implement loyalty rule model
LOY-015 Implement rule activation validation
LOY-016 Implement rule versioning
LOY-017 Implement OrderCompleted consumer
LOY-018 Implement purchase-points rule
LOY-019 Implement eligible amount policy hook
LOY-020 Implement rounding policy
LOY-021 Implement earn business uniqueness
LOY-022 Implement event Inbox dedupe
LOY-023 Implement earn local transaction
LOY-024 Implement PointsEarned event
LOY-025 Implement points-lot creation
LOY-026 Implement FEFO ordering
LOY-027 Implement expiry worker
LOY-028 Implement PointsExpired event
LOY-029 Implement expiry reminder metadata
LOY-030 Implement GET /api/v1/loyalty
LOY-031 Implement statement endpoint
LOY-032 Add statement pagination
LOY-033 Implement tier definitions
LOY-034 Implement customer tier state
LOY-035 Implement tier history
LOY-036 Implement tier evaluation
LOY-037 Implement TierUpgraded event
LOY-038 Implement tier downgrade policy hook
LOY-039 Implement reward definitions
LOY-040 Implement reward campaigns
LOY-041 Implement reward campaign items
LOY-042 Validate campaign windows
LOY-043 Validate reward weights
LOY-044 Implement assignment uniqueness
LOY-045 Implement atomic quantity allocation
LOY-046 Implement weighted-random strategy
LOY-047 Implement proportional strategy
LOY-048 Implement controlled-random strategy hook
LOY-049 Implement reward assignment transaction
LOY-050 Implement RewardAssigned event
LOY-051 Implement reward list endpoint
LOY-052 Implement reward claim endpoint
LOY-053 Implement claim state machine
LOY-054 Implement claim idempotency
LOY-055 Implement POINTS reward fulfillment
LOY-056 Implement Wallet reward port
LOY-057 Implement Wallet fulfillment adapter
LOY-058 Implement Promotion reward port
LOY-059 Implement Coupon fulfillment adapter
LOY-060 Implement fulfillment retry/recovery
LOY-061 Implement RewardClaimed event
LOY-062 Implement reward expiry worker
LOY-063 Implement RewardExpired event
LOY-064 Implement OrderRefunded consumer
LOY-065 Implement earned-point reversal
LOY-066 Implement adjustment use case
LOY-067 Implement admin adjustment API
LOY-068 Implement adjustment audit
LOY-069 Implement admin reward assignment
LOY-070 Implement tier override if approved
LOY-071 Implement ReservePoints if required
LOY-072 Implement points_reservations table
LOY-073 Implement atomic points reserve
LOY-074 Implement CapturePoints
LOY-075 Implement ReleasePoints
LOY-076 Implement reservation query-by-reference
LOY-077 Integrate Ordering Saga if redemption enabled
LOY-078 Implement loyalty idempotency store
LOY-079 Implement reconciliation runs
LOY-080 Implement ledger/balance reconciliation
LOY-081 Implement lot reconciliation
LOY-082 Implement reservation reconciliation
LOY-083 Implement reward-counter reconciliation
LOY-084 Implement Mission reward reconciliation contract
LOY-085 Implement reconciliation admin query
LOY-086 Add account/customer authorization
LOY-087 Add loyalty.read permission
LOY-088 Add loyalty.adjust permission
LOY-089 Add loyalty.rule.manage permission
LOY-090 Add loyalty.tier.manage permission
LOY-091 Add loyalty.reward.manage permission
LOY-092 Add loyalty.campaign.manage permission
LOY-093 Add loyalty.reconcile permission
LOY-094 Implement structured logging
LOY-095 Implement traces
LOY-096 Implement business metrics
LOY-097 Implement technical metrics
LOY-098 Implement dashboard
LOY-099 Implement alerts
LOY-100 Write duplicate-earning runbook
LOY-101 Write balance-mismatch runbook
LOY-102 Write reward-fulfillment runbook
LOY-103 Write expiry-worker runbook
LOY-104 Write reconciliation runbook
LOY-105 Implement domain tests
LOY-106 Implement earn idempotency tests
LOY-107 Implement semantic duplicate tests
LOY-108 Implement expiry tests
LOY-109 Implement FEFO tests
LOY-110 Implement tier tests
LOY-111 Implement reward assignment tests
LOY-112 Implement distribution simulation tests
LOY-113 Implement reward claim tests
LOY-114 Implement PostgreSQL Testcontainers tests
LOY-115 Implement Kafka consumer tests
LOY-116 Implement Outbox/Inbox tests
LOY-117 Implement reconciliation tests
LOY-118 Implement security tests
LOY-119 Implement concurrency tests
LOY-120 Implement hot-campaign load test
LOY-121 Implement failure tests
LOY-122 Implement backup/restore test
LOY-123 Implement replay test
LOY-124 Prepare legacy migration
LOY-125 Run migration reconciliation
LOY-126 Complete ADRs/policy freeze
LOY-127 Phase 16 exit review
```

---

# 321. Loyalty ADRs

Recommended:

```text
ADR-LOY-001 Points account creation
ADR-LOY-002 Points integer/decimal model
ADR-LOY-003 Ledger delta semantics
ADR-LOY-004 Point expiry model
ADR-LOY-005 FEFO lot consumption
ADR-LOY-006 Earn eligible amount
ADR-LOY-007 Earn rounding
ADR-LOY-008 Earn rule versioning
ADR-LOY-009 Points redemption model
ADR-LOY-010 Reservation/capture/release
ADR-LOY-011 Refund/reversal policy
ADR-LOY-012 Negative/debt policy
ADR-LOY-013 Tier qualification metric
ADR-LOY-014 Tier evaluation window
ADR-LOY-015 Tier downgrade
ADR-LOY-016 Reward lifecycle
ADR-LOY-017 Reward fulfillment ownership
ADR-LOY-018 Reward distribution algorithm
ADR-LOY-019 Reward quantity concurrency
ADR-LOY-020 Reward expiry
ADR-LOY-021 Mission integration boundary
ADR-LOY-022 Promotion integration boundary
ADR-LOY-023 Reconciliation model
ADR-LOY-024 Legacy migration
```

---

# 322. Phase 16 Policy Freeze Checklist

Before production resolve:

- [ ] Account creation: event-driven vs lazy.
- [ ] Points integer vs exact decimal.
- [ ] Points expiry duration.
- [ ] Whether all points use lots.
- [ ] Ledger reservation semantics.
- [ ] Eligible spend basis.
- [ ] Tax/delivery-fee treatment.
- [ ] Currency conversion rule.
- [ ] Earn rounding.
- [ ] Rule stacking/priority.
- [ ] Points redemption enabled now or later.
- [ ] Reservation TTL.
- [ ] Partial point capture/release allowed?
- [ ] Refund earning reversal policy.
- [ ] Negative/debt policy.
- [ ] Tier names.
- [ ] Tier qualification metric.
- [ ] Tier evaluation window.
- [ ] Tier downgrade/grace policy.
- [ ] Tier override allowed?
- [ ] Reward types enabled.
- [ ] Claim expiry policy.
- [ ] Auto-assign policy.
- [ ] Auto-claim policy if any.
- [ ] Reward distribution algorithm.
- [ ] Reward weight semantics.
- [ ] Reward quantity rules.
- [ ] Overlapping campaign priority.
- [ ] Wallet reward fulfillment contract.
- [ ] Coupon reward fulfillment contract.
- [ ] Customer closure loyalty treatment.
- [ ] Retention periods.
- [ ] Reconciliation frequency.
- [ ] Auto-repair scope.
- [ ] SLO/alerts.
- [ ] Legacy migration approach.

---

# 323. Phase 16 Acceptance — Ownership

Team can answer:

```text
What is Loyalty authoritative for?
What remains Wallet?
What remains Promotion?
What is deferred to Mission?
```

---

# 324. Acceptance — Earn Exactly Once

Send the same completed-order fact:

```text
twice
concurrently
with same event ID
with different event IDs but same Order reference
```

Expected:

```text
one points earning
one ledger effect
one lot set
```

---

# 325. Acceptance — Ledger Explainability

For any customer balance:

```text
account balance
```

can be explained by:

```text
opening state
+
immutable ledger entries
```

---

# 326. Acceptance — Expiry

Expired points:

```text
cannot be redeemed
```

and expiry creates an auditable ledger effect.

---

# 327. Acceptance — FEFO

When multiple lots exist:

```text
nearest expiry
```

is consumed first.

---

# 328. Acceptance — Tier

For a customer:

```text
current tier
```

can be explained by:

```text
qualification value
rule version
evaluation window
history
```

---

# 329. Acceptance — Reward Assignment

Concurrent qualification does not:

```text
assign duplicate reward
over-allocate quantity
```

---

# 330. Acceptance — Reward Claim

Repeated claim does not:

```text
credit points twice
credit Wallet twice
create coupon twice
```

---

# 331. Acceptance — External Reward UNKNOWN

If Wallet/Promotion succeeds but response is lost:

```text
Loyalty recovers using assignment_id
```

without creating a second benefit.

---

# 332. Acceptance — Reconciliation

System detects:

```text
ledger vs balance mismatch
lot vs available mismatch
reservation vs reserved mismatch
reward assignment counter mismatch
missing Mission-sourced reward assignment
```

---

# 333. Acceptance — Kafka Replay

Replay of `OrderCompleted` does not:

```text
re-earn points
```

Replay of `MissionCompleted` does not:

```text
re-assign reward
```

---

# 334. Acceptance — Security

Customer cannot:

```text
set own points
adjust own points
claim another customer's reward
```

Admin actions are authorized and audited.

---

# 335. Acceptance — Failure Recovery

Crash scenarios do not produce:

```text
missing ledger
double earning
double reward
double fulfillment
```

---

# 336. Acceptance — Production Operations

Operators can answer:

```text
Is Loyalty consumer lagging?
Is Outbox stuck?
Is expiry worker healthy?
Are rewards stuck pending?
Are balances reconciling?
```

without direct DB editing.

---

# 337. Phase 16 Completion Tree

```text
PHASE 16 — LOYALTY SERVICE

├── Service Boundary                         ✅
├── Points vs Wallet Separation              ✅
├── PointsAccount Aggregate                  ✅
├── Account Status / Invariants              ✅
├── Immutable Points Ledger                  ✅
├── Points Transactions                      ✅
├── Point Lots                               ✅
├── FEFO Consumption                         ✅
├── Event-Driven Earning                     ✅
├── Earn Rules / Versioning                  ✅
├── Earn Idempotency                         ✅
├── Points Expiry                            ✅
├── Expiry Reminders                         ✅
├── Reversal / Adjustment                    ✅
├── Optional Redemption                      ✅
│   ├── Reserve
│   ├── Capture
│   └── Release
├── Tier Model                               ✅
├── Tier History / Versioning                ✅
├── Reward Definitions                       ✅
├── Reward Campaigns                         ✅
├── Reward Distribution                      ✅
├── Quantity Concurrency                     ✅
├── Reward Assignment                        ✅
├── Reward Claim                             ✅
├── Reward Expiry                            ✅
├── POINTS Fulfillment                       ✅
├── WALLET_CREDIT Integration                ✅
├── COUPON Integration                       ✅
├── REST / gRPC Contracts                    ✅
├── Kafka Consumers                          ✅
├── Outbox / Inbox                           ✅
├── PostgreSQL Schema                        ✅
├── Clean Architecture                       ✅
├── Security / RBAC / Audit                  ✅
├── Privacy / Retention                      ✅
├── Reconciliation                           ✅
├── Metrics / Alerts / Dashboard             ✅
├── Runbooks                                 ✅
├── Backup / Restore                         ✅
├── Flyway / Migration                       ✅
├── Concurrency / Failure Tests              ✅
├── Production Readiness                     ✅
└── Mission Handoff                          ✅
```

---

# 338. Handoff to Phase 17

The next implementation document is:

```text
PHASE 17 — Mission Service
```

---

# 339. Phase 17 Ownership

Mission will own:

```text
Mission Definition
Journey vs Campaign
Eligibility
User Period
Mission Period
Progress
COUNT / SUM / DISTINCT_COUNT / FIRST_OCCURRENCE
Completion
Expiry / Reset
Localized progress messages
Mission admin configuration
Mission reconciliation
```

---

# 340. Phase 17 → Loyalty Integration

Mission will emit/trigger a stable completion fact such as:

```text
MissionCompleted
```

Loyalty will then:

```text
dedupe
assign reward exactly once
fulfill through the correct domain
```

---

# 341. Phase 17 Must Not Own Points Ledger

Mission may decide:

```text
customer completed mission
```

but Loyalty decides:

```text
how reward points are credited
```

and records the immutable points ledger.

---

# 342. Phase 17 Must Not Own Wallet Credit

Mission/Loyalty cannot write Wallet DB.

Reward fulfillment:

```text
Mission completion
→ Loyalty reward assignment
→ Wallet command
```

where reward type requires it.

---

# 343. Phase 17 Must Not Own Coupon Redemption

Coupon artifact and redemption remain Promotion-owned.

---

# 344. Final Phase 16 Principle

The core points lifecycle is:

```text
Qualifying Event
      ↓
Idempotent Earn Rule
      ↓
Immutable Ledger
      ↓
Available Points
      ↓
FEFO / Expiry
      ↓
Optional Reserve / Redeem
```

Reward lifecycle:

```text
Qualifying Source
      ↓
Reward Selection
      ↓
Idempotent Assignment
      ↓
Claim
      ↓
Idempotent Fulfillment
      ↓
Final Reward State
```

The most important implementation rules are:

```text
Points are not Wallet money.
Loyalty owns points; no other service writes loyalty_db.
Every point movement has an immutable ledger explanation.
Earn is idempotent by source business reference and event ID.
Expired points cannot be redeemed.
Point lots use deterministic FEFO when expiry applies.
Concurrent redemption never overspends points.
Rule versions remain explainable historically.
Tier state is derived from explicit versioned rules.
Reward assignment is idempotent.
Reward quantities are concurrency-safe.
Reward claim is idempotent.
External reward fulfillment uses stable assignment_id.
UNKNOWN fulfillment is resolved rather than duplicated.
Promotion owns coupons and transaction-time discounts.
Mission owns mission progress in Phase 17.
Notification owns customer communication delivery.
Kafka replay does not duplicate earning or reward assignment.
Reconciliation proves ledger/balance/lot/reward correctness.
Repairs are explicit, corrective, and audited.
Redis never becomes authoritative for points.
```

---

**End of PHASE 16 — Loyalty Service**
