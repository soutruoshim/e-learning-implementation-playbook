---
title: "PHASE 23 — Local Development Environment"
---

# PHASE 23 — Local Development Environment

> **Purpose:** Turn the microservices architecture into a safe, reproducible, fast daily engineering workflow. This phase standardizes developer workstation requirements, Windows/WSL guidance, Git/GitLab authentication, Java/IDE setup, repository layout, Docker Compose dependency profiles, local PostgreSQL/Kafka/Redis, configuration and secrets, migrations and seed/reset flows, mock providers, debugging/hot reload, local observability, Testcontainers, API fixtures, authentication, branch isolation, doctor scripts, failure scenarios, mobile/frontend connectivity, contract generation, local image verification, troubleshooting, onboarding, and continuous developer-experience improvement.
>
> **Previous Phase:** Phase 22 — Docker
>
> **Next Phase:** Phase 24 — Environment Strategy
>
> **Primary Architecture Basis:** PART 27 — Local Development Environment.
>
> **Primary Stack:** Java, Spring Boot, Docker, Docker Compose, PostgreSQL, Kafka, Redis, Git, GitLab, Testcontainers, IntelliJ IDEA or equivalent.
>
> **Status:** Developer Experience / Platform Engineering Implementation Specification

---

# 1. Phase 23 Goal

A developer should be able to perform:

```text
clone
configure
start
develop
test
debug
reset
```

with minimal manual setup.

The environment must be:

```text
repeatable
documented
safe
fast
isolated
production-like where it matters
easy to reset
```

---

# 2. Core Developer Experience Principle

A developer should not need to manually install:

```text
PostgreSQL
Kafka
Redis
Schema Registry
mock provider infrastructure
```

directly on the host when containers can provide them reliably.

Host installation should focus on:

```text
JDK
Git
IDE
Docker
build tooling only when wrappers do not cover it
```

---

# 3. Recommended Daily Runtime Model

```text
Java Service on Host / IDE
      ↓
Dockerized Local Dependencies
      ├── PostgreSQL
      ├── Kafka
      ├── Redis
      ├── Schema Registry
      └── Mock Providers
```

This is the preferred edit-run-debug workflow.

---

# 4. Automated Integration Test Model

Automated integration tests use:

```text
Testcontainers
```

rather than relying on shared mutable Compose infrastructure.

---

# 5. Developer Workstation Minimum

Required:

```text
Git
Java LTS
Docker Engine / Docker Desktop
IDE
GitLab access
SSH or PAT credentials
```

Recommended hardware from the source:

```text
16 GB RAM minimum
32 GB preferred for multi-service work
SSD
modern multi-core CPU
```

---

# 6. Supported Operating Systems

Document tested support for:

```text
Windows 11
macOS
Linux
```

---

# 7. Windows 11 Standard

Recommended:

```text
Windows 11
Docker Desktop or equivalent
WSL2 recommended
Git for Windows
IntelliJ IDEA
```

Avoid mixing too many path/runtime models.

---

# 8. WSL2

Useful for:

```text
Linux-compatible shell
Docker integration
Unix tooling
filesystem behavior closer to production
```

---

# 9. Windows Repository Location

For large container-bind-mounted projects, the:

```text
WSL filesystem
```

may perform better than mounted Windows directories.

If the team uses paths such as:

```text
C:\xampp\htdocs\...
```

Docker bind-mount performance should be measured before standardization.

---

# 10. Line Ending Standard

Repository source should use:

```text
LF
```

for Linux-compatible scripts/configuration.

---

# 11. .gitattributes

Recommended baseline:

```text
* text=auto
*.sh text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
Dockerfile text eol=lf
```

---

# 12. Git Version

Use the organization-supported Git version.

Avoid materially different team behavior caused by inconsistent Git/credential tooling.

---

# 13. Git Authentication

Use:

```text
SSH
```

or:

```text
Personal Access Token
```

according to GitLab policy.

---

# 14. SSH Development Flow

Typical:

```text
generate key
add public key to GitLab
ssh -T git@gitlab.com
```

Remote:

```text
git@gitlab.com:group/project.git
```

---

# 15. PAT Development Flow

HTTPS token scopes may include:

```text
read_repository
write_repository
```

when required.

Store credentials through:

```text
Git Credential Manager
```

rather than plaintext files.

---

# 16. Git "Project Not Found" Troubleshooting

Check:

```text
remote URL
GitLab namespace
project existence
membership
SSH/PAT identity
```

before repeatedly regenerating credentials.

---

# 17. Java Standard

All developers use the same project-supported Java LTS major.

Architecture example:

```text
Java 21
```

Final exact version follows organization policy.

---

# 18. Java Verification

Run:

```bash
java -version
./gradlew -version
```

or Maven equivalent.

---

# 19. Java Toolchain

Declare Java version through Gradle/Maven toolchain.

Do not rely only on each developer's global setup.

---

# 20. JAVA_HOME

IDE and command line should resolve compatible project JDK.

---

# 21. Build Wrapper

Repository should provide:

```text
gradlew
gradlew.bat
```

or:

```text
mvnw
mvnw.cmd
```

Developers should not require globally identical Gradle/Maven installations.

---

# 22. IDE

Recommended:

```text
IntelliJ IDEA
```

Equivalent IDEs are allowed if the workflow remains compatible.

---

# 23. IDE Import

Import using:

```text
Gradle/Maven model
```

not manual source-folder configuration.

---

# 24. IDE JDK

Project SDK must match the repository toolchain.

---

# 25. Annotation Processing

Enable where needed for:

```text
Lombok
MapStruct
```

---

# 26. Formatting

Formatting should be standardized using:

```text
Spotless
Checkstyle
EditorConfig
```

rather than personal IDE preferences.

---

# 27. .editorconfig

Define:

```text
indentation
line endings
charset
final newline
```

---

# 28. Format Command

Example:

```bash
./gradlew spotlessApply
```

---

# 29. Local Pre-Commit

May run:

```text
format
lint
small unit tests
secret scan
migration duplicate check
```

It should not duplicate an entire long CI pipeline.

---

# 30. Repository Strategy

Architecture supports:

```text
multi-repo
or
monorepo
```

Service boundaries must remain independent of repository layout.

---

# 31. Multi-Repo Example

```text
api-gateway/
identity-service/
catalog-service/
order-service/
payment-service/
wallet-service/
loyalty-service/
notification-service/
integration-service/
platform-local/
```

---

# 32. Monorepo Example

```text
platform/
├── services/
│   ├── identity/
│   ├── catalog/
│   ├── order/
│   └── ...
├── contracts/
├── platform/
├── docker/
└── docs/
```

---

# 33. Shared Local Infrastructure Folder

May contain:

```text
docker-compose.yml
Kafka setup
Redis
PostgreSQL utilities
mock providers
local observability
```

---

# 34. Minimum Service Repository Files

Recommended:

```text
README.md
Dockerfile
.dockerignore
.env.example
build.gradle / pom.xml
src/
docs/
docker-compose.override.yml  (optional)
```

---

# 35. Service README

Must explain:

```text
service purpose
port
dependencies
environment variables
run command
test command
reset command
common failures
```

---

# 36. Local Development Modes

Support:

```text
Mode A:
service on host + dependencies in Docker

Mode B:
service + dependencies in Compose

Mode C:
multiple services in Compose
```

---

# 37. Recommended Daily Mode

For active Java development:

```text
service runs in IDE/Gradle on host
dependencies run in Docker
```

Benefits:

```text
fast restart
easy debugger
hot reload
less image rebuild
```

---

# 38. Full Container Mode

Use for:

```text
container verification
cross-service behavior
environment parity
```

It is not necessarily the best edit-run cycle.

---

# 39. Local Runtime Topology

```text
Developer
   │
   ▼
Service localhost:808x
   │
   ├── PostgreSQL container
   ├── Redis container
   ├── Kafka container
   ├── Schema Registry container
   └── Mock Provider container
```

---

# 40. Local Port Registry

Maintain one documented shared port catalog.

Source example:

```text
Gateway           8080
Identity          8081
Catalog           8082
Order             8083
Payment           8084
Wallet            8085
Loyalty           8086
Notification      8087
Integration       8088

PostgreSQL        5432
Redis             6379
Kafka             9092
Schema Registry   configurable to avoid collision
```

Actual assigned ports must avoid conflicts.

---

# 41. Port Registry Rule

Do not let every developer invent service ports.

Maintain:

```text
docs/local-ports.md
```

---

# 42. Port Override

Every port should be overridable.

Example:

```text
ORDER_SERVER_PORT=18083
```

---

# 43. Docker Compose Profiles

Recommended:

```text
infra
messaging
observability
mocks
full
```

---

# 44. infra Profile

Contains:

```text
PostgreSQL
Redis
```

---

# 45. messaging Profile

Contains:

```text
Kafka
Schema Registry
optional Kafka UI
```

---

# 46. observability Profile

Contains optional:

```text
Prometheus
Grafana
Loki
Tempo / Jaeger
```

---

# 47. mocks Profile

Contains:

```text
WireMock
MockServer
fake SMTP
fake provider endpoints
```

---

# 48. full Profile

Used only when broad multi-service integration is needed.

---

# 49. Compose Start

Example:

```bash
docker compose --profile infra --profile messaging up -d
```

---

# 50. Compose Stop

```bash
docker compose down
```

---

# 51. Compose Reset

Destructive:

```bash
docker compose down -v
```

Wrapper must clearly communicate destructive intent.

---

# 52. Local PostgreSQL

Use the same major version as the target environment.

---

# 53. PostgreSQL Compose Configuration

Define:

```text
database
user
password
port
volume
healthcheck
```

using local-only credentials.

---

# 54. Database-Per-Service Locally

Domain ownership still applies.

For local development it is acceptable to use:

```text
one PostgreSQL instance
+
multiple service databases
```

---

# 55. Example Local Databases

```text
identity_db
customer_db
catalog_db
inventory_db
cart_db
order_db
payment_db
wallet_db
loyalty_db
promotion_db
mission_db
notification_db
integration_db
```

---

# 56. Separate Local Users

Prefer:

```text
identity_user
order_user
wallet_user
...
```

to reveal accidental cross-service database access.

---

# 57. Cross-Service DB Protection

Even locally:

```text
Order must not be able to query wallet_db
```

---

# 58. Local Flyway

Each service applies its migrations to its own local database.

---

# 59. Clean Migration Reset

```text
drop/recreate local DB
run Flyway
seed development data
```

---

# 60. Migration History Discipline

Once a migration is shared/merged:

```text
create a new migration
```

rather than casually rewriting historical migrations.

---

# 61. Seed Data Separation

Separate:

```text
schema migration
```

from:

```text
development seed
```

---

# 62. Seed Data Examples

```text
test stores
test products
test customer
test admin
test missions
test promotions
test rewards
```

