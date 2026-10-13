---
title: "PART 38 — USER ACCEPTANCE TESTING (UAT)"
---

# PART 38 — USER ACCEPTANCE TESTING (UAT)

> **Document Role:** Defines the complete business-acceptance process, governance, environment controls, release-candidate discipline, test execution, defect management, evidence, and sign-off standards required before a release can advance toward production readiness.  
> **Previous Part:** PART 37 — Performance / Load Testing  
> **Next Part:** PART 39 — Production Readiness  
> **Status:** Platform Architecture / Business Acceptance Specification  
> **Primary Stack Context:** Java, Spring Boot, PostgreSQL, Kafka, Redis, Docker, Kubernetes, GitLab CI/CD, Argo CD, Terraform, OpenTelemetry  
> **Audience:** Product owners, business owners, QA engineers, backend engineers, platform engineers, release managers, operations/support teams, finance stakeholders, security stakeholders, technical leads.

---

# 10481 — Purpose

User Acceptance Testing (UAT) defines how business stakeholders prove that a release candidate satisfies agreed business needs before production promotion.

UAT answers:

```text
Does the release solve the intended business problem?
Do end-to-end workflows behave as the business expects?
Are calculations, statuses, messages, permissions, and operational outcomes acceptable?
Do partner-facing flows behave correctly in the approved UAT/sandbox environment?
Are known defects understood and accepted?
Is there enough evidence for business sign-off?
```

The central principle is:

```text
QA proves software quality.
Performance testing proves technical capacity.
UAT proves business acceptance.
```

---

# 10482 — Document Role

This chapter is the business-acceptance specification for the microservices platform.

It consumes evidence from earlier architecture, testing, security, performance, environment, CI/CD, and GitOps chapters and converts a stable release candidate into a formal business decision.

---

# 10483 — Previous and Next Parts

```text
Previous:
PART 37 — Performance / Load Testing

Next:
PART 39 — Production Readiness
```

PART 38 does not replace PART 39. UAT sign-off is one required input into the broader production-readiness decision.

---

# 10484 — Primary Platform Context

Primary platform context:

```text
Java / Spring Boot microservices
PostgreSQL
Kafka
Redis
Docker
Kubernetes
GitLab CI/CD
Argo CD
Terraform
OpenTelemetry
```

UAT validates business behavior across these implementation boundaries without requiring business testers to understand their internal mechanics.

---

# 10485 — Audience

Primary audience:

```text
Product Owner
Business Owner
Operations Representative
Finance Representative where money is involved
Store / Customer Support Representative
QA Lead
Backend / Platform Engineers
Release Manager
Security / Compliance Representative where required
```

---

# 10486 — Core UAT Principle

UAT must test a controlled release candidate against explicit acceptance criteria.

It must not become:

```text
another DEV environment
an ad-hoc exploratory playground
a place for arbitrary developer builds
a substitute for automated QA
a substitute for production-readiness review
```

---

# 10487 — UAT Objectives

UAT should provide evidence that:

```text
business journeys are correct
stakeholder expectations are met
financial and loyalty outcomes are understandable
roles and permissions match operations
customer-facing messages are acceptable
partner workflows are usable
release-impacting defects are resolved or accepted
business owners can sign off knowingly
```

---

# 10488 — UAT Non-Objectives

UAT is not the primary place to discover basic unit, API, contract, or integration defects.

Those should already be covered by earlier test levels. UAT focuses on business acceptance and realistic cross-domain behavior.

---

# 10489 — UAT Position in Delivery Flow

Recommended flow:

```text
Developer Verification
      ↓
CI Quality Gates
      ↓
QA / Regression
      ↓
Performance / Security / Specialized Validation
      ↓
Stable Release Candidate
      ↓
UAT
      ↓
Business Sign-Off
      ↓
Staging / Production Rehearsal
      ↓
PART 39 Production Readiness
```

---

# 10490 — UAT vs QA

QA asks whether the implementation behaves correctly according to technical and functional specifications.

UAT asks whether the resulting behavior is acceptable to the business in realistic scenarios.

A release can pass QA and still fail UAT if the workflow is technically correct but operationally wrong, confusing, incomplete, or inconsistent with business expectations.

---

# 10491 — UAT vs Staging

UAT focuses on business acceptance.

Staging focuses on production-like deployment rehearsal.

The same production-candidate digest may move through both, but the questions are different.

---

# 10492 — UAT vs Performance Testing

Official load, stress, spike, and soak tests belong in the PERFORMANCE environment when they could disturb business acceptance.

UAT may verify perceived responsiveness and business timing, but it should not be overloaded by large performance campaigns.

---

# 10493 — UAT vs Production Readiness

UAT sign-off proves business acceptance.

PART 39 will additionally evaluate:

```text
technical readiness
security readiness
operational readiness
support readiness
monitoring
backup / DR
rollback
capacity
change management
```

---

# 10494 — UAT Governance

UAT must have an explicit owner, schedule, scope, release candidate, participant list, entry criteria, exit criteria, and sign-off authority.

---

# 10495 — UAT Owner

The Product Owner or delegated Business Owner normally owns business acceptance.

QA coordinates execution quality, while engineering supports diagnosis and fixes.

---

# 10496 — UAT Coordinator

A UAT coordinator maintains:

```text
test plan
participant schedule
test data
defect list
daily status
retest plan
sign-off evidence
```

---

# 10497 — Business Testers

Business testers should represent real operational roles rather than only technical staff.

Examples include store operations, customer support, finance, marketing/campaign operations, and loyalty administrators.

---

# 10498 — Engineering Role During UAT

Engineering supports:

```text
environment health
logs / traces
defect triage
root-cause analysis
approved fixes
re-deployment
data repair where authorized
```

Engineering should not silently change UAT behavior to make a test pass.

---

# 10499 — QA Role During UAT

QA supports:

```text
test-case quality
traceability
reproduction
evidence capture
regression selection
defect verification
```

---

# 10500 — Release Manager Role

Release management controls candidate identity, change freeze, promotion record, approvals, and the final handoff toward staging/production readiness.

---

# 10501 — Finance Stakeholder

Payment, wallet, refunds, top-ups, promotions affecting money, reconciliation, and financial reports require finance or delegated financial-domain validation where material.

---

# 10502 — Operations Stakeholder

Operational workflows such as store order handling, cancellation, fulfillment, notification, and support tooling should be validated by the teams who will use or support them.

---

# 10503 — Security Stakeholder

Security should participate where the release changes authentication, authorization, sensitive-data handling, privileged access, or regulated workflows.

---

# 10504 — Sign-Off Authority

The organization must define who can give final business sign-off.

Passing test cases without authorized approval is not equivalent to accepted UAT.

---

# 10505 — Decision Rights

Define separately:

```text
who can mark a test passed
who can accept a defect
who can approve UAT completion
who can approve production promotion
```

These may be different people.

---

# 10506 — UAT Entry Criteria

UAT starts only when the release candidate is stable enough for meaningful business evaluation.

---

# 10507 — Functional Entry Gate

Before UAT:

```text
critical automated tests pass
critical E2E tests pass
known blocking QA defects are resolved
contracts are compatible
migrations have been validated
```

---

# 10508 — Security Entry Gate

Required security gates must already pass according to the release risk profile.

UAT is not the place to postpone known critical security issues.

---

# 10509 — Performance Entry Gate

