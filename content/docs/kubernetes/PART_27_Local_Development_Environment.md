---
title: "PART 27 — LOCAL DEVELOPMENT ENVIRONMENT"
---

# PART 27 — LOCAL DEVELOPMENT ENVIRONMENT

> **Document Role:** Defines the standard developer workstation, local runtime topology, repository workflow, dependency orchestration, configuration model, debugging strategy, local observability, test execution model, troubleshooting procedures, and onboarding requirements for working effectively with the microservices platform.  
> **Previous Part:** PART 26 — Docker  
> **Next Part:** PART 28 — Environment Strategy  
> **Status:** Developer Experience / Platform Engineering Specification  
> **Primary Stack:** Java, Spring Boot, Docker, Docker Compose, PostgreSQL, Kafka, Redis, Git, GitLab, Testcontainers, IntelliJ IDEA or equivalent  
> **Audience:** Backend engineers, full-stack engineers, QA engineers, technical leads, platform engineers, DevOps engineers, new team members.

---

# 5737 — Purpose

The Local Development Environment defines how developers work with the microservices platform every day.

It answers:

```text
What must be installed?
How should the repository be organized?
How do developers run one service?
How do developers run dependencies?
How are PostgreSQL, Kafka, and Redis started locally?
How are environment variables managed?
How do we seed/reset local data?
How are partner APIs mocked?
How do we debug?
How do we run integration tests?
How do we avoid configuration drift?
How does a new developer become productive quickly?
```

The goal is:

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

---

# 5738 — Developer Experience Goals

The development environment should be:

```text
repeatable
documented
safe
fast
isolated
production-like where it matters
easy to reset
```

It should avoid:

```text
machine-specific hidden configuration
manual database edits
shared development state
production credentials
undocumented startup order
```

---

# 5739 — Local Development Principle

A developer should not need to manually install:

```text
PostgreSQL
Kafka
Redis
Schema Registry
mock provider infrastructure
```

directly on the host when containers can provide them reliably.

Host installs should focus on:

```text
JDK
Git
IDE
Docker
build tooling if not wrapped
```

---

# 5740 — Recommended Developer Workstation

Minimum:

```text
Git
Java LTS
Docker Engine / Docker Desktop
IDE
GitLab access
SSH/PAT credentials
```

Recommended:

```text
16 GB RAM minimum
32 GB preferred for multi-service work
SSD storage
modern multi-core CPU
```

---

# 5741 — Operating Systems

Supported developer environments may include:

```text
Windows 11
macOS
Linux
```

Team documentation should explicitly state tested combinations.

---

# 5742 — Windows Development

For Windows:

```text
Windows 11
Docker Desktop or equivalent
WSL2 recommended
Git for Windows
IntelliJ IDEA
```

Avoid mixing too many path/runtime models unnecessarily.

---

# 5743 — WSL2 Guidance

WSL2 is useful for:

```text
Linux-compatible shell
Docker integration
Unix tooling
performance closer to production
```

Repository location should be chosen deliberately.

---

# 5744 — Repository Location on Windows

For best Linux-container filesystem performance:

```text
WSL filesystem
```

may outperform mounted Windows paths for very large projects.

If team uses:

```text
C:\xampp\htdocs\...
```

or other Windows paths, verify Docker bind-mount performance before standardizing.

---

# 5745 — Line Endings

Recommended Git configuration:

```text
source files:
LF in repository
```

Use `.gitattributes` to prevent shell/script breakage.

---

# 5746 — .gitattributes

Example:

```text
* text=auto
*.sh text eol=lf
*.yml text eol=lf
*.yaml text eol=lf
Dockerfile text eol=lf
```

---

# 5747 — Git Version

Use current organization-supported Git version.

Avoid team environments where:

```text
Git behavior differs materially
credential helpers differ unpredictably
```

---

# 5748 — Git Authentication

Recommended:

```text
SSH key
```

or:

```text
Personal Access Token
```

according to GitLab policy.

Do not use account passwords for Git over HTTPS where tokens are required.

---

# 5749 — SSH Development Flow

Typical:

```text
generate key
add public key to GitLab
test:
ssh -T git@gitlab.com
```

Then remote:

```text
git@gitlab.com:group/project.git
```

---

# 5750 — PAT Development Flow

For HTTPS:

```text
read_repository
write_repository
```

as needed.

Store through:

```text
Git Credential Manager
```

not plaintext files.

---

# 5751 — Repository Access Troubleshooting

If Git returns:

```text
project not found
```

check:

```text
remote URL
namespace
repository existence
account membership
SSH/PAT identity
```

before regenerating credentials repeatedly.

---

# 5752 — Java Standard

Use project-standard LTS JDK.

Example:

```text
Java 21
```

All developers should use the same major version.

---

# 5753 — Java Version Check

```bash
java -version
```

and:

```bash
./gradlew -version
```

or Maven equivalent.

---

# 5754 — Java Toolchain

Prefer Gradle/Maven toolchain configuration so build declares required Java version.

---

# 5755 — JAVA_HOME

Set consistently.

IDE and command line should use compatible JDK.

---

# 5756 — Build Wrapper

Repository should include:

```text
gradlew
gradlew.bat
```

or:

```text
mvnw
mvnw.cmd
```

Developers should not require globally matching Gradle/Maven.

---

# 5757 — IDE

Recommended:

```text
IntelliJ IDEA
```

because of strong Spring/Java support.

Equivalent IDEs are acceptable if team workflows remain compatible.

---

# 5758 — IDE Project Import

Import using:

```text
Gradle/Maven model
```

not manual source folders.

---

# 5759 — IDE JDK

IDE Project SDK must match:

```text
project toolchain
```

---

# 5760 — Annotation Processing

Enable if project uses:

```text
Lombok
MapStruct
```

according to build.

---

# 5761 — IDE Formatting

Formatting should be enforced by:

```text
Spotless
Checkstyle
EditorConfig
```

not individual preferences only.

---

# 5762 — .editorconfig

Repository should include:

```text
indentation
line endings
charset
final newline
```

---

# 5763 — Code Style Automation

Preferred:

```text
format task
```

Example:

```bash
./gradlew spotlessApply
```

---

# 5764 — Local Pre-Commit Philosophy

Pre-commit hooks may run:

```text
format
lint
small unit tests
```

but should not duplicate a 20-minute CI pipeline.

---

# 5765 — Repository Strategy

Possible:

```text
multi-repo
monorepo
```

Architecture should support either.

Initial service boundaries should not depend on repository layout.

---

# 5766 — Multi-Repo Layout

Example:

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

# 5767 — Monorepo Layout

Example:

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

# 5768 — Shared Local Infrastructure Repository

A dedicated repository/folder may contain:

```text
docker-compose.yml
Kafka setup
Redis
PostgreSQL utilities
mock providers
local observability
```

---

# 5769 — Service Repository Minimum Files

Recommended:

```text
README.md
Dockerfile
.dockerignore
.env.example
build.gradle / pom.xml
src/
docker-compose.override.yml optional
docs/
```

---

# 5770 — README Requirements

Each service README should explain:

```text
purpose
port
dependencies
environment variables
how to run
how to test
how to reset
common failures
```

---

# 5771 — Local Development Modes

Support three main modes:

```text
Mode A:
Service on host + dependencies in Docker

Mode B:
Service + dependencies in Docker Compose

Mode C:
Multiple services in Compose
```

---

# 5772 — Recommended Daily Mode

For active Java development:

```text
service runs from IDE/Gradle on host
dependencies run in Docker
```

Benefits:

```text
fast restart
debugger
hot reload
less image rebuild
```

---

# 5773 — Full Container Mode

Useful for:

```text
container verification
cross-service behavior
environment parity
```

Not always optimal for edit-run cycle.

---

# 5774 — Local Runtime Topology

Typical:

```text
Developer
   │
   ▼
Service on localhost:808x
   │
   ├── PostgreSQL container
   ├── Redis container
   ├── Kafka container
   ├── Schema Registry container
   └── Mock Provider container
```

---

# 5775 — Local Port Registry

Maintain standard local ports.

