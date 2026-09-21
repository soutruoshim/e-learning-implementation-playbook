---
title: "15 — Operations Runbook"
---

# 15 — Operations Runbook

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | OPS-001 |
| Version / status | 1.0 / Proposed operational baseline awaiting environment binding and drills |
| Created / updated | 2026-09-12 |
| Accountable owner | Operations / Service Owner — TBD |
| Sources | Documents 01–14, especially SDD, database specification, test plan and deployment guide |
| Scope | Pickup-first MVP, existing orders, payment/refund/reward obligations and support |
| Environment / service URLs | TBD |
| Operating hours / coverage | TBD; not assumed to be 24/7 |
| Execution status | No incident response, maintenance, reconciliation or recovery executed by this document |

> This runbook defines operator decisions, evidence and safe actions. Actual services, commands, dashboards, access roles, numeric thresholds and contacts must be bound and rehearsed before operational use. A document describing a control does not prove that the control exists. Product rules, provider capabilities and source authority remain governed by approved decisions. Use `13-deployment-and-rollback.md` for deployment and restore procedures and `14-release-checklist.md` for release gates.

## 1. Service Objectives and Nonnegotiable Controls

Support customer ordering and store fulfillment while keeping all transaction outcomes traceable and recoverable.

- Payment, fulfillment, refund and loyalty states remain separate.
- Unknown provider outcomes stay pending or under investigation; timeout is not proof of failure.
- Every financial operation retains its stable reference across retries, incidents and restores.
- New checkout can be paused without abandoning existing orders or financial obligations.
- Verified callback intake and reconciliation continue, or use a tested durable alternative.
- Repeated events/commands must not create repeated collection, refund or reward effects.
- Operators use authorized, audited commands; direct ad hoc financial-state edits are not a routine repair method.
- Customer messages state known facts and next steps; they do not promise unverified refunds or recovery times.
- Restoring a database or restarting a process does not undo external money movement.

## 2. Operational Binding Register

Complete and verify these entries before accepting service handover. Keep credentials out of this document.

| Capability | Required binding | Status |
|---|---|---|
| Service inventory | API, client, worker, database, optional queue/cache and authority adapters | TBD |
| Environment identity | Account/project, region, provider merchant/environment | TBD |
| Health/readiness | Actual endpoint/command and expected output | TBD |
| Dashboards | Journey, financial, queue, database, catalog and store views | TBD |
| Alerts | Signal, severity, thresholds, routing and escalation | TBD |
| On-call/support coverage | Hours, primary/backup and out-of-hours handling | TBD |
| New-checkout pause | Exact server-side control and propagation verification | TBD |
| Store pause/availability | Approved owner and safe command/interface | TBD |
| Worker drain/restart/replay | Actual controls and lease/operation lookup | TBD |
| Payment/refund lookup | Provider and internal stable-reference queries | TBD |
| Reconciliation | Schedule, checkpoints, lookback and exception queue | TBD |
| Support lookup | Authorized roles and record access | TBD |
| Backup/restore | Tested procedure, RPO/RTO, references and owner | TBD |
| Secrets | Rotation/access mechanism and incident owner | TBD |
| Retention/deletion | Approved schedule and request workflow | TBD |
| Incident records | Tracker/channel and permitted evidence location | TBD |

Only read-only diagnostic steps can be generalized safely before environment binding. Mutation/replay/restore commands must identify target, authority, expected effect, idempotency and verification. Do not invent shell commands from logical service names.

## 3. Ownership and Escalation

| Role | Primary responsibility | Named owner / backup |
|---|---|---|
| Service Owner | Overall reliability, priorities and handover | TBD / TBD |
| Incident Commander | Coordinate response, containment and decisions | TBD / TBD |
| Application/Backend Owner | API, state logic, workers and integration faults | TBD / TBD |
| Database/DevOps Owner | Infrastructure, migrations, backup and recovery | TBD / TBD |
| Finance/Payment Owner | Provider evidence, refunds and reconciliation decisions | TBD / TBD |
| Loyalty Owner | Reward policy, adjustments and exceptions | TBD / TBD |
| Store Operations | Fulfillment, store pauses and staff response | TBD / TBD |
| Support Lead | Customer cases, explanations and escalation | TBD / TBD |
| Product Owner | Scope/policy decisions and customer impact | TBD / TBD |
| Security-capable Owner | Access incidents, credentials and sensitive-data exposure | TBD / TBD |

