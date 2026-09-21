---
title: "Student Learning App — Full Workflow from Zero to Production"
---

# Student Learning App — Full Workflow from Zero to Production

Status: proposed delivery playbook. This guide describes the work to perform; it does not indicate that a system has been built or deployed.

Scope: student app with Home, Classes, Assignments, Results, Attendance, Profile, and Notifications, plus the teacher/admin capabilities needed to manage that data. Based on the implementation plan provided in the conversation. Technology choices, dates, and capacity must be confirmed during planning.

## 1. Delivery overview

Discovery → PRD → UX/UI → SDD + ERD + API specification → Jira backlog → Git and environments → Development → Code review → QA → UAT → Release readiness → Production deployment → Monitoring and maintenance.

Work overlaps: QA planning begins with requirements; infrastructure and CI begin before feature development; documentation changes alongside implementation. Failed gates return work to the relevant earlier stage.

| Stage | Primary owner | Main output | Completion gate |
|---|---|---|---|
| Discovery | Product owner | Problem statement and MVP scope | Users, goals, boundaries agreed |
| Requirements | Product owner / analyst | PRD and acceptance criteria | Business rules approved |
| UX/UI | Designer | Screen flows and component designs | Main and failure paths reviewed |
| Technical design | Technical lead | SDD, ERD, API specification | Contracts and architecture reviewed |
| Planning | Delivery lead and team | Jira epics, stories, estimates | First implementation stories ready |
| Engineering setup | Developers / operations | Repository, CI, environments | Clean setup and sample deploy work |
| Development | Developers | Tested feature increments | Acceptance criteria implemented |
| Review | Peer reviewer | Approved merge request | Required checks pass |
| QA | QA engineer | Test results and defect records | Release test scope passes |
| UAT | Product owner and school representatives | Business acceptance | End-to-end workflows accepted |
| Release readiness | Release owner | Release and rollback package | Go/no-go criteria satisfied |
| Production | Release owner / operations | Verified live release | Smoke tests and health checks pass |
| Operations | Service owner | Monitoring, support, maintenance | Ongoing ownership established |

One person may fill several roles in a small team, but each decision and gate still needs a named owner.

## 2. Step 0 — Define the problem and MVP

1. Identify users: students, teachers, school administrators, and support staff.
2. Document the current problem and the main student journey.
3. Agree the launch scope: one school or multiple schools, supported languages, delivery platforms, and supported devices.
4. Identify the source of students, teachers, classes, enrollments, and historical records: manual entry, import, or an existing school system.
5. Establish team capacity, dependencies, budget boundaries, decision makers, and a target release window.
6. Select measurable success indicators such as successful sign-ins, successful assignment submissions, and support incidents. Agree targets before implementation.

MVP: a student can sign in, view enrolled classes and schedule, access materials, submit assignments, view published results and attendance, receive notices, and log out. Teachers/admins can maintain the data needed for these journeys.

Possible later scope: payments, live video classes, parent accounts, chat, advanced analytics, and offline synchronization. Include these only through an explicit scope decision.

**Output:** project brief, scope boundaries, stakeholder list, initial risks, and success measures.

## 3. Step 1 — Write the PRD

The Product Requirements Document explains what to build and why.

Include purpose, user roles, user journeys, functional requirements, business rules, nonfunctional requirements, acceptance criteria, dependencies, exclusions, and open questions. Give requirements stable IDs such as `REQ-ASG-001` for traceability.

| Area | Rules to agree |
|---|---|
| Accounts | Who creates accounts? How are users activated, recovered, and disabled? |
| Enrollment | Who assigns students to classes? What happens after withdrawal? |
| Assignments | Deadline timezone, late submission policy, resubmission policy, file limits, and meaning of Completed |
| Results | Score ranges, weighting, rounding, pass rules, publication, corrections, and rank visibility |
| Attendance | Present, absent, late, excused, cancellation, and percentage denominator |
| Privacy | Student access to classmates, teacher access scope, and school isolation if applicable |
| Notifications | Trigger events, channels, read state, and whether reminders are in-app or calendar events |
| Profile | Editable fields, approved changes, and one consolidated profile design |

Keep submission status separate from grading status. A submitted assignment can still be ungraded. Show progress percentages only when a meaningful numerator and denominator exist.

