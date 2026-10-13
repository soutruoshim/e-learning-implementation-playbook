---
title: "PART 19 — NOTIFICATION SERVICE"
---

# PART 19 — NOTIFICATION SERVICE

> **Document Role:** Defines the complete architecture, domain model, template system, channel routing, user preferences, localization, delivery attempts, retry strategy, deduplication, scheduling, provider integration, observability, testing strategy, and production standards for the Notification Service.  
> **Previous Part:** PART 18 — Mission Service  
> **Next Part:** PART 20 — Integration / Anti-Corruption Layer  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis where appropriate, Kafka, REST/gRPC, Flyway  
> **Audience:** Backend engineers, software architects, mobile engineers, QA engineers, DevOps engineers, SREs, security engineers, product engineers, technical leads.

---

# 3161 — Purpose

The Notification Service owns delivery of customer and operational communications.

It answers:

```text
Should this notification be sent?
Which channel should be used?
Which template applies?
Which language should be rendered?
Has this notification already been sent?
Should this notification be scheduled?
How many delivery attempts have occurred?
Did the provider accept the message?
Did the customer receive/open it if supported?
Should failed delivery be retried?
Should another channel be used as fallback?
```

Notification Service converts business intent into delivery.

Business services decide:

```text
what happened
```

Notification decides:

```text
how and when to communicate it
```

---

# 3162 — Notification Service Responsibilities

Notification Service owns:

```text
Notification Request
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
Quiet Hours if supported
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
```

Possible future responsibilities:

```text
WhatsApp
Telegram
Web Push
Inbox categories
Digest notifications
Campaign broadcast
Topic subscription
A/B template testing
Send-time optimization
Multi-provider routing
```

---

# 3163 — Non-Responsibilities

Notification Service does not own:

```text
Order lifecycle
Mission progress
Reward assignment
Points balance
Wallet balance
Promotion eligibility
Customer profile master
Payment status
```

It consumes facts from those domains.

Examples:

```text
OrderAccepted
OrderReady
OrderCompleted
OrderCancelled
MissionCompleted
RewardAssigned
PointsExpiringSoon
PasswordResetRequested
```

---

# 3164 — Core Boundary

High-level:

```text
Business Services
      │
      ▼
 Kafka / Internal API
      │
      ▼
Notification Service
 ┌────┼───────────────┐
 │    │               │
 ▼    ▼               ▼
Rules Templates   Preferences
 │    │               │
 └────┼───────────────┘
      ▼
 Channel Router
 ┌────┼───────────────┐
 │    │               │
 ▼    ▼               ▼
Push Email           SMS
 │    │               │
 ▼    ▼               ▼
Provider Adapters / External Providers
```

---

# 3165 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Notification Request | Business request to communicate something |
| Notification | Durable communication record |
| Template | Reusable content definition |
| Template Version | Immutable published revision |
| Channel | PUSH, EMAIL, SMS, IN_APP, etc. |
| Delivery Attempt | One provider/channel send attempt |
| Provider | External delivery platform such as push/email/SMS provider |
| Preference | Customer opt-in/opt-out or channel preference |
| Schedule | Future send time |
| Deduplication Key | Stable key preventing duplicate delivery |
| Quiet Hours | Time range where non-urgent sends may be delayed |
| Fallback Channel | Secondary channel used when primary cannot deliver |
| Delivery Status | Internal lifecycle of a notification |
| Provider Status | Provider-specific state translated into canonical state |

---

# 3166 — Notification Aggregate

Possible aggregate root:

```text
Notification
```

State:

```text
notification_id
recipient_type
recipient_id
notification_type
priority
status
preferred_channel
template_code
template_version
language
scheduled_at
deduplication_key
correlation_id
created_at
updated_at
sent_at
completed_at
version
```

---

# 3167 — Notification Status

Recommended canonical statuses:

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

Not every provider supports final delivery confirmation.

---

# 3168 — Notification State Machine

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
  └──> FAILED only when asynchronous provider failure exists
```

---

# 3169 — Notification Invariants

Examples:

```text
recipient required
notification_type required
template/channel must be valid
dedupe key cannot create duplicate notification in same scope
scheduled notification cannot send before scheduled_at
expired notification must not send
critical security notification may bypass marketing preferences
customer preference must be checked before non-essential send
```

---

# 3170 — Notification Types

Examples:

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

Use stable codes.

---

# 3171 — Notification Category

Recommended categories:

```text
TRANSACTIONAL
SECURITY
LOYALTY
MARKETING
OPERATIONAL
```

Category may affect:

```text
preference policy
priority
quiet hours
retention
fallback
```

---

# 3172 — Priority

Possible:

```text
LOW
NORMAL
HIGH
URGENT
```

Examples:

```text
marketing → LOW/NORMAL
order ready → HIGH
security reset → HIGH
fraud alert → URGENT
```

Priority must not bypass required legal/consent rules arbitrarily.

---

# 3173 — Channels

Initial channels:

```text
PUSH
EMAIL
SMS
IN_APP
```

Possible future:

```text
WEB_PUSH
WHATSAPP
TELEGRAM
```

---

# 3174 — Push Notifications

Push is appropriate for:

```text
order status
reward notification
mission completion
general app communication
```

Push provider is not the source of business truth.

---

# 3175 — Email

Email is appropriate for:

```text
password reset
receipt
security notice
support communication
long-form notification
```

---

# 3176 — SMS

SMS may be used for:

```text
OTP
security
critical transactional message
```

Because SMS has cost and abuse risk, restrict use.

---

# 3177 — In-App Notification

In-app notification is stored in platform database and displayed inside the application.

It may provide:

```text
notification inbox
read/unread
deep link
history
```

---

# 3178 — Multi-Channel Notification

One business request may create:

```text
PUSH + IN_APP
```

or:

```text
EMAIL + PUSH
```

Use channel policy.

---

# 3179 — Channel Policy

Example:

```text
ORDER_READY
  → PUSH + IN_APP

PASSWORD_RESET
  → EMAIL or SMS

REWARD_ASSIGNED
  → PUSH + IN_APP

MARKETING_CAMPAIGN
  → based on user preference
```

---

# 3180 — Channel Routing

Routing inputs:

```text
notification type
category
customer preferences
contact availability
device token availability
language
priority
provider health
```

---

# 3181 — Channel Fallback

Example:

```text
PUSH fails permanently
      ↓
IN_APP remains available
```

For critical security:

```text
EMAIL fails
      ↓
SMS fallback
```

only if policy explicitly permits.

---

# 3182 — Fallback Warning

Do not automatically send SMS for every push failure.

Reasons:

```text
cost
consent
user expectations
security
```

Fallback is policy-driven.

---

# 3183 — Notification Request

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

# 3184 — Request Source

Possible sources:

```text
Kafka domain event
internal service command
scheduled job
admin broadcast
security workflow
```

---

# 3185 — Event-Driven Notification

Preferred for normal business events:

```text
OrderReady
      ↓
Notification consumer
      ↓
Create notification
      ↓
