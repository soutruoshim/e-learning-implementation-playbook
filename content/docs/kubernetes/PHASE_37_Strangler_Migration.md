---
title: "PHASE 37 — Strangler Migration"
---

# PHASE 37 — Strangler Migration

> **Purpose:** Define and execute the controlled migration of real production business capabilities, data, integrations, events, traffic, and authority from legacy implementations to the new microservices platform without a big-bang rewrite.
>
> **Previous Phase:** Phase 36 — Production Deployment
>
> **Next Phase:** Phase 38 — Monitoring / Incident Response
>
> **Primary Architecture Basis:** PART 41 — Migration / Strangler Strategy.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Kafka, Redis, Kubernetes, GitOps, Integration / Anti-Corruption Layer, legacy APIs/databases/stored procedures where applicable.
>
> **Status:** Implementation-Ready Legacy Modernization / Strangler Migration Specification

---

# 1. Phase 37 Implementation Mandate

The source's core principle is:

```text
Replace one owned business capability at a time
behind stable canonical contracts.
```

Migration is therefore not:

```text
move table A
move table B
switch everything
```

It is:

```text
identify an owned business capability
      ↓
establish canonical boundary
      ↓
introduce coexistence / routing
      ↓
move data and behavior
      ↓
prove convergence
      ↓
move authority
      ↓
remove legacy dependency
```

---

# 2. Why Strangler Migration

A big-bang rewrite combines too many risks at once:

```text
business-rule change
architecture change
data migration
deployment change
integration change
operational change
```

The strangler model reduces the failure domain by migrating one capability or tightly understood capability slice at a time.

---

# 3. Migration Unit

Preferred unit:

```text
owned business capability
or
bounded-context slice
```

Not:

```text
arbitrary database table
```

Examples from the source include:

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

# 4. Core Migration Flow

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

---

# 5. Authority Rule

At every migration phase:

```text
every business fact
=
one declared authoritative owner
```

Examples:

```text
customer profile
wallet balance
order status
coupon usage
mission progress
```

Avoid any state where operators, callers, or services cannot answer whether legacy or new owns the truth.

---

# 6. Canonical Boundary Rule

```text
Legacy Model
      ↓
Integration / ACL
      ↓
Canonical Contract
      ↓
New Domain
```

Core services speak canonical language.

Legacy:

```text
table names
numeric statuses
sentinel values
stored-procedure semantics
provider-specific schemas
```

remain isolated inside migration/integration boundaries rather than leaking permanently into the new domain.

---

# 7. Single-Writer Rule

Preferred:

```text
one authoritative writer
```

Dual write is not a convenience feature.

It is a distributed consistency problem requiring:

```text
idempotency
stable references
failure handling
reconciliation
clear conflict policy
bounded duration
removal plan
```

Write authority only moves after target data, idempotency, reconciliation, cutover, and rollback are proven.

---

# 8. Shadowing Rule

Shadow reads/comparisons:

```text
must not affect customer responses
must not create side effects
must not mutate authority
```

Compare canonical business outcomes rather than raw legacy representation.

---

# 9. Data Migration Rule

Bulk migration requires:

```text
profile source data
define transformation
define identifiers
define invalid-record handling
capture high-water mark
load snapshot
catch up delta
reconcile
```

Snapshot alone is insufficient because production can keep changing during extraction/loading.

Migration jobs must be:

```text
restart-safe
idempotent
observable
least-privilege
```

---

# 10. Event Migration Rule

CDC can be useful migration infrastructure, but:

```text
CDC
≠
native domain-event architecture
```

Legacy changes may be translated into temporary canonical events, but final producer ownership should eventually move to the new authoritative service.

Event bridges need:

```text
producer ownership
deduplication
replay behavior
correlation/reference mapping
cutover marker
removal plan
```

---

# 11. Financial / High-Risk Rule

Financial and correctness-sensitive state requires stronger controls:

```text
stable business references
idempotency
ledger/balance reconciliation
UNKNOWN outcome handling
single-writer transition
explicit cutover marker
strict rollback boundary
```

Do not use the most complex payment/wallet/inventory-accounting capability as the first learning wave unless the migration program is already mature.

---

# 12. Minimum Viable Strangler Standard

Every migration wave has at minimum:

```text
clear capability boundary
ACL / canonical contract
source-of-truth matrix
data migration strategy
routing control
reconciliation
rollback
decommission plan
```

---

# 13. Detailed Source-Aligned Specification

The following detailed specification preserves PART 41 terminology, capability/wave model, source-of-truth rules, ACL and routing, data migration patterns, dual-write risks, shadow comparison, event bridges, domain-specific migration controls, reconciliation, rollback, retirement, decommissioning, observability, testing, governance, templates, and Phase 38 handoff.

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

---

# 14. Implementation Work Breakdown

Source-derived implementation tickets:

```text
MIG-001 Prioritize and complete Strangler migration principles
MIG-002 Prioritize and complete Migration capability/wave model
MIG-003 Prioritize and complete Source-of-truth rules
MIG-004 Prioritize and complete ACL/routing strategy
MIG-005 Prioritize and complete Legacy dependency discovery
MIG-006 Prioritize and complete Data profiling and transformation strategy
MIG-007 Prioritize and complete Snapshot/delta/CDC/polling patterns
MIG-008 Prioritize and complete Dual-write and single-writer rules
MIG-009 Prioritize and complete Shadow-read and comparison strategy
MIG-010 Prioritize and complete Write-cutover strategy
MIG-011 Prioritize and complete Event-bridge strategy
MIG-012 Prioritize and complete Financial/high-risk migration controls
MIG-013 Prioritize and complete Domain-specific migration guidance
MIG-014 Prioritize and complete Reconciliation model
MIG-015 Prioritize and complete Cutover and rollback runbooks
MIG-016 Prioritize and complete Legacy dependency retirement
MIG-017 Prioritize and complete Decommission strategy
MIG-018 Prioritize and complete Migration observability and metrics
MIG-019 Prioritize and complete Testing/security standards
MIG-020 Prioritize and complete Checklists/templates/governance
MIG-021 Prioritize and complete Monitoring/Incident Response handoff
MIG-022 Define, approve, and enforce Stable Contract Principle
MIG-023 Implement and verify Anti-Corruption Layer Role
MIG-024 Implement and verify Migration Is Temporary Architecture
MIG-025 Implement and verify Migration Success Definition
MIG-026 Implement and verify Migration Program Goals
MIG-027 Implement and verify Migration Non-Goals
MIG-028 Define, approve, and enforce Migration Governance
MIG-029 Define, approve, and enforce Migration Owner
MIG-030 Define, approve, and enforce Migration Wave
MIG-031 Create and standardize Migration Wave Template
MIG-032 Implement, control, and verify Capability Inventory
MIG-033 Implement and verify Dependency Discovery
MIG-034 Implement and verify Unknown Dependency Risk
MIG-035 Implement and verify Migration Dependency Graph
MIG-036 Define, approve, and enforce Migration Priority
MIG-037 Define, approve, and enforce Avoid First-Wave Financial Core
MIG-038 Define, approve, and enforce Learning Wave
MIG-039 Implement and verify Business Sequencing
MIG-040 Define, approve, and enforce Migration Decision Record
MIG-041 Define, approve, and enforce Entry Criteria
MIG-042 Define, approve, and enforce Exit Criteria
MIG-043 Define, approve, and enforce Source-of-Truth Principle
MIG-044 Define, approve, and enforce No Ambiguous Authority
MIG-045 Define, approve, and enforce Authority Matrix
MIG-046 Define, approve, and enforce Read Authority vs Write Authority
MIG-047 Implement and verify Single-Writer Preference
MIG-048 Implement and verify Dual-Write Warning
MIG-049 Implement and verify Dual-Write Is Distributed Transaction
MIG-050 Implement and verify Write-Through Adapter
MIG-051 Implement, control, and verify Legacy-Primary Phase
MIG-052 Implement and verify New-Primary Phase
MIG-053 Implement and verify No Return to Shared Writes
MIG-054 Define, approve, and enforce Migration Routing Boundary
MIG-055 Implement and verify Route by Capability
MIG-056 Implement and verify Route by Cohort
MIG-057 Implement and verify Stable Cohort Assignment
MIG-058 Implement and verify Route by Store
MIG-059 Implement, control, and verify Route by Customer
MIG-060 Implement and verify Route by Resource
MIG-061 Define, approve, and enforce Resource Ownership Marker
MIG-062 Implement, control, and verify Feature Flag Routing
MIG-063 Implement, control, and verify Gateway Route Rollback
MIG-064 Implement, control, and verify ACL During Coexistence
MIG-065 Implement, control, and verify Legacy Adapter Contract
MIG-066 Implement, control, and verify Legacy DB Adapter
MIG-067 Implement, control, and verify Read-Only Legacy DB Access
MIG-068 Implement and verify Stored Procedure Adapter
MIG-069 Implement, control, and verify Legacy Status Mapping
MIG-070 Implement and verify Identifier Mapping
MIG-071 Implement and verify Identifier Mapping Persistence
MIG-072 Implement and verify Mapping Immutability
MIG-073 Define, approve, and enforce Data Migration Principle
MIG-074 Define, approve, and enforce Data Classification
MIG-075 Implement and verify Current-State Migration
MIG-076 Implement, control, and verify Historical Data Migration
MIG-077 Implement and verify Do Not Copy Garbage Blindly
MIG-078 Implement, control, and verify Data Profiling
MIG-079 Implement, control, and verify Data Quality Report
MIG-080 Implement and verify Canonical Transformation
MIG-081 Implement and verify Transformation Determinism
MIG-082 Implement and verify Migration Staging Area
MIG-083 Implement and verify Quarantine
MIG-084 Implement and verify Migration Batch ID
MIG-085 Implement, control, and verify Migration Record Metadata
MIG-086 Implement and verify Bulk Load
MIG-087 Implement, control, and verify Snapshot Consistency
MIG-088 Implement, control, and verify Snapshot Timestamp
MIG-089 Implement, control, and verify Delta Migration
MIG-090 Implement, control, and verify Delta High-Water Mark
MIG-091 Implement, control, and verify Polling Migration
MIG-092 Implement, control, and verify Polling Gap Risk
MIG-093 Implement, control, and verify CDC Migration
MIG-094 Define, approve, and enforce CDC Boundary
MIG-095 Implement, control, and verify CDC Schema Coupling
MIG-096 Implement, control, and verify CDC Ordering
MIG-097 Implement and verify Delete Handling
MIG-098 Implement and verify Soft Delete Mapping
MIG-099 Implement and verify Large Table Migration
MIG-100 Implement and verify Migration Throttling
MIG-101 Implement and verify Migration Retry
MIG-102 Implement and verify Upsert Policy
MIG-103 Implement and verify Version Conflict
MIG-104 Implement and verify Optimistic Version
MIG-105 Define, approve, and enforce Migration Transaction Boundary
MIG-106 Implement and verify Referential Order
MIG-107 Implement and verify Foreign-Key Mapping
MIG-108 Implement and verify Money Migration
MIG-109 Implement and verify Time Migration
MIG-110 Implement and verify Encoding Migration
MIG-111 Implement, control, and verify Sensitive Data Migration
MIG-112 Implement and verify Password Migration
MIG-113 Implement and verify Token Migration
MIG-114 Implement and verify Synchronization Modes
MIG-115 Implement and verify Prefer Domain-Level Sync
MIG-116 Implement, control, and verify Legacy-to-New Event Bridge
MIG-117 Implement, control, and verify New-to-Legacy Compatibility Bridge
MIG-118 Define, approve, and enforce Bridge Ownership
MIG-119 Implement, control, and verify Bridge Idempotency
MIG-120 Implement, control, and verify Bridge Replay
MIG-121 Implement, control, and verify Bridge Lag
MIG-122 Implement and verify Synchronization SLA
MIG-123 Implement and verify Conflict Policy
MIG-124 Implement and verify Avoid Timestamp-Only Conflict Resolution
MIG-125 Define, approve, and enforce Sequence-Based Conflict
MIG-126 Implement and verify Manual Conflict Queue
MIG-127 Implement and verify Read Migration Stages
MIG-128 Implement, measure, and verify Shadow Read
MIG-129 Implement, measure, and verify Shadow Read Safety
MIG-130 Implement, measure, and verify Shadow Read Timeout
MIG-131 Implement, measure, and verify Shadow Comparison
MIG-132 Implement and verify Comparison Normalization
MIG-133 Define, approve, and enforce Mismatch Classification
MIG-134 Implement and verify Mismatch Sampling
MIG-135 Implement, measure, and verify Mismatch Dashboard
MIG-136 Implement and verify Read Fallback
MIG-137 Implement and verify Fallback Risk
MIG-138 Implement and verify No Silent Mixed Truth
MIG-139 Implement, control, and verify Read Cutover Criteria
MIG-140 Implement, control, and verify Read Cutover Cohort
MIG-141 Implement and verify New-Only Read
MIG-142 Implement and verify Write Migration Is Harder
MIG-143 Implement, control, and verify Write Cutover Preconditions
MIG-144 Implement, measure, and verify Write Shadowing
MIG-145 Implement, measure, and verify Write Validation Compare
MIG-146 Implement and verify Write Mirror
MIG-147 Implement and verify Mirror from Committed Fact
MIG-148 Implement, control, and verify Write Cutover
MIG-149 Implement, control, and verify Legacy Write Disable
MIG-150 Implement, control, and verify Legacy Compatibility Update
MIG-151 Implement, measure, and verify Post-Cutover Write Reconciliation
MIG-152 Implement, control, and verify Write Rollback Window
MIG-153 Implement, control, and verify Rollback Compatibility
MIG-154 Implement and verify Dual-Write Patterns
MIG-155 Implement, control, and verify Caller Dual Write
MIG-156 Implement and verify Primary + Secondary Write
MIG-157 Implement and verify Secondary Write Failure
MIG-158 Implement and verify Outbox for Migration Sync
MIG-159 Implement, control, and verify Legacy Without Outbox
MIG-160 Implement and verify Exactly-Once Myth
MIG-161 Implement and verify Idempotency Key
MIG-162 Implement and verify Request Hash
MIG-163 Implement, control, and verify Event Migration
MIG-164 Define, approve, and enforce Canonical Event Ownership
MIG-165 Implement, control, and verify Legacy Event Translation
MIG-166 Implement, control, and verify Do Not Over-Interpret CDC
MIG-167 Implement, control, and verify Event Bridge Versioning
MIG-168 Implement, control, and verify Event Timestamp
MIG-169 Implement, control, and verify Event Source Metadata
MIG-170 Implement, control, and verify Replay Cutover
MIG-171 Implement, control, and verify Producer Cutover Marker
MIG-172 Implement and verify Consumer Compatibility
MIG-173 Implement and verify High-Risk Migration Domains
MIG-174 Define, approve, and enforce Financial Migration Principle
MIG-175 Implement and verify Ledger Migration
MIG-176 Implement and verify Opening Balance Migration
MIG-177 Implement, control, and verify Balance Cutover Point
MIG-178 Implement, control, and verify In-Flight Financial Transactions
MIG-179 Implement and verify Pending Transaction Policy
MIG-180 Implement, control, and verify Payment Reference Preservation
MIG-181 Implement, control, and verify Provider Callback During Cutover
MIG-182 Implement, control, and verify Wallet Reservation Migration
MIG-183 Implement, control, and verify Inventory Reservation Migration
MIG-184 Define, approve, and enforce Order Ownership Migration
MIG-185 Define, approve, and enforce Order Ownership Marker
MIG-186 Implement and verify Coupon Reservation Migration
MIG-187 Implement, control, and verify Promotion Budget Migration
MIG-188 Implement and verify Loyalty Points Migration
MIG-189 Implement and verify Reward Migration
MIG-190 Implement, control, and verify Mission Progress Migration
MIG-191 Implement and verify Identity Migration
MIG-192 Implement, control, and verify Customer Migration
MIG-193 Implement, control, and verify Catalog Migration
MIG-194 Implement, control, and verify Inventory Migration
MIG-195 Implement and verify Cart Migration
MIG-196 Implement and verify Ordering Migration
MIG-197 Implement, control, and verify Payment Migration
MIG-198 Implement, control, and verify Wallet Migration
MIG-199 Implement and verify Loyalty Migration
MIG-200 Implement, control, and verify Promotion Migration
MIG-201 Implement, control, and verify Mission Migration
MIG-202 Implement, control, and verify Notification Migration
MIG-203 Implement, control, and verify Integration / ACL Migration
MIG-204 Implement, measure, and verify Shadow Traffic
MIG-205 Implement, measure, and verify Shadow Traffic Goals
MIG-206 Implement, measure, and verify Shadow Side-Effect Rule
MIG-207 Implement, measure, and verify Shadow Payment Prohibition
MIG-208 Implement, measure, and verify Shadow Notification Prohibition
MIG-209 Implement, measure, and verify Shadow Write Sink
MIG-210 Implement, measure, and verify Shadow Data Privacy
MIG-211 Implement, measure, and verify Shadow Load Impact
MIG-212 Implement, measure, and verify Shadow Sampling
MIG-213 Implement, measure, and verify Shadow Timeout Isolation
MIG-214 Implement, measure, and verify Shadow Result Store
MIG-215 Implement and verify Canary Migration
MIG-216 Define, approve, and enforce Canary Ownership
MIG-217 Implement and verify Canary Expansion
MIG-218 Implement and verify Canary Abort
MIG-219 Implement, measure, and verify Reconciliation Is Mandatory
MIG-220 Implement, measure, and verify Reconciliation Types
MIG-221 Implement and verify Record Count
MIG-222 Implement and verify Key Coverage
MIG-223 Implement, measure, and verify Field Reconciliation
MIG-224 Implement, measure, and verify Aggregate Reconciliation
MIG-225 Implement, measure, and verify Invariant Reconciliation
MIG-226 Implement, measure, and verify Temporal Reconciliation
MIG-227 Implement, measure, and verify Reconciliation Window
MIG-228 Implement, measure, and verify Reconciliation Job
MIG-229 Implement and verify Mismatch Record
MIG-230 Implement and verify Mismatch Severity
MIG-231 Implement and verify Mismatch Repair
MIG-232 Implement, measure, and verify Reconciliation Direction
MIG-233 Implement, measure, and verify Financial Reconciliation
MIG-234 Implement, measure, and verify Continuous Reconciliation
MIG-235 Implement, measure, and verify Reconciliation Exit
MIG-236 Implement, control, and verify Cutover Definition
MIG-237 Implement, control, and verify Cutover Plan
MIG-238 Implement, control, and verify Cutover Freeze
MIG-239 Implement, control, and verify Final Delta Sync
MIG-240 Implement and verify Zero/Bounded Lag
MIG-241 Implement, control, and verify Cutover Marker
MIG-242 Implement and verify Route Switch
MIG-243 Implement and verify Write Disable First or After
MIG-244 Implement and verify No Split-Brain Window
MIG-245 Implement, control, and verify Cutover Smoke
MIG-246 Implement, measure, and verify Cutover Reconciliation
MIG-247 Implement, control, and verify Cutover Monitoring
MIG-248 Implement, control, and verify Cutover Communication
MIG-249 Define, approve, and enforce Migration Rollback Principle
MIG-250 Implement, control, and verify Rollback Preconditions
MIG-251 Implement, control, and verify Read Rollback
MIG-252 Implement, control, and verify Write Rollback
MIG-253 Implement and verify Reverse Sync
MIG-254 Implement, control, and verify Rollback Data Compatibility
MIG-255 Implement and verify Forward Fix Alternative
MIG-256 Define, approve, and enforce In-Flight Ownership on Rollback
MIG-257 Implement, control, and verify Rollback Marker
MIG-258 Implement, measure, and verify Rollback Reconciliation
MIG-259 Implement, measure, and verify Rollback Test
MIG-260 Implement, control, and verify Legacy Dependency Retirement
MIG-261 Implement and verify Dependency Scan
MIG-262 Implement, control, and verify Database Consumer Inventory
MIG-263 Implement, control, and verify Legacy API Consumer Inventory
MIG-264 Implement, control, and verify Legacy Batch Inventory
MIG-265 Implement, control, and verify Legacy Report Inventory
MIG-266 Implement, control, and verify Manual Operations Inventory
MIG-267 Implement, control, and verify Partner Callback Inventory
MIG-268 Implement and verify Compatibility Proxy
MIG-269 Implement and verify Compatibility Contract Expiry
MIG-270 Implement, control, and verify Legacy Read Archive
MIG-271 Define, approve, and enforce Decommissioning Principle
MIG-272 Define, approve, and enforce Decommission Entry Criteria
MIG-273 Implement, control, and verify Stop Legacy Writes
MIG-274 Implement and verify Read-Only Period
MIG-275 Implement, control, and verify Legacy Traffic Monitor
MIG-276 Implement, control, and verify Legacy DB Access Monitor
MIG-277 Implement, control, and verify Credential Revocation
MIG-278 Implement and verify DNS / Endpoint Retirement
MIG-279 Implement and verify Job Disablement
MIG-280 Implement and verify Queue / Consumer Disablement
MIG-281 Implement, control, and verify Archive Before Delete
MIG-282 Implement, control, and verify Schema Decommission
MIG-283 Implement, control, and verify Application Decommission
MIG-284 Implement, control, and verify Infrastructure Decommission
MIG-285 Implement and verify Monitoring Cleanup
MIG-286 Write, validate, and exercise Runbook Cleanup
MIG-287 Implement and verify Code Removal
MIG-288 Implement and verify Feature Flag Removal
MIG-289 Implement, control, and verify ACL Removal
MIG-290 Implement, control, and verify Decommission Evidence
MIG-291 Implement and verify Cost Verification
MIG-292 Implement, measure, and verify Migration Observability
MIG-293 Implement, measure, and verify Migration Dashboard
MIG-294 Implement, measure, and verify Traffic Share Metric
MIG-295 Implement, measure, and verify Shadow Match Metric
MIG-296 Implement, measure, and verify Sync Lag Metric
MIG-297 Implement, measure, and verify Migration Failure Metric
MIG-298 Implement, measure, and verify Bridge Retry Metric
MIG-299 Implement, measure, and verify Reconciliation Metric
MIG-300 Implement, measure, and verify Fallback Metric
MIG-301 Implement, measure, and verify Legacy Traffic Alert
MIG-302 Implement, measure, and verify Dual-Write Divergence Alert
MIG-303 Implement, control, and verify Cutover Annotation
MIG-304 Implement and verify Correlation IDs
MIG-305 Implement and verify Migration Audit
MIG-306 Implement, measure, and verify Migration Testing Strategy
MIG-307 Implement, measure, and verify Transformation Unit Tests
MIG-308 Implement, measure, and verify Golden Master Tests
MIG-309 Implement and verify Golden Master Caution
MIG-310 Implement, measure, and verify Migration Integration Tests
MIG-311 Implement, measure, and verify Snapshot + Delta Test
MIG-312 Implement, measure, and verify Duplicate Delta Test
MIG-313 Implement, measure, and verify Out-of-Order Delta Test
MIG-314 Implement, measure, and verify Delete Test
MIG-315 Implement, measure, and verify Partial Batch Failure Test
MIG-316 Implement, measure, and verify Shadow Test
MIG-317 Implement, measure, and verify Fallback Test
MIG-318 Implement, measure, and verify Cutover Test
MIG-319 Implement, measure, and verify Financial Migration Test
MIG-320 Implement, measure, and verify Order Migration Test
MIG-321 Implement, measure, and verify Callback Routing Test
MIG-322 Implement, measure, and verify Event Bridge Test
MIG-323 Implement, measure, and verify Load Test
MIG-324 Implement, measure, and verify Soak Test
MIG-325 Implement, measure, and verify Security Test
MIG-326 Implement, measure, and verify Decommission Test
MIG-327 Implement and verify Migration Security
MIG-328 Implement and verify Least-Privilege Migration Account
MIG-329 Implement, control, and verify No Shared Admin Credential
MIG-330 Implement and verify Temporary Access Expiry
MIG-331 Implement, control, and verify Data-in-Transit
MIG-332 Implement, control, and verify Sensitive Staging Data
MIG-333 Implement and verify Migration Log Redaction
MIG-334 Implement and verify Migration File Encryption
MIG-335 Implement and verify Migration Artifact Retention
MIG-336 Define, approve, and enforce Production Boundary
MIG-337 Implement and verify Audit High-Risk Repairs
MIG-338 Implement and verify Failure Mode — Sync Lag
MIG-339 Implement and verify Failure Mode — Mapping Error
MIG-340 Implement and verify Failure Mode — Target Unavailable
MIG-341 Implement, control, and verify Failure Mode — Legacy Unavailable
MIG-342 Implement and verify Failure Mode — Split Brain
MIG-343 Implement, control, and verify Failure Mode — Duplicate Event
MIG-344 Implement, control, and verify Failure Mode — Missed Delta
MIG-345 Implement and verify Failure Mode — Incorrect Transform
MIG-346 Implement, measure, and verify Failure Mode — Shadow Mismatch Spike
MIG-347 Implement, control, and verify Failure Mode — Legacy Callback After Cutover
MIG-348 Implement, control, and verify Failure Mode — Rollback Requires Lost Data
MIG-349 Write, validate, and exercise Runbook — Migration Lag
MIG-350 Write, validate, and exercise Runbook — Reconciliation Mismatch
MIG-351 Write, validate, and exercise Runbook — Cutover Rollback
MIG-352 Write, validate, and exercise Runbook — Hidden Legacy Consumer
MIG-353 Write, validate, and exercise Runbook — Bad Migration Batch
MIG-354 Implement and verify Migration Maintenance Window
MIG-355 Implement and verify Zero-Downtime Goal
MIG-356 Implement and verify Brief Freeze
MIG-357 Implement and verify Freeze Communication
MIG-358 Implement, control, and verify Cutover Staffing
MIG-359 Implement and verify Hypercare
MIG-360 Implement and verify Hypercare Exit
MIG-361 Implement, measure, and verify Migration Progress Metrics
MIG-362 Implement and verify Capability Completion
MIG-363 Implement, measure, and verify Traffic Migration Metric
MIG-364 Implement, measure, and verify Data Migration Metric
MIG-365 Implement and verify Dependency Burn-Down
MIG-366 Implement, measure, and verify Legacy Cost Metric
MIG-367 Implement, measure, and verify Migration Defect Metric
MIG-368 Implement, control, and verify Rollback Rate
MIG-369 Create migration guardrail against Anti-Pattern — Table-by-Table Microservices
MIG-370 Create migration guardrail against Anti-Pattern — New Service Reads Legacy DB Forever
MIG-371 Create migration guardrail against Anti-Pattern — Dual Write Without Reconciliation
MIG-372 Create migration guardrail against Anti-Pattern — Shared Source of Truth
MIG-373 Create migration guardrail against Anti-Pattern — Big-Bang Cutover
MIG-374 Create migration guardrail against Anti-Pattern — Copy All History First
MIG-375 Create migration guardrail against Anti-Pattern — CDC Equals Domain Event
MIG-376 Create migration guardrail against Anti-Pattern — Legacy DTO in Core Domain
MIG-377 Create migration guardrail against Anti-Pattern — Fallback Forever
MIG-378 Create migration guardrail against Anti-Pattern — Shadow with Side Effects
MIG-379 Create migration guardrail against Anti-Pattern — Timestamp Wins Everything
MIG-380 Create migration guardrail against Anti-Pattern — Migrate In-Flight State Blindly
MIG-381 Create migration guardrail against Anti-Pattern — Delete Legacy Too Early
MIG-382 Create migration guardrail against Anti-Pattern — Keep Legacy Credentials
MIG-383 Create migration guardrail against Anti-Pattern — Permanent Migration Flags
MIG-384 Create migration guardrail against Anti-Pattern — Reconcile by Row Count Only
MIG-385 Create migration guardrail against Anti-Pattern — Manual Silent Repair
MIG-386 Create migration guardrail against Anti-Pattern — Ignore Support Workflows
MIG-387 Create migration guardrail against Anti-Pattern — Migrate and Redesign Everything
MIG-388 Create migration guardrail against Anti-Pattern — No Cutover Marker
MIG-389 Operationalize and evidence Capability Migration Checklist
MIG-390 Operationalize and evidence Data Migration Checklist
MIG-391 Operationalize and evidence Shadow Checklist
MIG-392 Operationalize and evidence Write Cutover Checklist
MIG-393 Operationalize and evidence Financial Migration Checklist
MIG-394 Operationalize and evidence Event Bridge Checklist
MIG-395 Operationalize and evidence Cutover Checklist
MIG-396 Operationalize and evidence Decommission Checklist
MIG-397 Create and standardize Migration Decision Template
MIG-398 Create and standardize Data Mapping Template
MIG-399 Create and standardize Identifier Mapping Template
MIG-400 Create and standardize Reconciliation Template
MIG-401 Write, validate, and exercise Cutover Runbook Template
MIG-402 Create and standardize Decommission Record Template
MIG-403 Define, approve, and enforce Migration Governance Standard
MIG-404 Implement and verify Minimum Viable Strangler Standard
MIG-405 Implement and verify Mature Strangler Standard
MIG-406 Define, approve, and enforce Migration Automation Principle
MIG-407 Define, approve, and enforce Migration Code Ownership
MIG-408 Implement and verify Removal Ticket
MIG-409 Implement and verify Migration Retrospective
MIG-410 Implement and verify Migration Is an Architecture Feedback Loop
MIG-411 Implement and verify PART 41 Deliverables
MIG-412 Complete migration exit gate: Define the exact business capability being migrated and its new owning service
MIG-413 Complete migration exit gate: Declare the authoritative system before, during, and after cutover for every migrated business fact
MIG-414 Complete migration exit gate: Document snapshot, delta, transformation, identifier, invalid-record, and reconciliation handling
MIG-415 Complete migration exit gate: Prove traffic can move gradually between legacy and new paths without ambiguous ownership
MIG-416 Complete migration exit gate: Prove split-brain is prevented when authoritative writes move
MIG-417 Complete migration exit gate: Define how legacy changes become canonical events, are deduplicated/replayed, and are replaced by native producers
MIG-418 Complete migration exit gate: Define how divergence is detected, classified, repaired, and proven resolved
MIG-419 Complete migration exit gate: Document what can safely roll back to legacy and what new state must remain on the new platform
MIG-420 Complete migration exit gate: Prove no API, DB consumer, batch, report, callback, or operator still depends on the legacy capability before decommission
```

