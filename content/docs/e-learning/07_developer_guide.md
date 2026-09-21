---
title: "07 — Developer Implementation Guide"
---

# 07 — Developer Implementation Guide

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-07 |
| Version | 0.1 — complete implementation guide draft |
| Date | 10 September 2026 |
| Primary sources | `02_prd.md`, `03_ux_ui_spec.md`, `04_sdd.md`, `05_database_spec.md`, `06_openapi.yaml` |
| Source versions | Brief/PRD/UX/SDD/database v0.1; OpenAPI info.version 0.1.0 |
| Owner | Technical lead — named individual pending |
| Audience | Backend, client, database, worker, QA, DevOps and reviewing engineers |
| Status | Proposed implementation baseline; application and production environment not yet supplied |

This guide explains how to implement the agreed document set, from a clean development environment through a reviewed release candidate. It provides developer responsibilities, module boundaries, concrete API usage, transaction patterns, testing instructions, and troubleshooting guidance.

There is no verified application repository, selected runtime/framework, or deployed service in this project context. Commands that depend on those choices are expressed as a required repository task interface, not falsely presented as existing scripts. PostgreSQL remains the database specification's proposed reference dialect. Browser cookie authentication is the OpenAPI baseline; native bearer authentication remains deferred.

## 1. Read first and follow the source of truth

| Document | Developer responsibility |
|---|---|
| `01_project_brief.md` | Understand scope, intended users, objectives and pending commitments |
| `02_prd.md` | Implement requirement IDs, academic policies and acceptance fixtures |
| `03_ux_ui_spec.md` | Implement screen IDs, accessible controls and complete UI states |
| `04_sdd.md` | Preserve module boundaries, guards, idempotency and recovery design |
| `05_database_spec.md` | Use scoped keys, immutable revisions, indexes and migration rules |
| `06_openapi.yaml` | Implement exact operations, field names, security, request/response schemas and errors |
| This guide | Apply the above consistently in code, review, verification and handoff |

The PRD owns business rules. The SDD and database specification describe mechanisms. The OpenAPI file owns the wire contract. If two documents disagree, stop the affected implementation choice, record the discrepancy, and update the relevant source documents together. Do not fix a mismatch by silently changing a response field or academic rule in one controller.

The OpenAPI draft contains 136 operations and 193 schemas and previously passed specification/example checks. That is contract validation, not proof that an API server exists or passes tests. Revalidate the exact checked-out version during implementation.

## 2. Nonnegotiable implementation rules

1. Derive actor and institution from the authenticated session. A client-supplied identifier never establishes ownership.
2. Check authorization on lists, counts, detail, downloads, writes and operation reconciliation.
3. Return academic success only after durable transaction commit.
4. Separate upload readiness from assignment submission, and submission from feedback publication.
5. Reuse the original operation key for a transport retry. Never spend another attempt because a response was lost.
6. Read student-visible values through published/finalized pointers; do not serialize draft records and ask the UI to hide them.
7. Append immutable attempts and revisions. A correction advances a pointer and preserves earlier evidence.
8. Use exact decimal arithmetic and unambiguous timestamps.
9. Keep network/file/scanner work outside database lock-holding transactions.
10. Preserve valid academic writes during code rollback; database restore is a separate incident procedure.

## 3. Close implementation prerequisites

| Decision | Required output | Owner |
|---|---|---|
| Runtime and frameworks | Approved versions, dependency manager, lockfile and support review | Technical lead |
| Student/staff platforms | Browser/device matrix and native scope decision | Product/technical lead |
| Database | Engine/version; reference DDL trial; transaction/decimal proof | Database owner |
| File provider/scanner | Private immutable object version and scan capabilities | Technical/security owner |
| Institution configuration | Timezone, approved languages, login normalization | School/Identity owner |
| Recovery and password policy | Delivery/evidence method, verification and session configuration | Identity owner |
| Academic policies | Deadline acceptance instant, assessment roster, limits and history access | Academic authority |
| Delivery environment | Repository, CI, secret injection, support and recovery owners | Release/service owner |

These choices are not automatically approved by generating documents. Work can proceed on contract review, pure policies, fixtures, and design clarification while a dependent infrastructure choice is pending. Do not call a story Ready if its critical behavior still relies on an unspecified policy.

In particular, the SDD proposes sampling the database wall clock after lock waits and validation as `accepted_at`, retained only if commit succeeds. This is not HTTP arrival time or physical commit-completion time. Obtain academic approval before coding deadline-sensitive acceptance.

## 4. Repository and module layout

Proposed layout, to be adapted explicitly to the selected ecosystem:

| Area | Contents |
|---|---|
| `clients/student` | Student shell, screens, state, API adapter and uploads |
| `clients/staff` | Academic setup, authoring, review, publication and audit UI |
| `server/modules/identity` | Accounts, sessions, evidence and explicit capabilities |
| `server/modules/academics` | Terms, classes, membership and teacher assignment |
| `server/modules/scheduling` | Sessions, cancellation and authorized schedule queries |
| `server/modules/files` | Staging metadata, scanner jobs, references and downloads |
| `server/modules/assignments` | Policy, current work state, attempts and feedback |
| `server/modules/results` | Assessments, expected roster and result publication |
| `server/modules/attendance` | Draft/finalized roster and coverage |
| `server/modules/communication` | Notices, event recipients and read state |
| `server/modules/profile` | Permitted preferences and identity projections |
| `server/modules/audit` | Restricted audit/review projections |
| `server/shared` | Transactions, time/decimal primitives, errors and telemetry |
| `worker` | Job dispatch and handlers using domain interfaces |
| `contracts` | Canonical OpenAPI copy and generated contract artifacts |
| `database/migrations` | Ordered, checksummed migrations and bounded backfills |
| `tests` | Policy, integration, contract, UI and fixture suites |
| `deploy` | Environment definitions, health checks and release tooling |
| `docs` | Approved document versions and developer/runbook instructions |

Keep transport handlers thin: parse → authenticate → call use case → serialize. Application use cases own transaction boundaries. Domain policies implement academic decisions. Repositories receive an explicit transaction handle. Storage/notification adapters perform side effects through defined interfaces.

Do not make a shared database helper that lets every controller update every module's tables. The modular monolith shares a transaction-capable database, not unrestricted ownership of each other's data.

## 5. Local setup from a clean machine

Complete this sequence after the repository and stack are selected:

1. Clone the approved repository and read its `README` and applicable `AGENTS.md` instructions.
2. Install the exact runtime versions from the repository's version manifest. Use the dependency lockfile; do not upgrade packages as part of routine setup.
3. Create local configuration from a committed example containing names and safe placeholders only. Obtain actual secrets through the approved secret process.
4. Start isolated local database, object-store adapter and scanner/worker dependencies. Bind services to approved local interfaces; never point local jobs at production.
5. Apply migrations to an empty local database using one migration runner. Record checksum/version and fail on drift.
6. Seed synthetic institution, users, grants, term/class, membership and assignment fixtures. Generate individual test credentials outside versioned source.
7. Start API, worker and clients. Establish same-origin browser access or a local reverse proxy matching cookie/CSRF expectations.
8. Run contract validation and the first vertical-slice smoke test in Section 6.
9. Confirm logout/account switching clears private content and all processes can restart without losing confirmed records.

Do not execute the entire Markdown database specification as a shell/SQL script. Extract the reviewed reference DDL block into a versioned migration, validate it on the approved engine, and record any adaptations. The reference DDL was not run against a live database when authored.

### Required repository task interface

The team should implement these tasks, using its chosen tooling, and document the actual commands in the repository README. The names below are proposed targets, not commands available today.

| Task | Required behavior |
|---|---|
| `bootstrap` | Verify tools and install locked dependencies |
| `services-up` / `services-down` | Start/stop isolated local dependencies without deleting persistent volumes by default |
| `migrate` | Apply ordered migrations once; reject checksum mismatch |
| `seed-dev` | Insert deterministic synthetic fixtures safely; never target production |
| `dev-api`, `dev-worker`, `dev-student`, `dev-staff` | Start each process with the intended configuration |
| `lint` / `typecheck` | Run selected ecosystem static checks |
| `validate-contract` | Validate OpenAPI, references, operation IDs and examples |
| `test-policy` / `test-integration` | Execute pure rules and real-database behavior |
| `test-contract` / `test-ui` | Check implemented wire responses and core UI journeys |
| `build` | Create immutable artifacts from locked dependencies |
| `smoke` | Test authenticated core read/write paths in an explicit environment |

Each task returns nonzero on failure and prints safe diagnostics. Destructive reset tasks, if needed for disposable databases, must be separate and unmistakably scoped; routine setup must not drop a populated database.

## 6. First working vertical slice

Build one complete student action before spreading implementation across many screens:

1. Admin provisions two synthetic students and one teacher.
2. Admin creates year/term/subject/class and enrolls only Student A.
3. Teacher publishes a text-only assignment in the class.
4. Student A signs in and retrieves the assignment.
5. Student B attempts the same list/detail/write path and receives the authorized unavailable/denied behavior.
6. Student A submits with one operation key; the server commits an immutable receipt.
7. Repeat the same request and key. Verify the same attempt ID and accepted time and exactly one attempt row.
8. Restart the API/client. Student A opens own history and sees the confirmed attempt.
9. Withdraw Student A. General class access stops; own past receipt remains readable while the account is active.

Record source commit, fixture identity references, request references and test outcome. Do not use real student accounts or production data to prove the slice. Add file uploads only after the simpler text flow demonstrates authorization and commit/replay behavior.

## 7. Configuration and secret handling

| Configuration group | Required entries and behavior |
|---|---|
| Identity | Session/evidence durations, allowed origins, cookie settings, password policy |
| Institution | Timezone, supported language tags, safe support contact configuration |
| Database | Connection secret, pool limits, statement/lock timeouts, migration identity |
| Files | Private store identity, size limits, exact-version support, scanner settings |
| Worker | Lease duration, retry/backoff, concurrency, queues and safe error categories |
| Operations | Environment/build labels, telemetry destinations, alert routing and backup policy |

