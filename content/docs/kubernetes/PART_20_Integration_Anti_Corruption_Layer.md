---
title: "PART 20 — INTEGRATION / ANTI-CORRUPTION LAYER"
---

# PART 20 — INTEGRATION / ANTI-CORRUPTION LAYER

> **Document Role:** Defines the complete architecture, responsibilities, mapping standards, protocol-translation patterns, inbound/outbound integration contracts, idempotency, retries, reconciliation, strangler migration, testing strategy, and production standards for the Integration / Anti-Corruption Layer.  
> **Previous Part:** PART 19 — Notification Service  
> **Next Part:** PART 21 — Service Communication  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL where persistence is required, Kafka, REST/gRPC, Flyway, Redis only where appropriate  
> **Audience:** Backend engineers, integration engineers, software architects, QA engineers, DevOps engineers, SREs, security engineers, technical leads.

---

# 3452 — Purpose

The Integration / Anti-Corruption Layer protects the core platform from external and legacy models.

It answers:

```text
How do we communicate with a legacy system?
How do we translate external partner data into canonical platform concepts?
How do we stop provider-specific fields from leaking into domain services?
How are inbound webhooks authenticated and deduplicated?
How are outbound requests retried safely?
How are unknown outcomes reconciled?
How do we migrate from legacy systems without coupling the new platform to legacy schemas?
```

The core principle is:

```text
External language
      ↓
Integration / ACL
      ↓
Canonical platform language
```

---

# 3453 — Integration Service Responsibilities

Integration / ACL owns:

```text
External Partner Adapters
Legacy System Adapters
Protocol Translation
Canonical Mapping
Inbound Webhook Processing
Outbound API Calls
Partner Authentication
Partner Request Signing
Partner Error Mapping
Partner Retry Policy
Partner Idempotency
External Reference Mapping
Data Synchronization
Legacy Event Translation
Integration Reconciliation
Integration Audit
Integration Monitoring
Strangler Migration Support
```

Possible future responsibilities:

```text
EDI/file exchange
SFTP import/export
Batch settlement integration
Partner onboarding framework
Integration configuration portal
Schema transformation service
```

---

# 3454 — Non-Responsibilities

Integration / ACL does not own:

```text
Order business rules
Payment financial state
Wallet balance
Inventory stock
Loyalty points
Promotion rules
Mission progress
Customer profile
Notification policy
```

It translates and transports.

It must not silently become:

```text
a second business domain
a shared database access layer
a dumping ground for unrelated logic
```

---

# 3455 — Anti-Corruption Layer Principle

External systems may use concepts such as:

```text
tranID
receipt_no
member_card_no
branch_code
documentNo
status = 1 / 2 / 3 / -1 / -2
```

Core services should use canonical concepts such as:

```text
order_id
order_number
customer_id
store_id
payment_reference
OrderStatus
```

ACL performs the translation.

---

# 3456 — Core Domain Protection

Do not let:

```text
provider field names
legacy table names
partner status codes
partner authentication conventions
```

appear throughout:

```text
Order domain
Payment domain
Wallet domain
Loyalty domain
```

Contain them inside integration adapters.

---

# 3457 — Ubiquitous Language

| Term | Meaning |
|---|---|
| External System | Third-party or legacy system outside the core domain boundary |
| Partner | External provider/business integration |
| Adapter | Implementation translating between external and internal contracts |
| ACL | Anti-Corruption Layer protecting domain language |
| Canonical Model | Internal normalized representation |
| External Reference | Stable identifier from partner/legacy system |
| Mapping | Translation between external and canonical fields/values |
| Inbound Integration | Data/event received from external system |
| Outbound Integration | Request/data sent to external system |
| Reconciliation | Process comparing external and internal states |
| Strangler | Migration approach gradually replacing legacy capability |

---

# 3458 — Integration Categories

Typical categories:

```text
LEGACY_INTERNAL
PAYMENT_PROVIDER
DELIVERY_PARTNER
POS / ERP
BANKING
TOP_UP_PROVIDER
CRM / MARKETING
IDENTITY_PROVIDER
EMAIL / SMS / PUSH PROVIDER
REPORTING / FINANCE
```

---

# 3459 — Integration Architecture

High-level:

```text
Core Service
    │
    ▼
Port / Canonical Contract
    │
    ▼
Integration / ACL
    │
    ├── Legacy Adapter
    ├── Partner A Adapter
    ├── Partner B Adapter
    ├── Bank Adapter
    └── Delivery Adapter
         │
         ▼
External Systems
```

Inbound:

```text
External Webhook
      ↓
Integration / ACL
      ↓
Canonical Event / Command
      ↓
Core Service
```

---

# 3460 — Integration Deployment Options

Option A:

```text
Dedicated integration-service
```

Option B:

```text
Adapter lives inside owning service
```

Use dedicated service when:

```text
many systems share the integration
protocol is complex
legacy DB access must be isolated
partner credentials/config need central operations
translation is substantial
```

Keep adapter inside domain service when:

```text
integration is narrow
only one service consumes it
business ownership is obvious
```

---

# 3461 — Avoid Central Integration Monolith

A single integration service can become a new monolith.

Avoid:

```text
every external call
every legacy table
every partner webhook
all business mapping
```

in one giant unstructured service.

Organize by:

```text
bounded integration capability
partner
business owner
```

---

# 3462 — Suggested Modules

Example:

```text
integration-service/
│
├── delivery/
├── topup/
├── pos/
├── legacy-order/
├── legacy-member/
├── payment-partner/
├── finance/
└── shared-transport/
```

Each module has clear owner/contract.

---

# 3463 — Canonical Model

A canonical integration model is internal-facing and stable.

Example:

```text
CanonicalStoreReference
CanonicalExternalPaymentResult
CanonicalDeliveryStatus
CanonicalTopUpConfirmation
```

Do not expose raw partner payload to core.

---

# 3464 — Canonical Model Rule

Canonical models should represent:

```text
platform meaning
```

not:

```text
lowest common denominator of all providers
```

Provider-specific optional fields may remain inside adapter metadata.

---

# 3465 — External DTO

Each provider has its own DTO:

```text
GrabOrderStateWebhook
LegacyMemberRow
BusinessCentralTopUpRequest
ProviderPaymentResponse
```

External DTO never enters Domain layer directly.

---

# 3466 — Mapping Layer

Example:

```text
GrabOrderStateWebhook
      ↓ mapper
CanonicalDeliveryUpdate
      ↓
Order/Delivery Contract
```

---

# 3467 — Mapper Responsibility

Mapper performs:

```text
field mapping
enum mapping
unit conversion
date/time conversion
identifier normalization
optional/default handling
```

It must not hide major business decisions.

---

# 3468 — Business Mapping vs Technical Mapping

Technical:

```text
"documentNo" → external_document_number
```

Business:

```text
provider "DELIVERED" → Order DONE
```

Business mapping should be explicit and reviewed with domain owner.

---

# 3469 — External Reference Mapping

Possible table:

```text
external_reference_mappings
---------------------------
id
system_code
entity_type
external_id
internal_id
created_at
updated_at
```

Unique:

```text
(system_code, entity_type, external_id)
```

---

