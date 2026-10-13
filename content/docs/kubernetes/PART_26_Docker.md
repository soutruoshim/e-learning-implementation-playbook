---
title: "PART 26 — DOCKER"
---

# PART 26 — DOCKER

> **Document Role:** Defines the platform standards for packaging verified microservices into reproducible, secure, observable, resource-aware container images suitable for local development, CI/CD, Kubernetes, and production deployment.  
> **Previous Part:** PART 25 — Testing Strategy  
> **Next Part:** PART 27 — Local Development Environment  
> **Status:** Platform Architecture / Containerization Specification  
> **Primary Stack:** Docker, BuildKit, Java, Spring Boot, Gradle/Maven, PostgreSQL, Kafka, Redis, GitLab CI/CD, Kubernetes  
> **Audience:** Backend engineers, platform engineers, DevOps engineers, SREs, security engineers, QA engineers, technical leads.

---

# 5362 — Purpose

Docker defines how each microservice is packaged into a:

```text
reproducible
immutable
secure
portable
deployable
```

container image.

The chapter answers:

```text
How should Dockerfiles be structured?
Which base images should be used?
How should Java applications run inside containers?
How should images be tagged?
How are dependencies cached during builds?
How are secrets handled?
How should containers stop gracefully?
How are images scanned?
How are images reproduced exactly?
How should Docker Compose support local development?
```

---

# 5363 — Core Container Principle

A container image should contain:

```text
application runtime
application artifact
required runtime libraries
minimal operating system dependencies
```

It should not contain:

```text
environment-specific secrets
production credentials
mutable business configuration
developer tools
source control metadata
unnecessary package managers
```

---

# 5364 — Docker Is Packaging, Not Architecture

Docker does not define:

```text
service boundaries
database ownership
business transactions
security authorization
Saga correctness
```

Those decisions were defined in earlier parts.

Docker packages those decisions consistently.

---

# 5365 — Container Goals

Platform containers should be:

```text
small
secure
reproducible
non-root
immutable
observable
fast to build
fast to start
graceful to stop
```

---

# 5366 — One Service, One Image

Each deployable service has its own image.

Examples:

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

---

# 5367 — One Container, One Primary Process

Recommended:

```text
one application process per container
```

Do not run:

```text
Spring Boot
+
cron
+
nginx
+
log shipper
```

inside one application container.

Kubernetes/platform components handle supporting concerns separately.

---

# 5368 — Container Immutability

Production container filesystem should be treated as:

```text
immutable runtime artifact
```

Application should not modify its own executable/JAR/config image layers.

---

# 5369 — Ephemeral Container Filesystem

Anything written locally may disappear after:

```text
restart
reschedule
replacement
```

Therefore do not store authoritative:

```text
uploads
orders
payment files
reports
user data
```

only on container filesystem.

---

# 5370 — Persistent Data Ownership

Persistent domain data belongs in:

```text
PostgreSQL
Kafka
Redis where appropriate
object storage
external durable stores
```

not application container layers.

---

# 5371 — Image Build Flow

Recommended:

```text
Source Code
   ↓
Builder Stage
   ↓
Compile + Test/Package
   ↓
Application Artifact
   ↓
Runtime Stage
   ↓
Minimal Production Image
```

---

# 5372 — Multi-Stage Build

Use multi-stage Dockerfiles.

Benefits:

```text
build tools absent from runtime
smaller image
smaller attack surface
clean artifact boundary
```

---

# 5373 — Builder Stage

Builder may contain:

```text
JDK
Gradle/Maven
compiler
test/build tooling
```

---

# 5374 — Runtime Stage

Runtime should contain only:

```text
JRE/runtime
application artifact
required CA certificates
minimal runtime files
```

---

# 5375 — Runtime JDK vs JRE

For most Spring Boot services:

```text
JRE/runtime image
```

is sufficient.

Full JDK should only remain when runtime tooling explicitly requires it.

---

# 5376 — Java Version Standard

All services should use one supported Java LTS version at a time unless an exception is approved.

Example architecture target:

```text
Java 21 LTS
```

or organization-approved LTS.

---

# 5377 — Java Version Pinning

Do not use vague:

```text
latest
```

base tags.

Prefer:

```text
specific major/minor runtime tag
```

and ideally digest-pinned production builds.

---

# 5378 — Base Image Choice

Common options:

```text
Eclipse Temurin
Amazon Corretto
Microsoft Build of OpenJDK
Distroless Java
UBI/OpenJDK
```

Choose one organizational standard.

---

# 5379 — Recommended Initial Base Strategy

For operational simplicity:

```text
builder:
approved JDK image

runtime:
approved slim JRE image
```

Move to:

```text
distroless
```

only after operational/debugging requirements are understood.

---

# 5380 — Alpine Warning

Alpine can reduce size but may introduce:

```text
musl vs glibc differences
native library compatibility
DNS/runtime differences
debugging complexity
```

Do not select Alpine solely because it is smaller.

---

# 5381 — Distroless

Benefits:

```text
minimal attack surface
no shell/package manager
small runtime
```

Tradeoffs:

```text
harder interactive debugging
certificate/native dependency assumptions
```

---

# 5382 — Production Image Standard

Production image should not contain:

```text
curl
wget
vim
git
gcc
package manager
```

unless explicitly required.

---

# 5383 — Dockerfile Location

Recommended:

```text
service-root/
├── Dockerfile
├── .dockerignore
├── build.gradle / pom.xml
├── src/
└── ...
```

---

# 5384 — Dockerfile Naming

Standard:

```text
Dockerfile
```

Optional specialized:

```text
Dockerfile.dev
Dockerfile.migration
```

only where needed.

---

# 5385 — Dockerfile Example

Illustrative Gradle multi-stage build:

```dockerfile
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /workspace

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew

COPY src src

RUN ./gradlew clean bootJar --no-daemon

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /workspace/build/libs/app.jar /app/app.jar

USER 10001:10001

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

The production version should further:

```text
pin image versions
create explicit non-root user if base image requires
configure ownership
use reproducible build settings
```

---

# 5386 — Maven Example

Conceptual:

```dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw

COPY src src

RUN ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=builder /workspace/target/app.jar /app/app.jar

USER 10001:10001

ENTRYPOINT ["java","-jar","/app/app.jar"]
```

Testing remains a CI quality gate.

Whether tests run inside image build is a pipeline decision.

---

# 5387 — Build Test Placement

Recommended pipeline:

```text
compile/test
      ↓
package artifact
      ↓
build image
```

instead of hiding all tests inside opaque Docker build logs.

---

# 5388 — Docker Build Should Still Be Reproducible

Even if CI builds JAR beforehand:

```text
Docker image input artifact must be traceable
```

to:

```text
commit SHA
build pipeline
version
```

---

# 5389 — Builder Dependency Caching

Structure Dockerfile to cache dependencies before source changes.

Example concept:

```text
copy build descriptor
resolve dependencies
copy source
compile
```

---

# 5390 — Gradle Cache

With BuildKit:

```text
--mount=type=cache,target=/root/.gradle
```

may speed builds.

---

# 5391 — Maven Cache

Use BuildKit cache:

```text
/root/.m2
```

where supported.

---

# 5392 — Build Cache Security

Do not cache:

```text
credentials
private keys
secret files
```

inside image layers.

---

# 5393 — BuildKit

Use modern:

```text
Docker BuildKit
```

for:

```text
cache mounts
secret mounts
parallel stage optimization
provenance
```

---

# 5394 — Build Secrets

If private dependency repository requires credentials:

```text
RUN --mount=type=secret
```

or CI-injected secure build mechanism.

Never:

```text
ARG MAVEN_PASSWORD
RUN echo $MAVEN_PASSWORD ...
```

if it can leak to layers/history.

---

# 5395 — Docker ARG

`ARG` is suitable for:

```text
non-sensitive build metadata
version
commit SHA
```

Not secrets.

---

# 5396 — Docker ENV

Image `ENV` may define safe defaults.

Do not bake:

```text
database password
JWT private key
provider secret
```

into image.

---

# 5397 — Runtime Configuration

Runtime configuration comes from:

```text
environment variables
mounted configuration
Kubernetes ConfigMap
Kubernetes Secret / external secret manager
```

---

# 5398 — Twelve-Factor Alignment

Application image stays the same across:

```text
DEV
UAT
PROD
```

Only runtime configuration changes.

---

# 5399 — Environment-Specific Images Anti-Pattern

Avoid building:

```text
identity-service-dev
identity-service-uat
identity-service-prod
```

from different code/config.

Build once:

```text
promote same image digest
```

across environments.

---

# 5400 — Image Promotion

Preferred:

```text
Build Image
   ↓
