# **Libra3D Admin Dashboard — Development Specification**

**Status:** Initial implementation brief for Beam  
**Project root:** `/home/grvulture/projects/libra3d`  
**Purpose:** Build a secure admin dashboard for products and orders, plus role-restricted customer-support tickets, using the existing FastAPI/MongoDB backend and React storefront.

## **1. Project context and constraints**

- The frontend is React 19 / React Router. The user reports it retrieves its mock product catalogue through the backend; verify whether the backend source is static/mock data or persistent MongoDB data. The cart is persisted in localStorage. Backend is FastAPI + Motor/MongoDB. Inspect code before making assumptions.

- Preserve visual identity, routing, bilingual behavior where practical, and customer-facing functionality.

- MongoDB is configured through `backend/.env`. **Never print, commit, copy into docs, or expose secrets from** `.env`**. Never commit** `.env`**.** Use environment variables and placeholders in `.env.example`.

- Avoid unnecessary dependency upgrades. Keep changes incremental, testable, and documented. Report files changed, tests run/results, configuration needed, and blockers at each stage.

## **2. Goals and scope**

Create a protected `/admin` area with:

1. Secure login/logout.

2. Product management: list/search/filter, categories, create/edit products.

3. Order management: view/process website orders and manually create/edit orders.

4. Support tickets: Contact submissions create tickets; agents and customers correspond on ticket pages in a persisted conversation thread. Email is notification-only. Admins manage ticket priority and solved/unsolved status.

Do not build chat integration now, but keep ticket/message boundaries extensible for future chat conversations.

## **3. Authentication, roles, and bootstrap**

- All dashboard pages and management APIs require server-side authentication; hiding UI is insufficient. Use secure password hashing, server-side verification, session expiration/logout, brute-force mitigation, and CSRF protection where cookie-based auth is used. Never store plaintext passwords or long-lived tokens in localStorage; never return password hashes.

- Use explicit role-based authorization and least privilege. Current operational roles: `admin` and `support`. Admins may access the full dashboard. Support agents may access only ticket-management functions, never product/order management or admin settings. Enforce this in backend authorization, not merely by hiding navigation. Test direct API access denial for support on non-ticket endpoints.

- Admin and support identities will share one users collection with a role field and strict RBAC. Registered customer accounts are deferred; keep the role model extensible for a future `customer` role. A ticket-access token is not a registered account.

- Provide a documented one-time/controlled CLI bootstrap for the initial two admins, with credentials supplied by the owner only at runtime. Never invent/hardcode credentials. Read securely; avoid shell history, logs, source control, and output leakage. Refuse to run after bootstrap or if admins already exist. Support-account provisioning may be documented or implemented only as needed for authorization tests; support-user management UI is out of scope unless requested.

- Customer registration, profiles, order tracking, saved carts, favorites, and customer-account management are explicitly deferred. Do not build them now. Keep future customer-account and ticket/order association in mind while retaining guest email-link access for contact inquiries.

## **4. Products and categories**

- Provide a bounded/paginated product list with search/category filtering and useful fields/status.

- Create/edit forms should match the actual model and storefront needs (at least title/name, description, price/currency, category, image references, and availability/status as applicable), with client and server validation.

- Show categories and allow selection. Add category CRUD only if warranted by existing model; avoid duplicate sources of truth.

- Preserve existing product retrieval integration. Determine whether its backend source is static/mock or MongoDB. Admin edits must update the source used by the storefront so changes appear there. Include loading/error/empty states.

- Inspect image conventions and propose a safe first iteration. Do not add public uploads without explicit validation/storage decisions.

## **5. Orders**

- Inspect actual cart/checkout behavior first. Persist submitted storefront orders; do not treat localStorage/frontend state as order persistence.

- Admin order list/detail should support bounded pagination/search/status filtering and show items, quantities, historical prices, customer/contact/shipping details available at checkout, totals, timestamps, and status/history as appropriate.

- Admins can update validated status and manually create/edit orders. Preserve audit-friendly timestamps/history; unrelated edits must not silently change historical item prices/totals.

- Validate server-side and calculate totals from canonical product prices, never browser-submitted totals. Define behavior for unavailable/deleted products. Payment processing is out of scope; label limitations clearly.

- Identify required customer/shipping fields and any tax, shipping, payment, or status decisions for the owner after inspecting current UX.

## **6. Support tickets, conversation, and notification email**

- A public Contact submission creates a ticket plus its first customer-authored message in MongoDB. Model tickets/messages with stable IDs, sender identity, subject, body, creation/update times, status, priority, and message author/type. Choose a schema supporting a full conversation; add useful indexes for ticket lookup, status, priority, and recency.

- Customers and agents correspond on the ticket page. Admins/support agents view threads and reply from the dashboard; each reply is persisted. Customers securely view/reply to their own ticket. Do not use `mailto:` or require manual synchronization with a separate email thread.

