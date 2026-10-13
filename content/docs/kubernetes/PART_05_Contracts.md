---
title: "PART 05 — CONTRACTS"
---

# PART 05 — CONTRACTS

> **Document Role:** Defines the contract standards used between clients, services, and asynchronous consumers.  
> **Previous Part:** PART 04 — Clean + Hexagonal Architecture  
> **Next Part:** PART 06 — Security Architecture  
> **Status:** Architecture / Contract Standard  
> **Primary Stack:** REST, gRPC, Protobuf, Kafka, JSON  
> **Audience:** Backend engineers, architects, API engineers, mobile/web engineers, QA engineers, integration engineers, DevOps engineers.

---

# 227 — Purpose

Contracts define how systems communicate without exposing internal implementation details.

A contract must make it clear:

```text
What is sent?
What is returned?
What can fail?
How is the request authenticated?
How is the request traced?
How is compatibility maintained?
What guarantees are provided?
```

The contract layer must remain stable even when the internal implementation changes.

---

# 228 — Contract Types

The platform uses several contract types:

```text
Public REST Contracts
Internal gRPC Contracts
Kafka Event Contracts
Command Contracts
Query Contracts
Error Contracts
Authentication Contracts
Pagination Contracts
Idempotency Contracts
Tracing / Correlation Contracts
Versioning Contracts
```

Each contract has its own lifecycle.

Do not reuse one DTO everywhere.

---

# 229 — Contract Design Principles

All contracts should follow these principles:

1. Explicit.
2. Stable.
3. Versioned.
4. Backward-compatible where possible.
5. Independently testable.
6. Transport-specific.
7. Domain-informed but not domain-leaking.
8. Secure by default.
9. Observable.
10. Idempotency-aware.

---

# 230 — Public REST API Standards

Public APIs are intended for:

```text
Mobile applications
Web applications
Admin portals
Partner systems
External integrations where REST is appropriate
```

Base pattern:

```text
https://api.company.com/api/v1/...
```

Example:

```text
POST /api/v1/orders
GET  /api/v1/orders/{orderId}
GET  /api/v1/orders
PATCH /api/v1/orders/{orderId}/status
```

---

# 231 — REST Resource Naming

Use nouns.

Good:

```text
/orders
/payments
/wallets
/rewards
/missions
```

Avoid action-heavy URLs:

```text
/createOrder
/getOrder
/updateOrder
```

Actions may be acceptable when they represent explicit domain operations:

```text
POST /orders/{id}/cancel
POST /wallets/{id}/reserve
POST /payments/{id}/refund
```

---

# 232 — HTTP Method Rules

Use:

```text
GET     → Read
POST    → Create or execute non-idempotent domain action
PUT     → Full replacement when appropriate
PATCH   → Partial update
DELETE  → Delete/deactivate where domain allows
```

Do not use:

```text
GET
```

for operations that change state.

---

# 233 — HTTP Status Codes

