---
title: "PART 07 — DATA ARCHITECTURE"
---

# PART 07 — DATA ARCHITECTURE

> **Document Role:** Defines the data architecture, relational database standards, ownership rules, persistence patterns, lifecycle rules, and data-governance requirements for the microservices platform.  
> **Previous Part:** PART 06 — Security Architecture  
> **Next Part:** PART 08 — Auth / Identity Service  
> **Status:** Architecture / Data Standard  
> **Primary Stack:** PostgreSQL, Flyway, Redis where appropriate  
> **Audience:** Backend engineers, database engineers, software architects, technical leads, data engineers, QA engineers, DevOps engineers, SREs.

---

# 569 — Purpose

The data architecture defines:

```text
Who owns data?
Where is authoritative state stored?
How are schemas designed?
How are tables named?
How are identifiers generated?
How are constraints enforced?
How are transactions handled?
How are concurrent updates controlled?
How are changes migrated?
How is history preserved?
How is reporting supported?
How is data retained, archived, or deleted?
```

The primary goal is:

```text
Correct business data
        ↓
Clear ownership
        ↓
Strong integrity
        ↓
Safe evolution
        ↓
Operational reliability
```

---

# 570 — Core Data Principles

The platform follows these principles:

1. Database ownership follows service ownership.
2. Each service owns its authoritative data.
3. Services must not directly modify another service's database.
4. Business invariants should be protected at multiple levels.
5. Important data should be constrained by the database where possible.
6. Schema changes must be versioned.
7. Production tables must not be modified manually without a migration process.
8. Financial and audit data require strong traceability.
9. Read models may differ from write models.
10. Reporting should not create hidden service coupling.
11. Data retention must be explicit.
12. Data lifecycle rules must be documented.

---

# 571 — Database-per-Service

Target logical architecture:

```text
identity-service
      ↓
identity_db

catalog-service
      ↓
catalog_db

order-service
      ↓
order_db

payment-service
      ↓
payment_db

wallet-service
      ↓
wallet_db

loyalty-service
      ↓
loyalty_db
```

This does not require a physically separate PostgreSQL server for every service.

A practical first production deployment may use:

```text
One PostgreSQL Cluster
        │
        ├── identity_db
        ├── catalog_db
        ├── order_db
        ├── payment_db
        ├── wallet_db
        └── loyalty_db
```

Ownership remains separate.

---

# 572 — Logical vs Physical Isolation

There are several deployment options.

## Option A — Separate Databases

```text
postgres-cluster
│
├── identity_db
├── order_db
├── payment_db
└── wallet_db
```

Advantages:

```text
Clear ownership
Permission isolation
Independent migration history
Reduced accidental joins
```

---

## Option B — Separate Schemas

Example:

```text
platform_db
│
├── identity.*
├── ordering.*
├── payment.*
├── wallet.*
└── loyalty.*
```

This may be acceptable during early migration.

However, permissions must still enforce ownership.

---

## Option C — Separate Clusters

Useful when:

```text
Very high scale
Very high security
Different regional requirements
Different availability targets
Independent operational ownership
```

Do not start with separate clusters unless needed.

---

# 573 — Database Ownership Rule

The owning service controls:

```text
Schema
Tables
Constraints
Indexes
Migrations
Data mutation
Data lifecycle
```

Other services may not:

```text
INSERT
UPDATE
DELETE
```

directly.

---

# 574 — Cross-Service Database Access

Forbidden:

```text
order-service
    ↓
SELECT * FROM wallet.wallet_ledger
```

Even read-only access creates hidden coupling.

Preferred:

```text
order-service
    ↓ API / gRPC
wallet-service
```

or:

```text
wallet event
    ↓
local projection
```

---

# 575 — Reporting Exception

Reporting should not directly become business-service coupling.

Recommended:

```text
Service Events
      ↓
Reporting Pipeline
      ↓
Reporting Database
      ↓
BI / Admin Dashboard
```

Alternative:

```text
CDC
  ↓
Analytics Store
```

Direct production joins across service databases should be treated as an exception.

---

# 576 — Source of Truth

Every business fact must have one source of truth.

Examples:

```text
Order status          → order-service
Payment status        → payment-service
Wallet balance        → wallet-service
Points balance        → loyalty-service
Mission progress      → mission-service
Product definition    → catalog-service
```

Other systems may hold:

```text
cache
projection
snapshot
replica
```

but are not authoritative.

---

# 577 — PostgreSQL Standard

PostgreSQL is the primary relational database.

Use it for:

```text
Transactional business data
Strong consistency
Relational constraints
Financial ledgers
Operational state
Audit/history
```

Do not use Redis as the only permanent source for critical business data.

---

# 578 — Database Naming

Recommended:

```text
identity_db
catalog_db
order_db
payment_db
wallet_db
loyalty_db
```

If using schemas:

```text
identity
catalog
ordering
payment
wallet
loyalty
```

Names should be:

```text
lowercase
snake_case
descriptive
stable
```

---

# 579 — Table Naming

Use plural or singular consistently.

Recommended standard:

```text
plural snake_case
```

Examples:

```text
orders
order_items
wallet_accounts
wallet_ledger_entries
mission_progress
payment_refunds
```

Avoid:

```text
tblOrder
T_ORDER
orderMaster
Order_Details
```

unless integrating with legacy systems.

---

# 580 — Column Naming

Recommended:

```text
snake_case
```

Examples:

```text
order_id
customer_id
created_at
updated_at
currency
status
```

Avoid mixed conventions.

---

# 581 — Primary Key Strategy

Primary keys must be:

```text
Stable
Unique
Immutable
Generated by owner
```

Possible choices:

```text
UUID
UUIDv7
ULID
Snowflake-style ID
BIGINT sequence
```

The organization should standardize.

---

# 582 — Public ID vs Internal ID

A service may use:

```text
internal database ID
```

and separate:

```text
public business ID
```

Example:

```text
id = UUID
order_number = ORD-20261011-0001
```

Do not use display numbers as database identity unless intentionally designed.

---

# 583 — UUID Guidance

UUIDs are useful for distributed systems.

Advantages:

```text
No central sequence dependency
Safe generation before insert
Harder to enumerate
Good cross-service reference
```

Consider ordered UUID variants where index locality matters.

---

# 584 — Business Identifiers

Examples:

```text
order_number
payment_reference
wallet_reference
coupon_code
member_number
```

Business identifiers must have:

```text
generation owner
uniqueness scope
format
length
case-sensitivity
```

---

# 585 — Foreign Keys Inside a Service

Foreign keys are recommended within one service database when they protect integrity.

Example:

```text
orders
  ↓
order_items
```

Use:

```sql
FOREIGN KEY (order_id)
REFERENCES orders(id)
```

where appropriate.

---

# 586 — No Cross-Service Foreign Keys

Do not create:

```sql
FOREIGN KEY (wallet_id)
REFERENCES wallet_db.wallet_accounts(id)
```

from another service database.

Cross-service references are logical IDs only.

---

# 587 — Unique Constraints

Use unique constraints to protect business invariants.

Examples:

```text
idempotency_key
provider_reference
order_number
coupon_code
(event_id, consumer_name)
(user_id, mission_id, cycle_id)
```

Database uniqueness is a final protection layer.

---

# 588 — Check Constraints

Use `CHECK` constraints when useful.

Example:

```sql
CHECK (quantity > 0)
```

```sql
CHECK (amount >= 0)
```

```sql
CHECK (status IN ('PENDING','DONE','CANCELLED'))
```

Do not rely only on application validation for simple invariants.

---

# 589 — NOT NULL

Use `NOT NULL` for required fields.

Avoid nullable columns by default if the business requires a value.

Example:

```text
order_id
customer_id
status
created_at
```

should generally not be nullable.

---

# 590 — Default Values

Use defaults carefully.

Good:

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Potentially dangerous:

```sql
currency VARCHAR(3) DEFAULT 'USD'
```

if missing currency should be rejected instead.

Critical business values should not silently default unless the contract specifies it.

---

# 591 — Timestamp Standard

Use:

```text
TIMESTAMPTZ
```

for real-world timestamps.

Examples:

```text
created_at
updated_at
occurred_at
completed_at
expires_at
```

Store technical timestamps in UTC.

---

# 592 — Date-Only Values

Use `DATE` only when time is not meaningful.

Examples:

```text
birthday
business_date
campaign_start_date if truly date-only
```

Do not use date-only fields for precise event times.

---

# 593 — Money Storage

Recommended approaches:

```text
NUMERIC(p,s)
```

or:

```text
integer minor units
```

Example:

```sql
amount NUMERIC(19,4)
currency CHAR(3)
```

or:

```sql
amount_minor BIGINT
currency CHAR(3)
```

Choose one standard per domain.

---

# 594 — Floating Point Restriction

Do not store authoritative financial values using:

```text
REAL
FLOAT
DOUBLE PRECISION
```

unless there is a specific non-financial use case.

Use exact numeric representation.

---

# 595 — Currency Storage

Always store currency when amount is not globally fixed.

Example:

```text
amount = 12.50
currency = USD
```

Do not infer currency from environment unless explicitly guaranteed by the domain.

---

# 596 — Boolean Standard

Use native Boolean types.

Example:

```sql
is_refunded BOOLEAN NOT NULL DEFAULT FALSE
```

Avoid legacy styles:

```text
Y/N
0/1 strings
```

unless required by integration.

---

# 597 — Enum Storage

Options:

```text
VARCHAR + CHECK
PostgreSQL ENUM
Reference table
```

Recommended default for frequently evolving service statuses:

```text
VARCHAR + CHECK
```

because schema evolution may be simpler.

---

# 598 — JSONB Guidance

Use `JSONB` when the structure is:

```text
semi-structured
provider-specific
optional metadata
rarely queried in relational form
```

Do not use JSONB to avoid proper relational modeling.

Bad:

```text
entire order stored as one JSONB blob
```

without a clear reason.

---

# 599 — JSONB Indexing

If querying JSONB fields frequently:

```text
GIN index
expression index
```

may be appropriate.

Index only real query patterns.

---

# 600 — Array Guidance

PostgreSQL arrays may be useful for:

```text
small immutable/simple value collections
```

but are not a replacement for normalized relational structures.

---

# 601 — Normalization

Transactional schemas should generally be normalized enough to:

```text
reduce duplication
protect integrity
avoid update anomalies
```

Do not over-normalize at the cost of unusable queries.

---

# 602 — Denormalization

Denormalization is acceptable for:

```text
Read models
Reporting
Performance-critical projections
Historical snapshots
```

Example:

```text
order item snapshot stores product_name_at_purchase
```

This is intentional historical denormalization.

---

# 603 — Historical Snapshots

Orders should preserve historical facts.

Example:

```text
product_id
product_name_snapshot
unit_price_snapshot
tax_snapshot
discount_snapshot
```

Do not always query current Catalog data to reconstruct an old order.

---

# 604 — Snapshot Principle

When a fact must remain historically correct:

```text
copy the required value at transaction time
```

Examples:

```text
Product name
Price
Tax rate
Promotion value
Delivery address
Store name if required for receipts
```

---

# 605 — Audit Fields

Common fields:

```text
created_at
created_by
updated_at
updated_by
```

Use only where meaningful.

Financial ledgers often use immutable rows rather than `updated_at`.

---

# 606 — Soft Delete

Soft delete may use:

```text
deleted_at
deleted_by
```

Use only when the business needs:

```text
recovery
audit
historical visibility
```

Do not apply soft delete automatically to every table.

---

# 607 — Hard Delete

Hard delete is appropriate when:

```text
data no longer required
privacy policy requires deletion
record has no legal/audit retention need
```

Deletion rules must be domain-specific.

---

# 608 — Immutable Tables

Good candidates:

```text
wallet ledger
points ledger
audit log
processed_event
outbox history after publication
financial reconciliation results
```

Prefer append-only behavior.

---

# 609 — Ledger Design Principle

A ledger records movements rather than only final balance.

Example:

```text
Wallet Ledger

+20.00 TOP_UP
-5.00 CAPTURE
+5.00 REFUND
```

Balance can be derived or maintained consistently.

---

# 610 — Wallet Ledger Example

Possible structure:

```text
wallet_ledger_entries
---------------------
id
wallet_id
entry_type
amount
currency
reference_type
reference_id
idempotency_key
occurred_at
created_at
```

---

# 611 — Ledger Immutability

Do not edit historical financial movement.

Wrong:

```sql
UPDATE wallet_ledger
SET amount = 20
WHERE id = ...
```

Correct:

```text
Create reversal/correction entry
```

---

# 612 — Points Ledger Example

Possible fields:

```text
points_ledger_entries
---------------------
id
account_id
entry_type
points
reference_type
reference_id
expires_at
occurred_at
```

Types:

```text
EARN
REDEEM
EXPIRE
ADJUST
REVERSAL
```

---

# 613 — Balance Table

A balance table may exist for performance.

Example:

```text
wallet_accounts
---------------
wallet_id
available_balance
reserved_balance
version
updated_at
```

The ledger remains the financial history.

---

# 614 — Balance Consistency

If maintaining both:

```text
ledger
balance
```

updates must occur in one local transaction where applicable.

Example:

```text
INSERT ledger
UPDATE balance
COMMIT
```

---

# 615 — Transaction Principles

Use transactions to protect local consistency.

A transaction should cover:

```text
one service
one owned database
one consistency boundary
```

Avoid distributed database transactions across services.

---

# 616 — Transaction Example: Create Order

```text
BEGIN

Check idempotency
Insert order
Insert order items
Insert outbox event
Store idempotency result

COMMIT
```