Example:

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
Schema Registry   8085 or adjusted to avoid conflict
```

Actual assignments must avoid collisions.

---

# 5776 — Port Registry Rule

Do not allow every developer to invent service ports.

Maintain:

```text
docs/local-ports.md
```

---

# 5777 — Port Override

Every local port should be overridable with environment variable.

Example:

```text
ORDER_SERVER_PORT=18083
```

---

# 5778 — Docker Compose Profiles

Recommended:

```text
infra
messaging
observability
mocks
full
```

---

# 5779 — Infra Profile

Contains:

```text
PostgreSQL
Redis
```

---

# 5780 — Messaging Profile

Contains:

```text
Kafka
Schema Registry
optional Kafka UI
```

---

# 5781 — Observability Profile

Contains:

```text
Prometheus
Grafana
Loki
Tempo/Jaeger
```

---

# 5782 — Mocks Profile

Contains:

```text
WireMock
MockServer
fake SMTP
fake provider endpoints
```

---

# 5783 — Full Profile

Contains all required services for broad integration testing.

---

# 5784 — Compose Start

Example:

```bash
docker compose --profile infra --profile messaging up -d
```

---

# 5785 — Compose Stop

```bash
docker compose down
```

---

# 5786 — Compose Reset

Destructive:

```bash
docker compose down -v
```

Team wrapper should make destructive intent clear.

---

# 5787 — Local PostgreSQL

Use same major version as target environment.

---

# 5788 — PostgreSQL Container Configuration

Define:

```text
database
user
password
port
volume
healthcheck
```

with local-only credentials.

---

# 5789 — Multiple Service Databases

Database-per-service principle still applies locally.

Options:

```text
one PostgreSQL instance
multiple databases
```

is acceptable for local development.

---

# 5790 — Local DB Example

One local PostgreSQL instance may host:

```text
identity_db
catalog_db
order_db
payment_db
wallet_db
loyalty_db
notification_db
integration_db
```

This does not violate logical ownership as long as services have separate credentials/schemas/databases.

---

# 5791 — Local DB Credentials

Prefer separate local users:

```text
identity_user
order_user
wallet_user
```

to catch accidental cross-service access.

---

# 5792 — Cross-Service DB Protection

Even locally:

```text
Order should not have permission to query wallet_db.
```

---

# 5793 — Flyway Local Startup

Service applies migrations to its local database.

---

# 5794 — Local Migration Reset

For clean state:

```text
drop/recreate local DB
run Flyway
seed development data
```

---

# 5795 — Never Edit Migration After Shared Use

Once migration is committed/used by others:

```text
create a new migration
```

do not rewrite history casually.

---

# 5796 — Local Seed Data

Separate:

```text
schema migration
```

from:

```text
development seed
```

---

# 5797 — Seed Data Examples

```text
test stores
test products
test customer
test admin role
test missions
test promotions
```

---

# 5798 — Seed Idempotency

Seed command should be:

```text
safe to rerun
```

or explicitly reset-first.

---

# 5799 — Seed Versioning

When reference data changes materially:

```text
update seed version
```

so developers can reproduce scenarios.

---

# 5800 — Local PostgreSQL Backup

Not required for disposable dev data.

Developer may export useful manual test data separately.

---

# 5801 — Local Kafka

Use version compatible with production.

---

# 5802 — Kafka Local Mode

Prefer simplified single-node Kafka for development.

Production HA topology is unnecessary locally.

---

# 5803 — Kafka KRaft

Modern local Kafka may run:

```text
KRaft
```

without ZooKeeper if production version supports it.

---

# 5804 — Kafka Topics Local Creation

Options:

```text
IaC/bootstrap script
application auto-create disabled
```

Preferred:

```text
explicit topic bootstrap
```

to match production governance.

---

# 5805 — Local Topic Bootstrap

Script creates:

```text
order.events.v1
payment.events.v1
wallet.events.v1
loyalty.events.v1
mission.events.v1
promotion.events.v1
notification.events.v1
```

as required.

---

# 5806 — Auto Topic Creation

Do not rely on broker:

```text
auto.create.topics.enable=true
```

as the only workflow.

It can hide naming/config mistakes.

---

# 5807 — Local Partition Count

May be lower than production for resource efficiency.

But integration tests needing partition behavior should configure enough partitions.

---

# 5808 — Local Schema Registry

Run when event schemas use registry.

---

# 5809 — Schema Registration

Service startup/tests may register dev schemas.

CI still performs compatibility checks.

---

# 5810 — Kafka UI

Optional local tool:

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

# 5811 — Kafka UI Security

Local-only.

Do not copy unsecured configuration into production.

---

# 5812 — Local Consumer Group Reset

Developers may reset offsets for testing.

Use explicit scripts.

---

# 5813 — Replay Script

Possible:

```text
reset to earliest
reset to timestamp
```

for local groups only.

---

# 5814 — Local Redis

Use compatible Redis major version.

---

# 5815 — Redis Local Persistence

Can use:

```text
named volume
```

or ephemeral mode.

Developer should know reset semantics.

---

# 5816 — Redis CLI

Optional local tooling:

```text
redis-cli
```

via container exec.

---

# 5817 — Redis GUI

Optional:

```text
RedisInsight
```

local only.

---

# 5818 — Redis Namespace

Even locally, service prefixes must match documented naming.

---

# 5819 — Local Cache Reset

Service-specific reset should delete only owned prefix where possible.

Do not use:

```text
FLUSHALL
```

against shared team Redis.

---

# 5820 — Local Service Discovery

When service runs on host:

```text
dependencies may be localhost ports
```

When service runs inside Compose:

```text
dependencies use Compose DNS names
```

---

# 5821 — Dual Endpoint Profiles

Example:

```text
host mode:
KAFKA_BOOTSTRAP=localhost:9092

