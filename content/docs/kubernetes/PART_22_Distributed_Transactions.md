---
title: "PART 22 — DISTRIBUTED TRANSACTIONS"
---

# PART 22 — DISTRIBUTED TRANSACTIONS

> **Document Role:** Defines the complete architecture, patterns, correctness rules, recovery model, persistence design, testing strategy, and production standards for distributed business transactions across microservices.  
> **Previous Part:** PART 21 — Service Communication  
> **Next Part:** PART 23 — Kafka / Event Architecture  
> **Status:** Platform Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Kafka, REST/gRPC, Flyway, OpenTelemetry  
> **Audience:** Backend engineers, software architects, platform engineers, QA engineers, DevOps engineers, SREs, technical leads.

---

# 3929 — Purpose

Distributed Transactions define how one business workflow remains correct when several independently owned services participate.

Examples:

```text
Create Order
  → reserve inventory
  → authorize payment
  → create/accept order
  → capture payment
```

```text
Cancel Order
  → cancel order
  → release inventory
  → refund payment
  → release wallet funds
```

```text
Complete Order
  → complete order
  → consume inventory
  → emit completion
  → loyalty / mission / notification process asynchronously
```

The main challenge is:

```text
there is no single ACID transaction
across multiple service databases.
```

---

# 3930 — Core Principle

Use:

```text
local ACID transactions
+
durable workflow state
+
idempotent commands
+
events
+
compensation
+
reconciliation
```

Do not attempt to simulate one global relational transaction across services.

---

# 3931 — What Is a Distributed Transaction?

A distributed business transaction is a workflow where:

```text
multiple services
each change their own authoritative state
to complete one business outcome
```

Example:

```text
Order Service
Inventory Service
Payment Service
Wallet Service
Promotion Service
```

may all participate in checkout.

---

# 3932 — Why Traditional ACID Is Not Enough

Local PostgreSQL transaction can guarantee:

```text
atomicity
consistency
isolation
durability
```

inside one service database.

It cannot guarantee all-or-nothing across:

```text
order_db
inventory_db
payment_db
wallet_db
promotion_db
```

without distributed transaction protocols.

---

# 3933 — Avoid Two-Phase Commit

Do not use distributed 2PC/XA as the default platform strategy.

Reasons:

```text
tight coupling
coordinator dependency
blocking failure modes
limited external-provider support
operational complexity
poor fit with Kafka/external APIs
```

Use Saga-based business transactions.

---

# 3934 — Distributed Transaction Building Blocks

Core building blocks:

```text
Saga
Orchestration
Choreography
Compensation
Outbox
Inbox
Idempotency
Retry
Timeout
DLQ
Ordering
Reconciliation
Durable Workflow State
```

---

# 3935 — Local Transaction Rule

Each service owns its local ACID transaction.

Example:

```text
Inventory Service:

BEGIN
reserve stock
insert reservation
insert outbox
COMMIT
```

No other service database participates in that transaction.

---

# 3936 — No Network Call Inside Long DB Transaction

Avoid:

```text
BEGIN
lock order
call Inventory
call Payment
call Wallet
COMMIT
```

Problems:

```text
long locks
deadlocks
timeout amplification
connection exhaustion
uncertain rollback semantics
```

---

# 3937 — Correct Network Boundary

Prefer:

```text
persist local intent/state
commit
      ↓
call dependency
      ↓
persist result in new local transaction
```

Durable state makes recovery possible.

---

# 3938 — Saga

A Saga is:

```text
sequence of local transactions
```

where failure is handled through:

```text
compensating business actions
```

rather than global rollback.

---

# 3939 — Saga Example

```text
Reserve Inventory
      ↓
Authorize Payment
      ↓
Create Order
      ↓
Capture Payment
```

If payment fails:

```text
Release Inventory
```

If capture fails after order is created:

```text
enter recovery/compensation workflow
```

according to business policy.

---

# 3940 — Compensation

Compensation is:

```text
a new business transaction
that semantically undoes or offsets an earlier action
```

Examples:

```text
ReserveInventory → ReleaseInventory
ReserveWallet    → ReleaseWallet
CapturePayment   → RefundPayment
IssueCoupon      → RestoreCoupon
```

---

# 3941 — Compensation Is Not Rollback

Database rollback:

```text
removes uncommitted local change
```

Compensation:

```text
creates another committed business action
```

History remains visible.

---

# 3942 — Compensation Must Be Idempotent

Repeated:

```text
ReleaseInventory
RefundPayment
ReleaseWalletFunds
```

must be safe.

Compensation may retry after:

```text
timeout
process crash
network failure
broker replay
```

---

# 3943 — Compensation May Fail

Do not assume:

```text
compensation always succeeds immediately
```

Example:

```text
payment refund provider unavailable
```

Saga may remain:

```text
COMPENSATION_PENDING
```

until recovery completes.

---

# 3944 — Compensation Is Domain-Specific

There is no generic:

```text
undo()
```

for all operations.

Each domain defines its compensation semantics.

---

# 3945 — Irreversible Actions

Some actions cannot truly be undone.

Examples:

```text
email already sent
physical food already prepared
external settlement already finalized
customer saw a notification
```

Compensation may instead be:

```text
refund
credit
apology
manual intervention
```

---

# 3946 — Saga Styles

Two major styles:

```text
ORCHESTRATION
CHOREOGRAPHY
```

---

# 3947 — Orchestration

One coordinator decides:

```text
which step happens next
```

Example:

```text
Order Service
  → ReserveInventory
  → AuthorizePayment
  → Create/Accept Order
  → CapturePayment
```

---

# 3948 — Choreography

Services react to events without a central coordinator.

Example:

```text
OrderCreated
  ↓
Inventory reserves
  ↓
InventoryReserved
  ↓
Payment authorizes
```

This can work but can become difficult to reason about for complex financial workflows.

---

# 3949 — Recommended Initial Strategy

For critical checkout:

```text
orchestration
```

is recommended.

For secondary effects:

```text
choreography
```

is recommended.

---

# 3950 — Why Orchestration for Checkout

Checkout has:

```text
strict sequencing
compensation
timeouts
financial risk
customer-visible result
```

A durable orchestrator provides clearer control.

---

# 3951 — Why Choreography for Secondary Effects

After `OrderCompleted`:

```text
Loyalty
Mission
Notification
Analytics
```

can react independently.

No single downstream result should normally block order completion.

---

# 3952 — Hybrid Architecture

Recommended platform pattern:

```text
Critical transaction
= orchestrated Saga

Secondary reactions
= event choreography
```

---

# 3953 — Saga Owner

Every Saga must have one owner.

Examples:

```text
Checkout Saga → Order Service
Order Cancellation Saga → Order Service
Wallet Top-Up Saga → Wallet or Payment owner
Reward Fulfillment Saga → Loyalty/Reward
```

---

# 3954 — Saga Owner Responsibilities

Saga owner manages:

```text
workflow state
step sequencing
timeouts
retries
compensation decisions
final outcome
recovery
observability
```

---

# 3955 — Participant Responsibilities

Participant service manages:

```text
its own state
its own invariants
local transaction
idempotency
local events
compensation API
```

---

# 3956 — Orchestrator Must Not Own Participant Rules

Order orchestrator may ask:

```text
ReserveInventory
```

Inventory decides:

```text
whether reservation is possible
```

Order must not duplicate stock logic.

---

# 3957 — Saga State

Saga state should be durable.

Possible:

```text
STARTED
INVENTORY_RESERVED
PAYMENT_AUTHORIZED
ORDER_CREATED
PAYMENT_CAPTURED
COMPLETED
COMPENSATING
COMPENSATION_PENDING
FAILED
```

---

# 3958 — Saga Instance

Possible fields:

```text
saga_id
saga_type
business_reference
status
current_step
started_at
updated_at
completed_at
version
```

---

# 3959 — Saga Step

Possible fields:

```text
step_id
saga_id
step_name
status
attempt_count
idempotency_key
request_reference
response_reference
started_at
completed_at
next_retry_at
last_error
```

---

# 3960 — Saga Step Status

Recommended:

```text
PENDING
IN_PROGRESS
SUCCEEDED
FAILED_RETRYABLE
FAILED_FINAL
UNKNOWN
COMPENSATING
COMPENSATED
```

---

# 3961 — Saga Persistence

Possible tables:

```text
saga_instances
saga_steps
saga_step_attempts
```

or service-specific workflow tables.

---

# 3962 — Generic vs Service-Specific Saga Tables

Generic engine:

```text
flexible
central framework
```

Service-specific:

```text
clearer business semantics
simpler queries
```

Initial recommendation:

```text
service-specific workflow model
```

unless many similar workflows justify a shared engine.

---

# 3963 — Avoid Over-Generalized Workflow Engine

Do not build:

```text
universal BPM engine
```

before real needs exist.

Start with explicit application code and durable state.

---

# 3964 — Saga ID

Use stable opaque ID:

```text
UUIDv7
ULID
UUID
```

---

# 3965 — Business Reference

Saga links to business object:

```text
order_id
topup_id
reward_assignment_id
```

Unique where one Saga per operation is expected.

---

# 3966 — Saga Idempotency

Starting the same business Saga twice must not create duplicate side effects.

Use:

```text
business_reference
operation
idempotency_key
```

---

# 3967 — Saga Command Reference

Every downstream command should include:

```text
saga_id
business_reference
idempotency_key
correlation_id
```

---

# 3968 — Stable Step Idempotency Key

Example:

```text
CHECKOUT:{order_id}:RESERVE_INVENTORY
CHECKOUT:{order_id}:AUTHORIZE_PAYMENT
CHECKOUT:{order_id}:CAPTURE_PAYMENT
```

Retry uses the same key.

---

# 3969 — Never Generate New Key on Retry

Bad:

```text
retry → new UUID
```

This may duplicate:

```text
reservation
charge
refund
```

Retry must reuse original operation identity.

---

# 3970 — Step Request Hash

Store:

```text
request_hash
```

for command arguments.

Same idempotency key with changed input:

```text
IDEMPOTENCY_CONFLICT
```

---

# 3971 — Step Attempt

One logical step may have multiple transport attempts.

Example:

```text
Step = AUTHORIZE_PAYMENT
Attempt 1 = timeout
Attempt 2 = status query
Attempt 3 = retry if safe
```

---

# 3972 — Unknown Outcome

Distributed transactions must model:

```text
UNKNOWN
```

explicitly.

Example:

```text
Payment Service may have authorized
but Order did not receive response
```

Do not treat unknown as failure automatically.

---

# 3973 — Unknown Outcome Recovery

Possible:

```text
retry same idempotent command
query participant by business reference
wait for event
run reconciliation
```

---

# 3974 — Participant Query Contract

Critical participant should support:

```text
GetOperationByReference
```

or equivalent.

Examples:

```text
GetInventoryReservation(order_id)
GetPaymentByOrder(order_id)
GetWalletReservation(order_id)
```

---

# 3975 — Operation Reference

Use stable references so recovery can ask:

```text
Did operation X already happen?
```

---

# 3976 — Saga Timeout

Each step has:

```text
deadline
timeout policy
recovery policy
```

Saga also has:

```text
overall timeout
```

---

# 3977 — Step Timeout vs Business Timeout

Transport timeout:

```text
500ms
```

may only mean:

```text
response not received
```

Business timeout:

```text
15 minutes
```

may mean:

```text
checkout abandoned
reservation should expire
```

They are different.

---

# 3978 — Reservation Timeout

Inventory/Wallet/Promotion reservations may expire after business TTL.

Saga must know:

```text
expires_at
```

and complete/cancel before expiry.

---

# 3979 — Timeout Ordering

Ensure:

```text
payment authorization TTL
wallet reservation TTL
inventory reservation TTL
coupon reservation TTL
```

are compatible with checkout Saga.

---

# 3980 — Reservation TTL Example

Illustrative:

```text
Promotion hold: 10 min
Inventory hold: 10 min
Wallet hold: 10 min
Payment authorization: provider-defined
```

Do not choose inconsistent TTLs accidentally.

---

# 3981 — Saga Recovery Worker

Worker scans:

```text
IN_PROGRESS
FAILED_RETRYABLE
UNKNOWN
COMPENSATION_PENDING
```

and continues safely.

---

# 3982 — Recovery Query

Example:

```sql
SELECT id
FROM checkout_sagas
WHERE status IN (
  'IN_PROGRESS',
  'FAILED_RETRYABLE',
  'UNKNOWN',
  'COMPENSATION_PENDING'
)
AND next_action_at <= NOW()
ORDER BY next_action_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

---

# 3983 — Multiple Recovery Workers

Use:

```text
SKIP LOCKED
version
lease
```

to prevent two pods from advancing the same Saga simultaneously.

---

# 3984 — Saga Version

Use optimistic version:

```text
version
```

for concurrent API/event/worker updates.

---

# 3985 — Saga Transition Function

Prefer explicit:

```text
saga.inventoryReserved()
saga.paymentAuthorized()
saga.captureFailed()
saga.beginCompensation()
```

over generic:

```text
setStatus(...)
```

---

# 3986 — Saga State Machine

Every Saga should define:

```text
valid state transitions
terminal states
retryable states
compensation states
```

---

# 3987 — Terminal Saga States

Typical:

```text
COMPLETED
FAILED
COMPENSATED
MANUAL_INTERVENTION
```

---

# 3988 — Manual Intervention

Some workflows cannot auto-resolve.

Example:

```text
payment captured
refund repeatedly fails
```

Saga may enter:

```text
MANUAL_INTERVENTION
```

with alert and runbook.

---

# 3989 — Manual Intervention Is Not Silent Failure

Persist:

```text
reason
failed step
external references
amount
last error
```

for operations team.

---

# 3990 — Checkout Saga

Representative participants:

```text
Order
Catalog
Promotion
Inventory
Payment
Wallet
```

Exact path depends on payment method.

---

# 3991 — Checkout Saga: Read Validation

First perform read-only validation:

```text
Catalog
Customer
Promotion preview
```

where possible.

Do not reserve scarce resources too early.

---

# 3992 — Checkout Saga: Resource Reservation

Typical:

```text
Reserve Promotion
Reserve Inventory
Reserve Wallet / Authorize Payment
```

---

# 3993 — Checkout Saga: Durable Order

Create durable Order once sufficient prerequisites exist.

Exact timing is a business decision.

---

# 3994 — Checkout Saga Variant A

```text
Validate
→ Reserve Promotion
→ Reserve Inventory
→ Authorize Payment
→ Create Order
→ Capture
→ Redeem Promotion
→ Complete Saga
```

---

# 3995 — Checkout Saga Variant B

```text
Create PENDING order/workflow
→ Reserve Promotion
→ Reserve Inventory
→ Authorize Payment
→ Activate Order
→ Capture
```

This may improve traceability but requires precise pending-order semantics.

---

# 3996 — Recommended Principle

Never allow:

```text
provider charge success
```

without a durable internal reference capable of recovery.

---

# 3997 — Catalog Validation in Saga

Catalog validation is read-only and usually has no compensation.

If catalog changes after validation but before final order creation:

```text
use accepted snapshot/version
```

or revalidate according to checkout policy.

---

# 3998 — Promotion Reservation in Saga

Command:

```text
ReservePromotion
```

Compensation:

```text
ReleasePromotion
```

Final:

```text
RedeemPromotion
```

---

# 3999 — Inventory Reservation in Saga

Command:

```text
ReserveInventory
```

Compensation:

```text
ReleaseInventory
```

Final:

```text
ConsumeInventory
```

at business milestone.

---

# 4000 — Wallet Reservation in Saga

Command:

```text
ReserveFunds
```

Compensation:

```text
ReleaseFunds
```

Final:

```text
CaptureFunds
```

---

# 4001 — External Payment in Saga

Command:

```text
AuthorizePayment
```

Compensation:

```text
ReverseAuthorization
```

After capture:

```text
RefundPayment
```

may be required instead.

---

# 4002 — Compensation Depends on Payment Phase

If:

```text
AUTHORIZED
```

then:

```text
VOID / REVERSE
```

If:

```text
CAPTURED
```

then:

```text
REFUND
```

Do not use one generic compensation command.

---

# 4003 — Order Creation Failure After Reservation

If:

```text
Inventory reserved
Wallet reserved
Order DB create fails
```

Saga must:

```text
release wallet
release inventory
release promotion
```

---

# 4004 — Payment Unknown During Checkout

If payment result is unknown:

```text
do not create second payment attempt blindly
```

Saga enters:

```text
PAYMENT_UNKNOWN
```

then resolves status.

---

# 4005 — Inventory Unknown During Checkout

If reservation call times out:

```text
query reservation by order/saga reference
```

before creating another reservation.

---

# 4006 — Promotion Unknown During Checkout

Same:

```text
query reservation
```

or retry same idempotency key.

---

# 4007 — Checkout Success

Saga terminal condition:

```text
required resources committed
order durable
financial state valid
```

Secondary effects are emitted afterward.

---

# 4008 — Checkout Result to Client

Possible outcomes:

```text
SUCCESS
REJECTED
PENDING
UNKNOWN/PROCESSING
```

Do not force all workflows into instant success/failure if external state is unresolved.

---

# 4009 — PROCESSING Response

For slow/unknown workflow:

```text
HTTP 202
```

may return:

```text
order/workflow reference
status endpoint
```

if product UX supports asynchronous checkout completion.

---

# 4010 — Client Retry

Client retries:

```text
CreateOrder
```

with same idempotency key.

Server resumes/returns existing Saga result.

---

# 4011 — Order Cancellation Saga

Participants may include:

```text
Order
Inventory
Payment
Wallet
Promotion
Delivery
```

---

# 4012 — Cancellation Saga Flow

Example:

```text
Validate cancellation
      ↓
Mark CANCELLATION_REQUESTED
      ↓
Cancel delivery if required
      ↓
Release/adjust inventory
      ↓
Refund/reverse payment or wallet
      ↓
Restore promotion if policy
      ↓
Mark CANCELLED
```

---

# 4013 — Cancellation Transaction Boundary

Order local state transition:

```text
PENDING/ACCEPTED
→ CANCELLATION_REQUESTED
```

must commit before calling external compensations.

---

# 4014 — Why CANCELLATION_REQUESTED Exists

It records:

```text
business intent
```

while compensation may take time.

Without it, system may incorrectly report final cancellation too early.

---

# 4015 — Cancellation Critical Compensation

Decide which compensation must complete before:

```text
CANCELLED
```

Examples:

```text
financial refund may be eventual
inventory release may be critical
delivery cancellation may be best-effort
```

Policy must be explicit.

---

# 4016 — Refund Pending

Possible final business combination:

```text
Order = CANCELLED
Payment = REFUND_PENDING
```

if customer-facing cancellation does not wait for provider refund completion.

---

# 4017 — Cancellation Compensation Ordering

Possible:

```text
stop fulfillment first
then financial compensation
```

or:

```text
reverse payment before final cancellation
```

depends on operational policy.

---

# 4018 — Compensation Ordering

Compensations usually run:

```text
reverse order of forward steps
```

but not always.

Domain policy decides.

---

# 4019 — Example Reverse Order

Forward:

```text
Reserve Promotion
Reserve Inventory
Reserve Wallet
```

Compensate:

```text
Release Wallet
Release Inventory
Release Promotion
```

---

# 4020 — Compensation Dependency

Some compensation requires data from original step.

Store:

```text
reservation_id
authorization_id
payment_id
coupon_reservation_id
```

in Saga state.

---

# 4021 — Compensation Result

Persist:

```text
COMPENSATED
FAILED_RETRYABLE
FAILED_FINAL
UNKNOWN
```

per step.

---

# 4022 — Partial Compensation

Saga may reach:

```text
inventory released
wallet release failed
promotion released
```

Keep per-step result.

Do not summarize prematurely as fully compensated.

---

# 4023 — Compensation Retry

Use:

```text
same compensation idempotency key
```

Example:

```text
CHECKOUT:{order_id}:COMPENSATE:WALLET_RELEASE
```

---

# 4024 — Compensation Escalation

After retry budget exhausted:

```text
MANUAL_INTERVENTION
```

and alert.

---

# 4025 — Compensation Deadline

Some compensation has no strict immediate deadline but still has operational SLO.

Example:

```text
refund within X minutes/hours
```

Track separately from transport retry.

---

# 4026 — Order Completion Saga

Depending operational policy, completion may include:

```text
Consume Inventory
Finalize Payment
Mark Order DONE
```

or some steps may occur earlier.

---

# 4027 — Completion Secondary Effects

After `OrderCompleted`:

```text
Loyalty
Mission
Notification
Analytics
```

must not be part of the critical Saga unless business requires.

---

# 4028 — Why Secondary Effects Are Not Saga Steps

If Notification fails:

```text
order remains completed
```

If Loyalty fails:

```text
order remains completed
points can be awarded later
```

---

# 4029 — Top-Up Saga

Possible flow:

```text
Create Payment
      ↓
Capture external payment
      ↓
Credit Wallet
      ↓
Sync ERP asynchronously
```

---

# 4030 — Top-Up Critical Boundary

Wallet credit must not occur until:

```text
authoritative payment success
```

---

# 4031 — Payment Succeeds, Wallet Credit Fails

Saga/reconciliation must recover:

```text
captured payment
but wallet not credited
```

This is a high-priority financial mismatch.

---

# 4032 — Wallet Credit Idempotency

Use:

```text
payment_id / topup_id
```

as unique reference.

Retry credit safely.

---

# 4033 — ERP Sync Failure

If ERP is secondary:

```text
wallet top-up remains successful
ERP sync retries asynchronously
```

---

# 4034 — Reward Fulfillment Saga

Possible:

```text
MissionCompleted
      ↓
Assign Reward
      ↓
Fulfill:
   points / wallet / coupon
      ↓
