---
title: "PHASE 22 — Docker"
---

# PHASE 22 — Docker

> **Purpose:** Package every verified microservice into reproducible, immutable, secure, portable, observable, resource-aware container images suitable for local development, CI/CD, Kubernetes, and production. This phase standardizes Dockerfiles, multi-stage builds, Java runtime images, build caching, non-root execution, immutable artifacts, runtime configuration, secrets, JVM sizing, graceful shutdown, health endpoints, container logging, Docker Compose dependencies, registry standards, vulnerability scanning, SBOM, provenance/signing, container-level tests, failure runbooks, governance, and production-readiness evidence.
>
> **Previous Phase:** Phase 21 — Testing
>
> **Next Phase:** Phase 23 — Local Development
>
> **Primary Architecture Basis:** PART 26 — Docker, supported by the completed Testing, Redis, Observability, Security, CI/CD, Kubernetes, and service-specific implementation specifications.
>
> **Primary Stack:** Docker, Docker BuildKit, Java LTS, Spring Boot, Gradle/Maven, GitLab CI/CD, PostgreSQL, Kafka, Redis, OCI registry, Kubernetes.
>
> **Status:** Platform Containerization / Implementation Specification

---

# 1. Phase 22 Goal

Build a standardized container packaging system that can answer:

```text
Can the same source commit produce a traceable image?
Does every service use a standard multi-stage Dockerfile?
Does production run non-root?
Are secrets excluded from image layers?
Can the same image digest run in DEV, UAT, and PROD?
Does Java behave safely under CPU/memory limits?
Does SIGTERM stop HTTP/Kafka/workers safely?
Can the filesystem be read-only?
Can containers be replaced without business-data loss?
Can operators identify the commit, base image, SBOM, scan, and digest?
Can developers start matching local dependencies with Docker Compose?
```

---

# 2. Docker Role

Docker defines:

```text
how verified software is packaged
```

Docker does not define:

```text
service boundaries
database ownership
business transactions
authorization
Saga correctness
```

Those were decided earlier.

---

# 3. Core Container Principle

A production image should contain:

```text
application runtime
application artifact
required runtime libraries
minimal OS/runtime dependencies
```

It should not contain:

```text
production secrets
environment-specific credentials
mutable business configuration
source-control metadata
developer tools
build caches
unnecessary package managers
```

---

# 4. Container Goals

Every production image should be:

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

# 5. One Service, One Image

Each deployable service receives its own image.

Examples:

```text
api-gateway
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
mission-service
notification-service
integration-service
```

---

# 6. One Primary Process Per Container

Recommended:

```text
one Spring Boot process per application container
```

Do not bundle:

```text
Spring Boot
+
cron daemon
+
nginx
+
log shipper
```

into one application image.

---

# 7. Supporting Processes

Logging agents, service-mesh proxies, migration jobs, certificate helpers, and other supporting concerns belong to:

```text
platform/orchestrator
sidecar
init container
separate workload
```

not the application image by default.

---

# 8. Immutable Runtime Artifact

Production container layers are treated as:

```text
immutable
```

The application must not rewrite:

```text
JAR
embedded config
runtime libraries
image layers
```

---

# 9. Ephemeral Container Filesystem

Anything written locally may disappear after:

```text
restart
reschedule
replacement
node failure
```

---

# 10. No Authoritative Business Data on Container Disk

Do not store authoritative:

```text
orders
wallet data
payments
uploads
reports
customer data
integration state
```

only on container-local filesystem.

---

# 11. Durable State Belongs Outside Container

Use:

```text
PostgreSQL
Kafka
Redis where appropriate
object storage
partner/ERP durable store
other approved durable stores
```

---

# 12. Standard Build Flow

```text
Source
  ↓
Approved JDK Builder
  ↓
Compile / Test / Package
  ↓
Application Artifact
  ↓
Minimal JRE Runtime
  ↓
Non-Root Container
  ↓
Scan + SBOM + Provenance
  ↓
Immutable Registry Image
```

---

# 13. Multi-Stage Build

All production Dockerfiles should use multi-stage builds.

Benefits:

```text
build tooling absent from runtime
smaller runtime image
smaller attack surface
clear artifact boundary
better layer control
```

---

# 14. Builder Stage

May contain:

```text
JDK
Gradle/Maven
compiler
test/build tooling
dependency cache
```

---

# 15. Runtime Stage

Should contain only:

```text
JRE/runtime
application artifact
required CA certificates
required native libraries
minimal runtime files
```

---

# 16. Runtime JDK vs JRE

Default:

```text
JRE/runtime image
```

Full JDK remains only if runtime functionality genuinely requires it.

---

# 17. Java LTS Standard

Platform should operate one approved Java LTS generation at a time.

Architecture example:

```text
Java 21 LTS
```

Final version remains organization-approved.

---

# 18. Java Version Pinning

Avoid:

```text
latest
```

Prefer:

```text
specific approved version
```

and ideally:

```text
digest-pinned runtime base
```

for production.

---

# 19. Approved Base Image

Select one organizational base family.

Possible source examples:

```text
Eclipse Temurin
Amazon Corretto
Microsoft OpenJDK
UBI/OpenJDK
Distroless Java
```

---

# 20. Recommended Initial Base Strategy

Start operationally simple:

```text
builder:
approved JDK image

runtime:
approved slim JRE image
```

Move to distroless after operational/debugging requirements are understood.

---

# 21. Alpine Warning

Do not choose Alpine only for smaller size.

Risks include:

```text
musl/glibc differences
native library compatibility
DNS/runtime differences
debugging complexity
```

---

# 22. Distroless Benefits

```text
minimal attack surface
no shell
no package manager
small runtime
```

---

# 23. Distroless Tradeoffs

```text
harder interactive debugging
certificate assumptions
native dependency assumptions
```

---

# 24. Production Runtime Tooling

Production image should generally exclude:

```text
curl
wget
vim
git
gcc
package manager
Gradle
Maven
```

unless explicitly required.

---

# 25. Dockerfile Location

Recommended per service:

```text
service-root/
├── Dockerfile
├── .dockerignore
├── build.gradle / pom.xml
├── src/
└── ...
```

---

# 26. Dockerfile Naming

Standard:

```text
Dockerfile
```

Optional:

```text
Dockerfile.dev
Dockerfile.migration
```

only when a documented use case exists.

---

# 27. Standard Gradle Dockerfile Skeleton

```dockerfile
# syntax=docker/dockerfile:1.7

FROM <approved-jdk> AS builder
WORKDIR /workspace

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew

RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew dependencies --no-daemon || true

COPY src src

RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew clean bootJar --no-daemon

FROM <approved-jre>@sha256:<approved-digest>
WORKDIR /app

COPY --from=builder --chown=10001:10001 \
    /workspace/build/libs/app.jar /app/app.jar

USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
```

Exact build task/artifact path is service-specific.

---

# 28. Standard Maven Skeleton

```dockerfile
# syntax=docker/dockerfile:1.7

FROM <approved-jdk> AS builder
WORKDIR /workspace

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

RUN chmod +x mvnw

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B dependency:go-offline

COPY src src

RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw -B package

FROM <approved-jre>@sha256:<approved-digest>
WORKDIR /app

COPY --from=builder --chown=10001:10001 \
    /workspace/target/app.jar /app/app.jar

USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
```

---

# 29. Build/Test Placement

Recommended CI flow:

```text
compile
  ↓
unit/integration/contract gates
  ↓
package artifact
  ↓
build container
  ↓
container tests
```

Do not hide the entire test strategy only inside Docker build logs.

---

# 30. Image Input Traceability

If JAR is built before Docker build, the input artifact must be traceable to:

```text
commit SHA
pipeline
application version
artifact checksum
```

---

# 31. Builder Dependency Caching

Layer order:

```text
copy build descriptor
resolve dependencies
copy application source
compile/package
```

---

# 32. BuildKit

Use modern BuildKit for:

```text
cache mounts
secret mounts
parallel stage optimization
provenance
```

---

# 33. Gradle BuildKit Cache

Possible:

```dockerfile
RUN --mount=type=cache,target=/root/.gradle ...
```

---

# 34. Maven BuildKit Cache

Possible:

```dockerfile
RUN --mount=type=cache,target=/root/.m2 ...
```

---

# 35. Build Cache Security

Do not make secret material part of persistent image layers/cache.

Examples:

```text
repository password
private key
service account
token
```

---

# 36. Build Secret

For private dependency registry:

```dockerfile
RUN --mount=type=secret,id=repo_credentials ...
```

or trusted CI secret mechanism.

---

# 37. Secret ARG Anti-Pattern

Do not use patterns that leak credentials into history:

```dockerfile
ARG MAVEN_PASSWORD
RUN echo "$MAVEN_PASSWORD"
```

---

# 38. Docker ARG Use

`ARG` is suitable for non-secret build metadata:

```text
version
commit SHA
build identifier
source repository
```

---

# 39. Docker ENV Use

Image `ENV` may define safe defaults such as:

```text
port
logging format
non-sensitive Java options
```

Never bake:

```text
DB password
JWT private key
provider secret
Kafka credential
```

---

# 40. Runtime Configuration

Configuration comes from:

```text
environment variables
mounted configuration
ConfigMap
Secret
external secret manager
```

---

# 41. Build Once, Promote Same Image

The same image digest should move through:

```text
DEV
UAT
PROD
```

Only runtime configuration changes.

---

# 42. Environment-Specific Image Anti-Pattern

Avoid:

```text
identity-service-dev
identity-service-uat
identity-service-prod
```

built from different code/config.

---

# 43. Image Promotion

