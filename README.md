# Terramar Brands Product Scraper

Scrapes the full product catalog from [terramarbrands.com.mx](https://terramarbrands.com.mx/products) — a Mexican beauty-products-by-catalog e-commerce site. Calls the site's public WCF API directly (no browser needed), normalizes ~225 products across 10 departments, and outputs structured JSON to an Apify dataset.

## How to use

1. Run this Actor on [Apify](https://apify.com) or locally with `apify run`
2. Download results as JSON, CSV, or Excel from the dataset

No configuration required — defaults work out of the box.

## Input

| Field | Type | Default | Description |
|---|---|---|---|
| `baseUrl` | string | `https://terramarbrands.com.mx` | Site base URL (used to construct product/image URLs) |
| `apiBaseUrl` | string | `https://terramarbrands.mx/wsTerramarV2/Service1.svc` | WCF API base URL |
| `maxRequestsPerCrawl` | integer | `50` | Safety limit (only ~10 API calls needed) |
| `proxyConfiguration` | object | `{ useApifyProxy: false }` | Proxy settings (not needed — public API) |

## Output

Each dataset item:

```json
{
    "sku": "A",
    "name": "Maquillaje Compacto 11.5g",
    "price": 630,
    "currency": "MXN",
    "departmentId": "1",
    "department": "Color",
    "subdepartmentId": "1",
    "subdepartment": "Rostro",
    "description": "Brinda al cutis una apariencia perfecta.",
    "application": "Pasar la esponja en el compacto.",
    "ingredients": "Vitamina E - Actividad antioxidante.",
    "olfactiveFamily": "",
    "imageUrls": ["https://terramarbrands.com.mx/pics/productos/grandes/A.png"],
    "hasCarousel": true,
    "variantClass": "",
    "url": "https://terramarbrands.com.mx/products/product/A"
}
```

## Cost estimate

One run costs less than 0.01 compute units — the entire catalog is fetched in a few HTTP calls with no browser rendering.

## Local development

```bash
npm install
npm run start:dev     # Run locally with tsx
npm test              # Run test suite
npm run validate      # Validate Apify schemas
npm run predeploy     # Validate + test + lint before deploy
```