Test
   ↓
UAT
   ↓
Production
```

using the same image digest.

---

# 5401 — Image Tag

Recommended tags:

```text
semantic/release version
commit SHA
```

Example:

```text
order-service:1.8.0
order-service:git-a1b2c3d
```

---

# 5402 — Latest Tag

Do not rely on:

```text
latest
```

for production deployment.

It is mutable and ambiguous.

---

# 5403 — Immutable Tagging

Registry should protect release tags from overwrite where possible.

---

# 5404 — Image Digest

Production deployment should ideally resolve to:

```text
sha256 digest
```

This guarantees exact image bytes.

---

# 5405 — Tag + Digest

Human-friendly configuration may show:

```text
1.8.0
```

while deployment records actual:

```text
sha256:...
```

---

# 5406 — OCI Labels

Add metadata:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.created
```

---

# 5407 — Commit Traceability

Given a running container, operators should determine:

```text
which Git commit produced it
```

---

# 5408 — Reproducible Build

Same:

```text
source
dependencies
base digest
build inputs
```

should produce functionally identical image.

Bit-for-bit reproducibility is desirable where tooling supports it.

---

# 5409 — Dependency Pinning

Avoid floating dependency versions.

Use:

```text
Gradle dependency locking
Maven dependency management
```

where possible.

---

# 5410 — Base Image Pinning

For highly controlled production:

```dockerfile
FROM eclipse-temurin:21-jre@sha256:...
```

provides immutable base.

---

# 5411 — Base Digest Update

Digest pinning means security updates require deliberate rebuild.

Automate:

```text
dependency/base image update monitoring
```

---

# 5412 — Image Rebuild Policy

Rebuild services when:

```text
base image critical CVE fixed
JRE security patch released
application dependency fixed
```

even if application source did not change.

---

# 5413 — .dockerignore

Required.

Exclude:

```text
.git
build/
target/
IDE files
local secrets
logs
coverage reports
node_modules if irrelevant
```

---

# 5414 — Build Context

Keep Docker build context small.

Benefits:

```text
faster upload
less accidental secret inclusion
better cache behavior
```

---

# 5415 — Secret Inclusion Scan

CI should detect accidental files such as:

```text
.env
id_rsa
*.pem
service-account.json
```

before image publication.

---

# 5416 — Layer Design

Docker layers should optimize:

```text
cache reuse
small changed layer
clear artifact boundary
```

---

# 5417 — Spring Boot Layered JAR

Spring Boot supports layered JARs.

Potential layers:

```text
dependencies
spring-boot-loader
snapshot-dependencies
application
```

---

# 5418 — Layered JAR Benefit

When application code changes but dependencies do not:

```text
dependency layer can remain cached
```

reducing push/pull size.

---

# 5419 — Layer Extraction

Possible:

```text
java -Djarmode=tools ...
```

or Spring Boot layer tooling depending version.

Do not add complexity unless registry/build benefits justify it.

---

# 5420 — Image Size

Smaller images improve:

```text
pull time
startup scheduling
registry transfer
attack surface
```

But do not compromise runtime stability to save a few MB.

---

# 5421 — Image Size Budget

Track image size per service.

Alert/review large regressions.

---

# 5422 — Duplicate Runtime Dependencies

Do not copy:

```text
Gradle cache
source code
test fixtures
```

into runtime image.

---

# 5423 — Non-Root Container

Production application process must run as:

```text
non-root
```

unless documented exception.

---

# 5424 — Explicit User

Use stable UID/GID.

Example:

```text
10001
```

or organization standard.

---

# 5425 — File Ownership

Ensure:

```text
/app
temporary writable directories
```

are owned by runtime user.

---

# 5426 — Avoid chmod 777

Do not solve permission errors with:

```text
chmod -R 777
```

Use correct ownership and least privilege.

---

# 5427 — Rootless Requirement

Application should not require:

```text
binding port <1024
installing packages at runtime
changing kernel settings
```

---

# 5428 — Application Port

Use unprivileged port.

Example:

```text
8080
```

---

# 5429 — EXPOSE

Dockerfile may document:

```dockerfile
EXPOSE 8080
```

This does not enforce firewall/network access.

---

# 5430 — Read-Only Root Filesystem

Design application to support:

```text
readOnlyRootFilesystem: true
```

in Kubernetes where possible.

---

# 5431 — Writable Directories

If Java/application needs temporary files:

```text
/tmp
```

mount writable ephemeral volume.

---

# 5432 — Spring Temporary Files

Check:

```text
multipart uploads
Tomcat temp
JVM temporary directory
```

and configure dedicated writable path.

---

# 5433 — Upload Handling

Do not rely on container-local uploaded files for persistence.

Upload to:

```text
object storage
durable external system
```

after validation.

---

# 5434 — Linux Capabilities

Application container should normally require:

```text
no extra capabilities
```

Kubernetes hardening later sets:

```text
drop ALL
```

where compatible.

---

# 5435 — Privileged Mode

Never run application container:

```text
--privileged
```

in production.

---

# 5436 — Host Mounts

Avoid mounting:

```text
Docker socket
host root filesystem
host SSH keys
```

into application containers.

---

# 5437 — Java Container Awareness

Modern JVM detects:

```text
container CPU limits
memory limits
```

but JVM flags must still be reviewed.

---

# 5438 — JVM Memory

Do not set heap equal to container memory limit.

Container also needs memory for:

```text
metaspace
thread stacks
direct buffers
native libraries
JIT
```

---

# 5439 — MaxRAMPercentage

Possible:

```text
-XX:MaxRAMPercentage=...
```

Use performance testing to choose.

---

# 5440 — InitialRAMPercentage

May control initial heap sizing.

Avoid copying generic JVM flags without measurement.

---

# 5441 — JVM Heap Example

If container memory limit:

```text
1 GiB
```

do not assume:

```text
-Xmx1g
```

is safe.

Leave native headroom.

---

# 5442 — Out-of-Memory

Decide behavior:

```text
process exits
container restarts
heap dump policy
```

Do not let corrupted/unstable JVM continue indefinitely.

---

# 5443 — ExitOnOutOfMemoryError

Often appropriate:

```text
-XX:+ExitOnOutOfMemoryError
```

for containerized service.

---

# 5444 — Heap Dump

Heap dump can be valuable but may:

```text
contain secrets/PII
consume large disk
```

Need secure destination and retention.

---

# 5445 — GC Selection

Use JVM default G1 for many services unless profiling justifies:

```text
ZGC
other collector
```

---

# 5446 — CPU Limits

Very low CPU quota can cause:

```text
GC delay
request latency
JIT slowdown
```

Docker image itself cannot solve bad runtime resource allocation.

---

# 5447 — JVM Processor Count

If needed:

```text
-XX:ActiveProcessorCount
```

can override detection for special environments.

Use carefully.

---

# 5448 — Thread Pool and CPU

Application thread pools should reflect:

```text
container CPU
blocking workload
```

not physical host CPU.

---

# 5449 — Timezone

Prefer application timestamps in:

```text
UTC
```

Runtime OS timezone should not drive business logic unexpectedly.

---

# 5450 — JVM Timezone

Can set:

```text
-Duser.timezone=UTC
```

if organization standard requires.

Business-local zones remain explicit.

