---
title: "PHASE 30 — Terraform"
---

# PHASE 30 — Terraform

> **Purpose:** Define and implement the complete Infrastructure-as-Code standard for the microservices platform: Terraform ownership, remote state, state locking, providers/modules, environment isolation, networking, Kubernetes infrastructure, managed PostgreSQL/Kafka/Redis, object storage, registry, IAM/workload identity, KMS, secret-manager foundations, observability/audit infrastructure, backup/DR foundations, plan/apply governance, drift detection, import/adoption, policy-as-code, cost controls, destruction protection, testing, recovery, and production readiness.
>
> **Previous Phase:** Phase 29 — GitOps / Argo CD
>
> **Next Phase:** Phase 31 — Security Hardening
>
> **Primary Architecture Basis:** PART 34 — Infrastructure / Terraform.
>
> **Primary Stack:** Terraform, GitLab CI/CD, managed cloud infrastructure, Kubernetes, Argo CD, PostgreSQL, Kafka, Redis, object storage, DNS, IAM/workload identity, KMS, external secret manager, Prometheus/Grafana/OpenTelemetry foundations.
>
> **Status:** Implementation-Ready Infrastructure-as-Code Specification

---

# 1. Phase 30 Implementation Mandate

Core principle:

```text
Infrastructure is declared as code,
reviewed as code,
and changed through controlled automation.
```

The lifecycle is:

```text
Reviewed Terraform
      ↓
Validated / Tested
      ↓
Speculative Plan
      ↓
Reviewed Change
      ↓
Final / Saved Plan
      ↓
Protected Apply
      ↓
Post-Apply Verification
      ↓
Drift Monitoring
      ↓
Recovery / Decommission when required
```

---

# 2. Ownership Boundary

```text
Terraform
  → cloud account/project resources
  → VPC/VNet and subnets
  → managed Kubernetes clusters
  → node pools
  → managed PostgreSQL
  → managed Kafka
  → managed Redis
  → object storage
  → DNS foundations
  → IAM/workload identity foundations
  → KMS
  → secret-manager foundations

Argo CD
  → Kubernetes application/platform desired state
  → Deployments
  → Services
  → ConfigMaps
  → application workload manifests
  → application-level policies owned by GitOps

Applications
  → business behavior and correctness
```

The governing rule is:

```text
One resource
=
one authoritative lifecycle controller
```

Terraform must not become the normal application deployment engine.

---

# 3. Non-Negotiable Production Rules

```text
No production local Terraform state.
Production state is remote, encrypted, versioned, and access-controlled.
State locking is enabled where the backend supports it.
State is treated as sensitive infrastructure data.
Terraform and provider versions are constrained and reproducible.
Provider dependency locks are committed/reviewed.
Production modules use reviewed/pinned versions.
Environment isolation is deliberate.
Network and CIDR architecture is planned before production.
Production databases, Kafka, and Redis are private by default.
Production data infrastructure has explicit HA/backup/deletion protections.
CI uses short-lived identity rather than static administrator keys.
Production apply is protected and serialized.
Reviewers see create/update/replace/destroy actions before apply.
Critical replacement/destruction requires explicit approval.
Drift is detected and reconciled deliberately.
ignore_changes is narrow and cannot hide unexplained drift.
Brownfield import is planned before Terraform takes ownership.
Secret values are not casually stored in Terraform source or outputs.
Terraform and Argo CD never fight over the same resource.
Infrastructure recovery does not depend on one engineer workstation.
```

---

# 4. State Safety Model

```text
Terraform Configuration
        ↓
Remote Backend
  ├── encryption
  ├── versioning
  ├── access control
  └── locking
        ↓
Protected CI Identity
        ↓
Plan / Apply
```

State operations such as:

```text
state rm
state mv
import
force-unlock
state replacement/repair
```

are privileged operational actions and require explicit runbooks/review.

---

# 5. Source-Recommended Initial Implementation Order

```text
1. Define Terraform ownership boundaries
2. Create state-backend bootstrap
3. Define CI/OIDC apply identities
4. Standardize Terraform/provider versions
5. Create repository/root/state layout
6. Build naming/tagging module standards
7. Build network module
8. Build KMS/secret foundations
9. Build Kubernetes module
10. Build PostgreSQL module
11. Build Kafka module
12. Build Redis module
13. Build object-storage module
14. Add observability/audit foundations
15. Add policy/security scans
16. Add plan/apply workflow
17. Add drift detection
18. Add backup/DR infrastructure
19. Test import/refactor/state recovery
20. Bootstrap Argo CD integration
```

---

# 6. Minimum Viable Terraform Standard

Every production infrastructure root requires:

```text
remote backend
state locking where supported
state encryption
versioned state recovery
Terraform version constraint
provider version constraints
provider lock file
reviewed modules
CI format/validate/plan
protected apply
short-lived credentials
mandatory tags
security/policy checks
drift detection
recovery runbook
```

---

# 7. Detailed Source-Aligned Specification

The following detailed specification preserves PART 34 terminology, structure, examples, ownership rules, warnings, testing guidance, review checklists, production-readiness criteria, and the handoff to security hardening.

---

# 9366 — Purpose

Infrastructure / Terraform defines how the platform's durable infrastructure foundations are declared, reviewed, created, changed, recovered, and retired.

It answers:

```text
What infrastructure does Terraform own?
How is Terraform state stored and protected?
How are concurrent changes prevented?
How are providers and modules versioned?
How are DEV/UAT/STAGING/PROD isolated?
How are networks, Kubernetes, databases, Kafka, Redis, DNS, IAM, and KMS provisioned?
How are infrastructure changes planned and approved?
How is drift detected?
How are existing resources adopted safely?
How are destructive changes prevented?
How is infrastructure recovered after control-plane or state failure?
How do Terraform and Argo CD avoid owning the same resource?
```

The core principle is:

```text
Infrastructure is declared as code,
reviewed as code,
and changed through controlled automation.
```

---

# 9367 — Handoff from PART 33

PART 33 established:

```text
GitOps / Argo CD
= Kubernetes application/platform desired state
```

PART 34 establishes:

```text
Terraform
= infrastructure foundation desired state
```

Typical ownership:

```text
Terraform
  → cloud account/project resources
  → VPC/VNet and subnets
  → managed Kubernetes clusters
  → node pools
  → managed PostgreSQL
  → managed Kafka
  → managed Redis
  → object storage
  → DNS foundations
  → IAM/workload identity foundations
  → KMS
  → secret-manager foundations

Argo CD
  → Kubernetes application manifests
  → Deployments
  → Services
  → ConfigMaps
  → application-level NetworkPolicies
  → workload manifests
```

The ownership boundary must be explicit.

---

# 9368 — Terraform Is Not the Application Deployment Engine

Terraform should not become the normal mechanism for deploying every application release.

Avoid:

```text
Terraform changes image tag
Terraform applies Kubernetes Deployment
Terraform handles every app rollout
```

when PART 33 already assigns application desired state to GitOps.

Preferred:

```text
Terraform
  → creates cluster + infrastructure foundations

Argo CD
  → deploys/reconciles applications inside the cluster
```

---

# 9369 — One Resource, One Controller

A resource should have one authoritative lifecycle controller.

Bad:

```text
Terraform creates ConfigMap
Argo CD also manages same ConfigMap
```

or:

```text
Terraform creates Service
Helm/Argo CD also changes same Service
```

This produces ownership conflict and perpetual drift.

Rule:

```text
one resource
→ one declared owner
→ one reconciliation path
```

---

# 9370 — Infrastructure-as-Code Goals

The infrastructure model should be:

```text
declarative
repeatable
reviewable
versioned
testable
least-privilege
recoverable
observable
cost-aware
provider-aware but architecture-driven
```

It should avoid:

```text
click-only production setup
undocumented console changes
shared administrator credentials
local-only Terraform state
unreviewed apply
copy-paste environment drift
manual resource naming
implicit ownership
```

---

# 9371 — Desired Infrastructure State

Conceptually:

```text
Terraform Configuration
        ↓
Terraform Plan
        ↓
Reviewed Change
        ↓
Terraform Apply
        ↓
Cloud / Infrastructure State
        ↓
Remote Terraform State
```

The configuration describes intent.

The state records Terraform's mapping between that intent and managed real infrastructure.

---

# 9372 — Terraform Responsibilities

Terraform owns infrastructure lifecycle where selected, including:

```text
create
read/refresh
update
replace
destroy when explicitly allowed
import/adoption
outputs for downstream systems
```

Terraform does not own business-domain state.

---

# 9373 — Terraform Non-Responsibilities

Terraform does not define:

```text
order rules
payment correctness
wallet ledger behavior
Kafka consumer idempotency
mission progress
application authorization
business reconciliation
```

Those remain application/domain responsibilities.

---

# 9374 — Infrastructure Ownership Matrix

Maintain an explicit matrix such as:

| Resource Type | Primary Owner | Delivery Mechanism |
|---|---|---|
| Cloud account/project | Platform/Cloud | Terraform / organization tooling |
| Network/VPC | Platform | Terraform |
| Kubernetes cluster | Platform | Terraform |
| Node pools | Platform | Terraform |
| PostgreSQL service | Platform/DBA | Terraform |
| Kafka cluster | Platform | Terraform |
| Redis service | Platform | Terraform |
| Object storage | Platform | Terraform |
| KMS keys | Platform/Security | Terraform |
| Secret manager containers/policies | Platform/Security | Terraform |
| Kubernetes application workloads | Service teams/Platform | Argo CD |
| Application image digest | Release process | PART 32/33 |
| Business data | Domain service | Application/database |

---

# 9375 — Repository Strategy

Infrastructure may use:

```text
single infrastructure repository
```

or:

```text
platform foundation repo
network repo
shared services repo
environment root repos
module repos
```

Choose the smallest structure that preserves clear ownership and blast-radius boundaries.

---

# 9376 — Avoid Repository Fragmentation

Do not create one repository for every tiny Terraform resource.

Repository boundaries should follow:

```text
ownership
change lifecycle
state boundary
security boundary
blast radius
```

not arbitrary file count.

---

# 9377 — Recommended Repository Layers

A practical model:

```text
terraform-modules/
  network/
  kubernetes/
  postgres/
  kafka/
  redis/
  object-storage/
  observability-foundation/

infrastructure-live/
  dev/
  qa/
  uat/
  staging/
  prod/
```

Exact repository separation is organization-specific.

---

# 9378 — Root Modules vs Reusable Modules

Use:

```text
Reusable Module
= infrastructure capability abstraction

Root Module
= environment-specific composition
```

Example:

```text
module "platform_network" { ... }
module "platform_kubernetes" { ... }
module "platform_postgres" { ... }
```

inside the production root configuration.

---

# 9379 — Root Module Responsibility

Root modules own:

```text
provider configuration
backend configuration
module composition
environment-specific values
cross-module wiring
final outputs
```

Reusable child modules should not own environment credentials.

---

# 9380 — Provider Configuration Boundary

Configure providers in the root module.

Reusable modules declare provider requirements, but should not embed environment-specific provider credentials or region assumptions unless that is the module's explicit contract.

---

# 9381 — Terraform Version Standard

Choose one organization-supported Terraform version range.

Do not allow every engineer or pipeline to use arbitrary Terraform versions.

Record:

```text
required_version
CI image version
upgrade owner
upgrade procedure
```

---

# 9382 — Version Constraint

Example:

```hcl
terraform {
  required_version = ">= 1.x, < 2.0"
}
```

Use the exact organization-approved constraint rather than copying this illustrative range blindly.

---

# 9383 — Provider Requirements

Every root/module that depends on a provider should declare:

```text
provider source
compatible version constraint
```

Example:

```hcl
terraform {
  required_providers {
    cloud = {
      source  = "vendor/cloud"
      version = "~> X.Y"
    }
  }
}
```

---

# 9384 — Dependency Lock File

Commit:

```text
.terraform.lock.hcl
```

for root configurations.

Purpose:

```text
repeat selected provider versions
record provider checksums
make provider upgrades reviewable
```

---

# 9385 — Provider Upgrade Policy

Provider upgrades must be deliberate.

Flow:

```text
change constraint if required
      ↓
terraform init -upgrade
      ↓
lock-file diff
      ↓
plan
      ↓
module/integration tests
      ↓
non-production apply
      ↓
production promotion
```

---

