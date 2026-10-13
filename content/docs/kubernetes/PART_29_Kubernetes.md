---
title: "PART 29 — KUBERNETES"
---

# PART 29 — KUBERNETES

> **Document Role:** Defines the complete Kubernetes runtime architecture, workload standards, scheduling rules, resource management, health model, autoscaling, availability controls, RBAC, workload identity, persistent storage, operational practices, testing strategy, and production-readiness requirements for the microservices platform.  
> **Previous Part:** PART 28 — Environment Strategy  
> **Next Part:** PART 30 — Networking / Gateway / TLS  
> **Status:** Platform Architecture / Kubernetes Runtime Specification  
> **Primary Stack:** Kubernetes, Java, Spring Boot, Docker, PostgreSQL, Kafka, Redis, GitLab CI/CD, Argo CD, Terraform, Prometheus, Grafana, OpenTelemetry  
> **Audience:** Backend engineers, platform engineers, DevOps engineers, SREs, security engineers, software architects, QA engineers, technical leads.

---

# 6788 — Purpose

Kubernetes defines how containerized platform services run reliably across shared environments.

It answers:

```text
How are clusters and namespaces organized?
How are services deployed?
How are Pods created and replaced?
How are applications discovered?
How are configuration and secrets injected?
How are liveness, readiness, and startup probes defined?
How are CPU and memory managed?
How do services scale horizontally?
How are rolling updates protected?
How are disruptions handled?
How are Jobs and CronJobs run?
How are service accounts and RBAC designed?
How are workloads scheduled across nodes/zones?
How is persistent storage handled?
How do we perform graceful shutdown?
How are quotas and policies enforced?
How do operators troubleshoot production workloads?
```

The core principle is:

```text
Kubernetes manages application instances.

Business correctness must remain inside
the service architecture and durable stores.
```

---

# 6789 — Kubernetes Responsibilities

Kubernetes provides:

```text
workload scheduling
container lifecycle
service discovery
rolling deployment
health-driven traffic routing
horizontal scaling
configuration injection
secret references
resource isolation
self-healing
```

It does not replace:

```text
database transactions
Kafka durability
application idempotency
Saga recovery
business authorization
backup
reconciliation
```

---

# 6790 — Platform Kubernetes Goals

The platform Kubernetes architecture should be:

```text
declarative
repeatable
secure
observable
resource-aware
highly available
GitOps-friendly
failure-tolerant
```

---

# 6791 — Cluster Strategy

Possible environment model:

```text
non-production cluster
production cluster
```

or stronger:

```text
DEV cluster
UAT/STAGING cluster
PRODUCTION cluster
```

depending scale, risk, and cost.

---

# 6792 — Production Cluster Isolation

Production should have strong isolation from non-production.

Preferred:

```text
separate Kubernetes cluster
```

or equivalent cloud account/project boundary.

---

# 6793 — Shared Non-Production Cluster

DEV/QA/UAT may share a cluster when:

```text
namespaces
RBAC
quotas
network policy
secrets
```

are properly isolated.

---

# 6794 — Namespace Strategy

Example:

```text
platform-dev
platform-qa
platform-uat
platform-staging
platform-prod
```

if environments share a cluster.

---

# 6795 — Namespace Ownership

Namespace owns:

```text
Deployments
Services
ConfigMaps
Secrets references
Jobs
CronJobs
ServiceAccounts
NetworkPolicies
ResourceQuotas
```

for one environment/team domain.

---

# 6796 — Namespace Is Not Enough

Namespace alone does not fully isolate:

```text
network traffic
cluster-level resources
storage
IAM
```

Additional controls are mandatory.

---

# 6797 — Cluster Add-Ons

Typical platform add-ons:

```text
Ingress Controller / Gateway
cert-manager
External Secrets / CSI provider
Metrics Server
Prometheus stack
OpenTelemetry Collector
Argo CD
policy engine
DNS
storage CSI
```

---

# 6798 — Add-On Ownership

Platform team owns shared cluster add-ons.

Application teams consume them through documented interfaces.

---

# 6799 — Application Deployment Unit

Each deployable microservice typically has:

```text
Deployment
Service
ServiceAccount
ConfigMap references
Secret references
HPA
PDB
NetworkPolicy
```

as applicable.

---

# 6800 — Deployment

Use Kubernetes `Deployment` for stateless application services.

Examples:

```text
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

# 6801 — Deployment Responsibilities

Deployment manages:

```text
desired replica count
Pod template
rolling updates
ReplicaSets
rollback history
```

---

# 6802 — Deployment Is Not Database Migration Engine

Do not embed long database migration behavior into every Pod start without deliberate strategy.

Production migration strategy is explicit.

---

# 6803 — Pod

Pod is:

```text
ephemeral execution unit
```

A Pod may be:

```text
restarted
replaced
rescheduled
```

at any time.

---

# 6804 — Pod Identity

Pod name/IP are:

```text
operational identities
```

not business identifiers.

---

# 6805 — Stateless Application Rule

Application should not rely on Pod-local memory/disk for durable business state.

---

# 6806 — Pod Restart Safety

Restart must be safe because:

```text
state is durable externally
requests are idempotent
Kafka consumers dedupe
Saga workers recover
```

---

# 6807 — Replica Count

Production critical service should usually have:

```text
>= 2 replicas
```

where workload/service design supports it.

---

# 6808 — Single Replica Exception

Allowed for:

```text
non-critical service
special singleton worker
low environment
```

with explicit risk.

---

# 6809 — Replica Placement

Critical replicas should avoid all running on one node.

Use:

```text
pod anti-affinity
topology spread constraints
```

---

# 6810 — Topology Spread Constraints

Preferred modern pattern for balanced placement across:

```text
zones
nodes
```

---

# 6811 — Zone Distribution

If cluster spans zones:

```text
critical service replicas
```

should be distributed across zones.

---

# 6812 — Node Distribution

Avoid:

```text
all Order Pods on one node
```

---

# 6813 — Topology Key

Examples:

```text
topology.kubernetes.io/zone
kubernetes.io/hostname
```

---

# 6814 — Scheduling Goal

Balance:

```text
availability
cost
resource utilization
```

---

# 6815 — Deployment Labels

Standard labels:

```text
app.kubernetes.io/name
app.kubernetes.io/instance
app.kubernetes.io/version
app.kubernetes.io/component
app.kubernetes.io/part-of
app.kubernetes.io/managed-by
```

---

# 6816 — Label Consistency

Labels drive:

```text
selectors
monitoring
cost
policy
troubleshooting
```

Use one standard.

---

# 6817 — Immutable Selectors

Deployment selector labels should remain stable.

Avoid changing them casually across releases.

---

# 6818 — Pod Annotations

Use for:

```text
Prometheus scrape
checksum config
sidecar injection
ownership metadata
```

where platform requires.

---

# 6819 — Service

Kubernetes `Service` provides stable internal:

```text
DNS
virtual IP
load balancing
```

for Pods.

---

# 6820 — ClusterIP

Default internal service type:

```text
ClusterIP
```

for microservice-to-microservice traffic.

---

# 6821 — Service DNS

Example:

```text
order-service.platform-prod.svc.cluster.local
```

Usually applications use short:

```text
order-service
```

inside same namespace.

---

# 6822 — No Pod IP Dependencies

Never configure application to call a specific Pod IP.

Use Service DNS.

---

# 6823 — Headless Service

Use only when:

```text
direct Pod discovery
stateful system
```

requires it.

Normal Spring Boot services use regular Service.

---

# 6824 — NodePort

Avoid for normal production application exposure.

Use:

```text
Ingress / Gateway / LoadBalancer
```

as defined later.

---

# 6825 — LoadBalancer Service

Reserved for cases requiring direct external/internal load balancer.

Most API traffic should flow through gateway/ingress architecture.

---

# 6826 — Service Port Naming

Use descriptive names:

```text
http
grpc
metrics
```

---

# 6827 — Service Port Example

```yaml
ports:
  - name: http
    port: 80
    targetPort: 8080
```

---

# 6828 — gRPC Port

May use:

```text
grpc
```

named port.

---

# 6829 — Metrics Port

If separate:

```text
metrics
```

service/port may be exposed internally only.

---

# 6830 — ConfigMap

Use ConfigMap for:

```text
non-secret configuration
```

Examples:

```text
URLs
timeouts
feature defaults
topic names
logging levels
```

---

# 6831 — Secret

Kubernetes Secret stores:

```text
secret references/material
```

but plain Kubernetes Secret alone is only base64-encoded, not an enterprise secret-management strategy.

---

# 6832 — External Secret Manager

Preferred:

```text
Vault
AWS Secrets Manager
GCP Secret Manager
Azure Key Vault
```

or approved equivalent.

---

# 6833 — Secret Injection

Possible:

```text
environment variable
mounted volume
CSI Secret Store
External Secrets Operator
```

---

# 6834 — Secret File Preference

For:

```text
private keys
certificates
```

mounted files are often preferable to giant environment variables.

---

# 6835 — ConfigMap Update Behavior

Environment-variable sourced ConfigMap value requires:

```text
Pod restart
```

to be reread.

Mounted files may update eventually, but application reload behavior must be explicit.

---

# 6836 — Config Checksum

Helm/Kustomize may annotate Deployment with:

```text
config checksum
```

to trigger rollout on ConfigMap/Secret change.

---

# 6837 — Config Versioning

Config is version-controlled through GitOps.

Do not use manual mutable runtime edits as normal workflow.

---

# 6838 — Secret Rotation

Rotation strategy:

```text
update external secret
sync/mount
restart or live reload
verify old credential revoked
```

---

# 6839 — Environment Variable Limits

Avoid huge:

```text
JSON
certificates
private keys
```

in env vars when file mount is clearer.

---

# 6840 — Downward API

Can expose:

```text
pod name
namespace
labels
```

to application if operationally useful.

---

# 6841 — Runtime Environment Metadata

OpenTelemetry resource attributes may include:

```text
namespace
pod
deployment
cluster
```

via environment/downward API.

---

# 6842 — Probes

Three health probe types:

```text
startupProbe
readinessProbe
livenessProbe
```

They have different purposes.

---

# 6843 — Startup Probe

Answers:

```text
Has application finished starting?
```

Protects slow-starting Java service from premature liveness restarts.

---

# 6844 — Readiness Probe

Answers:

```text
Should this Pod receive traffic?
```

If false:

```text
Pod remains running
Service removes it from endpoints
```

---

# 6845 — Liveness Probe

Answers:

```text
Is process irrecoverably unhealthy/stuck?
```

If repeatedly false:

```text
container restarts
```

---

# 6846 — Probe Separation

Do not use one identical expensive health endpoint for all three probes without thought.

---

# 6847 — Spring Boot Actuator

Recommended:

```text
/actuator/health/liveness
/actuator/health/readiness
```

with Kubernetes-aware health groups.

---

# 6848 — Startup Probe Example

Conceptual:

```yaml
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 5
  failureThreshold: 24
```

Illustrative only.

---

# 6849 — Readiness Probe Example

```yaml
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 2
  failureThreshold: 3