### Proposed severity model

| Severity | Example | Response |
|---|---|---|
| SEV-1 | Confirmed duplicate collection, unauthorized private access, widespread inability to order/fulfill, lost financial evidence | Immediate incident activation within agreed coverage; contain affected actions; engage domain owners |
| SEV-2 | Significant subset of stores/users affected, growing unknown-payment backlog, refund/reward recovery stuck | Prioritized coordinated response and explicit escalation |
| SEV-3 | Limited degradation with safe workaround and no immediate invariant breach | Owned case, scheduled investigation and monitoring |
| SEV-4 | Minor issue or improvement with no material service impact | Normal backlog and owner |

Severity reflects actual impact. A single unauthorized-access or wrong-money event can be SEV-1 even at low volume. Numeric acknowledgement, escalation, update and recovery targets must be agreed; none are assumed here. Record how after-hours alerts are handled before launch.

## 4. Monitoring and Service Health

| Signal | What to observe | Action trigger / owner |
|---|---|---|
| Critical journey | Store/menu, quote, submit acknowledgement and order status latency/errors | Approved NFR targets; Application Owner |
| Payment/refund | Pending age, unresolved count, mismatches, late success and duplicate evidence | Approved age/window; Finance + Backend |
| Store fulfillment | Unaccepted/preparing/ready age, rejected orders and paused stores | Approved store thresholds; Operations |
| Durable work | Outbox/inbox age, retry exhaustion, lease churn, dead-letter cases | Approved limits; Backend |
| Loyalty | Held reservation age, delayed effects and ledger/projection differences | Approved rule/age; Loyalty |
| Catalog | Last successful sync, active revision, failed imports and stale eligibility | Freshness policy; Catalog Owner |
| Database | Errors, contention, deadlocks, connections, storage and recovery-log status | Workload-specific thresholds; Database Owner |
| Notification | Delivery failure/retry rate, invalid destinations | Channel policy; Backend/Support |
| Access/security | Denied/abusive traffic and confirmed anomalous access | Approved controls; Security-capable Owner |
| Backups | Job outcome plus last verified restore/reconciliation rehearsal | Approved RPO/RTO/retention; DevOps |

A healthy process is not proof of a healthy journey. Readiness must detect required dependency/schema issues without exposing credentials. Dashboards distinguish expected validation/business refusals from service faults.

Every alert needs signal definition, threshold/window, severity, owner, next escalation and runbook section. Suppression during maintenance is bounded and recorded; it must not hide financial-integrity alerts indefinitely.

## 5. Routine Operating Cadence

Cadence is proposed; set actual times/frequencies to match stores, settlement windows and support coverage.

| Frequency / trigger | Checks | Evidence |
|---|---|---|
| Start of support/store coverage | Service health, paused stores, unresolved payments/refunds, stale catalog and overnight cases | Named handover and exception list |
| Each approved reconciliation cycle | Provider/internal matching, pending aging and unmatched evidence | Checkpoint, counts, case references and owner |
| During operating hours | Queue/alert review and customer/staff escalations | Case status and next action |
| End of coverage | Accepted unfulfilled orders and unresolved financial/reward obligations | Explicit transfer to next owner; no unowned cases |
| Weekly or agreed review | Incident trends, retry exhaustion, recurring store problems, capacity and open risks | Improvement actions and accountable owners |
| Scheduled maintenance cycle | Dependency/credential/retention tasks and backup verification | Reviewed change and validation evidence |
| After significant release/change | Heightened observation and targeted regression/reconciliation | Release-linked outcomes |

Do not close a pending case merely because a shift ends. The next owner and response plan must be explicit, including out-of-hours responsibility.

## 6. Common Incident Response Procedure

### INC-01 — Record and scope

Create an incident/case reference. Capture time, affected environment/stores/users, symptoms, source/artifact/config/schema versions and safe correlation IDs. Determine whether the issue is new or preexisting. Preserve evidence without collecting unnecessary personal data.

### INC-02 — Assess and contain

Identify customer, financial, privacy and fulfillment impact. Choose severity and owner. Pause affected new actions only as needed; preserve existing-obligation handling. Do not retry payments or clear reservations just to reduce a queue.

### INC-03 — Diagnose authoritative state

