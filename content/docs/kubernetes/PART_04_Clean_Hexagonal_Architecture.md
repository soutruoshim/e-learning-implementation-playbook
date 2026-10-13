---
title: "PART 04 — CLEAN + HEXAGONAL ARCHITECTURE"
---

# PART 04 — CLEAN + HEXAGONAL ARCHITECTURE

> **Document Role:** Defines the internal architecture standard that every microservice must follow.  
> **Previous Part:** PART 03 — Service Boundaries  
> **Next Part:** PART 05 — Contracts  
> **Status:** Architecture / Implementation Standard  
> **Primary Stack:** Java / Spring Boot  
> **Audience:** Backend engineers, software architects, technical leads, QA engineers, code reviewers.

---

# 100 — Purpose

PART 03 defined:

```text
What each service owns.
```

PART 04 defines:

```text
How each service is structured internally.
```

The goal is to make every service:

- Easy to understand.
- Easy to test.
- Independent from frameworks.
- Independent from infrastructure details.
- Safe to change.
- Consistent across teams.
- Explicit about business rules.
- Explicit about dependencies.
- Replaceable at infrastructure boundaries.
- Ready for REST, gRPC, Kafka, PostgreSQL, Redis, and external integrations.

The architecture combines ideas from:

```text
Clean Architecture
Hexagonal Architecture
Ports and Adapters
Domain-Driven Design
Dependency Inversion
```

The most important rule is:

```text
Business logic must not depend on infrastructure.
```

---

# 101 — High-Level Architecture

Recommended structure:

```text
┌───────────────────────────────────────────────┐
│                 ADAPTERS                      │
│                                               │
│ REST / gRPC / Kafka / DB / Redis / External  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│              APPLICATION LAYER                │
│                                               │
│ Use Cases / Commands / Queries / Ports        │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                  DOMAIN                       │
│                                               │
│ Aggregates / Entities / Value Objects / Rules │
└───────────────────────────────────────────────┘
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

---

# 102 — Dependency Rule

The core rule:

```text
Outer layers may depend on inner layers.

Inner layers must not depend on outer layers.
```

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

# 103 — Layer Responsibilities

The service is divided into four main areas:

```text
domain
application
adapter
configuration
```

Possible package structure:

```text
com.company.order
│
├── domain
├── application
├── adapter
└── config
```

Expanded:

```text
com.company.order
│
├── domain/
│   ├── model/
│   ├── service/
│   ├── event/
│   ├── exception/
│   └── policy/
│
├── application/
│   ├── port/
│   │   ├── in/
│   │   └── out/
│   ├── usecase/
│   ├── command/
│   ├── query/
│   └── dto/
│
├── adapter/
│   ├── in/
│   │   ├── rest/
│   │   ├── grpc/
│   │   └── kafka/
│   │
│   └── out/
│       ├── persistence/
│       ├── kafka/
│       ├── redis/
│       ├── grpc/
│       └── external/
│
└── config/
```

---

# 104 — Domain Layer

## 104.1 Purpose

The domain layer contains pure business behavior.

It should contain:

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

The domain layer must not know:

```text
HTTP
REST
gRPC
Kafka
PostgreSQL
Redis
JPA
Spring MVC
Kubernetes
Docker
```

---

## 104.2 Domain Example

```java
public class Order {

