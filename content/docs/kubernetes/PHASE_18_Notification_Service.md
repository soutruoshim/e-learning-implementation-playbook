---
title: "PHASE 18 — Notification Service"
---

# PHASE 18 — Notification Service

> **Purpose:** Implement the Notification Service as the authoritative delivery engine for customer and operational communications. This phase defines durable notification requests, templates and immutable versions, English/Khmer localization, channel routing, customer delivery preferences, push device registration, In-App notifications, Push/Email/SMS delivery adapters, deduplication, scheduling, expiry, delivery attempts, retry, provider result mapping, provider callbacks, unknown-outcome recovery, priority/backpressure, broadcasts, reconciliation, security, observability, migration, testing, and production readiness.
>
> **Previous Phase:** Phase 17 — Mission Service
>
> **Next Phase:** Phase 19 — Integration / Anti-Corruption Layer
>
> **Primary Architecture Basis:** PART 19 — Notification Service, supported by completed phases for Identity, Customer, Ordering, Payment, Wallet, Loyalty, Mission, Service Communication, Distributed Transactions / Saga, and Kafka / Event Architecture.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Kafka, REST/gRPC, Flyway, Redis later where appropriate, provider adapters such as FCM/APNs/SMTP/SMS gateway.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 18 Goal

Build a production-capable Notification Service that can answer:

```text
Should this notification be sent?
Which channel should be used?
Which template applies?
Which language should be rendered?
Has the same business notification already been created?
When should it be sent?
Has it expired?
How many delivery attempts occurred?
Did the provider accept it?
Did the provider actually confirm delivery?
Should failure be retried?
Can another channel be used safely?
What did the customer see in the In-App inbox?
```

---

# 2. Fundamental Boundary

```text
Business services decide:
what happened

Notification decides:
how and when to communicate it
```

---

# 3. Notification Ownership

Notification owns:

```text
Notification Request
Notification
Notification Message
Notification Template
Template Version
Template Variables
Localization
Channel Routing
Push Notification
Email
SMS if enabled
In-App Notification
Notification Preference Enforcement
Quiet Hours if enabled
Scheduling
Deduplication
Delivery Attempt
Retry
Provider Integration
Provider Response Mapping
Delivery Status
Notification History
Notification Events
Notification Reconciliation
Device Delivery Endpoints if approved
```

---

# 4. Non-Responsibilities

Notification does not own:

```text
Order lifecycle
Mission progress
Reward assignment
Points balance
Wallet balance
Promotion eligibility
Customer profile master
Payment state
Password reset challenge semantics
OTP generation/verification
```

---

# 5. Source Business Facts

Notification may consume:

```text
OrderAccepted
OrderReady
OrderCompleted
OrderCancelled
PaymentFailed
WalletTopUpCompleted
MissionCompleted
RewardAssigned
PointsExpiringSoon
RewardExpiringSoon
PasswordResetRequested
SecurityAlertRequested
```

Only approved event types should have active policies.

---

# 6. Core Flow

```text
Business Event / Internal Command
        ↓
Notification Policy
        ↓
Deduplication
        ↓
Template + Localization
        ↓
Preference / Channel Selection
        ↓
Schedule / READY
        ↓
Delivery Worker
        ↓
Provider
        ↓
Retry / Final State
```

---

# 7. Ubiquitous Language

| Term | Meaning |
|---|---|
| Notification Request | Business request to communicate something |
| Notification | Durable communication record |
| Template | Reusable content definition |
| Template Version | Immutable published content revision |
| Channel | PUSH, EMAIL, SMS, IN_APP |
| Delivery Attempt | One actual send attempt to one channel/destination |
| Provider | External delivery platform |
| Preference | Customer opt-in/out or delivery preference |
| Schedule | Future send time |
| Deduplication Key | Stable key preventing duplicate business notification |
| Quiet Hours | Customer-local time where non-urgent delivery may be delayed |
| Fallback Channel | Secondary channel allowed by policy |
| Delivery Status | Canonical internal notification state |
| Provider Status | Provider-specific state translated to canonical state |
| Destination | Device token, email, phone, or internal inbox |
| Provider Reference | Provider message/request identifier |

---

# 8. Notification Aggregate

Primary aggregate:

```text
Notification
```

---

# 9. Notification State

Possible:

```text
notification_id
recipient_type
recipient_id
notification_type
category
priority
status
preferred_channel
template_code
template_version
language
scheduled_at
expires_at
deduplication_key
business_reference_type
business_reference_id
correlation_id
created_at
updated_at
sent_at
completed_at
version
```

---

# 10. Canonical Notification Status

Recommended:

```text
CREATED
SCHEDULED
READY
SENDING
SENT
DELIVERED
PARTIALLY_DELIVERED
FAILED
CANCELLED
EXPIRED
```

---

# 11. Notification State Machine

Conceptual:

```text
CREATED
  ├──> SCHEDULED
  ├──> READY
  └──> CANCELLED

SCHEDULED
  ├──> READY
  ├──> CANCELLED
  └──> EXPIRED

READY
  ├──> SENDING
  ├──> CANCELLED
  └──> EXPIRED

SENDING
  ├──> SENT
  ├──> FAILED
  └──> PARTIALLY_DELIVERED

SENT
  ├──> DELIVERED
  └──> FAILED
       only when asynchronous provider failure is authoritative
```

---

# 12. Status Meaning

```text
CREATED
→ durable request exists

SCHEDULED
→ waiting until future send time

READY
→ eligible for delivery

SENDING
→ one or more channels currently being attempted

SENT
→ accepted/sent by provider according to provider semantics

DELIVERED
→ delivery confirmed when provider genuinely supports it

PARTIALLY_DELIVERED
→ some destinations/channels succeeded, others did not

FAILED
→ terminal delivery failure

CANCELLED
→ intentionally stopped before remaining sends

EXPIRED
→ message is no longer useful and must not be sent
```

---

# 13. Provider Accepted Is Not Delivered

Critical rule:

```text
provider accepted
!=
recipient delivered
```

Do not map provider HTTP success automatically to:

```text
DELIVERED
```

unless provider contract truly confirms delivery.

---

# 14. Notification Invariants

```text
recipient required
notification_type required
template/channel policy valid
dedupe scope prevents duplicate business notification
scheduled notification cannot send before scheduled_at
expired notification cannot send
marketing preference must be enforced
critical/security policy may override marketing opt-out only when explicitly approved
provider call never changes business-domain truth
```

---

# 15. Notification Type

Stable examples:

```text
ORDER_ACCEPTED
ORDER_READY
ORDER_COMPLETED
ORDER_CANCELLED
MISSION_COMPLETED
REWARD_ASSIGNED
REWARD_EXPIRING
POINTS_EXPIRING
WALLET_TOPUP_COMPLETED
PAYMENT_FAILED
PASSWORD_RESET
SECURITY_ALERT
MARKETING_CAMPAIGN
SYSTEM_ANNOUNCEMENT
```

---

# 16. Notification Category

Recommended:

```text
TRANSACTIONAL
SECURITY
LOYALTY
MARKETING
OPERATIONAL
```

---

# 17. Category Affects

```text
preference enforcement
priority
quiet hours
retry policy
expiry
fallback
retention
queue/workers
```

---

# 18. Priority

Possible:

```text
LOW
NORMAL
HIGH
URGENT
```

---

# 19. Priority Examples

```text
marketing → LOW / NORMAL
order ready → HIGH
password reset → HIGH
fraud/security alert → URGENT
```

Priority never arbitrarily bypasses consent/legal policy.

---

# 20. Initial Channels

```text
PUSH
EMAIL
SMS
IN_APP
```

---

# 21. MVP Channels

First production-capable release should prioritize:

```text
PUSH
IN_APP
```

Email and SMS are conditional based on actual product/security requirements.

---

# 22. Push Use Cases

Appropriate for:

```text
order status
reward assigned
mission completion
general app communication
```

---

# 23. Email Use Cases

Appropriate for:

```text
password reset
receipt
security notice
support communication
long-form content
```

---

# 24. SMS Use Cases

May be used for:

```text
OTP
security
critical transactional message
```

Because of cost and abuse risk, use only by explicit policy.

---

# 25. In-App Notifications

Stored internally and displayed by the application.

May provide:

```text
inbox
read/unread
deep link
history
```

---

# 26. Multi-Channel Notification

One business request may create:

```text
PUSH + IN_APP
```

or:

```text
EMAIL + PUSH
```

according to notification policy.

---

# 27. Channel Policy Examples

```text
ORDER_READY
→ PUSH + IN_APP

PASSWORD_RESET
→ EMAIL or SMS according to approved security contract

REWARD_ASSIGNED
→ PUSH + IN_APP

MARKETING_CAMPAIGN
→ enabled customer channels only
```

---

# 28. Channel Routing Inputs

```text
notification type
category
customer preferences
destination/contact availability
device token availability
language
priority
provider health
fallback policy
```

---

# 29. Channel Fallback

Example:

```text
PUSH permanently unavailable
→ IN_APP remains available
```

Critical security example:

```text
EMAIL fails
→ SMS fallback
```

only when explicitly approved.

---

# 30. Fallback Safety

Never automatically send SMS for every Push failure.

Consider:

```text
cost
consent
customer expectation
security
provider unknown outcome
```

---

# 31. Notification Request

Internal request example:

```json
{
  "notification_type": "ORDER_READY",
  "recipient_id": "CUS001",
  "template_code": "ORDER_READY",
  "variables": {
    "order_number": "BROWN-10001",
    "store_name": "BROWN TK"
  },
  "deduplication_key": "ORDER_READY:ORD001"
}
```

---

# 32. Request Sources

Possible:

```text
Kafka domain event
internal service command
scheduled job
admin broadcast
security workflow
```

---

# 33. Event-Driven Notification

Preferred normal business flow:

```text
OrderReady
    ↓
Notification Kafka consumer
    ↓
create durable Notification
    ↓
async delivery worker
```

Ordering is not blocked by provider latency.

---

# 34. Command-Driven Notification

Security-sensitive flows may call an internal command such as:

```text
SendPasswordResetNotification
```

Success means:

```text
accepted/enqueued for delivery
```

not:

```text
delivered to customer
```

---

# 35. Delivery Guarantee

Normal model:

```text
at-least-once event/command processing
+
notification deduplication
+
provider idempotency where available
```

Goal:

```text
effectively-once customer communication
```

for stable business keys.

---

# 36. Notification Deduplication

Recommended business key:

```text
notification_type
+
business_reference
+
recipient
```

Example:

```text
ORDER_READY:ORD001:CUS001
```

---

# 37. Dedupe Uniqueness

Potential:

```text
(recipient_id, notification_type, deduplication_key)
```

---

# 38. Dedupe Record Retention

Must be long enough to cover:

```text
Kafka replay window
consumer retry
provider retry
database restore replay
business-event re-publication
```

Final duration:

```text
TBD_NOTIFICATION_POLICY
```

---

# 39. Duplicate Business Event

A replayed:

```text
OrderReady
```

must not create/send another message when policy expects one notification.

---

# 40. Repeatable Notifications

