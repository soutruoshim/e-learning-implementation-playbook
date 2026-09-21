---
title: "09 — Coding Standards"
---

# 09 — Coding Standards

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | CS-001 |
| Version / status | 1.0 / Proposed engineering standards for approval |
| Created / updated | 2026-09-11 |
| Accountable owner | Technical Lead — TBD |
| Applies to | API, client, database migrations, workers, integrations, tests and repository scripts |
| Sources | Documents 01–08, especially SDD, database specification and OpenAPI draft |
| Stack / tooling | Not selected; language profiles and exact CI commands remain TBD |
| Verification status | Standards document only; no repository or implementation assessed |

> These are proposed project standards. MUST, SHOULD and MAY express the intended requirements after team approval; they do not claim an existing policy has already been approved. Language-specific formatters, framework conventions and current dependency versions must be selected and verified when the repository is established. This document does not resolve outstanding identity, provider, financial or product-policy decisions.

## 1. Purpose and Priority

Produce code that is understandable, reviewable, testable and safe under retries, concurrency and partial failure. In this project, a correct normal checkout is insufficient: unknown payment outcomes, repeated events, refunds, staff races and loyalty adjustments must preserve their business obligations.

### Requirement levels

- **MUST:** Required for the affected implementation to be accepted under this baseline.
- **SHOULD:** Default practice; a justified deviation is recorded in review.
- **MAY:** Optional technique when it improves the implementation.

Approved product rules, API contracts and architecture decisions define behavior. Coding style cannot silently change them. Where documents conflict, identify the conflict, obtain the accountable decision and update related contracts/tests. Do not guess financial or authorization behavior to satisfy a lint rule or simplify implementation.

## 2. General Code Quality

### 2.1 Readability and responsibility

- MUST use names that identify the business concept and operation: quote, checkout intent, payment attempt, fulfillment state, refund reservation and reward effect.
- MUST distinguish submitted, paid, accepted, ready, completed and refunded; these are not interchangeable success states.
- SHOULD keep functions focused on one meaningful responsibility with explicit inputs and outputs.
- SHOULD prefer direct control flow and early validation over deeply nested conditions.
- MUST remove unreachable code and unused imports introduced by a change.
- SHOULD avoid speculative abstractions and unrelated refactoring in a feature or fix.
- MUST handle relevant error paths explicitly; empty catch blocks and silent fallback to financial success are prohibited.

No universal function-length or file-length limit is invented. Split code when responsibilities, complexity or testability justify it, not merely to move lines between files.

### 2.2 Naming and formatting

| Area | Standard |
|---|---|
| API fields | Follow the approved OpenAPI names; draft uses `snake_case` |
| Database objects | Follow database specification; explicit, consistent names |
| Internal identifiers | Use the selected language/framework convention consistently |
| Constants/statuses | Named domain values; do not scatter unexplained magic numbers |
| Boolean names | Describe the exact predicate, e.g. eligibility; avoid a single `success` for multiple domains |
| Amount fields | Include unit/context, such as `amount_minor`; currency is explicit |
| Time fields | Indicate event meaning, e.g. `submitted_at`, `resolved_at`; avoid ambiguous generic dates |
| Tests | Name the scenario and expected business outcome |

Use one approved formatter per language and commit its configuration. Generated formatting should be deterministic. Do not introduce competing formatting tools or broad unrelated formatting changes.

### 2.3 Comments and documentation

Comments SHOULD explain why a nonobvious rule, concurrency guard or provider workaround exists. They SHOULD NOT narrate obvious syntax. Include requirement/decision references when needed to explain business constraints. Temporary workarounds require an owner, reason and removal condition or tracked task. Never place secrets or personal data in examples or comments.

## 3. Module Boundaries and Dependencies

Follow the SDD's owning modules. HTTP handlers validate transport and delegate to application commands; they should not accumulate pricing, provider calls, ledger mutations and notification delivery in one controller.

| Layer / module | Responsibility | Boundary |
|---|---|---|
| Transport | Parse, authenticate, map requests/responses and safe errors | No client-trusted financial decisions |
| Application commands | Coordinate business operations and local transactions | No hidden untracked external side effects |
| Domain logic | Pricing, eligibility, transitions, invariant checks | Independent of UI rendering and provider payload details where practical |
| Persistence | Parameterized access, constraints, locks, versions and mappings | No bypass of domain authorization through public helpers |
| Provider adapters | Translate approved provider contracts | No invented success or assumed finality |
| Workers | Process durable events/operations and recovery | No assumption of exactly-once delivery |
| Client | Present current state and gather deliberate user actions | Not authoritative for payment, price or permissions |

