---
title: "PHASE 04 — Identity Service"
---

# PHASE 04 — Identity Service

> **Purpose:** Implement the platform Identity Service as the first complete business microservice using the Project Foundation, Shared Engineering Standards, and Contract Foundation established in Phases 1–3.
>
> **Previous Phase:** Phase 03 — Contract Foundation
>
> **Next Phase:** Phase 05 — Customer Service
>
> **Primary Architecture Basis:** PART 08 — Auth / Identity Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, and PART 07 — Data Architecture.
>
> **Primary Stack:** Java, Spring Boot, Spring Security, PostgreSQL, Flyway, Redis where appropriate, JWT, OAuth2/OIDC concepts.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 4 Goal

Phase 4 builds the first real platform service:

```text
identity-service
```

The Identity Service must answer:

```text
Who is this caller?
Can the caller prove that identity?
What security state does the identity have?
Which roles / permissions are associated with the identity?
Which sessions and credentials are valid?
```

The service owns:

```text
User identity
Credential state
Password authentication
Access token issuance
Refresh token issuance
Session lifecycle
Logout / revocation
Password reset
Role assignment
Permission assignment
Account lock / security state
Authentication security events
Signing-key integration
```

The service does **not** own:

```text
Customer loyalty profile
Customer wallet
Member points
Customer orders
Store menu
Payments
Rewards
Missions
Notification delivery
```

Customer profile data belongs in Customer Service where that boundary is used.

---

# 2. Phase 4 Success State

Phase 4 is complete when this flow works:

```text
Register
   ↓
Login
   ↓
Create Session
   ↓
Issue Access Token
   ↓
Issue Refresh Token
   ↓
Use Access Token
   ↓
Refresh Token Rotation
   ↓
Logout / Revoke Session
```

And this recovery flow works:

```text
Request Password Reset
   ↓
Rate Limit
   ↓
Create Challenge
   ↓
Send OTP / Link
   ↓
Verify Challenge
   ↓
Issue Short-Lived Reset Authorization
   ↓
Set New Password
   ↓
Consume Challenge
   ↓
Revoke Sessions if Policy Requires
   ↓
Audit
```

The service must also support:

```text
List Sessions
Revoke One Session
Revoke All Sessions
Change Password
Role / Permission Administration
Account Disable
Account Re-enable / Unlock
Security Events
JWKS
```

according to the approved Phase 4 scope.

---

# 3. Important Source-Defined Open Decisions

The source architecture intentionally leaves several values/policies configurable.

Do not invent them in code before they are approved.

Freeze these decisions before production implementation.

## 3.1 Canonical Login Identifier

Choose which initial identifiers are supported:

```text
Phone
Email
Username
Member number
```

Each selected identifier requires:

```text
normalization
uniqueness
verification policy
case sensitivity
```

Recommended initial decision record:

```text
Primary identifier: TBD
Secondary identifiers: TBD
Verification required before login: TBD
```

---

## 3.2 Registration Initial Status

Possible Identity states include:

```text
PENDING
ACTIVE
SUSPENDED
LOCKED
DISABLED
```

Registration response examples show:

```text
PENDING
```

but exact activation policy must be approved.

Decision:

```text
Registration creates status:
TBD_POLICY
```

---

# 4. Access Token Lifetime Policy

The source recommends short-lived access tokens and gives an example range:

```text
5–15 minutes
```

Exact lifetime remains policy-controlled.

Decision:

```text
ACCESS_TOKEN_TTL = TBD_POLICY
```

Do not hard-code an example value merely because documentation examples show `900`.

---

# 5. Refresh Token Lifetime Policy

Exact refresh lifetime is not fixed by the architecture.

Decision:

```text
REFRESH_TOKEN_TTL = TBD_POLICY
```

---

# 6. Session Expiry Policy

Sessions may use:

```text
absolute expiry
idle expiry
```

Example concepts are given in architecture, but exact values remain policy-controlled.

Decision:

```text
SESSION_ABSOLUTE_TTL = TBD_POLICY
SESSION_IDLE_TTL = TBD_POLICY
```

---

# 7. Password Policy

The architecture requires:

```text
minimum length
maximum supported length
breached-password screening where available
rate limiting
MFA for privileged users
```

Exact values:

```text
PASSWORD_MIN_LENGTH = TBD_POLICY
PASSWORD_MAX_LENGTH = TBD_POLICY
BREACHED_PASSWORD_CHECK = TBD_POLICY
```

---

# 8. Password Hashing Policy

Preferred algorithm:

```text
Argon2id
```

Alternative where required:

```text
bcrypt
```

Parameters are security-approved configuration.

Decision:

```text
PASSWORD_HASH_ALGORITHM = Argon2id or approved alternative
MEMORY_COST = TBD_SECURITY
ITERATIONS = TBD_SECURITY
PARALLELISM = TBD_SECURITY
```

Do not permanently hard-code weak parameters.

---

# 9. Login Lockout / Throttling Policy

Architecture supports:

```text
progressive throttling
temporary lock
IP/device risk
secondary verification
```

Avoid easy permanent-lock denial of service.

Decision:

```text
LOGIN_RATE_LIMIT = TBD_POLICY
LOCK_THRESHOLD = TBD_POLICY
LOCK_DURATION = TBD_POLICY
PROGRESSIVE_DELAY = TBD_POLICY
```

---

# 10. Password Reset Policy

Configure:

```text
OTP expiry
OTP attempt limit
resend cooldown
short-window request limit
daily request limit
reset authorization lifetime
```

The architecture gives a 30-second resend cooldown only as an example concept.

Decision:

```text
RESET_RESEND_COOLDOWN = TBD_POLICY
RESET_OTP_TTL = TBD_POLICY
RESET_OTP_MAX_ATTEMPTS = TBD_POLICY
RESET_REQUEST_WINDOW_LIMIT = TBD_POLICY
RESET_DAILY_LIMIT = TBD_POLICY
RESET_AUTHORIZATION_TTL = TBD_POLICY
```

---

# 11. JWT Signing Policy

The architecture recommends asymmetric signing and gives:

```text
RS256
```

as an example.

A decision record must freeze:

```text
JWT_SIGNING_ALGORITHM
key source
kid strategy
rotation policy
JWKS exposure
```

Do not store private signing keys in application source.

---

# 12. Identity Provider Strategy

The larger security architecture allows:

```text
Custom Identity Service
or mature external Identity Provider
```

This Phase assumes implementation of the documented custom Identity Service boundary.

Production architecture should still have an ADR documenting why.

Recommended ADR:

```text
ADR-ID-001 Identity provider strategy
```

---

# 13. MFA Scope

MFA, passkeys, trusted devices, and federated identity are documented as future/optional extensions.

Phase 4 baseline may initially implement:

```text
PASSWORD only
```

unless approved scope says otherwise.

Do not accidentally expand Phase 4 into a full passkey/federation project.

---

# 14. Identity Boundary

```text
                Client
                  │
                  ▼
             API Gateway
                  │
                  ▼
          Identity Service
      ┌───────────┼────────────┐
      │           │            │
      ▼           ▼            ▼
 Credential   Session       Role/Permission
  Domain      Domain           Domain
      │           │            │
      └───────────┼────────────┘
                  ▼
              identity_db
```

External systems connect through adapters:

```text
Email/SMS provider
Key/JWKS provider
Security monitoring
Optional external Identity Provider
```

---

# 15. Service Repository Structure

Recommended:

```text
services/
└── identity-service/
    │
    ├── README.md
    ├── Dockerfile
    ├── .dockerignore
    ├── .env.example
    ├── build.gradle.kts
    ├── settings.gradle.kts
    ├── gradlew
    ├── gradlew.bat
    ├── gradle/
    │
    ├── docs/
    │   ├── architecture.md
    │   ├── data.md
    │   ├── errors.md
    │   ├── jwt.md
    │   ├── security.md
    │   └── runbooks.md
    │
    └── src/
        ├── main/
        │   ├── java/
        │   │   └── com/company/identity/
        │   │       ├── IdentityServiceApplication.java
        │   │       │
        │   │       ├── domain/
        │   │       │   ├── identity/
        │   │       │   ├── credential/
        │   │       │   ├── session/
        │   │       │   ├── role/
        │   │       │   ├── event/
        │   │       │   ├── policy/
        │   │       │   └── exception/
        │   │       │
        │   │       ├── application/
        │   │       │   ├── port/
        │   │       │   │   ├── in/
        │   │       │   │   └── out/
        │   │       │   ├── register/
        │   │       │   ├── login/
        │   │       │   ├── refresh/
        │   │       │   ├── logout/
        │   │       │   ├── password/
        │   │       │   ├── session/
        │   │       │   └── role/
        │   │       │
        │   │       ├── adapter/
        │   │       │   ├── in/
        │   │       │   │   ├── rest/
        │   │       │   │   └── grpc/
        │   │       │   │
        │   │       │   └── out/
        │   │       │       ├── persistence/
        │   │       │       ├── redis/
        │   │       │       ├── notification/
        │   │       │       ├── signing/
        │   │       │       └── kafka/
        │   │       │
        │   │       └── config/
        │   │           ├── security/
        │   │           ├── persistence/
        │   │           ├── observability/
        │   │           └── properties/
        │   │
        │   └── resources/
        │       ├── application.yml
        │       ├── application-local.yml
        │       ├── application-test.yml
        │       └── db/migration/
        │
        └── test/
            ├── java/
            │   └── com/company/identity/
            │       ├── domain/
            │       ├── application/
            │       ├── adapter/
            │       ├── integration/
            │       ├── contract/
            │       └── architecture/
            └── resources/
```

---

# 16. Initial Technology Dependencies

Use only approved pinned versions.

Baseline categories:

```text
Spring Boot
Spring Web
Spring Validation
Spring Security
OAuth2 Resource Server support where required
Spring Data JPA
PostgreSQL JDBC
Flyway
Spring Data Redis if Redis is used
Spring Kafka if Identity publishes events through Kafka
Spring Boot Actuator
OpenTelemetry / Micrometer integration
JWT/JWS implementation approved by architecture
JUnit 5
AssertJ
Mockito
Testcontainers PostgreSQL
Testcontainers Redis if used
ArchUnit
```

The architecture allows token signing implementations such as:

```text
Nimbus JOSE + JWT
Spring Authorization Server
JCA
external IdP
```

The exact implementation must be selected and recorded.

---

# 17. Domain Ubiquitous Language

| Term | Meaning |
|---|---|
| User | Platform identity |
| Credential | Secret or cryptographic proof used to authenticate |
| Password Credential | Password-based authentication record |
| Session | Logical authenticated login session |
| Access Token | Short-lived authorization credential |
| Refresh Token | Credential used to obtain a new access token |
| Role | Named permission grouping |
| Permission | Specific allowed capability |
| Scope | OAuth-style capability carried by token/client |
| Account Lock | Security state preventing authentication |
| Revocation | Invalidation of session/token/credential |
| Password Reset Challenge | Short-lived proof used in recovery |
| Security Event | Auditable authentication/security action |

