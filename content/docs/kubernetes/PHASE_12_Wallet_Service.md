---
title: "PHASE 12 — Wallet Service"
---

# PHASE 12 — Wallet Service

> **Purpose:** Implement the platform Wallet Service as the authoritative owner of internal stored monetary value, including wallet accounts, available/reserved balances, immutable financial ledger, reserve/capture/release, top-up, refund, reversal, privileged adjustment, idempotency, concurrency protection, reconciliation, customer statements, reliable events, recovery, and financial audit controls.
>
> **Previous Phase:** Phase 11 — Payment Service
>
> **Next Phase:** Phase 13 — Service Communication
>
> **Primary Architecture Basis:** PART 15 — Wallet Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 22 — Distributed Transactions / Saga, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Roadmap Note:** PART 15 hands architecturally toward Loyalty, but this implementation roadmap intentionally continues to Phase 13 Service Communication, Phase 14 Saga, Phase 15 Kafka, then Phase 16 Loyalty. Therefore Wallet publishes stable financial events now so later Loyalty/Mission work can consume them without querying `wallet_db`.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, REST/gRPC, Kafka, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 12 Goal

Phase 12 builds:

```text
wallet-service
```

Wallet Service owns:

```text
Wallet Account
Wallet Status
Available Balance
Reserved Balance
Currency
Wallet Ledger
Wallet Transaction
Top-Up
Reservation
Capture
Release
Refund
Reversal
Adjustment
Opening Balance
Wallet Idempotency
Wallet Reconciliation
Wallet Events
```

It answers:

```text
Does the customer have a wallet?
What is the available balance?
What amount is reserved?
Can funds be reserved?
Can a reservation be captured?
Can a reservation be released?
Was a top-up completed?
Was a refund applied?
Was a reversal applied?
Can every balance movement be explained?
```

---

# 2. Primary Financial Risk

Wallet must protect against:

```text
double spend
duplicate top-up
duplicate capture
duplicate refund
lost update
negative balance
ledger corruption
reservation leakage
race conditions
replay
provider mismatch
```

---

# 3. Fundamental Ownership Rule

```text
Wallet Service
=
the only owner of wallet balance
```

No other service may directly:

```text
UPDATE wallet_accounts
INSERT wallet_ledger_entries
change reserved balance
credit top-up
debit spend
```

---

# 4. Wallet vs Payment

```text
Payment Service
= external/provider money collection

Wallet Service
= internal stored-value financial ledger
```

Payment may confirm a trusted external top-up source.

Payment does not write wallet balances.

---

# 5. Wallet vs Ordering

Ordering owns:

```text
order lifecycle
```

Wallet owns:

```text
reserve
capture
release
refund
```

for stored-value payment.

Ordering calls Wallet through explicit contracts.

---

# 6. Wallet vs Loyalty

Wallet:

```text
monetary stored value
```

Loyalty:

```text
non-cash reward value / engagement benefits
```

Wallet must not mix:

```text
points
tier
mission progress
reward entitlement
```

into monetary balance.

---

# 7. Non-Responsibilities

Wallet does not own:

```text
Order lifecycle
External payment provider lifecycle
Product price
Inventory
Loyalty points
Mission progress
Customer profile
Notification delivery
```

It may reference:

```text
customer_id
order_id
payment_id
topup_reference
```

without owning those domains.

---

# 8. Phase 12 Success State

Stored-value purchase:

```text
Available Balance
       ↓
Reserve
       ↓
Reserved Balance
       ├──> Capture → Spent
       └──> Release → Available Again
```

Top-up:

```text
Trusted External Confirmation
       ↓
Deduplicate Reference
       ↓
Credit Available Balance
       ↓
Immutable Ledger Entry
       ↓
WalletTopUpCompleted
```

Refund:

```text
Captured Wallet Spend
       ↓
Refund
       ↓
Available Balance Restored
```

---

# 9. Core Accounting Rule

The central rule is:

```text
every balance change
must have
an immutable ledger explanation
```

---

# 10. Non-Negotiable Controls

Do not postpone:

```text
immutable ledger
idempotency
double-spend protection
reconciliation
```

Also enforce:

```text
available and reserved are separate
financial operations are exact-money
balance and ledger update atomically
top-up requires trusted confirmation
refund <= captured amount
manual adjustment is privileged/audited
reversal uses new financial entries
```

---

# 11. Source-Defined Open Decisions

Freeze before production:

```text
Wallet ID strategy
Wallet creation strategy
Supported currencies
One wallet per customer/currency policy
Status transition policy
Which operations BLOCKED allows
Which operations SUSPENDED allows
Reservation expiry duration
Partial capture support
Partial release support
Top-up trusted sources
Top-up reversal insufficient-funds policy
Refund partial/full rules
Adjustment approval threshold
Adjustment reason catalog
Wallet limits
Opening balance migration policy
Ledger sequence requirement
Ledger hashing requirement
Retention
Reconciliation schedule
Read consistency strategy
RPO/RTO
```

Use:

```text
TBD_POLICY
TBD_SECURITY
TBD_ARCHITECTURE
TBD_DR
```

until approved.

---

# 12. Wallet Boundary

```text
              Order Service
                   │
                   ▼
              Wallet Service
         ┌─────────┼─────────┐
         │         │         │
         ▼         ▼         ▼
      Account   Reservation Ledger
         │         │         │
         └─────────┼─────────┘
                   ▼
               wallet_db
                   │
                   ├── Payment Service
                   ├── Integration / Top-Up Source
                   └── Kafka Events
```

---

# 13. Ubiquitous Language

| Term | Meaning |
|---|---|
| Wallet | Stored-value account owned by a customer |
| Available Balance | Funds available for new spending |
| Reserved Balance | Funds held for pending transaction |
| Ledger Entry | Immutable record of value movement |
| Top-Up | Adding value into Wallet |
| Reserve | Move value from available to reserved |
| Capture | Consume reserved funds |
| Release | Return reserved funds to available |
| Refund | Return previously captured funds |
| Reversal | Counter-entry correcting/reversing prior movement |
| Adjustment | Privileged balance correction |
| Reference | Business link explaining a movement |
| Wallet Transaction | Domain operation grouping related financial entries |

---

# 14. Wallet Aggregate

Primary aggregate:

```text
WalletAccount
```

Possible state:

```text
wallet_id
customer_id
status
currency
available_balance
reserved_balance
version
created_at
updated_at
```

Behavior:

```text
topUp()
reserve()
capture()
release()
refund()
adjust()
block()
unblock()
```

---

# 15. Wallet Status

Source recommends:

```text
ACTIVE
BLOCKED
SUSPENDED
CLOSED
```

---

# 16. Wallet Status Meaning

```text
ACTIVE
→ normal usage

BLOCKED
→ restricted according to security/operations policy

SUSPENDED
→ temporarily unavailable

CLOSED
→ no new normal transactions
```

---

# 17. Wallet State Transitions

Example:

```text
ACTIVE
  ├──> BLOCKED
  ├──> SUSPENDED
  └──> CLOSED

BLOCKED
  └──> ACTIVE

SUSPENDED
  └──> ACTIVE

CLOSED
  → terminal
```

Exact transitions:

```text
TBD_POLICY
```

---

# 18. Wallet Invariants

Core:

```text
available_balance >= 0
reserved_balance >= 0
currency immutable after first financial movement unless formal migration exists
capture <= reservation remaining
release <= reservation remaining
refund <= captured refundable amount
duplicate reference/idempotency cannot duplicate value
closed wallet cannot receive normal new operations
```

---

# 19. Total Wallet Value

Simple model:

```text
total_wallet_value
=
available_balance
+
reserved_balance
```

---

# 20. Reserve Formula

Before:

```text
available = 100
reserved = 0
```

Reserve 20:

```text
available = 80
reserved = 20
```

Total remains:

```text
100
```

---

# 21. Capture Formula

Capture 20 from reserved:

```text
available = 80
reserved = 0
```

Total becomes:

```text
80
```

because value was spent.

---

# 22. Release Formula

Reserve 20, then release:

```text
available = 100
reserved = 0
```

No spend occurred.

---

# 23. Refund Formula

After spending 20:

```text
available = 80
reserved = 0
```

Refund 20:

```text
available = 100
reserved = 0
```

---

# 24. Money Representation

Use exact financial representation:

```text
NUMERIC / DECIMAL
```

or approved minor units.

Never use floating point for authoritative balance.

---

# 25. One Wallet per Currency

Initial recommendation:

```text
one wallet = one currency
```

If multiple currencies are supported:

```text
one wallet account per currency
```

is safer than mixing currencies.

---

# 26. Multi-Currency Warning

Do not use:

```text
one numeric balance
+
changing currency
```

That destroys financial meaning.

---

# 27. Currency Conversion

If introduced later:

```text
source debit
destination credit
exchange rate
fee
```

must be a separate atomic financial workflow.

Not MVP.

---

# 28. Ledger Principle

Wallet ledger is:

```text
append-only
immutable
financial history
```

Never correct by:

```sql
UPDATE wallet_ledger_entries
SET amount = ...
```

Instead:

