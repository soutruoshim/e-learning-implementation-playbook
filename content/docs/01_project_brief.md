---
title: "01 — Project Brief"
---

# 01 — Project Brief

## Student Learning App

| Document field | Value |
|---|---|
| Project workspace | SrhDP |
| Working product name | Student Learning App — final branding pending |
| Document ID | SLP-DOC-01 |
| Version | 0.1 — complete draft for stakeholder review |
| Prepared date | 9 September 2026 |
| Document owner | Product owner — person to be assigned |
| Business sponsor | School/institution representative — person to be assigned |
| Technical owner | Technical lead — person to be assigned |
| Approval status | Not yet approved |
| Intended readers | Sponsor, school representatives, product owner, designer, developers, QA, and operations |
| Planning basis | Student app implementation plan and zero-to-production workflow provided in this conversation |

This brief establishes the product purpose, users, scope, outcomes, delivery approach, and responsibilities. It is the starting point for the PRD, UX/UI specification, SDD, database specification, API contract, and Jira backlog.

**Status conventions:** “Established context” means present in the preceding project plan, not formal stakeholder approval. “Proposed” means a concrete planning recommendation for review. “Pending” means information has not been supplied. No budget, release date, technology stack, staffing commitment, or school policy is approved by this document.

## 1. Executive summary

The Student Learning App will provide students with a central place to access their classes, schedule, learning materials, assignments, published results, attendance records, profile, and school notices. Supporting teacher and administrator workflows will keep this information accurate and available.

The core product journey is: an administrator establishes academic data and enrollment; a teacher publishes learning activities and academic records; an enrolled student accesses those activities, submits work, and views their authorized records.

The first release should prove this journey from account access through assignment submission and result publication. It should also establish reliable permissions, file handling, support ownership, deployment, backup, and recovery practices.

**Proposed launch approach:** validate the MVP with a controlled pilot at one institution, resolve launch-blocking issues, and expand to the approved student population. The number of schools, delivery platforms, pilot size, and dates remain decisions to close before delivery commitments are made.

## 2. Background and evidence boundary

### 2.1 Established context

- The preceding implementation plan describes student-facing Home, Classes, Assignments, Exam Results, and Profile screens.
- Supporting scope includes schedules, class materials, attendance, notices, notifications, and account access.
- Teacher and administrator capabilities are necessary to create and maintain the information shown to students.
- Delivery is intended to follow PRD → design and technical specifications → Jira → Git → development → QA/UAT → production and operations.

This brief uses the screen descriptions in the supplied plan. It does not claim a new inspection of the original images or an existing codebase.

### 2.2 Problem hypothesis to validate

Students may need to consult separate channels to find schedules, class resources, assignment deadlines, submission confirmation, and academic records. Teachers and school staff may need to repeat updates, answer status questions, and reconcile records manually.

These are working hypotheses, not measured findings about a specific school. Discovery should establish which channels are currently used, the most common failures, their frequency, and their effect on students and staff.

### 2.3 Discovery evidence required

| Evidence | Questions to answer | Responsible role | Use |
|---|---|---|---|
| Student interviews or observed tasks | Where do students find schedules and work? What is difficult or unclear? | Product owner / designer | Prioritize journeys and usability issues |
| Teacher interviews | How are assignments, grades, and attendance recorded and corrected? | Analyst / teacher representative | Define operational rules |
| Admin process review | Who owns accounts, enrollment, terms, and publication authority? | School administrator | Establish source of truth and permissions |
| Existing data samples | Are identifiers unique? Are records complete and consistent? | Technical lead / data owner | Assess setup and import effort |
| Device and connectivity information | Which devices, languages, and network conditions must be supported? | Designer / technical lead | Decide platform and test matrix |
| Current support records, if available | Which questions and failures recur? | Support owner | Establish baseline measures |

## 3. Problem statement and opportunity

**Problem statement:** students need a dependable way to find their own learning information, complete assignment workflows, and understand published academic outcomes. School staff need a controlled way to maintain that information without exposing it to the wrong users or losing track of changes.

The opportunity is to connect these activities within one consistent experience, with clear states and ownership. The app should make it obvious what the student must do next, whether work was successfully submitted, and which records are officially published.

Expected benefits to validate include fewer repeated status inquiries, clearer assignment completion, faster access to learning resources, and more consistent handling of academic records. No financial return or time saving is claimed without a baseline.

