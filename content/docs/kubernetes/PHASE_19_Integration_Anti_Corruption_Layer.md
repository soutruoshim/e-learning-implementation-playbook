---
title: "PHASE 19 — Integration / Anti-Corruption Layer"
---

# PHASE 19 — Integration / Anti-Corruption Layer

> **Purpose:** Implement the platform Integration / Anti-Corruption Layer (ACL) that isolates the new microservice platform from legacy systems, external partner protocols, provider-specific schemas, sentinel values, transport quirks, and synchronization behavior. This phase defines canonical integration contracts, external DTO isolation, mapping, reference management, REST/OData/SOAP/SQL/SFTP/file adapters, outbound request durability, timeouts, retry, idempotency, unknown-outcome recovery, inbound webhooks, polling, CDC, batch import, ERP/legacy synchronization, strangler migration, reconciliation, security, observability, testing, migration, and production readiness.
>
> **Previous Phase:** Phase 18 — Notification Service
>
> **Next Phase in the Official Implementation Roadmap:** Phase 20 — Redis / Caching
>
> **Architecture Sequence Note:** PART 20 hands architecturally to PART 21 — Service Communication. Service Communication has already been implemented earlier as Phase 13 in the approved implementation roadmap. Therefore this implementation phase hands next to Phase 20 — Redis / Caching.
>
> **Primary Architecture Basis:** PART 20 — Integration / Anti-Corruption Layer, supported by completed phases for Service Communication, Distributed Transactions / Saga, Kafka / Event Architecture, Ordering, Payment, Wallet, Notification, Loyalty, and Mission.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL where persistence is required, Kafka, REST/gRPC, Flyway, HTTP clients, SQL Server adapters, OData/SOAP/SFTP adapters where required.
>
> **Status:** Platform Integration Implementation Specification

---

# 1. Phase 19 Goal

Build a production-capable Integration / ACL boundary that can answer:

```text
How do we communicate with a legacy system?
How do we communicate with an external partner?
How do we translate partner data into canonical platform concepts?
How do we stop external field names/statuses from leaking into core services?
How are outbound partner calls retried safely?
What happens when a timeout may have happened after the side effect?
How are webhooks authenticated and deduplicated?
How are external references mapped?
Which system is source of truth?
How do we reconcile mismatches?
How do we gradually replace legacy capability?
```

---

# 2. Core Principle

```text
External language
      ↓
Integration / ACL
      ↓
Canonical platform language
```

---

# 3. Integration / ACL Ownership

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

---

# 4. Non-Responsibilities

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

---

# 5. Anti-Pattern — Second Business Domain

Integration must not become:

```text
a second Order Service
a second Payment Service
a second Wallet Service
a shared database access layer
a dumping ground for unrelated logic
```

---

# 6. Canonical Language Rule

Legacy/external concepts may include:

```text
tranID
receipt_no
member_card_no
branch_code
documentNo
provider status integers
provider transaction IDs
```

Core domain uses:

```text
order_id
order_number
customer_id
store_id
payment_reference
canonical enums
```

ACL performs translation.

---

# 7. Core Domain Protection

Do not allow:

```text
provider field names
legacy table names
partner status codes
partner authentication quirks
legacy sentinels
```

to spread through domain/application code.

---

# 8. Ubiquitous Language

| Term | Meaning |
|---|---|
| External System | Third-party or legacy system outside core domain |
| Partner | External business/provider integration |
| Adapter | Implementation translating external ↔ canonical contract |
| ACL | Anti-Corruption Layer |
| Canonical Model | Platform-normalized internal representation |
| External Reference | Stable identifier from partner/legacy system |
| Mapping | Translation between external and canonical values |
| Inbound Integration | Data/event received from outside |
| Outbound Integration | Request/data sent outside |
| Reconciliation | Comparison of external and internal state |
| Strangler | Gradual replacement of legacy capability |
| Unknown Outcome | Side effect may have occurred but response is uncertain |
| Polling Watermark | Durable progress marker for polling |
| Quarantine | Isolated invalid/unmappable data awaiting repair |

---

# 9. Integration Categories

Typical:

```text
LEGACY_INTERNAL
PAYMENT_PROVIDER
DELIVERY_PARTNER
POS
ERP
BANKING
TOP_UP_PROVIDER
CRM / MARKETING
IDENTITY_PROVIDER
EMAIL / SMS / PUSH PROVIDER
REPORTING / FINANCE
```

---

# 10. High-Level Outbound Architecture

```text
Core Service
    │
    ▼
Canonical Port
    │
    ▼
Integration / ACL
    │
    ├── Legacy Adapter
    ├── ERP Adapter
    ├── Delivery Adapter
    ├── Top-Up Adapter
    └── Partner Adapter
         │
         ▼
External System
```

---

# 11. High-Level Inbound Architecture

```text
External Webhook / Poll / File
        ↓
Integration / ACL
        ↓
Canonical Integration Fact
        ↓
Owning Domain Service
```

---

# 12. Deployment Option A

Dedicated:

```text
integration-service
```

Use when:

```text
many domains share integration
protocol is complex
legacy DB access must be isolated
credentials/config require centralized operations
translation is substantial
```

---

# 13. Deployment Option B

Adapter inside owning service.

Use when:

```text
integration is narrow
only one domain consumes it
ownership is obvious
```

---

# 14. Placement Rule

Ask:

```text
Who owns the external relationship?
```

If only Payment uses one bank/provider:

```text
Payment owns its adapter
```

If many domains use shared legacy/ERP:

```text
dedicated integration-service may be justified
```

---

# 15. Avoid Central Integration Monolith

Do not place:

```text
every external call
every legacy query
every webhook
every business mapping
```

into one unstructured service.

Organize by bounded integration capability.

---

# 16. Suggested Integration Modules

```text
integration-service/
├── delivery/
├── topup/
├── pos/
├── legacy-order/
├── legacy-member/
├── erp/
├── payment-partner/
├── finance/
└── shared-transport/
```

---

# 17. Module Ownership

Every integration module must define:

```text
business owner
technical owner
external system
canonical contract
source of truth
failure/recovery policy
removal plan if temporary
```

---

# 18. Canonical Integration Model

Examples:

```text
CanonicalStoreReference
CanonicalExternalPaymentResult
CanonicalDeliveryStatus
CanonicalTopUpConfirmation
CanonicalLegacyMemberReference
CanonicalErpPostingResult
```

---

# 19. Canonical Model Rule

Canonical models represent:

```text
platform meaning
```

not:

```text
lowest common denominator of all providers
```

---

# 20. Provider-Specific Metadata

Fields with no canonical meaning remain inside:

```text
adapter DTO
adapter metadata
integration request/attempt record
```

not domain aggregates.

---

# 21. External DTO Isolation

Examples:

```text
GrabOrderStateWebhook
LegacyMemberRow
BusinessCentralTopUpRequest
ProviderPaymentResponse
SmartTopUpResponse
CellcardTopUpResponse
```

External DTOs never enter Domain directly.

---

# 22. Mapping Layer

Example:

```text
GrabOrderStateWebhook
      ↓ mapper
CanonicalDeliveryUpdate
      ↓
Order/Delivery Contract
```

---

# 23. Mapper Responsibilities

```text
field mapping
enum mapping
unit conversion
date/time conversion
identifier normalization
null/default normalization
external reference lookup
```

---

# 24. Mapper Non-Responsibility

Mapper must not hide important business decisions.

---

# 25. Technical vs Business Mapping

Technical:

```text
documentNo
→ external_document_number
```

Business:

```text
partner DELIVERED
→ canonical delivery fact
```

Business mapping requires domain-owner review.

---

# 26. External Reference Mapping

Core table:

```text
external_reference_mappings
```

Possible fields:

```text
id
system_code
entity_type
external_id
internal_id
metadata_json
created_at
updated_at
```

---

# 27. Reference Mapping Uniqueness

```text
UNIQUE(system_code, entity_type, external_id)
```

---

# 28. Reference Mapping Use Cases

Examples:

```text
legacy user ID ↔ customer_id
legacy order ID ↔ order_id
provider transaction ID ↔ payment_id
legacy outlet code ↔ store_id
partner item code ↔ product_id
ERP document number ↔ topup/payment reference
```

---

# 29. Mapping Stability

Once:

```text
external_id → internal_id
```

exists:

```text
do not remap silently
```

---

# 30. Reference Remap

Requires:

```text
restricted permission
audit
reason
old/new mapping
impact review
reconciliation
```

---

# 31. Store Mapping

External may use:

```text
bc_outlet_no
branch_code
store_code
```

Canonical:

```text
store_id
```

---

# 32. Product Mapping

External may use:

```text
partner_item_code
POS item code
legacy menu ID
```

Canonical:

```text
product_id
```

---

# 33. Product Mapping Dimensions

Mapping may include:

```text
partner
store
channel
external item code
internal product_id
```

when partner catalogs vary by store/channel.

---

# 34. Customer Mapping

Legacy may identify customer by:

```text
member_card_no
member_id
phone
```

Do not guess identity.

Use explicit:

```text
legacy_member_id → customer_id
```

---

