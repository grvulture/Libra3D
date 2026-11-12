# Libra3D — 3D Printing Marketplace

Premium e-commerce marketplace prototype for **LIBRA 3D PRINTING**, a Greece-based studio. Customers browse, filter, view and buy 3D-printed products; submit custom-print briefs; and check out. Frontend is a React showcase/vitrine backed by mocked data; a FastAPI + MongoDB backend template ships alongside but is not yet wired to the UI.

## Description

Libra3D is a dark, luxury-styled 3D-printing storefront. It presents a catalogue of 3D-printed goods across seven categories, with a full filterable shop, product detail pages, a persisted cart drawer, a checkout placeholder, a custom-orders form with file-upload placeholder, an admin dashboard mockup, and informational pages. The UI is bilingual (Greek/English) with multi-currency (EUR/USD) support, defaulting to Greek + EUR. State is managed with React Context and persisted to `localStorage`.

## Backend & Frontend Start Guides

### Prerequisites

- Node.js (tested with Node 24) + npm

- Python 3.11+ with `backend/venv`

- MongoDB (Atlas or local) — configured via `backend/.env`

### Backend (FastAPI)

```
cd backend
cp .env.example .env  # if present; otherwise create MONGO_URL, DB_NAME, CORS_ORIGINS
./venv/bin/pip install -r requirements.txt
./venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
```

- API base: http://localhost:8000/api/

- Health: http://localhost:8000/api/ (returns `{"message":"Hello World"}`)

### Support account provisioning (non-destructive)

```bash
cd backend
./venv/bin/python provision_support.py
```

Prompts securely for one support account, creates only the `support` role, and refuses duplicate emails. The initial two-admin bootstrap remains unchanged.

### Seed products (non-destructive)

```
cd backend
./venv/bin/python seed_products.py          # dry run
./venv/bin/python seed_products.py --apply  # insert missing products only
```

The importer reads `backend/products_seed.json`, which can be regenerated from `frontend/src/data/products.js` with `node frontend/scripts/export-products.mjs`. It inserts only products whose stable `id` is missing and reports conflicts instead of overwriting existing documents.

### Frontend (React / CRA)

```
cd frontend
npm install --legacy-peer-deps
npm start
```

- App: http://localhost:3000

### Environment

`backend/.env` must define `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`. Never commit or share it.

## Features

- Homepage: hero banner, featured categories (bento), best sellers, value props, new arrivals, CTA band, marquee

- Shop: 6 filter dimensions (Category, Material, Price, Color, Availability, Rating) + 4-way sort + URL category param + currency-aware price filter

- 7 category cards: Home Decor, Desk Accessories, Miniatures & Models, Replacement Parts, Tools & Gadgets, Gifts, Custom Prints

- Product detail: image gallery, color/qty selectors, tabs, related products

- Cart drawer + localStorage-persisted cart

- Checkout flow with shipping + payment placeholder + Greek-locale-aware success state

- Custom orders form with file upload placeholder

- Contact form, About, Admin dashboard mockup (stats, charts, tables)

- Footer with logo, links, contact, socials

- Bilingual i18n (EN/EL) + multi-currency (EUR/USD); default Greek + EUR

- Sticky scroll-aware navbar, mobile menu, cart badge

- Toasts (sonner), data-testid attributes on interactive elements

## Technology Stack

- Frontend: React 19, react-router-dom 7, Tailwind CSS, Shadcn UI (Radix), Framer Motion, lucide-react, sonner, react-hook-form, recharts

- State: React Context (CartContext, LocaleContext) with localStorage persistence

- Backend: FastAPI, Motor (async MongoDB), Pydantic, Uvicorn

- Database: MongoDB (Atlas in dev)

- Tooling: Create React App (react-scripts), CRACO, PostCSS, ajv 8 (Node 24 compat)

## Project Structure

```
libra3d/
├── backend/            # FastAPI template (server.py, requirements.txt, .env)
├── frontend/           # React CRA app
│   ├── src/
│   │   ├── components/ # Navbar, Footer, CartDrawer, Layout, ProductCard, LocaleSwitcher, ui/
│   │   ├── context/    # CartContext, LocaleContext
│   │   ├── data/       # products.js, translations.js
│   │   ├── pages/      # Home, Shop, Categories, ProductDetail, CustomOrders, Checkout, About, Contact, Admin
│   │   └── index.css   # global styles + brand fonts
│   └── tailwind.config.js
├── memory/PRD.md       # product requirements
├── design_guidelines.json
├── AGENTS.md
└── README.md
```

## Design System

- Theme: dark, luxury/premium industrial (archetype 5)

- Primary background (petrol/teal): `#0E5A5C` (default), `#0F5E60` (paper), `#0A4143` (dark)

- Accent (metallic gold): `#D4A53A` (hover `#C9A249`, foreground black)

- Text: primary `#FFFFFF`, secondary `#E0E0E0`, muted `#A0B5B6`

- Borders: `rgba(212,165,58,0.2)` default, `rgba(212,165,58,0.5)` hover

- Typography: headings "Cabinet Grotesk" (900/800/700/500/400), body "Outfit" (300–700). Imported via Fontshare + Google Fonts.

- Hierarchy: h1 `text-5xl lg:text-6xl font-black tracking-tighter`; h2 `text-3xl lg:text-4xl font-bold tracking-tight`; h3 `text-xl lg:text-2xl font-bold`; body `text-base leading-relaxed text-gray-200`; label `text-sm uppercase tracking-[0.2em] text-[#D4A53A]`

- Layout: container `max-w-7xl mx-auto px-6 lg:px-12`; section padding `py-20 lg:py-32`; grids bento 1/3/4, shop 1/2/3/4

- Components: sharp corners (`rounded-none`), backdrop-blur sticky header, gold glow on buttons, card image scale on hover

## Notes / Knowledge

- Default locale is Greek + EUR (Greece-based studio); prices are EUR-base converted via rate table in `LocaleContext`.

- `emergentintegrations` (in requirements.txt) is unavailable and not imported by `server.py`.

- `ajv@8.11.0` added as dev dependency for Node 24 compatibility.

- Frontend installed with `npm install --legacy-peer-deps`.

- MongoDB Atlas used via `backend/.env`; no local DB installed.

- `.env` files are gitignored; never commit secrets.

- Backlog (P1): wishlist, search overlay, Stripe payments, image zoom, functional admin with MongoDB. P2: URL filter persistence, skeleton loaders, recently viewed, newsletter, page transitions.

- If converting to full-stack: scaffold MongoDB models for Product, Order, CustomRequest, then wire to existing UI.