    private final OrderId id;
    private OrderStatus status;
    private final List<OrderItem> items;

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

Important:

The business rule:

```text
Completed order cannot be cancelled
```

belongs inside the domain.

It should not live only inside:

```text
REST Controller
```

or:

```text
SQL condition
```

---

# 105 — Domain Model Rules

Every aggregate should:

1. Protect its own invariants.
2. Expose behavior rather than unrestricted setters.
3. Use meaningful domain types.
4. Prevent invalid state.
5. Produce domain events when important business facts occur.

Avoid:

```java
order.setStatus("DONE");
```

Prefer:

```java
order.complete();
```

because `complete()` can enforce business rules.

---

# 106 — Entities

Entities have stable identity.

Example:

```java
public class OrderItem {

    private final OrderItemId id;
    private final ProductId productId;
    private Quantity quantity;
    private Money unitPrice;
}
```

Identity remains stable even if quantity changes.

---

# 107 — Value Objects

Value objects represent meaningful values.

Recommended examples:

```text
Money
Currency
OrderId
PaymentId
WalletId
CustomerId
ProductId
Quantity
Percentage
PhoneNumber
EmailAddress
DateRange
```

Example:

```java
public record Money(
    BigDecimal amount,
    Currency currency
) {

    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("amount is required");
        }

        if (currency == null) {
            throw new IllegalArgumentException("currency is required");
        }
    }
}
```

---

# 108 — Domain Services

Use a domain service when business logic does not naturally belong to one aggregate.

Example:

```java
public class RewardSelectionPolicy {

    public Reward select(
        List<RewardCandidate> candidates,
        RewardDistributionState state
    ) {
        // domain decision
    }
}
```

Do not inject:

```text
JpaRepository
KafkaTemplate
RestClient
RedisTemplate
```

into domain services.

---

# 109 — Domain Policies

A policy represents a business decision.

Examples:

```text
OrderCancellationPolicy
PromotionEligibilityPolicy
TierEvaluationPolicy
WalletReservationPolicy
RewardSelectionPolicy
```

A policy should communicate business intent.

Example:

```java
public interface OrderCancellationPolicy {

    boolean canCancel(Order order, Instant now);
}
```

---

# 110 — Domain Events

Domain events represent completed domain facts.

Example:

```java
public record OrderCompleted(
    OrderId orderId,
    CustomerId customerId,
    Money total,
    Instant occurredAt
) implements DomainEvent {}
```

The domain may create the event.

The domain must not directly publish it to Kafka.

Wrong:

```java
kafkaTemplate.send(...);
```

inside:

```text
Order
```

Correct:

```text
Order
  ↓ creates domain event
Application
  ↓ persists / publishes through port
Adapter
  ↓ Kafka
```

---

# 111 — Domain Exceptions

Use domain-specific exceptions for violated business rules.

Examples:

```text
InsufficientWalletBalanceException
InvalidOrderStateException
CouponExpiredException
PointsInsufficientException
InvalidMissionProgressException
```

Avoid throwing generic exceptions for business rules:

```java
throw new RuntimeException("error");
```

---

# 112 — Application Layer

## 112.1 Purpose

The application layer coordinates use cases.

It answers:

```text
What should happen for this application operation?
```

It does not contain infrastructure code.

Typical responsibilities:

```text
Load aggregate
Check authorization context
Call domain behavior
Persist aggregate
Call output ports
Collect domain events
Return application result
Manage transaction boundary
```

---

# 113 — Application Use Cases

Example:

```text
CreateOrder
CancelOrder
CompleteOrder
ReserveWalletFunds
CaptureWalletFunds
EarnPoints
UpdateMissionProgress
```

One use case should represent one business intention.

---

# 114 — Input Ports

An input port defines what the application can do.

Example:

```java
public interface CreateOrderUseCase {

    CreateOrderResult create(CreateOrderCommand command);
}
```

REST, gRPC, Kafka, CLI, tests, or scheduled jobs may all call the same use case.

---

# 115 — Output Ports

An output port defines what the application needs from outside.

Examples:

```java
public interface LoadOrderPort {
    Optional<Order> findById(OrderId orderId);
}
```

```java
public interface SaveOrderPort {
    void save(Order order);
}
```

```java
public interface PublishOrderEventPort {
    void publish(OrderEvent event);
}
```

```java
public interface ReserveWalletPort {
    WalletReservationResult reserve(...);
}
```

The application depends on interfaces.

Adapters implement them.

---

# 116 — Commands

A command represents a request to change state.

Example:

```java
public record CreateOrderCommand(
    String userId,
    String storeId,
    List<CreateOrderItemCommand> items,
    String idempotencyKey
) {}
```

Rules:

- Immutable where possible.
- Validated at boundaries.
- Contains application input.
- Does not contain framework-specific objects.
- Does not expose HTTP request classes internally.

---

# 117 — Queries

Queries request information.

Example:

```java
public record GetOrderQuery(
    String orderId,
    String requestingUserId
) {}
```

Query handlers may use optimized read models.

Not every query needs to load a domain aggregate.

---

# 118 — Application Service Example

```java
@Service
@Transactional
public class CreateOrderService
        implements CreateOrderUseCase {

    private final LoadProductPort loadProductPort;
    private final SaveOrderPort saveOrderPort;
    private final IdempotencyPort idempotencyPort;
    private final PublishOutboxPort publishOutboxPort;

    public CreateOrderService(
            LoadProductPort loadProductPort,
            SaveOrderPort saveOrderPort,
            IdempotencyPort idempotencyPort,
            PublishOutboxPort publishOutboxPort
    ) {
        this.loadProductPort = loadProductPort;
        this.saveOrderPort = saveOrderPort;
        this.idempotencyPort = idempotencyPort;
        this.publishOutboxPort = publishOutboxPort;
    }

    @Override
    public CreateOrderResult create(CreateOrderCommand command) {

        var previous =
            idempotencyPort.find(command.idempotencyKey());

        if (previous.isPresent()) {
            return previous.get();
        }

        var order = Order.create(...);

        saveOrderPort.save(order);

        for (var event : order.domainEvents()) {
            publishOutboxPort.save(event);
        }

        return CreateOrderResult.from(order);
    }
}
```

Important:

The service coordinates.

The domain owns the rules.

The adapter owns technical persistence details.

---

# 119 — Transaction Boundaries

The application layer normally defines the transaction boundary.

Example:

```text
CreateOrderUseCase
     ↓
Begin transaction
     ↓
Validate idempotency
     ↓
Create aggregate
     ↓
Save aggregate
     ↓
Save outbox event
     ↓
Commit
```

Do not spread one database transaction across multiple services.

---

# 120 — Input Adapters

Input adapters translate external requests into application commands/queries.

Examples:

```text
REST Controller
gRPC Server
Kafka Consumer
Scheduled Job
CLI
```

---

# 121 — REST Input Adapter

Example:

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final CreateOrderUseCase createOrderUseCase;

    public OrderController(
        CreateOrderUseCase createOrderUseCase
    ) {
        this.createOrderUseCase = createOrderUseCase;
    }

    @PostMapping
    public ResponseEntity<CreateOrderResponse> create(
        @Valid @RequestBody CreateOrderRequest request,
        @RequestHeader("Idempotency-Key") String key
    ) {

        var command = OrderRestMapper.toCommand(
            request,
            key
        );

        var result = createOrderUseCase.create(command);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(OrderRestMapper.toResponse(result));
    }
}
```

The controller should not:

- Execute SQL.
- Calculate wallet balances.
- Implement order transition rules.
- Publish Kafka events directly.
- Contain large business workflows.

---

# 122 — REST DTO Rules

REST request/response DTOs belong to the REST adapter.

Example:

```text
CreateOrderRequest
CreateOrderResponse
OrderItemResponse
ApiErrorResponse
```

Do not reuse:

```text
JPA entities
Domain aggregates
Kafka event payloads
```

as REST DTOs.

Each contract has a different lifecycle.

---

# 123 — REST Mapping

Use explicit mapping:

```text
HTTP Request
    ↓
REST DTO
    ↓
Command / Query
    ↓
Application
    ↓
Result
    ↓
REST Response
```

This prevents external API contracts from controlling the domain model.

---

# 124 — gRPC Input Adapter

Internal synchronous communication may use gRPC.

Flow:

```text
gRPC Request
    ↓
gRPC Adapter
    ↓
Application Command
    ↓
Use Case
    ↓
Application Result
    ↓
gRPC Response
```

Example:

```java
public class WalletGrpcService
        extends WalletServiceGrpc.WalletServiceImplBase {

    private final ReserveWalletUseCase reserveWalletUseCase;

    @Override
    public void reserve(
        ReserveWalletRequest request,
        StreamObserver<ReserveWalletResponse> observer
    ) {

        var command = WalletGrpcMapper.toCommand(request);

        var result =
            reserveWalletUseCase.reserve(command);

        observer.onNext(
            WalletGrpcMapper.toResponse(result)
        );

        observer.onCompleted();
    }
}
```

---

# 125 — Kafka Input Adapter

Kafka consumers are input adapters.

Example:

```text
Kafka Event
   ↓
Deserializer
   ↓
Event Adapter
   ↓