# 3470 — Reference Mapping Use Cases

Examples:

```text
legacy user ID ↔ customer_id
legacy order ID ↔ order_id
provider transaction ID ↔ payment_id
legacy outlet code ↔ store_id
```

---

# 3471 — Mapping Stability

Once an external reference maps to an internal entity:

```text
do not remap silently
```

Changes require:

```text
controlled migration
audit
```

---

# 3472 — Store Mapping

Legacy/partner may use:

```text
bc_outlet_no
branch code
store code
```

Core uses:

```text
store_id
```

Mapping belongs in integration/reference data.

---

# 3473 — Product Mapping

Partner may use:

```text
partner_item_code
POS item code
legacy menu ID
```

Core uses:

```text
product_id
```

Mapping table may include:

```text
partner
store
channel
product mapping
```

---

# 3474 — Customer Mapping

Legacy may use:

```text
member_card_no
member_id
phone
```

Do not guess identity.

Use explicit mapping:

```text
legacy_member_id → customer_id
```

---

# 3475 — Status Mapping

Maintain explicit tables/code:

```text
external_status
canonical_status
allowed_context
notes
```

Example:

```text
1  → PENDING
2  → ACCEPTED
3  → READY
4  → DELIVERING
5  → DONE
-1 → CANCELLATION_REQUESTED
-2 → CANCELLED
```

---

# 3476 — Status Mapping Ownership

The owning domain defines canonical status semantics.

Integration only translates.

It must not invent a new order lifecycle.

---

# 3477 — Date/Time Mapping

External system may send:

```text
local datetime
Unix timestamp
ISO string
```

Normalize to:

```text
Instant / offset-aware time
```

with explicit source timezone.

---

# 3478 — Unknown Timezone

Do not assume server timezone.

If partner sends local time without zone:

```text
partner configuration must specify timezone
```

---

# 3479 — Money Mapping

Validate:

```text
amount
currency
scale
rounding
```

Do not convert partner float blindly into internal money.

---

# 3480 — Boolean Mapping

Legacy values:

```text
Y/N
1/0
TRUE/FALSE
```

map explicitly.

---

# 3481 — Null/Empty Mapping

External systems may distinguish poorly between:

```text
null
""
0
"0000-00-00"
```

Normalize carefully.

Do not convert all missing values to zero.

---

# 3482 — Legacy Sentinel Values

Examples:

```text
0001-01-01
99999999
GUEST
```

must remain adapter concerns.

Canonical core model should express:

```text
missing
guest
unknown
```

explicitly.

---

# 3483 — Protocol Translation

Integration may translate:

```text
REST ↔ gRPC
SOAP ↔ REST
OData ↔ canonical query
SFTP file ↔ events
SQL legacy table ↔ canonical event
```

---

# 3484 — REST Partner Adapter

Responsibilities:

```text
base URL
authentication
headers
serialization
timeouts
error mapping
idempotency
observability
```

---

# 3485 — OData Adapter

Responsibilities:

```text
query composition
escaping
pagination
$filter
$expand
provider-specific sentinel filtering
mapping
```

Core service should not know OData syntax.

---

# 3486 — SOAP Adapter

If needed:

```text
WSDL/client generation
XML mapping
fault mapping
timeouts
security
```

Hide XML/SOAP from core.

---

# 3487 — File Integration

For CSV/XML/JSON batch files:

```text
receive
validate schema
checksum
parse
quarantine invalid rows
map
process idempotently
archive
reconcile
```

---

# 3488 — SFTP Integration

If partner uses SFTP:

```text
key-based auth
host-key verification
atomic file pickup
file naming/versioning
checksum
processed/archive folders
```

Never disable host-key verification in production.

---

# 3489 — Legacy Database Integration

During strangler migration, integration may read legacy DB.

Rules:

```text
read-only when possible
no core service direct queries
no cross-service writes
explicit ownership
bounded query load
```

---

# 3490 — Legacy DB Write

If temporary write is unavoidable:

```text
isolate in ACL
document authority
use idempotency
audit
plan removal
```

Never spread legacy writes across new services.

---

# 3491 — Stored Procedure Integration

Legacy may require:

```text
EXEC sp_api_IC_Topup
```

Adapter hides:

```text
procedure name
parameter quirks
result-set format
```

Core receives canonical result.

---

# 3492 — Legacy SQL Server Mapping

External table examples may include:

```text
transaction master
payment detail
preset history
prize history
coupon history
```

Treat table schemas as external contracts, not new-domain entities.

---

# 3493 — Business Central / ERP Integration

Example flow:

```text
Top-Up confirmed
      ↓
Integration
      ↓
Business Central API
      ↓
create topUpBalance document
```

Map:

```text
internal transaction reference
store
terminal
reason code
amount
```

to provider fields.

---

# 3494 — Duplicate ERP Submission

Before creating external record:

```text
query by stable transaction reference
```

or use provider idempotency if available.

---

# 3495 — External Idempotency Key

Prefer stable business reference such as:

```text
order_id
payment_id
topup_id
```

over random per retry.

---

# 3496 — Outbound Request Lifecycle

Possible state:

```text
CREATED
READY
SENDING
SUCCEEDED
FAILED_RETRYABLE
FAILED_FINAL
UNKNOWN
```

---

# 3497 — Integration Request Table

Possible:

```text
integration_requests
--------------------
id
integration_code
operation
business_reference_type
business_reference_id
idempotency_key
request_hash
status
attempt_count
next_retry_at
last_error
created_at
updated_at
completed_at
```

---

# 3498 — Integration Attempt Table

```text
integration_attempts
--------------------
id
integration_request_id
attempt_number
started_at
completed_at
http_status
provider_code
result_status
error_category
latency_ms
```

---

# 3499 — Raw Payload Storage

Raw payload may be useful for:

```text
debugging
reconciliation
disputes
```

but can contain sensitive data.

Prefer:

```text
normalized fields
payload hash
restricted encrypted payload
short retention
```

---

# 3500 — Outbound Call Pattern

Recommended:

```text
persist integration request
      ↓
commit
      ↓
worker calls external system
      ↓
persist result
      ↓
publish canonical event
```

For latency-sensitive operations, synchronous call is allowed but same correctness principles apply.

---

# 3501 — Direct Synchronous Call

Example:

```text
Order
  ↓
Integration Port
  ↓
Delivery Partner
```

Requirements:

```text
timeout
idempotency
retry policy
circuit breaker
mapping
trace
```

---

# 3502 — Timeout Strategy

Every external dependency needs:

```text
connect timeout
read timeout
overall deadline
```

No infinite waits.

---

# 3503 — Retry Strategy

Retry only if:

```text
operation is idempotent
or
provider supports idempotency
or
status can be queried safely
```

---

# 3504 — Retryable Errors

Typical:

```text
network reset
HTTP 429
HTTP 502
HTTP 503
HTTP 504
temporary provider code
```

---

# 3505 — Non-Retryable Errors

Typical:

```text
400 invalid request
401/403 configuration/auth issue until fixed
business validation rejection
unsupported operation
```

Authentication errors may be operationally retryable only after credentials are fixed, not hot-looped.

---

# 3506 — Unknown Outcome

Critical case:

```text
request sent
external side effect may have completed
response lost
```

State:

```text
UNKNOWN
```

Do not blindly repeat.

---

# 3507 — Unknown Outcome Resolution

Use:

```text
status query
duplicate lookup by business reference
provider callback
reconciliation
```

---

# 3508 — Circuit Breaker

Use for repeatedly failing dependency.

States:

```text
CLOSED
OPEN
HALF_OPEN
```

Do not use circuit breaker as a substitute for business reconciliation.

---

# 3509 — Bulkhead

Separate thread pools/concurrency limits for:

```text
Partner A
Partner B
Legacy SQL
ERP
```

One broken provider should not exhaust all integration threads.

---

# 3510 — Rate Limiting

Respect partner rate limits.

Use:

```text
token bucket
bounded concurrency
queue
backoff
```

---

# 3511 — Backpressure

If partner slows:

```text
queue grows
```

Monitor:

```text
oldest pending age
backlog size
throughput
```

---

# 3512 — Dead Letter Queue

After retry exhaustion:

```text
move integration command/event to DLQ
```

Include:

```text
business reference
integration code
failure category
attempt count
```

---

# 3513 — DLQ Replay

Replay must preserve:

```text
original business reference
idempotency key
correlation ID
```

Do not create a brand-new external transaction accidentally.

---

# 3514 — Inbound Webhook

External partner sends:

```text
HTTP callback
```

Integration receives and validates.

---

# 3515 — Webhook Endpoint

Example:

```text
POST /api/v1/integrations/{partner}/webhooks/{type}
```

or partner-specific paths.

---

# 3516 — Webhook Authentication

Possible:

```text
HMAC signature
RSA signature
mTLS
API key
OAuth token
provider certificate
```

Use partner contract.

---

# 3517 — Webhook Replay Protection

Validate:

```text
timestamp
nonce
event ID
signature
```

Store dedupe key.

---

# 3518 — Webhook Idempotency

Same external event:

```text
process once
```

but return provider-compatible success for duplicates if appropriate.

---

# 3519 — Webhook Receipt Table

Possible:

```text
integration_webhooks
--------------------
id
partner
webhook_type
provider_event_id
payload_hash
verification_status
processing_status
received_at
processed_at
error_code
```

---

# 3520 — Webhook Processing Pattern

```text
Receive
      ↓
Authenticate
      ↓
Validate schema
      ↓
Deduplicate
      ↓
Persist receipt
      ↓
Return fast 2xx if async model
      ↓
Process/map
      ↓
Publish canonical event/command
```

---

# 3521 — Fast Acknowledge

If partner requires short response:

```text
persist durable receipt
return 2xx
process asynchronously
```

Do not perform slow downstream workflow before acknowledging unless contract requires it.

---

# 3522 — Invalid Webhook

For invalid signature:

```text
reject
audit
metric
```

Do not process payload.

---

# 3523 — Unknown Webhook Reference

If external reference cannot be mapped:

```text
quarantine
reconcile
alert if important
```

Do not create arbitrary core entity.

---

# 3524 — Out-of-Order Webhooks

Example:

```text
DELIVERED
then
DRIVER_ARRIVED
```

Map to canonical event with:

```text
occurred_at
provider sequence if available
```

Core state machine decides valid transition.

---

# 3525 — Duplicate Webhook

Same provider event twice:

```text
dedupe
return expected provider acknowledgment
```

---

# 3526 — Webhook Schema Version

Support:

```text
provider version
event version
```

Adapter may route by version.

---

# 3527 — Inbound Event Translation

Example:

```text
Provider payload:
{
  "state": "COLLECTED"
}

Canonical:
DeliveryStatusChanged {
  status = IN_TRANSIT
}
```

---

# 3528 — Canonical Event Ownership

Integration may publish:

```text
ExternalDeliveryStatusReceived
```

or:

```text
CanonicalDeliveryStatusChanged
```

depending domain design.

Do not impersonate another service's owned event improperly.

---

# 3529 — Event Ownership Rule

If Integration is only translator:

```text
publish an integration fact
```

then owning domain validates and emits its own domain event.

Example:

```text
Integration:
DeliveryPartnerStatusReceived

Order/Delivery:
OrderDeliveryStarted
```

---

# 3530 — Avoid Event Forgery

Integration must not publish:

```text
PaymentCaptured
OrderCompleted
WalletTopUpCompleted
```

unless it is explicitly the owning source of that fact.

---

# 3531 — Delivery Partner Mapping

External states may include:

```text
DRIVER_ALLOCATED
DRIVER_ARRIVED
COLLECTED
DELIVERED
COMPLETED
BILL_PAID
REFUNDED
CANCELLED
```

Map to canonical integration events, not directly mutate order tables.

---

# 3532 — Delivery Partner Example

```text
COLLECTED
      ↓
DeliveryPartnerStatusReceived(COLLECTED)
      ↓
Order/Delivery policy
      ↓
DELIVERING
```

---

# 3533 — Payment Partner Mapping

Provider statuses:

```text
APPROVED
PAID
SUCCESS
DECLINED
VOIDED
REFUNDED
```

map inside Payment adapter.

If Payment Service already owns provider adapter, do not duplicate here.

---

# 3534 — Integration Placement Rule

Ask:

```text
Who owns the external relationship?
```

If only Payment uses bank provider:

```text
adapter belongs inside Payment
```

If many domains use shared legacy/ERP integration:

```text
dedicated integration-service may be justified
```

---

# 3535 — Top-Up Partner Integration

Canonical providers may include:

```text
CELLCARD
SMART
other pinless top-up
```

Integration maps provider-specific:

```text
transaction ID
phone
amount
response code
```

into canonical top-up result.

---

# 3536 — Top-Up Flow

Example:

```text
Client / Wallet
      ↓
Top-Up request
      ↓
Provider adapter
      ↓
Provider success
      ↓
Canonical TopUpConfirmed
      ↓
Wallet credit
      ↓
Legacy/ERP sync asynchronously
```

---

# 3537 — Top-Up External References

Possible:

```text
provider transaction id
internal transaction id
ERP document number
receipt ID
```

Store all as separate fields.

Do not overload one column.

---

# 3538 — Top-Up Legacy Sync

If legacy SQL Server requires insert/update after provider success:

```text
Wallet/Payment result
      ↓
Integration outbox/consumer
      ↓
legacy procedure/table
```

Keep non-critical legacy synchronization outside user-facing success path when business allows.

---

# 3539 — Legacy Duplicate Detection

Example:

```text
look back by transaction reference
```

must be documented as temporary legacy rule.

Prefer exact unique reference when possible.

---

# 3540 — ERP Top-Up Mapping

Example conceptual mapping:

```text
internal_txn_id
→ documentNo

store_code
→ storeNo

terminal_code
→ pOSTerminalNo

business reason
→ reasonCode
```

Provider-specific names remain in adapter.

---

# 3541 — Legacy Member Integration

If legacy membership system remains source temporarily:

```text
member lookup
card validation
transaction sync
```

must pass through ACL.

---

# 3542 — Member Card Mapping

Canonical:

```text
customer_id
member_id
card_number
```

Legacy may use:

```text
IC member IDs
receipt username
card no
```

