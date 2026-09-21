---
title: "12 — Operations Runbook"
---

# 12 — Operations Runbook

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-12 |
| Version | 0.1 — complete operational procedure draft |
| Date | 11 September 2026 |
| Accountable owner | Service owner — named person pending |
| Technical owners | Application, database, worker/file and security leads — names pending |
| Baseline | Documents 02–11; release plan version 0.1 |
| Environment / deployed release | Not supplied |
| Operational readiness | PENDING — commands, contacts, thresholds and rehearsals require implementation evidence |
| Execution status | NOT RUN — no service operation or production change performed |

## 1. Purpose and operating principles

This runbook explains how to monitor, support, diagnose and recover the student learning service after release. It covers the student client, staff portal, API, database, private files/scanner, background workers, identity/recovery and operational dependencies. It is platform-neutral because the repository, runtime and providers remain unapproved.

Use the approved deployment tooling and actual service topology. The command worksheet in Section 5 must be completed and rehearsed before production handover. A procedure is not operationally ready while its required owner, command, permission, timeout or recovery action is unknown.

Preserve these invariants during every intervention:

- Enforce current identity, role, institution, enrollment and record ownership; support access is limited to explicit grants.
- Preserve confirmed attempts, original acceptance times, exact file versions and immutable academic history.
- Treat a lost response as uncertain until the original operation is reconciled. Never create an extra attempt to make a support ticket disappear.
- Keep drafts private; use supported publication/correction actions with required reasons and revision checks.
- Preserve worker deduplication, recipient snapshots, leases and fencing when recovering jobs.
- Retain audit evidence and redact secrets and unnecessary student content from operational records.
- Use compatible code rollback for code regressions; data restoration is a separate incident decision with possible data loss.

Production changes follow the approved change/incident workflow and actual environment permissions. This document itself grants no access or authority to execute commands. Routine read-only diagnosis can proceed under existing role grants; changes require the relevant preauthorized procedure or recorded change/incident decision. Do not use shared credentials or request a student's password.

## 2. Service directory and escalation roster

Complete all entries before service acceptance. Record secure references, not credential values.

| Item | Required record | Current value |
|---|---|---|
| Production environment | Identifier, region/topology, service URLs and restricted admin entry | Pending |
| Release registry | Current/previous artifacts, digests, configuration and migration versions | Pending |
| Monitoring | Dashboards, probes, alert routing and alert silencing policy | Pending |
| Logs/audit | Restricted search location, correlation fields and retention | Pending |
| Identity/recovery | Provider or service, approved recovery procedure and security owner | Pending |
| Database | Engine/version, endpoint reference, read-only diagnostic role and migration owner | Pending |
| Private files/scanner | Store/versioning, scanner service, retention and key ownership | Pending |
| Worker/outbox | Job dashboard, event versions, failure/retry controls and owner | Pending |
| Backups | Checkpoint catalog, object manifests, restore scripts and encryption-key access | Pending |
| Support/change tracking | Intake, incident channel, issue tracker and change record location | Pending |
| School calendar | Timezone, assignment/exam windows and academic escalation contact | Pending |

| Role | Primary / backup / contact | Responsibilities |
|---|---|---|
| Service owner / incident commander | Pending | Incident coordination, service status, escalation and reopening decision |
| Application operator | Pending | Read-only diagnosis, approved deployment/restart and smoke checks |
| Database/data owner | Pending | Locks/capacity, consistency, backups, restore and record reconciliation |
| Worker/file owner | Pending | Upload/scan/download, exact versions, job recovery and cleanup |
| Security owner | Pending | Access incidents, credentials, revocation and exposure assessment |
| School academic authority | Pending | Deadline accommodations and academic corrections |
| Product/support lead | Pending | User impact, approved communication, training and known issues |

Record staffed hours, timezone, after-hours route and acknowledgement/update targets. Do not imply 24/7 coverage unless staffed and approved. Escalate to the backup when the approved acknowledgement timer expires; if both are unavailable, follow the named duty authority. Absence of an operator is a service readiness gap, not permission to bypass controls.

## 3. Service objectives and alerts

DEC-13 controls the approved objectives. The following are inherited proposals, not measured production performance or commitments.