Mark Reward Fulfilled
```

---

# 4035 — Reward Fulfillment Compensation

Some rewards may not be reversed automatically after fulfillment.

Policy must define.

Examples:

```text
coupon can be revoked if unused
points may be reversed
wallet credit may require adjustment/reversal
```

---

# 4036 — Promotion Redemption Saga

Checkout may:

```text
reserve promotion
```

then:

```text
redeem after order creation
```

If order fails:

```text
release
```

---

# 4037 — Promotion Restore After Cancellation

This is not automatically the inverse of redemption.

Policy may:

```text
restore usage
reissue coupon
do nothing
```

---

# 4038 — Saga + Outbox

Saga state transition that emits event must use local outbox.

Example:

```text
BEGIN

update saga
update order
insert outbox OrderCreated

COMMIT
```

---

# 4039 — Saga + Inbox

Saga participant consuming event should process:

```text
event dedupe
local state change
outbox
```

in one local transaction.

---

# 4040 — Outbox Guarantees

Outbox prevents:

```text
DB committed
but event permanently lost
```

---

# 4041 — Inbox Guarantees

Inbox prevents:

```text
same event
causes same business effect twice
```

---

# 4042 — Outbox Does Not Guarantee Consumer Success

It guarantees durable publication intent.

Consumers still need:

```text
retry
idempotency
DLQ
reconciliation
```

---

# 4043 — Eventual Consistency

Distributed transactions are often eventually consistent.

Meaning:

```text
different services may temporarily show different intermediate states
```

but converge.

---

# 4044 — Eventual Consistency Requires Explicit UX

Example:

```text
Order cancellation requested
Refund processing
```

UI should show:

```text
Cancellation processing
Refund pending
```

rather than pretending everything is instant.

---

# 4045 — Eventual Consistency Is Not Data Loss

Temporary mismatch is acceptable only if:

```text
workflow knows expected state
recovery exists
SLO exists
reconciliation exists
```

---

# 4046 — Convergence

Every Saga must define:

```text
what final consistent state looks like
```

---

# 4047 — Successful Convergence Example

```text
Order = DONE
Inventory = consumed
Payment = captured
Promotion = redeemed
```

---

# 4048 — Cancelled Convergence Example

```text
Order = CANCELLED
Inventory = released
Wallet = released/refunded
Payment = reversed/refunded
Promotion = released/restored according to policy
```

---

# 4049 — Failure Convergence

Example:

```text
Order = FAILED
Inventory = released
Payment = no charge
Wallet = no reserved funds
```

---

# 4050 — Compensation Convergence

Saga should not be considered finished until:

```text
all required compensations
reach accepted terminal states
```

---

# 4051 — Saga Events

Possible:

```text
CheckoutSagaStarted
CheckoutSagaCompleted
CheckoutSagaFailed
CheckoutSagaCompensationStarted
CheckoutSagaCompensated
CheckoutSagaManualInterventionRequired
```

Use only if operational consumers require them.

---

# 4052 — Saga Internal Commands

Examples:

```text
ReserveInventory
AuthorizePayment
ReleaseInventory
RefundPayment
```

These are commands, not events.

---

# 4053 — Choreography Event Chain

Example:

```text
OrderCreated
→ InventoryReserved
→ PaymentAuthorized
→ OrderConfirmed
```

This can become fragile when many participants need compensation.

---

# 4054 — Choreography Risk

Risks:

```text
implicit workflow
hard-to-see dependencies
event cycles
difficult compensation
debug complexity
```

---

# 4055 — Event Cycle Anti-Pattern

Avoid:

```text
OrderCreated
→ InventoryReserved
→ PaymentAuthorized
→ OrderUpdated
→ InventoryChanged
→ ...
```

without clear ownership.

---

# 4056 — Choreography Appropriate Cases

Good:

```text
OrderCompleted → Loyalty
OrderCompleted → Mission
OrderCompleted → Analytics
```

because consumers are independent.

---

# 4057 — Orchestration Appropriate Cases

Good:

```text
Checkout
Cancellation
Refund workflow
Top-up
Reward fulfillment
```

where success depends on multiple participants.

---

# 4058 — Saga Command Transport

Commands may use:

```text
synchronous gRPC/REST
```

or:

```text
Kafka command
```

depending latency/availability requirements.

---

# 4059 — Synchronous Orchestrated Saga

Coordinator calls participant immediately.

Advantages:

```text
simple customer response
lower latency
clear sequencing
```

Risks:

```text
availability coupling
timeout complexity
```

---

# 4060 — Asynchronous Orchestrated Saga

Coordinator sends durable commands and waits for result events.

Advantages:

```text
resilience
durability
less request-time coupling
```

Costs:

```text
more complexity
longer UX
more state
```

---

# 4061 — Hybrid Saga

Common:

```text
fast synchronous path
+
durable workflow fallback
```

Example:

```text
try Payment synchronously
if timeout/unknown:
persist pending state
recover asynchronously
```

---

# 4062 — Recommended Checkout Strategy

For normal mobile checkout:

```text
synchronous orchestration
with durable Saga state
```

so successful cases finish quickly and failure recovery remains safe.

---

# 4063 — Saga Command Response

Participant response should include:

```text
operation_id/reference
status
result
retryable
```

where useful.

---

# 4064 — Participant Operation States

Examples:

```text
Inventory reservation:
ACTIVE
CONSUMED
RELEASED
EXPIRED

Payment:
AUTHORIZED
CAPTURED
FAILED
UNKNOWN