Recommended mapping:

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
410 Gone
412 Precondition Failed
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
504 Gateway Timeout
```

---

# 234 — REST Request Structure

Example:

```json
{
  "store_id": "STORE001",
  "fulfillment_type": "PICKUP",
  "items": [
    {
      "product_id": "PROD001",
      "quantity": 2,
      "modifiers": [
        {
          "modifier_id": "MOD001"
        }
      ]
    }
  ]
}
```

Requests should be:

- Explicit.
- Validatable.
- Minimal.
- Transport-focused.

---

# 235 — REST Response Structure

Example:

```json
{
  "data": {
    "order_id": "ORD001",
    "order_number": "A10001",
    "status": "PENDING"
  },
  "meta": {
    "request_id": "req_123"
  }
}
```

For simple APIs, the outer envelope may be omitted if the organization standard says so.

Choose one convention and use it consistently.

---

# 236 — Resource Identifiers

Identifiers should be stable and opaque.

Examples:

```text
ORD_01H...
PAY_01H...
WAL_01H...
CUS_01H...
```

Avoid exposing database auto-increment IDs unless explicitly acceptable.

---

# 237 — REST Filtering

Use query parameters.

Example:

```text
GET /api/v1/orders?status=DONE&store_id=STORE001
```

Rules:

- Filter names must be documented.
- Unknown filters should be rejected or explicitly ignored by standard.
- Filters must not expose database column names accidentally.

---

# 238 — REST Sorting

Example:

```text
GET /api/v1/orders?sort=created_at:desc
```

Recommended allowed sort fields must be whitelisted.

Do not allow arbitrary SQL field names.

---

# 239 — REST Pagination

Preferred cursor pagination for large/live datasets:

```text
GET /api/v1/orders?limit=50&cursor=abc123
```

Response:

```json
{
  "data": [],
  "page": {
    "limit": 50,
    "next_cursor": "def456",
    "has_more": true
  }
}
```

For admin/reporting pages, offset pagination may be acceptable:

```text
page=1
per_page=25
```

---

# 240 — Pagination Rules

Define:

```text
Default page size
Maximum page size
Cursor encoding
Sort order
Stable ordering
```

Example:

```text
default limit = 25
max limit = 100
```

---

# 241 — REST Date and Time Format

Use ISO 8601.

Example:

```text
2026-10-11T09:30:00Z
```

Timezone-sensitive business values should document timezone semantics.

Avoid ambiguous formats:

```text
11/10/2026
```

---

# 242 — REST Money Format

Recommended:

```json
{
  "amount": "12.50",
  "currency": "USD"
}
```

or minor units:

```json
{
  "amount_minor": 1250,
  "currency": "USD"
}
```

Choose one standard per API family.

Do not use floating point as an authoritative contract assumption.

---

# 243 — REST Enum Rules

Use explicit documented values.

Example:

```text
PENDING
ACCEPTED
PREPARING
DONE
CANCELLED
```

Do not change enum meaning silently.

Adding enum values can be breaking for strict clients, so compatibility must be evaluated.

---

# 244 — REST Nullability

Every field must define whether it is:

```text
Required
Optional
Nullable
Conditionally present
```

These are not the same.

Example:

```text
middle_name:
optional = yes
nullable = yes
```

---

# 245 — REST Partial Updates

PATCH request example:

```json
{
  "phone_number": "+855..."
}
```

Rules:

- Missing field means unchanged.
- Null behavior must be defined.
- Validation remains enforced.

---

# 246 — REST Idempotency Header

For important state-changing operations:

```http
Idempotency-Key: 6f6a8a1d-...
```

Recommended for:

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

# 247 — REST Request ID

Every incoming request should have:

```http
X-Request-Id
```

If absent, gateway/service generates one.

This is technical tracing metadata.

---

# 248 — REST Correlation ID

For business journey tracing:

```http
X-Correlation-Id
```

A new request may create one if absent.

Downstream requests and events should propagate it.

---

# 249 — REST API Versioning

Preferred path versioning:

```text
/api/v1/orders
/api/v2/orders
```

Avoid putting implementation version in URL:

```text
/api/order-service-1.4.2/orders
```

Service version and API version are different concepts.

---

# 250 — REST OpenAPI Standard

Every public REST API must expose or generate an OpenAPI definition.

Recommended:

```text
/v3/api-docs
/swagger-ui
```

OpenAPI must document:

```text
Request
Response
Headers
Authentication
Errors
Examples
Enums
Pagination
Idempotency
```

---

# 251 — REST Contract Example: Create Order

Endpoint:

```text
POST /api/v1/orders
```

Headers:

```text
Authorization: Bearer <token>
Idempotency-Key: <key>
X-Correlation-Id: <optional>
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

Status:

```text
201 Created
```

Possible errors:

```text
INVALID_PRODUCT
PRODUCT_UNAVAILABLE
INVALID_QUANTITY
DUPLICATE_IDEMPOTENCY_KEY
STORE_NOT_AVAILABLE
```

---

# 252 — Internal gRPC Contract Standards

gRPC is preferred for some internal synchronous service calls where:

- Low latency matters.
- Strong typing is useful.
- High call volume exists.
- Internal service-to-service contracts need explicit schemas.

Possible examples:

```text
Order → Wallet
Order → Payment
Order → Inventory
```

---

# 253 — Protobuf Package Naming

Example:

```proto
package company.wallet.v1;
```

Use version in package.

Generated Java package may be:

```proto
option java_package = "com.company.contract.wallet.v1";
```

---

# 254 — Protobuf Service Naming

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

---

# 255 — Protobuf Field Number Rules

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

# 256 — Protobuf Field Naming

Use snake_case:

```proto
string order_id = 1;
string customer_id = 2;
```

Generated code will map to language conventions.

---

# 257 — Protobuf Money Type

Example:

```proto
message Money {
  int64 amount_minor = 1;
  string currency = 2;
}
```

or decimal string:

```proto
message Money {
  string amount = 1;
  string currency = 2;
}
```

Choose one standard.

---

# 258 — Protobuf Timestamp

Use:

```proto
google.protobuf.Timestamp
```

Example:

```proto
google.protobuf.Timestamp created_at = 5;
```

---

# 259 — gRPC Metadata

Standard metadata may include:

```text
authorization
x-request-id
x-correlation-id
traceparent
idempotency-key
```

Metadata propagation should be standardized.

---

# 260 — gRPC Deadlines

Every internal gRPC request must define a deadline.

Example:

```text
Wallet reserve deadline: 2 seconds
```

Do not allow unbounded calls.

---

# 261 — gRPC Error Mapping

Use standard gRPC status codes.

Example:

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

Add domain error metadata if needed.

---

# 262 — gRPC Error Detail Example

Conceptual payload:

```text
code: INSUFFICIENT_WALLET_BALANCE
message: Insufficient wallet balance
correlation_id: cor_123
```

Transport status:

```text
FAILED_PRECONDITION
```

---

# 263 — gRPC Contract Example: Reserve Wallet Funds

```proto
syntax = "proto3";

package company.wallet.v1;

service WalletService {
  rpc ReserveFunds(ReserveFundsRequest)
      returns (ReserveFundsResponse);
}

message ReserveFundsRequest {
  string wallet_id = 1;
  int64 amount_minor = 2;
  string currency = 3;
  string reference_id = 4;
  string idempotency_key = 5;
}

message ReserveFundsResponse {
  string reservation_id = 1;
  string status = 2;
}
```

---

# 264 — gRPC Compatibility Rules

Backward-compatible changes usually include:

```text
Adding new optional fields
Adding new RPC methods
Adding new enum values carefully
```

Potentially breaking:

```text
Removing fields
Changing field numbers
Changing field meaning
Changing scalar type incompatibly
Renaming RPC semantics
```

---

# 265 — Contract Repository Strategy

Recommended options:

```text
central-contracts repository
```

or per-domain contract repositories.

Example:

```text
contracts/
├── rest/
├── protobuf/
└── events/
```

Ownership must be clear.

---

# 266 — Kafka Event Contract Standards

Kafka integration events are public contracts between services.

Event naming:

```text
order.created
order.completed
payment.captured
wallet.topup.completed
points.earned
mission.completed
```

Versioning may be encoded in:

```text
schema
topic
event metadata
```

---

# 267 — Event Envelope

Recommended standard:

```json
{
  "event_id": "evt_01H...",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:00:00Z",
  "producer": "order-service",
  "correlation_id": "cor_123",
  "causation_id": "evt_prev",
  "data": {}
}
```

---

# 268 — Event Metadata

Recommended fields:

```text
event_id
event_type
event_version
occurred_at
producer
correlation_id
causation_id
tenant_id if applicable
trace_id if needed
```

---

# 269 — Event Data Rules

Event data should contain what consumers need to react to the business fact.

Do not expose entire database rows.

Bad:

```json
{
  "table": "orders",
  "row": {
    "...": "everything"
  }
}
```

Good:

```json
{
  "order_id": "ORD001",
  "customer_id": "CUS001",
  "store_id": "STORE001",
  "total": {
    "amount": "12.50",
    "currency": "USD"
  }
}
```

---

# 270 — Event Naming

Use past tense:

```text
OrderCreated
OrderCompleted
PaymentCaptured
PointsEarned
MissionCompleted
```

Do not name events as commands:

```text
CreateOrder
CapturePayment
EarnPoints
```

---

# 271 — Event Ownership

Only the owning service publishes the authoritative event.

Examples:

```text
order-service      → OrderCompleted
wallet-service     → WalletFundsCaptured
payment-service    → PaymentCaptured
loyalty-service    → PointsEarned
mission-service    → MissionCompleted
```

---

# 272 — Event Versioning

Example:

```json
{
  "event_type": "ORDER_COMPLETED",
  "event_version": 1
}
```

Later:

```text
ORDER_COMPLETED v2
```

Do not silently reinterpret v1.

---

# 273 — Event Compatibility

Backward-compatible evolution:

```text
Add optional field
Add new metadata
Add new event type
```

Breaking changes:

```text
Remove required field
Change field meaning
Change data type
Change currency representation
```

---

# 274 — Event Ordering

If ordering is required, choose partition key carefully.

Example:

```text
partition key = order_id
```

Then all events for one order can remain ordered within a partition.

Do not assume global Kafka ordering.

---

# 275 — Event Idempotency

Consumers must process using:

```text
event_id
```

Possible unique key:

```text
(event_id, consumer_name)
```

Repeated event delivery must not create duplicate business effect.

---

# 276 — Event Retry Contract

Each consumer should define:

```text
retryable errors
non-retryable errors
max attempts
backoff
DLQ topic
```

Example:

```text
validation failure → DLQ
temporary DB outage → retry
duplicate event → ignore successfully
```

---

# 277 — Dead Letter Queue Contract

DLQ message should preserve:

```text
original event
failure reason
consumer name
failed_at
attempt_count
correlation_id
```

Example topic:

```text
order.completed.loyalty.dlq
```

---

# 278 — Kafka Contract Example: Order Completed

```json
{
  "event_id": "evt_123",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:00:00Z",
  "producer": "order-service",
  "correlation_id": "cor_123",
  "data": {
    "order_id": "ORD001",
    "customer_id": "CUS001",
    "store_id": "STORE001",
    "total": {
      "amount": "12.50",
      "currency": "USD"
    },
    "fulfillment_type": "PICKUP"
  }
}
```

---

# 279 — Kafka Contract Example: Wallet Top-Up Completed