```text
new reversal/correction entry
```

---

# 29. Ledger Strategy

Source options:

### Wallet-centric movement ledger

```text
TOP_UP +20
CAPTURE -5
REFUND +5
```

### Full double-entry accounting

```text
Wallet Liability
Cash / Clearing
Revenue / Settlement
```

Initial Wallet may use the wallet-centric immutable ledger.

A proper double-entry accounting subsystem should be introduced only when finance/accounting scope requires it.

---

# 30. Ledger Entry

Possible fields:

```text
ledger_entry_id
wallet_id
entry_type
amount
currency
balance_effect
reference_type
reference_id
wallet_transaction_id
idempotency_key
occurred_at
created_at
```

---

# 31. Ledger Entry Types

Possible:

```text
TOP_UP
RESERVE
CAPTURE
RELEASE
REFUND
REVERSAL
ADJUSTMENT_CREDIT
ADJUSTMENT_DEBIT
OPENING_BALANCE
EXPIRY
```

Use only needed types.

---

# 32. Ledger Delta Model

Recommended useful fields:

```text
available_delta
reserved_delta
```

---

# 33. Reserve Ledger Delta

Reserve 20:

```text
available_delta = -20
reserved_delta  = +20
```

---

# 34. Capture Ledger Delta

Capture 20:

```text
available_delta = 0
reserved_delta  = -20
```

---

# 35. Top-Up Ledger Delta

Top-up 20:

```text
available_delta = +20
reserved_delta  = 0
```

---

# 36. Release Ledger Delta

Release 20:

```text
available_delta = +20
reserved_delta  = -20
```

---

# 37. Refund Ledger Delta

Refund 20:

```text
available_delta = +20
reserved_delta  = 0
```

---

# 38. Balance Snapshot per Entry

Optional post-entry:

```text
available_balance_after
reserved_balance_after
```

Useful for:

```text
debugging
statement generation
reconciliation
```

Current authoritative balance still lives on WalletAccount.

---

# 39. Ledger Ordering

Deterministic statement order using:

```text
created_at
+
ledger_entry_id
```

or optional:

```text
wallet_sequence
```

if strict per-wallet sequencing is required.

---

# 40. Ledger Hash Chain — Optional

High-assurance option:

```text
entry_hash
previous_entry_hash
```

to make tampering detectable.

Use only if the compliance/operational value justifies complexity.

Decision:

```text
LEDGER_HASH_CHAIN_ENABLED = TBD_SECURITY
```

---

# 41. Wallet Transaction

Higher-level grouping entity:

```text
transaction_id
wallet_id
transaction_type
reference_type
reference_id
status
amount
currency
created_at
completed_at
```

---

# 42. Wallet Transaction Types

Examples:

```text
TOP_UP
ORDER_PAYMENT
REFUND
ADJUSTMENT
REVERSAL
OPENING_BALANCE
```

---

# 43. Reservation Entity

Possible:

```text
reservation_id
wallet_id
reference_type
reference_id
original_amount
captured_amount
released_amount
status
expires_at
created_at
updated_at
```

---

# 44. Reservation Status

Recommended:

```text
ACTIVE
PARTIALLY_CAPTURED
CAPTURED
RELEASED
EXPIRED
CANCELLED
```

Use only required states.

---

# 45. Reservation Formula

```text
remaining_amount
=
original_amount
-
captured_amount
-
released_amount
```

---

# 46. Reservation Invariants

```text
captured_amount >= 0
released_amount >= 0
captured_amount + released_amount <= original_amount
remaining_amount >= 0
```

---

# 47. Reservation Business Reference

Typical:

```text
reference_type = ORDER
reference_id = ORD001
```

Potential uniqueness:

```text
(wallet_id, reference_type, reference_id)
```

for one reservation per obligation.

---

# 48. ReserveFunds Command

Input:

```text
wallet_id/customer_id
reference_type
reference_id
amount
currency
idempotency_key
expires_at optional
```

Output:

```text
reservation_id
status
reserved_amount
```

---

# 49. ReserveFunds Flow

```text
Validate Wallet
      ↓
Claim Idempotency
      ↓
Lock / Atomic Balance Update
      ↓
Verify available >= amount
      ↓
available -= amount
reserved += amount
      ↓
Create Reservation
      ↓
Create Wallet Transaction
      ↓
Create Ledger Entry
      ↓
Create Outbox Event
      ↓
Commit
```

---

# 50. Insufficient Balance

Return stable:

```text
WALLET_INSUFFICIENT_BALANCE
```

Do not expose unnecessary internal arithmetic.

---

# 51. Reserve Idempotency

Repeated reserve must not hold funds twice.

Use:

```text
idempotency key
reference uniqueness
request hash
```

---

# 52. Double-Spend Example

Initial:

```text
available = 10
```

Two concurrent requests:

```text
reserve 8
reserve 8
```

Expected:

```text
exactly one succeeds
```

---

# 53. Atomic Reserve SQL

Source pattern:

```sql
UPDATE wallet_accounts
SET available_balance = available_balance - :amount,
    reserved_balance  = reserved_balance + :amount,
    version           = version + 1
WHERE id = :wallet_id
  AND status = 'ACTIVE'
  AND currency = :currency
  AND available_balance >= :amount;
```

Check affected row count.

---

# 54. Pessimistic Lock Alternative

```sql
SELECT *
FROM wallet_accounts
WHERE id = ?
FOR UPDATE;
```

Then validate and update.

Correct but may reduce throughput under contention.

---

# 55. Optimistic Lock Alternative

Use:

```text
version
```

with safe retry when contention is moderate.

Financial correctness must remain unchanged.

---

# 56. Recommended Reserve Strategy

For high-value stored money, initial recommendation:

```text
atomic conditional update
```

or:

```text
pessimistic row lock
```

prioritizing correctness.

---

# 57. CaptureFunds

Capture permanently spends reserved money.

Input:

```text
reservation_id
amount
reference
idempotency_key
```

---

# 58. Capture Flow

```text
Load Reservation
      ↓
Claim Idempotency
      ↓
Lock Wallet + Reservation
      ↓
Validate remaining
      ↓
Decrease reserved balance
      ↓
Increase reservation captured_amount
      ↓
Create Wallet Transaction
      ↓
Create Ledger Entry
      ↓
Update Reservation Status
      ↓
Outbox
      ↓
Commit
```

---

# 59. Capture Idempotency

Repeated:

```text
CaptureFunds(reference=ORD001)
```

must not spend twice.

---

# 60. Partial Capture

Possible:

```text
reserve 20
capture 15
release 5
```

Initial order-payment implementation may forbid partial capture.

Decision:

```text
PARTIAL_WALLET_CAPTURE_ENABLED = TBD_SCOPE
```

---

# 61. Full Capture

When:

```text
captured_amount == original_amount
```

reservation becomes:

```text
CAPTURED
```

---

# 62. ReleaseFunds

Release returns unspent reserved money.

Input:

```text
reservation_id
amount or release remaining
reason
idempotency_key
```

---

# 63. Release Flow

```text
Load Reservation
      ↓
Claim Idempotency
      ↓
Lock Wallet + Reservation
      ↓
Calculate releasable amount
      ↓
reserved -= amount
available += amount
      ↓
Update Reservation
      ↓
Ledger
      ↓
Outbox
      ↓
Commit
```

---

# 64. Release Idempotency

Repeated release:

```text
same result / no-op
```

Never credit twice.

---

# 65. Reservation Expiry

Optional:

```text
expires_at
```

Worker:

```text
find expired ACTIVE/PARTIAL reservations
      ↓
lock
      ↓
release remaining
      ↓
mark EXPIRED
```

---

# 66. Expiry Caution

Do not expire a hold when the business process intentionally requires a long reservation.

Order/payment workflow defines duration.

Decision:

```text
WALLET_RESERVATION_TTL = TBD_POLICY
```

---

# 67. Expiry Worker Idempotency

Multiple workers/retries cannot double release.

Use:

```text
state transition
locking
idempotency
```

---

# 68. Top-Up

Top-up adds value.

Possible source categories:

```text
external payment
bank
mobile provider
cashier
promotion credit
migration
```

Only approved trusted sources may credit.

---

# 69. Top-Up Entity

Possible:

```text
topup_id
wallet_id
source
external_reference
amount
currency
status
created_at
completed_at
```

---

# 70. Top-Up Status

Possible:

```text
PENDING
SUCCEEDED
FAILED
REVERSED
UNKNOWN
```

---

# 71. Top-Up Idempotency

Critical.

Provider retry/callback replay must not credit twice.

Unique candidate:

```text
(source, external_reference)
```

plus application idempotency.

---

# 72. Top-Up Flow

```text
Receive confirmed top-up
      ↓
Validate amount / currency
      ↓
Deduplicate source reference
      ↓
Lock Wallet
      ↓
Increase Available
      ↓
Insert Top-Up
      ↓
Insert Wallet Transaction
      ↓
Insert Ledger Entry
      ↓
Outbox WalletTopUpCompleted
      ↓
Commit
```

---

# 73. Trusted Top-Up Confirmation