For performance-critical changes, PART 37 evidence should show that the release candidate can meet required load and latency objectives before business sign-off.

---

# 10510 — Environment Entry Gate

The UAT environment must be healthy and known.

Minimum checks include:

```text
infrastructure
Kubernetes workloads
database
Kafka
Redis
DNS/TLS
secrets
partner endpoints
monitoring
test data
```

---

# 10511 — Candidate Identity Gate

Record the exact release candidate:

```text
service versions
image digests
commit SHAs
configuration revision
migration versions
feature-flag state
contract versions
```

---

# 10512 — Migration Entry Gate

Required database migrations must be applied successfully and verified before business testers start dependent scenarios.

---

# 10513 — Data Entry Gate

Required business-realistic test data must be loaded, validated, and isolated from unrelated test cycles.

---

# 10514 — Partner Entry Gate

Partner UAT or sandbox endpoints, credentials, callbacks, and allowlists must be ready before testing integration-dependent journeys.

---

# 10515 — Observability Entry Gate

Logs, metrics, traces, and correlation IDs must be available so failed UAT scenarios can be diagnosed without guesswork.

---

# 10516 — Support Entry Gate

Named engineering and QA contacts must be available during formal UAT windows for blocking issues.

---

# 10517 — Documentation Entry Gate

Business testers should receive:

```text
scope
release notes
test cases
known limitations
environment URL
accounts / roles
expected data
defect-reporting process
```

---

# 10518 — Release Candidate Rule

UAT uses approved release-candidate images, not arbitrary local builds.

---

# 10519 — Immutable Candidate

Every tested service image should be identified by immutable digest or equivalent artifact identity.

---

# 10520 — Build Once

The release candidate should be built once and promoted.

Do not rebuild the application separately for UAT and production.

---

# 10521 — Candidate Manifest

Maintain a candidate manifest containing:

```text
release_id
service
version
image_digest
commit_sha
config_revision
migration_version
feature_flags
build_pipeline
SBOM / scan references
```

---

# 10522 — UAT Change Freeze

During formal acceptance, freeze unrelated deployments.

Only approved changes for blocking defects, environment repair, or explicitly authorized scope changes should enter the environment.

---

# 10523 — Change During UAT

Every change during an active UAT cycle must answer:

```text
Why is it required?
What candidate changed?
Which test cases are invalidated?
Which regression set must rerun?
Who approved the change?
```

---

# 10524 — Candidate Reset

A material code, schema, configuration, or feature-flag change may create a new UAT candidate.

Do not pretend the original candidate was tested if its behavior materially changed.

---

# 10525 — Feature Flag Freeze

Feature flags affecting acceptance scope should be recorded and frozen during a test pass unless the test explicitly validates flag transitions.

---

# 10526 — Configuration Freeze

UAT configuration should not change silently.

Configuration changes are release changes and require traceability.

---

# 10527 — Environment Drift

GitOps / environment drift must be detected before sign-off.

A business test performed against unknown live state is weak evidence.

---

# 10528 — UAT Environment Purpose

UAT exists for:

```text
business acceptance
stakeholder validation
release sign-off
partner UAT validation
operational workflow validation
```

---

# 10529 — UAT Production Similarity

UAT should approximate production in:

```text
service topology
security model
feature structure
API contracts
database engine/version
Kafka semantics
Redis behavior
authentication flow
```

---

# 10530 — Allowed UAT Differences

Expected differences include:

```text
UAT credentials
UAT domains
synthetic/anonymized data
partner sandbox endpoints
smaller infrastructure scale
shorter retention
```

---

# 10531 — Environment Isolation

UAT must be isolated from production data, credentials, Kafka, Redis, object storage, notification recipients, and external side effects.

---

# 10532 — UAT Namespace

When Kubernetes is shared, use a dedicated UAT namespace with explicit RBAC, quotas, NetworkPolicies, service accounts, and secrets.

---

# 10533 — UAT Domain

Use clearly non-production domains to reduce operator mistakes.

Avoid ambiguous names that could be confused with production.

---

# 10534 — UAT TLS

Use valid TLS and realistic certificate behavior so client, gateway, and integration flows are representative.

---

# 10535 — UAT Authentication

Use the same authentication and authorization semantics as production while using UAT-specific identities, keys, and credentials.

---

# 10536 — UAT Kafka

Kafka topics or clusters must be isolated from production.

UAT consumers must never consume production events.

---

# 10537 — UAT Redis

Redis must be environment-isolated or strongly namespaced/ACL-isolated where shared infrastructure is unavoidable.

---

# 10538 — UAT Database

Each service uses its UAT-owned database/schema according to the platform data-ownership model.

Direct cross-service database access remains prohibited.

---

# 10539 — UAT Object Storage

Use UAT-specific buckets/containers and avoid accidental access to production assets or customer uploads.

---

# 10540 — UAT Notifications

Email, SMS, and push delivery must use sandbox providers, separate projects, or recipient allowlists so tests cannot notify real customers unintentionally.

---

# 10541 — UAT Payment Provider

Use payment-provider UAT/sandbox facilities.

Never use real customer financial instruments for ordinary UAT.

---

# 10542 — UAT External Integrations

Every partner integration should have a documented UAT mapping:

```text
endpoint
credential scope
callback/webhook URL
certificate
expected test identifiers
rate/usage limits
owner
```

---

# 10543 — UAT Monitoring

UAT requires enough logs, metrics, traces, and business-event visibility to explain failed acceptance scenarios quickly.

---

# 10544 — UAT Data Strategy

Use:

```text
synthetic
business-realistic
approved anonymized
```

data.

Unrestricted production copies are not acceptable.

---

# 10545 — Representative Relationships

Synthetic data must preserve realistic relationships such as customer → order → payment → loyalty → mission → notification.

---

# 10546 — Data Baseline

Define a known data baseline for each formal UAT cycle so results are reproducible.

---

# 10547 — Data Reset

Automate controlled reset/reseed procedures where repeated execution would otherwise accumulate state and invalidate results.

---

# 10548 — Data Reset Approval

Do not reset shared UAT data while another acceptance cycle depends on it without coordination.

---

# 10549 — Test Accounts

Maintain explicit UAT accounts for customer, staff, admin, support, finance, and other roles needed by the release.

---

# 10550 — Account Ownership

Test accounts should have documented purpose, permissions, expiry, and credential owner.

---

# 10551 — Financial Test Data

Use known test balances, prices, discounts, taxes, wallet amounts, and provider responses so financial assertions are deterministic.

---

# 10552 — Time-Based Data

For expiry, mission periods, coupon windows, and scheduled behavior, prefer controlled test dates/configuration over changing system clocks.

---

# 10553 — Locale Data

Include English and Khmer business content where the product supports both, including Unicode edge cases and fallback behavior.

---

# 10554 — Currency Data

Validate supported currency semantics consistently, including USD/KHR formatting, rounding, conversion rules, and persisted amounts where applicable.

---

# 10555 — Large Data in UAT

UAT data should be realistic enough to expose business-listing, pagination, search, and history behavior, but official scale testing remains in the performance environment.

---

# 10556 — Data Evidence

Important UAT scenarios should capture authoritative before/after state where practical, especially for payments, wallet, loyalty, promotions, missions, and refunds.

---

# 10557 — UAT Plan

Each release or phase should have a UAT plan with:

```text
scope
objectives
participants
schedule
candidate
environment
test data
acceptance criteria
defect rules
entry/exit criteria
sign-off authority
```

---

# 10558 — Scope Baseline

The UAT scope must map to the release scope.

Do not test unrelated future features and then use their failure to block an otherwise scoped release unless they reveal a shared regression.

---

# 10559 — Requirement Traceability

Every material business requirement should map to one or more acceptance scenarios.

---

# 10560 — Change Traceability

Every release item should map to impacted UAT scenarios or an explicit 'no UAT impact' rationale.

---

# 10561 — Risk-Based Prioritization

Prioritize UAT around business risk:

```text
money movement
order completion
customer access
inventory / fulfillment
coupon / reward entitlement
mission progress
refund / cancellation
operational support
partner integration
```

---

# 10562 — Critical Journey Classification

Classify scenarios as:

```text
P0 Critical Business Journey
P1 High-Value Journey
P2 Standard Journey
P3 Low-Risk / Informational
```

Use the organization’s own terminology if different.

---

# 10563 — Acceptance Criteria Quality

Acceptance criteria should be observable, testable, unambiguous, and business-centered.

---

# 10564 — Given-When-Then

Where useful:

```text
Given <business state>
When <business action>
Then <observable business outcome>
```

This format is optional but useful for shared understanding.

---

# 10565 — Acceptance Criteria Must Include Outcome

Avoid criteria such as 'API returns 200' as the only UAT condition.

Business acceptance should include the resulting state and user/operational outcome.

---

# 10566 — Negative Acceptance Cases

UAT should include business-relevant rejection cases such as invalid coupon, insufficient wallet balance, unavailable item, unauthorized action, and expired reward.

---

# 10567 — Boundary Cases

Test business boundaries such as exact minimum spend, expiry instant, daily limit, zero/maximum balance, quantity limit, and status transition boundaries.

---

# 10568 — State Transition Cases

For stateful domains, validate allowed and disallowed transitions, not only the happy path.

---

# 10569 — Cross-Service Traceability

A single business scenario may span many services.

The test remains one business journey even if internally it crosses Order, Payment, Wallet, Loyalty, Mission, Notification, and Integration services.

---

# 10570 — Test Case Identifier

Use stable UAT case identifiers so defects, evidence, sign-off, and regression runs can reference the same scenario.

---

# 10571 — Test Case Versioning

When business rules change, version or update the test case with traceable history.

---

# 10572 — Expected Result Source

Expected results must come from approved business rules, requirements, or signed-off examples—not from whatever the current implementation happens to do.

---

# 10573 — UAT Execution Cycle

Typical cycle:

```text
prepare candidate
verify environment
load baseline data
run smoke
execute business cases
record evidence
log defects
triage
deploy approved fixes
retest
run targeted regression
sign off
```

---

# 10574 — UAT Smoke Test

Before opening the environment to business users, verify:

```text
login
catalog/menu
basic order path
database connectivity
Kafka flow
Redis-dependent reads
partner sandbox connectivity
notification safety
```

---

# 10575 — Daily Environment Check

During active UAT, run a lightweight health check before formal sessions to avoid wasting business-user time on environment outages.

---

# 10576 — Execution Evidence

For important cases capture enough evidence to prove the outcome:

```text
case ID
tester
time
candidate ID
inputs
expected result
actual result
screenshots/logical records where appropriate
correlation/order/reference ID
pass/fail
```

---

# 10577 — Evidence Privacy

Do not capture passwords, tokens, secrets, full payment credentials, or unnecessary personal information in UAT evidence.

---

# 10578 — Correlation IDs

Record correlation IDs or stable business references for failed complex journeys so engineering can find relevant traces/logs quickly.

---

# 10579 — Independent Reproduction

A defect should be reproducible from documented preconditions where practical.

---

# 10580 — Exploratory UAT

Exploratory business testing is useful in addition to scripted cases, especially for operational usability and unusual business sequences.

Exploratory findings still enter the normal defect workflow.

---

# 10581 — Session-Based UAT

For high-touch business areas, time-boxed sessions with a charter can complement scripted tests.

---

# 10582 — Do Not Hide Workarounds

If a scenario only passes with a manual workaround, record that workaround and determine whether the business explicitly accepts it.

---

# 10583 — Manual Data Repair

Manual data repair during UAT must be tracked because it may invalidate the scenario and hide product defects.

---

# 10584 — Rerun After Repair

After environment or data repair, rerun affected test cases from a clean or documented state.

---

# 10585 — Identity UAT

Validate customer and staff authentication from a business perspective:

```text
registration/login
logout
session expiry
password reset
locked/disabled account behavior
role access
```

---

# 10586 — Password Reset UAT

Verify understandable OTP/challenge flow, resend/cooldown messaging, expiry, successful reset, and post-reset login behavior.

---

# 10587 — Customer Profile UAT

Validate profile viewing/updating, contact data, membership references, preferences, consent behavior, and expected propagation to dependent experiences.

---

# 10588 — Role and Permission UAT

Business representatives must confirm that each role can perform required work and cannot access prohibited functions.

---

# 10589 — Object Authorization UAT

Where business users can access customer/order/reward resources, verify that one customer or operator cannot see another party’s data beyond authorized scope.

---

# 10590 — Admin Permission UAT

Admin functions should be exercised using realistic roles rather than one all-powerful account.

---

# 10591 — Catalog UAT

Validate product names, Khmer/English text, categories, prices, modifiers, store/channel visibility, and effective-time behavior.

---

# 10592 — Menu Publication UAT

Verify that business-approved menu changes appear as one coherent published state rather than partially updated content.

---

# 10593 — Store-Specific Catalog UAT

Confirm that each selected store/channel exposes only the intended sellable menu and pricing.

---

# 10594 — Modifier UAT

Test required/optional modifier selections, min/max selection counts, sub-modifiers, pricing effects, and invalid combinations.

---

# 10595 — Inventory Availability UAT

Validate visible availability against configured stock/fulfillment behavior, including out-of-stock and recovery scenarios.

---

# 10596 — Cart UAT

Validate add/update/remove items, quantities, modifiers, store changes, pricing previews, promotion previews, guest/authenticated behavior, and expiration where applicable.

---

# 10597 — Cart Staleness UAT

Confirm that stale cart pricing or availability is revalidated during checkout and produces understandable customer behavior.

---

# 10598 — Ordering Happy Path UAT

Validate the full ordering journey from cart through accepted order and final completion for each supported fulfillment mode.

---

# 10599 — Pickup UAT

Validate pickup-specific store selection, timing, status progression, messages, and completion behavior.

---

# 10600 — Dine-In UAT

Validate dine-in-specific context, order creation, status progression, and store operational handling.

---

# 10601 — Delivery UAT

Validate address, delivery eligibility, fees, partner/status integration where applicable, and customer-facing status transitions.

---

# 10602 — Order Status UAT

Business stakeholders must approve status names, transitions, operational meaning, and customer presentation.

---

# 10603 — Order Snapshot UAT

Verify completed orders preserve the intended product, modifier, store, price, discount, and customer-facing snapshot even if master data changes later.

---

# 10604 — Order Cancellation UAT

Validate who may cancel, when cancellation is allowed, resulting status, inventory release, payment/wallet reversal, coupon behavior, and customer notification.

---

# 10605 — Order Duplicate Submission UAT

