---
title: "03 — UX/UI Specification"
---

# 03 — UX/UI Specification

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | UX-001 |
| Version / status | 1.0 / Draft for stakeholder and design review |
| Created / updated | 2026-09-11 |
| Product owner / design owner | TBD / TBD |
| Sources | `01-project-brief.md` v1.0; `02-prd.md` v1.0 |
| Scope | Customer pickup journey and essential staff/support surfaces |
| Design file / approved prototype | Not supplied; link and version TBD |
| Platform | TBD under PRD D-03; mobile-first layout proposed |

> This is a proposed interaction and visual specification based on the project brief and PRD already drafted in this conversation. The original images/Figma files have not been inspected for this document. Layouts, tokens, navigation, and example copy below are proposals, not a reconstruction of those designs. Policy-dependent behavior remains gated by the PRD decision register. This document does not assert design approval, accessibility conformance, or executed usability tests.

## 1. Purpose and Design Principles

Specify what users see, what they can do, how the interface responds, and how they recover across the complete pickup journey. The specification supports design production, frontend implementation, API handoff, and QA. It does not select a technology stack or replace API/state contracts.

- Keep the selected store, configured items, total, and next action clear.
- Show payment and preparation as separate facts.
- Require deliberate confirmation when a price or purchase intent changes.
- Preserve recoverable work through authentication, interruption, and network loss.
- Use authoritative outcomes for success messages and transaction statuses.
- Make loading, empty, stale, invalid, failed, and unauthorized states distinguishable.
- Support accessible controls, readable text, and localization from the start.
- Keep customer-facing language focused on the purchase, not internal implementation.

## 2. Scope, Assumptions, and Decisions

### 2.1 Included

Store selection; Home/menu; product configuration; cart; pickup checkout; payment return/recovery; confirmation; tracking; history; rewards; registration/login/recovery; profile/deletion request; transactional notification entry points; and staff order/availability/support workflows.

### 2.2 Excluded

Delivery maps and drivers, multi-store carts, scheduled/recurring orders, subscriptions, missions/referrals, reward sharing, multiple payment providers, AI recommendations, and full ERP/inventory tooling. Search is a PRD Should feature and remains conditional. No new admin portal is mandated: existing staff software may implement the specified capabilities.

### 2.3 Design assumptions

| Topic | Proposed treatment | Approval dependency |
|---|---|---|
| Customer navigation | Home, Orders, Rewards, Account; cart available from Home/product views | UX review / D-03 |
| Store scope | One store per cart; manual selection always available | PRD BR-01 / D-02 |
| Browsing | Visitor can browse; protected destinations prompt sign-in | D-04 |
| Checkout identity | Preserve cart through sign-in; do not assume guest checkout | D-04 |
| Payment | One approved method; pending state supported | D-05 |
| Rewards | Scheme-neutral benefit cards; do not invent rates/expiry | D-07 |
| Look and feel | Warm neutral surfaces, dark text, coffee-brown action color | Brand approval / D-01 |
| Languages | English examples; locale-ready layouts; Khmer only if approved | D-09 |
| Staff UI | Wider layouts for queues with compact-screen fallback | D-03 / D-06 |

Policy decisions in the PRD govern behavior. If a layout proposal conflicts with an approved policy, update this specification and the prototype together.

## 3. Information Architecture and Navigation

### 3.1 Customer destinations

| ID | Screen / surface | Entry points | Main exit/action |
|---|---|---|---|
| C01 | Store selection | First browse, store selector | Select store → Home |
| C02 | Home / menu | App start, Home tab | Open product / cart |
| C03 | Product details | Product card | Add to cart / save item changes |
| C04 | Cart | Cart action | Continue to checkout |
| C05 | Checkout | Nonempty valid cart | Confirm payable quote / initiate approved payment |
| C06 | Payment result / recovery | Payment return, unresolved intent | Retrieve result / view order |
| C07 | Order confirmation | Durable order created | Track order |
| C08 | Order details / tracking | Confirmation, history, notification | Follow progress / permitted cancellation / support |
| C09 | Order history | Orders tab | Open owned order |
| C10 | Rewards overview / detail / history | Rewards tab, checkout benefit selector | Inspect terms / select eligible benefit |
| C11 | Sign-in and registration | Account, protected action | Resume intended destination |
| C12 | Verification / recovery | Account flow | Finish verified access |
| C13 | Account / profile | Account tab | Edit details / preferences / logout |
| C14 | Account deletion request | Account settings | Confirm request / see acknowledgement |
| C15 | Shared dialogs and status surfaces | Relevant screen | Resolve specific interruption |

### 3.2 Staff and support destinations

| ID | Surface | Main purpose |
|---|---|---|
| S01 | Store order queue | Locate and prioritize assigned-store orders |
| S02 | Staff order details | Inspect items and make permitted state transitions |
| S03 | Availability / ordering pause | Control new ordering within authorized store scope |
| S04 | Support and financial exceptions | Inspect transaction history and coordinate resolution |

