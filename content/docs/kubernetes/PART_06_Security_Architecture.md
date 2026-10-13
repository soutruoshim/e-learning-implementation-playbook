---
title: "PART 06 — SECURITY ARCHITECTURE"
---

# PART 06 — SECURITY ARCHITECTURE

> **Document Role:** Defines the security architecture and security engineering standards for the microservices platform.  
> **Previous Part:** PART 05 — Contracts  
> **Next Part:** PART 07 — Data Architecture  
> **Status:** Architecture / Security Standard  
> **Primary Stack:** OAuth2, OpenID Connect, JWT, Spring Security, mTLS, Kubernetes Secrets / External Secret Store, TLS, RBAC  
> **Audience:** Backend engineers, software architects, security engineers, DevOps engineers, SREs, QA engineers, platform engineers, technical leads.

---

# 370 — Purpose

Security must be designed into the platform from the beginning.

It must not be added only after:

```text
APIs are complete
services are deployed
production is near
```

Security architecture defines:

```text
Who can access the platform?
How are users authenticated?
How are services authenticated?
What can each identity do?
How are tokens protected?
How are secrets protected?
How is sensitive data protected?
How are attacks detected?
How are security events audited?
How are credentials rotated?
How is abuse limited?
```

The security model applies across:

```text
Mobile
Web
Admin Portal
API Gateway
Microservices
gRPC
Kafka
Databases
Redis
Kubernetes
CI/CD
External Integrations
```

---

# 371 — Security Principles

The platform follows these principles:

1. Least privilege.
2. Deny by default.
3. Explicit trust boundaries.
4. Strong authentication.
5. Fine-grained authorization.
6. Short-lived credentials.
7. Secret rotation.
8. Encryption in transit.
9. Encryption at rest where required.
10. Defense in depth.
11. Security logging.
12. Fail securely.
13. Minimize sensitive data.
14. Separate authentication from business authorization.
15. Never trust network location alone.

---

# 372 — Zero Trust Principle

Internal network access does not automatically imply trust.

Wrong:

```text
Service is inside Kubernetes
        ↓
Therefore service is trusted
```

Correct:

```text
Service identity
        ↓
Authentication
        ↓
Authorization
        ↓
Network policy
        ↓
Allowed operation
```

Each request must prove identity and permission.

---

# 373 — Security Trust Boundaries

Initial trust boundaries:

```text
Internet
   ↓
WAF
   ↓
Load Balancer
   ↓
Ingress
   ↓
API Gateway
   ↓
Internal Services
   ↓
Databases / Kafka / Redis
```

Additional boundaries:

```text
Admin users
Partner APIs
Legacy systems
CI/CD
Developers
Kubernetes operators
External providers
```

Every boundary requires explicit controls.

---

# 374 — Security Domains

Security architecture is divided into:

```text
Identity
Authentication
Authorization
Token Security
Service Identity
Secrets
Transport Security
Data Protection
API Protection
Infrastructure Security
Audit
Threat Detection
Security Testing
Incident Response
```

---

# 375 — Identity Architecture

The platform must distinguish identities.

Possible identity types:

```text
Customer
Store Staff
Support Staff
Admin
System Administrator
Service Account
External Partner
CI/CD Identity
Automation Identity
```

Do not represent every caller as a generic user.

---

# 376 — Identity Provider

Authentication should be centralized.

Possible identity-provider options:

```text
Keycloak
Auth0
Azure Entra ID
AWS Cognito
Custom Identity Service with strict controls
```

For a learning/internal platform, an Identity Service may initially issue JWTs.

For production, prefer a mature identity provider unless there is a strong business reason to build one.

---

# 377 — OAuth2

OAuth2 is used for authorization delegation.

Common flows:

```text
Authorization Code + PKCE
Client Credentials
Refresh Token
```

Do not use deprecated insecure flows.

Avoid:

```text
Resource Owner Password Credentials
Implicit Flow
```

unless a legacy constraint exists and risk is formally accepted.

---

# 378 — OpenID Connect

OIDC adds identity on top of OAuth2.

Use for:

```text
User login
Identity claims
ID token
Session identity
```

Typical relationship:

```text
User
  ↓ login
Identity Provider
  ↓
ID Token / Access Token
  ↓
Client
```

---

# 379 — Authorization Code + PKCE

Recommended for:

```text
Mobile application
Single-page application
Public client
```

Flow:

```text
Client
  ↓
Authorization Request + Code Challenge
  ↓
Identity Provider
  ↓
Authorization Code
  ↓
Client
  ↓
Code + Verifier
  ↓
Token Endpoint
  ↓
Access Token + Refresh Token
```

PKCE reduces authorization-code interception risk.

---

# 380 — Client Credentials Flow

Recommended for service-to-service or machine clients where appropriate.

Flow:

```text
Service A
  ↓ client credentials
Identity Provider
  ↓
Access Token
  ↓
Service B
```

The token must have:

```text
short expiry
restricted audience
minimal scopes
```

---

# 381 — Access Token

Access tokens should be:

```text
Short-lived
Audience-restricted
Signed
Minimal
Non-sensitive
```

Example lifetime:

```text
5–15 minutes
```

The exact value must be defined by security policy.

---

# 382 — Refresh Token

Refresh tokens should be:

```text
Longer-lived than access tokens
Protected carefully
Revocable
Rotated
Bound to client/session where possible
```

Never expose refresh tokens in:

```text
logs
URLs
analytics events
error messages
```

---

# 383 — Refresh Token Rotation

Recommended:

```text
Refresh token A
      ↓ used
Issue access token
Issue refresh token B
Invalidate token A
```

If token A is reused:

```text
possible token theft
      ↓
revoke token family / session
```

---

# 384 — Token Storage

Mobile:

```text
OS secure storage
```

Web:

Prefer secure patterns using:

```text
HttpOnly
Secure
SameSite
```

cookies where architecture permits.

Avoid storing long-lived sensitive tokens in insecure browser storage.

---

# 385 — JWT Structure

Example claims:

```json
{
  "iss": "https://identity.company.com",
  "sub": "USR001",
  "aud": "brown-platform",
  "iat": 1791709200,
  "exp": 1791710100,
  "jti": "token_123",
  "roles": [
    "USER"
  ],
  "scope": "orders.read orders.create"
}
```

---

# 386 — JWT Validation

Every service accepting JWTs must validate:

```text
Signature
Issuer
Audience
Expiration
Not-before if used
Token type
Required scopes/roles
```

Do not simply decode JWT contents without signature validation.

---

# 387 — JWT Signing Algorithm

Use strong asymmetric signing where possible.

Examples:

```text
RS256
ES256
EdDSA
```

