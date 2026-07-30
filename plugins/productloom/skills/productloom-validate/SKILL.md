---
name: productloom-validate
description: Validate ProductLoom workspace structure, frontmatter, document pairs, references, statuses, versions, and lifecycle readiness. Use before advancing from raw to contract, contract to design, design to implementation, in CI, or whenever the user asks whether ProductLoom documents are complete and consistent.
---

# ProductLoom Validate

Use the ProductLoom CLI as the deterministic source of validation results.

## Run

Read `.productloom/workspace.json`, determine the requested gate, and run:

```bash
productloom validate --gate <raw|spec|design|implementation-readiness|all>
```

Use `--mode compat` for an initial legacy baseline and `--mode strict` for schema, pair, reference,
version, and readiness checks. Use `--format json` when another tool will consume the result.

If `productloom` is unavailable on `PATH`, resolve this skill directory and run
`../../scripts/productloom.mjs` with Node.js.

## Interpret

- `PASS`: the requested gate can advance.
- `WARN`: advancement requires the risk to be visible and accepted.
- `FAIL`: stop and repair the reported requirement.

One failure makes the overall result `FAIL`. Without failures, one warning makes it `WARN`.
Document approval never overrides a validation failure.

## External Checks

Run source-provider, design-tool, repository, CI, or merge checks only when they are required by the
workspace and the corresponding tool is available. Report an unavailable external check; never
convert it into a pass.

Keep validation read-only. Do not hide warnings or fix documents unless the user separately asks
for changes.