### 3.3 Navigation rules

1. Keep selected primary destination visible through an icon and text label; color alone is insufficient.
2. Back returns to the prior meaningful view, preserving menu scroll and recoverable edits where possible.
3. Entering an external payment flow does not turn a later Back action into cancellation or payment failure.
4. Authentication stores a safe internal return destination. After sign-in, refresh authorization and data before resuming; do not auto-submit a purchase.
5. Notification/deep-link entry opens only authorized current data. If an order is inaccessible, show a neutral unavailable message and a route to Orders.
6. On app restart, unresolved purchases remain discoverable through order history or a resume banner. Never recreate payment from a navigation event.
7. Checkout and item-edit screens may hide primary navigation to reduce accidental departure, but retain a clear Back action.
8. Dialog dismissal returns focus to the invoking control. Navigation away does not erase durable order/payment records.

## 4. Layout and Visual Foundations — Proposed

These values are design starting points, not approved brand assets or external compliance claims. CSS pixels are used for web proposals; native implementations should use equivalent logical units and platform conventions.

### 4.1 Responsive layout

| Width | Customer layout | Staff layout |
|---|---|---|
| Under 600 px | Single column; 16 px page inset; bottom primary navigation; bottom CTA with safe-area padding | Stacked order cards and full-screen detail |
| 600–1023 px | 24 px inset; menu grid where card width allows; forms constrained to readable width | Queue with detail as separate view or sufficient-width split pane |
| 1024 px and above | Centered content up to 1200 px; 32 px inset; menu/detail and summary columns where useful | Queue/detail split; filter controls wrap without hiding actions |

- At narrow widths and enlarged text, stack columns before content clips.
- Bottom navigation, sticky CTA, keyboard, and system safe areas must not overlap content or focused fields.
- Reserve bottom content padding equal to fixed controls plus safe area.
- Never require horizontal scrolling for customer forms or totals. Wide staff data may use an explicitly scrollable region with labels retained.
- Keep payment amounts and primary actions readable with long localized text.

### 4.2 Proposed semantic tokens

| Token | Proposed value | Usage |
|---|---|---|
| `color.background` | `#FAF7F2` | Main canvas |
| `color.surface` | `#FFFFFF` | Cards/forms |
| `color.text.primary` | `#241C17` | Main text |
| `color.text.secondary` | `#62554B` | Supporting text |
| `color.action.primary` | `#5A3524` | Primary action background |
| `color.action.onPrimary` | `#FFFFFF` | Primary action text |
| `color.border.decorative` | `#D8CFC7` | Decorative separators; not sole control boundary |
| `color.border.control` | `#817267` | Input/control boundary candidate |
| `color.status.success` | `#25633D` | Success icon/text with label |
| `color.status.warning` | `#805400` | Pending/warning icon/text with label |
| `color.status.error` | `#A62323` | Error icon/text with label |
| `color.focus` | `#1F5DA8` | Visible focus outline candidate |
| `radius.control / card` | 8 px / 12 px | Controls and cards |
| `space.scale` | 4, 8, 12, 16, 24, 32, 48 px | Consistent spacing |

Validate every actual foreground/background pair, including hover, focus, disabled, and status treatments, before approval. Token selection alone does not establish accessibility.

### 4.3 Typography and imagery

- Proposed type scale: 28/36 px page title, 22/30 px section title, 18/26 px item title, 16/24 px body, 14/20 px supporting text. Allow user scaling and content-driven height.
- Use an approved font family with complete glyph coverage for selected languages. If Khmer is selected, verify shaping, line height, combining marks, and mixed-script amounts on target devices.
- Use regular/medium/bold consistently; avoid placeholder-only form labels and text baked into images.
- Product images use a consistent aspect ratio, reserved space during load, and a neutral fallback. Do not use imagery as the only product identifier.
- Promotional banners need an accessible text equivalent and no essential policy hidden only in artwork.
- Avoid automatic motion that distracts from transaction outcomes. Reduced-motion preference removes nonessential transitions.

## 5. Shared Components and States

| Component | Anatomy | Behavior and required states |
|---|---|---|
| Primary button | Verb label; optional amount | Default, pressed, focus, unavailable, submitting; stable width; one active submit at a time |
| Secondary/text action | Descriptive label | Clear focus; does not compete with primary purchase action |
| Text field | Persistent label, input, hint/error | Untouched, editing, valid, invalid, unavailable; preserve valid input on failed submission |
| Option group | Label, required/min/max text, choices | Radio for one choice, checkbox for multiple; selected and unavailable explained |
| Quantity control | Decrease, value, increase | Named buttons; boundaries enforced; removal explicit at minimum |
| Product card | Image, name, price context, availability | One unambiguous activation; unavailable state labeled |
| Cart line | Product/options, quantity, amount, edit/remove | Long options wrap; independent items remain distinguishable |
| Order card | Reference, store, date, amount, two state dimensions | Whole-card detail entry with clear accessible name |
| Status badge | Text plus optional icon | Color supplements words; “Payment pending” distinct from “Preparing” |
| Total summary | Items, reductions, tax treatment, fees, payable | Currency visible; included tax does not add twice |
| Banner | Message, optional action | Persistent for unresolved problems; does not obscure form controls |
| Snackbar | Short feedback | Noncritical feedback only; financial outcomes remain in persistent view |
| Dialog / bottom sheet | Title, explanation, actions | Focus containment, accessible name, cancel path, scrollable body; no accidental financial action |
| Skeleton | Reserved layout blocks | Only during initial loading; stop after response/error; no endless shimmer |
| Empty state | Plain explanation and useful action | Distinguish no data from failed data retrieval |
| Pagination/load more | Position/progress and action | Stable order; retained selection; retry without duplicate rows |

