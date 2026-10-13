---
title: "PART 15 — WALLET SERVICE"
---

# PART 15 — WALLET SERVICE

> **Document Role:** Defines the complete architecture, domain model, ledger model, balance model, transactional rules, concurrency strategy, idempotency, top-up/payment flows, reconciliation, testing strategy, and production standards for the Wallet Service.  
> **Previous Part:** PART 14 — Payment Service  
> **Next Part:** PART 16 — Loyalty Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, finance engineers, QA engineers, DevOps engineers, SREs, security engineers, technical leads.

---

# 2169 — Purpose

The Wallet Service owns the platform's internal stored-value account and ledger.

It answers:

```text
Does the customer have a wallet?
What is the available balance?
What amount is currently reserved?
Can funds be reserved?
Can a reservation be captured?
Can a reservation be released?
Was a top-up completed?
Was a refund applied?
Was a reversal applied?
Can every balance movement be explained?
```

The Wallet Service must protect against:

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

# 2170 — Wallet Service Responsibilities

Wallet Service owns:

```text
Wallet Account
Wallet Status
Available Balance
Reserved Balance
Currency
Wallet Ledger
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

Possible future responsibilities:

```text
Multi-currency wallet
Wallet limits
Peer-to-peer transfer
Cashback balance
Gift balance
Expiry buckets
Corporate wallet
Sub-wallets
```

---

# 2171 — Non-Responsibilities

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

Wallet may reference:

```text
customer_id
order_id
payment_id
topup_reference
```

without owning those domains.

---

# 2172 — Wallet Boundary

High-level:

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
                   ├── Top-Up Provider / Integration
                   └── Kafka Events
```

---

# 2173 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Wallet | Stored-value account owned by a customer |
| Available Balance | Funds available for new spending |
| Reserved Balance | Funds held for pending transaction |
| Ledger Entry | Immutable record of wallet value movement |
| Top-Up | Adding value to wallet |
| Reserve | Move value from available to reserved |
| Capture | Consume reserved funds |
| Release | Return reserved funds to available |
| Refund | Return previously captured funds |
| Reversal | Counter-entry correcting/reversing prior movement |
| Adjustment | Authorized manual/system balance correction |
| Reference | Business link explaining why a movement happened |
| Wallet Transaction | Domain operation creating one or more ledger entries |

---

# 2174 — Wallet Aggregate

Possible aggregate root:

```text
WalletAccount
```

State:

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

# 2175 — Wallet Status

Recommended:

```text
ACTIVE
BLOCKED
SUSPENDED
CLOSED
```

Meaning:

```text
ACTIVE    → normal usage
BLOCKED   → spending/top-up restricted by security/operations policy
SUSPENDED → temporarily unavailable
CLOSED    → no new transactions
```

---

# 2176 — Wallet State Transitions

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
  terminal
```

Exact transitions depend on business policy.

---

# 2177 — Wallet Invariants

Core invariants:

```text
available_balance >= 0
reserved_balance >= 0
currency immutable after first financial movement unless migration process exists
capture amount <= reservation remaining
release amount <= reservation remaining
refund amount <= captured refundable amount
duplicate reference/idempotency must not create duplicate value
closed wallet cannot receive normal new operations
```

---

# 2178 — Balance Formula

Simple wallet:

```text
total_wallet_value
=
available_balance
+
reserved_balance
```

Reserve changes composition, not total value.

---

# 2179 — Reserve Formula

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

# 2180 — Capture Formula

Capture 20 from reserved:

```text
available = 80
reserved = 0
```

Total becomes:

```text
80
```

because 20 was spent.

---

# 2181 — Release Formula

Reserve 20 then release 20:

```text
available = 100
reserved = 0
```

No spending occurred.

---

# 2182 — Refund Formula

After capture:

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

# 2183 — Ledger Principle

The ledger is immutable financial history.

Never fix history using:

```sql
UPDATE wallet_ledger_entries
SET amount = ...
```

Instead:

```text
create reversal/correction entry
```

---

# 2184 — Double-Entry vs Single-Account Ledger

Two approaches:

### Option A — Wallet-centric movement ledger

```text
TOP_UP +20
CAPTURE -5
REFUND +5
```

### Option B — Full double-entry accounting model

```text
Wallet Liability
Cash / Clearing
Revenue / Settlement
```

Initial platform wallet may use wallet-centric immutable ledger.

If finance requires general ledger accounting, introduce a proper double-entry accounting subsystem.

---

# 2185 — Ledger Entry

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

# 2186 — Ledger Entry Types

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

Reserve/release may use reserved-balance deltas rather than available-balance only.

---

# 2187 — Ledger Delta Model

A useful model stores:

```text
available_delta
reserved_delta
```

Example reserve 20:

```text
available_delta = -20
reserved_delta  = +20
```

Capture 20:

```text
available_delta = 0
reserved_delta  = -20
```

Top-up 20:

```text
available_delta = +20
reserved_delta  = 0
```

---

# 2188 — Ledger Balance Snapshot

Optionally store post-entry balances:

```text
available_balance_after
reserved_balance_after
```

Benefits:

```text
debugging
statement generation
reconciliation
```

But current balance remains on wallet account.

---

# 2189 — Ledger Ordering

Need deterministic order.

Use:

```text
created_at
+
ledger_entry_id
```

or per-wallet sequence:

```text
wallet_sequence
```

if strict ordering is required.

---

# 2190 — Wallet Transaction

A higher-level entity may group related ledger entries.

Example:

```text
wallet_transactions
-------------------
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

