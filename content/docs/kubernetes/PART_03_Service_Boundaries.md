---
title: "PART 03 — SERVICE BOUNDARIES"
---

# PART 03 — SERVICE BOUNDARIES

> **Document Role:** Defines how the business domains from PART 02 are decomposed into deployable microservices and establishes service ownership, dependency, communication, and migration rules.  
> **Previous Part:** PART 02 — Domain-Driven Design  
> **Next Part:** PART 04 — Clean + Hexagonal Architecture  
> **Status:** Architecture / Design  
> **Audience:** Backend engineers, software architects, technical leads, QA engineers, DevOps engineers, database engineers, platform engineers.

---

# 040 — Service Decomposition Principles

## 040.1 Purpose

Service decomposition converts domain boundaries into deployable software boundaries.

A microservice must not be created merely because:

- A database table exists.
- A controller exists.
- A screen exists.
- A team wants a new repository.
- A framework module can be separated.
- A CRUD area looks independent.

A service boundary should exist because the business capability has:

- Clear ownership.
- Clear business rules.
- Independent lifecycle.
- Independent change pressure.
- Independent data responsibility.
- Distinct reliability needs.
- Distinct scaling needs.
- Distinct security needs.
- Distinct integration needs.

---

## 040.2 Core Rule

The decomposition process should follow:

```text
Business Capability
        ↓
Bounded Context
        ↓
Domain Ownership
        ↓
Consistency Boundary
        ↓
Change Boundary
        ↓
Operational Boundary
        ↓
Deployable Service
```

Do not begin with:

```text
Tables
  ↓
Controllers
  ↓
Services
```

---

## 040.3 Service Boundary Decision Questions

Before creating a service, answer:

1. What business capability does this service own?
2. What data does it own?
3. What rules does it enforce?
4. What events does it publish?
5. What commands does it accept?
6. Which other services does it depend on?
7. Can it be deployed independently?
8. Can it fail independently?
9. Can it scale independently?
10. Does it require different security controls?
11. Does it require different consistency guarantees?
12. Does it have a different change frequency?
13. Does a distinct team own it?
14. Does separating it reduce or increase coupling?
15. Is the boundary stable enough to justify a network boundary?

---

## 040.4 Avoid Premature Microservices

Do not split every bounded context into a service immediately.

Example:

```text
Identity
Customer
Profile
Preferences
Membership
```

These may initially live together if:

- Change rate is similar.
- Same team owns them.
- They share one lifecycle.
- They do not need independent scaling.
- The split would introduce excessive remote calls.

Split later when evidence justifies it.

---

## 040.5 Start Coarse, Split with Evidence

Prefer:

```text
Few well-defined services
```

over:

```text
Many tiny network-coupled services
```

A service should be large enough to own a complete capability and small enough to remain understandable.

---

# 041 — Service Boundary Evaluation Criteria

## 041.1 Business Capability

A strong boundary usually maps to a meaningful business capability.

Examples:

```text
Ordering
Payment
Wallet
Loyalty
Inventory
Notification
```

---

## 041.2 Data Ownership

A service should own the authoritative data needed to enforce its rules.

Example:

```text
Wallet Service
  owns:
    wallet_account
    wallet_ledger
    wallet_reservation
    wallet_reconciliation
```

Other services may not directly update these tables.

---

## 041.3 Consistency Requirements

Strong consistency is a reason to keep related concepts together.

Example:

```text
Wallet Reservation
Wallet Capture
Wallet Release
```

These belong close to the same consistency boundary.

---

## 041.4 Change Frequency

If two capabilities change for different reasons, separation may be useful.

Example:

```text
Catalog pricing changes frequently
Authentication protocol changes rarely
```

---

## 041.5 Scaling Profile

If one capability has significantly different scaling behavior, it may need independence.

Example:

```text
Notification fan-out
```

may scale very differently from:

```text
Wallet ledger writes
```

---

## 041.6 Reliability Profile

Some capabilities may tolerate temporary delay.

Example:

```text
Notification
Analytics
Mission progress projection
```

Others may require stronger reliability:

```text
Wallet
Payment
Order acceptance
```

---

## 041.7 Security Profile

A financial service may require stronger controls than a catalog service.

Example:

```text
Wallet Service
```

may require:

- Restricted database access.
- Strong audit logs.
- Elevated security reviews.
- Stricter secrets handling.
- More restrictive network policy.

---

