---
title: "PART 33 — GITOPS / ARGO CD"
---

# PART 33 — GITOPS / ARGO CD

> **Document Role:** Defines the complete GitOps deployment architecture for the microservices platform, including Git as deployment source of truth, Argo CD control-plane architecture, Application and ApplicationSet standards, repository and overlay design, environment promotion, reconciliation, drift detection, sync policy, hooks/waves, health assessment, RBAC/SSO, secrets integration, multi-cluster operation, rollback, database migration coordination, observability, audit, disaster recovery, and production governance.  
> **Previous Part:** PART 32 — CI/CD  
> **Next Part:** PART 34 — Infrastructure / Terraform  
> **Status:** Platform Architecture / GitOps Deployment Specification  
> **Primary Stack:** Argo CD, Kubernetes, GitLab, Kustomize and/or Helm, GitLab Container Registry or approved OCI registry, External Secrets / approved secret manager, OpenTelemetry, Prometheus, Grafana  
> **Audience:** Platform engineers, DevOps engineers, SREs, backend engineers, security engineers, software architects, QA engineers, technical leads, release managers.

---

# 9039 — Purpose

GitOps defines how approved deployment intent stored in Git becomes continuously reconciled Kubernetes runtime state.

It answers:

```text
What is the deployment source of truth?
Who is allowed to change desired state?
How does Argo CD discover and render manifests?
How are environments and clusters represented?
When does synchronization happen automatically?
How are drift, health, and failed syncs handled?
How are migrations ordered with application rollout?
How are secrets referenced without putting secret values in Git?
How do we promote the same image digest across environments?
How do we roll back safely?
How is every deployment change audited?
How is Argo CD itself recovered?
```

The core principle is:

```text
Production deployment state is declared in Git
and reconciled by a controlled deployment system.
```

---

# 9040 — GitOps Goals

The GitOps platform should provide:

```text
declarative desired state
reviewed deployment changes
continuous reconciliation
drift visibility
repeatable environments
least-privilege deployment authority
clear promotion history
automated health feedback
reversible configuration changes
auditable production changes
```

---

# 9041 — Handoff from PART 32

PART 32 produces:

```text
trusted source commit
verified tests
security evidence
immutable image digest
SBOM
signature/provenance
release metadata
approved promotion intent
```

PART 33 consumes:

```text
approved artifact identity
+
approved desired-state change
```

and reconciles it into Kubernetes.

---

# 9042 — CI vs GitOps

CI owns:

```text
compile
test
scan
package
build image
sign/provenance
publish artifact
prepare desired-state change
```

GitOps owns:

```text
observe Git desired state
compare with cluster live state
apply approved state
report sync and health
correct permitted drift
record reconciliation status
```

Do not blur these responsibilities.

---

# 9043 — Git as Deployment Source of Truth

For Kubernetes application configuration:

```text
Git desired state
      ↓
Argo CD
      ↓
Kubernetes live state
```

Normal production deployment must not be:

```text
engineer laptop
      ↓
kubectl apply
      ↓
production
```

---

# 9044 — Git Is Desired State, Not Business Data

Git must contain declarative platform configuration such as:

```text
image digest
replica configuration
resource requests/limits
ConfigMap-safe values
service/route configuration
HPA/PDB
NetworkPolicy
Argo CD Application definitions
```

Git must not become storage for:

```text
orders
wallet balances
payment state
customer data
runtime secrets
```

---

# 9045 — Desired State vs Live State

Argo CD continuously compares:

```text
Desired State in Git
        ↕
Live State in Kubernetes
```

Possible status:

```text
Synced
OutOfSync
Unknown / comparison failure
```

Health is evaluated separately.

---

# 9046 — Reconciliation Principle

Deployment should be modeled as reconciliation rather than one-time command execution.

Conceptually:

```text
Git changes
    ↓
Argo detects desired revision
    ↓
compare
    ↓
apply required differences
    ↓
observe Kubernetes
    ↓
report sync + health
```

---

# 9047 — Argo CD Responsibilities

Argo CD owns deployment-plane responsibilities such as:

```text
Git revision tracking
manifest generation
cluster comparison
synchronization
drift detection
health assessment
application deployment history
multi-cluster targeting
GitOps RBAC
sync windows
sync hooks/waves
notifications
```

---

# 9048 — Argo CD Non-Responsibilities

Argo CD does not own:

```text
source compilation
unit testing
business correctness
container building
image vulnerability remediation
database transaction correctness
backup of business databases
Terraform infrastructure ownership
application authorization
Saga recovery
```

---

# 9049 — No Shared Ownership of One Resource

One Kubernetes resource should have one primary desired-state owner.

Avoid:

```text
Terraform manages Deployment
+
Argo CD manages same Deployment
```

This creates controller conflict.

Use explicit ownership boundaries.

---

# 9050 — Platform Ownership Boundary

Recommended:

```text
Terraform
  → cloud/network/cluster/shared managed infrastructure

Argo CD
  → Kubernetes application/platform desired state

Service
  → business runtime behavior
```

PART 34 will define the Terraform boundary in detail.

---

# 9051 — GitOps Control Flow

Recommended production flow:

```text
Merge application source
        ↓
PART 32 CI builds verified image
        ↓
immutable digest published
        ↓
promotion MR updates GitOps repo
        ↓
review / approval
        ↓
merge desired-state change
        ↓
Argo CD detects revision
        ↓
sync
        ↓
Kubernetes rollout
        ↓
health / observability
```

---

# 9052 — Pull-Based Deployment

Prefer pull-based deployment:

```text
Argo CD runs with controlled cluster access
and pulls approved desired state from Git.
```

This reduces the need for general CI runners to hold broad production Kubernetes credentials.

---

# 9053 — Push-Based Exceptions

Direct CI-to-cluster deployment may exist only as a documented exception.

Examples:

```text
bootstrap
controlled disaster recovery
special migration/bootstrap step
```

It is not the normal production path.

---

# 9054 — Argo CD Architecture

Logical components:

```text
Git Repositories
      ↓
Repo Server / Manifest Generation
      ↓
Application Controller
      ↓
Target Kubernetes API

Users / Automation
      ↓
Argo CD API Server

ApplicationSet Controller
      ↓
Generated Applications
```

---

# 9055 — Argo CD API Server

API server provides controlled access for:

```text
UI
CLI
API
authentication
SSO
RBAC
application operations
```

It should be exposed only through approved network and identity controls.

---

# 9056 — Application Controller

The Application Controller is responsible for core reconciliation activities such as:

```text
observing desired state
observing live state
calculating differences
performing sync operations
tracking application health
```

It requires carefully scoped Kubernetes permissions.

---

# 9057 — Repo Server

Repo Server generates manifests from approved sources such as:

```text
Kustomize
Helm
plain YAML
approved configuration-management plugins
```

Treat manifest generation as a privileged supply-chain function.

---

# 9058 — ApplicationSet Controller

ApplicationSet is useful when many Argo CD Applications follow a common pattern.

Examples:

```text
one service × many environments
one platform add-on × many clusters
many services × one environment
```

Do not use templating to hide unclear ownership.

---

# 9059 — Notifications Controller

Notifications may publish deployment events such as:

```text
sync succeeded
sync failed
application degraded
health recovered
```

Notification delivery complements, but does not replace, operational alerting from PART 31.

---

# 9060 — Argo CD Namespace

Run Argo CD in a dedicated namespace, for example:

```text
argocd
```

Restrict write access strongly because control of the Argo CD namespace can imply control of deployment authority.

---

# 9061 — Production Argo CD Isolation

For higher-risk production environments, prefer stronger control-plane isolation.

Possible models:

```text
separate production Argo CD
separate production cluster/project boundary
central Argo CD with strongly separated credentials/projects
```

Choose based on risk, scale, and operational maturity.

---

# 9062 — Initial Recommended Topology

Practical initial model:

```text
Non-Production Argo CD
  → DEV / QA / UAT / STAGING where acceptable

Production Argo CD
  → PRODUCTION
```

This limits blast radius while keeping operations understandable.

---

# 9063 — Argo CD High Availability

Production Argo CD should avoid single-instance control-plane assumptions.

Plan HA for critical components according to official deployment guidance and platform scale.

Failure of Argo CD should normally stop deployment reconciliation, not stop already-running business services.

---

# 9064 — Control Plane Failure Principle

If Argo CD is unavailable:

```text
running application Pods should continue serving
```

unless another dependency fails.

GitOps control-plane outage must not directly terminate healthy workloads.

---

# 9065 — Repository Strategy

Separate concerns clearly.

Possible repositories:

```text
service source repositories
GitOps environment repository
platform add-on repository
Terraform infrastructure repository
```

Avoid one repository becoming an unstructured dumping ground.

---

# 9066 — Recommended Source Repository

Service source repository contains:

```text
Java source
Dockerfile
service tests
API contracts
Flyway migrations
base Kubernetes templates if team model requires
```

It does not need to contain production environment credentials.

---

# 9067 — Recommended GitOps Repository

GitOps repository contains deployable desired state such as:

```text
environment overlays
image digests
replicas/resources
routing references
ConfigMap-safe settings
Application/ApplicationSet definitions
```

Changes require code review and environment-appropriate approval.

---

# 9068 — Infrastructure Repository

PART 34 Terraform repository may contain:

```text
VPC/network
Kubernetes clusters
node pools
managed PostgreSQL
managed Redis
managed Kafka
load balancers where IaC-owned
IAM foundations
DNS foundations
```

Ownership must not overlap accidentally with Argo CD-managed objects.

---

# 9069 — Monorepo vs Multi-Repo

Both can work.

Choose based on:

```text
team ownership
change volume
access boundaries
review permissions
release independence
operational complexity
```

Security boundaries are more important than repository fashion.

---

# 9070 — GitOps Repository Example

```text
gitops/
  apps/
    identity-service/
      base/
      overlays/
        dev/
        qa/
        uat/
        staging/
        prod/
    order-service/
    payment-service/
  platform/
  argocd/
    projects/
    applicationsets/
```

Illustrative only.

---

# 9071 — Alternative Environment-Centric Layout

```text
environments/
  dev/
    identity/
    order/
    payment/
  uat/
  staging/
  prod/
```

Useful when environment approval and access are the primary governance boundary.

---

# 9072 — Choose One Layout Standard

The organization should standardize one primary layout.

Avoid each service inventing unrelated structures that make promotion automation and review difficult.

---

# 9073 — Base + Overlay Principle

Use shared base configuration for common workload behavior.

Environment overlays should contain intentional differences only.

```text
base
  ↓
DEV overlay
QA overlay
UAT overlay
STAGING overlay
PROD overlay
```

---

# 9074 — Kustomize

Kustomize fits well when the platform prefers:

```text
plain Kubernetes resources
bases + overlays
patch-oriented environment differences
```

Keep patches readable and avoid deep overlay inheritance chains.

---

# 9075 — Helm

Helm fits well when the platform needs:

```text
reusable parameterized charts
packaged platform components
third-party software installation
```

Application teams should avoid turning values files into an untyped programming language.

---

# 9076 — Kustomize vs Helm

Do not force one tool for every use case.

A reasonable standard may be:

```text
Kustomize for first-party services
Helm for packaged platform/add-on software
```

or another documented organization standard.

---

# 9077 — Plain YAML

Plain manifests are acceptable for small/simple resources when duplication remains manageable.

Do not add templating complexity without need.

---

# 9078 — Multi-Source Application Caution

If multiple sources compose one Argo CD Application, keep ownership explicit.

Avoid designs where application health depends on unrelated repositories with different approval/security boundaries unless justified.

---

# 9079 — Immutable Application Revision

Production desired state should resolve to reviewed Git revisions and immutable image digests.

Avoid production dependence on mutable image tags such as:

```text
latest
main
stable
```

as runtime artifact identity.

---

# 9080 — Image Digest Standard

Preferred production image reference:

```text
registry.example.com/order-service@sha256:<digest>
```

Human-friendly tags may remain for discovery, but digest identifies the deployed artifact.

---

# 9081 — Git Revision Tracking

For environment repositories, Argo CD normally tracks the approved branch/revision model defined by governance.

Production changes must still enter that revision through protected review.

---

# 9082 — Avoid Hidden Parameter Overrides

Out-of-band Argo CD parameter overrides can make live desired state differ from Git intent.

Production policy should minimize or prohibit persistent overrides.

If an emergency override is used:

```text
record it
reconcile it back to Git
remove it promptly
```

---

# 9083 — Application Resource

Each deployable unit is represented by an Argo CD `Application` directly or through `ApplicationSet` generation.

An Application defines:

```text
source
revision/path/chart
destination cluster
namespace
project
sync policy
```

---

# 9084 — Application Ownership

Application name should map clearly to:

```text
service
platform component
environment
```

Example:

```text
prod-order-service
```

or use project/cluster context to avoid redundant naming.

---

# 9085 — One Application Scope

Prefer application boundaries that have:

```text
clear owner
clear lifecycle
clear rollback unit
manageable resource count
```

Do not create one giant Application containing the entire platform unless operationally justified.

---

# 9086 — Service Application

Typical service Application owns:

```text
Deployment
Service
ConfigMap
HPA
PDB
ServiceAccount
NetworkPolicy
service-specific Jobs
```

as defined by PART 29.

---

# 9087 — Shared Platform Application

Shared platform components may have separate Applications:

```text
cert-manager
observability stack
external secrets
policy engine
gateway controller
```

Ownership usually belongs to platform/SRE.

---

# 9088 — AppProject

Every production Application must belong to an explicit restricted `AppProject`.

Do not rely on a permissive default project for production workloads.

---

# 9089 — AppProject Responsibilities

AppProject restricts deployment scope such as:

```text
allowed source repositories
allowed target clusters
allowed namespaces
allowed/denied resource kinds
project-scoped roles
```

Use it as a major GitOps trust boundary.

---

# 9090 — Source Repository Allowlist

Production projects should allow only trusted Git repositories.

Avoid:

```text
sourceRepos:
  - '*'
```

without a deliberate platform-level reason.

---

# 9091 — Destination Restrictions

Restrict each project to intended destinations.

Example concept:

```text
order project
  → production cluster
  → order namespace
```

not arbitrary clusters/namespaces.

---

# 9092 — Resource Kind Restrictions

Application teams should not automatically receive authority to deploy every cluster-scoped resource.

Restrict sensitive kinds such as:

```text
ClusterRole
ClusterRoleBinding
CustomResourceDefinition
Namespace
admission configuration
```

according to ownership.

---

# 9093 — Argo Namespace Warning

A project able to deploy into the Argo CD control namespace is effectively highly privileged.

Restrict this capability to platform administrators.

---

# 9094 — Project Per Team or Domain

Possible model:

```text
customer-platform
commerce-platform
engagement-platform
shared-platform
```

or team-based projects.

Choose the model that best matches accountability and access boundaries.

---

# 9095 — Project Review

Every AppProject requires review of:

```text
source repositories
destinations
resource allow/deny lists
project roles
orphan monitoring
sync windows
```

---

# 9096 — ApplicationSet Use Cases

Use ApplicationSet for repeatable patterns.

Examples:

```text
all services in one environment
same add-on across clusters
service per tenant where architecture supports it
cluster fleet bootstrap
```

---

# 9097 — ApplicationSet Is Not an Ownership Shortcut

Generated Applications still need:

```text
owner
project
source control
rollback model
health expectations
```

Automation does not remove governance.

---

# 9098 — ApplicationSet Generators

Possible generators include repository/cluster/list-style inputs according to supported Argo CD capabilities.

Use only generators whose inputs are controlled and understandable.

---

# 9099 — Templated Project Risk

If ApplicationSet templates sensitive fields such as project or destination, treat generator inputs as privileged deployment configuration.

Protect those repositories and parameters accordingly.

---

# 9100 — ApplicationSet Deletion Safety

Mass generation creates mass-deletion risk.

Use conservative deletion behavior for critical environments and test generator changes before production.

---

# 9101 — Environment Representation

Each environment must map unambiguously to:

```text
cluster
namespace
Git path/revision
AppProject
secret scope
DNS domain
provider endpoints
```

consistent with PART 28.

---

# 9102 — Production Environment

Production Application configuration must point only to:

```text
production cluster
production namespace
production secret references
production routing configuration
production-approved image digest
```

---

# 9103 — Non-Production Isolation

DEV/QA/UAT may share a cluster only if controls from PART 28/29 remain separate:

```text
namespace
RBAC
NetworkPolicy
secrets
data stores
provider credentials
```

---

# 9104 — Multi-Cluster Strategy

Argo CD can manage multiple target clusters.

Cluster onboarding must define:

```text
identity
credentials
network connectivity
allowed projects
namespaces
ownership
rotation
removal procedure
```

---

# 9105 — Cluster Registration

Do not register clusters ad hoc from engineer laptops for production.

Registration should be an approved platform process with auditable credentials and least privilege.

---

# 9106 — Cluster Credentials

Prefer short-lived or managed identity patterns where supported.

Avoid unmanaged static cluster-admin credentials.

---

# 9107 — Controller Kubernetes Permissions

Argo CD requires enough read/write permission to compare and reconcile managed resources.

Do not interpret this as requiring unrestricted writes to every resource in every cluster.

Constrain write scope where practical.

---

# 9108 — Least Privilege Layers

Use multiple layers:

```text
Argo CD global RBAC
AppProject restrictions
Kubernetes RBAC
namespace boundaries
NetworkPolicy
cloud IAM/workload identity
```

No single layer replaces the others.

---

# 9109 — SSO

Production Argo CD should integrate with organization SSO using approved OIDC/SAML-compatible identity path supported by the deployment.

Require MFA through the identity provider where production policy requires it.

---

# 9110 — Local Admin Account

Disable or tightly control default/local administrator access after SSO is operational.

Keep emergency access only under documented break-glass policy.

---

# 9111 — Argo CD RBAC

Define roles such as:

```text
viewer
developer-nonprod
release-approver
platform-operator
security-auditor
admin
```

Grant only required actions.

---

# 9112 — Production Developer Access

Typical developer production access:

```text
view applications
view sync/health
view diff
view events
```

Manual production sync/override privileges should be limited.

---

# 9113 — Release Manager Access

Release role may be allowed to:

```text
approve production sync where manual policy applies
view diffs
view health
initiate approved rollback workflow
```

without broad platform administration.

---

# 9114 — Platform Operator Access

Platform operators manage:

```text
Argo CD configuration
projects
clusters
repository credentials
control-plane upgrades
RBAC
SSO
```

under strong review.

---

# 9115 — CI Access to Argo CD

Prefer CI to update Git desired state rather than call Argo CD with broad privileges.

If automation requires Argo API access, scope it to the smallest project/application action possible.

---

# 9116 — Repository Credentials

Repository credentials are platform secrets.

Use:

```text
read-only deploy key/token where possible
scoped repository access
rotation
secret manager integration
```

Avoid personal credentials.

---

# 9117 — Git Write Credentials

Argo CD generally needs read access to desired-state repositories.

It should not need normal write access to the GitOps repository.

Promotion writes come from approved CI/users/bots through Git review flow.

---

# 9118 — Secret Rule

Never commit raw production secrets to Git.

This includes:

```text
passwords
API keys
private keys
refresh tokens
cloud credentials
database passwords
```

---

# 9119 — Secret Reference Architecture

Recommended:

```text
Git
  → Secret reference / ExternalSecret definition

Secret Manager
  → secret value

External Secrets / CSI
  → Kubernetes runtime secret/material
```

Argo CD manages the declaration, not the secret value.

---

# 9120 — Secret Manager Ownership

Secret lifecycle remains under approved secret-management controls:

```text
creation
rotation
revocation
access policy
audit
```

PART 35 will harden this further.

---

# 9121 — Encrypted Secret-in-Git Option

If encrypted secrets in Git are adopted through a tool such as SOPS, define:

```text
key ownership
decryption identity
rotation
audit
review behavior
backup/recovery
```

Plaintext must never appear in repository history or CI logs.

---

# 9122 — Generated Secrets

Avoid GitOps definitions that regenerate secrets on every sync.

Secret generation and rotation need stable lifecycle semantics.

---

# 9123 — ConfigMap Values

Git is appropriate for non-secret configuration such as:

```text
feature-safe defaults
service endpoints without credentials
timeouts
limits
business-neutral runtime toggles
```

Environment-specific changes remain reviewed.

---

# 9124 — Configuration Version Identity

Deployment record should correlate:

```text
application image digest
GitOps commit SHA
config revision
migration version
secret version/reference where auditable
```

---

# 9125 — Sync Policy

Each Application must explicitly define whether synchronization is:

```text
manual
automated
```

Do not rely on accidental defaults.

---

# 9126 — Automated Sync

Automated sync is appropriate when:

```text
Git review is the deployment approval
changes are well tested
rollback is prepared
blast radius is understood
```

This often fits DEV and can fit production with mature controls.

---

# 9127 — Manual Sync

Manual sync may be appropriate when:

```text
formal production approval is required
external cutover timing matters
business change window applies
high-risk migration needs coordination
```

Manual sync must not become an excuse for undocumented changes.

---

# 9128 — Promotion Approval vs Sync Approval

Prefer approval at the Git change/promotion boundary.

If production also requires manual sync approval, make both controls intentional and avoid redundant ceremony without value.

---

# 9129 — Self-Heal

With self-heal enabled, Argo CD may restore live resources that drift from Git.

Use it when:

```text
Git must remain authoritative
manual drift should not persist
```

Understand impact before enabling on sensitive resources.

---

# 9130 — Self-Heal Production Policy

Recommended long-term direction:

```text
self-heal enabled for normal application-managed resources
```

combined with:

```text
restricted direct cluster writes
change audit
break-glass process
```

---

# 9131 — Prune

Prune removes resources that are no longer part of desired state.

It is powerful and potentially destructive.

Enable only with clear ownership and deletion policy.

---

# 9132 — Prune Safety

Sensitive resources may require additional confirmation or protection.

Examples:

```text
Namespace
PVC-like resources
shared infrastructure
security resources
```

Do not treat pruning as harmless cleanup.

---

# 9133 — Prune Last

When appropriate, pruning can be ordered after new desired resources have been applied and become healthy.

This can reduce unsafe deletion-before-replacement behavior.

---

# 9134 — Allow Empty

Applications that legitimately become empty require deliberate policy.

Do not permit an accidental empty manifest generation to delete a production application unexpectedly.

---

# 9135 — Sync Options Governance

Sync options can materially change apply/delete behavior.

Require review for options such as:

```text
replace
force
server-side apply
prune behavior
validation changes
```

especially in production.

---

# 9136 — Destructive Sync Options

Options that replace or recreate resources can cause downtime or data impact.

Use only for a documented resource-specific need.

---

# 9137 — Sync Windows

Use sync windows when the organization needs controlled periods such as:

```text
production change freeze
business peak periods
maintenance windows
formal release windows
```

Emergency policy must be explicit.

---

# 9138 — Change Freeze

During a freeze:

```text
normal production sync blocked
```

Emergency security/incident changes may proceed only through approved exception workflow.

---

# 9139 — Reconciliation Frequency

Do not tune reconciliation intervals blindly.

Consider:

```text
Git change frequency
application count
cluster API pressure
repository size
manifest-generation cost
required drift-detection latency
```

---

# 9140 — Webhooks

Git webhooks can reduce change-detection delay.

Secure webhook endpoints and do not make webhook delivery the only mechanism for eventual reconciliation.

---

# 9141 — Sync Phases

Deployment work may be organized into phases such as:

```text
PreSync
Sync
PostSync
SyncFail
```

Deletion-specific hooks may be used only where their semantics are deliberately required.

---

# 9142 — Sync Waves

Use sync waves for deterministic ordering within deployment phases.

Lower wave executes before higher wave.

Keep the ordering model simple enough to reason about.

---

# 9143 — Example Sync Ordering

Conceptual:

```text
wave -2: prerequisite/config
wave -1: database migration Job
wave  0: application Deployment/Service
wave  1: routing dependent resources
wave  2: post-deployment verification Job
```

Exact design depends on migration strategy.

---

# 9144 — Hooks Are Deployment Workflow Tools

Hooks are useful for bounded deployment operations.

They are not a replacement for:

```text
business workflow orchestration
long-running Saga engines
general batch processing
```

---

# 9145 — PreSync Hook

Possible uses:

```text
required schema migration
pre-deployment compatibility validation
controlled prerequisite Job
```

A failed required PreSync operation should block the rollout.

---

# 9146 — PostSync Hook

Possible uses:

```text
small deployment smoke verification
release registration
controlled post-deploy task
```

Do not run a massive regression suite inside cluster sync.

---

# 9147 — SyncFail Hook

Possible uses:

```text
capture failure context
notify operations
cleanup safe temporary deployment state
```

It must not hide the original failure.

---

# 9148 — Hook Idempotency

Hook Jobs can be retried/recreated.

Therefore:

```text
migration hook
backfill hook
release hook
```

must be idempotent or guarded by durable execution identity.

---

# 9149 — Hook Cleanup

Define hook cleanup deliberately so Argo CD can observe Job result before removal.

Do not allow generic Kubernetes cleanup timing to delete required hook evidence before the sync controller has assessed it.

---

# 9150 — Database Migration Principle

GitOps may coordinate migration execution, but database compatibility rules come from PART 07, PART 29, and PART 32.

Core rule:

```text
schema evolution must support rolling application compatibility.
```

---

# 9151 — Migration Job

Preferred production pattern where selected:

```text
versioned migration image/code
+
dedicated Kubernetes Job
+
least-privilege DB migration credentials
+
observable result
```

---

# 9152 — Flyway

Flyway schema history provides durable migration version tracking.

Argo CD should not invent another independent schema-version truth.

---

# 9153 — Migration Identity

Record:

```text
service
release
GitOps revision
migration version
start/end
result
```

and expose failures to observability.

---

# 9154 — Migration Before Application

For an expand step that must exist before new application code:

```text
PreSync migration
      ↓
application rollout
```

is a valid pattern when tested and safe.

---

# 9155 — Migration After Application

Contract/cleanup migration may occur only after old application versions no longer depend on the old schema.

Often this is a separate later release.

---

# 9156 — Expand / Contract

Use:

```text
Release A: expand schema
Release B: deploy compatible code
Release C: remove old usage
Release D: contract schema
```

when needed.

Do not compress incompatible operations into one risky sync.

---

# 9157 — Migration Failure

If required migration fails:

```text
stop application rollout
mark sync failed
alert owner
preserve diagnostic evidence
```

Do not continue automatically into incompatible application code.

---

# 9158 — Long Backfill

Do not keep Argo CD sync blocked for hours on a large data backfill unless deliberately designed.

Large backfills should usually be separate controlled Jobs/workflows with checkpointing and observability.

---

# 9159 — Migration Rollback Warning

Git revert can restore application manifests.

It cannot automatically undo destructive database changes.

Every release must know DB compatibility before rollout.

---

# 9160 — Health Assessment

Argo CD health indicates whether managed resources appear operational according to resource health semantics.

Examples:

```text
Healthy
Progressing
Degraded
Suspended
Missing
Unknown
```

Exact statuses depend on resource type/version.

---

# 9161 — Health Is Not Business Correctness

An Argo CD Application may be `Healthy` while:

```text
payments fail
orders error
Kafka lag grows
wallet reconciliation mismatches
```

Runtime production health still depends on PART 31 observability and business SLOs.

---

# 9162 — Readiness and Argo Health

Kubernetes readiness helps rollout health.

Incorrect readiness probes can cause Argo CD to report success for an application that cannot serve real traffic correctly.