---

# 63. Seed Idempotency

Seed command should either:

```text
be safe to rerun
```

or clearly require reset first.

---

# 64. Seed Versioning

When reference scenarios change materially, version the seed so test cases remain reproducible.

---

# 65. Local PostgreSQL Backup

Disposable local data does not require backup.

Useful synthetic scenarios may be exported deliberately.

---

# 66. Local Kafka

Use a production-compatible Kafka version.

---

# 67. Local Kafka Topology

Use simplified single-node Kafka.

Production HA topology is unnecessary locally.

---

# 68. KRaft

Local Kafka may use:

```text
KRaft
```

if supported by the production-compatible Kafka version.

---

# 69. Topic Creation

Prefer explicit bootstrap scripts.

Do not rely solely on:

```text
auto.create.topics.enable=true
```

---

# 70. Topic Bootstrap

Example local topics:

```text
order.events.v1
payment.events.v1
wallet.events.v1
loyalty.events.v1
mission.events.v1
promotion.events.v1
notification.events.v1
```

Create only those required by the actual contract catalog.

---

# 71. Local Partition Count

May be lower than production for resource efficiency.

Tests requiring partition behavior must configure enough partitions.

---

# 72. Schema Registry

Run locally when event schemas use a registry.

---

# 73. Schema Registration

Local startup/tests may register dev schemas.

CI remains authoritative for compatibility validation.

---

# 74. Kafka UI

Optional tools:

```text
Kafka UI
AKHQ
Redpanda Console
```

Useful for:

```text
topic inspection
consumer lag
message debugging
```

---

# 75. Kafka UI Security

Local only.

Do not copy unsecured settings into production.

---

# 76. Consumer Group Reset

Developers may reset local consumer offsets through explicit scripts.

---

# 77. Replay Script

Support:

```text
reset to earliest
reset to timestamp
```

for local consumer groups only.

---

# 78. Local Redis

Use production-compatible Redis major version.

---

# 79. Redis Persistence

Local Redis can use:

```text
named volume
or
ephemeral mode
```

but reset semantics must be clear.

---

# 80. redis-cli

Can be accessed via container exec.

---

# 81. Redis GUI

Optional:

```text
RedisInsight
```

for local use.

---

# 82. Redis Namespace

Local key prefixes must still follow the documented service namespace standard.

---

# 83. Local Cache Reset

Prefer deleting:

```text
service-owned prefix only
```

rather than broad destructive reset.

---

# 84. FLUSHALL Warning

Do not use:

```text
FLUSHALL
```

against a shared team Redis.

---

# 85. Host vs Container Service Discovery

If service runs on the host:

```text
dependencies use localhost-mapped ports
```

If service runs in Compose:

```text
dependencies use Compose DNS names
```

---

# 86. Dual Endpoint Example

Host mode:

```text
KAFKA_BOOTSTRAP=localhost:9092
```

Container mode:

```text
KAFKA_BOOTSTRAP=kafka:29092
```

---

# 87. No Hard-Coded localhost

Application code must not hard-code dependency endpoints.

Use configuration.

---

# 88. Environment Variable Strategy

Every service maintains:

```text
.env.example
```

with safe placeholders.

---

# 89. Local .env

Developer `.env` must be:

```text
gitignored
```

---

# 90. Configuration Categories

```text
server
database
Kafka
Redis
security
external providers
feature flags
observability
```

---

# 91. Required vs Optional Config

README and configuration validation identify:

```text
required
optional
default
```

---

# 92. Environment Variable Documentation

Every variable should document:

```text
name
purpose
required?
example
secret?
```

---

# 93. Local Config Validation

Missing required variable should fail explicitly:

```text
DB_URL missing
```

not later with an unrelated runtime error.

---

# 94. ConfigurationProperties

Source suggests configuration schema may use:

```text
@ConfigurationProperties
validation annotations
```

---

# 95. Local Secrets

Use fake/local-only values.

Examples:

```text
LOCAL_JWT_PRIVATE_KEY
LOCAL_PROVIDER_API_KEY
```

They must not equal UAT/PROD secrets.

---

# 96. Local RSA Key

Identity development should use a dedicated local RSA pair.

Store outside Git or use an explicitly approved known development-only fixture.

---

# 97. Never Promote Local Private Key

A local development key is never reused in:

```text
UAT
PROD
```

---

# 98. Secret Bootstrap

A local setup script may generate:

```text
RSA key pair
local certificates
mock provider secret
```

---

# 99. Local TLS

Internal local services may use HTTP when production TLS termination is external.

TLS-specific integration scenarios should still be testable.

---

# 100. Local HTTPS Testing

Use a development CA/self-signed certificate only when testing TLS-specific behavior.

---

# 101. Application Profiles

Possible:

```text
local
test
```

Profiles must not change core domain rules.

---

# 102. local Profile

May define:

```text
localhost dependency endpoints
verbose selected logging
mock provider endpoints
```

---

# 103. test Profile

Used by automated tests.

Must not depend on developer machine state.

---

# 104. Local Feature Flags

Developers can enable features such as:

```text
new wallet flow
new mission behavior
new provider adapter
```

locally.

---

# 105. Local Flag Default

Default should match current production baseline unless the developer is testing the new feature.

---

# 106. Mock Provider Strategy

All external systems need a local mock strategy.

Examples:

```text
payment gateway
delivery partner
ERP
SMS
email
top-up
legacy API
```

---

# 107. WireMock

Good for REST provider simulation.

---

# 108. MockServer

Alternative for HTTP/HTTPS simulation.

---

# 109. Mock Provider Minimum Scenarios

Mocks must support:

```text
success
business rejection
timeout
500/503
malformed response
duplicate callback
```

---

# 110. Payment Mock

Scenarios:

```text
authorization success
decline
timeout
UNKNOWN outcome
capture
refund
duplicate webhook
```

---

# 111. Delivery Mock

Scenarios:

```text
DRIVER_ALLOCATED
DRIVER_ARRIVED
COLLECTED
DELIVERED
CANCELLED
```

---

# 112. Top-Up Mock

Scenarios:

```text
success
decline
network failure
duplicate transaction
```

---

# 113. ERP Mock

Scenarios:

```text
create document
duplicate document
503
authentication failure
```

---

# 114. Deterministic Mock Triggers

Local-only request values/headers may trigger known scenarios.

Example source pattern:

```text
amount=13.13 → timeout
amount=14.14 → decline
```

or explicit local/test scenario header.

---

# 115. Test Switch Safety

Scenario controls must not be enabled in production.

---

# 116. Fake SMTP

Use:

```text
MailHog
Mailpit
```

for local email capture.

---

# 117. Local Push

Use:

```text
provider sandbox
mock FCM adapter
test device token
```

Never production customer delivery.

---

# 118. Local SMS

Mock provider by default.

Do not send paid real SMS for normal local testing.

---

# 119. Standard Service Run Command

Gradle:

```bash
./gradlew bootRun
```

or module-specific:

```bash
./gradlew :order-service:bootRun
```

---

# 120. Maven Run

```bash
./mvnw spring-boot:run
```

---

# 121. IDE Run Configuration

Document:

```text
main class
profile
env file
port
```

---

# 122. Shared IDE Run Configuration

Safe `.run/` configuration may be committed if it contains no secrets.

---

# 123. Hot Reload

Possible:

```text
Spring DevTools
IDE auto rebuild
JRebel
```

development only.

---

# 124. Spring DevTools

Must not be packaged into the production runtime.

---

# 125. Fast Restart

Preferred:

```text
host JVM
+
Docker dependencies
```

---

# 126. Host Debugging

Preferred because standard Java debugger is simplest.

---

# 127. Container JDWP

Local container may expose JDWP, e.g.:

```text
5005
```

---

# 128. JDWP Safety

Never expose debug port broadly on:

```text
0.0.0.0
```

in shared/untrusted environments.

---

# 129. Local Logging

Local profile may use:

```text
human-readable logs
DEBUG for selected packages
```

---

# 130. Avoid Global DEBUG

Global debug logging creates noise and may expose sensitive data.

---

# 131. SQL Logging

Use carefully; it can expose:

```text
PII
tokens
large payloads
```

---

# 132. Correlation IDs Locally

Generate:

```text
request_id
correlation_id
```

even during local development.

---

# 133. Optional Local Observability

Profile may include:

```text
Prometheus
Grafana
Loki
Tempo / Jaeger
```

---

# 134. Local Metrics

Useful:

```text
request latency
DB pool
Kafka consumer lag
cache hit/miss
JVM memory
```

---

# 135. Local Tracing

Useful for workflows such as:

```text
Order
  ↓
Payment
  ↓
Kafka
  ↓
Notification
```

---

# 136. Observability Is Optional for Simple Work

A developer should not need the whole observability stack for a simple single-service change.

---

# 137. Testcontainers Standard

Automated integration tests start their own:

```text
PostgreSQL
Kafka
Redis
```

as needed.

---

# 138. Testcontainers Prerequisite

Docker engine must be available.

---

# 139. Testcontainers Reuse

May improve local performance.

CI should prioritize clean isolation/reproducibility.

---

# 140. Testcontainers Versions

Pin versions compatible with the platform runtime.

---

# 141. Docker Desktop Resources

Allocate sufficient:

```text
CPU
RAM
disk
```

for required local containers.

---

# 142. Low-Memory Workstation

Use selective Compose profiles.

Do not require full platform startup.

---

# 143. Service Stubbing

When a dependent service is not running, use:

```text
mock port
WireMock
local stub
```

according to task.

---

# 144. Contract-Driven Stub

Mocks should be generated/validated against:

```text
OpenAPI
Protobuf
event fixtures
```

where possible.

---

# 145. Avoid Mock Drift

Mocks must not silently diverge from actual provider contracts.

---

# 146. Local API Documentation

Expose locally:

```text
OpenAPI
Swagger UI
```

for convenience.

---

# 147. API Request Fixtures

Team may standardize on:

```text
Postman
Bruno
HTTP files
```

---

# 148. Repository Request Files

Example:

```text
requests/
├── login.http
├── order.http
├── payment.http
└── mission.http
```

---

# 149. API Client Secrets

Do not commit:

```text
token
password
secret
```

Use a local environment file.

---

# 150. Local Authentication Flow

Developers must be able to:

```text
seed user
login
obtain token
call protected endpoint
```

---

# 151. Local Admin User

Seed one synthetic local admin.

---

# 152. Local Customer User

Seed one synthetic local customer.

---

# 153. Local Guest Flow

Support guest behavior without production-account dependencies.

---

# 154. Local Member/Card Mapping

Seed synthetic:

```text
member ID
card number
```

for loyalty/order scenarios.

---

# 155. Synthetic Names

Use obviously fake names.

Example:

```text
DEV Customer 001
```

---

# 156. Seed Command

Examples:

```text
make seed
```

or:

```text
./gradlew seedLocal
```

---

# 157. Service Reset Workflow

Recommended:

```text
stop service
reset owned DB
clear owned Redis prefix
reset relevant local Kafka state if required
run migrations
seed
```

---

# 158. Full Platform Reset

Example:

```text
make local-reset
```

may recreate all local volumes.

---

# 159. Reset Safety Message

Display clearly:

```text
LOCAL DATA WILL BE DELETED
```

---

# 160. Destructive Environment Guard

Reset scripts validate:

```text
environment == local
endpoint == localhost/container-local
```

before destruction.

---

# 161. Database GUI

Optional:

```text
DBeaver
DataGrip
pgAdmin
```

---

# 162. GUI Credential Policy

Prefer saved local-only credentials.

Do not encourage storing production credentials.

---

# 163. Redis Inspection

Use:

```text
redis-cli
RedisInsight
```

for service-owned keys.

---

# 164. Kafka Inspection

Use local-only:

```text
Kafka UI
console consumer
```

---

# 165. README Architecture Diagram

Include:

```text
ports
service relationships
dependencies
```

---

# 166. Daily Developer Workflow

```text
git pull
  ↓
start local dependencies
  ↓
run service
  ↓
seed data
  ↓
develop
  ↓
unit/integration tests
  ↓
format/lint
  ↓
commit/push
```

---

# 167. Start-of-Day Example

```bash
docker compose --profile infra --profile messaging up -d
./gradlew bootRun
```

---

# 168. End-of-Day

Stop the application service.

Local dependencies may remain running if desired.

---

# 169. Branch Workflow

Use organization Git branch convention.

Example from source:

```text
feature/BP-610/BROWN-APP-REWAMP-PHASE-1
```

---

# 170. Branch Isolation

Migration state can diverge between branches.

Options:

```text
reset DB when switching
separate Compose project
branch-specific volume
branch-specific DB
```

---

# 171. Branch-Specific DB

Example:

```text
DB_NAME=order_feature_123
```

for migration-heavy work.

---

# 172. Git Ignore

Generated local artifacts:

```text
build/
logs/
local data/
.env
```

must remain untracked.

---

# 173. Pre-Push Checklist

Recommended:

```text
format
unit tests
relevant integration tests
migration validation
```

---

# 174. Local CI Approximation

Provide:

```text
make verify
```

or:

```bash
./gradlew check integrationTest
```

---

# 175. Task Runner

Recommended logical commands:

```text
dev-up
dev-down
dev-reset
dev-health
seed
test
integration-test
verify
image-build
logs
doctor
```

---

# 176. Cross-Platform Task Runner

Options:

```text
Gradle tasks
PowerShell
Taskfile
just
Make
```

Standardize one approach.

---

# 177. PowerShell

Windows-first team may provide:

```text
dev-up.ps1
dev-reset.ps1
```

alongside shell versions if needed.

---

# 178. Script Portability

Business logic must not depend on platform-specific shell quirks.

---

# 179. Onboarding Goal

A new developer should be able to:

```text
clone
follow README
run one command
see service healthy
run tests
```

---

# 180. Onboarding Checklist

- [ ] Git access.
- [ ] Java installed.
- [ ] Docker working.
- [ ] Repository cloned.
- [ ] `.env` copied from example.
- [ ] Local infra starts.
- [ ] Service starts.
- [ ] Migrations run.
- [ ] Seed data loaded.
- [ ] Login/API call succeeds.
- [ ] Unit tests pass.
- [ ] Integration tests pass.

---

# 181. Onboarding Friction

If setup requires undocumented hours/days:

```text
developer platform defect
```

not normal tribal knowledge.

---

# 182. Doctor Command

Provide:

```text
doctor
```

script.

---

# 183. Doctor Checks

```text
Java version
Docker availability
port availability
Git
environment files
Git remote
```

---

# 184. Example Doctor Output

```text
Java 21       OK
Docker        OK
Postgres port FREE
Kafka port    FREE
.env          OK
Git remote    OK
```

---

# 185. Port Conflict Detection

Check:

```text
5432
6379
9092
service port
```

before startup.

---

# 186. Common Windows Port Conflicts

```text
local DB server
XAMPP
another Docker project
IDE debug process
```

---

# 187. Container Naming

Use Compose project scope.

Avoid global `container_name` unless necessary.

---

# 188. Docker Disk Usage

Useful:

```bash
docker system df
```

---

# 189. Docker Cleanup

Global:

```bash
docker system prune
```

must be used carefully.

Prefer project-scoped cleanup.

---

# 190. Safe Project Cleanup

```bash
docker compose down -v
```

inside the intended project.

---

# 191. Stale Containers

When behavior is strange, check:

```text
old containers
old networks
old volumes
```

---

# 192. Image Refresh

After dependency/image update:

```bash
docker compose pull
```

or rebuild.

---

# 193. Build Cache Problem

If stale:

```text
clean Gradle/Maven
rebuild without cache only when needed
```

Do not make no-cache builds the default.

---

# 194. Configuration Drift Rule

Any new:

```text
environment variable
Kafka topic
database
provider
```

must update local tooling/docs.

---

# 195. New Env Variable Rule

Same merge request must update:

```text
.env.example
README
configuration validation
```

---

# 196. New Local Dependency Rule

Update:

```text
Compose
healthcheck
README
doctor
```

---

# 197. Migration Change Rule

Include:

```text
local migration test
seed compatibility
```

---

# 198. New Kafka Topic Rule

Include:

```text
local bootstrap
schema
topic catalog
```

---

# 199. External Contract Change Rule

Update:

```text
mock provider
contract fixture
tests
```

---

# 200. Local Security Principle

Never store locally:

```text
production DB dump
production API key
production JWT private key
customer PII
```

---

# 201. Production-Like Data

Use:

```text
synthetic data
or
approved anonymized data
```

only.

---

# 202. Secret Sharing Risk

Do not copy production secrets into:

```text
tickets
chat
logs
README
```

---

# 203. Local Secret Scan

Pre-commit/CI may scan for:

```text
private key
token
password pattern
```

---

# 204. Debug/Admin Endpoints

May exist locally, but production exposure remains controlled.

---

# 205. Test Fixture Endpoint Safety

Only acceptable if:

```text
profile-restricted
impossible to enable accidentally in production
```

---

# 206. Local Time

System timezone must not alter business behavior.

Use:

```text
UTC persistence
explicit business timezone
```

---

# 207. Time Travel

Use injected:

```text
test clock
```

instead of changing system time.

---

# 208. Local Email Capture

MailHog/Mailpit lets developers inspect:

```text
password-reset email
order email
security email
```

without real delivery.

---

# 209. Local Object Storage

Use:

```text
MinIO
```

for S3-compatible semantics where required.

Filesystem adapter is acceptable only if semantics remain compatible.

---

# 210. Local SFTP

An SFTP container may simulate file-based partner integration.

---

# 211. Local SQL Server

If legacy integration requires it, a SQL Server container may be optional where licensing/architecture permits.

Otherwise use a controlled non-production legacy endpoint.

---

# 212. SQL Server Resource Cost

Keep it in an optional profile because it can be heavy.

---

# 213. Legacy DB Mock

Prefer:

```text
Testcontainer
mock repository
fixture DB
```

over mandatory shared legacy UAT for normal development.

---

# 214. Local OData Mock

WireMock may simulate:

```text
$filter
$expand
pagination
sentinel dates
```

---

# 215. External Dependency Hierarchy

Preferred:

```text
local mock
  ↓
sandbox
  ↓
shared UAT
  ↓
production never
```

---

# 216. Sandbox Reliability

If third-party sandbox is down, local mocks should allow work to continue.

---

# 217. Offline Development

Core domain tests should run without Internet.

Most integration tests should use local containers/mocks.

---

# 218. Dependency Downloads

Initial setup may need Internet.

Build caches should improve resilience afterward.

---

# 219. Private Artifact Credentials

Developer-scoped credentials should live outside source control.

Examples:

```text
~/.gradle/gradle.properties
~/.m2/settings.xml
credential manager
```

---

# 220. Corporate Proxy

Document required proxy setup explicitly.

---

# 221. Corporate TLS Inspection

Install approved CA where required.

Never disable SSL verification globally.

---

# 222. Git TLS

Do not standardize:

```text
http.sslVerify=false
```

Fix trust correctly.

---

# 223. Java TLS

Check:

```text
JDK truststore
corporate CA
hostname
certificate chain
```

---

# 224. Docker Registry TLS

Use trusted CA/configuration.

Avoid insecure registry mode except explicitly isolated local use.

---

# 225. Local DB Connection Failure Checklist

```text
container running?
port mapped?
DB healthy?
database exists?
credentials correct?
Flyway applied?
```

---

# 226. Local Kafka Connection Failure Checklist

```text
broker running?
advertised listeners correct?
host vs container endpoint correct?
topic exists?
client security mode correct?
```

---

# 227. Kafka Advertised Listener Trap

Local Kafka needs distinct addresses for:

```text
host clients
container clients
```

Configure both explicitly.

---

# 228. Local Redis Failure Checklist

```text
container running?
port correct?
auth correct?
prefix/DB correct?
```

---

# 229. Service Startup Failure Checklist

```text
Java version
env vars
DB
Kafka
Redis
port collision
migration
```

---

# 230. Flyway Failure

Check:

```text
migration checksum
manual DB edits
branch switching
schema version
```

---

# 231. Local Flyway Checksum Mismatch

For disposable local DB, reset may be simplest.

Do not normalize production migration repair as a casual action.

---

# 232. Branch Migration Conflict

Reset local DB if migration histories diverge after branch switch.

---

# 233. Windows Port Check

Example:

```powershell
netstat -ano | findstr :8080
```

or current equivalent.

---

# 234. Container Logs

```bash
docker compose logs -f <service>
```

---

# 235. Local Container Shell

Debug/dev image may allow:

```bash
docker exec -it <container> sh
```

Production image may not.

---

# 236. PostgreSQL Shell

```bash
docker exec -it postgres psql ...
```

---

# 237. Redis Shell

```bash
docker exec -it redis redis-cli
```

---

# 238. Kafka Console Consumer

Useful for manual inspection only.

Not a substitute for automated verification.

---

# 239. Health Endpoint

Example:

```text
GET /actuator/health
```

---

# 240. Local Readiness

Verify service is healthy before manual feature testing.

---

# 241. Local Log-Level Default

Recommended:

```text
application INFO
selected package DEBUG
framework INFO/WARN
```

---

# 242. Slow SQL Debugging

Local PostgreSQL can enable:

```text
log_min_duration_statement
```

---

# 243. EXPLAIN ANALYZE

Use representative synthetic data for critical SQL.

---

# 244. Local Load Testing

Small:

```text
k6
Gatling
```