---

# 5451 — Locale

Set deterministic locale when parsing/formatting could depend on host defaults.

---

# 5452 — Character Encoding

Use:

```text
UTF-8
```

explicitly where needed.

Important for:

```text
Khmer text
notifications
mission translations
```

---

# 5453 — CA Certificates

Runtime image must include trusted CA certificates needed for:

```text
PostgreSQL TLS
Kafka TLS
provider HTTPS
OIDC/JWKS
```

---

# 5454 — Custom Enterprise CA

Inject trusted enterprise CA through controlled mechanism.

Do not disable TLS verification.

---

# 5455 — Certificate Updates

Base image rebuild should pick up:

```text
CA/JRE security updates
```

according to patch policy.

---

# 5456 — Entrypoint

Prefer exec form:

```dockerfile
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

not shell form:

```dockerfile
ENTRYPOINT java -jar /app/app.jar
```

---

# 5457 — Why Exec Form

Exec form helps Java become:

```text
PID 1
```

and receive Unix signals directly.

---

# 5458 — PID 1

Containerized Java process should properly receive:

```text
SIGTERM
```

for graceful shutdown.

---

# 5459 — Graceful Shutdown

On stop:

```text
stop accepting new traffic
finish eligible in-flight requests
stop consumers safely
flush telemetry
close DB/Kafka/Redis clients
exit before grace deadline
```

---

# 5460 — Spring Boot Graceful Shutdown

Configure:

```text
server.shutdown=graceful
```

or current Spring Boot equivalent.

---

# 5461 — Shutdown Timeout

Application graceful shutdown must finish within platform:

```text
terminationGracePeriodSeconds
```

defined later in Kubernetes.

---

# 5462 — Kafka Consumer Shutdown

On SIGTERM:

```text
stop polling
finish current safe processing
commit offsets only after success
close consumer
```

---

# 5463 — Saga Worker Shutdown

Worker should not leave:

```text
half-owned in-memory lease
```

without durable recovery.

Durable Saga state allows another pod to resume.

---

# 5464 — Scheduler Shutdown

Ensure scheduled job locks/leases expire or release safely.

---

# 5465 — Health Checks

Containerized app exposes:

```text
liveness
readiness
```

through Spring Boot Actuator or equivalent.

---

# 5466 — Docker HEALTHCHECK

May be useful for:

```text
Docker Compose/local
```

but Kubernetes probes will be authoritative in production.

---

# 5467 — Liveness

Answers:

```text
Is process internally alive?
```

Should not fail just because:

```text
payment provider
Kafka
Redis
```

is briefly unavailable.

---

# 5468 — Readiness

Answers:

```text
Can this instance safely accept traffic?
```

May consider critical local dependencies carefully.

---

# 5469 — Startup Probe

Kubernetes startup probe will later protect slow-starting Java apps.

Docker chapter requires application startup endpoint semantics to exist.

---

# 5470 — Actuator Exposure

Expose only necessary:

```text
health
prometheus
info
```

Internally.

Do not expose sensitive Actuator endpoints publicly.

---

# 5471 — Health Check Dependency Trap

If liveness calls all downstream systems:

```text
dependency outage
→ liveness fails
→ pod restarts
→ outage worsens
```

Avoid.

---

# 5472 — Container Logging

Application logs to:

```text
stdout
stderr
```

not local rotating files.

---

# 5473 — Log Collection

Container platform collects logs.

Application image should not bundle:

```text
logrotate
filebeat
```

as side processes.

---

# 5474 — Structured Logs

Use JSON or standardized structured format when platform supports it.

---

# 5475 — Local File Logs

Avoid as primary production logging.

If framework writes temp logs, ensure:

```text
bounded
ephemeral
non-critical
```

---

# 5476 — Container Metrics

Application metrics exposed through:

```text
Prometheus endpoint
```

Platform metrics collected separately.

---

# 5477 — Build Metadata Endpoint

Application may expose safe:

```text
version
commit SHA
build time
```

through secured `/actuator/info`.

---

# 5478 — Secrets at Runtime

Secrets enter container at runtime.

Examples:

```text
DB password
Kafka credential
JWT private key path
provider API secret
```

---

# 5479 — Environment Variable Secret Tradeoff

Environment variables are common but can be exposed through:

```text
process inspection
debug dumps
misconfigured logs
```

For highly sensitive keys prefer:

```text
mounted secret file
secret agent
```

where supported.

---

# 5480 — Secret File Permissions

Mounted secret files should be:

```text
readable only by runtime user
```

---

# 5481 — Private Keys

RSA/JWT/payment private keys should not be:

```text
COPY
```

into Docker image.

---

# 5482 — Secret Rotation

Container should load/refresh secret according to platform design.

Some changes may require:

```text
rolling restart
```

Others may support live reload.

---

# 5483 — Configuration Validation

Application should fail fast at startup if required configuration is invalid.

Examples:

```text
missing DB URL
missing issuer
invalid timeout
invalid Kafka topic
```

---

# 5484 — Optional Dependency Config

Optional integrations may start:

```text
disabled
```

with clear health/metric rather than crash whole service.

---

# 5485 — Environment Variable Naming

Standard:

```text
SERVICE_FEATURE_PROPERTY
```

or Spring-compatible convention.

Document all production-required config.

---

# 5486 — Configuration Defaults

Safe defaults allowed for:

```text
timeouts
port
logging
```

Do not default silently to:

```text
development credentials
localhost production dependencies
```

---

# 5487 — localhost Anti-Pattern

Inside container:

```text
localhost
```

means the same container.

Dependencies use service DNS/configured endpoints.

---

# 5488 — Container DNS

Docker Compose/Kubernetes provide service-name DNS.

Application should use logical hostname:

```text
postgres
kafka
redis
```

in local Compose where appropriate.

---

# 5489 — Container Network

For local Compose, services share dedicated network.

Production networking is defined in Kubernetes/Networking chapters.

---

# 5490 — Exposed Host Ports

Local development may expose:

```text
4000
5432
6379
9092
```

as needed.

Production services do not require host-port mapping in Dockerfile.

---

# 5491 — Docker Compose Purpose

Docker Compose supports:

```text
local dependencies
developer integration environment
manual testing
```

It is not the production orchestrator.

---

# 5492 — Docker Compose Scope

Compose may include:

```text
PostgreSQL
Redis
Kafka
Schema Registry
selected services
mock provider
```

---

# 5493 — Full Platform Compose Warning

Running every microservice locally may require excessive:

```text
CPU
RAM
startup time
```

Support selective profiles.

---

# 5494 — Compose Profiles

Example:

```text
core
messaging
observability
full
```

---

# 5495 — Developer Minimal Profile

For Order development:

```text
PostgreSQL
Kafka
Redis
Order service
mock Catalog/Inventory/Payment
```

or actual dependencies selectively.

---

# 5496 — Compose Environment File

Local `.env` may contain:

```text
non-production local values
```

Never commit real secrets.

---

# 5497 — .env.example

Commit:

```text
variable names
safe placeholders
```

not secrets.

---

# 5498 — Compose Volumes

Use named volumes for:

```text
PostgreSQL
Kafka
Redis
```

when developer persistence is helpful.

---

# 5499 — Clean Reset

Developer should have command to:

```text
docker compose down -v
```

or project wrapper to reset local state intentionally.

---

# 5500 — Compose Health Dependencies

Use health checks rather than arbitrary:

```text
sleep 30
```

where startup order matters.

---

# 5501 — depends_on

`depends_on` ordering does not guarantee application readiness unless health conditions are used appropriately.

Application must also retry dependencies.

---

# 5502 — Local Kafka

Use a production-compatible Kafka version.

Avoid outdated local broker differing significantly from target environment.

---

# 5503 — Local PostgreSQL

Match production major version.

---

# 5504 — Local Redis

Match production major version.

---

# 5505 — Database Initialization

Use:

```text
Flyway from application
```

rather than handcrafted Compose SQL that diverges from production schema.

---

# 5506 — Seed Data

Local seed script may run after migrations.

Keep:

```text
migration
```

and:

```text
development seed
```

separate.

---

# 5507 — Compose Secrets

For local only, safe development credentials are acceptable.

Do not copy production secret-handling assumptions into source control.

---

# 5508 — Mock Providers in Compose

Examples:

```text
WireMock
MockServer
```

for:

```text
payment
delivery
ERP
```

integration scenarios.

---

# 5509 — Docker Build in CI

CI builds image from:

```text
clean checkout
```

not developer workstation artifacts.

---

# 5510 — CI Builder

Options:

```text
Docker-in-Docker
BuildKit
Kaniko
Buildah
cloud builder
```

Choose organization standard.

---

# 5511 — Privileged Docker-in-Docker

Privileged DinD increases security risk.

Prefer safer builder where infrastructure supports.

---

# 5512 — Build Isolation

Build runner should not expose:

```text
host Docker socket
production credentials
```

without strong controls.

---

# 5513 — Registry

Images stored in approved registry.

Examples:

```text
GitLab Container Registry
ECR
GCR/Artifact Registry
ACR
Harbor
```

---

# 5514 — Registry Authentication

CI uses scoped credentials.

Application runtime needs only:

```text
image pull access
```

through cluster mechanism.

---

# 5515 — Registry Retention

Retain:

```text
production releases
recent branches
rollback versions
```

Clean unreferenced build images according to policy.

---

# 5516 — Registry Immutability

Release repositories/tags should be immutable.

---

# 5517 — Image Vulnerability Scanning

Scan image for:

```text
OS packages
JRE
libraries where scanner supports
known CVEs
```

before promotion.

---

# 5518 — Scanner Examples

Possible:

```text
Trivy
Grype
GitLab Container Scanning
cloud-native scanner
```

Select organization standard.

---

# 5519 — Scan Gate

Block release on:

```text
critical exploitable vulnerabilities
```

according to security policy.

---

# 5520 — Vulnerability Exception

Requires:

```text
risk assessment
owner
expiry
mitigation
```

---

# 5521 — False Positive Management

Suppress only with documented justification.

---

# 5522 — Base Image Vulnerability

If vulnerability comes from base image:

```text
update/rebuild base
```

not ignore indefinitely.

---

# 5523 — Dependency Vulnerability

Application SCA from PART 25 complements container scan.

---

# 5524 — SBOM

Generate SBOM for each release image.

Formats:

```text
CycloneDX
SPDX
```

---

# 5525 — SBOM Contents

Should identify:

```text
OS packages
JRE/runtime
application dependencies
versions
```

---

# 5526 — SBOM Storage

Attach to:

```text
CI artifacts
image registry attestation
release record
```

---

# 5527 — Image Signing

Production-grade pipeline should support:

```text
container image signing
```

e.g.:

```text
Cosign
```

or registry-native mechanism.

---

# 5528 — Signature Verification

Kubernetes admission may later enforce:

```text
only trusted signed images
```

---

# 5529 — Build Provenance

Capture:

```text
source commit
builder identity
pipeline
dependencies
base image
```

---

# 5530 — SLSA Direction

Supply-chain hardening may adopt SLSA-aligned provenance.

Detailed hardening appears in PART 35.

---

# 5531 — Image Scan Timing

Scan:

```text
at build
before production
continuously after publication
```

because new CVEs appear later.

---

# 5532 — Continuous Registry Scanning

A previously clean image may become vulnerable after disclosure.

Monitor deployed images.

---

# 5533 — Rebuild Without Code Change

Security patch may require:

```text
same app version
new image build
```

Use unique build metadata/digest.

---

# 5534 — Image Version Semantics

Application version and image build version may differ.

Example:

```text
app 1.8.0
image rebuild 1.8.0-r2
```

---

# 5535 — Container Startup

Startup should:

```text
validate config
initialize clients
run safe startup checks
be ready only when service can operate
```

---

# 5536 — Flyway Startup

Options:

```text
application runs Flyway at startup
dedicated migration job
CI/CD migration step
```

Kubernetes strategy later decides production standard.

---

# 5537 — Migration Race

If multiple replicas start and run migrations:

```text
Flyway locking usually protects
```

but operational strategy should remain deliberate.

---

# 5538 — Migration Failure

Container should not accept traffic with partially incompatible schema.

Fail startup/readiness.

---

# 5539 — Startup Dependency Retry

Dependencies may not be ready immediately.

Clients should use:

```text
bounded reconnect/backoff
```

instead of crash loop for every transient dependency.

---

# 5540 — Critical Startup Dependency

Example:

```text
PostgreSQL unavailable
```

service usually cannot become ready.

---

# 5541 — Optional Startup Dependency

Example:

```text
analytics provider unavailable
```

should not prevent core service readiness.

---

# 5542 — Container Restart Safety

Application must be safe when restarted at any time.

Rely on:

```text
durable DB state
Kafka offsets/inbox
Saga recovery
idempotency
```

not in-memory process state.

---

# 5543 — In-Memory State

Allowed only for:

```text
cache
temporary optimization
```

unless loss semantics are explicit.

---

# 5544 — Scheduled Jobs

If application contains scheduled jobs:

```text
multi-replica safety
```

must already exist through:

```text
DB locks
leader election
job ownership
```

Container replicas may restart/scale.

---

# 5545 — Container Time

Do not depend on manually configured host clock.

Infrastructure must provide time synchronization.

Business code uses explicit time abstractions.

---

# 5546 — NTP Drift

Large clock drift can affect:

```text
JWT
TLS
Kafka
expiry
distributed tracing
```

Platform monitors node time.

---

# 5547 — Container Resource Awareness

Image should not assume:

```text
unlimited CPU
unlimited memory
```

Application defaults must behave under Kubernetes limits.

---

# 5548 — Resource Request Baseline

Docker chapter should provide measured baseline:

```text
idle memory
startup CPU
steady CPU
peak heap
```

for PART 29 Kubernetes resource settings.

---

# 5549 — Startup Memory Test

Measure startup peak, not only steady state.

---

# 5550 — JVM Native Memory

Track:

```text
heap
metaspace
code cache
thread stacks
direct buffers
native libraries
```

---

# 5551 — Thread Stack Memory

Many threads can consume significant native memory.

---

# 5552 — Netty Direct Memory

gRPC/reactive services may use direct buffers.

Do not size heap without observing direct memory.

---

# 5553 — Container OOMKill

Kubernetes may terminate container when total memory exceeds limit.

This differs from Java heap OOM.

---

# 5554 — OOM Diagnosis

Need:

```text
container memory metrics
JVM metrics
exit code
events
```

---

# 5555 — Exit Codes

Application should exit non-zero on unrecoverable startup/runtime failure.

---

# 5556 — Signal Handling Test

Test:

```text
docker stop
```

and verify graceful Spring shutdown.

---

# 5557 — Stop Timeout

Local/CI can set Docker stop timeout matching expected graceful period.

---

# 5558 — Healthcheck Example

Compose-only example:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD ["some-approved-health-client", "..."]
```