# 9386 — Provider Upgrade Risk

Provider upgrades may change:

```text
resource schemas
defaults
replacement behavior
diff behavior
deprecations
API use
```

Treat major provider upgrades as infrastructure changes, not dependency housekeeping.

---

# 9387 — Module Versioning

Reusable modules should be versioned.

Preferred references:

```text
immutable Git tag
module registry version
immutable commit when necessary
```

Avoid production dependencies on a mutable branch head.

---

# 9388 — Module Semantic Versioning

A practical module versioning model:

```text
PATCH
= internal fix compatible with same interface

MINOR
= backward-compatible capability

MAJOR
= breaking inputs/outputs/behavior
```

Infrastructure semantics still require plan review regardless of version label.

---

# 9389 — Module Interface

Every reusable module should have explicit:

```text
inputs
outputs
provider requirements
assumptions
security defaults
upgrade notes
examples
```

The module interface is a platform contract.

---

# 9390 — Module Inputs

Inputs should represent architecture intent.

Prefer:

```text
availability_zone_count
private_subnet_cidrs
postgres_instance_class
backup_retention_days
```

over exposing every low-level provider field without abstraction.

---

# 9391 — Avoid Giant Modules

Do not create one module that provisions:

```text
network
cluster
database
Kafka
Redis
DNS
all applications
```

as one inseparable unit.

It creates a huge state and blast radius.

---

# 9392 — Avoid Tiny Wrapper Modules

A module that merely renames one provider argument without adding policy, reuse, or abstraction may not be valuable.

Modules should encode meaningful platform standards.

---

# 9393 — Variable Validation

Use variable validation for important invariants.

Examples:

```text
allowed environment names
supported regions
minimum backup retention
valid CIDR shape/range
approved database classes
```

Fail early before provisioning.

---

# 9394 — Preconditions and Postconditions

Use conditions where they improve safety.

Examples:

```text
production database must be encrypted
production cluster must not use public worker nodes
critical storage must have versioning enabled
```

Do not use them to duplicate every provider validation.

---

# 9395 — Module Outputs

Expose only downstream information that is actually needed.

Examples:

```text
cluster name
cluster endpoint identifier
VPC ID
private subnet IDs
database endpoint
secret ARN/reference
KMS key ID
```

Avoid leaking secrets through outputs.

---

# 9396 — Sensitive Outputs

Mark sensitive Terraform outputs where needed.

But remember:

```text
sensitive output
!= secret absent from state
```

The state may still contain the value.

---

# 9397 — Terraform State Is Sensitive

Terraform state can contain:

```text
resource identifiers
network details
service endpoints
credentials returned by providers
secret values in some resources
```

Treat state as sensitive infrastructure data.

---

# 9398 — No Production Local State

Do not operate production using only:

```text
terraform.tfstate
```

on an engineer laptop.

Use a controlled remote backend.

---

# 9399 — Remote Backend Goals

The backend should provide:

```text
durable state storage
controlled access
encryption
version/recovery capability
locking where supported
operational monitoring
```

---

# 9400 — Backend Bootstrap

Backend infrastructure itself creates a bootstrap problem.

Possible approach:

```text
small bootstrap configuration
      ↓
create state storage + KMS/access
      ↓
initialize normal infrastructure roots
```

Keep bootstrap code minimal and documented.

---

# 9401 — Backend Separation

Production state should be isolated from non-production state.

Isolation may use:

```text
separate account/project
separate bucket/container
separate backend workspace/state key
separate credentials
```

Risk determines physical separation.

---

# 9402 — State Partitioning

Do not put the entire company infrastructure into one state.

Partition by stable ownership/blast radius such as:

```text
organization foundation
network
Kubernetes cluster
shared data platform
observability
application-specific infrastructure
```

---

# 9403 — State Boundary Principle

A state should represent resources that:

```text
change together
share ownership
share lifecycle
can accept one apply blast radius
```

State partitioning is an architecture decision.

---

# 9404 — Avoid State-per-Resource

Too many tiny states create:

```text
operational overhead
cross-state dependency complexity
slow change coordination
harder discovery
```

Use meaningful boundaries.

---

# 9405 — State Locking

Enable backend-supported locking for shared infrastructure state.

Purpose:

```text
prevent concurrent applies
prevent conflicting state writes
reduce corruption risk
```

---

# 9406 — Lock Contention

If a state is frequently locked by unrelated teams, it may indicate the state boundary is too broad.

Do not solve architecture contention only by increasing patience around one giant state.

---

# 9407 — Force Unlock

Force-unlock is an exceptional operation.

Before using it, verify:

```text
no apply is still running
lock owner/job is known
backend is healthy
state has not changed unexpectedly
```

Audit the action.

---

# 9408 — Backend Versioning

Enable object/version history where the backend supports it.

This protects against:

```text
accidental state overwrite
accidental deletion
operator error
```

State version history is not a replacement for correct access control.

---

# 9409 — Backend Encryption

State storage must be encrypted at rest using the cloud/provider's approved encryption model.

For production, prefer customer-managed key control where organizational policy requires it.

---

# 9410 — Backend Access

State access should be more restricted than normal read-only infrastructure visibility.

Typical access:

```text
CI Terraform role
small platform admin group
break-glass role
```

Avoid broad developer write access.

---

# 9411 — Backend Credentials

Do not commit backend credentials in Terraform configuration.

Prefer:

```text
OIDC federation
workload identity
short-lived CI credentials
managed runner identity
```

over static keys.

---

# 9412 — State Backup and Recovery

State recovery must be documented and tested.

Runbook should cover:

```text
state backend unavailable
state object deleted
state write failed
state version restoration
resource/state mismatch
```

---

# 9413 — State Pull Before Repair

Before manual state repair:

```text
capture current state
capture backend version
capture plan
record incident/change ticket
```

Never make blind state surgery during an incident.

---

# 9414 — State Commands Are Privileged

Commands such as:

```text
state rm
state mv
import
force-unlock
```

can change Terraform's ownership model.

Production use requires review and audit.

---

# 9415 — No Manual State Editing by Default

Do not open the JSON state and edit fields manually as a normal workflow.

Use supported Terraform state/refactoring operations.

Manual edits are last-resort recovery and require backup plus peer review.

---

# 9416 — Environment Model

The environment hierarchy remains:

```text
LOCAL
CI
DEV
QA
UAT
STAGING
PRODUCTION
```

with specialized:

```text
PERFORMANCE
SECURITY
DR
```

Infrastructure isolation follows PART 28.

---

# 9417 — Account / Project Isolation

Prefer strong production isolation using the cloud equivalent of:

```text
separate account
separate project
separate subscription
```

with separate IAM and billing visibility.

---

# 9418 — Environment Root Composition

Example:

```text
live/
  dev/
    network/
    cluster/
    data/
  uat/
    network/
    cluster/
    data/
  prod/
    network/
    cluster/
    data/
```

The exact tree is secondary to stable state and ownership boundaries.

---

# 9419 — Environment Values

Environment-specific values may include:

```text
region
CIDR
node sizes
replica counts
DB size
backup retention
Kafka capacity
Redis capacity
DNS zone
```

Keep differences explicit and reviewable.

---

# 9420 — Avoid Environment Forks

Do not maintain completely separate copied Terraform code for DEV and PROD if they represent the same architecture.

Prefer:

```text
same reusable modules
+
explicit environment inputs
```

---

# 9421 — Production Differences Are Intentional

Production may differ in:

```text
HA
capacity
retention
network isolation
KMS
backup
multi-AZ
monitoring
```

Those differences must be deliberate, not accidental drift.

---

# 9422 — Naming Standard

Resource naming should encode stable context such as:

```text
organization/platform
environment
region
resource role
```

without exceeding provider limits.

---

# 9423 — Resource Tags / Labels

Require tags/labels such as:

```text
environment
owner
service/platform
cost_center
managed_by=terraform
repository
criticality
data_classification where applicable
```

---

# 9424 — Tag Governance

Mandatory tags should be validated centrally through:

```text
module defaults
policy as code
cloud organization policy
CI checks
```

where appropriate.

---

# 9425 — Region Strategy

Choose approved regions based on:

```text
latency
service availability
data residency
cost
DR strategy
partner connectivity
```

Terraform should not allow arbitrary production regions without review.

---

# 9426 — Multi-Region Is Not Automatic

Do not deploy multi-region infrastructure merely because Terraform makes it easy to copy resources.

Multi-region requires:

```text
data consistency strategy
traffic routing
failover
capacity
operational ownership
DR testing
```

---

# 9427 — Network Foundation Ownership

Terraform should provision network foundations such as:

```text
VPC/VNet
subnets
route tables
NAT/egress
security groups/firewall primitives
private endpoints
peering/transit connectivity
```

according to PART 30.

---

# 9428 — Network Module Boundary

Network module outputs commonly include:

```text
vpc_id
private_subnet_ids
public_subnet_ids where justified
route identifiers
security boundary IDs
```

Consumers should not need to query the cloud manually.

---

# 9429 — Private-by-Default Subnets

Application nodes and managed data services should normally use private network placement.

Public exposure is explicit and routed through approved edge components.

---

# 9430 — Public Subnet Use

Public subnets may host approved edge infrastructure such as:

```text
internet-facing load balancer
NAT gateway architecture where applicable
```

not arbitrary application databases or worker nodes.

---

# 9431 — CIDR Planning

CIDRs must be planned before provisioning.

Avoid overlaps with:

```text
corporate network
VPN
other environments
partner networks
future regions
Kubernetes Pod/Service ranges
```

---

# 9432 — CIDR Change Cost

Network CIDR replacement can be highly disruptive.

Treat CIDR allocation as long-lived architecture, not a casual input.

---

# 9433 — Availability Zones

Production network and critical managed services should span multiple failure zones where provider/service support exists and business requirements justify it.

---

# 9434 — Route Ownership

Routes must be declared.

Avoid undocumented console-created routes because they can create invisible egress or bypass security controls.

---

# 9435 — Internet Egress

Egress architecture may use:

```text
NAT
firewall
proxy
egress gateway
private service endpoints
```

according to PART 30.

Terraform provisions the infrastructure; policy governs who may use it.

---

# 9436 — Stable Egress Identity

When partners whitelist source IPs, provision stable egress identity intentionally.

Track:

```text
service/environment
public egress IP
partner dependency
owner
```

---

# 9437 — Private Endpoints

Prefer private connectivity for supported managed services when it reduces exposure and fits operations.

Examples:

```text
object storage
secret manager
container registry
managed database
```

---

# 9438 — DNS Foundations

Terraform may provision:

```text
DNS zones
zone delegation
private zones
base records
IAM permissions for DNS automation
```

Application route records may be delegated to approved controllers where ownership is clear.

---

# 9439 — DNS Ownership Boundary

Do not let:

```text
Terraform
external-dns
manual console
```

all manage the same record.

Assign record ownership by zone/prefix/resource type.

---

# 9440 — TLS Foundation

Terraform may provision foundational resources such as:

```text
KMS/HSM integration
DNS validation permissions
certificate service prerequisites
load balancer certificate references
```

while cert-manager may own workload certificates inside Kubernetes.

---

# 9441 — Kubernetes Cluster Provisioning

Terraform should provision managed Kubernetes foundations including:

```text
cluster control plane
cluster network configuration
private/public endpoint policy
node pools
identity integration
logging/audit configuration
storage/network integrations where required
```

---

# 9442 — Managed Kubernetes Preference

Use a managed Kubernetes service when it meets requirements unless self-managed control-plane operation has a clear justification.

The organization should focus on application/platform reliability rather than unnecessary control-plane maintenance.

---

# 9443 — Kubernetes Version

Declare supported Kubernetes versions explicitly.

Do not rely on provider defaults for production version selection.

---

# 9444 — Kubernetes Upgrade Path

Cluster upgrade flow:

```text
provider/module upgrade if needed
      ↓
non-production cluster
      ↓
add-on compatibility
      ↓
workload validation
      ↓
staging
      ↓
production maintenance plan
```

---

# 9445 — Cluster Endpoint Exposure

Production cluster API endpoint should be private or tightly restricted where operationally feasible.

If public endpoint is required, restrict source networks and enforce strong identity.

---

# 9446 — Kubernetes Control-Plane Logging

Enable appropriate managed control-plane/audit logs based on provider capabilities and security requirements.

