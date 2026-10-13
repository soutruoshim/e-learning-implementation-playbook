---
title: "PHASE 02 — Shared Engineering Standards"
---

# PHASE 02 — Shared Engineering Standards

> **Purpose:** Establish the mandatory engineering standard that every Java / Spring Boot microservice must follow before business-service implementation begins.
>
> **Previous Phase:** Phase 01 — Project Foundation
>
> **Next Phase:** Phase 03 — Contract Foundation
>
> **Primary Architecture Basis:** PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 25 — Testing Strategy, PART 31 — Observability
>
> **Status:** Implementation Standard / Service Bootstrap Standard

---

# 1. Phase 2 Goal

Phase 1 created the development foundation:

```text
Repository
Docker Compose
PostgreSQL
Kafka
Redis
Schema Registry
Mocks
Developer scripts
Local configuration
```

Phase 2 defines:

```text
How every service must be built internally.
```

The result should be one repeatable engineering standard that applies to:

```text
identity-service
customer-service
catalog-service
inventory-service
cart-service
ordering-service
payment-service
wallet-service
loyalty-service
promotion-service
mission module/service
notification-service
integration-service
```

The goal is not to create business features yet.

The goal is to make sure every future service follows the same rules for:

```text
Architecture
Packages
Dependencies
Domain modeling
Use cases
Ports
Adapters
Validation
Errors
Persistence
Transactions
Security
Idempotency
Events
Logging
Tracing
Metrics
Testing
Database migrations
Configuration
Health
Documentation
Code review
```

---

# 2. Core Engineering Rule

The most important rule is:

```text
Business logic must not depend on infrastructure.
```

Dependency direction:

```text
Adapters
   ↓
Application
   ↓
Domain
```

Never reverse it.

Allowed:

```text
REST Adapter
    ↓
Application
    ↓
Domain
```

Allowed:

```text
PostgreSQL Adapter
    ↓ implements
Output Port
```

Forbidden:

```text
Domain
  ↓
Spring Repository
```

Forbidden:

```text
Domain
  ↓
KafkaTemplate
```

Forbidden:

```text
Application
  ↓
JpaRepository
```

---

# 3. Standard Service Architecture

Every service uses four major areas:

```text
domain
application
adapter
config
```

High-level:

```text
┌───────────────────────────────────────────────┐
│                INPUT ADAPTERS                 │
│ REST / gRPC / Kafka / Scheduler              │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                  INPUT PORTS                  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│               APPLICATION LAYER               │
│ Commands / Queries / Use Cases / Flow         │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                    DOMAIN                     │
│ Aggregates / Entities / Value Objects / Rules │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                 OUTPUT PORTS                  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                OUTPUT ADAPTERS                │
│ PostgreSQL / Kafka / Redis / External APIs    │
└───────────────────────────────────────────────┘
```

---

# 4. Standard Java Package Structure

Use:

```text
com.company.<service>
```

Example:

```text
com.company.order
```

Expanded structure:

```text
com.company.order
│
├── domain/
│   ├── model/
│   ├── valueobject/
│   ├── service/
│   ├── policy/
│   ├── event/
│   └── exception/
│
├── application/
│   ├── port/
│   │   ├── in/
│   │   └── out/
│   ├── usecase/
│   ├── command/
│   ├── query/
│   ├── result/
│   └── dto/
│
├── adapter/
│   ├── in/
│   │   ├── rest/
│   │   │   ├── controller/
│   │   │   ├── request/
│   │   │   ├── response/
│   │   │   └── mapper/
│   │   │
│   │   ├── grpc/
│   │   │   └── mapper/
│   │   │
│   │   ├── kafka/
│   │   │   ├── consumer/
│   │   │   └── mapper/
│   │   │
│   │   └── scheduler/
│   │
│   └── out/
│       ├── persistence/
│       │   ├── entity/
│       │   ├── repository/
│       │   ├── mapper/
│       │   └── adapter/
│       │
│       ├── kafka/
│       │   ├── producer/
│       │   └── mapper/
│       │
│       ├── redis/
│       │
│       ├── grpc/
│       │
│       └── external/
│           ├── client/
│           ├── dto/
│           ├── mapper/
│           └── adapter/
│
├── config/
│   ├── security/
│   ├── persistence/
│   ├── observability/
│   ├── web/
│   └── properties/
│
└── shared/
    └── technical-only-if-necessary/
```

Prefer not to create a large `shared` package.

Do not put business entities into a global platform-common module.

---

# 5. Standard Project Directory

Each service repository/folder should ultimately contain:

```text
<service-name>/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── .env.example
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew
├── gradlew.bat
├── gradle/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/<service>/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-test.yml
│   │       └── db/migration/
│   │
│   └── test/
│       ├── java/
│       └── resources/
│
└── docs/
    ├── architecture.md
    ├── data.md
    ├── errors.md
    └── runbook.md
```

---

# 6. Approved Technology Categories

The architecture establishes these technology categories:

```text
Java / Spring Boot
Spring Security
PostgreSQL
Flyway
Redis where appropriate
REST
gRPC
Kafka
OpenTelemetry
Testcontainers
JUnit 5
Mockito
AssertJ
ArchUnit
```

Exact library and framework versions must be pinned by the project/team standard.

Do not use floating or uncontrolled dependency versions.

---

# 7. Build Standard

Recommended:

```text
Gradle Wrapper
Kotlin DSL or team-approved Gradle DSL
Java toolchain
```

Every service must include:

```text
gradlew
gradlew.bat
gradle/wrapper/
```

The build must declare the approved Java LTS version.

Conceptual example:

```kotlin
java {
    toolchain {
        languageVersion.set(
            JavaLanguageVersion.of(APPROVED_JAVA_LTS)
        )
    }
}
```

Before Phase 2 is considered complete, replace `APPROVED_JAVA_LTS` with the actual organization-approved Java LTS version.

---

# 8. Dependency Categories

A normal Spring Boot service may require categories such as:

```text
Spring Web
Spring Validation
Spring Security
Spring Data JPA
PostgreSQL JDBC
Flyway
Spring Boot Actuator
Micrometer / OpenTelemetry integration
Kafka only when required
Redis only when required
gRPC only when required
Testcontainers
JUnit 5
Mockito
AssertJ
ArchUnit
```

Rule:

```text
Do not add Kafka, Redis, gRPC, or provider SDKs to every service automatically.
```

A dependency exists only when the service requires it.

---

# 9. Domain Layer Standard

The domain contains pure business behavior.

Allowed domain concepts:

```text
Aggregates
Entities
Value Objects
Domain Services
Domain Policies
Domain Events
Domain Exceptions
Business Invariants
```

The domain must not know about:

```text
HTTP
REST
gRPC
Kafka
PostgreSQL
Redis
JPA
Spring MVC
Docker
Kubernetes
```

---

# 10. Aggregate Rules

Every aggregate should:

1. Protect its own invariants.
2. Expose behavior instead of unrestricted setters.
3. Use meaningful domain types.
4. Prevent invalid state.
5. Produce domain events when an important business fact occurs.

Avoid:

```java
order.setStatus("DONE");
```

Prefer:

```java
order.complete();
```

Why:

```text
complete()
```

can verify business rules before changing state.

---

# 11. Domain Behavior Example

```java
public class Order {

    private final OrderId id;
    private OrderStatus status;

    public void cancel() {

        if (status == OrderStatus.DONE) {
            throw new InvalidOrderStateException(
                "Completed order cannot be cancelled"
            );
        }

        if (status == OrderStatus.CANCELLED) {
            return;
        }

        status = OrderStatus.CANCELLED;
    }
}
```

The rule:

```text
Completed order cannot be cancelled
```

belongs in the domain.

It must not exist only inside:

```text
REST controller
SQL condition
frontend
```

---

# 12. Entity Standard

Entities:

```text
have stable identity
may change state over time
belong to an aggregate boundary
```

Example:

```java
public final class OrderItem {

    private final OrderItemId id;
    private final ProductId productId;
    private final Quantity quantity;

    // behavior
}
```