```json
{
  "event_id": "evt_456",
  "event_type": "WALLET_TOPUP_COMPLETED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:10:00Z",
  "producer": "wallet-service",
  "correlation_id": "cor_456",
  "data": {
    "wallet_id": "WAL001",
    "customer_id": "CUS001",
    "topup_id": "TOP001",
    "amount": {
      "amount": "20.00",
      "currency": "USD"
    },
    "provider": "SMART"
  }
}
```

---

# 280 — Command Contract Standards

Commands represent requests to change state.

Examples:

```text
CreateOrder
CancelOrder
ReserveWalletFunds
CaptureWalletFunds
RefundPayment
EarnPoints
UpdateMissionProgress
```

A command contract should define:

```text
command_id
command_type
requested_at
requested_by
correlation_id
idempotency_key when required
payload
```

---

# 281 — Command Envelope

Example:

```json
{
  "command_id": "cmd_123",
  "command_type": "RESERVE_WALLET_FUNDS",
  "requested_at": "2026-10-11T09:00:00Z",
  "requested_by": "order-service",
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

# 282 — Query Contract Standards

Queries request information.

Examples:

```text
GetOrder
GetWalletBalance
GetCustomerProfile
ListRewards
GetMissionProgress
```

Queries should not have intended side effects.

---

# 283 — Query Result Standards

Query results may be optimized read models.

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

The result does not need to mirror the write aggregate.

---

# 284 — Error Contract

All external-facing errors should use a consistent structure.

Recommended REST format:

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

# 285 — Error Code Rules

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
ORDER_NOT_FOUND
INVALID_ORDER_STATUS
INSUFFICIENT_WALLET_BALANCE
PAYMENT_ALREADY_CAPTURED
MISSION_NOT_ELIGIBLE
COUPON_EXPIRED
RATE_LIMITED
```

Do not make clients parse human-readable messages.

---

# 286 — Error Message Rules

Messages are for humans.

Codes are for machines.

Example:

```text
code    = INSUFFICIENT_WALLET_BALANCE
message = Wallet balance is insufficient
```

Messages may later be localized.

The code should remain stable.

---

# 287 — Validation Error Contract

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

---

# 288 — Conflict Error Contract

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

Recommended HTTP:

```text
409 Conflict
```

---

# 289 — Rate Limit Error Contract

Example:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after_seconds": 30
  }
}
```

Response header:

```http
Retry-After: 30
```

---

# 290 — Authentication Contract

Public requests typically use:

```http
Authorization: Bearer <access_token>
```

The token contract should define:

```text
issuer
audience
subject
expiration
roles/scopes
token type
```

---

# 291 — JWT Claims Standard

Possible claims:

```json
{
  "iss": "https://identity.company.com",
  "sub": "USR001",
  "aud": "brown-platform",
  "exp": 1791712800,
  "iat": 1791709200,
  "roles": [
    "USER"
  ]
}
```

Avoid placing excessive mutable business data in tokens.

---

# 292 — Authorization Contract

Endpoint contracts should document required permissions.

Example:

```text
GET /api/v1/orders/{id}

Authentication:
Required

Authorization:
USER → own order only
SUPPORT → authorized support access
SYSTEM_ADMIN → all orders
```

---

# 293 — Service-to-Service Authentication

Internal services should not blindly trust network location.

Possible mechanisms:

```text
mTLS
OAuth2 client credentials
Signed service tokens
Service mesh identity
```

The exact mechanism is finalized in PART 06.

---

# 294 — Correlation Contract

Standard headers/metadata:

```text
X-Request-Id
X-Correlation-Id
traceparent
tracestate
```

Events should propagate:

```text
correlation_id
causation_id
```

---

# 295 — Request ID vs Correlation ID

Request ID:

```text
One technical request
```

Correlation ID:

```text
One business journey across multiple requests/events
```

Example:

```text
Mobile request req_1
      ↓
Order service req_2
      ↓
