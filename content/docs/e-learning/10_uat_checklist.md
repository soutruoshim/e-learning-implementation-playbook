---
title: "10 — User Acceptance Testing Checklist"
---

# 10 — User Acceptance Testing Checklist

## Student Learning App

| Field | Value |
|---|---|
| Project | SrhDP — Student Learning App |
| Document ID | SLP-DOC-10 |
| Version | 0.1 — complete checklist draft |
| Date | 10 September 2026 |
| Owner | QA/UAT coordinator — named person pending |
| Business acceptance owner | School product owner and academic authority — names pending |
| Baseline | PRD UAT-01–11; test plan 09, version 0.1; companion specifications 03–08 |
| Execution status | NOT RUN — no candidate build or UAT environment supplied |
| Acceptance decision | PENDING — no sign-off or production readiness claimed |

## 1. Purpose and use

This is the execution checklist for school representatives, students, teachers, administrators and release reviewers to decide whether the proposed MVP meets its agreed business needs. It includes observable user journeys and the technical evidence reviewers must inspect for behavior that cannot be proven from a screen alone.

Use one versioned copy per candidate/run. Retain the canonical UAT-01–11 IDs from the PRD; child IDs such as UAT-03.01 identify individual checks in this document. TC references point to procedures in `09_test_plan.md`. These are planning identifiers, not existing Jira issues.

Each child check is required for the baseline unless an approved scope change explicitly removes its applicability. An unchecked box means unfinished. Check the box only after the expected outcome has been observed and the linked execution record is PASS. A group passes only when every applicable child check passes and required supporting evidence has been accepted.

This document does not repeat the full 136-operation test matrix or replace QA, security, database, accessibility or recovery verification. UAT acceptance includes review of their evidence. Academic rules and operational targets remain proposed until their decision owners approve them.

## 2. Run header and ownership

Complete before execution; a blank required field prevents entry.

| Run field | Recorded value |
|---|---|
| Run ID / checklist revision | Pending |
| Candidate version / immutable artifact digest / commit | Pending |
| Environment URL/name and deployment timestamp | Pending |
| API, database migration and configuration versions | Pending |
| PRD/UX/SDD/database/API/backlog/test-plan baseline versions | Pending |
| Approved scope and decision register reference | Pending |
| Fixture manifest version / reset snapshot | Pending |
| School timezone / approved languages | Pending |
| Supported device, OS, browser and assistive technology matrix | Pending |
| Session, upload, attempt and publication policy versions | Pending |
| Test window / school participants / coordinator | Pending |
| Evidence location and access / retention owner | Pending |
| Defect tracker / triage meeting / escalation contact | Pending |
| Final decision meeting / accountable release owner | Pending |

| Role | Responsibility | Named person |
|---|---|---|
| UAT coordinator / QA | Fixtures, execution records, coverage, defect follow-up and summary | Pending |
| Student representatives | Complete learning journeys and report confusing behavior | Pending |
| Assigned teacher | Prepare work, review submissions, enter attendance and feedback | Pending |
| Academic publisher | Validate publication, corrections and academic calculation rules | Pending |
| School administrator / data owner | Accounts, classes, enrollment and pilot roster reconciliation | Pending |
| Product / design owner | Scope, usability, platform/language behavior and minor issue acceptance | Pending |
| Technical / database lead | Explain integrity evidence and fix technical defects | Pending |
| Identity / security reviewer | Approve access/session/file verification evidence | Pending |
| Service / release owner | Recovery, deployment rehearsal, support and rollout decision | Pending |

A role does not imply blanket application permissions. For example, setup administration does not automatically confer academic publication access. Use explicitly granted fixture accounts.

## 3. Readiness checklist

- [ ] ENT-01: Named candidate is deployed, reachable and identified in every execution record.
- [ ] ENT-02: Required source documents agree; unresolved conflicts have an owner and block affected checks.
- [ ] ENT-03: Decisions governing platform/language/timezone, identity, assignments, results/attendance, history and role grants are approved (DEC-02/03/05/06/07/08).
- [ ] ENT-04: Pilot cohort, data source, providers, scope, staffing/support and operational/retention targets are approved before their dependent checks (DEC-04/09/10/11/12/13/14/15).
- [ ] ENT-05: Core QA, contract and database integration evidence is available for this candidate; no known unresolved Critical/High core-flow failure is concealed by starting UAT.
- [ ] ENT-06: Accounts and explicit permissions have been verified; synthetic records and isolated file/notification destinations are loaded.
- [ ] ENT-07: Fixtures, exact calculation oracles, file limits and time controls have been reviewed by QA and academic authority.
- [ ] ENT-08: All approved client/device/language variants have an assigned executor and evidence record.
- [ ] ENT-09: Logging, safe evidence capture, defect tracking and fixture reset are working.
- [ ] ENT-10: Participants know how to report a failed check and stop if evidence or environment integrity is compromised.

Use synthetic data for rehearsals. Any real pilot data requires the approved onboarding/access/retention process. Keep passwords, session cookies, recovery links and student work out of shared reports.

## 4. Fixtures and expected results

Reuse the fixture manifest in test plan Section 6, including generated IDs. These aliases are examples for repeatable acceptance, not real school records.

