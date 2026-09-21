---
title: "Decision Register — Coffee Ordering & Rewards App"
---

# Decision Register — Coffee Ordering & Rewards App

Status: prepared decision records; no decisions accepted by this task. Created/updated: 2026-09-12.

This folder contains **10 proposed architecture decisions (ADR-01–ADR-10)** and **17 open product/operational decisions (D-01–D-17)** aligned with documents 01–15. It turns the prior TBDs into owner-assigned questions and evidence gates; it does not fill missing facts with invented approvals.

## Architecture decisions

| ID | Topic | Status | Accountable role |
|---|---|---|---|
| [ADR-01](adr-01-modular-application.md) | Modular application and separate workers | PROPOSED | Technical Lead |
| [ADR-02](adr-02-relational-command-authority.md) | Transactional relational command authority | PROPOSED | Technical Lead / Database Owner |
| [ADR-03](adr-03-durable-events.md) | Outbox, inbox and deduplicated effects | PROPOSED | Backend Owner |
| [ADR-04](adr-04-immutable-quotes.md) | Immutable quotes and purchase snapshots | PROPOSED | Product / Finance / Backend |
| [ADR-05](adr-05-provider-financial-truth.md) | Provider evidence owns financial outcomes | PROPOSED | Finance / Technical Lead |
| [ADR-06](adr-06-fulfillment-authority.md) | Single fulfillment owner | PROPOSED | Store Operations / Technical Lead |
| [ADR-07](adr-07-loyalty-reservations.md) | Atomic loyalty reservation and effect ledger | PROPOSED | Loyalty / Backend |
| [ADR-08](adr-08-durable-intent-recovery.md) | Stateless requests and durable intent recovery | PROPOSED | Backend / Client |
| [ADR-09](adr-09-cache-read-only.md) | Cache as read optimization | PROPOSED | Technical Lead |
| [ADR-10](adr-10-pause-preserve-obligations.md) | Pause new ordering while preserving obligations | PROPOSED | Operations / Technical Lead / Finance |

## Product and operational decisions

| ID | Topic | Status | Accountable role |
|---|---|---|---|
| [D-01](d-01-brand-and-name.md) | Project brand and name | OPEN | Sponsor / Product |
| [D-02](d-02-launch-scope.md) | Launch stores and service model | OPEN | Product / Store Operations |
| [D-03](d-03-platforms.md) | Client platforms and accessibility | OPEN | Product / Technical Lead / Design |
| [D-04](d-04-identity-and-guest.md) | Identity, session and guest policy | OPEN | Product / Technical Lead |
| [D-05](d-05-payment-provider.md) | Payment provider and financial semantics | OPEN | Finance / Technical Lead |
| [D-06](d-06-source-authority.md) | Catalog, POS and fulfillment authority | OPEN | Store Operations / Technical Lead |
| [D-07](d-07-loyalty-policy.md) | Loyalty scheme and authority | OPEN | Loyalty / Product / Technical Lead |
| [D-08](d-08-order-exceptions.md) | Cancellation, refund and collection policy | OPEN | Store Operations / Finance / Product |
| [D-09](d-09-locale-and-money.md) | Locales, currency and monetary rules | OPEN | Product / Finance |
| [D-10](d-10-funding-and-capacity.md) | Budget, team capacity and schedule | OPEN | Sponsor / Delivery Lead |
| [D-11](d-11-quality-targets.md) | Success metrics, workload and service targets | OPEN | Product / Technical Lead / Operations |
| [D-12](d-12-support-coverage.md) | Support coverage and escalation | OPEN | Store Operations / Support Lead |
| [D-13](d-13-quote-benefit-lifecycle.md) | Quote, redemption and zero-total lifecycle | OPEN | Product / Finance / Loyalty |
| [D-14](d-14-recovery-and-limits.md) | Recovery objectives and operational limits | OPEN | Technical Lead / Operations / Finance |
| [D-15](d-15-privacy-retention.md) | Personal data, retention and deletion | OPEN | Product / Accountable Privacy Owner |
| [D-16](d-16-freshness-and-persistence.md) | Cart persistence and read freshness | OPEN | Product / Technical Lead |
| [D-17](d-17-notifications.md) | Transactional notifications | OPEN | Product / Operations |

## How to use the register

1. Assign a named accountable owner; roles above are not signatures.
2. Review the context, alternatives, proposed baseline and acceptance evidence.
3. Record selected option/values, rationale, scope, decision date and real approval reference.
4. Update impacted PRD, UX, SDD, database/API contracts, tests and delivery tasks together.
5. Track implementation and verification independently: accepting a design does not certify a deployed service.
6. Preserve history. Supersede material accepted choices with linked records rather than silently rewriting the past.

## Status lifecycle

- **OPEN:** Question unresolved; candidates may exist.
- **PROPOSED:** A concrete recommendation awaits review.
- **ACCEPTED:** Accountable approval, scope and rationale recorded.
- **REJECTED:** Proposal declined with rationale and next action.
- **DEFERRED:** Decision postponed with owner, impact and next review point; dependent acceptance remains blocked.
- **SUPERSEDED:** Replaced by a linked accepted record; retain original history.

All records currently remain OPEN or PROPOSED. No Git/Jira changes, provider validation, business approvals or production actions have been performed.

## Priority order

Resolve platform/capacity and authority first (D-03, D-06, D-10), then identity/payment/reward feasibility (D-04, D-05, D-07) and monetary/exception policies (D-08, D-09, D-13). Technical targets, support, privacy, freshness and notification policy (D-11–D-17) must be ready before their relevant acceptance gates. Brand/cohort decisions (D-01/D-02) remain required for launch. Work can overlap when dependencies are explicit.

ADR dependencies appear inside each record. The proposed architecture does not override an open product/provider decision. The template below supports new decisions; use new IDs after checking this register rather than renumbering established references.

## Deliverables and source limits

- [Decision template](decision-template.md)
- Source documents: project brief, PRD, UX, SDD, database/API specification, delivery/setup/standards, test/UAT, release and operations guides already drafted in this project.
- Full source artifacts and final platform/provider facts have not been validated as a running implementation.
- Actual values, names, approval evidence and test results must be provided by accountable reviewers.
