---
title: "Phase 1 — Project Foundation"
---

# Phase 1 — Project Foundation

## Purpose

Phase 1 establishes the development foundation for the microservices platform.

The target developer workflow is:

```text
git clone
   ↓
copy .env.example → .env
   ↓
dev-up
   ↓
PostgreSQL + Redis + Kafka + Schema Registry + mocks start
   ↓
doctor / health check
   ↓
developer can begin building a service
```

The foundation should support a repeatable local workflow:

```text
clone
↓
configure
↓
start
↓
develop
↓
test
↓
debug
↓
reset
```

---

# 1. Repository Structure

Recommended initial monorepo-style workspace:

```text
brown-platform/
│
├── README.md
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .dockerignore
├── .env.example
├── docker-compose.yml
│
├── services/
│   ├── identity-service/
│   ├── customer-service/
│   ├── catalog-service/
│   ├── inventory-service/
│   ├── cart-service/
│   ├── ordering-service/
│   ├── payment-service/
│   ├── wallet-service/
│   ├── loyalty-service/
│   ├── promotion-service/
│   ├── notification-service/
│   └── integration-service/
│
├── contracts/
│   ├── openapi/
│   ├── protobuf/
│   ├── events/
│   └── schemas/
│
├── infrastructure/
│   ├── postgres/
│   │   └── bootstrap/
│   ├── kafka/
│   │   ├── topics/
│   │   └── scripts/
│   ├── redis/
│   ├── mocks/
│   │   └── wiremock/
│   └── observability/
│
├── scripts/
│   ├── dev-up.sh
│   ├── dev-down.sh
│   ├── dev-reset.sh
│   ├── dev-health.sh
│   ├── dev-doctor.sh
│   ├── dev-up.ps1
│   ├── dev-down.ps1
│   ├── dev-reset.ps1
│   ├── dev-health.ps1
│   └── dev-doctor.ps1
│
├── fixtures/
│   ├── api/
│   ├── kafka/
│   ├── providers/
│   └── seed/
│
└── docs/
    ├── local-development.md
    ├── local-ports.md
    ├── dependencies.md
    ├── troubleshooting.md
    └── onboarding.md
```

Do not implement business logic yet.

The service folders may remain empty until their implementation phases.

---

# 2. Developer Workstation Standard

## Required

```text
Git
Java LTS
Docker Desktop / Docker Engine
Docker Compose
GitLab access
IDE
```

## Recommended

```text
IntelliJ IDEA
WSL2 on Windows
16 GB RAM minimum
32 GB RAM preferred
SSD storage
Modern multi-core CPU
```

## Do Not Require Manual Installation Of

```text
PostgreSQL
Kafka
Redis
Schema Registry
```

These should run through Docker.

---

# 3. Java Toolchain

Each service should declare its required Java version using Gradle or Maven toolchains.

Recommended build wrapper:

```text
gradlew
gradlew.bat
```

or:

```text
mvnw
mvnw.cmd
```

Developers should not require globally matching Gradle or Maven versions.

Recommended build system:

```text
Gradle
```

Example future service structure:

```text
identity-service/
├── gradlew
├── gradlew.bat
├── gradle/
└── build.gradle.kts
```

---

# 4. `.editorconfig`

Create:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{yml,yaml,json}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[*.{sh,bash}]
end_of_line = lf

[*.bat]
end_of_line = crlf
```

---

# 5. `.gitattributes`

Create:

```text
* text=auto

*.java text eol=lf
*.kt text eol=lf
*.kts text eol=lf
*.gradle text eol=lf

*.yml text eol=lf
*.yaml text eol=lf
*.json text eol=lf
*.md text eol=lf

*.sh text eol=lf
Dockerfile text eol=lf

*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf

*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.pdf binary
```

---

# 6. `.gitignore`

Create:

```text
# IDE
.idea/
*.iml
.vscode/

# Java / Gradle
.gradle/
build/
out/
target/

# Environment
.env
.env.local
.env.*.local

# Local keys / certificates
.local-secrets/
*.pem
*.key
*.p12
*.jks

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Docker local state
docker-data/

# Temporary
tmp/
temp/

# Test output
coverage/
test-results/
```

Never commit:

```text
.env
private keys
local certificates
```

---

# 7. `.dockerignore`

Create:

```text
.git
.gitignore
.idea
.vscode

.gradle
build
target
out

.env
.env.*

*.log

docs/
tmp/
```

---

# 8. `.env.example`

Every service and the foundation repository should expose configuration explicitly.

Example:

```dotenv
# ==========================================================
# PROJECT
# ==========================================================