Use these terms consistently in:

```text
Java
API
database documentation
events
logs
tickets
tests
```

---

# 18. Primary Aggregate

Possible aggregate root:

```text
UserIdentity
```

Possible state:

```text
user_id
login identifiers
status
credential status
roles
created_at
locked_until
```

Possible behavior:

```text
activate()
suspend()
lock()
unlock()
changePassword()
assignRole()
removeRole()
```

Do not build one massive aggregate containing every session, token, role, and event row.

Keep transactions reliable and aggregate boundaries practical.

---

# 19. Identity Status

Recommended states:

```text
PENDING
ACTIVE
SUSPENDED
LOCKED
DISABLED
```

Meaning:

```text
PENDING
  registration not fully activated

ACTIVE
  authentication allowed

SUSPENDED
  administratively blocked

LOCKED
  security lock, usually temporary

DISABLED
  long-term/permanent disabled
```

---

# 20. Identity State Transitions

Example:

```text
PENDING
   ├──> ACTIVE
   └──> DISABLED

ACTIVE
   ├──> LOCKED
   ├──> SUSPENDED
   └──> DISABLED

LOCKED
   ├──> ACTIVE
   └──> DISABLED

SUSPENDED
   ├──> ACTIVE
   └──> DISABLED
```

Invalid transitions must fail.

Do not change status through unrestricted setters.

---

# 21. Core Identity Invariants

Enforce:

```text
user_id is immutable

primary login identifier must be unique within its scope

disabled identity cannot authenticate

locked identity cannot authenticate until policy allows

password reset authorization is single-use

refresh token cannot be reused after rotation

role assignment must reference an existing role

security-sensitive changes must be auditable
```

These are domain/security invariants, not only controller checks.

---

# 22. User ID

The platform needs one stable internal:

```text
user_id
```

Rules:

```text
immutable
owned by Identity
used by downstream services as logical reference
not derived from phone/email/provider subject
```

Do not use:

```text
email
phone number
external provider subject
```

as the universal identity primary key.

---

# 23. Login Identifier Model

Supported identifier types may include:

```text
EMAIL
PHONE
USERNAME
MEMBER_NUMBER
```

Each identifier has:

```text
type
normalized_value
display_value
verification_status
verified_at
```

---

# 24. Identifier Normalization

Normalize before uniqueness checks.

## Email

Possible normalization:

```text
trim
lowercase domain
organization-approved local-part behavior
```

Do not invent aggressive local-part normalization without explicit policy.

## Phone

Normalize to canonical international format.

## Username

Define:

```text
trim
case policy
allowed character policy
```

---

# 25. Identifier Verification State

Possible:

```text
UNVERIFIED
VERIFIED
REVOKED
```

Examples:

```text
phone verified by OTP
email verified through secure link
```

Authentication policy decides whether unverified identifiers may log in.

---

# 26. Credential Model

Possible credential types:

```text
PASSWORD
PASSKEY
TOTP
EXTERNAL_IDP
RECOVERY_CODE
```

Initial implementation may support only:

```text
PASSWORD
```

---

# 27. Password Credential

Possible domain state:

```text
credential_id
user_id
password_hash
algorithm
credential_version
created_at
updated_at
password_changed_at
last_used_at
revoked_at
```

Never store:

```text
plain password
reversible password
password hint containing the password
```

---

# 28. Password Hasher Port

```java
public interface PasswordHasher {

    PasswordHash hash(char[] password);

    boolean matches(
        char[] password,
        PasswordHash hash
    );

    boolean needsRehash(
        PasswordHash hash
    );
}
```

Hashing infrastructure lives outside domain business logic.

---

# 29. Password Rehash

When security-approved parameters are strengthened:

```text
Successful login
    ↓
Verify old hash
    ↓
needsRehash?
    ↓ yes
Hash using new policy
    ↓
Persist updated credential
```

This supports gradual migration.

---

# 30. Password Change

Flow:

```text
Authenticated User
      ↓
Verify current credential
      ↓
Validate new password
      ↓
Hash new password
      ↓
Update credential
      ↓
Revoke selected sessions
      ↓
Create security event
      ↓
Publish PasswordChanged
```

Exact session-revocation policy must be defined.

---

# 31. Session Domain

Session represents a logical authenticated login.

Possible fields:

```text
session_id
user_id
client_id
device_id
created_at
last_seen_at
expires_at
revoked_at
revocation_reason
```

Derived state:

```text
ACTIVE
EXPIRED
REVOKED
```

A revoked session must never be considered active.

---

# 32. Device Metadata

Session metadata may include:

```text
device_id
device_name
platform
app_version
last_ip
last_seen_at
```

Treat this as metadata.

Do not treat a client-supplied device ID as perfect proof of device identity.

---

# 33. Access Token Claims

Access tokens should carry only necessary claims.

Possible:

```text
iss
sub
aud
iat
exp
jti
session_id
roles
scopes
```

Avoid:

```text
customer profile
mutable loyalty state
wallet balance
large permission sets
phone/email unless truly required
```

---

# 34. Access Token Audience

Use explicit audience.

Examples:

```text
brown-public-api
wallet-service
admin-api
```

A service must reject tokens issued for a different audience.

---

# 35. Access Token Scopes

Examples:

```text
orders.read
orders.create
wallet.read
profile.read
```

Service identities may use more specific machine scopes.

---

# 36. JWT Signing

Recommended architecture:

```text
asymmetric signing
```

Example:

```text
RS256
```

with:

```text
kid
```

Private key material stays outside application source code.

---

# 37. Token Issuer Port

```java
public interface AccessTokenIssuer {

    IssuedAccessToken issue(
        AccessTokenClaims claims
    );
}
```

Application/domain code does not depend directly on a specific JOSE/JWT library.

---

# 38. Signing Key Provider

```java
public interface SigningKeyProvider {

    SigningKey currentSigningKey();

    Collection<VerificationKey> verificationKeys();
}
```

Private key loading is infrastructure/security responsibility.

---

# 39. JWKS Endpoint

If Identity owns signing:

```text
GET /.well-known/jwks.json
```

returns:

```text
public verification keys only
```

Never expose private key material.

---

# 40. Key Rotation

Required sequence:

```text
Generate new key pair
      ↓
Publish new public key
      ↓
Begin signing with new private key
      ↓
Keep previous public key available
      ↓
Wait for old access tokens to expire
      ↓
Retire old key
```

Services validating JWT should cache public keys.

On unknown `kid`:

```text
refresh JWKS according to policy
```

Avoid calling Identity for JWKS on every API request.

---

# 41. Refresh Token Architecture

Refresh tokens should be:

```text
opaque
or securely structured
```

Server-side state:

```text
refresh_token_id
session_id
token_hash
token_family_id
issued_at
expires_at
used_at
revoked_at
replaced_by
```

Store:

```text
hash
```

where possible.

Do not store raw refresh token if avoidable.

---

# 42. Refresh Token Family

Example:

```text
family_id = RF001

token A
  ↓ refresh
token B
  ↓ refresh
token C
```

If token A is used again:

```text
possible theft/replay
```

---

# 43. Refresh Rotation

Transaction:

```text
BEGIN

Load token by hash
Lock/validate token
Validate session
Check token family
Detect reuse
Mark current token consumed
Create replacement token record
Update session last_seen
Insert security event if needed

COMMIT

Issue / return new tokens according to approved sequence
```

The implementation must be concurrency-safe.

---

# 44. Refresh Reuse Detection

If a consumed/rotated token is reused:

```text
detect possible replay
      ↓
revoke token family
      ↓
revoke session
      ↓
record REFRESH_TOKEN_REUSE_DETECTED
      ↓
require login again
```

---

# 45. Concurrent Refresh

Two refresh requests using the same token must not independently succeed.

Use database-safe techniques such as:

```text
row locking
atomic update
unique state transition
```

The design may serialize refresh per session.

A grace strategy should exist only if deliberately approved.

---

# 46. Logout

Endpoint:

```text
POST /api/v1/auth/logout
```

Flow:

```text
Authenticated caller
      ↓
Identify session
      ↓
Revoke refresh tokens / family
      ↓
Mark session revoked
      ↓
Security event
```

Access token may remain cryptographically valid until expiry unless denylisting is used.

---

# 47. Access Token Revocation Strategy

Preferred architecture:

```text
short-lived access token
+
session / refresh revocation
```

Optional high-risk control:

```text
short-lived denylist
```

If denylist is used:

```text
jti
expires_at
reason
```

Redis may store denylist entries.

Redis must not become authoritative long-term session history.

---

# 48. List Sessions

Endpoint:

```text
GET /api/v1/auth/sessions
```

Example response:

```json
{
  "data": [
    {
      "session_id": "SES001",
      "device_name": "iPhone",
      "created_at": "...",
      "last_seen_at": "...",
      "current": true
    }
  ]
}
```

Do not expose unnecessary:

```text
token data
IP history
security secrets
```

---

# 49. Revoke One Session

Endpoint:

```text
DELETE /api/v1/auth/sessions/{session_id}
```

Rules:

```text
user may revoke own session

admin/support rules explicit

audit revocation
```

---

# 50. Revoke All Sessions

Endpoint:

```text
POST /api/v1/auth/sessions/revoke-all
```

Useful after:

```text
password compromise
lost device
security incident
```

Whether current session remains active must be an explicit policy.

---

# 51. Password Reset Overview

Password reset is security-sensitive.

Flow:

```text
Request Reset
      ↓
Rate Limit
      ↓
Create Challenge
      ↓
Send OTP / Link
      ↓
Verify Challenge
      ↓
Issue Reset Authorization
      ↓
Confirm New Password
      ↓
Invalidate Challenge
      ↓
Revoke Sessions if Policy Requires
```

---

# 52. Password Reset Request

Endpoint:

```text
POST /api/v1/auth/password-reset/request
```

Request:

```json
{
  "identifier": "+85512345678"
}
```

External response should generally be non-enumerating:

```json
{
  "message": "If the account exists, reset instructions will be sent."
}
```

Do not reveal whether the account exists when enumeration protection is required.

---

# 53. Password Reset Challenge

Possible fields:

```text
challenge_id
user_id
identifier_hash / reference
challenge_type
secret_hash
attempt_count
created_at
expires_at
verified_at
consumed_at
revoked_at
```

Do not store OTP plaintext if avoidable.

---

# 54. OTP Requirements

OTP must be:

```text
cryptographically random
short-lived
single-use
attempt-limited
rate-limited
```

---

# 55. Secure Token Generator Port

```java
public interface SecureTokenGenerator {

    String generate(int bytes);
}
```

Implementation must use cryptographically secure randomness.

Use for:

```text
refresh tokens
reset tokens
OTP-related secrets where applicable
nonce/security challenge material
```

---

# 56. Password Reset Verify

Endpoint:

```text
POST /api/v1/auth/password-reset/verify
```

Request:

```json
{
  "challenge_id": "CH001",
  "otp": "123456"
}
```

On success:

```text
return short-lived reset authorization
```

Do not issue normal long-lived authentication credentials.

