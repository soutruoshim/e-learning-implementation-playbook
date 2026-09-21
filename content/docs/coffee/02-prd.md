---
title: "02 — Product Requirements Document"
---

# 02 — Product Requirements Document

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | PRD-001 |
| Version | 1.0 |
| Status | Draft for stakeholder review |
| Created / updated | 2026-09-11 |
| Product owner | TBD |
| Technical owner | TBD |
| Business sponsor | TBD |
| Source | `01-project-brief.md`, version 1.0 |
| Related roadmap | `documentation-zero-to-production.md` |
| Target release | TBD following scope approval and estimation |

> This document specifies a proposed pickup-first MVP. It is based on the project brief and the conversation's description of Home, Product Details, Cart, Checkout, Order Confirmation, Tracking, and Rewards. The original design files have not been inspected for this PRD. Additional operational and exception behavior below is proposed, not inferred from unseen screens. Requirements are draft requirements until approved. Payment provider, reward economics, platforms, numeric service targets, and operating policies remain decision gates; no integration or launch approval is implied.

## 1. Purpose and Product Outcome

Customers should be able to choose a store, browse its menu, customize items, review an accurate total, place a pickup order, follow preparation, and collect it. Members should be able to understand and use a basic loyalty benefit. Store staff must receive actionable orders and manage fulfillment, while support and finance can trace exceptions.

This PRD defines what the product must do and the evidence needed to accept it. Architecture, endpoint contracts, schemas, and deployment implementation belong in the SDD, database specification, and API specification.

### 1.1 Objectives

- Reduce uncertainty about products, prices, pickup location, payment, and order progress.
- Provide a complete digital pickup journey that stores can operate reliably.
- Prevent unintended duplicate orders, charges, and loyalty effects.
- Make failures recoverable without asking customers to guess whether to pay again.
- Establish measurable adoption, completion, reliability, and repeat-use outcomes.

### 1.2 Definitions

| Term | Meaning |
|---|---|
| Customer | Person browsing or ordering through the customer app |
| Member | Authenticated customer eligible for the approved loyalty scheme |
| Checkout intent | One deliberate attempt to buy a particular validated cart; network retries do not constitute new intent |
| Quote | Server-calculated items, prices, adjustments, and total presented for customer confirmation |
| Order submitted | A durable order record exists; this alone does not prove payment or store acceptance |
| Store acceptance | Store commits to preparing an eligible order |
| Payment confirmation | Trusted provider evidence that the required payment outcome occurred |
| Completion | Staff records that the customer collected the order |
| Idempotency | Repeating the same operation produces one business effect |
| Reconciliation | Comparing internal records with authoritative external outcomes and resolving differences |
| TBD | Unresolved value or policy; must be decided before the affected requirement is accepted |

## 2. Scope and Priorities

Priority describes the proposed MVP baseline, not approval status. **Must** requirements gate release. **Should** requirements may be deferred explicitly with an owner and rationale. **Later** capabilities are excluded from the initial release.

| Epic | Scope | Priority |
|---|---|---|
| E01 — Account | Registration, login, recovery, profile, logout, deletion request | Must |
| E02 — Store and menu | Store selection, operating availability, categories, product details | Must |
| E03 — Cart and quote | Modifiers, quantities, one-store cart, server totals | Must |
| E04 — Checkout and payment | Pickup details, one payment method, retry safety, outcome recovery | Must |
| E05 — Orders | Confirmation, progress, collection, history, exception visibility | Must |
| E06 — Loyalty | One basic approved earning/redemption scheme, balance or benefit view, history | Must; rules gate implementation |
| E07 — Notifications | Important order updates, preferences, delivery-failure isolation | Must |
| E08 — Store operations | Order queue, permitted transitions, availability control, role scope | Must |
| E09 — Support and finance | Order lookup, refund procedure, reconciliation, auditability | Must |
| E10 — Measurement | Essential funnel and operational events | Must |
| E11 — Catalog convenience | Keyword search if supported by the approved design | Should |

### 2.1 Exclusions

Delivery/driver tracking; multi-store carts; scheduled and recurring orders; subscriptions; marketplace merchants; AI recommendations; multiple payment providers; complex campaigns, missions, referrals, and reward sharing; procurement/ERP replacement; and advanced BI dashboards are outside this baseline.

The staff capabilities may be provided through an existing POS or staff system. A new admin portal is not automatically in scope. Guest browsing is proposed; guest checkout remains undecided. Public launch scope, platforms, and store count remain TBD.

## 3. Users and Permissions