# 35. Customer Matching Warning

Do not automatically merge customers by:

```text
phone
name
card number
```

without approved identity-matching policy.

---

# 36. Status Mapping

Maintain explicit mapping:

```text
external_status
canonical_status
allowed_context
terminal?
retry?
notes
```

---

# 37. Legacy Order Status Example

External:

```text
1
2
3
4
5
-1
-2
```

May map through ACL to canonical concepts such as:

```text
PENDING
ACCEPTED
READY
DELIVERING
DONE
CANCELLATION_REQUESTED
CANCELLED
```

Canonical semantics remain owned by Ordering.

---

# 38. Status Ownership Rule

Integration translates.

Owning domain defines the lifecycle.

Integration does not invent new Order/Payment/Wallet state machines.

---

# 39. Date/Time Mapping

External may send:

```text
local datetime
Unix timestamp
ISO-8601
provider-specific timestamp
```

Normalize to:

```text
Instant / offset-aware timestamp
```

with explicit source timezone.

---

# 40. Unknown Timezone

Never assume server timezone.

If partner sends local time without offset:

```text
partner config must define timezone
```

---

# 41. Money Mapping

Validate:

```text
amount
currency
scale
rounding
minor/major units
```

---

# 42. Money Precision

Do not blindly parse external floating-point amount into internal money.

Use exact decimal/minor-unit representation according to canonical Money contract.

---

# 43. Boolean Mapping

Legacy forms:

```text
Y/N
1/0
TRUE/FALSE
```

map explicitly.

---

# 44. Null/Empty Mapping

External may confuse:

```text
null
""
0
0000-00-00
```

Normalize intentionally.

Do not convert all missing data to zero.

---

# 45. Legacy Sentinel Values

Examples:

```text
0001-01-01
99999999
GUEST
```

remain boundary concerns.

---

# 46. Canonical Sentinel Replacement

Canonical domain expresses:

```text
missing
guest
unknown
not applicable
```

explicitly instead of fake values.

---

# 47. Guest Mapping

Canonical:

```text
is_guest = true
```

Legacy adapter may translate only at boundary:

```text
memberCardNo = "GUEST"
phone = "99999999"
```

---

# 48. Guest Rule

Never let:

```text
99999999
GUEST
```

become core Customer/Order identity policy.

---

# 49. Protocol Translation Scope

Integration may translate:

```text
REST ↔ canonical port
OData ↔ canonical query/result
SOAP/XML ↔ canonical model
SFTP/file ↔ staged records/events
legacy SQL ↔ canonical model
stored procedure ↔ canonical command/result
```

---

# 50. REST Adapter Responsibilities

```text
base URL
authentication
headers
serialization
timeouts
error mapping
idempotency
correlation
observability
```

---

# 51. OData Adapter Responsibilities

```text
query composition
escaping
pagination
$filter
$expand
sentinel filtering
provider-specific field mapping
```

Core services do not know OData syntax.

---

# 52. OData Query Isolation

Legacy OData filters and `$expand` trees belong only in the adapter.

---

# 53. SOAP Adapter

If needed:

```text
WSDL/client generation
XML mapping
SOAP fault mapping
timeouts
authentication
XML security
```

---

# 54. File Integration

For CSV/XML/JSON:

```text
receive
validate schema
checksum
parse
stage
quarantine invalid rows
map
process idempotently
archive
reconcile
```

---

# 55. SFTP Integration

Require:

```text
key-based authentication
host-key verification
atomic pickup
file naming/versioning
checksum
processed/archive folder
```

Never disable host-key verification in production.

---

# 56. Legacy Database Access

During strangler migration:

```text
read-only when possible
no direct core-service queries
no cross-service writes
explicit ownership
bounded query load
```

---

# 57. No Direct Legacy DB From Core Services

Forbidden:

```text
order-service → legacy SQL Server
customer-service → legacy MySQL tables
wallet-service → arbitrary legacy tables
```

Use ACL port.

---

# 58. Temporary Legacy Write

If unavoidable:

```text
isolate inside ACL
document authority
use idempotency
audit
plan removal
```

---

# 59. Stored Procedure Adapter

Legacy may require:

```text
EXEC sp_api_IC_Topup
```

Adapter hides:

```text
procedure name
parameter quirks
result-set shape
legacy codes
```

---

# 60. Legacy SQL Server Tables

Treat legacy transaction/master/payment/preset/prize/coupon tables as:

```text
external contracts
```

not new-domain aggregates.

---

# 61. ERP / Business Central Integration

Example:

```text
Top-Up confirmed
      ↓
Integration
      ↓
Business Central API
      ↓
create topUpBalance document
```

---

# 62. ERP Mapping

Canonical input may contain:

```text
internal transaction reference
store_id / mapped store code
terminal
reason
amount
currency
```

Adapter maps to Business Central names.

---

# 63. Example ERP Field Mapping

Conceptual:

```text
internal_txn_id → documentNo
store_code      → storeNo
terminal_code   → pOSTerminalNo
business_reason → reasonCode
```

---

# 64. Duplicate ERP Submission

Before creating external record:

```text
query by stable business reference
```

or use provider idempotency.

---

# 65. Stable External Idempotency Key

Prefer:

```text
order_id
payment_id
topup_id
assignment_id
```

over:

```text
random retry UUID
```

---

# 66. Top-Up Provider Integration

Canonical provider values may include:

```text
CELLCARD
SMART
other pinless providers
```

---

# 67. Top-Up Adapter Inputs

Provider-specific:

```text
transaction ID
phone
amount
response code
provider code
```

maps to canonical Top-Up result.

---

# 68. Canonical Top-Up Flow

```text
Wallet / Payment
      ↓
Top-Up Request
      ↓
Provider Adapter
      ↓
Provider Result
      ↓
Canonical TopUpConfirmed / Rejected / Unknown
      ↓
Wallet Domain
```

---

# 69. Legacy/ERP Top-Up Sync

After canonical success:

```text
Wallet/Payment fact
      ↓
Kafka/Outbox
      ↓
Integration consumer
      ↓
legacy SQL Server / ERP
```

Keep non-critical mirror outside user-facing success path when allowed.

---

# 70. Top-Up External References

Store separately:

```text
internal transaction ID
provider transaction ID
ERP document number
legacy receipt ID
```

Do not overload one generic `transaction_id`.

---

# 71. Legacy Duplicate Detection

A legacy rule such as:

```text
look back N days by transaction reference
```

must be documented as:

```text
temporary legacy behavior
```

Prefer exact uniqueness when possible.

---

# 72. Delivery Partner Integration

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

---

# 73. Delivery State Translation

Example:

```text
COLLECTED
      ↓
DeliveryPartnerStatusReceived(COLLECTED)
      ↓
Order/Delivery domain policy
      ↓
canonical Order transition
```

---

# 74. Delivery Mutation Rule

Integration does not directly update Order tables.

It publishes/calls a canonical integration fact/command.

---

# 75. Event Ownership Rule

If Integration is translator only:

```text
Integration publishes integration fact
```

Owning domain validates and emits its own domain event.

---

# 76. Avoid Event Forgery

Integration must not publish:

```text
PaymentCaptured
OrderCompleted
WalletTopUpCompleted
```

unless it is explicitly the authoritative owner/source of that fact.

---

# 77. Canonical Integration Event Example

Prefer:

```text
DeliveryPartnerStatusReceived
```

rather than impersonating:

```text
OrderCompleted
```

---

# 78. Payment Partner Placement

If Payment Service owns the bank/provider relationship exclusively:

```text
provider adapter belongs inside Payment
```

Do not duplicate it in integration-service.

---

# 79. Data Synchronization Modes

Possible:

```text
real-time request/response
event-driven near-real-time
scheduled batch
CDC
polling
file import/export
manual reconciliation
```

---

# 80. Sync Integration

Use synchronous call when:

```text
caller requires immediate result
business decision cannot continue without response
```

---

# 81. Async Integration

Use asynchronous integration for:

```text
legacy mirror
ERP posting
reporting
analytics
secondary synchronization
```

---

# 82. Synchronization Ownership Matrix

Every integration defines:

```text
source of truth
destination
direction
mode
frequency
latency target
conflict policy
```

---

# 83. Example Synchronization Matrix

| Data | Source | Destination | Mode |
|---|---|---|---|
| Orders | Order Service | Legacy reporting | Async |
| Top-Up | Wallet/Payment | ERP | Async |
| Store reference | ERP/store master | Platform | Scheduled/Event |
| Delivery status | Partner | Order/Delivery | Webhook |
| Payment provider status | Provider/Payment | Payment | API + Webhook |

---

# 84. Bidirectional Sync Warning

Avoid:

```text
A updates B
B updates A
```

without explicit conflict ownership.

---

# 85. Source-of-Truth Rule

Every synchronized business fact has one authoritative owner.

Examples:

```text
Order status → Order Service
Wallet balance → Wallet Service
Mission progress → Mission Service
Payment state → Payment Service/provider according to payment contract
```

---

# 86. Conflict Resolution

Default:

```text
authoritative source wins
```

unless manual reconciliation is required.

---

