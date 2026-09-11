---
title: "09 — Test Plan"
---

# 09 — Test Plan

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-09 |
| Version | 0.1 — complete verification plan draft |
| Date | 10 September 2026 |
| Sources | Documents 02–08, including OpenAPI 0.1.0 and backlog planning items S01–S48 |
| Owner | QA lead — named person pending |
| Reviewers | Product, academic authority, technical/database, design, Identity/security, release/service owners |
| Execution status | NOT RUN: no application build, deployed test environment or live database test result is supplied |
| Deliverable | Test strategy, fixtures, detailed scenario suites, boundary/race cases, coverage and release-evidence rules |

This plan defines how to verify the proposed MVP, including student, staff and operational workflows. It does not certify an implementation. Document checks and prior OpenAPI validation are distinct from application, database, security, performance, UAT and restoration tests.

TC identifiers in this document and S/E backlog IDs are local planning references, not existing Jira/test-management keys. Create execution records only after a build/environment is selected. No production test, notification or deployment is authorized by writing this plan.

## 1. Objectives, scope and risks

Verify that students can sign in, access their own learning day/resources, submit work once with durable evidence, see published results/finalized attendance and receive relevant notices. Verify that staff can prepare academic data, publish/review/correct it through supported workflows. Verify current authorization, exact file versions, recoverable writes and an operable service.

Highest risks: unauthorized academic access; false submission success; duplicate/lost attempts; stale feedback publication; partial result publication; draft leakage; wrong decimal/time/coverage calculations; confirmed-file loss; stale worker effects; revival of revoked credentials after restore.

Included surfaces: all 136 current OpenAPI operations, approved student/staff UI matrix, proposed relational constraints/guards, private object/scanner lifecycle, outbox/worker, audit, migration and recovery. Cross-institution fixtures verify schema isolation even though the pilot deployment has one institution; they do not certify multi-tenant onboarding.

Excluded until explicitly scoped: online exams, payments, chat, guardian accounts, photos, directories, calendar/reminders, general push/email/SMS, external school synchronization, automated import and native auth transport. Required recovery delivery follows its selected method and remains in scope.

## 2. Authority and proposed policy gates

The PRD supplies product oracles; UX supplies screen/state behavior; SDD supplies transactions; database specification supplies relational constraints; OpenAPI supplies wire schema/security; backlog supplies delivery ownership. A disagreement is a specification defect, not permission to choose the behavior that happens to pass.

Before affected execution, approve DEC-02/03 platform/language/timezone, DEC-05 auth/recovery/password policy, DEC-06 assignment rules/acceptance time, DEC-07 result/attendance/expected roster, DEC-08 history/access, DEC-10 engine/providers, DEC-13 load/recovery targets, DEC-14 retention/privacy and API handoff decisions. Unresolved decision marks the case BLOCKED with owner/gate; it is never PASS or silently removed from coverage.

The authoritative acceptance-time proposal is database wall clock sampled after lock waits/validation, retained only if commit succeeds. Fixtures below use that definition. If the school changes it to physical commit-time semantics, update fixtures and SDD/API before running acceptance.

## 3. Test levels and responsibilities

| Level | Owner | Purpose and environment |
|---|---|---|
| Specification review | QA/product/technical | Resolve requirements, schemas, decision gaps and traceability; no running app needed |
| Unit/policy | Module developer | Exact-decimal formulas, transition/deadline predicates, normalization and serializers |
| Database integration | Backend/database engineer | Real selected engine, constraints, lock ordering, rollback and immutable pointers |
| Contract/API | API/QA | Validate live responses/errors/security against exact OpenAPI; all routes use required profiles |
| File/worker integration | Worker/backend engineer | Isolated provider/scanner plus exact-version, failure, lease and replay assertions |
| UI/component | Client/design/QA | State transitions, input, keyboard/focus, navigation and localization |
| End-to-end/UAT | QA and school users | Complete role journeys on one release candidate |
| Security verification | Identity/security and QA | Threat-oriented scope, CSRF/session, upload, cache/log and service-role checks |
| Load/resilience | Technical/service and QA | Approved traffic/device profile, hot-class contention and dependency faults |
| Restore/rollout rehearsal | Release/database/service owner | Consistent DB+files recovery, migration compatibility and code rollback |

Developers own story-level tests; QA owns completeness and execution evidence; school authority approves academic oracles; release owner makes the recorded go/no-go with required reviewers. Named individuals are pending. A tester should not approve their own unresolved critical fix without peer review.

## 4. Environments and configuration control

| Environment | Permitted use | Controls |
|---|---|---|
| Local/disposable CI | Fast policy/schema/transaction tests | Synthetic data, isolated secrets/store, selected real DB for locking |
| Integration | API/file/worker fault tests | Controlled scanner/object adapters and selected provider checks; no production recipients |
| UAT | School/user workflows and platform matrix | Named immutable candidate, frozen fixtures/config and approved users |
| Performance | Reproducible load and contention | Recorded resources/mix; no load against production without separate authorization |
| Recovery sandbox | Restore and queue replay | Isolated network/recipients; credentials revoked before reopening |
| Production smoke | Authorized rollout only | Approved synthetic identities/records, narrow checks, no real-student impersonation |

Record build digest/commit, contract version, migration checksum, runtime/DB/provider versions, config revision, timezone/languages, browser/device/OS, fixture version and network profile for each run. Do not place secrets in evidence. Separate environment databases, file stores, queues and recipient channels; prove a UAT event cannot reach production.

The selected stack/device matrix is not yet approved. Do not claim coverage for all browsers or a particular native runtime. List actual supported combinations and test results before release. Use a deterministic test clock at policy boundaries and a real database wall-clock integration test; never ship a controllable test clock in production.

## 5. Entry, suspension and exit criteria

Entry for a suite: approved dependent decisions, accessible environment/build, verified fixture state, contract/schema version, required role grants, observable safe evidence, and reversible cleanup method. Security/load/fault suites additionally need explicitly isolated targets and resource limits.

Suspend when the environment is unstable enough to invalidate results, fixtures are corrupted, scope/contract changed, secrets leak into evidence, an uncontrolled recipient/provider target is detected, or a confirmed integrity/access incident needs containment. Record reason and cases invalidated. Resume only after environment/fixture recovery and affected baseline rerun.

Exit for a story: all applicable cases and negative/recovery variants pass on reviewed build; open nonblocking issues have owner/workaround/approval; source/contract/docs align. Exit for release: PRD Must cases, UAT-01–11, required technical/UX/database coverage, security/integrity and recovery/load gates pass; decisions/owners closed; named build accepted; migration/rollback/restore/smoke/monitoring evidence recorded.

No fixed overall pass percentage can excuse unauthorized access, lost confirmed work or a failed core workflow. BLOCKED/NOT RUN required cases do not count as passed. A scope exclusion needs explicit product approval and updated acceptance/contracts, not a convenient test status.

## 6. Fixture catalog and reset rules

All aliases below are synthetic. Map them to generated UUIDs in a fixture manifest; never infer IDs or copy live student records. Credentials/evidence are generated securely for the run and excluded from reports.

| Fixture | Definition |
|---|---|
| INST-A / INST-B | Separate institution scopes for isolation tests; only A is pilot context |
| ADM-A | Active admin with explicit setup/identity grants; publication requires a separate grant |
| PUB-A | Active academic publisher for CLASS-A only |
| TEACH-A / TEACH-B | Teacher assigned to A versus unassigned teacher |
| STUD-A / STUD-B | Active enrolled student versus different active student for ownership swaps |
| STUD-W / STUD-D / STUD-P | Withdrawn active account, disabled account, pending account |
| SUPPORT-A / AUDIT-A | Restricted diagnostic support versus granted audit reviewer |
| YEAR-A / TERM-A | Inclusive school calendar bounds; out-of-range candidate fixtures |
| CLASS-A / CLASS-H | Active class and completed/archived read-only historical class |
| ENR-A | Enrollment interval [start, withdrawal); exact boundary session fixtures |
| ASG-T / ASG-F / ASG-TF | Published text/files/text-and-files assignments with one allowed attempt |
| ASG-R | Published three-attempt assignment with no published feedback initially |
| ASG-L | Late enabled with explicit late-close; no automatic late default |
| ASG-D / ASG-X | Staff-only draft and archived assignment |
| FILE-R / FILE-C / FILE-U | Ready exact-version file, still checking file, another student's file |
| EXAM-P / EXAM-D / EXAM-C | Published future, draft, canceled exam schedule; scores published independently |
| NOTICE-A / NOTICE-E | Current class notice and expired/archived notice |
| OP-A / OP-B | Two distinct logical operation keys; OP-A same-payload replay and changed-payload conflict |

Time fixtures use a synthetic school timezone explicitly recorded per run. Example Asia/Phnom_Penh is a test value, not approval of the actual institution timezone. Use UTC/offset representations of the same instant, midnight-overlap sessions and invalid/ambiguous local input where applicable.

File fixtures: allowed supported formats; zero bytes;1 byte where content validation matters;20MiB exactly and20MiB+1; five valid files totaling50MiB and one byte above; sixth file; wrong claimed type; disguised executable; bounded malformed office package; harmless scanner test fixture; changed bytes under same upload; expired staging; missing confirmed object version. Security fixtures must remain in isolated test storage and not include uncontrolled executable execution.

Reset between cases using isolated schema/fixture namespaces or a reviewed fixture-reset task. Confirmed-history delete triggers should not be disabled by the ordinary API role. A privileged disposable-environment reset is distinct from product deletion behavior. Preserve failed-run evidence before reset. For race tests reset to the identical initial revision/attempt/file state for each ordering.

## 7. Execution record and evidence format

For every execution record capture: local TC ID and variant; source requirement/story/API/test IDs; expected oracle; run/build/environment/config/fixture IDs; actor/role; exact nonsecret steps/time; actual response/status plus operation/request references; DB row counts/pointers and object checksum/version where needed; screenshot/accessibility trace if relevant; PASS/FAIL/BLOCKED/NOT RUN; defect and reviewer.

A screenshot of Submitted is insufficient. Verify durable receipt identity/time and corresponding row/file reference after restart/replay. A passing response-schema check does not prove authorization or atomicity. A database row alone cannot prove exact file bytes exist. Use the evidence source appropriate to the invariant.

Log useful timestamps around request start, lock-acquired test barrier, acceptance sampling, commit confirmation, response transmission, event visibility and restore completion. Do not include raw passwords/cookies/recovery tokens or full submitted academic text in shared evidence.

## 8. Story-aligned scenario suites

TC-001–TC-048 align to S01–S48. Each is a scenario suite with four separately recorded acceptance checkpoints inherited from that item. Record each checkpoint individually; a failed checkpoint makes the suite FAIL. Split a suite into smaller automated/manual tests as needed while retaining parent TC and source AC IDs. All statuses below begin NOT RUN.

Common preconditions: Section 6 fixture manifest and Section 5 entry gates; authenticated actors with explicit scoped permissions; isolated controllable fault/test environment. Per-suite source dependencies and readiness gate are listed. For review-only suites use documents/build metadata, not fictitious API results. For each attempted mutation verify rejected operations leave academic state unchanged and successful operations survive authoritative reload.

### TC-001 — Approve product and technical decision baseline

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S01 |
| Requirements | Governance or integrated release acceptance |
| Prerequisite deliveries | None |
| Decision gate | DEC-01–15; applicable UX/SDD/DB/API decision registers |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Compare source decision registers and identify named approvers.
2. Inspect recorded stack/policy approvals and deferred scope; trace each unresolved decision to a blocked Ready gate.

**Expected checkpoints and oracle**

- **TC-001.1 / S01-AC1:** Record institution, sponsor, academic authority, product/technical/QA/service owners and unresolved decisions without inventing approval.
- **TC-001.2 / S01-AC2:** Approve or explicitly defer platform, timezone/languages, identity/recovery, assignment rules, expected assessment roster, retention and load/recovery targets before dependent work is Ready.
- **TC-001.3 / S01-AC3:** Document chosen runtime/database/provider versions and why required transaction/file capabilities are supported; PostgreSQL remains proposed until selected.
- **TC-001.4 / S01-AC4:** Record actual repository, CI ownership and release audience; no deadline or budget is inferred.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-002 — Create reproducible repository and isolated development environment

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S02 |
| Requirements | REQ-DATA-002, NFR-11 |
| Prerequisite deliveries | S01 |
| Decision gate | DEC-02/10; selected stack |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. On a clean isolated runner, follow only documented bootstrap commands and start dependencies.
2. Remove a required secret/timezone setting and verify readiness fails; restart services and inspect retained synthetic records and recipient destinations.

**Expected checkpoints and oracle**

- **TC-002.1 / S02-AC1:** A clean-machine setup installs locked dependencies and starts isolated API/client/worker dependencies using documented commands.
- **TC-002.2 / S02-AC2:** DEV/UAT database, object-store, credentials and recipients are separate from production; a test publication cannot reach production recipients.
- **TC-002.3 / S02-AC3:** Required missing configuration fails readiness; no real secrets or shared default passwords are committed.
- **TC-002.4 / S02-AC4:** Restart preserves durable development records; routine services-down does not delete volumes.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-003 — Validate contract and resolve implementation handoff gaps

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S03 |
| Requirements | REQ-UX-001, NFR-12 |
| Prerequisite deliveries | S01 |
| Decision gate | API-DEC-01–04; developer guide Section27 |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Validate the exact checked-in OpenAPI file and embedded examples using pinned validators.
2. Inspect resolutions for upload metadata, preview tokens, roster creation and receipt locators; generate clients twice and compare contract semantics.