| Measure | Proposed target | Evidence and alert configuration |
|---|---|---|
| Routine metadata | p95 ≤1 second | Per-operation latency including database wait; configure minimum samples and breach window |
| Dashboard | p95 ≤2 seconds | Response plus widget failure rate |
| Finalization after files Ready | p95 ≤2 seconds | Include lock wait/commit; distinguish rejected and unknown outcomes |
| Core client loads | 95% within 3 seconds on approved 10 Mbps/100 ms profile | Device/network measurements, cold/warm separated |
| In-app notification | 95% visible within 60 seconds in healthy operation | Event commit to eligible visible notification |
| Availability | 99.5% monthly | One-minute authenticated probes; include maintenance, report monitoring gaps |
| Recovery point / time | RPO ≤24 hours; RTO ≤4 hours | Actual recoverable DB/object point and time to verified service |
| Integrity and confidentiality | No confirmed duplicate/lost academic work or unauthorized disclosure | Reconciliation, negative-access checks and incident evidence |

Approve production warning/critical values, windows, sample minimums and routing for: unexpected error rate, core synthetic failure, lock waits, connection saturation, storage capacity, upload/scan age, oldest eligible outbox event, retry/failure counts, missing referenced files, backup freshness and telemetry gaps. Numeric values not supplied here are required configuration decisions before handover.

Alert rules must account for both user-visible failure and underlying dependencies. One confirmed disclosure, false submission confirmation or missing confirmed attachment is an incident even if aggregate latency is healthy. Separate expected validation/deadline rejections from server errors. Lack of alerts while telemetry is missing is not proof of health.

## 4. Routine operating schedule

Cadences below are proposed defaults for the service owner to approve. Backup frequency must independently meet the recovery objective; checking a dashboard once a day does not define the backup schedule.

| Cadence | Task | Evidence / escalation |
|---|---|---|
| Each staffed shift | Review active incidents, current release/configuration and recent changes | Shift record and unresolved ownership |
| Each staffed shift | Check probes, route errors, latency, unknown submissions and file failures | Dashboard interval; investigate breaches |
| Each staffed shift | Check scanner/outbox age, retry failures, lease churn and notification lag | Queue snapshot and action references |
| Daily | Verify latest complete DB/object recoverable point and backup/key access failures | Checkpoint/manifest age; escalate before RPO breach |
| Daily | Review storage, database pool/lock pressure and upcoming academic peaks | Capacity notes and deadline readiness |
| Weekly | Reconcile sampled confirmed receipts/files and published academic pointers | Restricted integrity report; incident for discrepancies |
| Weekly | Review support themes, stale incidents, failed jobs and accepted defects | Owners, workarounds and next actions |
| Monthly | Review service objectives, availability gaps, capacity, privileged access and retention exceptions | Service review with actual denominators |
| At approved rehearsal cadence | Restore representative data/files and test session revocation/job replay | Timed recovery report; cadence selected by service owner |
| Before an academic peak | Check available capacity, upload/scan health, support coverage and change freeze | Readiness record and escalation contacts |
| After every release or material change | Run affected production smoke and reconcile critical outcomes | Release-linked smoke evidence |

Shift handover records who is on duty, active incidents/severity, affected cohorts, paused components, commands already run, pending operations/recovery, next update times, temporary mitigations and their expiry/owner. The receiving operator acknowledges ownership explicitly.

## 5. Approved command and access worksheet

Replace Pending with exact reviewed repository jobs/scripts and revisions after implementation. For each command record target binding, required least-privilege role, parameters, read/write effect, timeout, expected output, partial-failure detection, recovery and rehearsal evidence. Do not paste secrets or guess hostnames.