```

---

# 6850 — Liveness Probe Example

```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 3
```

---

# 6851 — Liveness Dependency Rule

Liveness should not fail because:

```text
Redis down
Kafka down
payment provider down
```

unless application process truly cannot recover.

---

# 6852 — Readiness Dependency Rule

Readiness may consider:

```text
critical database
critical required local state
```

but use carefully to avoid whole-platform cascade.

---

# 6853 — Database Readiness

If service cannot serve any request without DB:

```text
DB may influence readiness
```

---

# 6854 — Kafka Readiness

A REST service may remain ready for reads/writes using outbox even when Kafka is temporarily down.

Do not automatically fail readiness.

---

# 6855 — Redis Readiness

For disposable cache:

```text
Redis outage should not make service unready
```

if fallback exists.

---

# 6856 — Provider Readiness

External provider outage should usually not restart/remove all service Pods.

Circuit breaker/application error handling manages it.

---

# 6857 — Probe Timeout

Keep:

```text
short
```

and endpoint cheap.

---

# 6858 — Probe Authentication

Internal probe endpoint may be unauthenticated inside Pod network but must not be exposed publicly.

---

# 6859 — Probe Failure Testing

Staging must verify:

```text
startup delay
DB outage
application deadlock
```

behaviors.

---

# 6860 — Resource Requests

Requests define:

```text
scheduler reservation
```

for CPU/memory.

---

# 6861 — Resource Limits

Limits cap:

```text
CPU
memory
```

according to runtime.

---

# 6862 — CPU Request

Represents expected baseline CPU.

Scheduler uses it for placement.

---

# 6863 — CPU Limit

Too-low CPU limit may cause:

```text
throttling
latency
GC slowdown
```

---

# 6864 — Memory Request

Represents memory scheduler reserves.

---

# 6865 — Memory Limit

Exceeding memory limit may result in:

```text
OOMKilled
```

---

# 6866 — No Requests Anti-Pattern

Pods without requests can:

```text
overpack nodes
cause noisy-neighbor incidents
break autoscaling assumptions
```

---

# 6867 — No Limits Debate

CPU/memory limit strategy depends on cluster policy.

At minimum memory limits are usually important.

CPU limits should be tested to avoid throttling.

---

# 6868 — Resource Baseline

Use PART 26 measurements:

```text
idle
normal
peak
startup
```

to set requests/limits.

---

# 6869 — JVM Memory vs Pod Limit

Container memory includes more than:

```text
heap
```

Need headroom for:

```text
metaspace
direct memory
threads
native
```

---

# 6870 — Memory Example

Illustrative:

```text
Pod limit: 1 GiB
Heap max: ~600–700 MiB
Native headroom: remainder
```

Actual values must be load-tested.

---

# 6871 — CPU Example

Illustrative:

```text
request: 250m
limit: 1000m
```

for small service.

Not a universal default.

---

# 6872 — Resource Tuning

Use metrics:

```text
CPU
memory RSS
heap
GC
latency
throttling
```

---

# 6873 — Resource Regression

New release that materially increases:

```text
memory
CPU
startup time
```

should be reviewed.

---

# 6874 — Quality of Service Class

Requests/limits determine:

```text
Guaranteed
Burstable
BestEffort
```

Kubernetes QoS.

Critical services should not be BestEffort.

---

# 6875 — HPA

Horizontal Pod Autoscaler changes replica count based on metrics.

---

# 6876 — HPA Metrics

Possible:

```text
CPU
memory
custom application metrics
Kafka lag
request rate
```

---

# 6877 — CPU HPA

Simple baseline:

```text
scale when average CPU utilization > target
```

---

# 6878 — HPA and CPU Requests

CPU HPA utilization depends on:

```text
requests
```

Incorrect requests distort scaling.

---

# 6879 — Memory HPA

Memory often does not drop quickly in JVM due to heap behavior.

Use cautiously.

---

# 6880 — Custom Metric HPA

Potential:

```text
HTTP requests/sec
queue depth
Kafka consumer lag
```

may better reflect workload.

---

# 6881 — Kafka Consumer Scaling

Consumer replicas useful only up to:

```text
partition count
```

HPA cannot create more Kafka partition parallelism than available.

---

# 6882 — Kafka Lag Scaling

Can scale consumer Deployment based on:

```text
records lag
oldest lag age
```

using KEDA or custom metrics.

---

# 6883 — KEDA

Optional:

```text
event-driven autoscaling
```

for Kafka/work queues.

Use if platform chooses it.

---

# 6884 — HPA Min Replicas

Critical services:

```text
minReplicas >= 2
```

where HA required.

---

# 6885 — HPA Max Replicas

Must respect:

```text
DB connections
provider quotas
Kafka partitions
downstream capacity
```

---

# 6886 — Scaling Can Overload Dependencies

If Order scales from:

```text
5 → 50 Pods
```

DB/payment provider may collapse.

Capacity plan end-to-end.

---

# 6887 — Scale-Up Behavior

Can be faster for traffic spike.

---

# 6888 — Scale-Down Behavior

Should be conservative to avoid:

```text
thrashing
cold-start churn
consumer rebalances
```

---

# 6889 — HPA Stabilization Window

Use scale-down stabilization.

---

# 6890 — Autoscaling Test

Performance environment validates:

```text
trigger
scale-up time
latency during scale
scale-down
```

---

# 6891 — Vertical Scaling

Some stateful/external components scale vertically.

Application services prefer horizontal scaling where stateless.

---

# 6892 — VPA

Vertical Pod Autoscaler can recommend/adjust resources.

Use carefully with Java and disruption.

---

# 6893 — VPA Recommendation Mode

Useful initially:

```text
recommendation only
```

to tune requests.

---

# 6894 — Cluster Autoscaler

Adds/removes nodes when Pods cannot schedule or capacity is idle.

Platform responsibility.

---

# 6895 — Cluster Autoscaler Dependency

HPA may create Pods that remain Pending until cluster capacity expands.

---

# 6896 — Node Pool

Separate node pools may exist for:

```text
general application
memory-heavy workloads
system workloads
```

---

# 6897 — Application Node Pool

Most stateless services run on general-purpose pool.

---

# 6898 — Dedicated Node Pool

Use only when:

```text
special CPU/memory
compliance
noisy workload
```

justifies.

---

# 6899 — Taints

Node taint:

```text
prevents unrelated Pods
```

from scheduling unless tolerated.

---

# 6900 — Tolerations

Workload explicitly allows scheduling onto tainted node.

---

# 6901 — Taint Use Cases

Examples:

```text
platform system nodes
GPU nodes
dedicated integration nodes
```

---

# 6902 — Toleration Is Not Affinity

Toleration allows.

It does not force Pod onto node.

Use with:

```text
node affinity
```

if placement required.

---

# 6903 — Node Selector

Simple exact label scheduling.

---

# 6904 — Node Affinity

Supports richer:

```text
required
preferred
```

placement rules.

---

# 6905 — Pod Affinity

Can place Pods near others.

Use sparingly to avoid scheduling constraints.

---

# 6906 — Pod Anti-Affinity

Useful to separate replicas.

---

# 6907 — Topology Spread Preferred

Often more flexible than hard anti-affinity.

---

# 6908 — Over-Constrained Scheduling

Too many required constraints can cause:

```text
Pending Pods
```

during failures.

Prefer:

```text
required only for true constraints
preferred for optimization
```

---

# 6909 — PodDisruptionBudget

PDB limits simultaneous voluntary disruption.

Examples:

```text
node drain
cluster upgrade
```

---

# 6910 — PDB Example

For 3 replicas:

```yaml
minAvailable: 2
```

or:

```yaml
maxUnavailable: 1
```

---

# 6911 — PDB Is Not HA by Itself

PDB does not help:

```text
node crash
Pod OOM
application bug
```

It only affects voluntary eviction.

---

# 6912 — PDB and Replica Count

PDB must make sense with:

```text
replicas
```

A single-replica service with `minAvailable:1` can block node drain.

---

# 6913 — Rolling Update

Deployment default strategy:

```text
RollingUpdate
```

---

# 6914 — maxUnavailable

For critical API services:

```text
0 or low
```

depending surge capacity.

---

# 6915 — maxSurge

Allows temporary extra Pods during rollout.

---

# 6916 — Rolling Update Example

```yaml
strategy:
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

Illustrative.

---

# 6917 — Rolling Compatibility

Old/new versions coexist.

Therefore require:

```text
API backward compatibility
event compatibility
DB expand/contract
cache compatibility
```

---

# 6918 — Readiness Gate During Rollout

New Pod only receives traffic after readiness succeeds.

---

# 6919 — Failed Rollout

If new Pods never become ready:

```text
old replicas remain
```

within rollout strategy.

---

# 6920 — Rollout Timeout

Set progress deadline.

Alert when exceeded.

---

# 6921 — Deployment Revision History

Keep limited revision history for rollback visibility.

---

# 6922 — Kubernetes Rollback

Can roll Deployment to previous ReplicaSet, but GitOps desired state must also be updated.

---

# 6923 — GitOps Rollback

Preferred:

```text
revert image/config commit
```

or promote previous digest.

---

# 6924 — Database Rollback Warning

Pod rollback cannot undo incompatible DB migration.

Expand/contract remains essential.

---

# 6925 — PreStop Hook

Can help:

```text
mark unready
wait briefly
```

before termination.

Use only with known need.

---

# 6926 — SIGTERM

Kubernetes sends:

```text
SIGTERM
```

before force kill.

Application must handle gracefully.

---

# 6927 — Termination Grace Period

Set:

```text
terminationGracePeriodSeconds
```

long enough for:

```text
in-flight requests
Kafka consumer shutdown
telemetry flush
```

---

# 6928 — Shutdown Sequence

Recommended concept:

```text
Pod selected for termination
      ↓
readiness false / endpoint removed
      ↓
SIGTERM
      ↓
stop new work
      ↓
finish current safe work
      ↓
close clients
      ↓
exit
```

---

# 6929 — Load Balancer Drain Race

Traffic may briefly arrive after termination begins due to propagation.

Idempotency/retry still required.

---

# 6930 — Graceful HTTP Shutdown

Spring Boot should:

```text
stop accepting new requests
finish in-flight within timeout
```

---

# 6931 — Kafka Consumer Shutdown

Stop polling and close gracefully.

Do not commit offsets for unfinished work.

---

# 6932 — Background Worker Shutdown

Workers should:

```text
stop claiming new work
finish current transaction
release lease/allow expiry
```

---

# 6933 — Forced Kill

After grace period:

```text
SIGKILL
```

may occur.

Durable workflow recovery must handle it.

---

# 6934 — Jobs

Use Kubernetes `Job` for:

```text
finite one-off tasks
```

Examples:

```text
data migration
one-time backfill
reconciliation batch
```

---

# 6935 — Job Completion

Job succeeds when:

```text
specified Pods complete successfully
```

---

# 6936 — Job Retry

Use:

```text
backoffLimit
```

but business task must also be idempotent.

---

# 6937 — Job Idempotency

A restarted Job may rerun work.

Design:

```text
checkpoint
idempotent batch
processed marker
```

---

# 6938 — Job Timeout

Use:

```text
activeDeadlineSeconds
```

for bounded execution where appropriate.

---

# 6939 — TTL After Finished

Cleanup completed Jobs using:

```text
ttlSecondsAfterFinished
```

where supported.

---

# 6940 — Migration Job

Production DB migrations may use dedicated Job.

Advantages:

```text
explicit
observable
separate from app startup
```

---

# 6941 — Migration Job Ordering

CI/CD/GitOps strategy must ensure:

```text
migration phase
before/with application rollout
```

according to expand/contract.

---

# 6942 — Migration Job Failure

Application rollout should stop if required migration fails.

---

# 6943 — CronJob

Use for scheduled tasks:

```text
reconciliation
cleanup
report generation
expiry sweep
```

---

# 6944 — CronJob Concurrency Policy

Options:

```text
Allow
Forbid
Replace
```

Choose based on job semantics.

---

# 6945 — Reconciliation CronJob

Often:

```text
Forbid
```

to avoid overlapping long runs.

---

# 6946 — CronJob Timezone

Use explicit supported timezone or UTC schedule.

Do not assume node local timezone.

---

# 6947 — CronJob Missed Runs

Configure:

```text
startingDeadlineSeconds
```

if missing schedule has defined behavior.

---

# 6948 — CronJob History

Keep limited:

```text
successfulJobsHistoryLimit
failedJobsHistoryLimit
```

---

# 6949 — CronJob Idempotency

Scheduled job may run twice due to retries/leadership transitions.

Business operation must tolerate duplicates.

---

# 6950 — Application Scheduler vs CronJob

Use application scheduler when:

```text
domain-specific continuous worker
DB queue
service-local ownership
```

Use CronJob when:

```text
clear periodic batch
```

No universal rule.

---

# 6951 — Singleton Scheduler

If embedded in multi-replica app:

```text
DB lock
leader election
```

required.

---

# 6952 — ServiceAccount

Each workload should have dedicated:

```text
ServiceAccount
```

---

# 6953 — Default ServiceAccount

Do not run all services under namespace `default` ServiceAccount.

---

# 6954 — Workload Identity

Map ServiceAccount to cloud identity where supported.

Examples:

```text
AWS IAM Roles for Service Accounts
GCP Workload Identity
Azure Workload Identity
```

---

# 6955 — No Static Cloud Credentials

Prefer workload identity over:

```text
long-lived cloud access keys
```

in Secrets.

---

# 6956 — ServiceAccount Token

Disable automount when workload does not need Kubernetes API access:

```text
automountServiceAccountToken: false
```

---

# 6957 — Kubernetes API Access

Most business services do not need to call Kubernetes API.

---

# 6958 — RBAC

Kubernetes RBAC controls access to cluster resources.

---

# 6959 — Least Privilege

Service should not have:

```text
list all secrets
delete pods
create roles
```

