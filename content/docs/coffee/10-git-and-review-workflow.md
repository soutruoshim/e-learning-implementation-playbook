---
title: "10 — Git and Review Workflow"
---

# 10 — Git and Review Workflow

## Coffee Ordering & Rewards App

| Field | Value |
|---|---|
| Document ID | GIT-001 |
| Version / status | 1.0 / Proposed workflow for team approval |
| Created / updated | 2026-09-11 |
| Owner | Technical Lead / Repository Maintainer — TBD |
| Sources | Documents 01–09, especially delivery plan and coding standards |
| Repository host / URL | TBD |
| Default branch | Use the actual repository default; not assumed to be `main` |
| Enforcement status | No repository settings, CI jobs, branches or permissions inspected or changed |

> This document specifies the intended contribution and release workflow. Repository names, Jira keys, platform features and commands must be bound to the actual project before enforcement. “Merge request” (MR) also means “pull request” on hosts that use that term. Templates below are reusable drafts; they do not create or submit tickets, reviews, merges or deployments.

## 1. Goals and Operating Model

Keep the default branch reviewable and releasable, connect every change to a requirement or defect, and retain enough evidence to explain which source, build and configuration reached production.

The proposed baseline is a protected default branch with short-lived task branches and reviewed merges. A permanent development branch or separate release branch is not required by default. Introduce additional branches only when an actual maintenance or release constraint justifies their ownership and synchronization cost.

Merging code, accepting a story, approving UAT and deploying production are separate actions. A merged MR is not proof that a feature is live or that the release meets every business gate.

## 2. Repository Binding and Protection

| Setting | Proposed baseline | Must confirm |
|---|---|---|
| Repository host / URL | Team-owned approved repository | Actual host and access method |
| Default branch | Protected integration branch | Actual branch name |
| Direct pushes | Disallowed for ordinary feature work | Host rule and emergency access |
| Force pushes / deletion | Disallowed on protected and shared release branches | Host protections |
| Merge checks | Required CI passes and required review resolved | Actual job names and enforcement |
| Review approvals | At least one independent qualified reviewer | Team capacity and host support |
| Sensitive changes | Relevant domain owner review in addition to ordinary review where needed | Owner mapping |
| New commits after approval | Re-review affected changes; stale approval invalidation where supported | Host behavior |
| Merge freshness | Validate candidate against target branch | Merge queue or equivalent procedure |
| Merge method | Squash merge proposed | Team selection and host setting |
| Release tags | Protected, immutable release identifiers | Naming and signing policy |
| Secrets/access | Least-needed access; approved secret mechanism | Maintainer/CI identities |

Configure these settings during WP-04. Do not claim protection exists based on this document alone. If the team cannot provide independent review for a critical change, record that limitation and arrange an accountable review path; do not silently treat self-approval as independent review.

## 3. Roles and Responsibilities

| Role | Responsibility |
|---|---|
| Author | Small coherent change, accurate description, relevant tests, clean diff, response to review |
| Reviewer | Assess behavior, risks, contracts, evidence and maintainability; identify blocking issues clearly |
| Technical/domain owner | Review financial, concurrency, identity, schema or integration decisions within their scope |
| Maintainer | Repository protections, merge policy, ownership rules and exceptional access |
| QA Owner | Verification evidence, defects and release-test assessment |
| Release owner | Select verified source/build/configuration and coordinate go/no-go |
| Product / Operations / Finance | Approve affected business rules, operating behavior and financial policy |

Review assignment follows impact, not only folder ownership. A UI change that alters quote confirmation may need payment-domain review. A database migration may need runtime/operations review even if no API changes.

## 4. Branch Naming and Scope

Use lowercase, readable names with an actual issue key when available. Examples below use illustrative `PROJ-123`, not a real Jira issue.

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New product capability | `feature/PROJ-123-pickup-checkout` |
| `fix/` | Defect correction | `fix/PROJ-124-payment-status-recovery` |
| `chore/` | Tooling/maintenance | `chore/PROJ-125-ci-contract-check` |
| `docs/` | Documentation-only change | `docs/PROJ-126-developer-setup` |
| `hotfix/` | Urgent production correction | `hotfix/PROJ-127-refund-retry` |
| `release/` | Optional stabilization line | Create only for an approved need |

One branch should represent one coherent outcome. Avoid combining unrelated refactoring, dependency upgrades and feature changes. Large work packages from the delivery plan must be split into reviewable increments with explicit dependencies.

Do not put secrets, customer names, contact values or provider credentials in branch names. A branch name is not authorization to deploy or modify production.

## 5. Start and Maintain a Change

### Before editing

