---
title: "PART 32 — CI/CD"
---

# PART 32 — CI/CD

> **Document Role:** Defines the complete continuous integration and continuous delivery architecture for the microservices platform, including GitLab CI pipeline design, source-control gates, automated testing, security scanning, container build and provenance, artifact promotion, release metadata, database migration orchestration, deployment verification, rollback controls, approvals, auditability, and delivery governance.  
> **Previous Part:** PART 31 — Observability  
> **Next Part:** PART 33 — GitOps / Argo CD  
> **Status:** Platform Architecture / Delivery Engineering Specification  
> **Primary Stack:** GitLab CI/CD, Java, Spring Boot, Gradle/Maven, JUnit 5, Testcontainers, Docker/BuildKit, GitLab Container Registry or approved OCI registry, Flyway, Kubernetes, approved SAST/SCA/container scanners, SBOM tooling, Cosign or approved signing mechanism, OpenTelemetry  
> **Audience:** Backend engineers, QA engineers, platform engineers, DevOps engineers, SREs, security engineers, software architects, technical leads, release managers.

---

# 8588 — Purpose

CI/CD defines how a source change becomes a trusted release candidate and how that candidate is promoted safely toward production.

It answers:

```text
What starts a pipeline?
Which checks must pass before merge?
Which checks must pass before release?
How are builds made reproducible?
How are unit, integration, contract, migration, and security tests organized?
How is one immutable image built and identified?
How are SBOM, signature, provenance, and scan evidence attached?
How does an image move through DEV, QA, UAT, STAGING, and PROD without rebuild?
How are database migrations coordinated with application rollout?
What requires human approval?
How are smoke tests and health gates evaluated?
How is rollback prepared and audited?
How does CI hand approved desired state to GitOps?
```

The core principle is:

```text
Every release must be traceable from source commit
to verified artifact
to immutable image digest
to approved environment state.
```

---

# 8589 — CI/CD Goals

The delivery system should be:

```text
repeatable
fast enough for normal development
secure
auditable
deterministic
failure-aware
environment-safe
artifact-centric
rollback-ready
GitOps-compatible
```

It should reduce manual deployment risk without hiding important release decisions.

---

# 8590 — CI/CD Is a Control System

CI/CD is not only a script runner.

It is a control system around:

```text
source changes
quality evidence
security evidence
artifact creation
release approval
environment promotion
deployment intent
verification
recovery
```

---

# 8591 — CI vs CD

Separate the concepts.

CI:

```text
validate source
compile
test
scan
package
build image
publish trusted artifacts
```

CD:

```text
promote approved artifact
update desired state
coordinate migration
verify rollout
record release
support rollback
```

PART 33 will define the GitOps controller that reconciles desired state into Kubernetes.

---

# 8592 — CI/CD Does Not Own Business Correctness

The pipeline proves and enforces evidence.

It does not replace:

```text
domain invariants
database constraints
idempotency
Saga recovery
authorization
reconciliation
runtime observability
```

Those remain application/platform responsibilities defined in earlier parts.

---

# 8593 — Delivery Architecture Principle

Use this flow:

```text
Source Commit / Merge Request
        ↓
Static Validation
        ↓
Compile + Unit / Domain Tests
        ↓
Integration + Contract + Migration Tests
        ↓
Security / Supply-Chain Gates
        ↓
Build Immutable Image Once
        ↓
Publish Digest + SBOM + Provenance
        ↓
Promote Same Digest
        ↓
Git-Managed Environment Desired State
        ↓
GitOps Reconciliation (PART 33)
        ↓
Smoke / Health Verification
```

---

# 8594 — Build Once, Promote Many

A release artifact is built once.

Promotion means:

```text
the exact same image digest moves forward
```

Do not rebuild a release separately for:

```text
DEV
QA
UAT
STAGING
PRODUCTION
```

---

# 8595 — Why Rebuild Per Environment Is Wrong

Rebuilding can change:

```text
dependencies
base image
timestamps
compiler output
transitive resolution
supply-chain evidence
```

Then the production artifact is not the artifact that UAT/staging validated.

---

# 8596 — Artifact Identity

Every release candidate should have stable identity fields:

```text
service
application_version
git_commit_sha
pipeline_id
image_repository
image_digest
build_timestamp
SBOM_reference
scan_reference
signature/provenance_reference
```

---

# 8597 — Source Is Not a Release Artifact

A Git commit identifies source.

A deployable release is identified by:

```text
verified commit + immutable image digest + release evidence
```

---

# 8598 — Pipeline as Code

Pipeline definition must live in version control.

Primary mechanism:

```yaml
.gitlab-ci.yml
```

Reusable templates may live in an approved platform repository.

---

# 8599 — Pipeline Change Review

Changes to pipeline logic require code review because they can change:

```text
security gates
test coverage
artifact contents
deployment permissions
production behavior
```

---

# 8600 — No Hidden Production Pipeline

Do not depend on undocumented UI-only job logic for critical release behavior.

Critical pipeline behavior should be:

```text
versioned
reviewed
reproducible
discoverable
```

---

# 8601 — GitLab CI Platform

GitLab CI is the initial platform standard.

Use it for:

```text
merge request validation
build/test
security scans
artifact publication
release metadata
promotion workflow
GitOps repository updates
```

---

# 8602 — Repository Model

CI/CD must support both:

```text
polyrepo services
shared platform/template repositories
```

If a monorepo is introduced later, path-aware child pipelines may be used.

---

# 8603 — Service Repository Minimum Files

Typical service repository includes:

```text
application source
build descriptor
Dockerfile
.dockerignore
Flyway migrations
tests
contract definitions
.gitlab-ci.yml or include
CODEOWNERS
README/runbook links
```

---

# 8604 — Protected Main Branch

The default branch must be protected.

Normal changes reach it through:

```text
merge request
required review
required pipeline success
```

---

# 8605 — No Direct Production Code Push

Direct push to protected production release branches/tags should be restricted.

Production changes must remain:

```text
reviewed
traceable
pipeline-validated
```

---

# 8606 — Merge Request as Quality Boundary

A merge request should show enough evidence to answer:

```text
What changed?
Who reviewed it?
Which tests passed?
Did contracts change?
Did migrations change?
Did security findings change?
Is the release impact understood?
```

---

# 8607 — Required Merge Request Checks

Typical required checks:

```text
format/lint
compile
unit/domain tests
application tests
integration tests where practical
contract compatibility
migration validation
SAST/SCA
secret scan
policy checks
```

---

# 8608 — Merge Request Approval

Approval rules should reflect risk.

Examples:

```text
service owner review
CODEOWNER review for contracts
DB review for high-risk migration
security review for auth/crypto/pipeline changes
platform review for deployment template changes
```

---

# 8609 — CODEOWNERS

Use CODEOWNERS for sensitive paths such as:

```text
authentication/security code
payment/wallet code
database migrations
API/event contracts
Dockerfile
CI templates
Kubernetes/GitOps manifests
```

---

# 8610 — Separation of Duties

For production-sensitive systems, the same person should not necessarily be able to:

```text
change code
weaken pipeline gates
approve own change
alter production desired state
bypass audit
```

Exact policy depends on team size and risk.

---

# 8611 — Branch Strategy

Prefer a simple branch model.

Typical:

```text
short-lived feature branch
merge request
main as releasable integration branch
```

Avoid long-lived environment branches that drift from one another.

---

# 8612 — Environment Branch Anti-Pattern

Avoid maintaining independent code branches such as:

```text
dev
qa
uat
prod
```

for environment-specific application source.

Environment differences belong in runtime configuration / desired-state repositories.

---

# 8613 — Release Tags

Use immutable annotated release tags when a formal release version is required.

Example:

```text
order-service-v1.8.0
```

Tag creation should obey protected-tag rules.

---

# 8614 — Semantic Versioning Direction

Public/service contracts may use semantic versioning concepts.

Application deployment identity should still include the immutable image digest.

---

# 8615 — Commit SHA

Always retain full Git commit SHA in release metadata.

Short SHA is useful for display, but full SHA is the authoritative source reference.

---

# 8616 — Commit Message Policy

Commit message format may support:

```text
change history
release notes
issue linkage
automated changelog
```

Do not make commit wording the only source of release approval evidence.

---

# 8617 — Issue / Change Linkage

Where organization process requires it, release metadata should link:

```text
issue/ticket
merge request
change request
incident/security exception
```

---

# 8618 — Pipeline Trigger Types

Typical triggers:

```text
merge request
push to main
release tag
scheduled pipeline
manual protected pipeline
API-triggered pipeline
```

---

# 8619 — Merge Request Pipeline

Primary purpose:

```text
fast validation before merge
```

It should not deploy to production.

---

# 8620 — Main Branch Pipeline

Primary purpose:

```text
re-verify merged state
build trusted release image
publish artifacts
optionally deploy/promote to DEV
```

---

# 8621 — Release Pipeline

A release pipeline may add:

```text
formal version/tag
release notes
signing
production-candidate metadata
higher approval gates
```

---

# 8622 — Scheduled Pipeline

Useful for:

```text
dependency scans
base image rebuild checks
nightly regression
contract drift checks
long-running tests
registry CVE re-evaluation
```

---

# 8623 — Manual Pipeline

Manual protected pipelines may be used for:

```text
controlled promotion
repair job release
exceptional rollback
re-run of approved operational task
```

They must remain audited.

---

# 8624 — Pipeline Stages

Recommended logical stages:

```text
validate
compile
unit-test
integration-test
contract-test
security
package
image
attest
publish
promote
migrate
deploy-intent
verify
release-record
```

Exact GitLab stage names may be simplified.

---

# 8625 — Stage Dependency Rule

Do not serialize unrelated work unnecessarily.

Run independent checks in parallel while preserving required dependencies.

---

# 8626 — DAG Pipelines

Use GitLab `needs` where useful to create a DAG.

Goal:

```text
fast feedback without weakening gates
```

---

# 8627 — Fail Fast

Cheap deterministic checks should run early.

Examples:

```text
syntax
format
compile
unit tests
secret detection
```

Do not spend ten minutes building an image when source does not compile.

---

# 8628 — Do Not Hide Failures

A required quality gate must not be marked:

```yaml
allow_failure: true
```

unless the exception is deliberate, documented, and time-bounded.