## 041.8 Team Ownership

If a domain is owned by a stable team, that supports an independent service boundary.

However:

```text
Team structure should not be the only reason for a service boundary.
```

---

# 042 — Initial Service Map

Based on PART 02, the initial candidate services are:

```text
api-gateway

identity-service
customer-service

catalog-service
inventory-service
cart-service
order-service

payment-service
wallet-service

loyalty-service
promotion-service
mission-service

notification-service

integration-service
```

Possible later services:

```text
search-service
reporting-service
analytics-service
file-service
reconciliation-service
```

These should be created only when justified.

---

# 043 — Recommended Initial Deployment Shape

For the first implementation, do not deploy every candidate separately.

Recommended initial deployable set:

```text
api-gateway

identity-service
catalog-service
order-service
payment-service
wallet-service
loyalty-service
notification-service
integration-service
```

Possible temporary grouping:

```text
customer capability
    inside identity-service initially

cart capability
    inside order-service initially

promotion + mission
    inside loyalty-service initially
```

Later split when:

- Complexity increases.
- Independent scaling is needed.
- Independent release is needed.
- Team ownership diverges.
- Data ownership becomes difficult.
- A domain requires separate availability or security controls.

---

# 044 — Service Ownership Rules

## 044.1 Rule: One Authoritative Owner

Every business fact has one authoritative service owner.

Examples:

| Business Fact | Owner |
|---|---|
| Authentication state | identity-service |
| Customer profile | customer-service or identity-service initially |
| Product/menu definition | catalog-service |
| Stock level | inventory-service |
| Order lifecycle | order-service |
| Payment lifecycle | payment-service |
| Wallet balance | wallet-service |
| Wallet ledger | wallet-service |
| Loyalty points | loyalty-service |
| Mission progress | mission-service or loyalty-service initially |
| Promotion eligibility | promotion-service or loyalty-service initially |
| Notification delivery | notification-service |
| External mapping | integration-service |

---

## 044.2 Rule: Owner Controls Writes

Only the owning service may modify authoritative state.

Wrong:

```text
order-service
   ↓
UPDATE wallet_ledger
```

Correct:

```text
order-service
   ↓ command/API/event
wallet-service
   ↓
wallet DB
```

---

## 044.3 Rule: Read Copies Are Not Owners

A service may maintain a local projection.

Example:

```text
order-service receives ProductPriceChanged
        ↓
local order pricing read model updated
```

That does not transfer Catalog ownership.

---

# 045 — Database Ownership

## 045.1 Database-per-Service Principle

Target architecture:

```text
identity-service
      ↓
identity_db

order-service
      ↓
order_db

payment-service
      ↓
payment_db

wallet-service
      ↓
wallet_db

loyalty-service
      ↓
loyalty_db
```

The databases may initially be hosted in the same PostgreSQL cluster.

Logical ownership must remain separate.

---

## 045.2 Physical Deployment Options

### Option A — Separate Databases

```text
PostgreSQL Cluster

identity_db
order_db
payment_db
wallet_db
loyalty_db
```

### Option B — Separate Schemas

Temporary migration option:

```text
platform_db

identity.*
ordering.*
payment.*
wallet.*
loyalty.*
```

Each schema still has a single owner.

---

## 045.3 Forbidden Pattern

Do not allow:

```text
order-service → wallet tables
wallet-service → payment tables
loyalty-service → order tables
notification-service → customer tables
```

---

## 045.4 Cross-Service Reporting

Do not solve reporting by allowing unrestricted cross-service joins.

Prefer:

```text
Domain Events
     ↓
Reporting Projection
     ↓
Reporting Database
```

or:

```text
Analytics Pipeline
```

---

# 046 — Service Dependency Rules

## 046.1 Allowed Dependency Direction

Dependencies should follow explicit contracts.

Example:

```text
order-service
      ↓
payment-service
```

not database access.

---

## 046.2 Dependency Graph Must Be Visible

Maintain a dependency map:

```text
api-gateway
   │
   ├── identity-service
   ├── catalog-service
   ├── order-service
   └── wallet-service

order-service
   ├── catalog-service
   ├── inventory-service
   ├── payment-service
   └── wallet-service
```

Asynchronous consumers:

```text
order.completed
    ├── loyalty-service
    ├── mission-service
    ├── notification-service
    └── analytics
```

---

## 046.3 Avoid Circular Dependencies

Bad:

```text
order-service
    ↓
payment-service
    ↓
order-service
```

This creates runtime coupling.

Prefer event-driven reactions or redesign responsibilities.

---

# 047 — Synchronous vs Asynchronous Communication

## 047.1 Synchronous Communication

Use synchronous calls when the caller needs an immediate answer.

Examples:

```text
Validate Coupon
Get Product Price
Reserve Wallet Funds
Authorize Payment
Check Inventory
```

Possible transports:

```text
REST
gRPC
```

---

## 047.2 Asynchronous Communication

Use events when a completed fact should trigger downstream behavior.

Examples:

```text
OrderCompleted
PaymentCaptured
WalletTopUpCompleted
MissionCompleted
RewardAssigned
```

Possible transport:

```text
Kafka
```

---

## 047.3 Decision Rule

Ask:

```text
Does the caller need the result before it can continue?
```

If yes:

```text
Synchronous request
```

If no:

```text
Asynchronous event
```

---

## 047.4 Avoid Synchronous Chains

Bad:

```text
Gateway
  ↓
Order
  ↓
Payment
  ↓
Wallet
  ↓
Loyalty
  ↓
Notification
```

A failure deep in the chain affects the user request.

Prefer:

```text
Order
  ↓
Payment / Wallet required synchronously
  ↓
Order completed
  ↓
Event
  ├── Loyalty
  ├── Mission
  └── Notification
```

---

# 048 — API Gateway Boundary

## 048.1 Responsibility

The API Gateway provides the public entry point.

Responsibilities:

```text
Authentication enforcement
Routing
Rate limiting
Request IDs
CORS
Request logging
Version routing
Legacy fallback routing
```

---

## 048.2 Gateway Must Not Own Domain Logic

Do not implement:

```text
Pricing rules
Wallet rules
Order state rules
Loyalty calculations
Mission rules
```

inside the gateway.

---

# 049 — Identity Service

## 049.1 Purpose

Owns authentication and authorization identity.

---

## 049.2 Responsibilities

```text
Register user identity
Authenticate
Issue access token
Issue refresh token
Validate refresh token
Manage credentials
Manage roles
Lock/unlock identity
Password reset
```

---

## 049.3 Owned Data

Possible tables:

```text
users
credentials
roles
user_roles
refresh_tokens
authentication_sessions
password_reset_tokens
security_events
```

---

## 049.4 Does Not Own

```text
Orders
Wallet balance
Points balance
Product catalog
Payment transactions
```

---

## 049.5 Public Contracts

Examples:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/password-reset
```

---

# 050 — Customer Service

## 050.1 Purpose

Owns customer profile and membership-related identity information.

Possible responsibilities:

```text
Profile
Contact information
Member mapping
Customer preferences
Consent
```

---

## 050.2 Initial Consolidation Option

For early phases:

```text
identity-service
  └── customer module