# 2191 — Wallet Transaction Types

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

# 2192 — Reservation Entity

Possible:

```text
wallet_reservations
-------------------
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

# 2193 — Reservation Status

Recommended:

```text
ACTIVE
PARTIALLY_CAPTURED
CAPTURED
RELEASED
EXPIRED
CANCELLED
```

Use only states required by business.

---

# 2194 — Reservation Invariants

```text
captured_amount >= 0
released_amount >= 0
captured_amount + released_amount <= original_amount
remaining_amount >= 0
```

where:

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

# 2195 — Wallet Reservation Reference

Typical:

```text
reference_type = ORDER
reference_id = ORD001
```

Unique rule may be:

```text
(wallet_id, reference_type, reference_id)
```

for one reservation per business obligation.

---

# 2196 — Reserve Funds

Input:

```text
wallet_id/customer_id
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

# 2197 — ReserveFunds Flow

```text
Validate wallet
      ↓
Check idempotency
      ↓
Lock/atomically update balance
      ↓
Verify available >= amount
      ↓
Decrease available
Increase reserved
      ↓
Create reservation
      ↓
Create ledger entry
      ↓
Create outbox event
      ↓
Commit
```

---

# 2198 — Insufficient Balance

Return stable error:

```text
WALLET_INSUFFICIENT_BALANCE
```

Do not expose sensitive internal arithmetic beyond necessary fields.

---

# 2199 — Reserve Idempotency

Repeated reserve for same business request must not hold funds twice.

Use:

```text
idempotency key
reference uniqueness
request hash
```

---

# 2200 — Concurrent Reserve

Example:

```text
available = 10
```

Two requests each reserve 8.

Only one may succeed.

This is a critical concurrency requirement.

---

# 2201 — Atomic Reserve SQL

Possible pattern:

```sql
UPDATE wallet_accounts
SET available_balance = available_balance - :amount,
    reserved_balance = reserved_balance + :amount,
    version = version + 1
WHERE id = :wallet_id
  AND status = 'ACTIVE'
  AND currency = :currency
  AND available_balance >= :amount;
```

Check affected row count.

---

# 2202 — Row Lock Alternative

```sql
SELECT *
FROM wallet_accounts
WHERE id = ?
FOR UPDATE;
```

Then validate and update.

This is simple and strong but can reduce throughput under contention.

---

# 2203 — Optimistic Lock Alternative

Use:

```text
version
```

when contention is moderate.

Financial correctness must be preserved under retry.

---

# 2204 — Recommended Reserve Strategy

For a high-value wallet:

```text
atomic conditional update
```

or:

```text
pessimistic row lock
```

is preferable for initial correctness.

---

# 2205 — Capture Reservation

Capture permanently spends reserved funds.

Input:

```text
reservation_id
amount
reference
idempotency_key
```

---

# 2206 — Capture Flow

```text
Load reservation
      ↓
Check idempotency
      ↓
Lock wallet/reservation
      ↓
Validate remaining amount
      ↓
Decrease reserved balance
      ↓
Increase captured amount
      ↓
Create ledger entry
      ↓
Update reservation status
      ↓
Outbox
      ↓
Commit
```

---

# 2207 — Capture Idempotency

Repeated:

```text
CaptureFunds(reference=ORD001)
```

must not spend twice.

---

# 2208 — Partial Capture

If business supports:

```text
reserve 20
capture 15
release 5
```

model explicitly.

Initial version may allow only full capture for simpler order payment.

---

# 2209 — Full Capture

When:

```text
captured_amount == original_amount
```

reservation becomes:

```text
CAPTURED
```

---

# 2210 — Release Reservation

Release returns unspent reserved funds.

Input:

```text
reservation_id
amount or release remaining
reason
idempotency_key
```

---

# 2211 — Release Flow

```text
Load reservation
      ↓
Lock wallet/reservation
      ↓
Calculate releasable amount
      ↓
Decrease reserved
Increase available
      ↓
Update reservation
      ↓
Ledger
      ↓
Outbox
      ↓
Commit
```

---

# 2212 — Release Idempotency

Repeated release is a no-op/same result.

Never credit twice.

---

# 2213 — Reservation Expiry

Optional expiry protects abandoned holds.

Example:

```text
expires_at
```

Worker:

```text
find ACTIVE expired reservations
      ↓
release remaining
      ↓
mark EXPIRED
```

---

# 2214 — Expiry Caution

Do not expire wallet reservation if business process intentionally requires long hold.

Order/payment policy must define duration.

---

# 2215 — Expiry Worker Idempotency

Multiple workers/retries must not double release.

Use:

```text
state transition
locking
idempotency
```

---

# 2216 — Top-Up

Top-up adds value into wallet.

Possible sources:

```text
external payment
bank
mobile provider
cashier
promotion credit
migration
```

---

# 2217 — Top-Up Aggregate

Possible:

```text
wallet_topups
-------------
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

# 2218 — Top-Up Status

Possible:

```text
PENDING
SUCCEEDED
FAILED
REVERSED
UNKNOWN
```

---

# 2219 — Top-Up Idempotency

Critical.

Provider retry or callback replay must not credit twice.

Unique candidates:

```text
(source, external_reference)
```

plus application idempotency.

---

# 2220 — Top-Up Flow

```text
Receive confirmed top-up
      ↓