Owning modules MUST control writes to their tables/aggregates. Cross-module read models MAY combine data, but a joined query does not grant cross-domain write ownership. Dependency direction and exceptions must be documented. A single database does not justify arbitrary writes from every module.

## 4. Types, Validation and Contracts

### 4.1 Boundary validation

- MUST validate required fields, types, sizes, enum values and permitted combinations at entry points.
- MUST reject or handle unknown fields according to the approved contract; do not silently use undocumented fields to change behavior.
- MUST validate ownership, store scope, business state and eligibility server-side after transport parsing.
- MUST distinguish missing, null, empty and zero where the contract distinguishes them.
- MUST avoid broad truthiness checks for valid zero amounts, false booleans or intentionally empty collections.
- SHOULD use typed domain values or clear wrappers for IDs, exact money, state and timestamps when supported by the language.

Validation on the client improves usability but never replaces server validation. Never trust a submitted user ID as the authenticated actor.

### 4.2 API compatibility

The approved OpenAPI contract is the transport baseline. Changes MUST update request/response schemas, examples, clients and tests together. The current API is a draft with explicit provider/identity gaps; it is not permission to implement unverified webhook acceptance.

Breaking field, enum, authentication, error or pagination changes require a compatibility decision. Additional fields may still break strict clients; assess actual consumers. Generated files must be regenerated through the selected tool rather than hand-edited as the source of truth.

### 4.3 Error mapping

Return stable machine codes, useful safe messages, field errors where appropriate and correlation IDs. Distinguish validation, authorization, stale version, idempotency conflict, unknown financial outcome and dependency outage.

Do not leak stack traces, SQL statements containing values, tokens, provider credentials or another user's resource metadata. An HTTP success response alone MUST NOT be interpreted as payment success or store acceptance. `retryable` must describe the permitted operation, not encourage a new charge while an earlier one is unresolved.

## 5. Exact Money, Pricing and Time

### Money

- MUST use exact integer minor units or approved exact decimal types; no binary floating point for authoritative pricing or ledger calculations.
- MUST carry currency and applicable exponent/scale explicitly.
- MUST enforce checked bounds for quantity multiplication, totals and conversions.
- MUST apply only approved versioned tax, discount, fee and rounding rules.
- MUST preserve quote/order snapshots; catalog changes do not rewrite historical purchase facts.
- MUST require fresh customer confirmation for an unaccepted revised payable total.
- MUST treat included tax as informational where the approved formula already includes it; do not add it twice.

The draft amount contract uses bounded integers for interoperability. Language conversions and JSON serialization must preserve values exactly. Currency conversion, if later added, requires a rate source, rounding policy and explicit scope approval.

### Time

Persist event instants unambiguously and use store time zone for local operating rules. Use an injectable clock for expiry and time-dependent tests. Do not infer event ordering solely from arrival time or wall-clock timestamps; state versions and provider evidence govern transitions. Local UI timers do not prove a payment failed or a reservation may be released.

## 6. Database Access and Migrations

### 6.1 Query safety

- MUST use parameterized queries or equivalent safe bindings for values.
- MUST allowlist any dynamic identifier/sort expression; binding a value does not make arbitrary SQL fragments safe.
- MUST use database uniqueness and relevant constraints as final guards, not only application prechecks.
- MUST scope private queries by authorized principal/store and use stable pagination.
- SHOULD select needed columns and avoid N+1 query patterns where meaningful.
- MUST measure query plans for high-volume/critical paths on representative data; do not add indexes blindly.

Do not truncate provider IDs or rely on prefix uniqueness for financial references. Choose collation/normalization intentionally so distinct operation identities are not accidentally equal.

### 6.2 Transactions and locks

Keep local business state, associated audit/outbox and local deduplication effects atomic where the SDD requires it. Use a documented consistent lock order. Expected-version comparisons and row locks/conditional updates must protect concurrent commands.

Network calls MUST NOT run inside a held database transaction. Deadlock retry replays only a safe local transaction; it MUST NOT blindly replay provider calls. Cross-row aggregate limits require transactional enforcement even when individual row checks exist.

### 6.3 Migrations

Migrations MUST be versioned, reviewed and repeatably tracked by the selected runner. Prefer additive, backward-compatible changes and bounded resumable backfills. Review lock duration, data volume and old/new application compatibility.

