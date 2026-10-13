---
title: "PART 18 — MISSION SERVICE"
---

# PART 18 — MISSION SERVICE

> **Document Role:** Defines the complete architecture, domain model, eligibility engine, progress model, mission-period rules, reward-trigger workflow, event-consumption model, persistence design, reconciliation, testing strategy, and production standards for the Mission Service.  
> **Previous Part:** PART 17 — Promotion / Coupon Service  
> **Next Part:** PART 19 — Notification Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, product engineers, loyalty engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 2886 — Purpose

The Mission Service owns customer goal/progress workflows.

It answers:

```text
Which missions exist?
Which missions are visible to this customer?
Is the customer eligible?
When does the user's mission period begin?
What event increments progress?
How much progress has been completed?
Has the mission been completed?
Has the reward already been assigned?
Has the mission expired?
Should the mission reset?
Should an unclaimed reward be auto-assigned?
```

Mission is a behavior/progress engine.

It is not:

```text
the points ledger
the wallet ledger
the discount engine
the order lifecycle
the customer profile master
```

---

# 2887 — Mission Service Responsibilities

Mission Service owns:

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

Possible future responsibilities:

```text
Mission chains
Mission prerequisites
Branching missions
Mission groups
Progress sharing
Team missions
Personalized missions
Segment-specific mission plans
A/B-tested mission rules
```

---

# 2888 — Deployment Boundary

From PART 03:

```text
Mission may initially remain a module inside Loyalty Service
```

Recommended initial deployment:

```text
loyalty-service
  ├── points
  ├── tier
  ├── rewards
  └── mission
```

Logical boundary:

```text
Mission domain remains separate
```

so it can later become:

```text
mission-service
```

without redesigning the core model.

---

# 2889 — Non-Responsibilities

Mission does not own:

```text
Order
Wallet balance
Points balance
Coupon discount rules
Customer profile
Notification transport
Product catalog
```

Mission consumes facts such as:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
CustomerRegistered
```

and updates progress.

---

# 2890 — Mission Boundary

High-level:

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
 Eligibility  Progress     Completion
      │          │           │
      └──────────┼───────────┘
                 ▼
            mission_db
                 │
                 ▼
        Loyalty / Reward
```

---

# 2891 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Mission | Configured customer goal |
| Journey | Mission type primarily intended for onboarding/lifecycle progression |
| Campaign | Mission type primarily intended for broader customer populations |
| Mission Definition | Configuration describing what must be done |
| Mission Progress | Customer-specific state toward completion |
| Mission Event | Qualifying business event used to update progress |
| Condition | Requirement that an event/customer must satisfy |
| Target | Required progress amount/count |
| User Period Start | Earliest customer registration/lifecycle date eligible for a Journey mission |
| Mission Start | Time mission begins |
| Mission End | Time mission stops accepting progress |
| Cycle | Repeatable execution period of a mission |
| Completion | State where target is reached |
| Reward Trigger | Action requesting reward assignment |
| Progress Message | Customer-facing localized progress text |

---

# 2892 — Mission Types

Canonical mission types:

```text
JOURNEY
CAMPAIGN
```

Potential future types:

```text
DAILY
WEEKLY
SEASONAL
CHALLENGE
PARTNER
```

Do not overload type names with UI behavior only.

---

# 2893 — Journey Mission

Journey is designed for:

```text
new-user onboarding
lifecycle milestones
first-time behaviors
customer activation
```

Examples:

```text
Register
First Top-Up With Minimum Amount
First Pickup
First Dine-In
First Feedback
Explore 3 Stores
```

---

# 2894 — Campaign Mission

Campaign is designed for:

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

# 2895 — Journey vs Campaign Boundary

Journey eligibility may depend on:

```text
customer registration date
user_period_start
mission creation/start
prior completion
```

Campaign eligibility more commonly depends on:

```text
campaign segment
mission active window
customer eligibility
```

Do not apply Journey-only period logic to Campaign.

---

# 2896 — Mission Aggregate

Possible aggregate root:

```text
MissionDefinition
```

State:

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

# 2897 — Mission Status

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

# 2898 — Mission Definition Invariants

Examples:

```text
mission_code unique
target_value > 0
active mission has valid event type
Journey may define user_period_start
Campaign must not accidentally inherit Journey-only user-period logic
starts_at <= ends_at when end exists
reward configuration valid before activation
```

---

# 2899 — Mission Code

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

# 2900 — Mission Translation Keys

Recommended fields:

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

Translation values live in translation/configuration domain.

---

# 2901 — Translation Key Validation

If mobile clients cannot support numeric translation keys:

```text
reject keys containing digits
```

centrally in backend validation.

Example allowed:

```text
mission_first_pickup_title
```

Example rejected:

```text
mission01_title
```

Do not rely only on admin UI.

---

# 2902 — Translation Key Creation

For new translation entry:

```text
key field should initially be empty
```

Admin intentionally enters a valid key.

---

# 2903 — Mission Progress Aggregate

Possible aggregate:

```text
MissionProgress
```

State:

```text
progress_id
mission_id
customer_id
cycle_id
status
current_progress
target_progress
started_at
completed_at
expires_at
reward_status
reward_assignment_id
version
created_at
updated_at
```

---

# 2904 — Progress Status