Examples:

```text
points expiry reminders
reward expiry reminders
marketing reminders
```

Dedupe key must include reminder cycle/window.

Example:

```text
POINTS_EXPIRY:CUS001:7_DAY
```

---

# 41. Event-Level Idempotency

Consumed source event uses:

```text
(event_id, consumer_name)
```

in `processed_events`.

---

# 42. Business-Level Dedupe

Event ID is not sufficient if producer accidentally emits a semantically duplicate event with a different event ID.

Use:

```text
business dedupe key
```

as a second line of defense.

---

# 43. Template

Template defines reusable message structure.

Possible fields:

```text
template_code
notification_type
channel
status
active_version
```

---

# 44. Template Code Format

Recommended:

```text
UPPERCASE_WITH_UNDERSCORES
```

Examples:

```text
ORDER_READY_PUSH
PASSWORD_RESET_EMAIL
MISSION_COMPLETED_PUSH
REWARD_ASSIGNED_IN_APP
```

---

# 45. Template Lifecycle

Recommended:

```text
DRAFT
PUBLISHED
ARCHIVED
```

---

# 46. Published Template Immutability

Published content should not be edited in place if historical reproducibility matters.

Use:

```text
new immutable version
```

---

# 47. Template Version Snapshot

Notification records:

```text
template_code
template_version
```

so Support can explain what version was selected.

---

# 48. Template Variables

Examples:

```text
{{customer_name}}
{{order_number}}
{{store_name}}
{{reward_name}}
{{expiry_date}}
```

---

# 49. Required Variables

Each template version defines:

```text
required_variables
```

Example:

```text
ORDER_READY
requires:
  order_number
  store_name
```

---

# 50. Missing Variable

Canonical error:

```text
TEMPLATE_VARIABLE_MISSING
```

Do not silently render blank required business fields.

---

# 51. Unknown Variables

Reject unknown/unapproved variables where policy requires.

Template-variable contracts should be explicit.

---

# 52. Injection Safety

Default:

```text
render variables as escaped plain content
```

For HTML email:

```text
HTML-escape variables
```

unless explicitly trusted sanitized rich content.

---

# 53. Template Payload Limits

Validate per provider:

```text
push title length
push body length
push data size
SMS length
email subject length
email/body provider limits
```

---

# 54. Template Localization

Initial languages:

```text
en
km
```

Future languages can be added through the same version model.

---

# 55. Language Selection Priority

Possible source priority:

```text
explicit request language
      ↓
customer preferred language
      ↓
platform default
```

Freeze exact behavior in policy.

---

# 56. Language Fallback

If Khmer content missing:

```text
fallback English/default
```

if approved.

Never send blank content.

---

# 57. Channel Translation Fallback

If channel-specific localization missing:

```text
fallback same channel default language
```

Do not switch channel only because translation is missing unless policy says so.

---

# 58. Localization History

Historical notification should remain explainable through:

```text
template version
language
rendered/snapshotted content where retained
```

---

# 59. Preference Ownership Decision

Possible:

```text
Customer Service owns general communication preferences
Notification keeps delivery projection
```

or Notification owns communication preferences directly.

Exact authoritative boundary:

```text
TBD_SERVICE_BOUNDARY
```

---

# 60. Recommended Preference Boundary

Recommended:

```text
Customer Service
→ authoritative preference profile

Notification Service
→ delivery preference projection
```

for:

```text
category
channel
enabled
timezone
quiet hours
source_version
```

---

# 61. Preference Projection

Possible fields:

```text
recipient_id
category
channel
enabled
timezone
quiet_hours_start
quiet_hours_end
updated_at
source_version
```

---

# 62. Essential Notifications

Examples:

```text
password reset
security alert
critical order update
```

may be mandatory/transactional and exempt from marketing opt-out.

Legal/business policy determines exact categories.

---

# 63. Marketing Opt-Out

Before sending Marketing:

```text
check current consent/preference
```

Opt-out propagation must be timely.

---

# 64. Send-Time Preference Recheck

For scheduled Marketing:

```text
re-check preference at actual send time
```

because customer may opt out after scheduling.

---

# 65. Quiet Hours

Optional example:

```text
22:00–07:00 customer local time
```

Non-urgent messages may be delayed.

---

# 66. Quiet-Hour Exemption

Security/critical notifications may bypass quiet hours only by explicit policy.

---

# 67. Timezone

Quiet hours require:

```text
IANA timezone or approved reliable timezone representation
```

Do not depend only on server local time.

---

# 68. Scheduling Fields

Notification may store:

```text
scheduled_at
expires_at
```

---

# 69. Schedule Examples

```text
reward reminder tomorrow
points expiry reminder 7 days before
marketing campaign launch
```

---

# 70. Scheduling Rule

If:

```text
scheduled_at > now
```

then:

```text
status = SCHEDULED
```

Worker later moves it to:

```text
READY
```

---

# 71. Notification Expiry

If:

```text
expires_at <= now
```

do not deliver stale message.

Transition:

```text
→ EXPIRED
```

---

# 72. Business Expiry

Notification expiry differs from template expiry.

Example:

```text
coupon reminder expires when coupon/reward is no longer actionable
```

---

# 73. Scheduling Worker

```text
find due SCHEDULED notifications
      ↓
lock bounded batch
      ↓
check expiry/preference
      ↓
mark READY
      ↓
enqueue/allow delivery workers
```

---

# 74. Scheduled Worker SQL

Possible:

```sql
SELECT id
FROM notifications
WHERE status = 'SCHEDULED'
  AND scheduled_at <= NOW()
ORDER BY scheduled_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

Filter expired rows appropriately.

---

# 75. Scheduler Concurrency

Use:

```text
row locking
SKIP LOCKED
atomic transition
```

so multiple replicas do not release the same notification simultaneously.

---

# 76. Delivery Attempt

Each actual provider/channel send produces:

```text
notification_delivery_attempt
```

---

# 77. Delivery Attempt State

Possible:

```text
channel
provider
attempt_number
status
provider_reference
provider_code
error_category
started_at
completed_at
next_retry_at
```

---

# 78. Delivery Attempt Status

Recommended:

```text
PENDING
SENDING
ACCEPTED
DELIVERED
FAILED_RETRYABLE
FAILED_FINAL
UNKNOWN
```

---

# 79. UNKNOWN Outcome

If provider may have accepted the request but the response was lost:

```text
UNKNOWN
```

not automatically:

```text
FAILED
```

---

# 80. UNKNOWN Recovery

If provider supports:

```text
provider_reference lookup
idempotency key
delivery query
```

use it.

Otherwise retry only under a policy designed to minimize duplicate delivery.

---

# 81. Provider Adapter Boundary

Conceptual:

```java
public interface NotificationProviderPort {
    SendResult send(NotificationMessage message);
}
```

Channel-specific adapters can expose richer capabilities.

---

# 82. Push Provider Adapter

Possible providers:

```text
Firebase Cloud Messaging
Apple Push Notification service
```

Exact deployment/provider choice is configuration.

---

# 83. Email Provider Adapter

Possible:

```text
SMTP
cloud email provider
Microsoft/Google integration
```

Provider behavior stays behind adapter.

---

# 84. SMS Provider Adapter

Possible:

```text
local telecom gateway
cloud SMS provider
```

Map responses to canonical result statuses.

---

# 85. In-App Delivery

In-App is internal persistence.

Delivery semantics:

```text
stored and available to client
```

Read/open is separate.

---

# 86. Provider Result Mapping

Provider responses such as:

```text
HTTP 200/202
INVALID_ARGUMENT
UNREGISTERED
TEMPORARY_FAILURE
429
503
```

map to canonical:

```text
ACCEPTED
FAILED_FINAL
FAILED_RETRYABLE
UNKNOWN
```

according to provider contract.

---

# 87. Retryable Failures

Examples:

```text
provider timeout
HTTP 429
HTTP 503
temporary network failure
temporary provider outage
```

---

# 88. Final Failures

Examples:

```text
invalid email
unregistered push token
permanently rejected phone
malformed payload
invalid required destination
```

Do not retry indefinitely.

---

# 89. Retry Policy

Use:

```text
backoff
jitter
bounded max attempts
expiry deadline
category-aware behavior
```

---

# 90. Illustrative Retry Sequence

Source example only:

```text
attempt 1 → immediate
attempt 2 → +30 sec
attempt 3 → +2 min
attempt 4 → +10 min
attempt 5 → final
```

Production values:

```text
TBD_NOTIFICATION_POLICY
```

---

# 91. Retry by Category

Security/Transactional:

```text
faster / potentially more attempts
```

Marketing:

```text
slower / fewer attempts
```

Exact values require policy.

---

# 92. Retry Deadline

Never retry after:

```text
notification expires_at
```

---

# 93. Retry Worker

Find:

```text
FAILED_RETRYABLE
AND next_retry_at <= now
```

then process bounded, locked batches.

---

# 94. Provider Idempotency

If provider supports idempotency:

```text
stable provider key =
notification_id + channel/destination
```

or equivalent approved key.

---

# 95. Provider Reference

Persist:

```text
provider_reference
```

whenever returned.

Useful for:

```text
UNKNOWN recovery
callback reconciliation
support
```

---

# 96. Delivery Transaction Boundary

Never hold a database transaction open during external provider calls.

---

# 97. Correct Send Pattern

```text
claim READY channel
mark SENDING
commit
      ↓
call provider
      ↓
persist result / attempt
```

---

# 98. Delivery Claim

Multiple workers must not send the same delivery unit simultaneously.

Use:

```text
row lock
SKIP LOCKED
atomic status transition
```

---

# 99. Worker Claim Query

Conceptual:

```sql
SELECT id
FROM notification_channels
WHERE status IN ('READY', 'FAILED_RETRYABLE')
  AND (next_retry_at IS NULL OR next_retry_at <= NOW())
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

Adapt fields to final schema.

---

# 100. Worker Crash After Provider Send

Danger:

```text
provider accepted
worker crashes
before DB records ACCEPTED
```

Retry may duplicate delivery.

---

# 101. Crash Mitigations

```text
provider idempotency
provider reference lookup
stable send key
collapse/group key when semantically safe
client dedupe where appropriate
reconciliation
```

---

# 102. Push Collapse Key

Can be useful for replaceable state messages such as:

```text
latest order status for ORD001
```

---

# 103. Do Not Collapse

Do not collapse distinct:

```text
security notifications
reward notifications
legal/important alerts
```

unless explicitly designed.

---

# 104. Push Payload

May include:

```text
display payload
data payload
action/deep link
```

Keep sensitive data minimal.

---

# 105. Lock-Screen Privacy

Avoid sending sensitive content such as:

```text
full wallet balance
full payment details
private personal details
```

unless explicitly approved.

---

# 106. Email Rendering

HTML email should use:

```text
escaped variables
sanitized approved markup
plain-text alternative where possible
brand wrapper
unsubscribe behavior for marketing
```

---

# 107. Email Tracking

Optional:

```text
open tracking
click tracking
```

Only enable with explicit privacy/retention review.

---

# 108. SMS Content

Keep concise.