Probe semantics from PART 29 remain mandatory.

---

# 9163 — Custom Resource Health

For CRDs not understood correctly by default, define custom health logic only when necessary and test it.

Avoid declaring unknown/failed resources healthy merely to make dashboards green.

---

# 9164 — Deployment Health Gate

A production deployment is not complete merely because:

```text
Sync = Synced
```

Require relevant combination of:

```text
Argo health
Kubernetes readiness
smoke tests
SLO/error-rate observation
business critical checks
```

---

# 9165 — Diff

Before sync, reviewers/operators should be able to understand:

```text
what resources change
what values change
what will be created
what may be deleted
```

Large unexplained diffs should block promotion.

---

# 9166 — Diff Noise

Some controllers mutate resources legitimately.

Do not accept permanent noisy OutOfSync status.

Identify the field owner and configure narrowly scoped difference handling when justified.

---

# 9167 — Ignore Differences

Ignore only fields known to be safely mutated outside Git ownership.

Bad:

```text
ignore large parts of Deployment spec
```

Good:

```text
ignore one controller-managed field with documented reason
```

---

# 9168 — Ignore-Difference Review

Every ignore rule should have:

```text
resource
field
reason
owner
review/expiry where appropriate
```

Broad ignore rules can hide real configuration drift.

---

# 9169 — Drift Detection

Drift examples:

```text
manual kubectl edit
manual scale
hotfix patch
controller mutation
unauthorized resource change
```

Argo CD must make intended/unintended drift visible.

---

# 9170 — Manual Production Drift

Normal response:

```text
identify cause
compare with Git
reconcile safely
record incident/change
```

Do not leave undocumented production drift indefinitely.

---

# 9171 — Break-Glass Change

Emergency direct cluster change may be allowed when necessary to restore service.

Required afterward:

```text
audit actor/reason
create corresponding Git change or explicitly revert live change
review impact
close break-glass session
```

---

# 9172 — Self-Heal vs Incident Repair

If self-heal is enabled, an emergency live patch may be immediately reverted by Argo CD.

Break-glass procedure must understand reconciliation behavior before applying direct changes.

---

# 9173 — Orphaned Resources

Orphaned-resource monitoring can help identify namespaced resources that are not owned by an Argo CD Application.

Enable deliberately in well-scoped projects/namespaces.

---

# 9174 — Orphan Monitoring Performance

Do not enable broad orphan monitoring across huge shared namespaces without understanding performance and false positives.

Scope ownership first.

---

# 9175 — Resource Tracking

Argo CD must reliably identify which Application owns each managed Kubernetes resource.

Do not manually copy tracking metadata between unrelated applications.

---

# 9176 — Shared Resource Conflict

Two Applications should not manage the same field/resource as independent authorities.

Shared ownership produces unpredictable reconciliation.

---

# 9177 — Namespace Ownership

Decide whether namespace creation/labels/policies are owned by:

```text
platform application
service application
Terraform
```

Only one should be authoritative for each object.

---

# 9178 — CRD Ownership

CRDs are cluster-wide and high impact.

Usually platform team owns CRDs separately from service instances of those custom resources.

---

# 9179 — CRD Upgrade Ordering

When CRD and CR changes are related:

```text
upgrade CRD safely
verify compatibility
then reconcile dependent CRs
```

Test conversion/version behavior where relevant.

---

# 9180 — Application Deletion

Deleting an Argo CD Application may delete managed resources depending on finalizer/cascade behavior.

Production deletion must be treated as a destructive operation.

---

# 9181 — Deletion Protection

Critical applications require controls such as:

```text
protected Git path
restricted delete RBAC
manual confirmation
resource-specific protection
backup/recovery plan
```

---

# 9182 — Namespace Deletion

Namespace deletion can destroy many resources at once.

Never make it an incidental consequence of routine service removal.

---

# 9183 — PersistentVolume Considerations

Application deletion/prune semantics must account for persistent storage reclaim policy.

Do not assume Git restore can recover deleted persistent data.

---

# 9184 — Promotion Through Git

Promotion means updating the environment desired state to reference an already-built artifact.

Example:

```text
staging image digest A
      ↓
approval
      ↓
prod overlay changed to digest A
```

No rebuild.

---

# 9185 — Promotion Merge Request

Production promotion MR should show:

```text
service
old digest
new digest
application version
source commit
release notes
migration version
risk/change ticket if required
```

---

# 9186 — Promotion Automation

Automation may open promotion MRs automatically after upstream gates pass.

Human/business approval remains where policy requires it.

---

# 9187 — Environment Promotion Sequence

Typical:

```text
DEV
  ↓
QA
  ↓
UAT
  ↓
STAGING
  ↓
PRODUCTION
```

Performance/security tracks may validate the same release independently.

---

# 9188 — UAT Sign-Off

UAT approval should be linked to the exact candidate artifact identity.

Avoid signing off one digest and promoting another.

---

# 9189 — Staging Rehearsal

Staging should validate:

```text
same image digest
production-like manifests
migration sequence
routing
secrets references
rollout behavior
smoke tests
rollback procedure
```

---

# 9190 — Production Promotion

Production promotion changes only the desired state needed for release.

Avoid mixing unrelated refactoring/config cleanup into a high-risk production promotion MR.

---

# 9191 — Promotion Freeze

When UAT/staging candidate is under final approval, minimize unrelated changes to that candidate path.

This preserves evidence consistency.

---

# 9192 — Rollback Through Git

Preferred rollback:

```text
revert desired-state commit
```

or explicitly set previous known-good digest/config in Git.

Argo CD then reconciles the rollback state.

---

# 9193 — Why Git Rollback Is Preferred

It keeps:

```text
Git truth
cluster truth
review history
audit history
```

aligned.

---

# 9194 — Argo History Rollback Caution

Controller-level rollback without updating Git can be temporary or conflict with automated sync.

Git should remain authoritative.

---

# 9195 — Rollback Inputs

Before production rollout know:

```text
previous image digest
previous GitOps revision
previous config revision
DB compatibility
secret-version compatibility
feature-flag rollback option
```

---

# 9196 — Feature Flag Recovery

For some regressions, disabling a feature flag is safer/faster than reverting an image.

The flag change must still be audited and observable.

---

# 9197 — Failed Sync

On failed sync:

```text
stop additional unsafe progression
preserve previous healthy replicas where rollout semantics allow
inspect hook/resource failure
alert owner
avoid repeated destructive retry
```

---

# 9198 — Degraded After Successful Sync

If resources sync but become degraded:

```text
check rollout
readiness/liveness
config/secrets
resource limits
dependency health
recent migration
```

Rollback when release regression is likely.

---

# 9199 — Sync Retry

Retries must be bounded.

Do not create infinite rapid deployment loops against a deterministic failure.

---

# 9200 — Backoff

Use bounded retry/backoff where supported for transient reconciliation failures.

Operational alerts should trigger before retries hide a long outage.

---

# 9201 — Application Health Timeout

Production rollout workflow needs a defined maximum time for becoming healthy.

A deployment stuck in `Progressing` indefinitely is a failed release condition operationally.

---

# 9202 — Progressive Delivery Boundary

Argo CD can reconcile manifests used by canary/blue-green tooling.

Progressive traffic analysis may use a dedicated controller such as Argo Rollouts if adopted.

Do not confuse Argo CD synchronization with complete progressive-delivery analysis.

---

# 9203 — Canary Policy

If canary is adopted, define:

```text
traffic percentage
analysis metrics
failure threshold
promotion rule
abort rule
rollback path
```

PART 40 may refine production deployment strategy.

---

# 9204 — Blue/Green Policy

If blue/green is adopted, define:

```text
preview environment
promotion switch
session implications
database compatibility
rollback routing
capacity cost
```

---

# 9205 — Sync Does Not Equal Traffic Cutover

A resource can be synchronized before all traffic should move to it.

Gateway/service mesh/rollout strategy controls traffic behavior where applicable.

---

# 9206 — Manifest Validation Before Git Merge

PART 32 CI should validate GitOps changes before merge:

```text
render succeeds
YAML/schema valid
policy checks pass
no secret leakage
approved image digest exists
required labels/resources present
```

---

# 9207 — Server-Side Validation

Where practical, validate rendered manifests against compatible Kubernetes API/schema behavior before production.

This reduces sync-time surprises.

---

# 9208 — Policy as Code

Policy checks may reject configurations such as:

```text
root container
privileged workload
latest image
missing resources
hostPath
broad ServiceAccount
public exposure without approval
```

PART 35 strengthens admission policy.

---

# 9209 — GitOps Repository Branch Protection

Protect production desired-state branches.

Require:

```text
merge request
approved reviewers
successful CI
restricted force push
restricted deletion
```

---

# 9210 — CODEOWNERS

Use ownership rules for sensitive paths.

Examples:

```text
prod/** → platform/release approvers
argocd/projects/** → platform/security
network/** → platform/network
```

---

# 9211 — Review Separation

For high-risk production changes, author should not be the only approver.

Financial/security-critical service promotions may require additional approval.

---

# 9212 — Generated Manifest Review

Reviewers need visibility into effective rendered changes, not only template-variable edits.

CI may attach rendered diff/artifact for sensitive changes.

---

# 9213 — Git Commit Identity

Production GitOps commits should have attributable identity.