Wallet reservation:
ACTIVE
CAPTURED
RELEASED
```

Saga stores references, not duplicate full domain state.

---

# 4065 — Saga State Snapshot

Saga may store selected projection:

```text
inventory_status
payment_status
wallet_status
promotion_status
```

for recovery.

Participant remains authoritative.

---

# 4066 — Query Before Compensation

If orchestrator state is uncertain:

```text
query participant
```

before compensation.

Example:

```text
payment timeout
→ query payment
→ if CAPTURED, refund
→ if FAILED, no compensation
```

---

# 4067 — Compensation Preconditions

Participant validates:

```text
current local state
```

not orchestrator assumptions.

---

# 4068 — Example Inventory Release

If reservation already:

```text
CONSUMED
```

Release should not silently succeed as if no effect.

Return explicit state/error.

---

# 4069 — Example Wallet Release

If funds already captured:

```text
release
```

is invalid.

Saga may need:

```text
refund
```

instead.

---

# 4070 — Saga Step Retry Matrix

Document per step:

| Step | Retry? | Idempotency | Unknown Resolution | Compensation |
|---|---|---|---|---|
| Reserve Inventory | Yes | Required | Query reservation | Release |
| Reserve Wallet | Yes | Required | Query reservation | Release |
| Authorize Payment | Yes carefully | Required | Query payment | Reverse |
| Capture Payment | Yes carefully | Required | Query payment | Refund |
| Redeem Coupon | Yes | Required | Query reservation/redemption | Restore policy |

---

# 4071 — Retry Classification

Each failure:

```text
RETRYABLE
NON_RETRYABLE
UNKNOWN
```

---

# 4072 — Retryable Example

```text
503
network connection reset before request accepted
database transient failure
```

when idempotency exists.

---

# 4073 — Non-Retryable Example

```text
insufficient balance
invalid coupon
insufficient stock
business rule rejection
```

---

# 4074 — Unknown Example

```text
request sent
response lost
```

requires status resolution.

---

# 4075 — Retry Backoff

Saga recovery retries use:

```text
exponential backoff
jitter
max attempts
```

---

# 4076 — Retry Scheduling

Store:

```text
next_retry_at
```

durably.

Do not depend on in-memory timers only.

---

# 4077 — Retry Exhaustion

When maximum automatic retries reached:

```text
FAILED_FINAL
or
MANUAL_INTERVENTION
```

depending business risk.

---

# 4078 — DLQ Role

Kafka consumer failures may go to DLQ.

Saga itself should still have durable workflow state.

DLQ is not a replacement for Saga state.

---

# 4079 — Poison Command

If command cannot process because:

```text
invalid schema
missing mapping
software bug
```

send to DLQ after bounded retry.

---

# 4080 — DLQ Replay Safety

Replay uses same:

```text
command_id
event_id
idempotency reference
```

---

# 4081 — Ordering

Cross-service events may arrive:

```text
duplicated
late
out of order
```

Consumers must defend.

---

# 4082 — Aggregate Version

Include:

```text
aggregate_version
```

when ordering matters.

---

# 4083 — Stale Event

If consumer has processed version:

```text
10
```

and receives:

```text
8
```

it may ignore as stale depending semantics.

---

# 4084 — Missing Version Gap

If consumer receives:

```text
version 12
```

after:

```text
version 10
```

it may detect missing:

```text
11
```

and choose:

```text
wait
query source
process if event is self-contained
```

according to consumer design.

---

# 4085 — Per-Aggregate Kafka Ordering

Use partition key:

```text
aggregate_id
```

to preserve producer ordering per aggregate.

---

# 4086 — Cross-Aggregate Ordering

Do not depend on ordering between:

```text
Payment event
Inventory event
Order event
```

across separate aggregates/topics.

Saga state coordinates business sequence.

---

# 4087 — Concurrent Saga Commands

Two API requests may attempt:

```text
cancel
complete
```

same order.

Order domain state/version decides valid transition.

Saga must handle conflict.

---

# 4088 — Saga Locking

Possible:

```text
optimistic version
row lock
```

on Saga row during transition.

Keep local lock short.

---

# 4089 — Command Deduplication

Participant stores:

```text
operation
business_reference
idempotency_key
request_hash
result
```

---

# 4090 — Idempotency Result Replay

If command already succeeded:

```text
return previous success result
```

including stable operation reference.

---

# 4091 — Idempotency In Progress

If same command is currently processing:

```text
return IN_PROGRESS
```

or wait briefly.

Do not execute second side effect.

---

# 4092 — Idempotency Failure Record

For final deterministic business failure:

```text
same retry should return same failure
```

unless state is allowed to change and contract defines reevaluation.

---

# 4093 — Idempotency TTL

For financial/business references, TTL may need to be long.

Do not expire idempotency record while duplicate retry remains plausible.

---

# 4094 — Business Uniqueness Stronger Than TTL

Example:

```text
one Wallet top-up per payment_id
```

should have permanent unique constraint, not only short-lived cache/idempotency record.

---

# 4095 — Distributed Transaction Database Schema

Possible Order-owned Saga tables:

```text
checkout_sagas
checkout_saga_steps
checkout_saga_attempts
cancellation_sagas
cancellation_saga_steps
```

---

# 4096 — Checkout Saga Table

Example:

```text
checkout_sagas
--------------
id
order_id
cart_id
customer_id
status
current_step
inventory_reservation_id
promotion_reservation_id
payment_id
wallet_reservation_id
last_error_code
retry_count
next_action_at
started_at
updated_at
completed_at
version
```

---

# 4097 — Saga Steps Table

```text
checkout_saga_steps
-------------------
id
saga_id
step_name
status
operation_reference
idempotency_key
request_hash
attempt_count
last_error_code
next_retry_at
started_at
completed_at
version
```

---

# 4098 — Saga Attempt Table

```text
checkout_saga_attempts
----------------------
id
saga_step_id
attempt_number
transport
started_at
completed_at
result
error_code
latency_ms
```

---

# 4099 — Saga Indexes

Likely:

```text
UNIQUE(order_id)
(status, next_action_at)
(current_step, status)
```

---

# 4100 — Compensation Index

Possible:

```sql
CREATE INDEX idx_checkout_saga_compensation
ON checkout_sagas(next_action_at)
WHERE status = 'COMPENSATION_PENDING';
```

---

# 4101 — Saga Audit

Saga state history may be useful:

```text
saga_state_history
```

Fields:

```text
old_state
new_state
step
reason
occurred_at
```

---

# 4102 — Saga History Benefits

Supports:

```text
incident investigation
customer support
reconciliation
postmortem
```

---

# 4103 — Distributed Transaction Error Catalog

Candidate:

```text
SAGA_NOT_FOUND
SAGA_ALREADY_COMPLETED
SAGA_STATE_CONFLICT
SAGA_STEP_FAILED
SAGA_STEP_TIMEOUT
SAGA_STEP_UNKNOWN
SAGA_COMPENSATION_FAILED
SAGA_MANUAL_INTERVENTION_REQUIRED
DEPENDENCY_UNAVAILABLE
IDEMPOTENCY_CONFLICT
```

---

# 4104 — Saga API

Internal/admin query:

```text
GET /api/v1/admin/sagas/{sagaId}
```

May show:

```text
state
steps
attempts
references
errors
```

---

# 4105 — Manual Retry API

Possible privileged:

```text
POST /api/v1/admin/sagas/{sagaId}/retry
```

Only retry when:

```text
operation semantics allow
```

---

# 4106 — Manual Compensation API

Possible:

```text
POST /api/v1/admin/sagas/{sagaId}/compensate
```

High-risk.

Require:

```text
permission
reason
audit
```

---

# 4107 — Force Complete Warning

Avoid generic:

```text
force complete saga
```

because it can hide broken financial state.

Use domain-specific repair actions.

---

# 4108 — Saga Observability

Metrics:

```text
saga_started_total
saga_completed_total
saga_failed_total
saga_compensated_total
saga_manual_intervention_total
saga_step_latency
saga_duration
```

---

# 4109 — Active Saga Gauge

Track:

```text
active_sagas
compensation_pending
unknown_steps
stuck_sagas
```

---

# 4110 — Stuck Saga Definition

Example:

```text
status non-terminal
updated_at older than threshold
```

Threshold depends on Saga type.

---

# 4111 — Saga SLIs

Potential:

```text
Checkout Saga success rate
P95 checkout Saga duration
Compensation success rate
Unknown-state resolution time
Stuck Saga count
```

---

# 4112 — Saga Alerts

Alert on:

```text
checkout failure spike
payment unknown spike
compensation backlog
manual intervention
stuck saga
recovery worker stalled
```

---

# 4113 — Saga Dashboard

Show:

```text
started/completed/failed
duration distribution
failure by step
retry count
unknown states
compensation states
manual intervention
```

---

# 4114 — Distributed Trace

Trace:

```text
Order Saga
  ↓
Inventory Reserve
  ↓
Payment Authorize
  ↓
Wallet Reserve
  ↓
Order DB
  ↓
Kafka Outbox
```

---

# 4115 — Saga Trace Limitation

Long-running Saga may outlive one trace.

Use:

```text
saga_id
correlation_id
```

in logs/events to bridge traces.

---

# 4116 — Structured Logging

Log:

```text
saga_id
saga_type
business_reference
step
status
attempt
dependency
error_code
correlation_id
```

Avoid sensitive payment/customer data.

---

# 4117 — Reconciliation

Saga correctness is verified by reconciliation.

Reconciliation asks:

```text
Does participant state match expected Saga state?
```

---

# 4118 — Checkout Reconciliation

Examples:

```text
Saga COMPLETED
but Payment not captured

