---
title: "11 — Release Plan"
---

# 11 — Release Plan

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-11 |
| Version | 0.1 — complete release planning draft |
| Date | 11 September 2026 |
| Accountable owner | Release/service owner — named person pending |
| Baseline | Documents 02–10; PRD UAT-01–11; backlog S46–S48 |
| Intended release | First controlled school pilot, followed by approved cohort expansion |
| Candidate / production environment | Not supplied |
| Execution state | NOT STARTED |
| Release decision | PENDING — no deployment or approval recorded |

This plan defines the evidence, responsibilities, sequence and recovery decisions needed to promote an accepted candidate into a controlled pilot. It does not certify a running application or authorize deployment. Actual dates, participants, infrastructure, repository commands and approvals must be recorded for the selected environment before execution.

## 1. Release objective and scope

Deliver the approved student learning workflows: institution-managed sign-in; enrolled classes and schedules; protected materials; durable assignment submission and published feedback; published assessment results; finalized attendance; profile/preferences; notices and in-app notifications. Supporting staff workflows include account/academic setup, dated enrollment, assignment/material publication, submission review, results/attendance publication and correction, and authorized audit access.

The release succeeds when the named candidate meets business and technical gates, production smoke checks pass, the approved pilot cohort can use it, and service ownership is active. Deployment completion alone is insufficient. A rollout may pause or roll back after deployment if verification fails.

Deferred scope remains absent or disabled: online examinations, payments, chat, guardian accounts, public student directories, unsupported calendar/reminder behavior, unapproved native authentication, and general push/email/SMS channels. Account recovery uses the explicitly selected approved method. Do not enable optional features merely because code exists.

Release-critical invariants:

- Current authorization is enforced for every protected operation and file reference.
- A confirmed submission retains its identity, authoritative time, exact file versions and history across retries, restarts and compatible rollback.
- Lost transport responses remain uncertain until reconciled; clients do not invent confirmation or a second operation.
- Draft academic records remain private; publications and corrections preserve their approved visibility, atomicity and audit rules.
- Result and attendance calculations use the approved policy, with missing coverage clearly labeled.
- Worker recovery preserves deduplication, event-time recipients and current read authorization.
- Restoring data must not revive revoked sessions or discard acknowledged academic work without an explicit incident reconciliation process.

## 2. Authority, dependencies and unresolved decisions

The PRD controls business scope and policy; UX controls user states; SDD/database/API control the agreed implementation contract; the developer guide controls handoff expectations; the test plan controls technical evidence; the UAT checklist controls business acceptance. Resolve contradictions before affected release steps.

| Decision set | Required resolution | Accountable role | Gate |
|---|---|---|---|
| DEC-01/04/15 | Institution, sponsor, eligible pilot cohort, pilot evaluation window and measures | Product/school owner | Pilot approval |
| DEC-02/03 | Supported clients, languages and school timezone | Product/design and school | Candidate acceptance |
| DEC-05/08 | Identity/recovery, explicit grants, withdrawal and own-history access | School and security | Auth/access verification |
| DEC-06/07 | Submission windows/attempts, feedback, results and attendance rules | Academic authority | Academic acceptance |
| DEC-09/14 | Initial data source, reconciliation, access, retention and lifecycle | Data/school owner | Real-data onboarding |
| DEC-10 | Repository, selected stack/providers, deployment topology and secure configuration | Technical lead | Environment rehearsal |
| DEC-11 | Notification channels and disabled optional features | Product owner | Scope freeze |
| DEC-12/13 | Staff coverage, support hours, window, capacity, SLO and recovery targets | Sponsor/service owner | Go/no-go |

No provider-specific command is fabricated in this plan. Section 8 requires exact reviewed scripts or pipeline references from the selected implementation. An unresolved required command, owner, threshold or policy is a NO-GO condition for its dependent stage.

## 3. Roles and decision rights