---

# 617 — Transaction Example: Wallet Reservation

```text
BEGIN

Lock / version-check wallet
Validate available balance
Create reservation
Update balance
Insert ledger/reservation record if design requires
Insert outbox event

COMMIT
```

---

# 618 — Transaction Isolation

Common PostgreSQL levels:

```text
READ COMMITTED
REPEATABLE READ
SERIALIZABLE
```

Use the weakest isolation level that still preserves correctness.

Default may be:

```text
READ COMMITTED
```

but high-contention financial operations may require stronger patterns.

---

# 619 — Lost Update Problem

Example:

```text
Balance = 100

Request A reads 100
Request B reads 100

A subtracts 30 → writes 70
B subtracts 50 → writes 50

Correct result should be 20
```

Prevent using:

```text
Optimistic locking
Pessimistic locking
Atomic update
Serializable transaction
```

depending on use case.

---

# 620 — Optimistic Locking

Typical field:

```text
version
```

Example:

```sql
UPDATE wallet_accounts
SET available_balance = ?,
    version = version + 1
WHERE wallet_id = ?
  AND version = ?
```

If affected rows:

```text
0
```

a conflict occurred.

---

# 621 — Pessimistic Locking

Example:

```sql
SELECT *
FROM wallet_accounts
WHERE wallet_id = ?
FOR UPDATE;
```

Useful for high-value operations where serialized access is required.

Use carefully to avoid:

```text
deadlocks
long waits
reduced throughput
```

---

# 622 — Atomic Update

Example:

```sql
UPDATE wallet_accounts
SET available_balance = available_balance - :amount
WHERE wallet_id = :wallet_id
  AND available_balance >= :amount;
```

Then inspect affected row count.

This can be powerful for balance protection.

---

# 623 — Concurrency Strategy Matrix

| Use Case | Candidate Strategy |
|---|---|
| Wallet reserve | Atomic update / row lock |
| Points redeem | Atomic update / optimistic lock |
| Inventory reserve | Atomic decrement / lock |
| Coupon usage | Unique constraint / atomic counter |
| Mission completion | Unique constraint |
| Idempotency | Unique constraint |
| Order status change | Optimistic lock |

Exact implementation must be tested under load.

---

# 624 — Deadlock Handling

Deadlocks can occur.

Rules:

```text
Keep transactions short
Lock rows in consistent order
Avoid unnecessary locks
Detect deadlock errors
Retry safe transactions carefully
```

---

# 625 — Transaction Duration

Do not keep DB transactions open during slow network calls where avoidable.

Bad:

```text
BEGIN
  ↓
Call payment provider 8 seconds
  ↓
UPDATE DB
COMMIT
```

This consumes:

```text
connection
locks
transaction resources
```

---

# 626 — Idempotency Table

Possible structure:

```text
idempotency_records
-------------------
id
idempotency_key
operation
request_hash
status
response_code
response_body
created_at
expires_at
```

Unique:

```text
(operation, idempotency_key)
```

or another documented scope.

---

# 627 — Request Hash

Request hash protects against:

```text
same key
different payload
```

Example:

```text
SHA-256(canonical request)
```

Same key + different hash:

```text
reject
```

---

# 628 — Outbox Table

Possible schema:

```text
outbox_events
-------------
id
aggregate_type
aggregate_id
event_type
event_version
payload
correlation_id
created_at
published_at
status
attempt_count
```

---

# 629 — Outbox Indexes

Useful indexes:

```text
(status, created_at)
aggregate_id
published_at
```

depending on publisher query.

Avoid excessive indexes on high-write tables.

---

# 630 — Inbox / Processed Event Table

Example:

```text
processed_events
----------------
event_id
consumer_name
processed_at

PRIMARY KEY (event_id, consumer_name)
```

This protects consumer idempotency.

---

# 631 — Flyway Standard

All schema changes use Flyway.

Location:

```text
src/main/resources/db/migration/
```

Example:

```text
V1__create_orders.sql
V2__create_order_items.sql
V3__add_order_status_index.sql
V4__create_outbox.sql
```

---

# 632 — Migration Naming

Recommended:

```text
V<version>__<description>.sql
```

Examples:

```text
V1__create_wallet_accounts.sql
V2__create_wallet_ledger.sql
V3__add_wallet_version.sql
```

Use clear descriptions.

---

# 633 — Migration Immutability

Once a migration has been applied to shared environments:

```text
do not edit it
```

Create a new migration.

Wrong:

```text
edit V3 already deployed
```

Correct:

```text
V4__fix_wallet_constraint.sql
```

---

# 634 — Repeatable Migrations

Flyway repeatable migrations may be useful for:

```text
Views
Functions
Reference-data scripts
```

Use carefully.

Critical transactional schema should generally use versioned migrations.

---

# 635 — Migration Backward Compatibility

Prefer expand-and-contract.

Example:

```text
1. Add new column
2. Deploy code supporting old + new
3. Backfill data
4. Deploy code using new
5. Remove old later
```

This supports rolling deployments.

---

# 636 — Dangerous Migration Pattern

Avoid:

```text
DROP COLUMN
```

at the same time new code is deployed if old pods may still use it.

---

# 637 — Large Table Migration

For large tables:

```text
Avoid long exclusive locks
Create indexes concurrently where supported
Backfill in batches
Monitor replication lag
Test on production-like volume
```

---

# 638 — Index Design Principles

Index based on query patterns.

Review:

```text
WHERE
JOIN
ORDER BY
UNIQUE
foreign keys
```

Do not index every column.

---

# 639 — Composite Index

Column order matters.

Example query:

```sql
WHERE customer_id = ?
ORDER BY created_at DESC
```

Potential index:

```sql
CREATE INDEX idx_orders_customer_created
ON orders(customer_id, created_at DESC);
```

---

# 640 — Partial Index

Useful when queries target a subset.

Example:

```sql
CREATE INDEX idx_orders_pending
ON orders(created_at)
WHERE status = 'PENDING';
```

---

# 641 — Unique Index

May enforce:

```text
business reference
active record uniqueness
idempotency
```

Example:

```sql
CREATE UNIQUE INDEX uq_payment_provider_ref
ON payments(provider, provider_reference);
```

---

# 642 — Covering Index

Use `INCLUDE` where helpful.

Example:

```sql
CREATE INDEX idx_orders_customer
ON orders(customer_id, created_at DESC)
INCLUDE (status, total_amount);
```

Only after query evidence.

---

# 643 — Index Cost

Every index increases:

```text
storage
insert cost
update cost
maintenance
vacuum work
```

Index only justified queries.

---

# 644 — Query Analysis

Use:

```sql
EXPLAIN
EXPLAIN ANALYZE
```

Review:

```text
Seq Scan
Index Scan
Rows
Cost
Actual time
Buffers
```

---

# 645 — Slow Query Logging

