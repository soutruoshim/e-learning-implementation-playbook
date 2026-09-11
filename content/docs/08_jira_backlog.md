---
title: "08 — Jira Delivery Backlog"
---

# 08 — Jira Delivery Backlog

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-08 |
| Version | 0.1 — complete proposed delivery backlog |
| Date | 10 September 2026 |
| Sources | `01_project_brief.md` through `07_developer_guide.md`; OpenAPI version 0.1.0 |
| Owner | Product owner / delivery lead — named individuals pending |
| Status | Draft for refinement; no Jira issues have been created, assigned or scheduled |
| Inventory | 13 epics, 48 child stories/tasks, 144 suggested implementation subtasks |
| Traceability | All 75 numbered REQ requirements plus 12 NFRs; all 136 OpenAPI operations have one primary delivery owner |
| Estimates | Suggested S/M/L refinement sizes only; no story points, dates or staffing commitments |

This backlog converts the product and technical specifications into reviewable work. Each child item includes an outcome, acceptance criteria, requirement links, dependencies, readiness decisions and suggested subtasks. It is intended to be copied/refined into Jira after the actual project and issue configuration are known.

**ID convention:** E01–E13 and S01–S48 are local planning IDs, not existing Jira issue keys. S22.1 denotes a suggested subtask under S22. Preserve a planning-ID-to-real-key mapping when issues are created. No remote issue, message, sprint or assignment is created by this document.

## 1. Backlog rules and scope

All included child items are proposed MVP delivery scope unless explicitly described as a prerequisite decision. A small T-shirt size does not mean optional. Business-policy defaults in the PRD remain proposals; creating this backlog does not approve them.

The product is the student learning application and supporting school staff workflows, not the unrelated BROWN App. No prior BROWN Jira project keys, components or branch names are assumed.

Included end-to-end journeys: JRN-01 prepare term; JRN-02 student day/material access; JRN-03 assignment submission and review; JRN-04 results/attendance publication; JRN-05 notice/help. Cross-cutting authorization, file integrity, accessibility, operations and recovery belong to story Done and release acceptance.

Conditional/later features remain outside this committed backlog: student directory, profile photos, device calendar/reminders, general push/email/SMS, automated import, external school synchronization, payments, online exam delivery, chat, guardian accounts, AI tutoring and multi-institution onboarding. Required account recovery may use its approved delivery channel; that does not add general external notifications.

## 2. Suggested Jira field mapping

| Planning field | Jira destination | Rule |
|---|---|---|
| E identifier | Epic summary/description plus planning label | Create actual Epic only in selected project |
| S identifier | Story or Task summary prefix/custom planning ID | Keep stable mapping when split/refined |
| Parent | Parent/Epic relationship | Use actual Jira hierarchy field for that project |
| Suggested subtask | Sub-task under actual story/task | Create only after parent exists |
| Requirements/operations/tests | Description or configured fields | Preserve exact source IDs and contract operationId |
| Components | Proposed component values | Map to existing values; do not silently create unrelated project components |
| Depends on | Actual blocks/is blocked by issue link | Map planning IDs after issue creation; no free-text substitute for required blockers |
| Gate | Readiness decision/blocked reason | Resolution evidence linked before Ready |
| Owner role | Unassigned until named assignee selected | Role is not a verified person/account |
| Size | Refinement note | Team estimates points later; do not total S/M/L as hours |
| Release | Candidate MVP release label | Actual fix version, sprint and dates pending |

Suggested components: API, Database, Worker, Student UI, Staff UI, QA, CI/CD, Documentation. Suggested labels: student-learning-app, mvp, and a module label. These are proposals, not existing Jira configuration.

Proposed workflow: Draft → Ready → In progress → Review → QA/UAT → Done. Use a blocked flag with a reason/owner rather than treating Blocked as proof that work is approved. Document how the chosen Jira workflow maps to these meanings before import.

## 3. Ready, Done and release acceptance

**Ready:** product outcome and scope understood; requirement/operation/screens known; blocking decisions resolved; predecessor contract/interface available; acceptance fixtures agreed; design/error/permission states specified; owner and team estimate assigned; migration/config impact identified.

**Done:** reviewed implementation and tests; documented acceptance cases pass; actual wire responses match OpenAPI; required unauthorized and unknown-outcome cases tested; migrations/revisions/files/history intact; UX/accessibility states implemented; safe telemetry/audit included; docs and deployment impact updated. Done does not mean deployed to production.

Shared acceptance criteria apply to every feature story: authenticated actor/institution is authoritative; list/count/detail/download/write all enforce resource access; unsupported fields do not grant privilege; private DTOs exclude drafts; new writes use revision/idempotency where specified; no success before commit; required loading/empty/error/conflict/session states exist; typed IDs/decimal/time values match contract.

Foundation test stories can create harnesses early. Their final integration evidence is accumulated as features land and is checked by S47. A foundational story is not allowed to certify unimplemented future routes as tested. Likewise an endpoint listed below identifies implementation ownership, not a statement that it already exists in code.

## 4. Proposed delivery waves and dependency interpretation

| Wave | Focus | Planning items | Exit evidence |
|---|---|---|---|
| A | Decisions, environment, schema and identity | S01–S10; begin S16/S40/S46 | Approved baseline; scoped DB/auth/receipt infrastructure |
| B | Academic setup and resources | S11–S19 | School can prepare class/enrollment and publish/download safe material |
| C | Assignment workflow | S20–S25 | Correct policy, durable submission/replay/history and current-attempt review |
| D | Academic records | S26–S32 | Results and attendance fixtures, atomic visibility and corrections |
| E | Communication and composed student views | S33–S38 | Event/read-state integrity, Home/profile/help and audit |
| F | Pilot evidence, recovery and release | S39–S48 | Named UAT build, security/load/restore evidence and authorized rollout |

Waves describe delivery emphasis, not sprint dates or a strict numeric issue order. Follow explicit dependency links: for example S14 depends on shared shell S16, and the worker consumer S33 can be built early using fixtures before all publication producers are integrated. Independent ready stories may proceed concurrently within available staffing; no staffing allocation is claimed.

For an early text-only assignment spike, the team may build S22's text path behind a nonrelease flag before the complete file stack. S22 cannot be accepted Done or released until its complete mode/file/race criteria pass; any formal split retains a parent and explicit scope/acceptance links. No partial implementation silently satisfies the full story.

The dependency graph below is represented by exact story lists in Section 6 and was checked for cycles. Decision gates in the Gate field are additional blockers even when the dependency list is empty.

## 5. Epic inventory

| Epic | Name | Outcome | Child items | Accountable role |
|---|---|---|---|---|
| E01 | Project baseline and developer setup | Approve scope/technology and establish reproducible contract-driven development. | S01 S02 S03 | Product owner / technical lead |
| E02 | Engineering and shared experience foundations | Prove scoped persistence, reliable commands, background processing and reusable UI states. | S04 S05 S06 S16 | Technical lead |
| E03 | Identity, sessions and authorization | Institution-managed users access only current permitted resources and retained own history. | S07 S08 S09 S10 | Identity/backend lead |
| E04 | Academic structure, membership and schedule | Staff prepare terms/classes and students find correct current/historical learning context. | S11 S12 S13 S14 | Academic backend lead |
| E05 | Files and learning materials | Safe exact-version files can be staged, published and privately downloaded. | S15 S17 S18 S19 | Files/backend lead |
| E06 | Assignment publication and reliable submission | Students understand work availability and obtain a durable immutable attempt exactly once. | S20 S21 S22 S23 | Assignments/backend lead |
| E07 | Submission review and feedback | Authorized staff review current work and explicitly publish/correct feedback. | S24 S25 | Academic backend lead |
| E08 | Assessments and published results | Expected rosters, draft scores, atomic publication and honest summaries work end to end. | S26 S27 S28 S29 | Results/backend lead |
| E09 | Attendance and recorded coverage | Staff finalize/correct eligible attendance and students see correct counts and missing coverage. | S30 S31 S32 | Attendance/backend lead |
| E10 | Notices and in-app communication | Relevant publication events are delivered once with current access and persistent read state. | S33 S34 S35 | Worker/backend lead |
| E11 | Student Home, profile and help | Students understand their learning day, own settings and support path. | S36 S37 | Client lead |
| E12 | Audit, data readiness and quality evidence | Verify traceability, pilot data, cross-feature integrity, usability, security and capacity. | S38 S39 S40 S41 S42 S43 | QA lead |
| E13 | Release, recovery and service handover | Launch an accepted build with monitored operation, tested restore and named ownership. | S44 S45 S46 S47 S48 | Release/service owner |

Each epic is accepted only when its in-scope child criteria and relevant integrated journey pass. E12/E13 provide release evidence; they do not replace the testing obligation inside each feature story.

## 6. Detailed child backlog

Every item below starts in **Draft**, with **named assignee, sprint and story points unassigned**. Suggested size is a refinement signal: S usually has a constrained workflow, M multiple related screens/use cases, L significant cross-module integrity or unknowns. Split L items during refinement if the team cannot finish them in one iteration; preserve the outcomes and prerequisite links.

### S01 — Approve product and technical decision baseline

**As a delivery team, I want to implement a reviewed scope with named owners, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E01 — Project baseline and developer setup |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Product owner / technical lead; actual assignee pending |
| Components | Documentation |
| Depends on | None |
| Readiness gate | DEC-01–15; applicable UX/SDD/DB/API decision registers |
| PRD requirements | Governance/integrated acceptance; brief and release gates |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S01-AC1:** Record institution, sponsor, academic authority, product/technical/QA/service owners and unresolved decisions without inventing approval.
2. **S01-AC2:** Approve or explicitly defer platform, timezone/languages, identity/recovery, assignment rules, expected assessment roster, retention and load/recovery targets before dependent work is Ready.
3. **S01-AC3:** Document chosen runtime/database/provider versions and why required transaction/file capabilities are supported; PostgreSQL remains proposed until selected.
4. **S01-AC4:** Record actual repository, CI ownership and release audience; no deadline or budget is inferred.

**Suggested implementation subtasks**

- **S01.1:** Reconcile decision registers across documents 01–07.
- **S01.2:** Run technical review with school and engineering owners.
- **S01.3:** Publish baseline revision and decision-to-story links.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S02 — Create reproducible repository and isolated development environment

