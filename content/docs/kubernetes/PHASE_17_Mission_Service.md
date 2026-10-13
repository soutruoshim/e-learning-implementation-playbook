---
title: "PHASE 17 — Mission Service"
---

# PHASE 17 — Mission Service

> **Purpose:** Implement the Mission Service as the platform’s customer goal/progress engine. This phase defines Mission definitions, Journey vs Campaign behavior, eligibility, user-period rules, progress calculation, event-driven processing, distinct-value tracking, completion, expiry/reset/cycles, reward triggering, localized progress messaging, customer/admin APIs, persistence, idempotency, concurrency, reconciliation, security, observability, testing, migration, and production readiness.
>
> **Previous Phase:** Phase 16 — Loyalty Service
>
> **Next Phase:** Phase 18 — Notification Service
>
> **Primary Architecture Basis:** PART 18 — Mission Service, supported by the completed implementation phases for Customer, Ordering, Wallet, Promotion, Loyalty, Service Communication, Distributed Transactions / Saga, and Kafka / Event Architecture.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, REST, Kafka, Flyway, Redis later where appropriate.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 17 Goal

Build a production-capable Mission Service that can answer:

```text
Which missions exist?
Which missions are visible to this customer?
Is this customer eligible?
When does this customer's mission period begin?
Which source event changes progress?
How is progress calculated?
Has the target been reached?
Has completion already happened?
Has the reward already been triggered/assigned?
Has this progress expired?
Should the mission reset or start a new cycle?
Which localized progress message should be shown?
```

---

# 2. Mission Ownership

Mission owns:

```text
Mission Definition
Mission Type
Journey Mission
Campaign Mission
Mission Eligibility
User Period
Mission Start / End
Mission Conditions
Progress Calculation
Progress State
Progress Events
Distinct-Value Tracking
Mission Completion
Mission Expiry
Mission Reset / Cycle
Reward Trigger
Reward Assignment Reference
Progress Messages
Mission Translation References
Mission Admin Configuration
Mission Reconciliation
Mission Events
```

---

# 3. Mission Non-Responsibilities

Mission does not own:

```text
Order lifecycle
Wallet balance
Points balance
Coupon discount rules
Customer profile master
Notification delivery
Product catalog
```

---

# 4. Source Facts

Mission consumes authoritative facts such as:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
CustomerCreated / CustomerRegistered
RewardAssigned
RewardClaimed
RewardExpired
```

depending on configured missions/projections.

---

# 5. Fundamental Boundary Rule

```text
Mission owns progress.
Source services own source business facts.
```

Mission must not infer business state by reading another service’s private database.

---

# 6. Implementation Deployment Boundary

The source allows Mission to be a logical module inside Loyalty initially.

The approved implementation roadmap treats Mission as its own Phase 17 service boundary.

Therefore implement as:

```text
mission-service
```

with contracts that still permit future co-deployment if ever desired.

---

# 7. High-Level Boundary

```text
Order / Wallet / Feedback / Customer
                 │
                 ▼
             Kafka Events
                 │
                 ▼
           Mission Service
      ┌──────────┼───────────┐
      │          │           │
      ▼          ▼           ▼
 Eligibility  Progress    Completion
      │          │           │
      └──────────┼───────────┘
                 ▼
            mission_db
                 │
                 ▼
          Loyalty / Reward
```

---

# 8. Ubiquitous Language

| Term | Meaning |
|---|---|
| Mission | Configured customer goal |
| Journey | Onboarding/lifecycle mission type |
| Campaign | Broader/time-bounded engagement mission type |
| Mission Definition | Configuration describing what must be done |
| Mission Progress | Customer-specific state toward completion |
| Mission Event | Source business event used to update progress |
| Condition | Requirement applied to event/customer/context |
| Target | Required progress count/amount |
| User Period Start | Earliest registration/lifecycle date eligible for a Journey generation |
| Mission Start | Time mission begins |
| Mission End | Time mission stops accepting progress |
| Cycle | Repeatable execution period |
| Completion | Target reached |
| Reward Trigger | Request/event asking Loyalty to assign reward |
| Progress Message | Localized customer-facing status copy |

---

# 9. Canonical Mission Types

```text
JOURNEY
CAMPAIGN
```

---

# 10. Future Mission Types

Potential future:

```text
DAILY
WEEKLY
SEASONAL
CHALLENGE
PARTNER
```

Do not implement until needed.

---

# 11. Journey Purpose

Journey is intended for:

```text
new-user onboarding
lifecycle milestones
first-time behaviors
customer activation
```

---

# 12. Current Critical Journey Missions

```text
FIRST_TOP_UP_MIN_AMOUNT
FIRST_PICKUP
FIRST_DINE_IN
FIRST_FEEDBACK
EXPLORE_3_STORES
```

plus any existing approved Journey missions.

---

# 13. Campaign Purpose

Campaign is intended for:

```text
existing customer campaigns
seasonal engagement
time-bounded behavioral goals
repeatable challenges
```

Examples:

```text
Buy 3 times this month
Spend $20 during campaign
Visit 2 stores during event
```

---

# 14. Journey vs Campaign Boundary

Journey eligibility may depend on:

```text
customer registration date
user_period_start
mission creation/start
prior completion
```

Campaign more commonly depends on:

```text
campaign/customer segment
mission active window
customer eligibility
tier/segment if configured
```

---

# 15. Journey-Only Period Rule

Do not apply:

```text
user_period_start
```

logic to Campaign unless a separate explicit policy is introduced.

---

# 16. Mission Aggregate

Primary aggregate root:

```text
MissionDefinition
```

---

# 17. MissionDefinition State

Possible:

```text
mission_id
mission_code
mission_type
status
event_type
progress_type
target_value
starts_at
ends_at
user_period_start
reward_campaign_id
rule_version
configuration
created_at
updated_at
version
```

---

# 18. Mission Status

Recommended:

```text
DRAFT
SCHEDULED
ACTIVE
PAUSED
ENDED
ARCHIVED
```

---

# 19. Mission Status Meaning

```text
DRAFT
→ editable, not customer-visible

SCHEDULED
→ valid but future start

ACTIVE
→ eligible to process progress

PAUSED
→ temporarily stops processing/visibility according to policy

ENDED
→ active window finished

ARCHIVED
→ historical/inactive configuration
```

---

# 20. MissionDefinition Invariants

```text
mission_code unique
target_value > 0
ACTIVE mission has supported event type
Journey may define user_period_start
Campaign does not inherit Journey-only period logic
starts_at <= ends_at when ends_at exists
reward configuration valid before activation
conditions valid before activation
translation keys valid before activation
```

---

# 21. Mission Code Format

Recommended:

```text
UPPERCASE_WITH_UNDERSCORES
```

Examples:

```text
FIRST_TOP_UP_MIN_AMOUNT
FIRST_PICKUP
FIRST_DINE_IN
FIRST_FEEDBACK
EXPLORE_3_STORES
```

Stable after activation.

---

# 22. Translation Key Set

Current source-supported fields may include:

```text
title_key
description_key
rule_key
progress_title_key
progress_description_key
condition_key_1
condition_key_2
condition_key_3
```

Backend model may support more than three conditions even if current UI renders three.

---

# 23. Translation Key Rule

If current mobile client cannot support numeric keys:

```text
reject keys containing digits
```

centrally in backend validation.

---

# 24. Translation Key Example

Allowed:

```text
mission_first_pickup_title
```

Rejected under numeric-key restriction:

```text
mission01_title
```

---

# 25. New Translation Entry Behavior

On create:

```text
key field initially empty
```

Admin intentionally enters a valid key before activation/validation completion.

---

# 26. MissionProgress Aggregate

Customer-specific aggregate:

```text
MissionProgress
```

---

# 27. MissionProgress State

Possible:

```text
progress_id
mission_id
mission_version
customer_id
cycle_id
status
current_progress
target_progress
started_at
completed_at
progress_expires_at
reward_status
reward_assignment_id
version
created_at
updated_at
```

---

# 28. Progress Status

Recommended:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
EXPIRED
INELIGIBLE
```

Do not mix reward fulfillment state into progress status.

---

# 29. Reward Status

Separate projection/state:

```text
NOT_ELIGIBLE
PENDING
ASSIGNED
CLAIMED
EXPIRED
FULFILLMENT_PENDING
FULFILLED
```

---

# 30. Progress and Reward Are Independent

Valid state:

```text
progress = COMPLETED
reward = ASSIGNED
```

or:

```text
progress = COMPLETED
reward = CLAIMED
```

Mission completion and reward lifecycle are distinct.

---

# 31. Completion Invariant

```text
current_progress >= target_progress
```

allows transition to:

```text
COMPLETED
```

exactly once.

---

# 32. Visible Progress Capping

Recommended:

```text
visible_progress
=
min(calculated_progress, target_progress)
```

Historical accepted events may exceed target, but customer-facing progress need not.

---

# 33. Canonical Progress Types

```text
COUNT
SUM
DISTINCT_COUNT
FIRST_OCCURRENCE
BOOLEAN
```

---

# 34. COUNT

Example:

```text
Complete 3 orders
```

Each eligible event:

```text
+1
```

---

# 35. SUM

Example:

```text
Top up until total reaches $20
```

Each eligible event adds configured numeric amount.

---

# 36. DISTINCT_COUNT

Example:

```text
Explore 3 stores
```

Progress is:

```text
COUNT(DISTINCT store_id)
```

---

# 37. FIRST_OCCURRENCE

Example:

```text
First Pickup
```

First qualifying event:

```text
0 → 1
```

Later qualifying events do nothing.

---

# 38. BOOLEAN

Example:

```text
Complete profile verification
```

Progress:

```text
false → true
```

---

# 39. Source Event Types

Examples:

```text
CUSTOMER_REGISTERED
WALLET_TOPUP_COMPLETED
ORDER_COMPLETED
FEEDBACK_SUBMITTED
PROFILE_COMPLETED
```

---

# 40. Event Source Ownership

Mission accepts source-owned events:

```text
OrderCompleted from Ordering
WalletTopUpCompleted from Wallet
FeedbackSubmitted from Feedback domain
CustomerCreated/Registered from Identity/Customer
```

---

# 41. Standard Event Envelope

Use Phase 15 event envelope:

```text
event_id
event_type
event_version
producer
occurred_at
correlation_id
causation_id where available
aggregate metadata where appropriate
data
```

---

# 42. Event Idempotency

Mission processing must tolerate:

```text
duplicate delivery
consumer retry
Kafka replay
restore replay
```

---

# 43. Processed Event Uniqueness

Recommended:

```text
(event_id, consumer_name)
```

---

# 44. Mission-Specific Event Uniqueness

Also use:

```text
(mission_progress_id, source_event_id)
```

where a source event should affect one progress record at most once.

---

# 45. Progress Event History

Append-only table may store:

```text
source_event_id
event_type
progress_delta
distinct_value
accepted
reason
occurred_at
created_at
```

---

# 46. Why Progress Event History Matters

Supports:

```text
audit
debugging
reconciliation
rebuild
```

---

# 47. Mission Condition Model

Conditions may inspect:

```text
event fields
customer attributes/projection
mission period
store/channel
amount
fulfillment type
feedback type
currency
order status
```

---

# 48. Condition Types

Source examples:

```text
AMOUNT_GTE
AMOUNT_LTE
FULFILLMENT_EQ
CHANNEL_IN
STORE_IN
STORE_DISTINCT
FEEDBACK_TYPE_IN
CURRENCY_EQ
ORDER_STATUS_EQ
CUSTOMER_REGISTERED_AFTER
```

---

# 49. Condition Combination

MVP default:

```text
AND
```

Avoid arbitrary nested expression trees initially.

---

# 50. Condition Count

Backend supports:

```text
0..N
```

conditions.

Current admin UI may display only three.

---

# 51. Condition Validation

Every condition type defines required configuration.

Example:

```text
AMOUNT_GTE
requires:
  amount
  currency
```

Reject invalid mission before activation.

---

# 52. Mission Rule Engine Strategy

Start with:

```text
typed mission handlers
+
validated configuration
```

Avoid generic scripting language initially.

---

# 53. MissionEventHandler Concept

Conceptual:

```java
public interface MissionEventHandler {
    boolean supports(MissionDefinition mission, DomainEvent event);

    MissionProgressDelta evaluate(
        MissionDefinition mission,
        MissionProgress progress,
        DomainEvent event
    );
}
```

---

# 54. Benefits of Typed Handlers

```text
testability
clarity
security
maintainability
```

---

# 55. Eligibility Meaning

Eligibility determines whether customer may:

```text
see mission
progress mission
receive reward
```

These can be distinct policies if required.

---

# 56. Eligibility Inputs

Possible:

```text
mission type
mission status
mission time window
customer registration date
user_period_start
mission creation/start
prior completion
customer segment
tier
```

---

# 57. Customer Lifecycle Projection

Mission may maintain a local projection:

```text
customer_id
registered_at
status
```

from Customer events.

---

# 58. Why Customer Projection

Reduces hard synchronous dependency on Customer Service for Journey eligibility.

---

# 59. Journey User Period

Journey may define:

```text
user_period_start
```

Meaning:

```text
the earliest customer registration/lifecycle date eligible
for that Journey generation
```

---

# 60. Example User Period

```text
User period starts = 2026-10-01
```

---

# 61. Journey Mission Start

Journey also defines:

```text
mission_start
```

Current admin model may choose:

```text
read-only
=
created_date
```

if that is the approved behavior.

---

# 62. Dynamic Period Rule

Do not hard-code:

```text
30 days
90 days
```

unless a specific mission explicitly requires it.

Mission period remains configuration-driven.

---

# 63. Current Journey Eligibility Interpretation

Source practical interpretation:

```text
If customer completed Journey mission before user_period_start:
    hide / no reward

If mission was created after user_period_start:
    customers registered before user_period_start may be excluded
    customers registered on/after user_period_start may participate

If customer registers after mission creation:
    show normally if otherwise eligible
```

Represent this as explicit policy code and tests.

---

# 64. Prior Completion Rule

For non-repeatable Journey:

```text
completed before configured eligibility period
→ do not re-show
→ do not re-reward
```

unless cycles/repeat are explicitly supported.

---

# 65. Campaign Period Rule

Campaign does not use Journey:

```text
user_period_start
```

by default.

---

# 66. Admin Campaign UI Rule

For Campaign:

```text
hide Journey-only user-period fields
```

---

# 67. Mission Visibility

Hide when:

```text
not started
ended
customer ineligible
already completed and policy says hide
outside Journey cohort
archived
```

---

# 68. Completed Visibility Options

Business options:

```text
hide immediately
show as completed
show until reward claimed
show in history
```

Choose per mission type/configuration.

---

# 69. Reward-Pending Visibility

Recommended:

```text
COMPLETED + reward still pending
```

remains visible until:

```text
reward assigned/fulfilled
reward claimed
reward expired
```

according to product policy.

---

# 70. Progress Expiry

Customer-specific:

```text
progress_expires_at
```

---

# 71. Mission End vs Progress Expiry

```text
mission.ends_at
= no new mission participation after this time

progress_expires_at
= this customer's current progress cycle expires
```

Do not mix them.

---

# 72. Progress Reset

For repeatable mission:

```text
expired incomplete progress
→ mark expired
→ create next cycle when appropriate
```

Never overwrite completed historical cycles if history matters.

---

# 73. Cycle ID

Recommended for repeatable missions:

```text
cycle_id
```

Examples:

```text
2026-W41
2026-10
CUSTOM_CYCLE_001
```

---

# 74. MissionCycle Model

Possible:

```text
id
mission_id
cycle_code
starts_at
ends_at
status
created_at
```

---

# 75. Single-Completion Journey

First-time Journey missions generally:

```text
repeatable = false
```

Examples:

```text
FIRST_PICKUP
FIRST_DINE_IN
FIRST_TOP_UP_MIN_AMOUNT
```

---

# 76. FIRST_TOP_UP_MIN_AMOUNT

Mission code:

```text
FIRST_TOP_UP_MIN_AMOUNT
```

Source:

```text
WalletTopUpCompleted
```

---

# 77. First Top-Up Variant A

Requirement:

```text
first single qualifying top-up >= minimum
```

Progress type:

```text
FIRST_OCCURRENCE
```

Condition:

```text
topup.amount >= configured_minimum
```

---

# 78. First Top-Up Variant B

Requirement:

```text
accumulate successful top-ups until target amount
```

Progress type:

```text
SUM
```

Example:

```text
SUM(topup.amount) until target = 20 USD
```

---

# 79. First Top-Up Variant Decision

Mission definition must explicitly choose:

```text
single qualifying top-up
```

or:

```text
cumulative amount
```

Do not infer from title.

---

# 80. Top-Up Currency Rule

If threshold configured in USD:

```text
event currency = USD
```

or explicit currency normalization/conversion is required.

Never compare KHR directly against a USD threshold.

---

# 81. Top-Up Idempotency

Use:

```text
WalletTopUpCompleted.event_id
```

plus business reference:

```text
topup_id
```

---

# 82. FIRST_PICKUP

Source:

```text
OrderCompleted
```

Condition:

```text
fulfillment_type = PICKUP
```

Progress:

```text
FIRST_OCCURRENCE
```

Target:

```text
1
```

---

# 83. FIRST_DINE_IN

Source:

```text
OrderCompleted
```

Condition:

```text
fulfillment_type = DINE_IN
```

---

# 84. Legacy Dine-In Mapping

Legacy:

```text
selfdinein
```

may map to:

```text
DINE_IN
```

at Order/Integration boundary.

Mission domain uses canonical value only.

---

# 85. FIRST_FEEDBACK

Source:

```text
FeedbackSubmitted
```

---

# 86. Current Feedback Direction

Current business direction:

```text
count all configured feedback types
```

not only:

```text
suggestion
```

---

# 87. Feedback Configuration

Support:

```text
eligible_feedback_types = ALL
```

or explicit list such as:

```text
SUGGESTION
COMPLIMENT
COMPLAINT
OTHER
```

depending source vocabulary.

---

# 88. EXPLORE_3_STORES

Source:

```text
OrderCompleted
```

Progress:

```text
DISTINCT_COUNT
```

Distinct key:

```text
store_id
```

Target:

```text
3
```

---

# 89. Explore Stores Uniqueness

Five orders at the same store contribute:

```text
1 distinct store
```

---

# 90. Distinct Dimension Constraint

Unique:

```text
(progress_id, dimension_type, dimension_value)
```

---

# 91. Registration Mission

Possible Journey:

```text
REGISTER
```

Source:

```text
CustomerCreated
```

May complete immediately when account is created.

---

# 92. Customer-Facing Translation Example

Example keys:

```text
mission_news_register_title
mission_news_register_desc
```

Customer copy stays configuration-driven.

---

# 93. Mission Processing Flow

```text
Receive source event
      ↓
Validate envelope/version
      ↓
Deduplicate
      ↓
Find candidate missions for event type
      ↓
Evaluate customer eligibility
      ↓
Load/create MissionProgress
      ↓
Evaluate conditions
      ↓
Apply progress delta
      ↓
Check completion
      ↓
Persist progress event
      ↓
Trigger reward if completed
      ↓
Outbox
      ↓
Mark source event processed
```

---

# 94. Candidate Mission Lookup

Avoid scanning every mission.

Index/cache by:

```text
event_type
status
time window
mission_type
```

---

# 95. Candidate Lookup Source of Truth

Authoritative:

```text
PostgreSQL
```

Redis may later accelerate active-definition lookup.

---

# 96. Event Processing Transaction

Recommended for small mission candidate set:

```text
BEGIN

check processed event
load/create required progress
evaluate conditions
apply progress
insert progress event
if completion:
    mark completion
    create reward trigger reference
insert Outbox
mark source event processed

COMMIT
```

---

# 97. Transaction Granularity Decision

Possible:

```text
one transaction per source event across all candidate missions
```

or:

```text
one transaction per mission
```

Source initial recommendation:

```text
one event transaction
```

when candidate count is small and definitions are valid.

---

# 98. Broken Mission Isolation

One invalid mission configuration should not necessarily block unrelated missions forever.

Options:

```text
per-mission validation before activation
per-mission processing result
DLQ/alert for bad mission
```

---

# 99. Processed Event Timing

Mark source event processed only after all required mission effects are safely persisted.

---

# 100. Per-Mission Processing Tracking

If processing is independent per mission:

```text
track mission-specific processing result
```

rather than a single coarse processed flag.

---

# 101. COUNT Update

Possible atomic update:

```sql
UPDATE mission_progress
SET current_progress =
        LEAST(target_progress, current_progress + :delta),
    version = version + 1
WHERE id = :progress_id
  AND status IN ('NOT_STARTED', 'IN_PROGRESS');
```

Completion still needs transactional transition protection.

---

# 102. SUM Update

For SUM:

```text
current_progress += validated normalized amount
```

with cap for visible progress if desired.

---

# 103. SUM Currency

If summing money:

```text
event currency must match mission currency
```

or use explicit normalized amount.

---

# 104. DISTINCT_COUNT Update

Flow:

```text
INSERT dimension
ON CONFLICT DO NOTHING
```

Only a newly inserted distinct dimension increases progress.

---

# 105. FIRST_OCCURRENCE Race

First qualifying event completes.

Concurrent second event:

```text
sees completed state / loses unique transition
```

and does not retrigger reward.

---

# 106. Completion Race

Two events may both reach target concurrently.

Only one may:

```text
transition to COMPLETED
trigger reward
```

---

# 107. Completion Concurrency Controls

Use:

```text
row lock
optimistic version
atomic state transition
unique reward trigger reference
```

---

# 108. Progress Creation Strategy

Possible:

```text
eager
lazy
hybrid
```

---

# 109. Eager Progress

Advantages:

```text
simple customer list
explicit started_at
```

Cost:

```text
many rows for users who never engage
```

---

# 110. Lazy Progress

Advantages:

```text
less storage
```

Costs:

```text
read-time eligibility calculation
computed NOT_STARTED state
```

---

# 111. Recommended Progress Strategy

For limited Journey set:

```text
eager or hybrid
```

is reasonable.

For large campaigns:

```text
lazy
```

may scale better.

---

# 112. started_at Meaning

```text
customer's mission progress became active
```

not mission creation timestamp.

---

# 113. Target Snapshot

Store on progress:

```text
target_progress
```

so active customer progress is explainable even if mission definition changes.

---

# 114. Version Snapshot

Store:

```text
mission_version
```

or rule version on progress.

---

# 115. Active Mission Versioning

High-risk fields:

```text
target
conditions
eligibility period
reward
event type
progress type
```

must not silently mutate existing customer progress.

---

# 116. Active Update Policy

Prefer:

```text
new mission version
```

or an explicit migration policy.

---

# 117. Existing Progress on New Version

Options:

```text
existing users remain on old version
migrate progress
reset progress
new users only use new version
```

Must be explicit.

---

# 118. Mission Version Table

Possible:

```text
mission_id
version
configuration_json
published_at
published_by
status
```

---

# 119. Event Time Rule

Business-time eligibility should usually use:

```text
event.occurred_at
```

not processing time.

---

# 120. Late Event Policy

Example:

```text
event occurred before mission end
but consumed after mission end
```

May still count if:

```text
occurred_at was inside mission active window
```

and replay/late-event policy allows it.

---

# 121. Future-Dated Events

Reject/quarantine events whose:

```text
occurred_at
```

is unreasonably in the future.

Threshold:

```text
TBD_PLATFORM_POLICY
```

---

# 122. Out-of-Order Events

For simple COUNT/DISTINCT/FIRST:

```text
order often does not matter
```

For sequence-sensitive missions:

```text
store enough history/versioning
```

Future feature only unless needed.

---

# 123. Event Correction

If source later publishes:

```text
OrderCancelled
OrderRefunded
```

Mission policy decides whether progress is reversible.

---

# 124. Reversible Missions

Possible:

```text
progress reversal before reward assignment
```

for selected campaigns.

---

# 125. Completion Finality

First-time Journey missions are usually:

```text
final after completion
```

even if later transaction is refunded, unless business explicitly says otherwise.

---

# 126. Reward Boundary

Mission never directly changes:

```text
points balance
wallet balance
coupon tables
```

---

# 127. Reward Trigger

Preferred separate-service pattern:

```text
MissionCompleted
      ↓
Kafka
      ↓
Loyalty Service
      ↓
Reward Assignment
```

---

# 128. MissionCompleted Reward Payload

Possible:

```text
mission_id
mission_code
customer_id
progress_id
reward_campaign_id
completion_reference
completed_at
```

---

# 129. Reward Assignment Idempotency

Unique business reference:

```text
MISSION_PROGRESS + progress_id
```

ensures one reward assignment per mission completion.

---

# 130. Reward Assignment Projection

Mission may store:

```text
reward_assignment_id
reward_status
reward_code
claim_expires_at
```

as local projection.

Loyalty remains authoritative.

---

# 131. RewardAssigned Projection Event

Mission may consume:

```text
RewardAssigned
```

to update local reward reference/status.

---

# 132. RewardClaimed Projection Event

Mission may consume:

```text
RewardClaimed
```

for message/visibility state.

---

# 133. RewardExpired Projection Event

Mission may consume:

```text
RewardExpired
```

if UI needs final reward state.

---

# 134. created=false Semantics

If Loyalty assignment response indicates:

```text
created = false
```

and its contract guarantees that this means:

```text
assignment already exists
```

Mission must reuse the existing assignment.

---

# 135. Do Not Duplicate Reward Distribution

Mission may reference:

```text
fixed reward
```

or:

```text
reward campaign
```

but weighted/proportional selection and quantity limits remain Loyalty-owned.

---

# 136. Progress Expiry Worker

For due progress:

```text
find due progress
      ↓
lock
      ↓
handle completed reward state
      ↓
mark EXPIRED or finalize policy
      ↓
create next cycle if applicable
```

---

# 137. Expired Incomplete Progress

If:

```text
IN_PROGRESS + expiry reached
```

possible action:

```text
mark EXPIRED
```

and optionally create future cycle.

---

# 138. Completed but Reward Pending

If:

```text
COMPLETED
reward pending
expiry reached
```

apply configured:

```text
auto-assign
auto-fulfill
expire reward
```

Do not generic-reset the mission.

---

# 139. Auto-Assign on Expiry

If policy says auto-assign:

```text
find expired completed progress
→ lock progress
→ query existing reward assignment
→ reuse if exists
→ otherwise trigger assignment
→ save reference
→ finalize expiry/reset
```

---

# 140. Auto-Assignment Idempotency

Worker retry must not create a second reward.

Use:

```text
progress_id
```

as stable reward source reference.

---

# 141. Scheduler Jobs

May handle:

```text
mission activation
mission ending
progress expiry
reward auto-assignment
cycle rollover
expiry reminders
reconciliation
```

---

# 142. Scheduler Concurrency

Multiple pods must not process same row unsafely.

Use:

```text
FOR UPDATE SKIP LOCKED
leader election
job framework
```

as appropriate.

---

# 143. Progress Expiry Query

Possible:

```sql
SELECT id
FROM mission_progress
WHERE status IN ('IN_PROGRESS', 'COMPLETED')
  AND progress_expires_at <= NOW()
ORDER BY progress_expires_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

---

# 144. Scheduler Batch Size

Use bounded batches.

Monitor:

```text
backlog
duration
failed rows
```

---

# 145. Message Configuration

Recommended fields:

```text
progress_message
progress_message_km
progress_complete_message
progress_complete_message_km
complete_message
complete_message_km
```

or translation-key equivalents.

---

# 146. Current Message Selection Rule

```text
if rewardStatus indicates final reward completion:
    complete_message
else if milestoneCompleted:
    progress_complete_message
else:
    progress_message
```

---

# 147. Language Fallback

```text
requested language exists?
  yes → use it
  no  → fallback English/default
