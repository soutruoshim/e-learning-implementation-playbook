---
title: "13 — Deployment and Rollback Guide"
---

# 13 — Deployment and Rollback Guide

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | REL-001 |
| Version / status | 1.0 / Proposed runbook awaiting environment binding and rehearsal |
| Created / updated | 2026-09-12 |
| Accountable owner | Release / Operations Owner — TBD |
| Technical owner | Technical Lead / DevOps Owner — TBD |
| Sources | Documents 01–12, especially SDD, database, Git workflow, test plan and UAT |
| Delivery packages | WP-27, WP-29, WP-31, WP-32 |
| Hosting / deployment platform | TBD |
| Deployment status | No application deployed or rolled back by this document |
| Authorization | No production deployment or destructive recovery authorized by this document alone |

> This guide specifies the sequence, checks, decision points and recovery obligations for a release. Actual hosts, commands, service names, numerical thresholds, credentials references and platform procedures must be supplied and rehearsed before execution. Earlier documents and pending sign-off tables are not evidence of approval. No recovery step may assume that reverting code or restoring a database reverses an external payment.

## 1. Purpose and Safety Invariants

Deploy a verified candidate to the approved cohort, confirm it works, and recover from faults while preserving customer and financial obligations.

- The deployed artifact, source revision, configuration and schema revision are identifiable.
- Only one release coordinator controls a given environment at a time.
- New ordering can be paused independently of processing existing orders and financial outcomes.
- Unknown payment/refund outcomes retain their stable operation references and reserved exposure.
- Callback receipt and reconciliation remain available, or events are durably recoverable through a verified alternative.
- Schema and event compatibility determine whether an older application can safely run.
- A rollback never deletes financial evidence or blindly repeats external actions.
- Recovery completion requires business-state reconciliation, not only healthy processes.

## 2. Environment Binding Register

Populate actual values and verify access before the release window. Do not put secret values in this document.

| Item | Required binding | Status |
|---|---|---|
| Environment | Name, account/project, region and ownership | TBD |
| Customer/API origins | Actual hostnames and route configuration | TBD |
| Release mechanism | Platform pipeline/job and exact approved invocation | TBD |
| Artifact registry | Immutable artifact identifier/checksum procedure | TBD |
| API/worker/client units | Service names, replicas and startup/shutdown behavior | TBD |
| Database | Engine/version, instance, schema, migration runner | TBD |
| Cache/queue | Selected services or confirmed absence | TBD |
| Secret/config mechanism | References, revision tracking and permissions | TBD |
| Health/readiness probes | Actual endpoints/commands and expected results | TBD |
| New-checkout pause control | Exact control, owner, propagation and verification | TBD |
| Worker controls | Claim pause/drain/resume and lease inspection | TBD |
| Callback ingress | Provider registration, verification and durable receipt path | TBD |
| Financial lookup/reconciliation | Operation-reference query, schedule and exception access | TBD |
| Backup/PITR | Capability, last verified restore, location and owner | TBD |
| Monitoring/alert routing | Dashboards, thresholds and responder contacts | TBD |
| Previous compatible artifact | Exact identity and compatibility evidence | TBD |
| Physical/mobile clients | Distribution/version compatibility and update constraints | TBD if selected |

This guide is not copy-and-run until these bindings exist. The repository's actual scripts and platform documentation must replace generic action labels; do not invent deployment commands or URLs.

## 3. Roles and Decision Rights

| Role | Responsibility |
|---|---|
| Release coordinator | Maintain release record, sequence actions, stop progression on a failed gate |
| Deployment operator | Execute approved environment-bound operations and record output |
| Technical Lead | Assess compatibility, faults and rollback versus forward-fix options |
| Database Owner | Migrations, backups, restore and data validation |
| Payment/Finance Owner | Financial evidence, reconciliation and exception decisions |
| Store Operations | Pilot stores, fulfillment continuity and operating readiness |
| Support Owner | Customer-facing exception handling and case ownership |
| QA Owner | Candidate evidence and smoke/retest assessment |
| Product Owner | Business scope, accepted limitations and rollout decision |
| Incident commander | Coordinate recovery when a release becomes an incident |