---

# 8629 — Non-Blocking Informational Jobs

Informational jobs may be non-blocking when they do not yet represent policy.

Example:

```text
experimental quality metric
advisory dependency report
```

Clearly label them as advisory.

---

# 8630 — Pipeline Retry

Retry only failure types likely to be transient.

Examples:

```text
runner infrastructure failure
temporary registry/network problem
```

Do not automatically retry deterministic test failures until they appear green.

---

# 8631 — Job Timeout

Every job should have a bounded timeout appropriate to its purpose.

A hung job must not hold a runner indefinitely.

---

# 8632 — Pipeline Cancellation

New commits should cancel superseded pipelines where safe.

Never cancel an in-progress production promotion/migration merely because a new source commit exists.

---

# 8633 — Interruptible Jobs

Mark safe validation jobs as interruptible.

Deployment, migration, signing, and release-record jobs require more careful cancellation semantics.

---

# 8634 — Resource Groups

Use GitLab resource groups or equivalent serialization for operations that must not overlap.

Examples:

```text
production promotion for one service/environment
database migration
environment reset
```

---

# 8635 — Pipeline Concurrency

Concurrent pipelines must not:

```text
overwrite each other's release metadata
reuse mutable tags incorrectly
race on migration
race on environment promotion
```

---

# 8636 — Pipeline Idempotency

Re-running a pipeline should not create duplicate business-impacting side effects.

Artifact publication and environment update operations should be designed for safe retry.

---

# 8637 — Reusable CI Templates

Central templates may define:

```text
standard stages
Java build
test reporting
container build
security scanning
SBOM
signing
release metadata
```

---

# 8638 — Template Version Pinning

Do not include floating CI templates from an uncontrolled branch.

Pin approved template version/tag/commit so a pipeline cannot change unexpectedly.

---

# 8639 — Template Upgrade

Template changes should be tested and rolled out intentionally across services.

Avoid a single shared template change breaking every repository at once.

---

# 8640 — Service Overrides

Services may override defaults only where justified.

Overrides should not silently remove required organization gates.

---

# 8641 — Pipeline Lint

Validate GitLab CI configuration before merge.

Detect:

```text
invalid YAML
invalid includes
circular needs
undefined stages
unsafe variable assumptions
```

---

# 8642 — Runner Model

CI runners execute untrusted or semi-trusted build workloads.

Treat runners as security boundaries.

---

# 8643 — Shared vs Dedicated Runners

Possible model:

```text
shared runners for standard validation
restricted runners for signing/promotion
isolated runners for production-sensitive jobs
```

---

# 8644 — Runner Least Privilege

A normal compile/test runner should not have:

```text
production Kubernetes credentials
production DB credentials
signing private keys
broad cloud admin rights
```

---

# 8645 — Protected Runners

Production/release runners should execute only protected branches/tags according to GitLab policy.

---

# 8646 — Ephemeral Runners

Prefer ephemeral or clean runner environments where possible.

Benefits:

```text
less cross-job contamination
lower secret residue
more reproducible builds
```

---

# 8647 — Runner Workspace Cleanup

Ensure build workspace and temporary credentials are cleaned after jobs.

Do not rely on developer-like persistent runner state.

---

# 8648 — Privileged Runner Risk

Privileged Docker-in-Docker increases attack surface.

Prefer safer BuildKit/rootless/cloud builders where practical.

---

# 8649 — Docker Socket Risk

Mounting host Docker socket grants powerful host control.

Do not expose it to general untrusted build jobs without deliberate isolation.

---

# 8650 — Runner Network Egress

CI runners should have only the network access required for:

```text
source checkout
dependency repositories
test dependencies
registry
approved scanners/services
```

Production networks should not be broadly reachable from general CI.

---

# 8651 — Dependency Repository

Use approved Maven/Gradle repositories and mirrors.

Prefer controlled proxy/cache infrastructure for reliability and governance.

---

# 8652 — Dependency Locking

Where tooling supports it, use dependency locking/checksums to reduce unexpected dependency drift.

---

# 8653 — Build Tool Wrapper

Use repository wrapper:

```text
Gradle Wrapper
Maven Wrapper
```

so CI and developers use the intended build tool version.

---

# 8654 — Java Version

CI builder Java version must match the platform-approved LTS standard from PART 26.

---

# 8655 — Clean Checkout

Trusted builds originate from a clean repository checkout.

Do not package local developer outputs into release images.

---

# 8656 — Reproducible Build Goal

Given the same:

```text
source
build tool
dependencies
base image
configuration
```

the pipeline should produce equivalent application behavior and traceable artifact identity.

---

# 8657 — No Environment Secrets at Build Time

Application builds must not require production secrets.

Runtime secrets are injected by environment mechanisms.

---

# 8658 — Build-Time Secret

If a build truly needs a private dependency credential, use ephemeral CI secret injection or BuildKit secret mount.

Never bake the credential into image layers.

---

# 8659 — CI Variables

GitLab CI variables should be:

```text
scoped
masked where supported
protected where required
short-lived where possible
```

---

# 8660 — File Variables

Use file-type secret variables for certificates/keys only when approved and when external identity integration is unavailable.

---

# 8661 — OIDC / Federated CI Identity

Prefer short-lived workload identity/OIDC from CI to cloud/registry systems over long-lived static access keys where supported.

---

# 8662 — Environment-Scoped Credentials

Credentials for DEV, UAT, and PROD must be separate.

A non-production job must not receive production credentials.

---

# 8663 — Secret Exposure Prevention

Do not print secrets through:

```text
echo
debug trace
stack trace
curl verbose output
generated config artifact
```

---

# 8664 — Pipeline Debug Logging

Enable CI debug tracing only for controlled troubleshooting.

Assume it can expose sensitive environment data.

---

# 8665 — Artifact Retention

Pipeline artifact retention must reflect purpose.

Retain longer:

```text
release evidence
SBOM
scan reports
test reports
provenance
```

than ordinary temporary build output.

---

# 8666 — Artifact Access Control

Sensitive artifacts must not be publicly accessible.

Reports can contain:

```text
internal paths
dependency information
security findings
test data
```

---

# 8667 — Cache vs Artifact

CI cache:

```text
optimization
may be discarded
must not be trusted as release evidence
```

Artifact:

```text
pipeline output with identity/retention
```

---

# 8668 — Cache Poisoning

Do not let untrusted branches overwrite caches used by protected release jobs without isolation/keying.

---

# 8669 — Cache Key

Cache keys should include enough dimensions to prevent incompatible reuse.

Examples:

```text
project
branch/protection class
build-tool lock state
Java version
```

---

# 8670 — Validation Stage

Validation stage can include:

```text
YAML lint
Dockerfile lint
format check
API spec validation
Protobuf validation
Flyway filename validation
Kubernetes manifest render/policy test
```

---

# 8671 — Compile Stage

Compile must use warnings/error policy appropriate to the language/team standard.

Compilation success is necessary but not sufficient for merge.

---

# 8672 — Unit Test Stage

Run fast deterministic unit/domain tests on every merge request.

These should be the highest-volume tests.

---

# 8673 — Domain Test Gate

Critical domain invariants from PART 25 must be covered before release.

Examples include:

```text
money rules
state transitions
eligibility
ledger invariants
reward allocation
```

---

# 8674 — Application Test Stage

Test use-case orchestration and port interactions without requiring full deployed environments.

---

# 8675 — Integration Test Stage

Use Testcontainers for real infrastructure where behavior matters:

```text
PostgreSQL
Kafka
Redis
```

---

# 8676 — Integration Test Isolation

Each pipeline/job should use isolated test infrastructure/data.

Do not depend on shared mutable DEV databases for CI correctness.

---

# 8677 — Database Integration Test

Validate:

```text
Flyway from clean schema
constraints
indexes where behavior depends on them
transaction semantics
locking/concurrency cases
```

---

# 8678 — Kafka Integration Test

Validate:

```text
serialization/schema
producer/consumer behavior
outbox/inbox
duplicate handling
retry/DLQ behavior where applicable
```

---

# 8679 — Redis Integration Test

Validate:

```text
TTL
cache serialization
fallback
rate limits
coordination semantics
```

without treating Redis as authoritative critical state.

---

# 8680 — Contract Test Stage

Contract tests protect:

```text
REST/OpenAPI
gRPC/Protobuf
Kafka schemas
webhook contracts
```

---

# 8681 — Backward Compatibility Gate

Breaking contract changes must be detected before production promotion.

Required behavior depends on the contract/versioning policy from PART 05.

---

# 8682 — Consumer Compatibility

When producer/consumer compatibility matters, CI should verify against known consumer expectations or a contract registry/test suite.

---

# 8683 — Schema Registry Compatibility

Kafka schema changes should be checked against configured compatibility policy before publication/deployment.

---

# 8684 — Migration Test Stage

Every release containing DB migrations should test:

```text
clean install
upgrade from supported previous schema
application compatibility
migration repeat/failure behavior where feasible
```

---

# 8685 — Migration Naming Gate

Flyway migration naming/order must be deterministic and reviewed.

---

# 8686 — Migration Checksum

Do not edit an already-applied production migration casually.

Create a new migration unless an approved repair process is used.

---

# 8687 — Static Analysis

Use static analysis for:

```text
code quality
bug patterns
security patterns
maintainability
```

Tool choice may include organization-approved GitLab/Sonar tooling.

---

# 8688 — Coverage

Coverage is evidence, not the goal.

Use coverage thresholds carefully and focus on critical behavior/risk as defined in PART 25.

---

# 8689 — Coverage Regression

A large unexplained coverage drop should be visible and may block merge according to team policy.

---

# 8690 — Flaky Test Policy

Flaky tests are defects.

Do not solve flakiness by unlimited automatic reruns.

---

# 8691 — Quarantine

Temporary quarantine may be allowed only with:

```text
owner
ticket
expiry
risk assessment
```

---

# 8692 — Test Report

Publish machine-readable and human-readable test reports.

Examples:

```text
JUnit XML
coverage report
integration summary
contract report
```

---

# 8693 — Failed Test Diagnostics

Preserve enough diagnostics to investigate failure without rerunning locally blindly.

Examples:

```text
test name
logs
container logs
seed/version
correlation data
```

---

# 8694 — Security Stage