```

Do not return empty string when fallback exists.

---

# 148. Progress Title and Description

Separate:

```text
progress_title
progress_description
```

from:

```text
title
description
rule
```

---

# 149. Current Translation Groups

Current admin/client convention may use:

```text
Title
Description
Rule
Progress Title
Progress Description
Conditions
```

---

# 150. Translation Resolution Strategy

Choose one platform convention:

```text
Mission returns translation keys
```

or:

```text
Mission resolves localized values
```

If resolving:

```text
fallback mandatory
```

---

# 151. Customer Mission List API

```text
GET /api/v1/missions
```

Returns customer-visible eligible missions according to policy.

---

# 152. Customer Mission Detail API

```text
GET /api/v1/missions/{missionId}
```

May return:

```text
title
description
rule
progress
conditions
reward summary
validity
```

---

# 153. Customer Identity

Derive customer identity from authenticated context.

Do not allow customer to query arbitrary:

```text
customer_id
```

for standard customer APIs.

---

# 154. Mission List Response

Example shape:

```json
{
  "data": [
    {
      "mission_id": "MIS001",
      "mission_code": "FIRST_PICKUP",
      "mission_type": "JOURNEY",
      "status": "IN_PROGRESS",
      "current_progress": 0,
      "target_progress": 1,
      "progress_message": "Complete your first pickup order",
      "reward_status": "PENDING"
    }
  ]
}
```

---

# 155. Mission List Sorting

Define deterministic order using fields such as:

```text
priority
mission type
completion state
expiry
created_at
```

---

# 156. Mission Priority

Optional:

```text
priority
```

should normally affect presentation order only.

---

# 157. Admin Mission APIs

Possible:

```text
GET    /api/v1/admin/missions
GET    /api/v1/admin/missions/{id}
POST   /api/v1/admin/missions
PATCH  /api/v1/admin/missions/{id}
POST   /api/v1/admin/missions/{id}/activate
POST   /api/v1/admin/missions/{id}/pause
DELETE /api/v1/admin/missions/{id}
GET    /api/v1/admin/missions/{id}/progress
GET    /api/v1/admin/missions/progress/{progressId}
```

---

# 158. Portal Action Mapping

Canonical actions may map to:

```text
LIST
DETAIL
CREATE
UPDATE
CHANGE_STATUS
DELETE
```

---

# 159. Progress Admin Actions

Canonical:

```text
USER_MISSION_LIST
USER_MISSION_DETAIL
```

---

# 160. Progress Admin Filters

Recommended:

```text
mission_id / mission_code
customer_id
status
date range
reward_status
```

Do not keep unused `card_number` filters/columns if product requirement removed them.

---

# 161. Customer Name in Admin

Use:

```text
Customer Service read model
```

or an authorized synchronized admin projection.

Do not cross-join private service databases.

---

# 162. Admin Journey Period Fields

For Journey:

```text
User period starts*
Mission starts*
```

Mission start may be read-only if tied to creation date.

---

# 163. Admin Campaign Period Fields

For Campaign:

```text
hide Journey-only user-period fields
```

---

# 164. Admin Backend Validation

Validate:

```text
mission type
period fields
target
event source
conditions
translation keys
reward campaign/reference
```

UI validation is not sufficient.

---

# 165. Period Count Bug Prevention

Do not derive period count from:

```text
UI row count
duplicate form fields
```

Store explicit period/cycle model.

---

# 166. Expired Status Consistency

Displayed status must derive consistently from:

```text
mission window
progress expiry
completion
reward state
```

Do not show:

```text
ACTIVE
```

when customer progress is actually expired.

---

# 167. Activation Validation

Before `ACTIVE`:

```text
event type supported
target > 0
conditions valid
translation keys valid
Journey period valid
reward configuration valid
time window valid
```

---

# 168. Mission Create Validation

Validate:

```text
type
code
event source
progress type
target
period
conditions
reward
translation keys
```

---

# 169. Active Mission Update

If high-risk field changes on ACTIVE mission:

```text
reject direct update
or
create new version
```

---

# 170. Mission Delete

Prefer:

```text
ARCHIVED
```

when any customer progress/history exists.

Hard delete only unused Draft where safe.

---

# 171. Status Transition Validation

Admin:

```text
CHANGE_STATUS
```

must enforce legal transitions.

---

# 172. Mission Database

Core tables:

```text
mission_definitions
mission_versions
mission_conditions
mission_cycles
mission_progress
mission_progress_events
mission_progress_dimensions
mission_reward_links
mission_idempotency
processed_events
outbox_events
mission_reconciliation_runs
mission_reconciliation_mismatches
customer_lifecycle_projection
reward_assignment_projection optional
```

---

# 173. mission_definitions

Suggested:

```text
id
mission_code
mission_type
status
event_type
progress_type
target_value
user_period_start
starts_at
ends_at
reward_campaign_id
active_version
created_at
updated_at
version
```

---

# 174. mission_versions

Suggested:

```text
id
mission_id
version
configuration_json
published_at
published_by
status
```

---

# 175. mission_conditions

Suggested:

```text
id
mission_version_id
condition_type
operator
configuration_json
display_order
```

---

# 176. mission_cycles

Suggested:

```text
id
mission_id
cycle_code
starts_at
ends_at
status
created_at
```

---

# 177. mission_progress

Suggested:

```text
id
mission_id
mission_version
cycle_id
customer_id
status
current_progress
target_progress
started_at
completed_at
progress_expires_at
reward_status
reward_assignment_id
version
created_at
updated_at
```

---

# 178. Progress Uniqueness — Non-Repeatable

```text
UNIQUE(mission_id, customer_id)
```

---

# 179. Progress Uniqueness — Repeatable

```text
UNIQUE(mission_id, customer_id, cycle_id)
```

---

# 180. mission_progress_events

Suggested:

```text
id
mission_progress_id
source_event_id
source_event_type
progress_delta
accepted
reason_code
occurred_at
created_at
```

Unique candidate:

```text
(mission_progress_id, source_event_id)
```

---

# 181. mission_progress_dimensions

Suggested:

```text
id
mission_progress_id
dimension_type
dimension_value
source_event_id
created_at
```

Unique:

```text
(mission_progress_id, dimension_type, dimension_value)
```

---

# 182. mission_reward_links

Suggested:

```text
mission_id
mission_version
reward_campaign_id
fixed_reward_id
assignment_policy
```

---

# 183. mission_idempotency

For direct/admin commands:

```text
id
operation
scope_id
idempotency_key
request_hash
status
response_body
created_at
expires_at
```

---

# 184. processed_events

Suggested:

```text
event_id
consumer_name
processed_at
```

---

# 185. outbox_events

Follow Phase 15 platform standard.

Mission events may include:

```text
MissionStarted
MissionProgressed
MissionCompleted
MissionExpired
MissionReset
MissionRewardTriggered
```

---

# 186. customer_lifecycle_projection

Possible:

```text
customer_id
registered_at
status
updated_at
source_version
```

Used for Journey eligibility.

---

# 187. reward_assignment_projection

Optional local projection:

```text
progress_id
reward_assignment_id
reward_status
reward_code
claim_expires_at
updated_at
```

Loyalty remains source of truth.

---

# 188. Optimistic Locking

Use version fields on:

```text
mission_definitions
mission_progress
```

and other mutable rows where needed.

---

# 189. Progress Concurrency

Two source events may update one progress simultaneously.

Prevent:

```text
lost increments
duplicate completion
duplicate reward trigger
```

---

# 190. Distinct Race

For `EXPLORE_3_STORES`:

```text
INSERT distinct dimension
ON CONFLICT DO NOTHING
```

Only successful insert contributes progress.

---

# 191. First-Occurrence Race

Concurrent first events:

```text
one completes
one becomes no-op
```

---

# 192. Completion Transaction

Within local transaction:

```text
lock/load progress
apply accepted delta
if target reached and not completed:
    set COMPLETED
    completed_at = event occurred_at/current business time policy
    create unique reward trigger/outbox
persist progress event
commit
```

---

# 193. Reward Trigger Uniqueness

Use a unique source such as:

```text
progress_id
```

for one reward trigger per completion.

---

# 194. Mission Error Catalog

Candidates:

```text
MISSION_NOT_FOUND
MISSION_NOT_ACTIVE
MISSION_NOT_STARTED
MISSION_ENDED
MISSION_NOT_ELIGIBLE
MISSION_ALREADY_COMPLETED
MISSION_PROGRESS_EXPIRED
MISSION_PROGRESS_NOT_FOUND
MISSION_INVALID_CONFIGURATION
MISSION_EVENT_NOT_SUPPORTED
MISSION_CONDITION_NOT_MET
MISSION_REWARD_NOT_CONFIGURED
MISSION_REWARD_ALREADY_ASSIGNED
MISSION_REWARD_ASSIGNMENT_FAILED
MISSION_VERSION_CONFLICT
MISSION_PERIOD_INVALID
MISSION_TRANSLATION_KEY_INVALID
IDEMPOTENCY_KEY_REUSED
```

---

# 195. Error Mapping

Examples:

| Error | HTTP / gRPC |
|---|---|
| MISSION_NOT_FOUND | 404 / NOT_FOUND |
| MISSION_NOT_ELIGIBLE | 403/422 |
| MISSION_ALREADY_COMPLETED | 409 / ALREADY_EXISTS |
| MISSION_PROGRESS_EXPIRED | 410 / FAILED_PRECONDITION |
| MISSION_INVALID_CONFIGURATION | 422 / INVALID_ARGUMENT |
| MISSION_VERSION_CONFLICT | 409 / ABORTED |

---

# 196. Events Published

Candidates:

```text
MissionStarted
MissionProgressed
MissionCompleted
MissionExpired
MissionReset
MissionRewardTriggered
```

---

# 197. Event Noise Policy

Do not publish every progress increment unless a real consumer needs it.

Completion events are more important.

---

# 198. MissionProgressed Event

Possible:

```text
mission_id
mission_code
customer_id
progress_id
current_progress
target_progress
occurred_at
```

---

# 199. MissionCompleted Event

Possible:

```text
mission_id
mission_code
customer_id
progress_id
completed_at
reward_campaign_id
completion_reference
```

---

# 200. Events Consumed

Likely:

```text
CustomerCreated
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
RewardAssigned
RewardClaimed
RewardExpired
```

---

# 201. OrderCompleted Consumer

May drive:

```text
FIRST_PICKUP
FIRST_DINE_IN
EXPLORE_3_STORES
Campaign COUNT/SUM/DISTINCT missions
```

---

# 202. WalletTopUpCompleted Consumer

May drive:

```text
FIRST_TOP_UP_MIN_AMOUNT
Top-Up SUM missions
```

---

# 203. FeedbackSubmitted Consumer

May drive:

```text
FIRST_FEEDBACK
future feedback campaigns
```

---

# 204. CustomerCreated Consumer

Supports:

```text
registration mission
customer lifecycle projection
Journey eligibility
```

---

# 205. Reward Events Consumer

Reward projection updates message/visibility state.

Mission never becomes reward authority.

---

# 206. Loyalty Integration

Separate-service pattern:

```text
MissionCompleted
→ Kafka
→ Loyalty
→ assign reward exactly once
```

---

# 207. Promotion Integration

If reward is Coupon:

```text
Mission
→ Loyalty reward assignment
→ Promotion fulfillment
```

Mission does not directly mutate Promotion DB.

---

# 208. Wallet Integration

Mission consumes Top-Up fact only.

Mission does not:

```text
read Wallet DB
credit Wallet
```

---

# 209. Notification Integration

Notification may consume:

```text
MissionCompleted
RewardAssigned
RewardExpiringSoon
```

Mission does not send push directly.

---

# 210. Clean Architecture Layout

Recommended:

```text
mission-service/
├── domain/
│   ├── mission/
│   ├── eligibility/
│   ├── progress/
│   ├── cycle/
│   ├── condition/
│   ├── reward/
│   ├── event/
│   ├── policy/
│   └── exception/
├── application/
│   ├── query/
│   ├── progress/
│   ├── complete/
│   ├── expire/
│   ├── reset/
│   ├── admin/
│   └── reconciliation/
├── adapter/in/
│   ├── rest/
│   ├── kafka/
│   └── scheduler/
├── adapter/out/
│   ├── persistence/
│   ├── customer/
│   ├── loyalty/
│   ├── translation/
│   ├── redis/
│   └── kafka/
└── config/
```

---

# 211. Input Ports

Examples:

```text
ListCustomerMissionsUseCase
GetMissionDetailUseCase
ProcessMissionEventUseCase
ExpireMissionProgressUseCase
ResetMissionProgressUseCase
CreateMissionUseCase
UpdateMissionUseCase
ChangeMissionStatusUseCase
ListMissionProgressUseCase
GetMissionProgressDetailUseCase
ReconcileMissionUseCase
```

---

# 212. Output Ports

Examples:

```text
MissionDefinitionPort
MissionProgressPort
MissionProgressEventPort
MissionDimensionPort
ProcessedEventPort
RewardAssignmentPort
CustomerEligibilityPort
TranslationPort
MissionCachePort
OutboxPort
ClockPort
```

---

# 213. ProcessMissionEventUseCase

```text
Validate event
→ Deduplicate
→ Load candidate missions
→ For each mission:
     evaluate eligibility
     evaluate conditions
     load/create progress
     apply progress
     if completed:
         trigger reward