Map explicitly.

---

# 3543 — Guest Mapping

Do not encode guest as:

```text
fake phone
fake card number
```

inside new canonical domain.

Legacy adapter may translate canonical guest identity into required sentinel only at boundary.

---

# 3544 — Legacy Sentinel Guest

Example:

```text
canonical:
guest = true

adapter:
memberCardNo = "GUEST"
phone = "99999999"
```

This prevents sentinel leakage into core logic.

---

# 3545 — Data Synchronization Types

Possible:

```text
real-time request/response
event-driven near-real-time
scheduled batch
CDC
file import/export
manual reconciliation
```

Choose per use case.

---

# 3546 — Sync vs Async Integration

Synchronous when:

```text
caller needs immediate answer
business decision depends on response
```

Asynchronous when:

```text
secondary synchronization
notification
reporting
legacy mirror
analytics
```

---

# 3547 — Example Critical Sync

```text
Payment authorization
Inventory reservation
```

need immediate outcome.

---

# 3548 — Example Secondary Async

```text
legacy reporting copy
ERP posting
analytics
notification
```

can usually be eventual.

---

# 3549 — Data Synchronization Ownership

For each integration define:

```text
source of truth
destination
direction
frequency
latency target
conflict policy
```

---

# 3550 — Synchronization Matrix

Example:

| Data | Source | Destination | Mode |
|---|---|---|---|
| Orders | Order Service | Legacy reporting | Async |
| Top-Up | Wallet/Payment | ERP | Async |
| Store reference | ERP/Store master | Platform | Scheduled/event |
| Delivery status | Partner | Order/Delivery | Webhook |
| Payment state | Provider | Payment | API + webhook |

---

# 3551 — Bi-Directional Sync Warning

Avoid:

```text
system A updates B
B updates A
```

without conflict ownership.

Bi-directional sync easily creates loops.

---

# 3552 — Source of Truth

Every synchronized field requires one authoritative owner.

Example:

```text
Order status → Order Service
Payment provider state → Payment Service/provider
Wallet balance → Wallet Service
```

---

# 3553 — Conflict Policy

If source and destination disagree:

```text
source-of-truth wins
```

unless reconciliation requires manual investigation.

Do not use:

```text
latest timestamp wins
```

for financial/business state without justification.

---

# 3554 — Change Data Capture

CDC may be used temporarily for legacy migration.

Example:

```text
legacy DB
  ↓ CDC
Kafka
  ↓
new platform projection
```

---

# 3555 — CDC Warning

CDC captures:

```text
database changes
```

not necessarily:

```text
business events
```

Do not treat every row update as a domain event.

---

# 3556 — CDC Mapping

ACL converts:

```text
row-level change
```

into a meaningful canonical migration/sync record where possible.

---

# 3557 — Polling

When webhook/CDC unavailable:

```text
poll external system
```

using:

```text
updated_since
cursor
watermark
```

---

# 3558 — Polling Watermark

Persist:

```text
last_successful_cursor
last_successful_timestamp
```

Do not rely only on in-memory state.

---

# 3559 — Polling Overlap

Use a small overlap window to avoid missing boundary records.

Deduplicate by stable external ID.

---

# 3560 — Batch Import

Pattern:

```text
receive batch
      ↓
validate
      ↓
stage
      ↓
dedupe
      ↓
map
      ↓
process
      ↓
reconcile
```

---

# 3561 — Staging Table

Possible:

```text
integration_import_rows
```

with:

```text
batch_id
row_number
raw_hash
status
error_code
external_reference
```

---

# 3562 — Quarantine

Invalid data goes to:

```text
QUARANTINED
```

with reason.

Do not drop silently.

---

# 3563 — Data Quality Validation

Check:

```text
required field
type
enum
reference mapping
amount
currency
date
duplicate
```

---

# 3564 — Partial Batch Failure

Policy options:

```text
all-or-nothing
row-by-row
chunk transaction
```

Choose based on business.

For large migration imports:

```text
row/chunk isolation
```

is usually practical.

---

# 3565 — Integration Configuration

Store non-secret config such as:

```text
base URL
timeout
enabled
partner code
timezone
feature flags
rate limit
```

Secrets stay external.

---

# 3566 — Per-Environment Config

DEV/UAT/PROD must have separate:

```text
endpoint
credentials
webhook secrets
client IDs
certificates
```

Never reuse production secrets in lower environments.

---

# 3567 — Integration Enable/Disable

Feature flag:

```text
integration.enabled
```

may disable outbound activity during incident.

But incoming durable events should be preserved where possible.

---

# 3568 — Partner Maintenance Mode

Possible operational state:

```text
ACTIVE
DEGRADED
DISABLED
MAINTENANCE
```

Routing/workers respond accordingly.

---

# 3569 — Secrets

Use:

```text
Vault
AWS/GCP/Azure secret manager
Kubernetes external secrets
```

not:

```text
Git
database plaintext
hard-coded config
```

---

# 3570 — Key Rotation

Support:

```text
multiple active verification keys
kid/key version
grace period
```

where partner signatures require it.

---

# 3571 — Certificate Rotation

mTLS integrations need:

```text
certificate expiry monitoring
rotation runbook
overlap period
```

---

# 3572 — Integration Database Overview

Possible tables:

```text
integration_requests
integration_attempts
integration_webhooks
external_reference_mappings
integration_import_batches
integration_import_rows
integration_polling_state
integration_reconciliation_runs
integration_reconciliation_mismatches
integration_idempotency
processed_events
outbox_events
```

Not every integration needs every table.

---

# 3573 — Integration Idempotency Table

```text
integration_idempotency
-----------------------
id
integration_code
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

# 3574 — Processed Events

For outbound event-driven integration:

```text
processed_events
```

prevents duplicate external calls from Kafka replay.

---

# 3575 — Outbox

Integration may publish canonical:

```text
PartnerStatusReceived
LegacySyncCompleted
TopUpLegacySyncCompleted
IntegrationFailed
```

only if consumers need them.

---

# 3576 — Integration Request Transaction

```text
BEGIN

claim idempotency
insert integration request
insert outbox/queue work
complete idempotency

