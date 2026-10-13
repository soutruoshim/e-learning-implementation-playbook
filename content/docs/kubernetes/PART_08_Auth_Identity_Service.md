---
title: "PART 08 — AUTH / IDENTITY SERVICE"
---

# PART 08 — AUTH / IDENTITY SERVICE

> **Document Role:** Defines the complete architecture, domain model, persistence model, contracts, security controls, operational behavior, and implementation standards for the Auth / Identity Service.  
> **Previous Part:** PART 07 — Data Architecture  
> **Next Part:** PART 09 — Customer Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, Spring Security, PostgreSQL, Redis where appropriate, OAuth2/OIDC concepts, JWT  
> **Audience:** Backend engineers, security engineers, software architects, QA engineers, DevOps engineers, SREs, technical leads.

---

# 788 — Purpose

The Auth / Identity Service owns platform identity and authentication.

Its responsibility is to answer:

```text
Who is this caller?
Can the caller prove that identity?
What security state does the identity have?
Which roles / permissions are associated with the identity?
Which sessions and credentials are valid?
```

It does **not** own:

```text
Orders
Wallet balance
Loyalty points
Payment transactions
Product catalog
Mission progress
Customer purchase history
```

Customer profile data may be separated into Customer Service.

The Identity Service should remain focused on:

```text
Identity
Credentials
Authentication
Sessions
Tokens
Roles
Permissions
Security Events
Account Recovery
```

---

# 789 — Identity Service Responsibilities

The Identity Service owns:

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
Account lock/security state
Authentication security events
Signing-key integration
```

Possible future responsibilities:

```text
MFA
Passkeys / WebAuthn
Device trust
Risk-based authentication
Federated identity
Social login
Enterprise SSO
```

---

# 790 — Non-Responsibilities

The Identity Service should not own:

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

If identity needs information from another domain, use:

```text
API
gRPC
event
```

not direct database access.

---

# 791 — Identity Boundary

High-level boundary:

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

External systems:

```text
Email/SMS provider
Identity Provider
Key/JWKS provider
Security monitoring
```

must connect through adapters.

---

# 792 — Ubiquitous Language

Important Identity terms:

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
| Revocation | Invalidation of a session/token/credential |
| Password Reset Challenge | Short-lived proof used in recovery |
| Security Event | Auditable authentication/security action |

---

# 793 — Identity Aggregate

Possible aggregate root:

```text
UserIdentity
```

Possible state:

```text
user_id
username / login identifiers
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

Not every child record needs to be embedded in one large object.

Keep aggregates small enough for reliable transactions.

---

# 794 — Identity Status

Recommended statuses:

```text
PENDING
ACTIVE
SUSPENDED
LOCKED
DISABLED
```

Meaning:

```text
PENDING   → registration not fully activated
ACTIVE    → authentication allowed
SUSPENDED → administratively blocked
LOCKED    → security lock, usually temporary
DISABLED  → permanently or long-term disabled
```

Exact transitions must be documented.

---

# 795 — Identity State Transitions

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

Invalid transitions must be rejected.

---

# 796 — Identity Invariants

Examples:

```text
user_id is immutable
primary login identifier must be unique within its scope
disabled identity cannot authenticate
locked identity cannot authenticate until allowed
password reset authorization is single-use
refresh token cannot be reused after rotation
role assignment must reference an existing role
security-sensitive changes must be auditable
```

---

# 797 — Login Identifier

Possible login identifiers:

```text
email
phone number
username
member number
```

The platform should define one or more canonical identifiers.

Each identifier requires:

```text
normalization
uniqueness
verification state
case-sensitivity rules
```

---

# 798 — Identifier Normalization

Examples:

Email:

```text
trim
lowercase domain
organization-defined local-part handling
```

Phone:

```text
normalize to canonical international format
```

Username:

```text
trim
case policy
allowed-character policy
```

Normalization must happen before uniqueness checks.

---

# 799 — Identifier Verification

A login identifier may have state:

```text
UNVERIFIED
VERIFIED
REVOKED
```

Examples:

```text
phone verified by OTP
email verified by secure link
```

Authentication policy must define whether unverified identities may log in.

---

# 800 — Credential Model

Credentials should be separate from customer-profile information.

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

and later extend.

---

# 801 — Password Credential

Possible fields:

```text
credential_id
user_id
password_hash
algorithm
credential_version
created_at
updated_at
password_changed_at
```

Never store:

```text
plain password
reversible password
password hint containing the password
```

---

# 802 — Password Hashing

Preferred:

```text
Argon2id
```

Alternative where required:

```text
bcrypt
```

Hashing parameters must be configurable.

Example conceptual configuration:

```text
algorithm = Argon2id
memory cost = security-approved value
iterations = security-approved value
parallelism = security-approved value
```

Do not hard-code weak parameters permanently.

---

# 803 — Password Rehash

If hashing parameters are strengthened:

```text
User logs in successfully
        ↓
Verify old hash
        ↓
Hash with new parameters
        ↓
Replace stored hash
```

This allows gradual migration.

---

# 804 — Password Rules

Recommended security direction:

```text
minimum length
maximum supported length
breached-password screening where available
rate limiting
MFA for privileged users
```

Avoid excessive complexity rules that encourage predictable patterns.

---

# 805 — Password Change

Authenticated password change flow:

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
Invalidate/revoke selected sessions
      ↓
Create security event
```

---

# 806 — Password Reuse

If business/security policy requires, maintain limited password-history hashes.

Example:

```text
prevent reuse of last N passwords
```

Use only if policy requires.

Do not store old plaintext passwords.

---

# 807 — Registration Use Case

Registration creates a new identity.

Typical flow:

```text
Client
  ↓
Register request
  ↓