→ mark processing complete
```

---

# 214. Persistence Adapter Rule

No JPA entity in Domain.

Map persistence model ↔ domain model in adapter.

---

# 215. Kafka Listener Rule

Listener performs:

```text
deserialize
validate envelope/version
invoke use case
classify transient/permanent failure
```

No large mission business logic inside listener.

---

# 216. Retryable Consumer Failures

Examples:

```text
DB timeout
temporary dependency outage
temporary lock/deadlock
```

---

# 217. Non-Retryable Consumer Failures

Examples:

```text
invalid mission configuration
unsupported event schema
permanent data mapping error
```

Route to:

```text
DLQ / operations
```

after platform-standard handling.

---

# 218. DLQ Metadata

Include:

```text
event_id
event_type
mission_id if known
failure_code
retry_count
safe last_error
```

---

# 219. Mission Read Cache

Redis may later cache:

```text
active missions by event_type
customer mission list
```

---

# 220. Candidate Cache Key

Example:

```text
mission:active:ORDER_COMPLETED
```

---

# 221. Customer Mission Cache Key

Example:

```text
mission:list:{customer_id}:{language}
```

---

# 222. PostgreSQL Remains Authoritative

Mission definitions and progress remain authoritative in PostgreSQL.

Redis is disposable acceleration only.

---

# 223. Cache Failure

If Redis is unavailable:

```text
reads fallback PostgreSQL
writes continue
```

---

# 224. Phase 20 Redis Handoff

Do not block Phase 17 correctness on Redis.

Detailed cache implementation belongs to Phase 20.

---

# 225. Mission Read Model

Possible optimized view/projection:

```text
mission_customer_view
```

containing:

```text
definition summary
progress
reward projection
localized message keys
```

---

# 226. Reconciliation Goals

Detect:

```text
progress > target
COMPLETED without completed_at
COMPLETED while target not reached
duplicate reward assignment
COMPLETED requiring reward with no assignment
distinct count mismatch
processed event without expected progress event
progress outside Journey eligibility
expired progress still active
```

---

# 227. COUNT/SUM Reconciliation

If full accepted progress-event history exists:

```text
recompute accepted deltas
```

and compare against current progress.

---

# 228. DISTINCT_COUNT Reconciliation

```text
COUNT(unique dimension rows)
=
current_progress
```

subject to display capping.

---

# 229. Reward Reconciliation

Detect:

```text
COMPLETED
+
reward required
+
reward_assignment_id missing
```

and duplicate assignments for same progress.

---

# 230. Period Reconciliation

Detect progress existing for a customer who was outside Journey `user_period_start` policy, unless explicit grandfathering applies.

---

# 231. No Silent Repair

Do not edit customer progress directly merely to hide a bug.

Use:

```text
rebuild
approved correction event
documented migration
```

with audit.

---

# 232. Manual Progress Correction

If supported:

```text
reason required
actor required
before/after captured
```

Prefer correction event over silent row edit.

---

# 233. Reconciliation Run Table

Possible:

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

# 234. Reconciliation Mismatch Table

Possible:

```text
id
run_id
mission_id
progress_id
customer_id
mismatch_type
expected_value
actual_value
status
detected_at
resolved_at
resolution_note
```

---

# 235. Mission Admin Audit

Audit:

```text
mission created
mission updated
mission activated
mission paused
period changed
target changed
reward changed
manual progress correction
manual reward action
```

---

# 236. Mission Security Risks

Primary:

```text
customer progress tampering
admin misconfiguration
duplicate reward
cross-customer access
event spoofing
```

---

# 237. Security Controls

```text
service authentication
RBAC
Kafka ACL
idempotency
audit
configuration validation
customer isolation
```

---

# 238. Mission Admin Permissions

Possible:

```text
mission.read
mission.manage
mission.activate
mission.progress.read
mission.progress.adjust
mission.reconcile
```

---

# 239. Customer API Security

Customer identity comes from authenticated token/context.

Never trust submitted:

```text
customer_id
```

for own-mission APIs.

---

# 240. Event Producer ACL

Only approved producers may publish relevant event topics.

Examples:

```text
Ordering → Order events
Wallet → Top-Up events
Feedback → Feedback events
Customer → lifecycle events
```

---

# 241. Data Classification

Likely:

```text
CONFIDENTIAL:
customer mission progress
reward status

