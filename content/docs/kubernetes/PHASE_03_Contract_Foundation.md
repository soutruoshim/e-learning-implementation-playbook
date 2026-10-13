---
title: "PHASE 03 — Contract Foundation"
---

# PHASE 03 — Contract Foundation

> **Purpose:** Define and implement the shared contract standards used by clients, gateways, microservices, Kafka producers/consumers, and external integration boundaries.
>
> **Previous Phase:** Phase 02 — Shared Engineering Standards
>
> **Next Phase:** Phase 04 — Identity Service
>
> **Primary Architecture Basis:** PART 05 — Contracts, PART 21 — Service Communication, PART 23 — Kafka / Event Architecture, with security and testing rules inherited from PART 06 and PART 25.
>
> **Status:** Contract Architecture / Implementation Standard

---

# 1. Phase 3 Goal

Phase 1 established:

```text
Project Foundation
```

Phase 2 established:

```text
How code inside every service is structured.
```

Phase 3 establishes:

```text
How systems communicate with each other.
```

This phase defines concrete standards for:

```text
Public REST contracts
Internal REST contracts
Internal gRPC contracts
Protobuf
Kafka events
Kafka commands
Command contracts
Query contracts
Error contracts
Pagination
Authentication metadata
Authorization requirements
Request IDs
Correlation IDs
Trace metadata
Idempotency
Webhook contracts
Versioning
Backward compatibility
Contract ownership
Contract lifecycle
Contract testing
Schema compatibility
Documentation
Governance
```

The central rule is:

```text
A contract is a promise between systems.
```

A good contract must be:

```text
Explicit
Stable
Versioned
Secure
Observable
Testable
Backward-compatible
Owned
```

---

# 2. Contract Foundation Architecture

The platform communication model is:

```text
Public Clients
     ↓
    REST
     ↓
API Gateway
     ↓
Microservices
     ↕
REST / gRPC
     ↓
Kafka
     ↓
Asynchronous Consumers
```

All communication styles must use consistent standards for:

```text
Identity
Errors
Idempotency
Tracing
Versioning
Compatibility
Data representation
Ownership
Security
Reliability
```

---

# 3. Contract Repository Structure

Phase 1 already created:

```text
contracts/
```

Phase 3 makes it concrete.

Recommended:

```text
contracts/
│
├── README.md
│
├── openapi/
│   ├── identity/
│   │   └── v1/
│   │       └── identity-api.yaml
│   ├── customer/
│   │   └── v1/
│   │       └── customer-api.yaml
│   ├── catalog/
│   │   └── v1/
│   │       └── catalog-api.yaml
│   ├── ordering/
│   │   └── v1/
│   │       └── ordering-api.yaml
│   └── ...
│
├── protobuf/
│   ├── common/
│   │   └── v1/
│   │       └── common.proto
│   ├── wallet/
│   │   └── v1/
│   │       └── wallet.proto
│   ├── inventory/
│   │   └── v1/
│   │       └── inventory.proto
│   └── ...
│
├── events/
│   ├── common/
│   │   └── event-envelope-v1.*
│   ├── ordering/
│   │   └── v1/
│   ├── payment/
│   │   └── v1/
│   ├── wallet/
│   │   └── v1/
│   ├── loyalty/
│   │   └── v1/
│   └── ...
│
├── commands/
│   ├── ordering/
│   ├── payment/
│   └── wallet/
│
├── schemas/
│   ├── json/
│   └── registry/
│
├── errors/
│   └── error-catalog.md
│
├── catalogs/
│   ├── rest-api-catalog.md
│   ├── grpc-catalog.md
│   ├── event-catalog.md
│   ├── topic-catalog.md
│   └── ownership-matrix.md
│
└── tests/
    ├── openapi/
    ├── protobuf/
    ├── events/
    └── compatibility/
```

Actual file extensions for Kafka schema artifacts depend on the selected schema format.

Do not invent multiple schema formats without a decision.

---

# 4. Contract Ownership

Every published contract must have one owning team/service.

Examples:

```text
Identity REST API
Owner: identity-service

Wallet gRPC API
Owner: wallet-service

OrderCompleted event
Owner: ordering-service

PaymentCaptured event
Owner: payment-service
```

Ownership means the owner controls:

```text
Semantic meaning
Schema
Version
Compatibility
Documentation
Deprecation
Security classification
Change approval
```

Consumers do not redefine the producer's contract meaning.

---

# 5. Contract Classification

Every interaction must be classified as one of:

```text
Command
Query
Event
Response
Webhook
Streaming message
Batch/file contract
```

Core categories:

```text
Command
  = request to change state

Query
  = request for information

Event
  = business fact that already happened
```

Do not blur these semantics.

---

# 6. Synchronous vs Asynchronous Decision

Use synchronous communication when:

```text
caller cannot proceed without the answer
```

Examples:

```text
Can inventory be reserved?
Is coupon valid now?
Did payment authorize?
What is current catalog price?
```

Use asynchronous communication when:

```text
caller's core transaction is already valid
and downstream processing may happen later
```

Examples:

```text
OrderCompleted → Loyalty
OrderCompleted → Mission
OrderReady → Notification
WalletTopUpCompleted → Mission
RewardAssigned → Notification
```

Do not choose REST, gRPC, or Kafka based only on developer preference.

Choose based on business semantics.

---

# 7. Avoid Synchronous-by-Default

Do not make every service call another service synchronously just because REST is simple.

Long synchronous chains introduce:

```text
latency multiplication
availability multiplication
failure propagation
tight coupling
```

Example to avoid:

```text
Gateway
  ↓
Order
  ↓
Customer
  ↓
Catalog
  ↓
Promotion
  ↓
Inventory
  ↓
Payment
  ↓
Wallet
  ↓
Loyalty
```

unless every step is truly required for the immediate operation.

---

# 8. Avoid Event-Driven-by-Default

Do not use Kafka for every query.

Example:

```text
Get current product price
```

is naturally synchronous.

Event-driven architecture does not mean:

```text
everything uses Kafka
```

---

# 9. Contract Metadata Standard

Every contract document should identify:

```text
Name
Type
Owner
Version
Status
Purpose
Producer/Provider
Consumers
Authentication
Authorization
Idempotency
Timeout/deadline
Retry semantics
Error semantics
Observability metadata
Compatibility policy
Data classification
Created date
Updated date
Deprecation date if applicable
Sunset date if applicable
```

---

# 10. Contract Lifecycle

Contract lifecycle states:

```text
DRAFT
REVIEW
ACTIVE
DEPRECATED
RETIRED
```

Meaning:

## DRAFT

```text
Still being designed.
No consumer should depend on it.
```

## REVIEW

```text
Ready for architecture/security/consumer review.
```

## ACTIVE

```text
Supported for normal use.
```

## DEPRECATED

```text
Still supported temporarily.
New consumers should avoid it.
Replacement is documented.
```

## RETIRED

```text
No longer supported.
```

---

# 11. Contract Versioning Principle

Version:

```text
external behavior
```

not:

```text
service implementation release
```

Example:

```text
/api/v1/orders
```

Service binary might be:

```text
ordering-service 4.7.2
```

These are separate concepts.

---

# 12. Public REST API Standard

Preferred path style:

```text
/api/v1/<resource>
```

Examples:

```text
/api/v1/orders
/api/v1/customers
/api/v1/catalog/products
/api/v1/wallets
/api/v1/rewards
/api/v1/missions
```

Use resource-oriented nouns.

Avoid implementation naming:

```text
/api/order-service-1.4.2/orders
```

---

# 13. REST Resource Naming

Prefer:

```text
GET    /api/v1/orders
GET    /api/v1/orders/{order_id}
POST   /api/v1/orders
PATCH  /api/v1/orders/{order_id}
```

For meaningful domain actions:

```text
POST /api/v1/orders/{order_id}/cancel
POST /api/v1/payments/{payment_id}/refund
POST /api/v1/wallets/{wallet_id}/reserve
```

Do not force every domain action into generic CRUD when that reduces clarity.

---

# 14. HTTP Method Standard

General intent:

```text
GET
  read/query

POST
  create resource or execute state-changing command

PUT
  full replacement where contract explicitly uses replacement semantics

PATCH
  partial update

DELETE
  delete/cancel when resource semantics truly match deletion
```

Do not use GET for state-changing operations.

---

# 15. REST JSON Naming Convention

Use:

```text
snake_case
```

Example:

```json
{
  "order_id": "ORD001",
  "customer_id": "CUS001",
  "created_at": "2026-10-11T09:30:00Z"
}
```

Avoid mixing:

```text
orderId
order_id
OrderID
```

inside one API family.

---

# 16. REST Date/Time Standard

Use:

```text
ISO 8601
```

Example:

```text
2026-10-11T09:30:00Z
```

Timezone-sensitive business values must document timezone semantics.

Avoid ambiguous values:

```text
11/10/2026
```

---

# 17. REST Money Standard

Recommended representation:

```json
{
  "amount": "12.50",
  "currency": "USD"
}
```

Alternative allowed if standardized across an API family:

```json
{
  "amount_minor": 1250,
  "currency": "USD"
}
```

Choose one style per API family.

Do not treat floating point as the authoritative money contract.

---

# 18. REST Enum Standard

Enums must have explicit documented values.

Example:

```text
PENDING
ACCEPTED
PREPARING
DONE
CANCELLED
```

Do not silently change the meaning of an existing enum value.

Adding new enum values may break strict consumers and must be compatibility-reviewed.

---

# 19. REST Nullability Standard

For every field define:

```text
Required?
Optional?
Nullable?
Conditionally present?
```

These are distinct.

Example:

```text
middle_name

required = no
nullable = yes
```

---

# 20. PATCH Standard

For PATCH:

```text
missing field
  = unchanged
```

Null behavior must be explicitly documented.

Example:

```json
{
  "phone_number": "+855..."
}
```

The contract must state:

```text
Does null clear the value?
Is null invalid?
Is field immutable?
```

---

# 21. REST Request Size / Array Limits

Every endpoint handling potentially large payloads should define limits.

Examples:

```text
maximum body size
maximum array item count
maximum string size
maximum file size
```

Validation should reject oversized input early.

---

# 22. REST Pagination Standard

Every list endpoint must define its pagination model.

Possible page style:

```text
page=1
per_page=25
```

Required documentation:

```text
Default page size
Maximum page size
Sort order
Stable ordering
Total count semantics if returned
```

Example:

```text
default = 25
maximum = 100
```

If cursor pagination is used, define:

```text
Cursor format
Cursor opacity
Ordering
Forward/backward behavior
Expiration if applicable
```

Do not mix pagination semantics randomly across endpoints.

---

# 23. Page Response Example

Conceptual:

```json
{
  "data": [
    {
      "order_id": "ORD001"
    }
  ],
  "page": {
    "number": 1,
    "size": 25,
    "total_items": 120,
    "total_pages": 5
  }
}
```

The exact platform envelope should be fixed before implementation.

---

# 24. Cursor Response Example

Conceptual:

```json
{
  "data": [
    {
      "order_id": "ORD001"
    }
  ],
  "page": {
    "next_cursor": "opaque-value",
    "has_more": true
  }
}
```

Do not expose internal SQL offsets, secrets, or raw serialized objects in opaque cursors.

---

# 25. REST Request ID

Every incoming request should support:

```http
X-Request-Id: req_123
```

Meaning:

```text
one technical request
```

If absent:

```text
gateway or service generates one
```

The response should preserve or return the effective request ID according to platform convention.

---

# 26. REST Correlation ID

Use:

```http
X-Correlation-Id: cor_123
```

Meaning:

```text
one business journey across requests/events
```

Downstream communication propagates the correlation ID.

---

# 27. Trace Context

Standard distributed trace metadata includes:

```text
traceparent
tracestate
```

Do not invent proprietary trace propagation if standard trace context already exists.

Correlation ID and trace ID serve related but different purposes.

---

# 28. Request ID vs Correlation ID

Example:

```text
Mobile Request
 request_id = req_1
 correlation_id = cor_100
        ↓
Order Service
 request_id = req_2
 correlation_id = cor_100
        ↓
Payment Service
 request_id = req_3
 correlation_id = cor_100
```

All requests may belong to one business correlation.

---

# 29. REST Authentication Contract

Public authenticated requests generally use:

```http
Authorization: Bearer <access_token>
```

Each endpoint must document:

```text
Authentication required?
Required token audience?
Required scope/role?
Resource ownership rule?
Business authorization rule?
```

Do not assume gateway authentication replaces service authorization.

---

# 30. REST Authorization Documentation

Example:

```text
GET /api/v1/orders/{order_id}

Authentication:
Required

Authorization:
USER
  → own order only

SUPPORT
  → support-authorized access

SYSTEM_ADMIN
  → privileged access according to policy
```

Authorization must be explicit in the contract documentation.

---

# 31. REST Idempotency Header

Important state-changing operations should support:

```http
Idempotency-Key: 6f6a8a1d-...
```

Recommended for operations such as:

```text
Order creation
Payment creation
Wallet top-up
Wallet reserve
Wallet capture
Refund
Reward claim
Webhook processing
```

---

# 32. Idempotency Contract

For every idempotent operation define:

```text
Key format
Key scope
Key expiration
Request hash behavior
Duplicate response behavior
Conflict behavior
Persistence expectation
```

Possible scope:

```text
(user_id, operation, idempotency_key)
```

---

# 33. Duplicate Idempotency Rules

Same key + same request:

```text
return original successful/pending result
```

Same key + different request:

```text
409 Conflict
IDEMPOTENCY_KEY_REUSED
```

Do not execute a new side effect when a conflicting key reuse is detected.

---

# 34. REST Error Envelope

All public REST errors should follow a consistent structure.

Recommended:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order was not found",
    "details": [],
    "request_id": "req_123",
    "correlation_id": "cor_123",
    "timestamp": "2026-10-11T09:30:00Z"
  }
}
```

---

# 35. Error Code Standard

Error codes must be:

```text
Stable
Machine-readable
Uppercase
Specific
Documented
```

Examples:

```text
VALIDATION_FAILED
UNAUTHENTICATED
ACCESS_DENIED
ORDER_NOT_FOUND
ORDER_STATE_CONFLICT
IDEMPOTENCY_KEY_REUSED
INSUFFICIENT_WALLET_BALANCE
PAYMENT_ALREADY_CAPTURED
MISSION_NOT_ELIGIBLE
COUPON_EXPIRED
RATE_LIMITED
DEPENDENCY_UNAVAILABLE
DEADLINE_EXCEEDED
```

Clients must not parse human-readable messages for program logic.

---

# 36. Error Message Standard

Rule:

```text
Code
  = machine contract

Message
  = human description
```

Messages may later be localized.

Codes remain stable unless intentionally versioned/deprecated.

---

# 37. Validation Error Contract

Example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed",
    "details": [
      {
        "field": "items[0].quantity",
        "code": "MUST_BE_POSITIVE",
        "message": "Quantity must be greater than zero"
      }
    ],
    "request_id": "req_123"
  }
}
```

Contract validation covers:

```text
Required fields
Types
Length
Format
Enum
Range
Identifier format
Timestamp format
Currency format
Array/object limits
```

Business invariants remain separate.

---

# 38. Conflict Error

Example:

```json
{
  "error": {
    "code": "ORDER_STATE_CONFLICT",
    "message": "Order cannot move from DONE to CANCELLED",
    "request_id": "req_123"
  }
}
```

Recommended HTTP status:

```text
409 Conflict
```

for state/version/idempotency conflicts where appropriate.

---

# 39. Rate Limit Error

Use:

```text
429 Too Many Requests
```

Response:

```http
Retry-After: 30
```