Production should capture slow queries.

Review:

```text
latency
frequency
rows scanned
lock waits
execution plan
```

---

# 646 — N+1 Query Problem

Example:

```text
Load 100 orders
then query items 100 times
```

Avoid with:

```text
batch loading
join fetch where appropriate
projection
query redesign
```

---

# 647 — Pagination Query Design

Offset pagination:

```sql
LIMIT 25 OFFSET 100000
```

may become slow.

For large datasets prefer keyset/cursor pagination.

Example:

```sql
WHERE created_at < :cursor_created_at
ORDER BY created_at DESC
LIMIT 25
```

---

# 648 — Stable Pagination

Cursor pagination needs deterministic order.

Example:

```text
ORDER BY created_at DESC, id DESC
```

Cursor should include both if necessary.

---

# 649 — Read Models

Read models may be separate from write aggregates.

Examples:

```text
Order history
Admin order list
Customer dashboard
Mission dashboard
Wallet statement
```

They may be optimized for query performance.

---

# 650 — Projection Tables

Example:

```text
order_history_view
------------------
order_id
order_number
customer_id
store_name
status
total
created_at
```

This may be maintained by:

```text
same-service transaction
event projection
CDC
```

depending on use case.

---

# 651 — CQRS Data Model

CQRS may use:

```text
Write Model
    ↓ events
Read Projection
    ↓
Query API
```

Use only when needed.

Do not introduce unnecessary operational complexity.

---

# 652 — Materialized Views

PostgreSQL materialized views may help:

```text
reporting
aggregates
expensive joins
```

They require refresh strategy.

Do not use them for highly time-sensitive authoritative data unless refresh semantics are acceptable.

---

# 653 — Database Views

Views can simplify query access within one owned database.

Use carefully.

Do not expose a view as a backdoor for another service to read the database directly.

---

# 654 — Reporting Architecture

Recommended:

```text
Operational Services
        ↓
Events / CDC
        ↓
Reporting Store
        ↓
BI / Dashboard
```

Benefits:

```text
No cross-service transactional joins
Reduced load on production DB
Historical analysis
Independent schema
```

---

# 655 — Change Data Capture

CDC may be useful for:

```text
analytics
reporting
search indexing
migration
```

Possible tools:

```text
Debezium
Managed CDC services
```

CDC is not a replacement for domain events when business semantics matter.

---

# 656 — Domain Event vs CDC

Domain event:

```text
OrderCompleted
```

expresses business meaning.

CDC event:

```text
orders.status changed
```

expresses database change.

Use domain events for business workflows.

Use CDC primarily for data movement/integration where appropriate.

---

# 657 — Reference Data

Examples:

```text
currency codes
country codes
status lookup metadata
reason codes
```

Reference data ownership must still be explicit.

Small stable standards may be shared through libraries/configuration.

Business reference data should have an owner.

---

# 658 — Seed Data

Seed scripts may populate:

```text
default roles
test data
reference data
```

Production seed data must be version-controlled.

Avoid manual setup steps that cannot be reproduced.

---

# 659 — Environment Data Separation

Separate:

```text
LOCAL
DEV
UAT
PROD
```

databases.

Never point DEV application to production database.

---

# 660 — Production Data Copies

If production data must be copied to non-production:

```text
Mask
Anonymize
Tokenize
Minimize
```

Sensitive values should not remain raw.

---

# 661 — Data Masking

Examples:

```text
phone_number
email
member_card
customer_name
address
```

Masking method must preserve enough shape for testing without exposing real PII.

---

# 662 — Data Retention

Every important table should have a retention classification.

Examples:

```text
Operational
Long-term
Legal/audit
Temporary
Ephemeral
```

---

# 663 — Retention Matrix

Example:

| Data | Example Retention |
|---|---|
| Access token cache | Minutes/hours |
| Idempotency record | Days/weeks |
| Order history | Business/legal policy |
| Payment records | Financial policy |
| Wallet ledger | Long-term financial record |
| Security audit | Security/compliance policy |
| Temporary notification retry | Short-term |
| Analytics raw events | Defined analytics policy |

Exact durations must be approved separately.

---

# 664 — Expiry Columns

Where data expires, use explicit fields:

```text
expires_at
retention_until
deleted_at
```

Do not infer expiry only from creation date if rules can change.

---

# 665 — Cleanup Jobs

Temporary data should be cleaned automatically.

Examples:

```text
expired idempotency records
old OTP attempts
expired sessions
temporary cache metadata
processed-event records after retention
```

Cleanup must not delete required audit/financial data.

---

# 666 — Partitioning

Partition large tables when evidence justifies it.

Candidates:

```text
audit logs
event logs
wallet ledger
points ledger
notification history
```

Possible partition keys:

```text
created_at
business_date
tenant_id
```

---

# 667 — Time-Based Partitioning

Example:

```text
wallet_ledger_2026_10
wallet_ledger_2026_11
```

Use only if operational benefits outweigh complexity.

---

# 668 — Partition Maintenance

Define:

```text
partition creation
partition retention
index creation
archive process
monitoring
```

Automation is preferred.

---

# 669 — Archiving

Old operational data may move to:

```text
archive database
object storage
data warehouse
```

Archived data must remain:

```text
searchable if required
protected
auditable
restorable
```

---

# 670 — Data Lifecycle

General lifecycle:

```text
Create
  ↓
Active
  ↓
Historical
  ↓
Archived
  ↓
Deleted / Retained permanently
```

Each domain defines its rules.

---

# 671 — Order Data Lifecycle

Example:

```text
PENDING
  ↓
ACTIVE
  ↓
DONE/CANCELLED
  ↓
Historical
  ↓
Archive after policy threshold
```

Orders may still need long-term retention for:

```text
customer support
finance
analytics
legal requirements
```

---

# 672 — Wallet Data Lifecycle

Wallet ledger should generally be preserved as financial history.

Do not delete individual ledger entries simply because the user account is inactive.

Privacy handling may require:

```text
anonymization of associated PII
```

while retaining financial integrity.

---

# 673 — Payment Data Lifecycle

Payment records may require:

```text
long retention
provider reconciliation
refund history
audit trail
```

Do not store unnecessary sensitive payment credentials.

---

# 674 — Loyalty Data Lifecycle

Points transactions may remain for:

```text
balance reconstruction
customer support
fraud analysis
expiry calculation
```

Mission progress may have shorter retention depending on business need.

---

# 675 — Data Deletion Workflow

Possible process:

```text
Deletion request
      ↓
Validate eligibility
      ↓
Check retention exceptions
      ↓
Delete/anonymize authoritative data
      ↓
Propagate to projections
      ↓
Audit completion
```

---

# 676 — Anonymization

For retained historical records, anonymize PII when possible.

Example:

```text
customer_id → irreversible surrogate
name → removed
phone → removed
address → removed
```

Financial totals may remain if legally/operationally required.

