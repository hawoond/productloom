# ProductLoom

English | [한국어](README.ko.md)

ProductLoom connects product intent, source evidence, contracts, design decisions, and
implementation handoffs in one version-controlled workspace.

It includes:

- a zero-dependency CLI for deterministic workspace generation and validation;
- a Codex plugin with seven focused workflow skills;
- configurable locales, product areas, paths, document IDs, statuses, and completion policies;
- a non-destructive compatibility profile for existing CWS repositories.

The CLI only reads and writes local files. External source, design, repository, or notification
tools are used only when a user enables them through a workflow skill.

## Requirements

- Node.js 20 or newer
- Git
- GitHub CLI is optional for CLI use and recommended for repository workflows
- Codex is required only when using the plugin skills

Check the local environment after installation:

```bash
productloom doctor
```

## Five-minute setup

Install the CLI directly from GitHub:

```bash
npm install --global github:hawoond/productloom
productloom --version
```

Initialize ProductLoom in an application repository:

```bash
cd your-repository

productloom init \
  --name "Storefront" \
  --namespace storefront \
  --locales en \
  --products app
```

Capture the initial requirement and create the connected screen document set:

```bash
productloom new brief \
  --title "Home screen goals" \
  --slug home-goals \
  --product app \
  --screen home

productloom new screen \
  --product app \
  --screen home \
  --title "Home"

productloom validate --mode strict
productloom status
```

`productloom init` creates `.productloom/workspace.json` and the configured document
directories. `productloom new screen` creates:

```text
product/en/
├── raw/
│   ├── briefs/
│   ├── feedback/
│   ├── meetings/
│   └── references/
├── spec/app/home/
│   ├── spec.md
│   └── flow.md
└── design/app/home/
    ├── plan.md
    ├── components.md
    └── tokens.md
```

Existing files are skipped unless `--force` is supplied. Application source code is never changed
by `init`, `new`, `validate`, `audit`, `status`, `doctor`, or `migrate`.

## Install the Codex plugin

The CLI can be used independently. Install the plugin when you also want guided source ingestion,
contract authoring, design preparation, validation, and implementation handoff.

```bash
codex plugin marketplace add hawoond/productloom --ref main
codex plugin add productloom@productloom
codex plugin list
```

Useful starting prompts:

```text
$productloom-orchestrate Set up ProductLoom in this repository.
$productloom-ingest Turn these meeting notes into a traceable product brief.
$productloom-spec Create the contract and flow for the checkout screen.
$productloom-validate Check implementation readiness for the checkout screen.
```

The skills do not replace CLI validation. They use the CLI as the deterministic source for
workspace and readiness results.

## Recommended workflow

### 1. Capture source material

Use raw documents for evidence that is useful but not yet an implementation contract:

```bash
productloom new brief \
  --title "Checkout objective" \
  --slug checkout-objective \
  --product app \
  --screen checkout \
  --owners product,engineering

productloom new meeting \
  --title "Checkout review" \
  --slug checkout-review \
  --product app \
  --screen checkout

productloom new reference \
  --title "Payment API reference" \
  --slug payment-api \
  --product app \
  --screen checkout

productloom new feedback \
  --title "Mobile checkout feedback" \
  --slug mobile-checkout \
  --product app \
  --screen checkout
```

Meeting filenames include the current date. Other raw document filenames use the supplied slug.
When `--locale`, `--product`, or `--screen` is omitted, ProductLoom uses the first configured
locale and product and the `general` screen.

### 2. Create a screen contract bundle

```bash
productloom new screen \
  --locale en \
  --product app \
  --screen checkout \
  --title "Checkout" \
  --owners product,design,engineering
```

This creates the contract and flow alongside design plan, component, and token documents. The files
are linked through stable document IDs and `source_refs`.

### 3. Refine the documents

- Put observable behavior, permissions, data, errors, and compatibility rules in `spec.md`.
- Put user and system transitions, alternatives, retries, and failure paths in `flow.md`.
- Put responsive states, accessibility, and interaction decisions in `plan.md`.
- Map reusable UI building blocks in `components.md`.
- Record semantic design-token mappings in `tokens.md`.
- Keep evidence in raw documents and reference it instead of copying unsupported claims.

Document `status` and validation are separate. A status records a decision; validation checks
whether the document set is structurally and referentially consistent.

### 4. Validate before advancing

Run normal strict validation:

```bash
productloom validate --mode strict
```

Make warnings blocking:

```bash
productloom validate --mode strict --fail-on-warn
```

Check the implementation handoff:

```bash
productloom validate \
  --mode strict \
  --gate implementation-readiness \
  --fail-on-warn
```

Use machine-readable output in automation:

```bash
productloom validate --mode strict --format json
```

### 5. Review workspace health