# 87. Timestamp Conflict Warning

Do not use:

```text
latest timestamp wins
```

for financial/business state without justification.

---

# 88. Outbound Integration Request

For side-effecting asynchronous integration, persist durable request before external call.

---

# 89. Integration Request Lifecycle

Recommended:

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

# 90. integration_requests Table

Suggested:

```text
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

# 91. integration_attempts Table

Suggested:

```text
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
provider_reference
```

---

# 92. Raw Payload Storage

Raw payload may help:

```text
debugging
reconciliation
dispute investigation
```

but may contain sensitive data.

---

# 93. Preferred Payload Storage

Prefer:

```text
normalized fields
payload hash
restricted encrypted payload only when required
short retention
```

---

# 94. Outbound Async Pattern

```text
persist integration request
      ↓
commit
      ↓
worker calls external system
      ↓
persist result
      ↓
publish canonical result/event if needed
```

---

# 95. Synchronous Integration Pattern

```text
validate
create stable operation reference
persist local intent if required
call partner
map response
persist result
return canonical result
```

---

# 96. No Domain Lock During Network Call

Never hold unrelated domain DB locks while waiting on partner network calls.

---

# 97. Timeout Strategy

Every external dependency defines:

```text
connect timeout
read timeout
overall deadline
```

No infinite waits.

---

# 98. Timeout ≠ Failure

Critical:

```text
request sent
external side effect may have completed
response lost
```

Result:

```text
UNKNOWN
```

---

# 99. Retry Rule

Retry only when:

```text
operation is idempotent
or provider supports idempotency
or status can be queried safely
```

---

# 100. Retryable Errors

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

# 101. Non-Retryable Errors

Typical:

```text
invalid request
business validation rejection
unsupported operation
permanent mapping failure
```

---

# 102. Authentication Failure

`401/403` normally means:

```text
configuration/auth problem
```

Do not hot-loop.

Recover after credentials/config are fixed.

---

# 103. Unknown Outcome

State:

```text
UNKNOWN
```

means:

```text
external side effect may have happened
```

Never blindly repeat.

---

# 104. Unknown Outcome Resolution

Use:

```text
status query
lookup by business reference
provider callback
provider reference
reconciliation
```

---

# 105. Query-by-Reference

Every high-risk external side effect should ideally support lookup by:

```text
merchant/business reference
provider reference
idempotency key
```

---

# 106. Circuit Breaker

States:

```text
CLOSED
OPEN
HALF_OPEN
```

Use for repeatedly failing external dependencies.

---

# 107. Circuit Breaker Limitation

Circuit breaker does not replace:

```text
idempotency
UNKNOWN recovery
reconciliation
```

---

# 108. Bulkhead

Separate resource pools/concurrency limits for:

```text
Grab/Delivery
ERP
Legacy SQL
Top-Up Provider
other partners
```

One failed provider must not exhaust all integration threads.

---

# 109. Partner Rate Limiting

Use:

```text
token bucket
bounded concurrency
queue
backoff
```

according to provider quota.

---

# 110. Backpressure

If partner slows:

```text
queue grows
```

Monitor:

```text
oldest pending age
backlog size
throughput
success rate
```

---

# 111. DLQ

After retry exhaustion:

```text
move durable integration command/event to DLQ
```

when Kafka/event workflow is involved.

---

# 112. DLQ Metadata

Include:

```text
business reference
integration code
operation
failure category
attempt count
correlation ID
```

---

# 113. DLQ Replay

Replay preserves:

```text
original business reference
original idempotency key
correlation ID
```

Never accidentally create a brand-new external transaction.

---

# 114. Inbound Webhook

Canonical flow:

```text
receive
authenticate
validate schema
replay-check
deduplicate
persist receipt
acknowledge
process/map
publish/call canonical owner
```

---

# 115. Webhook Endpoint

Possible:

```text
POST /api/v1/integrations/{partner}/webhooks/{type}
```

or partner-required specific path.

---

# 116. Webhook Authentication

Possible:

```text
HMAC
RSA signature
mTLS
API key
OAuth token
provider certificate
```

Use the actual partner contract.

---

# 117. Webhook Replay Protection

Validate where available:

```text
timestamp
nonce
provider event ID
signature
```

---

# 118. Webhook Idempotency

Same provider event:

```text
process once
```

but return provider-compatible success for duplicate delivery when appropriate.

---

# 119. Webhook Receipt Table

Suggested:

```text
integration_webhooks
```

fields:

```text
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

# 120. Fast Webhook Acknowledgement

If provider requires quick response:

```text
persist durable receipt
return 2xx
process asynchronously
```

---

# 121. Slow Webhook Warning

Do not execute a long downstream Saga before returning provider acknowledgment unless the partner contract explicitly requires it.

---

# 122. Invalid Webhook

Invalid signature:

```text
reject
audit
metric
do not process payload
```

---

# 123. Unknown Webhook Reference

If provider reference cannot be mapped:

```text
QUARANTINE
reconcile
alert when important
```

Never invent a new core entity.

---

# 124. Duplicate Webhook

Same provider event again:

```text
dedupe
return expected acknowledgement
```

---

# 125. Out-of-Order Webhook

Example:

```text
DELIVERED
then
DRIVER_ARRIVED
```

Integration maps both with:

```text
occurred_at
provider sequence if available
```

Owning domain decides valid transition.

---

# 126. Webhook Versioning

Support partner:

```text
API version
event version
schema version
```

Adapter routes by version if required.

---

# 127. Webhook History Immutability

Do not rewrite historic receipt payload/version to make old data look like new contract.

---

# 128. Webhook Payload Hash

Persist a hash for:

```text
dedupe
audit
payload-integrity comparison
```

---

# 129. Provider Event ID Uniqueness

Where available:

```text
UNIQUE(partner, webhook_type, provider_event_id)
```

---

# 130. Webhook Schema Validation

Reject/quarantine:

```text
missing required fields
wrong types
unsupported enum/status
oversized payload
unsupported version
```

---

# 131. External Event Translation

Example:

```text
{ "state": "COLLECTED" }
      ↓
DeliveryPartnerStatusReceived {
  state = COLLECTED
}
```

Domain converts integration fact into domain transition.

---

# 132. Canonical Event Ownership

Integration may publish:

```text
ExternalDeliveryStatusReceived
LegacySyncCompleted
TopUpLegacySyncCompleted
IntegrationFailed
```

when useful.

---

# 133. Event Ownership Guard

Integration cannot impersonate:

```text
OrderCompleted
PaymentCaptured
RewardAssigned
```

without actual authority.

---

# 134. CDC

CDC may be used temporarily for migration.

Example:

```text
legacy DB
   ↓ CDC
Kafka
   ↓
ACL mapping
   ↓
new projection
```

---

# 135. CDC Warning

CDC captures:

```text
database changes
```

not automatically:

```text
business events
```

---

# 136. CDC Mapping

Translate row-level changes into:

```text
canonical migration/synchronization record
```

where meaningful.

---

# 137. Polling

When webhook/CDC unavailable:

```text
poll partner/legacy system
```

using:

```text
updated_since
cursor
watermark
```

---

# 138. Polling Watermark

Persist:

```text
last_successful_cursor
last_successful_timestamp
```

in PostgreSQL.

---

# 139. No In-Memory-Only Watermark

Process restart must not lose polling position.

---

# 140. Polling Overlap

Use small overlap window to avoid missing boundary records.

Deduplicate by stable external identifier.

---

# 141. Poller Locking

Multiple replicas must not advance the same poller unsafely.

Use:

```text
leader lock
lease
row lock
job framework
```

---

# 142. Polling State Table

Suggested:

```text
integration_polling_state
```

fields:

```text
integration_code
poller_name
cursor
watermark
last_started_at
last_success_at
last_error
version
```

---

# 143. Poller Failure

On failure:

```text
do not advance successful watermark
```

---

# 144. Batch Import

Flow:

```text
receive
validate
stage
dedupe
map
process
reconcile
archive
```

---

# 145. Import Batch Table

Suggested:

```text
integration_import_batches
```

---

# 146. Import Row Table

Suggested:

```text
integration_import_rows
```

fields:

```text
batch_id
row_number
raw_hash
status
error_code
external_reference
```

---

# 147. Quarantine

Invalid/unmappable data transitions to:

```text
QUARANTINED
```

with reason.

Never drop silently.

---

# 148. Data Quality Validation

Validate:

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

# 149. Partial Batch Failure

Options:

```text
all-or-nothing
row-by-row
chunk transaction
```

Choose per business/integration.

---

# 150. Large Migration Import

Source recommendation:

```text
row/chunk isolation
```

is usually practical.

---

# 151. Integration Configuration

Non-secret configuration:

```text
base URL
enabled
partner code
timezone
connect timeout
read timeout
overall deadline
rate limit
feature flags
```

---

# 152. Environment Isolation

DEV/UAT/PROD require separate:

```text
endpoint
credentials
webhook secret
client ID
certificate
```

Never reuse production secrets in lower environments.

---

# 153. Enable/Disable Flag

Operational:

```text
integration.enabled
```

may stop outbound activity during incident.