Avoid sensitive account information.

OTP/reset data must be short-lived and never logged.

---

# 109. Password Reset Boundary

Identity owns:

```text
reset challenge semantics
token/code generation
hash/storage
attempt count
verification
expiry
```

Notification owns:

```text
message delivery
```

---

# 110. Password Reset Input

Notification may receive:

```text
trusted destination
one-time code/link data
expiry information
template/policy reference
```

---

# 111. Security Notification Privacy

Avoid account enumeration.

Messages should not disclose unsupported identity details.

---

# 112. Push Device Ownership

Recommended source direction:

```text
Notification Service owns delivery endpoints
```

such as:

```text
push token
platform
device identifier
last seen
status
```

Final boundary:

```text
TBD_SERVICE_BOUNDARY
```

---

# 113. Device Registration API

```text
POST /api/v1/notifications/devices
```

Example:

```json
{
  "platform": "ANDROID",
  "push_token": "...",
  "device_id": "..."
}
```

---

# 114. Device Unregistration API

Possible:

```text
DELETE /api/v1/notifications/devices/{deviceId}
```

or explicit token unregister operation.

---

# 115. Device Token Sensitivity

Push token is sensitive operational data.

Never:

```text
return another user's token
log raw token
expose token to unrelated services
```

---

# 116. Device Token Storage

Recommended:

```text
encrypted raw token
+
hash for lookup/uniqueness
```

---

# 117. Device Token Uniqueness

Possible:

```text
(provider, token_hash)
```

unique.

---

# 118. Device Reassignment

If same token appears under a newly authenticated customer:

```text
deactivate old association
activate new association
```

according to approved login/logout policy.

---

# 119. Logout Behavior

On logout/unregister:

```text
mark association INACTIVE
```

rather than blindly hard-delete if support/history requires retention.

---

# 120. Invalid Token

Permanent provider response such as:

```text
UNREGISTERED
INVALID_TOKEN
```

should:

```text
mark device INACTIVE
stop retrying that token
```

---

# 121. Multi-Device Customer

One customer may have:

```text
multiple phones
tablet
other app installations
```

---

# 122. Multi-Device Policy

Choose:

```text
send all active devices
```

or:

```text
selected/latest device
```

Decision:

```text
TBD_NOTIFICATION_POLICY
```

---

# 123. Multi-Device Fan-Out

One logical Notification may generate:

```text
multiple channel/destination delivery attempts
```

---

# 124. Partial Delivery

If one device succeeds and another fails:

```text
PARTIALLY_DELIVERED
```

may be appropriate at aggregate/channel level.

---

# 125. Device Table

Possible:

```text
id
recipient_id
platform
provider
token_hash
token_encrypted
device_id
status
last_seen_at
created_at
updated_at
```

---

# 126. Email Address Ownership

Notification should not become the authoritative owner of customer email unless explicitly assigned.

Use:

```text
Customer/Identity trusted contact
or
authorized contact projection
or
trusted command destination
```

---

# 127. Phone Ownership

Same boundary as email.

Normalize securely.

---

# 128. Destination Snapshot

For delivery/audit Notification may store:

```text
masked_email
encrypted_email
encrypted_phone
destination_masked
```

according to retention/security policy.

---

# 129. Notification Message

Rendered channel-specific content may contain:

```text
subject
title
body
data payload
deep link/action
image reference
```

---

# 130. Deep Link

Push/In-App may navigate to:

```text
/order/{id}
/rewards/{id}
/missions/{id}
```

through canonical app actions rather than arbitrary URI.

---

# 131. Deep-Link Security

Never allow arbitrary:

```text
javascript:
file:
untrusted external URI
```

Use allow-listed actions/routes.

---

# 132. Canonical Action Model

Examples:

```text
OPEN_ORDER
OPEN_REWARD
OPEN_MISSION
OPEN_COUPON
OPEN_HOME
OPEN_PROFILE
OPEN_TOP_UP
OPEN_FEEDBACK
```

---

# 133. Action Payload

Example:

```json
{
  "action": "OPEN_ORDER",
  "params": {
    "order_id": "ORD001"
  }
}
```

---

# 134. Action Validation

Each Notification Type may allow only specific actions.

Example:

```text
ORDER_READY
→ OPEN_ORDER
```

Validate action parameters server-side.

---

# 135. In-App Notification Model

Possible:

```text
id
notification_id
recipient_id
title
body
action
action_payload_json
read_at
archived_at
created_at
```

---

# 136. Customer Inbox APIs

Possible:

```text
GET  /api/v1/notifications
GET  /api/v1/notifications/{id}
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/read-all
GET  /api/v1/notifications/inbox/unread-count
```

---

# 137. Read Idempotency

Repeated:

```text
mark read
```

is a successful no-op.

---

# 138. Inbox Authorization

Customer can access only:

```text
their own Notification/In-App records
```

---

# 139. Unread Count

Can use:

```text
PostgreSQL query
```

initially.

Redis projection may be added in Phase 20.

---

# 140. Inbox Retention

Possible source examples:

```text
90 days
180 days
```

but production retention is:

```text
TBD_RETENTION_POLICY
```

Transactional and Marketing may differ.

---

# 141. Preference API

If Notification owns preferences:

```text
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences
```

---

# 142. Preference Example

```json
{
  "marketing": {
    "push": false,
    "email": true
  },
  "loyalty": {
    "push": true
  }
}
```

---

# 143. Mandatory Channel Validation

Backend must prevent disabling channels/categories that policy defines as mandatory.

UI explanation alone is not enough.

---

# 144. Template Database

Core:

```text
notification_templates
notification_template_versions
notification_template_localizations
```

---

# 145. notification_templates

Suggested:

```text
id
template_code
notification_type
channel
status
active_version
created_at
updated_at
```

Unique:

```text
(template_code, channel)
```

---

# 146. notification_template_versions

Suggested:

```text
id
template_id
version
subject_template
title_template
body_template
data_template
required_variables
published_at
published_by
status
```

---

# 147. notification_template_localizations

Possible:

```text
template_version_id
language
subject
title
body
```

---

# 148. Rendering Strategy Decision

Possible:

```text
render at creation
```

or:

```text
render at send
```

---

# 149. Render at Creation

Benefits:

```text
historical exact content
deterministic retries
template changes do not alter pending message
```

Cost:

```text
later language/template improvements not reflected
```

---

# 150. Render at Send

Benefits:

```text
latest content/language
```

Risks:

```text
historical non-reproducibility
template deletion/version issue
unexpected changed content
```

---

# 151. Recommended Transactional Rendering

For transactional notifications:

```text
select immutable template version at creation
```

Then either:

```text
render immediately
```

or persist:

```text
version + variables
```

for deterministic re-render.

---

# 152. Variable Snapshot

May store:

```text
variables JSONB
```

for retry/re-render.

Sensitive fields must be classified/redacted/encrypted.

---

# 153. Content Snapshot

Optional:

```text
rendered_subject
rendered_title
rendered_body
```

for support/history.

Retention must account for PII.

---

# 154. Notification Database Overview

Possible tables:

```text
notifications
notification_channels
notification_delivery_attempts
notification_templates
notification_template_versions
notification_template_localizations
notification_preferences
notification_devices
in_app_notifications
notification_schedules optional
notification_idempotency
processed_events
outbox_events
notification_reconciliation_runs
notification_reconciliation_mismatches
notification_broadcasts
notification_broadcast_batches
provider_callbacks optional
```

---

# 155. notifications

Suggested:

```text
id
recipient_type
recipient_id
notification_type
category
priority
status
template_code
template_version
language
deduplication_key
business_reference_type
business_reference_id
scheduled_at
expires_at
sent_at
completed_at
correlation_id
created_at
updated_at
version
```

---

# 156. notification_channels

Suggested:

```text
id
notification_id
channel
status
provider
destination_masked
created_at
updated_at
```

---

# 157. Channel Status

Possible implementation:

```text
READY
SENDING
ACCEPTED
DELIVERED
FAILED_RETRYABLE
FAILED_FINAL
CANCELLED
EXPIRED
UNKNOWN
```

Keep semantics aligned with Delivery Attempts.

---

# 158. notification_delivery_attempts

Suggested:

```text
id
notification_channel_id
attempt_number
provider
status
provider_reference
provider_code
error_category
started_at
completed_at
next_retry_at
```

---

# 159. notification_preferences

Suggested:

```text
recipient_id
category
channel
enabled
quiet_hours_start
quiet_hours_end
timezone
source_version
updated_at
```

Unique:

```text
(recipient_id, category, channel)
```

---

# 160. notification_devices

Suggested:

```text
id
recipient_id
platform
provider
token_hash
token_encrypted
device_id
status
last_seen_at
created_at
updated_at
```

---

# 161. in_app_notifications

Suggested:

```text
id
notification_id
recipient_id
title
body
action
action_payload_json
read_at
archived_at
created_at
```

---

# 162. notification_idempotency

For direct commands:

```text
id
operation
scope_id
idempotency_key
request_hash
status
response_body
created_at
expires_at
```

---

# 163. processed_events

Suggested:

```text
event_id
consumer_name
processed_at
```

Unique:

```text
(event_id, consumer_name)
```

---

# 164. outbox_events

Notification may publish:

```text
NotificationCreated
NotificationSent
NotificationDelivered
NotificationFailed
NotificationOpened
DeviceTokenDisabled
```

only when actual consumers need them.

---

# 165. Reconciliation Tables

```text
notification_reconciliation_runs
notification_reconciliation_mismatches
```

---

# 166. Notification Creation Transaction

```text
BEGIN

dedupe business request
resolve notification policy
resolve preferences
select template version
resolve language
render/snapshot
insert notification
insert channel rows
insert in-app record if applicable
insert outbox if needed
mark processed event

COMMIT
```

External provider call happens afterward.

---

# 167. No Provider Call in Creation Transaction

Never:

```text
BEGIN
...
call FCM/SMTP/SMS
...
COMMIT
```

---

# 168. Delivery Worker Flow

```text
claim READY channel/destination
      ↓
mark SENDING
commit claim
      ↓
load destination/message
      ↓
recheck send-time policy
      ↓
check expiry
      ↓
call provider
      ↓
map result
      ↓
persist attempt/channel status
      ↓
schedule retry or finalize
```

---

# 169. Send-Time Revalidation

Before actual send, check where applicable:

```text
notification not cancelled
not expired
preference still allows it
destination still active
provider health/rate limit
```

---

# 170. Aggregate Status Derivation

Aggregate Notification status derives from its channels/destinations.

Examples:

```text
all terminal success → SENT/DELIVERED
some success + some failure → PARTIALLY_DELIVERED
all terminal fail → FAILED
all cancelled/expired → corresponding state
```

Exact precedence:

```text
TBD_NOTIFICATION_POLICY
```

---

# 171. Order Notification Flow

```text
OrderReady
      ↓
Notification consumer
      ↓
dedupe
      ↓
render ORDER_READY
      ↓
Push + In-App
      ↓
delivery attempts
```

---

# 172. Mission Notification Flow

```text
MissionCompleted
      ↓
Notification
      ↓
Mission-completed communication
```

