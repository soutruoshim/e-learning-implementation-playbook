---
title: "Huawei Cloud CCE Production Setup"
description: "Production-style setup for deploying microservices on Huawei Cloud CCE using Terraform, Helm, and Argo CD."
---

# Huawei Cloud CCE Production Setup
## Terraform + Helm + Argo CD + GitLab CI + SWR + RDS

This document describes a production-style setup for deploying backend APIs and microservices on **Huawei Cloud CCE** using:

- Terraform
- Huawei Cloud CCE
- Helm
- Argo CD
- GitLab CI/CD
- Huawei SWR
- Huawei ELB
- Huawei RDS
- Huawei DEW / CSMS
- Huawei AOM / Prometheus
- Huawei LTS
- HPA and CCE Cluster Autoscaler

---

# 1. Target Architecture

```text
                           INTERNET
                              |
                              v
                     +----------------+
                     | DNS / Domain   |
                     +-------+--------+
                             |
                         HTTPS :443
                             |
                             v
                  +---------------------+
                  | Huawei Cloud ELB    |
                  | + TLS Certificate   |
                  +----------+----------+
                             |
                             v
+------------------------------------------------------+
|               Huawei Cloud VPC                      |
|                                                      |
|   +----------------------------------------------+   |
|   |                CCE Cluster                   |   |
|   |                                              |   |
|   |    +-----------+       +-----------+         |   |
|   |    | Worker 1  |       | Worker 2  | ...     |   |
|   |    |           |       |           |         |   |
|   |    | API Pods  |       | API Pods  |         |   |
|   |    +-----------+       +-----------+         |   |
|   |                                              |   |
|   |        Argo CD                               |   |
|   |        Monitoring                            |   |
|   |        Secrets Manager                       |   |
|   |        HPA                                   |   |
|   +----------------------------------------------+   |
|                 |                    |               |
|                 v                    v               |
|          +------------+        +----------+          |
|          | RDS MySQL  |        | Redis    |          |
|          | Private IP |        | / DCS    |          |
|          +------------+        +----------+          |
|                                                      |
+------------------------------------------------------+
                       ^
                       | images
                +--------------+
                |     SWR      |
                | Docker Image |
                | Registry     |
                +------+-------+
                       ^
                       | docker push
                +------+-------+
                |  GitLab CI   |
                +------+-------+
                       ^
                       |
                     Source
                       |
                  Application
                   Git Repo


Separate deployment repo
------------------------

GitOps Repo
   |
   | Helm values / charts
   v
Argo CD
   |
   | helm template
   v
CCE Kubernetes
```

---

# 2. Responsibility of Each Component

| Component | Responsibility |
|---|---|
| Terraform | Huawei Cloud infrastructure |
| CCE | Kubernetes platform |
| SWR | Docker image registry |
| Helm | Kubernetes application templates |
| Argo CD | GitOps deployment and synchronization |
| GitLab CI | Test, build, push image, update GitOps repo |
| ELB | External/internal traffic entry |
| RDS | Managed MySQL database |
| DEW / CSMS | Secrets and credentials |
| AOM / Prometheus | Metrics and monitoring |
| LTS | Centralized logging |

Important rule:

```text
Terraform should NOT deploy every application release.

GitLab CI should NOT normally run kubectl apply.

Argo CD should own Kubernetes application deployments.
```

---

# 3. CCE Standard vs CCE Turbo

Huawei Cloud provides:

```text
CCE Standard
CCE Turbo
CCE Autopilot
```

For a normal PHP/Laravel/API or microservices platform, start with:

```text
CCE Standard + VPC network
```

Use CCE Turbo only when you specifically need:

- Very high networking performance
- Pod-native VPC networking
- Direct ELB-to-pod forwarding
- Advanced cloud-native networking features

---

# 4. Infrastructure Layout

Recommended production layout:

```text
Huawei Cloud Account
|
+-- Region
    |
    +-- VPC
    |
    +-- CCE
    |   +-- System Node Pool
    |   +-- Application Node Pool
    |
    +-- SWR
    |
    +-- ELB
    |
    +-- RDS MySQL
    |
    +-- NAT Gateway
    |
    +-- DEW / CSMS
    |
    +-- AOM
    |
    +-- LTS
```