Normalize identifier
  ↓
Check duplicate
  ↓
Validate password
  ↓
Create identity
  ↓
Create credential
  ↓
Optional verification challenge
  ↓
Commit
  ↓
Publish UserRegistered
```

---

# 808 — Registration Contract

Example endpoint:

```text
POST /api/v1/auth/register
```

Request:

```json
{
  "phone_number": "+85512345678",
  "password": "********"
}
```

Possible response:

```json
{
  "data": {
    "user_id": "USR001",
    "status": "PENDING"
  }
}
```

---

# 809 — Registration Errors

Possible errors:

```text
IDENTIFIER_ALREADY_EXISTS
INVALID_IDENTIFIER
WEAK_PASSWORD
REGISTRATION_DISABLED
RATE_LIMITED
```

Do not return raw database unique-constraint errors.

---

# 810 — Registration Idempotency

Registration may need idempotency if retried from unstable clients.

Potential scope:

```text
normalized identifier
```

or explicit:

```text
Idempotency-Key
```

Business behavior must be defined.

---

# 811 — User Registration Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "USER_REGISTERED",
  "event_version": 1,
  "occurred_at": "...",
  "producer": "identity-service",
  "data": {
    "user_id": "USR001"
  }
}
```

Do not publish:

```text
password
password hash
refresh token
security secret
```

---

# 812 — Login Use Case

Login flow:

```text
Client
  ↓
Login request
  ↓
Rate limit
  ↓
Normalize identifier
  ↓
Find identity
  ↓
Check account status
  ↓
Verify credential
  ↓
Evaluate security policy
  ↓
Create session
  ↓
Issue access token
  ↓
Issue refresh token
  ↓
Record security event
```

---

# 813 — Login Endpoint

Example:

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

Response:

```json
{
  "data": {
    "access_token": "<token>",
    "token_type": "Bearer",
    "expires_in": 900,
    "refresh_token": "<token>",
    "refresh_expires_in": 2592000
  }
}
```

Exact lifetime is policy-controlled.

---

# 814 — Login Enumeration Protection

Avoid obvious responses:

```text
User does not exist
```

versus:

```text
Wrong password
```

when account enumeration is a concern.

Prefer a stable error:

```text
INVALID_CREDENTIALS
```

Detailed internal reason may be logged securely.

---

# 815 — Login Failure Handling

Track:

```text
failed_attempt_count
last_failed_at
source IP
device metadata where available
```

Possible controls:

```text
progressive delay
temporary lock
captcha/risk challenge
MFA step-up
```

---

# 816 — Account Lock

Lock state may include:

```text
locked_at
locked_until
lock_reason
failed_attempt_count
```

Temporary lock should automatically expire or be cleared by controlled policy.

---

# 817 — Account Lockout Anti-Abuse

Avoid easy denial-of-service where attacker can permanently lock an account.

Use:

```text
progressive throttling
temporary lock
IP/device risk
secondary verification
```

instead of permanent lock from a small number of failures.

---

# 818 — Successful Login Event

Security event:

```text
LOGIN_SUCCEEDED
```

Possible fields:

```text
user_id
session_id
request_id
source_ip
device_id
user_agent
occurred_at
```

Do not include access token.

---

# 819 — Failed Login Event

Security event:

```text
LOGIN_FAILED
```

Possible internal reason:

```text
UNKNOWN_IDENTIFIER
BAD_PASSWORD
ACCOUNT_LOCKED
ACCOUNT_DISABLED
```

External response may remain generic.

---

# 820 — Session Domain

Session represents a logical authenticated session.

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

---

# 821 — Session Status

Derived states:

```text
ACTIVE
EXPIRED
REVOKED
```

A session must not be treated as active after revocation.

---

# 822 — Session Creation

Create session only after successful authentication.

Example:

```text
Authenticate
  ↓
Create Session
  ↓
Create Refresh Token Family
  ↓
Issue Access Token
```

---

# 823 — Session Expiry

Session may have:

```text
absolute expiry
idle expiry
```

Example concept:

```text
absolute = 30 days
idle = 7 days
```

Exact values belong to policy.

---

# 824 — Device Session

Device metadata may include:

```text
device_id
device_name
platform
app_version
last_ip
last_seen_at
```

Treat as metadata, not perfect proof of device identity.

---

# 825 — List Sessions

Endpoint:

```text
GET /api/v1/auth/sessions
```

Possible response:

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

---

# 826 — Revoke Session

Endpoint:

```text
DELETE /api/v1/auth/sessions/{sessionId}
```

Rules:

```text
user may revoke own session
admin/support rules must be explicit
audit the revocation
```

---

# 827 — Revoke All Sessions

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

May preserve current session only if explicitly designed.

---

# 828 — Access Token Architecture

Access token contains only necessary claims.

Possible claims:

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

Avoid embedding rapidly changing profile data.

---

# 829 — Access Token Lifetime

Keep access tokens short-lived.

Example policy range:

```text
5–15 minutes
```

Short lifetimes reduce revocation exposure.

---

# 830 — Access Token Audience

Use explicit audiences.

Examples:

```text
brown-public-api
wallet-service
admin-api
```

Services must reject tokens intended for another audience.

---

# 831 — Access Token Scope

Examples:

```text
orders.read
orders.create
wallet.read
profile.read
```

Service tokens may use more specific scopes.

---

# 832 — Access Token Signing

Recommended asymmetric signing.

Example:

```text
RS256
```

with:

```text
kid
```

Key material must be managed outside application source code.

---

# 833 — JWT Key Provider Port

Application/infrastructure abstraction:

```java
public interface SigningKeyProvider {

    SigningKey currentSigningKey();

    Collection<VerificationKey> verificationKeys();
}
```