1. Read repository instructions, contribution rules and applicable `AGENTS.md`.
2. Inspect the working-tree status; preserve unrelated local work.
3. Confirm the actual remote, default branch and intended task.
4. Obtain current remote state and create the task branch from the approved base.
5. Read linked requirements, API/database contracts and open decisions relevant to the task.
6. Confirm required local/test configuration and fixtures before implementation.

Exact shell commands depend on the real repository and access method. This document does not provide destructive reset or guessed-remote commands as setup shortcuts.

### During implementation

Keep changes focused. Update contracts and documentation with behavior changes. Use small commits that explain meaningful progress. Do not commit local environment files, tokens, generated logs, private exports or build artifacts unless repository policy intentionally tracks them.

If another change is required first, link the dependency and use a reviewed sequence or an explicit stacked-MR approach supported by the team. Do not copy another branch's unreviewed changes into a large MR without explaining provenance and merge order.

### Updating from the target branch

Fetch and inspect target changes. Merge or rebase according to the selected policy. Rebase only a branch whose history can safely be rewritten; coordinate with anyone sharing it. Never force-push a protected branch. A nonprotected author branch may use a guarded force update only when necessary, permitted and coordinated.

Resolve conflicts semantically: compare intended behavior, API/schema changes, tests and migration order. Removing conflict markers is not sufficient. Run checks for the affected risk and ask for renewed review after material conflict resolution.

## 6. Commit Standards

Proposed commit format:

```text
<type>(<scope>): <concise outcome>

<Why the change is needed and any material behavior or recovery detail.>

Issue: <actual issue key or link>
Requirements: <relevant REQ IDs, if applicable>
```

Suggested types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Suggested scopes: `checkout`, `payments`, `orders`, `loyalty`, `catalog`, `client`, `database`, `worker`, `ci`.

Example:

```text
fix(payments): recover the existing attempt after a timeout

Keep unresolved attempts linked to the checkout intent so a retry checks
provider status before a new collection can be considered.

Issue: PROJ-124
Requirements: REQ-PAY-002
```

Use the issue key only when it exists. Do not invent test results in commit messages. Commit prefixes do not automatically determine release version or compatibility: breaking API/schema changes require explicit review even if labeled `fix`.

Squash merge, if selected, uses a reviewed final message that preserves the issue link and meaningful outcome. Retain the MR as the detailed discussion/evidence record.

## 7. Merge Request Lifecycle

| Stage | Author/reviewer action | Exit condition |
|---|---|---|
| Draft | State goal, scope and remaining work; seek early domain input | Change coherent enough for full review |
| Ready for review | Complete description, self-review, link relevant checks | Reviewer has reproducible evidence and context |
| Review | Assess behavior/contracts and discuss issues | Blocking comments resolved and required approvals present |
| Merge-ready | Validate target integration, CI, dependencies and rollout implications | Exact candidate satisfies merge gates |
| Merged | Record resulting revision and link task | Story moves according to QA evidence, not automatically production |
| Verified/released | Link QA/build/release evidence separately | Applicable acceptance/release gates satisfied |

Author self-review includes the complete diff, unexpected files, generated changes, migration sequence and sensitive data. A draft may have failing checks while work is ongoing, but must not be treated as merge-ready.

Reviewers distinguish **blocking issue**, **question**, and **optional suggestion**. Explain the concrete risk or intended behavior. Authors respond with the fix or reasoned clarification; do not resolve a substantive objection without agreement or an accountable decision.

## 8. Merge Request Template

Copy and adapt to the actual host. Remove irrelevant sections only when doing so does not hide a material risk.

```markdown
## Jira / Work Item

- Issue: <actual link or local planning reference>
- Requirements: <REQ IDs>
- Related decision / dependency: <link or none>

## Summary

<Problem, change, and resulting behavior.>

## Scope

- Included: <what changes>
- Excluded: <relevant boundaries>

## Components

- [ ] API / backend
- [ ] Customer client
- [ ] Staff UI / POS integration
- [ ] Database / migration
- [ ] Worker / integration
- [ ] CI / configuration
- [ ] Documentation

## Change Type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor / maintenance
- [ ] Contract or schema change
- [ ] Documentation only

## Business and Technical Impact

<Changed rules, users/stores affected, compatibility, financial or recovery implications.>

## Verification

| Check / scenario | Result | Evidence / environment |
|---|---|---|
| <relevant check> | <passed / failed / not run> | <link or reason> |

## Migration / Configuration

<Required sequence, defaults, backfill, secrets references and old/new compatibility; or not applicable.>

## Deployment and Recovery

<Rollout order, feature controls, rollback/forward-fix constraints, existing obligations; or not applicable.>

## Risks and Dependencies

<Open risks, dependent MRs, policy decisions and owners; or none identified.>

## Screenshots / Recordings

<Relevant UI states only; remove sensitive data.>

## Checklist

- [ ] Scope matches the linked work item.
- [ ] Contracts and documentation are updated where affected.
- [ ] Relevant authorization, validation and retry behavior is verified.
- [ ] No secrets or unnecessary personal data are included.
- [ ] Required CI checks pass for the merge candidate.
- [ ] Required reviewers approved the final relevant changes.
```

