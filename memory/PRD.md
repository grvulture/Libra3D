# LIBRA 3D PRINTING — Marketplace Prototype PRD

## Original Problem Statement
Modern responsive marketplace prototype for "LIBRA 3D PRINTING" — a premium e-commerce site where customers browse, filter, view and buy 3D-printed products. Preserve the petrol/teal background and metallic-gold brand identity from the provided logo/header. Frontend-only prototype with mocked data.

## Architecture
- React 19 + react-router 7 (frontend only)
- State: React Context (CartContext) with localStorage persistence
- Styling: Tailwind CSS + Shadcn UI components, custom CSS variables for brand palette
- Fonts: Cabinet Grotesk (heading) + Outfit (body)
- Icons: lucide-react
- Toast: sonner
- Backend: untouched (FastAPI template), not used by this prototype

## Brand
- Petrol/teal background: #0E5A5C / #0F5E60 / #0A4143
- Metallic gold accent: #D4A53A
- Logo & header image: provided assets (used in nav, footer, hero)

## User Personas
- Browser/buyer: discovers products via grid + filters, adds to cart, checks out
- Custom client: submits brief via custom-orders form
- Studio admin: previews dashboard (mockup only)

## Core Requirements (Static)
1. Homepage with hero (header image), CTAs, categories, best sellers, custom-prints promo, value props, new arrivals, CTA band
2. Shop with full filter sidebar (Category, Material, Price, Color, Availability, Rating) + sort dropdown
3. Category cards (7) — Home Decor, Desk Accessories, Miniatures & Models, Replacement Parts, Tools & Gadgets, Gifts, Custom Prints
4. Product detail (gallery, info, color/qty, add to cart, tabs, related)
5. Cart drawer + checkout placeholder
6. Custom orders form with file upload placeholder
7. Admin dashboard mockup (stats, charts, tables)
8. Footer with logo, links, contact, socials

## What's Been Implemented (Feb 2026)
- ✅ All 9 routes + bilingual i18n (EN/EL) + multi-currency (EUR/USD)
- ✅ LocaleContext with lazy useState initializer (race-free localStorage persistence)
- ✅ LocaleSwitcher in navbar (desktop + mobile) with language + currency sections
- ✅ Default: Greek + EUR (Greece-based studio targeting Greek customers)
- ✅ formatPrice() uses Intl.NumberFormat with proper locale formatting ('38,00 €' in Greek, '$41.04' in English)
- ✅ Translations cover nav, hero, all section headings, CTAs, all form labels/validation/success states, cart, checkout, custom orders, contact, about, admin, footer
- ✅ Prices everywhere (cards, detail, cart, checkout, admin) convert via EUR-base + rate table
- ✅ Sticky navbar with scroll-aware blur, mobile menu, cart badge
- ✅ Home page with 6 sections + marquee + animated entrance
- ✅ Shop with 6 filter dimensions + 4-way sort + URL category param + currency-aware price filter
- ✅ Categories page (7 cards, bento layout, Greek/English titles)
- ✅ Product detail with image gallery, color/qty selectors, tabs, related products
- ✅ Cart drawer + localStorage-persisted cart
- ✅ Checkout flow with shipping + payment placeholder + Greek-locale-aware success state
- ✅ Custom orders form, Contact form, About, Admin dashboard mockup — all bilingual
- ✅ Frontend testing: iteration_1 100% pass; iteration_2 12/13 pass → persistence bug fixed → verified manually

## Recent Updates
- Feb 2026: Added bilingual (EN/EL) + bicurrency (EUR/USD) support. Default Greek + EUR.

## Prioritized Backlog
### P1 (next features the user may want)
- Wishlist / favorites
- Search overlay (currently search icon routes to /shop)
- Real Stripe payment integration
- Product image zoom on detail page
- Functional admin (add/edit/delete products) with MongoDB

### P2 (polish)
- Persist filter state in URL across all dimensions (currently only category)
- Skeleton loaders for slow images
- Recently viewed products row on detail page
- Newsletter signup section in footer
- i18n / multi-currency
- Page transitions with framer-motion

## Next Tasks
- Await user feedback before scoping P1 items
- If converting to full-stack: scaffold MongoDB models for Product, Order, CustomRequest, then wire to existing UI