| Fixture set | Required state |
|---|---|
| Identity | ADM-A setup admin; PUB-A scoped publisher; TEACH-A assigned; TEACH-B unassigned; STUD-A and STUD-B distinct active students; STUD-W withdrawn with active account; STUD-D disabled; STUD-P pending; restricted SUPPORT-A and AUDIT-A |
| Academics | INST-A pilot and INST-B isolation fixture; YEAR-A, TERM-A, active CLASS-A, archived CLASS-H; approved subject/teacher/room and dated enrollment intervals |
| Schedule | Today, tomorrow, no-session day, midnight-overlap session, canceled session; draft/published/canceled future exams |
| Assignments | Text, files, text-and-files; draft, published, closed and archived; one-attempt and three-attempt variants; late-disabled and explicit late-close variants |
| Files | Ready, checking, rejected, expired, foreign-owned, size/count boundary and confirmed historical versions |
| Reviews | Attempt 1, replacement attempt 2, hidden feedback draft, published feedback and unpublished correction |
| Results | 40/50, 60/100, scored zero, Absent, Exempt, missing and draft results; mixed valid/invalid publication batch |
| Attendance | 8 Present, 1 Late, 1 Absent, 2 Excused; missing thirteenth session; only Excused; only Absent; canceled and membership-boundary sessions |
| Communication | Current class notice, expired/archived notice, read/unread notification; membership changed after publication |
| Operations | Original and distinct retry keys, lost response, controlled service restart, isolated restore dataset with confirmed file hashes |

Reference oracles below apply only to the approved version of the proposed policy:

| Oracle | Expected result |
|---|---|
| Due at 10:00:00; authoritative acceptance exactly 10:00:00 | On time |
| Upload begins before due; acceptance 10:00:01; late disabled | Rejected as closed; uploading did not reserve eligibility |
| Late enabled until 11:00:00 | Acceptance 10:00:01 and 11:00:00 is Late; 11:00:01 rejected |
| Original confirmed request replayed after deadline | Original identity/time/outcome; no new attempt, with current own-history authorization |
| Results 40/50 + 60/100 | 66.67% from 100/150 |
| Scored 0/50 | 0.00%, present scored data |
| 40/50 + Absent | 80.00% on scored records; Absent shown separately |
| Only Absent/Exempt or no included scored maximum | N/A |
| 40/50 published + 90/100 draft | 80.00%, incomplete; draft score hidden |
| Attendance 8P + 1L + 1A + 2E | 90.00%; coverage 12/12 |
| Same attendance + one Not recorded | 90.00% provisional; coverage 12/13, missing 1 |
| Only 2 Excused | N/A; coverage 2/2 |
| Cancel Absent session from complete fixture | 100.00%; coverage 11/11 |
| Only 1 Absent | 0.00% |

Use exact decimal calculations and half-up display rounding to two places. Result summaries are published scored assessment percentages, not final grades, rank or GPA. Attendance denominator excludes Excused while coverage includes its finalized record. Technical staff provide controlled clock/lock evidence for exact boundary checks; a tester manually clicking near a deadline is insufficient.

Reset changed fixtures between variants, preserve failed evidence first, and record the reset version. Do not reuse a completed one-attempt assignment for a new independent case.

## 5. Execution and evidence rules

Allowed states: NOT RUN, PASS, FAIL, BLOCKED. Use REMOVED BY APPROVED SCOPE CHANGE only with a documented scope decision, approver and updated denominator; it is not PASS. A policy still awaiting approval is BLOCKED when execution is attempted.

Every child check needs an execution row with these fields:

| Field | Value to fill |
|---|---|
| Run / child check ID / variant | Pending |
| Executor / role / execution time and timezone | Pending |
| Candidate / environment / device-language variant | Pending |
| Fixture IDs and initial state | Pending |
| Actions actually performed | Pending |
| Expected result | Copy the child-check expectation and relevant oracle |
| Actual result | Not observed |
| Status | NOT RUN |
| Evidence link and safe request/receipt/revision reference | Pending |
| Defect / blocked reason / owner | Pending if applicable |
| Retest run and reviewer | Pending |

Duplicate this record per child check and per applicable platform, language or scenario variant. A group-level screenshot does not replace individual outcomes. For submission/replay, record the same durable receipt identity and acceptance time before and after retry/restart; technical evidence must establish one confirmed attempt and exact file references. For publication, retain pre/post visible revisions and audit reason. For access denial, show no leaked rows, counts or file bytes, not only a disabled button.

## 6. Business acceptance journeys

All checks below begin NOT RUN. Where a step requires controlled faults, concurrency or API manipulation, QA/technical staff operate the test harness while school reviewers observe and accept the expected business outcome. Use the referenced TC procedure for exact mechanics.

### UAT-01 — Prepare accounts and academic setup

**Executor:** Administrator and data owner. **PRD coverage:** ADM, AUTH; JRN-01. **Test-plan evidence:** TC-007/011/012/039.

**Preparation:** Fresh institution fixture; explicit setup grants; approved term and enrollment rules.

