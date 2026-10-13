---
title: "PART 14 — PAYMENT SERVICE"
---

# PART 14 — PAYMENT SERVICE

> **Document Role:** Defines the complete architecture, domain model, provider integration model, persistence design, idempotency, authorization/capture/refund flows, callback processing, reconciliation, testing strategy, and operational standards for the Payment Service.  
> **Previous Part:** PART 13 — Ordering Service  
> **Next Part:** PART 15 — Wallet Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, REST/gRPC, Kafka, Flyway  
> **Audience:** Backend engineers, software architects, payment engineers, QA engineers, finance engineers, DevOps engineers, SREs, security engineers, technical leads.

---

# 1959 — Purpose

The Payment Service owns the authoritative lifecycle of external and platform payment transactions.

It answers:

```text
Has payment been initiated?
Which payment method/provider is being used?
Was payment authorized?
Was payment captured?
Did the provider reject the payment?
Was a refund requested?
Was the refund completed?
Was the payment reversed?
Did a callback already process?
Is the provider state consistent with internal state?
```

The Payment Service must protect against:

```text
duplicate charge
duplicate capture
duplicate refund
replayed callbacks
out-of-order callbacks
unknown provider outcome
amount mismatch
currency mismatch
provider timeout
partial failure
```

---

# 1960 — Payment Service Responsibilities

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

Possible future responsibilities:

```text
Payment routing
Multi-provider failover
3DS/SCA orchestration
Saved payment methods
Tokenized cards
Settlement files
Dispute/chargeback projection
Payment fraud signals
```

---

# 1961 — Non-Responsibilities

Payment Service does not own:

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

without taking ownership of the original order/customer domains.

---

# 1962 — Payment Boundary

High-level:

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

# 1963 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Payment | Aggregate representing money collection for a business reference |
| Payment Attempt | One concrete attempt to pay through a provider/method |
| Authorization | Provider-approved permission to collect funds |
| Capture | Final collection/settlement instruction against an authorization |
| Refund | Return of previously captured funds |
| Reversal | Undoing an authorization/capture according to provider semantics |
| Provider Reference | Provider-generated transaction identifier |
| Merchant Reference | Platform-generated reference sent to provider |
| Callback/Webhook | Asynchronous provider notification |
| Unknown Outcome | Provider side effect may have occurred but caller did not receive definitive result |
| Reconciliation | Comparison of provider truth with internal payment truth |

---

# 1964 — Payment Aggregate

Possible aggregate root:

```text
Payment
```

State:

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

# 1965 — Payment Attempt Entity

Possible:

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

An attempt is not the same as Payment.

A Payment may have multiple attempts.

---

# 1966 — Payment Status

Recommended canonical statuses:

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

Only add states that have clear business meaning.

---

# 1967 — Payment Attempt Status

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

This allows Payment aggregate and individual provider attempts to be modeled separately.

---

# 1968 — Payment State Machine

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
  └──> REVERSED if provider defines reversal after capture

PARTIALLY_REFUNDED
  └──> REFUNDED

FAILED
  terminal for that payment/attempt unless a new attempt is started
```

---

# 1969 — Payment Invariants

Examples:

```text
amount > 0
currency required
captured_amount <= authorized_amount unless provider semantics differ
refunded_amount <= captured_amount
refund amount > 0
merchant reference stable
duplicate idempotent command must not create duplicate provider side effect
terminal payment state cannot regress arbitrarily
```

---

# 1970 — Payment Method

Possible canonical methods:

```text
CARD
BANK
QR
WALLET
CASH
PARTNER
```

Payment Service may own only non-cash financial methods.

Cash may be recorded by Ordering without a provider transaction.

---

# 1971 — Provider

Provider is an implementation/integration concept.

Examples:

```text
ABA
ACLEDA
VISA_GATEWAY
MASTERCARD_GATEWAY
SMART
CELLCARD
```

Domain should use provider-neutral status semantics.

---

# 1972 — Merchant Reference

Platform-generated stable reference sent to provider.

Example:

```text
PAY-01J...
```

Properties:

```text
unique
immutable
idempotent
traceable to payment
```

---

# 1973 — Provider Reference

Provider-generated transaction identifier.

Examples:

```text
provider_transaction_id
authorization_id
capture_id
refund_id
```

Store exact values for reconciliation.

---

# 1974 — Order Reference

Payment links to:

```text
order_id
```

as a logical external reference.

No cross-service foreign key.

---

# 1975 — Payment Amount

Use exact representation:

```text
NUMERIC
```

or:

```text
minor units
```

Do not use floating point.

---

# 1976 — Currency

Always explicit:

```text
USD
KHR
```

Provider adapter must validate any provider currency mapping.

---

# 1977 — Payment Intent

A Payment may begin as an intent:

```text
order_id
amount
currency
method
provider
```

This creates a stable internal payment identity before contacting the provider.

---

# 1978 — Create Payment

Internal endpoint/gRPC:

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

# 1979 — Payment Creation Idempotency

Same:

```text
order_id
operation
idempotency_key
request_hash
```

must return the same Payment.

Same key + changed amount:

```text
IDEMPOTENCY_KEY_REUSED
```

---

# 1980 — One Payment per Order?

Business may choose:

```text
one active Payment aggregate per order
```

with multiple attempts.

This is usually simpler than creating a brand-new Payment for each retry.

---

# 1981 — Multiple Payment Attempts

Example:

```text
Payment PAY001
  Attempt 1 → ABA → FAILED
  Attempt 2 → ACLEDA → CAPTURED
