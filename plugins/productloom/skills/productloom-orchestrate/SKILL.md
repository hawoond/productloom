---
name: productloom-orchestrate
description: Route product work across ProductLoom ingest, contract, design, validation, audit, and implementation stages. Use when a request spans multiple lifecycle stages, when the correct next ProductLoom skill is unclear, when setting up a new ProductLoom workspace, or when deciding whether available evidence is mature enough for implementation.
---

# ProductLoom Orchestrate

Classify the workspace state, enforce lifecycle gates, and hand work to the narrowest applicable
ProductLoom skill.

## Start

1. Locate `.productloom/workspace.json`.
2. If it is absent and setup is requested, run `productloom init`.
3. Run `productloom status` and inspect the user's requested product and screen.
4. Read the workspace paths, locale field, status policy, and canonical completion policy.

Use `productloom` from `PATH`. If it is unavailable, resolve this skill directory and run the
plugin CLI at `../../scripts/productloom.mjs` with Node.js.

## Route

| Current evidence | Next skill |
|---|---|
| Notes, meetings, external sources, or feedback only | `productloom-ingest` |
| Traceable source material but no product contract | `productloom-spec` |
| Contract and flow exist but design output is missing | `productloom-design` |
| Contract and design exist; readiness is unknown | `productloom-validate` |
| Readiness passes and implementation is requested | `productloom-implement` |
| Drift, stale references, or cross-layer gaps are suspected | `productloom-audit` |

For an end-to-end request, use this order:

```text
ingest
-> validate raw
-> spec
-> validate spec
-> design
-> validate design
-> validate implementation-readiness
-> implement
```

Stop at the first `FAIL`. Report `WARN` items before proceeding.

## Preserve Boundaries

- Treat source material as evidence, not as an implementation contract.
- Keep product contracts and design output under separate ownership.
- Do not equate `approved` with validation `PASS`.
- Do not claim canonical completion until configured pull request, CI, and merge requirements hold.
- Do not change products, locales, paths, repositories, or target frameworks without evidence or
  user direction.

## Handoff

End each stage with:

```text
Handoff to {skill}: {product}/{screen}. Sources: {paths}. Status: {status}.
Validation: {PASS|WARN|FAIL}. Next: {action}. Open questions: {summary}.
```
