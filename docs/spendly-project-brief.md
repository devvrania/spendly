# Spendly --- Product Requirements & Implementation Brief

> **Purpose:** Build a polished, working personal finance tracker, with a strong emphasis on relational
> database design and practical SQL.
>
> **Audience:** AI coding assistant / developer implementing the
> application.
>
> **Project status:** MVP specification
>
------------------------------------------------------------------------

## 1. Project overview

**Spendly** is a personal expense and income tracker. Users can record
financial transactions, organize them into categories, separate money
into wallets, and view summaries of their financial activity.

The main learning goal is to practise database engineering through a
real application:

-   Relational data modelling and normalization
-   Primary keys, foreign keys, unique constraints, and check
    constraints
-   One-to-many relationships
-   Data ownership and tenant isolation
-   Database migrations
-   SQL joins, filtering, grouping, and aggregation
-   Index selection and query optimization
-   ACID transactions and data integrity
-   Pagination and date-range queries

Do not turn this into an unnecessarily complex enterprise application.
Prefer a clear, maintainable modular monolith.

### Product principles

1.  Keep the experience simple and intuitive.
2.  Treat database correctness as a first-class requirement.
3.  Keep all financial calculations on the backend.
4.  Never trust client-supplied user IDs or ownership information.
5.  Use precise decimal arithmetic for money.
6.  Do not add features outside the MVP unless they are necessary for
    correctness.

------------------------------------------------------------------------

## 2. MVP scope

### 2.1 Authentication

-   Register with name, email, and password.
-   Log in and log out.
-   Protect all private API endpoints.
-   Hash passwords with Argon2id or bcrypt using secure settings.
-   Enforce unique email addresses.
-   Associate all user-owned data with the authenticated user.
-   Provide a basic profile endpoint.

### 2.2 Wallets

Users can create multiple wallets, for example:

-   Cash
-   Bank Account
-   Savings

Requirements:

-   A new user receives a default wallet named **Main Wallet**.
-   Users can create, view, rename, and archive wallets.
-   Each transaction belongs to exactly one wallet.
-   Show each wallet's calculated balance.
-   Do not store a mutable wallet balance in the database; derive it
    from transactions.
-   Do not allow a wallet with transactions to be hard-deleted. Allow it
    to be archived instead.
-   The MVP supports **PKR only**. Do not implement currency conversion.

**Out of scope:** transfers between wallets. Transfers require
additional accounting rules and should be a later feature.

### 2.3 Categories

Each user has their own categories. Categories have one of two types:

-   `INCOME`
-   `EXPENSE`

Seed a useful set of default categories when a user registers.

Suggested defaults:

  Category        Type
  --------------- ---------
  Salary          INCOME
  Freelance       INCOME
  Other Income    INCOME
  Groceries       EXPENSE
  Transport       EXPENSE
  Shopping        EXPENSE
  Bills           EXPENSE
  Food & Dining   EXPENSE
  Health          EXPENSE
  Entertainment   EXPENSE
  Other Expense   EXPENSE

Requirements:

-   List categories by type.
-   Create and rename categories.
-   Archive categories rather than deleting categories already used by
    transactions.
-   A transaction's type must match its category's type.
-   A category must belong to the currently authenticated user.

### 2.4 Transactions

Users can create, view, edit, and delete transactions.

A transaction contains:

-   Amount
-   Type (`INCOME` or `EXPENSE`)
-   Category
-   Wallet
-   Description / note (optional)
-   Transaction date

Requirements:

-   Amount must be greater than zero.
-   Amount must be stored as PostgreSQL `NUMERIC` / Prisma `Decimal`,
    never floating-point.
-   Transaction date is a calendar date.
-   A transaction must reference a wallet and category owned by the same
    authenticated user.
-   Category type must match transaction type.
-   Users can only access their own transactions.
-   Support pagination and sorting (newest transaction date first by
    default).
-   Support filters for date range, type, category, and wallet.
-   Deleting a transaction must update all derived summaries
    automatically because summaries are calculated from the transaction
    records.

### 2.5 Dashboard and analytics

Show:

-   Total income for the selected period
-   Total expenses for the selected period
-   Net balance / net cash flow for the selected period
    (`income - expenses`)
