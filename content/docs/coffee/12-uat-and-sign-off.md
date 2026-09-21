---
title: "12 — User Acceptance Testing and Sign-off"
---

# 12 — User Acceptance Testing and Sign-off

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | UAT-001 |
| Version / status | 1.0 / Prepared for review; execution pending |
| Created / updated | 2026-09-12 |
| Business owner | Product Owner — TBD |
| Coordinator | QA / Delivery Owner — TBD |
| Sources | Documents 01–11, especially PRD, UX, delivery plan and test plan |
| Delivery milestone | M6 — Release candidate; WP-30 |
| Candidate / environment | TBD |
| UAT dates / participants | TBD |
| Overall result | NOT STARTED |
| Business acceptance | PENDING |
| Production authorization | NOT GRANTED by this document |

> This document is a UAT execution and approval template populated with proposed business scenarios. No scenario has been executed, no participant has signed, and no release approval is implied. The 56 cases in `11-test-plan.md` are planned tests, not passing evidence. Populate actual results and attach build-specific evidence during UAT. Unresolved product or provider rules block the affected acceptance scenario until an accountable decision is recorded.

## 1. Purpose and Acceptance Scope

UAT confirms that the pickup-first MVP meets customer, store, finance, loyalty and support needs in realistic operating journeys. Business participants judge whether outcomes and exception handling are understandable and usable; QA coordinates reproducibility and evidence.

In scope: account access and recovery; store/menu/product configuration; cart and accurate checkout; payment uncertainty and recovery; order confirmation/tracking/history; staff preparation and collection; cancellation/refunds; the selected reward scheme; notifications; support lookup; and operational handover.

Delivery, driver tracking, multi-store carts, subscriptions, complex campaigns/referrals and other excluded features remain outside acceptance unless Product formally revises scope. UAT must not quietly accept an unapproved scope reduction because a feature is unavailable.

## 2. UAT versus Technical Verification and Release

| Activity | Question answered | Owner / evidence |
|---|---|---|
| Technical QA | Does the implementation satisfy functional, contract, security, concurrency and recovery requirements? | QA/Engineering; `11-test-plan.md` execution evidence |
| UAT | Can customers and staff complete approved business journeys and resolve exceptions correctly? | Product, Operations, Finance, Loyalty and Support participants |
| Operational readiness | Can the team monitor, support and recover the service? | Operations/DevOps/Support evidence |
| Release go/no-go | Is this exact candidate ready for the proposed cohort/environment now? | Accountable release decision makers |

UAT does not replace provider signature verification, database concurrency tests, load testing or restore rehearsal. A successful demonstration does not prove those technical gates passed. Business acceptance also does not automatically authorize production deployment.

## 3. Candidate and Session Register

Complete before execution. If a value changes materially, assess which results must be rerun.

| Field | Actual value |
|---|---|
| Release candidate label | TBD |
| Repository and full source revision | TBD |
| Build/artifact identifier and checksum where supported | TBD |
| Configuration and schema/migration revision | TBD |
| API/PRD/UX approved versions | TBD |
| Identity/payment/POS/loyalty adapters and environment | TBD |
| Selected client platforms/devices/locales | TBD |
| Selected stores and operating hours/time zones | TBD |
| Synthetic fixture revision | TBD |
| Environment URL/access procedure | TBD; do not include credentials |
| Session dates and time zone | TBD |
| QA coordinator / business facilitator | TBD |
| Evidence repository/location | TBD |
| Known limitations and open defects | TBD; explicit list required |

A result applies to the candidate/configuration tested. Reuse of prior evidence requires a recorded impact assessment, not an assumption that a similar screen means unchanged behavior.

## 4. Participants and Decision Rights

| Role | UAT responsibility | Named participant |
|---|---|---|
| Product Owner | Confirm customer outcomes, scope and overall business acceptance | TBD |
| Customer representative | Complete realistic journeys and report confusion/friction | TBD |
| Store Operations Lead | Validate fulfillment, availability, collection and exceptions | TBD |
| Store staff representative | Operate queue and perform actual task steps | TBD |
| Finance / Payment Owner | Confirm payment/refund amounts, states and reconciliation handling | TBD |
| Loyalty Owner | Confirm eligibility, earnings/redemption and reversals | TBD |
| Support Lead | Validate lookup, explanations, case ownership and escalation | TBD |
| QA Owner | Prepare fixtures, record results, triage and coordinate retests | TBD |
| Technical Lead | Explain evidence/limitations and resolve implementation defects | TBD |
| Operations / DevOps Owner | Verify monitoring and recovery readiness | TBD |
| Release Owner | Coordinate subsequent production go/no-go | TBD |