COMMIT
```

Worker executes external side effect later.

---

# 3577 — Synchronous Integration Transaction

For direct request:

```text
validate
create stable request/reference
commit local intent if needed
call partner
persist result
```

Never hold unrelated domain DB locks during network calls.

---

# 3578 — External Call Correlation

Send where supported:

```text
X-Correlation-Id
X-Request-Id
merchant reference
```

Store partner response reference.

---

# 3579 — Correlation ID

Preserve end-to-end:

```text
Gateway
→ Order
→ Integration
→ Partner
```

and back through callbacks.

---

# 3580 — Error Taxonomy

Canonical integration errors:

```text
INTEGRATION_TIMEOUT
INTEGRATION_UNAVAILABLE
INTEGRATION_AUTH_FAILED
INTEGRATION_RATE_LIMITED
INTEGRATION_INVALID_REQUEST
INTEGRATION_BUSINESS_REJECTED
INTEGRATION_UNKNOWN_OUTCOME
INTEGRATION_MAPPING_FAILED
INTEGRATION_REFERENCE_NOT_FOUND
INTEGRATION_DUPLICATE
INTEGRATION_SCHEMA_UNSUPPORTED
```

---

# 3581 — Provider Error Mapping

Partner code:

```text
ERR_12
```

maps to:

```text
INTEGRATION_BUSINESS_REJECTED
```

with safe metadata.

Core service should not depend on raw code.

---

# 3582 — Error Metadata

Return/store:

```text
canonical_error
retryable
provider_code_safe
provider_reference
```

Avoid leaking secret/raw payload.

---

# 3583 — Integration REST API

Admin/internal examples:

```text
GET  /api/v1/admin/integrations/status
GET  /api/v1/admin/integrations/requests
GET  /api/v1/admin/integrations/requests/{id}
POST /api/v1/admin/integrations/requests/{id}/retry
GET  /api/v1/admin/integrations/reconciliation
```

---

# 3584 — Partner Webhook API

Partner-specific endpoints should be:

```text
authenticated
versioned
rate-limited
logged safely
```

---

# 3585 — Internal gRPC Contract

Possible:

```proto
service IntegrationGateway {
  rpc SubmitLegacyOrderSync(...)
      returns (...);

  rpc SubmitTopUpSync(...)
      returns (...);

  rpc GetExternalReference(...)
      returns (...);
}
```

Avoid one generic untyped "send anything" API.

---

# 3586 — Typed Integration Contracts

Prefer:

```text
SyncTopUpToERP
MapLegacyCustomer
SubmitDeliveryOrder
CancelDeliveryOrder
```

over:

```text
POST /integration/execute
```

---

# 3587 — Integration Event Contracts

Events include:

```text
integration_code
business_reference
external_reference
result
occurred_at
```

but avoid raw provider payload.

---

# 3588 — Integration Security

Primary risks:

```text
credential leakage
webhook spoofing
SSRF
request injection
XML attacks
unsafe deserialization
partner data leakage
replay
```

---

# 3589 — SSRF Protection

If integration supports configurable URLs:

```text
allowlist domains
validate scheme
block metadata/private network access where not required
```

Do not let arbitrary user input choose destination URL.

---

# 3590 — XML Security

For XML/SOAP:

```text
disable external entity resolution
limit payload size
validate schema
```

protect against XXE.

---

# 3591 — JSON Deserialization

Use strict DTOs.

Reject:

```text
unexpected polymorphic types
oversized arrays
unknown dangerous structures
```

---

# 3592 — Request Size Limit

Set per integration.

Avoid accepting unbounded webhook/file payloads.

---

# 3593 — Partner IP Allowlist

Can be defense-in-depth.

Do not use IP allowlist as sole webhook authentication.

---

# 3594 — Webhook Secret Rotation

Support:

```text
current secret
previous secret during rotation window
```

then retire old.

---

# 3595 — Rate-Limit Webhooks

Protect against:

```text
abuse
provider retry storms
```

without accidentally blocking legitimate provider retries.

---

# 3596 — Integration Audit

Audit:

```text
credential/config changes
manual retry
manual replay
reference remap
manual reconciliation resolution
integration enable/disable
```

---

# 3597 — Manual Retry

Admin retry must preserve:

```text
original idempotency key
business reference
```

unless a new business operation is intentionally created.

---

# 3598 — Manual Replay

Webhook replay from stored payload is high-risk.

Require:

```text
permission
audit
duplicate awareness
preview of current status
```

---

# 3599 — Reference Remap

Changing:

```text
external_id → internal_id
```

must be restricted and audited.

---

# 3600 — Integration Reconciliation

Reconciliation compares:

```text
internal source of truth
integration request history
external provider truth
```

---

# 3601 — Reconciliation Types

Examples:

```text
Order vs delivery provider
Payment vs bank/provider
Wallet top-up vs ERP
Legacy member sync
Coupon sync
External file import
```

---

# 3602 — Reconciliation Keys

Use:

```text
business reference
external reference
amount
currency
status
business date
```

depending integration.

---

# 3603 — Reconciliation Mismatch Types

Examples:

```text
MISSING_EXTERNAL_RECORD
MISSING_INTERNAL_RECORD
STATUS_MISMATCH
AMOUNT_MISMATCH
CURRENCY_MISMATCH
DUPLICATE_EXTERNAL_RECORD
REFERENCE_MISMATCH
```

---

# 3604 — Reconciliation Workflow

```text
Start run
      ↓
fetch internal set
      ↓
fetch external set
      ↓
match
      ↓
compare
      ↓
record mismatch
      ↓
auto-resolve only safe known cases
      ↓
manual escalation
```

---

# 3605 — No Silent Integration Repair

Do not hide discrepancy by directly updating whichever side is convenient.

Use:

```text
source-of-truth rule
controlled replay
corrective command
audit
```

---

# 3606 — Reconciliation Run Table

```text
integration_reconciliation_runs
-------------------------------
id
integration_code
scope
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 3607 — Reconciliation Mismatch Table

```text
integration_reconciliation_mismatches
-------------------------------------
id
run_id
integration_code
business_reference
external_reference
mismatch_type
expected_value
actual_value
status
detected_at
resolved_at
resolution_note
```

---

# 3608 — Integration Metrics

Operational:

```text
integration_request_total
integration_success_total
integration_failure_total
integration_retry_total
integration_unknown_total
integration_latency
integration_backlog
```

Inbound:

```text
webhook_received_total
webhook_invalid_signature_total
webhook_duplicate_total
webhook_processing_failure_total
```

Reconciliation:

```text
integration_reconciliation_mismatch_total
```

---

# 3609 — Integration SLIs

Potential:

```text
P95 partner latency
outbound success rate
webhook processing success rate
backlog age
unknown-outcome resolution time
reconciliation health
```

---

# 3610 — Provider-Specific Metrics

Label only bounded dimensions:

```text
integration_code
operation
result
```

Do not use:

```text
external transaction ID
```

as metric label.

---

# 3611 — Alerts

Alert on:

```text
auth failure
timeout spike
unknown-outcome spike
backlog age
webhook signature failures
reconciliation mismatch
poller stalled
certificate expiry
secret expiry
```

---

# 3612 — Dashboard

Show:

```text
requests/min
success/failure
latency
retry rate
unknown outcomes
webhooks
backlog
polling watermark age
reconciliation mismatch
```

---

# 3613 — Structured Logging

Safe fields:

```text
integration_code
operation
business_reference
external_reference masked/safe
status
attempt
error_category
correlation_id
request_id
```

Avoid:

```text
API key
secret
full card data
OTP
private key
raw sensitive payload
```

---

# 3614 — Distributed Tracing

Trace:

```text
Core Service
  ↓
Integration Port
  ↓
Adapter
  ↓
External HTTP/SOAP/SQL
```

Record:

```text
integration code
operation
result
latency
```

---

# 3615 — Raw Payload Logging

Default:

```text
disabled
```

For debugging:

```text
redacted
restricted
short retention
```

---

# 3616 — Failure Mode: External API Down

Behavior:

```text
synchronous critical call → fail safely
async sync → queue/retry
```

Do not block unrelated platform capabilities.

---

# 3617 — Failure Mode: Legacy DB Down