Avoid weak or insecure algorithms.

Do not accept:

```text
alg = none
```

---

# 388 — JWT Key Rotation

Use a key identifier:

```text
kid
```

JWT header example:

```json
{
  "alg": "RS256",
  "kid": "rsa-2026-09"
}
```

Services should load public keys from a trusted JWKS endpoint or controlled configuration.

---

# 389 — JWKS

Expose or consume public signing keys via:

```text
/.well-known/jwks.json
```

or identity-provider standard discovery.

Key rotation flow:

```text
Add new key
      ↓
Start signing with new key
      ↓
Keep old public key during token lifetime
      ↓
Retire old key
```

---

# 390 — Token Revocation

JWT access tokens are usually self-contained.

Immediate revocation can be difficult.

Options:

```text
Short access-token lifetime
Session revocation
Refresh-token revocation
Token denylist for high-risk cases
Introspection for selected tokens
```

Prefer short-lived access tokens plus refresh-token control.

---

# 391 — Session Management

Maintain session metadata where required.

Possible fields:

```text
session_id
user_id
device_id
created_at
last_used_at
expires_at
revoked_at
ip metadata
user agent metadata
```

Avoid treating access token itself as the only session record when revocation is required.

---

# 392 — Device Sessions

For customer-facing apps, support:

```text
List active sessions
Revoke one session
Revoke all sessions
Detect suspicious session reuse
```

This improves security and supportability.

---

# 393 — Authentication vs Authorization

Authentication asks:

```text
Who are you?
```

Authorization asks:

```text
What are you allowed to do?
```

Do not mix them.

Example:

```text
JWT valid
```

does not mean:

```text
caller may refund any payment
```

---

# 394 — Role-Based Access Control

Possible roles:

```text
USER
STORE_STAFF
STORE_ADMIN
SUPPORT
FINANCE
LOYALTY_ADMIN
SYSTEM_ADMIN
```

Roles should be meaningful and limited.

Avoid:

```text
ADMIN
```

for every privileged function.

---

# 395 — Permission-Based Authorization

Fine-grained permissions may include:

```text
orders.read.own
orders.read.any
orders.update.status
payments.refund
wallet.adjust
loyalty.manage
missions.manage
users.support.read
```

Roles can map to permissions.

---

# 396 — Scope-Based Authorization

OAuth2 scopes may include:

```text
orders.read
orders.write
wallet.read
wallet.reserve
wallet.capture
loyalty.read
loyalty.write
```

Scopes are especially useful for:

```text
Service clients
Partner integrations
Machine clients
```

---

# 397 — Resource Ownership Authorization

Example:

```text
USER
  ↓
GET /orders/ORD001
```

Application checks:

```text
order.customer_id == authenticated customer
```

Do not rely only on:

```text
role == USER
```

---

# 398 — Business Authorization

Some authorization depends on business state.

Example:

```text
Store Manager
```

may change orders only for:

```text
their assigned store
```

This belongs in application/domain authorization logic.

---

# 399 — Authorization Decision Flow

Recommended:

```text
Request
  ↓
Authentication valid?
  ↓
Required scope/role?
  ↓
Resource ownership?
  ↓
Business policy?
  ↓
Allow / Deny
```

---

# 400 — Deny by Default

If no explicit permission exists:

```text
DENY
```

Do not implement:

```text
allow unless blocked
```

for sensitive APIs.

---

# 401 — Service-to-Service Authentication

Internal services must authenticate each other.

Possible mechanisms:

```text
OAuth2 Client Credentials
mTLS
Service Mesh Identity
Signed Service JWT
```

Do not use a shared hard-coded API key across all services.

---

# 402 — Service Identity

Every service should have a unique identity.

Examples:

```text
order-service
wallet-service
payment-service
loyalty-service
```

Identity should map to:

```text
allowed audiences
allowed scopes
network policy
secret access
```

---

# 403 — Service Account Least Privilege

Example:

```text
order-service
```

may have:

```text
wallet.reserve
payment.create
catalog.read
```

but not:

```text
wallet.admin
identity.admin
cluster.admin
```

---

# 404 — Mutual TLS

mTLS provides:

```text
Encryption
Server authentication
Client authentication
```

Flow:

```text
Service A certificate
        ↓
TLS handshake
        ↓
Service B verifies A
        ↓
Service A verifies B
```

---

# 405 — mTLS Certificate Rotation

Certificates should be automatically rotated where possible.

Possible solutions:

```text
Service mesh
cert-manager
SPIFFE/SPIRE
Cloud workload identity platform
```

Avoid manual long-lived certificates.

---

# 406 — Internal Network Trust

Even with mTLS, use:

```text
NetworkPolicy
Service authorization
Least privilege
```

mTLS alone does not determine which operations are allowed.

---

# 407 — API Gateway Security

Gateway responsibilities:

```text
TLS termination
Authentication pre-check
Rate limiting
Request size limits
Basic schema enforcement
Request ID
CORS
WAF integration
Routing
```

Gateway must not replace service-level authorization.

---

# 408 — Defense in Depth

Example:

```text
WAF
  ↓
Gateway rate limit
  ↓
JWT validation
  ↓
Service authorization
  ↓
Domain rule
  ↓
Database constraint
```

Multiple layers protect critical actions.

---

# 409 — Password Security

If the platform stores passwords, use strong password hashing.

Recommended:

```text
Argon2id
```

or:

```text
bcrypt
```

with appropriate cost.

Never store:

```text
Plain text password
Reversible encrypted password
Weak unsalted hash
```

---

# 410 — Password Policy

Password policy should balance security and usability.

Possible rules:

```text
Minimum length
Known-breached password blocking
Rate limiting
No forced periodic rotation unless risk requires
MFA for privileged users
```

Avoid relying only on complexity such as:

```text
one uppercase
one symbol
one number
```

if it leads to predictable passwords.

---

# 411 — Password Reset Architecture

Flow:

```text
User requests reset
      ↓
Rate limit
      ↓
Generate reset challenge / OTP
      ↓
Deliver through verified channel
      ↓
Verify challenge
      ↓
Issue short-lived reset authorization
      ↓
Set new password
      ↓
Invalidate reset token
      ↓
Optionally revoke existing sessions
```

---

# 412 — Password Reset Token

Properties:

```text
Single use
Short-lived
Cryptographically random or signed
Bound to user
Stored securely
Not logged
```

---

# 413 — Password Reset Rate Limiting

Protect by:

```text
Identifier
IP
Device/session where possible
```

Use:

```text
Cooldown
Short-window limit
Daily limit
Abuse detection
```

The exact thresholds should be configurable.

---

# 414 — OTP Security