Simulate user retry/double tap where practical and verify one intended business order is created.

---

# 10606 — Order History UAT

Verify history completeness, sorting, statuses, amounts, store details, and access control.

---

# 10607 — Payment UAT

Validate each supported payment method using provider UAT/sandbox behavior.

---

# 10608 — Payment Authorization UAT

Confirm success, decline, timeout, cancellation, and unknown-result handling produce correct order/customer outcomes.

---

# 10609 — Payment Capture UAT

Where authorization/capture are separate, verify capture timing and failure handling match business policy.

---

# 10610 — Payment Callback UAT

Validate provider callback/webhook processing, duplicate callbacks, delayed callbacks, and stable external references.

---

# 10611 — Payment Refund UAT

Validate full/partial refund cases supported by the business, including resulting order state and customer-visible information.

---

# 10612 — Unknown Payment Outcome UAT

If provider outcome is uncertain, verify the system does not blindly charge again and exposes an appropriate pending/recovery state.

---

# 10613 — Wallet Balance UAT

Validate opening balance, top-up, reserve, capture, release, refund, adjustment, and visible balance semantics.

---

# 10614 — Wallet Top-Up UAT

Validate successful, failed, duplicate, delayed, and reconciled top-up outcomes using approved provider test paths.

---

# 10615 — Wallet Insufficient Balance UAT

Verify checkout is rejected safely and messaging is understandable without corrupting balance or order state.

---

# 10616 — Wallet Double-Spend UAT

Business-facing concurrent or repeated actions should not produce impossible balance outcomes.

---

# 10617 — Financial Amount UAT

Confirm:

```text
subtotal
discount
fee
tax where applicable
grand total
paid amount
refunded amount
wallet movement
```

match approved business examples.

---

# 10618 — Financial Rounding UAT

Validate currency and rounding rules at boundary values with known expected calculations.

---

# 10619 — Financial Reconciliation UAT

For critical flows, compare application-visible results with authoritative payment/wallet/provider records expected in UAT.

---

# 10620 — Promotion UAT

Validate eligibility, discount amount, time/store/channel/product scope, minimum spend, stacking, limits, and messages.

---

# 10621 — Coupon UAT

Validate issuance, assignment, single/multi-use behavior, reservation, redemption, release, expiry, and per-customer/global limits.

---

# 10622 — Coupon Reuse UAT

Verify a redeemed single-use coupon cannot be reused, including after retries or duplicate requests.

---

# 10623 — Promotion Boundary UAT

Test exact threshold values and near-threshold values for minimum spend, quantity, date/time, and usage counts.

---

# 10624 — Loyalty Earn UAT

Validate points/rewards earned from eligible completed transactions and confirm ineligible transactions do not earn.

---

# 10625 — Loyalty Redeem UAT

Validate redemption amount, balance impact, order relationship, cancellation/reversal behavior, and customer history.

---

# 10626 — Loyalty Expiry UAT

Validate expiry timing, messages, balance/history effects, and timezone interpretation.

---

# 10627 — Tier UAT

Validate tier qualification, progress, upgrade/downgrade behavior, and customer-facing representation.

---

# 10628 — Reward Assignment UAT

Validate reward eligibility, assignment, visibility, validity, claim behavior, and duplicate prevention.

---

# 10629 — Mission Visibility UAT

Validate who should see each journey/campaign mission based on user period, registration timing, mission timing, prior completion, status, and eligibility.

---

# 10630 — Mission Progress UAT

Validate progress increments only from qualifying business events and does not double-count retries/duplicates.

---

# 10631 — Mission Completion UAT

Validate target completion, completion messages, reward trigger/assignment, and post-completion state.

---

# 10632 — Mission Period UAT

Test period start/end boundaries, late registration, pre-period completion, expiry, reset, and recurring/cycle rules where configured.

---

# 10633 — Mission Distinct-Value UAT

For missions such as exploring multiple stores, validate distinct-value semantics rather than simple event count.

---

# 10634 — First-Action Mission UAT

For first top-up, first pickup, first dine-in, and first feedback-style missions, prove only the intended first qualifying action completes progress.

---

# 10635 — Digital Stamp / Reward UAT

Where digital stamp behavior is in scope, validate purchase qualification, milestone progress, completion, reward assignment, expiry, and unclaimed-reward handling against approved rules.

---

# 10636 — Notification UAT

Validate that business events generate the intended communication without making notification delivery a prerequisite for core transaction success unless explicitly required.

---

# 10637 — Notification Localization UAT

Verify correct Khmer/English template, variables, formatting, fallback, and customer context.

---

# 10638 — Notification Preference UAT

Where supported, validate channel preferences, opt-out, quiet hours, and critical-notification exceptions.

---

# 10639 — Notification Dedupe UAT

Repeated events/retries should not produce duplicate customer notifications beyond approved semantics.

---

# 10640 — Integration / ACL UAT

Validate external/legacy identifiers, status mappings, amount/currency mapping, store mappings, error translation, retry behavior, and reconciliation from a business perspective.

---

# 10641 — Legacy Coexistence UAT

During strangler migration, validate that new and legacy paths produce compatible business outcomes for scoped scenarios.

---

# 10642 — Partner Webhook UAT

Validate signature/authentication where applicable, payload mapping, duplicate delivery, retry, out-of-order messages, and business outcome.

---

# 10643 — Partner Failure UAT

Use approved sandbox/mock controls to verify business behavior when a partner is unavailable, slow, or returns an error.

---

# 10644 — Provider Rate Limit UAT

Where provider throttling is business-visible, verify safe behavior and customer/operator messaging.

---

# 10645 — Store Operations UAT

Store users should validate the workflow they actually perform: receive, accept, prepare, fulfill, cancel, and troubleshoot orders according to the release scope.

---

# 10646 — Customer Support UAT

Support representatives should validate that they can locate required customer/order/payment/reward information and understand statuses without unsafe database access.

---

# 10647 — Admin Portal UAT

Validate creation/editing/publication/status-change workflows with correct permissions, validation, confirmation dialogs, pagination/filtering, and audit expectations.

---

# 10648 — Bulk Operation UAT

If bulk admin actions exist, validate scope preview, confirmation, partial failure handling, retry, and audit.

---

# 10649 — Audit Trail UAT

For sensitive admin/business actions, verify the organization can determine who changed what and when.

---

# 10650 — Operational Message UAT

Error and warning messages should tell business users enough to act without exposing sensitive internals.

---

# 10651 — Supportability UAT

A failed business journey should expose a stable reference that support/engineering can use for investigation.

---

# 10652 — Manual Recovery UAT

Where an approved manual recovery workflow exists, validate it with least privilege, audit, and safe idempotent behavior.

---

# 10653 — Business Usability

UAT should evaluate whether workflows are understandable and practical, not only whether data eventually becomes correct.

---

# 10654 — Responsive Behavior UAT

For supported mobile/web/admin surfaces, validate representative screen sizes and critical workflows.

---

# 10655 — Localization UAT

Validate translated title, description, rule, progress text, conditions, and action labels where applicable.

---

# 10656 — Khmer Encoding UAT

Verify Khmer content persists, searches, renders, sorts, and transmits correctly without encoding corruption.

---

# 10657 — Date / Time UAT

Validate displayed local time, stored UTC semantics, cutoff times, expiry, schedules, and daylight/timezone assumptions relevant to the business.