## 4. Product vision and objectives

**Vision:** give students a clear, trustworthy view of their learning day and a reliable way to complete academic tasks, while allowing authorized staff to manage the underlying records.

| Objective ID | Objective | Expected evidence |
|---|---|---|
| OBJ-01 | Centralize student access to relevant academic information | Pilot students complete schedule, material, and record lookup tasks |
| OBJ-02 | Make assignment submission reliable and understandable | Submission confirmation, history, and retry behavior pass acceptance tests |
| OBJ-03 | Protect student and school data through appropriate access | Negative permission tests pass for students, teachers, and administrators |
| OBJ-04 | Enable staff to maintain the MVP without developer intervention | Staff complete academic setup, publishing, and correction scenarios |
| OBJ-05 | Present consistent academic calculations and publication states | Approved result and attendance examples match displayed outcomes |
| OBJ-06 | Launch a service that can be supported and recovered | Deployment rehearsal, monitoring, restore evidence, and runbook are complete |

### 4.1 Product principles

1. Show information relevant to the signed-in user and their authorized scope.
2. Make action outcomes explicit, especially submissions, saves, and publication.
3. Keep academic rules consistent between staff and student views.
4. Design complete loading, empty, error, retry, and expired-session states.
5. Prefer an achievable MVP with complete workflows over many incomplete screens.
6. Keep academic data ownership and operational responsibility visible.

## 5. Target users and stakeholders

| Role | Primary needs | MVP responsibilities or capabilities | Boundaries |
|---|---|---|---|
| Student | Know what is scheduled, access materials, submit work, view records | View own enrollment and records; submit own work; manage permitted profile fields | Cannot view another student’s private submissions or results |
| Teacher | Manage learning activities and records for assigned classes | Publish materials/assignments, review submissions, record attendance and results | Access restricted to assigned classes and permitted actions |
| School administrator | Maintain users, academic structure, and enrollment | Provision accounts, manage terms/classes/enrollment, assign teachers, resolve permitted data issues | Broad access still requires explicit role permissions and auditability |
| Product owner | Keep delivery aligned with school needs | Prioritize backlog, resolve scope, accept business behavior | Cannot substitute an unreviewed feature request for agreed release scope |
| Sponsor | Achieve institutional value within constraints | Approve investment, major scope, and launch accountability | Budget and release commitments require explicit decisions |
| Support / service owner | Resolve incidents and maintain continuity | Triage problems, use runbooks, coordinate recovery | Support access should be limited to the information needed for the issue |

Parent/guardian accounts, external tutors, finance staff workflows, and public users are outside the proposed MVP unless scope is changed.

## 6. Proposed MVP scope

The capability set below expands the established plan into a reviewable scope baseline. Detailed field rules and acceptance criteria belong in the PRD.

| Scope ID | Capability | Included in the proposed MVP | Completion outcome |
|---|---|---|---|
| SCP-01 | Account access | Sign-in, session handling, logout, recovery, disabled-account behavior | Active users can access the correct role experience and safely end access |
| SCP-02 | Academic setup | Academic years/terms, subjects, classes, teacher assignment, student enrollment | Staff can create the academic structure used by the student app |
| SCP-03 | Home | Student summary, today’s schedule, relevant shortcuts, next exam when available, unread indicator | Dashboard reflects authorized source records and handles missing information |
| SCP-04 | Classes | Enrolled class list, overview, teacher/room information, sessions | Student can find current classes and relevant upcoming sessions |
| SCP-05 | Materials | Staff upload/publish, student list/download, authorized file access | Enrolled students can obtain published class resources |
| SCP-06 | Assignments | Staff create/publish, student filters/details, attachments, submission, confirmation/history, staff review | An assignment can be completed end to end under approved deadline and resubmission rules |
| SCP-07 | Results | Staff record/validate/publish, student term/subject filtering and approved summaries | Student sees their own published results with agreed calculations |
| SCP-08 | Attendance | Staff record/correct attendance, student history and approved summary | Student records match the agreed attendance policy |
| SCP-09 | Profile/settings | One consolidated profile, permitted edits, essential preferences and support information | Editable and school-controlled fields behave as specified |
| SCP-10 | Notices/notifications | Publish to intended audience, in-app list/read state, unread count | Notices are visible only to the selected audience and read state persists |
| SCP-11 | Administration/audit | Authorized maintenance and audit of sensitive academic/account actions | Changes can be attributed to an actor and time |
| SCP-12 | Operational readiness | Deployment, configuration, monitoring, backups, recovery, support handover | Team can operate the service after launch |