Keep **CCE and SWR in the same region** whenever possible.

---

# 5. Network Design

Network design should be planned before creating the CCE cluster.

Example:

```text
VPC
10.20.0.0/16

+-- cce-nodes-a
|   10.20.10.0/24
|
+-- cce-nodes-b
|   10.20.11.0/24
|
+-- database
|   10.20.20.0/24
|
+-- load-balancer
|   10.20.30.0/24
|
+-- management
    10.20.40.0/24
```

Plan carefully:

```text
VPC CIDR
Node subnet
Pod CIDR
Service CIDR
VPN CIDR
On-premise CIDR
Future VPC peering CIDRs
```

Avoid overlapping CIDRs.

---

# 6. Private CCE Nodes

Recommended:

```text
Internet
   |
   v
 ELB
   |
   v
Private CCE Nodes
```

Avoid exposing every worker node publicly.

For outbound Internet access:

```text
CCE Pods
    |
    v
NAT Gateway
    |
    v
EIP
    |
    v
Internet
```

---

# 7. Terraform Repository Structure

Recommended repository:

```text
brown-platform-infra/
|
+-- modules/
|   +-- network/
|   +-- cce/
|   +-- node-pool/
|   +-- elb/
|   +-- rds/
|   +-- nat/
|   +-- security/
|   +-- monitoring/
|
+-- environments/
    +-- dev/
    +-- staging/
    +-- prod/
```

Use separate Terraform state per environment:

```text
dev
  -> terraform state

staging
  -> terraform state

prod
  -> terraform state
```

Do not share one state between dev, staging, and prod.

---

# 8. Huawei Terraform Provider

Example:

```hcl
terraform {
  required_providers {
    huaweicloud = {
      source  = "huaweicloud/huaweicloud"
      version = "~> 1.94"
    }
  }
}
```

Provider:

```hcl
provider "huaweicloud" {
  region = var.region
}
```

Do not store credentials directly in Git.

Use environment variables or CI variables:

```text
HW_REGION_NAME
HW_ACCESS_KEY
HW_SECRET_KEY
```

---

# 9. Terraform VPC

Example:

```hcl
resource "huaweicloud_vpc" "main" {
  name = "brown-prod-vpc"
  cidr = "10.20.0.0/16"
}
```

Subnet:

```hcl
resource "huaweicloud_vpc_subnet" "cce_nodes" {
  name       = "brown-prod-cce"
  vpc_id     = huaweicloud_vpc.main.id
  cidr       = "10.20.10.0/24"
  gateway_ip = "10.20.10.1"
}
```

---

# 10. Terraform CCE Cluster

Example:

```hcl
resource "huaweicloud_cce_cluster" "main" {
  name = "brown-prod-cce"

  flavor_id = var.cluster_flavor

  cluster_type = "VirtualMachine"

  container_network_type = "vpc-router"

  vpc_id = huaweicloud_vpc.main.id

  subnet_id = huaweicloud_vpc_subnet.cce_nodes.id

  tags = {
    environment = "prod"
    managed_by  = "terraform"
  }
}
```

Common network options:

```text
overlay_l2 -> CCE Standard tunnel network

vpc-router -> CCE Standard VPC network

eni -> CCE Turbo Cloud Native Network 2.0
```

---

# 11. Node Pools

Recommended:

```text
CCE
|
+-- system-pool
|   +-- Node
|   +-- Node
|   +-- Node
|
+-- api-pool
    +-- Node
    +-- Node
    +-- Node
```

Example Terraform:

```hcl
resource "huaweicloud_cce_node_pool" "app" {
  cluster_id = huaweicloud_cce_cluster.main.id

  name = "app-pool"

  initial_node_count = 2

  flavor_id = var.node_flavor

  scale_enable = true
}
```

For production, spread nodes across multiple availability zones when possible.

---

# 12. HPA vs Cluster Autoscaler

## HPA

Controls the number of pods.

```text
2 pods
   |
   | traffic increases
   v
5 pods
   |
   v
8 pods
```

## CCE Cluster Autoscaler

Controls the number of nodes.