Saga FAILED
but Inventory reservation active

Order CANCELLED
but Wallet funds still reserved

Order DONE
but coupon still only RESERVED
```

---

# 4119 — Reconciliation Sources

Query authoritative:

```text
Order
Inventory
Payment
Wallet
Promotion
```

through APIs/read models or service-local reconciliation workflows.

Do not directly query their private DBs from another service in production architecture.

---

# 4120 — Reconciliation Frequency

Possible:

```text
near-real-time for high-risk financial mismatch
scheduled hourly
daily full reconciliation
```

---

# 4121 — Auto-Repair

Only auto-repair when action is:

```text
safe
idempotent
well-understood
```

Example:

```text
retry missing inventory release
```

---

# 4122 — Manual Repair

High-risk:

```text
captured payment mismatch
double wallet credit
```

may require investigation.

---

# 4123 — Reconciliation Record

Possible:

```text
saga_reconciliation_mismatches
```

Fields:

```text
saga_id
business_reference
participant
mismatch_type
expected
actual
status
detected_at
resolved_at
```

---

# 4124 — Reconciliation Does Not Replace Saga

Reconciliation is:

```text
safety net
```

not primary workflow engine.

---

# 4125 — Distributed Transaction Security

Saga commands require:

```text
service authentication
operation authorization
idempotency
input validation
```

---

# 4126 — Internal Command Forgery Risk

A compromised service must not be able to issue arbitrary:

```text
RefundPayment
CreditWallet
```

without appropriate service scope.

---

# 4127 — Service Scope Examples

```text
order-service:
  inventory.reserve
  payment.authorize
  wallet.reserve

support-service:
  payment.refund? maybe no

finance-service:
  payment.refund
```

---

# 4128 — Compensation Authorization

Compensation commands may need dedicated scopes:

```text
inventory.release
wallet.release
payment.refund
payment.reverse
```

---

# 4129 — Saga Data Classification

Saga state may contain:

```text
payment references
wallet references
customer ID
order ID
amount
```

Protect as confidential/financial operational data.

---

# 4130 — Saga Retention

Retain enough history for:

```text
support
finance
reconciliation
incident response
```

Exact duration policy-defined.

---

# 4131 — Archive

Old terminal Saga steps/attempts may be archived.

Do not remove references needed to explain financial state.

---

# 4132 — Backup

Back up:

```text
saga instances
steps
attempts
state history
reconciliation
outbox
```

---

# 4133 — Restore Risk

Restore may rewind Saga state while participant services remain ahead.

Example:

```text
restored Order Saga says PAYMENT_AUTHORIZED
Payment provider already CAPTURED
```

---

# 4134 — Post-Restore Recovery

Do not resume blindly.

Run:

```text
participant status reconciliation
```

for active/recent high-risk Sagas.

---

# 4135 — Disaster Recovery

Define:

```text
RPO
RTO
active Saga recovery
participant reference lookup
Kafka replay
idempotency retention
reconciliation
```

---

# 4136 — Saga Code Structure

Example:

```text
order-service/
└── application/
    └── checkout/
        ├── CheckoutSaga.java
        ├── CheckoutSagaState.java
        ├── CheckoutSagaStep.java
        ├── StartCheckoutUseCase.java
        ├── AdvanceCheckoutUseCase.java
        ├── CompensateCheckoutUseCase.java
        └── RecoverCheckoutUseCase.java
```

---

# 4137 — Saga Domain Object

Saga domain logic can encapsulate:

```text
allowed step transitions
compensation requirement
terminal conditions
```

---

# 4138 — Saga Application Layer

Application coordinates:

```text
ports
repositories
participant clients
transactions
recovery
```

---

# 4139 — Participant Ports

Example:

```text
InventoryReservationPort
PaymentAuthorizationPort
WalletReservationPort
PromotionReservationPort
```

---

# 4140 — No Infrastructure in Saga Domain

Saga domain should not depend directly on:

```text
KafkaTemplate
WebClient
gRPC stub
JPA
```

Use ports.

---

# 4141 — Saga Repository Port

Concept:

```java
public interface CheckoutSagaRepository {
    Optional<CheckoutSaga> findByOrderId(OrderId orderId);
    CheckoutSaga save(CheckoutSaga saga);
}
```

---

# 4142 — Recovery Use Case

Pseudo:

```text
load due saga
      ↓
lock/version
      ↓
inspect current step
      ↓
resolve UNKNOWN if needed
      ↓
retry or compensate
      ↓
persist transition
      ↓