Body:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after_seconds": 30
  }
}
```

---

# 40. Error Catalog

Maintain:

```text
contracts/errors/error-catalog.md
```

Example:

| Code | HTTP | Type | Retryable | Meaning |
|---|---:|---|---|---|
| VALIDATION_FAILED | 400 | Contract | No | Invalid request |
| UNAUTHENTICATED | 401 | Security | No | Missing/invalid auth |
| ACCESS_DENIED | 403 | Security | No | Permission denied |
| ORDER_NOT_FOUND | 404 | Domain | No | Order missing |
| ORDER_STATE_CONFLICT | 409 | Domain | No | Invalid transition |
| IDEMPOTENCY_KEY_REUSED | 409 | Contract | No | Conflicting duplicate |
| INSUFFICIENT_WALLET_BALANCE | 422 | Domain | No | Balance insufficient |
| RATE_LIMITED | 429 | Security/Reliability | Yes after delay | Rate exceeded |
| DEPENDENCY_UNAVAILABLE | 503 | Technical | Usually | Dependency unavailable |
| DEADLINE_EXCEEDED | 504/transport equivalent | Technical | Maybe | Time budget exhausted |

Each service extends the catalog with owned errors.

---

# 41. Domain vs Technical Error

Domain example:

```text
INSUFFICIENT_WALLET_BALANCE
```

Technical example:

```text
DATABASE_UNAVAILABLE
```

Do not expose raw database/Kafka/provider exception strings.

Map them to stable contract-level errors.

---

# 42. Retryability Contract

Every error family should define whether retry is expected.

Example:

| Error | Retry? |
|---|---|
| VALIDATION_FAILED | No |
| ACCESS_DENIED | No |
| ORDER_NOT_FOUND | No |
| RATE_LIMITED | Yes, after delay |
| DEPENDENCY_UNAVAILABLE | Usually |
| DEADLINE_EXCEEDED | Depends on operation |
| IDEMPOTENCY_KEY_REUSED | No |

Retry semantics must consider idempotency.

---

# 43. REST OpenAPI Standard

Every public REST API must expose or generate OpenAPI.

Recommended runtime endpoints:

```text
/v3/api-docs
/swagger-ui
```

where operational/security policy permits.

The source-controlled contract should document:

```text
Request
Response
Headers
Authentication
Authorization
Errors
Examples
Enums
Pagination
Idempotency
Version
Owner
```

---

# 44. OpenAPI Source of Truth

Choose and document one workflow:

```text
Contract-first
```

or:

```text
Code-first with generated/validated artifact
```

Regardless of workflow, CI must validate the published OpenAPI artifact.

Do not let production behavior drift silently from documentation.

---

# 45. REST API Documentation Template

For every endpoint document:

```text
Name
Purpose
Method
Path
Owner
Version
Status

Authentication
Authorization

Headers

Path Parameters
Query Parameters

Request Body
Field Rules

Response Body
Success Codes

Error Codes
Retryability

Idempotency
Rate Limit

Consistency Expectation

Examples
```

---

# 46. Example REST Contract

```text
Name:
Create Order

Method:
POST

Path:
/api/v1/orders

Authentication:
Required

Authorization:
orders.create

Headers:
Authorization
Idempotency-Key
X-Request-Id
X-Correlation-Id

Idempotency:
Required

Success:
201 Created
```

Request:

```json
{
  "store_id": "STORE001",
  "fulfillment_type": "PICKUP",
  "items": [
    {
      "product_id": "PROD001",
      "quantity": 2
    }
  ]
}
```

Response:

```json
{
  "data": {
    "order_id": "ORD001",
    "status": "PENDING",
    "created_at": "2026-10-11T09:30:00Z"
  }
}
```

Potential errors:

```text
INVALID_PRODUCT
PRODUCT_UNAVAILABLE
INVALID_QUANTITY
IDEMPOTENCY_KEY_REUSED
STORE_NOT_AVAILABLE
```

---

# 47. REST Cache Contract

If a REST response is cacheable, document:

```text
Cache-Control
ETag
TTL
Vary
Invalidation expectations
Private/public nature
```

Do not accidentally cache:

```text
private customer data
tokens
financial state
security-sensitive response
```

---

# 48. ETag / Conditional Update

Selected APIs may use optimistic concurrency.

Example:

```http
ETag: "order-v7"
```

Client:

```http
If-Match: "order-v7"
```

The API contract must define conflict behavior.

---

# 49. File Upload Contract

For any file upload define:

```text
Allowed MIME types
Maximum size
Authorization
Malware/virus scanning expectation
Storage behavior
Retention
Error behavior
```

Large file uploads may use direct object-storage patterns where appropriate.

---

# 50. Bulk Operation Contract

Bulk APIs must define:

```text
all-or-nothing?
per-item success?
per-item errors?
maximum item count?
idempotency scope?
```

Example:

```json
{
  "results": [
    {
      "id": "1",
      "status": "SUCCESS"
    },
    {
      "id": "2",
      "status": "FAILED",
      "error_code": "INVALID_ITEM"
    }
  ]
}
```

Avoid ambiguous transactional semantics.

---

# 51. Long-Running Operation Contract

Long-running work should not rely on an unbounded HTTP connection.

Possible pattern:

```text
POST /api/v1/reports
       ↓
202 Accepted
       ↓
operation_id
       ↓
GET /api/v1/operations/{operation_id}
```

If used, document:

```text
operation states
polling rules
result retention
failure model
cancellation
authorization
```

---

# 52. Internal REST Contract

Internal REST contracts use the same principles:

```text
Versioned
Authenticated
Authorized
Bounded timeout
Documented
Observable
Tested
```

Do not treat "internal" as permission to create implicit/unstable contracts.

---

# 53. gRPC Use Case

gRPC is appropriate for selected internal synchronous calls where:

```text
low latency matters
strong typing is valuable
high call volume exists
explicit internal schemas are useful
```

Possible examples:

```text
Order → Wallet
Order → Payment
Order → Inventory
```

Do not use gRPC simply because it exists.

---

# 54. Protobuf Repository Structure

Example:

```text
contracts/protobuf/
├── common/
│   └── v1/
│       └── common.proto
│
├── wallet/
│   └── v1/
│       └── wallet.proto
│
├── inventory/
│   └── v1/
│       └── inventory.proto
│
└── payment/
    └── v1/
        └── payment.proto
```

---

# 55. Protobuf Package Versioning

Example:

```proto
package company.wallet.v1;
```

Generated Java package:

```proto
option java_package =
    "com.company.contract.wallet.v1";
```

Version belongs in the package.

---

# 56. gRPC Service Naming

Example:

```proto
service WalletService {

  rpc ReserveFunds(ReserveFundsRequest)
      returns (ReserveFundsResponse);

  rpc CaptureFunds(CaptureFundsRequest)
      returns (CaptureFundsResponse);

  rpc ReleaseFunds(ReleaseFundsRequest)
      returns (ReleaseFundsResponse);
}
```

RPC names should communicate business intent.

---

# 57. Protobuf Field Naming

Use:

```text
snake_case
```

Example:

```proto
string order_id = 1;
string customer_id = 2;
```

Generated client language conventions handle language-specific casing.

---

# 58. Protobuf Field Number Rule

Never reuse deleted field numbers.

Example:

```proto
message Payment {

  string payment_id = 1;

  string status = 2;

  reserved 3;
}
```

Field numbers are part of compatibility.

---

# 59. Protobuf Reserved Names

When removing an important field, reserve the field number and optionally the field name according to the chosen Protobuf evolution practice.

Purpose:

```text
prevent accidental semantic reuse
```

---

# 60. Protobuf Money Type

Choose one standard.

Option A:

```proto
message Money {
  int64 amount_minor = 1;
  string currency = 2;
}
```

Option B:

```proto
message Money {
  string amount = 1;
  string currency = 2;
}
```

Do not define multiple conflicting money representations without a deliberate contract decision.

---

# 61. Protobuf Timestamp

Use:

```proto
google.protobuf.Timestamp
```

Example:

```proto
google.protobuf.Timestamp created_at = 5;
```

---

# 62. gRPC Metadata Standard

Standard metadata may include:

```text
authorization
x-request-id
x-correlation-id
traceparent
idempotency-key
```

Propagate only metadata needed by the interaction.

Do not blindly forward user tokens through every internal hop.

---

# 63. gRPC Deadline

Every internal gRPC request must have a deadline.

Example concept:

```text
Wallet reserve deadline:
2 seconds
```

The exact number belongs to the interaction's reliability design.

Do not permit unbounded calls.

---

# 64. Deadline vs Timeout

Document both concepts consistently.

```text
Timeout
  = how long a specific call may wait

Deadline
  = latest time the overall request/work should complete
```

Downstream calls should respect the remaining upstream time budget.

---

# 65. gRPC Error Mapping

Use standard gRPC statuses.

Examples:

```text
INVALID_ARGUMENT
UNAUTHENTICATED
PERMISSION_DENIED
NOT_FOUND
ALREADY_EXISTS
FAILED_PRECONDITION
RESOURCE_EXHAUSTED
UNAVAILABLE
DEADLINE_EXCEEDED
INTERNAL
```

Add stable domain error metadata when required.

Do not return framework/provider exception strings as application errors.

---

# 66. gRPC Documentation Template

Document:

```text
Service
RPC
Purpose
Owner
Version
Status

Request
Response

Metadata
Deadline

