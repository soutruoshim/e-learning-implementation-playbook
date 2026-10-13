---
title: "PART 41 — MIGRATION / STRANGLER STRATEGY"
---

# PART 41 — MIGRATION / STRANGLER STRATEGY

> **Document Role:** Defines the complete migration and strangler strategy for moving production business capabilities, data, integrations, events, and traffic from legacy implementations to the new microservices platform through controlled coexistence, reconciliation, rollback, and decommissioning.  
> **Previous Part:** PART 40 — Production Deployment  
> **Next Part:** PART 42 — Monitoring / Incident Response  
> **Status:** Platform Architecture / Legacy Modernization and Migration Specification  
> **Primary Stack Context:** Java, Spring Boot, PostgreSQL, Kafka, Redis, Kubernetes, GitOps, Integration / Anti-Corruption Layer, legacy APIs/databases/stored procedures where applicable  
> **Audience:** Software architects, backend engineers, integration engineers, data/database engineers, QA, platform/DevOps, SRE/operations, product owners, security engineers, support/operations teams, and technical leadership.

---

# 11622 — Purpose

Migration / Strangler Strategy defines how the platform moves from legacy implementations to the new microservices architecture without a big-bang rewrite.

It answers:

```text
Which capability moves first?
Which system is authoritative during each phase?
How is legacy traffic intercepted?
How are legacy models translated?
How is data copied and verified?
How are old/new results compared?
When can writes move?
How is rollback performed?
When can legacy code/data be retired?
```

The core principle is:

```text
Replace one owned business capability at a time
behind stable canonical contracts.
```

---

# 11623 — Document Role

This chapter is the platform migration and coexistence specification.

It converts the service boundaries defined earlier into a controlled modernization program covering application behavior, data ownership, integration, traffic routing, reconciliation, rollback, and legacy decommissioning.

---

# 11624 — Previous and Next Parts

```text
Previous:
PART 40 — Production Deployment

Next:
PART 42 — Monitoring / Incident Response
```

PART 40 explains how approved releases reach production. PART 41 explains how production capability and traffic progressively move from legacy systems to those new services.

---

# 11625 — Primary Migration Context

The target platform is based on:

```text
Java / Spring Boot microservices
PostgreSQL
Kafka
Redis
Kubernetes
GitOps
Integration / ACL
```

The legacy estate may include:

```text
monolithic APIs
PHP services
shared MySQL / SQL Server databases
stored procedures
POS / ERP integration
batch jobs
direct table reads
numeric status codes
provider-specific schemas
```

---

# 11626 — Strangler Pattern

The strangler pattern introduces a new implementation alongside the legacy system and gradually routes selected capabilities or traffic to it.

Typical flow:

```text
Client / Caller
      ↓
Routing Boundary
   ↙       ↘
Legacy     New Service
              ↓
        Canonical Domain
```

Over time, the new path expands until the legacy path is removed.

---

# 11627 — No Big-Bang Rewrite

Avoid replacing all capabilities simultaneously.

Big-bang migration combines:

```text
business-rule change
architecture change
data migration
deployment change
integration change
operational change
```

into one failure domain.

---

# 11628 — Migration Unit

The preferred migration unit is an owned business capability or bounded-context slice, not an arbitrary table.

Examples:

```text
Customer Profile
Catalog
Inventory Reservation
Wallet Top-Up
Coupon Redemption
Mission Progress
Notification Delivery
```

---

# 11629 — Boundary-First Migration

A capability should migrate only after ownership is clear.

If the team cannot answer:

```text
What does the new service own?
What does legacy still own?
Which data is authoritative?
Which commands/events cross the boundary?
```

the migration boundary is not ready.

---

# 11630 — Stable Contract Principle

Consumers should depend on canonical contracts rather than legacy implementation details.

A migration is easier when implementation can change behind:

```text
REST contract
gRPC contract
Kafka event
integration port
```

without changing every caller.

---

# 11631 — Anti-Corruption Layer Role

The ACL protects new services from:

```text
legacy table names
numeric status codes
legacy sentinel values
provider field names
stored procedure contracts
external identifiers
```

and translates them into canonical platform concepts.

---

# 11632 — Migration Is Temporary Architecture

Coexistence mechanisms such as:

```text
legacy adapter
dual read
shadow call
event bridge
temporary replication
routing flag
```

must have an explicit removal plan.

Temporary migration architecture must not become permanent accidental architecture.

---

# 11633 — Migration Success Definition

A capability is successfully migrated when:

```text
new service is authoritative
traffic uses the new service
data is reconciled
legacy writes are stopped
legacy dependencies are removed
legacy code/data path is decommissioned
```

---

# 11634 — Migration Program Goals

Primary goals:

```text
reduce legacy coupling
improve independent deployment
establish clear data ownership
preserve business correctness
avoid customer disruption
enable gradual rollback
retire direct shared-DB access
```

---

# 11635 — Migration Non-Goals

Migration is not an opportunity to:

```text
rewrite every business rule at once
redesign unrelated features
move all historical data without need
introduce every future architecture improvement simultaneously
```

---

# 11636 — Migration Governance

Migration requires cross-functional ownership across:

```text
legacy engineering
new-platform engineering
product/business
QA
platform/DevOps
data/database
security
operations/support
integration owners
```

---

# 11637 — Migration Owner

Each capability migration has one accountable owner responsible for:

```text
scope
source-of-truth decision
cutover plan
data migration
reconciliation
rollback
legacy retirement
```

---

# 11638 — Migration Wave

Organize modernization into migration waves.

A wave contains one or a small set of capabilities whose dependencies and rollback can be understood together.

---

# 11639 — Migration Wave Template

```text
Capability:
Legacy Owner:
New Owner:
Legacy Entry Point:
Target Service:
Source of Truth Before:
Source of Truth During:
Source of Truth After:
Data Migration:
Traffic Strategy:
Reconciliation:
Rollback:
Decommission:
```

---

# 11640 — Capability Inventory

Before sequencing migration, inventory legacy capabilities and dependencies.

Include:

```text
API endpoints
tables
stored procedures
cron jobs
batch jobs
external partners
reports
mobile/client dependencies
operational tools
manual processes
```

---

# 11641 — Dependency Discovery

Do not rely only on documentation.

Use:

```text
code search
DB access logs
API gateway logs
query logs
job schedules
integration inventories
support knowledge
```

to discover hidden dependencies.

---

# 11642 — Unknown Dependency Risk

A legacy table may be read by:

```text
report
admin portal
batch job
store tool
finance export
mobile API
```

even when the main application appears ready to migrate.

---

# 11643 — Migration Dependency Graph

Maintain a dependency graph showing:

```text
capability
caller
database
event
partner
report
batch
```

relationships.

---

# 11644 — Migration Priority

Prefer early migration candidates with:

```text
clear boundary
manageable data size
few hidden dependencies
high business value
high legacy pain
low irreversible risk
```

---

# 11645 — Avoid First-Wave Financial Core

Unless the team is already mature, avoid making the first strangler cutover the most complex:

```text
payment settlement
wallet ledger
inventory accounting
```

capability.

---

# 11646 — Learning Wave

An early lower-risk migration wave should prove:

```text
routing
ACL
observability
data copy
reconciliation
cutover
rollback
```

before higher-risk domains.

---

# 11647 — Business Sequencing

Migration order must consider business timing such as:

```text
campaigns
holidays
store launches
finance close
high-sales periods
partner change freezes
```

---

# 11648 — Migration Decision Record

For every capability record why:

```text
this boundary
this order
this source of truth
this cutover method
```

was selected.

---

# 11649 — Entry Criteria

A migration wave starts only when:

```text
target service production-capable
canonical contract defined
legacy adapter understood
data ownership defined
reconciliation designed
rollback designed
observability ready
```

---

# 11650 — Exit Criteria

A migration wave ends only when:

```text
target owns traffic/state
mismatches resolved
legacy write path disabled
dependency scan clean
decommission approved
```

---

# 11651 — Source-of-Truth Principle

At every migration phase, each business fact has one declared authoritative owner.

Examples:

```text
customer profile
wallet balance
order status
coupon usage
mission progress
```

---

# 11652 — No Ambiguous Authority

Avoid:

```text
sometimes legacy wins
sometimes new service wins
```

without explicit deterministic conflict rules.

---

# 11653 — Authority Matrix

