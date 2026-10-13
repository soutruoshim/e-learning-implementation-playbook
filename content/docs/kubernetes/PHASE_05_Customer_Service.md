---
title: "PHASE 05 — Customer Service"
---

# PHASE 05 — Customer Service

> **Purpose:** Implement the platform Customer Service as the second complete business microservice, using the Project Foundation, Shared Engineering Standards, Contract Foundation, and Identity Service established in Phases 01–04.
>
> **Previous Phase:** Phase 04 — Identity Service
>
> **Next Phase:** Phase 06 — Catalog Service
>
> **Primary Architecture Basis:** PART 09 — Customer Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, Redis where appropriate, REST, Kafka, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 5 Goal

Phase 5 builds:

```text
customer-service
```

The Customer Service owns the customer's business/profile identity.

It must answer:

```text
Who is the customer from a business/profile perspective?
What profile information belongs to this customer?
Which platform user_id is linked to the customer?
Which member/member-card identifiers are linked?
What preferences does the customer have?
What consent state exists?
What customer lifecycle state is active?
```

Customer Service owns:

```text
Customer profile
Customer name
Customer-facing contact profile where approved
Customer ID
Member ID mapping
Member card mapping
Customer preferences
Communication preferences
Consent
Saved addresses where included
Profile status
Profile lifecycle
Customer-domain attributes
```

Customer Service does **not** own:

```text
Passwords
Password hashes
JWTs
Access tokens
Refresh tokens
Authentication sessions
Login attempt counters
Order lifecycle
Payment state
Wallet ledger
Points ledger
Coupon redemption
Mission progress
Product catalog
```

Identity owns authentication/security identity.

Customer Service owns profile-oriented business information.

---

# 2. Phase 5 Success State

Phase 5 is complete when the primary customer lifecycle works:

```text
Identity Service
    ↓
UserRegistered
    ↓
Kafka
    ↓
Customer Service
    ↓
Create Customer
    ↓
CustomerCreated
```

Self-service profile flow:

```text
Authenticated Customer
    ↓
GET /api/v1/customers/me
    ↓
PATCH /api/v1/customers/me
    ↓
Validate
    ↓
Apply Domain Rules
    ↓
Save
    ↓
Outbox
    ↓
CustomerProfileUpdated
```

Membership flow:

```text
Customer
    ↓
Get Membership
    ↓
Link Member Card
    ↓
Validate Ownership / Eligibility
    ↓
Persist Mapping
    ↓
MemberCardLinked
```

Preference/consent flow where enabled:

```text
Customer
    ↓
Update Preferences
    ↓
Grant / Revoke Consent
    ↓
Audit History
    ↓
Publish Change Event
```

Lifecycle flow:

```text
ACTIVE
  ↓
INACTIVE / SUSPENDED / CLOSED
  ↓
ANONYMIZED where required
```

The service must also prove:

```text
one customer per linked user_id
member-card uniqueness
consumer idempotency
outbox reliability
optimistic concurrency
PII protection
authorization
auditability
safe cache degradation
safe event replay
```

---

# 3. Important Source-Defined Open Decisions

The architecture intentionally leaves several choices configurable.

Do not hard-code them until approved.

Freeze these decisions before production.

## 3.1 Customer ID Strategy

The architecture keeps:

```text
user_id
```

and:

```text
customer_id
```

as separate concepts.

Initial implementation may choose:

```text
customer_id == user_id
```

for simplicity, but the design must not depend on that permanently.

Decision:

```text
CUSTOMER_ID_STRATEGY = TBD_POLICY
```

Recommended decision record:

```text
Customer ID format:
Customer ID generator:
Can customer_id equal user_id initially:
Can IDs ever be remapped:
Migration strategy:
```

---

# 4. Customer Creation Strategy

Supported architectural choices:

```text
A. Event-driven creation after UserRegistered
B. Lazy creation when profile is first required
```

Recommended source direction:

```text
UserRegistered
    ↓
Customer Service
    ↓
Create Customer
```

Decision:

```text
CUSTOMER_CREATION_MODE = TBD_POLICY
```

For this implementation phase, the recommended execution path is event-driven creation because it preserves the Identity/Customer database boundary.

---

# 5. Contact Data Ownership Policy

Phone/email may have different purposes in Identity and Customer domains.

Example:

```text
Identity phone
  → authentication / recovery

Customer phone
  → contact / delivery / communication
```

Decision:

```text
CUSTOMER_OWNS_PHONE_PROFILE = TBD_POLICY
CUSTOMER_OWNS_EMAIL_PROFILE = TBD_POLICY
CONTACT_SYNC_POLICY = TBD_POLICY
```

If both domains hold a representation, define:

```text
authoritative owner
normalization
verification source
synchronization event
conflict behavior
update direction
```

Never introduce uncontrolled bidirectional synchronization.

---

# 6. Membership Ownership Policy

Freeze:

```text
Who creates member_id?
Who validates member_id?
Who owns membership status?
Is membership native to Customer Service?
Is it migrated from legacy?
Does another system remain authoritative temporarily?
```

Decision:

```text
MEMBERSHIP_SOURCE_OF_TRUTH = TBD_POLICY
```

---

# 7. Member Card Policy

Freeze:

```text
card number format
card normalization
card type values
card status values
link eligibility
unlink eligibility
replacement behavior
one-card vs multi-card rule
whether historical cards remain queryable
```

Decision:

```text
MEMBER_CARD_POLICY = TBD_POLICY
```

Strong requirement:

```text
active card ownership must not conflict between customers
```

---

# 8. Preference Policy

Freeze supported preferences.

Source examples include:

```text
preferred_language
preferred_store_id
order_push_enabled
marketing_push_enabled
marketing_email_enabled
```

Decision:

```text
SUPPORTED_CUSTOMER_PREFERENCES = TBD_POLICY
```

Do not create a generic JSON dumping ground when a preference is a core business field.

---

# 9. Language Policy

Potential values depend on product requirements.

Decision:

```text
SUPPORTED_LANGUAGES = TBD_POLICY
DEFAULT_LANGUAGE = TBD_POLICY
```

Invalid values must map to:

```text
INVALID_LANGUAGE
```

---

# 10. Address Scope Policy

Decide whether saved customer addresses are included in Phase 5.

The architecture permits them but the minimum viable Customer Service can defer them.

Decision:

```text
SAVED_ADDRESSES_ENABLED = TBD_SCOPE
MAX_ACTIVE_ADDRESSES_PER_CUSTOMER = TBD_POLICY
```

Important boundary:

```text
Saved customer address
    !=
Historical order delivery-address snapshot
```

Order Service must preserve its own transaction-time address snapshot.

---

# 11. Consent Scope Policy

Decide initial consent purposes.

Examples may include:

```text
MARKETING_PUSH
MARKETING_EMAIL
MARKETING_SMS
DATA_PROCESSING where required
```

Decision:

```text
CONSENT_PURPOSES = TBD_POLICY
CONSENT_POLICY_VERSION_RULE = TBD_POLICY
CONSENT_RETENTION = TBD_POLICY
```

Consent history should be auditable and should normally be append-oriented.

---

# 12. Identity Disable / Customer Status Relationship

Identity disabling does not automatically mean customer profile deletion.

Freeze:

```text
Does UserDisabled leave customer ACTIVE?
Does it mark customer restricted?
Does it transition to SUSPENDED?
Is there a separate business decision?
```

Decision:

```text
USER_DISABLED_CUSTOMER_REACTION = TBD_POLICY
```

Do not silently couple Identity status to Customer lifecycle.

---

# 13. Account Closure / Anonymization Policy

Freeze:

```text
When Customer becomes CLOSED
When anonymization begins
Minimum retention delay
Fields retained
Fields removed
Who can trigger closure
Who can trigger anonymization
Whether legal hold can block anonymization
```

Decision:

```text
CUSTOMER_CLOSURE_POLICY = TBD_POLICY
ANONYMIZATION_POLICY = TBD_POLICY
```

---

# 14. Cache Policy

Redis may accelerate reads but PostgreSQL remains authoritative.

Freeze:

```text
Which reads are cached?
TTL per key type
Whether negative caching is allowed
Sensitive-data cache policy
Redis outage behavior
```