Compare customer view, internal durable records and selected external authority. Check provider status using original operation reference, worker/inbox/outbox state, recent changes and scope. A screenshot or local timeout alone is not financial evidence.

### INC-04 — Choose a reviewed recovery action

State target, expected effect, authority, retry identity, compatibility and verification. Prefer least-disruptive corrective action. Use a tested command/replay or deployment rollback procedure; escalate when provider semantics or policy are unknown.

### INC-05 — Verify and reconcile

Verify the intended business outcome, not only process health. Reconcile affected orders, money, refunds and rewards. Confirm repeated events do not duplicate effects and that customer/staff status reflects current facts.

### INC-06 — Communicate and close responsibly

Record current impact, known facts, next action and next update checkpoint through approved channels. Close only after service is stable and residual obligations are resolved or explicitly transferred with owner and tracking. Record root cause when known, corrective actions and follow-up review.

## 7. Playbook OP-01 — API or Customer Journey Unavailable

**Signals:** Elevated critical-path errors/latency, failed readiness, customers unable to quote/submit/read orders.

1. Confirm affected routes, stores and versions; distinguish dependency failure from client-only network problems.
2. Check API/database readiness, recent deployment/configuration, capacity and worker state.
3. If new ordering is unsafe, apply verified checkout pause. Preserve status retrieval and existing-order support where possible.
4. Diagnose provider/catalog/identity outage separately; do not assume a code rollback fixes an external outage.
5. Use compatible rollback/forward fix under deployment guide if evidence points to a release regression.
6. Verify quote/checkout/status and reconcile interrupted submissions before reopening.

**Do not:** Tell customers to create a new purchase when the original outcome is unknown; repeatedly restart everything without observing in-flight work.

**Recovery evidence:** Critical journey within approved bounds, interrupted intents recoverable and no unowned financial cases.

## 8. Playbook OP-02 — Payment Pending, Missing or Contradictory

**Signals:** Customer reports debit without confirmation, pending-age alert, unmatched callback, local/provider mismatch.

1. Locate owned order/intent and stable merchant operation reference; verify environment/provider account.
2. Read every related attempt and authoritative provider evidence. Identify whether an attempt is pending, definitively failed, successful or contradictory.
3. If unknown, retain pending state and block an independent new collection for that intent. Query/reconcile the original operation.
4. If provider success matches a fulfillable order, apply through the approved idempotent outcome processor.
5. If success belongs to a terminal/nonfulfillable order, preserve financial fact and create an authorized resolution/refund case; do not reopen fulfillment silently.
6. If evidence cannot be matched or provider capabilities are insufficient, retain an owned exception and escalate to Finance/Backend.
7. Verify customer state and ledger/attempt records after recovery.

**Do not:** Mark paid from a screenshot, mutate a success flag manually, or treat absence in a temporarily inconsistent provider query as definitive failure.

**Customer explanation:** State that confirmation is being checked and whether another payment should be avoided; provide the safe reference and next update under approved policy.

**Closure:** Original outcome reconciled, correct order/refund path recorded, no duplicate collection and customer/support ownership resolved.

## 9. Playbook OP-03 — Suspected Duplicate Collection or Wrong Amount

**Signals:** Confirmed mismatch or multiple external collections for one intended purchase.

1. Activate incident response and contain the affected initiation path/cohort.
2. Preserve all intent, attempt, quote, provider and event references; do not delete the apparent duplicate.
3. Finance verifies actual collected amounts and distinguishes separate deliberate purchases from duplicate effects.
4. Engineering investigates operation keys, canonical payloads, gates, provider retry semantics and recent changes.
5. Finance authorizes the approved correction/refund with its own stable operation identity. Do not issue overlapping refunds from separate teams.
6. Verify refundable exposure, corrected financial outcome and customer communication.
7. Reopen only after the cause is controlled and required regression evidence supports the decision.

**Closure:** Money reconciled, affected population assessed, corrective action traceable, no ongoing duplicate path and follow-up owner assigned.

## 10. Playbook OP-04 — Refund Delayed, Failed or Over-Requested

1. Locate payment and all related refund requests, including reserved/pending amounts.
2. Verify role, approved reason/policy, amount/currency and provider reference.
3. Query the existing refund when outcome is unknown; keep reserved capacity intact.
4. Apply verified success once or release reservation only after definitive nonexecution under provider rules.
5. If another refund request would exceed remaining capacity, reject it and explain current pending exposure to the operator.
6. Escalate contradictory or prolonged outcomes with provider evidence and a case owner.