scenarios are acceptable.

Official large tests belong in dedicated performance environment.

---

# 245. Local Concurrency Testing

Use Testcontainers/Gradle to test:

```text
wallet
inventory
promotion
```

races without shared UAT.

---

# 246. Simple Local Chaos

Examples:

```bash
docker stop redis
docker stop kafka
```

to validate recovery behavior.

---

# 247. Dependency Restart Testing

Restart:

```text
PostgreSQL
Redis
Kafka
mock provider
```

while app runs.

Observe client reconnect behavior.

---

# 248. Service Restart Testing

Restart application during:

```text
Saga
Kafka consumption
scheduled worker
```

using synthetic data.

---

# 249. Local Reconciliation

Developers should be able to create synthetic mismatches and run reconciliation.

---

# 250. Local DLQ Workflow

```text
produce bad event
observe DLQ
fix
replay
```

---

# 251. Local Outbox Workflow

Inspect:

```text
outbox row
Kafka publish
published_at
```

---

# 252. Local Inbox Workflow

Replay the same event and verify the processed-event/inbox protection prevents duplicate side effects.

---

# 253. Local Cache Workflow

Inspect:

```text
miss
set
hit
invalidation
TTL
```

---

# 254. Local Rate-Limit Workflow

Exercise:

```text
allowed
threshold
429
cooldown expiry
```

---

# 255. Local JWT Workflow

Developer can:

```text
login
inspect safe claims
verify kid
refresh
logout
```

---

# 256. Local JWKS

Identity exposes local JWKS for locally signed tokens.

---

# 257. Local Key Rotation Simulation

Optional:

```text
generate new key
activate new kid
verify old/new behavior
```

---

# 258. Local Mission Workflow

Seed:

```text
Journey mission
Campaign mission
reward
```

then publish qualifying event.

---

# 259. Local Promotion Workflow

Seed:

```text
coupon
usage limit
budget
```

test:

```text
reserve
redeem
release
```

---

# 260. Local Wallet Workflow

Synthetic:

```text
top-up
reserve
capture
release
refund
```

---

# 261. Local Payment Workflow

Mock provider:

```text
authorize
capture
timeout
UNKNOWN
refund
```

---

# 262. Local Order Workflow

```text
cart
checkout
accepted
ready
done
cancel
```

---

# 263. Local Notification Workflow

```text
OrderReady
notification record
push mock
in-app inbox
```

---

# 264. Local Integration Workflow

```text
webhook
signature verification
mapping
canonical event
```

---

# 265. Feature Workflow README Template

```text
Prerequisites
Seed
Request
Expected DB state
Expected event
Expected response
Reset
```

---

# 266. Copyable API Fixtures

Provide local-safe examples for:

```text
login
cart
checkout
order completion
```

---

# 267. Local Service Accounts

Use fake internal service credentials/JWTs.

---

# 268. Service-to-Service Authentication

Local mode may simplify infrastructure but should preserve:

```text
caller identity
scopes
authorization
```

---

# 269. Do Not Disable Auth Normally

Avoid blanket:

```text
security.disabled=true
```

for normal development.

It hides real integration/security bugs.

---

# 270. Controlled Auth Bypass

If one exists:

```text
local profile only
explicit warning
impossible to enable in production
```

---

# 271. Local CORS

Allow required localhost origins in local profile.

Do not weaken production CORS.

---

# 272. Frontend Local Base URL

Example:

```text
http://localhost:8080
```

through the local gateway.

---

# 273. Mobile Device Cannot Use localhost

A physical phone's:

```text
localhost
```

is the phone itself.

Use:

```text
LAN IP
ADB reverse
emulator host alias
```

as appropriate.

---

# 274. Android Emulator

Common host alias:

```text
10.0.2.2
```

---

# 275. iOS Simulator

Often reaches host localhost, but verify the active environment.

---

# 276. Physical Device

Use developer machine LAN IP and restrict firewall access to trusted local network.

---

# 277. Mobile HTTPS

Install a trusted development certificate only when HTTPS is required.

---

# 278. Backend URL Configuration

Mobile/web clients should configure local/dev base URLs rather than hard-coding production.

---

# 279. Local Push to Device

Use test project/config only.

---

# 280. Local Deep Links

Use test/development schemes.

---

# 281. Service DB Ownership

Service team owns:

```text
migrations
seed
local DB troubleshooting
```

---

# 282. Shared Reference Data

Must have one clear owner.

Avoid inconsistent duplicated seed copies.

---

# 283. Contract Repository

Developers work from versioned:

```text
OpenAPI
Proto
Kafka schema
```

source.

---

# 284. Client Generation

Provide tasks such as:

```text
generateApiClient
generateProto
```

---

# 285. Generated Code

Do not hand-edit generated clients.

---

# 286. Contract Change Workflow

```text
edit contract
run compatibility check
regenerate client
run tests
commit
```

---

# 287. Local Schema Compatibility

Can be run before push.

CI remains authoritative.

---

# 288. Local Static Analysis

Provide:

```bash
./gradlew check
```

or equivalent.

---

# 289. Local Sonar

A full local Sonar server is unnecessary.

Use local lint/tests; CI runs SonarCloud/Server.

---

# 290. Sonar Issue Priority

Developers should address:

```text
bugs
security vulnerabilities
critical code smells
```

according to policy.

---

# 291. Local Secret Scan

May run through pre-commit or `verify`.

---

# 292. Local Dependency Check

Optional tools may include dependency security/update checks.

CI remains authoritative.

---

# 293. Dockerfile Lint Locally

Example:

```bash
hadolint Dockerfile
```

---

# 294. Local Image Build

```bash
docker build -t service:local .
```

---

# 295. Local Image Smoke

Run the final image and verify health.

---

# 296. Local Non-Root Verification

Inspect runtime image user or execute `id` where available.

---

# 297. Local Read-Only Filesystem Test

Run with:

```text
read-only root filesystem
temporary writable /tmp
```

before Kubernetes hardening.

---

# 298. Local Graceful Stop Test

```bash
docker stop <container>
```

and inspect shutdown behavior.

---

# 299. Local Resource Limit Test

Run with:

```text
--memory
--cpus
```

to observe JVM behavior.

---

# 300. Troubleshooting Philosophy

Troubleshooting should move from:

```text
guessing
```

to:

```text
status
health
logs
config
dependency checks
repeatable scripts
```

---

# 301. Incident Reproduction

Use:

```text
synthetic equivalent data
same application version
same config shape
same PostgreSQL/Kafka/Redis versions
```

Do not import raw production secrets/data.

---

# 302. Reproduction Record

Document:

```text
commit
seed
request
expected
actual
logs
```

---

# 303. Bug Reproduction Artifact

Once understood, add:

```text
integration test
HTTP fixture
seed/scenario script
```

---

# 304. Local Performance Profiling

Permitted tools may include:

```text
Java Flight Recorder
VisualVM
async-profiler
```

according to organization policy.

---

# 305. JFR

Useful for:

```text
CPU
allocation
GC
locks
```

---

# 306. Profiling Safety

Use synthetic/local data.

Profiling output may contain sensitive contextual information.

---

# 307. SQL Profiling

Use:

```text
EXPLAIN ANALYZE
pg_stat_statements
```

where configured.

---

# 308. Kafka Lag Inspection

Inspect:

```text
current offset
end offset
lag
```

---

# 309. Redis Memory Inspection

Use:

```text
INFO MEMORY
MEMORY USAGE
```

for key-design experiments.

---

# 310. Developer Metrics Baseline

Before optimization measure:

```text
latency
query count
cache hit rate
event count
```

---

# 311. Local Optimization Rule

Do not add:

```text
cache
async complexity
extra thread pools
```

without evidence.

---

# 312. Architecture Tests

Run ArchUnit in normal tests.

---

# 313. Contract Tests

Run before pushing contract changes.

---

# 314. Migration Tests

Run whenever migrations change.

---

# 315. Integration Tests

Run affected service integration suite before merge request.

---

# 316. Local E2E

Optional for developer.

Broader E2E belongs to CI/shared environment.

---

# 317. Feedback Speed Goal

Target pattern:

```text
unit tests → seconds
integration tests → minutes
local restart → seconds
```

Exact numbers are project-dependent.

---

# 318. Slow Feedback Smell

If every code change requires:

```text
full platform restart
```

developer tooling/architecture should be improved.

---

# 319. Service Independence Goal

A developer should usually work on one service with:

```text
local infrastructure
+
mocks
```

rather than the entire platform.

---

# 320. Contract Independence

A service can compile/test against versioned contracts without a live provider.

---

# 321. Database Independence

Each service owns isolated migrations/tests.

---

# 322. Kafka Independence

Consumer integration tests use local Kafka/Testcontainers.

---

# 323. Redis Independence

Cache/rate-limit tests use local Redis/Testcontainers.

---

# 324. Local Feature Matrix

Document which feature requires which dependencies.

Example:

```text
Catalog basic:
PostgreSQL + Redis

Order checkout:
PostgreSQL + Kafka + mock payment/inventory/promotion

Notification:
PostgreSQL + Kafka + mock provider
```

---

# 325. Dependency Minimization

Developers start only what the feature requires.

---

# 326. Shared Local Platform Structure

```text
platform-local/
├── compose.yml
├── scripts/
├── seed/
├── mocks/
└── README.md
```

---

# 327. Local Platform Version Pinning

Pin:

```text
PostgreSQL
Kafka
Redis
Schema Registry
mock images
```

---

# 328. Compose Lockstep

Local stack changes are versioned with the runtime/architecture changes that require them.

---

# 329. Compatibility Matrix

Maintain supported versions of:

```text
Java
Spring Boot
PostgreSQL
Kafka
Redis
Docker
Docker Compose
Testcontainers
```

---

# 330. Developer Upgrade Policy

Major Java/Docker changes require:

```text
announcement
docs update
CI update
doctor update
```

---

# 331. IDE Upgrade Policy

Do not block work on exact IDE patch/minor version unless plugin compatibility requires it.

---

# 332. Docker Upgrade

Verify Compose/Kafka compatibility before forcing a team-wide upgrade.

---

# 333. WSL Upgrade

Document Windows-specific issues if WSL/Docker behavior changes.

---

# 334. Local Observability Example

```text
POST /orders
    ↓
trace ID
    ↓
Order span
    ↓
Payment span
    ↓
Kafka producer span
    ↓
Notification consumer span
```

---

# 335. Local Metrics Example

Observe:

```text
HTTP request metrics
DB pool
Kafka lag
Redis hit ratio
JVM heap
```

---

# 336. Local Dashboard Purpose

Optional dashboards help developers learn distributed behavior, not only production operations.

---

# 337. Local Alerts

Full production alerting is unnecessary locally.

---

# 338. Local Log Retention

Short-lived.

Production-grade retention is unnecessary.

