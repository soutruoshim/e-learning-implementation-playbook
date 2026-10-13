---
title: "PHASE 14 — Distributed Transactions / Saga"
---

# PHASE 14 — Distributed Transactions / Saga

> **Purpose:** Implement the platform-wide distributed transaction standard so one business workflow remains correct when multiple independently owned services and databases participate. This phase defines Saga ownership, durable workflow state, participant contracts, stable idempotency, unknown outcomes, compensation, recovery workers, eventual consistency, convergence, reconciliation, security, observability, failure testing, and production governance.
>
> **Previous Phase:** Phase 13 — Service Communication
>
> **Next Phase:** Phase 15 — Kafka / Event Architecture
>
> **Primary Architecture Basis:** PART 22 — Distributed Transactions, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 13 — Ordering, PART 14 — Payment, PART 15 — Wallet, PART 17 — Promotion, PART 21 — Service Communication, PART 23 — Kafka / Event Architecture, PART 25 — Testing, PART 31 — Observability, PART 36 — Backup / DR, and PART 43 — Rollback / Recovery.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Kafka, REST/gRPC, Flyway, OpenTelemetry.
>
> **Status:** Platform Implementation Specification

---

# 1. Phase 14 Goal

Phase 14 does not create a new business service.

It defines and implements the standard for:

```text
business workflows
that span
multiple independently owned services
```

Examples:

```text
Checkout
Cancellation
Refund
Wallet Top-Up
Reward Fulfillment
```

---

# 2. Main Distributed Transaction Problem

Inside one service:

```text
PostgreSQL ACID transaction
```

can guarantee:

```text
atomicity
consistency
isolation
durability
```

But it cannot provide one atomic transaction across:

```text
order_db
inventory_db
payment_db
wallet_db
promotion_db
```

---

# 3. Core Principle

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

Do not simulate one global relational transaction across services.

---

# 4. Distributed Business Transaction

A distributed transaction is a workflow where:

```text
multiple services
each change their own authoritative state
to complete one business outcome
```

Typical Checkout participants:

```text
Order
Inventory
Promotion
Payment
Wallet
```

---

# 5. Avoid 2PC / XA by Default

Do not use distributed:

```text
2PC
XA
```

as the default strategy.

Reasons:

```text
tight coupling
coordinator dependency
blocking failure modes
external provider incompatibility
Kafka mismatch
operational complexity
```

Use:

```text
Saga-based business transactions
```

---

# 6. Core Building Blocks

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

# 7. Local Transaction Rule

Each service owns its own local ACID transaction.

Example:

```text
Inventory Service

BEGIN
reserve stock
insert reservation
insert outbox
COMMIT
```

No other service DB joins that transaction.

---

# 8. No Cross-Service Transaction

Never create:

```text
BEGIN
update order_db
update payment_db
update inventory_db
COMMIT
```

across independent services.

---

# 9. No Long DB Transaction Around Network Calls

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

# 10. Correct Network Boundary

Prefer:

```text
persist local intent/state
commit
      ↓
call participant
      ↓
persist result in a new local transaction
```

Durability enables recovery.

---

# 11. Saga Definition

A Saga is:

```text
a sequence of local transactions
```

where later failure is handled by:

```text
compensating business actions
```

rather than one global rollback.

---

# 12. Saga Example

```text
Reserve Inventory
      ↓
Authorize Payment
      ↓
Create Order
      ↓
Capture Payment
```

If a later step fails:

```text
compensate earlier completed steps
```

according to policy.

---

# 13. Compensation

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
ReservePromotion → ReleasePromotion
```

---

# 14. Compensation Is Not Database Rollback

Database rollback:

```text
removes uncommitted local work
```

Compensation:

```text
creates another committed business action
```

History remains visible.

---

# 15. Compensation Must Be Idempotent

Repeated:

```text
ReleaseInventory
RefundPayment
ReleaseWalletFunds
ReleasePromotion
```

must be safe.

Retries can happen after:

```text
timeout
process crash
network failure
broker replay
operator retry
```

---

# 16. Compensation May Fail

Do not assume compensation succeeds immediately.

Example:

```text
RefundPayment
→ provider unavailable
```

Saga may remain:

```text
COMPENSATION_PENDING
```

until recovered.

---

# 17. Domain-Specific Compensation

There is no generic:

```text
undo()
```

for all services.

Each participant defines:

```text
valid compensation
preconditions
terminal results
```

---

# 18. Irreversible Actions

Some actions cannot truly be undone.

Examples:

```text
notification already sent
food already prepared
external settlement completed
customer already saw information
```

Compensation may instead be:

```text
refund
credit
manual intervention
support resolution
```

---

# 19. Saga Styles

Two primary styles:

```text
ORCHESTRATION
CHOREOGRAPHY
```

---

# 20. Orchestration

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

# 21. Choreography

Services react to facts/events.

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

Useful for independent downstream effects.

---

# 22. Recommended Initial Strategy

For critical:

```text
Checkout
Cancellation
Refund Workflow
Top-Up
Reward Fulfillment
```

prefer:

```text
Orchestration
```

For independent downstream effects:

```text
Choreography
```

---

# 23. Why Orchestration for Checkout

Checkout has:

```text
strict sequence
financial risk
compensation
timeouts
customer-visible result
```

A durable orchestrator makes control explicit.

---

# 24. Why Choreography for Secondary Effects

After:

```text
OrderCompleted
```

services such as:

```text
Loyalty
Mission
Notification
Analytics
```

can react independently.

One consumer failure should not block Order completion.

---

# 25. Hybrid Architecture

Recommended:

```text
Critical transaction
= orchestrated Saga

Secondary reactions
= event choreography
```

---

# 26. Saga Owner

Every Saga has exactly:

```text
one owner
```

Examples:

```text
Checkout Saga → Ordering
Cancellation Saga → Ordering
Top-Up Saga → Wallet or Payment owner
Reward Fulfillment Saga → Loyalty / Reward owner
```

---

# 27. Saga Owner Responsibilities

Saga owner manages:

```text
workflow state
step order
timeouts
retries
compensation decisions
final outcome
recovery
observability
```

---

# 28. Participant Responsibilities

Each participant manages:

```text
its own authoritative state
its own invariants
its local transaction
its command idempotency
its local events
its compensation API
```

---

# 29. Orchestrator Does Not Own Participant Rules

Ordering may command:

```text
ReserveInventory
```

Inventory decides:

```text
whether stock can be reserved
```

Ordering must not duplicate stock logic.

---

# 30. Participant Authority

Saga may store:

```text
participant references
selected projected status
```

but participant service remains authoritative.

---

# 31. Saga State Must Be Durable

Saga state must survive:

```text
process crash
pod restart
deployment
network failure
Kafka outage
```

Do not keep workflow truth only in memory.

---

# 32. Example Saga States

Possible Checkout states:

```text
STARTED
PROMOTION_RESERVED
INVENTORY_RESERVED
PAYMENT_AUTHORIZED
WALLET_RESERVED
ORDER_CREATED
PAYMENT_CAPTURED
COMPLETED
COMPENSATING
COMPENSATION_PENDING
FAILED
UNKNOWN
MANUAL_INTERVENTION
```

Use only states required by actual workflow.

---

# 33. Saga Instance

Possible fields:

```text
saga_id
saga_type
business_reference
saga_version
status
current_step
started_at
updated_at
completed_at
next_action_at
version
```

---

# 34. Saga Step

Possible fields:

```text
step_id
saga_id
step_name
status
attempt_count
idempotency_key
request_hash
request_reference
response_reference
started_at
completed_at
next_retry_at
last_error_code
```

---

# 35. Saga Step Status

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

# 36. Saga Persistence

Possible tables:

```text
checkout_sagas
checkout_saga_steps
checkout_saga_attempts
saga_state_history
saga_reconciliation_mismatches
```

Use service-specific tables initially.

---

# 37. Generic vs Service-Specific Workflow Engine

Generic engine:

```text
flexible
reusable
```

but may hide business meaning.

Service-specific model:

```text
clearer
simpler
more explicit
```

Initial recommendation:

```text
service-specific workflow state
```

---

# 38. Avoid Premature BPM Platform

Do not build a universal workflow/BPM engine before real need exists.

Start with:

```text
explicit application code
+
durable state
```

---

# 39. Saga ID

Use stable opaque ID such as:

```text
UUIDv7
ULID
UUID
```

Exact platform choice:

```text
TBD_PLATFORM_POLICY
```

---

# 40. Business Reference

Saga links to business object:

```text
order_id
topup_id
reward_assignment_id
```

Use uniqueness where one Saga per operation is expected.

---

# 41. Saga Start Idempotency

Starting the same business workflow twice must not duplicate side effects.

Use:

```text
business_reference
operation
idempotency_key
```

---

# 42. Downstream Command Metadata

Every participant command should carry:

```text
saga_id
business_reference
idempotency_key
correlation_id
```

and operation-specific business fields.

---

# 43. Stable Step Idempotency Key

Examples:

```text
CHECKOUT:{order_id}:RESERVE_PROMOTION
CHECKOUT:{order_id}:RESERVE_INVENTORY
CHECKOUT:{order_id}:AUTHORIZE_PAYMENT
CHECKOUT:{order_id}:CAPTURE_PAYMENT
```

Retry uses the same key.

---

# 44. Never Generate a New Key on Retry

Bad:

```text
retry
→ new UUID
```

This can duplicate:

```text
reservation
payment
refund
wallet effect
```

---

# 45. Step Request Hash

Store:

```text
request_hash
```

Same key with changed payload:

```text
IDEMPOTENCY_CONFLICT
```

---

# 46. Logical Step vs Transport Attempt

One Saga step may have several transport attempts.

Example:

```text
AUTHORIZE_PAYMENT