Do not edit an already-applied shared migration to change history. Create a corrective migration under the repository policy. Do not cascade-delete financial evidence or permanently disable referential checks to make deployment work. Rollback plans must account for external money movement; reverting a database does not refund a customer.

## 7. Idempotency and Financial Side Effects

### 7.1 Command identity

A consequential command MUST have the approved durable operation identity. Same key and canonical semantic payload returns the existing operation; changed payload conflicts. Key scope, canonicalization version and retention follow the API/database contracts.

Do not derive identity only from current time, a short response cache, or a randomly generated key on each retry. A deliberate new purchase can have a new key; reconnecting after a lost response should recover the original intent.

### 7.2 Required financial protections

| Operation | Required protection |
|---|---|
| Checkout | Unique intent/order association; quote consumption; atomic local commit |
| Payment initiation | Persist stable operation before external call; block independent attempt while unresolved/succeeded |
| Callback application | Verify origin and merchant/context; durable deduplication; amount/currency checks |
| Refund request | Lock capacity; include pending/reserved exposure; stable provider reference |
| Reward reservation | Atomic available-value guard or approved external reservation |
| Reward earning/reversal | Unique business-event effect, linked append-only adjustment |
| Staff transition | Current permission, valid transition and expected version |

### 7.3 Prohibited shortcuts

- Marking a payment paid from a client redirect or submitted success flag.
- Treating timeout as definitive failure and immediately charging again.
- Deleting unresolved payment/refund records to make retry possible.
- Releasing reward/refund reservations solely because the client closed or a timer elapsed.
- Using a local cache lock as protection against spending through an external authority.
- Recalculating past orders from current catalog prices.
- Claiming exactly-once external delivery based only on a local consumer receipt.

If a provider cannot safely deduplicate or retrieve an ambiguous action, route to the approved reconciliation/manual workflow. Do not fabricate a guarantee in code.

## 8. Worker, Event and Integration Standards

### Durable processing

Workers MUST assume events/jobs can repeat, arrive late or be delivered out of order. State changes and outbox writes share a local transaction. Local consumer effect and receipt share another local transaction. Acknowledge only after durable processing/receipt at the appropriate boundary.

Claims use bounded batches, lease expiry and a claim token. A stale worker cannot overwrite a newer local claim. A lease does not prevent an old process from calling a provider, so external stable references remain necessary.

### Retry classification

| Failure | Handling |
|---|---|
| Temporary nonfinancial dependency error | Bounded backoff/jitter under approved limits |
| Unknown payment/refund outcome | Retrieve/reconcile original operation before retry decision |
| Invalid payload/policy | Reject without automatic endless retry |
| Authentication/configuration problem | Alert and correct configuration; avoid repeated failing calls |
| Unknown event type or contradictory evidence | Preserve and quarantine for owned resolution |
| Exhausted retry budget | Durable exception/dead-letter state with owner and safe replay process |

Do not use unbounded retries, silent job deletion or blocking sleeps inside request handlers to simulate background processing. Reconciliation schedules and retry ceilings are configuration with reviewed defaults.

### Adapter boundaries

Provider payloads stay inside adapters and evidence processing. Domain code consumes explicit normalized facts whose meaning is reviewed. A valid signature is not sufficient without merchant, environment, reference and amount checks. Signature verification uses the provider's required original representation; do not reserialize a signed payload and assume the signature still applies.

Callback placeholders in the draft API MUST be replaced with a real verified contract before release. Development tests must not disable signature verification to obtain a green result.

## 9. Client and UX Implementation Standards

- MUST implement loading, empty, invalid, stale, failed and unauthorized states from the UX specification where applicable.
- MUST present payment, fulfillment, refund and loyalty states separately.
- MUST preserve recoverable input and intent identity across retry/authentication according to policy.
- MUST refresh authorization/current state after sign-in and require deliberate purchase confirmation; no automatic resubmission.
- MUST avoid optimistic financial success, cancellation, refund, collection or reward consumption.
- MAY use optimistic local edits for reversible cart/options when rollback and revalidation are clear.
- MUST prevent duplicate local activation while submitting, while recognizing that server idempotency is still required.
- MUST avoid showing another account's cached private data after logout/account change.
- SHOULD centralize API/error mappings and reuse approved UI components.

