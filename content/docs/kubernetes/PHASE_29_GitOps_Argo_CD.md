---
title: "PHASE 29 — GitOps / Argo CD"
---

# PHASE 29 — GitOps / Argo CD

> **Purpose:** Define and implement the complete GitOps deployment standard for Kubernetes-hosted microservices: Git as deployment source of truth, Argo CD reconciliation, Application/AppProject/ApplicationSet standards, environment overlays, promotion, rollback, drift management, sync policy, hooks/waves, migrations, secrets, RBAC/SSO, multi-cluster operations, observability, audit, disaster recovery, and production governance.
>
> **Previous Phase:** Phase 28 — CI/CD
>
> **Next Phase:** Phase 30 — Terraform
>
> **Primary Architecture Basis:** PART 33 — GitOps / Argo CD.
>
> **Primary Stack:** Argo CD, Kubernetes, GitLab, Kustomize and/or Helm, approved OCI registry, External Secrets / approved secret manager, OpenTelemetry, Prometheus, Grafana.
>
> **Status:** Implementation-Ready GitOps Deployment Specification

---

# 1. Phase 29 Implementation Mandate

Core rule:

```text
Production deployment state is declared in Git
and reconciled by a controlled deployment system.
```

Normal production deployment flow:

```text
Phase 28 Verified Image Digest
        ↓
Promotion Merge Request
        ↓
Protected GitOps Repository
        ↓
Argo CD
        ↓
Desired vs Live Comparison
        ↓
Sync / Reconcile
        ↓
Kubernetes
        ↓
Health + Runtime Observability
```

---

# 2. Responsibility Boundary

```text
CI/CD
=
compile
test
scan
package
build/sign image
publish trusted artifact
prepare desired-state change

GitOps / Argo CD
=
observe Git
compare desired vs live
apply approved state
report sync/health
correct permitted drift
record reconciliation

Terraform
=
infrastructure foundations
cloud/network/cluster/managed services/IAM lifecycle

Application
=
business behavior and domain correctness
```

Do not let Argo CD and Terraform independently own the same resource.

---

# 3. Non-Negotiable Production Rules

```text
Git is authoritative for Kubernetes application desired state.
Use pull-based reconciliation rather than broad CI-to-cluster deployment.
Production references the exact immutable digest approved in Phase 28.
No environment-specific image rebuild.
Every production Application belongs to an explicit restricted AppProject.
Production GitOps paths are protected and reviewed.
Production secrets do not live in Git.
Argo RBAC, AppProjects, Kubernetes RBAC, and cloud identities use least privilege.
Sync, self-heal, prune, retries, and sync-window behavior are explicit.
Prune and Application deletion are destructive operations.
Hooks/waves are deployment lifecycle tools, not business workflow engines.
Required migration failure blocks incompatible rollout.
Database evolution remains expand/contract compatible.
Argo Synced/Healthy does not prove business correctness.
Persistent production drift is actionable.
Break-glass changes are temporary and reconciled to Git.
Rollback restores known-good Git desired state/digest/config.
Application rollback does not automatically reverse DB migrations.
Argo CD control plane must be rebuildable from declared sources.
```

---