Unavailable actions must have a nearby reason when it is not obvious. To help users fix a form, a primary CTA may validate on activation and focus the first error; do not leave users with an unexplained disabled button.

## 6. Customer Screen Specifications

### C01 — Store Selection

**Requirements:** REQ-STR-001. **Goal:** Choose a valid pickup location.

**Layout:** Title and short instruction; optional location action; store list with name, address, hours/ordering state; selected-store indicator. Search/filter only if approved.

**Interaction:** Selecting an eligible store loads its Home/menu. Closed stores may be inspected but cannot enable checkout. Denied location permission leaves manual selection fully usable. Reopening selection shows the current store.

**Nonempty cart change:** Show “Change pickup store?” with an explanation that the current cart will be cleared under the proposed one-store behavior. Actions: “Keep current store” and “Change store and clear cart.” Cancel preserves cart and store; confirm changes both together. Do not silently carry incompatible items.

**States:** Loading; no stores; all stores unavailable; network failure with Retry; location denied; selected store removed/ineligible. Preserve the previous selected store if the new selection cannot be committed.

**Acceptance:** User can select without location access; store context appears downstream; abandoning the change dialog leaves the cart untouched.

### C02 — Home / Menu

**Requirements:** REQ-MNU-001, REQ-STR-001. **Goal:** Discover the selected store's products.

**Layout order:** Store selector; ordering-state banner if needed; approved promotional content; categories; product cards; cart access with item count; primary navigation.

**Interaction:** Category selection changes the visible group and retains understandable position. Product opens C03. Cart returns C04. Promotions lead only to approved destinations and cannot grant discounts locally.

**States:** Skeleton; empty category; no menu; partial image failure; menu unavailable; cached menu with stale indication where relevant; store paused. Retry refreshes data without returning the user to the top unnecessarily.

**Acceptance:** Prices identify “From” where options change them; unavailable items are labeled; cart remains reachable; stale content cannot bypass checkout validation.

### C03 — Product Details / Edit Cart Item

**Requirements:** REQ-MNU-002, REQ-CART-001. **Goal:** Configure a valid item.

**Layout order:** Back/title; product image; name/description; base price context; size/options grouped with constraints; quantity; line price; sticky primary action.

**Actions:** New item: “Add to cart · {amount}”. Existing line: “Save changes · {amount}”. Both use the selected currency format. Missing required choices produces inline guidance and moves focus/scroll to the first affected group. Option selection updates the displayed price, subject to checkout revalidation.

**Back behavior:** If editing an existing item with unsaved changes, offer “Discard changes” or “Keep editing.” Do not modify the cart until Save succeeds. Adding an item gives concise feedback and leaves clear choices to continue browsing or view cart; no automatic checkout.

**States:** Product loading/not found; unavailable option; product sold out after open; invalid quantity; submission error. Preserve selections after retryable error where still valid. Do not imply absent allergen data means allergen-free.

**Acceptance:** All required options are explained; configured lines remain distinct; unavailable selections cannot be submitted; successful save changes only the intended line.

### C04 — Cart

**Requirements:** REQ-CART-001, REQ-PRICE-001. **Goal:** Review a single-store purchase.

**Layout:** Store summary; editable item lines; relevant validation banners; subtotal/estimated adjustments; “Continue to checkout”; route to continue browsing. Label estimates when quote is not final.

**Interactions:** Edit opens C03 in edit mode. Remove deletes the selected line; optional Undo is allowed only if it safely restores the same item and does not submit anything. Quantity changes update totals. Last removal presents an empty state with “Browse menu.”

**Validation:** Highlight changed/unavailable items individually. Provide Edit/Remove; do not silently replace products or remove a customer's choice. Checkout is blocked until required issues are resolved.

**Persistence:** Restore recoverable cart per D-16; clear stale personal information on account change. Never merge another account's private cart silently. Authentication-related cart reconciliation requires user-visible conflict handling if necessary.

**Acceptance:** All options and line amounts are inspectable; empty cart cannot purchase; reopening cart does not duplicate items.

### C05 — Pickup Checkout

**Requirements:** REQ-PRICE-001, REQ-CHK-001, REQ-LOY-002. **Goal:** Confirm an accurate quote and pickup details.