Implement visible focus, labels, accessible control states, scalable text and responsive behavior as specified in UX. Do not rely on color, animation, sound or gestures alone. Localized strings use the chosen translation system; avoid concatenation that breaks grammar or currency display.

Generated UI state must follow authoritative API facts. An old notification may open a current order, but its text cannot regress that order's timeline. A failed read is not an empty account or zero reward balance.

## 10. Security, Privacy and Configuration

### Access and secrets

Server commands MUST enforce owner/store/role scope on every applicable operation. UI visibility is not authorization. Use maintained, approved authentication/cryptographic libraries selected at implementation time; no custom encryption or password protocol.

Secrets MUST stay outside committed code, fixtures, shared collections and logs. Use approved secret references/configuration, separate environments and least-required credentials. Never use production credentials or customer data for routine local tests.

### Input and output safety

Validate size/content at boundaries, safely encode displayed user text, and constrain uploaded content if uploads are introduced. Browser session/CSRF and bearer storage controls depend on the selected authentication/platform design and must be reviewed explicitly.

Account deletion is an auditable workflow with approved retention behavior, not a broad cascade. Avoid spreading personal contact data into snapshots/events when a protected reference suffices.

### Configuration discipline

Fail clearly for missing critical configuration. Do not silently default to a production provider, permissive authentication, or unrestricted origin policy. Defaults must be safe for their intended environment and documented. Business-rule changes require the approved decision process, not an undocumented environment tweak.

## 11. Logging, Observability and Diagnostics

Use structured logs with event category, safe correlation identifiers and meaningful outcome. Propagate request, intent/order, operation and event IDs where appropriate without treating them as authentication.

Log technical failure and business refusal separately. Sensitive payloads, bearer tokens, verification proofs, connection strings and full provider data MUST NOT enter routine logs. Redaction should be centralized and exercised with tests where leakage is a concrete risk.

Measure relevant latency/error categories, pending-work age, reconciliation mismatches, failed jobs and catalog freshness. New asynchronous obligations SHOULD include how they will be observed, retried and assigned when unresolved. Do not swallow failures merely to keep the UI response successful.

Customer-facing messages contain useful next steps and safe references, not internal stack traces. Debug mode must not weaken production access or expose secrets in any environment.

## 12. Testing Standards

Tests should prove behavior and risk controls, not mirror implementation line by line. Match verification to impact and the affected requirements.

| Test level | Best use |
|---|---|
| Unit | Exact pricing, eligibility, transition rules, pure mappings |
| Database integration | Uniqueness, locking/version conflicts, cross-row refund/reward limits |
| Contract | Request/response schemas, error behavior, authorization and adapter contracts |
| End-to-end | Customer/staff journeys including interrupted purchase and recovery |
| Resilience | Crash windows, late events, replay, restore/reconciliation |
| UI/accessibility | Required states, focus/labels, text scaling, supported devices |

- MUST add/update meaningful tests for changed financial, authorization, concurrency or recovery behavior.
- MUST use the actual selected database behavior for tests intended to prove its constraints/locking; a mock cannot demonstrate row-lock correctness.
- MUST keep test data synthetic and isolated; destructive test/reset commands verify their target.
- SHOULD use controllable clocks and deterministic fixtures for expiry/retry tests.
- SHOULD avoid arbitrary sleeps; wait on observable conditions within bounded timeouts.
- MUST identify build/configuration/environment in release evidence.
- MUST not describe unexecuted tests or placeholder adapters as passing.

Reversible formatting or documentation-only changes do not require new implementation-mirroring tests. Run the checks needed for the change and mandatory gate; broaden only for a concrete risk. Full provider verification and release resilience tests cannot be replaced with local mock success.

## 13. Dependencies, Generated Code and Repository Scripts

New dependencies require a clear purpose, compatible license/project policy, supported maintenance posture, pinned resolution and review of security/operational impact. Verify current compatibility when selecting them. Do not introduce a library simply to avoid a small readable function, or reimplement security-sensitive functionality to avoid a reviewed dependency.

Commit lockfiles and generator configuration according to the selected ecosystem. Record the source of generated artifacts and how to regenerate them. Do not hand-edit generated clients as the durable source fix.

Repository scripts MUST quote arguments safely, avoid embedding secrets in command strings, return nonzero on failure, and make destructive target checks explicit. Do not repurpose standard environment variables such as HOME for project paths. A script must not continue to publish or deploy after a failed build/test/migration step.

## 14. Review Checklist

For each change, reviewers assess the affected items rather than require irrelevant ceremony.