| Role | Responsibility | Decision right / required presence |
|---|---|---|
| Release commander | Coordinates timeline, evidence, stage transitions and incident handoff | Records go/no-go; can halt rollout |
| School product owner | Confirms scope, cohort, business acceptance and user communication | Accepts scope and nonblocking business issues |
| Academic authority | Confirms academic rules and deadline impact | Approves school handling of interrupted academic activity |
| QA/UAT lead | Verifies named-candidate evidence and smoke results | Rejects unsupported PASS claims; recommends gate outcome |
| Technical lead | Confirms artifact, compatibility, application and worker health | Selects compatible rollback or forward repair with commander |
| Database/data owner | Migration, backup, consistency and reconciliation | Validates data operations and recoverable point |
| Security reviewer | Identity, grants, secrets and exposure assessment | Requires containment and resolution of access/integrity findings |
| Operator | Executes approved pipeline/runbook steps | Stops on unexpected state; records actual outputs |
| Service/support owner | Alerts, intake, escalation and hypercare | Accepts operational handover |
| Communications owner | Prepares audience-specific updates | Sends only through the approved communication process |

Assign one named primary and backup for each operational role, with an actual contact route and coverage window. One person may hold multiple roles in a small team, but an independent reviewer must verify critical migration/recovery and release evidence. Any participant may report a stop condition; absence of a decision owner means hold, not implicit approval.

## 4. Release record and immutable package

Complete the release record before the go/no-go meeting.

| Required field | Recorded value |
|---|---|
| Release ID / candidate version / source commit | Pending |
| Build artifact digest and approved artifact location | Pending |
| Frontend, API, worker and migration artifact versions | Pending |
| API specification and database schema/migration versions | Pending |
| Production configuration revision and secret-version references | Pending; no secret values in this record |
| Feature/cohort flags and supported-client minimum version | Pending |
| Previous compatible artifact/configuration and rollback evidence | Pending; first-launch fallback may be maintenance |
| Dependency lockfile/build provenance and security review | Pending |
| Production topology, endpoints and responsible operators | Pending |
| UAT run ID, accepted scope and sign-off record | Pending |
| Technical evidence index and accepted defects | Pending |
| Backup/checkpoint ID, object-version manifest and restore rehearsal | Pending |
| Maintenance/write-pause mode and approved window | Pending |
| Pilot cohort roster and access control revision | Pending |
| Monitoring dashboard, alerts and support route | Pending |
| Go/no-go, rollback and recovery decision owners | Pending |

Build once from the reviewed source and locked dependencies. Promote the tested artifact; do not rebuild a different candidate during production deployment. Environment-specific configuration is versioned separately and reviewed against UAT differences. A material configuration or artifact change requires impact review and renewed relevant evidence.

Retain the release package: release notes, artifact/digests, migrations, approved execution scripts, compatibility matrix, baseline configuration references, smoke fixtures, test/UAT results, known issues, backup/restore evidence, support instructions and decision log. Store credentials in the approved secret system, not in the package or logs.

## 5. Gates and relative schedule

Dates below are planning anchors relative to the approved deployment window, not committed calendar dates. Choose a low-impact window that avoids assignment deadlines, attendance finalization and result publication periods. If no suitable window exists, the school must explicitly accept the disruption plan.

| Stage | Work | Owner | Exit evidence |
|---|---|---|---|
| G0 — Baseline | Resolve scope/policies, environment choices, owners and pilot cohort | Product/technical | Approved decisions and release record |
| G1 — Candidate | Freeze candidate; complete CI, QA and compatibility review | Technical/QA | Immutable package and passing required tests |
| G2 — Business acceptance | Complete UAT-01–11 and required variants | School/QA | Accepted named-candidate UAT record |
| G3 — Rehearsal | Deploy, migrate, smoke, rollback and restore in isolated environment | Operator/database | Timed rehearsal and recovery evidence |
| G4 — Preflight | Verify production state, backup freshness, alerts and staffing | Release commander | Signed go/no-go and completed preflight |
| G5 — Restricted production | Deploy behind pilot access controls and run smoke | Operator/QA | Production smoke and healthy telemetry |
| G6 — Pilot | Enable only approved cohort; observe representative real use | Product/service | Cohort gate and issue review |
| G7 — Expansion | Expand by separately approved cohort increments | Release commander | Healthy observation and renewed decision |
| G8 — Handover | Close hypercare and transfer routine service ownership | Service/product | Accepted handover and release closure |

Suggested sequencing: finish G1–G3 before scheduling the window; reconfirm G4 shortly before the window; complete G5 before enabling pilot users. Define G6/G7 observation duration and minimum representative traffic before rollout. Passage of time without relevant usage is not evidence of readiness.

## 6. Go/no-go checklist