**Layout order:** Store/address; configured order summary; required contact fields; pickup expectations; eligible reward selector; payment method; full monetary summary; final action. No delivery-address controls in this pickup-first scope.

**Primary action:** Use the actual approved flow: “Continue to payment · {amount}” for provider handoff or “Pay {amount}” only when this activation initiates that charge. Zero-total orders use an approved nonpayment action; do not display a fake charge.

**Review rules:** Store, currency, total, and selected benefit are visible before commitment. If the server changes the quote, show old/new relevant values and “Review updated total”; require fresh explicit confirmation. Do not automatically charge after closing a warning.

**Submit state:** Change label to a clear progress message, prevent duplicate local activation, and retain the checkout view or transition to a persistent recovery screen. Local button disabling is only a UX measure; backend idempotency remains required.

**States:** Sign-in needed; contact invalid; quote loading/expired; store paused; item changed; benefit unavailable; submitting; lost response. Unknown submission routes to recovery, not an empty cart or an immediate new-pay action.

**Acceptance:** No unreviewed price is charged; failed validation preserves input; a lost response can recover the same purchase.

### C06 — Payment Result / Recovery

**Requirements:** REQ-PAY-001–002. **Goal:** Explain the authoritative financial outcome.

| State | Main message | Actions |
|---|---|---|
| Checking / pending | “We’re checking your payment. Please don’t pay again yet.” | Check status; view order if available; support |
| Verified success | “Payment received.” with amount/reference | View order; tracking reflects separate fulfillment status |
| Definitive failure | “Payment was not completed.” | Approved retry after authoritative eligibility check; return to cart |
| Returned without result | Same pending recovery treatment | Check status; support |
| Late success, order cannot proceed | “Payment received. Your order needs attention.” | View resolution/refund status; support |
| Status service unavailable | “We can’t check your payment right now.” | Retry status; retain reference; support |

Do not use celebratory order-ready visuals for payment success alone. Do not infer failure from provider-window dismissal or a local timer. A visible refresh indicator shows work without trapping the user indefinitely. Escalation timing is D-14, not a hardcoded promise.

**Acceptance:** Restart and deep-link return recover the same record; all pending states avoid a second independent charge; no client callback alone displays verified success.

### C07 — Order Confirmation

**Requirements:** REQ-ORD-001. **Goal:** Confirm the durable order and next step.

**Layout:** Truthful heading based on current state; order reference; payment status; fulfillment status; store/address; item and amount summary; “Track order.”

Use “Order submitted” when the store has not accepted. If payment is unresolved, link to C06 and say so. Do not show “Order confirmed” in a way that implies store acceptance when only record creation succeeded.

**Acceptance:** Confirmation persists through revisits; catalog changes do not rewrite the purchase snapshot; reference can be copied with accessible feedback where platform support permits.

### C08 — Order Details / Tracking

**Requirements:** REQ-ORD-001–004. **Goal:** Follow progress and resolve exceptions.

**Layout:** Order reference; prominent fulfillment label; separate payment/refund information; preparation timeline; last-updated or stale indication; pickup location/details; itemized purchase; permitted cancellation/support actions.

**Timeline:** Submitted → Accepted → Preparing → Ready for pickup → Completed. Rejected/Canceled replace the active progress narrative with a reason and resolution; do not render them as successfully completing the normal timeline. Refund is a separate panel.

**Cancellation:** Show action only when eligibility allows; server rechecks. Confirmation explains the actual approved financial implications. While processing show “Requesting cancellation.” If state changed, refresh and explain why cancellation is unavailable. Never optimistically show Canceled.

**Collection:** Customer sees pickup instructions approved in D-08. A customer “I collected it” button is not assumed; authorized staff completion remains the PRD baseline.

**Acceptance:** Ready is not Completed; stale updates are labeled; unavailable refresh preserves the last known information; refund pending is not “Refunded.”

### C09 — Order History

**Requirements:** REQ-ORD-003. **Goal:** Find past and unresolved orders.

**Layout:** Title; order cards with reference, store, date, total/currency, fulfillment/payment labels; stable pagination. Filtering is optional until separately approved.

**States:** Sign-in prompt; loading; no orders with “Browse menu”; pagination error that retains existing entries; pending transactions clearly discoverable. New data does not reorder the selected item unexpectedly while the user is interacting.

**Acceptance:** Own records only; pending purchases are not omitted; opening and returning preserves useful position.

### C10 — Rewards Overview, Details, and Checkout Selection

**Requirements:** REQ-LOY-001–002. **Goal:** Understand available value and applicable terms.

**Overview:** Approved balance/benefit type, available and pending/reserved distinctions, benefits list, and history. If the scheme is points-based, show points; if coupon-based, show coupons. Do not mix invented schemes.

**Details:** Benefit title, value, eligibility, expiry/time zone where applicable, exclusions, and status. Checkout selector shows eligible choices plus clear reasons for unavailable choices; selection updates the quote and requires confirmation.