Do not credit from client claim:

```text
"payment_success": true
```

Credit only from trusted:

```text
Payment Service authoritative result
verified provider/integration callback
trusted reconciliation/import
```

---

# 74. Top-Up UNKNOWN

If provider/payment state is uncertain:

```text
do not credit
```

until authoritative confirmation exists.

---

# 75. Top-Up via Payment Service

Recommended:

```text
Customer initiates Top-Up
      ↓
Payment Service
      ↓
PaymentCaptured
      ↓
Wallet Service
      ↓
Deduplicate payment/provider reference
      ↓
Credit exactly once
```

---

# 76. Direct Provider Top-Up

If external integration is authoritative:

```text
Integration Service
      ↓ trusted event
Wallet Service
```

Wallet still deduplicates by stable reference.

---

# 77. Top-Up Reversal

If a credit was wrong:

```text
create reversal/debit entry
```

Do not delete original ledger entry.

---

# 78. Reversal with Spent Funds

If top-up value was already spent, source leaves policy open:

```text
allow negative debt
block wallet + create receivable
reject automated reversal and escalate
```

Do not silently violate non-negative balance invariant.

Decision:

```text
TOPUP_REVERSAL_INSUFFICIENT_FUNDS_POLICY = TBD_FINANCE
```

---

# 79. Wallet Refund

Wallet refund restores previously captured stored value.

Reference:

```text
original wallet transaction
or
order reference
```

---

# 80. Refund Flow

```text
Validate Original Capture
      ↓
Check Remaining Refundable
      ↓
Claim Idempotency
      ↓
Lock Original Transaction + Wallet
      ↓
Increase Available
      ↓
Increase Refunded Amount
      ↓
Insert Refund
      ↓
Ledger Entry
      ↓
Outbox WalletRefunded
      ↓
Commit
```

---

# 81. Refund Invariants

```text
refund amount > 0
total refunded <= captured amount
currency same
reference valid
duplicate refund cannot credit twice
```

---

# 82. Refund Idempotency

Same key + same request:

```text
same result
```

Same key + changed amount:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 83. Partial Refund

Example:

```text
captured = 10
refund = 4
remaining refundable = 6
```

---

# 84. Full Refund

When:

```text
refunded == captured
```

original spend may be marked fully refunded.

---

# 85. Reversal

A reversal preserves history by creating a counter-entry.

Use for:

```text
wrong top-up credit
incorrect adjustment
approved financial correction
```

according to policy.

---

# 86. Manual Adjustment

Adjustment changes balance outside normal customer flow.

Examples:

```text
support correction
finance correction
migration correction
fraud recovery
```

---

# 87. Adjustment Types

```text
CREDIT
DEBIT
```

Require:

```text
reason_code
actor
approval if required
reference
```

---

# 88. Adjustment Permissions

Possible:

```text
wallet.adjust
wallet.adjust.large
wallet.adjust.approve
```

---

# 89. High-Value Adjustment

May require dual control:

```text
Support requests
      ↓
Finance approves
      ↓
Wallet executes
```

Decision:

```text
WALLET_ADJUSTMENT_APPROVAL_THRESHOLD = TBD_SECURITY
```

---

# 90. Adjustment Audit

Always record:

```text
actor
reason
amount
before balance
after balance
request_id
timestamp
```

---

# 91. Adjustment Idempotency

Admin retry must not apply twice.

Use:

```text
adjustment_id
+
idempotency key
```

---

# 92. Wallet Limits

Future/optional controls:

```text
max wallet balance
daily top-up limit
daily spend limit
single transaction limit
monthly top-up limit
```

These may be business/regulatory controls.

---

# 93. Limit Evaluation

Example:

```text
current balance + topup
<=
max wallet balance
```

Only implement limits explicitly approved.

---

# 94. Wallet Creation

Options:

```text
CustomerCreated event
→ create Wallet
```

or:

```text
lazy creation at first Top-Up/use
```

Decision:

```text
WALLET_CREATION_STRATEGY = TBD_ARCHITECTURE
```

---

# 95. Wallet Creation Idempotency

Unique:

```text
(customer_id, currency)
```

prevents duplicate wallets.

---

# 96. Opening Balance

For migration use:

```text
OPENING_BALANCE
```

ledger entry.

Do not directly set balance without financial history.

---

# 97. Opening Balance Audit

Store:

```text
source_system
migration_batch
approved amount
migration reference
```

---

# 98. Wallet Closure

Requires:

```text
available balance handled
reserved balance = 0
pending transactions resolved
```

Do not close with unexplained money.

---

# 99. Wallet Blocking

BLOCKED behavior must be explicit operation-by-operation.

Possible restrictions:

```text
reserve
capture
top-up
refund
```

or only spending.

Decision:

```text
BLOCKED_OPERATION_MATRIX = TBD_SECURITY
```

---

# 100. Block Reasons

Possible:

```text
FRAUD
SECURITY
SUPPORT
COMPLIANCE
TECHNICAL
```

---

# 101. Wallet Database

Logical:

```text
wallet_db
```

Only Wallet Service modifies authoritative monetary state.

---

# 102. Core Tables

Source model:

```text
wallet_accounts
wallet_transactions
wallet_ledger_entries
wallet_reservations
wallet_topups
wallet_refunds
wallet_adjustments
wallet_idempotency
wallet_reconciliation_runs
wallet_reconciliation_mismatches
processed_events
outbox_events
```

Add reversal storage if separate entity is needed.

---

# 103. Wallet Accounts Table

```text
id
customer_id
currency
status
available_balance
reserved_balance
version
created_at
updated_at
closed_at
```

Unique:

```text
(customer_id, currency)
```

---

# 104. Wallet Transactions Table

```text
id
wallet_id
transaction_type
reference_type
reference_id
amount
currency
status
created_at
completed_at
```

---

# 105. Ledger Table

```text
id
wallet_id
wallet_transaction_id
entry_type
available_delta
reserved_delta
available_balance_after
reserved_balance_after
reference_type
reference_id
idempotency_key
occurred_at
created_at
```

Append-only.

---

# 106. Reservations Table

```text
id
wallet_id
reference_type
reference_id
original_amount
captured_amount
released_amount
currency
status
expires_at
created_at
updated_at
version
```

---

# 107. Top-Ups Table

```text
id
wallet_id
source
external_reference
amount
currency
status
created_at
completed_at
reversed_at
```

Unique candidate:

```text
(source, external_reference)
```

---

# 108. Refunds Table

```text
id
wallet_id
original_transaction_id
reference_type
reference_id
amount
currency
status
created_at
completed_at
```

---

# 109. Adjustments Table

```text
id
wallet_id
type
amount
currency
reason_code
comment
requested_by
approved_by
status
created_at
completed_at
```

---

# 110. Idempotency Table

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

# 111. Reconciliation Tables

```text
wallet_reconciliation_runs
wallet_reconciliation_mismatches
```

---

# 112. Processed Events

Use when consuming:

```text
CustomerCreated
PaymentCaptured
PaymentRefunded
PaymentReversed
trusted top-up confirmation
```

---

# 113. Transactional Outbox

Candidate events:

```text
WalletCreated
WalletTopUpCompleted
WalletTopUpReversed
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletReservationExpired
WalletRefunded
WalletAdjusted
WalletBlocked
WalletUnblocked
```

---

# 114. Wallet Indexes

Likely:

```text
UNIQUE(customer_id, currency)
(wallet_id, created_at DESC)
(reference_type, reference_id)
(status, expires_at)
(source, external_reference)
```

---

# 115. Ledger Statement Index

Source example:

```sql
CREATE INDEX idx_wallet_ledger_wallet_created
ON wallet_ledger_entries(wallet_id, created_at DESC);
```

---

# 116. Active Reservation Index

Source example:

```sql
CREATE INDEX idx_wallet_reservation_active_expiry
ON wallet_reservations(expires_at)
WHERE status IN ('ACTIVE','PARTIALLY_CAPTURED');
```

---

# 117. Reserve Transaction

```text
BEGIN

claim idempotency
lock/atomically update wallet
validate balance
create wallet transaction
create reservation
create ledger entry
update balance
insert outbox
complete idempotency

COMMIT
```

---

# 118. Capture Transaction

```text
BEGIN

claim idempotency
lock wallet + reservation
validate remaining
decrease reserved
update captured amount
create transaction + ledger
insert outbox
complete idempotency

COMMIT
```

---

# 119. Release Transaction

```text
BEGIN

claim idempotency
lock wallet + reservation
calculate releasable
increase available
decrease reserved
update reservation
create ledger entry
outbox
complete idempotency

COMMIT
```

---

# 120. Top-Up Transaction

```text
BEGIN

dedupe external reference
lock wallet
increase available
insert top-up
insert wallet transaction
insert ledger
insert outbox

COMMIT
```

---

# 121. Refund Transaction

```text
BEGIN

claim idempotency
lock original transaction
lock wallet
validate refundable
increase available
insert refund
insert ledger
insert outbox

COMMIT
```

---

# 122. Adjustment Transaction