Application Command
   ↓
Use Case
```

Example:

```java
@Component
public class OrderCompletedConsumer {

    private final EarnPointsUseCase earnPointsUseCase;

    @KafkaListener(topics = "order.completed.v1")
    public void consume(OrderCompletedEvent event) {

        var command =
            LoyaltyKafkaMapper.toEarnPointsCommand(event);

        earnPointsUseCase.execute(command);
    }
}
```

Kafka adapters must handle:

- Schema validation.
- Consumer idempotency.
- Retry policy.
- DLQ.
- Correlation IDs.
- Observability.

---

# 126 — Scheduled Job Input Adapter

Scheduled work should also enter through application ports.

Example:

```text
Scheduler
  ↓
ExpirePointsUseCase
  ↓
Application
  ↓
Domain
```

Avoid placing full business logic inside:

```java
@Scheduled
```

methods.

---

# 127 — Output Adapters

Output adapters connect application ports to infrastructure.

Examples:

```text
PostgreSQL
Redis
Kafka
External REST API
External gRPC API
Object Storage
Email Provider
FCM
```

---

# 128 — Persistence Adapter

Recommended structure:

```text
adapter/out/persistence
│
├── entity/
├── repository/
├── mapper/
└── OrderPersistenceAdapter.java
```

Example:

```java
@Component
public class OrderPersistenceAdapter
        implements LoadOrderPort, SaveOrderPort {

    private final SpringDataOrderRepository repository;
    private final OrderPersistenceMapper mapper;

    @Override
    public Optional<Order> findById(OrderId id) {
        return repository
            .findById(id.value())
            .map(mapper::toDomain);
    }

    @Override
    public void save(Order order) {
        repository.save(
            mapper.toEntity(order)
        );
    }
}
```

---

# 129 — Persistence Entity Rules

Persistence entities are infrastructure models.

Example:

```java
@Entity
@Table(name = "orders")
public class OrderJpaEntity {

    @Id
    private UUID id;

    private String status;

    private BigDecimal totalAmount;

    private String currency;
}
```

Do not expose this entity into domain logic.

Use mapping:

```text
JPA Entity
   ↕
Persistence Mapper
   ↕
Domain Aggregate
```

---

# 130 — Repository Rules

Spring Data repository belongs in the persistence adapter.

Example:

```java
public interface SpringDataOrderRepository
        extends JpaRepository<OrderJpaEntity, UUID> {
}
```

Domain must not depend on this interface.

---

# 131 — Kafka Output Adapter

Example output port:

```java
public interface SaveOutboxEventPort {

    void save(DomainEvent event);
}
```

Adapter:

```java
@Component
public class OutboxPersistenceAdapter
        implements SaveOutboxEventPort {

    private final OutboxJpaRepository repository;

    @Override
    public void save(DomainEvent event) {
        repository.save(
            OutboxMapper.toEntity(event)
        );
    }
}
```

A background publisher later sends events to Kafka.

---

# 132 — Redis Output Adapter

Redis is infrastructure.

Example use cases:

```text
Caching
Rate limiting
Distributed locks
Temporary tokens
Idempotency cache
```

Application defines the port:

```java
public interface ProductCachePort {

    Optional<ProductView> get(ProductId id);

    void put(ProductView product);
}
```

Redis adapter implements it.

---

# 133 — External REST Adapter

Example:

```text
Application
    ↓
PaymentProviderPort
    ↓
ExternalPaymentRestAdapter
    ↓
Provider API
```

Port:

```java
public interface PaymentProviderPort {

    ProviderAuthorizationResult authorize(
        ProviderAuthorizationCommand command
    );
}
```

Adapter:

```java
@Component
public class ExternalPaymentRestAdapter
        implements PaymentProviderPort {

    private final RestClient restClient;

    @Override
    public ProviderAuthorizationResult authorize(
        ProviderAuthorizationCommand command
    ) {
        // translate internal model
        // call provider
        // translate provider response
    }
}
```

---

# 134 — Anti-Corruption Adapter

External systems should not leak their terminology into the core.

Example:

```text
Provider status:
S
F
P
```

Translate to:

```text
SUCCESS
FAILED
PENDING
```

inside the integration adapter.

Do not allow provider-specific codes to spread through the domain.

---

# 135 — Configuration Layer

Configuration may contain:

```text
Spring beans
Security configuration
gRPC configuration
Kafka configuration
Jackson configuration
Database configuration
Redis configuration
Observability configuration
```

Example:

```text
config/
├── SecurityConfig.java
├── KafkaConfig.java
├── RedisConfig.java
├── GrpcConfig.java
└── ObservabilityConfig.java
```

Configuration should wire components.

It should not contain business logic.

---

# 136 — Dependency Injection

Constructor injection is preferred.

Example:

```java
public CreateOrderService(
    LoadOrderPort loadOrderPort,
    SaveOrderPort saveOrderPort
) {
    this.loadOrderPort = loadOrderPort;
    this.saveOrderPort = saveOrderPort;
}
```

Avoid unnecessary field injection:

```java
@Autowired
private SaveOrderPort saveOrderPort;
```

Constructor injection makes dependencies explicit and easier to test.

---

# 137 — Common Service Template

Recommended project layout:

```text
order-service/
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/order/
│   │   │       │
│   │   │       ├── domain/
│   │   │       │   ├── model/
│   │   │       │   ├── event/
│   │   │       │   ├── policy/
│   │   │       │   ├── service/
│   │   │       │   └── exception/
│   │   │       │
│   │   │       ├── application/
│   │   │       │   ├── port/
│   │   │       │   │   ├── in/
│   │   │       │   │   └── out/
│   │   │       │   ├── command/
│   │   │       │   ├── query/
│   │   │       │   ├── usecase/
│   │   │       │   └── dto/
│   │   │       │
│   │   │       ├── adapter/
│   │   │       │   ├── in/
│   │   │       │   │   ├── rest/
│   │   │       │   │   ├── grpc/
│   │   │       │   │   └── kafka/
│   │   │       │   │
│   │   │       │   └── out/
│   │   │       │       ├── persistence/
│   │   │       │       ├── kafka/
│   │   │       │       ├── redis/
│   │   │       │       ├── grpc/
│   │   │       │       └── external/
│   │   │       │
│   │   │       ├── config/
│   │   │       └── OrderApplication.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-dev.yml
│   │       ├── application-uat.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │
│   └── test/
│       └── java/
│
├── Dockerfile
├── docker-compose.yml
├── pom.xml
├── .gitlab-ci.yml
└── README.md
```

---

# 138 — Feature-Based Subpackages

For larger services, organize by feature inside layers.

Example:

```text
application/
├── createorder/
├── cancelorder/
├── completeorder/
└── getorder/
```

Alternative:

```text
order/
├── domain/
├── application/
└── adapter/
```

The team must choose one consistent convention.

Avoid deeply nested packages without clear value.

---

# 139 — Package Visibility

Where possible, minimize public classes.

Prefer:

```text
package-private
```

for internal implementation.

Expose only what other modules need.

This reduces accidental coupling.

---

# 140 — Domain Purity Rules

The domain module should avoid framework annotations.

Prefer:

```java
public class Order {
}
```

instead of:

```java
@Entity
@Component
@JsonIgnoreProperties
public class Order {
}
```

Framework concerns belong outside the domain.

---

# 141 — Validation Boundaries

There are several validation levels.

## 141.1 Transport Validation

Example:

```text
Required field
String length
JSON format
UUID format
```

Handled by REST/gRPC adapter.

---

## 141.2 Application Validation

Example:

```text
Caller has permission
Target resource exists
Idempotency key valid
Request can be processed
```

Handled by application layer.

---

## 141.3 Domain Validation

Example:

```text
Wallet cannot reserve more than available balance
Cancelled order cannot become completed
Refund cannot exceed captured amount
```

Handled by domain.

---

# 142 — Error Architecture

Errors should flow:

```text
Domain Exception
      ↓