---

# 339. Local Data Classification

Synthetic data is non-production, but tokens/secrets still require safe handling.

---

# 340. Local Admin Permission

Local admin may have broad test permission.

Do not infer production RBAC from local convenience.

---

# 341. Provider Credentials

Use:

```text
sandbox key
mock key
```

never production credentials.

---

# 342. Development Cloud Resource

If a dependency cannot run locally, use a dedicated DEV resource with separate credentials.

---

# 343. Shared DEV Dependency

Document:

```text
availability
rate limits
reset behavior
owner
```

---

# 344. Shared DEV Is Not CI

Correctness must not depend entirely on an unstable shared environment.

---

# 345. Local DB Schema Inspection

Developers can inspect:

```text
Flyway history
expected tables
indexes
```

---

# 346. Local Event Schema Inspection

Schema Registry UI/API may show:

```text
subject
version
compatibility
```

---

# 347. Local API Version Testing

Old request fixtures can verify backward compatibility.

---

# 348. Mobile Compatibility

Backend may maintain fixture clients for supported mobile contracts.

---

# 349. Documentation Ownership

Service owner maintains service README.

Platform team maintains:

```text
global setup
Compose
doctor script
version matrix
```

---

# 350. Documentation Update Rule

Setup-affecting changes update docs in the same merge request.

---

# 351. Outdated README

Treat setup documentation that no longer works as a defect.

---

# 352. Tribal Knowledge Reduction

Repeated Slack/Teams troubleshooting should become:

```text
README
runbook
doctor check
script
```

---

# 353. Local Runbook

Maintain:

```text
startup failures
port conflicts
migration reset
Kafka listener issues
Docker disk issues
Git auth issues
```

---

# 354. Developer Self-Service

Goal:

```text
developers resolve common issues without waiting for DevOps
```

---

# 355. Escalation

Escalate when the root cause is truly:

```text
organization credential
VPN
GitLab permission
shared infrastructure
```

---

# 356. VPN Documentation

Document which dependencies require VPN.

Local mocks should reduce mandatory VPN usage.

---

# 357. VPN / Proxy + Docker

Container network may not inherit host VPN/proxy automatically.

Document required configuration.

---

# 358. Corporate DNS

Can affect:

```text
GitLab
artifact registry
shared DEV
```

Distinguish corporate DNS failures from application DNS issues.

---

# 359. Time Synchronization

Developer clocks must remain correct because drift affects:

```text
JWT
TLS
Kafka
OTP
```

---

# 360. Test Clock

Never change system clock to test expiry.

Use injected clock.

---

# 361. Local DB Dump

Use:

```bash
pg_dump
```

for useful synthetic scenarios if needed.

---

# 362. Fixture Promotion

A valuable manually created scenario should become:

```text
versioned seed
or
automated test fixture
```

not remain only in one developer DB.

---

# 363. Data Reset Ownership

Reset only project/service-owned data.

---

# 364. Cross-Project Docker Safety

Use Compose project isolation to avoid deleting another repository's volumes.

---

# 365. Kafka Reset Safety

Topic/group reset commands must target local broker only.

---

# 366. Local Secret Rotation

Developers may test:

```text
DB password change
JWT key rotation
provider key rotation
```

using local-only credentials.

---

# 367. Certificate Expiry

Use short-lived local test certificate where expiry handling must be tested.

---

# 368. Local Failure Injection

Mock provider may accept local-only header:

```text
X-Test-Scenario
```

---

# 369. Failure Scenario Catalog

Example:

```text
PAYMENT_TIMEOUT
PAYMENT_DECLINED
INVENTORY_503
REDIS_DOWN
KAFKA_DOWN
```

---

# 370. Scenario Script

Example:

```text
./scripts/scenario-checkout-payment-timeout.sh
```

---

# 371. Scenario Expected Output

Document:

```text
API response
DB state
Saga state
events
compensation
```

---

# 372. Regression Reproduction

A production bug should ideally become an automated local scenario/test.

---

# 373. Migration Discipline

Before creating/changing migration:

```text
pull/rebase latest
```

to avoid duplicate versions.

---

# 374. Migration Naming

Example:

```text
V17__create_payment_attempts.sql
```

or timestamp strategy.

---

# 375. Timestamp Migration Version

Large multi-developer repositories may use:

```text
YYYYMMDDHHMMSS
```

to reduce version collision.

---

# 376. Duplicate Local Migration

An unshared local migration can be renumbered before merge.

---

# 377. Shared Migration Immutability

Once merged/released:

```text
do not casually rename/edit
```

---

# 378. Local Git Hooks

Possible:

```text
format check
secret scan
migration duplicate check
```

---

# 379. CI Remains Authoritative

Hooks can be skipped, so CI remains the final gate.

---

# 380. Local Health Command

Provide:

```text
dev-health
```

or equivalent.

---

# 381. Example Health Matrix

```text
PostgreSQL  UP
Kafka       UP
Redis       UP
PaymentMock UP
Order       UP
```

---

# 382. Local Event Publish Utility

A dev tool may publish a valid event fixture for:

```text
Mission
Notification
Loyalty
```

consumer development.

---

# 383. Event Utility Safety

Must target local/test Kafka only.

---

# 384. Local Webhook Utility

Generate partner-compatible signed mock webhooks.

---

# 385. Shared Webhook Signing Helper

Tests and developer tooling should share canonical signing logic.

---

# 386. Local OAuth/OIDC Provider

Use:

```text
Keycloak
mock OIDC
```

only if the actual architecture requires an external IdP.

---

# 387. Local Service Mesh

Do not require service mesh for normal local development.

---

# 388. Local Kubernetes

Optional tools:

```text
kind
k3d
minikube
```

for Kubernetes-specific work.

---

# 389. When Local Kubernetes Is Appropriate

Use for:

```text
Helm/Kustomize
probes
NetworkPolicy
service discovery
Ingress
```

testing.

---

# 390. Local Kubernetes Is Optional

It is heavier than Compose and should not be mandatory for normal service work.

---

# 391. Local Registry

Optional for local Kubernetes image workflows.

---

# 392. Developer Productivity Metrics

Possible signals:

```text
setup success rate
time to first successful run
test duration
restart time
recurring setup tickets
```

---

# 393. Developer Experience SLO

Informal source target:

```text
new developer can run one core service within one working session
```

after access approval.

---

# 394. Documentation Acceptance Test

Periodically have a new/rotating engineer follow the README without verbal help.

Fix gaps discovered.

---

# 395. Platform Version Upgrade

Before changing shared Compose versions:

```text
run critical integration suites
```

---

# 396. PostgreSQL Upgrade Local Test

Verify:

```text
migrations
SQL behavior
driver compatibility
```

---

# 397. Kafka Upgrade Local Test

Verify:

```text
producer
consumer
Schema Registry
rebalance
```

---

# 398. Redis Upgrade Local Test

Verify:

```text
Lua scripts
TTL
client compatibility
cluster behavior where relevant
```

---

# 399. Java Upgrade Local Test

Verify:

```text
build
unit/integration tests
container
performance smoke
```

---

# 400. Spring Boot Upgrade Local Test

Review:

```text
Actuator
serialization
security
Kafka client
Flyway
```

---

# 401. Dependency Lock Update

Dependency updates must be deliberate rather than accidental floating-version changes.

---

# 402. API Compatibility Suite

Run historical request fixtures against the current service.

---

# 403. Event Compatibility Suite

Run historical event fixtures through current consumers.

---

# 404. DB Compatibility Suite

Upgrade previous migration snapshot to the current schema.

---

# 405. Docker Compatibility Suite

Run current service image with pinned local dependency versions.

---

# 406. Definition of Done — New Service

A new service is locally developable when:

- [ ] README exists.
- [ ] Build wrapper works.
- [ ] Java version documented.
- [ ] `.env.example` exists.
- [ ] Local database configured.
- [ ] Flyway works.
- [ ] Seed data exists if needed.
- [ ] Kafka topics bootstrap if needed.
- [ ] Redis config exists if needed.
- [ ] External mocks exist if needed.
- [ ] Run command documented.
- [ ] Tests run locally.
- [ ] Docker image builds.
- [ ] Troubleshooting is documented.

---

# 407. Definition of Done — New Local Dependency

- [ ] Version pinned.
- [ ] Compose service.
- [ ] Healthcheck.
- [ ] Port documented.
- [ ] Environment variables.
- [ ] Startup/reset scripts.
- [ ] Resource cost considered.
- [ ] README updated.

---

# 408. Definition of Done — New External Integration

- [ ] Local mock.
- [ ] Success scenario.
- [ ] Failure scenario.
- [ ] Timeout scenario.
- [ ] Webhook scenario where relevant.
- [ ] Contract fixture.
- [ ] Sandbox instructions.
- [ ] No production credentials required.

---

# 409. Definition of Done — Developer Tooling

- [ ] Cross-platform where required.
- [ ] Safe defaults.
- [ ] Destructive local commands guarded.
- [ ] Help text.
- [ ] Useful exit codes.
- [ ] README.
- [ ] Compatible with CI.

---

# 410. Workstation Review

- [ ] Java version.
- [ ] Git.
- [ ] Docker.
- [ ] IDE.
- [ ] WSL2 guidance on Windows.
- [ ] Disk space.
- [ ] Port conflicts.
- [ ] Credential setup.
- [ ] Proxy/VPN guidance.

---

# 411. Repository Review

- [ ] README.
- [ ] `.editorconfig`.
- [ ] `.gitattributes`.
- [ ] `.gitignore`.
- [ ] `.dockerignore`.
- [ ] `.env.example`.
- [ ] wrapper scripts.
- [ ] local scripts.
- [ ] fixtures.
- [ ] migrations.

---

# 412. Compose Review

- [ ] Pinned versions.
- [ ] Profiles.
- [ ] Health checks.
- [ ] Named volumes.
- [ ] Local-only credentials.
- [ ] Avoid fixed global container names.
- [ ] Port overrides.
- [ ] Reset workflow.
- [ ] Resource footprint.

---

# 413. Database Review

- [ ] Production-compatible PostgreSQL.
- [ ] Separate service DBs/users.
- [ ] Flyway.
- [ ] Seed.
- [ ] Reset.
- [ ] No production dump.
- [ ] Branch migration guidance.

---

# 414. Kafka Review

- [ ] Compatible version.
- [ ] Topic bootstrap.
- [ ] Correct host/container listeners.
- [ ] Schema Registry when required.
- [ ] Optional UI.
- [ ] Reset/replay scripts.
- [ ] Event fixtures.

---

# 415. Redis Review

- [ ] Compatible version.
- [ ] Prefix standards.
- [ ] Persistence semantics.
- [ ] Safe reset.
- [ ] CLI/UI optional.
- [ ] Rate-limit/cache scenarios.

---

# 416. Security Review

