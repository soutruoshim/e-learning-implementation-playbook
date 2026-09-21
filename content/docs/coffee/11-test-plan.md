---
title: "11 — Test Plan"
---

# 11 — Test Plan

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | QA-001 |
| Version / status | 1.0 / Proposed test baseline for review |
| Created / updated | 2026-09-11 |
| Accountable owner | QA Owner — TBD |
| Sources | Documents 01–10; PRD v1.0, SDD v1.0, DB v1.0, API 1.0.0-draft |
| Delivery packages | WP-26, WP-28, WP-29; feature-package acceptance throughout |
| Scope | Pickup-first customer journey, staff operations, financial/reward correctness and recovery |
| Execution status | All scenarios are NOT RUN; no application, database or provider tested by creating this document |
| Target build / environments | TBD |

> This is a test plan and scenario baseline, not a QA results report. The API draft has 41 operations and 64 schemas with prior structural checks only; full conformance validation and implemented contract tests remain required. Identity, provider, authority, business-policy and numeric quality targets must be approved before their dependent cases can pass. A blocked policy-dependent case is not a pass or an automatic exemption.

## 1. Objectives and Scope

Verify that customers can choose a store, configure products, accept an accurate quote, submit one purchase, resolve payment, follow fulfillment, collect, and receive or use the selected loyalty benefit. Verify that authorized staff can operate the journey and support can resolve exceptions without corrupting transaction history.

### In scope

Functional behavior; API contracts; exact money; database constraints; ownership/role/store authorization; retries and concurrency; provider event verification; unknown/late financial outcomes; refunds; loyalty reservations/reversals; notification isolation; responsive/accessibility behavior; observability; migrations; backup/restore reconciliation; and release smoke checks.

### Out of scope unless formally added

Delivery/driver tracking, multi-store carts, subscriptions, scheduled orders, referral/mission engines, multiple payment providers, full inventory/ERP workflows, and unsupported platforms. Optional search receives separate acceptance cases if selected. Test only the approved internal/external authority and loyalty variant; do not imply every alternative in the design is implemented.

## 2. Test Basis and Decision Gates

| Input / gate | Needed for | Owner |
|---|---|---|
| Approved PRD/UX and change history | Expected behavior and complete screen states | Product / Design |
| Physical database engine/version and migrations | Real locking, uniqueness, collation and restore checks | Technical Lead / Database Owner |
| Approved OpenAPI and identity adapter, D-04 | Auth, recovery, schema and negative contract cases | Technical Lead / Product |
| Provider contract/sandbox, D-05 | Signed callback, lookup, retry, finality and refund evidence | Payment Owner |
| Source authority, D-06 | Catalog/POS conflict and stale-source expectations | Operations / Engineering |
| Reward/cancellation/tax/quote policies, D-07/08/09/13 | Monetary and state oracles | Product / Finance / Loyalty |
| Capacity, retry, RPO/RTO and freshness targets, D-11/14/16 | Measurable nonfunctional gates | Engineering / Operations |
| Privacy/retention and notification policy, D-15/17 | Deletion, logging and delivery checks | Accountable policy owners |
| Exact source/build/configuration | Reproducibility and acceptance provenance | Release Owner |

Do not import session lengths, tax rates, reward rules or legacy status numbers from another project. If the owner changes a rule, update its expected results and source version before rerunning affected cases.

## 3. Ownership and Environments

| Role | Responsibility |
|---|---|
| QA Owner | Coverage, run coordination, evidence and defect assessment |
| Developers | Unit/integration tests, testability hooks, fixes and affected regression |
| Technical Lead | Invariant/contract review and unresolved technical risk |
| Finance / Loyalty Owner | Expected financial/reward results and provider reconciliation |
| Product / Store Operations | UAT outcomes, exception rules and staff readiness |
| DevOps / Database Owner | Environment isolation, failure injection, performance and recovery rehearsal |
| Release Owner | Candidate identification and final go/no-go coordination |