**Do not:** Call a refund completed when merely requested; clear a pending reservation to enable a second refund; promise bank arrival time without approved evidence.

**Closure:** Provider/internal refund totals reconcile; pending and succeeded exposure is consistent; customer sees accurate current status.

## 11. Playbook OP-05 — Store Queue or Fulfillment Problem

**Signals:** Orders unaccepted too long, staff queue stale, invalid/conflicting transitions, store unable to operate.

1. Verify store assignment, payment eligibility and authoritative fulfillment owner.
2. Compare queue freshness with current order details; refresh/reconnect through approved interface.
3. For stale-command conflicts, retrieve latest version and select a currently permitted action; do not force the previous transition.
4. If store cannot fulfill new work, pause new ordering for that store using the authoritative control.
5. Account for existing accepted/preparing/ready orders and assign operational resolution under cancellation/rejection/no-show policy.
6. For external POS authority, query/reconcile its command reference rather than overwriting a local projection.

**Do not:** Mark ready orders completed automatically to clear a queue; accept a payment-ineligible order without approved policy.

**Closure:** Correct queue/current states visible; every affected order has fulfillment or exception ownership; pause/resume decision recorded.

## 12. Playbook OP-06 — Catalog, Price or Availability Stale

1. Identify store, active revision, source authority, last successful sync and failed import/checkpoint.
2. Verify whether content is cached, a partial staged revision, or a current authoritative snapshot.
3. Apply the approved stale-data policy: block affected checkout, query authority or pause store as designed.
4. Repair synchronization/configuration and publish only a complete validated revision.
5. Confirm new quotes use correct availability/pricing; changed quotes require customer review.
6. Review any affected completed purchases separately through Product/Finance; never reprice historical orders from the corrected menu.

**Do not:** Force-publish an incomplete import, invent stock availability or assume a boolean available flag reserves physical stock.

**Closure:** Freshness restored, active revision traceable, checkout validation correct and historical discrepancies owned.

## 13. Playbook OP-07 — Worker Backlog, Expired Lease or Poison Event

1. Identify affected work type, oldest age, retry count, claim token and original operation/event reference.
2. Check downstream rate limits, configuration, database contention and consumer/event compatibility.
3. Drain only affected consumers if unsafe; retain durable work and necessary financial receipt/reconciliation paths.
4. Classify retryable transport failure versus unknown financial effect versus permanent invalid/configuration error.
5. Use approved bounded replay with the original identity. A stale worker must not overwrite a newer claim; external safety still relies on provider deduplication/lookup.
6. Quarantine unsupported/contradictory events with an owner. Retry exhaustion does not authorize deletion.
7. Verify backlog recovery and no duplicated side effects before increasing concurrency.

**Do not:** Reset all retry counters or delete receipts blindly; assume lease expiry proves no external action occurred.

**Closure:** Queue age within agreed limits, affected operations reconciled, poison cases owned and repeat failure cause addressed.

## 14. Playbook OP-08 — Reward Missing, Reserved or Incorrect

1. Confirm selected scheme/authority, approved rule version and qualifying event.
2. Inspect original earning/redemption/reversal effect and reservation linked to intent/order.
3. If payment remains unknown, do not release value solely because reservation expiry elapsed.
4. If qualifying event committed but adjustment failed, replay its unique effect through the approved consumer; preserve completed fulfillment.
5. For incorrect applied value, use authorized linked adjustment/reversal under approved policy, not deletion of history.
6. For external authority, reconcile its operation and balance/benefit; local projection is not permission to spend or credit.
7. Verify no duplicate effect and correct customer history/available value.

**Do not:** Guess earning rates, restore expired benefits without policy, or grant manual compensation through untracked database edits.

**Closure:** Approved effect reconciled or explicitly owned; original history retained and customer display accurate.

## 15. Playbook OP-09 — Notification Failure or Wrong Destination

1. Identify committed business event, recipient/channel, delivery state and current account/device association.
2. Check permission, token validity, provider configuration and retry policy without exposing token values.
3. For failed delivery, retry within approved bounds or disable invalid destination as designed; order state remains authoritative.
4. If a wrong-account/private notification is suspected, contain affected destination delivery and engage the security-capable owner.
5. Verify links authenticate and retrieve current authorized state, including after account switch.