Recommended:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
EXPIRED
INELIGIBLE
```

Potential:

```text
REWARDED
```

should generally remain reward state, not progress state.

---

# 2905 — Reward Status

Keep separate:

```text
NOT_ELIGIBLE
PENDING
ASSIGNED
CLAIMED
EXPIRED
FULFILLMENT_PENDING
FULFILLED
```

A mission can be:

```text
COMPLETED
```

while reward is:

```text
ASSIGNED
```

or:

```text
CLAIMED
```

---

# 2906 — Mission Completion Invariant

```text
current_progress >= target_progress
```

implies:

```text
mission progress can transition to COMPLETED
```

but completion should happen once.

---

# 2907 — Progress Capping

Recommended:

```text
current_progress
=
min(calculated_progress, target_progress)
```

for simple count/sum progress shown to customer.

Historical event count may exceed target, but visible target progress need not.

---

# 2908 — Progress Types

Canonical:

```text
COUNT
SUM
DISTINCT_COUNT
FIRST_OCCURRENCE
BOOLEAN
```

---

# 2909 — COUNT Progress

Example:

```text
Complete 3 orders
```

Each eligible event:

```text
+1
```

---

# 2910 — SUM Progress

Example:

```text
Top up until total reaches $20
```

Eligible event adds:

```text
amount
```

---

# 2911 — DISTINCT_COUNT Progress

Example:

```text
Explore 3 stores
```

Progress:

```text
count(distinct store_id)
```

---

# 2912 — FIRST_OCCURRENCE Progress

Example:

```text
First Pickup
```

First qualifying event completes target:

```text
0 → 1
```

Later events do nothing.

---

# 2913 — BOOLEAN Progress

Example:

```text
Complete profile verification
```

Event changes:

```text
false → true
```

---

# 2914 — Mission Event

Mission consumes domain facts.

Examples:

```text
CUSTOMER_REGISTERED
WALLET_TOPUP_COMPLETED
ORDER_COMPLETED
FEEDBACK_SUBMITTED
PROFILE_COMPLETED
```

---

# 2915 — Event Source Ownership

Mission must consume source-owned facts:

```text
OrderCompleted from Order
WalletTopUpCompleted from Wallet
FeedbackSubmitted from Feedback
CustomerCreated/Registered from Identity/Customer
```

Mission must not query and infer hidden state directly from another service's DB.

---

# 2916 — Event Envelope

Use the platform contract from PART 05:

```text
event_id
event_type
event_version
producer
occurred_at
correlation_id
data
```

---

# 2917 — Event Idempotency

Every consumed event must be safe against:

```text
duplicate delivery
consumer retry
Kafka replay
restore replay
```

Use:

```text
processed_events
```

and mission-specific uniqueness where needed.

---

# 2918 — Processed Event Key

Recommended:

```text
(event_id, consumer_name)
```

---

# 2919 — Mission Progress Event History

Optional append-only table:

```text
mission_progress_events
```

stores:

```text
source_event_id
event_type
progress_delta
distinct_value
accepted
reason
```

Useful for:

```text
rebuild
audit
debugging
```

---

# 2920 — Mission Condition Model

Conditions may evaluate:

```text
event fields
customer attributes
mission period
store/channel
amount
fulfillment type
feedback type
```

---

# 2921 — Condition Types

Examples:

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

# 2922 — Rule Engine Strategy

Start with:

```text
typed mission handlers
+
validated configuration
```

Avoid a generic scripting language initially.

Benefits:

```text
testability
clarity
security
maintainability
```

---

# 2923 — Mission Handler Interface

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

# 2924 — Mission Eligibility

Eligibility determines whether the customer should:

```text
see mission
progress mission
receive reward
```

These may not always be identical.

---

# 2925 — Eligibility Inputs

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

# 2926 — Journey User Period

Journey may define:

```text
user_period_start
```

This is the date from which customer registration is eligible for that journey generation.

Example:

```text
User period starts = 2026-10-01
```

---

# 2927 — Journey Mission Start

Journey mission also defines:

```text
mission_start
```

In the current admin model, this may be:

```text
read-only
equal to created_date
```

if that is the chosen business behavior.

---

# 2928 — Dynamic Period

Do not hard-code:

```text
30 days
90 days
```

unless specific mission rule requires it.

Mission period must be configuration-driven.

---

# 2929 — Journey Eligibility Rule

The exact rule must be deterministic.

A practical interpretation:

```text
If customer completed the Journey mission before user_period_start:
    hide / no reward

If mission was created after user_period_start:
    customers registered before user_period_start may be excluded
    customers registered on/after user_period_start may participate

If customer registers after mission creation:
    show normally if otherwise eligible
```

This business rule must be represented in testable policy code.

---

# 2930 — Prior Completion Rule

If Journey mission was already completed before the configured eligibility period:

```text
do not re-show
do not re-reward
```

unless mission explicitly supports cycles/repeat.

---

# 2931 — Campaign Period Rule

Campaign does not use Journey `user_period_start` unless explicitly configured by a different policy.

Admin UI should not show Journey-only period fields for Campaign.

---

# 2932 — Mission Visibility

A mission can be hidden when:

```text
not started
ended
customer ineligible
already completed and should disappear
outside journey cohort
archived
```

---

# 2933 — Completed Mission Visibility

Business options:

```text
hide immediately
show as completed
show until reward claimed
show for history
```

Choose per mission type.

---

# 2934 — Reward-Pending Visibility

Recommended:

```text
completed + unclaimed reward
```

remains visible until:

```text
reward claimed
reward auto-assigned/fulfilled
reward expired
```

if customer needs action.

---

# 2935 — Progress Expiry

Possible field:

```text
progress_expires_at
```

defines customer-specific progress expiration.

This is separate from:

```text
mission.ends_at
```

---

# 2936 — Mission End vs Progress Expiry

Mission end:

```text
no new campaign participation after this time
```

Progress expiry:

```text
this customer's current progress cycle expires
```

Do not mix.

---

# 2937 — Progress Reset

For repeatable mission:

```text
expired incomplete progress
      ↓
reset/new cycle
```

depending on policy.

Never overwrite completed historical cycle if history is needed.

---

# 2938 — Cycle ID

Recommended:

```text
cycle_id
```

for repeatable missions.

Examples:

```text
2026-W41
2026-10
CUSTOM_CYCLE_001
```

---

# 2939 — Mission Cycle Table

Possible:

```text
mission_cycles
--------------
id
mission_id
cycle_code
starts_at
ends_at
status
```

---

# 2940 — Single-Completion Journey

First-time missions should usually be:

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

# 2941 — First Top-Up With Minimum Amount

Mission code:

```text
FIRST_TOP_UP_MIN_AMOUNT
```

Source event:

```text
WalletTopUpCompleted
```

Progress type:

```text
FIRST_OCCURRENCE
```

or:

```text
SUM
```

depending requirement.

---

# 2942 — First Top-Up Rule Variant A

If requirement is:

```text
first single top-up >= minimum
```

Condition:

```text
topup.amount >= configured_minimum
```

First qualifying event completes mission.

---

# 2943 — First Top-Up Rule Variant B

If requirement is:

```text
accumulate successful top-ups until $20
```

Progress:

```text
SUM(topup.amount)
```

until:

```text
target_amount = 20
```

The mission definition must choose one variant explicitly.

---

# 2944 — Top-Up Currency

If minimum is configured in USD:

```text
event currency = USD
```

or explicit conversion is required.

Do not compare KHR amount directly to USD threshold.

---

# 2945 — Top-Up Idempotency

Use:

```text
WalletTopUpCompleted.event_id
```

and business reference:

```text
topup_id
```

to prevent double progress.

---

# 2946 — First Pickup

Mission code:

```text
FIRST_PICKUP
```

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

# 2947 — First Dine-In

Mission code:

```text
FIRST_DINE_IN
```

Source:

```text
OrderCompleted
```

Condition:

```text
fulfillment_type = DINE_IN
```

Legacy mapping may translate:

```text
selfdinein → DINE_IN
```

in the Order/Integration boundary.

---

# 2948 — First Feedback

Mission code:

```text
FIRST_FEEDBACK
```

Source:

```text
FeedbackSubmitted
```

Current business direction:

```text
count all feedback types related to feedback
```

not only:

```text
suggestion
```

---

# 2949 — Feedback Type Configuration

Instead of hard-coding one type, configure:

```text
eligible_feedback_types = ALL
```

or list:

```text
SUGGESTION
COMPLIMENT
COMPLAINT
OTHER
```

depending source system vocabulary.

---

# 2950 — Explore 3 Stores

Mission code:

```text
EXPLORE_3_STORES
```

Source:

```text
OrderCompleted
```

Progress type:

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

# 2951 — Explore Store Uniqueness

Same store completed 5 times:

```text
progress contribution = 1 distinct store
```

Use unique:

```text
(progress_id, dimension_type, dimension_value)
```

---

# 2952 — Distinct Progress Table

Possible:

```text
mission_progress_dimensions
---------------------------
id
progress_id
dimension_type
dimension_value
source_event_id
created_at
```

Unique:

```text
(progress_id, dimension_type, dimension_value)
```

---

# 2953 — Registration Mission

Possible Journey mission:

```text
REGISTER
```

Source:

```text
CustomerCreated
```

May complete immediately when account is created.

---

# 2954 — News/Register Mission Content

Translation example keys:

```text
mission_news_register_title
mission_news_register_desc
```

Keep customer-facing content outside hard-coded domain behavior.

---

# 2955 — Mission Conditions Count

Admin UI may expose three condition fields for current product.

Backend model should support:

```text
0..N conditions
```

even if UI currently renders 3.

---

# 2956 — Condition Ordering

Conditions normally combine with:

```text
AND
```

unless configuration supports explicit groups.

Avoid adding arbitrary nested boolean logic in MVP.

---

# 2957 — Condition Schema Validation

Each condition type defines required parameters.

Example:

```text
AMOUNT_GTE
requires:
  amount
  currency