| Environment | Purpose | Limitation |
|---|---|---|
| Local isolated | Fast unit, component, mock and developer integration tests | Mock success does not prove provider correctness |
| CI test environment | Reproducible checks against isolated selected-engine database | Must not target shared customer data |
| Shared integration | Real components and approved external sandbox | Controlled fixture ownership and provider limits |
| UAT/staging | Release-like configuration and business/operational acceptance | Record differences from production |
| Recovery sandbox | Destructive crash/restore and migration rehearsals | Explicit disposable target and isolated external activity |
| Production pilot | Narrow approved smoke and monitored acceptance | No uncontrolled load, destructive tests or unapproved transactions |

Record runtime, database, adapter, client/device, schema and configuration versions. Production-like means documented similarity, not an assumption. Use synthetic identities and approved provider test instruments. Test access never authorizes contacting real customers.

## 4. Strategy and Test Levels

| Level | Focus | Required evidence |
|---|---|---|
| Unit | Pure pricing, validation, eligibility, transition and mapping rules | Deterministic inputs/expected outputs |
| Database integration | Unique keys, transaction atomicity, row/version guards, monetary limits | Actual selected database and committed-state assertions |
| API/contract | Schemas, auth, status/error behavior and pagination | Full OpenAPI validation plus implemented positive/negative cases |
| Adapter contract | Provider origin, identity, amount, finality, lookup and retries | Verified fixture or sandbox evidence with capability limits |
| End-to-end | Customer/staff outcomes and interrupted journeys | API/UI plus authoritative order/financial evidence |
| Resilience | Crash boundaries, delayed events, leases and recovery | Failure point, resumed state and invariant checks |
| Nonfunctional | Load, latency, accessibility, data exposure, observability | Approved target and measured result |
| UAT/pilot | Business and operational readiness | Named reviewers, exact candidate and accepted limitations |

Automate stable high-risk cases first. Do not use mocks to claim database locking or provider idempotency is proven. Use bounded condition waits rather than arbitrary sleeps. Concurrency tests must synchronize contenders at the relevant barrier and inspect final committed state, not merely send two requests sequentially.

## 5. Fixtures, Oracles and Cleanup

### Fixture baseline

- Member A and Member B; assigned Store A staff; Store B staff; authorized refund/support role; unauthorized ordinary member.
- Open store, paused store, overnight-hours store, and stale/published catalog revisions.
- Product with required option, priced modifier, unavailable selection and long localized name.
- Quotes at expiry boundaries, changed prices and one consumed quote.
- Provider adapter supporting pending, definitive failure, success, delayed/duplicate/contradictory events, and lookup by stable reference.
- Selected loyalty scheme with known spendable value and approved reversal examples.
- Collected payment and pending/succeeded/failed refunds.
- Durable outbox/inbox events with injected failure points and notification sink.

Each test run gets isolated principal/store/operation references or a controlled fixture reset. Record fixture version and run ID. Cleanup must not delete unresolved external obligations; reconcile sandbox financial actions before resetting their local records.

### Expected-result sources

Approved business examples determine price/reward values. Database constraints and SDD INV-01–INV-10 determine transaction outcomes. Provider verification/status evidence determines financial truth. UI appearance alone is not evidence of collection, refund or reward correctness.

Synthetic exact-money fixture: subtotal 1000, discount 100, added tax 90, fee 50 gives payable 1040 minor units. Informational included tax 80 does not change payable. Pending refund 400 against collected 1040 leaves 640 further reservable; refund success moves 400 from reserved to refunded without freeing capacity. This fixture is not a launch tax/currency policy.

## 6. Scenario Catalog

All cases below start as **NOT RUN**. P0 means critical correctness/security/recovery; P1 means required functional or operational behavior. Priority is not result status. Each row specifies setup/action and expected evidence; selected high-risk cases are expanded in Section 7. Instantiate boundary variants with the approved limits before execution.