---

# 15. Phase 37 Migration Policy Freeze Checklist

Before moving a capability's authoritative traffic/state, approve:

- [ ] Migration capability boundary.
- [ ] New service ownership.
- [ ] Legacy owner and migration owner.
- [ ] Migration-wave grouping.
- [ ] Capability/dependency inventory.
- [ ] Dependency-discovery method.
- [ ] Migration dependency graph.
- [ ] Migration sequencing and learning-wave policy.
- [ ] Business-calendar/change-freeze constraints.
- [ ] Migration decision record.
- [ ] Wave entry criteria.
- [ ] Wave exit criteria.
- [ ] Per-business-fact source-of-truth matrix.
- [ ] No-ambiguous-authority rule.
- [ ] Single-writer preference.
- [ ] Legacy-to-canonical ACL boundary.
- [ ] Legacy schema/model containment.
- [ ] Identifier mapping strategy.
- [ ] Status/value/money/time transformation rules.
- [ ] Legacy sentinel-value containment.
- [ ] Legacy DB access isolation.
- [ ] Read-only legacy adapter standard.
- [ ] Legacy stored-procedure adapter strategy.
- [ ] Migration data profiling.
- [ ] Invalid/dirty data handling.
- [ ] Data-quality ownership.
- [ ] Initial snapshot strategy.
- [ ] Snapshot high-water mark.
- [ ] Delta catch-up strategy.
- [ ] CDC adoption criteria.
- [ ] Polling adoption criteria.
- [ ] Batch-import criteria.
- [ ] Migration job restart/idempotency standard.
- [ ] Staging/quarantine rules.
- [ ] Source/target identifier crosswalk.
- [ ] Referential-integrity migration strategy.
- [ ] Historical-data migration scope.
- [ ] Archive-vs-migrate policy.
- [ ] Dual-read policy.
- [ ] Shadow-read safety policy.
- [ ] Canonical-result comparison rules.
- [ ] Mismatch classification and tolerance.
- [ ] Shadow comparison retention/evidence.
- [ ] Dual-write exception policy.
- [ ] Single-writer cutover model.
- [ ] Idempotency and external-reference requirements.
- [ ] Write fencing and split-brain prevention.
- [ ] Final-delta/write-cutover procedure.
- [ ] In-flight transaction ownership rule.
- [ ] Cutover marker/watermark.
- [ ] Rollback window and cutover abort criteria.
- [ ] Read-routing strategy.
- [ ] Progressive traffic/canary strategy.
- [ ] Legacy fallback path.
- [ ] Fallback removal criteria.
- [ ] Event bridge ownership.
- [ ] Canonical event schema.
- [ ] CDC-vs-domain-event boundary.
- [ ] Event deduplication and replay behavior.
- [ ] Producer authority transition.
- [ ] Consumer compatibility during coexistence.
- [ ] Kafka topic/schema migration plan.
- [ ] Financial migration stable-reference rules.
- [ ] Payment UNKNOWN handling during migration.
- [ ] Wallet ledger/balance reconciliation.
- [ ] Inventory quantity/reservation reconciliation.
- [ ] Promotion/coupon usage reconciliation.
- [ ] Loyalty/reward reconciliation.
- [ ] Mission/progress/reward reconciliation.
- [ ] Notification migration behavior.
- [ ] Customer/catalog migration approach.
- [ ] Partner/integration cutover strategy.
- [ ] Store/mobile/admin/reporting compatibility.
- [ ] Continuous reconciliation standard.
- [ ] Reconciliation key/tolerance/frequency.
- [ ] Mismatch queue and repair process.
- [ ] Manual-repair audit.
- [ ] Cutover runbook.
- [ ] Rollback runbook.
- [ ] Hypercare duration/ownership.
- [ ] Legacy compatibility-sync duration.
- [ ] Legacy dependency retirement criteria.
- [ ] Legacy read/write disablement.
- [ ] Legacy credential revocation.
- [ ] Legacy route/ACL removal.
- [ ] Legacy batch/job/report retirement.
- [ ] Legacy data archive/retention.
- [ ] Legacy runtime/infrastructure decommission.
- [ ] Decommission evidence record.
- [ ] Migration metrics and dashboards.
- [ ] Mismatch/lag/cutover/rollback alerts.
- [ ] Migration code testing/security/observability.
- [ ] Migration automation boundaries.
- [ ] Removal ticket at compatibility-code introduction.
- [ ] Migration retrospective.
- [ ] Architecture-feedback loop.
- [ ] Monitoring/Incident Response handoff.