Security testing in CI includes several independent controls.

Do not treat one scanner as complete coverage.

---

# 8695 — Secret Detection

Scan repository changes/history according to policy for accidental credentials.

A detected real secret must be rotated, not merely deleted from the latest commit.

---

# 8696 — SAST

SAST analyzes source/bytecode for security weaknesses.

High-severity actionable findings may block merge/release according to policy.

---

# 8697 — SCA

Software Composition Analysis checks third-party dependencies for:

```text
known vulnerabilities
version risk
license policy where enabled
```

---

# 8698 — License Compliance

Dependency licenses may be evaluated against organization policy.

Legal policy owns allowed/denied license decisions.

---

# 8699 — Container Scan

Scan the final runtime image for:

```text
OS packages
runtime/JRE
application dependencies where supported
known CVEs
```

---

# 8700 — Container Scan Timing

Scan:

```text
at build
before production promotion
continuously after publication where registry tooling supports
```

---

# 8701 — Critical Vulnerability Gate

Block release on unapproved critical exploitable vulnerabilities according to PART 26/security policy.

---

# 8702 — Security Exception

Any vulnerability exception requires:

```text
finding
risk assessment
owner
mitigation
expiry
approval
```

---

# 8703 — IaC / Manifest Scan

Scan Kubernetes/GitOps manifests for unsafe patterns such as:

```text
privileged
root
hostPath
missing resource controls
public exposure
broad RBAC
```

---

# 8704 — Pipeline Security Scan

Review CI configuration itself for dangerous patterns:

```text
untrusted includes
secret echo
curl | shell
broad credentials
unverified downloads
privileged jobs
```

---

# 8705 — DAST Placement

DAST requires a deployed target.

Run it in an approved non-production security/staging environment rather than against production unintentionally.

---

# 8706 — Security Scan Result Normalization

Where multiple scanners are used, normalize severity and ownership so teams are not forced to interpret inconsistent policy manually.

---

# 8707 — Policy as Code

Release rules should increasingly be expressed as policy as code.

Examples:

```text
required image properties
Kubernetes security baseline
approved registries
signature presence
vulnerability threshold
```

---

# 8708 — Package Stage

Build the application artifact only after required source/test gates succeed, or reuse the same verified build output if the build process is deterministic and controlled.

---

# 8709 — JAR Artifact

For Spring Boot, retain the built JAR when useful for:

```text
traceability
debugging
SBOM/provenance
rebuild analysis
```

The production deployment unit remains the container image.

---

# 8710 — Docker Build Stage

Build from clean source using the approved Dockerfile and builder strategy from PART 26.

---

# 8711 — BuildKit

BuildKit is the preferred default where infrastructure supports it because it provides:

```text
efficient caching
secret mounts
modern build capabilities
provenance support
```

---

# 8712 — Dockerfile Gate

A production image must use the reviewed Dockerfile path/version.

Do not maintain hidden release-only Dockerfiles without ownership.

---

# 8713 — Image Tagging

Useful tags may include:

```text
commit SHA
application version
release tag
```

But deployment promotion should ultimately pin by digest.

---

# 8714 — No latest in Production

Do not deploy:

```text
:latest
```

to production.

---

# 8715 — Image Digest

After push, resolve and record the immutable OCI digest.

Example:

```text
registry.example.com/order-service@sha256:...
```

---

# 8716 — Registry

Store release images in approved OCI registry.

Initial option may be:

```text
GitLab Container Registry
```

Cloud/Harbor alternatives remain possible if standardized.

---

# 8717 — Registry Credentials

CI push credentials should be scoped to the required repository/action.

Runtime workloads require pull-only access.

---

# 8718 — Registry Immutability

Release tags/repositories should be immutable where supported.

Do not overwrite a production version tag with a different digest.

---

# 8719 — Registry Retention

Retain:

```text
production releases
current candidates
rollback versions
evidence-required images
```

Clean unreferenced branch/test images by policy.

---

# 8720 — Garbage Collection Safety

Registry cleanup must not delete an image digest still referenced by:

```text
production
staging
rollback record
active investigation
```

---

# 8721 — SBOM

Generate an SBOM for every release image.

Approved formats include:

```text
CycloneDX
SPDX
```

---

# 8722 — SBOM Attachment

Associate SBOM with:

```text
image digest
CI artifact
release record
registry attestation where supported
```

---

# 8723 — SBOM Identity

An SBOM is meaningful only when it clearly identifies the artifact/digest it describes.

---

# 8724 — Image Signing

Production-grade release pipeline should sign the immutable image or produce an equivalent trusted registry attestation.

---

# 8725 — Signing Tool

Cosign is an acceptable direction if selected by the platform standard.

Do not hard-code the document to one vendor when registry-native signing is approved.

---

# 8726 — Keyless Signing Direction

Where supported, prefer workload identity/keyless signing to long-lived private signing keys in CI.

---

# 8727 — Signing Key Protection

If signing keys exist, isolate them from general build jobs and restrict use to protected release contexts.

---

# 8728 — Signature Verification

PART 35 may enforce admission so production accepts only trusted signed images.

PART 32 must produce the signature/attestation evidence.

---

# 8729 — Build Provenance

Capture provenance such as:

```text
source repository
commit SHA
pipeline ID
builder identity
build definition
base image
artifact digest
```

---

# 8730 — SLSA Direction

Supply-chain controls should move toward SLSA-aligned provenance where practical.

Detailed hardening remains in PART 35.

---

# 8731 — Release Evidence Bundle

A release candidate should have:

```text
test results
contract results
security scan results
image digest
SBOM
signature/provenance
migration version
release notes
```

---

# 8732 — Release Manifest

Create a machine-readable release manifest.

Example fields:

```yaml
service: order-service
version: 1.8.0
commit: <full-sha>
image: registry.example.com/order-service
digest: sha256:...
pipeline_id: 12345
migration_version: V42
sbom: <reference>
provenance: <reference>
```

---

# 8733 — Release Manifest Immutability

Once promoted to production, the release manifest must not be silently rewritten.

Corrections should create auditable amended metadata.

---

# 8734 — Release Notes

Release notes should summarize:

```text
customer/business changes
API/event changes
migration impact
feature flags
operational notes
known risks
rollback considerations
```

---

# 8735 — Machine vs Human Release Data

Machine metadata provides exact identity.

Human release notes provide operational context.

Both are needed.

---

# 8736 — Release Candidate

A release candidate is an immutable digest plus evidence that has passed the required pre-promotion gates.

---

# 8737 — Promotion

Promotion means changing environment desired state to reference an already-built approved digest.

---

# 8738 — Promotion Path

Default path from PART 28:

```text
DEV
QA
UAT
STAGING
PRODUCTION
```

Performance/security/DR are side-track validation environments.

---

# 8739 — DEV Promotion

After merge/main build, DEV may be updated automatically when team policy allows.

DEV remains an engineering integration environment.

---

# 8740 — QA Promotion

QA promotion requires:

```text
required CI gates green
candidate artifact published
environment ready
```

QA may run broader system regression.

---

# 8741 — UAT Candidate

UAT uses a controlled candidate.

During formal acceptance, unrelated changes should not silently replace the tested digest.

---

# 8742 — UAT Sign-Off

Business UAT sign-off is evidence for promotion.

PART 38 defines the full UAT process.

---

# 8743 — Staging Promotion

Staging must run the exact production candidate digest.

It rehearses:

```text
deployment sequence
migration sequence
network/TLS
secrets/config shape
smoke tests
rollback
```

---

# 8744 — Production Promotion

Production promotion requires the approved staging candidate unless an emergency process explicitly permits otherwise.

---

# 8745 — No Skip Without Policy

Do not casually jump:

```text
CI → PROD
```

for normal high-risk services.

---

# 8746 — Environment Readiness Gate

Before promotion verify required environment foundations:

```text
infrastructure healthy
secrets available
DNS/TLS valid
dependencies reachable
monitoring active
migration capability ready
```

---

# 8747 — Promotion Metadata

Every promotion carries:

```text
service
digest
commit
config revision
migration version
approver/actor
pipeline
time
release note
```

---

# 8748 — Approval Gates

Approvals should be explicit for high-risk environment transitions.

Typical:

```text
UAT sign-off
production approval
security exception approval
migration approval when required
```

---

# 8749 — Approval Is Not a Shell Login

An approval should authorize an automated, predefined release action.

It should not mean giving an operator unrestricted production shell access.

---

# 8750 — Approval Expiry

For sensitive releases, approval may expire if:

```text
artifact changes
config changes
migration changes
candidate becomes stale
```

---

# 8751 — Same Candidate Rule

Any change to source or artifact after approval creates a new candidate that must pass relevant gates again.

---

# 8752 — Config Revision

Application digest and configuration revision are separate identities.

Release metadata must record both.

---

# 8753 — Secret Version

Do not store secret value in release metadata.

Record safe secret version/reference/rotation identity where operationally useful.

---

# 8754 — Feature Flags

Release metadata should list important feature flags required for activation or rollback.

---

# 8755 — GitOps Boundary

CI/CD should not make the Kubernetes API the normal source of production desired state.

Preferred:

```text
CI updates reviewed Git desired state
GitOps controller applies/reconciles
```

---

# 8756 — Direct kubectl from CI

Avoid broad direct cluster-admin deployment from CI.

If a temporary transition requires direct deployment, scope credentials tightly and migrate toward GitOps.

---

# 8757 — GitOps Repository Update

PART 32 may automate a change such as:

```yaml
image:
  repository: registry.example.com/order-service
  digest: sha256:...
```

in the environment desired-state repository.

---

# 8758 — GitOps Commit

The desired-state commit should reference:

```text
service
environment
image digest
release manifest/pipeline
config revision
```

---

# 8759 — GitOps Merge Request

For higher environments, CI may open a merge request rather than push directly.

PART 33 defines the exact Argo CD/GitOps workflow.

---

# 8760 — CI and Argo Separation

CI proves and publishes.

Argo CD in PART 33 reconciles approved desired state.

This separation reduces direct CI credentials to production clusters.

---

# 8761 — Deployment Intent

A successful CI pipeline does not necessarily mean production was deployed.

Track states separately:

```text
build successful
candidate published
promotion approved
desired state changed
deployment healthy
```

---