```

The aggregate can preserve a single payment obligation with several attempts.

---

# 1982 — Payment Attempt Idempotency

Each attempt to a provider should use:

```text
merchant_reference
provider idempotency key if supported
```

Never rely only on HTTP retry behavior.

---

# 1983 — Authorization

Authorization means:

```text
provider approves funds for later capture
```

Typical card flow:

```text
Authorize
   ↓
Capture
```

Not every provider separates the two.

---

# 1984 — Immediate Capture

Some providers perform:

```text
sale = authorize + capture
```

Adapter maps provider success to canonical:

```text
CAPTURED
```

---

# 1985 — Authorization Request

Example internal command:

```text
AuthorizePayment
```

Fields:

```text
payment_id
amount
currency
idempotency_key
```

---

# 1986 — Authorization Invariants

```text
payment not already captured
amount matches payment intent
currency matches
payment not cancelled/refunded
```

---

# 1987 — Capture

Capture collects previously authorized funds.

Input:

```text
payment_id
authorization reference
amount
idempotency_key
```

---

# 1988 — Capture Idempotency

Critical.

Repeated capture must never charge twice.

Use:

```text
capture reference
idempotency key
provider idempotency capability
unique internal command record
```

---

# 1989 — Partial Capture

If provider supports it:

```text
authorized 20
capture 15
```

Remaining authorization behavior must be explicit.

Initial version may forbid partial capture.

---

# 1990 — Capture Timing

Possible:

```text
during checkout
on order acceptance
on fulfillment
```

Business and provider semantics decide.

---

# 1991 — Payment Failure

Canonical failure categories:

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

Map provider-specific codes into these categories.

---

# 1992 — Provider Error Mapping

Example:

```text
provider code "51"
  ↓
INSUFFICIENT_FUNDS
```

```text
provider code "05"
  ↓
DECLINED
```

Mapping belongs in provider adapter/ACL.

---

# 1993 — Retryable vs Non-Retryable Failure

Retryable:

```text
temporary provider outage
network timeout
HTTP 503
```

Usually non-retryable:

```text
invalid card
insufficient funds
invalid amount
currency unsupported
```

Document per provider.

---

# 1994 — Unknown Outcome

Most dangerous case:

```text
request sent
provider may have completed charge
network timed out before response
```

State:

```text
UNKNOWN
```

Do not immediately submit a new charge.

---

# 1995 — Unknown Outcome Resolution

Preferred:

```text
query provider by merchant reference
```

or:

```text
wait for callback
```

or:

```text
reconciliation
```

---

# 1996 — Unknown Outcome Rule

Never convert:

```text
TIMEOUT
```

automatically into:

```text
FAILED
```

if provider may have processed the request.

---

# 1997 — Provider Query

Adapter should support if provider allows:

```text
GetPaymentStatus(merchant_reference)
```

This is essential for unknown-outcome recovery.

---

# 1998 — Payment Timeout

Every provider call needs:

```text
connect timeout
read timeout
overall deadline
```

Avoid indefinite blocking.

---

# 1999 — Payment Retry Policy

Retry only:

```text
safe request
with stable idempotency reference
provider supports safe retry
```

Use:

```text
bounded retries
backoff
jitter
```

---

# 2000 — Circuit Breaker

For repeated provider failures:

```text
open circuit
fail fast
recover gradually
```

But do not hide financial uncertainty.

Unknown outcomes still require reconciliation.

---

# 2001 — Provider Rate Limits

Respect provider:

```text
request limits
callback limits
status-query limits
```

Use queue/backoff where necessary.

---

# 2002 — Refund

Refund returns captured funds.

Possible:

```text
full refund
partial refund
```

Input:

```text
payment_id
amount
reason_code
idempotency_key
```

---

# 2003 — Refund Invariants

```text
payment must have captured funds
refund amount > 0
total refunded <= captured amount
currency unchanged
refund reference unique
```

---

# 2004 — Refund Status

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

after successful refunds.

---

# 2005 — Refund Aggregate / Entity

Possible separate entity:

```text
Refund
```

Fields:

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

# 2006 — Refund Idempotency

Same refund request must not return money twice.

Scope:

```text
(payment_id, refund_operation, idempotency_key)
```

---

# 2007 — Partial Refund

Example:

```text
captured = 20
refund 5
refund 5
```

Total refunded:

```text
10
```

Remaining refundable:

```text
10
```

---

# 2008 — Full Refund

When:

```text
refunded_amount == captured_amount
```

Payment becomes:

```text
REFUNDED
```

---

# 2009 — Refund Unknown Outcome

Same problem as payment:

```text
provider may have refunded
response timed out
```

Mark refund:

```text
UNKNOWN
```

and reconcile/query.

---

# 2010 — Refund Authorization

Refund is a privileged operation.

Possible actors:

```text
Order cancellation workflow
Finance
Support with permission
System
```

Do not let normal user directly issue arbitrary refund amount.

---

# 2011 — Refund Reason

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

# 2012 — Reversal

Reversal semantics differ by provider.

Possible use:

```text
void authorization
reverse pending payment
cancel uncaptured authorization
```

Adapter translates provider-specific operation.

---

# 2013 — Authorization Void

If order fails after authorization but before capture:

```text
reverse/void authorization
```

instead of refund where provider supports.

---

# 2014 — Refund vs Reversal

Refund:

```text
money captured
then returned
```

Reversal:

```text
authorization/capture undone according to provider mechanism
```

Do not use terms interchangeably.

---

# 2015 — Payment Cancellation

Payment may be cancelled if:

```text
not captured
provider operation can be safely stopped/voided
```

A captured payment generally requires refund/reversal.

---

# 2016 — Provider Adapter

Interface concept:

```java
public interface PaymentProviderPort {
    ProviderPaymentResult createOrAuthorize(...);
    ProviderCaptureResult capture(...);
    ProviderRefundResult refund(...);
    ProviderReversalResult reverse(...);
    ProviderStatusResult getStatus(...);
}
```

Domain/application should not contain raw provider HTTP details.

---

# 2017 — Provider-Specific Adapter

Example:

```text
adapter/out/provider/aba
adapter/out/provider/acleda
adapter/out/provider/smart
```

Each handles:

```text
authentication
request signing
field mapping
provider codes
HTTP transport
callback verification
```

---

# 2018 — Anti-Corruption Layer

Provider status:

```text
00
SUCCESS
PAID
APPROVED
```

maps to canonical:

```text
CAPTURED
```

Provider-specific vocabulary stays in adapter.

---

# 2019 — Provider Credentials

Store in:

```text
Secret Manager / Vault
```

not:

```text
Git
DB table in plaintext
application.properties committed
```

---

# 2020 — Provider Authentication

Possible:

```text
API key
OAuth2 client credentials
mTLS
HMAC signature
RSA signature
```

Implement per provider contract.

---

# 2021 — Provider Request Signing

If provider requires signing:

```text
canonicalize request
sign required fields
include timestamp/nonce
```

Never log private key.

---

# 2022 — Provider Callback

Provider may send:

```text
payment success
payment failed
refund success
refund failed
settlement result
```

Callbacks are untrusted until authenticated.

---

# 2023 — Callback Endpoint

Example:

```text
POST /api/v1/payments/providers/{provider}/callback
```

or provider-specific path.

---

# 2024 — Callback Verification

Verify:

```text
signature
timestamp
provider identity
merchant reference
amount
currency
event ID
```

Do not trust IP address alone.

---

# 2025 — Callback Idempotency

Store:

```text
provider_event_id
```

or derived stable callback key.

Duplicate callback:

```text
return success
do not duplicate effect
```

---

# 2026 — Callback Raw Storage

For audit/debugging, consider storing:

```text
provider_event_id
headers subset
payload hash
raw payload encrypted/restricted if required
received_at
verification result
```

Do not keep unnecessary sensitive payment data.

---

# 2027 — Callback Processing Flow

```text
Receive callback
      ↓