Route them into the PART 31 observability/security monitoring architecture.

---

# 9447 — Node Pool Strategy

Provision node pools by workload need, not by service count.

Possible pools:

```text
general application
critical/on-demand
batch
memory optimized
spot/preemptible non-critical
system add-ons
```

---

# 9448 — Node Pool Versioning

Node image/OS/Kubernetes versions must be controlled and upgradeable.

Avoid indefinitely running obsolete node images.

---

# 9449 — Node Pool Replacement

Prefer replacement/rolling strategies that preserve workload availability.

Before production node replacement validate:

```text
PDB
topology spread
capacity headroom
node drain behavior
```

---

# 9450 — Cluster Autoscaler Foundation

Terraform may provision cluster-autoscaling components/permissions or provider-managed equivalents.

Application HPA behavior remains Kubernetes/application configuration under PART 29/33.

---

# 9451 — Workload Identity Foundation

Terraform provisions the cloud-side identity relationship required for Kubernetes workload identity.

Example conceptual flow:

```text
Kubernetes ServiceAccount
      ↓ federation/trust
Cloud IAM Role / Service Identity
      ↓
Allowed Cloud Resource
```

---

# 9452 — No Shared Cloud Identity

Do not give every workload one shared cloud role.

Separate by capability and risk.

---

# 9453 — Argo CD Bootstrap Boundary

Terraform may bootstrap enough Kubernetes/identity infrastructure for GitOps to begin.

After bootstrap:

```text
Argo CD
→ normal Kubernetes application/platform desired-state controller
```

Avoid Terraform continuing to fight Argo over bootstrapped resources.

---

# 9454 — Bootstrap Options

Possible bootstrap models:

```text
Terraform installs minimal Argo CD once
then Argo manages itself
```

or:

```text
Terraform manages Argo control-plane installation
Argo manages applications
```

Choose one documented ownership model.

---

# 9455 — Managed PostgreSQL Foundation

Terraform may provision:

```text
managed PostgreSQL cluster/instance
network placement
subnet group
security rules
storage
backup settings
encryption
parameter groups
monitoring integration
maintenance window
read replicas where required
```

---

# 9456 — Database-per-Service vs Physical Cluster

PART 07 established logical database ownership.

Terraform may initially provision:

```text
one managed PostgreSQL cluster
+
separate logical databases/roles
```

if approved.

Physical topology does not change domain ownership.

---

# 9457 — Database Credentials

Terraform should provision credential infrastructure without exposing long-lived passwords in source control.

Prefer:

```text
secret manager generated secret
managed database authentication
rotation
workload identity where supported
```

---

# 9458 — Database Master/Admin Credential

Do not distribute master/admin database credentials to applications.

Application roles receive only required privileges.

---

# 9459 — PostgreSQL High Availability

For production Tier-1 data:

```text
multi-zone HA
automatic failover where supported
backup/PITR
monitoring
```

should be evaluated and usually required.

---

# 9460 — PostgreSQL Storage

Configure:

```text
storage type
initial size
autoscaling/max size if supported
IOPS/throughput where needed
```

based on measured workload and growth.

---

# 9461 — PostgreSQL Backup Retention

Retention must follow PART 36 requirements.

Terraform should declare the infrastructure configuration, but restore tests prove the backup is usable.

---

# 9462 — PostgreSQL Deletion Protection

Production database infrastructure should use provider deletion protection and/or Terraform lifecycle safeguards where appropriate.

One protection mechanism alone is insufficient.

---

# 9463 — PostgreSQL Maintenance Window

Declare maintenance windows and understand provider-managed upgrade behavior.

Coordinate with operational change windows for critical systems.

---

# 9464 — Database Parameter Changes

Parameter changes may require:

```text
immediate apply
restart
failover
maintenance window
```

Plan output alone may not reveal all application-level consequences.

---

# 9465 — Database Capacity Change

Increasing database size can be safe; decreasing or changing architecture may require migration.

Treat replacement indications in Terraform plan as high risk.

---

# 9466 — Database Replacement Gate

Any plan showing replacement/destruction of production database resources should require explicit senior approval and backup/restore evidence.

---

# 9467 — Managed Kafka Foundation

Terraform may provision:

```text
Kafka cluster/service
broker capacity
network/subnets
TLS/authentication
storage/retention foundations
monitoring
client connectivity
security groups/firewall
```

---

# 9468 — Kafka Ownership Boundary

Terraform owns cluster infrastructure.

Topic/schema/consumer semantics remain under PART 23 unless the platform deliberately manages selected shared topic configuration as IaC.

---

# 9469 — Kafka Topic Ownership Decision

Two valid models:

```text
A. topics provisioned by dedicated Terraform/platform IaC
B. topics provisioned by approved Kafka admin automation
```

Do not mix ownership unpredictably.

---

# 9470 — Kafka Production Availability

Production Kafka must not be a single failure point.

Provision provider-supported HA consistent with PART 23's broker/replication strategy.

---

# 9471 — Kafka Authentication

Provision strong client authentication such as provider-supported:

```text
mTLS
SASL/IAM-style identity
managed identity
```

Do not create one shared platform password for every service.

---

# 9472 — Kafka ACL Foundation

Infrastructure automation may create service identities and ACL foundations.

Each producer/consumer should receive only needed topic/group permissions.

---

# 9473 — Managed Redis Foundation

Terraform may provision:

```text
managed Redis
private network placement
replication/HA
TLS/auth
parameter policy
memory size
backup/persistence where required
monitoring
maintenance
```

---

# 9474 — Redis Correctness Reminder

PART 24 defines Redis primarily as acceleration/temporary state.

Infrastructure durability does not turn Redis into the authoritative wallet/order/payment database.

---

# 9475 — Redis Eviction Policy

Declare/verify eviction behavior appropriate to each use case.

Do not use one shared Redis cluster with conflicting semantic requirements unless carefully partitioned and capacity-controlled.

---

# 9476 — Redis Isolation

High-risk workloads may require dedicated Redis instances/clusters.

Consider separation for:

```text
rate limiting
session/security state
catalog cache
high-volume ephemeral workloads
```

when noisy-neighbor risk is material.

---

# 9477 — Object Storage Foundation

Terraform may provision buckets/containers for:

```text
application assets
reports
exports
backups
Terraform state
observability archives
integration files
```

Each purpose requires separate policy.

---

# 9478 — Object Storage Security

Production buckets should explicitly define:

```text
public access policy
encryption
versioning where needed
retention/lifecycle
access logging/audit
IAM
```

---

# 9479 — Public Object Storage

Public access must be explicit.

Prefer:

```text
private bucket
+
CDN/signed access
```

when public object access is not inherently required.

---

# 9480 — Object Lifecycle

Declare lifecycle rules for data classes such as:

```text
CI artifacts
logs
backups
exports
temporary uploads
```

Retention must follow business/security requirements.

---

# 9481 — Container Registry Foundation

Terraform may provision registry infrastructure/policies where the registry is organization-managed.

Configure:

```text
repository namespaces
retention
immutability
scanner integration
access roles
```

according to PART 26/32.

---

# 9482 — Registry Write vs Pull Permissions

Separate:

```text
CI push/sign permission
runtime pull permission
admin retention permission
```

Runtime workloads do not need image push rights.

---

# 9483 — IAM Foundation

Terraform should manage cloud IAM infrastructure declaratively where feasible.

Examples:

```text
roles
service identities
policy bindings
OIDC trust
workload identity
CI deployment roles
read-only operator roles
```

---

# 9484 — Least Privilege

Grant permissions to required:

```text
actions
resources
environments
```

Avoid wildcard administrator roles for routine pipelines.

---

# 9485 — CI Identity

CI should use a dedicated identity per environment/risk boundary.

Prefer short-lived federation from GitLab/OIDC or approved runner identity.

---

# 9486 — Production Apply Identity

Production Terraform apply identity should have only permissions required by the production infrastructure roots it owns.

It should not automatically be cluster-admin, database superuser, or organization administrator unless explicitly required.

---

# 9487 — Human Infrastructure Access

Human roles should be distinct from CI roles.

Typical:

```text
viewer
planner
operator
platform admin
break-glass
```

---

# 9488 — Break-Glass Infrastructure Role

Break-glass access requires:

```text
MFA
justification
time-bounded access
audit
post-incident review
```

It must not become the normal apply path.

---

# 9489 — KMS Foundation

Terraform may provision encryption keys and policies for:

```text
state
PostgreSQL
Kafka
Redis where supported
object storage
secrets
logs
backups
```

---

# 9490 — KMS Key Separation

Separate keys where required by:

```text
environment
data classification
service ownership
compliance
blast radius
```

Do not use one universal key merely for convenience.

---

# 9491 — KMS Rotation

Enable provider-supported key rotation or define a deliberate rotation procedure.

Test impact on encrypted resources and restored backups.

---

# 9492 — KMS Deletion Protection

Key deletion can make data unrecoverable.

Use:

```text
deletion waiting period
restricted IAM
change approval
monitoring
```

for production keys.

---

# 9493 — Secret Manager Foundation

Terraform may create:

```text
secret containers/paths
access policies
rotation resources
workload identity bindings
replication policy
KMS configuration
```

---

# 9494 — Secret Values and Terraform

Avoid managing raw production secret values directly in normal Terraform variables when that would persist them into state.

Prefer external generation/rotation mechanisms whose secret material need not be exposed to Terraform where possible.

---

# 9495 — Secret Reference Output

Terraform should commonly output:

```text
secret identifier / ARN / path
```

rather than the secret value.

---

# 9496 — Kubernetes External Secrets Foundation

Terraform may provision:

```text
cloud IAM trust
secret-manager policy
cluster integration prerequisites
```

while Argo CD/Kubernetes manifests define the workload-level secret reference.

---

# 9497 — Observability Infrastructure Foundation

Terraform may provision shared observability infrastructure such as:

```text
metrics storage
log storage
trace backend
object storage
managed Grafana/monitoring services
collector network endpoints
alert integration foundations
```

---

# 9498 — Observability Ownership Boundary

Terraform provisions the infrastructure.

PART 31 defines:

```text
telemetry semantics
dashboards
alerts
SLIs/SLOs
runbooks
```

Those may be delivered by GitOps or observability configuration tooling.

---

# 9499 — Audit Infrastructure

Provision durable audit sources where supported:

```text
cloud API audit log
Kubernetes control-plane audit
IAM changes
KMS activity
network flow logs
load balancer access logs
```

Retention follows security policy.

---

# 9500 — Backup Infrastructure

Terraform may provision:

```text
backup vaults
snapshot policies
retention
cross-account copies
cross-region copies
backup KMS keys
access roles
```

PART 36 defines complete backup/DR behavior.

---

# 9501 — Backup Independence

Where risk requires it, backups should be isolated from the same credentials/account used to modify production primary data.

This reduces destructive-credential blast radius.

---

# 9502 — DR Infrastructure

Terraform should make disaster-recovery infrastructure reproducible.

Possible models:

```text
warm standby
pilot light
on-demand recreation
active-active
```

The business RTO/RPO determines the model.

---

# 9503 — DR Region Configuration

DR configuration must explicitly declare:

```text
region
network
capacity
DNS/failover
backup source
KMS/access
cluster/data dependencies
```

---

# 9504 — IaC Does Not Equal DR

Having Terraform code is not proof of disaster recovery.

DR requires tested:

```text
apply
restore
DNS/traffic failover
secret recovery
application recovery
data reconciliation
```

---

# 9505 — Terraform Workflow

Normal change flow:

```text
branch
  ↓
edit Terraform
  ↓
format/validate/test
  ↓
merge request
  ↓
CI speculative plan
  ↓
review plan
  ↓
approval
  ↓
final apply plan
  ↓
apply
  ↓
post-apply verification
```

---

# 9506 — Format Gate

Run:

```text
terraform fmt -check
```

in CI.

Formatting failures should fail the merge request pipeline.

---

# 9507 — Validate Gate

Run:

```text
terraform validate
```

after initialization.

This validates configuration structure but does not replace plan or integration tests.

---

# 9508 — Terraform Test

Use `terraform test` for reusable/root module behavior where valuable.

Tests may verify:

```text
module outputs
input-driven resource configuration
policy assumptions
plan/apply assertions
```

---

# 9509 — Terraform Tests May Create Infrastructure

Some Terraform tests may perform apply operations.