### 6.1 Scope conditions

- Supporting staff workflows are launch dependencies. Their interface and delivery platform remain design decisions.
- Classmate/student-list visibility is conditional on school approval; hide this information until a policy is defined.
- Assignment “Completed” needs an explicit definition. Submission status and grading status remain separate concepts.
- In-app notifications are included in the proposed baseline. Push/email/SMS delivery and provider selection need a separate decision and effort estimate.
- “Add to My Schedule” requires a decision between an in-app reminder and device-calendar integration. Device-calendar integration is not assumed in the baseline.
- Initial academic data setup is included. Automated external-system synchronization and large historical migrations are separate scope decisions.
- Results may be entered and published; conducting online exams is excluded from this MVP.

### 6.2 Proposed out-of-scope items

| Item | Reason for deferral | Revisit trigger |
|---|---|---|
| Tuition payments, billing, refunds | Separate financial workflows and controls | Validated finance use case and funding |
| Live video classes and recordings | Additional infrastructure and media workflows | Confirmed remote-teaching requirement |
| Real-time chat and social feeds | Additional moderation, retention, and support needs | Clear communication gap beyond notices |
| Parent/guardian portal | Additional identities and relationship permissions | Approved guardian access model |
| Online examination delivery/proctoring | Larger assessment and integrity scope | Separate exam-delivery brief |
| Advanced analytics, recommendations, AI tutoring | Requires validated data and distinct success criteria | Core workflows are reliable and adopted |
| Full offline editing and synchronization | Conflict resolution materially increases effort | Connectivity research demonstrates necessity |
| Multi-institution self-service onboarding | Adds tenant administration and onboarding scope | Expansion beyond the initial institution is approved |
| Automated integration with an existing school platform | Source API/access and reconciliation requirements unknown | Integration contract and data owner confirmed |

## 7. Core end-to-end journeys

### JRN-01 — Prepare the academic term

1. Administrator establishes the academic year and term.
2. Administrator creates or updates subjects, classes, and users.
3. Administrator assigns teachers and enrolls students.
4. Authorized staff establish sessions and relevant class details.
5. Staff verify enrollment counts and sample student access before opening the term.

**Outcome:** the student app has accurate, authorized academic data to display.

### JRN-02 — Start the learning day

1. Student signs in with an active account.
2. Home displays their schedule and relevant summary information.
3. Student opens an enrolled class and checks upcoming sessions or material.
4. If no schedule or material exists, the app shows a clear empty state.

**Outcome:** the student can identify the next relevant learning activity without accessing unrelated classes.

### JRN-03 — Publish and submit an assignment

1. Teacher creates an assignment with instructions, permitted attachments, and a deadline.
2. Teacher publishes it to an assigned class.
3. Student opens the assignment, reviews instructions, and submits allowed work.
4. The system validates eligibility, file rules, and deadline policy.
5. Student receives a persisted submission confirmation and can revisit submission history.
6. Teacher reviews or grades the submission under the approved workflow.

**Exception coverage:** outside enrollment, expired session, rejected file, interrupted upload, repeat request, late work, and resubmission. Exact policies are resolved in the PRD.

### JRN-04 — Record and publish academic information

1. Authorized staff enter attendance or assessment results.
2. Validation rejects inconsistent entries under the approved rules.
3. Staff review results before publication where a publication step applies.
4. Student views their own visible records and calculated summaries.
5. Authorized corrections are recorded with appropriate audit history.

**Outcome:** student-visible data reflects approved records and calculation rules.

### JRN-05 — Receive an announcement and obtain help

1. Authorized staff publish a notice to a school/class audience.
2. An eligible student sees the notice and unread state.
3. Opening or explicitly marking the notice updates read state according to the specification.
4. Student accesses support instructions from the agreed location when help is needed.

**Outcome:** announcements reach the correct audience, and users know how to report issues.

## 8. Business rules requiring early agreement