---

# 10658 — Currency Presentation UAT

Validate symbols, decimal precision, separators, converted amounts, and receipts/customer screens according to approved rules.

---

# 10659 — Accessibility Acceptance

Where accessibility requirements exist, include business acceptance for keyboard/navigation/readability/labels or other required criteria.

---

# 10660 — Error Message Acceptance

Business owners should approve important customer-facing messages for declined payments, invalid coupons, unavailable products, expired rewards, and other common failures.

---

# 10661 — UAT Defect Workflow

Every failed acceptance scenario enters a controlled defect workflow unless clearly identified as environment/test-data issue.

---

# 10662 — Defect Minimum Fields

Record:

```text
defect_id
UAT_case_id
candidate_id
environment
preconditions
steps
expected
actual
business impact
severity
evidence
correlation/reference ID
owner
status
```

---

# 10663 — Defect Classification

Classify at least:

```text
application defect
configuration defect
test-data defect
environment/infrastructure defect
partner defect
requirement/acceptance ambiguity
known limitation
```

---

# 10664 — Severity vs Priority

Severity describes impact.

Priority describes repair urgency.

Do not treat them as automatically identical.

---

# 10665 — Blocker Defect

A blocker prevents execution of a critical acceptance journey or makes the release unusable/unsafe for its intended business purpose.

---

# 10666 — Critical Defect

A critical defect causes severe business, financial, security, data-integrity, or operational risk and normally blocks sign-off.

---

# 10667 — Major Defect

A major defect materially impairs an important workflow and requires explicit disposition before sign-off.

---

# 10668 — Minor Defect

A minor defect has limited business impact and may be accepted with owner and remediation plan when policy allows.

---

# 10669 — Cosmetic Defect

Visual or wording defects may be accepted if they do not violate brand, legal, accessibility, or operational requirements.

---

# 10670 — Defect Triage

Triage should include business, QA, and engineering perspectives for material defects.

---

# 10671 — Business Impact Assessment

Triage should ask:

```text
Who is affected?
How often?
Is money/data at risk?
Is there a workaround?
Does it block a critical journey?
Can it worsen in production?
```

---

# 10672 — Root Cause vs UAT Disposition

UAT does not require full root-cause analysis before every decision, but blocking issues must be understood enough to assess risk and verify a safe fix.

---

# 10673 — Accepted Defect

An accepted defect requires:

```text
documented impact
business owner
risk acceptance
workaround if any
target remediation
expiry/review if appropriate
```

---

# 10674 — No Silent Waivers

A failed case must not be converted to pass by informal agreement in chat or verbally.

Acceptance exceptions require recorded approval.

---

# 10675 — Duplicate Defect

Duplicate defects should link to one canonical issue while preserving affected UAT cases.

---

# 10676 — Partner-Owned Defect

A partner defect still needs platform disposition: block, workaround, partner commitment, feature disablement, or accepted risk.

---

# 10677 — Environment Defect

Environment failure does not count as product failure, but affected cases remain not executed/not valid until rerun successfully.

---

# 10678 — UAT Fix Policy

Only approved fixes should enter the UAT candidate during formal acceptance.

---

# 10679 — Fix Verification

The originally failing case must be retested after the fix.

---

# 10680 — Regression Selection

Choose regression based on impact analysis:

```text
changed service/module
shared contracts
database migration
events
feature flags
security
dependent business journeys
```

---

# 10681 — Full Regression Trigger

A full or broad regression may be required when the change affects shared authentication, gateway behavior, order/payment core, common contracts, migrations, or platform infrastructure.

---

# 10682 — Candidate Version After Fix

Record the new image digest/config/migration state after every approved fix.

---

# 10683 — Retest Evidence

Retest evidence should reference both the defect and the exact corrected candidate.

---

# 10684 — Reopened Defect

If expected behavior is still not met, reopen rather than creating an unrelated pass record.

---

# 10685 — Regression Failure

A fix that introduces a new release-blocking regression can invalidate previous sign-off scope.

---

# 10686 — Fix Freeze Cutoff

Define a cutoff after which only release-blocking fixes are allowed so the candidate can stabilize for final sign-off.

---

# 10687 — UAT Exit Criteria

UAT can complete when:

```text
planned critical cases executed
required acceptance criteria passed
blocking defects resolved
accepted defects documented
required regression completed
candidate identity frozen
business owner approves
evidence retained
```

---

# 10688 — Execution Completion Is Not Sign-Off

100% test execution does not automatically mean acceptance.

Sign-off is an explicit business decision.

---

# 10689 — Pass Rate

Pass rate is useful context but should not override risk.

One critical failed case may matter more than dozens of low-risk passes.

---

# 10690 — Not Executed Cases

Any unexecuted case must have a disposition:

```text
out of scope
deferred
blocked
not applicable
accepted risk
must execute before release
```

---

# 10691 — Known Limitation Review

Known limitations should be reviewed with affected stakeholders before sign-off.

---

# 10692 — Open Defect Review

Before sign-off, review every open UAT defect with severity, business impact, workaround, owner, and target remediation.

---

# 10693 — Conditional Sign-Off

Conditional sign-off is allowed only if governance permits and conditions are explicit, measurable, owned, and satisfied before the defined gate.

---

# 10694 — Rejected UAT

If business acceptance fails, the release candidate must not be represented as UAT-approved.

---

# 10695 — UAT Sign-Off Record

Record:

```text
release_id
candidate/digests
scope
environment
test summary
open accepted defects
known limitations
approver
decision
date/time
conditions
```

---

# 10696 — Electronic Approval

Approval may be recorded in an approved ticket, release system, workflow, or signed document, provided identity and audit history are preserved.

---

# 10697 — Go / No-Go Input

UAT provides a business **GO / NO-GO recommendation**.

PART 39 combines this with technical, security, operational, and recovery readiness.

---

# 10698 — Sign-Off Expiry

If the candidate materially changes after sign-off, the organization should define when UAT approval is invalidated and must be refreshed.

---

# 10699 — Configuration Change After Sign-Off

A material configuration or feature-flag change after UAT sign-off requires impact review and potentially targeted re-acceptance.

---

# 10700 — Migration Change After Sign-Off

A changed production migration after UAT/staging validation requires renewed migration review and affected UAT/regression as appropriate.

---

# 10701 — UAT Status Reporting

Daily or cycle status should summarize:

```text
planned
passed
failed
blocked
not executed
open defects by severity
environment issues
candidate version
decisions needed
```

---

# 10702 — UAT Dashboard

A lightweight dashboard can show execution progress, blocker aging, candidate history, and readiness without exposing sensitive data.

---

# 10703 — Defect Aging

Track how long blocker/critical defects remain unresolved during the acceptance window.

---

# 10704 — Retest Turnaround

Measure time from fix availability to business retest where it improves release flow.

---

# 10705 — Escape Learning

Production defects that should have been caught by UAT should feed new acceptance cases or clearer criteria.

---

# 10706 — False Blocker Learning

Repeated environment/test-data failures should create environment reliability improvements rather than permanent manual workarounds.

---

# 10707 — UAT Metrics Are Not Targets

Do not game pass percentage or case count.

The objective is justified business confidence.

---

# 10708 — Release Comparison

For recurring releases, compare defect density, reopened defects, acceptance duration, and escaped UAT issues for process improvement.

---