Maintain:

```text
Fact:
Before Cutover:
During Migration:
After Cutover:
Conflict Rule:
Reconciliation Owner:
```

---

# 11654 — Read Authority vs Write Authority

Read authority and write authority can differ temporarily.

Example:

```text
Writes: legacy
Reads: compare legacy/new
```

during shadow validation.

---

# 11655 — Single-Writer Preference

Prefer one authoritative writer during migration.

Multiple independent writers to the same business fact create conflict and ordering risk.

---

# 11656 — Dual-Write Warning

Application-level dual write:

```text
write legacy
then write new
```

or the reverse can fail between operations.

Use only with explicit failure/reconciliation strategy.

---

# 11657 — Dual-Write Is Distributed Transaction

If two independent systems must both persist the same write, the migration has created a distributed consistency problem.

Treat it with the same rigor as any distributed transaction.

---

# 11658 — Write-Through Adapter

A temporary write-through migration adapter may coordinate legacy and new writes, but must define:

```text
primary success criterion
retry
idempotency
unknown outcome
reconciliation
```

---

# 11659 — Legacy-Primary Phase

Early migration phase may keep:

```text
legacy = authoritative writer
new = replicated/shadow copy
```

until new correctness is proven.

---

# 11660 — New-Primary Phase

After cutover:

```text
new service = authoritative writer
legacy = optional read-only compatibility sink
```

for a limited transition period.

---

# 11661 — No Return to Shared Writes

Once new service owns a domain, do not allow unrelated legacy components to continue modifying its tables directly.

---

# 11662 — Migration Routing Boundary

Introduce a controllable routing boundary where traffic can be directed to legacy or new implementation.

Possible locations:

```text
API Gateway
backend-for-frontend
facade
integration service
feature router
```

---

# 11663 — Route by Capability

Prefer routing by business capability or endpoint.

Example:

```text
/customer/profile → Customer Service
/legacy-other     → Legacy API
```

---

# 11664 — Route by Cohort

For higher-risk migration, route by stable cohort:

```text
internal users
selected stores
selected customers
percentage bucket
```

---

# 11665 — Stable Cohort Assignment

Cohort assignment should be deterministic.

The same user/order should not randomly alternate between legacy and new ownership.

---

# 11666 — Route by Store

Store-based migration can work well when business state and operations are naturally store-scoped.

---

# 11667 — Route by Customer

Customer-based migration requires careful handling when one customer interacts across stores/channels.

---

# 11668 — Route by Resource

For existing resources, routing may depend on which system owns that resource.

Example:

```text
old order → legacy
new order → new Order Service
```

---

# 11669 — Resource Ownership Marker

A durable ownership marker may identify whether a migrated entity belongs to legacy or new service.

---

# 11670 — Feature Flag Routing

Feature flags can control migration exposure, but the routing decision must be consistent and auditable for stateful workflows.

---

# 11671 — Gateway Route Rollback

Routing changes must be quickly reversible while data compatibility still permits rollback.

---

# 11672 — ACL During Coexistence

New services communicate with legacy through ACL adapters, not direct leakage of legacy concepts into domain logic.

---

# 11673 — Legacy Adapter Contract

A legacy adapter should expose canonical operations such as:

```text
findCustomer
getLegacyOrder
postTopUp
lookupStore
```

rather than exposing raw table/procedure semantics.

---

# 11674 — Legacy DB Adapter

If temporary direct legacy database access is unavoidable, isolate it inside the ACL.

Core services must not scatter legacy SQL throughout repositories.

---

# 11675 — Read-Only Legacy DB Access

Prefer read-only legacy database access during migration where possible.

Write access greatly increases coupling and decommission risk.

---

# 11676 — Stored Procedure Adapter

Wrap stored procedures behind explicit integration ports.

Translate:

```text
parameters
result codes
sentinel values
errors
```

into canonical outcomes.

---

# 11677 — Legacy Status Mapping

Legacy numeric statuses are translated once at the boundary.

Do not duplicate status mapping across many services.

---

# 11678 — Identifier Mapping

Maintain explicit mapping between:

```text
legacy_customer_id ↔ customer_id
legacy_order_id ↔ order_id
legacy_store_code ↔ store_id
legacy_transaction_id ↔ payment_reference
```

---

# 11679 — Identifier Mapping Persistence

Mappings that are required for recovery/reconciliation must be durably persisted, not kept only in cache.

---

# 11680 — Mapping Immutability

Stable external/legacy-reference mappings should not silently change after assignment.

---

# 11681 — Data Migration Principle

Data migration moves owned business state, not every legacy byte.

Copy only what the new domain needs for:

```text
correctness
customer experience
operations
audit
regulatory retention
```

---

# 11682 — Data Classification

Classify legacy data into:

```text
authoritative current state
transaction history
reference data
derived/reporting data
obsolete data
unknown data
```

---

# 11683 — Current-State Migration

Current business state usually has the highest migration priority.

Examples:

```text
active customer
wallet balance
active coupon
open order
current mission progress
```

---

# 11684 — Historical Data Migration

Historical records may be:

```text
fully migrated
partially migrated
kept in archive
accessed through legacy read service
```

depending on business/audit need.

---

# 11685 — Do Not Copy Garbage Blindly

Legacy invalid or ambiguous records should not be silently normalized without a documented rule.

---

# 11686 — Data Profiling

Before migration profile:

```text
row count
nulls
duplicates
invalid codes
orphan references
date ranges
currency anomalies
encoding
```

---

# 11687 — Data Quality Report

Produce a data-quality report for each migration dataset before cutover.

---

# 11688 — Canonical Transformation

Migration converts legacy representation into the target canonical model.

Example:

```text
legacy member_card_no
→ customer/member reference
```

---

# 11689 — Transformation Determinism

The same source record should transform predictably.

Version transformation logic when rules may evolve.

---

# 11690 — Migration Staging Area

Complex migrations may use a staging schema/store for:

```text
raw extract
normalized record
validation status
error/quarantine
```

---

# 11691 — Quarantine

Invalid records that cannot be safely transformed should be quarantined with reason and owner rather than silently dropped.

---

# 11692 — Migration Batch ID

Every migration execution should have a stable:

```text
migration_run_id
```

for audit and rollback/reconciliation.

---

# 11693 — Migration Record Metadata

Track as needed:

```text
legacy key
target key
migration run
source timestamp/version
status
error
```

---

# 11694 — Bulk Load

Initial migration commonly uses a bulk snapshot before ongoing change synchronization.

---

# 11695 — Snapshot Consistency

The snapshot must have a defined consistency point.

Know whether records can change while extraction is occurring.

---

# 11696 — Snapshot Timestamp

Record a source high-water mark such as:

```text
timestamp
sequence
change ID
log position
```

for subsequent delta capture.

---

# 11697 — Delta Migration

After bulk copy, migrate changes that occurred after the snapshot.

---

# 11698 — Delta High-Water Mark

Delta processing must advance a durable high-water mark only after target persistence is successful.

---

# 11699 — Polling Migration

Polling may be acceptable when legacy supports reliable:

```text
updated_at
sequence
version
```

fields.

---

# 11700 — Polling Gap Risk

Polling fails when:

```text
timestamp precision weak
updates do not change timestamp
records are deleted without tombstone
clock semantics differ
```

---

# 11701 — CDC Migration

CDC can capture database changes, but raw CDC records are not automatically domain events.

---

# 11702 — CDC Boundary

CDC belongs in integration/migration infrastructure.

Core domain services should consume canonical facts/events where possible, not raw table mutations.

---

# 11703 — CDC Schema Coupling

CDC still depends on legacy physical schema.

Treat it as temporary migration coupling with clear retirement criteria.

---

# 11704 — CDC Ordering

Understand ordering guarantees across tables/partitions before reconstructing domain meaning from CDC.

---

# 11705 — Delete Handling

Migration must define how source deletes become:

```text
target deletion
deactivation
tombstone
ignore
```

according to domain semantics.

---

# 11706 — Soft Delete Mapping

Legacy soft-delete flags may map to domain status rather than physical delete in the target.

---

# 11707 — Large Table Migration

Large datasets require:

```text
batching
checkpointing
rate limiting
restart safety
```

---

# 11708 — Migration Throttling

Protect legacy production from extraction overload.

Migration must not cause the outage it is intended to eliminate.

---

# 11709 — Migration Retry

