---
title: "PHASE 11 — Payment Service"
---

# PHASE 11 — Payment Service

> **Purpose:** Implement the platform Payment Service as the authoritative owner of external/provider payment lifecycle, including payment intents, attempts, authorization, capture, refunds, reversals, provider callbacks, idempotency, unknown outcomes, provider anti-corruption adapters, recovery, reconciliation, and payment events.
>
> **Previous Phase:** Phase 10 — Ordering Service
>
> **Next Phase:** Phase 12 — Wallet Service
>
> **Primary Architecture Basis:** PART 14 — Payment Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 22 — Distributed Transactions / Saga, PART 23 — Kafka / Event Architecture, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, REST/gRPC, Kafka, provider HTTP APIs, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 11 Goal

Phase 11 builds:

```text
payment-service
```

Payment Service owns:

```text
Payment
Payment Attempt
Payment Method Reference
Payment Provider Reference
Authorization
Capture
Payment Failure
Refund
Reversal
Provider Callback Processing
Payment Idempotency
Payment Reconciliation
Payment Events
Provider Error Mapping
Provider Retry Policy
```

It answers:

```text
Has payment been initiated?
Which payment method/provider is being used?
Was payment authorized?
Was payment captured?
Did the provider reject it?
Was a refund requested?
Was the refund completed?
Was the payment reversed?
Did this callback already process?
Is provider truth consistent with internal truth?
```

---

# 2. Primary Risk

The Payment Service protects one of the platform's highest-risk workflows:

```text
collecting and returning money exactly once
```

It must protect against:

```text
duplicate charge
duplicate capture
duplicate refund
replayed callback
out-of-order callback
unknown provider outcome
amount mismatch
currency mismatch
provider timeout
partial failure
```

---

# 3. Non-Responsibilities

Payment does not own:

```text
Order lifecycle
Wallet balance
Inventory stock
Product price
Coupon rules
Loyalty points
Customer profile
Notification delivery
```

It references:

```text
order_id
customer_id
amount
currency
```

without taking ownership of those domains.

---

# 4. Payment vs Ordering

Ordering owns:

```text
business purchase lifecycle
```

Payment owns:

```text
money collection lifecycle
```

Critical rule:

```text
Order Status != Payment Status
```

Example:

```text
Order = PENDING
Payment = AUTHORIZED
```

or:

```text
Order = CANCELLED
Payment = REFUND_PENDING
```

---

# 5. Payment vs Wallet

Payment Service:

```text
external/provider money collection
```

Wallet Service:

```text
internal stored-value ledger
```

Payment must not write Wallet ledger/balance.

Wallet must not become a provider-payment adapter.

---

# 6. Phase 11 Success State

Core payment lifecycle:

```text
Create Payment
      ↓
Create Attempt
      ↓
Persist SENT + Stable Merchant Reference
      ↓
Provider Request
      ├──> AUTHORIZED
      │       ↓
      │     CAPTURED
      │
      ├──> FAILED
      │
      └──> UNKNOWN
              ↓
      Query / Callback / Reconciliation
```

Refund lifecycle:

```text
CAPTURED
   ↓
Refund Requested
   ↓
Provider
   ├──> SUCCEEDED
   ├──> FAILED
   └──> UNKNOWN
```

---

# 7. Non-Negotiable Correctness Rules

Do not postpone:

```text
idempotency
callback deduplication
UNKNOWN outcome handling
provider reconciliation
```

Also enforce:

```text
Provider requests use stable references.
Timeout does not automatically mean failure.
UNKNOWN is a first-class state.
Out-of-order callbacks cannot regress state.
Refund totals never exceed captured totals.
Raw payment secrets are not logged.
Provider details stay behind an ACL/adapter.
Payment state changes are auditable.
```

---

# 8. Source-Defined Open Decisions

Freeze before production:

```text
Payment ID strategy
One Payment per order vs multiple
Initial payment methods
Initial provider
Immediate capture vs auth/capture
Capture timing
Partial capture support
Attempt limit
Payment expiry
QR expiry
Provider retry rules
Callback raw-payload retention
Refund authorization policy
Partial refunds
Dual-control threshold
Reversal policy
Provider status mapping
Reconciliation frequency
Settlement scope
Provider routing scope
Provider failover policy
Retention
RPO/RTO
```

Use explicit:

```text
TBD_POLICY
TBD_SECURITY
TBD_ARCHITECTURE
TBD_DR
```

until approved.

---

# 9. Payment Boundary

```text
                Order Service
                     │
                     ▼
               Payment Service
         ┌───────────┼────────────┐
         │           │            │
         ▼           ▼            ▼
      Payment      Refund      Provider ACL
         │           │            │
         └───────────┼────────────┘
                     ▼
                payment_db
                     │
                     ├── Provider A
                     ├── Provider B
                     ├── Bank API
                     └── Partner API
```

---

# 10. Ubiquitous Language

| Term | Meaning |
|---|---|
| Payment | Aggregate representing money collection for a business reference |
| Payment Attempt | One concrete provider/method attempt |
| Authorization | Provider approval for later collection |
| Capture | Final collection against an authorization |
| Refund | Return of captured funds |
| Reversal | Undoing authorization/capture according to provider semantics |
| Provider Reference | Provider-generated transaction identifier |
| Merchant Reference | Platform-generated stable reference sent to provider |
| Callback | Asynchronous provider notification |
| Unknown Outcome | Provider side effect may have occurred without definitive local response |
| Reconciliation | Comparison of provider truth with internal Payment truth |

---

# 11. Payment Aggregate

Primary aggregate:

```text
Payment
```

Possible state:

```text
payment_id
order_id
customer_id
payment_method
provider
status
amount
currency
authorized_amount
captured_amount
refunded_amount
merchant_reference
active_attempt_id
created_at
updated_at
completed_at
version
```

---

# 12. Payment Attempt

Possible state:

```text
attempt_id
payment_id
attempt_no
provider
provider_reference
status
requested_amount
currency
request_started_at
response_received_at
provider_code
provider_message
failure_category
```

Important:

```text
Payment Attempt != Payment
```

One Payment may have several attempts.

---

# 13. Payment Status

Canonical source statuses:

```text
CREATED
PENDING
AUTHORIZED
CAPTURED
FAILED
CANCELLED
PARTIALLY_REFUNDED
REFUNDED
REVERSED
UNKNOWN
```

Only use states with clear business meaning.

---

# 14. Payment Attempt Status

Possible:

```text
CREATED
SENT
PENDING
SUCCEEDED
FAILED
UNKNOWN
CANCELLED
```

---

# 15. Payment State Machine

Conceptual:

```text
CREATED
  ├──> PENDING
  ├──> AUTHORIZED
  ├──> CAPTURED
  ├──> FAILED
  └──> UNKNOWN

PENDING
  ├──> AUTHORIZED
  ├──> CAPTURED
  ├──> FAILED
  └──> UNKNOWN

AUTHORIZED
  ├──> CAPTURED
  ├──> REVERSED
  └──> FAILED only if provider semantics allow

CAPTURED
  ├──> PARTIALLY_REFUNDED
  ├──> REFUNDED
  └──> REVERSED only if provider semantics support it

PARTIALLY_REFUNDED
  └──> REFUNDED

FAILED
  → terminal for that attempt/payment unless a new attempt is allowed
```

---

# 16. Payment Invariants

Enforce:

```text
amount > 0
currency required
captured_amount <= authorized_amount unless provider semantics differ
refunded_amount <= captured_amount
refund amount > 0
merchant_reference stable
duplicate command cannot create duplicate provider side effect
terminal state cannot regress arbitrarily
```

---

# 17. Money Representation

Use exact:

```text
NUMERIC
```

or:

```text
minor units
```

Do not use floating point.

---

# 18. Currency

Always explicit:

```text
USD
KHR
```

Provider adapter validates provider-specific currency mapping.

---

# 19. Payment Method

Canonical examples:

```text
CARD
BANK
QR
WALLET
CASH
PARTNER
```

Payment Service may own only non-cash provider methods.

Cash may be represented by Ordering without provider transaction.

---

# 20. Provider

Provider is an integration concept.

Examples from source:

```text
ABA
ACLEDA
VISA_GATEWAY
MASTERCARD_GATEWAY
SMART
CELLCARD
```

Domain status remains provider-neutral.

---

# 21. Payment ID

Use stable opaque ID.

Decision:

```text
PAYMENT_ID_STRATEGY = TBD_POLICY
```

---

# 22. Merchant Reference

Platform-generated stable reference sent to provider.

Example shape:

```text
PAY-01J...
```

Requirements:

```text
unique
immutable
idempotent
traceable to Payment
```

---

# 23. Provider Reference

Store exact provider identifiers:

```text
provider_transaction_id
authorization_id
capture_id
refund_id
```

They are critical for:

```text
status query
reconciliation
refund
support
audit
```

---

# 24. Order Reference

Payment links to:

```text
order_id
```

as logical reference only.

No cross-service database FK.

---

# 25. Payment Intent

Create stable internal identity before provider call:

```text
order_id
amount
currency
method
provider
```

---

# 26. CreatePayment

Internal contract:

```text
CreatePayment
```

Input:

```text
order_id
customer_id
amount
currency
payment_method
idempotency_key
```

Output:

```text
payment_id
merchant_reference
status
provider_action if required
```

---

# 27. Payment Creation Idempotency

Same:

```text
order_id
operation
idempotency_key
request_hash
```

returns same Payment.

Same key with changed amount:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 28. One Payment per Order

Source suggests a simple model:

```text
one active Payment aggregate per order
```

with:

```text
multiple attempts
```

Decision:

```text
ACTIVE_PAYMENT_PER_ORDER_POLICY = TBD_POLICY
```

---

# 29. Multiple Attempts

Example:

```text
Payment PAY001
  Attempt 1 → ABA → FAILED
  Attempt 2 → ACLEDA → CAPTURED
```

One payment obligation remains tied to the Order.

---

# 30. Attempt Idempotency

Each provider attempt uses:

```text
merchant_reference
provider idempotency key if supported
```

Never rely only on HTTP retries.

---

# 31. New Attempt After Failure

A definitively failed attempt may allow:

```text
new provider
new payment method
new attempt
```

according to policy.

---

# 32. New Attempt After UNKNOWN

Do **not** start a new charge while prior attempt is:

```text
UNKNOWN
```

Resolve it first.

---

# 33. Payment Method Change

Before a new method:

```text
old attempt must be terminal/resolved
```

Then:

```text
create new attempt
```

---

# 34. Attempt Limit

Limit repeated attempts per Payment/Order.

Reasons:

```text
abuse
provider cost
customer confusion
```

Decision:

```text
MAX_PAYMENT_ATTEMPTS = TBD_SECURITY_POLICY
```

---

# 35. Authorization

Meaning:

```text
provider approves funds for later capture
```

Typical:

```text
Authorize
   ↓
Capture
```

Not every provider separates them.

---

# 36. AuthorizePayment

Input:

```text
payment_id
amount
currency
idempotency_key
```

---

# 37. Authorization Invariants

```text
payment not already captured
amount matches Payment intent
currency matches
payment not cancelled/refunded
```

---

# 38. Immediate Capture

Some providers use:

```text
sale = authorize + capture
```

Provider adapter maps success to:

```text
CAPTURED
```

---

# 39. Capture

Capture collects authorized funds.

Input:

```text
payment_id
authorization reference
amount
idempotency_key
```

---

# 40. Capture Idempotency

Repeated capture must never charge twice.

Use:

```text
capture reference
idempotency key
provider idempotency capability
unique internal command record
```

---

# 41. Partial Capture

Source allows when provider supports:

```text
authorized 20
capture 15
```

but initial version may forbid it.

Decision:

```text
PARTIAL_CAPTURE_ENABLED = TBD_SCOPE
```

---

# 42. Capture Timing

Source-supported:

```text
during checkout
on order acceptance
on fulfillment
```

Decision:

```text
PAYMENT_CAPTURE_TRIGGER = TBD_POLICY
```

---

# 43. Payment Failure Categories

Canonical:

```text
DECLINED
INSUFFICIENT_FUNDS
INVALID_PAYMENT_METHOD
EXPIRED
PROVIDER_UNAVAILABLE
TIMEOUT
FRAUD_REJECTED
INVALID_REQUEST
UNKNOWN
```

---

# 44. Provider Error Mapping

Example:

```text
provider "51"
→ INSUFFICIENT_FUNDS
```

```text
provider "05"
→ DECLINED
```

Mappings live in provider adapter/ACL.

---

# 45. Retryable Failure

Potentially retryable:

```text
temporary provider outage
network timeout
HTTP 503
```

---

# 46. Non-Retryable Failure

Usually:

```text
invalid payment method
insufficient funds
invalid amount
unsupported currency
```

Exact classification is provider-specific.

---

# 47. UNKNOWN Outcome

Most dangerous case:

```text
request sent
provider may have charged
response timed out/lost
```

Set:

```text
UNKNOWN
```

Do not immediately charge again.

---

# 48. UNKNOWN Resolution

Preferred:

```text
provider status query by merchant reference
```

or:

```text
callback
```

or:

```text
reconciliation
```

---

# 49. Timeout Rule

Never convert:

```text
TIMEOUT
```

automatically into:

```text
FAILED
```

when the provider may have processed the request.

---

# 50. Provider Status Query

Adapter should support where provider allows:

```text
GetPaymentStatus(merchant_reference)
```

This is essential to recover UNKNOWN.

---

# 51. Provider Call Timeouts

Every provider call needs:

```text
connect timeout
read timeout
overall deadline
```

No indefinite blocking.

---

# 52. Provider Retry Policy

Retry only when:

```text
request is safe
stable idempotency reference exists
provider supports safe retry
```

Use:

```text
bounded retry
backoff
jitter
```

---

# 53. Circuit Breaker

On repeated provider failure:

```text
open circuit
fail fast
recover gradually
```

But UNKNOWN financial outcomes still require recovery/reconciliation.

---

# 54. Provider Rate Limits

Respect:

```text
request limits
callback limits
status-query limits
```

Use queue/backoff as needed.

---

# 55. Provider Failover

Important source rule:

```text
never fail over to another provider
until previous attempt is definitively failed
```

unless duplicate charges are explicitly acceptable.

---

# 56. Multi-Provider Routing

Future Payment Router may consider:

```text
method
currency
availability
cost
success rate
business preference
```

Do not implement prematurely.

---

# 57. Routing Audit

If routing exists, record:

```text
selected provider
routing reason
routing policy version
```

---

# 58. Refund

Refund returns captured funds.

Supports:

```text
full refund
partial refund
```

where provider/business policy supports it.

---

# 59. Refund Input

```text
payment_id
amount
reason_code
idempotency_key
```

---

# 60. Refund Invariants

```text
Payment has captured funds
refund amount > 0
total refunded <= captured amount
currency unchanged
refund reference unique
```

---

# 61. Refund Status

Possible:

```text
REQUESTED
PENDING
SUCCEEDED
FAILED
UNKNOWN
CANCELLED
```

Payment aggregate may become:

```text
PARTIALLY_REFUNDED
REFUNDED
```

---

# 62. Refund Entity

Possible:

```text
refund_id
payment_id
merchant_refund_reference
provider_refund_reference
amount
currency
status
reason_code
requested_by
created_at
completed_at
```

---

# 63. Refund Idempotency

Scope:

```text
(payment_id, refund_operation, idempotency_key)
```

Same refund request must not return money twice.

---

# 64. Partial Refund

Example:

```text
captured = 20
refund 5
refund 5
```

Then:

```text
refunded = 10
remaining refundable = 10
```

---

# 65. Full Refund

When:

```text
refunded_amount == captured_amount
```

Payment becomes:

```text
REFUNDED
```

---

# 66. Refund UNKNOWN

If provider may have refunded but response timed out:

```text
refund = UNKNOWN
```

Then:

```text
query
callback
reconciliation
```

---

# 67. Refund Authorization

Refund is privileged.

Possible actors:

```text
Order cancellation workflow
Finance
Support with permission
System
```

Normal customer cannot submit arbitrary refund amount.

---

# 68. Refund Reason

Examples:

```text
ORDER_CANCELLED
DUPLICATE_CHARGE
CUSTOMER_SUPPORT
PARTIAL_FULFILLMENT
PROVIDER_CORRECTION
```

Reason is required.

---

# 69. Refund Concurrency

Two refund requests may race.

Guarantee:

```text
sum(successful + safely reserved pending refunds)
<=
captured amount
```

---

# 70. Remaining Refundable Formula

Source concept:

```text
remaining_refundable
=
captured_amount
-
refunded_amount
-
pending_refund_amount
```

---

# 71. Pending Refund Capacity

Track:

```text
pending_refund_amount
```

or lock Payment while reserving refund capacity.

---

# 72. Reversal

Provider-specific operation that may:

```text
void authorization
reverse pending payment
cancel uncaptured authorization
```

Provider adapter translates details.

---

# 73. Authorization Void

If Order fails after authorization but before capture:

```text
reverse / void authorization
```

instead of refund where supported.

---

# 74. Refund vs Reversal

Refund:

```text
captured money returned
```

Reversal:

```text
provider authorization/capture undone according to provider semantics
```

Do not use the terms interchangeably.

---

# 75. Payment Cancellation

Payment may be cancelled if:

```text
not captured
provider operation can safely stop/void
```

Captured payment normally needs refund/reversal.

---

# 76. Provider Adapter Port

Concept:

```java
public interface PaymentProviderPort {
    ProviderPaymentResult createOrAuthorize(...);
    ProviderCaptureResult capture(...);
    ProviderRefundResult refund(...);
    ProviderReversalResult reverse(...);
    ProviderStatusResult getStatus(...);
}
```

Application/domain must not contain raw provider HTTP details.

---

# 77. Provider-Specific Adapter

Examples:

```text
adapter/out/provider/aba
adapter/out/provider/acleda
adapter/out/provider/smart
```

Each owns:

```text
authentication
request signing
field mapping
provider status/error codes
HTTP transport
callback verification
```

---

# 78. Anti-Corruption Layer

Provider vocabulary such as:

```text
00
SUCCESS
PAID
APPROVED
```

maps into canonical Payment state, for example:

```text
CAPTURED
```

Provider-specific codes do not leak into domain.

---

# 79. Provider Credentials

Store in:

```text
Secret Manager / Vault
```

Never in:

```text
Git
plaintext DB config
committed application.properties
```

---

# 80. Provider Authentication

Possible:

```text
API key
OAuth2 client credentials
mTLS
HMAC signature
RSA signature
```

Implement strictly according to each provider contract.

---

# 81. Provider Request Signing

Where required:

```text
canonicalize request
sign required fields
include timestamp/nonce
```

Never log private key.

---

# 82. Callback Principle

Provider callbacks are:

```text
untrusted until authenticated
```

They may report:

```text
payment success
payment failure
refund success
refund failure
settlement result
```

---

# 83. Callback Endpoint

Possible:

```text
POST /api/v1/payments/providers/{provider}/callback
```

or provider-specific path.

---

# 84. Callback Verification

Validate:

```text
signature
timestamp
provider identity
merchant reference
amount
currency
event ID
```

Do not trust source IP alone.

---

# 85. Callback Idempotency

Store:

```text
provider_event_id
```

or derived stable key.

Duplicate callback:

```text
return provider-compatible success
do not apply effect twice
```

---

# 86. Callback Replay Protection

Use:

```text
provider_event_id uniqueness
timestamp tolerance
signature verification
```

---

# 87. Callback Raw Storage

Consider storing:

```text
provider_event_id
safe headers subset
payload hash
restricted/encrypted raw payload where necessary
received_at
verification result
```

Do not retain unnecessary payment secrets.

---

# 88. Callback Processing Flow

```text
Receive callback
      ↓
Verify signature
      ↓
Validate timestamp/replay
      ↓
Deduplicate
      ↓
Resolve Payment
      ↓
Map provider state
      ↓
Validate amount/currency
      ↓
Validate allowed transition
      ↓
Persist callback + Payment state
      ↓
Insert Outbox event
      ↓
Return provider-compatible 2xx
```

---

# 89. Callback Transaction

Business-state update and callback dedupe record should be atomic where possible.

---

# 90. Out-of-Order Callback

Example:

```text
CAPTURED
then
PENDING
```

State machine must reject regression.

---

# 91. Callback Amount Mismatch

If:

```text
callback amount != expected amount
```

do not mark success.

Create/report:

```text
PAYMENT_AMOUNT_MISMATCH
```

and reconciliation alert.

---

# 92. Callback Currency Mismatch

Currency mismatch is high-risk.

Do not mark success automatically.

---

# 93. Callback Unknown Reference

If merchant reference is unknown:

```text
record securely
return provider-compatible response
alert/reconcile
```

Do not create arbitrary Payment.

---

# 94. Client Return URL

Browser/app redirect is not authoritative payment confirmation.

Never trust:

```text
?status=success
```

Verify with:

```text
callback
provider status query
```

---

# 95. Provider Action

Some payment methods require:

```text
redirect_url
deep_link
QR payload
payment page token
```

Payment Service returns canonical action.

---

# 96. REDIRECT Action

Example:

```json
{
  "type": "REDIRECT",
  "url": "https://provider/..."
}
```

---

# 97. QR Action

Example:

```json
{
  "type": "QR",
  "payload": "..."
}
```

---

# 98. Payment Expiry

Pending payment may have:

```text
expires_at
```

Only mark terminal after provider truth confirms no successful payment if uncertainty exists.

---

# 99. QR Expiry

Track:

```text
provider expiry
internal expiry
```

Do not assume they are identical.

---

# 100. Payment Reference Uniqueness

Potential unique constraints:

```text
merchant_reference
(provider, provider_reference)
```

where provider reference is stable.

---

# 101. Payment Database

Logical:

```text
payment_db
```

Only Payment Service writes authoritative provider-payment state.

---

# 102. Core Tables

Source model:

```text
payments
payment_attempts
payment_authorizations
payment_captures
refunds
payment_reversals
provider_callbacks
payment_idempotency
payment_reconciliation_runs
payment_reconciliation_mismatches
processed_events
outbox_events
```

---

# 103. Payments Table

Concept:

```text
id
order_id
customer_id
payment_method
provider
status
amount
currency
authorized_amount
captured_amount
refunded_amount
merchant_reference
active_attempt_id
created_at
updated_at
completed_at
version
```

Add `expires_at` if expiry is used.

---

# 104. Payment Attempts Table

```text
id
payment_id
attempt_no
provider
merchant_reference
provider_reference
status
requested_amount
currency
provider_code
provider_message_safe
failure_category
started_at
completed_at
```

---

# 105. Authorization Table

Optional:

```text
id
payment_id
attempt_id
provider_authorization_id
amount
currency
status
authorized_at
expires_at
```

---

# 106. Capture Table

```text
id
payment_id
authorization_id
merchant_capture_reference
provider_capture_reference
amount
currency
status
created_at
completed_at
```

---

# 107. Refunds Table

```text
id
payment_id
merchant_refund_reference
provider_refund_reference
amount
currency
status
reason_code
requested_by_type
requested_by_id
created_at
completed_at
version
```

---

# 108. Reversals Table

```text
id
payment_id
authorization_id
merchant_reversal_reference
provider_reversal_reference
amount
status
reason_code
created_at
completed_at
```

---

# 109. Provider Callbacks Table

```text
id
provider
provider_event_id
merchant_reference
payload_hash
verification_status
processing_status
received_at
processed_at
error_code
```

Unique:

```text
(provider, provider_event_id)
```

---

# 110. Payment Idempotency Table

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
payment_reconciliation_runs
payment_reconciliation_mismatches
```

---

# 112. Processed Events

If Payment consumes asynchronous Order/settlement events:

```text
processed_events
```

dedupes by:

```text
(event_id, consumer_name)
```

---

# 113. Outbox

Publish authoritative events such as:

```text
PaymentCreated
PaymentAuthorized
PaymentCaptured
PaymentFailed
PaymentRefundRequested
PaymentPartiallyRefunded
PaymentRefunded
PaymentReversed
PaymentUnknown
```

---

# 114. Indexes

Likely:

```text
UNIQUE(merchant_reference)
(order_id)
(status, created_at)
(provider, provider_reference)
(payment_id, attempt_no)
(refunds.payment_id, status)
```

---

# 115. UNKNOWN Index

Possible:

```sql
CREATE INDEX idx_payments_unknown
ON payments(updated_at)
WHERE status = 'UNKNOWN';
```

for recovery worker.

---

# 116. Pending Expiry Index

If payment expiry is enabled:

```sql
CREATE INDEX idx_payments_pending
ON payments(expires_at)
WHERE status = 'PENDING';
```

---

# 117. Create Payment Transaction

Local transaction:

```text
BEGIN

claim idempotency
insert Payment
insert initial Attempt
insert Outbox PaymentCreated if needed
complete idempotency

COMMIT
```

Provider call placement depends on workflow design.

---

# 118. Provider Call Transaction Boundary

Never keep DB transaction open during slow provider request.

Pattern:

```text
persist attempt SENT
commit
    ↓
call provider
    ↓
persist result
```

---

# 119. Persist SENT Before Network

Before provider request:

```text
attempt.status = SENT
merchant_reference persisted
```

If process crashes, recovery knows the call may have happened.

---

# 120. Provider Success Transaction

```text
BEGIN

lock/load Payment
validate transition
update Attempt
update Payment
insert authorization/capture record
insert Outbox event

COMMIT
```

---

# 121. Provider Timeout Transaction

Persist:

```text
attempt = UNKNOWN
Payment = UNKNOWN or PENDING
```

according to selected model.

Schedule resolution.

---

# 122. Refund Transaction

Pattern:

```text
persist Refund REQUESTED + reserve refundable capacity
commit
      ↓
call provider
      ↓