unless required.

---

# 6960 — Application RBAC vs Kubernetes RBAC

Different:

```text
application RBAC
= user/business permissions

Kubernetes RBAC
= infrastructure API permissions
```

---

# 6961 — Developer RBAC

Non-prod:

```text
more permissive
```

but still scoped.

Prod:

```text
read-focused
```

for most developers.

---

# 6962 — CI/CD RBAC

Deployment identity can update:

```text
approved namespaces/resources
```

not cluster-admin by default.

---

# 6963 — Argo CD RBAC

Argo controller has required deployment permissions.

Human access to Argo is separately controlled.

---

# 6964 — Secret Read RBAC

Kubernetes API access to Secret resources is highly sensitive.

Restrict strongly.

---

# 6965 — ResourceQuotas

Namespace quota can limit:

```text
CPU requests/limits
memory
Pods
Services
PVCs
```

---

# 6966 — Quota Goal

Prevent one environment/team from exhausting shared cluster.

---

# 6967 — LimitRange

Provides default/min/max resource settings for Pods/containers.

---

# 6968 — Default Requests

LimitRange may apply safe defaults, but service manifests should still specify deliberate resources.

---

# 6969 — Pod Count Quota

Useful in shared non-prod environments.

---

# 6970 — PVC Quota

Prevents accidental large storage allocation.

---

# 6971 — PriorityClass

Can prioritize critical workloads during resource pressure.

---

# 6972 — Production Priority

Potential:

```text
gateway
identity
order/payment
```

higher than:

```text
batch analytics
```

where justified.

---

# 6973 — Priority Misuse

If every service is highest priority:

```text
priority becomes meaningless
```

---

# 6974 — Preemption

Higher-priority Pods may evict lower-priority Pods.

Use carefully.

---

# 6975 — PersistentVolume

Use for workloads requiring durable filesystem.

Most application services should not need PVC.

---

# 6976 — Application Service Storage

Typical:

```text
no PVC
```

because business data lives in managed stores.

---

# 6977 — PVC Use Cases

Examples:

```text
self-managed stateful infrastructure
special batch workspace
```

---

# 6978 — Managed Database Preference

PostgreSQL/Kafka/Redis often better as:

```text
managed service
```

outside application Kubernetes cluster when organization/platform chooses.

---

# 6979 — StatefulSet

Use for:

```text
stateful workload
stable network identity
persistent volumes
ordered lifecycle
```

Not for normal Spring Boot services.

---

# 6980 — Self-Managed Kafka/Postgres/Redis

If deployed in Kubernetes:

```text
operators
StatefulSets
storage
backup
anti-affinity
```

must be designed separately.

This chapter assumes application Kubernetes first.

---

# 6981 — EmptyDir

Use for ephemeral:

```text
/tmp
scratch
```

---

# 6982 — emptyDir Size Limit

Set where possible to prevent disk exhaustion.

---

# 6983 — Memory emptyDir

Can use RAM-backed volume.

Counts toward memory and should be bounded.

---

# 6984 — ReadOnlyRootFilesystem

Production security context should aim for:

```text
readOnlyRootFilesystem: true
```

---

# 6985 — Temp Mount

Provide writable:

```text
emptyDir
```

for `/tmp` if application requires.

---

# 6986 — SecurityContext

Typical:

```text
runAsNonRoot: true
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
```

with capabilities dropped.

---

# 6987 — runAsUser

Can set explicit UID matching image.

---

# 6988 — fsGroup

Use only when mounted volume permissions require.

---

# 6989 — Capabilities

Application containers should normally:

```text
drop ALL
```

and add none.

---

# 6990 — Seccomp

Use:

```text
RuntimeDefault
```

or stronger approved profile.

---

# 6991 — AppArmor / SELinux

Platform may enforce where supported.

---

# 6992 — Privileged Container

Forbidden for normal application workloads.

---

# 6993 — HostNetwork

Avoid for normal services.

---

# 6994 — HostPID / HostIPC

Avoid.

---

# 6995 — HostPath

Avoid application hostPath mounts.

They break portability/security.

---

# 6996 — Pod Security Admission

Namespaces should enforce:

```text
restricted
```

or organization-approved policy where possible.

---

# 6997 — Security Hardening Handoff

PART 35 expands:

```text
admission policy
seccomp
image signing
runtime hardening
```

---

# 6998 — Init Containers

Use for:

```text
pre-start file preparation
certificate setup
dependency initialization
```

when necessary.

---

# 6999 — Init Container Warning

Do not implement complex business workflows in init containers.

---

# 7000 — Migration Init Container

Possible but less explicit than Job.

Dedicated migration Job is often clearer.

---

# 7001 — Sidecar

Use sidecar when platform architecture requires:

```text
service mesh
proxy
special agent
```

Do not add app-specific sidecars casually.

---

# 7002 — Sidecar Resource Cost

Sidecars consume:

```text
CPU
memory
startup time
```

and must be included in capacity planning.

---

# 7003 — OpenTelemetry Collector Sidecar

Possible but central/daemonset collector often better depending architecture.

PART 31 decides.

---

# 7004 — Service Mesh Sidecar

If mesh chosen:

```text
mTLS
routing
telemetry
```

comes with resource and complexity costs.

---

# 7005 — DNS

Kubernetes CoreDNS resolves service names.

---

# 7006 — DNS Failure

Application clients should handle transient DNS failures with bounded retry.

---

# 7007 — DNS Caching

JVM DNS behavior should not cache stale endpoints indefinitely.

---

# 7008 — Endpoint Change

Kubernetes Service abstracts changing Pod IPs.

---

# 7009 — gRPC Load Balancing

Long-lived gRPC connections may not naturally rebalance across Pods through simple ClusterIP.

Use approved strategy:

```text
client-side resolver
service mesh
headless service
```

where required.

---

# 7010 — HTTP Keepalive

Normal HTTP client connection pools should reconnect as endpoints change.

---

# 7011 — Connection Draining

Rolling update relies on:

```text
readiness removal
graceful shutdown
client retry
```

---

# 7012 — NetworkPolicy

Defines allowed Pod traffic.

Detailed design in PART 30.

---

# 7013 — Default-Deny

Production namespaces should aim for:

```text
default deny ingress/egress
```

then explicit allows.

---

# 7014 — Service-to-Service Policy

Allow only required dependencies.

Example:

```text
order-service → inventory-service
order-service → payment-service
```

---

# 7015 — Database Network Policy

Only owning service namespace/workload should reach DB endpoint where enforceable.

---

# 7016 — Kafka Network Policy

Only approved services can reach Kafka.

Broker ACL adds another layer.

---

# 7017 — Redis Network Policy

Only approved workloads.

---

# 7018 — Egress Policy

Restrict access to:

```text
approved partner hosts
DNS
observability
```

---

# 7019 — Ingress

External traffic handled by:

```text
Ingress/Gateway
```

PART 30 covers details.

---

# 7020 — Internal Services

Most service `Service` objects should not be externally exposed.

---

# 7021 — API Gateway

External API routes through:

```text
api-gateway
```

or gateway layer.

---

# 7022 — Admin APIs

Should remain:

```text
private
restricted
```

with separate ingress/identity if needed.

---

# 7023 — Deployment Manifest Structure

Recommended:

```text
base/
overlays/
```

or Helm chart.

---

# 7024 — Helm

Good for:

```text
templating
packaging
values
```

---

# 7025 — Kustomize

Good for:

```text
base + overlays
```

with less template logic.

---

# 7026 — Choose One Primary Standard

Do not mix:

```text
Helm
Kustomize
raw manifests
```

arbitrarily per service without platform policy.

---

# 7027 — Suggested Model

Possible:

```text
Helm chart per service
+
environment values in GitOps repo
```

or:

```text
shared Kustomize base
+
environment overlays
```

---

# 7028 — Manifest Duplication

Avoid copy-paste full manifests for each environment.

Use reusable base.

---

# 7029 — Values Scope

Environment values contain:

```text
replicas
resources
URLs
secret references
feature flags
```

not business source code.

---

# 7030 — Secret Values in Helm

Do not commit actual secret values in `values.yaml`.

---

# 7031 — Generated Manifests

CI should render and validate before merge.

---

# 7032 — Manifest Validation

Tools can validate:

```text
schema
deprecated APIs
policy violations
```

---

# 7033 — Kubernetes API Versions

Use supported stable APIs.

Avoid deprecated versions.

---

# 7034 — Upgrade Compatibility

Cluster upgrade process tests manifests before production.

---

# 7035 — Resource Naming

Use consistent:

```text
<service>
<service>-config
<service>-hpa
```

---

# 7036 — Name Length

Respect DNS/Kubernetes limits.

Avoid embedding huge ticket names.

---

# 7037 — Image Reference

Use:

```text
immutable tag/digest
```

from PART 26.

---

# 7038 — imagePullPolicy

With immutable digest/tag:

```text
IfNotPresent
```

is reasonable.

Do not rely on mutable latest.

---

# 7039 — ImagePullSecret

Needed only if registry authentication requires.

Prefer workload/node identity where platform supports.

---

# 7040 — Registry Failure

Running Pods remain.

New Pods may fail to start if image cannot be pulled.

---

# 7041 — ImagePullBackOff

Troubleshoot:

```text
registry auth
image exists
DNS/network
rate limit
```

---

# 7042 — CrashLoopBackOff

Means container repeatedly exits/fails startup.

Check:

```text
logs
config
secrets
migration
port
JVM
```

---

# 7043 — Pending Pod

Check:

```text
resources
taints
affinity
PVC
quota
```

---

# 7044 — OOMKilled

Check:

```text
memory limit
heap
native memory
load
```

---

# 7045 — CPU Throttling

Check:

```text
container_cpu_cfs_throttled
```

or equivalent metrics.

---

# 7046 — Readiness Failure

Check:

```text
application startup
DB
config
probe path
timeout
```

---

# 7047 — Liveness Restart Loop

Check whether liveness includes downstream dependency incorrectly.

---

# 7048 — Evicted Pod

Can occur due to:

```text
node memory pressure
disk pressure
```

Resource requests/limits matter.

---

# 7049 — Node Drain

PDB and topology spread should preserve availability.

---

# 7050 — Node Failure

Pods reschedule on healthy nodes.

Application must tolerate restart.

---

# 7051 — Zone Failure

Requires:

```text
multi-zone cluster
replica spread
external data-store HA
```

Kubernetes alone cannot save a single-zone database.

---

# 7052 — Readiness During Dependency Failure

Avoid every service becoming unready due to one shared downstream failure and creating cascading zero endpoints.

---

# 7053 — Graceful Degradation

Example:

```text
Redis down
→ Pods stay ready
→ cache bypass
```

---

# 7054 — Fail-Closed Readiness

Example:

```text
Order DB unreachable
```

Order may become unready if it cannot safely serve core API.

---

# 7055 — ReplicaSet

Deployment creates ReplicaSets per revision.

---

# 7056 — Old ReplicaSet

Keep limited history.

No business dependency on old Pods.

---

# 7057 — Canary Deployment

Canary may run:

```text
small % traffic
```

to new version.

Implementation may use:

```text
Gateway
service mesh
Argo Rollouts
```

later.

---

# 7058 — Blue/Green

Possible for high-risk deployment.

Requires:

```text
capacity
traffic switch
DB compatibility
```

---

# 7059 — Rolling Update Default

Use rolling update for normal service changes.

Canary/blue-green only when risk justifies.

---

# 7060 — Argo Rollouts

Optional advanced controller for:

```text
canary
blue/green
analysis
```

---

# 7061 — Deployment Strategy by Risk

Examples:

```text
Notification:
rolling

Order:
rolling/canary

Payment:
canary with strict metrics

Gateway:
canary
```

depending maturity.

---

# 7062 — Release Health Gate

Monitor during rollout:

```text
error rate
latency
restart
readiness
business metrics
```

---

# 7063 — Automated Rollback

Can be considered when health metrics clearly indicate regression.

Avoid rollback loops for external incidents.

---

# 7064 — Deployment Freeze

Production incident may pause GitOps sync/deployments.

---

# 7065 — Config Rollout

Config change can be as risky as image change.

Apply same health observation.

---

# 7066 — Secret Rotation Rollout

Verify new credential before revoking old when dual-valid window possible.

---

# 7067 — Job ServiceAccount

Jobs use dedicated least-privilege ServiceAccount.

Do not reuse cluster-admin tooling account.

---

# 7068 — Admin Maintenance Job