Failed migration records may retry only when transformation and target writes are idempotent.

---

# 11710 — Upsert Policy

Define whether target load uses:

```text
insert-only
upsert by legacy mapping
version-aware update
```

and why.

---

# 11711 — Version Conflict

If target already changed after migration, an older legacy delta must not overwrite newer authoritative state.

---

# 11712 — Optimistic Version

Where possible compare:

```text
source version
target migration version
```

before applying a delta.

---

# 11713 — Migration Transaction Boundary

Choose batch transaction size deliberately.

Very large transactions create lock/WAL/recovery risk; tiny transactions create overhead.

---

# 11714 — Referential Order

Migrate dependencies in safe order when target constraints require it.

Example:

```text
customer
→ wallet account
→ wallet ledger/history
```

---

# 11715 — Foreign-Key Mapping

Legacy foreign keys are translated to target domain identifiers through explicit mapping, not positional assumptions.

---

# 11716 — Money Migration

Financial amounts require exact handling of:

```text
currency
precision
rounding
sign
historical correction
```

---

# 11717 — Time Migration

Normalize legacy timestamps with known timezone semantics.

Do not guess whether an ambiguous legacy datetime is UTC or local time.

---

# 11718 — Encoding Migration

Validate UTF-8 and multilingual text to prevent corrupted customer/store/promotion content.

---

# 11719 — Sensitive Data Migration

PII and secrets follow security classification and minimum-necessary migration.

---

# 11720 — Password Migration

Do not decrypt/recover passwords merely to migrate identity.

Prefer supported hash compatibility, credential transition, or reset strategy.

---

# 11721 — Token Migration

Legacy sessions/tokens may be allowed to expire naturally rather than copied into the new identity platform, depending on business requirements.

---

# 11722 — Synchronization Modes

Migration synchronization may use:

```text
API call
Kafka event
CDC
polling
batch
file exchange
```

depending on legacy capability.

---

# 11723 — Prefer Domain-Level Sync

Prefer business-level synchronization over raw-table replication when the source can provide meaningful events or APIs.

---

# 11724 — Legacy-to-New Event Bridge

A bridge may translate legacy changes into canonical events:

```text
Legacy Change
    ↓
ACL / Mapper
    ↓
Canonical Event
    ↓
New Service
```

---

# 11725 — New-to-Legacy Compatibility Bridge

After new service becomes authoritative, temporary downstream legacy consumers may receive translated updates until they migrate.

---

# 11726 — Bridge Ownership

Event/data bridge belongs to migration/integration architecture, not to the domain service's core business logic.

---

# 11727 — Bridge Idempotency

Every bridge must safely handle duplicate source changes.

---

# 11728 — Bridge Replay

Replay must not duplicate business side effects.

---

# 11729 — Bridge Lag

Monitor:

```text
source high-water mark
target high-water mark
lag
error backlog
```

---

# 11730 — Synchronization SLA

Define acceptable migration lag.

Some domains tolerate minutes; financial/operational workflows may require much tighter convergence.

---

# 11731 — Conflict Policy

When both systems may temporarily change state, define conflict rules before migration.

Examples:

```text
legacy wins until T0
new wins after T0
latest version wins
manual reconciliation required
```

---

# 11732 — Avoid Timestamp-Only Conflict Resolution

Do not use `latest timestamp wins` blindly when clocks, business semantics, or causal ordering are unreliable.

---

# 11733 — Sequence-Based Conflict

Version/sequence numbers are safer than wall-clock time when available.

---

# 11734 — Manual Conflict Queue

Ambiguous conflicts should enter a visible manual-reconciliation queue rather than being silently overwritten.

---

# 11735 — Read Migration Stages

Typical read migration:

```text
legacy read
→ shadow new read
→ compare
→ new read with legacy fallback
→ new-only read
```

---

# 11736 — Shadow Read

Shadow read sends the same logical query to the new implementation without using the new result for the customer response.

---

# 11737 — Shadow Read Safety

Shadow endpoints must be side-effect-free.

A read comparison must not accidentally create reservations, audit spam, or external calls.

---

# 11738 — Shadow Read Timeout

Shadow calls must not increase customer latency.

Execute asynchronously or with an independent bounded budget.

---

# 11739 — Shadow Comparison

Compare canonical results, not raw response formatting.

---

# 11740 — Comparison Normalization

Normalize expected non-semantic differences such as:

```text
generated IDs
timestamps
field ordering
optional metadata
```

before mismatch calculation.

---

# 11741 — Mismatch Classification

Classify mismatch:

```text
critical business mismatch
expected legacy defect
target defect
data-lag mismatch
format-only difference
unknown
```

---

# 11742 — Mismatch Sampling

High-volume shadow comparison may sample traffic after confidence is established, but high-risk domains may require full comparison.

---

# 11743 — Mismatch Dashboard

Track:

```text
comparison count
match rate
mismatch rate
mismatch reason
lag
```

---

# 11744 — Read Fallback

A temporary read path may use:

```text
new first
→ fallback legacy
```

when target data is incomplete.

---

# 11745 — Fallback Risk

Fallback can hide target defects indefinitely.

Every fallback should emit metrics and have removal criteria.

---

# 11746 — No Silent Mixed Truth

Do not combine half the fields from legacy and half from new without explicit ownership semantics.

---

# 11747 — Read Cutover Criteria

Read cutover requires:

```text
data coverage
acceptable mismatch rate
latency target
error target
fallback confidence
```

---

# 11748 — Read Cutover Cohort

Move reads by controlled cohort before 100% when risk justifies it.

---

# 11749 — New-Only Read

After sufficient confidence, remove legacy fallback and make the new service the only read source for the migrated capability.

---

# 11750 — Write Migration Is Harder

Write cutover changes business authority and is therefore higher risk than read cutover.

---

# 11751 — Write Cutover Preconditions

Before shifting writes:

```text
target data current
idempotency proven
reconciliation clean
legacy downstream impact understood
rollback plan tested
```

---

# 11752 — Write Shadowing

A new service can sometimes validate a legacy write request in shadow mode without committing it, allowing rule comparison.

---

# 11753 — Write Validation Compare

Compare:

```text
legacy decision
new decision
```

for:

```text
eligibility
discount
status transition
limits
validation errors
```

---

# 11754 — Write Mirror

A mirror write may copy committed legacy facts into the new service for state construction.

The new service still does not become authoritative until cutover.

---

# 11755 — Mirror from Committed Fact

Prefer mirroring from a committed legacy fact/event rather than sending two speculative writes from the caller.

---

# 11756 — Write Cutover

At cutover, route the authoritative command to the new service.

---

# 11757 — Legacy Write Disable

Disable or reject the corresponding legacy write path as quickly as safely possible after new authority begins.

---

# 11758 — Legacy Compatibility Update

If legacy readers still need the new state, publish a translated compatibility update rather than allowing legacy to remain an independent writer.

---

# 11759 — Post-Cutover Write Reconciliation

Run intensive reconciliation after write cutover until stability is demonstrated.

---

# 11760 — Write Rollback Window

Rollback is easiest before new writes create state the old system cannot represent.

---

# 11761 — Rollback Compatibility

If new-only fields/states have already been created, traffic rollback may require transformation or forward repair, not simply route reversal.

---

# 11762 — Dual-Write Patterns

Possible temporary patterns:

```text
caller → legacy + new
legacy → new mirror
new → legacy compatibility sink
outbox → bridge
CDC → target
```

They have different correctness properties.

---

# 11763 — Caller Dual Write

Caller dual write is the riskiest default because caller failure/retry can create disagreement between systems.

---

# 11764 — Primary + Secondary Write

If dual write is unavoidable, explicitly define one write as primary authority and the other as derived synchronization.

---

# 11765 — Secondary Write Failure

A secondary sync failure should create:

```text
durable retry
alert
reconciliation item
```

not silent divergence.

---

# 11766 — Outbox for Migration Sync

When the authoritative system supports it, transactional outbox is a strong way to publish committed migration facts reliably.

---

# 11767 — Legacy Without Outbox

If legacy cannot implement outbox, alternatives include:

```text
CDC
polling
transaction log integration
carefully controlled batch
```

---

# 11768 — Exactly-Once Myth

Migration bridges should assume at-least-once delivery and enforce idempotent target processing.

---

# 11769 — Idempotency Key