```

Split later when:

- Profile complexity grows.
- Membership is independently managed.
- Different team owns customer domain.
- Customer read load becomes large.
- Identity security boundary should remain minimal.

---

# 051 — Catalog Service

## 051.1 Purpose

Owns sellable product/menu definitions.

Responsibilities:

```text
Products
Categories
Menu items
Modifiers
Prices
Store menu configuration
Availability metadata
```

---

## 051.2 Owned Data

Possible tables:

```text
products
categories
menu_items
menu_item_prices
modifiers
sub_modifiers
store_menu_items
product_availability_rules
```

---

## 051.3 Contracts

Examples:

```text
GET /api/v1/catalog/items
GET /api/v1/catalog/items/{id}
GET /api/v1/catalog/stores/{storeId}/menu
```

---

# 052 — Inventory Service

## 052.1 Purpose

Owns stock and reservation.

Responsibilities:

```text
Track stock
Reserve stock
Release stock
Deduct fulfilled stock
Adjust stock
```

---

## 052.2 Core Commands

```text
ReserveInventory
ReleaseInventory
DeductInventory
AdjustInventory
```

---

## 052.3 Core Events

```text
InventoryReserved
InventoryReservationFailed
InventoryReleased
InventoryDeducted
InventoryAdjusted
```

---

# 053 — Cart Service

## 053.1 Purpose

Owns temporary pre-order shopping state.

Responsibilities:

```text
Create cart
Add item
Remove item
Change quantity
Apply temporary selections
Calculate cart preview
```

---

## 053.2 Initial Consolidation Option

Cart may initially exist inside:

```text
order-service
```

if:

- Cart traffic is manageable.
- Cart lifecycle is simple.
- No separate scaling requirement exists.

---

# 054 — Order Service

## 054.1 Purpose

Owns the authoritative order lifecycle.

---

## 054.2 Responsibilities

```text
Create order
Validate order transitions
Track order status
Store order item snapshot
Store price snapshot
Handle cancellation request
Mark order complete
Publish order events
```

---

## 054.3 Owned Data

Possible tables:

```text
orders
order_items
order_addresses
order_status_history
order_idempotency
order_outbox
```

---

## 054.4 Important Invariants

```text
Order must contain items.
Order total cannot be negative.
Status transition must be valid.
Cancelled order cannot become completed.
Duplicate create request must not create duplicate order.
```

---

## 054.5 Core Commands

```text
CreateOrder
AcceptOrder
StartPreparingOrder
MarkOrderReady
RequestOrderCancellation
CancelOrder
CompleteOrder
```

---

## 054.6 Core Events

```text
OrderCreated
OrderAccepted
OrderStatusChanged
OrderCancellationRequested
OrderCancelled
OrderCompleted
```

---

# 055 — Payment Service

## 055.1 Purpose

Owns external payment lifecycle.

Responsibilities:

```text
Create payment
Authorize payment
Capture payment
Refund payment
Reverse payment
Handle provider callback
Reconcile provider status
```

---

## 055.2 Owned Data

Possible tables:

```text
payments
payment_attempts
payment_provider_refs
payment_refunds
payment_reversals
payment_callbacks
payment_outbox
```

---

## 055.3 Important Rules

```text
Capture <= authorization
Refund <= captured amount
Provider callback is idempotent
Duplicate payment requests are idempotent
Financial status changes are auditable
```

---

# 056 — Wallet Service

## 056.1 Purpose

Owns stored-value financial state.

---

## 056.2 Responsibilities

```text
Wallet account
Balance
Ledger
Top-up
Reserve
Capture
Release
Refund
Reversal
Reconciliation
```

---

## 056.3 Owned Data

Possible tables:

```text
wallet_accounts
wallet_ledger
wallet_reservations
wallet_topups
wallet_refunds
wallet_reversals
wallet_reconciliation_runs
wallet_idempotency
wallet_outbox
```

---

## 056.4 Strong Consistency

Wallet operations should normally use strong transactional consistency.

Example:

```text
Validate available balance
        ↓
Create reservation
        ↓
Update balance state
        ↓
Commit
```

---

## 056.5 Do Not Allow

```text
order-service updates wallet balance
payment-service inserts wallet ledger
loyalty-service reads wallet table directly
```

---

# 057 — Loyalty Service

## 057.1 Purpose

Owns loyalty points and membership tier.

Responsibilities:

```text
Points account
Points ledger
Earn
Redeem
Expire
Tier evaluation
Reward entitlement
```

---

## 057.2 Owned Data

Possible tables:

```text
points_accounts
points_ledger
membership_tiers
tier_rules
reward_entitlements
loyalty_outbox
```

---

## 057.3 Events Consumed

Examples:

```text
OrderCompleted
WalletTopUpCompleted
CampaignQualified
```

---

## 057.4 Events Published

```text
PointsEarned
PointsRedeemed
PointsExpired
MembershipTierChanged
RewardAssigned
```

---

# 058 — Promotion Service

## 058.1 Purpose

Owns promotion and coupon rules.

Responsibilities:

```text
Promotion configuration
Coupon validation
Eligibility
Usage limit
Benefit calculation
Redemption recording
```

---

## 058.2 Initial Consolidation Option

Promotion may initially be a module inside:

```text
loyalty-service
```

Split when:

- Pricing rules become large.
- Promotion traffic grows.
- Business team ownership differs.
- Coupon lifecycle requires separate releases.

---

# 059 — Mission Service

## 059.1 Purpose

Owns mission definition, progress, completion, and reward triggers.

Responsibilities:

```text
Mission configuration
Eligibility
Progress
Completion
Period rules
Reward assignment trigger
```

---

## 059.2 Owned Data

Possible tables:

```text
missions
mission_conditions
mission_periods
mission_progress
mission_completion
mission_event_inbox
mission_outbox
```

---

## 059.3 Core Events Consumed

```text
UserRegistered
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
StoreVisited
```

---

## 059.4 Core Events Published

```text
MissionProgressUpdated
MissionCompleted
MissionRewardRequested
```

---

# 060 — Notification Service

## 060.1 Purpose

Owns delivery of outbound communication.

Responsibilities:

```text
Push notification
Email
SMS
Template rendering
Retry
Delivery tracking
```

---

## 060.2 Owned Data

Possible tables:

```text
notification_templates
notifications
notification_attempts
notification_delivery_status
```

---

## 060.3 Event Consumption

Example:

```text
OrderCompleted
      ↓