-   Current calculated balance for each wallet
-   Expense breakdown by category
-   Monthly income-versus-expense trend
-   Recent transactions

Default dashboard period: current calendar month.

All totals must be calculated from persisted transactions on the
backend. Do not calculate authoritative totals by summing only the
currently loaded frontend page.

### 2.6 Profile and settings

-   View and update the user's display name.
-   Show the account email (email editing can be deferred).
-   Log out.

------------------------------------------------------------------------

## 3. Explicitly out of scope

Do not implement these in the MVP:

-   Meta Pixel, Meta Conversions API, or Meta Ads
-   Bank integrations or bank account synchronization
-   Payment processing
-   Multiple currencies or exchange rates
-   Wallet-to-wallet transfers
-   Shared wallets or household accounts
-   Budgets, recurring transactions, or notifications
-   Receipt image uploads / OCR
-   AI financial advice
-   Microservices, Redis, queues, or event-driven infrastructure
-   Complex permissions or organization management

This is a personal finance learning app, not an advertising or payment
platform.

------------------------------------------------------------------------

## 4. Recommended technology stack

  -----------------------------------------------------------------------
  Area                                Technology
  ----------------------------------- -----------------------------------
  Frontend                            Next.js (App Router) + TypeScript

  Backend                             NestJS + TypeScript

  Database                            PostgreSQL hosted on Neon

  ORM / migrations                    Prisma

  Authentication                      JWT

  Password hashing                    Argon2id (preferred) or bcrypt

  Styling                             Tailwind CSS

  UI components                       A consistent accessible component
                                      system

  Charts                              Recharts

  API documentation                   Swagger / OpenAPI

  Backend tests                       Jest + Supertest

  Frontend tests                      Appropriate component / end-to-end
                                      tests for critical flows

  Package manager                     pnpm

  Deployment                          Vercel (web) and a Node-compatible
                                      host (API)
  -----------------------------------------------------------------------

Use compatible, stable package versions and commit the lockfile. Do not
use experimental dependencies without a clear reason.

### Architecture style

Use a **modular monolith**:

-   One Next.js frontend application
-   One NestJS API application
-   One PostgreSQL database
-   One Prisma schema and migration history

No microservices are required.

------------------------------------------------------------------------

## 5. Repository structure

Use a simple pnpm workspace monorepo. Do not introduce Turborepo unless
there is a concrete need.

``` text
spendly/
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── transactions/
│   │   │   │   ├── categories/
│   │   │   │   └── wallets/
│   │   │   └── lib/
│   │   └── ...
│   │
│   └── api/                         # NestJS backend
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── wallets/
│           ├── categories/
│           ├── transactions/
│           ├── analytics/
│           ├── prisma/
│           └── main.ts
│
├── packages/
│   └── shared/                     # Shared enums / API types if useful
├── docs/
│   ├── architecture.md
│   └── database-design.md
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Keep business logic in NestJS services. Keep controllers thin. Avoid
duplicating validation or business rules in multiple places.

------------------------------------------------------------------------

## 6. System architecture

``` mermaid
flowchart TD
    U[User] --> W[Next.js Web App]
    W -->|HTTPS / REST| A[NestJS API]
    A --> AUTH[Auth Module]
    A --> WAL[Wallets Module]
    A --> CAT[Categories Module]
    A --> TX[Transactions Module]
    A --> ANA[Analytics Module]
    AUTH --> P[Prisma]
    WAL --> P
    CAT --> P
    TX --> P
    ANA --> P
    P --> DB[(PostgreSQL / Neon)]