Application Result/Error
      ↓
Adapter Mapping
      ↓
REST/gRPC/Kafka Contract
```

Example:

```text
InsufficientWalletBalanceException
        ↓
WalletApplicationError
        ↓
gRPC FAILED_PRECONDITION
```

or REST:

```text
422 Unprocessable Entity
```

Do not return framework exceptions directly to clients.

---

# 143 — Idempotency Architecture

Idempotency crosses several layers.

Flow:

```text
REST/gRPC Request
      ↓
Idempotency Key
      ↓
Application Use Case
      ↓
Idempotency Port
      ↓
Persistence Adapter
```

Recommended stored fields:

```text
idempotency_key
request_hash
status
response
created_at
expires_at
```

Rules:

- Same key + same request → return prior result.
- Same key + different request → reject.
- State-changing financial operations must be idempotent.

---

# 144 — Outbox Architecture

Use the Transactional Outbox Pattern for reliable event publishing.

Flow:

```text
Application Transaction
      │
      ├── Save Aggregate
      │
      └── Save Outbox Event
             ↓
          COMMIT
             ↓
       Outbox Publisher
             ↓
           Kafka
```

This prevents:

```text
DB commit succeeds
Kafka publish fails
```

from losing the event permanently.

---

# 145 — Inbox / Consumer Idempotency

Consumers must tolerate duplicate delivery.

Flow:

```text
Kafka Event
   ↓
Check event_id
   ↓
Already processed?
   ├── YES → Ignore
   └── NO
        ↓
      Process
        ↓
  Store processed event
```

Possible table:

```text
processed_event
---------------
event_id
consumer_name
processed_at
```

---

# 146 — Use-Case Transaction Pattern

Example:

```text
Command
  ↓
Application Service
  ↓
@Transactional
  ↓
Load Aggregate
  ↓
Execute Domain Behavior
  ↓
Save Aggregate
  ↓
Save Outbox
  ↓
Commit
```

Remote network calls should generally be carefully controlled inside database transactions.

Avoid holding a database transaction open while waiting on slow external systems unless necessary.

---

# 147 — Remote Call Placement

Wrong:

```text
Begin DB transaction
  ↓
Call external provider for 10 seconds
  ↓
Update database
  ↓
Commit
```

Risk:

- Locks remain open.
- Connection pool is consumed.
- Failure behavior is complex.

Prefer separating steps where business semantics allow.

---

# 148 — Application Result Types

Use explicit result types.

Example:

```java
public record CreateOrderResult(
    String orderId,
    String orderNumber,
    String status
) {}
```

Avoid returning:

```text
JPA entity
Controller DTO
Map<String, Object>
```

from application services.

---

# 149 — Mapping Strategy

Typical mappings:

```text
REST DTO
   ↕
Application Command/Result
   ↕
Domain
   ↕
Persistence Entity
```

Kafka:

```text
Domain/Application Event
   ↕
Kafka Event DTO
```

gRPC:

```text
Application Command/Result
   ↕
Protobuf Message
```

Do not reuse one model for every boundary.

---

# 150 — Security Architecture Inside a Service

Security concerns should be separated.

Input adapter:

```text
Token extraction
Authentication context
Endpoint authorization
```

Application:

```text
Business authorization
Ownership checks
```

Domain:

```text
Business invariant
```

Example:

```text
JWT says user_id = 1001
       ↓
Application checks:
Does user 1001 own Order 9001?
```

---

# 151 — Authorization Example

REST controller:

```java
@GetMapping("/{orderId}")
public OrderResponse getOrder(
    @PathVariable String orderId,
    Authentication authentication
) {
    var query = new GetOrderQuery(
        orderId,
        authentication.getName()
    );

    return mapper.toResponse(
        getOrderUseCase.execute(query)
    );
}
```

Application:

```text
Load Order
   ↓
Check ownership / permission
   ↓
Return result
```

---

# 152 — Logging Architecture

Logging should happen primarily at boundaries.

Useful places:

```text
Incoming request
Outgoing request
Use-case start/end where valuable
Failure
Kafka consume/publish
External provider call
```

Do not log:

```text
Passwords
Access tokens
Refresh tokens
Private keys
Full card data
Sensitive secrets
```

---

# 153 — Correlation ID

Every request/event should carry:

```text
correlation_id
```

Optional:

```text
causation_id
trace_id
```

Flow:

```text
Gateway
  ↓ correlation_id
Order Service
  ↓
Payment Service
  ↓
Kafka
  ↓
