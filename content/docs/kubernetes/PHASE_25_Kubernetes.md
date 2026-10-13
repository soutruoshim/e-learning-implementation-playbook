---
title: "PHASE 25 — Kubernetes"
---

# PHASE 25 — Kubernetes

> **Purpose:** Translate the environment strategy into a complete Kubernetes runtime standard for containerized microservices: cluster and namespace organization, Deployments, Pods, Services, configuration/secrets, probes, resources, autoscaling, scheduling, availability, Jobs/CronJobs, ServiceAccounts/RBAC, storage, security contexts, graceful shutdown, observability, testing, operations, and production readiness.
>
> **Previous Phase:** Phase 24 — Environment Strategy
>
> **Next Phase:** Phase 26 — Networking / Gateway / TLS
>
> **Primary Architecture Basis:** PART 29 — Kubernetes.
>
> **Primary Stack:** Kubernetes, Java, Spring Boot, Docker, PostgreSQL, Kafka, Redis, GitLab CI/CD, Argo CD, Terraform, Prometheus, Grafana, OpenTelemetry.
>
> **Status:** Platform Architecture / Kubernetes Runtime Implementation Specification

---

# 1. Phase 25 Goal

Turn the environment strategy into a repeatable Kubernetes runtime standard for all containerized microservices.

The runtime must be:

```text
declarative
repeatable
secure
observable
resource-aware
highly available where required
GitOps-friendly
failure-tolerant
```

---

# 2. Core Kubernetes Principle

```text
Kubernetes manages application instances.

Business correctness must remain inside
the service architecture and durable stores.
```

Kubernetes provides scheduling, lifecycle, discovery, rolling deployment, health-driven routing, horizontal scaling, configuration injection, secret references, resource isolation, and self-healing.

It does **not** replace:

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

# 3. Source-Defined Open Decisions

PART 29 deliberately leaves several organization/platform choices open. They must be approved rather than invented during implementation:

```text
TBD_K8S_CLUSTER_TOPOLOGY
TBD_K8S_HELM_OR_KUSTOMIZE_PRIMARY_STANDARD
TBD_K8S_MANAGED_VS_SELF_HOSTED_DATA_SERVICES
TBD_K8S_KEDA_ADOPTION
TBD_K8S_SERVICE_MESH_ADOPTION
TBD_K8S_GATEWAY_API_VS_CLASSIC_INGRESS
TBD_K8S_ARGO_ROLLOUTS_ADOPTION
TBD_K8S_POLICY_ENGINE
TBD_K8S_PRIORITY_CLASSES
TBD_K8S_RESOURCE_BASELINES_PER_SERVICE
TBD_K8S_CPU_LIMIT_POLICY
TBD_K8S_HPA_METRICS_AND_THRESHOLDS
TBD_K8S_PDB_VALUES
TBD_K8S_ZONE_SPREAD_REQUIREMENTS
TBD_K8S_STORAGE_CLASSES
TBD_K8S_RUNTIME_CLASS
```

Do not silently convert examples in the source into universal production values.

---

# 4. Cluster Strategy

Possible source-aligned models:

```text
Option A:
non-production cluster
production cluster
```

or stronger isolation:

```text
Option B:
DEV cluster
UAT/STAGING cluster
PRODUCTION cluster
```

The choice depends on scale, risk, and cost.

---

# 5. Production Cluster Isolation

Production should have strong isolation from non-production.

Preferred:

```text
separate Kubernetes cluster
```

or an equivalent cloud account/project boundary.

---

# 6. Shared Non-Production Cluster

DEV/QA/UAT may share a cluster only when the platform correctly isolates:

```text
namespaces
RBAC
quotas
NetworkPolicies
secrets
```

---

# 7. Namespace Strategy

Example environment namespaces:

```text
platform-dev
platform-qa
platform-uat
platform-staging
platform-prod
```

Use only when environments share a cluster.

---

# 8. Namespace Ownership

A namespace can own the environment-scoped Kubernetes resources for its services:

```text
Deployments
Services
ConfigMaps
Secret references
Jobs
CronJobs
ServiceAccounts
NetworkPolicies
ResourceQuotas
```

---

# 9. Namespace Is Not a Full Security Boundary

Namespace separation alone does not fully isolate:

```text
network traffic
cluster-level resources
storage
IAM
```

Additional controls are mandatory.

---

# 10. Cluster Add-Ons

Typical platform-owned add-ons include:

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

Application teams consume these through documented platform interfaces.

---

# 11. Application Deployment Unit

A normal deployable microservice typically includes, as applicable:

```text
Deployment
ClusterIP Service
ServiceAccount
ConfigMap references
Secret references
HPA
PDB
NetworkPolicy
```

---

# 12. Deployment Controller

Use Kubernetes `Deployment` for normal stateless Spring Boot services such as:

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

# 13. Deployment Responsibilities

Deployment manages:

```text
desired replica count
Pod template
rolling updates
ReplicaSets
rollback history
```

---

# 14. Deployment Is Not the Migration Engine

Do not hide long production database migrations inside every Pod startup.

Database migration timing and execution must be explicit and compatible with the release strategy.

---

# 15. Pod Lifecycle

A Pod is an:

```text
ephemeral execution unit
```

It may be restarted, replaced, or rescheduled at any time.

---

# 16. Pod Identity

Pod name and Pod IP are operational identities.

They are not business identifiers.

---

# 17. Stateless Application Rule

A business microservice should not rely on Pod-local memory or disk for durable business state.

---

# 18. Pod Restart Safety

A restart is safe because correctness is preserved by external durable architecture:

```text
state stored durably
idempotent requests
Kafka deduplication
Saga recovery
transactional state
```

---

# 19. Replica Count

Critical production services should usually run:

```text
>= 2 replicas
```

where the service design supports horizontal execution.

---

# 20. Single-Replica Exceptions

Possible only for explicitly accepted cases such as:

```text
non-critical service
special singleton worker
low environment
```

The risk must be documented.

---

# 21. Replica Placement

Critical replicas should not all run on one node.

Use:

```text
topology spread constraints
pod anti-affinity
```

as appropriate.

---

# 22. Topology Spread

Preferred modern placement mechanism for balancing replicas across:

```text
zones
nodes
```

---

# 23. Zone Distribution

When multiple availability zones exist, critical production replicas should be distributed across zones.

---

# 24. Node Distribution

Avoid all replicas of a critical service being scheduled on the same node.

---

# 25. Topology Keys

Typical topology keys:

```text
topology.kubernetes.io/zone
kubernetes.io/hostname
```

---

# 26. Scheduling Goal

Balance:

```text
availability
cost
resource utilization
```

without over-constraining scheduling.

---

# 27. Standard Kubernetes Labels

Use one consistent label model:

```text
app.kubernetes.io/name
app.kubernetes.io/instance
app.kubernetes.io/version
app.kubernetes.io/component
app.kubernetes.io/part-of
app.kubernetes.io/managed-by
```

---

# 28. Label Consistency

Labels drive:

```text
selectors
monitoring
cost attribution
policy
troubleshooting
```

Do not invent different schemes service by service.

---

# 29. Immutable Selectors

Deployment selector labels should remain stable across releases.

Changing selectors casually can require resource recreation or break controller ownership.

---

# 30. Pod Annotations

Use annotations for platform needs such as:

```text
Prometheus scraping
configuration checksum
sidecar injection
owner/runbook metadata
```

---

# 31. ClusterIP Service

A Kubernetes Service provides stable internal:

```text
DNS
virtual IP
load balancing
```

The default service type for service-to-service traffic is:

```text
ClusterIP
```

---

# 32. Service Discovery

Example fully-qualified DNS:

```text
order-service.platform-prod.svc.cluster.local
```

Within the same namespace applications normally call:

```text
order-service
```

---

# 33. No Pod IP Dependencies

Never configure application dependencies using individual Pod IP addresses.

Use Kubernetes Service DNS.

---

# 34. Headless Service

Use only when direct Pod discovery or a stateful workload requires it.

Normal Spring Boot services use a regular Service.

---

# 35. NodePort

Do not use NodePort as the normal production API exposure method.

External exposure belongs to the Gateway/Ingress/LoadBalancer design in the next phase.

---

# 36. LoadBalancer Service

Reserve direct LoadBalancer Services for cases that explicitly require their own external/internal load balancer.

Most public API traffic should traverse the gateway layer.

---

# 37. Service Port Naming

Use descriptive named ports:

```text
http
grpc
metrics
```

---

# 38. ConfigMap

Use ConfigMap for non-secret runtime configuration such as:

```text
URLs
timeouts
feature defaults
topic names
logging levels
```

---

# 39. Kubernetes Secret Boundary

Kubernetes Secret can hold secret material/reference data, but base64 encoding is not an enterprise secret-management strategy.

Use an approved external secret manager.

---

# 40. External Secret Manager

Supported architectural pattern includes systems such as:

```text
Vault
AWS Secrets Manager
GCP Secret Manager
Azure Key Vault
approved equivalent
```

---

# 41. Secret Injection Options

Possible mechanisms:

```text
environment variable
mounted volume
CSI Secret Store
External Secrets Operator
```

---

# 42. Secret File Preference

Private keys and certificates are often better mounted as files than placed in very large environment variables.

---

# 43. ConfigMap Update Behavior

Values injected through environment variables require a Pod restart to be reread.

Mounted files may update, but application reload behavior must be explicit and tested.

---

# 44. Configuration Checksum Rollout

Helm/Kustomize can add a config checksum annotation to the Pod template so configuration changes intentionally trigger a rollout.

---

# 45. Configuration Versioning

Configuration is version-controlled through GitOps.

Manual mutable runtime edits are not the standard workflow.

---

# 46. Secret Rotation

Conceptual rotation flow:

```text
update external secret
      ↓
sync/mount
      ↓
restart or live reload
      ↓
verify new credential
      ↓
revoke old credential
```

---

# 47. Environment Variable Size Discipline

Avoid huge:

```text
JSON
certificates
private keys
binary content
```

in environment variables when a file/reference is clearer.

---

# 48. Downward API

May expose operational metadata such as:

```text
pod name
namespace
labels
```

to the application where useful.

---

# 49. Runtime Telemetry Metadata

OpenTelemetry resource attributes may include Kubernetes metadata:

```text
namespace
pod
deployment
cluster
```

---

# 50. Three Probe Model

Every normal production service uses three conceptually distinct health checks:

```text
startupProbe
readinessProbe
livenessProbe
```

They must not be treated as aliases.

---

# 51. Startup Probe

Answers:

```text
Has the application finished starting?
```

It protects slow-starting Java services from premature liveness restarts.

---

# 52. Readiness Probe