OTP should have:

```text
Short expiry
Attempt limit
Single-use behavior
Secure random generation
Rate limiting
```

Do not reveal whether an account exists where enumeration risk matters.

---

# 415 — Account Enumeration Protection

Instead of:

```text
Email not registered
```

consider:

```text
If the account exists, reset instructions have been sent.
```

Use where security requirements justify.

---

# 416 — Multi-Factor Authentication

Recommended for:

```text
System administrators
Finance users
Security-sensitive admins
Production access
High-risk operations
```

Possible factors:

```text
TOTP
WebAuthn / passkeys
Hardware security keys
Push approval
```

Avoid SMS as the strongest available factor where stronger options are practical.

---

# 417 — Step-Up Authentication

High-risk actions may require recent authentication.

Examples:

```text
Change password
Change phone/email
Large wallet adjustment
Refund above threshold
Disable MFA
Change security settings
```

---

# 418 — Admin Security

Admin interfaces should have stricter controls.

Recommended:

```text
MFA
Shorter session lifetime
Restricted IP/VPN where appropriate
Detailed audit logs
Higher authorization granularity
No shared accounts
Privileged access review
```

---

# 419 — Privileged Access

Production access should be:

```text
Named
Audited
Time-limited where possible
Least privilege
MFA-protected
```

Avoid shared:

```text
root
admin
production
```

accounts.

---

# 420 — Secrets Management

Secrets include:

```text
DB passwords
API keys
OAuth client secrets
Private keys
Kafka credentials
Redis passwords
Webhook secrets
Provider credentials
```

Secrets must not be stored in source code.

---

# 421 — Secret Storage

Preferred secret stores:

```text
HashiCorp Vault
AWS Secrets Manager
Azure Key Vault
Google Secret Manager
```

Kubernetes integration:

```text
External Secrets Operator
CSI Secret Store
Workload identity
```

---

# 422 — Kubernetes Secrets

Plain Kubernetes Secrets are base64-encoded, not inherently encrypted at rest unless cluster encryption is configured.

Do not treat base64 as security.

Production should use:

```text
Encryption at rest
RBAC
Restricted access
External secret integration
```

---

# 423 — Secret Rotation

Every secret should define:

```text
Owner
Rotation frequency
Rotation method
Dependent systems
Emergency rotation procedure
```

Examples:

```text
DB password
Signing key
Provider API key
Webhook secret
```

---

# 424 — Secret Rotation Without Downtime

Preferred pattern:

```text
Add new credential
      ↓
Services accept old + new where possible
      ↓
Switch producers/clients
      ↓
Verify
      ↓
Revoke old credential
```

---

# 425 — Key Management

Cryptographic keys require separate handling.

Examples:

```text
JWT private signing key
Encryption key
mTLS private key
Webhook verification key
```

Prefer managed KMS/HSM for high-value keys.

---

# 426 — Encryption in Transit

All production traffic should use TLS.

Includes:

```text
Client → Gateway
Service → Service
Service → Database where supported
Service → Kafka
Service → Redis
Service → External provider
```

---

# 427 — TLS Policy

Define:

```text
Minimum TLS version
Approved cipher suites
Certificate authority
Certificate validity
Rotation
Hostname verification
```

Avoid outdated TLS versions.

---

# 428 — Encryption at Rest

Protect sensitive data at rest.

Possible layers:

```text
Disk encryption
Database encryption
Object storage encryption
Backup encryption
Application-level field encryption
```

Not every field needs application-level encryption.

Use risk-based classification.

---

# 429 — Field-Level Encryption

Consider for highly sensitive data.

Examples:

```text
Government identifier
Sensitive provider credential
Highly confidential PII
```

Requirements:

```text
Key rotation
Search limitations
Backup behavior
Access controls
Auditability
```

---

# 430 — Data Classification

Recommended classes:

```text
PUBLIC
INTERNAL
CONFIDENTIAL
RESTRICTED
```

Examples:

| Data | Classification |
|---|---|
| Product catalog | PUBLIC / INTERNAL |
| Internal service config | INTERNAL |
| Customer profile | CONFIDENTIAL |
| Order history | CONFIDENTIAL |
| Wallet ledger | RESTRICTED |
| Refresh token | RESTRICTED |
| Private signing key | RESTRICTED |

---

# 431 — PII Protection

Personally identifiable information should be minimized.

Rules:

```text
Collect only necessary fields
Define purpose
Restrict access
Mask where appropriate
Limit retention
Avoid logging
Encrypt where required
Audit access for sensitive data
```

---

# 432 — Sensitive Logging

Never log:

```text
Passwords
OTP
Access token
Refresh token
Private key
Raw card credentials
Secret API key
```

Mask:

```text
Phone number
Email
Member card
Payment reference
```

where appropriate.

---

# 433 — Log Redaction

Central logging pipeline should support redaction.

Example:

```text
Authorization: Bearer ***
phone: 0******789
card: ****1234
```

Redaction should happen as close to source as possible.

---

# 434 — Audit Logging

Security/business-sensitive actions require audit events.

Examples:

```text
Login success/failure
Password reset
Role change
Wallet adjustment
Payment refund
Manual reward assignment
Mission rule change
Admin data access
Secret rotation
Production deployment
```

---

# 435 — Audit Event Fields

Recommended:

```text
event_id
actor_id
actor_type
action
resource_type
resource_id
result
reason
request_id
correlation_id
source_ip
user_agent
occurred_at
```

Sensitive content must still be minimized.

---

# 436 — Audit Immutability

Audit logs should be append-only where practical.

Do not allow normal application users to:

```text
UPDATE
DELETE
```

security audit history.

Retention policy must be defined.

---

# 437 — Security Event Monitoring

Monitor for:

```text
Repeated login failures
OTP abuse
Token reuse
Privilege escalation
Unexpected admin actions
High refund volume
Large wallet adjustments
Rate limit spikes
WAF blocks
Secret access anomalies
```

---

# 438 — Rate Limiting

Rate limiting protects:

```text
Authentication
Password reset
OTP verification
Public API
Partner API
Expensive search/report endpoints
```

Possible dimensions:

```text
IP
User
Device
Token
Client ID
Endpoint
```

---

# 439 — Rate Limit Architecture

Example:

```text
Client
  ↓
API Gateway
  ↓
Redis-backed rate limiter
  ↓
Service
```

Sensitive service-specific limits may also exist inside the service.

---

# 440 — Rate Limit Response

Use:

```text
429 Too Many Requests
```

with:

```http
Retry-After: 30
```

and stable error:

```text
RATE_LIMITED
```

---

# 441 — Brute Force Protection

Login protection may include:

```text
Rate limit
Progressive delay
Temporary account lock
Risk scoring
MFA challenge
IP reputation
```

Avoid permanent lockout that attackers can abuse for denial of service.

---

# 442 — Web Application Firewall

For public APIs, consider WAF protections for:

```text
Known attack signatures
Bots
Abusive traffic
Malformed requests
Common injection attempts
```

WAF does not replace application validation.

---

# 443 — Input Validation Security

Validate all external input.

Examples:

```text
Length
Type
Format
Range
Enum
Object size
Array size
File type
File size
```

Reject malformed input early.

---

# 444 — SQL Injection Protection

Use parameterized queries.

Correct:

```sql
SELECT *
FROM orders
WHERE id = ?
```

Avoid string concatenation of untrusted input.

ORM does not automatically make every dynamic query safe.

---

# 445 — XSS Protection

For web output:

```text
Escape untrusted content
Use safe templating
Apply CSP
Avoid injecting raw HTML
```

API-only services should still avoid returning unsafe HTML fragments unexpectedly.

---

# 446 — CSRF Protection

If authentication uses cookies, evaluate CSRF protection.

Use:

```text
SameSite cookies
CSRF tokens
Origin checks
```

Bearer-token APIs may have different exposure.

---

# 447 — SSRF Protection

Services making outbound requests must prevent arbitrary URL access.

Do not allow user input to freely control:

```text
protocol
host
port
internal address
metadata endpoints
```

Use allowlists where possible.

---

# 448 — File Upload Security

For uploads:

```text
Validate MIME type
Validate extension
Limit size
Store outside executable path
Generate safe filename
Malware scan where appropriate
Restrict access
Use object storage
```

Do not trust client filename.

---

# 449 — Path Traversal Protection

Never concatenate untrusted path input directly.

Normalize and restrict access to allowed directories.

---

# 450 — Deserialization Security

Avoid unsafe polymorphic deserialization.

Validate:

```text
JSON types
Protobuf schema
Event schema
```

Do not deserialize arbitrary classes from untrusted payloads.

---

# 451 — Mass Assignment Protection

Do not bind request payload directly to persistence entities.

Bad:

```text
Request → JPA Entity → save
```

Use:

```text
Request DTO
   ↓
Command
   ↓
Domain
```

This prevents unauthorized field updates.

---

# 452 — API Request Size Limits

Set limits for:

```text
Body size
Header size
Array size
File size
```

Prevent memory/CPU abuse.

---

# 453 — Timeout Security

Timeouts also protect against resource exhaustion.

Set:

```text
HTTP timeouts
gRPC deadlines
DB query timeout
External provider timeout
```

---

# 454 — CORS

CORS must explicitly define allowed origins.

Avoid:

```text
Access-Control-Allow-Origin: *
```

for authenticated sensitive APIs unless intentionally safe.

---

# 455 — Security Headers

For web applications/gateway:

```text
Strict-Transport-Security
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Legacy headers may be used where relevant.

---

# 456 — Content Security Policy

CSP reduces browser injection risk.

Example concept:

```text
default-src 'self'
script-src 'self'
object-src 'none'
frame-ancestors 'none'
```

Exact policy depends on frontend architecture.

---

# 457 — Cookie Security

Sensitive cookies should use:

```text
Secure
HttpOnly
SameSite
```

Define:

```text
Domain
Path
Expiry
Rotation
```

---

# 458 — API Key Security

If partner API keys are used:

```text
Unique per partner
Scoped
Rotatable
Hashed at rest where verification allows
Rate limited
Audited
```

Do not use one global partner key.

---

# 459 — Webhook Security

Webhook security should include:

```text
Signature verification
Timestamp verification
Replay protection
Event idempotency
Rate limiting
Source monitoring
```

---

# 460 — Replay Attack Protection

Possible controls:

```text
Nonce
Timestamp window
Event ID uniqueness
Idempotency key
Signature over timestamp + payload
```

---

# 461 — Kafka Security

Kafka production security should include:

```text
Authentication
TLS
ACLs
Topic permissions
Consumer-group permissions
Secret rotation
Monitoring
```

A service should only access required topics.

---

# 462 — Kafka ACL Example

```text
order-service
  WRITE order.*

loyalty-service
  READ order.completed
  WRITE loyalty.*

notification-service
  READ notification.requested
```

Avoid broad:

```text
READ/WRITE *
```

---

# 463 — Redis Security

Redis controls:

```text
Private network
Authentication
TLS where supported
ACLs
No public exposure
Command restrictions where appropriate
```

Do not expose Redis directly to the internet.

---

# 464 — Database Security

Database controls:

```text
Separate service credentials
Least privilege
TLS
No public exposure
Audit sensitive operations
Credential rotation
Backup encryption
```

---

# 465 — Database User per Service

Example:

```text
order_service_user
wallet_service_user
loyalty_service_user
```

Each user gets access only to owned schema/database.

---

# 466 — Read-Only Accounts

Create separate read-only identities for:

```text
Reporting
Support
Analytics
Troubleshooting
```

Do not give unnecessary write access.

---

# 467 — Database Administrative Access

Production DBA access should be:

```text
Named
MFA protected
Audited
Time-limited where possible
```

Avoid sharing root credentials.

---

# 468 — Kubernetes RBAC

Use Kubernetes RBAC to limit:

```text
Who can deploy
Who can read secrets
Who can exec into pods
Who can change namespaces
Who can modify network policies
```

Application service accounts should not have cluster-admin.

---

# 469 — Kubernetes Service Accounts

Each workload should have a dedicated service account.

Example:

```text
order-service-sa
wallet-service-sa
```

Do not use:

```text
default
```

service account for everything.

---

# 470 — Kubernetes Network Policies

Default approach:

```text
Deny by default
```

Then allow explicit communication.

Example:

```text
order-service
   → wallet-service
   → payment-service
   → catalog-service
```

Notification service should not access Wallet DB.

---

# 471 — Pod Security

Recommended controls:

```text
runAsNonRoot
readOnlyRootFilesystem
allowPrivilegeEscalation: false
drop capabilities
seccomp
resource limits
```

---

# 472 — Non-Root Containers

Application containers should run as non-root.

Example:

```dockerfile
USER appuser
```

Avoid UID 0.

---

# 473 — Read-Only Root Filesystem

Where possible:

```yaml
securityContext:
  readOnlyRootFilesystem: true
```

Use writable volumes only where needed.

---

# 474 — Linux Capabilities

Drop unnecessary capabilities.

Example:

```yaml
capabilities:
  drop:
    - ALL