Names, escalation contacts and availability are required before execution. One person may hold multiple roles, but the decision/evidence obligations remain explicit. Emergency escalation does not grant permission to bypass access controls or fabricate approval.

## 4. Release Record and Required Inputs

| Record field | Actual value |
|---|---|
| Release/change identifier | TBD |
| Source repository and full commit | TBD |
| Build/artifact ID and digest | TBD |
| Configuration revision and secret references | TBD |
| Schema revision before/after | TBD |
| Event/API compatibility window | TBD |
| Target environment and pilot cohort | TBD |
| Deployment window/time zone | TBD |
| Operator/coordinator/responders | TBD |
| QA/UAT/operational evidence | Pending |
| Accepted issues and conditions | Pending review |
| Previous compatible artifact/configuration | TBD |
| Backup/checkpoint reference | TBD |
| Go/no-go approval reference | None recorded |
| Start/end time and outcome | Not executed |

Promote the same verified artifact where supported. If a platform rebuilds per environment, record and validate the actual resulting artifact rather than assuming source identity alone proves binary identity. Release tags identify source and must not be moved to hide a changed build.

## 5. Entry and Go/No-Go Gates

### Business and technical readiness

- [ ] Exact candidate, scope and cohort identified.
- [ ] Required QA evidence applies to the candidate; no unresolved blocking defect.
- [ ] Actual UAT/business decision is recorded, not merely a pending template.
- [ ] Provider identity, callback contract, safe retry/lookup and refund semantics are verified.
- [ ] Selected POS/catalog/loyalty authority and all relevant commercial rules are approved.
- [ ] API/schema/event compatibility is reviewed for mixed versions and queued work.
- [ ] Numeric latency, error, pending-age, capacity and recovery targets are filled and approved.
- [ ] Staff/support/finance and incident responders are available.

### Operational readiness

- [ ] Target environment and production provider identity confirmed without exposing secrets.
- [ ] Artifact/configuration provenance and deployment access verified.
- [ ] Backup/recovery capability and restore rehearsal evidence available.
- [ ] Migration locking/duration/backfill impact assessed.
- [ ] Previous compatible artifact or forward-fix strategy available.
- [ ] New-checkout pause, worker drain and existing-obligation continuity rehearsed.
- [ ] Callback verification/receipt and reconciliation remain functional through rollout.
- [ ] Monitoring and alerts route to named responders.
- [ ] Approved smoke test data and any financial cleanup/reconciliation procedure ready.

A missing financial/security/recovery guarantee is not a routine nonblocking exception. Record NO-GO until resolved or scope is formally revised. Independent reversible preparation may continue, but production progression requires the actual go/no-go decision.

## 6. Compatibility and Migration Strategy

### Expand, transition, contract

1. **Expand:** Add compatible tables/columns/indexes and tolerant readers/consumers. Assess operational impact before applying.
2. **Transition:** Deploy code that can coexist with supported older code and event payloads. Backfill using bounded resumable operations.
3. **Verify:** Compare records/projections, test active and old-format operations, and confirm consumers have drained relevant old work.
4. **Contract later:** Remove obsolete schema/contracts only in a separately reviewed release after retention and rollback implications are understood.

Do not edit shared migration history, permanently disable constraints or run destructive cleanup as an automatic rollback. Backfill must not trigger duplicate collection, refunds or reward effects.

### Compatibility matrix to complete

| Combination | Required assessment | Result |
|---|---|---|
| Old API + expanded schema | Reads/writes and constraints remain valid | TBD |
| New API + expanded schema | Required columns/defaults available | TBD |
| Old/new workers + queued event versions | Payload/state interpretation and effect identity safe | TBD |
| Supported old client + new API | Auth, fields, enums, errors and payment-return behavior | TBD |
| New client + previous API during rollback | Supported fallback or explicit minimum-version handling | TBD |
| Previous artifact + current secret/config revision | Valid access and semantics without restoring compromised credentials | TBD |
| Previous artifact + contracted schema | Usually unsafe unless specifically verified | TBD |