send asynchronously
```

Ordering is not blocked by push provider latency.

---

# 3186 — Command-Driven Notification

For security flow:

```text
Password Reset
```

Identity may call Notification synchronously to enqueue:

```text
SendPasswordResetNotification
```

Success means:

```text
notification accepted for delivery
```

not necessarily delivered.

---

# 3187 — Delivery Guarantee

Notification Service should normally provide:

```text
at-least-once processing
+
deduplication
```

to produce effectively-once customer notification where business key is stable.

---

# 3188 — Deduplication

Possible key:

```text
notification_type + business_reference + recipient
```

Example:

```text
ORDER_READY:ORD001:CUS001
```

---

# 3189 — Deduplication Scope

Potential:

```text
(recipient_id, notification_type, deduplication_key)
```

Define expiry/retention of dedupe records.

---

# 3190 — Duplicate Business Events

Same:

```text
OrderReady
```

may be replayed.

Notification consumer must not send duplicate message if business policy expects only one.

---

# 3191 — Repeatable Notifications

Some notifications are intentionally repeatable:

```text
points expiry reminders
marketing reminders
```

Include reminder window/version in dedupe key.

Example:

```text
POINTS_EXPIRY:CUS001:7_DAY
```

---

# 3192 — Template

Template defines message structure.

Possible fields:

```text
template_code
notification_type
channel
language
subject
title
body
data_payload
status
version
```

---

# 3193 — Template Code

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

# 3194 — Template Versioning

Published templates should be immutable versions.

Notification record stores:

```text
template_code
template_version
```

for historical explanation.

---

# 3195 — Template Lifecycle

Recommended:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Published templates should not be edited in place if historical reproducibility matters.

---

# 3196 — Template Variables

Example:

```text
{{customer_name}}
{{order_number}}
{{store_name}}
{{reward_name}}
{{expiry_date}}
```

---

# 3197 — Template Variable Contract

Each template defines required variables.

Example:

```text
ORDER_READY
requires:
  order_number
  store_name
```

Missing required variable:

```text
TEMPLATE_VARIABLE_MISSING
```

---

# 3198 — Template Injection Safety

Render variables as plain escaped content by default.

For HTML email:

```text
HTML-escape variables
```

unless a field is explicitly trusted rich content.

---

# 3199 — Template Content Limits

Validate provider limits:

```text
push title length
push body length
SMS length
email subject length
payload size
```

---

# 3200 — Template Localization

Each logical notification can have:

```text
en
km
```

and future languages.

---

# 3201 — Language Selection

Possible priority:

```text
request explicit language
      ↓
customer preferred language
      ↓
platform default
```

---

# 3202 — Language Fallback

If Khmer template missing:

```text
fallback to English/default
```

if policy allows.

Do not send blank notification.

---

# 3203 — Template Fallback

If channel-specific localized version missing:

```text
fallback same channel default language
```

Do not automatically switch channel solely because translation is missing unless configured.

---

# 3204 — Customer Preference

Notification Service may own communication preferences such as:

```text
marketing_push_enabled
marketing_email_enabled
loyalty_notifications_enabled
order_notifications_enabled
```

or consume them from Customer Service.

Ownership must be explicit.

---

# 3205 — Recommended Preference Boundary

Customer Service may own general customer preference profile.

Notification Service may maintain a delivery preference projection for:

```text
channel/category opt-in
quiet hours
```

to avoid synchronous dependency on every send.

---

# 3206 — Preference Projection

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

# 3207 — Essential Notifications

Examples:

```text
password reset
security alert
order critical update
```

may be mandatory/transactional and not subject to marketing opt-out.

Policy/legal review determines category.

---

# 3208 — Marketing Opt-Out

Marketing notification must check:

```text
consent/preference
```

before sending.

Opt-out changes should propagate quickly.

---

# 3209 — Quiet Hours

Optional:

```text
22:00–07:00 local time
```

Non-urgent messages can be delayed.

Security/critical notifications may bypass according to policy.

---

# 3210 — Timezone

Quiet hours require user/store timezone.

Store offset/zone safely.

Do not calculate based solely on server local time.

---

# 3211 — Notification Scheduling

Notification may include:

```text
scheduled_at
expires_at
```

Examples:

```text
reward reminder tomorrow
points expiry reminder 7 days before
marketing campaign start
```

---

# 3212 — Scheduling Rule

If:

```text
scheduled_at > now
```

status:

```text
SCHEDULED
```

Scheduler later moves to:

```text
READY
```

---

# 3213 — Notification Expiry

Example:

```text
ORDER_READY
```

may no longer be useful after order is DONE.

If:

```text
expires_at <= now
```

mark:

```text
EXPIRED
```

instead of sending stale message.

---

# 3214 — Business Expiry

Notification expiry is different from template expiry.

Example:

```text
coupon reminder expires when coupon expires
```

---

# 3215 — Scheduling Worker

Pattern:

```text
Find SCHEDULED
WHERE scheduled_at <= now
AND expires_at > now
      ↓
lock batch
      ↓
mark READY
      ↓
enqueue delivery
```

---

# 3216 — SKIP LOCKED

Multiple scheduler workers:

```sql
SELECT id
FROM notifications
WHERE status = 'SCHEDULED'
  AND scheduled_at <= NOW()