Validate amount/currency
      ↓
Deduplicate source reference
      ↓
Lock wallet
      ↓
Increase available
      ↓
Insert top-up
      ↓
Insert ledger entry
      ↓
Outbox WalletTopUpCompleted
      ↓
Commit
```

---

# 2221 — Top-Up Confirmation

Do not credit from an untrusted client claim:

```text
"payment_success": true
```

Credit only from:

```text
Payment Service authoritative result
verified provider callback
trusted reconciliation/import
```

---

# 2222 — Top-Up Unknown Outcome

If provider state uncertain:

```text
do not credit
```

until authoritative confirmation exists.

---

# 2223 — Top-Up Reversal

If top-up was wrongly credited and must be reversed:

```text
create reversal/debit entry
```

Do not delete the original top-up ledger entry.

---

# 2224 — Reversal Insufficient Funds

What if credited funds were already spent?

Possible policies:

```text
allow negative wallet debt
block wallet and create receivable
reject automated reversal and escalate
```

This is a business/finance decision.

Do not silently force negative balance if invariant forbids it.

---

# 2225 — Refund

Wallet refund returns funds for prior wallet capture.

Reference:

```text
original wallet transaction / order
```

---

# 2226 — Refund Flow

```text
Validate original capture
      ↓
Check remaining refundable
      ↓
Lock wallet
      ↓
Increase available
      ↓
Increase refunded amount on original transaction
      ↓
Create ledger entry
      ↓
Outbox WalletRefunded
      ↓
Commit
```

---

# 2227 — Refund Invariants

```text
refund amount > 0
total refunded <= captured amount
currency same
reference valid
duplicate refund cannot credit twice
```

---

# 2228 — Refund Idempotency

Same refund key/request:

```text
returns same result
```

Same key different amount:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 2229 — Partial Refund

Possible:

```text
captured = 10
refund 4
remaining refundable = 6
```

---

# 2230 — Full Refund

When:

```text
refunded == captured
```

original transaction may be marked fully refunded.

---

# 2231 — Manual Adjustment

Adjustment changes balance outside normal business flow.

Examples:

```text
support correction
finance correction
migration correction
fraud recovery
```

---

# 2232 — Adjustment Types

```text
CREDIT
DEBIT
```

with required:

```text
reason_code
actor
approval if required
reference
```

---

# 2233 — Adjustment Authorization

Permissions:

```text
wallet.adjust
wallet.adjust.large
wallet.adjust.approve
```

High-value adjustments may require dual control.

---

# 2234 — Adjustment Audit

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

# 2235 — Adjustment Idempotency

Admin retries must not apply twice.

Use explicit:

```text
adjustment_id / idempotency key
```

---

# 2236 — Wallet Limits

Future/optional limits:

```text
max wallet balance
daily top-up limit
daily spend limit
single transaction limit
monthly top-up limit
```

These may be regulatory/business controls.

---

# 2237 — Limit Evaluation

Check before relevant transaction.

Example:

```text
current balance + topup <= max wallet balance
```

---

# 2238 — Currency Model

Initial recommendation:

```text
one wallet = one currency
```

If customer supports multiple currencies:

```text
one wallet account per currency
```

is simpler than mixing currencies in one balance.

---

# 2239 — Multi-Currency Warning

Avoid:

```text
one numeric balance with changing currency
```

Financial meaning becomes unsafe.

---

# 2240 — Exchange Conversion

If wallet conversion is supported:

```text
source debit
destination credit
exchange rate
fee
```

should be modeled as a separate atomic financial workflow.

Not part of MVP.

---

# 2241 — Wallet Account Creation

Possible event-driven flow:

```text
CustomerCreated
      ↓
Wallet Service
      ↓
Create Wallet
```

or lazy creation on first top-up.

---

# 2242 — Wallet Creation Idempotency

Unique:

```text
(customer_id, currency)
```

prevents duplicates.

---

# 2243 — Opening Balance

For migration:

```text
OPENING_BALANCE
```

ledger entry establishes the initial authoritative balance.

---

# 2244 — Opening Balance Audit

Store:

```text
source_system
migration_batch
approved amount
migration reference
```

---

# 2245 — Wallet Closure

Closure requires:

```text
available balance handled
reserved balance = 0
pending transactions resolved
```

Do not close with unexplained funds.

---

# 2246 — Wallet Block

Block may prevent:

```text
reserve
capture
top-up
refund
```

or only spending.

Policy must define operation-by-operation behavior.

---

# 2247 — Security Block vs Operational Block

Consider separate reason:

```text
FRAUD
SECURITY
SUPPORT
COMPLIANCE
TECHNICAL
```

---

# 2248 — Wallet Database Overview

Possible tables:

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

---

# 2249 — Wallet Accounts Table

Example:

```text
wallet_accounts
---------------
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

# 2250 — Wallet Transactions Table

```text
wallet_transactions
-------------------
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

# 2251 — Ledger Table

```text
wallet_ledger_entries
---------------------
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

# 2252 — Reservations Table

```text
wallet_reservations
-------------------
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

# 2253 — Top-Ups Table

```text
wallet_topups
-------------
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

# 2254 — Refunds Table

```text
wallet_refunds
--------------
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

# 2255 — Adjustments Table

```text
wallet_adjustments
------------------
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

# 2256 — Idempotency Table