Notification Service
      ↓
Send receipt / completion message
```

A notification failure should normally not roll back the original business transaction.

---

# 061 — Integration / ACL Service

## 061.1 Purpose

Isolate internal services from legacy/external models.

Responsibilities:

```text
Legacy API integration
POS integration
Payment partner mapping
External top-up provider integration
Data translation
Protocol translation
Migration bridge
```

---

## 061.2 Anti-Corruption Layer

Example:

```text
Legacy Order
   ↓
Integration / ACL
   ↓
Internal Order Contract
```

Do not force the internal domain to copy legacy table names or status codes.

---

# 062 — Service-to-Service Data Access Rules

## 062.1 Rule 1

A service may access only:

```text
its own database
its own cache
its own local projections
```

---

## 062.2 Rule 2

To obtain authoritative data owned elsewhere:

```text
Call API/gRPC
or
consume event
```

---

## 062.3 Rule 3

Do not expose database credentials across services.

---

## 062.4 Rule 4

Do not create cross-service foreign keys.

Wrong:

```text
wallet_ledger.order_id
FOREIGN KEY → order_db.orders.id
```

Use logical references only.

---

# 063 — Service Contract Ownership

The provider owns the contract implementation.

Consumers depend on the published contract.

Examples:

```text
catalog-service
  owns Catalog API contract

wallet-service
  owns Wallet gRPC contract

order-service
  owns Order events
```

Breaking changes require versioning.

---

# 064 — Dependency Classification

## 064.1 Hard Dependency

Caller cannot complete without response.

Example:

```text
Checkout
  ↓
Wallet reserve
```

---

## 064.2 Soft Dependency

Caller may continue despite downstream failure.

Example:

```text
Order completed
  ↓
Notification
```

---

## 064.3 Eventual Dependency

Caller publishes fact and does not wait.

Example:

```text
OrderCompleted
  ↓
Loyalty
```

---

# 065 — Failure Isolation

Each service should fail independently where possible.

Example:

```text
Notification unavailable
```

must not automatically make:

```text
Order Service unavailable
```

Similarly:

```text
Analytics unavailable
```

must not block:

```text
Wallet Top-Up
```

---

# 066 — Timeout Rules

Every synchronous remote dependency must define:

```text
connection timeout
read timeout
overall deadline
```

Do not use infinite timeouts.

Example:

```text
Connect timeout: 2s
Read timeout:    3s
```

Actual values must be tuned later.

---

# 067 — Retry Rules

Retry only when operation is safe.

Good candidates:

```text
GET
Idempotent gRPC request
Event publishing
Provider status query
```

Dangerous without idempotency:

```text
Create payment
Top-up wallet
Create order
Capture funds
```

---

# 068 — Idempotency Boundary

Idempotency should be owned by the service executing the state change.

Example:

```text
Client
  ↓ idempotency_key
Order Service
  ↓
Check key
  ↓
Create once
```

Wallet similarly owns wallet-operation idempotency.

---

# 069 — Service Event Ownership

The service that owns the business fact publishes the event.

Examples:

```text
order-service
  publishes OrderCompleted

payment-service
  publishes PaymentCaptured

wallet-service
  publishes WalletTopUpCompleted

loyalty-service
  publishes PointsEarned

mission-service
  publishes MissionCompleted