```

Reject invalid configuration before activation.

---

# 2958 — Mission Progress Update Flow

General:

```text
Receive event
      ↓
Deduplicate
      ↓
Find active missions for event_type
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
```

---

# 2959 — Mission Candidate Lookup

Avoid scanning every mission.

Index/cache missions by:

```text
event_type
status
time window
mission_type
```

---

# 2960 — Mission Definition Cache

Redis may cache:

```text
active missions by event_type
```

Example:

```text
mission:active:ORDER_COMPLETED
```

Authoritative definitions remain PostgreSQL.

---

# 2961 — Mission Progress Cache

May cache customer mission list.

But authoritative progress remains PostgreSQL.

---

# 2962 — Event Processing Transaction

Recommended:

```text
BEGIN

check processed_events
find/load progress
apply delta
insert progress event
if completed:
    mark completed
    create reward trigger/assignment reference
insert outbox
mark source event processed

COMMIT
```

---

# 2963 — Reward Assignment Boundary

Mission should not directly manipulate:

```text
points balance
wallet balance
coupon tables
```

Mission requests reward assignment/fulfillment through Loyalty/Reward boundary.

---

# 2964 — Reward Trigger

Possible command/event:

```text
MissionCompleted
```

with:

```text
mission_id
customer_id
progress_id
reward_campaign_id
completion_reference
```

---

# 2965 — Reward Assignment Idempotency

Unique business reference:

```text
MISSION_PROGRESS + progress_id
```

ensures one reward assignment per completion.

---

# 2966 — Immediate Reward Assignment

Option A:

```text
Mission transaction
      ↓
call Reward module synchronously
```

If same deployable/database boundary, this can be a local application call.

---

# 2967 — Event-Driven Reward Assignment

Option B:

```text
MissionCompleted
      ↓
Reward consumer
      ↓
Assign reward
```

Better if separate services.

Must be idempotent.

---

# 2968 — Reward Assignment Response

Mission may store:

```text
reward_assignment_id
reward_status
```

as projection/reference.

Reward subsystem remains authoritative.

---

# 2969 — Auto-Assign on Progress Expiry

If progress is:

```text
COMPLETED
```

but reward not yet assigned/claimed according to policy when progress expires:

```text
auto-assign reward
```

before closing/resetting progress.

---

# 2970 — Auto-Assignment Flow

```text
Find expired completed progress
      ↓
Lock progress
      ↓
Check reward assignment
      ├── exists → no-op
      └── missing
           ↓
        assign/select reward
           ↓
        save reference
      ↓
Finalize expiry/reset policy
```

---

# 2971 — Already Assigned Branch

If reward assignment function returns:

```text
created = false
```

interpret as:

```text
an assignment already exists
```

when the function contract guarantees that meaning.

Mission should reuse the existing assignment rather than create another.

---

# 2972 — Reward Selection

Mission can reference:

```text
fixed reward
```

or:

```text
reward campaign
```

Reward subsystem applies:

```text
weighted/proportional selection
quantity limits
```

Mission does not reimplement reward distribution.

---

# 2973 — Reward Validity

Assignment may calculate:

```text
claim_expires_at
```

using:

```text
reward_valid_days
```

or configured absolute end date.

---

# 2974 — Progress Message Fields

Recommended mission configuration:

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

# 2975 — Message Selection Rule

Current desired rule:

```text
if rewardStatus indicates final reward completion:
    complete_message
else if milestoneCompleted:
    progress_complete_message
else:
    progress_message
```

with language fallback.

---

# 2976 — Language Fallback

Example:

```text
requested language value exists?
  yes → use it
  no  → fallback English/default
```

Do not return empty string when fallback exists.

---

# 2977 — Progress Title / Description

Each mission may expose:

```text
progress_title
progress_description
```

separate from mission:

```text
title
description
rule
```

---

# 2978 — Current Translation Set

Current admin/client convention may use six translated groups:

```text
Title
Description
Rule
Progress Title
Progress Description
Conditions
```

Keep translation ownership explicit.

---

# 2979 — Mission API: Customer List

Example:

```text
GET /api/v1/missions
```

Returns only:

```text
visible
eligible
active/history-as-policy
```

missions for authenticated customer.

---

# 2980 — Mission List Response

Example:

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

# 2981 — Mission Detail

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

# 2982 — Customer Authorization

Customer can only view:

```text
their own mission progress
```

Do not expose arbitrary:

```text
user_id
```

query for normal customer APIs.

---

# 2983 — Admin Mission APIs

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

# 2984 — Mission Admin Actions

Canonical actions may map to:

```text
LIST
DETAIL
CREATE
UPDATE
CHANGE_STATUS
DELETE
```

for portal proxy integration.

---

# 2985 — Mission Progress Admin Actions

Canonical:

```text
USER_MISSION_LIST
USER_MISSION_DETAIL
```

---

# 2986 — Admin Progress Search

Recommended filters:

```text
mission_id/code
customer_id
status
date range
reward status
```

If `card_number` search is removed from product requirements, do not retain unused filter/column.

---

# 2987 — Customer Name in Admin Progress

If progress table contains:

```text
user_id/customer_id
```

admin read model may join/project authorized customer name through:

```text
Customer Service read model
```

or synchronized admin projection.

Do not create forbidden cross-service DB joins in the final microservice design.

---

# 2988 — Admin UI Period Fields

For Journey:

```text
User period starts*
Mission starts*
```

Mission start may be read-only if tied to creation date.

For Campaign:

```text
hide Journey-only user period fields
```

---

# 2989 — Admin UI Validation

Backend must validate:

```text
mission type
period fields
target
event source
conditions
translation keys
reward campaign
```

UI validation alone is insufficient.

---

# 2990 — Period Count Bug Prevention

Do not derive mission period count from:

```text
UI row count
```

or duplicate fields.

Backend stores explicit period/cycle model.

---

# 2991 — Mission Expired Status

Status shown to admin/customer must be computed consistently from:

```text
mission window
progress expiry
completion
reward state
```

Avoid showing:

```text
ACTIVE
```

when progress is actually expired.

---

# 2992 — Mission Activation Validation

Before `ACTIVE`:

```text
event type supported
target > 0
conditions valid
translation keys valid
Journey period rule valid
reward configuration valid
time window valid
```

---

# 2993 — Mission Definition Versioning

Published/active behavior should be versioned.

Store:

```text
rule_version
```

on progress event/completion where helpful.

---

# 2994 — Editing Active Mission

High-risk fields:

```text
target
conditions
eligibility period
reward
event type
progress type
```

should not silently change existing customer progress.

Prefer:

```text
new mission version
```

or explicit migration policy.

---

# 2995 — Mission Version Model

Possible:

```text
mission_versions
----------------
id
mission_id
version
configuration_json
published_at
published_by
status
```

---

# 2996 — Existing Progress and New Version

Options:

```text
existing users stay on old version
migrate progress
reset progress
new users only use new version
```

Must be explicit per change.

---

# 2997 — Mission Database Overview

Possible tables:

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
```