Deploy consumer compatibility before producers emit new event types when necessary. Do not use a fixed “API first” or “worker first” rule when the actual event/schema change requires a different order.

## 7. Existing Work During Deployment

| Activity | Default treatment | Reason |
|---|---|---|
| New checkout | Pause or restrict if migration/compatibility risk requires it | Prevent new exposure during transition |
| Existing intent/status lookup | Preserve | Customers must recover interrupted purchases |
| Provider callbacks | Preserve verified durable receipt | Financial events may arrive throughout release |
| Payment/refund reconciliation | Preserve or resume from durable checkpoint within approved limits | Unknown outcomes remain obligations |
| Existing store fulfillment | Preserve where compatible; otherwise explicit operating contingency | Accepted orders cannot be abandoned |
| New worker claims | Drain/pause affected consumers when required | Avoid incompatible in-flight work |
| In-flight external operations | Track by stable reference; do not assume stopped process means canceled action | Prevent duplicate effects |
| Notifications | May queue during maintenance; business state remains authoritative | Delivery is not transaction truth |
| Loyalty adjustment work | Retain durable jobs/reservations | Completion must not be undone by delayed rewards |

Graceful drain stops claiming new work and allows bounded completion. If a worker cannot finish, retain lease/operation identity and recover via the approved reconciliation path. Expired leases do not justify blindly repeating financial calls.

## 8. Deployment Procedure

Each step records start/end time, operator, actual action, evidence and outcome. On failure, stop the next dependent step and use Section 11.

### DEP-01 — Verify approved candidate and target

Confirm release record, actual go/no-go, artifact digest, configuration, schema target, environment/provider identity and responders. Check that no conflicting release or incident is changing the same environment.

**Pass evidence:** Exact candidate and environment independently identifiable; approval and owner recorded.

### DEP-02 — Capture baseline and unresolved obligations

Record current artifact/config/schema, key health metrics, pending payment/refund counts and ages, order queue, worker backlog, loyalty reservations and catalog sync age. Record any preexisting incidents so they are not hidden or wrongly attributed to the release.

**Pass evidence:** Timestamped baseline and owned unresolved cases; previous compatible target identified.

### DEP-03 — Establish recovery checkpoint

Verify backup/PITR prerequisites and the most recent successful restore rehearsal. Take the approved prechange checkpoint when required by migration risk. Validate that backup identity and recovery window are usable; backup job success alone is insufficient evidence of restore readiness.

**Pass evidence:** Backup/checkpoint reference, recoverability assessment and Database Owner confirmation.

### DEP-04 — Restrict new work and drain as designed

Apply selected pilot/checkout pause and affected-worker drain controls. Verify the control actually takes effect at the server boundary, not only by hiding a client button. Preserve callback receipt, status retrieval and existing-obligation handling.

**Pass evidence:** New submission behavior verified; in-flight work accounted for; essential recovery paths active.

### DEP-05 — Apply compatible migration/configuration preparation

Execute the approved migration runner and compatible configuration changes. Observe lock time, database errors and business-service health. Record applied schema/checksum. If partially applied, follow the engine-specific repair/forward-fix procedure; do not blindly rerun nonidempotent DDL.

**Pass evidence:** Expected schema state, constraints and migration record; no unexplained partial application.

### DEP-06 — Deploy compatible application and consumers

Deploy immutable artifact(s) in the dependency order from Section 6. Verify process startup, schema compatibility, secret references and readiness before shifting traffic or increasing replicas. Keep old compatible capacity available if the selected rollout strategy permits it.

**Pass evidence:** Running artifact/configuration identities match the release record; required units ready.

### DEP-07 — Resume controlled work

Resume selected worker claims and verify outbox/inbox processing, lease behavior, provider lookup and notification/loyalty queues. Enable checkout only for the approved pilot cohort after prerequisites pass.

**Pass evidence:** No unbounded job growth, invalid event mapping or unintended external repeat; pilot restriction effective.

### DEP-08 — Run smoke and reconcile outcomes