---

# 677 — Data Lineage

For important reporting data, document:

```text
source service
source event/table
transformation
destination
refresh frequency
owner
```

This improves trust and debugging.

---

# 678 — Data Quality

Track:

```text
missing values
duplicate records
invalid references
stale projections
reconciliation mismatch
unexpected status combinations
```

Critical domains should have automated checks.

---

# 679 — Reconciliation

Reconciliation compares independent records.

Examples:

```text
Wallet ledger vs balance
Payment provider vs payment DB
Top-up provider vs wallet DB
Order completed vs payment captured
Points ledger vs points balance
```

---

# 680 — Wallet Reconciliation

Example:

```text
SUM(wallet ledger)
      ↓
Expected balance
      ↓ compare
wallet_accounts balance
```

Any mismatch should generate:

```text
reconciliation exception
```

not silently fix data.

---

# 681 — Payment Reconciliation

Example:

```text
Payment Provider
      ↓
Provider settlement/report
      ↓
Compare payment records
      ↓
Detect:
missing
duplicate
amount mismatch
status mismatch
```

---

# 682 — Reconciliation Table

Possible structure:

```text
reconciliation_runs
-------------------
id
type
started_at
completed_at
status
records_checked
mismatch_count
```

Mismatch detail:

```text
reconciliation_mismatches
```

---

# 683 — Data Repair

Data repair should be controlled.

Requirements:

```text
Document reason
Identify affected rows
Backup/snapshot if necessary
Use migration or approved script
Audit actor
Verify result
```

Do not execute ad-hoc updates casually in production.

---

# 684 — Production SQL Change Control

Manual production SQL should require:

```text
ticket/change record
review
backup/rollback plan
authorized operator
validation query
audit
```

Critical systems may require dual approval.

---

# 685 — Audit Table Pattern

Example:

```text
order_status_history
--------------------
id
order_id
old_status
new_status
changed_by
reason
changed_at
correlation_id
```

This is business history, not merely technical logging.

---

# 686 — Temporal History

For entities requiring state history, use:

```text
history table
event log
effective_from/effective_to
```

depending on domain.

---

# 687 — Effective Dating

Useful for configuration:

```text
price rules
tier rules
campaign rules
promotion rules
```

Example:

```text
valid_from
valid_to
```

Avoid overwriting historical configuration if old transactions must remain explainable.

---

# 688 — Configuration Versioning

Business configuration should be versioned where changes affect outcomes.

Examples:

```text
mission rule version
promotion version
points rule version
reward distribution version
```

Transactions may store the applied version.

---

# 689 — Event Time vs Processing Time

Store both when needed.

Example:

```text
occurred_at
processed_at
```

This matters for:

```text
Kafka delays
late events
mission windows
analytics
```

---

# 690 — Timezone Semantics

Technical timestamps:

```text
UTC
```

Business calendar logic may require:

```text
Asia/Phnom_Penh
```

or another explicit timezone.

Do not mix timezone assumptions silently.

---

# 691 — Sequence / Number Generation

Business numbers such as:

```text
receipt number
order number
invoice number
```

may require controlled sequences.

Define:

```text
scope
reset rule
gap policy
concurrency
format
```

Do not assume database primary key equals business number.

---

# 692 — Gapless Sequence Warning

Strictly gapless sequences are difficult under rollback/concurrency.

Only require gapless numbering if business/legal requirements demand it.

Document the trade-off.

---

# 693 — Data Type Standards

Recommended mappings:

| Concept | PostgreSQL |
|---|---|
| UUID | UUID |
| Money | NUMERIC / BIGINT minor |
| Timestamp | TIMESTAMPTZ |
| Date | DATE |
| Boolean | BOOLEAN |
| Short code | VARCHAR |
| Large text | TEXT |
| Structured metadata | JSONB |
| Binary | BYTEA / object storage reference |

---

# 694 — Large Object Storage

Do not store large files in PostgreSQL unless justified.

For:

```text
images
PDFs
videos
documents
```

prefer:

```text
object storage
```

Database stores:

```text
object key
metadata
owner
checksum
created_at
```

---

# 695 — Object Checksum

Store checksum where integrity matters.

Example:

```text
SHA-256
```

Useful for:

```text
upload validation
deduplication
corruption detection
```

---

# 696 — Database Connection Pooling

Use HikariCP or equivalent.

Important calculation:

```text
10 pods
×
20 connections
=
200 DB connections
```

Plan globally.

---

# 697 — Connection Pool Sizing

Consider:

```text
DB max connections
number of pods
background workers
admin tools
migrations
failover
```

Do not set each service pool independently without platform planning.

---

# 698 — Connection Timeout

Configure:

```text
connection timeout
idle timeout
max lifetime
```

Avoid unlimited waits.

---

# 699 — Query Timeout

Use query/statement timeout for risky operations.

Long-running administrative/reporting queries should not block operational traffic.

---

# 700 — Read Replicas

Read replicas may serve:

```text
reporting
history
read-heavy dashboards
```

Do not use replicas when strong read-after-write consistency is required unless replication lag is acceptable.

---

# 701 — Replica Lag

Applications using replicas must understand:

```text
eventual consistency
```

Example:

```text
order created
  ↓
immediate read from replica
  ↓
order may not appear yet
```

---

# 702 — Read/Write Routing

Do not automatically route every GET to replica.

Determine per use case.

Examples:

```text
Wallet balance → primary
Order history → replica may be acceptable
Analytics → replica/reporting store
```

---

# 703 — High Availability

Production PostgreSQL should support:

```text
automated failover
replication
backups
monitoring
```

Managed database services are recommended where possible.

Detailed disaster recovery belongs in a later part.

---

# 704 — Schema Ownership Permissions

Example:

```text
order_service_user
```

permissions:

```text
CONNECT order_db
SELECT/INSERT/UPDATE/DELETE owned tables
EXECUTE owned functions
```

No access to:

```text
wallet_db
identity_db
```

---

# 705 — Migration User

Consider separate identity:

```text
order_migration_user
```

with DDL privileges.

Runtime identity may have only DML.

This reduces risk.

---

# 706 — Read-Only Support User

Example:

```text
order_support_readonly
```

with limited access.

Sensitive columns may require restricted views.

---

# 707 — Row-Level Security

PostgreSQL Row-Level Security may be considered for selected multi-tenant requirements.

Do not use it as a substitute for application authorization without careful design.

---

# 708 — Tenant Data

If multi-tenancy exists, define:

```text
tenant identifier
isolation model
index strategy
authorization
backup/restore implications
```

Possible models:

```text
shared tables
schema per tenant
database per tenant
```

Choose based on scale/security.

---

# 709 — Tenant Key

If using shared tables:

```text
tenant_id
```

should be included in:

```text
queries
unique constraints
indexes
```

Example:

```text
UNIQUE(tenant_id, coupon_code)
```

---

# 710 — Data Access Layer