**Expected checkpoints and oracle**

- **TC-003.1 / S03-AC1:** OpenAPI 3.1 validation, unique operation IDs, path/security declarations and embedded examples pass for the checked-in file.
- **TC-003.2 / S03-AC2:** Resolve upload declaration storage, initial attendance roster materialization, preview token binding and acknowledgement receipt targets before their implementation stories are Ready.
- **TC-003.3 / S03-AC3:** Generated clients, if selected, preserve null unions, decimal strings and oneOf behavior; generation is reproducible.
- **TC-003.4 / S03-AC4:** Contract changes identify affected database/client/test artifacts and receive review.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-004 — Apply and verify scoped database schema

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S04 |
| Requirements | REQ-AUD-001, NFR-06 |
| Prerequisite deliveries | S02, S03 |
| Decision gate | DB-DEC-01/02/03; approved engine |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Apply migrations to empty selected-engine DB; re-run runner and introduce checksum drift in a disposable copy.
2. Attempt cross-institution/wrong-root FK inserts, history update/delete and file identity modification using ordinary application role.

**Expected checkpoints and oracle**

- **TC-004.1 / S04-AC1:** Reference schema applies to an empty isolated selected-engine database with checksummed migration.
- **TC-004.2 / S04-AC2:** Cross-institution and wrong-root revision pointers fail through constraints.
- **TC-004.3 / S04-AC3:** Updating/deleting immutable attempts/revisions and changing referenced-file identity is rejected through ordinary roles.
- **TC-004.4 / S04-AC4:** Version mismatch fails migration; roles cannot disable triggers or perform schema changes through API credentials.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-005 — Implement guarded commands and original-operation receipts

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S05 |
| Requirements | REQ-ASG-008, REQ-UX-004, REQ-UX-005, NFR-06 |
| Prerequisite deliveries | S04 |
| Decision gate | SDD ADR-06; API command target contract |
| API scope | lookupOriginalOperation |

**Procedure**

1. Execute a guarded command twice with identical key/payload, then reuse key with changed body.
2. Force a stale root revision and drop a commit response; reconcile with original key and inspect receipt/resource counts.

**Expected checkpoints and oracle**

- **TC-005.1 / S05-AC1:** Commands acquire authorization/class/entity/file guards in documented order and share one transaction handle.
- **TC-005.2 / S05-AC2:** Same actor/kind/target/key and canonical payload returns original terminal identity; different payload conflicts.
- **TC-005.3 / S05-AC3:** Lost response around commit is reconciled; NOT_FOUND_YET is not rejection and never creates a replacement operation key.
- **TC-005.4 / S05-AC4:** Revision conflict preserves prior committed state; successful replay is checked before new deadline/revision rules but after current authorization.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-006 — Create durable outbox, worker leases and audit infrastructure

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S06 |
| Requirements | REQ-AUD-001, REQ-OPS-002, NFR-10 |
| Prerequisite deliveries | S04, S05 |
| Decision gate | Worker retry/lease and audit retention configuration |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Commit a synthetic domain update with outbox/audit, then inject a rollback before commit.
2. Crash worker after delivery insertion; expire/reclaim lease and attempt completion from old generation; inspect audit/log redaction.

**Expected checkpoints and oracle**

- **TC-006.1 / S06-AC1:** Domain transaction can insert audit/outbox intent atomically with its resource change.
- **TC-006.2 / S06-AC2:** Expired jobs can be reclaimed; stale lease generation cannot complete a newer claim.
- **TC-006.3 / S06-AC3:** Duplicate processing is safe and exhausted retries remain visible for controlled replay.
- **TC-006.4 / S06-AC4:** Logs omit raw credentials/academic payloads while restricted audit records required actor/time/change/reason.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-007 — Provision and maintain school accounts and explicit grants

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S07 |
| Requirements | REQ-AUTH-001, REQ-ADM-005 |
| Prerequisite deliveries | S04, S06 |
| Decision gate | DEC-05/08; capability vocabulary |
| API scope | listUsers, createUser, getUser, updateUser, listGrants, createGrant, revokeGrant |

**Procedure**

1. Create a pending user, duplicate its canonical identifier, update its name and inspect linked records.
2. Attempt self-grant and unauthorized institution-wide grant; revoke an authorized grant and inspect safe user DTO/audit.

**Expected checkpoints and oracle**

- **TC-007.1 / S07-AC1:** Provisioning creates pending institution-managed accounts; duplicate normalized login or school identifier is rejected.
- **TC-007.2 / S07-AC2:** Name/login maintenance preserves stable identity and linked academic records; students cannot edit identity or assign roles.
- **TC-007.3 / S07-AC3:** Explicit class/institution grants are checked against allowlist and granting authority; revoke preserves audit.
- **TC-007.4 / S07-AC4:** No password hash, token digest or recovery evidence appears in staff responses.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-008 — Implement browser sign-in, session continuity and logout

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S08 |
| Requirements | REQ-AUTH-002, REQ-AUTH-003, REQ-AUTH-005 |
| Prerequisite deliveries | S02, S03, S07 |
| Decision gate | API-DEC-01; DEC-05 session policy |
| API scope | bootstrapCsrf, signIn, getSession, logout |

**Procedure**

1. Use browser preauth CSRF bootstrap and login; repeat with missing/wrong token and invalid credentials.
2. Expire session during a pending write, reauthenticate, logout, replay old session and sign in as another account.

**Expected checkpoints and oracle**

- **TC-008.1 / S08-AC1:** CSRF bootstrap/preauth login rotates opaque secure cookie and returns correct authorized workspace.
- **TC-008.2 / S08-AC2:** Invalid/unknown credentials have equivalent safe public behavior; required CSRF and trusted-origin checks reject invalid writes.
- **TC-008.3 / S08-AC3:** Expiry hides protected content and offers reauthentication without confirming pending work.
- **TC-008.4 / S08-AC4:** Logout revokes current session and clears private drafts/cache; second account cannot see first account data.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-009 — Implement activation, recovery and disabled-account revocation

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S09 |
| Requirements | REQ-AUTH-004, REQ-AUTH-006 |
| Prerequisite deliveries | S06, S07, S08 |
| Decision gate | DEC-05 recovery method/password policy |
| API scope | requestRecovery, completeRecovery, completeActivation, disableUser, issueActivation |

**Procedure**

1. Request recovery for known/unknown identities; complete valid evidence, then replay and test expired evidence.
2. Drop completion response and follow documented sign-in recovery; disable account and replay every old session.

**Expected checkpoints and oracle**

- **TC-009.1 / S09-AC1:** Known/unknown recovery requests return the same status/body without exposing challenge or account state.
- **TC-009.2 / S09-AC2:** Valid evidence completes once; expired/replayed evidence fails; successful recovery revokes all old sessions.
- **TC-009.3 / S09-AC3:** Disabling an account prevents subsequent protected requests and is audited.
- **TC-009.4 / S09-AC4:** If completion response is lost, UI explains sign-in with new credentials or restarted recovery rather than treating consumed evidence as definite failure.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-010 — Enforce resource authorization and historical access consistently

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S10 |
| Requirements | REQ-PERM-001, REQ-PERM-002, REQ-PERM-003, NFR-07 |
| Prerequisite deliveries | S05, S07, S08 |
| Decision gate | DEC-08 history policy |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Exercise own/other/unassigned/disabled/withdrawn/archived principals against list/count/detail/write/download families.
2. Swap valid foreign IDs in path/body and follow old deep links; compare denied metadata and retained own-history access.

**Expected checkpoints and oracle**

- **TC-010.1 / S10-AC1:** Own/other/unassigned/disabled fixtures produce permitted/denied behavior for list/detail/count/write/download.
- **TC-010.2 / S10-AC2:** Withdrawal or grant revocation changes next protected request; active own past submissions/results/attendance remain readable per approved policy.
- **TC-010.3 / S10-AC3:** Inaccessible/nonexistent academic IDs have equivalent unavailable responses without titles or counts.
- **TC-010.4 / S10-AC4:** Student serializers expose only approved published data; administrator role alone cannot publish or impersonate.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-011 — Manage academic years, terms, subjects and classes

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S11 |
| Requirements | REQ-ADM-001, REQ-ADM-002 |
| Prerequisite deliveries | S07, S10 |
| Decision gate | Approved school calendar/date policy |
| API scope | staffListAcademicYear, staffCreateAcademicYear, staffGetAcademicYear, staffUpdateAcademicYear, staffArchiveAcademicYear, staffListTerm, staffCreateTerm, staffGetTerm, staffUpdateTerm, staffArchiveTerm, staffListSubject, staffCreateSubject, staffGetSubject, staffUpdateSubject, staffArchiveSubject, staffListClass, staffCreateClass, staffGetClass, staffUpdateClass, staffArchiveClass |

**Procedure**

1. Create year/term/subject/class and submit invalid dates/duplicate code.
2. Edit from two stale revisions and archive referenced class/term; verify history and rejection of hard-delete.

**Expected checkpoints and oracle**

- **TC-011.1 / S11-AC1:** Year/term dates and containment are validated; class requires subject/term/name/code and duplicate term/class code is rejected.
- **TC-011.2 / S11-AC2:** Staff can create, view, replace and archive records through supported forms.
- **TC-011.3 / S11-AC3:** Referenced records cannot be hard-deleted; archive retains read-only academic history.
- **TC-011.4 / S11-AC4:** Stale edits conflict and preserve newer revision; each controlled change is audited.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-012 — Manage teacher assignments, enrollment and withdrawal

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S12 |
| Requirements | REQ-ADM-003, REQ-ADM-004 |
| Prerequisite deliveries | S10, S11 |
| Decision gate | DEC-08; effective interval rules |
| API scope | listEnrollments, createEnrollments, listTeachers, createTeachers, changeEnrollment, endTeacherAssignment |

**Procedure**

1. Assign teacher and enroll student; try inactive users and overlapping intervals.
2. Withdraw then backdate/correct membership with reason; inspect access, retained history and affected review flags.

**Expected checkpoints and oracle**

- **TC-012.1 / S12-AC1:** Only eligible active users are newly assigned/enrolled; overlapping duplicate intervals are rejected.
- **TC-012.2 / S12-AC2:** Withdrawal/completion records reason/effective interval and preserves existing academic history.
- **TC-012.3 / S12-AC3:** Backdated correction flags affected records for review and does not silently rewrite historical scores/attempts.
- **TC-012.4 / S12-AC4:** Membership changes serialize with active academic commands and invalidate incompatible client data.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-013 — Create, update and cancel class sessions

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S13 |
| Requirements | REQ-CLS-003, REQ-CLS-004 |
| Prerequisite deliveries | S11, S12 |
| Decision gate | Institution timezone and overlap acknowledgement policy |
| API scope | staffListSessions, staffCreateSession, staffUpdateSession, cancelSession |

**Procedure**

1. Create valid session, invalid end/start and out-of-term session; create teacher/class overlap.
2. Acknowledge current conflict, introduce a concurrent change, then cancel with reason; inspect schedule and attendance effect.

**Expected checkpoints and oracle**

- **TC-013.1 / S13-AC1:** End follows start and session lies within school-local term bounds.
- **TC-013.2 / S13-AC2:** Teacher/class overlaps are identified and latest conflict requires explicit acknowledgement.
- **TC-013.3 / S13-AC3:** Cancel preserves history/reason and excludes session from next-activity and attendance calculations.
- **TC-013.4 / S13-AC4:** Concurrent stale edit rejects; authorized archived corrections require separate permission.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-014 — Browse own classes, overview and sessions

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S14 |
| Requirements | REQ-CLS-001, REQ-CLS-002 |
| Prerequisite deliveries | S10, S12, S13, S16 |
| Decision gate | UX navigation baseline; directory deferred |
| API scope | listAccessibleTerms, listClasses, getClass, listClassSessions, getClassSession |

**Procedure**

1. As enrolled student select current and historical terms, open overview/tabs and page sessions.
2. Access unrelated/withdrawn class, omit room data and fail one tab load; verify fallback labels and own-history entry point.

**Expected checkpoints and oracle**

- **TC-014.1 / S14-AC1:** Term/current/history filters show only authorized classes with stable ordering and read-only archived labels.
- **TC-014.2 / S14-AC2:** Overview shows teacher/location; missing room is Not assigned; Students tab remains absent.
- **TC-014.3 / S14-AC3:** Sessions load with correct ordering and canceled status; failed tab is not empty data.
- **TC-014.4 / S14-AC4:** General class access stops after withdrawal; own historical records remain reachable through separate destinations.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-015 — Implement private upload allocation, transfer and scanning

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S15 |
| Requirements | REQ-FILE-001, REQ-FILE-002 |
| Prerequisite deliveries | S03, S06, S10 |
| Decision gate | File provider/scanner; upload declaration storage |
| API scope | createUpload, getUpload, putUploadBytes, completeUpload, retryUploadCheck |

**Procedure**

1. Allocate and transfer allowed file fixtures, complete/poll scanning, interrupt transfer and retry identical bytes.
2. Submit empty/oversized/disguised/unsafe fixtures and simulate scanner failure; verify no false Ready or submission.