Perform Section 9 checks using approved procedures. Record order/intent/provider references and settle or track any resulting obligations. Validate both customer and staff views against authoritative facts.

**Pass evidence:** Critical path and recovery signals correct; no financial/access-control invariant violation.

### DEP-09 — Observe and decide progression

Observe for the agreed window with target workload/cohort. Compare against baseline and approved thresholds. Review pending-case age and financial consistency, not just HTTP uptime. Record expand/hold/rollback/forward-fix decision.

**Pass evidence:** Thresholds and business outcomes assessed with named decision maker.

### DEP-10 — Close and hand over

Record deployed versions, times, evidence, incidents, known issues and ownership. Keep monitoring heightened for the agreed period. Schedule destructive schema cleanup separately; do not perform it merely because deployment completed.

**Pass evidence:** Accurate release record and support/operations handover, including unresolved obligations.

## 9. Production Smoke Checks

These checks require approved test identities and transaction handling. Do not conduct uncontrolled load, destructive tests or real customer messaging as routine smoke work.

| Check | Expected outcome |
|---|---|
| Service identity/readiness | Actual running source/artifact/config/schema matches release |
| Auth and scope | Approved user/staff can access expected data; unauthorized sample access denied |
| Store/menu | Correct store context and published data; ordering pause/cohort rules enforced |
| Quote | Approved items, currency, tax/discount and total; no client override |
| Checkout | Durable intent/order reference; repeated same key recovers same operation |
| Payment | Trusted outcome or clear pending state; redirect alone does not mark paid |
| Staff fulfillment | Correct assigned queue and permitted transitions |
| Tracking/history | Accurate separate states and owned records |
| Loyalty | Selected rule effect or clearly owned pending adjustment; no duplicate effect |
| Notifications | Approved recipient/sink behavior; failure does not undo transaction |
| Financial recovery | Status/reconciliation can locate the operation and any refund/exception |
| Monitoring | Test event/failure signal appears at the expected dashboard/owner |

If a real production transaction is required to validate the provider, obtain/use the existing approved procedure, amount, participants and reconciliation/refund plan. A mock-only smoke result must be labeled and cannot certify the live provider connection.

## 10. Observation Threshold Register

Fill values before go/no-go. Blank values are not acceptable evidence that a service is healthy.

| Signal | Required threshold/window | Owner |
|---|---|---|
| Critical API latency and error rate | Approved p95 and error budget/window | Technical Lead |
| Pending payment/refund age and growth | Maximum age/backlog and escalation | Finance / Operations |
| Duplicate collection, incorrect total, unauthorized access | Any confirmed occurrence blocks expansion and triggers incident response | Incident / domain owner |
| Worker/outbox/inbox age | Approved backlog age and recovery expectation | Backend / Operations |
| Store acceptance delay/unfulfilled orders | Approved operational threshold | Store Operations |
| Catalog sync age | Approved freshness/checkout policy | Catalog owner |
| Reward reservation/adjustment age | Approved policy and escalation | Loyalty owner |
| Database locks/errors/resources | Approved workload-specific bounds | Database Owner |
| Pilot window/cohort | Agreed duration and coverage before expansion | Product / Release Owner |

Automated rollout controls may be used only after their signal and action semantics are verified. A pause should not automatically kill callback ingestion or financial reconciliation.

## 11. Failure Decision Matrix

| Observed condition | Immediate action | Likely recovery path |
|---|---|---|
| Candidate fails before traffic shift; no incompatible data change | Stop progression, retain current healthy version | Correct candidate or return to prior artifact |
| Migration partly applied | Stop dependent deploy; inspect recorded state/locks | Engine-specific repair or forward fix |
| New application fails with backward-compatible schema | Pause new checkout, preserve obligations | Verified prior compatible artifact/configuration |
| New event/schema semantics unsupported by old code | Stop unsafe promotion/claims | Forward fix or compatibility adapter; no blind rollback |
| Duplicate charge/wrong total/unauthorized access | Contain affected actions; preserve evidence; incident response | Domain-specific fix and financial/security resolution |
| Provider outage/unknown outcomes | Block independent new attempt where required; retain pending state | Lookup/reconciliation after recovery; not automatically a code rollback |
| Database corruption/data loss | Isolate writes and preserve evidence | Disaster recovery procedure in Section 13 |
| Client distributed through app store already incompatible | Preserve compatible API or gate affected feature | Forward-compatible backend fix/client update plan |

