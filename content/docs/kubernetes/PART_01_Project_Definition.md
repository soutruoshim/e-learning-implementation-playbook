---
title: "PART 01 — Project Definition"
---

# PART 01 — Project Definition

> **Purpose:** Define exactly what the system is, why it exists, who uses it, what it must do, what it must not do, and which architectural principles will guide all later microservice design decisions.
>
> **Project example used throughout this document:** Coffee Ordering & Loyalty Platform.
>
> **Important rule:** Do not design service boundaries, databases, Kafka topics, Kubernetes resources, or implementation details until this part is sufficiently agreed and stable.

---

## Part 01 Objectives

By the end of PART 01, the team should be able to answer all of the following questions clearly:

1. What business problem are we solving?
2. Who are the users and external systems?
3. What are the major business capabilities?
4. What are the main user journeys?
5. What business rules must always be true?
6. What functional behavior must the platform provide?
7. What quality attributes are required?
8. What constraints are already known?
9. What assumptions are being made?
10. Which architecture principles will guide the solution?
11. What is explicitly in scope for the first release?
12. What is explicitly out of scope?
13. How will success be measured?
14. What decisions must be carried into Domain-Driven Design in PART 02?

---

# 001 — Business Requirements

## 001.1 Business Problem

The organization needs a digital platform that supports customer-facing and internal business operations around:

- Customer registration and authentication
- Customer profile management
- Product and menu browsing
- Shopping cart and ordering
- Pickup, dine-in, and delivery ordering flows
- Payment processing
- Wallet/top-up operations
- Loyalty points
- Membership tiers
- Missions and customer engagement
- Rewards
- Coupons and promotions
- Customer notifications
- Integration with existing/legacy systems
- Store and operational support

The platform must be designed so that it can evolve from a small initial implementation into a production-ready distributed platform without requiring a complete rewrite.

---

## 001.2 Business Goals

Primary business goals:

1. Provide a reliable digital ordering experience.
2. Reduce customer friction during registration, ordering, payment, and reward redemption.
3. Support multiple sales channels and store locations.
4. Provide accurate financial and loyalty records.
5. Support promotions, missions, rewards, and customer engagement campaigns.
6. Integrate safely with existing systems during migration.
7. Allow teams to develop and deploy business capabilities independently where justified.
8. Improve operational visibility through logs, metrics, traces, and business monitoring.
9. Reduce duplicate transactions and inconsistent state across distributed operations.
10. Support future scaling without tightly coupling all business domains together.

---

## 001.3 Business Capabilities

At the project-definition level, describe the system in terms of business capabilities rather than technical services.

### Customer & Identity

Capabilities:

- Register customer
- Authenticate customer
- Refresh session/token
- Manage profile
- Manage customer status
- Manage roles and permissions
- Manage customer identity across systems

### Catalog

Capabilities:

- Browse products
- Browse categories
- View pricing
- View product availability
- View store-specific offerings
- View modifiers/options

### Ordering

Capabilities:

- Create cart
- Add/remove items
- Validate order
- Submit order
- Track order state
- Cancel order
- Complete order
- Retrieve order history

### Inventory

Capabilities:

- Determine product availability
- Track sellable stock where applicable
- Reserve inventory when required
- Release inventory on cancellation/failure

### Payment

Capabilities:

- Create payment intent/transaction
- Authorize payment
- Capture payment
- Handle payment failure
- Refund payment
- Reconcile payment records

### Wallet

Capabilities:

- Maintain wallet account
- Top up wallet
- Reserve wallet funds
- Capture reserved funds
- Release reserved funds
- Refund wallet transaction
- Reverse failed transactions
- Reconcile wallet ledger

### Loyalty

Capabilities:

- Maintain points ledger
- Earn points
- Redeem points
- Expire points
- Manage membership tiers
- Evaluate loyalty rules

### Missions

Capabilities:

- Define missions
- Track mission progress
- Evaluate completion
- Assign rewards
- Claim rewards
- Expire mission/reward eligibility

### Promotions & Coupons

Capabilities:

- Define promotions
- Validate coupons
- Apply discounts
- Enforce eligibility rules
- Enforce usage limits
- Track campaign usage

### Notifications

Capabilities:

- Send push notifications
- Send email notifications
- Send operational notifications
- Track notification delivery state

### Integration

Capabilities:

- Connect to legacy systems
- Translate external models into internal models
- Synchronize required data
- Handle webhooks
- Protect the new domain model from legacy coupling

---

## 001.4 Initial Release Scope

The first production-oriented release should not attempt to implement every possible capability at once.

Recommended initial scope:

### Required

- Customer registration/login
- Customer profile
- Catalog/menu browsing
- Basic ordering
- Payment
- Order status tracking
- Notification
- Core audit logging
- Core observability
- Basic deployment automation

