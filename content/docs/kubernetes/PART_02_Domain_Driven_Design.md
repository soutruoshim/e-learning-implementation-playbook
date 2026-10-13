---
title: "PART 02 — DOMAIN-DRIVEN DESIGN"
---

# PART 02 — DOMAIN-DRIVEN DESIGN

> **Document Role:** Domain analysis and modeling foundation for the microservices platform.  
> **Previous Part:** PART 01 — Project Definition  
> **Next Part:** PART 03 — Service Boundaries  
> **Status:** Architecture / Design  
> **Audience:** Backend engineers, solution architects, product owners, QA engineers, DevOps engineers, technical leads.

---

# 020 — Domain Discovery

## 020.1 Purpose

Domain discovery converts the business definition from PART 01 into a model that engineers can use to design software boundaries, business rules, APIs, events, databases, and services.

The goal is **not** to start by creating microservices.

The goal is to first understand:

- What the business actually does.
- Which business capabilities are independent.
- Which rules belong together.
- Which concepts mean different things in different areas.
- Which operations require strong consistency.
- Which operations may use eventual consistency.
- Which information belongs to which domain.
- Which domain has authority over each important business fact.

The output of domain discovery will later be used to define microservice boundaries in PART 03.

---

## 020.2 Domain Discovery Principle

Use this order:

```text
Business Requirements
        ↓
Business Capabilities
        ↓
Domain Concepts
        ↓
Business Rules
        ↓
Domain Invariants
        ↓
Bounded Contexts
        ↓
Context Relationships
        ↓
Aggregates
        ↓
Domain Events
        ↓
Service Boundaries
```

Do not use this order:

```text
Create Services
        ↓
Create Databases
        ↓
Try to fit the business into them
```

Technical boundaries must follow business boundaries.

---

## 020.3 Discovery Inputs

The domain discovery process uses the outputs from PART 01, including:

- Business requirements.
- Actors.
- Use cases.
- Functional requirements.
- Non-functional requirements.
- Business rules.
- Constraints.
- Assumptions.
- Architecture principles.
- Scope.
- Risks.
- Success criteria.

Additional inputs may include:

- Existing applications.
- Existing APIs.
- Existing database schemas.
- Store/POS workflows.
- Payment provider workflows.
- Wallet/top-up processes.
- Loyalty rules.
- Promotion rules.
- Mission rules.
- Operational support procedures.
- Finance reconciliation procedures.
- Customer-service procedures.
- Existing batch jobs.
- Existing integrations.
- Existing reports.

---

## 020.4 Discovery Participants

Domain discovery should involve both technical and business participants.

Recommended participants:

| Role | Responsibility |
|---|---|
| Product Owner | Defines business goals and priorities |
| Domain Expert | Explains real operational rules |
| Backend Lead | Identifies technical implications |
| Architect | Guides domain boundaries |
| QA | Identifies edge cases and acceptance rules |
| Finance Representative | Validates payment/wallet/reconciliation rules |
| Loyalty/CRM Representative | Validates points, rewards, tiers, missions |
| Operations/Store Representative | Validates ordering and fulfillment workflows |
| Security Representative | Identifies sensitive operations and data |
| DevOps/SRE | Identifies reliability and operational constraints |

---

## 020.5 Discovery Techniques

Use one or more of the following techniques:

### Event Storming

Start from important business events.

Example:

```text
Customer Registered
        ↓
Order Created
        ↓
Payment Authorized
        ↓
Order Accepted
        ↓
Order Completed
        ↓
Points Earned
        ↓
Reward Issued
        ↓
Notification Sent
```

Then identify:

- Commands that caused the events.
- Actors that issued the commands.
- Aggregates that handled the commands.
- Policies triggered by the events.
- External systems involved.
- Read models used by users.

### Workflow Mapping

Example:

```text
Customer
   ↓
Browse Menu
   ↓
Select Items
   ↓
Create Order
   ↓
Validate Availability
   ↓
Calculate Price
   ↓
Choose Payment
   ↓
Confirm Order
   ↓
Fulfill Order
   ↓
Complete Order
   ↓
Earn Loyalty
```

### Business Rule Extraction

For every workflow ask:

- What can happen?
- What cannot happen?
- Who may perform it?
- What data is required?
- What must already exist?
- What must be unique?
- What must be atomic?
- What can fail?
- What happens after failure?
- What happens when the same request is received twice?

---

# 021 — Domain Vocabulary / Ubiquitous Language

## 021.1 Purpose

A microservices platform becomes difficult to maintain when the same word means different things across teams.

Domain-Driven Design requires a shared vocabulary called the **Ubiquitous Language**.

The language must be used consistently in:

- Requirements.
- Design documents.
- API names.
- Class names.
- Database names.
- Events.
- Test cases.
- Logs.
- Dashboards.
- Operations documentation.

---

## 021.2 Vocabulary Rules

Use business terms rather than vague technical terms.

Prefer:

```text
Order
Payment
Wallet Reservation
Reward Claim
Points Ledger
Mission Progress
Inventory Reservation
```

Avoid:

```text
Data
Record
Info
Process
Thing
TransactionData
HandlerData
GeneralStatus
```