- Agreed guest access direction: send an expiring email access link when a ticket is created and provide a resend flow for expired links. During Stage 0, recommend implementation details (expiry, replay, revocation, rate limits, token hashing—store hashes, never raw tokens—link leakage/referrer risks, and safe resend). Do not put an obfuscated/reversible email address in a URL: it is not a security control and exposes personal data. Resend must send only to the email stored on the ticket and use generic responses to prevent ticket/email enumeration. A ticket ID alone must never authorize access. Do not reopen the access-method decision unless a concrete security or feasibility issue is found; explain it and ask the owner if necessary.

- Admins/support can set priority (at minimum normal, important, urgent) and status (at minimum open/unsolved and solved; pending may be proposed). Persist changes/timestamps and useful event/actor history. Define and test how customer replies affect solved tickets (recommended: reopen).

- Email is notification-only. On ticket creation, notify the configured `SUPPORT_EMAIL` address (initially `info@axxis.gr`, later changeable to `info@3dlibra.gr` by the owner); on agent reply, notify the customer with a secure link back to the ticket. Notifications direct users to the ticket page to continue correspondence. Use provider credentials supplied outside source control. Persist delivery state; email failure must never lose tickets/messages, must be visible to authorized staff, and should support safe retry. Do not leak provider errors publicly.

- Treat all content as untrusted. Use strict typed schemas and field-specific length limits; reject unexpected/oversized requests. Use MongoDB driver document/query APIs and explicit allowlists; never construct filters, updates, or pipelines from user-controlled objects/keys/operators. This prevents NoSQL/operator injection (SQL injection is not applicable to this MongoDB path). Escape output in context; never render submitted content as raw HTML. Protect email headers/links against CRLF/header injection and unsafe URI construction. Do not fetch user-provided URLs or pass content into shell commands, code, templates, or dynamic queries. Add request size limits, abuse controls/rate limiting, generic public errors, and tests for malformed/oversized data, Mongo operator injection, stored-XSS-safe rendering, email-header injection, authorization, and token leakage/expiry/revocation.

- Enforce access checks: admin/support may manage tickets per their permissions; guest customers may only view/reply when proving access to that specific ticket. Public endpoints may create tickets or initiate the approved access flow but may not list/retrieve arbitrary tickets.

## **7. API, database, and security**

- Inspect `backend/server.py`, requirements, frontend routes/forms, README, current Admin page, contact handling, and product/cart APIs before designing changes.

- Use Pydantic request/response models and explicit serialization; serialize Mongo IDs safely. Never return secrets/password hashes.

- Authorize every protected API endpoint. Keep public endpoints narrowly scoped. Handle validation, duplicate keys, missing records, and DB errors safely.

- Configure CORS narrowly with existing `CORS_ORIGINS`; no wildcard credentialed CORS. Do not expose stack traces, DB URLs, tokens, or mail credentials in responses/logs.

- Treat user-controlled values as data, not executable instructions. Use safe MongoDB APIs and allowlisted fields/operators; context-appropriate output encoding; no raw HTML. Apply safe handling for email headers, links, logs, templates, and shell boundaries. Add regression tests.

# **Libra3D Stage 4 — VAT, shipping, and Stripe Checkout decisions**

- Planned payment provider: Stripe Checkout with Stripe Tax enabled, subject to owner setup and verification of supported-country/configuration details. Do not collect or store card numbers, CVCs, or other payment credentials in Libra3D. Checkout will eventually hand off to Stripe-hosted payment UI; backend stores Stripe IDs and order/payment state only.

- Stripe Tax is expected to calculate destination-based tax, support applicable VAT rules and B2B VAT-ID validation/reverse charge where configured, and provide tax reports. Do not implement a local hardcoded VAT table or custom tax calculator for the planned Stripe flow. Verify requirements and do not claim it automatically handles every obligation without setup: registrations, product tax codes, shipping tax treatment, address collection, B2B configuration, webhooks, and reporting require owner account setup and tax/legal confirmation. Availability and behavior depend on account, country, and configuration.

- Owner decision: listed product prices are VAT-inclusive. Treat canonical product prices as gross prices. Do not add a flat 24% or other guessed tax on top, and do not invent a tax breakdown. During Stage 4 before Stripe integration, persist gross item subtotal, shipping charge, gross payable total, and explicitly indicate that payment/tax breakdown is not integrated/calculated. In the later Stripe Checkout/Tax phase, configure tax-inclusive pricing and persist provider-confirmed tax breakdown and totals.

- Existing shipping policy remains: €0 when item subtotal \>= €75; otherwise €8.50; empty cart is not an order. Use pre-tax/gross item subtotal for the threshold unless owner clarifies otherwise; preserve this rule and record shipping separately. Confirm how Stripe Tax treats shipping in its later integration.

