---
title: "Software Design & Architecture Patterns Roadmap"
description: "Comprehensive catalog of architectural, distributed systems, DDD, resilience, and microservices patterns."
---

# Software Design & Architecture Patterns

A broad map of major software patterns used across backend, frontend, architecture, DDD, distributed systems, DevOps, and enterprise software.

> This is not literally every pattern ever invented, but it covers the major patterns you are likely to encounter in modern software development.

## 1. Architectural Patterns

- Layered Architecture
- Clean Architecture
- Hexagonal Architecture / Ports and Adapters
- Onion Architecture
- Modular Monolith
- Microservices
- Service-Oriented Architecture / SOA
- Event-Driven Architecture
- Event Sourcing
- CQRS
- Vertical Slice Architecture
- Pipe and Filter
- Broker Architecture
- Microkernel / Plugin Architecture
- Space-Based Architecture
- Serverless Architecture
- Peer-to-Peer Architecture
- Client-Server Architecture
- Three-Tier Architecture
- N-Tier Architecture
- Blackboard Architecture
- Component-Based Architecture
- Message-Driven Architecture
- Shared-Nothing Architecture
- Backend-for-Frontend / BFF
- API Gateway
- Strangler Fig
- Cell-Based Architecture

## 2. Presentation / UI Patterns

- MVC
- MVP
- MVVM
- MVI
- PAC / Presentation-Abstraction-Control
- Front Controller
- Page Controller
- Template View
- Transform View
- Two-Step View
- Application Controller
- Supervising Controller
- Passive View
- Presentation Model

## 3. GoF Creational Patterns

- Singleton
- Factory Method
- Abstract Factory
- Builder
- Prototype
- Object Pool
- Lazy Initialization

## 4. GoF Structural Patterns

- Adapter
- Bridge
- Composite
- Decorator
- Facade
- Flyweight
- Proxy

## 5. GoF Behavioral Patterns

- Chain of Responsibility
- Command
- Interpreter
- Iterator
- Mediator
- Memento
- Observer
- State
- Strategy
- Template Method
- Visitor

## 6. DDD Patterns

- Entity
- Value Object
- Aggregate
- Aggregate Root
- Repository
- Domain Service
- Application Service
- Domain Event
- Domain Factory
- Specification
- Module
- Bounded Context
- Ubiquitous Language
- Context Map
- Shared Kernel
- Customer/Supplier
- Conformist
- Anticorruption Layer
- Open Host Service
- Published Language
- Separate Ways
- Partnership

## 7. Application / Service-Layer Patterns

- Service Layer
- Use Case / Interactor
- Repository
- Unit of Work
- Data Mapper
- DTO
- Command Handler
- Query Handler
- Mediator
- Dependency Injection
- Dependency Inversion
- Policy Pattern
- Specification Pattern
- Result Pattern
- Request/Response Pattern

## 8. Persistence / Data-Access Patterns

- Active Record
- Data Mapper
- Table Data Gateway
- Row Data Gateway
- Repository
- Unit of Work
- Identity Map
- Lazy Load
- Eager Load
- Query Object
- Metadata Mapping
- Serialized LOB
- Single Table Inheritance
- Class Table Inheritance
- Concrete Table Inheritance
- Optimistic Offline Lock
- Pessimistic Offline Lock
- Coarse-Grained Lock
- Implicit Lock

## 9. Database Patterns

- Database per Service
- Shared Database
- CQRS Read Model
- Materialized View
- Sharding
- Partitioning
- Replication
- Leader-Follower
- Multi-Leader
- Read Replica
- Cache-Aside
- Write-Through Cache
- Write-Behind Cache
- Read-Through Cache
- Transactional Outbox
- Inbox Pattern
- Change Data Capture
- Event Store
- Soft Delete
- Audit Log
- Temporal Table

## 10. Distributed-System Patterns

- Saga
- Orchestration
- Choreography
- Transactional Outbox
- Inbox
- Idempotent Consumer
- Idempotency Key
- Retry
- Timeout
- Circuit Breaker
- Bulkhead
- Rate Limiter
- Throttling
- Backpressure
- Leader Election
- Distributed Lock
- Consistent Hashing
- Gossip Protocol
- Quorum
- Request Hedging
- Scatter-Gather
- Fan-Out/Fan-In
- Sidecar
- Ambassador
- Anti-Corruption Layer
- Service Discovery
- Gateway Routing
- Gateway Aggregation
- Gateway Offloading

## 11. Messaging Patterns

- Publish/Subscribe
- Point-to-Point
- Competing Consumers
- Message Queue
- Event Bus
- Message Broker
- Request/Reply
- Correlation Identifier
- Message Router
- Content-Based Router
- Message Filter
- Message Translator
- Message Aggregator
- Splitter
- Resequencer
- Dead Letter Queue
- Retry Queue
- Poison Message
- Claim Check
- Idempotent Receiver
- Guaranteed Delivery
- Durable Subscriber

## 12. Microservices Patterns

- API Gateway
- Backend for Frontend
- Database per Service
- Saga
- CQRS
- Event Sourcing
- Service Registry
- Client-Side Discovery
- Server-Side Discovery
- Externalized Configuration
- Circuit Breaker
- Bulkhead
- Sidecar
- Strangler Fig
- Branch by Abstraction
- Consumer-Driven Contract
- Service Mesh
- Health Check API
- Log Aggregation
- Distributed Tracing

## 13. Resilience Patterns