But minimal images may not include curl.

Prefer orchestrator HTTP probe in Kubernetes.

---

# 5559 — Healthcheck Tooling

Do not add large utilities only to support Docker HEALTHCHECK if Kubernetes performs probes.

Compose may use host-side health commands or lightweight tooling.

---

# 5560 — Container Test Strategy

Test image itself, not only JAR.

---

# 5561 — Image Build Test

CI must prove:

```text
Dockerfile builds from clean checkout
```

---

# 5562 — Container Startup Test

Run image with test config.

Assert:

```text
process starts
health becomes ready
```

---

# 5563 — Non-Root Test

Assert runtime UID:

```text
!= 0
```

---

# 5564 — Read-Only Filesystem Test

Run with:

```text
--read-only
```

plus required temp mount.

Verify service operates.

---

# 5565 — Secret Absence Test

Inspect image history/filesystem for known test secret marker.

Expected:

```text
absent
```

---

# 5566 — Image Layer Test

Verify source/build tools are not in runtime.

---

# 5567 — Image Vulnerability Test

CI scan.

---

# 5568 — SBOM Test

CI verifies SBOM produced and attached.

---

# 5569 — Graceful Shutdown Test

Start service.

Create in-flight request or Kafka processing.

Send:

```text
SIGTERM
```