# 4. Source-Recommended Initial Implementation Order

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
19. Enforce stronger admission/image trust in Phase 31
```

---

# 5. Minimum Viable GitOps Standard

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

# 6. Mature GitOps Standard

A mature platform additionally has:

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

# 7. Detailed Source-Aligned Specification

The following specification preserves PART 33 terminology, framing, examples, warnings, anti-patterns, governance rules, checklists, and handoff boundaries.

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

---

# 8. Implementation Work Breakdown

Source-derived implementation tickets:

```text
GITOPS-001 Publish GitOps deployment-source-of-truth policy
GITOPS-002 Document CI vs GitOps responsibility boundary
GITOPS-003 Document Terraform vs Argo CD ownership boundary
GITOPS-004 Prohibit normal production deployment from engineer laptops
GITOPS-005 Prohibit normal broad CI-to-cluster kubectl deployment
GITOPS-006 Define allowed push-based deployment exceptions
GITOPS-007 Create production GitOps governance decision record
GITOPS-008 Define one-authoritative-owner rule for managed resources
GITOPS-009 Create Kubernetes resource ownership matrix
GITOPS-010 Resolve Terraform/Argo ownership conflicts before production
GITOPS-011 Define GitOps application metadata standard
GITOPS-012 Define production change audit requirements
GITOPS-013 Define break-glass reconciliation requirement
GITOPS-014 Define deletion-as-destructive-operation policy
GITOPS-015 Define production OutOfSync handling policy
GITOPS-016 Define rollback-prepared-before-deploy policy
GITOPS-017 Define control-plane rebuildability requirement
GITOPS-018 Create protected GitOps repository
GITOPS-019 Separate service source and GitOps desired-state repositories
GITOPS-020 Separate platform add-on repository where required
GITOPS-021 Separate Terraform infrastructure repository
GITOPS-022 Choose primary GitOps repository layout standard
GITOPS-023 Implement service-centric base/overlay layout if selected
GITOPS-024 Implement environment-centric layout if selected
GITOPS-025 Document environment path conventions
GITOPS-026 Create production path protection
GITOPS-027 Configure CODEOWNERS for production paths
GITOPS-028 Configure CODEOWNERS for AppProject paths
GITOPS-029 Configure CODEOWNERS for network/security-sensitive paths
GITOPS-030 Restrict force push on production desired-state refs
GITOPS-031 Restrict protected ref deletion
GITOPS-032 Require merge request for production desired-state changes
GITOPS-033 Require successful CI on GitOps merge requests
GITOPS-034 Require attributable Git commit identity
GITOPS-035 Use dedicated machine identity for GitOps automation
GITOPS-036 Evaluate signed Git commits/tags as additional integrity control
GITOPS-037 Retain rollback-capable Git history
GITOPS-038 Minimize persistent Argo parameter overrides
GITOPS-039 Create emergency override reconciliation procedure
GITOPS-040 Choose first-party manifest composition standard
GITOPS-041 Define Kustomize base/overlay convention
GITOPS-042 Keep Kustomize patches readable
GITOPS-043 Avoid deep overlay inheritance
GITOPS-044 Define Helm usage for packaged platform software
GITOPS-045 Pin Helm chart/dependency versions
GITOPS-046 Prevent mutable production chart dependencies
GITOPS-047 Review third-party Helm rendered diffs
GITOPS-048 Review third-party Helm RBAC
GITOPS-049 Review third-party Helm CRDs
GITOPS-050 Review third-party Helm network exposure
GITOPS-051 Review third-party Helm persistence
GITOPS-052 Pin Kustomize remote bases
GITOPS-053 Allow plain YAML for simple resources where appropriate
GITOPS-054 Review multi-source Application ownership before use
GITOPS-055 Pin configuration-management plugins
GITOPS-056 Restrict custom plugins to justified cases
GITOPS-057 Review plugin execution/security behavior
GITOPS-058 Prevent plugin secret leakage
GITOPS-059 Validate stable resource naming
GITOPS-060 Review immutable-name changes for delete/recreate risk
GITOPS-061 Install non-production Argo CD
GITOPS-062 Approve production Argo CD topology
GITOPS-063 Use dedicated Argo CD namespace
GITOPS-064 Restrict write access to Argo CD namespace
GITOPS-065 Decide production control-plane isolation model
GITOPS-066 Implement separate production Argo CD where selected
GITOPS-067 Define HA strategy for production Argo CD
GITOPS-068 Size production Argo CD control-plane components
GITOPS-069 Ensure Argo outage does not terminate running workloads
GITOPS-070 Define Argo API/UI network exposure
GITOPS-071 Protect Argo API/UI with approved TLS
GITOPS-072 Configure approved ingress/private/VPN/WAF controls as required
GITOPS-073 Restrict Argo component NetworkPolicies
GITOPS-074 Allow only required Git provider connectivity
GITOPS-075 Allow only required Kubernetes API connectivity
GITOPS-076 Allow only required IdP/secret/notification connectivity
GITOPS-077 Avoid unrestricted Argo egress
GITOPS-078 Pin Argo CD version
GITOPS-079 Create Argo CD upgrade policy
GITOPS-080 Test Argo CD upgrade in non-production
GITOPS-081 Review CRD/API changes during upgrade
GITOPS-082 Review RBAC changes during upgrade
GITOPS-083 Review Application/ApplicationSet compatibility during upgrade
GITOPS-084 Review plugin compatibility during upgrade
GITOPS-085 Create Argo CD upgrade rollback plan
GITOPS-086 Create standard Argo CD Application template
GITOPS-087 Define Application naming convention
GITOPS-088 Map Application name to service/component/environment clearly
GITOPS-089 Define Application source repository
GITOPS-090 Define Application revision/path/chart
GITOPS-091 Define Application destination cluster
GITOPS-092 Define Application namespace
GITOPS-093 Define Application AppProject
GITOPS-094 Define Application sync policy
GITOPS-095 Define Application sync options
GITOPS-096 Attach owner metadata
GITOPS-097 Attach runbook metadata
GITOPS-098 Attach dashboard metadata
GITOPS-099 Attach on-call metadata
GITOPS-100 Keep Application boundaries aligned to lifecycle/rollback unit
GITOPS-101 Avoid one giant platform-wide Application
GITOPS-102 Avoid one Application per tiny object without need
GITOPS-103 Define typical service-owned resource set
GITOPS-104 Create shared platform Applications for add-ons
GITOPS-105 Separate platform/SRE-owned shared components
GITOPS-106 Create explicit AppProject for every production Application
GITOPS-107 Avoid permissive default project for production
GITOPS-108 Create standard AppProject template
GITOPS-109 Restrict AppProject source repositories
GITOPS-110 Restrict AppProject target clusters
GITOPS-111 Restrict AppProject target namespaces
GITOPS-112 Restrict AppProject cluster-scoped resource kinds
GITOPS-113 Restrict ClusterRole deployment by application teams
GITOPS-114 Restrict ClusterRoleBinding deployment by application teams
GITOPS-115 Restrict CRD deployment by application teams
GITOPS-116 Restrict Namespace deployment by application teams
GITOPS-117 Restrict admission-configuration deployment
GITOPS-118 Prevent normal service projects deploying to Argo namespace
GITOPS-119 Define team/domain AppProject model
GITOPS-120 Review AppProject source repositories
GITOPS-121 Review AppProject destinations
GITOPS-122 Review resource allow/deny lists
GITOPS-123 Review project roles
GITOPS-124 Review orphan monitoring
GITOPS-125 Review sync windows
GITOPS-126 Identify repeatable patterns suitable for ApplicationSet
GITOPS-127 Create standard ApplicationSet template
GITOPS-128 Use ApplicationSet only when repetition justifies it
GITOPS-129 Define ApplicationSet generator inputs
GITOPS-130 Protect repositories feeding generators
GITOPS-131 Review templated project/destination fields as privileged config
GITOPS-132 Ensure generated Applications retain explicit owners
GITOPS-133 Ensure generated Applications retain explicit AppProjects
GITOPS-134 Ensure generated Applications retain rollback model
GITOPS-135 Ensure generated Applications retain health expectations
GITOPS-136 Test ApplicationSet changes before production
GITOPS-137 Define conservative ApplicationSet deletion behavior
GITOPS-138 Prevent generator mistakes causing mass production deletion
GITOPS-139 Choose ApplicationSet vs app-of-apps deliberately
GITOPS-140 Avoid unnecessary combination of bootstrap patterns
GITOPS-141 Map each environment to cluster
GITOPS-142 Map each environment to namespace
GITOPS-143 Map each environment to Git path/revision
GITOPS-144 Map each environment to AppProject
GITOPS-145 Map each environment to secret scope
GITOPS-146 Map each environment to DNS domain
GITOPS-147 Map each environment to provider endpoints
GITOPS-148 Ensure production references only production cluster
GITOPS-149 Ensure production references only production namespaces
GITOPS-150 Ensure production references only production secret references
GITOPS-151 Ensure production references only production routing configuration
GITOPS-152 Ensure production references only approved image digest
GITOPS-153 Validate non-production namespace isolation
GITOPS-154 Validate non-production RBAC isolation
GITOPS-155 Validate non-production NetworkPolicy isolation
GITOPS-156 Validate non-production secrets isolation
GITOPS-157 Validate non-production data-store isolation
GITOPS-158 Validate non-production provider-credential isolation
GITOPS-159 Define multi-cluster onboarding process
GITOPS-160 Define target-cluster identity
GITOPS-161 Define target-cluster credential model
GITOPS-162 Define target-cluster network connectivity
GITOPS-163 Define target-cluster allowed AppProjects
GITOPS-164 Define target-cluster namespaces
GITOPS-165 Define cluster credential rotation
GITOPS-166 Define cluster removal/offboarding procedure
GITOPS-167 Ban ad-hoc production cluster registration from laptops
GITOPS-168 Prefer managed/short-lived cluster identity where supported
GITOPS-169 Constrain Argo controller Kubernetes permissions
GITOPS-170 Integrate production Argo CD with organization SSO
GITOPS-171 Use MFA through IdP where production policy requires
GITOPS-172 Disable/tightly control local admin after SSO
GITOPS-173 Create documented emergency admin/break-glass access
GITOPS-174 Define Argo viewer role
GITOPS-175 Define developer-nonprod role
GITOPS-176 Define release-approver role
GITOPS-177 Define platform-operator role
GITOPS-178 Define security-auditor role
GITOPS-179 Define tightly controlled admin role
GITOPS-180 Limit developer production access to view/diff/events
GITOPS-181 Restrict developer production sync/override privileges
GITOPS-182 Limit release manager to approved sync/rollback operations
GITOPS-183 Protect platform-operator actions with strong review
GITOPS-184 Prefer CI updating Git instead of broad Argo API access
GITOPS-185 Scope any automation Argo API access narrowly
GITOPS-186 Use least privilege across Argo RBAC
GITOPS-187 Use least privilege across AppProjects
GITOPS-188 Use least privilege across Kubernetes RBAC
GITOPS-189 Use least privilege across namespace boundaries
GITOPS-190 Use least privilege across cloud/workload identity
GITOPS-191 Manage repository credentials as platform secrets
GITOPS-192 Use read-only repository credentials where possible
GITOPS-193 Scope repository access to approved repos
GITOPS-194 Rotate repository credentials
GITOPS-195 Integrate repository credentials with secret manager
GITOPS-196 Avoid personal repository credentials
GITOPS-197 Keep Argo desired-state repository access read-only
GITOPS-198 Use separate approved writer identities for promotion commits
GITOPS-199 Allow only approved repository hosts
GITOPS-200 Prevent typosquatted/untrusted production source repositories
GITOPS-201 Verify SSH Git host keys
GITOPS-202 Verify HTTPS Git TLS chain
GITOPS-203 Distribute approved internal CA trust deliberately
GITOPS-204 Do not disable TLS verification
GITOPS-205 Alert on prolonged repository access failure
GITOPS-206 Differentiate Git unreachable vs credential vs TLS/DNS vs missing revision
GITOPS-207 Create repository-unreachable runbook
GITOPS-208 Ban plaintext production secrets in Git
GITOPS-209 Ban passwords in GitOps history
GITOPS-210 Ban API keys in GitOps history
GITOPS-211 Ban private keys in GitOps history
GITOPS-212 Ban refresh tokens in GitOps history
GITOPS-213 Ban cloud credentials in GitOps history
GITOPS-214 Ban DB passwords in GitOps history
GITOPS-215 Implement External Secrets or approved equivalent
GITOPS-216 Store secret values in approved secret manager
GITOPS-217 Let Argo manage secret references/declarations only
GITOPS-218 Define secret creation lifecycle outside Git
GITOPS-219 Define secret rotation lifecycle
GITOPS-220 Define secret revocation lifecycle
GITOPS-221 Define secret access policy/audit
GITOPS-222 If SOPS is used, define key ownership
GITOPS-223 If SOPS is used, define decryption identity
GITOPS-224 If SOPS is used, define key rotation
GITOPS-225 If SOPS is used, define recovery process
GITOPS-226 Prevent plaintext decrypted secrets in CI logs/history
GITOPS-227 Avoid secret regeneration on every Argo sync
GITOPS-228 Keep secret generation lifecycle stable
GITOPS-229 Use Git for non-secret ConfigMap-safe configuration
GITOPS-230 Review environment-specific configuration changes
GITOPS-231 Record image digest with GitOps/config revision
GITOPS-232 Record migration version with deployment
GITOPS-233 Record safe secret version/reference where auditable
GITOPS-234 Define secret rotation reload behavior
GITOPS-235 Define mounted-secret refresh behavior
GITOPS-236 Define Pod restart/rollout behavior after secret rotation
GITOPS-237 Use dual-valid overlap for credential rotation where supported
GITOPS-238 Manage certificate definitions declaratively
GITOPS-239 Keep certificate private keys out of Git
GITOPS-240 Define ConfigMap change rollout behavior
GITOPS-241 Set explicit sync policy for every Application
GITOPS-242 Choose manual vs automated sync per environment/service
GITOPS-243 Use automated sync only where review is deployment approval
GITOPS-244 Define production automated-sync prerequisites
GITOPS-245 Use manual sync where formal cutover timing requires
GITOPS-246 Avoid undocumented changes under manual-sync workflows
GITOPS-247 Separate promotion approval from sync approval deliberately
GITOPS-248 Define self-heal policy per Application
GITOPS-249 Enable self-heal for normal app resources where safe
GITOPS-250 Restrict direct cluster writes when self-heal is enabled
GITOPS-251 Document self-heal/break-glass interaction
GITOPS-252 Define prune policy per Application
GITOPS-253 Treat prune as potentially destructive
GITOPS-254 Protect Namespace deletion
GITOPS-255 Protect PVC/persistent-storage deletion
GITOPS-256 Protect shared infrastructure deletion
GITOPS-257 Protect security resource deletion
GITOPS-258 Use prune-last where appropriate
GITOPS-259 Define allow-empty policy deliberately
GITOPS-260 Prevent accidental empty render deleting production application
GITOPS-261 Review replace sync option
GITOPS-262 Review force sync option
GITOPS-263 Review server-side apply option
GITOPS-264 Review validation changes
GITOPS-265 Document destructive sync option justification
GITOPS-266 Define sync retry/backoff
GITOPS-267 Bound sync retries
GITOPS-268 Define rollout/health timeout
GITOPS-269 Treat indefinite Progressing as failed operational release
GITOPS-270 Define production sync windows
GITOPS-271 Define change-freeze windows
GITOPS-272 Define emergency sync-window exception process
GITOPS-273 Tune reconciliation frequency based on scale
GITOPS-274 Secure Git webhook endpoints
GITOPS-275 Keep polling/reconciliation as eventual fallback to webhooks
GITOPS-276 Define allowed Argo hook use cases
GITOPS-277 Ban business workflow orchestration in Argo hooks
GITOPS-278 Define PreSync hook standard
GITOPS-279 Define Sync phase standard
GITOPS-280 Define PostSync hook standard
GITOPS-281 Define SyncFail hook standard
GITOPS-282 Define sync-wave standard
GITOPS-283 Keep wave ordering simple
GITOPS-284 Define prerequisite/config wave
GITOPS-285 Define migration wave
GITOPS-286 Define application rollout wave
GITOPS-287 Define route/dependent-resource wave where needed
GITOPS-288 Define post-deploy verification wave where needed
GITOPS-289 Make hook Jobs idempotent
GITOPS-290 Use durable execution identity for non-repeatable hooks
GITOPS-291 Define hook cleanup policy
GITOPS-292 Preserve hook evidence until Argo evaluates result
GITOPS-293 Implement dedicated migration Job pattern
GITOPS-294 Use versioned migration code/image
GITOPS-295 Use least-privilege DB migration credentials
GITOPS-296 Expose migration result to observability
GITOPS-297 Use Flyway as schema-version source of truth
GITOPS-298 Record service/release/GitOps/migration identity
GITOPS-299 Run required expand migration before new app when needed
GITOPS-300 Block rollout when required PreSync migration fails
GITOPS-301 Keep contract cleanup after old replicas stop using schema
GITOPS-302 Use separate release for destructive contract step
GITOPS-303 Implement expand/contract sequence
GITOPS-304 Separate long backfills from blocked Argo sync
GITOPS-305 Make long backfills checkpointed/observable
GITOPS-306 Do not assume Git revert reverses DB migration
GITOPS-307 Record DB compatibility before rollout
GITOPS-308 Create failed-migration runbook
GITOPS-309 Define Argo health expectations per resource type
GITOPS-310 Distinguish Argo health from business correctness
GITOPS-311 Validate Kubernetes readiness semantics
GITOPS-312 Define custom resource health only when necessary
GITOPS-313 Test custom health logic
GITOPS-314 Require deployment health gate beyond Synced status
GITOPS-315 Combine Argo health with Kubernetes readiness
GITOPS-316 Combine deployment gate with smoke tests
GITOPS-317 Combine deployment gate with SLO/error observations
GITOPS-318 Combine deployment gate with critical business checks
GITOPS-319 Review effective Argo diff before production sync
GITOPS-320 Block large unexplained production diffs
GITOPS-321 Identify legitimate controller-mutated fields
GITOPS-322 Create narrow ignore-difference rules
GITOPS-323 Document resource/field/reason/owner for every ignore rule
GITOPS-324 Set review/expiry for ignore rules where appropriate
GITOPS-325 Prohibit broad Deployment-spec ignore rules
GITOPS-326 Detect manual kubectl drift
GITOPS-327 Detect manual scale drift
GITOPS-328 Detect emergency hotfix drift
GITOPS-329 Detect unauthorized resource changes
GITOPS-330 Investigate persistent OutOfSync status
GITOPS-331 Reconcile safe drift back to Git
GITOPS-332 Record incident/change for manual production drift
GITOPS-333 Create break-glass direct-change workflow
GITOPS-334 Record break-glass actor/reason
GITOPS-335 Require follow-up Git change or live revert
GITOPS-336 Close break-glass session explicitly
GITOPS-337 Account for self-heal before emergency patching
GITOPS-338 Enable orphan monitoring only in scoped projects/namespaces
GITOPS-339 Avoid broad orphan monitoring without ownership clarity
GITOPS-340 Ensure Argo resource tracking is reliable
GITOPS-341 Prevent copied tracking metadata across Applications
GITOPS-342 Prevent two Applications managing same resource/field
GITOPS-343 Define namespace ownership explicitly
GITOPS-344 Define CRD ownership explicitly
GITOPS-345 Sequence CRD upgrade before dependent CR changes
GITOPS-346 Test CRD conversion/version behavior when relevant
GITOPS-347 Treat Application deletion as destructive production change
GITOPS-348 Protect Application deletion paths
GITOPS-349 Restrict delete RBAC
GITOPS-350 Require manual confirmation for critical deletions
GITOPS-351 Define resource-specific deletion protection
GITOPS-352 Ensure backup/recovery plan exists before destructive removal
GITOPS-353 Prevent incidental Namespace deletion
GITOPS-354 Review PersistentVolume reclaim behavior
GITOPS-355 Do not assume Git restore recovers deleted persistent data
GITOPS-356 Test prune behavior in non-production
GITOPS-357 Test ApplicationSet mass-deletion safety
GITOPS-358 Create prune-blocked runbook
GITOPS-359 Implement promotion through Git
GITOPS-360 Promote previously built digest without rebuild
GITOPS-361 Create automated promotion merge request generation
GITOPS-362 Show service/old digest/new digest in promotion MR
GITOPS-363 Show source commit/application version
GITOPS-364 Show migration version
GITOPS-365 Show release notes/risk ticket where required
GITOPS-366 Link UAT sign-off to exact artifact digest
GITOPS-367 Prevent promoting digest different from UAT-approved digest
GITOPS-368 Implement DEV→QA→UAT→STAGING→PROD sequence
GITOPS-369 Use same digest through required environments
GITOPS-370 Rehearse staging with production-like manifests
GITOPS-371 Rehearse migration sequence in staging
GITOPS-372 Validate routing/secrets references in staging
GITOPS-373 Rehearse smoke tests in staging
GITOPS-374 Rehearse rollback in staging
GITOPS-375 Keep production promotion MR narrowly scoped
GITOPS-376 Freeze unrelated candidate-path changes during final approval
GITOPS-377 Implement rollback through Git revert
GITOPS-378 Implement explicit previous-known-good digest rollback
GITOPS-379 Keep Git and live desired state aligned during rollback
GITOPS-380 Avoid controller-only rollback that conflicts with Git
GITOPS-381 Record previous image digest
GITOPS-382 Record previous GitOps revision
GITOPS-383 Record previous config revision
GITOPS-384 Record DB compatibility
GITOPS-385 Record secret-version compatibility
GITOPS-386 Record feature-flag rollback option
GITOPS-387 Support audited feature-flag recovery
GITOPS-388 Stop unsafe progression on failed sync
GITOPS-389 Preserve previous healthy replicas where possible
GITOPS-390 Alert owner on failed sync
GITOPS-391 Avoid repeated destructive retries
GITOPS-392 Investigate degraded-after-sync state
GITOPS-393 Define bounded sync backoff
GITOPS-394 Define Argo CD vs progressive-delivery controller boundary
GITOPS-395 Decide whether Argo Rollouts is adopted
GITOPS-396 If canary is adopted, define traffic percentage
GITOPS-397 If canary is adopted, define analysis metrics
GITOPS-398 If canary is adopted, define failure threshold
GITOPS-399 If canary is adopted, define promotion/abort rules
GITOPS-400 If canary is adopted, define rollback path
GITOPS-401 If blue/green is adopted, define preview environment
GITOPS-402 If blue/green is adopted, define traffic switch
GITOPS-403 If blue/green is adopted, define session implications
GITOPS-404 If blue/green is adopted, define DB compatibility
GITOPS-405 If blue/green is adopted, define rollback routing
GITOPS-406 If blue/green is adopted, define capacity cost
GITOPS-407 Document that sync does not equal traffic cutover
GITOPS-408 Render GitOps manifests in CI before merge
GITOPS-409 Validate YAML/schema in CI
GITOPS-410 Run policy checks in CI
GITOPS-411 Scan GitOps changes for secret leakage
GITOPS-412 Verify approved image digest exists
GITOPS-413 Verify required labels/metadata
GITOPS-414 Validate against compatible Kubernetes API/schema where practical
GITOPS-415 Reject root containers by policy where required
GITOPS-416 Reject privileged workloads by policy where required
GITOPS-417 Reject mutable latest image by policy
GITOPS-418 Reject missing resource requests/limits where policy requires
GITOPS-419 Reject unsafe hostPath where policy requires
GITOPS-420 Reject broad ServiceAccount access
GITOPS-421 Reject unapproved public exposure
GITOPS-422 Expose rendered diff to reviewers
GITOPS-423 Flag RBAC permission expansion
GITOPS-424 Flag ServiceAccount/workload-identity changes
GITOPS-425 Review resource request/limit changes
GITOPS-426 Review HPA/replica ownership changes
GITOPS-427 Review CronJob schedule/timezone/concurrency changes
GITOPS-428 Guard Job re-execution with durable idempotency
GITOPS-429 Reference exact immutable image digest from Phase 28
GITOPS-430 Preserve source→CI→signed image→GitOps digest trust chain
GITOPS-431 Integrate with admission/image trust when Phase 31 hardening arrives
GITOPS-432 Monitor ImagePullBackOff after sync
GITOPS-433 Monitor registry availability/authentication
GITOPS-434 Keep raw registry passwords out of Git
GITOPS-435 Pin remote chart/base/plugin dependencies
GITOPS-436 Review third-party source supply-chain risk
GITOPS-437 Treat repo-server manifest generation as privileged supply-chain function
GITOPS-438 Scrape Argo CD metrics
GITOPS-439 Centralize Argo CD control-plane logs
GITOPS-440 Monitor resource usage
GITOPS-441 Monitor reconciliation latency
GITOPS-442 Monitor sync failures
GITOPS-443 Monitor repository errors
GITOPS-444 Monitor cluster errors
GITOPS-445 Publish production deployment annotations
GITOPS-446 Include service/environment/digest/GitOps revision
GITOPS-447 Include actor/approver where available
GITOPS-448 Alert on production sync failure
GITOPS-449 Alert on aged unexpected OutOfSync
GITOPS-450 Alert on Degraded applications by service tier
GITOPS-451 Link Argo alerts to service dashboards
GITOPS-452 Link Argo alerts to runbooks
GITOPS-453 Measure Git merge→Argo detection→sync→Healthy latency
GITOPS-454 Track Synced/OutOfSync application counts
GITOPS-455 Track Healthy/Degraded/Unknown application counts
GITOPS-456 Monitor repo-server render latency/errors/cache
GITOPS-457 Monitor application-controller queues/API errors/sync duration
GITOPS-458 Configure useful deployment notifications
GITOPS-459 Avoid notification storms for normal reconciliation
GITOPS-460 Record who changed Git
GITOPS-461 Record who reviewed Git change
GITOPS-462 Record digest/config changes
GITOPS-463 Record when Argo observed desired state
GITOPS-464 Record sync time/resources changed
GITOPS-465 Record health outcome
GITOPS-466 Record rollback if any
GITOPS-467 Correlate Git history with Argo history
GITOPS-468 Correlate with Kubernetes audit logs
GITOPS-469 Correlate with CI release evidence
GITOPS-470 Avoid shared human Argo accounts
GITOPS-471 Use dedicated auditable machine identities
GITOPS-472 Protect Argo repository credentials
GITOPS-473 Protect cluster credentials
GITOPS-474 Protect SSO client secrets
GITOPS-475 Protect notification provider tokens
GITOPS-476 Protect TLS keys
GITOPS-477 Use approved secret manager for control-plane secrets
GITOPS-478 Require verified TLS for external Argo access
GITOPS-479 Do not disable repository TLS verification
GITOPS-480 Do not disable cluster TLS verification
GITOPS-481 Restrict repository trust to approved hosts
GITOPS-482 Use managed known_hosts for SSH
GITOPS-483 Use approved CA trust for HTTPS
GITOPS-484 Create GitOps security threat model
GITOPS-485 Assess malicious Git commit risk
GITOPS-486 Assess stolen repository credential risk
GITOPS-487 Assess compromised Argo control plane risk
GITOPS-488 Assess over-privileged AppProject risk
GITOPS-489 Assess destructive prune risk
GITOPS-490 Assess secret leakage risk
GITOPS-491 Assess Terraform/Argo controller-conflict risk
GITOPS-492 Assess untrusted plugin/chart risk
GITOPS-493 Assess drift/manual-change risk
GITOPS-494 Assess supply-chain artifact substitution risk
GITOPS-495 Define Argo CD bootstrap process
GITOPS-496 Use Terraform/cluster bootstrap for initial control plane as appropriate
GITOPS-497 Configure repository/identity foundations
GITOPS-498 Create root platform Application/ApplicationSet
GITOPS-499 Return normal changes to GitOps after bootstrap
GITOPS-500 Define self-managed Argo CD scope
GITOPS-501 Avoid circular recovery dependency
GITOPS-502 Choose app-of-apps or ApplicationSet bootstrap pattern deliberately
GITOPS-503 Make Argo CD rebuildable from declared sources
GITOPS-504 Document what Git recovers
GITOPS-505 Document what Git does not recover
GITOPS-506 Identify critical non-Git Argo state
GITOPS-507 Decide whether Argo namespace backup is additionally required
GITOPS-508 Ensure registry retains production and rollback digests
GITOPS-509 Plan Git repository backup/mirroring if required
GITOPS-510 Plan Git credential recovery
GITOPS-511 Plan protected branch restoration
GITOPS-512 Include secret manager in DR dependency graph
GITOPS-513 Define cluster rebuild sequence
GITOPS-514 Define DR recovery ordering
GITOPS-515 Rebuild Argo CD in DR test
GITOPS-516 Reconnect repository in DR test
GITOPS-517 Reconnect target cluster in DR test
GITOPS-518 Restore projects/RBAC in DR test
GITOPS-519 Sync representative applications in DR test
GITOPS-520 Verify production-like dependencies in DR test
GITOPS-521 Record undocumented DR dependencies as defects
GITOPS-522 Write Application OutOfSync runbook
GITOPS-523 Write Application Degraded runbook
GITOPS-524 Write Sync Failed runbook
GITOPS-525 Write Repository Unreachable runbook
GITOPS-526 Write Cluster Unreachable runbook
GITOPS-527 Write Manifest Generation Error runbook
GITOPS-528 Write Permission Denied runbook
GITOPS-529 Write Stuck Hook runbook
GITOPS-530 Write Failed Migration runbook
GITOPS-531 Write Prune Blocked runbook
GITOPS-532 Write Argo CD Control Plane Down runbook
GITOPS-533 Document diff inspection steps
GITOPS-534 Document Git-vs-live ownership diagnosis
GITOPS-535 Document controller-mutated-field diagnosis
GITOPS-536 Document repo DNS/TLS/credential diagnosis
GITOPS-537 Document cluster API/network/certificate/RBAC diagnosis
GITOPS-538 Document migration/Flyway diagnosis
GITOPS-539 Document rollback/revert decision path
GITOPS-540 Define Argo application-count capacity assumptions
GITOPS-541 Measure manifest generation cost
GITOPS-542 Measure repo-server CPU/memory
GITOPS-543 Measure controller CPU/memory
GITOPS-544 Measure Kubernetes API pressure
GITOPS-545 Measure reconciliation queue depth
GITOPS-546 Measure reconciliation latency
GITOPS-547 Tune repository caching deliberately
GITOPS-548 Tune reconciliation intervals deliberately
GITOPS-549 Review orphan-monitoring cost
GITOPS-550 Define Git repository size/structure limits where needed
GITOPS-551 Define Git provider availability dependency
GITOPS-552 Define registry availability dependency
GITOPS-553 Define secret-manager availability dependency
GITOPS-554 Define cluster API availability dependency
GITOPS-555 Plan HA for critical Argo components
GITOPS-556 Test control-plane outage while workloads continue
GITOPS-557 Define Identity release considerations
GITOPS-558 Define Customer release considerations
GITOPS-559 Define Catalog release considerations
GITOPS-560 Define Inventory release considerations
GITOPS-561 Define Cart release considerations
GITOPS-562 Define Promotion release considerations
GITOPS-563 Define Order release considerations
GITOPS-564 Define Payment high-risk GitOps controls
GITOPS-565 Define Wallet high-risk GitOps controls
GITOPS-566 Define Loyalty release considerations
GITOPS-567 Define Mission release considerations
GITOPS-568 Define Notification release considerations
GITOPS-569 Define Integration/ACL release considerations
GITOPS-570 Require stronger review for finance/security-critical promotions
GITOPS-571 Ensure contract-first cross-service rollout ordering where needed
GITOPS-572 Test Argo Application render
GITOPS-573 Test AppProject restrictions
GITOPS-574 Test repository allowlist
GITOPS-575 Test destination restrictions
GITOPS-576 Test cluster-scoped resource restrictions
GITOPS-577 Test SSO/RBAC roles
GITOPS-578 Test repository credential rotation
GITOPS-579 Test cluster credential rotation
GITOPS-580 Test External Secrets integration
GITOPS-581 Test automated sync behavior
GITOPS-582 Test manual sync behavior
GITOPS-583 Test self-heal behavior
GITOPS-584 Test prune behavior
GITOPS-585 Test allow-empty protection
GITOPS-586 Test destructive sync options where approved
GITOPS-587 Test sync windows/change freeze
GITOPS-588 Test hook phase ordering
GITOPS-589 Test sync-wave ordering
GITOPS-590 Test migration hook failure blocks rollout
GITOPS-591 Test migration hook idempotency
GITOPS-592 Test long-backfill separation
GITOPS-593 Test custom health semantics
GITOPS-594 Test large-diff review process
GITOPS-595 Test narrow ignore-difference rules
GITOPS-596 Test manual drift detection
GITOPS-597 Test break-glass reconciliation
GITOPS-598 Test orphan monitoring
GITOPS-599 Test resource tracking
GITOPS-600 Test Application deletion safeguards
GITOPS-601 Test Namespace deletion safeguards
GITOPS-602 Test promotion MR same-digest behavior
GITOPS-603 Test UAT artifact identity linkage
GITOPS-604 Test staging rehearsal
GITOPS-605 Test rollback through Git
GITOPS-606 Test feature-flag recovery
GITOPS-607 Test failed sync handling
GITOPS-608 Test retry/backoff bounds
GITOPS-609 Test observability annotations
GITOPS-610 Test Argo metrics/log alerts
GITOPS-611 Test production OutOfSync alert
GITOPS-612 Test repository failure response
GITOPS-613 Test cluster-unreachable response
GITOPS-614 Test Argo upgrade
GITOPS-615 Test Argo control-plane DR rebuild
GITOPS-616 Complete Application Definition of Done
GITOPS-617 Complete AppProject Definition of Done
GITOPS-618 Complete GitOps Repository Definition of Done
GITOPS-619 Complete Sync Definition of Done
GITOPS-620 Complete Migration Definition of Done
GITOPS-621 Complete Security Definition of Done
GITOPS-622 Complete Observability Definition of Done
GITOPS-623 Complete production-readiness checklist
GITOPS-624 Validate production Argo topology
GITOPS-625 Validate HA/capacity strategy
GITOPS-626 Validate GitOps repository protection
GITOPS-627 Validate restricted AppProjects
GITOPS-628 Validate SSO/RBAC
GITOPS-629 Validate repository credential security
GITOPS-630 Validate least-privilege cluster access
GITOPS-631 Validate secret integration
GITOPS-632 Validate manifest/policy CI gates
GITOPS-633 Validate immutable digests in production
GITOPS-634 Validate explicit sync/prune/self-heal policies
GITOPS-635 Validate sync-window/change-freeze policy
GITOPS-636 Validate migration ordering
GITOPS-637 Validate rollback through Git
GITOPS-638 Validate drift/self-heal behavior
GITOPS-639 Validate Argo metrics/logs/alerts
GITOPS-640 Validate deployment annotations
GITOPS-641 Validate control-plane rebuild procedure
GITOPS-642 Validate registry/Git/secret-manager DR dependencies
GITOPS-643 Validate break-glass audit process
GITOPS-644 Complete Phase 29 policy freeze
GITOPS-645 Run Phase 29 exit review
GITOPS-646 Hand off to Phase 30 Terraform
```

---

# 9. Phase 29 Policy Freeze Checklist

Before Phase 30, approve:

- [ ] Git as authoritative Kubernetes application desired-state source.
- [ ] CI vs GitOps responsibility boundary.
- [ ] Terraform vs Argo CD resource-ownership boundary.
- [ ] Production/non-production Argo CD topology.
- [ ] Argo CD HA strategy.
- [ ] GitOps repository separation and layout.
- [ ] Kustomize/Helm usage standard.
- [ ] Immutable Git revision/image digest policy.
- [ ] Application naming/scope standard.
- [ ] AppProject security model.
- [ ] ApplicationSet use and deletion policy.
- [ ] Environment-to-cluster/namespace/path mapping.
- [ ] Production cluster onboarding process.
- [ ] Argo global RBAC roles.
- [ ] SSO/MFA integration.
- [ ] Repository credential model.
- [ ] Secret reference / External Secrets model.
- [ ] Encrypted-secret-in-Git decision if applicable.
- [ ] Sync policy by environment.
- [ ] Self-heal policy.
- [ ] Prune/deletion safety policy.
- [ ] Sync options governance.
- [ ] Sync windows/change-freeze policy.
- [ ] Hook and sync-wave standards.
- [ ] Migration Job and expand/contract model.
- [ ] Health vs runtime/business health boundary.
- [ ] Ignore-difference policy.
- [ ] Drift/break-glass process.
- [ ] Orphan monitoring/resource tracking policy.
- [ ] Namespace and CRD ownership.
- [ ] Promotion-through-Git model.
- [ ] UAT/staging/production promotion gates.
- [ ] Rollback-through-Git model.
- [ ] Progressive delivery controller boundary.
- [ ] Manifest/policy CI validation.
- [ ] Git branch/CODEOWNERS rules.
- [ ] Supply-chain trust linkage.
- [ ] Secret/config rotation rollout behavior.
- [ ] Network/RBAC/ServiceAccount change review.
- [ ] Argo observability and notification policy.
- [ ] Production deployment audit requirements.
- [ ] Argo network/TLS/security controls.
- [ ] Argo CD upgrade strategy.
- [ ] Self-management/bootstrap strategy.
- [ ] DR/rebuild strategy.
- [ ] Operational runbook set.
- [ ] Capacity/performance monitoring.

---

# 10. Phase 29 Exit Criteria

Phase 29 is complete when the team can answer and demonstrate:

```text
SOURCE OF TRUTH
Every production Kubernetes application state is traceable
to reviewed Git desired state.