ORDER BY scheduled_at
FOR UPDATE SKIP LOCKED
LIMIT 100;
```

---

# 3217 — Delivery Attempt

Each actual send creates:

```text
notification_delivery_attempt
```

with:

```text
channel
provider
attempt_number
status
provider_reference
started_at
completed_at
error
```

---

# 3218 — Delivery Attempt Status

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

# 3219 — Provider Accepted vs Delivered

Important:

```text
provider accepted
!=
recipient delivered
```

For push/email/SMS providers, the available delivery signal differs.

Do not call provider acceptance:

```text
DELIVERED
```

unless provider contract truly confirms delivery.

---

# 3220 — Provider Adapter

Interface:

```java
public interface NotificationProviderPort {
    SendResult send(NotificationMessage message);
}
```

Channel-specific implementations may expose richer behavior.

---

# 3221 — Push Provider Adapter

Possible:

```text
Firebase Cloud Messaging
Apple Push Notification service
```

Depending client architecture.

Provider details stay in adapter.

---

# 3222 — Email Provider Adapter

Possible:

```text
SMTP
cloud email provider
Microsoft/Google integration
```

Use adapter boundary.

---

# 3223 — SMS Provider Adapter

Possible:

```text
local telecom/SMS gateway
cloud provider
```

Use canonical result mapping.

---

# 3224 — In-App Provider

In-App is internal persistence, not necessarily external provider.

Delivery means:

```text
stored and available to client
```

Read/open status is separate.

---

# 3225 — Provider Result Mapping

Provider-specific:

```text
200
202
INVALID_ARGUMENT
UNREGISTERED
TEMPORARY_FAILURE
```

maps to canonical:

```text
ACCEPTED
FAILED_FINAL
FAILED_RETRYABLE
```

---

# 3226 — Retryable Failure

Examples:

```text
provider timeout
HTTP 429
HTTP 503
temporary network failure
```

Retry with:

```text
backoff
jitter
max attempts
```

---

# 3227 — Final Failure

Examples:

```text
invalid email address
unregistered device token
permanently rejected phone
malformed template payload
```

Do not retry indefinitely.

---

# 3228 — Unknown Outcome

If provider may have accepted request but response was lost:

```text
UNKNOWN
```

If provider supports idempotency/reference lookup:

```text
query provider
```

Otherwise use dedupe carefully before retry.

---

# 3229 — Retry Policy

Example:

```text
attempt 1 → immediate
attempt 2 → +30 seconds
attempt 3 → +2 minutes
attempt 4 → +10 minutes
attempt 5 → final failure
```

Illustrative only.

---

# 3230 — Retry Policy by Category

Security/transactional:

```text
faster retry
```

Marketing:

```text
slower retry / fewer attempts
```

---

# 3231 — Retry Deadline

Do not retry after notification:

```text
expires_at
```

Example:

```text
Order Ready
```

should not arrive after order completion if no longer useful.

---

# 3232 — Retry Worker

Scans:

```text
FAILED_RETRYABLE
next_retry_at <= now
```

uses bounded batches and locking.

---

# 3233 — Provider Idempotency

If provider supports:

```text
idempotency key
```

send stable:

```text
notification_id + channel
```

to reduce duplicate delivery.

---

# 3234 — Push Device Token

Notification Service may maintain:

```text
device token registrations
```

or consume them from Identity/Customer device domain.

Ownership must be explicit.

---

# 3235 — Recommended Device Token Ownership

Notification Service can own delivery endpoints:

```text
push token
platform
device identifier
last_seen
status
```

because they are directly tied to notification delivery.

---

# 3236 — Device Registration

Customer API:

```text
POST /api/v1/notifications/devices
```

Request:

```json
{
  "platform": "ANDROID",
  "push_token": "...",
  "device_id": "..."
}
```

---

# 3237 — Device Token Security

Push token is sensitive operational data.

Do not expose another user's token.

Do not log raw token.

---

# 3238 — Device Token Uniqueness

Possible:

```text
(provider, token_hash)
```

unique.

A token may move between accounts after logout/login.

Define reassignment behavior.

---

# 3239 — Device Logout

On logout:

```text
deactivate token for that user/session
```

if token/session ownership requires it.

---

# 3240 — Invalid Push Token

Provider permanent response:

```text
UNREGISTERED / INVALID_TOKEN
```

should:

```text
mark token INACTIVE
```

and stop retrying.

---

# 3241 — Multiple Devices

One customer may have:

```text
phone
tablet
multiple phones
```

Policy:

```text
send to all active devices
```

or selected device.

---

# 3242 — Push Delivery Fan-Out

One logical notification:

```text
Notification
```

may create multiple delivery attempts:

```text
device A
device B
```

Aggregate status may become:

```text
PARTIALLY_DELIVERED
```

if some succeed.

---

# 3243 — Device Table

Possible:

```text
notification_devices
--------------------
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

# 3244 — Token Storage

Options:

```text
encrypted raw token
+
hash for lookup/uniqueness
```

Avoid plaintext logs.

---

# 3245 — Email Address

Email may come from:

```text
Identity
Customer
```

Notification should not become authoritative owner of customer email identity unless specifically designed.

---

# 3246 — Phone Number

Same principle.

Use trusted recipient/contact projection or request.

Normalize securely.

---

# 3247 — Contact Snapshot

Notification may store destination snapshot:

```text
masked_email
email encrypted
phone encrypted
```

for delivery/audit, according to retention policy.

---

# 3248 — Notification Message

Rendered channel-specific message.

Possible:

```text
title
subject
body
data payload
deep link
image URL
action
```

---

# 3249 — Deep Link

Push/in-app may include:

```text
app route
```

Examples:

```text
/order/{id}
/rewards/{id}
/missions/{id}
```

Use allow-listed route/action names.

---

# 3250 — Deep-Link Security

Do not allow template/admin content to inject arbitrary:

```text
javascript:
file:
malicious external URI
```

Use:

```text
allow-listed app destinations
```

---

# 3251 — Notification Action Model

Canonical action:

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

Map to client navigation.

---

# 3252 — Action Payload

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

# 3253 — Action Validation

Template type may restrict allowed action.

Example:

```text
ORDER_READY
→ OPEN_ORDER
```

Avoid arbitrary admin-configured navigation without validation.

---

# 3254 — In-App Notification Model

Possible:

```text
in_app_notifications
--------------------
id
notification_id
recipient_id
title
body
action
action_payload
read_at
archived_at
created_at
```

---

# 3255 — Read/Unread

Customer endpoints:

```text
GET  /api/v1/notifications/inbox
POST /api/v1/notifications/inbox/{id}/read
POST /api/v1/notifications/inbox/read-all
```

---

# 3256 — Read Idempotency

Repeated:

```text
mark read
```

returns success.

---

# 3257 — Unread Count

Endpoint:

```text
GET /api/v1/notifications/inbox/unread-count
```

May use:

```text
database query
Redis counter/projection
```

---

# 3258 — Inbox Retention

Possible:

```text
90 days
180 days
```

depending product need.

Transactional history may have longer retention than marketing.

---

# 3259 — Notification Preference API

Possible:

```text
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences
```

if ownership is here.

---

# 3260 — Preference Update

Example:

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

# 3261 — Preference Validation

Prevent user from disabling mandatory channels if business/legal policy requires them.

UI should explain, backend enforces.

---

# 3262 — Notification Template Database

Possible tables:

```text
notification_templates
notification_template_versions
notification_template_localizations
```

---

# 3263 — Templates Table

```text
notification_templates
----------------------
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

# 3264 — Template Versions

```text
notification_template_versions
------------------------------
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

# 3265 — Template Localizations

Option A:

```text
one template version per language
```

Option B:

```text
localization table
```

Example:

```text
template_version_id
language
subject
title
body
```

---

# 3266 — Notification Database Overview

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
notification_schedules
notification_idempotency
processed_events
outbox_events
notification_reconciliation_runs
notification_reconciliation_mismatches
```

---

# 3267 — Notifications Table

Example:

```text
notifications
-------------
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

# 3268 — Notification Channels Table

```text
notification_channels
---------------------
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

# 3269 — Delivery Attempts Table

```text
notification_delivery_attempts
------------------------------
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

# 3270 — Preferences Table

```text
notification_preferences
------------------------
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

# 3271 — Devices Table

```text
notification_devices
--------------------
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

# 3272 — In-App Table

```text
in_app_notifications
--------------------
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

# 3273 — Idempotency Table

```text
notification_idempotency
------------------------
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

# 3274 — Processed Events Table

```text
processed_events
----------------
event_id
consumer_name
processed_at
```

---

# 3275 — Outbox

Notification may publish:

```text
NotificationCreated
NotificationSent
NotificationDelivered
NotificationFailed
NotificationOpened
```

only if consumers require these events.

---

# 3276 — Reconciliation Tables

Possible:

```text
notification_reconciliation_runs
notification_reconciliation_mismatches
```

Main purpose:

```text
provider callback status
internal delivery status
device token health
```

---

# 3277 — Notification Creation Transaction

```text
BEGIN

dedupe business request
resolve notification policy
select template version
insert notification
insert channels
insert in-app record if applicable
insert outbox if needed
mark processed source event

COMMIT
```

External provider sends happen afterward.

---

# 3278 — Sending Transaction Boundary

Do not:

```text
hold DB transaction
while calling FCM/SMTP/SMS
```

Pattern:

```text
claim READY channel
mark SENDING
commit
      ↓
provider call
      ↓
persist result
```

---