Preserve incoming durable events where possible.

---

# 154. Partner Operational State

Possible:

```text
ACTIVE
DEGRADED
DISABLED
MAINTENANCE
```

---

# 155. Secret Storage

Use:

```text
Vault
cloud Secret Manager
Kubernetes external secrets
```

Never:

```text
Git
plaintext DB
hard-coded source/config
```

---

# 156. Key Rotation

For signed integrations support where needed:

```text
current key
previous key
kid/version
overlap/grace window
```

---

# 157. Certificate Rotation

mTLS integrations require:

```text
expiry monitoring
rotation runbook
overlap period
```

---

# 158. Integration Database Overview

Potential tables:

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

Not all integrations need all tables.

---

# 159. integration_idempotency

Suggested:

```text
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

# 160. Processed Events

For outbound event-driven integration:

```text
processed_events
```

prevents Kafka replay from causing duplicate external side effects.

---

# 161. Integration Request Transaction

```text
BEGIN

claim idempotency
insert integration request
insert outbox/queue work
complete idempotency

COMMIT
```

Worker performs external side effect later.

---

# 162. Synchronous Integration Transaction

For direct request:

```text
validate
create stable request/reference
commit local intent if required
call partner
persist result
```

---

# 163. External Correlation

Send where supported:

```text
X-Correlation-Id
X-Request-Id
merchant/business reference
idempotency key
```

---

# 164. Correlation Propagation

Preserve:

```text
Gateway
→ Domain Service
→ Integration
→ Partner
→ Webhook
```

when partner supports correlation/reference.

---

# 165. Canonical Error Taxonomy

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

# 166. Provider Error Mapping

Example:

```text
ERR_12
→ INTEGRATION_BUSINESS_REJECTED
```

Core services should not branch on `ERR_12`.

---

# 167. Canonical Error Metadata

Safe metadata may include:

```text
canonical_error
retryable
provider_code_safe
provider_reference
```

Avoid raw secrets/payload.

---

# 168. Typed Integration Contracts

Prefer:

```text
SyncTopUpToERP
MapLegacyCustomer
SubmitDeliveryOrder
CancelDeliveryOrder
GetExternalReference
```

over:

```text
execute(anything)
```

---

# 169. Internal gRPC Contract

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

---

# 170. No Generic Integration Execute API

Avoid:

```text
POST /integration/execute
```

with opaque payload.

---

# 171. Integration Admin APIs

Possible:

```text
GET  /api/v1/admin/integrations/status
GET  /api/v1/admin/integrations/requests
GET  /api/v1/admin/integrations/requests/{id}
POST /api/v1/admin/integrations/requests/{id}/retry
GET  /api/v1/admin/integrations/reconciliation
GET  /api/v1/admin/integrations/mappings
POST /api/v1/admin/integrations/mappings
```

---

# 172. Partner Webhook APIs

Must be:

```text
authenticated
versioned
rate-limited
safely logged
payload-limited
```

---

# 173. Security Risks

Primary:

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

# 174. SSRF Protection

For configurable outbound URLs:

```text
allowlist domains
validate scheme
block metadata/private-network access where not required
```

Do not accept arbitrary user destination URLs.

---

# 175. XML Security

For SOAP/XML:

```text
disable external entity resolution
limit payload size
validate schema
```

Protect against XXE.

---

# 176. JSON Deserialization

Use strict DTOs.

Reject:

```text
unexpected polymorphic type
oversized array
dangerous unknown structures
```

---

# 177. Request Size Limits

Set per integration.

Do not accept unbounded webhook/file payloads.

---

# 178. Partner IP Allowlist

May be defense-in-depth.

Never use it as sole webhook authentication.

---

# 179. Webhook Secret Rotation

Support:

```text
current secret
previous secret during rotation window
```

then retire old.

---

# 180. Webhook Rate Limiting

Protect against:

```text
abuse
retry storm
```

without breaking legitimate partner retry behavior.

---

# 181. Integration Audit

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

# 182. Manual Retry

Must preserve:

```text
original idempotency key
business reference
```

unless deliberately creating a new business operation.

---

# 183. Manual Replay

Webhook/request replay is high-risk.

Require:

```text
permission
audit
duplicate awareness
current-state preview
reason
```

---

# 184. Mapping Admin

Adding/fixing mapping requires:

```text
RBAC
audit
validation
impact review
```

---

# 185. Reconciliation Purpose

Compare:

```text
internal authoritative state
integration request history
external/provider state
```

---

# 186. Reconciliation Types

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

# 187. Reconciliation Keys

May use:

```text
business reference
external reference
amount
currency
status
business date
```

---

# 188. Reconciliation Mismatch Types

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

# 189. Reconciliation Workflow

```text
start run
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

# 190. No Silent Repair

Never fix mismatch by directly editing whichever side is easier.

Use:

```text
source-of-truth rule
controlled replay
corrective command
audit
```

---

# 191. Reconciliation Run Table

```text
integration_reconciliation_runs
```

Possible fields:

```text
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

# 192. Reconciliation Mismatch Table

```text
integration_reconciliation_mismatches
```

Possible fields:

```text
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

# 193. Integration Metrics

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

---

# 194. Webhook Metrics

```text
webhook_received_total
webhook_invalid_signature_total
webhook_duplicate_total
webhook_processing_failure_total
```

---

# 195. Polling Metrics

```text
poll_run_total
poll_failure_total
polling_watermark_age
records_polled_total
```

---

# 196. Reconciliation Metrics

```text
integration_reconciliation_mismatch_total
reconciliation_run_failure_total
```

---

# 197. SLIs

Potential:

```text
P95 partner latency
outbound success rate
webhook processing success rate
backlog age
UNKNOWN resolution time
polling freshness
reconciliation health
```

---

# 198. Metric Label Rule

Use bounded labels:

```text
integration_code
operation
result
```

Never use external transaction IDs as metric labels.

---

# 199. Alerts

Alert on:

```text
auth failure
timeout spike
UNKNOWN spike
backlog age
webhook signature failures
reconciliation mismatch
poller stalled
certificate expiry
secret expiry
DLQ backlog
```

---

# 200. Integration Dashboard

Show:

```text
requests/min
success/failure
latency
retry rate
UNKNOWN outcomes
webhooks
backlog
polling watermark age
reconciliation mismatches
partner health
```

---

# 201. Structured Logging

Safe:

```text
integration_code
operation
business_reference
masked external_reference
status
attempt
error_category
correlation_id
request_id
```

---

# 202. Sensitive Logging

Do not log:

```text
API key
secret
private key
OTP
full card data
raw sensitive payload
password/token
```

---

# 203. Raw Payload Logging

Default:

```text
disabled
```

For controlled debugging:

```text
redacted
restricted
short retention
```

---

# 204. Distributed Tracing

Trace:

```text
Core Service
  ↓
Integration Port
  ↓
Adapter
  ↓
External HTTP / SOAP / SQL / SFTP
```

---

# 205. Trace Attributes

Use:

```text
integration_code
operation
result
latency
```

Avoid sensitive payload/reference values.

---

# 206. Failure — External API Down

```text
critical synchronous call
→ fail safely

asynchronous sync
→ queue/retry
```

Do not block unrelated platform capabilities.

---

# 207. Failure — Legacy DB Down

New platform functionality not requiring legacy should continue.

Secondary sync queues backlog.

---

# 208. Failure — Kafka Down

Outbound sync events remain in source Outbox/broker recovery path.

Consumers recover later.

---

# 209. Failure — Integration PostgreSQL Down

Do not execute non-idempotent external side effect when durable request/dedupe state cannot be persisted safely.

---

# 210. Failure — Partner Authentication Expired

Mark:

```text
DEGRADED / UNAVAILABLE
```

then:

```text
stop hot retries
alert
rotate credential
resume safely
```

---

# 211. Failure — Mapping Missing

Example:

```text
store mapping not found
```

Return/record:

```text
INTEGRATION_REFERENCE_NOT_FOUND
```

and quarantine/retry after mapping is fixed.

---

# 212. Failure — Partner Schema Change

Adapter should:

```text
tolerate additive compatible fields
reject breaking required-field changes
alert
```

---

# 213. Contract Versioning

Maintain provider versions separately when required:

```text
v1
v2
```

Do not rewrite old history.

---

# 214. Required Runbooks

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

# 215. Partner Outage Runbook

```text
identify affected operations
open circuit / pause workers
preserve durable requests
monitor backlog
communicate impact
resume with bounded throughput
reconcile after recovery
```

---

# 216. UNKNOWN Outcome Runbook

```text
stop blind retry
query provider by reference
check webhook history
check reconciliation
resolve canonical status
document resolution
```

---

# 217. Missing Mapping Runbook

```text
identify external reference
find correct internal entity
add mapping through controlled process
replay quarantined request
```

---

# 218. Webhook Attack Runbook

If signature failures spike:

```text
rate limit
inspect source
verify key/secret validity
block abusive source if appropriate
do not weaken signature validation
```

---

# 219. Integration Backup Scope

Back up:

```text
reference mappings
integration requests
attempts
webhook receipts
polling state
import state
reconciliation
idempotency
processed events
outbox
```