Decision:

```text
CUSTOMER_CACHE_TTL = TBD_POLICY
PREFERENCE_CACHE_TTL = TBD_POLICY
MEMBERSHIP_CACHE_TTL = TBD_POLICY
```

---

# 15. Admin Search Policy

Freeze:

```text
who can search
searchable fields
minimum query length
exact vs prefix behavior
masking rules
rate limit
audit requirements
full-field reveal permission
```

Decision:

```text
CUSTOMER_SEARCH_POLICY = TBD_SECURITY
```

---

# 16. Phase 5 Boundary

```text
                 Client
                   │
                   ▼
              API Gateway
                   │
                   ▼
           Customer Service
        ┌──────────┼───────────┐
        │          │           │
        ▼          ▼           ▼
     Profile    Membership   Preferences
        │          │           │
        └──────────┼───────────┘
                   ▼
              customer_db
```

Identity relationship:

```text
Identity Service
      │
      │ stable user_id
      ▼
Customer Service
```

Hard rule:

```text
Customer Service must not query identity_db directly.
```

---

# 17. Upstream / Downstream Relationships

Primary upstream facts:

```text
Identity → UserRegistered
Identity → UserDisabled
Identity → UserAccountClosed
```

Possible downstream consumers:

```text
Ordering
Loyalty
Notification
Integration / ACL
Analytics / Search Projection
```

Purpose-specific data only.

Do not expose a single:

```text
GetCustomerEverything
```

contract.

---

# 18. Repository Location

Phase 1 workspace:

```text
brown-platform/
└── services/
    └── customer-service/
```

---

# 19. Standard Service Package

Use the Phase 2 standard:

```text
com.company.customer
```

Replace `company` with the approved organization package.

---

# 20. Customer Service Package Structure

Recommended implementation structure:

```text
customer-service/
│
├── src/main/java/com/company/customer/
│   │
│   ├── domain/
│   │   ├── customer/
│   │   ├── membership/
│   │   ├── address/
│   │   ├── consent/
│   │   ├── preference/
│   │   ├── event/
│   │   ├── policy/
│   │   └── exception/
│   │
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   └── out/
│   │   ├── profile/
│   │   ├── membership/
│   │   ├── address/
│   │   ├── consent/
│   │   ├── preference/
│   │   ├── lifecycle/
│   │   ├── command/
│   │   ├── query/
│   │   └── result/
│   │
│   ├── adapter/
│   │   ├── in/
│   │   │   ├── rest/
│   │   │   └── kafka/
│   │   └── out/
│   │       ├── persistence/
│   │       ├── kafka/
│   │       ├── redis/
│   │       ├── identity/
│   │       ├── catalog/
│   │       └── external/
│   │
│   └── config/
│       ├── security/
│       ├── persistence/
│       ├── kafka/
│       ├── redis/
│       └── observability/
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│
└── src/test/
```

Dependency rule:

```text
Adapter
  ↓
Application
  ↓
Domain
```

Never reverse it.

---

# 21. Initial Technology Dependencies

Typical dependencies:

```text
Spring Boot Web
Spring Validation
Spring Security Resource Server
Spring Data JPA or approved persistence adapter stack
PostgreSQL Driver
Flyway
Spring Kafka
Redis client where enabled
Micrometer
OpenTelemetry integration
Actuator
Jackson
JUnit 5
AssertJ
Mockito where appropriate
Testcontainers PostgreSQL
Testcontainers Kafka where required
ArchUnit
```

Do not add a dependency without an owned use case.

---

# 22. Ubiquitous Language

| Term | Meaning |
|---|---|
| Customer | Business/customer profile linked to a platform identity |
| User ID | Stable identity identifier owned by Identity Service |
| Customer ID | Customer-domain identifier owned by Customer Service |
| Member | Customer participating in membership/loyalty relationship |
| Member ID | Business membership identifier |
| Member Card | Card or card-number reference associated with customer |
| Profile | Customer-owned personal/business information |
| Preference | Customer-selected behavior/display setting |
| Consent | Recorded permission for a defined purpose |
| Saved Address | Customer-managed reusable address |
| Preferred Store | Store reference preferred by customer, if supported |
| Profile Status | Lifecycle state of the customer profile |

---

# 23. Primary Aggregate

Primary aggregate root:

```text
Customer
```

Possible core state:

```text
customer_id
user_id
status
display_name
first_name
last_name
preferred_language
preferred_store_id
created_at
updated_at
closed_at
anonymized_at
version
```

Membership, consent, and addresses may be separate aggregates or consistency boundaries where appropriate.

---

# 24. Customer ID

Rules:

```text
immutable after creation
owned by Customer Service
safe for internal reference
must not expose infrastructure sequence assumptions
```

---

# 25. User ID Link

Rules:

```text
owned by Identity Service
stored logically by Customer Service
unique for active customer relationship
stable after creation unless an explicit merge/migration process exists
```

Do not use a cross-database foreign key.

---

# 26. Customer Status

Recommended source-defined statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
CLOSED
ANONYMIZED
```

Meaning:

```text
ACTIVE
→ normal customer profile

INACTIVE
→ temporarily inactive

SUSPENDED
→ restricted by business policy

CLOSED
→ profile closed

ANONYMIZED
→ personal data removed where required
```

---

# 27. Customer State Transitions

Source model:

```text
ACTIVE
   ├──> INACTIVE
   ├──> SUSPENDED
   └──> CLOSED

INACTIVE
   └──> ACTIVE

SUSPENDED
   ├──> ACTIVE
   └──> CLOSED

CLOSED
   └──> ANONYMIZED
```

Exact authorization and reasons remain policy-controlled.

---

# 28. Core Customer Invariants

Enforce:

```text
customer_id is immutable
linked user_id is stable unless explicit migration/merge exists
one active customer profile per user_id
member-card mapping cannot conflict with another active owner
consent changes are auditable
closed profile cannot be modified normally
anonymized profile cannot silently restore removed PII
```

---

# 29. Profile Fields

Possible profile fields:

```text
first_name
last_name
display_name
date_of_birth
gender only if legitimately required
preferred_language
preferred_store_id
profile_image_key if supported
```

Rule:

```text
collect only what has a business purpose
```

Do not collect fields "just in case."

---

# 30. Customer Name Model

Support business requirements without assuming every culture uses the same name structure.

Recommended:

```text
first_name
last_name
display_name
```

`display_name` is the primary customer-facing representation where practical.

---

# 31. Contact Profile

Where Customer Service owns customer-facing contacts, model:

```text
PHONE
EMAIL
```

Potential fields:

```text
type
value
normalized_value
is_primary
verification_status
```

Authentication/recovery contact ownership remains an Identity concern unless an explicit ownership decision says otherwise.

---

# 32. Contact Verification

If the Customer Service permits adding contact methods, verification should be delegated to:

```text
Identity Service
```

or an approved verification service.

Do not create a second weaker verification mechanism.

---

# 33. Preferred Language

Model as an explicit field/value object.

Validate against:

```text
SUPPORTED_LANGUAGES
```

Do not accept arbitrary language strings if the product only supports a known set.

---

# 34. Preferred Store

If enabled:

```text
preferred_store_id
```

is a logical external reference.

Validation may use:

```text
Catalog/Store contract
```

or:

```text
event-driven local projection
```

Do not create a cross-service database foreign key.

---

# 35. Saved Address Model

Possible fields:

```text
address_id
customer_id
label
recipient_name
phone
line1
line2
province
district
commune
postal_code
latitude
longitude
delivery_instructions
is_default
created_at
updated_at
deleted_at
version
```

Treat latitude/longitude and full address as sensitive customer data.

---

# 36. Default Address Rule

A customer normally has at most:

```text
1 active default address
```

Protect using both:

```text
transaction logic
+
database constraint where supported
```

PostgreSQL concept:

```sql
UNIQUE(customer_id)
WHERE is_default = true
  AND deleted_at IS NULL