| Actor | Allowed capabilities | Boundary |
|---|---|---|
| Visitor | Browse stores, menu, and product details | No access to another person's orders or loyalty data |
| Member | Manage own profile, checkout, view own orders and rewards | Ownership checked on every protected action |
| Store staff | Process orders and availability for assigned stores | Cannot act on unassigned stores or issue unrestricted refunds |
| Store manager | Oversee assigned stores and approved exception actions | Permissions explicitly configured |
| Support | Search authorized records and coordinate resolution | Only required customer data; no unrestricted financial mutation |
| Finance / authorized refund operator | Reconcile and initiate approved refunds | Amount and role checks; audit required |
| Administrator | Manage approved roles/configuration | Privileged actions recorded; least necessary access |

Exact role mapping and whether existing identity systems are reused are decisions for technical discovery. Hiding a control in the UI does not replace permission enforcement.

## 4. Main Journey and Alternate Outcomes

1. Customer selects a store and browses its currently offered products.
2. Customer configures supported item options and adds them to a single-store cart.
3. Customer reviews the cart and proceeds to checkout.
4. System validates identity requirements, store availability, products, rewards, and totals.
5. Customer confirms pickup details and the current quote.
6. System records the checkout intent and processes the approved payment flow.
7. Customer sees a durable order reference and explicit payment/fulfillment states.
8. Eligible order appears in the staff queue; staff accept or reject it.
9. Staff update preparation and readiness; customer follows progress.
10. Staff confirm collection; system applies eligible loyalty effects once.

If the payment result is unknown, the app shows a pending outcome and retrieves its status. It must not report success from a client redirect alone or encourage an independent payment attempt while the original outcome remains unresolved.

## 5. Functional Requirements and Acceptance Criteria

Acceptance criteria use **Given / When / Then** where useful. Every criterion belongs to the requirement ID of its subsection and should be linked from the corresponding Jira story and QA cases.

### REQ-ACC-001 — Registration and authentication

**Priority:** Must. **Story:** As a customer, I want to securely access my account so that my orders and rewards belong to me.

- Given valid registration details and the approved identity-verification method, when verification succeeds, then one account is created and the customer can sign in.
- Invalid or incomplete input produces field-level guidance without creating a partial usable account.
- A repeated registration request does not create duplicate identities.
- Failed login and recovery responses do not disclose unnecessary account-existence information.
- Expired sessions require authentication before protected operations; recoverable cart contents remain available where permitted.
- Logout invalidates the current session according to the approved session design; replaying it cannot access protected data.
- Recovery proves control of the agreed identity channel before access is restored. Verification expiry, retry limits, and session-revocation policy are defined before QA acceptance.

**Decision dependency:** D-03 and D-04.

### REQ-ACC-002 — Profile and account deletion request

**Priority:** Must. **Story:** As a member, I want to manage my details and request account deletion.

- Member can view and update supported profile fields; changes requiring identity verification do not take effect until verified.
- Member cannot read or modify another member's profile by changing a record identifier.
- Deletion request requires authenticated confirmation and presents its effect on access, orders, and rewards.
- Handling of active orders, unsettled payments, retained transaction records, completion timing, and support ownership is disclosed under an approved retention/deletion policy.
- Submission is acknowledged once and can be traced by support. The UI does not claim immediate erasure if processing or permitted retention remains.

**Decision dependency:** D-15.

### REQ-STR-001 — Store selection and ordering availability

**Priority:** Must. **Story:** As a customer, I want to select a pickup store so that I order from the correct location.

- Store list shows name, address, and current ordering eligibility; location permission is optional and manual selection remains possible.
- Selected store remains visible in the cart, checkout, and confirmation.
- Closed, paused, or otherwise ineligible stores cannot receive new checkout submissions.
- If store eligibility changes during checkout, submission is blocked with a recoverable explanation.
- Switching stores with a nonempty cart requires confirmation; incompatible items are not silently transferred or repriced.
- Operating hours are evaluated in the store's time zone, including date-boundary behavior.

### REQ-MNU-001 — Home and menu browsing

**Priority:** Must. **Story:** As a customer, I want to see the selected store's menu so that I can choose available products.

- Products show name, image or fallback, and price context; a base price is labeled when options can change it.
- Categories and product availability match the selected store.
- Loading, no-products, unavailable-content, and retry states are distinguishable.
- Promotional content does not imply eligibility or a discount that the server cannot apply.
- Cached content may be displayed when appropriate, but checkout always validates current sellability and price.

### REQ-MNU-002 — Product configuration

**Priority:** Must. **Story:** As a customer, I want to choose sizes and modifiers so that my order matches my preference.

- Details show description, selectable options, applicable prices, and quantity.
- Required choices and minimum/maximum selection counts are enforced before adding to cart and again on submission.
- Incompatible or unavailable options cannot be ordered by manipulating the request.
- Displayed line price changes as priced options change.
- Product facts such as ingredients or allergens are displayed only when supplied by the authoritative catalog; absent data is not presented as a safety assurance.

### REQ-CART-001 — Cart management