| ID | Operation | Required behavior | Reference / owner |
|---|---|---|---|
| OPS-C01 | Read deployment/configuration identity | Read-only artifact, schema and nonsecret config report | Pending / application |
| OPS-C02 | Query logs, metrics and audit | Scoped time/correlation search with redaction | Pending / support |
| OPS-C03 | Lookup original operation/receipt | Authorized actor/resource scope; no new operation created | Pending / application |
| OPS-C04 | Restrict cohort / pause affected writes | Backend-enforced control with in-flight handling | Pending / application |
| OPS-C05 | Drain/restart compatible API service | Known readiness, timeout and rollback behavior | Pending / operator |
| OPS-C06 | Pause/drain/resume worker claims | Preserve lease/fencing and retained events | Pending / worker |
| OPS-C07 | Retry/reconcile selected failed jobs | Bounded scope, original identity, deduplication and audit | Pending / worker |
| OPS-C08 | Inspect DB activity/capacity | Read-only locks, transactions, pools and query evidence | Pending / database |
| OPS-C09 | Inspect file reference/version/scan | Read-only exact version, integrity and reference state | Pending / files |
| OPS-C10 | Capture/verify recovery checkpoint | DB point plus matching referenced-object manifest | Pending / database |
| OPS-C11 | Restore into isolation and validate | Exact objects, security revocation and integrity report | Pending / database/security |
| OPS-C12 | Revoke sessions/rotate approved secret | Preserve access controls; known consumer rollout | Pending / security |
| OPS-C13 | Compatible application rollback | Retain accepted writes and compatible event handling | Pending / technical |
| OPS-C14 | Run scoped smoke/reconciliation | Dedicated synthetic data and pass/fail evidence | Pending / QA |
| OPS-C15 | Execute retention/cleanup policy | Eligibility/reference recheck, bounded batch and audit | Pending / data/files |

A restart is not a universal remedy. Confirm whether work is in-flight, whether the worker owns leases and whether the fallback artifact understands current data/events. Avoid ad hoc SQL updates, queue deletion and storage purge. If no safe approved action exists, hold the affected operation and escalate for a reviewed repair.

## 6. Incident classification and lifecycle

| Severity | Examples | Required response |
|---|---|---|
| Critical | Unauthorized academic disclosure, broad corruption/loss, false confirmed submission, service unusable without workaround | Activate commander/security/data owners as relevant; contain immediately under approved procedure |
| High | Core workflow unavailable to affected users without acceptable workaround | Halt affected rollout; assign technical owner and recovery decision |
| Medium | Limited impact with reviewed workaround | Track, communicate workaround and schedule fix |
| Low | Cosmetic issue or minor friction | Prioritize through routine backlog |

Use the approved response timers from Section 2. Severity describes impact, not how long a fix takes. Any confirmed missing attachment for accepted work receives incident handling and impact assessment; do not close it as a routine user mistake.

Incident workflow:

1. Open an incident ID; record reporter, detection time, affected environment/release, symptom and safe correlation references.
2. Assess confidentiality, integrity, availability, affected cohorts and academic deadlines. Assign severity and commander.
3. Contain narrowly: stop expansion, restrict unsafe access/writes, pause affected claims or cleanup as appropriate. Preserve evidence.
4. Diagnose with the applicable playbook below. Establish known facts and unknown outcomes separately.
5. Choose mitigation, compatible rollback, forward repair or disaster recovery; record decision and authority.
6. Verify business correctness, access, exact files and queue effects with scoped smoke/reconciliation.
7. Reopen affected service only when the owner accepts evidence and monitoring is available.
8. Close after user impact, unresolved records and follow-up work are assigned. Conduct an incident review proportional to severity.

Do not wait for root cause to contain confirmed harm. Do not call a temporary mitigation a permanent fix. Maintain a chronological action log with operator, exact approved command/reference, scope, start/end, observed result and next decision.

## 7. Playbook index

| ID | Symptom | Primary owner |
|---|---|---|
| RUN-01 | Service unavailable or severe latency | Application / database |
| RUN-02 | Login, recovery or session failure | Identity/security |
| RUN-03 | Submission outcome unknown, duplicate or apparently missing | Application / database |
| RUN-04 | Upload/scan stuck or validation fails | File/worker |
| RUN-05 | Confirmed attachment missing or unauthorized download | File/security |
| RUN-06 | Feedback/results/attendance inconsistent | Academic / application |
| RUN-07 | Notification delayed or duplicated; failed worker | Worker |
| RUN-08 | Database contention, capacity or migration failure | Database |
| RUN-09 | Backup stale or recovery checkpoint incomplete | Database/files |
| RUN-10 | Confirmed exposure or compromised credential | Security |
| RUN-11 | Release regression requiring rollback | Technical / release |
| RUN-12 | Disaster restore and reconciliation | Incident commander / data |

All playbooks are unexecuted drafts. Record the incident/change ID and applicable command references before action; use approved thresholds and bounded scope.

## 8. RUN-01 — Service unavailable or slow

**Start:** Failed core probes, rising unexpected errors, p95 breach or repeated user reports. **Owner:** Application lead; involve database/worker owner for dependency symptoms.