### 6.1 Account, catalog and cart

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-001 | P1 | Register through approved verification; repeat verification/request | One principal; valid access only after verification; no duplicate account |
| TC-002 | P0 | Attempt wrong, expired and reused proof; exceed approved attempt limit | Access denied safely; rate/expiry rules enforced; no account enumeration |
| TC-003 | P0 | Logout/revoke session, replay token; sign in as another member | Old session denied; no prior member cached private view |
| TC-004 | P1 | Edit profile and initiate verified contact change; interrupt verification | Nonidentity edits valid; verified identity not replaced prematurely |
| TC-005 | P1 | Request deletion with active order/payment then repeat request | Approved obligation/retention policy; traceable acknowledgement; no false erasure |
| TC-006 | P1 | Select store without location access; test closed/overnight boundary | Manual selection works; eligibility follows store time zone and hours |
| TC-007 | P0 | Pause store or change availability after cart/quote opens | Checkout revalidates; new purchase blocked as required; existing orders retained |
| TC-008 | P1 | Read empty, failed, stale and newly published menu; fail import midway | States distinct; incomplete revision never becomes active |
| TC-009 | P1 | Omit required option; exceed group/quantity bounds; tamper option IDs | Client guidance and server rejection; no invalid order |
| TC-010 | P1 | Add/edit/remove distinct configurations; change store and cancel/confirm | Correct cart lines; explicit store-change consequence; no silent transfer |
| TC-011 | P1 | Restart/sign in while cart exists; submit stale cart version | Approved persistence; conflict handled; no duplication or private-data mixing |

### 6.2 Quote and checkout

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-012 | P0 | Quote exact-money fixtures and approved rounding boundaries | Header/line/component values reconcile exactly; no double-added included tax |
| TC-013 | P0 | Submit quote just before/at/after expiry and after price/benefit change | Approved boundary policy; changed payable amount requires reconfirmation |
| TC-014 | P0 | Tamper client amount, currency, quote owner or product configuration | No unreviewed price or unauthorized quote accepted |
| TC-015 | P0 | Submit same intent key/payload concurrently and sequentially | One intent/order and intended collection; same recoverable identity |
| TC-016 | P0 | Reuse key with different semantic payload; reorder only canonical fields | Changed semantics conflict; equivalent canonical input replays |
| TC-017 | P0 | Race two different keys against one quote | Quote consumption permits at most one committed order |
| TC-018 | P0 | Drop response after checkout commit, restart client and recover | Original order/intent recovered; no new automatic payment key |
| TC-019 | P0 | Fail checkout transaction before commit and restart workers | No partial usable order, reservation or external payment dispatch |

### 6.3 Payment and refunds

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-020 | P0 | Complete provider flow; separately spoof client success/redirect | Only trusted evidence marks payment succeeded; store acceptance remains separate |
| TC-021 | P0 | Send invalid signature, wrong merchant/environment/reference/amount/currency | Reject or quarantine appropriately; no unrelated payment update |
| TC-022 | P0 | Repeat/reorder valid callback; reuse event ID with changed digest | One effect; no state regression; changed digest becomes integrity exception |
| TC-023 | P0 | Fail inbox persistence before acknowledgement; redeliver | No false success acknowledgement; eventual durable receipt once |
| TC-024 | P0 | Time out provider initiation then report late success; retry client | Pending retained; status lookup resolves original operation; no second collection |
| TC-025 | P0 | Crash worker after provider effect before local outcome commit | Stable provider reference recovers same effect; no blind new operation |
| TC-026 | P0 | Return definitive failure then deliberately retry; also retry while pending/succeeded | New attempt only when approved financial gate permits; other cases blocked |
| TC-027 | P0 | Deliver success after order cancellation/rejection or mismatch local/provider records | Terminal fulfillment unchanged; owned financial resolution created |
| TC-028 | P0 | Request refund beyond capacity and race two refundable amounts | Succeeded plus reserved refunds never exceed collected amount |
| TC-029 | P0 | Timeout refund, replay same operation, then resolve success/failure | Unknown capacity retained; one effect; release only on definitive nonexecution |
| TC-030 | P1 | Test full refund and, only if enabled, partial tax/discount allocations | Approved allocations sum exactly; customer sees requested/pending/succeeded distinctly |