Authentication
Authorization

Idempotency

Errors
Retryability

Compatibility
Observability
```

---

# 67. Synchronous Contract Definition of Done

Every synchronous REST/gRPC contract must have:

- [ ] Command/query semantics clear.
- [ ] Owner identified.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Timeout.
- [ ] Deadline where applicable.
- [ ] Retry policy.
- [ ] Idempotency if state changing.
- [ ] Error mapping.
- [ ] Request/correlation/trace metadata.
- [ ] Metrics/tracing expectation.
- [ ] Contract test.
- [ ] Runbook/operational ownership for critical dependencies.

---

# 68. Kafka Role

Kafka is the platform's durable asynchronous communication backbone.

Use it for:

```text
durable business facts
selected asynchronous commands
decoupled downstream processing
```

Kafka is not:

```text
a replacement for every synchronous query
a distributed ACID transaction
a shared database
business idempotency by itself
```

---

# 69. Kafka Event Semantics

Domain/integration events represent business facts.

Good:

```text
OrderCreated
OrderAccepted
OrderCancelled
OrderCompleted
PaymentCaptured
WalletTopUpCompleted
MissionCompleted
RewardAssigned
```

Avoid generic:

```text
OrderUpdated
EntityChanged
TableChanged
```

when consumers require business meaning.

---

# 70. Event Naming

Events should normally use:

```text
past tense
```

because they represent something that happened.

Examples:

```text
OrderCompleted
PaymentCaptured
RewardAssigned
```

Commands use imperative intent:

```text
ReserveWalletFunds
SendNotification
```

---

# 71. Event Ownership

The authoritative service produces the fact.

Examples:

```text
Ordering Service
  owns OrderCompleted

Payment Service
  owns PaymentCaptured

Wallet Service
  owns WalletTopUpCompleted

Mission/Loyalty owner
  owns MissionCompleted
```

Consumers must not fabricate another service's authoritative event.

---

# 72. Event Envelope

A platform event envelope should carry common metadata.

Conceptual example:

```json
{
  "event_id": "evt_123",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:30:00Z",
  "producer": "ordering-service",
  "correlation_id": "cor_123",
  "causation_id": "cmd_123",
  "data": {}
}
```

The exact canonical schema must be fixed and versioned.

---

# 73. Event Envelope Required Metadata

Recommended common fields:

```text
event_id
event_type
event_version
occurred_at
producer
correlation_id
causation_id where available
data
```

Optional metadata must remain deliberate.

Do not turn the envelope into a dumping ground.

---

# 74. Event ID

Every event should have a stable unique ID.

Purpose:

```text
consumer dedupe
audit
troubleshooting
replay
traceability
```

Replay should preserve event identity unless the replay semantics explicitly create a new event.

---

# 75. Event Version

Every published event schema must have a version.

Example:

```text
event_version = 1
```

Versioning strategy must define when:

```text
compatible field addition
new event version
new topic
consumer migration
```

is required.

---

# 76. Event Data Minimization

Include enough data to make the event useful.

Too little:

```text
consumer must make synchronous calls
```

Too much:

```text
coupling
privacy exposure
payload bloat
schema instability
```

Do not emit full database-row snapshots by default.

---

# 77. Event Status Values

Use canonical business values.

Prefer:

```text
COMPLETED
```

over legacy:

```text
1
```

when event consumers need a status.

Provider/legacy codes belong in integration adapters.

---

# 78. Kafka Topic Ownership

Every topic must define:

```text
Topic name
Purpose
Owner
Producers
Consumers
Partition key
Retention
Schema
Security/ACL
Retry/DLQ policy
PII classification
```

No anonymous/unowned topics.

---

# 79. Topic Catalog

Maintain:

```text
contracts/catalogs/topic-catalog.md
```

Example columns:

| Topic | Owner | Purpose | Key | Retention | Schema |
|---|---|---|---|---|---|
| order.events.v1 | ordering-service | Order business facts | order_id | Defined | versioned |
| payment.events.v1 | payment-service | Payment facts | payment_id | Defined | versioned |
| wallet.events.v1 | wallet-service | Wallet facts | wallet_id | Defined | versioned |

Actual final topic names belong to the platform's Kafka naming decision.

---

# 80. Partition Key Contract

Every Kafka contract must define the partition key.

Reason:

```text
ordering is only guaranteed within a partition
```

Examples:

```text
Order events
  key = order_id

Wallet events
  key = wallet_id

Payment events
  key = payment_id
```

Select keys based on required aggregate ordering.

---

# 81. Consumer Group Contract

Every consumer should document:

```text
consumer group name
logical purpose
owned service
event types
side effects
idempotency mechanism
retry policy
DLQ
```

Do not let unrelated applications accidentally share a consumer group.

---

# 82. Consumer Idempotency

At-least-once delivery is expected.

Therefore:

```text
duplicate transport delivery
must not create duplicate business effect
```

Mechanisms may include:

```text
processed event/inbox table
business unique constraint
idempotent command
stable external reference
```

---

# 83. Kafka Retry Contract

For a consumer failure define:

```text
retryable?
immediate retry count
delayed retry strategy
backoff
maximum attempts
DLQ threshold
alert threshold
```

Do not use infinite retry loops.

---

# 84. Kafka DLQ Contract

DLQ documentation must define:

```text
DLQ topic/name
conditions for DLQ
payload/schema
original event metadata
failure reason
operational owner
alert
replay procedure
retention
```

DLQ is not a place to forget failed events.

---

# 85. Replay Contract

Replay procedure must document:

```text
who may replay
source offset/time range
consumer mode
side-effect protection
event identity behavior
observability
audit
stop condition
```

Consumers with dangerous external side effects may need a replay-safe mode.

Example concept:

```text
LIVE
REPLAY_READ_MODEL
```

During read-model replay:

```text
notifications/external side effects disabled
```

where appropriate.

---

# 86. Event Retention

Every topic must define retention based on business/operational need.

Do not assume:

```text
Kafka retention = permanent business history
```

If historical events are needed beyond retention, define another source/reconstruction method.

---

# 87. Schema Registry

Where the selected Kafka serialization approach uses a registry, schemas must be:

```text
registered
versioned
compatibility-checked
owned
```

The exact registry/serialization format must be selected by the platform.

Do not silently mix incompatible serialization approaches.

---

# 88. Schema Compatibility

CI should validate new event schemas against the approved compatibility baseline.

Reject breaking changes.

Compatibility rules depend on the selected schema technology but must prevent unexpected consumer breakage.

---

# 89. Kafka Event Documentation Template

Document:

```text
Event Name
Event Type
Owner
Producer
Consumers
Topic
Partition Key
Event Version
Schema
Trigger
Delivery Guarantee
Ordering Guarantee
Idempotency
Retry
DLQ
Replay
Retention
PII Classification
Security / ACL
Observability
```

---

# 90. Kafka Event Definition of Done

- [ ] Event fact named clearly/past tense.
- [ ] Producer owner.
- [ ] Event ID.
- [ ] Version.
- [ ] Timestamp.
- [ ] Correlation ID.
- [ ] Causation ID when applicable.
- [ ] Partition key.
- [ ] Schema.
- [ ] Compatibility policy.
- [ ] Consumer idempotency.
- [ ] Retry policy.
- [ ] DLQ policy.
- [ ] Replay impact.
- [ ] Retention.
- [ ] Security classification.
- [ ] Observability.

---

# 91. Kafka Command Contract

Kafka may carry selected asynchronous commands.

Commands are different from events.

Command:

```text
Please do this.
```

Event:

```text
This happened.
```

Example command:

```text
SEND_NOTIFICATION
```

Example event:

```text
ORDER_COMPLETED
```

Do not publish a command and call it an event.

---

# 92. Command Envelope

Conceptual:

```json
{
  "command_id": "cmd_123",
  "command_type": "RESERVE_WALLET_FUNDS",
  "requested_at": "2026-10-11T09:00:00Z",
  "requested_by": "ordering-service",
  "correlation_id": "cor_123",
  "idempotency_key": "idem_123",
  "data": {
    "wallet_id": "WAL001",
    "amount": {
      "amount": "10.00",
      "currency": "USD"
    }
  }
}
```

---

# 93. Command Contract Documentation

Document:

```text
Command Name
Purpose
Owner
Requester
Handler
Required Data
Authorization
Idempotency
Validation
Possible Results
Possible Errors
Events Produced
Timeout/deadline expectation if relevant
Retry
DLQ if asynchronous
```

---

# 94. Kafka Command Definition of Done

- [ ] Command owner.
- [ ] Command ID.
- [ ] One logical handler.
- [ ] Idempotency.
- [ ] Authorization.
- [ ] Required validation.
- [ ] Retry policy.
- [ ] DLQ policy.
- [ ] Result semantics.
- [ ] Correlation metadata.
- [ ] Observability.

---

# 95. Query Contract Standard

Queries request information.

Examples:

```text
GetOrder
GetWalletBalance
GetCustomerProfile
ListRewards
GetMissionProgress
```

Queries should not intentionally produce business side effects.

---

# 96. Query Result

Read models may be optimized for the consumer.

Example:

```json
{
  "order_id": "ORD001",
  "status": "DONE",
  "store_name": "BROWN TK",
  "total": {
    "amount": "12.50",
    "currency": "USD"
  }
}
```

The query result does not have to mirror the write aggregate.

---

# 97. Query Documentation Template

Document:

```text
Query Name
Purpose
Requester
Data Owner
Filters
Pagination
Sorting
Authorization
Response Model
Caching
Consistency Level
Timeout
Error Behavior
```

---

# 98. Consistency Contract

Every important query should document consistency expectations.

Examples:

```text
Strongly consistent
Eventually consistent
Cached up to 60 seconds
Projection may lag up to 5 seconds
```

Especially important for:

```text
Wallet balance
Points balance
Order history
Mission progress
Analytics
```

---

# 99. Read-After-Write Contract

Where users expect immediate visibility after a state change, document:

```text
Will the next read see the write immediately?
Could projection/cache lag?
What should UI do?
```

Do not leave read consistency implicit.

---

# 100. Webhook Contract

Webhook receivers must assume retries.

Every webhook contract must define:

```text
Authentication/signature
Event type
Event ID/provider event ID
Timestamp
Replay/timestamp tolerance
Request schema
Retry behavior
Idempotency
Response status semantics
Observability
```

---

# 101. Webhook Authentication

Where supported verify:

```text
HMAC
public-key signature
provider token
timestamp tolerance
```

Do not trust source IP alone as primary authentication.

IP allow lists may be supplemental.

---

# 102. Webhook Idempotency

Store a provider event/reference ID.

If the same callback arrives again:

```text
return success
without duplicate business effect
```

Do not perform the financial/business side effect twice.

---

# 103. Webhook Response Strategy

Default semantic convention:

```text
2xx
  accepted/success