One person may hold several roles, but responsibilities and approvals remain explicit. Developers may support a session; they should not silently perform the participant's steps or replace business acceptance with their own assessment.

## 5. Entry Criteria

- [ ] Candidate and environment register is complete.
- [ ] In-scope requirements and relevant policy examples are approved.
- [ ] Required technical QA evidence is available; unresolved Critical/High defects do not undermine the intended session.
- [ ] Identity/provider/authority placeholders affecting the scenario are resolved or the session is explicitly limited to a nonacceptance preview.
- [ ] Stores, accounts, roles, menu, prices and selected rewards are seeded and reproducible.
- [ ] Participants have appropriate access and know the intended business outcome.
- [ ] Notification destinations use approved test sinks/recipients.
- [ ] Payment tests use approved sandbox instruments; no unintended real collections.
- [ ] Evidence recording and defect process are available.
- [ ] Expected amounts, cancellation/refund rules and reward terms are written down.

A preview with mocks may gather feedback, but must be labeled as a preview and cannot certify the untested integration. Independent ready scenarios can proceed while others are blocked; the overall report must show the distinction.

## 6. Business Rules to Confirm Before Testing

| Decision | Acceptance input required | Owner |
|---|---|---|
| Identity / D-04 | Registration, recovery, session/logout behavior, guest policy | Product / Technical Lead |
| Payment / D-05 | Supported method, capture timing, pending/failure meanings, safe retry and support response | Finance / Technical Lead |
| Store authority / D-06 | Catalog/price/availability source, staff system and ownership of status changes | Operations |
| Loyalty / D-07 | Scheme, rates/benefits, qualifying event, expiry and history wording | Loyalty |
| Exceptions / D-08 | Cancellation window, rejection, no-show, collection verification and refunds | Operations / Finance |
| Money / D-09/D-13 | Currency, tax treatment, rounding, quote expiry, stacking and zero-total policy | Finance / Product |
| Service targets / D-11/D-14/D-16 | Expected response, pending escalation, freshness, recovery and support thresholds | Operations / Technical Lead |
| Privacy / D-15 | Account deletion, active obligations, retention and acknowledgement | Accountable policy owner |
| Notifications / D-17 | Channels, triggers, permission behavior and retry policy | Product / Operations |

Do not import unrelated legacy values or set expected results by copying whatever the current app happens to display. Expectations come from approved rules; a missing rule is a decision blocker.

## 7. Execution Procedure and Results

1. Identify candidate, participant role, scenario and fixture.
2. Review the approved expected outcome without coaching the exact UI path unnecessarily.
3. Let the participant complete the journey; record help needed, confusion and failures.
4. Compare UI outcome with relevant authoritative order/payment/reward evidence.
5. Record actual result, evidence, comments and linked defect/decision.
6. Classify the result and agree next action/owner.
7. Retest after fixes on the identified candidate and preserve previous results.

### Result vocabulary

- **NOT RUN:** No execution evidence yet.
- **PASS:** All stated acceptance checks met on the identified candidate.
- **FAIL:** One or more checks not met.
- **BLOCKED:** Missing environment, policy, dependency or prerequisite prevents valid execution.
- **NOT APPLICABLE:** Formally outside approved scope, with owner/rationale recorded.

A workaround or facilitator intervention must be recorded. It does not automatically turn a failed expected outcome into PASS. Keep usability observations separate from functional failures where that helps triage.

## 8. UAT Scenario Catalog

All scenarios below are **NOT RUN**. IDs are local acceptance references, not existing Jira tickets. Execute the selected approved variant only; record why other variants are not applicable.

### UAT-01 — Register, sign in and recover access

**Participant:** Customer representative. **References:** REQ-ACC-001; TC-001–003.

**Setup:** Synthetic customer identity; approved verification method and session policy.