```text
Build
  ↓
Test
  ↓
DEV
  ↓
UAT
  ↓
PROD
```

using the same digest.

---

# 44. Image Tags

Recommended human-readable tags:

```text
semantic/release version
commit SHA
```

Example:

```text
ordering-service:1.8.0
ordering-service:git-a1b2c3d
```

---

# 45. latest Tag

Do not use mutable:

```text
latest
```

as the production deployment identity.

---

# 46. Immutable Release Tags

Protected release tags should not be overwritten.

---

# 47. Image Digest

Production deployment should resolve to:

```text
sha256:<digest>
```

for exact image bytes.

---

# 48. Tag + Digest

Human-facing:

```text
1.8.0
```

Operational deployment record:

```text
sha256:...
```

---

# 49. OCI Labels

Recommended:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.created
```

---

# 50. Commit Traceability

Given a running container, operator must identify:

```text
Git commit
application version
image digest
build pipeline
```

---

# 51. Reproducible Build

Controlled inputs:

```text
source
dependencies
base image digest
build configuration
toolchain
```

should create functionally identical artifacts.

---

# 52. Bit-for-Bit Reproducibility

Desirable where tooling permits, but functional traceability is the minimum.

---

# 53. Dependency Pinning

Avoid floating dependency versions.

Use:

```text
Gradle dependency locking
Maven dependency management
```

---

# 54. Base Image Pinning

Highly controlled production example:

```dockerfile
FROM eclipse-temurin:21-jre@sha256:<digest>
```

---

# 55. Base Digest Updates

Digest pinning requires deliberate monitoring/rebuild for:

```text
JRE patches
CA updates
base CVEs
```

---

# 56. Image Rebuild Without App Code Change

Rebuild when:

```text
base critical CVE fixed
JRE patch released
dependency vulnerability fixed
```

---

# 57. Image Build Revision

Example:

```text
application 1.8.0
image build 1.8.0-r2
```

---

# 58. .dockerignore

Required for every service.

Recommended skeleton:

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

---

# 59. Build Context

Keep small for:

```text
speed
security
better cache
less accidental secret inclusion
```

---

# 60. Secret Inclusion Scan

CI should detect accidental:

```text
.env
id_rsa
*.pem
*.key
service-account.json
```

before publication.

---

# 61. Layer Design

Optimize for:

```text
cache reuse
small changed layer
clear runtime boundary
```

---

# 62. Spring Boot Layered JAR

Potential layers:

```text
dependencies
spring-boot-loader
snapshot-dependencies
application
```

---

# 63. Layered JAR Benefit

When only application code changes:

```text
large dependency layer can remain cached
```

reducing registry transfer.

---

# 64. Layering Complexity

Do not add sophisticated layer extraction unless:

```text
build speed
registry transfer
deployment pull time
```

justify it.

---

# 65. Image Size

Smaller images generally improve:

```text
pull time
registry transfer
scheduling/startup
attack surface
```

but stability is more important than saving a few MB.

---

# 66. Image Size Budget

Track size per service and review regressions.

---

# 67. Runtime Image Must Exclude

```text
Gradle cache
Maven cache
source tree
test fixtures
coverage files
```

---

# 68. Non-Root Requirement

Production application process runs:

```text
non-root
```

unless an approved exception exists.

---

# 69. Stable UID/GID

Example organizational standard:

```text
10001:10001
```

---

# 70. Runtime File Ownership

Ensure runtime user owns only required paths such as:

```text
/app
configured writable temp directory
```

---

# 71. chmod 777 Anti-Pattern

Never fix permissions with:

```bash
chmod -R 777
```

Use correct ownership and least privilege.

---

# 72. Rootless Runtime Assumptions

Application should not require:

```text
ports < 1024
runtime package installation
kernel changes
privileged operations
```

---

# 73. Application Port

Prefer an unprivileged port.

Example:

```text
8080
```

---

# 74. EXPOSE

May document:

```dockerfile
EXPOSE 8080
```

This does not configure production network policy.

---

# 75. Read-Only Root Filesystem

Application should be designed for:

```yaml
readOnlyRootFilesystem: true
```

in Kubernetes where possible.

---

# 76. Writable Temp

If needed:

```text
/tmp
```

or a service-specific temp path should be backed by bounded ephemeral writable storage.

---

# 77. Spring Temporary Paths

Review:

```text
multipart upload temp
Tomcat temp
JVM temp
generated files
```

---

# 78. Upload Persistence

Validated uploads should move to:

```text
object storage
durable external storage
```

not remain only inside container.

---

# 79. Linux Capabilities

Application should need:

```text
no additional Linux capabilities
```

under normal conditions.

---

# 80. Drop Capabilities

Later Kubernetes hardening should be able to use:

```text
drop ALL
```

where compatible.

---

# 81. Privileged Mode

Never run application container:

```text
--privileged
```

in production.

---

# 82. Dangerous Host Mounts

Do not mount:

```text
Docker socket
host /
host SSH keys
```

into application container.

---

# 83. JVM Container Awareness

Modern JVM recognizes cgroup:

```text
CPU
memory
```

but runtime behavior still requires measurement.

---

# 84. Heap Is Not Total Container Memory

Total JVM process also needs:

```text
heap
metaspace
thread stacks
direct buffers
code cache
native libraries
JIT/runtime native memory
```

---

# 85. MaxRAMPercentage

Possible:

```text
-XX:MaxRAMPercentage=<measured-value>
```

Choose based on real performance testing.

---

# 86. InitialRAMPercentage

May be configured if measurement justifies it.

Do not copy generic JVM flags blindly.

---

# 87. Heap Headroom

For a:

```text
1 GiB
```

container, do not assume:

```text
-Xmx1g
```

is safe.

---

# 88. Native Memory Headroom

Reserve for:

```text
metaspace
thread stacks
direct buffers
native TLS
JIT
other libraries
```

---

# 89. Out-of-Memory Policy

Define:

```text
process exit
container restart
heap dump behavior
alerts
```

---

# 90. ExitOnOutOfMemoryError

Often suitable:

```text
-XX:+ExitOnOutOfMemoryError
```

for stateless/recoverable containerized services.

---

# 91. Heap Dump Risk

Heap dump may contain:

```text
tokens
PII
credentials
business data
```

and consume significant disk.

Use controlled destination/retention only.

---

# 92. GC Standard

Use JVM default G1 initially unless profiling justifies:

```text
ZGC
other collector
```

---

# 93. CPU Limits

Too-low CPU quotas can create:

```text
latency
GC delay
JIT slowdown
timeouts
```

---

# 94. ActiveProcessorCount

May be used for special runtime cases:

```text
-XX:ActiveProcessorCount=<n>
```

only with evidence.

---

# 95. Thread Pools

Size according to:

```text
container CPU
blocking vs async workload
external concurrency
```

not host CPU count.

---

# 96. Timezone

Prefer service timestamps in:

```text
UTC
```

---

# 97. JVM Timezone

May set:

```text
-Duser.timezone=UTC
```

if organization standard requires it.

---

# 98. Business Local Time

Use explicit business zone such as:

```text
Asia/Phnom_Penh
```

inside application logic when required.

Do not rely on OS default timezone.

---

# 99. Locale

Use deterministic locale where parsing/formatting depends on locale.

---

# 100. Character Encoding

Use:

```text
UTF-8
```

Important for:

```text
Khmer text
mission translation
notification content
promotion content
```

---

# 101. Runtime CA Certificates

Runtime image needs trusted CA certificates for:

```text
PostgreSQL TLS
Kafka TLS
partner HTTPS
OIDC / JWKS
```

---

# 102. Enterprise CA

Inject trusted enterprise CA through controlled mechanism.

Never disable TLS verification.

---

# 103. CA Patch Lifecycle

Base image rebuild should regularly receive:

```text
CA updates
JRE security updates
```

---

# 104. Entrypoint

Prefer exec form:

```dockerfile
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

---

# 105. Shell Entrypoint Anti-Pattern

Avoid:

```dockerfile
ENTRYPOINT java -jar /app/app.jar
```

because signal propagation is less reliable.

---

# 106. Java as PID 1

Exec-form entrypoint lets Java receive Unix signals directly.

---

# 107. SIGTERM

Service must receive:

```text
SIGTERM
```

and enter graceful shutdown.

---

# 108. Graceful Shutdown Flow

```text
SIGTERM
  ↓
stop accepting new traffic
  ↓
finish eligible in-flight work
  ↓
stop Kafka polling/workers
  ↓
commit only successful offsets/work
  ↓
flush telemetry
  ↓
close DB/Kafka/Redis/HTTP clients
  ↓
exit before grace deadline
```

---

# 109. Spring Graceful Shutdown

Configure:

```text
server.shutdown=graceful
```

or current Spring Boot equivalent.

---

# 110. Grace Deadline

Shutdown must complete within Kubernetes:

```text
terminationGracePeriodSeconds
```

defined later.

---

# 111. Kafka Consumer Shutdown

On SIGTERM:

```text
stop new polling
finish safe current record
commit only successful processing
close consumer
```

---

# 112. Saga Worker Shutdown

Never depend on an in-memory lease/state that disappears permanently.

Durable Saga state allows another replica to continue.

---

# 113. Scheduler Shutdown

Scheduled lock/lease should:

```text
release
or
expire safely
```

---

# 114. Health Endpoints

Every service exposes:

```text
liveness
readiness
```

via Spring Boot Actuator or equivalent.

---

# 115. Docker HEALTHCHECK

Useful mainly for:

```text
Docker Compose
local development
```

Production Kubernetes probes are authoritative later.