**Priority:** Must. **Story:** As a customer, I want to edit my cart so that I can confirm the right items.

- Customer can add, edit, remove, and change quantity within configured limits.
- Each line identifies product, size/modifiers, quantity, and line total.
- Identical configurations may combine; distinct configurations remain distinguishable.
- Empty cart cannot proceed to order submission.
- Restoring a cart after restart or authentication does not silently lose, duplicate, or submit items; persistence duration is defined in D-16.
- Invalid or unavailable restored items are identified and require correction before submission.

### REQ-PRICE-001 — Authoritative quote and total

**Priority:** Must. **Story:** As a customer, I want an accurate total before I pay.

- Server calculates prices, modifier charges, quantities, eligible reductions, taxes, and fees using approved rules.
- Client-submitted prices, totals, eligibility flags, or reward values are not trusted.
- Checkout displays currency, item amounts, reductions, tax treatment, fees, and final payable amount without double-counting included tax.
- If prices or eligibility change, customer sees the revised quote and explicitly confirms it before payment proceeds.
- An expired or altered quote cannot be used to charge an unreviewed total.
- Monetary calculation precision, rounding stage, quote lifetime, and any zero-total order behavior are documented with worked examples before acceptance.

**Decision dependency:** D-09 and D-13.

### REQ-CHK-001 — Submit pickup checkout once

**Priority:** Must. **Story:** As a customer, I want to submit my pickup order without accidental duplicates.

- Checkout shows selected store, items, final quote, contact details, and pickup expectations before confirmation.
- Required contact fields are validated; account-required checkout redirects to authentication while retaining recoverable cart state.
- Successful submission creates one durable order reference for one checkout intent.
- Repeated taps or network retries of the same intent return the same business outcome, with no extra order or charge.
- Reusing an intent identifier with changed order data returns a conflict requiring a deliberate new checkout; it does not mutate the original purchase.
- Concurrent eligibility checks cannot spend the same reserved benefit twice.
- If submission response is lost, customer can recover the existing intent/order state without starting a second purchase.

### REQ-PAY-001 — Payment initiation and verification

**Priority:** Must. **Story:** As a customer, I want to understand whether my payment succeeded.

- Only the approved payment method is offered and the charge matches the customer-confirmed quote and currency.
- Provider outcome is verified through trusted server-side evidence; a customer redirect, screenshot, or client flag is insufficient.
- Invalid or mismatched payment events do not mark an order as paid.
- Repeated or out-of-order events cannot duplicate charges, regress a completed outcome, or cause repeated downstream effects.
- A definitive failed attempt permits the approved retry flow. An unknown outcome is investigated/reconciled before a new charge is allowed.
- Payment initiation and resolution remain traceable to the checkout intent and order.
- Sensitive payment credentials are not exposed in application logs or customer records.

**Decision dependency:** D-05. Provider-specific authorization/capture steps are not assumed.

### REQ-PAY-002 — Unknown and late payment outcomes

**Priority:** Must. **Story:** As a customer, I want a clear resolution when payment or the network times out.

- Pending UI tells the customer that confirmation is still in progress and offers status retrieval and support information.
- Restarting the app or returning from the provider recovers the authoritative outcome.
- Pending orders do not disappear when the cart is cleared or a session expires; access resumes after authentication as needed.
- A local timeout is not treated as definitive proof of payment failure.
- Late success for an expired, canceled, rejected, or otherwise nonfulfillable order triggers an exception/refund process, not silent reopening or fulfillment.
- Reconciliation identifies provider-confirmed payment without a matched usable order and assigns an operator/action.
- Resolution thresholds, escalation timing, and customer messaging are approved before launch.

### REQ-ORD-001 — Confirmation and order details

**Priority:** Must. **Story:** As a customer, I want an order reference and clear details so that I know what happens next.

- Order details show reference, store/address, order time, purchased item snapshot, totals, payment state, and fulfillment state.
- “Submitted,” “paid,” and “accepted by store” are not presented as interchangeable outcomes.
- Later catalog edits do not rewrite the historical purchase details.
- Customer can reopen an owned order from history or an authorized notification link.
- Another customer's order cannot be retrieved by guessing its reference.

### REQ-ORD-002 — Track preparation and collection

**Priority:** Must. **Story:** As a customer, I want to see current preparation progress so that I know when to collect.

- Tracking displays the authoritative current fulfillment state and last refresh/update information.
- Accepted, preparing, ready for pickup, and completed are distinguishable.
- Failed refresh preserves the last known status with a stale/retry indication rather than inventing progress.
- Notifications do not replace order-state retrieval and do not advance the order themselves.
- Pickup is marked complete only through an authorized action and the agreed collection-verification procedure.
- Any estimated pickup time is identified as an estimate; no unsupported timing promise is shown.

### REQ-ORD-003 — History

