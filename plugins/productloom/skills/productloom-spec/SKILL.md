---
name: productloom-spec
description: Create or update ProductLoom product contracts and flows from traceable source material plus code or runtime evidence. Use when documenting behavior, APIs, data, permissions, errors, compatibility, state transitions, or when source requirements must become implementation-grounded spec.md and flow.md files.
---

# ProductLoom Spec

Write product contracts that describe verified behavior without taking ownership of design or
implementation.

## Preconditions

1. Read `.productloom/workspace.json`.
2. Confirm locale, product, screen, source paths, and target repositories.
3. Require traceable raw sources or an explicit user request grounded in current code.
4. Inspect the real route, handler, model, persistence, integration, tests, and runtime evidence
   needed for the requested contract.

Prefer current code and verified runtime behavior over stale prose. Preserve distinctions between
gateway behavior, owning-service behavior, provider behavior, and client adaptation.

## Write

Create a connected screen set when it does not exist:

```bash
productloom new screen --product <product> --screen <screen>
```

Then update only the configured `spec.md` and `flow.md`:

- context and scope;
- inputs, outputs, permissions, and validation;
- stable state transitions and ownership;
- error and retry behavior;
- backward compatibility and exclusions;
- unresolved questions;
- source references and changelog.

Use additive changes when compatibility matters. Apply SemVer according to observable contract
impact.

## Validate

Run:

```bash
productloom validate --gate spec
```

Do not mark uncertain behavior as confirmed. Do not modify design documents or application code in
this skill.
