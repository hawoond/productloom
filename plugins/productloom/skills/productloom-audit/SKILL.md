---
name: productloom-audit
description: Audit ProductLoom traceability and drift across raw sources, product contracts, flows, design output, and optional code evidence. Use for coverage reviews, stale references, unresolved feedback, spec-flow mismatch, design drift, SemVer inconsistency, orphaned components or tokens, and report-only workspace health checks.
---

# ProductLoom Audit

Inspect the full evidence graph without changing source, contract, design, or application files by
default.

## Run

1. Read `.productloom/workspace.json`.
2. Confirm audit scope and whether external code or design evidence is available.
3. Run:

```bash
productloom audit --format json
```

4. Extend the deterministic result with evidence-backed checks that require connected tools.

## Check

- raw requirements with no matching contract reference;
- screens missing a `spec.md` and `flow.md` pair;
- dangling `source_refs` and asymmetric downstream references;
- contract behavior that differs from current code or runtime evidence;
- version and changelog mismatch;
- approved contracts with unresolved implementation blockers;
- design plans missing required interaction states;
- orphaned components and tokens;
- unverified or dangling design-tool references;
- unresolved feedback beyond the workspace threshold.

## Report

Group findings by `error`, `warning`, and `info`. Include rule identifier, exact path, evidence,
impact, and the narrowest next action. Separate confirmed drift from checks that could not be
performed.

Recommend `productloom-spec` for source or contract gaps and `productloom-design` for design gaps.
Do not automatically rewrite audited documents or application code.
