---
title: "08 — Developer Setup Guide"
---

# 08 — Developer Setup Guide

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | DEV-001 |
| Version / status | 1.0 / Setup specification awaiting repository binding |
| Created / updated | 2026-09-11 |
| Owner | Technical Lead / Developer Experience Owner — TBD |
| Delivery package | WP-04, with WP-03/WP-05 dependencies |
| Sources | Documents 01–07, including the draft API and database specifications |
| Repository / branch | TBD / use the repository's documented default branch |
| Runtime / database / client framework | TBD; versions must be pinned after selection |
| Execution status | No application repository or environment has been inspected or started |

> This guide defines the required onboarding workflow for the proposed system. It is complete as a setup specification, but cannot yet be a verified copy-and-run guide: repository URL, selected stack, supported versions, actual scripts, and provider configuration have not been supplied. Command names in Section 8 are a proposed repository interface to implement in WP-04, not claims that those commands exist. Replace the binding register and verify onboarding before marking this guide Ready.

## 1. Purpose and Expected Result

A developer should be able to obtain the repository, install its pinned dependencies, configure an isolated local environment, create and migrate a local database, seed synthetic data, start API/workers/client, and exercise a pickup purchase with the approved test provider.

Successful setup demonstrates more than a rendered Home screen: the developer can create an authoritative quote, submit one checkout intent, observe durable background work, process an order through collection, and inspect the relevant payment/reward outcome. Live money movement is not needed for routine onboarding.

## 2. Repository Binding Register

The repository maintainer must populate this table and verify each entry before distribution as a runnable guide.

| Item | Required value/evidence | Current status |
|---|---|---|
| Clone URL and access method | Approved repository URL; SSH/HTTPS method; read/write access policy | TBD |
| Default branch and review workflow | Actual branch and contribution rules | TBD |
| Supported host environment | Selected OS versions; container/WSL/native support where applicable | TBD |
| Backend runtime | Exact supported version and version-file path | TBD |
| Client runtime/toolchain | Exact supported version(s), platform SDKs and lockfile paths | TBD |
| Database | Engine/version, local startup method, charset/collation and time-zone configuration | TBD |
| Queue/cache | Selected services, or confirmation they are unnecessary locally | TBD |
| Dependency installation | Actual commands honoring committed lockfiles | TBD |
| Migrations and fixtures | Actual runner, current schema revision, seed/reset commands | TBD |
| API/client/worker start commands | Exact commands, working directories and expected addresses | TBD |
| Health and readiness | Actual endpoints/commands and expected response | TBD |
| Test and contract validation | Actual commands and required fixtures/services | TBD |
| Identity adapter | Approved local identity flow and synthetic test access | D-04 |
| Payment adapter | Mock implementation plus approved sandbox configuration | D-05 |
| Catalog/POS/loyalty authority | Selected internal/external authority and local fixture behavior | D-06/D-07 |
| Callback testing | Approved ingress method, local signature fixture and sandbox verification procedure | TBD |
| Maintainer contacts | Setup, integration, database and operations owners | TBD |

Do not guess these values from unrelated projects or install arbitrary current runtime versions. Use the repository's committed version and dependency metadata after it exists.

## 3. Access and Prerequisites

### 3.1 Access checklist

- [ ] Repository and relevant documentation access.
- [ ] Approved dependency/package registry access, if private.
- [ ] Access to the team's development-secret distribution mechanism.
- [ ] Sandbox provider access only when integration work requires it.
- [ ] Required local/container runtime and selected client platform tools.
- [ ] Named person to resolve onboarding and provider access problems.

Do not request production credentials for ordinary local setup. Do not copy production customer, payment, or identity data into development.

### 3.2 Host preparation

Install Git, the approved editor, the selected runtime/toolchain, and the chosen database/container tooling using the team's supported instructions. Containerization is optional until selected; it is not implied by the SDD. Windows/WSL, macOS and Linux support must be explicitly verified rather than assumed.

Check that enough disk space, memory and local ports are available for the selected services. Record actual minimum requirements after measuring the development stack; no hardware requirements are invented here.

### 3.3 Version discipline

Use committed version files and lockfiles. Install dependencies in the locked/reproducible mode supported by the chosen package manager. Do not regenerate lockfiles simply to make a first checkout start. If the lockfile or runtime metadata is missing, record a WP-04 blocker and have the maintainer establish it.