```

### Example: creating an expense

1.  The user submits an expense form in Next.js.
2.  The frontend sends a `POST /transactions` request with the access
    token.
3.  NestJS authentication middleware/guard identifies the user.
4.  The DTO validates the request fields.
5.  The service verifies that the selected wallet and category belong to
    that user.
6.  The service verifies that the category type is `EXPENSE`.
7.  Prisma inserts the transaction.
8.  The API returns the created transaction.
9.  The frontend refreshes the transaction list and relevant dashboard
    data.

The backend must derive the owner from the authenticated principal.
Never accept `userId` from the request body as the authority for
ownership.

------------------------------------------------------------------------

## 7. Database design

### 7.1 Core entities

The MVP has four main entities:

1.  `User`
2.  `Wallet`
3.  `Category`
4.  `Transaction`

Relationships:

-   One user has many wallets.
-   One user has many categories.
-   One user has many transactions.
-   One wallet has many transactions.
-   One category has many transactions.
-   Every wallet, category, and transaction belongs to one user.

### 7.2 Entity relationship diagram

``` mermaid
erDiagram
    USERS ||--o{ WALLETS : owns
    USERS ||--o{ CATEGORIES : owns
    USERS ||--o{ TRANSACTIONS : owns
    WALLETS ||--o{ TRANSACTIONS : contains
    CATEGORIES ||--o{ TRANSACTIONS : classifies

    USERS {
        uuid id PK
        string name
        string email UK
        string password_hash
        datetime created_at
        datetime updated_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        string name
        string currency
        boolean is_archived
        datetime created_at
        datetime updated_at
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK
        string name
        enum type
        string color
        boolean is_archived
        datetime created_at
        datetime updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid wallet_id FK
        uuid category_id FK
        decimal amount
        enum type
        string description
        date transaction_date
        datetime created_at
        datetime updated_at
    }
```

### 7.3 Suggested field definitions

**User**

  Field            Suggested database type   Rules
  ---------------- ------------------------- ------------------------------
  `id`             UUID                      Primary key
  `name`           VARCHAR(100)              Required
  `email`          VARCHAR(255)              Required, unique, normalized
  `passwordHash`   VARCHAR                   Required
  `createdAt`      TIMESTAMPTZ               Required
  `updatedAt`      TIMESTAMPTZ               Required

**Wallet**

  Field          Suggested database type   Rules
  -------------- ------------------------- ----------------------
  `id`           UUID                      Primary key
  `userId`       UUID                      Required foreign key
  `name`         VARCHAR(80)               Required
  `currency`     CHAR(3)                   Default `PKR`
  `isArchived`   BOOLEAN                   Default false
  `createdAt`    TIMESTAMPTZ               Required
  `updatedAt`    TIMESTAMPTZ               Required

**Category**

  Field          Suggested database type   Rules
  -------------- ------------------------- -----------------------
  `id`           UUID                      Primary key
  `userId`       UUID                      Required foreign key
  `name`         VARCHAR(80)               Required
  `type`         ENUM                      `INCOME` or `EXPENSE`
  `color`        VARCHAR(20)               Optional UI color
  `isArchived`   BOOLEAN                   Default false
  `createdAt`    TIMESTAMPTZ               Required
  `updatedAt`    TIMESTAMPTZ               Required

**Transaction**

  Field               Suggested database type   Rules
  ------------------- ------------------------- ---------------------------
  `id`                UUID                      Primary key
  `userId`            UUID                      Required foreign key
  `walletId`          UUID                      Required foreign key
  `categoryId`        UUID                      Required foreign key
  `amount`            NUMERIC(12,2)             Must be greater than zero
  `type`              ENUM                      `INCOME` or `EXPENSE`
  `description`       TEXT                      Optional
  `transactionDate`   DATE                      Required
  `createdAt`         TIMESTAMPTZ               Required
  `updatedAt`         TIMESTAMPTZ               Required

### 7.4 Data integrity rules

Implement these rules in the backend and, where practical, reinforce
them in the database:

1.  Email must be unique.
2.  Wallet names should be unique per user (case-insensitive if
    practical).
3.  Category names should be unique per user and category type
    (case-insensitive if practical).
4.  Transaction amount must be greater than zero.
5.  Every transaction's wallet must belong to the transaction owner.
6.  Every transaction's category must belong to the transaction owner.
7.  Transaction type must match category type.
8.  An archived category or wallet should not be selectable for new
    transactions.
9.  Existing transactions must remain valid when a category or wallet is
    archived.
10. Do not hard-delete wallets or categories that are referenced by
    transactions.

**Important implementation detail:** Application-level checks are
necessary, but ownership relationships should also be protected against
accidental cross-user references at the database level where practical.
Consider composite unique constraints on `(userId, id)` for wallets and
categories and composite foreign keys from transactions. If Prisma's
schema limitations make a constraint awkward, add it through a reviewed
SQL migration and document it.

### 7.5 Balance calculation

Do not store a mutable balance column on the wallet in the MVP.

Calculate wallet balance from its transactions:

`balance = SUM(INCOME amounts) - SUM(EXPENSE amounts)`

This avoids balance drift when a transaction is edited or deleted.

For the dashboard:

`net = total income - total expenses`

Clarify the difference between: - **Period net:** income minus expenses
within the selected date range. - **Wallet balance:** all-time income
minus all-time expenses for that wallet.

Do not label period net as the current wallet balance.

### 7.6 Indexes

Add indexes based on actual access patterns:

-   Unique index on normalized `User.email`.
-   Index on `Wallet(userId, isArchived)`.
-   Index on `Category(userId, type, isArchived)`.
-   Index on `Transaction(userId, transactionDate)`.
-   Index on `Transaction(userId, type, transactionDate)`.
-   Index on `Transaction(userId, walletId, transactionDate)`.
-   Index on `Transaction(userId, categoryId, transactionDate)`.

Avoid redundant indexes. Validate important query plans with PostgreSQL
`EXPLAIN ANALYZE` using representative sample data.

------------------------------------------------------------------------

## 8. API design

All endpoints are prefixed with `/api/v1`.

### Authentication

  Method   Endpoint           Description
  -------- ------------------ -------------------
  POST     `/auth/register`   Create an account
  POST     `/auth/login`      Authenticate
  POST     `/auth/logout`     Log out
  GET      `/auth/me`         Get current user

### Wallets

  Method   Endpoint                 Description
  -------- ------------------------ -----------------------------------
  GET      `/wallets`               List user's wallets
  POST     `/wallets`               Create wallet
  GET      `/wallets/:id`           Get wallet and calculated balance
  PATCH    `/wallets/:id`           Rename wallet
  PATCH    `/wallets/:id/archive`   Archive wallet

### Categories

  Method   Endpoint                    Description
  -------- --------------------------- ------------------------
  GET      `/categories`               List user's categories
  POST     `/categories`               Create category
  PATCH    `/categories/:id`           Update category
  PATCH    `/categories/:id/archive`   Archive category

Support an optional `type` query parameter when listing categories.

### Transactions

  Method   Endpoint              Description
  -------- --------------------- --------------------
  GET      `/transactions`       List transactions
  POST     `/transactions`       Create transaction
  GET      `/transactions/:id`   Get transaction
  PATCH    `/transactions/:id`   Update transaction
  DELETE   `/transactions/:id`   Delete transaction

Supported query parameters:

-   `page`
-   `limit`
-   `sortBy`
-   `sortOrder`
-   `type`
-   `categoryId`
-   `walletId`
-   `startDate`
-   `endDate`

Example:

``` http
GET /api/v1/transactions?type=EXPENSE&walletId=UUID&page=1&limit=10&startDate=2026-11-01&endDate=2026-11-30
```

Validate pagination limits and date formats. Use a stable sort order,
including a tie-breaker such as transaction ID.

### Analytics

  Method   Endpoint                          Description
  -------- --------------------------------- ----------------------------------
  GET      `/analytics/summary`              Income, expenses, and period net
  GET      `/analytics/category-breakdown`   Expense totals by category
  GET      `/analytics/monthly-trend`        Monthly income and expenses
  GET      `/analytics/wallet-balances`      Calculated balance per wallet

Analytics endpoints should accept appropriate date filters. All
analytics queries must be scoped to the authenticated user.

### API response conventions

Use consistent response shapes and standard HTTP status codes. Return
validation errors in a predictable format. Do not expose password
hashes, access tokens, database errors, or secrets in API responses.

------------------------------------------------------------------------

## 9. Frontend requirements and visual direction

Build a clean, modern, friendly personal-finance dashboard. It should
feel polished and calm, not like a dense enterprise accounting system.

### Main pages

1.  `/login`
2.  `/register`
3.  `/dashboard`
4.  `/transactions`
5.  `/transactions/new`
6.  `/categories`
7.  `/wallets`
8.  `/settings`

### Dashboard layout

Include:

-   A clear page title and selected-month control
-   Four summary cards: income, expenses, period net, and wallet balance
-   A monthly income-versus-expense chart
-   An expense-by-category chart
-   A recent transactions table/list
-   A wallet selector or wallet summary section
-   A clear primary action to add a transaction

### Transactions page

Include:

-   Transaction list with date, description, category, wallet, type, and
    amount
-   Search or filter controls
-   Date range filter
-   Type, category, and wallet filters
-   Pagination
-   Add, edit, and delete actions
-   Empty state when no transactions exist

### Forms

Transaction form fields:

-   Type (Income / Expense)
-   Amount
-   Category (filtered by type)
-   Wallet
-   Date
-   Optional description

Show useful inline validation messages. Disable submission while saving.
Give clear success and error feedback.

### UX quality

-   Responsive on mobile and desktop.
-   Accessible labels and keyboard navigation.
-   Consistent spacing, typography, and components.
-   Loading, empty, and error states.
-   Confirm destructive actions.
-   Do not use fake dashboard data in production UI. If seed/demo data
    is needed, clearly separate it from real user records.

------------------------------------------------------------------------

## 10. Security and privacy requirements

-   Hash passwords securely; never store plaintext passwords.
-   Keep JWT secrets in environment variables.
-   Do not commit `.env` files or credentials.
-   Validate all incoming DTOs.
-   Apply authentication guards to private routes.
-   Scope every database query by the authenticated user's ID.
-   Check ownership for wallet, category, and transaction IDs.
-   Use parameterized queries / Prisma query APIs; avoid unsafe SQL
    interpolation.
-   Configure CORS for the frontend origin.
-   Apply basic rate limiting to authentication endpoints.
-   Do not log passwords, tokens, or sensitive request bodies.
-   Use HTTPS in deployed environments.
-   Return generic authentication errors where appropriate.
-   Do not expose one user's data to another user, even if they guess a
    record UUID.

For browser authentication, prefer a secure, HttpOnly cookie strategy if
implemented correctly, including appropriate SameSite and CSRF
protections. If using bearer tokens, document the storage choice and
avoid long-lived tokens in localStorage. Do not claim the application is
production-secure without reviewing the implementation.

------------------------------------------------------------------------

## 11. Database and backend learning requirements

The implementation should deliberately demonstrate database skills.

### Required SQL exercises

Create and document SQL equivalents for:

1.  Get all transactions for a user, newest first.
2.  Get total income and expenses for a date range.
3.  Get expenses grouped by category.
4.  Get monthly income and expenses for the last six months.
5.  Get each wallet's calculated balance.
6.  Get the top five expense categories for a selected period.

Use parameterized SQL. Compare selected raw SQL queries with Prisma's
generated queries.

### Required database practice

-   Create the schema using Prisma.
-   Generate and review migrations.
-   Run migrations against a clean database.
-   Seed default categories and a default wallet during registration
    safely.
-   Use a database transaction for registration plus initial
    wallet/category creation, so partial setup cannot be left behind.
-   Add meaningful constraints and indexes.
-   Use `EXPLAIN ANALYZE` for at least two analytics/list queries.
-   Explain why each index exists.
-   Test that one user cannot read or modify another user's records.

Do not add indexes purely to satisfy a checklist. Explain the query
pattern each index supports.

------------------------------------------------------------------------

## 12. Testing requirements

At minimum, test:

### Authentication

-   Registration succeeds with valid data.
-   Duplicate email is rejected.
-   Incorrect password is rejected.
-   Private endpoints reject unauthenticated requests.

### Ownership and integrity

-   User A cannot read User B's transaction.
-   User A cannot update or delete User B's transaction.
-   User A cannot attach User B's wallet to a transaction.
-   User A cannot attach User B's category to a transaction.
-   Category type mismatch is rejected.
-   Archived wallets/categories cannot be used for new transactions.

### Transactions and analytics

-   Amount must be positive.
-   Income and expense totals are correct.
-   Editing a transaction changes the calculated totals.
-   Deleting a transaction changes the calculated totals.
-   Date-range boundaries behave correctly.
-   Pagination returns stable results.
-   Wallet balances are calculated correctly.

Use an isolated test database or a safe test schema. Never run
destructive tests against production data.

------------------------------------------------------------------------

## 13. implementation plan

This is a focused one-week plan. Prioritize a complete, correct MVP over
extra features.

### Setup and database design

-   Initialize pnpm workspace.
-   Create Next.js and NestJS apps.
-   Configure environment variables.
-   Create a Neon PostgreSQL database.
-   Install and configure Prisma.
-   Finalize ERD and schema.
-   Generate the first migration.

**Learning focus:** entities, relationships, keys, normalization.

### Migrations and seed data

-   Implement User, Wallet, Category, and Transaction models.
-   Add enums, unique constraints, foreign keys, and indexes.
-   Run migrations.
-   Implement seed data.
-   Inspect data using a PostgreSQL client.

**Learning focus:** constraints, migrations, relational integrity.

### Authentication

-   Implement register, login, logout, and current-user endpoints.
-   Hash passwords.
-   Add JWT authentication.
-   Create the default wallet and categories atomically during
    registration.
-   Test user ownership.

**Learning focus:** unique constraints, atomic transactions, ownership.

### Wallets, categories, transactions

-   Implement wallet endpoints.
-   Implement category endpoints.
-   Implement transaction CRUD.
-   Add filtering and pagination.
-   Validate all relationships and ownership.

**Learning focus:** joins, foreign keys, filtering, pagination.

### Analytics

-   Implement summary queries.
-   Implement category breakdown.
-   Implement monthly trends.
-   Implement wallet balances.
-   Compare Prisma and SQL.
-   Inspect query plans.

**Learning focus:** aggregation, grouping, indexes, query optimization.

### Frontend

-   Build authentication screens.
-   Build dashboard.
-   Build transaction form and list.
-   Build category and wallet management.
-   Connect filters and charts to real API data.

**Learning focus:** integrating a relational backend with a UI.

### Testing and delivery

-   Add critical API tests.
-   Test data isolation.
-   Test edge cases.
-   Fix UX and responsive issues.
-   Deploy frontend and API.
-   Write README and database documentation.
-   Capture portfolio screenshots.

**Learning focus:** validating correctness and explaining engineering
decisions.

------------------------------------------------------------------------

## 14. Definition of done

The MVP is complete when:

-   [ ] A user can register, log in, and log out.
-   [ ] Registration creates a default wallet and default categories.
-   [ ] A user can create and archive wallets.
-   [ ] A user can create and archive categories.
-   [ ] A user can create, view, edit, and delete transactions.
-   [ ] Each transaction belongs to one wallet and one category.
-   [ ] Category type matches transaction type.
-   [ ] A user cannot access another user's data.
-   [ ] Dashboard totals are calculated from database records.
-   [ ] Wallet balances are derived from transactions.
-   [ ] Transaction filters and pagination work.
-   [ ] Migrations recreate the schema from an empty database.
-   [ ] Critical backend tests pass.
-   [ ] The app is deployed or has clear local setup instructions.
-   [ ] README explains architecture, schema, setup, and key database
    decisions.

------------------------------------------------------------------------

## 15. Environment variables

Provide `.env.example` files with placeholders only.

Example API environment:

``` env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_ACCESS_EXPIRES_IN="15m"
FRONTEND_URL="http://localhost:3000"
```

Example frontend environment:

``` env
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
```

Use Neon connection details from the user's own Neon project. Never
invent credentials. If Prisma migrations require a direct connection URL
separate from the pooled runtime URL, document and configure that
distinction.

------------------------------------------------------------------------

### 16. Recommended implementation milestones

-   **Milestone 1:** Workspace setup, database schema, migration, seed.
-   **Milestone 2:** Authentication and user initialization.
-   **Milestone 3:** Wallets, categories, and transaction APIs.
-   **Milestone 4:** Analytics SQL and backend tests.
-   **Milestone 5:** Frontend pages and API integration.
-   **Milestone 6:** Final testing, documentation, and deployment
    readiness.

If working interactively, finish one milestone, report changed files and
test results, then proceed to the next. Do not stop after producing only
a plan; implement the application unless the user asks for planning
only.

------------------------------------------------------------------------

## 17. Final product summary

**Spendly** is a simple personal finance tracker with:

-   User authentication
-   Multiple personal wallets
-   Income and expense categories
-   Transaction management
-   Dashboard analytics
-   PostgreSQL relational modelling
-   Prisma migrations
-   SQL aggregation and query optimization

The most important success criterion is not the number of features. It
is that the database is correctly designed, the data is secure and
consistent, and the developer can explain the decisions behind the
schema and queries.