# 3279 — Delivery Claim

Multiple workers must not send same channel simultaneously.

Use:

```text
row lock
SKIP LOCKED
atomic status transition
```

---

# 3280 — Delivery Worker Query

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

---

# 3281 — Send State Transition

Atomic:

```text
READY / FAILED_RETRYABLE
      ↓
SENDING
```

Only claimed worker sends.

---

# 3282 — Worker Crash After Provider Send

Danger:

```text
provider accepted
process crashed
before DB stored ACCEPTED
```

Retry may duplicate.

Mitigations:

```text
provider idempotency
stable provider reference
message collapse key where appropriate
dedupe-aware client behavior
```

---

# 3283 — Push Collapse Key

Some push notifications can use:

```text
collapse/group key
```

for replaceable status updates.

Example:

```text
order status for ORD001
```

But do not collapse:

```text
security notifications
distinct reward notifications
```

unless intended.

---

# 3284 — Push Data vs Notification Payload

Push may contain:

```text
display payload
data payload
```

Keep sensitive data minimal.

Client can fetch authoritative details after opening.

---

# 3285 — Sensitive Push Content

Lock-screen notifications may expose information.

Avoid:

```text
full wallet balance
full payment details
sensitive personal data
```

unless explicitly approved.

---

# 3286 — Email Rendering

HTML email should have:

```text
escaped variables
plain-text alternative where possible
brand template
unsubscribe handling for marketing
```

---

# 3287 — Email Tracking

Open/click tracking is optional.

If enabled:

```text
privacy policy
consent
data retention
```

must be considered.

---

# 3288 — SMS Content

Keep concise.

Avoid including:

```text
sensitive account information
```

Use one-time codes only where required and short-lived.

---

# 3289 — Password Reset Notification

Identity generates/owns reset challenge semantics.

Notification receives:

```text
recipient destination
one-time code/link data
expiry information
```

Notification does not verify/reset password.

---

# 3290 — OTP Notification

Notification delivers OTP.

Identity/security domain owns:

```text
OTP generation
hash/storage
attempt count
verification
expiry
```

---

# 3291 — Security Notification Privacy

Use generic messages where needed to avoid account enumeration.

Example:

```text
password reset request processed
```

rather than revealing unsupported identity details.

---

# 3292 — Order Notification Flow

```text
OrderReady
      ↓
Notification consumer
      ↓
dedupe
      ↓
render ORDER_READY template
      ↓
Push + In-App
      ↓
delivery attempts
```

---

# 3293 — Mission Notification Flow

```text
MissionCompleted
      ↓
Notification
      ↓
"Mission completed"
```

Reward assignment may trigger a separate:

```text
RewardAssigned
```

notification.

Avoid duplicate/conflicting messages.

---

# 3294 — Reward Notification Flow

```text
RewardAssigned
      ↓
render localized reward notification
      ↓
OPEN_REWARD deep link
```

---

# 3295 — Points Expiry Reminder

Scheduler/domain event may produce reminders:

```text
30 days
15 days
7 days
```

Deduplication key includes:

```text
expiry period
reminder window
recipient
```

---

# 3296 — Reward Expiry Reminder

Same pattern:

```text
reward_assignment_id
reminder_window
```

---

# 3297 — Notification Preference Evaluation

Before creating/sending:

```text
category
channel
customer preference
mandatory status
quiet hours
```

---

# 3298 — Preference Timing

For scheduled marketing:

```text
re-check preference at send time
```

because customer may opt out after scheduling.

---

# 3299 — Template Timing

Choose whether to render:

```text
at creation
```

or:

```text
at send time
```

---

# 3300 — Render-at-Creation

Advantages:

```text
historical exact content
no template changes
```

Costs:

```text
scheduled language/template updates not reflected
```

---

# 3301 — Render-at-Send

Advantages:

```text
latest template
latest language
```

Risks:

```text
historical non-reproducibility
template deletion
```

---

# 3302 — Recommended Rendering

For transactional notifications:

```text
select template version at creation
render content at creation or persist version + variables
```

This preserves deterministic behavior.

---

# 3303 — Template Variable Snapshot

Store variables as:

```text
JSONB
```

if needed for retry/re-render.

Classify/redact sensitive values.

---

# 3304 — Notification Content Snapshot

Optional store:

```text
rendered_subject
rendered_title
rendered_body
```

for support/history.

Retention must account for PII.

---

# 3305 — Broadcast Notification

Admin may create broadcast:

```text
all customers
segment
store group
tier
```

This is high-volume and different from transactional notifications.

---

# 3306 — Broadcast Architecture

Avoid inserting millions of rows synchronously in one admin request.

Use:

```text
broadcast definition
      ↓
segment snapshot
      ↓
batch fan-out worker
      ↓
individual notifications
```

---

# 3307 — Broadcast Status

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

# 3308 — Broadcast Segment

Segment may come from:

```text
Customer/Analytics
Loyalty tier
explicit uploaded recipient list
```

Notification should not own complex customer segmentation rules.

---

# 3309 — Broadcast Safety

Require:

```text
recipient estimate
template preview
schedule
category
approval
```

for large marketing sends.

---

# 3310 — Broadcast Approval

High-volume campaign may require:

```text
creator
approver
```

before send.

---

# 3311 — Test Send

Admin endpoint:

```text
POST /api/v1/admin/notifications/templates/{id}/test
```

allows send to approved test recipient.

Do not bypass production permission model.

---

# 3312 — Broadcast Cancellation

Cancellation should stop:

```text
unsent recipients
```

but cannot unsend messages already accepted by providers.

---

# 3313 — Provider Rate Limit

Delivery workers must honor:

```text
provider quota
rate limits
burst limits
```

Use:

```text
token bucket
queue throughput control
```

---

# 3314 — Backpressure

If provider slows:

```text
queue grows
```

System should:

```text
control concurrency
avoid DB overload
expose backlog metric
```

---

# 3315 — Priority Queues

Security/transactional notifications should not be blocked behind huge marketing campaigns.

Possible:

```text
separate Kafka topics/queues
priority field
separate worker pools
```

---

# 3316 — Recommended Queue Separation

Example:

```text
notification.transactional
notification.security
notification.marketing
```

or priority partitions.

---

# 3317 — Provider Routing

Future:

```text
primary provider
secondary provider
```

per channel.

Routing can consider:

```text
health
cost
region
delivery success
```

---

# 3318 — Provider Failover

Only fail over when:

```text
first provider definitively failed
```

or provider idempotency ensures safe duplicate handling.

Unknown outcome requires caution.

---

# 3319 — Provider Health State

Track:

```text
HEALTHY
DEGRADED
UNAVAILABLE
```

as operational state/projection.

---

# 3320 — Notification Provider Credentials

Store in:

```text
Vault
cloud Secret Manager
Kubernetes external secret integration
```

Never hard-code/commit.

---

# 3321 — Push Credentials

Protect:

```text
service account private key
OAuth credentials
APNs signing key/certificate
```

Rotate according to provider/security policy.

---

# 3322 — Email Credentials

Protect:

```text
SMTP password
API key
OAuth client secret
```

---

# 3323 — SMS Credentials

Protect:

```text
gateway API key
signing secret
sender credentials
```

---

# 3324 — Provider TLS

Require:

```text
TLS
certificate validation
hostname validation
```

Do not disable validation for production troubleshooting.

---

# 3325 — Notification API: Inbox

Customer:

```text
GET  /api/v1/notifications
GET  /api/v1/notifications/{id}
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/read-all
```

---

# 3326 — Notification API: Device

Customer:

```text
POST   /api/v1/notifications/devices
DELETE /api/v1/notifications/devices/{deviceId}
```

or:

```text
register/unregister token
```

---

# 3327 — Notification API: Preferences

If owned here:

```text
GET /api/v1/notifications/preferences
PUT /api/v1/notifications/preferences
```

---

# 3328 — Internal Notification Contract

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

# 3329 — SendNotification Request

Fields:

```text
notification_type
recipient_id
template_code
language optional
variables
business_reference
deduplication_key
priority
channels optional
expires_at optional
```

---

# 3330 — SendNotification Response

Meaning:

```text
accepted/enqueued
```

Example:

```text
notification_id
status
```

Do not imply provider delivery unless synchronous provider flow intentionally waits.

---

# 3331 — Notification Error Catalog

Candidate:

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

# 3332 — Error Mapping

Example:

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

# 3333 — Notification Events Published

Candidate:

```text
NotificationCreated
NotificationSent
NotificationDelivered
NotificationFailed
NotificationOpened
DeviceTokenDisabled
```

Do not publish everything unless consumers exist.

---

# 3334 — NotificationSent Event

Data:

```text
notification_id
recipient_id
notification_type
channel
provider
sent_at
```

Avoid full content.

---

# 3335 — NotificationFailed Event

Data:

```text
notification_id
channel
failure_category
retryable
attempt_count
```

---

# 3336 — NotificationOpened Event

If client tracks inbox/push opens:

```text
notification_id
recipient_id
opened_at
```

Privacy/analytics policy applies.

---

# 3337 — Events Consumed

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

# 3338 — Consumer Mapping

Maintain configuration:

```text
event_type
→ notification_type
→ template code
→ channels
```

Avoid large switch statement scattered through listeners.

---

# 3339 — Notification Policy Registry

Conceptual:

```text
ORDER_READY
  category=TRANSACTIONAL
  channels=PUSH,IN_APP
  template=ORDER_READY
  priority=HIGH
```

---

# 3340 — Policy Versioning

High-risk changes to:

```text
channel
mandatory status
template
fallback
```

should be versioned/audited.

---

# 3341 — Notification Service Clean Architecture

Recommended:

```text
notification-service/
│
├── domain/
│   ├── notification/
│   ├── template/
│   ├── preference/
│   ├── device/
│   ├── delivery/
│   ├── schedule/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── create/
│   ├── render/
│   ├── route/
│   ├── send/
│   ├── retry/
│   ├── schedule/
│   ├── inbox/
│   ├── preference/
│   └── admin/
│
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   ├── kafka/
│   └── scheduler/
│
├── adapter/out/
│   ├── persistence/
│   ├── push/
│   ├── email/
│   ├── sms/
│   ├── customer/
│   ├── redis/
│   └── kafka/
│
└── config/
```

---

# 3342 — Input Ports

Examples:

```text
CreateNotificationUseCase
ScheduleNotificationUseCase
SendNotificationUseCase
RetryNotificationUseCase
ListInboxUseCase
MarkNotificationReadUseCase
RegisterDeviceUseCase
UnregisterDeviceUseCase
GetPreferencesUseCase
UpdatePreferencesUseCase
PublishTemplateUseCase
CreateBroadcastUseCase
```

---

# 3343 — Output Ports

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
```

---

# 3344 — CreateNotificationUseCase

Pseudo:

```text
Validate request/event
      ↓
Deduplicate
      ↓
Load policy
      ↓
Resolve preferences
      ↓
Choose channels
      ↓
Resolve template version
      ↓
Resolve language
      ↓
Render/snapshot content
      ↓
Persist notification/channels
      ↓
Mark READY or SCHEDULED
      ↓
Return notification ID
```

---

# 3345 — SendNotificationUseCase

```text
Claim READY channel
      ↓
Load destination
      ↓
Check send-time preference
      ↓
Check expiry
      ↓
Call provider
      ↓
Map result
      ↓
Persist delivery attempt/status
      ↓
Retry/finalize
```

---

# 3346 — RetryNotificationUseCase

```text
Find retryable attempt
      ↓
check max attempts
      ↓
check expiry
      ↓
check provider health
      ↓
claim send
      ↓
send
```

---

# 3347 — ScheduleNotificationUseCase

```text
Validate future time
      ↓
apply timezone/quiet-hour policy
      ↓
persist SCHEDULED
```

---

# 3348 — RegisterDeviceUseCase

```text
authenticate customer
      ↓
validate platform/token
      ↓
hash token
      ↓
upsert ownership
      ↓
mark active
```

---

# 3349 — Device Reassignment

If same token appears for a different authenticated user:

```text
deactivate old association
activate new association
```

according to mobile/session policy.

---

# 3350 — Unregister Device

Logout/unregister:

```text
mark INACTIVE
```

rather than hard-delete immediately if history/support requires it.

---

# 3351 — Template Publish Use Case

```text
validate template
      ↓
validate required variables
      ↓
validate channel limits
      ↓
create immutable version
      ↓
set active version
      ↓
audit
```

---

# 3352 — Template Preview

Admin should be able to preview:

```text
language
channel
sample variables
```

without publishing.

---

# 3353 — Template Test Cases

Each template may have fixture variables for:

```text
CI validation
admin preview
```

---

# 3354 — Template CI Validation

Check:

```text
required variables referenced correctly
no unknown variable
render succeeds
payload within limits
deep link valid
```

---

# 3355 — Notification Admin APIs

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
```

---

# 3356 — Admin Authorization

Possible permissions:

```text
notification.read
notification.template.manage
notification.template.publish
notification.broadcast.create
notification.broadcast.approve
notification.retry
```

---

# 3357 — Admin Broadcast Risk

Broadcast can impact millions of customers.

Require:

```text
preview
estimated audience
approval
schedule
cancel option
rate control
audit
```

---

# 3358 — Notification Audit

Audit:

```text
template publish
preference admin override
broadcast create/approve/cancel
manual retry
provider config change
```

---

# 3359 — Customer Preference Audit

Preference changes may store:

```text
source
timestamp
actor
```

especially for consent-sensitive categories.

---

# 3360 — Notification Security

Primary risks:

```text
sending to wrong recipient
template injection
PII leakage
device token theft
provider credential leakage
notification spam
admin broadcast abuse
```

---

# 3361 — Recipient Authorization

Normal business services submit:

```text
recipient_id
```

through trusted service identity.

Public clients cannot request arbitrary notification to another customer.

---

# 3362 — Public Send API

Avoid exposing a generic:

```text
POST /send-notification
```

to end users.

Use specific business APIs.

---

# 3363 — Template Variable Allowlist

Each template allows known variables only.

Reject unknown/excessive untrusted content if policy requires.

---

# 3364 — HTML Sanitization

Email rich text configuration should be:

```text
sanitized
```

and restricted to approved markup.

---

# 3365 — SSRF Risk

If template supports image URL:

```text
do not server-fetch arbitrary customer-supplied URLs
```

Use trusted CDN/allowlist.