Verify safe shutdown.

---

# 5570 — Crash Restart Test

Kill container abruptly.

Restart.

Verify business recovery via:

```text
DB
Saga
Kafka
```

---

# 5571 — Environment Configuration Test

Run same image with:

```text
DEV config
UAT-like config
```

to prove image does not require rebuild.

---

# 5572 — Wrong Configuration Test

Missing required environment variable should fail clearly.

---

# 5573 — Resource Limit Test

Run image with realistic:

```text
CPU
memory
```

limits.

Verify stable startup and test workload.

---

# 5574 — Low Memory Test

Determine failure threshold.

Ensure service fails predictably rather than corrupting state.

---

# 5575 — CPU Throttle Test

Run under constrained CPU.

Observe:

```text
latency
GC
timeouts
```

---

# 5576 — Container Network Test

Verify:

```text
DNS resolution
TLS
connection retry
```

inside container, not only host JVM.

---

# 5577 — Certificate Test

Test outbound HTTPS/TLS using runtime CA store.

---

# 5578 — Timezone/Encoding Test

Verify:

```text
UTC
UTF-8
Khmer text
```

inside runtime image.

---

# 5579 — Native Library Test

If using:

```text
Netty native SSL
image processing
PDF/native libs
```

test compatibility with chosen base.

---

# 5580 — Architecture Compatibility

If building multi-architecture images:

```text
amd64
arm64
```

test both before claiming support.

---

# 5581 — Multi-Arch Image

Use only if required for:

```text
developer Macs
ARM Kubernetes
cloud architecture
```

---

# 5582 — Buildx

Docker Buildx can produce:

```text
multi-platform manifests
```

---

# 5583 — Multi-Arch Dependency Risk

Native libraries may behave differently across architectures.

---

# 5584 — Local Development Image

Possible separate target:

```text
dev
```

containing debugging/hot reload.

Production target remains minimal.

---

# 5585 — Development Container

Can include:

```text
JDK
debugger
source mount
```

but never promote this image to production.

---

# 5586 — Debug Port

Local development may expose:

```text
JDWP
```

only on trusted local interface.

Never expose Java debug port publicly in production.

---

# 5587 — Remote Debug Security

JDWP can allow arbitrary code execution.

Production debug requires controlled alternative, not open port.

---

# 5588 — Docker Compose Debug Profile

Optional:

```text
JAVA_TOOL_OPTIONS=-agentlib:jdwp=...
```

only in local profile.

---

# 5589 — Spring DevTools

Local only.

Do not include in production runtime dependency.

---

# 5590 — Hot Reload

Developer convenience should not change production packaging guarantees.

---

# 5591 — Docker Compose Project Name

Use project-specific name to avoid collisions across repositories.

---

# 5592 — Port Collision

Allow environment override:

```text
POSTGRES_PORT
REDIS_PORT
KAFKA_PORT
```

for developers running multiple projects.

---

# 5593 — Compose Network Naming

Prefer generated project-scoped network rather than globally fixed network unless cross-repo integration requires it.

---

# 5594 — Shared Infrastructure Compose

Organization may provide common local:

```text
Kafka
Redis
observability
```

stack.

Service Compose can connect if workflow is standardized.

---

# 5595 — Developer Startup Command

Target:

```text
make dev-up
```

or:

```text
docker compose up -d
```

with documented wrapper.

---

# 5596 — Developer Shutdown Command

Target:

```text
make dev-down
```

---

# 5597 — Developer Reset Command

Target:

```text
make dev-reset
```

explicitly destructive.

---

# 5598 — Compose Logs

Provide:

```text
make dev-logs
```

or documented:

```text
docker compose logs -f service
```

---

# 5599 — Compose Status

Simple:

```text
docker compose ps
```

or wrapper.

---

# 5600 — Dependency Readiness

Developer startup should indicate when:

```text
PostgreSQL
Kafka
Redis
```

are ready.

---

# 5601 — Local Data Persistence Policy

Default can preserve data between restarts.

Reset command destroys named volumes.

---

# 5602 — Local Secret Policy

Only fake/local secrets.

Example:

```text
local-db-password
```

with zero production reuse.

---

# 5603 — Testcontainers vs Compose

Use Testcontainers for:

```text
automated integration tests
```

Use Compose for:

```text
developer manual environment
cross-service exploration
```

---

# 5604 — Avoid CI Depending on Shared Compose

CI jobs should prefer isolated containers/Testcontainers to avoid:

```text
cross-job state
port conflicts
flaky shared environment
```

---

# 5605 — Docker Security Baseline

Production image baseline:

```text
non-root
minimal runtime
no secrets
no unnecessary packages
read-only capable
signed/scanned
immutable tag/digest
```

---

# 5606 — CIS Docker Guidance

Platform team may adopt relevant CIS Docker/container guidance.

Kubernetes security controls are later expanded.

---

# 5607 — Image User Test

CI can inspect:

```text
docker inspect .Config.User
```

and reject empty/root.

---

# 5608 — Package Inventory

SBOM/scan reveals packages.

Unexpected shell/tools require review.

---

# 5609 — Setuid Files

Minimal runtime should avoid unnecessary setuid/setgid binaries.

Distroless helps reduce exposure.

---

# 5610 — File Permissions

Application JAR should not be world-writable.

---

# 5611 — Secret Mount Path

Standard possible:

```text
/run/secrets/<name>
```

or platform convention.

---

# 5612 — Tmp Directory

Standard:

```text
/tmp
```

with bounded ephemeral volume later.

---

# 5613 — Filesystem Growth

Monitor if app writes temp files.

Unbounded temp writes can fill container/node disk.

---

# 5614 — Multipart Limits

Configure upload size to protect:

```text
memory
disk
network
```

---

# 5615 — Core Dump

Disable unrestricted core dumps unless diagnostic policy explicitly handles sensitive data.

---

# 5616 — Shell Access

Production application container may have no shell.

Operations should use:

```text
observability
ephemeral debug containers
```

later in Kubernetes.

---

# 5617 — Exec Debugging

Do not make production image insecure merely to support:

```text
kubectl exec bash
```

---

# 5618 — Ephemeral Debug Container

Kubernetes can attach dedicated debug image when needed.

---

# 5619 — Container Registry Naming

Recommended:

```text
registry/org/platform/order-service:<tag>
```

---

# 5620 — Registry Repository Per Service

Each deployable service gets separate repository.

---

# 5621 — Image Retention by Environment

Keep:

```text
production release images
rollback images
active UAT release
recent CI artifacts
```

Clean stale branch builds.

---

# 5622 — Rollback Image

Rollback references known previous digest.

Do not rebuild previous version during incident.

---

# 5623 — Rebuild vs Rollback

Rollback:

```text
deploy old trusted digest
```

Rebuild:

```text
creates a new artifact
```

They are not equivalent.

---

# 5624 — Supply-Chain Trust

Production should know:

```text
who built image
from which source
with which pipeline
```

---

# 5625 — CI Identity

Image provenance should identify trusted CI builder.

---

# 5626 — Developer-Built Production Image

Do not deploy:

```text
image built on developer laptop
```

to production.

---

# 5627 — Registry Push Policy

Only CI/release automation has push permission to protected release repository.

---

# 5628 — Branch Image

Feature branch images may use:

```text
branch-SHA
```

and short retention.

---

# 5629 — Release Image

Use:

```text
semver + SHA/digest
```

---

# 5630 — Docker Labels for Ownership

Optional metadata:

```text
team
service
repository
```

can aid registry governance.

---

# 5631 — Container Image Manifest

Record:

```text
image digest
SBOM
signature
scan report
commit
build pipeline
```

in release metadata.

---

# 5632 — Build Failure Behavior

Docker build must fail on:

```text
compile failure
packaging failure
missing artifact
invalid user setup
```

not produce partial image.

---

# 5633 — Scan Failure Behavior

If security policy blocks:

```text
image is not promoted
```

---

# 5634 — Runtime Pull Policy

Kubernetes later uses:

```text
IfNotPresent
```

with immutable digest/tag or appropriate policy.

Do not rely on mutable tags.

---

# 5635 — Registry Availability

Cluster needs resilient access or cached images.

Registry outage should be considered in deployment/DR planning.

---

# 5636 — Air-Gapped Consideration

If future environment is restricted:

```text
mirror base images
mirror dependencies
mirror application registry
```

---

# 5637 — Base Image Allowlist

CI may restrict:

```text
FROM
```

to approved registries/images.

---

# 5638 — Dockerfile Linting

Use:

```text
Hadolint
```

or equivalent.

---

# 5639 — Dockerfile Lint Gate

Check:

```text
latest tags
root user
shell misuse
package manager cleanup
secret-like ARG/ENV
```

---

# 5640 — Build Policy as Code

CI rules can enforce:

```text
non-root
approved base
SBOM
scan
labels
```

---

# 5641 — Container Smoke Test

After image build:

```text
docker run
wait readiness
call safe endpoint
stop
```

---

# 5642 — Container Contract

Every service image should support:

```text
standard port
standard health endpoints
SIGTERM
stdout logs
runtime config
non-root execution
```

---

# 5643 — Image Runtime Contract

Minimum:

```text
ENTRYPOINT starts service
port configurable/default
config via environment/files
health endpoints
exit non-zero on fatal config
```

---

# 5644 — Dockerfile Template

Platform should provide a starter template for new Spring Boot services.

---

# 5645 — Template Customization

Allow service-specific:

```text
native libs
extra CA
JVM flags
```

only when documented.

---

# 5646 — No Copy-Paste Drift

Central example/template should reduce every service inventing different:

```text
base image
user
health behavior
JVM flags
```

---

# 5647 — Container Version Matrix

Track:

```text
Java base
Spring Boot
Docker builder standard
scanner
```

---

# 5648 — Base Image Lifecycle

Remove deprecated/unsupported JRE versions.

---

# 5649 — JRE Patch Cadence

Rebuild on regular patch cadence even absent emergency CVE.

---

# 5650 — CVE Response

For critical JRE/base image CVE:

```text
identify deployed images
update base
rebuild
scan
test
promote
```

---

# 5651 — Image Inventory

Know which services currently use vulnerable digest.

Registry/CI metadata should support query.

---

# 5652 — Container Observability

Production investigation should answer:

```text
image digest?
commit?
startup time?
restart count?
memory?
CPU?
exit reason?
```

---

# 5653 — Startup Duration Metric

Track Spring Boot startup time.

Large regression may affect:

```text
rolling deployment
autoscaling
recovery
```

---

# 5654 — Container Restart Metric

Frequent restarts may indicate:

```text
OOM
health misconfiguration
fatal config
dependency handling bug
```

---

# 5655 — Exit Reason

Kubernetes later surfaces:

```text
OOMKilled
Error
Completed
```

Application logs should complement it.

---

# 5656 — Docker Compose Observability Profile

Optional local:

```text
Prometheus
Grafana
Loki
Tempo/Jaeger
```

but not required for minimal dev start.

---

# 5657 — Local Observability Cost

Profiles avoid every developer running heavy stack unnecessarily.

---

# 5658 — Container Performance

Measure image/container overhead as part of performance testing.

---

# 5659 — Startup CPU Burst

Java startup may require temporary CPU burst.

Kubernetes requests/limits later account for it.

---

# 5660 — Startup Probe Timing Input

Measure:

```text
cold start P95
```

to configure PART 29 probes.

---

# 5661 — Image Pull Time

Depends on:

```text
image size
registry latency
node cache
```

Smaller images improve rollout.

---

# 5662 — Cold Node Deployment Test

Test image pull/start on node without cached layers.

---

# 5663 — Registry Compression

OCI layers are compressed.

Actual pulled size may differ from local uncompressed size.

---

# 5664 — Container DNS Failure Test

Test dependency DNS resolution failure.

Application should:

```text
fail/retry within bounded policy
```

not hang.

---

# 5665 — Container CA Failure Test

Invalid CA/certificate must fail securely.

Do not disable verification to make test pass.

---

# 5666 — Configuration Precedence

Document precedence:

```text
application defaults
profile config
environment
secret file
command line
```

according to Spring Boot.

---

# 5667 — Spring Profile

Use environment-level profile carefully.

Avoid storing secrets in:

```text
application-prod.yml
```

inside image.

---

# 5668 — application.yml

Safe defaults/config schema can be packaged.

Environment-specific values injected externally.

---

# 5669 — Logging Configuration

Can be packaged if same across environments or overridden externally where needed.

---

# 5670 — Java Tool Options

Platform may inject:

```text
JAVA_TOOL_OPTIONS
```

for standard telemetry/JVM options.

Avoid uncontrolled flags differing per service.

---

# 5671 — JVM Flag Governance

Central platform recommends defaults.

Service-specific override requires performance evidence.

---

# 5672 — OpenTelemetry Agent

Options:

```text
Java agent baked into image
Java agent injected at runtime
SDK instrumentation
```

PART 31 determines standard.

---

# 5673 — Agent Versioning

If baked in, agent version becomes part of image SBOM and patch lifecycle.

---

# 5674 — Runtime Library Injection

Avoid arbitrary mutable injection into container that destroys reproducibility.

---

# 5675 — Init Containers

Kubernetes-specific tasks such as:

```text
certificate preparation
migration
config generation
```

may be handled later.

Application image itself stays focused.

---

# 5676 — Sidecars

Logging/service-mesh sidecars are deployment concerns, not baked into application image.

---

# 5677 — Container vs VM Assumptions

Application must not rely on:

```text
systemd
cron daemon
host filesystem layout
fixed hostname
```

---

# 5678 — Hostname

Container hostname is ephemeral.

Do not use as durable service identity.

---

# 5679 — Instance Identity

Use:

```text
pod name
service name
trace metadata
```

only operationally.

Business data should not depend on instance identity.

---

# 5680 — Filesystem Case Sensitivity

Linux containers are case-sensitive.

Developers on Windows/macOS should test file paths accordingly.

---

# 5681 — Windows Development

Docker Desktop/WSL may mount files differently.

Prefer containerized dependencies while Java app may run on host for fast development.

PART 27 expands this.

---

# 5682 — Line Endings

Scripts copied into Linux image must use correct:

```text
LF
```

line endings.

---

# 5683 — Executable Permission

Git should preserve executable bit for:

```text
gradlew
entrypoint scripts
```

where used.

---

# 5684 — Avoid Entrypoint Shell Script

Prefer direct Java entrypoint unless script is truly needed.

Shell scripts add:

```text
signal
quoting
security
```

complexity.

---

# 5685 — If Entrypoint Script Is Needed

Use:

```text
set -euo pipefail
exec java ...
```

and keep script minimal.

---

# 5686 — Runtime Argument Injection

Use:

```text
JAVA_TOOL_OPTIONS
application args
```

rather than rewriting image.

---

# 5687 — Spring Profile Validation

Prevent accidental:

```text
dev profile
```

in production through startup guard/config validation.

---

# 5688 — Production Debug Features

Disable:

```text
devtools
debug endpoints
H2 console
Swagger write/test tools if not intended
```

or restrict internally.

---

# 5689 — Swagger/OpenAPI UI

If included, access should be:

```text
internal/authenticated
```

according to platform policy.

---

# 5690 — Container User Home

Some libraries assume writable:

```text
$HOME
```

Configure safe home directory if required.

---

# 5691 — Truststore / Keystore

Mount or build trusted public material according to security model.