```

A consumer must not publish another domain's authoritative event.

---

# 070 — Avoiding Distributed Monoliths

A distributed monolith has multiple deployments but behaves like one tightly coupled application.

Symptoms:

```text
Every request calls many services.
Services cannot deploy independently.
Shared database is required.
Circular dependencies exist.
One service failure causes system-wide failure.
All services must be released together.
```

Avoid by:

- Clear ownership.
- Stable contracts.
- Asynchronous events where appropriate.
- Local autonomy.
- Avoiding cross-service joins.
- Avoiding shared business libraries.
- Independent migrations.

---

# 071 — Shared Library Rules

Allowed shared libraries:

```text
logging helpers
tracing helpers
security client
common error envelope
technical utilities
```

Avoid shared domain libraries containing:

```text
Order
Payment
Wallet
Points
Mission
Promotion
```

Shared domain libraries create hidden coupling.

---

# 072 — Service Repository Strategy

Possible production approach:

```text
identity-service.git
catalog-service.git
order-service.git
payment-service.git
wallet-service.git
loyalty-service.git
notification-service.git
integration-service.git
```

Each repository owns:

```text
source code
tests
Dockerfile
CI pipeline
database migrations
service README
API contract
service runbook
```

---

# 073 — Service Versioning

Each service should have an independent version.

Example:

```text
order-service 1.4.2
wallet-service 2.1.0
loyalty-service 1.8.3
```

Do not require one global platform version for every service.

---

# 074 — Service Ownership Matrix

Example:

| Service | Business Owner | Technical Owner | Database | Primary Contracts |
|---|---|---|---|---|
| identity-service | Customer/IT | Identity Team | identity_db | REST |
| catalog-service | Product/Menu | Catalog Team | catalog_db | REST/gRPC |
| order-service | Operations | Ordering Team | order_db | REST/events |
| payment-service | Finance | Payments Team | payment_db | gRPC/events |
| wallet-service | Finance | Wallet Team | wallet_db | gRPC/events |
| loyalty-service | CRM | Loyalty Team | loyalty_db | events/REST |
| notification-service | Digital | Platform Team | notification_db | events |
| integration-service | IT | Integration Team | integration_db | REST/events |

Exact teams can be assigned later.

---

# 075 — Service Dependency Matrix

Example:

| Consumer | Provider | Need | Mode |
|---|---|---|---|
| order-service | catalog-service | Product/price validation | Sync |
| order-service | inventory-service | Reserve stock | Sync or Saga |
| order-service | payment-service | Process payment | Sync |
| order-service | wallet-service | Reserve/capture wallet | Sync |
| loyalty-service | order-service | Order completion fact | Async |
| mission-service | order-service | Qualifying event | Async |
| notification-service | order-service | Order status fact | Async |
| reporting | multiple | Reporting facts | Async |

---

# 076 — Initial Synchronous Call Budget

Avoid allowing unlimited service chaining.

Recommended design goal:

```text
Public request
   ↓
Gateway
   ↓
Primary service
   ↓
At most a small number of required synchronous dependencies
```

Where possible, move secondary work to events.

---

# 077 — Service Availability Classification

Possible initial categories:

## Tier 1 — Critical

```text
api-gateway
identity-service
order-service
payment-service
wallet-service
```

## Tier 2 — Important

```text
catalog-service
inventory-service
loyalty-service
```

## Tier 3 — Eventually Consistent / Supporting

```text
notification-service
mission-service
reporting
analytics
```

Availability targets are defined later.

---

# 078 — Security Boundary Classification

Sensitive services:

```text
identity-service
payment-service
wallet-service
```

Require stricter:

- RBAC.
- Network policies.
- Secret management.
- Audit logs.
- Access review.
- Database permission isolation.
- Security testing.

---

# 079 — Data Sensitivity Classification

Examples:

| Data | Sensitivity |
|---|---|
| Password hashes | Critical |
| Refresh tokens | Critical |
| Wallet ledger | Critical |
| Payment references | High |
| Customer PII | High |
| Orders | Medium/High |
| Product catalog | Low |
| Notification templates | Low/Medium |
| Logs | Depends on content |

Services must avoid leaking sensitive data through events or logs.

---

# 080 — Legacy Migration / Strangler Boundary

## 080.1 Purpose

The new microservices platform may coexist with legacy applications.

Use the Strangler Pattern.

```text
Client
  ↓
API Gateway
  ├── New Service
  └── Legacy System
```

Over time:

```text
Legacy route
   ↓ migrate
New service route
```

---

## 080.2 Migration Rules

1. Migrate by business capability.
2. Avoid big-bang replacement.
3. Put translation in Integration/ACL.
4. Do not leak legacy database schema into new domain.
5. Maintain clear source-of-truth ownership during transition.
6. Avoid dual-write where possible.
7. If dual-write is temporarily required, define reconciliation.

---

# 081 — Source-of-Truth During Migration

Every capability must identify one source of truth.

Example:

```text
Before migration:
Legacy Orders = source of truth