Therefore test environments require:

```text
isolated credentials
bounded cost
cleanup
unique naming
no production access
```

---

# 9510 — Static Analysis

Infrastructure CI should include selected static analysis such as:

```text
Terraform lint
security misconfiguration scan
policy checks
secret scan
```

Use one approved toolchain rather than redundant noisy scanners.

---

# 9511 — Speculative Plan

Merge requests should produce a plan against the intended target state without applying it.

Reviewers must be able to see:

```text
create
update
replace
destroy
```

summary and important resource details.

---

# 9512 — Plan Is Security-Sensitive

Terraform plan files can contain sensitive information.

Do not expose raw production plan artifacts publicly or retain them without access controls.

---

# 9513 — Human-Readable Plan Artifact

CI may publish a sanitized plan summary for review.

Preserve enough detail to identify:

```text
resource address
action
replacement
sensitive changes hidden
```

---

# 9514 — Plan Exit Code

Automation may use Terraform detailed plan exit codes to distinguish:

```text
no change
error
change present
```

This is useful for drift and pipeline logic.

---

# 9515 — Final Plan Before Apply

A merge-request plan is evidence, not necessarily the exact final apply plan.

Before apply:

```text
refresh current state
produce final plan
verify approvals/policy
apply controlled plan
```

because infrastructure may have changed since MR review.

---

# 9516 — Saved Plan Workflow

For controlled automation:

```text
terraform plan -out=tfplan
      ↓
policy/review
      ↓
terraform apply tfplan
```

ensures the apply executes that saved plan.

Protect the plan artifact.

---

# 9517 — Plan Freshness

Do not apply a stale saved plan after unrelated infrastructure changes.

Use pipeline/environment locking and regenerate when assumptions are invalidated.

---

# 9518 — Apply Serialization

Only one normal apply should run against one Terraform state at a time.

Use:

```text
backend locking
CI resource/environment lock
```

for defense in depth.

---

# 9519 — Direct Local Apply

Production `terraform apply` from a developer laptop should not be the normal process.

Use controlled CI or approved infrastructure automation.

---

# 9520 — Production Apply Approval

Production apply should require explicit authorization based on change risk.

Possible controls:

```text
protected branch
CODEOWNERS
manual protected job
change ticket
security/DBA approval for sensitive resources
```

---

# 9521 — Separation of Duties

For high-risk infrastructure, the author should not be the sole approver and executor.

Use organizational policy appropriate to team size and risk.

---

# 9522 — Apply Logs

Retain audit data for:

```text
commit SHA
pipeline ID
actor/approver
Terraform version
provider lock revision
plan summary
apply result
state target
```

---

# 9523 — Post-Apply Verification

After apply, verify the intended outcome.

Examples:

```text
cluster API reachable through approved path
database healthy
Kafka brokers healthy
Redis reachable privately
DNS resolves
backup policy active
monitoring receives data
```

---

# 9524 — Apply Failure

If apply partially fails:

```text
stop
inspect state
inspect real resources
understand provider error
re-plan
```

Do not automatically rerun indefinitely.

---

# 9525 — Terraform Is Incremental

A failed apply may have successfully created/changed earlier resources.

Do not assume:

```text
failed apply = nothing changed
```

Always re-plan.

---

# 9526 — Retry Policy

Retry infrastructure operations only when failure is understood to be transient and the provider/resource operation is safe to repeat.

Avoid unbounded pipeline retries.

---

# 9527 — Drift

Drift means:

```text
real infrastructure
!=
Terraform desired configuration/state expectation
```

It may result from:

```text
manual console change
external controller
provider behavior
emergency action
managed-service auto-change
```

---

# 9528 — Scheduled Drift Plan

Run scheduled read-only plans for critical roots.

Report:

```text
no change
expected managed drift
unexpected drift
error/unreachable provider
```

---

# 9529 — Drift Is Not Always Malicious

Some services mutate provider-computed fields automatically.

Determine whether drift is:

```text
expected
provider-computed
owned externally
unauthorized
```

before reconciling.

---

# 9530 — Drift Remediation

Preferred:

```text
change Terraform to desired truth
or
revert unauthorized live change
```

Do not blindly apply when a legitimate emergency/manual change has not yet been modeled.

---

# 9531 — Emergency Console Change

If production requires emergency manual infrastructure change:

```text
use break-glass
record exact change
stabilize service
update Terraform immediately afterward
plan
reconcile
close incident/change record
```

---

# 9532 — Ignore Changes

Use lifecycle `ignore_changes` only when another system legitimately owns an attribute or provider behavior requires it.

Every ignored field needs documented ownership.

---

# 9533 — Ignore Changes Anti-Pattern

Do not use:

```text
ignore_changes = all
```

as a shortcut to silence unexplained production drift.

It undermines IaC ownership.

---

# 9534 — Prevent Destroy

For selected critical resources, `prevent_destroy` can provide an additional safety barrier.

Candidate examples:

```text
production database
critical storage
state backend resources
```

---

# 9535 — Prevent Destroy Limitation

Lifecycle protection is not a complete deletion-protection strategy.

Use provider-level deletion protection, IAM restrictions, backups, review, and policy controls as additional layers.

---

# 9536 — Create Before Destroy

Use `create_before_destroy` only when:

```text
provider/resource supports parallel old/new resources
names allow coexistence
capacity allows overlap
traffic cutover is safe
```

---

# 9537 — Replacement Review

Any `-/+` or replacement action on critical resources should be highlighted in CI.

High-risk replacements include:

```text
VPC/subnet
cluster
load balancer
KMS key
database
Kafka cluster
Redis cluster
```

---

# 9538 — Destroy Review

Destruction of production infrastructure must require explicit review.

Do not allow a generic pipeline to auto-destroy production because a resource disappeared from one commit.

---

# 9539 — `terraform destroy`

Production full-destroy should normally be denied or strongly protected.

Legitimate destruction requires a decommission plan, data-retention confirmation, and ownership approval.

---

# 9540 — Ephemeral Environment Destroy

For ephemeral CI/test infrastructure, automated destroy is appropriate.

Require:

```text
TTL/owner tag
bounded resources
cleanup job
orphan detection
```

---

# 9541 — Import Existing Infrastructure

Brownfield resources should be adopted deliberately.

Flow:

```text
inventory live resource
      ↓
write matching Terraform resource/module config
      ↓
add import definition
      ↓
plan
      ↓
resolve unintended diff
      ↓
apply import
      ↓
verify stable no-op plan
```

---

# 9542 — Declarative Import

Prefer configuration-driven import blocks where supported for reviewable adoption.

This makes resource adoption visible in code review and plan output.

---

# 9543 — Import Does Not Reconfigure Safely by Itself

After import, Terraform compares configuration against live attributes.

A poorly matched configuration can propose destructive changes.

Always review the post-import plan.

---

# 9544 — Import Inventory

For each adopted resource record:

```text
cloud/provider ID
current owner
intended module/state
criticality
backup status
dependencies
maintenance window
```

---

# 9545 — Refactoring Resource Addresses

When moving resources between module addresses, use supported Terraform refactoring/move mechanisms so state identity follows the resource without destroy/recreate.

---

# 9546 — Refactor Plan Gate

After address/module refactor, expected plan should ideally show:

```text
move
```

not:

```text
destroy old
create new
```

unless replacement is intended.

---

# 9547 — Moving Between States

Moving resources between separate state backends is higher risk.

Require:

```text
state backup
exclusive locks
source/target ownership confirmation
exact resource addresses
post-move plans on both states
```

---

# 9548 — Cross-State Dependencies

Avoid excessive cross-state output coupling.

Prefer stable infrastructure contracts such as:

```text
DNS
secret/reference name
service discovery
well-defined remote output
```

rather than a dense web of state dependencies.

---

# 9549 — Remote State Data

If one root reads another root's state, remember it may gain access to all data exposed by that backend depending on mechanism.

Use least privilege and avoid exposing sensitive values unnecessarily.

---

# 9550 — Provider Data Sources

Data sources are useful for discovering externally managed infrastructure.

But too much implicit discovery can make plans environment-dependent and hard to understand.

Prefer explicit identifiers for critical dependencies.

---

# 9551 — Policy as Code

Infrastructure policy should enforce organization rules before apply.

Examples:

```text
no public production database
mandatory encryption
mandatory tags
approved regions
no unrestricted security group
minimum backup retention
no public object storage by default
```

---

# 9552 — Policy Layers

Defense in depth may include:

```text
Terraform/module validation
CI policy engine
cloud organization policy
Kubernetes admission policy
security scanner
```

Each layer owns a different boundary.

---

# 9553 — Advisory vs Mandatory Policy

Policies may be:

```text
advisory
mandatory
```

Critical security/infrastructure invariants should not depend solely on reviewer memory.

---

# 9554 — Policy Exception

Exception requires:

```text
reason
owner
risk assessment
scope
expiry
compensating control
```

Avoid permanent undocumented suppressions.

---

# 9555 — Security Scanning

Terraform CI should detect common risky configuration such as:

```text
public DB
open firewall
unencrypted storage
public bucket
weak logging
broad IAM
```

before apply.

---

# 9556 — Secret Scanning

Scan Terraform repositories and CI logs for accidental:

```text
private keys
cloud credentials
passwords
tokens
certificate secrets
```

---

# 9557 — Plan Secret Leakage

A source file may contain no secret while provider-generated plan/state still contains sensitive values.

Treat infrastructure artifacts accordingly.

---

# 9558 — Supply-Chain Integrity

Infrastructure automation should pin and verify:

```text
Terraform version
providers
modules
CI images
security tools
```

as appropriate.

---

# 9559 — Provider Source Governance

Use approved provider registries/sources.

Third-party providers require security and maintenance review before production use.

---

# 9560 — Module Source Governance

Do not consume random public Terraform modules directly in production without review.

Prefer:

```text
internal approved modules
verified upstream modules
version-pinned dependencies
```

---

# 9561 — Cost Governance

Terraform plan/review should consider cost impact.

High-cost changes include:

```text
larger database class
more brokers
larger Redis memory
new NAT gateway
additional load balancer
cross-region replication
large node pool
```

---

# 9562 — Cost Tags

Infrastructure resources should support attribution through tags/labels such as:

```text
environment
team
service
cost_center
project
```

---

# 9563 — Cost Estimate Gate

Where tooling is available, MR pipelines may show estimated monthly cost delta.

Use as decision support, not as a substitute for architecture review.

---

# 9564 — Budget Alerts

Provision environment/platform budget alerts through approved cloud tooling where appropriate.

Alert owners must be defined.

---

# 9565 — Non-Production Cost Controls

Possible controls:

```text
smaller capacity
off-hours node scale-down
ephemeral test resources
shorter log retention
scheduled environment shutdown where safe
```

Do not compromise required UAT/performance fidelity silently.

---

# 9566 — Resource Quotas Outside Kubernetes

Cloud-side quotas can affect:

```text
IPs
load balancers
CPU instances
volumes
DB instances
Kafka capacity
API rate limits
```

Capacity planning must include provider quotas.

---

# 9567 — Quota Monitoring

Monitor important quota consumption before production growth causes provisioning failures.

---

# 9568 — Infrastructure Observability

Monitor infrastructure created by Terraform.

Examples:

```text
cluster health
node capacity
DB CPU/connections/storage
Kafka broker/partition health
Redis memory/evictions
NAT/egress errors
load balancer health
backup failures
KMS/secret errors
```

---

# 9569 — Terraform Operational Metrics

Track delivery metrics such as:

```text
plan failures
apply failures
apply duration
drift count
emergency changes
state lock contention
rollback/recovery events
```

---

# 9570 — Change Annotation

Successful infrastructure changes should emit or record change metadata so PART 31 can correlate incidents with:

```text
infrastructure apply
cluster upgrade
DB resize
network change
KMS/secret-policy change
```

---

# 9571 — Infrastructure Change Window

High-risk production changes may require a controlled window.

Examples:

```text
network route change
cluster upgrade
database engine upgrade
Kafka resize
KMS policy migration
```

---

# 9572 — Maintenance Communication

Infrastructure changes with user-impact potential need:

```text
owner
change window
impact expectation
rollback/forward-fix plan
monitoring plan
stakeholder notification
```

---

# 9573 — Database Engine Upgrade

Treat major engine upgrades as projects.

Validate:

```text
application driver compatibility
extensions
migration path
downtime/failover
backup restore
performance
```

before production.

---

# 9574 — Kafka Platform Upgrade

Validate:

```text
broker/client compatibility
protocol versions
rebalancing behavior
storage
replication
consumer lag
```

in lower environments first.

---

# 9575 — Redis Upgrade

Validate:

```text
client compatibility
persistence mode
eviction behavior
failover
TLS/auth
memory use
```

before production change.

---

# 9576 — Cluster Upgrade

Kubernetes upgrade evidence includes:

```text
API compatibility
add-on compatibility
node drain
PDB behavior
workload readiness
HPA/metrics
networking
storage
```

---

# 9577 — Infrastructure Testing Pyramid

Recommended:

```text
format / validate
      ↓
module unit tests / mocked tests
      ↓
static/security/policy checks
      ↓
speculative plan
      ↓
ephemeral integration apply
      ↓
environment apply
      ↓
post-apply smoke / resilience tests
```

---

# 9578 — Module Unit Tests

Use Terraform-native tests or approved test frameworks for reusable module behavior.

Test important defaults and invariants, not provider implementation trivia.

---

# 9579 — Mocked Infrastructure Tests

Mock providers can validate module logic without real cloud resources where appropriate.

Use real integration environments for behavior mocks cannot prove.

---

# 9580 — Ephemeral Integration Test

For critical reusable modules, create short-lived infrastructure in a dedicated test account/project.

Flow:

```text
create
verify
exercise
 destroy
```

with cleanup guarantees.

---

# 9581 — Destructive Test Isolation

Never run destructive Terraform tests with credentials that can access production.

---

# 9582 — Network Module Tests

Validate:

```text
CIDRs
subnet count
route intent
private/public exposure
egress path
required flow logs
```

---

# 9583 — Kubernetes Module Tests

Validate:

```text
cluster version
endpoint policy
node pools
logging
identity integration
encryption
required tags
```

Then run workload-level checks after cluster creation.

---

# 9584 — Database Module Tests

Validate:

```text
private placement
encryption
backup retention
HA
deletion protection
monitoring
parameter policy
```

---

# 9585 — Kafka Module Tests

Validate:

```text
HA
network isolation
encryption
authentication
monitoring
storage/capacity
```

---

# 9586 — Redis Module Tests

Validate:

```text
private placement
TLS/auth
HA where required
memory policy
monitoring
maintenance
```

---

# 9587 — Policy Tests

Policy rules themselves need tests.

Example cases:

```text
public DB rejected
private DB accepted
unencrypted bucket rejected
required production tags accepted
```

---

# 9588 — Drift Test

Periodically verify that a no-change production root produces an empty plan.

Unexpected non-empty plan becomes an investigation signal.

---

# 9589 — Recovery Test

Test recovery of:

```text
Terraform runner
state backend
provider access
module registry/source
critical root initialization
```

without relying on one engineer's laptop.

---

# 9590 — State Restore Exercise

In a controlled environment:

```text
restore prior state version
reinitialize
plan
verify resource mapping
```

Do not practice destructive state restoration directly on production without a formal procedure.

---

# 9591 — Bootstrap Recovery

Document how to rebuild:

```text
state backend access
CI identity
Terraform runner
network foundation
Kubernetes cluster
GitOps bootstrap
```

in dependency order.

---

# 9592 — Dependency Order

Conceptual infrastructure bootstrap:

```text
Organization / Account
      ↓
State Backend + CI Identity
      ↓
Network
      ↓
KMS / Secrets Foundation
      ↓
Kubernetes + Data Services
      ↓
GitOps Bootstrap
      ↓
Applications
```

Exact order depends on provider architecture.

---

# 9593 — Circular Dependency Warning

Avoid designs where:

```text
Terraform backend requires cluster
cluster creation requires Terraform backend
```

or:

```text
CI identity requires Argo
Argo cluster requires CI identity
```

Bootstrap dependencies must be acyclic.

---

# 9594 — Infrastructure Outputs to GitOps

Terraform outputs may need to inform GitOps configuration.

Examples:

```text
cluster identifier
load balancer class
workload identity role IDs
secret manager path
DNS zone
```

Use a controlled handoff rather than manual copy/paste where possible.

---

# 9595 — Avoid Secret Output Handoff

Do not pass secret values from Terraform state into GitOps repositories.

Pass references and identities.

---

# 9596 — Terraform and Argo CD Handoff

A healthy boundary:

```text
Terraform
  creates cluster
  creates cloud IAM/KMS/network/data foundations
      ↓
Argo CD
  reconciles Kubernetes application/platform resources
```

Each side knows the other's contract but not the other's internals.

---

# 9597 — Terraform and External Controllers

Cloud/Kubernetes controllers may create secondary resources such as:

```text
load balancers
DNS records
volumes
network interfaces
```

Define whether Terraform owns the parent configuration or the generated child resources.

Do not import controller-generated children casually.

---

# 9598 — Cloud Load Balancer Ownership

Example:

```text
Kubernetes Gateway/Service
      ↓ controller
Cloud Load Balancer
```

If this is the chosen model, Terraform should not also independently manage the same load balancer lifecycle.

---

# 9599 — Infrastructure Decommission

Decommission requires a plan for:

```text
traffic removal
data retention
backup/archive
DNS
credentials
monitoring
cost
state cleanup
resource destruction
```

---

# 9600 — Decommission Sequence

Typical:

```text
disable new traffic
      ↓
confirm no dependency
      ↓
archive/retain required data
      ↓
remove application dependency
      ↓
remove infrastructure through Terraform
      ↓
verify billing/resources
```

---

# 9601 — Resource Removal from Code

Deleting a Terraform resource block may propose destruction.

Review removal as a potentially destructive production change.

---

# 9602 — Stop Managing Without Destroying

If infrastructure must remain but Terraform should stop owning it, use an explicit state-removal/refactoring process rather than deleting code and blindly applying.

Document the new owner.

---

# 9603 — Orphan Resource Detection

Periodically identify resources that are:

```text
not in Terraform
not owned by a controller
not documented
still generating cost or exposure
```

---

# 9604 — Manual Resource Creation Policy

Production console-created resources are prohibited by default except documented emergency/bootstrap exceptions.

All surviving resources must be brought under an approved ownership model.

---

# 9605 — Infrastructure Inventory

Maintain an inventory/service catalog linking:

```text
resource/service
owner
environment
Terraform root/state
repository
criticality
runbook
cost center
```

---

# 9606 — Runbook: Terraform Apply Failure

Runbook:

```text
1. Stop automatic retry.
2. Read Terraform/provider error.
3. Inspect what already changed.
4. Confirm state backend write succeeded.
5. Re-run plan.
6. Decide forward-fix vs recovery.
7. Verify infrastructure health.
8. Record incident/change outcome.
```

---

# 9607 — Runbook: State Lock Stuck

```text
1. Identify lock owner and pipeline.
2. Confirm no active apply.
3. Inspect backend health.
4. Preserve audit information.
5. Force-unlock only if safe.
6. Re-plan before apply.
```

---

# 9608 — Runbook: Unexpected Destroy Plan

```text
1. Do not apply.
2. Identify configuration/state/provider change.
3. Check resource address/module refactor.
4. Check provider version change.
5. Check import/state movement.
6. Verify live resource.
7. Correct configuration/state safely.
8. Require re-review.
```

---

# 9609 — Runbook: State Missing Resource

```text
1. Confirm live resource exists.
2. Confirm correct state/root.
3. Check prior state versions.
4. Determine whether import is appropriate.
5. Write matching configuration.
6. Plan before adoption.
7. Verify no destructive diff.
```

---

# 9610 — Runbook: Provider Upgrade Regression

```text
1. Stop production promotion.
2. Compare provider lock diff.
3. Review provider breaking changes.
4. Test prior provider version.
5. Decide downgrade or configuration migration.
6. Re-run non-production plan/apply.
```

---

# 9611 — Runbook: Drift Detected

```text
1. Identify resource and changed attribute.
2. Identify actor/controller.
3. Determine intended truth.
4. Check incident/emergency change.
5. Update Terraform or revert live change.
6. Apply through normal workflow.
7. Close drift record.
```

---

# 9612 — Runbook: Backend Unavailable

```text
1. Stop applies.
2. Confirm backend service health.
3. Avoid creating new local production state.
4. Restore backend access/service.
5. Verify latest state version.
6. Reinitialize.
7. Plan before any apply.
```

---

# 9613 — Runbook: Accidental Infrastructure Deletion

```text
1. Declare incident.
2. Stop conflicting Terraform/Argo activity.
3. Assess data/resource loss.
4. Restore from provider backup/snapshot if required.
5. Recreate missing infrastructure through approved IaC.
6. Restore data.
7. Reconcile GitOps applications.
8. Validate SLO/business state.
9. Postmortem.
```

---

# 9614 — Architecture Review Checklist

## Ownership

- [ ] Terraform resource ownership is explicit.
- [ ] No Terraform/Argo double ownership.
- [ ] State boundary matches blast radius.
- [ ] Repository owner is defined.

## Versions

- [ ] Terraform version constrained.
- [ ] Providers constrained.
- [ ] `.terraform.lock.hcl` committed for root modules.
- [ ] Modules versioned immutably.

## State

- [ ] Remote backend.
- [ ] Locking enabled where supported.
- [ ] Encryption enabled.
- [ ] Version/recovery enabled.
- [ ] State access least-privilege.

---

# 9615 — Network / Platform Review Checklist

- [ ] Environment/account isolation.
- [ ] CIDRs non-overlapping.
- [ ] Private subnet strategy.
- [ ] Egress architecture explicit.
- [ ] Stable partner egress where needed.
- [ ] Private endpoints evaluated.
- [ ] DNS ownership explicit.
- [ ] Kubernetes endpoint exposure reviewed.
- [ ] Node-pool strategy defined.
- [ ] Workload identity foundation configured.

---

# 9616 — Data Infrastructure Review Checklist

- [ ] PostgreSQL private/encrypted.
- [ ] PostgreSQL HA policy.
- [ ] Backup/PITR configured.
- [ ] Database deletion protection.
- [ ] Kafka HA/encryption/authentication.
- [ ] Kafka ACL ownership.
- [ ] Redis TLS/auth/HA as required.
- [ ] Redis eviction policy understood.
- [ ] Object-storage public access controlled.
- [ ] Storage lifecycle/retention configured.

---

# 9617 — IAM / Security Review Checklist

- [ ] CI uses short-lived identity.
- [ ] Production apply role is scoped.
- [ ] Human roles separate from CI.
- [ ] Break-glass defined.
- [ ] KMS policies least-privilege.
- [ ] Key deletion protected.
- [ ] Secret values avoided in Terraform state where possible.
- [ ] Security scan passes.
- [ ] Policy checks pass.
- [ ] Secret scan passes.

---

# 9618 — CI / Change Review Checklist

- [ ] `fmt` passes.
- [ ] `validate` passes.
- [ ] module tests pass.
- [ ] policy/security checks pass.
- [ ] speculative plan attached/reviewable.
- [ ] destroy/replacement actions highlighted.
- [ ] cost impact reviewed where material.
- [ ] final plan generated before apply.
- [ ] production approval enforced.
- [ ] apply serialized.
- [ ] post-apply verification runs.

---

# 9619 — State / Recovery Review Checklist

- [ ] Backend recovery procedure exists.
- [ ] State version restore tested.
- [ ] Force-unlock runbook exists.
- [ ] State surgery restricted.
- [ ] Import procedure documented.
- [ ] Address refactoring uses supported move mechanism.
- [ ] Critical resources protected from accidental destroy.
- [ ] DR bootstrap dependency order documented.

---

# 9620 — Production Readiness Checklist

Before Terraform manages production infrastructure:

- [ ] Production account/project isolation implemented.
- [ ] Remote encrypted/versioned state backend available.
- [ ] State locking enabled where supported.
- [ ] CI identity uses short-lived authentication.
- [ ] Production apply job protected.
- [ ] Terraform/provider versions controlled.
- [ ] Module versions pinned.
- [ ] State roots are appropriately partitioned.
- [ ] Network/CIDR architecture approved.
- [ ] Kubernetes cluster and node pools validated.
- [ ] PostgreSQL HA/backup/deletion protection validated.
- [ ] Kafka HA/security/monitoring validated.
- [ ] Redis security/capacity/eviction validated.
- [ ] KMS/secret-manager foundations validated.
- [ ] Cloud audit logs enabled.
- [ ] Infrastructure monitoring enabled.
- [ ] Mandatory tags/policies enforced.
- [ ] Drift detection scheduled.
- [ ] Backup and state recovery tested.
- [ ] Critical destructive plans require explicit approval.
- [ ] Terraform/Argo ownership map approved.
- [ ] Infrastructure runbooks available.