```text
wallet_idempotency
------------------
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

# 2257 — Reconciliation Tables

```text
wallet_reconciliation_runs
wallet_reconciliation_mismatches
```

Mismatch examples:

```text
ledger sum != balance
active reservations != reserved balance
top-up confirmed externally but missing internally
duplicate external reference
```

---

# 2258 — Outbox

Candidate events:

```text
WalletCreated
WalletTopUpCompleted
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletRefunded
WalletAdjusted
WalletBlocked
WalletUnblocked
```

---

# 2259 — Processed Events

Use when consuming:

```text
CustomerCreated
PaymentCaptured
PaymentRefunded
```

or external top-up confirmation events.

---

# 2260 — Wallet Indexes

Likely:

```text
UNIQUE(customer_id, currency)
(wallet_id, created_at DESC)
(reference_type, reference_id)
(status, expires_at)
(source, external_reference)
```

---

# 2261 — Ledger Statement Index

Example:

```sql
CREATE INDEX idx_wallet_ledger_wallet_created
ON wallet_ledger_entries(wallet_id, created_at DESC);
```

---

# 2262 — Active Reservation Index

```sql
CREATE INDEX idx_wallet_reservation_active_expiry
ON wallet_reservations(expires_at)
WHERE status IN ('ACTIVE','PARTIALLY_CAPTURED');
```

---

# 2263 — Reserve Transaction

```text
BEGIN

claim idempotency
lock/update wallet
validate balance
create wallet transaction
create reservation
create ledger entry
update balances
insert outbox
complete idempotency

COMMIT
```

---

# 2264 — Capture Transaction

```text
BEGIN

claim idempotency
lock wallet/reservation
validate remaining
decrease reserved
update reservation captured amount
create transaction/ledger
insert outbox
complete idempotency

COMMIT
```

---

# 2265 — Release Transaction

```text
BEGIN

claim idempotency
lock wallet/reservation
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

# 2266 — Top-Up Transaction

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

# 2267 — Refund Transaction

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

# 2268 — Adjustment Transaction

```text
BEGIN

authorize/approve
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

# 2269 — Lock Ordering

For operations touching multiple wallets in future transfers:

```text
sort wallet IDs
lock deterministically
```

to reduce deadlock.

For current single-wallet operations this is simpler.

---

# 2270 — Lost Update Protection

Never use:

```text
read balance
calculate in application
write balance
```

without concurrency control.

Use:

```text
atomic SQL
row lock
optimistic version with retry
```

---

# 2271 — Double-Spend Scenario

Initial:

```text
available = 10
```

Two order requests reserve:

```text
8 + 8
```

Only one may succeed.

Test this explicitly under concurrency.

---

# 2272 — High-Contention Wallet

Some accounts may receive many operations.

Monitor:

```text
lock wait
transaction latency
deadlock
retry count
```

---

# 2273 — Ledger/Balance Atomicity

Never update balance without ledger.

Never add ledger movement without corresponding balance change where applicable.

Both belong in one local transaction.

---

# 2274 — Ledger Hashing

Optional high-assurance feature:

```text
entry_hash
previous_entry_hash
```

creates tamper-evident chain.

Use only if operational/compliance value justifies complexity.

---

# 2275 — Wallet Statement

Customer endpoint:

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

# 2276 — Wallet Balance Endpoint

```text
GET /api/v1/wallet
```

Response:

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

# 2277 — Internal gRPC Contract

Potential:

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

# 2278 — ReserveFunds Request

Fields:

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

# 2279 — ReserveFunds Response

```text
wallet_id
reservation_id
status
amount
available_balance
reserved_balance
```

Exact balances may be omitted from internal contract if not needed.

---

# 2280 — CaptureFunds Request

```text
reservation_id
amount or capture remaining
idempotency_key
```

---

# 2281 — ReleaseFunds Request

```text
reservation_id
amount or release remaining
reason_code
idempotency_key
```

---

# 2282 — RefundFunds Request

```text
original_transaction_id / reference
amount
reason_code
idempotency_key
```

---

# 2283 — Wallet Error Catalog

Candidate:

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

# 2284 — Error Mapping

Example:

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

# 2285 — Wallet Events Published

Candidate:

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

# 2286 — WalletFundsReserved Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "WALLET_FUNDS_RESERVED",
  "event_version": 1,
  "producer": "wallet-service",
  "data": {
    "wallet_id": "WAL001",
    "reservation_id": "WRES001",
    "reference_type": "ORDER",
    "reference_id": "ORD001",
    "amount": {
      "amount": "10.00",
      "currency": "USD"
    }
  }
}
```

---

# 2287 — WalletFundsCaptured Event

Useful for:

```text
Order workflow
Finance
Analytics
```

---

# 2288 — WalletTopUpCompleted Event

Potential consumers:

```text
Notification
Loyalty/Mission
Analytics
```

If missions depend on top-up activity, consume this event rather than querying wallet DB.

---

# 2289 — WalletRefunded Event

Data:

```text
wallet_id
original reference
refund reference
amount
currency
```

---

# 2290 — Event Ordering

Partition by:

```text
wallet_id
```

to preserve per-wallet order.

---

# 2291 — Events Consumed

Possible:

```text
CustomerCreated
PaymentCaptured for top-up
PaymentRefunded/Reversed for top-up correction
```

Only consume events whose semantics are clear.

---

# 2292 — Top-Up via Payment Service

Recommended:

```text
Customer initiates top-up
      ↓
Payment Service
      ↓
PaymentCaptured
      ↓
Wallet Service
      ↓
credit exactly once
```

Use provider/payment reference dedupe.

---

# 2293 — Direct Provider Top-Up

If external top-up integration directly confirms:

```text
Integration Service
      ↓ trusted event
Wallet Service
```

Wallet validates source reference/idempotency before crediting.

---

# 2294 — Top-Up Reconciliation

Compare:

```text
provider/payment top-up success
↔
wallet top-up ledger
```

Detect missing/duplicate credit.

---

# 2295 — Wallet Reconciliation

Critical reconciliations:

```text
ledger sum vs wallet balance
active reservation sum vs reserved balance
top-up source vs ledger
refund source vs ledger
```

---

# 2296 — Ledger Reconciliation Formula

For each wallet:

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

depending on opening model.

---

# 2297 — Reservation Reconciliation

```text
SUM(active reservation remaining)
=
wallet_accounts.reserved_balance
```

Any mismatch is serious.

---

# 2298 — Top-Up Reconciliation

Compare:

```text
successful external/payment topups
```

with:

```text
wallet_topups SUCCEEDED
ledger TOP_UP entries
```

---

# 2299 — Refund Reconciliation

Compare:

```text
wallet_refunds
original captures
ledger refund entries
```

Ensure total refund never exceeds captured amount.

---

# 2300 — Reconciliation Runs

Table:

```text
wallet_reconciliation_runs
--------------------------
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

# 2301 — Reconciliation Mismatches

```text
wallet_reconciliation_mismatches
--------------------------------
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

# 2302 — No Silent Balance Fix

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

# 2303 — Wallet Security

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

# 2304 — Wallet Admin Permissions

Possible:

```text
wallet.read
wallet.adjust
wallet.adjust.approve
wallet.block
wallet.reconcile
```

---

# 2305 — Large Adjustment Approval

Example:

```text
requested by Support
      ↓
approved by Finance
      ↓
executed
```

for amount above threshold.

---

# 2306 — Break-Glass Adjustment

Emergency adjustment must be:

```text
rare
time-limited
highly privileged
fully audited
alerted
```

---

# 2307 — Sensitive Logging

Never log:

```text
full auth tokens
provider secrets
private keys
```

Wallet amount/reference logs should follow finance/privacy policy.

---

# 2308 — Wallet Data Classification

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

# 2309 — Rate Limiting

Protect:

```text
top-up initiation
wallet balance endpoint
manual adjustment
refund
```

Balance reads may need reasonable user-level limits.

---

# 2310 — Fraud Signals

Possible future signals:

```text
rapid top-up/spend
many failed reserve attempts
rapid refund
many devices
suspicious adjustment
```

Fraud engine may live outside Wallet.

---

# 2311 — Clean Architecture Layout

Recommended:

```text
wallet-service/
│
├── domain/
│   ├── wallet/
│   ├── reservation/
│   ├── ledger/
│   ├── topup/
│   ├── refund/
│   ├── adjustment/
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
│   ├── adjust/
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
│   └── external/
│
└── config/
```

---

# 2312 — Input Ports

Examples:

```text
CreateWalletUseCase
GetWalletUseCase
GetWalletStatementUseCase
ReserveFundsUseCase
CaptureFundsUseCase
ReleaseFundsUseCase
CreditTopUpUseCase
RefundFundsUseCase
AdjustWalletUseCase
BlockWalletUseCase
UnblockWalletUseCase
ReconcileWalletUseCase
```

---

# 2313 — Output Ports

Examples:

```text
LoadWalletPort
SaveWalletPort
LedgerPort
ReservationPort
TopUpPort
RefundPort
AdjustmentPort
IdempotencyPort
OutboxPort
ProcessedEventPort
ClockPort
```

---

# 2314 — ReserveFundsUseCase

Pseudo:

```text
Validate command
      ↓
Claim idempotency
      ↓
Load wallet
      ↓
Check status/currency
      ↓
Atomic reserve
      ↓
Create reservation
      ↓
Create wallet transaction
      ↓
Create ledger
      ↓
Outbox
      ↓
Return
```

---

# 2315 — CaptureFundsUseCase

```text
Validate command
      ↓
Claim idempotency
      ↓
Lock reservation/wallet
      ↓
Validate remaining
      ↓
Reduce reserved
      ↓
Update capture state
      ↓
Ledger
      ↓
Outbox
```

---

# 2316 — ReleaseFundsUseCase

```text
Validate
      ↓
Claim idempotency
      ↓
Lock
      ↓
Return reserved to available
      ↓
Ledger
      ↓
Outbox
```

---

# 2317 — CreditTopUpUseCase

```text
Validate trusted source
      ↓
Deduplicate external reference
      ↓
Lock wallet
      ↓
Credit available
      ↓
TopUp + transaction + ledger
      ↓
Outbox
```

---

# 2318 — RefundFundsUseCase

```text
Load original capture
      ↓
Validate refundable amount
      ↓
Claim idempotency
      ↓
Lock wallet/original transaction
      ↓
Credit available
      ↓
Refund + ledger
      ↓
Outbox
```

---

# 2319 — AdjustWalletUseCase

```text
Authorize
      ↓
Validate approval
      ↓
Claim idempotency
      ↓
Lock wallet
      ↓
Apply credit/debit
      ↓
Ledger
      ↓
Audit
      ↓
Outbox
```