**History:** Adjustment type, effective time, amount/benefit, related order, and status. Reversal remains visible. A unavailable loyalty service shows “Rewards are temporarily unavailable,” never a fabricated zero.

**Race/recovery:** If a benefit is spent elsewhere or expires, explain that it can no longer be applied and show the revised quote. Do not replace it automatically or charge the revised amount without confirmation. Checkout abandonment follows the reservation-release policy and does not promise immediate restoration unless guaranteed.

**Acceptance:** Reserved value is not presented as free to spend; retry cannot visibly duplicate earnings; order completion remains complete if a loyalty adjustment is pending.

### C11 — Sign-in / Registration

**Requirements:** REQ-ACC-001. **Goal:** Access the right account and resume the intended task.

**Layout:** Title; persistent labels for approved identity fields; sign-in/register action; recovery link; brief privacy/terms entry points if required by policy. Do not assume phone, email, password, or OTP before D-04.

**Interaction:** Correct input types and autofill semantics; password visibility toggle if password authentication is chosen; validation after field interaction or submit, not aggressive errors before typing. Preserve nonsecret input after a failed attempt. Use neutral authentication errors.

**Return:** Resume cart/checkout or protected destination after authentication, refresh current data, and require explicit purchase confirmation. Never log in one user and display the previous user's cached orders/rewards.

### C12 — Verification / Recovery

**Requirements:** REQ-ACC-001. **Goal:** Prove identity through the approved channel.

Show destination in appropriately masked form, clear instructions, expiration/resend rules supplied by the server, and a route to correct the destination where permitted. If a code is used, allow paste/autofill and accessible entry without forcing one digit at a time.

**States:** Sending, sent/neutral acknowledgement, invalid, expired, rate limited, service failed, verified. Countdown is informational and cannot override server eligibility. Expired verification does not claim account creation or access success.

**Acceptance:** Recovery copy avoids unnecessary account enumeration; resending is bounded by policy; verified outcome returns to the correct next screen.

### C13 — Account / Profile / Preferences

**Requirements:** REQ-ACC-002, REQ-NTF-001. **Goal:** Manage personal settings.

Show editable approved fields, Save action, relevant notification preferences, logout, and deletion-request entry. Unverified sensitive identity changes remain pending rather than replacing the verified value prematurely.

On save failure keep entered values and explain retry. On logout remove private cached views and navigate to a visitor-safe destination. Notification permission denial links to platform settings only where appropriate; it never blocks ordering. No marketing opt-in is silently bundled into transactional updates.

### C14 — Account Deletion Request

**Requirements:** REQ-ACC-002. **Goal:** Submit a deliberate, understandable request.

Show policy-approved consequences for access, active orders, unsettled payments, rewards, retained records, and processing timing. Require explicit confirmation and authentication as defined by policy. Use “Request account deletion” if processing is asynchronous.

**States:** Review consequences; confirming; submitting; acknowledged with reference/next step; blocked by an approved policy condition; retryable failure. Do not state that all data has been erased on request submission.

### C15 — Shared Interruption Dialogs

| Trigger | Message intent | Required behavior |
|---|---|---|
| Unsaved item/profile edits | Explain loss of edits | Keep editing / discard; no destructive default |
| Store change with cart | Explain cart impact | Explicit clear-and-change action; cancel preserves state |
| Quote changed | Explain affected price/benefit and new total | Review and reconfirm; no automatic charge |
| Session expired | Explain need to sign in again | Preserve permitted work; resume after fresh validation |
| Protected resource unavailable | Neutral unavailable message | Return to safe list/home; no private metadata |
| Service interruption | Identify affected action | Retry/status/support appropriate to certainty |
| Cancellation/refund action | Describe approved consequences | Confirm only permitted action; wait for authoritative result |

## 7. Staff and Support Surface Specifications

### S01 — Assigned-Store Order Queue

**Requirements:** REQ-OPS-001. Show store scope, refresh/connectivity status, incoming orders, time since submission, payment eligibility, and fulfillment label. Separate actionable orders from unresolved-payment items without hiding exceptions from authorized operators.

Rows/cards show reference, submission time, configured item count, total, and allowed next action or detail entry. Avoid exposing unnecessary customer contact in the entire queue. Keyboard/tablet navigation must work. Reconnect refreshes authoritative records; notification sounds do not substitute for queue state.

**States:** Loading; no orders; connection stale; forbidden store; action conflict. A stale queue must not optimistically accept a conflicting action. Escalation thresholds come from D-12.

### S02 — Staff Order Detail

**Requirements:** REQ-OPS-001, REQ-ORD-004. Show item quantities/options prominently, pickup details, payment eligibility, status history, and a single clear next permitted action. Secondary rejection/cancellation controls require approved reason and confirmation.

Actions: Accept → Start preparing → Mark ready → Confirm collection, subject to current state. Rejection requires a reason. No unrestricted status dropdown that permits invalid backward transitions. Concurrent-action conflict refreshes the record and explains “This order was updated. Review its current status.”