One-off repair Jobs should be:

```text
versioned
reviewed
audited
```

---

# 7069 — kubectl exec

Use for:

```text
diagnostics
```

not regular business administration.

---

# 7070 — No Shell Production Image

If image is distroless:

```text
kubectl exec shell
```

may not work.

Use ephemeral debug container.

---

# 7071 — Ephemeral Containers

Can attach diagnostic image without changing application image.

---

# 7072 — Debug Image

Contains:

```text
curl
dig
tcpdump if permitted
ps
network tools
```

and is access-controlled.

---

# 7073 — Debug Access

Production debug is:

```text
restricted
audited
time-limited
```

---

# 7074 — Port Forward

Useful for diagnostics:

```text
kubectl port-forward
```

but must respect production access policy.

---

# 7075 — Logs

Container logs collected centrally.

`kubectl logs` useful for recent diagnostics.

---

# 7076 — Previous Logs

After crash:

```text
kubectl logs --previous
```

can help if retained locally.

Central logging remains authoritative.

---

# 7077 — Events

`kubectl describe` / events show:

```text
scheduling
probe
image pull
mount
eviction
```

issues.

---

# 7078 — Pod Conditions

Inspect:

```text
Ready
ContainersReady
PodScheduled
```

---

# 7079 — Resource Monitoring

Observe per:

```text
Pod
container
Deployment
namespace
node
```

---

# 7080 — HPA Monitoring

Track:

```text
desired replicas
current replicas
metric value
scaling events
```

---

# 7081 — PDB Monitoring

During maintenance, check:

```text
disruptionsAllowed
```

---

# 7082 — Kubernetes Events Retention

Cluster event history is short.

Important incidents rely on central monitoring/logging.

---

# 7083 — Namespace Dashboard

Show:

```text
Deployments
replicas
CPU/memory
restarts
HPA
PDB
```

---

# 7084 — Deployment Dashboard

Show:

```text
version
digest
ready replicas
unavailable replicas
restart count
latency
error rate
```

---

# 7085 — Kubernetes Metrics

Key:

```text
pod_restarts
pod_ready
container_cpu
container_memory
OOM kills
pending pods
deployment unavailable
```

---

# 7086 — Cluster Metrics

Platform:

```text
node CPU/memory
node readiness
disk pressure
API server
scheduler
controller manager
CoreDNS
```

---

# 7087 — SLO Impact

Kubernetes symptom is not always user impact.

Correlate:

```text
Pod health
+
service SLIs
```

---

# 7088 — Alert: CrashLoop

Alert when repeated restarts exceed threshold for critical service.

---

# 7089 — Alert: Deployment Unavailable

Critical when ready replicas below minimum.

---

# 7090 — Alert: Pending Pods

May indicate capacity or scheduling policy issue.

---

# 7091 — Alert: HPA Maxed

If at max replicas while load remains high:

```text
capacity issue
```

---

# 7092 — Alert: CPU Throttling

Sustained throttling may impact latency.

---

# 7093 — Alert: Memory Near Limit

Useful before OOM.

---

# 7094 — Alert: PDB Blocking Maintenance

Operational warning.

---

# 7095 — Alert: Image Pull Errors

Detect registry/credential issues.

---

# 7096 — Kubernetes Runbooks

Required:

```text
CrashLoopBackOff
ImagePullBackOff
Pending Pod
OOMKilled
Readiness failure
Liveness restart loop
HPA maxed
Node NotReady
PDB blocking
DNS failure
Secret mount failure
```

---

# 7097 — CrashLoop Runbook

```text
check previous logs
check exit code
check config/secrets
check migration
check dependency startup
```

---

# 7098 — ImagePull Runbook

```text
verify image digest/tag
registry auth
network
registry availability
```

---

# 7099 — Pending Pod Runbook

```text
kubectl describe
resource shortage
taints
affinity
quota
PVC
```

---

# 7100 — OOM Runbook

```text
inspect limit
heap/native metrics
recent traffic
thread count
memory regression
```

---

# 7101 — Readiness Runbook

```text
probe endpoint
DB connectivity
startup status
critical config
```

---

# 7102 — DNS Runbook

```text
CoreDNS health
service name
namespace
network policy
pod DNS config
```

---

# 7103 — Secret Mount Runbook

```text
secret exists
external secret sync
ServiceAccount/IAM
volume mount path
permissions
```

---

# 7104 — Node Failure Runbook

```text
confirm node NotReady
check pod rescheduling
PDB/topology
cluster autoscaler
```

---

# 7105 — Deployment Rollout Runbook

```text
check new ReplicaSet
readiness
logs
config
resource limits
rollback if regression
```

---

# 7106 — HPA Runbook

```text
metric availability
requests configured
maxReplicas
dependency capacity
```

---

# 7107 — Kubernetes Testing Strategy

Test:

```text
manifest validity
probes
resources
rollout
shutdown
autoscaling
scheduling
RBAC
network policy
secret injection
node disruption
```

---

# 7108 — Manifest Unit Test

CI renders manifests and verifies required fields.

---

# 7109 — Policy Test

Reject:

```text
root
no resources
latest tag
privileged
hostPath
```

according to policy.

---

# 7110 — Server-Side Dry Run

Use cluster/API validation where possible.

---

# 7111 — Local Kubernetes Test

Use:

```text
kind
k3d
minikube
```

for deployment-specific tests.

---

# 7112 — Local Kubernetes Scope

Test:

```text
Deployment
Service
ConfigMap
probe
```

not full production infrastructure.

---

# 7113 — Staging Kubernetes Test

Validate production-like:

```text
RBAC
network policy
HPA
PDB
rolling update
ingress
```

---

# 7114 — Probe Test

Deliberately:

```text
delay startup
break readiness
break liveness
```

and verify behavior.

---

# 7115 — Graceful Shutdown Test

Terminate Pod during:

```text
HTTP request
Kafka message
background job
```

Verify safe behavior.

---

# 7116 — Rolling Update Test

Deploy v1 → v2 under traffic.

Verify:

```text
no unacceptable errors
```

---

# 7117 — Rollback Test

Deploy bad version.

Rollback to prior digest.

Verify recovery.

---

# 7118 — HPA Test

Generate load.

Verify:

```text
scale out
service remains healthy
scale in safely
```

---

# 7119 — PDB Test

Drain node.

Verify required replicas remain available.

---

# 7120 — Topology Spread Test

Verify replicas land across nodes/zones as intended.

---

# 7121 — Node Failure Test

Terminate node/instance in staging.

Verify rescheduling.

---

# 7122 — NetworkPolicy Test

Verify:

```text
allowed caller connects
forbidden caller cannot
```

---

# 7123 — RBAC Test

ServiceAccount cannot:

```text
list secrets
```

unless required.

---

# 7124 — Secret Rotation Test

Rotate non-prod secret.

Verify rollout/reload and continuity.

---

# 7125 — Config Rollout Test

Change ConfigMap.

Verify correct Pods restart/reload.

---

# 7126 — Resource Limit Test

Run service under configured CPU/memory limits.

Verify SLO under representative load.

---

# 7127 — OOM Recovery Test

Cause controlled memory limit breach in non-prod.

Verify restart and business recovery.

---

# 7128 — CPU Throttle Test

Reduce CPU limit.

Observe latency and HPA behavior.

---

# 7129 — Job Retry Test

Kill Job Pod.

Verify idempotent continuation/retry.

---

# 7130 — CronJob Overlap Test

Long run overlaps next schedule.

Verify configured concurrency policy.

---

# 7131 — Cluster Upgrade Test

Non-prod cluster upgrade validates:

```text
manifests
controllers
ingress
storage
```

---

# 7132 — Add-On Upgrade Test

Test:

```text
cert-manager
ingress
metrics
secret operator
```

before production.

---

# 7133 — Kubernetes Security Test

Verify:

```text
non-root
read-only FS
capabilities dropped
no privileged
ServiceAccount token disabled where unused
```

---

# 7134 — Pod Escape Hardening

Detailed security testing continues in PART 35.

---

# 7135 — Resource Capacity Test

Measure:

```text
Pods/node
CPU headroom
memory headroom
surge during rollout
```

---

# 7136 — Rollout Surge Capacity

Cluster must have room for:

```text
maxSurge
```

during deployment.

---

# 7137 — Failure Capacity

After one node/zone loss, remaining cluster should schedule required replicas.

---

# 7138 — Cluster Headroom

Maintain capacity beyond normal utilization.

---

# 7139 — Bin Packing

Scheduler packs based on requests.

Bad requests create either:

```text
wasted capacity
or overload
```

---

# 7140 — Cost Optimization

Tune requests from observed P95/P99 plus headroom.

Do not blindly over-request.

---

# 7141 — Resource Right-Sizing

Review quarterly/monthly or after major releases.

---

# 7142 — Idle Service

Low-traffic service may use smaller resources but maintain availability minimum.

---

# 7143 — Scale to Zero

Generally avoid for latency-sensitive production APIs.

May be acceptable for:

```text
dev
batch
rare event worker
```

with KEDA/serverless pattern.

---

# 7144 — Cold Start

Scale-to-zero requires accepting:

```text
startup latency
```

---

# 7145 — JVM Cold Start

Measure Spring Boot startup before using aggressive autoscaling.

---

# 7146 — Pre-Warming

For predictable campaign traffic:

```text
increase replicas before event
```

may be safer than waiting for HPA.

---

# 7147 — Scheduled Scaling

Can adjust min replicas around known traffic windows.

---

# 7148 — HPA + Scheduled Scaling

Ensure policies do not fight each other.

---

# 7149 — Kafka Consumer Scale-In

Scale-in triggers rebalance.

Use stabilization.

---

# 7150 — Payment Service Scaling

Provider rate limits may cap useful replicas.

---

# 7151 — Database Pool Scaling

Total connections:

```text
replicas × pool size
```

must fit DB.

---

# 7152 — Connection Budget

Example:

```text
20 replicas × 20 connections = 400
```

Plan before HPA max.

---

# 7153 — Redis Connection Scaling

Same principle.

---

# 7154 — gRPC Connection Scaling

Watch long-lived connection behavior across replicas.

---

# 7155 — Probe Traffic Cost

Frequent probes across hundreds of Pods generate load.

Keep endpoints cheap.

---

# 7156 — Sidecar Traffic Cost

Service mesh telemetry/proxy adds overhead.

Measure.

---

# 7157 — Namespace ResourceQuota Example

Conceptual:

```yaml
hard:
  requests.cpu: "20"
  requests.memory: 40Gi
  limits.cpu: "40"
  limits.memory: 80Gi
  pods: "100"
```

Environment-specific.

---

# 7158 — LimitRange Example

Conceptual:

```yaml
defaultRequest:
  cpu: 100m
  memory: 256Mi
default:
  cpu: 1
  memory: 1Gi
```

Use only as safety fallback.

---

# 7159 — HPA Example

Conceptual:

```yaml
minReplicas: 2
maxReplicas: 10
targetCPUUtilizationPercentage: 70
```

Tune through performance testing.

---

# 7160 — PDB Example

```yaml
minAvailable: 1
```

for 2 replicas or appropriate policy.

---

# 7161 — Deployment Template Example

Conceptual:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app.kubernetes.io/name: order-service
  template:
    metadata:
      labels:
        app.kubernetes.io/name: order-service
    spec:
      serviceAccountName: order-service
      containers:
        - name: order-service
          image: registry/...@sha256:...
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
```

Illustrative only.

---

# 7162 — Probe Template Example

```yaml
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080

livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
```

Thresholds are service-specific.

---

# 7163 — SecurityContext Example

```yaml
securityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

containers:
  - securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
```

---

# 7164 — ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
data:
  PAYMENT_TIMEOUT: "800ms"
  KAFKA_ORDER_TOPIC: "order.events.v1"
```

---

# 7165 — Secret Reference Example

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: order-service-secret
        key: db-password
```

External secret controller should populate secret where architecture uses one.

---

# 7166 — ServiceAccount Example

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service
automountServiceAccountToken: false
```

unless cloud workload identity requires token mechanics.

---

# 7167 — Service Example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app.kubernetes.io/name: order-service
  ports:
    - name: http
      port: 80
      targetPort: 8080
```

---

# 7168 — Topology Spread Example

Conceptual:

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
```

Use zone + node policies for critical services.

---

# 7169 — Anti-Affinity Example

Preferred, not always required:

```text
do not place same-service replicas together
```

---

# 7170 — Node Affinity Example

Use when workload requires:

```text
specific node pool
```

not for ordinary service.

---

# 7171 — Taint/Toleration Example

Dedicated integration nodes:

```text
taint:
workload=integration:NoSchedule
```

Integration Service tolerates.

---

# 7172 — Job Example

Conceptual:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: order-reconciliation
spec:
  backoffLimit: 3
```

---

# 7173 — CronJob Example

Conceptual:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: wallet-reconciliation
spec:
  schedule: "0 * * * *"
  concurrencyPolicy: Forbid
```

---

# 7174 — Job History and Logs

Job results should be observable through:

```text
central logs
metrics
reconciliation DB records
```

not only Pod history.

---

# 7175 — Kubernetes Object Ownership

Use labels/annotations indicating:

```text
service
team
environment
managed-by
```

---

# 7176 — Owner Reference

Kubernetes controllers manage child resources automatically where applicable.

---

# 7177 — Manual Orphan Resources

Avoid manually creating Pods.

Use controllers.

---

# 7178 — Static Pod

Not relevant for application workloads.

---

# 7179 — DaemonSet

Use for node-level agents:

```text
logging
security
monitoring
```

Platform team owns.

---

# 7180 — Application DaemonSet

Rare.

Do not use just to run one Pod per node unless workload requires.

---

# 7181 — StatefulSet

Reserved for stateful infrastructure.

---

# 7182 — Operator

Kubernetes Operators may manage:

```text
Kafka
Postgres
Redis
certificates
```

if self-hosted strategy uses them.

---

# 7183 — Operator Risk

Operators add:

```text
CRDs
controller complexity
upgrade lifecycle
```

Platform must own.

---

# 7184 — CRD Governance

Cluster CRDs affect all namespaces.

Require platform review.

---

# 7185 — Admission Control

Can enforce:

```text
non-root
resource limits
allowed registries
signed images
```

PART 35 expands.

---

# 7186 — Policy Engine

Possible:

```text
Kyverno
OPA Gatekeeper
```

---

# 7187 — Policy-as-Code

Policies versioned and tested.

---

# 7188 — Namespace Bootstrap

Creating namespace should also create:

```text
ResourceQuota
LimitRange
default NetworkPolicy
RBAC
secret integration
monitoring labels
```

---

# 7189 — Environment Bootstrap

PART 28 environment IaC provisions:

```text
cluster/namespace
```

then GitOps deploys workloads.

---

# 7190 — Application Bootstrap

Service deployment prerequisites:

```text
database
secrets
topics
DNS
```

available.

---

# 7191 — Deployment Dependency Ordering

Avoid strict startup ordering between microservices.

Clients handle temporary unavailability.

---

# 7192 — Startup Init Wait Scripts

Avoid:

```text
wait-for-service-A forever
```

as architecture.

Use resilient clients/readiness.

---

# 7193 — Circular Startup Dependency

Microservices should not require:

```text
A cannot start until B
B cannot start until A
```

---

# 7194 — Database Dependency

Service can start process but readiness remains false until DB usable.

---

# 7195 — Kafka Dependency

Depending design:

```text
REST may become ready before Kafka
```

if outbox isolates producer.

Consumer-only worker may require Kafka readiness.

---

# 7196 — Consumer Deployment

Kafka consumer can be:

```text
same Deployment as REST service
```

or:

```text
separate worker Deployment
```

---

# 7197 — Separate Worker Deployment

Use when:

```text
different scaling profile
different resource needs
independent failure
```

---

# 7198 — Combined Deployment

Simpler for low-scale service.

But HPA may scale HTTP and consumer together unnecessarily.

---

# 7199 — Worker Naming

Example:

```text
mission-service
mission-event-worker
```

if split.

---

# 7200 — Outbox Publisher Deployment

Can run:

```text
inside app
```

or separate worker.

Choose based on scaling/ownership.

---

# 7201 — Scheduled Worker Deployment

May run as:

```text
CronJob
dedicated Deployment
```

depending schedule.

---

# 7202 — Reconciliation Worker

High-value financial reconciliation may deserve separate Deployment/CronJob and metrics.

---

# 7203 — Autoscaling Worker

Kafka consumer worker scaling based on lag may differ from API HPA.

---

# 7204 — Service Mesh Readiness

If sidecar proxy injected, probe/termination ordering must include it.

---

# 7205 — Sidecar Termination

Ensure proxy does not terminate before application finishes outbound calls.

---

# 7206 — Istio/Linkerd

If chosen later, standards apply cluster-wide, not per-team ad hoc.

---

# 7207 — mTLS

Service mesh may provide transport mTLS.

Application authorization remains separate.

---

# 7208 — Gateway API

Modern Kubernetes Gateway API may be preferred over classic Ingress depending platform.

PART 30 decides external routing standard.

---

# 7209 — Service Discovery Across Namespaces

Use:

```text
service.namespace
```

and explicit NetworkPolicy.

Avoid broad cross-namespace mesh without ownership.

---

# 7210 — Namespace Dependency Rule

Document permitted cross-namespace calls.

---

# 7211 — Production Namespace Layout

Possible:

```text
platform-prod
platform-observability
platform-system
```

or per-team namespaces.

---

# 7212 — Per-Service Namespace

Usually too granular initially.

Use when:

```text
security/ownership
```

requires.

---

# 7213 — Per-Domain Namespace

Possible for larger organization.

Avoid premature complexity.

---

# 7214 — NetworkPolicy Selector Stability

Use stable labels.

---

# 7215 — ServiceAccount per Deployment

API and worker may use different ServiceAccounts if privileges differ.

---

# 7216 — Secret Scope per Workload

Payment worker should not receive:

```text
Identity private key
Wallet admin secret
```

---

# 7217 — Environment Variable Scope

Only inject required variables.

---

# 7218 — Principle of Least Configuration

Service should not receive whole platform ConfigMap.

---

# 7219 — Projected Volumes

Can combine:

```text
ConfigMap
Secret
Downward API
```

into one mount where useful.

---

# 7220 — Config Hot Reload

Only if application explicitly supports it.

Otherwise rollout Pod.

---

# 7221 — Secret Hot Reload

Private key/certificate rotation may support file watch.

Test carefully.

---

# 7222 — Config Rollout Race

During rolling update old/new Pods may use different config briefly.

Business contracts must tolerate if required.

---

# 7223 — Config Atomicity

If multiple related values must change together, version them as one ConfigMap/Secret release.

---

# 7224 — Image + Config Coupling

Release metadata should record:

```text
image digest
config revision
```

---

# 7225 — Pod Environment Inspection

Operators can inspect env names but should avoid exposing secret values.

---

# 7226 — Secret Masking

CLI/UI tooling must avoid printing Secret contents casually.

---

# 7227 — Kubernetes Events Sensitive Data

Do not place secrets in command args because they may appear in Pod spec/events.

---

# 7228 — Command-Line Secret

Avoid:

```text
--password=...
```

in container args.

Use env/file secret.

---

# 7229 — Secret in Env Tradeoff

Env secrets may be visible to privileged process inspection.

Mounted files may be safer.

---

# 7230 — KMS Encryption

Cluster Secret storage should use encryption at rest / KMS where supported.

---

# 7231 — etcd

etcd contains cluster state and potentially Secrets.

Managed cluster/provider should protect backup/encryption/access.

---

# 7232 — etcd Direct Access

Application teams should never access etcd directly.

---

# 7233 — Kubernetes Backup

Workload manifests are in Git.

Cluster-state backup may still be needed for:

```text
CRDs
special state
```

depending platform.

Business data backup remains external.

---

# 7234 — GitOps Restore

Application namespace can often be recreated from:

```text
Terraform + GitOps
```

---

# 7235 — Stateless Cluster Recovery

Goal:

```text
rebuild cluster
redeploy services
reconnect durable stores
```

---

# 7236 — Stateful Cluster Recovery

If Kafka/Postgres/Redis self-hosted inside cluster:

```text
storage backup/recovery
```

becomes much more complex.

---

# 7237 — Managed Data Services Benefit

Decouples:

```text
application cluster failure
```

from durable database failure domain.

---

# 7238 — Cluster Upgrade

Managed control-plane/node upgrades are rehearsed in non-prod.

---

# 7239 — Pod Disruption During Upgrade

PDB + replicas + spread maintain availability.

---

# 7240 — API Deprecation Scan

Before Kubernetes upgrade:

```text
scan manifests for removed APIs
```

---

# 7241 — Node Image Upgrade

Test JDK/container behavior after node/container runtime upgrades.

---

# 7242 — Container Runtime

Kubernetes typically uses:

```text
containerd
```

or platform-managed runtime.

Application should not depend on Docker daemon inside node.

---

# 7243 — Docker Socket

Never mount node container runtime socket into business Pods.

---

# 7244 — RuntimeClass

Use only for:

```text
sandboxed runtime
special workload
```

if platform supports.

---

# 7245 — GPU

Not relevant for normal platform services unless future ML workloads require.

---

# 7246 — HugePages

Not needed for standard Spring Boot services.

---

# 7247 — Ephemeral Storage Requests

Can set for workloads writing meaningful temporary data.

---

# 7248 — Ephemeral Storage Limit

Protect node from runaway:

```text
/tmp
logs
temporary files
```

---

# 7249 — Container Logs and Disk

stdout logs go through runtime.

Excessive logging can still consume node/log pipeline capacity.

---

# 7250 — Log Rate Control

Application should not emit:

```text
debug flood
```

in production.

---

# 7251 — Pod Log Rotation

Node/runtime handles local rotation.

Central logging handles retention.

---

# 7252 — Terminated Pod Logs

Central logs are important because local logs disappear with Pod.

---

# 7253 — Metrics Endpoint Security

Prometheus scraping via internal network/service monitor.

Do not expose metrics publicly.

---

# 7254 — ServiceMonitor

If Prometheus Operator used:

```text
ServiceMonitor
```

defines scrape targets.

---

# 7255 — PodMonitor

Alternative for direct Pod scrape.

---

# 7256 — Metrics Labels

Use stable labels:

```text
service
namespace
version
```

not user IDs.

---

# 7257 — Trace Metadata

Inject Kubernetes resource attributes into traces.

---

# 7258 — Log Metadata

Collector enriches logs with:

```text
namespace
pod
container
deployment
node
```

---

# 7259 — Service Version

Expose deployment version/digest to telemetry.

---

# 7260 — Release Correlation

After rollout, dashboard can compare:

```text
v1.8.0
vs
v1.8.1
```

error/latency.

---

# 7261 — Pod Restart Budget

Occasional restart may be normal.

Frequent restart is defect.

---

# 7262 — Startup Time Budget

Service startup should remain within startup probe window with headroom.

---

# 7263 — Readiness Time

Measure:

```text
image pull
container start
app start
readiness
```

for deployment speed.

---

# 7264 — Rollout Duration

Track P95 rollout duration.

---

# 7265 — Large Cluster Rollout

Stagger deployments to avoid:

```text
registry spike
DB connection spike
Kafka rebalance storm
```

---

# 7266 — Startup Connection Storm

Many Pods starting simultaneously may all connect to:

```text
DB
Kafka
Redis
```

Use bounded pool initialization/backoff.

---

# 7267 — HPA Scale Storm

Same risk during sudden scale-out.

---

# 7268 — Connection Pool Warmup

Avoid eagerly opening max pool connections in every Pod without need.

---

# 7269 — Pod Ready Before Warmup

Decide whether readiness should wait for:

```text
essential caches
client initialization
```

only if required.

---

# 7270 — Cache Warmup

Usually after readiness or lazily.

Do not delay startup for massive cache preload unless justified.

---

# 7271 — JVM JIT Warmup

Early latency may be higher.

Canary traffic helps reveal.

---

# 7272 — Startup Probe Tuning

Measure actual cold-start P99.

Set threshold with headroom.

---

# 7273 — Readiness Flapping

If readiness toggles frequently:

```text
probe too sensitive
dependency unstable
application overloaded
```

investigate.

---

# 7274 — Liveness Flapping

More dangerous because causes restarts.

---

# 7275 — Probe Failure Threshold

Avoid one transient slow health request causing restart.

---

# 7276 — Grace Period Tuning

Measure longest safe in-flight operation.

Do not set termination to 5 seconds if Kafka handler needs 20 seconds.

---

# 7277 — Long-Running Request

Prefer asynchronous workflow rather than 5-minute HTTP request.

---

# 7278 — Long Kafka Handler

Split/optimize if one event processing exceeds consumer poll interval/shutdown windows.