### Optional for first release depending on business priority

- Wallet
- Loyalty
- Missions
- Rewards
- Coupons
- Inventory reservation
- Legacy migration

### Explicitly defer until required

- Complex multi-region deployment
- Advanced event sourcing
- Full CQRS everywhere
- Multi-cloud deployment
- Premature microservice decomposition
- Complex service mesh unless justified

---

## 001.5 Business Outcomes

The platform should improve measurable outcomes such as:

- Order completion rate
- Payment success rate
- Order processing time
- Customer retention
- Loyalty participation
- Mission participation
- Reward redemption
- Reduction in duplicate transactions
- Reduction in failed integrations
- Faster deployment frequency
- Faster incident diagnosis
- Lower manual operational workload

---

# 002 — System Objectives

## 002.1 Functional Objectives

The platform shall:

1. Allow customers to create and manage accounts.
2. Allow customers to authenticate securely.
3. Allow customers to browse products and prices.
4. Allow customers to create and submit orders.
5. Support multiple order fulfillment modes where applicable.
6. Process payments safely.
7. Maintain consistent financial records.
8. Support wallet-based transactions where enabled.
9. Support points, tiers, missions, rewards, and coupons.
10. Notify customers about important business events.
11. Integrate with legacy/external systems without leaking external complexity into core domain logic.
12. Produce auditable business records.
13. Recover from transient failures safely.
14. Prevent duplicate processing where required.
15. Support independent deployment of services when clear business boundaries justify it.

---

## 002.2 Engineering Objectives

The architecture should support:

- Clear domain boundaries
- Explicit data ownership
- Backward-compatible contracts
- Safe service-to-service communication
- Idempotent critical operations
- Eventual consistency where distributed transactions are unavoidable
- Reliable event publishing
- Reliable event consumption
- Observable request flows
- Automated testing
- Automated deployment
- Rollback capability
- Secure secret management
- Controlled production changes
- Horizontal scaling
- Failure isolation

---

## 002.3 Production Objectives

A production-ready platform should eventually support:

- High availability for critical stateless services
- Health checks
- Resource requests/limits
- Autoscaling
- Centralized logging
- Metrics and dashboards
- Distributed tracing
- Alerting
- Database backups
- Tested restoration
- Incident response
- Runbooks
- Security scanning
- Dependency scanning
- Container scanning
- GitOps-based deployment
- Infrastructure as Code

---

# 003 — Actors

Actors represent people, systems, or external parties that interact with the platform.

## 003.1 Customer

Responsibilities/interactions:

- Register
- Login/logout
- Manage profile
- Browse catalog
- Create order
- Pay
- Cancel eligible orders
- View order status
- View wallet
- Top up wallet
- Earn/redeem points
- Participate in missions
- Claim rewards
- Use coupons
- Receive notifications

---

## 003.2 Store Staff

Possible responsibilities:

- Receive order
- Accept/reject order where business rules allow
- Prepare order
- Update fulfillment state
- Mark order ready
- Complete handover
- View store order queue
- Handle operational exceptions

---

## 003.3 Store Administrator

Possible responsibilities:

- View store operational configuration
- Manage availability where allowed
- Review order issues
- Review operational reports
- Support store users

---

## 003.4 Customer Support

Possible responsibilities:

- Search customer account
- Review order history
- Review payment state
- Review wallet transaction state
- Review loyalty/reward state
- Assist with incidents
- Trigger approved support operations
- View audit history

Support actions must be permission-controlled and auditable.

---

## 003.5 System Administrator

Responsibilities may include:

- Manage roles/permissions
- Manage configuration
- Review system health
- Review security events
- Control privileged operational actions

---

## 003.6 Marketing / CRM User

Possible responsibilities:

- Configure campaign
- Configure coupon
- Configure mission
- Configure reward
- Configure eligibility
- Review campaign performance

---

## 003.7 Finance / Reconciliation User

Possible responsibilities:

- Review payment records
- Review wallet ledger
- Review top-up records
- Review refunds/reversals
- Perform reconciliation
- Export financial reports
- Investigate mismatches

---

## 003.8 External Payment Provider

Interactions:

- Payment authorization
- Payment capture
- Refund
- Payment status callback
- Settlement/reconciliation data

---

## 003.9 External Notification Provider

Examples:

- Push notification provider
- Email provider
- SMS provider if later required

---

## 003.10 Legacy Platform

The legacy platform may:

- Own existing customer/member data
- Own store master data
- Own POS transactions
- Own payment history
- Own loyalty history
- Receive or expose integration APIs

A dedicated integration/ACL layer should isolate the new platform from legacy schemas and behaviors.

---

# 004 — Use Cases

Use cases describe business interactions. They do not define microservices yet.

## 004.1 Customer Registration

**Primary actor:** Customer