Avoid turning every database row directly into a domain entity.

---

# 13. Value Object Standard

Use value objects for domain concepts such as:

```text
OrderId
CustomerId
ProductId
Money
Currency
Quantity
EmailAddress
PhoneNumber
StoreId
IdempotencyKey
```

A value object should:

```text
validate itself
be immutable where practical
express domain meaning
avoid primitive obsession
```

Example:

```java
public record Quantity(int value) {

    public Quantity {
        if (value <= 0) {
            throw new InvalidQuantityException();
        }
    }
}
```

---

# 14. Money Standard

Never represent authoritative money as:

```text
float
double
```

Money always includes currency.

Conceptual domain value object:

```java
public record Money(
    BigDecimal amount,
    Currency currency
) {

    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
    }
}
```

Do not silently assume currency for critical operations unless the business contract explicitly defines it.

Bad:

```text
missing currency → USD automatically
```

without a documented business rule.

---

# 15. Time Standard

Technical timestamps should be stored and transmitted in UTC.

Use types such as:

```text
Instant
OffsetDateTime
```

according to semantics.

REST date/time:

```text
ISO 8601
```

Example:

```text
2026-10-11T09:30:00Z
```

Business timezone semantics must remain explicit for concepts such as:

```text
store opening hours
campaign windows
mission periods
local business day
```

Do not change the host machine clock for tests.

Inject a clock.

---

# 16. Clock Port / Testability

Avoid:

```java
Instant.now()
```

deep throughout business logic when deterministic time is required.

Prefer an injected clock/policy:

```java
public interface TimeProvider {
    Instant now();
}
```

Production adapter:

```java
public final class SystemTimeProvider
        implements TimeProvider {

    @Override
    public Instant now() {
        return Instant.now();
    }
}
```

Test:

```java
public final class FixedTimeProvider
        implements TimeProvider {

    private final Instant value;

    public FixedTimeProvider(Instant value) {
        this.value = value;
    }

    @Override
    public Instant now() {
        return value;
    }
}
```

---

# 17. Randomness Standard

Business logic requiring randomness must remain testable.

Example:

```java
public interface RandomSource {
    int nextInt(int min, int max);
}
```

Domain/application policy:

```text
RewardSelectionPolicy
       ↓
RandomSource
```

Security-sensitive randomness is different.

For:

```text
OTP
reset token
nonce
API key
session ID
```

use a cryptographically secure random generator.

---

# 18. Domain Exception Standard

Domain exceptions represent violated business rules.

Examples:

```text
InvalidOrderStateException
InsufficientWalletBalanceException
CouponExpiredException
MissionNotEligibleException
RewardAlreadyClaimedException
```

Domain exception rules:

```text
No HTTP status inside domain exception.
No ResponseEntity inside domain.
No Spring MVC dependency.
No database exception leakage.
```

Example:

```java
public class InsufficientWalletBalanceException
        extends DomainException {

    public InsufficientWalletBalanceException() {
        super("INSUFFICIENT_WALLET_BALANCE");
    }
}
```

---

# 19. Domain Event Standard

Domain events represent important business facts.

Examples:

```text
OrderCreated
OrderCompleted
PaymentCaptured
WalletTopUpCompleted
MissionCompleted
RewardAssigned
```

Events should be immutable.

Example:

```java
public record OrderCompletedEvent(
    UUID eventId,
    String orderId,
    Instant occurredAt
) {}
```

The domain does not publish directly to Kafka.

Wrong:

```java
kafkaTemplate.send(...)
```

inside aggregate/domain service.

Correct:

```text
Domain creates business event
        ↓
Application persists/outboxes event
        ↓
Infrastructure publishes later
```

---

# 20. Application Layer Standard

The application layer owns workflow orchestration.

It contains:

```text
Input ports
Output ports
Use cases
Commands
Queries
Application services
Transaction boundaries
Authorization orchestration
Idempotency orchestration
```

The application layer should not contain framework/persistence-specific details.

---

# 21. Command Standard

Commands request state changes.

Examples:

```text
CreateOrderCommand
CancelOrderCommand
ReserveWalletCommand
RefundPaymentCommand
EarnPointsCommand
UpdateMissionProgressCommand
```

Example:

```java
public record CreateOrderCommand(
    String customerId,
    String storeId,
    List<CreateOrderItemCommand> items,
    String idempotencyKey
) {}
```

Command naming:

```text
<Action><BusinessConcept>Command
```

---

# 22. Query Standard

Queries request information and should not intentionally change business state.

Examples:

```text
GetOrderQuery
GetWalletBalanceQuery
GetCustomerProfileQuery
ListRewardsQuery
GetMissionProgressQuery
```

Example:

```java
public record GetOrderQuery(
    String orderId,
    String requesterId
) {}
```

---

# 23. Input Port Standard

Input ports expose application capabilities.

Example:

```java
public interface CreateOrderUseCase {

    CreateOrderResult create(
        CreateOrderCommand command
    );
}
```

Input ports should:

```text
use application/domain-friendly models
avoid HTTP types
avoid gRPC generated types
avoid Kafka payload classes
avoid JPA types
```

---

# 24. Output Port Standard

Output ports describe infrastructure capabilities required by the application.

Examples:

```text
LoadOrderPort
SaveOrderPort
LoadCustomerPort
ReserveInventoryPort
PaymentAuthorizationPort
PublishOutboxPort
IdempotencyPort
TimeProvider
RandomSource
```

Example:

```java
public interface SaveOrderPort {

    Order save(Order order);
}
```

The output adapter implements the port.

Application code should not depend directly on:

```text
JpaRepository
KafkaTemplate
RedisTemplate
WebClient
provider SDK
```

---

# 25. Use Case Standard

Each use case should have one clear responsibility.

Example:

```java
@Service
@Transactional
public class CreateOrderService
        implements CreateOrderUseCase {

    private final SaveOrderPort saveOrderPort;
    private final IdempotencyPort idempotencyPort;
    private final PublishOutboxPort outboxPort;

    public CreateOrderService(
        SaveOrderPort saveOrderPort,
        IdempotencyPort idempotencyPort,
        PublishOutboxPort outboxPort
    ) {
        this.saveOrderPort = saveOrderPort;
        this.idempotencyPort = idempotencyPort;
        this.outboxPort = outboxPort;
    }

    @Override
    public CreateOrderResult create(
        CreateOrderCommand command
    ) {
        // application orchestration
        return null;
    }
}
```

Framework annotations are allowed in application implementation where the architecture intentionally places technical transaction/security boundaries there.

Domain classes remain framework-independent.

---

# 26. Transaction Boundary Standard

Typical state-changing command use case:

```text
@Transactional
```

at the application-service boundary.

Avoid putting transaction annotations throughout domain classes.

Good:

```text
CreateOrderService.create()
    BEGIN TRANSACTION
      load data
      execute domain behavior
      save aggregate
      save outbox
    COMMIT
```

Avoid long-running database transactions around slow network calls.

Bad:

```text
BEGIN
  Call external payment provider for 8 seconds
  UPDATE database
COMMIT
```

Prefer workflow designs that keep local transactions bounded.

---

# 27. Authorization Boundary

Authentication and basic authority may be established by Spring Security.

Business authorization still belongs in the application/domain decision path.

Recommended decision flow:

```text
Request
  ↓
Authentication valid?
  ↓
Required scope / role?
  ↓
Resource ownership?
  ↓
Business policy?
  ↓
Allow / Deny
```

Example:

```text
USER
  ↓
GET order
  ↓
order.customer_id == authenticated customer?
```

Do not treat:

```text
role == USER
```

as enough to read every user's order.

---

# 28. Deny-by-Default Standard

If no permission exists:

```text
DENY
```

Do not implement:

```text
allow unless blocked
```

for sensitive operations.

---

# 29. Adapter Standard

Adapters should:

```text
translate
validate transport-level data
map
delegate
translate errors
apply transport concerns
```

Adapters should not become the place where the entire business workflow lives.

Rule:

```text
Thin adapters.
```

---