container mode:
KAFKA_BOOTSTRAP=kafka:29092
```

---

# 5822 — Avoid Hard-Coded localhost

Application code should never hard-code:

```text
localhost
```

Dependencies come from configuration.

---

# 5823 — Environment Variable Strategy

Every service maintains:

```text
.env.example
```

with safe placeholders.

---

# 5824 — .env

Local developer `.env`:

```text
gitignored
```

---

# 5825 — Environment Variable Categories

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

# 5826 — Required vs Optional Config

README/config validator identifies:

```text
required
optional
default
```

---

# 5827 — Local Secrets

Use fake values.

Examples:

```text
LOCAL_JWT_PRIVATE_KEY
LOCAL_PROVIDER_API_KEY
```

must never match UAT/PROD.

---

# 5828 — Local RSA Keys

For Identity development:

```text
generate dedicated local RSA key pair
```

stored outside Git or in explicitly safe fixture if security team approves a known development-only key.

---

# 5829 — Development-Only Key Warning

Never reuse:

```text
local private key
```

in UAT/PROD.

---

# 5830 — Secret Bootstrap Script

Could generate:

```text
local RSA key
local certificates
mock provider secret
```

automatically.

---

# 5831 — Local TLS

Internal local services may run HTTP for convenience if production TLS termination is external.

But provider/security integration tests should also support TLS scenarios.

---

# 5832 — Local HTTPS Testing

Use:

```text
self-signed/local CA
```

only when testing TLS-specific behavior.

---

# 5833 — Application Profiles

Possible:

```text
local
test
```

Do not let profiles change core business rules.

---

# 5834 — Local Profile

May configure:

```text
localhost endpoints
verbose logging
mock provider
```

---

# 5835 — Test Profile

Used by automated tests.

Should not depend on developer machine state.

---

# 5836 — Feature Flags Locally

Developers should be able to enable:

```text
new wallet flow
new mission behavior
new provider adapter
```

with local flags.

---

# 5837 — Feature Flag Defaults

Default local behavior should match current production baseline unless feature specifically being developed.

---

# 5838 — Mock External Providers

External dependencies should have local mock strategy.

Examples:

```text
payment gateway
delivery partner
ERP
SMS provider
email provider
top-up provider
```

---

# 5839 — WireMock

Good for:

```text
REST provider simulation
```

---

# 5840 — MockServer

Alternative for:

```text
HTTP/HTTPS behavior
```

---

# 5841 — Mock Provider Requirements

Must support:

```text
success
business rejection
timeout
500/503
malformed response
duplicate callback
```

---

# 5842 — Payment Mock

Scenarios:

```text
authorize success
decline
timeout
unknown outcome
capture
refund
duplicate webhook
```

---

# 5843 — Delivery Mock

Scenarios:

```text
DRIVER_ALLOCATED
DRIVER_ARRIVED
COLLECTED
DELIVERED
CANCELLED
```

---

# 5844 — Top-Up Mock

Scenarios:

```text
provider success
provider decline
network failure
duplicate transaction
```

---

# 5845 — ERP Mock

Simulate:

```text
create document
duplicate document
503
authentication failure
```

---

# 5846 — Mock Data Determinism

Request parameters may trigger scenarios.

Example:

```text
amount=13.13 → timeout
amount=14.14 → decline
```

or explicit test header in local/test only.

---

# 5847 — No Test Switch in Production

Development scenario controls must not be enabled in production.

---

# 5848 — Fake SMTP

Use:

```text
MailHog
Mailpit
```

for local email testing.

---

# 5849 — Local Push Testing

Options:

```text
provider sandbox
mock FCM adapter
test device token
```

Do not send production push to real customers.

---

# 5850 — Local SMS Testing

Use mock provider rather than paid real SMS by default.

---

# 5851 — Service Run Command

Standard Gradle example:

```bash
./gradlew bootRun
```

or:

```bash
./gradlew :order-service:bootRun
```

---

# 5852 — Maven Run Command

```bash
./mvnw spring-boot:run
```

---

# 5853 — IDE Run Configuration

Each service should have documented run config:

```text
main class
profile
env file
port
```

---

# 5854 — Shared IDE Run Configuration

Can commit safe `.run/` configuration if IDE supports and secrets are not embedded.

---

# 5855 — Hot Reload

Possible:

```text
Spring DevTools
IDE automatic rebuild
JRebel
```

Use only for developer productivity.

---

# 5856 — Spring DevTools

Local dependency only.

Must not be packaged into production runtime.

---

# 5857 — Fast Restart

Prefer:

```text
host JVM + Docker dependencies
```

for rapid edit-run-debug.

---

# 5858 — Debugging

Standard Java debugger:

```text
breakpoints
step
inspect variables
```

---

# 5859 — Host Debugging

When app runs from IDE:

```text
debugging is simplest
```

---

# 5860 — Container Debugging

Local container may expose JDWP.

Example:

```text
5005
```

local interface only.

---

# 5861 — Debug Port Safety

Never expose JDWP on:

```text
0.0.0.0
```

in shared/untrusted environments.

---

# 5862 — Remote Attach

Use only for:

```text
local development
controlled non-production
```

---

# 5863 — Logging During Development

Local profile may use:

```text
human-readable logs
DEBUG for selected packages
```

---

# 5864 — Avoid Global DEBUG

Global debug logging creates noise and may expose sensitive fields.

Enable targeted packages.

---

# 5865 — SQL Logging

Use carefully.

Can help debugging but may expose:

```text
PII
tokens
large SQL
```

---

# 5866 — Hibernate SQL

Enable only when needed.

Prefer repository-level diagnostics and database logs for serious SQL work.

---

# 5867 — Correlation ID Local

Even local requests should generate:

```text
request_id
correlation_id
```

so tracing habits match production.

---

# 5868 — Local Observability

Optional profile should provide:

```text
Prometheus
Grafana
Loki
Tempo/Jaeger
```

---

# 5869 — Local Metrics

Developer can inspect:

```text
request latency
DB pool
Kafka consumer lag
cache hit/miss
JVM memory
```

---

# 5870 — Local Tracing

Useful for:

```text
Order → Payment → Kafka → Notification
```

cross-service debugging.

---

# 5871 — Local Log Aggregation

Optional.

Not required for single-service work.

---

# 5872 — Developer Simplicity Rule

Minimal development should not require:

```text
Grafana
Loki
Tempo
```

unless task needs them.

---

# 5873 — Testcontainers

Automated integration tests should use Testcontainers.

Do not require developer to manually start shared:

```text
PostgreSQL
Kafka
Redis
```

before running tests.

---

# 5874 — Testcontainers Prerequisite

Docker engine must be available.

---

# 5875 — Testcontainers Reuse

Local reuse may speed tests.

CI should prioritize isolation/reproducibility.

---

# 5876 — Testcontainers Image Versions

Pin versions compatible with platform.

---

# 5877 — Docker Desktop Resource Allocation

Developers may need to allocate enough:

```text
CPU
RAM
disk
```

for Kafka/PostgreSQL/Redis.

---

# 5878 — Low-Memory Workstation

Use selective profiles.

Do not require full platform Compose.

---

# 5879 — Service Stubbing Strategy

When not running dependent service:

```text
mock port
WireMock
local stub
```

depending development need.

---

# 5880 — Contract-Driven Stub

Stub should be generated/validated against:

```text
OpenAPI
Protobuf
event fixture
```

where possible.

---

# 5881 — Avoid Hand-Written Drift

Mocks must not silently diverge from actual provider contract.

---

# 5882 — Local API Documentation

Expose:

```text
OpenAPI
Swagger UI
```

locally for developer convenience.

---

# 5883 — API Collection

Team may maintain:

```text
Postman
Bruno
HTTP files
```

for manual testing.

---

# 5884 — Recommended API Client

Choose one team standard where useful.

Repository may include:

```text
requests/
```

with `.http` files.

---

# 5885 — HTTP Test Files

Example:

```text
requests/
├── login.http
├── order.http
├── payment.http
└── mission.http
```

---

# 5886 — Environment Variables in API Client

Do not commit real:

```text
token
password
secret
```

Use local environment file.

---

# 5887 — Local Authentication Flow

Developers should be able to:

```text
seed user
login
obtain token
call protected API
```

with documented steps.

---

# 5888 — Local Admin User

Seed one safe local admin role/user.

---

# 5889 — Local Customer User

Seed one local customer.

---

# 5890 — Local Guest Flow

Support guest test path without fake production account dependencies.

---

# 5891 — Local Card/Member Mapping

Seed synthetic:

```text
member ID
card number
```

for loyalty/order flows.

---

# 5892 — Test Data Names

Use obviously synthetic values.

Example:

```text
DEV Customer 001
```

---

# 5893 — Local Data Refresh

Team may provide:

```text
make seed
```

or:

```text
./gradlew seedLocal
```

---

# 5894 — Local Reset Workflow

Recommended:

```text
stop service
reset owned DB
clear owned Redis prefix
reset selected Kafka consumer groups/topics if necessary
rerun migrations
seed
```

---

# 5895 — Full Local Reset

Platform wrapper:

```text
make local-reset
```

can recreate all local volumes.

---

# 5896 — Reset Safety

Command must clearly display:

```text
LOCAL DATA WILL BE DELETED
```

and must never target non-local endpoints.

---

# 5897 — Environment Guard

Reset scripts validate:

```text
host == localhost/container-local
environment == local
```

before destructive operation.

---

# 5898 — Local Database GUI

Optional:

```text
DBeaver
DataGrip
pgAdmin
```

---

# 5899 — Database GUI Security

Store only local credentials where possible.

Do not encourage saving production credentials.

---

# 5900 — Redis Inspection

Use:

```text
redis-cli
RedisInsight
```

for owned keys.

---

# 5901 — Kafka Inspection

Use:

```text
Kafka UI
console consumer
```

for development only.

---

# 5902 — Local Architecture Diagram

README should include:

```text
ports
service relationships
dependencies
```

---

# 5903 — Developer Workflow

Typical:

```text
git pull
      ↓
start local infra
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

# 5904 — Start-of-Day Workflow

Example:

```bash
docker compose --profile infra --profile messaging up -d
./gradlew bootRun
```

---

# 5905 — End-of-Day Workflow

Usually:

```text
stop service
```

but Docker dependencies may remain running if developer prefers.

---

# 5906 — Branch Workflow

Feature branch naming follows Git policy.

Example:

```text
feature/BP-610/BROWN-APP-REWAMP-PHASE-1
```

or current team standard.

---

# 5907 — Local Branch Isolation

Schema changes between branches can conflict.

Options:

```text
reset DB when switching
separate Compose project
branch-specific volume
```

---

# 5908 — Branch-Specific Database

For migration-heavy work:

```text
DB_NAME=order_feature_123
```

can isolate branches.

---

# 5909 — Git Cleanliness

Generated:

```text
build/
logs/
local data/
.env
```

must be gitignored.

---

# 5910 — Pre-Push Checklist

Recommended:

```text
format
unit tests
integration tests relevant to change
migration validation
```

---

# 5911 — Local CI Approximation

Provide one command:

```text
make verify
```

or:

```text
./gradlew check integrationTest
```

to approximate MR CI.

---

# 5912 — Makefile / Task Runner

Optional but useful.

Commands:

```text
dev-up
dev-down
dev-reset
test
verify
seed
logs
```

---

# 5913 — Cross-Platform Task Runner

If Make is awkward on Windows, use:

```text
Gradle tasks
PowerShell scripts
Taskfile
just
```

Standardize one approach.

---

# 5914 — PowerShell Support

For Windows-first team, scripts may provide:

```text
dev-up.ps1
dev-reset.ps1
```

alongside shell equivalents if needed.

---

# 5915 — Script Portability

Business logic should not depend on OS-specific shell behavior.

---

# 5916 — New Developer Onboarding

Goal:

```text
clone repository
follow README
run one command
see service healthy
run tests
```

---

# 5917 — Onboarding Checklist

- [ ] Git access.
- [ ] Java installed.
- [ ] Docker working.
- [ ] Repository cloned.
- [ ] `.env` created from example.
- [ ] Local infra starts.
- [ ] Service starts.
- [ ] Migrations run.
- [ ] Seed data loaded.
- [ ] Login/API call succeeds.
- [ ] Unit tests pass.
- [ ] Integration tests pass.

---

# 5918 — Onboarding Time

Team should monitor whether setup takes:

```text
hours/days
```

due to undocumented dependencies.

High onboarding friction is a platform defect.

---

# 5919 — Setup Validation Script

Provide:

```text
doctor
```

command.

Checks:

```text
Java version
Docker availability
ports
Git
environment files
```

---

# 5920 — Doctor Command

Possible:

```bash
./scripts/dev-doctor.sh
```

or PowerShell equivalent.

---

# 5921 — Doctor Output

Example:

```text
Java 21       OK
Docker        OK
Postgres port FREE
Kafka port    FREE
.env          OK
Git remote    OK
```