A term must have one precise meaning inside a bounded context.

---

## 021.3 Core Vocabulary

### Identity / Customer

| Term | Meaning |
|---|---|
| User | Authenticated platform identity |
| Customer | Business participant who purchases products/services |
| Credential | Information used to authenticate a user |
| Role | Named permission grouping |
| Access Token | Short-lived authorization token |
| Refresh Token | Token used to obtain a new access token |
| Member | Customer participating in membership/loyalty |
| Member Card | Membership identifier/card associated with a customer |

### Catalog

| Term | Meaning |
|---|---|
| Product | Sellable business product |
| Menu Item | Product exposed through a menu |
| Modifier | Optional or required item customization |
| Price | Monetary selling price |
| Availability | Whether an item can currently be ordered |
| Store Menu | Menu configuration available at a specific store |

### Ordering

| Term | Meaning |
|---|---|
| Cart | Temporary selection before order creation |
| Order | Confirmed purchase request |
| Order Item | Individual product line in an order |
| Order Status | Current lifecycle state of an order |
| Pickup | Customer collects order from store |
| Delivery | Order delivered to customer |
| Dine-In | Order consumed at store |
| Cancellation | Termination of an order before completion |

### Inventory

| Term | Meaning |
|---|---|
| Stock | Quantity available for fulfillment |
| Reservation | Quantity temporarily held for an order |
| Release | Return of reserved quantity |
| Deduction | Permanent reduction after fulfillment |
| Availability | Whether inventory can satisfy demand |

### Payment

| Term | Meaning |
|---|---|
| Payment | Financial settlement attempt for an order |
| Authorization | Permission to charge funds |
| Capture | Final collection of authorized funds |
| Refund | Return of captured funds |
| Reversal | Cancellation of an authorization or previous financial movement |
| Payment Method | Instrument used to pay |
| Payment Provider | External provider that processes payment |

### Wallet

| Term | Meaning |
|---|---|
| Wallet | Stored-value account |
| Available Balance | Funds available for new transactions |
| Reserved Balance | Funds temporarily locked |
| Ledger Entry | Immutable financial movement record |
| Top-Up | Addition of funds to wallet |
| Reservation | Temporary hold of wallet funds |
| Capture | Final transfer from reserved funds |
| Release | Return of reserved funds |
| Refund | Return of previously captured funds |
| Reversal | Correction that offsets a previous ledger movement |
| Reconciliation | Verification against external/internal financial records |

### Loyalty

| Term | Meaning |
|---|---|
| Points Account | Logical customer points balance |
| Points Ledger | Immutable earn/redeem/expire records |
| Earn | Addition of loyalty points |
| Redeem | Use of points |
| Expiry | Removal of expired points |
| Tier | Membership level |
| Reward | Benefit assigned to a customer |
| Mission | Defined behavior/action that can earn progress/reward |
| Mission Progress | Customer progress toward mission completion |
| Campaign | Time-scoped business promotion or engagement configuration |
| Coupon | Redeemable benefit represented by a code or entitlement |
| Promotion | Pricing or benefit rule applied to eligible transactions |

### Notification

| Term | Meaning |
|---|---|
| Notification | Message sent to a recipient |
| Template | Reusable message definition |
| Channel | Push, email, SMS, etc. |
| Delivery Attempt | One attempt to send a notification |
| Delivery Status | Result of an attempt |

---

## 021.4 Ambiguous Terms

Some words may mean different things in different domains.

Example: `Transaction`

Possible meanings:

```text
Payment Transaction
Wallet Transaction
Points Transaction
Order Transaction
Database Transaction
```

Do not create a universal `Transaction` entity.

Use explicit names:

```text
PaymentTransaction
WalletLedgerEntry
PointsLedgerEntry
Order
DatabaseTransaction
```

---

## 021.5 Vocabulary Governance

When a new domain term is introduced:

1. Define the term.
2. Identify its bounded context.
3. Confirm that another term does not already represent it.
4. Add it to the glossary.
5. Use the exact term in code and documentation.

---

# 022 — Domain Classification

## 022.1 Purpose

Not every domain deserves the same engineering effort.

Classify domains as:

- Core Domain
- Supporting Domain
- Generic Domain

---

## 022.2 Core Domain

A core domain provides important business differentiation.

Possible core domains for this platform:

```text
Ordering
Wallet
Loyalty
Promotions / Missions
```

These domains may require:

- Rich domain models.
- Strong business invariants.
- Dedicated engineering ownership.
- Detailed testing.
- Custom logic.
- Careful auditability.

---

## 022.3 Supporting Domain

Supporting domains are necessary but may not differentiate the business.

Examples:

```text
Catalog
Inventory
Customer Profile
Notification
Integration
```

---

## 022.4 Generic Domain

Generic capabilities are commonly available and should usually not be reinvented unnecessarily.

Examples:

```text
Authentication protocol
Email delivery
Push notification delivery
Object storage
Monitoring
Logging
```

A generic domain may be implemented using third-party or platform tools.

---

## 022.5 Classification Table