```text
3 nodes
   |
   | not enough capacity
   v
4 nodes
   |
   v
5 nodes
```

Together:

```text
Traffic increases
      |
      v
     HPA
      |
      v
More pods
      |
      v
Not enough CPU/RAM
      |
      v
Pods Pending
      |
      v
CCE Cluster Autoscaler
      |
      v
New Node
      |
      v
Pod Scheduled
```

---

# 13. SWR Container Registry

Use Huawei SWR for production images.

Example:

```text
swr.<region>.myhuaweicloud.com/brown/central-api:a8f43df
```

Recommended image tags:

```text
central-api:a8f43df
central-api:2026.10.15-84
```

Avoid:

```text
central-api:latest
```

Immutable image tags make rollback safer.

---

# 14. Application Repository

Example:

```text
central-api/
|
+-- app/
+-- routes/
+-- config/
+-- database/
+-- tests/
|
+-- Dockerfile
|
+-- .gitlab-ci.yml
```

Keep Terraform separate from application source code.

---

# 15. Helm Chart Repository

Example:

```text
brown-helm/
|
+-- central-api/
    |
    +-- Chart.yaml
    +-- values.yaml
    |
    +-- templates/
        +-- deployment.yaml
        +-- service.yaml
        +-- ingress.yaml
        +-- hpa.yaml
        +-- serviceaccount.yaml
        +-- configmap.yaml
```

---

# 16. Helm Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment

metadata:
  name: {{ include "central-api.fullname" . }}

spec:
  replicas: {{ .Values.replicaCount }}

  selector:
    matchLabels:
      app: central-api

  template:
    metadata:
      labels:
        app: central-api

    spec:
      containers:
        - name: central-api

          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"

          ports:
            - containerPort: 8080

          resources:
            requests:
              cpu: {{ .Values.resources.requests.cpu }}
              memory: {{ .Values.resources.requests.memory }}

            limits:
              cpu: {{ .Values.resources.limits.cpu }}
              memory: {{ .Values.resources.limits.memory }}
```

Values:

```yaml
image:
  repository: swr.<region>.myhuaweicloud.com/brown/central-api
  tag: a8f43df

replicaCount: 2

resources:
  requests:
    cpu: 250m
    memory: 256Mi

  limits:
    cpu: 1000m
    memory: 1Gi
```

---

# 17. GitOps Repository

Recommended:

```text
brown-gitops/
|
+-- applications/
|   +-- central-api.yaml
|   +-- payment-api.yaml
|   +-- loyalty-api.yaml
|
+-- environments/
    |
    +-- dev/
    |   +-- central-api-values.yaml
    |
    +-- staging/
    |   +-- central-api-values.yaml
    |
    +-- prod/
        +-- central-api-values.yaml
```

Production values:

```yaml
image:
  repository: swr.<region>.myhuaweicloud.com/brown/central-api
  tag: a8f43df

replicaCount: 3

environment: production
```

---

# 18. Install Argo CD

Recommended approach:

```bash
helm repo add argo https://argoproj.github.io/argo-helm

helm repo update
```

Install:

```bash
helm upgrade --install argocd \
  argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --version <PINNED_VERSION> \
  -f argocd-values.yaml
```

For production, pin a tested version.

---

# 19. Do Not Expose Argo CD Through Public NodePort

Recommended:

```text
Company VPN
    |
    v
Internal ELB
    |
    v
Argo CD
```

Avoid:

```text
Internet
    |
    v
CCE Node:31221
    |
    v
Argo CD Admin UI
```

---

# 20. Argo CD Application

Example:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application

metadata:
  name: central-api-prod
  namespace: argocd

spec:
  project: production

  source:
    repoURL: git@gitlab.com:company/brown-gitops.git

    targetRevision: main

    path: charts/central-api

    helm:
      valueFiles:
        - ../../environments/prod/central-api-values.yaml

  destination:
    server: https://kubernetes.default.svc
    namespace: central-api

  syncPolicy:
    automated:
      prune: true
      selfHeal: true

    syncOptions:
      - CreateNamespace=true
```

Argo CD owns the application lifecycle.

Helm renders the manifests.

---

# 21. GitLab CI Deployment Flow