Verify signature
      ↓
Validate timestamp
      ↓
Deduplicate
      ↓
Resolve payment by merchant/provider reference
      ↓
Map provider status
      ↓
Validate allowed transition
      ↓
Persist payment change
      ↓
Insert outbox event
      ↓
Return 2xx
```

---

# 2028 — Callback Transaction

Business state update and callback-dedupe record should occur atomically where possible.

---

# 2029 — Callback Ordering

Provider callbacks may arrive out of order.

Example:

```text
CAPTURED
then
PENDING
```

State machine must reject regression.

---

# 2030 — Callback Amount Validation

If callback says:

```text
amount != expected payment amount
```

do not blindly mark success.

Create:

```text
PAYMENT_AMOUNT_MISMATCH
```

and reconciliation alert.

---

# 2031 — Callback Currency Validation

Same rule:

```text
currency mismatch
```

is high-risk.

Do not map to success automatically.

---

# 2032 — Callback Unknown Reference

If merchant reference unknown:

```text
record securely
return provider-compatible response
alert/reconcile
```

Do not create an arbitrary payment automatically.

---

# 2033 — Payment Provider Redirect

Some payment methods require:

```text
redirect_url
deep_link
QR payload
payment page token
```

Payment Service returns provider action to client.

---

# 2034 — Payment Action Model

Example:

```json
{
  "type": "REDIRECT",
  "url": "https://provider/..."
}
```

or:

```json
{
  "type": "QR",
  "payload": "..."
}
```

---

# 2035 — Client Return URL

Client redirect return is not authoritative payment confirmation.

Always verify via:

```text
callback
provider status query
```

Do not trust:

```text
?status=success
```

from browser redirect.

---

# 2036 — Payment Expiry

Pending payment may expire.

Fields:

```text
expires_at
```

On expiry:

```text
PENDING → FAILED/CANCELLED/EXPIRED
```

if provider confirms no successful payment.

---

# 2037 — QR Expiry

QR payments often have short lifetime.

Payment Service should track:

```text
provider expiry
internal expiry
```

---

# 2038 — Payment Attempt Limit

Limit repeated attempts per payment/order.

Reasons:

```text
abuse
provider costs
customer confusion
```

Exact policy is business/security controlled.

---

# 2039 — New Attempt After Failure

A failed attempt may allow a new attempt.

Example:

```text
Attempt 1 → card declined
Attempt 2 → QR payment
```

Payment aggregate remains linked to one order.

---

# 2040 — New Attempt After Unknown

Do not start a new charge blindly while previous attempt is `UNKNOWN`.

Resolve unknown outcome first.

---

# 2041 — Payment Method Change

If order/customer changes method:

```text
old attempt must be terminal or resolved
new attempt created
```

---

# 2042 — Payment Reference Uniqueness

Unique constraints may include:

```text
merchant_reference
(provider, provider_reference)
```

where provider reference is available and stable.

---

# 2043 — Payment Database Overview

Possible tables:

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

# 2044 — Payments Table

Example:

```text
payments
--------
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