persist SUCCEEDED / FAILED / UNKNOWN
```

Do not hold DB locks through external call.

---

# 123. Optimistic Locking

Use:

```text
version
```

on Payment and Refund where:

```text
callback
API retry
status query
```

may race.

---

# 124. Callback vs API Race

Example:

```text
status query → CAPTURED
callback → CAPTURED
API retry
```

All must converge to one state/effect.

---

# 125. Payment Creation Request Hash

Include important immutable inputs:

```text
order_id
amount
currency
payment_method
provider preference if authoritative
```

Canonicalize before hashing.

---

# 126. Capture Request Hash

Include:

```text
payment_id
capture amount
authorization reference where applicable
```

---

# 127. Refund Request Hash

Include:

```text
payment_id
refund amount
reason code
```

and any other immutable command fields.

---

# 128. Idempotency States

Recommended shared engineering states may include:

```text
IN_PROGRESS
SUCCEEDED
FAILED_RETRYABLE
FAILED_FINAL
```

Exact naming should align with Phase 02/03 standards.

---

# 129. Same Key Different Request

For Create/Capture/Refund:

```text
same idempotency key
different request hash
```

returns:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 130. Provider Idempotency

If provider offers idempotency:

```text
reuse stable provider idempotency key
```

Do not generate a fresh key for the same business command retry.

---

# 131. Query-by-Reference

Payment should support recovery using stable:

```text
payment_id
merchant_reference
order_id where unique enough
provider_reference
```

according to contract.

---

# 132. Internal Payment Contracts

Core:

```text
CreatePayment
AuthorizePayment
CapturePayment
RefundPayment
GetPayment
```

Additional:

```text
ReversePayment
GetPaymentByReference
ResolvePaymentStatus
```

where required.

---

# 133. Internal gRPC Concept

```proto
service PaymentService {
  rpc CreatePayment(CreatePaymentRequest)
      returns (CreatePaymentResponse);

  rpc AuthorizePayment(AuthorizePaymentRequest)
      returns (AuthorizePaymentResponse);

  rpc CapturePayment(CapturePaymentRequest)
      returns (CapturePaymentResponse);

  rpc RefundPayment(RefundPaymentRequest)
      returns (RefundPaymentResponse);

  rpc GetPayment(GetPaymentRequest)
      returns (GetPaymentResponse);
}
```

---

# 134. CreatePayment Request

Fields:

```text
order_id
customer_id
amount
currency
payment_method
provider preference optional
idempotency_key
correlation_id
```

---

# 135. CreatePayment Response

Possible:

```text
payment_id
status
merchant_reference
payment_action
expires_at
```

---

# 136. Capture Request

```text
payment_id
amount
idempotency_key
```

---

# 137. Refund Request

```text
payment_id
amount
reason_code
idempotency_key
requested_by
```

---

# 138. GetPayment Response

Expose canonical Payment state only.

Do not expose:

```text
raw provider payload
provider secret
private integration metadata
```

---

# 139. Payment Error Catalog

Source candidates:

```text
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_CAPTURED
PAYMENT_ALREADY_REFUNDED
PAYMENT_NOT_AUTHORIZED
PAYMENT_NOT_CAPTURABLE
PAYMENT_NOT_REFUNDABLE
PAYMENT_AMOUNT_MISMATCH
PAYMENT_CURRENCY_MISMATCH
PAYMENT_FAILED
PAYMENT_DECLINED
PAYMENT_UNKNOWN
PROVIDER_UNAVAILABLE
PROVIDER_TIMEOUT
INVALID_PROVIDER_CALLBACK
DUPLICATE_PROVIDER_EVENT
REFUND_AMOUNT_EXCEEDS_CAPTURED
REFUND_FAILED
REFUND_UNKNOWN
IDEMPOTENCY_KEY_REUSED
```

---

# 140. Error Mapping

Examples:

| Error | gRPC / HTTP |
|---|---|
| PAYMENT_NOT_FOUND | NOT_FOUND / 404 |
| PAYMENT_ALREADY_CAPTURED | ALREADY_EXISTS / 409 |
| PAYMENT_NOT_REFUNDABLE | FAILED_PRECONDITION / 422 |
| PAYMENT_DECLINED | FAILED_PRECONDITION / 422 |
| PAYMENT_UNKNOWN | flow-specific 202/409 or canonical unavailable state |
| PROVIDER_UNAVAILABLE | UNAVAILABLE / 503 |
| PROVIDER_TIMEOUT | DEADLINE_EXCEEDED / 504 |
| IDEMPOTENCY_KEY_REUSED | ALREADY_EXISTS / 409 |

---

# 141. Payment Events Published

Candidate:

```text
PaymentCreated
PaymentPending
PaymentAuthorized
PaymentCaptured
PaymentFailed
PaymentUnknown
PaymentRefundRequested
PaymentPartiallyRefunded
PaymentRefunded
PaymentReversed
```

---

# 142. PaymentCaptured Event

Purpose-driven content:

```text
payment_id
order_id
amount
currency
provider
correlation_id
```

No raw provider secrets.

---

# 143. PaymentFailed Event

Include:

```text
payment_id
order_id
failure_category
retryable
```

Avoid unnecessary provider-internal details.

---

# 144. PaymentUnknown Event

Operationally important.

Ordering must understand:

```text
UNKNOWN != FAILED
```

---

# 145. PaymentRefunded Event

Include:

```text
payment_id
refund_id
order_id
refund amount
currency
reason code
```

---

# 146. Event Ordering

Partition by:

```text
payment_id
```

to preserve Payment lifecycle order.

---

# 147. Events Consumed

Potential:

```text
OrderCancelled
OrderCompleted
```

only if event-driven flow is intentionally selected.

For critical capture/refund, explicit commands may be clearer.

---

# 148. Capture Orchestration

Ordering may issue:

```text
CapturePayment
```

at approved business milestone.

Payment owns provider execution.

---

# 149. Refund Orchestration

Ordering cancellation may issue:

```text
RefundPayment
```

or a Saga command.

Distinguish:

```text
command
```

from:

```text
informational event
```

---

# 150. Payment Reconciliation

Reconciliation compares:

```text
internal Payment
provider transaction
provider settlement/report
```

---

# 151. Reconciliation Sources

Possible:

```text
provider status API
provider daily report
bank settlement file
callback history
merchant portal export
```

---

# 152. Reconciliation Keys

Use:

```text
merchant_reference
provider_reference
amount
currency
business date
```

---

# 153. Reconciliation Mismatch Types

Source examples:

```text
INTERNAL_CAPTURED_PROVIDER_FAILED
INTERNAL_FAILED_PROVIDER_CAPTURED
AMOUNT_MISMATCH
CURRENCY_MISMATCH
MISSING_PROVIDER_TRANSACTION
MISSING_INTERNAL_PAYMENT
DUPLICATE_PROVIDER_TRANSACTION
REFUND_MISMATCH
```

---

# 154. Reconciliation Workflow

```text
Start run
   ↓
Fetch provider truth
   ↓
Match references
   ↓
Compare amount/status/currency
   ↓
Record mismatches
   ↓
Auto-resolve only safe known cases
   ↓
Escalate high-risk differences
```

---

# 155. No Silent Financial Repair

Do not simply:

```sql
UPDATE payments SET status = ...
```

for unexplained mismatch.

Require:

```text
documented reconciliation action
audit
operator/system identity
evidence
```

---

# 156. Reconciliation Run

Possible:

```text
run_id
provider
business_date
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 157. Reconciliation Mismatch

Possible:

```text
mismatch_id
run_id
payment_id
merchant_reference
provider_reference
mismatch_type
internal_value
provider_value
status
detected_at
resolved_at
resolution_action
```

---

# 158. Settlement

Provider settlement may occur after capture.

Important:

```text
CAPTURED
!=
merchant bank settlement necessarily complete
```

---

# 159. Settlement Status — Optional

If finance requires:

```text
PENDING
SETTLED
FAILED
ADJUSTED
```

Model separately.

Decision:

```text
SETTLEMENT_TRACKING_ENABLED = TBD_SCOPE
```

---

# 160. Chargebacks / Disputes — Future

Future separate model may include:

```text
dispute_id
payment_id
provider_case_id
amount
status
reason
```

Do not mix dispute lifecycle with Refund.

---

# 161. Recovery Worker

Scans:

```text
UNKNOWN attempts
long-running PENDING payments
UNKNOWN refunds
callback processing failures
```

---

# 162. ResolveUnknownPayment

Flow:

```text
Load UNKNOWN Payment/Attempt
      ↓
Query provider by merchant_reference
      ↓
Map provider state
      ↓
Validate transition
      ↓
Persist final/current state
      ↓
Publish event
```

---

# 163. Recovery Backoff

Use:

```text
bounded retry
exponential backoff
jitter
alert threshold
```

---

# 164. Payment Expiry Worker

For expirable intents:

```text
find expired PENDING
      ↓
query provider if uncertain
      ↓
mark terminal only when safe
```

---

# 165. Provider Health

Track:

```text
latency
success rate
timeout rate
decline rate
5xx
status-query health
callback lag
```

---

# 166. Security Rule

Never store/log raw:

```text
PAN
CVV
private key
provider secret
access token
```

unless a specifically compliant architecture requires it.

Prefer tokenized provider references.

---

# 167. PCI Scope

If raw card data is handled directly:

```text
PCI DSS scope increases significantly
```

Prefer:

```text
provider-hosted
tokenized
redirect/QR
```

flows where possible.

---

# 168. Tokenized Payment Method

Possible:

```text
payment_method_token
```

provided by external provider.

It remains sensitive.

---

# 169. Internal Service Authorization

Source permissions:

```text
payments.create
payments.capture
payments.refund
payments.read
```

---

# 170. Refund Permissions

More restricted than read.

Possible:

```text
payments.refund
payments.refund.large
```

---

# 171. Dual Control

Large/high-risk refunds may require:

```text
requester
approver
```