```text
               git push
                   |
                   v
              GitLab CI
                   |
              +----+----+
              |         |
              v         v
           PHPUnit     Lint
              |
              v
         Docker build
              |
              v
           Push SWR
              |
              v
    central-api:a8f43df
              |
              v
        Update GitOps
              |
              v
             Git
              |
              v
           Argo CD
              |
              v
            Helm
              |
              v
             CCE
```

Once using Argo CD, GitLab CI should normally **not** run:

```bash
kubectl apply
```

Instead:

```text
GitLab CI
    |
    v
Update GitOps Repo
    |
    v
Argo CD
    |
    v
CCE
```

---

# 22. Example GitLab CI

```yaml
stages:
  - test
  - build
  - release

test:
  stage: test
  script:
    - composer install
    - php artisan test
```

Build:

```yaml
build:
  stage: build

  script:
    - docker login "$SWR_HOST" -u "$SWR_USER" -p "$SWR_PASSWORD"

    - docker build \
      -t "$SWR_HOST/brown/central-api:$CI_COMMIT_SHORT_SHA" \
      .

    - docker push \
      "$SWR_HOST/brown/central-api:$CI_COMMIT_SHORT_SHA"
```

Deployment stage updates:

```yaml
image:
  tag: a8f43df
```

inside the GitOps repository.

---

# 23. Environment Promotion

Recommended flow:

```text
DEV
 |
 v
Auto deploy
 |
 v
STAGING
 |
 v
Approval / Merge Request
 |
 v
PRODUCTION
```

Use the exact same built image for all environments.

Example:

```yaml
# dev
image:
  tag: a8f43df
```

Then:

```yaml
# staging
image:
  tag: a8f43df
```

Finally:

```yaml
# production
image:
  tag: a8f43df
```

Do not rebuild the image for production.

---

# 24. RDS Database

Recommended:

```text
CCE
 |
 | private network
 v
RDS MySQL
```

Avoid running production MySQL directly inside CCE unless you have a strong reason.

Example app configuration:

```text
DB_HOST=10.20.20.xxx
DB_PORT=3306
DB_DATABASE=central
DB_USERNAME=central_api
DB_PASSWORD=*****
```

Do not store DB passwords in Git.

---

# 25. Secrets Management

Avoid:

```yaml
env:
  - name: DB_PASSWORD
    value: "my-secret-password"
```

Also avoid:

```yaml
databasePassword: "password123"
```

Use:

```text
DEW
|
+-- CSMS
    |
    +-- database/password
    +-- jwt/private-key
    +-- payment/api-key
    +-- external/service-key
```

Architecture:

```text
DEW / CSMS
    |
    v
CCE Secrets Manager
    |
    v
Pod
    |
    +-- DB_PASSWORD
```

Git should reference a secret, not contain the secret itself.

---

# 26. Pod Identity

For access to Huawei Cloud APIs:

```text
Kubernetes ServiceAccount
         |
         v
     Pod Identity
         |
         v
     IAM Agency
         |
         v
 Huawei Cloud API
```

This is better than storing AK/SK inside containers.

Use it for services such as:

```text
OBS
SWR
DEW
Other Huawei Cloud APIs
```

---

# 27. Ingress

Recommended initial approach:

```text
CCE LoadBalancer Ingress + Dedicated ELB
```

Architecture:

```text
api.example.com
       |
       v
      DNS
       |
       v
 Dedicated ELB
       |
       v
 CCE LB Ingress
       |
       v
 central-api Service
       |
   +---+---+
   |       |
   v       v
 Pod       Pod
```

---

# 28. TLS

Use HTTPS:

```text
https://api.example.com
```

Traffic:

```text
Client
  |
  | HTTPS
  v
ELB
  |
  v
Ingress
  |
  v
Service
  |
  v
Pod
```

---

# 29. Health Checks

Recommended endpoints:

```text
/health/live
/health/ready
```

Liveness:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080

  initialDelaySeconds: 10
  periodSeconds: 10
```

Readiness:

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080

  initialDelaySeconds: 5
  periodSeconds: 5
```

Meaning:

```text
Liveness
"Should Kubernetes restart the container?"

Readiness
"Should this pod receive traffic?"
```

---

# 30. HPA Example

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler

metadata:
  name: central-api

spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: central-api

  minReplicas: 2
  maxReplicas: 10

  metrics:
    - type: Resource

      resource:
        name: cpu

        target:
          type: Utilization
          averageUtilization: 70
```

Example behavior:

```text
Normal load
2 pods

High CPU
4 pods

More load
7 pods

Very high load
10 pods
```

---

# 31. Monitoring

Architecture:

```text
CCE Pods
   |
   v
Prometheus
   |
   v
AOM
   |
   +-- dashboards
   +-- CPU alerts
   +-- memory alerts
   +-- restart alerts
   +-- availability alerts
```

Recommended alerts:

```text
Pod CrashLoopBackOff
Pod restart count
HTTP 5xx
CPU > 80%
Memory > 85%
Pods Pending
Node unavailable
Disk usage
HPA at maximum
RDS CPU
RDS connections
RDS storage
ELB 5xx
```

---

# 32. Logging

Recommended:

```text
Application
      |
      v
stdout / stderr
      |
      v
CCE Cloud Native Log Collection
      |
      v
LTS
```

For PHP/Laravel, prefer stdout/stderr logging instead of only:

```text
storage/logs/laravel.log
```

inside a temporary pod.

---

# 33. Persistent Storage

For normal APIs, remain stateless:

```text
API pods -> Stateless
```

Recommended data services:

```text
Uploads -> OBS
Database -> RDS
Cache -> DCS / Redis
```

Use EVS only when a workload genuinely requires mounted persistent disks.

---

# 34. Production Namespace Layout

Example:

```text
CCE PROD
|
+-- namespace: argocd
|   +-- Argo CD
|
+-- namespace: monitoring
|   +-- Monitoring agents
|
+-- namespace: central-api
|   +-- Deployment
|   +-- Service
|   +-- HPA
|   +-- ConfigMap
|
+-- namespace: loyalty-api
|
+-- namespace: campaign-api
|
+-- namespace: payment-api
|
+-- namespace: notification-api
```

Avoid putting everything in:

```text
default
```

---

# 35. Dev, Staging, and Production

Cost-conscious option:

```text
Huawei Cloud
|
+-- NON-PROD
|   |
|   +-- CCE Cluster
|       +-- dev namespace
|       +-- staging namespace
|
+-- PROD
    |
    +-- CCE Cluster
        +-- production
```

Higher isolation:

```text
Dev CCE

Staging CCE

Production CCE
```

At minimum, keep production separate from non-production.

---

# 36. Recommended Repository Separation

## 1. Application Repo

```text
central-api
```

Contains:

```text
PHP source
Dockerfile
Tests
GitLab CI
```

## 2. Infrastructure Repo

```text
brown-platform-infra
```

Contains:

```text
Terraform

VPC
CCE
Node pools
RDS
NAT
ELB
IAM
DEW
Monitoring resources
```

## 3. GitOps Repo

```text
brown-gitops
```

Contains:

```text
Helm configuration
Argo Applications
Dev values
Staging values
Prod values
```

---

# 37. Complete Request Flow

```text
Mobile App
    |
    | HTTPS
    v
api.example.com
    |
    v
Huawei ELB
    |
    v
CCE Ingress
    |
    v
Service
    |
    v
central-api Pod
    |
    +---------------> RDS MySQL
    |
    +---------------> Redis / DCS
    |
    +---------------> OBS
    |
    +---------------> Other APIs
```

---

# 38. Complete Deployment Flow

```text
Developer
    |
    | git push
    v
GitLab
    |
    v
GitLab CI
    |
    +-- composer install
    +-- lint
    +-- PHPUnit
    +-- security checks
    |
    v
Docker build
    |
    v
SWR
central-api:a8f43df
    |
    v
Update brown-gitops
    |
    v
Git commit
    |
    v
Argo CD detects change
    |
    v
Helm renders manifests
    |
    v
CCE
    |
    v
Rolling deployment
    |
    +-- old Pod
    +-- old Pod
    |
    v
    +-- new Pod
    +-- old Pod
    |
    v
    +-- new Pod
    +-- new Pod
    |
    v