**As a developer, I want to start the application dependencies without using production data, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E01 — Project baseline and developer setup |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Product owner / technical lead; actual assignee pending |
| Components | CI/CD, Database, Worker |
| Depends on | S01 |
| Readiness gate | DEC-02/10; selected stack |
| PRD requirements | REQ-DATA-002, NFR-11 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S02-AC1:** A clean-machine setup installs locked dependencies and starts isolated API/client/worker dependencies using documented commands.
2. **S02-AC2:** DEV/UAT database, object-store, credentials and recipients are separate from production; a test publication cannot reach production recipients.
3. **S02-AC3:** Required missing configuration fails readiness; no real secrets or shared default passwords are committed.
4. **S02-AC4:** Restart preserves durable development records; routine services-down does not delete volumes.

**Suggested implementation subtasks**

- **S02.1:** Scaffold approved module layout and local task interface.
- **S02.2:** Add safe configuration examples and isolated dependency setup.
- **S02.3:** Verify bootstrap and document recovery from setup errors.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S03 — Validate contract and resolve implementation handoff gaps

**As a API developer, I want to implement a stable contract without silent schema changes, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E01 — Project baseline and developer setup |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Product owner / technical lead; actual assignee pending |
| Components | API, Documentation, QA |
| Depends on | S01 |
| Readiness gate | API-DEC-01–04; developer guide Section27 |
| PRD requirements | REQ-UX-001, NFR-12 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S03-AC1:** OpenAPI 3.1 validation, unique operation IDs, path/security declarations and embedded examples pass for the checked-in file.
2. **S03-AC2:** Resolve upload declaration storage, initial attendance roster materialization, preview token binding and acknowledgement receipt targets before their implementation stories are Ready.
3. **S03-AC3:** Generated clients, if selected, preserve null unions, decimal strings and oneOf behavior; generation is reproducible.
4. **S03-AC4:** Contract changes identify affected database/client/test artifacts and receive review.

**Suggested implementation subtasks**

- **S03.1:** Add contract-validation task and pin tool versions.
- **S03.2:** Resolve handoff gaps with explicit document/contract amendments.
- **S03.3:** Add response-schema checks to integration harness.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S04 — Apply and verify scoped database schema

**As a database developer, I want to persist correct ownership and immutable academic history, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E02 — Engineering and shared experience foundations |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Technical lead; actual assignee pending |
| Components | Database, QA |
| Depends on | S02, S03 |
| Readiness gate | DB-DEC-01/02/03; approved engine |
| PRD requirements | REQ-AUD-001, NFR-06 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S04-AC1:** Reference schema applies to an empty isolated selected-engine database with checksummed migration.
2. **S04-AC2:** Cross-institution and wrong-root revision pointers fail through constraints.
3. **S04-AC3:** Updating/deleting immutable attempts/revisions and changing referenced-file identity is rejected through ordinary roles.
4. **S04-AC4:** Version mismatch fails migration; roles cannot disable triggers or perform schema changes through API credentials.

**Suggested implementation subtasks**

- **S04.1:** Convert reviewed reference DDL into versioned migrations.
- **S04.2:** Implement role grants and separate migration identity.
- **S04.3:** Run DB-AC-01–06/17 with real database.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S05 — Implement guarded commands and original-operation receipts

**As a backend developer, I want to commit academic commands once and recover uncertain outcomes, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E02 — Engineering and shared experience foundations |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Technical lead; actual assignee pending |
| Components | API, Database, QA |
| Depends on | S04 |
| Readiness gate | SDD ADR-06; API command target contract |
| PRD requirements | REQ-ASG-008, REQ-UX-004, REQ-UX-005, NFR-06 |
| API operations | lookupOriginalOperation |

**Acceptance criteria**

1. **S05-AC1:** Commands acquire authorization/class/entity/file guards in documented order and share one transaction handle.
2. **S05-AC2:** Same actor/kind/target/key and canonical payload returns original terminal identity; different payload conflicts.
3. **S05-AC3:** Lost response around commit is reconciled; NOT_FOUND_YET is not rejection and never creates a replacement operation key.
4. **S05-AC4:** Revision conflict preserves prior committed state; successful replay is checked before new deadline/revision rules but after current authorization.

**Suggested implementation subtasks**

- **S05.1:** Implement transaction context, canonical digest and scoped receipt repository.
- **S05.2:** Implement lookupOriginalOperation and safe error mapping.
- **S05.3:** Test duplicate/concurrent requests and injected commit-response loss.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S06 — Create durable outbox, worker leases and audit infrastructure

**As a service operator, I want to process committed work safely and attribute sensitive changes, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E02 — Engineering and shared experience foundations |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Technical lead; actual assignee pending |
| Components | Worker, Database, API |
| Depends on | S04, S05 |
| Readiness gate | Worker retry/lease and audit retention configuration |
| PRD requirements | REQ-AUD-001, REQ-OPS-002, NFR-10 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S06-AC1:** Domain transaction can insert audit/outbox intent atomically with its resource change.
2. **S06-AC2:** Expired jobs can be reclaimed; stale lease generation cannot complete a newer claim.
3. **S06-AC3:** Duplicate processing is safe and exhausted retries remain visible for controlled replay.
4. **S06-AC4:** Logs omit raw credentials/academic payloads while restricted audit records required actor/time/change/reason.

**Suggested implementation subtasks**

- **S06.1:** Implement durable job claim/fencing/retry and outbox primitives.
- **S06.2:** Add allowlisted audit writer and safe telemetry fields.
- **S06.3:** Test crashes before/after commit and stale worker completion.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S07 — Provision and maintain school accounts and explicit grants

**As a school administrator, I want to manage identities and privileges without changing academic ownership, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E03 — Identity, sessions and authorization |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Identity/backend lead; actual assignee pending |
| Components | API, Staff UI, Database |
| Depends on | S04, S06 |
| Readiness gate | DEC-05/08; capability vocabulary |
| PRD requirements | REQ-AUTH-001, REQ-ADM-005 |
| API operations | listUsers, createUser, getUser, updateUser, listGrants, createGrant, revokeGrant |

**Acceptance criteria**

1. **S07-AC1:** Provisioning creates pending institution-managed accounts; duplicate normalized login or school identifier is rejected.
2. **S07-AC2:** Name/login maintenance preserves stable identity and linked academic records; students cannot edit identity or assign roles.
3. **S07-AC3:** Explicit class/institution grants are checked against allowlist and granting authority; revoke preserves audit.
4. **S07-AC4:** No password hash, token digest or recovery evidence appears in staff responses.

**Suggested implementation subtasks**

- **S07.1:** Implement User and grant operations with authorized forms.
- **S07.2:** Build canonical login validation and safe staff DTOs.
- **S07.3:** Add uniqueness, privilege-escalation and audit tests.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S08 — Implement browser sign-in, session continuity and logout

**As a student or staff member, I want to access the correct workspace and end access safely, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E03 — Identity, sessions and authorization |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Identity/backend lead; actual assignee pending |
| Components | API, Student UI, Staff UI |
| Depends on | S02, S03, S07 |
| Readiness gate | API-DEC-01; DEC-05 session policy |
| PRD requirements | REQ-AUTH-002, REQ-AUTH-003, REQ-AUTH-005 |
| API operations | bootstrapCsrf, signIn, getSession, logout |

**Acceptance criteria**

1. **S08-AC1:** CSRF bootstrap/preauth login rotates opaque secure cookie and returns correct authorized workspace.
2. **S08-AC2:** Invalid/unknown credentials have equivalent safe public behavior; required CSRF and trusted-origin checks reject invalid writes.
3. **S08-AC3:** Expiry hides protected content and offers reauthentication without confirming pending work.
4. **S08-AC4:** Logout revokes current session and clears private drafts/cache; second account cannot see first account data.

**Suggested implementation subtasks**

- **S08.1:** Implement bootstrapCsrf/signIn/getSession/logout and cookie policy.
- **S08.2:** Build AUTH-01/03 and account-bound session manager.
- **S08.3:** Test browser origin/CSRF, expiry/replay and account switching.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S09 — Implement activation, recovery and disabled-account revocation

**As a account holder, I want to activate or recover access using school-approved evidence, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E03 — Identity, sessions and authorization |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Identity/backend lead; actual assignee pending |
| Components | API, Student UI, Staff UI, Worker |
| Depends on | S06, S07, S08 |
| Readiness gate | DEC-05 recovery method/password policy |
| PRD requirements | REQ-AUTH-004, REQ-AUTH-006 |
| API operations | requestRecovery, completeRecovery, completeActivation, disableUser, issueActivation |

**Acceptance criteria**

1. **S09-AC1:** Known/unknown recovery requests return the same status/body without exposing challenge or account state.
2. **S09-AC2:** Valid evidence completes once; expired/replayed evidence fails; successful recovery revokes all old sessions.
3. **S09-AC3:** Disabling an account prevents subsequent protected requests and is audited.
4. **S09-AC4:** If completion response is lost, UI explains sign-in with new credentials or restarted recovery rather than treating consumed evidence as definite failure.

**Suggested implementation subtasks**

- **S09.1:** Implement evidence issuance/consumption and approved delivery adapter.
- **S09.2:** Build AUTH-02 and staff disable/activation actions.
- **S09.3:** Test evidence expiry/replay and revocation race.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S10 — Enforce resource authorization and historical access consistently

**As a school, I want to protect private content across every access path, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E03 — Identity, sessions and authorization |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Identity/backend lead; actual assignee pending |
| Components | API, Database, QA |
| Depends on | S05, S07, S08 |
| Readiness gate | DEC-08 history policy |
| PRD requirements | REQ-PERM-001, REQ-PERM-002, REQ-PERM-003, NFR-07 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S10-AC1:** Own/other/unassigned/disabled fixtures produce permitted/denied behavior for list/detail/count/write/download.
2. **S10-AC2:** Withdrawal or grant revocation changes next protected request; active own past submissions/results/attendance remain readable per approved policy.
3. **S10-AC3:** Inaccessible/nonexistent academic IDs have equivalent unavailable responses without titles or counts.
4. **S10-AC4:** Student serializers expose only approved published data; administrator role alone cannot publish or impersonate.

**Suggested implementation subtasks**

- **S10.1:** Implement shared scope predicates and role-specific DTO projection.
- **S10.2:** Create negative authorization fixture matrix and helper assertions.
- **S10.3:** Apply checks to every later operation as part of story Done.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S11 — Manage academic years, terms, subjects and classes

**As a administrator, I want to prepare the structure students and staff use, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E04 — Academic structure, membership and schedule |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Staff UI, Database |
| Depends on | S07, S10 |
| Readiness gate | Approved school calendar/date policy |
| PRD requirements | REQ-ADM-001, REQ-ADM-002 |
| API operations | staffListAcademicYear, staffCreateAcademicYear, staffGetAcademicYear, staffUpdateAcademicYear, staffArchiveAcademicYear, staffListTerm, staffCreateTerm, staffGetTerm, staffUpdateTerm, staffArchiveTerm, staffListSubject, staffCreateSubject, staffGetSubject, staffUpdateSubject, staffArchiveSubject, staffListClass, staffCreateClass, staffGetClass, staffUpdateClass, staffArchiveClass |