Attempt 1
→ timeout

Attempt 2
→ status query

Attempt 3
→ retry same command if safe
```

---

# 47. UNKNOWN Is First-Class

Distributed transactions must explicitly model:

```text
UNKNOWN
```

Example:

```text
Payment may have authorized
but response was lost
```

Do not treat UNKNOWN as FAILED.

---

# 48. UNKNOWN Recovery Options

Possible:

```text
retry same idempotent command
query participant by stable business reference
wait for authoritative event
run reconciliation
```

---

# 49. Query-by-Reference Contract

High-risk participants should expose:

```text
GetOperationByReference
```

or equivalent.

Examples:

```text
GetInventoryReservation(order_id)
GetPaymentByOrder(order_id)
GetWalletReservation(order_id)
GetPromotionReservation(order_id)
```

---

# 50. Stable Operation References

Recovery must be able to ask:

```text
Did operation X already happen?
```

without generating a new business action.

---

# 51. Saga Timeout

Each step defines:

```text
transport deadline
timeout policy
retry policy
unknown-resolution policy
```

Saga also defines:

```text
overall workflow timeout
```

---

# 52. Transport Timeout vs Business Timeout

Transport timeout:

```text
response was not received in time
```

Business timeout:

```text
business opportunity/reservation expired
```

They are different.

---

# 53. Example Timeout Difference

Illustrative:

```text
Network call timeout: 500 ms
Reservation business TTL: 10 minutes
```

The first does not mean the business reservation is invalid.

---

# 54. Reservation TTL Coordination

Saga may depend on:

```text
Promotion hold TTL
Inventory reservation TTL
Wallet reservation TTL
Payment authorization TTL
```

These TTLs must be compatible.

---

# 55. Reservation Expiry Awareness

Saga stores:

```text
expires_at
```

for relevant resource reservations.

It must complete or compensate before invalid expiry where required.

---

# 56. Recovery Worker

Recovery worker scans:

```text
IN_PROGRESS
FAILED_RETRYABLE
UNKNOWN
COMPENSATION_PENDING
```

and continues safely.

---

# 57. Recovery Query

Example pattern:

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

# 58. Multiple Recovery Workers

Use:

```text
SKIP LOCKED
optimistic version
lease where needed
```

to ensure one worker advances a Saga at a time.

---

# 59. Saga Optimistic Version

Store:

```text
version
```

for concurrent:

```text
API
event
recovery worker
admin operation
```

updates.

---

# 60. Explicit Saga Transition Methods

Prefer:

```text
saga.promotionReserved()
saga.inventoryReserved()
saga.paymentAuthorized()
saga.captureFailed()
saga.beginCompensation()
```

instead of:

```text
setStatus(...)
```

---

# 61. Saga State Machine

Every Saga defines:

```text
valid transitions
terminal states
retryable states
unknown states
compensation states
```

---

# 62. Terminal Saga States

Typical:

```text
COMPLETED
FAILED
COMPENSATED
MANUAL_INTERVENTION
```

---

# 63. Manual Intervention

Use only when automatic recovery cannot safely converge.

Example:

```text
payment captured
refund repeatedly fails
```

State:

```text
MANUAL_INTERVENTION
```

---

# 64. Manual Intervention Data

Persist:

```text
reason
failed step
external references
amount where relevant
last error
last retry
recommended runbook
```

---

# 65. Manual Intervention Is Visible

Never silently stop retrying.

Must produce:

```text
persistent state
alert
dashboard visibility
runbook
```

---

# 66. Checkout Saga Owner

Initial owner:

```text
Ordering Service
```

Representative participants:

```text
Catalog
Customer
Promotion
Inventory
Payment
Wallet
Order
```

Exact path depends on payment method.

---

# 67. Checkout Read Validation

Perform read-only validation first where possible:

```text
Catalog
Customer
Promotion preview
```

Do not reserve scarce resources too early.

---

# 68. Checkout Resource Reservation

Typical:

```text
Reserve Promotion
Reserve Inventory
Reserve Wallet / Authorize Payment
```

---

# 69. Durable Order Timing

Create durable Order once sufficient prerequisites exist.

Exact timing is:

```text
TBD_ARCHITECTURE
```

---

# 70. Checkout Variant A

```text
Validate
→ Reserve Promotion
→ Reserve Inventory
→ Authorize Payment
→ Create Order
→ Capture Payment
→ Redeem Promotion
→ Complete Saga
```

---

# 71. Checkout Variant B

```text
Create PENDING Order / workflow
→ Reserve Promotion
→ Reserve Inventory
→ Authorize Payment
→ Activate Order
→ Capture
```

Requires precise pending-order semantics.

---

# 72. Durable Reference Before Provider Charge

Never allow:

```text
provider charge success
```

without a durable internal reference capable of recovery.

---

# 73. Catalog Validation in Saga

Catalog validation is read-only.

Usually:

```text
no compensation
```

Use:

```text
accepted snapshot/version
```

or revalidate according to checkout policy.

---

# 74. Promotion Reservation

Forward:

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

# 75. Inventory Reservation

Forward:

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

at approved business milestone.

---

# 76. Wallet Reservation

Forward:

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

# 77. External Payment

Forward:

```text
AuthorizePayment
```

Pre-capture compensation:

```text
ReverseAuthorization
```

Post-capture compensation:

```text
RefundPayment
```

---

# 78. Compensation Depends on Participant State

If Payment is:

```text
AUTHORIZED
```

compensation may be:

```text
VOID / REVERSE
```

If:

```text
CAPTURED
```

compensation may be:

```text
REFUND
```

Do not issue generic compensation.

---

# 79. Order Persistence Failure After Reservation

If:

```text
Promotion reserved
Inventory reserved
Wallet reserved / Payment authorized
Order persistence fails
```

Saga must compensate those completed effects.

---

# 80. Payment UNKNOWN During Checkout

If Payment response is ambiguous:

```text
do not create second Payment attempt blindly
```

Set:

```text
PAYMENT_UNKNOWN
```

then resolve.

---

# 81. Inventory UNKNOWN During Checkout

If ReserveInventory times out:

```text
query reservation by stable reference
```

before any new reservation attempt.

---

# 82. Promotion UNKNOWN During Checkout

Resolve by:

```text
same idempotency key
or
query reservation by business reference
```

---

# 83. Wallet UNKNOWN During Checkout

If reserve/capture response is lost:

```text
query Wallet reservation/transaction
```

and reuse original command identity.

---

# 84. Checkout Success Condition

Saga succeeds when:

```text
required resources committed
Order durable
financial state valid
promotion/inventory state valid
```

according to chosen policy.

---

# 85. Secondary Effects After Checkout

After Saga success, emit facts for:

```text
Notification
Loyalty
Mission
Analytics
Integration
```

Do not include them in critical Saga unless truly required.

---

# 86. Client Checkout Outcomes

Possible:

```text
SUCCESS
REJECTED
PENDING
PROCESSING
UNKNOWN
```

Do not force all workflows into immediate binary success/failure.

---

# 87. Processing Response

If product UX allows:

```text
HTTP 202
```

may return:

```text
workflow reference
Order reference
status endpoint
```

---

# 88. Client Retry

Client retries:

```text
CreateOrder
```

with the same idempotency key.

Server:

```text
returns existing result
or resumes existing workflow
```

---

# 89. Cancellation Saga

Possible participants:

```text
Order
Inventory
Payment
Wallet
Promotion
Delivery
```

---

# 90. Cancellation Flow

Representative:

```text
Validate cancellation
      ↓