Payment service req_3
```

All may share:

```text
correlation_id = cor_100
```

---

# 296 — Idempotency Contract

For state-changing operations, define:

```text
key format
scope
expiry
request hash behavior
duplicate response behavior
conflict behavior
```

---

# 297 — Idempotency Scope

An idempotency key must have a scope.

Possible:

```text
per endpoint
per customer
per service
per operation
```

Example:

```text
(user_id, operation, idempotency_key)
```

---

# 298 — Idempotency Duplicate Rules

Same key + same request:

```text
Return original successful/pending result
```

Same key + different request:

```text
409 Conflict
IDEMPOTENCY_KEY_REUSED
```

---

# 299 — Idempotency Record

Example:

```text
idempotency_key
operation
request_hash
status
response_code
response_body
created_at
expires_at
```

---

# 300 — Webhook Contract Standards

Webhook receivers must assume retries.

Webhook contract should define:

```text
authentication/signature
event type
event ID
timestamp
retry behavior
idempotency
response codes
```

---

# 301 — Webhook Idempotency

Provider callback example:

```text
provider_event_id
```

Store processed IDs.

If same callback arrives again:

```text
Return success without duplicate business effect
```

---

# 302 — Webhook Signature Verification

Where supported, verify:

```text
HMAC
Public-key signature
Provider token
Timestamp tolerance
```

Do not trust source IP alone as primary authentication.

---

# 303 — Webhook Response Strategy

Recommended:

```text
2xx → accepted
4xx → invalid/non-retryable request
5xx → temporary failure/retry may occur
```

Provider-specific semantics must be documented.

---

# 304 — Contract Validation

All incoming contract data should be validated before entering the domain.

Validate:

```text
Required fields
Types
Length
Format
Enum values
Range
Identifier format
Timestamp format
Currency format
```

Business invariants are validated separately in the domain.

---

# 305 — JSON Naming Convention

Recommended:

```text
snake_case
```

Example:

```json
{
  "order_id": "ORD001",
  "created_at": "..."
}
```

Do not mix:

```text
orderId
order_id
OrderID
```

inside the same API family.

---

# 306 — Protobuf Naming Convention

Use:

```text
snake_case fields
PascalCase message names
PascalCase service names
```

Example:

```proto
message CreateOrderRequest {
  string store_id = 1;
}
```

---

# 307 — Kafka Field Naming

Use the same canonical naming standard across integration events.

Recommended:

```text
snake_case
```

---

# 308 — Identifier Contract

Every major identifier should have:

```text
Format
Case sensitivity
Maximum length
Uniqueness scope
Generation owner
```

Example:

```text
order_id:
opaque string
max 64
case-sensitive
generated by order-service
globally unique
```

---

# 309 — Currency Contract

Supported currencies must be explicit.

Example:

```text
USD
KHR
```

Rules must define:

```text
precision
rounding
conversion
display
authoritative currency
```

---

# 310 — Percentage Contract

Example:

```json
{
  "percentage": "20.00"
}
```

Avoid ambiguity between:

```text
20
0.20
```

Document the semantic.

---

# 311 — Boolean Contract

Use real booleans:

```json
{
  "is_refunded": false
}
```

Avoid:

```text
"Y"
"N"
"1"
"0"
```

unless required by legacy integration.

---

# 312 — Status Contract

Every status enum must define allowed transitions or meaning.

Example:

```text
PENDING
ACCEPTED
PREPARING
READY
DONE
CANCELLED
```

Do not expose undocumented internal status codes.

---

# 313 — Contract Deprecation

When a contract is being replaced:

1. Mark deprecated.
2. Publish migration guidance.
3. Track active consumers.
4. Define removal date.
5. Maintain compatibility window.
6. Remove only after consumers migrate.

---

# 314 — REST Deprecation Headers

Where appropriate, use standard deprecation metadata or documented response headers.

Example concept:

```text
Deprecation: true
Sunset: <date>
Link: migration documentation
```

---

# 315 — Protobuf Deprecation

Example:

```proto
string old_field = 4 [deprecated = true];
```

Do not immediately reuse field number after removal.

---

# 316 — Event Deprecation

Example:

```text
ORDER_COMPLETED v1
    ↓
Consumers migrate
    ↓
ORDER_COMPLETED v2
    ↓
v1 removed after agreed window
```

---

# 317 — Backward Compatibility Strategy

Prefer additive evolution.

Good:

```text
Add optional field
Add endpoint
Add new event
Add new RPC
```

Avoid:

```text
Rename required field
Change field meaning
Remove enum unexpectedly
Change money representation silently
```

---

# 318 — Forward Compatibility

Consumers should tolerate unknown optional fields when possible.

Do not fail simply because a newer producer adds unrelated fields.

---

# 319 — Consumer-Driven Contract Testing

Use contract tests where consumers depend on providers.

Possible tools:

```text
Pact
Spring Cloud Contract
Buf breaking checks for Protobuf
Schema compatibility checks
```

---

# 320 — REST Contract Tests

Test:

```text
Request schema
Response schema
Status code
Error schema
Authentication
Headers
Versioning
Idempotency behavior
```

---

# 321 — gRPC Contract Tests

Test:

```text
Protobuf compatibility
RPC method
Metadata
Deadlines
Error mapping
Field semantics
```

---

# 322 — Kafka Contract Tests

Test:

```text
Event schema
Required metadata
Serialization
Backward compatibility
Partition key
Duplicate handling
DLQ behavior
```

---

# 323 — Schema Registry Guidance

For Kafka, use a schema registry if event volume and governance justify it.

Possible formats:

```text
Avro
Protobuf
JSON Schema
```

Benefits:

- Compatibility checking.
- Schema ownership.
- Consumer safety.
- Version history.

---

# 324 — Protobuf Registry / Breaking Checks

For Protobuf contracts, use automated compatibility checks.

Possible tooling:

```text
Buf
```

CI should fail on incompatible schema changes.

---

# 325 — Contract CI Pipeline

Recommended stages:

```text
Validate syntax
      ↓
Lint
      ↓
Compatibility check
      ↓
Generate code
      ↓