---

# 7279 — Job Resource Limits

Jobs also need:

```text
requests
limits
```

---

# 7280 — Batch Job Priority

Low-priority batch should not starve critical APIs.

---

# 7281 — Batch Node Pool

Optional for heavy reconciliation/reporting.

---

# 7282 — CronJob Burst

Many CronJobs at exact hour can spike cluster.

Stagger schedules.

---

# 7283 — Maintenance Scheduling

Prefer off-peak for heavy non-critical batch.

---

# 7284 — Kubernetes API Rate Limits

Controllers/automation should not spam API server.

---

# 7285 — Operator Scalability

Too many custom controllers increase load.

---

# 7286 — Namespace Count

Large namespace count is manageable but governance matters.

Avoid creating one ephemeral namespace per trivial test if cleanup is unreliable.

---

# 7287 — Resource Naming for Ephemeral Env

Include:

```text
mr-123
```

or short generated ID.

---

# 7288 — Ephemeral Environment Cleanup

Automated:

```text
namespace delete
DB cleanup
DNS cleanup
secret cleanup
```

---

# 7289 — Finalizer Stuck

Namespace/resource deletion can hang due to finalizers.

Platform runbook required.

---

# 7290 — Finalizer Safety

Do not remove finalizers blindly without understanding controller cleanup.

---

# 7291 — PVC Reclaim Policy

If persistent storage used:

```text
Retain
Delete
```

policy must match data criticality.

---

# 7292 — StorageClass

Platform defines approved storage classes.

---

# 7293 — Encryption at Rest

Persistent volumes should use provider encryption where applicable.

---

# 7294 — Volume Snapshot

May support stateful workload backup.

Business DB backup strategy still separate.

---

# 7295 — Local Kubernetes Storage Difference

Do not infer production storage behavior from minikube/kind.

---

# 7296 — In-Cluster Database Warning

If teams deploy local dev PostgreSQL into Kubernetes:

```text
fine for development
```

not automatically approved for production.

---

# 7297 — Service Dependency Metadata

Manifest annotations may record:

```text
owner
runbook
repository
```

---

# 7298 — Runbook Annotation

Could include safe URL/reference to operational documentation.

---

# 7299 — Deployment Owner

Every Deployment has responsible team.

---

# 7300 — Service Criticality

Label/metadata:

```text
tier-1
tier-2
tier-3
```

can drive alert/priority policy.

---

# 7301 — Tier-1 Workload

Examples:

```text
api-gateway
identity
order
payment
wallet
```

depending business.

---

# 7302 — Tier-1 Standards

Require:

```text
>=2 replicas
PDB
spread
resources
HPA or capacity plan
strong alerts
```

---

# 7303 — Tier-2 Workload

Examples:

```text
loyalty
promotion
notification
```

depending critical path.

---

# 7304 — Tier-3 Workload

Examples:

```text
non-critical admin/reporting
```

can tolerate more disruption.

---

# 7305 — Criticality Review

Business criticality must not be inferred only from service name.

---

# 7306 — Resource Defaults by Tier

Platform may define templates:

```text
tier-1 baseline
tier-2 baseline
worker baseline
```

then tune per service.

---

# 7307 — Probe Defaults by Tier

Use common starting values but measure per service.

---

# 7308 — HPA Defaults by Tier

Do not force HPA on low-traffic service if fixed replicas simpler.

---

# 7309 — PDB Defaults by Tier

Critical services get disruption protection.

---

# 7310 — Availability Zone Requirement

Tier-1 production should spread across zones if cluster/provider supports.

---

# 7311 — Node Maintenance Test

Drain nodes regularly in staging to validate.

---

# 7312 — Pod Eviction Tolerance

Application should survive Pod replacement with:

```text
idempotency
durable state
```

---

# 7313 — Chaos Testing in Kubernetes

Examples:

```text
delete Pod
drain node
block network
kill Redis connectivity
```

in controlled environment.

---

# 7314 — Litmus / Chaos Mesh

Optional chaos tooling if organization adopts.

---

# 7315 — Manual Chaos

Simple:

```text
kubectl delete pod
```

already validates many assumptions.

---

# 7316 — Production Chaos

Only after maturity, strong controls, and approval.

---

# 7317 — Kubernetes Audit Logs

Control-plane audit should record:

```text
resource changes
RBAC actions
secret access where available
```

---

# 7318 — Deployment Audit

GitOps commit + Kubernetes audit provides:

```text
who requested desired state
what controller applied
```

---

# 7319 — Direct kubectl Change

Production should be restricted.

Emergency direct changes must be reconciled to Git.

---

# 7320 — kubectl apply from Laptop

Not standard production deployment mechanism.

---

# 7321 — GitOps Desired State

Argo CD becomes normal deployment authority in PART 33.

---

# 7322 — CI vs CD Separation

CI:

```text
build/test image
```

GitOps/CD:

```text
deploy approved image
```

---

# 7323 — Environment Promotion in Kubernetes

Change:

```text
image digest
config revision
```

in environment overlay.

---

# 7324 — Rollback in Kubernetes

Update desired state to previous known-good digest.

---

# 7325 — Config Rollback

Same principle.

---

# 7326 — Secret Rollback

More sensitive.

May require reactivating previous secret version safely.

---

# 7327 — Kubernetes API Access from CI

Prefer CI updating GitOps repo rather than direct cluster-admin.

---

# 7328 — Break-Glass Cluster Access

Reserved for incidents.

---

# 7329 — Cluster Admin

Very limited human membership.

---

# 7330 — Developer Production Access

Prefer:

```text
read-only namespace
logs/metrics via observability
```

---

# 7331 — Port-Forward Production DB

Generally prohibited or tightly controlled.

---

# 7332 — Admin Repair Job

Safer than ad-hoc shell SQL when domain-aware repair is needed.

---

# 7333 — Repair Job Artifact

Versioned container image/code.

---

# 7334 — Repair Job Audit

Record:

```text
operator
reason
input
result
```

---

# 7335 — Kubernetes Cost Attribution

Labels/namespaces can support cost allocation.

---

# 7336 — Idle Non-Prod Scaling

DEV may reduce replicas/off-hours.

---

# 7337 — Production Overprovisioning

Some headroom is intentional for:

```text
failure
spike
rollout
```

---

# 7338 — Spot/Preemptible Nodes

Can reduce cost for:

```text
non-critical workers
DEV
batch
```

Use carefully for Tier-1.

---

# 7339 — Spot Toleration

Workloads explicitly tolerate expected interruptions.

---

# 7340 — Mixed Node Pools

Critical on on-demand/stable nodes.

Batch may use spot.

---

# 7341 — PodDisruption + Spot

PDB does not prevent involuntary spot interruption.

---

# 7342 — Cluster Autoscaler with Spot

Need fallback capacity strategy.

---

# 7343 — HPA with External Metrics

Metric outage should not cause uncontrolled scaling.

---

# 7344 — Metrics Server Failure

CPU HPA may stop updating.

Monitor autoscaler health.

---

# 7345 — HPA Scale Decision Lag

Autoscaling is not instant.

Maintain minimum capacity for sudden critical spikes.

---

# 7346 — Synchronous Dependency Capacity

Scale upstream/downstream consistently.

---

# 7347 — Autoscaling Matrix

Maintain:

```text
service
metric
min
max
dependency cap
```

---

# 7348 — Example Autoscaling Matrix

```text
Order:
metric = CPU + request rate
min = 3
max = 20

Mission Worker:
metric = Kafka lag
min = 1
max = partition count

Notification Worker:
metric = Kafka lag
min = 2
max = provider quota-bound
```

---

# 7349 — HPA Target Review

Adjust from real traffic.

Do not treat initial targets as permanent.

---

# 7350 — Kubernetes Capacity Planning

Plan:

```text
normal load
peak load
node loss
rollout surge
autoscaling headroom
```

---

# 7351 — Capacity Equation

Approximate:

```text
sum(Pod requests)
+
system overhead
+
failure headroom
+
rollout surge
<= cluster capacity
```

---

# 7352 — System Reserved

Nodes require CPU/memory for:

```text
kubelet
runtime
system daemons
```

not all node capacity is allocatable.

---

# 7353 — DaemonSet Overhead

Logging/security/mesh agents consume every node.

---

# 7354 — Capacity by Zone

Ensure each zone loss scenario leaves enough schedulable capacity.

---

# 7355 — Cluster Scale Time

Node provisioning may take minutes.

HPA min replicas cover near-term spikes.

---

# 7356 — Database Capacity Coupling

Kubernetes app scaling cannot exceed DB capacity.

---

# 7357 — Kafka Capacity Coupling

Consumer scaling capped by partitions.

---

# 7358 — Provider Capacity Coupling

External provider rate limits cap throughput.

---

# 7359 — Redis Capacity Coupling

Cache connection/throughput must scale.

---

# 7360 — Backpressure

When downstream saturated:

```text
do not blindly scale upstream
```

Use rate limits/queues/circuit breakers.

---

# 7361 — Kubernetes Does Not Solve Backpressure

Application architecture from PART 21/23 remains responsible.

---

# 7362 — Vertical Resource Emergency

During incident, temporary resource increase may help.

Change should be tracked/reconciled to Git.

---

# 7363 — Manual Replica Emergency

Same.

Scale manually only when:

```text
HPA issue
immediate incident
```

then reconcile desired state.

---

# 7364 — HPA Manual Conflict

If HPA controls Deployment, manual replica change may be overridden.

Know controller ownership.

---

# 7365 — GitOps Manual Conflict

Argo may revert manual change.

Incident procedure may pause sync.

---

# 7366 — Controller Ownership

Understand which controller owns:

```text
replicas
image
annotations
```

to avoid fights.

---

# 7367 — Immutable Fields

Some Kubernetes fields require recreate.

Plan changes carefully.

---

# 7368 — Service ClusterIP

Changing Service selector/ports usually easier than replacing stable identity.

---

# 7369 — Stateful PVC Change

Often requires migration/recreate.

---

# 7370 — CRD Upgrade

Can be high-risk cluster-wide.

---

# 7371 — Kubernetes Version Skew

Control plane/nodes/clients have supported skew rules.

Platform owns compliance.

---

# 7372 — kubectl Version

Developers/operators should use compatible version.

---

# 7373 — Helm Version

Pin supported major/minor in CI.

---

# 7374 — Kustomize Version

Likewise.

---

# 7375 — Manifest Formatting

YAML style standardized.

Avoid giant unstructured values files.

---

# 7376 — Values Documentation

Each chart/value documented:

```text
purpose
default
environment override
```

---

# 7377 — Secret Placeholder

Values contain:

```text
secretRef
```

not secret value.

---

# 7378 — Config Key Rename

Treat as compatibility change between image and config.

---

# 7379 — Missing Config

Application fails startup clearly.

---

# 7380 — Unknown Config

May warn/fail based on configuration framework.

---

# 7381 — Environment-Specific Replica Count

DEV:

```text
1
```

PROD:

```text
>=2/3
```

as appropriate.

---

# 7382 — Environment-Specific HPA

DEV may disable.

STAGING/PROD enable.

---

# 7383 — Environment-Specific PDB

Usually relevant in staging/prod.

---

# 7384 — Environment-Specific Network Policy

At least UAT/staging/prod should closely match.

---

# 7385 — Environment-Specific Resources

Scale differs, but JVM settings should remain valid.

---

# 7386 — Production Resource Override

Must be evidence-based from performance tests.

---

# 7387 — Local Kubernetes Values

May reduce resources significantly.

---

# 7388 — Namespace Quota in DEV

Prevents forgotten feature branches consuming entire cluster.

---

# 7389 — Ephemeral Environment HPA

Usually unnecessary.

---

# 7390 — Production Autoscaling

Must be tested before enabling on Tier-1.

---

# 7391 — Scheduled Maintenance Job

Run in explicit namespace/environment only.

---

# 7392 — CronJob Environment Guard

Business-affecting CronJob should know environment and refuse unsafe production target mismatch.

---

# 7393 — Timezone of CronJob

Prefer UTC.

Business local time converted explicitly.

---

# 7394 — CronJob Daylight Saving

If future multi-zone/local schedules, use timezone-aware scheduling.

---

# 7395 — Job Logging

Include:

```text
job name
run id
business date
```

---

# 7396 — Job Idempotency Reference

Use deterministic run key:

```text
job_type + business_period
```

where needed.

---

# 7397 — Job Reconciliation

Financial Jobs produce reconciliation records.

---