---

# 2320 — Wallet Query Model

Customer queries:

```text
balance
statement
transaction detail
```

Admin queries:

```text
wallet by customer
ledger history
reservation state
top-up history
reconciliation state
```

Use read DTOs.

---

# 2321 — Statement Pagination

Use cursor:

```text
created_at DESC, ledger_entry_id DESC
```

---

# 2322 — Balance Read Consistency

Wallet balance usually requires:

```text
strong read-after-write
```

Read authoritative DB, not stale replica, for critical balance display after transaction.

---

# 2323 — Redis Usage

Redis may cache non-critical:

```text
wallet summary
rate limits
```

but should not be authoritative for balance or reservation.

---

# 2324 — Cache Failure

Wallet financial operation must not depend on cache correctness.

PostgreSQL remains authoritative.

---

# 2325 — Wallet Metrics

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
DB pool
outbox backlog
expiry backlog
```

---

# 2326 — Wallet SLIs

Potential:

```text
ReserveFunds success rate
P95 ReserveFunds latency
CaptureFunds success rate
TopUp credit latency
Balance-read availability
Reconciliation health
```

---

# 2327 — Wallet Alerts

Alert on:

```text
negative balance
reserved > total
reconciliation mismatch
top-up duplicate spike
capture failure spike
refund failure spike
reservation expiry backlog
DB deadlocks
outbox backlog
```

---

# 2328 — Wallet Dashboard

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

# 2329 — Structured Logging

Safe:

```text
wallet_id
customer_id if permitted
transaction_id
reservation_id
reference_id
operation
result
request_id
correlation_id
```

Avoid excessive balance disclosure in general logs.

---

# 2330 — Tracing

Trace examples:

```text
Order
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

Do not put full sensitive financial details in span attributes.

---

# 2331 — Correlation ID

Pass through:

```text
Order
Payment
Wallet
Kafka event
```

to support end-to-end financial debugging.

---

# 2332 — Runbooks

Required:

```text
Negative balance detected
Ledger/balance mismatch
Reservation mismatch
Duplicate top-up suspected
Wallet DB unavailable
High deadlock rate
Expiry backlog
Outbox backlog
Incorrect manual adjustment
```

---

# 2333 — Negative Balance Runbook

Do not immediately force balance to zero.

Steps:

```text
block affected wallet if necessary
inspect ledger
inspect concurrent operations
inspect reservations
reconcile source transactions
create approved correction if needed
add regression test
```

---

# 2334 — Duplicate Top-Up Runbook

```text
identify source reference
check provider/payment truth
check wallet_topups uniqueness
check ledger
reverse only through approved financial entry
```

---

# 2335 — Ledger Mismatch Runbook

```text
freeze risky operations if needed
recompute ledger-derived balance
compare stored balance
identify missing/duplicate entry
apply approved correction
document root cause
```

---

# 2336 — Reservation Leak Runbook

If:

```text
reserved balance > active reservations
```

or old reservations never release:

```text
inspect expiry worker
identify orphan reservations
reconcile order/payment state
release only through controlled operation
```

---

# 2337 — Backup

Back up:

```text
wallet accounts
transactions
ledger
reservations
top-ups
refunds
adjustments
reconciliation
outbox
```

Wallet is Tier-1 financial data.

---

# 2338 — Restore

After restore:

```text
reconcile ledger vs balance
reconcile reservations
reconcile top-up source
reconcile order captures/refunds
replay/repair outbox
```

---

# 2339 — Restore Danger

Restoring old Wallet DB without external reconciliation can:

```text
lose top-up credit
resurrect spent balance
lose capture
resurrect released reservation
```

Recovery must include financial reconciliation.

---

# 2340 — Disaster Recovery

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

---

# 2341 — Flyway Migration Plan

Example:

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

---

# 2342 — Balance Type Migration

Changing money representation is high-risk.

Plan:

```text
add new columns
dual calculate
backfill
reconcile
switch reads/writes
remove old later
```

---

# 2343 — Legacy Wallet Migration

Migration must preserve:

```text
customer mapping
opening balance
currency
top-up references
transaction history where available
```

---

# 2344 — Opening Balance Migration

Create:

```text
OPENING_BALANCE
```

ledger entry instead of directly setting balance without history.

---

# 2345 — Migration Reconciliation

Before cutover compare:

```text
legacy balance
new ledger-derived balance
new wallet account balance
top-up totals
spend totals
refund totals
```

---

# 2346 — Top-Up Legacy Integration

If current legacy integration stores:

```text
provider transaction ID
BC document number
payment type
receipt reference
```

map those into canonical fields:

```text
external_reference
source
provider_reference
business reference
```

through Integration/ACL.

---

# 2347 — Async Top-Up Flow

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

Any legacy SQL synchronization occurs outside core Wallet domain via integration adapters.

---

# 2348 — Wallet Testing Strategy

Test:

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

# 2349 — Domain Tests

Test:

```text
reserve
capture
release
refund
top-up
adjustment
blocked wallet
closed wallet
currency mismatch
```

---

# 2350 — Reserve Concurrency Tests

Critical:

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

# 2351 — Capture Tests

Test:

```text
full capture
partial capture if supported
duplicate capture
capture after release
capture expired reservation
concurrent capture
```

---

# 2352 — Release Tests

Test:

```text
full release
partial release
duplicate release
release after capture
expiry + manual release race
```

---

# 2353 — Top-Up Tests

