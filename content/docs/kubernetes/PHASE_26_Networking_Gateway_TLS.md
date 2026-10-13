---
title: "PHASE 26 — Networking / Gateway / TLS"
---

# PHASE 26 — Networking / Gateway / TLS

> **Purpose:** Define and implement the complete traffic, connectivity, gateway, DNS, TLS, certificate, service-to-service trust, egress-control, perimeter-protection, network observability, testing, and production-readiness standard for the microservices platform.
>
> **Previous Phase:** Phase 25 — Kubernetes
>
> **Next Phase:** Phase 27 — Observability
>
> **Primary Architecture Basis:** PART 30 — Networking / Gateway / TLS.
>
> **Primary Stack:** Kubernetes, API Gateway / Gateway API / Ingress, DNS, TLS, cert-manager, Service Discovery, NetworkPolicy, WAF, Load Balancers, mTLS, OAuth2/OIDC, Prometheus, OpenTelemetry.
>
> **Status:** Platform Architecture / Networking and Edge Security Implementation Specification

---

# 1. Phase 26 Goal

Define and implement the platform's traffic, trust, connectivity, edge-security, DNS, TLS, and external-networking model for Kubernetes-hosted microservices.

The network must be:

```text
secure
predictable
observable
least-privilege
resilient
environment-isolated
scalable
```

The implementation must avoid:

```text
flat trust
open production egress
direct public exposure of each microservice
implicit/infinite timeout behavior
shared production/non-production certificates
manual untracked DNS
```

---

# 2. Core Networking Principle

Every network path has:

```text
an owner
a trust boundary
a security policy
a timeout policy
an observable failure mode
```

No network path is considered complete merely because packets can flow.

---

# 3. Phase Boundary

Phase 25 defined how workloads run:

```text
Deployment
Pods
Services
ConfigMaps
Secrets
RBAC
NetworkPolicy baseline
```

Phase 26 defines:

```text
how traffic enters
how traffic moves between workloads
how traffic reaches external partners
how trust is established
how failures are bounded and observed
```

---

# 4. Source-Defined Open Decisions

PART 30 intentionally leaves several technology and policy selections open.

Approve these before production rather than inventing defaults:

```text
TBD_GATEWAY_PRODUCT
TBD_GATEWAY_API_VS_INGRESS
TBD_PUBLIC_ADMIN_PARTNER_GATEWAY_SEPARATION
TBD_DNS_PROVIDER
TBD_DNS_TTL_POLICY
TBD_DNSSEC_ADOPTION
TBD_CERTIFICATE_ISSUER
TBD_CERT_MANAGER_ADOPTION
TBD_TLS_TERMINATION_MODEL
TBD_EAST_WEST_TLS_MTLS_STRATEGY
TBD_SERVICE_MESH_ADOPTION
TBD_SPIFFE_SPIRE_ADOPTION
TBD_GATEWAY_TOKEN_FORWARD_EXCHANGE_STRATEGY
TBD_RATE_LIMIT_THRESHOLDS
TBD_WAF_PROVIDER_RULESETS
TBD_DDOS_PROVIDER_CONTROLS
TBD_REQUEST_BODY_HEADER_LIMITS
TBD_TIMEOUT_BUDGETS
TBD_RETRY_OWNERSHIP
TBD_CONNECTION_POOL_LIMITS
TBD_STATIC_EGRESS_IP_MODEL
TBD_FQDN_EGRESS_SUPPORT
TBD_NETWORKPOLICY_ENGINE
TBD_PRIVATE_ENDPOINT_STRATEGY
TBD_CANARY_ROUTING_TOOLING
TBD_TOPOLOGY_AWARE_ROUTING
```

Examples in PART 30 are illustrative unless explicitly stated as requirements.

---

# 5. Traffic Categories

The primary categories are:

```text
North-South
East-West
```

A third operationally important category is outbound partner traffic.

---

# 6. North-South Traffic

North-South traffic crosses the external platform boundary.

Examples:

```text
mobile app → API Gateway
browser/admin → admin gateway
partner webhook → integration ingress
```

---

# 7. East-West Traffic

East-West traffic occurs between services inside platform boundaries.

Examples:

```text
Order → Payment
Order → Inventory
Notification → internal provider adapter
```

Being inside Kubernetes does not automatically make a caller trusted.

---

# 8. Outbound Partner Traffic

Partner traffic leaves the platform through controlled egress.

Examples:

```text
Payment → PSP
Integration → ERP
Integration → Delivery Provider
Integration → Top-Up Provider
```

---

# 9. Approved Public Edge

Expose only:

```text
approved public APIs
approved webhook endpoints
approved public static content
```

Everything else remains private unless a documented business need exists.

---

# 10. Internal Service Privacy

Internal microservices normally remain:

```text
private
non-public
ClusterIP/internal DNS only
```

Do not create a public LoadBalancer for every microservice.

---

# 11. Standard Public Request Flow

```text
Client
  ↓
DNS
  ↓
DDoS / WAF
  ↓
Load Balancer
  ↓
API Gateway
  ↓
JWT / Rate Limit / Routing
  ↓
Kubernetes Service
  ↓
Application Pod
```

---

# 12. Standard Internal Request Flow

```text
Order Service
  ↓
Service DNS
  ↓
NetworkPolicy
  ↓
TLS / mTLS
  ↓
Service Authentication
  ↓
Payment Service
```

---

# 13. Standard Partner Outbound Flow

```text
Integration / Payment Service
  ↓
Egress Policy
  ↓
NAT / Egress Gateway
  ↓
TLS / mTLS
  ↓
Partner API
```

---

# 14. Standard Webhook Inbound Flow

```text
Partner
  ↓
Public DNS
  ↓
WAF / Gateway
  ↓
mTLS / Signature Boundary
  ↓
Integration Webhook Endpoint
  ↓
Verify + Dedupe
  ↓
Async Processing
```

---

# 15. API Gateway Responsibilities

The gateway owns edge concerns such as:

```text
public request routing
authentication enforcement
coarse authorization
request normalization
rate limiting
security headers
request-size limits
correlation IDs
access logs
```

---

# 16. API Gateway Non-Responsibilities

The gateway does **not** own domain behavior such as:

```text
Order business rules
Wallet balance logic
Promotion eligibility
Mission progress
Payment state transitions
```

Those stay inside the relevant domain service.

---

# 17. Gateway as Policy Enforcement Point

The gateway may enforce before forwarding:

```text
JWT validation
issuer/audience checks
route scopes
rate limits
CORS
approved headers
request/body limits
```

---

# 18. Defense in Depth

Backend services still enforce:

```text
resource ownership
fine-grained authorization
domain/business permissions
```

A request passing gateway authentication does not mean every backend operation is authorized.

---

# 19. Gateway Technology Options

PART 30 lists possible technologies such as:

```text
Kubernetes Gateway API controller
NGINX Ingress
Envoy Gateway
Kong
Traefik
cloud API Gateway
cloud ALB/Application Gateway
```

Select one primary platform standard.

---

# 20. Gateway Selection Criteria

Evaluate:

```text
Kubernetes integration
TLS
WAF support
rate limiting
JWT/OIDC
observability
gRPC
WebSocket
mTLS
operational maturity
cost
```

---

# 21. Gateway API

Modern Kubernetes Gateway API provides role-separated resources such as:

```text
GatewayClass
Gateway
HTTPRoute
GRPCRoute
TLSRoute
```

---

# 22. Gateway API Preference

Prefer Gateway API when the selected controller supports all required capabilities maturely.

Otherwise use the approved Ingress standard.

---

# 23. GatewayClass Ownership

Platform team owns:

```text
GatewayClass
```

because it represents shared infrastructure/controller behavior.

---

# 24. Gateway Ownership

An environment/team may own a `Gateway` within platform-approved boundaries.

---

# 25. HTTPRoute Ownership

Application/service teams may define reviewed routes describing:

```text
host
path
backend
filters
methods
```

through GitOps.

---

# 26. Route Ownership Metadata

Every external route has:

```text
service owner
security owner
authentication requirement
rate-limit policy
timeout
CORS policy if relevant
```

---

# 27. Public API Hostnames

Example pattern:

```text
api.dev.example.com
api.uat.example.com
api.staging.example.com
api.example.com
```

Exact company domains remain organization-specific.

---

# 28. Admin Hostname Separation

Admin APIs may use a separate hostname or private internal domain.

Example:

```text
admin-api.example.com
```

---

# 29. Webhook Hostname Separation

Partner webhook traffic may use a dedicated hostname such as:

```text
hooks.example.com
```

when separation improves:

```text
WAF policy
mTLS
rate limiting
ownership
blast radius
```

---

# 30. Multi-Domain Gateway

A gateway may serve:

```text
public API
admin API
partner hooks
```

with distinct policies, or high-risk traffic may use separate gateways.

---

# 31. Gateway Isolation

For high-risk administrative or partner traffic, a separate gateway can reduce blast radius.

---

# 32. Public vs Admin Gateway

Possible model:

```text
public gateway
internal/admin gateway
partner gateway (optional)
```

The exact split is a policy decision.

---

# 33. Admin Gateway Access

Possible controls include:

```text
VPN
Zero Trust access proxy
SSO
IP allowlist
mTLS
```

depending platform/security requirements.

---

# 34. Partner Gateway Policy

A partner gateway may enforce:

```text
mTLS
HMAC/signature verification boundary
partner-specific rate limit
IP allowlist
request-size policy
```

---

# 35. Gateway Routing Dimensions

Routes may match on:

```text
host
path
method
headers
```

---

# 36. Path Routing Example

Illustrative:

```text
/api/v1/auth/*     → identity-service
/api/v1/orders/*   → order-service
/api/v1/wallet/*   → wallet-service
```

---

# 37. Route Versioning

API version remains part of the public contract.

The gateway must not hide a breaking backend change behind an unchanged route.

---

# 38. Route Rewriting

Use path rewrites sparingly.

Transparent routing is easier to troubleshoot and reason about.

---

# 39. Gateway Request Transformation

Acceptable examples:

```text
header normalization
path-version mapping
forwarded-header normalization
```

Do not embed domain business logic.

---

# 40. Response Transformation

Use sparingly.

Backend API contracts should remain explicit rather than relying on large opaque gateway transformations.

---

# 41. Protocol Translation

REST ↔ gRPC translation may be done at the gateway only if standardized and observable.

Complex provider/proprietary translation belongs in Integration Service.