**Steps:** Register and verify; sign out; sign in; use the recovery flow; attempt to continue after an expired/revoked session.

**Acceptance:** Identity belongs to one account, instructions are understandable, recovery proves control of the approved channel, and protected access resumes only through the approved flow. Logout/session expiry is accurately represented. No duplicate account or previous user's private data appears.

**Evidence:** Screen sequence, safe principal/reference and relevant QA access evidence. **Result:** NOT RUN.

### UAT-02 — Profile and account deletion request

**Participant:** Customer / Product. **References:** REQ-ACC-002; TC-004–005.

**Setup:** Account with profile and an active order/payment obligation; approved retention/deletion policy.

**Steps:** Edit allowed profile fields; initiate a verified contact change; request deletion and repeat the same request.

**Acceptance:** Unverified contact does not prematurely replace the verified identity. Deletion consequences, active obligations and processing expectations are understandable. Acknowledgement is traceable and does not claim immediate erasure when work remains.

**Evidence:** Updated/pending fields, deletion reference and approved copy. **Result:** NOT RUN.

### UAT-03 — Select store and browse availability

**Participant:** Customer / Store Operations. **References:** REQ-STR-001, REQ-MNU-001; TC-006–008.

**Setup:** Eligible store, paused/closed store and known menu revision.

**Steps:** Decline location permission; manually choose a store; browse categories; inspect paused/closed-store behavior; refresh after an availability update.

**Acceptance:** Manual selection works, pickup location is clear, products/prices belong to the chosen store, and ineligible stores cannot receive new orders. Empty/failed menu states are distinguishable.

**Evidence:** Selected store, menu revision and availability screenshots. **Result:** NOT RUN.

### UAT-04 — Configure products and manage cart

**Participant:** Customer. **References:** REQ-MNU-002, REQ-CART-001; TC-009–011.

**Setup:** Required size, optional priced modifier, unavailable option and two stores.

**Steps:** Configure items; omit a required choice; add distinct configurations; edit quantity/remove items; begin a store change and cancel, then confirm it; reopen the app/cart.

**Acceptance:** Required choices and prices are understandable; invalid options cannot proceed; distinct configurations remain clear; store-change consequences are explicit; approved persistence works without duplication.

**Evidence:** Configured cart and invalid/empty/change-store states. **Result:** NOT RUN.

### UAT-05 — Review exact totals and changed quote

**Participant:** Customer / Finance. **References:** REQ-PRICE-001; TC-012–014.

**Setup:** Finance-approved item/discount/tax/fee example and a controllable quote change.

**Steps:** Review quote; explain payable total; change price or benefit eligibility before submission; review revised quote and choose whether to continue.

**Acceptance:** Components reconcile to the approved result; currency and tax treatment are clear; included tax is not added twice. A changed payable amount requires fresh customer confirmation. Client-submitted amounts cannot override the quote, supported by technical QA evidence.

**Evidence:** Expected calculation, before/after quote and authoritative total. **Result:** NOT RUN.

### UAT-06 — Successful pickup purchase

**Participant:** Customer / Store staff / Finance. **References:** REQ-CHK-001, REQ-PAY-001, REQ-ORD-001/002; TC-015, TC-020, TC-031.

**Setup:** Valid quote, approved sandbox method, assigned staff and selected reward policy.

**Steps:** Confirm purchase; complete payment; inspect reference/payment state; staff accept, prepare, mark ready and confirm collection; customer views final details.

**Acceptance:** One intended order/collection; correct items/total/store; submitted, paid, accepted, ready and completed are not confused. Collection uses the approved procedure and historical purchase data remains accurate.

**Evidence:** Order reference, verified provider operation, staff transitions and final customer screen. **Result:** NOT RUN.

### UAT-07 — Interrupted or pending payment

**Participant:** Customer / Finance / Support. **References:** REQ-PAY-002, REQ-CHK-001; TC-018, TC-024–025.

**Setup:** Controlled lost response or pending provider outcome; original intent reference retained.

**Steps:** Submit and interrupt return/response; close/reopen app; recover status; allow original outcome to resolve; inspect support route if still unresolved.