4xx
  invalid/non-retryable request

5xx
  temporary failure/retry may occur
```

Provider-specific behavior must be documented.

---

# 104. Webhook Out-of-Order Behavior

If provider callbacks can arrive out of order, document:

```text
valid state transitions
version/timestamp handling
stale callback behavior
reconciliation behavior
```

Never assume delivery order unless the provider guarantees it.

---

# 105. External / Legacy Contracts

External partner models must be isolated from core contracts.

External values such as:

```text
tranID
receipt_no
member_card_no
branch_code
documentNo
status = 1 / 2 / 3 / -1 / -2
```

should map to canonical platform concepts.

Do not expose legacy table/status language as the new platform's permanent contract unless intentionally selected.

---

# 106. Canonical Contract Principle

Flow:

```text
External Language
      ↓
Integration / ACL
      ↓
Canonical Platform Language
```

Example:

```text
provider status = 3
      ↓
ACL mapper
      ↓
OrderStatus = COMPLETED
```

Provider-specific meaning remains inside the adapter.

---

# 107. Service Communication Reliability Metadata

Every synchronous dependency contract should answer:

```text
What timeout?
What overall deadline?
Can it retry?
What errors retry?
How many retries?
What backoff?
Is the operation idempotent?
What circuit-breaker behavior?
What fallback?
Fail open or fail closed?
What happens if outcome is unknown?
```

These answers are part of the operational contract.

---

# 108. Retry Ownership

Avoid multiple layers multiplying retries.

Possible retry locations:

```text
client
gateway
service
service mesh
provider adapter
Kafka consumer
```

Document which layer owns retries for each interaction.

Example danger:

```text
client retry 3
× gateway retry 3
× service retry 3
= 27 attempts
```

Retry behavior must be bounded.

---

# 109. Critical vs Optional Dependency

For each dependency classify:

```text
Critical
Optional
```

Critical example:

```text
Payment authorization during checkout
```

Optional example:

```text
Notification after successful order
```

This influences:

```text
sync/async choice
fallback
failure response
SLO
alerting
```

---

# 110. Fail-Open / Fail-Closed Contract

For security/financial/business-critical rules explicitly document failure behavior.

Examples:

```text
Authorization dependency unavailable
  → fail closed

Optional recommendation service unavailable
  → fail open / omit recommendation
```

Never let sensitive failure behavior be accidental.

---

# 111. Security Classification

Every contract should classify sensitive data.

Possible categories:

```text
Public
Internal
Confidential
PII
Financial
Authentication Secret
Security Credential
```

Use the organization's final classification model.

The important rule is:

```text
sensitive fields are known and reviewed
```

---

# 112. Sensitive Contract Data

Avoid placing unnecessary sensitive values in:

```text
JWT
Kafka event
error response
log
trace attribute
metric label
URL/query parameter
```

Minimize:

```text
phone
email
device token
card/account values
provider credentials
access tokens
refresh tokens
OTP
```

---

# 113. REST Security Review

Every REST contract review checks:

- [ ] Authentication.
- [ ] Authorization.
- [ ] Resource ownership.
- [ ] Input validation.
- [ ] PII exposure.
- [ ] Rate limiting.
- [ ] Request-size limits.
- [ ] Idempotency.
- [ ] Error safety.
- [ ] Audit requirement.
- [ ] CORS where relevant.
- [ ] Sensitive caching prevented.

---

# 114. gRPC Security Review

Every gRPC contract review checks:

- [ ] Service identity.
- [ ] Authentication.
- [ ] Authorization scope.
- [ ] Deadline.
- [ ] Input validation.
- [ ] Message-size limit.
- [ ] Sensitive data.
- [ ] Trace/correlation propagation.
- [ ] Retry safety.
- [ ] Compatibility.

---

# 115. Kafka Security Review

Every Kafka contract review checks:

- [ ] Topic owner.
- [ ] Producer ACL.
- [ ] Consumer ACL.
- [ ] Sensitive data minimized.
- [ ] PII classification.
- [ ] Retention.
- [ ] Encryption/security expectations.
- [ ] Consumer idempotency.
- [ ] Replay consequences.
- [ ] Schema versioning.

---

# 116. Contract Compatibility Principle

Default evolution goal:

```text
new provider version
must not unexpectedly break existing consumers
```

Compatibility must be reviewed before merge.

---

# 117. Breaking Change Examples

Potential REST breaking changes:

```text
remove field
rename field
change type
make optional field required
change enum meaning
change status semantics
change authentication requirement unexpectedly
change pagination meaning
```

Potential Protobuf breaking changes:

```text
reuse field number
change incompatible field type
change semantic meaning silently
```

Potential Kafka breaking changes:

```text
remove required consumer field
change field meaning
change partition-key semantics
change event meaning while keeping same event type/version
```

---

# 118. Compatible Change Examples

Often compatible if consumer expectations permit:

```text
add optional response field
add optional event field
add new endpoint
add new event type
add new gRPC method
```

But compatibility still requires review.

Some strict clients may break on new enum values.

---

# 119. REST Version Upgrade

When an incompatible public REST change is required:

```text
/api/v1/...
        ↓
/api/v2/...
```

Do not create a new API version for every implementation change.

Version only when contract incompatibility or deliberate semantic evolution requires it.

---

# 120. Protobuf Version Upgrade

For incompatible semantic evolution, use a new contract package/version when necessary.

Example:

```proto
company.wallet.v1
```

to:

```proto
company.wallet.v2
```

Do not overwrite old semantics while keeping identical package/field assumptions.

---

# 121. Event Version Upgrade

Possible strategies:

```text
same event type + explicit event_version
new event type
new topic when operationally justified
```

The platform must choose consistently per event family.

Do not create new topics solely to avoid disciplined schema evolution.

---

# 122. Deprecation Standard

Deprecation documentation must identify:

```text
deprecated contract
replacement
deprecation date
consumer list
migration guidance
sunset date
owner
```

Do not remove an active contract without known consumer migration.

---

# 123. Contract Consumer Inventory

For important contracts maintain known consumers.

Example:

```text
OrderCompleted