---

# 42. API Aggregation

Do not allow the gateway to evolve accidentally into a large backend-for-frontend.

If a BFF is needed, treat it as an explicit application boundary.

---

# 43. Header Injection

The gateway may inject/normalize:

```text
X-Request-Id
X-Correlation-Id
X-Forwarded-For
X-Forwarded-Proto
```

---

# 44. Forwarded Header Trust Boundary

Backends trust forwarding headers only when they originate from approved gateway/proxy infrastructure.

---

# 45. Spoofed Forwarded Headers

The gateway should overwrite or normalize external forwarding headers to prevent client spoofing.

---

# 46. Client IP

If client IP is used for:

```text
rate limiting
audit
security
```

derive it through trusted proxy-chain logic, not raw arbitrary headers.

---

# 47. Correlation ID

Gateway creates one if missing and propagates it across:

```text
HTTP
gRPC
Kafka
```

---

# 48. Request ID vs Correlation ID

Request ID may represent one HTTP request.

Correlation ID may span a larger business workflow.

---

# 49. Internal Header Sanitization

Remove externally supplied internal-only identity/routing headers before forwarding.

---

# 50. Header-Only Identity Anti-Pattern

Never trust plain client-supplied:

```text
X-User-Id
```

as identity.

If internal headers are used, trust only authenticated gateway/service infrastructure and preferably signed token context.

---

# 51. Kubernetes Internal DNS

Kubernetes internal discovery uses service DNS such as:

```text
payment-service.platform-prod.svc.cluster.local
```

Within the same namespace:

```text
payment-service
```

is normally sufficient.

---

# 52. Cross-Namespace Service DNS

Use:

```text
service.namespace
```

or the FQDN for explicit cross-namespace calls.

---

# 53. No IP-Based Service Configuration

Do not place Kubernetes Pod/service IPs directly in application configuration.

Use DNS/service discovery.

---

# 54. External DNS

Use the authoritative DNS provider and manage records through:

```text
Terraform
ExternalDNS
GitOps/IaC
```

---

# 55. DNS as Code

Public and private DNS records should be declarative.

Manual production DNS is an emergency exception, not normal operation.

---

# 56. DNS TTL

Select TTL based on:

```text
failover requirement
load-balancer stability
DNS query volume
provider behavior
```

---

# 57. DNS TTL Tradeoff

Low TTL:

```text
faster propagation/failover
more DNS queries
```

High TTL:

```text
lower query load
slower propagation
```

---

# 58. DNS Failover

If DR/multi-region routing uses DNS, test:

```text
health checks
weighted/failover policy
TTL behavior
resolver/client caching
```

---

# 59. Split-Horizon DNS

Public and private DNS views may differ when internal-only endpoints must remain non-public.

---

# 60. DNS Security

Protect:

```text
zone changes
registrar account
DNS API credentials
```

using MFA, RBAC, and audit.

---

# 61. DNSSEC

Consider DNSSEC for public-domain integrity where provider support and operational maturity justify it.

---

# 62. DNS Resolution Failure

Clients should:

```text
retry in a bounded way
fail inside the request deadline
recover after DNS returns
```

---

# 63. DNS Caching

Use sane JVM/client caching.

Too little caching can create DNS storms; too-long negative caching can delay recovery after NXDOMAIN.

---

# 64. TLS Purpose

TLS provides:

```text
confidentiality
integrity
server identity
```

---

# 65. External TLS Baseline

Production public traffic uses:

```text
HTTPS/TLS only
```

---

# 66. HTTP Port 80

Public HTTP may:

```text
redirect 80 → 443
```

or be disabled entirely.

---

# 67. TLS Version

Source baseline:

```text
TLS 1.2+
```

with TLS 1.3 where supported.

Obsolete protocols are disabled.

---

# 68. Cipher Suites

Use an organization/cloud/gateway-approved modern cipher policy.

Do not invent custom weak compatibility ciphers.

---

# 69. Certificate Management

Certificates must be:

```text
automated
rotated
monitored
```

---

# 70. cert-manager

Where Kubernetes manages certificates, `cert-manager` may automate:

```text
ACME/public certificate requests
internal CA certificates
renewal
```

---

# 71. Certificate Authorities

Possible issuers:

```text
public CA
enterprise/private CA
cloud certificate manager
service mesh CA
```

depending endpoint purpose.

---

# 72. Public Certificates

Public API/admin/webhook domains normally use publicly trusted certificates unless the endpoint is private-only.

---

# 73. Internal Certificates

Internal TLS/mTLS may use:

```text
private CA
service-mesh CA
cloud workload identity certificate
```

---

# 74. Certificate Ownership

Every certificate record includes:

```text
domain/SANs
environment
owner
issuer
renewal path
secret reference
expiry/alert
```

---

# 75. Certificate Environment Separation

Never reuse the production private key in DEV/UAT.

---

# 76. Wildcard Certificate

Wildcard certificates can simplify management but increase blast radius.

Use intentionally rather than by default.

---

# 77. Dedicated Certificates

Sensitive admin/partner endpoints may benefit from dedicated certificates.

---

# 78. Private-Key Protection

Store certificate private keys through the approved secret/certificate management path with least privilege.

---

# 79. Certificate Renewal Monitoring

Monitor:

```text
days to expiry
renewal attempts
issuer/challenge failures
```

---

# 80. Expiry Alerting

Alert with sufficient renewal buffer.

PART 30 gives examples such as:

```text
30 days
14 days
7 days
```

but exact thresholds depend on automation policy.

---

# 81. Certificate Renewal Test

Rehearse certificate renewal in non-production.

---

# 82. TLS Termination Locations

Possible termination points include:

```text
cloud load balancer
Gateway
Ingress controller
service-mesh proxy
application
```

---

# 83. External TLS Termination Recommendation

Public TLS normally terminates at the approved Gateway/load balancer, optionally followed by internal re-encryption.

---

# 84. TLS Re-Encryption

Gateway → backend may use:

```text
HTTPS
mTLS
```

when internal transport requirements demand it.

---

# 85. End-to-End TLS

May be required for stricter compliance or shared/untrusted network boundaries.

---

# 86. TLS Verification

Clients validate:

```text
certificate chain
hostname
expiry
```

Do not weaken verification to make connectivity easier.

---

# 87. Never Disable TLS Verification

Production must never use equivalents of:

```text
trustAll
verify=false
skip hostname verification
```

---

# 88. Custom CA Trust

When private CAs are needed, inject the approved CA trust explicitly.

---

# 89. Certificate Pinning

Client/mobile certificate pinning may improve security but complicates certificate rotation.

Adopt only with a robust rotation/recovery plan.

---

# 90. mTLS

Mutual TLS authenticates both transport endpoints.

Useful for:

```text
service-to-service identity
partner callbacks
sensitive admin paths
```

---

# 91. Internal mTLS Options

Possible mechanisms:

```text
service mesh
SPIFFE/SPIRE
cloud workload identity
custom PKI
```

---

# 92. mTLS Is Not Authorization

mTLS proves:

```text
workload / transport identity
```

It does not replace:

```text
resource authorization
scope checks
role checks
domain permissions
```

---

# 93. Service Mesh Tradeoff

A mesh can simplify certificate issuance, rotation, policy, and telemetry but adds:

```text
resource cost
latency
control-plane complexity
data-plane complexity
operational ownership
```

Do not adopt only because it is fashionable.

---

# 94. Partner mTLS

When a partner requires a client certificate, the responsible Integration/Payment adapter owns:

```text
client certificate
private key
trusted CA
rotation
```

through the approved secret manager.

---

# 95. Webhook Authentication Options

Inbound partner webhooks may use:

```text
HMAC
RSA signature
mTLS
```

or a combination.

Do not rely only on IP allowlisting where stronger identity exists.

---

# 96. East-West TLS Strategy

Source-supported models include:

```text
private-network plaintext + strong controls
library-managed TLS
service-mesh mTLS
```

Security requirements determine the chosen target.

---

# 97. Mature East-West Strategy

For a mature production zero-trust model:

```text
TLS or mTLS
+
workload identity
```

is preferred.

---

# 98. Plaintext Internal Exception

If plaintext is temporarily allowed internally, still require:

```text
private network
NetworkPolicy
service authentication
documented migration path to TLS/mTLS
```

---

# 99. Kafka TLS

Production Kafka clients use TLS plus authentication.

---

# 100. PostgreSQL TLS

Use full certificate/hostname verification where supported, for example:

```text
sslmode=verify-full
```

or the managed-service equivalent.

---

# 101. Redis TLS

Use TLS where supported and required by security architecture.

---

# 102. External Provider TLS

Always validate external HTTPS provider certificates.

---

# 103. Certificate Rotation Without Platform Outage

Internal leaf-certificate rotation should not require a full platform outage.

---

# 104. Dual Trust Window

CA/certificate rotation may use:

```text
trust old + new
issue new
move workloads
remove old
```

when necessary.

---

# 105. CA Rotation

CA rotation is more complex than leaf-certificate rotation and must be rehearsed.

---

# 106. Service Identity

Possible workload identities include:

```text
SPIFFE ID
Kubernetes ServiceAccount
cloud workload identity
```

---

# 107. SPIFFE Example

If adopted:

```text
spiffe://trust-domain/ns/prod/sa/order-service
```

can represent a workload identity.

---

# 108. Authorization by Workload Identity

An internal service may authorize a specific caller capability such as:

```text
order-service may invoke reserve-payment
```

based on authenticated workload identity/claims.

---

# 109. Gateway Authentication

Protected public routes validate:

```text
JWT signature
issuer
audience
expiry
```

at the gateway.

---

# 110. JWKS Cache

The gateway caches trusted public keys.

An unknown `kid` should trigger controlled JWKS refresh.

---

# 111. Gateway Authorization

The gateway may enforce coarse:

```text
route permission
scope
```

checks.

---

# 112. Service Authorization

The backend still validates:

```text
customer/resource ownership
role
business permission
domain constraints
```

---

# 113. Anonymous Public Routes

Endpoints such as login, password-reset request, or selected public catalog routes may be anonymous but still need abuse/rate-limit controls.

---

# 114. Internal API Authentication

Internal calls use one or more approved identity mechanisms such as:

```text
service identity token
mTLS
OAuth2 client credentials
```

---

# 115. Trust-on-Network Anti-Pattern

Never assume:

```text
inside cluster = trusted
```

---

# 116. Zero-Trust Service Call