**Acceptance:** Customer can find the existing purchase, understands that pending is not definitive failure, and is not prompted into a second independent charge. Final outcome and support ownership are clear. Technical crash/deduplication evidence accompanies the demonstration.

**Evidence:** Original/recovered intent and provider reference; pending/resolved screens. **Result:** NOT RUN.

### UAT-08 — Failed payment and deliberate retry

**Participant:** Customer / Finance. **References:** REQ-PAY-001/002; TC-026.

**Setup:** Provider-confirmed definitive failure and separate unresolved/successful attempts.

**Steps:** Observe failure; deliberately retry when allowed; compare retry availability while another attempt is pending or already successful.

**Acceptance:** Clear failure guidance; permitted retry stays associated with the same purchase and approved amount. Unknown or successful payments cannot be collected again through this flow.

**Evidence:** Attempt history and customer actions; financial gate QA evidence. **Result:** NOT RUN.

### UAT-09 — Tracking, history and delayed notifications

**Participant:** Customer. **References:** REQ-ORD-001/002/003; TC-031–032.

**Setup:** Active and historical orders, failed refresh and old notification.

**Steps:** Open history, paginate, inspect details; lose network during tracking; open an earlier notification after status advances.

**Acceptance:** Owned orders including unresolved purchases are findable; snapshots remain stable; stale state is labeled; current state wins over old notification text. Ready does not mean collected, and pending refund does not mean refunded.

**Evidence:** History/detail states and updated order version. **Result:** NOT RUN.

### UAT-10 — Staff queue, collection and pause controls

**Participant:** Store staff / Operations. **References:** REQ-OPS-001/002, REQ-ORD-002; TC-033–035.

**Setup:** Assigned-store queue, payment-ineligible order, two staff sessions and pause controls.

**Steps:** Process eligible order; try unavailable transition; have another staff member update it; refresh after conflict; pause new ordering while fulfilling an existing order.

**Acceptance:** Correct store scope, clear next action, no preparation of ineligible payment, understandable stale-action conflict, and no loss of existing orders when new ordering is paused.

**Evidence:** Queue, transition/conflict, ordering pause and ongoing fulfillment. **Result:** NOT RUN.

### UAT-11 — Cancellation, rejection and no-show policy

**Participant:** Customer / Operations / Finance. **References:** REQ-ORD-004; TC-027, TC-033–034.

**Setup:** Orders in relevant states and approved cancellation/rejection/no-show rules.

**Steps:** Request eligible cancellation; attempt cancellation outside allowed state; reject an order with reason; review an approved no-show scenario.

**Acceptance:** Customer sees actual eligibility and consequences. Cancellation request is not portrayed as completed until committed. Rejection/no-show follows explicit policy; financial resolution is tracked independently. No invented automatic refund or collection behavior.

**Evidence:** Reasons, state history and financial resolution records. **Result:** NOT RUN.

### UAT-12 — Refund and late-payment resolution

**Participant:** Finance / Support / Customer. **References:** REQ-ORD-004, REQ-SUP-001, REQ-PAY-002; TC-027–030, TC-037.

**Setup:** Collected payment, terminal order, pending refund and authorized refund role.

**Steps:** Locate case; request permitted refund; observe pending; resolve through provider evidence; review late success on an order that cannot be fulfilled.

**Acceptance:** Amount/currency/reason correct; refund is not called successful on initiation; retry does not reserve/refund extra value. Late payment does not reopen fulfillment. Customer and operator understand next steps and ownership. Partial refunds are tested only if approved and fully specified.

**Evidence:** Refund/provider reference, before/after capacity and customer status. **Result:** NOT RUN.

### UAT-13 — Rewards view and checkout redemption

**Participant:** Customer / Loyalty Owner. **References:** REQ-LOY-001/002; TC-038–040.

**Setup:** Selected scheme with available, reserved and expired value; unavailable-service condition.

**Steps:** Inspect benefits/history and terms; select eligible redemption; make it unavailable before quote confirmation; view service failure.

**Acceptance:** Units/coupons and expiry are understandable; reserved value is not free to spend; changed eligibility requires revised quote review; service failure is not shown as a zero balance. Concurrent reservation correctness is backed by QA evidence.

**Evidence:** Benefit terms, quoted reduction and relevant ledger/reservation facts. **Result:** NOT RUN.

