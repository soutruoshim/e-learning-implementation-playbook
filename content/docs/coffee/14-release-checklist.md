---
title: "14 — Release Checklist"
---

# 14 — Release Checklist

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | RC-001 |
| Template version | 1.0 |
| Created / updated | 2026-09-12 |
| Status | Prepared template — no release executed |
| Owner | Release Coordinator — TBD |
| Sources | Documents 01–13, especially test plan, UAT and deployment guide |
| Related milestone | M6 release candidate → M7 pilot → M8 expansion |
| Overall decision | NOT DECIDED |

> Create a release-specific record from this checklist for each candidate/environment. Every checkbox below is initially unchecked. No test, approval, deployment or production outcome is implied. Use `13-deployment-and-rollback.md` for detailed procedures; this checklist records evidence and decisions rather than replacing them.

## 1. Release Identification

| Required field | Actual value |
|---|---|
| Release/change ID | TBD |
| Product scope and linked work items | TBD |
| Source repository and full commit | TBD |
| Artifact/build ID and digest | TBD |
| Configuration revision / secret references | TBD; no secret values |
| Schema before / after | TBD |
| API/event/client compatibility range | TBD |
| Target environment/account/region | TBD |
| Pilot stores and customer cohort | TBD |
| Planned window and time zone | TBD |
| Observation window and expansion criteria | TBD |
| Coordinator / operator | TBD |
| Product / technical / finance / operations responders | TBD |
| Previous compatible artifact/configuration | TBD |
| Backup/checkpoint and restore evidence | TBD |
| QA / UAT evidence references | Pending |
| Known issues and accepted conditions | Pending review |
| Actual deployment start / end | Not executed |

If candidate, configuration, schema or scope changes, record the change and reassess evidence before proceeding. A tag alone does not identify the actual deployed configuration or prove acceptance.

## 2. How to Complete This Checklist

Check an item only after its expected evidence has been reviewed. Record evidence and accountable reviewer in Section 12 using the item ID. Use PASS, FAIL, BLOCKED, NOT RUN or NOT APPLICABLE. Unchecked does not mean “not applicable.”

NOT APPLICABLE requires approved scope rationale. Missing policy, unavailable tests and unresolved provider placeholders are BLOCKED. Do not replace a failing required gate with a checked box because a workaround exists; record the issue and decision.

The release coordinator stops progression when a required gate fails. An overall pass percentage does not override a critical financial, security or recovery defect. Actual go/no-go is recorded in Section 6; this template does not grant deployment authority.

## 3. Gate A — Scope, Candidate and Business Readiness

- [ ] **A01 — Scope:** Release includes only approved features and exclusions; real work-item links and requirement coverage are recorded. **Owner:** Product.
- [ ] **A02 — Candidate:** Full source revision, immutable artifact and configuration/schema revisions match the tested candidate. **Owner:** Release/DevOps.
- [ ] **A03 — Reviews:** Required MR reviews and CI checks passed for the integrated candidate; no unresolved blocking discussion. **Owner:** Technical Lead.
- [ ] **A04 — QA:** Applicable P0 and required functional/nonfunctional evidence from `11-test-plan.md` is available and current. **Owner:** QA.
- [ ] **A05 — UAT:** Actual business acceptance from `12-uat-and-sign-off.md` is recorded by accountable reviewers; pending templates are not sign-off. **Owner:** Product.
- [ ] **A06 — Rules:** Identity, payment, tax/rounding, quote, cancellation/refund, reward and collection policies affecting release are approved. **Owner:** Product/Finance/Operations.
- [ ] **A07 — Contract gaps:** Enabled identity/provider/authority variants are implemented and validated; no webhook placeholder is accepted as verified integration. **Owner:** Technical Lead.
- [ ] **A08 — Known issues:** No unresolved Critical/High or unsafe financial/security/recovery issue; any nonblocking condition has impact, owner, workaround and decision evidence. **Owner:** QA/Product.
- [ ] **A09 — Cohort:** Pilot stores, users, operating hours and support coverage are approved. **Owner:** Operations/Product.
- [ ] **A10 — Release notes:** User/operator behavior changes, limitations and support instructions are accurate and available. **Owner:** Release/Product.

**Gate A outcome:** NOT REVIEWED. **Reviewer/date/evidence:** TBD.

## 4. Gate B — Technical and Operational Readiness