Mark CANCELLATION_REQUESTED
      ↓
Cancel delivery if required
      ↓
Release/adjust Inventory
      ↓
Refund/reverse Payment or Wallet
      ↓
Restore Promotion if policy
      ↓
Mark CANCELLED
```

---

# 91. Cancellation Intent Must Be Durable

Order transition:

```text
PENDING / ACCEPTED
→ CANCELLATION_REQUESTED
```

commits before remote compensation begins.

---

# 92. Why CANCELLATION_REQUESTED Exists

It records:

```text
business cancellation intent
```

while distributed compensation may still be processing.

---

# 93. Critical Cancellation Compensation

Policy must decide which steps must finish before:

```text
CANCELLED
```

Examples:

```text
Inventory release may be critical
Refund may be eventual
Delivery cancel may be best-effort
```

---

# 94. Refund Pending Business State

Possible valid convergence:

```text
Order = CANCELLED
Payment = REFUND_PENDING
Inventory = RELEASED
```

if customer cancellation does not wait for provider refund settlement.

---

# 95. Cancellation Compensation Order

Could be:

```text
stop fulfillment first
then financial compensation
```

or another sequence.

Domain/operations policy decides.

---

# 96. Compensation Ordering

Often:

```text
reverse forward order
```

but not always.

Business semantics override generic reversal ordering.

---

# 97. Reverse-Order Example

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

# 98. Compensation References

Store references required later:

```text
reservation_id
authorization_id
payment_id
wallet_reservation_id
coupon_reservation_id
```

---

# 99. Compensation Step Status

Persist per step:

```text
COMPENSATED
FAILED_RETRYABLE
FAILED_FINAL
UNKNOWN
```

---

# 100. Partial Compensation

Possible:

```text
Inventory released
Wallet release failed
Promotion released
```

Do not mark Saga fully compensated.

---

# 101. Compensation Retry Identity

Use the same compensation idempotency key.

Example:

```text
CHECKOUT:{order_id}:COMPENSATE:WALLET_RELEASE
```

---

# 102. Compensation Retry Exhaustion

After automatic retry budget:

```text
MANUAL_INTERVENTION
```

and alert.

---

# 103. Compensation SLO

Transport retry deadline and business compensation SLO are different.

Example:

```text
Refund expected within X minutes/hours
```

Exact target:

```text
TBD_SLO
```

---

# 104. Order Completion Boundary

Depending policy, completion may involve:

```text
Consume Inventory
Finalize Payment
Mark Order DONE
```

or these may happen earlier.

---

# 105. Completion Secondary Effects

After:

```text
OrderCompleted
```

these remain outside critical Saga:

```text
Loyalty
Mission
Notification
Analytics
```

unless business explicitly requires otherwise.

---

# 106. Why Secondary Effects Are Excluded

If Notification fails:

```text
Order remains DONE
```

If Loyalty fails:

```text
Order remains DONE
Points can recover later
```

---

# 107. Top-Up Saga

Representative:

```text
Create Payment
      ↓
Capture External Payment
      ↓
Credit Wallet
      ↓
Sync ERP asynchronously
```

---

# 108. Top-Up Critical Boundary

Wallet credit must not occur until:

```text
authoritative Payment success
```

---

# 109. Payment Success + Wallet Credit Failure

This creates:

```text
captured external payment
but Wallet not credited
```

High-priority financial mismatch.

Saga/reconciliation must recover.

---

# 110. Wallet Credit Idempotency

Use stable unique reference such as:

```text
payment_id
topup_id
```

Retry credit safely.

---

# 111. ERP Sync Failure

If ERP is secondary:

```text
Wallet Top-Up remains successful
ERP sync retries asynchronously
```

Do not reverse customer Wallet solely because reporting sync failed.

---

# 112. Reward Fulfillment Saga

Representative:

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

# 113. Reward Compensation

May differ by reward type:

```text
unused coupon → revoke
points → reverse
Wallet credit → adjustment/reversal
```

Some rewards may not support automatic reversal.

---

# 114. Promotion Redemption Workflow

Checkout may:

```text
Reserve Promotion
```

then:

```text
Redeem after durable order
```

If checkout fails:

```text
Release Promotion
```

---

# 115. Promotion Restoration After Cancellation

Not automatically the exact inverse of redemption.

Policy may:

```text
restore usage
reissue coupon
do nothing
```

---

# 116. Saga + Outbox

When Saga state transition publishes event:

```text
BEGIN
update Saga
update local business state
insert outbox
COMMIT
```

---

# 117. Saga + Inbox

If Saga owner/participant consumes event:

```text
dedupe event
apply local state change
insert outbox if required
commit
```

in one local transaction.

---

# 118. Outbox Guarantee

Outbox prevents:

```text
business DB committed
but event publication intent lost
```

---

# 119. Inbox Guarantee

Inbox prevents:

```text
duplicate message
→ duplicate business side effect
```

---

# 120. Outbox Does Not Guarantee Consumer Success

Consumer still needs:

```text
retry
idempotency
DLQ
reconciliation
```

---

# 121. Eventual Consistency

Distributed workflows may temporarily show different intermediate states.

That is acceptable only when convergence is explicit.

---

# 122. Eventual Consistency UX

Example:

```text
Order cancellation requested
Payment refund processing
```

UI should show:

```text
Cancellation processing
Refund pending
```

rather than fake instant consistency.

---

# 123. Eventual Consistency Is Not Data Loss

Temporary mismatch is acceptable only when:

```text
workflow knows expected state
recovery exists
SLO exists
reconciliation exists
```

---

# 124. Convergence

Every Saga defines:

```text
valid final consistent states
```

---

# 125. Successful Convergence

Example:

```text
Order = DONE
Inventory = CONSUMED
Payment = CAPTURED
Promotion = REDEEMED
Wallet = CAPTURED if Wallet path
```

---

# 126. Cancelled Convergence

Example:

```text
Order = CANCELLED
Inventory = RELEASED
Wallet = RELEASED / REFUNDED
Payment = REVERSED / REFUNDED
Promotion = RELEASED / RESTORED according to policy
```

---

# 127. Failure Convergence

Example:

```text
Order = FAILED / not active
Inventory = RELEASED
Payment = NO_CHARGE
Wallet = NO_RESERVED_FUNDS
Promotion = RELEASED
```

---

# 128. Compensation Convergence

Saga is not fully finished until:

```text
all required compensations
reach accepted terminal states
```

---

# 129. Saga Events

Possible operational facts:

```text
CheckoutSagaStarted
CheckoutSagaCompleted
CheckoutSagaFailed
CheckoutSagaCompensationStarted
CheckoutSagaCompensated
CheckoutSagaManualInterventionRequired
```

Publish only if actual consumers need them.

---

# 130. Saga Commands

Examples:

```text
ReserveInventory
AuthorizePayment
ReleaseInventory
RefundPayment
```

These are commands, not events.

---

# 131. Choreography Risk

Long event chains can create:

```text
implicit workflow
hidden dependencies
event cycles
difficult compensation
debug complexity
```

---

# 132. Event Cycle Anti-Pattern

Avoid uncontrolled chains such as:

```text
OrderCreated
→ InventoryReserved
→ PaymentAuthorized
→ OrderUpdated
→ InventoryChanged
→ ...
```

with no clear owner.

---

# 133. Choreography Appropriate Cases

Good:

```text
OrderCompleted → Loyalty
OrderCompleted → Mission
OrderCompleted → Analytics
```

because consumers are independent.

---

# 134. Orchestration Appropriate Cases

Good:

```text
Checkout
Cancellation
Refund
Top-Up
Reward Fulfillment
```

where multiple participants determine one business outcome.

---

# 135. Saga Command Transport

Commands may use:

```text
synchronous REST/gRPC
```

or:

```text
Kafka commands
```

depending latency/durability requirements.

---

# 136. Synchronous Orchestrated Saga

Coordinator calls participants directly.

Advantages:

```text
fast customer result
lower latency
clear sequence
```

Risks:

```text
availability coupling
timeout complexity
```

---

# 137. Asynchronous Orchestrated Saga

Coordinator sends durable commands and waits for results.

Advantages:

```text
durability
resilience
less request-time coupling
```

Costs:

```text
more state
more complexity
longer UX
```

---

# 138. Hybrid Saga

Recommended common pattern:

```text
fast synchronous path
+
durable asynchronous recovery
```

Example:

```text
try Payment synchronously
if timeout/UNKNOWN:
  persist durable state
  recover asynchronously
