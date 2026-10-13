---
title: "PART 09 — CUSTOMER SERVICE"
---

# PART 09 — CUSTOMER SERVICE

> **Document Role:** Defines the architecture, domain model, persistence model, contracts, privacy controls, lifecycle rules, and operational standards for the Customer Service.  
> **Previous Part:** PART 08 — Auth / Identity Service  
> **Next Part:** PART 10 — Catalog Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, REST, Kafka  
> **Audience:** Backend engineers, software architects, QA engineers, product engineers, privacy/security engineers, DevOps engineers, SREs, technical leads.

---

# 991 — Purpose

The Customer Service owns customer-facing profile and membership identity information.

It answers:

```text
Who is the customer from a business/profile perspective?
What profile information is associated with the authenticated identity?
What member/customer identifiers are linked?
What preferences and consents exist?
What profile state is active?
```

The Customer Service does **not** own:

```text
Passwords
JWTs
Refresh tokens
Authentication sessions
Orders
Wallet balance
Points balance
Payments
Mission progress
Product catalog
```

Identity owns authentication.

Customer Service owns profile-oriented business information.

---

# 992 — Customer Service Responsibilities

Customer Service owns:

```text
Customer profile
Customer name
Contact profile
Member ID
Member card mapping
Customer preferences
Communication preferences
Consent
Profile status
Profile lifecycle
Customer attributes owned by the customer domain
```

Possible future responsibilities:

```text
Customer segmentation attributes
Profile verification
Household/group relationship
Customer tags
CRM synchronization
Preferred store
Language preference
```

---

# 993 — Non-Responsibilities

Customer Service should not own:

```text
Password hash
Login attempt counters
Refresh tokens
Access tokens
Order state
Payment state
Wallet ledger
Points ledger
Coupon redemption
Mission completion
```

Do not duplicate those domains into customer tables.

---

# 994 — Customer Boundary

High-level architecture:

```text
              Client
                │
                ▼
           API Gateway
                │
                ▼
        Customer Service
      ┌─────────┼─────────┐
      │         │         │
      ▼         ▼         ▼
   Profile   Membership Preferences
      │         │         │
      └─────────┼─────────┘
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

Customer Service references `user_id` logically.

It does not read Identity database directly.

---

# 995 — Ubiquitous Language

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
| Consent | Recorded permission for a defined processing/communication purpose |
| Preferred Store | Store the customer prefers, if supported |
| Profile Status | Lifecycle state of the customer profile |

---

# 996 — Customer Aggregate

Possible aggregate root:

```text
Customer
```

Possible state:

```text
customer_id
user_id
status
display_name
first_name
last_name
phone profile reference
email profile reference
language
preferred_store_id
created_at
updated_at
version
```

Membership and consent may be separate aggregates depending on consistency needs.

---

# 997 — Customer ID vs User ID

Keep the concepts separate.

```text
user_id
```

belongs to Identity.

```text
customer_id
```

belongs to Customer Service.

Relationship:

```text
User Identity
    1
    │
    │ logical link
    ▼
Customer Profile
```

Initial implementation may choose:

```text
customer_id == user_id
```

for simplicity, but the architecture should not assume this forever.

---

# 998 — Customer Status

Recommended statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
CLOSED
ANONYMIZED
```

Meaning:

```text
ACTIVE      → normal customer profile
INACTIVE    → temporarily inactive
SUSPENDED   → restricted by business policy
CLOSED      → profile closed
ANONYMIZED  → personal data removed where required
```

---

# 999 — Customer State Transitions

Example:

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

Exact transitions depend on business/privacy rules.

---

# 1000 — Customer Invariants

Examples:

```text
customer_id is immutable
linked user_id is stable after creation unless merge/migration is explicitly supported
one active customer profile per user_id
member card mapping must not conflict with another active owner
consent changes must be auditable
closed profile cannot be modified normally
anonymized profile cannot restore removed PII without a new process
```

---

# 1001 — Customer Creation

Customer profile may be created:

```text
immediately after UserRegistered
```

or lazily:

```text
when profile is first needed
```

Recommended event-driven option:

```text
UserRegistered
      ↓
Customer Service
      ↓
Create Customer
```

This avoids Identity directly writing customer tables.

---

# 1002 — Customer Creation Event Flow

```text
Identity Service
   ↓ UserRegistered
Kafka
   ↓
Customer Service
   ↓
Check processed_event
   ↓
Create Customer
   ↓
CustomerCreated
```

Consumer must be idempotent.

---

# 1003 — Customer Profile Fields

Possible fields:

```text
first_name
last_name
display_name
date_of_birth
gender if legitimately required
preferred_language
preferred_store_id
profile_image_key
```

Only collect fields required by business purpose.

Do not collect data "just in case."

---

# 1004 — Contact Data

Customer Service may own customer-facing contact profile:

```text
phone
email
address
```

But login identifier ownership remains with Identity if used for authentication.

A field may appear in both domains only if purpose differs and synchronization is explicit.