Deployment Healthy
```

---

# 39. Terraform vs Argo Ownership Boundary

```text
              TERRAFORM
                  |
                  | creates
                  v
+--------------------------------+
| Huawei Cloud                   |
|                                |
| VPC                            |
| CCE                            |
| RDS                            |
| NAT                            |
| ELB                            |
| IAM                            |
+--------------------------------+

                 ^
                 | runs on
                 |
----------------------------------
             OWNERSHIP LINE
----------------------------------

                 |
                 | manages
                 v

               ARGO CD
                 |
                 v
+--------------------------------+
| Kubernetes                     |
|                                |
| Namespaces                     |
| Deployments                    |
| Services                       |
| Ingresses                      |
| ConfigMaps                     |
| HPA                            |
+--------------------------------+
```

Do not make Terraform and Argo manage the same Kubernetes Deployment.

---

# 40. Bootstrap Argo CD

Bootstrap flow:

```text
Terraform
    |
    v
Create CCE
    |
    v
Bootstrap Argo CD
    |
    v
Argo takes over
```

After bootstrap:

```text
Terraform
    |
    +-- Infrastructure only

Argo CD
    |
    +-- Kubernetes applications
```

---

# 41. Security Checklist

Recommended:

- Keep CCE worker nodes private
- Use NAT for outbound Internet access
- Use private CCE API access when possible
- Apply IAM least privilege
- Use Pod Identity instead of AK/SK inside containers
- Store DB credentials and API keys in DEW / CSMS
- Use private SWR repositories
- Keep RDS private
- Expose only ELB/public gateways
- Use HTTPS everywhere externally
- Set CPU and memory requests/limits
- Configure readiness and liveness probes
- Run at least two replicas for critical APIs
- Enable HPA
- Enable node autoscaling
- Send metrics to AOM / Prometheus
- Send logs to LTS
- Avoid routine production `kubectl apply` from developer laptops

---

# 42. Final Recommended Architecture

```text
                       USERS / MOBILE APP
                              |
                           HTTPS
                              |
                              v
                       Huawei DNS
                              |
                              v
                      Dedicated ELB
                              |
                              v
                     CCE LB Ingress
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
            central-api   loyalty-api  campaign-api
              Pods           Pods         Pods
                 |            |            |
                 +------------+------------+
                              |
                   +----------+----------+
                   |          |          |
                   v          v          v
                RDS        Redis/DCS    OBS


                       CCE PLATFORM
                 +---------------------+
                 | Argo CD             |
                 | HPA                 |
                 | Cluster Autoscaler  |
                 | Monitoring          |
                 | Log Collection      |
                 | DEW Secret Provider |
                 +---------------------+


DEPLOYMENT
--------------------------------------------

Developer
   |
   v
GitLab Source Repo
   |
   v
GitLab CI
   |
   +-- Test
   +-- Docker Build
   +-- Push
           |
           v
          SWR
           |
           | image:a8f43df
           v
      GitOps Repo
           |
           v
        Argo CD
           |
           v
          Helm
           |
           v
          CCE


INFRASTRUCTURE
--------------------------------------------

Terraform
   |
   +-- IAM
   +-- VPC
   +-- Subnets
   +-- NAT
   +-- CCE
   +-- Node Pools
   +-- ELB
   +-- RDS
   +-- DEW
   +-- Monitoring resources
```

---

# 43. Recommended Implementation Order

Implement in this order:

```text
1. Terraform
2. VPC
3. Subnets
4. CCE Cluster
5. Node Pools
6. NAT Gateway
7. SWR
8. RDS
9. ELB
10. Dockerize one API
11. Helm chart
12. Install Argo CD
13. Create GitOps repository
14. Configure GitLab CI
15. Configure DEW / CSMS secrets
16. Configure monitoring
17. Configure logging
18. Add HPA
19. Enable node autoscaling
20. Add more microservices
```

A strong starting architecture is:

```text
CCE Standard
+ VPC network
+ private worker nodes
+ dedicated ELB
+ SWR
+ RDS
+ GitLab CI
+ Helm
+ Argo CD
+ DEW / CSMS
+ AOM / LTS
```

This provides a clean separation between infrastructure, application packaging, deployment, secrets, monitoring, and application code.
