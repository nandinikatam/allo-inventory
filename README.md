# Allo Inventory — Reservation System

A Next.js inventory and order-fulfillment platform with race-condition-safe reservations.

## Live URL
https://allo-inventory-tf1r.vercel.app

## How to Run Locally

1. Clone the repo:
   git clone https://github.com/nandinikatam/allo-inventory.git
   cd allo-inventory

2. Install dependencies:
   npm install

3. Set up environment variables — create a .env file:
   DATABASE_URL="your_supabase_pooling_url"
   DIRECT_URL="your_supabase_direct_url"
   UPSTASH_REDIS_REST_URL="your_upstash_url"
   UPSTASH_REDIS_REST_TOKEN="your_upstash_token"

4. Run migrations:
   npx prisma migrate dev

5. Seed the database:
   npx tsx prisma/seed.ts

6. Start the dev server:
   npm run dev

7. Open http://localhost:3000

## How the Expiry Mechanism Works

Reservations expire after 10 minutes. The expiry is handled by a cron endpoint at /api/cron which:
- Finds all PENDING reservations where expiresAt is in the past
- Releases each one by decrementing reservedUnits on the inventory
- Updates the reservation status to RELEASED

In production this endpoint should be called every minute by a Vercel Cron Job.

Additionally expiry is checked lazily on the confirm endpoint — if a user tries to confirm an expired reservation it gets released immediately and a 410 is returned.

## How Concurrency is Handled

The reservation endpoint uses a PostgreSQL SELECT ... FOR UPDATE row-level lock inside a transaction. This means:
- Two simultaneous requests for the last unit will queue at the database level
- Only one will succeed and decrement the stock
- The other will see 0 available units and get a 409 response

This guarantees exactly-once reservation even under high concurrency.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/products | List products with stock per warehouse |
| GET | /api/warehouses | List warehouses |
| POST | /api/reservations | Reserve units (409 if out of stock) |
| POST | /api/reservations/:id/confirm | Confirm reservation (410 if expired) |
| POST | /api/reservations/:id/release | Release reservation early |

## Trade-offs and What I Would Do Differently

- Redis not used for locking — PostgreSQL row-level locks are sufficient and simpler for this scale
- No idempotency keys — would add Idempotency-Key header support using Redis
- No authentication — in production reservations would be tied to user accounts
- Single quantity — UI currently reserves 1 unit at a time

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Prisma 7 + Supabase (PostgreSQL)
- Upstash Redis
- Tailwind CSS
- Vercel
