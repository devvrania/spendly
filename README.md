# Spendly

A calm personal finance tracker (income, expenses, wallets, categories, and dashboard
analytics in PKR) built to practise **relational database design and SQL**.

* **Web:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · TanStack Query · Recharts
* **API:** NestJS 11 · Prisma 6 · PostgreSQL 17 · Argon2id · JWT in an HttpOnly cookie · Swagger
* **Tests:** Jest + Supertest e2e (59 tests) against an isolated test database

Docs: [architecture](docs/architecture.md) · [database design, indexes, EXPLAIN plans, SQL exercises](docs/database-design.md)

## Quick start (local)

Prerequisites: **Node ≥ 20.9** (`.nvmrc` pins 22), **pnpm 10** (`corepack enable`), **Docker**.

```bash
pnpm install
pnpm db:up                                     # Postgres 17 on localhost:5434 (spendly_dev + spendly_test)
cp apps/api/.env.example apps/api/.env         # then set JWT_ACCESS_SECRET (e.g. `openssl rand -hex 32`)
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @spendly/api prisma:deploy       # apply migrations to spendly_dev
pnpm db:seed:demo                              # optional: demo@spendly.local / demo-password-123
pnpm dev                                       # API :4000 + web :3000
```

* App: http://localhost:3000
* API: http://localhost:4000/api/v1 · Swagger: http://localhost:4000/api/docs

Use `localhost` (not `127.0.0.1`) for both, so the session cookie is shared between them.

For the e2e tests, create `apps/api/.env.test` from `.env.example` with
`spendly_test` in both URLs and `NODE_ENV=test`, then:

```bash
pnpm test        # migrates spendly_test, then runs the e2e suites
```

The test helper refuses to run against any database whose URL doesn't contain
`spendly_test`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | API (watch) + web dev servers |
| `pnpm build` | Build both apps |
| `pnpm test` | API e2e tests against `spendly_test` |
| `pnpm db:up` / `db:down` | Start / stop the Postgres container |
| `pnpm db:migrate` | `prisma migrate dev` (create + apply migrations during development) |
| `pnpm db:seed:demo [-- --bench]` | Demo user; `--bench` adds ~60k rows for `EXPLAIN ANALYZE` |
| `pnpm lint` | Typecheck both apps |

## Key database decisions (short version)

* **Balances are derived, never stored.** Wallet balance = Σ income − Σ expense, so edits and deletes can't cause drift.
* **Composite foreign keys enforce ownership and type in the database.** `transactions(user_id, wallet_id) → wallets(user_id, id)` and
  `transactions(user_id, category_id, type) → categories(user_id, id, type)`. A transaction physically cannot reference another
  user's wallet, or a category of the wrong type.
* **Money is `NUMERIC(12,2)`** and travels as decimal strings, with `CHECK (amount > 0)`.
* **Atomic registration:** user + Main Wallet + 11 default categories in one DB transaction.
* **Archive, don't delete:** FKs (`ON DELETE NO ACTION`) block hard-deleting used wallets/categories.
* **Every index maps to a query:** each `transactions` index leads with `user_id`, verified with `EXPLAIN ANALYZE`.

## API overview (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` |
| Profile | `GET /users/me` · `PATCH /users/me` |
| Wallets | `GET/POST /wallets` · `GET/PATCH /wallets/:id` · `PATCH /wallets/:id/archive` · `…/unarchive` · `DELETE /wallets/:id` (unused only) |
| Categories | `GET/POST /categories?type=` · `PATCH /categories/:id` · `…/archive` · `…/unarchive` · `DELETE` (unused only) |
| Transactions | `GET /transactions?page&limit&sortBy&sortOrder&type&categoryId&walletId&startDate&endDate&search` · `POST` · `GET/PATCH/DELETE /transactions/:id` |
| Analytics | `GET /analytics/summary` · `/category-breakdown` · `/monthly-trend` · `/wallet-balances` |

Errors always look like `{ "statusCode": 400, "error": "Bad Request", "message": "Validation failed", "errors": [{ "field": "amount", "messages": ["…"] }] }`.

## Out of scope (by design)

Transfers between wallets, multiple currencies, budgets, recurring transactions, bank sync,
receipts/OCR, shared wallets. See the project brief.