# 7398 — Job Manual Rerun

Must be safe and audited.

---

# 7399 — CronJob Suspend

Can pause scheduled execution during incident.

---

# 7400 — Production Batch Freeze

Suspend non-critical Jobs during major incident if they add load.

---

# 7401 — Maintenance Jobs Resource Class

Set lower priority/resource caps.

---

# 7402 — Data Migration Job

Large backfill should:

```text
batch
checkpoint
throttle
resume
```

not lock DB for hours.

---

# 7403 — Backfill HPA

Usually not needed.

Control concurrency explicitly.

---

# 7404 — Backfill Node Pool

Optional for heavy compute.

---

# 7405 — Backfill Database Load

Monitor DB.

Pause if production latency affected.

---

# 7406 — Job Dead Letter

For per-record failures:

```text
persist failed items
```

rather than fail whole million-row batch.

---

# 7407 — Kubernetes Event-Driven Worker

KEDA may scale based on Kafka lag.

---

# 7408 — KEDA Min Replica

For latency-sensitive consumers, keep >0.

---

# 7409 — Scale-to-Zero Worker

Acceptable for low-priority async workload.

---

# 7410 — Scale-from-Zero Lag

Measure cold start.

---

# 7411 — Pod Startup Dependency Download

Application image should already contain dependencies.

Do not download Maven packages at runtime.

---

# 7412 — Runtime Package Installation

Forbidden.

Images immutable.

---

# 7413 — Runtime Config Fetch

Allowed from config/secret service if designed.

Must be resilient.

---

# 7414 — Init Configuration Fetch

If init container fetches config, failure blocks Pod startup.

Use only deliberately.

---

# 7415 — Sidecar Secret Agent

Possible with Vault.

Need termination/startup coordination.

---

# 7416 — Secret Expiry

Long-running Pod must handle credential expiration/rotation.

---

# 7417 — Database Credential Rotation

May require:

```text
dual password
rolling restart
connection refresh
```

---

# 7418 — Kafka Credential Rotation

Clients may need reconnect.

Test.

---

# 7419 — TLS Certificate Rotation

Mounted cert reload or Pod restart.

---

# 7420 — JWKS Rotation

Application cache refresh, not Pod restart necessarily.

---

# 7421 — ConfigMap Size

Do not store huge binary content.

Use object storage/volume/secret system as appropriate.

---

# 7422 — Secret Size

Likewise bounded.

---

# 7423 — Kubernetes Secret as Certificate Store

Can store cert/key but external secret/cert-manager often manages lifecycle.

---

# 7424 — cert-manager

Automates:

```text
TLS certificate issue/renew
```

for cluster ingress.

---

# 7425 — Certificate Renewal

Monitor expiry and renewal failure.

---

# 7426 — Gateway Certificate

PART 30 covers TLS termination.

---

# 7427 — Internal mTLS Certificate

Service mesh/workload identity may handle.

---

# 7428 — Kubernetes Namespace Secret Boundary

Secret references normally namespace-scoped.

Good for isolation.

---

# 7429 — Cross-Namespace Secret Sharing

Avoid.

Duplicate/managed secret per namespace.

---

# 7430 — Shared Certificate

If multiple namespaces need same trust material, use controlled distribution.

---

# 7431 — ConfigMap Cross-Namespace

No direct sharing.

Manage through templates/GitOps.

---

# 7432 — Service ExternalName

Can alias external DNS.

Use carefully.

---

# 7433 — External Database DNS

Service config points to managed DB endpoint.

---

# 7434 — External Kafka DNS

Managed Kafka endpoint from config.

---

# 7435 — External Redis DNS

Managed Redis endpoint.

---

# 7436 — DNS TTL and Failover

Managed service failover may change endpoint/IP.

Clients must respect DNS refresh.

---

# 7437 — Pod DNS Search

Can create unexpected resolution.

Use FQDN for sensitive external hosts.

---

# 7438 — Egress Proxy

If organization uses outbound proxy, configure explicitly.

---

# 7439 — No Internet Egress by Default

Production Pods should not have unrestricted internet if policy allows restriction.

---

# 7440 — External Partner Allowlist

Network policy/firewall permits only approved hosts.

---

# 7441 — DNS Egress

Default-deny still needs DNS allowed.

---

# 7442 — NTP

Pods use node clock; node time synchronization is platform concern.

---

# 7443 — Time Skew

Affects:

```text
JWT
TLS
Kafka
OTP
```

monitor nodes.

---

# 7444 — Node Labels

Platform-managed.

Applications should not depend on mutable arbitrary labels.

---

# 7445 — Node Drain Maintenance

Use:

```text
cordon
drain
```

with PDB.

---

# 7446 — Pod Termination on Drain

Same graceful shutdown path as rolling deploy.

---

# 7447 — PDB Misconfiguration

Can block cluster upgrades.

Test.

---

# 7448 — HPA + PDB Interaction

Scale-down respects PDB in some disruption scenarios; understand controllers.

---

# 7449 — HPA + Rolling Update

During rollout replica counts may temporarily exceed HPA desired.

Expected.

---

# 7450 — HPA + Cluster Autoscaler

Scale chain:

```text
metric rises
→ HPA creates Pods
→ Pods Pending
→ cluster autoscaler adds nodes
```

---

# 7451 — Scaling Latency Budget

Can be minutes.

Plan minimum replicas.

---

# 7452 — Request Queuing

Do not rely on HPA to catch instantaneous spikes.

Use:

```text
gateway rate limits
queue
pre-scaling
```

---

# 7453 — Pod Warm Cache

New Pod starts with empty local cache.

Traffic can briefly hit Redis/DB more.

---

# 7454 — Scale-Out Source Spike

Many Pods warming same cache can stampede.

Use cache design from PART 24.

---

# 7455 — JVM Connection Pool Startup

Configure lazy/min idle carefully.

---

# 7456 — DB Connection Max Across HPA

Must be documented.

---

# 7457 — Service Autoscaling Definition of Done

- [ ] Metric chosen.
- [ ] Min replicas.
- [ ] Max replicas.
- [ ] Scale-up behavior.
- [ ] Scale-down behavior.
- [ ] Dependency capacity checked.
- [ ] Performance test passed.
- [ ] Alert at max.

---

# 7458 — Deployment Definition of Done

- [ ] Deployment.
- [ ] Service.
- [ ] Labels.
- [ ] Non-root security context.
- [ ] Requests/limits.
- [ ] Startup/readiness/liveness probes.
- [ ] Config/Secret refs.
- [ ] ServiceAccount.
- [ ] PDB if critical.
- [ ] Spread/anti-affinity if critical.
- [ ] HPA or capacity plan.
- [ ] Graceful shutdown tested.

---

# 7459 — Job Definition of Done

- [ ] Idempotent.
- [ ] Resource limits.
- [ ] ServiceAccount.
- [ ] Retry/backoff.
- [ ] Timeout.
- [ ] Logging/metrics.
- [ ] Checkpoint/restart behavior.
- [ ] Audit if admin/repair.

---

# 7460 — CronJob Definition of Done

- [ ] Schedule.
- [ ] Timezone semantics.
- [ ] Concurrency policy.
- [ ] Missed-run policy.
- [ ] Idempotency.
- [ ] History limits.
- [ ] Alert on failure.
- [ ] Manual rerun safe.

---

# 7461 — RBAC Definition of Done

- [ ] Dedicated ServiceAccount.
- [ ] Token automount disabled if unused.
- [ ] Least privilege.
- [ ] No broad secret access.
- [ ] Human roles separate.
- [ ] CI/CD role scoped.
- [ ] Break-glass defined.

---

# 7462 — SecurityContext Definition of Done

- [ ] runAsNonRoot.
- [ ] allowPrivilegeEscalation=false.
- [ ] readOnlyRootFilesystem.
- [ ] drop ALL capabilities.
- [ ] seccomp RuntimeDefault.
- [ ] no privileged.
- [ ] no hostPath.
- [ ] no hostNetwork unless exception.

---

# 7463 — Resource Definition of Done

- [ ] CPU request.
- [ ] Memory request.
- [ ] Memory limit.
- [ ] CPU limit policy reviewed.
- [ ] JVM heap fits.
- [ ] Load-tested.
- [ ] HPA interaction understood.

---

# 7464 — Availability Definition of Done

- [ ] Replica count.
- [ ] Zone/node spread.
- [ ] PDB.
- [ ] rolling strategy.
- [ ] readiness.
- [ ] graceful shutdown.
- [ ] node drain test.
- [ ] rollback test.

---

# 7465 — Kubernetes Architecture Review Checklist

## Workload

- [ ] Correct controller type.
- [ ] Stateless assumption valid.
- [ ] Durable state external.

## Health

- [ ] Startup probe.
- [ ] Readiness probe.
- [ ] Liveness probe.
- [ ] Dependency semantics correct.

## Resources

- [ ] Requests.
- [ ] Limits.
- [ ] Headroom.
- [ ] HPA/capacity.

---

# 7466 — Scheduling Review Checklist

- [ ] Replicas spread.
- [ ] Required affinity minimal.
- [ ] Taints/tolerations justified.
- [ ] Zone resilience.
- [ ] Pending-Pod failure mode understood.

---

# 7467 — Security Review Checklist

- [ ] Non-root.
- [ ] Read-only FS.
- [ ] capabilities dropped.
- [ ] ServiceAccount.
- [ ] RBAC.
- [ ] Secret injection.
- [ ] No host mounts.
- [ ] Network policy.
- [ ] Trusted image.

---

# 7468 — Deployment Review Checklist

- [ ] Immutable digest.
- [ ] Rolling update.
- [ ] surge/unavailable.
- [ ] readiness.
- [ ] progress deadline.
- [ ] rollback.
- [ ] config revision.
- [ ] DB compatibility.

---

# 7469 — Autoscaling Review Checklist

- [ ] Metric quality.
- [ ] Min/max.
- [ ] DB connection budget.
- [ ] Kafka partition limit.
- [ ] provider quota.
- [ ] scale stabilization.
- [ ] max-replica alert.

---

# 7470 — Operations Review Checklist

- [ ] Dashboards.
- [ ] Alerts.
- [ ] Runbooks.
- [ ] audit.
- [ ] debug access.
- [ ] ephemeral container process.
- [ ] cluster upgrade procedure.
- [ ] capacity headroom.

---

# 7471 — Testing Review Checklist

- [ ] Manifest validation.
- [ ] policy tests.
- [ ] probe tests.
- [ ] graceful shutdown.
- [ ] rolling update.
- [ ] rollback.
- [ ] HPA.
- [ ] PDB/node drain.
- [ ] RBAC.
- [ ] network policy.
- [ ] secret rotation.

---

# 7472 — Production Readiness Checklist

Before production Kubernetes rollout:

- [ ] Production cluster/environment isolated.
- [ ] Namespace strategy implemented.
- [ ] Application images immutable and non-root.
- [ ] Deployments use stable labels/selectors.
- [ ] Services use ClusterIP for internal traffic.
- [ ] Startup/readiness/liveness probes tested.
- [ ] CPU/memory requests configured.
- [ ] JVM memory headroom validated.
- [ ] HPA/capacity strategy defined.
- [ ] Tier-1 services have sufficient replicas.
- [ ] Topology spread/anti-affinity configured.
- [ ] PDBs validated.
- [ ] Graceful shutdown tested.
- [ ] Rolling update and rollback tested.
- [ ] ConfigMaps versioned through GitOps.
- [ ] Secrets sourced from approved manager.
- [ ] Dedicated ServiceAccounts.
- [ ] RBAC least privilege.
- [ ] ServiceAccount token disabled where unused.
- [ ] SecurityContext hardened.
- [ ] NetworkPolicies planned/enforced.
- [ ] Jobs/CronJobs idempotent.
- [ ] ResourceQuotas/LimitRanges configured.
- [ ] Observability integrated.
- [ ] Cluster/add-on upgrade process tested.
- [ ] Node drain/failure test passed.
- [ ] Registry/image pull failure runbook exists.
- [ ] Debug/break-glass access controlled.
- [ ] GitOps is deployment source of truth.

---

# 7473 — Initial Implementation Order

Recommended:

```text
1. Cluster/namespace standards
2. Base Deployment template
3. Service template
4. ConfigMap/Secret integration
5. Startup/readiness/liveness probes
6. Resource requests/limits
7. Graceful shutdown
8. ServiceAccounts/RBAC
9. SecurityContext
10. Topology spread
11. PDB
12. HPA
13. ResourceQuota/LimitRange
14. Jobs/CronJobs
15. NetworkPolicy baseline
16. Observability integration
17. GitOps deployment
18. Staging rollout/node-failure tests
19. Capacity tuning
20. Production admission policies
```