## 4. Proposed Repository Layout

This is a logical layout suggestion. Map it to actual paths in the binding register; do not create duplicate folders merely to match this example.

| Area | Responsibility |
|---|---|
| `apps/api/` | HTTP boundary and application modules |
| `apps/worker/` | Outbox processing, reconciliation and notifications |
| `apps/client/` | Customer UI and optional approved staff UI |
| `packages/contracts/` | Shared/generated API artifacts where appropriate |
| `database/migrations/` | Ordered, versioned schema migrations |
| `database/fixtures/` | Synthetic, deterministic local test data |
| `tests/` | Contract, integration and end-to-end suites |
| `scripts/` | Repository-owned setup/start/verification interface |
| `docs/` | Reviewed project documents, decisions and runbooks |
| `.env.example` | Nonsecret configuration template, if file-based configuration is selected |

Logical modules need not be separately deployed or separate repositories. The SDD proposes a modular application with independently running workers.

## 5. Local Service Topology

| Component | Local responsibility | Startup dependency |
|---|---|---|
| Transactional database | Orders, intents, gates, ledger/evidence, inbox/outbox | Configuration and database service |
| API | Authentication, catalog, quote, checkout, staff/support commands | Database and valid schema |
| Worker | Durable work, provider interaction, reconciliation, notifications | Database/schema; selected adapters |
| Client | Customer and selected staff experiences | API URL and supported toolchain |
| Payment test adapter | Deterministic payment outcomes and lookup | Local mock or approved sandbox |
| Identity test adapter | Synthetic authenticated principals and role scopes | Approved development-only configuration |
| Notification sink | Inspect test notifications without contacting real recipients | Local adapter |
| Optional cache/queue | Selected read acceleration or delivery mechanism | Only if actually selected |

No cache or queue may replace the transactional database as the source of purchase evidence. A running API with a stopped worker can leave payments and notifications pending; worker readiness must be checked separately.

Bind local services to loopback by default. If testing on a physical device, expose only the needed development service on the approved local interface; retain authentication and restrict access. A device's `localhost` refers to the device, not the developer workstation. Use the selected platform's documented development-network method.

## 6. Configuration and Secrets

### 6.1 Proposed configuration contract

Names below are proposed keys, not confirmed existing application variables. The maintainer must map them to actual configuration and document defaults. Secrets use references or local untracked secret files according to the selected runtime.

| Proposed key | Purpose | Local treatment |
|---|---|---|
| `APP_ENV` | Environment identity | Explicit development value; never infer from hostname alone |
| `APP_BASE_URL` | API/public base for local flow | Approved local URL; no invented production host |
| `CLIENT_BASE_URL` | Client origin/return destination | Allowlisted local origin |
| `DATABASE_URL` | Database connection | Development database only; secret if it contains credentials |
| `DATABASE_TIME_ZONE` | Connection time basis | UTC behavior verified on chosen engine |
| `IDENTITY_ADAPTER` | Local or sandbox identity implementation | Approved development adapter; D-04 |
| `PAYMENT_ADAPTER` | Mock or sandbox financial integration | Mock by default where implemented |
| `PAYMENT_PROVIDER_ACCOUNT` | Merchant/environment identity | Dedicated test identity |
| `PAYMENT_SECRET_REFERENCE` | Provider authentication material | Approved secret mechanism; never committed |
| `PAYMENT_WEBHOOK_SECRET_REFERENCE` | Callback verification material | Development/sandbox key; never bypass verification to test |
| `CATALOG_ADAPTER` | Internal fixture or approved external source | Synthetic catalog initially |
| `LOYALTY_ADAPTER` | Internal or external authority | Selected scheme only |
| `NOTIFICATION_ADAPTER` | Local sink or approved provider | Sink by default to prevent unintended messages |
| `CACHE_URL` / `QUEUE_URL` | Optional selected services | Omit when unused |
| `LOG_LEVEL` | Diagnostic detail | Debug may be local; secrets/PII still excluded |
| `QUOTE_TTL_SECONDS` | Quote lifetime | Agreed fixture/test value; production policy separate |
| `WORKER_LEASE_SECONDS` | Work claim recovery | Test value from selected worker contract |
| `RECONCILIATION_INTERVAL_SECONDS` | Status-resolution schedule | Bounded local value; provider rate limits respected |
| `ALLOWED_CLIENT_ORIGINS` | Browser origin allowlist | Explicit local origins, not an unrestricted credentialed wildcard |