---

# 2998 — Mission Definitions Table

Example:

```text
mission_definitions
-------------------
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

# 2999 — Mission Versions Table

```text
mission_versions
----------------
id
mission_id
version
configuration_json
published_at
published_by
status
```

---

# 3000 — Mission Conditions Table

```text
mission_conditions
------------------
id
mission_version_id
condition_type
operator
configuration_json
display_order
```

---

# 3001 — Mission Cycles Table

```text
mission_cycles
--------------
id
mission_id
cycle_code
starts_at
ends_at
status
created_at
```

---

# 3002 — Mission Progress Table

```text
mission_progress
----------------
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

# 3003 — Mission Progress Uniqueness

For non-repeatable mission:

```text
UNIQUE(mission_id, customer_id)
```

For repeatable mission:

```text
UNIQUE(mission_id, customer_id, cycle_id)
```

---

# 3004 — Mission Progress Events Table

```text
mission_progress_events
-----------------------
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

# 3005 — Mission Distinct Dimensions Table

```text
mission_progress_dimensions
---------------------------
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

# 3006 — Mission Reward Link

Possible:

```text
mission_reward_links
--------------------
mission_id
mission_version
reward_campaign_id
fixed_reward_id
assignment_policy
```

---

# 3007 — Mission Idempotency Table

For direct/admin commands:

```text
mission_idempotency
-------------------
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

# 3008 — Processed Events Table

```text
processed_events
----------------
event_id
consumer_name
processed_at
```

---

# 3009 — Outbox Events

Candidate:

```text
MissionStarted
MissionProgressed
MissionCompleted
MissionExpired
MissionReset
MissionRewardTriggered
```

---

# 3010 — Reconciliation Tables

```text
mission_reconciliation_runs
mission_reconciliation_mismatches
```

---

# 3011 — Progress Creation

Progress may be created:

```text
eagerly when mission becomes visible
```

or:

```text
lazily on first qualifying event
```

---

# 3012 — Eager Progress Creation

Advantages:

```text
simple mission list
explicit start time
```

Costs:

```text
many rows for customers who never interact
```

---

# 3013 — Lazy Progress Creation

Advantages:

```text
less storage
```

Costs:

```text
list API must compute NOT_STARTED state
more eligibility logic at read time
```

---

# 3014 — Recommended Strategy

For limited Journey mission set:

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

# 3015 — Progress Start

`started_at` should mean:

```text
customer's mission progress became active
```

not merely mission creation time.

---

# 3016 — Progress Target Snapshot

Store:

```text
target_progress
```

on customer progress.

This protects old progress if mission definition target later changes.

---

# 3017 — Rule Version Snapshot

Store:

```text
mission_version
```

or:

```text
rule_version
```

on progress.

---

# 3018 — Progress Update Concurrency

Two eligible events may arrive simultaneously.

Use:

```text
row lock
optimistic version
atomic update
```

to prevent lost increments.

---

# 3019 — Atomic Count Progress

Possible:

```sql
UPDATE mission_progress
SET current_progress = LEAST(target_progress, current_progress + :delta),
    version = version + 1
WHERE id = :progress_id
  AND status IN ('NOT_STARTED', 'IN_PROGRESS');
```

Completion still needs safe transition logic.

---

# 3020 — Completion Race

Two events may both observe:

```text
progress = target - 1
```

Only one should:

```text
mark COMPLETED
trigger reward
```

Use transactional lock and unique reward trigger.

---

# 3021 — Distinct Count Race

For Explore Stores:

```text
insert distinct store dimension
ON CONFLICT DO NOTHING
```

Only successful new dimension increases progress.

---

# 3022 — First-Occurrence Race

For FIRST_PICKUP:

```text
first qualifying event marks complete
```

Second concurrent event:

```text
sees completed / unique transition
```

and does not re-trigger reward.

---

# 3023 — SUM Progress Currency

If summing monetary amount:

```text
currency must match mission configuration
```

or use explicit normalized amount.

---

# 3024 — Event Time vs Processing Time

Mission eligibility should usually use:

```text
event.occurred_at
```

for business-time rules.

Processing time is only:

```text
when consumer handled it
```

Late events require a policy.

---

# 3025 — Late Event

Example:

```text
event occurred before mission end
but consumed after mission end
```

Policy may allow it if:

```text
occurred_at within active period
```

and replay window is accepted.

---

# 3026 — Future-Dated Event

Reject or quarantine event where:

```text
occurred_at
```

is unreasonably in future.

---

# 3027 — Out-of-Order Events

Mission progress should use idempotent fact processing.

For simple counts, order may not matter.

For stateful sequences, store enough event history/version.

---

# 3028 — Event Correction

If source publishes correction/reversal:

```text
OrderCancelled after OrderCompleted
```

Mission policy decides whether progress is reversed.

---

# 3029 — Reversible Missions

Some missions may allow:

```text
progress reversal
```

before reward assignment.

Others may treat completion as final.

Configure explicitly.

---

# 3030 — Completion Finality

First-time Journey mission usually:

```text
completion final
```

even if later transaction is refunded, unless business says otherwise.

Financial/reward-sensitive campaigns may require reversal.

---

# 3031 — Mission Reset Worker

For repeatable/expired missions:

```text
find due progress
      ↓
lock
      ↓
handle reward if completed
      ↓
mark EXPIRED
      ↓
create next cycle if applicable
```

---

# 3032 — Reset Incomplete Progress

If:

```text
IN_PROGRESS + expired
```

possible:

```text
mark EXPIRED
create next cycle at next period
```

Do not silently reuse old progress in new cycle.

---

# 3033 — Completed but Unclaimed

If:

```text
COMPLETED
reward pending
progress expiry reached
```

apply configured:

```text
auto-assign
auto-fulfill
expire reward
```

not a generic reset.

---

# 3034 — Reward Status Message Logic

Example:

```text
reward final/claimed
  → complete_message