---

# 220. Restore Procedure

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

# 221. Restore Risks

Old restore may:

```text
repeat external side effect
lose provider reference
rewind polling cursor
reprocess webhook
duplicate ERP posting
```

---

# 222. Restore Protections

Use:

```text
stable business references
idempotency
provider reference lookup
processed events
webhook dedupe
polling overlap/dedupe
reconciliation
```

---

# 223. Disaster Recovery

Define:

```text
RPO
RTO
provider reference recovery
webhook replay
poller watermark recovery
external-state reconciliation
secret/certificate recovery
```

---

# 224. Flyway Migration Plan

Suggested:

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

Adjust numbering to repository.

---

# 225. Strangler Migration Goal

Replace legacy capability:

```text
gradually
```

not:

```text
big-bang rewrite
```

---

# 226. Strangler Step 1 — Observe

Document legacy:

```text
inputs
outputs
tables
side effects
status codes
errors
timeouts
duplicates
sentinels
```

before replacing.

---

# 227. Strangler Step 2 — Canonical Contract

Introduce:

```text
new domain API/event/port
```

independent of legacy schema.

---

# 228. Strangler Step 3 — ACL

ACL translates:

```text
canonical request
→ legacy call/query/procedure
```

so callers stop depending on legacy model.

---

# 229. Strangler Step 4 — Replace Behind Contract

Swap:

```text
legacy adapter
```

for:

```text
new implementation
```

without changing callers.

---

# 230. Strangler Step 5 — Remove Dependency

After:

```text
traffic migrated
data reconciled
rollback window closed
```

remove:

```text
adapter
legacy credential
mapping where no longer needed
```

---

# 231. Shadow Read

Possible migration pattern:

```text
read legacy
read new
compare
return legacy result
```

until confidence is high.

---

# 232. Shadow Write Warning

Avoid synchronous dual-write to both old/new systems.

Prefer:

```text
one authoritative write
+
async replication
```

---

# 233. Dual Read

Temporary:

```text
new first
fallback legacy
```

Track which source answered.

---

# 234. Cutover Flag

Route by:

```text
customer
store
channel
percentage
```

between:

```text
legacy
new
```

---

# 235. Canary Migration

Start with:

```text
internal users
one store
small customer percentage
```

then expand.

---

# 236. Rollback

Rollback must not create split-brain authority.

Define:

```text
which system received writes
how to reconcile
which traffic may return to legacy
```

---

# 237. Legacy Decommission Criteria

Before removal:

```text
no production traffic
no required reporting dependency
data archived
reconciliation complete
rollback window closed
credentials revoked
```

---

# 238. Clean Architecture Layout

Recommended:

```text
integration-service/
├── domain/
│   ├── reference/
│   ├── request/
│   ├── webhook/
│   ├── reconciliation/
│   └── exception/
├── application/
│   ├── outbound/
│   ├── inbound/
│   ├── mapping/
│   ├── polling/
│   ├── import/
│   ├── reconciliation/
│   └── admin/
├── adapter/in/
│   ├── rest/
│   ├── webhook/
│   ├── kafka/
│   └── scheduler/
├── adapter/out/
│   ├── legacy/
│   ├── partner/
│   ├── sqlserver/
│   ├── odata/
│   ├── soap/
│   ├── sftp/
│   ├── persistence/
│   └── kafka/
└── config/
```

---

# 239. Input Ports

Examples:

```text
SubmitIntegrationRequestUseCase
ProcessWebhookUseCase
MapExternalReferenceUseCase
RunPollerUseCase
ImportBatchUseCase
RetryIntegrationUseCase
ReconcileIntegrationUseCase
ResolveUnknownOutcomeUseCase
```

---

# 240. Output Ports

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

# 241. Adapter Naming

Prefer explicit:

```text
GrabDeliveryAdapter
BusinessCentralAdapter
LegacyMemberSqlServerAdapter
SmartTopUpAdapter
CellcardTopUpAdapter
```

---

# 242. Avoid Generic Adapter Names

Avoid:

```text
ExternalService1
ExternalService2
LegacyUtil
CommonExternalHelper
```

---

# 243. SDK Isolation

Provider SDK/library belongs only under:

```text
adapter/out/provider
```

Domain/Application depend on ports.

---

# 244. Typed Integration Configuration

Example:

```text
endpoint
connectTimeout
readTimeout
overallDeadline
maxRetries
enabled
timezone
rateLimit
```

Validate at startup.

---

# 245. Startup Validation

Fail fast for required integration with invalid:

```text
URL
credential reference
timeout
certificate
mapping configuration
```

Optional integration may start disabled with alert.

---

# 246. Health Checks

Separate:

```text
liveness
readiness
dependency health
```

---

# 247. Kubernetes Liveness Rule

Do not make application liveness depend on external partner health.

Partner outage must not cause endless pod restart loop.

---

# 248. Critical Partner Readiness

Readiness may consider a truly essential dependency carefully, but avoid cascading restart behavior.

---

# 249. Partner Health Endpoint

Internal/admin:

```text
GET /admin/integrations/{code}/health
```

May show:

```text
last success
last failure
latency
circuit state
backlog
operational state
```

never secrets.

---

# 250. Integration Documentation Template

For every integration document:

```text
Purpose
Owner
Environment URLs
Authentication
Operations
Canonical Mapping
Timeouts
Retries
Idempotency
Webhook Verification
Status Mapping
Error Mapping
Rate Limits
Reconciliation
Runbook
Contacts
Removal Plan if Temporary
```

---

# 251. Mapping Documentation

Columns:

```text
External Field
Canonical Field
Transformation
Required?
Notes
```

---

# 252. Status Mapping Documentation

Columns:

```text
External Status
Canonical Integration Status
Domain Action
Retry?
Terminal?
Notes
```

---

# 253. Error Mapping Documentation

Columns:

```text
Provider Code
Meaning
Canonical Error
Retryable?
Customer Visible?
Operational Action
```

---

# 254. Security Documentation

Include:

```text
credential type
secret location
rotation
webhook signature
certificate
IP allowlist
data classification
network destination
```

---

# 255. Testing Strategy