Use stable migration/source references such as:

```text
source_system
source_entity
source_id
source_version
```

to deduplicate synchronization.

---

# 11770 — Request Hash

For commands that may be retried, a request hash can detect reuse of the same idempotency key with different payload.

---

# 11771 — Event Migration

Event architecture may change gradually.

Legacy notifications or table changes may initially be translated into canonical Kafka events.

---

# 11772 — Canonical Event Ownership

Only the domain owner should define the canonical meaning of a platform event.

---

# 11773 — Legacy Event Translation

A legacy event such as:

```text
status=5
```

may become:

```text
OrderCompleted
```

only when the mapping semantics are truly equivalent.

---

# 11774 — Do Not Over-Interpret CDC

A table update does not always reveal the business intent that caused it.

Avoid inventing a domain event from ambiguous raw mutation.

---

# 11775 — Event Bridge Versioning

Migration-generated events follow the same schema/version compatibility rules as native events.

---

# 11776 — Event Timestamp

Preserve both where useful:

```text
source occurred_at
bridge processed_at
```

to distinguish business time from migration lag.

---

# 11777 — Event Source Metadata

Migration events should identify:

```text
source_system
migration_bridge
source_reference
```

without polluting core domain models.

---

# 11778 — Replay Cutover

When switching from migration bridge to native domain event producer, avoid duplicate publication across the boundary.

---

# 11779 — Producer Cutover Marker

Use a documented cutover offset/time/version so operators know which producer owns events after transition.

---

# 11780 — Consumer Compatibility

Consumers should not need to know whether a canonical event originated from legacy bridge or new native producer.

---

# 11781 — High-Risk Migration Domains

Domains needing strongest migration controls include:

```text
Payment
Wallet
Inventory
Order lifecycle
Promotion redemption
Loyalty balances/rewards
```

---

# 11782 — Financial Migration Principle

Never derive a final financial balance only from a partial or ambiguous data copy.

---

# 11783 — Ledger Migration

For wallet/financial ledgers, define whether target receives:

```text
full historical ledger
opening balance + migration entry
selected recent history
```

according to audit and reconciliation requirements.

---

# 11784 — Opening Balance Migration

If migrating with an opening balance:

```text
legacy closing balance
→ migration/opening ledger entry
→ new ongoing ledger
```

must be traceable and reconciled.

---

# 11785 — Balance Cutover Point

Record exact cutover point after which legacy must not create new wallet-changing transactions.

---

# 11786 — In-Flight Financial Transactions

Before cutover, identify:

```text
pending payments
pending top-ups
refunds
wallet reservations
unknown provider outcomes
```

---

# 11787 — Pending Transaction Policy

Choose whether in-flight transactions:

```text
finish in legacy
migrate to new
are blocked during cutover
```

and implement deterministic routing.

---

# 11788 — Payment Reference Preservation

Preserve provider transaction/reference IDs through migration so callback and reconciliation remain possible.

---

# 11789 — Provider Callback During Cutover

Callbacks for legacy-created transactions may continue arriving after new service becomes active.

Route them according to transaction ownership.

---

# 11790 — Wallet Reservation Migration

Active reservations require special treatment because balance correctness depends on both available and reserved amounts.

---

# 11791 — Inventory Reservation Migration

Active stock reservations may remain with legacy until completion rather than being re-created mid-transaction, depending on architecture.

---

# 11792 — Order Ownership Migration

A safe pattern is often:

```text
existing orders finish in legacy
new orders start in new Order Service
```

rather than moving every in-flight order state.

---

# 11793 — Order Ownership Marker

Order identifier/routing metadata must make it clear which runtime owns an existing order.

---

# 11794 — Coupon Reservation Migration

Active coupon reservations and usage counters must not be duplicated across systems.

---

# 11795 — Promotion Budget Migration

Global budget and usage counters require atomic source-of-truth cutover to prevent overspend.

---

# 11796 — Loyalty Points Migration

Points migration needs exact balance/history rules and duplicate earning prevention across event bridges.

---

# 11797 — Reward Migration

Migrate active reward entitlement/claim/expiry state with stable reward identifiers.

---

# 11798 — Mission Progress Migration

Mission migration must preserve:

```text
current progress
completion
reward assignment
period
expiry
distinct-value state when required
```

---

# 11799 — Identity Migration

Migrate accounts with careful credential compatibility. Prefer gradual token/session transition, explicit password strategy, and stable user identity mapping. Do not couple new Identity Service to legacy profile ownership.

---

# 11800 — Customer Migration

Customer profile is a good candidate for read-shadow and gradual write cutover. Preserve stable user/member/card mappings and consent/preferences semantics.

---

# 11801 — Catalog Migration

Catalog can often migrate by store/channel cohort. Compare product/menu/price/modifier output in shadow mode before making the new catalog authoritative.

---

# 11802 — Inventory Migration

Inventory requires single-writer control over stock/reservation. Avoid long-lived dual writers; cut over by store/SKU boundary only when the ownership partition is unambiguous.

---

# 11803 — Cart Migration

Cart state is temporary and may often be allowed to expire rather than fully migrated. Decide how guest/auth carts behave during client version overlap.

---

# 11804 — Ordering Migration

Prefer routing new orders to the new system while allowing old in-flight orders to complete in legacy. Keep lookup routing by order ownership during coexistence.

---

# 11805 — Payment Migration

Route provider callbacks by transaction ownership. Preserve stable provider references, idempotency, unknown-outcome reconciliation, and refund ownership.

---

# 11806 — Wallet Migration

Use a controlled freeze/cutover or strongly coordinated ledger migration. Never maintain two independent authoritative wallet writers.

---

# 11807 — Loyalty Migration

Reconcile balances, ledger, expiry, tier, and reward liabilities before cutover. Event bridges must prevent duplicate earning from legacy/new order events.

---

# 11808 — Promotion Migration

Promotion evaluation can be shadow-compared before redemption writes move. Usage/budget counters require one authoritative writer.

---

# 11809 — Mission Migration

Compare eligibility/progress rules using replay/shadow processing, then cut over event consumption with a precise offset/ownership marker to prevent duplicate progress.

---

# 11810 — Notification Migration

Notification delivery is often easier to strangler-migrate by channel or message type. Preserve deduplication so both legacy/new systems do not send the same customer communication.

---

# 11811 — Integration / ACL Migration

Legacy/provider adapters are intentionally central during migration. Remove each adapter only after no production caller, reconciliation, callback, or report depends on it.

---

# 11812 — Shadow Traffic

Shadow traffic duplicates requests to the new implementation while legacy remains customer-serving authority.

---

# 11813 — Shadow Traffic Goals

Shadowing validates:

```text
contract mapping
business rules
data coverage
performance
error handling
```

---

# 11814 — Shadow Side-Effect Rule

Shadow mode must suppress or isolate external/business side effects.

---

# 11815 — Shadow Payment Prohibition

Do not send real payment charges from shadow traffic.

---

# 11816 — Shadow Notification Prohibition

Do not send duplicate real customer notifications from shadow traffic.

---

# 11817 — Shadow Write Sink

If target logic must execute, route its external effects to:

```text
mock
sandbox
discard sink
validation-only adapter
```

where possible.

---

# 11818 — Shadow Data Privacy

Shadow processing must follow the same data-security requirements as the production request.

---

# 11819 — Shadow Load Impact

Duplicating traffic doubles some downstream workload.

Capacity test the target and protect legacy dependencies from unintended amplification.

---

# 11820 — Shadow Sampling

Start with limited sampling and increase as target stability and capacity are proven.

---

# 11821 — Shadow Timeout Isolation

A slow shadow path must not slow the real customer response.

---

# 11822 — Shadow Result Store

Store compact comparison results rather than full sensitive payloads when possible.

---

# 11823 — Canary Migration

After shadow confidence, route a controlled live cohort to the new service.

---

# 11824 — Canary Ownership

When canary includes writes, ensure affected entities have deterministic ownership and rollback semantics.

---

# 11825 — Canary Expansion

Expand:

```text
internal
small cohort
larger cohort
majority
100%
```

only after defined validation thresholds pass.

---

# 11826 — Canary Abort

Abort expansion for:

```text
business mismatch
data divergence
error spike
latency regression
reconciliation failure
```

---

# 11827 — Reconciliation Is Mandatory

Migration correctness is proved through reconciliation, not assumption.