During controlled cutover:
New Order Service = source of truth for migrated channels
Legacy = read/compatibility only

After migration:
Order Service = sole source of truth
```

Never leave ownership ambiguous.

---

# 082 — Dual-Write Risk

Bad migration:

```text
Request
  ├── write legacy DB
  └── write new DB
```

Possible failure:

```text
legacy succeeds
new fails
```

Prefer:

```text
Write source of truth
      ↓
Outbox/Event
      ↓
Synchronize secondary system
```

---

# 083 — Service Split Criteria

A module should become its own service when several conditions are true.

Possible signals:

```text
Independent release needed
Independent scaling needed
Different data ownership
Different team ownership
Different security requirements
Different availability target
Different technology requirement
High complexity
High change rate
Clear bounded context
```

---

# 084 — Service Merge Criteria

Two services may be merged when:

```text
They always deploy together.
They always call each other.
They share one transaction constantly.
They have the same owner.
Their boundaries are unclear.
Network separation adds no value.
```

Microservices are not permanent decisions.

---

# 085 — Service Boundary Anti-Patterns

## 085.1 Service per Table

Bad:

```text
user-service
user-address-service
user-phone-service
```

---

## 085.2 Service per CRUD Screen

Bad:

```text
admin-order-list-service
admin-order-detail-service
```

---

## 085.3 Shared Database Ownership

Bad:

```text
Service A and Service B both update same tables.
```

---

## 085.4 Chatty Services

Bad:

```text
Order
 ↓
Catalog
 ↓
Customer
 ↓
Inventory
 ↓
Promotion
 ↓
Wallet
 ↓
Loyalty
```

for every request.

---

## 085.5 Circular Service Calls

Bad:

```text
A → B → C → A
```

---

## 085.6 Shared Domain Library

Bad:

```text
common-domain.jar
```

containing all business entities.

---

# 086 — Example Order Boundary Flow

```text
Mobile App
   ↓
API Gateway
   ↓
Order Service
   │
   ├── Catalog Service → validate product snapshot
   ├── Inventory Service → reserve inventory
   └── Payment/Wallet → settle funds
   ↓
OrderCreated / OrderCompleted
   ↓ Kafka
   ├── Loyalty
   ├── Mission
   ├── Notification
   └── Analytics
```

Important:

- Order Service owns order state.
- Inventory owns reservation.
- Payment/Wallet own money.
- Loyalty owns points.
- Notification owns delivery.

---

# 087 — Example Wallet Boundary Flow

```text
Order Service
    ↓
ReserveWalletFunds
    ↓
Wallet Service
    ↓
Wallet DB
    ↓
WalletFundsReserved
```

Then:

```text
Order accepted
    ↓
CaptureWalletFunds
    ↓
Wallet Service
    ↓
WalletFundsCaptured
```

No other service modifies wallet balances.

---

# 088 — Example Loyalty Boundary Flow

```text
OrderCompleted
      ↓
Kafka
      ↓
Loyalty Service
      ↓
Check processed_event
      ↓
Apply earning rule
      ↓
Points ledger
      ↓
PointsEarned
```

---

# 089 — Example Notification Boundary Flow

```text
RewardAssigned
      ↓
Kafka
      ↓
Notification Service
      ↓
Resolve template
      ↓
Send FCM/email
      ↓
Store delivery status
```

Notification failure does not revert reward assignment.

---

# 090 — Service Documentation Standard

Each service must document:

```text
Purpose
Owned business capability
Owned data
Commands
Queries
Events published
Events consumed
REST/gRPC contracts
Dependencies
Timeouts
Retry behavior
Idempotency behavior
Security requirements
Database migrations
Operational dashboards
Alerts
Runbook
```

---

# 091 — Service README Template

Recommended:

```text
# Service Name