---

# 57. Reset Authorization Token

Possible claims:

```text
purpose = password_reset
user_id
challenge_id
issued_at
expires_at
jti
```

Security requirement:

```text
must not be accepted as normal access token
```

---

# 58. Password Reset Confirm

Endpoint:

```text
POST /api/v1/auth/password-reset/confirm
```

Request:

```json
{
  "reset_token": "<short-lived-token>",
  "new_password": "********"
}
```

Flow:

```text
Validate reset authorization
      ↓
Ensure challenge unused
      ↓
Validate new password
      ↓
Update credential
      ↓
Mark challenge consumed
      ↓
Revoke sessions if policy
      ↓
Security event
      ↓
Outbox event if applicable
```

---

# 59. Password Reset Confirm Transaction

```text
BEGIN

Lock challenge
Validate unused
Update password credential
Mark challenge consumed
Revoke sessions if policy
Insert security event
Insert outbox event

COMMIT
```

The same challenge must not be consumed twice.

---

# 60. Password Reset Idempotency

Protect with:

```text
single-use challenge
unique consumption
transactional update
```

If an already-consumed reset authorization is reused:

```text
PASSWORD_RESET_ALREADY_USED
```

or the approved safe equivalent.

---

# 61. Password Reset Rate Limiting

Apply by:

```text
identifier
IP
device/session where available
```

Use:

```text
resend cooldown
verification attempt limit
window limit
daily limit
```

All threshold values are configuration.

---

# 62. Password Reset Security Events

Examples:

```text
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_CHALLENGE_VERIFIED
PASSWORD_RESET_SUCCEEDED
PASSWORD_RESET_FAILED
PASSWORD_RESET_RATE_LIMITED
```

Do not put OTP/reset-token values into security event metadata.

---

# 63. Role Model

Possible roles:

```text
USER
STORE_STAFF
SUPPORT
FINANCE
LOYALTY_ADMIN
SYSTEM_ADMIN
```

These are examples from architecture.

Final production role set must be approved.

Avoid one catch-all:

```text
ADMIN
```

for every privileged capability.

---

# 64. Permission Model

Permissions are granular capabilities.

Examples:

```text
orders.read.own
orders.read.any
payments.refund
wallet.adjust
missions.manage
```

Roles group permissions.

Permissions represent actual fine-grained capabilities.

---

# 65. Role-Permission Mapping

```text
role_permissions
----------------
role_id
permission_id
```

---

# 66. User-Role Mapping

```text
user_roles
----------
user_id
role_id
assigned_at
assigned_by
expires_at
```

Temporary role assignment may use:

```text
expires_at
```

---

# 67. Role Assignment Rules

High-privilege roles require:

```text
restricted admin permission
audit event
possible approval
possible MFA step-up
```

Users must not self-assign roles.

---

# 68. Permission Resolution

At token issuance:

```text
User roles
    ↓
Resolve permissions/scopes
    ↓
Include limited claims
```

Do not put thousands of dynamic permissions into JWT.

For rapidly changing authorization, use additional service-side checks where needed.

---

# 69. Admin Role Endpoints

Possible:

```text
GET    /api/v1/admin/roles
POST   /api/v1/admin/users/{user_id}/roles
DELETE /api/v1/admin/users/{user_id}/roles/{role}
```

Strict authorization required.

All role changes are audited.

---

# 70. Admin Identity Operations

Possible operations:

```text
disable user
unlock user
revoke sessions
assign role
remove role
view security events
```

Every operation must be audited.

---

# 71. Account Disable

Flow:

```text
Authorized admin
      ↓
Disable identity
      ↓
Revoke active sessions
      ↓
Prevent future login
      ↓
Publish UserDisabled
      ↓
Audit
```

---

# 72. Account Re-enable

Re-enable must:

```text
verify authorization
clear appropriate state
audit action
```

Do not automatically restore:

```text
expired credentials
revoked sessions
```

---

# 73. Account Closure

Identity account closure flow:

```text
Authenticated user / authorized admin
      ↓
Check retention obligations
      ↓
Disable login
      ↓
Revoke sessions
      ↓
Publish account closure event/request
      ↓
Downstream domains process their own data
```

Identity must not directly delete data owned by Customer, Orders, Wallet, etc.

---

# 74. Security Event Domain

Examples:

```text
LOGIN_SUCCEEDED
LOGIN_FAILED
SESSION_REVOKED
PASSWORD_CHANGED
PASSWORD_RESET_SUCCEEDED
ROLE_ASSIGNED
ROLE_REMOVED
ACCOUNT_LOCKED
ACCOUNT_DISABLED
REFRESH_TOKEN_REUSE_DETECTED
```

Security events are different from platform-wide domain events.

Not every security event should be published to Kafka.

---

# 75. Security Event Schema

Possible:

```text
identity_security_events
------------------------
event_id
user_id
event_type
result
reason
session_id
request_id
correlation_id
source_ip
user_agent
metadata
occurred_at
```

Sensitive fields must be minimized.

---

# 76. Security Event Immutability

Security events should be append-only.

Normal application behavior should not:

```text
UPDATE
DELETE
```

security event rows.

Retention must be explicit.

---

# 77. Identity Database

Logical database:

```text
identity_db
```

Owned only by:

```text
identity-service
```

Database user:

```text
identity_user
```

Other services must not directly read or write `identity_db`.

---

# 78. Identity Database Overview

Core tables:

```text
users
user_identifiers
credentials
sessions
refresh_tokens
roles
permissions
role_permissions
user_roles
password_reset_challenges
identity_security_events
idempotency_records
outbox_events
```

Optional/future:

```text
mfa_methods
recovery_codes
trusted_devices
external_identities
```

Implement optional tables only when their features are in scope.

---

# 79. Users Table

Conceptual:

```text
users
-----
id
status
created_at
updated_at
locked_until
disabled_at
version
```

Keep Identity minimal.

Do not add:

```text
customer preferences
loyalty points
wallet values
purchase profile
```

---

# 80. User Identifiers Table

```text
user_identifiers
----------------
id
user_id
type
normalized_value
display_value
verification_status
verified_at
created_at
```

Important uniqueness:

```text
(type, normalized_value)
```

Database uniqueness protects registration races.

---

# 81. Credentials Table

```text
credentials
-----------
id
user_id
type
secret_hash
algorithm
credential_version
created_at
updated_at
last_used_at
revoked_at
```

For password credentials:

```text
secret_hash = password hash
```

Never store plaintext secret.

---

# 82. Sessions Table

```text
sessions
--------
id
user_id
client_id
device_id
created_at
last_seen_at
expires_at
revoked_at
revocation_reason
```

Indexes:

```text
user_id
expires_at
revoked_at
```

Additional indexes should be justified by query patterns.

---

# 83. Refresh Tokens Table

```text
refresh_tokens
--------------
id
session_id
token_family_id
token_hash
issued_at
expires_at
used_at
revoked_at
replaced_by_token_id
```

Unique:

```text
token_hash
```

Consider concurrency query pattern when selecting indexes/locking approach.

---

# 84. Password Reset Challenges Table

```text
password_reset_challenges
-------------------------
id
user_id
identifier_hash / reference
challenge_type
secret_hash
attempt_count
created_at
expires_at
verified_at
consumed_at
revoked_at
```

---

# 85. Roles Table

```text
roles
-----
id
code
name
description
status
created_at
```

Unique:

```text
code
```

---

# 86. Permissions Table

```text
permissions
-----------
id
code
description
created_at
```

Unique:

```text
code
```

---

# 87. Role Permissions Table

Recommended logical shape:

```text
role_permissions
----------------
role_id
permission_id
```

Composite uniqueness:

```text
(role_id, permission_id)
```

---

# 88. User Roles Table

```text
user_roles
----------
user_id
role_id
assigned_by
assigned_at
expires_at
```

Possible composite key:

```text
(user_id, role_id)
```

unless history/versioning requires a different model.

---

# 89. Identity Security Events Table

```text
identity_security_events
------------------------
event_id
user_id
event_type
result
reason
session_id
request_id
correlation_id
source_ip
user_agent
metadata
occurred_at
```

Append-only from normal application perspective.

---

# 90. Idempotency Records

Use Phase 2/3 standard where applicable:

```text
idempotency_records
-------------------
id
idempotency_key
operation
request_hash
status
response_code
response_body
created_at
expires_at
```

Candidate Identity operations:

```text
register
password reset request where appropriate
session revocation
admin disable
```

Login is normally not treated as standard business idempotency.

---

# 91. Identity Outbox

Use:

```text
outbox_events
```

for reliable domain event publication.

Possible events:

```text
UserRegistered
UserActivated
UserLocked
UserUnlocked
UserDisabled
PasswordChanged
PasswordResetCompleted
RoleAssigned
RoleRemoved
SessionRevoked
```

Not every security event should become a platform event.

---

# 92. Flyway Migration Sequence

Source architecture proposes:

```text
V1__create_users.sql
V2__create_user_identifiers.sql
V3__create_credentials.sql
V4__create_sessions.sql
V5__create_refresh_tokens.sql
V6__create_roles_permissions.sql
V7__create_password_reset_challenges.sql
V8__create_security_events.sql
V9__create_outbox.sql
```

If `idempotency_records` is required in the first implementation, add it through a new explicit migration.

Do not modify an already-applied shared migration.

---

# 93. Migration Rules

All Identity schema changes use Flyway.

Follow:

```text
versioned migrations
immutable applied migrations
expand-and-contract for incompatible changes
controlled rollout
```

Be especially careful with:

```text
token claims
role model
credential hash fields
refresh token schema
```

because old and new application instances may coexist during deployment.

---

# 94. Password Hash Migration

If the algorithm changes:

```text
support verification of old algorithm
      ↓
user successfully authenticates
      ↓
hash with new algorithm/policy
      ↓
persist new version
```

No plaintext mass migration is needed or allowed.

---

# 95. JWT Claim Migration

Do not abruptly:

```text
remove claims
reinterpret claims
change role semantics
```

Example evolution:

```text
roles
   ↓
roles + permissions during transition
   ↓
consumers migrate
   ↓
old claim retired later
```

---

# 96. Role Migration

Use:

```text
map old roles
introduce new roles
update authorization
monitor
remove old roles later
```

Never accidentally broaden access during migration.

---

# 97. Public REST Endpoints

Core:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{session_id}
POST   /api/v1/auth/sessions/revoke-all

POST /api/v1/auth/password/change

POST /api/v1/auth/password-reset/request
POST /api/v1/auth/password-reset/verify
POST /api/v1/auth/password-reset/confirm
```

Possible current identity:

```text
GET /api/v1/auth/me
```

Admin:

```text
GET    /api/v1/admin/roles
POST   /api/v1/admin/users/{user_id}/roles
DELETE /api/v1/admin/users/{user_id}/roles/{role}
```

Additional admin endpoints should be introduced only with explicit contracts.

---

# 98. Registration Contract

Endpoint:

```text
POST /api/v1/auth/register
```

Example request:

```json
{
  "phone_number": "+85512345678",
  "password": "********"
}
```

This example assumes phone registration.

If the chosen canonical identifier differs, update the contract accordingly.

Possible response:

```json
{
  "data": {
    "user_id": "USR001",
    "status": "PENDING"
  }
}
```

Exact initial status remains policy-controlled.

---

# 99. Registration Flow

```text
Register request
      ↓