Refund controls appear only for authorized roles and follow S04. Customer contact is limited to fulfillment need. Confirmation of collection uses approved D-08 verification, not an invented QR/code system.

### S03 — Availability / Pause Ordering

**Requirements:** REQ-OPS-002. Show store context, current ordering state, and item availability from the authoritative system. Clearly distinguish local edits, saving, saved, and failed changes.

Pausing ordering requires a clear explanation that existing orders still need handling; optionally capture an approved reason. Do not claim synchronization succeeded before confirmation. Restoring availability is deliberate and scoped to the selected store.

If the existing POS owns this workflow, document its screen reference and observed outcome during handoff rather than building duplicate controls.

### S04 — Support / Financial Exceptions

**Requirements:** REQ-SUP-001, REQ-PAY-002, REQ-ORD-004. Provide authorized lookup, order/payment/refund/reward timelines, exception status/owner, and supported resolution actions. Show only necessary personal data; protected fields can be masked according to role.

Refund confirmation identifies original transaction, proposed amount/currency, remaining refundable amount, reason, and consequences. Requested/Pending/Succeeded/Failed remain distinct. The interface must not claim refund completion on initiation. A pending refund has status retrieval, not a second unrestricted refund button.

Operators see a safe correlation/reference for escalation, not secrets or raw provider payloads by default. Resolution conflicts refresh current state. Support text must not invent a guaranteed refund arrival time.

## 8. Cross-Screen State and Recovery Contract

| Event | Preserve | Display / recovery | Prohibited behavior |
|---|---|---|---|
| Initial read loading | Navigation context | Skeleton/progress then content or error | Infinite loader with no recovery |
| Read fails after prior success | Last known safe data | Stale label and Retry | Present stale status as current |
| Offline browsing | Approved cached menu/cart | Offline indicator; revalidate online | Offline charge/order success |
| Checkout response lost | Intent/reference and recoverable input | Recover status | New purchase merely because of timeout |
| Provider returns no outcome | Existing purchase linkage | Pending screen | Mark failed based only on closure |
| Session expires | Nonsecret allowed work | Sign-in, refresh, resume | Auto-submit after sign-in |
| Account changes | No prior private view | Reload account-scoped data | Expose previous member history |
| Catalog/quote changes | User selections where still valid | Explicit correction/review | Silent substitution or charge increase |
| Notification arrives late | Current order state | Fetch authorized latest state | Regress timeline from message text |
| Store rejects paid order | Purchase evidence | Reason plus financial resolution | Remove order or imply automatic refund success |
| Loyalty fails after collection | Completed fulfillment | Adjustment pending/support | Undo collection |
| App upgrade/restart | Durable purchases via authenticated retrieval | Resume/history access | Depend on a local success screen alone |

## 9. Forms, Validation, and Money Display

- Persistent labels identify each field; hints explain format before an error occurs.
- On submit, validate applicable fields, show inline errors, and focus the first error. A summary may link to fields on long forms.
- Server validation has final authority. Map known errors to actionable messages; unknown errors retain user input and provide retry/support where safe.
- Do not impose undocumented contact formats, password lengths, quantity caps, or identity rules. D-04/D-14 and API contracts provide limits.
- Trim only safe incidental whitespace; do not alter user identifiers or names in ways that change their meaning.
- Currency is explicit for all financial amounts; do not concatenate a symbol with ambiguous decimal formatting.
- Tax-inclusive and tax-exclusive displays must match D-09; rewards/discounts are shown as reductions once.
- Expiry uses approved store/business time zone and clear date/time wording. Avoid ambiguous numeric-only dates when meaning could differ by locale.
- Never use color or strikethrough alone to explain price change; label old/new values.
- Keep transactional secrets, session tokens, provider debug details, and stack traces out of user-facing messages.

## 10. Example Microcopy — Draft English

Final wording and translation require Product/Operations review. Dynamic placeholders must be safely rendered as text.

| Key | Example copy | Context |
|---|---|---|
| `select_pickup_store` | Choose your pickup store | Store selection |
| `store_ordering_paused` | This store isn’t taking new orders right now. | Store pause |
| `required_option_missing` | Choose {option_name} to continue. | Product validation |
| `cart_empty` | Your cart is empty. Browse the menu to add an item. | Empty cart |
| `item_no_longer_available` | {item_name} is no longer available. Please edit or remove it. | Revalidation |
| `quote_changed` | Your total has changed. Review it before continuing. | Checkout |
| `payment_pending` | We’re checking your payment. Please don’t pay again yet. | Unknown payment |
| `payment_status_unavailable` | We can’t check your payment right now. Try again or contact support. | Status failure |
| `payment_received` | Payment received. | Verified financial success |
| `order_submitted` | Order submitted. Waiting for the store to accept it. | Submitted state |
| `order_ready` | Your order is ready for pickup at {store_name}. | Ready state |
| `order_update_failed` | We couldn’t refresh your order. Showing the last update. | Stale tracking |
| `cancellation_unavailable` | This order can no longer be canceled here. Contact support for help. | Policy/state refusal |
| `refund_pending` | Your refund is being processed. | Verified pending refund |
| `rewards_unavailable` | Rewards are temporarily unavailable. Please try again. | Loyalty read failure |
| `reward_adjustment_pending` | Your reward update is still being processed. | Adjustment delayed |
| `session_expired` | Please sign in again to continue. | Protected operation |
| `deletion_requested` | Your account deletion request has been received. | Request acknowledged |