**Expected checkpoints and oracle**

- **TC-015.1 / S15-AC1:** Allocate owned staging, transfer raw bytes, complete and poll UPLOADING/CHECKING/READY or failure states.
- **TC-015.2 / S15-AC2:** Server rejects zero/disguised/unsupported/oversized files and enforces actual 20 MiB limit; scans exact immutable version.
- **TC-015.3 / S15-AC3:** 100% transfer is not READY/submitted; transient retry never bypasses unsafe rejection.
- **TC-015.4 / S15-AC4:** File lifecycle and staged 24h expiry are owner-authorized; API never exposes arbitrary object keys/public URLs.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-016 — Provide shared UI shell, validation and list states

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S16 |
| Requirements | REQ-UX-001, REQ-UX-002, REQ-UX-003, REQ-UX-004, REQ-UX-006 |
| Prerequisite deliveries | S03, S08 |
| Decision gate | UX-DEC-01; approved platform/language matrix |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Run every shared query/write state fixture through student and staff shells.
2. Test whitespace/Unicode, keyboard/focus, scaled text, pagination/filter changes and account switch with pending input.

**Expected checkpoints and oracle**

- **TC-016.1 / S16-AC1:** Navigation/components use approved tokens and labels; required forms preserve valid Unicode and safe input on recoverable errors.
- **TC-016.2 / S16-AC2:** Loading, empty, filter-empty, offline, error, unavailable, stale and conflict are distinct.
- **TC-016.3 / S16-AC3:** Paged lists default 20/max 100, preserve filters/position where safe and never derive full totals from page length.
- **TC-016.4 / S16-AC4:** Keyboard/focus/labels/non-color status/enlarged text pass component checks; private state clears on account change.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-017 — Authorize exact file-reference downloads and protect cleanup

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S17 |
| Requirements | REQ-FILE-003, REQ-FILE-004 |
| Prerequisite deliveries | S15, S10 |
| Decision gate | Exact-version provider and retention rules |
| API scope | cancelUpload, downloadAuthorizedFile |

**Procedure**

1. Download through exact authorized reference; substitute another parent or user and follow a withdrawn material link.
2. Synchronize cleanup and finalization on the file-row lock; inject missing object after a valid confirmation and inspect retained metadata.

**Expected checkpoints and oracle**

- **TC-017.1 / S17-AC1:** Each download reauthorizes exact parent reference including own historical submission path; other-user copied reference fails.
- **TC-017.2 / S17-AC2:** Another user staged file cannot attach; aggregate groups enforce five files/50MiB.
- **TC-017.3 / S17-AC3:** Cleanup locks/rechecks references before deletion; race preserves referenced file or rejects new attachment.
- **TC-017.4 / S17-AC4:** Confirmed missing object remains an incident with retained receipt, never silent record deletion/replacement.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-018 — Publish, replace and archive class materials

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S18 |
| Requirements | REQ-MAT-001, REQ-MAT-003 |
| Prerequisite deliveries | S11, S15, S17 |
| Decision gate | content capability and revision policy |
| API scope | staffListMaterials, staffCreateMaterials, staffGetMaterials, staffReplaceMaterials, staffPublishMaterials, staffArchiveMaterials, historyMaterials |

**Procedure**

1. Create material draft, attempt publish with unready file, then publish Ready revision.
2. Replace file, conflict a stale edit and archive; compare old revision and separate submitted student attachment.

**Expected checkpoints and oracle**

- **TC-018.1 / S18-AC1:** Draft requires bounded title/content and attachments; publish requires ready authorized files.
- **TC-018.2 / S18-AC2:** Student visibility changes only on publication; draft/replaced revision history remains attributable.
- **TC-018.3 / S18-AC3:** Replacing teaching material never alters a confirmed student submission file.
- **TC-018.4 / S18-AC4:** Archive removes active visibility and preserves authorized evidence.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-019 — Browse and download published class materials

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S19 |
| Requirements | REQ-MAT-002 |
| Prerequisite deliveries | S14, S17, S18 |
| Decision gate | None beyond prerequisites |
| API scope | listMaterials, getMaterial |

**Procedure**

1. Open authorized published material, download and simulate transfer/viewer failure.
2. Test empty class, failed read, draft ID, copied reference after withdrawal and allowed archived-class history.

**Expected checkpoints and oracle**

- **TC-019.1 / S19-AC1:** Only published eligible materials appear; withdrawn student cannot fetch general material via old link.
- **TC-019.2 / S19-AC2:** File rows display safe name/type/size and downloading/error/retry states.
- **TC-019.3 / S19-AC3:** No material displays a specific empty state; failed request is not an empty result.
- **TC-019.4 / S19-AC4:** Unsupported local viewer does not imply all formats can preview; authorized download remains available.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-020 — Author and publish assignment policy revisions

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S20 |
| Requirements | REQ-ASG-001, REQ-ASG-002, REQ-ASG-003, REQ-ASG-004 |
| Prerequisite deliveries | S05, S11, S15, S17 |
| Decision gate | DEC-06; accepted timestamp/policy baseline |
| API scope | staffListAssignments, staffCreateAssignments, staffGetAssignments, staffReplaceAssignments, staffPublishAssignments, staffArchiveAssignments, historyAssignments |

**Procedure**

1. Create assignment policy with each mode and invalid time/late/attempt combinations; publish valid revision.
2. After a confirmed attempt try prohibited field changes/deadline shortening; extend valid deadline, archive and try reopening.

**Expected checkpoints and oracle**

- **TC-020.1 / S20-AC1:** Valid bounded title/instructions/open/due/mode/attempt/late policy publishes only in authorized active class with Ready files.
- **TC-020.2 / S20-AC2:** Default attempts 1, up to 3; late disabled unless late_close>due; preview displays timezone/requirements.
- **TC-020.3 / S20-AC3:** Published deadlines extend only; after first attempt protected policy/class/grading basis cannot change.
- **TC-020.4 / S20-AC4:** Archive blocks new work under class guard, preserves history and cannot reopen/revert to Draft.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-021 — List assignments and explain eligibility

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S21 |
| Requirements | REQ-ASG-005, REQ-ASG-006 |
| Prerequisite deliveries | S14, S16, S20 |
| Decision gate | DEC-06 completion semantics |
| API scope | listAssignments, getAssignment |

**Procedure**

1. Prepare unsubmitted open/closed and submitted-ungraded assignments; switch All/Pending/Completed and term/class filters.
2. Open detail, inspect timezone/attempts/files/feedback, then fail load and change access.

**Expected checkpoints and oracle**

- **TC-021.1 / S21-AC1:** All/Pending/Completed follow confirmed attempts, not grading; closed unsubmitted remains Pending.
- **TC-021.2 / S21-AC2:** Detail shows due/timezone, instructions/files, mode, limits, attempts and published feedback only.
- **TC-021.3 / S21-AC3:** Eligibility comes from server and explains open/late/closed/feedback/attempt restriction; no artificial progress percentage.
- **TC-021.4 / S21-AC4:** Missing/failed/unauthorized states are distinct and filters cover all authorized results.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-022 — Finalize immutable assignment attempts exactly once

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S22 |
| Requirements | REQ-ASG-007, REQ-ASG-008, NFR-06 |
| Prerequisite deliveries | S05, S10, S17, S20 |
| Decision gate | SDD-DEC-01 accepted_at; DEC-06 limits |
| API scope | submitAssignment |

**Procedure**

1. Finalize each submission mode with exact file/content/policy fixtures and inspect committed rows.
2. Run boundary and last-attempt/withdrawal/archive races; drop response after commit and replay original key.

**Expected checkpoints and oracle**

- **TC-022.1 / S22-AC1:** TEXT/FILES/TEXT_AND_FILES validates required content, owner, Ready state, expiry and group limits.
- **TC-022.2 / S22-AC2:** Post-lock database acceptance time obeys inclusive due/late-close; upload start does not reserve on-time status.
- **TC-022.3 / S22-AC3:** Attempt/content/file references/current pointer/count/receipt/audit commit together; response lost after commit replays same ID/time.
- **TC-022.4 / S22-AC4:** Two requests for last attempt allow at most one; archive/withdrawal race gives one authoritative serial outcome.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-023 — Build submission form, unknown-outcome recovery and history

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S23 |
| Requirements | REQ-ASG-006, REQ-ASG-008, REQ-ASG-009, REQ-UX-004 |
| Prerequisite deliveries | S15, S16, S21, S22 |
| Decision gate | Pending-marker storage and history policy |
| API scope | listOwnSubmissions, getOwnSubmission |

**Procedure**

1. Prepare text/files in form, interrupt upload/check and attempt repeated Submit taps.
2. Lose finalization response, restart, reconcile original key, open old/new history, withdraw and switch accounts.

**Expected checkpoints and oracle**

- **TC-023.1 / S23-AC1:** Form validates mode/text/files and distinguishes uploading/checking/Ready from Submitted; duplicate taps disabled.
- **TC-023.2 / S23-AC2:** Unknown transport outcome reconciles original key; NOT_FOUND_YET does not create another attempt.
- **TC-023.3 / S23-AC3:** Confirmation/history survives restart and includes original accepted time/timeliness/content; prior attempts immutable.
- **TC-023.4 / S23-AC4:** Withdrawn active student can reach own history from Profile without reopening class access; logout clears private markers/drafts.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-024 — Review current and previous student attempts

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S24 |
| Requirements | REQ-ASG-010 |
| Prerequisite deliveries | S12, S22 |
| Decision gate | Review capability scope |
| API scope | listSubmissionRoster, getStaffSubmission, listStaffAttemptHistory |

**Procedure**

1. Open assigned roster, filter/page, review current and earlier immutable attempts.
2. Repeat as unassigned teacher and replace student/attempt/file IDs; verify counts and downloads denied.

**Expected checkpoints and oracle**

- **TC-024.1 / S24-AC1:** Roster lists relevant students with submitted/not-submitted, latest attempt, accepted time and grading state.
- **TC-024.2 / S24-AC2:** Review opens exact immutable current content/files and earlier attempts without modifying them.
- **TC-024.3 / S24-AC3:** Unassigned teacher cannot inspect rows/counts/downloads.
- **TC-024.4 / S24-AC4:** Pagination/filter counts cover authorized full roster.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-025 — Draft, publish and correct attempt-specific feedback

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S25 |
| Requirements | REQ-ASG-009, REQ-ASG-011, REQ-ASG-012 |
| Prerequisite deliveries | S06, S24 |
| Decision gate | Feedback publish authority and grading basis |
| API scope | getStaffFeedback, createFeedbackDraft, replaceFeedbackDraft, publishFeedback, historyFeedback |

**Procedure**

1. Save draft feedback for current attempt, inspect student view, then publish.
2. Create newer attempt before publish; retry stale feedback, then correct published feedback with reason and inspect resubmission lock.

**Expected checkpoints and oracle**

- **TC-025.1 / S25-AC1:** Draft save does not expose comment/score or draft existence to student.
- **TC-025.2 / S25-AC2:** Publish verifies reviewed attempt is still current; newer attempt causes conflict and requires fresh review.
- **TC-025.3 / S25-AC3:** Published feedback sets resubmission lock and emits one revision event; earlier attempts/history retained.
- **TC-025.4 / S25-AC4:** Correction requires reason and preserves old visible feedback until new revision commits.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-026 — Publish exam schedules and manage expected result roster

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S26 |
| Requirements | REQ-RES-001 |
| Prerequisite deliveries | S11, S12, S13, S10 |
| Decision gate | SDD-DEC-02 expected roster policy |
| API scope | staffListAssessments, staffCreateAssessments, staffGetAssessments, staffReplaceAssessments, staffPublishAssessments, staffArchiveAssessments, cancelAssessment, listAssessmentEligibility, addAssessmentEligibility, updateEligibility |

**Procedure**

1. Create scheduled assessment and publish details while scores remain draft.
2. Inspect expected roster capture, later enrollment/correction and canceled/past/unrelated next-exam candidates.

**Expected checkpoints and oracle**

- **TC-026.1 / S26-AC1:** Assessment has positive maximum, class/term/subject and valid paired exam times.
- **TC-026.2 / S26-AC2:** Publishing details makes future exam metadata visible independently of student scores.
- **TC-026.3 / S26-AC3:** Expected roster snapshot is captured at publication; later corrections are explicit, reasoned and reviewable.
- **TC-026.4 / S26-AC4:** Draft/canceled/past/unrelated exams do not become next-exam items.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-027 — Enter unique result drafts and prepare corrections

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S27 |
| Requirements | REQ-RES-002, REQ-RES-003 |
| Prerequisite deliveries | S26 |
| Decision gate | DEC-07 scoring and positive maximum limits |
| API scope | listStaffResults, createResultDraft, getStaffResult, replaceResultDraft |

**Procedure**

1. Create Scored/Absent/Exempt drafts, duplicates, excess precision and invalid maxima/marks.
2. Read as student, create stale draft update and draft correction against published result; inspect old visibility.

**Expected checkpoints and oracle**