# 30. REST Input Adapter Standard

REST flow:

```text
HTTP Request
    ↓
Controller
    ↓
Request DTO
    ↓
Mapper
    ↓
Command / Query
    ↓
Input Port
    ↓
Application Service
```

Example:

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final CreateOrderUseCase createOrder;
    private final OrderRestMapper mapper;

    public OrderController(
        CreateOrderUseCase createOrder,
        OrderRestMapper mapper
    ) {
        this.createOrder = createOrder;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<CreateOrderResponse> create(
        @Valid @RequestBody CreateOrderRequest request
    ) {

        var command = mapper.toCommand(request);
        var result = createOrder.create(command);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(mapper.toResponse(result));
    }
}
```

The controller must not:

```text
contain SQL
contain core business rules
call another service's database
publish directly to Kafka as business logic
implement payment logic
```

---

# 31. REST Request DTO Standard

Transport DTOs belong in the adapter.

Example:

```java
public record CreateOrderRequest(

    @NotBlank
    String storeId,

    @NotEmpty
    List<@Valid OrderItemRequest> items

) {}
```

Transport validation handles:

```text
Required fields
Types
Lengths
Formats
Enum format
Ranges
Array limits
Basic identifier format
```

Business invariants remain in the domain.

---

# 32. Validation Architecture

Use multiple validation layers.

## Layer 1 — Contract / Transport Validation

Examples:

```text
required
length
type
format
range
enum
array size
timestamp format
currency format
```

Implemented in:

```text
REST DTO validation
gRPC validation
Kafka schema validation
external adapter validation
```

## Layer 2 — Application Validation

Examples:

```text
caller is permitted
required dependency exists
operation idempotency
workflow precondition
```

## Layer 3 — Domain Validation

Examples:

```text
wallet cannot go negative
completed order cannot be cancelled
refund cannot exceed captured amount
expired coupon cannot redeem
mission completion invariant
```

## Layer 4 — Database Protection

Examples:

```text
NOT NULL
UNIQUE
CHECK
FOREIGN KEY within service boundary
optimistic version
```

Defense in depth:

```text
Transport validation
       ↓
Authorization
       ↓
Domain rule
       ↓
Database constraint
```

---

# 33. Explicit Mapping Standard

Use explicit mapping between:

```text
Transport
Application
Domain
Persistence
Integration Event
External Provider
```

Example:

```text
CreateOrderRequest
        ↓
CreateOrderCommand
        ↓
Order
        ↓