**Preconditions:**

- Customer is not already registered with the same unique identity.
- Required registration channels are available.

**Main flow:**

1. Customer submits registration data.
2. System validates required fields.
3. System validates uniqueness constraints.
4. System verifies identity/OTP if required.
5. System creates customer account.
6. System initializes required customer-related records.
7. System publishes/records registration completion.
8. Customer receives success response.

**Failure examples:**

- Duplicate identity
- Invalid OTP
- Rate limit exceeded
- External identity dependency unavailable

---

## 004.2 Customer Login

Main flow:

1. Customer submits credentials.
2. System validates credentials.
3. System evaluates account state.
4. System issues access/refresh credentials.
5. System records security/audit information.

Important considerations:

- Brute-force protection
- Rate limiting
- Token expiration
- Refresh-token lifecycle
- Revocation
- Device/session policy

---

## 004.3 Browse Catalog

Main flow:

1. Customer selects store/channel.
2. System loads available categories/products.
3. System applies availability rules.
4. System applies store-specific pricing where relevant.
5. System returns product details/options.

---

## 004.4 Create Order

Main flow:

1. Customer selects products.
2. System validates product availability.
3. System calculates price.
4. System applies promotion/coupon rules.
5. System calculates final payable amount.
6. System validates fulfillment information.
7. System creates order.
8. System generates payment requirements.
9. System returns order/payment state.

Critical requirements:

- Price calculation must be deterministic.
- Order creation should support idempotency.
- The submitted order must preserve a pricing snapshot.

---

## 004.5 Pay for Order

Main flow:

1. System receives payment request.
2. System validates order/payment eligibility.
3. System creates payment transaction.
4. Payment provider processes request.
5. System records success/failure.
6. Order/payment state is updated consistently.
7. Follow-up events are generated.

Critical requirements:

- Duplicate payment protection
- Idempotency
- Reconciliation support
- Auditable state transitions

---

## 004.6 Wallet Top-Up

Main flow:

1. Customer requests top-up.
2. System creates top-up transaction.
3. External provider processes payment.
4. System verifies success.
5. Wallet ledger entry is recorded.
6. Wallet balance becomes available.
7. Transaction is included in reconciliation.

Critical rules:

- Money must not be credited twice.
- Ledger entries should be immutable.
- Failed/incomplete top-ups must not inflate available balance.

---

## 004.7 Wallet Payment Reservation

Main flow:

1. Ordering requests wallet reservation.
2. Wallet validates available balance.
3. Wallet reserves amount.
4. Available balance decreases while reserved amount increases.
5. Order continues processing.
6. Reservation is later captured or released.

---

## 004.8 Complete Order

Potential effects:

- Order status changes to completed.
- Payment is finalized if required.
- Inventory reservation is committed.
- Loyalty earning is evaluated.
- Mission progress is evaluated.
- Notification is generated.
- Analytics/business events are emitted.

These effects may be eventually consistent; they should not require one cross-service database transaction.

---

## 004.9 Cancel Order

System must determine:

- Whether cancellation is still allowed
- Whether payment refund/reversal is required
- Whether wallet funds must be released
- Whether inventory reservation must be released
- Whether coupons should be restored
- Whether loyalty effects must be reversed

---

## 004.10 Earn Loyalty Points

Main flow:

1. Eligible business event occurs.
2. Loyalty validates earning rules.
3. System calculates points.
4. System creates points-ledger record.
5. Membership/tier progress is updated if required.
6. Result is auditable and idempotent.

---

## 004.11 Complete Mission

Main flow:

1. Business event reaches mission engine.
2. Mission engine identifies eligible mission(s).
3. Mission progress is evaluated.
4. Progress is updated.
5. Completion is detected.
6. Reward is assigned or made claimable according to campaign rules.
7. Duplicate events do not produce duplicate rewards.

---

## 004.12 Apply Coupon

Main flow:

1. Customer submits coupon.
2. System validates coupon existence/status.
3. System validates campaign dates.
4. System validates customer eligibility.
5. System validates usage limit.
6. System validates basket/order conditions.
7. System calculates discount.
8. Order stores applied-discount snapshot.

---

## 004.13 Refund

Main flow:

1. Refund request is created.
2. Eligibility and refundable amount are checked.
3. Provider/wallet refund is initiated.
4. Financial state is recorded.
5. Order/payment status is updated.
6. Loyalty/coupon effects are compensated where required.
7. Reconciliation records are preserved.

---

## 004.14 Notification Delivery

Possible triggering events:

- Registration completed
- Order accepted
- Order ready
- Order completed
- Payment failed
- Refund completed
- Wallet top-up completed
- Reward assigned
- Reward expiring
- Mission completed

Notification failure should generally not roll back the original business transaction.

---

# 005 — Business Rules