Avoid uncontrolled duplication.

---

# 1005 — Contact Ownership Decision

Example:

```text
Identity phone
  purpose:
    authentication / recovery

Customer phone
  purpose:
    contact profile / delivery / communication
```

If both exist:

```text
source-of-truth rules must be explicit
```

Better where possible:

```text
Customer profile references verified identity contact
```

rather than duplicating without control.

---

# 1006 — Customer Name

Name model should support business requirements.

Possible:

```text
first_name
last_name
display_name
```

Avoid assumptions that every culture uses the same name structure.

`display_name` may be the safest customer-facing representation.

---

# 1007 — Language Preference

Possible values:

```text
en
km
```

or BCP 47 tags:

```text
en-US
km-KH
```

Language preference may affect:

```text
notifications
UI content
mission text
marketing communication
```

---

# 1008 — Preferred Store

If supported:

```text
preferred_store_id
```

is a logical reference to Catalog/Store domain.

Do not create a cross-service foreign key.

---

# 1009 — Customer Address

If customer addresses are owned here, model separately:

```text
customer_addresses
```

Possible types:

```text
HOME
WORK
OTHER
```

Address may include:

```text
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
instructions
```

Collect only what ordering/delivery requires.

---

# 1010 — Address Ownership

Customer saved address:

```text
Customer Service
```

Order delivery-address snapshot:

```text
Order Service
```

At order creation:

```text
Customer address
      ↓ snapshot
Order address
```

Later profile address changes must not rewrite historical orders.

---

# 1011 — Membership Domain

Customer Service may own mapping between:

```text
customer
member ID
member card
```

while Loyalty owns:

```text
points
tier
earn/redeem
```

This keeps membership identity separate from loyalty accounting.

---

# 1012 — Member ID

Properties:

```text
stable
unique within organization
owned by Customer Service
```

Possible fields:

```text
member_id
customer_id
status
created_at
```

---

# 1013 — Member Card

Member card mapping may include:

```text
card_number
customer_id
status
linked_at
unlinked_at
card_type
```

Do not place points balance in this table.

---

# 1014 — Member Card Status

Possible:

```text
ACTIVE
BLOCKED
REPLACED
UNLINKED
```

A replaced card may keep history.

---

# 1015 — Card Linking

Flow:

```text
Authenticated Customer
      ↓
Submit card number / verification
      ↓
Validate card eligibility
      ↓
Ensure not linked elsewhere
      ↓
Link card
      ↓
Audit
      ↓
Publish MemberCardLinked
```

---

# 1016 — Card Linking Concurrency

Two users may try to link the same card concurrently.

Protect using:

```text
unique constraint
transaction
business validation
```

Final database constraint must prevent double ownership.

---

# 1017 — Card Unlinking

Rules should define:

```text
whether unlink is allowed
whether points remain
whether replacement is required
whether historical orders remain linked
```

Customer Service owns link state.

Loyalty owns points/account state.

---

# 1018 — Preferences

Possible preferences:

```text
preferred_language
preferred_store
marketing_notifications
order_notifications
theme
communication channels
```

Separate business-critical preference from UI-only preference where necessary.

---

# 1019 — Preference Storage

Possible table:

```text
customer_preferences
```

or explicit columns for core preferences.

Avoid uncontrolled key-value tables for everything.

Use key-value only for low-risk extensible preferences.

---

# 1020 — Consent

Consent is not the same as preference.

Consent must capture:

```text
purpose
status
version
source
granted_at
revoked_at
```

Example purposes:

```text
MARKETING_EMAIL
MARKETING_PUSH
PERSONALIZATION
DATA_PROCESSING_OPTIONAL
```

---

# 1021 — Consent Record

Possible structure:

```text
customer_consents
-----------------
id
customer_id
purpose
policy_version
status
source
granted_at
revoked_at
created_at
```

---

# 1022 — Consent Immutability

Consider append-only consent history.

Instead of overwriting:

```text
MARKETING = true → false
```

record:

```text
GRANTED
then
REVOKED
```

This improves auditability.

---

# 1023 — Consent Version

Store:

```text
policy_version
```

so the system can prove what terms/purpose were accepted.

---

# 1024 — Consent Source

Examples:

```text
MOBILE_APP
WEB
ADMIN
IMPORT
STORE
```

Admin-added consent may require stricter rules.

---

# 1025 — Communication Preference vs Consent

Example:

```text
Consent:
Customer legally/business-wise allows marketing push.

Preference:
Customer prefers marketing push disabled.
```

Effective behavior should respect both.

---

# 1026 — Effective Communication Rule

Example:

```text
Send Marketing Push?

Consent granted?
   ↓ yes
Preference enabled?
   ↓ yes
Channel available?
   ↓ yes
Send
```

Any `no`:

```text
do not send
```

---

# 1027 — Profile Update

Endpoint:

```text
PATCH /api/v1/customers/me
```

Request:

```json
{
  "display_name": "Sokleaksa",
  "preferred_language": "km"
}
```