Private key material should be loaded securely.

---

# 834 — JWKS Endpoint

If Identity owns signing:

```text
GET /.well-known/jwks.json
```

returns public verification keys.

Never return private key material.

---

# 835 — Key Rotation

Rotation sequence:

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

---

# 836 — Refresh Token Architecture

Refresh tokens should be opaque or securely structured.

Recommended server-side state:

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

Store hash where possible, not raw token.

---

# 837 — Refresh Token Family

Example:

```text
family_id = RF001

token A
  ↓ refresh
token B
  ↓ refresh
token C
```

Reusing token A after it was rotated indicates possible theft.

---

# 838 — Refresh Token Endpoint

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
    "expires_in": 900
  }
}
```

---

# 839 — Refresh Token Rotation

Transaction:

```text
Load token by hash
      ↓
Validate active
      ↓
Mark current token used/revoked
      ↓
Create replacement
      ↓
Issue new access token
      ↓
Commit
```

Must be concurrency-safe.

---

# 840 — Refresh Token Reuse Detection

If an already-used token appears:

```text
possible replay
```

Recommended response:

```text
revoke token family
revoke session
emit security event
require login again
```

---

# 841 — Refresh Token Concurrency

Mobile apps may send concurrent refresh requests accidentally.

The design must define behavior.

Possible strategy:

```text
serialize refresh per session
```

or limited grace strategy if justified.

Do not accidentally create multiple valid branches in one refresh-token family.

---

# 842 — Logout Use Case

Logout should revoke the current session or refresh-token family.

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
Revoke refresh tokens
      ↓
Mark session revoked
      ↓
Security event
```

Access token may remain technically valid until expiry unless a denylist is used.

---

# 843 — Access Token Revocation Strategy

Preferred:

```text
short access token lifetime
+
session / refresh revocation
```

High-risk scenarios may use:

```text
token denylist
```

but this adds shared-state lookup.

---

# 844 — Token Denylist

If used:

```text
jti
expires_at
reason
```

Redis may hold short-lived denylist entries.

Do not let Redis become the authoritative source for long-term session history.

---

# 845 — Password Reset Overview

Password reset is a security-sensitive flow.

Recommended sequence:

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
Revoke sessions if policy requires
```

---

# 846 — Password Reset Request Endpoint

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

---

# 847 — Password Reset Challenge

Possible fields:

```text
challenge_id
user_id
challenge_type
otp_hash
created_at
expires_at
attempt_count
verified_at
revoked_at
```

Do not store OTP plaintext if avoidable.

---

# 848 — OTP Generation

Use cryptographically secure randomness.

OTP should be:

```text
short-lived
single-use
attempt-limited
rate-limited
```

---

# 849 — Password Reset Verification Endpoint

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

Successful result should return a short-lived reset authorization, not directly expose privileged long-lived access.

---

# 850 — Reset Authorization Token

Possible claims:

```text
purpose = password_reset
user_id
challenge_id
issued_at
expires_at
jti
```

Must not be accepted as a normal access token.

---

# 851 — Password Reset Confirm Endpoint

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
Validate password
      ↓
Change credential
      ↓
Mark challenge consumed
      ↓
Revoke sessions if policy
      ↓
Security event
```

---

# 852 — Password Reset Idempotency

The confirm operation must not allow repeated credential changes from the same reset authorization.

Use:

```text
single-use challenge
unique consumption
transactional update
```

---

# 853 — Password Reset Rate Limits

Apply limits by:

```text
identifier
IP
device/session where available
```

Use:

```text
resend cooldown
verification attempt limit
window limits
daily limits
```

Thresholds should be configurable, not hard-coded.

---

# 854 — Password Reset Security Events

Examples:

```text
PASSWORD_RESET_REQUESTED
PASSWORD_RESET_CHALLENGE_VERIFIED
PASSWORD_RESET_SUCCEEDED
PASSWORD_RESET_FAILED
PASSWORD_RESET_RATE_LIMITED
```

---

# 855 — Role Model

Role table:

```text
roles
-----
role_id
code
name
description
status
```

Examples:

```text
USER
STORE_STAFF
SUPPORT
FINANCE
LOYALTY_ADMIN
SYSTEM_ADMIN
```

---

# 856 — Permission Model

Permission table:

```text
permissions
-----------
permission_id
code
description
```

Examples:

```text
orders.read.own
orders.read.any
payments.refund
wallet.adjust
missions.manage
```

---

# 857 — Role-Permission Mapping

```text
role_permissions
----------------
role_id
permission_id
```

Roles are convenience groupings.

Permissions are the actual granular capabilities.

---

# 858 — User-Role Mapping

```text
user_roles
----------
user_id
role_id
assigned_at
assigned_by
expires_at
```

Support temporary role assignment using:

```text
expires_at
```

where useful.

---

# 859 — Role Assignment Rules

High-privilege roles require:

```text
restricted admin permission
audit event
possibly approval
possibly MFA step-up
```

Do not let users self-assign roles.

---

# 860 — Permission Evaluation

At token issuance:

```text
User roles
   ↓
Resolve permissions/scopes
   ↓
Include limited claims
```

Do not put thousands of permissions into JWT.

For very dynamic permissions, services may require additional authorization checks.

---

# 861 — Admin Role Management Endpoint

Possible endpoints:

```text
GET  /api/v1/admin/roles
POST /api/v1/admin/users/{id}/roles
DELETE /api/v1/admin/users/{id}/roles/{role}
```

All require strict authorization.

---

# 862 — Admin Identity Operations

Possible operations:

```text
disable user
unlock user
revoke sessions
assign role
remove role
view security events
```

Each operation must be audited.

---

# 863 — Account Disable