**Acceptance criteria**

1. **S11-AC1:** Year/term dates and containment are validated; class requires subject/term/name/code and duplicate term/class code is rejected.
2. **S11-AC2:** Staff can create, view, replace and archive records through supported forms.
3. **S11-AC3:** Referenced records cannot be hard-deleted; archive retains read-only academic history.
4. **S11-AC4:** Stale edits conflict and preserve newer revision; each controlled change is audited.

**Suggested implementation subtasks**

- **S11.1:** Implement academic setup operations and STF-01.
- **S11.2:** Validate calendar bounds, uniqueness and revision writes.
- **S11.3:** Verify admin setup UAT fixtures.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S12 — Manage teacher assignments, enrollment and withdrawal

**As a administrator, I want to keep active and historical membership accurate, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E04 — Academic structure, membership and schedule |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Staff UI, Database |
| Depends on | S10, S11 |
| Readiness gate | DEC-08; effective interval rules |
| PRD requirements | REQ-ADM-003, REQ-ADM-004 |
| API operations | listEnrollments, createEnrollments, listTeachers, createTeachers, changeEnrollment, endTeacherAssignment |

**Acceptance criteria**

1. **S12-AC1:** Only eligible active users are newly assigned/enrolled; overlapping duplicate intervals are rejected.
2. **S12-AC2:** Withdrawal/completion records reason/effective interval and preserves existing academic history.
3. **S12-AC3:** Backdated correction flags affected records for review and does not silently rewrite historical scores/attempts.
4. **S12-AC4:** Membership changes serialize with active academic commands and invalidate incompatible client data.

**Suggested implementation subtasks**

- **S12.1:** Implement STF-02 assignment/enrollment forms and interval commands.
- **S12.2:** Add exclusive authorization guard and interval overlap tests.
- **S12.3:** Test withdrawal/active-history negative and positive paths.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S13 — Create, update and cancel class sessions

**As a teacher or administrator, I want to maintain a reliable schedule, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E04 — Academic structure, membership and schedule |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S11, S12 |
| Readiness gate | Institution timezone and overlap acknowledgement policy |
| PRD requirements | REQ-CLS-003, REQ-CLS-004 |
| API operations | staffListSessions, staffCreateSession, staffUpdateSession, cancelSession |

**Acceptance criteria**

1. **S13-AC1:** End follows start and session lies within school-local term bounds.
2. **S13-AC2:** Teacher/class overlaps are identified and latest conflict requires explicit acknowledgement.
3. **S13-AC3:** Cancel preserves history/reason and excludes session from next-activity and attendance calculations.
4. **S13-AC4:** Concurrent stale edit rejects; authorized archived corrections require separate permission.

**Suggested implementation subtasks**

- **S13.1:** Implement session operations and STF-03.
- **S13.2:** Add overlap and term/timezone validation.
- **S13.3:** Test local-midnight/cancellation/concurrency cases.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S14 — Browse own classes, overview and sessions

**As a student, I want to find relevant current and historical class content, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E04 — Academic structure, membership and schedule |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S10, S12, S13, S16 |
| Readiness gate | UX navigation baseline; directory deferred |
| PRD requirements | REQ-CLS-001, REQ-CLS-002 |
| API operations | listAccessibleTerms, listClasses, getClass, listClassSessions, getClassSession |

**Acceptance criteria**

1. **S14-AC1:** Term/current/history filters show only authorized classes with stable ordering and read-only archived labels.
2. **S14-AC2:** Overview shows teacher/location; missing room is Not assigned; Students tab remains absent.
3. **S14-AC3:** Sessions load with correct ordering and canceled status; failed tab is not empty data.
4. **S14-AC4:** General class access stops after withdrawal; own historical records remain reachable through separate destinations.

**Suggested implementation subtasks**

- **S14.1:** Implement STU-02–04 and class/session query adapters.
- **S14.2:** Wire tab navigation, preserved list position and page states.
- **S14.3:** Test unrelated class IDs and historical behavior.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S15 — Implement private upload allocation, transfer and scanning

**As a student or staff uploader, I want to prepare safe files before attaching them, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E05 — Files and learning materials |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Files/backend lead; actual assignee pending |
| Components | API, Worker, Database |
| Depends on | S03, S06, S10 |
| Readiness gate | File provider/scanner; upload declaration storage |
| PRD requirements | REQ-FILE-001, REQ-FILE-002 |
| API operations | createUpload, getUpload, putUploadBytes, completeUpload, retryUploadCheck |

**Acceptance criteria**

1. **S15-AC1:** Allocate owned staging, transfer raw bytes, complete and poll UPLOADING/CHECKING/READY or failure states.
2. **S15-AC2:** Server rejects zero/disguised/unsupported/oversized files and enforces actual 20 MiB limit; scans exact immutable version.
3. **S15-AC3:** 100% transfer is not READY/submitted; transient retry never bypasses unsafe rejection.
4. **S15-AC4:** File lifecycle and staged 24h expiry are owner-authorized; API never exposes arbitrary object keys/public URLs.

**Suggested implementation subtasks**

- **S15.1:** Implement upload operations, adapter and bounded isolated scanner.
- **S15.2:** Persist declared versus verified metadata explicitly.
- **S15.3:** Test transfer replay, inspection failures and content limits.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S16 — Provide shared UI shell, validation and list states

**As a student or staff member, I want to use consistent accessible screens and safe forms, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E02 — Engineering and shared experience foundations |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Technical lead; actual assignee pending |
| Components | Student UI, Staff UI |
| Depends on | S03, S08 |
| Readiness gate | UX-DEC-01; approved platform/language matrix |
| PRD requirements | REQ-UX-001, REQ-UX-002, REQ-UX-003, REQ-UX-004, REQ-UX-006 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S16-AC1:** Navigation/components use approved tokens and labels; required forms preserve valid Unicode and safe input on recoverable errors.
2. **S16-AC2:** Loading, empty, filter-empty, offline, error, unavailable, stale and conflict are distinct.
3. **S16-AC3:** Paged lists default 20/max 100, preserve filters/position where safe and never derive full totals from page length.
4. **S16-AC4:** Keyboard/focus/labels/non-color status/enlarged text pass component checks; private state clears on account change.

**Suggested implementation subtasks**

- **S16.1:** Build reusable components, query/write state adapters and navigation shells.
- **S16.2:** Implement typed contract models and validation/error mapping.
- **S16.3:** Add shared accessibility and state fixtures.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S17 — Authorize exact file-reference downloads and protect cleanup

**As a authorized file reader, I want to download the correct retained file without exposing it, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E05 — Files and learning materials |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Files/backend lead; actual assignee pending |
| Components | API, Worker, Database |
| Depends on | S15, S10 |
| Readiness gate | Exact-version provider and retention rules |
| PRD requirements | REQ-FILE-003, REQ-FILE-004 |
| API operations | cancelUpload, downloadAuthorizedFile |

**Acceptance criteria**

1. **S17-AC1:** Each download reauthorizes exact parent reference including own historical submission path; other-user copied reference fails.
2. **S17-AC2:** Another user staged file cannot attach; aggregate groups enforce five files/50MiB.
3. **S17-AC3:** Cleanup locks/rechecks references before deletion; race preserves referenced file or rejects new attachment.
4. **S17-AC4:** Confirmed missing object remains an incident with retained receipt, never silent record deletion/replacement.

**Suggested implementation subtasks**

- **S17.1:** Implement download gateway and cancel/cleanup workflow.
- **S17.2:** Add typed reference/identity protections and object reconciliation.
- **S17.3:** Exercise cleanup/finalization race and copied-link tests.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S18 — Publish, replace and archive class materials

**As a teacher, I want to maintain versioned learning resources, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E05 — Files and learning materials |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Files/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S11, S15, S17 |
| Readiness gate | content capability and revision policy |
| PRD requirements | REQ-MAT-001, REQ-MAT-003 |
| API operations | staffListMaterials, staffCreateMaterials, staffGetMaterials, staffReplaceMaterials, staffPublishMaterials, staffArchiveMaterials, historyMaterials |

**Acceptance criteria**

1. **S18-AC1:** Draft requires bounded title/content and attachments; publish requires ready authorized files.
2. **S18-AC2:** Student visibility changes only on publication; draft/replaced revision history remains attributable.
3. **S18-AC3:** Replacing teaching material never alters a confirmed student submission file.
4. **S18-AC4:** Archive removes active visibility and preserves authorized evidence.

**Suggested implementation subtasks**

- **S18.1:** Implement STF-04 draft/publish/replace/archive and history.
- **S18.2:** Link exact revision file references and event/audit.
- **S18.3:** Test draft leakage, revision conflict and archive downloads.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S19 — Browse and download published class materials

**As a student, I want to access learning resources from an enrolled class, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E05 — Files and learning materials |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | S |
| Owner role | Files/backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S14, S17, S18 |
| Readiness gate | None beyond prerequisites |
| PRD requirements | REQ-MAT-002 |
| API operations | listMaterials, getMaterial |

**Acceptance criteria**

1. **S19-AC1:** Only published eligible materials appear; withdrawn student cannot fetch general material via old link.
2. **S19-AC2:** File rows display safe name/type/size and downloading/error/retry states.
3. **S19-AC3:** No material displays a specific empty state; failed request is not an empty result.
4. **S19-AC4:** Unsupported local viewer does not imply all formats can preview; authorized download remains available.

**Suggested implementation subtasks**

- **S19.1:** Implement STU-05 and protected download adapter.
- **S19.2:** Add publication/withdrawal fixtures.
- **S19.3:** Verify retained historical class behavior.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S20 — Author and publish assignment policy revisions

**As a teacher, I want to give students valid instructions and submission rules, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E06 — Assignment publication and reliable submission |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Assignments/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S05, S11, S15, S17 |
| Readiness gate | DEC-06; accepted timestamp/policy baseline |
| PRD requirements | REQ-ASG-001, REQ-ASG-002, REQ-ASG-003, REQ-ASG-004 |
| API operations | staffListAssignments, staffCreateAssignments, staffGetAssignments, staffReplaceAssignments, staffPublishAssignments, staffArchiveAssignments, historyAssignments |

**Acceptance criteria**