OrderJpaEntity
```

Do not reuse one object for all layers.

---

# 34. DTO / Domain / Persistence Separation

These representations may differ.

REST:

```json
{
  "order_id": "ORD-1001",
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

This is expected.

Do not make:

```text
JPA entity = API response = domain object = Kafka payload
```

---

# 35. Persistence Adapter Standard

Persistence structure:

```text
adapter/out/persistence/
├── entity/
├── repository/
├── mapper/
└── adapter/
```

Example:

```java
@Entity
@Table(name = "orders")
public class OrderJpaEntity {

    @Id
    private UUID id;

    private String orderNumber;
    private String status;

    @Version
    private long version;
}
```

Domain does not import this class.

---

# 36. Repository Adapter Standard

Spring Data repository remains infrastructure-only.

Example:

```java
interface SpringDataOrderRepository
        extends JpaRepository<OrderJpaEntity, UUID> {

    Optional<OrderJpaEntity> findByOrderNumber(
        String orderNumber
    );
}
```

Adapter:

```java
@Component
public class OrderPersistenceAdapter
        implements LoadOrderPort, SaveOrderPort {

    private final SpringDataOrderRepository repository;
    private final OrderPersistenceMapper mapper;

    public OrderPersistenceAdapter(
        SpringDataOrderRepository repository,
        OrderPersistenceMapper mapper
    ) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Order save(Order order) {
        var entity = mapper.toEntity(order);
        var saved = repository.save(entity);
        return mapper.toDomain(saved);
    }
}
```

---

# 37. Database Ownership Standard

Each service owns:

```text
Schema
Tables
Constraints
Indexes
Migrations
Data mutation
Data lifecycle
```

A service must not directly modify another service's database.

Forbidden:

```text
order-service
   ↓ SQL
wallet_db
```

Cross-service access uses:

```text
REST
gRPC
events
```

---

# 38. Database Naming Standard

Recommended:

```text
plural snake_case
```

Tables:

```text
orders
order_items
wallet_accounts
wallet_ledger_entries
mission_progress
payment_refunds
```

Columns:

```text
order_id
customer_id
created_at
updated_at
currency
status
```

Avoid mixed conventions.

---

# 39. Constraint Naming Standard

Recommended names:

```text
pk_<table>
uq_<table>_<columns>
idx_<table>_<columns>
fk_<table>_<reference>
chk_<table>_<rule>
```

Examples:

```text
uq_orders_order_number
idx_orders_customer_created
chk_order_items_quantity_positive
```

Use explicit constraint names where practical.

They improve:

```text
debugging
migration
error mapping
```

---

# 40. Database Constraint Standard

Use database protection for simple, important invariants.

Examples:

```sql
CHECK (quantity > 0)
```

```sql
CHECK (amount >= 0)
```

Required values:

```text
NOT NULL
```

Business uniqueness:

```text
UNIQUE
```

Examples:

```text
order_number
provider_reference
idempotency scope
(event_id, consumer_name)
(user_id, mission_id, cycle_id)
```

Do not rely only on application validation.

---

# 41. Cross-Service Foreign Key Rule

Foreign keys are allowed inside the same owned database where they protect integrity.

Example:

```text
orders
  ↓
order_items
```

Do not create cross-service foreign keys.

Forbidden concept:

```sql
FOREIGN KEY (wallet_id)
REFERENCES wallet_db.wallet_accounts(id)
```

Cross-service references are logical identifiers.

---

# 42. Flyway Standard

All schema changes use Flyway.

Location:

```text
src/main/resources/db/migration/
```

Naming:

```text
V<version>__<description>.sql
```

Example:

```text
V1__create_orders.sql
V2__create_order_items.sql
V3__add_order_status_index.sql
V4__create_outbox.sql
```

Once a migration is applied to a shared environment:

```text
do not edit it
```

Create a new migration.

Wrong:

```text
modify deployed V3
```

Correct:

```text
V4__fix_order_constraint.sql
```

---

# 43. Backward-Compatible Migration Standard

Prefer expand-and-contract:

```text
1. Add new nullable/new-compatible structure
2. Deploy code supporting old + new
3. Backfill
4. Deploy code reading new structure
5. Strengthen constraints
6. Remove old structure later
```

Avoid destructive schema changes while old application instances may still run.

---

# 44. Index Standard

Create indexes from actual query patterns.

Review:

```text
WHERE
JOIN
ORDER BY
UNIQUE
foreign keys
```

Do not index every column.

Example:

```sql
CREATE INDEX idx_orders_customer_created
ON orders(customer_id, created_at DESC);
```

Every index adds:

```text
storage
insert cost
update cost
maintenance
vacuum work
```

---

# 45. Optimistic Concurrency

For aggregates with concurrent update risk, support a version field where appropriate.

Example persistence model:

```text
id
status
...
version
```

The exact concurrency strategy is service-specific.

Possible strategies include:

```text
optimistic locking
row locking
unique constraint
atomic update
serializable/local transaction where justified
```

Concurrency decisions must be explicit for high-risk operations.

---

# 46. Idempotency Standard

Important state-changing operations should define idempotency.

Examples:

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

Contract should define:

```text
key format
scope
expiry
request hash
duplicate response behavior
conflict behavior
```

Same key + same request:

```text
return original successful/pending result
```

Same key + different request:

```text
409
IDEMPOTENCY_KEY_REUSED
```

---

# 47. Idempotency Persistence

Possible table:

```text
idempotency_records
-------------------
id
idempotency_key
operation
request_hash
status
response_code
response_body
created_at
expires_at
```

Unique scope may be:

```text
(operation, idempotency_key)
```

or a documented stronger scope such as:

```text
(user_id, operation, idempotency_key)
```

---

# 48. Request Hash

Use a canonicalized request representation.

Concept:

```text
SHA-256(canonical request)
```

Purpose:

```text
same key + different payload detection
```

If key matches but hash differs:

```text
reject
```

---

# 49. Outbox Standard

A service that must reliably publish a business event alongside a local database change should use a transactional outbox where required.

Possible table:

```text
outbox_events
-------------
id
aggregate_type
aggregate_id
event_type
event_version
payload
correlation_id
created_at
published_at
status
attempt_count
```

Transaction:

```text
BEGIN
  change authoritative business state
  insert outbox event
COMMIT
```

Publisher:

```text
read pending outbox
   ↓
publish to Kafka
   ↓
mark published
```

---

# 50. Consumer Inbox / Processed Event Standard

Consumers must handle duplicate delivery safely.

Possible table:

```text
processed_events
----------------
event_id
consumer_name
processed_at

PRIMARY KEY (event_id, consumer_name)
```

Duplicate transport delivery should not produce duplicate business side effects.

---

# 51. REST Contract Baseline

Every public REST API should follow:

```text
/api/v1/...
```

Use resource nouns.

Good:

```text
/orders
/payments
/wallets
/rewards
/missions
```

Avoid:

```text
/createOrder
/getOrder
/updateOrder
```

Domain actions may use explicit action endpoints when appropriate:

```text
POST /orders/{id}/cancel
POST /wallets/{id}/reserve
POST /payments/{id}/refund
```

---

# 52. REST JSON Naming

Use:

```text
snake_case
```

Example:

```json
{
  "order_id": "ORD001",
  "created_at": "2026-10-11T09:30:00Z"
}
```

Do not mix:

```text
orderId
order_id
OrderID
```

in the same API family.

---

# 53. REST Date / Time

Use:

```text
ISO 8601
```

Example:

```text
2026-10-11T09:30:00Z
```

Avoid ambiguous:

```text
11/10/2026
```

---

# 54. REST Money

Recommended conceptual shape:

```json
{
  "amount": "12.50",
  "currency": "USD"
}
```

or an API-family-approved minor-unit format.

Do not use floating-point assumptions for authoritative money contracts.

---

# 55. Nullability Standard

Every contract field should define whether it is:

```text
Required
Optional
Nullable
Conditionally present
```

These are not the same.

---

# 56. Request and Correlation Headers

Every incoming HTTP request should support:

```text
X-Request-Id
X-Correlation-Id
traceparent
tracestate
```

Request ID:

```text
one technical request
```

Correlation ID:

```text
one business journey across requests/events
```

If request ID is missing:

```text
gateway/service generates one
```

Correlation metadata propagates downstream.

---

# 57. Error Contract Standard

All external-facing REST errors should use one stable structure.

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

Error codes must be:

```text
Stable
Machine-readable
Uppercase
Specific
Documented
```

---

# 58. Standard Error Categories

Initial platform-level catalog may include:

| Code | HTTP | Meaning |
|---|---:|---|
| VALIDATION_FAILED | 400 | Request contract validation failed |
| UNAUTHENTICATED | 401 | Authentication missing or invalid |
| ACCESS_DENIED | 403 | Caller lacks permission |
| RESOURCE_NOT_FOUND | 404 | Requested resource not found |
| STATE_CONFLICT | 409 | Invalid lifecycle/state conflict |
| IDEMPOTENCY_KEY_REUSED | 409 | Same idempotency key used with different request |
| BUSINESS_RULE_VIOLATION | 422 | Valid request violates domain rule |
| RATE_LIMITED | 429 | Request rate exceeded |
| DEPENDENCY_UNAVAILABLE | 503 | Required downstream dependency unavailable |
| INTERNAL_ERROR | 500 | Unexpected server failure |

Service-specific codes should be more specific where appropriate:

```text
ORDER_NOT_FOUND
ORDER_STATE_CONFLICT
INSUFFICIENT_WALLET_BALANCE
PAYMENT_ALREADY_CAPTURED
MISSION_NOT_ELIGIBLE
COUPON_EXPIRED
```

---

# 59. Validation Error Shape

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

Clients use codes for logic.

Human messages may change/localize.

---

# 60. Do Not Expose Infrastructure Errors

Never return raw:

```text
PSQLException
SQLSTATE
Hibernate stack trace
Kafka exception
Redis stack trace
provider SDK exception
Java stack trace
filesystem path
internal class name
```

Translate infrastructure errors into stable platform errors.

Example:

```text
Database connection failure
        ↓
DEPENDENCY_UNAVAILABLE
```

where that semantic mapping is appropriate.

---

# 61. Global REST Exception Handler

A service may use Spring `@RestControllerAdvice` in the REST adapter/config area.

Conceptual example:

```java
@RestControllerAdvice
public class GlobalRestExceptionHandler {

    @ExceptionHandler(DomainException.class)
    ResponseEntity<ApiErrorResponse> handleDomain(
        DomainException ex,
        HttpServletRequest request
    ) {
        // map stable domain error code
        return null;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(
        MethodArgumentNotValidException ex
    ) {
        return null;
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleUnexpected(
        Exception ex
    ) {
        return null;
    }
}
```

The handler translates.

It does not define business rules.

---

# 62. Error Logging Rule

For expected domain/client errors:

```text
do not log every 4xx as ERROR
```

For unexpected infrastructure/internal failures:

```text
log enough diagnostic context
```

Never log:

```text
password
access token
refresh token
OTP
private key
provider secret
full payment secret
sensitive request body by default
```

---

# 63. Security Baseline

Every service must define:

```text
Authentication
Authorization
Structured logging
No sensitive logs
Input validation
Rate limits where needed
Health endpoint restrictions
Service identity
Secrets handling
Security tests
```

Production additionally requires the platform TLS/container/security controls defined in later phases.

---

# 64. Authentication Standard

Public requests generally use:

```http
Authorization: Bearer <access_token>
```

Token validation must consider:

```text
signature
issuer
audience
expiration
token type
roles/scopes
```

Do not put excessive mutable business data in JWTs.

---

# 65. Service-to-Service Security

Internal network location is not authentication.

Each service should have a unique identity.

Possible platform mechanisms later include:

```text
OAuth2 Client Credentials
mTLS
Service Mesh Identity
Signed Service JWT
```

Do not use one shared hard-coded API key for all services.

---

# 66. Spring Security Baseline

Every service should define a `SecurityFilterChain`.

Conceptual shape:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

    @Bean
    SecurityFilterChain securityFilterChain(
        HttpSecurity http
    ) throws Exception {

        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth ->
                oauth.jwt(Customizer.withDefaults())
            )
            .build();
    }
}
```

Actual public endpoints are service-specific.

Default stance:

```text
deny unless explicitly permitted
```

---

# 67. Method / Business Authorization

Fine-grained authorization may combine:

```text
role
scope
resource ownership
business policy
```

Examples:

```text
orders.read.own
orders.read.any
orders.update.status
payments.refund
wallet.adjust
loyalty.manage
missions.manage
```

Do not use one broad `ADMIN` role for every privileged action.

---

# 68. Secrets Standard

Secrets must not be:

```text
committed to Git
hard-coded in Java
printed in logs
returned in errors
stored in Docker images
```

Local development uses fake/local values.

Shared/prod environments use the platform secret-management strategy.

---

# 69. Actuator Standard

Spring Boot Actuator is part of the service baseline.

Prefer required endpoints such as:

```text
health
prometheus
info if safe
```

Do not publicly expose sensitive endpoints such as:

```text
env
beans
heapdump
configprops
```

Health output should not leak excessive internal dependency details publicly.

---

# 70. Health Endpoint Standard

At minimum:

```text
/actuator/health
```

Later Kubernetes will use:

```text
liveness
readiness
startup
```

Health should answer service availability without exposing secrets or sensitive internal configuration.

---

# 71. Logging Standard

Every service uses structured logging.

Minimum fields should include as applicable:

```text
timestamp
level
service
environment
version
request_id
correlation_id
trace_id
error_code
message
```

Use UTC timestamps.

Never log secrets.

Minimize PII.

Do not log full request/response bodies by default.

---

# 72. Log Level Standard

General guidance:

```text
TRACE — highly detailed local diagnostics only
DEBUG — development diagnostics
INFO  — meaningful service/business operational events
WARN  — recoverable or suspicious condition
ERROR — unexpected operation failure requiring investigation
```

Expected business rejection is not automatically an ERROR.

Example:

```text
coupon expired
```

may be a normal business outcome.

---

# 73. Correlation Logging

Every log produced during a request should make correlation possible.

Concept:

```text
Incoming request
  X-Request-Id
  X-Correlation-Id
       ↓