- [ ] **B01 — Environment:** Actual target account/project, hostnames, service names and provider environment verified. **Owner:** Operator.
- [ ] **B02 — Configuration:** Required configuration and valid secret references ready; no production/sandbox mismatch or exposed credentials. **Owner:** DevOps.
- [ ] **B03 — Compatibility:** Old/new API, worker, queued-event, schema and supported-client combinations assessed. **Owner:** Technical Lead.
- [ ] **B04 — Migration:** Exact runner, sequence, locking/backfill impact and failure procedure reviewed and rehearsed. **Owner:** Database Owner.
- [ ] **B05 — Recovery:** Previous compatible artifact or forward-fix strategy verified; incompatible rollback is explicitly disallowed. **Owner:** Technical Lead.
- [ ] **B06 — Backup:** Recovery checkpoint/capability and actual restore-plus-reconciliation evidence meet approved RPO/RTO. **Owner:** Database/Operations.
- [ ] **B07 — Pause/drain:** Server-side new-checkout pause and affected-worker drain/resume controls tested. **Owner:** Operations/Backend.
- [ ] **B08 — Existing obligations:** Order fulfillment, status retrieval, verified callback intake and financial reconciliation continue or have a tested durable recovery alternative. **Owner:** Operations/Finance.
- [ ] **B09 — Provider recovery:** Stable payment/refund reference lookup, duplicate handling and unknown-outcome procedures verified. **Owner:** Payment Owner.
- [ ] **B10 — Monitoring:** Dashboards, alerts, thresholds and responder routes active; actual values entered in Section 5. **Owner:** Operations.
- [ ] **B11 — Staff/support:** Staff can process pilot orders; support can locate and own exceptions with permitted access. **Owner:** Operations/Support.
- [ ] **B12 — Smoke procedure:** Test identities, amounts, recipients and reconciliation/cleanup procedure approved; no uncontrolled real transactions or messages. **Owner:** QA/Finance.
- [ ] **B13 — Client delivery:** Web cache/asset and native distribution/version constraints addressed where applicable. **Owner:** Client/Release.
- [ ] **B14 — Coordination:** Named operator, decision maker and responders available; no conflicting release/incident changes the target. **Owner:** Coordinator.

**Gate B outcome:** NOT REVIEWED. **Reviewer/date/evidence:** TBD.

## 5. Thresholds and Stop Conditions

Fill approved values before go/no-go. TBD is not a passing threshold.

| Signal | Approved threshold/window | Response | Owner |
|---|---|---|---|
| Critical API p95/error rate | TBD | Hold expansion; investigate; pause if approved threshold exceeded | Technical Lead |
| Pending payment/refund age/backlog | TBD | Preserve original references and reservations; reconcile/escalate | Finance/Operations |
| Duplicate collection or incorrect payable total | Any confirmed occurrence | Block expansion; contain affected initiation; incident response | Finance/Incident Owner |
| Unauthorized access or sensitive-data exposure | Any confirmed occurrence | Contain affected access; incident response | Security-capable/Incident Owner |
| Lost/untraceable accepted order | Any confirmed occurrence | Block expansion; restore operational ownership | Operations |
| Worker/outbox/inbox age | TBD | Investigate claims, compatibility and retries | Backend/Operations |
| Store acceptance/fulfillment delay | TBD | Escalate to store; assess new-order pause | Store Operations |
| Catalog freshness | TBD | Enforce approved stale-data checkout policy | Catalog Owner |
| Reward reservation/adjustment age | TBD | Preserve value obligations and reconcile | Loyalty Owner |
| Database errors/locks/resources | TBD | Stop dependent release progression; assess recovery | Database Owner |
| Pilot observation duration/cohort coverage | TBD | No expansion until approved evidence window met | Product/Release |

Containment must not automatically kill callback receipt, existing-order processing or reconciliation. Select application rollback, forward fix or dependency recovery based on observed cause and compatibility; an alert alone does not justify a blind database restore.

## 6. Predeployment Go/No-Go

| Decision field | Actual record |
|---|---|
| Gate A and B evidence | Pending |
| Conditions/limitations reviewed | Pending |
| Decision | NOT DECIDED |
| Decision maker(s) and role | TBD |
| Timestamp/time zone | TBD |
| Approval reference | None recorded |
| Approved environment/cohort/window | TBD |
| Next checkpoint | TBD |

Proceed only after actual GO and satisfied conditions. NO-GO or incomplete evidence stops deployment progression; independent reversible preparation may continue. A person listed as an owner has not automatically approved the release.

## 7. Gate C — Deployment Execution

Follow the detailed DEP procedures in `13-deployment-and-rollback.md` and record actual actions/output references.