Disable flow:

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

# 864 — Account Re-Enable

Re-enable must:

```text
verify authorization
clear appropriate state
audit action
```

Do not automatically restore expired credentials or revoked sessions.

---

# 865 — Security Event Domain

Security events record authentication/security actions.

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

---

# 866 — Security Event Schema

Possible table:

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

# 867 — Security Event Immutability

Security events should be append-only.

Application should not normally:

```text
UPDATE
DELETE
```

security-event rows.

Retention policy should be explicit.

---

# 868 — Identity Database Overview

Possible tables:

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

Optional:

```text
mfa_methods
recovery_codes
trusted_devices
```

---

# 869 — Users Table

Example:

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

Identity table should remain minimal.

Avoid customer-profile fields unless Identity truly owns them.

---

# 870 — User Identifiers Table

Example:

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

Unique candidate:

```text
(type, normalized_value)
```

---

# 871 — Credentials Table

Example:

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

For password:

```text
secret_hash = password hash
```

---

# 872 — Sessions Table

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

---

# 873 — Refresh Tokens Table

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

---

# 874 — Password Reset Challenges Table

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

# 875 — Roles Table

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

# 876 — Permissions Table

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

# 877 — User Roles Table

```text
user_roles
----------
user_id
role_id
assigned_by
assigned_at
expires_at
```

Composite key may be:

```text
(user_id, role_id)
```

unless history/versioning requires otherwise.

---

# 878 — Identity Outbox

Use outbox for events such as:

```text
UserRegistered
UserDisabled
PasswordChanged
RoleAssigned
```

Transaction:

```text
Update identity state
      ↓
Insert outbox event
      ↓
Commit
```

---

# 879 — Identity Events Published

Candidate events:

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

Not every security event should be published platform-wide.

---

# 880 — Identity Events Consumed

Identity should consume very few domain events.

Possible examples:

```text
CustomerDeleted / account closure request
SecurityIncidentCommand
```

Avoid unnecessary dependencies.

---

# 881 — Public REST Contracts

Core endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{sessionId}
POST /api/v1/auth/sessions/revoke-all

POST /api/v1/auth/password/change

POST /api/v1/auth/password-reset/request
POST /api/v1/auth/password-reset/verify
POST /api/v1/auth/password-reset/confirm
```

---

# 882 — Current Identity Endpoint

Possible:

```text
GET /api/v1/auth/me
```

Response should contain only identity/security-level data.

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

Customer profile belongs to Customer Service.

---

# 883 — Internal Identity Contract

Internal services may need:

```text
token validation through local JWT verification
```

rather than calling Identity on every request.

Avoid central synchronous bottleneck:

```text
Every request
  ↓
Identity Service
```

for token introspection unless opaque-token architecture requires it.

---

# 884 — Token Introspection

If opaque tokens or selected service tokens require introspection:

```text
POST /oauth2/introspect
```

or an internal gRPC equivalent may exist.

Use caching carefully.

---

# 885 — Identity gRPC Contract

Potential internal operations:

```text
GetUserSecurityState
CheckSession
ResolvePermissions
```

Only add if local JWT validation is insufficient.

Avoid turning Identity into a runtime dependency for every API call.

---

# 886 — Authentication Contract Headers

Public requests:

```http
Authorization: Bearer <access_token>
```

Optional tracing:

```text
X-Request-Id
X-Correlation-Id
traceparent
```

---

# 887 — Cookie-Based Session Option

For web admin applications, architecture may use:

```text
Secure
HttpOnly
SameSite
```

cookies.

If cookie authentication is used:

```text
CSRF protection
origin checks
session fixation protection
```

must be included.

---

# 888 — CORS

Identity endpoints often need strict CORS.

Allow only approved web origins.

Do not use wildcard origins with sensitive credentialed requests.

---

# 889 — Rate Limiting

Identity requires aggressive rate limits.

Endpoints:

```text
login
register
password reset request
OTP verify
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

# 890 — Login Rate Limit

Example policy concept:

```text
per IP
per normalized identifier
combined risk threshold
```

Exact values are configuration, not hard-coded domain constants.

---

# 891 — Refresh Rate Limit

Protect refresh endpoint against:

```text
token stuffing
rapid replay
client loops
```

but avoid breaking legitimate token refresh.

---

# 892 — Registration Rate Limit

Protect against:

```text
account spam
SMS/email abuse
resource exhaustion
```

---

# 893 — Password Reset Cooldown

Use resend cooldown.

Example concept:

```text
30 seconds
```

Exact value is policy-controlled.

Cooldown should be enforced consistently across relevant reset attempts according to the chosen identifier/IP policy.

---

# 894 — Login Audit

Audit:

```text
successful login
failed login
lockout
suspicious login
MFA challenge
session creation
```

Do not log credentials.

---

# 895 — Authentication Logging

Safe fields:

```text
user_id
session_id
result
reason code
source_ip
user_agent
request_id
```

Unsafe:

```text
password
raw refresh token
raw access token
OTP
private key
```

---

# 896 — Correlation and Trace

Login request:

```text
Gateway
  ↓ correlation_id
Identity Service
  ↓
DB
  ↓
Notification Adapter if needed
```

Security event should preserve:

```text
request_id
correlation_id
```

---

# 897 — Registration Transaction

Possible local transaction:

```text
BEGIN

Insert user
Insert identifier
Insert credential
Insert outbox event

COMMIT
```

Notification delivery must not remain inside the DB transaction.

---

# 898 — Login Transaction

Possible:

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

The exact token issuance sequence must ensure failure cannot leave unsafe inconsistent state.

---

# 899 — Refresh Transaction