---

# 173. Mission vs Reward Notification

`MissionCompleted` and `RewardAssigned` may both occur.

Avoid duplicate/conflicting messages.

Possible policies:

```text
send MissionCompleted only
send RewardAssigned only
send both with distinct meaning
combine where events arrive closely
```

Decision:

```text
TBD_PRODUCT_POLICY
```

---

# 174. Reward Notification

```text
RewardAssigned
      ↓
localized reward message
      ↓
OPEN_REWARD
```

---

# 175. Points Expiry Reminder

Source examples:

```text
30 days
15 days
7 days
```

Exact windows are Loyalty/product policy.

Dedupe key includes:

```text
recipient
expiry period/reference
reminder window
```

---

# 176. Reward Expiry Reminder

Dedupe key includes:

```text
reward_assignment_id
reminder_window
recipient
```

---

# 177. Notification Policy Registry

Maintain centralized mapping:

```text
source event / notification_type
→ category
→ channels
→ template
→ priority
→ mandatory flag
→ expiry policy
→ fallback policy
```

---

# 178. Policy Example

```text
ORDER_READY
  category = TRANSACTIONAL
  channels = PUSH, IN_APP
  template = ORDER_READY
  priority = HIGH
```

---

# 179. Avoid Listener Switch Sprawl

Do not scatter giant:

```text
switch(event_type)
```

across Kafka listeners.

Use a policy/handler registry.

---

# 180. Policy Versioning

High-risk changes to:

```text
channel
mandatory status
template
fallback
priority behavior
```

should be versioned/audited where historical explanation matters.

---

# 181. Password Reset Flow

Possible:

```text
Identity
→ internal SendPasswordResetNotification command
→ Notification durable record
→ Email/SMS adapter
```

Identity remains owner of code/token semantics.

---

# 182. Security Flow Acceptance Meaning

Internal command returns:

```text
accepted/enqueued
```

not:

```text
customer received code
```

---

# 183. Provider Callback

Some providers send callbacks for:

```text
delivered
bounced
complaint
failed
```

---

# 184. Callback Authentication

Always verify provider callback authenticity using the provider-supported mechanism.

---

# 185. Callback Idempotency

Store:

```text
provider_event_id
```

and deduplicate.

---

# 186. Email Hard Bounce

Permanent bounce:

```text
mark destination unhealthy
stop retrying
```

or update contact-health projection.

---

# 187. Spam Complaint

Marketing complaint may disable:

```text
marketing email
```

according to consent/provider policy.

---

# 188. SMS Delivery Receipt

If provider supports it:

```text
SENT → DELIVERED / FAILED
```

based on authoritative receipt.

---

# 189. Push Delivery Limitation

Push provider frequently confirms:

```text
accepted for delivery
```

not human receipt.

Do not claim customer received it.

---

# 190. Notification Open Tracking

Optional client endpoint:

```text
POST /api/v1/notifications/{id}/opened
```

Use only if product analytics/privacy policy requires it.

---

# 191. NotificationOpened Event

If enabled, possible fields:

```text
notification_id
recipient_id
opened_at
```

Do not include full content.

---

# 192. Broadcast Notification

Admin may target:

```text
all customers
segment
store group
tier
explicit approved recipient list
```

---

# 193. Broadcast Is Different from Transactional Send

Do not insert millions of individual rows synchronously inside one admin HTTP request.

---

# 194. Broadcast Architecture

```text
broadcast definition
      ↓
audience/segment snapshot
      ↓
batch fan-out worker
      ↓
individual durable notifications
```

---

# 195. Broadcast Status

Possible:

```text
DRAFT
SCHEDULED
PROCESSING
COMPLETED
PAUSED
CANCELLED
FAILED
```

---

# 196. Broadcast Segmentation Boundary

Audience may come from:

```text
Customer/Analytics
Loyalty tier
approved explicit list
```

Notification should not own complex customer segmentation logic.

---

# 197. Broadcast Safety Controls

Require for large Marketing send:

```text
recipient estimate
template preview
category
schedule
approval
cancel/pause capability
rate control
audit
```

---

# 198. Broadcast Approval

Large send may require:

```text
creator
approver
```

separation.

Exact threshold:

```text
TBD_NOTIFICATION_POLICY
```

---

# 199. Test Send

Admin endpoint may support:

```text
POST /api/v1/admin/notifications/templates/{id}/test
```

to an approved test recipient.

---

# 200. Broadcast Cancellation

Cancellation stops:

```text
unsent recipients
```

but cannot undo provider-accepted sends.

---

# 201. Provider Rate Limits

Workers must honor:

```text
quota
rate limit
burst limit
```

---

# 202. Rate-Control Mechanisms

Possible:

```text
token bucket
bounded concurrency
queue throughput control
provider-specific limiter
```

---

# 203. Backpressure

If provider slows:

```text
queue/backlog grows
```

System should:

```text
reduce concurrency as needed
avoid DB overload
surface backlog age/count
protect priority traffic
```

---

# 204. Transactional Priority Protection

Security/Transactional traffic must not sit behind a massive Marketing backlog.

---

# 205. Queue Separation

Possible:

```text
notification.security
notification.transactional
notification.marketing
```

or separate worker pools/priority queues.

Final topology:

```text
TBD_PLATFORM_POLICY
```

---

# 206. Provider Routing

Future multi-provider routing may consider:

```text
provider health
cost
region
delivery success
```

Do not overbuild initially.

---

# 207. Provider Failover Safety

Fail over only when:

```text
first provider definitively failed
```

or provider idempotency makes duplicate handling safe.

---

# 208. UNKNOWN and Failover

Do not fail over blindly on:

```text
UNKNOWN
```

because primary provider may already have accepted the message.

---

# 209. Provider Health

Possible state projection:

```text
HEALTHY
DEGRADED
UNAVAILABLE
```

---

# 210. Provider Credentials

Store in:

```text
Vault
Cloud Secret Manager
Kubernetes external secret integration
```

Never commit provider credentials.

---

# 211. Push Credentials

Protect:

```text
service-account private key
OAuth credentials
APNs signing key/certificate
```

---

# 212. Email Credentials

Protect:

```text
SMTP password
provider API key
OAuth client secret
```

---

# 213. SMS Credentials

Protect:

```text
gateway API key
signing secret
sender credentials
```

---

# 214. Provider TLS

Require:

```text
TLS
certificate validation
hostname validation
```

Never disable verification in production troubleshooting.

---

# 215. Customer Notification APIs

Possible:

```text
GET  /api/v1/notifications
GET  /api/v1/notifications/{id}
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/read-all
```

---

# 216. Device APIs

Possible:

```text
POST   /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{deviceId}
```

---

# 217. Preference APIs

If owned here:

```text
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences
```

---

# 218. Internal Send Contract

Potential gRPC:

```proto
service NotificationService {
  rpc SendNotification(SendNotificationRequest)
      returns (SendNotificationResponse);

  rpc ScheduleNotification(ScheduleNotificationRequest)
      returns (ScheduleNotificationResponse);
}
```

---

# 219. SendNotification Request

Possible fields:

```text
notification_type
recipient_id
template_code
language optional
variables
business_reference
deduplication_key
priority optional
channels optional
expires_at optional
```

---

# 220. SendNotification Response

Meaning:

```text
accepted/enqueued
```

Possible:

```text
notification_id
status
```

Do not imply provider delivery.

---

# 221. Generic Public Send API

Do not expose:

```text
POST /send-notification
```

to end users.

Business services call trusted internal contract.

---

# 222. Notification Error Catalog

Candidates:

```text
NOTIFICATION_NOT_FOUND
NOTIFICATION_DUPLICATE
NOTIFICATION_EXPIRED
NOTIFICATION_CANCELLED
TEMPLATE_NOT_FOUND
TEMPLATE_NOT_PUBLISHED
TEMPLATE_VARIABLE_MISSING
TEMPLATE_RENDER_FAILED
CHANNEL_NOT_SUPPORTED
RECIPIENT_NOT_REACHABLE
RECIPIENT_OPTED_OUT
DEVICE_TOKEN_INVALID
PROVIDER_UNAVAILABLE
PROVIDER_RATE_LIMITED
PROVIDER_AUTH_FAILED
DELIVERY_FAILED
SCHEDULE_INVALID
IDEMPOTENCY_KEY_REUSED
```

---

# 223. Error Mapping

Examples:

| Error | HTTP / gRPC |
|---|---|
| NOTIFICATION_NOT_FOUND | 404 / NOT_FOUND |
| NOTIFICATION_DUPLICATE | 409 / ALREADY_EXISTS |
| TEMPLATE_NOT_FOUND | 404 / NOT_FOUND |
| RECIPIENT_OPTED_OUT | 422 / FAILED_PRECONDITION |
| PROVIDER_UNAVAILABLE | 503 / UNAVAILABLE |
| PROVIDER_RATE_LIMITED | 429 / RESOURCE_EXHAUSTED |
| SCHEDULE_INVALID | 400 / INVALID_ARGUMENT |

---

# 224. Notification Events Published

Candidates:

```text
NotificationCreated
NotificationSent
NotificationDelivered
NotificationFailed
NotificationOpened
DeviceTokenDisabled
```

Publish only if real consumers need them.

---

# 225. NotificationSent Event

Possible:

```text
notification_id
recipient_id
notification_type
channel
provider
sent_at
```

Avoid full message content.

---

# 226. NotificationFailed Event

Possible:

```text
notification_id
channel
failure_category
retryable
attempt_count
```

---

# 227. Events Consumed

Likely:

```text
OrderAccepted
OrderReady
OrderCompleted
OrderCancelled
PaymentFailed
WalletTopUpCompleted
MissionCompleted
RewardAssigned
PointsExpiringSoon
RewardExpiringSoon
PasswordResetRequested
SecurityAlertRequested
```

---

# 228. Clean Architecture Layout

Recommended:

```text
notification-service/
├── domain/
│   ├── notification/
│   ├── template/
│   ├── preference/
│   ├── device/
│   ├── delivery/
│   ├── schedule/
│   ├── broadcast/
│   ├── event/
│   ├── policy/
│   └── exception/
├── application/
│   ├── create/
│   ├── render/
│   ├── route/
│   ├── send/
│   ├── retry/
│   ├── schedule/
│   ├── inbox/
│   ├── preference/
│   ├── device/
│   ├── broadcast/
│   └── reconciliation/
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   ├── kafka/
│   ├── webhook/
│   └── scheduler/
├── adapter/out/
│   ├── persistence/
│   ├── push/
│   ├── email/
│   ├── sms/
│   ├── customer/
│   ├── redis/
│   └── kafka/
└── config/
```

---

# 229. Input Ports

Examples:

```text
CreateNotificationUseCase
ScheduleNotificationUseCase
SendNotificationUseCase
RetryNotificationUseCase
ListInboxUseCase
GetNotificationDetailUseCase
MarkNotificationReadUseCase
MarkAllReadUseCase
RegisterDeviceUseCase
UnregisterDeviceUseCase
GetPreferencesUseCase
UpdatePreferencesUseCase
PublishTemplateUseCase
TestTemplateUseCase
CreateBroadcastUseCase
ApproveBroadcastUseCase
CancelBroadcastUseCase
ReconcileNotificationUseCase
```