```text
BEGIN

authorize / approve
claim idempotency
lock wallet
validate resulting balance
insert adjustment
update balance
insert ledger
insert audit
insert outbox

COMMIT
```

---

# 123. Ledger/Balance Atomicity

Never:

```text
update balance without ledger
```

Never:

```text
insert financial ledger effect without matching balance change
```

Both belong in one local transaction.

---

# 124. Lost Update Protection

Do not:

```text
read balance
calculate in application
write new balance
```

without concurrency control.

Use:

```text
atomic SQL
row lock
optimistic version with retry
```

---

# 125. Lock Ordering

For future multi-wallet operation:

```text
sort wallet IDs
lock deterministically
```

to reduce deadlocks.

Current MVP mostly touches one Wallet.

---

# 126. High-Contention Wallet

Monitor:

```text
lock wait
transaction latency
deadlock
retry count
```

Do not add sharding before evidence.

---

# 127. Customer Balance Endpoint

```text
GET /api/v1/wallet
```

Example:

```json
{
  "data": {
    "wallet_id": "WAL001",
    "currency": "USD",
    "available_balance": "25.50",
    "reserved_balance": "5.00",
    "status": "ACTIVE"
  }
}
```

---

# 128. Customer Statement Endpoint

```text
GET /api/v1/wallet/transactions
```

Return:

```text
date
type
amount
direction
reference
balance_after
```

---

# 129. Statement Pagination

Cursor:

```text
created_at DESC
ledger_entry_id DESC
```

---

# 130. Balance Read Consistency

Financial balance normally requires:

```text
strong read-after-write
```

Use authoritative DB for critical post-transaction reads.

---

# 131. Redis Guidance

Redis may cache only non-authoritative:

```text
wallet summary
rate-limit state
```

Never authoritative for:

```text
balance
reservation
ledger
```

---

# 132. Cache Failure

Wallet correctness must not depend on Redis.

PostgreSQL remains authoritative.

---

# 133. Internal Wallet Contracts

Core:

```text
ReserveFunds
CaptureFunds
ReleaseFunds
RefundFunds
GetWallet
```

Other internal/application contracts:

```text
CreditTopUp
AdjustWallet
BlockWallet
UnblockWallet
ReconcileWallet
```

---

# 134. gRPC Concept

```proto
service WalletService {
  rpc ReserveFunds(ReserveFundsRequest)
      returns (ReserveFundsResponse);

  rpc CaptureFunds(CaptureFundsRequest)
      returns (CaptureFundsResponse);

  rpc ReleaseFunds(ReleaseFundsRequest)
      returns (ReleaseFundsResponse);

  rpc RefundFunds(RefundFundsRequest)
      returns (RefundFundsResponse);

  rpc GetWallet(GetWalletRequest)
      returns (GetWalletResponse);
}
```

---

# 135. ReserveFunds Request

```text
customer_id / wallet_id
reference_type
reference_id
amount
currency
idempotency_key
expires_at optional
```

---

# 136. ReserveFunds Response

```text
wallet_id
reservation_id
status
amount
available_balance optional
reserved_balance optional
```

Only expose balances when the caller truly needs them.

---

# 137. CaptureFunds Request

```text
reservation_id
amount or capture remaining
idempotency_key
```

---

# 138. ReleaseFunds Request

```text
reservation_id
amount or release remaining
reason_code
idempotency_key
```

---

# 139. RefundFunds Request

```text
original_transaction_id / reference
amount
reason_code
idempotency_key
```

---

# 140. Wallet Error Catalog

Source candidates:

```text
WALLET_NOT_FOUND
WALLET_BLOCKED
WALLET_CLOSED
WALLET_CURRENCY_MISMATCH
WALLET_INSUFFICIENT_BALANCE
WALLET_LIMIT_EXCEEDED
RESERVATION_NOT_FOUND
RESERVATION_ALREADY_CAPTURED
RESERVATION_ALREADY_RELEASED
RESERVATION_EXPIRED
CAPTURE_AMOUNT_EXCEEDS_RESERVED
REFUND_AMOUNT_EXCEEDS_CAPTURED
TOPUP_DUPLICATE
TOPUP_NOT_CONFIRMED
ADJUSTMENT_NOT_ALLOWED
IDEMPOTENCY_KEY_REUSED
WALLET_CONCURRENCY_CONFLICT
```

---

# 141. Error Mapping

Examples:

| Error | gRPC / HTTP |
|---|---|
| WALLET_NOT_FOUND | NOT_FOUND / 404 |
| WALLET_BLOCKED | FAILED_PRECONDITION / 409 |
| WALLET_INSUFFICIENT_BALANCE | FAILED_PRECONDITION / 422 |
| WALLET_CURRENCY_MISMATCH | INVALID_ARGUMENT / 400 |
| RESERVATION_NOT_FOUND | NOT_FOUND / 404 |
| CAPTURE_AMOUNT_EXCEEDS_RESERVED | FAILED_PRECONDITION / 422 |
| REFUND_AMOUNT_EXCEEDS_CAPTURED | FAILED_PRECONDITION / 422 |
| IDEMPOTENCY_KEY_REUSED | ALREADY_EXISTS / 409 |

---

# 142. Wallet Events Published

```text
WalletCreated
WalletTopUpCompleted
WalletTopUpReversed
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletReservationExpired
WalletRefunded
WalletAdjusted
WalletBlocked
WalletUnblocked
```

---

# 143. WalletFundsReserved Event

Purpose-driven data:

```text
wallet_id
reservation_id
reference_type
reference_id
amount
currency
```

---

# 144. WalletFundsCaptured Event

Potential consumers:

```text
Ordering
Finance
Analytics
```

---

# 145. WalletTopUpCompleted Event

Potential consumers:

```text
Notification
Loyalty
Mission
Analytics
```

Later phases must consume the event, not query Wallet DB.

---

# 146. WalletRefunded Event

Data:

```text
wallet_id
original reference
refund reference
amount
currency
```

---

# 147. Event Ordering

Partition by:

```text
wallet_id
```

to preserve per-wallet event order.

---

# 148. Events Consumed

Possible:

```text
CustomerCreated
PaymentCaptured
PaymentRefunded
PaymentReversed
trusted Integration top-up confirmation
```

Only consume events with explicit semantics.

---

# 149. Payment-Captured Top-Up Deduplication

A `PaymentCaptured` used for Top-Up must carry a stable reference.

Wallet credits:

```text
exactly once
```

by:

```text
payment_id / provider reference / approved external reference
```

according to contract.

---

# 150. Top-Up Reconciliation

Compare:

```text
successful payment/provider top-up
↔
wallet_topups SUCCEEDED
↔
TOP_UP ledger entry
```

Detect missing and duplicate credits.

---

# 151. Wallet Reconciliation

Critical:

```text
ledger sum vs wallet balance
active reservation sum vs reserved balance
top-up source vs ledger
refund source vs ledger
```

---

# 152. Ledger Reconciliation Formula

For each Wallet:

```text
opening_available
+
SUM(available_delta)
=
current available_balance
```

and:

```text
SUM(reserved_delta)
=
current reserved_balance
```

according to opening model.

---

# 153. Reservation Reconciliation

```text
SUM(active reservation remaining)
=
wallet_accounts.reserved_balance
```

Mismatch is serious.

---

# 154. Refund Reconciliation

Compare:

```text
wallet_refunds
original captures
ledger REFUND entries
```

and ensure:

```text
total refund <= captured
```

---

# 155. Reconciliation Run

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

# 156. Reconciliation Mismatch

Possible:

```text
id
run_id
wallet_id
mismatch_type
expected_value
actual_value
reference
status
detected_at
resolved_at
resolution_note
```

---

# 157. No Silent Balance Repair

Do not:

```sql
UPDATE wallet_accounts
SET available_balance = ...
```

to hide mismatch.

Use:

```text
investigation
approved adjustment/reversal
audit
```

---

# 158. Reconciliation Mismatch Types

Possible:

```text
LEDGER_BALANCE_MISMATCH
RESERVATION_BALANCE_MISMATCH
MISSING_TOPUP_CREDIT
DUPLICATE_TOPUP_REFERENCE
MISSING_LEDGER_ENTRY
REFUND_MISMATCH
```

Names must enter shared error/operations catalog if exposed.

---

# 159. Security Level

Wallet is a high-risk financial domain.

Controls:

```text
strong service authentication
least privilege
restricted admin operations
MFA/step-up for sensitive adjustments
audit
rate limits
idempotency
reconciliation
encryption
```

---

# 160. Admin Permissions

Possible:

```text
wallet.read
wallet.adjust
wallet.adjust.approve
wallet.block
wallet.reconcile
```

---

# 161. Break-Glass Adjustment

Emergency financial adjustment must be:

```text
rare
time-limited
highly privileged
fully audited
alerted
```

---

# 162. Sensitive Logging

Never log:

```text
full auth tokens
provider secrets
private keys
```

Avoid unnecessary balance disclosure in general logs.

---

# 163. Data Classification

Likely:

```text
RESTRICTED:
wallet balances
ledger
financial references
adjustments

CONFIDENTIAL:
customer-wallet linkage
transaction history
```