Do not check a box simply because a template asks for it. Explain unexecuted verification accurately. Screenshots complement behavior tests; they do not establish transaction correctness.

## 9. Review Depth by Risk

| Change area | Required focus | Review ownership |
|---|---|---|
| Exact pricing/quote | Rounding, currency, consent, snapshot preservation | Backend plus financial/product policy owner as needed |
| Payment/refund | Unknown outcomes, stable operation keys, provider evidence, exposure limits | Payment/technical owner |
| Loyalty | Atomic reservation, unique effect, expiry/reversal policy | Loyalty/backend owner |
| Database | Constraints, lock order, migration impact, history retention | Database/technical owner |
| Identity/authorization | Session lifecycle, ownership/store scope, data exposure | Identity/security-capable owner |
| Worker/integration | Durable intent, retry bounds, stale leases, reconciliation | Backend/integration owner |
| Client transaction flow | Accurate status, deliberate confirmation, recovery and accessibility | Client plus affected domain owner |
| CI/deployment | Secret handling, artifact provenance, compatibility and recovery | Maintainer/DevOps |
| Documentation only | Accuracy, references, unsupported claims | Relevant document owner |

Review depth must be proportional to change impact. Do not require expensive system tests for a spelling fix, but do not omit mandatory financial/concurrency tests because a code diff is small.

## 10. CI and Merge Gates

Actual commands and job names are selected in WP-04 and documented in the repository. Required capabilities:

| Gate | Applies when | Evidence |
|---|---|---|
| Formatting/static checks | Relevant source changed | Selected configured checks pass |
| Build/type checks | Affected application/package changed | Supported-target build succeeds |
| Unit tests | Business logic changed | Relevant behavior cases pass |
| Database integration | Constraints/transactions/migrations changed | Actual selected-engine checks pass |
| API validation/contracts | API schemas or transport behavior changed | Full validation and affected contract checks pass |
| Security-sensitive tests | Access/session/input boundaries changed | Relevant negative cases pass |
| Retry/concurrency tests | Financial, state or worker guarantees changed | Required invariant scenarios pass |
| Migration compatibility | Schema/backfill change | Reviewed deployment order and verified migration |
| Secret control | Repository policy | Approved secret checks and review |

A passing pipeline on an older branch revision is not proof for a new merge candidate. Use a merge queue or validate the combined candidate against the current target before merge. If the target changes materially after validation, rerun checks needed to establish candidate safety.

No ignored failing required job, stale approval, unresolved blocking discussion or unknown integration dependency at merge time. If a host cannot enforce a gate automatically, document the manual accountable check until enforcement exists.

## 11. Merge Procedure

1. Confirm the MR's final diff, scope and dependency state.
2. Ensure required reviewers assessed material updates, including conflict resolutions.
3. Confirm required checks pass for the intended integration candidate.
4. Confirm migration/configuration/event compatibility and deployment implications are documented.
5. Merge through the host using the selected method; no direct push bypass.
6. Record the resulting full source revision and associated build identity.
7. Update the task with implementation/QA status and evidence.
8. Delete the merged task branch if safe and permitted; do not delete active shared work.

If a check fails after merge, investigate promptly, stop affected promotion and use a reviewed fix/revert as appropriate. Do not rewrite protected history to pretend the merge never occurred.

## 12. Schema, API and Event Compatibility

Changes must account for versions that may coexist during deployment and durable events created before the deployment.

- Add compatible fields/tables first; deploy readers/writers in a reviewed order.
- Backfill in bounded resumable batches with no duplicate external effects.
- Remove obsolete contracts only after consumers, pending work and retention implications are reviewed.
- Version event payloads and keep consumers compatible with queued earlier events.
- Preserve idempotency references and financial evidence across migrations and code rollback.
- Update OpenAPI, database and SDD documents when authority or invariant behavior changes.

The current API contains explicit identity/provider placeholders. A clean YAML diff or passing structural check does not close those implementation gates.

## 13. Release Candidates, Tags and Artifact Provenance

### Release record

Each release candidate records:

- Full source commit identifier and repository.
- Immutable build/artifact identifier and checksum where supported.
- Configuration revision and secret reference versions as applicable, without exposing values.
- Database migration revision and compatibility notes.
- QA/UAT evidence, known limitations and release decision.
- Deployment environment, time, owner and verification outcome.

Build once and promote the same verified artifact where the platform supports it. If environment-specific builds are unavoidable, record and validate each exact artifact; do not assume a shared source commit makes different builds identical.

### Tag policy