Contract tests
      ↓
Publish artifact
```

---

# 326 — Contract Artifact Versioning

Contract packages may use semantic versions.

Example:

```text
wallet-contracts:1.4.0
```

But API/event semantic version and artifact version are separate concepts.

---

# 327 — Contract Ownership

Each contract requires an owner.

Example:

```text
Order REST API      → order-service team
Wallet gRPC API     → wallet-service team
OrderCompleted      → order-service team
PointsEarned        → loyalty-service team
```

Consumers may request changes.

Provider owns final published contract.

---

# 328 — Contract Review Checklist

Before publishing a new contract:

## Semantics

- [ ] Business meaning is clear.
- [ ] Ownership is clear.
- [ ] Names use ubiquitous language.
- [ ] Field meanings are documented.

## Compatibility

- [ ] Breaking-change analysis completed.
- [ ] Versioning decision made.
- [ ] Migration path exists if needed.

## Security

- [ ] Authentication defined.
- [ ] Authorization defined.
- [ ] Sensitive fields reviewed.
- [ ] PII exposure minimized.

## Reliability

- [ ] Timeout/deadline defined.
- [ ] Retry semantics defined.
- [ ] Idempotency defined.
- [ ] Duplicate behavior defined.

## Observability

- [ ] Request/correlation metadata defined.
- [ ] Error codes defined.
- [ ] Logging expectations defined.

---

# 329 — REST API Documentation Template

For every endpoint document:

```text
Name
Purpose
Method
Path
Authentication
Authorization
Headers
Path Parameters
Query Parameters
Request Body
Response Body
Success Codes
Error Codes
Idempotency
Rate Limit
Examples
Version
Owner
```

---

# 330 — gRPC Documentation Template

Document:

```text
Service
RPC
Purpose
Request
Response
Metadata
Deadline
Authentication
Authorization
Idempotency
Errors
Retryability
Version
Owner
```

---

# 331 — Kafka Event Documentation Template

Document:

```text
Event Name
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
Retention
PII Classification
Owner
```

---

# 332 — Command Documentation Template

Document:

```text
Command Name
Purpose
Requester
Handler
Required Data
Authorization
Idempotency
Validation
Possible Results
Possible Errors
Events Produced
```

---

# 333 — Query Documentation Template

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
```

---

# 334 — API Error Catalog

Maintain a catalog.

Example:

| Code | HTTP | Meaning |
|---|---:|---|
| VALIDATION_FAILED | 400 | Request schema invalid |
| UNAUTHENTICATED | 401 | Authentication missing/invalid |
| ACCESS_DENIED | 403 | Caller lacks permission |
| ORDER_NOT_FOUND | 404 | Order does not exist |
| ORDER_STATE_CONFLICT | 409 | Invalid lifecycle transition |
| IDEMPOTENCY_KEY_REUSED | 409 | Key reused with different payload |
| INSUFFICIENT_WALLET_BALANCE | 422 | Wallet cannot satisfy reservation |
| RATE_LIMITED | 429 | Request limit exceeded |
| DEPENDENCY_UNAVAILABLE | 503 | Required downstream unavailable |

---

# 335 — Domain Error vs Technical Error

Domain error:

```text
INSUFFICIENT_WALLET_BALANCE
```

Technical error:

```text
DATABASE_UNAVAILABLE
```

Do not expose raw infrastructure errors to clients.

Map them into stable platform errors.

---

# 336 — Retryability Contract

Errors should define retry semantics.

Example:

| Error | Retry? |
|---|---|
| VALIDATION_FAILED | No |
| ACCESS_DENIED | No |
| ORDER_NOT_FOUND | No |
| RATE_LIMITED | Yes, after delay |
| DEPENDENCY_UNAVAILABLE | Usually yes |
| DEADLINE_EXCEEDED | Maybe |
| IDEMPOTENCY_KEY_REUSED | No |

---

# 337 — Consistency Contract

Queries should document consistency expectations.

Examples:

```text
Strongly consistent
Eventually consistent
Cached up to 60 seconds
Projection may lag up to 5 seconds
```

This is especially important for:

```text
Wallet balance
Points balance
Order history
Analytics dashboards
```

---

# 338 — REST Cache Contract

If response caching is allowed, define:

```text
Cache-Control
ETag
TTL
Vary
Invalidation expectations
```

Do not cache sensitive/private data accidentally.

---

# 339 — ETag / Conditional Request

Example:

```http
ETag: "order-v7"
```

Client:

```http
If-Match: "order-v7"
```

Useful for optimistic concurrency on selected APIs.

---

# 340 — File Upload Contract

Where file upload is supported, define:

```text
Allowed MIME types
Maximum size
Virus/malware scanning
Object storage behavior
Retention
Authorization
```

Prefer direct object storage upload patterns for large files where appropriate.

---

# 341 — Bulk Operation Contracts

Bulk APIs should define per-item result behavior.

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

