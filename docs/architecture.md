# Architecture

ProductLoom separates deterministic validation from workflow guidance and organization policy.

## Layers

### Core CLI

The CLI owns configuration loading, path generation, document parsing, reference checks, lifecycle
gates, diagnostics, and exit codes. It uses only Node.js built-in modules.

### Codex plugin

The plugin provides seven focused skills:

- `productloom-orchestrate`
- `productloom-ingest`
- `productloom-spec`
- `productloom-design`
- `productloom-implement`
- `productloom-validate`
- `productloom-audit`

Skills use the CLI for deterministic decisions and use connected tools only when the task requires
external evidence or an authorized write.

### Workspace profile

`.productloom/workspace.json` holds values that vary by organization or product:

- locale and product names;
- paths and document identifiers;
- allowed statuses;
- canonical branch and completion policy;
- optional source registry requirements.

The core never assumes a country, product name, source provider, backend language, or frontend
framework.

### Optional adapters

Repository hosts, source systems, design tools, code analyzers, frontend generators, and
notification services remain optional. A missing adapter cannot silently turn an unverified check
into a pass.

## Invariants

- Source material is not an implementation contract.
- Product contracts do not own design output.
- Design plans do not rewrite product contracts.
- Implementation requires an explicit readiness result.
- Approval and validation remain separate.
- Automated checks are read-only unless a command explicitly documents a write.

## Compatibility

`compat` mode preserves the lightweight structural checks expected by existing CWS workspaces.
`strict` mode adds schema, pair, reference, version, and readiness checks.

A migration should initially run `compat` as a blocking CI job and `strict` as report-only. Rules
can move to blocking after the baseline is reviewed.