1. Verify environment, time window, current artifact/configuration and latest changes using OPS-C01/C02. Separate client-only, route-specific and service-wide failures.
2. Check edge/TLS/routing, readiness, process health, database pool/locks, storage/scanner dependencies and worker lag. Identify the earliest shared failure signal.
3. Compare latency distributions and sample counts; inspect hot-class deadline traffic and lock wait rather than averages alone.
4. Stop release expansion. Use approved capacity or restart controls only if dependency health, in-flight state and compatibility are understood.
5. If a recent regression is causal and rollback is compatible, use RUN-11. If database pressure dominates, use RUN-08. Do not weaken authorization or remove transaction guards to improve latency.
6. Verify login, class read, synthetic receipt reconciliation and file retrieval. Observe for the approved window with sufficient requests before reopening/closing.

**Exit evidence:** Recovery timestamps, affected routes/cohort, actual metrics, scoped smoke and any unknown operations still assigned to RUN-03. **Escalate:** Confirmed integrity/access issue or inability to meet the approved recovery window.

## 9. RUN-02 — Login, recovery or session failure

**Start:** Valid users cannot sign in/recover, sessions end unexpectedly, or browser authentication differs from API-client behavior. **Owner:** Identity/security.

1. Obtain nonsecret user/account reference, client/browser, timestamp and correlation ID. Never request password, cookie or recovery token in a ticket.
2. Check account state, institution, activation and approved recovery method. Pending/disabled accounts must not be bypassed to restore access.
3. Inspect HTTPS/origin, preauthentication session/CSRF binding, browser credential handling, cookie configuration and expiry/revocation behavior.
4. Check selected recovery delivery/service health with a synthetic account. Public responses must not reveal whether an account exists.
5. Repair configuration/provider issues through the approved change process. Do not disable CSRF, make cookies insecure or extend all sessions as an emergency shortcut.
6. For suspected compromise use RUN-10. For ordinary recovery use the approved identity verification and reset process; staff must not manually set a known shared password.
7. Verify sign-in, protected access, logout, expired/reused recovery evidence and second-account cache isolation on the approved client.

**Exit evidence:** Cause/configuration revision, synthetic results and affected-account remediation. Document whether session revocation requires users to sign in again.

## 10. RUN-03 — Submission outcome uncertain or inconsistent

**Start:** Timeout after Submit, “Checking submission status,” apparent duplicate, confirmed work shown Pending, or missing receipt. **Owner:** Application/database; academic authority if deadlines are affected.

1. Record student/assignment references, original operation scope/key reference, approximate time and client state. Collect receipt ID if one exists; do not collect full work in ordinary support logs.
2. Use authorized original-operation lookup (OPS-C03). The contract uses `POST /operations/lookup` with session/CSRF; this lookup must not create a new logical operation. Support tooling must respect its own explicit diagnostic grants and must not impersonate the student.
3. Classify the authoritative result:

| Outcome | Action |
|---|---|
| CONFIRMED | Retrieve authorized original receipt and exact references; refresh current state; do not resubmit |
| REJECTED | Explain recorded terminal reason; verify no attempt consumed; a new eligible action is a separate deliberate user decision |
| NOT_FOUND_YET | May be in-flight; preserve original key/payload and use bounded lookup/retry under client policy; no automatic new key |
| Transport UNKNOWN | Diagnose connectivity/transaction state and reconcile original operation; not proof of rollback |
| Lookup inaccessible | Verify current authentication/history authorization; do not broaden access to reveal outcome |

4. For CONFIRMED but Pending UI, compare current-attempt pointer and response mapping. Completed means at least one confirmed submission, not grading complete.
5. For duplicate reports, compare logical scope, key, payload hash, attempt sequence and original responses. Two deliberately distinct operations can differ from an accidental duplicate; investigate the approved attempt policy.
6. If a confirmed receipt has no matching durable attempt/file reference, or a duplicate violates invariants, contain affected writes and open an integrity incident. Preserve records; do not delete one copy by guesswork.
7. Verify same-operation replay after deadline retains identity/time and that restart shows the correct own history. Resolve exact files through RUN-05 if needed.

**Never:** Backdate acceptance, override attempt count, force-publish stale feedback, or label uploaded bytes as a submitted attempt. Acceptance is the approved post-lock database wall clock retained on successful commit, not upload start or request arrival. Academic accommodations require an explicit school decision and audited supported action.

**Exit evidence:** One authoritative outcome per original operation, receipt/time reconciliation, affected-user guidance and any unresolved cases with named owners.