```

Implementation may use an equivalent partial unique index.

---

# 37. Membership Model

Possible fields:

```text
membership_id
customer_id
member_id
status
joined_at
ended_at
```

`member_id` must be unique according to the approved membership ownership policy.

---

# 38. Member Card Model

Possible fields:

```text
member_card_id
customer_id
membership_id
card_number
card_type
status
linked_at
unlinked_at
replaced_by_card_id
```

Strong database protection is required for active card ownership.

Do not rely only on:

```text
SELECT then INSERT
```

for uniqueness.

---

# 39. Member Card Replacement

Replacement must preserve enough history to explain:

```text
old card
new card
replacement time
reason if required
customer
membership
```

Do not destroy previous mapping history if support/reconciliation requires it.

---

# 40. Customer Preferences

Initial structure may include:

```text
customer_id
preferred_language
preferred_store_id
order_push_enabled
marketing_push_enabled
marketing_email_enabled
updated_at
version
```

Use explicit fields for core product preferences.

---

# 41. Consent Model

Possible append-oriented consent record:

```text
id
customer_id
purpose
policy_version
status
source
recorded_at
revoked_at
request_id
```

Statuses may include:

```text
GRANTED
REVOKED
```

Do not simply overwrite historical consent state.

---

# 42. Consent Source

Source examples:

```text
MOBILE_APP
WEB
ADMIN
IMPORT
STORE
```

Admin/import sources may require stronger audit rules.

---

# 43. Communication Preference vs Consent

Keep the concepts separate.

Example:

```text
Consent:
customer permits marketing push

Preference:
customer currently disables marketing push
```

Effective send rule:

```text
Consent granted?
    ↓ yes
Preference enabled?
    ↓ yes
Channel available?
    ↓ yes
Send
```

Any `no` means:

```text
do not send
```

---

# 44. Customer Creation Domain Flow

Recommended:

```text
Receive UserRegistered
    ↓
Check processed event
    ↓
Check customer by user_id
    ├── exists → no-op
    └── missing
          ↓
       Create Customer
          ↓
       Create default preferences if policy requires
          ↓
       Save CustomerCreated to outbox
          ↓
       Mark event processed
          ↓
       Commit
```

The processed-event marker and business effect should be transactionally safe.

---

# 45. UserRegistered Consumer

Consumer requirements:

```text
idempotent
version-aware
schema-validated
trace/correlation aware
safe to replay
```

Duplicate event result:

```text
no duplicate customer
no duplicate CustomerCreated side effect
```

---

# 46. UserDisabled Consumer

Possible reaction:

```text
keep profile unchanged
```

or:

```text
apply approved restriction state
```

Do not automatically delete/anonymize the Customer profile.

---

# 47. UserAccountClosed Consumer

Possible flow:

```text
UserAccountClosed
    ↓
Check processed event
    ↓
Close customer if policy permits
    ↓
Start/queue anonymization workflow where required
    ↓
Preserve required membership references
    ↓
Outbox event
```

Retention policy remains authoritative.

---

# 48. Profile Retrieval

Public endpoint:

```text
GET /api/v1/customers/me
```

The authenticated principal supplies `user_id`.

The client must not provide arbitrary `user_id`.

Example response shape:

```json
{
  "data": {
    "customer_id": "CUS001",
    "user_id": "USR001",
    "display_name": "Sokleaksa",
    "preferred_language": "km",
    "status": "ACTIVE"
  }
}
```

Do not expose internal audit/security fields.

---

# 49. Profile Update

Endpoint:

```text
PATCH /api/v1/customers/me
```

Example request:

```json
{
  "display_name": "Sokleaksa",
  "preferred_language": "km"
}
```

Rules:

```text
missing field = unchanged
null semantics = explicit
authorization = own profile
closed customer cannot update normally
optimistic locking protects lost updates
```

---

# 50. Profile Update Flow

```text
Authenticated caller
    ↓
Resolve user_id
    ↓
Resolve customer
    ↓
Validate transport fields
    ↓
Validate customer status
    ↓
Apply domain rules
    ↓
Persist
    ↓
Save outbox CustomerProfileUpdated
    ↓
Commit
    ↓
Invalidate/update cache
```

---

# 51. Preferences APIs

Core contracts:

```text
GET   /api/v1/customers/me/preferences
PATCH /api/v1/customers/me/preferences
```

Identity comes from the authenticated token.

---

# 52. Consent APIs

Where enabled:

```text
GET    /api/v1/customers/me/consents
POST   /api/v1/customers/me/consents
DELETE /api/v1/customers/me/consents/{purpose}
```

Grant/revoke actions require:

```text
purpose validation
policy version
source
audit metadata
outbox event
```

---

# 53. Address APIs

Where enabled:

```text
GET    /api/v1/customers/me/addresses
POST   /api/v1/customers/me/addresses
PATCH  /api/v1/customers/me/addresses/{id}
DELETE /api/v1/customers/me/addresses/{id}
```

Every address mutation must enforce:

```text
address.customer_id == authenticated customer_id
```

---

# 54. Membership APIs

Where applicable:

```text
GET  /api/v1/customers/me/membership
POST /api/v1/customers/me/member-cards/link
POST /api/v1/customers/me/member-cards/unlink
```

Link/unlink must be strongly constrained and audited.

---

# 55. Admin Customer Retrieval

Possible endpoint:

```text
GET /api/v1/admin/customers/{customerId}
```

Required authorization may include:

```text
customer.read
```

Sensitive fields require separate permission where applicable.

---

# 56. Admin Customer Search

Search may support approved fields such as:

```text
customer_id
member_id
card_number
phone
email
name
```

Controls:

```text
RBAC
audit
rate limiting
minimum query length
masking
pagination
bounded result size
```

---

# 57. Search Result Minimization

Search results should return only summary data.

Example:

```text
customer_id
display_name
masked phone
masked member card
status
```

Full data requires a separately authorized fetch.

---

# 58. Purpose-Specific Internal Contracts

Examples:

```text
Order Service
→ customer basic profile snapshot

Notification Service
→ communication preference projection

Loyalty Service
→ customer/member mapping
```

Do not create one large cross-domain DTO.

---

# 59. Ordering Customer Snapshot

Purpose-specific example:

```json
{
  "customer_id": "CUS001",
  "display_name": "Sokleaksa",
  "phone": "+855...",
  "member_id": "MEM001"
}
```

Only include fields Ordering actually requires.

Ordering must persist its own historical transaction snapshot.

---

# 60. Loyalty Mapping Contract

Loyalty may need:

```text
customer_id
member_id
card_number
status
```

It should not automatically receive:

```text
full address
marketing consent
profile image
date of birth
```

---

# 61. Notification Preference Integration

Prefer events/projections where practical.

Candidate event:

```text
CustomerCommunicationPreferencesChanged
```

This avoids calling Customer Service synchronously for every notification.

---

# 62. Events Published

Candidate source-defined events:

```text
CustomerCreated
CustomerProfileUpdated
CustomerStatusChanged
MemberLinked
MemberCardLinked
MemberCardUnlinked
CustomerPreferenceChanged
CustomerConsentGranted
CustomerConsentRevoked
CustomerClosed
CustomerAnonymized
```

Only publish an event when another domain has a legitimate need for the business fact.

---

# 63. CustomerCreated Event

Minimum data:

```text
event_id
event_type
event_version
occurred_at
producer
customer_id
user_id
```

Avoid unnecessary PII.

---

# 64. CustomerProfileUpdated Event

Do not publish the entire profile by default.

Prefer:

```json
{
  "customer_id": "CUS001",
  "changed_fields": [
    "preferred_language"
  ]
}
```

or a purpose-specific event.

---

# 65. Consent Events

Example payload meaning:

```text
customer_id
purpose
policy_version
status/change
```

Do not add unrelated profile data.

---

# 66. Events Consumed

Possible initial set:

```text
UserRegistered
UserDisabled
UserAccountClosed
StoreRemoved if preferred-store cleanup is required
```

Keep event dependencies minimal.

---

# 67. Event Versioning

Every event contract must follow Phase 03 rules.

Minimum concepts:

```text
event_id
event_type
event_version
occurred_at
producer
correlation_id where applicable
causation_id where applicable
data
```

Consumers must explicitly handle supported versions.

---

# 68. Consumer Idempotency

Use:

```text
processed_events
```

with at least:

```text
event_id
consumer_name
processed_at
```

Uniqueness must prevent duplicate business effects.

---

# 69. Command Idempotency

Candidate operations needing explicit idempotency:

```text
customer creation from event
member-card link
external consent import
account closure
```

Possible keys:

```text
event_id
idempotency_key
unique business reference
```

depending on the contract.

---

# 70. Transactional Outbox

Externally meaningful changes must use:

```text
outbox_events
```

Business state and outbox event are written in the same PostgreSQL transaction.

Kafka availability must not decide whether the customer DB transaction is correct.

---

# 71. Customer Creation Transaction

```text
BEGIN