schedule next action
```

---

# 4143 — Step Executor Pattern

Possible abstraction:

```text
execute
resolveUnknown
compensate
```

per step.

Do not hide domain meaning behind too much reflection/config.

---

# 4144 — Workflow Configuration

Keep critical checkout sequence in code/versioned architecture initially.

Avoid allowing admin UI to arbitrarily reorder financial steps.

---

# 4145 — Feature Flags

Feature flags may switch:

```text
wallet path
payment provider
new Saga version
```

but must not alter an in-flight Saga unpredictably.

---

# 4146 — Saga Version

Store:

```text
saga_version
```

for long-running workflows.

In-flight Saga should continue under its original version unless migration is explicit.

---

# 4147 — Saga Migration

When workflow changes:

```text
new Saga instances use v2
existing v1 finish under v1
```

where possible.

---

# 4148 — Breaking Saga Migration

If active Saga cannot finish under old logic:

```text
explicit migration plan
state mapping
reconciliation
```

required.

---

# 4149 — Deployment Compatibility

During rolling deploy:

```text
old and new pods
```

must understand active Saga states.

Use backward-compatible DB evolution.

---

# 4150 — Flyway Migration Plan

Example:

```text
V1__create_checkout_sagas.sql
V2__create_checkout_saga_steps.sql
V3__create_checkout_saga_attempts.sql
V4__create_saga_state_history.sql
V5__create_saga_reconciliation.sql
V6__add_saga_version.sql
```

---

# 4151 — Testing Strategy

Test:

```text
Domain state machine
Forward steps
Compensation
Idempotency
Timeout
Unknown outcome
Crash recovery
Concurrency
Kafka
Outbox/inbox
Reconciliation
Security
Load
DR
```

---

# 4152 — Happy Path Test

Checkout:

```text
promotion reserve
inventory reserve
payment authorize
order create
payment capture
promotion redeem
```

Verify:

```text
COMPLETED
```

and one side effect each.

---

# 4153 — Inventory Failure Test

```text
promotion reserved
inventory insufficient
```

Expected:

```text
promotion released
no payment
Saga failed/compensated
```

---

# 4154 — Payment Failure Test

```text
promotion reserved
inventory reserved
payment declined
```

Expected:

```text
inventory release
promotion release
no duplicate payment
```

---

# 4155 — Wallet Failure Test

If wallet path:

```text
inventory reserved
wallet insufficient
```

Expected:

```text
inventory release
promotion release
```

---

# 4156 — Order Persistence Failure Test

```text
inventory reserved
payment authorized
order local persist fails
```

Expected compensation:

```text
reverse payment authorization
release inventory
release promotion
```

---

# 4157 — Capture Failure Test

If:

```text
order created
payment capture fails
```

Verify documented policy:

```text
retry capture
cancel order
refund/reverse
manual intervention
```

---

# 4158 — Unknown Payment Test

Simulate:

```text
provider authorizes
response lost
```

Expected:

```text
Saga UNKNOWN
query by reference
resolve AUTHORIZED
continue once
```

---

# 4159 — Unknown Inventory Test

Simulate:

```text
reservation committed
response lost
```

Expected:

```text
query/retry same key
one reservation only
```

---

# 4160 — Duplicate Command Test

Send:

```text
ReserveInventory
```

same idempotency key concurrently.

Expected:

```text
one reservation
same response/reference
```

---

# 4161 — Duplicate Compensation Test

Send:

```text
ReleaseWalletFunds
```

multiple times.

Expected:

```text
one financial effect
```

---

# 4162 — Crash After Step Success Test

Simulate:

```text
participant succeeds
orchestrator crashes before storing response
```

Recovery must query/retry same idempotent operation.

---

# 4163 — Crash After Saga State Commit Test

Simulate:

```text
Saga stores step success
crashes before next step
```

Recovery resumes next step.

---

# 4164 — Crash During Compensation Test

Recovery continues remaining compensation safely.

---

# 4165 — Outbox Failure Test

If Kafka unavailable:

```text
local Saga/order transaction commits
outbox remains pending
```

No lost event.

---

# 4166 — Consumer Duplicate Test

Replay:

```text
OrderCompleted
```

Verify Loyalty/Mission/etc. effect once.

---

# 4167 — Out-of-Order Test

Deliver lifecycle events out of order.

Verify state/version checks.

---

# 4168 — Concurrency Test

Run:

```text
checkout
cancel
```

simultaneously.

Verify one valid business outcome.

---

# 4169 — Recovery Worker Concurrency Test

Multiple recovery pods:

```text
same due Saga
```

Expected:

```text
one worker advances it
```

---

# 4170 — Reservation Expiry Race Test

Race:

```text
Saga capture
vs
reservation expiry worker
```

Participant local transaction decides one valid result.

---

# 4171 — Reconciliation Test

Create intentional mismatches:

```text
Saga complete + payment missing
Saga failed + inventory reserved
cancelled + wallet reserved
```

Verify detection.

---

# 4172 — Manual Intervention Test

Force unrecoverable compensation failure.

Verify:

```text
alert
status
admin visibility
no silent retry forever
```

---

# 4173 — Load Test

Scenarios:

```text
checkout burst
high cancellation rate
recovery backlog
provider degradation
many UNKNOWN states
```

---

# 4174 — Chaos Test

Inject:

```text
pod kill
network loss
DB failover
Kafka outage
dependency 503
slow provider
```

during Saga steps.

Verify convergence.

---

# 4175 — Payment Safety Test

Prove:

```text
no duplicate capture
no duplicate refund
```

under retries and crashes.

---

# 4176 — Wallet Safety Test

Prove:

```text
no double reserve
no double capture
no double refund
```

---

# 4177 — Inventory Safety Test

Prove:

```text
no double reservation
no negative available due to Saga retry
release/capture race safe
```

---

# 4178 — Promotion Safety Test

Prove:

```text
one coupon reservation
one redemption
release safe
usage limit not exceeded
```

---

# 4179 — Definition of Done: Saga

- [ ] Saga owner identified.
- [ ] Forward steps documented.
- [ ] Participant ownership clear.
- [ ] Compensation per step defined.
- [ ] Idempotency keys defined.
- [ ] Unknown outcome strategy.
- [ ] Timeout/retry policy.
- [ ] Durable state.
- [ ] Recovery worker.
- [ ] Reconciliation.
- [ ] Metrics/alerts.
- [ ] Tests.
- [ ] Runbook.

---

# 4180 — Definition of Done: Participant Command

- [ ] Local transaction.
- [ ] Idempotency.
- [ ] Business reference.
- [ ] Request hash.
- [ ] Stable result reference.
- [ ] Retry semantics.
- [ ] Query-by-reference if high-risk.
- [ ] Compensation API if required.
- [ ] Outbox event.

---

# 4181 — Definition of Done: Compensation

- [ ] Business meaning clear.
- [ ] Preconditions.
- [ ] Idempotency.
- [ ] Retry.
- [ ] Unknown outcome.
- [ ] Terminal result.
- [ ] Manual escalation.
- [ ] Audit.
- [ ] Tests.

---

# 4182 — Distributed Transaction Review Checklist

## Ownership

- [ ] Saga owner.
- [ ] Participant owners.
- [ ] Source of truth per state.
- [ ] No cross-service DB transaction.

## Correctness

- [ ] Local ACID.
- [ ] Idempotency.
- [ ] Compensation.
- [ ] Unknown outcome.
- [ ] Durable workflow state.
- [ ] Reconciliation.

## Reliability

- [ ] Timeout.
- [ ] Retry.
- [ ] Backoff.
- [ ] Recovery worker.
- [ ] DLQ where relevant.
- [ ] Manual intervention.

---

# 4183 — Checkout Saga Review Checklist

- [ ] Catalog validation.
- [ ] Promotion reserve/release/redeem.
- [ ] Inventory reserve/release/consume.
- [ ] Payment authorize/capture/reverse/refund.
- [ ] Wallet reserve/capture/release/refund.
- [ ] Order durable state.
- [ ] Stable idempotency keys.
- [ ] Unknown provider state.
- [ ] Client retry.
- [ ] Final convergence.

---

# 4184 — Cancellation Saga Review Checklist

- [ ] Valid cancellation policy.
- [ ] CANCELLATION_REQUESTED.
- [ ] Delivery cancellation.
- [ ] Inventory compensation.
- [ ] Payment/Wallet compensation.
- [ ] Promotion restoration policy.
- [ ] Refund pending behavior.
- [ ] Retry/recovery.
- [ ] Final CANCELLED semantics.

---

# 4185 — Data Review Checklist

- [ ] Saga tables.
- [ ] Step tables.
- [ ] Attempt history.
- [ ] Unique business reference.
- [ ] Idempotency references.
- [ ] Version.
- [ ] Retry timestamp.
- [ ] Participant references.
- [ ] Reconciliation history.
- [ ] Retention.

---

# 4186 — Security Review Checklist

- [ ] Service authentication.
- [ ] Per-command authorization.
- [ ] Compensation scopes.
- [ ] Admin retry RBAC.
- [ ] Manual repair audited.
- [ ] Sensitive references protected.
- [ ] No raw secrets in Saga state.

---

# 4187 — Operations Review Checklist

- [ ] Saga dashboard.
- [ ] Step metrics.
- [ ] Stuck Saga alert.
- [ ] Unknown-state alert.
- [ ] Compensation backlog.
- [ ] Recovery worker health.
- [ ] Reconciliation.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 4188 — Production Readiness Checklist

Before production:

- [ ] Happy-path Saga passes.
- [ ] Every forward-step failure tested.
- [ ] Every compensation tested.
- [ ] Duplicate command tests pass.
- [ ] Duplicate compensation tests pass.
- [ ] Unknown payment test passes.
- [ ] Unknown inventory test passes.
- [ ] Crash-after-success recovery passes.
- [ ] Recovery-worker concurrency passes.
- [ ] Reservation-expiry races pass.
- [ ] Outbox/inbox tests pass.
- [ ] Reconciliation tested.
- [ ] Chaos test passed.
- [ ] Manual intervention runbook tested.
- [ ] Alerts configured.
- [ ] DR recovery reviewed.

---

# 4189 — Initial Implementation Order

Recommended:

```text
1. Define checkout Saga states
2. Define participant command contracts
3. Add idempotency to participants
4. Add query-by-reference APIs
5. Build Saga persistence
6. Implement forward workflow
7. Implement compensation
8. Add timeout/retry metadata
9. Add recovery worker
10. Add unknown-outcome resolution
11. Add outbox/inbox
12. Add cancellation Saga
13. Add reconciliation
14. Add admin visibility
15. Add metrics/alerts
16. Add chaos/failure tests
```

---

# 4190 — Minimum Viable Distributed Transaction Standard

Every critical cross-service workflow must have:

```text
One Saga owner
Explicit states
Explicit steps
Stable business reference
Stable idempotency key per step
Local ACID transactions
Compensation
Unknown-outcome handling
Durable recovery state
Outbox/inbox
Retry policy
Reconciliation
Observability
```

---

# 4191 — What Not to Do

Reject designs that rely on:

```text
cross-service database transaction
direct write to another service DB
blind retries
timeout = failure
best-effort financial compensation
in-memory-only workflow state
one giant Kafka choreography for checkout
```

---

# 4192 — Distributed Transaction Governance

Architecture review should require for each critical workflow:

```text
sequence diagram
failure matrix
compensation matrix
idempotency table
timeout/retry table
final convergence states
reconciliation plan
```

---

# 4193 — Failure Matrix

Example columns:

```text
Step
Failure
Local state
Remote state
Retry?
Compensation?
Final client response
Recovery path
```

---

# 4194 — Compensation Matrix

Example:

| Forward Action | Compensation | Idempotency Reference |
|---|---|---|
| ReserveInventory | ReleaseInventory | order_id/reservation_id |
| ReserveWallet | ReleaseWalletFunds | order_id/reservation_id |
| AuthorizePayment | ReverseAuthorization | payment_id |
| CapturePayment | RefundPayment | payment_id/capture_id |
| ReservePromotion | ReleasePromotion | reservation_id |

---

# 4195 — Final State Matrix

Document valid convergence states.

Example:

```text
SUCCESS:
Order DONE
Payment CAPTURED
Inventory CONSUMED