---

# 2045 — Payment Attempts Table

```text
payment_attempts
----------------
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

# 2046 — Authorization Table

Optional:

```text
payment_authorizations
----------------------
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

# 2047 — Capture Table

```text
payment_captures
----------------
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

# 2048 — Refunds Table

```text
refunds
-------
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

# 2049 — Reversals Table

```text
payment_reversals
-----------------
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

# 2050 — Provider Callbacks Table

```text
provider_callbacks
------------------
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

# 2051 — Payment Idempotency Table

```text
payment_idempotency
-------------------
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

# 2052 — Reconciliation Tables

```text
payment_reconciliation_runs
payment_reconciliation_mismatches
```

Mismatch examples:

```text
provider says PAID, internal says FAILED
provider amount mismatch
missing internal payment
duplicate provider transaction
refund mismatch
```

---

# 2053 — Outbox

Events:

```text
PaymentCreated
PaymentAuthorized
PaymentCaptured
PaymentFailed
PaymentRefundRequested
PaymentRefunded
PaymentReversed
PaymentUnknown
```

---

# 2054 — Processed Events

If Payment consumes Order events or settlement events:

```text
processed_events
```

prevents duplicate handling.

---

# 2055 — Indexes

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

# 2056 — Unknown Payments Index

Potential partial index:

```sql
CREATE INDEX idx_payments_unknown
ON payments(updated_at)
WHERE status = 'UNKNOWN';
```

Used by recovery worker.

---

# 2057 — Pending Payments Index

```sql
CREATE INDEX idx_payments_pending
ON payments(expires_at)
WHERE status = 'PENDING';
```

if expiry worker exists.

---

# 2058 — Create Payment Transaction

```text
BEGIN

claim idempotency
insert payment
insert payment attempt
insert outbox PaymentCreated if needed
complete idempotency

COMMIT
```

Provider call may happen before/after depending workflow design.

---

# 2059 — Provider Call Transaction Boundary

Do not keep DB transaction open during long external provider request.

Recommended:

```text
persist attempt SENT
commit
      ↓
call provider
      ↓
persist result
```

Idempotency and recovery state make this safe.

---

# 2060 — Attempt State Before Provider Call

Persist:

```text
attempt.status = SENT
merchant_reference
```

before network call.

If process crashes:

```text
recovery worker knows an external call may have occurred
```

---

# 2061 — Provider Success Transaction

```text
BEGIN

lock payment
validate transition
update attempt
update payment
insert capture/authorization record
insert outbox event

COMMIT
```

---

# 2062 — Provider Timeout Transaction

Persist:

```text
attempt = UNKNOWN
payment = UNKNOWN or PENDING
```

depending model.

Schedule status resolution.

---

# 2063 — Refund Transaction

Pattern:

```text
persist refund REQUESTED
commit
      ↓
call provider
      ↓
persist SUCCEEDED/FAILED/UNKNOWN
```

Avoid holding DB locks through remote call.

---

# 2064 — Optimistic Locking

Use:

```text
version
```

on Payment and Refund where concurrent callback/API updates may race.

---

# 2065 — Callback vs API Race

Example:

```text
status query returns CAPTURED
callback arrives simultaneously
```

Both must converge to one valid result.

Use:

```text
row lock / optimistic version
idempotent transition
```

---

# 2066 — Refund Concurrency

Two refund requests can race.

Use transaction/locking to guarantee:

```text
sum(refunds) <= captured_amount
```

---

# 2067 — Atomic Refund Availability

Possible logic:

```text
remaining_refundable
=
captured_amount - refunded_amount - pending_refund_amount
```

Reserve refund capacity before sending provider request if needed.

---

# 2068 — Pending Refund Amount

For concurrency safety, track:

```text
pending_refund_amount
```

or lock Payment while creating refund requests.

---

# 2069 — Provider Callback Security

Callback endpoint must validate:

```text
signature
timestamp
nonce/event ID
merchant identity
```

Reject invalid signatures.

---

# 2070 — Replay Protection

Use:

```text
provider_event_id uniqueness
timestamp tolerance
signature verification
```

---

# 2071 — Payment Data Security

Never store/log raw:

```text
PAN
CVV
private key
provider secret
access token
```

unless compliant architecture explicitly requires and protects it.

Prefer tokenized provider references.

---

# 2072 — PCI Scope

If handling card data directly:

```text
PCI DSS scope increases significantly
```

Prefer provider-hosted/tokenized methods to minimize sensitive card handling.

---

# 2073 — Tokenized Payment Method

Possible:

```text
payment_method_token
```

provided by external provider.

Do not treat token as harmless; it is sensitive.

---

# 2074 — Payment Authorization

Internal service calls should require scoped service identity:

```text
payments.create
payments.capture
payments.refund
payments.read
```

---

# 2075 — Refund Authorization

Refund permissions should be more restricted than payment-read permissions.

Example:

```text
payments.refund
payments.refund.large
```

---

# 2076 — Dual Control

Large/high-risk refunds may require:

```text
requester
approver
```

before provider execution.

---

# 2077 — Admin Payment API

Possible:

```text
GET  /api/v1/admin/payments/{paymentId}
GET  /api/v1/admin/payments
POST /api/v1/admin/payments/{paymentId}/refunds
POST /api/v1/admin/payments/{paymentId}/reconcile
```

Do not expose provider secrets.

---

# 2078 — Internal gRPC Contract

Potential:

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

# 2079 — CreatePayment Request

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

# 2080 — CreatePayment Response

Possible:

```text
payment_id
status
merchant_reference
payment_action
expires_at
```

---

# 2081 — Capture Request

Fields:

```text
payment_id
amount
idempotency_key
```

---

# 2082 — Refund Request

Fields:

```text
payment_id
amount
reason_code
idempotency_key
requested_by
```

---

# 2083 — GetPayment Response

Return canonical fields.

Do not leak:

```text
raw provider payload
secret
private integration metadata
```

---

# 2084 — Payment Error Catalog

Candidate:

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

# 2085 — Error Mapping

Example:

| Error | gRPC / HTTP |
|---|---|
| PAYMENT_NOT_FOUND | NOT_FOUND / 404 |
| PAYMENT_ALREADY_CAPTURED | ALREADY_EXISTS / 409 |
| PAYMENT_NOT_REFUNDABLE | FAILED_PRECONDITION / 422 |
| PAYMENT_DECLINED | FAILED_PRECONDITION / 422 |
| PAYMENT_UNKNOWN | UNAVAILABLE / 409/202 depending flow |
| PROVIDER_UNAVAILABLE | UNAVAILABLE / 503 |
| PROVIDER_TIMEOUT | DEADLINE_EXCEEDED / 504 |
| IDEMPOTENCY_KEY_REUSED | ALREADY_EXISTS / 409 |

---

# 2086 — Payment Events Published

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

# 2087 — PaymentCaptured Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "PAYMENT_CAPTURED",
  "event_version": 1,
  "producer": "payment-service",
  "correlation_id": "cor_...",
  "data": {
    "payment_id": "PAY001",
    "order_id": "ORD001",
    "amount": {
      "amount": "12.50",
      "currency": "USD"
    },
    "provider": "ABA"
  }
}
```