mission target reached but reward pending
  → progress_complete_message

otherwise
  → progress_message
```

---

# 3035 — Mission Sorting

Customer mission list may sort by:

```text
priority
mission type
completion state
expiry
created_at
```

Define deterministic order.

---

# 3036 — Mission Priority

Optional field:

```text
priority
```

Use for UI ordering only unless explicitly part of eligibility.

---

# 3037 — Mission Visibility Cache

Cache key:

```text
mission:list:{customer_id}:{language}
```

Short TTL or event-driven invalidation.

---

# 3038 — Cache Invalidation

Invalidate on:

```text
progress update
completion
reward assignment
mission activation/pause
customer eligibility change
```

---

# 3039 — Mission Read Model

Possible optimized view:

```text
mission_customer_view
```

containing:

```text
mission definition summary
progress
reward summary
localized message keys
```

---

# 3040 — Translation Resolution

Options:

```text
Mission Service returns translation keys
```

or:

```text
Mission Service resolves localized values
```

Choose one platform-wide convention.

If resolving:

```text
language fallback mandatory
```

---

# 3041 — Admin Mission List

Columns may include:

```text
mission code
type
status
event type
target
start/end
user period start
reward campaign
created date
```

Journey-only columns should not confuse Campaign.

---

# 3042 — Admin Mission Progress List

Columns:

```text
customer ID
customer name projection
mission
progress
status
reward status
started
completed
expires
```

---

# 3043 — Search Behavior

Auto-filter can be used by UI.

Backend supports:

```text
q
mission_code
customer_id
status
```

Do not require a separate search-button semantic at API level.

---

# 3044 — Mission Detail Admin

Show:

```text
definition
conditions
version
eligible period
progress type
reward
translation keys
event source
```

---

# 3045 — Mission Create Validation

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

# 3046 — Mission Update Validation

If active and high-risk field changes:

```text
reject direct update
or
create new version
```

---

# 3047 — Mission Delete

Prefer:

```text
ARCHIVED
```

when customer progress/history exists.

Hard delete only unused draft missions.

---

# 3048 — Mission Status Change

Admin command:

```text
CHANGE_STATUS
```

must validate legal transitions.

---

# 3049 — Mission Error Catalog

Candidate:

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

# 3050 — Error Mapping

Example:

| Error | HTTP / gRPC |
|---|---:|
| MISSION_NOT_FOUND | 404 / NOT_FOUND |
| MISSION_NOT_ELIGIBLE | 403/422 |
| MISSION_ALREADY_COMPLETED | 409 / ALREADY_EXISTS |
| MISSION_PROGRESS_EXPIRED | 410 / FAILED_PRECONDITION |
| MISSION_INVALID_CONFIGURATION | 422 / INVALID_ARGUMENT |
| MISSION_VERSION_CONFLICT | 409 / ABORTED |

---

# 3051 — Mission Events Published

Candidate:

```text
MissionStarted
MissionProgressed
MissionCompleted
MissionExpired
MissionReset
MissionRewardTriggered
```

---

# 3052 — MissionProgressed Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "MISSION_PROGRESSED",
  "event_version": 1,
  "producer": "mission-service",
  "data": {
    "mission_id": "MIS001",
    "customer_id": "CUS001",
    "current_progress": 2,
    "target_progress": 3
  }
}
```

Only publish if a consumer actually needs frequent progress events.

---

# 3053 — MissionCompleted Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "MISSION_COMPLETED",
  "event_version": 1,
  "producer": "mission-service",
  "data": {
    "mission_id": "MIS001",
    "mission_code": "EXPLORE_3_STORES",
    "customer_id": "CUS001",
    "progress_id": "MP001",
    "completed_at": "..."
  }
}
```

---

# 3054 — Event Noise Policy

For high-frequency progress:

```text
do not publish every increment
```

unless Notification/Analytics requires it.

Completion events are more important.

---

# 3055 — Events Consumed

Likely:

```text
CustomerCreated
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
RewardAssigned
RewardClaimed
```

depending on projections.

---

# 3056 — Reward Events

Mission may consume:

```text
RewardAssigned
RewardClaimed
RewardExpired
```

to update local reward projection/message state.

---

# 3057 — Reward Projection

Fields:

```text
reward_assignment_id
reward_status
reward_code
claim_expires_at
```

can be stored as local projection if needed.

Reward subsystem remains authoritative.

---

# 3058 — Mission / Loyalty Interaction

If same deployable:

```text
Mission application module
  ↓
Reward application module
```

via internal interfaces.

If separate services:

```text
MissionCompleted
  ↓
Kafka / command
  ↓
Loyalty/Reward Service
```

---

# 3059 — Mission / Promotion Interaction

Mission reward may produce:

```text
coupon
```

through Loyalty/Reward → Promotion.

Mission should not directly mutate Promotion DB.

---

# 3060 — Mission / Notification Interaction

Notification consumes:

```text
MissionCompleted
RewardAssigned
RewardExpiringSoon
```

Mission does not send push directly.

---

# 3061 — Mission Service Clean Architecture

Recommended:

```text
mission-service/
│
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
│
├── application/
│   ├── query/
│   ├── progress/
│   ├── complete/
│   ├── expire/
│   ├── reset/
│   ├── admin/
│   └── reconciliation/
│
├── adapter/in/
│   ├── rest/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── customer/
│   ├── loyalty/
│   ├── reward/
│   ├── redis/
│   └── kafka/
│
└── config/
```

---

# 3062 — Input Ports

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

# 3063 — Output Ports

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

# 3064 — ProcessMissionEventUseCase

Pseudo:

```text
Validate event
      ↓
Deduplicate
      ↓
Load active candidate missions
      ↓
For each mission:
    evaluate eligibility
    evaluate conditions
    load/create progress
    apply progress
    if completed:
        trigger reward
      ↓
Persist source event processed
```

---

# 3065 — Candidate Mission Evaluation Isolation

One broken mission definition should not necessarily stop all other missions for the same event.

Options:

```text
process each mission independently
```

with:

```text
per-mission error handling
DLQ/alert
```

---

# 3066 — Transaction Granularity

Possible:

```text
one DB transaction per source event across all missions
```

or:

```text
one transaction per mission
```

Recommended initial:

```text
one event transaction if mission count small and same DB
```

but isolate configuration errors to avoid broad failure loops.

---

# 3067 — Processed Event Timing

Mark event processed only after all required mission effects are safely persisted.

If per-mission processing is independent:

```text
track processing result per mission
```

rather than one coarse processed flag.

---

# 3068 — Mission Event Consumption Retry

Retry transient errors:

```text
DB timeout
temporary dependency outage
```

Do not infinitely retry:

```text
invalid mission configuration
unsupported event schema
```

Route to DLQ/operations.

---

# 3069 — DLQ Metadata

Include:

```text
event_id
event_type
mission_id if known
failure_code
retry_count
last_error
```

No sensitive payload if unnecessary.

---

# 3070 — Mission Scheduler

Scheduled jobs may handle:

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

# 3071 — Scheduler Concurrency

Multiple pods must not execute the same row twice.

Use:

```text
row locking
SKIP LOCKED
leader election
job framework
```

---

# 3072 — Progress Expiry Query

Possible:

```sql
SELECT id
FROM mission_progress
WHERE status IN ('IN_PROGRESS','COMPLETED')
  AND progress_expires_at <= NOW()