| Rule area | Proposed planning position | Required decision |
|---|---|---|
| Accounts | Institution-controlled provisioning for the pilot | Login identifier, recovery channel, activation, and disabling policy |
| Enrollment | Administrators maintain the authoritative enrollment list | Transfer, withdrawal, and historical access behavior |
| Teacher permissions | Limit actions to assigned classes | Whether teaching assistants, reviewers, or multiple teachers are needed |
| Assignment completion | Treat submission and grading as different states | Meaning of Completed, late acceptance, attempts, and permitted file types/sizes |
| Grades | Validate earned marks against allowed values; distinguish draft/published | Weighting, missing scores, rounding, pass/fail, ranking, and correction rules |
| Attendance | Record statuses explicitly | How late, excused, canceled sessions, and no records affect totals |
| Time | Store unambiguous timestamps and display the institution’s timezone | Institution timezone and deadline boundary behavior |
| Notifications | In-app delivery/read state is the baseline | Trigger list, recipients, reminders, optional external channels |
| Profile | School identity fields are controlled by staff | Student-editable fields and verification requirements |
| Record lifecycle | Define retention and access before real data is imported | Archival, deletion, export, and graduated/withdrawn-student access |

## 9. Success measures and evaluation plan

No measured baseline has been supplied. The following targets are proposed pilot targets for discussion, not contractual service levels. Product and technical owners must approve the values, collection method, and observation window before use as release or success commitments.

| Metric | Definition and evidence | Proposed target | Owner |
|---|---|---|---|
| Core-task usability | Participants completing assigned sign-in, schedule lookup, material access, and submission tasks without facilitator intervention ÷ participants attempting each task | At least 90% per task in the pilot evaluation; report participant counts | Product owner / designer |
| Submission reliability | Valid, authorized submission operations confirmed as persisted ÷ valid, authorized submission operations attempted; group retries by logical operation and report validation failures separately | At least 99% during the agreed pilot window | Technical lead / QA |
| Result/attendance correctness | Approved calculation scenarios matching expected outcomes ÷ approved scenarios executed | 100% before UAT acceptance | QA / school academic owner |
| Access-control readiness | Required positive and negative permission cases passed ÷ required cases executed | 100%; any confirmed unauthorized disclosure blocks launch | Technical lead / QA |
| Staff independence | Required academic setup and publishing scenarios completed without developer data edits ÷ scenarios executed | 100% of MVP scenarios in UAT | Administrator / product owner |
| Adoption | Unique activated students completing at least one agreed core action during the pilot ÷ activated students expected to participate | Set after cohort size, academic activity, and pilot duration are known | Product owner |
| Support burden | App-related support requests per 100 active students, categorized by root cause | Establish pilot baseline; compare later periods with similar academic activity | Support owner |
| Recovery readiness | Successful restoration and smoke validation in a rehearsal with recorded elapsed time and recovery point | Rehearsal passes within approved recovery targets | Operations owner |

Instrument event names and definitions before the pilot. Use pseudonymous identifiers where practical; do not place credentials, submission contents, or full academic records in analytics events. A missed product target triggers analysis and reprioritization; a security or release gate failure requires remediation before launch.

## 10. Quality and operational expectations

| Area | Brief-level expectation | Detail to establish downstream |
|---|---|---|
| Access and privacy | Backend enforces role and record ownership; downloads are authorized | Permission matrix, audit coverage, school policies, and applicable obligations |
| Integrity | Confirmed submissions and academic changes are persisted consistently | Transactions, uniqueness, idempotency, and retry design |
| Usability | Clear navigation, readable content, meaningful status labels, full error states | Supported devices, accessibility criteria, language coverage |
| Performance | Routine lists and dashboards remain responsive at agreed load | Active users, peak concurrency, data volumes, payload limits, latency targets |
| Availability | Failures are detectable and users receive useful error behavior | Availability objective, maintenance windows, incident severity thresholds |
| Recovery | Database and required files can be restored together | Backup frequency/retention, recovery time objective, recovery point objective |
| Maintainability | Reproducible setup, reviewed changes, versioned migrations, documented contracts | Stack, repository structure, coding standards, and CI checks |
| Supportability | Known service owner, alert routing, triage process, and runbook | Coverage hours, response targets, escalation contacts |

These expectations become measurable nonfunctional requirements in the PRD and design constraints in the SDD. Platform versions, infrastructure sizing, and service commitments are pending.