Example acceptance criteria for assignment submission:

- Given an active student enrolled in the class, when an allowed file is submitted within the permitted submission window, the system stores the submission and returns confirmation.
- A student outside the class cannot access the assignment or submit work to it.
- Disallowed or oversized files produce a clear error without creating a completed submission.
- Retrying the same submission request does not create unintended duplicates.
- The displayed submission time follows the agreed timezone policy.

**Gate:** product owner approves scope and business rules; unresolved launch-blocking questions have owners and decisions.

## 4. Step 2 — Complete UX and UI specifications

1. Map navigation across Login, Home, Classes, Assignments, Results, Attendance, Profile, and Notifications.
2. Complete class detail tabs: Overview, Assignments, Materials, and Students if permitted.
3. Design the teacher/admin workflows for enrollment, assignment publishing, grading, attendance, and result publication.
4. Define reusable typography, colors, spacing, buttons, inputs, cards, badges, and navigation.
5. Specify loading, empty, error, validation, expired-session, offline, upload-progress, and retry states.
6. Review accessibility, readable text, touch targets, keyboard support where relevant, and small-screen behavior.
7. Add final field labels, validation messages, permissions, and acceptance references to the designs.

**Output:** reviewed screen designs, interaction flows, component inventory, and annotated behavior.

## 5. Step 3 — Write the SDD and architecture decisions

The Software Design Document explains how the system will implement the PRD.

Define the client applications, backend modules, database, private file storage, background jobs, notification delivery, external integrations, and deployment topology. Choose the stack based on team skills and hosting constraints; record the decision and rationale rather than assuming a framework from the mockups.

Document:

- Module boundaries, dependencies, request flows, and background processing.
- Authentication lifecycle, session expiry, logout/revocation, recovery, and role enforcement.
- Authorization for each resource: own student records, assigned teacher classes, and administrator scope.
- Transactions, uniqueness constraints, retry behavior, duplicate prevention, and concurrency handling.
- File upload validation, private download access, cleanup of failed uploads, and retention.
- Error handling, structured logs, request correlation, audit events, and sensitive-data redaction.
- Configuration, secrets, DEV/UAT/PROD separation, migrations, backups, and restore procedures.
- Measurable reliability, latency, capacity, recovery-time, and acceptable data-loss targets.

**Output:** SDD, architecture diagrams where useful, and short architecture decision records.

## 6. Step 4 — Design the database

| Domain | Initial entities |
|---|---|
| Identity | users, roles, user_roles, student_profiles, teacher_profiles, schools |
| Academics | academic_years, terms, subjects, classes, class_enrollments, class_teachers |
| Schedule | class_sessions, attendance_records |
| Assignments | assignments, assignment_attachments, assignment_submissions, submission_files |
| Materials | class_materials |
| Assessment | exams, exam_results |
| Communication | notices, notifications, notification_reads |
| Audit | audit_logs |

This is a starting model, not final executable DDL. Adjust it for the agreed account, tenancy, and grading rules.

1. Draw the ERD with keys, relationships, and cardinalities.
2. Write a data dictionary with types, nullability, defaults, permitted values, ownership, and meaning.
3. Define uniqueness rules: enrollment membership, attendance per student/session, and result identity according to the exam/attempt model.
4. Decide whether resubmissions replace a draft or create immutable attempts; make constraints match that decision.
5. Define timestamps and timezone conversion rules, archival/deletion rules, indexes for expected queries, and audit requirements.
6. Create versioned migrations and non-sensitive seed data.
7. Test migrations against an empty database and a representative previous schema.

**Gate:** ERD supports the workflows; constraints protect core integrity; migration and recovery plans are reviewed.

## 7. Step 5 — Define the API contract

Prepare a machine-readable API specification and usable request examples before parallel client/backend implementation.

| Group | Example responsibilities |
|---|---|
| `/auth` | Sign in, refresh, sign out, recovery |
| `/me` | Profile and preferences |
| `/dashboard` | Today’s schedule, next exam, summary |
| `/classes` | Enrollment-scoped list, details, sessions, materials |
| `/assignments` | Details, submissions, submission history |
| `/results` | Published results by term and subject |
| `/attendance` | Personal records and summary |
| `/notifications` | List, unread count, read state |
| `/notices` | School/class announcements |
| Teacher/admin operations | Manage classes, enrollment, materials, assignments, attendance, and results |