ORDER BY progress_expires_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

---

# 3073 — Scheduler Batch Size

Use bounded batches.

Monitor:

```text
expiry backlog
processing duration
failed rows
```

---

# 3074 — Mission Reconciliation

Critical checks:

```text
progress > target
completed without completed_at
completed target not reached
reward assigned twice
completed requiring reward but no assignment
distinct count != dimension rows
processed event without progress event where expected
```

---

# 3075 — Progress Reconciliation

For COUNT/SUM mission:

```text
recompute from mission_progress_events
```

where full event history is retained.

Compare to:

```text
mission_progress.current_progress
```

---

# 3076 — Distinct Reconciliation

For DISTINCT_COUNT:

```text
COUNT(unique dimension rows)
=
current_progress
```

capped at target if UI stores capped value.

---

# 3077 — Reward Reconciliation

Check:

```text
COMPLETED
+
reward required
+
reward_assignment_id IS NULL
```

and:

```text
multiple assignments for same progress
```

---

# 3078 — Mission Period Reconciliation

Detect:

```text
customer progress exists even though customer is outside Journey user period
```

unless grandfathering policy allows it.

---

# 3079 — Reconciliation Run Table

```text
mission_reconciliation_runs
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

# 3080 — Reconciliation Mismatch Table

```text
mission_reconciliation_mismatches
---------------------------------
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

# 3081 — No Silent Progress Repair

Do not directly edit customer progress to hide a bug.

Use:

```text
rebuild
approved correction event
documented migration
```

with audit.

---

# 3082 — Mission Admin Audit

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

# 3083 — Manual Progress Correction

If supported:

```text
reason required
actor required
before/after captured
```

Prefer correction event rather than silent row update.

---

# 3084 — Mission Security

Primary risks:

```text
customer progress tampering
admin misconfiguration
duplicate reward
cross-customer access
event spoofing
```

Controls:

```text
service authentication
RBAC
idempotency
audit
configuration validation
```

---

# 3085 — Mission Admin Permissions

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

# 3086 — Customer API Security

Customer identity derived from token.

Do not trust:

```text
customer_id
```

submitted by client for own mission list.

---

# 3087 — Event Producer Authentication

Kafka topic permissions should allow only approved producers.

Examples:

```text
Order Service → order events
Wallet Service → top-up events
Feedback Service → feedback events
```

---

# 3088 — Data Classification

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

# 3089 — Privacy

Mission should primarily store:

```text
customer_id
progress facts
```

not full PII.

Customer name is a presentation concern.

---

# 3090 — Customer Closure

On customer closure:

```text
stop new progress
close/expire active missions
handle outstanding rewards according to policy
retain or pseudonymize history
```

---

# 3091 — Mission Retention

Possible:

```text
active progress → retain
completed progress → medium/long support retention
expired unsuccessful progress → shorter retention
event history → according to reconciliation need
```

---

# 3092 — Mission Metrics

Business:

```text
mission_visible_total
mission_started_total
mission_progressed_total
mission_completed_total
mission_expired_total
mission_reward_trigger_total
```

Per mission:

```text
completion_rate
average_time_to_complete
dropoff_rate
```

Operational:

```text
mission_consumer_lag
duplicate_event_total
reward_assignment_failure_total
expiry_backlog
reconciliation_mismatch_total
```

---

# 3093 — Mission SLIs

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

# 3094 — Alerts

Alert on:

```text
consumer lag
duplicate reward attempt
mission completion spike
progress update failure spike
reward assignment failure
expiry backlog
invalid configuration
reconciliation mismatch
outbox backlog
```

---

# 3095 — Dashboard

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

# 3096 — Structured Logging

Safe fields:

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

Do not log unnecessary customer PII.

---

# 3097 — Tracing

Trace:

```text
Kafka event
  ↓
Mission consumer
  ↓
Eligibility
  ↓
Condition evaluation
  ↓
Progress update
  ↓
Reward trigger
  ↓
Outbox
```

Useful span attributes:

```text
mission_code
progress_type
completed
```

---

# 3098 — Failure Mode: Reward Service Down

Mission completion can still be persisted.

Reward state:

```text
PENDING
```

Outbox/worker retries assignment.

Do not undo mission completion.

---

# 3099 — Failure Mode: Customer Service Down

If eligibility requires registration date and no local trusted projection exists:

```text
event processing may retry
```

or use:

```text
customer lifecycle projection
```

to reduce hard runtime dependency.

---

# 3100 — Customer Eligibility Projection

Mission may maintain:

```text
customer_id
registered_at
status
```

from customer events.

This supports Journey eligibility without synchronous calls.

---

# 3101 — Failure Mode: Redis Down

Mission reads fall back to PostgreSQL.

Writes remain unaffected.

---

# 3102 — Failure Mode: Kafka Down

New source events are delayed.

Mission state stays correct once events resume.

Monitor lag.

---

# 3103 — Failure Mode: Scheduler Down

Effects:

```text
progress expiry delayed
auto-assignment delayed
cycle rollover delayed
```

Alert on backlog.

---

# 3104 — Runbooks

Required:

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

# 3105 — Progress Not Updating Runbook

```text
check source event emitted
check Kafka topic/consumer lag
check processed_events
check mission status/time
check eligibility
check conditions
check rule version
check DB transaction errors
```

---

# 3106 — Duplicate Progress Runbook

```text
identify event_id
check processed event uniqueness
check mission_progress_events uniqueness
check retry behavior
reconcile progress
correct via approved rebuild
```

---

# 3107 — Duplicate Reward Runbook

```text
check progress completion uniqueness
check reward source reference
check assignment unique constraint
stop campaign if needed
resolve duplicate benefit safely
```

---

# 3108 — Eligibility Incident Runbook

If wrong users see Journey mission:

```text
pause mission if severe
inspect user_period_start
inspect registration date projection
inspect prior completion
inspect mission type
fix rule/version
reconcile affected users
```

---

# 3109 — Backup

Back up:

```text
mission definitions
versions
conditions
cycles
progress
progress events
distinct dimensions
reward links
processed events
outbox
reconciliation
```

---

# 3110 — Restore

After restore:

```text
replay source events idempotently
reconcile progress
reconcile distinct dimensions
reconcile completion/rewards
rebuild caches
repair outbox
```

---

# 3111 — Restore Risk

Old restore may:

```text
lose progress
reprocess events
reassign reward
resurrect expired progress
```

Protection:

```text
source event IDs
unique completion references
reward assignment idempotency
reconciliation
```

---

# 3112 — Disaster Recovery

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

# 3113 — Flyway Migration Plan

Example:

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
```

---

# 3114 — Legacy Mission Migration

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

# 3115 — Journey Migration

Special care:

```text
user_period_start
mission_start
customer registration date
prior completion
```

must be reconciled.

---

# 3116 — Campaign Migration

Do not accidentally populate:

```text
Journey-only user period
```

for Campaign missions.

---

# 3117 — Progress Migration

For each customer:

```text
current_progress
target_progress
status
started_at
completed_at
expires_at
reward status
```

---

# 3118 — Distinct Progress Migration

For Explore Stores:

if historical distinct store list exists:

```text
migrate dimension rows
```

If only numeric count exists:

```text
document reduced replay/reconciliation ability
```

---

# 3119 — Reward Migration

Link existing:

```text
reward assignment
```

to migrated progress.

Do not create a second assignment.

---

# 3120 — Migration Reconciliation

Compare:

```text
mission count
active mission count
customer progress count
completed count
reward assignment count
expired count
```

between old/new.

---

# 3121 — Mission Testing Strategy

Test:

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

# 3122 — Domain Tests

Test:

```text
mission status transitions
target validation
completion
expiry
non-repeatable behavior
```

---

# 3123 — Journey Eligibility Tests

Include:

```text
customer registered before user_period_start
customer registered exactly at user_period_start
customer registered after user_period_start
mission created before period
mission created after period
prior completion before period
new customer after mission creation
```

---

# 3124 — Campaign Eligibility Tests

Verify:

```text
Journey period does not leak into Campaign
time window
segment/tier if configured
```

---

# 3125 — First Top-Up Tests

Test both configured semantics as applicable:

```text
single top-up >= min
cumulative top-ups >= target
below minimum
wrong currency
duplicate top-up event
```

---

# 3126 — First Pickup Tests

```text
pickup completed → complete
delivery completed → no progress
duplicate order event → no duplicate reward
```

---

# 3127 — First Dine-In Tests

```text
DINE_IN completed → complete
PICKUP → no progress
legacy selfdinein mapping tested outside/domain adapter
```

---

# 3128 — Feedback Mission Tests

Verify:

```text
suggestion
compliment
complaint
other configured feedback
```

all behave according to current rule.

---

# 3129 — Explore Stores Tests

```text
store A → progress 1
store A again → remains 1
store B → 2
store C → complete 3
duplicate source event → unchanged
```

---

# 3130 — Progress Concurrency Tests

Send simultaneous qualifying events.

Verify:

```text
no lost increment
no progress beyond policy
completion once
reward once
```

---

# 3131 — Completion Race Tests

Two events both reaching target:

```text
one completion transition
one reward trigger
```

---

# 3132 — Expiry Tests

Test:

```text
incomplete expired
completed reward pending
completed reward assigned
already expired
worker retry
```

---

# 3133 — Auto-Assignment Tests

Test:

```text
completed + no reward → assign
completed + existing assignment → created=false/reuse
duplicate worker execution
reward assignment failure + retry
```

---

# 3134 — Message Selection Tests

Verify:

```text
normal progress → progress_message
milestone complete → progress_complete_message
reward complete → complete_message
Khmer fallback
English fallback
```

---

# 3135 — Translation Key Tests

Test:

```text
lowercase-only if policy
numeric key rejected
empty key on create accepted only until validation stage if UI flow requires
duplicate key handling
```

---

# 3136 — Persistence Tests

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

# 3137 — Kafka Tests

Test:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
duplicate event
consumer retry
DLQ
replay
```

---

# 3138 — Reward Integration Tests

Test:

```text
MissionCompleted → reward assignment
duplicate completion
reward service timeout
existing reward assignment
```

---

# 3139 — Reconciliation Tests

Create:

```text
progress mismatch
distinct count mismatch
completed without reward
duplicate reward
expired active progress
```

Verify detection.

---

# 3140 — Load Tests

Scenarios:

```text
large OrderCompleted burst
many active missions on same event
campaign launch
expiry batch
mission list traffic
```

---

# 3141 — Hot Event Test

Example:

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

---

# 3142 — Large Customer Mission List Test

Test customers with:

```text
many active/history missions
```

Use pagination/history separation if necessary.

---

# 3143 — Failure Tests

Inject:

```text
Kafka duplicate
DB timeout
deadlock
Reward Service unavailable
Redis unavailable
scheduler crash
outbox failure
```

Verify safe recovery.

---

# 3144 — Security Tests

Verify:

```text
customer cannot read another customer's progress
admin update requires permission
client cannot manually increment progress
event spoofing blocked by Kafka ACL
manual correction audited
```

---

# 3145 — Definition of Done: Mission Definition

- [ ] Mission code.
- [ ] Type.
- [ ] Event source.
- [ ] Progress type.
- [ ] Target.
- [ ] Period.
- [ ] Conditions.
- [ ] Reward.
- [ ] Translation keys.
- [ ] Validation.
- [ ] Tests.

---

# 3146 — Definition of Done: Progress Processing

- [ ] Event dedupe.
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

# 3147 — Definition of Done: Journey Period

- [ ] `user_period_start` semantics documented.
- [ ] Mission start semantics documented.
- [ ] Registration-date boundary tested.
- [ ] Prior-completion rule tested.
- [ ] Campaign excluded from Journey-only logic.
- [ ] UI/backend validation aligned.

---

# 3148 — Definition of Done: Reward Auto-Assignment

- [ ] Completed-progress detection.
- [ ] Expiry trigger.
- [ ] Existing assignment reuse.
- [ ] Idempotent selection.
- [ ] Retry.
- [ ] Reward reference saved.
- [ ] Tests.

---

# 3149 — Mission Review Checklist

## Ownership

- [ ] Mission owns progress.
- [ ] Loyalty owns points/rewards.
- [ ] Promotion owns coupon rules.
- [ ] Order/Wallet/Feedback own source facts.

## Eligibility

- [ ] Journey period.
- [ ] Campaign period.
- [ ] Prior completion.
- [ ] Registration date.
- [ ] Time window.

## Progress

- [ ] COUNT/SUM/DISTINCT/FIRST.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Completion once.
- [ ] Expiry/reset.

---

# 3150 — Mission Data Review Checklist

- [ ] Mission code unique.
- [ ] Versioning.
- [ ] Progress uniqueness.
- [ ] Processed event uniqueness.
- [ ] Distinct dimensions.
- [ ] Reward reference.
- [ ] Reconciliation tables.
- [ ] Outbox.
- [ ] Retention.

---

# 3151 — Mission Contract Review Checklist

- [ ] Customer mission list.
- [ ] Mission detail.
- [ ] Admin list/detail/create/update/status/delete.
- [ ] Progress list/detail.
- [ ] Stable error catalog.
- [ ] Event schemas.
- [ ] Translation/message contract.
- [ ] Reward reference contract.