- [ ] **UAT-01.01** — Create the year, term, subjects, class, teacher assignment and two student accounts through supported workflows. **Accept when:** Saved values match the approved roster and calendar; students belong to the intended class.
- [ ] **UAT-01.02** — Try duplicate account/class membership identities and invalid calendar bounds. **Accept when:** Validation explains the problem; no duplicate or invalid academic relationship is saved.
- [ ] **UAT-01.03** — Activate an account through the approved process; try pending and disabled accounts. **Accept when:** Only an eligible active account reaches protected student data; the chosen activation process works.
- [ ] **UAT-01.04** — Compare class enrollment with the source roster, including start and withdrawal dates. **Accept when:** Counts and identities reconcile; discrepancies have an owner and are resolved before pilot acceptance.
- [ ] **UAT-01.05** — Change teacher assignment and student membership using supported actions. **Accept when:** New grants take effect and removed grants stop access; membership history is retained.
- [ ] **UAT-01.06** — Try academic publication as a setup-only administrator. **Accept when:** Publication is denied without an explicit publisher grant.
- [ ] **UAT-01.07** — Open an archived class and try to add active work. **Accept when:** Approved historical views remain available; new active writes are rejected.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-02 — Find the learning day and materials

**Executor:** Student. **PRD coverage:** HOME, CLS, MAT, FILE; JRN-02. **Test-plan evidence:** TC-014/019/036.

**Preparation:** STUD-A enrolled; today/empty-day/midnight fixtures; published Ready material.

- [ ] **UAT-02.01** — Sign in and open Home in the configured school timezone. **Accept when:** Student identity and local date are correct; today’s eligible sessions appear with unambiguous times.
- [ ] **UAT-02.02** — Compare today, midnight-overlap and no-session-day fixtures. **Accept when:** Schedule follows the approved day rule; empty state is useful and canceled sessions are excluded or clearly labeled per UX.
- [ ] **UAT-02.03** — Open Classes and class details, then the supported tabs. **Accept when:** Only authorized classes and content appear; teacher, room and schedule match source data; deferred directory controls are absent/disabled.
- [ ] **UAT-02.04** — Open a published material and download its attachment. **Accept when:** Correct name/type/size and exact file content are available through protected access.
- [ ] **UAT-02.05** — Attempt a draft material, revoked link and foreign class material. **Accept when:** No draft or unauthorized file content is disclosed; UI provides an appropriate unavailable/access message.
- [ ] **UAT-02.06** — Review the next exam with published, draft and canceled exam fixtures. **Accept when:** Only an eligible published upcoming exam appears; exam details do not disclose draft scores.
- [ ] **UAT-02.07** — Simulate a failed dashboard section and retry. **Accept when:** Failure is explained with retry; successful sections remain usable and stale content is not presented as fresh.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-03 — Submit work and recover a lost response

**Executor:** Student with QA support. **PRD coverage:** ASG, FILE; JRN-03. **Test-plan evidence:** TC-022/023/053.

**Preparation:** Published assignment; active membership; valid content/Ready files; controlled lost-response harness.

- [ ] **UAT-03.01** — Open assignment details before entering work. **Accept when:** Instructions, formats, due time/timezone, attempts used and availability are clear; no invented progress percentage appears.
- [ ] **UAT-03.02** — Complete text-only, files-only and text-and-files variants with required inputs. **Accept when:** Each valid variant produces a durable receipt, sequence number, authoritative acceptance time and timeliness.
- [ ] **UAT-03.03** — Try missing required text, a checking/rejected file and another student’s file. **Accept when:** Submission is not confirmed; actionable validation is shown; no attempt is consumed.
- [ ] **UAT-03.04** — Exercise file limits: 20 MiB per file, five files, 50 MiB combined and one-byte/count excess variants. **Accept when:** Valid boundary files can proceed after validation; excess, unsupported or unsafe content is rejected without false success.
- [ ] **UAT-03.05** — Lose the confirmation response, then retry the same logical operation with identical payload after the deadline. **Accept when:** Client reconciles the original outcome; receipt identity/time remains unchanged and no duplicate attempt is created.
- [ ] **UAT-03.06** — Restart the client after confirmation and reopen history and files. **Accept when:** The confirmed attempt and exact attachments persist; Completed includes submitted but ungraded work.
- [ ] **UAT-03.07** — Go offline during finalization and restore connectivity. **Accept when:** Unconfirmed work is not labeled Submitted; status checking/retry is clear and does not silently create a fresh attempt.
- [ ] **UAT-03.08** — Reuse an operation key with different content; inspect the resulting history. **Accept when:** Conflict is reported and the original confirmed attempt remains unchanged.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-04 — Enforce deadlines, attempts and access changes

**Executor:** Academic authority with QA support. **PRD coverage:** BR-03–BR-07, ASG; AC-ASG-01–08. **Test-plan evidence:** TC-049–060 plus TC-022/025.

**Preparation:** Reset assignment per variant; controlled acceptance clock and transaction ordering.