New core system should continue for capabilities that do not require legacy.

Secondary sync queues backlog.

---

# 3618 — Failure Mode: Kafka Down

Outbound sync events remain in source outbox.

Integration consumers recover later.

---

# 3619 — Failure Mode: PostgreSQL Integration DB Down

Do not execute non-idempotent external side effect if durable request/dedupe cannot be persisted safely.

---

# 3620 — Failure Mode: Partner Auth Expired

Mark integration:

```text
DEGRADED / UNAVAILABLE
```

stop hot retries
alert
rotate credential
resume safely.

---

# 3621 — Failure Mode: Mapping Missing

Example:

```text
store mapping not found
```

Result:

```text
INTEGRATION_REFERENCE_NOT_FOUND
```

Quarantine/retry after mapping is fixed.

---

# 3622 — Failure Mode: Schema Change

Partner adds/removes fields.

Adapter should:

```text
tolerate additive compatible fields
reject breaking required-field changes
alert
```

---

# 3623 — Contract Versioning

Maintain partner-specific:

```text
v1
v2
```

adapters if necessary.

Do not rewrite old webhook history.

---

# 3624 — Integration Runbooks

Required:

```text
Partner outage
Partner authentication failure
Webhook signature failure
Webhook replay storm
Legacy DB outage
Unknown outcome
Mapping missing
Reconciliation mismatch
Polling stalled
Certificate expiry
DLQ backlog
```

---

# 3625 — Partner Outage Runbook

```text
identify affected operations
open circuit / pause workers if needed
preserve durable requests
monitor backlog
communicate impact
resume with bounded throughput
reconcile after recovery
```

---

# 3626 — Unknown Outcome Runbook

```text
stop blind retry
query provider by reference
check webhook history
check reconciliation data
resolve canonical status
document resolution
```

---

# 3627 — Mapping Missing Runbook

```text
identify external reference
find correct internal entity
add mapping through controlled admin process
replay quarantined request
```

---

# 3628 — Webhook Attack Runbook

If signature failures spike:

```text
rate limit
inspect source
verify secret/key validity
block abusive source if appropriate
do not weaken signature validation
```

---

# 3629 — Integration Backup

Back up:

```text
reference mappings
integration requests
attempts
webhook receipts
polling state
reconciliation
idempotency
processed events
outbox
```

---

# 3630 — Restore

After restore:

```text
do not blindly resend all pending requests
resolve SENDING/UNKNOWN
reconcile provider truth
restore polling watermarks carefully
rebuild caches
repair outbox
```

---

# 3631 — Restore Risk

Old restore may:

```text
repeat external side effect
lose provider reference
rewind polling cursor
reprocess webhook
duplicate ERP posting
```

Recovery must use idempotency and reconciliation.

---

# 3632 — Disaster Recovery

Define:

```text
RPO
RTO
provider reference recovery
webhook replay
poller watermark recovery
external state reconciliation
secret/certificate recovery
```

---

# 3633 — Flyway Migration Plan

Example:

```text
V1__create_integration_requests.sql
V2__create_integration_attempts.sql
V3__create_webhook_receipts.sql
V4__create_external_reference_mappings.sql
V5__create_import_batches.sql
V6__create_import_rows.sql
V7__create_polling_state.sql
V8__create_integration_idempotency.sql
V9__create_processed_events.sql
V10__create_reconciliation_tables.sql
V11__create_outbox.sql
```

---

# 3634 — Strangler Migration

Goal:

```text
replace legacy capability gradually
```

not:

```text
big-bang rewrite
```

---

# 3635 — Strangler Flow

Example:

```text
API Gateway
   ├── Old capability → Legacy
   └── New capability → New Service
```

Integration/ACL bridges remaining dependencies.

---

# 3636 — Strangler Step 1: Observe

Document:

```text
legacy inputs
outputs
tables
side effects
statuses
error behavior
```

before replacing.

---

# 3637 — Strangler Step 2: Introduce Canonical Contract

Create:

```text
new domain API/event
```

independent of legacy schema.

---

# 3638 — Strangler Step 3: Build ACL

ACL translates:

```text
canonical request
→ legacy call
```

so callers stop depending on legacy model.

---

# 3639 — Strangler Step 4: Replace Behind Contract

Later:

```text
legacy adapter
```

is swapped for:

```text
new implementation
```

without changing callers.

---

# 3640 — Strangler Step 5: Remove Legacy Dependency

After:

```text
traffic migrated
data reconciled
rollback window closed
```

remove adapter/mapping.

---

# 3641 — Shadow Read

Possible migration technique:

```text
read old system
read new system
compare
return old result
```

until confidence is high.

---

# 3642 — Shadow Write Warning

Writing both systems synchronously is risky.

Prefer:

```text
one authoritative write
+
async replication
```

---

# 3643 — Dual Read

During migration:

```text
new first
fallback legacy
```

may be used temporarily.

Track which source answered.

---

# 3644 — Cutover Flag

Feature flag may route:

```text
legacy
new
```

by:

```text
customer
store
channel
percentage
```

---

# 3645 — Canary Migration

Start with:

```text
internal users
one store
small customer percentage
```

then expand.

---

# 3646 — Rollback

Rollback must not create split-brain authority.

Define:

```text
which writes happened where
how to reconcile
which traffic can safely return
```

---

# 3647 — Legacy Decommission Criteria

Before removing:

```text
no production traffic
no required reporting dependency
data archived
reconciliation complete
rollback window closed
credentials revoked
```

---

# 3648 — Integration Clean Architecture

Recommended:

```text
integration-service/
│
├── domain/
│   ├── reference/
│   ├── request/
│   ├── webhook/
│   ├── reconciliation/
│   └── exception/
│
├── application/
│   ├── outbound/
│   ├── inbound/
│   ├── mapping/
│   ├── polling/
│   ├── import/
│   ├── reconciliation/
│   └── admin/
│
├── adapter/in/
│   ├── rest/
│   ├── webhook/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── legacy/
│   ├── partner/
│   ├── sqlserver/
│   ├── odata/
│   ├── soap/
│   ├── sftp/
│   ├── persistence/
│   └── kafka/
│
└── config/
```

---

# 3649 — Input Ports

Examples:

```text
SubmitIntegrationRequestUseCase
ProcessWebhookUseCase
MapExternalReferenceUseCase
RunPollerUseCase
ImportBatchUseCase
RetryIntegrationUseCase
ReconcileIntegrationUseCase
```

---

# 3650 — Output Ports

Examples:

```text
PartnerPort
LegacyDatabasePort
ERPPort
SftpPort
ReferenceMappingPort
IntegrationRequestPort
WebhookReceiptPort
ReconciliationPort
OutboxPort
ClockPort
```

---

# 3651 — Adapter Naming

Prefer:

```text
GrabDeliveryAdapter
BusinessCentralAdapter
LegacyMemberSqlServerAdapter
SmartTopUpAdapter
CellcardTopUpAdapter
```

over:

```text
ExternalService1
ExternalService2
```

---

# 3652 — Integration Package Isolation

Provider SDK/library belongs only in:

```text
adapter/out/provider
```

Domain/application layers depend on ports.

---

# 3653 — Integration Configuration Object