Persistence adapters should expose domain/application-oriented ports.

Avoid a generic unrestricted query layer that leaks database structure throughout the service.

---

# 711 — Repository Responsibilities

Repository/persistence adapter should handle:

```text
load aggregate
save aggregate
query read model
map persistence structures
```

It should not contain business rules.

---

# 712 — SQL Ownership

SQL belongs in:

```text
persistence adapter
migration scripts
reporting pipeline
```

not:

```text
controller
domain entity
```

---

# 713 — Stored Procedures

Stored procedures may be used when justified by:

```text
performance
legacy integration
atomic data operation
database-specific requirement
```

Do not place most business logic in stored procedures by default.

---

# 714 — Database Functions

Good candidates:

```text
technical helper
complex atomic update
reporting utility
```

Business rules should remain visible in the service domain unless there is a deliberate architectural decision.

---

# 715 — Triggers

Use triggers cautiously.

Advantages:

```text
enforce data-side behavior
automatic audit
```

Risks:

```text
hidden behavior
hard testing
unexpected side effects
migration complexity
```

Prefer explicit application transactions for core business workflows.

---

# 716 — Generated Columns

Generated columns may be useful for deterministic derived values.

Use only when the calculation belongs naturally at persistence level.

---

# 717 — Cascade Delete

Use carefully.

Example:

```text
order
  ↓
order_items
```

`ON DELETE CASCADE` may be valid if deleting order is legitimate.

For financial data:

```text
avoid cascade delete
```

---

# 718 — Referential Delete Behavior

Choose explicitly:

```text
RESTRICT
CASCADE
SET NULL
```

Do not rely on defaults without design review.

---

# 719 — Status History

If state changes matter operationally:

```text
current status
```

and:

```text
status history
```

may both be stored.

Example:

```text
orders.status = DONE
order_status_history = full transition trail
```

---

# 720 — Optimistic Version

Recommended for mutable aggregates:

```text
version BIGINT NOT NULL
```

Use for:

```text
order
wallet account
inventory item
mission progress
```

where concurrency matters.

---

# 721 — Updated At

`updated_at` is useful but must not be treated as a complete audit trail.

It only tells:

```text
when last changed
```

not:

```text
what changed
why
who
```

---

# 722 — Data Validation Layers

Data correctness is protected by:

```text
API validation
Application validation
Domain invariants
Database constraints
Reconciliation
```

No single layer is enough for critical systems.

---

# 723 — Database Error Mapping

Examples:

```text
unique violation
foreign key violation
check violation
serialization failure
deadlock
```

Persistence adapter maps technical errors into application-level errors where appropriate.

Do not leak raw SQL errors externally.

---

# 724 — Serialization Failure Retry

PostgreSQL may raise serialization errors under strict isolation.

Retry only:

```text
safe local transaction
bounded attempts
with backoff
```

Do not blindly retry external side effects.

---

# 725 — Data Migration

Data migration differs from schema migration.

Examples:

```text
Legacy customer import
Order history migration
Wallet opening balance migration
Loyalty point migration
```

Each migration requires reconciliation.

---

# 726 — Migration Stages

Recommended:

```text
Extract
  ↓
Validate
  ↓
Transform
  ↓
Load
  ↓
Reconcile
  ↓
Approve
```

---

# 727 — Migration Idempotency

Migration jobs should be restartable.

Use:

```text
source reference
migration status
checkpoint
idempotency key
```

Avoid duplicate migrated records.

---

# 728 — Migration Mapping Table

Example:

```text
legacy_id_mapping
-----------------
source_system
source_id
target_type
target_id
migrated_at
```

Useful during strangler migration.

---

# 729 — Migration Reconciliation

Verify:

```text
record count
amount totals
status distribution
missing references
duplicate references
balance totals
```

For financial migration, reconciliation is mandatory.

---

# 730 — Opening Balance Migration

Wallet migration should preserve an auditable starting point.

Possible approach:

```text
OPENING_BALANCE ledger entry
```

with:

```text
legacy source
migration reference
timestamp
approved total
```

---

# 731 — Legacy Data Quality

Do not assume legacy data is clean.

Check:

```text
nulls
duplicates
invalid statuses
orphan rows
bad encoding
unexpected amounts
```

Migration may need quarantine records.

---

# 732 — Quarantine Table

Bad migration rows may go to:

```text
migration_quarantine
```

with:

```text
source record
reason
detected_at
resolution status
```

Do not silently discard.

---

# 733 — Data Contract for Events

Data architecture must align with event contracts.

Important:

```text
Database schema != event schema
```

Events should expose business meaning, not raw table structure.

---

# 734 — Schema Evolution vs Event Evolution

A database column may change without forcing an event contract change.

Example:

```text
internal column renamed
```

does not require:

```text
ORDER_COMPLETED v2
```

if event semantics stay the same.

---

# 735 — Data Observability

Monitor:

```text
DB availability
connection pool
query latency
slow queries
deadlocks
replication lag
storage
table growth
index bloat
vacuum
migration failures
```

---

# 736 — Business Data Metrics

Useful metrics:

```text
orders per day
payment success rate
wallet reconciliation mismatch
points issued
duplicate-event count
idempotency conflict count
```

Technical health alone is not enough.

---

# 737 — Storage Growth Forecast

Forecast:

```text
rows/day
bytes/row
index overhead
retention
growth/year
```

especially for:

```text
ledger
audit
events
notification history
```

---

# 738 — Table Bloat

PostgreSQL MVCC can create dead tuples.

Monitor:

```text
autovacuum
table bloat
index bloat
```

High-write tables need tuning.

---

# 739 — Vacuum

Autovacuum must be monitored.

Do not disable it casually.

Large high-update tables may need custom thresholds.

---

# 740 — Analyze Statistics

PostgreSQL query planner depends on statistics.

Ensure:

```text
ANALYZE
autovacuum analyze
```

are functioning.

---

# 741 — Index Maintenance

Monitor:

```text
unused indexes
duplicate indexes
bloated indexes
missing indexes
```

Avoid accumulating old indexes indefinitely.

---

# 742 — Database Capacity

Track:

```text
CPU
memory
IOPS
disk
connections
WAL generation
replication lag
```

Capacity planning should consider peak events.

---

# 743 — WAL

PostgreSQL WAL supports:

```text
crash recovery
replication
point-in-time recovery
```

WAL volume is affected by heavy writes and indexes.

Detailed backup/DR is covered later.

---

# 744 — Readiness Dependency

A service should not always mark itself unready merely because every optional dependency is unavailable.

Example:

```text
Notification provider down
```

may not require Order Service to be unready.

Database availability usually is critical for transactional services.

---

# 745 — Database Health Check

Health checks should be lightweight.

Avoid heavy business queries.

Example:

```text
SELECT 1
```

or connection validation.

---

# 746 — Migration at Startup

Options:

```text
App applies Flyway at startup
Dedicated migration job
CI/CD migration step
```

Production should choose one controlled pattern.

For critical environments, a dedicated migration stage often provides better visibility.

---

# 747 — Migration Lock

Ensure only one migration process modifies a schema at a time.

Flyway provides locking/history support.

Do not run conflicting migration tools simultaneously.

---

# 748 — Schema History

Flyway schema history provides:

```text
version
description
checksum
installed_on
success
```

Do not modify this table manually except controlled recovery procedures.

---

# 749 — Roll Forward Preference

For database failures, prefer:

```text
forward fix
```

over destructive rollback when data has already changed.

Application rollback and database rollback are different problems.

---

# 750 — Backward-Compatible Release Sequence

Example:

```text
Release A:
Add nullable column

Release B:
Write old + new

Backfill

Release C:
Read new

Release D:
Make constraint stronger

Release E:
Remove old
```

This supports zero/low-downtime deployment.

---

# 751 — Constraint Introduction

When adding a new NOT NULL constraint to a large table:

```text
backfill existing rows first
validate
then enforce
```

Avoid long blocking migrations.

---

# 752 — Index Creation in Production

For large PostgreSQL tables:

```sql
CREATE INDEX CONCURRENTLY
```

may reduce blocking.

It has its own operational constraints and should be tested.

---

# 753 — Data API Boundary

Database schema is private implementation detail.

Consumers should depend on:

```text
REST
gRPC
Events
```

not:

```text
table names
column names
SQL views
```

---

# 754 — Service Data Documentation

Every service should document:

```text
Owned database
Owned tables
Primary keys
Business keys
Foreign keys
Unique constraints
Important indexes
Retention
Audit/history
Migration strategy
Data sensitivity
```

---

# 755 — Table Documentation Template

For each important table:

```text
Table Name
Purpose
Owner
Primary Key
Business Key
Important Columns
Foreign Keys
Unique Constraints
Indexes
Retention
PII Classification
Write Pattern
Read Pattern
Audit Requirement
```

---

# 756 — Example: Orders Table

```text
orders
------

Purpose:
Authoritative order header

Owner:
order-service

Primary Key:
id

Business Key:
order_number

Important:
customer_id
store_id
status
total_amount
currency
created_at
completed_at
version
```

---

# 757 — Example: Wallet Accounts Table

```text
wallet_accounts
---------------

Purpose:
Current wallet balance state

Owner:
wallet-service

Primary Key:
wallet_id

Important:
customer_id
available_balance
reserved_balance
currency
version
updated_at
```

---

# 758 — Example: Wallet Ledger Table

```text
wallet_ledger_entries
---------------------

Purpose:
Immutable wallet financial history

Owner:
wallet-service

Important:
wallet_id
entry_type
amount
currency
reference_id
idempotency_key
occurred_at
```

---

# 759 — Example: Mission Progress Table

```text
mission_progress
----------------

Purpose:
Authoritative progress for customer mission cycle

Owner:
mission-service

Important:
user_id
mission_id
cycle_id
current_progress
target_progress
status
completed_at
version
```

Unique candidate:

```text
(user_id, mission_id, cycle_id)
```

---

# 760 — Example: Processed Event Table

```text
processed_events
----------------

Purpose:
Consumer idempotency

Primary key:
(event_id, consumer_name)

Retention:
Defined per service/event replay policy
```

---

# 761 — Naming for Indexes

Recommended:

```text
pk_<table>
uq_<table>_<columns>
idx_<table>_<columns>
fk_<table>_<reference>
chk_<table>_<rule>
```

Example:

```text
uq_orders_order_number
idx_orders_customer_created
chk_order_items_quantity_positive
```

---

# 762 — Constraint Naming

Explicit constraint names improve:

```text
debugging
migration
error mapping
```

Do not rely entirely on autogenerated names.

---

# 763 — SQL Formatting

Migration SQL should use consistent formatting.

Example:

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orders_order_number
        UNIQUE (order_number)
);
```

---

# 764 — DDL Review

Schema review should ask:

```text
Is ownership correct?
Is primary key correct?
Are nullability rules correct?
Are constraints sufficient?
Are indexes justified?
Is retention known?
Is PII classified?
Is migration backward-compatible?
```

---

# 765 — Query Review

Query review should ask:

```text
What is expected cardinality?
Does index support it?
Can it scan millions of rows?
Is pagination stable?
Is consistency requirement clear?
Does it cross service ownership?
```

---

# 766 — Data Model Anti-Patterns

Avoid:

```text
Shared "common" database
Tables updated by many services
No constraints because "app validates"
JSONB for everything
Soft delete everywhere
No migration history
Manual production schema edits
Business logic hidden in triggers
Cross-service foreign keys
Float money columns
```

---

# 767 — Shared Database Anti-Pattern

Example:

```text
platform_db
  ├── orders
  ├── wallet
  ├── loyalty
  └── payments