```

---

# 139. Recommended Checkout Strategy

For normal mobile checkout:

```text
synchronous orchestration
with durable Saga state
```

Successful path stays fast.

Failures remain recoverable.

---

# 140. Participant Command Response

Where useful return:

```text
operation_id / reference
status
result
retryable
```

---

# 141. Participant Operation States

Examples:

Inventory reservation:

```text
ACTIVE
CONSUMED
RELEASED
EXPIRED
```

Payment:

```text
AUTHORIZED
CAPTURED
FAILED
UNKNOWN
```

Wallet reservation:

```text
ACTIVE
CAPTURED
RELEASED
```

---

# 142. Saga Stores References, Not Duplicate Domain State

Saga may store:

```text
inventory_reservation_id
payment_id
wallet_reservation_id
promotion_reservation_id
selected status projection
```

Participant remains authoritative.

---

# 143. Query Before Compensation

If Saga state is uncertain:

```text
query participant
before compensation
```

---

# 144. Payment Query Before Compensation

Example:

```text
Payment timeout
→ query Payment
→ if CAPTURED: Refund
→ if AUTHORIZED: Reverse
→ if FAILED: no compensation
```

---

# 145. Compensation Preconditions

Participant validates:

```text
current local state
```

not the orchestrator's assumption.

---

# 146. Inventory Release Precondition

If reservation is already:

```text
CONSUMED
```

Release must not silently pretend success.

Return explicit state/error.

---

# 147. Wallet Release Precondition

If funds are already:

```text
CAPTURED
```

then:

```text
ReleaseFunds
```

is invalid.

Saga may require:

```text
RefundFunds
```

---

# 148. Step Retry Matrix

Document per step:

| Step | Retry? | Idempotency | UNKNOWN Resolution | Compensation |
|---|---|---|---|---|
| Reserve Inventory | Yes | Required | Query reservation | Release |
| Reserve Wallet | Yes | Required | Query reservation | Release |
| Authorize Payment | Carefully | Required | Query Payment | Reverse |
| Capture Payment | Carefully | Required | Query Payment | Refund |
| Reserve Promotion | Yes | Required | Query reservation | Release |
| Redeem Promotion | Yes | Required | Query redemption | Restore policy |

---

# 149. Failure Classification

Every step result becomes:

```text
RETRYABLE
NON_RETRYABLE
UNKNOWN
```

---

# 150. Retryable Examples

Possible:

```text
503
temporary network failure
transient DB failure
```

when idempotency makes retry safe.

---

# 151. Non-Retryable Examples

```text
insufficient balance
insufficient stock
invalid coupon
business rule rejection
```

Do not blindly retry.

---

# 152. UNKNOWN Example

```text
request sent
response lost
```

requires status resolution.

---

# 153. Recovery Backoff

Saga recovery retries use:

```text
exponential backoff
jitter
maximum attempts
```

---

# 154. Durable Retry Scheduling

Store:

```text
next_retry_at
```

in durable state.

Do not depend only on in-memory timers.

---

# 155. Retry Exhaustion

When retry budget is exhausted:

```text
FAILED_FINAL
or
MANUAL_INTERVENTION
```

according to risk.

---

# 156. DLQ Role

Kafka transport failure may use DLQ.

But:

```text
DLQ is not Saga state
```

Saga must remain durably inspectable.

---

# 157. Poison Command

After bounded retry, malformed/unprocessable command may enter DLQ.

Examples:

```text
invalid schema
missing mapping
software bug
```

---

# 158. DLQ Replay Safety

Replay preserves:

```text
command_id
event_id
idempotency reference
```

---

# 159. Message Ordering

Cross-service messages may arrive:

```text
duplicated
late
out of order
```

Consumers must defend.

---

# 160. Aggregate Version

Include:

```text
aggregate_version
```

when state ordering matters.

---

# 161. Stale Event

If consumer already processed:

```text
version 10
```

and receives:

```text
version 8
```

it may ignore as stale according to semantics.

---

# 162. Missing Version Gap

If version:

```text
12
```

arrives after:

```text
10
```

consumer may:

```text
wait
query source
process if self-contained
```

according to design.

---

# 163. Per-Aggregate Kafka Ordering

Use:

```text
aggregate_id
```

as partition key when required.

---

# 164. No Cross-Aggregate Ordering Assumption

Do not depend on global order between:

```text
Payment
Inventory
Order
Wallet
Promotion
```

events.

Saga state coordinates the sequence.

---

# 165. Concurrent Saga Commands

Example:

```text
Checkout
Cancel
```

arrive simultaneously.

Owning domain state/version decides valid business outcome.

---

# 166. Saga Locking

Use:

```text
optimistic version
or
short row lock
```

for local Saga transition.

Do not keep locks across remote calls.

---

# 167. Participant Command Deduplication

Participant stores:

```text
operation
business_reference
idempotency_key
request_hash
result
```

---

# 168. Idempotency Result Replay

If command succeeded previously:

```text
return previous success result
```

including same stable operation reference.

---

# 169. Idempotency In Progress

If same logical command is still processing:

```text
IN_PROGRESS
```

or brief documented wait.

Do not execute a second side effect.

---

# 170. Deterministic Failure Replay

For deterministic final failure:

```text
same retry
→ same failure
```

unless contract explicitly permits reevaluation after business state changes.

---

# 171. Idempotency Retention

For high-risk financial/business commands:

```text
retention may need to be long
```

Do not expire idempotency while duplicate retry remains plausible.

---

# 172. Business Uniqueness

Use permanent uniqueness when stronger than idempotency TTL.

Example:

```text
one Wallet Top-Up per payment_id
```

---

# 173. Saga Database Schema

Order-owned example:

```text
checkout_sagas
checkout_saga_steps
checkout_saga_attempts
cancellation_sagas
cancellation_saga_steps
saga_state_history
saga_reconciliation_mismatches
```

---

# 174. Checkout Saga Table

Possible:

```text
id
order_id
cart_id
customer_id
saga_version
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

# 175. Saga Step Table

Possible:

```text
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

# 176. Saga Attempt Table

Possible:

```text
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

# 177. Saga Indexes

Likely:

```text
UNIQUE(business_reference, saga_type)
(status, next_action_at)
(current_step, status)
```

---

# 178. Compensation Index

Possible:

```sql
CREATE INDEX idx_checkout_saga_compensation
ON checkout_sagas(next_action_at)
WHERE status = 'COMPENSATION_PENDING';
```

---

# 179. Saga State History

Possible table:

```text
saga_state_history
```

Fields:

```text
saga_id
old_state
new_state
step
reason
occurred_at
correlation_id
```

---

# 180. Saga History Benefits

Supports:

```text
incident investigation
customer support
reconciliation
postmortem
audit
```

---

# 181. Distributed Transaction Error Catalog

Candidates:

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

# 182. Admin Saga Query

Possible:

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
next action
```

---

# 183. Manual Retry API

Possible privileged operation:

```text
POST /api/v1/admin/sagas/{sagaId}/retry
```

Only when semantics allow safe retry.

---

# 184. Manual Compensation API

Possible:

```text
POST /api/v1/admin/sagas/{sagaId}/compensate
```

Requirements:

```text
permission
reason
audit
domain-specific validation
```

---

# 185. Avoid Generic Force Complete

Do not implement:

```text
forceCompleteSaga()
```

as a general admin escape hatch.

It can hide broken financial/stock state.

Use domain-specific repair operations.

---

# 186. Saga Metrics

Candidate:

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

# 187. Active Saga Gauges

Track:

```text
active_sagas
compensation_pending
unknown_steps
stuck_sagas
```

---

# 188. Stuck Saga Definition

Typical:

```text
status non-terminal
updated_at older than threshold
```

Threshold depends on Saga type.

---

# 189. Saga SLIs

Possible:

```text
Checkout success rate
P95 Saga duration
Compensation success rate
UNKNOWN resolution time
Stuck Saga count
```

---

# 190. Saga Alerts

Alert on:

```text
Checkout failure spike
Payment UNKNOWN spike
Compensation backlog
Manual intervention
Stuck Saga
Recovery worker stalled
```

---

# 191. Saga Dashboard

Show:

```text
started/completed/failed
duration distribution
failure by step
retry count
UNKNOWN states
compensation states
manual intervention count
recovery backlog
```

---

# 192. Distributed Trace

Trace representative flow:

```text
Order Saga
  ↓