Rules:

```text
missing field = unchanged
null semantics explicit
authorization = own profile
```

---

# 1028 — Profile Update Flow

```text
Authenticated user
      ↓
Resolve customer by user_id
      ↓
Validate fields
      ↓
Apply domain rules
      ↓
Save
      ↓
Publish CustomerProfileUpdated
```

---

# 1029 — Customer Retrieval

Endpoint:

```text
GET /api/v1/customers/me
```

Example response:

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

Do not expose internal audit/security fields unnecessarily.

---

# 1030 — Admin Customer Retrieval

Possible:

```text
GET /api/v1/admin/customers/{customerId}
```

Authorization:

```text
SUPPORT
CUSTOMER_ADMIN
SYSTEM_ADMIN
```

Sensitive fields may require additional permission.

---

# 1031 — Customer Search

Admin/support search may support:

```text
customer_id
member_id
card_number
phone
email
name
```

Search access is sensitive because it exposes PII.

Controls:

```text
RBAC
audit
rate limiting
minimum query length
masking
```

---

# 1032 — Search Result Minimization

Search result should return only necessary summary fields.

Example:

```text
customer_id
display_name
masked phone
masked member card
status
```

Full details require separate authorized fetch.

---

# 1033 — Customer Service REST Contracts

Core endpoints:

```text
GET   /api/v1/customers/me
PATCH /api/v1/customers/me

GET   /api/v1/customers/me/preferences
PATCH /api/v1/customers/me/preferences

GET   /api/v1/customers/me/consents
POST  /api/v1/customers/me/consents
DELETE /api/v1/customers/me/consents/{purpose}

GET   /api/v1/customers/me/addresses
POST  /api/v1/customers/me/addresses
PATCH /api/v1/customers/me/addresses/{id}
DELETE /api/v1/customers/me/addresses/{id}
```

Membership endpoints where applicable:

```text
GET  /api/v1/customers/me/membership
POST /api/v1/customers/me/member-cards/link
POST /api/v1/customers/me/member-cards/unlink
```

---

# 1034 — Internal Contracts

Other services may need limited customer data.

Examples:

```text
Order Service → customer basic profile snapshot
Notification Service → communication preference
Loyalty Service → customer/member mapping
```

Prefer purpose-specific contracts.

Do not expose one giant `GetCustomerEverything`.

---

# 1035 — Customer Snapshot Contract

For ordering:

```json
{
  "customer_id": "CUS001",
  "display_name": "Sokleaksa",
  "phone": "+855...",
  "member_id": "MEM001"
}
```

Only include what Order Service actually needs.

---

# 1036 — Notification Preference Contract

Notification Service may consume events/projections rather than call Customer Service for every send.

Possible event:

```text
CustomerCommunicationPreferencesChanged
```

This reduces runtime coupling.

---

# 1037 — Loyalty Mapping Contract

Loyalty may need:

```text
customer_id
member_id
card_number
status
```

It should not need:

```text
full address
marketing consent
profile image
```

---

# 1038 — Customer Events Published

Candidate events:

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

---

# 1039 — CustomerCreated Event

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "CUSTOMER_CREATED",
  "event_version": 1,
  "occurred_at": "...",
  "producer": "customer-service",
  "data": {
    "customer_id": "CUS001",
    "user_id": "USR001"
  }
}
```

Avoid unnecessary PII.

---

# 1040 — Profile Updated Event

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

# 1041 — Consent Event

Example:

```json
{
  "event_type": "CUSTOMER_CONSENT_REVOKED",
  "data": {
    "customer_id": "CUS001",
    "purpose": "MARKETING_PUSH",
    "policy_version": "2026-01"
  }
}
```

---

# 1042 — Events Consumed

Possible:

```text
UserRegistered
UserDisabled
UserAccountClosed
StoreRemoved if preferred-store cleanup needed
```

Keep event dependencies minimal.

---

# 1043 — UserRegistered Consumer

Flow:

```text
UserRegistered
      ↓
Check processed_event
      ↓
Customer already exists?
  ├── yes → no-op
  └── no
       ↓
     Create customer
       ↓
     CustomerCreated
```

---

# 1044 — UserDisabled Reaction

Identity disabling does not necessarily delete customer profile.

Customer Service may:

```text
keep profile
mark restricted if business requires
```

Exact relationship should be defined.

Do not silently overwrite customer lifecycle based solely on identity state unless agreed.

---

# 1045 — Account Closure Reaction

On:

```text
UserAccountClosed
```

Customer Service may:

```text
close profile
begin anonymization workflow
retain required membership references
```

subject to retention rules.

---

# 1046 — Customer Database Overview

Possible tables:

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

Optional:

```text
customer_tags
external_customer_mappings
profile_images
```

---

# 1047 — Customers Table

Example:

```text
customers
---------
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

Unique:

```text
user_id
```

---

# 1048 — Customer Contacts Table

Example:

```text
customer_contacts
-----------------
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

Possible types:

```text
PHONE
EMAIL
```

Only if Customer Service truly owns this profile contact.

---

# 1049 — Customer Addresses Table

Example:

```text
customer_addresses
------------------
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

---

# 1050 — Default Address Constraint

A customer should normally have at most one active default address.

Possible strategies:

```text
application transaction
partial unique index
```

Example concept:

```sql
UNIQUE(customer_id)
WHERE is_default = true
  AND deleted_at IS NULL
```

---

# 1051 — Customer Preferences Table

Example:

```text
customer_preferences
--------------------
customer_id
preferred_language
preferred_store_id
order_push_enabled
marketing_push_enabled
marketing_email_enabled
updated_at
version
```

Use explicit fields for core preferences.

---

# 1052 — Customer Consents Table

Example:

```text
customer_consents
-----------------
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

Consider append-only records.

---

# 1053 — Membership Table

Example:

```text
memberships
-----------
id
customer_id
member_id
status
joined_at
ended_at
```

Unique:

```text
member_id
```

---

# 1054 — Member Cards Table

Example:

```text
member_cards
------------
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

Unique active card ownership must be enforced.

---

# 1055 — Status History

Example:

```text
customer_status_history
-----------------------
id
customer_id
old_status
new_status
reason
changed_by
changed_at
correlation_id
```

---

# 1056 — Processed Events

Use:

```text
processed_events
```

for:

```text
UserRegistered
UserAccountClosed
```

consumer idempotency.

---

# 1057 — Customer Outbox

Customer changes that matter externally should be saved to:

```text
outbox_events
```

in the same transaction.

---

# 1058 — Customer Creation Transaction

```text
BEGIN

Check user_id uniqueness
Insert customer
Insert default preferences if policy requires
Insert outbox CustomerCreated

COMMIT
```

---

# 1059 — Profile Update Transaction

```text
BEGIN

Load customer
Validate status
Apply changes
Update customer
Insert status/history if relevant
Insert outbox event

COMMIT
```

---

# 1060 — Consent Grant Transaction

```text
BEGIN

Validate purpose
Insert consent record
Insert outbox event

COMMIT
```

If using append-only consent, do not update previous history.

---

# 1061 — Member Card Link Transaction

```text
BEGIN

Validate customer
Validate membership
Check card uniqueness
Link card
Insert audit/history
Insert outbox event

COMMIT
```

---

# 1062 — Concurrency: Profile Update

Use optimistic locking:

```text
version
```

to avoid lost updates.

Example:

```text
mobile updates language
admin updates name
```

without locking, one update may overwrite the other.

---

# 1063 — Concurrency: Default Address

Two requests setting different addresses as default may race.

Use:

```text
transaction
partial unique constraint
update ordering
```

to guarantee only one default.

---

# 1064 — Concurrency: Card Linking

Use:

```text
unique(card_number where active)
```

or equivalent strong constraint.

Do not rely only on:

```text
SELECT before INSERT
```

---

# 1065 — Idempotency

Candidate operations:

```text
create customer from event
link member card
grant consent via external import
account closure
```

Use:

```text
event_id
idempotency_key
unique business reference
```

depending on source.

---

# 1066 — Customer Service Clean Architecture

Recommended package:

```text
customer-service/
│
├── domain/
│   ├── customer/
│   ├── membership/
│   ├── address/
│   ├── consent/
│   ├── preference/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── profile/
│   ├── membership/
│   ├── address/
│   ├── consent/
│   ├── preference/
│   └── lifecycle/
│
├── adapter/in/
│   ├── rest/
│   └── kafka/
│
├── adapter/out/
│   ├── persistence/
│   ├── identity/
│   ├── catalog/
│   └── kafka/
│
└── config/
```

---

# 1067 — Input Ports

Examples:

```text
GetMyProfileUseCase
UpdateMyProfileUseCase
ListAddressesUseCase
CreateAddressUseCase
UpdateAddressUseCase
DeleteAddressUseCase
SetDefaultAddressUseCase
GetPreferencesUseCase
UpdatePreferencesUseCase
GrantConsentUseCase
RevokeConsentUseCase
GetMembershipUseCase
LinkMemberCardUseCase
UnlinkMemberCardUseCase
CloseCustomerUseCase
```

---

# 1068 — Output Ports

Examples:

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
```

---

# 1069 — Customer Query Port

For admin/support:

```java
public interface CustomerSearchQueryPort {