Business rules such as currency, rounding, expiry, cancellation, and rewards belong in approved versioned configuration/fixtures. Changing an environment variable is not an authorization to alter product policy.

### 6.2 Secret handling

- Configuration templates contain names and safe placeholders only.
- Local secret files are excluded from version control and restricted to the developer.
- Never paste credentials, session tokens, verification proofs, signed URLs or provider payloads into issue comments or screenshots.
- Diagnostic output identifies configuration keys and missing values without printing secret contents.
- Rotate/revoke accidentally exposed credentials through the owner; removing them from the latest file is not sufficient remediation.
- Do not disable TLS, callback authentication, role checks, or ownership checks to make onboarding succeed.

## 7. First-Time Setup Workflow

Perform steps in order. Use the actual bound commands from Section 8 once implemented.

### Step 1 — Obtain and inspect the repository

Clone the approved repository into a dedicated working folder. Read its README, contribution instructions and any applicable `AGENTS.md`. Confirm the expected branch/revision. Inspect version files, lockfiles, configuration templates and the documented startup entry points before installing dependencies.

Do not overwrite an existing checkout or discard local changes during setup. If already working in a repository, check its status and follow its existing workflow.

### Step 2 — Install pinned prerequisites and dependencies

Select the recorded runtime/toolchain versions. Install backend and client dependencies using lockfile-preserving commands. Capture missing private registry access as an access issue; do not substitute unreviewed packages or upgrade the stack as an onboarding workaround.

### Step 3 — Configure the local environment

Create local configuration from the approved template. Set database connection, client/API origins, test adapter selection and necessary test secrets. Choose mock/local sinks before sandbox integration. Run configuration validation and resolve missing or incompatible values.

The application should reject a development environment accidentally configured with a production provider identity, and should fail clearly when a required adapter is not available.

### Step 4 — Start infrastructure

Start the selected database and any required cache/queue. Verify connectivity with the documented health check without printing credentials. Confirm database name, environment and schema target before running migrations.

Use a separate migration identity if the project requires it; runtime credentials should not automatically receive unrestricted schema-administration privileges.

### Step 5 — Apply migrations

Run the repository's migration runner against the isolated local database. Verify migration version/checksum and applied status. Do not manually create tables from fragments of the specification or disable referential checks permanently to force migration success.

On migration failure, stop application startup, capture the nonsecret error and inspect the applied-state record. Resume or repair using the migration owner's procedure; avoid rerunning partial destructive SQL blindly.

### Step 6 — Seed synthetic fixtures

Load versioned fixtures appropriate to the selected rules and adapter. Verify deterministic IDs/references or retrieve them from fixture output. Re-running the seed must not duplicate accounts, catalog records or financial effects.

Required fixture roles and scenarios are in Section 9. A seed should not create real provider collections or send real notifications.

### Step 7 — Start API and workers

Start the API and verify schema/configuration readiness. Start worker processes separately and confirm they can claim/process test work. A process that remains alive is not sufficient readiness evidence.

Verify selected adapter names, environment, and nonsecret service identity in diagnostics. Do not log connection secrets, session material or contact data.

### Step 8 — Start the client

Use the pinned client toolchain. Configure the API origin and supported target device/browser. Verify that the client reaches the intended local API and that browser-origin or device-network rules are correct.

Do not change production origin settings to accommodate local development. Use a development-specific configuration.

### Step 9 — Run the onboarding verification

Complete Section 10, using the local mock adapter first if available. Then run relevant automated suites and any task-specific sandbox check. Record the revision, environment and outcome without secrets.

### Step 10 — Begin normal development

Create a branch under the repository's agreed workflow. Link the actual task, update contracts/docs with behavior changes, and run the relevant checks before review. Setup success does not mean the whole MVP or provider integration has passed acceptance.

## 8. Repository Command Interface to Implement