Answers:

```text
Should this Pod receive traffic?
```

If false, the Pod can remain running while Kubernetes removes it from Service endpoints.

---

# 53. Liveness Probe

Answers:

```text
Is the process irrecoverably unhealthy or stuck?
```

Repeated failure leads to container restart.

---

# 54. Probe Separation

Do not route all three probes to one expensive endpoint without deliberate semantics.

---

# 55. Spring Boot Actuator Probe Model

Recommended source-aligned health groups:

```text
/actuator/health/liveness
/actuator/health/readiness
```

---

# 56. Liveness Dependency Rule

Liveness should normally **not** fail merely because:

```text
Redis is down
Kafka is down
payment provider is down
```

unless the application process itself cannot recover.

---

# 57. Readiness Dependency Rule

Readiness may include a dependency that is essential to safely serve the service's core operation.

Use carefully to avoid cascading zero-endpoint failures across the platform.

---

# 58. Database Readiness

If a service cannot safely serve any meaningful request without its database, DB availability may affect readiness.

---

# 59. Kafka Readiness

A REST service using an Outbox may remain ready for API operations during temporary Kafka outage.

Do not automatically make Kafka a readiness dependency.

---

# 60. Redis Readiness

For disposable cache use:

```text
Redis outage
→ service remains ready
→ cache fallback/bypass
```

when fallback exists.

---

# 61. External Provider Readiness

An external provider outage should usually be handled through circuit breaker, retry, or application errors.

It should not normally remove every service Pod from traffic.

---

# 62. Probe Cost

Probe endpoints must be:

```text
cheap
fast
bounded
```

because they run frequently across many Pods.

---

# 63. Probe Authentication

Probe endpoints may be unauthenticated inside the Pod/network design but must not be exposed publicly.

---

# 64. Probe Failure Testing

STAGING must deliberately test:

```text
slow startup
database outage
application stuck/deadlock behavior
dependency outages
```

and confirm the intended probe response.

---

# 65. Resource Requests

CPU/memory requests define scheduler reservation and are mandatory for predictable placement/capacity.

---

# 66. Resource Limits

Limits constrain CPU/memory behavior according to platform policy.

At minimum, memory-limit strategy must be deliberate; CPU limits require testing for throttling impact.

---

# 67. CPU Request

Represents expected baseline CPU and is used by the scheduler.

---

# 68. CPU Limit Risk

An overly small CPU limit can create:

```text
CPU throttling
higher latency
slower GC
```

---

# 69. Memory Request

Represents memory reserved for scheduling.

---

# 70. Memory Limit

Crossing the container memory limit can cause:

```text
OOMKilled
```

---

# 71. No-Requests Anti-Pattern

Pods without requests can:

```text
overpack nodes
cause noisy-neighbor incidents
break autoscaling assumptions
```

---

# 72. Resource Baseline

Use measured:

```text
idle
normal
peak
startup
```

behavior from the container/runtime phase to choose resources.

---

# 73. JVM Memory Headroom

Pod memory is more than Java heap.

Plan for:

```text
heap
metaspace
direct memory
thread stacks
native libraries
JIT/code cache
other native allocations
```

Never set Java heap equal to the Pod memory limit without headroom.

---

# 74. Resource Tuning Metrics

Review:

```text
CPU
memory RSS
heap
GC
latency
CPU throttling
startup time
```

---

# 75. Resource Regression

A new release that materially increases CPU, memory, or startup time requires review.

---

# 76. Kubernetes QoS

Requests/limits influence:

```text
Guaranteed
Burstable
BestEffort
```

Critical services should not run as BestEffort.

---

# 77. Horizontal Pod Autoscaler

HPA adjusts replicas based on observed metrics.

---

# 78. HPA Metric Options

Source-supported options include:

```text
CPU
memory
custom application metrics
Kafka lag
request rate
```

---

# 79. CPU HPA

CPU-utilization scaling depends on correct CPU requests.

Bad requests produce misleading utilization percentages.

---

# 80. Memory HPA Caution

JVM memory may remain allocated and not fall quickly.

Use memory-based HPA carefully.

---

# 81. Custom Metric HPA

For some services:

```text
HTTP requests/sec
queue depth
Kafka consumer lag
```

may better represent load than CPU alone.

---

# 82. Kafka Consumer Scaling

Useful consumer replicas are bounded by:

```text
Kafka partition count
```

HPA cannot create more parallelism than available partitions.

---

# 83. Kafka Lag Autoscaling

Possible metrics:

```text
record lag
oldest lag age
```

using KEDA or an approved custom-metric path if the platform adopts it.

---

# 84. KEDA

Optional source-defined capability for event-driven autoscaling.

Adoption is a platform decision, not an automatic requirement.

---

# 85. HPA Minimum Replicas

For critical services requiring HA:

```text
minReplicas >= 2
```

is a common source-aligned baseline, subject to the service's actual design.

---

# 86. HPA Maximum Replicas

Must respect downstream constraints:

```text
database connection capacity
provider quotas
Kafka partitions
Redis throughput/connections
other downstream capacity
```

---

# 87. Scaling Can Overload Dependencies

Scaling an upstream service from 5 to 50 Pods can collapse its database or external provider if downstream capacity is not planned end to end.

---

# 88. Scale-Up and Scale-Down

Scale-up may be aggressive enough for spikes.

Scale-down should be conservative enough to avoid:

```text
thrashing
cold-start churn
Kafka consumer rebalances
```

---

# 89. HPA Stabilization

Use scale-down stabilization for workloads that would otherwise oscillate.

---

# 90. Autoscaling Test

PERFORMANCE environment validates:

```text
trigger
scale-up time
latency during scale
scale-down
dependency impact
```

---

# 91. VPA

Vertical Pod Autoscaler may be useful in recommendation mode to tune requests.

Use automatic adjustment carefully with Java and disruption.

---

# 92. Cluster Autoscaler

Platform-managed Cluster Autoscaler adds/removes nodes when Pods cannot schedule or capacity is idle.

---

# 93. HPA and Cluster Autoscaler Chain

Conceptual flow:

```text
metric rises
  ↓
HPA requests more Pods
  ↓
Pods may become Pending
  ↓
Cluster Autoscaler adds nodes
```

This can take minutes, so minimum capacity still matters.

---

# 94. Node Pools

Possible pools:

```text
general application
memory-heavy
system workloads
special workloads
```

Most stateless services belong on a general-purpose pool.

---

# 95. Dedicated Node Pool

Use only when justified by:

```text
special CPU/memory
compliance
noisy workload
special integration requirement
```

---

# 96. Taints and Tolerations

Taint prevents unrelated Pods from scheduling.

Toleration allows a workload onto the tainted node.

Toleration does not force placement; use node affinity when required.

---

# 97. Node Affinity

Use required/preferred node affinity when a workload genuinely requires a specific node pool or class.

---

# 98. Pod Affinity

Use sparingly; it can over-constrain the scheduler.

---

# 99. Pod Anti-Affinity

Useful for separating replicas, though topology spread is often more flexible.

---

# 100. Over-Constrained Scheduling

Too many hard constraints can create:

```text
Pending Pods
```

during failures.

Use hard requirements only for true constraints and preferred rules for optimization.

---

# 101. PodDisruptionBudget

PDB protects availability during voluntary disruptions such as:

```text
node drain
cluster upgrade
```

---

# 102. PDB Is Not High Availability

PDB does not prevent:

```text
node crash
Pod OOM
application bug
spot interruption
```

It only constrains voluntary eviction.

---

# 103. PDB and Replica Count

PDB must match replica count.

A single-replica workload with `minAvailable: 1` can block maintenance.

---

# 104. Rolling Update

Normal service deployments use:

```text
RollingUpdate
```

unless risk justifies another strategy.

---

# 105. maxUnavailable and maxSurge

For critical APIs, `maxUnavailable` should be low and `maxSurge` should provide enough temporary capacity.

Exact values are service-specific and must fit cluster headroom.

---

# 106. Rolling Compatibility

Old and new Pods coexist.

Therefore require:

```text
API backward compatibility
event compatibility
DB expand/contract
cache compatibility
```

---

# 107. Readiness During Rollout

A new Pod must not receive traffic before readiness succeeds.

---

# 108. Failed Rollout Behavior

If new Pods do not become ready, old replicas remain according to the rollout strategy.

Set a progress deadline and alert on stalled deployment.

---

# 109. Revision History

Keep limited ReplicaSet history for operational rollback visibility.

---

# 110. Kubernetes Rollback

Kubernetes can return to a previous ReplicaSet, but GitOps desired state must also be updated.

---

# 111. GitOps Rollback

Preferred rollback:

```text
revert image/config commit
```

or promote the prior known-good digest.

---

# 112. Database Rollback Warning

Rolling a Deployment back cannot undo an incompatible schema migration.

Expand/contract migration discipline remains mandatory.

---

# 113. SIGTERM

Kubernetes sends:

```text
SIGTERM
```

before force-killing the container.

The application must handle it gracefully.

---

# 114. Termination Grace Period

Set `terminationGracePeriodSeconds` long enough for:

```text
in-flight HTTP requests
Kafka consumer shutdown
worker completion
telemetry flush
client close
```

but bounded enough for rollout progress.

---

# 115. Graceful Shutdown Sequence

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
flush telemetry
      ↓