---

# 11828 — Reconciliation Types

Use:

```text
record count
key coverage
field comparison
aggregate totals
financial balance
state-machine status
event count
business invariant
```

---

# 11829 — Record Count

Record counts are useful but insufficient.

Two datasets can have equal counts and different business state.

---

# 11830 — Key Coverage

Verify every required legacy business key has a target mapping or documented exclusion.

---

# 11831 — Field Reconciliation

Compare canonical fields such as:

```text
status
amount
currency
owner
expiry
store
```

---

# 11832 — Aggregate Reconciliation

Compare business totals such as:

```text
wallet balances
points balances
coupon usage
stock quantity
payment amount
```

---

# 11833 — Invariant Reconciliation

Validate target invariants.

Examples:

```text
wallet balance = ledger sum
coupon usage <= limit
inventory >= allowed minimum
one reward per completion
```

---

# 11834 — Temporal Reconciliation

Account for synchronization lag before declaring a mismatch.

---

# 11835 — Reconciliation Window

Define an expected convergence window per capability.

---

# 11836 — Reconciliation Job

Automate recurring reconciliation during coexistence.

---

# 11837 — Mismatch Record

Store:

```text
entity
legacy value
new value
reason
detected_at
status
owner
```

---

# 11838 — Mismatch Severity

Classify:

```text
critical correctness
financial
customer-visible
operational
cosmetic
expected lag
```

---

# 11839 — Mismatch Repair

Repairs should be domain-aware and auditable.

Avoid indiscriminate copy-over from whichever system seems convenient.

---

# 11840 — Reconciliation Direction

Repair direction follows declared source-of-truth ownership.

---

# 11841 — Financial Reconciliation

Financial migration reconciliation should use independent trusted references where possible, including provider or ledger records.

---

# 11842 — Continuous Reconciliation

Keep reconciliation active through the stabilization period after cutover.

---

# 11843 — Reconciliation Exit

Disable migration reconciliation only when legacy synchronization is retired and new operational reconciliation covers ongoing correctness.

---

# 11844 — Cutover Definition

Cutover is the controlled moment when authoritative traffic or writes move from legacy to the new service.

---

# 11845 — Cutover Plan

Every cutover plan contains:

```text
scope
owner
preconditions
freeze
final sync
route change
validation
rollback
communication
```

---

# 11846 — Cutover Freeze

A short write/config freeze may simplify high-risk cutovers when business permits.

---

# 11847 — Final Delta Sync

Before write authority moves, process remaining migration deltas and measure residual lag.

---

# 11848 — Zero/Bounded Lag

High-risk domains should cut over only when lag is zero or within the explicitly safe bound.

---

# 11849 — Cutover Marker

Record:

```text
cutover_time
source offset/version
route revision
last legacy authoritative ID
```

as applicable.

---

# 11850 — Route Switch

Change routing through versioned/GitOps-controlled configuration where possible.

---

# 11851 — Write Disable First or After

Sequence depends on architecture:

```text
freeze legacy writes
→ final sync
→ enable new writes
```

is safest when downtime/brief maintenance is acceptable.

---

# 11852 — No Split-Brain Window

Avoid a window where both systems independently accept authoritative writes for the same entity set.

---

# 11853 — Cutover Smoke

Immediately validate critical migrated journeys after route change.

---

# 11854 — Cutover Reconciliation

Run fast reconciliation after cutover and before expanding exposure.

---

# 11855 — Cutover Monitoring

Monitor:

```text
traffic share
errors
latency
mismatch
sync lag
business success
support signal
```

---

# 11856 — Cutover Communication

Record start, route switch, validation, and outcome in the production change timeline.

---

# 11857 — Migration Rollback Principle

Rollback is easiest while legacy remains compatible with state created after cutover.

---

# 11858 — Rollback Preconditions

Before cutover know:

```text
how route returns
whether new writes can be represented in legacy
how data sync reverses
which in-flight work stays new
```

---

# 11859 — Read Rollback

Read routing can often return to legacy quickly when legacy remains current.

---

# 11860 — Write Rollback

Write rollback is harder because new authoritative state may need to be back-synchronized first.

---

# 11861 — Reverse Sync

A temporary reverse-sync bridge may be required during rollback, but it must follow the same idempotency/reconciliation standards.

---

# 11862 — Rollback Data Compatibility

If the new domain introduced states/fields legacy cannot represent, full rollback may be impossible.

---

# 11863 — Forward Fix Alternative

When rollback would corrupt or lose new state, a forward fix may be safer.

---

# 11864 — In-Flight Ownership on Rollback

Existing new-system transactions may remain owned by the new system even if new traffic is routed back to legacy.

---

# 11865 — Rollback Marker

Record exact rollback time/offset and ownership boundary.

---

# 11866 — Rollback Reconciliation

After rollback reconcile both systems to ensure no commands or changes were lost during the switch.

---

# 11867 — Rollback Test

Test cutover rollback in staging with representative data before the production migration wave.

---

# 11868 — Legacy Dependency Retirement

Do not decommission the legacy capability until all production dependencies are identified and removed.

---

# 11869 — Dependency Scan

Before retirement search for:

```text
API calls
DB connections
stored procedure calls
file exports
cron jobs
reports
admin tools
partner callbacks
```

---

# 11870 — Database Consumer Inventory

Use database connection/query logs when possible to detect unknown consumers of legacy tables.

---

# 11871 — Legacy API Consumer Inventory

Use gateway/access logs to identify active callers and client versions.

---

# 11872 — Legacy Batch Inventory

Review schedulers and OS cron/task definitions, not only application repositories.

---

# 11873 — Legacy Report Inventory

Reports frequently create hidden read dependencies that block table retirement.

---

# 11874 — Manual Operations Inventory

Store/support/finance teams may rely on manual screens or SQL procedures not visible to engineering architecture diagrams.

---

# 11875 — Partner Callback Inventory

External systems may continue calling legacy webhook URLs long after outbound traffic moved.

---

# 11876 — Compatibility Proxy

A temporary compatibility proxy can redirect legacy caller contracts to the new canonical service while callers migrate.

---

# 11877 — Compatibility Contract Expiry

Every compatibility endpoint has an owner and removal date.

---

# 11878 — Legacy Read Archive

Historical legacy data may be moved to an archive/read-only access path rather than kept in the active transactional system.

---

# 11879 — Decommissioning Principle

Legacy is not migrated until the old production dependency is actually retired.

---

# 11880 — Decommission Entry Criteria

Before decommission:

```text
new authority stable
traffic 100% migrated
reconciliation clean
rollback window closed
dependencies removed
retention needs addressed
```

---

# 11881 — Stop Legacy Writes

Disable legacy writes before deleting data or infrastructure.

---

# 11882 — Read-Only Period

A temporary read-only period can provide confidence before final shutdown.

---

# 11883 — Legacy Traffic Monitor

Alert on any unexpected request to a legacy endpoint scheduled for retirement.

---

# 11884 — Legacy DB Access Monitor

Alert on new/remaining connections to deprecated legacy schemas.

---

# 11885 — Credential Revocation

Revoke:

```text
legacy DB credentials
service accounts
partner keys
API tokens
```

after dependency removal.

---

# 11886 — DNS / Endpoint Retirement

Retire legacy DNS/routes only after callbacks and clients are migrated.

---

# 11887 — Job Disablement

Disable legacy cron/batch jobs that could recreate or mutate retired state.

---

# 11888 — Queue / Consumer Disablement

Stop legacy event consumers/producers after final offset/ownership has been recorded.

---

# 11889 — Archive Before Delete

Preserve required audit/history data before destructive removal.

---

# 11890 — Schema Decommission

Drop legacy tables/schema only after:

```text
retention
backup
dependency scan
approval
```

requirements are satisfied.

---

# 11891 — Application Decommission

Shut down legacy runtime components after traffic reaches zero and rollback is no longer required.

---

# 11892 — Infrastructure Decommission

Remove obsolete:

```text
VMs
containers
load balancers
databases
storage
DNS
monitoring
```

through IaC/change control.

---

# 11893 — Monitoring Cleanup

Remove or archive obsolete alerts/dashboards after confirming they are no longer needed for migration evidence.

---

# 11894 — Runbook Cleanup

Update operational documentation so responders do not follow legacy instructions after retirement.

---

# 11895 — Code Removal