```

Add only what is specifically required.

---

# 475 — Privileged Containers

Avoid:

```yaml
privileged: true
```

for application workloads.

Any exception requires explicit security review.

---

# 476 — Image Security

Container images should:

```text
Use minimal trusted base image
Run non-root
Use fixed version
Be scanned
Avoid unnecessary tools
Avoid embedded secrets
```

---

# 477 — Image Signing

For higher assurance, sign container images.

Possible tools:

```text
cosign
Sigstore
```

Admission policy can verify trusted signatures.

---

# 478 — Dependency Security

Scan application dependencies.

Examples:

```text
Maven dependencies
npm dependencies
Container base images
OS packages
```

Tools may include:

```text
OWASP Dependency Check
Trivy
GitLab Dependency Scanning
```

---

# 479 — Software Bill of Materials

Generate SBOM where practical.

Formats:

```text
CycloneDX
SPDX
```

SBOM helps:

```text
Vulnerability response
Supply-chain visibility
Compliance
```

---

# 480 — Secret Scanning

CI should detect accidental secrets.

Examples:

```text
Private keys
API tokens
Passwords
Cloud credentials
```

A detected secret should be rotated, not only removed from Git.

---

# 481 — Static Application Security Testing

SAST should run in CI.

Detect:

```text
Injection risk
Unsafe crypto
Insecure API use
Hard-coded secrets
Authorization mistakes where detectable
```

SAST findings require triage.

---

# 482 — Dynamic Application Security Testing

DAST may test deployed environments for:

```text
Authentication flaws
Injection
Security headers
Session issues
Broken access controls
```

Run against controlled test environments.

---

# 483 — Software Composition Analysis

SCA identifies vulnerable third-party libraries.

Policy should define:

```text
Severity threshold
Exception process
Patch timeline
Ownership
```

---

# 484 — Threat Modeling

Perform threat modeling for critical capabilities.

Suggested method:

```text
STRIDE
```

Categories:

```text
Spoofing
Tampering
Repudiation
Information Disclosure
Denial of Service
Elevation of Privilege
```

---

# 485 — Threat Model: Authentication

Threats:

```text
Credential stuffing
Brute force
Token theft
Refresh token replay
Account enumeration
Session hijacking
```

Controls:

```text
Rate limits
MFA
Short-lived tokens
Refresh rotation
Secure storage
Audit events
```

---

# 486 — Threat Model: Wallet

Threats:

```text
Duplicate top-up
Double spend
Unauthorized adjustment
Replay
Race condition
Ledger tampering
Reconciliation mismatch
```

Controls:

```text
Idempotency
Strong consistency
Unique constraints
Audit logging
Least privilege
Reconciliation
Concurrency control
```

---

# 487 — Threat Model: Payment

Threats:

```text
Forged provider callback
Duplicate callback
Refund abuse
Unauthorized capture
Provider credential theft
```

Controls:

```text
Webhook signature
Idempotency
RBAC
Audit logging
Secret rotation
Provider reconciliation
```

---

# 488 — Threat Model: Loyalty

Threats:

```text
Duplicate earn
Unauthorized points adjustment
Reward abuse
Coupon replay
Mission farming
```

Controls:

```text
Event idempotency
Usage limits
Audit logs
Eligibility checks
Fraud monitoring
```

---

# 489 — Threat Model: Admin Portal

Threats:

```text
Account takeover
Privilege escalation
CSRF
XSS
Sensitive data exposure
Dangerous bulk actions
```

Controls:

```text
MFA
Strong authorization
CSP
CSRF controls
Audit logging
Confirmation for high-risk operations
```

---

# 490 — Abuse and Fraud Controls

Security is not only technical attack prevention.

Business abuse controls may include:

```text
Top-up velocity checks
Refund limits
Coupon usage limits
Mission anti-farming
Reward claim limits
Unusual device activity
Rapid account creation
```

These controls belong partly to security and partly to business domains.

---

# 491 — Security Event Severity

Example classification:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

Examples:

```text
Failed login → LOW/INFO
Repeated token replay → HIGH
Private key exposure → CRITICAL
Unauthorized wallet adjustment → CRITICAL
```

---

# 492 — Security Alerts

Create alerts for:

```text
High authentication failures
Admin login from unusual location
Repeated forbidden access
Unexpected wallet adjustment
Spike in refunds
Secret access anomalies
WAF attack spike
JWT validation failures
Certificate expiry
```

---

# 493 — Security Incident Response

Flow:

```text
Detect
  ↓
Triage
  ↓
Contain
  ↓
Eradicate
  ↓
Recover
  ↓
Review
  ↓
Prevent recurrence
```

---

# 494 — Credential Compromise Procedure

If credential is suspected compromised:

```text
Revoke credential
Rotate secret/key
Invalidate sessions if needed
Review audit logs
Identify affected systems
Restore trusted state
Document incident
```

---

# 495 — Signing Key Compromise

If JWT private key is compromised:

```text
Stop using key
Publish replacement key
Rotate signing key immediately
Revoke/expire affected sessions where possible
Review token abuse
Remove compromised key
Perform incident review
```

This is a high-severity incident.

---

# 496 — Secret Exposure in Git

Required actions:

```text
Assume exposed
Rotate secret
Remove from current code
Remove from history if necessary
Review use
Add scanning rule
Document incident
```

Deleting the line is not enough.

---

# 497 — Security Configuration as Code

Security controls should be versioned.

Examples:

```text
NetworkPolicy
RBAC
WAF rules
Gateway policies
Secret access policies
Kubernetes securityContext
```

Review through merge requests.

---

# 498 — Environment Isolation

Security boundaries between:

```text
DEV
UAT
PROD
```

must be explicit.

Do not share:

```text
production secrets
production databases
production service accounts
```

with non-production environments.

---

# 499 — Production Data in Non-Production

Avoid copying raw production PII to DEV/UAT.

If necessary:

```text
Mask
Tokenize
Anonymize
Minimize
```

Access must be controlled.

---

# 500 — Backup Security

Backups may contain the entire sensitive dataset.

Protect with:

```text
Encryption
Restricted access
Retention
Immutability where required
Offsite protection
Restore audit
```

---

# 501 — Disaster Recovery Security

DR environment must preserve:

```text
Identity controls
Secret controls
RBAC
Network policies
Encryption
Audit logging
```

Do not weaken security during recovery.

---

# 502 — API Gateway Authentication Flow

Example:

```text
Client
  ↓ Bearer token
API Gateway
  ↓ basic validation
Service
  ↓ full audience/scope/authorization validation
Application
  ↓ resource/business authorization
```

The service remains responsible for protecting its business operation.

---

# 503 — Service Authentication Flow

Example:

```text
order-service
   ↓ service token
wallet-service
   ↓