Producer:
ordering-service

Consumers:
loyalty-service
mission-service/module
notification-service
analytics pipeline
```

Consumer inventory helps safely assess change impact.

---

# 124. Contract Change Workflow

Recommended:

```text
1. Identify owner.
2. Draft contract change.
3. Classify compatibility.
4. Identify consumers.
5. Review security/data exposure.
6. Update schema/specification.
7. Add examples.
8. Add/update contract tests.
9. Run compatibility checks.
10. Review with affected consumers if needed.
11. Merge.
12. Publish/version.
13. Deploy producer/provider compatibly.
14. Monitor adoption.
15. Deprecate old version later if needed.
```

---

# 125. Contract Review Roles

Depending on impact, review may include:

```text
Service owner
Consumer owner
Architecture
Security
QA
Platform
Data/privacy
Operations
```

Not every change requires every reviewer.

Critical financial/security/shared contracts require stronger review.

---

# 126. Contract Testing Strategy

Contract testing should verify:

```text
provider behavior
consumer expectations
schema compatibility
serialization
validation
errors
headers/metadata
auth requirements
versioning
```

It complements integration tests.

---

# 127. REST Contract Tests

Test:

```text
OpenAPI validity
request schema
response schema
required headers
validation errors
status codes
error envelope
pagination
idempotency behavior
authentication
authorization
```

---

# 128. gRPC Contract Tests

Test:

```text
proto compilation
field compatibility
request/response mapping
metadata
deadlines
status mapping
authorization
idempotency
```

---

# 129. Kafka Contract Tests

Test:

```text
event type
event version
required fields
partition key
schema compatibility
serialization/deserialization
no prohibited sensitive data
consumer handling of duplicate
unsupported version behavior
```

---

# 130. Schema Compatibility CI

CI should block:

```text
invalid OpenAPI
breaking Protobuf field reuse
event schema incompatibility
invalid schema syntax
missing required examples if mandated
contract lint failures
```

Contracts become enforceable, not only documentation.

---

# 131. OpenAPI CI Pipeline

Conceptual:

```text
OpenAPI files
   ↓
lint
   ↓
validate schema
   ↓
breaking-change comparison
   ↓
examples/tests
   ↓
publish artifact
```

Exact tooling is selected by the implementation team/platform.

---

# 132. Protobuf CI Pipeline

Conceptual:

```text
.proto files
   ↓
format/lint
   ↓
compile
   ↓
compatibility/breaking check
   ↓
generate test stubs if needed
   ↓
publish contract artifact
```

---

# 133. Kafka Schema CI Pipeline

Conceptual:

```text
event schema
   ↓
lint/validate
   ↓
compatibility check
   ↓
serialization test
   ↓
producer/consumer contract tests
   ↓
registry publish during controlled release
```

---

# 134. Contract Test Data

Examples must use:

```text
synthetic data
safe identifiers
fake tokens
fake customer data
```

Never place:

```text
real access token
production PII
production secret
real payment credential
```

inside contract examples.

---

# 135. Contract Catalog

Maintain a searchable catalog.

Recommended fields:

```text
Contract name
Type
Owner
Version
Status
Provider
Consumers
Repository path
Documentation link
Security classification
Deprecation date
```

---

# 136. REST API Catalog

Example:

| API | Owner | Version | Status | Consumers |
|---|---|---|---|---|
| Identity API | identity-service | v1 | ACTIVE | mobile, web |
| Customer API | customer-service | v1 | ACTIVE | mobile, support |
| Catalog API | catalog-service | v1 | ACTIVE | mobile, ordering |

Populate as services are implemented.

---

# 137. gRPC Catalog

Example:

| Service | RPC | Owner | Version | Caller |
|---|---|---|---|---|
| WalletService | ReserveFunds | wallet-service | v1 | ordering-service |
| InventoryService | ReserveStock | inventory-service | v1 | ordering-service |

Populate when contracts are approved.

---

# 138. Event Catalog

Example:

| Event | Owner | Version | Topic | Key | Consumers |
|---|---|---:|---|---|---|
| OrderCompleted | ordering-service | 1 | order.events.v1 | order_id | loyalty, mission, notification |
| WalletTopUpCompleted | wallet-service | 1 | wallet.events.v1 | wallet_id | mission, notification |

Actual topic names are finalized by Kafka governance.

---

# 139. Ownership Matrix

Maintain:

```text
contracts/catalogs/ownership-matrix.md
```

Example:

| Contract | Type | Owner | Approver |
|---|---|---|---|
| Identity REST v1 | REST | identity-service | Identity owner |
| Wallet gRPC v1 | gRPC | wallet-service | Wallet owner |
| OrderCompleted v1 | Event | ordering-service | Ordering owner |

---

# 140. Communication Matrix

Maintain a service interaction matrix.

Example:

| Caller | Callee | Purpose | Mode | Protocol | Critical? |
|---|---|---|---|---|---|
| Gateway | Customer | Profile query | Sync | REST | Yes |
| Ordering | Inventory | Reserve stock | Sync | gRPC/REST | Yes |
| Ordering | Payment | Authorize payment | Sync | gRPC/REST | Yes |
| Ordering | Loyalty | Order completed | Async | Kafka | No for checkout |
| Ordering | Notification | Order ready | Async | Kafka | No for order transition |

Protocol is finalized interaction by interaction.

---

# 141. Contract Observability

Every contract must define observability metadata.

Synchronous:

```text
request ID
correlation ID
trace context
latency
status/error
dependency metrics
```

Asynchronous:

```text
event/command ID
correlation ID
topic
partition where useful
consumer group
processing outcome
retry/DLQ status
lag
```

---

# 142. Correlation Across Kafka

Event:

```json
{
  "event_id": "evt_100",
  "correlation_id": "cor_100",
  "causation_id": "cmd_90"
}
```

Consumer:

```text
receives event
      ↓
preserves correlation
      ↓
