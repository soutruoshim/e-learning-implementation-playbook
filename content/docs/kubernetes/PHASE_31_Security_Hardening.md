---
title: "PHASE 31 — Security Hardening"
---

# PHASE 31 — Security Hardening

> **Purpose:** Convert the platform security architecture into enforceable, testable, observable production controls across identity, privileges, secrets and keys, software supply chain, CI/CD, container images, Kubernetes, cloud/IaC, network paths, APIs, PostgreSQL, Kafka, Redis, audit/SIEM, vulnerability management, penetration testing, incident response, security exceptions, evidence, and recovery trust.
>
> **Previous Phase:** Phase 30 — Terraform
>
> **Next Phase:** Phase 32 — Backup / Disaster Recovery
>
> **Primary Architecture Basis:** PART 35 — Security Hardening.
>
> **Primary Stack:** Java, Spring Boot, GitLab CI/CD, Docker/OCI, Kubernetes, Argo CD, Terraform, PostgreSQL, Kafka, Redis, OAuth2/OIDC, TLS/mTLS, external secret manager, KMS, OpenTelemetry, Prometheus/Grafana, SIEM/security tooling.
>
> **Status:** Implementation-Ready Production Security Hardening Specification

---

# 1. Phase 31 Implementation Mandate

The governing source principle is:

```text
Secure architecture becomes production security
only when critical controls are enforced,
observable,
reviewed,
and continuously verified.
```

Phase 31 does not redesign the security architecture from PART 06. It turns those decisions into production controls that are mandatory in real environments.

---

# 2. Target Security Posture

The hardened platform should be:

```text
defense-in-depth
least-privilege
deny-by-default
identity-aware
segmented
patchable
traceable
reproducible
resistant to common abuse
recoverable after compromise
```

It must avoid:

```text
implicit trust
shared admin accounts
long-lived static credentials
unsigned / untraceable artifacts
privileged workloads
flat networks
open egress
unpatched critical vulnerabilities
security controls that exist only in documentation
```

---

# 3. Security Control Layers

```text
Identity
  ↓
Authorization
  ↓
Endpoint / Gateway
  ↓
Network
  ↓
Workload
  ↓
Application
  ↓
Data
  ↓
Audit / Detection
  ↓
Incident Response / Recovery Trust
```

Controls overlap deliberately. No single WAF, network boundary, admission policy, or identity mechanism is considered sufficient by itself.

---

# 4. Closed Production Trust Chain

```text
reviewed source
      ↓
trusted CI
      ↓
immutable artifact
      ↓
SAST / SCA / secret / container scan
      ↓
SBOM + provenance
      ↓
trusted signer
      ↓
GitOps immutable digest
      ↓
admission verification
      ↓
hardened Pod
      ↓
least-privilege workload identity
      ↓
segmented network + protected data services
      ↓
central audit / detection
```

---

# 5. Runtime Security Model

```text
Identity
  + Least Privilege
  + Short-Lived Credentials
  + Protected Secrets / Keys
  + Hardened Containers
  + Kubernetes Admission / RBAC
  + Network Segmentation
  + TLS / Edge Protection
  + Hardened PostgreSQL / Kafka / Redis
  + Secure APIs
  + Vulnerability Management
  + Central Audit / Detection
  + Incident Response
```

---

# 6. Source-Recommended Initial Implementation Order

```text
1. Asset/crown-jewel inventory
2. Human MFA + privileged access cleanup
3. Workload identity and ServiceAccount cleanup
4. Secret-manager/rotation baseline
5. Protected source + CI credentials
6. SAST/SCA/secret/container scanning
7. SBOM + immutable digest + provenance
8. Image signing / trusted-registry policy
9. Kubernetes restricted workload baseline
10. Admission policy
11. RBAC hardening
12. Default-deny NetworkPolicy + egress controls
13. PostgreSQL/Kafka/Redis identity/ACL review
14. WAF/rate/API abuse controls
15. Central audit/SIEM detections
16. Vulnerability SLA + exception workflow
17. Penetration/security regression tests
18. Incident runbooks/tabletop exercises
19. Policy/evidence automation
20. Continuous compliance and improvement
```

---

# 7. Minimum Viable Security Hardening

Before production, the source requires at minimum:

```text
privileged MFA
least-privilege human/workload IAM
external secret management
non-root hardened containers
Kubernetes admission baseline
trusted immutable images
SAST/SCA/secret/container scanning
SBOM
network segmentation
TLS
private data stores
DB/Kafka/Redis least privilege
public-edge rate/WAF controls where applicable
central audit
critical vulnerability ownership
security incident response
```

---

# 8. Security Governance Rule

A security requirement must have:

```text
control
scope
enforcement point
owner
evidence
exception process
review cadence
```

A control that exists only as written guidance is not yet a production control.

---

# 9. Detailed Source-Aligned Specification

The following detailed specification preserves PART 35 terminology, organization, examples, security boundaries, anti-patterns, test guidance, definitions of done, production-readiness criteria, evidence requirements, and the handoff to Backup / Disaster Recovery.

---

# 9634 — Purpose

Security Hardening defines how the platform reduces exploitable attack surface before production and keeps that posture controlled over time.

It answers:

```text
Which threats matter most?
Which baseline controls are mandatory?
How are identities, privileges, secrets, and keys hardened?
Which container and Kubernetes settings are enforced rather than recommended?
How are only trusted images allowed to run?
How are network paths minimized?
How are PostgreSQL, Kafka, and Redis protected?
How are public APIs protected from abuse?
How are vulnerabilities found, prioritized, remediated, and excepted?
How are security events audited and investigated?
How is evidence produced that the hardened state is still effective?
```

The core principle is:

```text
Secure architecture becomes production security
only when critical controls are enforced,
observable,
reviewed,
and continuously verified.
```

---

# 9635 — Handoff from PART 34

PART 34 established reproducible infrastructure, IAM foundations, network foundations, KMS, secret-manager foundations, protected Terraform state, and controlled change workflows.

PART 35 now applies security policy to those foundations:

```text
PART 34
secure-capable infrastructure
      ↓
PART 35
hardened identities + workloads + data + network + supply chain
```

Terraform remains the infrastructure lifecycle controller; Argo CD remains the Kubernetes desired-state controller. Security hardening constrains both rather than replacing either.

---

# 9636 — Relationship to PART 06

PART 06 defined the platform security architecture: authentication, authorization, OAuth2/OIDC, service identity, mTLS, secrets, encryption, rate limiting, audit, security testing, Kubernetes security, and incident response.

PART 35 does not redesign those concepts.

It answers the operational question:

```text
How do we make those security decisions mandatory in real production environments?
```

Examples:

```text
PART 06: containers should be non-root
PART 35: admission rejects containers that violate the approved security baseline

PART 06: secrets belong in a secret manager
PART 35: CI, Terraform, GitOps, and workloads are prevented from leaking or bypassing secret controls
```

---

# 9637 — Security Hardening Goals

The hardened platform should be:

```text
defense-in-depth
least-privilege
deny-by-default
identity-aware
segmented
patchable
traceable
reproducible
resistant to common abuse
recoverable after compromise
```

It should avoid:

```text
implicit trust
shared admin accounts
long-lived static credentials
unsigned/untraceable artifacts
privileged workloads
flat networks
open egress
unpatched critical vulnerabilities
security controls that exist only in documentation
```

---

# 9638 — Threat-Led Hardening

Hardening priorities should be based on credible attack paths, not a generic checklist alone.

For each critical capability ask:

```text
What asset is valuable?
Who may attack or misuse it?
What trust boundary can be crossed?
What credential could be stolen?
What network path can be abused?
What data can be modified or exfiltrated?
What control prevents, detects, or contains the attack?
What recovery action is available?
```

---

# 9639 — Threat Model Inputs

Threat modeling should include:

```text
public APIs
mobile/web clients
admin interfaces
CI/CD
source repositories
container registry
Kubernetes control plane
workload identities
service-to-service APIs
Kafka
PostgreSQL
Redis
secret manager
KMS
cloud IAM
partner integrations
webhooks
legacy systems
operator access
backup systems
```

---

# 9640 — Threat Categories

Evaluate at minimum:

```text
credential theft
account takeover
privilege escalation
broken authorization
supply-chain compromise
malicious dependency
container escape
Kubernetes misconfiguration
secret leakage
network lateral movement
SSRF
injection
replay
API abuse
DDoS/resource exhaustion
data exfiltration
financial manipulation
insider misuse
audit tampering
ransomware/destructive action
```

---

# 9641 — Security Control Layers

Use overlapping controls:

```text
Identity
  ↓
Authorization
  ↓
Endpoint / Gateway
  ↓
Network
  ↓
Workload
  ↓
Application
  ↓
Data
  ↓
Audit / Detection
  ↓
Recovery
```

Failure of one layer must not automatically expose the complete platform.

---

# 9642 — Security Baseline Tiers

Define security baselines by risk tier.

Example:

```text
Tier 1
Identity, Payment, Wallet, Ordering, production platform control plane
→ strongest controls

Tier 2
Loyalty, Promotion, Customer, Integration
→ strong standard baseline

Tier 3
lower-risk internal/read-only workloads
→ standard baseline with documented exceptions
```

A lower tier must never mean unrestricted trust.

---

# 9643 — Mandatory vs Recommended Controls

Every security control should be classified as:

```text
MANDATORY
RECOMMENDED
CONDITIONAL
EXCEPTION-ONLY
```

Mandatory controls should be machine-enforced where practical.

Examples of good enforcement points:

```text
GitLab merge rules
CI quality gates
container registry policy
Kubernetes admission
cloud IAM policy
Terraform policy-as-code
network policy
secret-manager access policy
```

---

# 9644 — Security Ownership

Security is shared ownership.

```text
Security Team
→ policy, threat model, risk acceptance, incident coordination

Platform Team
→ Kubernetes/cloud/CI/registry/secret/security baselines

Service Team
→ application authorization, input validation, dependency hygiene, domain abuse controls

SRE/Operations
→ detection, runtime response, patch execution, evidence

Data/DB Owners
→ database access, encryption, audit, backup protection
```

---

# 9645 — Security Asset Inventory

Maintain an inventory of security-relevant assets:

```text
repositories
pipelines
registries
clusters
namespaces
service accounts
cloud identities
KMS keys
secrets
certificates
databases
Kafka clusters/topics
Redis clusters
public domains
partner endpoints
admin applications
backup locations
```

Unknown assets cannot be governed reliably.

---

# 9646 — Security Data Classification

Use the data classification from PART 06/07 to drive control strength.

Typical classes:

```text
Public
Internal
Confidential
Restricted / Highly Sensitive
```

Examples requiring stronger treatment include:

```text
credentials
access/refresh tokens
private keys
payment secrets
customer PII
wallet/payment records
security audit data
production backups
```

---

# 9647 — Crown-Jewel Assets

Explicitly identify crown-jewel assets such as:

```text
production KMS keys
identity signing keys
payment credentials
wallet ledger database
production database admin access
Kubernetes cluster-admin
GitLab protected deployment credentials
container signing identity
backup decryption keys
```

Hardening and monitoring should prioritize compromise paths to these assets.

---

# 9648 — Security Architecture Review Gate

High-risk changes require security review when they introduce or materially change:

```text
public exposure
new authentication flow
privileged capability
new secret/credential type
new data class
payment/wallet behavior
cross-service trust
new partner webhook
file upload
new executable code path
cluster-level Kubernetes permission
new CI runner privilege
new internet egress
```

---

# 9649 — Human Identity Baseline

Human access to source control, cloud, Kubernetes, secret systems, dashboards, and production administration should use centralized identity where possible.

Require:

```text
named personal account
strong authentication
MFA for privileged systems
role-based access
joiner/mover/leaver lifecycle
central disable capability
audit trail
```

Shared human accounts are prohibited except explicitly controlled emergency mechanisms.

---

# 9650 — Privileged MFA

MFA is mandatory for privileged human access including:

```text
GitLab administration
cloud console administration
Kubernetes privileged access
secret manager
KMS administration
production database administration
production observability administration
DNS/certificate administration
```

Phishing-resistant factors should be preferred for the highest privilege where supported.

---

# 9651 — Least Privilege

Grant only the permissions necessary for the task.

Avoid roles that combine unrelated powers such as:

```text
source-code approval
production deployment
secret read
KMS administration
database write
security-log deletion
```

Critical workflows should preserve separation of duties where operationally feasible.

---

# 9652 — Role Design

Define roles from responsibilities rather than convenience.

Example:

```text
Developer
Release Approver
Production Read-Only
Incident Responder
Platform Operator
Database Operator
Security Auditor
Secret Administrator
Break-Glass Administrator
```

Each role must have documented permissions and owner.

---

# 9653 — Access Review

Review privileged access periodically and after organizational changes.

Review:

```text
user
role
reason
last use
scope
manager/owner
expiry where temporary
```

Remove stale access instead of assuming dormant access is harmless.

---

# 9654 — Temporary Privilege

Prefer time-bounded elevation for exceptional production tasks.

Concept:

```text
normal identity
   ↓ request/approval
short-lived privileged role
   ↓
audited task
   ↓ expiry
normal identity
```

Do not create permanent administrator access to solve temporary operational needs.

---

# 9655 — Break-Glass Access

Break-glass access exists only for emergencies where normal identity/control paths are unavailable.

Requirements:

```text
strongly protected credential/mechanism
limited membership
explicit invocation
high-priority alert
audit trail
post-use credential/authorization review
incident or change reference
regular access test
```

---

# 9656 — Service Identity

Every service should have a distinct runtime identity.

Avoid:

```text
one shared cloud role for all services
one shared DB account for all services
one shared Kafka principal for all consumers
```

Distinct identity makes least privilege and attribution possible.

---

# 9657 — Workload Identity

Prefer platform workload identity mechanisms to static cloud access keys.

Pattern:

```text
Kubernetes ServiceAccount
      ↓ federation
Cloud / Platform Identity
      ↓
Specific Resource Permissions
```

Credentials should be short-lived and automatically issued where supported.