## 11. Data, content, and integration boundaries

### 11.1 Data ownership

| Data | Proposed business owner | Initial source to confirm | Required control |
|---|---|---|---|
| Student/teacher identity | School administration | Existing register or controlled manual setup | Unique identifier, validation, authorized correction |
| Terms/classes/enrollment | School academic administration | Existing academic records or manual setup | Reconciliation and ownership of changes |
| Materials/assignments | Assigned teacher | Teacher-created content | Class access and publication controls |
| Submissions | Student as author; school as academic custodian subject to policy | In-app submission | Ownership, attempt history, authorized review |
| Results/attendance | School academic authority | Authorized staff entry for baseline MVP | Validation, publication, correction audit |
| Notices | Authorized school/class publisher | Staff-created content | Audience selection and publication authority |

### 11.2 Initial data readiness

Before pilot launch, the data owner supplies a validated pilot roster, class structure, teacher assignments, enrollments, and representative learning content. The team agrees an import template or manual setup procedure, detects duplicates and missing links, reconciles counts, and verifies sample accounts.

Historical record migration is not assumed. If requested, estimate it separately with source mapping, cleansing, reconciliation, rollback, and ownership.

### 11.3 External dependencies

Required service categories include hosting, database, private file storage, domain/HTTPS, backup, and monitoring. Account recovery may require an external communication provider depending on the selected method. Push notifications and app-store distribution apply only if those channels/platforms are selected. Vendors and costs are not selected here.

## 12. Assumptions and constraints

| ID | Type | Statement | Validation / consequence |
|---|---|---|---|
| ASM-01 | Proposed assumption | Start with one institution and a controlled pilot | Sponsor confirms tenancy; multiple institutions change access and data design |
| ASM-02 | Proposed assumption | School representatives can review rules and participate in UAT | Delivery lead confirms availability before scheduling |
| ASM-03 | Proposed assumption | Initial accounts and academic records can be provided accurately | Data owner supplies sample data before import estimates |
| ASM-04 | Proposed assumption | Core write actions require connectivity; full offline sync is deferred | Device/connectivity research validates usability |
| ASM-05 | Proposed assumption | Staff use a supporting interface to manage MVP information | UI/platform decision must include staff workflows |
| CON-01 | Established constraint | Academic records require user-specific authorization | Mandatory across design, API, files, tests, and launch |
| CON-02 | Planning constraint | Delivery capacity, budget, and launch date are unknown | No fixed schedule or cost commitment until estimated |
| CON-03 | Planning constraint | Existing infrastructure, codebase, and integration access are unverified | Technical discovery precedes reuse assumptions |
| CON-04 | Planning constraint | Platform and language scope remain open | Resolve before UI completion and release planning |

If an assumption changes, assess effects on scope, design, effort, risk, and acceptance before treating it as the new baseline.

## 13. Delivery workstreams and milestones

Dates and duration are deliberately uncommitted. Estimate each workstream after team availability, platform, integration needs, and the PRD are known. QA planning and operations preparation begin early and overlap with implementation.

| Milestone | Work | Deliverables | Exit criteria |
|---|---|---|---|
| M0 — Brief alignment | Validate problem, users, scope, owners, constraints | Approved project brief and decision log | Sponsor/product owner accept scope baseline and responsibility |
| M1 — Requirements and design | Settle business rules; complete journeys and screen states | PRD, UX/UI specification | Testable acceptance criteria and launch-critical rules agreed |
| M2 — Technical readiness | Architecture, schema, contracts, backlog, repository, environments | SDD, ERD/data dictionary, API contract, Jira backlog, CI skeleton | Reviewed design and reproducible non-production setup |
| M3 — Core access and academic data | Authentication, staff setup, enrollment, classes, materials, Home | Integrated capability increment | Staff can prepare data; student sees correct classes and schedule |
| M4 — Academic workflows | Assignments, results, attendance, profile, notices | Feature-complete MVP candidate | End-to-end journeys implemented and reviewed |
| M5 — Release validation | QA, regression, performance checks, UAT, recovery rehearsal | Test/UAT evidence and release candidate | Required gates pass and known defects are accepted |
| M6 — Controlled pilot | Deploy approved build, onboard cohort, monitor, gather evidence | Pilot release and findings | No unresolved launch blockers; expansion decision recorded |
| M7 — Production expansion and handover | Apply pilot fixes, expand approved audience, establish operations | Production release, support/runbook handover | Smoke checks pass, ownership active, monitoring stable |