---

# 116. Liveness Meaning

Answers:

```text
Is the process internally alive?
```

---

# 117. Liveness Dependency Trap

Liveness should not normally fail just because:

```text
Kafka
Redis
payment provider
external API
```

is temporarily unavailable.

Otherwise:

```text
dependency outage
→ pod restart
→ larger outage
```

---

# 118. Readiness Meaning

Answers:

```text
Can this instance safely accept traffic?
```

---

# 119. Readiness Dependencies

May account for truly critical dependencies carefully.

Example:

```text
required PostgreSQL unavailable
→ not ready
```

---

# 120. Startup Probe Preparation

Application startup semantics must support a later Kubernetes startup probe.

---

# 121. Actuator Exposure

Expose only required endpoints:

```text
health
prometheus
info
```

on internal/authenticated surfaces.

---

# 122. Actuator Security

Do not expose sensitive actuator operations publicly.

---

# 123. Logging

Production application logs go to:

```text
stdout
stderr
```

---

# 124. No Log Side Process

Do not bundle:

```text
logrotate
Filebeat
fluent agent
```

inside the application container.

---

# 125. Structured Logs

Use platform structured format, ideally JSON when standardized.

---

# 126. Local File Logs

Avoid as primary production logging.

Any temporary local log must be:

```text
bounded
ephemeral
non-authoritative
```

---

# 127. Metrics Endpoint

Expose application metrics via:

```text
Prometheus endpoint
```

according to observability standard.

---

# 128. Build Metadata Endpoint

Safe `/actuator/info` may expose:

```text
application version
commit SHA
build identifier/time
```

without secret information.

---

# 129. Runtime Secret Injection

Examples:

```text
DB password
Kafka credential
JWT signing key
provider API secret
```

enter at runtime, never build time.

---

# 130. Secret Environment Variable Tradeoff

Environment variables can leak through:

```text
process inspection
debug dump
misconfigured logs
```

---

# 131. Highly Sensitive Secret

Prefer where supported:

```text
mounted secret file
secret agent
external secret manager
```

---

# 132. Secret File Permissions

Secret file readable only by runtime UID/GID.

---

# 133. Private Keys

Never:

```dockerfile
COPY private-key.pem /app/
```

into production image.

---

# 134. Secret Rotation

Runtime may support:

```text
live reload
or
rolling restart
```

depending secret/provider.

---

# 135. Configuration Validation

Fail startup clearly on invalid required:

```text
DB URL
JWT issuer
Kafka topic
timeout
provider URL
required secret path
```

---

# 136. Optional Integration

Optional dependency may start:

```text
disabled
```

with clear health/metrics instead of crashing core service.

---

# 137. Environment Variable Naming

Use consistent service prefix / Spring-compatible naming.

Example:

```text
SERVICE_FEATURE_PROPERTY
```

---

# 138. Safe Defaults

Safe defaults can exist for:

```text
port
logging
timeouts
```

Do not silently default production to:

```text
localhost
development credentials
```

---

# 139. localhost Inside Container

Inside a container:

```text
localhost
```

means that same container.

Dependencies should use configured DNS names.

---

# 140. Compose Service DNS

Local examples:

```text
postgres
kafka
redis
```

---

# 141. Container Network

Compose provides a dedicated local project network.

Production networking is handled later by Kubernetes/networking phases.

---

# 142. Host Port Mapping

Useful only for local development where needed.

Dockerfile itself does not require host mapping.

---

# 143. Docker Compose Purpose

Use for:

```text
developer dependencies
manual integration environment
cross-service exploration
```

Not production orchestration.

---

# 144. Compose Scope

May include:

```text
PostgreSQL
Redis
Kafka
Schema Registry
selected services
WireMock/MockServer
```

---

# 145. Avoid Full Platform by Default

Running every service locally may consume excessive:

```text
RAM
CPU
startup time
```

Use selective profiles.

---

# 146. Compose Profiles

Possible:

```text
core
messaging
observability
service-specific
full
```

---

# 147. Minimal Order Development Profile

Example:

```text
PostgreSQL
Kafka
Redis
Ordering
mock Catalog
mock Inventory
mock Payment
```

or selected real dependencies.

---

# 148. Local .env

May contain:

```text
non-production fake/local values
```

Never real production secrets.

---

# 149. .env.example

Commit:

```text
variable names
safe placeholders
documentation
```

not secrets.

---

# 150. Compose Volumes

Named volumes may preserve local:

```text
PostgreSQL
Kafka
Redis
```

state between restarts.

---

# 151. Local Reset

Provide explicit destructive reset:

```bash
docker compose down -v
```

or project wrapper.

---

# 152. Health-Based Dependency Readiness

Prefer health conditions over:

```bash
sleep 30
```

---

# 153. depends_on Limitation

`depends_on` ordering does not alone guarantee application readiness.

Services still need bounded retry/backoff.

---

# 154. Local Kafka Version

Use production-compatible major/version.

---

# 155. Local PostgreSQL Version

Match production major.

---

# 156. Local Redis Version

Match production major.

---

# 157. Database Initialization

Use application Flyway migrations.

Do not maintain a divergent handwritten Compose schema.

---

# 158. Seed Data

Keep:

```text
schema migration
```

separate from:

```text
development seed
```

---

# 159. Compose Local Credentials

Fake development credentials are acceptable locally.

Zero production reuse.

---

# 160. Mock Providers

Use:

```text
WireMock
MockServer
```

for local:

```text
payment
delivery
ERP
partner API
```

---

# 161. CI Image Build

CI builds from:

```text
clean checkout
```

not a developer workstation output.

---

# 162. CI Builder

Possible:

```text
BuildKit
Kaniko
Buildah
cloud builder
Docker-in-Docker
```

Choose platform standard.

---

# 163. Privileged Docker-in-Docker

Privileged DinD increases risk.

Prefer safer builder where platform supports it.

---

# 164. Build Isolation

Build runner should not expose:

```text
host Docker socket
production credentials
```

without strict controls.

---

# 165. Container Registry

Use approved registry.

Examples from architecture:

```text
GitLab Container Registry
ECR
Artifact Registry
ACR
Harbor
```

---

# 166. Registry Authentication

CI receives scoped push credentials.

Runtime receives only image-pull access.

---

# 167. Registry Per Service

Each deployable service should have its own registry repository.

Example:

```text
registry/org/platform/ordering-service:<tag>
```

---

# 168. Registry Retention

Keep:

```text
production images
rollback images
active UAT images
recent CI/branch images
```

Clean stale unreferenced builds per policy.

---

# 169. Registry Immutability

Protected release tags/repositories should prevent overwrite.

---

# 170. Vulnerability Scanning

Scan:

```text
OS packages
JRE
application dependencies where supported
known CVEs
```

before promotion.

---

# 171. Scanner

Select organizational standard such as:

```text
Trivy
Grype
GitLab Container Scanning
cloud-native scanner
```

---

# 172. Scan Gate

Block promotion for:

```text
unapproved critical exploitable vulnerabilities
```

according to security policy.

---

# 173. Vulnerability Exception

Requires:

```text
risk assessment
owner
expiration date
mitigation
```

---

# 174. False Positive Management

Suppress only with documented justification.

---

# 175. Base Image Vulnerability

Fix by:

```text
updating/rebuilding trusted base
```

not ignoring permanently.

---

# 176. SCA + Image Scan

Application dependency SCA complements container scanning.

They are not substitutes.

---

# 177. SBOM

Generate SBOM for every release image.

Preferred supported formats:

```text
CycloneDX
SPDX
```

---

# 178. SBOM Contents

Should identify:

```text
OS packages
JRE/runtime
application dependencies
versions
```

---

# 179. SBOM Storage

Attach to:

```text
CI artifacts
registry attestation
release record
```

---

# 180. Image Signing

Production pipeline should support trusted image signing.

Example source direction:

```text
Cosign
```

or registry-native mechanism.

---

# 181. Signature Verification

Later Kubernetes admission may require:

```text
trusted signed images only
```

---

# 182. Build Provenance

Capture:

```text
source commit
builder identity
pipeline
dependencies
base image
```

---

# 183. SLSA Direction

Supply-chain hardening may move toward SLSA-aligned provenance.

Detailed policy belongs to later security-hardening phase.

---

# 184. Scan Timing

Scan:

```text
during build
before production
continuously after publication
```

because new CVEs appear after release.

---

# 185. Continuous CVE Monitoring

A previously clean image can later become vulnerable.

Track deployed digests continuously.

---

# 186. Startup Flow

```text
validate configuration
initialize required clients
run safe startup checks/migrations per strategy
become ready only when usable
```

---

# 187. Flyway Runtime Strategy

Possible:

```text
application startup Flyway
dedicated migration job
CI/CD migration stage
```

Production Kubernetes strategy is finalized later.

---

# 188. Migration Race

If multiple replicas run Flyway simultaneously, Flyway locking usually protects execution, but the operational approach should remain intentional.

---

# 189. Migration Failure

If DB schema is incompatible:

```text
do not accept traffic
fail startup/readiness
```

---

# 190. Dependency Startup Retry

Transient dependency startup order requires:

```text
bounded reconnect
backoff
deadline
```

not endless crash loops.

---

# 191. Critical Startup Dependency

Example:

```text
PostgreSQL unavailable
```

usually prevents readiness.

---

# 192. Optional Startup Dependency

Example:

```text
analytics provider unavailable
```

should not necessarily prevent service readiness.

---

# 193. Restart Safety

Container may restart at any time.

Correctness must rely on:

```text
durable DB state
Kafka offsets/inbox
Saga recovery
idempotency
```