Every service call should have:

```text
authenticated caller
authorized operation
encrypted transport where required
```

---

# 117. Gateway Token Forwarding

Possible models include:

```text
forward end-user token
exchange token
issue internal token
```

according to Identity/security architecture.

---

# 118. Token Exchange

Token exchange can reduce how broadly an external user token is exposed internally if the Identity platform supports it.

---

# 119. Internal User Context

Where required, propagate trusted context such as:

```text
user_id
scopes
roles
correlation_id
```

inside a signed/verified token or equivalent context.

---

# 120. Service Token Audience

Internal tokens should target a specific audience where possible.

---

# 121. Gateway Rate Limiting

Possible keys:

```text
IP
user
API client
device
route
```

---

# 122. Rate-Limit Layers

Possible enforcement layers:

```text
WAF/gateway
application
Redis-backed security controls
external-provider quota management
```

Each layer solves a different problem.

---

# 123. Gateway Rate-Limit Purpose

Gateway limits protect:

```text
edge/platform capacity
abuse-prone routes
```

---

# 124. Application Rate-Limit Purpose

Application limits protect:

```text
business identity
security workflows
domain-specific rules
```

---

# 125. Anonymous Endpoint Protection

Login, password reset, signup, coupon validation, and similar anonymous endpoints usually need stricter abuse controls.

---

# 126. Distributed Rate Limiting

A gateway fleet may use:

```text
shared Redis
gateway-native distributed store
```

when globally consistent rate limits are required.

---

# 127. Local Token Bucket

Per-gateway local limiting may be acceptable for coarse edge protection when exact global enforcement is unnecessary.

---

# 128. Rate-Limit Response

Return:

```text
429 Too Many Requests
```

with a stable application error code and `Retry-After` where appropriate.

---

# 129. WAF Purpose

WAF can protect public surfaces against:

```text
known exploit patterns
bots
malformed traffic
IP reputation abuse
```

---

# 130. WAF Position

Typical:

```text
Internet
  ↓
CDN / WAF / DDoS
  ↓
Load Balancer / Gateway
```

---

# 131. WAF Is Not Application Security

WAF does not replace:

```text
input validation
authorization
parameterized SQL
application rate limiting
```

---

# 132. Managed WAF Rules

Start with managed rule sets and tune them for the platform.

---

# 133. WAF False-Positive Rollout

Use count/log mode before aggressive blocking for new rules when possible.

---

# 134. WAF Exception Governance

Every exception records:

```text
rule
path
reason
owner
expiry
```

---

# 135. Bot Protection

May be appropriate for abuse-prone routes such as login, signup, coupon validation, or public API operations.

---

# 136. DDoS Protection

Use provider/cloud edge DDoS protections appropriate to risk.

Application rate limiting alone cannot absorb a large volumetric attack.

---

# 137. Request Size Limits

Define bounded limits for:

```text
JSON body
multipart/file upload
headers
URI length
```

---

# 138. Large Upload Strategy

Prefer direct object-storage upload or a dedicated upload path for very large files.

Do not route multi-GB payloads through ordinary API paths without a reason.

---

# 139. Header Size Limits

Protect against oversized:

```text
cookies
JWTs
custom headers
```

---

# 140. Path Normalization

Normalize or reject suspicious paths such as:

```text
double slashes
../
encoded traversal
```

as supported by the gateway.

---

# 141. HTTP Method Restriction

Expose only methods a route actually supports.

`TRACE` is normally disabled.

---

# 142. Content-Type Validation

Require expected content types such as `application/json` where appropriate.

---

# 143. Request Decompression Safety

Protect against decompression bombs using post-decompression size controls where supported.

---

# 144. CORS

CORS is a browser policy, not an API authentication mechanism.

---

# 145. CORS Policy

Allow only approved:

```text
origins
methods
headers
```

---

# 146. Wildcard CORS

Do not use:

```text
Access-Control-Allow-Origin: *
```

with credentialed authenticated browser APIs.

---

# 147. Credentialed CORS

When credentials are allowed, the origin must be explicit.

---

# 148. CORS Preflight

Handle browser `OPTIONS` preflight correctly.

---

# 149. Environment-Specific CORS

DEV may allow specific localhost origins.

PROD allows only approved production web origins.

---

# 150. Mobile CORS

Native mobile applications are not browser CORS clients.

CORS must not be treated as mobile API security.

---

# 151. Security Headers

Gateway may set, where appropriate:

```text
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Content-Security-Policy
```

---

# 152. HSTS

Use HSTS for production HTTPS domains with deliberate subdomain/preload choices.

---

# 153. nosniff

Recommended:

```text
X-Content-Type-Options: nosniff
```

---

# 154. Frame Protection

For browser/admin applications, prefer CSP `frame-ancestors` controls.

---

# 155. Content Security Policy

CSP matters primarily for browser frontends/admin sites; plain JSON APIs need less CSP-specific behavior.

---

# 156. Sensitive Cache-Control

Sensitive/customer responses may require:

```text
Cache-Control: no-store
```

---

# 157. Public API Caching

Public catalog/configuration reads may use explicit cache semantics such as:

```text
Cache-Control
ETag
```

---

# 158. No Shared Cache for Private Data

Do not accidentally shared-cache:

```text
customer profile
wallet
order
personalized responses
```

---

# 159. Compression

Compress sufficiently large text/JSON responses according to gateway/client support.

---

# 160. Compression Security

Avoid unsafe compression of highly sensitive reflective secret content where compression side-channel risk is relevant.

---

# 161. Request Timeout Principle

Every synchronous route has a bounded timeout.

No request may consume unlimited time.

---

# 162. Timeout Hierarchy

Principle:

```text
Client Timeout
>
Gateway Timeout
>
Service Downstream Timeout
```

with margin for error handling and response propagation.

---

# 163. Timeout Budget

Every synchronous call path documents:

```text
connect timeout
read timeout
overall deadline
retry budget
```

---

# 164. Deadline Propagation

Where practical, propagate the remaining deadline to downstream calls.

---

# 165. Connect Timeout

Bounds TCP/TLS connection establishment.

---

# 166. Read Timeout

Bounds waiting for the remote response.

---

# 167. Overall Deadline

Bounds the entire operation including retries and subcalls.

---

# 168. Gateway Error Semantics

Common infrastructure meanings:

```text
502 → upstream protocol/connection error
503 → upstream unavailable/no healthy backend/circuit protection
504 → upstream timeout
```

Application-specific canonical error contracts still apply.

---

# 169. Financial Timeout Semantics

For a mutating payment/financial operation:

```text
timeout != confirmed business failure
```

The domain may need an `UNKNOWN`/reconciliation state.

---

# 170. Gateway Retry Policy

Do not blindly retry non-idempotent POST requests.

---

# 171. Safe Gateway Retry

Potentially safe candidates include:

```text
GET
HEAD
explicitly idempotent internal operations
```

under bounded policy.

---

# 172. POST Retry

Only allow when:

```text
idempotency key
+
backend contract
```

makes replay safe.

---

# 173. Retry Multiplication

Avoid:

```text
client retries
× gateway retries
× service retries
× SDK retries
```

which can create an exponential retry storm.

---

# 174. Retry Budget

For each path define:

```text
which layer retries
maximum attempts
backoff
deadline
idempotency requirement
```

---

# 175. Connection Pooling

Reuse outbound connections rather than creating a new TCP/TLS connection per request.

---

# 176. HTTP Keepalive

Keepalive reduces:

```text
TCP handshake overhead
TLS handshake overhead
latency
CPU
```

---

# 177. Connection Pool Limits

Bound:

```text
total connections
per-host connections
pending acquisition queue
```

---

# 178. Pool Exhaustion

Fail with a bounded error rather than waiting indefinitely for a connection.

---

# 179. Idle Connection Timeout

Close stale idle connections at a reasonable interval that aligns with upstream/load-balancer behavior.

---

# 180. Connection Max Lifetime

A maximum lifetime can reduce stale endpoint issues after DNS/load-balancer changes.

---

# 181. HTTP/2

Useful for:

```text
gRPC
multiplexing
reduced connection count
```

---

# 182. Gateway HTTP/2 Support

Validate required combinations such as:

```text
client HTTP/2
backend h2
backend h2c
backend mTLS
```

---

# 183. gRPC Routing

Use `GRPCRoute` or the gateway-specific gRPC routing mechanism.

---

# 184. gRPC Deadlines

Every gRPC client call should use a deadline.

---

# 185. gRPC Load Balancing

Long-lived channels may require approved client-side balancing, service mesh, or other strategy for even Pod distribution.

---

# 186. Long-Lived Connections

WebSocket/SSE designs must account for:

```text
gateway idle timeouts
connection limits
autoscaling
draining
```

---

# 187. Keepalive Tuning

Balance:

```text
connection reuse
NAT/load-balancer idle timeout
resource usage
endpoint churn
```

---

# 188. Load Balancer Architecture

An external managed load balancer normally fronts the gateway/ingress layer.

---

# 189. L4 vs L7

L4:

```text
TCP
```

L7:

```text
HTTP routing
TLS
headers
WAF integration
```

---

# 190. Managed Load Balancer Preference

Use managed load balancing where it fits the platform model.

---

# 191. Internal Load Balancer

May be used for:

```text
private admin endpoints
private shared services
```

where required.

---

# 192. Load Balancer Health Check

Normally target gateway health rather than probing every backend independently.

---

# 193. Source IP Preservation

Enable/preserve client IP only when security, rate-limit, or audit requirements need it.

---

# 194. Proxy Protocol

May be used where LB/gateway support requires it.

Configure carefully to prevent spoofing/trust mistakes.

---

# 195. Forwarded Headers

Common:

```text
X-Forwarded-For
X-Forwarded-Proto
X-Forwarded-Host
```

Trust them only from approved infrastructure.

---

# 196. Host Header Validation

Gateway routes only approved hosts and rejects unexpected Host values.

---

# 197. SNI

TLS routing can use Server Name Indication to support multiple domains/certificates.

---

# 198. NetworkPolicy Purpose

Kubernetes NetworkPolicy controls permitted:

```text
Pod ingress
Pod egress
```

---

# 199. Default-Deny Baseline

Recommended production model:

```text
deny all ingress
deny all egress
```

then explicitly allow required flows.

---

# 200. DNS Allow Rule

A default-deny egress policy must still allow DNS resolution.

---

# 201. Gateway-to-Service Rule