---

# 3152 — Mission Security Review Checklist

- [ ] Customer isolation.
- [ ] Admin RBAC.
- [ ] Event producer ACL.
- [ ] Manual correction audit.
- [ ] No client-authored progress.
- [ ] No cross-service DB reads.
- [ ] Backups protected.

---

# 3153 — Mission Operations Review Checklist

- [ ] Consumer lag monitoring.
- [ ] Scheduler monitoring.
- [ ] Expiry backlog.
- [ ] Reward assignment backlog.
- [ ] Reconciliation.
- [ ] Cache rebuild.
- [ ] Outbox monitoring.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 3154 — Production Readiness Checklist

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

---

# 3155 — Initial Implementation Order

Recommended:

```text
1. MissionDefinition aggregate
2. MissionProgress aggregate
3. Mission schema
4. Processed-event idempotency
5. OrderCompleted consumer
6. FIRST_PICKUP
7. FIRST_DINE_IN
8. WalletTopUpCompleted consumer
9. FIRST_TOP_UP_MIN_AMOUNT
10. FeedbackSubmitted consumer
11. FIRST_FEEDBACK
12. DISTINCT_COUNT support
13. EXPLORE_3_STORES
14. Journey user-period eligibility
15. Progress messages/translations
16. Reward trigger
17. Reward assignment projection
18. Progress expiry
19. Auto-assignment
20. Admin APIs
21. Reconciliation
22. Redis cache
23. Metrics/alerts
```

---

# 3156 — Minimum Viable Mission Service

First production-capable version:

```text
Mission definitions
Journey/Campaign type
Mission eligibility
User period logic
Mission progress
COUNT/FIRST/DISTINCT/SUM as needed
Event dedupe
Completion
Reward trigger
Reward assignment reference
Progress expiry
Admin configuration
Customer mission list
Outbox
Reconciliation
```

Current release-critical Journey missions:

```text
First Top-Up With Minimum Amount
First Pickup
First Dine-In
First Feedback
Explore 3 Stores
```

along with any existing approved Journey missions.

---

# 3157 — Future Enhancements

Potential:

```text
Mission chains
Prerequisites
Branching journeys
Weekly/daily cycles
Segment-targeted missions
Team missions
Shared household missions
Personalized targets
Experiment variants
Advanced rule authoring
```

---

# 3158 — PART 18 Deliverables

PART 18 produces:

1. Mission Service responsibility definition.
2. Deployable-vs-logical boundary guidance.
3. Journey/Campaign model.
4. Mission aggregate.
5. Mission status model.
6. Mission code rules.
7. Translation key rules.
8. MissionProgress aggregate.
9. Progress status/reward status.
10. COUNT/SUM/DISTINCT/FIRST/BOOLEAN progress types.
11. Mission event model.
12. Event idempotency.
13. Condition model.
14. Eligibility model.
15. Journey user-period rule.
16. Dynamic period model.
17. Campaign period separation.
18. Visibility rules.
19. Progress expiry/reset/cycle model.
20. First Top-Up mission.
21. First Pickup mission.
22. First Dine-In mission.
23. Feedback mission.
24. Explore 3 Stores mission.
25. Distinct progress storage.
26. Mission processing flow.
27. Candidate mission lookup/cache.
28. Reward trigger boundary.
29. Reward assignment idempotency.
30. Auto-assignment.
31. `created=false` existing-assignment semantics.
32. Progress/complete message selection.
33. Localization fallback.
34. Customer REST APIs.
35. Admin mission APIs.
36. Admin progress APIs.
37. UI/backend period validation rules.
38. Mission versioning.
39. Full database schema.
40. Progress concurrency.
41. Event-time behavior.
42. Expiry/reset worker.
43. Error catalog.
44. Mission events.
45. Reward/Loyalty/Promotion/Notification integration.
46. Clean Architecture layout.
47. Input/output ports.
48. Retry/DLQ behavior.
49. Reconciliation.
50. Security/RBAC.
51. Privacy/retention.
52. Metrics/SLIs.
53. Alerts/dashboard.
54. Logging/tracing.
55. Failure modes.
56. Runbooks.
57. Backup/restore.
58. DR.
59. Flyway migrations.
60. Legacy migration.
61. Testing strategy.
62. Concurrency/load tests.
63. Review checklists.
64. Production readiness.
65. Implementation order.

---

# 3159 — Exit Criteria

PART 18 is complete when the team can answer:

### Ownership

```text
What does Mission own versus Loyalty, Promotion, Order, Wallet, and Feedback?
```

### Journey

```text
How is Journey eligibility determined from user_period_start, registration date, mission start, and prior completion?
```

### Campaign

```text
How is Campaign kept separate from Journey-only period logic?
```

### Progress

```text
How does each event update COUNT, SUM, DISTINCT_COUNT, or FIRST_OCCURRENCE progress exactly once?
```

### Completion

```text
How do concurrent events trigger only one completion?
```

### Reward

```text
How is exactly one reward assignment connected to one mission completion?
```

### Expiry

```text
What happens to incomplete progress, completed-unrewarded progress, and reward-pending progress at expiry?
```

### Messages

```text
How are progress_message, progress_complete_message, and complete_message selected with language fallback?
```

### Reconciliation

```text
How are incorrect progress, distinct counts, and missing/duplicate rewards detected?
```

### Recovery

```text
How does Kafka replay or database restore avoid duplicate mission progress and reward assignment?
```

If these answers are clear and tested, Mission Service is ready for implementation.

---

# 3160 — Handoff to PART 19

PART 19 defines Notification Service.

```text
PART 18
Mission Service
      ↓
MissionCompleted
RewardAssigned
PointsExpiringSoon
RewardExpiringSoon
      ↓
PART 19
Notification Service
```

Notification Service will own:

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

The key separation is:

```text
Mission decides that a business event occurred.

Notification decides how and whether to deliver communication.
```

---

# PART 18 — Summary

The Mission Service is the platform's customer goal/progress engine.

Core event flow:

```text
Business Event
      ↓
Mission Candidate Lookup
      ↓
Eligibility
      ↓
Condition Evaluation
      ↓
Progress Update
      ↓
Completion
      ↓
Reward Trigger
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

Current important Journey missions include:

```text
First Top-Up With Minimum Amount
First Pickup
First Dine-In
First Feedback
Explore 3 Stores
```

The most important architecture rules are:

```text
Mission owns progress, not source business facts.
Source events are deduplicated.
Journey and Campaign have different eligibility semantics.
User-period rules are explicit and testable.
Progress updates are concurrency-safe.
Distinct progress uses unique dimension storage.
Completion happens once.
Reward assignment happens once.
Completed-but-unrewarded progress can auto-assign safely at expiry.
Translations/messages are configuration-driven.
Mission state can be reconciled from event/history data.
```

The next chapter defines how business events are communicated to customers:

```text
PART 19 — Notification Service
```

---

**End of PART 18 — Mission Service**