1. **S20-AC1:** Valid bounded title/instructions/open/due/mode/attempt/late policy publishes only in authorized active class with Ready files.
2. **S20-AC2:** Default attempts 1, up to 3; late disabled unless late_close>due; preview displays timezone/requirements.
3. **S20-AC3:** Published deadlines extend only; after first attempt protected policy/class/grading basis cannot change.
4. **S20-AC4:** Archive blocks new work under class guard, preserves history and cannot reopen/revert to Draft.

**Suggested implementation subtasks**

- **S20.1:** Implement STF-05, immutable revisions and controlled publish/archive.
- **S20.2:** Add file/policy readiness validation and outbox/audit intent.
- **S20.3:** Test policy boundaries and locked-field transitions.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S21 — List assignments and explain eligibility

**As a student, I want to know what is pending and how to submit, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E06 — Assignment publication and reliable submission |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Assignments/backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S14, S16, S20 |
| Readiness gate | DEC-06 completion semantics |
| PRD requirements | REQ-ASG-005, REQ-ASG-006 |
| API operations | listAssignments, getAssignment |

**Acceptance criteria**

1. **S21-AC1:** All/Pending/Completed follow confirmed attempts, not grading; closed unsubmitted remains Pending.
2. **S21-AC2:** Detail shows due/timezone, instructions/files, mode, limits, attempts and published feedback only.
3. **S21-AC3:** Eligibility comes from server and explains open/late/closed/feedback/attempt restriction; no artificial progress percentage.
4. **S21-AC4:** Missing/failed/unauthorized states are distinct and filters cover all authorized results.

**Suggested implementation subtasks**

- **S21.1:** Implement STU-06/07 list/detail and filters.
- **S21.2:** Bind published-only DTO/eligibility fields.
- **S21.3:** Test submitted-ungraded and closed-pending fixtures.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S22 — Finalize immutable assignment attempts exactly once

**As a student, I want to receive a trustworthy confirmation for submitted work, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E06 — Assignment publication and reliable submission |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Assignments/backend lead; actual assignee pending |
| Components | API, Database, QA |
| Depends on | S05, S10, S17, S20 |
| Readiness gate | SDD-DEC-01 accepted_at; DEC-06 limits |
| PRD requirements | REQ-ASG-007, REQ-ASG-008, NFR-06 |
| API operations | submitAssignment |

**Acceptance criteria**

1. **S22-AC1:** TEXT/FILES/TEXT_AND_FILES validates required content, owner, Ready state, expiry and group limits.
2. **S22-AC2:** Post-lock database acceptance time obeys inclusive due/late-close; upload start does not reserve on-time status.
3. **S22-AC3:** Attempt/content/file references/current pointer/count/receipt/audit commit together; response lost after commit replays same ID/time.
4. **S22-AC4:** Two requests for last attempt allow at most one; archive/withdrawal race gives one authoritative serial outcome.

**Suggested implementation subtasks**

- **S22.1:** Implement submitAssignment and transactional finalization use case.
- **S22.2:** Add canonical replay and exact policy snapshot/reference.
- **S22.3:** Run AC-ASG-01–06/08 with barriers and commit fault injection.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S23 — Build submission form, unknown-outcome recovery and history

**As a student, I want to submit work and revisit durable evidence, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E06 — Assignment publication and reliable submission |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Assignments/backend lead; actual assignee pending |
| Components | Student UI, API |
| Depends on | S15, S16, S21, S22 |
| Readiness gate | Pending-marker storage and history policy |
| PRD requirements | REQ-ASG-006, REQ-ASG-008, REQ-ASG-009, REQ-UX-004 |
| API operations | listOwnSubmissions, getOwnSubmission |

**Acceptance criteria**

1. **S23-AC1:** Form validates mode/text/files and distinguishes uploading/checking/Ready from Submitted; duplicate taps disabled.
2. **S23-AC2:** Unknown transport outcome reconciles original key; NOT_FOUND_YET does not create another attempt.
3. **S23-AC3:** Confirmation/history survives restart and includes original accepted time/timeliness/content; prior attempts immutable.
4. **S23-AC4:** Withdrawn active student can reach own history from Profile without reopening class access; logout clears private markers/drafts.

**Suggested implementation subtasks**

- **S23.1:** Implement STU-08/09 and account-bound upload/operation coordinator.
- **S23.2:** Integrate own history/receipt routes.
- **S23.3:** Test lost-response after deadline, restart, and shared-device cases.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S24 — Review current and previous student attempts

**As a teacher, I want to inspect submitted work for assigned classes, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E07 — Submission review and feedback |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S12, S22 |
| Readiness gate | Review capability scope |
| PRD requirements | REQ-ASG-010 |
| API operations | listSubmissionRoster, getStaffSubmission, listStaffAttemptHistory |

**Acceptance criteria**

1. **S24-AC1:** Roster lists relevant students with submitted/not-submitted, latest attempt, accepted time and grading state.
2. **S24-AC2:** Review opens exact immutable current content/files and earlier attempts without modifying them.
3. **S24-AC3:** Unassigned teacher cannot inspect rows/counts/downloads.
4. **S24-AC4:** Pagination/filter counts cover authorized full roster.

**Suggested implementation subtasks**

- **S24.1:** Implement STF-06 roster and attempt detail/history.
- **S24.2:** Bind safe staff data/download path.
- **S24.3:** Test unassigned scope and last-attempt ordering.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S25 — Draft, publish and correct attempt-specific feedback

**As a teacher with publishing authority, I want to release feedback for the correct student attempt, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E07 — Submission review and feedback |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Academic backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S06, S24 |
| Readiness gate | Feedback publish authority and grading basis |
| PRD requirements | REQ-ASG-009, REQ-ASG-011, REQ-ASG-012 |
| API operations | getStaffFeedback, createFeedbackDraft, replaceFeedbackDraft, publishFeedback, historyFeedback |

**Acceptance criteria**

1. **S25-AC1:** Draft save does not expose comment/score or draft existence to student.
2. **S25-AC2:** Publish verifies reviewed attempt is still current; newer attempt causes conflict and requires fresh review.
3. **S25-AC3:** Published feedback sets resubmission lock and emits one revision event; earlier attempts/history retained.
4. **S25-AC4:** Correction requires reason and preserves old visible feedback until new revision commits.

**Suggested implementation subtasks**

- **S25.1:** Implement draft/replace/publish/history operations and staff review UI.
- **S25.2:** Integrate current-attempt guard and feedback lock.
- **S25.3:** Test AC-ASG-07 and correction/draft visibility.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S26 — Publish exam schedules and manage expected result roster

**As a academic staff, I want to define assessments and which students require results, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E08 — Assessments and published results |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Results/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S11, S12, S13, S10 |
| Readiness gate | SDD-DEC-02 expected roster policy |
| PRD requirements | REQ-RES-001 |
| API operations | staffListAssessments, staffCreateAssessments, staffGetAssessments, staffReplaceAssessments, staffPublishAssessments, staffArchiveAssessments, cancelAssessment, listAssessmentEligibility, addAssessmentEligibility, updateEligibility |

**Acceptance criteria**

1. **S26-AC1:** Assessment has positive maximum, class/term/subject and valid paired exam times.
2. **S26-AC2:** Publishing details makes future exam metadata visible independently of student scores.
3. **S26-AC3:** Expected roster snapshot is captured at publication; later corrections are explicit, reasoned and reviewable.
4. **S26-AC4:** Draft/canceled/past/unrelated exams do not become next-exam items.

**Suggested implementation subtasks**

- **S26.1:** Implement assessment authoring/publish/cancel and eligibility maintenance.
- **S26.2:** Snapshot expected roster under guard.
- **S26.3:** Test separate schedule and score publication.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S27 — Enter unique result drafts and prepare corrections

**As a academic staff, I want to record scored, absent or exempt assessment outcomes, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E08 — Assessments and published results |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Results/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S26 |
| Readiness gate | DEC-07 scoring and positive maximum limits |
| PRD requirements | REQ-RES-002, REQ-RES-003 |
| API operations | listStaffResults, createResultDraft, getStaffResult, replaceResultDraft |

**Acceptance criteria**

1. **S27-AC1:** One result identity per student/assessment; duplicate rejected.
2. **S27-AC2:** Scored has exact valid 0..maximum marks; Absent/Exempt require null; excess precision rejected before DB coercion.
3. **S27-AC3:** Drafts are staff-only and missing records are not zero.
4. **S27-AC4:** Correction appends draft/reason without replacing previously visible score until publication.

**Suggested implementation subtasks**

- **S27.1:** Implement draft result list/get/create/replace and STF-07 grid.
- **S27.2:** Add status/precision/basis validation and revision guards.
- **S27.3:** Test student draft leakage and stale staff saves.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S28 — Preview and atomically publish, correct or withdraw results

**As a academic publisher, I want to release only reviewed results with preserved history, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E08 — Assessments and published results |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Results/backend lead; actual assignee pending |
| Components | API, Staff UI, Database |
| Depends on | S05, S06, S27 |
| Readiness gate | API batch 100 and preview 10m proposal |
| PRD requirements | REQ-RES-003, REQ-RES-004, REQ-RES-007 |
| API operations | previewResultPublication, commitResultPublication, getPublicationBatch, historyResults |

**Acceptance criteria**

1. **S28-AC1:** Preview binds actor/action/reason and explicit 1–100 selected IDs/revisions; invalid/excluded rows are listed.
2. **S28-AC2:** Commit revalidates selection and authority; all selected pointers/revisions/items/events/audit commit or none.
3. **S28-AC3:** Stale preview conflicts; confirmed original replay survives token expiry without another publication.
4. **S28-AC4:** Withdrawal requires reason, removes affected student-visible values and makes coverage incomplete while preserving previous revisions.

**Suggested implementation subtasks**

- **S28.1:** Implement preview/commit/receipt endpoints and explicit selection UI.
- **S28.2:** Add immutable batch/items and pointer transaction.
- **S28.3:** Test partial failure, expired/replayed token and withdrawn summaries.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S29 — Display published results with correct scoped summaries

**As a student, I want to understand own published results without mistaking partial data for final grades, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E08 — Assessments and published results |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Results/backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S16, S28 |
| Readiness gate | DEC-07 provisional formula |
| PRD requirements | REQ-RES-005, REQ-RES-006 |
| API operations | listOwnResults, getOwnResult |

**Acceptance criteria**

1. **S29-AC1:** Term/subject filters return own published records only, never draft values/count leakage.
2. **S29-AC2:** 40/50+60/100 shows100/150=66.67%; scored0 remains0.00%; Absent/Exempt are separate counts.
3. **S29-AC3:** Zero scored denominator is N/A; missing/draft/withdrawn expected data is visibly Incomplete.
4. **S29-AC4:** UI uses Published scored assessments percentage label and no GPA/rank/pass-fail/final grade.