### 6.4 Orders, staff and support

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-031 | P1 | Complete purchase to collection; change catalog afterwards | Historical items/totals preserved; submitted/paid/accepted/ready/completed distinct |
| TC-032 | P1 | Refresh tracking offline; open delayed notification; paginate live history | Last known state labeled; current state retrieved; stable owned pagination |
| TC-033 | P0 | Race staff acceptance/cancellation and two stale staff commands | One legal versioned outcome; loser receives current state/conflict |
| TC-034 | P0 | Attempt preparation before payment eligibility and illegal backward transitions | Commands rejected; no forbidden fulfillment or history rewrite |
| TC-035 | P1 | Reconnect staff queue, pause new ordering and process existing orders | No missed/duplicate fulfillment; prior commitments remain actionable |
| TC-036 | P0 | Member/staff/support roles search and mutate other owner/store records | Unauthorized access denied, including search/cursors/deep links |
| TC-037 | P1 | Locate mismatched payment and assign/resolve support case | Evidence and owner retained; case endpoint cannot fabricate financial success |

### 6.5 Loyalty and notifications

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-038 | P1 | Read selected scheme, empty history, expired benefit and service failure | Correct units/coupons/terms; unavailable is not false zero |
| TC-039 | P0 | Race two checkouts for the same spendable units/benefit | No overspend/double redemption; quote changes require review |
| TC-040 | P0 | Reservation reaches expiry while payment remains unknown | No blind release; approved resolution preserves obligation |
| TC-041 | P0 | Replay collection/reward event, including after rule revision change | One qualifying effect; no duplicate reward due to rule-version change |
| TC-042 | P0 | Cancel/refund after earning/redemption; replay reversal | Approved restoration/reversal, cumulative bounds and original history preserved |
| TC-043 | P0 | Fail loyalty after order collection; restart/retry worker | Order stays complete; adjustment recovers once or becomes owned exception |
| TC-044 | P1 | Deny notification permission, fail provider, repeat business event | Business outcome unaffected; bounded delivery retries and safe deduplication |
| TC-045 | P0 | Change account on device then open old notification | Current authorization enforced; no former account content exposure |

### 6.6 Contracts, data, resilience and UX

| ID | Priority | Setup and action | Expected result |
|---|---|---|---|
| TC-046 | P1 | Fully validate final OpenAPI and exercise selected schema variants | Valid contract; conditional shapes enforced; placeholders closed before acceptance |
| TC-047 | P0 | Send wrong types, null/zero/empty, oversized values, unsupported fields and cursor tampering | Approved limits/errors; no overflow, scope bypass or leaked internals |
| TC-048 | P0 | Inspect logs, API errors, analytics and fixtures during failed operations | No tokens, proofs, secrets or unnecessary contact data |
| TC-049 | P0 | Crash outbox consumer; expire lease; resume old and new workers | Local stale completion rejected; external stable-operation recovery retained |
| TC-050 | P0 | Apply migration/backfill, restart, attempt prohibited history deletion | Constraints enforced; resumable changes; no duplicate effects or destructive cascade |
| TC-051 | P0 | Restore database behind provider activity and replay recovery | External facts reconciled before collection resumes; obligations not lost |
| TC-052 | P1 | Load/peak/soak and dependency degradation at approved workload | Measured latency/error/capacity/queue targets met; no financial invariant breach |
| TC-053 | P1 | Navigate critical screens with text scaling, keyboard/assistive controls and selected devices/locales | Approved accessibility/compatibility criteria; no hidden purchase action |
| TC-054 | P1 | Stop workers/sync/provider, observe alerts and support routing | Correct signals, named owner, actionable correlation, bounded recovery |
| TC-055 | P1 | Execute UAT pickup and exception journeys with store/finance reviewers | Business outcomes accepted on exact candidate; limitations recorded |
| TC-056 | P0 | Pilot smoke, pause checkout and exercise compatible rollback procedure | Existing orders/callbacks/refunds/reconciliation remain recoverable |

## 7. Detailed High-Risk Procedures

Use fresh isolated fixtures for each procedure. Record API responses, committed records, provider operation identity and safe logs. No production destructive injection is authorized by this plan.

### TC-015 — Concurrent same-intent submission