- **TC-027.1 / S27-AC1:** One result identity per student/assessment; duplicate rejected.
- **TC-027.2 / S27-AC2:** Scored has exact valid 0..maximum marks; Absent/Exempt require null; excess precision rejected before DB coercion.
- **TC-027.3 / S27-AC3:** Drafts are staff-only and missing records are not zero.
- **TC-027.4 / S27-AC4:** Correction appends draft/reason without replacing previously visible score until publication.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-028 — Preview and atomically publish, correct or withdraw results

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S28 |
| Requirements | REQ-RES-003, REQ-RES-004, REQ-RES-007 |
| Prerequisite deliveries | S05, S06, S27 |
| Decision gate | API batch 100 and preview 10m proposal |
| API scope | previewResultPublication, commitResultPublication, getPublicationBatch, historyResults |

**Procedure**

1. Preview explicit result IDs/revisions with invalid and excluded rows; commit valid selection.
2. Change revision/permission before commit, inject mid-batch failure, replay after token expiry and withdraw published values.

**Expected checkpoints and oracle**

- **TC-028.1 / S28-AC1:** Preview binds actor/action/reason and explicit 1–100 selected IDs/revisions; invalid/excluded rows are listed.
- **TC-028.2 / S28-AC2:** Commit revalidates selection and authority; all selected pointers/revisions/items/events/audit commit or none.
- **TC-028.3 / S28-AC3:** Stale preview conflicts; confirmed original replay survives token expiry without another publication.
- **TC-028.4 / S28-AC4:** Withdrawal requires reason, removes affected student-visible values and makes coverage incomplete while preserving previous revisions.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-029 — Display published results with correct scoped summaries

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S29 |
| Requirements | REQ-RES-005, REQ-RES-006 |
| Prerequisite deliveries | S16, S28 |
| Decision gate | DEC-07 provisional formula |
| API scope | listOwnResults, getOwnResult |

**Procedure**

1. Load each results fixture with term/subject filter and multiple pages.
2. Compare exact numerator/denominator and incomplete labels; attempt other-student/draft/withdrawn result access.

**Expected checkpoints and oracle**

- **TC-029.1 / S29-AC1:** Term/subject filters return own published records only, never draft values/count leakage.
- **TC-029.2 / S29-AC2:** 40/50+60/100 shows100/150=66.67%; scored0 remains0.00%; Absent/Exempt are separate counts.
- **TC-029.3 / S29-AC3:** Zero scored denominator is N/A; missing/draft/withdrawn expected data is visibly Incomplete.
- **TC-029.4 / S29-AC4:** UI uses Published scored assessments percentage label and no GPA/rank/pass-fail/final grade.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-030 — Record draft attendance and explicitly finalize coverage

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S30 |
| Requirements | REQ-ATT-001, REQ-ATT-002 |
| Prerequisite deliveries | S12, S13, S16 |
| Decision gate | API empty roster and1000-row write resolution |
| API scope | getAttendanceRoster, saveAttendanceDraft, finalizeAttendance |

**Procedure**

1. GET uninitialized roster and inspect database before/after; race first draft writes.
2. Save selected statuses, leave others unrecorded, finalize with allow_incomplete false then true; test future/canceled session.

**Expected checkpoints and oracle**

- **TC-030.1 / S30-AC1:** One student/session identity; future/not-started/canceled sessions reject regular writes.
- **TC-030.2 / S30-AC2:** Initial GET is read-only with nullable logical root; first guarded write materializes once and honors revision.
- **TC-030.3 / S30-AC3:** Draft save affects explicit rows only and never marks missing students Absent.
- **TC-030.4 / S30-AC4:** Finalize either requires complete eligible roster or explicit allow_incomplete; draft status is not student-visible.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-031 — Correct attendance and reconcile membership/session changes

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S31 |
| Requirements | REQ-ATT-004, REQ-ATT-005 |
| Prerequisite deliveries | S30 |
| Decision gate | DEC-07 correction authority |
| API scope | correctAttendance, listReviewFlags, resolveReviewFlag |

**Procedure**

1. Correct finalized status with reason and stale revision; cancel a contributing session.
2. Backdate membership across a session boundary and inspect recalculation/review flag; resolve with attributable note.

**Expected checkpoints and oracle**

- **TC-031.1 / S31-AC1:** Correction requires reason and new finalized revision; earlier values remain audit-visible.
- **TC-031.2 / S31-AC2:** Session cancellation excludes its counts without deleting recorded history.
- **TC-031.3 / S31-AC3:** Membership backdating uses start-inclusive/end-exclusive intervals and flags affected reports.
- **TC-031.4 / S31-AC4:** Review flags can be listed/resolved with safe attributable evidence; resolution does not invent missing academic work.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-032 — Show finalized attendance and recorded coverage

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S32 |
| Requirements | REQ-ATT-003 |
| Prerequisite deliveries | S16, S30, S31 |
| Decision gate | DEC-07 attendance formula |
| API scope | listOwnAttendance |

**Procedure**

1. Read finalized/missing/draft attendance across term/class/date filters.
2. Execute fixed count fixtures including only Excused, only Absent and canceled session; compare full coverage to paged rows.

**Expected checkpoints and oracle**

- **TC-032.1 / S32-AC1:** History includes own finalized statuses with class/date filters; hidden drafts shown only as Not recorded where eligible.
- **TC-032.2 / S32-AC2:** 8Present+1Late+1Absent+2Excused gives90.00% and12/12; one missing gives12/13 provisional.
- **TC-032.3 / S32-AC3:** Only Excused is N/A; only Absent is0.00%; canceled/future sessions excluded appropriately.
- **TC-032.4 / S32-AC4:** Rows and whole-filter percentage/counts/coverage are coherent and accessible.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-033 — Deliver required in-app publication events once per recipient

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S33 |
| Requirements | REQ-NOT-002, REQ-NOT-003, NFR-09 |
| Prerequisite deliveries | S06, S10 |
| Decision gate | In-app baseline and event-time audience policy |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Publish each required event with event-time recipients; delay worker across a membership change.
2. Crash/replay fanout around delivery commit and measure event-to-visible lag with deduplicated rows.

**Expected checkpoints and oracle**

- **TC-033.1 / S33-AC1:** Assignment/feedback/result/notice publication captures eligible recipients inside domain transaction.
- **TC-033.2 / S33-AC2:** Worker replay after partial delivery inserts no duplicate event-recipient notification.
- **TC-033.3 / S33-AC3:** Current permission is rechecked on delivery/read; old event does not reopen withdrawn class access.
- **TC-033.4 / S33-AC4:** Measure event-commit to visible notification; proposed 95% within 60 seconds in healthy operation, reported under approved profile.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-034 — Author, publish, edit and archive notices

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S34 |
| Requirements | REQ-NOT-001, REQ-NOT-005 |
| Prerequisite deliveries | S06, S10, S16, S33 |
| Decision gate | School-wide capability and expiry policy |
| API scope | staffListNotices, staffCreateNotice, staffGetNotice, staffReplaceNotice, staffPublishNotice, staffArchiveNotice, historyNotices |

**Procedure**

1. Draft/publish class notice and attempt school-wide publication without grant; test invalid expiry.
2. Edit wording without notification reset, explicitly republish, archive/expire and follow old link.

**Expected checkpoints and oracle**

- **TC-034.1 / S34-AC1:** Required title/body/audience and expiry after publication validated; teacher lacks school-wide action without grant.
- **TC-034.2 / S34-AC2:** Draft notice invisible until publish; current still-published content available to later eligible enrollment.
- **TC-034.3 / S34-AC3:** Wording edit preserves previous read state; deliberate republish creates new revision/event.
- **TC-034.4 / S34-AC4:** Archive/expiry removes active visibility and old link becomes unavailable; audit retains changes.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-035 — Read notices and notifications with persistent unread state

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S35 |
| Requirements | REQ-NOT-003, REQ-NOT-004 |
| Prerequisite deliveries | S16, S33, S34 |
| Decision gate | None beyond approved communication policy |
| API scope | listNotices, getNotice, listNotifications, getUnreadCount, getNotification, markNotificationRead |

**Procedure**

1. List updates/notices/unread count, load linked detail then mark read.
2. Fail detail and mark-read separately, replay mark-read, change access and enroll a new student after old events.

**Expected checkpoints and oracle**

- **TC-035.1 / S35-AC1:** Updates/Notices show only currently visible items ordered by event/publication time and stable ID.
- **TC-035.2 / S35-AC2:** Successfully loaded linked detail permits mark-read; failed detail stays unread; read-update failure retries without falsely synchronized count.
- **TC-035.3 / S35-AC3:** Repeated mark-read retains original read time and no duplicate row; unread count excludes inaccessible items.
- **TC-035.4 / S35-AC4:** New feedback/result revision is a new unread event; later enrollment does not replay historical notifications.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-036 — Compose student Home and own schedule

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S36 |
| Requirements | REQ-HOME-001, REQ-HOME-002, REQ-HOME-003 |
| Prerequisite deliveries | S14, S16, S26, S35 |
| Decision gate | Institution timezone confirmed |
| API scope | getDashboard, getExam, listOwnSchedule |

**Procedure**

1. Set school-local midnight and overlapping/canceled sessions; create tied next-exam candidates.
2. Load Home with individual widget failures and paged schedule; compare own data and exact unread scope.

**Expected checkpoints and oracle**

- **TC-036.1 / S36-AC1:** Home shows own identity, shortcuts, visible unread count, local-day sessions and nearest future published relevant exam.
- **TC-036.2 / S36-AC2:** UTC/local-midnight overlap fixtures appear on correct school day; canceled session stays labeled but not next activity.
- **TC-036.3 / S36-AC3:** Draft/canceled/past/unrelated exams excluded; ties stable; no exam has clear empty state.
- **TC-036.4 / S36-AC4:** Failed widget is unavailable without replacing it with zero; paged schedule supports all authorized matches.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-037 — Consolidate profile, permitted preferences and support

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S37 |
| Requirements | REQ-PRO-001, REQ-PRO-002, REQ-PRO-003 |
| Prerequisite deliveries | S08, S16 |
| Decision gate | Approved languages/support contact |
| API scope | getProfile, updatePreferences, getSupport |

**Procedure**

1. Read profile, attempt edits to forbidden school fields, save valid/invalid language preference and inject save failure.
2. Follow attendance/history/help/logout, inspect configured support availability and account-switch cleanup.

**Expected checkpoints and oracle**

- **TC-037.1 / S37-AC1:** School name/identifier/roles/recovery identity/enrollment remain read-only to student.
- **TC-037.2 / S37-AC2:** Allowed language preference persists with revision validation; unsupported value rejects and previous value remains on failed save.
- **TC-037.3 / S37-AC3:** Profile exposes attendance/own history/help/logout, not duplicate profile/photo features.
- **TC-037.4 / S37-AC4:** School-provided contact/availability/reporting guidance is configured before pilot and requests no password/private payload; safe reference can be copied.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-038 — Provide authorized audit and revision inspection

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S38 |
| Requirements | REQ-AUD-002 |
| Prerequisite deliveries | S06, S10 |
| Decision gate | Audit/support grant and retention approval |
| API scope | listAudit, getAudit |

**Procedure**

1. Query audit by actor/entity/date using reviewer and ordinary principals.
2. Attempt mutation and inspect staff histories/restricted support projection for secret or private-draft disclosure.

**Expected checkpoints and oracle**

- **TC-038.1 / S38-AC1:** Audit list/detail filters use permitted actor/entity/time scope and stable paging.
- **TC-038.2 / S38-AC2:** Ordinary users cannot read/change audit; support sees restricted diagnostics only unless expressly granted.
- **TC-038.3 / S38-AC3:** Response is allowlisted with attributable change summary/reason and safe request reference, without secrets.
- **TC-038.4 / S38-AC4:** Related module histories show authorized prior revision summaries; no student draft access is added.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-039 — Prepare pilot data and verify initial setup

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S39 |
| Requirements | REQ-ADM-006, REQ-DATA-001 |
| Prerequisite deliveries | S07, S11, S12 |
| Decision gate | DEC-09 source/scale; DEC-14 real-data policy |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Use supported admin forms to load approved synthetic pilot population and source records.
2. Reconcile counts, duplicates, membership and sample access; record data-owner discrepancies and acknowledgement.

**Expected checkpoints and oracle**

- **TC-039.1 / S39-AC1:** Manual supported setup establishes pilot records without developer database editing as the operational workflow.
- **TC-039.2 / S39-AC2:** Counts, duplicates, membership intervals and sample student/teacher access reconcile against approved source.
- **TC-039.3 / S39-AC3:** Data owner acknowledges discrepancies resolved or explicitly excluded before rollout.
- **TC-039.4 / S39-AC4:** Automated import remains deferred; any selected importer requires a separate reviewed story and row-level preview.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-040 — Automate cross-feature contract and race regression

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S40 |
| Requirements | NFR-12, REQ-UX-005 |
| Prerequisite deliveries | S03, S05, S06 |
| Decision gate | Selected database/client test environment |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Run pinned contract/policy/integration suites on selected engine with deterministic fixtures.
2. Prove both race orders using barriers and verify CI fails for intentional invariant regression in an isolated test branch.

**Expected checkpoints and oracle**

