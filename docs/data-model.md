---
last_modified: 2026-05-07
---

# 📊 Data Model: Terramar Brands Scraper

## Raw API Response (from `/getDescripciones`)

The API returns a flat array of product objects with **16 fields**. Each variant/shade is a **separate entry** (same `producto` name, different `clave` and `clase`):

```jsonc
{
  "id": "0",                                    // Always "0"
  "clave": "A",                                 // Product SKU / code (unique per variant)
  "producto": "Maquillaje Compacto 11.5g",      // Product name (Spanish)
  "precio": "630",                               // Price in MXN (integer string, no decimals)
  "descripcion": "<p>Brinda al cutis...</p>",    // HTML product description
  "aplicacion": "<p>Pasar la esponja...</p>",    // HTML application/usage instructions
  "ingredientes": "<p><strong>Vitamina E</strong>...</p>", // HTML ingredients info
  "familiaOlfativa": "",                         // Olfactory family (fragrances only, 4 products)
  "perfumista": "",                               // Perfumer name (1 product only)
  "link": "",                                     // URL slug (1 product only, otherwise empty)
  "departamento": "1",                           // Department code (1-10)
  "subdepartamento": "1",                         // Subdepartment code
  "marca": "",                                    // Brand name (3 products only, mostly empty)
  "clase": "",                                    // Variant/shade class (30 products)
  "imagen": "",                                   // Image URL (30 products; pattern: /pics/productos/grandes/{N}.png)
  "carrusel": "S"                                 // "S" = has image carousel (95 products), "" = no carousel
}
```

### Field Statistics

| Field | Type | Non-empty Count | Notes |
|---|---|---|---|
| `id` | string | 225/225 | Always `"0"` |
| `clave` | string | 225/225 | Unique SKU code (alphanumeric: "A", "B", "42008", etc.) |
| `producto` | string | 225/225 | Product name; 213 unique names (12 are variant duplicates) |
| `precio` | string | 225/225 | Integer string, range 170–1670 |
| `descripcion` | string | 225/225 | HTML string |
| `aplicacion` | string | 225/225 | HTML string |
| `ingredientes` | string | 225/225 | HTML string |
| `familiaOlfativa` | string | 4/225 | Olfactory family (fragrances only) |
| `perfumista` | string | 1/225 | Perfumer name |
| `link` | string | 1/225 | URL slug |
| `departamento` | string | 225/225 | Department code 1–10 |
| `subdepartamento` | string | 225/225 | Subdepartment code |
| `marca` | string | 3/225 | Brand name |
| `clase` | string | 30/225 | Variant/shade class number |
| `imagen` | string | 30/225 | Only 14 unique image URLs (category placeholders) |
| `carrusel` | string | 95/225 | `"S"` = has carousel, `""` = no carousel |

### Variant Handling

Products with multiple variants share the same `producto` name but have different `clave` and `clase` values:

| `producto` | Variants | `clase` values |
|---|---|---|
| Star Glow Brillo Labial Oleoso Efecto Volumen 10g | 5 entries | 1, 0, 2, 3, 4 |
| Star Glow Corrector Iluminador 9g | 5 entries | 1–5 |
| Rubor en Crema acabado Piel Star Glow (5g) | 3 entries | 7, 8, 9 |
| Rubor en Polvo Matizante Star Glow (5g) | 2 entries | 10, 11 |
| Lapiz Delineador para Cejas, Ojos y Labios 0.8g | 2 entries | — |

---

## Normalized Output Schema

Each product pushed to the Apify dataset:

```jsonc
{
  "sku": "A",                                                    // From clave
  "name": "Maquillaje Compacto 11.5g",                           // From producto
  "price": 630,                                                  // From precio (integer)
  "currency": "MXN",                                             // Fixed
  "departmentId": "1",                                           // From departamento
  "department": "Color",                                         // Resolved from /getDeptos lookup
  "subdepartmentId": "1",                                        // From subdepartamento
  "subdepartment": "Rostro",                                     // Resolved from /getDeptos secciones lookup
  "description": "Brinda al cutis una apariencia perfecta...",    // From descripcion (HTML stripped)
  "application": "Pasar la esponja en el compacto...",           // From aplicacion (HTML stripped)
  "ingredients": "Vitamina E - Gracias a su actividad...",       // From ingredientes (HTML stripped)
  "olfactiveFamily": "",                                         // From familiaOlfativa
  "imageUrls": [                                                 // Constructed image URLs
    "https://www.terramarbrands.com.mx/pics/productos/grandes/A.png"
  ],
  "hasCarousel": true,                                           // From carrusel === "S"
  "variantClass": "",                                            // From clase
  "url": "https://www.terramarbrands.com.mx/products/product/A" // Constructed from SPA route
}
```