Private key material remains secret-mounted.

---

# 5692 — JVM Entropy

Modern Linux/JVM entropy behavior is generally appropriate.

Avoid outdated blocking entropy workarounds unless measured.

---

# 5693 — DNS Cache TTL

JVM DNS caching can affect service endpoint changes.

Use modern defaults/platform guidance.

Do not hard-code infinite DNS cache.

---

# 5694 — Container Networking Retries

Clients handle connection reset when pods/endpoints change.

---

# 5695 — Connection Reuse

HTTP/gRPC/Kafka/Redis clients reuse connections within container lifetime.

Graceful shutdown closes them.

---

# 5696 — Docker Build Reproducibility Test

CI can build image twice from same commit and compare:

```text
dependency set
SBOM
labels
```

even if timestamp causes digest variation.

---

# 5697 — Build Timestamp

Avoid embedding unnecessary non-deterministic timestamps into JAR/image where reproducibility matters.

If included, make build metadata explicit.

---

# 5698 — Artifact Checksum

Record:

```text
JAR SHA256
image digest
```

---

# 5699 — Artifact Promotion Record

Release metadata connects:

```text
commit
JAR checksum
image digest
SBOM
scan
signature
```

---

# 5700 — Docker Failure Modes

Common:

```text
image pull failure
wrong architecture
missing CA
wrong user permissions
OOMKill
bad env config
slow startup
SIGTERM not handled
read-only filesystem failure
```

---

# 5701 — Image Pull Failure Runbook

Check:

```text
registry auth
tag/digest exists
network/DNS
registry availability
imagePullSecret
```

---

# 5702 — Permission Failure Runbook

Check:

```text
runtime UID/GID
file ownership
volume permissions
read-only root FS
tmp directory
```

Do not switch to root as first fix.

---

# 5703 — OOM Runbook

Check:

```text
container limit
heap
native memory
thread count
direct memory
recent load
```

---

# 5704 — Slow Startup Runbook

Check:

```text
JVM
migrations
dependency connection
class scanning
CPU throttling
```

---

# 5705 — Certificate Runbook

Check:

```text
truststore
CA chain
hostname
expiry
clock
```

Never disable TLS verification.

---

# 5706 — Wrong Config Runbook

Confirm:

```text
environment
ConfigMap/Secret
profile
variable precedence
```

---

# 5707 — Container Security Incident

If image contains secret:

```text
revoke/rotate secret
remove image
purge registry where possible
rebuild
scan history
```

Do not assume deleting current tag removes leaked layer from every cache.

---

# 5708 — Compromised Base Image

Actions:

```text
identify affected images
stop promotion
rebuild from trusted base
redeploy
investigate
```

---

# 5709 — Container Definition of Done

Every new service image:

- [ ] Multi-stage build.
- [ ] Approved base image.
- [ ] Java version pinned.
- [ ] Non-root runtime.
- [ ] `.dockerignore`.
- [ ] No secrets.
- [ ] Small runtime layer.
- [ ] Exec-form entrypoint.
- [ ] Graceful shutdown.
- [ ] Health endpoints.
- [ ] Runtime configuration externalized.
- [ ] OCI labels.
- [ ] Image scan.
- [ ] SBOM.
- [ ] Container smoke test.

---

# 5710 — Definition of Done: Docker Compose

- [ ] PostgreSQL version matches production major.
- [ ] Kafka version compatible.
- [ ] Redis version compatible.
- [ ] Health checks.
- [ ] Named volumes if desired.
- [ ] Safe local credentials only.
- [ ] Profiles for optional services.
- [ ] Reset command documented.
- [ ] No production secrets.
- [ ] Mock providers where needed.

---

# 5711 — Definition of Done: Release Image

- [ ] Built by trusted CI.
- [ ] Commit recorded.
- [ ] Immutable tag.
- [ ] Digest recorded.
- [ ] Vulnerability scan passed.
- [ ] SBOM attached.
- [ ] Signature/provenance where enabled.
- [ ] Container tests passed.
- [ ] Same digest promoted to UAT/PROD.

---

# 5712 — Dockerfile Review Checklist

## Build

- [ ] Multi-stage.
- [ ] Dependency caching.
- [ ] BuildKit-compatible.
- [ ] No secret ARG/ENV.
- [ ] Clean build context.

## Runtime

- [ ] Minimal JRE.
- [ ] Non-root.
- [ ] Correct ownership.
- [ ] Exec ENTRYPOINT.
- [ ] No build tools.
- [ ] Read-only capable.

---

# 5713 — Runtime Review Checklist

- [ ] UTC/UTF-8.
- [ ] CA certificates.
- [ ] Temp directory.
- [ ] JVM memory headroom.
- [ ] SIGTERM.
- [ ] Health endpoints.
- [ ] stdout/stderr logging.
- [ ] Config externalized.
- [ ] Secret mounts supported.

---

# 5714 — Security Review Checklist

- [ ] Approved base registry.
- [ ] Digest/version pinned.
- [ ] Root not used.
- [ ] Privileged disabled.
- [ ] Dangerous host mounts absent.
- [ ] Secrets absent.
- [ ] Image scanned.
- [ ] SBOM generated.
- [ ] Signature/provenance policy.
- [ ] Debug port disabled.

---

# 5715 — Supply-Chain Review Checklist

- [ ] Trusted CI builder.
- [ ] Dependency lock.
- [ ] Base image traceability.
- [ ] OCI metadata.
- [ ] Image digest.
- [ ] Registry immutability.
- [ ] Continuous CVE monitoring.
- [ ] Rebuild policy.

---

# 5716 — Operations Review Checklist

- [ ] Startup time measured.
- [ ] Memory baseline.
- [ ] CPU baseline.
- [ ] Graceful stop tested.
- [ ] OOM behavior known.
- [ ] Image pull time measured.
- [ ] Health semantics correct.
- [ ] Runbooks available.

---

# 5717 — Local Development Review Checklist

- [ ] Compose starts dependencies.
- [ ] Port overrides.
- [ ] Safe defaults.
- [ ] Seed data separated from migration.
- [ ] Profiles.
- [ ] Reset.
- [ ] Mock providers.
- [ ] Testcontainers not replaced by shared Compose CI.

---

# 5718 — Production Readiness Checklist

Before production:

- [ ] Production Dockerfile reviewed.
- [ ] Same image works in DEV/UAT/PROD.
- [ ] Non-root verified.
- [ ] Read-only filesystem test passes.
- [ ] Graceful shutdown test passes.
- [ ] Resource-limit test passes.
- [ ] CA/TLS test passes.
- [ ] Secret-absence test passes.
- [ ] Container scan has no unapproved critical findings.
- [ ] SBOM generated.
- [ ] Image digest recorded.
- [ ] Image signature/provenance configured where required.
- [ ] Registry retention/immutability configured.
- [ ] Rollback digest available.
- [ ] Cold image pull/start tested.
- [ ] Container runbooks available.

---

# 5719 — Initial Implementation Order

Recommended:

```text
1. Approved Java base images
2. Standard multi-stage Dockerfile
3. .dockerignore
4. Non-root runtime
5. External configuration
6. Graceful shutdown
7. Health endpoints
8. OCI metadata/tagging
9. GitLab registry pipeline
10. Container smoke test
11. Vulnerability scan
12. SBOM
13. Docker Compose dependencies
14. BuildKit caching
15. Read-only filesystem support
16. Image signing/provenance
17. Base-image update automation
```

---

# 5720 — Minimum Viable Docker Standard

Every service must:

```text
build from clean source
use multi-stage Dockerfile
run non-root
use pinned approved Java runtime
externalize config/secrets
log to stdout/stderr
handle SIGTERM
expose health endpoints
have no persistent local business data
produce immutable release image
pass container scan
```

---

# 5721 — Docker Governance

Architecture/platform review should reject:

```text
latest production image tag
root runtime without justification
secret copied into image
environment-specific image rebuilds
production image built on developer laptop
JDK/build tools in runtime without need
host Docker socket mount
mutable local file used as source of truth
```