Allow only the approved gateway namespace/workload to reach the public API service port.

---

# 202. Service-to-Service Rule

Example:

```text
order-service
→ payment-service:grpc
```

only when required by the architecture contract.

---

# 203. Service-to-Database Rule

Example:

```text
order-service
→ order_db endpoint
```

where network enforcement is possible.

---

# 204. Database Ownership at Network Layer

Reinforce service data ownership.

For example Order should not have network access to:

```text
wallet DB
payment DB
```

---

# 205. Kafka Network Rule

Only services that publish/consume Kafka should reach broker ports, with broker ACLs providing an additional layer.

---

# 206. Redis Network Rule

Only workloads that actually use Redis receive network access.

---

# 207. Observability Egress

Allow required destinations such as:

```text
OTel Collector
Prometheus scrape/remote write path
logging endpoints
```

according to architecture.

---

# 208. Secret-Manager Egress

If workloads fetch secrets directly, permit only the approved secret endpoint.

---

# 209. NetworkPolicy Engine

Possible implementations include:

```text
Cilium
Calico
cloud CNI
```

Capabilities such as FQDN policy and flow visibility vary by implementation.

---

# 210. NetworkPolicy Positive and Negative Tests

Verify both:

```text
required flow succeeds
forbidden flow fails
```

A policy is not validated by positive connectivity tests alone.

---

# 211. Policy Drift

Manage NetworkPolicies declaratively through GitOps.

---

# 212. External Partner Egress

Allow approved partner destinations only from the services that need them.

Examples:

```text
payment provider
ERP
delivery
top-up
SMS/email provider
```

---

# 213. Egress Gateway

A service mesh/cloud networking layer may provide a central egress gateway for controlled external access.

---

# 214. Egress Proxy

An HTTP CONNECT or equivalent proxy is another possible mechanism for logging and allowlisting.

---

# 215. Static Egress IP

When a partner requires source-IP allowlisting, provide a stable IP using:

```text
NAT Gateway
egress gateway
```

---

# 216. Egress IP Ownership

Track egress IPs separately by environment.

---

# 217. Partner Allowlist Change

Treat partner allowlist/source-IP changes as reviewed network/release changes.

---

# 218. FQDN Egress Policy

Standard Kubernetes NetworkPolicy usually works with IP/CIDR rather than FQDN.

Advanced CNI/service-mesh features may support FQDN policy for SaaS endpoints with changing IPs.

---

# 219. Network Segmentation

Logically separate:

```text
public edge
application
data
observability
admin
```

---

# 220. Cloud Network

Typical controls include:

```text
VPC/VNet
public/private subnets
security groups/firewalls
NAT
private endpoints
```

---

# 221. Public Subnet

Public subnet typically hosts the public load-balancer edge, not databases.

---

# 222. Private Subnet

Where supported, private networking hosts:

```text
Kubernetes nodes
databases
Redis
Kafka
```

---

# 223. Database Public Access

Disable public database endpoints unless there is an explicit exceptional requirement.

---

# 224. Redis Public Access

Disable.

---

# 225. Kafka Public Access

Prefer private networking.

External Kafka access requires a strong business justification and strong authentication/security.

---

# 226. Private Endpoints

Use provider private endpoints/PrivateLink/Private Service Connect or equivalent where beneficial to keep managed-service traffic off the public internet.

---

# 227. Operator Private Access

Operators/admins reach private systems through approved mechanisms such as:

```text
VPN
ZTNA
bastion
```

---

# 228. Bastion Security

If used:

```text
restricted
MFA
audited
no shared accounts
```

---

# 229. SSH to Kubernetes Nodes

Generally unnecessary for normal managed-Kubernetes operations.

---

# 230. Production Open Egress Prohibition

Production workloads should not have arbitrary unrestricted internet access when policy can constrain them.

---

# 231. Service Discovery

Use Kubernetes Service DNS as the primary discovery mechanism.

---

# 232. Avoid Redundant Service Registry

Do not add Eureka/Consul solely to rediscover Kubernetes Services unless additional requirements justify the complexity.

---

# 233. Service Endpoint Churn

Clients tolerate:

```text
connection resets
DNS changes
Pod replacement
rolling updates
```

---

# 234. Circuit Breaker

Use application/client-layer circuit breakers for unstable dependencies.

Gateway-level protection can supplement but should not hide business-specific semantics.

---

# 235. Health-Based Routing

Only ready Kubernetes Pods receive Service traffic.

---

# 236. Weighted Routing

Can support:

```text
canary
A/B
migration
```

---

# 237. Canary Routing

Possible selection dimensions:

```text
percentage
header
customer cohort
```

subject to privacy/security/operational policy.

---

# 238. Sticky Sessions

Avoid for stateless microservices.

---

# 239. Session Affinity Exception

If temporarily required, it must be:

```text
explicit
documented
temporary
```

because sticky sessions can create uneven load and hide statefulness.

---

# 240. Stateless Session Preference

Prefer:

```text
JWT
shared external session store
```

instead of in-Pod session state.

---

# 241. API Version Routing

Support deliberate coexistence such as:

```text
/api/v1/
/api/v2/
```

when clients cannot all upgrade simultaneously.

---

# 242. Deprecation and Sunset Headers

The gateway may publish standard:

```text
Deprecation
Sunset
```

headers if the platform adopts them.

---

# 243. Mobile Client Compatibility

Mobile versions may remain installed for long periods.

Do not remove old backend routes abruptly without a communicated compatibility/sunset plan.

---

# 244. Cookie Security

If browser cookies are used, configure:

```text
Secure
HttpOnly
SameSite
```

---

# 245. CSRF

Relevant for browser cookie-authenticated state-changing requests.

Bearer-token mobile/API clients have different CSRF semantics, though token theft remains a risk.

---

# 246. Gateway Access Logs

Include safe structured fields such as:

```text
request_id
method
host
path template
status
latency
upstream service
client class
```

Do not log sensitive raw data unnecessarily.

---

# 247. Sensitive Log Redaction

Avoid logging:

```text
Authorization bearer tokens
cookies
raw query parameters containing email/phone/token
secret payloads
```

---

# 248. Gateway Metrics

Track:

```text
request rate
status codes
latency
active connections
TLS handshakes
upstream errors
rate-limit blocks
WAF blocks
```

---

# 249. Per-Route Metrics

Use normalized route templates such as:

```text
/orders/{id}
```

rather than raw high-cardinality IDs.

---

# 250. Gateway SLIs

Potential SLIs include:

```text
availability
P95/P99 latency
5xx rate
TLS success
upstream-connect error rate
```

---

# 251. Network Metrics

Where available, track:

```text
DNS latency
TCP connect latency
TLS handshake latency
connection resets
retransmits
```

---

# 252. Partner Egress Metrics

Per external partner track:

```text
request rate
latency
timeouts
connection errors
TLS failures
```

---

# 253. DNS Metrics

CoreDNS signals include:

```text
query rate
SERVFAIL
NXDOMAIN
latency
```

---

# 254. Certificate Metrics

Track:

```text
days_to_expiry
renewal failures
issuer failures
```

---

# 255. WAF Metrics

Track:

```text
blocked requests
top triggering rules
possible false positives
```

---

# 256. Rate-Limit Metrics

Track allowed/blocked counts by bounded route/client class.

---

# 257. NetworkPolicy Metrics

Where supported by CNI, observe denied flows.

---

# 258. Distributed Tracing

The gateway creates or continues trace context.

---

# 259. W3C Trace Context

Use:

```text
traceparent
tracestate
```

---

# 260. Trace Baggage Safety

Use baggage sparingly.

Never put:

```text
PII
secrets
```

in trace baggage.

---

# 261. Client-Facing Support ID

Expose a safe `request_id` in errors so support can correlate the request without revealing internal secrets.

---

# 262. Required Network Runbooks

At minimum:

```text
Gateway 5xx spike
DNS failure
certificate expiry/renewal failure
TLS handshake failure
WAF false positive
rate-limit incident
NetworkPolicy block
partner egress unreachable
load balancer unhealthy
```

---

# 263. Gateway 5xx Runbook

Check:

```text
gateway health
backend readiness
upstream connect errors
recent deployment/config
NetworkPolicy
```

---

# 264. DNS Failure Runbook

Check:

```text
CoreDNS
zone record
resolver
service name
NetworkPolicy
```

---

# 265. Certificate Expiry Runbook

Check:

```text
cert-manager/issuer
challenge
DNS
Secret/certificate object
renewal events
```

---

# 266. TLS Handshake Runbook

Check:

```text
protocol
cipher
certificate chain
hostname
client certificate
clock/time skew
```

---

# 267. WAF False-Positive Runbook

```text
identify rule
capture safe request pattern
apply temporary scoped exception if required
tune rule
remove exception after fix
```

---

# 268. Rate-Limit Incident Runbook

Determine whether the cause is:

```text
real attack
client bug
misconfigured threshold
unexpected legitimate load
```

---

# 269. NetworkPolicy Block Runbook

Check:

```text
source labels
destination labels
namespace selector
port/protocol
DNS allow rule
```

---

# 270. Partner Egress Runbook

Check:

```text
DNS
NAT
egress IP
firewall/CNI policy
partner allowlist
TLS
provider health
```

---

# 271. Load Balancer Runbook

Check:

```text
backend/target health
target registration
certificate
security rules
provider quota
```

---

# 272. Network Architecture Test Scope

Validate:

```text
routing
TLS/mTLS
DNS
CORS
rate limiting
WAF
NetworkPolicy
egress
timeouts
connection reuse
failover
```

---

# 273. Route Test

Every external route validates:

```text
host
path
method
backend
```

in CI/STAGING.

---

# 274. Unknown Route Test

Unknown routes return a controlled 404 and do not expose a default backend.

---

# 275. Wrong Host Test

Unexpected Host values are rejected.

---

# 276. TLS Test

Verify:

```text
valid certificate
hostname
certificate chain
TLS version
```

---

# 277. Expired Certificate Test

Non-production simulates invalid/expired certificates.

Clients must fail securely.

---

# 278. mTLS Test

Verify:

```text
valid client certificate accepted
missing certificate rejected
wrong CA rejected
expired certificate rejected
```

---

# 279. CORS Test

Allowed origin receives correct headers.

Disallowed origin does not receive a permissive CORS response.

---

# 280. Security Header Test

Verify HSTS/nosniff/CSP/referrer/cache headers expected for the relevant route.