```bash
productloom status
productloom status --format json
productloom audit
productloom doctor
```

- `status` groups documents by product, layer, and status.
- `audit` runs strict structural and reference checks.
- `doctor` checks Node.js, Git, optional GitHub CLI, and workspace configuration.

## Command reference

| Command | Writes files | Purpose |
|---|---:|---|
| `productloom init [path]` | Yes | Create workspace configuration and directories |
| `productloom new screen` | Yes | Create one connected spec, flow, and design bundle |
| `productloom new brief` | Yes | Capture product intent |
| `productloom new meeting` | Yes | Capture dated meeting evidence |
| `productloom new reference` | Yes | Register supporting reference material |
| `productloom new feedback` | Yes | Capture user, support, or review feedback |
| `productloom validate [path]` | No | Validate configuration, documents, pairs, and references |
| `productloom audit [path]` | No | Run strict workspace checks |
| `productloom status [path]` | No | Summarize document coverage and validation state |
| `productloom doctor [path]` | No | Check the runtime and workspace |
| `productloom migrate [path] --from cws` | Only with `--apply` | Preview or create CWS compatibility configuration |

Common options:

| Option | Meaning |
|---|---|
| `--root <path>` | Explicit workspace root |
| `--locale <name>` | Locale used for a new document |
| `--product <name>` | Product area used for a new document |
| `--screen <name>` | Screen or capability identifier |
| `--title <text>` | Human-readable document title |
| `--slug <name>` | Raw document filename stem |
| `--owners <a,b>` | Comma-separated owner names or teams |
| `--status <name>` | Initial document status |
| `--force` | Replace an existing generated file or configuration |
| `--format text\|json` | Human or machine-readable output |
| `--fail-on-warn` | Return a failure when validation has warnings |

Run `productloom help` for the built-in summary.

## Validation behavior

Modes:

- `strict` checks the configured schema, document IDs and frontmatter, spec-flow pairs, design
  documents, references, statuses, versions, and readiness requirements.
- `compat` keeps legacy CWS structural differences non-blocking where possible while still
  reporting them.

Results:

- `PASS`: no blocking diagnostic was found.
- `WARN`: there are non-blocking risks to review.
- `FAIL`: required structure or traceability is missing.

Exit codes:

- `0`: no blocking errors; warnings are allowed unless `--fail-on-warn` is set.
- `1`: validation or a required doctor check failed.
- `2`: the command or configuration could not be processed.

## Existing CWS workspace

Migration is dry-run by default. It creates a compatibility configuration only when `--apply` is
present and never moves or renames existing documents.

```bash
cd your-cws-repository

productloom migrate --from cws
productloom migrate --from cws --apply
productloom validate --mode compat
```

Recommended adoption:

1. Keep `compat` as the initial blocking check.
2. Run `strict` as report-only and review the baseline.
3. Resolve or explicitly accept legacy warnings.
4. Move strict validation into the blocking path.

## Workspace configuration

ProductLoom searches the current directory and its parents for
`.productloom/workspace.json`. The configuration controls:

- workspace name and document namespace;
- locales and product areas;
- raw, spec, and design paths;
- document ID patterns and locale frontmatter field;
- default and allowed statuses;
- required design documents;
- optional source registry;
- canonical branch, pull request, CI, and merge completion policy.

See [Workspace reference](docs/workspace-reference.md) for the full configuration and
[Architecture](docs/architecture.md) for extension boundaries.

## CI example

For a new strict workspace:

```yaml
- name: Validate ProductLoom
  run: productloom validate --mode strict --gate implementation-readiness --fail-on-warn
```

During CWS adoption:

```yaml
- name: Validate ProductLoom compatibility
  run: productloom validate --mode compat

- name: Report strict ProductLoom findings
  continue-on-error: true
  run: productloom validate --mode strict --format json
```

The repository includes a complete workflow at [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Troubleshooting

### Workspace config not found

Run the command inside the initialized repository or pass `--root`:

```bash
productloom doctor --root /path/to/repository
```

### A generated file already exists

ProductLoom protects existing content. Review the file first, then use `--force` only when replacing
it is intentional.

### Validation has warnings but exits successfully

Warnings are non-blocking by default. Add `--fail-on-warn` for a blocking local or CI check.

### A reference target is missing

`source_refs` values are workspace-relative paths. Correct the path or restore the referenced
document, then rerun strict validation.

## Privacy and integrations

The CLI has no telemetry and makes no network calls. Credentials, access tokens, personal contact
details, and private connector configuration must not be stored in ProductLoom documents or
workspace configuration.

## Development

```bash
git clone https://github.com/hawoond/productloom.git
cd productloom
npm test
npm run check
```

The project is licensed under the [MIT License](LICENSE).