---

# 9658 — Service Account Token Hardening

For Kubernetes workloads:

```text
automountServiceAccountToken: false
```

when the workload does not call the Kubernetes API.

When API access is required:

```text
dedicated ServiceAccount
least-privilege Role/ClusterRole
namespace/resource restrictions
short-lived projected token where supported
```

---

# 9659 — Kubernetes RBAC Hardening

Reject patterns such as:

```text
cluster-admin for applications
wildcard verbs/resources without justification
broad Secret read
shared default ServiceAccount
write access to unrelated namespaces
```

ClusterRoleBinding should be rare and reviewed with greater scrutiny than namespace RoleBinding.

---

# 9660 — CI Identity Hardening

CI pipelines should use dedicated machine identity with minimum scope.

Separate identities for:

```text
build/read dependencies
push image
sign image
update GitOps repository
Terraform plan
Terraform apply
production promotion
```

Do not expose a single universal administrator token to all jobs.

---

# 9661 — Credential Lifetime

Prefer:

```text
federated identity
OIDC workload identity
short-lived tokens
dynamic database credentials
short-lived certificates
```

over long-lived static keys.

If static credentials are unavoidable, they require owner, rotation interval, storage policy, monitoring, and revocation procedure.

---

# 9662 — Dormant Identity Control

Detect and disable stale:

```text
human accounts
service accounts
API keys
partner credentials
SSH keys
access tokens
```

A credential with no current owner should be treated as a security defect.

---

# 9663 — Joiner / Mover / Leaver

Access lifecycle must support:

```text
Joiner → minimum required access
Mover  → remove old + add new responsibilities
Leaver → revoke promptly across all critical systems
```

Revocation scope includes source control, cloud, Kubernetes, VPN/private access, databases, secret systems, registries, monitoring, and partner portals where applicable.

---

# 9664 — Secrets Hardening Principle

Secrets must be:

```text
centrally managed
least-privilege
short-lived where possible
rotatable
auditable
never committed to source
never baked into images
never written to logs
```

Environment variables may be acceptable for some runtimes, but the authoritative secret must remain outside source/config repositories.

---

# 9665 — Secret Manager

Production secrets should originate from an approved secret-management system.

It should support:

```text
encryption at rest
access policy
audit
versioning/rotation
availability/recovery
workload authentication
```

Kubernetes Secret objects are delivery/storage primitives, not the organizational source of truth by themselves.

---

# 9666 — External Secret Delivery

Where external-secret integration is used:

```text
Secret Manager
     ↓ authenticated controller/CSI
Kubernetes workload
```

Ensure the controller identity can read only the required secret scope and that namespace/application boundaries are preserved.

---

# 9667 — Secret Scope

Use one secret only where consumers truly share the same trust domain.

Prefer:

```text
payment-service/provider-X credential
notification-service/provider-Y credential
order-service/database credential
```

over a large environment-wide secret containing unrelated values.

---

# 9668 — Secret Naming

Secret names should identify purpose without embedding the secret value.

Example:

```text
prod/payment/provider-a/api-credential
prod/order/postgresql/app-user
prod/identity/jwt-signing-key
```

Avoid names that accidentally disclose sensitive customer or business content.

---

# 9669 — Secret Rotation

Every critical secret should have a tested rotation procedure.

Typical safe rotation:

```text
create new version
→ allow overlap where protocol supports
→ deploy/reload consumers
→ verify use
→ revoke old version
→ confirm no failures
```

Rotation that requires a production outage is a design risk and should be reduced where practical.

---

# 9670 — Emergency Secret Rotation

Compromise procedure must allow immediate:

```text
revoke
replace
redeploy/reload
verify
investigate
```

Do not wait for the normal scheduled rotation window after suspected compromise.

---

# 9671 — KMS Key Separation

Use separate key scope where risk justifies it.

Examples:

```text
Terraform state encryption
production database encryption
backup encryption
application field encryption
signing keys
```

Do not use one broadly accessible encryption key for unrelated security domains.

---

# 9672 — Signing Key Protection

Private signing keys for identity tokens, artifact signing, or partner signatures require stronger protection than ordinary configuration secrets.

Prefer:

```text
KMS/HSM-backed key where appropriate
non-exportable key capability
restricted signing permission
audit of sign operation
rotation/versioning
```

---

# 9673 — Certificate Lifecycle

Certificates must have:

```text
issuer
owner
purpose
SAN/identity scope
validity period
renewal automation
expiry monitoring
revocation/replacement procedure
```

Manual certificate expiry should not be a normal production failure mode.

---

# 9674 — Secret Scanning

Scan for secrets in:

```text
commits
merge requests
CI logs
container layers
published packages
Terraform plans/artifacts where applicable
```

A detected real secret should trigger rotation, not merely deletion from the latest source revision.

---

# 9675 — Secret Redaction

Application and platform logging must redact:

```text
passwords
tokens
Authorization headers
cookies/private session IDs
private keys
payment secrets
secret-manager payloads
```

Redaction belongs in shared logging/filtering standards as well as developer review.

---

# 9676 — Software Supply Chain Model

The software supply chain is:

```text
Developer
  ↓
Source Repository
  ↓
CI Runner
  ↓
Dependencies / Build Tools
  ↓
Build Artifact
  ↓
Container Image
  ↓
Registry
  ↓
Signature / Provenance
  ↓
GitOps Desired State
  ↓
Kubernetes Admission
  ↓
Running Workload
```

Every step can become an attack path and requires identity, integrity, and audit controls.

---

# 9677 — Protected Source Branches

Production-bound code should use protected branches and merge-request workflow.

Controls should include:

```text
review requirement
status checks
restricted direct push
protected tags/releases
CODEOWNERS where useful
signed commits/tags where policy requires
```

Emergency bypasses must remain auditable.

---

# 9678 — Review Separation

For critical services, the same person should not silently create, approve, and deploy a risky change without another control.

Use a practical combination of:

```text
peer review
protected environment approval
security approval for sensitive areas
pipeline policy
audit
```

---

# 9679 — Dependency Pinning

Pin or lock dependencies sufficiently to make builds reproducible and reviewable.

Do not rely on uncontrolled mutable versions such as:

```text
latest
unbounded version ranges
floating CI includes
```

where compromise or unexpected upgrades could alter production artifacts.

---

# 9680 — Dependency Source Trust

Use approved package repositories/mirrors where appropriate.

Protect against:

```text
dependency confusion
typosquatting
malicious package takeover
unexpected transitive dependency
```

Internal package namespaces should not be claimable from public registries accidentally.

---

# 9681 — Build Runner Isolation

CI runners for untrusted branch/MR workloads should be isolated from production credentials and privileged infrastructure.

Avoid giving generic build jobs access to:

```text
production Kubernetes API
production Terraform apply identity
production secrets
registry delete/admin
cloud administrator role
```

---

# 9682 — Privileged CI

Privileged CI runners create elevated risk.

If privileged Docker-in-Docker or equivalent is required:

```text
isolate runner
restrict project use
ephemeralize where possible
monitor usage
avoid production credential co-location
```

Prefer safer rootless or daemonless build mechanisms where practical.

---

# 9683 — SAST Gate

Static application security testing should run on production-bound changes.

Gate policy should distinguish:

```text
new critical/high exploitable finding
known accepted risk
false positive with justification
informational finding
```

Security gates should be risk-based rather than blocking on every low-confidence warning.

---

# 9684 — Software Composition Analysis

SCA should inspect application dependencies for known vulnerabilities and licensing/policy concerns where required.

Record:

```text
package
version
severity
reachability/exploitability where available
fixed version
owner
exception expiry
```

---

# 9685 — Container Scan

Scan release images for:

```text
OS packages
runtime/JRE
application libraries where supported
known CVEs
misconfiguration where supported
```

Scan both at build time and continuously after publication because vulnerability knowledge changes after release.

---

# 9686 — SBOM Requirement

Every production release image should have an SBOM.

Preferred standard formats:

```text
CycloneDX
SPDX
```

The SBOM should be tied to the immutable image digest and retained with release evidence.

---

# 9687 — Artifact Provenance

Release evidence should identify:

```text
source repository
commit SHA
pipeline/job
builder identity
build time
base image
image digest
SBOM
scan result
signature/attestation
```

The purpose is to answer: exactly what code and build process produced the running artifact?

---

# 9688 — Image Signing

Production images should support cryptographic signing or equivalent trusted registry attestation.

Signing identity should be protected separately from ordinary build credentials.

Prefer pipeline/workload identity-backed signing where supported over long-lived private keys stored as generic CI variables.

---

# 9689 — Signature Verification

A signature is useful only if deployment verifies it.

Desired flow:

```text
CI builds image
→ scan + SBOM
→ sign/attest immutable digest
→ registry
→ GitOps references digest
→ admission verifies trust policy
→ Pod allowed
```

---

# 9690 — Trusted Registry Policy

Production admission should restrict images to approved registries/repositories.

Reject or tightly control:

```text
public arbitrary registries
mutable latest tags
untrusted personal images
unsigned images where signing is mandatory
```

---

# 9691 — Base Image Governance

Maintain an approved set of base images with:

```text
known source
supported runtime
minimal packages
patch lifecycle
version/digest pinning
rebuild automation
```

Services should not independently select random base images from the internet.

---

# 9692 — Rebuild for Security Fix

A vulnerability in the runtime/base image may require rebuilding even when application code is unchanged.

Example:

```text
application 1.8.0
base-image security update
→ image 1.8.0-r2
```

The new digest must pass the same release trust controls.

---

# 9693 — Registry Hardening

Registry controls should include:

```text
authentication
least-privilege push/pull/delete
immutable release tags or digest use
retention
malware/CVE scanning where available
audit logs
encryption/TLS
backup/recovery according to criticality
```

---

# 9694 — Artifact Retention

Retain enough release artifacts to support:

```text
rollback
forensics
incident response
vulnerability analysis
compliance evidence
```

Do not purge the only copy of a production image/SBOM immediately after deployment.

---

# 9695 — Container Hardening Baseline

Every production application container should normally be:

```text
non-root
non-privileged
minimal
immutable
read-only-root-filesystem capable
without unnecessary Linux capabilities
without host namespaces/mounts
without embedded secrets
resource-bounded
```

---

# 9696 — Run as Non-Root

Containers must not depend on UID 0 for normal operation.

Kubernetes security context should enforce non-root execution where possible.

Application directories, temporary paths, and certificates must be prepared during image build so startup does not require root privilege.

---

# 9697 — Fixed Runtime UID

Prefer a dedicated runtime UID/GID or platform-compatible non-root identity.

Avoid assumptions that:

```text
any UID may write anywhere
root owns mutable application paths
```

File ownership should be explicit and minimal.

---

# 9698 — Privilege Escalation

Production containers should set:

```text
allowPrivilegeEscalation: false
```

unless an exceptional workload has a reviewed technical requirement.

---

# 9699 — Linux Capabilities

Drop Linux capabilities by default.

Preferred baseline:

```text
capabilities:
  drop:
    - ALL
```

Add back only the exact capability required by a reviewed workload.

---

# 9700 — Privileged Containers

Privileged containers are prohibited for normal application services.

Any exception requires:

```text
security review
explicit owner
isolated purpose
restricted namespace/node placement where appropriate
monitoring
expiry/revalidation
```

---

# 9701 — Read-Only Root Filesystem

Use:

```text
readOnlyRootFilesystem: true
```

where application compatibility allows.

Writable paths should be explicit, such as:

```text
/tmp
specific cache/work directory
```

mounted using ephemeral volumes when suitable.

---

# 9702 — Ephemeral Writable Storage

When writable filesystem is required, use narrowly scoped volumes.

Do not use local container filesystem for authoritative:

```text
orders
wallet state
payment files
customer data
security audit history
```

---

# 9703 — Seccomp

Use a restrictive seccomp profile such as the runtime default for normal workloads.

Unconfined seccomp should require explicit exception and evidence that the workload cannot operate under the platform baseline.

---

# 9704 — AppArmor / SELinux

Where the platform supports additional Linux mandatory access control, adopt a standard profile for higher-risk workloads.

The control should be centrally manageable and tested; it should not be enabled blindly if the team cannot diagnose failures.

---

# 9705 — Host Namespace Restrictions

Normal application Pods must not use:

```text
hostPID
hostIPC
hostNetwork
```

unless a reviewed platform component requires it.

Host namespace access significantly increases the impact of container compromise.

---

# 9706 — HostPath Restriction

Application workloads should not mount arbitrary host paths.

HostPath can expose:

```text
node filesystem
container runtime sockets
credentials
system configuration
```

Use managed storage abstractions instead.

---

# 9707 — Container Runtime Socket

Do not mount Docker/containerd runtime sockets into application containers.

Runtime socket access can effectively become node-level control.

---

# 9708 — Image Shell and Package Tools

Production images should exclude unnecessary:

```text
package managers
compilers
curl/wget when not required
SSH daemon
debuggers
shell tools
```

Balance minimalism with operational needs; debugging should use approved ephemeral/debug mechanisms rather than permanently bloating every runtime image.

---

# 9709 — Container Resource Limits

Security hardening includes resource abuse containment.

Configure:

```text
CPU request
memory request
memory limit
HPA/capacity rules
```

and test JVM headroom.

Resource controls reduce accidental or malicious noisy-neighbor impact but must not be tuned so tightly that they create self-inflicted denial of service.

---

# 9710 — Kubernetes Security Baseline

Production Kubernetes should enforce a default security posture rather than relying on every service author to remember all settings.

Baseline controls include:

```text
namespace isolation
RBAC
Pod security/admission
trusted images
NetworkPolicy
resource policies
secret controls
restricted host access
audit
```

---

# 9711 — Pod Security Standard

For normal application namespaces, use a restricted-style Pod security baseline or equivalent organization policy.

Workloads requiring broader permissions should run in deliberately separated namespaces with explicit exceptions.

---

# 9712 — Admission Control

Admission policy should reject known-dangerous configurations before they run.

Examples:

```text
privileged=true
runAsNonRoot missing/false where mandatory
allowPrivilegeEscalation=true
hostPath
hostNetwork/hostPID
untrusted registry
mutable prohibited tag
missing resource controls
forbidden capability
```

---

# 9713 — Admission Technology

Possible enforcement mechanisms include:

```text
Kubernetes built-in admission/policy capabilities
Kyverno
OPA Gatekeeper
cloud-native policy service
```

Choose one primary organizational policy approach to avoid conflicting rule engines.

---

# 9714 — Policy as Code

Admission and infrastructure security policies should be version-controlled and tested.

A policy change is a production change and requires:

```text
review
validation against existing workloads
rollout plan
observability
rollback/recovery path
```

---

# 9715 — Audit Before Enforce

For major new admission rules:

```text
observe/audit
→ identify violations
→ remediate
→ enforce
```

may be safer than immediately blocking all workloads, especially on existing clusters.

Critical newly built production namespaces can start in enforce mode from day one.

---

# 9716 — Namespace Security Classes

Classify namespaces, for example:

```text
application-restricted
platform-controlled
security-tools
system
exception-isolated
```

Do not allow a privileged platform exception to weaken every application namespace.

---

# 9717 — Default Namespace

Do not deploy production application workloads into Kubernetes `default` namespace.

Dedicated namespaces make ownership, RBAC, quotas, policy, network isolation, and audit easier to reason about.

---

# 9718 — Cluster-Admin

Human and machine membership in `cluster-admin` must be extremely limited.

Routine deployment, observability, debugging, and database operations should not require full cluster administration.

---

# 9719 — Kubernetes Secrets Access

Remember that Kubernetes API read access to Secret objects can disclose credentials.

Restrict:

```text
get/list/watch secrets
```

to workloads/operators that explicitly need it.

Broad namespace read-only roles should be reviewed so they do not unintentionally include Secret access.

---

# 9720 — Etcd Protection

Kubernetes control-plane data must be protected through the cluster/provider security model.

Requirements include:

```text
encryption at rest where supported/configured
restricted control-plane access
secure backups
TLS
administrative audit
```

Self-managed clusters require explicit etcd hardening ownership.

---

# 9721 — Kubernetes API Exposure

Restrict Kubernetes API network exposure where feasible.

Prefer:

```text
private endpoint
approved management networks/VPN
identity-aware access
MFA for human administration
```

over broadly public administrative access.

---

# 9722 — Kubernetes Audit Logs

Capture security-relevant Kubernetes API events, especially:

```text
RBAC changes
Secret access where available
ServiceAccount changes
admission overrides
exec/attach
port-forward
Deployment changes
NetworkPolicy changes
```

Route critical events to centralized retention/SIEM according to policy.

---

# 9723 — Exec / Attach Control

Production `exec` and `attach` should be restricted and auditable.

Prefer observability and purpose-built admin/repair Jobs over ad-hoc shell changes.

Emergency shell access must not become the normal repair workflow.

---

# 9724 — Ephemeral Debug Containers

If ephemeral containers are allowed for production diagnostics:

```text
restrict who may create them
use approved debug images
avoid unnecessary privilege
record ticket/incident context
monitor usage
```

---

# 9725 — Node Hardening

Node security should include:

```text
supported OS/runtime
patch process
minimal installed packages
restricted SSH/admin access
hardened metadata service access
endpoint/runtime monitoring where adopted
no application secrets on disk beyond required mounts
```

Managed Kubernetes may shift some responsibilities to the provider but does not remove them all.

---

# 9726 — Node Pool Separation

Use separate node pools when security or operational risk justifies isolation.

Examples:

```text
system/platform workloads
high-trust workloads
internet-facing special workloads
batch/spot workloads
GPU/special hardware
```

Node separation complements, but does not replace, RBAC and network policy.

---

# 9727 — Network Hardening Principle

Network location is not identity.

Use:

```text
default-deny where practical
explicit allowed paths
service identity
encryption in transit
egress control
edge protection
observability
```

A Pod being inside the cluster must not automatically grant trust.

---

# 9728 — Default-Deny NetworkPolicy

Application namespaces should move toward default-deny ingress and egress policy.

Then explicitly allow:

```text
required service-to-service traffic
DNS
approved database endpoints
Kafka/Redis
telemetry
approved external partners
```

---

# 9729 — East-West Allow List

Maintain an architecture-level communication matrix.

Example:

```text
Order → Inventory
Order → Payment
Order → Promotion
Notification → provider egress
```

Network policy should align with real service contracts, not permit arbitrary namespace-wide connectivity.

---

# 9730 — Egress Control

Restrict outbound traffic from sensitive services.

Benefits:

```text
reduces data-exfiltration paths
limits SSRF impact
prevents unexpected provider calls
improves attribution
```

Production partner egress may use stable NAT/egress IP and allow lists where required.

---

# 9731 — Metadata Service Protection

Cloud instance metadata endpoints can expose credentials if SSRF or Pod escape reaches them.

Use platform mechanisms such as:

```text
workload identity
metadata hardening
network restrictions
modern metadata protocol modes
```

to prevent generic workload credential theft.

---

# 9732 — Internal TLS

Use TLS for service-to-service traffic according to the security architecture.

Do not disable certificate verification to fix environment problems.

Certificate/CA trust should be distributed through controlled mechanisms.

---

# 9733 — mTLS

mTLS may provide strong transport identity for selected east-west paths.

Remember:

```text
mTLS proves workload/transport identity
≠
business authorization
```

Services still enforce resource ownership, scopes, roles, and domain permissions.

---

# 9734 — TLS Version / Cipher Policy

Maintain an organization-approved TLS baseline for public and internal endpoints.

The baseline should be reviewed over time as protocols and cryptographic recommendations evolve.

Disable legacy protocols/ciphers no longer required by supported clients.

---

# 9735 — Certificate Validation

Never make production clients use patterns equivalent to:

```text
trust all certificates
skip hostname verification
verify=false
```

Temporary non-production diagnostics must not leak into production configuration.

---

# 9736 — WAF

Use WAF controls for public HTTP surfaces where appropriate.

WAF is a supplementary edge defense for:

```text
known malicious patterns
protocol anomalies
basic bot/abuse filtering
virtual patching in emergencies
```

It does not replace application authorization or input validation.

---

# 9737 — DDoS Protection

Public production endpoints should use available provider/platform DDoS protections appropriate to risk.

Capacity planning should include:

```text
edge limits
gateway limits
application limits
downstream dependency capacity
```

Rate limiting at only one layer may be insufficient.

---

# 9738 — DNS Security

Protect production DNS changes with:

```text
least privilege
MFA for privileged human access
change audit
IaC where appropriate
safe TTL/cutover process
monitoring
```

DNS compromise can redirect otherwise secure traffic.

---

# 9739 — API Security Baseline

Every public/internal API should enforce:

```text
authentication where required
authorization
input validation
request size limits
timeouts
rate/abuse limits
safe error handling
TLS
structured audit for sensitive actions
```

---

# 9740 — Authentication Failure Behavior

Authentication errors should not reveal unnecessary detail such as:

```text
whether an account exists
which credential component was correct
internal identity-provider details
```

Return stable client-facing errors while preserving detailed internal security telemetry.

---

# 9741 — Authorization at Resource Boundary

Do not rely only on gateway role checks.

The service that owns a resource must verify access to that resource.

Example:

```text
customer A token
must not retrieve
customer B order
```

even if both tokens are otherwise valid.

---

# 9742 — Broken Object-Level Authorization

Treat object-level authorization as a first-class test area for APIs exposing identifiers.

Test:

```text
change user_id
change order_id
change wallet_id
change reward_id
change admin-owned resource ID
```

and confirm access remains correctly constrained.

---

# 9743 — Mass Assignment

Bind only fields the caller is allowed to control.

Do not deserialize arbitrary client JSON directly into privileged persistence/domain objects containing fields such as:

```text
role
status
balance
owner_id
approval_state
is_admin
```

---

# 9744 — Input Validation

Validate input by:

```text
type
length
range
format
enumeration
business invariant
```

Reject unexpected structure early.

Validation is not a substitute for parameterized queries or output encoding.

---

# 9745 — SQL Injection

Use parameterized SQL/ORM binding.

Never concatenate untrusted input into SQL identifiers or clauses without strict allow-listing.

Dynamic sort/filter fields should map from known API values to known SQL fragments.

---

# 9746 — SSRF

Services that fetch remote URLs must use strong SSRF controls.

Prefer:

```text
allow-listed partner endpoints
fixed base URLs
validated scheme/host/port
restricted egress
DNS/IP revalidation where required
```

Do not allow user input to become an arbitrary backend HTTP target.

---

# 9747 — File Upload

If file upload exists:

```text
validate size/type
rename server-side
store outside executable path
malware-scan where risk requires
avoid trusting extension or Content-Type alone
isolate processing
limit decompression/archive expansion
```

---

# 9748 — Deserialization

Avoid unsafe polymorphic/native deserialization of untrusted data.

Use explicit schemas and DTOs for:

```text
REST
Kafka
webhooks
stored messages
```

Do not enable dangerous type resolution merely for developer convenience.

---

# 9749 — Error Handling

Client responses must not expose:

```text
stack traces
SQL statements
internal file paths
secret values
private hostnames when unnecessary
library versions unnecessarily
```

Correlate a safe error identifier with internal logs/traces.

---

# 9750 — Request Size Limits

Set bounded request/body/header sizes at gateway and application layers.

This reduces:

```text
memory exhaustion
parser abuse
accidental oversized payloads
```

Large legitimate uploads require a deliberately designed path.

---

# 9751 — Timeout Hardening

Unbounded network timeouts are both reliability and security risks.

Every external/internal call should have bounded:

```text
connect timeout
request/read timeout
overall deadline
```

Retry policy must not amplify attacks or outages.

---

# 9752 — Rate Limiting

Apply rate limits according to abuse model, potentially by:

```text
IP
account
user
client/application
device
endpoint
tenant
```

Sensitive flows such as login, password reset, OTP, coupon redemption, and expensive search need purpose-specific limits.

---

# 9753 — Replay Protection

For signed webhooks or security-sensitive commands, use combinations of:

```text
timestamp
nonce/event ID
idempotency key
signature
expiration window
processed-event record
```

Reject stale/replayed requests safely.

---

# 9754 — Webhook Verification

Inbound partner webhooks should verify:

```text
transport security
partner identity/signature
payload integrity
timestamp/replay policy
schema
idempotency
```

Do not trust a webhook simply because it reaches a secret URL.

---

# 9755 — Admin API Hardening

Admin APIs require stronger controls than ordinary customer reads.

Use:

```text
strong MFA/SSO upstream
fine-grained permissions
private/restricted exposure where practical
sensitive action audit
step-up/approval for high-risk actions where justified
rate limits
```

---

# 9756 — Database Security Principle

Each service database should be reachable only by authorized workloads/operators and only with the permissions required for that service.

Database access is not a substitute for service APIs across bounded contexts.

---

# 9757 — Database User per Service

Use distinct application database identities.

Example:

```text
order_app → order_db
payment_app → payment_db
wallet_app → wallet_db
```

Avoid one shared superuser across all services.

---

# 9758 — Database Least Privilege

Application accounts should not normally own broad administrative permissions such as:

```text
create superuser
manage replication
read every database
modify system configuration
```

Grant only required schema/table/function rights.

---

# 9759 — Migration Identity

Where database migrations require stronger DDL permission, separate the migration identity from the normal runtime application identity.

Pattern:

```text
migration Job → DDL-capable limited identity
application Pod → runtime DML identity
```

---

# 9760 — Database Network Exposure

Production databases should not be publicly reachable unless a specific architecture requires it.

Prefer private connectivity and restricted source identities/networks.

---

# 9761 — Database TLS

Use encrypted database connections and certificate verification according to environment/security policy.

Do not silently downgrade to plaintext in production because internal networking is assumed trusted.

---

# 9762 — Database Encryption at Rest

Enable platform/database storage encryption for production data.

For fields requiring stronger separation, use application/field-level encryption only with a clear key-management and query/operational model.

---

# 9763 — Database Audit

Capture security-relevant events such as:

```text
administrative login
role/permission change
schema change
failed privileged authentication
backup/restore operation
high-risk manual data repair
```

Do not enable unlimited statement logging that leaks sensitive values without considering privacy and volume.

---

# 9764 — Production DB Human Access

Avoid general developer write access to production databases.

Preferred options:

```text
read-only audited access
approved repair Job
controlled DBA operation
time-bounded elevation
```

Direct ad-hoc writes bypass domain invariants and are both security and correctness risks.

---

# 9765 — Database Credential Rotation

Database credentials should support rotation without prolonged downtime.

Where the platform supports dynamic identity/authentication, prefer it over long-lived passwords.

---

# 9766 — Sensitive Query Data

Avoid exposing confidential data in:

```text
query logs
slow-query logs
APM SQL parameters
error messages
admin exports
```

Telemetry must preserve diagnostic value without becoming a second uncontrolled sensitive-data store.

---

# 9767 — Kafka Security Principle

Kafka is shared Tier-1 infrastructure and must not be treated as an internal trusted bus where every producer/consumer can access every topic.

---

# 9768 — Kafka Authentication

Every producer, consumer, connector, and administrative client should authenticate using the approved Kafka security mechanism.

Avoid anonymous production access.

---

# 9769 — Kafka TLS

Use encrypted Kafka client/broker communication for production according to the platform deployment model.

Certificate or SASL credential lifecycle must be owned and rotatable.

---

# 9770 — Kafka ACLs

Grant topic/group permissions by service identity.

Example:

```text
order-service
→ WRITE order.* events it owns
→ READ required command/reply topics

loyalty-service
→ READ order-completed consumer group
→ WRITE loyalty.* events
```

Avoid wildcard access for ordinary services.

---

# 9771 — Kafka Admin Separation

Topic creation/configuration and cluster administration should use separate privileged identities from normal application producers/consumers.

---

# 9772 — Kafka Sensitive Payloads