Variable names are selected in the repository; do not treat this table as an existing `.env` schema. Validate mandatory configuration at startup. Missing timezone, session secret or file configuration fails readiness rather than silently choosing a default institution policy.

Secrets never belong in source files, OpenAPI examples, client bundles, screenshots or issue descriptions. Use separate identities for migrations, API, notifications and scanning. General logs must not print raw request bodies, cookies, recovery evidence, grades or assignment text. Production and nonproduction recipient/store/database identities must be unmistakably separate.

## 8. Contract-first API implementation

For each endpoint:

1. Locate its `operationId`, security requirements, `x-required-capability`, request schema and success/error schemas in `06_openapi.yaml`.
2. Locate `x-command-kind` and `x-command-target` if it is a command. These define the operation-receipt scope.
3. Validate input shape and bounds before domain work; reject unexpected ownership/privilege fields.
4. Establish the principal and resource scope; use parameterized repository queries.
5. Execute the use case under the appropriate transaction/guards.
6. Return the exact `{data, meta}` success shape or `{error, meta}` error shape; never invent a third wrapper.
7. Validate actual responses against the checked-in schema in tests.

The proposed base is `/api/v1`, relative to the same origin. Do not hardcode an unapproved hostname. HTTP clients must handle documented non-2xx responses and network exceptions independently.

| Wire convention | Implementation rule |
|---|---|
| UUID | JSON string; never derive permission from its format |
| Marks | Two-decimal strings such as `40.00`; no floating-point JSON substitution |
| Timestamp | RFC3339 offset/instant; institution timezone returned separately where required |
| Revision | Positive root revision supplied as `expected_revision` in relevant writes |
| Pagination | Default20/max100; opaque filter-bound cursor; full authorized totals |
| Nullability | Respect explicit null versus absence; do not serialize empty strings for missing scores |
| Binary upload | Raw `application/octet-stream`; actual-byte limit enforced while streaming |
| Error certainty | REJECTED or UNKNOWN; do not interpret transport timeout as definite rollback |

Generated client models may help, but generation must support OpenAPI 3.1 features used here, including `oneOf`, null unions and conditional schemas. Pin the chosen generator and review its output. Do not hand-edit generated files; fix the schema/template or add a typed adapter outside generated code.

## 9. Authentication and browser sessions

Use the baseline browser flow:

1. `GET /auth/csrf` returns a CSRF token and sets an anonymous preauth cookie when no session exists.
2. `POST /auth/login` sends login/password with the preauth cookie and `X-CSRF-Token`.
3. The server rotates identity/session credentials, sets `__Host-slp-session`, and returns the session DTO including a session-bound CSRF token.
4. Protected reads send the session cookie; protected writes send both session cookie and CSRF header.
5. `GET /me/session` restores current principal/expiry context. `POST /auth/logout` revokes the current session and expires the cookie.

The cookie is opaque, Secure, HttpOnly, SameSite=Lax, Path=/ and has no Domain attribute. Do not change to JWT/local-storage authentication without an approved contract change. Match local HTTPS/origin behavior to the selected cookie implementation and document it; do not weaken production cookie attributes to accommodate an improvised local setup.

Illustrative browser code, not framework-specific application code:

```javascript
const bootstrapResponse = await fetch('/api/v1/auth/csrf', {
  credentials: 'same-origin'
});
if (!bootstrapResponse.ok) throw new Error('CSRF bootstrap failed');
const bootstrap = await bootstrapResponse.json();

const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': bootstrap.data.csrf_token
  },
  body: JSON.stringify({ login, password })
});
// Handle the documented error body before reading a successful session DTO.
// Do not log password, cookies, or returned CSRF tokens.
```

Every protected request reads current server-authoritative session/account state. Disabling or password recovery revokes prior sessions. Combined-role accounts use the stricter relevant session policy. Cookie possession alone does not establish class access.

Recovery evidence is single-use. If completion succeeds but its response is lost, try signing in with the new password; a consumed code is not proof that recovery failed. Delivery method/password rules remain Identity approval gates. Unknown and known identities receive the same public request response.

## 10. Authorization implementation

Represent permissions as explicit capabilities plus resource relationships. A role label is a preset, not a global bypass. An administrator does not automatically publish grades or impersonate a student's submission.

Centralize reusable predicates:

- Is the account/session active and in the current institution?
- Does the actor have the capability required by the operation?
- Is the teacher assigned to this class, or explicitly granted a wider academic capability?
- Is the student currently enrolled for new content/activity?
- Is the requested historical record owned by the student and permitted after withdrawal/archive?
- Is the revision published/finalized and still visible?
- Is the file reference attached to this exact authorized parent?

Apply them before serializing any title, count, score or file metadata. Use identical unavailable behavior for inaccessible and nonexistent academic IDs. Test negative paths with valid IDs belonging to another user, not only malformed IDs.

Use role-specific DTOs: `StaffResult` may include draft content under authority; `ResultRow` cannot. `SubmissionReceipt` exposes only current published feedback. Do not add `has_draft_feedback` to a student response, since even draft existence is outside the agreed projection.

## 11. Database implementation patterns