**Setup:** Valid owned quote, no prior consumed quote/intent, approved payment adapter, two independent clients and actual database. Use a barrier so both requests reach intent creation concurrently.

1. Send the identical canonical payload and operation key from both clients.
2. Capture responses, including accepted/pending/conflict behavior allowed during contention.
3. Retry the same key/payload after transaction settlement and retrieve the intent.
4. Allow worker/provider processing to settle or reach its approved pending state.
5. Inspect intent/order linkage, quote consumption, outbox operations, reward reservation if used, and provider collections.

**Pass:** One committed intent/order for that key, one quote consumption and no duplicate reservation/collection. Any transient loser response can recover the winning identity. Duplicate deliveries may exist, but effects remain singular. Both API-only success and a count of only visible UI cards are insufficient proof.

### TC-018 — Lost checkout response

**Setup:** Proxy/test hook can drop the response only after local transaction commit.

1. Submit valid checkout with retained key; drop response.
2. Terminate/restart client without deleting server data.
3. Recover through the documented key lookup or identical submission.
4. Resume status retrieval; inspect any generated provider operation.

**Pass:** Original purchase is discoverable after required authentication. No automatically minted second intent or independent payment. UI distinguishes unknown payment from failure and preserves the correct store/total.

### TC-025 — Provider side effect before worker crash

**Setup:** Adapter supports stable operation lookup; capture exact reference. Fault hook stops worker after provider executes but before local result commits.

1. Dispatch the recorded payment operation and trigger the crash window.
2. Verify provider evidence exists while local attempt remains unresolved.
3. Restart worker/reconciliation and allow recovery using the original reference.
4. Replay the job/event once more.

**Pass:** Original outcome is resolved without duplicate collection. If provider capabilities cannot prove safe recovery, the system retains an owned unresolved case and blocks a new collection; automatic-recovery capability remains blocked, not falsely passed. Mock results alone cannot prove sandbox contract guarantees.

### TC-028 — Concurrent refund capacity

**Setup:** Synthetic collected amount 1040; two distinct valid refund requests of 700 each, sufficient role, no prior refund. Barrier contenders at capacity reservation.

1. Submit requests concurrently with different keys.
2. Inspect committed refund requests and reserved/succeeded exposure.
3. Leave the winning request pending; retry the losing request.
4. Resolve winning request successfully and repeat checks.

**Pass:** At most 1040 total succeeded plus reserved; one 700 reservation may win and the other must not oversubscribe. Pending outcome does not free capacity. Duplicate retry of winner returns its same refund. Zero negative capacity and consistent counters/history after resolution.

### TC-033 — Acceptance versus cancellation

**Setup:** Submitted eligible order at version V; approved policy permits cancellation in Submitted. Two authorized actors share V.

1. Release acceptance and cancellation commands at one barrier.
2. Retrieve authoritative order and transitions.
3. Inspect downstream preparation/refund work and repeat both keys.

**Pass:** One legal transition wins; losing stale command conflicts or returns the recorded outcome without new effects. No simultaneous active preparation and canceled outcome from the race. Any financial obligation follows the winning policy and remains separately visible.

### TC-039 — Concurrent loyalty spend

**Setup:** Selected scheme with one redeemable coupon or 100 spendable units; two independently quoted intents each attempt to spend all value.

1. Synchronize reservation attempts at the authority boundary.
2. Allow both to resolve; inspect authoritative benefit/account and effects.
3. Repeat the successful reservation operation.
4. Confirm losing checkout requires correction/review rather than a silent higher charge.

**Pass:** One reserved/consumed benefit or total units within available amount. For external authority, evidence must come from its atomic reservation contract; local cached balances do not prove correctness.

### TC-049 — Expired worker lease

**Setup:** Two workers; pause first after claim and before external action; controllable lease clock.

1. Expire first lease; second worker claims and proceeds.
2. Resume first worker and observe attempted effect/completion.
3. Retrieve provider operation and local claim/effect receipts.

**Pass:** Stale claim cannot overwrite newer local state. External duplicate execution is prevented or resolved by stable operation identity, not by a claim-token check alone. No lost obligation after retries exhaust.