Typed config example:

```text
endpoint
connectTimeout
readTimeout
maxRetries
enabled
timezone
rateLimit
```

Validate on startup.

---

# 3654 — Startup Validation

Fail fast if required integration has invalid:

```text
URL
credentials reference
timeout
certificate
mapping configuration
```

Optional integration may start disabled with alert.

---

# 3655 — Health Checks

Separate:

```text
liveness
readiness
dependency health
```

Do not make Kubernetes liveness depend on external partner.

---

# 3656 — Readiness and Critical Partner

If service cannot perform any useful operation without a critical partner:

```text
readiness may consider dependency state carefully
```

But avoid cascading pod restarts.

---

# 3657 — Partner Health Endpoint

Internal/admin:

```text
GET /admin/integrations/{code}/health
```

should expose:

```text
last success
last failure
latency
circuit state
backlog
```

not secrets.

---

# 3658 — Integration Documentation Template

For every partner document:

```text
Purpose
Owner
Environment URLs
Authentication
Operations
Canonical mapping
Timeouts
Retries
Idempotency
Webhook verification
Status mapping
Error mapping
Rate limits
Reconciliation
Runbook
Contacts
```

---

# 3659 — Mapping Documentation

Include tables:

```text
External Field
Canonical Field
Transformation
Required?
Notes
```

---

# 3660 — Status Mapping Documentation

Include:

```text
External status
Canonical integration status
Domain action
Retry?
Terminal?
```

---

# 3661 — Error Mapping Documentation

Include:

```text
Provider code
Meaning
Canonical error
Retryable?
Customer-visible?
Operational action
```

---

# 3662 — Security Documentation

Include:

```text
credential type
secret location
rotation
webhook signature
certificate
IP allowlist
data classification
```

---

# 3663 — Testing Strategy

Test:

```text
Mapping
Contract
Adapter
Webhook
Idempotency
Retry
Timeout
Unknown outcome
Polling
Batch import
Reconciliation
Security
Load
Migration
Failure
```

---

# 3664 — Mapper Tests

Test:

```text
normal mapping
missing optional
missing required
enum unknown
date/time conversion
money conversion
sentinel values
```

---

# 3665 — Status Mapping Tests

Every known external status must have explicit expected canonical result.

Unknown status:

```text
quarantine / unsupported
```

not silent default.

---

# 3666 — Adapter Contract Tests

Against sandbox/mock:

```text
authentication
headers
request body
response mapping
error mapping
timeout
rate limit
```

---

# 3667 — Webhook Tests

Test:

```text
valid signature
invalid signature
duplicate event
old timestamp
unknown reference
out-of-order event
unsupported version
```

---

# 3668 — Idempotency Tests

For outbound side effect:

```text
same business reference
same request retry
concurrent retry
response lost
manual retry
```

Verify one external effect where provider capability allows.

---

# 3669 — Unknown Outcome Tests

Simulate:

```text
provider committed
network response lost
```

Verify:

```text
UNKNOWN
status lookup/reconciliation
no blind duplicate
```

---

# 3670 — Retry Tests

Test:

```text
429
503
timeout
business rejection
auth failure
max attempts
backoff
jitter bounds
```

---

# 3671 — Circuit Breaker Tests

Test:

```text
open
half-open
recovery
```

and ensure unrelated integrations remain healthy.

---

# 3672 — Poller Tests

Test:

```text
watermark persistence
overlap
duplicate records
empty page
pagination
partial failure
restart
```

---

# 3673 — Batch Import Tests

Test:

```text
valid batch
duplicate file
duplicate row
invalid row
partial failure
quarantine
replay
```

---

# 3674 — Reference Mapping Tests

Test:

```text
found
missing
duplicate external mapping
remap rejected
```

---

# 3675 — Reconciliation Tests

Create:

```text
missing external
missing internal
status mismatch
amount mismatch
duplicate external
```

Verify detection.

---

# 3676 — Strangler Tests

Test:

```text
legacy route
new route
canary user/store
fallback
rollback
```

---

# 3677 — Load Tests

Scenarios:

```text
webhook burst
partner slow response
large sync backlog
batch import
polling large dataset
```

---

# 3678 — Webhook Burst Test

Thousands of callbacks:

```text
verify fast durable acknowledgment
dedupe
consumer throughput
DB indexing
```

---

# 3679 — Slow Partner Test

Simulate:

```text
high latency
timeouts
429
```

Verify:

```text
bulkhead
queue
backpressure
no thread exhaustion
```

---

# 3680 — Security Tests

Verify:

```text
invalid webhook signature rejected
secret absent from logs
SSRF blocked
XXE blocked
untrusted URL blocked
admin retry permission
reference remap audited
```

---

# 3681 — Definition of Done: Outbound Integration

- [ ] Canonical contract.
- [ ] Adapter isolated.
- [ ] Authentication.
- [ ] Timeout.
- [ ] Retry policy.
- [ ] Idempotency.
- [ ] Unknown outcome strategy.
- [ ] Error mapping.
- [ ] Metrics/tracing.
- [ ] Reconciliation.
- [ ] Tests.
- [ ] Runbook.

---

# 3682 — Definition of Done: Webhook

- [ ] Authentication/signature.
- [ ] Replay protection.
- [ ] Schema validation.
- [ ] Deduplication.
- [ ] Durable receipt.
- [ ] Canonical mapping.
- [ ] Fast acknowledgment if required.
- [ ] Retry/DLQ.
- [ ] Metrics.
- [ ] Tests.

---

# 3683 — Definition of Done: Legacy Adapter

- [ ] Legacy schema documented.
- [ ] Canonical model defined.
- [ ] Sentinel values contained.
- [ ] Read/write ownership explicit.
- [ ] Mapping tests.
- [ ] Load impact reviewed.
- [ ] Removal plan documented.

---

# 3684 — Integration Review Checklist

## Boundary

- [ ] External model contained.
- [ ] Core domain uses canonical language.
- [ ] No direct legacy DB access from domain services.
- [ ] Ownership clear.

## Reliability

- [ ] Timeout.
- [ ] Retry.
- [ ] Idempotency.
- [ ] Unknown outcome.
- [ ] Circuit breaker.
- [ ] Backpressure.
- [ ] DLQ.

## Data

- [ ] Mapping.
- [ ] Reference mapping.
- [ ] Timezone.
- [ ] Money.
- [ ] Sentinel values.
- [ ] Reconciliation.

---

# 3685 — Data Review Checklist

- [ ] Stable external references.
- [ ] Unique mappings.
- [ ] Request/attempt history.
- [ ] Webhook dedupe.
- [ ] Polling watermark durable.
- [ ] Batch import history.
- [ ] Reconciliation tables.
- [ ] Retention defined.

---

# 3686 — Contract Review Checklist

- [ ] Canonical input/output.
- [ ] External DTO isolated.
- [ ] Status mapping.
- [ ] Error mapping.
- [ ] Versioning.
- [ ] Idempotency key.
- [ ] Correlation ID.
- [ ] Timeouts/deadlines.
- [ ] Unknown outcome semantics.

---

# 3687 — Security Review Checklist