**Suggested implementation subtasks**

- **S29.1:** Implement STU-10 and exact-decimal aggregate query.
- **S29.2:** Keep rows/summary in one filter snapshot.
- **S29.3:** Run AC-RES-01–05.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S30 — Record draft attendance and explicitly finalize coverage

**As a teacher, I want to record an eligible roster without inventing absences, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E09 — Attendance and recorded coverage |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Attendance/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S12, S13, S16 |
| Readiness gate | API empty roster and1000-row write resolution |
| PRD requirements | REQ-ATT-001, REQ-ATT-002 |
| API operations | getAttendanceRoster, saveAttendanceDraft, finalizeAttendance |

**Acceptance criteria**

1. **S30-AC1:** One student/session identity; future/not-started/canceled sessions reject regular writes.
2. **S30-AC2:** Initial GET is read-only with nullable logical root; first guarded write materializes once and honors revision.
3. **S30-AC3:** Draft save affects explicit rows only and never marks missing students Absent.
4. **S30-AC4:** Finalize either requires complete eligible roster or explicit allow_incomplete; draft status is not student-visible.

**Suggested implementation subtasks**

- **S30.1:** Implement STF-08 read/save/finalize and empty-root contract.
- **S30.2:** Calculate eligibility from enrollment intervals.
- **S30.3:** Test duplicate rows, concurrent first write and incomplete finalization.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S31 — Correct attendance and reconcile membership/session changes

**As a authorized academic staff, I want to repair records with reason and preserved evidence, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E09 — Attendance and recorded coverage |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Attendance/backend lead; actual assignee pending |
| Components | API, Staff UI, Database |
| Depends on | S30 |
| Readiness gate | DEC-07 correction authority |
| PRD requirements | REQ-ATT-004, REQ-ATT-005 |
| API operations | correctAttendance, listReviewFlags, resolveReviewFlag |

**Acceptance criteria**

1. **S31-AC1:** Correction requires reason and new finalized revision; earlier values remain audit-visible.
2. **S31-AC2:** Session cancellation excludes its counts without deleting recorded history.
3. **S31-AC3:** Membership backdating uses start-inclusive/end-exclusive intervals and flags affected reports.
4. **S31-AC4:** Review flags can be listed/resolved with safe attributable evidence; resolution does not invent missing academic work.

**Suggested implementation subtasks**

- **S31.1:** Implement correction/recalculation and review-flag routes.
- **S31.2:** Add consistent coverage queries and audit changes.
- **S31.3:** Test cancellation/backdated membership and stale correction.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S32 — Show finalized attendance and recorded coverage

**As a student, I want to understand own attendance and missing information, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E09 — Attendance and recorded coverage |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Attendance/backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S16, S30, S31 |
| Readiness gate | DEC-07 attendance formula |
| PRD requirements | REQ-ATT-003 |
| API operations | listOwnAttendance |

**Acceptance criteria**

1. **S32-AC1:** History includes own finalized statuses with class/date filters; hidden drafts shown only as Not recorded where eligible.
2. **S32-AC2:** 8Present+1Late+1Absent+2Excused gives90.00% and12/12; one missing gives12/13 provisional.
3. **S32-AC3:** Only Excused is N/A; only Absent is0.00%; canceled/future sessions excluded appropriately.
4. **S32-AC4:** Rows and whole-filter percentage/counts/coverage are coherent and accessible.

**Suggested implementation subtasks**

- **S32.1:** Implement STU-11 and summary response adapter.
- **S32.2:** Add exact calculation fixtures and empty states.
- **S32.3:** Run AC-ATT-01–05.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S33 — Deliver required in-app publication events once per recipient

**As a student, I want to receive relevant updates without duplicate or stale access, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E10 — Notices and in-app communication |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Worker/backend lead; actual assignee pending |
| Components | Worker, API, Database |
| Depends on | S06, S10 |
| Readiness gate | In-app baseline and event-time audience policy |
| PRD requirements | REQ-NOT-002, REQ-NOT-003, NFR-09 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S33-AC1:** Assignment/feedback/result/notice publication captures eligible recipients inside domain transaction.
2. **S33-AC2:** Worker replay after partial delivery inserts no duplicate event-recipient notification.
3. **S33-AC3:** Current permission is rechecked on delivery/read; old event does not reopen withdrawn class access.
4. **S33-AC4:** Measure event-commit to visible notification; proposed 95% within 60 seconds in healthy operation, reported under approved profile.

**Suggested implementation subtasks**

- **S33.1:** Implement event handlers and current-visibility queries.
- **S33.2:** Add unique recipient deliveries and safe worker replay.
- **S33.3:** Test publication integrations with each feature and membership change.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S34 — Author, publish, edit and archive notices

**As a authorized staff publisher, I want to communicate with the correct school or class audience, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E10 — Notices and in-app communication |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Worker/backend lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S06, S10, S16, S33 |
| Readiness gate | School-wide capability and expiry policy |
| PRD requirements | REQ-NOT-001, REQ-NOT-005 |
| API operations | staffListNotices, staffCreateNotice, staffGetNotice, staffReplaceNotice, staffPublishNotice, staffArchiveNotice, historyNotices |

**Acceptance criteria**

1. **S34-AC1:** Required title/body/audience and expiry after publication validated; teacher lacks school-wide action without grant.
2. **S34-AC2:** Draft notice invisible until publish; current still-published content available to later eligible enrollment.
3. **S34-AC3:** Wording edit preserves previous read state; deliberate republish creates new revision/event.
4. **S34-AC4:** Archive/expiry removes active visibility and old link becomes unavailable; audit retains changes.

**Suggested implementation subtasks**

- **S34.1:** Implement STF-09 notice draft/publish/republish/archive and history.
- **S34.2:** Bind audience/revision checks and event intent.
- **S34.3:** Test school/class permission and no unintended resend.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S35 — Read notices and notifications with persistent unread state

**As a student, I want to find relevant updates and know what has been read, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E10 — Notices and in-app communication |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Worker/backend lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S16, S33, S34 |
| Readiness gate | None beyond approved communication policy |
| PRD requirements | REQ-NOT-003, REQ-NOT-004 |
| API operations | listNotices, getNotice, listNotifications, getUnreadCount, getNotification, markNotificationRead |

**Acceptance criteria**

1. **S35-AC1:** Updates/Notices show only currently visible items ordered by event/publication time and stable ID.
2. **S35-AC2:** Successfully loaded linked detail permits mark-read; failed detail stays unread; read-update failure retries without falsely synchronized count.
3. **S35-AC3:** Repeated mark-read retains original read time and no duplicate row; unread count excludes inaccessible items.
4. **S35-AC4:** New feedback/result revision is a new unread event; later enrollment does not replay historical notifications.

**Suggested implementation subtasks**

- **S35.1:** Implement STU-13 lists/detail and mark-read/count adapters.
- **S35.2:** Integrate resource navigation with current authorization.
- **S35.3:** Test expired notice, failed detail and idempotent read.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S36 — Compose student Home and own schedule

**As a student, I want to see the learning day and next relevant exam, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E11 — Student Home, profile and help |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Client lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S14, S16, S26, S35 |
| Readiness gate | Institution timezone confirmed |
| PRD requirements | REQ-HOME-001, REQ-HOME-002, REQ-HOME-003 |
| API operations | getDashboard, getExam, listOwnSchedule |

**Acceptance criteria**

1. **S36-AC1:** Home shows own identity, shortcuts, visible unread count, local-day sessions and nearest future published relevant exam.
2. **S36-AC2:** UTC/local-midnight overlap fixtures appear on correct school day; canceled session stays labeled but not next activity.
3. **S36-AC3:** Draft/canceled/past/unrelated exams excluded; ties stable; no exam has clear empty state.
4. **S36-AC4:** Failed widget is unavailable without replacing it with zero; paged schedule supports all authorized matches.

**Suggested implementation subtasks**

- **S36.1:** Implement STU-01 and listOwnSchedule/getDashboard/getExam.
- **S36.2:** Compose queries without duplicated academic state.
- **S36.3:** Test per-widget errors, local day and exam visibility.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S37 — Consolidate profile, permitted preferences and support

**As a student, I want to manage allowed settings and find help, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E11 — Student Home, profile and help |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | S |
| Owner role | Client lead; actual assignee pending |
| Components | API, Student UI |
| Depends on | S08, S16 |
| Readiness gate | Approved languages/support contact |
| PRD requirements | REQ-PRO-001, REQ-PRO-002, REQ-PRO-003 |
| API operations | getProfile, updatePreferences, getSupport |

**Acceptance criteria**

1. **S37-AC1:** School name/identifier/roles/recovery identity/enrollment remain read-only to student.
2. **S37-AC2:** Allowed language preference persists with revision validation; unsupported value rejects and previous value remains on failed save.
3. **S37-AC3:** Profile exposes attendance/own history/help/logout, not duplicate profile/photo features.
4. **S37-AC4:** School-provided contact/availability/reporting guidance is configured before pilot and requests no password/private payload; safe reference can be copied.

**Suggested implementation subtasks**

- **S37.1:** Implement STU-12/14 and profile/preferences/support operations.
- **S37.2:** Add field allowlist and safe state persistence.
- **S37.3:** Verify account switch and absent/unsupported preferences.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S38 — Provide authorized audit and revision inspection

**As a granted reviewer, I want to trace sensitive changes without editing evidence, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Story |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | QA lead; actual assignee pending |
| Components | API, Staff UI |
| Depends on | S06, S10 |
| Readiness gate | Audit/support grant and retention approval |
| PRD requirements | REQ-AUD-002 |
| API operations | listAudit, getAudit |

**Acceptance criteria**

1. **S38-AC1:** Audit list/detail filters use permitted actor/entity/time scope and stable paging.
2. **S38-AC2:** Ordinary users cannot read/change audit; support sees restricted diagnostics only unless expressly granted.
3. **S38-AC3:** Response is allowlisted with attributable change summary/reason and safe request reference, without secrets.
4. **S38-AC4:** Related module histories show authorized prior revision summaries; no student draft access is added.

**Suggested implementation subtasks**

- **S38.1:** Implement STF-10 audit query UI and endpoints.
- **S38.2:** Apply reviewer grants and projection redaction.
- **S38.3:** Test denied audit mutation/read and safe corrections.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S39 — Prepare pilot data and verify initial setup