Actual states must drive copy; examples do not authorize policy behavior or financial promises.

## 11. Accessibility and Inclusive Interaction

These are proposed internal acceptance checks. Final platform/conformance target is D-03 and NFR-08; verification has not been performed.

- All interactive elements have meaningful names, roles, states, and logical navigation order.
- Proposed touch target minimum: 48 × 48 logical units for primary controls, with spacing to avoid accidental neighboring activation.
- Proposed contrast checks: at least 4.5:1 for body text, 3:1 for sufficiently large text, and 3:1 for meaningful control boundaries/focus indicators against adjacent colors; confirm final standard applicability during design review.
- Test 200% text enlargement and narrow layouts; content/action labels must not clip. Forms reflow before columns overlap.
- Visible keyboard focus is never hidden under sticky elements. Keyboard-only users can complete browsing, forms, dialogs, and support routes on web.
- Modal focus moves into the dialog, remains within it while open, and returns to the trigger on close. Escape/cancel never commits a financial action.
- Status changes are announced appropriately without repeatedly interrupting assistive technology on every poll. Critical outcome text stays visible.
- Product images have meaningful alternatives where useful; decorative images/icons are excluded from redundant announcements.
- Radio/checkbox groups expose group labels, selection rules, and errors. Quantity buttons identify the affected product.
- Verification permits paste/autofill and accommodates slower entry within approved security rules; avoid inaccessible gesture-only steps.
- Reduced-motion mode suppresses nonessential movement. No required action depends on animation completion, sound, color, hover, or swipe alone.
- If Khmer is selected, test real Khmer copy, line wrapping, screen-reader behavior, and mixed-script values; translation is a separate reviewed deliverable.

## 12. Motion, Feedback, and Performance Perception

Use short, nonessential transitions for navigation and feedback; proposed 150–200 ms durations subject to platform review. Avoid dramatic purchase celebrations before financial/fulfillment facts are known.

Keep layout stable by reserving image and skeleton space. Show progress immediately after a deliberate submission, then a recoverable pending view if work outlasts normal interaction. Do not invent percentages for an operation with unknown progress.

Optimistic UI is acceptable only for reversible local edits such as unsaved option selection. Payment success, acceptance, cancellation, refunds, collection, and loyalty consumption wait for authoritative acknowledgement. Status polling intervals, timeout thresholds, and freshness wording depend on D-14/D-16.

## 13. Prototype and Design Handoff Requirements

The following artifacts are required for downstream handoff; this Markdown file does not claim they have been produced.

### 13.1 Design file organization

- Cover: project, version, owners, review status, source links.
- Foundations: color, typography, spacing, icons, accessibility notes.
- Components: variants, interactive states, responsive rules.
- Customer screens: C01–C15, including alternate states.
- Operations screens: S01–S04 or links/mappings to existing staff software.
- Prototype journeys and annotated policy dependencies.
- Handoff notes and change log.

Suggested frame name: `C05_Checkout / Mobile / QuoteChanged / v1`. Link requirement IDs in frame annotations. Use reusable components and named semantic tokens; do not leave critical behavior explained only in an untracked comment.

### 13.2 Required annotations per screen

Entry/exit; user and authorization context; layout order; source fields; primary/secondary actions; state transitions; input limits; server error mappings; loading/empty/offline behavior; localization; focus behavior; analytics trigger; and open decisions.

### 13.3 Prototype journeys

| ID | Journey | Required outcome |
|---|---|---|
| P01 | Store → product/options → cart → checkout → verified payment → accepted → ready → collected | Complete pickup journey with distinct statuses |
| P02 | Invalid modifier / unavailable item / changed quote | User corrects issue without silent substitution |
| P03 | Checkout → sign-in → return | Cart retained; purchase needs fresh confirmation |
| P04 | Payment timeout → app restart → pending → resolved | Existing intent recovered; no second-charge prompt |
| P05 | Paid order rejected → refund pending | Financial resolution visible separately |
| P06 | Benefit becomes unavailable during checkout | Revised quote reviewed explicitly |
| P07 | Staff concurrent update / reconnect | Current state recovered, no duplicate processing |
| P08 | Deletion request with active obligation | Approved consequences and honest acknowledgement |

## 14. Design QA and Usability Review

This is a planned review protocol, not test results. Recruit representative customer and staff participants through the project owner; sample size and release threshold are TBD. Observe completion, confusion, backtracking, errors, and interpretation of payment/order states without coaching the expected answer.