- **TC-040.1 / S40-AC1:** CI runs schema/response validation and critical policy/permission fixtures against the selected engine.
- **TC-040.2 / S40-AC2:** Barrier-controlled race tests prove both authoritative orders, not just one concurrent run.
- **TC-040.3 / S40-AC3:** Restore/lost-response tests inspect original IDs/times/pointers/counts in addition to HTTP response.
- **TC-040.4 / S40-AC4:** Each delivered story contributes targeted regression cases; full-suite completion requires all feature stories in release scope.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-041 — Verify accessibility, localization and supported clients

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S41 |
| Requirements | REQ-UX-006, NFR-08 |
| Prerequisite deliveries | S16 |
| Decision gate | DEC-02/03 matrix and language coverage |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Execute core workflows on each approved device/browser/language and assistive input combination.
2. Increase text to200%, use compact viewport/reduced motion and long Khmer/English fields; record per-task assistance and blockers.

**Expected checkpoints and oracle**

- **TC-041.1 / S41-AC1:** Keyboard/focus/screen-reader labels and non-color status cues work across core student/staff tasks.
- **TC-041.2 / S41-AC2:** 200% text and compact layout retain controls/errors; Khmer/English data is intact with reviewed approved translations.
- **TC-041.3 / S41-AC3:** Reduced-motion and non-drag alternatives work; no unsupported all-device claim.
- **TC-041.4 / S41-AC4:** Attach tested build/device/language matrix and resolve core-task blockers; final sign-off follows all feature integration.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-042 — Prove performance, capacity and hot-class contention

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S42 |
| Requirements | NFR-01, NFR-02, NFR-03 |
| Prerequisite deliveries | S22, S29, S32, S36 |
| Decision gate | DEC-13 load/targets approved |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Load approved dataset, warm up15minutes and run steady30minutes at agreed mix.
2. Repeat with concentrated same-class deadline traffic and maximum uploads; record p95/client cold-warm latency, errors, locks and integrity.

**Expected checkpoints and oracle**

- **TC-042.1 / S42-AC1:** Run approved PRD profile including warm-up, metadata traffic and maximum uploads with recorded infrastructure/mix.
- **TC-042.2 / S42-AC2:** Routine list/detail p95<=1s, dashboard<=2s, finalization<=2s after files Ready are proposed targets to approve and measure.
- **TC-042.3 / S42-AC3:** Client primary content within 3s in 95% of controlled approved-device loads; report cold/warm separately.
- **TC-042.4 / S42-AC4:** Add concentrated class deadline spike and record lock wait; no duplicate/lost academic writes while meeting accepted limits.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-043 — Verify security and private-data boundaries before pilot

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S43 |
| Requirements | NFR-07, NFR-10, NFR-11 |
| Prerequisite deliveries | S09, S10, S17, S38 |
| Decision gate | Approved role/privacy/config policies |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Run complete negative route matrix and browser/file abuse tests under intended service identities.
2. Inspect logs/analytics/caches/DB roles and account switching; retest each confirmed finding on candidate build.

**Expected checkpoints and oracle**

- **TC-043.1 / S43-AC1:** Required own/other/unassigned/withdrawn/disabled matrix passes every route class, counts and downloads.
- **TC-043.2 / S43-AC2:** Cookie/CSRF/origin, file validation, protected persistence and secret injection checks pass.
- **TC-043.3 / S43-AC3:** Logs/analytics/client caches omit credentials and unnecessary academic content; account switching clears private state.
- **TC-043.4 / S43-AC4:** Zero unresolved confirmed access paths or integrity flaws at release; known finding has owner/evidence and cannot be hidden by aggregate pass rate.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-044 — Configure monitoring, alerts and reliable operational metrics

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S44 |
| Requirements | REQ-OPS-002, NFR-04, NFR-09 |
| Prerequisite deliveries | S06, S33 |
| Decision gate | DEC-12/13 named owners/windows |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Inject auth/database/scan/outbox/download/backup failures in nonproduction and observe alerts.
2. Validate named receiver/triage evidence, authenticated probes, monthly metric definitions and logical-operation deduplication.

**Expected checkpoints and oracle**

- **TC-044.1 / S44-AC1:** Monitor auth/submission errors, unknown operations, DB/lock wait, scans, outbox age, downloads and backup freshness.
- **TC-044.2 / S44-AC2:** Injected failure reaches named owner with safe correlation and triage path.
- **TC-044.3 / S44-AC3:** Proposed99.5% monthly authenticated-probe availability includes maintenance and separately reports monitoring gaps; threshold approval documented.
- **TC-044.4 / S44-AC4:** Logical reliability deduplicates retries and separately counts invalid/deadline rejection and unresolved outcome; client success events alone not authoritative.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-045 — Back up and rehearse consistent database/file restoration

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S45 |
| Requirements | REQ-OPS-003, NFR-05 |
| Prerequisite deliveries | S04, S17, S22, S28, S31, S44 |
| Decision gate | DEC-13 RPO/RTO; DEC-14 retention/keys |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Create known confirmed attempt/files/published revisions, take consistent checkpoint and isolate restore target.
2. Restore exact objects/database, revoke restored credentials, replay jobs safely and measure recovered point/time-to-verified-service.

**Expected checkpoints and oracle**

- **TC-045.1 / S45-AC1:** Recoverable checkpoint includes database and every referenced immutable file version with key access.
- **TC-045.2 / S45-AC2:** Isolated restore verifies selected attempts/files, published pointers, membership, audit and safe job replay.
- **TC-045.3 / S45-AC3:** Revoke restored sessions/evidence before opening and record actual loss window/elapsed recovery time.
- **TC-045.4 / S45-AC4:** ProposedRPO<=24h/RTO<=4h verified or revised/approved; failed backup age alerts before target breach.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-046 — Create traceable build, migration and rollout pipeline

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S46 |
| Requirements | REQ-OPS-001 |
| Prerequisite deliveries | S02, S03, S04, S40 |
| Decision gate | Repository/CI/environment approval |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Build candidate once, run migration in UAT and promote same digest/config lineage.
2. Rehearse overlapping API/worker compatibility and code rollback while retaining new valid academic writes.

**Expected checkpoints and oracle**

- **TC-046.1 / S46-AC1:** Build once with source/artifact/contract/schema/config identity and promote same artifact through UAT.
- **TC-046.2 / S46-AC2:** Single migration runner uses expand-compatible-backfill-contract pattern; checksum drift rejects.
- **TC-046.3 / S46-AC3:** API/worker event compatibility and draining/lease recovery are rehearsed.
- **TC-046.4 / S46-AC4:** Code rollback retains valid new academic writes; database disaster restore is separate, not routine rollback.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-047 — Complete integrated UAT and pilot release acceptance

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S47 |
| Requirements | Governance or integrated release acceptance |
| Prerequisite deliveries | S19, S23, S25, S29, S32, S35, S36, S37, S38, S39, S40, S41, S42, S43, S45, S46 |
| Decision gate | All release-relevant decisions and critical/high blockers resolved |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Execute PRD UAT-01–11 against one named candidate after integration gates.
2. Reconcile open defects and required decisions with school/product/QA/service owners; record explicit go/no-go and limitations.

**Expected checkpoints and oracle**

- **TC-047.1 / S47-AC1:** PRD UAT-01–11 and applicable UX-AC/SDD-T/DB-AC evidence are tied to same candidate build.
- **TC-047.2 / S47-AC2:** School users complete setup, materials, submission/replay, review, results, attendance and notices without developer DB edits.
- **TC-047.3 / S47-AC3:** Critical/high release blockers are resolved or failing scope explicitly removed and reapproved; workaround acceptance records owner.
- **TC-047.4 / S47-AC4:** Approval, scope, known limitations, migration/restore/rollback and smoke plans are recorded; acceptance alone does not claim production deployed.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

### TC-048 — Hand over support and run controlled pilot deployment

| Field | Value |
|---|---|
| Status | NOT RUN |
| Backlog | S48 |
| Requirements | REQ-OPS-004 |
| Prerequisite deliveries | S44, S45, S46, S47 |
| Decision gate | Actual deployment authorization and named service owner |
| API scope | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Procedure**

1. Inspect support/runbook/coverage handover and authorized rollout prechecks.
2. Only in approved deployment window, deploy accepted artifact, run isolated smoke and observe rollback triggers; record postrelease support review.

**Expected checkpoints and oracle**

- **TC-048.1 / S48-AC1:** Support channel, hours, severity handling, escalation/runbook and maintenance owner are configured and handed over.
- **TC-048.2 / S48-AC2:** Authorized deployment uses accepted artifact/config with backup/readiness prechecks and isolated authenticated smoke tests.
- **TC-048.3 / S48-AC3:** Monitoring, permissions and controlled receipt/download/publication checks pass after rollout; unexpected failure follows agreed rollback/incident trigger.
- **TC-048.4 / S48-AC4:** Pilot activity and uncertain outcomes reviewed with school owners; no wider audience expansion is implied.

**Evidence/cleanup:** attach each checkpoint result and relevant HTTP/DB/object/UI evidence; restore the fixture baseline only after evidence capture. Review/operational suites attach named approval or rehearsal records instead of invented product responses.

## 9. Focused boundary, race and fault cases

These 24 cases supplement story suites with exact input/action/oracle. Each independent variant starts from a clean fixture unless it deliberately replays a confirmed operation. Time instants below are controlled test values, not actual school deadlines. All begin NOT RUN.

| Case | Scenario | Preconditions | Actions | Expected oracle | Source |
|---|---|---|---|---|---|
| TC-049 | On-time inclusive acceptance | ASG-T due 10:00:00Z; no prior attempt. | Sample accepted_at exactly 10:00:00Z after validation and commit. | One ON_TIME attempt; accepted_at unchanged on replay. | AC-ASG-01; S22 |
| TC-050 | Upload start does not reserve deadline | ASG-F due 10:00:00Z, late disabled, FILE-R. | Begin upload09:59; sample new finalization10:00:00.001Z. | Known SUBMISSION_CLOSED rejection; no attempt; previous confirmed work unchanged. | AC-ASG-02; S22 |
| TC-051 | Late-open lower and upper boundaries | ASG-L due 10:00:00Z, late_close 11:00:00Z. | On independent clean fixtures finalize10:00:00.001Z and11:00:00Z. | Both eligible and LATE subject to attempt limit; exact due remains ON_TIME. | AC-ASG-03; S22 |
| TC-052 | Late-close exceeded | ASG-L late_close 11:00:00Z. | Finalize a new key at 11:00:00.001Z. | Known rejection; no new attempt or false confirmation. | AC-ASG-04; S22 |
| TC-053 | Confirmed replay after deadline | Original OP-A committed before due; response dropped. | After close, resend identical OP-A or lookup then get original receipt. | Same attempt ID/no/time; no new counter increment, no fresh deadline rejection. | AC-ASG-05; S22/S23 |
| TC-054 | Withdrawal versus finalization, both orders | Enrolled student Ready file; barriers on authorization/class guards. | Run withdrawal-first commit then finalize; reset and run finalize-first then withdrawal. | First ordering rejects new attempt; second preserves accepted own history and blocks new class activity. | AC-ASG-06; S10/S12/S22 |
| TC-055 | New attempt versus feedback publish, both orders | ASG-R current attempt1; reviewer targets1. | Commit attempt2 then publish1; reset and publish1 before attempt2. | First publish conflicts CURRENT_ATTEMPT_CHANGED; second locks submissions and rejects new attempt. | AC-ASG-07; S25 |
| TC-056 | Archive versus finalization, both orders | Active assignment; original operation absent. | Run archive-first then finalize; reset and finalize-first then archive. | Archive-first rejects; finalize-first retains one immutable attempt after archive. | AC-ASG-08; S20/S22 |
| TC-057 | Last attempt under distinct concurrent keys | ASG-R two of three attempts used. | Release OP-A and OP-B together with barriers; inspect both responses and rows. | At most one third attempt; other known attempts/eligibility rejection; count3, no duplicate sequence. | REQ-ASG-008; S22 |
| TC-058 | Same key with changed canonical payload | OP-A has confirmed original text/files. | Reuse OP-A with changed text, file ordering or expected revision. | OPERATION_PAYLOAD_CONFLICT; original receipt/content remains unchanged. | REQ-ASG-008; S05 |
| TC-059 | Not found while transaction in flight | OP-A held before commit, lookup uses same actor/target/key. | Lookup before commit; allow original to commit; lookup again. | NOT_FOUND_YET is not failure; second lookup confirms original; UI never creates replacement key. | REQ-UX-004; S05/S23 |
| TC-060 | Post-lock acceptance clock | Request arrives before due but waits on class guard until after due. | Release guard after due and sample new-command accepted_at. | Reject under late-disabled policy; transaction-start/request-arrival time cannot produce false on-time attempt. | BR-02–04; S22 |
| TC-061 | Exact file/group limits | Safe fixtures at 20 MiB/file,5files/50MiB aggregate. | Accept valid limits; independently try one byte over file/group and sixth file. | Valid Ready files accepted; over-limit input rejected before academic commit; no removal of other valid form input. | REQ-FILE-001; S15/S17 |
| TC-062 | Cleanup versus reference insertion | Expired unreferenced file and guard-controlled cleanup/finalization. | Test each lock winner, including a file that expires before new finalization. | Cleanup may mark/delete unreferenced expired file; new finalization rejects expiry/Deleting; an already confirmed reference is never deleted. | REQ-FILE-004; S17 |
| TC-063 | Result unequal denominators and zero | Published Scored40/50 and60/100; separate0/50 fixture. | Fetch term summary/detail through API/UI. | 100/150=66.67% (not70%);0/50 gives0.00%, not missing. | AC-RES-01–02; S29 |
| TC-064 | Result exclusions and draft privacy | 40/50 published plus Absent; onlyAbsent/Exempt;40/50 published+90/100 draft. | Query each clean fixture, including pages/counts and source IDs. | 80.00% with Absent1; all excluded N/A; published+draft80.00% incomplete with no90/100 exposure. | AC-RES-03–05; S29 |
| TC-065 | Atomic result batch failure | Two eligible results and preview bound to revisions. | Fault between first and second pointer write before commit; then query as students. | Neither selected publication visible; no partial batch/items/events; previous visible revisions remain. | REQ-RES-004; S28 |
| TC-066 | Expired/stale preview and original replay | Fresh actor-bound token; unchanged versus changed result revisions. | Try another actor/token, stale revision and expired new command; replay a previously committed key after expiry. | Unauthorized/stale/expired new commit fails; original confirmed replay returns original batch without new publication. | REQ-RES-004; S28 |
| TC-067 | Attendance normal and incomplete coverage | 8Present+1Late+1Absent+2Excused; optional13th eligible missing. | Finalize first12; query with and without missing session. | 90.00%,12/12; with missing90.00% provisional12/13, missing1. | AC-ATT-01–02; S32 |
| TC-068 | Attendance zero-denominator and cancellation | Only2Excused; separate1Absent; normal fixture with canceled Absent. | Read summaries after each independent fixture/cancellation. | N/A with2/2 coverage;0.00% for loneAbsent;100.00% and11/11 after canceled Absent removed. | AC-ATT-03–05; S31/S32 |
| TC-069 | Membership boundary eligibility | Enrollment starts09:00Z and withdrawal10:00Z. | Sessions start exactly09:00,09:59:59 and10:00; query eligibility. | First two eligible, exact withdrawal excluded; current membership does not rewrite interval rule. | REQ-ATT-005; S31 |
| TC-070 | Worker crash and stale lease fencing | Fanout event with two captured recipients; claim generation1. | Insert first delivery then crash; reclaim generation2; old worker tries completion. | No duplicate notification; remaining recipient processed; old completion affects zero rows. | REQ-NOT-002; S06/S33 |
| TC-071 | Exact object restore and revived credential defense | Checkpoint includes confirmed file versionV1; later object versions and session revocation exist. | Restore DB and mappedV1 into isolation, advance security epoch/revoke evidence, verify file checksum and old sessions. | Original confirmed bytes/version recovered; no substitution withV2; restored stale sessions/evidence unusable before opening. | REQ-OPS-003; S45 |
| TC-072 | Browser CSRF and private response cache | Authenticated browserA; second browser/accountB; valid preauth/session tokens. | Omit token, use other session token, attempt foreign-origin write and revisit cached private page after logout. | Writes denied without academic mutation; no prior-account academic response served from shared cache; valid same-origin flow succeeds. | REQ-AUTH-005; S08/S43 |