All scoped keys and FKs include institution_id. Current revision pointers are bound to their owning root, not just a globally valid child ID. Preserve these composite relationships when using an ORM; do not replace them with a simple single-column association.

Mutable roots use optimistic revision checks. A draft edit creates a new immutable revision and advances a root pointer. Confirmed attempts, published snapshots, receipts, event intent and audit cannot be updated/deleted through ordinary paths. Do not disable triggers so a generic ORM save method can work.

Illustrative compare-and-swap pattern:

```sql
UPDATE slp.user_preferences
SET language_tag = :language_tag,
    revision = revision + 1
WHERE institution_id = :institution_id
  AND id = :preferences_id
  AND user_id = :actor_id
  AND revision = :expected_revision;
```

The placeholders above are application-binding notation. Zero updated rows must be interpreted under current authorization: unavailable or revision conflict, not success. If rows/audit/receipt must commit together, all share the same transaction.

A database CHECK on one row cannot prove current enrollment, cross-table publication state, file group size, or result-batch atomicity. Implement those under the SDD guards. The database guide documents which invariants require commands rather than DDL alone.

## 12. Lock ordering and transaction ownership

The correctness-first SDD protocol is:

1. Begin a short database transaction.
2. Lock the institution authorization guard shared for normal protected mutations, exclusive for access changes.
3. Revalidate account/session/grants under the guard.
4. Lock affected classes exclusively in sorted stable-ID order.
5. Lock operation/state/entity/file rows in the documented deterministic order.
6. Validate current domain rules, write records/receipt/audit/outbox, commit and respond.

No operation upgrades the authorization guard after holding a class lock. Repositories do not secretly begin independent transactions. A worker performing a domain mutation obeys the same protocol.

Never upload, scan, deliver recovery messages or wait for user confirmation while holding these locks. Ready immutable file metadata is already available when finalization starts.

The coarse class guard may limit hot-class throughput. Measure lock waits at a concentrated deadline spike, not just evenly distributed traffic. Refinement requires a replacement race analysis and tests for finalization/archive/withdrawal/feedback; simply removing the guard is not an optimization.

A deadlock/serialization abort rolls back the entire command. The SDD proposes at most two additional bounded internal retries with jitter, rerunning policy checks. Connection loss around commit is different: first reconcile the original command because it may already have committed.

## 13. Idempotency and uncertain outcomes

Each marked command has an operation kind and target declared in OpenAPI. Scope the idempotency key to actor + kind + target. For collection commands with no resource UUID, use the authenticated principal's institution UUID; do not guess from the endpoint's English name.

| Operation | Kind | Target |
|---|---|---|
| `submitAssignment` | `assignment.finalize` | path assignment_id |
| `createUpload` | `upload.create` | principal.institution_id |
| `commitResultPublication` | `result.batch` | principal.institution_id |
| `markNotificationRead` | `notification.read` | path notification_id |

Persist a canonical digest: preserve meaningful text and ordered file IDs, normalize time/decimal representations, and include path target/expected revision. Same key with different canonical input is `OPERATION_PAYLOAD_CONFLICT`. Do not hash arbitrary language-dependent map serialization.

A confirmed replay is checked before today's deadline and new-command revision checks, but after authorization to the original own record. It returns the original resource identity/time without consuming another attempt. Do not expire confirmed keys after a generic 24-hour cache window.

Client reconciliation example:

```json
{
  "command_kind": "assignment.finalize",
  "target_id": "22222222-2222-4222-8222-222222222222",
  "idempotency_key": "example_operation_0001"
}
```

Send this body to `POST /operations/lookup` with session/CSRF. It is a read-only lookup and does not require a new Idempotency-Key header. CONFIRMED returns an authorized original-resource locator; fetch its receipt. REJECTED is a terminal original outcome. NOT_FOUND_YET can mean an in-flight transaction and does not justify a new key. Resend the original request/key when appropriate.

Preserve only an account-bound minimal pending marker across client restarts: operation key, assignment reference and creation time. Do not persist unsaved academic text or credentials under a claim of full offline support. Logout/account switch clears incompatible markers and drafts. Own history also lets the user find a committed attempt if a marker is lost.

## 14. Assignment finalization implementation

`POST /assignments/{assignment_id}/submissions` uses the `SubmitAssignment` union:

```json
{
  "mode": "TEXT",
  "text": "My completed assignment response.",
  "expected_policy_revision": 1
}
```

Required headers are the current CSRF header and original Idempotency-Key; the session cookie is sent by the browser. No student_id is accepted. FILES mode needs ready file_ids; TEXT_AND_FILES needs both text and file_ids.

Use-case pseudocode:

```text
validate request shape and canonical input
begin transaction using the SDD lock hierarchy
validate actor and current access
if original terminal operation exists:
    compare digest, reauthorize outcome, return original identity after transaction ends
load/create unique student_assignment_state
validate active class, published policy, membership, attempt count, feedback lock
lock exact file rows and validate ownership/purpose/readiness/expiry/group limits
sample database wall clock now, after lock waits
validate open/due/late-close against sampled accepted_at
allocate next attempt from locked state
insert original confirmed operation and immutable attempt with exact policy revision
insert typed file references; advance current pointer/count; insert audit
commit
serialize durable SubmissionReceipt
```