**Priority:** Must. **Story:** As a member, I want to review past orders and unresolved purchases.

- History includes pending and terminal outcomes, sorted consistently with stable pagination.
- Each entry shows reference, store, date, amount/currency, and meaningful status.
- Refresh/pagination does not omit or duplicate entries due to unstable ordering.
- Empty, loading, and error states are supported.
- Refund progress remains visible independently of the order's canceled/rejected/completed status.

### REQ-ORD-004 — Cancellation, rejection, and refunds

**Priority:** Must. **Story:** As a customer or operator, I want a clear resolution when an order cannot proceed.

- Cancellation eligibility is enforced against current state and approved policy on the server; a stale visible button grants no entitlement.
- A cancellation request does not display as canceled until the authoritative transition succeeds.
- Concurrent acceptance/preparation and cancellation yield one consistent outcome; the losing action receives current state.
- Store rejection requires an approved reason and prevents preparation.
- Already collected orders cannot be relabeled canceled; any subsequent financial adjustment follows the refund process.
- Refund action is restricted, cannot exceed the remaining refundable amount, and is safe to retry.
- Refund requested/pending, succeeded, and failed are distinguishable; only trusted outcome confirms money was refunded.
- Customer sees the reason and next action where appropriate. No-show and post-preparation cases follow a specifically approved policy.

**Decision dependency:** D-08. Automatic refunds, partial refunds, and customer cancellation windows are not presumed.

### REQ-LOY-001 — View rewards and history

**Priority:** Must. **Story:** As a member, I want to see my benefits and their terms.

- View shows the approved benefit type, available amount/status, expiry where applicable, and eligibility terms.
- Pending, available, reserved, redeemed, expired, and reversed effects are distinguishable when applicable to the selected scheme.
- History links order-related changes to their originating order and records effective time.
- An unavailable loyalty service shows a retry/unavailable state, not a false zero balance.
- Member cannot view or spend another member's rewards.

### REQ-LOY-002 — Earn and redeem once

**Priority:** Must. **Story:** As a member, I want eligible rewards applied correctly.

- Earning eligibility, amount, trigger, expiry, and exclusions follow a versioned approved rule; proposed earning trigger is completed collection.
- Replaying the qualifying order event creates no duplicate earning.
- Redemption is validated at checkout and is reflected in the confirmed quote before payment.
- Concurrent checkouts cannot consume more benefit than is available; reservation/consumption is atomic from the customer's perspective.
- Failed/abandoned checkout releases reserved value under an agreed expiry/recovery policy.
- Cancellation/refund adjusts earning and restores or retains redemption only according to the approved scheme; reversal is recorded rather than erasing history.
- Loyalty failure after order completion does not reverse fulfillment. It produces a recoverable pending adjustment with reconciliation and no duplicate effect on retry.
- Behavior for insufficient value after reversal, partial refunds, stacking, zero-total orders, and expiry during checkout is specified before testing.

**Decision dependency:** D-07 and D-13. No point rate, coupon denomination, or validity period is assumed.

### REQ-NTF-001 — Transactional notifications

**Priority:** Must. **Story:** As a customer, I want relevant updates without having to keep the app open.

- Proposed triggers are store acceptance/rejection, ready for pickup, cancellation, and material refund outcome; final channels and triggers are approved in D-17.
- Notification is based on a committed event and avoids duplicate user-visible sends for the same event where channel behavior permits.
- Denied permission, missing token, or provider failure does not block order or reward processing.
- Notification opening authenticates as needed and retrieves current authorized order state.
- Message content avoids unnecessary personal/payment data. Outdated notifications cannot revert displayed order state.
- Failed delivery is observable and retried within an approved policy; repeated failure does not retry indefinitely.

### REQ-OPS-001 — Store order queue and fulfillment

**Priority:** Must. **Story:** As staff, I want an accurate queue so that I can process pickup orders.

- Queue contains only assigned-store orders and distinguishes payment eligibility from fulfillment status.
- Orders not eligible under the approved payment policy cannot be accepted for preparation.
- Staff can inspect item options, quantities, contact information needed for fulfillment, and permitted actions.
- Accept, reject, prepare, mark ready, and complete actions obey current state and role checks.
- Concurrent staff updates do not overwrite a newer decision; conflicting actions return current state.
- Queue reconnect/refresh recovers missed orders without duplicate fulfillment.
- Operational escalation identifies orders awaiting action beyond the approved threshold.

### REQ-OPS-002 — Availability and ordering pause

**Priority:** Must. **Story:** As a store manager, I want to stop unavailable items or new orders from being purchased.

- Authorized changes apply to the correct store and are traceable to an actor or authoritative integration.
- Checkout revalidates changed availability even when customer browsing data is stale.
- Pausing new orders does not silently cancel existing orders; existing commitments remain visible for resolution.
- Staff see whether an availability update succeeded or failed.
- The source of truth and any synchronization delay are defined before integration acceptance.