INTERNAL:
mission rules
eligibility configuration
campaign configuration
```

---

# 242. Privacy

Store primarily:

```text
customer_id
progress facts
```

not full PII.

---

# 243. Customer Closure

On closure:

```text
stop new progress
close/expire active missions
handle outstanding rewards according to policy
retain or pseudonymize history
```

---

# 244. Mission Retention

Potential policy categories:

```text
active progress → retain
completed progress → medium/long support retention
expired unsuccessful progress → shorter retention
event history → based on reconciliation need
```

Exact retention:

```text
TBD_RETENTION_POLICY
```

---

# 245. Mission Business Metrics

Candidate:

```text
mission_visible_total
mission_started_total
mission_progressed_total
mission_completed_total
mission_expired_total
mission_reward_trigger_total
```

---

# 246. Mission Product Metrics

Per mission:

```text
completion_rate
average_time_to_complete
dropoff_rate
```

---

# 247. Mission Operational Metrics

```text
mission_consumer_lag
duplicate_event_total
reward_assignment_failure_total
expiry_backlog
reconciliation_mismatch_total
outbox_oldest_age
```

---

# 248. Mission SLIs

Potential:

```text
Mission list availability
P95 mission list latency
Event-to-progress latency
Event-to-completion latency
Reward-trigger latency
Expiry worker lag
Reconciliation health
```

---

# 249. SLO Targets

Remain:

```text
TBD_SLO
```

until measured and approved.

---

# 250. Alerts

Alert on:

```text
consumer lag
duplicate reward attempt
unexpected completion spike
progress failure spike
reward assignment failure
expiry backlog
invalid active configuration
reconciliation mismatch
outbox backlog
```

---

# 251. Dashboard

Show:

```text
active Journey missions
active Campaign missions
progress events/min
completion rate by mission
reward assignment rate
expiry backlog
consumer lag
reconciliation mismatches
```

---

# 252. Structured Logging

Safe fields may include:

```text
mission_id
mission_code
customer_id if permitted
progress_id
event_id
operation
result
reason_code
request_id
correlation_id
```

---

# 253. Logging Privacy

Do not log unnecessary customer PII or full source payloads.

---

# 254. Tracing

Trace:

```text
Kafka event
→ Mission consumer
→ Eligibility
→ Condition evaluation
→ Progress update
→ Reward trigger
→ Outbox
```

---

# 255. Trace Attributes

Possible:

```text
mission_code
progress_type
completed
```

Avoid high-cardinality metric labels.

---

# 256. Failure Mode — Loyalty/Reward Down

Mission completion can still persist.

Reward projection/state:

```text
PENDING
```

Outbox/retry continues assignment later.

Do not undo mission completion.

---

# 257. Failure Mode — Customer Service Down

If eligibility needs registration date and trusted local projection exists:

```text
continue using projection
```

Otherwise transient event processing may retry.

---

# 258. Failure Mode — Redis Down

```text
reads fallback PostgreSQL
writes unaffected
```

---

# 259. Failure Mode — Kafka Down

New source facts are delayed.

Mission remains correct when events resume/replay.

Monitor lag.

---

# 260. Failure Mode — Scheduler Down

Possible delayed effects:

```text
progress expiry
auto-assignment
cycle rollover
```

Alert on backlog.

---

# 261. Required Runbooks

```text
Mission progress not updating
Duplicate progress
Duplicate reward assignment
Reward assignment stuck
Journey eligibility wrong
Mission expired but still active
Distinct-store count wrong
Consumer lag
Outbox backlog
```

---

# 262. Progress Not Updating Runbook

```text
check source event emitted
check Kafka lag
check processed_events
check mission status/time
check eligibility
check conditions
check mission version
check DB transaction errors
```

---

# 263. Duplicate Progress Runbook

```text
identify event_id
check processed-event uniqueness
check mission_progress_events uniqueness
check retry behavior
reconcile progress
correct via approved rebuild
```

---

# 264. Duplicate Reward Runbook

```text
check completion uniqueness
check reward source reference
check Loyalty assignment uniqueness
pause campaign if necessary
resolve duplicate benefit safely
```

---

# 265. Journey Eligibility Incident Runbook

If wrong customers see Journey:

```text
pause mission if severe
inspect user_period_start
inspect registration projection
inspect prior completion
inspect mission type
fix rule/version
reconcile affected customers
```

---

# 266. Backup Scope

Back up:

```text
definitions
versions
conditions
cycles
progress
progress events
distinct dimensions
reward links/projections
processed events
outbox
reconciliation
customer lifecycle projection
```

---

# 267. Restore Procedure

After restore:

```text
replay source events idempotently
reconcile progress
reconcile distinct dimensions
reconcile completion/rewards
rebuild caches
repair/reprocess Outbox
```

---

# 268. Restore Risks

Old restore may:

```text
lose progress
reprocess events
reassign reward
resurrect expired progress
```

---

# 269. Restore Protections

```text
source event IDs
unique progress constraints
unique completion/reward references
Loyalty reward idempotency
reconciliation
```

---

# 270. Disaster Recovery

Define:

```text
RPO
RTO
Kafka replay position
processed-event restoration
reward assignment reconciliation
scheduler recovery
cache rebuild
```

---

# 271. Flyway Migration Plan

Suggested:

```text
V1__create_mission_definitions.sql
V2__create_mission_versions.sql
V3__create_mission_conditions.sql
V4__create_mission_cycles.sql
V5__create_mission_progress.sql
V6__create_mission_progress_events.sql
V7__create_mission_progress_dimensions.sql
V8__create_mission_reward_links.sql
V9__create_mission_idempotency.sql
V10__create_processed_events.sql
V11__create_reconciliation_tables.sql
V12__create_outbox.sql
V13__create_customer_lifecycle_projection.sql
V14__create_reward_assignment_projection.sql
```

Adjust numbering to repository baseline.

---

# 272. Legacy Mission Migration

Preserve:

```text
mission code
mission type
status
period
target
conditions
customer progress
completion
reward assignment
expiry
```

---

# 273. Journey Migration

Specially reconcile:

```text
user_period_start
mission_start
customer registration date
prior completion
```

---

# 274. Campaign Migration

Do not accidentally populate/use Journey-only:

```text
user_period_start
```

for Campaign.

---

# 275. Progress Migration

For each customer:

```text
current_progress
target_progress
status
started_at
completed_at
expires_at
reward status
mission version
```

---

# 276. Distinct Progress Migration

For Explore Stores, if distinct store history exists:

```text
migrate dimension rows
```

If only numeric count exists:

```text
document reduced replay/reconciliation ability
```

---

# 277. Reward Migration

Link existing reward assignment to migrated progress.

Do not create a second assignment.

---

# 278. Migration Reconciliation

Compare old/new:

```text
mission count
active mission count
customer progress count
completed count
reward assignment count
expired count
```

---

# 279. Testing Strategy

Required:

```text
Domain
Eligibility
Period
Conditions
Progress Types
Event Idempotency
Concurrency
Completion
Reward Trigger
Expiry
Reset
Admin
Persistence
Kafka
Reconciliation
Load
Failure
Security
Migration
```

---

# 280. Domain Tests

Test:

```text
status transitions
target validation
completion
expiry
non-repeatable behavior
version behavior
```

---

# 281. Journey Eligibility Boundary Tests

Include:

```text
registered before user_period_start
registered exactly at user_period_start
registered after user_period_start
mission created before period
mission created after period
prior completion before period
new customer after mission creation
```

---

# 282. Campaign Eligibility Tests

Verify:

```text
Journey period logic does not leak into Campaign
time window
segment/tier if configured
```

---

# 283. First Top-Up Tests

Test relevant configured semantics:

```text
single top-up >= minimum
cumulative top-ups >= target
below minimum
wrong currency
duplicate top-up event
```

---

# 284. First Pickup Tests

```text
PICKUP completed → complete
DELIVERY completed → no progress
duplicate order event → no duplicate reward
```

---

# 285. First Dine-In Tests

```text
DINE_IN completed → complete
PICKUP → no progress
legacy selfdinein mapping handled outside Mission
```

---

# 286. Feedback Mission Tests

Verify configured behavior for:

```text
suggestion
compliment
complaint
other configured types
```

---

# 287. Explore Stores Tests

```text
Store A → 1
Store A again → still 1
Store B → 2
Store C → complete 3
duplicate source event → unchanged
```

---

# 288. Progress Concurrency Tests

Send simultaneous qualifying events.

Verify:

```text
no lost increment
no policy-violating progress
completion once
reward trigger once
```

---

# 289. Completion Race Tests

Two events both crossing target:

```text
one completion transition
one reward trigger
```

---

# 290. Expiry Tests

Test:

```text
incomplete expired
completed reward pending
completed reward assigned
already expired
worker retry
```

---

# 291. Auto-Assignment Tests

Test:

```text
completed + no reward → assign
completed + existing assignment → reuse created=false
duplicate worker execution
reward assignment failure + retry
```

---

# 292. Message Selection Tests

Verify:

```text
normal progress → progress_message
milestone complete → progress_complete_message
reward complete → complete_message
Khmer fallback
English/default fallback
```

---

# 293. Translation Key Tests

Test:

```text
lowercase-only if policy
numeric key rejected when prohibited
empty key allowed only during incomplete draft flow if approved
duplicate key handling
```

---

# 294. Persistence Tests

Using PostgreSQL Testcontainers:

```text
mission code uniqueness
progress uniqueness
distinct dimension uniqueness
processed event uniqueness
optimistic locking
Flyway
indexes
```

---

# 295. Kafka Tests

Test:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
CustomerCreated
duplicate event
consumer retry
DLQ
replay
```

---

# 296. Reward Integration Tests

Test:

```text
MissionCompleted → Loyalty reward assignment
duplicate completion
Loyalty unavailable
existing reward assignment
RewardAssigned projection update
```

---

# 297. Reconciliation Tests

Create:

```text
progress mismatch
distinct count mismatch
completed without reward
duplicate reward
expired active progress
progress outside Journey cohort
```

Verify detection.

---

# 298. Load Tests

Scenarios:

```text
large OrderCompleted burst
many active missions on same event
campaign launch
expiry batch
mission list traffic
```

---

# 299. Hot Event Test

Example source workload:

```text
10,000 OrderCompleted events/minute
5 missions consuming each event
```

Measure:

```text
consumer throughput
DB contention
candidate lookup
outbox throughput
```

Use actual production sizing later.

---

# 300. Large Customer Mission List Test

Test customers with:

```text
many active/history missions
```

Use pagination/history separation if needed.

---

# 301. Failure Tests

Inject:

```text
Kafka duplicate
DB timeout
deadlock
Loyalty/Reward unavailable
Redis unavailable
scheduler crash
Outbox failure
```

Verify safe recovery.

---

# 302. Security Tests

Verify:

```text
customer cannot read another customer's progress
admin update requires permission
client cannot manually increment progress
event spoofing blocked by Kafka ACL
manual correction audited
```

---

# 303. Definition of Done — Mission Definition

- [ ] Mission code.
- [ ] Type.
- [ ] Event source.
- [ ] Progress type.
- [ ] Target.
- [ ] Period.
- [ ] Conditions.
- [ ] Reward reference.
- [ ] Translation keys.
- [ ] Validation.
- [ ] Version policy.
- [ ] Tests.

---

# 304. Definition of Done — Progress Processing

- [ ] Event dedupe.
- [ ] Candidate lookup.
- [ ] Eligibility.
- [ ] Condition evaluation.
- [ ] Concurrency-safe progress.
- [ ] Progress event/history.
- [ ] Completion once.
- [ ] Reward trigger once.
- [ ] Outbox.
- [ ] Metrics.
- [ ] Tests.

---

# 305. Definition of Done — Journey Period

- [ ] `user_period_start` semantics documented.
- [ ] Mission start semantics documented.
- [ ] Registration boundary tested.
- [ ] Prior completion tested.
- [ ] Campaign excluded from Journey-only logic.
- [ ] UI/backend validation aligned.

---

# 306. Definition of Done — Reward Auto-Assignment

- [ ] Completed-progress detection.
- [ ] Expiry trigger.
- [ ] Existing assignment reuse.
- [ ] Idempotent reward source.
- [ ] Retry.
- [ ] Reward reference saved.
- [ ] Tests.

---

# 307. Mission Ownership Checklist

- [ ] Mission owns progress.
- [ ] Loyalty owns points/reward assignment.
- [ ] Promotion owns coupon rules.
- [ ] Ordering/Wallet/Feedback/Customer own source facts.
- [ ] Notification owns delivery.
- [ ] No cross-service DB joins.

---

# 308. Eligibility Checklist

- [ ] Mission type.
- [ ] Active window.
- [ ] Journey user period.
- [ ] Registration date.
- [ ] Prior completion.
- [ ] Campaign-specific policy.
- [ ] Segment/tier if configured.
- [ ] Visibility policy.

---

# 309. Progress Checklist

- [ ] COUNT.
- [ ] SUM.
- [ ] DISTINCT_COUNT.
- [ ] FIRST_OCCURRENCE.
- [ ] BOOLEAN if used.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Completion once.
- [ ] Expiry/reset.
- [ ] Event-time policy.

---

# 310. Mission Data Checklist

- [ ] Mission code unique.
- [ ] Versioning.
- [ ] Progress uniqueness.
- [ ] Processed event uniqueness.
- [ ] Distinct dimensions.
- [ ] Reward reference.
- [ ] Customer lifecycle projection.
- [ ] Reconciliation tables.
- [ ] Outbox.
- [ ] Retention.

---

# 311. Contract Checklist

- [ ] Customer mission list.
- [ ] Mission detail.
- [ ] Admin list/detail/create/update/status/delete.
- [ ] Progress list/detail.
- [ ] Stable errors.
- [ ] Event schemas.
- [ ] Translation/message contract.
- [ ] Reward reference contract.
- [ ] Pagination/filtering.
- [ ] Authorization.

---

# 312. Security Checklist

- [ ] Customer isolation.
- [ ] Admin RBAC.
- [ ] Event producer ACL.
- [ ] Manual correction audit.
- [ ] No client-authored progress.
- [ ] No cross-service DB reads.
- [ ] Sensitive logs minimized.
- [ ] Backups protected.

---

# 313. Operations Checklist

- [ ] Consumer lag monitoring.
- [ ] Scheduler monitoring.
- [ ] Expiry backlog.
- [ ] Reward assignment backlog.
- [ ] Reconciliation.
- [ ] Cache rebuild plan.
- [ ] Outbox monitoring.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 314. Production Readiness Checklist