Do not put secrets, access tokens, private keys, or unnecessary PII into Kafka events.

Event durability and replay increase the exposure lifetime of data placed on the bus.

---

# 9773 — Kafka Schema Governance

Schema governance is also a security control because unexpected fields can leak sensitive data or bypass consumer assumptions.

Review event schema changes for:

```text
PII
credential-like fields
authorization context
payload size
backward compatibility
```

---

# 9774 — Kafka DLQ Security

DLQ payloads can contain the same sensitive data as original events.

Apply:

```text
ACLs
retention
redaction policy
restricted operational access
```

to retry/DLQ topics.

---

# 9775 — Redis Security Principle

Redis may contain session, rate-limit, cache, or temporary security-relevant state and must be treated as protected infrastructure.

---

# 9776 — Redis Network Isolation

Redis should be private and reachable only from approved workloads/networks.

Never expose production Redis directly to the public internet.

---

# 9777 — Redis Authentication / ACL

Use Redis authentication/ACL capabilities supported by the deployment.

Separate service access where practical rather than sharing one global administrator credential.

---

# 9778 — Redis TLS

Use TLS for Redis communication when supported/required by the production architecture.

Do not disable verification in application clients.

---

# 9779 — Redis Command Restriction

Where supported and useful, restrict dangerous administrative commands from application identities.

Applications generally do not need cluster/configuration administration privileges.

---

# 9780 — Redis Sensitive Data

Do not use Redis casually for plaintext highly sensitive data simply because it is temporary.

Data classification, TTL, encryption/transport, access, and recovery semantics must still be considered.

---

# 9781 — Redis Failure Security

Failing open may be unsafe for some Redis-backed controls.

Examples:

```text
rate limit unavailable
revocation cache unavailable
security challenge state unavailable
```

Each control must define whether failure should be open, closed, degraded, or backed by durable state.

---

# 9782 — Cloud Account / Project Isolation

Production should use strong isolation from non-production through separate account/project/subscription or equivalent boundaries where practical.

This limits credential and configuration blast radius.

---

# 9783 — Cloud IAM Hardening

Cloud IAM should avoid:

```text
permanent owner/admin for routine users
wildcard resource permissions
shared access keys
unused service principals
```

Prefer federated human identity and workload identity.

---

# 9784 — Terraform Apply Identity

Terraform production apply identity requires only the permissions needed by the infrastructure roots it manages.

Avoid one global cloud administrator identity across unrelated roots if permissions can be safely separated.

---

# 9785 — Terraform State Security

Terraform state can contain sensitive infrastructure metadata and sometimes secret values.

Protect with:

```text
remote encrypted backend
strict read/write IAM
locking
version recovery
audit
no casual artifact exposure
```

---

# 9786 — IaC Security Scanning

Scan Terraform/Kubernetes configuration for critical misconfigurations such as:

```text
public data stores
open security groups
unencrypted storage
public Kubernetes API
wildcard IAM
privileged workloads
missing logging
```

Use scan results as review input and policy gates according to risk.

---

# 9787 — Destructive Action Protection

Critical infrastructure should use appropriate controls against accidental or malicious deletion.

Examples:

```text
delete protection
prevent-destroy lifecycle where suitable
MFA/approval
backup prerequisites
separate privileged role
```

---

# 9788 — Security Group / Firewall Review

Network rules should be explicit and minimal.

Reject broad production rules such as:

```text
0.0.0.0/0 → database port
entire VPC → administrative port
all egress without documented reason for sensitive systems
```

---

# 9789 — Object Storage Hardening

Object storage containing exports, reports, artifacts, logs, or backups should use:

```text
private default
least-privilege IAM
encryption
versioning/retention where required
public-access blocks
access logging where useful
lifecycle policy
```

---

# 9790 — Backup Security Boundary

Backups are valuable attack targets.

PART 36 defines full backup/DR architecture, but PART 35 requires:

```text
restricted write/delete access
encryption
separate recovery authorization where practical
monitoring of destructive operations
```

---

# 9791 — Security Observability

Security-relevant telemetry should allow responders to answer:

```text
who did what?
from where?
to which resource?
when?
was it allowed or denied?
what changed?
what credential/identity was involved?
what release/configuration was active?
```

---

# 9792 — Audit Event Standard

Sensitive audit events should include, where appropriate:

```text
timestamp
actor/subject
actor type
source
resource
action
result
reason/error
correlation/trace ID
service/environment
before/after summary for configuration changes
```

---

# 9793 — Audit Integrity

Applications/operators should not be able to silently alter historical security audit records.

Use centralized collection, restricted deletion, retention controls, and immutable/append-oriented storage where the risk requires it.

---

# 9794 — Security Log Access

Security/audit logs may contain sensitive metadata.

Restrict access to operational/security roles and avoid exposing them to every developer by default.

---

# 9795 — SIEM Integration

Route selected high-value security events into the organization security monitoring/SIEM workflow.

Examples:

```text
privileged login
break-glass use
RBAC change
secret access anomaly
KMS policy change
failed MFA spike
WAF abuse pattern
container policy violation
image-signature failure
production DB admin action
```

---

# 9796 — Detection Engineering

A log is not a detection.

For important attack paths define:

```text
signal
detection logic
threshold/correlation
severity
owner
response action
false-positive review
```

---

# 9797 — Security Alert Severity

Classify security alerts by likely impact and required response.

Example:

```text
SEV-1: confirmed/suspected active production compromise
SEV-2: high-confidence attempt or privileged control failure
SEV-3: suspicious condition requiring investigation
SEV-4: hygiene/compliance issue
```

Align with the organization's broader incident model.

---

# 9798 — Authentication Monitoring

Monitor:

```text
failed login rate
MFA failures
password-reset abuse
refresh-token anomalies
account lockouts
unexpected geo/network patterns where policy allows
privileged login
```

Do not rely on one raw threshold for all customers/environments.

---

# 9799 — Authorization Monitoring

Track unusual or repeated denied actions, especially for:

```text
admin endpoints
cross-customer resource access
secret access
Kubernetes API
cloud IAM
DB administration
```

---

# 9800 — Network Security Monitoring

Useful signals include:

```text
WAF blocks
rate-limit blocks
unexpected egress
NetworkPolicy denials where observable
TLS failures
DNS anomalies
partner connection anomalies
```

---

# 9801 — Supply Chain Monitoring

Alert on events such as:

```text
protected branch bypass
unexpected runner registration
new privileged CI runner
release image overwritten
signature verification failure
registry admin change
critical new CVE on deployed image
```

---

# 9802 — Security Dashboard

Maintain focused dashboards rather than one enormous security wall.

Possible views:

```text
identity/authentication
edge/WAF/abuse
Kubernetes policy violations
vulnerability posture
secret/certificate expiry
privileged activity
security incidents/exceptions
```

---

# 9803 — Vulnerability Management Lifecycle

Use a defined lifecycle:

```text
discover
→ triage
→ prioritize
→ assign owner
→ remediate/mitigate
→ verify
→ close
→ monitor recurrence
```

Scanner output alone is not vulnerability management.

---

# 9804 — Risk-Based Prioritization

Prioritize using more than CVSS/severity alone.

Consider:

```text
internet exposure
exploit availability
reachability
privilege gained
data sensitivity
service criticality
existing compensating controls
active exploitation intelligence
```

---

# 9805 — Critical Vulnerability SLA

Define organization remediation targets for critical/high findings.

The exact SLA is policy-specific, but it should be explicit, measurable, and shorter for actively exploited internet-facing risks.

---

# 9806 — Vulnerability Exception

An exception requires:

```text
finding
risk explanation
business/technical reason
compensating controls
owner
approver
expiry date
review date
```

No permanent `ignore` without ownership.

---

# 9807 — False Positive

Suppress a scanner finding only with evidence.

Retain the justification so the same issue does not repeatedly consume review effort or disappear without traceability.

---

# 9808 — Patch Management

Patch strategy covers:

```text
OS/node images
container base images
JDK/runtime
application dependencies
Kubernetes/add-ons
PostgreSQL/Kafka/Redis versions
security agents/controllers
```

Patching must be tested through lower environments and rollout/rollback procedures.

---

# 9809 — Emergency Patch

For an actively exploited critical vulnerability, the platform must support accelerated:

```text
patch/rebuild
scan
sign
staging/smoke validation
approval
production rollout
verification
```

without bypassing artifact identity and audit.

---

# 9810 — Unsupported Software

Production must not remain indefinitely on unsupported/EOL:

```text
JDK
OS
Kubernetes
PostgreSQL
Kafka
Redis
security tooling
```

Track support dates as operational risk.

---

# 9811 — Penetration Testing

Perform penetration testing for high-risk production systems before major launch and periodically according to risk/policy.

Scope should include relevant:

```text
public APIs
admin surfaces
auth flows
business authorization
cloud/Kubernetes exposure
partner webhook paths
```

---

# 9812 — DAST

Dynamic security scanning can validate deployed HTTP behavior in controlled environments.

Do not direct aggressive DAST unintentionally at production.

Use authenticated test accounts where required to reach meaningful application paths.

---

# 9813 — API Security Testing

Security tests should explicitly cover:

```text
broken object authorization
broken function authorization
authentication bypass
rate-limit abuse
mass assignment
injection
SSRF
replay
schema abuse
oversized payloads
```

---

# 9814 — Business Logic Abuse Testing

Generic scanners cannot prove business security.

Test abuse cases such as:

```text
duplicate coupon redemption
double wallet spend
reward self-assignment
order ownership bypass
payment callback replay
mission/reward farming
privileged status manipulation
```

---

# 9815 — Fuzz / Property Security Testing

Use fuzzing/property approaches where valuable for:

```text
parsers
webhook payloads
serialization
money/quantity boundaries
state transitions
security token parsing
```

The goal is to discover malformed-input and invariant failures not covered by example tests.

---

# 9816 — Security Incident Response

Security hardening must include response capability for when preventive controls fail.

Core phases:

```text
Detect
Triage
Contain
Eradicate
Recover
Learn
```

---

# 9817 — Security Incident Ownership

Define before an incident:

```text
incident commander
security lead
platform lead
service owner
communications owner
legal/compliance escalation where required
```

Do not invent the command structure during an active compromise.

---

# 9818 — Credential Compromise Runbook

Runbook should cover:

```text
identify credential scope
revoke/disable
rotate related credentials
inspect use/audit trail
contain affected workloads
validate replacement
monitor for continued abuse
```

---

# 9819 — Signing Key Compromise

If a signing key is compromised:

```text
revoke/distrust key
stop affected signing path
identify artifacts/tokens signed by key
rotate trust configuration
reissue/rebuild where required
investigate origin
```

The exact response depends on whether the key signs JWTs, images, or partner messages.

---

# 9820 — Kubernetes Compromise Runbook

Potential actions:

```text
isolate namespace/workload
revoke ServiceAccount/cloud identity
block network path
capture relevant forensic evidence
replace compromised Pod/node
rotate exposed secrets
review RBAC/admission/audit history
redeploy from trusted artifacts
```

---

# 9821 — Container Image Compromise

If an image is malicious or tampered:

```text
block digest/signing identity
identify all environments running it
roll back/promote trusted digest
preserve evidence
rotate exposed credentials
investigate source/build/registry chain
```

---

# 9822 — Database Compromise

Response may include:

```text
revoke DB credentials
restrict network access
preserve database/audit evidence
identify unauthorized reads/writes
restore/reconcile only with verified need
rotate dependent secrets
```

PART 36 defines restore mechanics; incident response decides when recovery is appropriate.

---

# 9823 — Ransomware / Destructive Attack

Security and DR must be designed together.

Controls should prevent a single compromised identity from easily deleting:

```text
production data
backups
KMS keys
Terraform state
Git history
container artifacts
```

---

# 9824 — Forensic Preservation

During a serious security incident preserve relevant evidence before destructive cleanup when feasible.

Examples:

```text
audit logs
cloud logs
Kubernetes events
CI logs
image digest/SBOM
runtime metadata
network/security logs
DB audit
```

Follow organizational/legal requirements for evidence handling.

---

# 9825 — Recovery Trust

Do not restore a compromised environment from unverified artifacts.

Recovery must establish a trusted chain:

```text
trusted source
trusted builder
trusted image
trusted configuration
rotated credentials
verified infrastructure
```

---

# 9826 — Post-Incident Hardening

Every material incident should ask:

```text
Which preventive control failed?
Which detection was missing or slow?
Which privilege was too broad?
Which recovery step was unclear?
Which test/policy/runbook must change?
```

Improvements should become code/policy/test/runbook changes where possible.

---

# 9827 — Security Exception Process

A security exception is a temporary, explicit risk decision—not a hidden configuration deviation.

Record:

```text
control
scope
reason
risk
compensating controls
owner
approver
start
expiry
remediation plan
```

---

# 9828 — Exception Expiry

Every exception should expire or require periodic reapproval.

Expired exception:

```text
→ remediate
or
→ formally re-evaluate and approve again
```

Do not let temporary production bypasses become permanent through neglect.

---

# 9829 — Compensating Control

When a primary control cannot be implemented, choose a control that reduces the same attack path.

Example:

```text
legacy service cannot support mTLS yet
→ private network + strict allow list + service credential + monitoring + migration deadline
```

---

# 9830 — Security Debt

Track security debt like production reliability debt.

Fields:

```text
issue
risk
owner
priority
target date
exception link
blocking dependency
```

---

# 9831 — Security Policy Versioning

Security baselines should be versioned so teams can tell:

```text
which policy applied when
what changed
which workloads are compliant
which migration is required
```

---

# 9832 — Security Control Evidence

Prefer evidence generated automatically from the real system.

Examples:

```text
CI scan reports
SBOM/signature
admission policy results
RBAC exports
Terraform plans/policy results
Kubernetes audit
secret rotation record
vulnerability dashboard
penetration-test report
```

---

# 9833 — Evidence Retention

Retain security evidence according to legal, contractual, audit, and operational requirements.

Do not retain sensitive raw logs longer than needed merely because storage is inexpensive.