new command/event records causation
```

This allows a business journey to be traced across async boundaries.

---

# 143. Contract Logging

Do not log full contract payloads by default.

Especially avoid logging:

```text
Authorization header
access token
refresh token
OTP
password
payment secrets
private customer data
provider secret
```

Log stable metadata instead.

---

# 144. Contract Metrics

Possible contract-level metrics:

```text
request rate
error rate
latency
deadline exceeded
retry count
rate-limit count
Kafka publish failures
consumer processing failures
consumer lag
DLQ count
schema incompatibility failures
```

Avoid high-cardinality labels such as:

```text
customer_id
order_id
event_id
```

---

# 145. REST Review Checklist

- [ ] Endpoint versioning.
- [ ] Resource/action semantics.
- [ ] Request schema.
- [ ] Response schema.
- [ ] JSON naming.
- [ ] Date/time format.
- [ ] Money format.
- [ ] Enum semantics.
- [ ] Nullability.
- [ ] Error envelope.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Resource ownership.
- [ ] Timeout.
- [ ] Retry policy where relevant.
- [ ] Idempotency header where required.
- [ ] Request/correlation IDs.
- [ ] Pagination for list.
- [ ] Payload limits.
- [ ] PII classification.
- [ ] Contract test.
- [ ] OpenAPI updated.
- [ ] Owner documented.

---

# 146. gRPC Review Checklist

- [ ] Proto owner.
- [ ] Package version.
- [ ] Stable field numbers.
- [ ] Reserved removed fields.
- [ ] Money representation.
- [ ] Timestamp representation.
- [ ] Deadlines.
- [ ] Status mapping.
- [ ] Domain error metadata if required.
- [ ] Service authentication.
- [ ] Authorization.
- [ ] Correlation/trace metadata.
- [ ] Idempotency.
- [ ] Message-size limit.
- [ ] Load-balancing expectation.
- [ ] Contract compatibility.
- [ ] Contract tests.

---

# 147. Kafka Review Checklist

- [ ] Topic owner.
- [ ] Event/command semantics.
- [ ] Authoritative producer.
- [ ] Event/command ID.
- [ ] Version.
- [ ] Correlation ID.
- [ ] Causation ID where applicable.
- [ ] Partition key.
- [ ] Retention.
- [ ] Schema.
- [ ] Compatibility.
- [ ] Consumer groups.
- [ ] Inbox/dedupe.
- [ ] Retry/DLQ.
- [ ] Replay procedure.
- [ ] PII/sensitive-data review.
- [ ] ACL/security.
- [ ] Lag alert.
- [ ] Contract tests.

---

# 148. Security Review Checklist

- [ ] TLS/mTLS requirements known.
- [ ] Caller identity defined.
- [ ] Authentication defined.
- [ ] Authorization scope defined.
- [ ] Resource authorization defined where relevant.
- [ ] Payload validation.
- [ ] Sensitive fields classified.
- [ ] No secret/token leakage.
- [ ] Rate limiting considered.
- [ ] Replay protection where relevant.
- [ ] Audit needs defined.
- [ ] Internal zero-trust assumption.

---

# 149. Reliability Review Checklist

- [ ] Sync/async choice justified.
- [ ] Timeout.
- [ ] Deadline.
- [ ] Retry owner.
- [ ] Retryability classification.
- [ ] Backoff.
- [ ] Max retries.
- [ ] Idempotency.
- [ ] Circuit breaker consideration.
- [ ] Bulkhead consideration.
- [ ] Backpressure consideration.
- [ ] Unknown-outcome behavior.
- [ ] Critical/optional dependency classified.

---

# 150. Compatibility Review Checklist

- [ ] Existing consumers identified.
- [ ] Change classified compatible/breaking.
- [ ] Removed fields reviewed.
- [ ] Type changes reviewed.
- [ ] Enum changes reviewed.
- [ ] Nullability changes reviewed.
- [ ] Auth changes reviewed.
- [ ] Pagination/ordering changes reviewed.
- [ ] Protobuf field-number reuse blocked.
- [ ] Kafka schema compatibility checked.
- [ ] Deprecation path documented if breaking.

---

# 151. Contract Documentation Quality

Every published contract should answer:

```text
What does this mean?
Who owns it?
Who calls/consumes it?
What data is required?
What can fail?
Can it retry?
Is it idempotent?
How is it secured?
How is it traced?
How does it evolve?
How is compatibility tested?
```

If these answers are missing, the contract is incomplete.

---

# 152. Contract Anti-Patterns

Reject:

```text
Undocumented JSON between services
Using database tables as contracts
Sharing JPA entities between services
Generic EntityChanged events
Provider-specific codes leaking into domains
No contract owner
No version
No timeout
Unbounded retry
No idempotency on financial side effects
Raw exception messages returned to clients
REST endpoint behavior that differs from OpenAPI
Reusing Protobuf field numbers
Changing event meaning without versioning
Kafka topic with no owner
Logging full tokens/payloads
Synchronous calls for optional downstream work
Kafka request/response for simple immediate queries without reason
```

---

# 153. Contract Source-of-Truth Rule

Database schema is not a cross-service contract.

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
another service's repository
```

---

# 154. Contract vs Domain Model

Transport contracts do not need to equal domain models.

Example:

REST:

```json
{
  "order_id": "ORD001",
  "status": "DONE"
}
```

Domain:

```text
OrderId
OrderStatus
```

Persistence:

```text
orders.id
orders.status
```

Each representation serves a different boundary.

---

# 155. Contract vs Legacy Model

Legacy:

```text
tranID
branch_code
status = -2
```

Canonical contract:

```text
transaction_id
store_id
status = CANCELLED
```

Mapping occurs inside the ACL/integration boundary.

---

# 156. Contract First Implementation Sequence

For a new cross-service capability:

```text
1. Identify business interaction.
2. Classify command/query/event.
3. Identify contract owner.
4. Decide sync vs async.
5. Select REST/gRPC/Kafka.
6. Define schema.
7. Define auth/authz.
8. Define idempotency.
9. Define timeout/retry/deadline.
10. Define errors.
11. Define correlation/trace metadata.
12. Define compatibility/version.
13. Add examples.
14. Add contract tests.
15. Review consumers.
16. Implement provider/producer.
17. Implement consumers.
```

Do not implement provider and consumer independently with undocumented assumptions.

---

# 157. Phase 3 Initial Concrete Artifacts

Before Identity implementation begins, create at least:

```text
contracts/README.md

contracts/openapi/
contracts/protobuf/
contracts/events/
contracts/errors/
contracts/catalogs/
contracts/tests/
```

And these initial shared documents:

```text
contracts/errors/error-catalog.md
contracts/catalogs/rest-api-catalog.md
contracts/catalogs/grpc-catalog.md
contracts/catalogs/event-catalog.md
contracts/catalogs/topic-catalog.md
contracts/catalogs/ownership-matrix.md
contracts/catalogs/communication-matrix.md
```

---

# 158. `contracts/README.md` Template

```text
# Platform Contracts

## Purpose

Contracts are promises between systems.

## Contract Types

- REST / OpenAPI
- gRPC / Protobuf
- Kafka Events
- Kafka Commands
- Webhooks

## Core Rules

- Every contract has an owner.
- Every published contract has a version.
- Breaking changes require compatibility review.
- Security and data classification are mandatory.
- State-changing operations define idempotency.
- Synchronous calls define timeout/deadline.
- Async events define partition key, retry, DLQ, and replay.
- Request/correlation/trace context must propagate.
- CI validates contract compatibility.

## Lifecycle

DRAFT
REVIEW
ACTIVE
DEPRECATED
RETIRED
```

---

# 159. REST Contract Template File

Recommended template:

```yaml
contract:
  name: ""
  owner: ""
  version: "v1"
  status: "DRAFT"

endpoint:
  method: ""
  path: ""
  purpose: ""

security:
  authentication: ""
  authorization: ""

reliability:
  timeout: ""
  retry: ""
  idempotency: ""

observability:
  request_id: true
  correlation_id: true
  tracing: true

compatibility:
  policy: ""

errors: []

examples: []
```

This is a documentation template, not necessarily the OpenAPI file itself.

---

# 160. Event Contract Template File

```yaml
event:
  name: ""
  owner: ""
  version: 1
  status: "DRAFT"

producer: ""

consumers: []

topic: ""

partition_key: ""

trigger: ""

delivery:
  guarantee: ""
  ordering: ""

idempotency:
  consumer_required: true

retry:
  policy: ""

dlq:
  policy: ""

replay:
  policy: ""

retention: ""

security:
  classification: ""
  acl: ""

observability:
  correlation_id: true
```

---

# 161. gRPC Contract Template File

```yaml
grpc:
  service: ""
  rpc: ""
  owner: ""
  version: "v1"
  status: "DRAFT"

purpose: ""

request: ""
response: ""

metadata:
  authorization: true
  request_id: true
  correlation_id: true
  traceparent: true

deadline: ""

authorization: ""

idempotency: ""

errors: []

retryability: ""

compatibility: ""
```

---

# 162. Contract Governance Rule — New REST Endpoint

A merge request adding a REST endpoint must include:

```text
OpenAPI change
error-code changes
auth/authz definition
idempotency decision
timeout/reliability decision
examples
contract tests
catalog update
```

where relevant.

---

# 163. Contract Governance Rule — New gRPC RPC

A merge request adding gRPC must include:

```text
.proto change
owner
deadline
auth/authz
error mapping
idempotency
compatibility test
catalog update
```

---

# 164. Contract Governance Rule — New Event

A merge request adding an event must include:

```text
schema
owner
topic
partition key
version
producer
known consumers
retry/DLQ impact
consumer idempotency expectation
retention
PII classification
catalog update
compatibility test
```

---

# 165. Contract Governance Rule — Breaking Change

A breaking contract change requires:

```text
impact analysis
consumer inventory
replacement/version plan
migration plan
deprecation timeline
compatibility evidence
owner approval
consumer coordination
```

Do not merge a breaking change simply because provider code compiles.

---

# 166. Definition of Done — REST Contract

- [ ] Owner.
- [ ] Version.
- [ ] Lifecycle status.
- [ ] Method/path.
- [ ] Purpose.
- [ ] Request schema.
- [ ] Response schema.
- [ ] Field required/nullable rules.
- [ ] Date/time rules.
- [ ] Money rules.
- [ ] Enum rules.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Resource ownership.
- [ ] Request ID.
- [ ] Correlation ID.
- [ ] Trace metadata.
- [ ] Idempotency when state-changing.
- [ ] Timeout/retry semantics.
- [ ] Error codes.
- [ ] Retryability.
- [ ] Pagination for list endpoints.
- [ ] Payload limit.
- [ ] PII classification.
- [ ] Examples.
- [ ] OpenAPI valid.
- [ ] Contract tests pass.
- [ ] Compatibility reviewed.
- [ ] Catalog updated.