| Domain | Initial Classification | Reason |
|---|---|---|
| Ordering | Core | Central transaction workflow |
| Wallet | Core | Financial integrity and reconciliation |
| Loyalty | Core | Customer engagement/business differentiation |
| Mission | Core/Supporting | Depends on strategic importance |
| Promotions | Core/Supporting | Business-specific pricing/reward rules |
| Payment | Supporting/Core | Critical but often provider-dependent |
| Inventory | Supporting | Required for fulfillment |
| Catalog | Supporting | Product/menu representation |
| Identity | Generic/Supporting | Standard auth with business-specific profile needs |
| Notification | Generic/Supporting | Common delivery capability |
| Integration | Supporting | Protects core model from external systems |

This classification may change after business review.

---

# 023 — Bounded Contexts

## 023.1 Definition

A bounded context is a clear boundary inside which:

- A domain model has one consistent meaning.
- Business rules are internally consistent.
- Terms are unambiguous.
- Data ownership is clear.
- Changes can be reasoned about independently.

A bounded context is not automatically a microservice.

One bounded context may initially be implemented as:

- One module.
- One deployable service.
- Multiple services.

Service decisions are defined in PART 03.

---

## 023.2 Candidate Bounded Contexts

Initial candidate contexts:

```text
Identity Context
Customer Context
Catalog Context
Inventory Context
Cart Context
Ordering Context
Payment Context
Wallet Context
Loyalty Context
Promotion Context
Mission Context
Notification Context
Integration / Anti-Corruption Context
```

---

## 023.3 Identity Context

### Responsibility

Owns authentication and authorization identity concepts.

### Main concepts

```text
User
Credential
Role
Permission
Access Token
Refresh Token
Authentication Session
```

### Responsibilities

- User authentication.
- Credential validation.
- Token issuance.
- Token refresh.
- Role assignment.
- Account lock/security states.

### Does not own

- Customer order history.
- Wallet balance.
- Loyalty points.
- Product catalog.
- Payment records.

---

## 023.4 Customer Context

### Responsibility

Owns customer-facing profile and membership identity information.

### Main concepts

```text
Customer
Profile
Contact Information
Member ID
Member Card
Preferences
```

### Responsibilities

- Customer profile.
- Contact details.
- Membership mapping.
- Customer preferences.

### Does not own

- Passwords.
- Wallet financial records.
- Loyalty ledger.
- Orders.

---

## 023.5 Catalog Context

### Responsibility

Describes what can be offered/sold.

### Main concepts

```text
Product
Menu Item
Category
Modifier
Sub-Modifier
Price
Store Menu
Availability Metadata
```

### Responsibilities

- Product definition.
- Menu hierarchy.
- Price metadata.
- Product configuration.
- Store-level offering configuration.

Catalog availability may depend on Inventory but the meaning is different.

---

## 023.6 Inventory Context

### Responsibility

Tracks whether physical or logical stock can satisfy demand.

### Main concepts

```text
Stock Item
Stock Level
Reservation
Release
Deduction
Adjustment
```

### Responsibilities

- Stock quantity.
- Reservation.
- Release.
- Fulfillment deduction.
- Stock adjustments.

---

## 023.7 Cart Context

### Responsibility

Owns pre-order shopping intent.

### Main concepts

```text
Cart
Cart Item
Selected Modifier
Cart Price Snapshot
```

### Responsibilities

- Add/remove cart items.
- Change quantities.
- Temporary selections.
- Pre-checkout calculations.

A cart is not an order.

---

## 023.8 Ordering Context

### Responsibility

Owns the authoritative lifecycle of a customer order.

### Main concepts

```text
Order
Order Item
Order Status
Fulfillment Type
Order Price Snapshot
Order Address
Cancellation
```

### Responsibilities

- Create order.
- Validate order state transitions.
- Maintain immutable or auditable order facts.
- Track order status.
- Request cancellation.
- Mark completion.

### Example lifecycle

```text
PENDING
   ↓
ACCEPTED
   ↓
PREPARING
   ↓
READY / DELIVERY
   ↓
DONE
```

Cancellation flow:

```text
PENDING / ACCEPTED
        ↓
CANCELLATION_REQUESTED
        ↓
CANCELLED
```

Exact lifecycle must be confirmed by business rules.

---

## 023.9 Payment Context

### Responsibility

Owns payment processing state.

### Main concepts

```text
Payment
Payment Attempt
Authorization
Capture
Refund
Reversal
Payment Method
Provider Reference
```

### Responsibilities

- Create payment.
- Authorize.
- Capture.
- Refund.
- Reconcile provider results.
- Track provider references.
- Handle duplicate callbacks safely.

Payment status is not order status.

---

## 023.10 Wallet Context

### Responsibility

Owns stored-value financial integrity.

### Main concepts

```text
Wallet Account
Available Balance
Reserved Balance
Ledger Entry
Top-Up
Reservation
Capture
Release
Refund
Reversal
Reconciliation
```

### Responsibilities

- Record immutable money movement.
- Calculate/maintain balances.
- Prevent negative balance where prohibited.
- Reserve funds.
- Capture funds.
- Release funds.
- Top up.
- Refund.
- Reverse incorrect transactions.
- Reconcile with external records.

Wallet rules must be designed with strong consistency.

---

## 023.11 Loyalty Context

### Responsibility