Check user_id uniqueness
Check processed event
Insert customer
Insert default preferences if policy requires
Insert outbox CustomerCreated
Record processed event

COMMIT
```

On uniqueness race:

```text
resolve safely as existing/idempotent result
```

not as duplicate customer creation.

---

# 72. Profile Update Transaction

```text
BEGIN

Load customer
Validate status
Validate expected version
Apply changes
Update customer
Insert history if relevant
Insert outbox event

COMMIT
```

After commit:

```text
invalidate/update cache
```

---

# 73. Consent Grant Transaction

```text
BEGIN

Load customer
Validate state
Validate consent purpose
Validate policy version
Insert consent history record
Insert outbox event
Insert audit if required

COMMIT
```

Do not rewrite old consent history when append-only mode is used.

---

# 74. Member Card Link Transaction

```text
BEGIN

Validate customer
Validate customer status
Validate membership
Validate card eligibility
Enforce active card uniqueness
Link card
Insert history/audit
Insert outbox event

COMMIT
```

The database must remain the final uniqueness guard.

---

# 75. Optimistic Locking

Use:

```text
version
```

for mutable customer/profile aggregates.

Purpose:

```text
prevent lost update
detect concurrent modification
```

Map a version conflict to a stable application error.

---

# 76. Default Address Concurrency

Two simultaneous "set default" requests must not create two default addresses.

Use:

```text
transaction
partial unique constraint
correct update ordering
```

Test this concurrently.

---

# 77. Member Card Concurrency

Two customers attempting to link the same active card must result in:

```text
one success
one deterministic conflict
```

not two active owners.

---

# 78. Customer Database

Logical database:

```text
customer_db
```

Only Customer Service owns writes to this database.

Other services must use:

```text
REST
gRPC if later approved
Kafka events
purpose-specific projections
```

not direct SQL.

---

# 79. Database Tables

Initial possible tables:

```text
customers
customer_contacts
customer_addresses
customer_preferences
customer_consents
memberships
member_cards
customer_status_history
processed_events
outbox_events
```

Optional/future:

```text
customer_tags
external_customer_mappings
profile_images
```

Only create optional tables when their feature enters scope.

---

# 80. Customers Table

Recommended conceptual columns:

```text
id
user_id
status
display_name
first_name
last_name
preferred_language
preferred_store_id
created_at
updated_at
closed_at
anonymized_at
version
```

Constraints:

```text
PRIMARY KEY(id)
UNIQUE(user_id)
status domain/check
version NOT NULL
timestamps NOT NULL where appropriate
```

Exact SQL types follow Phase 07 data standards.

---

# 81. Customer Contacts Table

Only if Customer Service owns contact-profile data.

Concept:

```text
id
customer_id
type
value
normalized_value
is_primary
verification_status
created_at
updated_at
```

Indexes should follow approved access patterns.

---

# 82. Customer Addresses Table

Concept:

```text
id
customer_id
label
recipient_name
phone
line1
line2
province
district
commune
postal_code
latitude
longitude
delivery_instructions
is_default
created_at
updated_at
deleted_at
version
```

Do not confuse this table with Order Service address snapshots.

---

# 83. Customer Preferences Table

Concept:

```text
customer_id
preferred_language
preferred_store_id
order_push_enabled
marketing_push_enabled
marketing_email_enabled
updated_at
version
```

Core preference fields should be explicit.

---

# 84. Customer Consents Table

Concept:

```text
id
customer_id
purpose
policy_version
status
source
recorded_at
revoked_at
request_id
```

Design for historical auditability.

---

# 85. Memberships Table

Concept:

```text
id
customer_id
member_id
status
joined_at
ended_at
```

Constraint:

```text
UNIQUE(member_id)
```

subject to final business ownership rules.

---

# 86. Member Cards Table

Concept:

```text
id
customer_id
membership_id
card_number
card_type
status
linked_at
unlinked_at
replaced_by_card_id
```

Enforce unique active ownership.

---

# 87. Customer Status History Table

Concept:

```text
id
customer_id
old_status
new_status
reason
changed_by
changed_at
correlation_id
```

Use when lifecycle changes need traceability.

---

# 88. Processed Events Table

Minimum:

```text
event_id
consumer_name
processed_at
event_type
```

Recommended unique key:

```text
(event_id, consumer_name)
```

---

# 89. Outbox Events Table

Use the shared outbox standard from Phase 02 / event architecture.

Typical concepts:

```text
event_id
aggregate_type
aggregate_id
event_type
event_version
payload
occurred_at
published_at
status
retry metadata where approved
```

---

# 90. Flyway Baseline Sequence

Source example:

```text
V1__create_customers.sql
V2__create_customer_addresses.sql
V3__create_customer_preferences.sql
V4__create_customer_consents.sql
V5__create_memberships.sql
V6__create_member_cards.sql
V7__create_status_history.sql
V8__create_processed_events.sql
V9__create_outbox.sql
```

Implementation may insert:

```text
customer_contacts
indexes
constraints
```

into separately versioned migrations if those capabilities are approved.

Never rewrite an applied production migration.

---

# 91. Backward-Compatible Schema Change

Example:

```text
Add preferred_language nullable
    ↓
Deploy application supporting null
    ↓
Backfill known/default values
    ↓
Verify
    ↓
Enforce NOT NULL if required
```

Use expand/migrate/contract style for production changes.

---

# 92. Contact Migration

If contact ownership moves from Identity/legacy to Customer:

```text
Define source of truth
    ↓
Backfill
    ↓
Validate
    ↓
Temporary dual-read if required
    ↓
Switch writes
    ↓
Reconcile
    ↓
Remove old ownership
```

Avoid permanent dual-write.

---

# 93. Membership Migration

Legacy membership migration must reconcile:

```text
customer mapping
member ID uniqueness
card ownership
card status
historical replacements
```

Do not cut over until reconciliation is acceptable.

---

# 94. Input Ports

Recommended:

```text
GetMyProfileUseCase
UpdateMyProfileUseCase

GetPreferencesUseCase
UpdatePreferencesUseCase

ListAddressesUseCase
CreateAddressUseCase
UpdateAddressUseCase
DeleteAddressUseCase
SetDefaultAddressUseCase

GetMembershipUseCase
LinkMemberCardUseCase
UnlinkMemberCardUseCase

GrantConsentUseCase
RevokeConsentUseCase

SearchCustomersUseCase
GetAdminCustomerUseCase

ChangeCustomerStatusUseCase
CloseCustomerUseCase
AnonymizeCustomerUseCase
```

Only implement ports for in-scope features.

---

# 95. Output Ports

Recommended:

```text
LoadCustomerPort
SaveCustomerPort
CustomerQueryPort
AddressPort
MembershipPort
ConsentPort
PreferencePort
OutboxPort
ProcessedEventPort
StoreReferencePort
ClockPort
AuditPort
CachePort
```

Where external validation exists:

```text
AddressValidationPort
MembershipValidationPort
```

Provider-specific DTOs remain in adapters.

---

# 96. Customer Search Query Port

Admin/support search should use a read/query model.

Do not load the full Customer aggregate for every search row.

Concept:

```java
public interface CustomerSearchQueryPort {

