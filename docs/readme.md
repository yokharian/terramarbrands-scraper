---
last_modified: 2026-05-07
---

# Terramar Brands Scraper — Project Docs

Apify Actor that scrapes the full product catalog from [terramarbrands.com.mx](https://www.terramarbrands.com.mx/products) via the site's public WCF backend API. No browser rendering needed — plain HTTP requests fetch ~225 beauty products across 10 departments, which are normalized and pushed to an Apify dataset as structured JSON.

## Architecture

- **Crawler**: `CheerioCrawler` / plain HTTP (no Playwright — the API is public and unauthenticated)
- **Primary endpoint**: `https://terramarbrands.mx/wsTerramarV2/Service1.svc/getDescripciones?depto=0` — returns all products in one call
- **Secondary endpoint**: `/getDeptos` — department and subcategory taxonomy (used to resolve IDs → names)
- **Output**: ~225 normalized product items with SKU, name, price, department, description, images, etc.

## Docs

| File | Description |
|---|---|
| [prd.md](./prd.md) | Product requirements — goals, user stories, scraping flow |
| [implementation.md](./implementation.md) | Technical details — API endpoints, crawler strategy, department taxonomy |
| [data-model.md](./data-model.md) | Data schemas — raw API fields, normalized output, transformation rules, Apify schema files |