Every required item must be PASS with evidence. NOT RUN, BLOCKED or missing evidence means hold. Minor accepted issues must have an owner, workaround and follow-up date.

- [ ] REL-01: Candidate/digests/configuration and environment are identified and match accepted evidence.
- [ ] REL-02: Required policy decisions, pilot scope, support hours and named primary/backup owners are approved.
- [ ] REL-03: PRD Must requirements, 11 UAT journeys and applicable variants are accepted under `10_uat_checklist.md`.
- [ ] REL-04: Required QA, contract, database, file, worker, security and accessibility evidence is complete for the candidate.
- [ ] REL-05: No unresolved Critical/High blocker or confirmed disclosure/integrity issue remains in release scope.
- [ ] REL-06: Accepted Medium/Low defects have product/QA/release approval and a viable workaround.
- [ ] REL-07: Approved load/performance and recovery targets passed on the declared profile; production differences are assessed.
- [ ] REL-08: Migration, worker/event and old/new application compatibility is demonstrated, with a rehearsed fallback.
- [ ] REL-09: Production backup is fresh and recoverable with referenced object versions and required key access.
- [ ] REL-10: Initial data, roles, memberships and publication grants are reconciled and approved.
- [ ] REL-11: Production configuration, private file access, scanner, recovery provider and secret injection are verified.
- [ ] REL-12: Smoke accounts/fixtures are isolated from real academic statistics and unintended audiences.
- [ ] REL-13: Dashboards, alerts, synthetic probes, logs and escalation routes work.
- [ ] REL-14: Stage durations, observation criteria, numeric alert thresholds, stop triggers and latest safe rollback decision time are recorded.
- [ ] REL-15: User communication drafts, support guidance and deadline disruption process are approved.
- [ ] REL-16: Named release authority records GO for the exact candidate, cohort and window.

Critical/High blockers are fixed or removed through a genuine approved scope change that eliminates the failing journey and updates dependent specifications. A risk waiver does not make an exposed record or lost confirmed submission acceptable. A scope removal cannot conceal a remaining exposure/integrity incident.

## 7. Environment, configuration and data preflight

| Area | Verification | Evidence / failure action |
|---|---|---|
| Environment identity | Operator confirms production target and expected account/project identifiers | Target verification; stop on mismatch |
| Edge/network | Approved hostnames, TLS, origin/routing policy and private admin access work | Connectivity/routing check; no public pilot bypass |
| Runtime | Resources, process health, time synchronization and school timezone config match baseline | Config diff and readiness checks |
| Identity | Cookie/session, CSRF, recovery, revocation and privileged grants match approved policy | Nonsecret configuration review and synthetic check |
| Database | Version/migration state, space, connection limits and role privileges are expected | Read-only state report; stop on drift |
| Files | Private storage, exact-version access, scanner and retention support confirmed references | Synthetic upload/download; retention/key access review |
| Workers | Event schema support, leases/fencing, retry settings and queue visibility are ready | Compatibility and backlog report |
| Observability | Request correlation, redaction, alerts and audit access are configured | Controlled alert and access review |
| Backup | DB checkpoint and object versions recover together; freshness alert works | Backup IDs, manifest and latest restore evidence |
| Pilot data | Counts, sample values, enrollment dates, teacher/publisher grants reconcile | Signed data reconciliation |
| Client | Correct asset/config versions and safe authenticated-cache behavior | Login/logout, version and cache smoke |

Use supported staff setup workflows for initial data unless a separately approved import implementation exists. The baseline does not assume a bulk import tool. Do not populate production with unreviewed test seeds or default passwords. Disable/remove temporary access through supported lifecycle controls after use while retaining required audit evidence.

Record opening counts and identifiers needed for later reconciliation: active pilot identities, classes, memberships, confirmed attempts, published revisions, attendance coverage, pending operations and outbox backlog. Store only necessary restricted evidence; avoid exporting student work to deployment logs.

## 8. Implementation-specific command worksheet

Fill this worksheet from the actual repository/pipeline after the stack is selected. Each reference must name an exact reviewed job/script revision, environment binding, expected result, timeout and recovery action. These are required implementation deliverables, not runnable commands in this document.