```text
BEGIN

Lock/validate refresh token
Check family
Mark current token consumed
Create replacement token record
Update session last_seen
Insert security event if needed

COMMIT

Return new tokens
```

---

# 900 — Password Reset Confirm Transaction

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

---

# 901 — Concurrency: Registration

Duplicate registration race:

```text
Request A checks user missing
Request B checks user missing
```

Database unique constraint on normalized identifier must protect final integrity.

---

# 902 — Concurrency: Refresh Token

Two concurrent refreshes of the same token must not both succeed independently.

Use:

```text
row locking
atomic update
unique state transition
```

---

# 903 — Concurrency: Password Reset

The same reset token/challenge must not be consumed twice.

Use:

```text
row lock
consumed_at check
atomic update
```

---

# 904 — Identity Idempotency

Candidate idempotent operations:

```text
register
password reset request where appropriate
session revocation
admin disable
```

Login itself is usually not treated as a normal idempotent business operation.

---

# 905 — Failed Authentication Data

Do not permanently grow one row per failed login without retention strategy.

Possible approach:

```text
security event stream
+
short-window counters in Redis
```

Persistent security audit retention should be explicit.

---

# 906 — Redis Usage

Redis may support:

```text
rate limiting
temporary login counters
OTP attempt counters
short-lived token denylist
temporary reset state
```

Authoritative identity state remains in PostgreSQL.

---

# 907 — Redis Failure Behavior

If Redis is unavailable:

```text
authentication behavior must fail safely
```

Do not silently disable critical rate limits without an explicit fallback policy.

For some non-critical counters, degraded behavior may be acceptable.

Document per control.

---

# 908 — Notification Integration

Identity may request:

```text
OTP message
password reset email
security notification
```

Prefer:

```text
Identity
  ↓ NotificationRequested
Notification Service
```

or an explicit notification port.

Identity should not own message delivery infrastructure.

---

# 909 — OTP Delivery

Flow:

```text
Create challenge
      ↓
Commit
      ↓
Request notification
      ↓
Notification provider
```

If delivery fails:

```text
challenge remains controlled
retry policy applies
```

Do not create unlimited new challenges automatically.

---

# 910 — MFA Architecture

Future MFA methods:

```text
TOTP
WebAuthn
Recovery codes
Push
```

Model MFA as separate methods linked to identity.

---

# 911 — MFA Table

Possible:

```text
mfa_methods
-----------
id
user_id
type
status
secret_reference
created_at
verified_at
last_used_at
```

Do not store raw sensitive secrets unless securely protected.

---

# 912 — TOTP

TOTP enrollment:

```text
Generate secret
      ↓
Present securely
      ↓
User verifies code
      ↓
Activate method
```

TOTP secret must be encrypted/protected at rest.

---

# 913 — WebAuthn / Passkeys

Future preferred strong authentication may include:

```text
Passkeys
Hardware keys
Platform authenticators
```

Identity model should remain extensible.

---

# 914 — Recovery Codes

Recovery codes should be:

```text
high entropy
single use
stored hashed
shown once
```

---

# 915 — MFA Step-Up

High-risk operation flow:

```text
Authenticated session
      ↓
Operation requires step-up
      ↓
MFA challenge
      ↓
Short-lived elevated authentication context
      ↓
Operation
```

---

# 916 — Authentication Assurance Level

Future model may define:

```text
AAL1 = password
AAL2 = password + MFA
AAL3 = hardware-backed / stronger proof
```

Services may require higher assurance for sensitive operations.

---

# 917 — External Identity Provider

Federated login may use:

```text
Google
Microsoft
Apple
Enterprise OIDC
```

External identity must map to internal:

```text
user_id
```

Do not use external provider subject directly as the universal internal user ID.

---

# 918 — External Identity Mapping

Possible table:

```text
external_identities
-------------------
id
user_id
provider
provider_subject
created_at
```

Unique:

```text
(provider, provider_subject)
```

---

# 919 — Account Linking

Account linking must avoid takeover.

Require:

```text
authenticated session
or
verified ownership of both identities
```

Do not auto-link based only on matching unverified email.

---

# 920 — Identity Merge

If supported, account merge is high-risk.

Must define:

```text
which user_id survives
session behavior
role behavior
downstream reference behavior
audit
rollback/approval
```

Avoid unless business requires it.

---

# 921 — Account Closure

Identity closure flow:

```text
Authenticated user / authorized admin
      ↓
Check retention obligations
      ↓
Disable login
      ↓
Revoke sessions
      ↓
Publish closure request/event
      ↓
Downstream domains handle owned data
```

Identity cannot directly delete data owned by other services.

---

# 922 — Account Deletion Event

Potential event:

```text
USER_ACCOUNT_CLOSED
```

Consumers decide according to their retention rules.

Example:

```text
Customer Service → anonymize eligible profile
Order Service → retain required transaction history
Wallet Service → retain financial ledger
```

---

# 923 — Identity Service Clean Architecture

Recommended package:

```text
identity-service/
│
├── domain/
│   ├── identity/
│   ├── credential/
│   ├── session/
│   ├── role/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── register/
│   ├── login/
│   ├── refresh/
│   ├── logout/
│   ├── password/
│   ├── session/
│   └── role/
│
├── adapter/in/
│   ├── rest/
│   └── grpc/
│
├── adapter/out/
│   ├── persistence/
│   ├── redis/
│   ├── notification/
│   ├── signing/
│   └── kafka/
│
└── config/
```

---

# 924 — Identity Input Ports

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

---

# 925 — Identity Output Ports

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

---

# 926 — Password Hasher Port

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

This keeps hashing infrastructure outside domain logic.

---

# 927 — Token Signer Port

```java
public interface AccessTokenIssuer {

    IssuedAccessToken issue(
        AccessTokenClaims claims
    );
}
```