Avoid anonymous/shared human accounts.

Bots must use dedicated machine identities.

---

# 9214 — Signed Commits

Signed Git commits/tags may be adopted as an additional integrity control.

They complement, not replace:

```text
branch protection
MR review
image signing
Argo RBAC
```

---

# 9215 — Supply Chain Link

Deployment trust chain:

```text
source commit
  ↓
CI evidence
  ↓
signed immutable image
  ↓
GitOps desired state references digest
  ↓
cluster admission verifies trust where enforced
  ↓
Argo reconciles resource
```

---

# 9216 — Argo CD Is Not Image Verification Alone

Image signature enforcement should happen through the chosen admission/security architecture where required.

Argo CD references the approved digest; PART 35 defines stronger runtime admission controls.

---

# 9217 — Registry Availability

Argo CD may successfully apply a Deployment while Pods fail to pull the image.

Monitor:

```text
ImagePullBackOff
registry availability
registry authentication
```

---

# 9218 — Registry Credentials

Kubernetes image-pull authentication belongs to cluster/workload configuration.

Do not put raw registry passwords in Git.

---

# 9219 — Repository Availability

If Git is unavailable:

```text
running workloads continue
new desired-state retrieval may fail
sync/compare may degrade
```

Alert on prolonged repository access failure.

---

# 9220 — Git Provider Failure

Argo CD and release runbooks should distinguish:

```text
Git unreachable
credential invalid
TLS/DNS failure
repository removed
revision missing
```

---

# 9221 — Manifest Generation Failure

Common causes:

```text
invalid Kustomize patch
Helm render error
missing value
plugin failure
repository auth
unsupported API
```

Sync must not proceed with partial/unknown desired state.

---

# 9222 — Configuration Management Plugin

Custom plugins increase supply-chain and execution risk.

Use only when native Helm/Kustomize/plain manifests cannot satisfy the requirement.

Pin, isolate, and review plugin behavior.

---

# 9223 — Plugin Secret Exposure

Manifest-generation plugins must not print secret material to logs or generated manifests unintentionally.

Treat plugin environment and filesystem access as sensitive.

---

# 9224 — Helm Dependency Control

Pin chart/dependency versions for production.

Do not allow production render to silently pull a different chart because of mutable version selection.

---

# 9225 — Third-Party Chart Review

Before deploying third-party chart updates:

```text
review rendered diff
scan images
review RBAC
review CRDs
review network exposure
review persistence
```

---

# 9226 — Kustomize Remote Bases

Pin remote bases to immutable/reviewed revisions where possible.

Avoid production depending on floating remote branches.

---

# 9227 — Resource Naming Stability

Stable names help avoid accidental delete/recreate.

Changing immutable identifiers can have outage implications.

Review generated names carefully.

---

# 9228 — Namespace Creation Policy

If Argo CD creates namespaces automatically, document:

```text
labels
annotations
resource quotas
network policy baseline
ownership
```

Do not create production namespaces without baseline controls.

---

# 9229 — Sync Ownership for Autoscaled Replicas

If HPA owns replica count, Git diff handling must not fight the HPA continuously.

Define ownership of the replicas field deliberately.

---

# 9230 — Controller-Mutated Fields

Examples:

```text
HPA replica changes
certificate controller fields
operator-generated status/defaults
webhook defaults
```

Difference handling must be narrow and documented.

---

# 9231 — Secret Rotation and GitOps

Secret value rotation may occur without changing Git when the secret manager reference remains stable.

Applications must define whether reload requires:

```text
automatic mount refresh
pod restart
rollout annotation
application dynamic reload
```

---

# 9232 — Config Change Rollout

If a ConfigMap change requires application restart, make rollout mechanism explicit.

Do not assume all processes hot-reload configuration.

---

# 9233 — Secret Rotation Rollout

Credential rotation should avoid a window where:

```text
new secret active
old clients broken
```

Use overlap/dual-valid strategy where provider supports it.

---

# 9234 — TLS Certificate Resources

Certificate definitions may be GitOps-managed.

Private keys should be issued/stored through approved certificate/secret mechanisms, not committed to Git.

---

# 9235 — NetworkPolicy Through GitOps

Network policies should be declarative and reviewed.

A network-policy change can break service connectivity and requires the same rollout discipline as application changes.

---

# 9236 — Gateway/Route Changes

Routes/TLS/gateway configuration managed by Argo CD must preserve PART 30 ownership and security rules.

Public exposure is a high-impact change.

---

# 9237 — RBAC Manifest Changes

Kubernetes RBAC changes require privileged review.

CI diff should flag expansion of:

```text
verbs
resources
namespaces
cluster scope
secret access
```

---

# 9238 — ServiceAccount Changes

Workload identity changes can alter cloud permissions.

Treat ServiceAccount annotations/bindings as security-sensitive deployment changes.

---

# 9239 — Resource Requests/Limit Changes

Review resource changes for:

```text
capacity
JVM memory
HPA behavior
cluster scheduling
cost
```

A harmless-looking manifest change can create production outage.

---

# 9240 — Replica Changes

Manual scale changes should be represented in Git when Git owns replica count.

If HPA owns scaling, modify HPA boundaries instead.

---

# 9241 — CronJob Changes

GitOps manages scheduled job definitions.

Review:

```text
schedule
timezone
concurrency
retry
resource limits
idempotency
```

from PART 29.

---

# 9242 — Job Re-Execution Risk

Changing hook/Job identity can cause re-execution.

For financial/migration/admin tasks, include durable idempotency guards.

---

# 9243 — Argo CD Observability

Monitor Argo CD itself with:

```text
metrics
logs
alerts
resource usage
reconciliation latency
sync failures
repo errors
cluster errors
```

---

# 9244 — Deployment Annotations

Every production sync should appear on operational timelines with fields such as:

```text
service
environment
image version/digest
GitOps revision
actor/approver where available
time
```

consistent with PART 31.

---

# 9245 — Sync Failure Alert

Alert when:

```text
production sync fails
```

for a release change requiring action.

Avoid paging for transient self-resolving comparison noise unless impact exists.

---

# 9246 — OutOfSync Alert

Production application remaining unexpectedly OutOfSync should trigger investigation.

Severity depends on:

```text
self-heal policy
resource criticality
age of drift
security impact
```

---

# 9247 — Degraded Application Alert

Page/ticket based on user/business impact and service tier.

Argo status should link to service dashboards/runbooks.

---

# 9248 — Reconciliation Latency

Measure delay from:

```text
Git desired-state merge
→ Argo detection
→ sync
→ Healthy
```

for release engineering insight.

---

# 9249 — Application Count Metrics

Track:

```text
Synced
OutOfSync
Healthy
Degraded
Unknown
```

by environment/project without creating unbounded labels.

---

# 9250 — Repo Server Metrics

Observe:

```text
manifest generation latency
errors
cache behavior
CPU/memory
repository access failures
```

---

# 9251 — Application Controller Metrics

Observe:

```text
reconciliation queue
Kubernetes API errors
sync duration
resource comparison latency
CPU/memory
```

---

# 9252 — Notification Policy

Useful delivery events:

```text
production sync failed
production app degraded
production app healthy after deploy
manual intervention required
```

Do not create noisy notification storms for every normal reconciliation.

---

# 9253 — Audit Requirements

Production deployment audit must reconstruct:

```text
who changed Git
who reviewed
what digest/config changed
when Argo observed it
when sync occurred
what resources changed
whether health passed
whether rollback occurred
```

---

# 9254 — Kubernetes Audit

Combine:

```text
Git history
Argo CD audit/application history
Kubernetes audit logs
CI release evidence
```

for stronger traceability.

---

# 9255 — No Shared Accounts

Human actions in Argo CD must use attributable identities.

Avoid shared `devops` or `admin` accounts for routine operations.

---

# 9256 — Machine Identity

Automation uses dedicated machine identity with:

```text
scope
owner
rotation/revocation
usage audit
```

---

# 9257 — Control Plane Secrets

Protect:

```text
repository credentials
cluster credentials
SSO client secrets
notification provider tokens
TLS keys
```

with approved secret management.

---

# 9258 — Argo CD Network Exposure

Argo CD API/UI should not be unnecessarily public.

Use approved ingress, TLS, authentication, WAF/VPN/private access as required by risk.

---

# 9259 — TLS

All external Argo CD access must use verified TLS.

Do not disable certificate verification in production repository/cluster connections.

---

# 9260 — NetworkPolicy

Restrict Argo components according to required flows:

```text
Git provider
Kubernetes API
auth provider
secret manager/notification endpoints where needed
```

Avoid unrestricted egress without reason.

---

# 9261 — Repository Trust

Only approved repository hosts and credentials should be configured.

Typosquatted/untrusted repositories must not be deployable sources for production projects.

---

# 9262 — SSH Host Verification

For SSH Git access, verify host keys through managed known-host configuration.

Do not disable host verification for convenience.

---

# 9263 — HTTPS Repository Verification

For HTTPS Git access, validate TLS chain using approved CA trust.

Custom internal CAs must be distributed deliberately.

---

# 9264 — Argo CD Upgrade Strategy

Treat Argo CD upgrades as production platform releases.

Validate:

```text
CRD/API changes
RBAC changes
configuration compatibility
Application/ApplicationSet behavior
plugin compatibility
metrics/alerts
rollback plan
```

---