- [ ] **C01 — Verify target/candidate:** Reconfirm artifact, configuration, target and approval immediately before action. **Procedure:** DEP-01.
- [ ] **C02 — Baseline:** Record current versions, health, pending financial work, store queue and preexisting incidents. **Procedure:** DEP-02.
- [ ] **C03 — Checkpoint:** Record required backup/recovery checkpoint and recoverability confirmation. **Procedure:** DEP-03.
- [ ] **C04 — Restrict/drain:** Apply approved cohort/pause/drain controls; verify new-work boundary and existing-obligation continuity. **Procedure:** DEP-04.
- [ ] **C05 — Migrate:** Apply compatible migrations/configuration; verify exact resulting schema and no unexplained partial state. **Procedure:** DEP-05.
- [ ] **C06 — Deploy:** Roll out artifact/consumers in reviewed compatibility order; verify actual running versions and readiness. **Procedure:** DEP-06.
- [ ] **C07 — Resume carefully:** Resume compatible workers and approved pilot checkout; inspect event/lease/provider behavior. **Procedure:** DEP-07.
- [ ] **C08 — Capture exceptions:** Record any deviation, failure, hold or incident before continuing. **Procedure:** Section 11 failure matrix in deployment guide.

**Gate C outcome:** NOT EXECUTED. **Operator/time/evidence:** TBD.

## 8. Gate D — Smoke and Reconciliation

- [ ] **D01 — Identity/readiness:** Running artifact/config/schema correct; required units ready and authorized access works.
- [ ] **D02 — Store/menu:** Correct store, published menu and cohort/pause behavior.
- [ ] **D03 — Quote:** Approved exact amount, currency, tax/discount and configured items; no unconfirmed price change.
- [ ] **D04 — Checkout:** Durable intent/order reference; same-key retry recovers same purchase.
- [ ] **D05 — Payment:** Verified provider outcome or accurately pending state; no success inferred solely from redirect.
- [ ] **D06 — Staff:** Correct assigned queue and legal acceptance/preparation/readiness/collection behavior.
- [ ] **D07 — Customer history:** Owned current/historical orders display separate fulfillment/payment/refund states.
- [ ] **D08 — Loyalty:** Selected policy applies once, or a pending adjustment is explicitly tracked and within approved expectations.
- [ ] **D09 — Notifications:** Approved test destination and safe link behavior; delivery failure does not undo business effects.
- [ ] **D10 — Financial closure:** Smoke payment/refund activity is reconciled or explicitly owned; no unknown duplicated exposure.
- [ ] **D11 — Recovery/alerts:** Original operation lookup and exception/alert routing are functioning.

**Owner:** QA plus affected domain owners. **Gate D outcome:** NOT EXECUTED. **Evidence:** TBD.

A mock-only smoke check cannot certify a live provider connection. Do not mark delayed/unresolved financial outcomes as closed merely because the UI loaded. Any permitted ongoing case must have an owner and meet the approved release conditions.

## 9. Gate E — Pilot Observation and Expansion

- [ ] **E01 — Window:** Observe the agreed duration and cohort, recording actual volume and gaps.
- [ ] **E02 — Service targets:** Assess measured latency/errors, worker backlog, catalog freshness and database health against Section 5.
- [ ] **E03 — Financial consistency:** Review pending/late payments, refunds, duplicate incidents and reconciliation discrepancies.
- [ ] **E04 — Store experience:** Review acceptance/fulfillment delays, rejection reasons and staff feedback.
- [ ] **E05 — Customer/support:** Review checkout recovery, unclear outcomes and support cases.
- [ ] **E06 — Reward correctness:** Review reservation/earning/reversal exceptions and approved recovery.
- [ ] **E07 — Conditions:** Reassess all accepted issues and new observations; no blocking condition remains hidden.
- [ ] **E08 — Decision:** Record EXPAND, HOLD or RECOVER with named Product/Operations/Finance participants as applicable.

| Expansion decision | Actual value |
|---|---|
| Observed cohort/window and evidence | TBD |
| Decision | NOT DECIDED |
| New cohort/limits if expanding | TBD |
| Decision owner/time/reference | TBD |
| Next observation checkpoint | TBD |

Pilot GO is not automatic approval for unlimited rollout.

## 10. Conditional Recovery Checklist

Use when deployment fails or a stop condition is triggered. These items are conditional, not routine actions to execute on every release.