---

# 230. Output Ports

Examples:

```text
NotificationRepositoryPort
TemplateRepositoryPort
PreferencePort
DevicePort
PushProviderPort
EmailProviderPort
SmsProviderPort
InAppPort
OutboxPort
ProcessedEventPort
ClockPort
RecipientContactPort
ProviderStatusPort
```

---

# 231. CreateNotificationUseCase

```text
validate request/event
      ↓
deduplicate
      ↓
load notification policy
      ↓
resolve preferences
      ↓
choose channels
      ↓
resolve template version
      ↓
resolve language
      ↓
validate/render/snapshot
      ↓
persist notification/channels
      ↓
mark READY or SCHEDULED
      ↓
return notification_id
```

---

# 232. SendNotificationUseCase

```text
claim READY channel
      ↓
load destination
      ↓
recheck preference
      ↓
check expiry
      ↓
call provider
      ↓
map result
      ↓
persist delivery attempt/status
      ↓
retry/finalize
```

---

# 233. RetryNotificationUseCase

```text
find retryable unit
      ↓
check max attempts
      ↓
check expiry
      ↓
check provider health
      ↓
claim
      ↓
send
```

---

# 234. ScheduleNotificationUseCase

```text
validate future time
      ↓
apply timezone/quiet-hour policy
      ↓
persist SCHEDULED
```

---

# 235. RegisterDeviceUseCase

```text
authenticate customer
      ↓
validate platform/token
      ↓
hash token
      ↓
encrypt token
      ↓
upsert ownership
      ↓
mark ACTIVE
```

---

# 236. Device Reassignment Use Case

If token belongs to different authenticated user:

```text
deactivate previous association
activate current association
```

according to approved mobile/session semantics.

---

# 237. UnregisterDeviceUseCase

```text
authorize ownership
      ↓
mark INACTIVE
```

---

# 238. PublishTemplateUseCase

```text
validate template
      ↓
validate required variables
      ↓
validate channel limits
      ↓
validate actions/deep links
      ↓
create immutable version
      ↓
set active version
      ↓
audit
```

---

# 239. Template Preview

Admin can preview:

```text
language
channel
sample variables
action/deep link
```

without publishing.

---

# 240. Template Fixtures

Each template may keep fixture variables for:

```text
CI
preview
test send
```

---

# 241. Template CI Validation

Validate:

```text
all required variables referenced correctly
no unknown variable
all required localizations present or fallback permitted
render succeeds
payload within provider limits
deep-link action valid
```

---

# 242. Admin Notification APIs

Possible:

```text
GET  /api/v1/admin/notifications/templates
POST /api/v1/admin/notifications/templates
PATCH /api/v1/admin/notifications/templates/{id}
POST /api/v1/admin/notifications/templates/{id}/publish
POST /api/v1/admin/notifications/templates/{id}/test
GET  /api/v1/admin/notifications/history
GET  /api/v1/admin/notifications/{id}
POST /api/v1/admin/notifications/broadcasts
POST /api/v1/admin/notifications/broadcasts/{id}/approve
POST /api/v1/admin/notifications/broadcasts/{id}/cancel
```

---

# 243. Admin Permissions

Possible:

```text
notification.read
notification.template.manage
notification.template.publish
notification.broadcast.create
notification.broadcast.approve
notification.retry
notification.provider.manage
notification.preference.override
```

---

# 244. Broadcast Risk

Broadcast may affect very large customer populations.

Require:

```text
preview
audience estimate
approval
schedule
cancel
rate control
audit
```

---

# 245. Notification Audit

Audit:

```text
template publish
template archive
preference admin override
broadcast create
broadcast approve
broadcast cancel
manual retry
provider configuration change
```

---

# 246. Preference Audit

Consent-sensitive preference changes may capture:

```text
source
timestamp
actor
old/new state
```

---

# 247. Notification Security Risks

Primary:

```text
wrong recipient
template injection
PII leakage
device token theft
provider credential leakage
notification spam
admin broadcast abuse
malicious deep links
fake provider callback
```

---

# 248. Recipient Authorization

Trusted business services submit:

```text
recipient_id
```

under service authentication.

Public clients may not request arbitrary messages to other customers.

---

# 249. Template Variable Allowlist

Each template declares accepted variables.

Reject unexpected untrusted content where appropriate.

---

# 250. HTML Sanitization

Rich email configuration must be:

```text
sanitized
restricted to approved markup
```

---

# 251. SSRF Protection

If image references are supported:

```text
do not server-fetch arbitrary user-supplied URLs
```

Use trusted CDN/reference allowlist.

---

# 252. Deep-Link Validation

Allow-list:

```text
action
parameter schema
```

Do not execute arbitrary URI schemes.

---

# 253. Provider Callback Security

Require:

```text
provider signature/token verification
replay protection where supported
provider_event_id dedupe
```

---

# 254. Secret Redaction

Never log:

```text
provider private key
SMTP password
SMS API key
raw device token
OTP
password-reset secret
```

---

# 255. Reconciliation Goals

Detect:

```text
SENDING stuck too long
provider accepted but internal status missing
provider callback mismatches
invalid push token still active
retryable attempt past retry time
scheduled row overdue
broadcast recipient count mismatch
unknown delivery outcome unresolved
```

---

# 256. Delivery Reconciliation

If provider supports lookup:

```text
provider_reference
```

may be queried for critical categories.

Not all providers support this.

---

# 257. Stuck Notification Detection

Example:

```text
status = SENDING
updated_at < now - threshold
```

Recovery may:

```text
query provider
retry with idempotency
mark UNKNOWN
```

---

# 258. Reconciliation Run Model

Possible:

```text
id
type
scope
started_at
completed_at
status
records_checked
mismatch_count
```

---

# 259. Reconciliation Mismatch

Possible:

```text
id
run_id
notification_id
channel_id
mismatch_type
expected_value
actual_value
provider_reference
status
detected_at
resolved_at
resolution_note
```

---

# 260. No Blind Historical Resend

Reconciliation/restore must never assume:

```text
missing internal SENT state
=
safe to resend
```

Resolve provider outcome where possible.

---

# 261. Notification Metrics — Business

Potential:

```text
notification_created_total
notification_sent_total
notification_delivered_total
notification_failed_total
notification_opened_total
in_app_unread_total
```

---

# 262. Metrics — Delivery

Potential:

```text
delivery_attempt_total
delivery_retry_total
delivery_final_failure_total
provider_unknown_total
provider_latency
```

---

# 263. Metrics — Provider

Per provider/channel:

```text
request rate
acceptance rate
failure rate
timeout rate
429 rate
auth failure rate
invalid destination rate
```

---

# 264. Metrics — Queue

```text
ready_backlog
scheduled_backlog
retry_backlog
oldest_ready_age
oldest_retry_age
```

---

# 265. Metrics — Devices

```text
active_device_total
invalid_token_total
token_disabled_total
```

Avoid recipient IDs as labels.

---

# 266. Metrics — Templates

```text
template_render_failure_total
template_missing_total
localization_fallback_total
```

---

# 267. Notification SLIs

Potential:

```text
notification ingestion availability
P95 create latency
event-to-notification latency
notification-to-provider-accepted latency
transactional backlog age
provider success rate
retry recovery rate
inbox API availability
```

---

# 268. SLO Targets

Remain:

```text
TBD_SLO
```

until measured/approved.

---

# 269. Alerts

Alert on:

```text
transactional backlog age
security backlog
provider unavailable
provider auth failure
429 spike
retry backlog
invalid token spike
template render failure
duplicate-notification anomaly
scheduled backlog
reconciliation mismatch
PostgreSQL saturation
Kafka consumer lag
```

---

# 270. Dashboard

Show:

```text
created/sent/failed by type
provider health
Push/Email/SMS rates
transactional vs marketing queue
retry backlog
scheduled backlog
template errors
invalid tokens
in-app unread volume
consumer lag
reconciliation mismatches
```

---

# 271. Structured Logging

Useful fields:

```text
notification_id
recipient_id if policy permits
notification_type
category
channel
provider
attempt_number
dedupe_key hash/reference
event_id
business_reference
correlation_id
result
error_category
```

---

# 272. Logging Privacy

Never log:

```text
raw push token
full OTP
password reset token
provider credential
sensitive rendered content
```

---

# 273. Tracing

Trace:

```text
Kafka/command ingestion
→ policy resolution
→ dedupe
→ template render
→ persistence
→ delivery worker
→ provider adapter
→ result persistence
```

---

# 274. Provider Span Attributes

Safe examples:

```text
provider
channel
notification_type
result
retryable
```

Do not add destination value.

---

# 275. Failure Mode — Push Provider Down

Expected:

```text
durable backlog
retry/backoff
provider-health alert
In-App still available if policy created it
```

Do not lose Notification record.

---

# 276. Failure Mode — Email Provider Down

Security flow may:

```text
retry
use approved SMS fallback
```

Transactional/non-critical may wait.

---

# 277. Failure Mode — SMS Provider Down

Use:

```text
circuit breaker
backoff
secondary provider only if explicitly supported
```

Avoid retry flood.

---

# 278. Failure Mode — Redis Down

Core processing continues with:

```text
PostgreSQL + Kafka
```

Cache/rate-limit degradation policy must be explicit.

---

# 279. Failure Mode — PostgreSQL Down

Do not safely send normal durable notifications without persistence/dedupe.

Preferred:

```text
fail ingestion / allow Kafka backlog
```

until DB recovers.

---

# 280. Failure Mode — Kafka Down

Event-driven notifications wait in producer Outbox/broker recovery path.

Direct internal security command may remain available if designed.

---

# 281. Failure Mode — Template Missing

Transactional message should:

```text
fail + alert
```

or use explicit preconfigured fallback.

Never send blank malformed message.

---

# 282. Failure Mode — Stale Preference

For Marketing:

```text
fail closed / delay
```

is safer when consent state is unknown.

Mandatory transactional/security may follow explicit exception policy.

---

# 283. Required Runbooks

```text
Push provider outage
Email provider outage
SMS provider outage
Provider authentication failure
Transactional backlog
Invalid token spike
Template render failure
Duplicate notifications
Wrong-recipient incident
Broadcast incident
Retry backlog
Unknown provider outcome
```

---

# 284. Provider Auth Failure Runbook

```text
confirm credential expiry/revocation
rotate secret/key
test provider health
never disable TLS verification
replay backlog safely
```

---

# 285. Duplicate Notification Runbook

```text
identify dedupe key
inspect source event IDs
check processed_events
check business dedupe constraint
check worker crash timing
check provider idempotency
add regression test
```

---

# 286. Wrong Recipient Runbook

High severity:

```text
stop affected flow
identify recipient-mapping source
disable policy/template if needed
assess exposed content
notify security/privacy response
fix ownership/mapping
add tests
```

---

# 287. Broadcast Incident Runbook

```text
pause/cancel unsent work
identify audience rule
measure already sent volume
assess content
record incident
improve approval/preview guard
```