---

# 5922 — Port Conflict Detection

Before startup, script checks:

```text
5432
6379
9092
service port
```

---

# 5923 — Windows Port Conflict

Common sources:

```text
local MySQL/PostgreSQL
XAMPP
other Docker project
IDE debug process
```

---

# 5924 — Docker Container Name Collision

Use Compose project scope.

Avoid fixed global `container_name` unless necessary.

---

# 5925 — Docker Disk Usage

Local Kafka/PostgreSQL images/volumes can consume large disk.

Developers should know:

```bash
docker system df
```

---

# 5926 — Docker Cleanup

Use carefully:

```bash
docker system prune
```

Do not run destructive global cleanup blindly.

---

# 5927 — Safe Project Cleanup

Prefer:

```bash
docker compose down -v
```

within project.

---

# 5928 — Stale Containers

If behavior differs unexpectedly:

```text
check old containers/networks/volumes
```

---

# 5929 — Image Refresh

After base/dependency change:

```text
docker compose pull
```

or rebuild.

---

# 5930 — Local Build Cache Problems

If build appears stale:

```text
clean Gradle/Maven
rebuild image without cache only when needed
```

Do not make `--no-cache` default.

---

# 5931 — Configuration Drift

Local configuration must be reviewed when:

```text
new env variable
new topic
new DB
new provider
```

is added.

---

# 5932 — .env.example Update Rule

Any new required environment variable must update:

```text
.env.example
README
config validation
```

in same merge request.

---

# 5933 — Compose Update Rule

Any new local dependency must update:

```text
compose
healthcheck
README
doctor script
```

---

# 5934 — Migration Update Rule

Any DB migration should include:

```text
local migration test
seed compatibility
```

---

# 5935 — Topic Update Rule

Any new Kafka topic should include:

```text
local bootstrap
schema
topic catalog
```

---

# 5936 — Mock Update Rule

Any external contract change should update:

```text
mock provider
contract fixture
tests
```

---

# 5937 — Local Security Principles

Never store:

```text
production DB dump
production API key
production JWT private key
customer PII
```

in local development environment.

---

# 5938 — Production Dump Prohibition

If production-like data is needed:

```text
generate synthetic
or use approved anonymized dataset
```

---

# 5939 — Clipboard / Chat Secret Risk

Developers should avoid copying production secrets into:

```text
tickets
chat
logs
README
```

---

# 5940 — Local Secret Scanner

Pre-commit/CI may scan repository for:

```text
private keys
tokens
password patterns
```

---

# 5941 — Local Admin Endpoints

Admin/debug endpoints may be enabled locally.

Production exposure remains restricted.

---

# 5942 — Debug Fixtures

Test-only fixture endpoints are acceptable only if:

```text
compiled/profile-restricted
impossible to enable accidentally in production
```

---

# 5943 — Local Time

System timezone differences must not alter business logic.

Use:

```text
UTC persistence
explicit timezone rules
```

---

# 5944 — Time Travel Testing

Developers may use:

```text
test clock
```

rather than changing host clock.

---

# 5945 — Local Email Capture

MailHog/Mailpit allows inspecting:

```text
password reset
order email
security email
```

without real delivery.

---

# 5946 — Local File Storage

If service uses object storage, local environment may use:

```text
MinIO
```

or filesystem adapter only if semantics remain compatible.

---

# 5947 — MinIO

Good for S3-compatible local testing.

---

# 5948 — Local Object Storage Reset

Treat as disposable synthetic data.

---

# 5949 — Local SFTP

For integration testing:

```text
SFTP container
```

may simulate partner file exchange.

---

# 5950 — Local SQL Server

If legacy integration requires SQL Server:

```text
Docker SQL Server container
```

may be used where license/architecture permits.

Otherwise use controlled shared non-prod legacy environment.

---

# 5951 — SQL Server Resource Cost

SQL Server container can be heavy.

Keep optional profile.

---

# 5952 — Legacy DB Mock

For most development, adapter contract tests may use:

```text
Testcontainer / mock repository / fixture DB
```

rather than shared legacy UAT.

---

# 5953 — Local OData Mock

WireMock can simulate:

```text
$filter
$expand
pagination responses
sentinel dates
```

---

# 5954 — External Dependency Hierarchy

Preferred development order:

```text
local mock
sandbox
shared UAT
production never
```

---

# 5955 — Sandbox Availability

If third-party sandbox is unreliable, local mock must let developers continue.

---

# 5956 — Offline Development

Core domain tests should run without internet.

Integration tests should mostly use local containers/mocks.

---

# 5957 — Dependency Download

First build may require internet for Maven/Gradle images/dependencies.

After cache, development should be more resilient.

---

# 5958 — Private Artifact Repository

If organization uses private Maven repository:

```text
credentials are developer-scoped
```

and configured outside source control.

---

# 5959 — Maven/Gradle Credentials

Store in:

```text
~/.gradle/gradle.properties
~/.m2/settings.xml
credential manager
```

according to security policy.

---

# 5960 — Local Build Proxy

Corporate proxy configuration should be documented if required.

---

# 5961 — Certificate Trust Issues

Corporate TLS inspection may require approved CA installation.

Do not disable:

```text
SSL verification
```

globally.

---

# 5962 — Git TLS Errors

Fix trust store/certificate path.

Do not set:

```text
http.sslVerify=false
```

as team standard.

---

# 5963 — Java TLS Errors

Verify:

```text
JDK truststore
corporate CA
hostname
certificate chain
```

---

# 5964 — Docker Registry TLS Errors

Use trusted CA/registry config.

Do not configure insecure registry unless local-only and explicitly isolated.

---

# 5965 — Local Database Connection Failure

Checklist:

```text
container running?
port mapped?
DB healthy?
database exists?
credentials correct?
Flyway applied?
```

---

# 5966 — Local Kafka Connection Failure

Checklist:

```text
broker running?
advertised listeners correct?
host vs container endpoint?
topic exists?
client security mode?
```

---

# 5967 — Kafka Advertised Listener Trap

Local Kafka needs different addresses for:

```text
host clients
container clients
```

Configure explicitly.

---

# 5968 — Local Redis Failure

Checklist:

```text
container running?
port?
auth?
wrong DB/prefix?
```

---

# 5969 — Service Startup Failure

Checklist:

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

# 5970 — Flyway Failure

Check:

```text
migration checksum
manual DB edits
branch switching
schema version
```

---

# 5971 — Flyway Checksum Mismatch

In local-only disposable DB:

```text
reset may be simplest
```

Do not teach developers to repair production migration history casually.

---

# 5972 — Migration Branch Conflict

When switching branches:

```text
reset local DB
```

if migration histories diverge.

---

# 5973 — "Port Already in Use"

Find process/container.

Windows:

```powershell
netstat -ano | findstr :8080
```

or modern equivalent.

---

# 5974 — Docker Container Logs

```bash
docker compose logs -f <service>
```

---

# 5975 — Container Shell

Local debug image may allow:

```bash
docker exec -it <container> sh
```

Production image may not.

---

# 5976 — Database Shell

```bash
docker exec -it postgres psql ...
```

for local troubleshooting.

---

# 5977 — Redis Shell

```bash
docker exec -it redis redis-cli
```

---

# 5978 — Kafka Console Consumer

Useful to inspect local event.

Avoid relying on this as automated verification.

---

# 5979 — Local HTTP Health

Example:

```text
GET /actuator/health
```

---

# 5980 — Local Readiness

Verify service:

```text
UP
```

before manual testing.

---

# 5981 — Log Levels

Recommended local defaults:

```text
application INFO
selected package DEBUG
framework INFO/WARN
```

---

# 5982 — SQL Slow Query

Developer can enable:

```text
PostgreSQL log_min_duration_statement
```

locally for query performance debugging.

---

# 5983 — EXPLAIN ANALYZE

Use local representative data for critical SQL.

---

# 5984 — Local Load Testing

Developers may run small k6/Gatling scenarios against local service.

Large official load tests belong in dedicated environment.

---

# 5985 — Local Concurrency Testing

Testcontainers/Gradle test can run:

```text
concurrent wallet/inventory/promotion scenarios
```

without shared UAT.

---

# 5986 — Local Chaos Testing

Simple:

```text
docker stop redis
docker stop kafka
```

to verify fallback/recovery.

---

# 5987 — Dependency Restart Testing

Restart:

```text
PostgreSQL
Redis
Kafka
mock provider
```

while app runs.

Observe client reconnection.

---

# 5988 — Service Restart Testing

Restart app during:

```text
Saga
Kafka consumption
scheduled worker
```

using local synthetic data.

---

# 5989 — Local Data Reconciliation

Developers should be able to run:

```text
reconciliation command/job
```

against local synthetic mismatches.

---

# 5990 — Local DLQ Workflow

Developers should know how to:

```text
produce bad event
observe DLQ
fix
replay
```

---

# 5991 — Local Outbox Workflow

Inspect:

```text
outbox row
Kafka publish
published_at
```

for debugging event reliability.

---

# 5992 — Local Inbox Workflow

Replay same event and confirm:

```text
processed_events
```

prevents duplicate side effect.

---

# 5993 — Local Cache Workflow

Inspect:

```text
miss
set
hit
invalidation
TTL
```

for cache feature.

---

# 5994 — Local Rate-Limit Workflow

Use script to trigger:

```text
allowed
threshold
429
cooldown expiry
```

---

# 5995 — Local JWT Workflow

Developer should be able to:

```text
login
decode safe claims
verify kid
refresh
logout
```

---

# 5996 — Local JWKS

Identity exposes local JWKS endpoint for signed local tokens.

---

# 5997 — Local Key Rotation Simulation

Optional script:

```text
generate new key
activate new kid
verify old/new behavior
```

---

# 5998 — Local Mission Workflow

Seed:

```text
Journey mission
Campaign mission
reward
```

then publish qualifying event.

---

# 5999 — Local Promotion Workflow

Seed:

```text
coupon
usage limit
budget
```

test reserve/redeem/release.

---

# 6000 — Local Wallet Workflow

Seed wallet.

Test:

```text
top-up
reserve
capture
release
refund
```

with synthetic amounts.

---

# 6001 — Local Payment Workflow

Mock provider.

Test:

```text
authorize
capture
timeout
unknown
refund
```

---

# 6002 — Local Order Workflow

Test:

```text
cart
checkout
accepted
ready
done
cancel
```

---

# 6003 — Local Notification Workflow

Test:

```text
OrderReady event
notification record
push mock
in-app inbox
```

---

# 6004 — Local Integration Workflow

Test:

```text
webhook
signature
mapping
canonical event
```

---

# 6005 — Developer Feature Workflow Template

For each feature README:

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

# 6006 — API Example Requests

Provide copyable examples for:

```text
login
create cart
checkout
complete order
```

without real secrets.

---

# 6007 — Local Service Accounts

Use fake internal service JWT/client credentials.

---

# 6008 — Service-to-Service Auth Locally

Can be simplified but should preserve:

```text
identity/scopes
```

so authorization bugs are visible before UAT.

---

# 6009 — Disabling Auth Locally

Avoid a blanket:

```text
security.disabled=true
```

for normal development.

It hides integration/security problems.

---

# 6010 — Controlled Auth Bypass

If test-only bypass exists:

```text
local profile only
explicit warning
not packaged/enabled in production
```

---

# 6011 — Local CORS

Frontend developers may need:

```text
localhost origins
```

configured via local profile.

Do not weaken production CORS.

---

# 6012 — Frontend Integration

Backend can publish local gateway endpoint:

```text
http://localhost:8080
```

for web/mobile development.

---

# 6013 — Mobile Device Testing

Physical phone cannot reach computer via:

```text
localhost
```

Use:

```text
LAN IP
ADB reverse
emulator host alias
```

depending platform.

---

# 6014 — Android Emulator

Common host alias:

```text
10.0.2.2
```

for host machine.

Document current emulator tooling.

---

# 6015 — iOS Simulator

Can often reach host `localhost`, but verify current network setup.

---

# 6016 — Physical Device

Use developer machine LAN IP.

Ensure firewall only allows trusted local network.

---

# 6017 — Local TLS for Mobile

If HTTPS required, install trusted development certificate carefully.

---

# 6018 — Backend URL Configuration

Mobile/web app should have:

```text
local/dev environment base URL
```

not hard-coded production.

---

# 6019 — Local Push on Device

Use test project/configuration only.

---

# 6020 — Local QR / Deep Link Testing

Use local/test deep-link schemes.

---

# 6021 — Developer Database Ownership

Each service team manages:

```text
its migrations
its seed
its local DB troubleshooting
```

---

# 6022 — Shared Reference Data

Store/reference seed should have clear owner.

Do not duplicate inconsistent copies across services.

---

# 6023 — Local Contract Repository

If shared contracts exist:

```text
OpenAPI
Proto
Kafka schemas
```

developers should generate clients from local versioned source.

---

# 6024 — Client Generation

Provide task:

```text
generateApiClient
generateProto
```

---

# 6025 — Generated Code

Do not hand-edit generated client classes.

---

# 6026 — Contract Change Workflow

```text
edit contract
run compatibility check
regenerate client
run tests
commit
```

---

# 6027 — Local Schema Registry Compatibility

Developers can run check before push.

CI remains authoritative.

---

# 6028 — Local Static Analysis

Provide:

```text
./gradlew check
```

or equivalent.

---

# 6029 — Local Sonar

Full Sonar server not required locally.

Use local lint/unit tools; CI integrates SonarCloud/Server.

---

# 6030 — Sonar Issues

Developers should fix:

```text
bugs
security vulnerabilities
critical code smells
```

according to team policy.

---

# 6031 — Local Secret Scan

May run pre-commit or `make verify`.

---

# 6032 — Local Dependency Check

Optional:

```text
OWASP Dependency-Check
Gradle dependency updates
```

CI is authoritative.

---

# 6033 — Local Dockerfile Lint

Run:

```text
hadolint Dockerfile
```

or CI equivalent.

---

# 6034 — Local Image Build

Before container-related change:

```bash
docker build -t service:local .
```

---

# 6035 — Local Image Smoke

```bash
docker run ...
```

and check health.

---

# 6036 — Local Image Non-Root

Verify:

```bash
docker run --rm service:local id
```

if image contains `id`; otherwise inspect config.

---

# 6037 — Local Read-Only Test

Run:

```text
read-only root filesystem
temporary /tmp mount
```

before Kubernetes hardening.

---

# 6038 — Local Graceful Stop

Run:

```bash
docker stop
```

and inspect shutdown logs.

---

# 6039 — Local Resource Limits

Test:

```text
--memory
--cpus
```

for JVM behavior.

---

# 6040 — Developer Troubleshooting Philosophy

Troubleshooting should move from:

```text
configuration
→ dependency health
→ logs
→ metrics
→ database/event state
```

not random code changes.

---

# 6041 — Troubleshooting Checklist

```text
1. Is service running?
2. Is port free?
3. Are dependencies healthy?
4. Are environment variables correct?
5. Did migrations succeed?
6. Is authentication valid?
7. Is event/topic present?
8. Are logs showing canonical error?
```

---

# 6042 — Common Error: Connection Refused

Likely:

```text
dependency not started
wrong host
wrong port
container/host endpoint mismatch
```

---

# 6043 — Common Error: Authentication Failed

Check:

```text
local credentials
JWT issuer/audience
service scopes
Git PAT/SSH if source operation
```

---

# 6044 — Common Error: 403

Could be:

```text
application authorization
provider firewall/WAF
invalid token scope
```

Do not assume all 403s mean same thing.

---

# 6045 — Common Error: 503

Check:

```text
dependency health
circuit breaker
provider
database
Kafka
```

---

# 6046 — Common Error: Kafka Consumer Not Receiving

Check:

```text
topic
partition
consumer group
offset
serialization
ACL/security
```

---

# 6047 — Common Error: Duplicate Event Effect

Check:

```text
event_id
processed_events
business unique constraint
consumer retry
```

---

# 6048 — Common Error: Redis Stale Data

Check:

```text
TTL
version
invalidation
wrong namespace
old container
```

---

# 6049 — Common Error: Migration Checksum

Likely branch/local history mismatch.

Reset local DB if disposable.

---

# 6050 — Common Error: Docker Disk Full

Clean project volumes/images carefully.

Increase disk allocation if needed.

---

# 6051 — Common Error: Windows File Permission

Check:

```text
bind mount
WSL ownership
Git executable bit
```

---

# 6052 — Common Error: Shell Script CRLF

Convert to:

```text
LF
```

and enforce `.gitattributes`.

---

# 6053 — Common Error: Slow Docker on Windows

Possible:

```text
bind mounts from Windows filesystem
low Docker memory
antivirus scanning
```

Use WSL filesystem or optimized volumes if appropriate.

---

# 6054 — Common Error: Kafka Advertised Listener

Host app may not resolve:

```text
kafka
```

Container app may not resolve:

```text
localhost
```

Use correct listener.

---

# 6055 — Common Error: Service Starts but Not Ready

Check:

```text
DB
migrations
critical config
startup health
```

---

# 6056 — Common Error: JWT kid Not Found

Check:

```text
Identity JWKS
cache
key rotation
issuer URL
```

---

# 6057 — Common Error: Provider Mock Does Not Match

Check:

```text
request path
headers
body
scenario state
```

---

# 6058 — Local Incident Reproduction

When reproducing production issue:

```text
use synthetic equivalent data
same software version
same config shape
same DB/Kafka/Redis versions
```

Do not import raw production secrets/data.

---

# 6059 — Reproduction Record

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

# 6060 — Reproducible Bug Script

Add:

```text
integration test
HTTP fixture
or seed scenario
```

once root cause understood.

---