Notification
```

The same business journey should remain traceable.

---

# 154 — Metrics Boundaries

Adapters and application services may expose technical/business metrics.

Examples:

```text
orders_created_total
wallet_reservations_total
wallet_reservation_failures_total
payment_capture_latency
kafka_consumer_failures_total
```

Domain objects should not directly call Prometheus APIs.

---

# 155 — Testing by Layer

Architecture must make testing easy.

## Domain Tests

Test:

```text
Aggregates
Value Objects
Policies
Invariants
Domain Services
```

No Spring context required.

---

## Application Tests

Test:

```text
Use-case orchestration
Port interactions
Authorization
Idempotency
Transaction behavior
```

Use fake/mock ports.

---

## Adapter Tests

Test:

```text
REST mapping
gRPC mapping
Persistence mapping
Kafka serialization
External API translation
```

---

## Integration Tests

Use real infrastructure where appropriate:

```text
PostgreSQL
Redis
Kafka
```

with Testcontainers.

---

# 156 — Domain Test Example

```java
@Test
void completedOrderCannotBeCancelled() {

    var order = completedOrder();

    assertThrows(
        InvalidOrderStateException.class,
        order::cancel
    );
}
```

No database.

No Spring.

No Kafka.

Fast and deterministic.

---

# 157 — Application Test Example

```java
@Test
void createOrderStoresOrderAndOutboxEvent() {

    var saveOrder = mock(SaveOrderPort.class);
    var outbox = mock(PublishOutboxPort.class);

    var service = new CreateOrderService(
        productPort,
        saveOrder,
        idempotencyPort,
        outbox
    );

    service.create(validCommand());

    verify(saveOrder).save(any(Order.class));
    verify(outbox).save(any(OrderCreated.class));
}
```

---

# 158 — Persistence Integration Test

Test:

```text
Domain
 ↕ mapper
JPA Entity
 ↕
Real PostgreSQL container
```

Validate:

- Column mapping.
- Constraints.
- Index-dependent queries.
- Transactions.
- Migrations.

---

# 159 — Architecture Tests

Use architecture tests to enforce layer boundaries.

Possible tool:

```text
ArchUnit
```

Example rules:

```text
domain must not depend on adapter
domain must not depend on Spring
application must not depend on persistence implementation
REST adapter may depend on application
```

This prevents architecture erosion.

---

# 160 — Example ArchUnit Rules

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

---

# 161 — No Shared Business Entity Rule

Do not create:

```text
platform-common-domain
```

with:

```text
Order
Payment
Wallet
Reward
Mission
```

Each service owns its model.

Shared technical modules may contain:

```text
logging support
OpenTelemetry setup
error envelope helpers
security utilities
test utilities
```

Use shared libraries sparingly.

---

# 162 — API Model vs Domain Model

Example:

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
orders.status_code
```

These representations may differ.

That is acceptable.

---

# 163 — gRPC Model vs Domain Model

Protobuf:

```proto
message ReserveWalletRequest {
  string wallet_id = 1;
  int64 amount_minor = 2;
  string currency = 3;
}
```

Domain:

```text
WalletId
Money
```

Map explicitly.

Do not pass protobuf-generated objects throughout the domain.

---

# 164 — Kafka Model vs Domain Model

Kafka event:

```json
{
  "event_id": "...",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "order_id": "ORD001"
}
```

Domain event may contain richer internal types.

Create a Kafka mapper.

This makes event versioning easier.

---

# 165 — Persistence Model vs Domain Model

Persistence may use:

```text
UUID
VARCHAR
DECIMAL
TIMESTAMP
```

Domain may use:

```text
OrderId
Money
Instant
OrderStatus
```

Mapping is intentional.

---

# 166 — Configuration Properties

Use typed configuration.

Example:

```java
@ConfigurationProperties(prefix = "payment.provider")
public record PaymentProviderProperties(
    URI baseUrl,
    Duration timeout
) {}
```

Avoid reading environment variables directly throughout business code.

---

# 167 — Environment Separation

Application code should remain the same across:

```text
LOCAL
DEV
UAT
PROD
```

Only configuration changes.

Example:

```text
application.yml
application-local.yml
application-dev.yml
application-uat.yml
application-prod.yml
```

Do not create environment-specific business branches.

Bad:

```java
if (env.equals("PROD")) {
   businessRuleA();
} else {
   businessRuleB();
}
```

---

# 168 — Feature Flags

Use feature flags when gradual rollout is required.

Feature flag access should be abstracted.

Example port:

```java
public interface FeatureFlagPort {

    boolean isEnabled(
        String flag,
        String subjectId
    );
}
```

Do not spread vendor-specific feature flag code across the application.

---

# 169 — Time Abstraction

Business logic involving time should not directly call:

```java
Instant.now()
```

everywhere.

Prefer an abstraction:

```java
public interface ClockPort {
    Instant now();
}
```

or Java:

```text
java.time.Clock
```

This makes expiry logic testable.

---

# 170 — ID Generation Abstraction

For testability:

```java
public interface OrderIdGenerator {

    OrderId next();
}
```

Infrastructure may implement UUID/ULID generation.

---

# 171 — Money Rules

Financial logic must use:

```text
BigDecimal
or integer minor units
```

Avoid authoritative calculations with:

```text
double
float
```

Rounding must be explicit.

Example:

```text
HALF_UP
HALF_EVEN
Currency-specific rules
```

The business must define which rule applies.

---

# 172 — Concurrency Boundaries

For operations such as:

```text
Wallet reservation
Points redemption
Inventory reservation
Coupon redemption
```

define concurrency strategy.

Possible mechanisms:

```text
Optimistic locking
Pessimistic locking
Atomic SQL update
Unique constraint
Idempotency constraint
Distributed lock where justified
```

Do not rely only on application-side checks.

---

# 173 — Optimistic Locking

Example persistence field:

```java
@Version
private Long version;
```

Useful when concurrent updates are possible but contention is moderate.

On conflict:

```text
Reload
Re-evaluate rule
Retry carefully
or
Return conflict
```

---

# 174 — Unique Constraint as Business Protection

Some invariants should be protected by database constraints.

Example:

```text
UNIQUE(idempotency_key)
UNIQUE(provider_reference)
UNIQUE(user_id, mission_id, cycle_id)
```

Application checks improve UX.

Database constraints provide final protection.