Delete temporary migration adapters, routing flags, CDC pipelines, and compatibility code once no longer required.

---

# 11896 — Feature Flag Removal

Remove migration feature flags after stable 100% cutover to prevent accidental route reversal months later.

---

# 11897 — ACL Removal

Remove the legacy ACL adapter when no remaining production workflow uses the legacy system.

---

# 11898 — Decommission Evidence

Record:

```text
last traffic
last DB access
last callback
credential revoked
backup/archive
shutdown time
owner approval
```

---

# 11899 — Cost Verification

Confirm obsolete infrastructure cost actually disappears after decommission.

---

# 11900 — Migration Observability

Migration requires dedicated visibility beyond normal service monitoring.

---

# 11901 — Migration Dashboard

Recommended dashboard:

```text
legacy traffic
new traffic
shadow volume
match/mismatch
sync lag
migration backlog
error count
reconciliation mismatches
cutover status
```

---

# 11902 — Traffic Share Metric

Track percentage of requests/entities owned by new vs legacy.

---

# 11903 — Shadow Match Metric

Measure canonical result match rate.

---

# 11904 — Sync Lag Metric

Measure distance/time between authoritative source change and target synchronization.

---

# 11905 — Migration Failure Metric

Track failed/quarantined migration records by reason.

---

# 11906 — Bridge Retry Metric

Track retry volume and oldest pending bridge record.

---

# 11907 — Reconciliation Metric

Track mismatch count and age by severity.

---

# 11908 — Fallback Metric

If new-read → legacy fallback exists, monitor fallback rate.

A persistent fallback rate blocks legacy retirement.

---

# 11909 — Legacy Traffic Alert

After cutover, any unexpected legacy traffic should alert.

---

# 11910 — Dual-Write Divergence Alert

Where temporary secondary sync exists, alert on unreplicated authoritative writes.

---

# 11911 — Cutover Annotation

Annotate dashboards with:

```text
migration wave
route change
write authority change
rollback
decommission
```

---

# 11912 — Correlation IDs

Preserve correlation across:

```text
caller
routing layer
ACL
legacy/new service
bridge
```

to diagnose coexistence issues.

---

# 11913 — Migration Audit

Record high-risk migration actions and manual repairs with actor/reason.

---

# 11914 — Migration Testing Strategy

Migration testing must prove both:

```text
target service correctness
+
coexistence/cutover correctness
```

---

# 11915 — Transformation Unit Tests

Every legacy→canonical mapping has deterministic unit tests including invalid/sentinel values.

---

# 11916 — Golden Master Tests

Capture representative legacy inputs/results and compare target behavior where legacy behavior is intentionally preserved.

---

# 11917 — Golden Master Caution

Do not automatically preserve known legacy bugs when the new domain specification intentionally corrects them.

Document intentional differences.

---

# 11918 — Migration Integration Tests

Test extraction, transformation, target write, mapping persistence, retry, and quarantine against realistic stores/databases.

---

# 11919 — Snapshot + Delta Test

Simulate writes occurring during bulk snapshot and prove delta processing closes the gap.

---

# 11920 — Duplicate Delta Test

Replay the same delta and verify target remains correct.

---

# 11921 — Out-of-Order Delta Test

Deliver older/newer changes in unexpected order and verify version rules.

---

# 11922 — Delete Test

Test physical delete/soft-delete/tombstone mapping.

---

# 11923 — Partial Batch Failure Test

Fail migration mid-batch and prove restart does not duplicate or skip records.

---

# 11924 — Shadow Test

Verify shadow path has no customer/business side effects.

---

# 11925 — Fallback Test

Verify new-read fallback to legacy works only for expected cases and produces telemetry.

---

# 11926 — Cutover Test

Rehearse:

```text
freeze
final sync
route switch
validation
```

in staging.

---

# 11927 — Rollback Test

Rehearse route reversal plus any required reverse synchronization.

---

# 11928 — Financial Migration Test

For financial state test:

```text
balance
ledger
pending transaction
duplicate reference
refund
unknown outcome
reconciliation
```

---

# 11929 — Order Migration Test

Test routing of old/in-flight orders to legacy and new orders to target service.

---

# 11930 — Callback Routing Test

Test provider callback routing for both legacy-owned and new-owned transactions during coexistence.

---

# 11931 — Event Bridge Test

Test duplicate, replay, out-of-order, lag, schema compatibility, and cutover from bridge to native producer.

---

# 11932 — Load Test

Measure migration load on:

```text
legacy DB
target DB
Kafka
ACL
network
```

without degrading production service.

---

# 11933 — Soak Test

Long-running bridge/polling migration should prove no unbounded lag/memory/connection leak.

---

# 11934 — Security Test

Validate migration tooling cannot bypass normal production data/security controls.

---

# 11935 — Decommission Test

Before deleting legacy dependencies, disable them in staging and verify no hidden caller breaks.

---

# 11936 — Migration Security

Migration temporarily increases connectivity and data movement, so it can increase attack surface.

---

# 11937 — Least-Privilege Migration Account

Migration jobs use dedicated accounts with only required source read/target write privileges.

---

# 11938 — No Shared Admin Credential

Do not use a broad DBA/root credential as the default application migration mechanism.

---

# 11939 — Temporary Access Expiry

Migration-specific access should be revoked after the wave.

---

# 11940 — Data-in-Transit

Protect migration traffic with approved network/TLS controls.

---

# 11941 — Sensitive Staging Data

Migration staging areas inherit the sensitivity of the data they contain.

---

# 11942 — Migration Log Redaction

Do not log passwords, tokens, full secrets, or unnecessary PII during transformation errors.

---

# 11943 — Migration File Encryption

Bulk export/import files containing sensitive data require encryption and controlled retention.

---

# 11944 — Migration Artifact Retention

Delete temporary extracts after their approved retention period.

---

# 11945 — Production Boundary

Migration tooling must explicitly refuse accidental cross-environment source/target mismatch when practical.

---

# 11946 — Audit High-Risk Repairs

Manual correction of financial or customer state must be auditable.

---

# 11947 — Failure Mode — Sync Lag

If delta/bridge lag grows:

```text
pause cutover
identify bottleneck
scale within safe dependency capacity
protect legacy
```

---

# 11948 — Failure Mode — Mapping Error

Quarantine unmappable records and classify the rule gap.

Do not invent a silent default for unknown business status.

---

# 11949 — Failure Mode — Target Unavailable

When target is not yet authoritative, legacy can continue while migration catches up.

When target is authoritative, normal service recovery rules apply.

---

# 11950 — Failure Mode — Legacy Unavailable

During legacy-primary phases, migration may pause because source truth is unavailable.

Do not promote stale target state without approval.

---

# 11951 — Failure Mode — Split Brain

If both systems accepted conflicting authoritative writes:

```text
stop further writes
identify ownership/time boundary
reconcile conflict
repair deterministically
```

---

# 11952 — Failure Mode — Duplicate Event

Deduplicate by stable source/event/version reference.

---

# 11953 — Failure Mode — Missed Delta

Detect through high-water-mark gap or reconciliation, then replay from a safe source point.

---

# 11954 — Failure Mode — Incorrect Transform

Stop affected migration, identify version/rule, and repair impacted target records through a controlled migration/repair job.

---

# 11955 — Failure Mode — Shadow Mismatch Spike

Stop canary/cutover expansion and classify whether the issue is:

```text
data lag
mapping
business logic
legacy defect
target defect
```

---

# 11956 — Failure Mode — Legacy Callback After Cutover

Route using stable transaction/resource ownership rather than globally assuming all callbacks belong to the new system.

---

# 11957 — Failure Mode — Rollback Requires Lost Data

If new-only state cannot be represented in legacy, use forward recovery or compatibility transformation rather than destructive rollback.

---

# 11958 — Runbook — Migration Lag

1. Check source high-water mark.
2. Check target high-water mark.
3. Inspect bridge backlog/errors.
4. Check DB/Kafka/provider capacity.
5. Pause cutover expansion.
6. Recover/replay from last safe checkpoint.

---

# 11959 — Runbook — Reconciliation Mismatch

1. Determine authoritative source.
2. Check expected sync lag.
3. Compare transformation/version.
4. Classify severity.
5. Repair through domain-aware job.
6. Verify invariant after repair.

---

# 11960 — Runbook — Cutover Rollback