# 6061 — Local Performance Profiling

Tools:

```text
Java Flight Recorder
VisualVM
async-profiler
```

as organization permits.

---

# 6062 — JFR

Useful for:

```text
CPU
allocation
GC
locks
```

---

# 6063 — Profiling Safety

Use development/synthetic data.

Profiles may contain method arguments/context depending tooling.

---

# 6064 — Local SQL Profiling

Use:

```text
EXPLAIN ANALYZE
pg_stat_statements
```

where enabled.

---

# 6065 — Local Kafka Lag Inspection

Kafka UI/CLI can show:

```text
current offset
end offset
lag
```

---

# 6066 — Local Redis Memory Inspection

Use:

```text
INFO MEMORY
MEMORY USAGE
```

for key design experiments.

---

# 6067 — Developer Metrics Baseline

Before optimization, measure:

```text
latency
query count
cache hit
events
```

---

# 6068 — Local Optimization Rule

Do not add:

```text
cache
async complexity
extra thread pool
```

without evidence.

---

# 6069 — Local Architecture Tests

Run ArchUnit in normal test suite.

---

# 6070 — Local Contract Tests

Run before pushing contract changes.

---

# 6071 — Local Migration Tests

Run whenever migration changes.

---

# 6072 — Local Integration Tests

Run affected service integration suite before MR.

---

# 6073 — Local E2E

Optional for developer; CI/shared environment runs broader suite.

---

# 6074 — Developer Feedback Speed

Target workflow:

```text
unit test seconds
integration test minutes
local service restart seconds
```

Exact numbers depend project.

---

# 6075 — Slow Feedback Smell

If every change requires:

```text
full platform restart
```

architecture/dev tooling needs improvement.

---

# 6076 — Service Independence Goal

Developer should usually be able to work on one service with:

```text
local dependencies + mocks
```

without starting the entire platform.

---

# 6077 — Contract Independence

Service can compile/test against:

```text
versioned contracts
```

without live provider.

---

# 6078 — Database Independence

Each service migration/testing isolated.

---

# 6079 — Kafka Independence

Consumer test uses local Kafka/Testcontainers.

---

# 6080 — Redis Independence

Cache/rate-limit test uses local Redis/Testcontainers.

---

# 6081 — Local Configuration Documentation

Every variable documented:

```text
name
purpose
required?
example
secret?
```

---

# 6082 — Environment Variable Table

Example:

| Variable | Required | Example | Secret |
|---|---|---|---|
| DB_URL | Yes | jdbc:postgresql://localhost:5432/order_db | No |
| DB_USER | Yes | order_user | No |
| DB_PASSWORD | Yes | local-order-password | Yes |
| KAFKA_BOOTSTRAP | Yes | localhost:9092 | No |
| REDIS_HOST | No | localhost | No |

---

# 6083 — Local Config Validation

Startup error should say:

```text
DB_URL missing
```

rather than fail later with NullPointerException.

---

# 6084 — Config Schema

Could use:

```text
@ConfigurationProperties
validation annotations
```

---

# 6085 — Local Feature Matrix

Document which features require which dependencies.

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

# 6086 — Dependency Minimization

Developers start only needed services.

---

# 6087 — Shared Local Platform Script

Possible:

```text
platform-local/
├── compose.yml
├── scripts/
├── seed/
├── mocks/
└── README.md
```

---

# 6088 — Local Platform Versioning

Pin:

```text
PostgreSQL
Kafka
Redis
Schema Registry
mock images
```

---

# 6089 — Compose Lockstep

Changes to local stack should be versioned with architecture/runtime changes.

---

# 6090 — Local Compatibility Matrix

Maintain:

```text
Java
Spring Boot
PostgreSQL
Kafka
Redis
Docker
```

supported versions.

---

# 6091 — Developer Upgrade Policy

When Java/Docker major version changes:

```text
announce
update docs
update CI
update doctor script
```

---

# 6092 — IDE Upgrade

Do not block work on exact IDE minor version unless plugin compatibility requires it.

---

# 6093 — Docker Upgrade

Test Compose/Kafka compatibility before forcing team-wide upgrade.

---

# 6094 — WSL Upgrade

Document known issues if Windows tooling changes.

---

# 6095 — Local Observability Example Flow

```text
POST /orders
      ↓
trace ID
      ↓
Order span
      ↓
Payment span
      ↓
Kafka produce span
      ↓
Notification consume span
```

Developer can view in tracing UI.

---

# 6096 — Local Metrics Example

Observe:

```text
http_server_requests
db pool
Kafka lag
Redis hit ratio
JVM heap
```

---

# 6097 — Local Dashboard as Learning Tool

Optional dashboards help developers understand:

```text
distributed behavior
```

not only operations.

---

# 6098 — Local Alerting

Full PagerDuty-style alerting unnecessary locally.

Grafana alerts may be disabled.

---

# 6099 — Local Logs Retention

Short-lived.

No need for production-grade retention.

---

# 6100 — Local Data Classification

Synthetic data remains:

```text
non-production
```

but secrets and tokens should still be handled safely.

---

# 6101 — Development Admin Permission

Local admin can have broad permissions for testing.

Do not infer production RBAC from local convenience.

---

# 6102 — Development Provider Credentials

Use:

```text
sandbox key
mock key
```

never production.

---

# 6103 — Development Cloud Resources

If some integration cannot run locally, use dedicated:

```text
DEV cloud resource
```

with separate credentials.

---

# 6104 — Shared DEV Dependency

Document:

```text
availability
rate limits
data reset
ownership
```

---

# 6105 — Shared DEV Is Not CI

Automated correctness must not depend entirely on unstable shared DEV.

---

# 6106 — Local Database Schema Inspection

Developers may compare:

```text
Flyway history
expected tables
indexes
```

after migration.

---

# 6107 — Local Event Schema Inspection

Schema Registry UI/API shows:

```text
subject
version
compatibility
```

---

# 6108 — Local API Version Testing

Developers can run old request fixtures to verify backward compatibility.

---

# 6109 — Local Mobile Compatibility Testing

Backend can provide fixture clients for supported app version contracts.

---

# 6110 — Developer Documentation Ownership

Service owner maintains README.

Platform team maintains:

```text
global setup
Compose
doctor script
version matrix
```

---

# 6111 — Documentation Review Rule

Code change affecting setup must update docs in same MR.

---

# 6112 — Outdated README Is a Defect

If setup instructions fail:

```text
fix documentation/tooling
```

not rely on tribal knowledge.

---

# 6113 — Tribal Knowledge Reduction

Any repeated Slack/Teams troubleshooting answer should become:

```text
README
runbook
doctor check
script
```

---

# 6114 — Local Runbook

Maintain:

```text
common startup errors
port conflicts
migration reset
Kafka listener issue
Docker disk issue
Git auth issue
```

---

# 6115 — Developer Self-Service

Goal:

```text
developers solve common issues without waiting for DevOps
```

through automation/documentation.

---

# 6116 — Local Support Escalation

Escalate when:

```text
organization credential
VPN
GitLab permission
shared infrastructure
```

is actually the cause.

---

# 6117 — VPN

If corporate services require VPN:

```text
document which dependencies
```

Local mocks should reduce mandatory VPN use.

---

# 6118 — Proxy/VPN + Docker

Docker container network may not inherit host VPN/proxy automatically.

Document setup if required.

---

# 6119 — DNS with VPN

Corporate DNS may affect:

```text
GitLab
artifact registry
shared DEV
```

Troubleshoot separately from application DNS.

---

# 6120 — Time Synchronization

Developer host/container clocks should be correct.

Incorrect clock can break:

```text
JWT
TLS
Kafka
OTP
```

---

# 6121 — Developer Test Clock

Never change system time to test expiry.

Use injected clock.

---

# 6122 — Local Backup Before Destructive Migration

Not required for disposable DB, but developer may dump important manually created scenario.

---

# 6123 — Local DB Dump

```bash
pg_dump
```

can export synthetic scenario.

---

# 6124 — Fixture Promotion

Useful local scenario should become:

```text
versioned seed
automated test fixture
```

not personal DB state.

---

# 6125 — Local Data Ownership Reset

Reset only databases/keys owned by project.

---

# 6126 — Cross-Project Docker Safety

Use Compose project isolation to avoid deleting another project's volumes.

---

# 6127 — Local Kafka Topic Reset Safety

Topic delete/reset command must target:

```text
local broker only
```

---

# 6128 — Local Secret Rotation Test

Developers can test:

```text
DB password change
JWT key rotation
provider key rotation
```

using local-only secrets.

---

# 6129 — Local Certificate Expiry Test

Use short-lived test certificate where integration logic needs expiry handling.

---

# 6130 — Local Failure Injection

Mock provider can support header:

```text
X-Test-Scenario
```

only in local/test environment.

---

# 6131 — Failure Scenario Catalog

Maintain:

```text
PAYMENT_TIMEOUT
PAYMENT_DECLINED
INVENTORY_503
REDIS_DOWN
KAFKA_DOWN
```