---

# 9834 — Security Metrics

Useful security program metrics include:

```text
critical/high vulnerabilities by age
mean remediation time
percentage signed production images
percentage workloads passing baseline policy
stale privileged accounts
secret/certificate age
security exception count/age
phishing-resistant MFA coverage where measured
incident detection/containment time
```

---

# 9835 — Avoid Vanity Metrics

Metrics such as:

```text
number of scans
number of alerts
number of policies
```

are not automatically evidence of security improvement.

Prefer metrics connected to risk reduction and response capability.

---

# 9836 — Identity Service Hardening

Identity Service receives the strongest application security profile.

Additional focus:

```text
credential storage
password reset/OTP abuse
signing keys
refresh token lifecycle
MFA/admin flows
session revocation
authentication telemetry
account enumeration
```

---

# 9837 — Payment Service Hardening

Payment hardening emphasizes:

```text
provider credential protection
callback authenticity/replay
amount/currency integrity
idempotency
unknown outcome handling
refund authorization
restricted operator access
sensitive-data minimization
```

---

# 9838 — Wallet Service Hardening

Wallet hardening emphasizes:

```text
ledger integrity
transaction authorization
double-spend prevention
idempotency
concurrency
privileged adjustment audit
DB access restriction
reconciliation alerts
```

---

# 9839 — Ordering Service Hardening

Ordering hardening emphasizes:

```text
customer/order ownership
price/promotion snapshot integrity
checkout abuse limits
Saga command authenticity
idempotency
admin status-change audit
```

---

# 9840 — Promotion / Coupon Hardening

Promotion hardening emphasizes:

```text
coupon enumeration resistance
usage-limit concurrency
assignment ownership
redemption idempotency
admin campaign permission
abuse/farming monitoring
```

---

# 9841 — Loyalty / Mission Hardening

Loyalty/Mission hardening emphasizes:

```text
points/reward integrity
event replay protection
duplicate progress prevention
reward assignment authorization
admin configuration audit
anti-farming/abuse controls
```

---

# 9842 — Notification Service Hardening

Notification hardening emphasizes:

```text
provider credential isolation
template authorization
recipient privacy
link/content safety
rate limits
broadcast approval
suppression/preference integrity
```

---

# 9843 — Integration / ACL Hardening

Integration Service faces untrusted external systems and requires:

```text
strict protocol/schema validation
partner-specific credentials
signature verification
replay protection
egress allow lists
mapping validation
provider timeout/retry controls
payload redaction
```

---

# 9844 — Security Test Pyramid

Security verification should exist at multiple levels:

```text
Unit/domain abuse tests
Static analysis
Dependency analysis
IaC/policy tests
Container scan
Integration security tests
DAST
Kubernetes admission tests
Penetration testing
Failure/incident exercises
```

---

# 9845 — Admission Policy Tests

CI should prove policy rejects known-bad manifests such as:

```text
privileged Pod
root container
hostPath
missing required resources
untrusted registry
prohibited mutable tag
forbidden capability
```

---

# 9846 — RBAC Tests

Test both allowed and denied Kubernetes actions.

Example:

```text
order ServiceAccount may read own ConfigMap
order ServiceAccount may not list Secrets
order ServiceAccount may not modify Deployment
order ServiceAccount may not access payment namespace resources
```

---

# 9847 — NetworkPolicy Tests

Verify expected connectivity and expected denial.

Example:

```text
Order → Payment: allowed
Order → Order DB: allowed
Catalog → Wallet DB: denied
random namespace → Redis: denied
```

---

# 9848 — Image Trust Test

Test that:

```text
approved signed image → admitted
unsigned/untrusted image → rejected
wrong registry → rejected
revoked signer → rejected
```

---

# 9849 — Secret Leakage Test

Automated checks should confirm secrets are absent from:

```text
repository history under test scope
container layers
CI artifact bundle
application logs from security test
error responses
```

---

# 9850 — TLS Tests

Validate:

```text
certificate chain
hostname verification
expiry monitoring
protocol baseline
client trust
mTLS where required
```

Include negative tests so invalid certificates are rejected.

---

# 9851 — Security Chaos

Controlled exercises may simulate:

```text
revoked credential
expired certificate
secret rotation
blocked egress
WAF/rate-limit spike
invalid image signature
removed RBAC permission
```

The goal is to confirm secure failure and operational response.

---

# 9852 — Security Regression

A fixed vulnerability or incident root cause should gain a regression test or policy check where practical.

This prevents the same control gap from reappearing quietly.

---

# 9853 — Minimum Production Workload Security Standard

Every production application workload must have:

```text
approved immutable image digest
trusted registry
non-root runtime
allowPrivilegeEscalation=false
capabilities dropped by default
seccomp baseline
no privileged mode
no hostPath/host namespaces without exception
external secret delivery
least-privilege ServiceAccount
resource controls
NetworkPolicy
central logs/metrics/traces
```

---

# 9854 — Minimum Production Service Security Standard

Every production service must also provide:

```text
authentication/authorization as required
TLS
input validation
safe error handling
bounded timeouts
abuse/rate controls where needed
sensitive-log redaction
audit for privileged actions
security tests
owned vulnerabilities/exceptions
```

---

# 9855 — Minimum CI/CD Security Standard

Every production-bound pipeline requires:

```text
protected source workflow
trusted runner
unit/integration/contract tests
SAST/SCA/secret scan
container scan
SBOM
immutable image digest
release provenance
signature/attestation where mandated
protected promotion
no long-lived broad production credentials
```

---

# 9856 — Minimum Data Service Security Standard

PostgreSQL/Kafka/Redis production services require:

```text
private/restricted network
strong authentication
TLS according to policy
least-privilege application identities
encryption at rest where supported/required
administrative audit
patch lifecycle
backup/recovery protection
```

---

# 9857 — Security Definition of Done — Application

- [ ] Threats reviewed for material change.
- [ ] Authentication/authorization behavior tested.
- [ ] Sensitive input/output identified.
- [ ] Input validation implemented.
- [ ] Abuse/rate model defined where required.
- [ ] Secrets absent from code/logs.
- [ ] Dependencies scanned.
- [ ] Security-critical paths have tests.
- [ ] Audit events exist for privileged actions.
- [ ] No unresolved unapproved critical findings.

---

# 9858 — Security Definition of Done — Container

- [ ] Approved minimal base.
- [ ] Version/digest pinned.
- [ ] Non-root.
- [ ] No embedded secrets.
- [ ] No unnecessary tooling.
- [ ] Read-only root FS capable where required.
- [ ] Capabilities minimal.
- [ ] Container scan complete.
- [ ] SBOM generated.
- [ ] Digest/signature/provenance recorded.

---

# 9859 — Security Definition of Done — Kubernetes

- [ ] Dedicated namespace/ServiceAccount.
- [ ] Least-privilege RBAC.
- [ ] Pod security baseline passes.
- [ ] No privileged/host access without exception.
- [ ] NetworkPolicy present.
- [ ] External secrets integrated.
- [ ] Trusted image policy passes.
- [ ] Resource controls present.
- [ ] Audit/observability available.
- [ ] Admission tests pass.

---

# 9860 — Security Definition of Done — Infrastructure

- [ ] Terraform-managed/reviewed.
- [ ] IAM least privilege.
- [ ] Private data-plane exposure where appropriate.
- [ ] Encryption configured.
- [ ] Logging/audit enabled.
- [ ] Destructive protections reviewed.
- [ ] Security scan/policy checks pass.
- [ ] No unowned public endpoint.
- [ ] Backup security prerequisites defined.

---

# 9861 — Security Review Checklist — Identity

- [ ] Named identities.
- [ ] MFA for privileged humans.
- [ ] Workload identities distinct.
- [ ] No unnecessary static credentials.
- [ ] Temporary privilege preferred.
- [ ] Break-glass controlled.
- [ ] Leaver revocation defined.
- [ ] Privileged access reviewed.

---

# 9862 — Security Review Checklist — Secrets

- [ ] Approved secret manager.
- [ ] Least-privilege read.
- [ ] No Git/image exposure.
- [ ] No log exposure.
- [ ] Rotation procedure.
- [ ] Emergency rotation procedure.
- [ ] Owner assigned.
- [ ] Key/certificate expiry monitored.

---

# 9863 — Security Review Checklist — Supply Chain

- [ ] Protected branches/tags.
- [ ] Runner isolation.
- [ ] Dependencies locked/pinned.
- [ ] Secret/SAST/SCA scans.
- [ ] Container scan.
- [ ] SBOM.
- [ ] Provenance.
- [ ] Image signing policy.
- [ ] Trusted registry.
- [ ] Admission verification.

---

# 9864 — Security Review Checklist — Network

- [ ] Public endpoints intentional.
- [ ] WAF/rate controls reviewed.
- [ ] TLS verification enabled.
- [ ] East-west path documented.
- [ ] Default-deny policy where applicable.
- [ ] Egress restricted for sensitive services.
- [ ] Partner endpoints allow-listed where suitable.
- [ ] DNS change protected.

---

# 9865 — Security Review Checklist — Data

- [ ] Data classification known.
- [ ] Service-owned identity.
- [ ] Least-privilege DB/Kafka/Redis access.
- [ ] Private network path.
- [ ] TLS/encryption policy.
- [ ] Sensitive data absent from telemetry.
- [ ] Administrative audit.
- [ ] Backup security ownership.

---

# 9866 — Security Review Checklist — Detection

- [ ] Critical audit events defined.
- [ ] Central collection.
- [ ] SIEM/detection rules for high-risk actions.
- [ ] Alert owner.
- [ ] Runbook.
- [ ] Retention policy.
- [ ] Clock synchronization.
- [ ] Deployment/config context correlated.

---

# 9867 — Production Security Readiness Checklist

Before production launch:

- [ ] Threat model reviewed.
- [ ] Crown-jewel assets identified.
- [ ] Privileged access uses MFA and least privilege.
- [ ] Break-glass tested.
- [ ] Workload identities configured.
- [ ] Secrets and key rotation tested.
- [ ] CI/CD security gates active.
- [ ] Release SBOM/provenance/signing policy active.
- [ ] Admission policies enforce workload baseline.
- [ ] NetworkPolicies and egress model validated.
- [ ] Public edge WAF/rate/TLS controls validated.
- [ ] PostgreSQL/Kafka/Redis access reviewed.
- [ ] Audit/SIEM paths working.
- [ ] Critical vulnerability process operating.
- [ ] Penetration/security tests completed as required.
- [ ] Security incident runbooks exercised.
- [ ] No expired exceptions.
- [ ] Backup protection prerequisites handed to PART 36.

---

# 9868 — Security Anti-Patterns

Reject:

```text
security by private network alone
shared production admin accounts
cluster-admin application ServiceAccount
root/privileged containers by default
host Docker socket mounts
secrets in Git or image layers
TLS verification disabled
wildcard DB/Kafka/Redis access
public production database/Redis
unsigned/untraceable release artifacts where trust policy requires signing
permanent vulnerability ignores
WAF used as substitute for authorization
manual production fixes with no audit
```

---

# 9869 — Initial Implementation Order

Recommended hardening order:

```text
1. Asset/crown-jewel inventory
2. Human MFA + privileged access cleanup
3. Workload identity and ServiceAccount cleanup
4. Secret-manager/rotation baseline
5. Protected source + CI credentials
6. SAST/SCA/secret/container scanning
7. SBOM + immutable digest + provenance
8. Image signing / trusted-registry policy
9. Kubernetes restricted workload baseline
10. Admission policy
11. RBAC hardening
12. Default-deny NetworkPolicy + egress controls
13. PostgreSQL/Kafka/Redis identity/ACL review
14. WAF/rate/API abuse controls
15. Central audit/SIEM detections
16. Vulnerability SLA + exception workflow
17. Penetration/security regression tests
18. Incident runbooks/tabletop exercises
19. Policy/evidence automation
20. Continuous compliance and improvement
```

---

# 9870 — Minimum Viable Security Hardening

Before the platform can be considered production-capable, implement at minimum:

```text
privileged MFA
least-privilege human/workload IAM
external secret management
non-root hardened containers
Kubernetes admission baseline
trusted immutable images
SAST/SCA/secret/container scanning
SBOM
network segmentation
TLS
private data stores
DB/Kafka/Redis least privilege
public-edge rate/WAF controls where applicable
central audit
critical vulnerability ownership
security incident response
```

---

# 9871 — Maturity Stage 1 — Baseline

Stage 1 focuses on stopping high-probability mistakes:

```text
MFA
protected branches
secret management
non-root
RBAC
NetworkPolicy
scanning
private databases
TLS
central logs
```

---

# 9872 — Maturity Stage 2 — Enforcement

Stage 2 turns standards into guardrails:

```text
admission policy
policy as code
trusted registry
signature verification
CI policy gates
workload identity
controlled egress
vulnerability SLAs
```

---

# 9873 — Maturity Stage 3 — Detection and Response

Stage 3 strengthens:

```text
SIEM
behavioral detections
privileged activity monitoring
security runbooks
forensic readiness
incident exercises
security metrics
```

---

# 9874 — Maturity Stage 4 — Advanced Assurance

Stage 4 may add where justified:

```text
phishing-resistant privileged auth
HSM-backed critical keys
advanced runtime detection
continuous attack-surface management
red-team exercises
stronger provenance/attestation policy
automated temporary privilege
continuous control validation
```

---

# 9875 — Security Hardening and Availability

Security controls must be designed so they do not create unnecessary availability failures.

Examples:

```text
secret rotation supports overlap
certificate renewal is automated
admission policy rollout uses audit before enforce when needed
rate limits are capacity-tested
SIEM outage does not stop customer transactions
```

Secure failure semantics must be explicit for security-critical dependencies.

---

# 9876 — Security Hardening and Performance

Measure the performance cost of:

```text
TLS/mTLS
WAF
JWT verification
admission controllers
security logging
network proxies
rate limiting
field encryption
```

Do not disable security controls because of unmeasured performance assumptions; tune or redesign based on evidence.