---

# 281. Rate-Limit Test

Exceed a configured threshold and verify:

```text
429
Retry-After where applicable
metrics/logging
```

---

# 282. WAF Test

Use a harmless test payload that matches a known rule in a safe environment and verify block/log behavior.

---

# 283. Request Limit Tests

Verify oversized bodies, headers, URIs, and uploads are rejected safely.

---

# 284. Timeout Test

Delay an upstream and verify:

```text
bounded gateway timeout
connection cleanup
no retry storm
correct 5xx semantics
```

---

# 285. Retry Safety Test

A non-idempotent POST without idempotency protection must not be replayed unexpectedly.

---

# 286. DNS Failure Test

Break DNS in STAGING and verify bounded failure plus recovery.

---

# 287. Load Balancer Failover Test

Remove one gateway instance and verify traffic continues.

---

# 288. Gateway Rolling Update Test

Upgrade the gateway under traffic and verify there is no unacceptable interruption.

---

# 289. Certificate Rotation Test

Rotate a leaf certificate and verify zero/minimal downtime.

---

# 290. CA Rotation Test

Where internal PKI is used, test:

```text
dual trust
new certificate issuance
workload rollout
old CA removal
```

---

# 291. NetworkPolicy Negative Test

Attempt an explicitly forbidden cross-service connection.

Expected:

```text
blocked
```

---

# 292. Egress Allowlist Test

The Integration/Payment service can reach the approved partner.

An unrelated service cannot.

---

# 293. Static Egress IP Test

Verify the partner observes the documented environment-specific source IP.

---

# 294. Partner Callback Test

Verify callbacks reach the correct:

```text
environment
hostname/path
authentication policy
signature/mTLS boundary
```

---

# 295. Webhook Replay Test

Ensure the gateway preserves the raw request body/signature headers required for downstream cryptographic verification.

---

# 296. Header Spoof Test

Verify externally supplied internal identity/forwarding headers are removed or overwritten.

---

# 297. Gateway Authentication Test

Invalid:

```text
issuer
audience
signature
expiry
```

must be rejected before the backend.

---

# 298. Service Authorization Test

A request can pass gateway authentication and still be rejected by the domain service for unauthorized resource access.

---

# 299. Connection Drain Test

Terminate a backend Pod during traffic and verify existing/new requests behave safely.

---

# 300. Keepalive Endpoint-Churn Test

Long-lived clients must eventually reconnect and discover the new Pod/backend set.

---

# 301. gRPC Rebalance Test

Scale backend replicas and verify client channels distribute traffic appropriately.

---

# 302. Network Performance Test

Measure:

```text
gateway latency overhead
TLS handshake latency/CPU
HTTP/2 behavior
connection reuse
```

---

# 303. Gateway Capacity Test

Determine:

```text
requests/sec per gateway replica
CPU/memory
active/max connections
upstream concurrency
```

---

# 304. TLS Capacity Test

Handshake-heavy workloads can consume meaningful CPU.

Measure under representative traffic.

---

# 305. WAF Capacity Test

Managed WAF is often external, but complex custom rules may add latency.

Measure critical routes.

---

# 306. Rate-Limiter Capacity

A shared rate-limit store must sustain expected throughput and remain resilient.

---

# 307. Egress NAT Capacity

Large outbound traffic can exhaust:

```text
NAT ports
```

Monitor and capacity-plan.

---

# 308. Connection Explosion

Many Pods × many outbound connections may exceed:

```text
NAT limits
partner limits
load-balancer limits
local ephemeral ports
```

---

# 309. NAT Port Exhaustion Mitigation

Possible mitigations:

```text
connection reuse
additional NAT IPs
private endpoints
egress gateway
```

---

# 310. MTU

Cloud networking, VPNs, and service meshes can reduce effective MTU.

Monitor fragmentation/packet-loss symptoms.

---

# 311. TCP Retransmissions

High retransmission can indicate:

```text
network loss
MTU mismatch
congestion
```

---

# 312. Latency Budget

Network latency contributes to end-to-end SLO and timeout design.

---

# 313. Cross-Region Calls

Avoid synchronous cross-region calls on critical paths unless architecture explicitly requires them.

---

# 314. Partner Geography

External provider latency varies geographically.

Timeouts must be based on observed behavior, not arbitrary local-network values.

---

# 315. Topology-Aware Routing

May optimize same-zone traffic when platform support exists, but locality must never compromise outage resilience.

---

# 316. API Gateway High Availability

Run multiple gateway replicas or use a managed HA gateway/load-balancer service.

---

# 317. Gateway PDB and Spread

Self-hosted gateway replicas should have disruption protection and node/zone spread appropriate to Tier-1 criticality.

---

# 318. Gateway HPA

Possible metrics:

```text
CPU
requests/sec
connections
```

depending the selected controller.

---

# 319. Gateway Priority

The public gateway is typically a critical Tier-1 workload.

---

# 320. WAF High Availability

Managed WAF inherits provider architecture.

Self-hosted WAF requires separate HA planning.

---

# 321. DNS High Availability

Use a highly available authoritative DNS platform.

---

# 322. Certificate Issuer Availability

An issuer/controller outage should not instantly invalidate existing certificates, but renewal backlog and expiry risk must alert.

---

# 323. Service Mesh Control Plane HA

If adopted, the mesh control plane requires HA and tested data-plane behavior during control-plane failure.

---

# 324. Network Changes as Code

Version-control network changes including:

```text
routes
DNS
WAF
NetworkPolicies
egress allows
certificate references
```

---

# 325. Route Change Review

Review:

```text
auth
rate limit
backend
CORS
timeout
request limits
```

---

# 326. DNS Change Review

Review:

```text
TTL
target
certificate
rollback
```

---

# 327. Certificate Change Review

Review:

```text
SANs/hostname
issuer
private-key handling
renewal
```

---

# 328. NetworkPolicy Change Review

Review the connectivity blast radius and run negative tests.

---

# 329. Egress Change Review

Review:

```text
partner
data classification
protocol/port
static source IP
TLS/auth
```

---

# 330. WAF Rule Change Review

Review expected security value and false-positive risk.

---

# 331. Emergency Network Change

Allowed only with:

```text
approval
audit
post-change reconciliation to IaC/GitOps
```

---

# 332. Incident Network Freeze

Avoid unrelated network changes during a severe production incident.

---

# 333. Gateway Config Version

Track the Git commit/config revision controlling gateway desired state.

---

# 334. DNS Change History

Retain provider/IaC history.

---

# 335. Certificate Catalog

Maintain:

```text
domain
environment
issuer
secret/reference
expiry
auto-renew
owner
alert
```

---

# 336. Route Catalog

Maintain:

```text
host
path
methods
backend service
public/internal
authentication
scopes
rate limit
timeout
CORS
owner
```

---

# 337. Service Connection Catalog

Maintain:

```text
caller
callee
protocol
port
TLS/mTLS
authentication
timeout
retry
NetworkPolicy
owner
```

---

# 338. Egress Catalog

Maintain:

```text
service
destination
protocol
port
DNS/FQDN
static egress IP
TLS
authentication
timeout
provider quota/rate
owner
```

---

# 339. NetworkPolicy Matrix

Maintain:

```text
source
destination
port
direction
allowed
reason
environment
```

---

# 340. Partner Network Catalog

Maintain:

```text
provider
endpoint
source IP
TLS/mTLS
partner allowlist
timeout
owner
```

---

# 341. Timeout Budget Catalog

For each synchronous journey record:

```text
user/client timeout
gateway timeout
service timeout
downstream timeout
retry owner/count
max end-to-end deadline
```

---

# 342. Definition of Done — Gateway

- [ ] Highly available.
- [ ] TLS enabled.
- [ ] Authentication enforced.
- [ ] Coarse authorization documented.
- [ ] Rate limits defined.
- [ ] Request/header/body limits defined.
- [ ] CORS configured.
- [ ] Security headers configured.
- [ ] Correlation/request IDs.
- [ ] Access logs.
- [ ] Metrics/tracing.
- [ ] Route ownership.
- [ ] Rolling update/failover tested.

---

# 343. Definition of Done — Public Route

- [ ] Host/path/method documented.
- [ ] Public exposure justified.
- [ ] Authentication defined.
- [ ] Authorization handoff defined.
- [ ] Rate limit.
- [ ] Timeout/deadline.
- [ ] Retry policy.
- [ ] Max body/header size.
- [ ] CORS if browser-accessible.
- [ ] WAF exposure reviewed.
- [ ] Backend remains private.
- [ ] Observability.
- [ ] Owner.

---

# 344. Definition of Done — Internal Route

- [ ] Caller identity.
- [ ] Callee.
- [ ] Protocol/port.
- [ ] TLS/mTLS policy.
- [ ] Service authentication.
- [ ] Service authorization.
- [ ] Deadline.
- [ ] Retry safety.
- [ ] NetworkPolicy.
- [ ] Metrics/traces.

---

# 345. Definition of Done — TLS

- [ ] TLS 1.2+.
- [ ] Trusted issuer.
- [ ] Correct hostname/SAN.
- [ ] Private key protected.
- [ ] Auto-renew where supported.
- [ ] Expiry alert.
- [ ] Rotation tested.
- [ ] Non-production key separate.
- [ ] No verification bypass.

---

# 346. Definition of Done — NetworkPolicy

- [ ] Default-deny baseline.
- [ ] DNS explicitly allowed.
- [ ] Gateway ingress allowed.
- [ ] Required service dependencies allowed.
- [ ] Database ownership path enforced.
- [ ] Kafka/Redis allowed only where needed.
- [ ] Observability path allowed.
- [ ] External egress explicitly allowed.
- [ ] Negative tests.

---

# 347. Definition of Done — Egress

- [ ] Approved destination.
- [ ] Correct environment.
- [ ] Static IP if required.
- [ ] DNS/FQDN strategy.
- [ ] TLS verification.
- [ ] Authentication/mTLS if needed.
- [ ] Timeout.
- [ ] Retry safety.
- [ ] Provider quota/rate.
- [ ] NAT capacity.
- [ ] Runbook.
- [ ] Metrics.

---

# 348. Networking Architecture Review — North-South

- [ ] Public route justified.
- [ ] Gateway ownership.
- [ ] TLS.
- [ ] Authentication.
- [ ] WAF/rate limit.
- [ ] CORS/security headers.
- [ ] Request limits.
- [ ] Timeout/retry.