Do not return 201 because bytes finished uploading. Do not use a transaction-start timestamp sampled before waiting for a lock. Do not assign a new accepted time on replay. Do not reuse a previous attempt row for resubmission.

Baseline boundaries: open≤accepted_at≤due is on time; late is allowed only when enabled and due<accepted_at≤late_close. Published feedback locks further attempts. Finalization and archive/withdrawal compete under shared guards; whichever commits first determines the valid next state. Earlier accepted work survives later archive.

## 15. File implementation from staging to download

| Step | API | Developer behavior |
|---|---|---|
| Allocate | `POST /uploads` | Validate bounded declaration; generate private staging identity; no client object key |
| Transfer | `PUT /uploads/{upload_id}/content` | Stream raw bytes; enforce actual 20 MiB limit and checksum; identical accepted bytes retry safely |
| Inspect | `POST /uploads/{upload_id}/complete` | Verify bytes and persist check-job intent before returning 202 |
| Poll | `GET /uploads/{upload_id}` | Expose lifecycle only to owner; READY is still not submission |
| Retry transient scan | `POST /uploads/{upload_id}/retry-check` | Only eligible failed/unexpired/unreferenced object; unsafe rejected content needs replacement |
| Cancel staging | `POST /uploads/{upload_id}/cancel` | Reject referenced files; mark deletion under lock |
| Attach | Academic publish/finalize command | Verify Ready exact file/version, purpose, owner, count and aggregate size |
| Download | `GET /file-references/{file_reference_id}/content` | Reauthorize exact parent and stream private bytes; no public storage URL |

Formats: PDF, DOCX, PPTX, XLSX, JPEG, PNG; max 20 MiB each, five files/50 MiB group, 24-hour unattached expiry. Limits remain upstream proposed policies. Actual bytes/type/checksum and safety checks are server-owned; original filename is display metadata.

The object version scanned is the one attached. Do not copy/move bytes after acknowledging an attempt. If commit fails, a ready unreferenced object may remain for cleanup. If a confirmed file later becomes unavailable, preserve the attempt/reference, report an operational failure and recover the exact object version.

Clarify how declared upload size/type/checksum are retained during allocation and compared with verified metadata; the database stores authoritative verified identity. If additional declaration fields are required, create an explicit schema migration rather than silently treating unverified metadata as verified. Document the provider metadata or database representation in the file adapter contract.

The OpenAPI baseline does not promise multipart forms, range download, resumable upload or pre-signed public downloads. A client library's defaults must match the raw-byte PUT contract. Rejected files keep other valid form content intact.

## 16. Staff academic setup and publishing

Build supported forms for academic years, terms, subjects, classes, teacher assignments and membership. Validate term/year containment, session boundaries and overlapping enrollment intervals under the appropriate guards. Use explicit withdrawal/completion/archive operations; never delete referenced history.

Staff material/assignment editing saves immutable draft revisions. Publication checks current root revision, complete policy, ready file references and authority, then advances visibility and writes audit/event intent together. Due/late-close may extend, not shorten. After the first attempt, class/mode/max attempts/grading basis cannot be casually changed.

Session overlap warnings need deliberate acknowledgement of the latest conflicts. Cancellation requires reason and retains history while excluding the session from attendance. Backdated enrollment corrections create review flags for affected academic records.

Treat generic authoring capabilities as wire hints plus record-specific policy. The API's `x-required-capability` is not an exhaustive authorization engine; school-wide notices and grade publication require explicit additional authority where defined by the PRD.

## 17. Feedback, results and attendance

### Feedback

Review against a specific attempt. Saving draft feedback does not make it visible. Publishing verifies the reviewed attempt is still current, commits a published revision and locks further attempts. A newer student attempt produces CURRENT_ATTEMPT_CHANGED; do not attach the old feedback to the new attempt automatically. Corrections need a reason and keep the earlier visible value until commit.

### Results

Use the expected assessment roster, not the current result rows, to determine missing coverage. Assessment schedule publication and student score publication are separate. A draft score never appears through `ResultRow`, counts or student summaries.

Batch flow is preview→commit. `POST /staff/result-publications/preview` accepts explicit selected IDs/revisions/action/reason; it creates no academic mutation. `POST /staff/result-publications` commits the actor-bound selection token under current guards. Token expiry is checked for a new command; an original confirmed replay still returns its original outcome. All selected revision/pointer/batch/audit/event writes are atomic. No more than 100 selected results in the proposed baseline.

For published SCORED rows, calculate sum(earned)/sum(maximum)×100 using exact decimals, then half-up to two displayed decimals. Absent/Exempt are separate counts. Zero denominator yields null/N/A. Draft/missing/withdrawn expected results make coverage incomplete without revealing their private values. Do not average percentages or add assignment feedback without an approved mapping.

### Attendance

Load eligibility from started, noncanceled sessions whose start falls in enrollment intervals. Use explicit draft/finalized status records. Missing is NOT_RECORDED; never default unselected students to ABSENT. Finalize with `allow_incomplete` explicitly true or require a complete valid roster.