## 11. RUN-04 — Upload or scan stuck

**Start:** Upload reaches 100% but cannot be submitted, scanner age breaches threshold or repeated validation failure. **Owner:** File/worker.

1. Identify upload/reference, purpose, declared metadata, actual byte count, object version, expiry and scan state using OPS-C09. Do not download private content to an unrestricted workstation.
2. Distinguish incomplete transfer, checking, rejected, Ready and expired/unreferenced state. Inspect supported format, actual content validation and group limits.
3. Baseline proposed limits are 20 MiB per file, at most five files and 50 MiB total; formats PDF, DOCX, PPTX, XLSX, JPEG and PNG. Apply the approved version of these rules.
4. Check scanner health, dependency timeouts, lease owner/generation, failed jobs and object permissions. Replay only approved bounded jobs against the same exact version after the underlying fault is fixed.
5. Do not mark a file Ready manually, bypass scanning, replace bytes under a confirmed reference or extend expired eligibility by changing timestamps.
6. Verify a synthetic permitted upload reaches Ready and can finalize an eligible assignment. Explain that a scan delay does not reserve the deadline; escalate academic impact separately.

**Exit evidence:** State/age before and after, scanner/job outcome, exact version and validation result. If a confirmed attachment is affected, use RUN-05 rather than treating it as disposable staging.

## 12. RUN-05 — Confirmed file unavailable or unauthorized

**Start:** An authorized receipt points to missing/wrong bytes, or a foreign/revoked link returns private content. **Owner:** File lead; security for unauthorized access; database for pointer integrity.

1. Preserve receipt, typed reference, immutable object version/checksum and access decision evidence. Classify access denial, transient gateway failure, missing version, checksum mismatch or confirmed disclosure.
2. For unauthorized access, immediately contain the gateway/cache/public exposure through the approved control and invoke RUN-10. Do not assume opaque IDs provide protection.
3. For unavailable bytes, compare database reference, object version inventory, storage permissions, key access, deletion/cleanup history and backup manifest.
4. Pause destructive cleanup if reference retention may be at risk. Do not remove the attempt/reference to eliminate the error or attach a different “similar” file.
5. Recover the exact version from approved retained storage/backup through reviewed repair. If exact recovery is impossible, record an integrity incident and invoke RUN-12 for broader recovery assessment.
6. Verify checksum, authorized download, foreign/revoked denial and retained receipt identity. Reconcile all references affected by the same failure.

**Exit evidence:** Exact bytes restored or explicit unresolved loss record, affected scope, access tests and prevention action. A database-only recovery is insufficient.

## 13. RUN-06 — Academic values or publication inconsistent

**Start:** Wrong percentage, unexpected missing coverage, student sees a draft, stale feedback conflict or partial result publication. **Owner:** Application with academic authority; security for draft leakage.

1. Capture nonsecret record/filter/revision references and expected policy version. Compare the same student, term, subject, class, date range and published snapshot.
2. Check publication state, current attempt/root revision, enrollment interval and canceled session status. A stale review conflict can be correct behavior; refresh and review the current attempt.
3. Use the approved oracles: results 40/50 + 60/100 = 66.67%; scored zero is 0.00%; Absent/Exempt excluded from the numeric scored summary; missing/draft records make coverage incomplete. Attendance `(Present + Late)/(Present + Late + Absent)`; Excused counts toward recorded coverage but not the percentage denominator.
4. For attendance, include only eligible started noncanceled sessions, with enrollment interval `[start, withdrawal)`. Check missing/draft coverage instead of converting missing students to Absent.
5. If display/filter mapping is wrong, repair code through change control. For incorrect academic entry, authorized staff use supported correction/publication with reason and optimistic revision checks.
6. Treat draft leakage, partial atomic publication or corrupted pointers as incidents. Contain affected access/writes; do not force-update published values with ad hoc SQL.
7. Verify student-visible revision and summary, prior values/audit, and no cross-student leakage. Correction drafts must not replace existing visible published values until republished.

**Exit evidence:** Approved calculation comparison, revision/correction reason, affected counts and audit reference. No invented rank, GPA, final grade or average of rounded percentages.

## 14. RUN-07 — Delayed or duplicate notifications and failed workers

**Start:** Oldest eligible event/scan exceeds threshold, repeated failures, lease churn or duplicate notification. **Owner:** Worker lead.