These are **proposed command labels** for WP-04. They are intentionally not presented as runnable shell commands because no scripts have been supplied. Bind each label to the actual command, working directory and supported host environment before marking this guide Ready.

| Label | Required behavior | Success evidence |
|---|---|---|
| `setup:check` | Verify runtime versions, tools, required config and reachable dependencies | Clear pass/fail without exposing values |
| `deps:install` | Install locked dependencies | Lockfiles unchanged unless a deliberate dependency update |
| `infra:start` | Start selected local dependencies | Ready database and optional services |
| `db:migrate` | Apply pending versioned migrations | Applied version/checksum report |
| `db:status` | Report schema state | Expected version, no failed migration |
| `db:seed` | Load deterministic synthetic fixtures | Fixture revision and safe identifiers |
| `api:dev` | Start API in development mode | Documented ready endpoint/result |
| `worker:dev` | Start relevant durable consumers and reconciliation | Test work processed; heartbeat/queue state visible |
| `client:dev` | Start selected customer client | Loads and reaches local API |
| `test:unit` | Run pure business-rule checks | Relevant suite passes |
| `test:integration` | Test real database constraints and command behavior | Dedicated test database; invariant checks pass |
| `test:contract` | Full OpenAPI/schema/implementation checks | Approved contract and negative cases pass |
| `test:e2e` | Exercise integrated critical journey | Identified build and fixture evidence |
| `test:provider` | Run explicit sandbox/provider contract scenarios | Safe retry/verification/lookup evidence |
| `lint` / `build` | Repository quality and build checks | Required checks pass |
| `dev:stop` | Stop owned local processes gracefully | No abandoned process; durable data retained |
| `db:reset-local` | Destructive reset of confirmed disposable local database | Explicit environment guard and confirmation |

Acceptance for this section requires real commands and outputs added to the guide. A maintainer can implement these labels with the chosen package scripts, task runner or native commands; the names do not mandate a particular tool.

## 9. Required Development Fixtures

| Fixture | Purpose | Expected behavior |
|---|---|---|
| Member A and Member B | Ownership tests | Each sees only their own private records |
| Staff for Store A only | Store authorization | Cannot operate Store B |
| Authorized support/refund operator | Exception workflow | Only permitted lookup/refund actions |
| Open Store A and paused Store B | Eligibility tests | Paused store rejects new checkout |
| Product with required size | Configuration validation | Cannot submit without a valid choice |
| Product with optional priced modifier | Monetary calculation | Quote reflects approved exact amount |
| Unavailable product/option | Stale-menu recovery | Checkout identifies invalid selection |
| Expiring/replaced quote | Reconfirmation | Changed/expired quote cannot silently charge |
| Mock payment pending/success/failure | Payment UI and server states | Distinct outcomes with status lookup |
| Late success / duplicate event | Recovery and deduplication | One financial effect; no terminal order reopening |
| Selected loyalty scheme | Reservation/earning/reversal | Approved examples and unique effects |
| Pending refund | Refund capacity/recovery | Unknown refund retains reserved capacity |
| Notification sink | Delivery inspection | No real recipient contacted |

Credentials or verification shortcuts must be development-only, documented, and unavailable in production. Do not hardcode universal staff/admin access. Fixture currency/rates are synthetic test values unless explicitly approved as product policy.

## 10. Onboarding Verification Checklist

### 10.1 Service and schema readiness

- [ ] Runtime and dependency versions match repository metadata.
- [ ] Schema is at the expected migration revision.
- [ ] API readiness passes using the actual documented route/command.
- [ ] Worker processes a harmless test event and records completion.
- [ ] Client reaches the correct API; no mixed-environment configuration.
- [ ] Logs and notification sink expose no secrets or unnecessary personal data.

### 10.2 Functional walkthrough

1. Sign in as synthetic Member A through the approved local identity flow.
2. Select eligible Store A, browse its menu and configure required options.
3. Create/edit the cart and request an authoritative quote.
4. Confirm the quote using one retained checkout operation key.
5. Resolve the mock payment through the adapter's documented action. Do not directly patch the database to pretend the payment succeeded.
6. Sign in as assigned staff, accept the eligible order, prepare it, mark ready and confirm collection.
7. Return to the member view and verify distinct payment and fulfillment states, order history and approved reward effect.
8. Inspect notification sink and support/audit records as authorized.