Choose based on facts, not an automatic rule that any alarm requires reverting code. Record decision owner, rationale, expected impact and prerequisites.

## 12. Application Rollback Procedure

### RB-01 — Declare scope and contain exposure

Identify incident/release, affected functions, current state and decision owner. Pause new risky operations using verified server controls. Keep essential existing-order and financial recovery paths operating where safe.

### RB-02 — Prove the rollback target is compatible

Check previous artifact against current schema, data, queued event versions, provider settings, session behavior and supported clients. Confirm whether newer migrations or records prevent safe use. If incompatible, stop and choose a forward fix or specifically reviewed recovery plan.

Do not automatically restore old secrets. Revoked/compromised credentials must remain revoked; use a valid approved revision compatible with the target.

### RB-03 — Account for in-flight work

Record pending attempts/refunds, worker claims, inbox/outbox and reservations. Drain affected consumers. Any process stopped during a provider call leaves an unknown operation until evidence resolves it.

### RB-04 — Restore compatible application/configuration

Use the bound release mechanism to select the verified prior artifact and compatible configuration. Do not move a release tag, rebuild an unrecorded binary or overwrite protected source history. Avoid database downgrade unless separately designed, tested and explicitly authorized for this case.

### RB-05 — Verify and reconcile

Check running identity/readiness, authorized access, reads, current state and worker compatibility. Resolve pending provider outcomes using original references. Confirm no duplicate collection/refund/reward effect and no lost accepted order.

### RB-06 — Reopen gradually and record outcome

Resume new work only after decision-maker review of technical and financial evidence. Monitor against thresholds. Record rollback artifact/config/schema, times, incident, unresolved cases and next fix. Rollback success is not incident closure while obligations remain unowned.

## 13. Database Restore / Disaster Recovery

Database restore is distinct from ordinary application rollback and requires the approved disaster-recovery decision and environment-specific procedure.

1. **Contain:** Pause new writes/financial initiation as required; preserve surviving logs/evidence and current database snapshot where possible.
2. **Select recovery point:** Database Owner identifies recoverable backup/log boundary and expected data gap against approved RPO/RTO.
3. **Preserve financial intake:** Maintain verified durable callback receipt separately if designed, or rely on an explicitly verified provider redelivery/query mechanism. Do not acknowledge events that cannot be stored durably.
4. **Restore in controlled target:** Use the selected engine's tested procedure; validate schema, constraints, keys and snapshot totals.
5. **Determine missing external activity:** Query provider evidence after the recovery checkpoint, including late outcomes and refunds, using stable merchant operation references.
6. **Recover obligations:** Reconstruct/link approved records through reviewed idempotent recovery tooling; quarantine unmatched evidence. Do not fabricate a fulfilled order from a payment alone.
7. **Inspect durable work:** Review old leases, replayable events, consumer receipts, refund exposure and loyalty reservations. Replay only through safe effect identities.
8. **Validate:** Reconcile financial totals and individual exceptions; confirm ownership and access; measure actual recovery duration/data gap.
9. **Resume by decision:** Reopen only after technical/finance/operations approval for the recovered state; unresolved unsafe cases block affected actions.

Required evidence includes backup/checkpoint, restored versions, reconciliation period, missing/recovered records, exceptions, RPO/RTO result and approval. A database health check alone is insufficient.

## 14. Provider and Worker Recovery Notes

- A local timeout, stopped process or expired lease does not prove a provider action failed.
- Stable payment/refund operation references survive deploys, rollbacks and retries.
- A repeated callback is accepted safely only after origin/integrity/context verification and durable deduplication.
- Late payment on a canceled/rejected order remains a financial exception; do not silently reopen fulfillment.
- Pending refund reservations remain part of exposure until definitive evidence permits release.
- Reward reservations cannot expire blindly while payment is unresolved; apply the approved resolution policy.
- Notification delivery may be delayed without reversing business state.
- Retry exhaustion creates an owned exception; it does not erase the obligation.
- External POS/loyalty authority must be reconciled through its contract; local projection edits are not proof of external resolution.