---

# 9877 — Security Hardening and Developer Experience

A secure platform should provide paved-road defaults so developers do not manually assemble every control.

Examples:

```text
standard Dockerfile
standard Spring Security config
standard service Helm/Kustomize template
standard ServiceAccount/RBAC
standard NetworkPolicy
standard logging redaction
standard CI security jobs
```

---

# 9878 — Security Hardening and GitOps

GitOps should carry reviewable security desired state such as:

```text
RBAC
NetworkPolicy
securityContext
resource policies
admission-compatible workload configuration
```

Direct production changes that bypass GitOps must be exceptional and reconciled afterward.

---

# 9879 — Security Hardening and Terraform

Terraform should enforce security-capable infrastructure foundations:

```text
private networks
IAM
KMS
encryption
logging
security groups
managed-service configuration
backup protections
```

Security policy checks should run against plans before apply where feasible.

---

# 9880 — Security Hardening and Observability

PART 31 telemetry should include security context without leaking secrets.

Correlate:

```text
security event
service
version
trace/correlation
identity
recent deployment
recent config/secret change
```

so responders can connect suspicious behavior to platform changes.

---

# 9881 — Security Hardening and CI/CD

PART 32 is responsible for producing trusted release evidence.

PART 35 defines which evidence becomes a security requirement:

```text
security scan results
SBOM
image digest
signature/provenance
approval record
policy checks
```

---

# 9882 — Security Hardening and GitOps Admission

The release pipeline and runtime should form a closed trust chain:

```text
reviewed source
→ trusted CI
→ immutable artifact
→ SBOM/scan
→ signature
→ GitOps digest
→ admission verification
→ hardened Pod
```

---

# 9883 — Security Hardening and PART 36

Security controls must preserve recoverability.

Examples handed to PART 36:

```text
backup encryption
backup IAM
immutable/protected backup copies
KMS/key recovery dependency
restore authorization
ransomware resistance
backup audit
secret/key recovery procedure
```

---

# 9884 — Security Catalog

Maintain a security control catalog containing:

```text
control ID
control name
purpose
scope
enforcement point
owner
evidence
exception process
review frequency
```

This converts scattered security requirements into an operable platform standard.

---

# 9885 — Example Control Catalog

Example:

| Control | Requirement | Enforcement | Evidence |
|---|---|---|---|
| SEC-CON-001 | Application containers run non-root | Admission policy | Policy result / manifest |
| SEC-IMG-001 | Production images use approved registry | Admission policy | Admission/audit |
| SEC-IAM-001 | Privileged human access requires MFA | Identity platform | Access report |
| SEC-SEC-001 | Production secrets come from approved manager | Platform policy/review | Secret inventory |
| SEC-NET-001 | App namespaces use restricted network policy | GitOps/admission | Rendered manifests |
| SEC-VUL-001 | Critical vulnerabilities have owner/decision | Security workflow | Vulnerability record |

---

# 9886 — Security Exception Catalog

Maintain one view of active exceptions so reviewers can answer:

```text
What control is bypassed?
Where?
Why?
Who accepted the risk?
What compensating control exists?
When does it expire?
```

---

# 9887 — Security Release Evidence Bundle

For high-risk production releases, retain an evidence bundle including:

```text
commit
MR/approvals
test result
SAST/SCA/secret scan
container scan
SBOM
image digest
signature/provenance
GitOps revision
migration version
security exception references
```

---

# 9888 — Security Runbook Set

Required runbooks should include at least:

```text
credential compromise
secret leak
signing-key compromise
certificate expiry/compromise
malicious/untrusted image
Kubernetes workload compromise
unexpected privileged access
public endpoint abuse/DDoS
DB credential compromise
Kafka credential compromise
critical CVE emergency patch
security logging/SIEM outage
```

---

# 9889 — Security Tabletop Exercises

Run periodic tabletop scenarios such as:

```text
CI token leaked
production secret committed
wallet DB credential stolen
malicious dependency shipped
Kubernetes ServiceAccount escalated
image signing identity compromised
ransomware attempts backup deletion
```

Measure decision quality, role clarity, credential rotation speed, and recovery dependencies.

---

# 9890 — Security Governance Review

Security/platform governance should periodically review:

```text
baseline policy
exceptions
vulnerability age
privileged access
runtime violations
incident lessons
new platform features
new threat intelligence
end-of-life technology
```

---

# 9891 — PART 35 Deliverables

PART 35 produces:

1. Security hardening purpose and relationship to PART 06.
2. Threat-led hardening model.
3. Security control layers and baseline tiers.
4. Security ownership and asset inventory.
5. Human identity/MFA/privileged access standards.
6. Service/workload identity standards.
7. Secret and key hardening.
8. Credential/certificate rotation rules.
9. Software supply-chain model.
10. Source/CI runner hardening.
11. SAST/SCA/secret/container scanning.
12. SBOM/provenance/image-signing model.
13. Registry/base-image governance.
14. Container runtime hardening.
15. Kubernetes Pod/admission/RBAC hardening.
16. Cluster/API/audit hardening.
17. Network segmentation and egress controls.
18. TLS/mTLS/WAF/DDoS controls.
19. API/application hardening.
20. PostgreSQL hardening.
21. Kafka hardening.
22. Redis hardening.
23. Cloud/IaC hardening.
24. Audit/SIEM/detection engineering.
25. Vulnerability/patch management.
26. DAST/penetration/business-abuse testing.
27. Security incident response.
28. Security exceptions and evidence.
29. Service-specific security profiles.
30. Security definitions of done and review checklists.
31. Production security readiness checklist.
32. Hardening maturity stages.
33. Control/exception catalogs.
34. Security runbook/tabletop standards.
35. Handoff requirements for Backup / Disaster Recovery.

---

# 9892 — Exit Criteria

PART 35 is complete when the team can answer:

### Identity

```text
Can any human or workload reach production with more privilege than it actually needs?
```

### Secrets

```text
Can every critical secret/key be rotated quickly without searching source code or individual laptops?
```

### Supply Chain

```text
Can we prove which reviewed source, pipeline, dependencies, SBOM, signer, and image digest produced every production workload?
```

### Containers / Kubernetes

```text
Will the cluster reject a privileged, root, untrusted, or otherwise prohibited application workload before it runs?
```

### Network

```text
Can a compromised service reach only the services, data stores, and external endpoints it is allowed to reach?
```

### Data

```text
Do PostgreSQL, Kafka, and Redis use private access, strong identity, least privilege, encryption, and audit appropriate to risk?
```

### APIs

```text
Are authentication, authorization, abuse, replay, injection, SSRF, and business-logic attack paths tested?
```

### Vulnerabilities

```text
Does every critical finding have a timely remediation, mitigation, or explicit expiring risk decision?
```

### Detection

```text
Can we detect and investigate privileged access, credential abuse, policy bypass, and suspicious production changes?
```

### Incident Response

```text
Can we contain a compromised credential/workload and rebuild trust without improvising the entire procedure?
```

### Recovery

```text
Are backup and recovery assets protected from the same identities and attack paths that could compromise production?
```

If these answers are supported by enforced controls, repeatable tests, auditable evidence, and practiced response procedures, the platform has a production-grade security-hardening baseline.

---

# 9893 — Handoff to PART 36

PART 36 defines Backup / Disaster Recovery.

```text
PART 35
Security Hardening
      ↓
Protected Production + Protected Recovery Assets
      ↓
PART 36
Backup / Disaster Recovery
```

PART 36 will define:

```text
Backup Strategy
RPO / RTO
PostgreSQL Backup / PITR
Kafka Recovery
Redis Recovery
Object Storage Protection
Kubernetes / GitOps Recovery
Terraform State Recovery
Secret / KMS Recovery
Immutable / Isolated Backups
Cross-Region Recovery
Restore Testing
Disaster Scenarios
Failover / Failback
Recovery Runbooks
Recovery Ownership
Recovery Evidence
```

The key transition is:

```text
PART 35
= prevent, contain, detect, and respond to compromise

PART 36
= preserve and restore business capability when systems or data are lost, corrupted, or unavailable
```

---

# PART 35 — Summary

Security Hardening converts security architecture into enforceable production controls.

The trust chain is:

```text
Reviewed Source
      ↓
Trusted CI
      ↓
Scanned / SBOM / Provenanced Artifact
      ↓
Signed Immutable Image
      ↓
Trusted Registry
      ↓
GitOps Desired State
      ↓
Admission Policy
      ↓
Hardened Kubernetes Workload
      ↓
Least-Privilege Network / Identity / Data Access
      ↓
Audit + Detection + Response
```

The core runtime model is:

```text
Identity
  + Least Privilege
  + Short-Lived Credentials
  + Protected Secrets / Keys
  + Hardened Containers
  + Kubernetes Admission / RBAC
  + Network Segmentation
  + TLS / Edge Protection
  + Hardened PostgreSQL / Kafka / Redis
  + Secure APIs
  + Vulnerability Management
  + Central Audit / Detection
  + Incident Response
```

The most important architecture rules are:

```text
Security architecture must become enforceable policy.
Deny by default and grant least privilege.
Human privileged access requires strong authentication and audit.
Workloads use distinct identities rather than shared static credentials.
Secrets belong in approved secret management and must be rotatable.
Critical signing/encryption keys require stronger protection and lifecycle control.
Production images are immutable, scanned, traceable, and trusted.
SBOM/provenance/signature evidence is tied to image digest.
Application containers run non-root and non-privileged by default.
Drop unnecessary Linux capabilities and use seccomp/runtime restrictions.
Kubernetes admission rejects prohibited workload configurations.
Application ServiceAccounts never receive broad cluster-admin by default.
Namespaces use explicit RBAC and network isolation.
Network location is not identity.
East-west and egress paths are explicitly controlled.
TLS verification is never disabled in production.
WAF/rate limits supplement—not replace—application security.
Services enforce resource-level authorization even behind the gateway.
PostgreSQL, Kafka, and Redis use private connectivity and least-privilege identities.
Sensitive values do not belong in logs, Kafka events, or uncontrolled caches.
Security telemetry is centralized, protected, and actionable.
Vulnerability risk is owned, time-bounded, and measurable.
Security exceptions have owners, compensating controls, approvals, and expiry.
Incident response can revoke credentials, contain workloads, and rebuild trusted state.
Backups and recovery assets must be protected from destructive production compromise.
```

The next chapter defines how the hardened platform preserves and restores business capability after data loss, corruption, regional failure, or destructive attack:

```text
PART 36 — BACKUP / DISASTER RECOVERY
```

---

**End of PART 35 — Security Hardening**

---

# 10. Implementation Work Breakdown

Source-derived implementation tickets:

```text
SEC-001 Prioritize and complete Asset/crown-jewel inventory
SEC-002 Prioritize and complete Human MFA + privileged access cleanup
SEC-003 Prioritize and complete Workload identity and ServiceAccount cleanup
SEC-004 Prioritize and complete Secret-manager/rotation baseline
SEC-005 Prioritize and complete Protected source + CI credentials
SEC-006 Prioritize and complete SAST/SCA/secret/container scanning
SEC-007 Prioritize and complete SBOM + immutable digest + provenance
SEC-008 Prioritize and complete Image signing / trusted-registry policy
SEC-009 Prioritize and complete Kubernetes restricted workload baseline
SEC-010 Prioritize and complete Admission policy
SEC-011 Prioritize and complete RBAC hardening
SEC-012 Prioritize and complete Default-deny NetworkPolicy + egress controls
SEC-013 Prioritize and complete PostgreSQL/Kafka/Redis identity/ACL review
SEC-014 Prioritize and complete WAF/rate/API abuse controls
SEC-015 Prioritize and complete Central audit/SIEM detections
SEC-016 Prioritize and complete Vulnerability SLA + exception workflow
SEC-017 Prioritize and complete Penetration/security regression tests
SEC-018 Prioritize and complete Incident runbooks/tabletop exercises
SEC-019 Prioritize and complete Policy/evidence automation
SEC-020 Prioritize and complete Continuous compliance and improvement
SEC-021 Define, approve, and enforce Security Hardening Goals
SEC-022 Define, approve, and enforce Threat-Led Hardening
SEC-023 Define, approve, and enforce Threat Model Inputs
SEC-024 Define, approve, and enforce Threat Categories
SEC-025 Implement and verify Security Control Layers
SEC-026 Define, approve, and enforce Security Baseline Tiers
SEC-027 Implement and verify Mandatory vs Recommended Controls
SEC-028 Define, approve, and enforce Security Ownership
SEC-029 Define, approve, and enforce Security Asset Inventory
SEC-030 Define, approve, and enforce Security Data Classification
SEC-031 Implement and verify Crown-Jewel Assets
SEC-032 Implement and verify Security Architecture Review Gate
SEC-033 Define, approve, and enforce Human Identity Baseline
SEC-034 Implement and verify Privileged MFA
SEC-035 Implement and verify Least Privilege
SEC-036 Implement and verify Role Design
SEC-037 Implement, harden, and verify Access Review
SEC-038 Implement and verify Temporary Privilege
SEC-039 Implement, harden, and verify Break-Glass Access
SEC-040 Implement, harden, and verify Service Identity
SEC-041 Implement, harden, and verify Workload Identity
SEC-042 Implement and verify Service Account Token Hardening
SEC-043 Implement, harden, and verify Kubernetes RBAC Hardening
SEC-044 Implement, harden, and verify CI Identity Hardening
SEC-045 Implement and verify Credential Lifetime
SEC-046 Implement, harden, and verify Dormant Identity Control
SEC-047 Implement and verify Joiner / Mover / Leaver
SEC-048 Define, approve, and enforce Secrets Hardening Principle
SEC-049 Implement, harden, and verify Secret Manager
SEC-050 Implement, harden, and verify External Secret Delivery
SEC-051 Implement, harden, and verify Secret Scope
SEC-052 Implement, harden, and verify Secret Naming
SEC-053 Implement, harden, and verify Secret Rotation
SEC-054 Implement, harden, and verify Emergency Secret Rotation
SEC-055 Implement, harden, and verify KMS Key Separation
SEC-056 Implement, harden, and verify Signing Key Protection
SEC-057 Implement and verify Certificate Lifecycle
SEC-058 Implement, harden, and verify Secret Scanning
SEC-059 Implement, harden, and verify Secret Redaction
SEC-060 Define, approve, and enforce Software Supply Chain Model
SEC-061 Implement and verify Protected Source Branches
SEC-062 Implement and verify Review Separation
SEC-063 Implement and verify Dependency Pinning
SEC-064 Implement and verify Dependency Source Trust
SEC-065 Implement and verify Build Runner Isolation
SEC-066 Implement and verify Privileged CI
SEC-067 Implement and verify SAST Gate
SEC-068 Implement and verify Software Composition Analysis
SEC-069 Implement, harden, and verify Container Scan
SEC-070 Implement and verify SBOM Requirement
SEC-071 Implement and verify Artifact Provenance
SEC-072 Implement, harden, and verify Image Signing
SEC-073 Implement and verify Signature Verification
SEC-074 Define, approve, and enforce Trusted Registry Policy
SEC-075 Define, approve, and enforce Base Image Governance
SEC-076 Implement and verify Rebuild for Security Fix
SEC-077 Implement, harden, and verify Registry Hardening
SEC-078 Implement and verify Artifact Retention
SEC-079 Define, approve, and enforce Container Hardening Baseline
SEC-080 Implement and verify Run as Non-Root
SEC-081 Implement and verify Fixed Runtime UID
SEC-082 Implement and verify Privilege Escalation
SEC-083 Implement and verify Linux Capabilities
SEC-084 Implement, harden, and verify Privileged Containers
SEC-085 Implement and verify Read-Only Root Filesystem
SEC-086 Implement, harden, and verify Ephemeral Writable Storage
SEC-087 Implement and verify Seccomp
SEC-088 Implement and verify AppArmor / SELinux
SEC-089 Implement and verify Host Namespace Restrictions
SEC-090 Implement and verify HostPath Restriction
SEC-091 Implement, harden, and verify Container Runtime Socket
SEC-092 Implement, harden, and verify Image Shell and Package Tools
SEC-093 Implement, harden, and verify Container Resource Limits
SEC-094 Define, approve, and enforce Kubernetes Security Baseline
SEC-095 Define, approve, and enforce Pod Security Standard
SEC-096 Implement, harden, and verify Admission Control
SEC-097 Implement, harden, and verify Admission Technology
SEC-098 Define, approve, and enforce Policy as Code
SEC-099 Implement, harden, and verify Audit Before Enforce
SEC-100 Implement and verify Namespace Security Classes
SEC-101 Implement and verify Default Namespace
SEC-102 Implement and verify Cluster-Admin
SEC-103 Implement, harden, and verify Kubernetes Secrets Access
SEC-104 Implement and verify Etcd Protection
SEC-105 Implement and verify Kubernetes API Exposure
SEC-106 Implement, harden, and verify Kubernetes Audit Logs
SEC-107 Implement and verify Exec / Attach Control
SEC-108 Implement, harden, and verify Ephemeral Debug Containers
SEC-109 Implement and verify Node Hardening
SEC-110 Implement and verify Node Pool Separation
SEC-111 Define, approve, and enforce Network Hardening Principle
SEC-112 Define, approve, and enforce Default-Deny NetworkPolicy
SEC-113 Implement and verify East-West Allow List
SEC-114 Implement and verify Egress Control
SEC-115 Implement and verify Metadata Service Protection
SEC-116 Implement, harden, and verify Internal TLS
SEC-117 Implement, harden, and verify mTLS
SEC-118 Define, approve, and enforce TLS Version / Cipher Policy
SEC-119 Implement and verify Certificate Validation
SEC-120 Implement, harden, and verify WAF
SEC-121 Implement, harden, and verify DDoS Protection
SEC-122 Implement and verify DNS Security
SEC-123 Define, approve, and enforce API Security Baseline
SEC-124 Implement, harden, and verify Authentication Failure Behavior
SEC-125 Define, approve, and enforce Authorization at Resource Boundary
SEC-126 Implement, harden, and verify Broken Object-Level Authorization
SEC-127 Implement and verify Mass Assignment
SEC-128 Implement and verify Input Validation
SEC-129 Implement and verify SQL Injection
SEC-130 Implement and verify SSRF
SEC-131 Implement and verify File Upload
SEC-132 Implement and verify Deserialization
SEC-133 Implement and verify Error Handling
SEC-134 Implement and verify Request Size Limits
SEC-135 Implement and verify Timeout Hardening
SEC-136 Implement and verify Rate Limiting
SEC-137 Implement and verify Replay Protection
SEC-138 Implement and verify Webhook Verification
SEC-139 Implement and verify Admin API Hardening
SEC-140 Define, approve, and enforce Database Security Principle
SEC-141 Implement and verify Database User per Service
SEC-142 Implement and verify Database Least Privilege
SEC-143 Implement, harden, and verify Migration Identity
SEC-144 Implement, harden, and verify Database Network Exposure
SEC-145 Implement, harden, and verify Database TLS
SEC-146 Implement and verify Database Encryption at Rest
SEC-147 Implement, harden, and verify Database Audit
SEC-148 Implement, harden, and verify Production DB Human Access
SEC-149 Implement, harden, and verify Database Credential Rotation
SEC-150 Implement and verify Sensitive Query Data
SEC-151 Define, approve, and enforce Kafka Security Principle
SEC-152 Implement, harden, and verify Kafka Authentication
SEC-153 Implement, harden, and verify Kafka TLS
SEC-154 Implement, harden, and verify Kafka ACLs
SEC-155 Implement, harden, and verify Kafka Admin Separation
SEC-156 Implement, harden, and verify Kafka Sensitive Payloads
SEC-157 Define, approve, and enforce Kafka Schema Governance
SEC-158 Implement, harden, and verify Kafka DLQ Security
SEC-159 Define, approve, and enforce Redis Security Principle
SEC-160 Implement, harden, and verify Redis Network Isolation
SEC-161 Implement, harden, and verify Redis Authentication / ACL
SEC-162 Implement, harden, and verify Redis TLS
SEC-163 Implement, harden, and verify Redis Command Restriction
SEC-164 Implement, harden, and verify Redis Sensitive Data
SEC-165 Implement, harden, and verify Redis Failure Security
SEC-166 Implement and verify Cloud Account / Project Isolation
SEC-167 Implement and verify Cloud IAM Hardening
SEC-168 Implement, harden, and verify Terraform Apply Identity
SEC-169 Implement, harden, and verify Terraform State Security
SEC-170 Implement and verify IaC Security Scanning
SEC-171 Implement and verify Destructive Action Protection
SEC-172 Implement, harden, and verify Security Group / Firewall Review
SEC-173 Implement, harden, and verify Object Storage Hardening
SEC-174 Define, approve, and enforce Backup Security Boundary
SEC-175 Implement and verify Security Observability
SEC-176 Define, approve, and enforce Audit Event Standard
SEC-177 Implement, harden, and verify Audit Integrity
SEC-178 Implement, harden, and verify Security Log Access
SEC-179 Implement, harden, and verify SIEM Integration
SEC-180 Implement and verify Detection Engineering
SEC-181 Implement and verify Security Alert Severity
SEC-182 Implement, harden, and verify Authentication Monitoring
SEC-183 Implement, harden, and verify Authorization Monitoring
SEC-184 Implement, harden, and verify Network Security Monitoring
SEC-185 Implement, harden, and verify Supply Chain Monitoring
SEC-186 Implement and verify Security Dashboard
SEC-187 Implement, harden, and verify Vulnerability Management Lifecycle
SEC-188 Implement and verify Risk-Based Prioritization
SEC-189 Implement, harden, and verify Critical Vulnerability SLA
SEC-190 Implement, harden, and verify Vulnerability Exception
SEC-191 Implement and verify False Positive
SEC-192 Implement and verify Patch Management
SEC-193 Implement and verify Emergency Patch
SEC-194 Implement and verify Unsupported Software
SEC-195 Implement and validate Penetration Testing
SEC-196 Implement and validate DAST
SEC-197 Implement and validate API Security Testing
SEC-198 Implement and validate Business Logic Abuse Testing
SEC-199 Implement and validate Fuzz / Property Security Testing
SEC-200 Implement, harden, and verify Security Incident Response
SEC-201 Define, approve, and enforce Security Incident Ownership
SEC-202 Write, test, and operationalize Credential Compromise Runbook
SEC-203 Implement, harden, and verify Signing Key Compromise
SEC-204 Write, test, and operationalize Kubernetes Compromise Runbook
SEC-205 Implement, harden, and verify Container Image Compromise
SEC-206 Implement and verify Database Compromise
SEC-207 Implement and verify Ransomware / Destructive Attack
SEC-208 Implement and verify Forensic Preservation
SEC-209 Implement and verify Recovery Trust
SEC-210 Implement, harden, and verify Post-Incident Hardening
SEC-211 Implement and verify Security Exception Process
SEC-212 Implement and verify Exception Expiry
SEC-213 Implement and verify Compensating Control
SEC-214 Implement and verify Security Debt
SEC-215 Define, approve, and enforce Security Policy Versioning
SEC-216 Implement and verify Security Control Evidence
SEC-217 Implement and verify Evidence Retention
SEC-218 Implement and verify Security Metrics
SEC-219 Implement and verify Avoid Vanity Metrics
SEC-220 Implement, harden, and verify Identity Service Hardening
SEC-221 Implement and verify Payment Service Hardening
SEC-222 Implement and verify Wallet Service Hardening
SEC-223 Implement and verify Ordering Service Hardening
SEC-224 Implement and verify Promotion / Coupon Hardening
SEC-225 Implement and verify Loyalty / Mission Hardening
SEC-226 Implement and verify Notification Service Hardening
SEC-227 Implement and verify Integration / ACL Hardening
SEC-228 Implement and validate Security Test Pyramid
SEC-229 Implement and validate Admission Policy Tests
SEC-230 Implement and validate RBAC Tests
SEC-231 Implement and validate NetworkPolicy Tests
SEC-232 Implement and validate Image Trust Test
SEC-233 Implement and validate Secret Leakage Test
SEC-234 Implement and validate TLS Tests
SEC-235 Implement and validate Security Chaos
SEC-236 Implement and verify Security Regression
SEC-237 Define, approve, and enforce Minimum Production Workload Security Standard
SEC-238 Define, approve, and enforce Minimum Production Service Security Standard
SEC-239 Define, approve, and enforce Minimum CI/CD Security Standard
SEC-240 Define, approve, and enforce Minimum Data Service Security Standard
SEC-241 Implement and verify Security Definition of Done — Application
SEC-242 Implement, harden, and verify Security Definition of Done — Container
SEC-243 Implement and verify Security Definition of Done — Kubernetes
SEC-244 Implement and verify Security Definition of Done — Infrastructure
SEC-245 Implement, harden, and verify Security Review Checklist — Identity
SEC-246 Implement, harden, and verify Security Review Checklist — Secrets
SEC-247 Implement, harden, and verify Security Review Checklist — Supply Chain
SEC-248 Implement, harden, and verify Security Review Checklist — Network
SEC-249 Implement and verify Security Review Checklist — Data
SEC-250 Implement and verify Security Review Checklist — Detection
SEC-251 Implement and verify Production Security Readiness Checklist
SEC-252 Implement and verify Security Anti-Patterns
SEC-253 Implement and verify Initial Implementation Order
SEC-254 Verify and evidence Threats reviewed for material change
SEC-255 Verify and evidence Authentication/authorization behavior tested
SEC-256 Verify and evidence Sensitive input/output identified
SEC-257 Verify and evidence Input validation implemented
SEC-258 Verify and evidence Abuse/rate model defined where required
SEC-259 Verify and evidence Secrets absent from code/logs
SEC-260 Verify and evidence Dependencies scanned
SEC-261 Verify and evidence Security-critical paths have tests
SEC-262 Verify and evidence Audit events exist for privileged actions
SEC-263 Verify and evidence No unresolved unapproved critical findings
SEC-264 Verify and evidence Approved minimal base
SEC-265 Verify and evidence Version/digest pinned
SEC-266 Verify and evidence Non-root
SEC-267 Verify and evidence No embedded secrets
SEC-268 Verify and evidence No unnecessary tooling
SEC-269 Verify and evidence Read-only root FS capable where required
SEC-270 Verify and evidence Capabilities minimal
SEC-271 Verify and evidence Container scan complete
SEC-272 Verify and evidence SBOM generated
SEC-273 Verify and evidence Digest/signature/provenance recorded
SEC-274 Verify and evidence Dedicated namespace/ServiceAccount
SEC-275 Verify and evidence Least-privilege RBAC
SEC-276 Verify and evidence Pod security baseline passes
SEC-277 Verify and evidence No privileged/host access without exception
SEC-278 Verify and evidence NetworkPolicy present
SEC-279 Verify and evidence External secrets integrated
SEC-280 Verify and evidence Trusted image policy passes
SEC-281 Verify and evidence Resource controls present
SEC-282 Verify and evidence Audit/observability available
SEC-283 Verify and evidence Admission tests pass
SEC-284 Verify and evidence Terraform-managed/reviewed
SEC-285 Verify and evidence IAM least privilege
SEC-286 Verify and evidence Private data-plane exposure where appropriate
SEC-287 Verify and evidence Encryption configured
SEC-288 Verify and evidence Logging/audit enabled
SEC-289 Verify and evidence Destructive protections reviewed
SEC-290 Verify and evidence Security scan/policy checks pass
SEC-291 Verify and evidence No unowned public endpoint
SEC-292 Verify and evidence Backup security prerequisites defined
SEC-293 Verify and evidence Named identities
SEC-294 Verify and evidence MFA for privileged humans
SEC-295 Verify and evidence Workload identities distinct
SEC-296 Verify and evidence No unnecessary static credentials
SEC-297 Verify and evidence Temporary privilege preferred
SEC-298 Verify and evidence Break-glass controlled
SEC-299 Verify and evidence Leaver revocation defined
SEC-300 Verify and evidence Privileged access reviewed
SEC-301 Verify and evidence Approved secret manager
SEC-302 Verify and evidence Least-privilege read
SEC-303 Verify and evidence No Git/image exposure
SEC-304 Verify and evidence No log exposure
SEC-305 Verify and evidence Rotation procedure
SEC-306 Verify and evidence Emergency rotation procedure
SEC-307 Verify and evidence Owner assigned
SEC-308 Verify and evidence Key/certificate expiry monitored
SEC-309 Verify and evidence Protected branches/tags
SEC-310 Verify and evidence Runner isolation
SEC-311 Verify and evidence Dependencies locked/pinned
SEC-312 Verify and evidence Secret/SAST/SCA scans
SEC-313 Verify and evidence Container scan
SEC-314 Verify and evidence SBOM
SEC-315 Verify and evidence Provenance
SEC-316 Verify and evidence Image signing policy
SEC-317 Verify and evidence Trusted registry
SEC-318 Verify and evidence Admission verification
SEC-319 Verify and evidence Public endpoints intentional
SEC-320 Verify and evidence WAF/rate controls reviewed
SEC-321 Verify and evidence TLS verification enabled
SEC-322 Verify and evidence East-west path documented
SEC-323 Verify and evidence Default-deny policy where applicable
SEC-324 Verify and evidence Egress restricted for sensitive services
SEC-325 Verify and evidence Partner endpoints allow-listed where suitable
SEC-326 Verify and evidence DNS change protected
SEC-327 Verify and evidence Data classification known
SEC-328 Verify and evidence Service-owned identity
SEC-329 Verify and evidence Least-privilege DB/Kafka/Redis access
SEC-330 Verify and evidence Private network path
SEC-331 Verify and evidence TLS/encryption policy
SEC-332 Verify and evidence Sensitive data absent from telemetry
SEC-333 Verify and evidence Administrative audit
SEC-334 Verify and evidence Backup security ownership
SEC-335 Verify and evidence Critical audit events defined
SEC-336 Verify and evidence Central collection
SEC-337 Verify and evidence SIEM/detection rules for high-risk actions
SEC-338 Verify and evidence Alert owner
SEC-339 Verify and evidence Runbook
SEC-340 Verify and evidence Retention policy
SEC-341 Verify and evidence Clock synchronization
SEC-342 Verify and evidence Deployment/config context correlated
SEC-343 Verify and evidence Threat model reviewed
SEC-344 Verify and evidence Crown-jewel assets identified
SEC-345 Verify and evidence Privileged access uses MFA and least privilege
SEC-346 Verify and evidence Break-glass tested
SEC-347 Verify and evidence Workload identities configured
SEC-348 Verify and evidence Secrets and key rotation tested
SEC-349 Verify and evidence CI/CD security gates active
SEC-350 Verify and evidence Release SBOM/provenance/signing policy active
SEC-351 Verify and evidence Admission policies enforce workload baseline
SEC-352 Verify and evidence NetworkPolicies and egress model validated
SEC-353 Verify and evidence Public edge WAF/rate/TLS controls validated
SEC-354 Verify and evidence PostgreSQL/Kafka/Redis access reviewed
SEC-355 Verify and evidence Audit/SIEM paths working
SEC-356 Verify and evidence Critical vulnerability process operating
SEC-357 Verify and evidence Penetration/security tests completed as required
SEC-358 Verify and evidence Security incident runbooks exercised
SEC-359 Verify and evidence No expired exceptions
SEC-360 Verify and evidence Backup protection prerequisites handed to PART 36
SEC-361 Write, test, and exercise runbook: credential compromise
SEC-362 Write, test, and exercise runbook: secret leak
SEC-363 Write, test, and exercise runbook: signing-key compromise
SEC-364 Write, test, and exercise runbook: certificate expiry/compromise
SEC-365 Write, test, and exercise runbook: malicious/untrusted image
SEC-366 Write, test, and exercise runbook: Kubernetes workload compromise
SEC-367 Write, test, and exercise runbook: unexpected privileged access
SEC-368 Write, test, and exercise runbook: public endpoint abuse/DDoS
SEC-369 Write, test, and exercise runbook: DB credential compromise
SEC-370 Write, test, and exercise runbook: Kafka credential compromise
SEC-371 Write, test, and exercise runbook: critical CVE emergency patch
SEC-372 Write, test, and exercise runbook: security logging/SIEM outage
```