For barrier-controlled races, record both transaction ordering traces, request outcomes, attempt/revision counts, current pointers, receipt accepted_at and event intent. Repeat with a deliberate rollback of the first contender. An allowed finalization before a later archive must survive; a failed transaction must not leave a receipt claiming confirmation.

Never fake a database lock by sleeping an arbitrary interval and assume a race order. Use deterministic test hooks/barriers around the intended repository lock/commit boundaries in isolated builds; remove/disable those hooks in release artifacts. Retry a deadlock-aborted whole command with the original key, not a partially applied fragment.

## 10. API profile definitions

Each route in Section 11 must have an execution row for every applicable profile below. Profile assignment is derived from the exact current contract, not from guessing method semantics. Shared profiles are test expansion rules, not a blanket pass claim.

| Profile | Mandatory checks |
|---|---|
| READ | Valid authorized result; schema/headers/nulls/types; unavailable ID; correct role/resource scope; no draft/metadata leak; expired/disabled session |
| LIST | READ plus default20/max100/invalid limit, stable tie order, cursor/filter mismatch, empty/filter-empty/error, full authorized total and repeated page behavior |
| WRITE | Correct CSRF/session or explicit preauth security; valid/invalid shape; missing/extra/forbidden fields; safe errors; no state change on known rejection; success only after commit |
| COMMAND | WRITE plus exact x-command-kind/target, missing/malformed Idempotency-Key, identical replay, changed payload conflict, response loss/reconciliation, current authorization on replay |
| PREAUTH | Bootstrap cookie/token binding, generic known/unknown identity behavior, invalid/expired evidence where relevant, origin/throttle behavior; no academic session implied |
| PUBLIC-BOOTSTRAP | Anonymous/session-aware CSRF token, correct cookie scope, no private identity leak, no mutation/credential exposure |
| LOOKUP/PREVIEW | Authenticated read-only POST with CSRF; no academic mutation; actor scope; token/key binding; stale/unknown outcomes do not create writes |
| UPLOAD-BYTES | Raw octet-stream, actual chunked byte limits, checksum/type/lifecycle/owner, interrupted and identical/different-content retry; no implicit finalization |
| DOWNLOAD | Exact typed parent authorization, private cache headers, actual allowed media type/safe disposition, object failure, no reusable public URL; no unpromised range/resume |
| LOGOUT | Server revocation, cookie expiry and client clearing; repeated old session denied; transport loss does not prove server revocation |

Required response-schema validation covers success and documented errors, including REJECTED versus UNKNOWN. A timeout without response is UNKNOWN regardless of whether the error schema was received. For endpoints whose schema cannot express cross-field bounds, validate the business rule explicitly (e.g. positive maximum, score<=maximum, timestamp ordering, total file size).

All sample UUIDs are synthetic. Generate boundary inputs from contract constraints rather than altering real user IDs. Check strings remain exact decimal representations and JSON identifiers do not become lossy numbers. Do not use a real scanner threat or unrestricted file to perform a safety test.

## 11. Route-by-route API execution matrix

Every current OpenAPI operation appears once. Primary backlog owner is the item that implements it; QA expands listed profiles into run records. Read capability/command/security values from the exact contract at execution. Changes to contract operation IDs require this matrix to be regenerated and reviewed.