---

# 16. Phase 37 Exit Criteria

A capability is fully migrated only when the team can answer with production evidence:

```text
BOUNDARY
What exact business capability migrated,
and which new service owns it?

AUTHORITY
Which system was authoritative before,
during, and after cutover
for every migrated business fact?

DATA
How were snapshot, delta, transformation,
identifiers, invalid records,
and reconciliation handled?

ROUTING
How did traffic move gradually
between legacy and new implementation
without ambiguous ownership?

WRITES
How was split-brain prevented
when authoritative writes moved?

EVENTS
How were legacy changes translated to canonical events,
deduplicated, replayed,
and eventually replaced by native producers?

RECONCILIATION
How was divergence detected,
classified, repaired,
and proven resolved?

ROLLBACK
If cutover failed,
what could return safely to legacy
and what new state had to remain with the new platform?

DECOMMISSION
How was it proven that no API,
DB consumer,
batch job,
report,
callback,
or operator
still depended on the legacy capability?
```

---

# 17. Migration Wave Completion Criteria

A migration wave ends only when:

```text
target owns traffic/state
mismatches are resolved
legacy write path is disabled
dependency scan is clean
decommission is approved
```

A capability is **not** considered fully migrated while production still relies on its legacy write/read path.

---

# 18. Migration Evidence Package