---

# 175 — Repository Port Granularity

Avoid generic repositories such as:

```java
Repository<T>
```

when domain intent matters.

Prefer:

```java
LoadOrderPort
SaveOrderPort
FindOrderByNumberPort
```

Ports should describe application needs.

---

# 176 — Query Port Granularity

For read-heavy operations, use dedicated query ports.

Example:

```java
public interface OrderHistoryQueryPort {

    Page<OrderHistoryRow> findByCustomer(
        CustomerId customerId,
        PageRequest page
    );
}
```

This avoids loading full aggregates for read-only views.

---

# 177 — CQRS Guidance

CQRS is optional.

Use when:

- Read models differ greatly from write models.
- Query volume is high.
- Event-based projections are useful.
- Complex reporting exists.

Do not introduce separate read/write services only because CQRS exists as a pattern.

Start simple.

---

# 178 — Application Events vs Domain Events

Domain event:

```text
OrderCompleted
```

generated because a domain fact occurred.

Application event:

```text
OrderCompletionProcessed
```

may represent application workflow completion.

Keep terminology clear.

Not every internal application signal needs to become a Kafka event.

---

# 179 — Event Publication Boundary

Recommended:

```text
Domain event
    ↓
Application captures it
    ↓
Outbox
    ↓
Kafka adapter publishes integration event
```

The integration event may differ from the internal domain event.

---

# 180 — Integration Event

An integration event is a public contract.

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "ORDER_COMPLETED",
  "event_version": 1,
  "occurred_at": "...",
  "producer": "order-service",
  "data": {
    "order_id": "ORD001",
    "customer_id": "1001",
    "total": {
      "amount": "12.50",
      "currency": "USD"
    }
  }
}
```

Integration event details belong to PART 05.

---

# 181 — Error Boundary per Adapter

The same application error may be mapped differently.

Example:

```text
OrderNotFound
```

REST:

```text
404 Not Found
```

gRPC:

```text
NOT_FOUND
```

Kafka consumer:

```text
Retry?
DLQ?
Ignore?
```

Adapter owns transport-specific behavior.

---

# 182 — REST Controller Size Rule

A controller method should usually perform:

```text
Validate transport input
Map request
Call use case
Map result
Return response
```

If a controller is hundreds of lines long, business logic is likely misplaced.

---

# 183 — Application Service Size Rule

A use case should coordinate one business intention.

If one service handles:

```text
Create order
Cancel order
Refund payment
Earn points
Send notification
```

the boundary is wrong.

Split by use case.

---

# 184 — Domain Aggregate Size Rule

If loading one aggregate requires:

```text
hundreds of child records
multiple unrelated tables
several external services
```

the aggregate is probably too large.

Revisit boundaries.

---

# 185 — External Dependency Isolation

Every external system should have a port.

Examples:

```text
PaymentProviderPort
SmsProviderPort
EmailProviderPort
LegacyOrderPort
TopUpProviderPort
ObjectStoragePort
```

This allows:

- Mocking.
- Replacement.
- Testing.
- Provider migration.
- Failure simulation.

---

# 186 — Provider Adapter Example

```text
PaymentProviderPort
   ├── AcledaPaymentAdapter
   ├── AbaPaymentAdapter
   └── MockPaymentAdapter
```

Application does not care which provider implementation is active.

---

# 187 — Resilience Placement

Timeout, retry, and circuit-breaker logic belongs near the outbound adapter boundary.

Example:

```text
Application
   ↓
PaymentProviderPort
   ↓
ResilientPaymentProviderAdapter
   ↓
Provider API
```

Business fallback policy may be decided in application/domain.

Technical retry is adapter/infrastructure behavior.

---

# 188 — Cache Placement

Cache is an optimization.

The application should not treat Redis as authoritative unless explicitly designed.

Example:

```text
Catalog Query
   ↓
Cache Port
   ├── HIT → return
   └── MISS
        ↓
      DB Port
        ↓
      Cache result
```

Cache failure should often degrade to database access.

---

# 189 — Distributed Lock Guidance

Use distributed locks only when simpler mechanisms are insufficient.

Prefer first:

```text
Unique constraints
Atomic updates
Optimistic locking
Database transactions
Idempotency
```

Use Redis/distributed lock only with clear ownership and timeout behavior.

---

# 190 — Clean Architecture for Wallet Service

Recommended internal structure:

```text
wallet-service/
│
├── domain/
│   ├── WalletAccount
│   ├── WalletReservation
│   ├── Money
│   ├── WalletLedgerEntry
│   ├── WalletPolicy
│   └── events/
│
├── application/
│   ├── ReserveWalletFundsUseCase
│   ├── CaptureWalletFundsUseCase
│   ├── ReleaseWalletFundsUseCase
│   ├── TopUpWalletUseCase
│   ├── RefundWalletUseCase
│   └── ReconcileWalletUseCase
│
├── adapter/in/
│   ├── grpc/
│   ├── rest/
│   └── kafka/
│
└── adapter/out/
    ├── persistence/
    ├── kafka/
    └── external/
```

---

# 191 — Clean Architecture for Order Service

```text
order-service/
│
├── domain/
│   ├── Order
│   ├── OrderItem
│   ├── OrderStatus
│   ├── Money
│   └── events/
│
├── application/
│   ├── CreateOrder
│   ├── CancelOrder
│   ├── AcceptOrder
│   ├── CompleteOrder
│   └── GetOrder
│
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   └── kafka/
│
└── adapter/out/
    ├── persistence/
    ├── catalog/
    ├── inventory/
    ├── payment/
    └── kafka/
```

---

# 192 — Clean Architecture for Loyalty Service

```text
loyalty-service/
│
├── domain/
│   ├── PointsAccount
│   ├── PointsLedgerEntry
│   ├── MembershipTier
│   ├── EarnPolicy
│   ├── RedeemPolicy
│   └── events/
│
├── application/
│   ├── EarnPoints
│   ├── RedeemPoints
│   ├── ExpirePoints
│   └── EvaluateTier
│
├── adapter/in/
│   ├── rest/
│   └── kafka/
│
└── adapter/out/
    ├── persistence/
    └── kafka/