before provider execution.

Decision:

```text
REFUND_DUAL_CONTROL_POLICY = TBD_SECURITY
```

---

# 172. Admin APIs

Possible:

```text
GET  /api/v1/admin/payments/{paymentId}
GET  /api/v1/admin/payments
POST /api/v1/admin/payments/{paymentId}/refunds
POST /api/v1/admin/payments/{paymentId}/reconcile
```

Never expose provider secrets.

---

# 173. Payment Audit

Audit privileged actions:

```text
manual refund
manual reversal
reconciliation override
provider reference correction
payment state repair
```

---

# 174. Manual Repair

Avoid direct DB update.

Use:

```text
RepairPaymentState
```

with:

```text
reason
evidence
actor
audit
```

---

# 175. Data Classification

Likely:

```text
RESTRICTED:
provider credentials
payment method token
sensitive callback data

CONFIDENTIAL:
payment history
provider references
amounts
customer/payment linkage
```

---

# 176. Logging

Safe:

```text
payment_id
order_id
attempt_id
provider
merchant_reference
status
failure_category
request_id
correlation_id
```

Do not log:

```text
PAN
CVV
provider secret
raw token
private key
full sensitive callback payload
```

---

# 177. Tracing

Trace:

```text
Ordering
  ↓
Payment Service
  ↓
Provider Adapter
  ↓
External Provider
  ↓
Payment DB
  ↓
Outbox
```

Tags:

```text
provider
operation
result
```

No sensitive financial fields.

---

# 178. Metrics

Business:

```text
payments_created_total
payments_authorized_total
payments_captured_total
payments_failed_total
payments_unknown_total
refunds_requested_total
refunds_succeeded_total
refunds_failed_total
```

Provider:

```text
provider_success_rate
provider_timeout_total
provider_decline_total
provider_latency
```

Operational:

```text
unknown_payment_backlog
reconciliation_mismatch_total
callback_failure_total
outbox_backlog
```

---

# 179. SLIs

Potential:

```text
CreatePayment success rate
Capture success rate
P95 provider latency
Callback processing latency
Unknown-outcome resolution time
Refund success rate
Reconciliation health
```

Exact targets:

```text
TBD_SLO
```

---

# 180. Alerts

Alert on:

```text
provider timeout spike
capture failure spike
UNKNOWN spike
callback signature failure
callback backlog
refund failure spike
reconciliation mismatch
DB errors
outbox backlog
```

---

# 181. Dashboard

Show:

```text
payment volume
captured amount
success/decline/failure
UNKNOWN count
provider latency
refund volume
refund failures
callback throughput
reconciliation mismatches
```

Use finance-approved definitions.

---

# 182. Retention

Payment records generally require long retention for:

```text
finance
refund
reconciliation
audit
tax/business records
disputes
```

Decision:

```text
PAYMENT_RETENTION_POLICY = TBD_POLICY
```

---

# 183. Sensitive Payload Retention

Do not retain raw provider payload indefinitely.

Prefer:

```text
normalized fields
payload hash
short-term restricted raw payload
```

---

# 184. Backup

Back up:

```text
payments
attempts
authorizations
captures
refunds
reversals
callback metadata
reconciliation
idempotency where required
processed events
outbox
```

Provider secrets come from Secret Manager, not DB backup.

---

# 185. Restore

After restore:

```text
reconcile provider state
resolve UNKNOWN/PENDING
repair/replay outbox
review refunds
check callbacks after restore point
```

---

# 186. Restore Danger

Restoring an old DB can lose local knowledge of a provider charge that already happened.

Therefore:

```text
provider reconciliation is mandatory after recovery
```

---

# 187. Disaster Recovery

Define:

```text
RPO
RTO
provider status-query capability
merchant-reference uniqueness
callback recovery
event replay
reconciliation
secret/key recovery
```

Decision:

```text
PAYMENT_RPO = TBD_DR
PAYMENT_RTO = TBD_DR
```

---

# 188. Flyway Plan

Source sequence:

```text
V1__create_payments.sql
V2__create_payment_attempts.sql
V3__create_authorizations.sql
V4__create_captures.sql
V5__create_refunds.sql
V6__create_reversals.sql
V7__create_provider_callbacks.sql
V8__create_payment_idempotency.sql
V9__create_reconciliation_tables.sql
V10__create_processed_events.sql
V11__create_outbox.sql
```

---

# 189. Provider Migration

Changing provider requires:

```text
new adapter
configuration
parallel testing
routing decision
settlement/reconciliation readiness
rollback plan
```

Do not rewrite old provider references.

---

# 190. Legacy Payment Migration

Preserve where possible:

```text
order reference
provider
provider transaction ID
amount
currency
status
timestamps
refund history
```

---

# 191. Legacy Status Mapping

Maintain explicit mapping:

```text
legacy code
provider code
canonical Payment status
```

Do not scatter mapping throughout code.

---

# 192. Clean Architecture Layout

```text
payment-service/
│
├── domain/
│   ├── payment/
│   ├── attempt/
│   ├── authorization/
│   ├── capture/
│   ├── refund/
│   ├── reversal/
│   ├── reconciliation/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── create/
│   ├── authorize/
│   ├── capture/
│   ├── refund/
│   ├── reverse/
│   ├── callback/
│   ├── query/
│   ├── recovery/
│   └── reconciliation/
│
├── adapter/in/
│   ├── grpc/
│   ├── rest/
│   ├── webhook/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── provider/
│   │   ├── aba/
│   │   ├── acleda/
│   │   └── ...
│   ├── kafka/
│   └── secrets/
│
└── config/
```

Only provider adapters required by approved scope should actually be implemented.

---

# 193. Input Ports

Recommended:

```text
CreatePaymentUseCase
AuthorizePaymentUseCase
CapturePaymentUseCase
RefundPaymentUseCase
ReversePaymentUseCase
GetPaymentUseCase
ProcessProviderCallbackUseCase
ResolveUnknownPaymentUseCase
ReconcilePaymentsUseCase
RepairPaymentStateUseCase
```

---

# 194. Output Ports

Recommended:

```text
LoadPaymentPort
SavePaymentPort
PaymentAttemptPort
AuthorizationPort
CapturePort
RefundPort
ReversalPort
ProviderPort
IdempotencyPort
ProviderCallbackPort
ProcessedEventPort
OutboxPort
ReconciliationPort
SecretPort
ClockPort
MerchantReferenceGenerator
AuditPort
```

---

# 195. CreatePaymentUseCase

Flow:

```text
Validate command
      ↓
Claim idempotency
      ↓
Check existing Payment for Order
      ↓
Create Payment
      ↓
Create Attempt
      ↓
Persist merchant reference / SENT state
      ↓
Call provider if immediate flow
      ↓
Persist result
      ↓
Publish event
      ↓
Return canonical result
```

---

# 196. CapturePaymentUseCase

```text
Load Payment
      ↓
Validate capturable
      ↓
Claim idempotency
      ↓
Persist capture request/reference
      ↓
Commit
      ↓
Call provider
      ↓
Persist SUCCEEDED/FAILED/UNKNOWN
      ↓
Publish event
```

---

# 197. RefundPaymentUseCase

```text
Authorize actor
      ↓
Load Payment
      ↓
Lock/reserve refundable capacity
      ↓
Validate amount
      ↓
Claim idempotency
      ↓
Create Refund REQUESTED
      ↓
Commit
      ↓
Call provider
      ↓
Persist SUCCEEDED/FAILED/UNKNOWN
      ↓
Update Payment refunded totals
      ↓
Publish event
```

---

# 198. ReversePaymentUseCase

```text
Load Payment
      ↓
Validate reversible state
      ↓
Claim idempotency
      ↓
Create reversal reference
      ↓
Call provider
      ↓
Persist canonical result
      ↓
Publish event
```

Provider semantics determine exact reversible states.

---

# 199. CallbackUseCase

```text
Verify provider authentication/signature
      ↓
Validate timestamp/replay
      ↓
Deduplicate event
      ↓
Resolve Payment/Attempt
      ↓
Validate amount/currency
      ↓
Map provider state
      ↓
Apply idempotent transition
      ↓
Persist callback + state
      ↓
Outbox
```

---

# 200. ResolveUnknownPaymentUseCase

```text
Load UNKNOWN
      ↓
Query provider by stable merchant reference
      ↓
Map provider result
      ↓
Validate transition
      ↓
Persist
      ↓
Outbox
```

---

# 201. ReconcilePaymentsUseCase

```text
Start reconciliation run
      ↓
Fetch provider truth
      ↓
Match by merchant/provider references
      ↓
Compare state/amount/currency
      ↓
Record mismatches
      ↓
Auto-resolve only approved safe cases
      ↓
Escalate high-risk mismatch
```

---

# 202. Payment Recovery Principle

After any crash or ambiguous network result, the service should answer:

```text
What provider request might already have happened?
Which stable reference was used?
What is provider truth now?
Can the next operation safely retry?
```

---

# 203. Unknown Create/Authorize Outcome

If create/authorize request might have succeeded:

```text
do not create another merchant reference
do not start another provider charge
query same reference
```

---

# 204. Unknown Capture Outcome

If capture may have succeeded:

```text
do not capture again blindly
```

Resolve:

```text
status API
callback
reconciliation
```

---

# 205. Unknown Refund Outcome

If refund may have succeeded:

```text
do not issue second refund blindly
```

Resolve against provider truth.

---

# 206. Concurrency — Capture

Two capture commands for same Payment must not produce two captures.

Use:

```text
idempotency
unique capture reference
row lock / optimistic version
provider idempotency
```

---

# 207. Concurrency — Refund

Two refund commands must not over-refund.

Use:

```text
transaction
Payment lock/version
pending_refund_amount or reserved capacity
unique refund command
```

---

# 208. Concurrency — Callback/API

Callback + status query + API retry can arrive simultaneously.

All must converge to the same canonical state.

---

# 209. Local vs Remote Transaction Rule

Never attempt distributed ACID between:

```text
payment_db
provider system
order_db
```

Use:

```text
durable local state
stable references
idempotency
query/reconciliation
events
Saga compensation
```

---

# 210. Ordering Integration

Ordering supplies:

```text
order_id
amount
currency
payment method
correlation
business milestone commands
```

Payment returns:

```text
payment_id
canonical Payment status
merchant reference
provider action
```

---

# 211. Order Cancellation Integration

Ordering may request:

```text
ReversePayment
```

for uncaptured authorization or:

```text
RefundPayment
```

after capture.

Payment decides the provider operation.

---

# 212. Ordering Unknown-Payment Rule

When Payment reports:

```text
UNKNOWN
```

Ordering must not assume:

```text
FAILED
```

and must enter a recoverable workflow state.

---

# 213. Wallet Roadmap Handoff

Phase 12 will implement:

```text
Wallet Account
Available Balance
Reserved Balance
Ledger
Reserve
Capture
Release
Top-Up
Refund
Reversal
Adjustment
Reconciliation
```

Critical separation remains:

```text
Payment = provider money movement
Wallet = stored-value ledger
```

---

# 214. Provider Certification

Before production, approved provider integration must pass:

```text
sandbox/certification
request signing
callback verification
status query
refund flow
timeout behavior
reconciliation readiness
```

---

# 215. Provider Contract Documentation

For each provider document:

```text
authentication
endpoint
request fields
merchant reference rule
provider reference rule
success codes
decline codes
timeout semantics
safe retry behavior
callback authentication
callback event ID
status query
capture
refund
reversal
rate limits
currency behavior
```

Do not invent missing provider semantics.

---

# 216. Definition of Done — Create Payment

- [ ] Idempotency.
- [ ] Exact amount/currency.
- [ ] Stable merchant reference.
- [ ] Payment/Attempt persistence.
- [ ] Provider adapter.
- [ ] Timeout strategy.
- [ ] UNKNOWN handling.
- [ ] Status query recovery.
- [ ] Outbox.
- [ ] Secure logging.
- [ ] Tests.

---

# 217. Definition of Done — Capture

- [ ] Capturable-state validation.
- [ ] Capture amount validation.
- [ ] Idempotency.
- [ ] Stable provider/internal reference.
- [ ] UNKNOWN recovery.
- [ ] Event.
- [ ] Concurrency test.
- [ ] Reconciliation support.

---

# 218. Definition of Done — Refund

- [ ] Authorization.
- [ ] Required reason.
- [ ] Refundable amount validation.
- [ ] Idempotency.
- [ ] Concurrency-safe capacity reservation.
- [ ] Provider timeout behavior.
- [ ] UNKNOWN refund recovery.
- [ ] Audit.
- [ ] Event.
- [ ] Reconciliation.
- [ ] Tests.

---

# 219. Definition of Done — Callback

- [ ] Provider authentication/signature verified.
- [ ] Timestamp/replay checked.
- [ ] Provider event deduped.
- [ ] Merchant reference resolved.
- [ ] Amount validated.
- [ ] Currency validated.
- [ ] Provider state mapped through ACL.
- [ ] Out-of-order regression rejected.
- [ ] Payment update and dedupe transactional.
- [ ] Callback metrics/alerts.
- [ ] Tests.

---

# 220. Payment Architecture Review Checklist

## Ownership

- [ ] Payment lifecycle owned here.
- [ ] Order lifecycle remains in Ordering.
- [ ] Wallet remains separate.
- [ ] Provider details isolated.

## Correctness

- [ ] Idempotency.
- [ ] Exact money.
- [ ] Stable merchant reference.
- [ ] UNKNOWN modeled.
- [ ] Refund limits.
- [ ] State machine.
- [ ] No state regression.

## Provider

- [ ] Authentication/signature.
- [ ] Timeouts.
- [ ] Status query.
- [ ] Callback verification.
- [ ] Error/status mapping.
- [ ] Reconciliation.

---

# 221. Data Review Checklist

- [ ] Payment ID stable.
- [ ] Merchant reference unique.
- [ ] Attempts modeled.
- [ ] Provider references stored.
- [ ] Authorization/capture model fits provider.
- [ ] Refund table.
- [ ] Reversal table if used.
- [ ] Callback dedupe.
- [ ] Idempotency table.
- [ ] Reconciliation tables.
- [ ] Processed events where needed.
- [ ] Outbox.
- [ ] Retention defined.

---

# 222. Contract Review Checklist

- [ ] CreatePayment.
- [ ] AuthorizePayment if used.
- [ ] CapturePayment.
- [ ] RefundPayment.
- [ ] ReversePayment if used.
- [ ] GetPayment/status query.
- [ ] Provider callback contract.
- [ ] Error catalog.
- [ ] Deadlines.
- [ ] Idempotency.
- [ ] UNKNOWN semantics.
- [ ] Event schemas.
- [ ] Query-by-reference.

---

# 223. Security Review Checklist

- [ ] No raw PAN/CVV.
- [ ] Provider secrets in Secret Manager.
- [ ] Callback signatures verified.
- [ ] Replay protection.
- [ ] Provider TLS verified.
- [ ] Refund permissions restricted.
- [ ] Large refund dual-control policy decided.
- [ ] Sensitive logs redacted.
- [ ] Tokens treated as sensitive.
- [ ] Admin repairs audited.

---

# 224. Operations Review Checklist

- [ ] Provider metrics.
- [ ] UNKNOWN recovery worker.
- [ ] Callback monitoring.
- [ ] Refund monitoring.
- [ ] Reconciliation.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Runbooks.
- [ ] Backup/restore.
- [ ] Outbox monitoring.
- [ ] Provider status-query health.
- [ ] Secret/key recovery.

---

# 225. Production Readiness Checklist

Before production:

- [ ] Provider sandbox/certification complete.
- [ ] Idempotency concurrency tests pass.
- [ ] Duplicate create/authorize test passes.
- [ ] Duplicate capture test passes.
- [ ] UNKNOWN outcome recovery tested.
- [ ] Provider status query tested.
- [ ] Callback signature validation tested.
- [ ] Duplicate callback tested.
- [ ] Out-of-order callback tested.
- [ ] Callback amount mismatch tested.
- [ ] Callback currency mismatch tested.
- [ ] Refund concurrency tested.
- [ ] UNKNOWN refund recovery tested.
- [ ] Reconciliation tested.
- [ ] Provider outage tested.
- [ ] Rate-limit handling tested.
- [ ] Backup/restore tested.
- [ ] DR reconciliation tested.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Security review passed.
- [ ] Required TBD decisions resolved.

---

# 226. Recommended Implementation Sequence

Follow the source order:

```text
Step 1
Implement Payment aggregate

Step 2
Implement Payment status machine

Step 3
Implement payment_db / persistence

Step 4
Implement Payment Attempts

Step 5
Implement MerchantReferenceGenerator

Step 6
Implement CreatePayment

Step 7
Implement first provider adapter

Step 8
Implement Payment idempotency

Step 9
Implement timeouts + UNKNOWN

Step 10
Implement provider status query

Step 11
Implement callback authentication/deduplication

Step 12
Implement Capture

Step 13
Implement Refund

Step 14
Implement Reversal where provider supports

Step 15
Implement transactional outbox/events

Step 16
Implement recovery worker

Step 17
Implement reconciliation

Step 18
Implement admin queries/privileged operations

Step 19
Implement metrics/alerts/runbooks

Step 20
Complete provider certification/security review

Step 21
Backup/restore/reconciliation drill

Step 22
Phase 11 exit review

Step 23
Handoff to Phase 12 Wallet
```

---

# 227. Step 1 — Bootstrap Acceptance

Verify:

```text
service starts
health endpoint works
payment_db connection works
Flyway runs
service auth config loads
webhook adapter loads
Kafka/outbox infrastructure works
Testcontainers PostgreSQL works
Docker image builds
architecture tests pass
```

---

# 228. Step 2 — Payment Aggregate Acceptance

Verify:

```text
amount > 0
currency required
canonical statuses
valid transitions
invalid regressions rejected
captured/refunded totals protected
merchant reference immutable
version persisted
```