    Page<CustomerSearchRow> search(
        CustomerSearchCriteria criteria,
        PageRequest page
    );
}
```

Do not load full aggregates for every search result.

---

# 1070 — Address Validation Port

If external geocoding/address validation is used:

```java
public interface AddressValidationPort {
    AddressValidationResult validate(Address address);
}
```

External provider details belong in adapter.

---

# 1071 — Profile Validation

Transport validation:

```text
field format
length
allowed language
```

Domain validation:

```text
closed customer cannot update profile
member card ownership rules
consent transition rules
```

---

# 1072 — Customer Error Catalog

Possible:

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

---

# 1073 — HTTP Error Mapping

Example:

| Error | HTTP |
|---|---:|
| CUSTOMER_NOT_FOUND | 404 |
| CUSTOMER_CLOSED | 409 |
| PROFILE_UPDATE_NOT_ALLOWED | 409 |
| ADDRESS_NOT_FOUND | 404 |
| MEMBER_CARD_ALREADY_LINKED | 409 |
| CONSENT_PURPOSE_INVALID | 400 |
| ACCESS_DENIED | 403 |

---

# 1074 — Customer Authorization

Customer endpoint:

```text
/me
```

derives `user_id` from authenticated identity.

Do not allow client to submit arbitrary:

```text
user_id
```

for own-profile operations.

---

# 1075 — Admin Authorization

Admin/customer-support APIs require:

```text
customer.read
customer.search
customer.update
membership.manage
consent.audit
```

Separate permissions.

---

# 1076 — Resource Ownership

For address operations:

```text
address.customer_id
```

must match authenticated customer's profile.

Do not rely on hidden UI.

---

# 1077 — PII Classification

Likely confidential/restricted customer fields:

```text
name
phone
email
address
date of birth
member card
location
```

Exact classification follows PART 06 policy.

---

# 1078 — Data Minimization

Only expose required fields.

Example:

Order Service may need:

```text
customer_id
display_name
phone snapshot
```

It does not automatically need:

```text
birth date
marketing consent
all addresses
```

---

# 1079 — Field Masking

Admin search may show:

```text
phone: 0******789
email: s***@example.com
card: ****1234
```

Full values require appropriate permission.

---

# 1080 — Audit Requirements

Audit actions such as:

```text
admin profile update
member card link/unlink
consent grant/revoke
customer closure
anonymization
sensitive profile access if required
```

---

# 1081 — Profile Access Audit

Not every normal customer self-read needs permanent audit.

Sensitive support/admin access may need:

```text
actor
target customer
purpose
timestamp
```

---

# 1082 — Privacy Access Request

If the platform supports customer data export:

```text
Customer requests data
      ↓
Authenticate strongly
      ↓
Collect owned customer data
      ↓
Coordinate downstream domains
      ↓
Generate export
```

Customer Service cannot independently export data owned by Order/Wallet/Loyalty.

---

# 1083 — Privacy Deletion Request

Customer Service may coordinate profile deletion/anonymization.

But each domain applies its own retention rule.

Example:

```text
Customer Profile → anonymize
Order history → retain transaction record
Wallet ledger → retain financial record
Loyalty → close account / retain ledger as required
```

---

# 1084 — Anonymization

Example transformations:

```text
display_name → "Deleted Customer"
phone → null/remove
email → null/remove
address → delete
profile image → delete
```

Keep:

```text
customer_id
```

or irreversible surrogate where historical links require it.

---

# 1085 — Anonymization Event

Possible:

```text
CustomerAnonymized
```

Consumers should not use this event to erase legally required records blindly.

---

# 1086 — Profile Image

If supported:

```text
object storage
```

stores the image.

Customer database stores:

```text
object_key
mime_type
checksum
updated_at
```

Do not store large image blobs in PostgreSQL by default.

---

# 1087 — Profile Image Upload Security

Validate:

```text
MIME type
size
extension
malware where required
image decode
authorization
```

Generate storage key server-side.

---

# 1088 — Contact Verification

If Customer Service allows adding contact methods:

```text
verification may be delegated to Identity or verification service
```

Do not invent a second insecure verification flow.

---

# 1089 — Contact Synchronization

If Identity and Customer both maintain phone/email representations:

define:

```text
authoritative owner
synchronization event
conflict behavior
```

Avoid bidirectional uncontrolled updates.

---

# 1090 — Preferred Language Event

Example:

```text
CustomerPreferenceChanged
```

Notification Service can update local projection.

This avoids Customer Service call on every notification.

---

# 1091 — Preferred Store Validation

Customer Service may validate store existence through:

```text
Catalog/Store contract
```

or event-driven local projection.

Avoid hard foreign key.

---

# 1092 — Cache Usage

Redis may cache:

```text
customer summary
preference summary
membership mapping
```

Authoritative data remains PostgreSQL.

---

# 1093 — Cache Key Examples

```text
customer:by-user:{user_id}
customer:summary:{customer_id}
customer:preferences:{customer_id}
```

TTL depends on data volatility.

---

# 1094 — Cache Invalidation

On profile update:

```text
DB commit
  ↓
invalidate/update cache
```

Never return stale sensitive state indefinitely.

---

# 1095 — Cache Failure

Customer read should normally degrade to PostgreSQL if Redis is unavailable.

Customer updates must not depend on cache success.

---

# 1096 — Customer Search Index

If search volume becomes large:

```text
Customer Service
      ↓ event
Search Projection
      ↓