### UAT-14 — Earn, reverse and recover rewards

**Participant:** Loyalty / Customer / Support. **References:** REQ-LOY-002; TC-041–043.

**Setup:** Completed qualifying order, approved reversal rules and delayed reward processing.

**Steps:** Complete qualifying action; inspect earned benefit; process a relevant refund/cancellation adjustment; repeat event via approved test harness; observe delayed adjustment recovery.

**Acceptance:** Approved value issued once; reversal/restoration matches policy; original history retained. Delayed reward processing does not undo collection and is recoverable/owned. No unsupported negative-balance or expiry behavior is accepted.

**Evidence:** Rule version, related order/effect references and history. **Result:** NOT RUN.

### UAT-15 — Notification preferences and privacy

**Participant:** Customer / Support. **References:** REQ-NTF-001; TC-044–045.

**Setup:** Test notification sink/device, denied permission and account switch.

**Steps:** Change preferences where allowed; deny permission; complete an order; open notification after switching account.

**Acceptance:** Ordering works when delivery fails/permission is denied; messages reflect committed outcomes; private content is not exposed to another account. Marketing consent is not silently bundled into transactional preferences.

**Evidence:** Preference/result screens, sink event and authorized link outcome. **Result:** NOT RUN.

### UAT-16 — Support access and exception ownership

**Participant:** Support / Finance / Operations. **References:** REQ-SUP-001; TC-036–037, TC-054.

**Setup:** Unmatched or prolonged pending case, authorized and unauthorized roles.

**Steps:** Search exact reference; inspect necessary facts; assign case; record next action; attempt resolution without financial evidence; attempt unauthorized lookup.

**Acceptance:** Staff have sufficient traceability without unnecessary private data. Resolution requires evidence; case management cannot manufacture payment success. Ownership and escalation are clear; unauthorized access denied.

**Evidence:** Case lifecycle, permission result and safe correlation references. **Result:** NOT RUN.

### UAT-17 — Readability and accessible critical journeys

**Participant:** Customer / Design / QA. **References:** PRD NFR-08/09; TC-053.

**Setup:** Approved platform/locale matrix, long text and applicable accessibility tools.

**Steps:** Complete browsing/cart/checkout/recovery with enlarged text and selected keyboard/assistive navigation; inspect long item/option names and amount/date formats.

**Acceptance:** Required actions remain reachable, labels/statuses understandable, focus/content unobstructed and supported locale text readable. No critical meaning depends only on color, animation or sound. Technical accessibility checks remain separate evidence.

**Evidence:** Device/tool details, observations and defects. **Result:** NOT RUN.

### UAT-18 — Operational handover and release readiness

**Participant:** Operations / Support / Finance / Release Owner. **References:** PRD NFR-07/10; TC-051, TC-054–056.

**Setup:** Candidate runbooks, alert routes, reconciled fixture activity and prior restore rehearsal report.

**Steps:** Walk through a pending-payment alert, store delay and release pause; identify responders and support message; review recovery/restore evidence and pilot stop conditions.

**Acceptance:** Owners can locate and resolve obligations, pause new checkout without abandoning existing work, and explain escalation. Recovery evidence and known limitations are accepted explicitly. A walkthrough alone does not replace the actual restore test.

**Evidence:** Runbook/alert links, rehearsal report, named owners and decisions. **Result:** NOT RUN.

## 9. Execution Register

Replace fields during execution; retain earlier runs when retesting. No row is preapproved.

| Scenario | Result | Participant / date | Candidate / run ID | Evidence / defect |
|---|---|---|---|---|
| UAT-01 | NOT RUN | TBD | TBD | Pending |
| UAT-02 | NOT RUN | TBD | TBD | Pending |
| UAT-03 | NOT RUN | TBD | TBD | Pending |
| UAT-04 | NOT RUN | TBD | TBD | Pending |
| UAT-05 | NOT RUN | TBD | TBD | Pending |
| UAT-06 | NOT RUN | TBD | TBD | Pending |
| UAT-07 | NOT RUN | TBD | TBD | Pending |
| UAT-08 | NOT RUN | TBD | TBD | Pending |
| UAT-09 | NOT RUN | TBD | TBD | Pending |
| UAT-10 | NOT RUN | TBD | TBD | Pending |
| UAT-11 | NOT RUN | TBD | TBD | Pending |
| UAT-12 | NOT RUN | TBD | TBD | Pending |
| UAT-13 | NOT RUN | TBD | TBD | Pending |
| UAT-14 | NOT RUN | TBD | TBD | Pending |
| UAT-15 | NOT RUN | TBD | TBD | Pending |
| UAT-16 | NOT RUN | TBD | TBD | Pending |
| UAT-17 | NOT RUN | TBD | TBD | Pending |
| UAT-18 | NOT RUN | TBD | TBD | Pending |

