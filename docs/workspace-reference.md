# Workspace reference

ProductLoom reads `.productloom/workspace.json` from the current directory or the nearest parent.

```json
{
  "$schema": "../schemas/workspace.schema.json",
  "schemaVersion": 1,
  "name": "Storefront",
  "namespace": "storefront",
  "profile": "default",
  "locales": ["en"],
  "products": ["app"],
  "canonical": {
    "provider": "github",
    "defaultBranch": "main",
    "completion": {
      "requirePullRequest": true,
      "requireCiPass": true,
      "requireMerge": true
    }
  },
  "documents": {
    "root": "product",
    "paths": {
      "raw": "{root}/{locale}/raw",
      "spec": "{root}/{locale}/spec/{product}/{screen}",
      "design": "{root}/{locale}/design/{product}/{screen}"
    },
    "idPattern": "{namespace}.{locale}.{layer}.{product}.{screen}.{docType}",
    "localeField": "locale",
    "defaultStatus": "draft",
    "statuses": ["draft", "review", "approved", "deprecated", "superseded"]
  },
  "validation": {
    "mode": "strict",
    "requiredDesignDocs": ["plan", "components", "tokens"],
    "sourceRegistry": {
      "required": false,
      "path": "registry/sources.json"
    }
  }
}
```

## Templates

Path and ID values can use these placeholders:

- `{root}`
- `{namespace}`
- `{locale}`
- `{product}`
- `{screen}`
- `{layer}`
- `{docType}`

Segments supplied through CLI flags accept letters, numbers, dots, underscores, and hyphens.

## Locale field

New workspaces use `locale`. Existing document sets can choose another frontmatter key, such as
`country`, through `documents.localeField`.

## Completion policy

The `canonical.completion` block records what “complete” means for the workspace. Workflow skills
must not claim canonical completion until the configured requirements are satisfied.

## Source registry

A source registry is optional. When required, ProductLoom expects JSON with a `files` array.
Entries marked with `"imported": true` must point to an existing workspace path.

Do not place credentials, access tokens, or private connector configuration in this file.