| Action ID | Exact job/script reference | Required guard and expected outcome | Owner |
|---|---|---|---|
| CMD-01 | Pending: verify artifact/configuration | Digest matches release record; no unapproved drift | Operator |
| CMD-02 | Pending: restrict cohort / pause writes | Server-side enforcement verified; in-flight commands handled explicitly | Technical |
| CMD-03 | Pending: checkpoint / backup manifest | Recoverable DB point and all referenced object versions identified | Database |
| CMD-04 | Pending: migration runner | Single runner; expected starting version; bounded lock/runtime | Database |
| CMD-05 | Pending: deploy API/client | Exact approved artifacts and configuration revision | Operator |
| CMD-06 | Pending: drain/deploy/resume worker | Compatible events; lease/fencing rules preserved | Technical |
| CMD-07 | Pending: health and smoke verification | Actual pass/fail results attached to release ID | QA |
| CMD-08 | Pending: enable next cohort | Approved IDs/size only; control verified on backend | Operator |
| CMD-09 | Pending: compatible code/config rollback | Prior artifact supports current data/events; accepted writes retained | Technical |
| CMD-10 | Pending: restore and reconcile | Isolated recovery, credential revocation and integrity checks before reopen | Database/security |

Complete this worksheet and rehearse the same jobs before G4. A manual console fallback must also be reviewed and recorded, including how partial execution is detected; improvising a migration in the release window is not an approved fallback.

## 9. Migration and compatibility strategy

Prefer additive, compatible changes for the pilot release. Separate destructive cleanup from initial rollout and schedule it only after the rollback window and explicit review. Existing accepted records and exact file references must remain readable by the fallback path.

| Relationship | Required proof before rollout |
|---|---|
| Prior app on expanded schema | Reads/writes supported without losing newly accepted data |
| Candidate app on target schema | Required features, constraints and transaction guards pass |
| Old/new worker on retained events | Event payload/version support and idempotent handling demonstrated |
| Old/new client against deployed API | Supported client behavior or controlled update path is clear |
| Fallback config with current secrets | No revoked credential is re-enabled by reverting a config file |
| Restored DB and object manifest | Referenced exact bytes and security state can be recovered |

Migration procedure:

1. Review every migration for lock duration, table size, data transformation, constraints and reversibility. Mark irreversible steps explicitly.
2. Rehearse against a representative dataset; record runtime, lock wait and rollback/forward-repair behavior.
3. Verify starting schema and absence of another runner. Obtain the approved migration lock using the implementation’s mechanism.
4. Pause incompatible new writes/worker claims when required. Drain in-flight transactions to a known outcome; reconcile ambiguous operations using their original keys.
5. Capture the recoverable checkpoint and manifest at the required quiescence boundary.
6. Run the approved migration once; record actual versions, timestamps and output. On failure, inspect committed state before any retry.
7. Run schema/invariant checks and reconcile transformed row counts. Do not assume a failed migration rolled back every statement.
8. Deploy compatible application/worker artifacts in the rehearsed order and validate before reopening writes.

Long backfills need bounded batches, progress tracking, resumability and validation. Do not hold long external calls under academic transaction locks. Do not disable immutable-history constraints or remove confirmed records to make a migration pass.

For an incompatible change, approve a dedicated stop-write window and forward-repair or recovery procedure. Rolling old code onto an incompatible schema is not a valid rollback. For the first launch with no compatible previous application, the safe fallback may be a maintenance/unavailable state while retaining the new database and uploaded files.

## 10. Production execution sequence

Each step records executor, start/end time, release ID, evidence, outcome and next decision. Stop on unexpected state. Run this only within the separately authorized production workflow.