# 10709 — Automation in UAT

Automation supports UAT but does not replace business judgment.

---

# 10710 — Automated Pre-UAT Regression

Run automated regression before formal business execution so testers spend time on acceptance rather than basic defects.

---

# 10711 — Automated Smoke

Automate repeatable environment/candidate smoke checks after every approved UAT deployment.

---

# 10712 — Automated Data Setup

Use scripts/jobs for deterministic data setup when possible.

---

# 10713 — Automated Evidence

CI/CD, GitOps, and observability can attach candidate metadata, deployment time, config revision, and health evidence automatically.

---

# 10714 — Business Scenario Automation

Stable high-value UAT scenarios may later become automated regression tests, while the business acceptance layer remains.

---

# 10715 — Do Not Automate Ambiguity

Do not encode an unclear business rule into automation merely to make UAT faster.

Clarify the rule first.

---

# 10716 — Risk-Based UAT Depth

UAT depth should scale with release risk.

A wording-only admin change does not need the same scope as a new checkout/payment flow.

---

# 10717 — High-Risk Release

High-risk examples:

```text
payment provider change
wallet ledger change
order Saga change
promotion calculation change
mission period/reward logic change
auth/password reset change
major migration
legacy cutover
```

---

# 10718 — Low-Risk Release

Low-risk examples may include isolated non-critical text or display metadata changes with no shared contract/data impact.

---

# 10719 — Financial Release Rule

Changes involving real-money behavior require explicit amount, duplicate, reversal/refund, failure, reconciliation, and audit scenarios.

---

# 10720 — Security-Sensitive Release Rule

Changes to identity or permissions require positive and negative role/access acceptance where business roles are affected.

---

# 10721 — Data Migration Release Rule

Data migrations require business validation of migrated records and critical historical views, not only schema success.

---

# 10722 — Legacy Migration Release Rule

Strangler/cutover releases should validate both migrated behavior and fallback/rollback assumptions relevant to business operations.

---

# 10723 — Campaign Release Rule

Major promotion/mission/reward launches require eligibility, limits, timing, localization, reward inventory, notification, and support scenarios.

---

# 10724 — Identity / Customer UAT Coverage Matrix

Minimum business coverage should include:

```text
registration, login, reset, roles, profile, membership identity, consent
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10725 — Catalog UAT Coverage Matrix

Minimum business coverage should include:

```text
products, categories, prices, modifiers, store/channel visibility, publication
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10726 — Inventory UAT Coverage Matrix

Minimum business coverage should include:

```text
availability, reservation, release, deduction, concurrent stock behavior
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10727 — Cart UAT Coverage Matrix

Minimum business coverage should include:

```text
item editing, previews, revalidation, guest/authenticated behavior
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10728 — Ordering UAT Coverage Matrix

Minimum business coverage should include:

```text
checkout, fulfillment mode, statuses, cancellation, history, idempotency
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10729 — Payment UAT Coverage Matrix

Minimum business coverage should include:

```text
authorize, capture, decline, timeout, callback, refund, unknown outcome
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10730 — Wallet UAT Coverage Matrix

Minimum business coverage should include:

```text
top-up, reserve, capture, release, refund, balance, ledger-visible outcome
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10731 — Loyalty UAT Coverage Matrix

Minimum business coverage should include:

```text
earn, redeem, tier, expiry, reward assignment/claim
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10732 — Promotion / Coupon UAT Coverage Matrix

Minimum business coverage should include:

```text
eligibility, calculation, stacking, reservation, redemption, limits
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10733 — Mission UAT Coverage Matrix

Minimum business coverage should include:

```text
visibility, period, progress, completion, reward trigger, expiry/reset
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10734 — Notification UAT Coverage Matrix

Minimum business coverage should include:

```text
template, language, routing, preference, dedupe, delivery status
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10735 — Integration / ACL UAT Coverage Matrix

Minimum business coverage should include:

```text
mapping, external references, webhooks, retries, reconciliation, legacy coexistence
happy path
business rejection path
duplicate/retry where relevant
authorization
customer/operator message
audit/history
recovery or reversal where relevant
```

---

# 10736 — Cross-Domain Checkout UAT

A full checkout scenario should prove the business result across Catalog, Inventory, Promotion, Order, Payment/Wallet, and downstream events without requiring the tester to call internal services manually.

---

# 10737 — Cross-Domain Cancellation UAT

Cancellation should validate the combined outcome:

```text
Order state
Inventory release
Payment/wallet reversal
Coupon restoration policy
Loyalty/mission consequences
Notification
Audit history
```

---

# 10738 — Cross-Domain Completion UAT

Completion should validate durable order completion and downstream eventual outcomes such as loyalty, mission progress, rewards, and notification.

---

# 10739 — Eventual Consistency UAT

When downstream outcomes are asynchronous, acceptance criteria must define an acceptable completion window rather than assuming immediate consistency.

---

# 10740 — Retry / Duplicate UAT

Where the user or partner can retry, UAT should validate that duplicates do not create extra orders, charges, balance movements, coupon use, rewards, or mission progress.

---

# 10741 — Out-of-Order Event UAT

For partner/event-driven business statuses where order matters, validate the business-visible handling of delayed or out-of-order updates when supported by the test environment.

---

# 10742 — Partial Failure UAT

Validate that a failure in a secondary capability such as notification does not incorrectly reverse a valid core transaction unless business policy requires it.

---

# 10743 — Recovery UAT

For selected critical workflows, validate that a transient dependency failure followed by recovery produces the intended final business state.

---

# 10744 — Reconciliation UAT

Where reconciliation can change or confirm state, business owners should validate resulting status, history, and operator visibility.

---

# 10745 — UAT Calendar

Coordinate UAT windows with business availability, partner UAT windows, campaign calendars, store operations, and planned freezes.

---

# 10746 — Release Notes

Release notes for UAT should explain business-visible changes, not only technical commits.

---

# 10747 — Known Issues List

Publish a current known-issues list so testers can distinguish accepted limitations from new defects.

---

# 10748 — Communication Channel

Use an agreed channel for UAT coordination, but keep formal decisions and defect disposition in auditable systems.

---

# 10749 — Blocking Incident Procedure

If the UAT environment is broadly unavailable, pause the affected test window, record the incident, restore a known state, and rerun invalidated cases.

---

# 10750 — Partner Coordination

For partner-dependent UAT, confirm partner contact, test window, test account/reference conventions, callback readiness, and escalation path.

---

# 10751 — Change Freeze Exceptions

Emergency UAT changes require named approval and impact analysis.

---

# 10752 — UAT Restart Criteria

A major candidate replacement, database reset, integration reconfiguration, or shared-auth change may require restarting part or all of the acceptance cycle.

---

# 10753 — Sensitive Data in UAT

UAT must not require production secrets or unrestricted customer data.

Use synthetic or approved anonymized information.

---

# 10754 — Secrets in Evidence

Mask or omit access tokens, refresh tokens, OTPs, API keys, private keys, provider credentials, and sensitive payment details from screenshots and logs.

---

# 10755 — Privilege Escalation Acceptance

Business-role testing should include attempts to access restricted functions where the release changes permission boundaries.

---

# 10756 — UAT Access Lifecycle

Grant UAT access only to participants who need it and remove/expire temporary access after the cycle.

---

# 10757 — Shared Account Warning

Prefer named test identities where audit matters.

Shared admin accounts reduce accountability.

---

# 10758 — Production Endpoint Guard

UAT network/configuration guardrails should prevent accidental calls to production payment, notification, ERP, or other side-effecting endpoints.

---

# 10759 — UAT Plan Template

```text
Release:
Scope:
Business Owner:
UAT Coordinator:
Candidate:
Environment:
Start / End:
Participants:
Entry Criteria:
Critical Journeys:
Data Baseline:
Partner Dependencies:
Defect Policy:
Exit Criteria:
Sign-Off Authority:
```

---

# 10760 — UAT Test Case Template

```text
Case ID:
Requirement / Story:
Priority:
Role:
Preconditions:
Test Data:
Given:
When:
Then:
Expected Business State:
Expected Message / UI:
Expected Downstream Outcome:
Evidence:
Result:
```

---

# 10761 — UAT Defect Template

```text
Defect ID:
Case ID:
Release / Candidate:
Environment:
Severity:
Priority:
Business Impact:
Preconditions:
Steps:
Expected:
Actual:
Reference / Correlation ID:
Evidence:
Owner:
Disposition:
Retest Result:
```

---

# 10762 — UAT Sign-Off Template

```text
Release:
Candidate / Image Digests:
Configuration Revision:
Migration Versions:
Scope:
Cases Planned / Passed / Failed / Blocked:
Open Accepted Defects:
Known Limitations:
Conditions:
Business Decision: GO / NO-GO / CONDITIONAL
Business Approver:
QA Confirmation:
Release Manager:
Date:
```

---

# 10763 — UAT Daily Status Template

```text
Candidate:
Environment Health:
Executed Today:
Passed:
Failed:
Blocked:
New Critical/Major Defects:
Fixed / Retested:
Decisions Needed:
Next Focus:
```

---

# 10764 — Acceptance Traceability Template

```text
Requirement
→ UAT Case(s)
→ Result
→ Defect(s)
→ Final Disposition
→ Sign-Off Reference
```

---

# 10765 — Open Defect Acceptance Template

```text
Defect:
Business Impact:
Affected Users:
Workaround:
Residual Risk:
Why Release May Proceed:
Owner:
Target Fix:
Approver:
Review/Expiry:
```

---

# 10766 — Candidate Inventory Template

```text
Service:
Version:
Image Digest:
Commit SHA:
Config Revision:
Migration Version:
Feature Flags:
Contract Version:
Deployment Time:
```

---

# 10767 — UAT Preparation Checklist

- [ ] Scope approved.
- [ ] Business owner named.
- [ ] UAT coordinator named.
- [ ] Candidate frozen.
- [ ] Environment healthy.
- [ ] Data baseline loaded.
- [ ] Test accounts ready.
- [ ] Partner UAT endpoints ready.
- [ ] Notification safeguards enabled.
- [ ] Test cases reviewed.
- [ ] Entry gates passed.
- [ ] Support contacts available.

---

# 10768 — Business Journey Checklist

- [ ] Happy path.
- [ ] Rejection path.
- [ ] Boundary values.
- [ ] Duplicate/retry.
- [ ] Cancellation/reversal.
- [ ] Role/permission.
- [ ] Message/localization.
- [ ] History/audit.
- [ ] Downstream eventual outcome.
- [ ] Supportability.

---

# 10769 — Financial UAT Checklist

- [ ] Exact amount.
- [ ] Currency.
- [ ] Rounding.
- [ ] Duplicate prevention.
- [ ] Failure.
- [ ] Timeout/unknown.
- [ ] Refund/reversal.
- [ ] Ledger/provider evidence.
- [ ] Reconciliation.
- [ ] Audit.

---

# 10770 — Mission / Promotion Checklist

- [ ] Eligibility.
- [ ] User period/time window.
- [ ] Store/channel scope.
- [ ] Amount/quantity threshold.
- [ ] Usage/progress limit.
- [ ] Duplicate prevention.
- [ ] Expiry.
- [ ] Completion/reward.
- [ ] Khmer/English text.
- [ ] Admin configuration.

---

# 10771 — Environment Checklist

- [ ] UAT-only credentials.
- [ ] UAT-only domains.
- [ ] UAT databases.
- [ ] Kafka isolation.
- [ ] Redis isolation.
- [ ] UAT object storage.
- [ ] Sandbox/UAT partners.
- [ ] Notification allowlist.
- [ ] TLS valid.
- [ ] Monitoring available.
- [ ] Drift clean.

---

# 10772 — Defect Review Checklist

- [ ] Correct classification.
- [ ] Severity justified.
- [ ] Business impact stated.
- [ ] Reproducible evidence.
- [ ] Candidate identified.
- [ ] Owner assigned.
- [ ] Fix/accept/defer decision.
- [ ] Retest complete if fixed.
- [ ] Risk approval if accepted.

---

# 10773 — Final Sign-Off Checklist

- [ ] Critical scenarios passed.
- [ ] Required regression passed.
- [ ] No unresolved blocker.
- [ ] Critical defects resolved/approved per policy.
- [ ] Accepted defects documented.
- [ ] Candidate unchanged since final validation.
- [ ] Environment issues resolved.
- [ ] Partner acceptance complete where needed.
- [ ] Business owner signed.
- [ ] Evidence retained.
- [ ] Handoff package ready for PART 39.

---

# 10774 — Anti-Pattern: UAT as DEV

Reject continuous arbitrary developer deployments during formal acceptance.

---

# 10775 — Anti-Pattern: Testing Unknown Candidate

Reject UAT where the exact image/config/migration version cannot be identified.

---

# 10776 — Anti-Pattern: Rebuild for Production

Do not rebuild a different binary/image after UAT and call it the same accepted release.

---

# 10777 — Anti-Pattern: Production Data Copy

Do not copy unrestricted production customer data into UAT for convenience.

---

# 10778 — Anti-Pattern: Real Customer Notifications

Do not allow UAT to send accidental push/SMS/email to real customers.

---

# 10779 — Anti-Pattern: Pass by Workaround

A hidden manual correction is not a passed business workflow.

---

# 10780 — Anti-Pattern: Verbal Defect Acceptance

Risk acceptance must be recorded.

---

# 10781 — Anti-Pattern: Pass Rate Only

A high pass percentage does not compensate for a failed critical money or order journey.

---

# 10782 — Anti-Pattern: Technical Tester Only

UAT without real business representation becomes another QA cycle.

---

# 10783 — Anti-Pattern: No Negative Cases

Happy-path-only UAT misses important business rejection and recovery behavior.

---

# 10784 — Anti-Pattern: No Retest

A defect marked fixed without rerunning the affected acceptance scenario is not verified.

---

# 10785 — Anti-Pattern: Changing Expected Result

Do not rewrite acceptance criteria simply to match buggy implementation unless the business requirement itself was formally changed.

---

# 10786 — Anti-Pattern: Production Load in UAT

Do not run disruptive load/stress tests in shared UAT; use the performance environment.

---

# 10787 — Anti-Pattern: UAT Sign-Off Equals Production Approval

UAT approval is necessary business evidence, not the entire production-readiness decision.

---

# 10788 — Minimum Viable UAT Standard

Before first production launch, UAT must have:

```text
stable release candidate
controlled UAT environment
business owner
critical journey cases
business-realistic test data
defect workflow
retest/regression
explicit sign-off
traceable evidence
```

---

# 10789 — Mature UAT Standard

A mature process adds:

```text
risk-based scope generation
automated environment preflight
candidate inventory automation
test-data automation
partner test orchestration
trace/evidence integration
historical defect analytics
release-risk dashboards
continuous learning from production escapes
```

---

# 10790 — UAT Governance Rule

Architecture/release governance should reject business sign-off based on an unknown candidate, uncontrolled environment, missing critical-case evidence, or undocumented accepted defects.

---

# 10791 — UAT Evidence Retention

Retain UAT evidence according to release, audit, financial, and compliance needs.

Retention duration is organization-specific.

---

# 10792 — UAT Auditability

It should be possible to reconstruct:

```text
what was tested
against which candidate
by whom
with which result
which defects remained
who accepted the release
```

---

# 10793 — UAT Continuous Improvement

After each major release, identify:

```text
missed scenarios
unclear criteria
environment pain
slow defect turnaround
escaped defects
unnecessary manual work
```

and improve the next cycle.

---

# 10794 — UAT Readiness Review

Before starting formal UAT, run a short review covering scope, candidate, environment, data, participants, test cases, partner dependencies, and entry gates.

---

# 10795 — UAT Completion Review

Before sign-off, review test results, residual defects, candidate identity, changed scope, workarounds, and unresolved business questions.

---

# 10796 — UAT and PART 25

PART 25 defines the overall testing strategy.

PART 38 turns acceptance/BDD guidance and release evidence into a formal business acceptance process.

---

# 10797 — UAT and PART 28

PART 28 defines the UAT environment as controlled business acceptance using release-candidate images, business-realistic data, UAT credentials/domains, and partner UAT/sandbox endpoints.

---

# 10798 — UAT and PART 31

Observability supplies correlation, logs, metrics, and traces needed to diagnose failed UAT journeys.

---

# 10799 — UAT and PART 32

CI/CD produces verified release artifacts and candidate metadata.

UAT consumes those artifacts; it does not rebuild them.

---

# 10800 — UAT and PART 33

GitOps keeps UAT desired state traceable and helps prevent undocumented drift during acceptance.

---

# 10801 — UAT and PART 35

Security hardening defines required security controls.

UAT validates business-facing permission and security behavior but does not replace penetration/security testing.

---

# 10802 — UAT and PART 36

Backup/DR testing remains a specialized technical concern.

UAT may validate selected business recovery outcomes where they affect acceptance.

---

# 10803 — UAT and PART 37

PART 37 proves capacity and latency under load.

PART 38 proves that business workflows and outcomes are acceptable.

---

# 10804 — UAT and PART 39

PART 39 consumes UAT sign-off as one evidence stream alongside security, operations, observability, capacity, rollback, backup/DR, deployment, and support readiness.

---

# 10805 — PART 38 Deliverables

PART 38 produces:

1. UAT purpose and boundary.
2. UAT governance and ownership.
3. Entry criteria.
4. Release-candidate control.
5. Change-freeze rules.
6. UAT environment rules.
7. Data strategy.
8. Partner UAT strategy.
9. Test planning and traceability.
10. Acceptance-criteria standard.
11. Execution/evidence standard.
12. Identity/customer acceptance coverage.
13. Catalog/inventory/cart acceptance coverage.
14. Ordering acceptance coverage.
15. Payment/wallet acceptance coverage.
16. Loyalty/promotion/mission acceptance coverage.
17. Notification/integration acceptance coverage.
18. Store/support/admin workflow coverage.
19. Localization/time/currency acceptance.
20. Defect workflow.
21. Severity/priority model.
22. Fix/retest/regression rules.
23. Sign-off and conditional acceptance.
24. UAT reporting/metrics.
25. Automation support.
26. Risk-based UAT depth.
27. Cross-domain journey coverage.
28. Privacy/security guardrails.
29. Templates.
30. Preparation/execution/sign-off checklists.
31. Anti-patterns.
32. Governance and continuous improvement.
33. Production-readiness handoff.

---

# 10806 — Exit Criteria

PART 38 is complete when the team can answer:

### Candidate
```text
Exactly which image digests, configuration, migrations, and flags were accepted?
```

### Scope
```text
Which business requirements and critical journeys were included?
```

### Environment
```text
Was UAT isolated, stable, production-representative, and free of uncontrolled drift?
```

### Data
```text
Was test data realistic, privacy-safe, and reproducible?
```

### Business Outcomes
```text
Did orders, payments, wallet, promotions, loyalty, missions, notifications, and integrations produce the expected business states?
```

### Permissions
```text
Did real business roles have the correct access and restrictions?
```

### Defects
```text
Which defects remain, what is their impact, and who accepted the risk?
```

### Regression
```text
Were fixes retested and affected journeys regressed?
```

### Sign-Off
```text
Who has authority to accept the release, and is that approval recorded?
```

### Handoff
```text
Is the UAT evidence package complete enough for PART 39 Production Readiness?
```

---

# 10807 — Handoff to PART 39

PART 39 defines Production Readiness.

```text
PART 38
UAT
      ↓