Promotion Reserve
  ↓
Inventory Reserve
  ↓
Payment Authorize / Wallet Reserve
  ↓
Order DB
  ↓
Capture / Finalize
  ↓
Outbox
```

---

# 193. Long-Running Saga Trace Limitation

Saga may outlive one trace.

Use durable identifiers:

```text
saga_id
business_reference
correlation_id
```

across multiple traces.

---

# 194. Structured Logging

Include:

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

Avoid unnecessary sensitive data.

---

# 195. Reconciliation

Reconciliation asks:

```text
Does participant state match expected Saga state?
```

---

# 196. Checkout Reconciliation Examples

Detect:

```text
Saga COMPLETED but Payment not CAPTURED
Saga FAILED but Inventory reservation ACTIVE
Order CANCELLED but Wallet funds RESERVED
Order DONE but Promotion still RESERVED
```

---

# 197. Reconciliation Sources

Query authoritative services:

```text
Order
Inventory
Payment
Wallet
Promotion
```

through:

```text
APIs
service-local reconciliation workflows
approved read models
```

Never through cross-service private DB reads.

---

# 198. Reconciliation Frequency

Possible:

```text
near-real-time for financial mismatch
hourly scheduled reconciliation
daily full reconciliation
```

Exact schedules:

```text
TBD_OPERATIONS_POLICY
```

---

# 199. Auto-Repair

Only auto-repair when action is:

```text
safe
idempotent
well-understood
```

Example:

```text
retry missing Inventory release
```

---

# 200. Manual Repair

High-risk mismatches such as:

```text
captured Payment mismatch
double Wallet credit
```

may require investigation and approved correction.

---

# 201. Reconciliation Record

Possible:

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
resolution_action
```

---

# 202. Reconciliation Is a Safety Net

It does not replace:

```text
Saga workflow logic
recovery worker
idempotency
```

---

# 203. Saga Security

Saga commands require:

```text
service authentication
operation authorization
idempotency
input validation
```

---

# 204. Internal Command Forgery Risk

A compromised service must not issue arbitrary:

```text
RefundPayment
CreditWallet
AdjustWallet
```

without correct scope.

---

# 205. Service Scope Examples

Possible:

```text
order-service:
  inventory.reserve
  inventory.release
  payment.authorize
  payment.capture
  payment.reverse
  wallet.reserve
  wallet.capture
  wallet.release
  promotion.reserve
  promotion.release
```

Exact scope policy remains Security-owned.

---

# 206. Compensation Authorization

Compensation may require dedicated scopes:

```text
inventory.release
wallet.release
payment.refund
payment.reverse
promotion.release
```

---

# 207. Saga Data Classification

Saga state may contain:

```text
payment references
wallet references
customer ID
order ID
amount
provider reference
```

Treat as confidential/financial operational data.

---

# 208. No Secrets in Saga State

Do not persist:

```text
provider secret
access token
private key
raw card data
```

in Saga workflow tables.

---

# 209. Saga Retention

Retain enough history for:

```text
support
finance
reconciliation
incident response
postmortem
```

Exact duration:

```text
TBD_RETENTION_POLICY
```

---

# 210. Saga Archive

Old completed Saga steps may be archived.

Do not remove references needed to explain financial/business state.

---

# 211. Backup

Back up:

```text
Saga instances
Saga steps
Saga attempts
state history
reconciliation records
outbox
```

---

# 212. Restore Risk

A Saga DB restore may rewind workflow state while participants remain ahead.

Example:

```text
restored Saga says PAYMENT_AUTHORIZED
Payment already CAPTURED
```

---

# 213. Post-Restore Rule

Do not resume blindly.

First perform:

```text
participant status reconciliation
```

for active/recent high-risk Sagas.

---

# 214. Disaster Recovery

Define:

```text
RPO
RTO
active Saga recovery
participant reference lookup
Kafka replay
idempotency retention
reconciliation
manual intervention process
```

---

# 215. Saga Code Structure

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

# 216. Saga Domain Object

Saga domain logic may encapsulate:

```text
allowed transitions
next-step policy
compensation requirement
terminal conditions
```

---

# 217. Saga Application Layer

Application layer coordinates:

```text
repositories
ports
participant clients
local transactions
recovery
```

---

# 218. Participant Ports

Examples:

```text
InventoryReservationPort
PromotionReservationPort
PaymentAuthorizationPort
WalletReservationPort
```

---

# 219. No Infrastructure in Saga Domain

Saga domain must not depend directly on:

```text
KafkaTemplate
WebClient
gRPC Stub
JPA
```

Use ports.

---

# 220. Saga Repository Port

Concept:

```java
public interface CheckoutSagaRepository {
    Optional<CheckoutSaga> findByOrderId(OrderId orderId);
    CheckoutSaga save(CheckoutSaga saga);
}
```

---

# 221. Recovery Use Case

Pseudo-flow:

```text
load due Saga
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

# 222. Step Executor Pattern

Possible per-step abstraction:

```text
execute
resolveUnknown
compensate
```

Do not hide business meaning behind a highly generic reflective engine.

---

# 223. Workflow Configuration

Keep critical financial sequence:

```text
versioned in code/architecture
```

initially.

Do not allow arbitrary admin reordering.

---

# 224. Feature Flags

Feature flags may switch:

```text
Wallet path
Payment provider
new Saga version
```

But they must not unpredictably mutate an in-flight Saga.

---

# 225. Saga Version

Persist:

```text
saga_version
```

for long-running workflows.

---

# 226. In-Flight Version Rule

An in-flight Saga should normally continue under:

```text
the version it started with
```

unless explicit migration is approved.

---

# 227. Saga Version Migration

Preferred:

```text
new Saga instances → v2
existing Saga instances → finish on v1
```

where possible.

---

# 228. Breaking Saga Migration

If active Saga cannot finish under old logic:

```text
explicit migration plan
state mapping
reconciliation
```

is required.

---

# 229. Rolling Deployment Compatibility

During rolling deployment:

```text
old pods
new pods
```

must understand active Saga states/schema.

Use backward-compatible DB evolution.

---

# 230. Flyway Plan

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

# 231. Testing Strategy

Required:

```text
domain state machine
forward workflow
compensation
idempotency
timeouts
UNKNOWN outcomes
crash recovery
concurrency
Kafka
outbox/inbox
reconciliation
security
load
DR
chaos
```

---

# 232. Happy Path Test

Representative checkout:

```text
Promotion reserve
Inventory reserve
Payment authorize
Order create
Payment capture
Promotion redeem
```

Verify:

```text
Saga COMPLETED
one side effect each
```

---

# 233. Inventory Failure Test

Scenario:

```text
Promotion reserved
Inventory insufficient
```

Expected:

```text
Promotion released
No Payment call
Saga compensated/failed
```

---

# 234. Payment Failure Test

Scenario:

```text
Promotion reserved
Inventory reserved
Payment declined
```

Expected:

```text
Inventory released
Promotion released
No duplicate payment
```

---

# 235. Wallet Failure Test

Scenario:

```text
Inventory reserved
Wallet insufficient balance
```

Expected:

```text
Inventory released
Promotion released
No Wallet duplicate effect
```

---

# 236. Order Persistence Failure Test

Scenario:

```text
Inventory reserved
Payment authorized
Order persist fails
```

Expected:

```text
Reverse Payment authorization
Release Inventory
Release Promotion
```

---

# 237. Capture Failure Test

Scenario:

```text
Order created
Payment capture fails
```

Verify approved policy:

```text
retry capture
cancel Order
reverse/refund
manual intervention
```

---

# 238. Unknown Payment Test

Simulate:

```text
provider authorizes
response lost
```

Expected:

```text
Saga → UNKNOWN
query by reference
resolve AUTHORIZED
continue once
```

---

# 239. Unknown Inventory Test

Simulate:

```text
Inventory reservation commits
response lost
```

Expected:

```text
query / retry same idempotency key
one reservation only
```

---

# 240. Duplicate Command Test

Send same:

```text
ReserveInventory
```

with same idempotency key concurrently.

Expected:

```text
one reservation
same result/reference
```

---

# 241. Duplicate Compensation Test

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

# 242. Crash After Participant Success

Simulate:

```text
participant commits success
orchestrator crashes before persisting response
```

Recovery must:

```text
query participant
or retry same idempotent command
```

---

# 243. Crash After Saga State Commit

Simulate:

```text
Saga persists current step success
crashes before next step
```

Recovery resumes at next valid step.

---

# 244. Crash During Compensation

Recovery must continue remaining compensation safely.

---

# 245. Outbox Failure Test

If Kafka unavailable:

```text
Saga/local business transaction commits
Outbox remains pending
```

No lost event.

---

# 246. Consumer Duplicate Test

Replay:

```text
OrderCompleted
```

Verify downstream consumer applies effect once.

---

# 247. Out-of-Order Test

Deliver lifecycle events out of order.

Verify:

```text
state machine
aggregate version
stale-event checks
```

---

# 248. Concurrent Checkout/Cancel Test

Run:

```text
Checkout
Cancel
```

simultaneously.

Verify:

```text
one valid business outcome
```

---

# 249. Recovery Worker Concurrency Test

Multiple recovery pods find same due Saga.

Expected:

```text
one worker advances it
```

---

# 250. Reservation Expiry Race Test

Race:

```text
Saga capture/finalize
vs
participant expiry worker
```

Participant local transaction decides one valid result.

---

# 251. Reconciliation Test

Create intentional mismatches:

```text
Saga completed + Payment missing
Saga failed + Inventory reserved
Cancelled + Wallet reserved
```

Verify detection.

---

# 252. Manual Intervention Test

Force unrecoverable compensation failure.

Verify:

```text
MANUAL_INTERVENTION
alert
admin visibility
runbook
no silent retry forever
```

---

# 253. Load Test

Scenarios:

```text
Checkout burst
high cancellation rate
large recovery backlog
provider degradation
many UNKNOWN states
```

---

# 254. Chaos Test

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

Verify eventual convergence.

---

# 255. Payment Safety Test

Prove under retries/crashes:

```text
no duplicate capture
no duplicate refund
```

---

# 256. Wallet Safety Test

Prove:

```text
no double reserve
no double capture
no double refund
```

---

# 257. Inventory Safety Test

Prove:

```text
no double reservation
no negative stock due to Saga retry
release/consume race is safe
```

---

# 258. Promotion Safety Test

Prove:

```text
one coupon reservation
one redemption
release safe
usage limit not exceeded
```

---

# 259. Definition of Done — Saga

- [ ] Saga owner identified.
- [ ] Forward steps documented.
- [ ] Participant ownership clear.
- [ ] Compensation per completed step defined.
- [ ] Stable business reference.
- [ ] Stable idempotency key per step.
- [ ] Request hashes defined.
- [ ] UNKNOWN strategy exists.
- [ ] Query-by-reference exists where high-risk.
- [ ] Timeout/retry policy exists.
- [ ] Business TTLs coordinated.
- [ ] Durable workflow state exists.
- [ ] Recovery worker exists.
- [ ] Reconciliation exists.
- [ ] Metrics/alerts exist.
- [ ] Tests exist.
- [ ] Runbook exists.

---

# 260. Definition of Done — Participant Command

- [ ] Participant owns local transaction.
- [ ] Idempotency.
- [ ] Business reference.
- [ ] Request hash.
- [ ] Stable operation/result reference.
- [ ] Retry semantics.
- [ ] Query-by-reference for high-risk state.
- [ ] Compensation API where required.
- [ ] Outbox event where required.
- [ ] Authorization scope.

---

# 261. Definition of Done — Compensation

- [ ] Business meaning is explicit.
- [ ] Preconditions are explicit.
- [ ] Idempotency.
- [ ] Retry strategy.
- [ ] UNKNOWN behavior.
- [ ] Terminal results.
- [ ] Manual escalation path.
- [ ] Audit.
- [ ] Tests.

---

# 262. Distributed Transaction Review Checklist

## Ownership

- [ ] One Saga owner.
- [ ] Participant owners.
- [ ] Source of truth per state.
- [ ] No cross-service DB transaction.

## Correctness

- [ ] Local ACID.
- [ ] Idempotency.
- [ ] Compensation.
- [ ] UNKNOWN.
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

# 263. Checkout Saga Review Checklist

- [ ] Catalog validation.
- [ ] Promotion reserve/release/redeem.
- [ ] Inventory reserve/release/consume.
- [ ] Payment authorize/capture/reverse/refund.
- [ ] Wallet reserve/capture/release/refund.
- [ ] Durable Order state.
- [ ] Stable idempotency keys.
- [ ] UNKNOWN provider/participant state.
- [ ] Client retry.
- [ ] Final convergence matrix.

---

# 264. Cancellation Saga Review Checklist

- [ ] Valid cancellation policy.
- [ ] CANCELLATION_REQUESTED.
- [ ] Delivery cancellation if required.
- [ ] Inventory compensation.
- [ ] Payment/Wallet compensation.
- [ ] Promotion restoration policy.
- [ ] Refund-pending behavior.
- [ ] Retry/recovery.
- [ ] Final CANCELLED semantics.

---

# 265. Data Review Checklist

- [ ] Saga table.
- [ ] Step table.
- [ ] Attempt history.
- [ ] Unique business reference.
- [ ] Idempotency references.
- [ ] Request hash.
- [ ] Version.
- [ ] Retry timestamp.
- [ ] Participant references.
- [ ] State history.
- [ ] Reconciliation history.
- [ ] Retention.

---

# 266. Security Review Checklist

- [ ] Service authentication.
- [ ] Per-command authorization.
- [ ] Compensation scopes.
- [ ] Admin retry RBAC.
- [ ] Manual repair audited.
- [ ] Sensitive references protected.
- [ ] No raw secrets in Saga state.
- [ ] High-risk financial commands restricted.

---

# 267. Operations Review Checklist

- [ ] Saga dashboard.
- [ ] Step metrics.
- [ ] Stuck Saga alert.
- [ ] UNKNOWN alert.
- [ ] Compensation backlog.
- [ ] Recovery worker health.
- [ ] Reconciliation.
- [ ] Manual intervention queue.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 268. Production Readiness Checklist

Before production:

- [ ] Happy-path Saga passes.
- [ ] Every forward-step failure tested.
- [ ] Every compensation tested.
- [ ] Duplicate command tests pass.
- [ ] Duplicate compensation tests pass.
- [ ] UNKNOWN Payment test passes.
- [ ] UNKNOWN Inventory test passes.
- [ ] UNKNOWN Wallet test passes where applicable.
- [ ] Crash-after-success recovery passes.
- [ ] Crash-after-state-commit recovery passes.
- [ ] Recovery-worker concurrency passes.
- [ ] Reservation-expiry races pass.
- [ ] Outbox/inbox tests pass.
- [ ] Reconciliation tested.
- [ ] Chaos test passes.
- [ ] Manual intervention runbook tested.
- [ ] Alerts configured.
- [ ] DR recovery reviewed.
- [ ] Final-state matrix approved.

---

# 269. Initial Implementation Order

Follow the source sequence:

```text
1. Define Checkout Saga states.
2. Define participant command contracts.
3. Add participant idempotency.
4. Add query-by-reference APIs.
5. Build Saga persistence.
6. Implement forward workflow.
7. Implement compensation.
8. Add timeout/retry metadata.
9. Add Recovery Worker.
10. Add UNKNOWN resolution.
11. Add Outbox/Inbox.
12. Add Cancellation Saga.
13. Add Reconciliation.
14. Add Admin visibility.
15. Add Metrics/Alerts.
16. Add Chaos/Failure tests.
```

---

# 270. Minimum Viable Distributed Transaction Standard

Every critical cross-service workflow must have:

```text
One Saga owner
Explicit states
Explicit steps
Stable business reference
Stable idempotency key per step
Local ACID transactions
Compensation
UNKNOWN handling
Durable recovery state
Outbox / Inbox
Retry policy
Reconciliation
Observability
```

---

# 271. What Not to Do

Reject designs that rely on:

```text
cross-service DB transaction
direct write to another service DB
blind retries
timeout = failure
best-effort financial compensation
in-memory-only workflow state
one giant Kafka choreography for Checkout
```

---

# 272. Required Governance Artifacts

Every critical Saga must have:

```text
sequence diagram
failure matrix
compensation matrix
idempotency table
timeout/retry table
final convergence matrix
reconciliation plan
```

---

# 273. Failure Matrix

Recommended columns:

| Step | Failure | Local State | Remote State | Retry? | Compensation? | Client Result | Recovery |
|---|---|---|---|---|---|---|---|

---

# 274. Compensation Matrix

Example:

| Forward Action | Compensation | Idempotency Reference |
|---|---|---|
| ReservePromotion | ReleasePromotion | promotion_reservation_id |
| ReserveInventory | ReleaseInventory | order_id / reservation_id |
| ReserveWallet | ReleaseWalletFunds | order_id / reservation_id |
| AuthorizePayment | ReverseAuthorization | payment_id |
| CapturePayment | RefundPayment | payment_id / capture_id |

---

# 275. Final State Matrix

Example:

```text
SUCCESS
Order = DONE
Payment = CAPTURED
Inventory = CONSUMED
Promotion = REDEEMED