| Step | Action | Verification before continuing | Failure response |
|---|---|---|---|
| DEP-01 | Open release coordination channel; confirm owners and GO | Candidate, environment, window and contact routes match record | Hold |
| DEP-02 | Capture service/data/queue baseline and verify alerts | Current health and known issues understood | Investigate or postpone |
| DEP-03 | Enforce restricted access or write pause per topology | Unapproved users cannot enter; in-flight work drained/reconciled | Contain; do not migrate yet |
| DEP-04 | Capture/verify recoverable checkpoint and file manifest | Freshness, completeness and access meet target | NO-GO |
| DEP-05 | Run approved migration plan if applicable | Target schema and data invariants verified | Hold writes; inspect partial state |
| DEP-06 | Deploy API/client and compatible configuration | Artifact digests and readiness match | Compatible rollback or forward repair |
| DEP-07 | Deploy/resume compatible workers in rehearsed order | Valid leases, event handling and bounded backlog | Pause claims; inspect without deleting events |
| DEP-08 | Run restricted production smoke checks | All required SMK checks pass | Keep cohort closed; triage |
| DEP-09 | Observe restricted service metrics | No stop trigger; expected activity and measurements available | Hold or roll back |
| DEP-10 | Enable first approved pilot cohort | Actual membership/access matches roster | Revert cohort expansion |
| DEP-11 | Observe pilot usage and reconcile academic/worker effects | Health, correctness and support meet stage criteria | Halt expansion; contain failures |
| DEP-12 | Record expand/hold/rollback decision | Named reviewer accepts evidence | Default hold if uncertain |
| DEP-13 | Complete handover/closure after hypercare | Ownership, known issues and monitoring accepted | Continue hypercare |

A server-side cohort control is required for staged access; a hidden menu is insufficient. If the selected implementation lacks a safe staged-routing method, use a reviewed maintenance/restricted launch. Do not claim canary isolation when all users share the same unpartitioned process or when shared DB/worker changes affect everyone. Describe actual blast radius in the release record.

## 11. Production smoke checklist

Use dedicated approved synthetic identities, classes and files. Production smoke is deliberately narrow; destructive fault injection and full load testing belong in isolated environments. Each check records actual values and PASS/FAIL/BLOCKED, initially NOT RUN.

| ID | Check | Expected evidence |
|---|---|---|
| SMK-01 | Environment, build, configuration and health | Correct deployed versions; dependencies ready; no secret leakage in health output |
| SMK-02 | Synthetic student sign-in and protected access | Valid session; unauthorized request denied; session policy enforced |
| SMK-03 | Home, classes and local-day schedule | Only enrolled synthetic class; correct school date and known session |
| SMK-04 | Protected material upload/check/download | Validation reaches Ready; downloaded content/hash matches intended exact file |
| SMK-05 | Valid synthetic assignment submission | Durable receipt, expected sequence/time/status and exact file reference |
| SMK-06 | Identical replay and client restart | Same receipt/time; one confirmed attempt; history persists |
| SMK-07 | Draft and published feedback | Draft hidden; explicit publication visible on correct attempt; audit available |
| SMK-08 | Published result fixture | Correct published value/summary; draft and other-student values absent |
| SMK-09 | Finalized attendance fixture | Correct own history and percentage/coverage for known fixture |
| SMK-10 | Scoped notice, notification and read state | Intended synthetic audience only; one notification; persistent read/count |
| SMK-11 | Logout, Back/reload and second account | No prior student data from cache; protected access revoked as designed |
| SMK-12 | Restricted role and foreign record/file access | No unauthorized rows, counts, writes or bytes |
| SMK-13 | Worker, audit and alert telemetry | Expected event processed once; lag visible; correlation and redaction work |
| SMK-14 | Backup and recovery monitoring | Fresh checkpoint/file coverage reported; failure route and owner verified |

Do not notify real students with smoke notices or pollute real academic summaries. Use the approved retention/archive treatment for synthetic confirmed records; do not hard-delete immutable attempts to clean up. Record any retained fixture IDs for support and reporting exclusion. If safe smoke isolation is unavailable, resolve it before launch.

## 12. Pilot cohorts and expansion criteria

| Stage | Audience | Required observation | Decision |
|---|---|---|---|
| Restricted verification | Named operators and synthetic accounts | SMK-01–14 plus relevant telemetry | Open first cohort or hold |
| Pilot A | Small explicitly approved roster with assigned staff | Representative login, material access, submission and notification activity; support review | Expand or hold |
| Pilot B | Next approved classes/students | Same measures under larger traffic and class contention | Expand or hold |
| Full approved pilot | Entire approved pilot roster | Healthy service across agreed usage window and academic workflows | Exit hypercare or hold |

Record actual roster size, duration, minimum event/sample count and expansion approver for each stage before G4. Proposed cohort labels are not numerical commitments. Avoid percentage-only routing that gives different access to students and teachers who need the same class workflow.