exit
```

---

# 116. Load Balancer Drain Race

Traffic can briefly arrive after termination starts due to propagation delay.

Idempotency and bounded retries remain required.

---

# 117. Graceful HTTP Shutdown

Spring Boot should stop accepting new requests and finish in-flight requests within the configured timeout.

---

# 118. Kafka Consumer Shutdown

Consumer shutdown must:

```text
stop polling
finish/abort current processing according to semantics
not commit unfinished work
close gracefully
```

---

# 119. Background Worker Shutdown

Workers should:

```text
stop claiming new work
finish current transaction
release lease or let lease expire
```

---

# 120. Forced Kill Recovery

After the grace period Kubernetes may send `SIGKILL`.

Durable workflow recovery and idempotency must make this safe.

---

# 121. PreStop Hook

A preStop hook may be used when there is a known need to mark unready or wait briefly before termination.

Do not add arbitrary sleep hooks without understanding the shutdown path.

---

# 122. Job

Use Kubernetes `Job` for finite one-off tasks such as:

```text
data migration
one-time backfill
reconciliation batch
```

---

# 123. Job Retry

`backoffLimit` controls Kubernetes retries, but the business operation itself must be idempotent.

---

# 124. Job Idempotency

A restarted Job may execute work again.

Use:

```text
checkpoint
idempotent batch
processed marker
deterministic run key
```

---

# 125. Job Timeout

Use bounded execution such as `activeDeadlineSeconds` where appropriate.

---

# 126. Job Cleanup

Use `ttlSecondsAfterFinished` where supported to avoid unlimited completed Job objects.

---

# 127. Migration Job

A dedicated migration Job can make database migration:

```text
explicit
observable
separate from app startup
```

The rollout must stop if a required migration fails.

---

# 128. CronJob

Use for clear periodic batches such as:

```text
reconciliation
cleanup
report generation
expiry sweep
```

---

# 129. CronJob Concurrency Policy

Choose deliberately:

```text
Allow
Forbid
Replace
```

For reconciliation, `Forbid` is often appropriate to prevent overlapping runs.

---

# 130. CronJob Missed Runs

Use `startingDeadlineSeconds` when missed-schedule behavior must be bounded.

---

# 131. CronJob History

Keep bounded:

```text
successfulJobsHistoryLimit
failedJobsHistoryLimit
```

---

# 132. CronJob Idempotency

Scheduled execution can happen more than once due to retries or controller transitions.

The business operation must tolerate duplicates.

---

# 133. Application Scheduler vs CronJob

Use an application scheduler for domain-specific continuous/service-local work.

Use CronJob for a clear periodic batch.

The source does not prescribe one universal rule.

---

# 134. Singleton Scheduler

If scheduling logic runs inside a multi-replica application, use:

```text
DB lock
leader election
```

or equivalent ownership mechanism.

---

# 135. Dedicated ServiceAccount

Every workload should have its own Kubernetes ServiceAccount.

---

# 136. Default ServiceAccount Anti-Pattern

Do not run all workloads under the namespace `default` ServiceAccount.

---

# 137. Workload Identity

Map ServiceAccounts to cloud workload identity where supported.

Prefer this over long-lived static cloud access keys.

---

# 138. ServiceAccount Token Automount

When a workload does not need the Kubernetes API:

```yaml
automountServiceAccountToken: false
```

---

# 139. Kubernetes API Access

Most business services should not need to call the Kubernetes API.

---

# 140. Kubernetes RBAC

Kubernetes RBAC governs infrastructure resource access.

It is distinct from application/business RBAC.

---

# 141. RBAC Least Privilege

A normal service should not be able to:

```text
list all Secrets
delete Pods
create Roles
```

unless that capability is explicitly required.

---

# 142. Developer RBAC

Non-production may be more permissive but still scoped.

Production should be read-focused for most developers.

---

# 143. CI/CD RBAC

Deployment automation may update approved namespaces/resources.

Do not grant cluster-admin by default.

---

# 144. Argo CD RBAC

Argo receives the permissions required to reconcile workloads.

Human access to Argo remains separately controlled.

---

# 145. Secret RBAC

Kubernetes Secret read permissions are highly sensitive.

Restrict strongly.

---

# 146. ResourceQuota

Namespace quotas can limit:

```text
CPU requests/limits
memory
Pod count
Services
PVCs
```

---

# 147. Quota Goal

Prevent one environment or team from exhausting a shared cluster.

---

# 148. LimitRange

Provides namespace-level defaults/min/max resource constraints.

Use as a safety fallback; service manifests should still specify deliberate resources.

---

# 149. PriorityClass

May prioritize critical workloads during resource pressure.

Use only where justified; if everything is highest priority, priority is meaningless.

---

# 150. Preemption

Higher-priority Pods may evict lower-priority workloads.

Use carefully.

---

# 151. Persistent Volume Strategy

Most application microservices should use:

```text
no PVC
```

because durable business state belongs in databases/object stores/Kafka/Redis or other managed systems.

---

# 152. PVC Use Cases

Examples:

```text
self-managed stateful infrastructure
special batch workspace
```

---

# 153. Managed Data-Service Preference

PART 29 notes that PostgreSQL/Kafka/Redis are often better run as managed services outside the application cluster when the organization chooses that platform model.

---

# 154. StatefulSet

Use for workloads needing:

```text
stable network identity
persistent volumes
ordered lifecycle
```

not for normal stateless Spring Boot services.

---

# 155. Self-Managed Data Services

If Kafka/Postgres/Redis run in Kubernetes, operators, StatefulSets, storage, backup, anti-affinity, upgrades, and recovery need their own dedicated design.

This phase focuses first on application workloads.

---

# 156. emptyDir

Use for ephemeral:

```text
/tmp
scratch space
```

and apply size limits where possible.

---

# 157. Memory emptyDir

RAM-backed `emptyDir` consumes container/node memory and must be bounded.

---

# 158. Read-Only Root Filesystem

Production application containers should aim for:

```yaml
readOnlyRootFilesystem: true
```

Provide a bounded writable `emptyDir` for `/tmp` when required.

---

# 159. SecurityContext Baseline

Typical production baseline:

```text
runAsNonRoot: true
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
drop ALL capabilities
seccomp RuntimeDefault
```

---

# 160. Privileged Workload

Privileged containers are forbidden for normal business services.

---

# 161. Host Namespace Anti-Patterns

Avoid for normal application workloads:

```text
hostNetwork
hostPID
hostIPC
hostPath
```

---

# 162. Pod Security Admission

Production namespaces should aim for the Kubernetes `restricted` profile or the organization-approved equivalent.

---

# 163. Init Containers

Use for narrow pre-start technical preparation such as:

```text
file preparation
certificate setup
dependency initialization
```

Do not implement complex business workflows in init containers.

---

# 164. Migration Init Container

Possible, but the source notes that a dedicated migration Job is often clearer and more observable.

---

# 165. Sidecars

Use only when the platform architecture requires them, for example:

```text
service mesh proxy
special agent
```

Sidecars consume CPU, memory, and startup time and must be capacity-planned.

---

# 166. OpenTelemetry Sidecar

Possible, but a centralized/DaemonSet collector may be better depending the observability architecture.

PART 31 decides the final model.

---

# 167. Service Mesh

If a mesh is adopted, standards are platform-wide rather than per-team ad hoc.

mTLS does not replace application authorization.

---

# 168. CoreDNS

Kubernetes service discovery relies on CoreDNS.

Clients should tolerate transient DNS failures using bounded retry.

---

# 169. JVM DNS

JVM DNS caching must not keep stale service/external endpoints indefinitely.

---

# 170. gRPC Load Balancing

Long-lived gRPC connections may not rebalance naturally through a simple ClusterIP.

If required, use an approved strategy such as:

```text
client-side resolver
service mesh
headless service
```

---

# 171. Connection Draining

Rolling updates depend on:

```text
readiness removal
graceful shutdown
client retry
```

---

# 172. NetworkPolicy Baseline

Production namespaces should aim for:

```text
default-deny ingress/egress
```

followed by explicit allows.

---

# 173. Service-to-Service Policy

Allow only required dependencies.

Example:

```text
order-service → inventory-service
order-service → payment-service
```

---

# 174. Database Network Policy

Where enforceable, only the owning workload should reach its database endpoint.

---

# 175. Kafka Network Policy

Only approved workloads may reach Kafka.

Kafka ACLs provide an additional layer.

---

# 176. Redis Network Policy

Only approved workloads may reach the Redis endpoint.

---

# 177. Egress Policy

Restrict production egress to required:

```text
partner hosts
DNS
observability endpoints
approved platform services
```

---

# 178. Internal Service Exposure

Most microservice `Service` objects remain internal.

External APIs are routed through the gateway layer.

---

# 179. Admin API Exposure

Admin APIs remain private/restricted and may use separate ingress/identity controls.

---

# 180. Manifest Structure

Choose one primary platform standard.

Source-supported options:

```text
Helm chart + environment values
```

or:

```text
Kustomize base + environment overlays
```

Do not arbitrarily mix Helm, Kustomize, and raw duplicated YAML per service.

---

# 181. Manifest Reuse

Avoid copying full manifests per environment.

Use reusable bases/templates with environment-specific values.

---

# 182. Environment Values Scope

Environment values may change:

```text
replicas
resources
URLs
secret references
feature flags
```

They do not contain business source code.

---

# 183. Secrets in Helm Values

Actual secret values must not be committed in `values.yaml`.

---

# 184. Generated Manifest Validation

CI renders manifests before merge and validates:

```text
schema
deprecated APIs
policy violations
required fields
```

---

# 185. Kubernetes API Versions

Use supported stable Kubernetes APIs and scan for removed/deprecated versions before cluster upgrades.

---

# 186. Resource Naming

Use consistent names such as:

```text
<service>
<service>-config
<service>-hpa
```

Avoid oversized ticket/branch strings in stable production resource names.

---

# 187. Image Reference

Use an immutable image tag/digest.

Do not rely on mutable `latest`.

---

# 188. imagePullPolicy

With immutable references, `IfNotPresent` can be reasonable.

Exact policy follows registry/platform strategy.

---

# 189. Registry Authentication

Use imagePullSecret only when needed.

Prefer workload/node identity if the platform supports it.

---

# 190. Registry Failure Behavior

Running Pods continue.

New Pods can fail to start if the registry or registry authentication is unavailable.

---

# 191. ImagePullBackOff Troubleshooting

Check:

```text
image digest/tag
registry auth
image existence
DNS/network
registry availability/rate limit
```

---

# 192. CrashLoopBackOff Troubleshooting

Check:

```text
previous logs
exit code
configuration
Secrets
migration
port binding
JVM/startup
dependency initialization
```

---

# 193. Pending Pod Troubleshooting

Check:

```text
resource shortage
taints/tolerations
affinity
quota
PVC
node selector
```

---

# 194. OOMKilled Troubleshooting

Check:

```text
container memory limit
heap
native memory
traffic/load
thread count
release regression
```

---

# 195. Readiness Failure Troubleshooting

Check:

```text
probe endpoint
application startup
DB connectivity
configuration
timeout
```

---

# 196. Liveness Restart Loop

First verify that optional/downstream dependency health was not incorrectly included in liveness.

---

# 197. Node Failure

Kubernetes reschedules Pods on healthy nodes.

The application still must be restart-safe.

---

# 198. Zone Failure

Requires all of:

```text
multi-zone cluster
replica spread
external durable-store HA
remaining cluster capacity
```

Kubernetes cannot fix a single-zone database architecture by itself.

---

# 199. Graceful Degradation

Example source pattern:

```text
Redis unavailable
→ Pods stay ready
→ cache bypass/fallback
```

---

# 200. Fail-Closed Readiness

Example:

```text
Order database unavailable
→ Order may become unready
```

when it cannot safely serve its core API.

---

# 201. Canary Deployment

Canary may send a small share of traffic to the new version.

Possible mechanisms listed by the source:

```text
Gateway
service mesh
Argo Rollouts
```

Adoption belongs to later routing/CD decisions.

---

# 202. Blue/Green Deployment

Possible for high-risk releases, but requires:

```text
temporary extra capacity
traffic switch
database compatibility
Kafka-consumer safety
```

---

# 203. Rolling Update Default

Use rolling deployment for ordinary service changes.

Canary/blue-green is for risk cases where the platform maturity justifies it.

---

# 204. Deployment Strategy by Risk

Illustrative source examples:

```text
Notification → rolling
Order        → rolling/canary
Payment      → canary with strict metrics
Gateway      → canary
```

These are examples, not immutable policy.

---

# 205. Release Health Gate

During rollout observe:

```text
error rate
latency
Pod restarts
readiness
business success metrics
dependency errors
```

---

# 206. Automated Rollback

May be considered when health metrics clearly indicate a release regression.

Avoid automated rollback loops caused by unrelated external outages.

---

# 207. Config Rollout Risk

Treat configuration changes with the same health observation discipline as image changes.

---

# 208. Secret-Rotation Rollout

When possible:

```text
make new credential valid
verify new workload can use it
then revoke old credential
```

---

# 209. Admin Maintenance Jobs

One-off repair Jobs should be:

```text
versioned
reviewed
audited
least privilege
domain aware
```

---

# 210. kubectl exec

Use for diagnostics, not normal business administration.

---

# 211. Distroless Debugging

A distroless production image may not contain a shell.

Use an access-controlled ephemeral debug container rather than bloating the business image.

---

# 212. Ephemeral Debug Container

A debug image may contain tools such as:

```text
curl
dig
ps
network tools
tcpdump where permitted
```

Production debug access must be restricted, audited, and time-limited.

---

# 213. Central Logs

`kubectl logs` is useful for immediate diagnosis.

Central logging remains authoritative because Pod-local logs disappear with Pods.

---

# 214. Kubernetes Events

Use `kubectl describe` and events to investigate:

```text
scheduling
probes
image pulls
mounts
evictions
```

---

# 215. Pod Conditions

Inspect:

```text
Ready
ContainersReady
PodScheduled
```

---

# 216. Namespace Dashboard

Show:

```text
Deployments
ready/desired replicas
CPU/memory
restarts
HPA
PDB
```

---

# 217. Deployment Dashboard

Show:

```text
version
image digest
ready replicas
unavailable replicas
restart count
latency
error rate
```

---

# 218. Kubernetes Metrics

Important workload signals:

```text
pod restarts
pod readiness
container CPU
container memory
OOM kills
pending Pods
deployment unavailable replicas
```

---

# 219. Cluster Metrics

Platform-level signals include:

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

# 220. SLO Correlation

A Kubernetes symptom is not automatically user impact.

Correlate:

```text
Pod/cluster health
+
service SLIs
+
business metrics
```

---

# 221. Required Alerts

Examples from PART 29:

```text
CrashLoop
deployment unavailable
Pending Pods
HPA maxed
CPU throttling
memory near limit
PDB blocking maintenance
image pull failures
```

---

# 222. Required Runbooks

At minimum:

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
deployment rollout
```