---

# 349. Networking Architecture Review — East-West

- [ ] Kubernetes DNS/Service.
- [ ] Authenticated caller.
- [ ] Authorization.
- [ ] TLS/mTLS policy.
- [ ] NetworkPolicy.
- [ ] Deadline/retry.
- [ ] Observability.

---

# 350. TLS Review Checklist

- [ ] Protocol versions.
- [ ] Cipher policy.
- [ ] Certificate issuer.
- [ ] Renewal.
- [ ] Private-key protection.
- [ ] Rotation.
- [ ] CA trust.
- [ ] mTLS where needed.
- [ ] Verification never disabled.

---

# 351. Gateway Review Checklist

- [ ] Route inventory.
- [ ] Auth.
- [ ] Authorization handoff.
- [ ] Correlation ID.
- [ ] Request limits.
- [ ] Timeouts.
- [ ] Safe retries.
- [ ] Access logs.
- [ ] Metrics/traces.
- [ ] HA.

---

# 352. CORS / Security Header Review

- [ ] Allowed origins.
- [ ] Methods.
- [ ] Headers.
- [ ] Credentials.
- [ ] Preflight.
- [ ] HSTS.
- [ ] nosniff.
- [ ] CSP where applicable.
- [ ] Referrer policy.
- [ ] Cache-Control.

---

# 353. Egress Review Checklist

- [ ] Calling service allowed.
- [ ] Destination documented.
- [ ] Static IP where needed.
- [ ] Partner allowlist.
- [ ] TLS verification.
- [ ] mTLS/client certificate.
- [ ] Timeout.
- [ ] Retry.
- [ ] Quota.
- [ ] NAT/connection capacity.

---

# 354. Operations Review Checklist

- [ ] Gateway dashboard.
- [ ] DNS dashboard.
- [ ] TLS-expiry alert.
- [ ] WAF dashboard.
- [ ] Rate-limit metrics.
- [ ] Egress/partner metrics.
- [ ] NetworkPolicy visibility.
- [ ] Runbooks.
- [ ] Change history.

---

# 355. Testing Review Checklist

- [ ] Route tests.
- [ ] TLS/mTLS tests.
- [ ] CORS tests.
- [ ] Security-header tests.
- [ ] Rate-limit tests.
- [ ] WAF tests.
- [ ] NetworkPolicy negative tests.
- [ ] Egress allowlist tests.
- [ ] Timeout tests.
- [ ] Retry-safety tests.
- [ ] Connection-drain tests.
- [ ] DNS tests.
- [ ] Certificate rotation tests.

---

# 356. Production Readiness Checklist

Before production networking is approved:

- [ ] Public endpoint inventory completed.
- [ ] Internal service connection inventory completed.
- [ ] Gateway highly available.
- [ ] Gateway/Ingress standard approved.
- [ ] DNS managed through IaC/GitOps.
- [ ] TLS 1.2+ enforced.
- [ ] Certificates auto-renew where supported and are monitored.
- [ ] Production certificate keys isolated.
- [ ] Protected public routes validate JWT.
- [ ] Service-level fine-grained authorization remains enforced.
- [ ] Service-to-service identity model approved.
- [ ] Correlation IDs propagate.
- [ ] Rate-limit policy defined.
- [ ] WAF/DDoS protections configured.
- [ ] Request/header/body limits configured.
- [ ] Timeout hierarchy documented.
- [ ] Retry ownership documented.
- [ ] Unsafe gateway POST retries disabled.
- [ ] Connection pools bounded.
- [ ] CORS restricted.
- [ ] Security headers configured.
- [ ] Internal Services remain private.
- [ ] Default-deny NetworkPolicies implemented where approved.
- [ ] Explicit east-west allow rules exist.
- [ ] Database ownership reinforced by network policy.
- [ ] Kafka/Redis access restricted.
- [ ] External egress controlled.
- [ ] Static egress IP configured for partners that require it.
- [ ] Partner mTLS/HMAC paths tested.
- [ ] Private endpoints used where required.
- [ ] DNS failure runbook exists.
- [ ] TLS/certificate runbooks exist.
- [ ] Gateway/WAF/rate-limit dashboards exist.
- [ ] Partner-egress dashboard exists.
- [ ] Connection-drain and gateway rolling-update tests pass.
- [ ] Certificate rotation test passes.
- [ ] Network configuration is GitOps/IaC managed.

---

# 357. Source-Recommended Initial Implementation Order

```text
1. Define public/internal route inventory
2. Select Gateway/Ingress standard
3. Configure public DNS
4. Configure TLS/cert-manager
5. Implement gateway auth/correlation
6. Define timeout standards
7. Define rate-limit policy
8. Configure CORS/security headers
9. Add WAF/DDoS controls
10. Implement default-deny NetworkPolicies
11. Add explicit east-west allow rules
12. Restrict DB/Kafka/Redis connectivity
13. Implement controlled egress/static IP
14. Configure partner mTLS/cert handling
15. Add gateway/network observability
16. Add DNS/TLS/egress runbooks
17. Test certificate rotation
18. Test network failures and connection draining
```

---

# 358. Expanded Implementation Sequence

```text
Step 1   Build public/private route inventory
Step 2   Build service-to-service connection matrix
Step 3   Build partner egress matrix
Step 4   Select Gateway API/Ingress implementation
Step 5   Define public/admin/partner gateway separation
Step 6   Provision external/internal load balancers
Step 7   Configure environment DNS zones/records
Step 8   Put DNS under IaC
Step 9   Configure public TLS baseline
Step 10  Configure cert-manager/issuer
Step 11  Create certificate inventory/alerts
Step 12  Implement gateway JWT validation
Step 13  Add JWKS refresh/cache logic
Step 14  Define service authorization handoff
Step 15  Add correlation/request ID handling
Step 16  Sanitize forwarded/internal headers
Step 17  Define request/header/body limits
Step 18  Define timeout/deadline hierarchy
Step 19  Define retry ownership and idempotency requirements
Step 20  Tune outbound connection pools
Step 21  Configure gateway rate limiting
Step 22  Preserve domain/security rate limits in services
Step 23  Configure WAF/DDoS
Step 24  Configure restrictive CORS
Step 25  Configure security/cache headers
Step 26  Implement default-deny NetworkPolicies
Step 27  Add DNS/gateway allow policies
Step 28  Add explicit service-to-service allow policies
Step 29  Restrict DB ownership paths
Step 30  Restrict Kafka and Redis connectivity
Step 31  Define production egress-control mechanism
Step 32  Configure static egress IPs where required
Step 33  Add partner destination allowlists
Step 34  Configure partner mTLS/HMAC/signature paths
Step 35  Configure private endpoints where required
Step 36  Approve east-west TLS/mTLS target
Step 37  Implement service identity model
Step 38  Validate HTTP/2/gRPC routing
Step 39  Implement canary/weighted routing if adopted
Step 40  Add gateway/DNS/TLS/WAF/rate-limit telemetry
Step 41  Add partner-egress telemetry
Step 42  Write network runbooks
Step 43  Add route/TLS/CORS/WAF tests
Step 44  Add NetworkPolicy negative tests
Step 45  Add egress/static-IP tests
Step 46  Add timeout/retry-safety tests
Step 47  Add connection-drain/failover tests
Step 48  Add certificate/CA-rotation tests
Step 49  Run gateway/TLS/NAT capacity tests
Step 50  Put all network desired state under GitOps/IaC
Step 51  Complete production-readiness review
Step 52  Handoff Phase 27 Observability
```

---

# 359. Work Breakdown

Suggested implementation tickets:

```text
NET-001 Publish north-south traffic model
NET-002 Publish east-west traffic model
NET-003 Publish outbound partner traffic model
NET-004 Create public endpoint inventory
NET-005 Create internal endpoint inventory
NET-006 Create service connection matrix
NET-007 Create partner egress matrix
NET-008 Select primary gateway product
NET-009 Decide Gateway API vs Ingress
NET-010 Define GatewayClass ownership
NET-011 Define Gateway ownership
NET-012 Define HTTPRoute ownership
NET-013 Define route metadata standard
NET-014 Create environment hostname standard
NET-015 Create public API hostname
NET-016 Create admin hostname/private domain
NET-017 Create webhook hostname/path standard
NET-018 Decide separate public/admin gateways
NET-019 Decide partner gateway isolation
NET-020 Configure public load balancer
NET-021 Configure internal load balancer where needed
NET-022 Configure gateway high availability
NET-023 Configure gateway PDB
NET-024 Configure gateway topology spread
NET-025 Configure gateway autoscaling
NET-026 Create route naming standard
NET-027 Create path routing rules
NET-028 Create API version routing standard
NET-029 Define route rewrite policy
NET-030 Define request transformation policy
NET-031 Define protocol translation boundary
NET-032 Prohibit gateway domain business logic
NET-033 Implement forwarded-header normalization
NET-034 Implement Host validation
NET-035 Implement request ID generation
NET-036 Implement correlation ID propagation
NET-037 Sanitize external internal-only headers
NET-038 Define trusted proxy chain
NET-039 Implement trusted client-IP extraction
NET-040 Select authoritative DNS provider
NET-041 Create public DNS zones
NET-042 Create private DNS zones if needed
NET-043 Manage DNS through Terraform/ExternalDNS
NET-044 Define DNS TTL policy
NET-045 Add DNS change review workflow
NET-046 Protect DNS registrar/provider with MFA/RBAC
NET-047 Decide DNSSEC adoption
NET-048 Create DNS failure test
NET-049 Create DNS failover test if applicable
NET-050 Define JVM DNS-cache policy
NET-051 Configure TLS 1.2+ baseline
NET-052 Enable TLS 1.3 where supported
NET-053 Disable obsolete TLS protocols
NET-054 Adopt approved cipher policy
NET-055 Select certificate issuer
NET-056 Install/configure cert-manager if adopted
NET-057 Create public certificate resources
NET-058 Create internal certificate strategy
NET-059 Separate cert keys per environment
NET-060 Define wildcard-certificate policy
NET-061 Define dedicated sensitive-cert policy
NET-062 Secure certificate private-key access
NET-063 Create certificate expiry monitoring
NET-064 Create certificate renewal alerts
NET-065 Create certificate catalog
NET-066 Test certificate renewal
NET-067 Test leaf certificate rotation
NET-068 Test CA rotation
NET-069 Define external TLS termination point
NET-070 Define gateway-to-backend re-encryption policy
NET-071 Define end-to-end TLS exceptions/requirements
NET-072 Implement custom CA trust distribution
NET-073 Block trust-all TLS configuration
NET-074 Decide east-west TLS target
NET-075 Decide mTLS strategy
NET-076 Decide service mesh adoption
NET-077 Decide SPIFFE/SPIRE adoption
NET-078 Define workload service identity
NET-079 Define partner mTLS handling
NET-080 Define webhook auth standard
NET-081 Define dual-trust CA rotation process
NET-082 Implement gateway JWT validation
NET-083 Configure issuer/audience checks
NET-084 Configure JWKS caching/refresh
NET-085 Define coarse gateway scope enforcement
NET-086 Document service fine-grained authorization
NET-087 Define anonymous-route security policy
NET-088 Define internal service authentication
NET-089 Define token-forward/exchange strategy
NET-090 Define internal token audience policy
NET-091 Define signed user-context propagation
NET-092 Define gateway rate-limit layers
NET-093 Define route/IP/user/client/device limit keys
NET-094 Configure distributed rate limiter if required
NET-095 Define 429 error contract
NET-096 Define anonymous endpoint thresholds
NET-097 Configure WAF
NET-098 Configure managed WAF rule sets
NET-099 Create WAF observe-before-block process
NET-100 Create WAF exception governance
NET-101 Configure bot protection where needed
NET-102 Configure provider DDoS protection
NET-103 Define JSON body limits
NET-104 Define multipart upload limits
NET-105 Define header-size limits
NET-106 Define URI-length limits
NET-107 Define direct object-storage upload path for large files
NET-108 Configure path normalization
NET-109 Restrict HTTP methods
NET-110 Disable TRACE
NET-111 Configure content-type validation
NET-112 Configure decompression safety limits
NET-113 Define CORS allowed origins
NET-114 Define CORS methods/headers
NET-115 Configure credentialed CORS safely
NET-116 Configure OPTIONS/preflight
NET-117 Create environment-specific CORS overlays
NET-118 Configure HSTS
NET-119 Configure X-Content-Type-Options
NET-120 Configure CSP/frame protections where relevant
NET-121 Configure Referrer-Policy
NET-122 Configure sensitive Cache-Control
NET-123 Define public cache/ETag policy
NET-124 Prevent private-data CDN caching
NET-125 Define compression threshold/policy
NET-126 Define client/gateway/service timeout hierarchy
NET-127 Create timeout-budget catalog
NET-128 Configure gateway route timeouts
NET-129 Configure downstream connect timeouts
NET-130 Configure downstream read timeouts
NET-131 Configure overall deadlines
NET-132 Implement deadline propagation where supported
NET-133 Define 502/503/504 handling
NET-134 Define financial timeout UNKNOWN handling boundary
NET-135 Disable blind POST retry
NET-136 Define safe GET/HEAD gateway retries
NET-137 Require idempotency contract for POST retry
NET-138 Define retry owner per dependency path
NET-139 Define retry max attempts/backoff
NET-140 Audit SDK hidden retries
NET-141 Configure outbound HTTP connection pools
NET-142 Bound per-host connections
NET-143 Bound pool-acquisition wait
NET-144 Configure idle connection timeout
NET-145 Configure max connection lifetime
NET-146 Validate HTTP keepalive
NET-147 Validate HTTP/2
NET-148 Configure gRPC routes
NET-149 Require gRPC deadlines
NET-150 Define gRPC load-balancing strategy
NET-151 Define WebSocket/SSE policy if introduced
NET-152 Configure LB health checks
NET-153 Configure source-IP preservation if needed
NET-154 Configure Proxy Protocol if required
NET-155 Configure SNI/multi-domain routing
NET-156 Create default-deny ingress policy
NET-157 Create default-deny egress policy
NET-158 Allow DNS egress
NET-159 Allow gateway-to-public-service ingress
NET-160 Create Order-to-Payment rule
NET-161 Create Order-to-Inventory rule
NET-162 Create remaining approved service-to-service rules
NET-163 Create service-to-owned-DB rules
NET-164 Block cross-service DB access
NET-165 Create Kafka broker access rules
NET-166 Create Redis access rules
NET-167 Create observability network rules
NET-168 Create secret-manager egress rule if needed
NET-169 Select NetworkPolicy engine/CNI capability
NET-170 Add NetworkPolicy drift through GitOps
NET-171 Add NetworkPolicy positive tests
NET-172 Add NetworkPolicy negative tests
NET-173 Define cloud VPC/VNet segmentation
NET-174 Keep databases in private networking
NET-175 Disable public Redis
NET-176 Prefer private Kafka
NET-177 Configure private managed-service endpoints
NET-178 Define operator VPN/ZTNA path
NET-179 Define bastion controls if used
NET-180 Restrict production node SSH
NET-181 Select egress-control architecture
NET-182 Configure egress gateway/proxy if used
NET-183 Provision static egress IPs
NET-184 Track egress IP per environment
NET-185 Configure partner destination allowlists
NET-186 Define partner allowlist change process
NET-187 Evaluate FQDN egress support
NET-188 Restrict unrestricted production internet
NET-189 Create egress catalog
NET-190 Create partner network catalog
NET-191 Configure Kafka TLS
NET-192 Configure PostgreSQL verify-full TLS
NET-193 Configure Redis TLS where required
NET-194 Validate provider HTTPS
NET-195 Create workload identity authorization policy
NET-196 Document Kubernetes-native service discovery
NET-197 Avoid redundant Eureka/Consul without need
NET-198 Implement bounded DNS failure handling
NET-199 Configure application circuit breakers
NET-200 Define gateway circuit-breaker use
NET-201 Define weighted/canary routing standard
NET-202 Define sticky-session exception policy
NET-203 Define Deprecation/Sunset header policy
NET-204 Create mobile API sunset process
NET-205 Configure secure web cookies if used
NET-206 Define CSRF strategy for browser-cookie auth
NET-207 Create safe gateway access-log schema
NET-208 Redact raw sensitive query parameters
NET-209 Prevent Authorization header logging
NET-210 Prevent cookie logging
NET-211 Create gateway metrics
NET-212 Create per-route metrics
NET-213 Create gateway SLI dashboard
NET-214 Create DNS metrics dashboard
NET-215 Create certificate dashboard
NET-216 Create WAF dashboard
NET-217 Create rate-limit dashboard
NET-218 Create partner egress dashboard
NET-219 Enable NetworkPolicy denied-flow visibility where supported
NET-220 Propagate W3C trace context
NET-221 Define trace baggage restrictions
NET-222 Expose safe request_id to clients
NET-223 Write gateway 5xx runbook
NET-224 Write DNS failure runbook
NET-225 Write certificate-expiry runbook
NET-226 Write TLS-handshake runbook
NET-227 Write WAF false-positive runbook
NET-228 Write rate-limit runbook
NET-229 Write NetworkPolicy-block runbook
NET-230 Write partner-egress runbook
NET-231 Write load-balancer runbook
NET-232 Add external route tests
NET-233 Add unknown-route test
NET-234 Add wrong-host test
NET-235 Add TLS protocol/certificate test
NET-236 Add expired-certificate test
NET-237 Add mTLS client-cert tests
NET-238 Add CORS test
NET-239 Add HSTS/security-header test
NET-240 Add rate-limit test
NET-241 Add WAF safe test
NET-242 Add body/header-limit tests
NET-243 Add timeout test
NET-244 Add retry-safety test
NET-245 Add load-balancer failover test
NET-246 Add gateway rolling-update test
NET-247 Add static-egress-IP test
NET-248 Add partner callback test
NET-249 Add webhook raw-body/signature test
NET-250 Add client-IP test
NET-251 Add header-spoof test
NET-252 Add gateway-auth test
NET-253 Add service-authorization defense-in-depth test
NET-254 Add connection-drain test
NET-255 Add keepalive endpoint-churn test
NET-256 Add gRPC rebalance test
NET-257 Run network performance test
NET-258 Run gateway capacity test
NET-259 Run TLS handshake capacity test
NET-260 Run WAF latency test
NET-261 Run rate-limit-store capacity test
NET-262 Run NAT port-capacity test
NET-263 Monitor ephemeral port exhaustion
NET-264 Monitor DNS query storms
NET-265 Validate MTU across VPN/mesh/cloud
NET-266 Monitor TCP retransmissions
NET-267 Define cross-region synchronous-call policy
NET-268 Review partner geographic latency
NET-269 Evaluate topology-aware routing
NET-270 Validate gateway HA
NET-271 Validate DNS HA
NET-272 Validate certificate issuer HA
NET-273 Validate mesh control-plane HA if adopted
NET-274 Put routes under GitOps
NET-275 Put DNS under IaC
NET-276 Put WAF policy under version control where supported
NET-277 Put NetworkPolicies under GitOps
NET-278 Put egress policy under IaC/GitOps
NET-279 Track gateway configuration revisions
NET-280 Retain DNS change history
NET-281 Build route catalog
NET-282 Build certificate catalog
NET-283 Build service-connection catalog
NET-284 Build NetworkPolicy matrix
NET-285 Build timeout-budget catalog
NET-286 Complete Gateway DoD
NET-287 Complete Public Route DoD
NET-288 Complete Internal Route DoD
NET-289 Complete TLS DoD
NET-290 Complete NetworkPolicy DoD
NET-291 Complete Egress DoD
NET-292 Complete north-south architecture review
NET-293 Complete east-west architecture review
NET-294 Complete TLS review
NET-295 Complete gateway review
NET-296 Complete CORS/security-header review
NET-297 Complete egress review
NET-298 Complete operations review
NET-299 Complete testing review
NET-300 Complete production-readiness checklist
NET-301 Complete Phase 26 policy freeze
NET-302 Run Phase 26 exit review
NET-303 Hand off to Phase 27 Observability
```

---

# 360. Minimum Viable Networking Standard

At minimum, production requires:

```text
one approved external gateway
private internal services
managed DNS
TLS on public traffic
JWT validation at the edge where applicable
service-level authorization
bounded timeouts
explicit retry policy
basic rate limiting
request-size limits
restricted CORS
NetworkPolicy baseline
controlled DB/Kafka/Redis access
controlled partner egress
gateway/network observability
```

---

# 361. Mature Networking Standard

A mature platform adds:

```text
Gateway API
automated cert-manager
mTLS/workload service identity
default-deny ingress + egress
WAF/DDoS
static egress IP
FQDN egress policy
private endpoints
canary/weighted routing
network-flow observability
policy-as-code
```

---

# 362. Networking Governance Rejections

Architecture/platform review should reject:

```text
public LoadBalancer per microservice
public databases/Redis without exceptional approval
no TLS
trust-all certificates
shared PROD and non-PROD private keys
wildcard credentialed CORS
infinite timeouts
blind gateway POST retries
retry multiplication across every layer
flat east-west network access
open production egress
backend trusting client-supplied X-User-Id
manual untracked production DNS
unowned public routes
unbounded connection pools
```

---

# 363. Phase 26 Policy Freeze Checklist

Before moving to Phase 27, approve:

- [ ] Public edge inventory.
- [ ] Internal service connection inventory.
- [ ] Partner egress inventory.
- [ ] Gateway product.
- [ ] Gateway API vs Ingress.
- [ ] GatewayClass ownership.
- [ ] Route ownership model.
- [ ] Public/admin/partner gateway topology.
- [ ] Public/internal hostname model.
- [ ] DNS provider.
- [ ] DNS-as-code model.
- [ ] DNS TTL policy.
- [ ] DNSSEC decision.
- [ ] TLS minimum/cipher baseline.
- [ ] Certificate issuer.
- [ ] cert-manager strategy.
- [ ] Certificate ownership/renewal alerts.
- [ ] Wildcard certificate policy.
- [ ] External TLS termination point.
- [ ] Gateway-to-backend TLS policy.
- [ ] East-west TLS/mTLS target.
- [ ] Service mesh decision.
- [ ] Workload identity model.
- [ ] Partner mTLS/HMAC/signature policy.
- [ ] Gateway JWT/OIDC behavior.
- [ ] Token forwarding/exchange strategy.
- [ ] Internal service authentication.
- [ ] Gateway vs service authorization boundary.
- [ ] Rate-limit layers/keys.
- [ ] WAF/DDoS provider controls.
- [ ] Body/header/URI limits.
- [ ] CORS policy.
- [ ] Security headers.
- [ ] Cache/compression policy.
- [ ] Timeout hierarchy.
- [ ] Retry ownership.
- [ ] POST retry/idempotency rule.
- [ ] Connection-pool standards.
- [ ] HTTP/2/gRPC standards.
- [ ] Forwarded-header trust.
- [ ] Default-deny NetworkPolicy.
- [ ] Explicit service-to-service allows.
- [ ] DB/Kafka/Redis access policy.
- [ ] Egress-control mechanism.
- [ ] Static egress IP model.
- [ ] FQDN egress capability.
- [ ] Private endpoint strategy.
- [ ] Canary/weighted routing mechanism.
- [ ] Gateway/DNS/TLS/WAF metrics.
- [ ] Partner-egress metrics.
- [ ] Required runbooks.
- [ ] Network test suite.
- [ ] Capacity-test approach.
- [ ] Network change-management/IaC policy.

---

# 364. Exit Criteria — Public Edge

The team can answer:

```text
Which endpoints are public,
and what gateway/WAF/rate-limit policy protects each one?
```

---

# 365. Exit Criteria — Internal Connectivity

The team can answer:

```text
Which services may call each other,
on which protocol/port,
and how is access enforced?
```

---

# 366. Exit Criteria — TLS

The team can answer:

```text
Where does TLS terminate?
How are certificates issued and rotated?
Can verification ever be bypassed?
```

For production, the final answer to verification bypass must be **no**.

---

# 367. Exit Criteria — Identity

The team can answer:

```text
How are callers authenticated at the edge and between services?
```

---

# 368. Exit Criteria — DNS

The team can answer:

```text
Who owns DNS?
How are records changed?
How is failover handled?
```

---

# 369. Exit Criteria — Timeouts

The team can answer:

```text
What is the timeout/deadline budget for every synchronous path?
```

---

# 370. Exit Criteria — Retry

The team can answer:

```text
Which layer retries,
how many times,
and how do we prevent duplicate writes/retry storms?
```

---

# 371. Exit Criteria — Egress

The team can answer:

```text
Which services can reach which external partners,
through which endpoint, source IP, and identity?
```

---

# 372. Exit Criteria — Network Isolation

The team can prove that a service such as Order reaches only the services/databases it is permitted to reach.

---

# 373. Exit Criteria — Operations

Operators can diagnose:

```text
gateway failures
DNS failures
TLS/certificate failures
WAF blocks/false positives
rate limiting
NetworkPolicy blocks
partner egress failures
load-balancer failures
```

---

# 374. Phase 26 Completion Tree

```text
PHASE 26 — NETWORKING / GATEWAY / TLS

├── North-South Traffic                         ✅
├── East-West Traffic                           ✅
├── Partner Egress                              ✅
├── Public / Private Boundary                   ✅
├── API Gateway Responsibilities                ✅
├── Gateway API / Ingress                       ✅
├── Route Ownership                             ✅
├── Public/Admin/Partner Gateways               ✅
├── DNS / DNS-as-Code                           ✅
├── DNS TTL / Failover                          ✅
├── TLS Baseline                                ✅
├── Certificate Management                      ✅
├── cert-manager                                ✅
├── TLS Termination                             ✅
├── Certificate Rotation                        ✅
├── mTLS                                        ✅
├── Service Identity                            ✅
├── Partner mTLS / Webhook Auth                 ✅
├── Gateway JWT Validation                      ✅
├── Service Authorization                       ✅
├── Rate Limiting                               ✅
├── WAF / DDoS                                  ✅
├── Request / Header Limits                     ✅
├── CORS                                        ✅
├── Security Headers                            ✅
├── Cache / Compression                         ✅
├── Timeout Hierarchy                           ✅
├── Safe Retries                                ✅
├── Connection Pools                            ✅
├── HTTP/2 / gRPC                               ✅
├── Load Balancers                              ✅
├── Forwarded Header Trust                      ✅
├── NetworkPolicy Default-Deny                  ✅
├── DB / Kafka / Redis Connectivity             ✅
├── Controlled Egress                           ✅
├── Static Egress IP                            ✅
├── Private Endpoints                           ✅
├── Cloud Network Segmentation                  ✅
├── Service Discovery                           ✅
├── Canary / Weighted Routing                   ✅
├── API Version Routing                         ✅
├── Gateway / Network Telemetry                 ✅
├── DNS / TLS / WAF Metrics                     ✅
├── Runbooks                                    ✅
├── Route / TLS / CORS Tests                    ✅
├── NetworkPolicy Negative Tests                ✅
├── Egress Tests                                ✅
├── Connection Drain / Failover Tests           ✅
├── Gateway / TLS / NAT Capacity                ✅
├── Network Changes as Code                     ✅
├── Route / Cert / Egress Catalogs              ✅
├── Production Readiness                        ✅
└── Observability Handoff                       ✅
```

---

# 375. Handoff to Phase 27

The next official implementation phase is:

```text
PHASE 27 — Observability
```

Phase 27 will define:

```text
Logging
Metrics
Distributed Tracing
OpenTelemetry
Prometheus
Grafana
Loki
trace backend
Correlation IDs
SLIs
SLOs
Error Budgets
Dashboards
Alerting
Business Metrics
Runbooks
Incident Diagnostics
```

---

# 376. Networking → Observability Boundary

Phase 26 defines:

```text
how traffic flows
where trust boundaries exist
how edge/internal security is enforced
how failures are bounded
which network signals exist
```

Phase 27 defines:

```text
how those paths are measured
how failures are correlated
how dashboards and alerts explain user impact
how SLOs/error budgets are managed
```

---

# 377. Final Phase 26 Principle

North-south:

```text
Client
  ↓
DNS
  ↓
WAF / DDoS
  ↓
Load Balancer
  ↓
API Gateway
  ↓
Kubernetes Service
  ↓
Application Pod
```

East-west:

```text
Service
  ↓
Service DNS
  ↓
NetworkPolicy
  ↓
TLS / mTLS
  ↓
Authenticated Internal API
```

Outbound:

```text
Service
  ↓
Egress Control
  ↓
Stable NAT / Egress IP
  ↓
TLS / mTLS
  ↓
Partner
```

The implementation rules are:

```text
Only approved endpoints are public.
Internal microservices remain private.
The gateway owns edge policy, not domain business logic.
Gateway authentication and service authorization are defense-in-depth.
Network location is not identity.
DNS and routes are managed as code.
Kubernetes Service DNS is the primary internal discovery mechanism.
Do not configure Pod IPs into applications.
Public production traffic uses modern TLS.
TLS 1.2+ is the baseline.
Certificate issuance, renewal, ownership, and alerts are automated/explicit.
Production and non-production private keys remain separate.
TLS verification is never disabled in production.
mTLS proves workload/transport identity, not business authorization.
Every protected public route validates identity at the edge where applicable.
Internal service calls authenticate callers explicitly.
Externally supplied identity headers are never trusted directly.
Correlation IDs propagate across HTTP, gRPC, and Kafka.
Rate limiting exists at the layer that owns the risk.
WAF supplements but never replaces application security.
DDoS protection belongs at the edge/provider layer.
CORS is restrictive and browser-specific.
Wildcard credentialed CORS is rejected.
Every request has bounded size.
Every synchronous path has connect timeout, read timeout, overall deadline, and retry budget.
Client timeout is greater than gateway timeout, which is greater than downstream timeout.
A mutating financial timeout is not automatically a confirmed failure.
Non-idempotent POSTs are not blindly retried.
Retry ownership is explicit to prevent multiplicative retry storms.
Outbound HTTP/gRPC connection pools are bounded and reused.
Internal services use explicit NetworkPolicies.
Production moves toward default-deny ingress and egress.
Service-to-database policy reinforces database ownership.
Kafka and Redis are reachable only by approved workloads.
Production egress is controlled and observable.
Partner access uses explicit destinations and stable source IP where required.
Databases and Redis are not publicly exposed by default.
Private endpoints are preferred where they reduce public exposure.
Gateway, DNS, certificates, WAF, rate limits, and egress have metrics and runbooks.
Forbidden network paths are tested negatively.
Certificate and CA rotation are tested.
Gateway failover and rolling updates are tested under traffic.
Connection draining is tested during backend replacement.
Gateway, TLS, rate-limiter, and NAT capacity are performance-tested.
All route, DNS, certificate, WAF, NetworkPolicy, and egress changes are reviewed and managed as code.
```

---