An expansion requires no new Critical/High issue, passing smoke where affected, healthy thresholds, expected event completion, stable data reconciliation, available support capacity and reviewer approval. Low traffic extends observation or requires controlled synthetic evidence; it does not automatically pass. Keep background effects and shared-schema risk in the decision even when the client cohort is small.

## 13. Monitoring and stop conditions

Approve exact production alert values and sampling windows before G4. Existing test-plan targets remain proposals until DEC-13 approval: p95 metadata 1 second, dashboard 2 seconds, finalization 2 seconds after files are Ready; 95% eligible notifications visible within 60 seconds; RPO at most 24 hours and RTO at most 4 hours. Approved production resource/traffic differences must be declared.

| Signal | Measurement / dashboard | Stop or hold rule |
|---|---|---|
| Unauthorized disclosure or mutation | Access checks, incident reports, audit | Any confirmed occurrence: immediate containment and halt expansion |
| False confirmation, lost/duplicate accepted work | Receipt/attempt/file reconciliation | Any confirmed occurrence: stop affected writes and escalate |
| Draft leakage or partial publication | Synthetic checks and academic audit | Any confirmed occurrence: contain publication and escalate |
| Error rate and unavailable core journey | Per-route unexpected failures; synthetic probes | Approved threshold/window exceeded or core flow unavailable: hold; assess rollback |
| Metadata/dashboard/finalization latency | Per-operation p95 with sample counts and lock wait | Sustained approved breach: hold; inspect capacity/locks |
| Upload/scanner failures | Upload stage counts, age and Ready/rejected distribution | Stuck/failed stage beyond approved bound: hold affected workflow |
| Worker/event lag and duplicates | Oldest eligible event, retries, dead-letter/failure count | Threshold breach or duplicate effect: pause expansion; investigate |
| Database health | Connections, storage, locks, replication/backup if configured | Unsafe capacity/lock/freshness condition: hold or stop writes |
| Missing exact file version | Authorized retrieval and manifest reconciliation | Confirmed referenced-file loss: incident, not ordinary retry |
| Session/recovery anomalies | Revocation, recovery failure and authorization signals | Suspected bypass: security triage; confirmed bypass: containment |
| Support volume | Unique affected users, severity, unresolved age | Staffing limit or repeated core blocker: hold expansion |
| Monitoring blind spot | Missing probes/logs/metrics | Insufficient evidence: hold; do not infer health |

Separate expected business rejections, such as closed assignments, from unexpected system failures. Track unknown submission outcomes explicitly until reconciled. Measure notification latency from committed event to eligible visible record, not queue dequeue time. Retain denominators and observation windows alongside percentages.

The proposed 99.5% monthly availability measure requires the actual observation period, one-minute authenticated probes, maintenance inclusion and monitoring-gap reporting. A healthy release hour or short load test cannot prove monthly attainment.

## 14. Halt, rollback and forward-repair decision

The commander records the trigger, impact, current write state, selected action, owner and timestamp. Protect evidence and acknowledged data before changing state.

| Situation | Preferred response, subject to rehearsed compatibility |
|---|---|
| New UI/API regression, prior artifact supports current schema/data/events | Roll back compatible code/configuration; retain academic writes |
| Cohort-specific usability issue without integrity impact | Halt expansion; restrict affected feature/cohort if approved; fix and revalidate |
| Worker defect | Pause affected claims; retain events; deploy compatible fix/fallback; reconcile before replay |
| Partial/incompatible migration | Hold writes; inspect committed state; execute approved forward repair or incident recovery |
| Confirmed authorization leak | Contain access immediately, preserve evidence, investigate affected scope and follow incident process |
| Confirmed data corruption or missing objects | Stop affected writes/cleanup, preserve current state; consider separate recovery procedure |
| First launch with no compatible prior application | Keep maintenance/restricted state while repairing; do not invent a previous working release |

Compatible application rollback:

1. Halt cohort expansion and record the rollback decision against the trigger.
2. Restrict affected writes and drain/reconcile in-flight commands as required. Preserve original operation keys and receipts.
3. Verify fallback compatibility with the current schema, accepted data, event payloads and secret/security versions.
4. Deploy the known compatible artifact/configuration using CMD-09. Do not revert secret revocations or roll back the database just to undo code.
5. Resume only compatible worker claims with deduplication/fencing intact; retain pending events for reconciliation.
6. Run affected smoke checks, including confirmed receipt/file retrieval and access controls; compare data/queue counts before and after.
7. Reopen only the approved cohort when verification passes. Record degraded features, incident reference and user impact.