Business rules represent policies that must be enforced regardless of UI, API, or infrastructure.

## 005.1 Identity Rules

Examples:

- Customer identifier must satisfy defined uniqueness rules.
- Disabled accounts cannot authenticate.
- Authentication attempts are rate-limited.
- Privileged actions require authorization.

---

## 005.2 Ordering Rules

Examples:

- An order must contain at least one valid item.
- Price must be calculated using authoritative pricing rules.
- Order total cannot be negative.
- The order must preserve the final price/discount snapshot.
- Only valid state transitions are allowed.
- Duplicate order requests with the same idempotency key must not create duplicate orders.

Example order-state invariant:

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

Exceptional transitions may include:

```text
PENDING → CANCELLED
ACCEPTED → CANCEL_REQUESTED
CANCEL_REQUESTED → CANCELLED
```

Exact states must be finalized in domain design.

---

## 005.3 Payment Rules

Examples:

- Payment amount must match the authoritative payable amount.
- A payment cannot be captured twice.
- Refund amount cannot exceed captured amount minus previous refunds.
- Failed payment must not mark an order as paid.
- Every payment provider transaction must be traceable to an internal transaction.

---

## 005.4 Wallet Rules

Core invariants:

- Wallet available balance cannot become negative unless the business explicitly supports credit.
- Ledger entries are append-only/immutable.
- Every balance change must be explainable by ledger entries.
- Reserved funds cannot be spent by another transaction.
- Capture cannot exceed reserved amount.
- Release cannot exceed remaining reservation.
- Refund cannot exceed captured amount.
- A transaction reference must not be processed more than once.

Conceptual balance rule:

```text
Current Balance = Sum(Credits) - Sum(Debits)
```

If reservation is tracked separately:

```text
Available Balance = Ledger Balance - Active Reserved Amount
```

The final accounting model should be defined in the Wallet domain section.

---

## 005.5 Loyalty Rules

Examples:

- Points earning must be based on an eligible business event.
- The same event must not earn points twice.
- Point redemption cannot exceed eligible available points.
- Point expiry must be auditable.
- Tier changes must be based on explicit qualification rules.
- Loyalty ledger records should not be silently mutated.

---

## 005.6 Mission Rules

Examples:

- Only eligible users participate.
- Mission period must be respected.
- Progress must be idempotent.
- Completion must occur only when target conditions are met.
- Rewards must not be assigned more than allowed.
- Reward validity must be enforced.

---

## 005.7 Coupon / Promotion Rules

Examples:

- Coupon must be active.
- Campaign must be within valid dates.
- Usage limits must be enforced.
- Customer eligibility must be enforced.
- Coupon should not be applied more than allowed.
- Discount cannot reduce payable amount below allowed minimum.
- Stacking rules must be explicit.

---

## 005.8 Audit Rules

Critical actions should record:

- Who performed the action
- What action occurred
- Which business entity was affected
- Previous state where appropriate
- New state where appropriate
- Timestamp
- Correlation/trace identifier
- Source channel/system

Audit records must not expose secrets.

---

# 006 — Functional Requirements

Functional requirements describe what the system must do.

Use IDs so requirements remain traceable through design, code, tests, and release reviews.

## 006.1 Identity & Customer

### FR-ID-001 — Registration

The system shall allow a customer to register using approved identity attributes.

### FR-ID-002 — Authentication

The system shall authenticate registered customers using approved authentication mechanisms.

### FR-ID-003 — Token Refresh

The system shall support session/token refresh according to the security policy.

### FR-ID-004 — Profile

The system shall allow customers to retrieve and update permitted profile fields.

### FR-ID-005 — Account Status

The system shall enforce active/disabled/locked account state.

---

## 006.2 Catalog

### FR-CAT-001 — Browse Categories

The system shall return available product categories for the selected context/store/channel.

### FR-CAT-002 — Browse Products

The system shall return available products including pricing and applicable options.

### FR-CAT-003 — Product Availability

The system shall prevent ordering products that are not currently sellable.

---

## 006.3 Ordering

### FR-ORD-001 — Create Order

The system shall create an order from validated items, prices, discounts, customer, store, and fulfillment data.

### FR-ORD-002 — Retrieve Order

The system shall allow authorized actors to retrieve an order.

### FR-ORD-003 — Order History

The system shall provide customer order history.

### FR-ORD-004 — Update Status

The system shall enforce allowed order-state transitions.

### FR-ORD-005 — Cancel Order

The system shall allow cancellation when business conditions permit.

### FR-ORD-006 — Idempotent Creation

The system shall prevent duplicate order creation when the same idempotency request is retried.

---

## 006.4 Payment

### FR-PAY-001 — Create Payment

The system shall create a payment transaction linked to an eligible order.

### FR-PAY-002 — Payment Callback

The system shall process provider callbacks idempotently.