```

---

# 193 — Clean Architecture for Mission Service

```text
mission-service/
│
├── domain/
│   ├── Mission
│   ├── MissionCondition
│   ├── MissionProgress
│   ├── MissionPeriod
│   └── events/
│
├── application/
│   ├── EvaluateMissionEvent
│   ├── UpdateMissionProgress
│   ├── CompleteMission
│   └── AssignMissionReward
│
├── adapter/in/
│   ├── rest/
│   └── kafka/
│
└── adapter/out/
    ├── persistence/
    ├── loyalty/
    └── kafka/
```

---

# 194 — Common Technical Modules

A service may include technical modules:

```text
security
observability
serialization
migration
health
```

These should remain separate from business logic.

---

# 195 — Database Migration Location

Recommended:

```text
src/main/resources/db/migration/
```

Example:

```text
V1__create_orders.sql
V2__create_order_items.sql
V3__add_idempotency.sql
V4__create_outbox.sql
```

Flyway details are covered later.

---

# 196 — Configuration Example

```yaml
spring:
  application:
    name: order-service

  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  kafka:
    bootstrap-servers: ${KAFKA_BROKERS}

management:
  endpoints:
    web:
      exposure:
        include:
          - health
          - prometheus
```

Secrets must not be committed.

---

# 197 — Health Endpoints

Infrastructure may expose:

```text
/actuator/health
/actuator/health/liveness
/actuator/health/readiness
```

Health endpoints are infrastructure concerns.

They must not leak into domain code.

---

# 198 — Service Startup

Startup sequence should be predictable:

```text
Load configuration
      ↓
Initialize infrastructure clients
      ↓
Validate migrations
      ↓
Start application
      ↓
Expose readiness only when ready
```

---

# 199 — Graceful Shutdown

Services should stop safely.

Recommended behavior:

```text
Stop accepting new traffic
      ↓
Finish in-flight work
      ↓
Stop Kafka polling
      ↓
Commit/finish safe work
      ↓
Close DB connections
      ↓
Exit
```

---

# 200 — Architecture Decision: Framework Independence

Spring Boot is the chosen delivery framework.

However:

```text
Spring Boot is not the domain architecture.
```

Core business logic should remain testable without starting Spring.

This improves:

- Test speed.
- Maintainability.
- Upgrade flexibility.
- Architectural clarity.

---

# 201 — Architecture Decision: No Direct Cross-Service Repository

Forbidden:

```java
@Autowired
PaymentRepository paymentRepository;
```

inside:

```text
order-service
```

if the repository belongs to another service database.

Use:

```text
PaymentPort
```

instead.

---

# 202 — Architecture Decision: No Framework DTO Reuse

Do not reuse:

```text
REST Request
```

as:

```text
Domain Entity
Kafka Event
Database Entity
```

Each boundary has its own model.

---

# 203 — Architecture Decision: Explicit Ports

External dependencies should be visible from the application layer.

Examples:

```text
LoadOrderPort
SaveOrderPort
PaymentPort
WalletPort
PublishEventPort
ClockPort
IdGeneratorPort
```

This makes the service dependency graph explicit.

---

# 204 — Architecture Decision: Business Logic Near Domain

Prefer:

```text
order.cancel()
wallet.reserve()
pointsAccount.redeem()
```

over:

```text
OrderServiceUtil.updateStatus(...)
WalletHelper.changeBalance(...)
PointsManager.doCalculation(...)
```

---

# 205 — Architecture Decision: Thin Adapters

Adapters should translate and delegate.

They should not become the place where the whole business workflow lives.

---

# 206 — Architecture Decision: Explicit Mapping

Use mappers between:

```text
Transport
Application
Domain
Persistence
Integration Event
```

Automatic mapping libraries may be used carefully, but important transformations should remain understandable.

---

# 207 — Architecture Decision: Transaction at Use-Case Boundary

Typical command use case:

```text
@Transactional
```

at application service level.

Avoid placing transaction annotations throughout domain classes.

---

# 208 — Architecture Decision: Immutable Events

Domain/integration events should be immutable.

Example:

```java
public record OrderCompletedEvent(
    UUID eventId,
    String orderId,
    Instant occurredAt
) {}
```

Do not modify an event after publication.

---

# 209 — Architecture Decision: UTC Internally

Store technical timestamps in UTC unless a business rule explicitly requires a local-time semantic.

Example:

```text
occurred_at = UTC
```

For business opening hours or campaign periods, preserve required timezone semantics explicitly.

---

# 210 — Architecture Decision: Explicit Currency

Never represent money without currency.

Bad:

```text
amount = 12.50
```

Better:

```text
amount = 12.50
currency = USD
```

---

# 211 — Architecture Decision: No Silent Defaults for Critical Data

For financial/business-critical fields, avoid silently substituting defaults.

Bad:

```text
missing currency → USD automatically
```

unless the business contract explicitly defines that behavior.

---

# 212 — Architecture Decision: Deterministic Domain Tests

Domain tests should not depend on:

```text
Real clock
Random external state
Network
Database
Kafka
```

Inject time/randomness policies where needed.

---

# 213 — Architecture Decision: Randomness as a Port or Policy

For reward selection requiring controlled randomness:

```text
RewardSelectionPolicy
      ↓
RandomSource
```

This makes behavior testable.

Example:

```java
public interface RandomSource {
    int nextInt(int min, int max);
}
```

---

# 214 — Architecture Decision: Audit-Critical Changes

For domains such as:

```text
Wallet
Payment
Loyalty
Promotion redemption
```

state changes must be traceable.

Capture:

```text
reference_id
correlation_id
actor
timestamp
previous state
new state
reason
```

as appropriate.

---

# 215 — Architecture Decision: Domain First, Infrastructure Second

Implementation sequence inside a service:

```text
1. Model domain
2. Write domain tests
3. Define use cases
4. Define ports
5. Implement application services
6. Add persistence adapter
7. Add REST/gRPC adapter
8. Add Kafka adapter
9. Add integration tests
10. Add deployment configuration
```

This reduces framework-driven design.

---

# 216 — Example Complete Request Flow

Create order:

```text
HTTP POST /api/v1/orders
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

# 217 — Example Complete gRPC Flow

Wallet reservation:

```text
Order Service
    ↓ gRPC
WalletGrpcService
    ↓
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

# 218 — Example Complete Kafka Consumer Flow

```text
Kafka
  ↓