Percentage=(Present+Late)/(Present+Late+Absent); Excused contributes to recorded coverage but not that percentage denominator. No denominator means null/N/A. Cancellation and membership correction recalculate coverage and retain review/audit evidence. Draft/correction commands use the roster revision, including first-write materialization behavior described in the API decision register.

## 18. Worker, outbox and notifications

Publication commits outbox intent and event-time recipients with the academic transaction. A delayed worker must not reconstruct the old audience from today's membership. Delivery/read also checks current visibility; the snapshot is not a permanent grant.

Database-backed jobs use bounded claims and leases. Every claim increments lease_generation. Completion/heartbeat matches owner and generation; a stale worker cannot finish a newer claim. Commit claim state before external work; do not hold DB locks while scanning/deleting.

Delivery is at least once; unique event-recipient notification identity makes retries safe. Crash after delivery insertion but before job completion must produce no duplicate notification. Exhausted retries remain inspectable with safe error codes and approved replay, not silently lost.

Notification publication failure/delay never rolls back a confirmed submission or committed result. Submission itself has a durable receipt; no additional submission-notification event is implicitly required. Opening linked detail successfully permits explicit mark-read; a failed load remains unread. Ordinary notice wording changes preserve read state; explicit republish produces a new event.

## 19. Client screen and state patterns

Follow UX screen IDs rather than designing a second independent navigation model. Primary student destinations remain Home, Classes, Assignments, Results and Profile. Attendance/own history remain reachable even when general class access has changed.

Every query view distinguishes loading, successful empty, filtered empty, error, unavailable and stale data. A failed widget is not zero. Rows and summaries update to the same filter scope. Preserve list position on return when safe; clear incompatible data on logout/role/access change.

Every write view distinguishes editing, sending, confirmed, rejected and unknown. Unknown initiates reconciliation. Persistent confirmation/history is required for academic work; a transient toast alone is insufficient. Preserve safe form memory after recoverable errors but do not promise unsaved text survives restart.

Use typed API adapters to translate wire decimals/nulls/enums into presentation models. Unknown enums render a safe unavailable status and never enable an action. Do not recompute authoritative eligibility from device time. School timezone must be explicit on deadlines and receipts.

Accessibility work includes labels, semantic headings/table headers, visible focus, keyboard access, non-color status text, appropriate status announcements, enlarged text/reflow and reduced motion. No drag/swipe/hover-only required action. File progress announcements should not overwhelm assistive technology. Verify on the approved platform matrix rather than claiming all devices are supported.

## 20. Validation, errors and diagnostics

| Failure | Correct handling |
|---|---|
| Required text is whitespace | Reject with field error; preserve unrelated input |
| Score has excess decimals | Reject input before database scale coercion silently rounds it |
| Unknown identity sign-in | Same safe public failure as wrong credentials |
| Revision conflict | Show reload/reconcile; no silent last-write-wins |
| Deadline rejected | State work was not submitted; preserve any previous confirmed attempt |
| Network loss around commit | UNKNOWN; reconcile original key |
| Unsafe file | Reject/replace file; never permit a bypass to READY |
| Other student's record | Neutral unavailable response without title/count leakage |
| Scanner/worker down | Truthful pending/failure state and operational diagnosis |

Use stable machine error codes from OpenAPI. Map implementation exceptions to those codes centrally; do not parse human message strings in clients. Include safe request references and appropriate outcome certainty. Do not return raw SQL errors or entire exception stack traces.

Operational logs record route templates, environment/build, request reference, outcome category, latency, safe pseudonymous IDs, and worker job/claim references. Avoid unbounded per-student metric labels and raw academic bodies. Academic audit is separately restricted and contains only approved before/after fields required for attribution.

## 21. Test layers and executable contract check

| Layer | What it proves |
|---|---|
| Pure policy tests | Deadline boundary, exact decimal formulas, allowed transitions |
| Database integration | Composite FKs, immutability, guards, rollback, pointer integrity |
| Contract tests | Implemented request/response/status/security matches OpenAPI |
| Worker/file tests | Exact version checks, lease fencing, replay and cleanup races |
| Client tests | State transitions, navigation, safe account switching and accessibility |
| End-to-end/UAT | Complete student/staff journeys using a named build |
| Load/recovery | Hot-class contention, capacity, fault handling and consistent restore |

Use the actual selected database engine for locking tests. An in-memory substitute cannot prove transaction ordering. Use isolated file storage and scanner adapters with controlled failures, then provider integration tests for actual object identity/durability behavior.

A contract-validation example, after the repository has installed and pinned the required validator dependency:

```python
from pathlib import Path
import yaml
from openapi_spec_validator import validate

contract = yaml.safe_load(Path('contracts/06_openapi.yaml').read_text())
validate(contract)
```

This checks the specification, not server behavior. Add schema validation of embedded examples and actual endpoint responses, operation-ID uniqueness, path parameter declarations, and required security headers. Do not claim API implementation tests passed because this script passed.

For deterministic tests, use synthetic time/IDs at the policy boundary and controlled database-time integration fixtures. A fake clock must not leak into production configuration. Use fixture cleanup limited to disposable test data; never truncate real academic history.

