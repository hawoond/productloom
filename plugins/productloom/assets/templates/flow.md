---
id: {{ID}}
title: {{TITLE}} Flow
doc_type: {{DOC_TYPE}}
product: {{PRODUCT}}
{{LOCALE_KEY}}: {{LOCALE}}
status: {{STATUS}}
version: 0.1.0
owners: {{OWNERS}}
created: {{DATE}}
updated: {{DATE}}
source_refs: {{SOURCE_REFS}}
---

# {{TITLE}} Flow

## Main Flow

```mermaid
flowchart TD
    Start["User starts"] --> Validate["Validate input"]
    Validate --> Success["Show success"]
    Validate --> Error["Show recoverable error"]
```

## Alternate Flows

- Describe cancellation, retry, permission, and partial-success paths.

## State Ownership

Document which system owns each transition and persisted state.

## Changelog

- 0.1.0 ({{DATE}}): Initial flow.