---

# 2088 — PaymentFailed Event

Include:

```text
payment_id
order_id
failure_category
retryable
```

Do not publish sensitive provider details unnecessarily.

---

# 2089 — PaymentUnknown Event

This is operationally important.

Potential consumer:

```text
Order workflow
```

must avoid assuming failure.

---

# 2090 — PaymentRefunded Event

Data:

```text
payment_id
refund_id
order_id
refund amount
currency
reason code
```

---

# 2091 — Event Ordering

Partition by:

```text
payment_id
```

to preserve payment lifecycle ordering.

---

# 2092 — Events Consumed

Possible:

```text
OrderCancelled
OrderCompleted
```

only if Payment behavior is event-driven.

Prefer explicit command for critical refund/capture unless choreography is intentionally chosen.

---

# 2093 — Capture Orchestration

Ordering may call:

```text
CapturePayment
```

at the selected business milestone.

Payment Service owns provider execution.

---

# 2094 — Refund Orchestration

Order cancellation may call:

```text
RefundPayment
```

or publish command/event into a Saga.

The design must clearly distinguish:

```text
command
```

from:

```text
informational event
```

---

# 2095 — Payment Reconciliation

Reconciliation compares:

```text
internal Payment
provider transaction
settlement/report
```

---

# 2096 — Reconciliation Sources

Possible:

```text
provider status API
provider daily report
bank settlement file
callback history
merchant portal export
```

---

# 2097 — Reconciliation Keys

Use:

```text
merchant_reference
provider_reference
amount
currency
business date
```

---

# 2098 — Reconciliation Mismatch Types

Examples:

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

# 2099 — Reconciliation Workflow

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

# 2100 — No Silent Financial Repair

Do not silently:

```text
UPDATE payment status
```

for unexplained mismatch.

Require:

```text
documented reconciliation action
audit
operator/system identity
```

---

# 2101 — Settlement

Provider settlement may happen after capture.

If settlement tracking is needed, model separately:

```text
CAPTURED
```

does not necessarily mean:

```text
merchant bank settlement complete
```

---

# 2102 — Settlement Status

Optional:

```text
PENDING
SETTLED
FAILED
ADJUSTED
```

Only introduce if finance needs it.

---

# 2103 — Chargebacks / Disputes

Future model may include:

```text
dispute_id
payment_id
provider_case_id
amount
status
reason
```

Do not mix disputes into normal refund model.

---

# 2104 — Payment Service Clean Architecture

Recommended:

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
│   ├── kafka/
│   └── secrets/
│
└── config/
```

---

# 2105 — Input Ports

Examples:

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
```

---

# 2106 — Output Ports

Examples:

```text
LoadPaymentPort
SavePaymentPort
PaymentAttemptPort
RefundPort
ProviderPort
IdempotencyPort
ProviderCallbackPort
OutboxPort
ReconciliationPort
ClockPort
MerchantReferenceGenerator
```

---

# 2107 — CreatePaymentUseCase

Pseudo flow:

```text
Validate command
      ↓
Claim idempotency
      ↓
Check existing payment for order
      ↓
Create Payment
      ↓
Create Attempt
      ↓
Persist
      ↓
Call provider if immediate flow
      ↓
Persist provider result
      ↓
Publish event
      ↓
Return canonical result
```

---

# 2108 — CapturePaymentUseCase

