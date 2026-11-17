-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'PKR',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "type" "transaction_type" NOT NULL,
    "color" VARCHAR(20),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "transaction_type" NOT NULL,
    "description" TEXT,
    "transaction_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "wallets_user_id_is_archived_idx" ON "wallets"("user_id", "is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_id_key" ON "wallets"("user_id", "id");

-- CreateIndex
CREATE INDEX "categories_user_id_type_is_archived_idx" ON "categories"("user_id", "type", "is_archived");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_id_type_key" ON "categories"("user_id", "id", "type");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_date_idx" ON "transactions"("user_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_transaction_date_idx" ON "transactions"("user_id", "type", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_wallet_id_transaction_date_idx" ON "transactions"("user_id", "wallet_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_transaction_date_idx" ON "transactions"("user_id", "category_id", "transaction_date");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_owner_fkey" FOREIGN KEY ("user_id", "wallet_id") REFERENCES "wallets"("user_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_owner_type_fkey" FOREIGN KEY ("user_id", "category_id", "type") REFERENCES "categories"("user_id", "id", "type") ON DELETE NO ACTION ON UPDATE NO ACTION;



-- ---------------------------------------------------------------------------
-- Hand-written constraints that Prisma's schema language cannot express.
-- Reviewed manually; documented in docs/database-design.md.
-- ---------------------------------------------------------------------------

-- Emails are normalized (trimmed + lower-cased) by the API. The CHECK makes the
-- plain unique index above effectively case-insensitive, because a mixed-case
-- duplicate can never be inserted in the first place.
ALTER TABLE "users"
  ADD CONSTRAINT "users_email_normalized_chk" CHECK (email = lower(btrim(email))),
  ADD CONSTRAINT "users_name_not_blank_chk"   CHECK (btrim(name) <> '');

-- Money: strictly positive. The sign is carried by "type", never by the amount.
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_positive_chk" CHECK (amount > 0);

-- MVP is PKR only.
ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_currency_pkr_chk"   CHECK (currency = 'PKR'),
  ADD CONSTRAINT "wallets_name_not_blank_chk" CHECK (btrim(name) <> '');

ALTER TABLE "categories"
  ADD CONSTRAINT "categories_name_not_blank_chk" CHECK (btrim(name) <> '');

-- Case-insensitive uniqueness of names per owner ("Cash" and "cash" collide).
-- Wallet names: unique per user. Category names: unique per user AND type,
-- so "Other" can exist once as INCOME and once as EXPENSE.
CREATE UNIQUE INDEX "wallets_user_id_lower_name_key"
  ON "wallets" ("user_id", lower("name"));

CREATE UNIQUE INDEX "categories_user_id_type_lower_name_key"
  ON "categories" ("user_id", "type", lower("name"));