---

# 3366 — Deep-Link Validation

Allow-list:

```text
destination action
parameter schema
```

Do not execute arbitrary URI.

---

# 3367 — Provider Callback

Some delivery providers send:

```text
delivered
bounced
complaint
failed
```

callbacks.

Verify callback authenticity.

---

# 3368 — Callback Idempotency

Store:

```text
provider_event_id
```

and deduplicate.

---

# 3369 — Email Bounce

Permanent bounce:

```text
mark email destination unhealthy
```

or update projection.

Do not endlessly retry.

---

# 3370 — Spam Complaint

Marketing email complaint may:

```text
disable marketing email
```

according to policy/provider integration.

---

# 3371 — SMS Delivery Receipt

If supported:

```text
SENT → DELIVERED / FAILED
```

based on provider receipt.

---

# 3372 — Push Delivery Limitation

Push provider often confirms:

```text
accepted for delivery
```

not actual human receipt.

Do not misrepresent status.

---

# 3373 — Open Tracking

Client may post:

```text
POST /notifications/{id}/opened
```

or track when deep link opened.

Use only if product analytics requires it.

---

# 3374 — Notification Reconciliation

Potential checks:

```text
SENDING stuck too long
provider accepted but internal missing sent status
invalid tokens still active
broadcast recipient count mismatch
retryable attempts past retry time
```

---

# 3375 — Delivery Reconciliation

If provider supports query:

```text
provider_reference
```

may be checked for critical notification categories.

Not all channels support it.

---

# 3376 — Stuck Notification Detection

Example:

```text
status = SENDING
updated_at < now - threshold
```

Recovery worker decides:

```text
query provider
retry with idempotency
mark UNKNOWN
```

---

# 3377 — Reconciliation Runs

Possible:

```text
notification_reconciliation_runs
-------------------------------
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

# 3378 — Reconciliation Mismatch

```text
notification_reconciliation_mismatches
--------------------------------------
id
run_id
notification_id
channel
mismatch_type
expected_value
actual_value
status
detected_at
resolved_at
```

---

# 3379 — Notification Metrics

Business:

```text
notifications_created_total
notifications_sent_total
notifications_delivered_total
notifications_failed_total
notifications_opened_total
```

By category/channel:

```text
transactional
security
loyalty
marketing
push
email
sms
in-app
```

---

# 3380 — Provider Metrics

```text
provider_request_total
provider_success_total
provider_failure_total
provider_timeout_total
provider_rate_limit_total
provider_latency
```

---

# 3381 — Queue Metrics

```text
ready_backlog
retry_backlog
scheduled_backlog
oldest_ready_age
oldest_retry_age
```

---

# 3382 — Template Metrics

```text
template_render_failure_total
missing_template_total
missing_variable_total
```

---

# 3383 — Device Metrics

```text
active_device_tokens
invalid_device_token_total
token_reassignment_total
```

---

# 3384 — Notification SLIs

Potential:

```text
Notification acceptance availability
P95 enqueue latency
P95 transactional time-to-provider
Delivery success rate
Retry backlog age
Template render success rate
```

---

# 3385 — Notification SLO Priority

Transactional/security notifications may need stricter SLO than marketing.

Example:

```text
ORDER_READY
```

is time-sensitive.

---

# 3386 — Alerts

Alert on:

```text
provider auth failures
push failure spike
email failure spike
SMS failure spike
transactional backlog
retry backlog
template render failures
invalid token spike
consumer lag
DB errors
```

---

# 3387 — Dashboard

Show:

```text
sent by channel
success/failure
provider latency
transactional backlog
marketing backlog
retry count
invalid tokens
template failures
consumer lag
```

---

# 3388 — Structured Logging

Safe fields:

```text
notification_id
recipient_id if permitted
notification_type
channel
provider
attempt_number
status
error_category
request_id
correlation_id
```

Avoid:

```text
raw device token
OTP
password reset token
full email/phone
provider secret
```

---

# 3389 — OTP Logging

Never log:

```text
OTP value
reset token
verification secret
```

Use:

```text
challenge_id
```

for debugging.

---

# 3390 — Email/Phone Logging

Mask:

```text
m***@example.com
+855******123
```

if destination must appear in operational logs.

---

# 3391 — Tracing

Trace:

```text
Business event
  ↓
Notification consumer
  ↓
Template render
  ↓
Channel routing
  ↓
Provider
  ↓
Delivery persistence
```

---

# 3392 — Correlation ID

Preserve originating:

```text
order/payment/mission/security correlation_id
```

through notification creation and provider attempt.

---

# 3393 — Failure Mode: Push Provider Down

Behavior:

```text
persist retryable failure
backoff
continue in-app notification
alert if transactional backlog grows
```

---

# 3394 — Failure Mode: Email Provider Down

Security flow may:

```text
retry
use approved SMS fallback
```

Transactional/non-critical may wait.

---

# 3395 — Failure Mode: SMS Provider Down

Do not repeatedly flood provider.

Use:

```text
circuit breaker
backoff
secondary provider if explicitly supported
```

---

# 3396 — Failure Mode: Redis Down

Core notification processing should continue using PostgreSQL/Kafka.

Cache/rate-limit degradation policy must be defined.

---

# 3397 — Failure Mode: PostgreSQL Down

Cannot safely persist/dedupe/send normal durable notifications.

Fail ingestion or allow Kafka backlog to retain events.

Do not send without durable record if duplicate prevention requires persistence.

---

# 3398 — Failure Mode: Kafka Down

Business events remain in producer outboxes/broker recovery paths.

Direct security command can still use synchronous internal API if architecture supports it.

---

# 3399 — Failure Mode: Template Missing

Transactional notification should:

```text
fail with alert
```

or use explicitly configured fallback template.

Do not silently send malformed blank message.

---

# 3400 — Failure Mode: Preference Service/Projection Stale

For marketing:

```text
fail closed / delay
```

is safer than sending against unknown consent.

For mandatory transactional notification:

```text
policy may allow send
```

---

# 3401 — Notification Runbooks

Required:

```text
Push provider outage
Email provider outage
SMS provider outage
Provider auth failure
Transactional backlog
Invalid token spike
Template render failure
Duplicate notifications
Wrong-recipient incident
Broadcast incident
Retry backlog
```

---

# 3402 — Provider Auth Failure Runbook

```text
confirm credential expiry/revocation
rotate secret/key
test provider health
avoid disabling TLS verification
replay backlog after fix
```

---

# 3403 — Duplicate Notification Runbook

```text
identify dedupe key
inspect source event IDs
check processed_events
check worker crash timing
check provider idempotency
add regression test
```

---

# 3404 — Wrong Recipient Runbook

High severity:

```text
stop affected flow
identify data source
disable template/policy if needed
assess exposed content
notify security/privacy team
fix ownership mapping
add tests
```

---

# 3405 — Broadcast Incident Runbook

```text
pause/cancel unsent batch
identify audience query
identify sent volume
assess content
record incident
prevent recurrence with approval/preview improvements
```

---

# 3406 — Backup

Back up:

```text
notifications
templates
versions
preferences if owned
device registrations
in-app history
delivery attempts
broadcast definitions
processed events
outbox
```

---

# 3407 — Restore

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

# 3408 — Restore Risk

Old restore may:

```text
resend already delivered message
reactivate invalid token
resurrect cancelled schedule
lose read status
```

Recovery must use:

```text
dedupe
provider references
expiry
reconciliation
```

---

# 3409 — Disaster Recovery

Define:

```text
RPO
RTO
broker replay
dedupe retention
provider idempotency behavior
scheduled-message recovery
cache rebuild
secret recovery
```

---

# 3410 — Flyway Migration Plan

Example:

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
```