not in-memory process state.

---

# 194. In-Memory State

Allowed for:

```text
cache
temporary optimization
```

only when loss behavior is acceptable.

---

# 195. Scheduled Job Safety

Schedulers must already support multi-replica operation through:

```text
DB locks
leader election
job ownership
lease
```

---

# 196. Container Time

Do not depend on manually set container/host clocks.

Infrastructure provides synchronized time.

Business logic uses explicit time abstraction.

---

# 197. NTP Drift Impact

Large drift can break:

```text
JWT
TLS
Kafka
expiry
distributed tracing
```

---

# 198. Resource Awareness

Application must not assume:

```text
unlimited CPU
unlimited memory
```

---

# 199. Resource Baseline

Measure per service:

```text
idle memory
startup CPU
steady CPU
peak heap
startup memory peak
native memory
```

for later Kubernetes requests/limits.

---

# 200. JVM Native Memory

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

# 201. Thread Stack Memory

Large thread count can consume significant memory even with small heap.

---

# 202. Netty Direct Memory

gRPC/reactive services may consume significant direct buffer memory.

---

# 203. Container OOMKill

A cgroup/container memory kill is not the same as Java heap OOM.

---

# 204. OOM Diagnosis

Use:

```text
container memory metric
JVM metrics
exit code
orchestrator events
recent load
```

---

# 205. Exit Codes

Unrecoverable startup/runtime failure should exit non-zero.

---

# 206. Signal Handling Test

CI must run:

```bash
docker stop
```

and verify graceful Spring shutdown.

---

# 207. Stop Timeout

Local/CI Docker stop timeout should match intended graceful window.

---

# 208. HEALTHCHECK Tooling

Do not add large tools like curl merely for Docker HEALTHCHECK if Kubernetes will probe HTTP directly.

---

# 209. Test the Image Itself

Testing only the JAR is insufficient.

Container-level behavior must also be verified.

---

# 210. Clean Build Test

CI proves:

```text
Dockerfile builds from a clean checkout
```

---

# 211. Container Startup Test

Run image with test configuration and assert:

```text
process starts
readiness becomes healthy
safe endpoint responds
```

---

# 212. Non-Root Test

Assert:

```text
runtime UID != 0
```

---

# 213. Read-Only Filesystem Test

Run with:

```bash
--read-only
```

plus expected temp mount.

Verify normal operation.

---

# 214. Secret Absence Test

Place known fake secret marker in CI build environment.

Inspect image/history.

Expected:

```text
marker absent
```

---

# 215. Runtime Layer Test

Verify absence of:

```text
source
Gradle
Maven
compiler
private repository credentials
```

---

# 216. Image Vulnerability Test

Scan built image in CI.

---

# 217. SBOM Test

Verify SBOM exists and is attached to release evidence.

---

# 218. Graceful Shutdown Test

Start service.

Create:

```text
in-flight HTTP request
or
Kafka record processing
```

Send:

```text
SIGTERM
```

Verify safe completion/retry semantics.

---

# 219. Crash Restart Test

Abruptly kill container, restart it, and verify recovery through:

```text
DB
Saga
Kafka
Inbox
idempotency
```

---

# 220. Same Image / Different Environment Test

Run the exact same image with:

```text
DEV-like config
UAT-like config
```

No rebuild required.

---

# 221. Wrong Configuration Test

Missing required environment/secret should fail clearly.

---

# 222. Resource-Limit Test

Run image with realistic:

```text
CPU quota
memory limit
```

and execute representative smoke/load.

---

# 223. Low-Memory Test

Determine failure threshold and prove state is not corrupted.

---

# 224. CPU Throttle Test

Observe:

```text
latency
GC
timeouts
startup
```

under constrained CPU.

---

# 225. Container Network Test

From inside container verify:

```text
DNS
TLS
connection retry
```

not only from host JVM.

---

# 226. Certificate Test

Verify provider/JWKS/DB TLS against runtime truststore.

---

# 227. Timezone/Encoding Test

Verify:

```text
UTC runtime
UTF-8
Khmer text
```

inside final runtime image.

---

# 228. Native Library Compatibility

If using:

```text
native SSL
image/PDF processing
compression/native libs
```

test against selected runtime base.

---

# 229. Multi-Architecture

Only claim support when both required architectures are tested.

Potential:

```text
amd64
arm64
```

---

# 230. Buildx

Can generate multi-platform manifests.

---

# 231. Multi-Arch Risk

Native dependencies may behave differently across CPU architectures.

---

# 232. Development Image

Optional `dev` target may include:

```text
JDK
debugger
source mount
hot reload
```

---

# 233. Production/Development Separation

Never promote the development image to production.

---

# 234. JDWP

Local debug only on trusted local interface.

---

# 235. Debug-Port Security

JDWP can allow arbitrary code execution.

Never expose publicly in production.

---

# 236. Docker Compose Debug Profile

May define local-only:

```text
JAVA_TOOL_OPTIONS=-agentlib:jdwp=...
```

---

# 237. Spring DevTools

Local only.

Do not include in production runtime dependency set.

---

# 238. Hot Reload

Developer convenience must not weaken production packaging guarantees.

---

# 239. Compose Project Name

Use project-specific naming to avoid cross-repository collisions.

---

# 240. Port Overrides

Allow local overrides:

```text
POSTGRES_PORT
REDIS_PORT
KAFKA_PORT
SERVICE_PORT
```

---

# 241. Compose Network Naming

Prefer project-scoped generated network.

Use global fixed network only for a documented shared-infra workflow.

---

# 242. Shared Local Infrastructure

Organization may optionally provide shared local:

```text
Kafka
Redis
observability
```

but workflow must be standardized.

---

# 243. Developer Commands

Target:

```text
make dev-up
make dev-down
make dev-reset
make dev-logs
```

or equivalent scripts.

---

# 244. Reset Must Be Explicitly Destructive

Example:

```text
make dev-reset
```

should clearly state volumes/data will be deleted.

---

# 245. Compose Status

Provide:

```bash
docker compose ps
```

or wrapper.

---

# 246. Dependency Readiness

Developer workflow should clearly indicate when:

```text
PostgreSQL
Kafka
Redis
```

are ready.

---

# 247. Local Persistence Policy

Default may preserve local data between restarts.

Reset removes named volumes.

---

# 248. Local Secret Policy

Only fake/local secrets:

```text
local-db-password
local-jwt-test-key
local-provider-secret
```

with zero production reuse.

---

# 249. Testcontainers vs Compose

Use:

```text
Testcontainers
```

for automated integration tests.

Use:

```text
Docker Compose
```

for developer manual environments.

---

# 250. Avoid Shared Compose in CI

CI should prefer isolated Testcontainers because shared Compose causes:

```text
cross-job state
port collision
flakiness
```

---

# 251. Production Security Baseline

```text
non-root
minimal runtime
no secrets
no unnecessary packages
read-only capable
scanned
immutable digest
signed/provenanced where required
```

---

# 252. CIS Guidance

Platform may adopt applicable CIS container/Docker guidance.

Kubernetes-specific hardening is handled later.

---

# 253. Image User Check

CI can verify:

```bash
docker inspect <image>
```

and reject root/empty user where policy requires explicit user.

---

# 254. Package Inventory

SBOM and image scanner expose unexpected tools/packages for review.

---

# 255. setuid/setgid

Minimal runtime should avoid unnecessary setuid/setgid binaries.

---

# 256. JAR Permissions

Application artifact must not be world-writable.

---

# 257. Secret Mount Path

Possible convention:

```text
/run/secrets/<name>
```

or platform-defined path.

---

# 258. Temp Directory

Standard:

```text
/tmp
```

with bounded ephemeral storage.

---

# 259. Temp Growth

Monitor if application writes temporary files.

Unbounded writes can fill node/container disk.

---

# 260. Multipart Limits

Configure limits to protect:

```text
memory
disk
network
```

---

# 261. Core Dumps

Disable unrestricted core dumps unless secure diagnostic policy exists.

---

# 262. Production Shell Access

Production image may have no shell.

Operations should rely on:

```text
logs
metrics
traces
ephemeral debug containers
```

---

# 263. kubectl exec bash Is Not a Requirement

Do not weaken image security just to support interactive shell debugging.

---

# 264. Ephemeral Debug Container

Later Kubernetes can attach a separate debug image if required.

---

# 265. Registry Naming

Recommended:

```text
registry/org/platform/<service>:<tag>
```

---

# 266. Rollback Image

Rollback uses a known previous digest.

Do not rebuild the old version during incident.

---

# 267. Rollback vs Rebuild

```text
rollback
= deploy previously trusted digest

rebuild
= create a new artifact
```

These are different actions.

---

# 268. Supply-Chain Trust

Production must know:

```text
who built the image
from what source
in what pipeline
using what base
```

---

# 269. CI Identity

Provenance identifies trusted CI builder.

---

# 270. Developer-Built Production Image

Never deploy a laptop-built image to production.

---

# 271. Registry Push Policy

Only CI/release automation can push protected release tags.

---

# 272. Branch Images

May use:

```text
branch-SHA
```

with short retention.

---

# 273. Release Images

Use:

```text
semver
commit SHA
digest
```

---

# 274. Ownership Labels

Optional labels:

```text
team
service
repository
```

help registry governance.

---

# 275. Image Manifest / Release Metadata

Record:

```text
image digest
SBOM
signature/provenance
scan report
commit
pipeline
```

---

# 276. Build Failure

Build must fail on:

```text
compile error
package error
missing artifact
invalid user setup
```

Never publish partial/broken image.

---