---

# 5722 — Standard Image Contract

All Spring Boot service images follow:

```text
Runtime User:
non-root

Port:
service-defined, standard default

Config:
environment / mounted files

Logs:
stdout/stderr

Health:
Actuator liveness/readiness

Shutdown:
SIGTERM graceful

Filesystem:
read-only capable

Metadata:
version + commit + digest
```

---

# 5723 — Standard Dockerfile Skeleton

Conceptual:

```dockerfile
# syntax=docker/dockerfile:1.7

FROM <approved-jdk> AS builder
WORKDIR /workspace

COPY build files ...
RUN --mount=type=cache,target=<build-cache> resolve-dependencies

COPY src src
RUN build-artifact

FROM <approved-jre>@sha256:<digest>
WORKDIR /app

COPY --from=builder /workspace/<artifact> /app/app.jar

USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
```

Project-specific details are inserted without breaking security baseline.

---

# 5724 — Standard .dockerignore Skeleton

```text
.git
.gitignore
.idea
.vscode
build
target
out
coverage
*.log
.env
.env.*
*.pem
*.key
local-secrets
docker-data
```

Adjust carefully so required build files are not excluded.

---

# 5725 — Docker Compose Skeleton

Conceptual:

```yaml
services:

  postgres:
    image: postgres:<approved-version>

  redis:
    image: redis:<approved-version>

  kafka:
    image: <approved-kafka-image>

  service:
    build:
      context: .
    environment:
      ...
    depends_on:
      ...
```

PART 27 will turn this into the developer workflow.

---

# 5726 — Container Quality Gates

Required pipeline checks:

```text
Dockerfile lint
build
startup smoke
non-root verification
vulnerability scan
SBOM
secret scan
```

---

# 5727 — Release Artifact Set

Each service release should produce:

```text
JAR/build artifact
container image
image digest
SBOM
scan report
test report
provenance/signature metadata
```

---

# 5728 — Rollback Artifact Set

Keep:

```text
previous production image digest
matching deployment configuration
database compatibility knowledge
```

---

# 5729 — Docker and PART 27

PART 27 defines:

```text
developer machine setup
repository layout
Docker Compose profiles
service start commands
local databases
Kafka/Redis
mock providers
debugging
seed/reset workflow
```

---

# 5730 — Docker and PART 29

PART 29 Kubernetes will consume:

```text
immutable image
health endpoints
non-root runtime
resource measurements
SIGTERM behavior
read-only filesystem capability
```

---

# 5731 — Docker and PART 32

PART 32 CI/CD will automate:

```text
image build
tagging
scan
SBOM
push
promotion
```

---

# 5732 — Docker and PART 35

PART 35 will harden:

```text
image signing
admission policy
runtime capabilities
seccomp
supply chain
```

---

# 5733 — Docker and PART 39

Production Readiness requires container evidence from this chapter.

---

# 5734 — PART 26 Deliverables

PART 26 produces:

1. Docker scope and container principles.
2. One-service/one-image rule.
3. Multi-stage build architecture.
4. Builder/runtime separation.
5. Java runtime standard.
6. Base-image selection guidance.
7. Alpine/distroless tradeoffs.
8. Dockerfile examples.
9. Build-test placement.
10. BuildKit/cache strategy.
11. Secret-safe build practices.
12. Runtime configuration model.
13. Build-once/promote-same-image principle.
14. Image tags and digests.
15. OCI labels.
16. Reproducible build strategy.
17. Dependency/base pinning.
18. `.dockerignore`.
19. Layering guidance.
20. Spring Boot layered JAR guidance.
21. Image-size controls.
22. Non-root runtime.
23. File permissions.
24. Read-only root filesystem design.
25. Linux capability restrictions.
26. JVM container-awareness.
27. Memory/headroom guidance.
28. OOM behavior.
29. Timezone/encoding.
30. CA/truststore handling.
31. Exec-form entrypoint.
32. SIGTERM/graceful shutdown.
33. Health endpoints.
34. stdout/stderr logging.
35. Secret injection.
36. Configuration validation.
37. Docker Compose purpose/profiles.
38. Local PostgreSQL/Kafka/Redis guidance.
39. Seed/reset behavior.
40. CI image build.
41. Registry standards.
42. Image immutability.
43. Vulnerability scanning.
44. SBOM.
45. Image signing/provenance.
46. Continuous CVE monitoring.
47. Startup/migration behavior.
48. Restart safety.
49. Resource measurement.
50. Container-level testing.
51. Multi-architecture guidance.
52. Local development image/debugging.
53. Registry retention/rollback.
54. Dockerfile lint/policy.
55. Container failure modes/runbooks.
56. Definition-of-Done checklists.
57. Production-readiness checklist.
58. Docker governance.
59. Standard image/Dockerfile/Compose skeletons.
60. Release artifact requirements.

---

# 5735 — Exit Criteria

PART 26 is complete when the team can answer:

### Reproducibility

```text
Can the same source commit produce a traceable, repeatable image?
```

### Security

```text
Does the application run non-root without secrets or unnecessary tooling?
```

### Configuration

```text
Can the exact same image digest run in DEV, UAT, and PROD?
```

### Runtime

```text
Does Java respect container memory/CPU constraints with safe headroom?
```

### Shutdown

```text
Does SIGTERM safely stop HTTP requests, Kafka consumers, and background workers?
```

### Storage

```text
Can the container be replaced without losing business data?
```

### Supply Chain

```text
Do we know the source commit, base image, SBOM, scan result, and image digest?
```

### Operations

```text
Can operators diagnose startup, OOM, permission, certificate, image-pull, and configuration failures?
```

### Local Development

```text
Can developers start matching PostgreSQL/Kafka/Redis dependencies through Docker Compose without production credentials?
```

If these answers are clear and tested, the service images are ready for use by the local-development and deployment platforms.

---

# 5736 — Handoff to PART 27

PART 27 defines the Local Development Environment.

```text
PART 26
Docker
      ↓
Reproducible Images + Compose Dependencies
      ↓
PART 27
Local Development Environment
```

PART 27 will define:

```text
Developer Workstation Setup
Repository Layout
Java / IDE
Docker Desktop / Engine
Docker Compose Profiles
PostgreSQL
Kafka
Redis
Local Service Discovery
Environment Variables
Seed Data
Mock Providers
Debugging
Hot Reload
Testcontainers
Local Observability
Start / Stop / Reset Commands
Developer Troubleshooting
```

The key transition is:

```text
PART 26
= how a service is packaged

PART 27
= how developers run and work with those services efficiently every day
```

---

# PART 26 — Summary

Docker provides a standardized packaging boundary for every deployable service.

The build flow is:

```text
Source
  ↓
Approved JDK Builder
  ↓
Compile / Package
  ↓
Minimal JRE Runtime
  ↓
Non-Root Container
  ↓
Scan + SBOM + Signature
  ↓
Immutable Registry Image
```

The runtime model is:

```text
Immutable Image
+
External Configuration
+
External Secrets
+
Durable External Data Stores
+
stdout/stderr Logs
+
Health Endpoints
+
Graceful SIGTERM
```

The most important architecture rules are:

```text
Build once and promote the same image digest.
Use multi-stage builds.
Run non-root.
Do not bake secrets into images.
Use approved pinned base images.
Keep build tooling out of runtime.
Treat the filesystem as ephemeral.
Log to stdout/stderr.
Handle SIGTERM correctly.
Design for read-only root filesystem.
Measure JVM memory beyond heap.
Do not use mutable latest tags in production.
Generate SBOM and scan every release image.
Prefer signed/provenanced artifacts for production.
Use Docker Compose for developer dependencies, not production orchestration.
Use Testcontainers for isolated automated integration tests.
Keep rollback images immutable and ready.
```

The next chapter defines the developer workflow around these container standards:

```text
PART 27 — Local Development Environment
```

---

**End of PART 26 — Docker**