- [ ] **R01 — Incident/containment:** Record impact, owner and affected functions; contain new exposure while preserving obligations.
- [ ] **R02 — Recovery choice:** Decide compatible rollback, forward fix, provider recovery or disaster recovery from evidence.
- [ ] **R03 — Compatibility:** Prove target artifact/configuration works with current schema/events/clients; do not restore revoked secrets.
- [ ] **R04 — In-flight work:** Record attempts/refunds, leases, outbox/inbox and reservations; stopped processes are not proof of nonexecution.
- [ ] **R05 — Execute:** Follow bound RB-01–RB-06 or separately approved database disaster-recovery procedure; record actual actions.
- [ ] **R06 — Reconcile:** Recover financial facts using stable references; verify existing orders, refunds and reward obligations.
- [ ] **R07 — Verify reopening:** Assess health, correctness and unresolved cases before gradually resuming new work.
- [ ] **R08 — Record outcome:** Link incident, final versions, evidence, owners and follow-up correction.

Database restore is not ordinary application rollback. It requires the recovery-point decision, tested procedure and reconciliation of external activity after the checkpoint. Do not downgrade schema or replay financial calls blindly.

**Recovery status:** NOT TRIGGERED. **Incident/decision/evidence:** None recorded.

## 11. Gate F — Closure and Handover

- [ ] **F01 — Final versions:** Record actual deployed artifact, source, config and schema plus start/end times.
- [ ] **F02 — Evidence:** Attach smoke, observation, reconciliation and decision records.
- [ ] **F03 — Open obligations:** Assign remaining permitted cases and target review times; no unowned financial work.
- [ ] **F04 — Support handover:** Confirm alert routing, responders, store/support guidance and heightened-monitoring period.
- [ ] **F05 — Work-item updates:** Link actual release outcome to real issues; distinguish merged, tested and deployed work.
- [ ] **F06 — Release communication:** Prepare/update approved release records and stakeholder communication through the agreed process.
- [ ] **F07 — Follow-up:** Track defects, lessons, hotfix propagation and separately reviewed schema cleanup.

**Gate F outcome:** NOT COMPLETED. **Owner/date/evidence:** TBD.

Checklist completion does not send messages, create issues or perform deployment. Use the team's authorized workflow for those actions.

## 12. Evidence and Exceptions Register

Add a row for each checked or assessed item; retain history if a gate is rerun after a candidate change.

| Item ID | Result | Candidate/run | Evidence reference | Reviewer/date | Issue or rationale |
|---|---|---|---|---|---|
| To be completed | NOT RUN | TBD | Pending | TBD | Pending |

| Accepted issue field | Required content |
|---|---|
| Issue / affected items | Actual reference and checklist IDs |
| Impact / severity | Customer, financial, security and operational consequences |
| Workaround | Tested behavior and limits |
| Owner / target resolution | Named accountable person and agreed milestone/date |
| Accepting authority | Product plus affected domain owner |
| Conditions / expiry | Cohort limits, monitoring and re-review point |
| Decision evidence | Actual approval reference and time |

No accepted exception is prefilled. Missing evidence remains NOT RUN/BLOCKED. Critical unsafe conditions cannot be converted into a cosmetic checklist exception.

## 13. Final Release Decision Record

| Field | Actual record |
|---|---|
| Final outcome | NOT EXECUTED |
| Final environment/cohort | TBD |
| Deployed artifact/config/schema | TBD |
| QA/business/release decisions | Pending |
| Gate A–F summaries | Not reviewed/executed |
| Recovery actions | Not triggered |
| Unresolved cases and accepted limitations | Pending assessment |
| Monitoring owner and next checkpoint | TBD |
| Release coordinator/date | TBD |
| Product/Operations/Finance references | Pending |

Supported final outcomes: COMPLETED, COMPLETED WITH DOCUMENTED NONBLOCKING CONDITIONS, HELD, ROLLED BACK, or FAILED/RECOVERY ONGOING. Select only after actual execution evidence; do not report success while critical obligations remain unresolved.

## 14. Document Review and History

| Review | Owner | Status/date |
|---|---|---|
| Release gates and sequence | Release/Technical Lead — TBD | Pending / — |
| QA/UAT evidence requirements | QA/Product — TBD | Pending / — |
| Financial and operational continuity | Finance/Operations — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-12 | Initial release gate checklist, conditional recovery path and evidence/decision registers |

Related files: `10-git-and-review-workflow.md`, `11-test-plan.md`, `12-uat-and-sign-off.md`, `13-deployment-and-rollback.md`; planned `15-operations-runbook.md`. Referencing the planned runbook does not claim it exists.