### 14.1 Usability tasks

1. Select a store manually, configure a product, and explain the total before confirming.
2. Recover from an unavailable item and a changed price.
3. Explain what “Payment pending” means and what to do after reopening the app.
4. Find pickup readiness and distinguish it from collection completion.
5. Find a rejected order's refund status and support route.
6. Explain whether a reserved/expired benefit can be spent.
7. As staff, accept the correct order, mark it ready, and resolve a stale-action conflict.

### 14.2 Review checklist

- [ ] Every customer and staff screen maps to PRD requirements.
- [ ] Normal, loading, empty, error, stale, and forbidden states are covered where applicable.
- [ ] Store changes, quote changes, and destructive requests have explicit consequences.
- [ ] Payment, fulfillment, refund, and reward states are visually and verbally distinct.
- [ ] Interrupted transactions recover without implying failure or prompting duplicate payment.
- [ ] Keyboard, screen reader, text scaling, touch targets, and contrast checks are recorded on selected platforms.
- [ ] Narrow layouts, long product names, many modifiers, long references, and localized text are verified.
- [ ] Sticky controls do not hide content or input fields with the keyboard open.
- [ ] Staff actions obey state/role/store scope; stale actions have a conflict state.
- [ ] Copy contains no unsupported timing, reward, refund, or financial guarantees.
- [ ] Product/Operations approve policy-dependent wording and workflows.
- [ ] Design version, unresolved issues, severity, and owners are recorded before handoff.

## 15. Requirements Traceability

| PRD requirement | Screen coverage |
|---|---|
| REQ-ACC-001 | C11, C12; return paths in C05/C09/C10 |
| REQ-ACC-002 | C13, C14 |
| REQ-STR-001 | C01, C02, C04, C05 |
| REQ-MNU-001 | C02 |
| REQ-MNU-002 | C03 |
| REQ-CART-001 | C03, C04 |
| REQ-PRICE-001 | C04, C05, C15 |
| REQ-CHK-001 | C05, C06 |
| REQ-PAY-001 | C05, C06, C07 |
| REQ-PAY-002 | C06, C08, C09, S04 |
| REQ-ORD-001 | C07, C08 |
| REQ-ORD-002 | C08, S02 |
| REQ-ORD-003 | C09 |
| REQ-ORD-004 | C08, C15, S02, S04 |
| REQ-LOY-001 | C10 |
| REQ-LOY-002 | C05, C10 |
| REQ-NTF-001 | C08 deep links, C13 preferences, shared status handling |
| REQ-OPS-001 | S01, S02 |
| REQ-OPS-002 | S03; C02/C05 revalidation |
| REQ-SUP-001 | S04 |

Analytics events follow PRD Section 11. A rendered success animation is not the source for financial analytics. Record screen events once per meaningful interaction and avoid logging field contents or personal information.

## 16. Open Decisions and Approval

| UX decision | Proposed baseline / remaining work | Owner | Linked PRD decision |
|---|---|---|---|
| Approved source design | Supply Figma/screens, inspect, and reconcile with this specification | Product / Design | D-01, D-03 |
| Brand foundations | Approve tokens, typography, imagery, icons | Brand / Design | D-01 |
| Platforms/navigation | Confirm customer and staff device scope and tab structure | Product / Engineering | D-03 |
| Identity screens | Confirm method, guest checkout, verification and recovery | Product / Engineering | D-04 |
| Payment action wording | Confirm provider flow/capture timing and return states | Finance / Engineering | D-05 |
| Staff surface ownership | Existing system versus new interface | Operations / Engineering | D-06 |
| Reward content | Actual scheme, units, terms, restoration rules | Loyalty / Product | D-07 |
| Exceptions and pickup | Cancellation/refund/no-show and collection verification | Operations / Finance | D-08 |
| Locale/amount display | Languages, tax treatment, currency, date formats | Product / Finance | D-09 |
| Pending/stale UX timing | Refresh, escalation, recovery thresholds | Engineering / Operations | D-12, D-14, D-16 |
| Quote/reward changes | Quote lifetime, stacking, zero-total behavior | Product / Finance / Loyalty | D-13 |
| Account deletion copy | Retention, active obligations, processing promises | Accountable privacy owner / Product | D-15 |
| Notifications | Channels, permission UX, templates, trigger list | Product / Operations | D-17 |

| Approval | Status | Named reviewer / date |
|---|---|---|
| Product scope and navigation | Pending | TBD |
| Brand and visual design | Pending | TBD |
| Store and support workflows | Pending | TBD |
| Engineering feasibility | Pending | TBD |
| Accessibility and usability review | Pending | TBD |
| QA state coverage | Pending | TBD |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial proposed screen, interaction, responsive, accessibility, recovery, and handoff specification aligned with PRD v1.0 |

Update this document, associated design frames, requirement links, and QA cases together when behavior changes. Planned next documents are `04-sdd.md`, `05-database-specification.md`, and `06-api-specification.yaml`; referencing them does not imply that they already exist.