---

# 164. Rate Limiting

Protect:

```text
top-up initiation
wallet balance endpoint
manual adjustment
refund
```

according to risk.

---

# 165. Fraud Signals — Future

Potential:

```text
rapid top-up/spend
many failed reserve attempts
rapid refunds
many devices
suspicious adjustments
```

Fraud engine may live outside Wallet.

---

# 166. Clean Architecture Layout

```text
wallet-service/
│
├── domain/
│   ├── wallet/
│   ├── reservation/
│   ├── ledger/
│   ├── transaction/
│   ├── topup/
│   ├── refund/
│   ├── reversal/
│   ├── adjustment/
│   ├── reconciliation/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── create/
│   ├── reserve/
│   ├── capture/
│   ├── release/
│   ├── topup/
│   ├── refund/
│   ├── reverse/
│   ├── adjust/
│   ├── block/
│   ├── query/
│   └── reconciliation/
│
├── adapter/in/
│   ├── grpc/
│   ├── rest/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── kafka/
│   ├── payment/
│   └── integration/
│
└── config/
```

---

# 167. Input Ports

Recommended:

```text
CreateWalletUseCase
GetWalletUseCase
GetWalletStatementUseCase
ReserveFundsUseCase
CaptureFundsUseCase
ReleaseFundsUseCase
CreditTopUpUseCase
RefundFundsUseCase
ReverseWalletTransactionUseCase
AdjustWalletUseCase
BlockWalletUseCase
UnblockWalletUseCase
ReconcileWalletUseCase
```

---

# 168. Output Ports

Recommended:

```text
LoadWalletPort
SaveWalletPort
LedgerPort
WalletTransactionPort
ReservationPort
TopUpPort
RefundPort
AdjustmentPort
IdempotencyPort
OutboxPort
ProcessedEventPort
AuditPort
ClockPort
```

---

# 169. ReserveFundsUseCase

```text
Validate Command
      ↓
Claim Idempotency
      ↓
Load Wallet
      ↓
Validate Status / Currency
      ↓
Atomic Reserve
      ↓
Create Reservation
      ↓
Create Wallet Transaction
      ↓
Create Ledger
      ↓
Outbox
      ↓
Return
```

---

# 170. CaptureFundsUseCase

```text
Validate Command
      ↓
Claim Idempotency
      ↓
Lock Reservation + Wallet
      ↓
Validate Remaining
      ↓
Reduce Reserved
      ↓
Update Capture State
      ↓
Ledger
      ↓
Outbox
```

---

# 171. ReleaseFundsUseCase

```text
Validate
      ↓
Claim Idempotency
      ↓
Lock
      ↓
Return Reserved → Available
      ↓
Ledger
      ↓
Outbox
```

---

# 172. CreditTopUpUseCase

```text
Validate Trusted Source
      ↓
Deduplicate External Reference
      ↓
Lock Wallet
      ↓
Credit Available
      ↓
Top-Up + Transaction + Ledger
      ↓
Outbox
```

---

# 173. RefundFundsUseCase

```text
Load Original Capture
      ↓
Validate Refundable Amount
      ↓
Claim Idempotency
      ↓
Lock Wallet + Original Transaction
      ↓
Credit Available
      ↓
Refund + Ledger
      ↓
Outbox
```

---

# 174. AdjustWalletUseCase

```text
Authorize
      ↓
Validate Approval
      ↓
Claim Idempotency
      ↓
Lock Wallet
      ↓
Apply Credit/Debit
      ↓
Ledger
      ↓
Audit
      ↓
Outbox
```

---

# 175. BlockWalletUseCase

Validate privileged actor.

Persist:

```text
old status
new status
reason
actor
occurred_at
```

Publish:

```text
WalletBlocked
```

when useful.

---

# 176. Query Model

Customer:

```text
balance
statement
transaction detail
```

Admin:

```text
wallet by customer
ledger history
reservation state
top-up history
reconciliation state
```

Use read DTOs rather than loading full aggregate graph for every query.

---

# 177. Strong Read After Write

After reserve/capture/top-up/refund:

```text
critical balance display
```

should read from authoritative PostgreSQL, not stale replica/cache.

---

# 178. Metrics

Business:

```text
wallet_topup_total
wallet_topup_amount
wallet_reserve_total
wallet_capture_total
wallet_release_total
wallet_refund_total
wallet_adjustment_total
wallet_insufficient_balance_total
```

Integrity:

```text
wallet_reconciliation_mismatch_total
wallet_negative_balance_detected_total
wallet_reservation_mismatch_total
duplicate_topup_detected_total
```

Technical:

```text
wallet_operation_latency
lock_wait
deadlock_total
DB_pool
outbox_backlog
expiry_backlog
```

---

# 179. SLIs

Potential:

```text
ReserveFunds success rate
P95 ReserveFunds latency
CaptureFunds success rate
Top-Up credit latency
Balance-read availability
Reconciliation health
```

Targets:

```text
TBD_SLO
```

---

# 180. Alerts

Alert on:

```text
negative balance
reserved > total / impossible balance relationship
reconciliation mismatch
duplicate top-up spike
capture failure spike
refund failure spike
reservation expiry backlog
DB deadlocks
outbox backlog
```

---

# 181. Dashboard

Show:

```text
wallet transaction volume
top-up volume
capture volume
refund volume
insufficient-balance rate
active reservations
expired reservation backlog
reconciliation mismatch
latency
lock waits
```

---

# 182. Structured Logging

Safe:

```text
wallet_id
customer_id where permitted
transaction_id
reservation_id
reference_id
operation
result
request_id
correlation_id
```

Avoid unnecessary exact balance disclosure.

---

# 183. Tracing

Trace:

```text
Ordering
  ↓
Wallet Reserve
  ↓
Wallet DB
  ↓
Ledger
  ↓
Outbox
```

Tag:

```text
operation
result
```

Avoid full financial details in span attributes.

---

# 184. Correlation ID

Pass through:

```text
Order
Payment
Wallet
Kafka event
```

for end-to-end financial debugging.

---

# 185. Required Runbooks

```text
Negative balance detected
Ledger/balance mismatch
Reservation mismatch
Duplicate top-up suspected
Wallet DB unavailable
High deadlock rate
Reservation expiry backlog
Outbox backlog
Incorrect manual adjustment
```

---

# 186. Negative Balance Runbook

Do not immediately set balance to zero.

Process:

```text
block Wallet if needed
inspect ledger
inspect concurrent operations
inspect reservations
reconcile source transactions
create approved correction if needed
add regression test
```

---

# 187. Duplicate Top-Up Runbook

```text
identify source reference
check Payment/provider truth
check wallet_topups uniqueness
check ledger
reverse only with approved financial entry
```

---

# 188. Ledger Mismatch Runbook

```text
freeze risky operations if needed
recompute ledger-derived balance
compare stored balance
identify missing/duplicate entry
apply approved correction
document root cause
```

---

# 189. Reservation Leak Runbook

If:

```text
reserved balance > sum(active reservation remaining)
```

or reservations never release:

```text
inspect expiry worker
identify orphan reservation
reconcile Order/Payment state
release only through controlled operation
```

---

# 190. Backup

Back up:

```text
wallet accounts
wallet transactions
ledger
reservations
top-ups
refunds
adjustments
reconciliation
idempotency as required
processed events where required
outbox
```

Wallet is Tier-1 financial data.

---

# 191. Restore

After restore:

```text
reconcile ledger vs balance
reconcile reservations
reconcile top-up source
reconcile Order captures/refunds
repair/replay outbox
```

---

# 192. Restore Danger

Old restore can:

```text
lose top-up credit
resurrect spent balance
lose capture
resurrect released reservation
```

Therefore financial reconciliation is mandatory.

---

# 193. Disaster Recovery

Define:

```text
RPO
RTO
backup frequency
PITR
event replay
top-up source reconciliation
order/payment reconciliation
secret/key recovery
```

Decision:

```text
WALLET_RPO = TBD_DR
WALLET_RTO = TBD_DR
```

---

# 194. Flyway Plan

Source example:

```text
V1__create_wallet_accounts.sql
V2__create_wallet_transactions.sql
V3__create_wallet_ledger_entries.sql
V4__create_wallet_reservations.sql
V5__create_wallet_topups.sql
V6__create_wallet_refunds.sql
V7__create_wallet_adjustments.sql
V8__create_wallet_idempotency.sql
V9__create_reconciliation_tables.sql
V10__create_processed_events.sql
V11__create_outbox.sql
```

Add reversal table through a new migration if modeled separately.

---

# 195. Balance-Type Migration

Changing money representation is high risk.

Source pattern:

```text
add new columns
dual calculate
backfill
reconcile
switch reads/writes
remove old later
```

---

# 196. Legacy Wallet Migration

Preserve:

```text
customer mapping
opening balance
currency
top-up references
transaction history where available
```

---

# 197. Opening Balance Migration

Create:

```text
OPENING_BALANCE
```

ledger entry.

Do not import balance with no history.

---

# 198. Migration Reconciliation

Before cutover compare:

```text
legacy balance
new ledger-derived balance
new WalletAccount balance
top-up totals
spend totals
refund totals
```

No unexplained mismatch.

---

# 199. Legacy Top-Up ACL

Legacy fields such as:

```text
provider transaction ID
BC document number
payment type
receipt reference
```

map to canonical:

```text
external_reference
source
provider_reference
business reference
```

through Integration/ACL.

---

# 200. Async Legacy Top-Up

Recommended:

```text
Provider confirms top-up
      ↓
Integration/Payment event
      ↓
Wallet Service
      ↓
Deduplicate
      ↓
Credit
      ↓
WalletTopUpCompleted
```

Legacy SQL synchronization remains outside core Wallet domain.

---

# 201. Testing Strategy

Required:

```text
Domain
Application
Persistence
Concurrency
Idempotency
Top-Up
Reserve/Capture/Release
Refund
Adjustment
Reconciliation
Events
Migration
Load
Failure
Security
```

---

# 202. Domain Tests

Test:

```text
reserve
capture
release
refund
top-up
adjustment
blocked Wallet
closed Wallet
currency mismatch
status transitions
```

---

# 203. Reserve Concurrency Test

Critical source case:

```text
available = 10
100 concurrent requests reserve 1
```

Expected:

```text
exactly 10 succeed
90 fail
no negative balance
```

---

# 204. Double-Spend Test

Also test:

```text
available = 10
two requests reserve 8
```

Expected:

```text
one success
one WALLET_INSUFFICIENT_BALANCE
```

---

# 205. Capture Tests

```text
full capture
partial capture if enabled
duplicate capture
capture after release
capture expired reservation
concurrent capture
```

---

# 206. Release Tests

```text
full release
partial release if enabled
duplicate release
release after capture
expiry vs manual release race
```

---

# 207. Top-Up Tests

```text
valid credit
duplicate external reference
same confirmation replayed
amount mismatch
currency mismatch
untrusted source
reversal
```

---

# 208. Refund Tests

```text
full refund
partial refund
duplicate refund
concurrent refunds
refund exceeds capture
currency mismatch
```

---

# 209. Adjustment Tests

```text
credit
debit
debit below zero
missing reason
unauthorized actor
approval required
duplicate retry
```

---

# 210. Idempotency Tests

For every financial command:

```text
same key same payload
same key changed payload
concurrent duplicate key
response lost + retry
```

Verify exactly one financial effect.

---

# 211. Ledger Atomicity Tests

Simulate failure between:

```text
balance update
ledger insert
```

Entire transaction must roll back.

---

# 212. Persistence Tests

Using PostgreSQL Testcontainers:

```text
unique customer/currency
unique top-up source/reference
reservation constraints
idempotency uniqueness
optimistic locking
Flyway
indexes
```

---

# 213. Reconciliation Tests

Create intentional:

```text
balance mismatch
reservation mismatch
duplicate top-up reference
missing ledger entry
refund mismatch
```

Verify detection.

---

# 214. Event Tests

Test:

```text
WalletTopUpCompleted
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletRefunded
WalletReservationExpired
outbox retry
partition ordering
```

---

# 215. Load Tests

Scenarios:

```text
many balance reads
many concurrent reserves
top-up burst
refund burst
hot Wallet
many independent Wallets
```

---

# 216. Hot Wallet Test

Watch:

```text
lock wait
throughput
deadlocks
retry count
transaction latency
```

Only introduce partitioning/sharding with evidence.

---

# 217. Failure Tests

Inject:

```text
DB timeout
deadlock
Kafka unavailable
process crash after commit before response
duplicate event
expiry worker crash
```

Verify safe retry and no duplicate financial value.

---

# 218. Security Tests

Verify:

```text
customer cannot adjust balance
wrong service scope cannot reserve
admin adjustment audited
top-up source authenticated
financial secret absent from logs
blocked-wallet rules enforced
```

---

# 219. Definition of Done — Reserve

- [ ] Atomic balance protection.
- [ ] Exact money.
- [ ] Status/currency validation.
- [ ] Idempotency.
- [ ] Reservation persistence.
- [ ] Wallet Transaction.
- [ ] Ledger entry.
- [ ] Outbox.
- [ ] Concurrency tests.
- [ ] Insufficient-balance behavior.
- [ ] Metrics/tracing.

---

# 220. Definition of Done — Capture

- [ ] Remaining amount validation.
- [ ] Idempotency.
- [ ] Reserved balance updated.
- [ ] Reservation status updated.
- [ ] Ledger.
- [ ] Event.
- [ ] Duplicate capture test.
- [ ] Concurrent capture test.
- [ ] Reconciliation.

---

# 221. Definition of Done — Release

- [ ] Releasable amount validation.
- [ ] Idempotency.
- [ ] Reserved → available atomically.
- [ ] Reservation status.
- [ ] Ledger.
- [ ] Event.
- [ ] Duplicate release safe.
- [ ] Expiry race tested.

---

# 222. Definition of Done — Top-Up

- [ ] Trusted source.
- [ ] External-reference dedupe.
- [ ] Exact amount/currency.
- [ ] Wallet credit atomic.
- [ ] Top-Up record.
- [ ] Wallet Transaction.
- [ ] Ledger.
- [ ] Event.
- [ ] Duplicate confirmation test.
- [ ] Reconciliation.

---

# 223. Definition of Done — Refund

- [ ] Original capture validated.
- [ ] Refund limit enforced.
- [ ] Idempotency.
- [ ] Concurrency safe.
- [ ] Available balance credited.
- [ ] Ledger.
- [ ] Event.
- [ ] Concurrent refund test.
- [ ] Reconciliation.

---

# 224. Definition of Done — Adjustment

- [ ] Privileged authorization.
- [ ] Reason required.
- [ ] Approval policy applied.
- [ ] Idempotency.
- [ ] Non-negative invariant protected.
- [ ] Ledger.
- [ ] Full audit.
- [ ] Event.
- [ ] Reconciliation visibility.

---

# 225. Wallet Architecture Review Checklist

## Ownership

- [ ] Wallet balance owned only here.
- [ ] Payment provider state remains in Payment.
- [ ] Order lifecycle remains in Ordering.
- [ ] Loyalty remains separate.

## Financial Correctness

- [ ] Exact money.
- [ ] Available/reserved separated.
- [ ] Ledger immutable.
- [ ] Balance + ledger atomic.
- [ ] Idempotency.
- [ ] Double-spend prevention.
- [ ] Reconciliation.

## Operations

- [ ] Top-Up.
- [ ] Reserve.
- [ ] Capture.
- [ ] Release.
- [ ] Refund.
- [ ] Reversal.
- [ ] Adjustment.

---

# 226. Data Review Checklist

- [ ] Unique Wallet per customer/currency.
- [ ] Ledger append-only.
- [ ] Reservation constraints.
- [ ] Top-Up external reference unique.
- [ ] Refund linkage.
- [ ] Idempotency table.
- [ ] Reconciliation tables.
- [ ] Outbox.
- [ ] Processed Events where needed.
- [ ] Retention defined.
- [ ] Indexes support statement/reconciliation queries.
- [ ] No cross-service DB foreign keys.

---

# 227. Contract Review Checklist

- [ ] Get Wallet.
- [ ] Wallet Statement.
- [ ] Reserve Funds.
- [ ] Capture Funds.
- [ ] Release Funds.
- [ ] Refund Funds.
- [ ] Top-Up confirmation.
- [ ] Idempotency semantics.
- [ ] Stable business references.
- [ ] Error catalog.
- [ ] Event schemas.
- [ ] Deadline/retry behavior.

---

# 228. Security Review Checklist

- [ ] Strong service authentication.
- [ ] Financial scopes.
- [ ] Adjustment permissions restricted.
- [ ] High-value approvals defined.
- [ ] Block/unblock restricted.
- [ ] Audit.
- [ ] Sensitive logs redacted.
- [ ] Top-Up source authenticated.
- [ ] Backup encryption.
- [ ] Break-glass procedure.

---

# 229. Operations Review Checklist

- [ ] Wallet metrics.
- [ ] Integrity metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Reservation expiry worker.
- [ ] Reconciliation worker.
- [ ] Runbooks.
- [ ] Backup/restore.
- [ ] Outbox monitoring.
- [ ] Deadlock/lock-wait monitoring.
- [ ] Admin audit tooling.

---

# 230. Production Readiness Checklist

Before production:

- [ ] Reserve concurrency test passes.
- [ ] Double-spend test passes.
- [ ] Duplicate top-up test passes.
- [ ] Duplicate capture test passes.
- [ ] Duplicate release test passes.
- [ ] Refund concurrency test passes.
- [ ] Ledger/balance atomicity test passes.
- [ ] Process crash after commit/retry tested.
- [ ] Reservation expiry tested.
- [ ] Top-Up trusted-source authentication tested.
- [ ] Reconciliation tested.
- [ ] Negative-balance alert tested.
- [ ] Admin adjustment permissions reviewed.
- [ ] High-value approval tested if enabled.
- [ ] Backup/restore tested.
- [ ] DR financial reconciliation tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Security review passed.
- [ ] Required TBD decisions resolved.