1. Inspect event/job identity, committed academic root, event-time recipient snapshot, retries, next eligible time, lease owner/generation and actual visible effect.
2. Separate delayed processing from intentional access denial: a former class member may no longer be allowed to open a delivered notification target. Do not regrant membership to make delivery appear successful.
3. Verify dependencies and current worker/event schema compatibility. Identify poison payloads or a repeated provider error before retrying.
4. Pause affected claims if workers produce unsafe effects. Preserve queued events; do not clear the queue or reset all read states.
5. Deploy the compatible fix or recover expired claims through the approved lease mechanism. Stale workers must not complete or heartbeat a newer lease generation.
6. Replay selected failures in bounded batches with original identities and deduplication. Observe before widening scope. External scanning/deletion must not occur while holding long database transactions.
7. Reconcile one notification per intended event/recipient and persistent read status; measure commit-to-visible latency. New members are not automatically historical recipients unless approved policy says so.

**Exit evidence:** Before/after backlog and oldest age, selected job IDs, duplicate reconciliation and stable lease behavior. Do not reverse a confirmed academic transaction because notification processing is delayed.

## 15. RUN-08 — Database pressure or migration failure

**Start:** Pool saturation, lock-wait spikes, disk pressure, transaction failures or incomplete migration. **Owner:** Database lead.

1. Use read-only OPS-C08 to inspect active transactions, blocking chain, query shape, pool usage, free space and recent schema changes. Record workload and sample interval.
2. Check deadline hotspots and class-guard contention. Verify no external file/scanner work is held inside long academic transactions.
3. Stop expansion and, if necessary, pause affected new writes through approved controls. Do not remove guards, constraints or authorization checks as a performance workaround.
4. Before cancelling a query/transaction, identify owner and possible unknown client outcomes. Use reviewed bounded action; route ambiguous submissions to RUN-03. Do not kill all connections indiscriminately.
5. For migration failure, verify actual committed schema/version and single-runner state. A failed job does not establish total rollback. Use rehearsed forward repair or compatible fallback; do not rerun blindly.
6. Apply reviewed query/index/capacity changes with evidence and change control. Verify old/new artifact, schema and event compatibility.
7. Reconcile attempts/publications/locks, run affected smoke and monitor representative traffic before reopening.

**Exit evidence:** Blocking/capacity cause, migration state, command outcomes, integrity checks and normal load behavior. If corruption is suspected, preserve state and invoke RUN-12.

## 16. RUN-09 — Backup stale or incomplete

**Start:** Backup failed, recoverable point exceeds allowed age, object manifest incomplete or key access fails. **Owner:** Database and files.

1. Determine the latest complete recoverable point, not merely the latest successful DB backup job. Check all referenced object versions and encryption-key availability.
2. Inspect schedule, job errors, storage capacity, credentials, object replication/backup lag and retention configuration.
3. Preserve the last known good checkpoint. Do not delete older recovery points to free space before assessing their dependent objects and retention obligations.
4. Fix the underlying issue through approved controls, capture a fresh complete checkpoint with OPS-C10 and validate manifest coverage.
5. If the approved RPO is already breached or may be breached before repair, escalate to the service/data owner and record risk and write-service decision. A disabled alert is not a mitigation.
6. Restore representative records/files in isolation when required to resolve uncertainty. Record actual recovered point and elapsed verification time.

**Exit evidence:** Fresh complete checkpoint/manifest, successful key access and validation, functioning alerts and documented exposure interval.

## 17. RUN-10 — Exposure or credential compromise

**Start:** Confirmed unauthorized data access, public file leakage, secret disclosure or evidence of compromised privileged credentials. **Owner:** Security with incident commander.

1. Restrict affected access using the approved containment control. Preserve timestamps, correlation IDs, audit and access logs in restricted evidence.
2. Identify impacted accounts, institutions/classes, resources, links/caches and time window. Distinguish confirmed from suspected exposure.
3. Revoke affected sessions/recovery evidence and rotate compromised credentials using OPS-C12. Plan consumer updates and verification; do not revert to a revoked secret for convenience.
4. Correct authorization, gateway or cache behavior through reviewed deployment. Purge exposed cache entries through the actual approved mechanism if applicable; preserve investigation evidence first.
5. Review dependent credentials and restored-state risks. Ensure backup restoration cannot revive compromised sessions or keys.
6. Verify denial for the former access path, valid-user access, session revocation and least-privilege service operation.
7. School/security owners determine required user/stakeholder notifications under the approved incident policy and applicable obligations. Record decisions; this document does not prescribe legal deadlines or send messages.