COMPOSE_PROJECT_NAME=brown-platform
LOCAL_ENV=true


# ==========================================================
# POSTGRESQL
# Exact image/version must match approved target environment.
# ==========================================================

POSTGRES_IMAGE=postgres:<APPROVED_VERSION>

POSTGRES_HOST=localhost
POSTGRES_PORT=5432

POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=local_postgres_only


# ==========================================================
# REDIS
# ==========================================================

REDIS_IMAGE=redis:<APPROVED_VERSION>

REDIS_HOST=localhost
REDIS_PORT=6379


# ==========================================================
# KAFKA
# ==========================================================

KAFKA_IMAGE=<APPROVED_KAFKA_IMAGE>
KAFKA_HOST=localhost
KAFKA_PORT=9092
KAFKA_BOOTSTRAP_SERVERS=localhost:9092


# ==========================================================
# SCHEMA REGISTRY
# ==========================================================

SCHEMA_REGISTRY_IMAGE=<APPROVED_SCHEMA_REGISTRY_IMAGE>
SCHEMA_REGISTRY_PORT=8089


# ==========================================================
# MOCKS
# ==========================================================

WIREMOCK_PORT=9090


# ==========================================================
# LOCAL SECURITY
# ==========================================================

JWT_PRIVATE_KEY_PATH=.local-secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=.local-secrets/jwt-public.pem


# ==========================================================
# LOGGING
# ==========================================================

LOG_LEVEL=DEBUG
```

Do not use:

```text
latest
```

for production-target dependency images.

Pin versions after the approved environment versions are confirmed.

---

# 9. Local Port Registry

Create:

```text
docs/local-ports.md
```

Recommended assignments:

| Component | Port |
|---|---:|
| API Gateway | 8080 |
| Identity | 8081 |
| Customer | 8082 |
| Catalog | 8083 |
| Inventory | 8084 |
| Cart | 8085 |
| Ordering | 8086 |
| Payment | 8087 |
| Wallet | 8088 |
| Loyalty | 8090 |
| Promotion | 8091 |
| Mission module/service | 8092 |
| Notification | 8093 |
| Integration | 8094 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka External | 9092 |
| Schema Registry | 8089 |
| WireMock | 9090 |
| Mailpit SMTP | 1025 |
| Mailpit UI | 8025 |

Every service port should be overridable.

Example:

```dotenv
IDENTITY_SERVER_PORT=8081
```

---

# 10. Docker Compose Profiles

Recommended profiles:

```text
infra
messaging
mocks
observability
full
```

Preferred local topology:

```text
                    Developer / IDE
                          │
                          ▼
                   Spring Boot Service
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
      PostgreSQL        Redis            Kafka
                                            │
                                            ▼
                                     Schema Registry

                          │
                          ▼
                       WireMock
```

Daily development should normally run:

```text
Java service on host / IDE
+
dependencies in Docker
```

---

# 11. `docker-compose.yml`

Initial structure:

```yaml
services:

  postgres:
    image: ${POSTGRES_IMAGE}
    profiles:
      - infra
      - full

    environment:
      POSTGRES_USER: ${POSTGRES_ADMIN_USER}
      POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD}

    ports:
      - "${POSTGRES_PORT}:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/bootstrap:/docker-entrypoint-initdb.d:ro

    healthcheck:
      test:
        [
          "CMD-SHELL",
          "pg_isready -U ${POSTGRES_ADMIN_USER}"
        ]
      interval: 5s
      timeout: 5s
      retries: 10

    networks:
      - brown_local


  redis:
    image: ${REDIS_IMAGE}
    profiles:
      - infra
      - full

    ports:
      - "${REDIS_PORT}:6379"

    volumes:
      - redis_data:/data

    healthcheck:
      test:
        [
          "CMD",
          "redis-cli",
          "ping"
        ]
      interval: 5s
      timeout: 3s
      retries: 10

    networks:
      - brown_local


  kafka:
    image: ${KAFKA_IMAGE}
    profiles:
      - messaging
      - full

    ports:
      - "${KAFKA_PORT}:9092"

    volumes:
      - kafka_data:/var/lib/kafka/data

    networks:
      - brown_local


  schema-registry:
    image: ${SCHEMA_REGISTRY_IMAGE}
    profiles:
      - messaging
      - full

    depends_on:
      kafka:
        condition: service_started

    ports:
      - "${SCHEMA_REGISTRY_PORT}:8081"

    networks:
      - brown_local


  wiremock:
    image: wiremock/wiremock:3
    profiles:
      - mocks
      - full

    ports:
      - "${WIREMOCK_PORT}:8080"

    volumes:
      - ./infrastructure/mocks/wiremock:/home/wiremock

    networks:
      - brown_local


