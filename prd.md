# 🧴 PRD: Terramar Brands Product Catalog Scraper

## tl;dr

Apify Actor that scrapes the full product catalog from [https://www.terramarbrands.com.mx/products](https://www.terramarbrands.com.mx/products) — a Mexican beauty-products-by-catalog e-commerce site. Uses the site's public WCF API to fetch department lists and product data, then enriches each item with image URLs from the CDN. Outputs ~225 products as clean, normalized JSON via Apify's default dataset.

---

## 🎯 Goals

- **Complete Catalog Coverage**: Scrape all ~225 products across 10 departments via the public API
- **Structured Extraction**: Output normalized product records with SKU, name, price, categories, description, and images
- **No Browser Required**: Use plain HTTP requests to call the WCF API directly — 10x faster and cheaper than Playwright
- **Cost-Effective Runs**: Minimal compute — a few HTTP requests return the entire catalog
- **Incremental Support**: Leverage Apify request deduplication so re-runs only process new/changed products

## 👤 User Stories

- As a **pricing analyst**, I want up-to-date product prices so I can track competitor pricing and market changes
- As a **marketplace operator**, I want structured product data (SKUs, images, descriptions) so I can create or update listings on other platforms
- As a **data engineer**, I want clean JSON output from an Apify dataset so I can pipe it into downstream workflows (databases, reports, dashboards)
- As a **business stakeholder**, I want the scraper to run on a schedule with no manual intervention so I always have fresh data

## 🔄 Scraping Flow

```text
1. Actor receives startUrls (default: https://www.terramarbrands.com.mx/products)
   ↓
2. CATALOG handler calls GET /getDeptos → returns 10 departments with subcategories
   ↓
3. CATALOG handler enqueues each department via GET /getDescripciones?depto={id}
   ↓
4. DETAIL handler parses each product from the API response, enriches with image URLs
   ↓
5. Products grouped by clave — variants (same name, different shade) aggregated
   ↓
6. Pushed as structured JSON items to Apify default dataset
   ↓
7. Output available via API, CSV, Excel, or JSON download
```

## 📚 References

- [Terramar Brands](https://www.terramarbrands.com.mx/products) — Target product catalog
- [Implementation details →](./implementation.md) — Technical architecture, API endpoints, crawler strategy
- [Data model →](./data-model.md) — Raw API fields, normalized output schema, Apify schema files
- [Apify SDK Docs](https://docs.apify.com/sdk/js) — Apify JavaScript SDK
- [Crawlee Docs](https://crawlee.dev) — Crawlee web scraping framework