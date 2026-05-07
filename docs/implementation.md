---
last_modified: 2026-05-07
---

# 🛠 Implementation: Terramar Brands Scraper

## Architecture: API-First (No Browser)

The site's React SPA fetches all product data from a **public WCF backend API** with no authentication. Each API call returns the full product list for a department — no pagination needed. This means we can skip Playwright entirely and use fast, cheap HTTP requests.

**Strategy**: Use `CheerioCrawler` (or plain HTTP via `got`/`undici`) to call the API directly. No browser rendering required.

---

## Backend API (Primary Data Source)

| Endpoint | Method | Params | Returns |
|---|---|---|---|
| `https://terramarbrands.mx/wsTerramarV2/Service1.svc/getDeptos` | GET | None | Array of department objects with `depto`, `nombre`, `menu`, `secciones` |
| `https://terramarbrands.mx/wsTerramarV2/Service1.svc/getDescripciones?depto=0` | GET | `depto=0` (all) or `depto={id}` (filtered) | Array of all 225 products |
| `https://terramarbrands.mx/wsTerramarV2/Service1.svc/getDescripciones?depto=0&clave={sku}` | GET | `depto=0` + `clave={sku}` | Single product by SKU |
| `https://terrapublic.s3.amazonaws.com/mex/bannerArray.json` | GET | None | Banner/promo image assets |

**Single-call strategy**: `getDescripciones?depto=0` returns all 225 products in one request. This is the most efficient approach. Passing a specific `depto` ID filters to that department only.

---

## Crawler Implementation

### Router Pattern

Use `createCheerioRouter` (or plain HTTP handlers) with two labeled routes:

```
CATALOG  → Calls /getDeptos, enqueues per-department /getDescripciones requests
DETAIL   → Parses /getDescripciones response, transforms and pushes each product
```

### Request Flow

```text
1. RequestQueue seeded with startUrl (labeled CATALOG)
2. CATALOG handler:
   a. Fetch /getDeptos → filter to menu=3 entries (product departments only)
   b. Build department lookup map (id → name, id → subdept names)
   c. Enqueue /getDescripciones?depto={id} for each department (labeled DETAIL)
   d. Also enqueue /getDescripciones?depto=0 for full catalog (labeled DETAIL, dedup will handle overlap)
3. DETAIL handler:
   a. Parse JSON response array
   b. For each product, transform raw API fields → normalized output schema
   c. Strip HTML from description, aplicacion, ingredientes fields
   d. Resolve department/subdepartment names from lookup map
   e. Construct image URLs using clave pattern
   f. Push to dataset via Actor.pushData()
```

### Fallback: Playwright (Only if Needed)

If richer data extraction is needed (e.g., product images not available via API):

| Route | Purpose |
|---|---|
| `/products` | Product catalog listing (all departments) |
| `/products/:catid` | Products filtered by category ID |
| `/products/product/:id` | Individual product detail (id = `clave`) |
| `/digitalcatalog` | Digital catalog viewer (iPaper) |

---

## Department Taxonomy (from `/getDeptos`)

The API returns multiple entry types — only `menu=3` entries are product departments:

| `depto` | `nombre` | Subcategories (`secciones`) |
|---|---|---|
| 1 | Color | Rostro, Ojos, Labios, Uñas, Desmaquillantes, Labios Mate |
| 2 | Fragancias | Él, Ella, Bebé, Niña, Niño |
| 3 | Cuidado Capilar | Cuidado Capilar |
| 4 | Cuidado de la Barba | Cuidado de la Barba |
| 5 | Cuidado de la Piel | Limpieza, Hidratación, Ojos, Especiales Anti-Edad, Control de Grasa, Protección Solar |
| 6 | Cuerpo | Cuerpo |
| 7 | Antitranspirantes | Ella, Él |
| 8 | Higiene Íntima | Regular, Menopausia, Período Femenino, Masculina |
| 9 | Summer Glow | Summer Glow, Star Glow |
| 10 | CC Cream | CC Cream |

---

## Key Technical Details

| Aspect | Detail |
|---|---|
| Primary data source | `https://terramarbrands.mx/wsTerramarV2/Service1.svc/getDescripciones?depto=0` |
| Total products | ~225 (flat array, one entry per SKU/variant) |
| Departments | 10 product categories (menu=3 in /getDeptos) |
| Variants | Denormalized — each shade/variant is a separate `clave` with same `producto` name |
| Prices | Integer strings in MXN (range: 170–1,670), no decimal places |
| Descriptions | HTML-formatted strings (need stripping) |
| Images | Sparse in API (30/225); construct URLs using `clave` pattern, or fall back to SPA |
| Authentication | None — public API with no tokens or cookies required |
| Rate limiting | None observed |
| Tech stack | React SPA (Create React App) backed by .NET WCF SOAP-ish REST API on IBM DB2 |
| HTTP client | `superagent` (used by SPA frontend) |