### Transformation Rules

| Output Field | Source | Transformation |
|---|---|---|
| `sku` | `clave` | Direct mapping |
| `name` | `producto` | Direct mapping |
| `price` | `precio` | Parse string to integer (`parseInt`) |
| `currency` | — | Fixed value `"MXN"` |
| `departmentId` | `departamento` | Direct mapping |
| `department` | `/getDeptos` | Lookup `departamento` → `nombre` (filter `menu=3`) |
| `subdepartmentId` | `subdepartamento` | Direct mapping |
| `subdepartment` | `/getDeptos` secciones | Lookup `departamento` + `subdepartamento` → `nombre` |
| `description` | `descripcion` | Strip HTML tags, trim whitespace |
| `application` | `aplicacion` | Strip HTML tags, trim whitespace |
| `ingredients` | `ingredientes` | Strip HTML tags, trim whitespace |
| `olfactiveFamily` | `familiaOlfativa` | Direct mapping |
| `imageUrls` | `clave` | Construct: `https://www.terramarbrands.com.mx/pics/productos/grandes/{clave}.png` |
| `hasCarousel` | `carrusel` | Boolean: `carrusel === "S"` |
| `variantClass` | `clase` | Direct mapping |
| `url` | `clave` | Construct: `https://www.terramarbrands.com.mx/products/product/{clave}` |

### Image URL Construction

Product images follow predictable URL patterns. The API `imagen` field is sparse (30/225 products) and contains generic placeholder images. The Actor should:

1. **Primary**: Construct image URL using `clave`: `https://www.terramarbrands.com.mx/pics/productos/grandes/{clave}.png`
2. **Alternative CDN**: Try `https://webimages.terramarbrands.com.mx/webpage/productos/{clave}.jpg`
3. **Fallback**: If `imagen` field is non-empty, include it as a secondary image

### Department Lookup Map

Built from the `/getDeptos` response (filtered to `menu=3`):

```jsonc
{
  "1": { "name": "Color", "subdepartments": { "1": "Rostro", "2": "Ojos", "3": "Labios", "4": "Uñas", "5": "Desmaquillantes", "6": "Labios Mate" } },
  "2": { "name": "Fragancias", "subdepartments": { "1": "Él", "2": "Ella", "3": "Bebé", "4": "Niña", "5": "Niño" } },
  "3": { "name": "Cuidado Capilar", "subdepartments": { "1": "Cuidado Capilar" } },
  "4": { "name": "Cuidado de la Barba", "subdepartments": { "1": "Cuidado de la Barba" } },
  "5": { "name": "Cuidado de la Piel", "subdepartments": { "1": "Limpieza", "2": "Hidratación", "3": "Ojos", "4": "Especiales Anti-Edad", "5": "Control de Grasa", "9": "Protección Solar" } },
  "6": { "name": "Cuerpo", "subdepartments": { "1": "Cuerpo" } },
  "7": { "name": "Antitranspirantes", "subdepartments": { "1": "Ella", "2": "Él" } },
  "8": { "name": "Higiene Íntima", "subdepartments": { "1": "Regular", "2": "Menopausia", "3": "Período Femenino", "4": "Masculina" } },
  "9": { "name": "Summer Glow", "subdepartments": { "1": "Summer Glow", "2": "Star Glow" } },
  "10": { "name": "CC Cream", "subdepartments": { "1": "CC Cream" } }
}
```

---

## Apify Schema Files

### Input Schema (`.actor/input_schema.json`)

| Field | Type | Default | Description |
|---|---|---|---|
| `startUrls` | `array[requestListSources]` | `[{ url: "https://www.terramarbrands.com.mx/products" }]` | Entry point URLs |
| `maxRequestsPerCrawl` | `integer` | `50` | Safety limit (only ~10 API calls needed) |
| `proxyConfiguration` | `proxy` | `{ useApifyProxy: false }` | Proxy settings (not needed — public API) |
| `extendOutputFunction` | `string` | `""` | Optional JS function to add/modify fields per item |

### Dataset Schema (`.actor/dataset_schema.json`)

Overview view with columns: `sku`, `name`, `department`, `price`, `currency`, `url`

### Output Schema (`.actor/output_schema.json`)

Links to the default dataset items API endpoint.

---

## Price Formatting

Prices are integer strings in MXN with no decimals. The frontend formats them using:

```javascript
new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 })
```

Example: `"630"` → `$630`