### REQ-SUP-001 — Support, reconciliation, and audit

**Priority:** Must. **Story:** As an authorized operator, I want to locate and resolve transaction exceptions.

- Search supports approved identifiers such as order reference and provider reference within access scope.
- View distinguishes order state, payment attempts/outcomes, refund state, and loyalty adjustments.
- Payment/order mismatches, prolonged pending transactions, and failed adjustments enter a reviewable exception workflow.
- Reconciliation uses authoritative provider evidence and does not depend on customer screenshots.
- Sensitive actions record actor/system, time, reason, affected record, and relevant before/after state without recording secrets.
- Retrying resolution is safe; unresolved cases retain ownership and status.
- Customer-facing resolution is communicated through the approved support process.

## 6. Business Rules Register

| ID | Draft rule | Linked requirements |
|---|---|---|
| BR-01 | One store per cart and order; change of store requires deliberate confirmation | STR-001, CART-001 |
| BR-02 | Store, product, option, price, and eligibility validation is authoritative at checkout | MNU-002, PRICE-001, CHK-001 |
| BR-03 | Customer must accept any changed payable quote before a charge is initiated | PRICE-001, PAY-001 |
| BR-04 | One checkout intent produces at most one order and one intended successful collection of its payable amount | CHK-001, PAY-001 |
| BR-05 | Unknown payment is pending investigation, not proof of failure | PAY-002 |
| BR-06 | Fulfillment eligibility is derived from trusted payment outcome and approved payment policy | PAY-001, OPS-001 |
| BR-07 | Paid but nonfulfillable orders require a traceable financial resolution | PAY-002, ORD-004 |
| BR-08 | Completion means collected; readiness alone does not imply collection | ORD-002 |
| BR-09 | Historical purchase and financial records preserve the transaction snapshot | ORD-001, SUP-001 |
| BR-10 | Rewards are never earned, consumed, or reversed twice for one business event | LOY-002 |
| BR-11 | Operational access is limited by role and store; customer access is limited by ownership | All protected requirements |
| BR-12 | Notifications report committed outcomes; delivery failure does not undo business transactions | NTF-001 |
| BR-13 | Cancellation, refund, and no-show behavior requires an explicit approved policy | ORD-004 |

Abbreviated references above carry the `REQ-` prefix.

## 7. Proposed State Models

These are product-level labels, not database enums or existing system mappings. The SDD must define authoritative transitions, concurrency, and provider-state mapping. Order, payment, and refund are separate dimensions.

### 7.1 Fulfillment

| Current state | Permitted next state | Guard / actor |
|---|---|---|
| Submitted | Accepted | Authorized staff; payment eligibility satisfied |
| Submitted | Rejected | Authorized staff; reason recorded |
| Submitted | Canceled | Approved cancellation/expiry policy; any financial outcome reconciled |
| Accepted | Preparing | Authorized staff |
| Accepted | Canceled | Only if approved cancellation policy permits it |
| Preparing | Ready for pickup | Authorized staff |
| Ready for pickup | Completed | Authorized collection confirmation |
| Completed / Rejected / Canceled | None in normal fulfillment | Financial and support adjustments remain separate |

Post-preparation exceptions and no-shows require D-08; no automatic completion or cancellation is assumed. Payment pending can coexist with Submitted. Store acceptance is blocked until payment eligibility is established. A later payment success must not reopen a terminal order.

### 7.2 Payment and refund

| Dimension | Product states | Required behavior |
|---|---|---|
| Payment attempt | Not initiated, pending, succeeded, failed | Timeout preserves uncertainty; verified evidence resolves the outcome |
| Authorization | Provider-dependent; TBD | Only add authorization/capture distinctions if the selected provider uses them |
| Refund | None, requested, pending, succeeded, failed | Refund state does not replace fulfillment state; retry does not duplicate money movement |
| Financial totals | Collected, refunded, remaining refundable | Amounts remain consistent even if multiple permitted adjustments occur |

The payment record must retain attempt history. A new failed attempt cannot overwrite evidence of an earlier successful collection.

## 8. Screen and Content Requirements

| Surface | Required content | Required alternate states |
|---|---|---|
| Account | Identity fields, verification/recovery actions | Invalid, expired, rate limited, session expired |
| Store selection | Store identity, address, ordering eligibility | None available, closed, permission denied, load failed |
| Home / menu | Store context, categories, products, price context | Loading, empty, stale content, unavailable |
| Product details | Description, options, price, quantity | Missing required option, unavailable option, load failed |
| Cart | Configured lines, totals, store | Empty, changed price, unavailable item, invalid quantity |
| Checkout | Current quote, contact, pickup, payment | Authentication needed, expired quote, blocked store, submitting |
| Payment result | Reference and verified/pending outcome | Failed, unknown, late outcome, recoverable retry |
| Order confirmation / tracking | Separate payment and fulfillment states, pickup details | Refresh failed, rejected, canceled, refund pending |
| History | Own orders with stable pagination | Empty, loading, error |
| Rewards | Benefits, eligibility, expiry, history | None available, reserved, expired, service unavailable |
| Staff queue | Assigned-store orders and allowed actions | Empty, reconnecting, conflict, payment ineligible |