for repeatable developer testing.

---

# 6132 — Scenario Automation

Scripts can run:

```text
./scripts/scenario-checkout-payment-timeout.sh
```

---

# 6133 — Scenario Expected Result

Each script documents:

```text
API result
DB state
Saga state
events
compensation
```

---

# 6134 — Local Regression Reproduction

Production bug should ideally become one scenario/test.

---

# 6135 — Developer Branch Database Migration Discipline

Before changing migration:

```text
pull/rebase latest
```

to avoid duplicate Flyway version numbers.

---

# 6136 — Migration Naming

Example:

```text
V17__create_payment_attempts.sql
```

or timestamp strategy.

Team standard must prevent collisions.

---

# 6137 — Timestamp Migration Version

In large multi-developer repository:

```text
YYYYMMDDHHMMSS
```

may reduce collision.

---

# 6138 — Local Migration Failure on Duplicate Version

Resolve by:

```text
renumbering unshared local migration
```

before merge.

---

# 6139 — Shared Migration Immutability

Once merged/released:

```text
never renumber/edit casually
```

---

# 6140 — Local Git Hooks

Possible hooks:

```text
format check
secret scan
migration duplicate check
```

---

# 6141 — Hook Bypass

CI remains authoritative because local hooks can be skipped.

---

# 6142 — Local Dependency Health Command

Provide:

```text
make health
```

showing:

```text
PostgreSQL
Kafka
Redis
mocks
```

---

# 6143 — Local Service Health Matrix

Example:

```text
PostgreSQL  UP
Kafka       UP
Redis       UP
PaymentMock UP
Order       UP
```

---

# 6144 — Local Event Publish Utility

A dev tool may publish valid test event from fixture.

Useful for:

```text
Mission
Notification
Loyalty
```

consumer development.

---

# 6145 — Event Utility Safety

Only local/test Kafka endpoint.

---

# 6146 — Local Webhook Utility

Generate signed mock webhook matching partner algorithm.

---

# 6147 — Webhook Signature Fixture

Tests/dev tooling share canonical signing helper.

---

# 6148 — Local OAuth/OIDC Provider

If using external IdP, local environment may use:

```text
Keycloak
mock OIDC
```

only if architecture requires.

If Identity Service owns auth directly, unnecessary.

---

# 6149 — Local Service Mesh

Do not require service mesh locally for normal development.

Network behavior should remain testable without it.

---

# 6150 — Local Kubernetes

Tools like:

```text
kind
k3d
minikube
```

are optional for Kubernetes-specific development.

Normal service development uses Docker/Compose.

---

# 6151 — When to Use Local Kubernetes

Use for:

```text
Helm/Kustomize
probes
network policy
service discovery
ingress
```

testing.

---

# 6152 — Local Kubernetes Cost

Heavier than Compose.

Do not make mandatory for all developers unless deployment work requires.

---

# 6153 — Local Container Registry

Optional for:

```text
kind
k3d
```

image testing.

---

# 6154 — Developer Productivity Metrics

Possible signals:

```text
setup success rate
time to first successful run
test duration
local restart time
number of recurring setup tickets
```

---

# 6155 — Developer Experience SLO

Informal target:

```text
new developer can run a core service within one working session
```

subject to access approvals.

---

# 6156 — Developer Documentation Test

Periodically ask:

```text
new/rotating engineer follows README without verbal help
```

and fix gaps.

---

# 6157 — Local Platform Version Upgrade Test

Before changing shared Compose versions:

```text
run critical integration suites
```

---

# 6158 — PostgreSQL Major Upgrade Local

Developers should test:

```text
migration
SQL behavior
driver compatibility
```

before environment rollout.

---

# 6159 — Kafka Upgrade Local

Test:

```text
producer
consumer
schema registry
rebalance
```

---

# 6160 — Redis Upgrade Local

Test:

```text
Lua scripts
TTL
client compatibility
cluster behavior where relevant
```

---

# 6161 — Java Upgrade Local

Test:

```text
build
unit/integration
container
performance smoke
```

---

# 6162 — Spring Boot Upgrade Local

Check:

```text
Actuator
serialization
security
Kafka client
Flyway
```

---

# 6163 — Dependency Lockfile Update

Developers intentionally update dependencies, not accidentally through floating versions.

---

# 6164 — Local API Compatibility Suite

Old fixture requests run against current service.

---

# 6165 — Local Event Compatibility Suite

Historical event fixtures run against current consumer.

---

# 6166 — Local Database Compatibility Suite

Previous migration snapshot upgrades to current.

---

# 6167 — Local Docker Compatibility Suite

Current service image runs with pinned Compose dependencies.

---

# 6168 — Local Environment Definition of Done

A new service is locally developable when:

- [ ] README exists.
- [ ] Build wrapper works.
- [ ] Java version documented.
- [ ] `.env.example` exists.
- [ ] Local database configured.
- [ ] Flyway works.
- [ ] Seed data exists if needed.
- [ ] Kafka topics bootstrap if needed.
- [ ] Redis config if needed.
- [ ] External mocks if needed.
- [ ] Run command documented.
- [ ] Tests run locally.
- [ ] Docker image builds.
- [ ] Troubleshooting documented.

---

# 6169 — Definition of Done: New Local Dependency

- [ ] Version pinned.
- [ ] Compose service.
- [ ] Healthcheck.
- [ ] Port documented.
- [ ] Environment variables.
- [ ] Startup/reset scripts.
- [ ] Resource usage considered.
- [ ] README updated.

---

# 6170 — Definition of Done: New External Integration

- [ ] Local mock.
- [ ] Success scenario.
- [ ] Failure scenario.
- [ ] Timeout scenario.
- [ ] Webhook scenario if relevant.
- [ ] Contract fixture.
- [ ] Sandbox instructions.
- [ ] No production credentials required.

---

# 6171 — Definition of Done: Developer Tooling

- [ ] Cross-platform where required.
- [ ] Safe defaults.
- [ ] Local-only destructive commands guarded.
- [ ] Help text.
- [ ] Exit codes.
- [ ] README.
- [ ] CI-independent but compatible.

---

# 6172 — Developer Workstation Review Checklist

- [ ] Java version.
- [ ] Git.
- [ ] Docker.
- [ ] IDE.
- [ ] WSL2 guidance if Windows.
- [ ] Disk space.
- [ ] Port conflicts.
- [ ] Credential setup.
- [ ] Proxy/VPN guidance.

---

# 6173 — Repository Review Checklist

- [ ] README.
- [ ] `.editorconfig`.
- [ ] `.gitattributes`.
- [ ] `.gitignore`.
- [ ] `.dockerignore`.
- [ ] `.env.example`.
- [ ] wrapper scripts.
- [ ] local scripts.
- [ ] fixtures.
- [ ] migration folder.

---

# 6174 — Compose Review Checklist

- [ ] Pinned versions.
- [ ] Profiles.
- [ ] Health checks.
- [ ] Named volumes.
- [ ] Local-only credentials.
- [ ] No fixed global container names unless needed.
- [ ] Port overrides.
- [ ] Reset workflow.
- [ ] Resource footprint.

---

# 6175 — Database Review Checklist

- [ ] Production-compatible PostgreSQL.
- [ ] Separate service DBs/users.
- [ ] Flyway.
- [ ] Seed.
- [ ] Reset.
- [ ] No production dump.
- [ ] Branch migration guidance.

---

# 6176 — Kafka Review Checklist

- [ ] Compatible version.
- [ ] Topic bootstrap.
- [ ] Correct host/container listeners.
- [ ] Schema Registry.
- [ ] UI optional.
- [ ] Reset/replay scripts.
- [ ] Event fixtures.

---

# 6177 — Redis Review Checklist

- [ ] Compatible version.
- [ ] Prefix standards.
- [ ] Persistence choice.
- [ ] Safe reset.
- [ ] CLI/UI optional.
- [ ] Rate-limit/cache test scenarios.

---

# 6178 — Security Review Checklist

- [ ] No production secrets.
- [ ] Local keys only.
- [ ] `.env` ignored.
- [ ] Secret scan.
- [ ] Production dumps prohibited.
- [ ] Auth enabled for normal development.
- [ ] Debug ports local-only.
- [ ] Reset commands environment-guarded.

---

# 6179 — Developer Experience Review Checklist

- [ ] One-command infra start.
- [ ] One-command reset.
- [ ] One-command verify.
- [ ] Doctor command.
- [ ] Common troubleshooting.
- [ ] New developer onboarding tested.
- [ ] Dependencies selective, not full-stack mandatory.

---

# 6180 — Local Development Production-Readiness Checklist

Before the platform is considered developer-ready:

- [ ] Supported OSes documented.
- [ ] Windows/WSL instructions verified.
- [ ] Java/toolchain pinned.
- [ ] Docker/Compose versions supported.
- [ ] Shared port registry exists.
- [ ] PostgreSQL/Kafka/Redis versions align with target.
- [ ] Compose profiles work.
- [ ] All required topics bootstrap.
- [ ] Seed/reset works.
- [ ] Testcontainers work.
- [ ] External mocks cover critical paths.
- [ ] Local auth/JWT works.
- [ ] Local traces/metrics optional profile works.
- [ ] Docker images build locally.
- [ ] Doctor script detects common issues.
- [ ] No production secrets/data required.
- [ ] README onboarding verified.

---

# 6181 — Initial Implementation Order

Recommended:

```text
1. Java/Git/Docker workstation standard
2. Global local-development README
3. Shared port registry
4. PostgreSQL Compose
5. Redis Compose
6. Kafka + Schema Registry Compose
7. Service `.env.example`
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

# 6182 — Minimum Viable Local Development Standard

Every developer should be able to:

```text
clone
configure local env
start dependencies
run one service
run migrations
load seed data
authenticate
call API
run unit/integration tests
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

# 6183 — Local Development Governance

Architecture/platform review should reject:

```text
service requiring production credentials locally
manual DB schema creation
undocumented environment variables
unversioned local dependency images
hard-coded localhost in application code
mandatory full-platform startup for simple service work
shared production-like PII dump
```

---

# 6184 — Standard Developer Commands

Recommended logical command set:

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

Implementation may use:

```text
Gradle
PowerShell
Taskfile
Make
```

---

# 6185 — Example Developer Session

```text
1. git pull
2. dev-up
3. doctor
4. seed
5. run order-service in IDE
6. call login endpoint
7. run checkout fixture
8. inspect Kafka event
9. run tests
10. commit
```

---

# 6186 — Example Failure-Debug Session

```text
Checkout returns dependency unavailable
      ↓
check correlation ID
      ↓
check Order logs
      ↓
check mock Payment health
      ↓
check Kafka/DB if async
      ↓
reproduce scenario
      ↓
add regression test
```

---

# 6187 — Example New Developer Day-One Flow

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

# 6188 — Example Order-Service Local Dependency Set

```text
Required:
order_db
Kafka

Usually:
Redis

Mocks:
Catalog
Inventory
Promotion
Payment/Wallet
Customer

Optional:
Notification
Loyalty
Mission
```

This keeps local development focused.

---

# 6189 — Example Identity-Service Local Dependency Set

```text
Required:
identity_db

Usually:
Redis

Optional:
Mailpit
Notification mock
```

---

# 6190 — Example Catalog-Service Local Dependency Set

```text
Required:
catalog_db

Usually:
Redis

Optional:
object storage mock
```

---

# 6191 — Example Payment-Service Local Dependency Set

```text
Required:
payment_db
Kafka

Mocks:
payment provider

Optional:
Redis
```

---

# 6192 — Example Wallet-Service Local Dependency Set

```text
Required:
wallet_db
Kafka

Optional:
Redis read cache
```

---

# 6193 — Example Mission-Service Local Dependency Set

```text
Required:
mission_db
Kafka

Optional:
Redis

Fixtures:
OrderCompleted
WalletTopUpCompleted
FeedbackSubmitted
```

---

# 6194 — Example Notification-Service Local Dependency Set

```text
Required:
notification_db
Kafka

Mocks:
push provider
email provider
SMS provider
```

---

# 6195 — Example Integration-Service Local Dependency Set

```text
Required:
integration_db
Kafka

Mocks:
ERP
delivery
top-up
legacy APIs

Optional:
SQL Server / SFTP profile
```

---

# 6196 — Developer Environment Version Matrix Template

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

# 6197 — Local Dependency Catalog Template

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

# 6198 — Mock Provider Catalog Template

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

# 6199 — Local Feature Scenario Template

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

# 6200 — Developer Troubleshooting Template

```text
Symptom:
Likely Causes:
Checks:
Commands:
Expected Healthy State:
Escalation:
```

---

# 6201 — Onboarding Acceptance Test

A new engineer should be able to follow docs and complete:

```text
start Order service
create one local order
observe event
run tests
```

without undocumented help.

---

# 6202 — Developer Environment Continuous Improvement

Collect recurring friction.

Examples:

```text
slow startup
port conflict
Kafka listener confusion
migration reset
Git auth
```

Automate/document them.

---

# 6203 — PART 27 Deliverables

PART 27 produces:

1. Developer experience goals.
2. Supported workstation strategy.
3. Windows/WSL guidance.
4. Git and GitLab authentication guidance.
5. Java/toolchain standard.
6. IDE setup.
7. Formatting/editor standards.
8. Repository organization guidance.
9. Service README requirements.
10. Local development modes.
11. Port registry.
12. Docker Compose profiles.
13. PostgreSQL local architecture.
14. Database-per-service local strategy.
15. Flyway/seed/reset workflow.
16. Kafka local architecture.
17. Topic bootstrap.
18. Schema Registry/Kafka UI.
19. Redis local architecture.
20. Host vs container service discovery.
21. Environment variable strategy.
22. Local secret/key handling.
23. Mock provider strategy.
24. SMTP/SMS/push local testing.
25. Run/debug/hot-reload workflow.
26. Local logging.
27. Optional observability stack.
28. Testcontainers integration.
29. Resource-constrained workstation guidance.
30. API request fixtures.
31. Local authentication workflow.
32. Local customer/admin test accounts.
33. Data reset workflow.
34. Database/Kafka/Redis inspection tools.
35. Daily developer workflow.
36. Branch/migration isolation.
37. Task runner commands.
38. New-developer onboarding.
39. Doctor script.
40. Port/Docker troubleshooting.
41. Config-drift controls.
42. Local security rules.
43. Optional object storage/SFTP/SQL Server.
44. External sandbox hierarchy.
45. Private artifact/proxy/certificate guidance.
46. Common dependency troubleshooting.
47. Local failure/recovery scenarios.
48. Local Saga/outbox/inbox/DLQ workflows.
49. Mobile/frontend local connectivity.
50. Contract generation/compatibility.
51. Docker/image verification locally.
52. Developer support/runbooks.
53. Version-upgrade testing.
54. Definition-of-Done checklists.
55. Production-readiness checklist.
56. Governance rules.
57. Command/catalog/templates.
58. Service-specific dependency examples.
59. Onboarding acceptance test.

---

# 6204 — Exit Criteria

PART 27 is complete when the team can answer:

### Setup

```text
Can a developer set up the environment from documentation alone?
```

### Dependencies

```text
Can PostgreSQL, Kafka, Redis, and mocks be started with one reproducible command?
```

### Isolation

```text
Can one service be developed without starting the entire platform?
```

### Configuration

```text
Are all required local environment variables documented with safe defaults?
```

### Data

```text
Can developers seed, inspect, and reset synthetic data safely?
```

### Messaging

```text
Can developers inspect topics, replay local events, and test duplicate/DLQ behavior?
```

### Security

```text
Can all normal development occur without production secrets or customer data?
```

### Debugging

```text
Can a developer trace one request through service, DB, Kafka, and downstream mock?
```

### Testing

```text
Can integration tests run independently with Testcontainers?
```

### Onboarding

```text
Can a new team member run a core service and its tests within one working session after access is granted?
```

If these answers are clear and repeatable, the Local Development Environment is ready for team-wide use.

---

# 6205 — Handoff to PART 28

PART 28 defines Environment Strategy.

```text
PART 27
Local Development Environment
      ↓
Developer-Safe Reproducible Runtime
      ↓
PART 28
Environment Strategy
```

PART 28 will define:

```text
LOCAL
DEV
QA
UAT
STAGING
PERFORMANCE
PRODUCTION
Environment Isolation
Configuration Promotion
Secrets
Data Strategy
Release Flow
Feature Flags
Environment Parity
Access Control
Test Data
Database/Kafka/Redis Separation
Partner Endpoints
Change Management
```

The key transition is:

```text
PART 27
= how one developer runs the platform safely

PART 28
= how the organization manages multiple shared environments consistently
```

---

# PART 27 — Summary

The Local Development Environment turns the architecture into a usable daily engineering workflow.

Recommended daily model:

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

Automated tests use:

```text
Testcontainers
```

instead of shared mutable infrastructure.

The most important rules are:

```text
Local development must be reproducible.
Production secrets and customer data are never required.
Developers should start only the dependencies they need.
Service dependencies are configured, never hard-coded.
PostgreSQL/Kafka/Redis versions stay compatible with production.
Database migrations and seed data are separate.
Mocks cover success, failure, timeout, and callback behavior.
Testcontainers are the default for automated integration tests.
Reset commands are safe and explicitly local.
Auth remains enabled during normal development.
Windows/WSL path, line-ending, and Docker issues are documented.
Every new configuration/dependency updates README and local tooling.
Developer setup friction is treated as an engineering problem.
```

The next chapter defines the shared deployment environments and how configuration, data, credentials, and releases move between them:

```text
PART 28 — Environment Strategy
```

---

**End of PART 27 — Local Development Environment**