1. Stop new exposure.
2. Record cutover/rollback marker.
3. Determine new writes since cutover.
4. Synchronize required state back if compatible.
5. Restore legacy routing.
6. Validate business flow.
7. Reconcile both systems.

---

# 11961 — Runbook — Hidden Legacy Consumer

1. Identify caller/query.
2. Stop decommission step.
3. Classify business need.
4. Route through canonical compatibility contract.
5. Migrate caller.
6. Resume retirement only after traffic reaches zero.

---

# 11962 — Runbook — Bad Migration Batch

1. Stop batch.
2. Record migration_run_id/checkpoint.
3. Identify affected keys.
4. Fix transformation.
5. repair/reload idempotently.
6. reconcile before continuing.

---

# 11963 — Migration Maintenance Window

Use a maintenance window only when the consistency model requires it.

Do not schedule downtime merely because migration tooling is inconvenient.

---

# 11964 — Zero-Downtime Goal

Many read/service migrations can be zero-downtime through shadowing, replication, and gradual routing.

---

# 11965 — Brief Freeze

A brief write freeze can be safer than complex dual-write for high-value authoritative state.

---

# 11966 — Freeze Communication

If a customer/store-visible freeze is needed, communicate scope and duration through the approved operational process.

---

# 11967 — Cutover Staffing

High-risk migration cutover should have:

```text
legacy expert
new-service expert
platform
DB/data
business owner
support
```

available.

---

# 11968 — Hypercare

After cutover maintain enhanced:

```text
reconciliation
monitoring
support triage
```

until confidence criteria are met.

---

# 11969 — Hypercare Exit

Exit migration hypercare when:

```text
traffic representative
lag zero/stable
mismatch below threshold
no critical support issue
new service stable
```

---

# 11970 — Migration Progress Metrics

Track modernization progress using capability outcomes, not lines of code.

Examples:

```text
% traffic migrated
% authoritative writes migrated
legacy DB queries reduced
legacy endpoints retired
legacy jobs retired
```

---

# 11971 — Capability Completion

A capability counts as migrated only when the legacy production dependency is retired or intentionally retained as archive.

---

# 11972 — Traffic Migration Metric

Measure traffic share by capability rather than one overall platform percentage.

---

# 11973 — Data Migration Metric

Track:

```text
records expected
records migrated
records quarantined
records reconciled
```

---

# 11974 — Dependency Burn-Down

Track remaining direct legacy dependencies per target service.

---

# 11975 — Legacy Cost Metric

Track infrastructure/license/support cost removed by decommission.

---

# 11976 — Migration Defect Metric

Track defects caused by:

```text
mapping
missing dependency
data quality
routing
cutover
reconciliation
```

to improve later waves.

---

# 11977 — Rollback Rate

Migration rollback frequency is a useful program-quality signal, not a reason to hide safe rollbacks.

---

# 11978 — Anti-Pattern — Table-by-Table Microservices

Do not convert each legacy table into a network service. Migrate business ownership boundaries.

---

# 11979 — Anti-Pattern — New Service Reads Legacy DB Forever

Temporary legacy reads need removal criteria; otherwise the new service is not truly independent.

---

# 11980 — Anti-Pattern — Dual Write Without Reconciliation

Two writes without durable retry/mismatch detection create hidden divergence.

---

# 11981 — Anti-Pattern — Shared Source of Truth

Two authoritative systems for the same fact create split-brain business state.

---

# 11982 — Anti-Pattern — Big-Bang Cutover

Avoid moving all capabilities, data, integrations, and clients in one irreversible event.

---

# 11983 — Anti-Pattern — Copy All History First

Historical data migration should follow actual business/audit need, not habit.

---

# 11984 — Anti-Pattern — CDC Equals Domain Event

Raw database changes do not automatically express business intent.

---

# 11985 — Anti-Pattern — Legacy DTO in Core Domain

Legacy field/status names stay in ACL/adapters.

---

# 11986 — Anti-Pattern — Fallback Forever

Fallback should have metrics and removal criteria.

---

# 11987 — Anti-Pattern — Shadow with Side Effects

Shadow traffic must not double-charge, reserve, reward, or notify.

---

# 11988 — Anti-Pattern — Timestamp Wins Everything

Clock-based conflict resolution can violate causality/business semantics.

---

# 11989 — Anti-Pattern — Migrate In-Flight State Blindly

Often safer to let legacy-owned transactions finish where they started.

---

# 11990 — Anti-Pattern — Delete Legacy Too Early

Wait until traffic, callbacks, reports, jobs, and DB consumers are gone.

---

# 11991 — Anti-Pattern — Keep Legacy Credentials

Revoke obsolete credentials after decommission.

---

# 11992 — Anti-Pattern — Permanent Migration Flags

Remove route/cutover flags after stabilization.

---

# 11993 — Anti-Pattern — Reconcile by Row Count Only

Business invariants and values matter, not only counts.

---

# 11994 — Anti-Pattern — Manual Silent Repair

Repairs must be domain-aware, traceable, and reconciled.

---

# 11995 — Anti-Pattern — Ignore Support Workflows

Manual operational dependencies are part of migration scope.

---

# 11996 — Anti-Pattern — Migrate and Redesign Everything

Separate modernization from unrelated business redesign unless explicitly required.

---

# 11997 — Anti-Pattern — No Cutover Marker

Without an exact time/version/offset, ownership during incidents becomes ambiguous.

---

# 11998 — Capability Migration Checklist

- [ ] Capability/bounded context defined.
- [ ] Legacy owner identified.
- [ ] Target owner identified.
- [ ] Contracts canonical.
- [ ] Data ownership explicit.
- [ ] Dependency inventory complete.
- [ ] ACL/routing designed.
- [ ] Reconciliation designed.
- [ ] Rollback designed.
- [ ] Decommission criteria defined.

---

# 11999 — Data Migration Checklist

- [ ] Source tables/entities inventoried.
- [ ] Data profiled.
- [ ] Invalid/sentinel values documented.
- [ ] Mapping deterministic.
- [ ] IDs mapped.
- [ ] timezone/currency handled.
- [ ] snapshot point defined.
- [ ] delta strategy defined.
- [ ] retries idempotent.
- [ ] quarantine path exists.
- [ ] reconciliation exists.

---

# 12000 — Shadow Checklist

- [ ] No side effects.
- [ ] Independent timeout budget.
- [ ] canonical comparison.
- [ ] mismatch classification.
- [ ] capacity safe.
- [ ] privacy safe.
- [ ] dashboard/metrics.
- [ ] cutover threshold defined.

---

# 12001 — Write Cutover Checklist

- [ ] Target fully caught up.
- [ ] Source of truth change approved.
- [ ] Final sync complete.
- [ ] Legacy writes disabled/controlled.
- [ ] In-flight transactions classified.
- [ ] callback routing valid.
- [ ] rollback compatibility known.
- [ ] reconciliation started.

---

# 12002 — Financial Migration Checklist

- [ ] Stable transaction references.
- [ ] Current balances reconciled.
- [ ] Ledger/opening balance rule.
- [ ] Pending transactions handled.
- [ ] reservations handled.
- [ ] duplicate prevention.
- [ ] provider reconciliation.
- [ ] rollback/forward-repair plan.

---

# 12003 — Event Bridge Checklist

- [ ] Canonical schema.
- [ ] Source metadata.
- [ ] deduplication.
- [ ] ordering/version policy.
- [ ] retry/DLQ.
- [ ] replay safe.
- [ ] lag metric.
- [ ] bridge-to-native cutover marker.

---

# 12004 — Cutover Checklist

- [ ] GO decision.
- [ ] legacy/new health green.
- [ ] final delta complete.
- [ ] lag within bound.
- [ ] mismatch within threshold.
- [ ] route revision ready.
- [ ] support/on-call present.
- [ ] rollback path ready.
- [ ] post-cutover reconciliation ready.

---

# 12005 — Decommission Checklist

- [ ] New system authoritative/stable.
- [ ] Legacy traffic zero.
- [ ] Legacy writes disabled.
- [ ] Callbacks migrated.
- [ ] Reports migrated.
- [ ] Jobs migrated/disabled.
- [ ] DB consumers removed.
- [ ] archive/retention satisfied.
- [ ] credentials revoked.
- [ ] migration code removed.

---

# 12006 — Migration Decision Template