**As a school data owner, I want to launch with reconciled accounts and enrollment, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | QA lead; actual assignee pending |
| Components | Database, Documentation, QA |
| Depends on | S07, S11, S12 |
| Readiness gate | DEC-09 source/scale; DEC-14 real-data policy |
| PRD requirements | REQ-ADM-006, REQ-DATA-001 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S39-AC1:** Manual supported setup establishes pilot records without developer database editing as the operational workflow.
2. **S39-AC2:** Counts, duplicates, membership intervals and sample student/teacher access reconcile against approved source.
3. **S39-AC3:** Data owner acknowledges discrepancies resolved or explicitly excluded before rollout.
4. **S39-AC4:** Automated import remains deferred; any selected importer requires a separate reviewed story and row-level preview.

**Suggested implementation subtasks**

- **S39.1:** Build synthetic UAT fixtures and reconciliation report process.
- **S39.2:** Run manual admin setup and sample access checks.
- **S39.3:** Obtain named data-owner review evidence.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S40 — Automate cross-feature contract and race regression

**As a QA engineer, I want to detect regressions against the reviewed product contract, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | QA lead; actual assignee pending |
| Components | QA, CI/CD |
| Depends on | S03, S05, S06 |
| Readiness gate | Selected database/client test environment |
| PRD requirements | NFR-12, REQ-UX-005 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S40-AC1:** CI runs schema/response validation and critical policy/permission fixtures against the selected engine.
2. **S40-AC2:** Barrier-controlled race tests prove both authoritative orders, not just one concurrent run.
3. **S40-AC3:** Restore/lost-response tests inspect original IDs/times/pointers/counts in addition to HTTP response.
4. **S40-AC4:** Each delivered story contributes targeted regression cases; full-suite completion requires all feature stories in release scope.

**Suggested implementation subtasks**

- **S40.1:** Create integration harness with fault injection, clocks and fixture reset boundaries.
- **S40.2:** Add contract example/real-response checks.
- **S40.3:** Aggregate PRD/SDD/DB/UX test evidence in CI.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S41 — Verify accessibility, localization and supported clients

**As a QA and design team, I want to confirm users can complete core journeys on approved platforms, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | QA lead; actual assignee pending |
| Components | QA, Student UI, Staff UI |
| Depends on | S16 |
| Readiness gate | DEC-02/03 matrix and language coverage |
| PRD requirements | REQ-UX-006, NFR-08 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S41-AC1:** Keyboard/focus/screen-reader labels and non-color status cues work across core student/staff tasks.
2. **S41-AC2:** 200% text and compact layout retain controls/errors; Khmer/English data is intact with reviewed approved translations.
3. **S41-AC3:** Reduced-motion and non-drag alternatives work; no unsupported all-device claim.
4. **S41-AC4:** Attach tested build/device/language matrix and resolve core-task blockers; final sign-off follows all feature integration.

**Suggested implementation subtasks**

- **S41.1:** Create component/accessibility checks and representative device scenarios.
- **S41.2:** Run assistive input and long-text usability sessions.
- **S41.3:** Record defects and signed matrix.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S42 — Prove performance, capacity and hot-class contention

**As a technical lead, I want to size the pilot and validate response budgets, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | QA lead; actual assignee pending |
| Components | QA, API, Database |
| Depends on | S22, S29, S32, S36 |
| Readiness gate | DEC-13 load/targets approved |
| PRD requirements | NFR-01, NFR-02, NFR-03 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S42-AC1:** Run approved PRD profile including warm-up, metadata traffic and maximum uploads with recorded infrastructure/mix.
2. **S42-AC2:** Routine list/detail p95<=1s, dashboard<=2s, finalization<=2s after files Ready are proposed targets to approve and measure.
3. **S42-AC3:** Client primary content within 3s in 95% of controlled approved-device loads; report cold/warm separately.
4. **S42-AC4:** Add concentrated class deadline spike and record lock wait; no duplicate/lost academic writes while meeting accepted limits.

**Suggested implementation subtasks**

- **S42.1:** Build repeatable load dataset and scenarios.
- **S42.2:** Inspect query plans/pool/lock/scanner metrics and fix concrete bottlenecks.
- **S42.3:** Attach report and capacity decision.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S43 — Verify security and private-data boundaries before pilot

**As a school and service owner, I want to prevent unauthorized disclosure and unsafe deployment, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E12 — Audit, data readiness and quality evidence |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | QA lead; actual assignee pending |
| Components | QA, API, CI/CD |
| Depends on | S09, S10, S17, S38 |
| Readiness gate | Approved role/privacy/config policies |
| PRD requirements | NFR-07, NFR-10, NFR-11 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S43-AC1:** Required own/other/unassigned/withdrawn/disabled matrix passes every route class, counts and downloads.
2. **S43-AC2:** Cookie/CSRF/origin, file validation, protected persistence and secret injection checks pass.
3. **S43-AC3:** Logs/analytics/client caches omit credentials and unnecessary academic content; account switching clears private state.
4. **S43-AC4:** Zero unresolved confirmed access paths or integrity flaws at release; known finding has owner/evidence and cannot be hidden by aggregate pass rate.

**Suggested implementation subtasks**

- **S43.1:** Run threat-oriented permission and abuse tests.
- **S43.2:** Review database roles, scanner privileges, caches and telemetry.
- **S43.3:** Record remediation and release security evidence.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S44 — Configure monitoring, alerts and reliable operational metrics

**As a service owner, I want to detect failure and distinguish rejection from technical loss, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E13 — Release, recovery and service handover |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Release/service owner; actual assignee pending |
| Components | Worker, CI/CD, Documentation |
| Depends on | S06, S33 |
| Readiness gate | DEC-12/13 named owners/windows |
| PRD requirements | REQ-OPS-002, NFR-04, NFR-09 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S44-AC1:** Monitor auth/submission errors, unknown operations, DB/lock wait, scans, outbox age, downloads and backup freshness.
2. **S44-AC2:** Injected failure reaches named owner with safe correlation and triage path.
3. **S44-AC3:** Proposed99.5% monthly authenticated-probe availability includes maintenance and separately reports monitoring gaps; threshold approval documented.
4. **S44-AC4:** Logical reliability deduplicates retries and separately counts invalid/deadline rejection and unresolved outcome; client success events alone not authoritative.

**Suggested implementation subtasks**

- **S44.1:** Configure telemetry, dashboards and alert routing.
- **S44.2:** Implement authenticated probes with isolated synthetic identity.
- **S44.3:** Rehearse failure notification and evidence capture.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S45 — Back up and rehearse consistent database/file restoration

**As a service owner, I want to recover confirmed academic work with correct access, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E13 — Release, recovery and service handover |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | L |
| Owner role | Release/service owner; actual assignee pending |
| Components | Database, CI/CD, QA |
| Depends on | S04, S17, S22, S28, S31, S44 |
| Readiness gate | DEC-13 RPO/RTO; DEC-14 retention/keys |
| PRD requirements | REQ-OPS-003, NFR-05 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S45-AC1:** Recoverable checkpoint includes database and every referenced immutable file version with key access.
2. **S45-AC2:** Isolated restore verifies selected attempts/files, published pointers, membership, audit and safe job replay.
3. **S45-AC3:** Revoke restored sessions/evidence before opening and record actual loss window/elapsed recovery time.
4. **S45-AC4:** ProposedRPO<=24h/RTO<=4h verified or revised/approved; failed backup age alerts before target breach.

**Suggested implementation subtasks**

- **S45.1:** Implement backup/manifest/retention safeguards.
- **S45.2:** Run isolated end-to-end restore and access checks.
- **S45.3:** Publish rehearsal evidence and incident recovery instructions.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S46 — Create traceable build, migration and rollout pipeline

**As a release engineer, I want to deploy a reviewed artifact without losing accepted work, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E13 — Release, recovery and service handover |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Release/service owner; actual assignee pending |
| Components | CI/CD, Documentation |
| Depends on | S02, S03, S04, S40 |
| Readiness gate | Repository/CI/environment approval |
| PRD requirements | REQ-OPS-001 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S46-AC1:** Build once with source/artifact/contract/schema/config identity and promote same artifact through UAT.
2. **S46-AC2:** Single migration runner uses expand-compatible-backfill-contract pattern; checksum drift rejects.
3. **S46-AC3:** API/worker event compatibility and draining/lease recovery are rehearsed.
4. **S46-AC4:** Code rollback retains valid new academic writes; database disaster restore is separate, not routine rollback.

**Suggested implementation subtasks**

- **S46.1:** Implement pipeline and immutable artifact packaging.
- **S46.2:** Add migration prechecks and safe release smoke task.
- **S46.3:** Rehearse compatible rollback and document triggers.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S47 — Complete integrated UAT and pilot release acceptance

**As a product owner, I want to accept a named build with complete student and staff journeys, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E13 — Release, recovery and service handover |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Release/service owner; actual assignee pending |
| Components | QA, Documentation |
| Depends on | S19, S23, S25, S29, S32, S35, S36, S37, S38, S39, S40, S41, S42, S43, S45, S46 |
| Readiness gate | All release-relevant decisions and critical/high blockers resolved |
| PRD requirements | Governance/integrated acceptance; brief and release gates |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S47-AC1:** PRD UAT-01–11 and applicable UX-AC/SDD-T/DB-AC evidence are tied to same candidate build.
2. **S47-AC2:** School users complete setup, materials, submission/replay, review, results, attendance and notices without developer DB edits.
3. **S47-AC3:** Critical/high release blockers are resolved or failing scope explicitly removed and reapproved; workaround acceptance records owner.
4. **S47-AC4:** Approval, scope, known limitations, migration/restore/rollback and smoke plans are recorded; acceptance alone does not claim production deployed.

**Suggested implementation subtasks**

- **S47.1:** Run integrated role journeys and reconcile open defects.
- **S47.2:** Collect academic/product/QA/release acceptance.
- **S47.3:** Create go/no-go record for named candidate.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

### S48 — Hand over support and run controlled pilot deployment

**As a release and service owner, I want to operate the accepted pilot with recovery responsibility, so the corresponding epic outcome can be delivered and verified.**

| Field | Value |
|---|---|
| Issue type | Task |
| Parent epic | E13 — Release, recovery and service handover |
| Scope/priority | MVP required; delivery order follows dependencies |
| Suggested refinement size | M |
| Owner role | Release/service owner; actual assignee pending |
| Components | CI/CD, Documentation |
| Depends on | S44, S45, S46, S47 |
| Readiness gate | Actual deployment authorization and named service owner |
| PRD requirements | REQ-OPS-004 |
| API operations | No dedicated public API operation; shared infrastructure, UI composition or verification work |

**Acceptance criteria**