### FR-PAY-003 — Capture

The system shall record successful capture only once.

### FR-PAY-004 — Refund

The system shall support full or partial refund according to business/provider rules.

### FR-PAY-005 — Reconciliation

The system shall support comparison of internal payment records with provider/settlement records.

---

## 006.5 Wallet

### FR-WAL-001 — Wallet Account

The system shall maintain a wallet account for eligible customers.

### FR-WAL-002 — Top-Up

The system shall support wallet top-up through approved payment sources.

### FR-WAL-003 — Reserve

The system shall reserve wallet funds for a pending business transaction.

### FR-WAL-004 — Capture

The system shall capture reserved funds when the related transaction succeeds.

### FR-WAL-005 — Release

The system shall release reserved funds when the related transaction fails/cancels.

### FR-WAL-006 — Refund

The system shall return eligible funds to wallet via explicit ledger entries.

### FR-WAL-007 — Reversal

The system shall support corrective reversal using new ledger records instead of deleting financial history.

### FR-WAL-008 — Reconciliation

The system shall detect wallet inconsistencies through scheduled or on-demand reconciliation.

---

## 006.6 Loyalty

### FR-LOY-001 — Earn Points

The system shall award points for eligible business events.

### FR-LOY-002 — Redeem Points

The system shall allow eligible point redemption.

### FR-LOY-003 — Expiry

The system shall expire points according to configured rules.

### FR-LOY-004 — Membership Tier

The system shall calculate and update tier status according to business rules.

---

## 006.7 Missions & Rewards

### FR-MIS-001 — Mission Definition

The system shall support configurable mission definitions.

### FR-MIS-002 — Progress

The system shall update mission progress from eligible business events.

### FR-MIS-003 — Completion

The system shall detect mission completion and prevent duplicate completion.

### FR-MIS-004 — Reward Assignment

The system shall assign a reward according to campaign rules.

### FR-MIS-005 — Reward Claim

The system shall allow eligible reward claim within validity rules.

---

## 006.8 Notifications

### FR-NOT-001 — Push Notification

The system shall send push notifications for configured business events.

### FR-NOT-002 — Notification History

The system shall record notification attempts and result state.

### FR-NOT-003 — Failure Isolation

Notification-delivery failure shall not automatically roll back the original successful business transaction.

---

## 006.9 Integration

### FR-INT-001 — Legacy Integration

The system shall support controlled integration with legacy systems.

### FR-INT-002 — Model Translation

The integration layer shall translate legacy/external models into internal domain contracts.

### FR-INT-003 — Webhook Processing

The system shall process external webhooks idempotently.

### FR-INT-004 — Migration Fallback

The platform shall support gradual migration where legacy routes remain temporarily available.

---

# 007 — Non-Functional Requirements

Non-functional requirements define how well the system must operate.

Exact numeric targets should be validated with business and infrastructure owners before production.

## 007.1 Availability

Target example:

```text
Critical public APIs: 99.9% monthly availability
```

Availability requirements should be classified by service criticality.

---

## 007.2 Performance

Suggested initial service targets:

- Typical API P95 latency: < 300 ms where no slow external dependency is involved
- User-facing read APIs should be optimized for predictable latency
- Long-running processing should use asynchronous workflows where appropriate

Do not define one latency target for every endpoint without considering business behavior.

---

## 007.3 Scalability

The system should support:

- Horizontal scaling of stateless services
- Independent scaling of hot services
- Kafka consumer scaling by partition/consumer group
- Caching for appropriate read-heavy workloads
- Database scaling based on measured load

---

## 007.4 Reliability

Critical operations should use:

- Timeouts
- Bounded retries
- Exponential backoff
- Idempotency
- Circuit breakers where justified
- Transactional outbox for reliable event publication
- Consumer deduplication
- DLQ for poison messages

---

## 007.5 Consistency

The platform must explicitly choose consistency expectations per business workflow.

Examples:

### Strong consistency required locally

- Wallet ledger update within wallet transaction
- Payment state within payment transaction
- Order aggregate state transition

### Eventual consistency acceptable across services

- Order completed → loyalty points earned
- Order completed → notification sent
- Order completed → analytics updated
- Payment completed → downstream reporting updated

---

## 007.6 Security

The system should support:

- OAuth2 / OpenID Connect where appropriate
- Short-lived access tokens
- Secure refresh-token handling
- Role/permission authorization
- Service-to-service authentication
- Secret management
- Encryption in transit
- Sensitive-data protection
- Rate limiting
- Audit logging
- Dependency and container vulnerability scanning

---

## 007.7 Privacy

The platform must avoid exposing or logging sensitive data such as:

- Passwords
- Access tokens
- Refresh tokens
- Private keys
- Full payment secrets
- Unnecessary personal data

Logs should mask sensitive fields.

