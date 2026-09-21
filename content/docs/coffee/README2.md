---
title: "Releases — Coffee Ordering & Rewards App"
---

# Releases — Coffee Ordering & Rewards App

Created/updated: 2026-09-12. Status: release-record workspace prepared; **no releases recorded or deployed**.

This folder provides reusable records aligned with documents 10–15. It does not create a fictitious version, release date, approval, Git tag or deployment. Source documents remain draft specifications until their actual acceptance gates are met.

## Start here

1. Confirm a real release/change identifier, candidate and accountable owner.
2. Copy the relevant templates into a release-specific folder, using that actual identifier; keep these templates unchanged for reuse.
3. Complete candidate identity and readiness evidence before the actual go/no-go.
4. Record actions, results and financial obligations during execution; never precheck results.
5. Record pilot/expansion, handover and follow-up separately from initial deployment approval.
6. Update the release register with actual evidence. Preserve failed/rolled-back records.

Suggested future folder naming: `<actual-release-id>/`. This placeholder is not a real release and no such folder is created here. Optional semantic version labels must follow the approved repository policy; a tag is not proof of deployment.

## Index

| File | Purpose |
|---|---|
| [Release register](release-register.md) | Chronological actual release outcomes; currently empty |
| [Release Record](release-record-template.md) | Reusable record; pending until completed with evidence |
| [Release Notes](release-notes-template.md) | Reusable record; pending until completed with evidence |
| [Deployment Evidence](deployment-evidence-template.md) | Reusable record; pending until completed with evidence |
| [Smoke and Financial Reconciliation](smoke-and-reconciliation-template.md) | Reusable record; pending until completed with evidence |
| [Release Go / No-Go](go-no-go-template.md) | Reusable record; pending until completed with evidence |
| [Pilot Observation and Expansion](pilot-review-template.md) | Reusable record; pending until completed with evidence |
| [Rollback / Forward-Fix Record](rollback-record-template.md) | Reusable record; pending until completed with evidence |
| [Known Issues and Accepted Conditions](known-issues-template.md) | Reusable record; pending until completed with evidence |
| [Operations Handover](handover-template.md) | Reusable record; pending until completed with evidence |
| [Post-Release Review](post-release-review-template.md) | Reusable record; pending until completed with evidence |
| [Hotfix Record](hotfix-record-template.md) | Reusable record; pending until completed with evidence |

## Record lifecycle

DRAFT → READY FOR REVIEW → GO / NO-GO / DEFERRED → EXECUTION → OBSERVATION → CLOSED or RECOVERY ONGOING. These are record states, not automatic permission transitions. Release notes also require publication review appropriate to their audience.

A candidate change can invalidate readiness evidence. Track full commit, artifact digest, configuration and migration revision; do not assume identical branch names or version labels mean identical deployments. Keep business UAT, technical verification, production go/no-go and expansion decisions distinct.

## Evidence rules

- Results use NOT RUN, PASS, FAIL, BLOCKED or approved NOT APPLICABLE as relevant.
- Every actual approval includes name/role, date, scope and a real reference.
- Every financial exception retains original operation identity and a named owner.
- Never include tokens, secrets, unredacted personal contact or raw sensitive provider payloads.
- Cross-references to documents 10–15 identify governing procedures; templates are not executable hosting commands.
- Zip contains this folder only; the earlier project documents are separate deliverables.