---

# 7474 — Minimum Viable Kubernetes Standard

Every production service must have:

```text
Deployment
ClusterIP Service
immutable image digest/tag
dedicated ServiceAccount
non-root security context
resource requests
memory limit
startup/readiness/liveness probes
external configuration
external secret reference
graceful SIGTERM
central logs/metrics
```

Critical services additionally require:

```text
multiple replicas
topology spread
PDB
capacity/HPA plan
rollout/rollback tests
```

---

# 7475 — Kubernetes Governance

Architecture/platform review should reject:

```text
latest image tags
root containers
no requests/limits
liveness tied to optional external dependency
manual Pod creation
hostPath for business data
broad cluster-admin ServiceAccount
secrets committed in manifest
single-replica Tier-1 without exception
unbounded CronJob overlap
```

---

# 7476 — Standard Workload Contract

Every application service follows:

```text
Controller:
Deployment

Networking:
ClusterIP Service

Identity:
Dedicated ServiceAccount

Runtime:
Non-root
Read-only root FS capable

Config:
ConfigMap + Secret references

Health:
startup/readiness/liveness

Resources:
requests + limits policy

Deployment:
rolling update

Shutdown:
SIGTERM graceful

Observability:
logs + metrics + traces
```

---

# 7477 — Standard Production Tier-1 Profile

Conceptual baseline:

```text
replicas >= 2
maxUnavailable low/0
topology spread across zones/nodes
PDB
HPA or tested fixed capacity
priority class if justified
strict NetworkPolicy
```

---

# 7478 — Standard Worker Profile

For Kafka worker:

```text
Deployment
consumer-group identity
graceful shutdown
lag metrics
HPA/KEDA based on lag if needed
replicas <= useful partition parallelism
```

---

# 7479 — Standard Scheduled Job Profile

```text
CronJob
Forbid overlap where appropriate
idempotent task
bounded runtime
bounded retry
central logging
failure alert
```

---

# 7480 — Standard Migration Job Profile

```text
versioned image
dedicated Job
DB migration permission only
one execution per release
failure blocks rollout
audit/result logs
```

---

# 7481 — Standard Repair Job Profile

```text
reviewed artifact
explicit input
least privilege
manual trigger
audit
idempotent where possible
```

---

# 7482 — Kubernetes Resource Catalog Template

```text
Service:
Namespace:
Deployment:
Service:
ServiceAccount:
Replicas:
CPU Request:
CPU Limit:
Memory Request:
Memory Limit:
HPA:
PDB:
Topology:
Secrets:
ConfigMaps:
NetworkPolicy:
Owner:
Tier:
```

---

# 7483 — Autoscaling Catalog Template

```text
Service:
Metric:
Current Baseline:
Min Replicas:
Max Replicas:
Scale Up:
Scale Down:
DB Connection Budget:
Kafka Partition Limit:
Provider Quota:
Owner:
```

---

# 7484 — Probe Catalog Template

```text
Service:
Startup Path:
Startup Budget:
Readiness Path:
Readiness Dependencies:
Liveness Path:
Liveness Failure Meaning:
Termination Grace:
```

---

# 7485 — Job Catalog Template

```text
Job:
Type:
Schedule:
Owner:
ServiceAccount:
Idempotency Key:
Timeout:
Retry:
Concurrency Policy:
Input:
Output:
Alert:
```

---

# 7486 — RBAC Catalog Template

```text
Identity:
Namespace:
Role:
Resources:
Verbs:
Reason:
Owner:
Review Date:
```

---

# 7487 — Example Order-Service Kubernetes Profile

```text
Deployment:
order-service

Replicas:
3 baseline

Service:
ClusterIP

Dependencies:
Catalog
Inventory
Payment
Wallet
Promotion
PostgreSQL
Kafka

Probes:
Actuator startup/readiness/liveness

Scaling:
CPU/request-rate based

Availability:
zone/node spread
PDB

Security:
non-root
read-only FS
dedicated ServiceAccount
```

---

# 7488 — Example Payment-Service Kubernetes Profile

```text
Replicas:
>=2

Scaling:
bounded by provider quota + DB

Availability:
strict

Security:
restricted egress
restricted secrets
dedicated ServiceAccount

Shutdown:
finish/stop accepting payment operations safely
```

---

# 7489 — Example Mission Worker Profile

```text
Source:
Kafka

Partition Key:
customer_id

Scaling:
Kafka lag
max replicas <= partitions

Shutdown:
stop polling
finish local transaction
commit safely
```

---

# 7490 — Example Notification Worker Profile

```text
Kafka consumer
provider clients
retry/DLQ

Scaling:
lag + provider quota

Graceful shutdown:
finish/abandon safely via idempotency
```

---

# 7491 — Example Reconciliation CronJob

```text
Schedule:
hourly

Concurrency:
Forbid

Output:
reconciliation run record

Failure:
alert + retry

Security:
read required participant APIs only
```

---

# 7492 — Example PDB Decision

Order:

```text
replicas=3
maxUnavailable=1
```

Node drain can evict one while keeping two.

---

# 7493 — Example HPA Connection Budget

If:

```text
maxReplicas=20
DB pool=10
```

maximum potential connections:

```text
200
```

DB capacity must support this plus other clients.

---

# 7494 — Example Zone Spread

Three replicas:

```text
zone-a
zone-b
zone-c
```

where available.

---

# 7495 — Example Non-Prod Profile

DEV:

```text
replicas=1
HPA off
PDB optional
small resources
same image
same probes
same config shape
```

---

# 7496 — Example Staging Profile

```text
same security policies
same ingress path
same probes
same HPA logic
same ServiceAccounts/RBAC shape
smaller replica/resources if needed
```

---

# 7497 — Example Production Profile

```text
multiple replicas
zone spread
PDB
HPA/capacity
strict NetworkPolicy
external secret manager
full observability
```

---

# 7498 — Kubernetes and PART 30

PART 30 defines:

```text
Ingress
Gateway
DNS
TLS
internal/external routing
NetworkPolicy
service-to-service security
```

---

# 7499 — Kubernetes and PART 31

PART 31 defines:

```text
metrics
logs
traces
dashboards
alerts
```

for workloads and cluster.

---

# 7500 — Kubernetes and PART 32

PART 32 automates:

```text
build
scan
manifest update
promotion
deployment gates
```

---

# 7501 — Kubernetes and PART 33

PART 33 makes Kubernetes desired state:

```text
GitOps-controlled
```

through Argo CD.

---

# 7502 — Kubernetes and PART 34

PART 34 provisions:

```text
clusters
node pools
managed data services
network
```

through Terraform.

---

# 7503 — Kubernetes and PART 35

PART 35 strengthens:

```text
admission controls
runtime policy
RBAC
network security
image trust
```

---

# 7504 — Kubernetes and PART 36

PART 36 defines:

```text
cluster/data backup
restore
DR
```

---

# 7505 — Kubernetes and PART 37

PART 37 validates:

```text
HPA
resource capacity
scalability
failure behavior
```

under load.

---

# 7506 — PART 29 Deliverables

PART 29 produces:

1. Cluster strategy.
2. Production/non-production isolation.
3. Namespace standards.
4. Shared add-on ownership.
5. Deployment standard.
6. Pod lifecycle principles.
7. Replica and topology strategy.
8. Standard labels/annotations.
9. ClusterIP Service standard.
10. Service discovery.
11. ConfigMap/Secret model.
12. External secret integration.
13. Startup/readiness/liveness probes.
14. Probe dependency rules.
15. CPU/memory requests and limits.
16. JVM memory/container guidance.
17. HPA.
18. Kafka/KEDA autoscaling.
19. Cluster Autoscaler interaction.
20. Node pools.
21. Taints/tolerations.
22. Affinity/anti-affinity.
23. Topology spread.
24. PodDisruptionBudgets.
25. Rolling updates.
26. Graceful shutdown.
27. Jobs.
28. CronJobs.
29. Migration Jobs.
30. ServiceAccounts.
31. Workload identity.
32. Kubernetes RBAC.
33. ResourceQuotas.
34. LimitRanges.
35. PriorityClasses.
36. Persistent volume guidance.
37. SecurityContext baseline.
38. Init containers/sidecars.
39. DNS considerations.
40. NetworkPolicy baseline.
41. Manifest tooling strategy.
42. Image pull/runtime standards.
43. Deployment failure/runbooks.
44. Canary/blue-green guidance.
45. Debugging and ephemeral containers.
46. Kubernetes metrics/alerts.
47. Testing strategy.
48. Cluster upgrade testing.
49. Capacity planning.
50. JVM startup/scale behavior.
51. Worker deployment patterns.
52. Config/secret rotation behavior.
53. Cluster recovery principles.
54. Environment-specific profiles.
55. Definition-of-Done checklists.
56. Production-readiness checklist.
57. Governance rules.
58. Standard workload profiles.
59. Resource/autoscaling/probe/RBAC catalogs.
60. Service-specific examples.
61. Cross-chapter handoffs.

---

# 7507 — Exit Criteria

PART 29 is complete when the team can answer:

### Workload

```text
Which Kubernetes controller runs each workload and why?
```

### Availability

```text
How many replicas exist, how are they spread, and what happens during node/zone disruption?
```

### Health

```text
What exactly do startup, readiness, and liveness failures mean?
```

### Resources

```text
How were CPU/memory requests and limits chosen, and does JVM memory fit safely?
```

### Scaling

```text
What metric drives scaling, and can downstream databases/providers support max replicas?
```

### Deployment

```text
Can old/new versions coexist during rolling update and can the service roll back safely?
```

### Shutdown

```text
What happens to in-flight HTTP requests, Kafka events, and workers when Kubernetes sends SIGTERM?
```

### Identity

```text
Which ServiceAccount and RBAC permissions does the workload have?
```

### Security

```text
Does the workload run non-root, read-only, without privileged access or unnecessary capabilities?
```

### Operations

```text
Can operators diagnose Pending Pods, CrashLoops, OOMs, readiness failures, image-pull errors, and autoscaling problems?
```

### Recovery

```text
Can the cluster/workloads be recreated from Terraform + GitOps without relying on Pod-local state?
```

If these answers are clear and tested, Kubernetes runtime architecture is ready for networking and gateway design.

---

# 7508 — Handoff to PART 30

PART 30 defines Networking / Gateway / TLS.

```text
PART 29
Kubernetes
      ↓
Pods / Services / Namespaces / Policies
      ↓
PART 30
Networking / Gateway / TLS
```

PART 30 will define:

```text
North-South Traffic
East-West Traffic
API Gateway
Ingress / Gateway API
DNS
TLS
Certificate Management
mTLS
Service Discovery
Network Policies
Egress Controls
WAF
Rate Limiting
Private Endpoints
Load Balancers
CORS
Security Headers
Timeouts
Connection Management
```

The key transition is:

```text
PART 29
= how workloads run

PART 30
= how traffic safely reaches and moves between those workloads
```

---

# PART 29 — Summary

Kubernetes is the runtime platform for containerized microservices.

A standard service becomes:

```text
Immutable Image
      ↓
Deployment
      ↓
Pods
      ↓
ClusterIP Service
      ↓
Gateway / Internal Callers
```

with:

```text
ConfigMap
External Secrets
ServiceAccount
RBAC
Health Probes
Resource Requests/Limits
PDB
Topology Spread
HPA
NetworkPolicy
Observability
```

The most important architecture rules are:

```text
Pods are disposable.
Durable business state stays outside Pods.
Production runs non-root, read-only capable images.
Every service has explicit resource requests.
Critical services have multiple replicas and spread.
Startup, readiness, and liveness probes have distinct meanings.
Optional dependency failures do not trigger liveness restart storms.
Rolling updates require API/event/DB compatibility.
SIGTERM is handled gracefully.
HPA scaling is bounded by DB, Kafka, Redis, and provider capacity.
Kafka workers scale only to useful partition parallelism.
PDB protects voluntary disruption, not all failures.
Jobs and CronJobs are idempotent.
ServiceAccounts and RBAC follow least privilege.
Network access is explicitly controlled.
GitOps is the production deployment source of truth.
```

The next chapter defines the traffic and trust boundaries around these workloads:

```text
PART 30 — Networking / Gateway / TLS
```

---

**End of PART 29 — Kubernetes**
