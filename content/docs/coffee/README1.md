---
title: "Test Cases — Coffee Ordering & Rewards App"
---

# Test Cases — Coffee Ordering & Rewards App

Created/updated: 2026-09-12. Case baseline: `11-test-plan.md` v1.0. All cases are **NOT RUN**.

This folder expands all **56 planned scenarios** into individual Markdown cases with prerequisites, specific actions, expected results, evidence and cleanup. These are manual/automation-ready test specifications, not implemented scripts or executed results. Bind the selected stack, approved policy values, provider fixtures and test harness before execution.

## Supporting files

- [Fixture and environment guide](fixtures-and-environments.md)
- [Execution register](execution-register.md)
- [Repeatable execution template](execution-template.md)

## Case index

| Case | Area | Priority | Objective |
|---|---|---|---|
| [TC-001](tc-001.md) | Account | P1 | Register through approved verification |
| [TC-002](tc-002.md) | Account | P0 | Attempt wrong, expired and reused proof |
| [TC-003](tc-003.md) | Account | P0 | Logout/revoke session, replay token |
| [TC-004](tc-004.md) | Account | P1 | Edit profile and initiate verified contact change |
| [TC-005](tc-005.md) | Account | P1 | Request deletion with active order/payment then repeat request |
| [TC-006](tc-006.md) | Catalog and cart | P1 | Select store without location access |
| [TC-007](tc-007.md) | Catalog and cart | P0 | Pause store or change availability after cart/quote opens |
| [TC-008](tc-008.md) | Catalog and cart | P1 | Read empty, failed, stale and newly published menu |
| [TC-009](tc-009.md) | Catalog and cart | P1 | Omit required option |
| [TC-010](tc-010.md) | Catalog and cart | P1 | Add/edit/remove distinct configurations |
| [TC-011](tc-011.md) | Catalog and cart | P1 | Restart/sign in while cart exists |
| [TC-012](tc-012.md) | Quote and checkout | P0 | Quote exact-money fixtures and approved rounding boundaries |
| [TC-013](tc-013.md) | Quote and checkout | P0 | Submit quote just before/at/after expiry and after price/benefit change |
| [TC-014](tc-014.md) | Quote and checkout | P0 | Tamper client amount, currency, quote owner or product configuration |
| [TC-015](tc-015.md) | Quote and checkout | P0 | Submit same intent key/payload concurrently and sequentially |
| [TC-016](tc-016.md) | Quote and checkout | P0 | Reuse key with different semantic payload |
| [TC-017](tc-017.md) | Quote and checkout | P0 | Race two different keys against one quote |
| [TC-018](tc-018.md) | Quote and checkout | P0 | Drop response after checkout commit, restart client and recover |
| [TC-019](tc-019.md) | Quote and checkout | P0 | Fail checkout transaction before commit and restart workers |
| [TC-020](tc-020.md) | Payment and refunds | P0 | Complete provider flow |
| [TC-021](tc-021.md) | Payment and refunds | P0 | Send invalid signature, wrong merchant/environment/reference/amount/currency |
| [TC-022](tc-022.md) | Payment and refunds | P0 | Repeat/reorder valid callback |
| [TC-023](tc-023.md) | Payment and refunds | P0 | Fail inbox persistence before acknowledgement |
| [TC-024](tc-024.md) | Payment and refunds | P0 | Time out provider initiation then report late success |
| [TC-025](tc-025.md) | Payment and refunds | P0 | Crash worker after provider effect before local outcome commit |
| [TC-026](tc-026.md) | Payment and refunds | P0 | Return definitive failure then deliberately retry |
| [TC-027](tc-027.md) | Payment and refunds | P0 | Deliver success after order cancellation/rejection or mismatch local/provider records |
| [TC-028](tc-028.md) | Payment and refunds | P0 | Request refund beyond capacity and race two refundable amounts |
| [TC-029](tc-029.md) | Payment and refunds | P0 | Timeout refund, replay same operation, then resolve success/failure |
| [TC-030](tc-030.md) | Payment and refunds | P1 | Test full refund and, only if enabled, partial tax/discount allocations |
| [TC-031](tc-031.md) | Orders and operations | P1 | Complete purchase to collection |
| [TC-032](tc-032.md) | Orders and operations | P1 | Refresh tracking offline |
| [TC-033](tc-033.md) | Orders and operations | P0 | Race staff acceptance/cancellation and two stale staff commands |
| [TC-034](tc-034.md) | Orders and operations | P0 | Attempt preparation before payment eligibility and illegal backward transitions |
| [TC-035](tc-035.md) | Orders and operations | P1 | Reconnect staff queue, pause new ordering and process existing orders |
| [TC-036](tc-036.md) | Orders and operations | P0 | Member/staff/support roles search and mutate other owner/store records |
| [TC-037](tc-037.md) | Orders and operations | P1 | Locate mismatched payment and assign/resolve support case |
| [TC-038](tc-038.md) | Loyalty and notifications | P1 | Read selected scheme, empty history, expired benefit and service failure |
| [TC-039](tc-039.md) | Loyalty and notifications | P0 | Race two checkouts for the same spendable units/benefit |
| [TC-040](tc-040.md) | Loyalty and notifications | P0 | Reservation reaches expiry while payment remains unknown |
| [TC-041](tc-041.md) | Loyalty and notifications | P0 | Replay collection/reward event, including after rule revision change |
| [TC-042](tc-042.md) | Loyalty and notifications | P0 | Cancel/refund after earning/redemption |
| [TC-043](tc-043.md) | Loyalty and notifications | P0 | Fail loyalty after order collection |
| [TC-044](tc-044.md) | Loyalty and notifications | P1 | Deny notification permission, fail provider, repeat business event |
| [TC-045](tc-045.md) | Loyalty and notifications | P0 | Change account on device then open old notification |
| [TC-046](tc-046.md) | Contracts and readiness | P1 | Fully validate final OpenAPI and exercise selected schema variants |
| [TC-047](tc-047.md) | Contracts and readiness | P0 | Send wrong types, null/zero/empty, oversized values, unsupported fields and cursor tampering |
| [TC-048](tc-048.md) | Contracts and readiness | P0 | Inspect logs, API errors, analytics and fixtures during failed operations |
| [TC-049](tc-049.md) | Contracts and readiness | P0 | Crash outbox consumer |
| [TC-050](tc-050.md) | Contracts and readiness | P0 | Apply migration/backfill, restart, attempt prohibited history deletion |
| [TC-051](tc-051.md) | Contracts and readiness | P0 | Restore database behind provider activity and replay recovery |
| [TC-052](tc-052.md) | Contracts and readiness | P1 | Load/peak/soak and dependency degradation at approved workload |
| [TC-053](tc-053.md) | Contracts and readiness | P1 | Navigate critical screens with text scaling, keyboard/assistive controls and selected devices/locales |
| [TC-054](tc-054.md) | Contracts and readiness | P1 | Stop workers/sync/provider, observe alerts and support routing |
| [TC-055](tc-055.md) | Contracts and readiness | P1 | Execute UAT pickup and exception journeys with store/finance reviewers |
| [TC-056](tc-056.md) | Contracts and readiness | P0 | Pilot smoke, pause checkout and exercise compatible rollback procedure |

## Usage and result rules

1. Resolve each case's decision dependencies and prepare isolated fixtures.
2. Identify actual candidate, config, schema, adapter and actor scope.
3. Run applicable variants and compare with approved business facts and committed/external evidence.
4. Record PASS, FAIL, BLOCKED, NOT RUN or approved NOT APPLICABLE; retain prior runs and defects.
5. Clean up safely without deleting unresolved financial obligations.

P0 cases cover critical correctness/security/recovery and are required gates where applicable. P1 remains required functional/operational scope. A passing percentage cannot override an unresolved critical defect. Full release criteria are in the test plan and release checklist.

Architecture, database, API, decision records and UAT documents remain the source context. This folder does not resolve open policies, select runtime tools, approve real transactions or certify production readiness.