## 22. Essential regression scenarios

| Test group | Minimum cases | Source |
|---|---|---|
| Access | Own/other/unassigned/withdrawn/disabled/archived, including file and count paths | REQ-PERM-001–003; SDD-T02 |
| Authentication | Logout and recovery invalidate subsequent requests; consumed evidence rejected | REQ-AUTH-003–006 |
| Attempts | Same key twice; changed payload; two distinct last-attempt requests | REQ-ASG-008; SDD-T03–04 |
| Boundaries | Exact due and late-close accepted; one instant after rejected | AC-ASG-01–04 |
| Races | Withdrawal/archive/feedback publication against finalization | AC-ASG-06–08 |
| Unknown outcome | Drop response after commit, retrieve original receipt after deadline | AC-ASG-05; SDD-T09 |
| Files | Foreign/unready/expired/unsafe file, cleanup race, missing confirmed version | REQ-FILE-001–004 |
| Results | 100/150=66.67%, scored zero, absent/exempt, unpublished incomplete | AC-RES-01–05 |
| Attendance | 90% with12/12 versus12/13 coverage; only Excused N/A; cancellation | AC-ATT-01–05 |
| Publication | Stale revision, invalid selected batch and draft correction visibility | REQ-RES-003–004 |
| Worker | Crash after insert, expired lease, stale completion, current-access change | SDD-T12; DB-AC-14 |
| Restore | Confirmed attempts plus exact files recovered; restored credentials revoked | SDD-T17; DB-AC-15 |

Test both sides of race ordering using controlled barriers; a test that merely sends requests concurrently once is weak evidence. Check database counts, current pointers and original timestamps as well as HTTP responses. Distinguish expected domain rejections from technical reliability failures.

## 23. Feature build order and story checklist

| Increment | Deliverable | Gate |
|---|---|---|
| 1 | Stack/repository/task interface/contract validation | Reviewed dependencies and technical spike |
| 2 | Identity, capabilities, institution/time primitives, audit | Positive and negative auth tests |
| 3 | Academic setup, enrollment, sessions | Staff prepares a term without manual DB edits |
| 4 | Text assignment vertical slice and operation receipts | Original receipt survives replay/restart |
| 5 | Private file lifecycle, materials and file-mode work | Ready/cleanup/download races verified |
| 6 | Review and feedback publication | Current-attempt conflict and historical access |
| 7 | Results and attendance | All fixed calculation/publication fixtures |
| 8 | Outbox, notices, notifications, Home/profile integration | Event deduplication and current visible read state |
| 9 | Full UX/accessibility/platform checks | Named UAT build passes core journeys |
| 10 | Load/restore/release rehearsal and support handoff | Release evidence and owners complete |

Infrastructure for audit/outbox can be introduced earlier and used by each feature. This sequence refines the SDD into developer slices; it does not defer required event intent until after a feature ships.

Before coding a story, record requirement IDs, UX screen/states, operation IDs, affected tables, approved dependent decisions, acceptance fixtures and expected migration/configuration changes. Before marking it done, attach reviewed code, relevant test evidence, contract/docs alignment, negative access coverage and release notes. Done does not mean deployed.

## 24. Git, code review and change management

Repository and issue-provider choices remain pending. Use small branches and reviewable commits tied to real issue IDs only after issues exist. Do not invent Jira keys or copy unrelated BROWN project branch names into this application.

A change should explain the user/problem, resulting behavior, affected contract/schema, and evidence. For transaction changes, describe the lock order, invariant and race tests. For publication changes, describe draft versus visible effects. For migrations, describe compatibility/backfill/rollback impact.

Reviewer checks:

- Does the endpoint enforce actor and resource scope on every path?
- Does the use case own one transaction and preserve the guard hierarchy?
- Can a retry duplicate an attempt or event?
- Can any student DTO leak drafts or another student's data?
- Are file identities and past revisions preserved?
- Are numeric/time semantics exactly the approved ones?
- Do schema/contract/client/test changes move together?
- Is the migration compatible with both old and new code during rollout?
- Do logs and examples exclude secrets and unnecessary academic content?

Use expanding schema migrations and compatible API additions. Breaking field/enum/academic changes require coordinated versioning and document updates. Do not hand-patch a production table and later pretend the migration was the source of truth.

## 25. CI, release candidate and rollback

Build once from locked dependencies. The same immutable artifact advances through UAT and approved deployment. Record source commit, artifact digest, contract version, migration version and environment configuration revision.

CI gates include static checks, policy/database/contract tests, migration smoke, relevant client tests, and dependency/security review. Longer load and recovery evidence may run in a controlled release environment, but must be tied to the release candidate and approved configuration.

Before rollout: verify required decisions/owners, current consistent backups, compatible migrations, health checks, worker event compatibility, smoke fixtures, alert routing and rollback trigger. Only one migration runner operates. Pause or drain incompatible worker claims; preserve lease recovery.

Normal rollback returns to compatible prior code/configuration while retaining accepted academic writes. Do not restore yesterday's database to undo a broken screen. If schema incompatibility requires stopping writes and forward repair, use the reviewed incident plan. Disaster restoration has a separate approval/reconciliation process and documented data-loss window.