For each endpoint specify method, path, authentication, role and resource access, fields and types, validation, response schema, errors, pagination, sorting, filtering, and examples. Include timezone representation, null behavior, upload protocol, retry/idempotency behavior, and rate-limit behavior where applicable.

Use consistent conventions, such as `GET /api/v1/classes` and `POST /api/v1/assignments/{id}/submissions`. These are proposed examples, not existing endpoints.

**Gate:** client, backend, and QA agree the contract; mocks support development; breaking changes have a review process.

## 8. Step 6 — Translate requirements into Jira work

Use epics for capability areas, stories for user value, tasks for standalone technical work, subtasks for implementation pieces, and bugs for defects. Example issue key prefix: `SLP`; replace with the actual project key.

| Epic | Example story |
|---|---|
| Foundation | Developer can start the application using documented setup |
| Authentication | Student can sign in and recover access |
| Academic administration | Administrator can enroll students and assign teachers |
| Classes and Home | Student can view enrolled classes and today’s schedule |
| Assignments | Student can submit work and see confirmation |
| Academic records | Student can view published results and attendance |
| Communication | Student can read class notices |
| Release and operations | Operator can deploy, monitor, and recover the service |

Every story should contain objective, scope in/out, PRD/design/API references, acceptance criteria, affected components, dependencies, test notes, owner, estimate, and target release.

For “Submit assignment,” subtasks might include database migration, submission API, upload service, client screen, retry handling, automated tests, and QA execution.

Suggested workflow: Backlog → Ready → In Progress → Code Review → Ready for QA → In QA → Done. Track UAT and deployment status at release level so Done is not confused with already live.

**Definition of Ready:** acceptance criteria are testable, relevant designs/contracts exist, dependencies are identified, and major questions are resolved.

**Definition of Done:** implementation reviewed, required CI and QA pass, permissions and failure paths verified, documents updated, and release impact recorded.

## 9. Step 7 — Set up Git and engineering conventions

1. Choose a monorepo or separate repositories and document component ownership.
2. Add README, setup instructions, coding conventions, example environment configuration, ignore rules, and merge-request template.
3. Protect the main branch; require review and required CI checks.
4. Use short-lived issue-linked branches, for example `feature/SLP-123-assignment-submit` or `fix/SLP-241-result-rounding`.
5. Link commits and merge requests to Jira. Example commit: `SLP-123 Add assignment submission validation`.
6. Keep migrations, API contracts, tests, and relevant documentation in version control.
7. Keep credentials, private keys, production exports, and personal data out of Git.
8. Tag releases and record the commit plus build identifier used for each deployment.

Merge requests should state the problem, changed behavior, issue link, test evidence, screenshots where relevant, database/configuration impact, and rollback considerations.

## 10. Step 8 — Prepare environments and CI/CD

| Environment | Purpose | Data |
|---|---|---|
| Local | Individual development | Synthetic seed data |
| DEV | Continuous integration of features | Shared test data |
| UAT / staging | Release validation | Representative anonymized or synthetic data |
| PROD | Live service | Controlled live data |

Separate databases, file storage, credentials, and notification destinations. Make staging configuration representative of production. Prevent test jobs from sending messages to real students.

CI should install locked dependencies, lint/format-check, run relevant automated tests, validate/build clients and server artifacts, and check for secrets and vulnerable dependencies according to team policy.

CD should produce a traceable versioned artifact, deploy it to staging, run smoke checks, record release acceptance, and promote the tested artifact to production. Environment-specific client builds must be traceable to the tested source and receive their own validation where behavior differs.

Prepare HTTPS, domain configuration, secrets, health checks, storage permissions, background workers, scheduled jobs, backups, logs, dashboards, and alerts before launch.

**Gate:** another developer can follow the README from a clean checkout; CI works; the skeleton application deploys successfully to a non-production environment.

## 11. Step 9 — Develop in dependency order