### TC-051 — Restore behind financial activity

**Setup:** Isolated recovery environment, valid backup/checkpoint, controlled provider-side activity after checkpoint; new initiation paused.

1. Create backup at T0 and record stable operation references.
2. Complete selected payment/refund outcomes after T0 and preserve external evidence.
3. Restore local database to T0; keep new financial initiation disabled.
4. Run reconciliation and recover pending/missing evidence, inbox/outbox and reservations.
5. Verify constraints/totals, recovery time and any known data gap.
6. Resume only after approved reconciliation and operational decision.

**Pass:** No duplicate external effects; provider activity recovered or explicitly owned and blocked from unsafe reuse; approved RPO/RTO met. A successful database restore without external reconciliation does not pass.

## 8. Requirement and Invariant Coverage

| PRD requirement | Primary cases |
|---|---|
| REQ-ACC-001 | TC-001–003, TC-036, TC-047 |
| REQ-ACC-002 | TC-004–005, TC-036, TC-048 |
| REQ-STR-001 | TC-006–007 |
| REQ-MNU-001 | TC-008 |
| REQ-MNU-002 | TC-009 |
| REQ-CART-001 | TC-010–011 |
| REQ-PRICE-001 | TC-012–014 |
| REQ-CHK-001 | TC-015–019 |
| REQ-PAY-001 | TC-020–023, TC-026 |
| REQ-PAY-002 | TC-018, TC-024–027 |
| REQ-ORD-001 | TC-031, TC-036 |
| REQ-ORD-002 | TC-031–035 |
| REQ-ORD-003 | TC-032, TC-036 |
| REQ-ORD-004 | TC-028–030, TC-033 |
| REQ-LOY-001 | TC-038 |
| REQ-LOY-002 | TC-039–043 |
| REQ-NTF-001 | TC-044–045 |
| REQ-OPS-001 | TC-033–036 |
| REQ-OPS-002 | TC-007, TC-035 |
| REQ-SUP-001 | TC-027–030, TC-036–037, TC-054 |

| SDD invariant | Evidence cases |
|---|---|
| INV-01 one intent/order | TC-015, TC-017–019 |
| INV-02 key/payload identity | TC-016 |
| INV-03 collection gate | TC-024–026 |
| INV-04 accepted quote | TC-012–014 |
| INV-05 guarded transition | TC-033–034 |
| INV-06 bounded loyalty spend | TC-039–040 |
| INV-07 refund exposure | TC-028–030 |
| INV-08 atomic state/outbox/audit | TC-019, TC-023, TC-049 |
| INV-09 unique local effect | TC-022, TC-041–043, TC-049 |
| INV-10 no reopening on late payment | TC-027 |

Coverage means a planned case exists. It does not establish execution, pass status, or complete coverage of all boundary variants.

## 9. API and Database Test Design

For every enabled API operation, generate a coverage record containing operation ID, authorized role/scope, valid request/response, invalid inputs, relevant error codes and business effects. Test absent versus null/empty/zero, conditional schema branches, wrong content types, max bounds, unknown fields, integer precision and exact currency/exponent behavior.

Validate all references/examples with a full selected OpenAPI validator and exercise the implementation. Pay special attention to public identity challenge purposes versus protected contact change, conditional response fields, provider callback verification despite absence of customer bearer security, and scoped support search.

Database verification uses the selected engine/version with real constraints and transactions. Test case-sensitive provider keys, non-null and nullable uniqueness semantics, foreign-key deletes, counter/ledger agreement, migration resumes, historical snapshots and cursor indexes. Do not use an in-memory substitute to certify a different engine's isolation behavior.

For asynchronous cases, assert both immediate response and eventual state within an approved bounded window. If the window expires, classify as failed or blocked with evidence rather than forcing success by altering records.

## 10. Nonfunctional Targets and Measurement

All target values below require approval before execution acceptance. Numeric blanks are not passes. NFR IDs refer to the PRD.

