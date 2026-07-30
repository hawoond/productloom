---
name: productloom-design
description: Translate approved ProductLoom contracts and flows into design plans, component inventories, token mappings, and optional design-tool references. Use when a product screen needs implementable interaction states, responsive behavior, accessibility guidance, or design-system mapping without changing the underlying product contract.
---

# ProductLoom Design

Turn verified product behavior into an implementable design handoff.

## Preconditions

1. Read `.productloom/workspace.json`.
2. Confirm locale, product, and screen.
3. Read the matching `spec.md` and `flow.md`.
4. Run `productloom validate --gate spec`.
5. Stop if contract validation fails.

## Design

Maintain the configured design documents:

- `plan.md`: information architecture, interaction model, responsive behavior, accessibility;
- `components.md`: responsibilities, properties, events, states, and reuse;
- `tokens.md`: host design-system mappings and justified exceptions;
- `figma.md`: optional verified file and node references when the workspace uses Figma.

Include loading, empty, error, success, disabled, permission, and partial-success states when they
apply. Reuse the target product's components and tokens before introducing new primitives.

## Rules

- Do not modify raw sources or product contracts.
- Do not invent backend behavior to make a design work.
- Do not claim a design-tool reference exists unless it was verified.
- Treat token-breaking changes as explicit compatibility decisions.
- Record a contract gap as feedback and hand it back to `productloom-spec`.

## Validate

Run:

```bash
productloom validate --gate design
productloom validate --gate implementation-readiness
```