Owns points, tier, and loyalty entitlement state.

### Main concepts

```text
Points Account
Points Ledger
Membership Tier
Earn Rule
Redeem Rule
Expiry Rule
Reward Entitlement
```

### Responsibilities

- Earn points.
- Redeem points.
- Expire points.
- Determine tier.
- Maintain points history.
- Expose loyalty balance.

---

## 023.12 Promotion Context

### Responsibility

Owns eligibility and promotional benefit rules.

### Main concepts

```text
Promotion
Coupon
Eligibility Rule
Benefit
Redemption
Usage Limit
```

### Responsibilities

- Determine promotion eligibility.
- Validate coupon.
- Calculate allowed benefit.
- Record redemption.
- Enforce usage limits.

---

## 023.13 Mission Context

### Responsibility

Owns engagement missions and progress.

### Main concepts

```text
Mission
Mission Rule
Mission Condition
Mission Progress
Mission Completion
Mission Reward
Journey
Campaign
```

### Responsibilities

- Evaluate mission events.
- Update progress.
- Detect completion.
- Prevent duplicate completion.
- Assign rewards according to rule.
- Handle mission periods.

---

## 023.14 Notification Context

### Responsibility

Owns communication delivery.

### Main concepts

```text
Notification
Template
Recipient
Channel
Delivery Attempt
Delivery Status
```

### Responsibilities

- Render notification.
- Select channel.
- Send notification.
- Retry delivery.
- Store delivery result.

Notification failure should usually not roll back completed business transactions.

---

## 023.15 Integration / Anti-Corruption Context

### Responsibility

Protects internal domain models from external or legacy models.

### Main concepts

```text
External Adapter
Legacy Mapping
Provider Mapping
Translation Rule
Integration Message
Synchronization State
```

### Responsibilities

- Translate legacy data.
- Translate partner APIs.
- Normalize provider responses.
- Isolate legacy-specific concepts.
- Support strangler migration.

---

# 024 — Context Boundary Rules

## 024.1 Rule: One Context Owns Each Business Fact

Examples:

```text
Order status          → Ordering Context
Wallet balance        → Wallet Context
Points balance        → Loyalty Context
Payment status        → Payment Context
Product definition    → Catalog Context
Stock level           → Inventory Context
```

Other contexts may cache or project these facts, but they must not become authoritative owners.

---

## 024.2 Rule: Do Not Share Domain Models

Wrong:

```text
ordering-service imports PaymentEntity
```

Correct:

```text
Ordering Context
      ↓ contract
Payment Context
```

Each context maintains its own model.

---

## 024.3 Rule: Avoid Cross-Context Database Writes

Wrong:

```text
Order logic
   ↓
UPDATE wallet_ledger
```

Correct:

```text
Ordering
   ↓ Command / API / Event
Wallet
   ↓
Wallet database
```

---

## 024.4 Rule: Shared Database Does Not Mean Shared Ownership

During migration, multiple contexts may temporarily exist in one physical database.

Logical ownership must still remain explicit.

Example:

```text
Single PostgreSQL Cluster

ordering schema   → Ordering
payment schema    → Payment
wallet schema     → Wallet
loyalty schema    → Loyalty
```

---

# 025 — Context Map

## 025.1 Purpose

A context map shows how bounded contexts interact.

Initial conceptual map:

```text
                    Identity
                       │
                       ▼
                    Customer
                       │
                       ▼
Catalog ───────────► Ordering ◄────────── Inventory
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
           Payment   Wallet   Promotion
              │        │
              └────┬───┘
                   ▼
                 Loyalty
                   │
                   ▼
                 Mission
                   │
                   ▼
              Notification

Legacy / External Systems
          │
          ▼
Integration / ACL
          │
          └────────► Internal Contexts
```

This is an initial map, not a final deployment topology.

---

# 026 — Context Relationship Patterns

## 026.1 Customer / Supplier

One context provides capabilities required by another.

Example:

```text
Catalog Context
      ↓
Ordering Context
```

Ordering consumes catalog information.

---

## 026.2 Published Language

A context exposes a stable contract.

Examples:

- REST schema.
- Protobuf schema.
- Kafka event schema.

The internal model must not leak directly.

---

## 026.3 Anti-Corruption Layer

Use when integrating with:

- Legacy systems.
- Payment partners.
- POS.
- External loyalty systems.
- External top-up providers.
- Third-party delivery partners.

Example:

```text
External Provider Model
          ↓
Anti-Corruption Layer
          ↓
Internal Payment Model
```

---

## 026.4 Conformist

Avoid conforming blindly to an external model when it would damage internal domain clarity.

Use only when:

- Integration is simple.
- External model is stable.
- Business risk is low.

---

## 026.5 Shared Kernel

Use very carefully.

Possible shared kernel candidates:

```text
Money value object
Currency code
Time utilities
Correlation ID
```

Do not put business entities such as `Order`, `Wallet`, or `Payment` in a shared kernel.

---

# 027 — Aggregate Design

## 027.1 Definition

An aggregate is a consistency boundary.

It contains:

- Aggregate root.
- Internal entities.
- Value objects.
- Business invariants.

External code modifies an aggregate only through its aggregate root.

---