Normalize identifier
      ↓
Check rate limit
      ↓
Check uniqueness
      ↓
Validate password
      ↓
Create identity
      ↓
Hash password
      ↓
Create credential
      ↓
Optional verification challenge
      ↓
Save user + identifier + credential
      ↓
Save outbox event
      ↓
Commit
      ↓
Publish UserRegistered asynchronously
```

Notification delivery must not remain inside the database transaction.

---

# 100. Registration Transaction

```text
BEGIN

Insert user
Insert identifier
Insert credential
Insert outbox event

COMMIT
```

Database unique constraint on normalized identifier is final race protection.

---

# 101. Registration Errors

Candidate:

```text
IDENTIFIER_ALREADY_EXISTS
INVALID_IDENTIFIER
WEAK_PASSWORD / PASSWORD_POLICY_FAILED
REGISTRATION_DISABLED
RATE_LIMITED
```

Do not return raw unique-constraint/database errors.

---

# 102. Registration Idempotency

Architecture allows either:

```text
normalized identifier semantics
```

or explicit:

```http
Idempotency-Key: <key>
```

The team must select and document exact behavior.

If explicit idempotency is used, follow Phase 3 duplicate/conflict rules.

---

# 103. User Registered Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "USER_REGISTERED",
  "event_version": 1,
  "occurred_at": "...",
  "producer": "identity-service",
  "correlation_id": "cor_...",
  "data": {
    "user_id": "USR001"
  }
}
```

Never publish:

```text
password
password hash
refresh token
OTP
security secret
```

---

# 104. Login Contract

Endpoint:

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "identifier": "+85512345678",
  "password": "********"
}
```

Response shape:

```json
{
  "data": {
    "access_token": "<token>",
    "token_type": "Bearer",
    "expires_in": "<policy>",
    "refresh_token": "<token>",
    "refresh_expires_in": "<policy>"
  }
}
```

Use approved numeric lifetime values in the real contract.

---

# 105. Login Flow

```text
Login request
      ↓
Rate limit
      ↓
Normalize identifier
      ↓
Resolve identity
      ↓
Validate account status
      ↓
Verify password
      ↓
Check password rehash
      ↓
Evaluate security policy
      ↓
Create session
      ↓
Create refresh token
      ↓
Issue access token
      ↓
Record security event
      ↓
Return credentials
```

Failure path:

```text
Audit failure
Update short-window counters
Return INVALID_CREDENTIALS where enumeration-safe
```

---

# 106. Login Enumeration Protection

Do not return:

```text
User does not exist
```

versus:

```text
Wrong password
```

when enumeration is a concern.

Prefer:

```text
INVALID_CREDENTIALS
```

Detailed internal reason may be securely recorded.

---

# 107. Login Failure Handling

Track as appropriate:

```text
failed attempt count
last failure time
source IP
device metadata
```

Possible controls:

```text
progressive delay
temporary lock
captcha/risk challenge
MFA step-up
```

---

# 108. Login Transaction

Possible sequence:

```text
Authenticate outside write transaction
      ↓

BEGIN
Create session
Create refresh token
Insert security event
COMMIT

      ↓
Issue signed access token
```

The exact token issuance sequence must avoid unsafe inconsistent state.

---

# 109. Refresh Contract

Endpoint:

```text
POST /api/v1/auth/refresh
```

Request:

```json
{
  "refresh_token": "<token>"
}
```

Response:

```json
{
  "data": {
    "access_token": "<new>",
    "refresh_token": "<new>",
    "expires_in": "<policy>"
  }
}
```

---

# 110. Refresh Application Flow

```text
Hash incoming token
      ↓
Load refresh token
      ↓
Validate session
      ↓
Validate expiry/revocation
      ↓
Detect reuse
      ↓
Rotate token
      ↓
Issue new access token
      ↓
Audit
```

---

# 111. Logout Contract

Endpoint:

```text
POST /api/v1/auth/logout
```

Authentication:

```text
required
```

Action:

```text
revoke current session / refresh family
```

Do not promise immediate cryptographic invalidation of the current access token unless denylisting is implemented.

---

# 112. Change Password Contract

Endpoint:

```text
POST /api/v1/auth/password/change
```

Authentication:

```text
required
```

Conceptual request:

```json
{
  "current_password": "********",
  "new_password": "********"
}
```

Exact body belongs in the approved OpenAPI contract.

---

# 113. Password Reset Request Contract

```text
POST /api/v1/auth/password-reset/request
```

Request:

```json
{
  "identifier": "+85512345678"
}
```

Response remains non-enumerating.

---

# 114. Password Reset Verify Contract

```text
POST /api/v1/auth/password-reset/verify
```

Request:

```json
{
  "challenge_id": "CH001",
  "otp": "123456"
}
```

Response:

```text
short-lived password reset authorization
```

Exact token response fields must be defined in OpenAPI.

---

# 115. Password Reset Confirm Contract

```text
POST /api/v1/auth/password-reset/confirm
```

Request:

```json
{
  "reset_token": "<short-lived-token>",
  "new_password": "********"
}
```

---

# 116. Current Identity Endpoint

Possible:

```text
GET /api/v1/auth/me
```

Response should contain only Identity/security-level data.

Example:

```json
{
  "data": {
    "user_id": "USR001",
    "status": "ACTIVE",
    "roles": [
      "USER"
    ]
  }
}
```

Do not return Customer Service profile data here.

---

# 117. Authentication Headers

Public requests:

```http
Authorization: Bearer <access_token>
```

Tracing:

```text
X-Request-Id
X-Correlation-Id
traceparent
```

---

# 118. Local JWT Validation

Other services should normally validate signed access tokens locally using public keys/JWKS.

Avoid:

```text
Every API request
      ↓
Call Identity synchronously
```

This would create a central runtime bottleneck.

---

# 119. Token Introspection

Only if selected architecture requires it:

```text
POST /oauth2/introspect
```

or internal gRPC equivalent.

Use only where local JWT validation is insufficient.

---

# 120. Potential Identity gRPC Operations

Possible:

```text
GetUserSecurityState
CheckSession
ResolvePermissions
```

Add only if a concrete use case justifies them.

Do not make Identity a dependency for every normal API call.

---

# 121. Cookie-Based Admin Session Option

For web/admin applications, architecture may use:

```text
Secure
HttpOnly
SameSite
```

cookies.

If cookies are used:

```text
CSRF protection
origin checks
session fixation protection
```

are required.

This is optional and must match the approved frontend/admin auth strategy.

---

# 122. CORS

Allow only approved origins.

Do not use wildcard origins with credentialed sensitive requests.

Configuration:

```text
IDENTITY_ALLOWED_ORIGINS = environment-controlled
```

---

# 123. Rate Limiting

Identity requires strong rate limiting for:

```text
login
register
password reset request
OTP verification
refresh
admin identity operations
```

Dimensions:

```text
IP
identifier
session
client ID
device
```

---

# 124. Rate Limit Port

```java
public interface AuthenticationRateLimitPort {

    RateLimitDecision checkLogin(
        String normalizedIdentifier,
        String sourceIp
    );
}
```

Redis may implement short-window counters.

---

# 125. Redis Usage

Redis may support:

```text
rate limiting
temporary login counters
OTP attempt counters
short-lived token denylist
temporary reset state
```

Authoritative Identity state remains in PostgreSQL.

---

# 126. Redis Failure Policy

For each Redis-backed control define:

```text
fail closed?
safe degraded mode?
temporary local fallback?
deny operation?
```

Do not silently disable critical rate limits.

For abuse-sensitive authentication flows, fail-open may be dangerous.

---

# 127. Notification Integration

Identity may request:

```text
OTP
password reset email
security notification
```

Preferred boundary:

```text
Identity
   ↓
NotificationRequested / NotificationPort
   ↓
Notification Service
```

Identity does not own provider delivery infrastructure.

---

# 128. OTP Delivery Sequence

```text
Create challenge
      ↓
Commit challenge
      ↓
Request notification
      ↓
Notification provider
```

If delivery fails:

```text
challenge remains controlled
retry policy applies
cooldown applies
```

Do not create unlimited replacement challenges automatically.

---

# 129. Identity Input Ports

Examples:

```text
RegisterUserUseCase
LoginUseCase
RefreshTokenUseCase
LogoutUseCase
ChangePasswordUseCase
RequestPasswordResetUseCase
VerifyPasswordResetUseCase
ConfirmPasswordResetUseCase
ListSessionsUseCase
RevokeSessionUseCase
AssignRoleUseCase
```

Additional:

```text
RevokeAllSessionsUseCase
RemoveRoleUseCase
DisableUserUseCase
EnableUserUseCase
UnlockUserUseCase
GetCurrentIdentityUseCase
```

only where approved by the actual endpoint scope.

---

# 130. Identity Output Ports

Examples:

```text
LoadUserPort
SaveUserPort
LoadCredentialPort
SaveCredentialPort
SessionPort
RefreshTokenPort
RolePort
SecurityEventPort
PasswordHasherPort
TokenSignerPort
ClockPort
NotificationPort
RateLimitPort
OutboxPort
```

Likely implementation refinements:

```text
UserIdentifierPort
PasswordResetChallengePort
PermissionPort
SigningKeyProvider
SecureTokenGenerator
IdempotencyPort
```

should be added only as concrete use cases require them.

---

# 131. Clock Port

Security time must be testable.

Use:

```text
java.time.Clock
```

or:

```java
public interface ClockPort {

    Instant now();
}
```

Security flows depending on time:

```text
JWT expiry
refresh expiry
session expiry
OTP expiry
reset authorization expiry
rate limit windows
role expiration
```

---

# 132. Domain Package Proposal

```text
domain/
├── identity/
│   ├── UserIdentity.java
│   ├── UserId.java
│   ├── IdentityStatus.java
│   ├── LoginIdentifier.java
│   ├── IdentifierType.java
│   └── VerificationStatus.java
│
├── credential/
│   ├── Credential.java
│   ├── CredentialId.java
│   ├── CredentialType.java
│   └── PasswordHash.java
│
├── session/
│   ├── Session.java
│   ├── SessionId.java
│   ├── SessionStatus.java
│   ├── RefreshTokenRecord.java
│   └── TokenFamilyId.java
│
├── role/
│   ├── Role.java
│   ├── Permission.java
│   └── UserRole.java
│
├── event/
│   ├── UserRegistered.java
│   ├── UserDisabled.java
│   ├── PasswordChanged.java
│   └── RoleAssigned.java
│
├── policy/
│   ├── PasswordPolicy.java
│   ├── AuthenticationPolicy.java
│   └── RoleAssignmentPolicy.java
│
└── exception/
    ├── InvalidCredentialsException.java
    ├── AccountLockedException.java
    ├── AccountDisabledException.java
    ├── RefreshTokenReusedException.java
    └── PasswordResetInvalidException.java