MDC / tracing context
       ↓
logs
       ↓
downstream request
       ↓
Kafka event metadata
```

---

# 74. OpenTelemetry Baseline

Every service should be ready for OpenTelemetry.

Phase 2 requires the service template to support:

```text
request/trace context
HTTP instrumentation
basic service metadata
log correlation
Actuator/Micrometer baseline
```

Full observability infrastructure comes later.

---

# 75. Minimum Service Metrics

Every service should expose baseline technical metrics through the approved Micrometer/Actuator approach.

Categories:

```text
HTTP rate
HTTP errors
HTTP duration
JVM/resource metrics
dependency latency/errors where relevant
```

Avoid high-cardinality metric labels.

Do not use:

```text
user_id
order_id
payment_id
```

as Prometheus labels.

---

# 76. Audit Event Standard

Security/business-sensitive actions require an audit trail.

Examples:

```text
Login success/failure
Password reset
Role change
Wallet adjustment
Payment refund
Manual reward assignment
Mission rule change
Admin data access
```

Recommended fields:

```text
event_id
actor_id
actor_type
action
resource_type
resource_id
result
reason
request_id
correlation_id
source_ip
user_agent
occurred_at
```

Sensitive content still must be minimized.

---

# 77. Testing Architecture

Architecture should make testing easy.

Layers:

```text
Domain Tests
Application Tests
Adapter Tests
Persistence Tests
Integration Tests
Contract Tests
Architecture Tests
Security Tests
```

Not every service needs every advanced category immediately, but the template must support them.

---

# 78. Domain Tests

Test:

```text
Aggregates
Value Objects
Policies
Invariants
Domain Services
State transitions
Boundary values
Money rules
```

Domain tests must not require:

```text
Spring context
database
Kafka
Redis
network
```

Example:

```java
@Test
void completedOrderCannotBeCancelled() {

    var order = completedOrder();

    assertThatThrownBy(order::cancel)
        .isInstanceOf(
            InvalidOrderStateException.class
        );
}
```

Fast and deterministic.

---

# 79. Application Tests

Test:

```text
Use-case orchestration
Port interactions
Authorization
Idempotency
Transaction decisions
Error paths
```

Mock/fake boundaries.

Appropriate mocks:

```text
output ports
clock
ID generator
provider client port
random source
```

Do not mock every internal class.

---

# 80. Adapter Tests

Test:

```text
REST request/response mapping
validation mapping
error translation
gRPC mapping
Kafka serialization
provider translation
persistence mapping
```

---

# 81. Persistence Integration Tests

Use real PostgreSQL via Testcontainers.

Validate:

```text
Flyway migrations
column mapping
constraints
indexes/query behavior where relevant
transactions
optimistic locking
repository queries
unique violations
```

Do not trust a mocked repository as proof that SQL/database behavior works.

---

# 82. Kafka Integration Tests

When a service uses Kafka, realistic broker behavior should be tested using Kafka Testcontainers where appropriate.

Test later includes:

```text
producer
consumer
schema
ordering
dedupe
retry
DLQ
outbox
inbox
```

Phase 2 provides the baseline testing capability.

---

# 83. Test Isolation

Every test must:

```text
create its own data
clean up automatically
not depend on another test
```

Parallel tests should avoid:

```text
fixed ports
shared mutable global data
shared IDs
shared unisolated schemas
```

---

# 84. JUnit / AssertJ / Mockito Standard

Java tests use:

```text
JUnit 5
```

Recommended assertions:

```text
AssertJ
```

Mockito is appropriate at boundaries.

Example:

```java
var saveOrder = mock(SaveOrderPort.class);

verify(saveOrder).save(any(Order.class));
```

Avoid mocking simple value objects/entities without reason.

---

# 85. Architecture Tests

Use ArchUnit or equivalent to stop architecture erosion.

Rules should include:

```text
domain must not depend on adapter
domain must not depend on Spring
application must not depend on persistence implementation
REST adapter may depend on application
```

Example:

```java
@AnalyzeClasses(packages = "com.company.order")
class ArchitectureTest {

    @ArchTest
    static final ArchRule domainMustNotDependOnAdapters =
        noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..adapter..");
}
```

Add additional rules for Spring:

```text
domain must not depend on org.springframework..
```

---

# 86. Standard Test Package Layout

Example:

```text
src/test/java/com/company/order/
│
├── domain/
│   ├── model/
│   └── policy/
│
├── application/
│   └── usecase/
│
├── adapter/
│   ├── in/rest/
│   └── out/persistence/
│
├── integration/
│
└── architecture/
```

---

# 87. Test Categories / Tags

Recommended logical categories:

```text
unit
integration
contract
e2e
performance
security
migration
chaos
```

Phase 2 primarily prepares:

```text
unit
integration
architecture
security baseline
migration
```

---

# 88. Standard Service Configuration

Use external configuration.

Example:

```yaml
spring:
  application:
    name: order-service

  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  flyway:
    enabled: true

management:
  endpoints:
    web:
      exposure:
        include:
          - health
          - prometheus
```

Do not hard-code environment-specific secrets or dependency addresses.

---

# 89. Configuration Properties

Group important application configuration with typed Spring configuration properties where practical.

Example:

```java
@ConfigurationProperties(prefix = "service.payment")
public record PaymentClientProperties(
    URI baseUrl,
    Duration timeout
) {}
```

Prefer typed configuration to scattered string lookups.

---

# 90. Required Configuration Documentation

Every service README should document:

```text
Variable
Required?
Default?
Purpose
Example safe local value
Sensitive?
```

Example:

| Variable | Required | Sensitive | Purpose |
|---|---|---|---|
| DB_URL | Yes | No | Service PostgreSQL URL |
| DB_USERNAME | Yes | No | Service DB user |
| DB_PASSWORD | Yes | Yes | Service DB password |
| KAFKA_BOOTSTRAP_SERVERS | Conditional | No | Kafka brokers |
| REDIS_URL | Conditional | No | Redis endpoint |

---

# 91. Environment Profiles

Typical profiles:

```text
local
test
```

Shared environments should rely mainly on external runtime configuration rather than business-rule changes by profile.

Profiles must not change core business behavior.

Bad:

```text
production:
  wallet-negative-balance-allowed=true
```

unless this is an explicit governed feature rule—which normally it should not be.

---

# 92. External Provider Adapter Standard

External system flow:

```text
Application Use Case
       ↓
Output Port
       ↓
Provider Adapter
       ↓
Timeout / Retry / Circuit Breaker
       ↓
External API
       ↓
Provider DTO
       ↓
Anti-Corruption Mapping
       ↓