- [ ] **UAT-04.01** — Finalize exactly at due 10:00:00. **Accept when:** On-time acceptance matches AC-ASG-01 and the stored receipt time.
- [ ] **UAT-04.02** — Start upload at 09:59; accept finalization at 10:00:01 with late disabled. **Accept when:** Request is rejected as closed; uploaded bytes alone do not constitute a submission.
- [ ] **UAT-04.03** — Enable late submissions through 11:00; test 10:00:01, 11:00:00 and 11:00:01. **Accept when:** First two are Late if otherwise eligible; the last is rejected.
- [ ] **UAT-04.04** — Replay a confirmed operation after closing time. **Accept when:** Original authorized outcome is returned; no new acceptance time or attempt is recorded.
- [ ] **UAT-04.05** — Withdraw the student after upload and before finalization; also test the reversed committed order. **Accept when:** Withdrawal first prevents new confirmation; a previously committed attempt remains valid and own-history access follows policy.
- [ ] **UAT-04.06** — Submit until the allowed count, then exceed it; race distinct operations for the last attempt. **Accept when:** At most the allowed number is confirmed; earlier attempts remain immutable and excess attempts fail.
- [ ] **UAT-04.07** — Review attempt 1, submit attempt 2, then try to publish feedback for attempt 1. **Accept when:** Stale review is rejected and staff must refresh to the current attempt.
- [ ] **UAT-04.08** — Publish feedback, then attempt resubmission even with time and attempts remaining. **Accept when:** Published feedback locks further attempts.
- [ ] **UAT-04.09** — Run both authoritative orderings of assignment archive and finalization. **Accept when:** Finalization committed first remains valid; archive committed first prevents finalization.
- [ ] **UAT-04.10** — Review lock-wait boundary evidence with the technical lead. **Accept when:** Acceptance uses the approved post-wait database wall clock; request arrival does not reserve an earlier deadline.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-05 — Review, publish and correct feedback

**Executor:** Assigned teacher and academic reviewer. **PRD coverage:** ASG, AUD. **Test-plan evidence:** TC-024/025/038/055.

**Preparation:** Confirmed attempts; teacher assigned; separate student session; publication grant.

- [ ] **UAT-05.01** — Open the submission roster and inspect current and earlier attempts. **Accept when:** Submitted/not-submitted state is accurate; exact historical work is accessible only to authorized staff.
- [ ] **UAT-05.02** — Save feedback as a draft, then inspect the student view. **Accept when:** Draft is hidden and no publication notification is emitted.
- [ ] **UAT-05.03** — Publish feedback against the current reviewed attempt. **Accept when:** Student sees the published feedback for the correct attempt; staff can identify author/time/revision.
- [ ] **UAT-05.04** — Try stale publication after a newer current attempt appears. **Accept when:** Conflict prevents feedback being attached as current to the wrong attempt.
- [ ] **UAT-05.05** — Draft a correction and inspect the student view before republishing. **Accept when:** Existing published feedback stays visible; unpublished correction is hidden.
- [ ] **UAT-05.06** — Publish the correction with a reason, then review history. **Accept when:** Latest published feedback appears; prior/new values, author, time and reason are retained in authorized audit.
- [ ] **UAT-05.07** — Try correction without a reason or by an unassigned teacher. **Accept when:** Invalid or unauthorized write is rejected without changing visible feedback.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-06 — Publish and correct assessment results

**Executor:** Academic publisher and student. **PRD coverage:** RES; JRN-04; AC-RES-01–05. **Test-plan evidence:** TC-026–029/063–066.

**Preparation:** Valid assessment/roster; distinct draft and published result fixtures.

- [ ] **UAT-06.01** — Create exam details and publish the schedule without publishing scores. **Accept when:** Upcoming exam is visible while draft scores remain hidden; invalid maximum/time bounds are rejected.
- [ ] **UAT-06.02** — Enter Scored, Absent and Exempt results; try negative/excess marks, numeric marks for Absent/Exempt and duplicate identity. **Accept when:** Only valid result states are saved; zero is accepted as a scored value.
- [ ] **UAT-06.03** — Preview a publication cohort with a missing or invalid selected result and attempt publication. **Accept when:** Unresolved students are explicit to staff; selected batch is not partially published.
- [ ] **UAT-06.04** — Publish a valid selected batch, then try a stale preview and a lost-response replay. **Accept when:** All selected results appear together; stale input conflicts; replay of the successful operation does not republish a new revision.
- [ ] **UAT-06.05** — Check published 40/50 plus 60/100 and separate scored 0/50. **Accept when:** Combined value is 66.67%; scored zero is 0.00% and remains present data.
- [ ] **UAT-06.06** — Check 40/50 plus Absent, and a fixture containing only Absent/Exempt. **Accept when:** First is 80.00% with separate absence count; second is N/A; neither is presented as a final grade.
- [ ] **UAT-06.07** — Check 40/50 published plus 90/100 draft and switch term/subject filters. **Accept when:** Only published included records affect rows/totals; value is 80.00% and incomplete; draft values never leak.
- [ ] **UAT-06.08** — Draft then publish a score correction with a reason. **Accept when:** Prior value remains visible until publication; new revision updates the summary and audit preserves history.
- [ ] **UAT-06.09** — Withdraw an erroneous publication with a reason. **Accept when:** Affected value disappears from student totals; incomplete coverage is clear and audit remains available.
- [ ] **UAT-06.10** — Review labels and another student’s result URL. **Accept when:** No invented GPA/rank/pass-fail/final grade; other-student values, counts and downloads are inaccessible.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-07 — Finalize and correct attendance

**Executor:** Assigned teacher and student. **PRD coverage:** ATT; JRN-04; AC-ATT-01–05. **Test-plan evidence:** TC-030–032/067–069.