## 027.2 Aggregate Design Rules

1. Keep aggregates small.
2. Protect invariants inside the aggregate.
3. Reference other aggregates by ID.
4. Avoid loading large object graphs.
5. Use one transaction per aggregate when possible.
6. Use domain events for cross-aggregate effects.
7. Avoid distributed transactions across contexts.

---

## 027.3 Candidate Aggregates

Potential aggregates:

```text
User
Customer
Product
StockItem
Cart
Order
Payment
WalletAccount
PointsAccount
MissionProgress
Promotion
Notification
```

Exact aggregate boundaries must be validated by business invariants.

---

# 028 — Aggregate Roots

## 028.1 Order Aggregate

Possible root:

```text
Order
```

Contains:

```text
OrderItem
OrderAddress
PriceSnapshot
StatusHistory
```

Possible invariants:

- Order must contain at least one item.
- Quantity must be positive.
- Order total cannot be negative.
- Completed order cannot return to pending.
- Cancelled order cannot be completed.
- Status transitions must follow defined lifecycle.
- Financial totals must remain internally consistent.

---

## 028.2 Wallet Account Aggregate

Possible root:

```text
WalletAccount
```

Potentially coordinates:

```text
AvailableBalance
ReservedBalance
```

Ledger entries may be separate immutable records depending on implementation.

Possible invariants:

- Available balance must not fall below allowed minimum.
- Reservation cannot exceed available balance.
- Capture cannot exceed reserved amount.
- Release cannot exceed reservation remainder.
- Same idempotency key must not create duplicate movement.

---

## 028.3 Points Account Aggregate

Possible root:

```text
PointsAccount
```

Possible invariants:

- Redeemed points cannot exceed redeemable points.
- Expired points cannot be redeemed.
- Same earn event must not be applied twice.
- Ledger must remain auditable.

---

## 028.4 Mission Progress Aggregate

Possible root:

```text
MissionProgress
```

Possible invariants:

- Progress cannot exceed defined rules unless explicitly allowed.
- Completion occurs only once per allowed cycle.
- Duplicate qualifying event must not increase progress twice.
- Reward assignment must follow completion rules.

---

# 029 — Entities

## 029.1 Definition

An entity has identity that continues through state changes.

Examples:

```text
Order
Payment
Customer
WalletAccount
MissionProgress
```

An entity is not defined only by its attributes.

---

## 029.2 Entity Example

An order may change:

```text
status
delivery address
payment reference
fulfillment state
```

but it remains the same order because its identity remains:

```text
order_id
```

---

## 029.3 Entity Rules

- Identity must be stable.
- Equality should normally be based on identity.
- Entity changes must respect aggregate invariants.
- Avoid exposing mutable entity state directly.

---

# 030 — Value Objects

## 030.1 Definition

A value object has no independent identity.

It is defined by its value.

Examples:

```text
Money
Currency
EmailAddress
PhoneNumber
OrderNumber
Percentage
DateRange
Address
Points
Quantity
```

---

## 030.2 Money Value Object

Recommended structure:

```text
Money
 ├── amount
 └── currency
```

Examples:

```text
12.50 USD
50000 KHR
```

Rules:

- Never silently add different currencies.
- Define rounding rules explicitly.
- Avoid binary floating-point for authoritative financial calculations.
- Use decimal or integer minor units as appropriate.

---

## 030.3 Date Range Value Object

Example:

```text
DateRange
 ├── startsAt
 └── endsAt
```

Invariant:

```text
startsAt <= endsAt
```

Useful for:

- Promotions.
- Missions.
- Campaigns.
- Reward validity.
- Coupon validity.

---

## 030.4 Percentage Value Object

Example:

```text
Percentage(20)
```

Invariant:

```text
0 <= value <= 100
```

---

# 031 — Domain Services

## 031.1 Purpose

Use a domain service when important business logic:

- Does not naturally belong to one entity/value object.
- Is still part of the domain.
- Coordinates domain concepts without infrastructure concerns.

---

## 031.2 Examples

Potential domain services:

```text
PricingPolicy
PromotionEligibilityService
RewardSelectionPolicy
TierEvaluationPolicy
WalletReconciliationPolicy
OrderCancellationPolicy
```

---

## 031.3 Domain Service Restrictions

A domain service should not directly depend on:

- HTTP.
- Kafka.
- Database drivers.
- Redis clients.
- Framework controllers.
- Kubernetes configuration.

Those belong to adapters/application infrastructure.

---

# 032 — Domain Invariants

## 032.1 Definition

A domain invariant is a rule that must always remain true.

Invariants are more important than CRUD operations.

---

## 032.2 Ordering Invariants

Examples:

```text
An order must have at least one item.
Order quantity must be positive.
Order total cannot be negative.
A cancelled order cannot become completed.
A completed order cannot return to an earlier state.
Each accepted status transition must be valid.
```

---

## 032.3 Payment Invariants

Examples:

```text
Refund amount cannot exceed captured amount.
Capture cannot exceed authorized amount.
Duplicate provider callback must not create duplicate payment.
A failed payment cannot be marked successful without valid provider evidence.
```

---

## 032.4 Wallet Invariants

Examples:

```text
Wallet balance must remain financially consistent.
Reservation cannot exceed available funds.
Capture cannot exceed reservation.
Release cannot exceed remaining reservation.
Top-up reference must not be applied twice.
Ledger history must be immutable.
Reversal must reference an existing eligible transaction.
```

---

## 032.5 Loyalty Invariants

Examples:

```text
Points cannot be redeemed twice.
Expired points cannot be redeemed.
Duplicate earn event cannot create duplicate points.
Points ledger history must remain auditable.
Tier calculation must use configured rules.
```

---

## 032.6 Mission Invariants

Examples:

```text
A qualifying source event must be processed idempotently.
Mission completion must not happen twice for the same cycle.
Progress must satisfy all configured conditions.
Reward assignment must follow the configured completion policy.
```

---

## 032.7 Promotion Invariants

Examples:

```text
Expired promotions cannot be applied.
Usage limits must be enforced.
Customer eligibility must be satisfied.
A coupon cannot exceed its allowed redemption count.
Benefit calculation must follow configured currency/rounding rules.
```

---

# 033 — Domain Events

## 033.1 Definition

A domain event describes something meaningful that already happened in the domain.

Use past tense.

Good:

```text
OrderCreated
PaymentCaptured
WalletToppedUp
PointsEarned
MissionCompleted
RewardAssigned
```

Avoid:

```text
CreateOrder
DoPayment
EarnPoints
```

Those are commands, not events.

---

## 033.2 Candidate Domain Events

### Identity

```text
UserRegistered
UserAuthenticated
UserLocked
PasswordChanged
```

### Customer

```text
CustomerProfileUpdated
MemberCardLinked
```

### Ordering

```text
OrderCreated
OrderAccepted
OrderStatusChanged
OrderCancellationRequested
OrderCancelled
OrderCompleted
```

### Inventory

```text
InventoryReserved
InventoryReservationFailed
InventoryReleased
InventoryDeducted
```

### Payment

```text
PaymentCreated
PaymentAuthorized
PaymentCaptured
PaymentFailed
PaymentRefunded
PaymentReversed
```

### Wallet

```text
WalletTopUpCompleted
WalletFundsReserved
WalletFundsCaptured
WalletFundsReleased
WalletRefunded
WalletTransactionReversed
```

### Loyalty

```text
PointsEarned
PointsRedeemed
PointsExpired
MembershipTierChanged
RewardAssigned
RewardClaimed
```

### Mission

```text
MissionProgressUpdated
MissionCompleted
MissionRewardAssigned
```

### Notification

```text
NotificationRequested
NotificationSent
NotificationFailed
```

---

## 033.3 Domain Event Rules

Every event should identify:

```text
event_id
event_type
event_version
occurred_at
aggregate_id
correlation_id
causation_id
```

Cross-service event contract details are defined later in PART 05 and Kafka implementation in later parts.

---

# 034 — Commands

## 034.1 Definition

A command expresses intent to change state.

Examples:

```text
CreateOrder
CancelOrder
AuthorizePayment
ReserveWalletFunds
CaptureWalletFunds
EarnPoints
UpdateMissionProgress
```

A command may fail.

---

## 034.2 Command Characteristics

A command should:

- Have one clear business intention.
- Identify the target aggregate/context.
- Carry required input.
- Be validated.
- Enforce authorization.
- Respect idempotency where necessary.
- Produce zero or more domain events.

---

## 034.3 Example

```text
Command:
ReserveWalletFunds

Input:
- wallet_id
- amount
- currency
- reference_id
- idempotency_key

Possible Result:
- ReservationCreated
- InsufficientBalance
- DuplicateRequest
- CurrencyMismatch
```

---

# 035 — Queries

## 035.1 Definition

A query requests information without intentionally changing domain state.

Examples:

```text
GetOrder
GetWalletBalance
GetPointsBalance
ListAvailableRewards
GetMissionProgress
```

---

## 035.2 Query Rules

Queries may use optimized read models.

A query does not always need to reconstruct a full domain aggregate.

Example:

```text
Order Write Model
       ↓
Projection
       ↓
Order History Read Model
       ↓
Mobile App
```

CQRS may be introduced only where it provides clear value.

Do not introduce CQRS everywhere by default.

---

# 036 — Policies and Business Reactions

## 036.1 Definition

A policy describes a business reaction to an event.

Example:

```text
OrderCompleted
      ↓
Earn Loyalty Points
```

Another:

```text
PaymentFailed
      ↓
Release Wallet Reservation
```

---

## 036.2 Policy Examples

```text
WHEN OrderCompleted
THEN EvaluateLoyaltyEarn

WHEN UserRegistered
THEN EvaluateWelcomeMission

WHEN PaymentCaptured
THEN ConfirmFinancialSettlement

WHEN OrderCancelled
THEN ReleaseInventory

WHEN MissionCompleted
THEN AssignReward

WHEN RewardAssigned
THEN RequestNotification
```

These reactions may later be implemented synchronously or asynchronously.

That decision is not made solely at the domain level.

---

# 037 — Consistency Boundaries

## 037.1 Strong Consistency

Strong consistency is appropriate when violating a rule would create incorrect authoritative state.

Examples:

```text
Wallet balance update
Wallet reservation
Wallet capture
Points redemption
Order aggregate status transition
Coupon redemption limit
```

---

## 037.2 Eventual Consistency

Eventual consistency may be acceptable for secondary reactions.

Examples:

```text
Notification sending
Analytics
Search index
Reporting projection
Loyalty update after order completion
Mission progress triggered from event
```

Business requirements determine acceptable delay.

---

## 037.3 Example

Do not require:

```text
Order Complete
    +
Points Earn
    +
Push Notification
```

to commit in one distributed transaction.

Prefer:

```text
Order Completed
       ↓
Publish Event
       ↓
Loyalty processes event
       ↓
Notification processes event
```

Each consumer must be idempotent.

---

# 038 — Domain Ownership Matrix

Initial conceptual ownership:

| Business Fact | Owning Context |
|---|---|
| User credentials | Identity |
| Customer profile | Customer |
| Product definition | Catalog |
| Product/menu availability config | Catalog |
| Physical/logical stock | Inventory |
| Cart | Cart |
| Order lifecycle | Ordering |
| Payment lifecycle | Payment |
| Wallet balance | Wallet |
| Wallet ledger | Wallet |
| Points balance | Loyalty |
| Points ledger | Loyalty |
| Membership tier | Loyalty |
| Promotion eligibility | Promotion |
| Coupon redemption | Promotion |
| Mission definition | Mission |
| Mission progress | Mission |
| Notification delivery | Notification |
| Legacy/provider translation | Integration / ACL |

This matrix is a major input to PART 03 and later database ownership design.

---

# 039 — Domain Modeling Standards

## 039.1 Naming

Use names from the Ubiquitous Language.

Examples:

```text
Order
OrderItem
WalletReservation
PointsLedgerEntry
MissionProgress
```

Avoid:

```text
Data
Helper
Manager
CommonObject
ProcessInfo
```

---

## 039.2 IDs

Prefer explicit identifiers:

```text
OrderId
PaymentId
WalletId
CustomerId
MissionId
RewardId
```

Avoid passing unrelated raw IDs without context where domain-specific types are possible.

---

## 039.3 Status Types

Avoid arbitrary status strings spread across the codebase.

Prefer explicit domain types:

```text
OrderStatus
PaymentStatus
WalletTransactionStatus
MissionStatus
```

---

## 039.4 State Transition Rules

State transitions must be explicit.

Example:

```text
PENDING
  ├──> ACCEPTED
  └──> CANCELLED

ACCEPTED
  ├──> PREPARING
  └──> CANCELLED

PREPARING
  └──> READY

READY
  └──> DONE
```

Invalid transitions must fail.

---

## 039.5 Auditability

Important business changes should provide enough information to answer:

```text
What changed?
When did it change?
Who/what caused it?
What was the previous state?
What is the new state?
What request/event caused it?
```

Financial domains require especially strong auditability.

---

# 039A — Example End-to-End Domain Flow: Order Completion

This section demonstrates how multiple bounded contexts participate without sharing ownership.

```text
Customer
   ↓
Create Order
   ↓
Ordering Context
   ↓
OrderCreated
```

Inventory reaction:

```text
OrderCreated
   ↓
Inventory Context
   ↓
Reserve Stock
   ↓
InventoryReserved
```

Payment reaction:

```text
Order Ready for Payment
   ↓
Payment / Wallet
   ↓
PaymentCaptured
```

Completion:

```text
Ordering
   ↓
OrderCompleted
```

Secondary reactions:

```text
OrderCompleted
      │
      ├──> Loyalty → Earn Points
      │
      ├──> Mission → Update Progress
      │
      ├──> Notification → Send Message
      │
      └──> Analytics → Update Metrics
```

Important:

- Ordering owns order completion.
- Loyalty owns points.
- Mission owns mission progress.
- Notification owns delivery.
- No consumer updates the Ordering database directly.

---

# 039B — Example End-to-End Domain Flow: Wallet Payment

```text
Customer Checkout
      ↓
Ordering
      ↓
Request Wallet Reservation
      ↓
Wallet
      ↓
Validate Balance
      ↓
Reserve Funds
      ↓
WalletFundsReserved
```

Later:

```text
Order Accepted
      ↓
Capture Reservation
      ↓
Wallet
      ↓
WalletFundsCaptured
```

If the order is cancelled before capture:

```text
OrderCancelled
      ↓
Release Reservation
      ↓
WalletFundsReleased
```

If money was already captured:

```text
Refund Required
      ↓
Wallet Refund
      ↓
WalletRefunded
```

---

# 039C — Example End-to-End Domain Flow: Loyalty Mission

```text
OrderCompleted
      ↓
Mission Context receives qualifying fact
      ↓
Check duplicate event
      ↓
Check mission eligibility
      ↓
Update progress
      ↓
MissionProgressUpdated
```

If target reached:

```text
MissionCompleted
      ↓
Assign Reward
      ↓
RewardAssigned
      ↓
NotificationRequested
```

This flow must remain idempotent.

---

# 039D — Domain Model Anti-Patterns

## Anemic Domain Model

Symptoms:

```text
Entity = getters/setters only
All business logic = Service class
```