OrderCompletedEvent
  ↓
Loyalty Kafka Adapter
  ↓
Check consumer idempotency
  ↓
EarnPointsCommand
  ↓
EarnPointsUseCase
  ↓
PointsAccount.earn()
  ↓
Save Points
  ↓
Save Outbox Event
  ↓
Commit
```

---

# 219 — Example External Provider Flow

```text
Payment Use Case
      ↓
PaymentProviderPort
      ↓
Provider Adapter
      ↓
Timeout / Retry / Circuit Breaker
      ↓
External Payment API
      ↓
Provider Response
      ↓
Anti-Corruption Mapping
      ↓
Application Result
```

---

# 220 — Code Review Rules

Reviewers should check:

## Domain

- [ ] Business rule is in correct layer.
- [ ] Invariants cannot be bypassed.
- [ ] No infrastructure dependencies.
- [ ] Domain terminology is correct.

## Application

- [ ] Use case has one clear responsibility.
- [ ] Ports are explicit.
- [ ] Transaction boundary is correct.
- [ ] Authorization is enforced.
- [ ] Idempotency is handled where required.

## Adapters

- [ ] DTO mapping is explicit.
- [ ] Infrastructure errors are translated.
- [ ] Timeouts exist.
- [ ] Retry is safe.
- [ ] Logging excludes sensitive data.

## Persistence

- [ ] Service only accesses owned database.
- [ ] Constraints support important invariants.
- [ ] Migrations exist.
- [ ] Indexes support required queries.

---

# 221 — Architecture Smell Checklist

Warning signs:

```text
Controller contains SQL.
Domain imports Spring.
JPA entities are API responses.
Kafka payload is reused as domain model.
One service reads another service's tables.
Use case contains hundreds of lines.
Service has circular dependency.
Business rules exist only in controller.
Shared "common" module owns business entities.
External provider status codes appear everywhere.
```

Any of these should trigger architectural review.

---

# 222 — Definition of Done for a New Use Case

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
- [ ] Documentation is updated.

---

# 223 — Common Service Bootstrap Checklist

For each new service:

```text
[ ] Spring Boot project
[ ] Java version standardized
[ ] Maven/Gradle standardized
[ ] Package architecture created
[ ] Domain module/layer created
[ ] Application ports created
[ ] REST/gRPC/Kafka adapters as needed
[ ] PostgreSQL adapter
[ ] Flyway
[ ] Health endpoints
[ ] Structured logging
[ ] OpenTelemetry
[ ] Error handling
[ ] Security baseline
[ ] Testcontainers
[ ] Dockerfile
[ ] CI pipeline
[ ] README
```

---

# 224 — PART 04 Deliverables

PART 04 produces:

1. Clean/Hexagonal architecture standard.
2. Dependency rule.
3. Domain layer rules.
4. Application layer rules.
5. Input port rules.
6. Output port rules.
7. REST adapter rules.
8. gRPC adapter rules.
9. Kafka adapter rules.
10. Persistence adapter rules.
11. Redis adapter rules.
12. External integration adapter rules.
13. Configuration rules.
14. Common service package template.
15. Validation architecture.
16. Error architecture.
17. Idempotency architecture.
18. Outbox architecture.
19. Consumer inbox/idempotency architecture.
20. Transaction boundary rules.
21. Security boundary rules.
22. Logging/metrics rules.
23. Layered testing strategy.
24. Architecture testing rules.
25. Mapping rules.
26. Financial/concurrency standards.
27. Service bootstrap checklist.
28. Code review checklist.
29. Architecture smell checklist.
30. Definition of done.

---

# 225 — Exit Criteria

PART 04 is complete when the team can answer:

### Domain

```text
Where does business logic live?
```

Answer:

```text
Domain
```

### Use Cases

```text
Where is workflow orchestration implemented?
```

Answer:

```text
Application layer
```

### Dependencies

```text
How does application code access infrastructure?
```

Answer:

```text
Through output ports
```

### REST / gRPC / Kafka

```text
Where are transport-specific models located?
```

Answer:

```text
Adapters
```

### Persistence

```text
Does the domain depend on JPA?
```

Answer:

```text
No
```

### Events

```text
Does the domain publish directly to Kafka?
```

Answer:

```text
No
```

### Database

```text
Can one service use another service's repository?
```

Answer:

```text
No
```

### Testing

```text
Can domain logic be tested without Spring?
```

Answer:

```text
Yes
```

### Contracts

```text
Are transport contracts separated from internal models?
```

Answer:

```text
Yes
```

If these answers are not true, the architecture does not yet meet the standard.

---

# 226 — Handoff to PART 05

PART 05 defines all contracts between clients and services.

```text
PART 04
Internal Service Architecture
        ↓
Input Ports
Output Ports
Adapters
        ↓
PART 05
Contracts
```

PART 05 will define:

```text
Public REST Contracts
Internal gRPC Contracts
Protobuf Standards
Kafka Event Contracts
Command Contracts
Query Contracts
Error Contract
Pagination Contract
Authentication Contract
Correlation / Trace Contract
Idempotency Contract
Versioning Strategy
Backward Compatibility
```

---

# PART 04 — Summary

The core architecture is:

```text
                INPUT ADAPTERS
       REST / gRPC / Kafka / Scheduler
                     │
                     ▼
                INPUT PORTS
                     │
                     ▼
             APPLICATION LAYER
              Use Cases / Flow
                     │
                     ▼
                 DOMAIN
       Aggregates / Rules / Invariants
                     │
                     ▼
               OUTPUT PORTS
                     │
                     ▼
               OUTPUT ADAPTERS
 PostgreSQL / Redis / Kafka / External APIs
```

The most important dependency rule is:

```text
Infrastructure depends on business logic.

Business logic does not depend on infrastructure.
```

And the practical implementation rule is:

```text
Domain first
   ↓
Application
   ↓
Ports
   ↓
Adapters
   ↓
Infrastructure
```

This architecture provides the foundation for:

```text
REST APIs
gRPC
Kafka
PostgreSQL
Redis
Security
Testing
Docker
Kubernetes
CI/CD
Observability
Production operations
```

without allowing infrastructure choices to control the core business model.

---

**End of PART 04 — Clean + Hexagonal Architecture**