# 8762 — Database Migration Principle

Database change must preserve compatibility during rolling deployment.

Use expand/contract.

---

# 8763 — Migration Artifact

Migrations belong to the service release and are versioned with source.

---

# 8764 — Dedicated Migration Job

Production may use a dedicated Kubernetes Job with:

```text
versioned image
DB migration-only permission
one execution per release
bounded retry/timeout
central logs
audit result
```

---

# 8765 — Migration Ordering

CI/CD/GitOps must order migration and application rollout according to migration phase.

Common expand case:

```text
apply backward-compatible schema expansion
deploy new app
backfill if needed
later contract old schema
```

---

# 8766 — Migration Gate

If a required migration fails:

```text
stop application rollout
mark release failed
alert owner
preserve logs/state
```

---

# 8767 — Migration Preflight

Before production migration verify:

```text
expected current schema version
target version
DB connectivity
permissions
backup/recovery requirement
estimated lock/duration
```

---

# 8768 — Migration Rehearsal

Run the same migration sequence in staging against representative schema/data volume.

---

# 8769 — Large Migration

Large table rewrites/backfills should not be hidden inside a startup migration if they can create long locks or unpredictable deployment time.

---

# 8770 — Backfill

Long-running backfill may be a separate idempotent Job/process with progress/checkpointing.

---

# 8771 — Migration and Multiple Replicas

Do not rely on every application replica independently racing to perform production migration.

Use a deliberate migration strategy.

---

# 8772 — Flyway Validate

CI should run Flyway validate/clean migration tests according to environment/test policy.

---

# 8773 — Schema Compatibility Gate

Before rollout, verify that:

```text
old app can tolerate expanded schema
new app can start against target schema
rollback app remains possible for defined window
```

---

# 8774 — Destructive Migration

Drop/rename/incompatible type changes require staged contract timing.

Do not combine destructive schema change with the first deployment that stops using the old structure.

---

# 8775 — Database Rollback Warning

Application rollback cannot undo an incompatible committed DB migration.

Prefer forward-fix/expand-contract over assuming schema rollback is safe.

---

# 8776 — Migration Result Metadata

Record:

```text
service
environment
from_version
to_version
job/pipeline
start/end
result
```

for operational correlation.

---

# 8777 — Migration Annotation

Publish migration change event to observability so incidents can be correlated with schema change.

---

# 8778 — Deployment Verification

After desired state reaches an environment, verify more than process start.

---

# 8779 — Kubernetes Rollout Gate

Check:

```text
desired replicas available
new Pods ready
rollout not timed out
no unexpected restart storm
```

---

# 8780 — Startup Probe Gate

New Pods must complete startup probe before normal liveness semantics apply.

---

# 8781 — Readiness Gate

A deployment is not healthy if Pods exist but never become ready.

---

# 8782 — Smoke Test

Run a minimal post-deploy smoke suite against the environment.

Examples:

```text
gateway reachability
health/readiness
authentication flow
critical read
safe synthetic write where appropriate
```

---

# 8783 — Smoke Test Characteristics

Smoke tests should be:

```text
fast
safe
repeatable
environment-aware
non-destructive or self-cleaning
```

---

# 8784 — Synthetic Transaction

Tier-1 services may use synthetic business flows for stronger verification.

Use dedicated synthetic identities/data so tests do not affect real customer/financial state.

---

# 8785 — External Integration Smoke

For partner-dependent releases, verify the correct sandbox/production connectivity without performing unsafe real transactions.

---

# 8786 — Observability Gate

A deployment can use short observation checks for:

```text
5xx increase
latency regression
restart rate
dependency failure
critical business error
```

---

# 8787 — SLO Gate

Do not blindly block on noisy single metrics.

For progressive/high-risk release, compare meaningful service health/SLO indicators against policy.

---

# 8788 — Deployment Annotation

CI/CD should publish change annotations containing:

```text
type
service
environment
version/digest
actor
time
pipeline/release
```

---

# 8789 — Verification Window

Some failures appear after readiness.

Critical releases may require a bounded observation window before final promotion completion.

---

# 8790 — Deployment Success Definition

Success means:

```text
desired state applied
rollout healthy
required migrations successful
smoke checks passed
no blocking health regression
release recorded
```

---

# 8791 — Deployment Failure Definition

Examples:

```text
migration failure
Pods not ready
rollout timeout
smoke failure
critical security/policy failure
severe health regression
```

---

# 8792 — Automatic Rollback

Automatic rollback can be appropriate only when failure signal is reliable and rollback is known safe.

Do not auto-rollback blindly across incompatible schema changes.

---

# 8793 — Manual Rollback

High-risk rollback may require an explicit operator decision using prepared release metadata.

---

# 8794 — Rollback Target

Know the previous:

```text
image digest
config revision
migration compatibility
feature-flag state
```

---

# 8795 — Known-Good Release

Maintain a clearly identified last-known-good release per production service.

---

# 8796 — Application Rollback

Preferred GitOps rollback:

```text
revert desired-state commit
or promote previous known-good digest
```

PART 33 defines reconciliation details.

---

# 8797 — Config Rollback

Configuration rollback is a separate change from image rollback and must be versioned/audited.

---

# 8798 — Feature Flag Rollback

Disabling a feature flag can be safer/faster than image rollback when the old code path remains supported.

---

# 8799 — Secret Rollback

Secret rollback may require reactivating a previous valid secret version.

Do not assume old credentials remain valid after rotation.

---

# 8800 — Schema Rollback

Do not promise automatic schema rollback unless the migration is explicitly designed and tested for it.

---

# 8801 — Roll Forward

For some production failures, a forward fix is safer than rollback.

Decision depends on:

```text
data change
schema compatibility
external side effects
incident severity
```

---

# 8802 — Rollback Test

High-risk releases should rehearse rollback in staging.

---

# 8803 — Rollback Audit

Record:

```text
reason
from release
to release
actor/approver
time
incident/change link
result
```

---

# 8804 — Emergency Release

Emergency changes may shorten normal gates only through documented break-glass policy.

Never make emergency mode equal to unreviewed manual production changes.

---

# 8805 — Emergency Minimum Gates

Even emergency release should retain where possible:

```text
source review
build identity
essential tests
artifact digest
security/secret checks
audit
rollback plan
```

---

# 8806 — Hotfix

A hotfix should return to the normal mainline immediately after incident handling so branches do not diverge.

---

# 8807 — Change Freeze

Release calendar/change freeze can block normal production promotions while still allowing approved emergency/security fixes.

---

# 8808 — Deployment Window

A maintenance window may be required for:

```text
high-lock migration
partner coordinated cutover
DNS/certificate migration
large data backfill
```

---

# 8809 — Partner Cutover

When release changes callback/partner endpoint, pipeline/release checklist should confirm:

```text
registered URL
credential/certificate
allowlist
callback verification
rollback endpoint
```

---

# 8810 — DNS / TLS Cutover

If release depends on DNS/TLS changes, those changes must be treated as versioned release dependencies, not informal manual steps.

---

# 8811 — Pipeline Failure Ownership

Every failed required pipeline has an owning team/service.

Platform failures and application failures should be distinguishable.

---

# 8812 — Runner Failure

Runner unavailability is a platform issue, not application test failure.

Expose it clearly in pipeline metrics.

---

# 8813 — Registry Failure

If registry push/pull fails, do not substitute an unverified alternate artifact.

---

# 8814 — Dependency Repository Failure

Use bounded retries/cache/mirror strategy.

Do not permanently weaken dependency verification to get a build through.

---

# 8815 — Test Infrastructure Failure

Distinguish Testcontainers/runner infrastructure failure from a deterministic failing test.

---

# 8816 — Pipeline Partial Success

A green build job does not override a failed required test/security job.

Release status is aggregate policy, not one stage.

---

# 8817 — Pipeline Resume

Manual retry should resume from safe boundaries without changing the candidate artifact unexpectedly.

---

# 8818 — Artifact Reuse on Retry

If retrying downstream promotion/verification, reuse the existing immutable digest rather than rebuilding.

---

# 8819 — Pipeline Retention

Retain production pipeline/release evidence according to audit/compliance/incident needs.

---

# 8820 — Audit Trail

For production answer:

```text
who changed source?
who approved merge?
which pipeline built it?
which digest?
which scans/tests?
who approved promotion?
which desired-state commit?
when did rollout occur?
what was previous release?
```

---

# 8821 — Release Correlation

Use a release/deployment ID so logs, metrics, traces, dashboard annotations, and incident records can correlate with a deployment.

---

# 8822 — Service Version Metric

Runtime telemetry should expose stable service version/build information without high-cardinality labels.

---

# 8823 — DORA Metrics

Track delivery metrics such as:

```text
deployment frequency
lead time for changes
change failure rate
time to restore service
```

Use them to improve the system, not punish teams.

---

# 8824 — Pipeline Metrics

Useful CI metrics:

```text
pipeline duration
queue time
success rate
failure category
test duration
cache hit
runner utilization
```

---

# 8825 — Stage Duration

Track slow stages so feedback time can be improved without deleting required tests.

---

# 8826 — Flaky Test Metric

Track flaky/quarantined tests by owner and age.

---

# 8827 — Security Finding Age

Track unresolved release/security exceptions and their expiry.

---

# 8828 — Deployment Metrics

Track:

```text
promotion count
failed rollout
rollback count
migration failure
smoke failure
```

---

# 8829 — Release Health

Correlate deployment metrics with runtime SLO/error-budget signals from PART 31.

---

# 8830 — Notification of Pipeline Events

Send actionable notifications for:

```text
production promotion
failed release
rollback
security block
migration failure
```

Avoid noisy notification for every ordinary successful job.

---

# 8831 — ChatOps

ChatOps may surface status/approvals, but the authoritative action should still be recorded by GitLab/GitOps/audit systems.

---

# 8832 — Release Dashboard

A release dashboard should show:

```text
service
current env version/digest
candidate
pipeline status
migration version
recent deployment
health link
rollback target
```

---

# 8833 — Environment Version Matrix

Maintain a view of:

```text
service
environment
image digest
config revision
migration version
```

so drift is visible.

---

# 8834 — Promotion Drift

Detect when an environment is running an artifact not represented by approved desired state.

---

# 8835 — Manual Drift