```text
Load payment
      ↓
Validate capturable
      ↓
Claim idempotency
      ↓
Persist capture request/reference
      ↓
Call provider
      ↓
Persist result
      ↓
Publish PaymentCaptured / failure / unknown
```

---

# 2109 — RefundPaymentUseCase

```text
Authorize actor
      ↓
Load payment
      ↓
Validate refundable amount
      ↓
Claim idempotency
      ↓
Create refund request
      ↓
Call provider
      ↓
Persist result
      ↓
Update payment refunded amount
      ↓
Publish refund event
```

---

# 2110 — Callback Use Case

```text
Verify provider signature
      ↓
Deduplicate
      ↓
Resolve payment
      ↓
Map provider state
      ↓
Validate transition
      ↓
Persist callback + payment state
      ↓
Outbox event
```

---

# 2111 — ResolveUnknownPaymentUseCase

```text
Load UNKNOWN payment/attempt
      ↓
Query provider by merchant reference
      ↓
Map provider result
      ↓
Persist final state
      ↓
Publish event
```

---

# 2112 — Recovery Worker

Scans:

```text
UNKNOWN attempts
long-running PENDING payments
UNKNOWN refunds
callback processing failures
```

---

# 2113 — Recovery Backoff

Use:

```text
bounded retry
exponential backoff
jitter
alert threshold
```

---

# 2114 — Payment Expiry Worker

For expirable payment intents:

```text
find expired PENDING
      ↓
query provider if uncertain
      ↓
mark terminal only when safe
```

---

# 2115 — Provider Health

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

# 2116 — Multi-Provider Routing

Future:

```text
Payment Router
```

may choose provider based on:

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

# 2117 — Provider Failover

Automatic failover is risky if first provider outcome is unknown.

Rule:

```text
never fail over to another provider until prior attempt is definitively failed
```

unless business can safely tolerate duplicate charges.

---

# 2118 — Routing Audit

If provider routing exists, record:

```text
selected provider
routing reason
routing policy version
```

---

# 2119 — Payment Metrics

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

# 2120 — Payment SLIs

Possible:

```text
CreatePayment success rate
Capture success rate
P95 provider latency
Callback processing latency
Unknown-outcome resolution time
Refund success rate
Reconciliation health
```

---

# 2121 — Payment Alerts

Alert on:

```text
provider timeout spike
capture failure spike
unknown payment spike
callback signature failures
callback processing backlog
refund failure spike
reconciliation mismatch
DB errors
outbox backlog
```

---

# 2122 — Payment Dashboard

Show:

```text
payment volume
captured amount
success/decline/failure
unknown state count
provider latency
refund volume
refund failures
callbacks
reconciliation mismatches
```

Use finance-approved metric definitions.

---

# 2123 — Structured Logging

Safe fields:

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

# 2124 — Tracing

Trace:

```text
Order
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

Tag:

```text
provider
operation
result
```

Avoid sensitive financial data in trace attributes.

---

# 2125 — Payment Audit

Audit privileged actions:

```text
manual refund
manual reversal
reconciliation override
provider reference correction
payment state repair
```

---

# 2126 — Manual Payment Repair

Avoid direct DB update.

Use privileged command:

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

# 2127 — Payment Data Classification

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

# 2128 — Retention

Payment records usually require long retention for:

```text
finance
refunds
reconciliation
audits
tax/business records
disputes
```

Exact duration is policy-defined.

---

# 2129 — Sensitive Payload Retention

Do not retain full raw provider payload forever unless needed.

Prefer:

```text
normalized fields
payload hash
restricted short-term raw payload
```

---

# 2130 — Backup

Back up:

```text
payments
attempts
captures
refunds
reversals
callbacks metadata
reconciliation
outbox
```

Provider secrets are recovered from Secret Manager, not DB backup.

---

# 2131 — Restore

After restore:

```text
reconcile provider state
resolve UNKNOWN/PENDING
replay/repair outbox
review refunds
check callbacks after restore point
```

---

# 2132 — Restore Danger

Restoring an old Payment DB may lose knowledge of a charge that already occurred externally.

Therefore:

```text
provider reconciliation is mandatory after recovery
```

---

# 2133 — Disaster Recovery

Payment DR requires:

```text
RPO
RTO
provider status query capability
merchant reference uniqueness
callback recovery
event replay
reconciliation
secret/key recovery
```

---

# 2134 — Flyway Migration Plan

Example:

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

# 2135 — Provider Migration

Switching provider requires:

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

# 2136 — Legacy Payment Migration

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

# 2137 — Legacy Status Mapping

Maintain explicit mapping:

```text
legacy code
provider code
canonical status
```

Do not scatter mappings throughout code.

---

# 2138 — Testing Strategy

Test:

```text
Domain
Application
Persistence
Provider adapter
Webhook
Idempotency
Concurrency
Unknown outcome
Refund
Reconciliation
Security
Load
Failure
Migration
```

---

# 2139 — Domain Tests

Test:

```text
valid transitions
invalid transitions
capture limits
refund limits
terminal states
unknown-state restrictions
```

---

# 2140 — Create Payment Tests

Scenarios:

```text
success
duplicate idempotency
same key changed amount
provider decline
provider timeout
provider 5xx
invalid currency
```

---

# 2141 — Authorization Tests

Test:

```text
authorize success
authorize decline
duplicate authorize
expired authorization
```

---

# 2142 — Capture Tests

Critical:

```text
capture once
duplicate capture
concurrent capture
capture after refund
capture amount mismatch
provider timeout with later success
```

---

# 2143 — Unknown Outcome Tests

Simulate:

```text
provider accepts
response lost
```

Ensure:

```text
UNKNOWN
status query
final CAPTURED
no duplicate provider call
```

---

# 2144 — Refund Tests

Test:

```text
full refund
partial refund
multiple partial refunds
refund exceeds captured
duplicate refund
concurrent refund
refund timeout
refund unknown
```

---

# 2145 — Callback Tests

Test:

```text
valid signature
invalid signature
duplicate callback
out-of-order callback
amount mismatch
currency mismatch
unknown reference
```

---

# 2146 — Provider Adapter Contract Tests

Against sandbox/mock:

```text
request signing
field mapping
status mapping
timeout
retry
status query
refund
```

---

# 2147 — Persistence Tests

Use PostgreSQL Testcontainers.

Test:

```text
merchant reference uniqueness
provider reference uniqueness
refund constraints
optimistic locking
Flyway
indexes
```

---

# 2148 — Idempotency Concurrency Tests

Send multiple identical:

```text
CreatePayment
CapturePayment
RefundPayment
```

requests simultaneously.

Verify one provider side effect.

---

# 2149 — Callback/API Race Tests

Simulate:

```text
callback CAPTURED
status query CAPTURED
API retry
```

All converge safely.

---

# 2150 — Reconciliation Tests

Create mismatches:

```text
internal FAILED / provider PAID
internal CAPTURED / provider missing
refund mismatch
amount mismatch
```

Verify detection and no unsafe silent repair.

---

# 2151 — Load Tests

Scenarios:

```text
checkout payment burst
callback burst
refund batch
status-query recovery
provider slow response
```

---

# 2152 — Provider Degradation Test

Simulate:

```text
high latency
timeouts
5xx
rate limiting
```

Verify:

```text
circuit breaker
backoff
UNKNOWN handling
no duplicate charge
```

---

# 2153 — Security Tests

Verify:

```text
invalid callback signature rejected
replay callback deduped
refund unauthorized
provider secret absent from logs
client cannot set captured state
```

---

# 2154 — Definition of Done: Create Payment

- [ ] Idempotency.
- [ ] Exact amount/currency.
- [ ] Stable merchant reference.
- [ ] Provider adapter.
- [ ] Timeout strategy.
- [ ] Unknown-outcome handling.
- [ ] Persistence.
- [ ] Outbox.
- [ ] Security logging.
- [ ] Tests.

---

# 2155 — Definition of Done: Capture

- [ ] Capturable-state validation.
- [ ] Idempotency.
- [ ] Provider idempotency/reference.
- [ ] Unknown-outcome recovery.
- [ ] Event.
- [ ] Concurrency tests.
- [ ] Reconciliation support.

---

# 2156 — Definition of Done: Refund

- [ ] Authorization.
- [ ] Refundable amount validation.
- [ ] Idempotency.
- [ ] Concurrency safety.
- [ ] Provider timeout handling.
- [ ] Unknown refund handling.
- [ ] Audit.
- [ ] Event.
- [ ] Reconciliation.
- [ ] Tests.

---

# 2157 — Payment Review Checklist

## Ownership

- [ ] Payment lifecycle owned here.
- [ ] Order lifecycle remains in Ordering.
- [ ] Wallet remains separate.
- [ ] Provider details isolated in adapters.

## Correctness

- [ ] Idempotency.
- [ ] Exact money.
- [ ] Stable merchant reference.
- [ ] Unknown outcome modeled.
- [ ] Refund limits.
- [ ] State machine.

## Provider

- [ ] Signature/authentication.
- [ ] Timeouts.
- [ ] Status query.
- [ ] Callback verification.
- [ ] Code mapping.
- [ ] Reconciliation.

---

# 2158 — Data Review Checklist

- [ ] Payment ID stable.
- [ ] Merchant reference unique.
- [ ] Attempts modeled.
- [ ] Provider references stored.
- [ ] Refund table.
- [ ] Callback dedupe.
- [ ] Idempotency table.
- [ ] Reconciliation tables.
- [ ] Outbox.
- [ ] Retention defined.

---

# 2159 — Contract Review Checklist

- [ ] CreatePayment.
- [ ] Authorize/Capture.
- [ ] Refund.
- [ ] Status query.
- [ ] Callback contract.
- [ ] Error catalog.
- [ ] Deadlines.
- [ ] Idempotency.
- [ ] Unknown outcome semantics.
- [ ] Event schemas.

---

# 2160 — Security Review Checklist

- [ ] No raw card secrets stored.
- [ ] Provider secrets in Secret Manager.
- [ ] Callback signatures verified.
- [ ] Refund permission restricted.
- [ ] Sensitive logs redacted.
- [ ] Provider TLS verified.
- [ ] Replay protection.
- [ ] Admin repairs audited.

---

# 2161 — Operations Review Checklist

- [ ] Provider metrics.
- [ ] Unknown-outcome worker.
- [ ] Callback monitoring.
- [ ] Refund monitoring.
- [ ] Reconciliation.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Runbooks.
- [ ] Backup/restore.
- [ ] Outbox monitoring.

---

# 2162 — Production Readiness Checklist

Before production:

- [ ] Provider sandbox certification complete.
- [ ] Idempotency concurrency tests pass.
- [ ] Duplicate capture test passes.
- [ ] Unknown-outcome recovery tested.
- [ ] Callback signature validation tested.
- [ ] Duplicate callback tested.
- [ ] Out-of-order callback tested.
- [ ] Refund concurrency tested.
- [ ] Reconciliation tested.
- [ ] Provider outage tested.
- [ ] Backup/restore tested.
- [ ] DR reconciliation procedure tested.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Security review passed.

---

# 2163 — Initial Implementation Order

Recommended:

```text
1. Payment aggregate
2. Payment status machine
3. Payment persistence
4. Payment attempts
5. Merchant reference generator
6. CreatePayment
7. Provider adapter
8. Idempotency
9. Timeout/UNKNOWN state
10. Provider status query
11. Callback processing
12. Capture
13. Refund
14. Reversal
15. Outbox events
16. Recovery worker
17. Reconciliation
18. Admin query
19. Metrics/alerts
```

---

# 2164 — Minimum Viable Payment Service

First production-capable version:

```text
Payment aggregate
One provider
Create/authorize or immediate capture
Payment attempts
Idempotency
Stable merchant reference
Provider callback verification
Unknown-outcome handling
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
unknown outcome
reconciliation
```

These are core financial correctness controls.

---

# 2165 — Future Enhancements

Potential:

```text
Multiple provider routing
Smart failover
3DS/SCA
Saved payment methods
Tokenized cards
Settlement
Chargebacks
Disputes
Provider performance routing
Finance exports
Automated settlement reconciliation
```

---

# 2166 — PART 14 Deliverables

PART 14 produces:

1. Payment Service responsibility definition.
2. Boundary from Ordering and Wallet.
3. Payment aggregate.
4. Payment Attempt model.
5. Payment status model.
6. Attempt status model.
7. Payment invariants.
8. Payment method model.
9. Provider abstraction.
10. Merchant/provider reference strategy.
11. Payment intent.
12. Create-payment idempotency.
13. Multiple payment attempts.
14. Authorization flow.
15. Capture flow.
16. Immediate-capture flow.
17. Provider error mapping.
18. Retryability rules.
19. Unknown-outcome architecture.
20. Status-query recovery.
21. Timeout strategy.
22. Circuit breaker guidance.
23. Refund model.
24. Partial/full refund.
25. Refund idempotency.
26. Reversal model.
27. Provider adapter/ACL.
28. Provider credentials/security.
29. Callback verification.
30. Callback idempotency.
31. Callback ordering/mismatch checks.
32. Redirect/QR payment actions.
33. Payment expiry.
34. Payment database schema.
35. Concurrency controls.
36. gRPC/REST contracts.
37. Error catalog.
38. Payment event catalog.
39. Payment reconciliation.
40. Settlement/chargeback guidance.
41. Clean Architecture layout.
42. Input/output ports.
43. Recovery workers.
44. Provider health metrics.
45. Security/audit.
46. Retention.
47. Backup/restore.
48. DR.
49. Flyway migrations.
50. Legacy migration.
51. Testing strategy.
52. Failure testing.
53. Review checklists.
54. Production readiness.
55. Implementation order.

---

# 2167 — Exit Criteria

PART 14 is complete when the team can answer:

### Ownership

```text
What does Payment own versus Ordering and Wallet?
```

### Idempotency

```text
How do we guarantee a retry cannot charge twice?
```

### Unknown Outcome

```text
What happens when provider may have charged but our request timed out?
```

### Capture

```text
When and how is authorization captured exactly once?
```

### Refund

```text
How do partial/full refunds remain concurrency-safe and idempotent?
```

### Callback

```text
How are signatures, duplicates, and out-of-order notifications handled?
```

### Security

```text
How are provider credentials and payment data protected?
```

### Reconciliation

```text
How do we detect disagreement between provider and internal payment state?
```

### Recovery

```text
How do UNKNOWN/PENDING transactions converge after crashes or outages?
```

If these answers are clear and tested, Payment Service is ready for implementation.

---

# 2168 — Handoff to PART 15

PART 15 defines Wallet Service.

```text
PART 14
Payment Service
      ↓