**Do not:** Resend every historical notification indiscriminately or change business state to simulate successful delivery.

**Closure:** Correct routing or owned provider issue; no ongoing private-data exposure; orders remain independently accessible.

## 16. Playbook OP-10 — Identity, Access or Secret Incident

1. Establish whether the issue is ordinary expired access, configuration failure, abusive traffic or confirmed unauthorized exposure.
2. Preserve safe evidence and identify scope; do not circulate compromised values.
3. Security-capable/identity owner applies approved session revocation, credential rotation or affected-access containment.
4. Verify dependencies use valid new secret references; never restore revoked credentials during rollback.
5. Test owner/store/role boundaries and recovery using approved accounts.
6. Follow the organization's incident assessment and notification obligations through accountable owners; this runbook does not assert jurisdiction-specific reporting rules.

**Do not:** Disable authentication/signature checks to restore availability or use a shared universal admin shortcut.

**Closure:** Access controlled, affected credentials/sessions handled, scope assessed and remaining response actions assigned.

## 17. Playbook OP-11 — Database Degradation or Recovery

1. Check actual instance/schema identity, connection errors, locks, resource capacity and recent migration/change.
2. Coordinate new-write containment if correctness or availability is at risk; preserve financial references and evidence.
3. Diagnose before terminating sessions or restarting services; assess transaction rollback and external-call uncertainty.
4. Use approved capacity/configuration/compatible application fix where appropriate.
5. If restore is required, follow Section 13 of `13-deployment-and-rollback.md`: select recovery point, restore, reconcile external activity and verify RPO/RTO before resuming new collection.
6. Inspect worker leases, inbox/outbox, refund exposure and reward reservations after recovery.

**Do not:** Treat a database restart or successful restore job as proof of financial correctness; run unreviewed destructive SQL or downgrade migrations blindly.

**Closure:** Healthy database plus reconciled business state, preserved constraints and explicit operational reopening decision.

## 18. Financial Reconciliation Procedure

### Inputs

Approved provider account/environment; prior durable checkpoint; lookback window accommodating late records; internal attempt/refund references; provider query/statement evidence; and named Finance/Backend owners. Actual cadence and finality assumptions are D-05/D-14 decisions.

### REC-01 — Establish scope

Record run ID, provider/account, period, checkpoint and data freshness. Use overlapping boundaries where needed with stable deduplication; a timestamp-only cursor may miss delayed outcomes.

### REC-02 — Match records

Match by stable merchant/provider operation reference, currency and amount. Check pending internal operations, unmatched provider successes, terminal orders with collected money, refunds and contradictions. Summary totals complement individual matching; they do not replace it.

### REC-03 — Apply safe corrections

Use the approved idempotent outcome processor for verified matching facts. Create owned cases for mismatches or missing business context. Do not create a fictitious collected order or erase excess evidence to make totals match.

### REC-04 — Verify and checkpoint

Record matched/unmatched/pending counts and amounts by currency, applied corrections, unresolved cases and owners. Advance checkpoint only after the covered data/evidence is durably handled under the approved procedure. Keep late-lookback coverage.

### REC-05 — Review outstanding exposure

Finance reviews old unknown outcomes, reserved refunds, paid terminal orders and permitted customer resolutions. Never release pending capacity simply to improve dashboard totals.

**Run record:** Run ID/time, provider namespace, period/checkpoint, result counts/amounts, evidence references, adjustments, unresolved cases, owner and next action. No secret/raw credential payloads.

## 19. Maintenance and Data Lifecycle

| Activity | Required controls and verification |
|---|---|
| Backup verification | Monitor jobs and periodically rehearse restore plus financial reconciliation; record measured RPO/RTO |
| Credential rotation | Inventory references, staged compatible update, revoke old access, verify dependent services |
| Dependency/runtime updates | Reviewed change, relevant regression, deployment compatibility and rollback/forward-fix plan |
| Database/index maintenance | Assess locking/capacity, bounded execution and service impact; retain financial history |
| Catalog/adapter changes | Confirm authority/mapping, staged validation and reconciliation impact |
| Retention cleanup | Approved policy, bounded batches, unresolved-obligation exclusions and audit |
| Account deletion | Authenticate request, apply active-obligation policy, anonymize/delete approved data, retain justified records and accurate acknowledgement |
| Log/analytics review | Verify redaction, access and retention; remove unnecessary personal fields through reviewed change |
| Recovery drills | Exercise failure boundaries without real customer impact; update evidence and gaps |