Feature implementation order: foundation/authentication → academic setup/enrollment → classes/sessions/materials → Home → assignments → results/attendance → profile/notices/notifications → integrated hardening. Design dependencies may allow some independent workstreams to proceed concurrently.

## 14. Governance, roles, and decisions

Named individuals remain to be assigned. In a small team, one person may fill multiple roles, but responsibilities should remain explicit.

| Activity or decision | Accountable role | Responsible contributors | Consulted roles |
|---|---|---|---|
| Business case, funding, major scope | Sponsor | Product owner | Delivery lead, school representatives |
| Product requirements and priority | Product owner | Analyst, designer | Teachers, students, administrators, QA |
| Academic policies and calculations | School academic authority | Product owner / analyst | Teachers, administrators, technical lead, QA |
| Architecture and implementation quality | Technical lead | Developers / operations | QA, product owner |
| Test readiness and evidence | QA lead | QA and developers | Product owner, technical lead |
| Business UAT acceptance | Product owner | School representatives | QA, delivery lead |
| Go/no-go decision | Designated release owner | Technical lead, QA, operations | Product owner, sponsor |
| Production incidents and recovery | Service owner | Operations / developers | Support, school representatives |

**Proposed cadence:** brief team progress check on working days; weekly backlog/dependency review; demonstration and acceptance at the end of each agreed iteration; release readiness review for each production candidate. Adjust cadence to actual team capacity.

Keep a decision log recording question, options, decision, rationale, owner, date, and affected documents. Link requirements to Jira stories, merge requests, test cases, and release artifacts.

### 14.1 Change control

1. Record the proposed change and the problem it solves.
2. Identify affected scope IDs, users, rules, dependencies, and documents.
3. Estimate implementation, test, data, support, cost, and schedule impacts.
4. Product owner decides priority; sponsor approves changes to funding or major commitments.
5. Update the brief/PRD and backlog before implementation commitments change.

Urgent production fixes follow the incident process, retain traceability, and receive retrospective documentation and review where immediate recovery required accelerated action.

## 15. Resources and budget framework

### 15.1 Required capability coverage

The project needs product/analysis, UX/UI, backend, student-client development, staff-interface development, QA, deployment/operations, and school data ownership. Staffing levels and allocation are pending; titles do not imply separate full-time hires.

Before estimation, confirm who can perform each role, their available time, review turnaround, competing commitments, and access to school subject-matter experts.

### 15.2 Cost categories

| Cost category | Items to estimate | Estimation basis |
|---|---|---|
| Product/design | Discovery, PRD, flows, design system, review | Agreed workshops, screens, and iterations |
| Engineering | Backend, clients, staff workflows, migrations, automation | Estimated backlog and dependency work |
| Validation | QA, device testing, UAT support, load/recovery checks | Coverage matrix and release scope |
| Infrastructure | Compute, database, storage, backup, monitoring, domain | Forecast traffic, storage growth, recovery requirements |
| External services | Recovery messaging, optional notifications, distribution accounts | Selected channels, usage, and provider terms |
| Launch and operations | Data preparation, onboarding, training, support, maintenance | Pilot size, support coverage, expected recurring work |
| Contingency | Uncertainty in data, integration, rework, and release dependencies | Risk assessment approved by sponsor |

Budget total, currency, spending authority, contingency amount, and recurring operating ceiling are pending. Separate one-time delivery cost from monthly operations. Supplier prices should be checked when options are selected; no price claims are made here.

## 16. Risks and mitigations

Ratings are initial qualitative judgments for review, not measured probabilities.