---

# 9621 — Infrastructure Anti-Patterns

Reject:

```text
production local state
one giant state for the entire platform
one state per trivial resource
unversioned providers
mutable module branches in production
static admin cloud keys in CI
manual production apply from laptop
public databases by default
one shared IAM role for every workload
secret values committed in tfvars
Terraform and Argo owning same Kubernetes object
ignore_changes used to hide unexplained drift
unreviewed destroy/replace plans
production import without matching configuration
copy-pasted environment trees that drift independently
```

---

# 9622 — Minimum Viable Terraform Standard

Every production infrastructure root must have:

```text
remote backend
state locking where supported
state encryption
versioned state recovery
Terraform version constraint
provider version constraints
provider lock file
reviewed modules
CI format/validate/plan
protected apply
short-lived credentials
mandatory tags
security/policy checks
drift detection
recovery runbook
```

---

# 9623 — Initial Implementation Order

Recommended implementation order:

```text
1. Define Terraform ownership boundaries
2. Create state-backend bootstrap
3. Define CI/OIDC apply identities
4. Standardize Terraform/provider versions
5. Create repository/root/state layout
6. Build naming/tagging module standards
7. Build network module
8. Build KMS/secret foundations
9. Build Kubernetes module
10. Build PostgreSQL module
11. Build Kafka module
12. Build Redis module
13. Build object-storage module
14. Add observability/audit foundations
15. Add policy/security scans
16. Add plan/apply workflow
17. Add drift detection
18. Add backup/DR infrastructure
19. Test import/refactor/state recovery
20. Bootstrap Argo CD integration
```

---

# 9624 — Terraform Governance

Platform governance should define:

```text
approved Terraform versions
approved providers
approved module catalog
state backend standard
naming/tagging standard
CI workflow
apply permissions
production approval rules
policy exceptions
upgrade cadence
break-glass procedure
```

---

# 9625 — Module Catalog

Maintain a discoverable module catalog with:

```text
module name
owner
version
purpose
inputs/outputs
examples
security profile
supported provider versions
upgrade notes
```

---

# 9626 — Infrastructure Service Catalog

For each infrastructure capability record:

```text
owner
Terraform root
state backend
cloud account/project
region
criticality
runbook
dashboards
backup policy
DR policy
```

---

# 9627 — Definition of Done: New Module

A reusable module is done when:

- [ ] Purpose is clear.
- [ ] Inputs are typed and documented.
- [ ] Important inputs have validation.
- [ ] Outputs are minimal and documented.
- [ ] Provider requirements declared.
- [ ] Secure defaults used.
- [ ] Naming/tagging integrated.
- [ ] Tests exist for critical behavior.
- [ ] Example usage exists.
- [ ] Breaking-change policy exists.
- [ ] Version/tag released.

---

# 9628 — Definition of Done: New Infrastructure Root

A root is done when:

- [ ] Backend configured.
- [ ] Locking/recovery configured.
- [ ] Terraform/provider versions controlled.
- [ ] CI identity defined.
- [ ] Environment ownership defined.
- [ ] Required modules pinned.
- [ ] Plan pipeline works.
- [ ] Apply protection works.
- [ ] Drift plan works.
- [ ] Runbook exists.

---

# 9629 — Definition of Done: Production Change

A production infrastructure change is done when:

- [ ] Merge request reviewed.
- [ ] Plan reviewed.
- [ ] Policy/security checks passed.
- [ ] Destruction/replacement understood.
- [ ] Backup/recovery impact understood.
- [ ] Apply completed.
- [ ] Post-apply health verified.
- [ ] Observability change annotation recorded.
- [ ] Documentation/runbook updated if needed.

---

# 9630 — Definition of Done: Imported Resource

- [ ] Correct live resource identified.
- [ ] Correct owner/state selected.
- [ ] Matching Terraform configuration written.
- [ ] Import reviewed.
- [ ] Post-import plan contains no unintended destructive change.
- [ ] Tags/policies reconciled deliberately.
- [ ] Stable follow-up plan verified.

---

# 9631 — Definition of Done: Infrastructure Recovery

- [ ] State accessible/recovered.
- [ ] Provider credentials restored.
- [ ] Terraform initialization works.
- [ ] Plan explains current infrastructure.
- [ ] Critical network/data services healthy.
- [ ] GitOps bootstrap restored if needed.
- [ ] Application reconciliation succeeds.
- [ ] Audit/incident record complete.

---

# 9632 — Exit Criteria

PART 34 is complete when the team can answer:

### Ownership

```text
Which resources belong to Terraform, which belong to Argo CD/controllers, and is there any overlap?
```

### State

```text
Where is each production state stored, locked, encrypted, versioned, and who may read/write it?
```

### Supply Chain

```text
Which Terraform/provider/module versions are approved and reproducible?
```

### Change Control

```text
Can reviewers see every create/update/replace/destroy before a protected production apply?
```

### Identity

```text
Can CI apply infrastructure without long-lived administrator credentials?
```

### Network

```text
Can the platform recreate VPC/subnets/routes/egress/private connectivity from code?
```

### Runtime

```text
Can Kubernetes clusters/node pools be recreated and upgraded through a tested workflow?
```

### Data

```text
Are PostgreSQL, Kafka, Redis, storage, backup, encryption, and deletion protections explicit and tested?
```

### Drift

```text
Can unauthorized infrastructure drift be detected and reconciled?
```

### Brownfield

```text
Can existing resources be imported without accidental replacement?
```

### Recovery

```text
Can state, infrastructure foundations, cluster, and GitOps bootstrap be recovered without relying on one person's workstation?
```

### Destruction

```text
What prevents an accidental production destroy or critical resource replacement?
```

If these answers are clear, automated where practical, and tested, the platform has a production-grade Infrastructure-as-Code foundation.

---

# 9633 — Handoff to PART 35

PART 35 defines Security Hardening.

```text
PART 34
Infrastructure / Terraform
      ↓
Reproducible Infrastructure + Identity + Encryption Foundations
      ↓
PART 35
Security Hardening
```

PART 35 will harden the complete platform across:

```text
Threat Modeling
Security Baselines
Operating System / Container Hardening
Kubernetes Admission Controls
Pod Security
Seccomp / Capabilities
Image Trust / Signature Enforcement
Software Supply Chain
SBOM Governance
Dependency / CVE Management
Secrets Hardening
Key Rotation
IAM Hardening
Service-to-Service Security
Network Segmentation
WAF / DDoS
API Abuse Protection
Database Security
Kafka Security
Redis Security
Audit / SIEM
Vulnerability Management
Penetration Testing
Security Incident Response
Security Exceptions
Compliance Evidence
```

The key transition is:

```text
PART 34
= provision secure-capable infrastructure foundations

PART 35
= systematically harden those foundations and workloads against attack and misuse
```

---

# PART 34 — Summary

Infrastructure / Terraform converts platform infrastructure into reviewable, reproducible, recoverable code.

The infrastructure ownership model is:

```text
Terraform
  ├── Accounts / Projects
  ├── Network
  ├── Kubernetes Cluster / Node Pools
  ├── PostgreSQL
  ├── Kafka
  ├── Redis
  ├── Object Storage
  ├── IAM / Workload Identity
  ├── KMS
  ├── Secret-Manager Foundations
  ├── Backup Foundations
  └── Shared Observability Foundations

Argo CD
  └── Kubernetes Application / Platform Desired State
```

The normal change flow is:

```text
Terraform Change
      ↓
Format / Validate / Test
      ↓
Security + Policy Checks
      ↓
Speculative Plan
      ↓
Merge Request Review
      ↓
Protected Final Plan
      ↓
Approved Apply
      ↓
Post-Apply Verification
      ↓
Drift Monitoring
```

The state model is:

```text
Remote Backend
  + Encryption
  + Locking
  + Version Recovery
  + Least-Privilege Access
  + Controlled CI Identity
```

The most important architecture rules are:

```text
Infrastructure is code and production changes are reviewed.
One resource has one lifecycle controller.
Terraform and Argo CD must not manage the same object independently.
Use remote, encrypted, recoverable state.
Enable state locking where supported.
Partition state by ownership and blast radius.
Commit provider dependency lock files for root configurations.
Pin/version Terraform, providers, and reusable modules.
Use short-lived CI identity rather than static administrator credentials.
Prefer private networking for application and data infrastructure.
Use managed HA services where they meet requirements.
Protect production databases, KMS keys, state, and critical storage from accidental deletion.
Do not place raw production secrets in Git or unnecessarily in Terraform state.
Review every replacement and destroy action explicitly.
Promote infrastructure changes through tested environments.
Detect and investigate drift continuously.
Adopt existing resources through reviewed import workflows.
Use supported resource-move/refactoring mechanisms instead of destructive recreation.
Policy as code enforces critical infrastructure invariants.
Terraform code alone is not backup or disaster recovery; recovery must be tested.
Every production infrastructure root has an owner, state, CI workflow, monitoring, and runbook.
```

The next chapter hardens the infrastructure and workloads built so far:

```text
PART 35 — Security Hardening
```

---

**End of PART 34 — Infrastructure / Terraform**

---

# 8. Implementation Work Breakdown

Source-derived implementation tickets:

```text
TF-001 Define Terraform ownership boundaries
TF-002 Create state-backend bootstrap
TF-003 Define CI/OIDC apply identities
TF-004 Standardize Terraform/provider versions
TF-005 Create repository/root/state layout
TF-006 Build naming/tagging module standards
TF-007 Build network module
TF-008 Build KMS/secret foundations
TF-009 Build Kubernetes module
TF-010 Build PostgreSQL module
TF-011 Build Kafka module
TF-012 Build Redis module
TF-013 Build object-storage module
TF-014 Add observability/audit foundations
TF-015 Add policy/security scans
TF-016 Add plan/apply workflow
TF-017 Add drift detection
TF-018 Add backup/DR infrastructure
TF-019 Test import/refactor/state recovery
TF-020 Bootstrap Argo CD integration
TF-021 Define and implement Infrastructure-as-Code Goals
TF-022 Implement Desired Infrastructure State
TF-023 Define and implement Terraform Responsibilities
TF-024 Define and implement Terraform Non-Responsibilities
TF-025 Define and implement Infrastructure Ownership Matrix
TF-026 Define and implement Repository Strategy
TF-027 Implement Avoid Repository Fragmentation
TF-028 Implement Recommended Repository Layers
TF-029 Implement Root Modules vs Reusable Modules
TF-030 Implement Root Module Responsibility
TF-031 Define and implement Provider Configuration Boundary
TF-032 Define and implement Terraform Version Standard
TF-033 Implement Version Constraint
TF-034 Implement Provider Requirements
TF-035 Implement Dependency Lock File
TF-036 Define and implement Provider Upgrade Policy
TF-037 Implement Provider Upgrade Risk
TF-038 Implement Module Versioning
TF-039 Implement Module Semantic Versioning
TF-040 Implement Module Interface
TF-041 Implement Module Inputs
TF-042 Implement Avoid Giant Modules
TF-043 Implement Avoid Tiny Wrapper Modules
TF-044 Implement Variable Validation
TF-045 Implement Preconditions and Postconditions
TF-046 Implement Module Outputs
TF-047 Implement Sensitive Outputs
TF-048 Implement Terraform State Is Sensitive
TF-049 Implement No Production Local State
TF-050 Define and implement Remote Backend Goals
TF-051 Implement Backend Bootstrap
TF-052 Define and implement Backend Separation
TF-053 Implement State Partitioning
TF-054 Define and implement State Boundary Principle
TF-055 Implement Avoid State-per-Resource
TF-056 Implement and verify State Locking
TF-057 Implement Lock Contention
TF-058 Implement Force Unlock
TF-059 Implement Backend Versioning
TF-060 Implement and verify Backend Encryption
TF-061 Implement and verify Backend Access
TF-062 Implement and verify Backend Credentials
TF-063 Implement and verify State Backup and Recovery
TF-064 Implement State Pull Before Repair
TF-065 Implement State Commands Are Privileged
TF-066 Implement No Manual State Editing by Default
TF-067 Define and implement Environment Model
TF-068 Define and implement Account / Project Isolation
TF-069 Implement Environment Root Composition
TF-070 Implement Environment Values
TF-071 Implement Avoid Environment Forks
TF-072 Implement Production Differences Are Intentional
TF-073 Define and implement Naming Standard
TF-074 Implement Resource Tags / Labels
TF-075 Define and implement Tag Governance
TF-076 Define and implement Region Strategy
TF-077 Implement Multi-Region Is Not Automatic
TF-078 Define and implement Network Foundation Ownership
TF-079 Define and implement Network Module Boundary
TF-080 Implement Private-by-Default Subnets
TF-081 Implement Public Subnet Use
TF-082 Implement CIDR Planning
TF-083 Implement CIDR Change Cost
TF-084 Implement Availability Zones
TF-085 Define and implement Route Ownership
TF-086 Implement Internet Egress
TF-087 Implement and verify Stable Egress Identity
TF-088 Implement Private Endpoints
TF-089 Define and implement DNS Foundations
TF-090 Define and implement DNS Ownership Boundary
TF-091 Define and implement TLS Foundation
TF-092 Implement Kubernetes Cluster Provisioning
TF-093 Implement Managed Kubernetes Preference
TF-094 Implement Kubernetes Version
TF-095 Implement Kubernetes Upgrade Path
TF-096 Implement Cluster Endpoint Exposure
TF-097 Implement Kubernetes Control-Plane Logging
TF-098 Define and implement Node Pool Strategy
TF-099 Implement Node Pool Versioning
TF-100 Implement and verify Node Pool Replacement
TF-101 Define and implement Cluster Autoscaler Foundation
TF-102 Define and implement Workload Identity Foundation
TF-103 Implement and verify No Shared Cloud Identity
TF-104 Define and implement Argo CD Bootstrap Boundary
TF-105 Implement Bootstrap Options
TF-106 Define and implement Managed PostgreSQL Foundation
TF-107 Implement Database-per-Service vs Physical Cluster
TF-108 Implement and verify Database Credentials
TF-109 Implement Database Master/Admin Credential
TF-110 Implement PostgreSQL High Availability
TF-111 Implement PostgreSQL Storage
TF-112 Implement and verify PostgreSQL Backup Retention
TF-113 Implement and verify PostgreSQL Deletion Protection
TF-114 Implement PostgreSQL Maintenance Window
TF-115 Implement Database Parameter Changes
TF-116 Implement Database Capacity Change
TF-117 Implement and verify Database Replacement Gate
TF-118 Define and implement Managed Kafka Foundation
TF-119 Define and implement Kafka Ownership Boundary
TF-120 Define and implement Kafka Topic Ownership Decision
TF-121 Implement Kafka Production Availability
TF-122 Implement Kafka Authentication
TF-123 Define and implement Kafka ACL Foundation
TF-124 Define and implement Managed Redis Foundation
TF-125 Implement Redis Correctness Reminder
TF-126 Define and implement Redis Eviction Policy
TF-127 Define and implement Redis Isolation
TF-128 Define and implement Object Storage Foundation
TF-129 Implement and verify Object Storage Security
TF-130 Implement Public Object Storage
TF-131 Implement Object Lifecycle
TF-132 Define and implement Container Registry Foundation
TF-133 Implement Registry Write vs Pull Permissions
TF-134 Define and implement IAM Foundation
TF-135 Implement Least Privilege
TF-136 Implement and verify CI Identity
TF-137 Implement and verify Production Apply Identity
TF-138 Implement and verify Human Infrastructure Access
TF-139 Implement Break-Glass Infrastructure Role
TF-140 Define and implement KMS Foundation
TF-141 Define and implement KMS Key Separation
TF-142 Implement and verify KMS Rotation
TF-143 Implement and verify KMS Deletion Protection
TF-144 Define and implement Secret Manager Foundation
TF-145 Implement and verify Secret Values and Terraform
TF-146 Implement and verify Secret Reference Output
TF-147 Define and implement Kubernetes External Secrets Foundation
TF-148 Define and implement Observability Infrastructure Foundation
TF-149 Define and implement Observability Ownership Boundary
TF-150 Implement Audit Infrastructure
TF-151 Implement and verify Backup Infrastructure
TF-152 Implement and verify Backup Independence
TF-153 Implement DR Infrastructure
TF-154 Implement DR Region Configuration
TF-155 Implement IaC Does Not Equal DR
TF-156 Define and implement Terraform Workflow
TF-157 Implement Format Gate
TF-158 Implement Validate Gate
TF-159 Implement and validate Terraform Test
TF-160 Implement and validate Terraform Tests May Create Infrastructure
TF-161 Implement Static Analysis
TF-162 Implement Speculative Plan
TF-163 Implement and verify Plan Is Security-Sensitive
TF-164 Implement Human-Readable Plan Artifact
TF-165 Implement Plan Exit Code
TF-166 Implement Final Plan Before Apply
TF-167 Define and implement Saved Plan Workflow
TF-168 Implement Plan Freshness
TF-169 Implement Apply Serialization
TF-170 Implement Direct Local Apply
TF-171 Implement Production Apply Approval
TF-172 Define and implement Separation of Duties
TF-173 Implement Apply Logs
TF-174 Implement Post-Apply Verification
TF-175 Implement Apply Failure
TF-176 Implement Terraform Is Incremental
TF-177 Define and implement Retry Policy
TF-178 Implement and verify Drift
TF-179 Implement and verify Scheduled Drift Plan
TF-180 Implement and verify Drift Is Not Always Malicious
TF-181 Implement and verify Drift Remediation
TF-182 Implement Emergency Console Change
TF-183 Implement Ignore Changes
TF-184 Implement Ignore Changes Anti-Pattern
TF-185 Implement and verify Prevent Destroy
TF-186 Implement and verify Prevent Destroy Limitation
TF-187 Implement and verify Create Before Destroy
TF-188 Define and implement Replacement Review
TF-189 Define and implement Destroy Review
TF-190 Implement and verify `terraform destroy`
TF-191 Implement and verify Ephemeral Environment Destroy
TF-192 Implement and verify Import Existing Infrastructure
TF-193 Implement and verify Declarative Import
TF-194 Implement and verify Import Does Not Reconfigure Safely by Itself
TF-195 Implement and verify Import Inventory
TF-196 Implement Refactoring Resource Addresses
TF-197 Implement Refactor Plan Gate
TF-198 Implement Moving Between States
TF-199 Implement Cross-State Dependencies
TF-200 Implement Remote State Data
TF-201 Implement Provider Data Sources
TF-202 Define and implement Policy as Code
TF-203 Define and implement Policy Layers
TF-204 Define and implement Advisory vs Mandatory Policy
TF-205 Define and implement Policy Exception
TF-206 Implement and verify Security Scanning
TF-207 Implement and verify Secret Scanning
TF-208 Implement and verify Plan Secret Leakage
TF-209 Implement Supply-Chain Integrity
TF-210 Define and implement Provider Source Governance
TF-211 Define and implement Module Source Governance
TF-212 Define and implement Cost Governance
TF-213 Implement Cost Tags
TF-214 Implement Cost Estimate Gate
TF-215 Implement Budget Alerts
TF-216 Implement Non-Production Cost Controls
TF-217 Implement Resource Quotas Outside Kubernetes
TF-218 Implement and verify Quota Monitoring
TF-219 Implement and verify Infrastructure Observability
TF-220 Implement Terraform Operational Metrics
TF-221 Implement Change Annotation
TF-222 Implement Infrastructure Change Window
TF-223 Implement Maintenance Communication
TF-224 Implement Database Engine Upgrade
TF-225 Implement Kafka Platform Upgrade
TF-226 Implement Redis Upgrade
TF-227 Implement Cluster Upgrade
TF-228 Implement and validate Infrastructure Testing Pyramid
TF-229 Implement and validate Module Unit Tests
TF-230 Implement and validate Mocked Infrastructure Tests
TF-231 Implement and validate Ephemeral Integration Test
TF-232 Implement and validate Destructive Test Isolation
TF-233 Implement and validate Network Module Tests
TF-234 Implement and validate Kubernetes Module Tests
TF-235 Implement and validate Database Module Tests
TF-236 Implement and validate Kafka Module Tests
TF-237 Implement and validate Redis Module Tests
TF-238 Implement and validate Policy Tests
TF-239 Implement and validate Drift Test
TF-240 Implement and validate Recovery Test
TF-241 Implement and validate State Restore Exercise
TF-242 Implement and verify Bootstrap Recovery
TF-243 Implement Dependency Order
TF-244 Implement Circular Dependency Warning
TF-245 Implement Infrastructure Outputs to GitOps
TF-246 Implement and verify Avoid Secret Output Handoff
TF-247 Implement Terraform and Argo CD Handoff
TF-248 Implement Terraform and External Controllers
TF-249 Define and implement Cloud Load Balancer Ownership
TF-250 Implement and verify Infrastructure Decommission
TF-251 Implement and verify Decommission Sequence
TF-252 Implement Resource Removal from Code
TF-253 Implement and verify Stop Managing Without Destroying
TF-254 Implement Orphan Resource Detection
TF-255 Define and implement Manual Resource Creation Policy
TF-256 Implement Infrastructure Inventory
TF-257 Write and validate Runbook: Terraform Apply Failure
TF-258 Write and validate Runbook: State Lock Stuck
TF-259 Write and validate Runbook: Unexpected Destroy Plan
TF-260 Write and validate Runbook: State Missing Resource
TF-261 Write and validate Runbook: Provider Upgrade Regression
TF-262 Write and validate Runbook: Drift Detected
TF-263 Write and validate Runbook: Backend Unavailable
TF-264 Write and validate Runbook: Accidental Infrastructure Deletion
TF-265 Verify Terraform resource ownership is explicit
TF-266 Verify No Terraform/Argo double ownership
TF-267 Verify State boundary matches blast radius
TF-268 Verify Repository owner is defined
TF-269 Verify Terraform version constrained
TF-270 Verify Providers constrained
TF-271 Verify `.terraform.lock.hcl` committed for root modules
TF-272 Verify Modules versioned immutably
TF-273 Verify Remote backend
TF-274 Verify Locking enabled where supported
TF-275 Verify Encryption enabled
TF-276 Verify Version/recovery enabled
TF-277 Verify State access least-privilege
TF-278 Verify Environment/account isolation
TF-279 Verify CIDRs non-overlapping
TF-280 Verify Private subnet strategy
TF-281 Verify Egress architecture explicit
TF-282 Verify Stable partner egress where needed
TF-283 Verify Private endpoints evaluated
TF-284 Verify DNS ownership explicit
TF-285 Verify Kubernetes endpoint exposure reviewed
TF-286 Verify Node-pool strategy defined
TF-287 Verify Workload identity foundation configured
TF-288 Verify PostgreSQL private/encrypted
TF-289 Verify PostgreSQL HA policy
TF-290 Verify Backup/PITR configured
TF-291 Verify Database deletion protection
TF-292 Verify Kafka HA/encryption/authentication
TF-293 Verify Kafka ACL ownership
TF-294 Verify Redis TLS/auth/HA as required
TF-295 Verify Redis eviction policy understood
TF-296 Verify Object-storage public access controlled
TF-297 Verify Storage lifecycle/retention configured
TF-298 Verify CI uses short-lived identity
TF-299 Verify Production apply role is scoped
TF-300 Verify Human roles separate from CI
TF-301 Verify Break-glass defined
TF-302 Verify KMS policies least-privilege
TF-303 Verify Key deletion protected
TF-304 Verify Secret values avoided in Terraform state where possible
TF-305 Verify Security scan passes
TF-306 Verify Policy checks pass
TF-307 Verify Secret scan passes
TF-308 Verify `fmt` passes
TF-309 Verify `validate` passes
TF-310 Verify module tests pass
TF-311 Verify policy/security checks pass
TF-312 Verify speculative plan attached/reviewable
TF-313 Verify destroy/replacement actions highlighted
TF-314 Verify cost impact reviewed where material
TF-315 Verify final plan generated before apply
TF-316 Verify production approval enforced
TF-317 Verify apply serialized
TF-318 Verify post-apply verification runs
TF-319 Verify Backend recovery procedure exists
TF-320 Verify State version restore tested
TF-321 Verify Force-unlock runbook exists
TF-322 Verify State surgery restricted
TF-323 Verify Import procedure documented
TF-324 Verify Address refactoring uses supported move mechanism
TF-325 Verify Critical resources protected from accidental destroy
TF-326 Verify DR bootstrap dependency order documented
TF-327 Verify Production account/project isolation implemented
TF-328 Verify Remote encrypted/versioned state backend available
TF-329 Verify State locking enabled where supported
TF-330 Verify CI identity uses short-lived authentication
TF-331 Verify Production apply job protected
TF-332 Verify Terraform/provider versions controlled
TF-333 Verify Module versions pinned
TF-334 Verify State roots are appropriately partitioned
TF-335 Verify Network/CIDR architecture approved
TF-336 Verify Kubernetes cluster and node pools validated
TF-337 Verify PostgreSQL HA/backup/deletion protection validated
TF-338 Verify Kafka HA/security/monitoring validated
TF-339 Verify Redis security/capacity/eviction validated
TF-340 Verify KMS/secret-manager foundations validated
TF-341 Verify Cloud audit logs enabled
TF-342 Verify Infrastructure monitoring enabled
TF-343 Verify Mandatory tags/policies enforced
TF-344 Verify Drift detection scheduled
TF-345 Verify Backup and state recovery tested
TF-346 Verify Critical destructive plans require explicit approval
TF-347 Verify Terraform/Argo ownership map approved
TF-348 Verify Infrastructure runbooks available
TF-349 Verify Purpose is clear
TF-350 Verify Inputs are typed and documented
TF-351 Verify Important inputs have validation
TF-352 Verify Outputs are minimal and documented
TF-353 Verify Provider requirements declared
TF-354 Verify Secure defaults used
TF-355 Verify Naming/tagging integrated
TF-356 Verify Tests exist for critical behavior
TF-357 Verify Example usage exists
TF-358 Verify Breaking-change policy exists
TF-359 Verify Version/tag released
TF-360 Verify Backend configured
TF-361 Verify Locking/recovery configured
TF-362 Verify CI identity defined
TF-363 Verify Environment ownership defined
TF-364 Verify Required modules pinned
TF-365 Verify Plan pipeline works
TF-366 Verify Apply protection works
TF-367 Verify Drift plan works
TF-368 Verify Runbook exists
TF-369 Verify Merge request reviewed
TF-370 Verify Plan reviewed
TF-371 Verify Policy/security checks passed
TF-372 Verify Destruction/replacement understood
TF-373 Verify Backup/recovery impact understood
TF-374 Verify Apply completed
TF-375 Verify Post-apply health verified
TF-376 Verify Observability change annotation recorded
TF-377 Verify Documentation/runbook updated if needed
TF-378 Verify Correct live resource identified
TF-379 Verify Correct owner/state selected
TF-380 Verify Matching Terraform configuration written
TF-381 Verify Import reviewed
TF-382 Verify Post-import plan contains no unintended destructive change
TF-383 Verify Tags/policies reconciled deliberately
TF-384 Verify Stable follow-up plan verified
TF-385 Verify State accessible/recovered
TF-386 Verify Provider credentials restored
TF-387 Verify Terraform initialization works
TF-388 Verify Plan explains current infrastructure
TF-389 Verify Critical network/data services healthy
TF-390 Verify GitOps bootstrap restored if needed
TF-391 Verify Application reconciliation succeeds
TF-392 Verify Audit/incident record complete
```