---

# 288. Backup Scope

Back up:

```text
notifications
channel records
delivery attempts
templates
template versions
localizations
preferences/projection
device registrations
in-app history
broadcast definitions
processed events
outbox
reconciliation
```

---

# 289. Restore Procedure

After restore:

```text
rebuild caches
reconcile SENDING/UNKNOWN
do not blindly resend historical notifications
restore token state
repair outbox
review scheduled notifications against current time
```

---

# 290. Restore Risks

Old restore may:

```text
resend delivered message
reactivate invalid token
resurrect cancelled schedule
lose read status
```

---

# 291. Restore Protections

Use:

```text
business dedupe keys
provider references
provider idempotency
notification expiry
processed event IDs
reconciliation
```

---

# 292. Disaster Recovery

Define:

```text
RPO
RTO
Kafka replay
dedupe retention
provider idempotency behavior
scheduled-message recovery
cache rebuild
secret recovery
```

---

# 293. Flyway Migration Plan

Suggested:

```text
V1__create_notifications.sql
V2__create_notification_channels.sql
V3__create_delivery_attempts.sql
V4__create_templates.sql
V5__create_template_versions.sql
V6__create_template_localizations.sql
V7__create_preferences.sql
V8__create_devices.sql
V9__create_in_app_notifications.sql
V10__create_notification_idempotency.sql
V11__create_processed_events.sql
V12__create_reconciliation_tables.sql
V13__create_outbox.sql
V14__create_broadcast_tables.sql
V15__create_provider_callbacks.sql
```

Use repository-appropriate numbering.

---

# 294. Legacy Notification Sources

Possible existing sources:

```text
push history
notification table
email logs
device token table
```

---

# 295. Migration Principle

Preserve useful business/support state.

Do not migrate old provider payload noise into active retry infrastructure.

---

# 296. Device Token Migration

Validate:

```text
duplicate token
inactive token
old customer mapping
invalid format
last seen
platform
provider
```

before activation.

---

# 297. Template Migration

Map:

```text
legacy title/body
language
notification type
deep link/action
```

to versioned template model.

---

# 298. Push History Migration

Historical push logs may remain Support/Analytics history.

Do not convert old history into active sends/retries.

---

# 299. Migration Reconciliation

Compare:

```text
active device count
template count
recent notification count
in-app unread count if migrated
```

---

# 300. Testing Strategy

Required:

```text
Domain
Template
Localization
Preferences
Deduplication
Scheduling
Push
Email
SMS
In-App
Retry
Provider callbacks
Unknown outcome
Concurrency
Kafka
Security
Load
Failure
Migration
Reconciliation
Backup/Restore
```

---

# 301. Domain Tests

Test:

```text
status transitions
expiry
schedule
cancel
priority
channel policy
aggregate status
```

---

# 302. Deduplication Tests

Test:

```text
same event twice
same business key concurrently
same key different recipient
same business reference different notification type
repeatable reminder with different window
restore replay
```

---

# 303. Template Tests

Test:

```text
valid variables
missing required variable
unknown variable
HTML escaping
payload length
action/deep link
immutable version behavior
```

---

# 304. Localization Tests

Test:

```text
English
Khmer
missing Khmer fallback
missing all localizations
preferred language change
explicit request language
```

---

# 305. Preference Tests

Test:

```text
Marketing opt-out
Transactional allowed
Security mandatory
quiet hours
preference changed before scheduled send
unknown/stale preference policy
```

---

# 306. Push Tests

Test:

```text
valid token
invalid token
unregistered token
provider timeout
provider rate limit
provider auth failure
multi-device
partial success
collapse key where used
```

---

# 307. Email Tests

Test:

```text
valid email
hard bounce
temporary failure
template HTML
provider auth failure
marketing unsubscribe behavior if enabled
```

---

# 308. SMS Tests

If SMS is in scope:

```text
valid send
provider timeout
invalid number
delivery receipt
rate limit
fallback policy
```

---

# 309. In-App Tests

Test:

```text
create
list
detail
mark read
read all
unread count
authorization
retention
action validation
```

---

# 310. Scheduling Tests

```text
future schedule
due schedule
expired before send
quiet-hour shift
duplicate scheduler workers
cancel before send
preference change before send
```

---

# 311. Retry Tests

```text
retryable failure
final failure
max attempts
expiry before retry
backoff
jitter bounds
worker restart
```

---

# 312. Worker Concurrency Tests

Multiple workers claim the same queue.

Expected:

```text
one active provider send per delivery unit
```

subject to unavoidable provider-unknown crash edge case.

---

# 313. Provider UNKNOWN Tests

Simulate:

```text
provider accepted
response lost
worker crash
```

Verify:

```text
UNKNOWN strategy
provider reference/idempotency lookup
no blind failover
```

---

# 314. Kafka Tests

Test consumers:

```text
OrderReady
OrderCancelled
MissionCompleted
RewardAssigned
PointsExpiringSoon
WalletTopUpCompleted if policy exists
duplicate event
consumer retry
DLQ
replay
```

---

# 315. Security Tests

Verify:

```text
customer cannot read another inbox
device token ownership
generic public send unavailable
template injection blocked
deep-link injection blocked
admin broadcast RBAC
callback authentication
secret redaction
```

---

# 316. Load Tests

Scenarios:

```text
order-status burst
mission/reward event burst
many device fan-outs
retry backlog
large Marketing broadcast
scheduled send wave
```

---

# 317. Transactional Priority Load Test

Create large:

```text
Marketing backlog
```

while sending:

```text
ORDER_READY
SECURITY_ALERT
```

Verify critical traffic remains within approved SLO.

---

# 318. Provider Rate-Limit Test

Simulate:

```text
HTTP 429
```

Verify:

```text
backoff
no hot retry loop
stable queue
correct rate limiter
```

---

# 319. Failure Tests

Inject:

```text
PostgreSQL down
Kafka unavailable
Redis unavailable
provider timeout
provider auth revoked
scheduler crash
worker crash after provider acceptance
callback duplicated
```

---

# 320. Restore Replay Test

Restore older DB snapshot and replay source events.

Verify:

```text
no duplicate business notifications
no blind resend of UNKNOWN/SENT
expired messages remain unsent
cancelled broadcast does not restart
```

---

# 321. Definition of Done — Transactional Notification

- [ ] Source event/command defined.
- [ ] Business dedupe key defined.
- [ ] Template/version defined.
- [ ] Localization defined.
- [ ] Channel policy defined.
- [ ] Preference policy defined.
- [ ] Expiry defined.
- [ ] Provider adapter implemented.
- [ ] Retry/failure mapping defined.
- [ ] UNKNOWN behavior defined.
- [ ] Metrics/alerts.
- [ ] Tests.

---

# 322. Definition of Done — Template

- [ ] Template code.
- [ ] Notification type.
- [ ] Channel.
- [ ] English/Khmer content.
- [ ] Required variables.
- [ ] Content limits.
- [ ] Action/deep link.
- [ ] Preview fixtures.
- [ ] Versioning.
- [ ] Publish audit.
- [ ] Tests.

---

# 323. Definition of Done — Push Device

- [ ] Authenticated registration.
- [ ] Secure token storage.
- [ ] Token hash uniqueness.
- [ ] Reassignment behavior.
- [ ] Logout/unregister.
- [ ] Invalid-token handling.
- [ ] Multi-device policy.
- [ ] Tests.

---

# 324. Definition of Done — In-App

- [ ] Durable inbox row.
- [ ] Customer authorization.
- [ ] List/detail.
- [ ] Read/read-all.
- [ ] Unread count.
- [ ] Action validation.
- [ ] Retention.
- [ ] Tests.

---

# 325. Definition of Done — Retry

- [ ] Retryable/final mapping.
- [ ] Max attempts.
- [ ] Backoff.
- [ ] Jitter.
- [ ] Expiry deadline.
- [ ] Worker locking.
- [ ] UNKNOWN handling.
- [ ] Provider idempotency.
- [ ] Metrics.
- [ ] Tests.

---

# 326. Definition of Done — Broadcast

- [ ] Audience source.
- [ ] Category.
- [ ] Template.
- [ ] Recipient estimate.
- [ ] Approval if required.
- [ ] Schedule.
- [ ] Rate limiting.
- [ ] Pause/cancel.
- [ ] Priority isolation.
- [ ] Metrics.
- [ ] Audit.
- [ ] Tests.

---

# 327. Ownership Review Checklist

- [ ] Notification owns delivery.
- [ ] Business services own business facts.
- [ ] Identity owns reset/OTP semantics.
- [ ] Customer/Identity owns authoritative contact identity unless explicitly delegated.
- [ ] Loyalty owns reward/points.
- [ ] Mission owns mission completion.
- [ ] Provider details stay behind adapters.

---

# 328. Reliability Checklist

- [ ] Durable Notification.
- [ ] Processed-event idempotency.
- [ ] Business dedupe.
- [ ] Retry.
- [ ] Expiry.
- [ ] UNKNOWN outcome strategy.
- [ ] Worker concurrency.
- [ ] Provider idempotency where possible.
- [ ] Backpressure.
- [ ] Priority isolation.
- [ ] Restore/replay safety.

---

# 329. Content Checklist

- [ ] Versioned templates.
- [ ] English/Khmer.
- [ ] Fallback.
- [ ] Variable contract.
- [ ] Escaping/sanitization.
- [ ] Payload limits.
- [ ] Action/deep-link validation.
- [ ] Snapshot/render timing.
- [ ] Historical explainability.

---

# 330. Data Review Checklist

- [ ] Notification IDs stable.
- [ ] Dedupe constraint.
- [ ] Delivery attempts retained.
- [ ] Template versions immutable.
- [ ] Device tokens securely stored.
- [ ] Preference ownership clear.
- [ ] In-App indexes.
- [ ] Processed events.
- [ ] Outbox.
- [ ] Reconciliation.
- [ ] Retention.

---

# 331. Contract Review Checklist

- [ ] Event-to-policy mapping.
- [ ] Internal Send contract.
- [ ] Schedule contract.
- [ ] Inbox APIs.
- [ ] Device registration.
- [ ] Preferences if owned here.
- [ ] Admin template APIs.
- [ ] Stable errors.
- [ ] Accepted-vs-delivered semantics.
- [ ] Retry/failure semantics.

---

# 332. Security Review Checklist

- [ ] Provider secrets externalized.
- [ ] Raw device tokens not logged.
- [ ] OTP/reset token not logged.
- [ ] Template variables escaped.
- [ ] Rich HTML sanitized.
- [ ] Admin broadcast restricted.
- [ ] Customer inbox isolated.
- [ ] Deep links allow-listed.
- [ ] Provider callbacks authenticated.
- [ ] Marketing consent enforced.
- [ ] Wrong-recipient controls tested.

---

# 333. Operations Review Checklist

- [ ] Provider metrics.
- [ ] READY backlog.
- [ ] Retry backlog.
- [ ] Scheduled backlog.
- [ ] Invalid token rate.
- [ ] Template failures.
- [ ] Consumer lag.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Reconciliation.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 334. Production Readiness Checklist