Implementation may use:

```text
Nimbus JOSE + JWT
Spring Authorization Server
JCA
external IdP
```

---

# 928 — Rate Limit Port

```java
public interface AuthenticationRateLimitPort {

    RateLimitDecision checkLogin(
        String normalizedIdentifier,
        String sourceIp
    );
}
```

Redis adapter may implement it.

---

# 929 — Clock Port

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

---

# 930 — Random Secret Generator

OTP, reset tokens, refresh tokens require secure randomness.

Port:

```java
public interface SecureTokenGenerator {

    String generate(int bytes);
}
```

Implementation must use cryptographically secure randomness.

---

# 931 — Registration Application Flow

```text
RegisterUserCommand
      ↓
Normalize identifier
      ↓
Check rate limit
      ↓
Check uniqueness
      ↓
Validate password policy
      ↓
Create UserIdentity
      ↓
Hash password
      ↓
Save user + credential
      ↓
Create verification/reset workflow if needed
      ↓
Save outbox event
      ↓
Return result
```

---

# 932 — Login Application Flow

```text
LoginCommand
      ↓
Rate limit
      ↓
Resolve user
      ↓
Validate status
      ↓
Verify password
      ↓
Check rehash
      ↓
Create session
      ↓
Create refresh token
      ↓
Issue access token
      ↓
Audit success
```

Failure path:

```text
Audit failure
Update counter
Return INVALID_CREDENTIALS
```

---

# 933 — Refresh Application Flow

```text
RefreshCommand
      ↓
Hash incoming token
      ↓
Load token
      ↓
Validate session
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

# 934 — Logout Application Flow

```text
LogoutCommand
      ↓
Load session
      ↓
Revoke session
      ↓
Revoke refresh family
      ↓
Audit
```

---

# 935 — Change Password Flow

```text
Authenticated identity
      ↓
Verify current password
      ↓
Validate new password
      ↓
Hash
      ↓
Update credential
      ↓
Revoke selected sessions
      ↓
Audit
      ↓
Publish PasswordChanged
```

---

# 936 — Role Assignment Flow

```text
Authorized admin
      ↓
Validate target user
      ↓
Validate role
      ↓
Check role assignment policy
      ↓
Assign role
      ↓
Audit
      ↓
Publish RoleAssigned
```

---

# 937 — Error Catalog

Candidate errors:

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

# 938 — HTTP Error Mapping

Example:

| Error | HTTP |
|---|---:|
| INVALID_CREDENTIALS | 401 |
| ACCOUNT_LOCKED | 423 or documented 401/403 strategy |
| ACCOUNT_DISABLED | 403 |
| IDENTIFIER_ALREADY_EXISTS | 409 |
| INVALID_REFRESH_TOKEN | 401 |
| PASSWORD_RESET_INVALID | 400/401 depending design |
| ROLE_ASSIGNMENT_DENIED | 403 |
| RATE_LIMITED | 429 |

Choose one consistent public contract.

---

# 939 — Security Error Leakage

Do not expose:

```text
password hash mismatch
database user ID
SQL constraint name
internal token family ID
key storage path
```

Return stable safe errors.

---

# 940 — Registration Tests

Test:

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

# 941 — Login Tests

Test:

```text
success
wrong password
unknown identifier
locked user
disabled user
expired policy state
rate limited
password rehash
session created
refresh token created
security event created
```

---

# 942 — Refresh Token Tests

Test:

```text
valid refresh
expired token
revoked token
reused token
concurrent refresh
wrong token hash
session revoked
rotation family revocation
```

---

# 943 — Password Reset Tests

Test:

```text
request
cooldown
identifier enumeration protection
wrong OTP
expired OTP
attempt limit
successful verification
single-use reset token
confirm password
session revocation
```

---

# 944 — Authorization Tests

Test:

```text
user role
support role
finance role
system admin role
unauthorized role assignment
expired temporary role
resource ownership
```

---

# 945 — JWT Tests

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
```

---

# 946 — Session Tests

Test:

```text
create
list
revoke one
revoke all
expired session
current session behavior
device metadata
```

---

# 947 — Security Event Tests

Verify:

```text
login failure logged
login success logged
password reset logged
role change logged
session revocation logged
sensitive values absent
```

---

# 948 — Integration Tests

Use:

```text
PostgreSQL Testcontainer
Redis Testcontainer if used
HTTP integration test
JWT test keys
```

Do not require real production identity provider for all tests.

---

# 949 — Contract Tests

Verify:

```text
REST request/response
error code stability
OpenAPI
JWT claims
JWKS format
event schema
```

---

# 950 — Load Testing

Identity load scenarios:

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

# 951 — Password Hashing Capacity

Password hashing is intentionally expensive.

Capacity planning must consider:

```text
CPU per login
concurrent logins
DoS risk
hash parameters
autoscaling
```

Do not weaken hashing only to hide poor capacity planning.

---

# 952 — Refresh Capacity

Refresh traffic may be much higher than login traffic.

Estimate:

```text
active users
access token lifetime
refresh frequency
mobile reconnect patterns
```

---

# 953 — JWKS Caching

Services validating JWT should cache public keys.

Key rotation requires:

```text
refresh on unknown kid
reasonable cache expiry
fallback behavior
```

Avoid calling Identity for JWKS on every request.

---

# 954 — Availability

Identity is a Tier-1 critical service.

Outage impacts:

```text
new login
registration
refresh
password reset
role administration
```

Already-issued access tokens may continue working until expiry if services validate locally.

This improves resilience.

---

# 955 — Identity Failure Modes

Consider:

```text
PostgreSQL down
Redis down
signing key unavailable
notification provider down
JWKS unavailable
high login attack
clock drift
```