No deployment is performed by this guide. Production execution and permissions follow the actual approved repository/environment workflow.

## 26. Performance and troubleshooting

Use the PRD proposed profile and targets, not an invented throughput promise. The baseline includes 1,000 students, 100 staff, 100 classes, 10,000 attempts, 100 concurrent users, 20 metadata requests/second and 10 concurrent uploads. Validate the actual approved profile with both distributed and hot-class traffic.

Watch query plans, N+1 reads, database pool saturation, lock-wait time, scanner backlog, job lease churn, outbox age and private file download failures. Do not add a cache of permissions or grades to hide an underlying query problem. Primary authoritative reads remain necessary after writes and access changes.

| Symptom | Investigate | Avoid |
|---|---|---|
| Login works in an API client but not browser | Origin/HTTPS, preauth cookie, CSRF binding, credential mode | Disabling CSRF or weakening production cookies |
| Upload reaches 100% but submit unavailable | CHECKING/READY state, actual scanner result, purpose/expiry | Marking the file Ready client-side |
| Duplicate attempts | Key lifecycle, canonical scope, missing guard/unique invariant | Deduplicating only in UI |
| Submitted work shown Pending | Durable current-state pointer, response mapping and refresh | Reclassifying by grading status |
| Grades differ between pages | Shared filter/snapshot and decimal calculation path | Averaging displayed rounded percentages |
| Stale feedback publish rejected | New current attempt or root revision | Force-publishing against the wrong attempt |
| Notification delay | Outbox/recipient snapshot, lease/retry and current access | Reversing academic transaction |
| Unauthorized old file link succeeds | Download gateway context and shared-cache/public URL behavior | Assuming an opaque ID is authorization |
| Deadline p95 spikes | Class guard contention, pool and lock wait | Removing locks without replacement proof |
| Restore misses files | Exact-version manifest and object backup lag | Calling database-only recovery successful |

Raise an incident for confirmed data exposure, corruption or unavailable confirmed attachments. Preserve request/operation references and safe evidence. Do not repair academic records directly from guessed log text.

## 27. Known handoff gaps to resolve explicitly

| Gap | Required action |
|---|---|
| No approved runtime or repository | Implement actual local task interface after selection; document versioned commands |
| Reference PostgreSQL DDL unexecuted | Apply/test on approved engine; validate grants/triggers and constraints |
| Recovery/password method pending | Approve school evidence/delivery/security policy and implement generic public responses |
| Declared upload metadata retention | Define staging declaration representation separately from verified file identity |
| Initial attendance roster GET | Follow nullable logical-empty DTO; first write must atomically materialize root and advance revision |
| Preview token persistence/signing | Choose bounded actor-bound representation; bind exact selected revisions/action/reason; do not use token as permission |
| Acknowledgement-only command receipts | Reference existing affected root or approved persisted receipt locator; never invent a missing resource |
| Assessment metadata visibility | Follow StaffAssessment projection semantics; do not assume nonexistent assessment revision tables |
| Capability vocabulary and role presets | Publish approved allowlist and exact grant mapping, including separate academic publishers |
| Environment-specific grants/retention | Add approved deployment migrations/policies; do not fabricate role names or purge rules |

These are concrete implementation tasks and review gates, not reasons to change user behavior silently. Record resolutions in the SDD/database/OpenAPI when they affect those contracts. If a new requirement is needed, raise it for product review rather than making a private assumption in code.

## 28. Developer handoff and completion checklist

A new developer should be able to identify the approved source documents, start the isolated environment using documented repository tasks, authenticate synthetic accounts, trace one operation from screen to use case to database, run focused tests, and explain how retries and published visibility work.

Before handing off a feature:

- Link actual issue, requirement, screen, operation and migration references.
- Provide precise setup/configuration changes without secret values.
- Record relevant tests and their environment/build, including negative and unknown-outcome cases.
- Update generated clients through the chosen generation workflow when the contract changes.
- Describe operational failure signals, recovery behavior and release impact.
- Ensure another developer can reproduce the fixture and result without manual production edits.

| Reviewer | Responsibility | Status |
|---|---|---|
| Technical lead | Architecture/code ownership and stack/task interface | Pending named reviewer |
| Database owner | Migrations, transaction/constraint behavior and recovery | Pending named reviewer |
| Identity/security owner | Capabilities, sessions, evidence and private data | Pending named reviewer |
| Academic authority | Deadline/result/attendance policy approval | Pending named reviewer |
| QA lead | Fixtures, contract/UI coverage and reproducibility | Pending named reviewer |
| Release/service owner | Environment, alerts, rollback and support | Pending named reviewer |

| Version | Date | Change |
|---|---|---|
| 0.1 | 10 September 2026 | Complete initial developer guide aligned to PRD, UX, SDD, database and OpenAPI drafts; setup/task interface, implementation patterns, exact API flow, verification and delivery handoff |

Companion documents: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml).

This document completes `07_developer_guide.md` as a reviewable guide. It does not create an application repository, approve the technology stack, run the reference database migration, or deploy a service.