Detailed run record: scenario/version; participant/role; candidate/environment; fixture/reference; actions; expected/actual result; help/workaround used; redacted evidence; result; defect/decision; owner; retest plan. Do not include credentials, verification codes, full payment payloads or unnecessary customer data.

## 10. Defects, Feedback and Retesting

Use severity definitions from the test plan. Critical/High issues such as duplicate collection, incorrect totals, unauthorized access, unsafe retry or lost obligations block release. Usability feedback is classified by actual impact, not dismissed as cosmetic because the API works.

| Category | Handling |
|---|---|
| Implementation defect | Record reproduction/evidence, assign owner, fix and retest |
| Missing or contradictory policy | Block affected scenario; Product/domain owner decides; update sources |
| New feature request | Assess scope separately; do not silently change current acceptance |
| Environmental failure | Preserve evidence/obligations; repair environment and rerun affected cases |
| Minor known issue | Record impact, workaround, owner, due point and acceptance decision |

Retest on the corrected candidate. Include related regression where the change affects shared pricing, state, identity or integrations. Prior acceptance may need renewal after material changes. Never overwrite a failing run with a later pass and lose the history.

### Accepted issue record

| Field | Required entry |
|---|---|
| Issue and affected scenarios | Actual link/IDs |
| Impact and severity | Business/customer/operator effect |
| Workaround and limitations | What users/staff must do |
| Owner and target resolution | Named person and agreed milestone/date |
| Accepting authority | Product plus affected domain owner |
| Acceptance conditions | Pilot limits, monitoring or expiry of exception |
| Evidence/date | Decision record tied to candidate |

No accepted issues have been recorded by this document. A blank record means pending, not “none.”

## 11. UAT Exit Criteria

- [ ] All in-scope scenarios executed with recorded evidence, or formal not-applicable scope decisions.
- [ ] Critical business journeys meet approved outcomes.
- [ ] No unresolved Critical/High defect or unsafe financial/security/recovery condition.
- [ ] Nonblocking issues are individually assessed and accepted by accountable owners.
- [ ] Identity, provider, reward, cancellation and monetary rules relevant to release are settled.
- [ ] Required QA, performance, security, accessibility and recovery evidence is available and applicable to the candidate.
- [ ] Store staff and support can operate the approved workflow.
- [ ] Notifications, reconciliation, alert routing and case ownership are ready.
- [ ] Candidate and release scope are identified precisely.
- [ ] Business acceptance decision and limitations are recorded by actual reviewers.

A high aggregate pass percentage cannot compensate for one unresolved critical payment or access-control failure. Missing targets or provider placeholders are not automatically acceptable residual risks.

## 12. Acceptance Decisions

| Decision | Meaning | Consequence |
|---|---|---|
| ACCEPTED | Applicable UAT outcomes and prerequisites met; no blocking issues | Eligible for separate release go/no-go |
| ACCEPTED WITH CONDITIONS | Only documented nonblocking limitations remain; owners/conditions recorded | Release review must explicitly check conditions and cohort limits |
| REJECTED | Business outcomes or critical prerequisites not met | Fix/resolve and retest before release |
| DEFERRED | Execution or evidence incomplete | No business acceptance yet |

Conditional acceptance cannot override unresolved critical financial/security/recovery guarantees. If scope is intentionally reduced, update the PRD/delivery plan/contracts and explicitly reassess the remaining release; do not label a missing Must feature a minor condition.

## 13. Business Sign-off Record

### Decision statement template

Complete this statement only after review; it is not a signature or approval as currently written.