| Risk ID | Risk | Initial likelihood / impact | Early signal | Mitigation and contingency | Owner |
|---|---|---|---|---|---|
| RSK-01 | Grading, attendance, or assignment rules remain unclear | High / High | Repeated conflicting examples during review | Resolve worked examples in PRD; defer dependent implementation until settled | Product owner / academic authority |
| RSK-02 | Scope grows beyond available capacity | Medium / High | Additional channels/platforms enter work without estimates | Baseline scope; estimate changes; defer optional features | Product owner |
| RSK-03 | Student data is exposed to another user | Medium / Critical | Missing resource checks or failing negative tests | Permission matrix, backend/file controls, dedicated QA; block affected release | Technical lead |
| RSK-04 | Uploads or retries lose/duplicate submissions | Medium / High | Timeout or repeated-tap tests produce inconsistent records | Explicit confirmation, safe retries, integrity checks, recovery coverage | Backend/client leads |
| RSK-05 | Incomplete or inaccurate enrollment data blocks pilot | High / High | Missing IDs, duplicates, inconsistent class lists | Early sample validation, controlled import/setup, reconciliation | School data owner |
| RSK-06 | Staff workflows are left until late delivery | Medium / High | Student screens depend on manual developer database changes | Build staff setup early; include staff journeys in UAT | Delivery lead |
| RSK-07 | Pilot devices or connectivity differ from test assumptions | Medium / Medium | Slow screens, upload failures, layout problems | Collect device profile; test representative networks; adjust scope/design | Designer / QA |
| RSK-08 | Production recovery is unproven | Medium / High | Backup exists but no restore evidence | Rehearse restore and compatible rollback before pilot | Operations owner |
| RSK-09 | School reviewers or key engineers are unavailable | Medium / High | Decisions and reviews repeatedly slip | Confirm availability, assign backups, resequence work | Delivery lead |
| RSK-10 | Native distribution or external service setup delays launch | Conditional / High | Platform selected without accounts/access | Confirm channel prerequisites early; revise release sequencing if blocked | Release owner |
| RSK-11 | Students/staff do not adopt the workflow | Medium / High | Low task completion or continued parallel manual work | Pilot training, observation, feedback, and focused fixes | Product owner / school champion |

## 17. Decision register

All entries below are open. “Due before” identifies a decision gate rather than an invented calendar deadline.

| ID | Decision needed | Proposed starting point | Decision owner | Due before |
|---|---|---|---|---|
| DEC-01 | Institution, sponsor, product owner, and working name | One-institution pilot; assign named owners | Sponsor | Brief approval |
| DEC-02 | Student and staff delivery platforms | Select from device evidence and team capability | Product owner / technical lead | UX and effort baseline |
| DEC-03 | Supported languages and institution timezone | Confirm with school; do not infer from project owner location | School representative | PRD approval |
| DEC-04 | Pilot population and rollout audience | Controlled cohort with willing staff representatives | Product owner / school administrator | Pilot planning |
| DEC-05 | Account provisioning and recovery | Institution-managed accounts | School administrator / technical lead | Auth specification |
| DEC-06 | Assignment attempts, deadlines, completion, files | Separate submission and grading states | Academic authority | Assignment PRD/API approval |
| DEC-07 | Grade and attendance calculations/publication | Approve worked examples and correction rules | Academic authority | Records PRD/API approval |
| DEC-08 | Classmate visibility and academic data access | Restrict private records; hide unapproved lists | School authority | Permission specification |
| DEC-09 | Existing data source and import scope | Current pilot data first; historical migration deferred | School data owner | Database/import estimate |
| DEC-10 | Tech stack, hosting, source repository, service access | Review skills, constraints, and operational fit | Technical lead | SDD approval |
| DEC-11 | Notification channels and schedule action | In-app notices; calendar integration deferred | Product owner | Scope and estimate baseline |
| DEC-12 | Team allocation, budget, schedule, and support coverage | Estimate from approved scope and actual capacity | Sponsor / delivery lead | Delivery commitment |
| DEC-13 | Capacity, performance, availability, and recovery targets | Use pilot and school operating needs | Technical lead / service owner | Release test plan |
| DEC-14 | Data retention, deletion, support access, and required policy review | Agree institution-specific rules before real-data use | School authority / service owner | Pilot data onboarding |
| DEC-15 | Success target values and measurement window | Review Section 9 proposals | Product owner | Pilot start |

## 18. Acceptance, launch gates, and completion

### 18.1 Brief acceptance

This brief is ready to become the delivery baseline when:

- A sponsor and product owner are named.
- The problem statement is validated or revised using school evidence.
- Target users, institution scope, and MVP boundaries are agreed.
- Platform/language decisions have a resolution plan that precedes dependent estimates.
- Success measures, staffing, budget, and timing have owners and a decision process.
- Major risks, dependencies, and open decisions are acknowledged.