CANCELLED:
Order CANCELLED
Payment REFUNDED/NO_CHARGE
Inventory RELEASED

PENDING_REFUND:
Order CANCELLED
Payment REFUND_PENDING
Inventory RELEASED
```

---

# 4196 — Saga Version Governance

Each significant workflow revision should record:

```text
saga_version
```

and rollout plan.

---

# 4197 — Cross-Service Compensation Governance

A service adding new irreversible behavior must update:

```text
Saga failure matrix
compensation model
reconciliation
runbook
```

before production.

---

# 4198 — PART 22 Deliverables

PART 22 produces:

1. Distributed transaction principles.
2. Local ACID boundary.
3. 2PC avoidance rationale.
4. Saga model.
5. Compensation semantics.
6. Orchestration vs choreography.
7. Hybrid Saga approach.
8. Saga ownership.
9. Saga state model.
10. Saga persistence.
11. Saga step/attempt model.
12. Idempotency keys.
13. Request hashes.
14. Unknown-outcome handling.
15. Participant query-by-reference.
16. Timeout/business-TTL separation.
17. Recovery worker.
18. Saga concurrency.
19. Checkout Saga.
20. Promotion reservation flow.
21. Inventory reservation flow.
22. Wallet reservation flow.
23. Payment authorize/capture/refund flow.
24. Order persistence failure compensation.
25. Client retry behavior.
26. Cancellation Saga.
27. Compensation ordering.
28. Partial compensation.
29. Order-completion boundaries.
30. Top-Up Saga.
31. Reward fulfillment Saga.
32. Outbox/inbox integration.
33. Eventual consistency.
34. Convergence definitions.
35. Choreography risk.
36. Sync/async Saga command transport.
37. Hybrid recovery path.
38. Retry matrix.
39. DLQ role.
40. Ordering/versioning.
41. Command idempotency.
42. Saga database schema.
43. Admin/recovery API guidance.
44. Observability.
45. Reconciliation.
46. Security.
47. Retention.
48. Backup/restore.
49. DR.
50. Saga code structure.
51. Workflow versioning.
52. Flyway migration.
53. Testing strategy.
54. Crash/failure/chaos tests.
55. Review checklists.
56. Production readiness.
57. Governance artifacts.

---

# 4199 — Exit Criteria

PART 22 is complete when the team can answer:

### Ownership

```text
Which service owns the Saga?
```

### Sequence

```text
What are the forward steps and why are they ordered that way?
```

### Compensation

```text
What compensates every completed step if a later step fails?
```

### Idempotency

```text
How can every command and compensation be retried safely?
```

### Unknown Outcome

```text
What happens when a remote side effect may have succeeded but the response was lost?
```

### Recovery

```text
How does the workflow continue after process crash or pod restart?
```

### Eventual Consistency

```text
Which temporary inconsistent states are allowed and what final state must they converge to?
```

### Reconciliation

```text
How are hidden mismatches across Order, Inventory, Payment, Wallet, and Promotion detected?
```

### Operations

```text
How do operators inspect, retry, compensate, and escalate a stuck Saga safely?
```

### DR

```text
How does restore avoid replaying financial or stock side effects incorrectly?
```

If these answers are clear and tested, the distributed transaction architecture is ready for implementation.

---

# 4200 — Handoff to PART 23

PART 23 defines Kafka / Event Architecture.

```text
PART 22
Distributed Transactions
      ↓
Outbox / Inbox
Events / Commands
Retries / DLQ
      ↓
PART 23
Kafka / Event Architecture
```

PART 23 will define:

```text
Kafka Cluster
Topics
Partitions
Consumer Groups
Retention
Compaction
Replication
Producer Configuration
Consumer Configuration
Schema Registry
Event Envelopes
Ordering
Retries
DLQ
Replay
Outbox Publisher
Inbox Processing
Exactly-Once Limitations
Security
Monitoring
Capacity Planning
```

The key transition is:

```text
PART 22
= business correctness across services

PART 23
= event infrastructure that transports those distributed facts reliably
```

---

# PART 22 — Summary

Distributed Transactions define how business correctness survives multiple independent services and databases.

The platform does not use:

```text
one global ACID transaction
```

Instead it uses:

```text
local ACID
+
Saga
+
idempotency
+
compensation
+
outbox/inbox
+
recovery
+
reconciliation
```

Critical checkout:

```text
Order Orchestrator
      ↓
Reserve Promotion
      ↓
Reserve Inventory
      ↓
Authorize / Reserve Funds
      ↓
Persist Order
      ↓
Capture / Finalize
      ↓
Complete Saga
```

Failure:

```text
later step fails
      ↓
reverse completed steps
      ↓
retry compensation if necessary
      ↓
manual intervention only when automatic recovery is exhausted
```

The most important architecture rules are:

```text
One Saga has one owner.
Each service owns its local transaction.
No network call belongs inside a long database transaction.
Compensation is a new business action, not rollback.
Every command and compensation is idempotent.
Timeout does not necessarily mean failure.
UNKNOWN is a first-class workflow state.
Saga state is durable.
Recovery workers resume incomplete workflows.
Outbox/inbox protect event delivery and consumption.
Secondary effects do not belong in critical checkout Sagas.
Reconciliation detects hidden cross-service mismatches.
Financial/stock workflows never rely on best-effort cleanup.
```

The next chapter defines the event infrastructure supporting these workflows:

```text
PART 23 — Kafka / Event Architecture
```

---

**End of PART 22 — Distributed Transactions**