---

# 229. Step 3 — Attempt Acceptance

Verify:

```text
attempt number increases correctly
Attempt != Payment
provider/reference stored
SENT persisted before provider request
failure category canonicalized
multiple attempts preserve same Payment obligation
```

---

# 230. Step 4 — Idempotency Acceptance

Run:

```text
same CreatePayment key + same request
same key + changed request
concurrent same key
response lost + retry
```

Verify:

```text
same Payment
one provider side effect
```

---

# 231. Step 5 — Provider Adapter Acceptance

Verify:

```text
authentication
request signing
field mapping
canonical status mapping
canonical failure mapping
timeouts
status query
callback verification
refund
reversal if supported
```

against sandbox/mock.

---

# 232. Step 6 — UNKNOWN Acceptance

Simulate:

```text
provider succeeds
response lost
```

Verify:

```text
attempt/payment enters UNKNOWN
no new charge starts
status query uses same merchant reference
eventual canonical final state
```

---

# 233. Step 7 — Callback Acceptance

Verify:

```text
valid signature
invalid signature
timestamp expiry
duplicate event
out-of-order event
amount mismatch
currency mismatch
unknown merchant reference
callback/API race
```

---

# 234. Step 8 — Authorization Acceptance

If provider supports authorization:

```text
authorize success
authorize decline
duplicate authorize
UNKNOWN authorize
expired authorization
reversal/void
```

---

# 235. Step 9 — Capture Acceptance

Verify:

```text
capturable state
correct amount
duplicate capture safe
concurrent capture safe
provider timeout → UNKNOWN
later provider success reconciles to CAPTURED
outbox once
```

---

# 236. Step 10 — Refund Acceptance

Verify:

```text
full refund
partial refund
multiple partial refunds
refund > captured rejected
duplicate refund safe
concurrent refund safe
UNKNOWN refund recovery
reason required
authorization enforced
audit present
```

---

# 237. Step 11 — Reversal Acceptance

Where supported:

```text
uncaptured authorization can reverse/void
provider reference preserved
idempotency enforced
UNKNOWN handled
event/audit present
```

---

# 238. Step 12 — Recovery Worker Acceptance

Verify worker can safely process:

```text
UNKNOWN Payment
UNKNOWN Attempt
long PENDING
UNKNOWN Refund
failed callback processing
```

with:

```text
bounded retry
backoff
jitter
alert threshold
```

---

# 239. Step 13 — Reconciliation Acceptance

Create mismatches:

```text
internal FAILED / provider PAID
internal CAPTURED / provider missing
amount mismatch
currency mismatch
refund mismatch
duplicate provider transaction
missing internal Payment
```

Verify:

```text
detected
recorded
not silently repaired
```

---

# 240. Step 14 — Security Acceptance

Verify:

```text
provider secrets absent from source/logs
raw card data absent
callback signature required
replay blocked
TLS validation active
refund permission restricted
admin repair audited
```

---

# 241. Step 15 — Failure Acceptance

Inject:

```text
provider timeout
provider 5xx
provider rate limit
slow provider
callback burst
Kafka down
DB deadlock
process crash after provider request
process crash after provider success
```

Verify:

```text
no duplicate charge
no duplicate refund
UNKNOWN used where required
recovery possible
```

---

# 242. Step 16 — Restore Acceptance

After DB restore:

```text
query provider truth
resolve UNKNOWN/PENDING
review callbacks after restore point
reconcile refunds
repair/replay outbox
do not re-charge customers
```

---

# 243. Recommended Phase 11 Work Breakdown

Suggested tickets:

```text
PAY-001 Bootstrap payment-service
PAY-002 Create payment_db / Flyway baseline
PAY-003 Implement Payment aggregate
PAY-004 Implement PaymentStatus state machine
PAY-005 Implement PaymentAttempt
PAY-006 Implement FailureCategory
PAY-007 Implement exact Money value object
PAY-008 Implement Currency validation
PAY-009 Implement MerchantReferenceGenerator
PAY-010 Implement payments persistence
PAY-011 Implement attempts persistence
PAY-012 Implement CreatePayment
PAY-013 Implement CreatePayment idempotency
PAY-014 Implement request hashing
PAY-015 Implement provider-port abstraction
PAY-016 Implement initial provider adapter
PAY-017 Implement provider authentication
PAY-018 Implement request signing
PAY-019 Implement provider error/status ACL
PAY-020 Implement provider timeouts
PAY-021 Implement bounded retry/backoff
PAY-022 Implement circuit breaker
PAY-023 Implement SENT-before-network pattern
PAY-024 Implement UNKNOWN status
PAY-025 Implement provider status query
PAY-026 Implement ResolveUnknownPayment
PAY-027 Implement provider action model
PAY-028 Implement payment expiry
PAY-029 Implement QR expiry where required
PAY-030 Implement callback endpoint
PAY-031 Implement callback signature verification
PAY-032 Implement replay protection
PAY-033 Implement callback dedupe table
PAY-034 Implement callback amount/currency validation
PAY-035 Implement out-of-order callback protection
PAY-036 Implement callback/API race handling
PAY-037 Implement Authorization if required
PAY-038 Implement Capture
PAY-039 Implement capture idempotency
PAY-040 Implement capture UNKNOWN recovery
PAY-041 Implement Refund aggregate
PAY-042 Implement refundable-capacity protection
PAY-043 Implement RefundPayment
PAY-044 Implement refund idempotency
PAY-045 Implement partial/full refund
PAY-046 Implement refund UNKNOWN recovery
PAY-047 Implement refund permissions
PAY-048 Implement dual control if required
PAY-049 Implement Reversal
PAY-050 Implement transactional outbox
PAY-051 Implement payment events
PAY-052 Implement event partitioning by payment_id
PAY-053 Implement processed-events table if needed
PAY-054 Implement recovery worker
PAY-055 Implement expiry worker if needed
PAY-056 Implement reconciliation run
PAY-057 Implement mismatch workflow
PAY-058 Implement admin payment query
PAY-059 Implement manual repair command
PAY-060 Implement audit
PAY-061 Implement data redaction
PAY-062 Implement domain tests
PAY-063 Implement CreatePayment tests
PAY-064 Implement authorization tests
PAY-065 Implement capture tests
PAY-066 Implement UNKNOWN outcome tests
PAY-067 Implement refund tests
PAY-068 Implement callback tests
PAY-069 Implement provider contract tests
PAY-070 Implement persistence tests
PAY-071 Implement idempotency concurrency tests
PAY-072 Implement callback/API race tests
PAY-073 Implement reconciliation tests
PAY-074 Implement security tests
PAY-075 Implement load tests
PAY-076 Implement provider degradation tests
PAY-077 Implement metrics/traces/logging
PAY-078 Implement dashboard/alerts
PAY-079 Write payment runbooks
PAY-080 Backup/restore/reconciliation drill
PAY-081 Legacy migration if required
PAY-082 Provider certification
PAY-083 Complete ADRs/policy freeze
PAY-084 Phase 11 exit review
```

---

# 244. Minimum Viable Payment Service

Source-defined first production-capable version:

```text
Payment aggregate
One provider
Create/authorize or immediate capture
Payment attempts
Idempotency
Stable merchant reference
Provider callback verification
UNKNOWN-outcome handling
Provider status query
Refund
Outbox events
Reconciliation
Security controls
```

Do not postpone:

```text
idempotency
callback deduplication
UNKNOWN outcome
reconciliation
```

---

# 245. Recommended Initial Scope

Required:

```text
Payment aggregate
Attempt model
Canonical state machine
One approved provider
Stable merchant reference
CreatePayment
Idempotency
Provider adapter/ACL
Timeouts
UNKNOWN
Provider status query
Callback verification/deduplication
Capture or immediate-capture flow
Refund
Outbox
Recovery worker
Reconciliation
Security
Observability
```

Conditional:

```text
separate Authorization
Reversal
Partial refund
Payment expiry
QR expiry
Admin manual refund
Dual control
```

Future unless business requires now:

```text
multi-provider routing
automatic failover
3DS/SCA
saved payment methods
tokenized-card vault
settlement tracking
chargebacks/disputes
finance exports
```

---

# 246. Out of Initial Scope Unless Approved

```text
Payment routing engine
Automatic provider failover
Multi-acquirer optimization
Dispute management
Chargeback automation
Settlement ledger
Saved cards
Direct PAN storage
Advanced fraud engine
Dynamic provider cost routing
```

---

# 247. Phase 11 ADRs

Recommended:

```text
ADR-PAY-001 Payment aggregate per Order
ADR-PAY-002 Payment ID / merchant-reference strategy
ADR-PAY-003 Initial provider
ADR-PAY-004 Immediate capture vs auth/capture
ADR-PAY-005 Capture timing
ADR-PAY-006 Provider idempotency strategy
ADR-PAY-007 UNKNOWN outcome handling
ADR-PAY-008 Provider retry/circuit-breaker policy
ADR-PAY-009 Callback authentication/deduplication
ADR-PAY-010 Callback raw-payload retention
ADR-PAY-011 Refund concurrency model
ADR-PAY-012 Partial refund support
ADR-PAY-013 Reversal/void policy
ADR-PAY-014 Refund authorization/dual control
ADR-PAY-015 Reconciliation model
ADR-PAY-016 Settlement scope
ADR-PAY-017 Sensitive payment-data policy
ADR-PAY-018 Provider migration/failover policy
```