Copy must explain the next useful action. Generic errors should include a support reference where applicable without exposing stack traces, secrets, or provider internals. Actual layout and accessibility review belong in `03-ux-ui-specification.md`.

## 9. Data and Integration Requirements

| Domain | Required information / contract | Ownership decision |
|---|---|---|
| Identity | Member identifier, verified contact, session and role scope | D-04 |
| Store | Address, time zone, hours, pause/eligibility state | D-06 |
| Catalog | Product/option identifiers, availability, authoritative pricing | D-06 |
| Order | Intent/reference, owner, store, item snapshot, quote, state history | Application or agreed order system; D-06 |
| Payment | Intent/order association, provider reference, amount/currency, attempt outcome | Provider authoritative for financial outcome; D-05 |
| Refund | Original payment association, amount, reason, status, actor | D-05 / D-08 |
| Loyalty | Member ledger/benefit, reservations, event references, rule version | D-07 |
| Notification | Business event reference, destination/channel, delivery outcome | D-17 |
| Audit | Actor, event time, target, reason, transition/correlation | D-15 |

Integration acceptance requires sandbox access or a faithful agreed test environment, failure behavior, timeout/retry contract, reconciliation capability, and a named owner. Provider unavailability must produce explicit pending/unavailable behavior, never fabricated success. No particular POS, database, payment provider, or technology stack is assumed.

## 10. Nonfunctional Requirements

Numeric values below are deliberately approval gates rather than invented commitments. Owners must populate and approve them before release testing; a blank target is not a pass.

| ID | Requirement | Acceptance evidence / target |
|---|---|---|
| NFR-01 | Protected operations enforce authentication, role/store scope, and ownership | Cross-account/store and expired-session tests fail safely; QA evidence required |
| NFR-02 | Sensitive data is protected in transit/storage as appropriate and absent from logs/analytics | Technical security review and representative payload/log inspection; design in SDD |
| NFR-03 | Authentication and abuse-sensitive actions have rate/attempt controls | Agreed thresholds in D-14 and boundary tests |
| NFR-04 | Critical APIs and screens meet latency goals at agreed demand | p95 menu, quote, submission acknowledgement, and status latency targets TBD; separate provider wait time |
| NFR-05 | Capacity supports expected launch traffic | Concurrent users/orders per minute, test duration, and dataset scale TBD in D-11 |
| NFR-06 | Critical journey availability is measurable | Availability target and measurement window TBD; synthetic/server evidence agreed |
| NFR-07 | Confirmed orders and financial events survive defined failure scenarios | Recovery tests, durable traceability, and approved RPO/RTO in D-14 |
| NFR-08 | Core controls support accessible interaction | Labels, focus, contrast, text scaling and assistive-technology checks on the approved platform; exact conformance target TBD |
| NFR-09 | Supported devices and languages behave consistently | Approved device/OS/browser matrix and locale/currency/date tests in D-03/D-09 |
| NFR-10 | Failures and transaction states are observable | Correlated order/payment logs, actionable alerts, exception queue, named responders |
| NFR-11 | Personal data has defined retention and deletion behavior | Approved data schedule and demonstrated request workflow in D-15 |
| NFR-12 | Catalog/quote/order status freshness is explicit | Maximum sync/refresh intervals and quote lifetime approved in D-13/D-16; stale-state tests |

## 11. Analytics and Success Measures

Analytics must not carry raw contact details, payment credentials, or authentication tokens. Use approved pseudonymous identifiers and deduplicate retry-generated events. Server transaction records are authoritative for financial and completion measures.

| Event | Trigger | Minimum useful properties |
|---|---|---|
| store_selected | Store selection committed | Store ID, session ID, timestamp |
| product_viewed | Product detail displayed | Product/store ID, session ID |
| cart_item_added | Valid item added | Product/store ID, quantity; no free-text personal data |
| checkout_started | Customer enters checkout with nonempty cart | Session ID, store ID, timestamp |
| quote_confirmed | Customer accepts current quote | Quote ID, currency, payable total |
| order_submitted | Durable order created | Order/intent ID, store ID, timestamp |
| payment_resolved | Trusted outcome recorded | Order ID, outcome, amount/currency, attempt reference |
| order_state_changed | Committed fulfillment transition | Order ID, old/new state, timestamp |
| reward_adjusted | Ledger/benefit effect committed | Event/order reference, effect type, rule version |
| checkout_blocked | Validation prevents progress | Non-sensitive reason category and stage |