```

Exact class names can evolve while preserving boundaries.

---

# 133. Application Package Proposal

```text
application/
├── port/
│   ├── in/
│   └── out/
│
├── register/
│   ├── RegisterUserCommand.java
│   ├── RegisterUserResult.java
│   └── RegisterUserService.java
│
├── login/
│   ├── LoginCommand.java
│   ├── LoginResult.java
│   └── LoginService.java
│
├── refresh/
│   ├── RefreshTokenCommand.java
│   ├── RefreshTokenResult.java
│   └── RefreshTokenService.java
│
├── logout/
│   └── ...
│
├── password/
│   ├── change/
│   └── reset/
│
├── session/
│   └── ...
│
└── role/
    └── ...
```

---

# 134. Registration Command Example

```java
public record RegisterUserCommand(
    String identifier,
    char[] password,
    String idempotencyKey,
    String sourceIp,
    String userAgent
) {}
```

The exact command fields depend on the approved public contract.

Do not copy REST DTO classes into the application layer.

---

# 135. Login Command Example

```java
public record LoginCommand(
    String identifier,
    char[] password,
    String clientId,
    String deviceId,
    String sourceIp,
    String userAgent
) {}
```

Avoid keeping password strings longer than necessary.

---

# 136. Refresh Command Example

```java
public record RefreshTokenCommand(
    char[] refreshToken,
    String sourceIp,
    String userAgent
) {}
```

The raw refresh token should exist only long enough for secure processing/hash lookup.

---

# 137. Registration Service Flow

```text
RegisterUserCommand
      ↓
Normalize identifier
      ↓
RateLimitPort
      ↓
Check uniqueness
      ↓
PasswordPolicy
      ↓
Create UserIdentity
      ↓
PasswordHasherPort
      ↓
Persist user + identifier + credential
      ↓
OutboxPort
      ↓
Commit
```

---

# 138. Login Service Flow

```text
LoginCommand
      ↓
RateLimitPort
      ↓
Normalize identifier
      ↓
Load user
      ↓
Validate status
      ↓
Load credential
      ↓
PasswordHasher.matches()
      ↓
needsRehash?
      ↓
Create session
      ↓
Create refresh token
      ↓
AccessTokenIssuer
      ↓
SecurityEventPort
```

---

# 139. Refresh Service Flow

```text
RefreshTokenCommand
      ↓
Hash incoming token
      ↓
Load refresh record
      ↓
Validate expiry/revocation/session
      ↓
Detect consumed token
      ↓
Rotate token transaction
      ↓
Issue access token
      ↓
Audit
```

---

# 140. Logout Service Flow

```text
LogoutCommand
      ↓
Load current session
      ↓
Revoke session
      ↓
Revoke token family
      ↓
Security event
```

---

# 141. Role Assignment Service Flow

```text
Authorized admin
      ↓
Validate target user
      ↓
Validate role
      ↓
RoleAssignmentPolicy
      ↓
Persist user role
      ↓
Security event
      ↓
Outbox RoleAssigned
```

---

# 142. Persistence Adapter Structure

```text
adapter/out/persistence/
├── entity/
│   ├── UserJpaEntity.java
│   ├── UserIdentifierJpaEntity.java
│   ├── CredentialJpaEntity.java
│   ├── SessionJpaEntity.java
│   ├── RefreshTokenJpaEntity.java
│   ├── RoleJpaEntity.java
│   ├── PermissionJpaEntity.java
│   ├── UserRoleJpaEntity.java
│   ├── PasswordResetChallengeJpaEntity.java
│   ├── SecurityEventJpaEntity.java
│   └── OutboxEventJpaEntity.java
│
├── repository/
├── mapper/
└── adapter/
```

Domain must not import JPA.

---

# 143. Database Constraints

At minimum consider:

```text
UNIQUE(type, normalized_value)

UNIQUE(refresh_tokens.token_hash)

UNIQUE(roles.code)

UNIQUE(permissions.code)

UNIQUE(user_id, role_id)
  if selected user-role model uses one current mapping

NOT NULL
  for required identity/security fields

CHECK
  for safe enum/status values where useful
```

Use database constraints as final integrity protection.

---

# 144. Registration Concurrency

Race:

```text
Request A
  checks identifier missing

Request B
  checks identifier missing
```

Both may proceed concurrently.

Final protection:

```text
database unique constraint
```

Catch/translate duplicate constraint into:

```text
IDENTIFIER_ALREADY_EXISTS
```

Do not expose SQL details.

---

# 145. Refresh Concurrency

Requirement:

```text
two concurrent refreshes of the same token
must not create two independent valid branches
```

Protect with:

```text
row lock
atomic update
unique state transition
```

and integration tests.

---

# 146. Password Reset Concurrency

Requirement:

```text
same challenge/reset authorization
cannot be consumed twice
```

Protect with:

```text
row lock
consumed_at check
atomic state update
```

---

# 147. Identity Idempotency

Candidate operations:

```text
registration
password reset request where appropriate
session revocation
admin disable
```

Login:

```text
normally not treated as a standard idempotent business operation
```

Document each endpoint's decision in OpenAPI/contracts.

---

# 148. Error Catalog

Candidate Identity errors:

```text
INVALID_CREDENTIALS
ACCOUNT_LOCKED
ACCOUNT_DISABLED
ACCOUNT_SUSPENDED
IDENTIFIER_ALREADY_EXISTS
IDENTIFIER_NOT_VERIFIED
INVALID_REFRESH_TOKEN
REFRESH_TOKEN_EXPIRED
REFRESH_TOKEN_REUSED
SESSION_REVOKED
SESSION_EXPIRED
PASSWORD_POLICY_FAILED
PASSWORD_RESET_INVALID
PASSWORD_RESET_EXPIRED
PASSWORD_RESET_ALREADY_USED
ROLE_NOT_FOUND
ROLE_ASSIGNMENT_DENIED
RATE_LIMITED
```

---

# 149. HTTP Error Mapping

The source gives example mappings but leaves some choices open.

Fixed-looking examples:

```text
INVALID_CREDENTIALS
  → 401

ACCOUNT_DISABLED
  → 403

IDENTIFIER_ALREADY_EXISTS
  → 409

INVALID_REFRESH_TOKEN
  → 401

ROLE_ASSIGNMENT_DENIED
  → 403

RATE_LIMITED
  → 429
```

Open choices that must be standardized:

```text
ACCOUNT_LOCKED
  → 423 or approved 401/403 strategy

PASSWORD_RESET_INVALID
  → 400/401 depending approved design
```

Freeze these in:

```text
docs/errors.md
OpenAPI
contract tests
```

---

# 150. Security Error Leakage

Never expose:

```text
password hash mismatch
database user ID
SQL constraint name
token family ID
key storage path
hash algorithm internals unless intentionally public
```

Return stable, safe contract errors.

---

# 151. Spring Security Baseline

Identity has both:

```text
public auth endpoints
authenticated self-service endpoints
strict admin endpoints
```

Conceptual policy:

```text
permit:
  register
  login
  refresh
  password-reset request
  password-reset verify
  password-reset confirm
  JWKS

authenticated:
  logout
  sessions
  password change
  /auth/me

strict admin:
  role management
  disable/unlock/revoke-other-user-session
  security event access