Required:

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
Restore/DR
```

---

# 256. Mapper Tests

Test:

```text
normal mapping
missing optional
missing required
unknown enum
date/time conversion
money conversion
sentinel conversion
guest conversion
reference mapping
```

---

# 257. Status Mapping Tests

Every known external status must map explicitly.

Unknown external status:

```text
quarantine / unsupported
```

not silent default.

---

# 258. Adapter Contract Tests

Against sandbox/mock:

```text
authentication
headers
request body
response mapping
error mapping
timeout
rate limit
idempotency
```

---

# 259. Webhook Tests

Test:

```text
valid signature
invalid signature
duplicate event
old timestamp
replayed nonce
unknown reference
out-of-order event
unsupported version
oversized payload
```

---

# 260. Outbound Idempotency Tests

Same:

```text
business reference
request
idempotency key
```

repeated should not create duplicate external side effect.

---

# 261. Timeout Tests

Simulate:

```text
connect timeout
read timeout before external processing
response timeout after external side effect
```

Expected distinction between:

```text
safe retry
UNKNOWN
```

---

# 262. UNKNOWN Tests

Simulate:

```text
external side effect succeeds
response lost
```

Verify:

```text
no blind duplicate
query/reference/reconciliation recovery
```

---

# 263. Retry Tests

Verify:

```text
429
502
503
504
network reset
max attempts
backoff
circuit opening
no hot auth retries
```

---

# 264. Webhook Concurrency Tests

Same webhook concurrently:

```text
one canonical processing effect
```

---

# 265. Polling Tests

Verify:

```text
watermark persisted
overlap
dedupe
restart recovery
pagination
no missed boundary record
```

---

# 266. Batch Import Tests

Verify:

```text
checksum
schema validation
duplicate row
quarantine
partial failure policy
replay
archive
```

---

# 267. Reconciliation Tests

Create:

```text
missing external
missing internal
status mismatch
amount mismatch
duplicate external record
reference mismatch
```

and verify detection.

---

# 268. Legacy Adapter Tests

Validate:

```text
read-only behavior where expected
sentinel conversion
stored procedure parameters
result mapping
query load limits
failure behavior
```

---

# 269. Strangler Tests

Test:

```text
legacy route
new route
canary route
shadow read
fallback
rollback
```

---

# 270. Security Tests

Verify:

```text
invalid webhook signature rejected
replay rejected/deduped
SSRF blocked
XXE blocked
oversized payload rejected
admin retry RBAC
secret redaction
TLS validation
```

---

# 271. Load Tests

Scenarios:

```text
webhook burst
ERP backlog
legacy DB poll
large import
provider rate-limit
reconciliation scan
```

---

# 272. Backpressure Test

Slow partner deliberately.

Verify:

```text
bounded worker concurrency
queue growth visible
core service remains healthy
no DB connection exhaustion
```

---

# 273. Restore/Replay Test

Restore old integration DB snapshot.

Verify:

```text
pending/UNKNOWN requests are reconciled
webhooks do not duplicate
polling cursor recovery is safe
ERP posting is not duplicated
```

---

# 274. Definition of Done — Partner Adapter

- [ ] Canonical request/result.
- [ ] External DTO isolated.
- [ ] Authentication.
- [ ] Timeout.
- [ ] Retry classification.
- [ ] Idempotency.
- [ ] Error mapping.
- [ ] Status mapping.
- [ ] Correlation.
- [ ] Metrics/logging/tracing.
- [ ] Contract tests.
- [ ] Runbook.

---

# 275. Definition of Done — Webhook

- [ ] Versioned endpoint.
- [ ] Authentication/signature verification.
- [ ] Replay protection.
- [ ] Payload limit.
- [ ] Schema validation.
- [ ] Provider event ID.
- [ ] Dedupe.
- [ ] Durable receipt.
- [ ] Fast acknowledgment where appropriate.
- [ ] Mapping.
- [ ] Unknown reference quarantine.
- [ ] Out-of-order handling.
- [ ] Tests.
- [ ] Metrics/alerts.

---

# 276. Definition of Done — Legacy Adapter

- [ ] Legacy schema documented.
- [ ] Canonical model defined.
- [ ] Sentinel values contained.
- [ ] Read/write ownership explicit.
- [ ] Mapping tests.
- [ ] Load impact reviewed.
- [ ] Idempotency if writing.
- [ ] Removal plan documented.

---

# 277. Definition of Done — Outbound Side Effect

- [ ] Stable business reference.
- [ ] Idempotency key.
- [ ] Request persisted if async/high risk.
- [ ] Timeout.
- [ ] Retry.
- [ ] UNKNOWN state.
- [ ] Query-by-reference/reconciliation.
- [ ] Attempt history.
- [ ] Audit.
- [ ] Tests.

---

# 278. Definition of Done — Poller

- [ ] Cursor/watermark persisted.
- [ ] Overlap defined.
- [ ] Dedupe.
- [ ] Locking.
- [ ] Backoff.
- [ ] Metrics.
- [ ] Stalled alert.
- [ ] Restart test.

---

# 279. Definition of Done — Reconciliation

- [ ] Authoritative side defined.
- [ ] Keys defined.
- [ ] Mismatch types.
- [ ] Run persistence.
- [ ] Manual escalation.
- [ ] Safe auto-resolution only.
- [ ] Audit.
- [ ] Metrics.
- [ ] Tests.

---

# 280. Boundary Review Checklist

- [ ] External model contained.
- [ ] Canonical language used by core.
- [ ] No direct legacy DB access from domain services.
- [ ] Provider SDK isolated.
- [ ] Ownership clear.
- [ ] Integration not acting as business domain.

---

# 281. Reliability Review Checklist

- [ ] Timeout.
- [ ] Retry.
- [ ] Idempotency.
- [ ] UNKNOWN outcome.
- [ ] Circuit breaker.
- [ ] Bulkhead.
- [ ] Rate limiting.
- [ ] Backpressure.
- [ ] DLQ.
- [ ] Reconciliation.

---

# 282. Data Review Checklist

- [ ] Stable external references.
- [ ] Unique mappings.
- [ ] Request/attempt history.
- [ ] Webhook dedupe.
- [ ] Durable polling watermark.
- [ ] Batch import history.
- [ ] Quarantine.
- [ ] Reconciliation tables.
- [ ] Retention defined.
- [ ] Sentinel conversion explicit.

---

# 283. Contract Review Checklist

- [ ] Canonical input/output.
- [ ] External DTO isolated.
- [ ] Status mapping.
- [ ] Error mapping.
- [ ] Versioning.
- [ ] Idempotency key.
- [ ] Correlation ID.
- [ ] Timeout/deadline.
- [ ] UNKNOWN semantics.
- [ ] Event ownership.

---

# 284. Security Review Checklist

- [ ] Secrets externalized.
- [ ] TLS validation.
- [ ] Webhook signature.
- [ ] Replay protection.
- [ ] SSRF protection.
- [ ] XML security.
- [ ] Payload limits.
- [ ] Admin replay/retry RBAC.
- [ ] Sensitive logging redacted.
- [ ] Certificate/key rotation.

---

# 285. Operations Review Checklist

- [ ] Partner health.
- [ ] Backlog.
- [ ] Retry.
- [ ] UNKNOWN.
- [ ] DLQ.
- [ ] Poller watermark.
- [ ] Reconciliation.
- [ ] Certificate expiry.
- [ ] Secret expiry.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 286. Production Readiness Checklist

Before production:

- [ ] Sandbox contract tests pass.
- [ ] Authentication tested.
- [ ] Timeout tested.
- [ ] Retry tested.
- [ ] UNKNOWN-outcome test passes.
- [ ] Duplicate webhook test passes.
- [ ] Out-of-order webhook test passes.
- [ ] Mapping coverage complete.
- [ ] Missing-reference handling tested.
- [ ] Reconciliation tested.
- [ ] Partner outage tested.
- [ ] Secret rotation tested.
- [ ] Certificate rotation plan exists.
- [ ] Load/backpressure test passed.
- [ ] Restore/replay test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 287. Initial Implementation Order

Follow source order:

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

# 288. Recommended Project Implementation Order

Expanded for this platform:

```text
1. Bootstrap integration-service
2. integration_db + Flyway
3. Define bounded integration modules
4. Define canonical integration contracts
5. Create external reference mapping
6. Implement mapping standards
7. Implement shared HTTP transport
8. Implement timeout/deadline standard
9. Implement canonical error taxonomy
10. Implement outbound request/attempt persistence
11. Implement integration idempotency
12. Implement retry/backoff/circuit/bulkhead
13. Implement UNKNOWN recovery
14. Implement webhook receipt/security/dedupe
15. Implement reconciliation
16. Implement Grab delivery adapter if required
17. Implement Top-Up provider adapters if required
18. Implement Business Central ERP sync
19. Implement legacy SQL Server adapter
20. Implement stored procedure adapter
21. Implement legacy member/reference adapter
22. Implement poller framework
23. Implement batch import/quarantine
24. Implement Strangler routing
25. Implement migration shadow-read/canary tooling
26. Implement admin retry/replay/mapping tools
27. Add metrics/alerts/runbooks
28. Load/failure/security testing
29. DR/restore validation
30. Phase 19 production review
31. Handoff Phase 20 Redis / Caching
```

---

# 289. Minimum Production-Capable Integration Layer

Required by source:

```text
Canonical contracts
Provider/legacy adapters
Reference mapping
Timeouts
Retry
Idempotency
Webhook verification
Webhook dedupe
Error mapping
Status mapping
UNKNOWN outcome handling
Reconciliation
Observability
```

---

# 290. Legacy Migration Minimum

Additionally:

```text
read-only legacy adapters where possible
strangler routing
explicit source-of-truth
removal plan
```

---

# 291. Release-Specific Integration Candidates

Based on source examples, likely modules include:

```text
delivery / Grab
topup / CELLCARD
topup / SMART
Business Central ERP
legacy SQL Server
legacy member/card
legacy order/reporting
POS/OData where migration requires it
```

Implement only integrations actually required by cutover scope.

---

# 292. Integration ADRs

Recommended:

```text
ADR-INT-001 Dedicated integration-service boundary
ADR-INT-002 Integration module ownership
ADR-INT-003 Canonical model standard
ADR-INT-004 External DTO isolation
ADR-INT-005 External reference mapping
ADR-INT-006 Reference remap policy
ADR-INT-007 Status mapping ownership
ADR-INT-008 Date/time normalization
ADR-INT-009 Money normalization
ADR-INT-010 Sentinel-value containment
ADR-INT-011 REST client standard
ADR-INT-012 OData isolation
ADR-INT-013 SOAP/XML security
ADR-INT-014 Legacy DB access
ADR-INT-015 Legacy DB writes
ADR-INT-016 Stored procedure adapter
ADR-INT-017 Outbound request persistence
ADR-INT-018 Stable external idempotency
ADR-INT-019 Timeout/deadline
ADR-INT-020 Retry classification
ADR-INT-021 UNKNOWN outcome handling
ADR-INT-022 Circuit breaker/bulkhead
ADR-INT-023 Webhook authentication
ADR-INT-024 Webhook dedupe
ADR-INT-025 Webhook fast acknowledgment
ADR-INT-026 Event ownership
ADR-INT-027 Top-Up provider boundary
ADR-INT-028 ERP synchronization
ADR-INT-029 Polling/watermark
ADR-INT-030 CDC migration use
ADR-INT-031 Batch import/quarantine
ADR-INT-032 Source-of-truth/conflict
ADR-INT-033 Reconciliation
ADR-INT-034 Strangler migration
ADR-INT-035 Shadow read
ADR-INT-036 Canary/cutover
ADR-INT-037 Rollback
ADR-INT-038 Legacy decommission
```

---

# 293. Phase 19 Policy Freeze Checklist

Before production resolve:

- [ ] Which integrations live in dedicated integration-service?
- [ ] Which adapters remain inside domain services?
- [ ] Module ownership.
- [ ] Canonical model naming.
- [ ] Reference mapping schema.
- [ ] Reference remap process.
- [ ] Store mapping source.
- [ ] Product mapping source.
- [ ] Customer/member mapping source.
- [ ] Status mapping authority.
- [ ] Default timezone per external system.
- [ ] Money representation/rounding.
- [ ] Legacy sentinel conversion.
- [ ] Guest translation.
- [ ] Shared HTTP client implementation.
- [ ] Connect timeout defaults.
- [ ] Read timeout defaults.
- [ ] Overall deadline policy.
- [ ] Retryable status/error list.
- [ ] Max attempts/backoff/jitter.
- [ ] Circuit-breaker settings.
- [ ] Bulkhead limits.
- [ ] Partner rate limits.
- [ ] External idempotency-key format.
- [ ] UNKNOWN resolution strategy for each side effect.
- [ ] Webhook authentication per partner.
- [ ] Webhook replay window.
- [ ] Webhook dedupe retention.
- [ ] Fast-ack requirement.
- [ ] Event ownership.
- [ ] Polling overlap.
- [ ] Polling schedule/watermark.
- [ ] Batch failure policy.
- [ ] Quarantine process.
- [ ] Source-of-truth matrix.
- [ ] Reconciliation frequency.
- [ ] Admin retry/replay RBAC.
- [ ] Raw payload retention.
- [ ] Secret management.
- [ ] Key/certificate rotation.
- [ ] Strangler routing dimensions.
- [ ] Canary scope.
- [ ] Rollback rules.
- [ ] Legacy decommission criteria.
- [ ] SLOs/alerts.
- [ ] DR RPO/RTO.

---

# 294. Work Breakdown

Suggested tickets:

```text
INT-001 Bootstrap integration-service
INT-002 Create integration_db
INT-003 Add Flyway baseline
INT-004 Define integration module boundaries
INT-005 Define module ownership
INT-006 Implement canonical integration base contracts
INT-007 Implement external DTO isolation rules
INT-008 Implement mapping conventions
INT-009 Create external_reference_mappings
INT-010 Add mapping uniqueness
INT-011 Implement mapping query API/port
INT-012 Implement controlled reference remap
INT-013 Add remap audit
INT-014 Implement store mapping
INT-015 Implement product mapping framework
INT-016 Implement customer/member mapping
INT-017 Implement status mapping framework
INT-018 Implement time normalization
INT-019 Implement money normalization
INT-020 Implement null/sentinel normalization
INT-021 Implement guest sentinel adapter conversion
INT-022 Implement shared HTTP client
INT-023 Add correlation/request IDs
INT-024 Add connect timeout
INT-025 Add read timeout
INT-026 Add overall deadline
INT-027 Implement canonical integration errors
INT-028 Implement provider error mapping
INT-029 Create integration_requests
INT-030 Create integration_attempts
INT-031 Implement request state machine
INT-032 Create integration_idempotency
INT-033 Implement request hash
INT-034 Implement stable idempotency key
INT-035 Implement retry classification
INT-036 Implement retry/backoff/jitter
INT-037 Implement circuit breaker
INT-038 Implement bulkhead
INT-039 Implement partner rate limiting
INT-040 Implement backpressure metrics
INT-041 Implement UNKNOWN state
INT-042 Implement query-by-reference hook
INT-043 Implement UNKNOWN recovery worker
INT-044 Implement DLQ metadata
INT-045 Implement DLQ replay preservation
INT-046 Create webhook receipt table
INT-047 Implement webhook auth framework
INT-048 Implement HMAC verifier
INT-049 Implement RSA verifier where required
INT-050 Implement mTLS/certificate auth where required
INT-051 Implement webhook replay protection
INT-052 Implement webhook dedupe
INT-053 Implement payload hash
INT-054 Implement fast acknowledgement
INT-055 Implement webhook async processing
INT-056 Implement unknown-reference quarantine
INT-057 Implement out-of-order handling
INT-058 Implement webhook version routing
INT-059 Implement webhook rate limiting
INT-060 Implement event ownership guard
INT-061 Implement canonical integration event envelope
INT-062 Implement Grab delivery webhook adapter if required
INT-063 Implement Grab delivery status mapping
INT-064 Implement Grab webhook tests
INT-065 Implement Cellcard Top-Up adapter if required
INT-066 Implement Smart Top-Up adapter if required
INT-067 Implement generic pinless adapter contract
INT-068 Implement Top-Up reference persistence
INT-069 Implement duplicate Top-Up lookup
INT-070 Implement Business Central adapter
INT-071 Implement topUpBalance mapping
INT-072 Implement ERP duplicate lookup
INT-073 Implement ERP async sync consumer
INT-074 Implement ERP reconciliation
INT-075 Implement Legacy SQL Server adapter
INT-076 Enforce read-only mode where possible
INT-077 Implement stored procedure adapter
INT-078 Implement sp_api_IC_Topup adapter if required
INT-079 Implement legacy member adapter
INT-080 Implement legacy order/reporting adapter
INT-081 Add legacy-query load limits
INT-082 Implement OData adapter if required
INT-083 Isolate OData filter/expand logic
INT-084 Implement SOAP adapter if required
INT-085 Implement XML security
INT-086 Implement SFTP adapter if required
INT-087 Implement SFTP host-key verification
INT-088 Implement file checksum/archive
INT-089 Create polling_state
INT-090 Implement generic poller
INT-091 Implement watermark persistence
INT-092 Implement overlap/dedupe
INT-093 Implement poller locking
INT-094 Implement poller metrics
INT-095 Create import_batches
INT-096 Create import_rows
INT-097 Implement batch staging
INT-098 Implement data-quality validation
INT-099 Implement quarantine
INT-100 Implement partial batch policy
INT-101 Implement processed_events
INT-102 Implement integration Outbox
INT-103 Create reconciliation tables
INT-104 Implement reconciliation runner
INT-105 Implement missing-record checks
INT-106 Implement status mismatch checks
INT-107 Implement amount/currency checks
INT-108 Implement duplicate/reference mismatch checks
INT-109 Implement controlled repair/replay
INT-110 Implement integration status admin API
INT-111 Implement request history admin API
INT-112 Implement manual retry
INT-113 Implement manual replay
INT-114 Implement mapping admin API
INT-115 Implement reconciliation admin API
INT-116 Add RBAC for retry/replay/remap
INT-117 Implement integration audit
INT-118 Implement typed configuration
INT-119 Add startup validation
INT-120 Add integration enable/disable
INT-121 Add partner maintenance state
INT-122 Integrate Secret Manager
INT-123 Add key rotation support
INT-124 Add certificate expiry monitoring
INT-125 Implement liveness/readiness/dependency health
INT-126 Implement partner health endpoint
INT-127 Implement partner health metrics
INT-128 Implement request metrics
INT-129 Implement webhook metrics
INT-130 Implement polling metrics
INT-131 Implement reconciliation metrics
INT-132 Implement structured logging
INT-133 Implement OpenTelemetry tracing
INT-134 Implement dashboard
INT-135 Implement alerts
INT-136 Write partner outage runbook
INT-137 Write auth failure runbook
INT-138 Write webhook signature runbook
INT-139 Write webhook replay-storm runbook
INT-140 Write legacy DB outage runbook
INT-141 Write UNKNOWN runbook
INT-142 Write mapping-missing runbook
INT-143 Write reconciliation runbook
INT-144 Write poller-stalled runbook
INT-145 Write certificate-expiry runbook
INT-146 Write DLQ backlog runbook
INT-147 Implement backup
INT-148 Implement restore procedure
INT-149 Implement DR procedure
INT-150 Implement Strangler routing abstraction
INT-151 Implement canonical contract before legacy replacement
INT-152 Implement Shadow Read
INT-153 Implement Dual Read fallback if approved
INT-154 Implement cutover feature flags
INT-155 Implement canary routing
INT-156 Implement rollback tracking
INT-157 Define legacy decommission checks
INT-158 Implement mapper tests
INT-159 Implement status mapping tests
INT-160 Implement adapter contract tests
INT-161 Implement webhook tests
INT-162 Implement idempotency tests
INT-163 Implement timeout tests
INT-164 Implement UNKNOWN tests
INT-165 Implement retry tests
INT-166 Implement polling tests
INT-167 Implement batch import tests
INT-168 Implement reconciliation tests
INT-169 Implement legacy adapter tests
INT-170 Implement Strangler tests
INT-171 Implement security tests
INT-172 Implement load tests
INT-173 Implement backpressure tests
INT-174 Implement restore/replay tests
INT-175 Complete integration documentation
INT-176 Complete mapping documentation
INT-177 Complete status/error mapping docs
INT-178 Complete security docs
INT-179 Complete ADRs/policy freeze
INT-180 Phase 19 exit review
```

---

# 295. Acceptance — Boundary

The team can demonstrate:

```text
core services contain no provider DTOs
core services contain no legacy SQL table knowledge
core services do not branch on raw partner status codes
```

---

# 296. Acceptance — Canonical Contracts

For every integration operation:

```text
input
output
errors
statuses
timestamps
money
references
```

are expressed in canonical platform language.

---

# 297. Acceptance — Reference Mapping

Given any external reference, the team can answer:

```text
which external system?
which entity type?
which internal entity?
was it ever remapped?
who changed it?
```

---

# 298. Acceptance — Store Mapping

`bc_outlet_no`/branch/store code maps to canonical:

```text
store_id
```

without leaking into Catalog/Order domain logic.

---

# 299. Acceptance — Guest Sentinel

Core guest:

```text
is_guest = true
```

Legacy boundary may emit:

```text
GUEST
99999999
```

only when required.

---

# 300. Acceptance — Outbound Idempotency

Retry the same external side effect:

```text
after timeout
after worker crash
after Kafka replay
after manual retry
```

Expected:

```text
no duplicate external transaction
```

when the partner/reference contract allows exactly-once business behavior.

---

# 301. Acceptance — UNKNOWN

Simulate:

```text
external side effect succeeds
response lost
```

System must:

```text
record UNKNOWN
stop blind retry
resolve by query/reference/callback/reconciliation
```

---

# 302. Acceptance — Webhook Authentication

Invalid signature:

```text
never reaches domain processing
```

and is:

```text
rejected
audited
counted
```

---

# 303. Acceptance — Webhook Duplicate

Same provider event delivered repeatedly:

```text
one canonical processing effect
provider-compatible acknowledgement
```

---

# 304. Acceptance — Webhook Order

Out-of-order provider callbacks do not force illegal domain state transitions.

Owning domain remains authoritative.

---

# 305. Acceptance — Legacy DB Isolation

No new business service directly connects to the legacy DB for capability covered by the ACL.

---

# 306. Acceptance — ERP Top-Up

A successful canonical Top-Up can be posted asynchronously to ERP with:

```text
stable transaction reference
duplicate detection
attempt history
retry
reconciliation
```

---

# 307. Acceptance — Top-Up Providers

CELLCARD/SMART/provider-specific codes remain in adapters.

Wallet receives only canonical result.

---

# 308. Acceptance — Polling Recovery

Restarting poller:

```text
does not lose records
does not create duplicate effects
```

because durable watermark + overlap + dedupe are used.

---

# 309. Acceptance — Reconciliation

Integration can detect at least:

```text
missing external
missing internal
status mismatch
amount mismatch
currency mismatch
duplicate external
reference mismatch
```

---

# 310. Acceptance — No Silent Repair

Mismatch resolution creates:

```text
audit trail
corrective action
or controlled replay
```

rather than hidden direct mutation.

---

# 311. Acceptance — Strangler

Caller depends on canonical contract.

Legacy implementation can be replaced behind it without changing caller contract.

---

# 312. Acceptance — Canary

Traffic can be safely routed to:

```text
legacy
new
```

for a bounded cohort/store/percentage with observability.

---

# 313. Acceptance — Rollback

Rollback plan identifies:

```text
where authoritative writes occurred
how to reconcile
what traffic may return safely
```

---

# 314. Acceptance — Security

The team can answer:

```text
where partner secrets live
how they rotate
how webhooks are verified
how SSRF/XXE are blocked
how raw payloads are protected
```

---

# 315. Acceptance — Restore

After integration DB restore:

```text
pending requests are not blindly resent
UNKNOWN is reconciled
poller cursors are recovered
webhooks remain deduped
ERP posting is not duplicated
```

---

# 316. Acceptance — Operations

Operators can answer:

```text
Which partner is unhealthy?
How old is the backlog?
Which requests are UNKNOWN?
Is a poller stalled?
Which mapping is missing?
Are reconciliation mismatches growing?
```

without direct data surgery.

---

# 317. Phase 19 Completion Tree

```text
PHASE 19 — INTEGRATION / ACL