```text
Capability:
Legacy Implementation:
Target Service:
Reason to Migrate:
Migration Wave:
Business Owner:
Technical Owner:
Risk Tier:
Source of Truth Before:
Source of Truth During:
Source of Truth After:
```

---

# 12007 — Data Mapping Template

```text
Legacy Source:
Legacy Field:
Legacy Meaning:
Canonical Field:
Transformation:
Null/Sentinel Rule:
Validation:
Owner:
```

---

# 12008 — Identifier Mapping Template

```text
Entity:
Legacy System:
Legacy ID:
Target ID:
Mapping Created At:
Migration Run:
Status:
```

---

# 12009 — Reconciliation Template

```text
Entity:
Authoritative Source:
Legacy Value:
Target Value:
Expected Lag:
Mismatch Type:
Severity:
Resolution:
Owner:
```

---

# 12010 — Cutover Runbook Template

```text
Capability:
Window:
Coordinator:
Preconditions:
Freeze:
Final Sync:
Cutover Marker:
Route Change:
Smoke Tests:
Reconciliation:
Abort Criteria:
Rollback:
Communication:
```

---

# 12011 — Decommission Record Template

```text
Capability:
Last Legacy Write:
Last Legacy Read:
Last API Traffic:
Last DB Consumer:
Last Callback:
Archive:
Credentials Revoked:
Runtime Shutdown:
Infrastructure Removed:
Approved By:
```

---

# 12012 — Migration Governance Standard

Architecture review should reject migration designs that introduce:

```text
permanent cross-service DB reads
unbounded dual write
ambiguous authority
raw legacy schema in core domain
no reconciliation
no rollback
no removal plan
```

---

# 12013 — Minimum Viable Strangler Standard

Every migration wave has at minimum:

```text
clear capability boundary
ACL/canonical contract
source-of-truth matrix
data migration strategy
routing control
reconciliation
rollback
decommission plan
```

---

# 12014 — Mature Strangler Standard

A mature platform additionally supports:

```text
automated dependency discovery
shadow comparison platform
versioned migration pipelines
CDC/event bridges
progressive traffic routing
automated reconciliation
migration dashboards
decommission evidence
```

---

# 12015 — Migration Automation Principle

Automate deterministic extraction, transformation, comparison, and reconciliation.

Keep business-risk decisions and ambiguous conflict resolution explicit and reviewable.

---

# 12016 — Migration Code Ownership

Temporary migration code still requires:

```text
owner
tests
security
observability
review
```

because it runs against critical production data.

---

# 12017 — Removal Ticket

Create the removal/decommission task at the same time migration compatibility code is introduced.

---

# 12018 — Migration Retrospective

After each wave review:

```text
hidden dependencies
mapping defects
cutover duration
reconciliation mismatches
manual steps
rollback readiness
```

and improve the next wave.

---

# 12019 — Migration Is an Architecture Feedback Loop

If repeated migration waves expose the same boundary confusion, revisit service boundaries rather than adding more ACL exceptions.

---

# 12020 — PART 41 Deliverables

PART 41 produces:

1. Strangler migration principles.
2. Migration capability/wave model.
3. Source-of-truth rules.
4. ACL/routing strategy.
5. Legacy dependency discovery.
6. Data profiling and transformation strategy.
7. Snapshot/delta/CDC/polling patterns.
8. Dual-write and single-writer rules.
9. Shadow-read and comparison strategy.
10. Write-cutover strategy.
11. Event bridge strategy.
12. Financial/high-risk migration controls.
13. Domain-specific migration guidance.
14. Reconciliation model.
15. Cutover and rollback runbooks.
16. Legacy dependency retirement.
17. Decommission strategy.
18. Migration observability and metrics.
19. Testing/security standards.
20. Checklists/templates/governance.
21. Handoff to monitoring and incident response.

---

# 12021 — Exit Criteria — Boundary

PART 41 is complete for a capability when the team can answer:

```text
What exact business capability is being migrated, and which new service owns it?
```

---

# 12022 — Exit Criteria — Authority

```text
Which system is authoritative before, during, and after cutover for every migrated business fact?
```

---

# 12023 — Exit Criteria — Data

```text
How are snapshot, delta, transformation, identifiers, invalid records, and reconciliation handled?
```

---

# 12024 — Exit Criteria — Routing

```text
How can traffic move gradually between legacy and new implementation without ambiguous ownership?
```

---

# 12025 — Exit Criteria — Writes

```text
How is split-brain prevented when authoritative writes move?
```

---

# 12026 — Exit Criteria — Events

```text
How are legacy changes translated to canonical events, deduplicated, replayed, and eventually replaced by native producers?
```

---

# 12027 — Exit Criteria — Reconciliation

```text
How is divergence detected, classified, repaired, and proven resolved?
```

---

# 12028 — Exit Criteria — Rollback

```text
If cutover fails, what can safely return to legacy and what new state must remain with the new platform?
```

---

# 12029 — Exit Criteria — Decommission

```text
How do we prove no API, DB consumer, batch job, report, callback, or operator still depends on the legacy capability?
```

---

# 12030 — Handoff to PART 42

PART 42 defines Monitoring / Incident Response.

```text
PART 41
Migration / Strangler Strategy
      ↓
Mixed Legacy + New Production
      ↓
Cutover / Reconciliation / Decommission
      ↓
PART 42
Monitoring / Incident Response
```

---

# 12031 — PART 42 Scope Preview

PART 42 will define how the organization detects and responds to production incidents across both migrated and still-legacy capabilities.

It will cover:

```text
monitoring operations
alert routing
incident severity
on-call
triage
incident command
communications
diagnosis
mitigation
escalation
customer impact
recovery
incident metrics
```

---

# 12032 — Key Transition

```text
PART 41
= progressively change production ownership from legacy to new services

PART 42
= continuously detect and respond when production behavior becomes unhealthy during and after that transition
```

---

# PART 41 — Summary

Migration / Strangler Strategy moves the platform from legacy implementation to microservice ownership without requiring a single high-risk rewrite.

The recommended migration flow is:

```text
Discover Legacy Capability + Dependencies
      ↓
Define New Business Owner / Canonical Contract
      ↓
Introduce ACL + Routing Boundary
      ↓
Build Target Service
      ↓
Bulk Snapshot / Initial Data Load
      ↓
Delta Sync / Event Bridge
      ↓
Shadow Read / Shadow Rule Comparison
      ↓
Reconcile
      ↓
Canary Read Traffic
      ↓
Final Delta / Write Cutover
      ↓
New Service Becomes Authoritative
      ↓
Legacy Compatibility Sync (temporary)
      ↓
Hypercare + Continuous Reconciliation
      ↓
Remove Legacy Dependencies
      ↓
Disable Legacy Writes / Reads
      ↓
Revoke Credentials / Remove ACL
      ↓
Decommission Legacy Runtime and Data Path
```

The most important architecture rules are:

```text
Migrate business capabilities, not tables.
Business/service ownership must be clear before migration.
At every phase, every business fact has one declared source of truth.
Core services speak canonical language; legacy translation stays in the ACL.
Legacy DB access is isolated and temporary.
Prefer one authoritative writer.
Dual write is a distributed-consistency problem and requires idempotency + reconciliation.
Shadow reads do not affect customer responses or create side effects.
Compare canonical business results, not raw legacy formatting.
CDC is migration infrastructure, not automatically a domain-event stream.
Bulk snapshot requires a high-water mark and delta catch-up.
Migration jobs are restart-safe, idempotent, observable, and least-privilege.
Writes move only after target data, idempotency, reconciliation, and rollback are proven.
Existing in-flight transactions may remain with the system that created them.
Financial state requires stable references, ledger/balance reconciliation, and unknown-outcome handling.
Event bridges deduplicate and preserve clear producer ownership at cutover.
Every migration has a measurable rollback window.
Fallback and compatibility paths have explicit removal criteria.
Continuous reconciliation proves convergence.
A capability is not fully migrated while production still depends on its legacy write/read path.
Decommissioning includes APIs, tables, jobs, reports, callbacks, credentials, routes, and operational documentation.
Migration code is temporary production code and receives normal testing/security/observability standards.
```

The next chapter defines the live operational response model across the resulting production platform:

```text
PART 42 — MONITORING / INCIDENT RESPONSE
```

---

**End of PART 41 — Migration / Strangler Strategy**