- Greek island/postal-code VAT exceptions are deferred; do not approximate them. Verify Stripe Tax handling before enabling relevant destinations.

- Persist immutable order snapshots including destination, currency, gross subtotal, shipping, gross total, and later provider tax breakdown/pricing mode and Stripe session/payment IDs/status. Historical orders must not change when catalogue or tax configuration changes.

- Stage 4 (look below) is approved for order persistence/admin order management under the above assumptions. Stripe Checkout integration remains a later explicit phase unless owner changes scope. Never log Stripe secrets; use placeholders in `.env.example`, never actual `.env` values in prompts/source.


## **8. Delivery stages**

**Stage 0 — Reconnaissance and plan (no edits):** Inspect and report routes/models/pages and what is mock vs persistent; propose schemas/APIs/auth, RBAC for admin/support using the agreed shared users collection, secure guest ticket access and resend details, and staged plan. Identify genuine owner decisions. No destructive changes.  
**Stage 1 — Backend foundation:** Shared admin/support identity and role model, secure bootstrap/auth, protected API structure, indexes and tests. No customer registration.  
**Stage 2 — Ticket vertical slice:** Contact submission -\> persisted ticket and first message -\> admin/support ticket list/detail, replies, priority/status; secure guest access and replies; notification-only email to business/customer. Test persistence, RBAC, injection defenses, access-link security, and notification failure/retry.  
**Stage 3 — Product vertical slice:** CRUD/category integration and admin UI; connect to existing backend product source and ensure storefront reflects admin changes. Validate and test.  
**Stage 4 — Order vertical slice:** Persist checkout orders; admin list/detail/status/manual create/edit; server-side totals and tests.  
**Stage 5 — Hardening/handoff:** End-to-end smoke/security tests, index/setup documentation, environment-variable example, known limitations, and owner decisions. Work in small commits or clearly separated changes. Do not proceed past material business/security ambiguity without asking the owner.

## 8.5 Implementation status (verified)

- Stage 0 — Reconnaissance and plan: complete.
- Stage 1 — Backend authentication and role foundation: complete, including shared users collection, bootstrap, sessions, CSRF, rate limiting, and password change.
- Stage 2 — Support-ticket vertical slice: complete, including persisted tickets/messages, guest access links, admin/support ticket management, and notification persistence/retry.
- Stage 3 — Product vertical slice: complete, including admin product CRUD over the MongoDB-backed product catalogue.
- Stage 4 — Order vertical slice: complete, including persisted checkout orders, server-side totals, and admin order management.
- Stage 5 — Hardening/handoff: complete for implemented scope, including request deduplication, timing/index hardening, and documentation.

Completed scope also includes:
- Authenticated password change at `/account/password`.
- Support-account provisioning via `backend/provision_support.py`.
- Idempotent, non-destructive product seeding via `backend/seed_products.py`.

Deferred work:
- Stripe Checkout and Stripe Tax.
- Payment processing and payment-status transitions.
- Customer registration, profiles, order tracking, saved carts, and favorites.
- Support-user management UI.
- Password reset/recovery and admin-forced password changes.
- Real MongoDB integration/concurrency tests.
- Image upload pipeline.

## **9. Acceptance criteria**

- Unauthenticated users cannot access protected admin/support pages or APIs. Admins can securely log in/out and sessions expire. Support can manage tickets only and is denied product/order/admin-setting access even by direct API calls.

- Initial two admins are created only with owner-supplied credentials at runtime; credentials never enter source/history/logs.

- Product/category management persists to the canonical source used by storefront retrieval without breaking the existing UI.

- Storefront checkout creates persisted orders with server-validated canonical pricing; admins can process and manually create/edit orders.

- Contact submissions create persisted tickets with complete threads. Admin/support can reply and manage priority/status; customers securely access/reply on ticket pages. Email notifies the configured `SUPPORT_EMAIL` address of new tickets and customers of agent replies, linking to ticket pages. Failed notifications do not lose messages and are visible/retriable.

- Tests cover authentication/RBAC, validation, CRUD/status, ticket/message persistence, guest access/replies, priority/status transitions, notification failure/retry, injection/XSS defenses, and order-total integrity.

- Documentation covers bootstrap, role boundaries, required configuration, local setup, tests, and limitations; contains no secrets.

## **10. Decisions to raise when relevant**

Inspect existing UX/model first, then ask only decisions that genuinely block implementation: support-agent provisioning needs; product fields/stock/images; checkout, shipping, tax/payment requirements and order statuses; email provider/configuration; ticket retention/deletion; and secure implementation details for the agreed ticket-link/resend flow. Customer registration, profiles, order tracking, saved carts, and favorites are future scope, not part of this build. Secrets must be supplied privately/outside source control.


