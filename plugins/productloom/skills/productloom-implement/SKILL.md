---
name: productloom-implement
description: Implement product behavior from validated ProductLoom contracts and design output in an existing application repository. Use when the user requests code, tests, API clients, screens, or components and the matching ProductLoom implementation-readiness gate has passed or the user has explicitly accepted reported warnings.
---

# ProductLoom Implement

Implement the approved contract in the target repository while preserving its architecture,
components, conventions, and user work.

## Gate

1. Read `.productloom/workspace.json`.
2. Identify the exact product, screen, target repository, and route.
3. Run:

```bash
productloom validate --gate implementation-readiness
```

Proceed on `PASS`. On `WARN`, explain the risk and proceed only when the user's instruction covers
it. Stop on `FAIL`.

## Implement

1. Inspect the target repository instructions, current components, tokens, routing, state
   management, tests, and dirty files.
2. Trace each implementation decision to the contract or design path.
3. Implement loading, empty, error, success, permission, and retry behavior that applies.
4. Reuse existing components and API clients.
5. Add focused tests for contract-critical behavior.
6. Run the repository's relevant checks.

## Handle Gaps

If implementation reveals a contract or design gap:

1. Stop the affected portion.
2. Record the evidence and impact.
3. Hand behavioral gaps to `productloom-spec`.
4. Hand interaction or visual gaps to `productloom-design`.

Do not silently reinterpret the contract, overwrite unrelated user changes, or claim canonical
completion before the configured repository policy is satisfied.