Before production:

- [ ] Duplicate-event tests pass.
- [ ] Business-dedupe concurrency tests pass.
- [ ] Worker concurrency tests pass.
- [ ] Provider UNKNOWN behavior tested.
- [ ] Push provider failure tested.
- [ ] Invalid-token cleanup tested.
- [ ] Template fallback tested.
- [ ] Khmer/English localization tested.
- [ ] Customer inbox authorization tested.
- [ ] Marketing opt-out tested if Marketing enabled.
- [ ] Quiet hours tested if enabled.
- [ ] Transactional priority under Marketing load tested if Broadcast enabled.
- [ ] Scheduler recovery tested.
- [ ] Provider auth rotation tested.
- [ ] Callback authentication tested if callbacks enabled.
- [ ] Backup/restore tested.
- [ ] Replay/restore duplicate prevention tested.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 335. Initial Implementation Order

Adapted directly from the source:

```text
1. Bootstrap notification-service
2. notification_db + Flyway
3. Notification aggregate/state machine
4. Notification persistence
5. Template model
6. Template versioning
7. English/Khmer localization
8. Kafka event consumer framework
9. Processed-event idempotency
10. Business deduplication
11. Policy registry
12. In-App notification
13. Inbox APIs
14. Device registration
15. Secure token storage
16. Push provider adapter
17. Delivery worker
18. Retry/failure mapping
19. UNKNOWN-outcome recovery
20. Order notifications
21. Mission/Reward notifications
22. Preference projection/enforcement
23. Scheduling/expiry worker
24. Points/Reward expiry reminders
25. Provider callbacks if supported
26. Email if required
27. SMS if required
28. Admin template tooling
29. Broadcast if required
30. Backpressure/priority isolation
31. Reconciliation
32. Metrics/alerts/runbooks
33. Legacy migration
34. Full load/failure/security tests
35. Production readiness review
36. Handoff to Phase 19 Integration / ACL
```

---

# 336. Minimum Production-Capable Notification Scope

Required by source:

```text
Durable Notification
Template + immutable version
English/Khmer localization
Kafka event ingestion
Processed-event idempotency
Business deduplication
Push
In-App
Device registration
Secure device tokens
Retry
Provider failure mapping
Order notifications
Mission/Reward notifications
Notification history
Metrics/alerts
```

---

# 337. Conditional Scope

Add only when required:

```text
Email
SMS
Broadcast
Quiet Hours
Advanced Preferences
Multi-provider routing
```

---

# 338. MVP Notification Policies

Minimum policy mappings should cover at least the active product flows such as:

```text
ORDER_ACCEPTED
ORDER_READY
ORDER_COMPLETED
ORDER_CANCELLED
MISSION_COMPLETED
REWARD_ASSIGNED
```

Only add others actually produced/required.

---

# 339. Conditional Password Reset

If Identity requires Notification Service for password reset:

```text
PASSWORD_RESET
```

must be implemented with Email/SMS channel according to Phase 04 security decision.

---

# 340. Conditional Expiry Reminders

If product launches:

```text
POINTS_EXPIRING
REWARD_EXPIRING
```

implement scheduled/domain-event reminder policy.

---

# 341. Conditional Marketing

If Marketing Broadcast is not required now:

```text
do not block Phase 19
```

on Broadcast implementation.

---

# 342. Phase 18 Work Breakdown

Suggested tickets:

```text
NOT-001 Bootstrap notification-service
NOT-002 Create notification_db
NOT-003 Add Flyway baseline
NOT-004 Implement Notification aggregate
NOT-005 Implement NotificationStatus
NOT-006 Implement NotificationType
NOT-007 Implement NotificationCategory
NOT-008 Implement NotificationPriority
NOT-009 Implement Channel model
NOT-010 Create notifications table
NOT-011 Create notification_channels
NOT-012 Create delivery_attempts
NOT-013 Create template tables
NOT-014 Create preference table/projection
NOT-015 Create device table
NOT-016 Create in_app_notifications
NOT-017 Create notification_idempotency
NOT-018 Create processed_events
NOT-019 Create Outbox
NOT-020 Create reconciliation tables
NOT-021 Implement Notification state machine
NOT-022 Implement aggregate status derivation
NOT-023 Implement creation transaction
NOT-024 Implement ProcessedEvent Inbox
NOT-025 Implement business dedupe constraint
NOT-026 Implement request-hash idempotency for direct commands
NOT-027 Implement Notification Policy Registry
NOT-028 Implement policy version/audit hook
NOT-029 Implement Template aggregate
NOT-030 Implement template code validation
NOT-031 Implement template lifecycle
NOT-032 Implement immutable template versions
NOT-033 Implement required-variable contract
NOT-034 Implement variable allowlist
NOT-035 Implement safe template rendering
NOT-036 Implement HTML escaping/sanitization
NOT-037 Implement provider payload limits
NOT-038 Implement English localization
NOT-039 Implement Khmer localization
NOT-040 Implement language fallback
NOT-041 Implement template preview
NOT-042 Implement template fixtures
NOT-043 Implement template CI validation
NOT-044 Implement In-App creation
NOT-045 Implement inbox list/detail
NOT-046 Implement mark-read
NOT-047 Implement read-all
NOT-048 Implement unread count
NOT-049 Implement In-App action model
NOT-050 Implement deep-link allowlist
NOT-051 Implement device registration
NOT-052 Implement token hashing
NOT-053 Implement token encryption
NOT-054 Implement token uniqueness
NOT-055 Implement device reassignment
NOT-056 Implement device unregister
NOT-057 Implement invalid-token disable
NOT-058 Implement multi-device policy
NOT-059 Implement PushProviderPort
NOT-060 Implement FCM/APNs adapter as selected
NOT-061 Implement provider result mapping
NOT-062 Implement channel delivery claim
NOT-063 Implement SKIP LOCKED worker
NOT-064 Implement DeliveryAttempt persistence
NOT-065 Implement retry classification
NOT-066 Implement bounded retry
NOT-067 Implement backoff/jitter
NOT-068 Implement retry deadline
NOT-069 Implement provider idempotency key
NOT-070 Implement UNKNOWN state
NOT-071 Implement UNKNOWN recovery hook
NOT-072 Implement push collapse key if approved
NOT-073 Implement sensitive-payload protection
NOT-074 Implement OrderAccepted mapping if required
NOT-075 Implement OrderReady notification
NOT-076 Implement OrderCompleted notification
NOT-077 Implement OrderCancelled notification
NOT-078 Implement MissionCompleted notification
NOT-079 Implement RewardAssigned notification
NOT-080 Resolve Mission-vs-Reward duplicate-message policy
NOT-081 Implement PointsExpiring reminder if required
NOT-082 Implement RewardExpiring reminder if required
NOT-083 Implement preference projection
NOT-084 Consume preference/customer events
NOT-085 Implement category/channel enforcement
NOT-086 Implement Marketing opt-out
NOT-087 Implement mandatory-notification policy
NOT-088 Implement quiet hours if required
NOT-089 Implement timezone handling
NOT-090 Implement send-time preference recheck
NOT-091 Implement scheduling worker
NOT-092 Implement scheduled expiry
NOT-093 Implement scheduler concurrency
NOT-094 Implement EmailProviderPort if required
NOT-095 Implement Email adapter if required
NOT-096 Implement Email bounce callback
NOT-097 Implement marketing unsubscribe if required
NOT-098 Implement SmsProviderPort if required
NOT-099 Implement SMS adapter if required
NOT-100 Implement SMS delivery receipt
NOT-101 Implement provider callback authentication
NOT-102 Implement provider callback idempotency
NOT-103 Implement PasswordReset delivery if required
NOT-104 Implement SecurityAlert notification if required
NOT-105 Implement provider credentials via Secret Manager
NOT-106 Implement provider TLS checks
NOT-107 Implement internal SendNotification contract
NOT-108 Implement ScheduleNotification contract
NOT-109 Implement customer Notification APIs
NOT-110 Implement admin template list/create/update
NOT-111 Implement template publish
NOT-112 Implement template test-send
NOT-113 Implement Notification history admin
NOT-114 Implement manual retry permission/API
NOT-115 Implement notification.read
NOT-116 Implement template.manage
NOT-117 Implement template.publish
NOT-118 Implement broadcast permissions
NOT-119 Implement Notification audit
NOT-120 Implement preference audit
NOT-121 Implement Broadcast definition if required
NOT-122 Implement audience snapshot integration
NOT-123 Implement Broadcast fan-out worker
NOT-124 Implement Broadcast approval
NOT-125 Implement Broadcast pause/cancel
NOT-126 Implement Broadcast rate control
NOT-127 Implement priority queue/worker separation
NOT-128 Implement provider-health projection
NOT-129 Implement backpressure controls
NOT-130 Implement delivery reconciliation
NOT-131 Implement stuck-SENDING detector
NOT-132 Implement invalid-device reconciliation
NOT-133 Implement retry-overdue reconciliation
NOT-134 Implement scheduled-overdue reconciliation
NOT-135 Implement Broadcast reconciliation
NOT-136 Implement business metrics
NOT-137 Implement provider metrics
NOT-138 Implement backlog metrics
NOT-139 Implement device metrics
NOT-140 Implement template metrics
NOT-141 Implement OpenTelemetry tracing
NOT-142 Implement Notification dashboard
NOT-143 Implement alerts
NOT-144 Write Push outage runbook
NOT-145 Write Email outage runbook if needed
NOT-146 Write SMS outage runbook if needed
NOT-147 Write provider-auth runbook
NOT-148 Write transactional-backlog runbook
NOT-149 Write invalid-token runbook
NOT-150 Write template-failure runbook
NOT-151 Write duplicate-notification runbook
NOT-152 Write wrong-recipient incident runbook
NOT-153 Write Broadcast incident runbook
NOT-154 Write retry-backlog runbook
NOT-155 Write UNKNOWN-outcome runbook
NOT-156 Implement backup procedure
NOT-157 Implement restore procedure
NOT-158 Implement DR procedure
NOT-159 Prepare legacy device-token migration
NOT-160 Prepare legacy template migration
NOT-161 Prepare push-history migration
NOT-162 Run migration reconciliation
NOT-163 Implement domain tests
NOT-164 Implement dedupe tests
NOT-165 Implement template tests
NOT-166 Implement localization tests
NOT-167 Implement preference tests
NOT-168 Implement Push tests
NOT-169 Implement In-App tests
NOT-170 Implement scheduling tests
NOT-171 Implement retry tests
NOT-172 Implement worker concurrency tests
NOT-173 Implement UNKNOWN outcome tests
NOT-174 Implement Kafka tests
NOT-175 Implement security tests
NOT-176 Implement load tests
NOT-177 Implement transactional-priority load test
NOT-178 Implement provider rate-limit test
NOT-179 Implement failure tests
NOT-180 Implement restore/replay tests
NOT-181 Implement Email tests if required
NOT-182 Implement SMS tests if required
NOT-183 Implement Broadcast tests if required
NOT-184 Complete ADRs/policy freeze
NOT-185 Phase 18 exit review
```