Retain at minimum:

```text
capability
legacy owner
new owner
migration owner
source-of-truth before/during/after
legacy entry points
canonical contract
ACL mappings
dependency graph
data profile
migration transformation version
snapshot watermark
delta/catch-up evidence
identifier crosswalk
invalid/quarantine records
shadow comparison results
mismatch/reconciliation results
traffic stages
write cutover marker
event bridge state
rollback window
rollback decision
hypercare results
legacy dependency scan
credential/route removal evidence
decommission approval
retrospective
```

---

# 19. Migration Governance Rejections

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

Migration compatibility code is temporary production code and still requires:

```text
owner
tests
security
observability
review
```

Create its removal/decommission ticket when that compatibility code is introduced.

---

# 20. Phase 37 Completion Tree

```text
PHASE 37 — STRANGLER MIGRATION

├── Strangler Principles                         ✅
├── Capability-Based Migration                   ✅
├── No Big-Bang Rewrite                          ✅
├── Boundary / Ownership                         ✅
├── Migration Owner                              ✅
├── Migration Waves                              ✅
├── Capability Inventory                         ✅
├── Dependency Discovery                         ✅
├── Dependency Graph                             ✅
├── Learning Wave                                ✅
├── Business Sequencing                          ✅
├── Entry / Exit Criteria                        ✅
├── Source-of-Truth Matrix                       ✅
├── No Ambiguous Authority                       ✅
├── Single-Writer Preference                     ✅
├── Integration / ACL Boundary                   ✅
├── Legacy Model Containment                     ✅
├── Identifier / Status Mapping                  ✅
├── Sentinel / Money / Time Mapping              ✅
├── Legacy DB / Stored Procedure Adapters        ✅
├── Data Profiling                               ✅
├── Data Quality / Quarantine                    ✅
├── Snapshot / High-Water Mark                   ✅
├── Delta Catch-Up                               ✅
├── CDC / Polling / Batch                        ✅
├── Restart-Safe Migration Jobs                  ✅
├── Crosswalk / Referential Integrity            ✅
├── Historical Data / Archive                    ✅
├── Dual Read                                    ✅
├── Shadow Read / Comparison                     ✅
├── Canonical Result Comparison                  ✅
├── Mismatch Classification                      ✅
├── Dual Write Risk                              ✅
├── Idempotency / Stable References              ✅
├── Write Fencing                                ✅
├── Final Delta / Write Cutover                  ✅
├── In-Flight Transaction Ownership              ✅
├── Routing / Canary                             ✅
├── Legacy Fallback                              ✅
├── Event Bridge                                 ✅
├── CDC vs Domain Events                         ✅
├── Event Dedup / Replay                         ✅
├── Producer Ownership Transition                ✅
├── Financial Migration                          ✅
├── Payment UNKNOWN Handling                     ✅
├── Wallet Reconciliation                        ✅
├── Inventory Reconciliation                     ✅
├── Promotion / Coupon Reconciliation            ✅
├── Loyalty / Reward Reconciliation              ✅
├── Mission / Progress Reconciliation            ✅
├── Customer / Catalog Migration                 ✅
├── Notification Migration                       ✅
├── Partner / Integration Cutover                ✅
├── Store / Mobile / Admin / Reports             ✅
├── Continuous Reconciliation                    ✅
├── Mismatch Repair                              ✅
├── Cutover Runbook                              ✅
├── Rollback Runbook                             ✅
├── Hypercare                                    ✅
├── Compatibility Sync                           ✅
├── Legacy Dependency Retirement                 ✅
├── Disable Legacy Reads / Writes                ✅
├── Revoke Credentials / Routes                  ✅
├── Archive / Retention                          ✅
├── Runtime / Data-Path Decommission             ✅
├── Migration Metrics / Alerts                   ✅
├── Migration Testing / Security                 ✅
├── Migration Automation                         ✅
├── Removal Ticket                               ✅
├── Migration Retrospective                      ✅
├── Architecture Feedback Loop                   ✅
└── Monitoring / Incident Response Handoff       ✅
```