| Measure | Definition | Target / owner |
|---|---|---|
| Checkout completion | Checkout-started sessions with an eligible confirmed order divided by checkout-started sessions; define confirmed and attribution window before reporting | TBD / Product Owner |
| Submission reliability | Valid intent submissions obtaining a durable acknowledgement within agreed time, deduplicated by intent | TBD / Technical Lead |
| Payment success | Verified successful eligible payment attempts divided by eligible attempts; report pending separately | TBD / Finance |
| Duplicate incidents | Unintended duplicate orders/collections for one intent | Zero unresolved known duplicate defects at release / QA |
| Store response | Median/p95 submission-to-acceptance time; unaccepted/rejected orders separately reported | TBD / Store Operations |
| Repeat ordering | Customers with a second completed order within agreed time of first completion | TBD / Product Owner |
| Reward correctness | Incorrect/missing/duplicate adjustments divided by eligible events | TBD / Loyalty Owner |

Exclude test traffic; agree business time zone, cohort windows, late-event handling, and dashboard ownership before pilot reporting.

## 12. QA / UAT Acceptance Matrix

This matrix specifies required scenario coverage, not executed results. The test plan will expand steps, fixtures, environments, and evidence.

| Scenario | Expected result | Requirements |
|---|---|---|
| Valid pickup order through collection | Correct items, one payment, valid transitions, eligible reward once | CHK-001, PAY-001, ORD-002, LOY-002 |
| Missing modifier or invalid quantity | Submission rejected; cart can be corrected | MNU-002, CART-001 |
| Price changes during checkout | Revised total requires explicit confirmation | PRICE-001 |
| Store pauses while cart is open | New submission blocked; existing orders retained | STR-001, OPS-002 |
| Repeated submit / lost response | Same intent recovers one order and financial outcome | CHK-001 |
| Same intent with different payload | Conflict; no mutation or additional collection | CHK-001 |
| Provider timeout then success | Pending resolves safely with no second charge | PAY-002 |
| Duplicate / reordered provider events | One consistent outcome; no repeated effects | PAY-001 |
| Late payment after cancellation | No reopened fulfillment; financial exception resolved | PAY-002, ORD-004 |
| Two staff update the same order | One valid transition; stale action receives conflict | OPS-001 |
| Cancel races with acceptance | Policy enforced against authoritative state | ORD-004 |
| Refund fails then is retried | Pending/failure visible; no duplicate refund | ORD-004, SUP-001 |
| Two checkouts redeem one benefit | Benefit cannot be overspent | LOY-002 |
| Loyalty unavailable at completion | Order remains complete; adjustment recovers once | LOY-002 |
| Notification denied or fails | Tracking remains usable and business action completes | NTF-001 |
| Change customer/store identifiers | Unauthorized access denied | ACC-002, OPS-001, NFR-01 |
| Restart app during pending payment | Existing outcome recovered after required authentication | PAY-002 |
| Retention/deletion request with active order | Approved policy followed; no false erasure claim | ACC-002, NFR-11 |
| Restore/recovery rehearsal | Agreed recovery objectives met and reconciled | NFR-07 |

## 13. Dependencies and Release Gates

### Before affected implementation is accepted

- Approve payment flow, capture timing, and provider outcome mapping.
- Approve reward examples covering earning, redemption, expiry, refund, and concurrency.
- Confirm store/menu source of truth and staff-system responsibility.
- Resolve money calculation, order exception, identity, and retention policies.
- Approve device/language support and quantitative performance/operations targets.

### Before production pilot

- Must requirements have passed linked QA/UAT evidence.
- No release-blocking defects remain; accepted residual risks have named owners.
- Order/payment/reward reconciliation and support escalation are operational.
- Migration, backup, restore, rollback, and production smoke procedures are verified.
- Monitoring, alert responders, staff training, and customer support are ready.
- Product, engineering, finance where applicable, and operations record go/no-go.

### Pilot rollout and rollback

Start with an approved limited store/customer cohort. Observe transaction consistency, staff response, support incidents, and agreed service targets before expansion. Cohort size, observation period, rollback thresholds, and decision owner must be recorded in the delivery/release plan.

If new ordering is paused or application code is rolled back, continue resolving existing orders, pending payments, refunds, and reward adjustments. A rollback must not abandon financial obligations or delete transaction evidence.

## 14. Open Decision Register

D-01 through D-12 align with the project brief. Added decisions make the PRD's acceptance gates explicit.