---

# 167. Definition of Done — gRPC Contract

- [ ] Owner.
- [ ] Versioned package.
- [ ] Service/RPC name.
- [ ] Request message.
- [ ] Response message.
- [ ] Stable field numbers.
- [ ] Removed fields reserved.
- [ ] Money/time standards followed.
- [ ] Authentication.
- [ ] Authorization.
- [ ] Metadata.
- [ ] Deadline.
- [ ] Retryability.
- [ ] Idempotency.
- [ ] Error mapping.
- [ ] Message size considered.
- [ ] Proto lint/compile passes.
- [ ] Compatibility check passes.
- [ ] Contract tests pass.
- [ ] Catalog updated.

---

# 168. Definition of Done — Kafka Event

- [ ] Business fact name.
- [ ] Authoritative producer.
- [ ] Owner.
- [ ] Event ID.
- [ ] Event type.
- [ ] Event version.
- [ ] Timestamp.
- [ ] Correlation ID.
- [ ] Causation ID where relevant.
- [ ] Schema.
- [ ] Topic.
- [ ] Partition key.
- [ ] Ordering semantics.
- [ ] Delivery expectation.
- [ ] Known consumers.
- [ ] Consumer idempotency requirement.
- [ ] Retry policy.
- [ ] DLQ policy.
- [ ] Replay policy.
- [ ] Retention.
- [ ] PII classification.
- [ ] Topic ACLs.
- [ ] Schema compatibility passes.
- [ ] Contract tests pass.
- [ ] Event/topic catalogs updated.

---

# 169. Definition of Done — Webhook

- [ ] Provider/owner.
- [ ] Endpoint.
- [ ] Authentication/signature.
- [ ] Timestamp tolerance.
- [ ] Event/reference ID.
- [ ] Request schema.
- [ ] Validation.
- [ ] Idempotency.
- [ ] Retry semantics.
- [ ] Response code semantics.
- [ ] Duplicate behavior.
- [ ] Out-of-order behavior.
- [ ] Replay protection.
- [ ] Sensitive logging reviewed.
- [ ] Reconciliation behavior.
- [ ] Tests for duplicates/invalid signatures/timeouts.

---

# 170. Phase 3 Acceptance Test

Before moving to Identity Service, the team should be able to create and validate a small sample of every major contract type.

Minimum proof:

```text
REST
  ↓
valid OpenAPI v1
  ↓
request/response/error examples
  ↓
lint/validation pass
```

```text
gRPC
  ↓
sample v1 proto
  ↓
compile
  ↓
field/version rules pass
```

```text
Kafka
  ↓
sample event schema
  ↓
event envelope
  ↓
version
  ↓
partition key documented
  ↓
compatibility test
```

```text
Governance
  ↓
owner catalog
  ↓
error catalog
  ↓
communication matrix
```

The acceptance test does not require every future service contract to exist.

It proves the standards/tooling are ready.

---

# 171. Recommended Sample REST Contract

Use a harmless reference endpoint such as:

```text
GET /api/v1/reference/health-info
```

or create the first real Identity contract only after the standard itself is approved.

The key proof is:

```text
OpenAPI valid
error format consistent
headers defined
auth semantics defined
```

---

# 172. Recommended Sample gRPC Contract

Example:

```proto
syntax = "proto3";

package company.reference.v1;

option java_package =
    "com.company.contract.reference.v1";

import "google/protobuf/timestamp.proto";

service ReferenceService {

  rpc GetStatus(GetStatusRequest)
      returns (GetStatusResponse);
}

message GetStatusRequest {
  string request_id = 1;
}

message GetStatusResponse {
  string status = 1;
  google.protobuf.Timestamp checked_at = 2;
}
```

Purpose:

```text
prove proto compilation and compatibility tooling
```

not business functionality.

---

# 173. Recommended Sample Event

Conceptual:

```json
{
  "event_id": "evt_reference_001",
  "event_type": "REFERENCE_CREATED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:30:00Z",
  "producer": "reference-service",
  "correlation_id": "cor_reference_001",
  "data": {
    "reference_id": "REF001"
  }
}
```

This sample should be replaced by real domain contracts as implementation begins.

---

# 174. Contract Exit Criteria

Phase 3 is complete when the team can answer all of the following.

## REST

```text
How are public APIs named, versioned, validated, secured, and documented?
```

## gRPC

```text
How are internal synchronous contracts defined and evolved?
```

## Kafka

```text
What is the event envelope, topic ownership model, partition rule, and compatibility policy?
```

## Commands / Queries / Events

```text
Can every interaction be classified semantically?
```

## Errors

```text
Can clients handle failures using stable machine-readable codes?
```

## Idempotency

```text
Which operations require idempotency and what happens on duplicate/conflict?
```

## Tracing

```text
Can one business journey be traced across REST, gRPC, and Kafka?
```

## Security

```text
Does every contract define authentication, authorization, and sensitive-data expectations?
```

## Reliability

```text
Does every synchronous call define timeout/deadline/retry behavior?
```

## Kafka Reliability

```text
Does every event define partition key, consumer idempotency, retry, DLQ, replay, and retention?
```

## Compatibility

```text
Can a provider evolve without silently breaking consumers?
```

## Ownership

```text
Who owns each published contract?
```

## Testing

```text
Does CI validate schemas and compatibility?
```

If these are unclear:

```text
broad service integration is not ready
```

---

# 175. Phase 3 Final Result

When Phase 3 is complete:

```text
CONTRACT FOUNDATION
│
├── Contract Repository                     ✅
├── Contract Ownership                      ✅
├── Contract Lifecycle                      ✅
├── Compatibility Governance                ✅
│
├── REST / OpenAPI
│   ├── API Versioning                      ✅
│   ├── Resource Naming                     ✅
│   ├── JSON Naming                         ✅
│   ├── Date / Time                         ✅
│   ├── Money                               ✅
│   ├── Enum / Nullability                  ✅
│   ├── Pagination                          ✅
│   ├── Error Envelope                      ✅
│   ├── Idempotency                         ✅
│   ├── Request / Correlation IDs           ✅
│   ├── Authentication / Authorization      ✅
│   └── OpenAPI Validation                  ✅
│
├── gRPC / Protobuf
│   ├── Package Versioning                  ✅
│   ├── Field Number Rules                  ✅
│   ├── Money / Timestamp                   ✅
│   ├── Metadata                            ✅
│   ├── Deadlines                           ✅
│   ├── Error Mapping                       ✅
│   └── Compatibility Checks                ✅
│
├── Kafka
│   ├── Event Envelope                      ✅
│   ├── Event Naming                        ✅
│   ├── Ownership                           ✅
│   ├── Topic Catalog                       ✅
│   ├── Partition Key                       ✅
│   ├── Schema Versioning                   ✅
│   ├── Consumer Idempotency                ✅
│   ├── Retry / DLQ                         ✅
│   ├── Replay                              ✅
│   ├── Retention                           ✅
│   └── Schema Compatibility                ✅
│
├── Webhook Standard                        ✅
├── External / Legacy Canonical Boundary    ✅
│
├── Error Catalog                           ✅
├── API Catalog                             ✅
├── gRPC Catalog                            ✅
├── Event Catalog                           ✅
├── Topic Catalog                           ✅
├── Ownership Matrix                        ✅
├── Communication Matrix                    ✅
│
├── Contract Tests                          ✅
├── Compatibility CI                        ✅
├── Security Review                         ✅
├── Reliability Review                      ✅
└── Definition of Done                      ✅
```

---

# 176. Handoff to Phase 4

After Phase 3 is complete:

```text
PHASE 04 — Identity Service
```

Phase 4 will be the first real business-service implementation.

It should use all standards created so far:

```text
Phase 1
  Project foundation

Phase 2
  Shared engineering standards

Phase 3
  Contract foundation

        ↓

Phase 4
  Identity Service
```

Identity Service implementation will then include:

```text
Service project bootstrap
Domain model
User identity
Credentials
Registration
Login
Access tokens
Refresh tokens
Session management
Logout/revocation
Password reset
Roles
Permissions
Security events
Database schema
Flyway
REST contracts
Security configuration
Tests
Docker integration
Observability
Definition of Done
```

Do not skip Phase 3 contract rules when implementing Identity.

Identity becomes the first proof that the platform standards work in a real service.

---

**End of PHASE 03 — Contract Foundation**