├── Boundary / Ownership                     ✅
├── Canonical Models                         ✅
├── External DTO Isolation                   ✅
├── Mapping Standards                        ✅
├── Reference Mapping                        ✅
│   ├── Store
│   ├── Product
│   ├── Customer
│   └── Transaction
├── Status Mapping                           ✅
├── Date / Time Normalization                ✅
├── Money Normalization                      ✅
├── Sentinel Containment                     ✅
├── Guest Translation                        ✅
├── REST Adapter                             ✅
├── OData Adapter                            ✅
├── SOAP Adapter                             ✅
├── File / SFTP                              ✅
├── Legacy DB Adapter                        ✅
├── Stored Procedure Adapter                 ✅
├── ERP / Business Central                   ✅
├── Delivery Partner                         ✅
├── Top-Up Providers                         ✅
├── Durable Outbound Requests                ✅
├── Request Attempts                         ✅
├── Timeout / Retry                          ✅
├── Idempotency                              ✅
├── UNKNOWN Outcome                          ✅
├── Circuit Breaker                          ✅
├── Bulkhead / Rate Limiting                 ✅
├── Backpressure                             ✅
├── DLQ / Replay                             ✅
├── Webhook Authentication                   ✅
├── Webhook Dedupe                           ✅
├── Fast Acknowledgement                     ✅
├── Out-of-Order Webhooks                    ✅
├── Event Ownership                          ✅
├── Data Synchronization                     ✅
├── Source of Truth                          ✅
├── CDC / Polling                            ✅
├── Batch Import / Quarantine                ✅
├── Environment / Secrets                    ✅
├── PostgreSQL Schema                        ✅
├── Typed REST / gRPC Contracts              ✅
├── Error Taxonomy                           ✅
├── Security                                 ✅
├── Reconciliation                           ✅
├── Metrics / Alerts / Dashboard             ✅
├── Logging / Tracing                        ✅
├── Runbooks                                 ✅
├── Backup / Restore / DR                    ✅
├── Flyway                                   ✅
├── Strangler Migration                      ✅
├── Shadow Read / Canary                     ✅
├── Rollback / Decommission                  ✅
├── Clean Architecture                       ✅
├── Testing / Load / Failure                 ✅
└── Redis Handoff                            ✅
```

---

# 318. Roadmap Handoff

Architecture PART 20 next discusses:

```text
PART 21 — Service Communication
```

but Service Communication has already been implemented in:

```text
PHASE 13
```

of the official implementation roadmap.

Therefore the next implementation document is:

```text
PHASE 20 — Redis / Caching
```

---

# 319. Phase 20 Relationship

Redis may later optimize Integration for:

```text
short-lived reference caches
rate limiting
provider-health cache
mapping cache where justified
distributed coordination only where safe
```

but Integration correctness must remain based on:

```text
PostgreSQL
Kafka
stable references
idempotency
reconciliation
```

---

# 320. Redis Must Not Become Integration Truth

Do not make Redis authoritative for:

```text
external reference mapping
integration request lifecycle
webhook dedupe that must survive cache loss
polling watermark
reconciliation
external transaction state
```

---

# 321. Final Phase 19 Principle

Outbound:

```text
Canonical Request
      ↓