Before production:

- [ ] Journey boundary-date tests pass.
- [ ] Campaign/Journey UI/backend fields validated.
- [ ] Duplicate source event tests pass.
- [ ] Progress concurrency tests pass.
- [ ] Completion race tests pass.
- [ ] Distinct-store tests pass.
- [ ] Reward assignment idempotency passes.
- [ ] Auto-assignment passes.
- [ ] Expiry worker tested.
- [ ] Message selection tested.
- [ ] Translation validation tested.
- [ ] Reconciliation tested.
- [ ] Event replay tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.
- [ ] Versioning policy frozen.

---

# 315. Initial Implementation Order

Adapted from the source for the current separate Mission service:

```text
1. Bootstrap mission-service
2. mission_db + Flyway
3. MissionDefinition aggregate
4. MissionProgress aggregate
5. Mission/Progress status models
6. Processed-event idempotency
7. Customer lifecycle projection
8. OrderCompleted consumer
9. FIRST_PICKUP
10. FIRST_DINE_IN
11. WalletTopUpCompleted consumer
12. FIRST_TOP_UP_MIN_AMOUNT
13. FeedbackSubmitted consumer
14. FIRST_FEEDBACK
15. DISTINCT_COUNT support
16. EXPLORE_3_STORES
17. Journey user-period eligibility
18. Campaign eligibility separation
19. Progress messages/translations
20. Mission versioning
21. MissionCompleted reward trigger
22. Reward assignment projection
23. Progress expiry/reset worker
24. Auto-assignment
25. Customer APIs
26. Admin APIs
27. Reconciliation
28. Metrics/alerts/runbooks
29. Full concurrency/failure/load tests
30. Production readiness review
31. Handoff to Phase 18 Notification
```

---

# 316. Minimum Production-Capable Mission Scope

Required:

```text
Mission definitions
Journey/Campaign type
Mission eligibility
Journey user-period logic
Mission progress
COUNT/FIRST/DISTINCT/SUM as needed
Event dedupe
Completion
Reward trigger
Reward assignment reference/projection
Progress expiry
Admin configuration
Customer mission list
Outbox
Reconciliation
Security
Observability
Testing
```

---

# 317. Release-Critical Journey Missions

```text
First Top-Up With Minimum Amount
First Pickup
First Dine-In
First Feedback
Explore 3 Stores
```

---

# 318. Conditional Scope — Registration Mission

Implement:

```text
REGISTER
```

only if currently approved as a Journey mission.

---

# 319. Conditional Scope — SUM Top-Up

If product requirement is cumulative:

```text
SUM successful top-ups
```

implement it.

If requirement is one qualifying top-up:

```text
FIRST_OCCURRENCE + AMOUNT_GTE
```

do not add cumulative behavior.

---

# 320. Conditional Scope — Repeatable Campaigns

Implement cycle tables/reset behavior only to the extent current Campaign requirements need it.

---

# 321. Deferred Mission Features

Future:

```text
mission chains
prerequisites
branching journeys
weekly/daily cycles
segment-targeted missions
team missions
shared household missions
personalized targets
experiment variants
advanced rule authoring
```

---

# 322. Phase 17 Work Breakdown

Suggested tickets:

```text
MIS-001 Bootstrap mission-service
MIS-002 Create mission_db
MIS-003 Add Flyway baseline
MIS-004 Implement MissionDefinition aggregate
MIS-005 Implement MissionStatus
MIS-006 Implement MissionType
MIS-007 Implement ProgressType
MIS-008 Implement MissionProgress aggregate
MIS-009 Implement ProgressStatus
MIS-010 Implement RewardStatus projection
MIS-011 Create mission_definitions
MIS-012 Create mission_versions
MIS-013 Create mission_conditions
MIS-014 Create mission_cycles
MIS-015 Create mission_progress
MIS-016 Create mission_progress_events
MIS-017 Create mission_progress_dimensions
MIS-018 Create mission_reward_links
MIS-019 Create mission_idempotency
MIS-020 Create processed_events
MIS-021 Create Outbox
MIS-022 Create reconciliation tables
MIS-023 Create customer lifecycle projection
MIS-024 Implement CustomerCreated consumer
MIS-025 Implement mission-code validation
MIS-026 Implement translation-key validation
MIS-027 Implement activation validation
MIS-028 Implement condition schema validation
MIS-029 Implement typed MissionEventHandler strategy
MIS-030 Implement candidate mission lookup
MIS-031 Implement ProcessMissionEventUseCase
MIS-032 Implement event Inbox dedupe
MIS-033 Implement mission-specific source-event dedupe
MIS-034 Implement COUNT
MIS-035 Implement SUM
MIS-036 Implement DISTINCT_COUNT
MIS-037 Implement FIRST_OCCURRENCE
MIS-038 Implement BOOLEAN if required
MIS-039 Implement atomic progress update
MIS-040 Implement completion transition
MIS-041 Implement unique reward trigger
MIS-042 Implement OrderCompleted consumer
MIS-043 Implement FIRST_PICKUP
MIS-044 Implement FIRST_DINE_IN
MIS-045 Implement legacy DINE_IN adapter mapping tests
MIS-046 Implement WalletTopUpCompleted consumer
MIS-047 Implement FIRST_TOP_UP_MIN_AMOUNT single variant
MIS-048 Implement SUM Top-Up variant if required
MIS-049 Implement currency validation for Top-Up
MIS-050 Implement FeedbackSubmitted consumer
MIS-051 Implement FIRST_FEEDBACK
MIS-052 Implement feedback-type configuration
MIS-053 Implement EXPLORE_3_STORES
MIS-054 Implement distinct store dimension uniqueness
MIS-055 Implement Journey eligibility policy
MIS-056 Implement user_period_start
MIS-057 Implement prior-completion rule
MIS-058 Implement dynamic period
MIS-059 Implement Campaign eligibility separation
MIS-060 Implement mission visibility policy
MIS-061 Implement completed visibility policy
MIS-062 Implement reward-pending visibility
MIS-063 Implement progress target snapshot
MIS-064 Implement mission version snapshot
MIS-065 Implement active mission versioning
MIS-066 Implement event-time validation
MIS-067 Implement late-event policy
MIS-068 Implement future-event quarantine
MIS-069 Implement reversible-mission policy hook
MIS-070 Implement MissionCompleted event
MIS-071 Integrate Loyalty reward trigger
MIS-072 Implement reward projection
MIS-073 Consume RewardAssigned
MIS-074 Consume RewardClaimed
MIS-075 Consume RewardExpired if required
MIS-076 Implement created=false reuse behavior
MIS-077 Implement progress expiry worker
MIS-078 Implement SKIP LOCKED batching
MIS-079 Implement repeatable cycle reset if required
MIS-080 Implement completed-unrewarded auto-assignment
MIS-081 Implement message fields
MIS-082 Implement message selection
MIS-083 Implement Khmer/English fallback
MIS-084 Implement customer mission list
MIS-085 Implement customer mission detail
MIS-086 Implement deterministic sorting
MIS-087 Implement admin mission list/detail
MIS-088 Implement admin create/update
MIS-089 Implement status changes
MIS-090 Implement archive/delete policy
MIS-091 Implement progress list/detail
MIS-092 Implement admin filters
MIS-093 Integrate customer-name admin projection
MIS-094 Enforce Journey-only UI/backend period fields
MIS-095 Implement mission.read
MIS-096 Implement mission.manage
MIS-097 Implement mission.activate
MIS-098 Implement mission.progress.read
MIS-099 Implement mission.progress.adjust if approved
MIS-100 Implement mission.reconcile
MIS-101 Implement admin audit
MIS-102 Implement manual correction event if approved
MIS-103 Implement reconciliation runner
MIS-104 Implement COUNT/SUM reconciliation
MIS-105 Implement DISTINCT reconciliation
MIS-106 Implement completion/reward reconciliation
MIS-107 Implement Journey-period reconciliation
MIS-108 Implement business metrics
MIS-109 Implement technical metrics
MIS-110 Implement dashboard
MIS-111 Implement alerts
MIS-112 Implement tracing
MIS-113 Write progress-not-updating runbook
MIS-114 Write duplicate-progress runbook
MIS-115 Write duplicate-reward runbook
MIS-116 Write eligibility-incident runbook
MIS-117 Write expiry backlog runbook
MIS-118 Write Outbox backlog runbook
MIS-119 Implement backup/restore procedure
MIS-120 Implement DR procedure
MIS-121 Prepare legacy mission migration
MIS-122 Implement Journey migration checks
MIS-123 Implement Campaign migration checks
MIS-124 Implement progress migration
MIS-125 Implement distinct-dimension migration
MIS-126 Implement reward-link migration
MIS-127 Run migration reconciliation
MIS-128 Implement domain tests
MIS-129 Implement Journey boundary tests
MIS-130 Implement Campaign separation tests
MIS-131 Implement First Top-Up tests
MIS-132 Implement First Pickup tests
MIS-133 Implement First Dine-In tests
MIS-134 Implement Feedback tests
MIS-135 Implement Explore Stores tests
MIS-136 Implement progress concurrency tests
MIS-137 Implement completion race tests
MIS-138 Implement expiry tests
MIS-139 Implement auto-assignment tests
MIS-140 Implement message selection tests
MIS-141 Implement translation tests
MIS-142 Implement PostgreSQL Testcontainers tests
MIS-143 Implement Kafka tests
MIS-144 Implement reward integration tests
MIS-145 Implement reconciliation tests
MIS-146 Implement load tests
MIS-147 Implement hot-event test
MIS-148 Implement security tests
MIS-149 Implement failure tests
MIS-150 Implement Kafka replay test
MIS-151 Implement backup/restore replay test
MIS-152 Complete ADRs/policy freeze
MIS-153 Phase 17 exit review
```

---

# 323. Recommended ADRs