A manual cluster change must be detected and reconciled to Git or reverted.

PART 33 formalizes Argo drift handling.

---

# 8836 — CI/CD and Security Architecture

CI/CD enforces PART 06/35 controls through:

```text
least privilege
secret isolation
scans
artifact trust
audit
approval
```

---

# 8837 — CI/CD and Data Architecture

CI/CD enforces data evolution through:

```text
Flyway versioning
migration tests
schema compatibility
migration audit
```

---

# 8838 — CI/CD and Contracts

Contract checks must prevent incompatible REST/gRPC/Kafka changes from bypassing review.

---

# 8839 — CI/CD and Testing

PART 25 defines what must be tested.

PART 32 defines when/how those suites become automated release gates.

---

# 8840 — CI/CD and Docker

PART 26 defines image construction standards.

PART 32 automates:

```text
build
tag
digest capture
scan
SBOM
sign
push
promotion
```

---

# 8841 — CI/CD and Environment Strategy

PART 28 defines environment purpose/isolation.

PART 32 implements controlled promotion across those environments.

---

# 8842 — CI/CD and Kubernetes

PART 29 defines workload behavior.

PART 32 validates manifests and prepares approved desired-state changes.

---

# 8843 — CI/CD and Networking

Release gates should account for route/TLS/certificate/partner connectivity changes when the release depends on them.

---

# 8844 — CI/CD and Observability

PART 31 provides health signals.

PART 32 publishes deployment annotations and uses relevant health checks during release verification.

---

# 8845 — CI/CD and GitOps

PART 32 produces and promotes trusted artifact identity.

PART 33 makes Git the deployment source of truth and Argo CD the reconciliation authority.

---

# 8846 — Service Pipeline Profile: Simple API

Typical:

```text
validate
compile
unit/domain
integration
contract
security
image
SBOM/sign
publish
promote
verify
```

---

# 8847 — Service Pipeline Profile: Kafka Worker

Additionally validate:

```text
event schema
consumer compatibility
duplicate handling
DLQ/retry behavior
graceful shutdown
```

---

# 8848 — Service Pipeline Profile: Payment

Higher-risk gates should include:

```text
idempotency tests
provider mock/contract
unknown outcome tests
refund tests
security review
strong production approval
```

---

# 8849 — Service Pipeline Profile: Wallet

Higher-risk gates should include:

```text
ledger invariant tests
double-spend concurrency
reconciliation tests
migration safety
```

---

# 8850 — Service Pipeline Profile: Inventory

Higher-risk gates should include:

```text
reservation concurrency
negative-stock protection
expiry/release
load/concurrency regression
```

---

# 8851 — Service Pipeline Profile: Identity

Higher-risk gates should include:

```text
authentication tests
authorization tests
token/session tests
password-reset abuse/security tests
secret scan
```

---

# 8852 — Service Pipeline Profile: Catalog

Emphasize:

```text
contract compatibility
cache behavior
migration
read-performance regression where needed
```

---

# 8853 — Service Pipeline Profile: Notification

Emphasize:

```text
template/translation validation
provider mock
dedupe
retry
channel fallback
```

---

# 8854 — Service Pipeline Profile: Integration / ACL

Emphasize:

```text
mapping tests
webhook authentication
provider contract
idempotency
retry/reconciliation
certificate/endpoint configuration
```

---

# 8855 — Migration-Only Release

A migration-only release still requires:

```text
review
tested migration artifact
schema compatibility
backup/recovery consideration
audit
verification
```

---

# 8856 — Configuration-Only Release

Config-only production changes must still be:

```text
versioned
reviewed
promoted
observable
rollback-ready
```

---

# 8857 — Secret Rotation Release

Secret rotation should be coordinated with:

```text
new secret version
application compatibility
provider rotation
observability annotation
rollback/dual-validity window where supported
```

---

# 8858 — Base Image Rebuild

A new CVE may require rebuilding the same application version on a patched base image.

Use a new image digest/build revision and run required release gates.

---

# 8859 — Dependency Update Automation

Automated dependency update MRs may be used.

They must pass the same tests/scans and should not auto-merge high-risk changes without policy.

---

# 8860 — Renovation Bot Principle

Dependency bots propose changes; CI proves them.

Automation does not bypass ownership.

---

# 8861 — Pipeline Performance

Optimize feedback with:

```text
parallel jobs
DAG needs
dependency cache
incremental test selection where safe
right-sized runners
```

---

# 8862 — Do Not Optimize Away Safety

A faster pipeline is not an improvement if it removes:

```text
contract tests
migration tests
security gates
critical concurrency tests
```

---

# 8863 — Test Selection

Path-based/selective tests may be used only when dependency relationships are reliable.

Full regression remains required at appropriate release points.

---

# 8864 — Parallel Test Sharding

Large deterministic suites may be sharded.

Aggregate all shard results before gate decision.

---

# 8865 — Runner Sizing

Use runner classes appropriate to:

```text
compile
integration containers
image build
security scanning
```

Avoid one oversized privileged runner for everything.

---

# 8866 — Build Cache

Cache build dependencies, not final release truth.

A cache miss must slow the build, not change correctness.

---

# 8867 — Image Layer Cache

Use controlled BuildKit registry/local cache to speed builds without allowing untrusted cache poisoning.

---

# 8868 — Pipeline Cost

Track runner minutes/storage/registry growth and optimize with retention and concurrency policy.

---

# 8869 — Artifact Storage Cost

Long-term evidence retention can move to durable archive if required; keep links from release records.

---

# 8870 — Monorepo Pipeline Direction

If a monorepo is used, child pipelines can build only affected services while preserving cross-service contract validation.

---

# 8871 — Polyrepo Coordination

Cross-service changes require:

```text
backward-compatible contracts
ordered promotion where necessary
integration test coordination
release notes
```

Avoid requiring simultaneous deployment as the default.

---

# 8872 — Multi-Service Release

A coordinated release may group multiple service candidates, but each service must retain its own artifact identity/digest.

---

# 8873 — Atomic Multi-Service Deploy Myth

Do not pretend several service deployments form one global ACID deployment.

Use compatibility and staged rollout.

---

# 8874 — Contract-First Release

For breaking evolution, deploy compatible provider/consumer changes in safe order before removing old contract support.

---

# 8875 — Event Schema Release

Kafka schema registration/promotion should be tied to compatible producer/consumer release sequencing.

---

# 8876 — Database-per-Service Release

Each service pipeline owns migrations for its own authoritative database only.

Do not let one service pipeline directly mutate another service database.

---

# 8877 — Shared Platform Change

Changes to shared CI templates/base images/Kubernetes templates should have their own validation and staged rollout.

---

# 8878 — CI Template Test Project

Maintain representative test repositories/services for validating shared CI template changes before broad adoption.

---

# 8879 — Base Image Qualification

Before making a new base image default, verify:

```text
Java startup
TLS CA
non-root
scanner result
resource behavior
graceful shutdown
```

---

# 8880 — Tool Version Pinning

Pin critical CI tools/scanners/builders to approved versions.

Avoid floating `latest` for release tooling.

---

# 8881 — Tool Integrity

Verify downloaded tooling through trusted repository/checksum/signature where practical.

---

# 8882 — Third-Party CI Include

Do not include arbitrary remote CI YAML from an untrusted repository into protected pipelines.

---

# 8883 — Pipeline Supply-Chain Threat Model

Threats include:

```text
malicious dependency
compromised runner
stolen token
tampered image
untrusted template
secret exfiltration
artifact substitution
```

---

# 8884 — Artifact Substitution Prevention

Promote by immutable digest and verify provenance/signature so a tag cannot silently point to another image.

---

# 8885 — Release Promotion Authorization

The identity allowed to publish an image is not automatically the identity allowed to promote it to production.

---

# 8886 — Production Credential Scope

CI should not hold standing broad production cluster credentials when GitOps can remove that requirement.

---

# 8887 — Break-Glass Credentials

Emergency credentials should be:

```text
separate
time-limited where possible
MFA/protected
audited
rotated after use when appropriate
```

---

# 8888 — Pipeline Secret Rotation

Rotate CI credentials/signing materials according to security policy and verify pipelines do not depend on undocumented old values.

---

# 8889 — MR from Fork / Untrusted Source

Untrusted merge request pipelines must not receive protected secrets or production-capable credentials.

---

# 8890 — Protected Variables

Use protected variables only in protected ref contexts.

---

# 8891 — Masking Is Not Encryption

Masked output reduces accidental log display but does not make broad secret access safe.

Least privilege remains required.

---

# 8892 — Review App Direction

Optional ephemeral review environments can improve UI/API validation.

They must use synthetic data and isolated credentials/resources.

---

# 8893 — Ephemeral Environment Lifecycle

If adopted:

```text
create from pipeline
unique namespace/resource identity
TTL/cleanup
no production credentials
cost quota
```

---

# 8894 — Ephemeral DB

Use disposable database/schema where practical.

Do not point review apps to shared production-like mutable data.

---

# 8895 — Ephemeral Kafka / Redis

Use isolated topic/key namespace or ephemeral infrastructure according to test risk.

---

# 8896 — Review Environment Security

Do not publicly expose internal review apps without access control.

---

# 8897 — Pipeline Quality Gate Levels

Suggested levels:

```text
MR gate
main/release gate
environment promotion gate
production gate
post-deploy gate
```

---

# 8898 — MR Gate

Must prove change is safe enough to merge.

---

# 8899 — Main Gate

Must prove merged source can create a trusted immutable candidate.

---

# 8900 — Promotion Gate

Must prove candidate/evidence/environment are eligible to move forward.

---

# 8901 — Production Gate

Must include required approvals, staging evidence, release identity, migration/rollback readiness.

---

# 8902 — Post-Deploy Gate

Must prove the deployed candidate is healthy enough to declare release complete.

---

# 8903 — Quality Gate Ownership

Every required gate needs:

```text
owner
failure meaning
remediation path
exception process
```

---

# 8904 — Quality Gate Versioning

When policy thresholds change, record the policy/template version used for a release.

---

# 8905 — Pipeline Evidence Completeness

A production candidate is incomplete if its essential test/scan/provenance evidence expired or cannot be linked to the digest.

---

# 8906 — Release Revalidation