| ID | Decision | Proposed baseline / unresolved detail | Owner | Needed before |
|---|---|---|---|---|
| D-01 | Brand/name | Working title only | Sponsor / Product | Publication |
| D-02 | Launch service/stores | Pickup-first pilot; cohort TBD | Product / Operations | Scope sign-off |
| D-03 | Platforms | Web/mobile, device matrix, accessibility target TBD | Product / Engineering | UX/API finalization |
| D-04 | Identity/guest policy | Guest browsing proposed; checkout and verification TBD | Product / Engineering | Account implementation |
| D-05 | Payment | One method; provider, capture timing, retry and resolution rules TBD | Finance / Engineering | Payment acceptance |
| D-06 | POS/catalog/staff systems | Authoritative sources and integration ownership TBD | Operations / Engineering | SDD approval |
| D-07 | Loyalty rules | One scheme; rates, limits, expiry, reversals and trigger TBD | Loyalty / Product | Loyalty acceptance |
| D-08 | Order exceptions | Cancellation window, rejection, refunds, partial refunds, no-show, collection verification TBD | Operations / Finance | Order acceptance |
| D-09 | Locale and monetary rules | Languages, currency, tax treatment, precision/rounding TBD | Product / Finance | Quote acceptance |
| D-10 | Capacity and funding | Team, budget, timeline TBD | Sponsor / Delivery | Delivery commitment |
| D-11 | Success/service targets | Traffic, latency, availability, pilot metrics TBD | Product / Engineering / Operations | Performance testing |
| D-12 | Support | Hours, escalation, staff response thresholds TBD | Support / Operations | Pilot |
| D-13 | Quote and eligibility | Quote lifetime, stacking, zero totals, benefit expiry/reservation behavior TBD | Product / Finance / Loyalty | Checkout acceptance |
| D-14 | Recovery and controls | RPO/RTO, retry ceilings, abuse limits, pending escalation thresholds TBD | Engineering / Operations | Resilience testing |
| D-15 | Personal data | Fields, consent where applicable, retention/deletion policy and ownership TBD | Product / accountable privacy owner | Account acceptance |
| D-16 | Persistence/freshness | Cart persistence, menu sync, status refresh, offline behavior TBD | Product / Engineering | Client acceptance |
| D-17 | Notifications | Channels, triggers, templates, preferences, retry policy TBD | Product / Operations | Notification acceptance |

Unresolved decisions cannot be silently replaced with developer assumptions. Record the chosen rule and examples, update affected criteria, and link the decision to Jira before treating the feature as accepted.

## 15. Traceability and Documentation Handoff

| Epic | Requirement IDs | Downstream artifacts |
|---|---|---|
| E01 | REQ-ACC-001–002 | Identity design, account API, privacy workflow |
| E02 | REQ-STR-001, REQ-MNU-001–002 | Store/menu contracts, UX states |
| E03 | REQ-CART-001, REQ-PRICE-001 | Quote design, pricing examples, cart UX |
| E04 | REQ-CHK-001, REQ-PAY-001–002 | Transaction design, provider contract, reconciliation |
| E05 | REQ-ORD-001–004 | Order state specification, support rules |
| E06 | REQ-LOY-001–002 | Ledger/benefit specification, rule examples |
| E07 | REQ-NTF-001 | Event mapping and templates |
| E08 | REQ-OPS-001–002 | Staff-system contracts and role matrix |
| E09 | REQ-SUP-001 | Runbook, refund/reconciliation procedures |
| E10 | Section 11 | Event dictionary and metric definitions |

Each Jira story must include its requirement ID, relevant criteria, decision dependencies, and test evidence. Merge requests link to Jira. QA cases reference requirement IDs. Release evidence identifies the tested version. E11 search remains optional and needs its own approved criteria if selected.

Planned companion files: `03-ux-ui-specification.md`, `04-sdd.md`, `05-database-specification.md`, `06-api-specification.yaml`, `07-delivery-plan.md`, `11-test-plan.md`, `12-uat-and-sign-off.md`, `13-deployment-and-rollback.md`, and `15-operations-runbook.md`. These references do not imply those files already exist.

## 16. Approval and Change History

| Review | Owner | Status | Date |
|---|---|---|---|
| Product scope and acceptance criteria | Product Owner — TBD | Pending | — |
| Store workflows and exceptions | Operations Lead — TBD | Pending | — |
| Payment, refund, and monetary rules | Finance Owner — TBD | Pending | — |
| Reward policy | Loyalty Owner — TBD | Pending | — |
| Technical feasibility and quality targets | Technical Lead — TBD | Pending | — |
| Testability and UAT coverage | QA Owner — TBD | Pending | — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial proposed MVP PRD derived from project brief v1.0; includes acceptance criteria, exception handling, and explicit policy gates |

Scope or rule changes require impact assessment on UX, APIs, data, operations, estimates, and tests. This draft is complete as a review document; production readiness and policy approval remain separate decisions.