| NFR | Measure / experiment | Target / decision |
|---|---|---|
| NFR-01 | Cross-owner/store/role and expired-session denial | Zero unauthorized successful operations in planned negative cases |
| NFR-02 | Transport/configuration and sensitive-output inspection | Approved architecture controls; no prohibited leakage in tested paths |
| NFR-03 | Authentication/command rate and attempt limits | D-14 thresholds TBD; test below/at/above boundary |
| NFR-04 | p95 menu, quote, submit acknowledgement and status latency | D-11 values TBD; provider waiting time reported separately |
| NFR-05 | Peak orders/min, concurrency, catalog/history size | D-11 load model and duration TBD |
| NFR-06 | Critical-journey synthetic availability | D-11 window/target TBD; failures not hidden in aggregate HTTP uptime |
| NFR-07 | Restore data gap and elapsed recovery | D-14 RPO/RTO TBD; include financial reconciliation |
| NFR-08 | Critical-flow accessibility checks | D-03 approved target, devices and assistive tools TBD |
| NFR-09 | Platform/locale matrix | D-03/D-09 selected targets only, boundary text/date/amount cases |
| NFR-10 | Alert detection/routing and unresolved-case visibility | D-12/D-14 detection/response targets TBD |
| NFR-11 | Retention/deletion and restored-data handling | D-15 approved schedule/workflow |
| NFR-12 | Catalog/status staleness and quote lifetime | D-13/D-16 values TBD; boundary tests |

### Performance protocol

Agree realistic traffic mix, user/store contention, think time, dataset size, warmup, run duration, network conditions and provider constraints. Run baseline, expected load, approved peak, sustained soak and controlled degradation/recovery. Capture latency distribution, errors, database contention, queue age, provider throttling and invariant violations. Do not load-test an external sandbox beyond its permitted limits; use a modeled adapter for scale and label that limitation.

### Accessibility/compatibility protocol

Exercise C01–C15 and applicable S01–S04 on selected targets, especially critical checkout/recovery. Test labels/focus, keyboard or native accessibility navigation, text enlargement, long translations, reduced motion, no color-only status, touch targets and keyboard/sticky-control overlap. Visual inspection of static screens does not prove interactive accessibility. Language approval remains separate from translation correctness testing.

## 11. Execution Order and Entry Criteria

1. Review source versions, decisions and expected examples.
2. Prepare isolated fixtures and adapters; verify environment/readiness and safe diagnostic access.
3. Run unit and contract checks while features develop.
4. Run actual-database integration and component tests for changed behavior.
5. Exercise provider contract scenarios once sandbox semantics are approved.
6. Run integrated critical journeys and concurrency/recovery cases on the candidate.
7. Complete nonfunctional and migration/restore gates.
8. Conduct business UAT, followed by approved pilot smoke/observation.

A suite starts only with an identified build/configuration, usable fixtures, authorized test environment, agreed expected results and required tools. Missing provider/policy evidence blocks only dependent suites; unrelated useful tests can continue. Record the boundary explicitly.

Suspend a run if it risks unintended real transactions/messages, contaminates another run's data, loses evidence integrity, or encounters an environment fault that makes results unreliable. Preserve pending obligations, correct the issue, document the reset/recovery and rerun affected cases from known state.

## 12. Results, Evidence and Defects

### Case status

NOT RUN; IN PROGRESS; PASSED; FAILED; BLOCKED; or NOT APPLICABLE with approved scope rationale. A flaky pass after an unexplained retry is not a reliable pass; retain failure evidence and investigate nondeterminism.

### Execution record template

| Field | Value to record |
|---|---|
| Run/case ID and revision | Unique run plus TC identifier and source version |
| Build/configuration/schema | Exact source/artifact, config and migration revisions |
| Environment/adapter/device | Real dependencies versus mocks explicitly named |
| Preconditions/fixtures | Synthetic identifiers and known starting facts |
| Steps/inputs | Reproducible actions, concurrency barrier or failure point |
| Expected/actual | Business facts, HTTP/UI behavior and committed outcomes |
| Evidence | Redacted logs, record references, provider evidence, screenshots where useful |
| Result | Explicit status with tester/time |
| Defect/decision | Linked issue, owner and rerun scope |

### Defect severity and handling