### 10.3 Minimum recovery checks

- Repeat the same checkout key/payload and verify the same intent/order is returned.
- Change the payload with the same key and verify a conflict.
- Simulate a lost response or pending payment; recover the existing intent instead of creating a new key.
- Confirm Member B cannot retrieve Member A's order and Store A staff cannot act on Store B.
- Confirm a paused store or unavailable item blocks submission with a useful error.

Automated detailed concurrency, crash, refund and restore tests belong to the test plan. Routine onboarding need not rerun every expensive system test unless the work or required gate needs it.

## 11. API Testing Conventions

The current draft uses a relative `/v1` base, proposed bearer authentication, `Idempotency-Key` on consequential commands, and integer minor-unit amounts. Bind to the approved contract before integration acceptance.

| Operation | Draft route | Setup expectation |
|---|---|---|
| Browse stores | `GET /v1/stores` | Public store fixture response |
| Browse menu | `GET /v1/stores/{store_id}/menu` | Published revision, correct options |
| Persist cart | `PUT /v1/me/cart` | Authenticated, expected version, stable operation key |
| Quote cart | `POST /v1/quotes` | Owned cart/version; server totals |
| Submit purchase | `POST /v1/checkout-intents` | Owned quote, contact, explicit confirmation, stable key |
| Recover by key | `GET /v1/checkout-intents/lookup` | Same key in header, not a new purchase |
| Track order | `GET /v1/orders/{order_id}` | Owned order with separate state dimensions |
| Staff action | `POST /v1/staff/orders/{order_id}/transitions` | Assigned role/store, expected version and key |

Obtain IDs from fixture/API output, never guess them. Store test tokens in the API client's approved local secret facility; do not export them with a shared collection. A `202` response means durable acknowledgement, not completed payment or store acceptance.

Examples and USD amounts in the API file are synthetic and do not select the launch currency. The callback schema remains a provider-specific blocker; it is not an endpoint where arbitrary unsigned success JSON should be accepted.

## 12. Mock and Sandbox Integration Modes

### Mock/local mode

The repository should supply deterministic adapters supporting pending, success, definitive failure, duplicate callback, delayed outcome and lookup by stable operation reference. If the adapter is not implemented, onboarding is blocked at that step; a documentation placeholder is not a working mock.

Test controls must be development-only and clearly separated from public application commands. They must exercise the same application outcome-processing path where possible, rather than bypassing it with direct record changes.

### Sandbox mode

Use dedicated approved merchant/account credentials and provider test instruments. Confirm environment, callback authentication, event identity, idempotency retention, and lookup behavior under WP-02 before relying on recovery guarantees.

A local webhook ingress/tunnel is optional and must use the team's approved method. Register the exact sandbox callback address and verify requests using sandbox credentials. Public reachability does not remove verification. If callback ingress is unavailable, use a valid signed test fixture or provider status query under the approved adapter contract; do not accept unsigned events as a workaround.

### External POS/loyalty mode

Use the selected authority. Local projection balances or statuses do not authorize external changes. Missing atomic reservation or safe command lookup is an integration feasibility issue, not a setup problem to work around by writing local tables.

## 13. Daily Workflow and Safe Reset

### Start of work

Review repository status, update according to the agreed Git workflow, install dependencies only when lockfiles/toolchain require it, apply pending local migrations, and start API/workers/client. Confirm the active environment before testing payments or notifications.

### After contract or schema changes

Update generated clients only through the selected generator/command. Review generated diffs. Apply migrations to the isolated local database, refresh fixtures where needed, and run relevant contract/integration checks. Do not edit generated code as the primary fix for an incorrect schema.

### Stopping services

Stop client/API/worker through their documented controls. Workers should stop claiming new work and finish or relinquish current work safely. Durable pending jobs remain recoverable on restart; killing a process is not proof that a provider action did not execute.

### Resetting disposable data

Use reset only for a confirmed isolated disposable local database. Verify target/environment first and stop competing writers. The reset command must reject shared/UAT/production targets and require deliberate confirmation. Never infer that a database is disposable from its name alone.

A local reset cannot undo sandbox provider transactions. Retain or reconcile stable external references before clearing local financial state. Do not reset while unresolved external payment/refund obligations exist without the integration owner's recovery procedure.