all services have full access
```

This removes real service ownership.

---

# 768 — Generic Entity Table Anti-Pattern

Avoid:

```text
entities
--------
type
key
value
json_data
```

for core business data unless there is a specific extensibility requirement.

It weakens:

```text
constraints
queries
clarity
performance
```

---

# 769 — Excessive Nullable Columns

A table with many unrelated optional fields may indicate multiple concepts have been merged incorrectly.

Revisit domain model.

---

# 770 — Status as Free Text

Avoid unrestricted:

```text
status VARCHAR(255)
```

with arbitrary values.

Use:

```text
documented enum
constraint
application type
```

---

# 771 — Duplicate Source of Truth

Bad:

```text
wallet balance stored independently in:
wallet-service
order-service
mobile backend
reporting database
```

Only one is authoritative.

Others must be projections.

---

# 772 — Data Consistency Matrix

Example:

| Data | Consistency |
|---|---|
| Wallet balance | Strong |
| Payment state | Strong/local |
| Order status | Strong/local |
| Points redemption | Strong |
| Mission dashboard | Eventual acceptable |
| Notification history | Eventual acceptable |
| Analytics | Eventual |
| Search index | Eventual |

---

# 773 — Read-After-Write Requirements

Document per query.

Example:

```text
After wallet top-up:
wallet balance screen must show new balance immediately
```

Therefore query should read authoritative/strong source.

---

# 774 — Eventual Projection Lag

For projections:

```text
target lag
```

should be measurable.

Example:

```text
Mission progress projection:
P95 < 5 seconds
```

Exact SLO belongs in operations/observability.

---

# 775 — Data Ownership Review Checklist

- [ ] Every table has one owning service.
- [ ] No direct cross-service writes.
- [ ] No cross-service foreign keys.
- [ ] Source of truth is explicit.
- [ ] Read copies are identified as projections.
- [ ] Reporting path is defined.

---

# 776 — Schema Review Checklist

- [ ] Primary key defined.
- [ ] Business key defined where needed.
- [ ] Required fields are NOT NULL.
- [ ] Constraints protect simple invariants.
- [ ] Money uses exact type.
- [ ] Timestamps use correct semantics.
- [ ] PII classification is known.
- [ ] Retention is defined.

---

# 777 — Index Review Checklist

- [ ] Important WHERE columns reviewed.
- [ ] JOIN columns reviewed.
- [ ] ORDER BY patterns reviewed.
- [ ] Unique constraints reviewed.
- [ ] Duplicate indexes removed.
- [ ] Write overhead considered.
- [ ] Query plan tested.

---

# 778 — Transaction Review Checklist

- [ ] Transaction boundary is local to one service.
- [ ] Transaction is short.
- [ ] Remote calls are minimized inside transaction.
- [ ] Concurrency strategy is explicit.
- [ ] Retry behavior is safe.
- [ ] Outbox included if event publication is required.

---

# 779 — Migration Review Checklist

- [ ] Migration file versioned.
- [ ] Already-applied migrations unchanged.
- [ ] Backward compatibility reviewed.
- [ ] Large-table locking reviewed.
- [ ] Backfill plan exists.
- [ ] Roll-forward plan exists.
- [ ] Production-like test completed.

---

# 780 — Data Security Review Checklist

- [ ] Database user is service-specific.
- [ ] Least privilege applied.
- [ ] Sensitive fields classified.
- [ ] Encryption requirement reviewed.
- [ ] Non-production masking defined.
- [ ] Audit requirement defined.
- [ ] Backup implications reviewed.

---

# 781 — Data Lifecycle Review Checklist

- [ ] Active retention defined.
- [ ] Historical retention defined.
- [ ] Archive policy defined.
- [ ] Deletion/anonymization policy defined.
- [ ] Cleanup jobs defined.
- [ ] Legal/audit exceptions identified.

---

# 782 — Data Quality Review Checklist

- [ ] Duplicate detection defined.
- [ ] Reconciliation defined where needed.
- [ ] Orphan data prevented.
- [ ] Invalid-status detection exists.
- [ ] Projection lag monitored.
- [ ] Migration quality checks defined.

---

# 783 — Definition of Done for a New Table

A new table is complete when:

- [ ] Owner defined.
- [ ] Purpose documented.
- [ ] Primary key defined.
- [ ] Business key defined if needed.
- [ ] Constraints defined.
- [ ] Indexes justified.
- [ ] Migration created.
- [ ] Retention defined.
- [ ] PII classified.
- [ ] Tests created.
- [ ] Query patterns reviewed.
- [ ] Monitoring considered.

---

# 784 — Definition of Done for a Data Migration

Complete when:

- [ ] Source mapped.
- [ ] Target mapped.
- [ ] Transformations documented.
- [ ] Idempotency defined.
- [ ] Validation executed.
- [ ] Reconciliation passed.
- [ ] Quarantine handled.
- [ ] Audit record created.
- [ ] Rollback/roll-forward plan documented.

---

# 785 — PART 07 Deliverables

PART 07 produces:

1. Database-per-service standard.
2. Logical/physical isolation strategy.
3. Data ownership rules.
4. PostgreSQL standard.
5. Database/schema/table naming conventions.
6. Primary-key strategy.
7. Business-ID strategy.
8. Foreign-key rules.
9. Unique/check/NOT NULL rules.
10. Timestamp/date standards.
11. Money/currency storage standard.
12. JSONB usage guidance.
13. Normalization/denormalization rules.
14. Historical snapshot rules.
15. Audit/soft-delete guidance.
16. Ledger design standard.
17. Balance-table guidance.
18. Transaction principles.
19. Isolation-level guidance.
20. Concurrency-control strategies.
21. Deadlock handling.
22. Idempotency persistence.
23. Outbox persistence.
24. Consumer inbox persistence.
25. Flyway standard.
26. Backward-compatible migration strategy.
27. Large-table migration guidance.
28. Indexing standards.
29. Query-analysis standards.
30. Pagination query standard.
31. Read-model/projection strategy.
32. Reporting architecture.
33. CDC guidance.
34. Reference-data rules.
35. Environment data isolation.
36. Data masking.
37. Retention.
38. Cleanup.
39. Partitioning/archiving.
40. Data lifecycle.
41. Deletion/anonymization.
42. Data lineage.
43. Data quality.
44. Reconciliation.
45. Data repair/change control.
46. Effective-dating/versioning rules.
47. Connection-pool guidance.
48. Replica/read-routing guidance.
49. Permission model.
50. Data migration strategy.
51. Data observability.
52. Service data documentation templates.
53. Review checklists.
54. Definition of done.

---

# 786 — Exit Criteria

PART 07 is ready when the team can answer:

### Ownership

```text
Which service owns every important table and business fact?
```

### Integrity

```text
Which constraints protect critical data?
```

### Transactions

```text
What must commit atomically?
```

### Concurrency

```text
How are double-spend, lost update, and duplicate processing prevented?
```

### Migration

```text
How does the schema evolve safely while old and new application versions coexist?
```

### Performance

```text
Which queries and indexes support production traffic?
```

### History

```text
Which data is immutable, auditable, or historically versioned?
```

### Reporting

```text
How can analytics/reporting access data without violating service ownership?
```

### Retention

```text
How long is each class of data kept, archived, anonymized, or deleted?
```

### Security

```text
Which data is sensitive and who can access it?
```

If these answers are unclear, service implementation is not data-ready.

---

# 787 — Handoff to PART 08

PART 08 begins the detailed service design.

```text
PART 07
Data Architecture
      ↓
Ownership
Schema rules
Transactions
Security
Migrations
      ↓
PART 08
Auth / Identity Service
```

PART 08 will define:

```text
Identity responsibilities
User model
Credential model
Authentication flows
Login
Registration
Refresh token
Logout
Session management
Password reset
Roles / permissions
JWT issuance
Key rotation
Security events
Identity database schema
REST contracts
Internal contracts
Events
Testing
Operational concerns
```

---

# PART 07 — Summary

The central data rule is:

```text
A service owns its business data
and protects that data through
domain rules + transactions + database constraints.
```

The target architecture is:

```text
Service
   ↓
Owned Database
   ↓
Explicit Schema
   ↓
Constraints
   ↓
Transactions
   ↓
Migrations
   ↓
Observability
```

Cross-service sharing happens through:

```text
REST
gRPC
Events
Projections
Reporting pipelines
```

not direct database access.

For critical domains such as:

```text
Wallet
Payment
Ordering
Loyalty
```

data correctness must be protected against:

```text
duplicates
concurrent updates
lost writes
invalid transitions
replay
partial failure
migration errors
manual data corruption
```

Good data architecture is therefore not only about tables.

It is the foundation for:

```text
correctness
auditability
performance
security
migration
recovery
scaling
production reliability
```

---

**End of PART 07 — Data Architecture**