**Preparation:** Started eligible sessions; 12-session calculation fixture and boundary memberships.

- [ ] **UAT-07.01** — Save partial attendance draft and inspect student history. **Accept when:** Draft statuses are hidden; unselected students are not silently marked Absent.
- [ ] **UAT-07.02** — Finalize the prepared roster and check 8P, 1L, 1A, 2E. **Accept when:** Student sees finalized statuses, 90.00%, coverage 12/12 and Excused count 2.
- [ ] **UAT-07.03** — Add a thirteenth eligible started session with no finalized record. **Accept when:** Summary is 90.00% provisional, coverage 12/13 and missing count 1.
- [ ] **UAT-07.04** — Check only two Excused, only one Absent and no eligible sessions. **Accept when:** Results are N/A with coverage 2/2, 0.00%, and a clear no-data/N/A state respectively.
- [ ] **UAT-07.05** — Cancel the Absent session in the complete fixture. **Accept when:** Summary becomes 100.00% with coverage 11/11; cancellation does not erase audit history.
- [ ] **UAT-07.06** — Correct a finalized status with a reason and inspect both history and summary. **Accept when:** Current finalized status and totals update together; authorized audit preserves old/new/reason.
- [ ] **UAT-07.07** — Attempt regular entry for future/not-started/canceled sessions or duplicate student/session records. **Accept when:** Invalid writes are rejected; no duplicate or premature attendance appears.
- [ ] **UAT-07.08** — Test enrollment start and withdrawal boundary sessions and a membership correction. **Accept when:** Eligibility follows the approved interval [start, withdrawal); coverage and totals recalculate consistently.
- [ ] **UAT-07.09** — Switch date/class filters and student accounts. **Accept when:** Rows and summary use the same eligible selection; other-student or draft records are not disclosed.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-08 — Publish notices and read notifications

**Executor:** Staff publisher and student. **PRD coverage:** NOT, PERM; JRN-05. **Test-plan evidence:** TC-033–035/070.

**Preparation:** Scoped notice publisher; class audience; read/unread and membership-change fixtures.

- [ ] **UAT-08.01** — Save a notice draft and inspect student notices and notification count. **Accept when:** No student visibility or notification occurs before publication.
- [ ] **UAT-08.02** — Publish to the approved audience and inspect intended and unrelated students. **Accept when:** Only eligible recipients receive the notice/notification; unrelated class data is absent.
- [ ] **UAT-08.03** — Open a notification and mark it read, then restart the client. **Accept when:** Read status persists and unread count updates consistently without affecting another student.
- [ ] **UAT-08.04** — Retry publication and replay worker delivery using controlled QA support. **Accept when:** No duplicate user notification is created for the same event/recipient.
- [ ] **UAT-08.05** — Withdraw membership after publication and try an old link. **Accept when:** Current access is enforced at read/download time; prior delivery does not bypass withdrawal policy.
- [ ] **UAT-08.06** — Add a member after the original event and review QA recipient evidence. **Accept when:** Historical event delivery follows the recorded event-time recipient rule, without inventing retroactive notifications.
- [ ] **UAT-08.07** — Expire/archive a notice and open its notification target. **Accept when:** The approved unavailable state is understandable; archived/private content is not leaked.
- [ ] **UAT-08.08** — Measure event-to-visible time against the approved target and inspect failed-worker recovery evidence. **Accept when:** Target is met on the approved profile; retries/fencing prevent duplicate effects and stalled work is observable.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-09 — Manage profile, preferences and shared-device sessions

**Executor:** Student and design/QA reviewer. **PRD coverage:** PRO, AUTH, UX. **Test-plan evidence:** TC-008/016/023/037/041/072.

**Preparation:** Two distinct accounts; approved language/device matrix; selected recovery method.

- [ ] **UAT-09.01** — Edit allowed profile preferences, save and restart. **Accept when:** Allowed changes persist; school-controlled identity/enrollment fields are protected.
- [ ] **UAT-09.02** — Exercise invalid inputs and the approved account recovery flow. **Accept when:** Clear validation and recovery messages appear; valid recovery works while expired/reused credentials fail without account disclosure.
- [ ] **UAT-09.03** — Navigate with keyboard and the selected screen reader; zoom and use narrow layout. **Accept when:** Focus order, names, errors and status announcements are usable; content/actions remain reachable.
- [ ] **UAT-09.04** — Review every approved language with long names and text. **Accept when:** Labels, deadlines and validation are understandable; no missing glyphs, clipping or misleading fallback.
- [ ] **UAT-09.05** — Try leaving an unsaved form and recover from a server/network error. **Accept when:** User understands unsaved changes and can retry safely; destructive or duplicate actions are not accidental.
- [ ] **UAT-09.06** — Log out STUD-A, use Back/reload, then sign in STUD-B. **Accept when:** Old protected data and files are not available from client cache; the new account shows only its own records.
- [ ] **UAT-09.07** — Expire/revoke a session during use and resume authentication. **Accept when:** Protected actions stop; reauthentication returns safely without leaking prior data or falsely confirming pending work.
- [ ] **UAT-09.08** — Open settings, support links and all visible navigation controls. **Accept when:** Supported actions work and support contact/hours are accurate; deferred features do not appear as working controls.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-10 — Verify role and record privacy