```

Exact endpoint rules must be captured in SecurityConfiguration and tests.

---

# 152. Deny by Default

All non-explicit routes:

```text
DENY
```

Do not allow broad:

```text
/api/v1/**
```

without explicit review.

---

# 153. Registration Security

Review:

```text
rate limit
identifier validation
account-spam protection
notification-abuse protection
password policy
duplicate race
idempotency
security event
outbox
```

---

# 154. Login Security

Review:

```text
generic invalid credentials
rate limit
temporary lock/throttle
password hashing
status validation
session creation
refresh rotation setup
audit
no token logging
```

---

# 155. Refresh Security

Review:

```text
hash token
server-side token state
rotation
reuse detection
session state
concurrency
rate limit
audit
family revocation
```

---

# 156. Password Reset Security

Review:

```text
enumeration protection
rate limiting
resend cooldown
secure OTP generation
single-use challenge
attempt limit
short-lived reset auth
reset auth purpose restriction
session revocation policy
audit
```

---

# 157. Admin Security

High-risk admin actions may require:

```text
strong permission
MFA/step-up
reason
approval
audit
```

depending on organizational policy.

Do not expose role assignment to normal users.

---

# 158. Authentication Logging

Safe fields:

```text
user_id if known
session_id if safe
result
reason code
source_ip
user_agent
request_id
correlation_id
```

Never log:

```text
password
OTP
raw refresh token
raw access token
private signing key
reset token
```

---

# 159. Correlation

Preserve:

```text
request_id
correlation_id
trace context
```

through:

```text
Gateway
  ↓
Identity
  ↓
DB / Redis
  ↓
Notification adapter
  ↓
outbox / Kafka
```

Security events should preserve request/correlation IDs.

---

# 160. Identity Events Published

Candidate:

```text
UserRegistered
UserActivated
UserLocked
UserUnlocked
UserDisabled
PasswordChanged
PasswordResetCompleted
RoleAssigned
RoleRemoved
SessionRevoked
```

Event publication depends on a legitimate consumer need.

Do not publish every internal security signal.

---

# 161. Identity Events Consumed

Identity should consume very few domain events.

Possible:

```text
CustomerDeleted / account closure request
SecurityIncidentCommand
```

Avoid unnecessary dependencies.

---

# 162. Outbox Transaction

For publishable Identity events:

```text
BEGIN

Update Identity state
Insert outbox event

COMMIT
```

Kafka publishing happens outside the business transaction.

---

# 163. Registration Event Example

```json
{
  "event_id": "evt_123",
  "event_type": "USER_REGISTERED",
  "event_version": 1,
  "occurred_at": "2026-10-11T09:30:00Z",
  "producer": "identity-service",
  "correlation_id": "cor_123",
  "data": {
    "user_id": "USR001"
  }
}
```

---

# 164. Configuration Categories

`.env.example` should document only approved values.

Example categories:

```dotenv
# SERVICE

IDENTITY_SERVER_PORT=8081

# DATABASE

IDENTITY_DB_URL=jdbc:postgresql://localhost:5432/identity_db
IDENTITY_DB_USERNAME=identity_user
IDENTITY_DB_PASSWORD=local_only

# REDIS

IDENTITY_REDIS_HOST=localhost
IDENTITY_REDIS_PORT=6379

# JWT

JWT_ISSUER=
JWT_AUDIENCE=
JWT_SIGNING_ALGORITHM=
JWT_KEY_ID=
JWT_PRIVATE_KEY_PATH=
JWT_PUBLIC_KEY_PATH=
ACCESS_TOKEN_TTL=

# REFRESH

REFRESH_TOKEN_TTL=
SESSION_ABSOLUTE_TTL=
SESSION_IDLE_TTL=

# PASSWORD

PASSWORD_HASH_ALGORITHM=
PASSWORD_MIN_LENGTH=
PASSWORD_MAX_LENGTH=

# RATE LIMIT

LOGIN_RATE_LIMIT=
REGISTRATION_RATE_LIMIT=
REFRESH_RATE_LIMIT=

# PASSWORD RESET

RESET_OTP_TTL=
RESET_OTP_MAX_ATTEMPTS=
RESET_RESEND_COOLDOWN=
RESET_DAILY_LIMIT=
RESET_AUTHORIZATION_TTL=

# NOTIFICATION

NOTIFICATION_MODE=

# OBSERVABILITY

LOG_LEVEL=INFO
```

Use safe local values only.

Do not put production keys/secrets into source control.

---

# 165. `application.yml` Principles

Use:

```text
externalized environment variables
typed configuration properties
safe defaults
validation on required configuration
```

Do not hard-code:

```text
production DB password
private key
real provider token
production origin list
```

---

# 166. Configuration Validation

Identity must fail startup safely when critical configuration is missing.

Critical examples:

```text
database config
JWT issuer
JWT audience
signing key source
token lifetimes
password policy
```

Do not silently fall back to insecure values.

---

# 167. Health Endpoint

At minimum:

```text
/actuator/health
```

Public health response should not expose:

```text
DB credentials
key paths
detailed security configuration
```

Later Kubernetes will use readiness/liveness/startup probes.

---

# 168. Identity Metrics

Track:

```text
login_attempts_total
login_success_total
login_failure_total
login_rate_limited_total
refresh_success_total
refresh_failure_total
refresh_reuse_detected_total
password_reset_requested_total
password_reset_success_total
active_sessions
account_locked_total
token_issue_latency
password_hash_latency
```

Use low-cardinality labels.

Do not label by:

```text
user_id
session_id
phone
email
```

---

# 169. Identity SLIs

Possible:

```text
login success latency
refresh latency
token issuance success rate
service availability
password reset success rate
JWT signing failure rate
```

Targets/SLOs are set in later production-operational phases.

---

# 170. Alerts

Alert on:

```text
login failure spike
refresh reuse spike
JWT signing failure
database connection exhaustion
Redis failure
password reset abuse spike
unknown kid errors
certificate/key expiry
```

---

# 171. Identity Logs

Structured fields:

```text
timestamp
level
service
event
user_id if known
session_id if safe
request_id
correlation_id
source_ip
result
reason_code
```

Never log sensitive auth values.

---

# 172. Identity Dashboard

Should eventually show:

```text
request rate
login success/failure
refresh success/failure
latency
5xx
429
locked accounts
active sessions
DB pool
Redis health
CPU
memory
```

---

# 173. Identity Availability

Identity is a Tier-1 critical service.

Outage affects:

```text
new login
registration
refresh
password reset
role administration
```

Already-issued JWT access tokens may continue working until expiry when downstream services validate locally.

That reduces runtime dependency on Identity.

---

# 174. Failure Mode — PostgreSQL Down

If Identity DB is unavailable:

```text
login fails
refresh fails
registration fails
```

Do not authenticate from stale mutable credential data.

Already-issued access tokens may remain valid according to token policy.

---

# 175. Failure Mode — Signing Key Unavailable

If signing key is unavailable:

```text
do not issue unsigned token
do not fall back to insecure key
```

Token issuance must fail and alert operators.

---

# 176. Failure Mode — Notification Provider Down

For password reset/OTP:

```text
record delivery failure
allow controlled retry
respect cooldown/rate limit
preserve enumeration-safe response
```

Do not expose whether an account exists.

---

# 177. Failure Mode — Redis Down

Per endpoint/control choose:

```text
fail closed
or explicitly defined safe degraded policy
```

Do not silently disable critical authentication-abuse controls.

---

# 178. Failure Mode — JWKS Unavailable

Downstream services should cache valid public keys.

Key rotation design needs:

```text
refresh on unknown kid
reasonable cache expiry
fallback behavior
```

Avoid Identity call on every token validation.

---

# 179. Failure Mode — Clock Drift

Identity depends on accurate time for:

```text
JWT expiry
OTP expiry
refresh expiry
session expiry
rate limit windows
role expiration
```

Monitor infrastructure time synchronization.

---

# 180. Registration Tests

Must cover:

```text
valid registration
duplicate identifier
invalid identifier
weak password
database uniqueness race
rate limit
outbox event created
credential hashed
password never persisted raw
```

---

# 181. Login Tests

Must cover:

```text
success
wrong password
unknown identifier
locked user
disabled user
suspended user
expired policy state where relevant
rate limited
password rehash
session created
refresh token created
security event created
enumeration-safe public error
```

---

# 182. Refresh Tests

Must cover:

```text
valid refresh
expired token
revoked token
reused token
concurrent refresh
wrong token hash
session revoked
session expired
rotation family revocation
```

---

# 183. Password Reset Tests

Must cover:

```text
request
cooldown
identifier enumeration protection
wrong OTP
expired OTP
attempt limit
successful verification
single-use reset authorization
confirm password
session revocation
concurrent consumption
delivery failure behavior
```

---

# 184. Authorization Tests

Test:

```text
normal user role
support role
finance role
system admin role
unauthorized role assignment
expired temporary role
resource ownership
admin operation without required permission
```

Only include roles actually approved for implementation.

---

# 185. JWT Tests

Test:

```text
correct signature
wrong signature
expired token
wrong audience
wrong issuer
unknown kid
rotated key
missing required claim
reset-purpose token rejected as access token
```

---

# 186. Session Tests

Test:

```text
create
list
revoke one
revoke all
expired session
current session behavior
device metadata
revoked session cannot refresh
```

---

# 187. Security Event Tests

Verify:

```text
login failure logged
login success logged
password reset logged
role change logged
session revocation logged
refresh reuse logged
sensitive values absent
append-only behavior where applicable
```

---

# 188. Persistence Integration Tests

Use:

```text
PostgreSQL Testcontainer
```

Validate:

```text
Flyway migrations
unique identifier constraint
refresh token uniqueness
role uniqueness
permission uniqueness
session queries
locking/concurrency behavior
password reset consume race
outbox insert transaction
```

---

# 189. Redis Integration Tests

If Redis is used:

```text
Redis Testcontainer
```

Test:

```text
login rate limit
reset cooldown
OTP attempt counter
denylist expiry if used
failure/degraded policy
```

---

# 190. HTTP Integration Tests

Test real Spring web/security behavior for:

```text
register
login
refresh
logout
sessions
password reset
admin role endpoint
JWKS
```

Use local/test signing keys.

Do not require production identity infrastructure.

---

# 191. Contract Tests

Verify:

```text
REST request/response
error-code stability
OpenAPI
JWT claims
JWKS format
published event schema
```

---

# 192. Architecture Tests

ArchUnit rules:

```text
domain must not depend on Spring
domain must not depend on adapters
application must not depend on JPA repositories
REST adapter may depend on application
persistence adapter implements application output ports
```

---

# 193. Security Tests

Include:

```text
missing token
expired token
wrong issuer
wrong audience
invalid signature
unknown kid
insufficient role/scope
resource ownership failure
rate limit
reset replay
refresh replay
admin privilege escalation
```

---

# 194. Load Test Scenarios

Identity scenarios:

```text
login burst
token refresh burst
registration spike
password reset spike
JWKS requests
session listing
```

Watch:

```text
DB connections
password hashing CPU
Redis latency
token signing latency
```

---

# 195. Password Hash Capacity

Password hashing is intentionally expensive.

Capacity planning must consider:

```text
CPU per login
concurrent logins
DoS risk
approved hash parameters
autoscaling
```

Do not weaken hash security merely to hide capacity problems.

---

# 196. Refresh Capacity

Refresh volume may exceed login volume.

Estimate:

```text
active users
access token lifetime
refresh frequency
mobile reconnect patterns
```

---

# 197. Security Runbooks

Required operational runbooks:

```text
Identity DB unavailable
Signing key unavailable
Signing key compromise
Refresh replay spike
Login attack
Redis unavailable
Password reset provider unavailable
JWT validation failures across services
```

---

# 198. Signing Key Compromise Runbook

```text
Declare incident
      ↓
Stop compromised key use
      ↓
Generate replacement
      ↓
Publish new public key
      ↓
Rotate signer
      ↓
Revoke sessions/tokens according to risk
      ↓
Investigate misuse
      ↓
Retire compromised key
      ↓
Postmortem
```

---

# 199. Refresh Token Theft / Replay Runbook

If large-scale reuse is detected:

```text
revoke affected token families
revoke sessions
force reauthentication
notify affected users if policy requires
investigate source
```

---

# 200. Account Takeover Response

Possible actions:

```text
lock account
revoke sessions
reset credentials
require MFA where available
review role changes
review sensitive actions
notify user if policy requires
```

---

# 201. Backup Requirements

Identity DB backup must include authoritative Identity data such as:

```text
users
identifiers
credentials
sessions
roles
permissions
security events
```

Refresh/reset/outbox records should be covered according to retention/recovery design.

Signing keys/secrets may be managed separately and require separate recovery strategy.

---

# 202. Restore Validation

After restore verify:

```text
credential data
role mappings
signing key references
Flyway migration version
session/token consistency
```

Depending on restore point:

```text
sessions issued after restored state may need revocation/reconciliation
```

---

# 203. Disaster Recovery Requirements

Identity DR requires:

```text
database
signing key access
JWKS
secrets
DNS/routing
rate limiting
monitoring
```

Authentication recovery is incomplete without both:

```text
Identity authoritative state
+
signing/verification key infrastructure
```

---

# 204. Identity README

Must document:

```text
Purpose
Responsibilities
Non-responsibilities
Architecture
REST API
JWT claims
JWKS
Roles
Permissions
Database
Password policy
Refresh rotation
Password reset
Rate limits
Events
Security controls
Testing
Deployment
Monitoring
Runbooks
```

---

# 205. Recommended Identity ADRs

Create:

```text
ADR-ID-001 Identity provider strategy
ADR-ID-002 Password hashing algorithm
ADR-ID-003 JWT signing algorithm
ADR-ID-004 Access token lifetime
ADR-ID-005 Refresh rotation policy
ADR-ID-006 Session model
ADR-ID-007 Role/permission model
ADR-ID-008 Password reset design
ADR-ID-009 MFA strategy
```

Add identifier/activation ADR if needed:

```text
ADR-ID-010 Login identifier and activation strategy
```

---

# 206. Security Review Checklist — Credentials

- [ ] Password hashing algorithm approved.
- [ ] Parameters approved/configurable.
- [ ] No plaintext passwords persisted.
- [ ] No raw password logs.
- [ ] Rehash/version migration supported.
- [ ] Password reset secure.
- [ ] Password change revocation policy defined.

---

# 207. Security Review Checklist — Tokens

- [ ] Access token lifetime defined.
- [ ] Refresh lifetime defined.
- [ ] Issuer defined.
- [ ] Audience defined.
- [ ] Claims minimized.
- [ ] Asymmetric signing selected/approved.
- [ ] `kid` supported.
- [ ] JWKS endpoint defined.
- [ ] Key rotation defined.
- [ ] Private key excluded from source/logs.
- [ ] Reset token cannot act as access token.

---

# 208. Security Review Checklist — Refresh

- [ ] Raw refresh token not persistently stored where avoidable.
- [ ] Token hash used.
- [ ] Family model defined.
- [ ] Rotation mandatory.
- [ ] Reuse detection.
- [ ] Concurrency protection.
- [ ] Family/session revocation.
- [ ] Rate limit.
- [ ] Replay security event.

---

# 209. Security Review Checklist — Sessions

- [ ] Session expiry policy.
- [ ] Session revocation.
- [ ] Revoke-all behavior.
- [ ] Device metadata privacy reviewed.
- [ ] Current-session semantics.
- [ ] Session state authoritative in PostgreSQL.
- [ ] Redis not used as long-term session source of truth.

---

# 210. Security Review Checklist — Password Reset

- [ ] Non-enumerating request response.
- [ ] Secure challenge generation.
- [ ] OTP/token hash storage.
- [ ] TTL.
- [ ] Attempt limit.
- [ ] Cooldown.
- [ ] Window limit.
- [ ] Daily limit.
- [ ] Reset-purpose token.
- [ ] Single-use consumption.
- [ ] Session revocation policy.
- [ ] Audit.
- [ ] Notification failure behavior.

---

# 211. Security Review Checklist — Roles

- [ ] Roles approved.
- [ ] Permissions approved.
- [ ] No self-assignment.
- [ ] High-privilege assignment restricted.
- [ ] Temporary role expiry supported where required.
- [ ] Role changes audited.
- [ ] Token claims do not become unmanageably large.

---

# 212. Security Review Checklist — Logging

- [ ] No password.
- [ ] No OTP.
- [ ] No raw access token.
- [ ] No raw refresh token.
- [ ] No reset token.
- [ ] No private key.
- [ ] Source IP classification reviewed.
- [ ] User agent logging reviewed.
- [ ] Correlation IDs present.
- [ ] Security event reason codes safe.

---

# 213. Implementation Order

Recommended implementation sequence:

```text
Step 1
Bootstrap identity-service project

Step 2
Create database + Flyway baseline

Step 3
Implement UserIdentity + identifier model

Step 4
Implement credential/password hashing

Step 5
Implement registration

Step 6
Implement JWT signing + JWKS

Step 7
Implement session + refresh-token model

Step 8
Implement login

Step 9
Implement refresh rotation + reuse detection

Step 10
Implement logout/session management

Step 11
Implement change password

Step 12
Implement password reset request/verify/confirm

Step 13
Implement roles/permissions

Step 14
Implement admin disable/unlock/role operations

Step 15
Implement security events + outbox

Step 16
Implement Redis rate-limit adapter

Step 17
Implement notification boundary

Step 18
Complete tests

Step 19
Complete observability/runbooks

Step 20
Docker/local acceptance test
```

---

# 214. Step 1 — Bootstrap Acceptance

Before business logic:

```text
service starts
health endpoint works
database connection works
Flyway starts
security config loads
test profile works
PostgreSQL Testcontainer works
ArchUnit test runs
Docker image builds
```

---

# 215. Step 2 — Data Acceptance

Verify:

```text
all core tables migrate
constraints created
service DB user owns/accesses only identity_db
no other service DB required
migration tests pass
```

---

# 216. Step 3 — Registration Acceptance

Verify:

```text
POST register succeeds
password stored only hashed
normalized identifier unique
duplicate maps safely
outbox UserRegistered created
rate limit works
registration transaction atomic
```

---

# 217. Step 4 — JWT Acceptance

Verify:

```text
access token signed
iss correct
aud correct
sub = internal user_id
exp correct
kid present
JWKS exposes matching public key
private key never exposed
wrong audience rejected
expired token rejected
```

---

# 218. Step 5 — Login Acceptance

Verify:

```text
correct credential logs in
unknown identifier returns safe error
wrong password returns safe error
locked/disabled blocked
session persisted
refresh hash persisted
access token issued
security event persisted
password rehash path works
```

---

# 219. Step 6 — Refresh Acceptance

Verify:

```text
valid refresh rotates
old token cannot rotate again
reused token triggers family/session revocation
concurrent same-token refresh cannot fork family
new access token valid
audit/metric emitted
```

---

# 220. Step 7 — Session Acceptance

Verify:

```text
list current user's sessions
revoke own session
revoke all sessions
revoked session cannot refresh
authorization protects other users' sessions
```

---

# 221. Step 8 — Password Reset Acceptance

Verify:

```text
request non-enumerating
cooldown works
challenge stored securely
wrong OTP limited
expiry works
verify issues reset-only authorization
reset auth cannot call normal APIs
confirm changes password once
second confirm rejected
session policy applied
audit events exist
```

---

# 222. Step 9 — Role/Permission Acceptance

Verify:

```text
role exists
permission mapping works
authorized admin assigns role
unauthorized caller denied
temporary expired role ignored
audit exists
event exists if platform consumer requires it
```

---

# 223. Step 10 — Operational Acceptance

Verify:

```text
metrics exposed
logs structured
secrets absent
alerts defined
key compromise runbook exists
Redis failure behavior documented
DB failure behavior documented
signing-key failure behavior documented
```

---

# 224. Definition of Done — Architecture

- [ ] Identity owns only identity/auth/security concerns.
- [ ] Customer profile remains outside Identity.
- [ ] Clean/Hexagonal boundaries enforced.
- [ ] Domain independent of Spring/JPA/Kafka.
- [ ] Application uses ports.
- [ ] Adapters translate infrastructure/transport.
- [ ] Architecture tests pass.
- [ ] No direct database access to other services.

---

# 225. Definition of Done — Domain

- [ ] UserIdentity modeled.
- [ ] IdentityStatus modeled.
- [ ] State transitions validated.
- [ ] Login identifier model.
- [ ] Identifier normalization.
- [ ] Verification status.
- [ ] Credential model.
- [ ] Session model.
- [ ] Refresh token family.
- [ ] Role model.
- [ ] Permission model.
- [ ] Security events.
- [ ] Core invariants tested.

---

# 226. Definition of Done — Password Security

- [ ] Approved hashing algorithm.
- [ ] Approved parameters.
- [ ] Password policy configuration.
- [ ] No raw password persistence.
- [ ] No password logging.
- [ ] Rehash on successful login.
- [ ] Change-password flow.
- [ ] Migration strategy.

---

# 227. Definition of Done — Registration

- [ ] Contract approved.
- [ ] Identifier normalization.
- [ ] Rate limiting.
- [ ] Password policy.
- [ ] Unique constraint.
- [ ] Atomic transaction.
- [ ] Outbox event.
- [ ] Duplicate race tested.
- [ ] Idempotency decision documented.
- [ ] Error mapping stable.

---

# 228. Definition of Done — Login

- [ ] Login contract.
- [ ] Enumeration-safe failure.
- [ ] Rate limit.
- [ ] Account state enforcement.
- [ ] Password verification.
- [ ] Rehash.
- [ ] Session creation.
- [ ] Refresh creation.
- [ ] Access-token issuance.
- [ ] Security event.
- [ ] Logs safe.
- [ ] Tests pass.

---

# 229. Definition of Done — JWT/JWKS

- [ ] Issuer.
- [ ] Audience.
- [ ] Lifetime.
- [ ] Required claims.
- [ ] Claims minimized.
- [ ] Signing algorithm.
- [ ] `kid`.
- [ ] Private key source.
- [ ] JWKS endpoint.
- [ ] Rotation strategy.
- [ ] Unknown-kid behavior.
- [ ] JWT tests.
- [ ] Downstream local-validation guidance.

---

# 230. Definition of Done — Refresh

- [ ] Opaque/approved refresh format.
- [ ] Hash stored.
- [ ] Family ID.
- [ ] Rotation.
- [ ] Used/revoked state.
- [ ] Replacement linkage.
- [ ] Reuse detection.
- [ ] Concurrency protection.
- [ ] Family/session revocation.
- [ ] Rate limit.
- [ ] Security event.
- [ ] Tests.

---

# 231. Definition of Done — Sessions

- [ ] Session persisted.
- [ ] Expiry policy.
- [ ] Revoke current.
- [ ] Revoke one.
- [ ] Revoke all.
- [ ] List sessions.
- [ ] Device metadata reviewed.
- [ ] Revoked session blocked.
- [ ] Audit.
- [ ] Tests.

---

# 232. Definition of Done — Password Reset

- [ ] Request endpoint.
- [ ] Enumeration-safe response.
- [ ] Challenge model.
- [ ] Secure OTP/reset secret.
- [ ] TTL.
- [ ] Attempt limit.
- [ ] Cooldown.
- [ ] Rate limits.
- [ ] Verify endpoint.
- [ ] Reset authorization.
- [ ] Reset token purpose restriction.
- [ ] Confirm endpoint.
- [ ] Atomic single-use consumption.
- [ ] Session revocation policy.
- [ ] Notification failure behavior.
- [ ] Security events.
- [ ] Tests.

---

# 233. Definition of Done — Roles/Permissions

- [ ] Role table.
- [ ] Permission table.
- [ ] Role-permission mapping.
- [ ] User-role mapping.
- [ ] Expiring roles where needed.
- [ ] Admin endpoints.
- [ ] Strict authorization.
- [ ] No self-assignment.
- [ ] Audit.
- [ ] Tests.

---

# 234. Definition of Done — Persistence

- [ ] `identity_db`.
- [ ] Service-specific DB user.
- [ ] Flyway migrations.
- [ ] Unique constraints.
- [ ] Required indexes.
- [ ] No cross-service FK.
- [ ] Security-event append-only strategy.
- [ ] Outbox.
- [ ] Idempotency table if required.
- [ ] Migration tests.
- [ ] Retention reviewed.

---

# 235. Definition of Done — Redis

If Redis is used:

- [ ] Key namespace.
- [ ] Rate-limit keys.
- [ ] TTLs.
- [ ] Reset/cooldown behavior.
- [ ] Failure mode.
- [ ] No authoritative Identity state stored only in Redis.
- [ ] Integration tests.

---

# 236. Definition of Done — Contracts

- [ ] OpenAPI registration.
- [ ] OpenAPI login.
- [ ] OpenAPI refresh.
- [ ] OpenAPI logout.
- [ ] Session contracts.
- [ ] Password-change contract.
- [ ] Password-reset contracts.
- [ ] Admin role contracts.
- [ ] Error catalog.
- [ ] JWT claims documented.
- [ ] JWKS documented.
- [ ] Published events versioned.
- [ ] Contract tests.

---

# 237. Definition of Done — Security

- [ ] Deny-by-default.
- [ ] Public routes explicit.
- [ ] Authenticated routes explicit.
- [ ] Admin permissions explicit.
- [ ] Rate limits.
- [ ] Password hash safe.
- [ ] JWT signing safe.
- [ ] Key rotation.
- [ ] Refresh rotation.
- [ ] Replay detection.
- [ ] Reset single-use.
- [ ] Enumeration protection.
- [ ] Secrets excluded from logs/source.
- [ ] Audit events.
- [ ] Security tests.
- [ ] Threat review.

---

# 238. Definition of Done — Observability

- [ ] Structured logging.
- [ ] Request ID.
- [ ] Correlation ID.
- [ ] Trace context.
- [ ] Metrics.
- [ ] Alerts.
- [ ] Dashboard definition.
- [ ] Security-event audit.
- [ ] No high-cardinality user labels in metrics.
- [ ] Runbooks.

---

# 239. Definition of Done — Testing

- [ ] Domain tests.
- [ ] Application tests.
- [ ] REST adapter tests.
- [ ] Persistence tests.
- [ ] PostgreSQL Testcontainers.
- [ ] Redis Testcontainers if used.
- [ ] JWT tests.
- [ ] Security tests.
- [ ] Contract tests.
- [ ] Migration tests.
- [ ] Concurrency tests.
- [ ] Architecture tests.
- [ ] Critical failure-mode tests.

---

# 240. Definition of Done — Runtime

- [ ] Dockerfile.
- [ ] Non-root runtime inherited from platform standard.
- [ ] `.env.example`.
- [ ] Health endpoint.
- [ ] Local docker-compose integration.
- [ ] No production secrets required locally.
- [ ] JWT local test keys.
- [ ] Service starts from documented steps.
- [ ] Graceful shutdown compatible with platform.

---

# 241. Definition of Done — Documentation

- [ ] README.
- [ ] Architecture.
- [ ] Data model.
- [ ] REST/OpenAPI.
- [ ] JWT claims.
- [ ] JWKS.
- [ ] Roles/permissions.
- [ ] Password policy.
- [ ] Session policy.
- [ ] Refresh rotation.
- [ ] Password reset.
- [ ] Rate limits.
- [ ] Security events.
- [ ] Published events.
- [ ] Error catalog.
- [ ] Runbooks.
- [ ] ADRs.
- [ ] Open policy decisions resolved before production.

---

# 242. Phase 4 Acceptance Test

A clean local environment should support:

```text
docker compose --profile infra up -d
      ↓
identity_db healthy
Redis healthy if enabled
      ↓
identity-service starts
      ↓
Flyway migrates
      ↓
JWKS available
```

Functional test:

```text
1. Register user
2. Verify DB contains only password hash
3. Login
4. Receive access + refresh tokens
5. Validate JWT signature against JWKS
6. Call /auth/me
7. List sessions
8. Refresh token
9. Verify old refresh cannot be reused
10. Logout
11. Verify session cannot refresh
```

Password reset test:

```text
1. Request reset
2. Verify non-enumerating response
3. Obtain test OTP through safe test adapter
4. Verify challenge
5. Receive reset-only authorization
6. Confirm new password
7. Reuse reset token → rejected
8. Login using old password → rejected
9. Login using new password → succeeds
```

Concurrency test:

```text
same refresh token
      ↓
two simultaneous refresh requests
      ↓
only one valid branch
```

Registration race test:

```text
same normalized identifier
      ↓
two simultaneous registration requests
      ↓
one identity created
      ↓
other request maps safely to duplicate
```

---

# 243. Phase 4 Final Result

When complete:

```text
IDENTITY SERVICE
│
├── Service Bootstrap                      ✅
├── Clean / Hexagonal Architecture         ✅
│
├── Domain
│   ├── User Identity                      ✅
│   ├── Identity Status                    ✅
│   ├── Login Identifiers                  ✅
│   ├── Credentials                        ✅
│   ├── Sessions                           ✅
│   ├── Refresh Families                   ✅
│   ├── Roles                              ✅
│   ├── Permissions                        ✅
│   └── Security Events                    ✅
│
├── Authentication
│   ├── Registration                       ✅
│   ├── Login                              ✅
│   ├── JWT Access Token                   ✅
│   ├── JWKS                               ✅
│   ├── Refresh Rotation                   ✅
│   ├── Reuse Detection                    ✅
│   └── Logout                             ✅
│
├── Account Security
│   ├── Password Change                    ✅
│   ├── Password Reset                     ✅
│   ├── Rate Limiting                      ✅
│   ├── Account Lock                       ✅
│   ├── Account Disable                    ✅
│   └── Session Revocation                 ✅
│
├── Authorization
│   ├── Role Model                         ✅
│   ├── Permission Model                   ✅
│   ├── Role Assignment                    ✅
│   └── Admin Controls                     ✅
│
├── Persistence
│   ├── identity_db                        ✅
│   ├── Flyway                             ✅
│   ├── Constraints                        ✅
│   ├── Idempotency                        ✅
│   ├── Outbox                             ✅
│   └── Security Audit                     ✅
│
├── Contracts
│   ├── OpenAPI                            ✅
│   ├── Error Catalog                      ✅
│   ├── JWT Claims                         ✅
│   ├── JWKS Contract                      ✅
│   └── Events                             ✅
│
├── Security                               ✅
├── Testing                                ✅
├── Observability                          ✅
├── Runbooks                               ✅
├── Backup / Recovery Awareness            ✅
└── Documentation                          ✅
```

---

# 244. Handoff to Phase 5

After Identity is complete, move to:

```text
PHASE 05 — Customer Service
```

The critical boundary is:

```text
Identity Service
    owns:
        authentication
        credentials
        sessions
        tokens
        roles/security identity

Customer Service
    owns:
        customer profile
        customer name/contact business data
        member identity/mapping
        preferences
        consent
        customer lifecycle business state
```

Relationship:

```text
Identity
   │
   │ stable user_id
   ▼
Customer Service
```

Customer Service must not:

```text
query identity_db directly
```

It depends on:

```text
stable user_id
contracts/events where required
```

---

# 245. Phase 4 Policy Freeze Checklist

Before declaring Phase 4 production-ready, replace every `TBD_POLICY` / `TBD_SECURITY` item.

- [ ] Canonical login identifier.
- [ ] Identifier verification requirement.
- [ ] Registration initial status.
- [ ] Password minimum length.
- [ ] Password maximum length.
- [ ] Hash algorithm.
- [ ] Hash parameters.
- [ ] Access-token lifetime.
- [ ] Refresh-token lifetime.
- [ ] Session absolute lifetime.
- [ ] Session idle lifetime.
- [ ] JWT signing algorithm.
- [ ] JWT issuer.
- [ ] JWT audiences.
- [ ] Signing key provider.
- [ ] Key rotation interval/process.
- [ ] Login rate limits.
- [ ] Temporary lock threshold.
- [ ] Lock duration.
- [ ] Registration rate limits.
- [ ] Refresh rate limits.
- [ ] Reset resend cooldown.
- [ ] Reset OTP lifetime.
- [ ] Reset attempt limit.
- [ ] Reset window limit.
- [ ] Reset daily limit.
- [ ] Reset authorization lifetime.
- [ ] Password-change session revocation rule.
- [ ] Password-reset session revocation rule.
- [ ] Revoke-all current-session behavior.
- [ ] `ACCOUNT_LOCKED` public HTTP mapping.
- [ ] `PASSWORD_RESET_INVALID` public HTTP mapping.
- [ ] Initial role set.
- [ ] Initial permission set.
- [ ] High-privilege role approval policy.
- [ ] Redis failure policy per critical control.
- [ ] Identity event consumers.
- [ ] Retention for security events.
- [ ] Retention for sessions/refresh/reset records.
- [ ] MFA scope for initial release.

Until these decisions are approved:

```text
Identity implementation may proceed locally,
but production security behavior is not fully frozen.
```

---

# 246. Recommended Phase 4 Work Breakdown

Use implementation tickets such as:

```text
ID-001 Bootstrap identity-service
ID-002 Create Identity Flyway baseline
ID-003 Implement UserIdentity domain
ID-004 Implement identifier normalization
ID-005 Implement password hashing adapter
ID-006 Implement registration
ID-007 Implement JWT signing
ID-008 Implement JWKS
ID-009 Implement session domain
ID-010 Implement refresh token family
ID-011 Implement login
ID-012 Implement refresh rotation
ID-013 Implement reuse detection
ID-014 Implement logout
ID-015 Implement session listing/revocation
ID-016 Implement password change
ID-017 Implement password reset request
ID-018 Implement password reset verify
ID-019 Implement password reset confirm
ID-020 Implement rate limiting
ID-021 Implement roles
ID-022 Implement permissions
ID-023 Implement admin role assignment
ID-024 Implement account disable/unlock
ID-025 Implement security events
ID-026 Implement Identity outbox events
ID-027 Implement notification adapter
ID-028 Complete OpenAPI
ID-029 Complete contract tests
ID-030 Complete integration tests
ID-031 Complete concurrency tests
ID-032 Complete security tests
ID-033 Complete observability
ID-034 Complete runbooks
ID-035 Complete ADRs
ID-036 Phase 4 acceptance test
```

---

# 247. What Must Not Be Done in Phase 4

Do not:

```text
put customer profile into Identity
store plaintext passwords
store raw refresh tokens without reason
publish password/OTP/token data in events
call Identity on every downstream API request
use Redis as the only source of session truth
allow users to self-assign roles
silently fail open when critical abuse controls fail
expose SQL/security internals in errors
hard-code example policy values as production rules
implement MFA/passkeys/federation unless approved scope requires them
read/write another service's database
skip refresh concurrency testing
skip password-reset replay testing
skip signing-key rotation design
```

---

# 248. Final Phase 4 Exit Questions

The Identity phase is ready when the team can answer:

## Ownership

```text
What data and security facts does Identity own?
```

## Boundary

```text
What profile/business data explicitly belongs outside Identity?
```

## Authentication

```text
How does registration/login authenticate safely?
```

## Credentials

```text
How are passwords hashed, versioned, and upgraded?
```

## Tokens

```text
What are issuer, audience, claims, lifetime, signing algorithm, kid, and rotation policy?
```

## Refresh

```text
How does rotation work and how is replay detected?
```

## Sessions

```text
How are sessions expired, listed, revoked, and recovered?
```

## Recovery

```text
How does password reset avoid enumeration, brute force, replay, and duplicate consumption?
```

## Authorization

```text
How do roles and permissions work without self-escalation?
```

## Data

```text
What tables are authoritative and which constraints protect invariants?
```

## Concurrency

```text
How are registration, refresh, and reset races prevented?
```

## Security

```text
What secrets/tokens must never appear in logs/events/errors?
```

## Availability

```text
What happens when PostgreSQL, Redis, signing keys, notification provider, or JWKS fail?
```

## Observability

```text
Which metrics, alerts, logs, security events, and runbooks detect/authenticate failures?
```

## Testing

```text
Do registration/login/refresh/reset/session/JWT/authorization/concurrency/security tests pass?
```

If any answer is unclear:

```text
Phase 4 is not complete.
```

---

**End of PHASE 04 — Identity Service**