### 18.2 MVP acceptance

- Staff can create academic data and enroll students using supported workflows.
- Students can sign in, find their schedule/classes, access materials, and submit assignments.
- Staff can review submissions and maintain attendance and results.
- Students see only their own authorized published records.
- Academic calculations match approved examples.
- Required notices and profile flows work, including failure states.
- Required QA and UAT cases pass for the identified release candidate.

### 18.3 Production gate

- Launch-blocking defects are resolved; any remaining limitations have explicit owners and acceptance.
- The exact release artifact, migrations, configuration, and deployment sequence are recorded.
- Required production data is validated and test/demo accounts are controlled.
- Monitoring, alerts, backup, restore, rollback/forward recovery, and support ownership are ready.
- Controlled production smoke tests pass, and the release owner records the go/no-go decision.
- Native distribution and older-client compatibility are covered if native apps are selected.

### 18.4 Project completion and handover

The initial delivery phase is complete after the approved audience can use the MVP, pilot/release issues meet the agreed acceptance threshold, documentation and service ownership are handed over, and unresolved enhancements are in a prioritized backlog. Ongoing maintenance remains a service responsibility after project closure.

## 19. Immediate next actions

| Sequence | Action | Owner | Concrete output |
|---|---|---|---|
| 1 | Review this brief with sponsor and school representatives | Product owner | Annotated brief and named role owners |
| 2 | Gather student/staff workflow evidence and sample academic data | Analyst / school data owner | Discovery notes and non-sensitive sample data |
| 3 | Resolve platform, language, tenancy, and account decisions | Product owner / technical lead | Updated decision log |
| 4 | Settle assignment, results, attendance, and visibility rules using examples | Academic authority / analyst | Business-rule decisions ready for PRD |
| 5 | Create `02_prd.md` with stable requirement IDs and testable criteria | Product owner / analyst | Reviewable requirements baseline |
| 6 | Develop UX/UI, SDD, database specification, and API contract from the PRD | Designer / technical lead | Reviewed implementation inputs |
| 7 | Estimate the backlog against actual team capacity and dependencies | Delivery lead / team | Jira plan, budget proposal, milestone dates |

## 20. Document relationships and review record

| Document | Relationship to this brief |
|---|---|
| `Student_Learning_App_Zero_to_Production.md` | Parent delivery workflow used as planning context |
| `02_prd.md` | Expands objectives/scope into requirements and acceptance criteria |
| `03_ux_ui_spec.md` | Defines screens, interactions, content, and states |
| `04_sdd.md` | Defines architecture, security, dependencies, and implementation decisions |
| `05_database_spec.md` | Defines data model, constraints, migrations, and ownership implementation |
| `06_openapi.yaml` | Defines API operations, schema, authorization, and errors |
| `07_developer_guide.md` | Defines setup, coding conventions, Git, and CI workflow |
| `08_jira_backlog.md` | Maps approved scope to epics, stories, tasks, and dependencies |
| `09_test_plan.md` | Maps acceptance and quality expectations to test coverage |
| `10_uat_checklist.md` | Captures business journeys and release-candidate acceptance |
| `11_release_plan.md` | Defines deployment, verification, and recovery |
| `12_operations_runbook.md` | Defines service operation, incident response, and maintenance |

Only this project brief is created by the current task; downstream filenames describe planned deliverables and do not imply those documents already exist.

### Review and approval record

| Role | Named reviewer | Review focus | Status | Date |
|---|---|---|---|---|
| Sponsor | Pending assignment | Value, funding, institutional commitment | Pending | — |
| Product owner | Pending assignment | Users, scope, objectives, priorities | Pending | — |
| School academic authority | Pending assignment | Academic workflows and decision ownership | Pending | — |
| Technical lead | Pending assignment | Feasibility, dependencies, quality expectations | Pending | — |
| QA lead | Pending assignment | Testability and acceptance gates | Pending | — |
| Service owner | Pending assignment | Support and operational readiness | Pending | — |

### Revision history

| Version | Date | Change | Status |
|---|---|---|---|
| 0.1 | 9 September 2026 | Full initial project brief based on the preceding student-app plan; includes proposed scope, journeys, measures, governance, risks, decisions, and delivery gates | Draft for review |