---

# 3411 — Legacy Notification Migration

Possible legacy sources:

```text
push history
notification table
email logs
device-token table
```

Migration should preserve only useful state.

Do not migrate unnecessary old provider payloads.

---

# 3412 — Device Token Migration

Validate:

```text
duplicate tokens
inactive tokens
old users
invalid format
last seen
platform
```

before activation.

---

# 3413 — Template Migration

Map:

```text
legacy title/body
language
notification type
deep link
```

into versioned templates.

---

# 3414 — Push History Migration

Historical push logs may be retained for support/analytics but do not need to become active retry records.

---

# 3415 — Migration Reconciliation

Compare:

```text
active device count
template count
recent notification count
in-app unread count if migrated
```

---

# 3416 — Notification Testing Strategy

Test:

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
Concurrency
Kafka
Security
Load
Failure
Migration
```

---

# 3417 — Domain Tests

Test:

```text
status transitions
expiry
schedule
cancel
priority
channel policy
```

---

# 3418 — Deduplication Tests

Test:

```text
same event twice
same dedupe key concurrent
same key different recipient
repeatable reminder with different window
```

---

# 3419 — Template Tests

Test:

```text
valid variables
missing required variable
unknown variable
HTML escaping
payload length
deep-link action
```

---

# 3420 — Localization Tests

Test:

```text
English
Khmer
missing Khmer fallback
missing all template variants
preferred language change
```

---

# 3421 — Preference Tests

Test:

```text
marketing opt-out
transactional allowed
security mandatory
quiet hours
preference changed before scheduled send
```

---

# 3422 — Push Tests

Test:

```text
valid token
invalid token
unregistered token
provider timeout
provider rate limit
multi-device
partial success
```

---

# 3423 — Email Tests

Test:

```text
valid email
hard bounce
temporary failure
template HTML
provider auth failure
```

---

# 3424 — SMS Tests

Test:

```text
valid send
provider timeout
invalid number
delivery receipt
rate limit
```

---

# 3425 — In-App Tests

Test:

```text
create
list
read
read-all
unread count
authorization
retention
```

---

# 3426 — Scheduling Tests

Test:

```text
future scheduled
due scheduled
expired before send
quiet-hour shift
duplicate scheduler worker
```

---

# 3427 — Retry Tests

Test:

```text
retryable failure
final failure
max attempts
expiry before retry
backoff
worker restart
```

---

# 3428 — Worker Concurrency Tests

Multiple workers claim same queue.

Expected:

```text
one provider send per delivery unit
```

subject to provider-unknown crash limitations.

---

# 3429 — Provider Unknown Outcome Tests

Simulate:

```text
provider accepted
response lost
worker crashes
```

Verify provider idempotency/reference strategy.

---

# 3430 — Kafka Tests

Test consumers for:

```text
OrderReady
OrderCancelled
MissionCompleted
RewardAssigned
WalletTopUpCompleted
duplicate event
consumer retry
DLQ
```

---

# 3431 — Security Tests

Verify:

```text
customer cannot read another inbox
device token ownership
generic public send unavailable
template injection blocked
admin broadcast RBAC
secret redaction
```

---

# 3432 — Load Tests

Scenarios:

```text
order-status burst
mission/reward event burst
large marketing broadcast
many push device fan-outs
retry backlog
```

---

# 3433 — Transactional Priority Load Test

Create:

```text
large marketing backlog
```

while sending:

```text
ORDER_READY
```

Verify transactional notification remains within SLO.

---

# 3434 — Provider Rate-Limit Test

Simulate:

```text
HTTP 429
```

Verify:

```text
backoff
no hot retry loop
queue remains stable
```

---

# 3435 — Failure Tests

Inject:

```text
PostgreSQL down
Kafka unavailable
Redis unavailable
provider timeout
provider auth revoked
scheduler crash
worker crash after provider acceptance
```

---

# 3436 — Definition of Done: Transactional Notification

- [ ] Source event/command defined.
- [ ] Dedupe key defined.
- [ ] Template/version defined.
- [ ] Localization defined.
- [ ] Channel policy defined.
- [ ] Preference policy defined.
- [ ] Provider adapter implemented.
- [ ] Retry strategy defined.
- [ ] Expiry defined.
- [ ] Metrics/alerts.
- [ ] Tests.

---

# 3437 — Definition of Done: Template

- [ ] Template code.
- [ ] Notification type.
- [ ] Channel.
- [ ] Languages.
- [ ] Required variables.
- [ ] Payload limits.
- [ ] Deep link/action.
- [ ] Preview.
- [ ] Versioning.
- [ ] Publish audit.
- [ ] Tests.

---

# 3438 — Definition of Done: Push Device

- [ ] Authenticated registration.
- [ ] Secure token storage.
- [ ] Token uniqueness.
- [ ] Logout/unregister behavior.
- [ ] Invalid-token handling.
- [ ] Multi-device policy.
- [ ] Tests.

---

# 3439 — Definition of Done: Broadcast

- [ ] Audience source.
- [ ] Category.
- [ ] Template.
- [ ] Estimated recipient count.
- [ ] Approval if needed.
- [ ] Schedule.
- [ ] Rate limiting.
- [ ] Pause/cancel.
- [ ] Metrics.
- [ ] Audit.
- [ ] Tests.

---

# 3440 — Notification Review Checklist

## Ownership

- [ ] Notification owns delivery.
- [ ] Business services own business facts.
- [ ] Customer/Identity owns authoritative identity/contact data unless explicitly delegated.
- [ ] Provider details isolated.

## Reliability

- [ ] Durable notification.
- [ ] Dedupe.
- [ ] Retry.
- [ ] Expiry.
- [ ] Unknown-outcome strategy.
- [ ] Worker concurrency.
- [ ] Backpressure.

## Content

- [ ] Template versioning.
- [ ] Localization.
- [ ] Variable validation.
- [ ] Deep-link validation.

---

# 3441 — Data Review Checklist

- [ ] Notification IDs stable.
- [ ] Dedupe uniqueness.
- [ ] Delivery attempts retained.
- [ ] Template versions immutable.
- [ ] Device token secure storage.
- [ ] Preference ownership clear.
- [ ] In-app indexes.
- [ ] Processed events.
- [ ] Reconciliation.
- [ ] Retention.

---

# 3442 — Contract Review Checklist

- [ ] Internal send contract.
- [ ] Schedule contract.
- [ ] Inbox APIs.
- [ ] Device registration.
- [ ] Preferences.
- [ ] Admin template APIs.
- [ ] Stable errors.
- [ ] Event-to-policy mapping.
- [ ] Delivery-status semantics clear.

---

# 3443 — Security Review Checklist

- [ ] Provider secrets externalized.
- [ ] Raw device tokens not logged.
- [ ] OTP/reset token not logged.
- [ ] Template variables escaped.
- [ ] Admin broadcast restricted.
- [ ] Customer inbox isolated.
- [ ] Deep links allow-listed.
- [ ] Provider callbacks authenticated.
- [ ] Marketing consent enforced.

---

# 3444 — Operations Review Checklist

- [ ] Provider metrics.
- [ ] Queue backlog.
- [ ] Retry backlog.
- [ ] Invalid token rate.
- [ ] Template failures.
- [ ] Consumer lag.
- [ ] Alerts.
- [ ] Dashboard.
- [ ] Runbooks.
- [ ] Backup/restore.

---

# 3445 — Production Readiness Checklist

Before production:

- [ ] Duplicate-event tests pass.
- [ ] Worker concurrency tests pass.
- [ ] Push provider failure tested.
- [ ] Email provider failure tested.
- [ ] SMS failure tested if used.
- [ ] Invalid token cleanup tested.
- [ ] Template fallback tested.
- [ ] Khmer/English localization tested.
- [ ] Marketing opt-out tested.
- [ ] Quiet hours tested if enabled.
- [ ] Transactional priority under marketing load tested.
- [ ] Scheduler recovery tested.
- [ ] Provider auth rotation tested.
- [ ] Backup/restore tested.
- [ ] Alerts configured.
- [ ] Runbooks available.

---

# 3446 — Initial Implementation Order

Recommended:

```text
1. Notification aggregate
2. Notification persistence
3. Template model
4. Template versioning
5. Kafka event consumer
6. Deduplication
7. In-App notifications
8. Push device registration
9. Push provider adapter
10. Delivery worker
11. Retry
12. Localization
13. Order notifications
14. Mission/Reward notifications
15. Preferences
16. Scheduling
17. Points/Reward expiry reminders
18. Email
19. SMS if required
20. Provider callbacks
21. Admin template tooling
22. Broadcast
23. Reconciliation
24. Metrics/alerts
```

---

# 3447 — Minimum Viable Notification Service

First production-capable version:

```text
Durable Notification
Template + version
English/Khmer localization
Kafka event ingestion
Deduplication
Push
In-App
Device registration
Retry
Provider failure mapping
Order notifications
Mission/Reward notifications
Notification history
Metrics/alerts
```

Add:

```text
Email
SMS
Broadcast
Quiet Hours
Advanced Preferences
```

only when required.

---

# 3448 — Future Enhancements

Potential:

```text
Web Push
WhatsApp
Telegram
Multi-provider routing
Digest notifications
Send-time optimization
Template A/B testing
Personalized notification copy
Campaign segmentation
Engagement scoring
Provider cost optimization
```

---

# 3449 — PART 19 Deliverables

PART 19 produces:

1. Notification Service responsibility definition.
2. Boundary from business services.
3. Notification aggregate.
4. Notification lifecycle/status.
5. Notification type/category/priority.
6. Channel model.
7. Channel routing.
8. Fallback policy.
9. Notification request contract.
10. Event-driven notification flow.
11. Delivery guarantee model.
12. Deduplication.
13. Template model.
14. Template versioning.
15. Template variable validation.
16. Localization.
17. Preferences.
18. Quiet hours.
19. Scheduling.
20. Expiry.
21. Delivery attempts.
22. Provider result mapping.
23. Retry.
24. Unknown outcome.
25. Push provider architecture.
26. Email provider architecture.
27. SMS provider architecture.
28. In-App notifications.
29. Device registration/token security.
30. Multi-device delivery.
31. Deep-link/action model.
32. Full database schema.
33. Worker transaction/locking patterns.
34. Provider idempotency.
35. Password reset/OTP boundaries.
36. Order/Mission/Reward notification flows.
37. Points/Reward expiry reminders.
38. Preference re-check at send time.
39. Broadcast architecture.
40. Backpressure/priority queue.
41. Provider routing/failover.
42. Provider secret management.
43. REST/gRPC contracts.
44. Error catalog.
45. Notification events.
46. Event-to-policy registry.
47. Clean Architecture layout.
48. Input/output ports.
49. Template admin tooling.
50. Security controls.
51. Reconciliation.
52. Metrics/SLIs.
53. Alerts/dashboard.
54. Logging/tracing.
55. Failure modes.
56. Runbooks.
57. Backup/restore.
58. DR.
59. Flyway migrations.
60. Legacy migration.
61. Testing strategy.
62. Concurrency/load tests.
63. Review checklists.
64. Production readiness.
65. Implementation order.

---

# 3450 — Exit Criteria

PART 19 is complete when the team can answer:

### Ownership

```text
What does Notification own versus Order, Mission, Identity, and Customer?
```

### Deduplication

```text
How does a replayed business event avoid sending the same customer notification twice?
```

### Templates

```text
How are templates versioned, localized, validated, and rendered safely?
```

### Preferences

```text
Which notifications respect opt-out and which are mandatory transactional/security messages?
```

### Delivery

```text
What does SENT, ACCEPTED, and DELIVERED mean for each provider?
```

### Retry

```text
Which provider failures retry, for how long, and when do they stop?
```

### Push Devices

```text
How are device tokens registered, secured, deactivated, and fan-out handled?
```

### Scheduling

```text
How are scheduled, quiet-hour, and expired notifications handled?
```

### Provider Outage

```text
How do transactional notifications remain prioritized while provider or marketing traffic is degraded?
```

### Recovery

```text
How does restore/replay avoid resending messages incorrectly?
```

If these answers are clear and tested, Notification Service is ready for implementation.

---

# 3451 — Handoff to PART 20

PART 20 defines Integration / Anti-Corruption Layer.

```text
PART 19
Notification Service
      ↓