Business-Accepted Release Candidate
      ↓
PART 39
Production Readiness
```

---

# 10808 — PART 39 Scope Preview

PART 39 will combine evidence from the whole architecture into a production-readiness decision, including:

```text
architecture completeness
test evidence
UAT sign-off
security posture
performance capacity
backup / DR
Kubernetes readiness
network / TLS
observability
CI/CD and GitOps
database migrations
partner readiness
support / on-call
runbooks
rollback
change approval
go-live checklist
```

---

# 10809 — Key Transition

```text
PART 38
= prove the release is acceptable to business stakeholders

PART 39
= prove the entire platform and operating model are ready for production
```

---

# PART 38 — Summary

User Acceptance Testing converts a technically verified release candidate into explicit business acceptance.

The core flow is:

```text
Approved Release Scope
      ↓
Stable Candidate + Controlled UAT Environment
      ↓
Business-Realistic Data + Partner UAT Endpoints
      ↓
Critical Business Journeys
      ↓
Evidence + Defect Triage
      ↓
Fix / Retest / Regression
      ↓
Residual-Risk Review
      ↓
Business Sign-Off
      ↓
PART 39 Production Readiness
```

The most important UAT rules are:

```text
UAT is business acceptance, not another DEV or QA environment.
Use approved release-candidate images, never arbitrary local builds.
Build once and promote the same immutable artifact.
Freeze unrelated changes during formal acceptance.
Record image digest, configuration, migrations, and feature flags.
Use synthetic, business-realistic, or approved anonymized data.
Keep production credentials, data, Kafka, Redis, and notifications isolated.
Use partner UAT/sandbox endpoints.
Test critical business journeys end to end.
Validate money, status, permission, message, and operational outcomes.
Include negative, boundary, retry, cancellation, and recovery scenarios.
Capture enough evidence to reproduce failures.
Every material defect has explicit disposition.
A workaround is not silently a pass.
Fixes require retest and impact-based regression.
Pass percentage does not override critical risk.
Business sign-off must be explicit and auditable.
A material candidate change can invalidate prior acceptance.
UAT sign-off is an input to Production Readiness, not production approval by itself.
```

The next chapter combines business acceptance with technical and operational evidence:

```text
PART 39 — PRODUCTION READINESS
```

---

**End of PART 38 — User Acceptance Testing (UAT)**