**Executor:** Security reviewer with school representatives. **PRD coverage:** PERM, AUD, NFR-07. **Test-plan evidence:** TC-010/038/043; all applicable API negative profiles.

**Preparation:** Role/resource matrix; foreign institution, class, student and file fixtures.

- [ ] **UAT-10.01** — As STUD-A, change record IDs, filters and links to STUD-B’s work/results/attendance. **Accept when:** No unauthorized list, record, count, mutation or file bytes are returned.
- [ ] **UAT-10.02** — As an unassigned teacher, restricted support user and setup-only admin, try privileged academic actions. **Accept when:** Each account is limited to its actual grants, including publication and audit access.
- [ ] **UAT-10.03** — Use withdrawn, disabled and pending accounts against current resources and confirmed historical records. **Accept when:** Withdrawal allows only approved own history for an active account; disabled/pending accounts do not gain protected access.
- [ ] **UAT-10.04** — Use an institution-B resource ID through institution-A sessions and references. **Accept when:** Cross-institution reads, joins, counts and writes are blocked, even though the pilot uses one institution.
- [ ] **UAT-10.05** — Review file access before/after membership change, via old URL and by guessing upload/object references. **Accept when:** Only an authorized typed resource reference releases exact permitted bytes; staging/foreign/revoked files remain private.
- [ ] **UAT-10.06** — Review failed authorization, publication and correction audit samples. **Accept when:** Useful actor/action/time/reason evidence exists within approved access; shared logs contain no secrets or unnecessary academic content.
- [ ] **UAT-10.07** — Inspect security evidence for every applicable route profile, session/CSRF enforcement and cache isolation. **Accept when:** All required negative cases pass for the candidate; a hidden button is not accepted as backend authorization proof.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

### UAT-11 — Accept pilot operations and release evidence

**Executor:** Product, QA, technical and service owners. **PRD coverage:** OPS, DATA, NFR. **Test-plan evidence:** TC-039/042/044–048/071.

**Preparation:** Named candidate; approved targets; isolated recovery environment; service ownership.

- [ ] **UAT-11.01** — Reconcile pilot identities, classes, memberships and academic reference data. **Accept when:** Source counts and sampled values agree; unresolved discrepancies are recorded and block affected onboarding.
- [ ] **UAT-11.02** — Review performance results for the approved population, traffic, file and device profile. **Accept when:** Measured percentiles meet approved targets; resources, duration, errors and contention are documented.
- [ ] **UAT-11.03** — Review monitoring/alert evidence using a controlled failure and recovery. **Accept when:** Correct service owner receives actionable alerts through the configured process; recovery clears the condition.
- [ ] **UAT-11.04** — Review a restore rehearsal of database plus confirmed object versions. **Accept when:** Receipts/history and exact confirmed file hashes are recoverable together; measured RPO/RTO meet approved targets.
- [ ] **UAT-11.05** — Check restored-session revocation and replayed background work in the recovery environment. **Accept when:** Old credentials cannot regain access; worker replay does not duplicate visible effects.
- [ ] **UAT-11.06** — Review deployment/migration and rollback rehearsal evidence for the named candidate. **Accept when:** Compatible schema/code paths and rollback triggers are recorded; failed rollout can be contained without losing confirmed work.
- [ ] **UAT-11.07** — Walk through support intake, severity triage, escalation and handover. **Accept when:** Named owner, hours, runbook, incident responsibilities and maintenance coverage are ready.
- [ ] **UAT-11.08** — Complete acceptance review and the rollout handoff record. **Accept when:** Go/no-go is tied to the candidate and scope; production smoke/monitoring are scheduled as separate rollout gates and are not claimed as already passed.

**Group result:** NOT RUN. **Execution/evidence records:** Pending. **Defects/blockers:** Pending execution. **Reviewer/date:** Pending.

## 7. Cross-cutting completion matrix

QA expands each matrix row into the applicable child-check variants before execution. A single desktop/English success does not imply all approved clients or languages pass.

| Dimension | Apply to | Required evidence | Status |
|---|---|---|---|
| Approved browsers/devices/orientations | UAT-02/03/06/07/08/09 | Candidate and device-specific journey records | NOT RUN |
| Approved languages, long names and school timezone | UAT-01/02/03/06/07/09 | Localized screenshots, input and boundary outcomes | NOT RUN |
| Keyboard, screen reader, zoom, focus and status messages | UAT-02/03/06/07/09 | UX/QA accessibility results plus participant observations | NOT RUN |
| Loading, empty, partial error, retry, unavailable | Student list/detail and staff publication flows | Meaningful states without false completion or leakage | NOT RUN |
| Offline/lost response/restart | UAT-03/05/06/08/09 | Reconciled durable outcomes and no duplicates | NOT RUN |
| Current grant, withdrawal and foreign ownership | All protected journeys | UI observations and corresponding API denial evidence | NOT RUN |
| Decimal, time and coverage accuracy | UAT-04/06/07 | Exact fixtures and approved oracle comparison | NOT RUN |
| Corrections, publication and audit | UAT-05/06/07/08/10 | Versioned visibility and authorized audit records | NOT RUN |