CANCELLED
Order = CANCELLED
Payment = REFUNDED / NO_CHARGE
Inventory = RELEASED
Wallet = RELEASED / REFUNDED
Promotion = RESTORED / RELEASED according to policy

PENDING_REFUND
Order = CANCELLED
Payment = REFUND_PENDING
Inventory = RELEASED
```

---

# 276. Saga Version Governance

Every significant workflow revision records:

```text
saga_version
```

and rollout strategy.

---

# 277. Compensation Governance

A participant adding new irreversible behavior must update:

```text
Saga failure matrix
compensation model
reconciliation plan
runbook
tests
```

before production.

---

# 278. Platform ADRs

Recommended:

```text
ADR-SAGA-001 Saga ownership model
ADR-SAGA-002 Orchestration vs choreography
ADR-SAGA-003 Checkout Saga sequence
ADR-SAGA-004 Cancellation Saga sequence
ADR-SAGA-005 Saga persistence model
ADR-SAGA-006 Stable step idempotency keys
ADR-SAGA-007 UNKNOWN outcome handling
ADR-SAGA-008 Participant query-by-reference standard
ADR-SAGA-009 Retry / backoff standard
ADR-SAGA-010 Compensation ordering
ADR-SAGA-011 Manual intervention policy
ADR-SAGA-012 Recovery Worker concurrency
ADR-SAGA-013 Reconciliation model
ADR-SAGA-014 Saga versioning
ADR-SAGA-015 Top-Up Saga ownership
ADR-SAGA-016 Reward fulfillment Saga ownership
```

---

# 279. Phase 14 Policy Freeze Checklist

Before production resolve:

- [ ] Checkout Saga owner.
- [ ] Cancellation Saga owner.
- [ ] Top-Up Saga owner.
- [ ] Reward fulfillment Saga owner.
- [ ] Checkout forward sequence.
- [ ] Durable Order creation point.
- [ ] Promotion reserve/redeem timing.
- [ ] Inventory reserve/consume timing.
- [ ] Payment authorize/capture timing.
- [ ] Wallet reserve/capture timing.
- [ ] Payment compensation rules.
- [ ] Wallet compensation rules.
- [ ] Promotion restoration rules.
- [ ] Inventory compensation rules.
- [ ] Cancellation finalization rule.
- [ ] Refund-pending semantics.
- [ ] Saga status model.
- [ ] Step status model.
- [ ] Saga ID format.
- [ ] Stable idempotency key format.
- [ ] Request-hash canonicalization.
- [ ] Query-by-reference requirements.
- [ ] Transport timeout policy.
- [ ] Business TTL coordination.
- [ ] Retry max/backoff.
- [ ] Recovery Worker schedule.
- [ ] Recovery Worker concurrency model.
- [ ] Manual intervention threshold.
- [ ] Reconciliation frequency.
- [ ] Auto-repair scope.
- [ ] Saga retention.
- [ ] Saga version migration policy.
- [ ] SLO/alert thresholds.
- [ ] RPO/RTO.

---

# 280. Recommended Phase 14 Work Breakdown

Suggested tickets:

```text
SAGA-001 Define Saga platform standard
SAGA-002 Document Checkout sequence
SAGA-003 Document Cancellation sequence
SAGA-004 Build failure matrix
SAGA-005 Build compensation matrix
SAGA-006 Build final-state matrix
SAGA-007 Define Saga state model
SAGA-008 Define Saga step model
SAGA-009 Define Saga attempt model
SAGA-010 Define stable Saga ID
SAGA-011 Define business-reference uniqueness
SAGA-012 Define step idempotency-key format
SAGA-013 Define request-hash standard
SAGA-014 Audit participant idempotency
SAGA-015 Implement Inventory query-by-reference
SAGA-016 Implement Promotion query-by-reference
SAGA-017 Implement Payment query-by-reference
SAGA-018 Implement Wallet query-by-reference
SAGA-019 Create checkout_sagas table
SAGA-020 Create checkout_saga_steps table
SAGA-021 Create checkout_saga_attempts table
SAGA-022 Create saga_state_history table
SAGA-023 Create reconciliation table
SAGA-024 Implement Saga repository
SAGA-025 Implement CheckoutSaga domain state machine
SAGA-026 Implement StartCheckoutUseCase
SAGA-027 Implement AdvanceCheckoutUseCase
SAGA-028 Implement Promotion reserve step
SAGA-029 Implement Inventory reserve step
SAGA-030 Implement Payment authorization step
SAGA-031 Implement Wallet reserve path
SAGA-032 Implement durable Order step
SAGA-033 Implement Payment capture step
SAGA-034 Implement Wallet capture step
SAGA-035 Implement Promotion redeem step
SAGA-036 Implement Saga completion
SAGA-037 Implement compensation planner
SAGA-038 Implement Promotion release compensation
SAGA-039 Implement Inventory release compensation
SAGA-040 Implement Payment reverse compensation
SAGA-041 Implement Payment refund compensation
SAGA-042 Implement Wallet release compensation
SAGA-043 Implement Wallet refund compensation
SAGA-044 Implement UNKNOWN state
SAGA-045 Implement participant status resolution
SAGA-046 Implement durable retry schedule
SAGA-047 Implement Recovery Worker
SAGA-048 Implement SKIP LOCKED worker leasing
SAGA-049 Implement optimistic Saga versioning
SAGA-050 Implement recovery metrics
SAGA-051 Implement CANCELLATION_REQUESTED workflow
SAGA-052 Implement Cancellation Saga
SAGA-053 Implement cancellation compensation ordering
SAGA-054 Implement refund-pending handling
SAGA-055 Implement Top-Up Saga
SAGA-056 Implement Wallet-credit idempotency
SAGA-057 Implement Reward Fulfillment Saga later-ready contract
SAGA-058 Integrate Outbox
SAGA-059 Integrate Inbox
SAGA-060 Implement Saga events where required
SAGA-061 Implement admin Saga query
SAGA-062 Implement privileged manual retry
SAGA-063 Implement privileged manual compensation
SAGA-064 Implement manual-intervention state
SAGA-065 Implement reconciliation
SAGA-066 Implement safe auto-repair
SAGA-067 Implement state-history audit
SAGA-068 Add Saga metrics
SAGA-069 Add Saga dashboard
SAGA-070 Add Saga alerts
SAGA-071 Add tracing/correlation
SAGA-072 Write Saga runbooks
SAGA-073 Implement happy-path tests
SAGA-074 Implement forward-step failure tests
SAGA-075 Implement compensation tests
SAGA-076 Implement duplicate-command tests
SAGA-077 Implement duplicate-compensation tests
SAGA-078 Implement UNKNOWN Payment tests
SAGA-079 Implement UNKNOWN Inventory tests
SAGA-080 Implement UNKNOWN Wallet tests
SAGA-081 Implement crash-after-success tests
SAGA-082 Implement crash-after-state tests
SAGA-083 Implement Recovery Worker concurrency tests
SAGA-084 Implement expiry-race tests
SAGA-085 Implement outbox/inbox tests
SAGA-086 Implement reconciliation tests
SAGA-087 Implement manual-intervention tests
SAGA-088 Implement load tests
SAGA-089 Implement chaos tests
SAGA-090 Implement security tests
SAGA-091 Implement backup/restore reconciliation drill
SAGA-092 Implement Saga versioning
SAGA-093 Implement rolling-deploy compatibility
SAGA-094 Complete ADRs/policy freeze
SAGA-095 Phase 14 exit review
```

---

# 281. Step 1 — Checkout Saga Design Acceptance

Verify team can answer:

```text
Who owns Checkout Saga?
What are the forward steps?
Why are they ordered this way?
Which steps reserve scarce resources?
Which step makes Order durable?
Which step captures money?
```

---

# 282. Step 2 — Participant Contract Acceptance

Every high-risk participant command has:

```text
stable business reference
stable idempotency key
request hash
stable result reference
query-by-reference
compensation command
```

where applicable.

---

# 283. Step 3 — Persistence Acceptance

Verify:

```text
Saga state survives restart
Step state survives restart
Attempt history persists
next_retry_at persists
participant references persist
version protects concurrent updates
state history is queryable
```

---

# 284. Step 4 — UNKNOWN Acceptance

For every side-effecting participant simulate:

```text
remote success
response loss
```

Verify:

```text
Saga does not assume FAILED
no duplicate side effect
status resolution converges correctly
```

---

# 285. Step 5 — Compensation Acceptance

For every completed forward step:

```text
later step fails
```

Verify required compensation is:

```text
selected correctly
idempotent
retryable
observable
```

---

# 286. Step 6 — Recovery Worker Acceptance

Kill process at every step boundary.

Verify another process can:

```text
load Saga
resolve current participant state
resume
retry
or compensate
```

without duplicate side effects.

---

# 287. Step 7 — Cancellation Acceptance

Verify:

```text
CANCELLATION_REQUESTED durable
correct participant compensations
refund-pending policy
final CANCELLED semantics
no hidden pending reservation
```

---

# 288. Step 8 — Reconciliation Acceptance

Verify hidden mismatch detection across:

```text
Order
Inventory
Payment
Wallet
Promotion
```

without cross-service DB reads.

---

# 289. Step 9 — Operations Acceptance

Operators can inspect:

```text
Saga
current step
attempts
participant references
UNKNOWN state
next retry
compensation progress
manual intervention reason
```

without editing DB directly.

---

# 290. Step 10 — Restore Acceptance

After restoring Saga owner DB:

```text
do not blindly resume
reconcile participant states
resolve advanced remote states
repair outbox/inbox
resume only when safe
```

---

# 291. Exit Criteria — Ownership

The team can answer:

```text
Which service owns each Saga?
```

There is no ambiguous shared coordinator ownership.

---

# 292. Exit Criteria — Sequence

The team can explain:

```text
every forward step
why the order matters
which step is reversible
which step is irreversible
```

---

# 293. Exit Criteria — Compensation

The team can answer:

```text
What compensates every completed step if a later step fails?
```

including state-dependent financial compensation.

---

# 294. Exit Criteria — Idempotency

The team can prove:

```text
every command
every compensation
every client retry
every worker retry
```

is safe.

---

# 295. Exit Criteria — UNKNOWN

The team can explain:

```text
what happens when a participant side effect may have succeeded but response was lost
```

without assuming failure.

---

# 296. Exit Criteria — Recovery

The team can prove:

```text
process crash
pod restart
deployment
temporary outage
```

does not lose workflow position.

---

# 297. Exit Criteria — Eventual Consistency

The team has explicitly documented:

```text
allowed temporary mismatches
customer-visible pending states
final convergence states
SLOs
```

---

# 298. Exit Criteria — Reconciliation

The team can detect:

```text
Saga complete + Payment missing
Saga failed + Inventory active
Cancelled + Wallet reserved
DONE + Promotion only reserved
```

and route each mismatch correctly.

---

# 299. Exit Criteria — Operations

Operations can:

```text
inspect
retry safely
compensate safely
escalate
reconcile
```

a stuck Saga using approved tools/runbooks.

---

# 300. Exit Criteria — DR

The team can explain how restore avoids:

```text
duplicate charge
duplicate Wallet credit
duplicate Inventory reserve
duplicate Promotion reservation
incorrect compensation
```

---

# 301. Phase 14 Completion Tree

```text
PHASE 14 — DISTRIBUTED TRANSACTIONS / SAGA