Canonical Application Result
```

Provider-specific fields/status codes must remain inside the integration adapter.

---

# 93. External Error Translation

Provider errors:

```text
provider code
HTTP status
timeout
invalid payload
unknown outcome
```

must be translated into canonical application/integration results.

Do not allow provider exception classes to spread through domain/application code.

---

# 94. Timeout Standard

All remote calls must have bounded timeouts/deadlines.

Do not allow unbounded:

```text
HTTP
gRPC
provider API
database connection acquisition
Kafka blocking call
```

Exact timeout values are service/dependency-specific and should be documented later.

---

# 95. Retry Standard

Retry only when safe.

Before enabling retry answer:

```text
Is operation idempotent?
Could retry duplicate a financial/business side effect?
What errors are retryable?
How many attempts?
What backoff?
What happens after final failure?
```

Never blindly retry non-idempotent external operations.

---

# 96. Shared Technical Modules

Shared technical libraries may contain limited cross-cutting support such as:

```text
logging helpers
OpenTelemetry setup
error envelope primitives
security utilities
test utilities
correlation utilities
```

Do not create:

```text
platform-common-domain
```

containing shared:

```text
Order
Payment
Wallet
Reward
Mission
Customer
```

Each service owns its domain model.

---

# 97. Common Technical Error Envelope

If a shared library is used, it may define technical DTOs such as:

```java
public record ApiErrorResponse(
    ApiError error
) {}
```

and:

```java
public record ApiError(
    String code,
    String message,
    List<ApiErrorDetail> details,
    String requestId,
    String correlationId,
    Instant timestamp
) {}
```

But service-specific error mapping remains owned by the service.

---

# 98. Standard Request Context

A technical request context may include:

```text
request_id
correlation_id
trace_id
authenticated_subject
service/client identity
```

Keep this separate from domain objects unless the business concept explicitly needs actor identity.

---

# 99. Standard Naming Rules

Classes:

```text
CreateOrderCommand
GetOrderQuery
CreateOrderUseCase
CreateOrderService
LoadOrderPort
SaveOrderPort
OrderPersistenceAdapter
OrderJpaEntity
OrderPersistenceMapper
OrderController
CreateOrderRequest
CreateOrderResponse
OrderRestMapper
```

Avoid vague names:

```text
OrderManager
CommonUtil
Helper
Processor
DataService
BaseService
Utils
GenericHandler
```

unless the meaning is genuinely specific and justified.

---

# 100. Command / Query Separation

Conceptual standard:

```text
Command
  → changes state

Query
  → reads state
```

A query should not intentionally produce a business side effect.

Read models may differ from write aggregates.

Do not force query response shape to mirror aggregate structure.

---

# 101. Standard Request Flow

Example:

```text
POST /api/v1/orders
        ↓
OrderController
        ↓
CreateOrderRequest
        ↓ mapper
CreateOrderCommand
        ↓
CreateOrderUseCase
        ↓
CreateOrderService
        ↓
Order.create(...)
        ↓
Domain invariants
        ↓
SaveOrderPort
        ↓
OrderPersistenceAdapter
        ↓
PostgreSQL
```

Event:

```text
Order
  ↓
OrderCreated domain event
  ↓
Application
  ↓
Outbox port
  ↓
Outbox table
  ↓
Publisher
  ↓
Kafka
```

---

# 102. Standard Kafka Consumer Flow

Example:

```text
Kafka
  ↓
OrderCompleted integration event
  ↓
Loyalty Kafka Adapter
  ↓
Schema/transport validation
  ↓
Consumer idempotency check
  ↓
EarnPointsCommand
  ↓
EarnPointsUseCase
  ↓
PointsAccount.earn()
  ↓
Save points
  ↓
Save outbox event
  ↓
Commit
```

The Kafka adapter converts transport events into application commands.

It must not contain the entire loyalty business rule.

---

# 103. Standard gRPC Flow

Example:

```text
Order Service
    ↓ gRPC
WalletGrpcService
    ↓ mapper
ReserveWalletCommand
    ↓
ReserveWalletUseCase
    ↓
WalletAccount.reserve()
    ↓
SaveWalletPort
    ↓
PostgreSQL
```

Response:

```text
WalletReservationResult
    ↓
gRPC Mapper
    ↓
ReserveWalletResponse
```

---

# 104. Architecture Smells

Any of these should trigger review:

```text
Controller contains SQL.
Domain imports Spring.
JPA entities are API responses.
Kafka payload is reused as domain model.
One service reads another service's tables.
Use case contains hundreds of lines.
Service has circular dependency.
Business rules exist only in controller.
Shared common module owns business entities.
External provider status codes appear everywhere.
Database schema is treated as public contract.
Raw infrastructure errors are returned to clients.
Business logic lives in mapper.
Everything is @Transactional.
Everything depends on a generic BaseService.
```

---

# 105. Code Review — Domain Checklist

- [ ] Business rule is in correct layer.
- [ ] Invariants cannot be bypassed.
- [ ] No infrastructure dependencies.
- [ ] Domain terminology is correct.
- [ ] Domain behavior is explicit.
- [ ] Value objects used where appropriate.
- [ ] Money has explicit currency.
- [ ] Time semantics are explicit.
- [ ] Domain can be tested without Spring.

---

# 106. Code Review — Application Checklist

- [ ] Use case has one clear responsibility.
- [ ] Input port is explicit.
- [ ] Output ports are explicit.
- [ ] Transaction boundary is correct.
- [ ] Authorization is enforced.
- [ ] Resource ownership is checked where needed.
- [ ] Idempotency is handled where required.
- [ ] No JPA repository dependency.
- [ ] No provider SDK dependency.
- [ ] No transport DTO dependency.

---

# 107. Code Review — Adapter Checklist

- [ ] DTO mapping is explicit.
- [ ] Infrastructure errors are translated.
- [ ] Transport validation exists.
- [ ] Timeouts exist.
- [ ] Retry is safe.
- [ ] Logging excludes sensitive data.
- [ ] External statuses are mapped to canonical concepts.
- [ ] No major business workflow exists only in adapter.

---

# 108. Code Review — Persistence Checklist

- [ ] Service accesses only owned database.
- [ ] Constraints support important invariants.
- [ ] Migration exists.
- [ ] Migration is backward-compatible where required.
- [ ] Indexes support known query patterns.
- [ ] No cross-service foreign keys.
- [ ] Money storage avoids floating point.
- [ ] Sensitive fields classified.
- [ ] Retention/audit considered.

---

# 109. Code Review — Security Checklist

For a new endpoint:

- [ ] Authentication required?
- [ ] Authorization defined?
- [ ] Resource ownership checked?
- [ ] Input validation complete?
- [ ] Rate limit needed?
- [ ] Idempotency needed?
- [ ] Sensitive output minimized?
- [ ] Audit log needed?
- [ ] Abuse scenario considered?
- [ ] Error response safe?
- [ ] Tokens/secrets excluded from logs?

---

# 110. Code Review — Observability Checklist

- [ ] Structured log exists where operationally meaningful.
- [ ] Request/correlation ID available.
- [ ] Trace context propagates.
- [ ] Error code is stable.
- [ ] Sensitive data is redacted.
- [ ] No full body logging by default.
- [ ] Metrics use low-cardinality labels.
- [ ] Dependency failures are observable.

---

# 111. Definition of Done — New Use Case

A new business use case is complete when:

- [ ] Business requirement is identified.
- [ ] Domain rule is modeled.
- [ ] Input port exists.
- [ ] Application service exists.
- [ ] Required output ports exist.
- [ ] Adapters are implemented.
- [ ] Domain tests pass.
- [ ] Application tests pass.
- [ ] Adapter tests pass.
- [ ] Integration tests pass where needed.
- [ ] Error contract is defined.
- [ ] Logging/metrics are added.
- [ ] Idempotency is defined if state-changing.
- [ ] Security/authorization is defined.
- [ ] Database migration exists if needed.
- [ ] Documentation is updated.

---

# 112. Definition of Done — New Database Table

A new table is complete when:

- [ ] Owning service defined.
- [ ] Purpose documented.
- [ ] Primary key defined.
- [ ] Business key defined if required.
- [ ] Constraints defined.
- [ ] Indexes justified.
- [ ] Flyway migration created.
- [ ] Retention considered.
- [ ] Sensitive/PII classification reviewed.
- [ ] Integration tests created.
- [ ] Query patterns reviewed.
- [ ] Monitoring/operational impact considered.

---

# 113. Definition of Done — Security

A feature is not security-complete until:

- [ ] Authentication is defined.
- [ ] Authorization is defined.
- [ ] Sensitive data is classified.
- [ ] Logging is reviewed.
- [ ] Input is validated.
- [ ] Abuse/rate limiting is considered.
- [ ] Idempotency/replay is considered.
- [ ] Security tests exist where needed.
- [ ] Audit events are added where required.
- [ ] Secrets are handled correctly.
- [ ] Threats are reviewed.

---

# 114. Definition of Done — Logging

- [ ] Structured format.
- [ ] UTC timestamp.
- [ ] Service/environment/version available.
- [ ] Correlation/request/trace IDs available.
- [ ] Stable error code logged where relevant.
- [ ] Secrets redacted.
- [ ] PII minimized.
- [ ] Correct log levels.
- [ ] No full request/response bodies by default.

---

# 115. Standard Service Bootstrap Checklist

For every new service:

- [ ] Spring Boot project.
- [ ] Approved Java version pinned.
- [ ] Gradle/Maven wrapper.
- [ ] Package architecture created.
- [ ] Domain package created.
- [ ] Application ports created.
- [ ] REST/gRPC/Kafka adapters added only as needed.
- [ ] PostgreSQL adapter where needed.
- [ ] Flyway configured.
- [ ] Health endpoint configured.
- [ ] Structured logging configured.
- [ ] Correlation/request ID support.
- [ ] OpenTelemetry-ready configuration.
- [ ] Error handling configured.
- [ ] Security baseline configured.
- [ ] Testcontainers baseline configured.
- [ ] ArchUnit rules configured.
- [ ] Dockerfile.
- [ ] `.env.example`.
- [ ] README.
- [ ] Owned database documented.
- [ ] Security review documented.
- [ ] CI integration prepared for later Phase 28.

---

# 116. Standard Service README Template

Every service README should contain:

```text
# Service Name