- [ ] No production secrets.
- [ ] Local keys only.
- [ ] `.env` ignored.
- [ ] Secret scanning.
- [ ] Production dumps prohibited.
- [ ] Auth enabled normally.
- [ ] Debug ports local-only.
- [ ] Reset commands guarded.

---

# 417. Developer Experience Review

- [ ] One-command infra start.
- [ ] One-command reset.
- [ ] One-command verify.
- [ ] Doctor command.
- [ ] Troubleshooting guide.
- [ ] Onboarding tested.
- [ ] Selective dependencies supported.

---

# 418. Production-Readiness for Developer Environment

Before team-wide adoption:

- [ ] Supported OSes documented.
- [ ] Windows/WSL instructions verified.
- [ ] Java/toolchain pinned.
- [ ] Docker/Compose versions supported.
- [ ] Shared port registry exists.
- [ ] PostgreSQL/Kafka/Redis versions align with target.
- [ ] Compose profiles work.
- [ ] Required topics bootstrap.
- [ ] Seed/reset works.
- [ ] Testcontainers work.
- [ ] External mocks cover critical paths.
- [ ] Local auth/JWT works.
- [ ] Optional tracing/metrics works.
- [ ] Docker images build locally.
- [ ] Doctor catches common issues.
- [ ] No production secrets/data required.
- [ ] README onboarding validated.

---

# 419. Source-Recommended Implementation Order

```text
1. Java/Git/Docker workstation standard
2. Global local-development README
3. Shared port registry
4. PostgreSQL Compose
5. Redis Compose
6. Kafka + Schema Registry Compose
7. Service .env.example
8. Flyway local setup
9. Seed/reset scripts
10. Mock providers
11. Testcontainers baseline
12. Developer doctor command
13. API request fixtures
14. Local tracing/metrics optional profile
15. Local failure-scenario scripts
16. Onboarding validation
```

---

# 420. Expanded Implementation Order

```text
1. Publish supported workstation matrix
2. Standardize Java LTS
3. Standardize Git + GitLab auth workflow
4. Publish Windows/WSL guidance
5. Add .gitattributes and .editorconfig
6. Create global local-development README
7. Create platform-local folder/repository
8. Publish local port registry
9. Add PostgreSQL Compose
10. Create per-service local DB/users
11. Add Redis Compose
12. Add Kafka Compose
13. Add Schema Registry
14. Add health checks
15. Add Compose profiles
16. Add local dependency version pins
17. Add .env.example to every service
18. Add configuration validation
19. Configure host/container endpoint profiles
20. Add Flyway local startup
21. Add seed framework
22. Add reset commands with local guards
23. Add topic bootstrap
24. Add consumer-group replay/reset tools
25. Add Redis prefix reset tooling
26. Add payment mock
27. Add delivery mock
28. Add ERP/top-up mocks
29. Add fake SMTP
30. Add local service-account/auth setup
31. Seed admin/customer/member/card fixtures
32. Add API request fixtures
33. Add local service run configs
34. Add optional hot reload
35. Add optional local observability
36. Add Testcontainers baseline
37. Add local verify command
38. Add doctor command
39. Add dev-health command
40. Add branch migration isolation guidance
41. Add local failure scenario catalog
42. Add Saga/outbox/inbox/DLQ developer workflows
43. Add frontend/mobile connectivity guide
44. Add contract/client generation tasks
45. Add local image verification
46. Add troubleshooting runbooks
47. Add version upgrade compatibility suite
48. Run onboarding acceptance test
49. Complete Phase 23 review
50. Handoff Phase 24 Environment Strategy
```

---

# 421. Minimum Viable Local Development Standard

Every developer should be able to:

```text
clone repository
configure local environment
start dependencies
run one service
run migrations
load seed data
authenticate
call protected API
run unit tests
run integration tests
build Docker image
reset local state
```

without:

```text
production credentials
manual database creation
manual Kafka setup
tribal knowledge
```

---

# 422. Local Development Governance

Review should reject:

```text
service requiring production credentials locally
manual DB schema creation
undocumented required env vars
unversioned dependency images
hard-coded localhost in application code
mandatory full-platform startup for simple service work
shared production/customer PII dumps
blanket local auth disabling
unsafe destructive reset scripts
```

---

# 423. Standard Developer Command Contract

Recommended logical commands:

```text
dev-up
dev-down
dev-reset
dev-health
seed
test
integration-test
verify
image-build
logs
doctor
```

Actual implementation can use:

```text
Gradle
PowerShell
Taskfile
Make
```

---

# 424. Example Developer Session

```text
1. git pull
2. dev-up
3. doctor
4. seed
5. run order-service in IDE
6. call login endpoint
7. execute checkout fixture
8. inspect Kafka event
9. run tests
10. commit
```

---

# 425. Example Failure-Debug Session

```text
Checkout returns dependency unavailable
      ↓
find correlation ID
      ↓
inspect Order logs
      ↓
check Payment mock health
      ↓
inspect Kafka / DB if async
      ↓
reproduce scenario
      ↓
add regression test
```

---

# 426. New Developer Day-One Flow

```text
install JDK
install Docker
clone repositories
copy .env.example
run dev-up
run doctor
run migrations
seed
start service
execute sample API
run tests
```

---

# 427. Example Ordering Local Dependency Set

Required:

```text
order_db
Kafka
```

Usually:

```text
Redis
```

Mocks:

```text
Catalog
Inventory
Promotion
Payment/Wallet
Customer
```

Optional:

```text
Notification
Loyalty
Mission
```

---

# 428. Example Identity Local Dependency Set

Required:

```text
identity_db
```

Usually:

```text
Redis
```

Optional:

```text
Mailpit
Notification mock
```

---

# 429. Example Catalog Local Dependency Set

Required:

```text
catalog_db
```

Usually:

```text
Redis
```

Optional:

```text
object storage mock
```

---

# 430. Example Payment Local Dependency Set

Required:

```text
payment_db
Kafka
```

Mocks:

```text
payment provider
```

Optional:

```text
Redis
```

---

# 431. Example Wallet Local Dependency Set

Required:

```text
wallet_db
Kafka
```

Optional:

```text
Redis read cache
```

---

# 432. Example Mission Local Dependency Set

Required:

```text
mission_db
Kafka
```

Optional:

```text
Redis
```

Fixtures:

```text
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
```

---

# 433. Example Notification Local Dependency Set

Required:

```text
notification_db
Kafka
```

Mocks:

```text
push provider
email provider
SMS provider
```

---

# 434. Example Integration Local Dependency Set

Required:

```text
integration_db
Kafka
```

Mocks:

```text
ERP
delivery
top-up
legacy APIs
```

Optional:

```text
SQL Server
SFTP
```

---

# 435. Version Matrix Template

```text
Java:
Spring Boot:
PostgreSQL:
Kafka:
Schema Registry:
Redis:
Docker:
Docker Compose:
Testcontainers:
```

---

# 436. Local Dependency Catalog Template

```text
Dependency:
Purpose:
Version:
Port:
Compose Profile:
Persistent Volume:
Health Check:
Reset Command:
Owner:
```

---

# 437. Mock Provider Catalog Template

```text
Provider:
Operations:
Success Scenario:
Failure Scenario:
Timeout Scenario:
Webhook Scenario:
Port:
Fixture Location:
```

---

# 438. Local Feature Scenario Template

```text
Scenario:
Services:
Seed:
Request:
Expected Response:
Expected DB State:
Expected Kafka Event:
Expected Redis State:
Cleanup:
```

---

# 439. Troubleshooting Template

```text
Symptom:
Likely Causes:
Checks:
Commands:
Expected Healthy State:
Escalation:
```

---

# 440. Onboarding Acceptance Test

A new engineer should be able to:

```text
start Order service
create one local order
observe its event
run tests
```

without undocumented help.

---

# 441. Developer Experience Continuous Improvement

Collect recurring friction:

```text
slow startup
port conflict
Kafka listener confusion
migration reset
Git authentication
Docker disk exhaustion
VPN/proxy issues
```

and turn it into automation/documentation.

---

# 442. Phase 23 Exit Criteria — Setup

Team can answer:

```text
Can a developer set up from documentation alone?
```

---

# 443. Exit Criteria — Dependencies

```text
Can PostgreSQL, Kafka, Redis, and mocks start with one reproducible command?
```

---

# 444. Exit Criteria — Isolation

```text
Can one service be developed without starting the entire platform?
```

---

# 445. Exit Criteria — Configuration

```text
Are all required local environment variables documented with safe defaults?
```

---

# 446. Exit Criteria — Data

```text
Can developers seed, inspect, and reset synthetic data safely?
```

---

# 447. Exit Criteria — Messaging

```text
Can developers inspect topics, replay local events, and test duplicate/DLQ behavior?
```

---

# 448. Exit Criteria — Security

```text
Can normal development occur without production secrets or customer data?
```

---

# 449. Exit Criteria — Debugging

```text
Can one request be traced through service, DB, Kafka, and downstream mock?
```

---

# 450. Exit Criteria — Testing

```text
Can integration tests run independently with Testcontainers?
```

---

# 451. Exit Criteria — Onboarding

```text
Can a new team member run a core service and its tests within one working session after access is granted?
```

---

# 452. Recommended ADRs

```text
ADR-DEV-001 Daily host-service/container-dependencies model
ADR-DEV-002 Supported workstation matrix
ADR-DEV-003 Windows/WSL standard
ADR-DEV-004 Git authentication standard
ADR-DEV-005 Java LTS/toolchain
ADR-DEV-006 IDE/build wrapper standard
ADR-DEV-007 Repository/local-platform layout
ADR-DEV-008 Local port registry
ADR-DEV-009 Compose profile strategy
ADR-DEV-010 PostgreSQL local topology
ADR-DEV-011 Separate service DB users
ADR-DEV-012 Local Flyway/seed/reset
ADR-DEV-013 Kafka local topology/KRaft
ADR-DEV-014 Explicit Kafka topic bootstrap
ADR-DEV-015 Local Schema Registry
ADR-DEV-016 Redis local persistence/reset
ADR-DEV-017 Host/container endpoint profiles
ADR-DEV-018 .env.example/config validation
ADR-DEV-019 Local secret/key policy
ADR-DEV-020 Local mock provider strategy
ADR-DEV-021 Local auth policy
ADR-DEV-022 Local observability optional profile
ADR-DEV-023 Testcontainers as automated integration standard
ADR-DEV-024 Task runner command contract
ADR-DEV-025 Doctor command
ADR-DEV-026 Branch/migration isolation
ADR-DEV-027 Synthetic test data policy
ADR-DEV-028 External dependency hierarchy
ADR-DEV-029 Mobile/frontend local connectivity
ADR-DEV-030 Contract generation workflow
ADR-DEV-031 Local Kubernetes optionality
ADR-DEV-032 Developer experience metrics/onboarding acceptance
```