Collect participant observations separately: task attempted, whether completed without assistance, assistance required, confusing wording/navigation, impact, proposed improvement and defect/reference. Usability feedback does not override a failed functional or security check. Participant counts and success targets must follow the approved pilot plan; none are invented here.

## 8. Supporting QA and operational evidence gates

These gates must be accepted before release readiness, including when the school representatives cannot personally execute the underlying checks.

- [ ] EVD-01: Required PRD requirement coverage in test plan Section 19 is complete for the candidate, including all Must acceptance cases.
- [ ] EVD-02: All 136 currently specified API operations have the applicable profile results; any contract change updates the matrix and affected UAT cases.
- [ ] EVD-03: Database/transaction evidence covers duplicate prevention, accepted-time ordering, stale revisions, atomic batches, membership guards and immutable confirmed work.
- [ ] EVD-04: File evidence covers validation, limits, authorization, exact object version, scanner lifecycle and cleanup/reference races.
- [ ] EVD-05: Outbox/retry evidence covers event-time recipients, current read permission, deduplication, leases/fencing and failed-worker recovery.
- [ ] EVD-06: Security/session/CSRF and client-cache tests pass with no unresolved confirmed disclosure or integrity issue.
- [ ] EVD-07: UX/accessibility evidence covers the approved platform/language matrix and relevant error/empty/loading states.
- [ ] EVD-08: Approved performance/load targets are met with representative concurrency; a short test is not presented as proof of monthly availability.
- [ ] EVD-09: Restore, migration and rollback rehearsal evidence is accepted, with measured recovery times and confirmed file verification.
- [ ] EVD-10: Support, alerts, pilot cohort, rollout smoke plan and accountable owners are ready.

Reference proposals in the test plan include 100 concurrent users, 20 metadata requests/second with 10 concurrent uploads; p95 read 1 second, dashboard 2 seconds and finalization 2 seconds after files are Ready; client 3 seconds at the specified network profile; 95% notification visibility within 60 seconds; RPO 24 hours and RTO 4 hours. These are not automatic school commitments. Record the approved baseline and evidence; if targets change, update dependent documents and cases before execution.

## 9. Defects, blockers and retesting

| Severity | Business meaning | Acceptance treatment |
|---|---|---|
| Critical | Unauthorized disclosure, broad corruption/loss or unusable service without workaround | Stop affected execution, contain and fix; no release with unresolved exposure/integrity failure |
| High | Core journey fails for affected users with no acceptable workaround | Blocks acceptance of the affected release scope |
| Medium | Constrained failure with a reviewed viable workaround | Requires explicit product/QA/release acceptance, owner and planned fix |
| Low | Cosmetic or minor friction without blocked completion | Record and prioritize; explicit acceptance if left open |

Critical/High release blockers must be resolved or removed through an explicit scope change that actually eliminates the failing journey and its exposure. A risk waiver alone cannot make a failed required check pass. Confirmed exposure/integrity incidents require resolution; a cosmetic scope note does not remove their effects.

For each defect record: defect reference, UAT child/TC/requirement references, candidate/environment/fixture, role, exact steps, expected/actual, safe evidence, severity, priority, impact, workaround, owner, fix version, retest result and reviewer. Severity measures impact; priority determines scheduling. Never lower severity just to meet a date.

Proposed workflow: New → Triaged → In progress → Ready for retest → Verified → Closed. Reopen if the observed outcome still fails. Blocked cases carry a blocking decision/environment/dependency reference and owner. They stay in the required coverage denominator.

Retest the original failing fixture and relevant negative/adjacent cases on the new candidate. For changes affecting auth, enrollment, file lifecycle, acceptance timing or shared transactions, QA identifies all impacted journeys and reruns them. Preserve earlier failure evidence; do not overwrite it with the later PASS. Unaffected prior evidence may be reused only with documented impact analysis and reviewer acceptance tied to the final candidate.

## 10. Suspension and resumption

Suspend affected execution if the deployed build differs from the run header, the environment is unstable, fixtures are corrupted, source rules conflict, a provider/recipient is uncontrolled, or a confidentiality/integrity incident invalidates safe testing. Record discovery time, reason, affected checks and containment owner.

Resume after the owner restores the environment/fixtures, resolves the baseline conflict or incident, and QA confirms the necessary baseline checks. Create a new run or version when needed. Preserve invalidated evidence as historical, not passing release evidence.

## 11. Acceptance summary

At issue: all journey checks are NOT RUN; actual results, defects and approvals have not been collected. Populate counts from child execution records, including every required platform/language variant.

| UAT group | Result | Evidence / defects | Business reviewer |
|---|---|---|---|
| UAT-01 — Prepare accounts and academic setup | NOT RUN | Pending execution | Pending |
| UAT-02 — Find the learning day and materials | NOT RUN | Pending execution | Pending |
| UAT-03 — Submit work and recover a lost response | NOT RUN | Pending execution | Pending |
| UAT-04 — Enforce deadlines, attempts and access changes | NOT RUN | Pending execution | Pending |
| UAT-05 — Review, publish and correct feedback | NOT RUN | Pending execution | Pending |
| UAT-06 — Publish and correct assessment results | NOT RUN | Pending execution | Pending |
| UAT-07 — Finalize and correct attendance | NOT RUN | Pending execution | Pending |
| UAT-08 — Publish notices and read notifications | NOT RUN | Pending execution | Pending |
| UAT-09 — Manage profile, preferences and shared-device sessions | NOT RUN | Pending execution | Pending |
| UAT-10 — Verify role and record privacy | NOT RUN | Pending execution | Pending |
| UAT-11 — Accept pilot operations and release evidence | NOT RUN | Pending execution | Pending |