---

# 231. Recommended Implementation Sequence

Follow the source order:

```text
Step 1
Implement WalletAccount aggregate

Step 2
Implement Wallet persistence

Step 3
Implement immutable Ledger model

Step 4
Implement Balance endpoint

Step 5
Implement Reserve Funds

Step 6
Implement Idempotency

Step 7
Implement Capture

Step 8
Implement Release

Step 9
Implement Reservation expiry

Step 10
Implement Top-Up

Step 11
Implement Refund

Step 12
Implement Reversal

Step 13
Implement transactional Outbox / events

Step 14
Implement Statement API

Step 15
Implement Adjustment

Step 16
Implement Reconciliation

Step 17
Implement Admin tools / audit

Step 18
Implement Metrics / alerts / runbooks

Step 19
Implement Legacy Top-Up migration if required

Step 20
Backup / Restore / Reconciliation drill

Step 21
Phase 12 exit review

Step 22
Handoff to Phase 13 Service Communication
```

---

# 232. Step 1 — Bootstrap Acceptance

Verify:

```text
service starts
health endpoint works
wallet_db connects
Flyway runs
service authentication loads
Kafka/outbox integration loads
PostgreSQL Testcontainers work
Docker image builds
architecture tests pass
```

---

# 233. Step 2 — Wallet Aggregate Acceptance

Verify:

```text
non-negative balances
currency immutable
valid status transitions
closed Wallet blocks normal operations
reserve/capture/release/refund invariants
version persisted
```

---

# 234. Step 3 — Ledger Acceptance

Verify:

```text
append-only
available_delta
reserved_delta
business reference
Wallet Transaction linkage
balance-after fields if enabled
deterministic ordering
no UPDATE-based correction
```

---

# 235. Step 4 — Balance Endpoint Acceptance

Verify:

```text
authenticated customer gets own Wallet
available/reserved correct
currency correct
status correct
strong read-after-write where required
other customer's Wallet inaccessible
```

---

# 236. Step 5 — Reserve Acceptance

Verify:

```text
ACTIVE Wallet
correct currency
sufficient balance
atomic reserve
reservation inserted
ledger inserted
outbox inserted
version updated
duplicate retry safe
```

---

# 237. Step 6 — Reserve Concurrency Acceptance

Run:

```text
available = 10
100 × reserve 1 concurrently
```

Expected:

```text
10 succeed
90 fail
available = 0
reserved = 10
no negative value
ledger/reconciliation correct
```

---

# 238. Step 7 — Capture Acceptance

Verify:

```text
valid reservation
remaining amount
reserved decreases
captured increases
ledger created
duplicate safe
concurrent safe
```

---

# 239. Step 8 — Release Acceptance

Verify:

```text
releasable amount
reserved decreases
available increases
ledger created
duplicate safe
release/capture race safe
```

---

# 240. Step 9 — Expiry Acceptance

If enabled:

```text
expired ACTIVE reservation released
PARTIALLY_CAPTURED remaining handled
multiple workers safe
manual release race safe
backlog observable
```

---

# 241. Step 10 — Top-Up Acceptance

Verify:

```text
trusted confirmation only
source/reference unique
amount/currency exact
credit exactly once
ledger entry
WalletTopUpCompleted
duplicate event no-op
```

---

# 242. Step 11 — Top-Up Reversal Acceptance

Verify:

```text
original top-up remains immutable
new reversal entry created
financial history preserved
insufficient-funds policy applied
audit/reference exists
```

---

# 243. Step 12 — Refund Acceptance

Verify:

```text
original capture valid
remaining refundable correct
exact currency
credit once
duplicate safe
concurrent refunds <= captured
ledger/outbox correct
```

---

# 244. Step 13 — Adjustment Acceptance

Verify:

```text
permission
reason
approval if required
idempotency
non-negative result
ledger
audit
outbox
```

---

# 245. Step 14 — Reconciliation Acceptance

Verify:

```text
ledger-derived balance == Wallet balance
active reservation remaining == reserved balance
successful Top-Ups == top-up ledger
refunds == original capture/refund ledger
mismatches recorded
no silent repair
```

---

# 246. Step 15 — Security Acceptance

Verify:

```text
wrong service scope cannot reserve
customer cannot adjust
untrusted source cannot top-up
block rules work
break-glass audited
sensitive financial values handled per policy
```

---

# 247. Step 16 — Failure Acceptance

Inject:

```text
DB timeout
deadlock
Kafka unavailable
process crash after commit before response
duplicate PaymentCaptured
expiry worker crash
```

Verify no duplicate financial effect.

---

# 248. Step 17 — Restore Acceptance

After restore:

```text
ledger/balance reconciliation
reservation reconciliation
Top-Up source reconciliation
Order capture/refund reconciliation
outbox replay/repair
no resurrected spendable value
```

---

# 249. Recommended Phase 12 Work Breakdown

Suggested tickets:

```text
WAL-001 Bootstrap wallet-service
WAL-002 Create wallet_db / Flyway baseline
WAL-003 Implement Money value object
WAL-004 Implement WalletAccount aggregate
WAL-005 Implement WalletStatus
WAL-006 Implement Wallet persistence
WAL-007 Implement one-wallet-per-customer/currency constraint
WAL-008 Implement WalletTransaction
WAL-009 Implement LedgerEntry
WAL-010 Implement ledger delta model
WAL-011 Implement ledger append-only persistence
WAL-012 Implement GET /wallet
WAL-013 Implement Wallet statement API
WAL-014 Implement statement cursor pagination
WAL-015 Implement Reservation aggregate
WAL-016 Implement ReserveFunds
WAL-017 Implement atomic reserve SQL / lock strategy
WAL-018 Implement Reserve idempotency
WAL-019 Implement reserve request hashing
WAL-020 Implement insufficient-balance behavior
WAL-021 Implement CaptureFunds
WAL-022 Implement Capture idempotency
WAL-023 Implement ReleaseFunds
WAL-024 Implement Release idempotency
WAL-025 Implement Reservation expiry
WAL-026 Implement expiry worker concurrency
WAL-027 Implement TopUp aggregate
WAL-028 Implement trusted Top-Up source validation
WAL-029 Implement external-reference dedupe
WAL-030 Implement CreditTopUp
WAL-031 Implement Top-Up reversal
WAL-032 Implement Refund aggregate
WAL-033 Implement RefundFunds
WAL-034 Implement refund idempotency
WAL-035 Implement refund concurrency protection
WAL-036 Implement Reversal model
WAL-037 Implement Adjustment aggregate
WAL-038 Implement AdjustWallet
WAL-039 Implement adjustment approval
WAL-040 Implement adjustment audit
WAL-041 Implement wallet block/unblock
WAL-042 Implement opening-balance migration support
WAL-043 Implement transactional outbox
WAL-044 Implement Wallet events
WAL-045 Implement processed-event dedupe
WAL-046 Implement PaymentCaptured Top-Up consumer
WAL-047 Implement PaymentRefunded/Reversed handling if approved
WAL-048 Implement reconciliation runs
WAL-049 Implement ledger/balance reconciliation
WAL-050 Implement reservation reconciliation
WAL-051 Implement Top-Up reconciliation
WAL-052 Implement refund reconciliation
WAL-053 Implement mismatch workflow
WAL-054 Implement admin Wallet query
WAL-055 Implement admin permissions
WAL-056 Implement break-glass control
WAL-057 Implement rate limits
WAL-058 Implement domain tests
WAL-059 Implement reserve concurrency tests
WAL-060 Implement capture tests
WAL-061 Implement release tests
WAL-062 Implement Top-Up tests
WAL-063 Implement refund tests
WAL-064 Implement adjustment tests
WAL-065 Implement idempotency tests
WAL-066 Implement ledger atomicity tests
WAL-067 Implement persistence tests
WAL-068 Implement event/outbox tests
WAL-069 Implement reconciliation tests
WAL-070 Implement security tests
WAL-071 Implement load/hot-Wallet tests
WAL-072 Implement failure tests
WAL-073 Implement metrics/traces/logging
WAL-074 Implement dashboard/alerts
WAL-075 Write Wallet runbooks
WAL-076 Backup/restore/reconciliation drill
WAL-077 Implement legacy Wallet migration if required
WAL-078 Implement legacy Top-Up ACL mapping if required
WAL-079 Complete ADRs/policy freeze
WAL-080 Phase 12 exit review
```

---

# 250. Minimum Viable Wallet Service

Source-defined first production-capable version:

```text
One Wallet per customer/currency
Available balance
Reserved balance
Immutable ledger
Reserve
Capture
Release
Top-Up
Refund
Idempotency
Concurrency protection
Outbox events
Reconciliation
Customer balance/statement
Admin audit
```

Do not postpone:

```text
immutable ledger
idempotency
double-spend protection
reconciliation
```

---

# 251. Recommended Initial Scope

Required:

```text
WalletAccount
one Wallet per customer/currency
available + reserved balances
immutable ledger
WalletTransaction
Reserve
Capture
Release
Idempotency
strong concurrency
Top-Up
trusted Top-Up dedupe
Refund
Outbox
Statement
Reconciliation
Admin audit
Security
Observability
Backup/restore
```