Each requires defined behavior.

---

# 956 — Database Failure

If identity DB is unavailable:

```text
login should fail
refresh should fail
registration should fail
```

Do not authenticate based on stale mutable credential data.

Already-issued access tokens may remain valid according to token policy.

---

# 957 — Signing Key Failure

If signing key is unavailable:

```text
do not issue unsigned token
do not fall back to insecure key
```

Service should become unable to issue tokens and alert operators.

---

# 958 — Notification Failure

Password-reset OTP delivery failure should not expose account existence.

System should:

```text
record delivery failure
allow controlled retry
respect cooldown/rate limit
```

---

# 959 — Redis Failure

If Redis holds only rate-limit counters:

```text
choose fail-closed or safe degraded policy per endpoint
```

For authentication abuse controls, fail-open may be risky.

The policy must be explicit.

---

# 960 — Clock Drift

Identity depends on accurate time for:

```text
JWT expiry
OTP expiry
refresh expiry
session expiry
rate limit windows
```

Monitor NTP/time sync.

---

# 961 — Identity Metrics

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

---

# 962 — Identity SLIs

Possible SLIs:

```text
login success latency
refresh latency
token issuance success rate
availability
password reset success rate
JWT signing failures
```

---

# 963 — Identity Alerts

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

# 964 — Identity Logs

Structured log fields:

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

Never log:

```text
password
OTP
raw access token
raw refresh token
private signing key
```

---

# 965 — Identity Dashboard

Dashboard should show:

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

# 966 — Runbooks

Required runbooks:

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

# 967 — Signing Key Compromise Runbook

Steps:

```text
Declare incident
Stop compromised key use
Generate replacement
Publish new public key
Rotate signer
Revoke sessions / tokens according to risk
Investigate misuse
Retire compromised key
Document postmortem
```

---

# 968 — Refresh Token Theft Runbook

If large-scale reuse is detected:

```text
revoke affected token families
revoke sessions
force reauthentication
notify affected users if policy requires
investigate source
```

---

# 969 — Account Takeover Response

Possible actions:

```text
lock account
revoke sessions
reset credentials
require MFA
review role changes
review sensitive actions
notify user
```

---

# 970 — Backup

Identity DB backup must include:

```text
users
identifiers
credentials
sessions
roles
permissions
security events
```

Secrets/keys may be managed separately and require separate backup/recovery strategy.

---

# 971 — Restore

After restore:

```text
verify credential data
verify role mappings
verify signing key references
verify migration version
review session/token consistency
```

Depending on restore point, consider revoking sessions issued after restored state.

---

# 972 — Disaster Recovery

Identity DR must preserve:

```text
database
signing key access
JWKS
secrets
DNS/routing
rate limiting
monitoring
```

Without signing keys and identity DB, authentication recovery is incomplete.

---

# 973 — Schema Migration

All Identity schema changes use Flyway.

Example:

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

---

# 974 — Backward-Compatible Identity Migration

Be especially careful with:

```text
token claims
role model
credential hash fields
refresh token schema
```

Old and new application pods may coexist during rollout.

---

# 975 — Password Hash Migration

If switching algorithm:

```text
Support verify old
      ↓
On successful login
      ↓
Hash with new
      ↓
Persist new algorithm/version
```

No forced mass plaintext migration is possible or needed.

---

# 976 — JWT Claim Migration

Do not remove or reinterpret claims abruptly.

Example:

```text
roles → permissions
```

may require:

```text
transition period
accept both
new API version / token policy
consumer updates
```

---

# 977 — Role Migration

If roles change:

```text
map old roles
introduce new roles
update authorization
monitor
remove old roles later
```

Avoid suddenly granting broader access.

---

# 978 — Identity Service README

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

# 979 — Identity ADRs

Recommended ADRs:

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

---

# 980 — Identity Security Review Checklist

## Credentials

- [ ] Passwords hashed strongly.
- [ ] No plaintext secrets stored.
- [ ] Hash versioning supported.
- [ ] Password reset secure.

## Tokens

- [ ] JWT signature validated.
- [ ] Issuer/audience defined.
- [ ] Access tokens short-lived.
- [ ] Refresh rotation implemented.
- [ ] Reuse detection implemented.
- [ ] Key rotation supported.

## Sessions

- [ ] Session revocation exists.
- [ ] Revoke-all exists.
- [ ] Device/session visibility defined.
- [ ] Session expiry defined.

## Authorization

- [ ] Roles defined.
- [ ] Permissions defined.
- [ ] High-risk role assignment audited.
- [ ] Default deny.

## Abuse

- [ ] Login rate limiting.
- [ ] Reset rate limiting.
- [ ] Registration rate limiting.
- [ ] Account enumeration considered.

## Operations

- [ ] Metrics.
- [ ] Alerts.
- [ ] Security events.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 981 — Identity Data Review Checklist

- [ ] users table minimal.
- [ ] login identifier normalized.
- [ ] identifier uniqueness enforced.
- [ ] credentials separated.
- [ ] refresh token stored hashed.
- [ ] sessions indexed.
- [ ] security events append-only.
- [ ] outbox exists for domain events.
- [ ] retention defined.
- [ ] sensitive data classification documented.

---

# 982 — Identity Contract Review Checklist

- [ ] Registration contract defined.
- [ ] Login contract defined.
- [ ] Refresh contract defined.
- [ ] Logout contract defined.
- [ ] Session contract defined.
- [ ] Password reset contract defined.
- [ ] Error catalog defined.
- [ ] JWT claims documented.
- [ ] JWKS documented.
- [ ] Events versioned.

---

# 983 — Identity Testing Definition of Done

A feature is complete when:

- [ ] Domain tests pass.
- [ ] Application tests pass.
- [ ] Persistence tests pass.
- [ ] REST contract tests pass.
- [ ] Security tests pass.
- [ ] Concurrency tests pass where required.
- [ ] Rate-limit tests pass.
- [ ] Audit logging verified.
- [ ] No secrets appear in logs.
- [ ] Observability added.

---

# 984 — Identity Production Readiness Checklist

Before production:

- [ ] Signing keys protected.
- [ ] Key rotation tested.
- [ ] JWT validation tested from downstream services.
- [ ] Refresh reuse detection tested.
- [ ] Password reset abuse controls tested.
- [ ] DB backup tested.
- [ ] Restore tested.
- [ ] Rate limits configured.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin MFA configured if applicable.
- [ ] Security scans passed.
- [ ] Load test passed.

---

# 985 — Initial Implementation Order

Recommended:

```text
1. User identity model
2. Login identifier
3. Password credential
4. Registration
5. Login
6. JWT signing
7. Session model
8. Refresh token rotation
9. Logout
10. Password change
11. Password reset
12. Roles
13. Permissions
14. Security events
15. Rate limiting
16. Outbox events
17. Admin operations
18. MFA
```

---

# 986 — Minimum Viable Identity Service

For the first production-capable version:

```text
Registration
Login
Access Token
Refresh Token
Logout
Session revocation
Password reset
Role support
Rate limits
Audit security events
JWT key rotation
```

Do not delay:

```text
refresh reuse detection
password hashing
rate limiting
security logging
```

because these are core security controls.

---

# 987 — Future Enhancements

Potential later features:

```text
Passkeys
TOTP MFA
Enterprise SSO
Social login
Risk-based authentication
Device trust
Adaptive rate limiting
Security anomaly detection
Privileged access workflows
```

Each should be introduced through explicit architecture decisions.

---

# 988 — PART 08 Deliverables

PART 08 produces:

1. Identity Service responsibility definition.
2. Non-responsibility boundary.
3. Identity aggregate.
4. Identity status model.
5. Login-identifier model.
6. Credential model.
7. Password hashing standard.
8. Registration flow.
9. Login flow.
10. Session model.
11. Access-token architecture.
12. JWT signing strategy.
13. JWKS strategy.
14. Signing-key rotation.
15. Refresh-token model.
16. Refresh-token rotation.
17. Reuse detection.
18. Logout/revocation.
19. Password-reset workflow.
20. OTP controls.
21. Role model.
22. Permission model.
23. Admin identity operations.
24. Security-event model.
25. Identity database schema.
26. REST contract list.
27. Internal identity contract guidance.
28. Rate-limit architecture.
29. Redis usage rules.
30. Notification integration.
31. MFA extension architecture.
32. Federated identity guidance.
33. Account closure behavior.
34. Clean Architecture package standard.
35. Input/output ports.
36. Error catalog.
37. Transaction patterns.
38. Concurrency controls.
39. Tests.
40. Load/capacity guidance.
41. Metrics.
42. Alerts.
43. Logs.
44. Runbooks.
45. Backup/restore.
46. DR.
47. Migration guidance.
48. ADR list.
49. Review checklists.
50. Production-readiness checklist.
51. Implementation order.

---

# 989 — Exit Criteria

PART 08 is complete when the team can answer:

### Identity Ownership

```text
What does Identity own and what belongs elsewhere?
```

### Credentials

```text
How are passwords stored and upgraded?
```

### Login

```text
How are successful and failed authentication handled?
```

### Sessions

```text
How can sessions be listed and revoked?
```

### Access Tokens

```text
How are JWTs signed, validated, and rotated?
```

### Refresh Tokens

```text
How are refresh tokens rotated and how is replay detected?
```

### Password Recovery

```text
How is password reset protected from enumeration, brute force, and replay?
```

### Authorization

```text
How are roles and permissions represented?
```

### Security Operations

```text
Which events are audited and which alerts exist?
```

### Data

```text
Which tables hold authoritative identity state?
```

### Resilience

```text
What happens if PostgreSQL, Redis, signing keys, or notification delivery fail?
```

If these answers are clear and tested, Identity is ready for implementation.

---

# 990 — Handoff to PART 09

PART 09 defines Customer Service.

```text
PART 08
Identity
   ↓
Stable user_id
Authentication
Security state
   ↓
PART 09
Customer Service
```

Customer Service will own:

```text
Customer profile
Name
Contact profile
Member mapping
Preferences
Consent
Customer-facing profile data
```

Identity will remain responsible for:

```text
credentials
authentication
tokens
sessions
roles
security state
```

The separation prevents customer-profile changes from destabilizing authentication.

---

# PART 08 — Summary

The Identity Service is the trust foundation of the platform.

Its core lifecycle is:

```text
Register
   ↓
Verify Identity
   ↓
Authenticate
   ↓
Create Session
   ↓
Issue Access Token
   ↓
Rotate Refresh Token
   ↓
Revoke / Logout
```

Recovery lifecycle:

```text
Password Reset Request
      ↓
Rate Limit
      ↓
Challenge
      ↓
Verification
      ↓
Reset Authorization
      ↓
New Credential
      ↓
Session Revocation
```

Authorization lifecycle:

```text
User
  ↓
Role
  ↓
Permissions / Scopes
  ↓
Service Authorization
  ↓
Business Authorization
```

The most important rules are:

```text
Passwords are never stored directly.
Access tokens are short-lived.
Refresh tokens rotate.
Refresh reuse is detected.
Sessions can be revoked.
Roles are controlled.
Security events are auditable.
Signing keys rotate.
Identity data stays separate from unrelated business domains.
```

---

**End of PART 08 — Auth / Identity Service**