Integration Port
      ↓
Durable Intent / Idempotency
      ↓
Provider Adapter
      ↓
External System
      ↓
Canonical Result
      ↓
Owning Domain
```

Inbound:

```text
External Webhook
      ↓
Authenticate
      ↓
Replay Protection
      ↓
Deduplicate
      ↓
Persist Receipt
      ↓
Map to Canonical Integration Fact
      ↓
Owning Domain
```

Migration:

```text
Canonical Contract
      ↓
Legacy ACL
      ↓
Legacy System
      ↓
Canary / Reconcile
      ↓
New Implementation
      ↓
Remove Legacy Dependency
```

The most important implementation rules are:

```text
External models do not leak into core domains.
Canonical language belongs to the platform.
Provider-specific code stays inside adapters.
Provider DTOs never enter Domain directly.
Legacy table/procedure names remain inside legacy adapters.
Sentinel values remain at the boundary.
Guest sentinels do not become new-domain identity rules.
External references are explicit and stable.
Reference remapping is controlled and audited.
Owning domains define canonical business statuses.
Integration translates statuses but does not invent domain lifecycle.
Money and timestamps are normalized explicitly.
Every external side effect uses a stable business reference.
Retries require idempotency or safe status lookup.
Timeout does not always mean failure.
UNKNOWN outcomes are first-class and reconciled.
Webhooks are authenticated, replay-protected, deduplicated, and durably received.
Out-of-order callbacks do not bypass domain state machines.
Integration does not forge domain-owned events.
Legacy DB access is isolated and temporary.
CDC is not automatically a domain-event stream.
Polling uses durable watermarks and overlap/deduplication.
Invalid imports are quarantined, not silently dropped.
Every synchronized fact has an explicit source of truth.
Bidirectional synchronization requires explicit conflict ownership.
Integration discrepancies are reconciled, not hidden.
Core services never write external/legacy databases directly.
Strangler migration replaces implementation behind stable canonical contracts.
Shadow reads and canaries build confidence before cutover.
Rollback must avoid split-brain authority.
Legacy dependencies are removed only after traffic/data/reconciliation criteria pass.
Secrets and certificates remain externalized and rotatable.
Restore/replay never blindly repeats external side effects.
Redis may optimize later but never becomes authoritative integration state.
```

---

**End of PHASE 19 — Integration / Anti-Corruption Layer**