External Payment Lifecycle
Provider References
Capture / Refund
      ↓
PART 15
Wallet Service
```

Wallet Service will own:

```text
Wallet Account
Available Balance
Reserved Balance
Ledger
Top-Up
Reserve
Capture
Release
Refund
Reversal
Adjustment
Reconciliation
Concurrency
Wallet Events
```

The key separation is:

```text
Payment Service
= external/provider money collection

Wallet Service
= internal stored-value ledger
```

---

# PART 14 — Summary

The Payment Service protects one of the platform's highest-risk workflows:

```text
collecting and returning money exactly once
```

Core payment lifecycle:

```text
Create Payment
      ↓
Create Attempt
      ↓
Provider Request
      ├──> AUTHORIZED
      │      ↓
      │    CAPTURED
      │
      ├──> FAILED
      │
      └──> UNKNOWN
             ↓
         Query / Callback /
         Reconciliation
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

The most important rules are:

```text
Payment commands are idempotent.
Provider requests use stable references.
Timeout does not automatically mean failure.
UNKNOWN is a first-class state.
Provider callbacks are authenticated and deduplicated.
Out-of-order callbacks cannot regress state.
Refund totals never exceed captured totals.
Raw payment secrets are not logged.
Reconciliation is mandatory.
Provider details stay behind an anti-corruption layer.
```

The next chapter defines the internal stored-value financial system:

```text
PART 15 — Wallet Service
```

---

**End of PART 14 — Payment Service**