| Operation | Method/path | Owner | Required profiles | Status |
|---|---|---|---|---|
| bootstrapCsrf | `GET /auth/csrf` | S08 | PUBLIC-BOOTSTRAP | NOT RUN |
| signIn | `POST /auth/login` | S08 | WRITE, PREAUTH | NOT RUN |
| requestRecovery | `POST /auth/recovery/requests` | S09 | WRITE, PREAUTH | NOT RUN |
| completeRecovery | `POST /auth/recovery/complete` | S09 | WRITE, PREAUTH | NOT RUN |
| completeActivation | `POST /auth/activation/complete` | S09 | WRITE, PREAUTH | NOT RUN |
| logout | `POST /auth/logout` | S08 | WRITE, LOGOUT | NOT RUN |
| getSession | `GET /me/session` | S08 | READ | NOT RUN |
| getProfile | `GET /me` | S37 | READ | NOT RUN |
| updatePreferences | `PUT /me/preferences` | S37 | WRITE, COMMAND | NOT RUN |
| getSupport | `GET /support` | S37 | READ | NOT RUN |
| getDashboard | `GET /dashboard` | S36 | READ | NOT RUN |
| listAccessibleTerms | `GET /terms` | S14 | READ, LIST | NOT RUN |
| listClasses | `GET /classes` | S14 | READ, LIST | NOT RUN |
| getClass | `GET /classes/{class_id}` | S14 | READ | NOT RUN |
| listClassSessions | `GET /classes/{class_id}/sessions` | S14 | READ, LIST | NOT RUN |
| getClassSession | `GET /sessions/{session_id}` | S14 | READ | NOT RUN |
| getExam | `GET /exams/{exam_id}` | S36 | READ | NOT RUN |
| listMaterials | `GET /classes/{class_id}/materials` | S19 | READ, LIST | NOT RUN |
| getMaterial | `GET /materials/{material_id}` | S19 | READ | NOT RUN |
| listAssignments | `GET /assignments` | S21 | READ, LIST | NOT RUN |
| getAssignment | `GET /assignments/{assignment_id}` | S21 | READ | NOT RUN |
| submitAssignment | `POST /assignments/{assignment_id}/submissions` | S22 | WRITE, COMMAND | NOT RUN |
| listOwnSubmissions | `GET /me/submissions` | S23 | READ, LIST | NOT RUN |
| getOwnSubmission | `GET /me/submissions/{submission_id}` | S23 | READ | NOT RUN |
| lookupOriginalOperation | `POST /operations/lookup` | S05 | WRITE, LOOKUP/PREVIEW | NOT RUN |
| createUpload | `POST /uploads` | S15 | WRITE, COMMAND | NOT RUN |
| getUpload | `GET /uploads/{upload_id}` | S15 | READ | NOT RUN |
| putUploadBytes | `PUT /uploads/{upload_id}/content` | S15 | WRITE, UPLOAD-BYTES | NOT RUN |
| completeUpload | `POST /uploads/{upload_id}/complete` | S15 | WRITE, COMMAND | NOT RUN |
| retryUploadCheck | `POST /uploads/{upload_id}/retry-check` | S15 | WRITE, COMMAND | NOT RUN |
| cancelUpload | `POST /uploads/{upload_id}/cancel` | S17 | WRITE, COMMAND | NOT RUN |
| downloadAuthorizedFile | `GET /file-references/{file_reference_id}/content` | S17 | READ, DOWNLOAD | NOT RUN |
| listOwnResults | `GET /me/results` | S29 | READ, LIST | NOT RUN |
| getOwnResult | `GET /me/results/{result_id}` | S29 | READ | NOT RUN |
| listOwnAttendance | `GET /me/attendance` | S32 | READ, LIST | NOT RUN |
| listNotices | `GET /notices` | S35 | READ, LIST | NOT RUN |
| getNotice | `GET /notices/{notice_id}` | S35 | READ | NOT RUN |
| listNotifications | `GET /notifications` | S35 | READ, LIST | NOT RUN |
| getUnreadCount | `GET /notifications/unread-count` | S35 | READ | NOT RUN |
| getNotification | `GET /notifications/{notification_id}` | S35 | READ | NOT RUN |
| markNotificationRead | `POST /notifications/{notification_id}/read` | S35 | WRITE, COMMAND | NOT RUN |
| staffListAcademicYear | `GET /staff/academic-years` | S11 | READ, LIST | NOT RUN |
| staffCreateAcademicYear | `POST /staff/academic-years` | S11 | WRITE, COMMAND | NOT RUN |
| staffGetAcademicYear | `GET /staff/academic-years/{academic_year_id}` | S11 | READ | NOT RUN |
| staffUpdateAcademicYear | `PUT /staff/academic-years/{academic_year_id}` | S11 | WRITE, COMMAND | NOT RUN |
| staffArchiveAcademicYear | `POST /staff/academic-years/{academic_year_id}/archive` | S11 | WRITE, COMMAND | NOT RUN |
| staffListTerm | `GET /staff/terms` | S11 | READ, LIST | NOT RUN |
| staffCreateTerm | `POST /staff/terms` | S11 | WRITE, COMMAND | NOT RUN |
| staffGetTerm | `GET /staff/terms/{term_id}` | S11 | READ | NOT RUN |
| staffUpdateTerm | `PUT /staff/terms/{term_id}` | S11 | WRITE, COMMAND | NOT RUN |
| staffArchiveTerm | `POST /staff/terms/{term_id}/archive` | S11 | WRITE, COMMAND | NOT RUN |
| staffListSubject | `GET /staff/subjects` | S11 | READ, LIST | NOT RUN |
| staffCreateSubject | `POST /staff/subjects` | S11 | WRITE, COMMAND | NOT RUN |
| staffGetSubject | `GET /staff/subjects/{subject_id}` | S11 | READ | NOT RUN |
| staffUpdateSubject | `PUT /staff/subjects/{subject_id}` | S11 | WRITE, COMMAND | NOT RUN |
| staffArchiveSubject | `POST /staff/subjects/{subject_id}/archive` | S11 | WRITE, COMMAND | NOT RUN |
| staffListClass | `GET /staff/classes` | S11 | READ, LIST | NOT RUN |
| staffCreateClass | `POST /staff/classes` | S11 | WRITE, COMMAND | NOT RUN |
| staffGetClass | `GET /staff/classes/{class_id}` | S11 | READ | NOT RUN |
| staffUpdateClass | `PUT /staff/classes/{class_id}` | S11 | WRITE, COMMAND | NOT RUN |
| staffArchiveClass | `POST /staff/classes/{class_id}/archive` | S11 | WRITE, COMMAND | NOT RUN |
| listUsers | `GET /staff/users` | S07 | READ, LIST | NOT RUN |
| createUser | `POST /staff/users` | S07 | WRITE, COMMAND | NOT RUN |
| getUser | `GET /staff/users/{user_id}` | S07 | READ | NOT RUN |
| updateUser | `PUT /staff/users/{user_id}` | S07 | WRITE, COMMAND | NOT RUN |
| disableUser | `POST /staff/users/{user_id}/disable` | S09 | WRITE, COMMAND | NOT RUN |
| issueActivation | `POST /staff/users/{user_id}/activation` | S09 | WRITE, COMMAND | NOT RUN |
| listGrants | `GET /staff/grants` | S07 | READ, LIST | NOT RUN |
| createGrant | `POST /staff/grants` | S07 | WRITE, COMMAND | NOT RUN |
| revokeGrant | `POST /staff/grants/{grant_id}/revoke` | S07 | WRITE, COMMAND | NOT RUN |
| listEnrollments | `GET /staff/classes/{class_id}/enrollments` | S12 | READ, LIST | NOT RUN |
| createEnrollments | `POST /staff/classes/{class_id}/enrollments` | S12 | WRITE, COMMAND | NOT RUN |
| listTeachers | `GET /staff/classes/{class_id}/teachers` | S12 | READ, LIST | NOT RUN |
| createTeachers | `POST /staff/classes/{class_id}/teachers` | S12 | WRITE, COMMAND | NOT RUN |
| changeEnrollment | `PUT /staff/enrollments/{enrollment_id}` | S12 | WRITE, COMMAND | NOT RUN |
| endTeacherAssignment | `POST /staff/teacher-assignments/{teacher_assignment_id}/end` | S12 | WRITE, COMMAND | NOT RUN |
| staffListSessions | `GET /staff/classes/{class_id}/sessions` | S13 | READ, LIST | NOT RUN |
| staffCreateSession | `POST /staff/classes/{class_id}/sessions` | S13 | WRITE, COMMAND | NOT RUN |
| staffUpdateSession | `PUT /staff/sessions/{session_id}` | S13 | WRITE, COMMAND | NOT RUN |
| cancelSession | `POST /staff/sessions/{session_id}/cancel` | S13 | WRITE, COMMAND | NOT RUN |
| staffListMaterials | `GET /staff/classes/{class_id}/materials` | S18 | READ, LIST | NOT RUN |
| staffCreateMaterials | `POST /staff/classes/{class_id}/materials` | S18 | WRITE, COMMAND | NOT RUN |
| staffGetMaterials | `GET /staff/materials/{material_id}` | S18 | READ | NOT RUN |
| staffReplaceMaterials | `PUT /staff/materials/{material_id}` | S18 | WRITE, COMMAND | NOT RUN |
| staffPublishMaterials | `POST /staff/materials/{material_id}/publish` | S18 | WRITE, COMMAND | NOT RUN |
| staffArchiveMaterials | `POST /staff/materials/{material_id}/archive` | S18 | WRITE, COMMAND | NOT RUN |
| staffListAssignments | `GET /staff/classes/{class_id}/assignments` | S20 | READ, LIST | NOT RUN |
| staffCreateAssignments | `POST /staff/classes/{class_id}/assignments` | S20 | WRITE, COMMAND | NOT RUN |
| staffGetAssignments | `GET /staff/assignments/{assignment_id}` | S20 | READ | NOT RUN |
| staffReplaceAssignments | `PUT /staff/assignments/{assignment_id}` | S20 | WRITE, COMMAND | NOT RUN |
| staffPublishAssignments | `POST /staff/assignments/{assignment_id}/publish` | S20 | WRITE, COMMAND | NOT RUN |
| staffArchiveAssignments | `POST /staff/assignments/{assignment_id}/archive` | S20 | WRITE, COMMAND | NOT RUN |
| staffListAssessments | `GET /staff/classes/{class_id}/assessments` | S26 | READ, LIST | NOT RUN |
| staffCreateAssessments | `POST /staff/classes/{class_id}/assessments` | S26 | WRITE, COMMAND | NOT RUN |
| staffGetAssessments | `GET /staff/assessments/{assessment_id}` | S26 | READ | NOT RUN |
| staffReplaceAssessments | `PUT /staff/assessments/{assessment_id}` | S26 | WRITE, COMMAND | NOT RUN |
| staffPublishAssessments | `POST /staff/assessments/{assessment_id}/publish` | S26 | WRITE, COMMAND | NOT RUN |
| staffArchiveAssessments | `POST /staff/assessments/{assessment_id}/archive` | S26 | WRITE, COMMAND | NOT RUN |
| cancelAssessment | `POST /staff/assessments/{assessment_id}/cancel` | S26 | WRITE, COMMAND | NOT RUN |
| listSubmissionRoster | `GET /staff/assignments/{assignment_id}/submissions` | S24 | READ, LIST | NOT RUN |
| getStaffSubmission | `GET /staff/submissions/{submission_id}` | S24 | READ | NOT RUN |
| listStaffAttemptHistory | `GET /staff/assignments/{assignment_id}/students/{student_id}/attempts` | S24 | READ, LIST | NOT RUN |
| getStaffFeedback | `GET /staff/submissions/{submission_id}/feedback` | S25 | READ | NOT RUN |
| createFeedbackDraft | `POST /staff/submissions/{submission_id}/feedback` | S25 | WRITE, COMMAND | NOT RUN |
| replaceFeedbackDraft | `PUT /staff/feedback/{feedback_id}` | S25 | WRITE, COMMAND | NOT RUN |
| publishFeedback | `POST /staff/feedback/{feedback_id}/publish` | S25 | WRITE, COMMAND | NOT RUN |
| listAssessmentEligibility | `GET /staff/assessments/{assessment_id}/eligibility` | S26 | READ, LIST | NOT RUN |
| addAssessmentEligibility | `POST /staff/assessments/{assessment_id}/eligibility` | S26 | WRITE, COMMAND | NOT RUN |
| updateEligibility | `PUT /staff/eligibility/{eligibility_id}` | S26 | WRITE, COMMAND | NOT RUN |
| listStaffResults | `GET /staff/assessments/{assessment_id}/results` | S27 | READ, LIST | NOT RUN |
| createResultDraft | `POST /staff/assessments/{assessment_id}/results` | S27 | WRITE, COMMAND | NOT RUN |
| getStaffResult | `GET /staff/results/{result_id}` | S27 | READ | NOT RUN |
| replaceResultDraft | `PUT /staff/results/{result_id}` | S27 | WRITE, COMMAND | NOT RUN |
| previewResultPublication | `POST /staff/result-publications/preview` | S28 | WRITE, LOOKUP/PREVIEW | NOT RUN |
| commitResultPublication | `POST /staff/result-publications` | S28 | WRITE, COMMAND | NOT RUN |
| getPublicationBatch | `GET /staff/result-publications/{batch_id}` | S28 | READ | NOT RUN |
| getAttendanceRoster | `GET /staff/sessions/{session_id}/attendance` | S30 | READ, LIST | NOT RUN |
| saveAttendanceDraft | `PUT /staff/sessions/{session_id}/attendance` | S30 | WRITE, COMMAND | NOT RUN |
| finalizeAttendance | `POST /staff/sessions/{session_id}/attendance/finalize` | S30 | WRITE, COMMAND | NOT RUN |
| correctAttendance | `POST /staff/sessions/{session_id}/attendance/correct` | S31 | WRITE, COMMAND | NOT RUN |
| staffListNotices | `GET /staff/notices` | S34 | READ, LIST | NOT RUN |
| staffCreateNotice | `POST /staff/notices` | S34 | WRITE, COMMAND | NOT RUN |
| staffGetNotice | `GET /staff/notices/{notice_id}` | S34 | READ | NOT RUN |
| staffReplaceNotice | `PUT /staff/notices/{notice_id}` | S34 | WRITE, COMMAND | NOT RUN |
| staffPublishNotice | `POST /staff/notices/{notice_id}/publish` | S34 | WRITE, COMMAND | NOT RUN |
| staffArchiveNotice | `POST /staff/notices/{notice_id}/archive` | S34 | WRITE, COMMAND | NOT RUN |
| listAudit | `GET /staff/audit` | S38 | READ, LIST | NOT RUN |
| getAudit | `GET /staff/audit/{audit_id}` | S38 | READ | NOT RUN |
| listReviewFlags | `GET /staff/review-flags` | S31 | READ, LIST | NOT RUN |
| resolveReviewFlag | `POST /staff/review-flags/{flag_id}/resolve` | S31 | WRITE, COMMAND | NOT RUN |
| historyMaterials | `GET /staff/materials/{material_id}/history` | S18 | READ, LIST | NOT RUN |
| historyAssignments | `GET /staff/assignments/{assignment_id}/history` | S20 | READ, LIST | NOT RUN |
| historyFeedback | `GET /staff/feedback/{feedback_id}/history` | S25 | READ, LIST | NOT RUN |
| historyResults | `GET /staff/results/{result_id}/history` | S28 | READ, LIST | NOT RUN |
| historyNotices | `GET /staff/notices/{notice_id}/history` | S34 | READ, LIST | NOT RUN |
| listOwnSchedule | `GET /sessions` | S36 | READ, LIST | NOT RUN |

## 12. Database and file integrity suite

Use the actual selected database engine/version and ordinary application role; the reference PostgreSQL DDL alone was not execution-tested when written. Verify clean migration, repeat application/checksum rejection, scoped PK/FK behavior, root-bound pointers, unique operation/attempt/result/read identities, row status checks, append-only triggers and restricted schema privileges.

Run DB-AC-01–17 from the database specification. Specifically assert that a valid child revision from another root in the same institution cannot become a current pointer; a different institution's valid UUID cannot attach; a draft pointer cannot become a student-visible value; a file group cannot exceed aggregate limits even if individual files pass.

Inspect transaction rollback consistency across resource/receipt/pointer/count/audit/outbox. Exercise stale expected_revision and both first-write roster competitors. Test membership interval overlap under guarded commands; do not assume a row CHECK proves cross-record temporal policy. Excess decimal precision is rejected before database coercion; test null,NaN/infinite and out-of-range inputs under the actual API/engine.

Run reconciliation queries for attempt_count versus actual rows, current pointer versus maximum attempt number, receipt target/time, publication batch item count, invalid visible pointer state, referenced files marked deleting/missing, orphan event targets and stale worker leases. Healthy invariant checks return zero violations. Storage existence/checksum needs provider inspection as well as SQL. Repairs require an authorized reasoned operation; never auto-delete an academic discrepancy to make a test green.

## 13. Security and privacy verification

Execute an action/resource matrix for student own/other, assigned/unassigned teacher, explicit publisher versus ordinary admin, support versus audit reviewer, pending/disabled/withdrawn/archived states. Include search/count endpoints and copied file links, not just detail APIs. Use valid foreign identifiers in both path and body. Verify capability changes affect the next protected request and client clearing; an already-authorized streaming transfer cannot be recalled and is not evidence of a new unauthorized request.

Browser checks: Secure/HttpOnly/Path/no-Domain cookie settings, CSRF preauth/session binding, trusted origin, session rotation/expiry/revocation, generic auth/recovery errors, paste/password-manager behavior and no raw credential JSON. Native bearer transport is out of current contract scope. Authentication throttle tests follow approved policy and run against isolated identities.

Injection/abuse checks: contextual text rendering, forbidden executable markup, parameterized query boundary, safe filenames/disposition, upload size/content/checking isolation, bounded request/page/batch limits and safe worker privileges. No uncontrolled execution of malicious content is required.

Inspect logs/analytics/screenshots/issue attachments/cache/provider URLs for secrets and unnecessary academic data. Academic audit access is separately restricted. Verify nonproduction recipients and restoration isolation. Any confirmed exposure or integrity violation is a release blocker and triggers containment/owner notification through the approved incident process, not an invented external message sent by this plan.

## 14. UI, accessibility and usability matrix

Use UX-AC-01–26 and the agreed screen catalog. Verify primary navigation, retained filters/back behavior, full history access after withdrawal, loading versus empty versus error, independent Home widget failures, unknown submission recovery, safe unsaved-leave prompts, forbidden-field visibility and published-only wording.

| Dimension | Required coverage |
|---|---|
| Layout | Approved compact/medium/expanded clients;320-wide reflow where in approved design matrix; keyboard does not obscure fields/errors/actions |
| Text/input |200% text, long titles/names/files, whitespace, Khmer/English Unicode and reviewed supported translations |
| Keyboard | Logical focus, visible indicator, activation/dismissal, modal containment/restoration, accessible file selection |
| Screen reader | Named controls/headings/tabs/headers; errors linked to fields; bounded status announcements |
| Status | Text/icon with color; no fake progress, no Submitted before commit, no GPA/final grade unsupported by policy |
| Motion | Reduced motion respected; no drag/swipe/hover-only essential action |
| Connectivity | Read error/stale/offline, upload interrupted/checking, rejected/unknown write, reauthentication/account switch |

Proposed formative study remains5–8 students and2–3 staff subject to DEC-15. Core task completion target from the brief is proposed>=90% independently per task with actual participant count reported; small study counts are not a population estimate. Record confusion about submitted status or final grades as a critical finding even if task completion aggregate is high. Usability evaluation does not replace security/transaction tests.

## 15. Performance and capacity protocol

Use the approved PRD profile: one institution,1,000 students,100 staff,100 classes,10,000 confirmed attempts,100 concurrent signed-in users. Proposed run:15-minute warm-up,30-minute steady20 metadata requests/second plus10 concurrent maximum-size upload sessions. Record dataset shape, actual throughput/concurrency, payload sizes, infrastructure, network, cache state and errors. Also execute a concentrated single-class deadline spike to expose coarse class-guard contention.