volumes:
  postgres_data:
  redis_data:
  kafka_data:


networks:
  brown_local:
    driver: bridge
```

Notes:

- Use named volumes.
- Use health checks.
- Avoid arbitrary sleep-based startup handling.
- Configure Kafka details after the approved Kafka image/distribution is fixed.

---

# 12. Database-Per-Service Locally

One PostgreSQL container may host multiple logical service databases.

```text
PostgreSQL Container
│
├── identity_db
│      identity_user
│
├── customer_db
│      customer_user
│
├── catalog_db
│      catalog_user
│
├── inventory_db
│      inventory_user
│
├── cart_db
│      cart_user
│
├── ordering_db
│      ordering_user
│
├── payment_db
│      payment_user
│
├── wallet_db
│      wallet_user
│
├── loyalty_db
│      loyalty_user
│
├── promotion_db
│      promotion_user
│
├── notification_db
│      notification_user
│
└── integration_db
       integration_user
```

Rules:

```text
Each service has its own database.
Each service has its own database user.
Cross-service DB access is denied.
```

Example prohibited access:

```text
ordering-service
        ↓
wallet_db
```

`ordering_user` should not have permission to query `wallet_db`.

---

# 13. Business Tables Must Not Be Created From Compose

PostgreSQL bootstrap should only provision:

```text
database
user
permissions
```

Do not create business tables in Docker initialization.

Wrong:

```sql
CREATE TABLE users (...);
CREATE TABLE orders (...);
```

Correct:

```text
Flyway migrations owned by each service
```

Example:

```text
identity-service/
└── src/main/resources/db/migration/
    ├── V1__create_users.sql
    ├── V2__create_credentials.sql
    └── ...
```

---

# 14. Kafka Foundation

Local Kafka should be lightweight.

Preferred:

```text
single-node Kafka
KRaft when compatible with target environment
```

Do not depend only on:

```text
auto.create.topics.enable=true
```

Create explicit topic bootstrap support under:

```text
infrastructure/kafka/topics/
```

Future topics may include:

```text
order.events.v1
payment.events.v1
wallet.events.v1
loyalty.events.v1
mission.events.v1
promotion.events.v1
notification.events.v1
```

During Phase 1, create the bootstrap mechanism.

Final event ownership and schemas are handled in later phases.

---

# 15. Redis Foundation

Use service namespacing:

```text
identity:*
catalog:*
cart:*
order:*
promotion:*
```

Avoid destructive global commands against shared environments.

Do not use:

```text
FLUSHALL
```

against shared Redis.

Prefer service-owned prefix cleanup.

---

# 16. Host vs Container Addressing

## Host Development

When Spring Boot runs from IntelliJ:

```text
PostgreSQL = localhost:5432
Redis      = localhost:6379
Kafka      = localhost:9092
```

## Docker Development

When the service runs inside Compose:

```text
PostgreSQL = postgres:5432
Redis      = redis:6379
Kafka      = kafka:<internal-port>
```

Never hard-code dependency hosts in Java.

Wrong:

```java
String db = "localhost:5432";
```

Correct:

```text
dependency endpoints come from configuration
```

---

# 17. Mock Providers

Create:

```text
infrastructure/mocks/wiremock/
├── mappings/
└── __files/
```

Mocks should eventually cover:

```text
SUCCESS
FAILURE
TIMEOUT
CALLBACK
INVALID_RESPONSE
```

for external systems such as:

```text
Payment
Top-up
Delivery
ERP
POS
SMS
Email
External loyalty
```

---

# 18. Standard Developer Commands

Provide:

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

Provide both:

```text
PowerShell
+
Bash
```

for cross-platform use.

---

# 19. `dev-up`

PowerShell:

```powershell
docker compose `
  --profile infra `
  --profile messaging `
  --profile mocks `
  up -d
```

Bash:

```bash
#!/usr/bin/env bash
set -euo pipefail

docker compose \
  --profile infra \
  --profile messaging \
  --profile mocks \
  up -d
```

---

# 20. `dev-down`

PowerShell:

```powershell
docker compose down
```

Bash:

```bash
#!/usr/bin/env bash
set -euo pipefail

docker compose down
```

---

# 21. `dev-reset`

The command must clearly indicate destructive behavior.

PowerShell:

```powershell
Write-Host "WARNING: This will delete all LOCAL Docker volumes."