---

# 223. Kubernetes Testing Strategy

Test:

```text
manifest validity
policy
probes
resources
rollout
shutdown
autoscaling
scheduling
RBAC
NetworkPolicy
secret injection
node disruption
```

---

# 224. Manifest Unit Tests

CI renders manifests and verifies required fields and policy expectations.

---

# 225. Policy Tests

Reject according to platform policy:

```text
root workloads
missing resources
mutable latest image
privileged workloads
hostPath for business services
```

---

# 226. Server-Side Dry Run

Use Kubernetes API/server-side validation where possible before rollout.

---

# 227. Local Kubernetes Testing

Use tools such as:

```text
kind
k3d
minikube
```

for deployment-specific behavior.

Do not assume local Kubernetes reproduces full production storage/network behavior.

---

# 228. STAGING Kubernetes Testing

Validate production-like:

```text
RBAC
NetworkPolicy
HPA
PDB
rolling update
ingress path
shutdown
node drain
```

---

# 229. Probe Test

Deliberately:

```text
delay startup
break readiness
simulate liveness failure
```

and verify Kubernetes behaves as designed.

---

# 230. Graceful Shutdown Test

Terminate a Pod while it is handling:

```text
HTTP request
Kafka event
background task
```

Verify no unsafe duplicate/partial behavior.

---

# 231. Rolling Update Test

Deploy:

```text
v1 → v2
```

under traffic and verify no unacceptable errors.

---

# 232. Rollback Test

Deploy a bad version, roll back to the prior known-good digest, and verify recovery.

---

# 233. HPA Test

Generate load and verify:

```text
scale out
service health during scale
scale in
dependency stability
```

---

# 234. PDB / Node Drain Test

Drain a node and verify approved ready capacity remains.

---

# 235. Topology Spread Test

Verify replicas land across the intended nodes/zones.

---

# 236. Node Failure Test

Terminate a node/instance in STAGING and verify Pod rescheduling and service continuity.

---

# 237. NetworkPolicy Test

Verify:

```text
approved caller connects
forbidden caller cannot connect
```

---

# 238. RBAC Test

Verify a service account cannot perform prohibited actions such as listing Secrets unless explicitly required.

---

# 239. Secret Rotation Test

Rotate a non-production secret and verify workload reload/restart and continuity.

---

# 240. Config Rollout Test

Change configuration and verify only the intended Pods reload/restart.

---

# 241. Resource Limit Test

Run the service under configured CPU/memory limits and verify SLO behavior under representative load.

---

# 242. OOM Recovery Test

In non-production, trigger a controlled memory-limit breach and verify restart plus business recovery.

---

# 243. Cluster Capacity Test

Measure:

```text
Pods per node
CPU headroom
memory headroom
rollout surge capacity
failure capacity
```

---

# 244. Failure Capacity

After one node/zone loss, remaining cluster capacity should be able to schedule required service replicas.

---

# 245. Cluster Headroom

Maintain capacity above normal steady-state usage for:

```text
failure
traffic spike
rolling rollout
autoscaling
```

---

# 246. Bin Packing

Scheduler placement depends on resource requests.

Bad requests create:

```text
wasted capacity
or
overload/noisy neighbors
```

---

# 247. Resource Right-Sizing

Review periodically and after major releases.

Tune from observed high-percentile usage plus explicit headroom rather than blind over-requesting.

---

# 248. Scale to Zero

Generally avoid for latency-sensitive production APIs.

May be acceptable for:

```text
DEV
batch
rare async worker
```

where cold-start latency is acceptable.

---

# 249. Pre-Warming

For predictable campaign/peak traffic, increasing replicas before the event can be safer than waiting for HPA.

---

# 250. Scheduled Scaling

Can adjust minimum replicas around known traffic windows.

Ensure it does not fight HPA policy.

---

# 251. Connection Budget

Capacity equation for DB-style dependencies:

```text
max replicas × per-Pod pool size
```

must fit the downstream system together with other clients.

---

# 252. Autoscaling Matrix

Maintain:

```text
service
scaling metric
min replicas
max replicas
dependency cap
owner
```

---

# 253. Capacity Equation

Conceptual cluster capacity:

```text
sum(Pod requests)
+
system overhead
+
failure headroom
+
rollout surge
<=
cluster allocatable capacity
```

---

# 254. Backpressure

When downstream is saturated:

```text
do not blindly scale upstream
```

Use application-level queues, rate limits, circuit breakers, and other backpressure mechanisms from the service architecture.

---

# 255. Controller Ownership

Know which controller owns:

```text
replicas
image
annotations
desired state
```

to avoid HPA/GitOps/manual changes fighting each other.

---

# 256. Environment-Specific Profiles

DEV may use:

```text
replicas=1
HPA disabled
PDB optional
smaller resources
same image
same probe semantics
same config shape
```

STAGING should preserve production-like security, ingress, probe, HPA, and RBAC behavior with smaller scale if needed.

PROD uses the full availability/security/capacity profile.

---

# 257. Job Operational Metadata

Include:

```text
job name
run ID
business date/period
owner
```

and retain results through central logs/metrics/domain reconciliation records.

---

# 258. Backfill Standard

Large backfills should:

```text
batch
checkpoint
throttle
resume
```

rather than locking the database for hours.

---

# 259. Backfill Failure Handling

Persist failed individual records where appropriate rather than failing an entire million-row batch with no restart strategy.

---

# 260. Immutable Runtime

Application images contain all required runtime dependencies.

Do not:

```text
download Maven packages on Pod startup
install packages at runtime
mutate the image filesystem
```

---

# 261. Long-Running Credential Rotation

Pods must handle expiry/rotation of DB, Kafka, TLS, and other credentials through tested restart/reload/reconnect behavior.

---

# 262. Cross-Namespace Secret Sharing

Avoid direct secret sharing across namespaces.

Distribute or synchronize a managed secret separately per namespace.

---

# 263. External Managed Endpoints

Service configuration may point to managed:

```text
PostgreSQL
Kafka
Redis
```

DNS endpoints.

Clients must tolerate failover/DNS refresh.

---

# 264. No Unrestricted Production Internet

Production workloads should not receive unrestricted internet egress where platform policy can enforce required allowlists.

---

# 265. Node Maintenance

Use:

```text
cordon
drain
```

with validated PDB and graceful termination behavior.

---

# 266. PDB Misconfiguration

A bad PDB can block maintenance or upgrades.

Node-drain testing is mandatory for critical services.

---

# 267. Request Spike Handling

Do not rely on HPA alone for instantaneous spikes.

Use:

```text
minimum capacity
gateway rate limits
queues
pre-scaling
```

as appropriate.

---

# 268. Scale-Out Cache/Connection Spike

New Pods start cold and can collectively increase load on:

```text
database
Redis
Kafka
```

Avoid eager maximum connection opening and uncontrolled cache stampedes.

---

# 269. Tiering

The source allows workload criticality metadata such as:

```text
tier-1
tier-2
tier-3
```

Business criticality must be explicitly reviewed rather than inferred from the service name alone.

---

# 270. Tier-1 Standards

Critical Tier-1 production workloads generally require:

```text
>= 2 replicas
PDB
topology spread
resource requests/limits
HPA or tested capacity plan
strong alerts
```

---

# 271. Tier-2 and Tier-3

Lower-criticality workloads may tolerate more disruption or simpler scaling, but still follow baseline security, resource, probe, and observability standards.

---

# 272. Chaos Testing

Controlled Kubernetes failure tests can include:

```text
delete Pod
drain node
block network
remove Redis connectivity
```

Production chaos requires much greater maturity and approval.

---