---

# 21. Handoff to Phase 38

The next official implementation phase is:

```text
PHASE 38 — Monitoring / Incident Response
```

based on:

```text
PART 42 — Monitoring / Incident Response
```

Phase 38 will define:

```text
production monitoring operations
alert routing
incident severity
on-call
triage
incident declaration
Incident Commander
technical / communications roles
diagnosis
mitigation
migration-coexistence incidents
financial safety
escalation
customer/business communication
recovery
incident metrics
```

The transition is:

```text
PHASE 37
=
progressively move business ownership
from legacy to new services

        ↓

PHASE 38
=
continuously detect and respond
when production behavior becomes unhealthy
during and after that transition
```

---

# 22. Final Phase 37 Principle

```text
Discover
  ↓
Bound
  ↓
Translate
  ↓
Copy
  ↓
Catch Up
  ↓
Shadow
  ↓
Reconcile
  ↓
Canary
  ↓
Cut Over
  ↓
Hypercare
  ↓
Remove Legacy Dependency
  ↓
Decommission
```

The most important rules are:

```text
Migrate business capabilities, not tables.
Make ownership clear before migration.
Every business fact has one declared source of truth.
Keep legacy translation inside the ACL.
Prefer one authoritative writer.
Treat dual write as a distributed consistency problem.
Shadow traffic must not create customer-visible side effects.
Compare canonical business outcomes, not legacy formatting.
Use snapshot + high-water mark + delta catch-up.
Make migration jobs restart-safe and idempotent.
Move writes only after reconciliation and rollback are proven.
Keep in-flight transactions with the system that owns them where appropriate.
Financial state requires stable references and reconciliation.
Deduplicate event bridges and define producer authority.
Keep every fallback path time-bounded with removal criteria.
Continuously reconcile until convergence is proven.
Do not call the capability migrated while legacy production dependency remains.
Decommission APIs, DB consumers, jobs, reports, callbacks, credentials, and routes—not just servers.
```

**End of PHASE 37 — Strangler Migration**