---

## 007.8 Observability

Every production service should provide:

- Structured logs
- Metrics
- Distributed traces
- Correlation/trace IDs
- Health endpoints
- Error monitoring
- Business-event visibility where required

---

## 007.9 Maintainability

Requirements:

- Clear module/service boundaries
- Consistent project structure
- Automated tests
- Database migrations
- Versioned contracts
- Code review
- Static analysis
- Dependency scanning
- Documented operational procedures

---

## 007.10 Deployability

Requirements:

- Reproducible builds
- Immutable container images
- CI/CD pipeline
- Environment-specific configuration
- No manual production code changes
- Rollback support
- Database migration strategy

---

## 007.11 Recoverability

Requirements:

- Automated database backups
- Point-in-time recovery where appropriate
- Restore testing
- Infrastructure recreation from code/configuration
- Runbooks for recovery
- Defined RPO/RTO targets before production launch

---

# 008 — Constraints

Constraints are known limitations that shape design decisions.

## 008.1 Technical Constraints

Potential constraints:

- Java / Spring Boot ecosystem
- PostgreSQL as primary relational database
- Redis for cache/rate-limit/temporary state
- Kafka for asynchronous event communication
- Docker containers
- GitLab CI/CD
- Kubernetes for production orchestration
- Existing legacy integrations
- Existing database schemas during migration

---

## 008.2 Organizational Constraints

Examples:

- Team size may not justify dozens of independent services initially.
- Existing support processes may depend on legacy systems.
- Operational knowledge of Kubernetes/Kafka may need to grow gradually.
- Production changes may require formal approval.

---

## 008.3 Migration Constraints

The new platform may need to coexist with existing systems.

Therefore:

- Big-bang replacement should be avoided unless justified.
- Legacy fallback may remain during migration.
- Anti-Corruption Layer patterns should be considered.
- Data ownership must be made explicit during transition.
- Dual-write designs should be treated carefully because they can create inconsistency.

---

## 008.4 Data Constraints

Potential constraints:

- Existing IDs may need to remain compatible.
- Historical transaction records must be preserved.
- Financial records may be immutable.
- Legacy master data may remain authoritative temporarily.
- Data retention requirements may apply.

---

# 009 — Assumptions

Assumptions must be written down because architecture decisions are often invalidated when assumptions change.

## 009.1 Business Assumptions

Initial assumptions:

- Customers may use mobile/web clients.
- Orders are tied to a store/fulfillment context.
- Payment can involve one or more providers.
- Loyalty capabilities are optional for some transaction types.
- Notifications are secondary to core transaction success.

---

## 009.2 Technical Assumptions

Initial assumptions:

- Services can be deployed independently.
- PostgreSQL is available as the system of record for transactional domains.
- Kafka is available when asynchronous integration is introduced.
- Redis is not the permanent source of truth for critical business records.
- Kubernetes will be introduced after services work correctly outside Kubernetes.
- Git is the source of truth for code and deployment configuration.

---

## 009.3 Operational Assumptions

- DEV, UAT/STAGING, and PROD environments exist or will exist.
- Production secrets will not be stored in Git.
- Production databases will be backed up.
- Monitoring and alerting will be available before full production launch.
- Support ownership and escalation contacts will be defined.

---

## 009.4 Assumption Register

Maintain assumptions using a table like:

| ID | Assumption | Owner | Risk if false | Validation date | Status |
|---|---|---|---|---|---|
| ASM-001 | Kafka is available in production | Platform Team | Async workflows blocked | TBD | Open |
| ASM-002 | Payment provider supports idempotent reference | Payment Team | Duplicate-charge risk | TBD | Open |
| ASM-003 | Legacy customer IDs remain stable | Integration Team | Migration mapping impact | TBD | Open |

---

# 010 — Architecture Principles

Architecture principles guide decisions across all later parts.

## 010.1 Business Before Technology

Do not start with:

- Kafka topics
- Kubernetes manifests
- Database schemas
- Service names

Start with:

- Business capabilities
- Business rules
- Domain boundaries
- Data ownership
- Contracts

---

## 010.2 Do Not Create Microservices Without a Boundary

A service should exist because it owns a meaningful business capability or operational responsibility.

Avoid creating services only because:

- A table exists
- A controller exists
- A team wants more repositories
- A class is large

---

## 010.3 Service Owns Its Data

A service owns its business data.

Other services should not directly modify that database.

Wrong:

```text
Order Service
    ↓
Payment Database
```

Correct:

```text
Order Service
    ↓ API / Event
Payment Service
    ↓
Payment Database
```

---

## 010.4 Database-per-Service Is a Logical Ownership Rule

Physical deployment may initially share the same PostgreSQL cluster.

However:

- Schemas/databases must have explicit owners.
- Cross-service writes are prohibited.
- Cross-service joins should not become hidden coupling.
- Reporting may use dedicated read models/data pipelines later.

---

## 010.5 Prefer Simple Architecture First

Do not introduce:

- Kubernetes before services run locally
- Kafka before there is a real asynchronous use case
- CQRS everywhere
- Event sourcing everywhere
- Service mesh without operational need

Complexity must solve a concrete problem.

---

## 010.6 API Contracts Are Products

Contracts must be:

- Explicit
- Versioned where required
- Documented
- Tested
- Backward-compatible where possible

Breaking changes must be planned.

---

## 010.7 Critical Commands Must Be Idempotent

Examples:

- Order creation
- Payment
- Wallet top-up
- Wallet capture
- Refund
- Reward assignment
- Webhook handling
- Event consumption

Duplicate requests must not create duplicate business effects.

---

## 010.8 Local Transaction, Distributed Workflow

Use database transactions inside one service boundary.

Across services, use distributed workflow patterns such as:

- Saga
- Compensation
- Outbox
- Inbox
- Idempotency
- Eventual consistency

Do not attempt to simulate one giant database transaction across independent services.

---

## 010.9 Domain Rules Belong in the Domain

Business rules should not exist only inside:

- Controllers
- HTTP filters
- Database triggers
- Kafka consumers

Core business invariants should be represented in domain/application logic so they are testable and reusable.

---

## 010.10 Adapters Depend Inward

For Clean/Hexagonal Architecture:

```text
REST / gRPC / Kafka / Persistence / External APIs
                    ↓
                Application
                    ↓
                  Domain
```

The domain should not depend on infrastructure frameworks.

---

## 010.11 Synchronous Calls Need Timeouts

Every remote call must define:

- Connection timeout
- Read/deadline timeout
- Retry policy
- Failure behavior

No service call should wait indefinitely.

---

## 010.12 Retry Only When Safe

Retries should be:

- Bounded
- Backed off
- Jittered where appropriate
- Restricted to safe/idempotent operations

Do not blindly retry non-idempotent financial operations.

---

## 010.13 Events Must Be Reliable

When DB state and event publication belong to the same business operation, use a pattern such as Transactional Outbox.

Consumers must handle duplicate delivery.

---

## 010.14 Logs Are Not the Source of Truth

Logs help investigate behavior.

Business truth must remain in authoritative domain data/ledgers.

---

## 010.15 Financial Ledgers Are Append-Oriented

For wallet/payment accounting:

- Do not delete history to “fix” balances.
- Use compensating entries.
- Preserve transaction references.
- Reconcile regularly.

---

## 010.16 Security Is a Design Requirement

Security is not a final deployment step.

It affects:

- Identity
- APIs
- Authorization
- Service communication
- Secrets
- Data storage
- Logging
- Auditability
- Operations

---

## 010.17 Observability Is Required for Production

A service is not production-ready if operators cannot answer:

- Is it healthy?
- Is it slow?
- Is it failing?
- Which customer/order/payment is affected?
- Which downstream dependency caused the issue?

---

## 010.18 Automate Repetitive Production Work

Prefer automation for:

- Builds
- Tests
- Security scans
- Container builds
- Deployments
- Backups
- Monitoring
- Rollbacks where possible

---

## 010.19 Git Is the Desired-State Source

Application and infrastructure changes should be traceable through version control.

Production deployment should not rely on undocumented manual changes.

---

## 010.20 Backward-Compatible Change Strategy

For schemas/contracts:

Prefer:

```text
Add → Deploy compatibility → Migrate → Switch → Remove later
```

Avoid destructive changes while older service versions are still running.

---

# 011 — Scope Definition

## 011.1 In Scope

Initial architecture scope includes:

- Domain-driven design
- Service boundaries
- Data ownership
- REST/gRPC/event contracts
- Core business services
- Distributed workflow patterns
- Security architecture
- Testing strategy
- Containerization
- Kubernetes deployment
- Observability
- CI/CD
- GitOps
- Backup/recovery
- Production readiness
- Incident response

---

## 011.2 Out of Scope Unless Later Required

- Multi-region active-active architecture
- Global multi-master relational database
- Full event sourcing for every domain
- Service mesh as a default requirement
- Cross-cloud portability at any cost
- Premature decomposition into dozens of services

---

# 012 — Success Metrics

Success should be measurable.

## 012.1 Business Metrics

Possible metrics:

- Registrations
- Active customers
- Orders created
- Orders completed
- Order cancellation rate
- Payment success rate
- Top-up success rate
- Reward issuance rate
- Reward redemption rate
- Mission completion rate
- Coupon usage rate

---

## 012.2 Technical Metrics

Possible metrics:

- Availability
- Error rate
- P50/P95/P99 latency
- Request throughput
- Database latency
- Connection pool utilization
- Kafka consumer lag
- Pod restart count
- CPU/memory usage
- Deployment frequency
- Lead time for change
- Mean time to recovery

---

## 012.3 Reliability Metrics

Examples:

- Duplicate payment incidents
- Duplicate reward incidents
- Reconciliation mismatch count
- Failed event count
- DLQ backlog
- Backup success rate
- Restore-test success rate

---

# 013 — Risk Register

Create an explicit risk register early.

| ID | Risk | Impact | Probability | Mitigation | Owner |
|---|---|---|---|---|---|
| RSK-001 | Duplicate financial transaction | Critical | Medium | Idempotency + ledger + reconciliation | Payment/Wallet |
| RSK-002 | Legacy dependency outage | High | Medium | Timeout + circuit breaker + fallback | Integration |
| RSK-003 | Event loss | High | Low/Medium | Transactional outbox | Platform |
| RSK-004 | Duplicate event processing | High | Medium | Consumer idempotency/inbox | Service owner |
| RSK-005 | Cross-service DB coupling | High | Medium | Enforce data ownership | Architecture |
| RSK-006 | Secrets exposed in Git | Critical | Low/Medium | Secret scanning + secret manager | Platform/Security |
| RSK-007 | Untested backup | Critical | Medium | Scheduled restore testing | DBA/Platform |
| RSK-008 | Over-fragmented services | Medium/High | Medium | Start with fewer bounded services | Architecture |

---

# 014 — Decision Log

Important architecture decisions should be recorded as ADRs (Architecture Decision Records).

Examples:

```text
ADR-001 — Use PostgreSQL as the primary transactional database
ADR-002 — Use Kafka for asynchronous domain/integration events
ADR-003 — Use gRPC for selected internal synchronous communication
ADR-004 — Use REST for public APIs
ADR-005 — Use Transactional Outbox for reliable event publication
ADR-006 — Use Redis for cache/rate limiting/temporary coordination
ADR-007 — Use GitLab CI/CD
ADR-008 — Use Kubernetes for production orchestration
ADR-009 — Use Argo CD for GitOps deployment
ADR-010 — Use OpenTelemetry for distributed tracing
```

Each ADR should include:

- Context
- Decision
- Alternatives considered
- Consequences
- Status
- Date
- Owner

---

# 015 — Deliverables of PART 01

PART 01 is complete when the following artifacts exist and are reviewed:

- [ ] Business problem statement
- [ ] Business goals
- [ ] Business capability map
- [ ] Initial release scope
- [ ] Actor list
- [ ] Core use cases
- [ ] Business-rule catalog
- [ ] Functional requirements
- [ ] Non-functional requirements
- [ ] Known constraints
- [ ] Assumption register
- [ ] Architecture principles
- [ ] Scope definition
- [ ] Success metrics
- [ ] Initial risk register
- [ ] Initial ADR list

---

# 016 — Exit Criteria for PART 01

Do not move to PART 02 — Domain-Driven Design until the team can confidently answer:

### Business

- What are we building?
- Why are we building it?
- Who uses it?
- What business capabilities are required?

### Scope

- What belongs in the first release?
- What is deferred?

### Rules

- What business rules must never be violated?
- Which operations are financially critical?

### Quality

- What availability, security, reliability, and performance expectations exist?

### Architecture

- Are data ownership and service independence important goals?
- Are distributed consistency and idempotency understood as architectural requirements?

### Operations

- What must exist before production launch?

If these questions are still unclear, service decomposition in PART 02/03 will likely be unstable.

---

# 017 — Handoff to PART 02 — Domain-Driven Design

PART 01 produces the raw business understanding.

PART 02 will transform that understanding into a domain model.

Input from PART 01:

```text
Business Requirements
Actors
Use Cases
Business Rules
Functional Requirements
Non-Functional Requirements
Constraints
Assumptions
Architecture Principles
```

Then PART 02 will derive:

```text
Domain Discovery
        ↓
Ubiquitous Language
        ↓
Subdomains
        ↓
Bounded Contexts
        ↓
Context Map
        ↓
Aggregates
        ↓
Entities
        ↓
Value Objects
        ↓
Domain Services
        ↓
Domain Invariants
        ↓
Domain Events
```

This is the required bridge between business requirements and microservice/service-boundary design.

---

# PART 01 — Final Summary

PART 01 defines the project before implementation begins.

The most important rule is:

```text
Business understanding
        ↓
Domain understanding
        ↓
Architecture
        ↓
Implementation
```

Do not reverse the order into:

```text
Kubernetes
Kafka
Database
Services
        ↓
Try to discover the business later
```

A production microservices platform should be driven by business boundaries, explicit rules, data ownership, reliable contracts, and measurable operational requirements.

**Next:** PART 02 — Domain-Driven Design.