### Behavior and contracts

- [ ] Requirement/outcome and scope are clear.
- [ ] API/schema/UX changes agree and compatibility is considered.
- [ ] Unresolved business/provider rules have not been invented.
- [ ] Error and recovery behavior is explicit.

### Data and financial correctness

- [ ] Exact amounts and snapshot rules are preserved.
- [ ] Relevant unique keys, version checks and lock order protect races.
- [ ] External effects occur after durable intent and outside local transactions.
- [ ] Unknown outcomes retain obligations and do not trigger blind retries.
- [ ] Migrations/backfills and retention behavior are safe for existing data.

### Security and operations

- [ ] Owner/store/role scope is checked server-side.
- [ ] No sensitive data enters logs, examples or committed files.
- [ ] Workers have bounded retry, safe replay and observable failure.
- [ ] Configuration and rollout implications are documented.

### Verification and maintainability

- [ ] Meaningful relevant tests/checks pass; limitations are stated accurately.
- [ ] Code follows the selected formatter/type/static-analysis profile.
- [ ] Unrelated refactoring and speculative abstraction are avoided.
- [ ] Documentation and generated contracts are updated where affected.

## 15. CI Enforcement and Language Profiles

Exact tools/versions are selected under WP-04. The following are required capabilities, not existing commands.

| Capability | Owner | Enforcement |
|---|---|---|
| Formatting | Technical Lead | Consistent committed configuration; CI check |
| Static/type analysis | Language owner | Approved strictness; no broad suppression without justification |
| API validation | Backend/QA | Full OpenAPI validation and affected contract checks |
| Unit/integration tests | Engineering/QA | Relevant suites and invariant gates |
| Secret detection | Engineering/DevOps | Approved repository/CI control; response procedure |
| Migration validation | Database owner | Selected-engine checks and compatibility review |
| Client build/UI checks | Client owner | Supported-target build and appropriate verification |

### Language-profile register

| Area | Required decisions | Status |
|---|---|---|
| Backend | Language/runtime version, formatter, static/type checker, test runner, dependency manager | TBD |
| Client | Framework/toolchain, formatter/linter, type settings, UI test tools | TBD |
| SQL | Engine/version, naming/collation conventions, migration runner and query review | TBD |
| Worker/scripts | Runtime/task runner, process exit/retry conventions, script checks | TBD |

If PHP, TypeScript, Dart or another language is selected, add a focused profile consistent with its chosen framework and supported version. No language choice is inferred from earlier unrelated work. Do not insert unverified package versions or commands into this standard.

## 16. Exceptions and Policy Changes

A deviation request identifies the rule, reason, affected scope, risk, compensating control, owner and review/removal condition. Technical Lead reviews engineering deviations; Product/Finance/Operations also review changes affecting their approved behavior or obligations.

Do not label a financial invariant violation a style exception. If the architecture cannot meet an invariant, resolve the design or product scope explicitly before acceptance. Temporary suppressions must be narrow and linked to tracked work; blanket lint/type/security bypasses are not an acceptable shortcut.

## 17. Traceability and Related Documents

| Concern | Primary references |
|---|---|
| User behavior and acceptance | `02-prd.md` |
| Client states and accessibility | `03-ux-ui-specification.md` |
| Transactions, authorities and recovery | `04-sdd.md`, INV-01–INV-10 |
| Keys, amounts, locks and migrations | `05-database-specification.md` |
| Request/response and operation identity | `06-api-specification.yaml` |
| Ownership, work packages and gates | `07-delivery-plan.md` |
| Local toolchain and verification | `08-developer-setup.md` |
| Review/release workflow | Planned `10-git-and-review-workflow.md` |
| Full test evidence | Planned `11-test-plan.md` |

Planned references do not imply those files or CI tools already exist. Keep standards aligned when authority, contract or stack decisions change.

## 18. Approval and Change History

| Review | Reviewer | Status / date |
|---|---|---|
| Engineering baseline | Technical Lead — TBD | Pending / — |
| Backend/database invariants | Backend / Database Owner — TBD | Pending / — |
| Client standards | Client / Design Owner — TBD | Pending / — |
| Test and CI enforcement | QA / DevOps Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial stack-neutral coding standards for domain boundaries, exact money, transactions, retries, security, client behavior, testing and review |

Adopt the baseline through engineering review, bind the language profiles to the actual repository, and implement the corresponding checks before treating the standards as enforced.