# 277. Scan Failure

If policy blocks:

```text
image is not promoted
```

---

# 278. Runtime Pull Policy

Later Kubernetes should use immutable digest/tag semantics.

Do not rely on mutable tag behavior.

---

# 279. Registry Availability

Registry resilience/caching must be part of deployment and DR planning.

---

# 280. Air-Gapped Future

May require mirrored:

```text
base images
dependencies
application images
```

---

# 281. Base Image Allowlist

CI may restrict Docker `FROM` to approved registries/images.

---

# 282. Dockerfile Linting

Use:

```text
Hadolint
```

or equivalent.

---

# 283. Dockerfile Lint Gate

Check for:

```text
latest tags
root user
shell misuse
package-manager issues
secret-like ARG/ENV
```

---

# 284. Build Policy as Code

CI can enforce:

```text
non-root
approved base
required labels
scan
SBOM
```

---

# 285. Container Smoke Test

After image build:

```text
docker run
wait readiness
call safe endpoint
docker stop
```

---

# 286. Standard Container Contract

Every service image supports:

```text
standard/default port
health endpoints
SIGTERM
stdout/stderr
runtime configuration
non-root execution
```

---

# 287. Runtime Contract

Minimum:

```text
ENTRYPOINT starts service
port configurable/defaulted
config from env/files
health endpoints
fatal config → non-zero exit
```

---

# 288. Dockerfile Template

Platform provides one maintained Spring Boot starter template.

---

# 289. Template Customization

Service-specific exceptions allowed for:

```text
native library
custom CA
special JVM flag
extra filesystem path
```

only with documentation.

---

# 290. Avoid Dockerfile Drift

Do not allow every service to independently invent:

```text
base image
UID
health semantics
JVM flags
tagging
```

---

# 291. Container Version Matrix

Track approved:

```text
Java base
Spring Boot
builder technology
scanner
SBOM tool
```

---

# 292. Base Image Lifecycle

Remove deprecated/unsupported JREs.

---

# 293. JRE Patch Cadence

Rebuild regularly even without emergency CVE.

---

# 294. Critical CVE Response

```text
identify affected digests
update trusted base
rebuild
scan
test
promote
```

---

# 295. Image Inventory

Platform must know which services are currently running a vulnerable base/digest.

---

# 296. Container Observability

Operators should identify:

```text
image digest
commit
startup time
restart count
memory
CPU
exit reason
```

---

# 297. Startup Duration Metric

Track Spring Boot startup time.

Large regressions may affect:

```text
rollout
autoscaling
recovery
startup probe
```

---

# 298. Image Pull Time

Measure cold pull time for large images.

---

# 299. Memory Baseline

Record:

```text
idle RSS
steady RSS
peak RSS
heap
native memory
```

---

# 300. CPU Baseline

Record:

```text
startup CPU
idle CPU
steady request CPU
```

---

# 301. Exit Reason Classification

Operations should distinguish:

```text
normal stop
configuration failure
OOMKill
SIGKILL
uncaught fatal error
health/restart
```

---

# 302. Restart Count

Repeated restarts require alerting/diagnosis.

---

# 303. Container Failure Modes

Common:

```text
image pull failure
wrong architecture
missing CA
permission failure
OOMKill
bad environment config
slow startup
SIGTERM not handled
read-only filesystem failure
```

---

# 304. Image Pull Failure Runbook

Check:

```text
registry authentication
tag/digest existence
network/DNS
registry availability
imagePullSecret
```

---

# 305. Permission Failure Runbook

Check:

```text
runtime UID/GID
file ownership
volume permissions
read-only filesystem
tmp directory
```

Do not switch to root as first fix.

---

# 306. OOM Runbook

Check:

```text
container limit
heap
native memory
thread count
direct memory
traffic/load
```

---

# 307. Slow Startup Runbook

Check:

```text
JVM
migration duration
dependency connection
class scanning
CPU throttling
```

---

# 308. Certificate Runbook

Check:

```text
truststore
CA chain
hostname
expiration
system clock
```

Never disable TLS verification.

---

# 309. Wrong Configuration Runbook

Check:

```text
environment
ConfigMap/Secret
Spring profile
variable precedence
```

---

# 310. Secret Leak Incident

If a secret appears in image layer:

```text
revoke/rotate secret
stop promotion
remove/purge affected image where possible
rebuild
scan registry/cache history
```

Deleting a tag alone is not enough.

---

# 311. Compromised Base Image

Actions:

```text
identify dependent images
stop promotion
move to trusted base
rebuild
scan
redeploy
investigate exposure
```

---

# 312. Entrypoint Script

Avoid shell script unless required.

---

# 313. If Entrypoint Script Is Required

Use minimal:

```bash
set -euo pipefail
exec java ...
```

---

# 314. Runtime JVM Argument Injection

Use:

```text
JAVA_TOOL_OPTIONS
application args
```

not image rebuild.

---

# 315. Spring Profile Guard

Prevent accidental:

```text
dev
```

profile in production.

---

# 316. Production Debug Features

Disable/restrict:

```text
Spring DevTools
debug endpoints
H2 console
write-enabled Swagger/test utilities
JDWP
```

---

# 317. OpenAPI UI

If included in production environment:

```text
internal/authenticated
```

according to policy.

---

# 318. Container User Home

Some libraries expect writable `$HOME`.

If needed provide a safe non-root home path.

---

# 319. Truststore / Keystore

Trusted public certificates may be mounted/built according to security policy.

Private keys remain runtime secrets.

---

# 320. JVM Entropy

Use modern JVM/Linux behavior.

Avoid outdated entropy flags unless measured.

---

# 321. DNS Cache

Do not hardcode infinite JVM DNS cache.

Use modern defaults/platform guidance.

---

# 322. Connection Resilience

HTTP/gRPC/Kafka/Redis clients must handle endpoint changes and connection reset safely.

---

# 323. Connection Reuse

Reuse connections during container life.

Graceful shutdown closes them.

---

# 324. Reproducibility Test

CI may build twice from same commit and compare:

```text
dependency inventory
SBOM
labels
artifact checksum
```

even if timestamp makes final digest differ.

---

# 325. Build Timestamp

Avoid unnecessary nondeterministic timestamps.

If build time is included, make it explicit metadata.

---

# 326. Artifact Checksum

Record:

```text
JAR SHA256
image digest
```

---

# 327. Promotion Record

Release metadata connects:

```text
commit
JAR checksum
image digest
SBOM
scan result
signature/provenance
```

---

# 328. OpenTelemetry Agent

Possible approaches:

```text
baked into image
runtime injection
SDK instrumentation
```

Final standard belongs to Observability phase.

---

# 329. Agent Versioning

If baked in, OpenTelemetry agent becomes part of:

```text
SBOM
CVE lifecycle
image rebuild policy
```

---

# 330. Mutable Runtime Injection

Avoid arbitrary runtime library injection that destroys reproducibility.

---

# 331. Init Containers

Kubernetes-specific actions such as:

```text
certificate preparation
migration
configuration generation
```

may be implemented later without bloating application image.

---

# 332. Sidecars

Logging/mesh/proxy sidecars are deployment concerns.

Do not bake into application image.

---

# 333. VM Assumptions

Containerized service must not depend on:

```text
systemd
cron daemon
host filesystem layout
fixed hostname
```

---

# 334. Hostname

Container hostname is ephemeral.

Never use it as business identity.

---

# 335. Instance Identity

Operational only:

```text
pod name
service name
trace metadata
```

---

# 336. Filesystem Case Sensitivity

Linux container filesystem is case-sensitive.

Windows/macOS developers must test path assumptions.

---

# 337. Windows Development

Docker Desktop/WSL may mount files differently.

A fast local workflow may run Java on host while containerizing dependencies.

Phase 23 defines this in detail.

---

# 338. Line Endings

Scripts inside Linux image need:

```text
LF
```

not broken CRLF behavior.

---

# 339. Executable Bit

Git should preserve executable permission for:

```text
gradlew
mvnw
entrypoint script if used
```

---

# 340. Container Definition of Done

Every production service image:

- [ ] Multi-stage build.
- [ ] Approved base image.
- [ ] Java version pinned.
- [ ] Non-root runtime.
- [ ] `.dockerignore`.
- [ ] No secrets.
- [ ] Minimal runtime image.
- [ ] Exec-form entrypoint.
- [ ] Graceful shutdown.
- [ ] Health endpoints.
- [ ] Runtime configuration externalized.
- [ ] OCI labels.
- [ ] Vulnerability scan.
- [ ] SBOM.
- [ ] Container smoke test.

---

# 341. Docker Compose Definition of Done

- [ ] PostgreSQL matches production major.
- [ ] Kafka version compatible.
- [ ] Redis matches production major.
- [ ] Health checks.
- [ ] Named volumes where useful.
- [ ] Safe local credentials.
- [ ] Optional profiles.
- [ ] Reset command.
- [ ] No production secrets.
- [ ] Mock providers where needed.

---

# 342. Release Image Definition of Done

- [ ] Built by trusted CI.
- [ ] Commit recorded.
- [ ] Immutable tag.
- [ ] Digest recorded.
- [ ] Vulnerability scan passed.
- [ ] SBOM attached.
- [ ] Provenance/signature where enabled.
- [ ] Container tests passed.
- [ ] Same digest promoted to UAT/PROD.

---

# 343. Dockerfile Build Review

- [ ] Multi-stage.
- [ ] Dependency caching.
- [ ] BuildKit-compatible.
- [ ] No secret ARG/ENV.
- [ ] Clean build context.

---

# 344. Dockerfile Runtime Review