Set the latest safe rollback decision time from actual rehearsal duration, window constraints and staffed recovery capacity. If rollback cannot finish safely or compatibility is unproven, hold writes/access and use the approved forward-repair/incident route. Do not run destructive down-migrations by default.

## 15. Disaster recovery and academic reconciliation

Restoration is a separate incident decision because it can lose newer accepted changes. It is not the routine code rollback method. The database, exact object versions, keys, configuration and security state must be treated as one recovery dependency set.

1. Contain the incident and stop affected writers, worker claims and destructive cleanup. Preserve logs, current data and object manifests for investigation/reconciliation.
2. Identify the latest complete recoverable point and its missing-write interval. Document who may have received confirmation after that point.
3. Obtain the designated incident/recovery decision with the school/data owner informed of expected loss and recovery tradeoffs.
4. Restore in an isolated environment with outbound recipients restricted. Match the database recovery point to retained referenced object versions and required key access.
5. Revoke restored sessions/recovery evidence or advance the protected security generation before opening service. Restored state must not reactivate revoked access.
6. Verify identities/grants, foreign keys/pointers, receipts, exact file hashes, published revisions, attendance calculations, audit and outbox/read state.
7. Reconcile post-checkpoint confirmed work using retained authoritative evidence. Do not silently recreate submissions with invented acceptance times or ask users to create duplicate attempts before status is known.
8. Replay eligible jobs through deduplication/fencing; verify current authorization and prevent unintended duplicate notifications.
9. Measure recovered point, actual loss interval and total time to verified service. Compare with approved RPO/RTO.
10. Reopen only after technical, security, data and release owners accept verification. Communicate affected records and school-approved remediation through authorized channels.

A database restored without referenced attachments fails recovery acceptance. Object retention must cover supported database recovery points; backup frequency alone does not prove recoverability. If accepted work cannot be reconstructed, record the affected identities/receipts securely, preserve evidence and have the academic authority decide accommodations. Never label recovered data complete when gaps remain.

## 16. Communications and training

Prepare these messages and reference their approved text in the release record. No messages are sent by creating this plan.

| Message | Audience | Required contents | Timing / owner |
|---|---|---|---|
| Pilot readiness | Staff and approved students | Scope, access/activation steps, supported clients, start window and support | Before access; communications/product |
| Maintenance notice | Affected users | Local timezone, expected impact, safe submission guidance and next update | Before window; service owner |
| Launch confirmation | Enabled cohort | Available workflows, known limitations and support route | After production verification; product |
| Delay/incident update | Affected cohort and school owners | Observed impact, current availability, what users should do and next update | Per incident cadence; commander |
| Recovery correction | Affected users only | Confirmed record impact and approved remediation without private details of others | After assessment; academic/data owner |
| Handover summary | School/support/technical | Release version, evidence, open issues, owners and monitoring | Hypercare exit; service owner |

Avoid promising a submission succeeded when its outcome is unknown. During an outage, explain how to retain local work and check the original submission status; do not advise repeated new attempts. Deadline extensions, alternative submission channels and attendance/result corrections require explicit academic decisions and corresponding audited updates.

Training covers student login, materials, submission receipt/status, published results/coverage, notices and support; staff setup, draft versus publication, current-attempt review, corrections with reasons and membership effects; support triage and safe escalation. Record attendance or completion evidence appropriate to the approved pilot plan.

## 17. Hypercare and service handover

Define actual hypercare dates, staffed hours, primary/backup contacts and response expectations before launch. Proposed process: review telemetry and incoming issues at each staffed shift and before any cohort expansion; keep a single release issue register and update the school on unresolved core impact.

Hypercare tasks:

- Reconcile confirmed submissions and exact files, academic publication effects and delayed events after representative usage.
- Review unexpected rejections, unknown operations, scan delays, notification lag and repeated support questions.
- Verify backup freshness and alert ownership each staffed review; investigate gaps before recovery objectives are exceeded.
- Triage defects with severity, affected cohort, workaround, owner and planned fix.
- Document configuration changes and prevent unreviewed drift from the accepted baseline.
- Reassess whether the pilot size fits available support and service capacity.