## 15. Mobile and Client Compatibility

If native mobile clients are selected, distribution updates may be delayed or irreversible for already-installed versions. Backend rollback must preserve the supported client contract or follow an approved version-gating/forward-fix plan. Do not assume withdrawing a store release removes it from installed devices.

For web clients, consider cached assets and active sessions during deployment. Use versioned assets and a compatible API window as designed. An old payment-return page must still recover the original intent safely rather than submit again.

Required supported-version matrix and update policy are TBD under platform/API decisions. Test representative older clients before reducing compatibility.

## 16. Communication and Handover Records

Before execution, identify who receives operational updates, who can decide, and which channels are approved. This document supplies record fields; it does not send messages or invite participants.

| Update | Content |
|---|---|
| Start | Release/candidate, environment/cohort, window, owner and expected impact |
| Hold/incident | Observed condition, containment, decision owner, next checkpoint |
| Rollback/forward fix | Selected path, compatibility assessment and known obligations |
| Completion | Actual deployed versions, smoke/observation evidence and outcome |
| Handover | Remaining cases, alert owners, follow-up work and monitoring period |

Keep user/customer messages accurate about pending outcomes; do not promise refund completion or recovery time without evidence and approved policy. Exclude credentials, private contact data and raw financial payloads from shared updates.

## 17. Rehearsal and Acceptance Checklist

Before this guide is considered executable:

- [ ] Environment register includes actual commands/units and named owners.
- [ ] Operator can identify exact artifact/config/schema and target account.
- [ ] Deployment sequence exercised in a representative isolated environment.
- [ ] Migration interruption/backfill handling verified on the selected engine.
- [ ] Pause/drain/resume tested without abandoning financial obligations.
- [ ] Old/new schema, API, event and client compatibility assessed.
- [ ] Application rollback and incompatible-target refusal demonstrated.
- [ ] Restore plus external financial reconciliation rehearsed against RPO/RTO.
- [ ] Smoke procedures and transaction cleanup approved.
- [ ] Monitoring thresholds and incident decision paths populated.
- [ ] Actual evidence linked to the candidate's release gates.

Rehearsal evidence maps to TC-049–056 in `11-test-plan.md` and UAT-18 in `12-uat-and-sign-off.md`. Those case references do not mean they have passed.

## 18. Completion Report Template

| Field | Actual result |
|---|---|
| Release / incident ID | TBD |
| Outcome | NOT EXECUTED |
| Final artifact/config/schema | TBD |
| Start/end/observation times | TBD |
| Migration result | Pending |
| Smoke and threshold results | Pending |
| Payment/refund/reward reconciliation | Pending |
| Existing orders and unresolved cases | Pending review |
| Rollback/forward-fix actions | Not executed |
| Accepted issues and owners | Pending review |
| Expansion/hold decision | NOT DECIDED |
| Decision maker / evidence | TBD |

Planned `14-release-checklist.md` should provide the concise execution gate list; planned `15-operations-runbook.md` should cover ongoing incidents and maintenance. References do not imply those files exist.

## 19. Approval and Change History

| Review | Reviewer | Status / date |
|---|---|---|
| Deployment mechanism and controls | DevOps / Release Owner — TBD | Pending / — |
| Schema and restore procedure | Database Owner — TBD | Pending / — |
| Financial recovery and provider handling | Finance / Technical Lead — TBD | Pending / — |
| Store/support continuity | Operations / Support Owner — TBD | Pending / — |
| Rehearsal and acceptance evidence | QA Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-12 | Initial deployment sequence, compatibility gates, smoke checks, rollback/restore procedures and evidence templates |

Creating this guide does not authorize or execute a release. Bind it to the actual environment, rehearse the critical paths, and record the release-specific decision before production execution.