# 273. Kubernetes Audit Logs

Control-plane audit should capture resource/RBAC changes and sensitive access where supported.

---

# 274. Direct kubectl Change Policy

Production direct changes are restricted.

Emergency changes must be reconciled back to Git desired state.

---

# 275. kubectl apply from Laptop

Not the normal production deployment mechanism.

---

# 276. CI vs CD Separation

CI:

```text
build/test/scan image
```

GitOps/CD:

```text
deploy approved image
```

---

# 277. Environment Promotion in Kubernetes

Promotion updates:

```text
image digest
config revision
```

in the target environment overlay.

---

# 278. Production Access

Preferred developer production access is:

```text
read-only namespace view
logs/metrics/traces through observability
```

not unrestricted cluster-admin access.

---

# 279. Admin Repair Job

A versioned, reviewed, audited repair Job is safer than ad-hoc shell SQL when domain-aware correction is required.

---

# 280. Spot / Preemptible Nodes

Potentially suitable for:

```text
non-critical workers
DEV
batch
```

Use carefully for Tier-1 workloads.

PDB does not protect against involuntary spot termination.

---

# 281. Autoscaler Failure Modes

Monitor:

```text
metrics-server/custom-metric availability
HPA stuck at max
Pending Pods
cluster autoscaler lag
downstream saturation
```

---

# 282. Kubernetes Capacity Planning

Plan for:

```text
normal load
peak load
node loss
zone loss
rollout surge
autoscaling headroom
system/DaemonSet overhead
```

---

# 283. Tool Version Compatibility

Platform defines supported versions for:

```text
kubectl
Helm
Kustomize
Kubernetes APIs
```

and tests compatibility before upgrades.

---

# 284. Values Documentation

Every configurable chart/base value should document:

```text
purpose
default
environment override
```

---

# 285. Config Compatibility

Renaming/removing configuration keys is a compatibility change between image and environment configuration.

Missing required configuration should fail startup clearly.

---

# 286. Production Autoscaling

Tier-1 autoscaling must be performance-tested before production enablement.

---

# 287. CronJob Environment Guard

A business-affecting CronJob should verify environment/context and refuse unsafe target mismatches.

---

# 288. CronJob Timezone

Prefer UTC schedules.

Convert business-local time explicitly.

---

# 289. Job Manual Rerun

Manual reruns must be safe and audited.

---

# 290. Production Batch Freeze

Suspend non-critical batch work during major incidents if it adds harmful load.

---

# 291. Certificate Lifecycle

cert-manager may automate certificate issuance/renewal for ingress.

Expiry and renewal failure must be monitored.

---

# 292. Service Discovery Across Namespaces

Use:

```text
service.namespace
```

with explicit network policy and documented ownership.

---

# 293. Per-Service Namespace Caution

Per-service namespaces are often too granular initially.

Use when security/ownership requirements justify the additional complexity.

---

# 294. Secret Scope per Workload

Inject only the credentials a workload requires.

For example, a payment worker must not receive Identity private keys or Wallet administrative secrets.

---

# 295. Least Configuration Principle

Do not inject a whole-platform ConfigMap into every service.

Each workload receives only required configuration.

---

# 296. Config Atomicity

If multiple related values must change together, version them as one coherent config/secret release.

---

# 297. Image + Config Release Identity

Release metadata records:

```text
image digest
config revision
migration version
```

---

# 298. KMS / etcd Protection

Cluster Secret storage should use encryption at rest/KMS where supported.

Application teams never access etcd directly.

---

# 299. Kubernetes Recovery Model

Application namespace recovery target:

```text
Terraform
+
GitOps
+
external durable data stores
```

Pods themselves are not backup units.

---

# 300. Managed Data-Service Failure Domain

Managed data stores can decouple application-cluster failure from durable database/Kafka/Redis failure domains.

---

# 301. Cluster Upgrade

Rehearse control-plane/node upgrades in non-production.

Use PDB, replicas, and topology spread to preserve service availability.

---

# 302. Container Runtime

Application workloads must not depend on access to the node's Docker/container runtime socket.

---

# 303. Ephemeral Storage Limits

Bound workloads that use meaningful `/tmp`, logs, or temporary files so they cannot exhaust node storage.

---

# 304. Telemetry Endpoint Security

Metrics endpoints are internal scrape targets.

Do not expose operational metrics publicly.

---

# 305. Telemetry Labels

Use stable bounded metadata:

```text
service
namespace
version
```

not high-cardinality user IDs.

---

# 306. Startup Connection Storm

Large simultaneous rollout/scale-out may create a connection storm to:

```text
DB
Kafka
Redis
```

Use bounded/lazy pool initialization and backoff.

---

# 307. Startup Probe Tuning

Measure cold-start behavior and set startup budget with headroom.

Do not guess an extremely short value for Java services.

---

# 308. Readiness Flapping

Frequent readiness toggling may indicate:

```text
probe too sensitive
dependency unstable
service overloaded
```

Investigate rather than merely raising thresholds.

---

# 309. Liveness Flapping

More dangerous than readiness flapping because it creates restart loops.

---

# 310. Termination Grace Tuning

Measure the longest safe in-flight operation.

Do not choose a grace period shorter than normal Kafka/HTTP/worker completion behavior.

---

# 311. Long-Running Work

Prefer asynchronous workflows over multi-minute synchronous HTTP requests.

Split or optimize very long Kafka handlers that conflict with poll/shutdown windows.

---

# 312. CronJob Burst Control

Do not schedule many heavy jobs at exactly the same minute.

Stagger schedules to reduce cluster and DB spikes.

---

# 313. Namespace Bootstrap

Creating an application/environment namespace should also create:

```text
ResourceQuota
LimitRange
default NetworkPolicy
RBAC
secret integration
monitoring labels
```

according to environment policy.

---

# 314. Application Bootstrap Prerequisites

Before a service rollout, required dependencies such as:

```text
database
secrets
Kafka topics
DNS
```

must be available.

---

# 315. No Strict Microservice Startup Ordering

Avoid architectural patterns such as:

```text
A cannot start until B
B cannot start until A
```

Clients and readiness should tolerate temporary dependency unavailability.

---

# 316. API and Worker Split

A Kafka consumer may run in the same Deployment as the REST API or in a separate worker Deployment.

Separate when the worker has:

```text
different scaling profile
different resources
independent failure behavior
```

---

# 317. Separate Worker Advantage

Separating API and worker prevents HTTP HPA from scaling Kafka consumers unnecessarily and allows lag-based scaling independently.

---

# 318. Outbox Publisher Deployment

May run:

```text
inside app
or
separate worker
```

based on scaling and ownership requirements.

---

# 319. Reconciliation Worker

High-value financial reconciliation may deserve a separate Deployment/CronJob and explicit metrics.

---

# 320. Service Mesh Termination

If a proxy sidecar is injected, shutdown/probe ordering must ensure the proxy does not terminate before the application completes required outbound work.

---

# 321. Network / Gateway Handoff

PART 30 will define:

```text
north-south traffic
east-west traffic
API Gateway
Ingress / Gateway API
DNS
TLS
mTLS
NetworkPolicy detail
egress controls
WAF
rate limiting
load balancers
CORS
security headers
timeouts
connection management
```

Phase 25 defines the workload runtime boundary, not the final traffic architecture.

---

# 322. Definition of Done — Autoscaling

- [ ] Metric chosen.
- [ ] Min replicas defined.
- [ ] Max replicas defined.
- [ ] Scale-up behavior defined.
- [ ] Scale-down behavior defined.
- [ ] DB connection budget checked.
- [ ] Kafka partition limit checked.
- [ ] Provider quota checked.
- [ ] Redis/downstream capacity checked.
- [ ] Performance test passed.
- [ ] Alert configured when maxed.

---

# 323. Definition of Done — Deployment

- [ ] Deployment exists.
- [ ] ClusterIP Service exists.
- [ ] Stable labels/selectors.
- [ ] Immutable image digest/tag.
- [ ] Dedicated ServiceAccount.
- [ ] Non-root security context.
- [ ] CPU/memory requests.
- [ ] Limit policy.
- [ ] Startup/readiness/liveness probes.
- [ ] ConfigMap/Secret references.
- [ ] PDB if critical.
- [ ] Topology spread if critical.
- [ ] HPA or tested capacity plan.
- [ ] Graceful shutdown tested.
- [ ] Rollout and rollback tested.

---

# 324. Definition of Done — Job

- [ ] Idempotent.
- [ ] CPU/memory resources.
- [ ] Dedicated ServiceAccount.
- [ ] Retry/backoff.
- [ ] Timeout.
- [ ] Central logs/metrics.
- [ ] Checkpoint/restart behavior.
- [ ] Audit if administrative/repair.

---

# 325. Definition of Done — CronJob

- [ ] Schedule documented.
- [ ] Timezone semantics explicit.
- [ ] Concurrency policy.
- [ ] Missed-run policy.
- [ ] Idempotency.
- [ ] History limits.
- [ ] Failure alert.
- [ ] Manual rerun safe.

---

# 326. Definition of Done — RBAC

- [ ] Dedicated ServiceAccount.
- [ ] Token automount disabled where unused.
- [ ] Least privilege.
- [ ] No broad Secret access.
- [ ] Human roles separate from workload roles.
- [ ] CI/CD role scoped.
- [ ] Break-glass defined.

---

# 327. Definition of Done — SecurityContext

- [ ] `runAsNonRoot`.
- [ ] `allowPrivilegeEscalation=false`.
- [ ] `readOnlyRootFilesystem`.
- [ ] Drop ALL capabilities.
- [ ] `seccompProfile: RuntimeDefault`.
- [ ] No privileged.
- [ ] No hostPath.
- [ ] No hostNetwork unless approved exception.

---

# 328. Definition of Done — Resources

- [ ] CPU request.
- [ ] Memory request.
- [ ] Memory limit.
- [ ] CPU limit policy reviewed.
- [ ] JVM heap/native headroom validated.
- [ ] Representative load tested.
- [ ] HPA interaction understood.

---

# 329. Definition of Done — Availability

- [ ] Replica count.
- [ ] Node/zone spread.
- [ ] PDB.
- [ ] Rolling strategy.
- [ ] Readiness.
- [ ] Graceful shutdown.
- [ ] Node drain test.
- [ ] Rollback test.

---

# 330. Architecture Review Checklist — Workload

- [ ] Correct controller type.
- [ ] Stateless assumption valid.
- [ ] Durable state external.
- [ ] No manual Pod ownership.

---

# 331. Architecture Review Checklist — Health

- [ ] Startup probe.
- [ ] Readiness probe.
- [ ] Liveness probe.
- [ ] Probe dependency semantics are correct.
- [ ] Probe timeout/thresholds measured.