OpenSearch/Elasticsearch
```

Do not expose the search index as source of truth.

---

# 1097 — Search Privacy

Search index must contain only fields needed for search.

Apply:

```text
access control
encryption
retention
deletion propagation
```

---

# 1098 — Customer Merge

If duplicate customer profiles exist, merge is a complex operation.

It must define:

```text
surviving customer_id
member mapping
address merge
consent merge
downstream references
audit
rollback
```

Do not implement casually.

---

# 1099 — Customer Merge Event

Possible:

```text
CustomerMerged
```

with:

```text
source_customer_id
target_customer_id
```

Consumers may need reference remapping.

---

# 1100 — Customer Duplicate Detection

Potential signals:

```text
same verified phone
same verified email
same member card
manual support review
```

Do not auto-merge based only on name similarity.

---

# 1101 — External CRM Integration

Integration flow:

```text
Customer Service
   ↓
Integration/ACL
   ↓
CRM
```

Keep external CRM field names out of the domain.

---

# 1102 — CRM Synchronization

Decide ownership per field.

Example:

```text
Customer display name → Customer Service authoritative
CRM segment → CRM authoritative
```

Sync direction must be documented.

---

# 1103 — External Customer Mapping

Possible table:

```text
external_customer_mappings
--------------------------
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

# 1104 — Customer Event Idempotency

Kafka consumer examples:

```text
UserRegistered
UserAccountClosed
```

must store:

```text
event_id
consumer_name
```

before/within same transaction as business effect.

---

# 1105 — Outbox

Events such as:

```text
CustomerCreated
CustomerProfileUpdated
MemberCardLinked
ConsentRevoked
CustomerAnonymized
```

should use the transactional outbox.

---

# 1106 — Customer Read Consistency

Own-profile read:

```text
strong/read-after-write preferred
```

Notification preference projection:

```text
eventual consistency acceptable
```

Admin analytics:

```text
eventual/reporting store
```

---

# 1107 — Customer Service Availability

Customer Service is important but not always required for every business request.

Example:

```text
Order Service may use previously captured customer/order data
```

instead of synchronously querying Customer Service for every status transition.

Avoid unnecessary hard dependency.

---

# 1108 — Hard Dependencies

Potential synchronous dependencies:

```text
Identity context via authenticated claims
Store validation if required
Membership validation if external
```

Keep limited.

---

# 1109 — Soft Dependencies

Examples:

```text
Notification
Analytics
CRM sync
Search indexing
```

should not block profile update.

---

# 1110 — Failure Modes

Consider:

```text
PostgreSQL unavailable
Redis unavailable
Kafka unavailable
CRM unavailable
Object storage unavailable
Store validation unavailable
```

Each use case needs safe behavior.

---

# 1111 — Kafka Failure

With outbox:

```text
Profile update commits
Outbox remains pending
Publisher retries later
```

The profile update should not be lost because Kafka is temporarily unavailable.

---

# 1112 — CRM Failure

CRM synchronization failure should not usually reject customer profile update.

Use:

```text
event
retry
DLQ
reconciliation
```

---

# 1113 — Object Storage Failure

Profile image upload may fail independently.

Do not update profile image key until object upload succeeds or use a safe staged workflow.

---

# 1114 — Customer Metrics

Track:

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

Technical:

```text
request latency
DB pool
cache hit rate
Kafka outbox backlog
```

---

# 1115 — Customer SLIs

Potential:

```text
profile read availability
profile update success rate
P95 profile read latency
P95 update latency
event publication lag
```

---

# 1116 — Alerts

Alert on:

```text
high 5xx
DB connection exhaustion
outbox backlog
member-card conflict spike
customer creation failures
cache failure if severe
PII-related security alert
anonymization job failures
```

---

# 1117 — Structured Logging

Safe fields:

```text
customer_id
user_id if appropriate
operation
result
request_id
correlation_id
```

Do not log:

```text
full address
full phone
full email
full member card
```

unless explicitly required and protected.

---

# 1118 — Customer Dashboard

Dashboard should include:

```text
request rate
latency
errors
customer creation
profile update
membership operations
consent operations
DB health
cache health
outbox lag
```

---

# 1119 — Runbooks

Required:

```text
Customer DB unavailable
Outbox backlog
Member card duplicate/conflict
Customer creation consumer failing
CRM sync backlog
Anonymization job failure
PII exposure incident
```

---

# 1120 — Backup

Customer database backup includes:

```text
profiles
addresses
preferences
consents
membership mappings
history
```

Sensitive backups must follow encryption/access policy.

---

# 1121 — Restore

After restore verify:

```text
schema version
customer/user mapping
member-card uniqueness
consent history
outbox state
processed-event state
```

---

# 1122 — Restore and Event Replay

If restored behind Kafka position:

```text
consumer idempotency
```

must prevent duplicate customer creation or duplicate card links.

---

# 1123 — Data Retention

Customer profile retention depends on:

```text
active relationship
privacy requirements
business support
legal obligations
```

Do not use one retention rule for all tables.