Avoid ambiguous all-or-nothing behavior unless explicitly transactional.

---

# 342 — Long-Running Operation Contract

For asynchronous operations:

```text
POST /reports
```

Response:

```text
202 Accepted
```

with:

```json
{
  "operation_id": "OP001",
  "status": "PENDING"
}
```

Query:

```text
GET /operations/OP001
```

---

# 343 — Rate Limit Contract

Document:

```text
scope
limit
window
burst
retry behavior
```

Example:

```text
Login:
5 requests / minute / IP
```

Response may include:

```text
Retry-After
```

---

# 344 — Localization Contract

If responses require localized human text:

Prefer stable machine code + localized message.

Example:

```json
{
  "code": "MISSION_COMPLETED",
  "message": "Mission completed"
}
```

Language may be selected by:

```http
Accept-Language: km
```

Do not use localized text as the only business identifier.

---

# 345 — API Language Fallback

Example policy:

```text
Requested language available
        ↓
Return requested translation

Not available
        ↓
Fallback to English
```

Exact policy must be documented.

---

# 346 — Contract Security Classification

Each contract should classify data:

```text
Public
Internal
Confidential
Restricted
```

Examples:

```text
Product menu → Public/Internal
Customer profile → Confidential
Wallet ledger → Restricted
Authentication secrets → Restricted
```

---

# 347 — Sensitive Field Rules

Never expose unless explicitly required:

```text
password hashes
refresh tokens
private keys
raw provider secrets
full payment credentials
internal security notes
```

---

# 348 — Masking Contract

Where sensitive values are returned:

Example:

```text
card_number = ****1234
phone = 0******789
```

Masking rules should be standardized.

---

# 349 — Audit Metadata Contract

Sensitive operations may include:

```text
actor_id
actor_type
reason
request_id
correlation_id
source_ip
performed_at
```

Do not expose all audit metadata publicly by default.

---

# 350 — Admin API Contracts

Admin endpoints should be separate logically.

Example:

```text
/api/v1/admin/orders
/api/v1/admin/missions
```

Authorization must be stricter than customer endpoints.

---

# 351 — Internal API Contracts

Internal-only REST/gRPC contracts should not automatically be exposed through public ingress.

Use:

```text
ClusterIP
Internal DNS
Network Policy
Service authentication
```

---

# 352 — Legacy Contract Adapter

Legacy APIs may use incompatible conventions.

Example:

```text
code = 100
message = success
```

The Integration/ACL layer may translate:

```text
Legacy contract
      ↓
Internal canonical contract
```

Do not force new services to adopt legacy response formats internally.

---

# 353 — Strangler Contract Strategy

During migration:

```text
Gateway
  ├── /api/v1/new-orders → new order-service
  └── /legacy/...        → legacy system
```

Contracts should make the migration explicit.

Avoid hidden routing behavior that changes semantics.

---

# 354 — Contract Canonicalization

Where multiple external systems represent the same concept differently:

Example:

```text
Provider A: PAID
Provider B: SUCCESS
Provider C: 00
```

Map internally to:

```text
CAPTURED
```

The canonical model belongs in the integration boundary.

---

# 355 — Contract Test Data

Maintain reusable contract fixtures.

Examples:

```text
valid order
invalid order
expired coupon
insufficient wallet
duplicate idempotency key
payment provider timeout
```

These improve provider/consumer testing.

---

# 356 — Example REST Error Flow

```text
Client
  ↓
POST /orders
  ↓
REST validation passes
  ↓
Application
  ↓
Domain detects invalid state
  ↓
InvalidOrderStateException
  ↓
Error Mapper
  ↓
409 ORDER_STATE_CONFLICT
```

---

# 357 — Example gRPC Error Flow

```text
Order Service
    ↓
ReserveFunds
    ↓
Wallet Service
    ↓
InsufficientBalance
    ↓
FAILED_PRECONDITION
    ↓
domain error detail:
INSUFFICIENT_WALLET_BALANCE
```

---

# 358 — Example Kafka Failure Flow

```text
OrderCompleted
      ↓
Loyalty Consumer
      ↓
Temporary DB error
      ↓
Retry
      ↓
Retry exhausted
      ↓
DLQ
```

---

# 359 — Contract Naming Conventions Summary

REST:

```text
/api/v1/orders
snake_case JSON
```

gRPC:

```text
company.wallet.v1
ReserveFunds
snake_case fields
```

Kafka:

```text
order.completed
ORDER_COMPLETED
snake_case payload
```

Errors:

```text
UPPER_SNAKE_CASE
```

---

# 360 — Contract Repository Structure

Example:

```text
contracts/
│
├── rest/
│   ├── order/
│   ├── wallet/
│   └── loyalty/
│
├── protobuf/
│   ├── order/
│   ├── wallet/
│   └── payment/
│
├── events/
│   ├── order/
│   ├── wallet/
│   └── loyalty/
│
└── docs/
```

---

# 361 — Contract Change Workflow