---

# 453. Phase 23 Policy Freeze Checklist

Before team-wide adoption approve:

- [ ] Supported OS matrix.
- [ ] Windows/WSL strategy.
- [ ] Java LTS version.
- [ ] Docker/Docker Compose supported versions.
- [ ] Git authentication policy.
- [ ] Repository location recommendation on Windows.
- [ ] Line-ending policy.
- [ ] IDE/project import standard.
- [ ] Formatting toolchain.
- [ ] Monorepo vs multi-repo local infrastructure placement.
- [ ] Service README template.
- [ ] Port registry.
- [ ] Port overrides.
- [ ] Compose profiles.
- [ ] PostgreSQL major.
- [ ] Kafka version/topology.
- [ ] Redis major.
- [ ] Schema Registry requirement.
- [ ] Database naming convention.
- [ ] Local service DB user convention.
- [ ] Flyway startup behavior.
- [ ] Seed command.
- [ ] Reset guard implementation.
- [ ] Kafka topic bootstrap.
- [ ] Kafka replay/reset tools.
- [ ] Redis persistence mode.
- [ ] Host/container endpoint conventions.
- [ ] `.env.example` structure.
- [ ] Config validation.
- [ ] Local RSA key policy.
- [ ] Mock framework.
- [ ] Mock scenario triggering.
- [ ] Fake SMTP choice.
- [ ] Local push/SMS approach.
- [ ] Hot reload approach.
- [ ] JDWP binding policy.
- [ ] Local observability composition.
- [ ] Testcontainers versions/reuse.
- [ ] API fixture tool.
- [ ] Seeded local admin/customer.
- [ ] Service-to-service local auth.
- [ ] Task runner.
- [ ] Doctor checks.
- [ ] Synthetic-data policy.
- [ ] Optional MinIO/SFTP/SQL Server profiles.
- [ ] Sandbox/shared DEV hierarchy.
- [ ] Private artifact credentials.
- [ ] Proxy/VPN instructions.
- [ ] Failure scenario catalog.
- [ ] Mobile device connectivity.
- [ ] Contract generation tasks.
- [ ] Local Kubernetes policy.
- [ ] Developer onboarding SLO.
- [ ] Version upgrade test workflow.

---

# 454. Work Breakdown

Suggested tickets:

```text
DEV-001 Publish developer workstation standard
DEV-002 Publish supported OS matrix
DEV-003 Publish Windows 11 setup
DEV-004 Publish WSL2 setup
DEV-005 Decide Windows repo location guidance
DEV-006 Add .gitattributes
DEV-007 Enforce LF shell/YAML/Dockerfile
DEV-008 Standardize Git version
DEV-009 Document GitLab SSH auth
DEV-010 Document GitLab PAT auth
DEV-011 Document Git Credential Manager
DEV-012 Add Git project-not-found runbook
DEV-013 Standardize Java LTS
DEV-014 Add Java toolchain declaration
DEV-015 Document JAVA_HOME
DEV-016 Add Gradle/Maven wrapper
DEV-017 Publish IntelliJ import guide
DEV-018 Configure annotation processing guidance
DEV-019 Add .editorconfig
DEV-020 Add Spotless/format task
DEV-021 Define local pre-commit checks
DEV-022 Decide monorepo/multi-repo local platform location
DEV-023 Create platform-local structure
DEV-024 Create service README template
DEV-025 Add README to all services
DEV-026 Define host-service/container-dependency daily mode
DEV-027 Define full-container mode
DEV-028 Create local port registry
DEV-029 Add port override variables
DEV-030 Create Compose base file
DEV-031 Add infra profile
DEV-032 Add messaging profile
DEV-033 Add mocks profile
DEV-034 Add observability profile
DEV-035 Add full profile
DEV-036 Add PostgreSQL Compose
DEV-037 Pin PostgreSQL major
DEV-038 Create service databases
DEV-039 Create service DB users
DEV-040 Restrict cross-service DB permissions
DEV-041 Configure Flyway local startup
DEV-042 Create DB reset command
DEV-043 Build seed framework
DEV-044 Create test store seed
DEV-045 Create test product seed
DEV-046 Create local admin seed
DEV-047 Create local customer seed
DEV-048 Create local member/card seed
DEV-049 Add mission/promotion/reward seed
DEV-050 Make seed idempotent/reset-safe
DEV-051 Add Kafka Compose
DEV-052 Pin Kafka version
DEV-053 Configure host/container listeners
DEV-054 Configure KRaft if approved
DEV-055 Disable reliance on auto topic creation
DEV-056 Create topic bootstrap script
DEV-057 Add event topics from contract catalog
DEV-058 Add Schema Registry
DEV-059 Add optional Kafka UI
DEV-060 Add consumer reset script
DEV-061 Add replay-from-earliest script
DEV-062 Add replay-from-timestamp script
DEV-063 Add Redis Compose
DEV-064 Pin Redis major
DEV-065 Define Redis local persistence
DEV-066 Add owned-prefix cache reset
DEV-067 Add redis-cli helper
DEV-068 Add optional RedisInsight
DEV-069 Define host endpoint profile
DEV-070 Define container endpoint profile
DEV-071 Remove hard-coded localhost
DEV-072 Add .env.example to all services
DEV-073 Gitignore local .env
DEV-074 Document all required env vars
DEV-075 Add ConfigurationProperties validation
DEV-076 Add local secret bootstrap
DEV-077 Generate local RSA key pair
DEV-078 Prevent local-key reuse in shared environments
DEV-079 Add local TLS test support
DEV-080 Define local/test Spring profiles
DEV-081 Add local feature-flag controls
DEV-082 Build payment mock
DEV-083 Add payment success scenario
DEV-084 Add payment decline scenario
DEV-085 Add payment timeout scenario
DEV-086 Add payment UNKNOWN scenario
DEV-087 Add payment refund scenario
DEV-088 Add duplicate payment webhook
DEV-089 Build delivery mock
DEV-090 Add delivery state scenarios
DEV-091 Build top-up mock
DEV-092 Add top-up duplicate/network scenarios
DEV-093 Build ERP mock
DEV-094 Add ERP auth/503/duplicate scenarios
DEV-095 Add deterministic scenario selector
DEV-096 Prevent test-scenario controls in production
DEV-097 Add Mailpit/MailHog
DEV-098 Add local push strategy
DEV-099 Add local SMS strategy
DEV-100 Document bootRun commands
DEV-101 Add safe IDE run configs
DEV-102 Add optional hot reload
DEV-103 Ensure DevTools excluded from production
DEV-104 Add local JDWP profile
DEV-105 Restrict debug binding
DEV-106 Define local logging defaults
DEV-107 Add request/correlation IDs locally
DEV-108 Add optional Prometheus
DEV-109 Add optional Grafana
DEV-110 Add optional Loki
DEV-111 Add optional Tempo/Jaeger
DEV-112 Add local metrics dashboard
DEV-113 Add Testcontainers baseline
DEV-114 Pin PostgreSQL Testcontainer
DEV-115 Pin Kafka Testcontainer
DEV-116 Pin Redis Testcontainer
DEV-117 Define local Testcontainers reuse
DEV-118 Publish Docker Desktop resource guidance
DEV-119 Define low-memory selective workflow
DEV-120 Build contract-driven stubs
DEV-121 Add OpenAPI local docs
DEV-122 Select API fixture/client standard
DEV-123 Add requests/login.http
DEV-124 Add requests/order.http
DEV-125 Add requests/payment.http
DEV-126 Add requests/mission.http
DEV-127 Document token/password fixture handling
DEV-128 Document local login flow
DEV-129 Seed local admin
DEV-130 Seed local customer
DEV-131 Add local guest flow
DEV-132 Add service reset script
DEV-133 Add platform full reset
DEV-134 Add destructive reset confirmation
DEV-135 Add environment endpoint guard
DEV-136 Document DB GUI
DEV-137 Document Kafka UI/CLI
DEV-138 Document Redis CLI/UI
DEV-139 Add local architecture diagram
DEV-140 Document daily developer workflow
DEV-141 Document branch naming
DEV-142 Add branch DB isolation guide
DEV-143 Gitignore generated local state
DEV-144 Add pre-push checklist
DEV-145 Add verify command
DEV-146 Select task runner
DEV-147 Add Windows PowerShell wrappers
DEV-148 Create onboarding guide
DEV-149 Add onboarding checklist
DEV-150 Build doctor command
DEV-151 Doctor Java version
DEV-152 Doctor Docker
DEV-153 Doctor ports
DEV-154 Doctor .env
DEV-155 Doctor Git remote
DEV-156 Add port conflict runbook
DEV-157 Add Windows/XAMPP conflict guidance
DEV-158 Add Docker disk runbook
DEV-159 Add safe project cleanup
DEV-160 Add configuration drift checks
DEV-161 Enforce .env.example update rule
DEV-162 Enforce Compose update rule
DEV-163 Enforce migration local test rule
DEV-164 Enforce topic bootstrap update rule
DEV-165 Enforce mock/contract update rule
DEV-166 Add local secret scanning
DEV-167 Enforce no-production-dump rule
DEV-168 Add test-clock guidance
DEV-169 Add optional MinIO
DEV-170 Add optional SFTP
DEV-171 Add optional SQL Server profile
DEV-172 Add OData mock scenarios
DEV-173 Document local mock→sandbox→UAT hierarchy
DEV-174 Configure private artifact credentials outside Git
DEV-175 Document proxy setup
DEV-176 Document corporate CA setup
DEV-177 Add DB failure runbook
DEV-178 Add Kafka listener runbook
DEV-179 Add Redis runbook
DEV-180 Add service startup runbook
DEV-181 Add Flyway mismatch runbook
DEV-182 Add container log/shell helpers
DEV-183 Add PostgreSQL shell helper
DEV-184 Add Redis shell helper
DEV-185 Add health helper
DEV-186 Add slow SQL debugging guide
DEV-187 Add local load-test guide
DEV-188 Add local concurrency test guide
DEV-189 Add dependency stop/restart failure scripts
DEV-190 Add service restart test workflow
DEV-191 Add reconciliation local workflow
DEV-192 Add DLQ local workflow
DEV-193 Add Outbox local workflow
DEV-194 Add Inbox local workflow
DEV-195 Add cache local workflow
DEV-196 Add rate-limit local workflow
DEV-197 Add JWT/JWKS local workflow
DEV-198 Add key-rotation local workflow
DEV-199 Add Mission local workflow
DEV-200 Add Promotion local workflow
DEV-201 Add Wallet local workflow
DEV-202 Add Payment local workflow
DEV-203 Add Order local workflow
DEV-204 Add Notification local workflow
DEV-205 Add Integration local workflow
DEV-206 Create feature workflow README template
DEV-207 Add local service credentials
DEV-208 Preserve service-to-service scopes
DEV-209 Prevent blanket auth disable
DEV-210 Add local CORS
DEV-211 Publish frontend gateway URL
DEV-212 Document Android emulator alias
DEV-213 Document physical-device LAN access
DEV-214 Document local mobile TLS
DEV-215 Document local push/deep-link testing
DEV-216 Add contract client generation task
DEV-217 Prevent manual generated-code edits
DEV-218 Add local compatibility check
DEV-219 Add local static analysis command
DEV-220 Add local Dockerfile lint
DEV-221 Add local image build/smoke
DEV-222 Add local non-root/read-only tests
DEV-223 Add local SIGTERM test
DEV-224 Add local CPU/memory tests
DEV-225 Add incident reproduction template
DEV-226 Add JFR/profile guidance
DEV-227 Add pg_stat_statements guidance
DEV-228 Add Kafka lag inspection guide
DEV-229 Add Redis memory inspection guide
DEV-230 Define local metrics baseline
DEV-231 Add ArchUnit local command
DEV-232 Add contract/migration/integration pre-push guidance
DEV-233 Create feature dependency matrix
DEV-234 Pin local platform versions
DEV-235 Publish compatibility matrix
DEV-236 Add major-version upgrade process
DEV-237 Add local API/event/DB compatibility suites
DEV-238 Add Docker compatibility suite
DEV-239 Add local event publish utility
DEV-240 Add signed webhook utility
DEV-241 Decide local OIDC provider need
DEV-242 Document local Kubernetes optional use
DEV-243 Track developer productivity metrics
DEV-244 Define onboarding experience target
DEV-245 Test README with new/rotating engineer
DEV-246 Complete service-local DoD checklist
DEV-247 Complete local dependency DoD checklist
DEV-248 Complete integration local DoD checklist
DEV-249 Complete security review
DEV-250 Complete developer experience review
DEV-251 Complete Phase 23 policy freeze
DEV-252 Run onboarding acceptance test
DEV-253 Phase 23 exit review
```