Test:

```text
valid credit
duplicate external reference
same callback repeated
amount mismatch
currency mismatch
untrusted source
reversal
```

---

# 2354 — Refund Tests

Test:

```text
full refund
partial refund
duplicate refund
concurrent refunds
refund exceeds capture
currency mismatch
```

---

# 2355 — Adjustment Tests

Test:

```text
credit
debit
debit below zero
missing reason
unauthorized
approval required
duplicate retry
```

---

# 2356 — Idempotency Tests

For every financial command:

```text
same key same payload
same key changed payload
concurrent duplicate key
response lost + retry
```

Verify one financial effect.

---

# 2357 — Ledger Atomicity Tests

Simulate failure between:

```text
balance update
ledger insert
```

Transaction must roll back both.

---

# 2358 — Reconciliation Tests

Create intentional:

```text
balance mismatch
reservation mismatch
duplicate top-up reference
missing ledger entry
```

Verify detection.

---

# 2359 — Persistence Tests

Using PostgreSQL Testcontainers:

```text
unique customer/currency
unique top-up source/reference
reservation constraints
idempotency uniqueness
optimistic locking
Flyway
```

---

# 2360 — Event Tests

Test:

```text
WalletTopUpCompleted
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletRefunded
outbox retry
partition ordering
```

---

# 2361 — Load Tests

Scenarios:

```text
many balance reads
many concurrent reserve requests
top-up burst
refund burst
hot wallet
many independent wallets
```

---

# 2362 — Hot Wallet Test

Example:

```text
single shared/business wallet
high concurrent debits
```

Watch:

```text
lock wait
throughput
deadlocks
retry
```

If this becomes a real requirement, partitioning/sharding strategy may be needed.

---

# 2363 — Failure Tests

Inject:

```text
DB timeout
deadlock
Kafka unavailable
process crash after commit before response
duplicate event
expiry worker crash
```

Verify safe retry.

---

# 2364 — Security Tests

Verify:

```text
user cannot adjust balance
service with wrong scope cannot reserve
admin adjustment audited
top-up source authenticated
no financial secret in logs
```

---

# 2365 — Definition of Done: Reserve

- [ ] Atomic balance protection.
- [ ] Idempotency.
- [ ] Reservation persistence.
- [ ] Ledger entry.
- [ ] Outbox.
- [ ] Concurrency tests.
- [ ] Insufficient-balance behavior.
- [ ] Metrics/tracing.

---

# 2366 — Definition of Done: Capture

- [ ] Remaining amount validation.
- [ ] Idempotency.
- [ ] Reserved-balance update.
- [ ] Ledger.
- [ ] Event.
- [ ] Duplicate capture test.
- [ ] Reconciliation.

---

# 2367 — Definition of Done: Top-Up

- [ ] Trusted source.
- [ ] External-reference dedupe.
- [ ] Exact amount/currency.
- [ ] Ledger.
- [ ] Event.
- [ ] Duplicate callback test.
- [ ] Reconciliation.

---

# 2368 — Definition of Done: Refund

- [ ] Original capture validation.
- [ ] Refund limit.
- [ ] Idempotency.
- [ ] Ledger.
- [ ] Event.
- [ ] Concurrency test.
- [ ] Reconciliation.

---

# 2369 — Wallet Review Checklist

## Ownership

- [ ] Wallet balance owned only here.
- [ ] Payment provider state remains in Payment Service.
- [ ] Order lifecycle remains external.

## Financial Correctness

- [ ] Exact money type.
- [ ] Available/reserved model.
- [ ] Immutable ledger.
- [ ] Atomic balance + ledger.
- [ ] Idempotency.
- [ ] Concurrency.
- [ ] Reconciliation.

## Operations

- [ ] Top-up.
- [ ] Reserve.
- [ ] Capture.
- [ ] Release.
- [ ] Refund.
- [ ] Reversal.
- [ ] Adjustment.

---

# 2370 — Data Review Checklist

- [ ] Unique wallet per customer/currency.
- [ ] Ledger append-only.
- [ ] Reservation constraints.
- [ ] Top-up external reference unique.
- [ ] Idempotency table.
- [ ] Reconciliation tables.
- [ ] Outbox.
- [ ] Retention defined.
- [ ] Indexes match statement/reconciliation queries.

---

# 2371 — Contract Review Checklist

- [ ] Get Wallet.
- [ ] Reserve Funds.
- [ ] Capture Funds.
- [ ] Release Funds.
- [ ] Refund Funds.
- [ ] Top-Up confirmation contract.
- [ ] Idempotency semantics.
- [ ] Error catalog.
- [ ] Event schemas.
- [ ] Deadlines/retries.

---

# 2372 — Security Review Checklist

- [ ] Strong service authentication.
- [ ] Financial scopes.
- [ ] Adjustment permissions restricted.
- [ ] High-risk approvals.
- [ ] Audit.
- [ ] Sensitive logs redacted.
- [ ] Provider/top-up source authenticated.
- [ ] Backup encryption.

---

# 2373 — Operations Review Checklist

- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Reservation expiry monitoring.
- [ ] Reconciliation.
- [ ] Negative-balance alert.
- [ ] Duplicate-top-up alert.
- [ ] Backup/restore.
- [ ] Runbooks.
- [ ] Outbox monitoring.

---

# 2374 — Production Readiness Checklist

Before production:

- [ ] Double-spend concurrency test passed.
- [ ] Duplicate top-up test passed.
- [ ] Duplicate capture test passed.
- [ ] Duplicate refund test passed.
- [ ] Ledger/balance atomicity tested.
- [ ] Reservation expiry tested.
- [ ] Adjustment approval tested.
- [ ] Reconciliation tested.
- [ ] Backup/restore tested.
- [ ] DR reconciliation procedure tested.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Security review passed.

---

# 2375 — Initial Implementation Order

Recommended:

```text
1. WalletAccount aggregate
2. Wallet persistence
3. Ledger model
4. Balance endpoint
5. Reserve Funds
6. Idempotency
7. Capture
8. Release
9. Reservation expiry
10. Top-Up
11. Refund
12. Reversal
13. Outbox events
14. Statement API
15. Adjustment
16. Reconciliation
17. Admin tools
18. Metrics/alerts
19. Legacy top-up migration
```

---

# 2376 — Minimum Viable Wallet Service

First production-capable version:

```text
One wallet per customer/currency
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

These are foundational financial controls.

---

# 2377 — Future Enhancements

Potential:

```text
Multi-currency
Transfers
Cashback sub-wallet
Gift balance
Balance expiry
Limits
Corporate wallets
Wallet statements export
Accounting integration
Double-entry ledger
Fraud scoring
```

---

# 2378 — PART 15 Deliverables

PART 15 produces:

1. Wallet Service responsibility definition.
2. Boundary from Payment and Ordering.
3. Wallet aggregate.
4. Wallet status model.
5. Available/reserved balance model.
6. Balance formulas.
7. Immutable ledger model.
8. Ledger delta model.
9. Wallet transaction model.
10. Reservation model.
11. Reserve flow.
12. Reserve concurrency.
13. Capture flow.
14. Release flow.
15. Reservation expiry.
16. Top-Up model.
17. Top-Up idempotency.
18. Top-Up reversal.
19. Refund model.
20. Partial/full refund.
21. Manual adjustment.
22. Wallet limits guidance.
23. Currency model.
24. Wallet creation/closure.
25. Database schema.
26. Transaction patterns.
27. Locking/concurrency.
28. Ledger/balance atomicity.
29. Customer REST contracts.
30. Internal gRPC contracts.
31. Error catalog.
32. Wallet event catalog.
33. Top-Up integration.
34. Wallet reconciliation.
35. Security controls.
36. Admin permissions.
37. Clean Architecture layout.
38. Input/output ports.
39. Read models.
40. Redis guidance.
41. Metrics/SLIs.
42. Alerts/dashboard.
43. Logging/tracing.
44. Runbooks.
45. Backup/restore.
46. DR.
47. Flyway migration.
48. Legacy wallet/top-up migration.
49. Testing strategy.
50. Concurrency/load tests.
51. Review checklists.
52. Production readiness.
53. Implementation order.

---

# 2379 — Exit Criteria

PART 15 is complete when the team can answer:

### Ownership

```text
What does Wallet own versus Payment and Ordering?
```

### Balance

```text
How are available and reserved balances calculated and protected?
```

### Ledger

```text
Can every balance change be explained by immutable ledger entries?
```

### Double Spend

```text
How do concurrent reserves prevent spending the same money twice?
```

### Idempotency

```text
How do retries avoid duplicate top-up, capture, release, and refund?
```

### Top-Up

```text
Which trusted source is allowed to credit the wallet?
```

### Refund/Reversal

```text
How do correction flows preserve historical truth?
```

### Reconciliation

```text
How do we detect balance/ledger/reservation/provider mismatches?
```

### Recovery

```text
How is financial correctness restored after DB recovery or partial failure?
```

If these answers are clear and tested, Wallet Service is ready for implementation.

---

# 2380 — Handoff to PART 16

PART 16 defines Loyalty Service.

```text
PART 15
Wallet Service
      ↓
Stored Value
Ledger
Top-Up / Spend
      ↓
PART 16
Loyalty Service
```

Loyalty Service will own:

```text
Points Account
Points Ledger
Earn
Redeem
Expiry
Tier
Reward
Loyalty Rules
Campaign Integration
Loyalty Reconciliation
```

The key separation is:

```text
Wallet
= monetary stored value

Loyalty
= non-cash reward value / engagement benefits
```

Mission and Promotion may initially remain modules inside Loyalty depending on the service-boundary decision from PART 03.

---

# PART 15 — Summary

The Wallet Service protects internal stored monetary value.

The core lifecycle is:

```text
Top-Up
   ↓
Available Balance
   ↓
Reserve
   ↓
Reserved Balance
   ├──> Capture → Spent
   └──> Release → Available Again
```

Refund lifecycle:

```text
Captured Spend
      ↓
Refund
      ↓
Available Balance Restored
```

The core accounting rule is:

```text
every balance change
must have
an immutable ledger explanation
```

The most important architecture rules are:

```text
Wallet is the only owner of wallet balance.
Available and reserved balances are separate.
Reserve operations are concurrency-safe.
No financial operation applies twice.
Ledger entries are immutable.
Balance and ledger update atomically.
Top-up uses trusted authoritative confirmation.
Refunds never exceed captured amounts.
Manual adjustments are privileged and audited.
Reconciliation continuously proves financial integrity.
```

The next chapter moves from monetary stored value to reward value:

```text
PART 16 — Loyalty Service
```

---

**End of PART 15 — Wallet Service**