| Severity | Examples | Release treatment |
|---|---|---|
| Critical | Unauthorized data access, duplicate collection, corrupted/lost financial evidence | Blocks release/expansion; immediate triage |
| High | Core checkout/fulfillment unusable, unsafe recovery, incorrect totals, reward overspend | Blocks release until fixed or explicitly redesigned scope |
| Medium | Material noncritical issue with viable workaround | Owner assesses impact; accepted risk must be explicit |
| Low | Minor presentation/documentation issue without core impact | Track owner and priority; not automatically a blocker |

Severity describes impact; priority describes scheduling. Bug record includes expected/actual result, minimal reproduction, build/environment, safe evidence, affected requirement and business impact. Lifecycle: New → Triaged → In Progress → Ready for Retest → Verified/Closed, with Reopened on failure. Marking fixed in code is not verified closure.

## 13. Regression and CI Selection

Every change runs the relevant checks required by `09-coding-standards.md` and `10-git-and-review-workflow.md`. Financial, authorization, migration or event-contract changes require their affected negative and invariant cases. UI-only changes require relevant state/accessibility checks. Documentation-only edits do not require new implementation-mirroring tests.

Maintain a fast smoke subset for environment readiness: valid authentication, store/menu, quote, one durable checkout, current order read and worker readiness. Candidate regression also covers P0 transaction/security cases and all affected P1 outcomes. Do not repeat costly unrelated suites without a concrete risk, but required release gates remain mandatory.

After a fix, retest the failing case plus dependent behavior. After conflict resolution or a changed build/configuration, reassess evidence applicability; a pass from an older candidate cannot silently certify a materially different one.

## 14. Exit Criteria and Release Recommendation

### QA exit to UAT/release candidate

- All in-scope PRD requirements have executed evidence or a formally approved scope change.
- All applicable P0 cases pass; no unresolved Critical/High defect or unsafe financial/security obligation.
- Required P1 cases pass, except explicitly assessed nonblocking issues with owner, workaround and approval; no blanket pass-rate substitute.
- Final enabled API/identity/provider variants validated; no placeholder accepted as implementation evidence.
- Performance, capacity, accessibility, freshness and recovery targets are filled and assessed against actual results.
- Migration/restore, monitoring, reconciliation and support readiness have evidence.
- Unresolved cases/limitations are visible with business and operational owners.

A low-risk waiver cannot disguise missing financial/authorization/recovery proof. If a feature is removed to resolve a blocker, Product updates scope and dependent contracts/tests explicitly.

### Pilot and production

QA provides a recommendation with evidence; Product, Finance where applicable, Operations and the release owner record go/no-go. Pilot cohort/window and stop criteria come from the delivery/release plan. Smoke tests use approved production procedures and reconcile any test financial activity. Destructive and load tests remain outside production unless separately scoped and authorized.

## 15. Reporting and Deliverables

Deliver versioned cases/fixtures, automated suites where appropriate, run records, defect log, requirement/invariant coverage, provider contract evidence, nonfunctional results, restore rehearsal report and QA recommendation.

Status report states build, planned/passed/failed/blocked/not-run counts, critical unresolved risks, decisions needed, retest scope and evidence links. Report coverage and results separately. No execution totals are asserted in this plan; all 56 catalog cases begin NOT RUN.

Planned `12-uat-and-sign-off.md` records business acceptance. Planned deployment/release/runbook documents consume this plan's evidence; referencing them does not claim they exist or are approved.

## 16. Approval and Change History

| Review | Reviewer | Status / date |
|---|---|---|
| Coverage and execution strategy | QA Owner — TBD | Pending / — |
| Invariants and testability | Technical Lead — TBD | Pending / — |
| Financial/reward oracles | Finance / Loyalty Owner — TBD | Pending / — |
| UAT and staff operations | Product / Operations Owner — TBD | Pending / — |
| Environment and recovery | DevOps / Database Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial 56-case baseline, detailed critical procedures, requirement/invariant mapping, nonfunctional gates and evidence process |

Update cases with approved policy/contract changes and retain source/result provenance. This document's completion does not certify that the application passed testing.