1. **S48-AC1:** Support channel, hours, severity handling, escalation/runbook and maintenance owner are configured and handed over.
2. **S48-AC2:** Authorized deployment uses accepted artifact/config with backup/readiness prechecks and isolated authenticated smoke tests.
3. **S48-AC3:** Monitoring, permissions and controlled receipt/download/publication checks pass after rollout; unexpected failure follows agreed rollback/incident trigger.
4. **S48-AC4:** Pilot activity and uncertain outcomes reviewed with school owners; no wider audience expansion is implied.

**Suggested implementation subtasks**

- **S48.1:** Complete service training/contact and runbook handover.
- **S48.2:** Execute authorized pilot rollout and record post-deploy evidence.
- **S48.3:** Review early support/reliability and approved follow-up work.

**Completion evidence:** reviewed source/contract/migration changes as applicable, named test run/build, acceptance results, permission/error-state checks and any remaining approved limitation. No screenshot alone proves a committed academic transaction.

## 7. Requirement coverage matrix

Every requirement below has at least one primary delivery item. Shared authorization/UI/reliability expectations additionally apply to all relevant stories, even where not repeated in the list. A mapped ID does not mean implementation or testing has already passed.

| Requirement | Delivery items |
|---|---|
| NFR-01 | S42 |
| NFR-02 | S42 |
| NFR-03 | S42 |
| NFR-04 | S44 |
| NFR-05 | S45 |
| NFR-06 | S04, S05, S22 |
| NFR-07 | S10, S43 |
| NFR-08 | S41 |
| NFR-09 | S33, S44 |
| NFR-10 | S06, S43 |
| NFR-11 | S02, S43 |
| NFR-12 | S03, S40 |
| REQ-ADM-001 | S11 |
| REQ-ADM-002 | S11 |
| REQ-ADM-003 | S12 |
| REQ-ADM-004 | S12 |
| REQ-ADM-005 | S07 |
| REQ-ADM-006 | S39 |
| REQ-ASG-001 | S20 |
| REQ-ASG-002 | S20 |
| REQ-ASG-003 | S20 |
| REQ-ASG-004 | S20 |
| REQ-ASG-005 | S21 |
| REQ-ASG-006 | S21, S23 |
| REQ-ASG-007 | S22 |
| REQ-ASG-008 | S05, S22, S23 |
| REQ-ASG-009 | S23, S25 |
| REQ-ASG-010 | S24 |
| REQ-ASG-011 | S25 |
| REQ-ASG-012 | S25 |
| REQ-ATT-001 | S30 |
| REQ-ATT-002 | S30 |
| REQ-ATT-003 | S32 |
| REQ-ATT-004 | S31 |
| REQ-ATT-005 | S31 |
| REQ-AUD-001 | S04, S06 |
| REQ-AUD-002 | S38 |
| REQ-AUTH-001 | S07 |
| REQ-AUTH-002 | S08 |
| REQ-AUTH-003 | S08 |
| REQ-AUTH-004 | S09 |
| REQ-AUTH-005 | S08 |
| REQ-AUTH-006 | S09 |
| REQ-CLS-001 | S14 |
| REQ-CLS-002 | S14 |
| REQ-CLS-003 | S13 |
| REQ-CLS-004 | S13 |
| REQ-DATA-001 | S39 |
| REQ-DATA-002 | S02 |
| REQ-FILE-001 | S15 |
| REQ-FILE-002 | S15 |
| REQ-FILE-003 | S17 |
| REQ-FILE-004 | S17 |
| REQ-HOME-001 | S36 |
| REQ-HOME-002 | S36 |
| REQ-HOME-003 | S36 |
| REQ-MAT-001 | S18 |
| REQ-MAT-002 | S19 |
| REQ-MAT-003 | S18 |
| REQ-NOT-001 | S34 |
| REQ-NOT-002 | S33 |
| REQ-NOT-003 | S33, S35 |
| REQ-NOT-004 | S35 |
| REQ-NOT-005 | S34 |
| REQ-OPS-001 | S46 |
| REQ-OPS-002 | S06, S44 |
| REQ-OPS-003 | S45 |
| REQ-OPS-004 | S48 |
| REQ-PERM-001 | S10 |
| REQ-PERM-002 | S10 |
| REQ-PERM-003 | S10 |
| REQ-PRO-001 | S37 |
| REQ-PRO-002 | S37 |
| REQ-PRO-003 | S37 |
| REQ-RES-001 | S26 |
| REQ-RES-002 | S27 |
| REQ-RES-003 | S27, S28 |
| REQ-RES-004 | S28 |
| REQ-RES-005 | S29 |
| REQ-RES-006 | S29 |
| REQ-RES-007 | S28 |
| REQ-UX-001 | S03, S16 |
| REQ-UX-002 | S16 |
| REQ-UX-003 | S16 |
| REQ-UX-004 | S05, S16, S23 |
| REQ-UX-005 | S05, S40 |
| REQ-UX-006 | S16, S41 |

## 8. OpenAPI operation ownership

One primary delivery owner is assigned to every operation in the current contract. Dependencies supply shared security, schema, transaction, UI and worker behavior. Paths below are relative to proposed `/api/v1`; they are not deployed URLs. This mapping must be regenerated/reviewed whenever `06_openapi.yaml` changes.

| Operation ID | Method and path | Primary item |
|---|---|---|
| lookupOriginalOperation | `POST /operations/lookup` | S05 |
| createGrant | `POST /staff/grants` | S07 |
| createUser | `POST /staff/users` | S07 |
| getUser | `GET /staff/users/{user_id}` | S07 |
| listGrants | `GET /staff/grants` | S07 |
| listUsers | `GET /staff/users` | S07 |
| revokeGrant | `POST /staff/grants/{grant_id}/revoke` | S07 |
| updateUser | `PUT /staff/users/{user_id}` | S07 |
| bootstrapCsrf | `GET /auth/csrf` | S08 |
| getSession | `GET /me/session` | S08 |
| logout | `POST /auth/logout` | S08 |
| signIn | `POST /auth/login` | S08 |
| completeActivation | `POST /auth/activation/complete` | S09 |
| completeRecovery | `POST /auth/recovery/complete` | S09 |
| disableUser | `POST /staff/users/{user_id}/disable` | S09 |
| issueActivation | `POST /staff/users/{user_id}/activation` | S09 |
| requestRecovery | `POST /auth/recovery/requests` | S09 |
| staffArchiveAcademicYear | `POST /staff/academic-years/{academic_year_id}/archive` | S11 |
| staffArchiveClass | `POST /staff/classes/{class_id}/archive` | S11 |
| staffArchiveSubject | `POST /staff/subjects/{subject_id}/archive` | S11 |
| staffArchiveTerm | `POST /staff/terms/{term_id}/archive` | S11 |
| staffCreateAcademicYear | `POST /staff/academic-years` | S11 |
| staffCreateClass | `POST /staff/classes` | S11 |
| staffCreateSubject | `POST /staff/subjects` | S11 |
| staffCreateTerm | `POST /staff/terms` | S11 |
| staffGetAcademicYear | `GET /staff/academic-years/{academic_year_id}` | S11 |
| staffGetClass | `GET /staff/classes/{class_id}` | S11 |
| staffGetSubject | `GET /staff/subjects/{subject_id}` | S11 |
| staffGetTerm | `GET /staff/terms/{term_id}` | S11 |
| staffListAcademicYear | `GET /staff/academic-years` | S11 |
| staffListClass | `GET /staff/classes` | S11 |
| staffListSubject | `GET /staff/subjects` | S11 |
| staffListTerm | `GET /staff/terms` | S11 |
| staffUpdateAcademicYear | `PUT /staff/academic-years/{academic_year_id}` | S11 |
| staffUpdateClass | `PUT /staff/classes/{class_id}` | S11 |
| staffUpdateSubject | `PUT /staff/subjects/{subject_id}` | S11 |
| staffUpdateTerm | `PUT /staff/terms/{term_id}` | S11 |
| changeEnrollment | `PUT /staff/enrollments/{enrollment_id}` | S12 |
| createEnrollments | `POST /staff/classes/{class_id}/enrollments` | S12 |
| createTeachers | `POST /staff/classes/{class_id}/teachers` | S12 |
| endTeacherAssignment | `POST /staff/teacher-assignments/{teacher_assignment_id}/end` | S12 |
| listEnrollments | `GET /staff/classes/{class_id}/enrollments` | S12 |
| listTeachers | `GET /staff/classes/{class_id}/teachers` | S12 |
| cancelSession | `POST /staff/sessions/{session_id}/cancel` | S13 |
| staffCreateSession | `POST /staff/classes/{class_id}/sessions` | S13 |
| staffListSessions | `GET /staff/classes/{class_id}/sessions` | S13 |
| staffUpdateSession | `PUT /staff/sessions/{session_id}` | S13 |
| getClass | `GET /classes/{class_id}` | S14 |
| getClassSession | `GET /sessions/{session_id}` | S14 |
| listAccessibleTerms | `GET /terms` | S14 |
| listClassSessions | `GET /classes/{class_id}/sessions` | S14 |
| listClasses | `GET /classes` | S14 |
| completeUpload | `POST /uploads/{upload_id}/complete` | S15 |
| createUpload | `POST /uploads` | S15 |
| getUpload | `GET /uploads/{upload_id}` | S15 |
| putUploadBytes | `PUT /uploads/{upload_id}/content` | S15 |
| retryUploadCheck | `POST /uploads/{upload_id}/retry-check` | S15 |
| cancelUpload | `POST /uploads/{upload_id}/cancel` | S17 |
| downloadAuthorizedFile | `GET /file-references/{file_reference_id}/content` | S17 |
| historyMaterials | `GET /staff/materials/{material_id}/history` | S18 |
| staffArchiveMaterials | `POST /staff/materials/{material_id}/archive` | S18 |
| staffCreateMaterials | `POST /staff/classes/{class_id}/materials` | S18 |
| staffGetMaterials | `GET /staff/materials/{material_id}` | S18 |
| staffListMaterials | `GET /staff/classes/{class_id}/materials` | S18 |
| staffPublishMaterials | `POST /staff/materials/{material_id}/publish` | S18 |
| staffReplaceMaterials | `PUT /staff/materials/{material_id}` | S18 |
| getMaterial | `GET /materials/{material_id}` | S19 |
| listMaterials | `GET /classes/{class_id}/materials` | S19 |
| historyAssignments | `GET /staff/assignments/{assignment_id}/history` | S20 |
| staffArchiveAssignments | `POST /staff/assignments/{assignment_id}/archive` | S20 |
| staffCreateAssignments | `POST /staff/classes/{class_id}/assignments` | S20 |
| staffGetAssignments | `GET /staff/assignments/{assignment_id}` | S20 |
| staffListAssignments | `GET /staff/classes/{class_id}/assignments` | S20 |
| staffPublishAssignments | `POST /staff/assignments/{assignment_id}/publish` | S20 |
| staffReplaceAssignments | `PUT /staff/assignments/{assignment_id}` | S20 |
| getAssignment | `GET /assignments/{assignment_id}` | S21 |
| listAssignments | `GET /assignments` | S21 |
| submitAssignment | `POST /assignments/{assignment_id}/submissions` | S22 |
| getOwnSubmission | `GET /me/submissions/{submission_id}` | S23 |
| listOwnSubmissions | `GET /me/submissions` | S23 |
| getStaffSubmission | `GET /staff/submissions/{submission_id}` | S24 |
| listStaffAttemptHistory | `GET /staff/assignments/{assignment_id}/students/{student_id}/attempts` | S24 |
| listSubmissionRoster | `GET /staff/assignments/{assignment_id}/submissions` | S24 |
| createFeedbackDraft | `POST /staff/submissions/{submission_id}/feedback` | S25 |
| getStaffFeedback | `GET /staff/submissions/{submission_id}/feedback` | S25 |
| historyFeedback | `GET /staff/feedback/{feedback_id}/history` | S25 |
| publishFeedback | `POST /staff/feedback/{feedback_id}/publish` | S25 |
| replaceFeedbackDraft | `PUT /staff/feedback/{feedback_id}` | S25 |
| addAssessmentEligibility | `POST /staff/assessments/{assessment_id}/eligibility` | S26 |
| cancelAssessment | `POST /staff/assessments/{assessment_id}/cancel` | S26 |
| listAssessmentEligibility | `GET /staff/assessments/{assessment_id}/eligibility` | S26 |
| staffArchiveAssessments | `POST /staff/assessments/{assessment_id}/archive` | S26 |
| staffCreateAssessments | `POST /staff/classes/{class_id}/assessments` | S26 |
| staffGetAssessments | `GET /staff/assessments/{assessment_id}` | S26 |
| staffListAssessments | `GET /staff/classes/{class_id}/assessments` | S26 |
| staffPublishAssessments | `POST /staff/assessments/{assessment_id}/publish` | S26 |
| staffReplaceAssessments | `PUT /staff/assessments/{assessment_id}` | S26 |
| updateEligibility | `PUT /staff/eligibility/{eligibility_id}` | S26 |
| createResultDraft | `POST /staff/assessments/{assessment_id}/results` | S27 |
| getStaffResult | `GET /staff/results/{result_id}` | S27 |
| listStaffResults | `GET /staff/assessments/{assessment_id}/results` | S27 |
| replaceResultDraft | `PUT /staff/results/{result_id}` | S27 |
| commitResultPublication | `POST /staff/result-publications` | S28 |
| getPublicationBatch | `GET /staff/result-publications/{batch_id}` | S28 |
| historyResults | `GET /staff/results/{result_id}/history` | S28 |
| previewResultPublication | `POST /staff/result-publications/preview` | S28 |
| getOwnResult | `GET /me/results/{result_id}` | S29 |
| listOwnResults | `GET /me/results` | S29 |
| finalizeAttendance | `POST /staff/sessions/{session_id}/attendance/finalize` | S30 |
| getAttendanceRoster | `GET /staff/sessions/{session_id}/attendance` | S30 |
| saveAttendanceDraft | `PUT /staff/sessions/{session_id}/attendance` | S30 |
| correctAttendance | `POST /staff/sessions/{session_id}/attendance/correct` | S31 |
| listReviewFlags | `GET /staff/review-flags` | S31 |
| resolveReviewFlag | `POST /staff/review-flags/{flag_id}/resolve` | S31 |
| listOwnAttendance | `GET /me/attendance` | S32 |
| historyNotices | `GET /staff/notices/{notice_id}/history` | S34 |
| staffArchiveNotice | `POST /staff/notices/{notice_id}/archive` | S34 |
| staffCreateNotice | `POST /staff/notices` | S34 |
| staffGetNotice | `GET /staff/notices/{notice_id}` | S34 |
| staffListNotices | `GET /staff/notices` | S34 |
| staffPublishNotice | `POST /staff/notices/{notice_id}/publish` | S34 |
| staffReplaceNotice | `PUT /staff/notices/{notice_id}` | S34 |
| getNotice | `GET /notices/{notice_id}` | S35 |
| getNotification | `GET /notifications/{notification_id}` | S35 |
| getUnreadCount | `GET /notifications/unread-count` | S35 |
| listNotices | `GET /notices` | S35 |
| listNotifications | `GET /notifications` | S35 |
| markNotificationRead | `POST /notifications/{notification_id}/read` | S35 |
| getDashboard | `GET /dashboard` | S36 |
| getExam | `GET /exams/{exam_id}` | S36 |
| listOwnSchedule | `GET /sessions` | S36 |
| getProfile | `GET /me` | S37 |
| getSupport | `GET /support` | S37 |
| updatePreferences | `PUT /me/preferences` | S37 |
| getAudit | `GET /staff/audit/{audit_id}` | S38 |
| listAudit | `GET /staff/audit` | S38 |