| Metric | At issue / fill after execution |
|---|---|
| Baseline child checks | 89 |
| Additional required variants | Pending approved execution matrix |
| Passed / Failed / Blocked | 0 / 0 / 0 |
| Not run baseline checks | 89 |
| Removed by approved scope change | 0 |
| Open Critical/High/Medium/Low defects | Not assessed |
| Entry / evidence / exit gates completed | 0; not verified |
| Acceptance decision | PENDING |

For reporting, required population = baseline child checks plus required variants minus explicitly approved removals. Show PASS, FAIL, BLOCKED and NOT RUN counts separately and reconcile their sum to the required population. Never exclude blocked/unrun checks to manufacture a passing percentage. Open defects are not assumed to be zero just because testing has not begun.

## 12. Exit checklist and decision

- [ ] EXT-01: Every applicable UAT-01–11 child check and required variant has passed on the accepted baseline.
- [ ] EXT-02: Required Must requirements and EVD-01–10 supporting evidence gates are accepted.
- [ ] EXT-03: No unresolved Critical/High blocker or confirmed disclosure/integrity issue remains in release scope.
- [ ] EXT-04: Remaining Medium/Low issues have impact, workaround, owner, planned fix and explicit product/QA/release acceptance.
- [ ] EXT-05: Dependent school policies, scope decisions, pilot cohort and named service owners are approved.
- [ ] EXT-06: Roster/data reconciliation, support/training and operational handover are complete.
- [ ] EXT-07: Migration/restore/rollback rehearsals passed and production smoke/monitoring responsibilities are assigned.
- [ ] EXT-08: Final candidate identity, configuration, baseline, evidence and reviewer decisions are recorded together.

Decision options: **ACCEPTED FOR ROLLOUT REVIEW**, **REJECTED**, or **PENDING**. Acceptance for rollout review requires all exit checks. Accepted nonblocking defects are listed explicitly. PENDING includes missing evidence or required blocked/unrun cases; it is not conditional permission to release.

| Decision record | Value |
|---|---|
| Candidate / configuration / approved scope | Pending |
| Decision and date/time | PENDING |
| Evidence index and execution summary | Pending |
| Accepted nonblocking defects and workaround approvals | Pending assessment |
| Rejected/blocked items, owners and due dates | Pending assessment |
| Scope changes and approval references | None recorded |
| UAT coordinator recommendation | Pending |
| Business acceptance owner decision | Pending |

## 13. Sign-off and rollout handoff

| Signatory | What the sign-off confirms | Name / decision / timestamp / evidence |
|---|---|---|
| School product owner | Accepted user journeys and approved scope | Pending |
| Academic authority | Assignment, results, attendance and correction rules | Pending |
| School administrator / data owner | Reconciled pilot roster and authorized setup | Pending |
| QA lead | Complete execution, defect disposition and traceability | Pending |
| Product/design representative | Usability and approved client/language evidence | Pending |
| Technical/database lead | Integrity, contract, migration and restore evidence | Pending |
| Identity/security reviewer | Access, session, files and remaining security findings | Pending |
| Service/release owner | Support, recovery, rollout gates and operational ownership | Pending |

Record actual reviewer decisions; typed role labels in this template are not signatures. A candidate/configuration or material scope change triggers impact review and renewed acceptance where prior evidence is invalidated.

UAT acceptance is an input to the authorized rollout process. Production smoke and monitoring checks occur during deployment and cannot be marked passed in advance. The release owner records the deployment decision separately, executes the approved smoke checks, and confirms health before widening pilot access. Failed smoke/monitoring invokes the approved stop/rollback process even if UAT previously passed.

Handoff package: accepted candidate/digest and configuration; completed run/variant records; requirement and API test coverage; open issue approvals; roster reconciliation; training/support contacts; migration/restore/rollback evidence; smoke and monitoring plan; named approvers. Keep recovery secrets and credentials in their approved secure location, not in this package.

## 14. Document maintenance and references

Changes to product rules, API contracts, database invariants, permissions, device/language support, fixtures or operational targets require an impact review. Update child checks and mappings with stable IDs; add IDs for new behavior rather than silently reusing a previous ID for unrelated behavior. Archive prior execution records with their baseline and approval history.

| Version | Date | Change |
|---|---|---|
| 0.1 | 10 September 2026 | Initial complete UAT checklist covering the 11 PRD journeys, child acceptance checks, execution evidence, operational gates and sign-off |

Companion documents: [02_prd.md](02_prd.md), [03_ux_ui_spec.md](03_ux_ui_spec.md), [04_sdd.md](04_sdd.md), [05_database_spec.md](05_database_spec.md), [06_openapi.yaml](06_openapi.yaml), [07_developer_guide.md](07_developer_guide.md), [08_jira_backlog.md](08_jira_backlog.md), [09_test_plan.md](09_test_plan.md).