- [ ] Secrets externalized.
- [ ] TLS validation.
- [ ] Webhook signature.
- [ ] Replay protection.
- [ ] SSRF protection.
- [ ] XML security.
- [ ] Payload limits.
- [ ] Admin replay/retry RBAC.
- [ ] Sensitive logging redacted.

---

# 3688 — Operations Review Checklist

- [ ] Partner health metrics.
- [ ] Backlog.
- [ ] Retry.
- [ ] Unknown outcome.
- [ ] DLQ.
- [ ] Poller watermark.
- [ ] Reconciliation.
- [ ] Certificate expiry.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 3689 — Production Readiness Checklist

Before production:

- [ ] Sandbox contract tests pass.
- [ ] Authentication tested.
- [ ] Timeout tested.
- [ ] Retry tested.
- [ ] Unknown-outcome test passes.
- [ ] Duplicate webhook test passes.
- [ ] Out-of-order webhook test passes.
- [ ] Mapping coverage complete.
- [ ] Missing-reference handling tested.
- [ ] Reconciliation tested.
- [ ] Partner outage tested.
- [ ] Secret rotation tested.
- [ ] Certificate rotation plan exists.
- [ ] Load/backpressure test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 3690 — Initial Implementation Order

Recommended:

```text
1. Integration module boundaries
2. Canonical contracts
3. External reference mapping
4. Shared HTTP client standards
5. Timeout/retry/error taxonomy
6. First partner adapter
7. Idempotency
8. Webhook receipt/dedupe
9. Outbound request persistence
10. Unknown-outcome recovery
11. Reconciliation
12. Legacy DB adapter
13. ERP sync
14. Polling framework
15. Batch import
16. Strangler routing support
17. Admin operations
18. Metrics/alerts
```

---

# 3691 — Minimum Viable Integration Layer

First production-capable version:

```text
Canonical contracts
Provider/legacy adapters
Reference mapping
Timeouts
Retry
Idempotency
Webhook verification
Webhook dedupe
Error/status mapping
Unknown outcome handling
Reconciliation
Observability
```

For legacy migration additionally:

```text
read-only legacy adapters
strangler routing
explicit source-of-truth
removal plan
```

---

# 3692 — Future Enhancements

Potential:

```text
Integration configuration portal
Partner onboarding toolkit
Schema registry for partner contracts
Generic SFTP framework
Integration replay console
Automated mapping validation
Contract drift detection
Multi-region integration workers
```

---

# 3693 — PART 20 Deliverables

PART 20 produces:

1. Integration / ACL responsibility definition.
2. Core-domain protection rules.
3. Canonical model strategy.
4. External DTO isolation.
5. Mapping standards.
6. External reference mapping.
7. Store/product/customer/status mapping.
8. Date/time and money normalization.
9. Sentinel-value containment.
10. Protocol translation guidance.
11. REST/OData/SOAP/file/SFTP patterns.
12. Legacy DB access rules.
13. Stored procedure adapter guidance.
14. ERP integration model.
15. Outbound request lifecycle.
16. Request/attempt persistence.
17. Timeout strategy.
18. Retry strategy.
19. Unknown-outcome handling.
20. Circuit breaker/bulkhead/backpressure.
21. DLQ/replay.
22. Webhook authentication.
23. Webhook idempotency.
24. Fast acknowledgment pattern.
25. Out-of-order webhook handling.
26. Event ownership rules.
27. Delivery-partner mapping.
28. Top-up integration model.
29. Guest sentinel isolation.
30. Synchronization modes.
31. Source-of-truth/conflict policy.
32. CDC/polling/batch import.
33. Staging/quarantine.
34. Environment/config/secrets.
35. Database schema.
36. REST/gRPC contracts.
37. Error taxonomy.
38. Security controls.
39. Reconciliation.
40. Metrics/SLIs.
41. Alerts/dashboard.
42. Logging/tracing.
43. Failure modes.
44. Runbooks.
45. Backup/restore.
46. DR.
47. Flyway migrations.
48. Strangler migration.
49. Shadow-read/canary/rollback.
50. Clean Architecture layout.
51. Input/output ports.
52. Integration documentation templates.
53. Testing strategy.
54. Load/security tests.
55. Review checklists.
56. Production readiness.
57. Implementation order.

---

# 3694 — Exit Criteria

PART 20 is complete when the team can answer:

### Boundary

```text
How are external and legacy concepts prevented from leaking into the core domain?
```

### Mapping

```text
Where are identifiers, statuses, timestamps, money, and sentinel values translated?
```

### Outbound Reliability

```text
How do timeouts, retries, idempotency, and unknown outcomes work for partner calls?
```

### Webhooks

```text
How are inbound callbacks authenticated, deduplicated, acknowledged, and translated?
```

### Ownership

```text
Which system owns each synchronized business fact?
```

### Reconciliation

```text
How are mismatches between external and internal state detected and resolved?
```

### Legacy Migration

```text
How can a legacy capability be replaced without forcing new services to depend on the legacy schema?
```

### Security

```text
How are partner secrets, signatures, certificates, payloads, and network destinations protected?
```

### Recovery

```text
How does the system avoid duplicate external side effects after crash, restore, or replay?
```

If these answers are clear and tested, the Integration / ACL layer is ready for implementation.

---

# 3695 — Handoff to PART 21

PART 21 defines Service Communication.

```text
PART 20
Integration / ACL
      ↓
Canonical External Boundary
      ↓
PART 21
Service Communication
```

PART 21 will define:

```text
Synchronous Communication
Asynchronous Communication
REST vs gRPC
Kafka
Commands
Queries
Events
Timeouts
Retries
Circuit Breakers
Bulkheads
Service Discovery
Correlation IDs
Deadlines
Backpressure
Contract Ownership
Failure Propagation
Call Budgets
```

The key separation is:

```text
PART 20
= communication with external/legacy systems

PART 21
= communication between platform services
```

---

# PART 20 — Summary

The Integration / Anti-Corruption Layer protects the platform from external complexity.

Core outbound flow:

```text
Core Canonical Request
      ↓
Integration Port
      ↓
Provider Adapter
      ↓
External System
      ↓
Canonical Result
```

Core inbound flow:

```text
External Webhook
      ↓
Authenticate
      ↓
Deduplicate
      ↓
Map
      ↓
Canonical Integration Fact
      ↓
Owning Domain
```

Migration flow:

```text
New Canonical Contract
      ↓
Legacy ACL
      ↓
Legacy System
      ↓
Gradual Replacement
      ↓
Remove ACL
```

The most important architecture rules are:

```text
External models do not leak into core domains.
Canonical language belongs to the platform.
Provider-specific code remains inside adapters.
Every external side effect uses stable references and idempotency.
Timeout does not always mean failure.
Unknown outcomes are explicitly reconciled.
Webhooks are authenticated and deduplicated.
Source-of-truth ownership is explicit.
Legacy DB access is isolated and temporary.
CDC is not automatically a domain-event stream.
Strangler migration replaces implementation behind stable contracts.
Integration discrepancies are reconciled, not hidden.
```

The next chapter defines how the platform's own services communicate reliably:

```text
PART 21 — Service Communication
```

---

**End of PART 20 — Integration / Anti-Corruption Layer**