---

# 11. Phase 31 Policy Freeze Checklist

Before Phase 32, approve:

- [ ] Security asset inventory and crown-jewel classification.
- [ ] Threat-model methodology and review cadence.
- [ ] Mandatory vs recommended security-control tiers.
- [ ] Human SSO/MFA and privileged-access baseline.
- [ ] Production break-glass model.
- [ ] Privileged-access review and deprovisioning cadence.
- [ ] Workload identity and ServiceAccount standard.
- [ ] Cloud/workload identity federation model.
- [ ] Secret-manager standard and prohibited secret locations.
- [ ] Secret, certificate, signing-key, and encryption-key rotation policy.
- [ ] KMS/HSM protection level for critical keys.
- [ ] Source repository security baseline.
- [ ] CI runner and CI credential hardening.
- [ ] SAST/SCA/secret/container/IaC scanning gates.
- [ ] Vulnerability severity/SLA and risk-exception workflow.
- [ ] SBOM format and retention.
- [ ] Build provenance and image-signing standard.
- [ ] Trusted-registry/image-admission policy.
- [ ] Base-image allowlist and rebuild policy.
- [ ] Container runtime restricted baseline.
- [ ] Kubernetes Pod Security / securityContext baseline.
- [ ] Seccomp/AppArmor/capability policy.
- [ ] Admission-controller/policy-engine technology.
- [ ] ServiceAccount/RBAC least-privilege baseline.
- [ ] Cluster API/audit/control-plane hardening.
- [ ] Namespace security baseline.
- [ ] Default-deny NetworkPolicy and east-west allow matrix.
- [ ] Production egress-control model.
- [ ] Metadata-service protection.
- [ ] Internal TLS/mTLS policy.
- [ ] TLS version/cipher/certificate-validation baseline.
- [ ] WAF/DDoS/rate-limit policy.
- [ ] DNS security policy.
- [ ] API authentication/authorization baseline.
- [ ] Resource-level authorization requirements.
- [ ] Input-validation/injection/SSRF/replay/business-abuse controls.
- [ ] PostgreSQL private access, roles, TLS, encryption, audit, admin controls.
- [ ] Kafka TLS/auth/ACL/topic/group security baseline.
- [ ] Redis private access, TLS/auth/ACL/dangerous-command/security baseline.
- [ ] Object-storage security baseline.
- [ ] Terraform state and IaC security baseline.
- [ ] Backup security boundary and destructive-action protection.
- [ ] Central security-audit event schema.
- [ ] SIEM ingestion and detection-engineering standard.
- [ ] Security alert severity/ownership/response model.
- [ ] Vulnerability/patch lifecycle.
- [ ] DAST/penetration/security-regression strategy.
- [ ] Security incident command structure.
- [ ] Credential/key/image/Kubernetes/data-compromise runbooks.
- [ ] Forensic evidence-preservation policy.
- [ ] Recovery trust-chain requirements.
- [ ] Security exception ownership/compensating-control/expiry policy.
- [ ] Security control catalog and evidence model.
- [ ] High-risk release security evidence bundle.
- [ ] Security tabletop cadence.
- [ ] Continuous security-governance review.
- [ ] Production security readiness gate.

---

# 12. Phase 31 Exit Criteria

Phase 31 is complete when the team can answer and demonstrate:

```text
IDENTITY
Can any human or workload reach production
with more privilege than it actually needs?

SECRETS
Can every critical secret/key be rotated quickly
without searching source code or individual laptops?

SUPPLY CHAIN
Can we prove which reviewed source, pipeline,
dependencies, SBOM, signer, and image digest
produced every production workload?

CONTAINERS / KUBERNETES
Will the cluster reject a privileged, root,
untrusted, or otherwise prohibited application workload
before it runs?

NETWORK
Can a compromised service reach only the services,
data stores, and external endpoints
it is allowed to reach?

DATA
Do PostgreSQL, Kafka, and Redis use private access,
strong identity, least privilege, encryption,
and audit appropriate to risk?

APIs
Are authentication, authorization, abuse, replay,
injection, SSRF, and business-logic attack paths tested?

VULNERABILITIES
Does every critical finding have timely remediation,
mitigation, or an explicit expiring risk decision?

DETECTION
Can we detect and investigate privileged access,
credential abuse, policy bypass,
and suspicious production changes?

INCIDENT RESPONSE
Can we contain a compromised credential/workload
and rebuild trust without improvising the procedure?

RECOVERY
Are backup and recovery assets protected
from the same identities and attack paths
that could compromise production?
```

---

# 13. Phase 31 Completion Tree

```text
PHASE 31 — SECURITY HARDENING

├── Threat Model / Crown Jewels                  ✅
├── Security Control Layers                      ✅
├── Mandatory Security Baselines                 ✅
├── Human Identity / MFA                         ✅
├── Privileged Access / Break Glass              ✅
├── Workload Identity                            ✅
├── ServiceAccount Cleanup                       ✅
├── Secrets / Keys                               ✅
├── KMS / Rotation                               ✅
├── Certificate Rotation                         ✅
├── Source / CI Hardening                        ✅
├── SAST / SCA / Secret Scanning                 ✅
├── Container / IaC Scanning                     ✅
├── SBOM / Provenance                            ✅
├── Image Signing / Trust                        ✅
├── Registry / Base Image Governance             ✅
├── Container Runtime Hardening                  ✅
├── Non-Root / Read-Only FS                      ✅
├── Capabilities / Seccomp                       ✅
├── Kubernetes Pod Security                      ✅
├── Admission Policy                             ✅
├── Kubernetes RBAC                              ✅
├── Cluster / API Audit                          ✅
├── Namespace Security                           ✅
├── Network Segmentation                         ✅
├── Default-Deny NetworkPolicy                   ✅
├── Egress / Metadata Protection                 ✅
├── TLS / mTLS                                   ✅
├── WAF / DDoS                                   ✅
├── DNS Security                                 ✅
├── API Authentication / Authorization           ✅
├── Input / Injection / SSRF / Replay Controls   ✅
├── Business-Abuse Controls                      ✅
├── PostgreSQL Hardening                         ✅
├── Kafka Hardening                              ✅
├── Redis Hardening                              ✅
├── Terraform / IaC Hardening                    ✅
├── Object Storage                               ✅
├── Backup Security Boundary                     ✅
├── Security Audit                               ✅
├── SIEM / Detection Engineering                 ✅
├── Vulnerability / Patch Management             ✅
├── DAST / Penetration Testing                   ✅
├── Security Regression Testing                  ✅
├── Incident Command / Response                  ✅
├── Credential / Key Compromise                  ✅
├── Workload / Image Compromise                  ✅
├── Data Compromise                              ✅
├── Ransomware / Destructive Attack              ✅
├── Forensic Preservation                        ✅
├── Recovery Trust                               ✅
├── Security Exceptions                          ✅
├── Control / Exception Catalogs                 ✅
├── Release Security Evidence                    ✅
├── Security Runbooks                            ✅
├── Tabletop Exercises                           ✅
├── Governance Reviews                           ✅
├── Security Definitions of Done                 ✅
├── Production Security Readiness                ✅
└── Backup / DR Handoff                          ✅
```

---

# 14. Handoff to Phase 32

The next official implementation phase is:

```text
PHASE 32 — Backup / Disaster Recovery
```

It will define:

```text
Backup Strategy
RPO / RTO
PostgreSQL Backup / PITR
Kafka Recovery
Redis Recovery
Object Storage Protection
Kubernetes / GitOps Recovery
Terraform State Recovery
Secret / KMS Recovery
Immutable / Isolated Backups
Cross-Region Recovery
Restore Testing
Disaster Scenarios
Failover / Failback
Recovery Runbooks
Recovery Ownership
Recovery Evidence
```

The boundary is:

```text
PHASE 31
Security Hardening
=
prevent, contain, detect, and respond to compromise

        ↓

PHASE 32
Backup / Disaster Recovery
=
preserve and restore business capability
when systems or data are lost, corrupted, unavailable,
or destroyed
```

---

# 15. Final Phase 31 Principle

```text
Security Architecture
      ↓
Enforced Policy
      ↓
Trusted Identity + Artifact
      ↓
Hardened Workload + Network + Data
      ↓
Audit / Detection
      ↓
Incident Containment
      ↓
Trusted Recovery
```

The most important production rules are:

```text
Security controls are enforced, observable, reviewed, and continuously verified.
Deny by default and grant least privilege.
Privileged human access requires strong authentication and audit.
Workloads use distinct identities rather than shared static credentials.
Secrets live in approved secret management and are rotatable.
Critical keys have explicit protection and lifecycle control.
Production images are immutable, scanned, traceable, and trusted.
SBOM, provenance, signature, and image digest belong to one trust record.
Containers run non-root and non-privileged by default.
Unnecessary Linux capabilities are dropped.
Admission rejects prohibited workload configuration before execution.
Application ServiceAccounts never receive broad cluster-admin by default.
Network location is not identity.
East-west and egress paths are explicitly controlled.
TLS verification is never disabled in production.
WAF and rate limits supplement—not replace—application security.
Services enforce resource-level authorization behind the gateway.
PostgreSQL, Kafka, and Redis use private connectivity and least privilege.
Sensitive data does not belong in logs, Kafka events, or uncontrolled caches.
Security telemetry is centralized, protected, and actionable.
Critical vulnerability risk is owned and time-bounded.
Security exceptions have owners, compensating controls, approvals, and expiry.
Incident response can revoke credentials, contain workloads, preserve evidence,
and redeploy from trusted artifacts.
Backup and recovery assets are protected from destructive production compromise.
```

**End of PHASE 31 — Security Hardening**