Proposed release labels are `v<major>.<minor>.<patch>` with optional candidate suffix such as `-rc.1`, subject to team approval. Tags identify source, not proof of successful deployment. API version and product release version are separate concepts.

Create tags only for the reviewed intended revision and protect them from movement/deletion. Never reuse a release tag to point to a corrected build. Record a new release identifier. Signing policy and platform permissions are TBD; do not claim signed provenance unless implemented and verified.

## 14. Hotfix Workflow

1. Triage the incident, impact, affected release and current financial/operational obligations.
2. Identify the exact deployed revision/artifact and whether default-branch code contains unrelated unreleased work.
3. Branch from the appropriate known base: deployed revision for isolated maintenance when needed, or current default only when its full contents are suitable.
4. Implement the smallest coherent correction with targeted regression/recovery evidence.
5. Obtain the required qualified review and incident/release decision. Urgency narrows scope; it does not justify fabricated test results or unverified financial retries.
6. Build/tag/deploy the verified fix using the production procedure and monitor the affected outcome.
7. Integrate the fix into the default branch and any supported maintenance lines, adapting it where code differs.
8. Link incident, MR, release and follow-up work; review remaining risk.

Emergency access or expedited approval must be explicitly defined by maintainers and accountable release owners. This document does not grant permission to bypass host access controls or production approvals.

## 15. Revert and Recovery Decisions

| Situation | Preferred decision process |
|---|---|
| Unreleased ordinary change is wrong | Reviewed corrective commit or revert; preserve history |
| Deployed code regression with compatible prior artifact | Follow release rollback procedure and verify current obligations |
| Irreversible migration or changed external state | Forward fix or specifically designed recovery; no blind database downgrade |
| Pending payment/refund/loyalty work | Keep authoritative evidence and recovery consumers operating |
| Secret committed | Revoke/rotate with owner, assess exposure, then follow repository cleanup policy |

A source revert changes code; it does not reverse a charge, restore a deleted external record, or cancel a provider request. Pausing new checkout must not abandon existing orders, callback intake, reconciliation or refunds.

Revert MRs state the original change, observed problem, behavior restored, compatibility limits and verification. Avoid destructive history rewriting on shared/protected branches.

## 16. Jira and Delivery Evidence

Use actual project issue keys once created. The delivery plan's WP IDs remain planning references until mapped to real work items.

| Event | Task update |
|---|---|
| MR opened | Link branch/MR, requirements and dependencies |
| Review requested | State checks and remaining decisions |
| MR merged | Link resulting revision and candidate build |
| QA completed | Record results/defects and tested environment |
| Release deployed | Link release record and production verification |
| Incident/hotfix | Link incident, fix, deployment and follow-up |

Do not automatically close a story on merge if its Definition of Done requires QA evidence not yet available. Do not report “released” merely from a merged MR or created tag.

## 17. Common Failure Prevention

- Large mixed MR: split by coherent outcomes and document dependency order.
- Repeated conflicts: shorten branch lifetime, coordinate ownership and review shared contracts early.
- Stale approvals: renew review after material commits or conflict resolution.
- CI passes but merge breaks: validate the combined target candidate rather than only branch head.
- Lost hotfix: track propagation to default and supported maintenance lines explicitly.
- Wrong release revision: copy the verified full revision from the actual build/source record; never reconstruct it from an abbreviation.
- Misleading evidence: identify what ran, where, on which revision, and what remains untested.
- Secret in diff: stop sharing the exposed value, notify the accountable owner and rotate through the approved process.

## 18. Adoption Checklist and Approval

- [ ] Repository, default branch and actual maintainers identified.
- [ ] Branch/tag protections configured and verified.
- [ ] Reviewer ownership and sensitive-change routing established.
- [ ] Merge method and freshness checks selected.
- [ ] CI job names bound to required gates.
- [ ] MR template installed in the host-supported location.
- [ ] Release records link source, artifact, configuration and evidence.
- [ ] Hotfix propagation and emergency decision ownership documented.
- [ ] Team completes one reviewed change through the workflow.

Related documents: `07-delivery-plan.md`, `08-developer-setup.md`, `09-coding-standards.md`; planned `11-test-plan.md`, `12-uat-and-sign-off.md`, `13-deployment-and-rollback.md`, and `14-release-checklist.md`. Planned references do not imply those files already exist.

| Approval | Reviewer | Status / date |
|---|---|---|
| Repository and review policy | Technical Lead / Maintainer — TBD | Pending / — |
| CI and artifact provenance | DevOps Owner — TBD | Pending / — |
| QA and task-state evidence | QA / Delivery Owner — TBD | Pending / — |
| Release/hotfix ownership | Release / Operations Owner — TBD | Pending / — |

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-11 | Initial proposed branch, commit, MR, CI, merge, release, hotfix and recovery workflow |