## Purpose

## Business Ownership

## Non-Responsibilities

## Port

## Dependencies

## Database

## Kafka Topics

## Redis Usage

## External Providers

## Environment Variables

## Local Run

## Tests

## Migrations

## Health

## Security

## Errors

## Observability

## Reset / Troubleshooting
```

---

# 117. Service Architecture Document Template

`docs/architecture.md`:

```text
Service:
Owner:

Business Capability:
Bounded Context:

Responsibilities:
Non-Responsibilities:

Domain Aggregates:
Use Cases:

Input Ports:
Output Ports:

Input Adapters:
Output Adapters:

Owned Database:
Kafka Produced:
Kafka Consumed:
Redis:
External Dependencies:

Authentication:
Authorization:

Idempotency:

Transaction Boundaries:

Known Consistency Model:

Critical Invariants:
```

---

# 118. Service Data Document Template

`docs/data.md`:

```text
Owned Database:

Tables:

Table:
Purpose:
Primary Key:
Business Key:
Foreign Keys:
Unique Constraints:
Check Constraints:
Important Indexes:
Retention:
PII Classification:
Audit:
Write Pattern:
Read Pattern:

Migration Strategy:
Concurrency Strategy:
Idempotency Tables:
Outbox:
Inbox:
```

---

# 119. Service Error Catalog Template

`docs/errors.md`:

| Code | HTTP/gRPC | Type | Retryable | Meaning |
|---|---:|---|---|---|
| EXAMPLE_NOT_FOUND | 404 | Domain | No | Resource not found |
| VALIDATION_FAILED | 400 | Contract | No | Request invalid |
| ACCESS_DENIED | 403 | Security | No | Not authorized |
| DEPENDENCY_UNAVAILABLE | 503 | Technical | Usually | Downstream unavailable |

Rules:

```text
Codes are stable.
Messages may change.
Do not expose infrastructure exception text.
```

---

# 120. Standard `.env.example` Categories

Each service should categorize:

```dotenv
# SERVER

# DATABASE

# SECURITY

# KAFKA

# REDIS

# EXTERNAL PROVIDERS

# FEATURE FLAGS

# OBSERVABILITY
```

Only include categories the service actually uses.

---

# 121. Standard `application.yml` Philosophy

`application.yml` should contain:

```text
safe structural defaults
property wiring
Actuator configuration
logging configuration
```

Do not put:

```text
production password
production token
real private key
environment-specific provider secret
```

into source control.

---

# 122. Domain-First Implementation Order

Inside every service implement in this order:

```text
1. Model domain
2. Write domain tests
3. Define use cases
4. Define input/output ports
5. Implement application services
6. Add persistence adapter
7. Add REST/gRPC adapter
8. Add Kafka adapter if required
9. Add integration tests
10. Add deployment/runtime configuration
```

This prevents framework-driven design.

---

# 123. Phase 2 Deliverables

Phase 2 produces:

1. Clean/Hexagonal architecture standard.
2. Dependency rules.
3. Common package template.
4. Domain model rules.
5. Entity/value-object rules.
6. Domain event rules.
7. Domain exception rules.
8. Time/randomness standards.
9. Application command/query standard.
10. Input/output port standards.
11. Use-case standard.
12. Transaction-boundary standard.
13. Authorization boundary standard.
14. REST adapter standard.
15. gRPC adapter standard.
16. Kafka adapter standard.
17. Persistence adapter standard.
18. External-provider adapter standard.
19. Explicit mapping standard.
20. Contract-validation architecture.
21. Domain-validation architecture.
22. Database-constraint standard.
23. REST error architecture.
24. Stable error-code standard.
25. Idempotency standard.
26. Outbox baseline.
27. Inbox/consumer dedupe baseline.
28. PostgreSQL naming standard.
29. Flyway standard.
30. Migration immutability standard.
31. Expand/contract migration standard.
32. Index/constraint rules.
33. Security baseline.
34. Deny-by-default standard.
35. Service identity rules.
36. Secret-handling rules.
37. Actuator/health baseline.
38. Structured-logging baseline.
39. Correlation/request ID baseline.
40. OpenTelemetry readiness baseline.
41. Metrics baseline.
42. Audit baseline.
43. Unit/domain-test standard.
44. Application-test standard.
45. Persistence integration-test standard.
46. Testcontainers baseline.
47. ArchUnit architecture-test baseline.
48. Code-review checklists.
49. Architecture smell checklist.
50. Use-case Definition of Done.
51. Service-bootstrap checklist.
52. README/architecture/data/error templates.

---

# 124. Phase 2 Exit Criteria

Phase 2 is complete only when the team can answer all of the following.

## Domain

```text
Where does business logic live?
```

Required answer:

```text
Domain.
```

## Workflow

```text
Where does use-case orchestration live?
```

Required answer:

```text
Application layer.
```

## Infrastructure

```text
How does application code access infrastructure?
```

Required answer:

```text
Through output ports.
```

## REST / gRPC / Kafka

```text
Where do transport-specific models live?
```

Required answer:

```text
Adapters/contracts.
```

## Persistence

```text
Does the domain depend on JPA?
```

Required answer:

```text
No.
```

## Kafka

```text
Does the domain publish directly to Kafka?
```

Required answer:

```text
No.
```

## Database Ownership

```text
Can one service directly use another service's repository/database?
```

Required answer:

```text
No.
```

## Testing

```text
Can domain behavior be tested without Spring?
```

Required answer:

```text
Yes.
```

## Contracts

```text
Are API/gRPC/Kafka models separate from domain/persistence models?
```

Required answer:

```text
Yes.
```

## Migrations

```text
Are all schema changes versioned through Flyway?
```

Required answer:

```text
Yes.
```

## Security

```text
Is authentication/authorization/input validation/error safety considered for every endpoint?
```

Required answer:

```text
Yes.
```

## Observability

```text
Can requests be correlated through request/correlation/trace metadata?
```

Required answer:

```text
Yes.
```

## Architecture Enforcement

```text
Can architecture tests detect forbidden dependency direction?
```

Required answer:

```text
Yes.
```

---

# 125. Phase 2 Acceptance Test

Before starting Identity Service, create one small reference/sample service or skeleton and prove:

```text
Spring Boot starts
        ↓
Health endpoint works
        ↓
Package boundaries compile
        ↓
Domain has no Spring dependency
        ↓
Application accesses persistence through port
        ↓
PostgreSQL Testcontainer starts
        ↓
Flyway migration runs
        ↓