**Exit evidence:** Containment time, verified scope, revocation/rotation references, corrected negative tests and assigned remediation. Aggregate pass rate cannot excuse an unresolved exposure.

## 18. RUN-11 — Compatible rollback

Use release plan Section 14 and its exact rehearsed command references.

1. Record regression, release/configuration, impact and rollback decision. Halt cohort expansion.
2. Verify that prior code/configuration supports current schema, accepted data, client contracts and queued event versions. For first launch without a compatible prior service, retain maintenance/restricted state.
3. Drain/reconcile in-flight writes and pause incompatible claims as required. Preserve original operation keys and all confirmed records.
4. Deploy the approved compatible artifact/configuration via OPS-C13. Keep valid secret rotations and session revocations.
5. Resume compatible workers through fencing/deduplication; run affected release smoke checks and receipt/file reconciliation.
6. Observe the approved window, record degraded scope and reopen only with the commander's decision.

Do not restore yesterday's database to undo a code defect. If schema compatibility fails, hold writes and use reviewed forward repair or RUN-12. Record the latest safe decision time from rehearsal and staffing, not an invented universal timeout.

## 19. RUN-12 — Disaster restore and reconciliation

**Start:** Corruption/loss or unrecoverable service state requiring restoration. **Owner:** Incident commander, database/data, files and security. **Prerequisite:** Explicit recovery decision with selected point and expected loss explained to the school/data owner.

1. Stop affected writers, worker claims and destructive cleanup; preserve current state and evidence.
2. Select a complete DB/object recovery point and required configuration/key versions. Record the interval of potentially lost accepted changes and affected receipts.
3. Restore into an isolated recovery environment with outbound recipients restricted using OPS-C11. Keep public access closed.
4. Validate schema, identities/grants, membership intervals, attempt/current pointers, original receipts, published/corrected revisions, attendance, audit and outbox/read state.
5. Retrieve and verify exact referenced file versions/checksums. A row count without file bytes is not a recovery pass.
6. Revoke restored sessions/recovery evidence or advance the protected security generation before reopening. Do not restore compromised security state as trusted.
7. Reconcile accepted changes after the checkpoint using retained authoritative evidence. Do not fabricate acceptance times or blindly resubmit on behalf of students.
8. Replay retained events through original identities, deduplication and lease fencing; verify current read authorization and no duplicate effects.
9. Measure actual recovered point, known lost-write interval and total elapsed time until verified service; compare with approved RPO/RTO.
10. Obtain technical/security/data/service acceptance, run affected smoke, reopen the approved cohort and monitor.

If confirmed work cannot be recovered, preserve a restricted loss register with original receipt/reference, affected student, evidence, unknowns and academic remediation owner. The academic authority decides accommodations through supported audited workflows. Communicate accurate record impact through authorized channels. Never claim complete restoration while unresolved confirmed-file or academic gaps remain.

## 20. Access lifecycle, retention and maintenance

Account operations use institution-managed activation, recovery, disablement and explicit role grants. Verify identity through the approved process before recovery; record who approved privileged changes. Review publisher, support, audit and service-account grants at the approved cadence and when staff leave or change duties.

Withdrawal changes current class/new-action eligibility while an active account may retain its own permitted confirmed/published history under the PRD. Disabling the account is a separate control. Do not erase historical membership to remove access.

Retention follows DEC-14. The proposed 24-hour expiry for unattached staging is not permission to delete confirmed attachments. Cleanup must recheck eligibility and references using the approved guards, target the exact object version, preserve protected history and record outcomes. Database recovery points and their referenced objects need compatible retention. Pause cleanup for relevant investigations or recovery holds.

Maintenance changes require impact, owner, exact artifact/configuration, academic-window assessment, verification, fallback and communication references. Rehearse migrations; use one runner; retain compatible schema during rollback windows. For secret/certificate renewal, inventory consumers, stage the approved change, verify new access and revoke old material in the planned order. Never restore a compromised secret as fallback.

Use school-approved schedules for patching, restore rehearsal and access review. Temporary mitigations and alert silences need an owner, reason, expiry and revalidation; they must not become undocumented permanent behavior.