$confirm = Read-Host "Type RESET to continue"

if ($confirm -ne "RESET") {
    Write-Host "Cancelled."
    exit 1
}

docker compose down -v
```

Bash:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "WARNING: This deletes LOCAL project volumes."
read -r -p "Type RESET to continue: " answer

if [ "$answer" != "RESET" ]; then
    echo "Cancelled."
    exit 1
fi

docker compose down -v
```

---

# 22. `dev-health`

Check:

```text
Docker
PostgreSQL
Redis
Kafka
Schema Registry
WireMock
```

Example:

```powershell
docker compose ps

docker compose exec postgres `
  pg_isready `
  -U $env:POSTGRES_ADMIN_USER

docker compose exec redis `
  redis-cli ping
```

Expected output:

```text
PostgreSQL        OK
Redis             OK
Kafka             OK
Schema Registry   OK
WireMock          OK
```

---

# 23. `doctor`

`dev-health` checks running infrastructure.

`doctor` checks the developer workstation and configuration.

Check:

```text
Java
Git
Docker
Docker Compose
.env
Git remote
Disk
Port 5432
Port 6379
Port 9092
Service ports
```

Example:

```text
Java           OK
Git            OK
Docker         OK
Compose        OK
.env           OK

5432           FREE
6379           FREE
9092           FREE

Git Remote     OK

Environment    READY
```

---

# 24. Local Security Rules

Immediately enforce:

```text
NO production database dump
NO production JWT key
NO production API token
NO production customer data
NO production payment credential
```

Use:

```text
synthetic data
fake provider keys
local RSA keys
mock APIs
```

---

# 25. Local RSA Keys

Create:

```text
.local-secrets/
├── jwt-private.pem
└── jwt-public.pem
```

The directory must be Git ignored.

These keys are local-development only.

Never reuse them in:

```text
DEV shared environment
QA
UAT
STAGING
PRODUCTION
```

A future bootstrap script may generate these automatically.

---

# 26. Root README

Recommended initial content:

```text
# BROWN Microservices Platform

## Requirements

- Git
- Java LTS
- Docker
- Docker Compose

## Initial Setup

1. Clone repository
2. Copy .env.example to .env
3. Configure approved dependency versions
4. Run doctor
5. Start dependencies

## Start

./scripts/dev-up.sh

or

.\scripts\dev-up.ps1

## Health

./scripts/dev-health.sh

## Stop

./scripts/dev-down.sh

## Reset

./scripts/dev-reset.sh

WARNING: reset deletes local volumes.

## Local Infrastructure

PostgreSQL
Redis
Kafka
Schema Registry
WireMock

## Security

Never use production credentials or production customer data.

## Service Development

Run active Java service from IDE.
Run infrastructure through Docker.

## Troubleshooting

See docs/troubleshooting.md.
```

Each future service README should include:

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

# 27. Testcontainers Foundation

Automated integration tests should not depend on the developer's running Compose environment.

Recommended:

```text
PostgreSQL Testcontainer
Kafka Testcontainer
Redis container
WireMock / MockServer
```

Model:

```text
Manual Development
        ↓
Docker Compose

Automated Integration Tests
        ↓