```text
ADR-MIS-001 Mission deployable boundary
ADR-MIS-002 Journey vs Campaign semantics
ADR-MIS-003 Mission code standard
ADR-MIS-004 Translation key policy
ADR-MIS-005 Progress creation strategy
ADR-MIS-006 Journey user-period policy
ADR-MIS-007 Mission start semantics
ADR-MIS-008 Dynamic progress period model
ADR-MIS-009 Completion visibility
ADR-MIS-010 Progress expiry vs mission end
ADR-MIS-011 Repeatable cycle model
ADR-MIS-012 First Top-Up semantics
ADR-MIS-013 Feedback eligibility
ADR-MIS-014 Progress transaction granularity
ADR-MIS-015 Event-time/late-event policy
ADR-MIS-016 Reversible progress policy
ADR-MIS-017 Mission versioning
ADR-MIS-018 Reward trigger contract
ADR-MIS-019 Reward projection
ADR-MIS-020 Auto-assignment policy
ADR-MIS-021 Message localization model
ADR-MIS-022 Customer lifecycle projection
ADR-MIS-023 Reconciliation model
ADR-MIS-024 Legacy migration
```

---

# 324. Phase 17 Policy Freeze Checklist

Before production resolve:

- [ ] Mission deployed separately vs co-deployed.
- [ ] Mission start semantics.
- [ ] `user_period_start` exact rule.
- [ ] Registration boundary inclusivity.
- [ ] Prior completion rule.
- [ ] Journey visibility after completion.
- [ ] Campaign visibility/history behavior.
- [ ] Progress creation: eager/lazy/hybrid.
- [ ] Default progress expiry.
- [ ] Mission end vs progress expiry behavior.
- [ ] Repeatable cycle policy.
- [ ] First Top-Up single vs cumulative.
- [ ] Top-Up currency normalization.
- [ ] Feedback types.
- [ ] Registration mission enabled?
- [ ] Mission condition AND semantics.
- [ ] Allowed condition types.
- [ ] Late-event window.
- [ ] Future-event tolerance.
- [ ] Progress reversal policy.
- [ ] Active mission version migration.
- [ ] Reward trigger: event vs direct command.
- [ ] Auto-assignment policy.
- [ ] Reward-pending visibility.
- [ ] `created=false` contract with Loyalty.
- [ ] Message translation keys vs resolved copy.
- [ ] English/Khmer fallback order.
- [ ] Translation numeric-character rule.
- [ ] Admin hard-delete policy.
- [ ] Manual progress correction allowed?
- [ ] Customer lifecycle projection strategy.
- [ ] Reconciliation frequency.
- [ ] Retention.
- [ ] SLOs/alerts.
- [ ] Legacy migration strategy.

---

# 325. Acceptance — Ownership

Team can answer:

```text
What does Mission own?
What remains Ordering?
What remains Wallet?
What remains Loyalty?
What remains Promotion?
What remains Notification?
```

---

# 326. Acceptance — Journey Eligibility

Given any customer, team can explain eligibility using:

```text
customer registered_at
user_period_start
mission_start
prior completion
mission type
mission active window
```

with no UI-only behavior.

---

# 327. Acceptance — Campaign Isolation

Campaign mission does not inherit Journey-only:

```text
user_period_start
```

logic.

---

# 328. Acceptance — Event Exactly Once

Replay the same source event:

```text
once
twice
concurrently
after consumer restart
after Kafka replay
```

Expected:

```text
one progress effect per mission
```

---

# 329. Acceptance — COUNT

Concurrent eligible events produce correct count without lost increments.

---

# 330. Acceptance — SUM

Eligible values accumulate correctly with correct currency/normalization.

---

# 331. Acceptance — DISTINCT_COUNT

Repeated same dimension does not increase progress.

---

# 332. Acceptance — FIRST_OCCURRENCE

First qualifying event completes once.

Later/replayed events do not retrigger completion.

---

# 333. Acceptance — Completion

Concurrent target-crossing events result in:

```text
one COMPLETED transition
one completion event
one reward trigger
```

---

# 334. Acceptance — Reward

One mission completion produces:

```text
exactly one Loyalty reward assignment
```

even if MissionCompleted replays.

---

# 335. Acceptance — Expiry

System correctly distinguishes:

```text
incomplete expired progress
completed reward pending
completed reward assigned
reward claimed
repeatable cycle reset
```

---

# 336. Acceptance — Auto-Assignment

Completed/unrewarded progress reaching expiry:

```text
reuses existing assignment if found
or
creates exactly one assignment
```

---

# 337. Acceptance — Messages

For each language/state:

```text
normal progress
milestone completed
reward completed
```

returns the correct message with fallback.

---

# 338. Acceptance — Reconciliation

System detects:

```text
wrong progress
distinct mismatch
completion inconsistency
missing reward
duplicate reward
expired active progress
Journey-period mismatch
```

---

# 339. Acceptance — Restore

After restoring Mission DB and replaying Kafka:

```text
progress is not double-counted
completion is not duplicated
reward is not duplicated
expired progress is not incorrectly resurrected
```

---

# 340. Acceptance — Security

Customer cannot:

```text
increment progress manually
read another customer's progress
```

Unauthorized service cannot spoof source events.

---

# 341. Acceptance — Operations

Operators can answer:

```text
Is source-event consumption lagging?
Which mission is failing?
Is expiry backlog growing?
Are reward assignments stuck?
Are progress/reward states reconciling?
```

without direct data surgery.

---

# 342. Phase 17 Completion Tree

```text
PHASE 17 — MISSION SERVICE

├── Service Boundary                         ✅
├── Journey / Campaign                       ✅
├── MissionDefinition Aggregate              ✅
├── Mission Status                           ✅
├── Mission Code                             ✅
├── Translation Keys                         ✅
├── MissionProgress Aggregate                ✅
├── Progress / Reward Status                 ✅
├── Progress Types                           ✅
│   ├── COUNT
│   ├── SUM
│   ├── DISTINCT_COUNT
│   ├── FIRST_OCCURRENCE
│   └── BOOLEAN
├── Event Idempotency                        ✅
├── Conditions                               ✅
├── Eligibility                              ✅
├── Journey User Period                      ✅
├── Dynamic Period                           ✅
├── Campaign Period Separation               ✅
├── Mission Visibility                       ✅
├── Progress Expiry                          ✅
├── Reset / Cycle                            ✅
├── FIRST_TOP_UP_MIN_AMOUNT                  ✅
├── FIRST_PICKUP                             ✅
├── FIRST_DINE_IN                            ✅
├── FIRST_FEEDBACK                           ✅
├── EXPLORE_3_STORES                         ✅
├── Distinct Dimensions                      ✅
├── Candidate Lookup                         ✅
├── Progress Concurrency                     ✅
├── Completion Race Protection               ✅
├── Event-Time / Late Events                 ✅
├── Reward Trigger                           ✅
├── Reward Assignment Projection             ✅
├── Auto-Assignment                          ✅
├── Message Selection                        ✅
├── Khmer / English Fallback                 ✅
├── Customer APIs                            ✅
├── Admin APIs                               ✅
├── Mission Versioning                       ✅
├── PostgreSQL Schema                        ✅
├── Clean Architecture                       ✅
├── Kafka / Outbox / Inbox                   ✅
├── Scheduler                                ✅
├── Reconciliation                           ✅
├── RBAC / Audit                             ✅
├── Privacy / Retention                      ✅
├── Metrics / Alerts / Dashboard             ✅
├── Runbooks                                 ✅
├── Backup / Restore / DR                    ✅
├── Flyway / Legacy Migration                ✅
├── Testing / Load / Failure                 ✅
└── Notification Handoff                     ✅
```

---

# 343. Handoff to Phase 18

The next implementation document is:

```text
PHASE 18 — Notification Service
```

---

# 344. Phase 18 Ownership

Notification will own:

```text
Notification Request
Template
Channel
Push
Email
SMS if used
In-App Notification
Localization
Delivery Attempt
Retry
Preference Enforcement
Deduplication
Scheduling
Notification History
Provider Integration
```

---

# 345. Mission → Notification Boundary

Mission decides:

```text
MissionCompleted
```

occurred.

Notification decides:

```text
whether to notify
which template
which channel
which language
when to retry
```

---

# 346. Notification Inputs from Mission/Loyalty

Potential:

```text
MissionCompleted
RewardAssigned
RewardExpiringSoon
PointsExpiringSoon
```

Mission does not perform push/email delivery itself.

---

# 347. Final Phase 17 Principle

Canonical mission flow:

```text
Business Event
      ↓
Candidate Mission Lookup
      ↓
Eligibility
      ↓
Condition Evaluation
      ↓
Idempotent Progress Update
      ↓
Completion Once
      ↓
Reward Trigger Once
      ↓
Loyalty Reward Assignment
```

Journey eligibility adds:

```text
customer registration date
+
user_period_start
+
mission start
+
prior completion
```

The most important implementation rules are:

```text
Mission owns progress, not source business facts.
Source events are deduplicated.
Journey and Campaign have different eligibility semantics.
Journey user-period rules are explicit and boundary-tested.
Campaign does not inherit Journey-only fields.
Progress calculations are typed and configuration-driven.
COUNT, SUM, DISTINCT_COUNT, FIRST_OCCURRENCE, and BOOLEAN have different storage/concurrency needs.
Distinct progress uses unique dimension storage.
Progress updates are concurrency-safe.
Completion happens exactly once.
Reward trigger happens exactly once.
Loyalty owns reward assignment and points.
Mission does not write Wallet, Loyalty, Promotion, or Order databases.
Progress expiry is different from mission end.
Completed-but-unrewarded progress is not blindly reset.
Auto-assignment reuses an existing assignment when `created=false` means one already exists.
Messages are selected from reward/progress state.
Khmer/English fallback is deterministic.
Mission versions protect existing customer progress from silent active-rule changes.
Business eligibility uses event occurrence time according to late-event policy.
Redis is optional acceleration, never mission truth.
Reconciliation detects incorrect progress, distinct counts, and missing/duplicate rewards.
Restore + Kafka replay remains safe through event IDs, uniqueness, and reward idempotency.
```

---

**End of PHASE 17 — Mission Service**