Repository integration test passes
        ↓
REST validation test passes
        ↓
Global error envelope works
        ↓
Request/correlation ID is available
        ↓
Security default is deny/authenticated as configured
        ↓
ArchUnit rules pass
        ↓
Docker image builds
```

The sample does not need real production business functionality.

Its purpose is to prove the engineering template.

---

# 126. Recommended Reference Skeleton

```text
service-template/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── .env.example
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew
├── gradlew.bat
├── gradle/
│
├── src/main/java/com/company/template/
│   ├── TemplateApplication.java
│   │
│   ├── domain/
│   │   ├── model/
│   │   ├── valueobject/
│   │   ├── service/
│   │   ├── policy/
│   │   ├── event/
│   │   └── exception/
│   │
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   └── out/
│   │   ├── command/
│   │   ├── query/
│   │   ├── result/
│   │   └── usecase/
│   │
│   ├── adapter/
│   │   ├── in/
│   │   │   ├── rest/
│   │   │   ├── grpc/
│   │   │   └── kafka/
│   │   │
│   │   └── out/
│   │       ├── persistence/
│   │       ├── kafka/
│   │       ├── redis/
│   │       └── external/
│   │
│   └── config/
│       ├── security/
│       ├── web/
│       ├── persistence/
│       └── observability/
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   ├── application-test.yml
│   └── db/migration/
│
├── src/test/java/com/company/template/
│   ├── domain/
│   ├── application/
│   ├── adapter/
│   ├── integration/
│   └── architecture/
│
└── docs/
    ├── architecture.md
    ├── data.md
    ├── errors.md
    └── runbook.md
```

Only include gRPC/Kafka/Redis folders in a real service when required.

---

# 127. Phase 2 Definition of Done Checklist

## Architecture

- [ ] Clean + Hexagonal architecture adopted.
- [ ] Dependency direction documented.
- [ ] Domain independent from Spring/infrastructure.
- [ ] Application uses ports.
- [ ] Adapters translate/delegate.
- [ ] Architecture tests enforce boundaries.

## Domain

- [ ] Aggregate rules defined.
- [ ] Entity rules defined.
- [ ] Value-object rules defined.
- [ ] Domain exception standard defined.
- [ ] Domain-event standard defined.
- [ ] Money/currency standard defined.
- [ ] Time standard defined.
- [ ] Randomness/testability standard defined.

## Application

- [ ] Command standard defined.
- [ ] Query standard defined.
- [ ] Input-port standard defined.
- [ ] Output-port standard defined.
- [ ] Use-case naming standard defined.
- [ ] Transaction-boundary rule defined.
- [ ] Authorization boundary defined.
- [ ] Idempotency orchestration rule defined.

## Adapters

- [ ] REST adapter rules defined.
- [ ] gRPC adapter rules defined.
- [ ] Kafka adapter rules defined.
- [ ] Persistence adapter rules defined.
- [ ] External adapter rules defined.
- [ ] Explicit mapping required.
- [ ] Infrastructure error translation required.

## Contracts / Errors

- [ ] REST version pattern defined.
- [ ] JSON naming defined.
- [ ] ISO timestamp standard defined.
- [ ] Money contract standard defined.
- [ ] Request ID standard defined.
- [ ] Correlation ID standard defined.
- [ ] Error envelope defined.
- [ ] Stable error-code standard defined.
- [ ] Validation error format defined.
- [ ] Technical errors hidden from clients.

## Persistence / Data

- [ ] Database ownership rule defined.
- [ ] Database naming rules defined.
- [ ] Constraint naming defined.
- [ ] No cross-service FK rule defined.
- [ ] Flyway mandatory.
- [ ] Flyway naming defined.
- [ ] Migration immutability defined.
- [ ] Expand/contract migration strategy defined.
- [ ] Index review rules defined.
- [ ] Transaction duration rule defined.
- [ ] Optimistic concurrency approach available.
- [ ] Idempotency table pattern documented.
- [ ] Outbox pattern documented.
- [ ] Processed-event/inbox pattern documented.

## Security

- [ ] Deny-by-default standard.
- [ ] Authentication baseline.
- [ ] Authorization baseline.
- [ ] Resource ownership checks.
- [ ] Service identity principle.
- [ ] No shared hard-coded service API key.
- [ ] Secrets excluded from source/logs.
- [ ] Actuator endpoints restricted.
- [ ] Input validation required.
- [ ] Security review checklist defined.

## Observability

- [ ] Structured logging standard.
- [ ] UTC logging.
- [ ] Request/correlation IDs.
- [ ] Trace readiness.
- [ ] Sensitive log redaction.
- [ ] Metrics baseline.
- [ ] No high-cardinality business IDs as metric labels.
- [ ] Audit event standard.

## Testing

- [ ] JUnit 5 baseline.
- [ ] AssertJ recommendation.
- [ ] Mockito boundary rules.
- [ ] Domain tests without Spring.
- [ ] Application tests with mocked/fake ports.
- [ ] Persistence integration with PostgreSQL Testcontainers.
- [ ] Kafka Testcontainers strategy where required.
- [ ] Test isolation rules.
- [ ] ArchUnit baseline.
- [ ] Migration tests.
- [ ] Security tests planned where required.

## Service Bootstrap

- [ ] Standard service tree defined.
- [ ] README template defined.
- [ ] Architecture document template.
- [ ] Data document template.
- [ ] Error catalog template.
- [ ] `.env.example` categories.
- [ ] Application configuration pattern.
- [ ] Health baseline.
- [ ] Docker baseline inherited from Phase 1.
- [ ] Reference skeleton validated.

---

# 128. Final Phase 2 Result

When Phase 2 is complete:

```text
SHARED ENGINEERING STANDARD
│
├── Clean / Hexagonal Architecture         ✅
├── Dependency Rule                        ✅
├── Standard Package Layout                ✅
│
├── Domain Standards
│   ├── Aggregates                         ✅
│   ├── Entities                           ✅
│   ├── Value Objects                      ✅
│   ├── Domain Events                      ✅
│   ├── Domain Exceptions                  ✅
│   ├── Money                              ✅
│   └── Time / Randomness                  ✅
│
├── Application Standards
│   ├── Commands                           ✅
│   ├── Queries                            ✅
│   ├── Input Ports                        ✅
│   ├── Output Ports                       ✅
│   ├── Use Cases                          ✅
│   ├── Transactions                       ✅
│   └── Authorization                      ✅
│
├── Adapter Standards
│   ├── REST                               ✅
│   ├── gRPC                               ✅
│   ├── Kafka                              ✅
│   ├── PostgreSQL                         ✅
│   ├── Redis                              ✅
│   └── External Providers                 ✅
│
├── Data Standards
│   ├── Database Ownership                 ✅
│   ├── Flyway                             ✅
│   ├── Constraints                        ✅
│   ├── Indexes                            ✅
│   ├── Idempotency                        ✅
│   ├── Outbox                             ✅
│   └── Inbox                              ✅
│
├── Security Baseline                      ✅
├── Error Standard                         ✅
├── Validation Standard                    ✅
├── Logging / Trace Baseline               ✅
├── Test Standard                          ✅
├── ArchUnit Enforcement                   ✅
├── Code Review Standard                   ✅
├── Definition of Done                     ✅
└── Reusable Service Skeleton              ✅
```

---

# 129. Handoff to Phase 3

After this phase, move to:

```text
PHASE 03 — Contract Foundation
```

Phase 3 will turn the contract standards into concrete shared artifacts for:

```text
OpenAPI
REST API conventions
Protobuf
gRPC contracts
Kafka event schemas
Event envelopes
Command contracts
Query contracts
Error catalog
Pagination
Authentication metadata
Correlation metadata
Idempotency metadata
Versioning
Compatibility checks
Contract tests
```

Phase 2 defines:

```text
how code inside a service is structured
```

Phase 3 defines:

```text
how services and clients communicate with each other
```

Do not begin large-scale service implementation until both standards are sufficiently stable.

---

**End of PHASE 02 — Shared Engineering Standards**