External Providers
Push / Email / SMS
      ↓
PART 20
Integration / Anti-Corruption Layer
```

PART 20 will define:

```text
Legacy System Integration
External Partner APIs
Anti-Corruption Layer
Canonical Models
Provider Adapters
Inbound Webhooks
Outbound Calls
Retry / Timeout
Idempotency
Mapping
Protocol Translation
Data Synchronization
Strangler Migration
Integration Events
Failure Isolation
Reconciliation
```

The key separation is:

```text
Core domain services speak canonical platform language.

Integration / ACL translates external and legacy language into that canonical model.
```

---

# PART 19 — Summary

The Notification Service owns communication delivery, not business truth.

Core flow:

```text
Business Event
      ↓
Notification Policy
      ↓
Deduplication
      ↓
Template + Localization
      ↓
Preference / Channel Selection
      ↓
Schedule / Ready
      ↓
Delivery Worker
      ↓
Provider
      ↓
Retry / Final Status
```

The most important architecture rules are:

```text
Business services do not call FCM/SMTP/SMS directly.
Notification requests are durable.
Source events are deduplicated.
Templates are versioned and validated.
Localization has explicit fallback.
Customer preferences are enforced.
Security/transactional and marketing policies are separate.
Provider acceptance is not automatically delivery.
Retries are bounded and category-aware.
Device tokens are sensitive and securely stored.
Transactional traffic is protected from marketing backlog.
Provider credentials remain outside source code.
Notification history and provider attempts are observable.
```

The next chapter isolates all legacy and third-party translation concerns from the core domain:

```text
PART 20 — Integration / Anti-Corruption Layer
```

---

**End of PART 19 — Notification Service**