---

# 1124 — Address Retention

Deleted saved addresses may have short retention.

Historical order addresses belong to Order Service and follow order retention.

---

# 1125 — Consent Retention

Consent history may require longer retention than current customer preference.

Keep enough history to prove:

```text
when consent was granted
what version
when revoked
```

---

# 1126 — Membership Retention

Membership mapping history may need retention for:

```text
support
loyalty reconciliation
fraud
```

even after card replacement.

---

# 1127 — Schema Migration

Example Flyway sequence:

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

---

# 1128 — Backward-Compatible Profile Migration

Example:

```text
Add preferred_language
      ↓
Deploy app handling null
      ↓
Backfill default/known language
      ↓
Enforce NOT NULL if business requires
```

---

# 1129 — Contact Migration

If moving contact fields from Identity to Customer Service:

```text
Define source of truth
      ↓
Backfill
      ↓
Dual-read temporarily if required
      ↓
Switch writes
      ↓
Reconcile
      ↓
Remove old ownership
```

Avoid permanent dual-write.

---

# 1130 — Membership Migration

Legacy membership migration must reconcile:

```text
customer mapping
member ID uniqueness
card ownership
status
historical replacements
```

---

# 1131 — Customer Service Tests

Test categories:

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
```

---

# 1132 — Customer Domain Tests

Test:

```text
closed customer cannot update
status transitions
consent state rules
member card link rules
address/default behavior
```

---

# 1133 — Profile Application Tests

Test:

```text
get own profile
update own profile
invalid language
optimistic conflict
outbox creation
cache invalidation
```

---

# 1134 — Address Tests

Test:

```text
create
update
delete
set default
ownership
two concurrent defaults
address limit
```

---

# 1135 — Membership Tests

Test:

```text
link valid card
duplicate card
concurrent link
blocked card
unlink
replacement
outbox event
```

---

# 1136 — Consent Tests

Test:

```text
grant
revoke
duplicate grant
version
source
audit
event
```

---

# 1137 — Authorization Tests

Test:

```text
customer reads own profile
customer cannot read other profile
support can search
support access masked
admin update permission
membership manage permission
```

---

# 1138 — Privacy Tests

Verify:

```text
PII not logged
search results masked
anonymization removes required fields
events do not leak unnecessary PII
```

---

# 1139 — Kafka Tests

Test:

```text
UserRegistered creates one customer
duplicate event ignored
CustomerCreated emitted once
closure event handled idempotently
```

---

# 1140 — Persistence Integration Tests

Use PostgreSQL Testcontainers.

Test:

```text
unique user_id
member card uniqueness
partial default-address constraint
optimistic locking
Flyway migration
```

---

# 1141 — Load Testing

Scenarios:

```text
profile read
profile update
customer search
member-card lookup
address listing
```

Search/admin queries may require separate performance tuning.

---

# 1142 — Search Indexing

Indexes may include:

```text
user_id
member_id
card_number
normalized phone/email
status
created_at
```

Only index actual access patterns.

---

# 1143 — Customer Search Privacy Performance

Do not solve support search by creating unrestricted full-table wildcard search over PII.

Prefer:

```text
normalized exact search
prefix search with limits
approved search index
```

---

# 1144 — Customer Service README

Document:

```text
Purpose
Ownership
Non-responsibilities
Profile model
Membership model
Consent model
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
```

---

# 1145 — Customer ADRs

Recommended:

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

---

# 1146 — Customer Data Review Checklist

- [ ] Customer/user IDs clearly separated.
- [ ] Source of truth defined.
- [ ] PII classified.
- [ ] Unique customer per user enforced.
- [ ] Member-card uniqueness enforced.
- [ ] Consent history auditable.
- [ ] Address ownership clear.
- [ ] Historical order snapshot not coupled to profile.
- [ ] Retention defined.
- [ ] Anonymization defined.

---

# 1147 — Customer Contract Review Checklist

- [ ] `/me` endpoints derive identity from token.
- [ ] No arbitrary self-service user_id.
- [ ] Admin contracts separately authorized.
- [ ] PII minimized.
- [ ] Search results masked.
- [ ] Events versioned.
- [ ] Internal contracts purpose-specific.
- [ ] Errors stable.

---

# 1148 — Customer Security Review Checklist

- [ ] RBAC defined.
- [ ] Resource ownership enforced.
- [ ] Sensitive search audited.
- [ ] PII excluded from logs.
- [ ] Consent actions audited.
- [ ] Member-card operations protected.
- [ ] Export/deletion operations step-up protected if required.
- [ ] Backups encrypted.
- [ ] Non-production data masked.

---

# 1149 — Customer Testing Definition of Done

A feature is complete when:

- [ ] Domain tests pass.
- [ ] Application tests pass.
- [ ] Persistence tests pass.
- [ ] REST contract tests pass.
- [ ] Authorization tests pass.
- [ ] Privacy tests pass where relevant.
- [ ] Concurrency tests pass.
- [ ] Event/idempotency tests pass.
- [ ] Metrics/logging added.
- [ ] Documentation updated.

---

# 1150 — Customer Production Readiness Checklist

Before production:

- [ ] DB migrations tested.
- [ ] PII classification approved.
- [ ] Access permissions reviewed.
- [ ] Search masking verified.
- [ ] Consent history verified.
- [ ] Member-card uniqueness tested.
- [ ] Customer creation event replay tested.
- [ ] Backup/restore tested.
- [ ] Anonymization tested.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Load tests passed.

---

# 1151 — Initial Implementation Order

Recommended:

```text
1. Customer aggregate
2. Customer table
3. UserRegistered consumer
4. GET /customers/me
5. PATCH /customers/me
6. Preferences
7. Addresses
8. Membership mapping
9. Member card
10. Consent
11. Admin/support search
12. Status history
13. Customer closure
14. Anonymization
15. CRM integration
```

---

# 1152 — Minimum Viable Customer Service

First production-capable version:

```text
Customer creation
Profile read
Profile update
Language preference
Membership mapping
Member card mapping if required
PII protection
Authorization
Audit for sensitive operations
Outbox
Consumer idempotency
```

Add addresses/consent when the product requires them.

---

# 1153 — Future Enhancements

Potential:

```text
Customer segmentation
CRM sync
Pass-through profile verification
Households
Customer tags
Preferred stores
Profile image
Data export portal
Self-service account closure
Advanced privacy workflow
```

---

# 1154 — PART 09 Deliverables

PART 09 produces:

1. Customer Service responsibility definition.
2. Boundary from Identity.
3. Customer aggregate.
4. Customer status model.
5. Customer/user ID distinction.
6. Customer profile model.
7. Contact-data ownership rules.
8. Address model.
9. Membership model.
10. Member ID model.
11. Member-card model.
12. Preference model.
13. Consent model.
14. Communication-consent rules.
15. Profile update flow.
16. Customer REST contracts.
17. Internal purpose-specific contracts.
18. Customer events.
19. Event consumers.
20. Customer database schema.
21. Transaction patterns.
22. Concurrency controls.
23. Idempotency rules.
24. Clean Architecture package layout.
25. Input/output ports.
26. Error catalog.
27. Authorization model.
28. PII classification.
29. Masking rules.
30. Audit requirements.
31. Privacy export/deletion guidance.
32. Anonymization strategy.
33. Cache strategy.
34. Search strategy.
35. CRM integration guidance.
36. Metrics and SLIs.
37. Alerts.
38. Logs.
39. Runbooks.
40. Backup/restore.
41. Retention.
42. Migration strategy.
43. Testing strategy.
44. ADR list.
45. Review checklists.
46. Production-readiness checklist.
47. Implementation order.

---

# 1155 — Exit Criteria

PART 09 is complete when the team can answer:

### Ownership

```text
Which data belongs to Customer Service versus Identity?
```

### Identity Link

```text
How does customer_id relate to user_id?
```

### Profile

```text
Which profile fields are authoritative here?
```

### Membership

```text
Who owns member ID and member-card mapping?
```

### Consent

```text
How are consent changes recorded and audited?
```

### Addresses

```text
How are saved addresses separated from historical order-address snapshots?
```

### Privacy

```text
How is PII masked, retained, exported, anonymized, and deleted?
```

### Contracts

```text
Which data can Order, Loyalty, and Notification consume?
```

### Events

```text
Which customer changes are published?
```

### Reliability

```text
What happens if Kafka, Redis, CRM, or object storage is unavailable?
```

If these answers are clear and tested, Customer Service is ready for implementation.

---

# 1156 — Handoff to PART 10

PART 10 defines Catalog Service.

```text
PART 09
Customer Service
      ↓
Customer / Member Identity
Preferences
Addresses
Consent
      ↓
PART 10
Catalog Service
```

Catalog Service will own:

```text
Products
Categories
Menu Items
Modifiers
Sub-modifiers
Prices
Store Menu Configuration
Availability Metadata
Catalog Versioning
Catalog Read Models
```

Customer Service will only reference catalog/store identifiers through contracts.

---

# PART 09 — Summary

The key separation is:

```text
Identity Service
    owns
Authentication / Credentials / Tokens / Sessions

Customer Service
    owns
Profile / Membership Mapping / Preferences / Consent
```

The main customer lifecycle is:

```text
UserRegistered
      ↓
CustomerCreated
      ↓
Profile Maintained
      ↓
Membership Linked
      ↓
Preferences / Consent
      ↓
Customer Closed
      ↓
Anonymized where required
```

The most important rules are:

```text
Customer data has one authoritative owner.
Identity data is not duplicated without purpose.
Member-card ownership is strongly constrained.
Consent is auditable.
PII is minimized and protected.
Historical order data uses snapshots.
Customer events do not leak unnecessary PII.
Customer Service does not become a shared database for the platform.
```

---

**End of PART 09 — Customer Service**
