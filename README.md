# ProductLoom

ProductLoom weaves product intent into delivery. It keeps source material, product contracts,
design decisions, and implementation handoffs connected in one version-controlled workspace.

It includes:

- a zero-dependency command-line tool;
- a Codex plugin with focused workflow skills;
- configurable locales, product areas, paths, statuses, and completion policies;
- compatibility support for existing CWS repositories.

## Quick start

ProductLoom requires Node.js 20 or newer.

```bash
npm install --global github:hawoond/productloom

cd your-repository
productloom init
productloom new screen --product app --screen home
productloom validate
```

The initializer creates `.productloom/workspace.json` and a lightweight product document tree.
It does not change application code or contact external services.

## Install the Codex plugin

```bash
codex plugin marketplace add hawoond/productloom --ref main
codex plugin add productloom@productloom
```

Start with one of these prompts:

```text
Set up ProductLoom in this repository.
Route this product request through ProductLoom.
Validate this ProductLoom workspace.
```

## Workflow

```text
source material
  -> raw briefs and evidence
  -> product contract and flow
  -> design plan, components, and tokens
  -> implementation readiness
  -> implementation
```

An approved document and a passing gate are separate concepts. Approval records a decision;
validation checks whether the next stage has enough consistent evidence to proceed.

## Commands

| Command | Purpose |
|---|---|
| `productloom init` | Create a workspace with practical defaults |
| `productloom new screen` | Generate a connected contract, flow, and design set |
| `productloom new brief` | Capture product intent before contract work |
| `productloom validate` | Check document structure and lifecycle gates |
| `productloom audit` | Run strict reference and drift checks |
| `productloom status` | Summarize documents by product, layer, and status |
| `productloom doctor` | Check the local runtime and workspace |
| `productloom migrate --from cws` | Preview a non-destructive CWS migration |

Run `productloom help` for command options.

## Existing CWS workspace

Migration adds configuration without moving or renaming documents.

```bash
cd your-cws-repository
productloom migrate --from cws
productloom migrate --from cws --apply
productloom validate --mode compat
```

Use `compat` as the initial blocking check. Run `strict` in report-only mode until its baseline has
been reviewed.

## Configuration

ProductLoom reads `.productloom/workspace.json`. The workspace controls:

- locale and product names;
- raw, spec, and design paths;
- document ID patterns;
- default status and allowed statuses;
- source registry requirements;
- pull request, CI, and merge completion policies.

See [Workspace reference](docs/workspace-reference.md) for the complete shape and
[Architecture](docs/architecture.md) for extension boundaries.

## Validation results

- `PASS`: the requested gate can proceed.
- `WARN`: work can proceed when the risk is accepted and recorded.
- `FAIL`: required structure or traceability is missing.

Text output is designed for people. Add `--format json` for CI or other tools.

## Privacy and integrations

The CLI operates on local files and Git metadata. It has no telemetry and makes no network calls.
Source, design, repository, and notification integrations are optional responsibilities of the
installed workflow skills and the tools a user explicitly enables.

Credentials never belong in ProductLoom documents or workspace configuration.

## Development

```bash
npm test
npm run check
```

The project is licensed under the [MIT License](LICENSE).