| Metric | Proposed oracle | Measurement |
|---|---|---|
| Routine metadata | p95<=1second | Endpoint-level server latency, including DB wait; exclude file-byte transfer |
| Dashboard | p95<=2seconds | Authorized composed response; report widget failures |
| Finalization | p95<=2seconds once files Ready | Include transaction lock wait/commit; report expected rejections and unknowns separately |
| Client content | Within3seconds for95% core loads at10Mbps/100ms RTT | Approved device/network, cold/warm separated |
| Notification |95% visible within60seconds in healthy operation | Event commit to eligible visible notification, not dequeue time |
| Integrity | No confirmed duplicate/lost academic writes | Reconcile logical keys, attempts, pointers and file references after run |

These targets remain DEC-13 proposals until approved. Do not pass a run with lower traffic, fewer files or different resources without declaring the deviation and acceptance. Report sample size, latency distribution, error counts and confidence limitations; an average is not p95. Warm-up results are retained but excluded from steady-state target calculations. Stop/suspend if test targets escape isolation or uncontrolled errors threaten retained test evidence.

A short load run cannot prove99.5% monthly availability. That proposed measure requires one-minute authenticated probes over the actual monthly window, including maintenance and separately reporting monitoring gaps. Test the probe/alert pipeline now; report the SLO only after its observation period.

## 16. Resilience, backup and restore protocol

Inject only isolated faults at known boundaries: API before/after commit, dropped response, database connection loss, scanner timeout, storage mismatch, job crash, lease expiration, delayed fanout and failed read-state update. For each, state whether outcome is rejected, unknown, confirmed-but-secondary-work-delayed, or known object unavailability. Never collapse these into one generic retry test.

Restore rehearsal sequence:

1. Create confirmed submissions with exact file checksums/versions, published/corrected results, attendance, membership, receipt/audit/outbox/read-state records and previously revoked sessions.
2. Capture a consistent recoverable checkpoint linking DB state to all retained referenced object versions; record object backup lag and key-access dependencies.
3. Isolate recovery environment and recipients; restore DB and matching objects/configuration.
4. Run FK/pointer/count/file integrity and calculation fixtures; inspect original receipts/files after restart.
5. Revoke restored sessions/recovery evidence or advance protected security generation before opening; replay jobs through deduplication/fencing.
6. Measure actual recovered point, lost-write window and elapsed time until verified service; record named recovery owner and unresolved gaps.

Proposed RPO<=24hours/RTO<=4hours are acceptance targets only after DEC-13 approval. Daily scheduling alone is not proof; test failed backup freshness alert and a gap that would exceed approved recovery point. Object retention must cover retained DB recovery points. A database-only restore with missing attachments fails.

Rehearse application rollback independently: retain new academic writes, return to compatible prior artifact/config and verify API/worker/schema overlap. Do not restore old database merely to undo code. Destructive/incompatible migration scenarios require approved stop-write/forward-fix or incident recovery plans.

## 17. Defect workflow and retest policy

| Severity | Example | Release treatment |
|---|---|---|
| Critical | Unauthorized private access, broad academic corruption/loss, false confirmed submission | Stop affected release; contain and resolve; full affected regression |
| High | Required core journey fails without acceptable workaround | Resolve or explicitly remove failing scope with product/QA approval and amended docs |
| Medium | Constrained impact with reviewed workaround | Named owner, workaround, acceptance and follow-up decision |
| Low | Cosmetic issue without task/access/data impact | Track with reviewed priority |

A defect records reproducible fixture/build, role/action, expected versus actual, safe evidence, affected requirement/operation/story, severity/priority, owner and environment. Severity is impact; priority is scheduling. Do not downgrade severity because time is short. No real Jira keys or assignees are invented here.

Retest the original failing case on the fixed build and the directly affected neighboring states/contracts. Broaden regression when the fix changes shared auth, transactions, formulas, file lifecycle or schema. Avoid endless unrelated reruns once concrete risks and required gates are covered. Mark prior evidence invalid when source/build/config changes alter its oracle.

## 18. Automation and CI gates

Pin test tools and use contract/schema/fixture versions in the repository. Suggested gates: lint/typecheck → pure policy/schema tests → selected-DB migration/constraint/transaction tests → API/worker contract tests → selected client smoke. Full UAT, load, security review and restore may run in controlled release environments but remain required evidence for the candidate.

For every API operation validate success/error schemas and relevant security profiles. Parameterize pure formula/boundary fixtures; use deterministic barriers for races. Automated contract parsing must check operation-ID uniqueness, all references and path parameters; actual endpoint validation is a separate gate.

Tests must not silently skip when dependency credentials/providers are absent. Mark blocked with reason and fail the required pipeline gate appropriately. Tag isolated provider/scanner tests separately from deterministic adapter tests so their evidence is distinguishable. Keep secrets and real academic payloads out of CI artifacts.

No test code/pipeline is claimed implemented by this document. Implement harnesses through backlog S40 and module stories; S47 aggregates final evidence. Store run manifest, safe logs, schema diffs, coverage and failure diagnostics with the named build and approved retention.

## 19. Requirements, technical suites and UAT traceability

The matrix maps each numbered PRD requirement/NFR to scenario suites; the API matrix adds route-level profiles. Focused cases TC-049–TC-072 add exact high-risk oracles. Source coverage is checked for missing IDs, not asserted by an overall test count.

| Requirement | Story-aligned suites |
|---|---|
| NFR-01 | TC-042 |
| NFR-02 | TC-042 |
| NFR-03 | TC-042 |
| NFR-04 | TC-044 |
| NFR-05 | TC-045 |
| NFR-06 | TC-004, TC-005, TC-022 |
| NFR-07 | TC-010, TC-043 |
| NFR-08 | TC-041 |
| NFR-09 | TC-033, TC-044 |
| NFR-10 | TC-006, TC-043 |
| NFR-11 | TC-002, TC-043 |
| NFR-12 | TC-003, TC-040 |
| REQ-ADM-001 | TC-011 |
| REQ-ADM-002 | TC-011 |
| REQ-ADM-003 | TC-012 |
| REQ-ADM-004 | TC-012 |
| REQ-ADM-005 | TC-007 |
| REQ-ADM-006 | TC-039 |
| REQ-ASG-001 | TC-020 |
| REQ-ASG-002 | TC-020 |
| REQ-ASG-003 | TC-020 |
| REQ-ASG-004 | TC-020 |
| REQ-ASG-005 | TC-021 |
| REQ-ASG-006 | TC-021, TC-023 |
| REQ-ASG-007 | TC-022 |
| REQ-ASG-008 | TC-005, TC-022, TC-023 |
| REQ-ASG-009 | TC-023, TC-025 |
| REQ-ASG-010 | TC-024 |
| REQ-ASG-011 | TC-025 |
| REQ-ASG-012 | TC-025 |
| REQ-ATT-001 | TC-030 |
| REQ-ATT-002 | TC-030 |
| REQ-ATT-003 | TC-032 |
| REQ-ATT-004 | TC-031 |
| REQ-ATT-005 | TC-031 |
| REQ-AUD-001 | TC-004, TC-006 |
| REQ-AUD-002 | TC-038 |
| REQ-AUTH-001 | TC-007 |
| REQ-AUTH-002 | TC-008 |
| REQ-AUTH-003 | TC-008 |
| REQ-AUTH-004 | TC-009 |
| REQ-AUTH-005 | TC-008 |
| REQ-AUTH-006 | TC-009 |
| REQ-CLS-001 | TC-014 |
| REQ-CLS-002 | TC-014 |
| REQ-CLS-003 | TC-013 |
| REQ-CLS-004 | TC-013 |
| REQ-DATA-001 | TC-039 |
| REQ-DATA-002 | TC-002 |
| REQ-FILE-001 | TC-015 |
| REQ-FILE-002 | TC-015 |
| REQ-FILE-003 | TC-017 |
| REQ-FILE-004 | TC-017 |
| REQ-HOME-001 | TC-036 |
| REQ-HOME-002 | TC-036 |
| REQ-HOME-003 | TC-036 |
| REQ-MAT-001 | TC-018 |
| REQ-MAT-002 | TC-019 |
| REQ-MAT-003 | TC-018 |
| REQ-NOT-001 | TC-034 |
| REQ-NOT-002 | TC-033 |
| REQ-NOT-003 | TC-033, TC-035 |
| REQ-NOT-004 | TC-035 |
| REQ-NOT-005 | TC-034 |
| REQ-OPS-001 | TC-046 |
| REQ-OPS-002 | TC-006, TC-044 |
| REQ-OPS-003 | TC-045 |
| REQ-OPS-004 | TC-048 |
| REQ-PERM-001 | TC-010 |
| REQ-PERM-002 | TC-010 |
| REQ-PERM-003 | TC-010 |
| REQ-PRO-001 | TC-037 |
| REQ-PRO-002 | TC-037 |
| REQ-PRO-003 | TC-037 |
| REQ-RES-001 | TC-026 |
| REQ-RES-002 | TC-027 |
| REQ-RES-003 | TC-027, TC-028 |
| REQ-RES-004 | TC-028 |
| REQ-RES-005 | TC-029 |
| REQ-RES-006 | TC-029 |
| REQ-RES-007 | TC-028 |
| REQ-UX-001 | TC-003, TC-016 |
| REQ-UX-002 | TC-016 |
| REQ-UX-003 | TC-016 |
| REQ-UX-004 | TC-005, TC-016, TC-023 |
| REQ-UX-005 | TC-005, TC-040 |
| REQ-UX-006 | TC-016, TC-041 |

Technical source coverage must be recorded per execution: SDD-T01–20 for architecture behavior; DB-AC-01–17 for database/provider integrity; UX-AC-01–26 for experience states. The correspondences below assign an execution owner without claiming already-passed runs.

| Source range | Owning suites / focused cases |
|---|---|
| SDD-T01–02 | TC-008–010, TC-043, TC-072 |
| SDD-T03–09 | TC-005, TC-017, TC-022–025, TC-049–062 |
| SDD-T10–11 | TC-027–032, TC-063–069 |
| SDD-T12–15 | TC-006, TC-015–017, TC-033–035, TC-043, TC-070/072 |
| SDD-T16–20 | TC-013, TC-036, TC-041–046, TC-071 |
| DB-AC-01–06 | TC-004/017 and database Section 12 |
| DB-AC-07–14 | TC-005/022/028/031/033 and focused TC-049–070 |
| DB-AC-15–17 | TC-004/042/043/045/071 |
| UX-AC-01–05 | TC-008/014/016/036 |
| UX-AC-06–12 | TC-015/020–025 and focused submission cases |
| UX-AC-13–18 | TC-027–035 and focused academic cases |
| UX-AC-19–26 | TC-008/010/012/016/037/041/043; deferred-control checks |

| PRD UAT | Run composition |
|---|---|
| UAT-01 | TC-007/011/012/039 |
| UAT-02 | TC-014/019/036 |
| UAT-03 | TC-022/023/053 |
| UAT-04 | TC-049–056/060 |
| UAT-05 | TC-024/025/038/055 |
| UAT-06 | TC-026–029/063–066 |
| UAT-07 | TC-030–032/067–069 |
| UAT-08 | TC-033–035/070 |
| UAT-09 | TC-008/016/023/037/072 |
| UAT-10 | TC-010/038/043 and every applicable API negative profile |
| UAT-11 | TC-039/042/044–048/071 |

All UAT runs are accepted under TC-047 against one candidate version; production rollout TC-048 requires actual authorization, not merely prior document approval.

## 20. Reporting, sign-off and change control

Daily/iteration execution report: baseline/build/environment; cases planned/executed/pass/fail/blocked/not-run; each required checkpoint status; defects by severity; invalidated evidence; open decision gates; owner/next action. Denominators must include required blocked/not-run cases, shown separately. Do not report a 100% pass rate by excluding failed prerequisites from the planned population.

Release report: requirement/route/test coverage, core UAT outcomes, integrity/security findings, performance assumptions/results, recovery point/time evidence, migration/rollback rehearsal, known limitations/approved scope changes, named owners and go/no-go. Report unavailable evidence candidly. No production-readiness claim while critical gates remain unexecuted.

| Reviewer | Required acceptance | Status |
|---|---|---|
| QA lead | Coverage, reproducibility, case results and defects | Pending named reviewer |
| Academic authority | Policy oracles, calculations, missing coverage and publication | Pending named reviewer |
| Product/design owner | Scope, usability, required UX states and limitations | Pending named reviewer |
| Technical/database lead | Contract, guards, exact files, migrations and integrity | Pending named reviewer |
| Identity/security owner | Access/session/provider/secret boundaries | Pending named reviewer |
| Release/service owner | Recovery, alerts, deployment/rollback and support | Pending named reviewer |

A change to PRD policy, API schema, DB invariant, platform matrix or release configuration triggers an impact review of mapped suites/profiles/oracles. Version affected fixtures and cases; do not overwrite historical actual results. New or removed API operations require matrix update before release.

| Version | Date | Change |
|---|---|---|
|0.1|10 September 2026|Initial complete plan: 48 story suites/192 acceptance checkpoints, 24 focused boundary/fault cases, 136-operation profile matrix, 87-requirement coverage, operational and release gates|

Companion sources: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml), [07_developer_guide.md](07_developer_guide.md), [08_jira_backlog.md](08_jira_backlog.md).

This task creates `09_test_plan.md`. It defines planned checks; it does not implement test automation, execute an application test, create Jira/test-management records, or authorize a production rollout.