## 21. Support communication and records

Support should collect: affected workflow, approximate time/timezone, client/version, nonsecret account/class/assignment reference, safe correlation or receipt ID, observed message and reproduction steps. Ask only for information needed to diagnose. Restrict screenshots that contain academic records.

Suggested incident update fields: incident ID, affected service/cohort, observed impact, known versus unknown outcomes, mitigation in progress, what users should do, next update time and support route. Use approved audience and sender. Do not broadcast student names, submitted work or private scores.

For a submission outage, explain how to retain local work and check the original receipt/status. Do not advise repeated new attempts or promise acceptance. Deadline extensions, alternative channels and retrospective academic corrections require school approval and audit.

| Record | Required fields |
|---|---|
| Shift log | Operator, window, current release, health, incidents, paused components and next owner |
| Incident | ID, severity, detection/containment/recovery times, scope, evidence, decisions and communications |
| Action log | Approved command revision, executor, target/scope, time, actual output, partial state and next decision |
| Repair/change | Requirement/invariant affected, authorization, pre-state, exact action, verification and fallback |
| Recovery | Checkpoint/manifest, key/config references, loss interval, file checks, revocation, replay and acceptance |
| Incident review | Timeline, root/contributing causes, impact, what worked, detection gaps and owned prevention tasks |

Close incidents only after service health and data outcomes are verified, affected users' unresolved cases are assigned, and temporary controls have an owner. Follow-up tasks need real issue references once created; none are created by this document.

## 22. Operational acceptance and maintenance of this runbook

- [ ] OPS-01: Named primary/backup owners, contacts, coverage and response timers are populated.
- [ ] OPS-02: Production topology, artifact registry and restricted diagnostic access are verified.
- [ ] OPS-03: OPS-C01–15 have exact reviewed implementations, parameters, timeouts and rehearsal evidence.
- [ ] OPS-04: Approved objectives, alert thresholds/windows and routing are configured and tested.
- [ ] OPS-05: Routine checks, shift handover and academic-peak coverage have owners.
- [ ] OPS-06: Identity recovery, access lifecycle and credential rotation procedures are approved.
- [ ] OPS-07: Unknown submission, exact-file and failed-worker procedures have been rehearsed in isolation.
- [ ] OPS-08: Backup completeness, key access, restore, revoked-session handling and job replay are demonstrated.
- [ ] OPS-09: Compatible rollback and incompatible-schema fallback are rehearsed.
- [ ] OPS-10: Data retention, cleanup guards and recovery-point/object retention are approved.
- [ ] OPS-11: Support/communication templates and school academic escalation are ready.
- [ ] OPS-12: Service, technical, data, security and school representatives accept the handover evidence.

At issue, all acceptance checks are incomplete. No operational commands, incident handling, restore or production verification have been executed by creating this runbook.

| Sign-off role | Name / date / evidence / decision |
|---|---|
| Service owner | Pending |
| Technical/database lead | Pending |
| File/worker owner | Pending |
| Security owner | Pending |
| School product/academic representative | Pending |
| QA/release owner | Pending |

Review this runbook after incidents, material architecture/configuration changes, releases that alter operational behavior, and at the service owner's approved periodic cadence. Retain versioned historical runbooks with their release records. Update procedures and rehearsals together; a renamed command without verified behavior is not an operational fix.

| Coverage | Companion evidence |
|---|---|
| Business rules and access | PRD 02; UX 03; SDD 04; database 05; OpenAPI 06 |
| Command certainty, workers and troubleshooting | Developer guide 07 Sections 26–27 and relevant implementation sections |
| Operations delivery | Backlog 08 S44–S48 |
| Fault, security, load and recovery verification | Test plan 09, including TC-043–048 and TC-070–072 |
| Business/operational acceptance | UAT checklist 10, especially UAT-10/11 |
| Production smoke, rollout, rollback and handover | Release plan 11 Sections 11–19 |

| Version | Date | Change |
|---|---|---|
| 0.1 | 11 September 2026 | Initial complete runbook with 12 incident playbooks, routine operations, command worksheet, recovery, support and acceptance gates |

Companion documents: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml), [07_developer_guide.md](07_developer_guide.md), [08_jira_backlog.md](08_jira_backlog.md), [09_test_plan.md](09_test_plan.md), [10_uat_checklist.md](10_uat_checklist.md), [11_release_plan.md](11_release_plan.md).