A long-delayed candidate may require re-scan/revalidation before production because vulnerabilities or environment assumptions can change.

---

# 8907 — CVE Recheck Before Production

Re-scan candidate image before production promotion when policy requires, even if it passed at build time.

---

# 8908 — Expired Security Exception

An expired vulnerability exception blocks promotion until renewed or remediated.

---

# 8909 — Stale UAT Candidate

If significant time passes or dependencies/security context changes, require release manager/owner to determine revalidation scope.

---

# 8910 — Release Freeze Evidence

During UAT/staging freeze, record the exact candidate digest and config revision under test.

---

# 8911 — Pipeline Example — Stages

Illustrative GitLab structure:

```yaml
stages:
  - validate
  - test
  - security
  - package
  - image
  - attest
  - publish
  - promote
  - verify
```

Exact implementation may use DAG `needs` rather than strict serial stages.

---

# 8912 — Pipeline Example — Java Test

Illustrative:

```yaml
unit_test:
  stage: test
  script:
    - ./gradlew test
  artifacts:
    when: always
    reports:
      junit: build/test-results/test/*.xml
```

Use Maven equivalent if that is the service standard.

---

# 8913 — Pipeline Example — Integration

Illustrative:

```yaml
integration_test:
  stage: test
  script:
    - ./gradlew integrationTest
  variables:
    TESTCONTAINERS_RYUK_DISABLED: "false"
```

Runner/container strategy must support Testcontainers securely.

---

# 8914 — Pipeline Example — Build Image

Conceptual:

```yaml
build_image:
  stage: image
  script:
    - buildctl ...
    - push registry image
    - resolve immutable digest
  artifacts:
    paths:
      - image-digest.txt
```

Do not treat this snippet as the organization-specific final builder command.

---

# 8915 — Pipeline Example — Release Manifest

Conceptual:

```yaml
release_manifest:
  stage: publish
  script:
    - ./ci/create-release-manifest.sh
  artifacts:
    paths:
      - release-manifest.yaml
```

The script must consume the already-published digest, not invent a new image.

---

# 8916 — Pipeline Example — Promotion

Conceptual:

```text
read release-manifest
verify required gates
update environment desired-state digest
create/merge approved Git change
```

PART 33 defines the Argo CD reconciliation behavior.

---

# 8917 — Pipeline Example — Migration Gate

Conceptual:

```text
verify current schema
run approved migration Job
wait for success
record Flyway version
only then continue rollout when migration is required first
```

---

# 8918 — Pipeline Example — Smoke

Conceptual:

```text
GET /actuator/health/readiness
authenticate synthetic user
execute safe critical API check
assert expected status/contract
```

---

# 8919 — Pipeline Example — Release Annotation

Conceptual payload:

```json
{
  "type": "deployment",
  "service": "order-service",
  "environment": "prod",
  "version": "1.8.0",
  "digest": "sha256:...",
  "pipeline_id": "12345"
}
```

---

# 8920 — Pipeline Example — Rollback

Conceptual:

```text
select previous known-good release manifest
verify DB/config compatibility
update desired-state digest/config
GitOps reconciles
run smoke/health checks
record rollback
```

---

# 8921 — Pipeline Naming

Use consistent job names so engineers can compare pipelines across services.

---

# 8922 — Standard Job Prefixes

Possible convention:

```text
validate:*
test:*
security:*
build:*
publish:*
promote:*
verify:*
```

---

# 8923 — Job Ownership Label

For complex pipelines, document which team owns each shared job/template.

---

# 8924 — Failure Message Quality

A gate should fail with a useful message explaining:

```text
what failed
where evidence is
how to remediate
who owns policy
```

---

# 8925 — Pipeline Documentation

Each service README should explain:

```text
normal MR pipeline
release trigger
promotion path
migration behavior
rollback path
special/manual jobs
```

---

# 8926 — Runbook: Pipeline Stuck

Check:

```text
runner availability
resource group lock
job dependency
manual approval
environment lock
GitLab incident
```

---

# 8927 — Runbook: Testcontainers Failure

Check:

```text
runner container support
Docker/BuildKit network
resource limits
image pull
test logs
```

---

# 8928 — Runbook: Image Build Failure

Check:

```text
Dockerfile
base image
registry auth
builder cache
disk/quota
dependency download
```

---

# 8929 — Runbook: Security Gate

Check:

```text
finding severity
affected component
exploitability
fixed version
exception policy
false-positive evidence
```

---

# 8930 — Runbook: Migration Failure

Check:

```text
Flyway history
DB logs
lock/wait
permissions
current version
partial side effects
application rollout state
```

---

# 8931 — Runbook: Rollout Failure

Check:

```text
new ReplicaSet
readiness
logs
config/secrets
resource limits
migration
dependency connectivity
recent health metrics
```

---

# 8932 — Runbook: Smoke Failure

Determine whether failure is:

```text
application regression
test issue
environment dependency
authentication/config
network/TLS
```

Do not blindly retry until green.

---

# 8933 — Runbook: Registry Push Failure

Check:

```text
registry availability
quota
credentials
repository path
network
digest consistency
```

---

# 8934 — Runbook: Signing Failure

Check:

```text
identity/key availability
protected context
timestamp/identity provider
registry attestation support
```

Do not publish an unsigned production candidate if policy requires signing.

---

# 8935 — Runbook: Promotion Conflict

If desired-state repository changed concurrently:

```text
refresh base
re-evaluate candidate
resolve manifest conflict
do not force overwrite unrelated environment changes
```

---

# 8936 — Pipeline Recovery Objective

CI platform outage should stop new releases safely, not corrupt running production.

---

# 8937 — CI Is Not Runtime Dependency

Customer transactions must not depend on GitLab CI availability.

---

# 8938 — Registry Availability at Runtime

Existing running Pods continue without registry for a time, but rescheduling/scale-out may need image pulls.

Registry outage is therefore operationally significant.

---

# 8939 — GitLab Backup Consideration

Pipeline/repository/release metadata durability should be included in platform backup/recovery planning where self-managed.

---

# 8940 — Release Evidence Backup

Critical release evidence should not exist only in a short-lived runner workspace.

---

# 8941 — Disaster Recovery Release

DR procedures must know which production digests/config/migrations should be restored/redeployed.

---

# 8942 — Pipeline Time Source

Use UTC timestamps in machine release metadata.

---

# 8943 — Deterministic Locale

CI build/test should use deterministic locale/UTF-8 settings to avoid environment-specific behavior.

---

# 8944 — Khmer / Localization Test

Where service owns translated content/contracts, CI should validate encoding and required translation structure without assuming only ASCII.

---

# 8945 — Currency / Time Boundary Tests

Critical USD/KHR and date/time behavior from PART 25 remains part of automated test gates.

---

# 8946 — Production Data in CI

Never copy raw production PII/financial data into CI job artifacts or test containers.

---

# 8947 — Synthetic Test Data

Use generated/synthetic fixtures by default.

---

# 8948 — Anonymized Data

If production-like data shape is required, use approved anonymization and environment policy from PART 28.

---

# 8949 — Test Data Cleanup

Environment smoke/E2E tests must clean up or use identifiable synthetic records with retention policy.

---

# 8950 — Financial Synthetic Transactions

Do not create real charges/top-ups as ordinary smoke tests.

Use provider sandbox/synthetic mode or specifically controlled verification procedure.

---

# 8951 — Pipeline RBAC

CI identities should have separate permissions for:

```text
registry push
Git desired-state update
migration Job trigger where applicable
release metadata
```

Avoid one all-powerful token.

---

# 8952 — Environment Lock

Production promotion should use an environment lock/resource group so two conflicting releases cannot race.

---

# 8953 — Service-Level Serialization

Serialize per service/environment, not necessarily all platform releases globally.

---

# 8954 — Coordinated Change Lock

For rare shared migration/cutover, a broader release lock may be justified and documented.

---

# 8955 — Approval Identity

Production approvals require authenticated named identity, not a shared account.

---

# 8956 — Audit Immutability

Release audit records should be protected from ordinary developers rewriting historical production facts.

---

# 8957 — Deployment Provenance

It should be possible to prove that the running digest came from an approved pipeline/source.

---

# 8958 — Runtime Image Verification

During verification, compare deployed Pod image digest with intended release digest.

---

# 8959 — Tag-to-Digest Resolution

Never assume a tag still points to the originally approved image.

Capture digest at publish time and use it for promotion.

---

# 8960 — Multi-Architecture Image

If producing multi-arch images, sign/scan/record the manifest index and relevant platform images according to tooling policy.

---

# 8961 — Architecture Consistency

Production node architecture and built image architecture must be compatible and tested.

---

# 8962 — Provenance of Base Image

Record approved base image digest/version in build provenance.

---

# 8963 — Base Image Update Trigger

A base image security update may trigger automated rebuild pipelines even without application source changes.

---

# 8964 — Rebuild Release Naming

Distinguish application version from image rebuild revision.

Example:

```text
1.8.0-r2
```

while preserving source commit identity.

---

# 8965 — Pipeline Policy Exception

Any bypass must be:

```text
explicit
approved
time-limited
audited
visible in release record
```

---

# 8966 — No Permanent Bypass

Temporary exceptions must not silently become normal pipeline behavior.

---

# 8967 — Security Gate Bypass

A bypass for security finding must reference the approved risk exception and expiry.

---

# 8968 — Test Gate Bypass

Skipping a critical failing test requires documented risk and should be rare.

---

# 8969 — Migration Gate Bypass

Do not bypass a failed required migration to start incompatible application Pods.

---

# 8970 — Production Approval Bypass

Emergency approval path remains audited and should have stricter post-incident review.

---

# 8971 — Pipeline Governance

Platform/DevOps owns shared delivery infrastructure/templates.

Service teams own service-specific build/test/release correctness.

Security owns security policy/exception standards.

QA/Product own relevant acceptance evidence.

---

# 8972 — Platform Team Responsibilities

Platform team typically owns:

```text
GitLab runner platform
shared templates
registry integration
signing integration
GitOps handoff patterns
pipeline observability
```

---

# 8973 — Service Team Responsibilities

Service team owns:

```text
tests
Dockerfile/service build
migrations
contracts
release notes
rollback compatibility
service runbooks
```

---

# 8974 — Security Team Responsibilities

Security owns/approves:

```text
scan policy
severity thresholds
secret handling baseline
artifact trust policy
exceptions
```

---

# 8975 — QA Responsibilities

QA owns or co-owns:

```text
system/regression strategy
test evidence
environment validation
release/UAT quality inputs
```

---

# 8976 — Release Manager

Where formal release management exists, role coordinates:

```text
candidate selection
change window
approvals
release communication
rollback decision process
```

---

# 8977 — Developer Self-Service

Normal service release should be self-service through approved pipeline workflow, not a ticket asking an admin to run shell commands.

---

# 8978 — Production Least Privilege

Developers can diagnose using observability/read-only access while deployment authority remains controlled.

---

# 8979 — Pipeline Definition of Done

A service pipeline is complete when:

- [ ] Merge request gates exist.
- [ ] Main/release build is reproducible.
- [ ] Required tests publish reports.
- [ ] Security scans are enforced.
- [ ] Final image is immutable/non-root.
- [ ] Digest is captured.
- [ ] SBOM is generated.
- [ ] Provenance/signature path exists where required.
- [ ] Release manifest is produced.
- [ ] Promotion reuses same digest.
- [ ] Migration strategy is explicit.
- [ ] Smoke verification exists.
- [ ] Rollback target is known.
- [ ] Deployment annotation/audit is emitted.

---

# 8980 — Merge Request Definition of Done

- [ ] Required reviewers approved.
- [ ] Required pipeline green.
- [ ] No unresolved blocking security finding.
- [ ] Contracts reviewed when changed.
- [ ] Migrations reviewed/tested when changed.
- [ ] Release/operational impact documented when material.

---

# 8981 — Release Candidate Definition of Done

- [ ] Commit immutable/identified.
- [ ] Tests green.
- [ ] Security gates green/approved exception.
- [ ] Image published.
- [ ] Digest recorded.
- [ ] SBOM attached.
- [ ] Provenance/signature attached where required.
- [ ] Release manifest created.
- [ ] Migration version known.
- [ ] Candidate is ready for controlled promotion.

---

# 8982 — Production Promotion Definition of Done

- [ ] Same digest passed staging.
- [ ] UAT/business sign-off complete where required.
- [ ] Production approval complete.
- [ ] Config/secret dependencies ready.
- [ ] Migration sequence rehearsed.
- [ ] Rollback target known.
- [ ] Change window/cutover dependencies ready.
- [ ] Desired-state change reviewed/approved.
- [ ] Smoke/health verification plan ready.

---

# 8983 — Post-Deployment Definition of Done

- [ ] Expected digest running.
- [ ] Required Pods ready.
- [ ] Migration target version confirmed.
- [ ] Smoke tests passed.
- [ ] No blocking health regression.
- [ ] Deployment annotation exists.
- [ ] Release record updated.
- [ ] Rollback not required or completed successfully.

---

# 8984 — CI/CD Security Review Checklist

- [ ] Protected branches/tags.
- [ ] Protected variables.
- [ ] No production secret in general jobs.
- [ ] Runner isolation.
- [ ] No uncontrolled privileged Docker.
- [ ] No arbitrary remote CI includes.
- [ ] SAST/SCA/secret/container/IaC scans.
- [ ] SBOM.
- [ ] Signing/provenance.
- [ ] Least-privilege registry/GitOps permissions.
- [ ] Audit trail.
- [ ] Exception expiry.

---

# 8985 — CI/CD Reliability Review Checklist

- [ ] Job timeouts.
- [ ] Safe retry rules.
- [ ] Resource-group serialization.
- [ ] Artifact reuse on retry.
- [ ] Registry failure behavior.
- [ ] Runner outage behavior.
- [ ] Migration failure stop.
- [ ] Rollback path.
- [ ] Release evidence retention.

---

# 8986 — CI/CD Performance Review Checklist

- [ ] Pipeline queue time measured.
- [ ] DAG/parallelization used.
- [ ] Build cache safe.
- [ ] Test sharding where useful.
- [ ] Runner sizing correct.
- [ ] Slow tests identified.
- [ ] No unnecessary rebuild per environment.

---

# 8987 — CI/CD Governance Review Checklist

- [ ] Pipeline-as-code.
- [ ] Template pinned/versioned.
- [ ] CODEOWNERS.
- [ ] Approval rules.
- [ ] Environment promotion policy.
- [ ] Emergency policy.
- [ ] Change/audit linkage.
- [ ] Ownership/runbooks.
- [ ] Metrics/review cadence.

---

# 8988 — Production Readiness Checklist

Before relying on CI/CD for production:

- [ ] Main branch protected.
- [ ] Merge requests require green pipeline.
- [ ] Required reviewers/CODEOWNERS configured.
- [ ] Java/build tool versions pinned.
- [ ] Testcontainers integration tests run in isolated CI.
- [ ] Contract compatibility gate exists.
- [ ] Migration tests exist.
- [ ] SAST/SCA/secret/container scans configured.
- [ ] Critical findings block release unless approved exception.
- [ ] Image built once from clean checkout.
- [ ] Image digest captured and immutable.
- [ ] Registry retention protects rollback releases.
- [ ] SBOM generated.
- [ ] Provenance/signature configured where required.
- [ ] Release manifest generated.
- [ ] DEV→QA→UAT→STAGING→PROD promotion uses same digest.
- [ ] Production approval path is audited.
- [ ] CI does not require broad cluster-admin credentials.
- [ ] Migration Job strategy tested.
- [ ] Expand/contract compatibility tested.
- [ ] Staging rehearses rollout and rollback.
- [ ] Smoke tests run after deployment.
- [ ] Deployment annotations publish to observability.
- [ ] Last-known-good release is recorded.
- [ ] Emergency/break-glass procedure exists.
- [ ] Pipeline and release runbooks exist.
- [ ] Delivery metrics are visible.

---

# 8989 — Initial Implementation Order

Recommended:

```text
1. Protect main branch / MR workflow
2. Standard GitLab CI template
3. Compile + unit/domain tests
4. Testcontainers integration tests
5. Contract + Flyway migration tests
6. SAST/SCA/secret scanning
7. BuildKit container build
8. Registry push + digest capture
9. Container scan
10. SBOM
11. Release manifest
12. DEV promotion using same digest
13. QA/UAT/STAGING promotion gates
14. Dedicated migration Job strategy
15. Post-deploy smoke tests
16. Deployment annotations
17. Production approval + rollback workflow
18. Image signing/provenance
19. CI workload identity / credential reduction
20. GitOps repository update integration
```

---

# 8990 — Minimum Viable CI Standard

Every service must have:

```text
protected merge workflow
automated compile/test
required test reports
basic security scans
reproducible package
immutable image
registry publication
digest identity
```

---

# 8991 — Minimum Viable CD Standard

Every production service must have:

```text
same-digest promotion
environment-specific config/secrets
migration strategy
approval policy
smoke verification
rollback metadata
auditable desired-state change
```

---

# 8992 — Maturity Level 1 — Basic CI

Capabilities:

```text
MR pipeline
compile
unit tests
image build
registry
```

---

# 8993 — Maturity Level 2 — Quality CI

Add:

```text
integration
contract
migration tests
security scans
reports
```

---

# 8994 — Maturity Level 3 — Trusted Supply Chain

Add:

```text
digest-only promotion
SBOM
signing
provenance
policy gates
```

---

# 8995 — Maturity Level 4 — Controlled Delivery

Add:

```text
environment promotion
approvals
migration Jobs
smoke gates
rollback
release metadata
```

---

# 8996 — Maturity Level 5 — GitOps Delivery

PART 33 adds:

```text
Git desired state
Argo CD reconciliation
drift detection
sync policy
progressive GitOps deployment controls
```

---

# 8997 — Anti-Pattern: Build on Developer Laptop

Do not publish production image from a developer workstation.

---

# 8998 — Anti-Pattern: Rebuild in Production

Production must not compile/package source during deployment.

---

# 8999 — Anti-Pattern: Mutable Release Tag

Do not overwrite `v1.8.0` or another production tag with a new digest.

---

# 9000 — Anti-Pattern: latest

Do not use `latest` as deployment identity.

---

# 9001 — Anti-Pattern: Shared Production Password

Do not store a shared human production password in CI variables for general jobs.

---

# 9002 — Anti-Pattern: Pipeline as Root

Do not give all pipeline jobs cluster-admin or cloud-admin because it is convenient.

---

# 9003 — Anti-Pattern: Manual kubectl from Laptop

Normal production deployment is not an engineer running `kubectl apply` from a laptop.

---

# 9004 — Anti-Pattern: Tests Against Shared DEV

CI correctness should not depend on a mutable shared DEV database/service state.

---

# 9005 — Anti-Pattern: Retry Until Green

Do not hide deterministic failure by repeatedly retrying tests/pipeline.

---

# 9006 — Anti-Pattern: Security Scan After Production

Do not discover preventable critical image vulnerabilities only after deployment.

---

# 9007 — Anti-Pattern: Unreviewed Migration

Do not make production schema change an incidental application startup side effect with no release visibility.

---

# 9008 — Anti-Pattern: Automatic Schema Rollback Promise

Do not claim application rollback automatically restores database state.

---

# 9009 — Anti-Pattern: Artifact Without Evidence

Do not promote an image when its source/tests/scans/SBOM cannot be linked reliably.

---

# 9010 — Anti-Pattern: Environment Source Branches

Do not maintain different application source code per DEV/UAT/PROD branch.

---

# 9011 — Anti-Pattern: CI Deploys Anything Green

A green CI pipeline is not sufficient production authorization for high-risk services.

---

# 9012 — Anti-Pattern: Production Secrets in Non-Prod

No lower-environment pipeline should receive production credentials to simplify configuration.

---

# 9013 — Anti-Pattern: One Global Release Token

Do not use one never-expiring token with registry, Git, cloud, Kubernetes, and secret-manager admin access.

---

# 9014 — Anti-Pattern: No Rollback Identity

Never enter a production release without knowing the previous known-good digest/config compatibility.

---

# 9015 — Anti-Pattern: Invisible Deploy

Every production deploy must appear in release/audit and observability timelines.

---

# 9016 — CI/CD Decision Record

Record organization choices for:

```text
runner technology
container builder
registry
SAST/SCA tools
SBOM tool
signing mechanism
versioning
promotion approvals
migration execution
GitOps handoff
```

---

# 9017 — Pipeline Catalog

Maintain a catalog of standard pipeline profiles/templates with owner/version.

---

# 9018 — Release Catalog

Maintain searchable production release history per service.

---

# 9019 — Environment Catalog

Maintain current desired/running release identity by environment.

---

# 9020 — Security Exception Catalog

Maintain active pipeline/release security exceptions with expiry.

---

# 9021 — Migration Catalog

Track deployed Flyway/schema versions per service/environment.

---

# 9022 — Runbook Catalog

At minimum:

```text
pipeline stuck
runner unavailable
test infrastructure
security gate
registry
signing
migration
rollout
smoke failure
rollback
```

---

# 9023 — Standard Release Record Template

Suggested fields:

```text
service
version
commit
MRs/issues
image digest
SBOM
scan status
signature/provenance
migration version
config revision
feature flags
UAT/staging evidence
approvals
deploy time
rollback target
```

---

# 9024 — Standard Promotion Record

Suggested fields:

```text
service
from_environment
to_environment
digest
config_revision
migration_version
actor
approval
time
result
```

---

# 9025 — Standard Rollback Record

Suggested fields:

```text
service
environment
failed_release
target_release
reason
DB compatibility decision
actor/approver
incident
result
```

---

# 9026 — Standard Pipeline Variables

Use a documented minimal set of variables.

Examples:

```text
SERVICE_NAME
APP_VERSION
GIT_SHA
IMAGE_REPOSITORY
IMAGE_DIGEST
RELEASE_ID
TARGET_ENV
```

Do not store secrets in ordinary repository variables.

---

# 9027 — Standard OCI Labels

Image metadata should include useful OCI labels such as source repository, revision, version, created time where supported.

---

# 9028 — Standard Pipeline Outputs

Every release pipeline should output:

```text
test reports
security reports
image digest
SBOM
provenance/signature reference
release manifest
```

---

# 9029 — Standard Production Inputs

Production promotion consumes:

```text
approved release manifest
environment desired-state revision
approval evidence
migration/rollback plan
```

---

# 9030 — Definition of a Trusted Artifact

Trusted artifact means:

```text
built by approved pipeline
source identified
required gates passed
digest immutable
scan evidence present
SBOM present
signature/provenance present when policy requires
```

---

# 9031 — Definition of a Trusted Release

Trusted release means:

```text
trusted artifact
approved config
known migration state
approved promotion
healthy verification
auditable record
```

---

# 9032 — Definition of Continuous Integration

Continuous Integration means small changes are merged frequently with automated evidence that shared mainline remains releasable.

---

# 9033 — Definition of Continuous Delivery

Continuous Delivery means every qualifying mainline change can become a production candidate through an automated, repeatable release process.

---

# 9034 — Continuous Deployment

Automatic production deployment on every qualifying change is optional.

For financial/customer-critical services, human approval may remain appropriate even with highly automated delivery.

---

# 9035 — Final Architecture Flow

Target flow:

```text
Developer
   ↓
Merge Request
   ↓
GitLab CI Quality / Security Gates
   ↓
Merge to Main
   ↓
Trusted Build
   ↓
Immutable OCI Digest
   ├── Test Reports
   ├── SBOM
   ├── Scan Results
   └── Signature / Provenance
   ↓
Release Manifest
   ↓
DEV → QA → UAT → STAGING
   ↓ same digest
Production Approval
   ↓
Git Desired-State Change
   ↓
Argo CD / GitOps (PART 33)
   ↓
Migration + Kubernetes Rollout
   ↓
Smoke / Observability Verification
   ↓
Release Record / Rollback Ready
```

---

# 9036 — PART 32 Deliverables

PART 32 produces:

1. CI/CD purpose and architecture principles.
2. CI vs CD separation.
3. Build-once/promote-same-digest rule.
4. GitLab CI platform standard.
5. Protected branch/tag rules.
6. Merge request quality boundary.
7. CODEOWNERS / approval guidance.
8. Pipeline triggers and stage model.
9. DAG / fail-fast / timeout / retry rules.
10. Runner isolation and least privilege.
11. Dependency/build reproducibility rules.
12. CI variable / OIDC / secret-handling rules.
13. Cache/artifact standards.
14. Unit/domain/application test automation.
15. Testcontainers integration tests.
16. REST/gRPC/Kafka contract gates.
17. Flyway/migration test gates.
18. SAST/SCA/secret/license scanning.
19. Container/IaC/pipeline security scans.
20. Docker/BuildKit automation.
21. Registry/tag/digest standards.
22. SBOM generation.
23. Image signing and provenance.
24. Release evidence bundle.
25. Release manifest standard.
26. Release notes/metadata.
27. DEV/QA/UAT/STAGING/PROD promotion flow.
28. Approval gates.
29. Config/secret/feature-flag release identity.
30. GitOps handoff boundary.
31. Dedicated DB migration Job strategy.
32. Expand/contract migration sequencing.
33. Backfill/large migration guidance.
34. Post-deployment rollout/smoke verification.
35. Observability deployment annotations.
36. Application/config/feature-flag rollback.
37. Database rollback warning.
38. Emergency/hotfix/change-freeze process.
39. Pipeline failure/recovery runbooks.
40. Release audit trail.
41. DORA/pipeline/deployment metrics.
42. Per-service pipeline profiles.
43. Performance/cost optimization.
44. Multi-service/contract-first release guidance.
45. Supply-chain threat model.
46. Review/ephemeral environment guidance.
47. Quality gate levels.
48. GitLab pipeline examples.
49. Definition-of-Done checklists.
50. Production-readiness checklist.
51. Initial implementation order.
52. Maturity model.
53. Anti-patterns.
54. Catalog/templates.
55. Cross-chapter handoff to GitOps / Argo CD.

---

# 9037 — Exit Criteria

PART 32 is complete when the team can answer:

### Source / Merge

```text
Can unreviewed code or pipeline changes reach the protected main branch?
```

### Tests

```text
Which automated evidence proves critical domain, integration, contract, concurrency, and migration behavior before release?
```

### Security

```text
Which scans block a release, and how are exceptions owned and expired?
```

### Artifact

```text
Can we identify one release by immutable image digest and trace it to source commit, tests, SBOM, scan, and provenance?
```

### Promotion

```text
Does the exact same digest move from staging to production without rebuild?
```

### Credentials

```text
Can a normal CI job operate without broad production cluster/cloud credentials?
```

### Migration

```text
How are Flyway/schema changes tested, ordered, rehearsed, and blocked on failure?
```

### Deployment

```text
How does CI hand approved desired state to Git rather than treating direct kubectl as the normal deployment mechanism?
```

### Verification

```text
How do rollout, smoke, and observability checks prove the new release is healthy?
```

### Rollback

```text
Do we know the previous digest/config and database compatibility before every production release?
```

### Audit

```text
Can we reconstruct who changed, reviewed, built, approved, promoted, deployed, and rolled back a production release?
```

If these answers are supported by automated, auditable evidence, the platform has a production-grade CI/CD foundation ready for GitOps.

---

# 9038 — Handoff to PART 33

PART 33 defines GitOps / Argo CD.

```text
PART 32
CI/CD
      ↓
Trusted Artifact + Approved Desired-State Change
      ↓
PART 33
GitOps / Argo CD
```

PART 33 will define:

```text
Git as Deployment Source of Truth
Argo CD Architecture
Application / ApplicationSet
Repository Layout
Environment Overlays
Sync Policy
Automated vs Manual Sync
Sync Waves / Hooks
Health Assessment
Drift Detection
Self-Heal
Prune
RBAC
SSO
Secrets Integration
Multi-Cluster / Multi-Environment
Promotion Through Git
Rollback Through Git
Database Migration Hooks/Jobs
Notifications
Audit
Disaster Recovery
```

The key transition is:

```text
PART 32
= prove, package, sign, record, approve, and request desired-state change

PART 33
= reconcile that approved Git desired state continuously into Kubernetes
```

---

# PART 32 — Summary

CI/CD converts reviewed source changes into trusted, traceable, immutable release artifacts and promotes those artifacts through controlled environments.

The core build flow is:

```text
Source
  ↓
Merge Request
  ↓
Compile + Tests + Contracts + Migrations
  ↓
Security Gates
  ↓
Docker / BuildKit
  ↓
Immutable Image Digest
  ├── SBOM
  ├── Scan Evidence
  └── Signature / Provenance
  ↓
Release Manifest
```

The promotion flow is:

```text
DEV
  ↓
QA
  ↓
UAT
  ↓
STAGING
  ↓ same digest
PRODUCTION
```

The deployment-control flow is:

```text
Approved Release Manifest
  ↓
Git Desired-State Update
  ↓
PART 33 — Argo CD / GitOps
  ↓
Kubernetes Rollout
  ↓
Smoke + Observability Verification
```

The most important architecture rules are:

```text
Protect main and production release refs.
Use merge requests and required pipeline gates.
Build from a clean checkout.
Build once and promote the exact same image digest.
Never use mutable latest as production identity.
Use isolated Testcontainers-based integration tests.
Test API, gRPC, Kafka, and database compatibility before release.
Treat flaky tests as defects.
Scan source, dependencies, secrets, manifests, and final images.
Generate an SBOM for every release image.
Capture signing/provenance for production-grade supply-chain trust.
Use scoped, short-lived CI identities where possible.
Do not expose production credentials to general CI jobs.
Record release identity in a machine-readable manifest.
Promote artifact identity, not source branches.
Use dedicated, observable migration execution where appropriate.
Use expand/contract for rolling database compatibility.
A failed required migration blocks rollout.
Use Git-managed desired state instead of broad direct kubectl deployment.
Run smoke and health checks after rollout.
Publish deployment/migration annotations to observability.
Know the previous known-good digest/config before production deployment.
Do not assume application rollback can undo database migration.
Keep emergency changes reviewed, traceable, and rollback-ready.
Measure delivery performance without weakening safety gates.
PART 32 produces trusted release intent; PART 33 owns continuous GitOps reconciliation.
```

The next chapter defines the deployment source-of-truth and reconciliation model:

```text
PART 33 — GitOps / Argo CD
```

---

**End of PART 32 — CI/CD**