# 9265 — Upgrade Environment

Test Argo CD upgrades in non-production first with representative Applications and sync behavior.

Do not upgrade production control plane blindly.

---

# 9266 — Version Pinning

Pin Argo CD deployment version.

Do not track an uncontrolled `latest` release in production.

---

# 9267 — CRD Upgrade Caution

Argo CD installation upgrades may update CRDs.

Ensure the upgrade sequence is compatible with running controller/server versions.

---

# 9268 — Self-Managed Argo CD

Argo CD can manage declarative configuration for itself after bootstrap.

Bootstrap ownership must remain clear so recovery does not depend on an impossible circular dependency.

---

# 9269 — Bootstrap

Initial bootstrap may require:

```text
Terraform / cluster bootstrap process
install Argo CD
configure repository/identity foundations
create root platform Application/ApplicationSet
```

After bootstrap, normal changes return to GitOps.

---

# 9270 — App-of-Apps Pattern

An app-of-apps/root-application pattern can bootstrap multiple Applications.

Use carefully because root repository write access can become highly privileged.

---

# 9271 — ApplicationSet vs App-of-Apps

Prefer the pattern that provides clearer:

```text
ownership
generation
access control
delete behavior
operational visibility
```

Do not combine patterns unnecessarily.

---

# 9272 — Disaster Recovery Principle

Argo CD should be rebuildable from:

```text
Git configuration
infrastructure code
secret-manager state
cluster/repository registration data or reproducible bootstrap
```

The control plane itself must not be a unique undocumented snowflake.

---

# 9273 — What Git Recovers

Git can recover:

```text
Applications
ApplicationSets
AppProjects
manifests
overlays
non-secret configuration
```

when these are stored declaratively.

---

# 9274 — What Git Does Not Recover

Git alone does not recover:

```text
external secret values
business databases
Kafka data
Redis authoritative state where any
container registry artifacts
cluster infrastructure
```

Those have separate backup/DR responsibilities.

---

# 9275 — Argo CD State Backup

Determine whether cluster-level backup of Argo CD namespace/config is required in addition to reproducible Git bootstrap.

Critical non-Git state must be identified explicitly.

---

# 9276 — Registry Dependency in DR

Recovery requires referenced image digests to remain available.

Registry retention policy must preserve production and rollback artifacts.

---

# 9277 — Git Dependency in DR

Git provider continuity is part of deployment recovery.

Plan:

```text
repository backup/mirroring if required
credential recovery
DNS/network access
protected branch restoration
```

---

# 9278 — Secret Manager Dependency in DR

Restoring Argo applications without secret-manager access may leave workloads unusable.

Secret recovery is part of the DR dependency graph.

---

# 9279 — Cluster Rebuild

After Terraform recreates cluster foundations:

```text
bootstrap Argo CD
register desired-state source
restore secret integration
reconcile platform applications
reconcile business applications
verify data dependencies
```

---

# 9280 — Recovery Order

Conceptual DR order:

```text
Network / IAM / Cluster
      ↓
Secret + Registry + Git access
      ↓
Argo CD control plane
      ↓
Shared platform add-ons
      ↓
Data connectivity
      ↓
Business applications
      ↓
Traffic enablement
```

Exact order depends on architecture.

---

# 9281 — GitOps DR Test

Test periodically:

```text
rebuild Argo CD
reconnect repository
reconnect target cluster
restore project/RBAC
sync representative apps
verify production-like dependencies
```

---

# 9282 — Argo CD Runbooks

Required runbooks:

```text
Application OutOfSync
Application Degraded
Sync Failed
Repository Unreachable
Cluster Unreachable
Manifest Generation Error
Permission Denied
Stuck Hook
Failed Migration
Prune Blocked
Argo CD Control Plane Down
```

---

# 9283 — OutOfSync Runbook

```text
inspect diff
identify Git vs live owner
check recent manual change
check controller-mutated fields
confirm intended revision
sync/revert as policy permits
```

---

# 9284 — Sync Failure Runbook

```text
identify failed resource/hook
inspect Kubernetes events/logs
check config/secrets
check migration
check API compatibility
check RBAC
rollback/revert if release regression
```

---

# 9285 — Repo Failure Runbook

```text
check Git provider
DNS/TLS
repository URL
credential expiry/revocation
known-host/CA trust
network egress
```

---

# 9286 — Cluster Unreachable Runbook

```text
check Kubernetes API
cluster credential/workload identity
network path
certificate
RBAC
cluster health
```

---

# 9287 — Manifest Generation Runbook

```text
render locally/CI with approved version
check Helm/Kustomize syntax
check missing files/values
check plugin
check dependency revision
```

---

# 9288 — Migration Hook Runbook

```text
inspect Job logs
check Flyway history
check DB connectivity/permissions
check lock/blocking
determine safe retry
block app rollout until compatible
```

---

# 9289 — Prune Blocked Runbook

```text
identify resource
confirm ownership
confirm deletion intent
check finalizers/dependencies
check protected-resource policy
approve only when safe
```

---

# 9290 — Control Plane Failure Runbook

```text
verify API server
repo server
application controller
ApplicationSet controller
Redis/cache if used by deployment
SSO/TLS
resource saturation
recent upgrade/config change
```

Running workloads remain the priority.

---

# 9291 — Performance Considerations

Argo CD scale depends on:

```text
application count
resource count
cluster count
repository size
manifest generation cost
reconciliation frequency
Kubernetes API capacity
```

Capacity-test before large fleet expansion.

---

# 9292 — Large Application Warning

Very large Applications increase:

```text
diff cost
sync duration
blast radius
operator difficulty
```

Split by stable ownership/lifecycle boundaries when justified.

---

# 9293 — Repository Size

Huge Git repositories can slow:

```text
clone/fetch
manifest generation
change detection
```

Keep generated binaries and unrelated artifacts out of GitOps repositories.

---

# 9294 — Manifest Complexity

Excessive templating increases:

```text
render time
review difficulty
failure modes
security risk
```

Prefer boring, explicit configuration.

---

# 9295 — Cluster API Pressure

Aggressive reconciliation across many resources can increase API-server load.

Coordinate Argo CD scale with Kubernetes control-plane capacity.

---

# 9296 — Repo Server Scaling

Scale repo-server capacity based on observed:

```text
manifest-generation concurrency
CPU
memory
repository volume
plugin cost
```

---

# 9297 — Controller Scaling

Application-controller tuning/replication must follow official supported architecture and measured reconciliation demand.

Avoid speculative tuning without metrics.

---

# 9298 — GitOps Security Threat Model

Threats include:

```text
malicious Git commit
compromised reviewer account
compromised CI bot
compromised repo credential
compromised Argo admin
malicious manifest plugin
cluster credential theft
secret leakage
unsafe prune
dependency hijack
```

---

# 9299 — Defense Against Malicious Git Change

Use:

```text
protected branches
CODEOWNERS
required review
CI policy validation
least-privilege project destinations
admission policy
runtime monitoring
```

---

# 9300 — Defense Against Compromised Argo Account

Use:

```text
SSO
MFA
least privilege
short-lived sessions
audit logs
restricted admin
project boundaries
network controls
```

---

# 9301 — Defense Against Repo Credential Theft

Repository credentials should be:

```text
read-only where possible
scoped
rotated
stored outside Git
audited
```

---

# 9302 — Defense Against Cluster Credential Theft

Prefer managed identity and scoped Kubernetes RBAC.

Do not reuse one static cluster-admin token across all environments.

---

# 9303 — Production Approval Model

Example:

```text
Developer prepares release
      ↓
CI proves artifact
      ↓
Promotion MR
      ↓
Service owner approval
      ↓
Release/platform approval where required
      ↓
Merge
      ↓
Argo reconciliation
```

---

# 9304 — Financially Sensitive Services

Payment and Wallet may require stronger controls such as:

```text
additional reviewer
migration review
reconciliation readiness
change window
post-deploy financial checks
```

---

# 9305 — Identity Service Changes

Identity/Auth releases may require stronger security review for:

```text
token handling
session configuration
OAuth/OIDC settings
signing keys
password-reset flows
RBAC
```

---

# 9306 — Gateway Changes

Gateway route/auth/rate-limit changes can affect every service.

Treat them as platform-tier changes with appropriate review.

---

# 9307 — GitOps Test Strategy

Test:

```text
manifest rendering
Application/AppProject schema
policy rules
sync ordering
migration hooks
health behavior
prune behavior
rollback
RBAC
multi-environment generation
DR bootstrap
```

---

# 9308 — Render Test

Every GitOps MR must render expected manifests successfully with pinned tooling.

Failure blocks merge.

---

# 9309 — Golden Manifest Tests

For critical reusable templates, snapshot/golden tests may detect unexpected rendered-resource changes.

Use selectively to avoid noisy maintenance.

---

# 9310 — Policy Tests

Automated tests should reject known unsafe patterns.

Examples:

```text
privileged true
hostPath
latest image
missing requests
broad cluster role
plaintext secret
public load balancer without approval
```

---

# 9311 — AppProject Tests

Verify projects cannot deploy outside intended:

```text
repositories
clusters
namespaces
resource types
```

---

# 9312 — ApplicationSet Tests

Before production generator changes, verify generated:

```text
Application count
names
projects
sources
destinations
paths/revisions
```

No unexpected deletion/update.

---

