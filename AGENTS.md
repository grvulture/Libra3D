# Libra3D developer guide

Project root: `/home/grvulture/projects/libra3d`

## Stack

- Frontend: React 19, React Router 7, Create React App/CRACO, Tailwind CSS, shadcn/Radix UI, React Query, axios, React Context.
- Backend: FastAPI, Motor, Pydantic, Uvicorn.
- Database: MongoDB, configured through `backend/.env`; development uses MongoDB Atlas. No local MongoDB is installed.
- Tests: backend pytest; frontend Jest via CRA/CRACO.

## Implementation status

- Products, admin authentication, support tickets, and orders are connected to the FastAPI/MongoDB backend.
- Admin dashboard, product management, order management, and ticket management are implemented for authorized roles.
- Checkout persists orders with server-calculated totals.
- Informational/showcase pages and the dashboard's mock revenue/request data remain prototype content.

## Run locally

Backend:

```bash
cd ~/projects/libra3d/backend
./venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
```

Frontend, in a separate terminal:

```bash
cd ~/projects/libra3d/frontend
npm start
```

URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/`

## Environment variables

Never commit, print, or share `.env` values. Configure by name only.

Backend:
- `MONGO_URL`
- `DB_NAME`
- `CORS_ORIGINS`
- `ENVIRONMENT`
- `SESSION_COOKIE_SECURE`
- `SESSION_TTL_SECONDS`
- `SUPPORT_EMAIL`
- `FRONTEND_BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `SMTP_USE_TLS`
- `SMTP_USE_SSL`
- `ENABLE_DB_TIMING`

Frontend:
- `REACT_APP_API_URL` (defaults to `http://localhost:8000`)

## Backend API areas

All API routes use the `/api` prefix.

- Public/product: `GET /api/products`, `GET /api/products/{product_id}`
- Auth/session: `/api/auth/csrf`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `POST /api/auth/password`
- Admin products: `/api/admin/products` (GET, POST, PATCH)
- Tickets: public ticket creation/access endpoints and admin/support ticket endpoints under `/api/admin/tickets`
- Orders: `POST /api/orders`; admin order endpoints under `/api/admin/orders`
- Status checks: `/api/status`

## Role boundaries

- `admin`: full dashboard, product management, order management, ticket management, and admin settings.
- `support`: ticket management only. Product and order management endpoints require `admin`.
- Authorization is enforced in backend dependencies, not only by hiding frontend navigation.
- Frontend route guards mirror these restrictions but are not the security boundary.

## Data flows

Products:
- Storefront product display uses `frontend/src/api/products.js` and `frontend/src/hooks/useProducts.js`.
- Backend reads from MongoDB collection `products` using `MONGO_URL` and `DB_NAME`.
- Responses exclude `_id`.
- Seed utility: `backend/seed_products.py` reads `backend/products_seed.json`.
  - Regenerate seed JSON: `node frontend/scripts/export-products.mjs`
  - Dry run: `cd backend && ./venv/bin/python seed_products.py`
  - Apply: `cd backend && ./venv/bin/python seed_products.py --apply`
- Admin product management uses `/api/admin/products`; product changes update the same MongoDB collection read by `/api/products`.
- The initial import inserted 8 products. Reruns are idempotent and skip existing documents.

Orders:
- Checkout calls `POST /api/orders`; prices, shipping, and totals are calculated from MongoDB product data.
- Product prices are VAT-inclusive gross prices. Persisted totals are gross subtotal plus shipping. No VAT breakdown or 24% tax is calculated.
- Shipping is €8.50 below a €75 gross item subtotal and free at or above €75. Empty carts are rejected.
- `payment_status` remains `not_integrated`; payment is not integrated and no card data is collected or stored.
- Admin-only endpoints: `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `POST /api/admin/orders`, `PATCH /api/admin/orders/{id}`.
- Optional `client_order_id` provides checkout idempotency.

Tickets:
- Contact submissions create a persisted ticket and first customer message.
- Admin/support manage tickets, replies, priority, and status.
- Guest access uses expiring hashed access links and guest sessions; ticket IDs alone do not authorize access.
- Notifications are persisted with delivery status and retry support. SMTP delivery depends on configured provider settings.

Auth:
- Shared `users` collection with `admin` and `support` roles.
- Sessions are server-side and cookie-based, with CSRF protection.
- Bootstrap is one-time and refuses to run if admins already exist.
- Support accounts can be provisioned separately by CLI.
- Authenticated password change is available at `/account/password`.

## Maintenance commands

Seed products:

```bash
cd backend
./venv/bin/python seed_products.py
./venv/bin/python seed_products.py --apply
```

Bootstrap initial admins (one-time; prompts securely; refuses if admins exist):

```bash
cd backend
./venv/bin/python bootstrap_admins.py
```

Provision a support account:

```bash
cd backend
./venv/bin/python provision_support.py
```

Password change:
- Route: `/account/password`
- Requires current password and a new password meeting the existing policy.
- Other active sessions are revoked; the current session remains valid.

## Tests and build

Backend:

```bash
cd backend
./venv/bin/pytest tests -q
```

Frontend:

```bash
cd frontend
CI=true npm test -- --watchAll=false
npm run build
```

## Known limitations

- No real MongoDB integration or concurrency tests; tests use in-memory fakes.
- Payment processing is not integrated; no card data is collected or stored.
- SMTP delivery is not claimed to be verified unless provider settings are configured.
- Support account management is CLI-only; no management UI exists.
- Categories are validated against a backend allowlist matching frontend constants.
- No image upload pipeline exists; images are URL references.