Testcontainers
```

---

# 28. Seed Architecture

Create:

```text
fixtures/seed/
```

Seeds remain separate from database migrations.

Future examples:

```text
test stores
test products
test customers
test admin
test missions
test promotions
```

Seed execution must either:

```text
be idempotent
```

or:

```text
explicitly reset first
```

---

# 29. Local Logging

Foundation logging rules:

```text
console / stdout
structured where practical
service name
environment
request/correlation IDs later
```

Do not depend on local log files as the main runtime logging model.

---

# 30. Configuration Governance

## New Environment Variable

The same merge request must update:

```text
.env.example
README
configuration validation
```

## New Local Dependency

Update:

```text
docker-compose.yml
healthcheck
README
doctor script
```

## New Kafka Topic

Update:

```text
topic bootstrap
schema
topic catalog
```

## New External Provider Contract

Update:

```text
mock provider
contract fixture
tests
```

---

# 31. Git Workflow Foundation

Possible branch convention:

```text
main
develop
feature/*
bugfix/*
hotfix/*
```

Minimum rules:

```text
no direct production code change
merge request / pull request review required
CI becomes mandatory later
```

Repository layout must not define domain/service boundaries.

---

# 32. Daily Developer Workflow

```text
git pull
   ↓
doctor
   ↓
dev-up
   ↓
run service from IntelliJ
   ↓
develop
   ↓
test
   ↓
integration-test
   ↓
verify
   ↓
commit
```

---

# 33. Phase 1 Definition of Done

Do not mark Phase 1 complete until every required item below passes.

## Workstation

- [ ] Git documented
- [ ] Java LTS documented
- [ ] Docker documented
- [ ] Docker Compose documented
- [ ] IDE guidance available
- [ ] Windows/WSL instructions available
- [ ] GitLab authentication documented

## Repository

- [ ] Root `README.md`
- [ ] `.editorconfig`
- [ ] `.gitattributes`
- [ ] `.gitignore`
- [ ] `.dockerignore`
- [ ] `.env.example`
- [ ] `services/`
- [ ] `contracts/`
- [ ] `infrastructure/`
- [ ] `scripts/`
- [ ] `fixtures/`
- [ ] `docs/`

## Ports

- [ ] Common port registry
- [ ] No collisions
- [ ] Ports configurable through environment variables

## PostgreSQL

- [ ] Container starts
- [ ] Health check works
- [ ] Persistent volume works
- [ ] Service DB strategy established
- [ ] Separate service users
- [ ] No cross-service DB access
- [ ] Flyway reserved for schema management
- [ ] No production dumps

## Redis

- [ ] Container starts
- [ ] Health check works
- [ ] Namespace strategy defined
- [ ] Reset behavior documented

## Kafka

- [ ] Broker starts
- [ ] Internal/external listener strategy works
- [ ] Topic bootstrap mechanism exists
- [ ] Schema Registry works when required
- [ ] No reliance only on auto topic creation

## Mocks

- [ ] WireMock / MockServer starts
- [ ] Success scenario possible
- [ ] Failure scenario possible
- [ ] Timeout scenario possible
- [ ] Callback scenario possible

## Commands

- [ ] `dev-up`
- [ ] `dev-down`
- [ ] `dev-reset`
- [ ] `dev-health`
- [ ] `doctor`
- [ ] `logs`

## Security

- [ ] `.env` ignored
- [ ] Local-only credentials
- [ ] No production private keys
- [ ] No production API tokens
- [ ] No customer PII
- [ ] Local RSA strategy
- [ ] Destructive scripts protected

## Development Experience

- [ ] One-command infrastructure start
- [ ] One-command reset
- [ ] One-command health check
- [ ] Doctor detects common problems
- [ ] Developer can start only required dependencies
- [ ] Testcontainers strategy defined
- [ ] Troubleshooting documentation exists

---

# 34. Final Phase 1 Result

When Phase 1 is complete:

```text
BROWN PLATFORM
│
├── Repository Structure                ✅
├── Git Standards                       ✅
├── Java Toolchain Strategy             ✅
├── Editor Standards                    ✅
├── Environment Configuration           ✅
│
├── Local Infrastructure
│   ├── PostgreSQL                      ✅
│   ├── Redis                           ✅
│   ├── Kafka                           ✅
│   ├── Schema Registry                 ✅
│   └── Mock Providers                  ✅
│
├── Database Ownership Foundation       ✅
├── Kafka Bootstrap Foundation          ✅
├── Redis Namespace Foundation          ✅
│
├── Developer Commands
│   ├── dev-up                          ✅
│   ├── dev-down                        ✅
│   ├── dev-reset                       ✅
│   ├── dev-health                      ✅
│   └── doctor                          ✅
│
├── Local Security Rules                ✅
├── Seed Strategy                       ✅
├── Testcontainers Strategy             ✅
├── Documentation                       ✅
└── Onboarding Flow                     ✅
```

---

# 35. Phase 1 Acceptance Test

A fresh developer should be able to do:

```text
Fresh developer machine
        ↓
Clone repository
        ↓
Copy .env.example
        ↓
Run doctor
        ↓
Run dev-up
        ↓
PostgreSQL healthy
Redis healthy
Kafka healthy
Schema Registry healthy
Mocks healthy
        ↓
READY FOR SERVICE DEVELOPMENT
```

The developer should not need:

```text
production credentials
manual database creation
manual Kafka setup
production customer data
undocumented tribal knowledge
```

---

# 36. Handoff to Phase 2

After Phase 1 is complete, move to:

```text
Phase 2 — Shared Engineering Standards
```

Phase 2 should establish the reusable Spring Boot service template, including:

```text
Clean Architecture
Hexagonal Architecture
Package conventions
Exception model
Validation
Configuration
Logging
Tracing
Flyway baseline
Testing baseline
Security baseline
Common service rules
```

Do not begin large-scale service implementation until the common service engineering standards are stable.