# 9313 — Sync Wave Test

Use staging to prove required order:

```text
migration before app
app before post-check
```

and failure behavior.

---

# 9314 — Prune Test

Test removal behavior with non-critical representative resources before enabling broad production prune.

---

# 9315 — Self-Heal Test

In staging:

```text
manually drift managed field
verify detection
verify expected self-heal
verify audit/alerting
```

---

# 9316 — Rollback Test

For high-risk releases:

```text
promote candidate
verify
revert Git desired state
verify Argo rollback reconciliation
verify DB compatibility
```

---

# 9317 — Disaster Recovery Test

Rebuild representative Argo CD control plane and applications from declared sources.

Record missing undocumented dependencies as defects.

---

# 9318 — Definition of Done — Application

- [ ] Explicit AppProject.
- [ ] Approved source repository.
- [ ] Correct destination cluster/namespace.
- [ ] Immutable image digest in production.
- [ ] Sync policy defined.
- [ ] Prune/self-heal policy reviewed.
- [ ] Health semantics understood.
- [ ] Owner/runbook/dashboard recorded.
- [ ] No plaintext secrets.
- [ ] Rollback path known.

---

# 9319 — Definition of Done — AppProject

- [ ] Source repositories restricted.
- [ ] Destinations restricted.
- [ ] Cluster-scoped resource permissions reviewed.
- [ ] Project roles least-privilege.
- [ ] Sync windows defined if required.
- [ ] Orphan monitoring reviewed.
- [ ] Argo namespace deployment not allowed without admin need.

---

# 9320 — Definition of Done — GitOps Repository

- [ ] Protected production branch/path.
- [ ] CODEOWNERS.
- [ ] Required CI render/policy tests.
- [ ] No raw secrets.
- [ ] Clear environment layout.
- [ ] Same artifact promotion model.
- [ ] Reviewable diffs.
- [ ] Rollback revisions retained.

---

# 9321 — Definition of Done — Sync

- [ ] Manual/automated policy explicit.
- [ ] Self-heal decision explicit.
- [ ] Prune decision explicit.
- [ ] Destructive sync options reviewed.
- [ ] Sync window behavior known.
- [ ] Retry/backoff bounded.
- [ ] Timeout/escalation defined.

---

# 9322 — Definition of Done — Migration

- [ ] Flyway migration tested.
- [ ] Expand/contract compatibility reviewed.
- [ ] Migration Job has least privilege.
- [ ] Idempotency known.
- [ ] Failure blocks incompatible rollout.
- [ ] Logs/metrics/audit available.
- [ ] Large backfill separated if required.
- [ ] DB rollback limitation understood.

---

# 9323 — Definition of Done — Security

- [ ] SSO enabled.
- [ ] MFA policy enforced by IdP where required.
- [ ] Local admin restricted.
- [ ] RBAC least privilege.
- [ ] Repo credentials scoped/read-only.
- [ ] Cluster credentials scoped.
- [ ] Secrets externalized.
- [ ] TLS verification enabled.
- [ ] Argo network exposure restricted.
- [ ] Audit retained.

---

# 9324 — Definition of Done — Observability

- [ ] Argo metrics scraped.
- [ ] Control-plane logs centralized.
- [ ] Sync failure alerts.
- [ ] OutOfSync aging alert/policy.
- [ ] Degraded application alerts.
- [ ] Deployment annotations published.
- [ ] Runbooks linked.
- [ ] Release Git revision/digest visible.

---

# 9325 — Production Readiness Checklist

Before production GitOps rollout:

- [ ] Production Argo topology approved.
- [ ] HA/capacity strategy defined.
- [ ] GitOps repository protected.
- [ ] AppProjects restricted.
- [ ] SSO/RBAC implemented.
- [ ] Repository credentials managed securely.
- [ ] Cluster access least-privilege.
- [ ] Secret integration operational.
- [ ] Manifest/policy CI gates active.
- [ ] Production Apps use immutable image digests.
- [ ] Sync/prune/self-heal policies explicit.
- [ ] Change-freeze/sync-window policy defined where needed.
- [ ] Migration ordering tested.
- [ ] Rollback through Git tested.
- [ ] Drift/self-heal tested.
- [ ] Argo metrics/logs/alerts operational.
- [ ] Deployment annotations integrated with PART 31.
- [ ] Control-plane backup/rebuild procedure tested.
- [ ] Registry/Git/secret-manager DR dependencies documented.
- [ ] Break-glass process documented and audited.

---

# 9326 — Initial Implementation Order

Recommended:

```text
1. Create protected GitOps repository
2. Define repository/environment layout
3. Install non-production Argo CD
4. Configure SSO/RBAC
5. Define restricted AppProjects
6. Onboard one non-critical service Application
7. Add CI render/policy tests
8. Implement immutable digest promotion
9. Configure sync/health/notifications
10. Add External Secrets integration
11. Test drift/self-heal/prune behavior
12. Implement migration Job pattern
13. Add ApplicationSet where repetition justifies it
14. Add staging promotion and rollback test
15. Deploy isolated/approved production Argo CD topology
16. Onboard production services gradually
17. Add HA/capacity tuning
18. Test Argo control-plane DR
19. Enforce stronger admission/image trust in PART 35
```

---

# 9327 — Minimum Viable GitOps Standard

Every production service must have:

```text
Git-managed desired state
protected review path
explicit AppProject
approved source repo
approved cluster/namespace
immutable image digest
no plaintext secrets
clear sync policy
health visibility
rollback revision
owner/runbook
```

---

# 9328 — Mature GitOps Standard

Mature platform additionally has:

```text
SSO/MFA
least-privilege RBAC
self-heal where safe
controlled prune
sync windows
ApplicationSet automation
policy-as-code
migration hooks/jobs
observability integration
HA control plane
DR rebuild tests
multi-cluster governance
admission/image trust
```

---

# 9329 — Anti-Pattern: CI Applies Production Directly

Avoid normal workflow:

```text
GitLab runner
  ↓
kubectl apply
  ↓
production
```

with broad cluster credentials.

Use GitOps reconciliation.

---

# 9330 — Anti-Pattern: Git Contains Secrets

Avoid:

```text
password: actual-production-password
```

in manifests, Helm values, Kustomize patches, CI artifacts, or Git history.

---

# 9331 — Anti-Pattern: Wildcard Production Project

Avoid production AppProject with unrestricted:

```text
repositories
clusters
namespaces
resource kinds
```

unless there is a very deliberate privileged platform use case.

---

# 9332 — Anti-Pattern: Everyone Can Sync Production

Production sync permission is a change authority.

Do not grant it casually to every developer.

---

# 9333 — Anti-Pattern: Mutable Image Tag

Avoid:

```text
image: order-service:latest
```

for production.

It breaks artifact traceability.

---

# 9334 — Anti-Pattern: Manual Drift as Configuration

Avoid maintaining production via repeated:

```text
kubectl edit
kubectl patch
manual scale
```

without Git reconciliation.

---

# 9335 — Anti-Pattern: Broad Ignore Differences

Do not hide an entire resource spec because one field changes automatically.

Fix ownership or ignore the exact known field.

---

# 9336 — Anti-Pattern: Force/Replace Everywhere

Destructive sync options are not a generic fix for immutable-field or apply problems.

Understand the resource lifecycle first.

---

# 9337 — Anti-Pattern: One Giant Application

Avoid placing every microservice and platform component in one production Application if they have different owners and lifecycles.

---

# 9338 — Anti-Pattern: One Application per Tiny Object

The opposite extreme also creates operational noise.

Use meaningful deployment/lifecycle boundaries.

---

# 9339 — Anti-Pattern: GitOps Owns Terraform Resources

Do not let Argo CD and Terraform continuously fight over the same cloud/Kubernetes object.

Define ownership before implementation.

---

# 9340 — Anti-Pattern: Argo Hook for Business Workflow

Do not implement:

```text
order Saga
payment retry engine
mission workflow
```

as Argo CD hooks.

Hooks are deployment lifecycle tools.

---

# 9341 — Anti-Pattern: Destructive DB Migration in Same Release

Avoid:

```text
drop old column
+
deploy new app
```

when old replicas still need the column.

Use expand/contract.

---

# 9342 — Anti-Pattern: Argo Healthy = Release Safe

Argo health alone does not prove:

```text
correct checkout
correct payment
correct wallet ledger
correct Kafka processing
```

Use runtime/business verification.

---

# 9343 — Anti-Pattern: Unpinned Remote Dependency

Avoid production manifests that depend on floating remote chart/base/plugin versions.

Pin and review dependencies.

---

# 9344 — Anti-Pattern: Shared Admin Credential

Do not use one shared administrator credential for humans and automation.

Use SSO and dedicated machine identities.

---

# 9345 — Anti-Pattern: No DR Bootstrap

If the team cannot reinstall Argo CD and reconnect applications from declared sources, the GitOps platform is not recoverable enough for production.

---

# 9346 — Standard Application Template

A platform template should capture at minimum:

```text
name
project
source repo
path/chart
revision
destination cluster
namespace
sync policy
sync options
labels/owner
```

---

# 9347 — Standard AppProject Template

Template should include:

```text
source repo allowlist
destinations
resource allow/deny lists
roles
sync windows if used
orphan policy
```

---

# 9348 — Standard GitOps Service Metadata

Recommended metadata:

```text
service
team
tier
repository
runbook
dashboard
on-call
business domain
```

Keep values bounded and useful for automation.

---

# 9349 — Standard Promotion Record

Promotion record should identify:

```text
service
from environment
to environment
image digest
application version
source commit
GitOps commit
migration version
approvers
```

---

# 9350 — Standard Deployment Record

After reconciliation record/correlate:

```text
environment
Argo Application
Git revision
image digest
sync result
health result
time
```

---

# 9351 — Standard Rollback Record

Record:

```text
failed release
reason
previous known-good revision/digest
rollback commit
DB compatibility decision
result
```

---

# 9352 — Standard Exception Record

For manual/break-glass/deviation:

```text
reason
scope
owner
approver
start/end
risk
follow-up Git reconciliation
```

---

# 9353 — Governance Rule: Git Is Authoritative

Production application desired state must be reproducible from reviewed Git.

Persistent undocumented manual state is a policy violation.

---

# 9354 — Governance Rule: One Owner

Every managed resource has one authoritative controller/configuration owner.

Ownership conflicts must be resolved before production.

---

# 9355 — Governance Rule: Same Digest

The production digest must be the same candidate validated through required upstream environments.

No environment-specific rebuild.

---

# 9356 — Governance Rule: No Plaintext Secrets

No production secret value belongs in GitOps Git history.

---

# 9357 — Governance Rule: Least Privilege

Argo projects, Argo RBAC, Kubernetes RBAC, repository access, and cluster identities must all follow least privilege.

---

# 9358 — Governance Rule: Deletion Is Explicit

Prune and Application deletion behavior for critical resources must be understood before enabling automatic deletion.

---

# 9359 — Governance Rule: Drift Is Actionable

Persistent production OutOfSync status is not normal background noise.

Investigate or intentionally encode the difference policy.

---

# 9360 — Governance Rule: Rollback Is Prepared

Every production change knows:

```text
previous Git revision
previous digest
DB compatibility
config/secret implications
```

before deployment.

---

# 9361 — Governance Rule: Control Plane Is Rebuildable

Argo CD configuration must be sufficiently declarative that the team can restore deployment control without reconstructing undocumented manual state.

---

# 9362 — Governance Rule: Terraform Boundary

Argo CD does not become the infrastructure provisioner for resources owned by Terraform.

PART 34 defines infrastructure-as-code ownership and lifecycle.

---

# 9363 — PART 33 Deliverables

PART 33 produces:

1. Git as deployment source-of-truth model.
2. CI vs GitOps responsibility boundary.
3. Pull-based deployment architecture.
4. Argo CD control-plane architecture.
5. Production/non-production topology guidance.
6. Repository separation strategy.
7. GitOps repository layouts.
8. Base/overlay conventions.
9. Kustomize/Helm guidance.
10. Immutable revision/digest rules.
11. Application standard.
12. AppProject security boundary.
13. ApplicationSet standards.
14. Environment/cluster mapping.
15. Cluster onboarding/credentials guidance.
16. SSO/RBAC model.
17. Repository credential security.
18. Secrets/external secret integration.
19. Manual vs automated sync.
20. Self-heal guidance.
21. Prune/deletion safety.
22. Sync options governance.
23. Sync windows/change freeze.
24. Hooks and sync phases.
25. Sync-wave ordering.
26. Database migration Job integration.
27. Expand/contract migration rules.
28. Health-assessment model.
29. Runtime-health boundary.
30. Diff/ignore-difference standards.
31. Drift/break-glass handling.
32. Orphaned-resource guidance.
33. Resource ownership rules.
34. Promotion-through-Git model.
35. UAT/staging/production promotion.
36. Rollback-through-Git model.
37. Progressive delivery boundary.
38. Manifest/policy CI validation.
39. Git branch/CODEOWNERS governance.
40. Supply-chain trust linkage.
41. Secret/config rotation deployment behavior.
42. Network/RBAC/service-account change controls.
43. Observability and deployment annotations.
44. Audit requirements.
45. Argo security controls.
46. Upgrade strategy.
47. Self-management/bootstrap strategy.
48. DR/rebuild architecture.
49. Operational runbooks.
50. Performance/capacity guidance.
51. GitOps threat model.
52. Per-domain release considerations.
53. GitOps test strategy.
54. Definition-of-Done checklists.
55. Production-readiness checklist.
56. Initial implementation order.
57. Minimum/mature GitOps standards.
58. Anti-patterns.
59. Standard templates and records.
60. Governance rules.
61. Handoff to Infrastructure / Terraform.

---

# 9364 — Exit Criteria

PART 33 is complete when the team can answer:

### Source of Truth

```text
Can every production Kubernetes application state be traced to reviewed Git desired state?
```

### Artifact

```text
Does production reference the exact immutable image digest approved by PART 32?
```

### Access

```text
Can developers, release managers, automation, and platform admins perform only the GitOps actions their roles require?
```

### Project Isolation

```text
Can each AppProject deploy only from approved repositories to approved clusters/namespaces/resource types?
```

### Secrets

```text
Can Argo reconcile applications without production secret values being stored in Git?
```

### Sync

```text
Is manual/automated sync, self-heal, prune, retry, and change-window behavior explicit for every production application?
```

### Migration

```text
Can a required migration run once safely, block an incompatible rollout on failure, and preserve expand/contract compatibility?
```

### Drift

```text
Will unauthorized/manual production drift be detected and either reconciled or handled through break-glass procedure?
```

### Health

```text
Do we distinguish Argo synchronization/health from real user/business SLO health?
```

### Rollback

```text
Can the team revert desired state to the previous known-good digest/config while understanding database compatibility?
```

### Recovery

```text
Can Argo CD and its application definitions be rebuilt from declared sources after control-plane loss?
```

### Audit

```text
Can we reconstruct Git change → approval → Argo sync → Kubernetes rollout → health → rollback if any?
```

If these answers are clear, tested, and operationally owned, the platform has a production-grade GitOps deployment model.

---

# 9365 — Handoff to PART 34

PART 34 defines Infrastructure / Terraform.

```text
PART 33
GitOps / Argo CD
      ↓
Declarative Kubernetes Application State
      ↓
PART 34
Infrastructure / Terraform
```

PART 34 will define:

```text
Infrastructure as Code
Terraform State
Remote Backend
State Locking
Provider Versioning
Module Standards
Environment / Account Structure
VPC / Network
Kubernetes Cluster Provisioning
Node Pools
Managed PostgreSQL
Managed Kafka
Managed Redis
Object Storage
Load Balancers
DNS Foundations
IAM / Workload Identity Foundations
KMS / Encryption
Secret-Manager Foundations
Observability Infrastructure
Backup Infrastructure
Terraform Plan / Apply Workflow
Drift Detection
Import
State Recovery
Module Versioning
Policy as Code
Cost Governance
Destruction Protection
Disaster Recovery
```

The key boundary is:

```text
PART 33
= reconcile Kubernetes application/platform desired state

PART 34
= provision and lifecycle-manage infrastructure foundations
```

Do not let Argo CD and Terraform manage the same resource independently.

---

# PART 33 — Summary

GitOps makes reviewed Git desired state the deployment authority for Kubernetes workloads.

The core control flow is:

```text
PART 32 Verified Image Digest
        ↓
Promotion Merge Request
        ↓
Protected GitOps Repository
        ↓
Argo CD
        ↓
Compare Desired vs Live
        ↓
Sync / Reconcile
        ↓
Kubernetes
        ↓
Health + Observability
```

The ownership flow is:

```text
Terraform
  → infrastructure foundations

Argo CD
  → Kubernetes desired state

Applications
  → business behavior

Data Services
  → authoritative durable business state
```

The promotion model remains:

```text
DEV
  ↓
QA
  ↓
UAT
  ↓
STAGING
  ↓ same immutable digest
PRODUCTION
```

The recovery model is:

```text
Git Revert / Previous Desired State
        ↓
Argo Reconciliation
        ↓
Previous Known-Good Application State
```

with the explicit warning:

```text
application rollback does not automatically reverse database migrations
```

The most important architecture rules are:

```text
Git is the deployment source of truth.
Use pull-based reconciliation instead of broad CI-to-cluster deployment.
Build once; promote the exact same image digest.
Use explicit restricted AppProjects in production.
Protect production GitOps paths with review and CODEOWNERS.
Keep secrets out of Git.
Use least privilege across Argo RBAC, projects, Kubernetes RBAC, and cloud identity.
Make sync, self-heal, prune, retry, and sync-window policies explicit.
Treat prune and Application deletion as destructive operations.
Use hooks/waves only for deployment lifecycle ordering.
Keep database migrations idempotent and expand/contract compatible.
A failed required migration blocks incompatible rollout.
Argo health does not replace business SLOs or runtime observability.
Keep difference-ignore rules narrow and documented.
Detect and resolve persistent production drift.
Use break-glass only for incidents and reconcile back to Git.
Promote through Git rather than rebuilding artifacts.
Rollback by restoring Git desired state to a known-good digest/config.
Do not let Argo CD and Terraform own the same resource.
Make the Argo CD control plane reproducible and disaster-recovery tested.
```

The next chapter defines the infrastructure foundation beneath the GitOps deployment layer:

```text
PART 34 — Infrastructure / Terraform
```

---

**End of PART 33 — GitOps / Argo CD**