---

# 455. Acceptance — Reproducible Setup

A fresh developer machine can follow documentation and reach a healthy service without undocumented help.

---

# 456. Acceptance — One-Command Dependencies

The required local:

```text
PostgreSQL
Kafka
Redis
mocks
```

can be started reproducibly using the standard command/profile.

---

# 457. Acceptance — Selective Service Development

Order Service can be developed without starting the entire platform by using local infrastructure + contract-compatible mocks.

---

# 458. Acceptance — Configuration

Every required variable has:

```text
documented purpose
example
required/optional status
secret classification
```

---

# 459. Acceptance — Local Secrets

No local workflow requires a production:

```text
DB password
JWT private key
provider secret
customer token
```

---

# 460. Acceptance — Data

A developer can:

```text
seed
inspect
reset
```

synthetic local data safely.

---

# 461. Acceptance — Destructive Safety

Reset commands cannot accidentally target:

```text
DEV
UAT
PROD
```

---

# 462. Acceptance — Database Ownership

Local Order credentials cannot query Wallet database directly.

---

# 463. Acceptance — Flyway

A fresh local DB can be recreated using:

```text
Flyway
+
seed
```

without manual schema editing.

---

# 464. Acceptance — Kafka

A developer can:

```text
create/bootstrap required topic
publish event
inspect event
reset local group
observe DLQ
replay
```

---

# 465. Acceptance — Redis

A developer can inspect and safely reset only the service-owned Redis namespace.

---

# 466. Acceptance — Mock Providers

Each critical external adapter can be exercised for:

```text
success
rejection
timeout
server failure
malformed response
duplicate callback
```

where applicable.

---

# 467. Acceptance — Auth

Normal development retains authentication and authorization behavior.

---

# 468. Acceptance — JWT

Local login produces a token that can be verified against local JWKS.

---

# 469. Acceptance — Debugging

A developer can trace one request through:

```text
service logs
DB
Kafka
mock provider
```

using correlation identifiers.

---

# 470. Acceptance — Testcontainers

Integration test command works without manually starting PostgreSQL/Kafka/Redis.

---

# 471. Acceptance — Windows

Windows 11 developer can use the documented Docker/WSL/Git workflow without line-ending or path ambiguity.

---

# 472. Acceptance — Port Conflicts

Doctor detects common occupied local ports before startup.

---

# 473. Acceptance — Branch Migration

Switching migration-heavy branches has a documented safe isolation/reset workflow.

---

# 474. Acceptance — Local Failure Injection

A developer can reproduce a documented payment timeout/decline and see the expected API/DB/Saga/event result.

---

# 475. Acceptance — Mobile

A physical mobile device can reach the developer backend through documented LAN/device tooling without production endpoints.

---

# 476. Acceptance — Documentation

A setup-affecting code change cannot be considered complete while README/local tooling remains stale.

---

# 477. Acceptance — Onboarding

A new engineer can:

```text
start Order
create one synthetic order
observe event
run tests
```

within one working session after access is granted.

---

# 478. Phase 23 Completion Tree

```text
PHASE 23 — LOCAL DEVELOPMENT

├── Developer Experience Goals               ✅
├── Workstation Standard                      ✅
├── Windows / WSL2                            ✅
├── Git / GitLab Authentication              ✅
├── Java / Toolchain                          ✅
├── IDE / Formatting                          ✅
├── Repository Layout                         ✅
├── Service README                            ✅
├── Local Development Modes                   ✅
├── Host JVM + Docker Dependencies            ✅
├── Port Registry                             ✅
├── Compose Profiles                          ✅
├── PostgreSQL                                ✅
├── Service Databases / Users                 ✅
├── Flyway                                    ✅
├── Seed / Reset                              ✅
├── Kafka / KRaft                             ✅
├── Topic Bootstrap                           ✅
├── Schema Registry                           ✅
├── Kafka UI / Replay                         ✅
├── Redis                                     ✅
├── Host vs Container Discovery               ✅
├── Environment Variables                     ✅
├── Local Secrets / RSA                       ✅
├── Local TLS                                 ✅
├── Feature Flags                             ✅
├── External Mocks                            ✅
├── Payment / Delivery / ERP / Top-Up         ✅
├── SMTP / SMS / Push                         ✅
├── Run / Hot Reload                          ✅
├── Debugging / JDWP                          ✅
├── Local Logs                                ✅
├── Correlation IDs                           ✅
├── Optional Observability                    ✅
├── Testcontainers                            ✅
├── Low-Memory Workflow                       ✅
├── Contract-Driven Stubs                     ✅
├── API Fixtures                              ✅
├── Local Authentication                      ✅
├── Synthetic Admin / Customer                ✅
├── Data Inspection / Reset                   ✅
├── Daily Workflow                            ✅
├── Branch / Migration Isolation              ✅
├── Task Runner                               ✅
├── Doctor Command                            ✅
├── Troubleshooting                           ✅
├── Config Drift Rules                        ✅
├── Local Security                            ✅
├── MinIO / SFTP / SQL Server Optional        ✅
├── Sandbox Hierarchy                         ✅
├── Proxy / Corporate CA                      ✅
├── Failure / Recovery Scenarios              ✅
├── Saga / Outbox / Inbox / DLQ               ✅
├── Mobile / Frontend                         ✅
├── Contract Generation                       ✅
├── Local Image Verification                  ✅
├── Profiling                                 ✅
├── Version Upgrade Testing                   ✅
├── DoD / Governance                          ✅
├── Onboarding Acceptance                     ✅
└── Environment Strategy Handoff              ✅
```

---

# 479. Handoff to Phase 24

The next official implementation phase is:

```text
PHASE 24 — Environment Strategy
```

It will define how the organization manages:

```text
LOCAL
CI
DEV
QA
UAT
STAGING
PERFORMANCE
SECURITY
DR
PRODUCTION
```

---

# 480. Local Development → Environment Strategy Boundary

Phase 23 defines:

```text
how one developer runs the platform safely
```

Phase 24 defines:

```text
how shared organizational environments are isolated,
configured, secured, promoted, and operated
```

---

# 481. Final Phase 23 Principle

Recommended daily workflow:

```text
IDE / Host Java Service
      ↓
Docker Local Infrastructure
      ├── PostgreSQL
      ├── Kafka
      ├── Redis
      ├── Schema Registry
      └── Mock Providers
```

Automated verification:

```text
JUnit / Integration Tests
      ↓
Testcontainers
      ├── PostgreSQL
      ├── Kafka
      └── Redis
```

The most important implementation rules are:

```text
Local development must be reproducible.
A developer should not need PostgreSQL/Kafka/Redis installed directly on the host.
Use the host JVM/IDE for fast daily edit-run-debug work.
Run infrastructure dependencies in containers.
Use Testcontainers for automated integration tests.
Do not make the entire platform mandatory for a simple service change.
Use compatible PostgreSQL/Kafka/Redis versions.
Keep database-per-service ownership even in one local PostgreSQL instance.
Use separate service DB credentials locally where practical.
Use Flyway for schema; keep development seed separate.
Do not rewrite already-shared migrations casually.
Explicitly bootstrap Kafka topics.
Do not rely only on Kafka auto-topic creation.
Configure both host and container Kafka listeners correctly.
Never hard-code localhost in business/application code.
Document every environment variable.
Keep local .env out of Git.
Use only local/sandbox secrets and keys.
Never require production secrets or customer data.
Keep authentication enabled during normal development.
Use local mocks for external providers.
Mocks cover success, rejection, timeout, 5xx, malformed response, and callback duplication.
Do not ship local scenario switches to production.
Use Mailpit/MailHog or mocks instead of real customer messaging.
Use synthetic local users, members, cards, missions, and promotions.
Make reset commands explicitly local and destructive.
Guard reset scripts against shared/non-local endpoints.
Use a shared port registry and allow safe overrides.
Use Compose profiles so developers start only what they need.
Use WSL2/documented Windows path and line-ending rules.
Use SSH/PAT rather than account passwords for GitLab where policy requires.
Treat recurring setup friction as an engineering defect.
Provide a doctor command.
Turn repeated troubleshooting answers into docs/scripts/checks.
Use correlation IDs locally.
Support local event inspection, DLQ replay, Outbox/Inbox inspection, and failure scenarios.
Use injected clocks rather than changing system time.
Prefer local mocks over unreliable external sandboxes.
Use shared DEV only when a dependency cannot reasonably run locally.
Keep CI correctness independent of shared DEV.
Version local dependencies and maintain a compatibility matrix.
Validate local Docker images for non-root, read-only, SIGTERM, and resource behavior.
Maintain contract-compatible stubs and generated clients.
Support local frontend/mobile connectivity without production URLs.
Periodically test onboarding docs with a new engineer.
A new developer should reach a working core service within one working session after access is granted.
```

---

**End of PHASE 23 — Local Development Environment**