| Order | Increment | End-to-end completion example |
|---|---|---|
| 1 | Foundation and authentication | Student signs in; unauthorized access is rejected |
| 2 | Academic setup and enrollment | Admin creates class, assigns teacher, and enrolls student |
| 3 | Classes, sessions, materials | Enrolled student sees class schedule and authorized files |
| 4 | Home | Dashboard displays correct student-specific summaries |
| 5 | Assignments | Teacher publishes; student submits; teacher reviews or grades |
| 6 | Results and attendance | Teacher records; publication rules control student visibility |
| 7 | Profile, notices, notifications | Profile changes persist and notices reach the intended users |
| 8 | Hardening | Recovery, accessibility, performance, and operational behavior pass review |

Repeat this cycle for each story:

1. Review requirements, acceptance criteria, design, and API contract.
2. Create the issue-linked branch.
3. Implement schema changes, backend validation/authorization, and client behavior.
4. Handle loading, empty, error, retry, and expired-session cases.
5. Add meaningful automated coverage for rules and failure paths.
6. Verify locally with representative test accounts and data.
7. Update API examples, setup/configuration notes, and migration documentation.
8. Open a merge request and include evidence.
9. Address review feedback, pass CI, merge, and deploy to DEV for QA.

## 12. Step 10 — Review code and execute QA

Review correctness, maintainability, resource permissions, transaction boundaries, duplicate handling, database query behavior, error exposure, logs, and compatibility with existing clients.

QA should trace tests to acceptance criteria and record build/environment, test data, expected/actual behavior, and evidence. Defects include severity, reproduction steps, and retest outcome.

| Test area | Essential checks |
|---|---|
| Authentication | Wrong credentials, expiry, refresh, logout, disabled accounts, recovery |
| Authorization | Student A cannot read/change Student B’s work; unrelated teachers cannot manage classes |
| Assignments | Deadline boundaries, late policy, repeated taps, retries, interrupted upload, invalid file |
| Results | Zero possible marks, absent scores, weighted totals, rounding, draft vs published results |
| Attendance | Late/excused handling, canceled sessions, denominator consistency |
| UI | Main navigation, empty/error states, long text, supported devices and languages |
| Integration | Database/storage failures, worker retries, failed notification delivery |
| Performance | Representative class sizes, list pagination, peak submission load, agreed latency targets |
| Recovery | Migration rehearsal, backup restore, previous-artifact redeploy |

Run regression checks around changed functionality. A release candidate is ready for UAT when critical journeys pass and remaining defects are documented and acceptable for the planned release.

## 13. Step 11 — Run UAT

Use a tagged release candidate in staging with student, teacher, and administrator accounts. Have school representatives execute realistic workflows:

1. Administrator sets up a term, class, teacher, and student enrollment.
2. Teacher creates a session, uploads material, and publishes an assignment.
3. Student signs in, checks the schedule, downloads material, and submits work.
4. Teacher reviews the submission, records attendance, and publishes results.
5. Student sees only their authorized published records and relevant notices.
6. An unauthorized user is unable to access those records.

Capture feedback as defects or explicit scope changes. Fix launch blockers and retest affected workflows. Product owner records acceptance for the specific build and known limitations.

**Output:** UAT evidence, accepted defect list, and signed-off release candidate.

## 14. Step 12 — Prepare the release package

- Release version, immutable build/artifact ID, commit, and included Jira issues.
- Release notes, known limitations, and user/support guidance.
- Migration scripts, preflight queries, data import sequence, and expected duration.
- Configuration changes and secret requirements without exposing values.
- Deployment sequence, owner, window, validation steps, and communication plan.
- Database and file backup coverage with a successful restore rehearsal.
- Previous working artifacts and rollback/roll-forward procedures.
- Monitoring dashboard, alert routing, and incident owner.
- Initial administrator provisioning and verification that default/demo credentials are removed.
- For native mobile delivery: signing, versioning, distribution/store submission, and phased rollout preparation. Maintain API compatibility while old mobile versions remain installed.

Agree concrete go/no-go thresholds before release: required UAT pass, no unaccepted critical defects, healthy infrastructure, tested recovery, and staffed support. Set numerical operational thresholds appropriate to the application; do not invent them at deployment time.

## 15. Step 13 — Deploy to production