---

# 343. Recommended ADRs

```text
ADR-NOT-001 Notification ownership boundary
ADR-NOT-002 Notification status model
ADR-NOT-003 Channel policy model
ADR-NOT-004 Notification category/priority
ADR-NOT-005 Business dedupe key
ADR-NOT-006 Dedupe retention
ADR-NOT-007 Template versioning
ADR-NOT-008 Rendering timing
ADR-NOT-009 Localization fallback
ADR-NOT-010 Preference ownership
ADR-NOT-011 Mandatory notification policy
ADR-NOT-012 Quiet-hour behavior
ADR-NOT-013 Device token ownership
ADR-NOT-014 Multi-device delivery
ADR-NOT-015 Push provider
ADR-NOT-016 Provider idempotency
ADR-NOT-017 Retry policy
ADR-NOT-018 UNKNOWN outcome handling
ADR-NOT-019 Channel fallback
ADR-NOT-020 Deep-link/action model
ADR-NOT-021 Provider callback model
ADR-NOT-022 Priority queue isolation
ADR-NOT-023 Broadcast architecture
ADR-NOT-024 Broadcast approval threshold
ADR-NOT-025 Reconciliation
ADR-NOT-026 Retention
ADR-NOT-027 Legacy migration
```

---

# 344. Phase 18 Policy Freeze Checklist

Before production resolve:

- [ ] Push provider(s).
- [ ] Notification preference authority.
- [ ] Device token authority.
- [ ] Multi-device send behavior.
- [ ] Dedupe-key standard.
- [ ] Dedupe retention.
- [ ] Template rendering timing.
- [ ] Template localization fallback.
- [ ] Required English/Khmer coverage.
- [ ] Notification categories.
- [ ] Mandatory/security policy.
- [ ] Marketing opt-out policy.
- [ ] Quiet hours enabled?
- [ ] Customer timezone source.
- [ ] Default channel mappings.
- [ ] Fallback-channel rules.
- [ ] Provider retry counts.
- [ ] Backoff/jitter.
- [ ] Provider timeout.
- [ ] Notification expiry defaults by type.
- [ ] Provider idempotency-key strategy.
- [ ] UNKNOWN recovery policy.
- [ ] Push collapse-key usage.
- [ ] Contact destination projection/snapshot policy.
- [ ] Deep-link/action allowlist.
- [ ] In-App retention.
- [ ] Delivery-attempt retention.
- [ ] Content snapshot retention.
- [ ] Provider callback authentication.
- [ ] Email enabled?
- [ ] SMS enabled?
- [ ] Password-reset delivery route.
- [ ] Broadcast enabled?
- [ ] Broadcast approval threshold.
- [ ] Queue/worker priority separation.
- [ ] Provider rate limits.
- [ ] Reconciliation frequency.
- [ ] SLOs/alerts.
- [ ] Legacy migration plan.

---

# 345. Acceptance — Ownership

Team can clearly answer:

```text
What does Notification own?
What stays in Ordering?
What stays in Mission/Loyalty?
What stays in Identity?
What stays in Customer?
```

---

# 346. Acceptance — Durable Notification

Once a business event is accepted:

```text
Notification exists durably
```

before any external provider send begins.

---

# 347. Acceptance — Duplicate Event

Replay the same source event:

```text
twice
concurrently
after consumer restart
after restore
```

Expected:

```text
one logical Notification
one business communication according to policy
```

---

# 348. Acceptance — Templates

For a sent message, team can explain:

```text
template code
template version
language
variables
rendered content or deterministic reproduction path
```

---

# 349. Acceptance — Localization

Missing Khmer variant:

```text
uses approved English/default fallback
```

rather than blank message.

---

# 350. Acceptance — Preferences

Marketing opt-out is respected.

Mandatory transactional/security behavior follows approved policy.

---

# 351. Acceptance — Scheduling

Notification does not send:

```text
before scheduled_at
after expires_at
```

---

# 352. Acceptance — Provider Semantics

Team can explain for every provider:

```text
what ACCEPTED means
what SENT means
whether DELIVERED is available
what UNKNOWN means
```

---

# 353. Acceptance — Retry

Retry occurs only for:

```text
retryable failures
within attempt limit
before expiry
```

---

# 354. Acceptance — UNKNOWN

Provider accepted + response lost:

```text
does not become blind duplicate retry/failover
```

Recovery uses provider idempotency/reference where available.

---

# 355. Acceptance — Worker Concurrency

Multiple service replicas do not send the same delivery unit concurrently.

---

# 356. Acceptance — Push Token

Raw token is:

```text
encrypted at rest
not logged
uniquely tracked by hash
deactivated on permanent invalid response
```

---

# 357. Acceptance — Multi-Device

Chosen multi-device policy produces predictable aggregate status and no duplicate worker race.

---

# 358. Acceptance — In-App

Customer can:

```text
list own notifications
read detail
mark read
mark all read
view correct unread count
```

and cannot access another customer's inbox.

---

# 359. Acceptance — Priority Protection

Large Marketing workload does not starve:

```text
ORDER_READY
SECURITY
```

delivery.

---

# 360. Acceptance — Wrong Recipient Protection

Recipient mapping always derives from trusted service/customer identity, never arbitrary public-client input.

---

# 361. Acceptance — Restore

Restoring an older DB snapshot and replaying Kafka does not:

```text
blindly resend historical messages
reactivate invalid devices
reopen cancelled broadcasts
send expired messages
```

---

# 362. Acceptance — Reconciliation

System detects:

```text
stuck SENDING
unresolved UNKNOWN
retry overdue
invalid token still active
provider callback mismatch
scheduled overdue
broadcast count mismatch
```

---

# 363. Acceptance — Operations

Operators can answer:

```text
Is transactional delivery backed up?
Which provider is failing?
Are retries increasing?
Are tokens invalid?
Are templates failing?
Are UNKNOWN outcomes unresolved?
```

without direct DB surgery.

---

# 364. Phase 18 Completion Tree

```text
PHASE 18 — NOTIFICATION SERVICE

├── Service Boundary                         ✅
├── Notification Aggregate                   ✅
├── State Machine                            ✅
├── Type / Category / Priority               ✅
├── Channel Model                            ✅
│   ├── PUSH
│   ├── EMAIL
│   ├── SMS
│   └── IN_APP
├── Channel Routing                          ✅
├── Fallback Policy                          ✅
├── Durable Request                          ✅
├── Event / Command Ingestion                ✅
├── Event Idempotency                        ✅
├── Business Deduplication                   ✅
├── Template Model                           ✅
├── Immutable Versions                       ✅
├── Variable Contract                        ✅
├── Injection Protection                     ✅
├── English / Khmer Localization             ✅
├── Language Fallback                        ✅
├── Preference Projection                    ✅
├── Mandatory / Marketing Policies           ✅
├── Quiet Hours                              ✅
├── Scheduling / Expiry                      ✅
├── Delivery Attempts                        ✅
├── Provider Mapping                         ✅
├── Retry / Backoff                          ✅
├── UNKNOWN Outcome                          ✅
├── Provider Idempotency                     ✅
├── Device Registration                      ✅
├── Secure Token Storage                     ✅
├── Invalid-Token Cleanup                    ✅
├── Multi-Device Fan-Out                     ✅
├── In-App Inbox                             ✅
├── Read / Unread                            ✅
├── Action / Deep Link                       ✅
├── Order Notifications                      ✅
├── Mission Notifications                    ✅
├── Reward Notifications                     ✅
├── Expiry Reminders                         ✅
├── Password Reset Boundary                  ✅
├── Provider Callbacks                       ✅
├── Broadcast Architecture                   ✅
├── Rate Limiting / Backpressure             ✅
├── Priority Isolation                       ✅
├── REST / gRPC Contracts                    ✅
├── PostgreSQL Schema                        ✅
├── Clean Architecture                       ✅
├── Security / RBAC / Audit                  ✅
├── Secret Management                        ✅
├── Reconciliation                           ✅
├── Metrics / Alerts / Dashboard             ✅
├── Runbooks                                 ✅
├── Backup / Restore / DR                    ✅
├── Flyway / Legacy Migration                ✅
├── Testing / Load / Failure                 ✅
└── Integration / ACL Handoff                ✅
```

---

# 365. Handoff to Phase 19

The next implementation document in the official roadmap is:

```text
PHASE 19 — Integration / Anti-Corruption Layer
```

---

# 366. Phase 19 Will Own

```text
Legacy System Integration
External Partner APIs
Anti-Corruption Layer
Canonical Models
External Provider/Partner Adapters
Inbound Webhooks
Outbound Calls
Retry / Timeout
Idempotency
Mapping
Protocol Translation
Data Synchronization
Integration Events
Failure Isolation
Reconciliation
```

---

# 367. Notification vs Integration Boundary

Notification owns:

```text
communication-delivery semantics
templates
customer channels
notification status
delivery attempts
provider result interpretation for communication
```

Integration/ACL owns:

```text
generic legacy/partner translation
canonicalization
external partner protocol adaptation
integration synchronization
```

Do not move Notification business semantics into the generic integration layer.

---

# 368. Final Phase 18 Principle

Canonical flow:

```text
Business Fact
      ↓
Notification Policy
      ↓
Event + Business Deduplication
      ↓
Template Version + Localization
      ↓
Preference / Channel Routing
      ↓
Durable Notification
      ↓
Schedule / READY
      ↓
Delivery Worker
      ↓
Provider Adapter
      ↓
Attempt Result
      ↓
Retry / Final Status / Reconciliation
```

The most important implementation rules are:

```text
Notification owns communication delivery, not business truth.
Business services do not call FCM/SMTP/SMS directly.
Notification requests are durable before provider calls.
Source events are deduplicated.
Stable business dedupe keys prevent semantic duplicates.
Templates are versioned and validated.
English/Khmer fallback is explicit.
Required template variables cannot silently render blank.
Template variables are escaped and rich HTML is sanitized.
Customer preferences are enforced.
Marketing and mandatory/security policies are separate.
Scheduled Marketing preferences are rechecked at send time.
Notifications do not send before schedule or after expiry.
Provider acceptance is not automatically delivery.
Delivery attempts are first-class durable records.
Retries are bounded, backoff-driven, expiry-aware, and category-aware.
UNKNOWN is not treated as definitive failure.
Provider idempotency/reference lookup is used when available.
Workers do not hold DB transactions around external calls.
Workers use locking/atomic transitions to avoid concurrent sends.
Device tokens are sensitive, encrypted, hashed for lookup, and never logged.
Permanent invalid tokens are deactivated.
Push/In-App support multi-device delivery according to explicit policy.
Deep links/actions are allow-listed.
In-App inbox is customer-isolated.
Transactional/security traffic is protected from Marketing backlog.
Provider credentials are externalized and rotated.
Provider callbacks are authenticated and deduplicated.
Restore/replay does not blindly resend historical notifications.
Notification reconciliation detects stuck, unknown, overdue, and mismatched delivery state.
Redis may optimize but is never required for core correctness.
```

---

**End of PHASE 18 — Notification Service**