ARTIFACT
Production references the exact immutable image digest approved by Phase 28.

ACCESS
Developers, release managers, automation, and platform admins
can perform only the GitOps actions required by their roles.

PROJECT ISOLATION
Each AppProject can deploy only from approved repositories
to approved clusters/namespaces/resource types.

SECRETS
Argo reconciles applications without production secret values in Git.

SYNC
Manual/automated sync, self-heal, prune, retry, and change-window
behavior is explicit for every production Application.

MIGRATION
Required migration executes safely, blocks incompatible rollout on failure,
and preserves expand/contract compatibility.

DRIFT
Unauthorized/manual production drift is detected and reconciled
or handled through documented break-glass procedure.

HEALTH
Argo sync/health is distinguished from user/business SLO health.

ROLLBACK
Desired state can return to a previous known-good digest/config
with database compatibility understood.

RECOVERY
Argo CD and application definitions can be rebuilt from declared sources.

AUDIT
Git change → approval → Argo sync → Kubernetes rollout
→ health → rollback can be reconstructed.
```

---

# 11. Phase 29 Completion Tree

```text
PHASE 29 — GITOPS / ARGO CD

├── Git Deployment Source of Truth             ✅
├── CI vs GitOps Boundary                      ✅
├── Terraform vs Argo Ownership                ✅
├── Pull-Based Reconciliation                  ✅
├── Argo CD Control Plane                      ✅
├── Production Isolation / HA                  ✅
├── GitOps Repository                          ✅
├── Base / Overlay Layout                      ✅
├── Kustomize / Helm                           ✅
├── Immutable Git / Image Revisions            ✅
├── Application                                ✅
├── AppProject                                 ✅
├── ApplicationSet                             ✅
├── Environment / Cluster Mapping              ✅
├── Cluster Onboarding                         ✅
├── SSO / MFA / RBAC                           ✅
├── Repository Credentials                     ✅
├── External Secrets                           ✅
├── Configuration Identity                     ✅
├── Manual / Automated Sync                    ✅
├── Self-Heal                                  ✅
├── Prune / Deletion Safety                    ✅
├── Sync Options                               ✅
├── Sync Windows / Change Freeze               ✅
├── Hooks / Sync Phases                        ✅
├── Sync Waves                                 ✅
├── Migration Jobs                             ✅
├── Expand / Contract                          ✅
├── Health Assessment                          ✅
├── Runtime / SLO Health Boundary              ✅
├── Diff / Ignore Differences                  ✅
├── Drift / Break Glass                        ✅
├── Orphaned Resources                         ✅
├── Resource Ownership                         ✅
├── Promotion Through Git                      ✅
├── UAT / Staging / Production                 ✅
├── Rollback Through Git                       ✅
├── Progressive Delivery Boundary              ✅
├── Manifest / Policy CI Validation            ✅
├── Git Protection / CODEOWNERS                ✅
├── Supply-Chain Trust                         ✅
├── Secret / Config Rotation                   ✅
├── Network / RBAC Changes                     ✅
├── Argo Observability                         ✅
├── Deployment Annotations                     ✅
├── Audit                                      ✅
├── Argo Security                              ✅
├── Upgrade Strategy                           ✅
├── Bootstrap / Self-Management                ✅
├── Disaster Recovery                          ✅
├── Operational Runbooks                       ✅
├── Capacity / Performance                     ✅
├── GitOps Threat Model                        ✅
├── Domain Release Considerations              ✅
├── GitOps Test Strategy                       ✅
├── Definitions of Done                        ✅
├── Production Readiness                       ✅
└── Terraform Handoff                          ✅
```

---

# 12. Handoff to Phase 30

The next official implementation phase is:

```text
PHASE 30 — Terraform
```

Phase 30 will define infrastructure ownership including:

```text
Infrastructure as Code
Terraform state
remote backend
state locking
provider versioning
module standards
environment/account structure
VPC/network
Kubernetes cluster provisioning
node pools
managed PostgreSQL
managed Kafka
managed Redis
object storage
load balancers
DNS foundations
IAM / workload identity
KMS / encryption
secret-manager foundations
observability infrastructure
backup infrastructure
plan/apply workflow
drift detection
import
state recovery
module versioning
policy as code
cost governance
destruction protection
disaster recovery
```

Boundary:

```text
PHASE 29
Argo CD
=
reconcile Kubernetes application/platform desired state

        ↓

PHASE 30
Terraform
=
provision and lifecycle-manage infrastructure foundations
```

One resource must not have two independent desired-state controllers.

---

# 13. Final Phase 29 Principle

```text
Reviewed Git Desired State
        ↓
Argo CD
        ↓
Compare Desired vs Live
        ↓
Controlled Reconciliation
        ↓
Kubernetes
        ↓
Runtime / Business Verification
```

And:

```text
Git rollback can restore application desired state.

It cannot automatically reverse
destructive database changes or recover deleted business data.
```

**End of PHASE 29 — GitOps / Argo CD**
