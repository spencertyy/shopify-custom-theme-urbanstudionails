# UrbanStudio Nails — Shopify Theme 2026

A fully custom Shopify storefront for **UrbanStudio Nails**, a handcrafted press-on nail brand. Built on Dawn v15.0.0 with extensive customization across sections, snippets, and theme architecture.

**Live store:** [urbanstudionails.com](https://urbanstudionails.com)

---

## Custom Features Built

### Storefront Components
| Component | File | Description |
|-----------|------|-------------|
| Brand Hero | `sections/brand-hero.liquid` | Full-width hero with animated SVG wordmark and CTA |
| Marquee Strip | `sections/marquee-strip.liquid` | Infinite scrolling text banner (SHOP NOW) |
| Product Spotlight | `sections/product-spotlight.liquid` | Featured product split layout with lifestyle image |
| Instagram Feed | `sections/instagram-feed.liquid` | 3×2 grid with per-image product handle linking + UTM |
| Lookbook Grid | `sections/lookbook-grid.liquid` | Price-free mosaic grid → lightbox with ATC |
| Gift Landing | `sections/gift-landing.liquid` | Dedicated gift page with gift card + wrap add-on |

### Product Page Enhancements
| Feature | File | Description |
|---------|------|-------------|
| Sticky Add-to-Cart | `snippets/sticky-atc.liquid` | Fixed bottom bar on mobile, appears on scroll |
| Gift Wrap Option | `sections/main-product.liquid` | Line item property checkbox for premium packaging |
| Nail Shape SVG Swatch | `snippets/product-variant-picker.liquid` | Custom SVG silhouette swatches for Almond / Coffin / Stiletto / Square / Round / Oval variants |
| Schema.org JSON-LD | `snippets/product-jsonld.liquid` | Structured data with offers, aggregateRating, brand |

### Navigation & UX
| Feature | Description |
|---------|-------------|
| GIFT nav link | Configurable header link to gift landing page |
| Cart drawer | Replaced page cart with slide-in drawer |
| Quick-add | Enabled on all featured collection cards |
| Judge.me star rating | Injected into product cards via metafield badge |

---

## Tech Stack

- **Template language:** Liquid (Shopify Online Store 2.0)
- **Styles:** Vanilla CSS, component-scoped (`component-*.css`)
- **Scripts:** Vanilla JS, no framework dependencies
- **Base theme:** Dawn v15.0.0
- **Page builder:** EComposer (integrated via `layout/ecom.liquid`)
- **Apps integrated:** Judge.me · Loloyal · Instafeed · Shopify Inbox · EComSend

---

## Project Structure

```
UrbanStudio-theme2026/
├── assets/          # CSS + JS (component-scoped)
├── config/
│   ├── settings_schema.json        # Theme settings field definitions
│   └── settings_data.example.json  # Example config (see setup)
├── layout/
│   ├── theme.liquid                # Global layout
│   └── ecom.liquid                 # EComposer page builder layout
├── sections/                       # Drag-and-drop theme sections
├── snippets/                       # Reusable Liquid partials
└── templates/                      # Page templates (JSON)
```

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/spencertyy/shopify-custom-theme-urbanstuionails-.git
cd shopify-custom-theme-urbanstuionails-

# 2. Copy example config
cp config/settings_data.example.json config/settings_data.json

# 3. Login to Shopify CLI
shopify auth login

# 4. Start local dev server
shopify theme dev --store YOUR_STORE.myshopify.com
```

---

## Optimization Work

Performance and conversion improvements implemented:

- **LCP:** First slideshow image uses `fetchpriority="high"` + `loading="eager"`; subsequent slides lazy-loaded with full `srcset` (375–3840px)
- **Conversion:** Cart drawer, quick-add on all collection cards, sticky mobile ATC
- **SEO:** Schema.org Product JSON-LD with offers + aggregateRating on all product pages
- **Code health:** Removed orphaned EComposer sections and assets; eliminated duplicate template files

---

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Production-stable |
| `zachAuth` | Active development |