1. Confirm the exact approved version, environment, release owner, and deployment window.
2. Check service/database health, storage, backup availability, and required configuration.
3. Take the planned backup/checkpoint and record its identifier.
4. Apply compatible additive migrations in the rehearsed order. Schedule disruptive work explicitly.
5. Deploy the backend and required workers, then compatible web/admin clients; coordinate mobile rollout separately if applicable.
6. Run necessary data imports or backfills with reconciliation checks and safe retry behavior.
7. Run production smoke tests using controlled accounts and non-sensitive test records.
8. Verify login, own-class access, authorized file download, assignment submission, results visibility, and logout.
9. Check error rates, latency, database health, worker queues, and critical business failures against agreed thresholds.
10. Expand traffic/feature availability progressively where supported; pause if thresholds fail.
11. Record the deployed version, outcomes, and release decision; notify stakeholders through the approved communication process.

Prefer an expand-and-contract schema approach: add compatible structures, deploy compatible code, migrate data, and remove old structures only after old clients/code no longer need them.

## 16. Step 14 — Recover if deployment fails

1. Stop rollout and identify the failing component or feature.
2. Disable the affected feature or restrict writes if needed to protect consistency.
3. Redeploy the previous compatible application artifact and corresponding configuration, or apply a reviewed forward fix.
4. Check schema compatibility before reverting code. Do not assume reversing a migration preserves live writes.
5. Restore data only when necessary, with an explicit plan for writes since the backup and reconciliation of files/external effects.
6. Repeat smoke tests and monitor recovery.
7. Record the incident, affected users, timeline, root cause, and follow-up work.

Database restoration can discard newer writes; it is a separate recovery decision, not the default response to an application bug.

## 17. Step 15 — Operate and improve

During the agreed launch-support period, review failed sign-ins, submissions, uploads, permission errors, result discrepancies, slow queries, and failed jobs. Assign every actionable incident an owner.

Ongoing work includes backup/restore checks, access reviews, dependency maintenance, capacity planning, support triage, audit review, and measurement against the original success criteria. Move improvements into Jira and repeat the same delivery cycle.

The service owner maintains a runbook containing health checks, dashboards, alert handling, restart procedures, failed-job recovery, backup restoration, secret rotation, escalation contacts, and known operational limitations.

## 18. Document and traceability checklist

| Suggested file | Purpose |
|---|---|
| `01_project_brief.md` | Problem, users, MVP, constraints, ownership |
| `02_prd.md` | Requirements, business rules, acceptance criteria |
| `03_ux_ui_spec.md` | Design references, navigation, component and state behavior |
| `04_sdd.md` | Architecture, security, dependencies, design decisions |
| `05_database_spec.md` | ERD, dictionary, constraints, migrations |
| `06_openapi.yaml` | Executable API contract |
| `07_developer_guide.md` | Setup, coding standards, Git, CI |
| `08_jira_backlog.md` | Epics, stories, dependencies, implementation order |
| `09_test_plan.md` | Test scope, cases, environments, evidence |
| `10_uat_checklist.md` | Business scenarios and acceptance |
| `11_release_plan.md` | Deployment, validation, rollback, release notes |
| `12_operations_runbook.md` | Monitoring, recovery, support, maintenance |

These are suggested future project documents; this guide does not create or approve them individually.

Example traceability chain: `REQ-ASG-001` → assignment design → submission API contract → `SLP-123` → feature branch and merge request → QA case → UAT scenario → release artifact → production verification.

## 19. Final production-readiness checklist

- [ ] MVP scope and unresolved business rules are approved.
- [ ] PRD, designs, SDD, ERD, and API contract match the implemented behavior.
- [ ] Teacher/admin workflows can supply and maintain student-facing data.
- [ ] Resource-level authorization and file access are verified.
- [ ] Assignment, result, attendance, and timezone rules are tested.
- [ ] Required code review, CI, QA, and UAT gates pass for the release candidate.
- [ ] Live configuration, credentials, domain, HTTPS, storage, jobs, and alerts are prepared.
- [ ] Migrations, initial data, backups, restoration, and rollback are rehearsed.
- [ ] Release artifact, owner, deployment window, and go/no-go thresholds are recorded.
- [ ] Native mobile distribution and old-client compatibility are covered when applicable.
- [ ] Production smoke tests and health checks pass.
- [ ] Support ownership, monitoring, and the operations runbook are active.