Recommended:

```text
Propose change
    ↓
Review provider impact
    ↓
Review consumer impact
    ↓
Compatibility check
    ↓
Approve
    ↓
Implement
    ↓
Contract tests
    ↓
Publish
    ↓
Consumer migration if required
```

---

# 362 — Breaking Change Approval

Breaking changes require explicit review.

Checklist:

- [ ] Why is breaking change necessary?
- [ ] Which consumers are affected?
- [ ] Is v2 required?
- [ ] Is migration documentation ready?
- [ ] Is deprecation window agreed?
- [ ] Is monitoring in place?

---

# 363 — Contract Ownership Matrix

Example:

| Contract | Owner |
|---|---|
| Auth REST | identity-service |
| Catalog REST | catalog-service |
| Order REST | order-service |
| Wallet gRPC | wallet-service |
| Payment gRPC | payment-service |
| OrderCompleted event | order-service |
| WalletTopUpCompleted event | wallet-service |
| PointsEarned event | loyalty-service |
| MissionCompleted event | mission-service |

---

# 364 — Contract Lifecycle States

Possible states:

```text
DRAFT
REVIEW
ACTIVE
DEPRECATED
RETIRED
```

Every published contract should have a lifecycle state.

---

# 365 — Contract Documentation Metadata

Recommended metadata:

```text
owner
version
status
created_at
updated_at
deprecated_at
sunset_at
```

---

# 366 — CI Compatibility Gates

CI should block:

```text
Breaking Protobuf field reuse
Invalid OpenAPI
Event schema incompatibility
Missing required examples
Invalid contract linting
```

This makes contracts enforceable, not just documented.

---

# 367 — PART 05 Deliverables

PART 05 produces:

1. Public REST API standard.
2. HTTP method rules.
3. HTTP status rules.
4. REST request/response conventions.
5. Pagination standard.
6. Date/time standard.
7. Money/currency standard.
8. Enum and nullability rules.
9. REST idempotency standard.
10. Request/correlation headers.
11. REST API versioning.
12. OpenAPI standard.
13. Internal gRPC standard.
14. Protobuf naming/versioning rules.
15. gRPC deadlines and errors.
16. Kafka event envelope.
17. Event naming and ownership.
18. Event compatibility rules.
19. Command contract standard.
20. Query contract standard.
21. Error contract standard.
22. Validation error standard.
23. Authentication contract.
24. Authorization documentation rules.
25. Service-to-service authentication requirements.
26. Tracing metadata standard.
27. Idempotency contract.
28. Webhook standard.
29. Deprecation strategy.
30. Backward compatibility strategy.
31. Contract testing strategy.
32. Schema compatibility CI.
33. Documentation templates.
34. Error catalog.
35. Retryability rules.
36. Data classification rules.
37. Admin/internal contract rules.
38. Legacy/ACL contract strategy.
39. Contract change workflow.
40. Contract ownership matrix.

---

# 368 — Exit Criteria

PART 05 is complete when the team can answer:

### REST

```text
How are public APIs named, versioned, validated, and documented?
```

### gRPC

```text
How are internal synchronous contracts defined and evolved?
```

### Kafka

```text
What is the standard event envelope and compatibility policy?
```

### Errors

```text
Can clients handle errors using stable codes?
```

### Idempotency

```text
Which operations require an idempotency key and how are duplicates handled?
```

### Tracing

```text
Can one business journey be traced across HTTP, gRPC, and Kafka?
```

### Security

```text
Does each contract define authentication and authorization?
```

### Compatibility

```text
Can providers evolve contracts without unexpectedly breaking consumers?
```

### Ownership

```text
Who owns each published contract?
```

If these answers are unclear, implementation is not ready for broad integration.

---

# 369 — Handoff to PART 06

PART 06 defines the platform security architecture.

```text
PART 05
Contracts
   ↓
Authentication metadata
Authorization requirements
Sensitive data classification
Service-to-service identity
   ↓
PART 06
Security Architecture
```

PART 06 will define:

```text
Identity architecture
OAuth2 / OpenID Connect
JWT
Access tokens
Refresh tokens
RBAC
Scopes / permissions
Service-to-service authentication
mTLS
Secrets management
Key rotation
Password security
Rate limiting
Audit logging
PII protection
Encryption
Security boundaries
Threat model
```

---

# PART 05 — Summary

The core idea is:

```text
A contract is a promise between systems.
```

Good contracts are:

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

The platform communication model becomes:

```text
Public Clients
    ↓ REST
API Gateway
    ↓
Microservices
    ↕ gRPC / REST
Internal Services
    ↓
Kafka Events
    ↓
Asynchronous Consumers
```

All of these must share consistent standards for:

```text
Identity
Errors
Idempotency
Tracing
Versioning
Compatibility
Data representation
```

Strong contract governance prevents internal implementation details from becoming permanent cross-service dependencies.

---

**End of PART 05 — Contracts**