## 14. Troubleshooting

| Symptom | Likely checks | Safe next action |
|---|---|---|
| Runtime/dependency install fails | Version mismatch, private registry access, unsupported host | Use pinned toolchain; resolve access; do not upgrade arbitrarily |
| Database connection fails | Service readiness, host/port/database, local credential reference | Check redacted configuration and service state |
| Migration fails | Wrong engine/version, missing privilege, partial prior migration | Inspect migration record; follow owner repair procedure |
| Client cannot reach API | Wrong origin/device address, port conflict, browser origin rules | Bind correct development address and allowlist |
| Login fails | Wrong adapter/channel, expired challenge, clock, attempt limits | Use approved fixture flow; never bypass authentication |
| Menu is empty | Fixture not loaded, no published revision, wrong store | Verify seed revision and active catalog pointer |
| Checkout returns quote conflict | Expiry, changed catalog/benefit, consumed quote | Obtain and explicitly confirm a new quote when appropriate |
| Payment stays pending | Worker stopped, mock outcome not triggered, provider lookup/callback problem | Check durable work and resolve existing reference |
| Duplicate-key conflict | Same operation key reused for changed intent | Recover original operation; create new key only for deliberate new intent |
| Staff action forbidden | Role or store scope mismatch | Use assigned fixture role; do not relax authorization |
| Staff version conflict | Another command already changed state | Refresh and decide a currently permitted action |
| Refund cannot proceed | Unknown/successful exposure consumes refundable capacity | Reconcile original refund; do not remove reservation manually |
| Rewards show unavailable | Selected adapter down, rule fixture absent, unresolved adjustment | Inspect authoritative adapter/job; do not fabricate a balance |
| Notifications absent | Sink selected, permission denied, worker/adapter failure | Inspect sink and delivery state; ordering may still be correct |
| Jobs repeat | Lease/crash/retry behavior, missing provider lookup | Inspect operation identity and receipts before replay |
| Tests affect own dev data | Test database isolation misconfigured | Stop tests; correct target guards and restore approved fixtures |

Report a setup issue with OS/tool versions, source revision, sanitized error, failing step, expected result and correlation/reference where safe. Exclude tokens, connection strings and customer/provider secrets.

## 15. Maintainer Acceptance and Handoff

WP-04 is accepted only when:

- [ ] Binding register contains actual repository, versions, paths and commands.
- [ ] Nonsecret configuration template is present and missing config fails clearly.
- [ ] Locked dependency installation works on each claimed supported environment.
- [ ] Migration and deterministic fixture commands work from a clean disposable database.
- [ ] API, worker and client startup are documented with observable readiness.
- [ ] Local adapter and notification sink behavior are documented and exercised.
- [ ] A developer other than the setup author completes the walkthrough.
- [ ] Recovery checks pass without manually editing transaction outcomes.
- [ ] Test database and reset safeguards are verified.
- [ ] Known limitations and support owners are recorded.

Record verification date, repository revision, host environment, selected adapters, tester and remaining issues. Until this evidence exists, retain the document status “Setup specification awaiting repository binding.”

## 16. Related Documents and Approval

| Document | Relationship |
|---|---|
| `04-sdd.md` | Architecture, workers, authority and recovery design |
| `05-database-specification.md` | Logical schema, constraints and migration expectations |
| `06-api-specification.yaml` | Proposed route/schema contracts and unresolved adapters |
| `07-delivery-plan.md` | WP-04 setup ownership and M4 readiness gate |
| `09-coding-standards.md` | Planned implementation conventions |
| `10-git-and-review-workflow.md` | Planned contribution/review procedure |
| `11-test-plan.md` | Planned complete verification strategy |
| `15-operations-runbook.md` | Planned operational recovery and escalation |

Planned references do not imply those documents or commands already exist.

| Approval | Reviewer | Status / date |
|---|---|---|
| Repository/toolchain binding | Technical Lead — TBD | Pending / — |
| Local environment and secret handling | DevOps Owner — TBD | Pending / — |
| Migration/fixtures | Database Owner — TBD | Pending / — |
| Independent onboarding verification | Developer / QA — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial stack-neutral onboarding specification, configuration contract, command interface, verification and troubleshooting guide |