## 9. UAT and release-evidence ownership

| Source UAT | Delivery evidence owner | Required integrated outcome |
|---|---|---|
| UAT-01 | S07/S11/S12/S39, accepted through S47 | Admin prepares term/class/teacher/two students and rejects duplicates |
| UAT-02 | S14/S19/S36 | Student local-day schedule and authorized exact file |
| UAT-03 | S22/S23 | One persisted original attempt after response loss/replay/restart |
| UAT-04 | S10/S12/S20/S22/S25 | Deadline/late/attempt/withdrawal/archive boundaries |
| UAT-05 | S24/S25/S38 | Correct current-attempt feedback, draft privacy and audited correction |
| UAT-06 | S26–S29 | Result scoring fixtures and all-or-none publication |
| UAT-07 | S30–S32 | Finalized attendance/corrections, cancellation and coverage |
| UAT-08 | S33–S35 | Event audience/read state and membership changes |
| UAT-09 | S08/S16/S23/S37 | Permitted preferences and no shared-device leakage |
| UAT-10 | S10/S38/S43 | Complete negative action/resource matrix |
| UAT-11 | S39/S42/S44–S48 | Load, consistent restore, release rehearsal and service ownership |

Each technical case SDD-T01–20, DB-AC01–17 and applicable UX-AC01–26 must be attached to its implementing story and S47 evidence record. Use exact IDs from the source file in real tests; abbreviated ranges in this narrative are not newly created test-management records.

Release blockers include confirmed unauthorized access, data corruption/loss, false submission success, unresolved critical/high core-workflow failures, unapproved dependent school policy, and failed required recovery/performance gates. Any explicit scope removal needs product approval and amended acceptance/contract documentation; it cannot be hidden by changing an issue's priority or status.

## 10. Refinement, splitting and estimation

Refine in dependency order. First approve S01 decisions and S03 contract gaps. For each item, confirm actual component owners, design nodes if available, operation/table changes, known failure states, verification fixtures, and team estimate. Identify cross-module locks and affected publication paths before parallel development begins.

Suggested subtasks are implementation hints, not individually estimated commitments. Do not add parent and subtask estimates together and present the sum as capacity. The team chooses its estimation method and adjusts L items into independently reviewable slices. Use a spike only for a concrete unanswered question, with bounded output and decision—not as a substitute for implementing a requirement.

No sprint length, team velocity, start date, finish date or total cost is supplied. Create a delivery forecast only after named staffing, estimates, holidays/support load, decision gates and integration/review time are known. Do not convert these 48 items directly into 48 days.

## 11. Conditional follow-up register

| Candidate | Current disposition | Trigger to add a separate story |
|---|---|---|
| Student classmate directory | Hidden | School privacy/visibility approval and revised permission matrix |
| Profile photos | Absent | Approved storage/content/identity UX and effort |
| Native client authentication | Deferred in current browser contract | Approved platform and transport/session contract |
| Device-calendar/reminders | Absent | Defined action meaning, permissions and delivery responsibility |
| General push/email/SMS | In-app only | Channel/provider/audience/retry/opt-in policy and budget |
| Automated initial import | Manual supported setup included | Approved source/scale, preview/row errors and reconciliation scope |
| External school integration | Deferred | Source contract, access, ownership and reconciliation rules |
| Multi-institution onboarding | Deferred | Explicit tenancy/onboarding/support design |
| Parent portal/payments/chat/online exams | Outside MVP | Separate approved product scope |

Account recovery remains required through the selected school method; do not defer it merely because general email notifications are deferred. Conditional backlog entries have no acceptance or estimate claim until refined and approved.

## 12. Safe Jira creation and ongoing maintenance

This Markdown file is the deliverable. The user has not requested creation in a connected Jira project. When that is requested, first resolve the actual project, supported issue types/hierarchy, field mapping, permissions and any existing planning-ID matches. Avoid duplicate creation on retries; store returned Jira keys beside the planning IDs.

Create epics first, then stories/tasks with real parent keys, then agreed subtasks, then dependency links. Verify every item created and reconcile partial failures before retrying. Do not send invitations, messages or assign named people merely because a role is listed here. Use existing authorized assignees only after the intended people are resolved.

A later source change must identify affected requirements, operation IDs, stories, acceptance criteria, tests, estimates and release scope. Preserve completed evidence and create explicit follow-up correction work when needed. A changed API path cannot remain mapped to an obsolete issue without review.

## 13. Validation and sign-off

Preparation checks: every current numbered PRD requirement/NFR is covered; every OpenAPI operation has one primary owner; dependency IDs exist and graph is acyclic; every child has four concrete acceptance criteria and three suggested subtasks; all epic parent memberships match. These are document consistency checks, not application/UAT or Jira-service tests.

| Reviewer | Focus | Status |
|---|---|---|
| Product/delivery owner | MVP scope, priorities, splitting and forecast | Pending named reviewer |
| Academic authority | Deadline, grading, attendance and publication rules | Pending named reviewer |
| Technical/database lead | Dependencies, transaction/file invariants and stack readiness | Pending named reviewer |
| Design/client lead | Screen/state/accessibility completion | Pending named reviewer |
| QA lead | Requirement/operation coverage and fixtures | Pending named reviewer |
| Release/service owner | Recovery, deployment and support evidence | Pending named reviewer |

| Version | Date | Change |
|---|---|---|
|0.1|10 September 2026|Complete proposed Jira delivery backlog aligned to documents 01–07; epics, stories/tasks, subtasks, acceptance criteria, dependency and requirement/API traceability|

Companion sources: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml), [07_developer_guide.md](07_developer_guide.md).