Risk:

- Business rules become scattered.
- Invariants become easy to bypass.
- Tests become infrastructure-heavy.

---

## God Aggregate

Symptoms:

```text
Customer
 ├── Orders
 ├── Payments
 ├── Wallet
 ├── Points
 ├── Rewards
 └── Notifications
```

This is too large.

Split according to consistency and bounded-context ownership.

---

## Shared Database Model

Symptoms:

```text
Order Service reads payment tables.
Payment Service updates order tables.
Loyalty Service queries wallet ledger directly.
```

This creates hidden coupling.

---

## Generic Event Model

Avoid:

```json
{
  "type": "UPDATE",
  "table": "orders",
  "data": {}
}
```

Prefer business events:

```text
OrderCompleted
PaymentCaptured
PointsEarned
```

---

## Technical-First Boundary

Avoid creating services because of:

```text
Controllers
Tables
CRUD screens
Framework packages
```

Service boundaries should follow business ownership.

---

# 039E — Domain Review Checklist

Before moving to PART 03, review:

## Vocabulary

- [ ] Important terms are defined.
- [ ] Ambiguous terms are identified.
- [ ] Teams use consistent names.
- [ ] Terms map cleanly to business language.

## Bounded Contexts

- [ ] Candidate contexts are identified.
- [ ] Context responsibilities are clear.
- [ ] Context boundaries do not overlap excessively.
- [ ] Each important business fact has an owner.

## Aggregates

- [ ] Candidate aggregate roots are identified.
- [ ] Invariants are attached to the correct aggregate.
- [ ] Aggregates are not unnecessarily large.
- [ ] Cross-aggregate references use IDs where appropriate.

## Events

- [ ] Important business events are identified.
- [ ] Events are named in past tense.
- [ ] Commands are not confused with events.
- [ ] Duplicate-event behavior is considered.

## Consistency

- [ ] Strong-consistency operations are known.
- [ ] Eventual-consistency operations are known.
- [ ] Financial operations have explicit integrity rules.

## Integrations

- [ ] External/legacy systems are identified.
- [ ] Anti-corruption needs are identified.
- [ ] External models are not leaking into core domain models.

---

# 039F — Deliverables of PART 02

PART 02 should produce the following architecture artifacts:

1. Domain vocabulary / glossary.
2. Core/supporting/generic domain classification.
3. Candidate bounded-context list.
4. Context responsibility definitions.
5. Context map.
6. Context relationship definitions.
7. Domain ownership matrix.
8. Candidate aggregate roots.
9. Entity list.
10. Value-object list.
11. Domain-service candidates.
12. Domain invariants.
13. Domain-event catalog.
14. Command catalog.
15. Query catalog.
16. Policy/reaction catalog.
17. Consistency classification.
18. External/legacy integration boundaries.
19. Domain anti-pattern rules.
20. Review checklist.

---

# 039G — Exit Criteria

PART 02 is considered ready when the team can answer these questions clearly:

### Domain

```text
What are the main business domains?
```

### Language

```text
What does each important business term mean?
```

### Ownership

```text
Which context owns each business fact?
```

### Boundaries

```text
Where does one domain model stop and another begin?
```

### Invariants

```text
What rules must always remain true?
```

### Aggregates

```text
Which business objects require transactional consistency?
```

### Events

```text
What important business events occur?
```

### Commands

```text
What actions can users/systems request?
```

### Consistency

```text
Which workflows require strong consistency?
Which can be eventually consistent?
```

### Integrations

```text
Which external or legacy models need an anti-corruption layer?
```

If these answers are unclear, service decomposition should not be finalized yet.

---

# 039H — Handoff to PART 03

The next chapter uses the domain model from PART 02 to determine deployable service boundaries.

```text
PART 02
Domain Model
    ↓
Bounded Contexts
    ↓
Ownership
    ↓
Aggregates
    ↓
Invariants
    ↓
Domain Events
    ↓
PART 03
Service Boundaries
```

PART 03 will determine:

- Which bounded contexts become independent services.
- Which contexts may initially remain together.
- Service responsibilities.
- Service dependency rules.
- Database/table ownership.
- Synchronous vs asynchronous dependencies.
- Service ownership matrix.
- Service decomposition criteria.
- Migration boundaries for legacy systems.

---

# PART 02 — Summary

The most important principle is:

```text
Do not begin with microservices.

Begin with the business domain.
```

Then:

```text
Understand the language
        ↓
Find business rules
        ↓
Find invariants
        ↓
Define bounded contexts
        ↓
Define ownership
        ↓
Define aggregates
        ↓
Identify events and commands
        ↓
Map context relationships
        ↓
Only then define service boundaries
```

A strong domain model reduces:

- Cross-service coupling.
- Shared-database dependencies.
- Duplicate business logic.
- Incorrect ownership.
- Distributed transaction problems.
- Integration complexity.
- Ambiguous APIs.
- Inconsistent business behavior.

The domain model is therefore the foundation for all later parts:

```text
Service Boundaries
Database Ownership
Contracts
Clean Architecture
Kafka Events
Testing
Security
Observability
Deployment
Production Operations
```

---

**End of PART 02 — Domain-Driven Design**