---

# 332. Architecture Review Checklist — Resources

- [ ] Requests.
- [ ] Limits.
- [ ] JVM headroom.
- [ ] Cluster surge/failure headroom.
- [ ] HPA or tested fixed capacity.

---

# 333. Scheduling Review Checklist

- [ ] Replicas spread.
- [ ] Required affinity minimized.
- [ ] Taints/tolerations justified.
- [ ] Zone resilience reviewed.
- [ ] Pending-Pod failure mode understood.

---

# 334. Security Review Checklist

- [ ] Non-root.
- [ ] Read-only root filesystem.
- [ ] Capabilities dropped.
- [ ] Dedicated ServiceAccount.
- [ ] RBAC.
- [ ] Approved Secret injection.
- [ ] No host mounts.
- [ ] NetworkPolicy.
- [ ] Trusted immutable image.

---

# 335. Deployment Review Checklist

- [ ] Immutable digest.
- [ ] Rolling strategy.
- [ ] `maxSurge`/`maxUnavailable`.
- [ ] Readiness gate.
- [ ] Progress deadline.
- [ ] Rollback path.
- [ ] Config revision.
- [ ] DB/event/cache compatibility.

---

# 336. Autoscaling Review Checklist

- [ ] Metric quality.
- [ ] Min/max replicas.
- [ ] DB connection budget.
- [ ] Kafka partition cap.
- [ ] Provider quota.
- [ ] Redis/downstream cap.
- [ ] Scale stabilization.
- [ ] Max-replica alert.

---

# 337. Operations Review Checklist

- [ ] Dashboards.
- [ ] Alerts.
- [ ] Runbooks.
- [ ] Audit.
- [ ] Controlled debug access.
- [ ] Ephemeral debug-container process.
- [ ] Cluster upgrade procedure.
- [ ] Capacity headroom.

---

# 338. Testing Review Checklist

- [ ] Manifest validation.
- [ ] Policy tests.
- [ ] Probe tests.
- [ ] Graceful shutdown test.
- [ ] Rolling update.
- [ ] Rollback.
- [ ] HPA.
- [ ] PDB/node drain.
- [ ] RBAC.
- [ ] NetworkPolicy.
- [ ] Secret rotation.

---

# 339. Production Readiness Checklist

Before production Kubernetes rollout:

- [ ] Production cluster/environment isolated.
- [ ] Namespace strategy implemented.
- [ ] Images immutable and non-root.
- [ ] Stable labels/selectors.
- [ ] Internal traffic uses ClusterIP Services.
- [ ] Startup/readiness/liveness probes tested.
- [ ] CPU/memory requests configured.
- [ ] JVM memory headroom validated.
- [ ] HPA/capacity strategy defined.
- [ ] Tier-1 services have sufficient replicas.
- [ ] Topology spread/anti-affinity configured.
- [ ] PDBs validated.
- [ ] Graceful shutdown tested.
- [ ] Rolling update and rollback tested.
- [ ] ConfigMaps managed through GitOps.
- [ ] Secrets sourced from approved manager.
- [ ] Dedicated ServiceAccounts.
- [ ] RBAC least privilege.
- [ ] ServiceAccount token disabled where unused.
- [ ] SecurityContext hardened.
- [ ] NetworkPolicies planned/enforced.
- [ ] Jobs/CronJobs idempotent.
- [ ] ResourceQuota/LimitRange configured.
- [ ] Observability integrated.
- [ ] Cluster/add-on upgrade process tested.
- [ ] Node drain/failure test passed.
- [ ] Registry/image-pull runbook exists.
- [ ] Debug/break-glass controlled.
- [ ] GitOps is deployment source of truth.

---

# 340. Source-Recommended Initial Implementation Order

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

# 341. Minimum Viable Kubernetes Standard

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

# 342. Kubernetes Governance Rejections

Architecture/platform review should reject:

```text
mutable latest image tags
root containers
no resource requests
liveness coupled to optional external dependency
manual Pod creation
hostPath for business data
broad cluster-admin ServiceAccount
secrets committed in manifests
single-replica Tier-1 without exception
unbounded CronJob overlap
runtime package installation
production deployment from a laptop
```

---

# 343. Standard Workload Contract

```text
Controller:
Deployment

Networking:
ClusterIP Service

Identity:
Dedicated ServiceAccount

Runtime:
Non-root
Read-only root filesystem capable

Config:
ConfigMap + external Secret references

Health:
startup + readiness + liveness

Resources:
requests + approved limits policy

Deployment:
rolling update by default

Shutdown:
graceful SIGTERM

Observability:
logs + metrics + traces
```

---

# 344. Standard Production Tier-1 Profile

Conceptual baseline:

```text
replicas >= 2
low/zero maxUnavailable
topology spread across nodes/zones
PDB
HPA or tested fixed capacity
priority class only if justified
strict NetworkPolicy
strong alerts
```

---

# 345. Standard Kafka Worker Profile

```text
Deployment
consumer-group identity
graceful shutdown
lag metrics
HPA/KEDA if justified
replicas <= useful partition parallelism
dependency/provider capacity bound
```

---

# 346. Standard Scheduled Job Profile

```text
CronJob
Forbid overlap where appropriate
idempotent operation
bounded runtime
bounded retry
central logging
failure alert
safe manual rerun
```

---

# 347. Standard Migration Job Profile

```text
versioned image
dedicated Job
database migration permission only
one controlled execution per release
failure blocks rollout
audit/result logs
```

---

# 348. Standard Repair Job Profile

```text
reviewed artifact
explicit input
least privilege
manual trigger
audit
idempotent where possible
```

---

# 349. Kubernetes Resource Catalog Template

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

# 350. Autoscaling Catalog Template

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
Redis/Other Dependency Cap:
Owner:
```

---

# 351. Probe Catalog Template

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

# 352. Job Catalog Template

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

# 353. RBAC Catalog Template

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

# 354. Example Order Service Profile

```text
Deployment:
order-service

Replicas:
3 baseline (illustrative source example)

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

# 355. Example Payment Service Profile

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

# 356. Example Mission Worker Profile

```text
Source:
Kafka

Partition key:
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

# 357. Example Notification Worker Profile

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

# 358. Example Reconciliation CronJob

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
read only required participant APIs/data
```

---

# 359. Example PDB Decision

For three Order replicas:

```text
replicas = 3
maxUnavailable = 1
```

A node drain can evict one while two remain.

This is illustrative, not a universal PDB.

---

# 360. Example HPA Connection Budget

If:

```text
maxReplicas = 20
DB pool     = 10
```

then maximum potential service DB connections are approximately:

```text
200
```

before adding other clients.

DB capacity must support the approved maximum.

---

# 361. Example Zone Spread

Three replicas may be distributed:

```text
zone-a
zone-b
zone-c
```

where the provider/cluster supports it.

---

# 362. Example DEV Kubernetes Profile

```text
replicas = 1
HPA = off
PDB = optional
smaller resources
same image
same probe semantics
same config shape
```

---

# 363. Example STAGING Kubernetes Profile

```text
same security policies
same ingress path
same probes
same HPA logic
same ServiceAccount/RBAC shape
smaller replica/resource count if needed
```

---

# 364. Example PROD Kubernetes Profile

```text
multiple replicas
zone spread
PDB
HPA/capacity plan
strict NetworkPolicy
external secret manager
full observability
```

---

# 365. Work Breakdown

Suggested implementation tickets:

```text
K8S-001 Publish Kubernetes cluster strategy
K8S-002 Approve production cluster isolation
K8S-003 Approve shared non-prod cluster model
K8S-004 Create namespace naming standard
K8S-005 Create namespace bootstrap template
K8S-006 Add ResourceQuota to namespace bootstrap
K8S-007 Add LimitRange to namespace bootstrap
K8S-008 Add default NetworkPolicy to namespace bootstrap
K8S-009 Add namespace RBAC baseline
K8S-010 Add namespace secret integration
K8S-011 Add namespace monitoring labels
K8S-012 Define platform add-on ownership
K8S-013 Create base Deployment template
K8S-014 Create ClusterIP Service template
K8S-015 Create standard labels
K8S-016 Create standard annotations
K8S-017 Define immutable selector policy
K8S-018 Add immutable image digest support
K8S-019 Define imagePullPolicy standard
K8S-020 Define registry authentication standard
K8S-021 Create ConfigMap pattern
K8S-022 Integrate external secret manager
K8S-023 Define secret file mount pattern
K8S-024 Define secret env pattern
K8S-025 Add config checksum rollout mechanism
K8S-026 Add runtime environment metadata
K8S-027 Configure Spring Boot liveness group
K8S-028 Configure Spring Boot readiness group
K8S-029 Create startupProbe template
K8S-030 Create readinessProbe template
K8S-031 Create livenessProbe template
K8S-032 Document probe dependency semantics
K8S-033 Add probe failure tests
K8S-034 Define CPU request baseline methodology
K8S-035 Define memory request baseline methodology
K8S-036 Define memory limit baseline methodology
K8S-037 Review CPU limit strategy
K8S-038 Add JVM memory headroom calculator/guidance
K8S-039 Create resource regression review
K8S-040 Create HPA standard
K8S-041 Create autoscaling catalog
K8S-042 Define CPU HPA pattern
K8S-043 Define custom metric HPA pattern
K8S-044 Define Kafka lag autoscaling pattern
K8S-045 Decide KEDA adoption
K8S-046 Define HPA stabilization policy
K8S-047 Define min replica policy
K8S-048 Define max replica dependency review
K8S-049 Create DB connection-budget review
K8S-050 Create Redis connection-budget review
K8S-051 Create provider quota review
K8S-052 Create Kafka partition scaling review
K8S-053 Create performance autoscaling test
K8S-054 Define VPA recommendation-mode policy
K8S-055 Configure Cluster Autoscaler
K8S-056 Define node-pool strategy
K8S-057 Define dedicated node-pool exception
K8S-058 Define taint/toleration policy
K8S-059 Define node affinity policy
K8S-060 Define topology spread policy
K8S-061 Define anti-affinity policy
K8S-062 Create zone-spread template
K8S-063 Create node-spread template
K8S-064 Create PDB template
K8S-065 Define PDB review rules
K8S-066 Create node-drain PDB test
K8S-067 Define RollingUpdate baseline
K8S-068 Define maxSurge guidance
K8S-069 Define maxUnavailable guidance
K8S-070 Set rollout progress deadlines
K8S-071 Configure revision history limit
K8S-072 Implement graceful Spring Boot shutdown
K8S-073 Implement Kafka consumer shutdown standard
K8S-074 Implement worker lease shutdown standard
K8S-075 Define terminationGracePeriod methodology
K8S-076 Add graceful shutdown test
K8S-077 Define preStop exception policy
K8S-078 Create Job template
K8S-079 Create Job resource standard
K8S-080 Create Job idempotency standard
K8S-081 Create migration Job template
K8S-082 Block rollout on migration Job failure
K8S-083 Create CronJob template
K8S-084 Define CronJob concurrency policy
K8S-085 Define CronJob UTC scheduling standard
K8S-086 Define CronJob history limits
K8S-087 Create reconciliation CronJob pattern
K8S-088 Add safe manual Job rerun procedure
K8S-089 Create dedicated ServiceAccount per workload
K8S-090 Disable ServiceAccount token automount by default
K8S-091 Integrate cloud workload identity
K8S-092 Define workload RBAC pattern
K8S-093 Define developer RBAC
K8S-094 Define CI/CD RBAC
K8S-095 Define Argo CD RBAC
K8S-096 Restrict Secret-read RBAC
K8S-097 Create SecurityContext template
K8S-098 Enforce runAsNonRoot
K8S-099 Enforce no privilege escalation
K8S-100 Enforce read-only root filesystem
K8S-101 Drop ALL Linux capabilities
K8S-102 Set seccomp RuntimeDefault
K8S-103 Block privileged application Pods
K8S-104 Block hostPath for application Pods
K8S-105 Block hostNetwork/hostPID/hostIPC by default
K8S-106 Enable Pod Security Admission
K8S-107 Create /tmp emptyDir pattern
K8S-108 Set ephemeral-storage limits where needed
K8S-109 Define PVC exception policy
K8S-110 Approve StorageClasses
K8S-111 Define StatefulSet exception policy
K8S-112 Decide managed-vs-self-hosted data-service strategy
K8S-113 Define init-container policy
K8S-114 Define sidecar policy
K8S-115 Decide service-mesh adoption
K8S-116 Define CoreDNS/DNS client resilience
K8S-117 Review JVM DNS caching
K8S-118 Define gRPC load-balancing strategy
K8S-119 Create default-deny NetworkPolicy baseline
K8S-120 Create service dependency NetworkPolicies
K8S-121 Create DB NetworkPolicy
K8S-122 Create Kafka NetworkPolicy
K8S-123 Create Redis NetworkPolicy
K8S-124 Create egress allowlist baseline
K8S-125 Define admin API private-exposure policy
K8S-126 Choose Helm vs Kustomize primary standard
K8S-127 Create reusable manifest base/chart
K8S-128 Create environment values/overlays
K8S-129 Add manifest rendering in CI
K8S-130 Add schema/deprecated API validation
K8S-131 Add policy-as-code tests
K8S-132 Select policy engine if required
K8S-133 Define Kubernetes resource naming standard
K8S-134 Create ImagePullBackOff runbook
K8S-135 Create CrashLoopBackOff runbook
K8S-136 Create Pending Pod runbook
K8S-137 Create OOMKilled runbook
K8S-138 Create readiness runbook
K8S-139 Create liveness-loop runbook
K8S-140 Create DNS runbook
K8S-141 Create secret-mount runbook
K8S-142 Create node-failure runbook
K8S-143 Create rollout runbook
K8S-144 Create HPA runbook
K8S-145 Integrate central logging
K8S-146 Integrate workload metrics
K8S-147 Integrate Kubernetes metadata into traces
K8S-148 Create namespace dashboard
K8S-149 Create deployment dashboard
K8S-150 Create cluster dashboard
K8S-151 Create CrashLoop alert
K8S-152 Create unavailable-replica alert
K8S-153 Create Pending-Pod alert
K8S-154 Create HPA-maxed alert
K8S-155 Create CPU-throttling alert
K8S-156 Create memory-near-limit alert
K8S-157 Create PDB-blocking alert
K8S-158 Create image-pull alert
K8S-159 Add manifest unit tests
K8S-160 Add server-side dry-run validation
K8S-161 Add local kind/k3d/minikube validation
K8S-162 Add STAGING Kubernetes test suite
K8S-163 Add rolling update test
K8S-164 Add rollback test
K8S-165 Add HPA load test
K8S-166 Add topology spread test
K8S-167 Add node failure test
K8S-168 Add RBAC test
K8S-169 Add NetworkPolicy test
K8S-170 Add Secret rotation test
K8S-171 Add ConfigMap rollout test
K8S-172 Add resource-limit test
K8S-173 Add controlled OOM test
K8S-174 Measure rollout surge capacity
K8S-175 Measure failure capacity
K8S-176 Define cluster headroom target
K8S-177 Add resource right-sizing review
K8S-178 Define scale-to-zero policy
K8S-179 Define scheduled pre-scaling policy
K8S-180 Create autoscaling matrix
K8S-181 Create cluster capacity model
K8S-182 Account for system reserved capacity
K8S-183 Account for DaemonSet/sidecar overhead
K8S-184 Add zone-capacity review
K8S-185 Define backpressure escalation policy
K8S-186 Define controller ownership runbook
K8S-187 Document immutable Kubernetes fields
K8S-188 Define production HPA enablement gate
K8S-189 Define CronJob environment guard
K8S-190 Add Job run IDs/business periods
K8S-191 Define deterministic Job idempotency keys
K8S-192 Create backfill batching/checkpoint standard
K8S-193 Create per-record backfill failure store
K8S-194 Block runtime package installation
K8S-195 Define secret expiry/rotation handling
K8S-196 Test DB credential rotation
K8S-197 Test Kafka credential rotation
K8S-198 Test TLS certificate rotation
K8S-199 Test JWKS cache refresh
K8S-200 Define ConfigMap/Secret size rules
K8S-201 Integrate cert-manager
K8S-202 Monitor certificate renewal
K8S-203 Prevent cross-namespace Secret sharing
K8S-204 Define controlled shared trust-material distribution
K8S-205 Define managed DB/Kafka/Redis endpoint conventions
K8S-206 Add production internet-egress restriction
K8S-207 Add partner egress allowlists
K8S-208 Validate DNS egress under default deny
K8S-209 Monitor node time synchronization
K8S-210 Define node maintenance cordon/drain process
K8S-211 Test PDB upgrade behavior
K8S-212 Test HPA/PDB/rollout interactions
K8S-213 Document HPA-to-cluster-autoscaler latency
K8S-214 Define instant-spike handling
K8S-215 Review cold-cache scale-out impact
K8S-216 Review connection-pool scale-out impact
K8S-217 Create workload tiering model
K8S-218 Define Tier-1 baseline
K8S-219 Define Tier-2 baseline
K8S-220 Define Tier-3 baseline
K8S-221 Run regular node-maintenance tests
K8S-222 Add controlled chaos test
K8S-223 Enable Kubernetes audit logs
K8S-224 Restrict direct kubectl production changes
K8S-225 Prohibit laptop-based production deployment
K8S-226 Integrate GitOps desired state
K8S-227 Define Kubernetes rollback via GitOps
K8S-228 Restrict production cluster-admin membership
K8S-229 Define developer production read-only access
K8S-230 Define production port-forward policy
K8S-231 Create audited repair Job pattern
K8S-232 Add Kubernetes cost attribution labels
K8S-233 Define non-prod replica reduction/off-hours policy
K8S-234 Define spot/preemptible-node policy
K8S-235 Define mixed stable/spot node pools
K8S-236 Monitor Metrics Server/autoscaler health
K8S-237 Create dependency-cap autoscaling review
K8S-238 Pin kubectl/Helm/Kustomize versions
K8S-239 Document values/config keys
K8S-240 Add missing-config fail-fast tests
K8S-241 Create production CronJob suspend process
K8S-242 Add heavy batch priority controls
K8S-243 Define ephemeral environment namespace naming
K8S-244 Automate ephemeral environment cleanup
K8S-245 Create stuck-finalizer runbook
K8S-246 Define PVC reclaim policy
K8S-247 Define volume encryption requirement
K8S-248 Create workload owner/runbook annotations
K8S-249 Create service criticality labels
K8S-250 Create standard workload contract
K8S-251 Create production Tier-1 profile
K8S-252 Create Kafka worker profile
K8S-253 Create scheduled Job profile
K8S-254 Create migration Job profile
K8S-255 Create repair Job profile
K8S-256 Build Kubernetes resource catalog
K8S-257 Build autoscaling catalog
K8S-258 Build probe catalog
K8S-259 Build Job catalog
K8S-260 Build RBAC catalog
K8S-261 Create Order Service Kubernetes profile
K8S-262 Create Payment Service Kubernetes profile
K8S-263 Create Mission worker profile
K8S-264 Create Notification worker profile
K8S-265 Create reconciliation CronJob profile
K8S-266 Complete Deployment DoD review
K8S-267 Complete Autoscaling DoD review
K8S-268 Complete Job/CronJob DoD review
K8S-269 Complete RBAC DoD review
K8S-270 Complete SecurityContext DoD review
K8S-271 Complete Resource DoD review
K8S-272 Complete Availability DoD review
K8S-273 Complete Architecture review checklist
K8S-274 Complete Scheduling review checklist
K8S-275 Complete Security review checklist
K8S-276 Complete Deployment review checklist
K8S-277 Complete Autoscaling review checklist
K8S-278 Complete Operations review checklist
K8S-279 Complete Testing review checklist
K8S-280 Complete Kubernetes production-readiness checklist
K8S-281 Complete Phase 25 policy freeze
K8S-282 Run Phase 25 exit review
K8S-283 Hand off to Phase 26 Networking/Gateway/TLS
```

---

# 366. Expanded Implementation Sequence

Recommended implementation sequence:

```text
Step 1   Approve cluster topology and production isolation
Step 2   Define namespace bootstrap standard
Step 3   Create base Deployment template
Step 4   Create ClusterIP Service template
Step 5   Integrate ConfigMap/external Secrets
Step 6   Implement startup/readiness/liveness probes
Step 7   Add explicit CPU/memory resources
Step 8   Validate JVM memory headroom
Step 9   Implement graceful SIGTERM
Step 10  Create dedicated ServiceAccounts
Step 11  Add least-privilege RBAC
Step 12  Apply hardened SecurityContext
Step 13  Add topology spread
Step 14  Add PDB for critical services
Step 15  Add HPA/capacity plan
Step 16  Add ResourceQuota/LimitRange
Step 17  Implement Jobs/CronJobs standards
Step 18  Add default-deny NetworkPolicy baseline
Step 19  Integrate central telemetry
Step 20  Select Helm/Kustomize standard
Step 21  Render/validate manifests in CI
Step 22  Integrate GitOps desired state
Step 23  Add rollout/rollback tests
Step 24  Add graceful shutdown tests
Step 25  Add HPA/performance tests
Step 26  Add node drain/failure tests
Step 27  Add Secret/config rotation tests
Step 28  Tune cluster/resource capacity
Step 29  Enforce admission/policy controls
Step 30  Complete production-readiness review
Step 31  Handoff Phase 26 Networking/Gateway/TLS
```