├── Distributed Transaction Principles         ✅
├── Local ACID Boundary                        ✅
├── 2PC / XA Avoidance                         ✅
├── Saga Ownership                             ✅
├── Saga State Machine                         ✅
├── Saga Persistence                           ✅
├── Step / Attempt Model                       ✅
├── Stable Business References                 ✅
├── Step Idempotency                           ✅
├── Request Hashes                             ✅
├── Query-by-Reference                         ✅
├── UNKNOWN Outcome                            ✅
├── Transport Timeout vs Business TTL          ✅
├── Recovery Worker                            ✅
├── Worker Concurrency                         ✅
├── Checkout Saga                              ✅
│   ├── Promotion
│   ├── Inventory
│   ├── Payment
│   ├── Wallet
│   └── Ordering
├── Cancellation Saga                          ✅
├── Compensation                              ✅
│   ├── Ordering
│   ├── Retry
│   ├── UNKNOWN
│   └── Manual Intervention
├── Top-Up Saga                                ✅
├── Reward Fulfillment Contract                ✅
├── Outbox / Inbox                             ✅
├── Eventual Consistency                       ✅
├── Convergence                                ✅
├── Retry / DLQ                                ✅
├── Versioning                                 ✅
├── Reconciliation                             ✅
├── Security                                   ✅
├── Observability                              ✅
├── Backup / Restore / DR                      ✅
├── Testing / Chaos                            ✅
├── Runbooks                                   ✅
└── Governance Artifacts                       ✅
```

---

# 302. Handoff to Phase 15

After Phase 14, continue to:

```text
PHASE 15 — Kafka / Event Architecture
```

Phase 14 defines:

```text
business correctness across services
```

Phase 15 will define the infrastructure that transports async facts/commands reliably:

```text
Kafka cluster
topics
partitions
replication
consumer groups
producer configuration
consumer configuration
schema registry
event envelopes
ordering
retention
compaction
retries
DLQ
replay
outbox publisher
inbox processing
security
monitoring
capacity planning
```

---

# 303. Phase 15 Prerequisite

By the end of Phase 14, the platform already knows:

```text
which interactions are events
which are commands
which are synchronous
which require durable Saga state
which commands need idempotency
which consumers need Inbox
which producers need Outbox
which failures require DLQ
```

Phase 15 should implement those requirements without redefining domain ownership.

---

# 304. Final Phase 14 Principle

The distributed transaction model is:

```text
Business Workflow
      ↓
One Saga Owner
      ↓
Durable Saga State
      ↓
Participant Command
      ↓
Participant Local ACID
      ↓
Stable Result Reference
      ↓
Next Step
      ↓
Success / Compensation / UNKNOWN
      ↓
Recovery + Reconciliation
      ↓
Final Convergence
```

The most important implementation rules are:

```text
One Saga has one owner.
Each participant owns its own local transaction.
Never span a database transaction across a network call.
Do not use global 2PC/XA as the default.
Compensation is a new business action, not rollback.
Every command and every compensation is idempotent.
Retries reuse the same operation identity.
Timeout does not automatically mean failure.
UNKNOWN is a first-class workflow state.
High-risk participants support query-by-reference.
Saga state is durable.
Recovery workers resume incomplete workflows.
Compensation failures remain visible and recoverable.
Manual intervention is explicit, audited, and alerted.
Checkout is orchestrated.
Independent post-completion effects use choreography.
Secondary effects do not belong in the critical checkout Saga.
Saga stores participant references, not duplicate ownership.
Participant state determines valid compensation.
Outbox/Inbox support reliable messaging.
DLQ does not replace durable Saga state.
Eventual consistency requires known convergence.
Reconciliation detects hidden mismatches.
Restore requires participant reconciliation before blind resume.
Financial and stock compensation is never best-effort.
```

---

**End of PHASE 14 — Distributed Transactions / Saga**