Validate:
issuer
audience
expiry
scope
service identity
   ↓
Allow ReserveFunds
```

---

# 504 — Kafka Producer Identity

Producer identity should be authenticated.

Example:

```text
order-service
```

can write:

```text
order.created
order.completed
```

but should not write:

```text
wallet.ledger.changed
```

---

# 505 — Kafka Consumer Identity

Consumer permissions should be scoped.

Example:

```text
loyalty-service
```

may read:

```text
order.completed
wallet.topup.completed
```

but not sensitive unrelated topics.

---

# 506 — Database Access Flow

Example:

```text
wallet-service
    ↓
wallet_service_user
    ↓
wallet_db only
```

No direct:

```text
wallet_service_user
    ↓
identity_db
```

---

# 507 — Sensitive Operation Confirmation

High-risk administrative actions may require:

```text
Reason
Second confirmation
MFA step-up
Approval
Dual control
```

Examples:

```text
Manual wallet credit
Large refund
Role escalation
Secret export
```

---

# 508 — Dual Control

For very sensitive financial actions:

```text
User A requests
      ↓
User B approves
      ↓
System executes
```

This reduces insider-risk and accidental errors.

---

# 509 — Break-Glass Access

Emergency privileged access may exist.

Requirements:

```text
Rare use
Strong MFA
Time-limited
Fully audited
Immediate alert
Post-use review
```

---

# 510 — Security Ownership

Define ownership:

| Area | Owner |
|---|---|
| Identity Provider | Security / Platform |
| JWT keys | Security / Platform |
| API authorization | Service Owner |
| Secrets | Platform + Service Owner |
| Network policies | Platform |
| Application vulnerabilities | Service Owner |
| Security monitoring | Security / SRE |
| Incident response | Security + Operations |
| Audit policy | Security / Compliance |

---

# 511 — Security Review for New Service

Every new service must document:

```text
Data classification
Authentication
Authorization
Service identity
Secrets
Network dependencies
Database access
Kafka topics
Logging
Audit events
Rate limits
Threat model
```

---

# 512 — Security Review for New Endpoint

Checklist:

- [ ] Authentication required?
- [ ] Authorization defined?
- [ ] Resource ownership checked?
- [ ] Input validation complete?
- [ ] Rate limit needed?
- [ ] Idempotency needed?
- [ ] Sensitive output minimized?
- [ ] Audit log needed?
- [ ] Abuse scenario considered?
- [ ] Error response safe?

---

# 513 — Security Review for New Event

Checklist:

- [ ] Producer is authoritative owner.
- [ ] Topic ACLs defined.
- [ ] Sensitive data minimized.
- [ ] PII reviewed.
- [ ] Consumer idempotency defined.
- [ ] Retention reviewed.
- [ ] Schema versioned.
- [ ] Correlation metadata included.
- [ ] Replay impact considered.

---

# 514 — Security Review for New Database Table

Checklist:

- [ ] Owning service defined.
- [ ] Sensitive columns classified.
- [ ] Encryption needed?
- [ ] Audit needed?
- [ ] Retention defined?
- [ ] Unique constraints protect invariants?
- [ ] Database role access limited?
- [ ] Backup impact considered?

---

# 515 — Security Review for External Integration

Checklist:

- [ ] Provider authentication documented.
- [ ] Secret storage defined.
- [ ] TLS validation enabled.
- [ ] Timeout defined.
- [ ] Signature validation defined.
- [ ] Replay protection defined.
- [ ] Provider IP allowlist used only as supplemental control.
- [ ] Error handling secure.
- [ ] Sensitive logging disabled.
- [ ] Reconciliation defined.

---

# 516 — Security Testing Strategy

Security testing includes:

```text
Unit security tests
Authorization tests
Integration security tests
Contract security tests
SAST
SCA
Container scan
Secret scan
DAST
Penetration testing
Threat-model review
```

---

# 517 — Authentication Tests

Test:

```text
Missing token
Expired token
Wrong issuer
Wrong audience
Invalid signature
Revoked session
Insufficient scope
Wrong role
```

---

# 518 — Authorization Tests

Test:

```text
User accesses own resource
User accesses another user's resource
Support accesses allowed resource
Support accesses restricted resource
Admin access
Privilege escalation attempt
```

---

# 519 — Rate Limit Tests

Test:

```text
Within limit
At limit
Above limit
Retry-After
Multiple IPs
Multiple users
Distributed instances
```

---

# 520 — Idempotency Security Tests

Test replay:

```text
Same request + same key
Same key + changed amount
Same provider callback repeated
Same event repeated
```

Verify no duplicate financial effect.

---

# 521 — Security Regression Tests

Every fixed security issue should receive a regression test where practical.

This prevents recurrence.

---

# 522 — Penetration Testing

Before major production launch, test:

```text
Authentication bypass
Authorization bypass
IDOR/BOLA
SQL injection
XSS
CSRF
SSRF
JWT abuse
Rate limiting
File upload
Privilege escalation
Sensitive data exposure
Webhook forgery
```

---

# 523 — Broken Object Level Authorization

A major API risk:

```text
GET /orders/ORD002
```

must verify the caller is allowed to access `ORD002`.

Do not assume:

```text
authenticated = authorized
```

---

# 524 — Broken Function Level Authorization

Example:

```text
POST /admin/wallet-adjustment
```

must enforce privileged permission.

Hiding the button in UI is not authorization.

---

# 525 — Security Response Consistency

Avoid leaking internal differences.

Example:

```text
Database exception
Stack trace
SQL query
Internal hostname
```

must not be returned to client.

Use stable error contracts.

---

# 526 — Stack Trace Handling

Production responses should never include raw stack traces.

Stack traces may be logged internally with:

```text
request_id
correlation_id
```

and sensitive data redaction.

---

# 527 — Security Logging vs Privacy

Do not over-log.

Security monitoring must balance:

```text
Detection
Auditability
Privacy
Data minimization
```

Example:

Store:

```text
user_id
source_ip
result
```

but not:

```text
password
OTP
full token
```

---

# 528 — Retention Policy

Define retention separately for:

```text
Authentication logs
Audit logs
Application logs
Access logs
Security alerts
Backups
```

Retention should satisfy operational, legal, and privacy requirements.

---

# 529 — Data Deletion

Where data deletion is required:

```text
Identify authoritative service
Delete or anonymize eligible data
Propagate deletion to projections
Respect legal retention exceptions
Audit the operation
```

Financial ledgers may require retention instead of deletion.

---

# 530 — Tokenization

For some sensitive identifiers, tokenization may reduce exposure.

Example:

```text
Raw identifier
   ↓ vault/token service
Token
   ↓