---

# 367. Phase 25 Policy Freeze Checklist

Before moving into Phase 26, explicitly approve:

- [ ] Cluster topology.
- [ ] Production cluster isolation.
- [ ] Namespace model.
- [ ] Namespace bootstrap resources.
- [ ] Add-on ownership.
- [ ] Helm vs Kustomize primary standard.
- [ ] Deployment template.
- [ ] ClusterIP Service standard.
- [ ] Label/annotation standard.
- [ ] ConfigMap pattern.
- [ ] External Secret mechanism.
- [ ] Config rollout mechanism.
- [ ] Startup probe semantics.
- [ ] Readiness dependency policy.
- [ ] Liveness dependency policy.
- [ ] CPU request methodology.
- [ ] Memory request/limit methodology.
- [ ] CPU limit policy.
- [ ] JVM memory headroom policy.
- [ ] Critical service replica floor.
- [ ] Zone/node spread policy.
- [ ] PDB policy.
- [ ] Rolling strategy and surge/unavailable defaults.
- [ ] Termination grace methodology.
- [ ] ServiceAccount/workload identity model.
- [ ] RBAC baseline.
- [ ] Pod Security Admission profile.
- [ ] SecurityContext baseline.
- [ ] HPA metrics/min/max policy.
- [ ] KEDA adoption.
- [ ] Cluster Autoscaler policy.
- [ ] Node pools.
- [ ] Taints/tolerations/affinity standards.
- [ ] ResourceQuota/LimitRange.
- [ ] PriorityClass policy.
- [ ] Managed-vs-self-hosted stateful services.
- [ ] PVC/storage-class policy.
- [ ] Job/CronJob standard.
- [ ] Migration Job standard.
- [ ] Repair Job standard.
- [ ] Default-deny NetworkPolicy baseline.
- [ ] Production egress standard.
- [ ] Service mesh adoption.
- [ ] Gateway API/Ingress direction handoff.
- [ ] Manifest CI validation.
- [ ] Policy engine/admission strategy.
- [ ] GitOps deployment authority.
- [ ] Debug/break-glass procedure.
- [ ] Required dashboards/alerts/runbooks.
- [ ] STAGING node-drain/rollout test plan.
- [ ] Production capacity headroom.
- [ ] Cluster upgrade process.

---

# 368. Phase 25 Exit Criteria — Workload

The team can answer:

```text
Which Kubernetes controller runs each workload and why?
```

---

# 369. Phase 25 Exit Criteria — Availability

The team can answer:

```text
How many replicas exist, how are they spread,
and what happens during node/zone disruption?
```

---

# 370. Phase 25 Exit Criteria — Health

The team can answer:

```text
What exactly do startup, readiness, and liveness failures mean?
```

---

# 371. Phase 25 Exit Criteria — Resources

The team can answer:

```text
How were CPU/memory requests and limits chosen,
and does JVM memory fit safely?
```

---

# 372. Phase 25 Exit Criteria — Scaling

The team can answer:

```text
What metric drives scaling,
and can downstream databases/providers support max replicas?
```

---

# 373. Phase 25 Exit Criteria — Deployment

The team can answer:

```text
Can old/new versions coexist during rolling update,
and can the service roll back safely?
```

---

# 374. Phase 25 Exit Criteria — Shutdown

The team can answer:

```text
What happens to in-flight HTTP requests,
Kafka events, and workers when Kubernetes sends SIGTERM?
```

---

# 375. Phase 25 Exit Criteria — Identity

The team can answer:

```text
Which ServiceAccount and RBAC permissions does the workload have?
```

---

# 376. Phase 25 Exit Criteria — Security

The team can answer:

```text
Does the workload run non-root, read-only,
without privileged access or unnecessary capabilities?
```

---

# 377. Phase 25 Exit Criteria — Operations

The team can diagnose:

```text
Pending Pods
CrashLoopBackOff
OOMKilled
readiness failures
image-pull failures
autoscaling problems
PDB maintenance blocks
DNS/Secret mount failures
```

---

# 378. Phase 25 Exit Criteria — Recovery

The team can answer:

```text
Can the cluster/workloads be recreated from Terraform + GitOps
without relying on Pod-local durable state?
```

---

# 379. Phase 25 Completion Tree

```text
PHASE 25 — KUBERNETES

├── Cluster Strategy                         ✅
├── Production Isolation                     ✅
├── Shared Non-Prod Model                    ✅
├── Namespace Strategy                       ✅
├── Cluster Add-Ons                          ✅
├── Deployment Standard                      ✅
├── Pod Lifecycle                            ✅
├── Replica Strategy                         ✅
├── Labels / Selectors                       ✅
├── ClusterIP Service                        ✅
├── Service Discovery                        ✅
├── ConfigMap                                ✅
├── External Secrets                         ✅
├── Startup Probe                            ✅
├── Readiness Probe                          ✅
├── Liveness Probe                           ✅
├── Resource Requests                        ✅
├── Resource Limits                          ✅
├── JVM Headroom                             ✅
├── HPA / KEDA                               ✅
├── Cluster Autoscaler                       ✅
├── Node Pools                               ✅
├── Topology Spread                          ✅
├── Affinity / Taints                        ✅
├── PDB                                      ✅
├── Rolling Update                           ✅
├── Rollback                                 ✅
├── Graceful SIGTERM                         ✅
├── Jobs                                     ✅
├── CronJobs                                 ✅
├── Migration Job                            ✅
├── ServiceAccounts                          ✅
├── Workload Identity                        ✅
├── RBAC                                     ✅
├── ResourceQuota / LimitRange               ✅
├── PriorityClass                            ✅
├── Storage                                  ✅
├── StatefulSet Boundary                     ✅
├── SecurityContext                          ✅
├── Pod Security                             ✅
├── Init / Sidecars                          ✅
├── DNS                                      ✅
├── NetworkPolicy Baseline                   ✅
├── Manifest Standard                        ✅
├── Image / Registry Rules                   ✅
├── Debugging                                ✅
├── Central Logs                             ✅
├── Kubernetes Metrics                       ✅
├── Alerts / Runbooks                        ✅
├── Manifest Testing                         ✅
├── Rollout Testing                          ✅
├── Node Failure Testing                     ✅
├── Capacity Planning                        ✅
├── Tier Profiles                            ✅
├── GitOps Authority                         ✅
├── Audit / Break Glass                      ✅
├── Production Readiness                     ✅
└── Networking/Gateway/TLS Handoff           ✅
```

---

# 380. Handoff to Phase 26

The next official implementation phase is:

```text
PHASE 26 — Networking / Gateway / TLS
```

Phase 26 will define the traffic/trust boundary around these Kubernetes workloads:

```text
north-south traffic
east-west traffic
API Gateway
Ingress / Gateway API
DNS
TLS
certificate management
mTLS
service discovery
NetworkPolicy detail
egress controls
WAF
rate limiting
private endpoints
load balancers
CORS
security headers
timeouts
connection management
```

---

# 381. Kubernetes → Networking Boundary

Phase 25 defines:

```text
how workloads run
how Pods are scheduled/replaced
how Services identify workloads
how config/secrets/resources/health are managed
how availability/scaling/shutdown work
```

Phase 26 defines:

```text
how traffic reaches those workloads
how service-to-service traffic is controlled
how DNS/TLS/gateway/security boundaries are implemented
```

---

# 382. Final Phase 25 Principle

Standard microservice runtime:

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
Dedicated ServiceAccount
Least-Privilege RBAC
startup/readiness/liveness probes
explicit requests/limits
graceful SIGTERM
PDB
topology spread
HPA/capacity plan
NetworkPolicy
central observability
GitOps desired state
```

The most important rules are:

```text
Pods are disposable.
Durable business state stays outside Pods.
Kubernetes does not replace transactions, idempotency, Sagas, backup, or reconciliation.
Production is strongly isolated from non-production.
Namespace alone is not a complete security boundary.
Normal Spring Boot services use Deployment, not StatefulSet.
Internal service-to-service traffic uses ClusterIP Services.
Never call a Pod IP directly.
Configuration is version-controlled.
Secrets come from an approved external secret manager.
Private keys/certificates may be mounted as files.
startupProbe, readinessProbe, and livenessProbe have different meanings.
Liveness does not fail just because Redis, Kafka, or an external provider is temporarily unavailable.
Readiness fails only when the Pod cannot safely serve the operation it represents.
Every production workload has explicit resource requests.
JVM heap must leave native headroom below Pod memory limit.
Critical services are not BestEffort.
HPA scaling is bounded by DB, Kafka, Redis, and provider capacity.
Kafka workers cannot scale beyond useful partition parallelism.
Scale-down is stabilized to avoid churn and rebalances.
Critical replicas are spread across nodes/zones.
PDB protects voluntary disruption, not crashes.
Rolling updates require API/event/DB/cache compatibility.
Readiness protects traffic during rollout.
SIGTERM is handled gracefully.
Workers stop claiming new work before shutdown.
Kafka consumers do not commit unfinished work.
Forced termination is safe because durable recovery exists.
Jobs and CronJobs are idempotent.
Migration execution is explicit.
Every workload uses a dedicated ServiceAccount.
Workload identity is preferred to static cloud keys.
ServiceAccount token automount is disabled when unnecessary.
Kubernetes RBAC follows least privilege.
Normal app workloads run non-root.
Privilege escalation is disabled.
Root filesystem is read-only capable.
Linux capabilities are dropped.
Privileged/hostPath/hostNetwork workloads are rejected unless exceptional.
Most application services do not need PVCs.
Production aims for default-deny network policy and explicit allows.
External production egress is restricted.
Choose one manifest standard rather than per-team YAML style.
Use immutable image references, not latest.
GitOps is the production desired-state authority.
Direct laptop kubectl deployment is not normal production CD.
Central logs/metrics/traces outlive Pods.
Operators have runbooks for CrashLoop, Pending, OOM, readiness, DNS, Secret mounts, rollouts, and autoscaling.
STAGING tests node drain, rollout, rollback, probes, HPA, PDB, RBAC, NetworkPolicy, and shutdown.
Cluster capacity includes normal load, failure headroom, rollout surge, and autoscaling headroom.
Critical services maintain minimum capacity for sudden spikes because HPA/node scaling is not instant.
```

---