---

# 248. Phase 11 Policy Freeze Checklist

Before production resolve:

- [ ] Payment ID strategy.
- [ ] One Payment per Order policy.
- [ ] Initial payment methods.
- [ ] Initial provider.
- [ ] Merchant reference format.
- [ ] Provider idempotency mapping.
- [ ] Immediate capture vs authorization/capture.
- [ ] Capture timing.
- [ ] Partial capture.
- [ ] Payment attempt limit.
- [ ] Payment expiry.
- [ ] QR expiry.
- [ ] Provider timeout values.
- [ ] Retryable error mapping.
- [ ] Retry count/backoff.
- [ ] Circuit-breaker policy.
- [ ] UNKNOWN resolution schedule.
- [ ] Callback authentication.
- [ ] Callback timestamp tolerance.
- [ ] Provider event dedupe key.
- [ ] Callback raw-payload retention.
- [ ] Partial refund support.
- [ ] Refund concurrency approach.
- [ ] Refund reason catalog.
- [ ] Refund permissions.
- [ ] Large-refund dual control.
- [ ] Reversal policy.
- [ ] Provider status mapping.
- [ ] Reconciliation schedule.
- [ ] Auto-repair scope.
- [ ] Settlement tracking.
- [ ] Sensitive data/logging policy.
- [ ] Retention.
- [ ] Provider certification criteria.
- [ ] SLO targets.
- [ ] Alert thresholds.
- [ ] RPO/RTO.

---

# 249. Payment Runbooks

Required:

```text
Provider unavailable
Provider timeout spike
Payment UNKNOWN backlog
Callback signature failures
Callback processing backlog
Duplicate callback incident
Captured internally / failed at provider mismatch
Failed internally / paid at provider mismatch
Refund failure spike
UNKNOWN refund backlog
Reconciliation mismatch
Outbox backlog
Secret/key rotation problem
Payment DB restore
```

---

# 250. UNKNOWN Payment Runbook

```text
identify Payment/Attempt
verify merchant reference
do not retry charge with new reference
query provider status
check callback history
check provider portal/report
update through canonical recovery flow
publish final event
reconcile Ordering
```

---

# 251. Duplicate Charge Runbook

```text
identify duplicate provider references
freeze further retries/attempts
compare merchant/idempotency references
confirm provider truth
refund/repair only through approved process
audit action
reconcile Ordering
add regression test
```

---

# 252. Callback Failure Runbook

```text
verify signature configuration
check clock/timestamp tolerance
check provider key/certificate
inspect safe payload hash/metadata
do not disable verification casually
replay only through provider-approved mechanism
dedupe by provider event ID
```

---

# 253. Refund Failure Runbook

```text
identify Refund
determine FAILED vs UNKNOWN
if UNKNOWN, query provider
check remaining refundable capacity
do not create duplicate refund blindly
reconcile
escalate finance/support when required
```

---

# 254. Reconciliation Mismatch Runbook

```text
classify mismatch
preserve provider/internal evidence
stop unsafe automated action if needed
query provider truth
identify related Order
apply privileged documented correction only
audit
close mismatch
```

---

# 255. Phase 11 Completion Tree

```text
PHASE 11 — PAYMENT SERVICE

├── Service Foundation                         ✅
│   ├── Spring Boot
│   ├── PostgreSQL
│   ├── Flyway
│   ├── REST/gRPC
│   └── Security
│
├── Payment Domain                             ✅
│   ├── Payment
│   ├── Attempt
│   ├── Status Machine
│   ├── Money
│   └── Merchant Reference
│
├── Provider Integration                       ✅
│   ├── Provider Port
│   ├── Adapter / ACL
│   ├── Authentication
│   ├── Signing
│   ├── Timeout
│   ├── Status Query
│   └── Error Mapping
│
├── Idempotency                                ✅
├── UNKNOWN Outcome                            ✅
├── Authorization                              ✅ / Conditional
├── Capture                                    ✅
├── Refund                                     ✅
├── Reversal                                   ✅ / Conditional
├── Callback Processing                        ✅
│   ├── Authentication
│   ├── Replay Protection
│   ├── Deduplication
│   └── Ordering Protection
│
├── Persistence                                ✅
│   ├── payment_db
│   ├── Attempts
│   ├── Captures
│   ├── Refunds
│   ├── Callbacks
│   ├── Idempotency
│   ├── Reconciliation
│   └── Outbox
│
├── Recovery Worker                            ✅
├── Reconciliation                             ✅
├── Events                                     ✅
├── Security / Audit                           ✅
├── Testing                                    ✅
├── Observability                              ✅
├── Backup / Restore                           ✅
├── Runbooks                                   ✅
└── ADR / Policy Freeze                        ✅
```

---

# 256. Exit Criteria — Ownership

The team can answer:

```text
What does Payment own?
What remains owned by Ordering?
What remains owned by Wallet?
What belongs only inside provider adapters?
```

---

# 257. Exit Criteria — Idempotency

The team can prove:

```text
CreatePayment
AuthorizePayment
CapturePayment
RefundPayment
```

can be retried without duplicate provider money movement.

---

# 258. Exit Criteria — UNKNOWN

The team can explain:

```text
What happens when a provider request may have succeeded but the response was lost?
```

Expected:

```text
UNKNOWN
→ same-reference query/callback/reconciliation
→ no blind duplicate charge
```

---

# 259. Exit Criteria — Capture

The team can prove:

```text
capture happens at most once for a business command
```

and amount/currency/state are validated.

---

# 260. Exit Criteria — Refund

The team can prove:

```text
partial/full refunds
concurrent refunds
duplicate refund requests
UNKNOWN refund
```

never return more than captured amount.

---

# 261. Exit Criteria — Callback

The team can prove:

```text
signature
timestamp
replay prevention
dedupe
amount/currency validation
out-of-order protection
```

for the selected provider.

---

# 262. Exit Criteria — Security

The team can answer:

```text
Where are provider secrets?
Is PAN/CVV stored?
How are callbacks authenticated?
Who may issue refunds?
How are large refunds controlled?
```

---

# 263. Exit Criteria — Reconciliation

The team can detect and handle:

```text
internal failed / provider paid
internal captured / provider missing
amount mismatch
currency mismatch
refund mismatch
duplicate provider transaction
missing internal Payment
```

without unsafe silent repair.

---

# 264. Exit Criteria — Recovery

The team can restore Payment DB and then safely:

```text
query provider
resolve UNKNOWN/PENDING
review callbacks after restore point
reconcile refunds
repair outbox
```

without duplicate charge/refund.

---

# 265. Exit Criteria — Operations

Operators can inspect:

```text
Payment
Attempt
Merchant reference
Provider reference
UNKNOWN backlog
Callback status
Refund status
Reconciliation mismatch
Outbox state
```

without direct DB mutation.

---

# 266. Handoff to Phase 12

After Payment is complete, move to:

```text
PHASE 12 — Wallet Service
```

Payment continues to own:

```text
external provider payment lifecycle
authorization
capture
refund
reversal
provider callback
provider reconciliation
```

Wallet will own:

```text
wallet account
available balance
reserved balance
immutable ledger
reserve
capture
release
top-up
refund
reversal
adjustment
reconciliation
```

Critical separation:

```text
Payment Service
= external/provider money collection

Wallet Service
= internal stored-value financial ledger
```

---

# 267. Final Phase 11 Principle

The core rule is:

```text
money movement must happen exactly once
or remain explicitly unresolved until truth is known
```

The canonical flow is:

```text
Create Payment
      ↓
Persist Stable Reference / Attempt
      ↓
Call Provider
      ├── AUTHORIZED
      ├── CAPTURED
      ├── FAILED
      └── UNKNOWN
             ↓
       Query / Callback /
       Reconciliation
```

The most important implementation rules are:

```text
Payment commands are idempotent.
Merchant references are stable.
Provider calls do not run inside long DB transactions.
SENT is persisted before ambiguous provider calls.
Timeout is not automatically failure.
UNKNOWN is a first-class financial state.
A new provider charge does not start while prior outcome is unknown.
Callbacks are authenticated.
Callbacks are deduplicated.
Out-of-order callbacks cannot regress state.
Amount/currency mismatches never become success automatically.
Capture is idempotent.
Refund capacity is concurrency-safe.
Refund total never exceeds captured total.
Refund and reversal are distinct.
Provider details remain behind an ACL.
Secrets and raw card data are not logged.
Payment events use transactional outbox.
Provider reconciliation is mandatory.
Restore is followed by provider reconciliation.
Order status remains separate from Payment status.
```

---

**End of PHASE 11 — Payment Service**