> I, [reviewer name and role], reviewed the UAT results for [candidate/build/configuration] covering [approved scope]. My decision is [ACCEPTED / ACCEPTED WITH CONDITIONS / REJECTED / DEFERRED]. This decision is based on [evidence references]. Remaining limitations and conditions are [issue/condition references]. This statement records business acceptance only; production deployment requires the separate release decision.

| Acceptance area | Accountable reviewer | Decision | Evidence / conditions | Date / approval reference |
|---|---|---|---|---|
| Customer journey and scope | Product Owner — TBD | PENDING | Pending | — |
| Store fulfillment and exceptions | Operations Lead — TBD | PENDING | Pending | — |
| Payment, refund and reconciliation | Finance Owner — TBD | PENDING | Pending | — |
| Loyalty behavior | Loyalty Owner — TBD | PENDING | Pending | — |
| Support workflow | Support Lead — TBD | PENDING | Pending | — |
| QA evidence and unresolved defects | QA Owner — TBD | PENDING | Pending | — |
| Operational handover | Operations/DevOps Owner — TBD | PENDING | Pending | — |

Approval references may be the team's authorized ticket, document approval or signed record. Do not enter someone's name as signed merely because they attended a meeting or were assigned as an owner.

## 14. Separate Release Go/No-Go Record

| Field | Actual decision |
|---|---|
| Candidate/artifact and environment | TBD |
| Intended pilot stores/cohort | TBD |
| Deployment window/time zone | TBD |
| Business sign-off references | Pending |
| Technical QA and recovery references | Pending |
| Known issues and conditions satisfied | Pending review |
| Rollback/forward-fix and existing-obligation plan | Pending |
| Monitoring/support/finance responders | TBD |
| Decision | NOT DECIDED |
| Release decision maker and timestamp | TBD |
| Deployment authorization reference | None recorded |

Readiness documents do not themselves execute deployment. Planned `13-deployment-and-rollback.md` and `14-release-checklist.md` define the concrete release procedure and gates. Pilot verification and expansion decisions remain separate from this UAT record.

## 15. Requirement Coverage and Handoff

| PRD requirement | UAT scenarios |
|---|---|
| REQ-ACC-001 | UAT-01 |
| REQ-ACC-002 | UAT-02 |
| REQ-STR-001 | UAT-03 |
| REQ-MNU-001 | UAT-03 |
| REQ-MNU-002 | UAT-04 |
| REQ-CART-001 | UAT-04 |
| REQ-PRICE-001 | UAT-05 |
| REQ-CHK-001 | UAT-06, UAT-07 |
| REQ-PAY-001 | UAT-06, UAT-08 |
| REQ-PAY-002 | UAT-07, UAT-08, UAT-12 |
| REQ-ORD-001 | UAT-06, UAT-09 |
| REQ-ORD-002 | UAT-06, UAT-09, UAT-10 |
| REQ-ORD-003 | UAT-09 |
| REQ-ORD-004 | UAT-11, UAT-12 |
| REQ-LOY-001 | UAT-13 |
| REQ-LOY-002 | UAT-13, UAT-14 |
| REQ-NTF-001 | UAT-15 |
| REQ-OPS-001 | UAT-10 |
| REQ-OPS-002 | UAT-10 |
| REQ-SUP-001 | UAT-12, UAT-16 |

UAT-17 and UAT-18 supplement nonfunctional/operational acceptance; detailed technical coverage remains in `11-test-plan.md`. Link completed records to actual Jira/work items and release evidence when available; no tickets are created by this document.

## 16. Change Control and Document Review

Reopen affected acceptance when material changes alter customer behavior, monetary calculations, identity/session rules, provider contracts, status transitions, reward rules or operational recovery. QA and Product assess the required rerun with domain owners. Cosmetic changes can reuse unaffected evidence when justified and recorded.

| Document review | Reviewer | Status / date |
|---|---|---|
| UAT scope and scenarios | Product / QA — TBD | Pending / — |
| Store and financial expectations | Operations / Finance — TBD | Pending / — |
| Sign-off authority and release separation | Release Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-12 | Initial 18-scenario UAT plan, execution register, evidence/defect process and pending acceptance/release records |

All results and approvals remain pending until actual participants execute and review the identified candidate.