## Purpose
## Business Ownership
## Architecture
## API
## gRPC
## Events Published
## Events Consumed
## Database
## Idempotency
## Security
## Local Development
## Testing
## Deployment
## Monitoring
## Alerts
## Runbook
```

---

# 092 — Service Boundary Review Checklist

## Ownership

- [ ] Service has a clear business capability.
- [ ] Authoritative data ownership is defined.
- [ ] Other services cannot write its database.
- [ ] Source of truth is clear.

## Coupling

- [ ] No circular dependency.
- [ ] Synchronous calls are limited.
- [ ] Secondary reactions use events where appropriate.
- [ ] Shared libraries do not contain domain ownership.

## Reliability

- [ ] Hard and soft dependencies are classified.
- [ ] Timeouts are defined.
- [ ] Retry behavior is defined.
- [ ] Idempotency is defined.
- [ ] Failure isolation is understood.

## Data

- [ ] Database ownership is explicit.
- [ ] No cross-service foreign keys.
- [ ] Reporting strategy does not rely on cross-service SQL joins.
- [ ] Sensitive data is classified.

## Migration

- [ ] Legacy ownership is defined.
- [ ] Cutover strategy is defined.
- [ ] Dual-write risk is addressed.
- [ ] Anti-corruption layer is identified.

---

# 093 — Recommended Initial Service Set

For the first realistic implementation:

```text
1. api-gateway
2. identity-service
3. catalog-service
4. order-service
5. payment-service
6. wallet-service
7. loyalty-service
8. notification-service
9. integration-service
```

Temporarily keep:

```text
Customer inside Identity
Cart inside Ordering
Promotion inside Loyalty
Mission inside Loyalty
```

Then split based on real complexity.

---

# 094 — Recommended Later Split

Possible future architecture:

```text
identity-service
customer-service

catalog-service
inventory-service
cart-service
order-service

payment-service
wallet-service

loyalty-service
promotion-service
mission-service

notification-service
integration-service

analytics-service
reporting-service
```

Do not create these services before there is a clear reason.

---

# 095 — Deliverables of PART 03

PART 03 should produce:

1. Service decomposition principles.
2. Initial service map.
3. Recommended initial deployment shape.
4. Service ownership rules.
5. Database ownership rules.
6. Service dependency rules.
7. Synchronous/asynchronous communication rules.
8. API Gateway boundary.
9. Identity Service definition.
10. Customer Service definition.
11. Catalog Service definition.
12. Inventory Service definition.
13. Cart Service definition.
14. Order Service definition.
15. Payment Service definition.
16. Wallet Service definition.
17. Loyalty Service definition.
18. Promotion Service definition.
19. Mission Service definition.
20. Notification Service definition.
21. Integration/ACL Service definition.
22. Dependency matrix.
23. Ownership matrix.
24. Availability classification.
25. Security classification.
26. Migration/Strangler strategy.
27. Source-of-truth rules.
28. Split/merge criteria.
29. Anti-pattern rules.
30. Service documentation standard.

---

# 096 — Exit Criteria

PART 03 is ready when the team can answer:

### Ownership

```text
Which service owns each business capability?
```

### Data

```text
Which service owns each table/database?
```

### Communication

```text
Which interactions are synchronous?
Which are asynchronous?
```

### Dependencies

```text
Which services depend on which services?
```

### Failure

```text
What happens when a dependency is unavailable?
```

### Consistency

```text
Where is strong consistency required?
```

### Idempotency

```text
Which operations must be safely repeatable?
```

### Migration

```text
Which legacy capability is replaced first?
```

### Deployment

```text
Can each service be deployed independently?
```

### Security

```text
Which services require the strongest protection?
```

If these answers are unclear, implementation should not proceed to detailed service templates yet.

---

# 097 — Handoff to PART 04

PART 04 defines the internal architecture of each service.

```text
PART 03
Service Boundaries
      ↓
Owned Business Capability
      ↓
Owned Data
      ↓
Contracts
      ↓
Dependencies
      ↓
PART 04
Clean + Hexagonal Architecture
```

PART 04 will define:

```text
Domain Layer
Application Layer
Input Ports
Output Ports
REST Adapter
gRPC Adapter
Kafka Adapter
Persistence Adapter
External Integration Adapter
Dependency Rules
Common Service Template
Package Structure
```

---

# PART 03 — Summary

The key principle is:

```text
A microservice is a business ownership boundary,
not a network wrapper around a table.
```

The correct decomposition flow is:

```text
Business Capability
        ↓
Bounded Context
        ↓
Ownership
        ↓
Consistency Boundary
        ↓
Service Boundary
        ↓
Database Ownership
        ↓
Contracts
        ↓
Independent Deployment
```

A good service boundary should make these questions easy to answer:

```text
What does this service own?
What does it not own?
What data may it change?
What commands may it accept?
What events may it publish?
Which dependencies are required?
How does it fail?
How is it deployed?
```

If ownership is unclear, the boundary is not ready.

---

**End of PART 03 — Service Boundaries**