Handover requires sustained health for the approved observation window, representative usage, no unresolved Critical/High release blocker, accepted lower-severity issues, current runbooks, trained support, accessible restricted evidence and named maintenance ownership. Routine operations include account/access lifecycle, backup verification, dependency maintenance, monitoring and periodic restore rehearsal at the approved cadence.

## 18. Hotfix and re-release workflow

A production hotfix receives its own release ID linked to the incident. Record the defect and affected requirements, review the smallest corrective change, build an immutable artifact, run targeted regression plus affected shared security/integrity tests, and obtain the accountable expedited approval. Urgency may shorten scheduling, not remove authorization, artifact identity or data protection gates.

Reassess schema/event/client compatibility and rollback before deployment. Reuse prior evidence only with documented impact analysis; a change to authorization, transaction guards, file lifecycle, formulas or publication may require broader affected UAT. Run production smoke and observation again after the fix. Preserve the original failed release record and final disposition.

## 19. Decision log and closure templates

### 19.1 Stage decision record

| Field | Value |
|---|---|
| Release ID / stage / candidate digest / configuration | Pending |
| Decision | PENDING: GO / HOLD / ROLLBACK / RECOVERY / CLOSED |
| Evidence and observation interval / sample counts | Pending |
| Open defects and accepted scope limitations | Pending assessment |
| Cohort before/after and affected academic windows | Pending |
| Decision owner, reviewer and timestamp | Pending |
| Next step, operator and latest decision time | Pending |
| Communication reference / next update | Pending |

### 19.2 Final release acceptance

- [ ] CLS-01: Deployed artifact/configuration and final cohort are recorded.
- [ ] CLS-02: All required preflight, deployment, smoke and pilot gates passed with evidence.
- [ ] CLS-03: Actual stage decisions, incidents, pauses and rollbacks are retained.
- [ ] CLS-04: Academic records, file references and pending event effects are reconciled.
- [ ] CLS-05: Backup/recovery monitoring and ongoing ownership are active.
- [ ] CLS-06: Known issues have impact, workaround, owner and follow-up date.
- [ ] CLS-07: Support/training and service handover are accepted.
- [ ] CLS-08: Product, QA, technical and service owners sign the closure record.

| Signatory | Acceptance | Name / timestamp / evidence |
|---|---|---|
| School product owner | Released scope, pilot outcome and accepted issues | Pending |
| Academic/data authority | Correct academic behavior and reconciled data | Pending |
| QA/UAT lead | Verification and traceability | Pending |
| Technical/database lead | Deployment, compatibility and integrity | Pending |
| Security reviewer | Access/session findings and security state | Pending |
| Release/service owner | Operational health, handover and closure | Pending |

At issue, every execution checklist is incomplete and all decisions are pending. This document provides the plan; it does not establish a production deployment, a successful rehearsal or a signed release.

## 20. Traceability and maintenance

| Release area | Source / verification |
|---|---|
| Business scope and policy | PRD Sections 18–20; decisions DEC-01–15 |
| Candidate/pipeline and migrations | Developer guide Section 25; backlog S46; test plan TC-046 |
| UAT acceptance | UAT checklist 11 journeys/89 baseline checks; backlog S47; TC-047 |
| Pilot data | Backlog S39; TC-039; UAT-01/11 |
| Performance, security and accessibility | Backlog S41–S43; test plan TC-041–043 |
| Monitoring and restore | Backlog S44–S45; TC-044/045/071; test plan Sections 15–16 |
| Rollout and handover | Backlog S48; TC-048; UAT-11 and UAT checklist Section 13 |
| Contract and data integrity | OpenAPI operation matrix and database/SDD verification in test plan 09 |

Update this plan when scope, providers, topology, academic policy, migration compatibility, recovery targets, cohort controls or release ownership changes. Preserve prior release records under their actual versions. Do not alter historical results to match a later plan.

| Version | Date | Change |
|---|---|---|
| 0.1 | 11 September 2026 | Initial complete release plan: gates, immutable package, migration/deployment sequence, production smoke, staged pilot, rollback/recovery and handover |

Companion documents: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml), [07_developer_guide.md](07_developer_guide.md), [08_jira_backlog.md](08_jira_backlog.md), [09_test_plan.md](09_test_plan.md), [10_uat_checklist.md](10_uat_checklist.md).