---

# 9. Phase 30 Policy Freeze Checklist

Before Phase 31, approve:

- [ ] Terraform vs Argo CD ownership matrix.
- [ ] Terraform version standard.
- [ ] Provider source/version constraints.
- [ ] Dependency lock-file policy.
- [ ] Provider upgrade cadence.
- [ ] Reusable module catalog/versioning.
- [ ] Module semantic-versioning policy.
- [ ] Module interface/input/output standards.
- [ ] Remote state backend technology and bootstrap.
- [ ] Production state encryption/versioning/access.
- [ ] State partitioning/root boundaries.
- [ ] State locking and force-unlock procedure.
- [ ] State backup/recovery procedure.
- [ ] Environment account/project isolation model.
- [ ] Environment/root/repository layout.
- [ ] Naming/tagging standard.
- [ ] Region and availability-zone strategy.
- [ ] VPC/VNet and CIDR plan.
- [ ] Private/public subnet strategy.
- [ ] Internet egress/static egress identity.
- [ ] Private endpoint strategy.
- [ ] DNS infrastructure ownership.
- [ ] TLS/certificate infrastructure ownership.
- [ ] Managed Kubernetes provisioning standard.
- [ ] Kubernetes control-plane endpoint/logging policy.
- [ ] Node-pool strategy and upgrade/replacement model.
- [ ] Workload identity foundation.
- [ ] Argo CD bootstrap handoff.
- [ ] Managed PostgreSQL HA/storage/backup/deletion protection.
- [ ] Kafka infrastructure/topic-ownership boundary.
- [ ] Kafka authentication/ACL foundation.
- [ ] Redis HA/security/capacity/eviction foundation.
- [ ] Object-storage security/lifecycle policy.
- [ ] Container-registry infrastructure ownership.
- [ ] CI and production Terraform apply identities.
- [ ] Human/break-glass infrastructure access.
- [ ] KMS key separation/rotation/deletion controls.
- [ ] Secret-manager foundation and Terraform secret-value policy.
- [ ] External Secrets infrastructure foundation.
- [ ] Observability/audit infrastructure foundation.
- [ ] Backup and DR infrastructure foundations.
- [ ] Terraform fmt/validate/test/static-analysis gates.
- [ ] Speculative/final plan workflow.
- [ ] Saved plan and plan-freshness policy.
- [ ] Production apply approval and serialization.
- [ ] Post-apply verification.
- [ ] Drift detection/remediation.
- [ ] ignore_changes governance.
- [ ] prevent_destroy/replacement/destruction gates.
- [ ] Brownfield import/adoption process.
- [ ] Resource-address refactoring/moved-block policy.
- [ ] Cross-state dependency/remote-state policy.
- [ ] Policy-as-code enforcement model.
- [ ] Infrastructure security/secret scanning.
- [ ] Provider/module supply-chain governance.
- [ ] Cost tagging/estimate/budget controls.
- [ ] Infrastructure observability/change annotation.
- [ ] Infrastructure upgrade/change-window policy.
- [ ] Infrastructure test pyramid.
- [ ] State restore/bootstrap recovery exercises.
- [ ] Infrastructure-to-GitOps output handoff.
- [ ] Decommission/resource-removal process.
- [ ] Manual resource creation/break-glass policy.
- [ ] Infrastructure inventory/catalog.
- [ ] Runbook set.

---

# 10. Phase 30 Exit Criteria

Phase 30 is complete when the team can answer and demonstrate:

```text
OWNERSHIP
Which resources belong to Terraform,
which belong to Argo CD/controllers,
and is there any overlap?

STATE
Where is each production state stored,
locked, encrypted, versioned,
and who may read/write it?

SUPPLY CHAIN
Which Terraform/provider/module versions
are approved and reproducible?

CHANGE CONTROL
Can reviewers see every create/update/replace/destroy
before protected production apply?

IDENTITY
Can CI apply infrastructure
without long-lived administrator credentials?

NETWORK
Can VPC/subnets/routes/egress/private connectivity
be recreated from code?

RUNTIME
Can Kubernetes clusters and node pools
be recreated and upgraded through a tested workflow?

DATA
Are PostgreSQL, Kafka, Redis, storage,
backup, encryption, and deletion protections explicit and tested?

DRIFT
Can unauthorized infrastructure drift
be detected and reconciled?

BROWNFIELD
Can existing resources be imported
without accidental replacement?

RECOVERY
Can state, infrastructure foundations, cluster,
and GitOps bootstrap be recovered without relying on one person's workstation?

DESTRUCTION
What prevents accidental production destroy
or critical resource replacement?
```

---

# 11. Phase 30 Completion Tree

```text
PHASE 30 — TERRAFORM

├── Terraform Ownership Boundary              ✅
├── Terraform vs Argo CD                      ✅
├── Repository / Root Layout                  ✅
├── Reusable Module Standards                 ✅
├── Terraform Version                         ✅
├── Provider Versioning                       ✅
├── Dependency Lock File                      ✅
├── Module Versioning                         ✅
├── Module Inputs / Outputs                   ✅
├── Variable Validation                       ✅
├── Preconditions / Postconditions            ✅
├── Remote State Backend                      ✅
├── State Encryption                          ✅
├── State Versioning                          ✅
├── State Locking                             ✅
├── State Partitioning                        ✅
├── State Recovery                            ✅
├── Environment Isolation                     ✅
├── Account / Project Structure               ✅
├── Naming / Tagging                          ✅
├── Region / AZ Strategy                      ✅
├── VPC / Network                             ✅
├── CIDR Planning                             ✅
├── Private / Public Subnets                  ✅
├── Egress / Static Egress                    ✅
├── Private Endpoints                         ✅
├── DNS / TLS Foundations                     ✅
├── Kubernetes Cluster                        ✅
├── Node Pools                                ✅
├── Cluster Upgrades                          ✅
├── Workload Identity                         ✅
├── PostgreSQL                                ✅
├── Kafka                                     ✅
├── Redis                                     ✅
├── Object Storage                            ✅
├── Container Registry                        ✅
├── IAM                                       ✅
├── CI / Apply Identity                       ✅
├── Break Glass                              ✅
├── KMS                                       ✅
├── Secret Manager                            ✅
├── External Secrets Foundation               ✅
├── Observability Infrastructure              ✅
├── Audit Infrastructure                      ✅
├── Backup Infrastructure                     ✅
├── DR Infrastructure                         ✅
├── fmt / validate / test                     ✅
├── Static Analysis                           ✅
├── Speculative / Final Plan                  ✅
├── Protected Apply                           ✅
├── Apply Serialization                       ✅
├── Post-Apply Verification                   ✅
├── Drift Detection                           ✅
├── ignore_changes Governance                 ✅
├── prevent_destroy                           ✅
├── Replacement / Destroy Gates               ✅
├── Brownfield Import                         ✅
├── Resource Refactoring                      ✅
├── Cross-State Dependencies                  ✅
├── Policy as Code                            ✅
├── Supply-Chain Governance                   ✅
├── Cost Governance                           ✅
├── Infrastructure Observability              ✅
├── Upgrade Workflows                         ✅
├── Infrastructure Testing                    ✅
├── State Restore Exercises                   ✅
├── Terraform → GitOps Handoff                ✅
├── Decommission                              ✅
├── Inventory / Catalogs                      ✅
├── Operational Runbooks                      ✅
├── Review Checklists                         ✅
├── Production Readiness                      ✅
└── Security Hardening Handoff                ✅
```

---

# 12. Handoff to Phase 31

The next official implementation phase is:

```text
PHASE 31 — Security Hardening
```

Phase 31 will harden:

```text
Threat Modeling
Security Baselines
Container / OS Hardening
Kubernetes Admission Controls
Pod Security
Seccomp / Capabilities
Image Trust / Signature Enforcement
Software Supply Chain
SBOM Governance
Dependency / CVE Management
Secrets Hardening
Key Rotation
IAM Hardening
Service-to-Service Security
Network Segmentation
WAF / DDoS
API Abuse Protection
Database Security
Kafka Security
Redis Security
Audit / SIEM
Vulnerability Management
Penetration Testing
Security Incident Response
Security Exceptions
Compliance Evidence
```

Boundary:

```text
PHASE 30
Terraform
=
provision secure-capable infrastructure foundations

        ↓

PHASE 31
Security Hardening
=
systematically harden those foundations and workloads
against attack and misuse
```

---

# 13. Final Phase 30 Principle

```text
Infrastructure Code
      ↓
Reviewed Plan
      ↓
Protected Apply
      ↓
Reproducible Infrastructure
      ↓
Drift Detection
      ↓
Recovery / Controlled Retirement
```

And:

```text
Terraform owns infrastructure foundations.
Argo CD owns Kubernetes application desired state.
Applications own business behavior.
Durable data services own authoritative business state.
```

**End of PHASE 30 — Terraform**