- Retry
- Timeout
- Circuit Breaker
- Bulkhead
- Fallback
- Fail Fast
- Graceful Degradation
- Rate Limiting
- Load Shedding
- Backpressure
- Health Check
- Heartbeat
- Watchdog
- Dead Letter Queue
- Idempotency
- Request Deduplication

## 14. Concurrency Patterns

- Thread Pool
- Worker Pool
- Producer-Consumer
- Future/Promise
- Reactor
- Proactor
- Actor Model
- Monitor
- Mutex
- Semaphore
- Read-Write Lock
- Double-Checked Locking
- Immutable Object
- Thread-Local Storage
- Active Object
- Guarded Suspension
- Balking
- Scheduler

## 15. Integration Patterns

- Adapter
- Facade
- Gateway
- Anti-Corruption Layer
- Service Adapter
- Message Translator
- Canonical Data Model
- Enterprise Service Bus
- API Gateway
- Webhook
- Polling Consumer
- Event Notification
- Event-Carried State Transfer

## 16. API Patterns

- REST
- RPC
- gRPC
- GraphQL
- JSON-RPC
- HATEOAS
- API Gateway
- BFF
- API Composition
- Pagination
- Cursor Pagination
- Filtering
- Versioning
- Idempotency Key
- Request Validation
- Problem Details
- Rate Limiting

## 17. Security Patterns

- Authentication Gateway
- Authorization
- RBAC
- ABAC
- PBAC
- Least Privilege
- Zero Trust
- Token-Based Authentication
- Session-Based Authentication
- OAuth 2.0
- OpenID Connect
- JWT
- API Key
- Refresh Token
- Secrets Management
- Secure Proxy
- Security Filter
- Audit Trail

## 18. Caching Patterns

- Cache-Aside
- Read-Through
- Write-Through
- Write-Behind
- Refresh-Ahead
- TTL Cache
- LRU
- LFU
- Distributed Cache
- Cache Stampede Prevention
- Cache Locking
- Negative Caching

## 19. Testing Patterns

- Arrange-Act-Assert
- Given-When-Then
- Test Double
- Mock
- Stub
- Fake
- Spy
- Dummy
- Object Mother
- Test Data Builder
- Fixture
- Golden Master
- Contract Testing
- Consumer-Driven Contract
- Test Pyramid
- Testing Trophy
- Property-Based Testing

## 20. Refactoring / Design Patterns

- Extract Method
- Replace Conditional with Polymorphism
- Introduce Parameter Object
- Encapsulate Collection
- Null Object
- Special Case
- Guard Clause
- Tell, Don't Ask
- Law of Demeter
- Composition over Inheritance
- Dependency Injection
- Dependency Inversion

## 21. Functional-Programming Patterns

- Pure Function
- Immutability
- Function Composition
- Higher-Order Function
- Monad
- Functor
- Option/Maybe
- Either
- Result
- Railway-Oriented Programming
- Currying
- Partial Application

## 22. DevOps / Deployment Patterns

- Blue-Green Deployment
- Canary Deployment
- Rolling Deployment
- Recreate Deployment
- Feature Flags
- Dark Launch
- Shadow Deployment
- Immutable Infrastructure
- Infrastructure as Code
- GitOps
- Configuration as Code
- Containerization
- Sidecar
- Init Container
- Operator Pattern
- Self-Healing

## 23. Cloud Patterns

- Auto Scaling
- Multi-AZ
- Multi-Region
- Active-Active
- Active-Passive
- Queue-Based Load Leveling
- Priority Queue
- Static Content Hosting
- CDN
- Federated Identity
- Valet Key
- Gatekeeper
- Compensating Transaction
- Scheduler Agent Supervisor

## 24. Frontend / State-Management Patterns

- Flux
- Redux
- MVVM
- MVC
- MVP
- MVI
- Observer
- State
- Container/Presentational Components
- Smart/Dumb Components
- Hooks
- Provider
- Compound Components
- Render Props
- Higher-Order Components

## 25. Useful Principles That Are Not Strictly Patterns

- SOLID
- DRY
- KISS
- YAGNI
- Separation of Concerns
- High Cohesion
- Low Coupling
- Composition over Inheritance
- Dependency Inversion
- Law of Demeter
- Convention over Configuration
- Fail Fast
- Principle of Least Astonishment

# Recommended Learning Order for PHP/Laravel + Backend + DevOps

You do **not** need to master everything at once.

```text
MVC
↓
SOLID
↓
Layered Architecture
↓
Service Layer
↓
Repository Pattern
↓
Strategy / Factory / Adapter
↓
Clean / Hexagonal Architecture
↓
DDD
↓
Modular Monolith
↓
Vertical Slice Architecture
↓
Domain Events
↓
CQRS
↓
Event-Driven Architecture
↓
Transactional Outbox
↓
Idempotency
↓
Circuit Breaker
↓
Saga
↓
Microservices
```

## Recommended Combination for a Serious Laravel Backend

```text
Laravel
+
MVC for the HTTP layer
+
SOLID
+
Clean / Hexagonal Architecture
+
DDD for complex business rules
+
Modular Monolith
+
Vertical Slice Architecture
+
Repository Pattern
+
Strategy Pattern
+
Factory Pattern
+
Adapter Pattern
+
Domain Events
```

Later, when the system genuinely needs distributed services:

```text
Microservices
+
Event-Driven Architecture
+
Transactional Outbox
+
Saga
+
CQRS where useful
```