Business systems
```

Use only where complexity is justified.

---

# 531 — Security Architecture for Wallet

Wallet security requirements:

```text
Strong service identity
Restricted DB account
No direct external DB access
Idempotency
Immutable ledger
Concurrency protection
Audit events
Reconciliation
Strict admin permissions
Sensitive monitoring
```

---

# 532 — Security Architecture for Payment

Payment security requirements:

```text
Provider secret isolation
Webhook verification
Idempotency
Refund authorization
Audit logs
Reconciliation
No raw sensitive payment credentials in logs
```

---

# 533 — Security Architecture for Identity

Identity requirements:

```text
Password hashing
MFA support
Token rotation
Session revocation
Rate limiting
Audit logs
Key rotation
Account recovery
Enumeration protection
```

---

# 534 — Security Architecture for Loyalty

Loyalty requirements:

```text
Earn idempotency
Redeem authorization
Points adjustment auditing
Coupon replay prevention
Reward abuse detection
Mission anti-farming
```

---

# 535 — Security Architecture for Notification

Notification service must protect:

```text
Device tokens
Email addresses
Phone numbers
Templates containing PII
Provider API credentials
```

Do not allow arbitrary template injection by untrusted callers.

---

# 536 — Security Architecture for Integration Service

Integration service is high-risk because it connects trust zones.

Requirements:

```text
Strict outbound allowlist
Provider-specific credentials
Anti-corruption mapping
Strong logging
Sensitive data controls
Timeouts
Signature verification
Replay protection
```

---

# 537 — Security Architecture for API Gateway

Gateway should enforce:

```text
TLS
Authentication pre-check
Rate limits
Request size
CORS
WAF
Known route allowlist
Observability
```

Do not store business secrets in gateway config unnecessarily.

---

# 538 — Security Architecture for Admin Portal

Admin portal:

```text
MFA
Short session
Strong RBAC
Audit trails
CSP
CSRF protection where relevant
Secure cookies
No shared accounts
Restricted high-risk operations
```

---

# 539 — Security Architecture for CI/CD

CI/CD identities can deploy code and therefore are highly privileged.

Controls:

```text
Protected branches
Protected environments
Short-lived deployment credentials
Secret masking
Runner isolation
Artifact integrity
Approval gates
Audit logs
```

---

# 540 — CI/CD Secret Handling

Do not print secrets in job logs.

Use:

```text
masked variables
protected variables
external secret manager
OIDC workload identity
```

Prefer short-lived cloud credentials over static keys.

---

# 541 — Production Deployment Authorization

Production deployment may require:

```text
Merge approval
Successful security scans
Manual approval
Protected environment
Authorized deployer
```

Exact policy depends on organizational maturity.

---

# 542 — Supply Chain Security

Protect:

```text
Source repository
Build runner
Dependencies
Container registry
Artifacts
Deployment manifests
```

Possible controls:

```text
Signed commits/tags where required
Protected branches
SBOM
Image signing
Immutable image tags
Registry access control
```

---

# 543 — Immutable Container Images

Production deployment should use immutable image identifiers:

```text
1.3.7
```

or:

```text
sha256 digest
```

Avoid relying on mutable:

```text
latest
```

---

# 544 — Registry Security

Container registry controls:

```text
Authentication
RBAC
Vulnerability scanning
Retention
Immutability
Audit logs
```

---

# 545 — Security Baseline Configuration

Every service must have:

```text
Authentication
Authorization
TLS
Structured logging
No sensitive logs
Rate limits where needed
Health endpoint restrictions
Dependency scanning
Container scanning
Non-root container
```

---

# 546 — Health Endpoint Security

Do not expose excessive internal data from health endpoints.

Public:

```text
healthy / unhealthy
```

Internal:

```text
dependency details
```

should be restricted.

---

# 547 — Metrics Endpoint Security

Prometheus metrics may expose:

```text
internal paths
service names
business counters
```

Do not expose metrics publicly without control.

---

# 548 — Debug Endpoint Security

Disable or protect:

```text
debug endpoints
heap dumps
thread dumps
environment endpoints
config dumps
```

in production.

---

# 549 — Spring Boot Actuator Security

Review exposed endpoints.

Prefer only required endpoints:

```text
health
prometheus
info if safe
```

Do not expose:

```text
env
beans
heapdump
configprops
```

publicly.

---

# 550 — Error Page Security

Default framework error pages should not expose stack traces, paths, or internal details.

Use controlled error response.

---

# 551 — Dependency Failure Security

When a dependency fails:

```text
Fail safely
Do not bypass authorization
Do not grant access by default
```

Example:

If permission service fails:

```text
deny or use defined safe fallback
```

not:

```text
allow everyone
```

---

# 552 — Security Feature Flags

Security controls should not be easily disabled by general feature flags.

Any emergency bypass must be:

```text
Explicit
Time-limited
Audited
Restricted
```

---

# 553 — Clock Security

JWT, OTP, signature timestamps, and replay controls depend on time.

Infrastructure should maintain accurate time synchronization.

Large clock drift can break:

```text
Token validation
Signature validation
Expiry rules
Audit sequence
```

---

# 554 — Random Number Security

Security-sensitive randomness must use a cryptographically secure generator.

Examples:

```text
OTP
Reset token
Nonce
API key
Session identifier
```

Do not use predictable random generators.

---

# 555 — API Key Generation

Generate high-entropy keys.

Store only securely.

Where verification allows, store:

```text
hash(api_key)
```

instead of raw key.

Show raw value only at creation.

---

# 556 — Sensitive Comparison

For secrets/signatures, use constant-time comparison where applicable.

This reduces timing side-channel risk.

---

# 557 — Security Documentation

Maintain:

```text
Security architecture
Threat models
Trust boundaries
Authentication flows
Authorization matrix
Secret inventory
Key inventory
Incident runbooks
Security contacts
```

---

# 558 — Security Runbooks

Create runbooks for:

```text
Token signing key compromise
Credential leak
Admin account compromise
Webhook forgery
Brute-force attack
DDoS / abuse spike
Unauthorized wallet transaction
Secret rotation
Certificate expiry
```

---

# 559 — Security Metrics

Track:

```text
Failed logins
MFA challenges
Token refresh failures
403 rate
429 rate
WAF blocks
Security alerts
Secret rotation age
Certificate expiry days
Critical vulnerabilities
Patch age
```

---

# 560 — Security SLO / SLA Considerations

Examples:

```text
Critical secret rotation after compromise: immediate
Critical vulnerability patch: defined emergency window
Certificate renewal: before threshold
Security alert triage: defined response target
```

Exact targets belong to operational policy.

---

# 561 — Security Exceptions

If a security standard cannot be met:

1. Document exception.
2. Explain business reason.
3. Identify risk.
4. Define compensating controls.
5. Set expiry date.
6. Assign owner.
7. Re-review.

Permanent undocumented exceptions are not acceptable.

---

# 562 — Security Decision Record

Security decisions should be recorded as ADRs.

Examples:

```text
ADR-SEC-001 JWT signing algorithm
ADR-SEC-002 Service authentication strategy
ADR-SEC-003 Secret manager selection
ADR-SEC-004 MFA requirement for administrators
ADR-SEC-005 Data encryption policy
```

---

# 563 — Security Ownership Matrix

Example:

| Control | Primary Owner | Supporting Owner |
|---|---|---|
| User authentication | Identity Team | Security |
| JWT signing keys | Security/Platform | Identity Team |
| Endpoint authorization | Service Team | Security |
| Kubernetes RBAC | Platform | Security |
| Network policies | Platform | Service Team |
| Secrets | Platform | Service Team |
| Vulnerability remediation | Service Team | Security |
| Audit logging | Service Team | Security/SRE |
| Incident response | Security | SRE/Service Team |

---

# 564 — Security Architecture Review Checklist

## Identity

- [ ] Identity types defined.
- [ ] Identity provider selected.
- [ ] User and service identities separated.

## Authentication

- [ ] OAuth2/OIDC flow defined.
- [ ] Access-token lifetime defined.
- [ ] Refresh-token rotation defined.
- [ ] MFA policy defined.

## Authorization

- [ ] Roles/scopes defined.
- [ ] Resource ownership enforced.
- [ ] Admin permissions separated.
- [ ] Deny-by-default policy followed.

## Tokens

- [ ] JWT signature verified.
- [ ] Issuer/audience validated.
- [ ] Key rotation supported.
- [ ] Tokens excluded from logs.

## Services

- [ ] Service-to-service auth defined.
- [ ] Service identity unique.
- [ ] mTLS or equivalent considered.

## Secrets

- [ ] Secrets not committed.
- [ ] Secret store defined.
- [ ] Rotation defined.

## Data

- [ ] Classification defined.
- [ ] PII minimized.
- [ ] Encryption requirements defined.
- [ ] Backup security defined.

## APIs

- [ ] Rate limits defined.
- [ ] Input validation defined.
- [ ] CORS reviewed.
- [ ] WAF considered.

## Infrastructure

- [ ] Kubernetes RBAC.
- [ ] NetworkPolicy.
- [ ] Non-root container.
- [ ] Read-only root filesystem where possible.
- [ ] Image scanning.

## Monitoring

- [ ] Audit events defined.
- [ ] Security alerts defined.
- [ ] Incident runbooks defined.

---

# 565 — Security Definition of Done

A feature is not security-complete until:

- [ ] Authentication is defined.
- [ ] Authorization is defined.
- [ ] Sensitive data is classified.
- [ ] Logging is reviewed.
- [ ] Input is validated.
- [ ] Abuse/rate limiting is considered.
- [ ] Idempotency/replay is considered.
- [ ] Security tests exist where needed.
- [ ] Audit events are added where required.
- [ ] Secrets are handled correctly.
- [ ] Threats are reviewed.

---

# 566 — PART 06 Deliverables

PART 06 produces:

1. Security principles.
2. Zero-trust model.
3. Trust boundaries.
4. Identity architecture.
5. OAuth2 strategy.
6. OpenID Connect strategy.
7. Access-token policy.
8. Refresh-token policy.
9. Token rotation policy.
10. JWT validation standard.
11. JWT key-rotation standard.
12. Session-management rules.
13. RBAC model.
14. Permission/scopes model.
15. Resource authorization model.
16. Service-to-service authentication.
17. Service identity rules.
18. mTLS requirements.
19. Gateway security responsibilities.
20. Password security.
21. Password-reset security.
22. OTP controls.
23. MFA requirements.
24. Admin-security requirements.
25. Secret-management standard.
26. Key-management standard.
27. TLS policy.
28. Encryption-at-rest guidance.
29. Data classification.
30. PII-protection standard.
31. Sensitive logging standard.
32. Audit logging standard.
33. Rate-limiting standard.
34. Input-validation security.
35. Web/API security controls.
36. Kafka/Redis/DB security.
37. Kubernetes RBAC.
38. Network policies.
39. Pod/container security.
40. Dependency and image scanning.
41. Threat-modeling standard.
42. Security incident response.
43. CI/CD security.
44. Supply-chain security.
45. Security review checklists.
46. Security definition of done.
47. Security ownership matrix.
48. Security exceptions process.

---

# 567 — Exit Criteria

PART 06 is ready when the team can answer:

### Identity

```text
Who are the possible callers?
```

### Authentication

```text
How does each caller prove identity?
```

### Authorization

```text
How is permission evaluated?
```

### Service Identity

```text
How does one service authenticate another?
```

### Tokens

```text
How are access and refresh tokens issued, validated, rotated, and revoked?
```

### Secrets

```text
Where are secrets stored and how are they rotated?
```

### Data

```text
Which data is sensitive and how is it protected?
```

### Infrastructure

```text
How are Kubernetes workloads isolated?
```

### Monitoring

```text
Which security events are audited and alerted?
```

### Incident Response

```text
What happens if a key, token, account, or secret is compromised?
```

If these answers are unclear, production security is not ready.

---

# 568 — Handoff to PART 07

PART 07 defines the platform data architecture.

```text
PART 06
Security Architecture
      ↓
Data classification
Ownership
Encryption requirements
Access controls
      ↓
PART 07
Data Architecture
```

PART 07 will define:

```text
Database-per-service
PostgreSQL standards
Schema ownership
Table design
Primary keys
Foreign keys
Indexes
Constraints
Transactions
Concurrency
Audit tables
History tables
Flyway
Read models
Reporting
Data retention
Data lifecycle
Database scaling
```

---

# PART 06 — Summary

Security is not one component.

It is a set of controls across every layer:

```text
User
  ↓
Identity
  ↓
Authentication
  ↓
Authorization
  ↓
Gateway
  ↓
Service
  ↓
Business Rules
  ↓
Data
  ↓
Infrastructure
```

The core principles are:

```text
Verify identity
      ↓
Check permission
      ↓
Minimize access
      ↓
Protect secrets
      ↓
Protect data
      ↓
Audit sensitive actions
      ↓
Detect abuse
      ↓
Respond to incidents
```

For critical domains such as:

```text
Wallet
Payment
Identity
Loyalty
Admin
```

security must be treated as part of the business architecture, not merely infrastructure configuration.

---

**End of PART 06 — Security Architecture**