Conditional:

```text
reservation expiry
partial capture
partial release
Top-Up reversal
manual adjustment
Wallet block/unblock
```

Future unless required:

```text
multi-currency conversion
transfers
cashback sub-wallet
gift wallet
expiry buckets
corporate Wallet
advanced limits
double-entry accounting
fraud scoring
```

---

# 252. Out of Initial Scope Unless Approved

```text
Peer-to-peer transfer
Cross-currency transfer
Sub-wallet hierarchy
Gift-card ledger
Cashback expiry engine
Corporate shared wallets
General-ledger accounting
Wallet interest
Credit/overdraft product
Automated debt collection
```

---

# 253. Phase 12 ADRs

Recommended:

```text
ADR-WAL-001 Wallet ID / creation strategy
ADR-WAL-002 One Wallet per customer/currency
ADR-WAL-003 Exact money representation
ADR-WAL-004 Available/reserved balance model
ADR-WAL-005 Immutable ledger model
ADR-WAL-006 Reserve concurrency strategy
ADR-WAL-007 Reservation uniqueness/reference
ADR-WAL-008 Partial capture/release policy
ADR-WAL-009 Reservation expiry
ADR-WAL-010 Top-Up trusted sources
ADR-WAL-011 Top-Up external-reference dedupe
ADR-WAL-012 Top-Up reversal insufficient-funds policy
ADR-WAL-013 Refund model
ADR-WAL-014 Adjustment approval policy
ADR-WAL-015 Wallet status/block operation matrix
ADR-WAL-016 Reconciliation model
ADR-WAL-017 Strong-read strategy
ADR-WAL-018 Ledger hash chain
ADR-WAL-019 Legacy opening-balance migration
```

---

# 254. Phase 12 Policy Freeze Checklist

Before production resolve:

- [ ] Wallet ID strategy.
- [ ] Wallet creation strategy.
- [ ] Supported currencies.
- [ ] One Wallet per customer/currency.
- [ ] Money precision.
- [ ] Wallet statuses.
- [ ] BLOCKED operation matrix.
- [ ] SUSPENDED operation matrix.
- [ ] Wallet closure rules.
- [ ] Reserve concurrency mechanism.
- [ ] Reservation uniqueness.
- [ ] Reservation TTL.
- [ ] Partial capture.
- [ ] Partial release.
- [ ] Capture timing with Ordering.
- [ ] Trusted Top-Up sources.
- [ ] Top-Up external reference.
- [ ] Top-Up reversal policy.
- [ ] Reversal insufficient-funds policy.
- [ ] Refund partial/full support.
- [ ] Refund reason catalog.
- [ ] Adjustment reason catalog.
- [ ] Adjustment permission model.
- [ ] Large-adjustment threshold.
- [ ] Dual-control policy.
- [ ] Break-glass policy.
- [ ] Wallet limits if required.
- [ ] Opening balance migration rules.
- [ ] Ledger balance-after fields.
- [ ] Wallet sequence requirement.
- [ ] Ledger hashing.
- [ ] Redis cache scope.
- [ ] Reconciliation frequency.
- [ ] Auto-repair scope.
- [ ] Retention.
- [ ] SLO targets.
- [ ] Alert thresholds.
- [ ] RPO/RTO.

---

# 255. Phase 12 Completion Tree

```text
PHASE 12 — WALLET SERVICE

├── Service Foundation                         ✅
│   ├── Spring Boot
│   ├── PostgreSQL
│   ├── Flyway
│   ├── REST/gRPC
│   └── Security
│
├── Wallet Domain                              ✅
│   ├── WalletAccount
│   ├── Status
│   ├── Currency
│   ├── Available Balance
│   └── Reserved Balance
│
├── Immutable Ledger                           ✅
│   ├── WalletTransaction
│   ├── LedgerEntry
│   ├── Available Delta
│   ├── Reserved Delta
│   └── Append Only
│
├── Reservation Lifecycle                      ✅
│   ├── Reserve
│   ├── Capture
│   ├── Release
│   └── Expiry Conditional
│
├── Top-Up                                     ✅
│   ├── Trusted Source
│   ├── Dedupe
│   ├── Credit
│   └── Reversal
│
├── Refund                                     ✅
├── Adjustment                                 ✅ / Conditional
├── Idempotency                                ✅
├── Concurrency / Double-Spend                 ✅
├── Reconciliation                             ✅
├── Customer Balance / Statement               ✅
├── Events / Outbox                            ✅
├── Security / Audit                           ✅
├── Testing                                    ✅
├── Observability                              ✅
├── Backup / Restore                           ✅
├── Runbooks                                   ✅
└── ADR / Policy Freeze                        ✅
```

---

# 256. Exit Criteria — Ownership

The team can explain:

```text
What does Wallet own versus Payment and Ordering?
```

Expected:

```text
Wallet owns stored monetary value and ledger.
Payment owns provider lifecycle.
Ordering owns purchase lifecycle.
```

---

# 257. Exit Criteria — Balance

The team can demonstrate:

```text
available
reserved
total value
```

and how each financial operation changes them.

---

# 258. Exit Criteria — Ledger

The team can answer:

```text
Can every current balance be explained by immutable ledger entries?
```

Expected:

```text
yes
```

---

# 259. Exit Criteria — Double Spend

The team can prove concurrent reserves cannot spend the same available money twice.

---

# 260. Exit Criteria — Idempotency

The team can prove retries do not duplicate:

```text
reserve
capture
release
top-up
refund
adjustment
```

---

# 261. Exit Criteria — Top-Up

The team can identify exactly which trusted sources are allowed to credit Wallet and how each source is deduplicated.

---

# 262. Exit Criteria — Refund / Reversal

The team can explain:

```text
refund restores prior captured spend
reversal corrects history through new immutable entries
```

without deleting financial history.

---

# 263. Exit Criteria — Reconciliation

The team can detect:

```text
ledger vs balance mismatch
reservations vs reserved balance mismatch
missing/duplicate Top-Up
refund mismatch
```

without silent balance edits.

---

# 264. Exit Criteria — Recovery

The team can restore Wallet DB and then safely reconcile:

```text
ledger
balances
reservations
Top-Up source
Order capture/refund state
outbox
```

before considering financial state healthy.

---

# 265. Exit Criteria — Security

The team can prove:

```text
only authorized services move money
customer cannot adjust
Top-Up source is authenticated
high-risk adjustment is controlled
all privileged corrections are audited
```

---

# 266. Exit Criteria — Operations

Operators can inspect:

```text
Wallet
available/reserved balance
ledger
Wallet Transaction
reservation
Top-Up
refund
adjustment
reconciliation mismatch
outbox
```

without directly editing financial tables.

---

# 267. Handoff to Phase 13

After Wallet is complete, your implementation roadmap moves to:

```text
PHASE 13 — Service Communication
```

At this point the first core business services exist:

```text
Identity
Customer
Catalog
Inventory
Cart
Promotion
Ordering
Payment
Wallet
```

Phase 13 will standardize how these services communicate:

```text
REST vs gRPC
sync vs async
commands vs queries vs events
deadlines
timeouts
retries
idempotency metadata
correlation IDs
trace propagation
failure semantics
versioning
```

Wallet already exposes the participant operations Phase 13 must standardize:

```text
ReserveFunds
CaptureFunds
ReleaseFunds
RefundFunds
GetWallet
```

and publishes stable financial events such as:

```text
WalletTopUpCompleted
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletRefunded
```

---

# 268. Future Handoff to Loyalty

When the roadmap reaches:

```text
PHASE 16 — Loyalty
```

Loyalty may consume:

```text
WalletTopUpCompleted
```

for points/mission/campaign logic where approved.

It must never:

```text
read wallet_db directly
modify Wallet balance
treat Wallet money as Loyalty points
```

---

# 269. Final Phase 12 Principle

Core lifecycle:

```text
Top-Up
   ↓
Available Balance
   ↓
Reserve
   ↓
Reserved Balance
   ├── Capture → Spent
   └── Release → Available Again
```

Refund:

```text
Captured Spend
      ↓
Refund
      ↓
Available Balance Restored
```

The most important implementation rules are:

```text
Wallet is the only owner of Wallet balance.
Available and reserved balances are separate.
Every balance change has immutable ledger history.
Balance and ledger update in one local transaction.
Reserve is concurrency-safe.
No financial operation applies twice.
Top-Up credits only after trusted confirmation.
Top-Up references are deduplicated.
UNKNOWN/untrusted Top-Up does not credit.
Capture cannot exceed reservation remaining.
Release cannot exceed reservation remaining.
Refund cannot exceed captured refundable amount.
Corrections use reversal/adjustment entries, never ledger mutation.
Manual adjustments are privileged and audited.
Redis is not authoritative for Wallet balance.
Strong read-after-write is used for critical balance reads.
Reconciliation continuously proves financial integrity.
Recovery includes financial reconciliation before trust is restored.
```

---

**End of PHASE 12 — Wallet Service**