- [ ] Minimal JRE.
- [ ] Non-root.
- [ ] Correct ownership.
- [ ] Exec-form ENTRYPOINT.
- [ ] No build tools.
- [ ] Read-only-root capable.

---

# 345. Runtime Review

- [ ] UTC.
- [ ] UTF-8.
- [ ] Required CA certificates.
- [ ] Temp path defined.
- [ ] JVM memory headroom.
- [ ] SIGTERM.
- [ ] Health endpoints.
- [ ] stdout/stderr logging.
- [ ] Config externalized.
- [ ] Secret mounts supported.

---

# 346. Security Review

- [ ] Approved base registry.
- [ ] Version/digest pinning.
- [ ] Non-root.
- [ ] Privileged disabled.
- [ ] Dangerous host mounts absent.
- [ ] Secrets absent.
- [ ] Image scan.
- [ ] SBOM.
- [ ] Signature/provenance policy.
- [ ] Debug port disabled.

---

# 347. Supply-Chain Review

- [ ] Trusted CI builder.
- [ ] Dependency lock.
- [ ] Base image traceability.
- [ ] OCI metadata.
- [ ] Image digest.
- [ ] Registry immutability.
- [ ] Continuous CVE monitoring.
- [ ] Rebuild policy.

---

# 348. Operations Review

- [ ] Startup time measured.
- [ ] Memory baseline.
- [ ] CPU baseline.
- [ ] Graceful stop tested.
- [ ] OOM behavior known.
- [ ] Image pull measured.
- [ ] Health semantics correct.
- [ ] Runbooks available.

---

# 349. Local Development Review

- [ ] Compose dependencies.
- [ ] Port overrides.
- [ ] Safe defaults.
- [ ] Seed separate from migration.
- [ ] Profiles.
- [ ] Reset.
- [ ] Mock providers.
- [ ] Testcontainers remain CI/integration standard.

---

# 350. Production Readiness Checklist

Before production:

- [ ] Production Dockerfile reviewed.
- [ ] Same image works in DEV/UAT/PROD.
- [ ] Non-root verified.
- [ ] Read-only filesystem test passed.
- [ ] Graceful shutdown test passed.
- [ ] Resource-limit test passed.
- [ ] TLS/CA test passed.
- [ ] Secret-absence test passed.
- [ ] No unapproved critical vulnerability.
- [ ] SBOM generated.
- [ ] Digest recorded.
- [ ] Signature/provenance configured where required.
- [ ] Registry retention/immutability configured.
- [ ] Rollback digest retained.
- [ ] Cold image pull/start tested.
- [ ] Runbooks available.

---

# 351. Source-Recommended Implementation Order

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

# 352. Platform Implementation Order

Expanded:

```text
1. Approve Java LTS builder/runtime families
2. Approve exact base versions/digests
3. Create central Spring Boot Dockerfile template
4. Create standard .dockerignore
5. Add one image per service
6. Configure BuildKit
7. Add Gradle/Maven cache mounts
8. Add dependency locking
9. Add stable runtime UID/GID
10. Fix runtime file ownership
11. Remove unnecessary runtime tools
12. Standardize unprivileged port
13. Externalize all config
14. Define secret mount conventions
15. Configure UTF-8/UTC
16. Validate CA/truststore behavior
17. Configure exec-form ENTRYPOINT
18. Configure Spring graceful shutdown
19. Configure liveness/readiness
20. Standardize stdout/stderr logging
21. Standardize build metadata/OCI labels
22. Define semver/SHA/digest tagging
23. Configure immutable registry repos
24. Add clean-checkout CI image build
25. Add Dockerfile lint
26. Add secret scan
27. Add container startup smoke
28. Add non-root verification
29. Add read-only-root test
30. Add SIGTERM test
31. Add resource-limit/OOM tests
32. Add runtime network/TLS tests
33. Add image vulnerability scan
34. Generate SBOM
35. Record provenance
36. Add image signing if required
37. Add continuous CVE monitoring
38. Add base-image rebuild automation
39. Create Compose base dependencies
40. Add PostgreSQL/Kafka/Redis health checks
41. Add Compose profiles
42. Add fake local credentials
43. Add mock providers
44. Add dev up/down/reset/log commands
45. Measure image size/startup/pull
46. Measure JVM memory/CPU baseline
47. Document runbooks
48. Complete container release artifact set
49. Complete production readiness review
50. Handoff Phase 23 Local Development
```

---

# 353. Minimum Viable Docker Standard

Every service must:

```text
build from clean source
use multi-stage Dockerfile
use approved pinned Java runtime
run non-root
externalize config and secrets
log to stdout/stderr
handle SIGTERM
expose health endpoints
avoid authoritative local business data
produce immutable release image
pass vulnerability scan
```

---

# 354. Docker Governance

Architecture/platform review rejects:

```text
latest production tag
root runtime without approved reason
secret copied into image
environment-specific rebuilds
developer-laptop production image
JDK/build tools in runtime without need
Docker socket host mount
mutable local file as business truth
```

---

# 355. Standard Image Contract

```text
Runtime User:
non-root

Port:
service-defined standard default

Configuration:
environment variables / mounted files

Secrets:
runtime injection

Logs:
stdout/stderr

Health:
Actuator liveness/readiness

Shutdown:
SIGTERM graceful

Filesystem:
read-only-root capable

Metadata:
version + commit + digest
```

---

# 356. Release Artifact Set

Each service release produces:

```text
application JAR
container image
image digest
SBOM
vulnerability scan report
test report
provenance/signature metadata
```

---

# 357. Rollback Artifact Set

Retain:

```text
previous production image digest
matching deployment configuration
DB compatibility knowledge
```

---

# 358. Image Security Invariant

The production image must remain safe if:

```text
inspected
copied
pulled by an authorized operator
```

because it contains no runtime secrets.

---

# 359. Runtime Configuration Invariant

The exact same image digest can start under:

```text
DEV
UAT
PROD
```

with different runtime configuration.

---

# 360. Storage Invariant

Replacing a container cannot lose authoritative business state.

---

# 361. Shutdown Invariant

SIGTERM cannot cause unsafe:

```text
Kafka offset commit
partial Saga ownership
lost in-flight write
abandoned unrecoverable state
```

---

# 362. Resource Invariant

JVM must fit within container memory including native overhead.

---

# 363. Supply-Chain Invariant

For each production digest the organization can identify:

```text
source commit
builder
base image
dependency set
scan
SBOM
provenance
```

---

# 364. Container Quality Gates

Required CI pipeline gates:

```text
Dockerfile lint
clean build
startup smoke
non-root verification
read-only-root test
secret scan
vulnerability scan
SBOM generation
```

---

# 365. Optional Advanced Gates

Where adopted:

```text
signature verification
provenance validation
reproducibility comparison
multi-architecture tests
policy-as-code
```

---

# 366. Recommended ADRs

```text
ADR-DKR-001 One service one image
ADR-DKR-002 One primary process
ADR-DKR-003 Multi-stage Dockerfile
ADR-DKR-004 Approved Java base family
ADR-DKR-005 Java LTS version
ADR-DKR-006 Runtime JRE vs JDK
ADR-DKR-007 Distroless adoption policy
ADR-DKR-008 Alpine policy
ADR-DKR-009 BuildKit standard
ADR-DKR-010 Build secret handling
ADR-DKR-011 Build once/promote same digest
ADR-DKR-012 Tagging/version/digest policy
ADR-DKR-013 OCI metadata
ADR-DKR-014 Dependency/base pinning
ADR-DKR-015 .dockerignore standard
ADR-DKR-016 Spring layered JAR
ADR-DKR-017 Image-size budget
ADR-DKR-018 Non-root UID/GID
ADR-DKR-019 Read-only-root design
ADR-DKR-020 Runtime temp directory
ADR-DKR-021 Linux capabilities
ADR-DKR-022 JVM memory policy
ADR-DKR-023 OOM behavior
ADR-DKR-024 UTC/UTF-8
ADR-DKR-025 CA/truststore
ADR-DKR-026 Exec ENTRYPOINT
ADR-DKR-027 Graceful SIGTERM
ADR-DKR-028 Health endpoint semantics
ADR-DKR-029 Runtime secret injection
ADR-DKR-030 Compose purpose/profiles
ADR-DKR-031 CI container builder
ADR-DKR-032 Registry/repository structure
ADR-DKR-033 Vulnerability scan gate
ADR-DKR-034 SBOM format/storage
ADR-DKR-035 Signing/provenance
ADR-DKR-036 Continuous CVE/rebuild policy
ADR-DKR-037 Flyway startup strategy
ADR-DKR-038 Container test standard
ADR-DKR-039 Multi-architecture policy
ADR-DKR-040 Development image policy
ADR-DKR-041 Rollback image retention
ADR-DKR-042 Dockerfile policy-as-code
```

---

# 367. Phase 22 Policy Freeze Checklist

Before production resolve:

- [ ] Java LTS version.
- [ ] Builder base image family.
- [ ] Runtime base image family.
- [ ] Base pinning level.
- [ ] Distroless adoption timing.
- [ ] Runtime UID/GID.
- [ ] Default application port.
- [ ] Standard Dockerfile template.
- [ ] BuildKit version/features.
- [ ] Gradle/Maven cache approach.
- [ ] Build secret mechanism.
- [ ] Artifact/JAR traceability.
- [ ] Image tag format.
- [ ] Registry path format.
- [ ] Release-tag immutability.
- [ ] Digest deployment standard.
- [ ] OCI labels.
- [ ] Dependency locking policy.
- [ ] Image-size review threshold.
- [ ] Spring layered JAR decision.
- [ ] Read-only-root policy.
- [ ] Writable temp path.
- [ ] Multipart temp behavior.
- [ ] Linux capabilities.
- [ ] JVM MaxRAMPercentage policy.
- [ ] OOM/heap-dump policy.
- [ ] GC defaults.
- [ ] UTC/locale/UTF-8.
- [ ] Enterprise CA injection.
- [ ] Graceful shutdown timeout.
- [ ] Kafka consumer shutdown behavior.
- [ ] Actuator exposure.
- [ ] Liveness/readiness semantics.
- [ ] Logging format.
- [ ] Secret file path convention.
- [ ] Secret rotation/restart expectations.
- [ ] Required config startup validation.
- [ ] Compose dependency versions.
- [ ] Compose profile names.
- [ ] Local credential policy.
- [ ] Local persistence/reset policy.
- [ ] CI builder technology.
- [ ] Registry platform.
- [ ] Vulnerability scanner.
- [ ] Scan severity gate.
- [ ] SBOM format.
- [ ] Signing/provenance approach.
- [ ] Continuous CVE monitoring.
- [ ] Flyway production execution approach.
- [ ] Resource baseline procedure.
- [ ] Container test matrix.
- [ ] Multi-arch requirement.
- [ ] Rollback retention period.
- [ ] Base-image update automation.
- [ ] Container runbook owners.

---

# 368. Work Breakdown

Suggested implementation tickets:

```text
DKR-001 Approve Java LTS
DKR-002 Approve JDK builder image
DKR-003 Approve JRE runtime image
DKR-004 Pin base image version
DKR-005 Add digest pinning for release build
DKR-006 Create shared Dockerfile template
DKR-007 Add Dockerfile to api-gateway
DKR-008 Add Dockerfile to identity-service
DKR-009 Add Dockerfile to customer-service
DKR-010 Add Dockerfile to catalog-service
DKR-011 Add Dockerfile to inventory-service
DKR-012 Add Dockerfile to cart-service
DKR-013 Add Dockerfile to ordering-service
DKR-014 Add Dockerfile to payment-service
DKR-015 Add Dockerfile to wallet-service
DKR-016 Add Dockerfile to loyalty-service
DKR-017 Add Dockerfile to promotion-service
DKR-018 Add Dockerfile to mission-service
DKR-019 Add Dockerfile to notification-service
DKR-020 Add Dockerfile to integration-service
DKR-021 Create shared .dockerignore template
DKR-022 Add .dockerignore to each service
DKR-023 Configure multi-stage builds
DKR-024 Configure Gradle cache mounts
DKR-025 Configure Maven cache mounts if applicable
DKR-026 Enable BuildKit syntax/version
DKR-027 Define private dependency build-secret mechanism
DKR-028 Remove secret ARG patterns
DKR-029 Add dependency locking
DKR-030 Record JAR checksum
DKR-031 Define runtime UID/GID
DKR-032 Create runtime user where required
DKR-033 Configure file ownership
DKR-034 Verify non-root startup
DKR-035 Standardize service port
DKR-036 Configure EXPOSE metadata
DKR-037 Remove unnecessary runtime tools
DKR-038 Add read-only-root support
DKR-039 Define /tmp ephemeral behavior
DKR-040 Configure multipart temp path
DKR-041 Configure upload durable storage flow
DKR-042 Verify no Linux capabilities required
DKR-043 Prohibit privileged runtime
DKR-044 Prohibit Docker socket mounts
DKR-045 Define JVM memory defaults
DKR-046 Add ExitOnOutOfMemoryError if approved
DKR-047 Define heap-dump policy
DKR-048 Record startup memory peak
DKR-049 Record idle/steady/peak memory
DKR-050 Record startup/steady CPU
DKR-051 Validate thread-stack usage
DKR-052 Validate Netty direct memory where applicable
DKR-053 Set UTC runtime convention
DKR-054 Validate UTF-8
DKR-055 Test Khmer text
DKR-056 Ensure CA bundle
DKR-057 Add enterprise CA mechanism if needed
DKR-058 Validate PostgreSQL TLS
DKR-059 Validate Kafka TLS
DKR-060 Validate provider HTTPS/JWKS
DKR-061 Configure exec-form ENTRYPOINT
DKR-062 Configure Spring graceful shutdown
DKR-063 Configure shutdown timeout
DKR-064 Test Kafka consumer SIGTERM
DKR-065 Test background worker shutdown
DKR-066 Test Saga worker restart recovery
DKR-067 Add Actuator liveness
DKR-068 Add Actuator readiness
DKR-069 Define startup semantics
DKR-070 Restrict Actuator exposure
DKR-071 Configure stdout/stderr logging
DKR-072 Configure structured logs
DKR-073 Add build metadata to /actuator/info
DKR-074 Externalize DB config
DKR-075 Externalize Kafka config
DKR-076 Externalize Redis config
DKR-077 Externalize identity/security config
DKR-078 Externalize provider integration config
DKR-079 Define secret mount convention
DKR-080 Remove private keys from image
DKR-081 Validate secret-file permissions
DKR-082 Add configuration startup validation
DKR-083 Prevent localhost production defaults
DKR-084 Prevent dev profile in production
DKR-085 Define environment variable naming
DKR-086 Add OCI source label
DKR-087 Add OCI revision label
DKR-088 Add OCI version label
DKR-089 Add OCI created label
DKR-090 Define semantic version image tag
DKR-091 Define commit-SHA image tag
DKR-092 Record image digest
DKR-093 Disable latest production deployment
DKR-094 Configure protected immutable release tags
DKR-095 Define registry repository per service
DKR-096 Configure registry retention
DKR-097 Preserve rollback digest
DKR-098 Build only from trusted CI
DKR-099 Restrict release push permission
DKR-100 Select CI container builder
DKR-101 Remove unsafe privileged DinD if possible
DKR-102 Isolate build runner
DKR-103 Add base-image allowlist
DKR-104 Add Hadolint
DKR-105 Add Dockerfile policy gate
DKR-106 Add image clean-build test
DKR-107 Add container startup test
DKR-108 Add non-root image test
DKR-109 Add read-only-root test
DKR-110 Add secret marker absence test
DKR-111 Add build-tool absence test
DKR-112 Add graceful shutdown container test
DKR-113 Add crash restart test
DKR-114 Add same-image multi-config test
DKR-115 Add wrong-config fail-fast test
DKR-116 Add CPU limit test
DKR-117 Add memory limit test
DKR-118 Add low-memory behavior test
DKR-119 Add network/DNS test
DKR-120 Add runtime TLS truststore test
DKR-121 Add native library compatibility test
DKR-122 Select image vulnerability scanner
DKR-123 Add image scan pipeline
DKR-124 Define vulnerability exception workflow
DKR-125 Generate SBOM
DKR-126 Store SBOM in release artifacts
DKR-127 Attach SBOM to registry if supported
DKR-128 Add image provenance
DKR-129 Add image signing if approved
DKR-130 Add signature verification pre-production
DKR-131 Configure continuous CVE monitoring
DKR-132 Add JRE/base patch rebuild schedule
DKR-133 Add critical-CVE rebuild workflow
DKR-134 Track base-image inventory
DKR-135 Create base docker-compose.yml
DKR-136 Add PostgreSQL service
DKR-137 Add Redis service
DKR-138 Add Kafka service
DKR-139 Add Schema Registry if required
DKR-140 Add dependency health checks
DKR-141 Add Compose named volumes
DKR-142 Add .env.example
DKR-143 Add safe local credentials
DKR-144 Add Compose profiles
DKR-145 Add mock provider service
DKR-146 Add service-specific local profile
DKR-147 Add port override variables
DKR-148 Add Compose project naming
DKR-149 Add dev-up command
DKR-150 Add dev-down command
DKR-151 Add dev-reset command
DKR-152 Add dev-logs command
DKR-153 Add dev-status command
DKR-154 Document readiness checks
DKR-155 Keep Flyway separate from seed data
DKR-156 Add local seed workflow
DKR-157 Document Testcontainers vs Compose boundary
DKR-158 Add optional dev image target
DKR-159 Add local JDWP profile
DKR-160 Ensure DevTools absent from prod
DKR-161 Add Windows/WSL line-ending checks
DKR-162 Preserve executable bits
DKR-163 Validate Linux case-sensitive paths
DKR-164 Add image-size tracking
DKR-165 Add startup-time tracking
DKR-166 Add cold-pull timing
DKR-167 Add memory/CPU baseline artifact
DKR-168 Add exit-reason observability
DKR-169 Write image-pull failure runbook
DKR-170 Write permission failure runbook
DKR-171 Write OOM runbook
DKR-172 Write slow-start runbook
DKR-173 Write certificate runbook
DKR-174 Write wrong-config runbook
DKR-175 Write leaked-secret runbook
DKR-176 Write compromised-base runbook
DKR-177 Define release artifact manifest
DKR-178 Define rollback artifact manifest
DKR-179 Add Dockerfile review checklist
DKR-180 Add runtime review checklist
DKR-181 Add security review checklist
DKR-182 Add supply-chain review checklist
DKR-183 Add operations review checklist
DKR-184 Add local development review checklist
DKR-185 Complete production-readiness checklist
DKR-186 Complete Docker ADRs
DKR-187 Complete Phase 22 policy freeze
DKR-188 Phase 22 exit review
```

---

# 369. Acceptance — Build

Given a clean checkout:

```text
Dockerfile builds successfully
```

without hidden developer machine artifacts.

---

# 370. Acceptance — Multi-Stage

Runtime image contains no unnecessary:

```text
JDK compiler
Gradle/Maven
source code
test fixtures
```

---

# 371. Acceptance — Non-Root

Runtime UID is:

```text
!= 0
```

and application functions normally.

---

# 372. Acceptance — Read-Only Filesystem

Container starts with:

```text
read-only root
+
approved writable temp mount
```

and service remains functional.

---

# 373. Acceptance — Configuration

The same image digest runs successfully with:

```text
DEV-like
UAT-like
PROD-like
```

runtime configurations.

---

# 374. Acceptance — Secret Absence

Known fake secret markers used during build are absent from:

```text
image filesystem
image history
SBOM where inappropriate
```

---

# 375. Acceptance — Registry Identity

Running production workload can be mapped to:

```text
commit
release version
digest
build pipeline
SBOM
scan report
```

---

# 376. Acceptance — latest

Production deployments do not depend on mutable:

```text
latest
```

---

# 377. Acceptance — SIGTERM

`docker stop` causes:

```text
new traffic stops
in-flight work handled safely
Kafka consumer closes correctly
clients close
process exits in grace period
```

---

# 378. Acceptance — Kafka Shutdown

No offset is committed for business processing that did not complete.

---

# 379. Acceptance — Restart

Abrupt kill/restart does not lose authoritative state.

Recovery uses durable DB/Kafka/Saga/idempotency mechanisms.

---

# 380. Acceptance — Memory

Service runs under approved memory limit with:

```text
heap
metaspace
threads
direct buffers
native memory
```

headroom.

---

# 381. Acceptance — OOM

Failure mode under insufficient memory is known and does not silently corrupt business state.

---

# 382. Acceptance — CPU

Service remains within expected latency/recovery behavior under approved CPU quota.

---

# 383. Acceptance — Timezone/Encoding

Inside production image:

```text
UTC behavior deterministic
UTF-8 works
Khmer text is preserved
```

---

# 384. Acceptance — TLS

Runtime image trusts required CA chain for:

```text
DB
Kafka
OIDC/JWKS
providers
```

without disabling verification.

---

# 385. Acceptance — Health

Liveness does not fail simply because a downstream provider is temporarily unavailable.

---

# 386. Acceptance — Readiness

Readiness becomes healthy only when the service can safely accept traffic.

---

# 387. Acceptance — Logging

Application logs appear on stdout/stderr and no local file is required as the authoritative log.

---

# 388. Acceptance — Compose

Developers can start compatible:

```text
PostgreSQL
Kafka
Redis
```

using non-production credentials.

---

# 389. Acceptance — Compose Reset

Developer can intentionally reset all local volumes through one documented command.

---

# 390. Acceptance — Testcontainers Boundary

Automated integration tests do not depend on shared mutable Docker Compose infrastructure.

---

# 391. Acceptance — Scan

Every release image receives vulnerability scanning before promotion.

---

# 392. Acceptance — SBOM

Every release image has an SBOM tied to its digest.

---

# 393. Acceptance — Provenance

Release record identifies trusted CI as builder.

---

# 394. Acceptance — Rollback

Previous production image can be redeployed by known digest without rebuilding.

---

# 395. Acceptance — Base CVE

Platform can identify all services affected by a vulnerable base digest.

---

# 396. Acceptance — Container Runbooks

Operators can diagnose:

```text
image pull
permission
OOM
startup
certificate
wrong configuration
secret leak
base compromise
```

without ad-hoc root access.

---

# 397. Phase 22 Completion Tree

```text
PHASE 22 — DOCKER

├── Container Principles                      ✅
├── One Service / One Image                   ✅
├── One Primary Process                       ✅
├── Immutable Runtime                         ✅
├── Ephemeral Filesystem                      ✅
├── Multi-Stage Build                         ✅
├── Builder / Runtime Separation              ✅
├── Java LTS / JRE                            ✅
├── Base Image Strategy                       ✅
├── Alpine / Distroless Tradeoffs             ✅
├── Dockerfile Template                       ✅
├── Build/Test Placement                      ✅
├── BuildKit                                  ✅
├── Dependency Caching                        ✅
├── Build Secrets                             ✅
├── External Runtime Configuration            ✅
├── Build Once / Promote Digest               ✅
├── Image Tags / Digests                      ✅
├── OCI Labels                                ✅
├── Reproducibility                           ✅
├── Dependency / Base Pinning                 ✅
├── .dockerignore                             ✅
├── Layering                                  ✅
├── Spring Boot Layered JAR                   ✅
├── Image Size                                ✅
├── Non-Root Runtime                          ✅
├── File Ownership                            ✅
├── Read-Only Root                            ✅
├── Linux Capabilities                        ✅
├── JVM Container Awareness                   ✅
├── Heap / Native Memory                      ✅
├── OOM Behavior                              ✅
├── CPU Awareness                             ✅
├── UTC / UTF-8                               ✅
├── CA / Truststore                           ✅
├── Exec ENTRYPOINT                           ✅
├── SIGTERM / Graceful Shutdown               ✅
├── Kafka / Worker Shutdown                   ✅
├── Liveness / Readiness                      ✅
├── stdout/stderr Logging                     ✅
├── Secret Injection                          ✅
├── Config Validation                         ✅
├── Compose Dependencies                      ✅
├── Compose Profiles                          ✅
├── Local PostgreSQL / Kafka / Redis          ✅
├── Seed / Reset                              ✅
├── Mock Providers                            ✅
├── CI Image Build                            ✅
├── Registry                                  ✅
├── Immutable Releases                        ✅
├── Vulnerability Scanning                    ✅
├── SBOM                                      ✅
├── Signing / Provenance                      ✅
├── Continuous CVE Monitoring                 ✅
├── Startup / Migration                       ✅
├── Restart Safety                            ✅
├── Resource Baselines                        ✅
├── Container-Level Tests                     ✅
├── Multi-Architecture                        ✅
├── Development Image / Debugging             ✅
├── Registry Retention / Rollback             ✅
├── Dockerfile Lint / Policy                  ✅
├── Container Failure Runbooks                ✅
├── Definition of Done                        ✅
├── Production Readiness                      ✅
├── Docker Governance                         ✅
└── Local Development Handoff                 ✅
```

---

# 398. Handoff to Phase 23

The next official implementation phase is:

```text
PHASE 23 — Local Development
```

---

# 399. Docker → Local Development Boundary

Phase 22 defines:

```text
how a service is packaged
```

Phase 23 defines:

```text
how developers run and work with those services efficiently every day
```

---

# 400. Phase 23 Inputs

Phase 23 will consume:

```text
Dockerfiles
Docker Compose dependency stack
Compose profiles
service ports
local environment variables
seed/reset behavior
mock providers
debug image/profile
Testcontainers boundary
```

---

# 401. Final Phase 22 Principle

Build model:

```text
Source
  ↓
Approved JDK Builder
  ↓
Verified Artifact
  ↓
Minimal JRE Runtime
  ↓
Non-Root
  ↓
Container Tests
  ↓
Scan + SBOM + Provenance
  ↓
Immutable Registry Digest
```

Runtime model:

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

The most important implementation rules are:

```text
Build once and promote the same image digest.
Use one image per deployable service.
Run one primary application process per container.
Use multi-stage builds.
Keep build tooling out of production runtime.
Use one organization-approved Java LTS standard.
Use approved pinned base images.
Do not choose Alpine only for size.
Adopt distroless only when operational requirements are understood.
Do not bake secrets into image layers.
Use BuildKit secret mounts for build-time private dependencies.
Keep Docker build context small and use .dockerignore.
Run production as non-root.
Use a stable UID/GID.
Never solve permission errors with chmod 777.
Design for read-only root filesystem.
Treat local container filesystem as ephemeral.
Do not store authoritative business state on container disk.
Use durable external stores for data.
Do not give application containers privileged mode or Docker socket access.
Java heap must leave native-memory headroom.
Measure heap, metaspace, direct memory, threads, and native libraries.
Use measured CPU/memory defaults rather than copied JVM flags.
Use UTC and UTF-8 deterministically.
Ensure Khmer text works inside runtime image.
Never disable TLS verification to solve CA problems.
Use exec-form ENTRYPOINT.
Java must receive SIGTERM directly.
Gracefully stop HTTP, Kafka consumers, workers, and clients.
Do not commit Kafka offsets before successful processing.
Liveness means the process is alive, not that every downstream system is healthy.
Readiness means the instance can safely receive traffic.
Log to stdout/stderr.
Do not bundle log shippers inside application image.
Inject runtime secrets through environment/files/secret manager.
Private signing/provider keys are never copied into images.
Required configuration fails fast.
Do not silently fall back to development credentials or localhost in production.
Docker Compose is for local development, not production.
Compose dependency versions should match production major versions.
Flyway schema migration stays authoritative; seed data is separate.
Use Testcontainers for isolated automated integration tests.
CI builds release images from clean checkout.
Production images are built by trusted CI, never developer laptops.
Protected release tags are immutable.
Production deployment identity is the image digest.
Generate SBOM for every release image.
Scan every image before promotion and continuously after release.
Support image signing/provenance for production.
Rebuild images when base/JRE vulnerabilities are fixed, even with no app-code change.
Container restarts must be safe because business state is durable.
Test the actual image, not only the JAR.
Test non-root execution.
Test read-only root filesystem.
Test graceful shutdown.
Test resource limits.
Test runtime TLS/CA behavior.
Keep previous trusted digests ready for rollback.
Rollback means deploy the old digest; rebuilding is not rollback.
Maintain operational runbooks for container-specific failures.
```

---

**End of PHASE 22 — Docker**
