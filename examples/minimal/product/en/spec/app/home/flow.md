---
id: storefront.en.spec.app.home.flow
title: Storefront Home Flow
doc_type: flow
product: app
locale: en
status: approved
version: 1.0.0
owners: []
created: 2026-07-30
updated: 2026-07-30
source_refs: ["product/en/spec/app/home/spec.md"]
---

# Storefront Home Flow

```mermaid
flowchart TD
    Open["Open home"] --> Load["Load products"]
    Load --> Success["Show products"]
    Load --> Empty["Show empty state"]
    Load --> Error["Offer retry"]
```

## Changelog

- 1.0.0 (2026-07-30): Initial approved flow.