    Page<CustomerSearchRow> search(
        CustomerSearchCriteria criteria,
        PageRequest page
    );
}
```

---

# 97. Validation Layers

Transport validation:

```text
required/optional shape
length
format
allowed language
pagination bounds
request size
```

Domain validation:

```text
status transition
closed customer update prohibition
card ownership
consent transition
default address
business uniqueness
```

Do not place all business rules in controllers.

---

# 98. Error Catalog

Initial source-defined errors:

```text
CUSTOMER_NOT_FOUND
CUSTOMER_INACTIVE
CUSTOMER_CLOSED
PROFILE_UPDATE_NOT_ALLOWED
INVALID_LANGUAGE
ADDRESS_NOT_FOUND
ADDRESS_LIMIT_REACHED
MEMBER_NOT_FOUND
MEMBER_CARD_ALREADY_LINKED
MEMBER_CARD_NOT_ELIGIBLE
CONSENT_PURPOSE_INVALID
CONSENT_ALREADY_REVOKED
ACCESS_DENIED
```

Implementation additions may include stable errors for:

```text
CUSTOMER_VERSION_CONFLICT
INVALID_CUSTOMER_STATUS_TRANSITION
MEMBER_CARD_NOT_FOUND
PREFERENCE_INVALID
```

These additions must be added to the Phase 03 error catalog before public use.

---

# 99. HTTP Error Mapping

Source examples:

| Error | HTTP |
|---|---:|
| CUSTOMER_NOT_FOUND | 404 |
| CUSTOMER_CLOSED | 409 |
| PROFILE_UPDATE_NOT_ALLOWED | 409 |
| ADDRESS_NOT_FOUND | 404 |
| MEMBER_CARD_ALREADY_LINKED | 409 |
| CONSENT_PURPOSE_INVALID | 400 |
| ACCESS_DENIED | 403 |

Other mappings must follow Phase 03 contract standards.

---

# 100. Self-Service Authorization

For:

```text
/customers/me/**
```

derive:

```text
user_id
```

from authenticated identity.

Never accept a self-service body/path parameter that lets the customer choose another `user_id`.

---

# 101. Admin Permissions

Separate permissions:

```text
customer.read
customer.search
customer.update
membership.manage
consent.audit
```

Potential additional permission for unmasked PII:

```text
customer.pii.read
```

Only add if approved by security policy.

---

# 102. Resource Ownership

For every nested resource:

```text
address.customer_id
membership.customer_id
preference.customer_id
consent.customer_id
```

must match the authorized customer unless the caller uses an approved admin permission.

Do not depend on the UI to enforce ownership.

---

# 103. PII Classification

Likely sensitive/confidential fields include:

```text
name
phone
email
address
date of birth
member card
location
```

Exact classification inherits the security architecture.

---

# 104. Data Minimization

Every response/event/internal contract must include only what the consumer needs.

Example:

```text
Order may need:
customer_id
display_name
phone snapshot
```

It does not automatically need:

```text
birth date
marketing consent
all saved addresses
profile image
```

---

# 105. Field Masking

Admin/support search examples:

```text
phone → 0******789
email → s***@example.com
card → ****1234
```

Full-value access requires explicit authorization where supported.

---

# 106. Audit Requirements

Audit sensitive actions such as:

```text
admin profile update
member card link
member card unlink
consent grant
consent revoke
customer closure
anonymization
sensitive support/admin profile access where required
```

Audit record should capture:

```text
actor
target customer
action
reason/purpose where required
timestamp
request_id
correlation_id
```

---

# 107. Logging Restrictions

Safe structured fields may include:

```text
customer_id
user_id where appropriate
operation
result
request_id
correlation_id
```

Do not log by default:

```text
full address
full phone
full email
full member card
birth date
raw consent evidence beyond required metadata
```

---

# 108. Privacy Data Export

If supported:

```text
Customer requests export
    ↓
Strong authentication
    ↓
Collect Customer-owned data
    ↓
Coordinate other domain exports
    ↓
Generate/export result
```

Customer Service cannot pretend to own:

```text
Order
Wallet
Loyalty
Payment
```

records.

---

# 109. Privacy Deletion / Anonymization

Each domain retains responsibility for its data.

Example:

```text
Customer profile
→ anonymize/remove PII

Order history
→ retain required transaction records

Wallet
→ retain financial ledger as required

Loyalty
→ apply domain retention/closure rules
```

---

# 110. Customer Anonymization

Source example transformations:

```text
display_name → "Deleted Customer"
phone → null/remove
email → null/remove
saved addresses → delete
profile image → delete
```

Keep:

```text
customer_id
```

or an irreversible surrogate where historical references require it.

Anonymization must be tested for both:

```text
data removal
historical referential safety
```

---

# 111. CustomerAnonymized Event

Publish a minimal event such as:

```text
CustomerAnonymized
```

Consumers must not blindly delete legally required domain records.

---

# 112. Profile Image — Optional

If profile image enters scope:

```text
object storage
```

stores the binary.

Customer DB stores metadata such as:

```text
object_key
mime_type
checksum
updated_at
```

Do not store large image blobs in PostgreSQL by default.

---

# 113. Profile Image Security — Optional

Validate:

```text
MIME type
size
extension
image decoding
authorization
malware where required
```

Generate storage keys server-side.

Do not update the active profile image reference until storage succeeds, unless a safe staged workflow is used.

---

# 114. Redis Cache Use

Redis may cache:

```text
customer summary
preference summary
membership mapping
```

PostgreSQL remains the authoritative source.

---

# 115. Cache Keys

Examples:

```text
customer:by-user:{user_id}
customer:summary:{customer_id}
customer:preferences:{customer_id}
customer:membership:{customer_id}
```

Key versioning/prefixing should follow the Redis standard.

---

# 116. Cache Invalidation

After successful DB commit:

```text
invalidate/update affected cache
```

Customer update must not fail simply because cache invalidation is temporarily unavailable.

Use bounded recovery/retry behavior where required.

---

# 117. Redis Failure Behavior

Normal read behavior:

```text
Redis unavailable
    ↓
fall back to PostgreSQL
```

Write behavior:

```text
DB correctness first
cache is secondary
```

Redis must not become the source of truth for customer profile state.

---

# 118. Customer Search Index

If search volume eventually requires a search engine:

```text
Customer Service
    ↓ event/projection
Search Index
```

The search index is not authoritative.

It must receive deletion/anonymization propagation.

---

# 119. Search Privacy

Search/index data must use:

```text
field minimization
access control
encryption
retention
deletion propagation
audit where required
```

Avoid unrestricted wildcard search over PII.

Prefer:

```text
normalized exact search
bounded prefix search
approved indexed search
```

---

# 120. Customer Merge — Not Initial Scope

Customer merge is complex.

It must define:

```text
surviving customer_id
source customer_id
member mapping
address merge
consent merge
downstream references
audit
rollback
```

Do not implement casually.

Default Phase 5 decision:

```text
Customer merge = OUT OF INITIAL SCOPE
```

unless explicitly approved.

---

# 121. Duplicate Detection

Potential signals:

```text
same verified phone
same verified email
same member card
manual support review
```

Do not auto-merge based only on name similarity.

---

# 122. CRM Integration

If enabled:

```text
Customer Service
    ↓
Integration / ACL
    ↓
CRM
```

Do not leak external CRM field names into the Customer domain.

---

# 123. CRM Synchronization

Define ownership per field.

Example:

```text
display_name
→ Customer Service authoritative

CRM segment
→ CRM authoritative
```

Synchronization direction must be explicit.

CRM failure should normally not reject core profile updates.

---

# 124. External Customer Mapping

Where required:

```text
external_customer_mappings
```

Concept:

```text
provider
external_customer_id
customer_id
created_at
```

Unique:

```text
(provider, external_customer_id)
```

---

# 125. Read Consistency

Own profile:

```text
read-after-write / strong consistency preferred
```

Notification preference projection:

```text
eventual consistency acceptable
```

Admin analytics/reporting:

```text
eventual/reporting model acceptable
```

---

# 126. Service Availability Boundary

Avoid making Customer Service a hard dependency for every order status transition.

Ordering may use its previously captured customer snapshot.

This prevents a distributed monolith.

---

# 127. Hard Dependencies

Keep synchronous dependencies limited.

Potential:

```text
authenticated claims
store validation if required
membership validation if external
```

Each must have:

```text
timeout
failure behavior
retry policy if safe
observability
```

---

# 128. Soft Dependencies

Examples:

```text
Notification
Analytics
CRM sync
Search indexing
```

These should normally not block a profile update.

---

# 129. PostgreSQL Failure

If authoritative PostgreSQL is unavailable:

```text
writes fail safely
reads may fail unless an explicitly safe cache policy allows otherwise
```

Do not accept profile updates only into Redis.

---

# 130. Kafka Failure

With outbox:

```text
profile update commits
    ↓
outbox remains pending
    ↓
publisher retries later
```

Kafka outage must not cause lost customer state.

---

# 131. CRM Failure

Use:

```text
event
retry
DLQ where applicable
reconciliation
```

Do not hold the Customer DB transaction open around CRM network calls.

---

# 132. Object Storage Failure

If profile image is supported:

```text
image upload failure
```

must not corrupt existing profile metadata.

Do not activate the new object reference until safe storage success.

---

# 133. Customer Metrics

Business/domain metrics:

```text
customer_created_total
profile_update_total
profile_update_failure_total
address_created_total
member_card_link_total
member_card_link_failure_total
consent_granted_total
consent_revoked_total
customer_anonymized_total
```

Technical metrics:

```text
request latency
request errors
DB pool
cache hit rate
cache failures
Kafka consumer lag
outbox backlog
outbox publication age
```

---

# 134. Customer SLIs

Potential:

```text
profile read availability
profile update success rate
P95 profile read latency
P95 profile update latency
event publication lag
UserRegistered processing success
```

Exact SLO targets belong to the observability/SLO policy.

---

# 135. Alerts

Alert on meaningful symptoms such as:

```text
high 5xx rate
DB connection exhaustion
outbox backlog
oldest outbox event age
customer creation failures
member-card conflict spike
consumer lag
anonymization failures
PII/security event
```

Avoid noisy alerts without an owner/action.

---

# 136. Dashboard

Customer dashboard should include:

```text
request rate
latency
errors
customer creation
profile updates
membership operations
consent operations
DB health
Redis/cache health
consumer lag
outbox lag
```

---

# 137. Tracing

Propagate:

```text
trace_id
span_id
request_id
correlation_id
```

Across:

```text
API Gateway → Customer Service
Identity event → Customer consumer
Customer outbox → Kafka consumer
Customer → approved synchronous dependency
```

Do not put PII into span attributes.

---

# 138. Runbooks

Required runbooks:

```text
Customer DB unavailable
Outbox backlog
UserRegistered consumer failing
Member card duplicate/conflict spike
Redis failure
CRM sync backlog
Anonymization job failure
PII exposure incident
```

Each runbook should include:

```text
symptoms
dashboards
queries/commands
safe mitigation
escalation
verification
recovery
```

---

# 139. Backup

Customer DB backup scope includes:

```text
profiles
addresses
preferences
consents
membership mappings
status/history
processed events
outbox state where required
```

Sensitive backups must follow encryption/access policy.

---

# 140. Restore Verification

After restore verify:

```text
Flyway/schema version
customer/user mapping
unique user_id
member-card uniqueness
consent history
status history
outbox state
processed-event state
```

---

# 141. Restore and Kafka Replay

If restored behind Kafka position:

```text
consumer idempotency
```

must prevent:

```text
duplicate customer creation
duplicate card link
duplicate closure
duplicate consent import
```

---

# 142. Data Retention

Do not use one retention period for every table.

Define separately for:

```text
active profile
closed profile
addresses
consent history
membership history
status history
audit
outbox
processed events
external mappings
```

All production values are:

```text
TBD_POLICY
```

until formally approved.

---

# 143. Address Retention

Deleted saved addresses may have shorter retention.

Historical order addresses belong to Order Service and follow Order retention.

---

# 144. Consent Retention

Consent evidence may need to outlive current preference state.

Preserve enough history to prove:

```text
when granted
what purpose
what policy version
source
when revoked
```

---

# 145. Membership Retention

Membership mapping history may be retained for:

```text
support
loyalty reconciliation
fraud investigation
card replacement history
```

according to approved policy.

---

# 146. Test Strategy

Required categories:

```text
Domain
Application
REST
Persistence
Kafka
Privacy
Authorization
Concurrency
Migration
Integration
Performance
```

---

# 147. Domain Tests

Test at minimum:

```text
closed customer cannot update
valid status transitions
invalid status transitions
anonymized customer restrictions
consent transition rules
member-card link rules
address/default behavior
```

---

# 148. Profile Application Tests

Test:

```text
get own profile
update own profile
missing customer
invalid language
closed profile update
optimistic conflict
outbox creation
cache invalidation
```

---

# 149. Address Tests

If enabled:

```text
create
update
delete
set default
ownership
two concurrent defaults
address limit
soft delete behavior
```

---

# 150. Membership Tests

Test:

```text
get membership
link valid card
duplicate card
concurrent link
blocked/ineligible card
unlink
replacement
outbox event
```

---

# 151. Consent Tests

If enabled:

```text
grant
revoke
duplicate grant handling
duplicate revoke handling
policy version
source
audit
outbox event
effective consent/preference behavior
```

---

# 152. Authorization Tests

Test:

```text
customer reads own profile
customer updates own profile
customer cannot read arbitrary other profile
customer cannot mutate another customer's address
support search permission
support result masking
admin update permission
membership.manage permission
consent.audit permission
```

---

# 153. Privacy Tests

Verify:

```text
PII not logged
PII not added to traces
search results masked
events contain minimal PII
anonymization removes required fields
cache invalidation removes stale sensitive state
search projection receives anonymization/deletion if used
```

---

# 154. Kafka Tests

Test:

```text
UserRegistered creates one customer
duplicate UserRegistered ignored
concurrent duplicate event safe
CustomerCreated emitted once
UserAccountClosed idempotent
unsupported schema/version handled safely
outbox retry publishes later
```

---

# 155. Persistence Integration Tests

Use PostgreSQL Testcontainers.

Test:

```text
unique user_id
member_id uniqueness
member-card active uniqueness
default-address partial uniqueness
optimistic locking
transaction rollback
Flyway migration
processed-event uniqueness
outbox persistence
```

---

# 156. Redis Tests

Where cache enabled:

```text
cache hit
cache miss
DB fallback
invalidation after update
Redis unavailable
stale cache bounded by policy
no write correctness dependency on Redis
```

---

# 157. Contract Tests

Validate:

```text
OpenAPI
request/response fields
error catalog
authorization requirements
pagination
masking
event schemas
event compatibility
```

---

# 158. Load / Performance Tests

Scenarios:

```text
profile read
profile update
customer search
member-card lookup
address listing
UserRegistered burst
```

Search/admin queries may require separate capacity testing.

---

# 159. Search Indexes

Potential PostgreSQL indexes based on real access patterns:

```text
user_id
member_id
card_number
normalized phone
normalized email
status
created_at
```

Do not add every possible index by default.

---

# 160. Customer ADRs

Create and approve:

```text
ADR-CUS-001 Customer ID strategy
ADR-CUS-002 Contact data ownership
ADR-CUS-003 Membership ownership
ADR-CUS-004 Consent history model
ADR-CUS-005 Address ownership
ADR-CUS-006 Customer creation from UserRegistered
ADR-CUS-007 Anonymization strategy
ADR-CUS-008 CRM synchronization ownership
```

Additional implementation ADRs may include:

```text
ADR-CUS-009 Cache scope/TTL
ADR-CUS-010 Search architecture
```

if those decisions become significant.

---

# 161. Customer Service README

Document:

```text
Purpose
Ownership
Non-responsibilities
Boundary from Identity
Domain model
Profile model
Membership model
Consent model
Address model if enabled
REST API
Events
Database
PII classification
Authorization
Caching
Testing
Monitoring
Runbooks
Retention
Anonymization
Local startup
```

---

# 162. Data Review Checklist

- [ ] Customer ID and User ID are clearly separated.
- [ ] Source of truth is defined for every profile field.
- [ ] PII classification is approved.
- [ ] Unique customer per user is enforced.
- [ ] Member ID ownership is defined.
- [ ] Active member-card uniqueness is enforced.
- [ ] Consent history is auditable.
- [ ] Saved address ownership is clear.
- [ ] Historical order address snapshots are not coupled to Customer DB.
- [ ] Retention is defined.
- [ ] Anonymization is defined.
- [ ] Cross-service DB access is absent.

---

# 163. Contract Review Checklist

- [ ] `/me` endpoints derive user identity from token.
- [ ] No arbitrary self-service `user_id`.
- [ ] Admin APIs are separately authorized.
- [ ] PII is minimized.
- [ ] Search output is masked.
- [ ] Internal contracts are purpose-specific.
- [ ] Events are versioned.
- [ ] Event payloads avoid unnecessary PII.
- [ ] Errors are stable and catalogued.
- [ ] Pagination is bounded.

---

# 164. Security Review Checklist

- [ ] RBAC is defined.
- [ ] Resource ownership is enforced server-side.
- [ ] Sensitive search is audited.
- [ ] PII is excluded from normal logs.
- [ ] PII is excluded from traces.
- [ ] Consent actions are audited.
- [ ] Member-card operations are protected.
- [ ] Export/deletion operations use stronger authentication if policy requires.
- [ ] Backups are encrypted.
- [ ] Non-production customer data is masked/synthetic according to policy.
- [ ] Redis does not become authoritative.
- [ ] Direct `identity_db` access is impossible.

---

# 165. Testing Definition of Done

A Customer feature is complete only when:

- [ ] Domain tests pass.
- [ ] Application tests pass.
- [ ] Persistence tests pass.
- [ ] REST/contract tests pass.
- [ ] Authorization tests pass.
- [ ] Privacy tests pass where relevant.
- [ ] Concurrency tests pass.
- [ ] Event/idempotency tests pass.
- [ ] Metrics/logging/tracing are present.
- [ ] Documentation is updated.
- [ ] Migration is tested where DB changed.

---

# 166. Production Readiness Checklist

Before production:

- [ ] DB migrations tested.
- [ ] Rollback/forward compatibility reviewed.
- [ ] PII classification approved.
- [ ] Access permissions reviewed.
- [ ] Search masking verified.
- [ ] Consent history verified if enabled.
- [ ] Member-card uniqueness tested.
- [ ] Customer creation event replay tested.
- [ ] Outbox recovery tested.
- [ ] Redis failure tested if enabled.
- [ ] Backup/restore tested.
- [ ] Anonymization tested.
- [ ] Alerts configured.
- [ ] Dashboards available.
- [ ] Runbooks available.
- [ ] Load tests passed for critical paths.
- [ ] All `TBD_POLICY` / `TBD_SECURITY` decisions required by initial scope are frozen.

---

# 167. Recommended Implementation Sequence

```text
Step 1
Bootstrap customer-service

Step 2
Create customer_db + Flyway baseline

Step 3
Implement Customer aggregate + status/invariants

Step 4
Implement persistence adapters and optimistic locking

Step 5
Implement UserRegistered Kafka consumer + processed_events

Step 6
Implement CustomerCreated transactional outbox

Step 7
Implement GET /customers/me

Step 8
Implement PATCH /customers/me

Step 9
Implement preferences

Step 10
Implement saved addresses if in initial scope

Step 11
Implement membership mapping

Step 12
Implement member-card link/unlink

Step 13
Implement consent if in initial scope

Step 14
Implement admin/support retrieval and search

Step 15
Implement status history + lifecycle administration

Step 16
Implement closure/anonymization workflow

Step 17
Implement Redis cache where justified

Step 18
Implement CRM / external mapping only if initial scope requires it

Step 19
Complete domain/application/persistence/contract/Kafka/security/privacy tests

Step 20
Complete observability, alerts, dashboards, runbooks

Step 21
Docker/local acceptance test

Step 22
Phase completion review and handoff to Phase 06
```

---

# 168. Step 1 — Bootstrap Acceptance

Before business logic:

```text
service starts
Actuator health works
customer_db connection works
Flyway starts
security resource-server config loads
test profile works
PostgreSQL Testcontainer works
ArchUnit rules run
Docker image builds
```

---

# 169. Step 2 — Database Acceptance

Verify:

```text
customer_db exists
service DB user owns only approved customer schema/database
core tables migrate
constraints exist
unique user_id enforced
Flyway migration test passes
no identity_db access required
```

---

# 170. Step 3 — Customer Aggregate Acceptance

Verify:

```text
Customer created with valid state
customer_id immutable
user_id stable
valid transitions work
invalid transitions fail
closed profile update rejected
anonymized profile cannot restore PII through normal update
```

---

# 171. Step 4 — UserRegistered Acceptance

Verify:

```text
valid UserRegistered creates Customer
duplicate event creates no duplicate
processed event stored
CustomerCreated outbox saved
transaction is atomic
consumer correlation/trace metadata available
```

---

# 172. Step 5 — Profile Read Acceptance

Verify:

```text
GET /customers/me works
identity comes from token
customer resolved by user_id
other user_id cannot be supplied
only approved fields returned
closed/anonymized response behavior follows policy
```

---

# 173. Step 6 — Profile Update Acceptance

Verify:

```text
PATCH /customers/me works
missing fields unchanged
null behavior explicit
invalid language rejected
closed profile rejected
optimistic conflict detected
outbox event saved
cache invalidated after commit
PII absent from logs
```

---

# 174. Step 7 — Preferences Acceptance

Verify:

```text
GET preferences works
PATCH preferences works
unsupported preference rejected
language validated
preference version/concurrency safe
CustomerPreferenceChanged emitted when required
```

---

# 175. Step 8 — Address Acceptance

If enabled:

```text
create address
list addresses
update own address
delete own address
cannot access another customer address
only one default
concurrent default requests safe
address limit enforced
```

---

# 176. Step 9 — Membership Acceptance

Verify:

```text
membership lookup works
member_id mapping is unique
membership status validated
purpose-specific Loyalty contract available where required
```

---

# 177. Step 10 — Member Card Acceptance

Verify:

```text
valid card link succeeds
duplicate active owner rejected
concurrent link has one winner
unlink works
replacement preserves history
audit written
outbox event written
```

---

# 178. Step 11 — Consent Acceptance

If enabled:

```text
grant works
revoke works
purpose validated
policy version stored
source stored
history preserved
audit exists
events emitted
effective preference/consent logic tested
```

---

# 179. Step 12 — Admin Search Acceptance

Verify:

```text
unauthorized caller denied
authorized support can search
queries are bounded
results masked
full values require stronger permission where supported
search access auditable
PII not logged
```

---

# 180. Step 13 — Lifecycle Acceptance

Verify:

```text
approved status transitions work
history stored
invalid transitions rejected
closure emits event
anonymization follows policy
anonymization event minimal
```

---

# 181. Step 14 — Cache Acceptance

If Redis enabled:

```text
cache populates
cache invalidates
DB fallback works
Redis outage does not block write correctness
sensitive stale data does not persist indefinitely
```

---

# 182. Step 15 — Failure Acceptance

Exercise:

```text
Kafka unavailable
Redis unavailable
CRM unavailable if enabled
object storage unavailable if image enabled
duplicate Kafka event
DB constraint conflict
optimistic lock conflict
```

All failures must produce safe, observable behavior.

---

# 183. Step 16 — Observability Acceptance

Verify:

```text
metrics exported
traces propagated
structured logs available
PII redaction verified
outbox backlog visible
consumer lag visible
dashboard usable
alerts route to an owner
```

---

# 184. Step 17 — Backup / Restore Acceptance

Verify:

```text
backup created by platform process
restore tested
schema valid
user/customer links valid
card uniqueness valid
consent history valid
processed-events valid
outbox recovery understood
Kafka replay does not duplicate business state
```

---

# 185. Recommended Phase 5 Work Breakdown

Use implementation tickets such as:

```text
CUS-001 Bootstrap customer-service
CUS-002 Create customer_db and Flyway baseline
CUS-003 Implement Customer aggregate
CUS-004 Implement CustomerStatus transitions/invariants
CUS-005 Implement Customer persistence adapter
CUS-006 Implement UserRegistered consumer
CUS-007 Implement processed-event idempotency
CUS-008 Implement Customer transactional outbox
CUS-009 Implement GET /customers/me
CUS-010 Implement PATCH /customers/me
CUS-011 Implement customer preferences
CUS-012 Implement saved address aggregate/API
CUS-013 Implement default-address concurrency control
CUS-014 Implement membership mapping
CUS-015 Implement member-card link
CUS-016 Implement member-card unlink/replacement
CUS-017 Implement consent history/API
CUS-018 Implement admin customer retrieval
CUS-019 Implement admin/support search
CUS-020 Implement masking/audit controls
CUS-021 Implement customer lifecycle/status history
CUS-022 Implement customer closure
CUS-023 Implement anonymization
CUS-024 Implement Customer events/contracts
CUS-025 Implement Redis cache adapter
CUS-026 Implement CRM/ACL mapping if in scope
CUS-027 Implement domain/application tests
CUS-028 Implement PostgreSQL integration tests
CUS-029 Implement Kafka/idempotency tests
CUS-030 Implement authorization/privacy tests
CUS-031 Implement concurrency tests
CUS-032 Implement contract tests
CUS-033 Implement observability
CUS-034 Implement alerts/dashboard
CUS-035 Write runbooks
CUS-036 Backup/restore/replay test
CUS-037 Load/performance test
CUS-038 Docker/local full-flow acceptance
CUS-039 Complete ADRs/policy freeze
CUS-040 Phase 5 exit review
```

Split tickets further if they become too large for review.

---

# 186. Minimum Viable Customer Service

First production-capable version from the source architecture:

```text
Customer creation
Profile read
Profile update
Language preference
Membership mapping
Member-card mapping if required
PII protection
Authorization
Audit for sensitive operations
Outbox
Consumer idempotency
```

Addresses and consent may be added when product scope requires them.

---

# 187. Recommended Initial Scope for This Roadmap

Because later phases depend on Customer Service, the recommended implementation target is:

```text
Required now:
- Customer creation from UserRegistered
- Customer aggregate/status
- GET /customers/me
- PATCH /customers/me
- preferred_language
- membership mapping
- member-card mapping if current business needs it
- outbox
- processed-event idempotency
- authorization
- PII protection
- observability/tests

Conditional now:
- saved addresses
- consent
- preferred store
- profile image
- CRM sync
```

Do not delay Phase 06 purely to implement optional Customer enhancements that are not required by current business scope.

---

# 188. Out of Initial Scope Unless Approved

```text
Customer merge
Household/group relationships
Advanced segmentation
Customer tags
Complex CRM master-data synchronization
Advanced profile verification
Self-service privacy export portal
Multi-step data-deletion orchestration
Profile image
Search-engine deployment
```

The architecture may support these later without redefining core ownership.

---

# 189. Phase 5 Policy Freeze Checklist

Before production, resolve every required item:

- [ ] Customer ID strategy.
- [ ] Event-driven vs lazy customer creation.
- [ ] Initial Customer status.
- [ ] Contact phone ownership.
- [ ] Contact email ownership.
- [ ] Contact synchronization policy.
- [ ] Supported profile fields.
- [ ] Supported languages.
- [ ] Default language.
- [ ] Preferred-store scope.
- [ ] Saved-address scope.
- [ ] Maximum saved addresses.
- [ ] Membership source of truth.
- [ ] Member ID rules.
- [ ] Member-card format.
- [ ] Member-card status/type rules.
- [ ] Card link/unlink/replacement rules.
- [ ] Preference fields.
- [ ] Consent scope.
- [ ] Consent purposes.
- [ ] Consent policy-version rule.
- [ ] Identity-disable reaction.
- [ ] Account-closure rule.
- [ ] Anonymization rule.
- [ ] Retention by table/data class.
- [ ] PII classification.
- [ ] Search permissions.
- [ ] Search masking.
- [ ] Search rate limits.
- [ ] Full-PII reveal rule if supported.
- [ ] Cache scope.
- [ ] Cache TTLs.
- [ ] CRM scope.
- [ ] Admin permissions.
- [ ] Audit scope.
- [ ] SLO targets.
- [ ] Alert thresholds.

Until required decisions are approved:

```text
Phase 5 may proceed in local/DEV implementation,
but production behavior is not fully frozen.
```

---

# 190. Phase 5 Completion Tree

```text
PHASE 05 — CUSTOMER SERVICE

├── Service Foundation                         ✅
│   ├── Spring Boot service
│   ├── Health
│   ├── Docker
│   └── Architecture rules
│
├── Domain                                     ✅
│   ├── Customer
│   ├── CustomerStatus
│   ├── Profile
│   ├── Preferences
│   ├── Membership
│   ├── Member Card
│   ├── Address if enabled
│   └── Consent if enabled
│
├── Identity Boundary                          ✅
│   ├── stable user_id reference
│   ├── no identity_db access
│   └── UserRegistered consumption
│
├── Persistence                                ✅
│   ├── customer_db
│   ├── Flyway
│   ├── constraints
│   ├── optimistic locking
│   ├── processed_events
│   └── outbox_events
│
├── REST Contracts                             ✅
│   ├── GET /customers/me
│   ├── PATCH /customers/me
│   ├── preferences
│   ├── membership/card
│   ├── addresses if enabled
│   ├── consent if enabled
│   └── admin/search if in scope
│
├── Event Contracts                            ✅
│   ├── CustomerCreated
│   ├── CustomerProfileUpdated
│   ├── preference/membership events
│   └── lifecycle events
│
├── Security / Privacy                         ✅
│   ├── own-resource authorization
│   ├── RBAC
│   ├── PII minimization
│   ├── masking
│   ├── audit
│   └── anonymization policy
│
├── Reliability                                ✅
│   ├── idempotency
│   ├── outbox
│   ├── concurrency
│   ├── cache fallback
│   └── replay safety
│
├── Testing                                    ✅
├── Observability                              ✅
├── Backup / Restore Awareness                 ✅
├── Runbooks                                   ✅
└── Documentation / ADRs                       ✅
```

---

# 191. Exit Criteria

Phase 5 is complete when the team can answer and prove:

## Ownership

```text
Which profile data is authoritative in Customer Service?
Which data remains authoritative in Identity?
```

## Identity Link

```text
How does customer_id relate to user_id?
How is one-customer-per-user enforced?
```

## Profile

```text
Which fields can the customer update?
Which fields require admin/system authority?
```

## Membership

```text
Who owns member_id?
Who owns member-card mapping?
How is active-card uniqueness protected?
```

## Consent

```text
If consent is in scope, how is every grant/revoke historically auditable?
```

## Addresses

```text
If addresses are in scope, how are saved addresses separated from order snapshots?
```

## Privacy

```text
How is PII classified?
How is it masked?
How is it kept out of logs/traces/events?
How is it anonymized?
How is retention enforced?
```

## Contracts

```text
What does Ordering receive?
What does Loyalty receive?
What does Notification receive?
Why does each field exist?
```

## Events

```text
Which Customer events are published?
Which Identity events are consumed?
Are consumers idempotent?
```

## Reliability

```text
What happens if PostgreSQL is unavailable?
What happens if Kafka is unavailable?
What happens if Redis is unavailable?
What happens if CRM/object storage is unavailable?
```

## Operations

```text
Can operators detect:
customer creation failures
outbox backlog
consumer lag
member-card conflicts
PII incidents
anonymization failures
```

If these answers are implemented, tested, observable, and documented, Phase 5 is ready to close.

---

# 192. Handoff to Phase 6

After Customer Service is complete, move to:

```text
PHASE 06 — Catalog Service
```

The critical boundary becomes:

```text
Customer Service
    owns:
        customer profile
        membership mapping
        preferences
        consent
        saved customer addresses where enabled

Catalog Service
    owns:
        products
        categories
        menu items
        modifiers
        sub-modifiers
        prices
        store menu configuration
        catalog publication/versioning
```

Customer Service may reference:

```text
store_id
```

through contracts/projections where required.

It must not read:

```text
catalog_db
```

directly.

---

# 193. Final Phase 5 Principle

The most important separation is:

```text
Identity Service
    = Who can prove they are the user?

Customer Service
    = Who is that user as a customer/member?
```

And the most important implementation rules are:

```text
one authoritative owner for customer data
no direct cross-service DB reads
minimal PII
strong member-card uniqueness
auditable consent
transactional outbox
idempotent consumers
safe concurrency
purpose-specific contracts
historical order snapshots remain in Ordering
cache is never authoritative
```

---

**End of PHASE 05 — Customer Service**