Do not purge consumer receipts, intent guards or provider references merely because a short response cache expires. Archive/deduplication retention must support late events and recovery. Backup retention/deletion behavior is part of the approved privacy lifecycle; soft deletion is not erasure.

## 20. Support Case and Communication Records

| Case field | Required content |
|---|---|
| Case/incident ID | Stable tracking reference |
| User/order context | Minimum authorized identifiers; avoid unnecessary contact data |
| Known outcome | Separate payment, fulfillment, refund and reward facts |
| Customer-reported symptom | Clear description, not treated as provider proof |
| Evidence | Safe internal/provider references and current versions |
| Owner/severity | Named accountable responder |
| Next action/checkpoint | Specific task and agreed update time |
| Resolution | Verified outcome, action reference and customer follow-up |

Prepare updates through approved channels. This runbook does not send messages or authorize contacting unspecified recipients. Communicate what is known, what is still being checked, the safe next action and the next update point. Avoid guarantees about refund arrival or recovery deadlines that have not been approved.

An incident handover lists unresolved operations and their owners, not only a general “system stable” statement.

## 21. Incident Closure and Learning

Close the incident when containment/recovery is verified, service targets are assessed, affected financial/order/reward obligations are resolved or explicitly transferred, and customer/support follow-up is assigned.

Post-incident record includes impact, timeline, contributing cause, detection/response gaps, evidence, corrective actions, owners and due points. Distinguish confirmed cause from hypotheses. Review whether alerts, test cases, source contracts, setup/deployment guides or this runbook need changes.

Do not use a successful restart as the root-cause conclusion without evidence. Track recurring manual repairs as engineering work rather than institutionalizing unsafe shortcuts.

## 22. Operational Acceptance and Drill Matrix

| Drill | Required result | Test-plan reference |
|---|---|---|
| Unknown/late payment | Original outcome recoverable; no duplicate initiation | TC-024–027 |
| Refund uncertainty | Pending capacity retained; one verified effect | TC-028–030 |
| Store interruption | Existing commitments owned; new pause works | TC-033–035 |
| Reward delay/expiry | No overspend; collection remains complete | TC-039–043 |
| Worker crash/stale lease | Safe local/external replay and owned failures | TC-049 |
| Restore behind provider | External financial activity reconciled before reopening | TC-051 |
| Alert/escalation | Correct owner receives actionable signal | TC-054 |
| Release pause/rollback | Existing obligations preserved | TC-056 |

- [ ] Actual commands, dashboards and access roles bound.
- [ ] Named primary/backup and coverage hours recorded.
- [ ] Numeric targets and escalation checkpoints approved.
- [ ] Provider/POS/loyalty authority and recovery capabilities verified.
- [ ] Operators demonstrate relevant playbooks in a controlled environment.
- [ ] Reconciliation and restore evidence available.
- [ ] Support/staff can explain and handle approved exception outcomes.
- [ ] Runbook reviewed after relevant architecture or provider changes.

All drill results are pending. Case references are planned evidence, not proof that drills passed.

## 23. Approval and Change History

| Review | Reviewer | Status / date |
|---|---|---|
| Service ownership and coverage | Service/Operations Owner — TBD | Pending / — |
| Application/worker playbooks | Technical Lead — TBD | Pending / — |
| Financial reconciliation | Finance/Payment Owner — TBD | Pending / — |
| Store/support workflows | Operations/Support Lead — TBD | Pending / — |
| Database/restore/maintenance | Database/DevOps Owner — TBD | Pending / — |
| Security/privacy response | Accountable Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-12 | Initial monitoring, 11 incident playbooks, reconciliation, maintenance, handover and operational acceptance baseline |

Keep this runbook aligned with `04-sdd.md`, `05-database-specification.md`, `11-test-plan.md`, `12-uat-and-sign-off.md`, `13-deployment-and-rollback.md` and `14-release-checklist.md`. Its creation completes the planned document sequence, not implementation, testing, operational approval or production readiness.
