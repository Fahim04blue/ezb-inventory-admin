# Essentials by Zatab Inventory Admin

Initial project scaffold for a private inventory and workflow admin panel built with Next.js App Router, TypeScript, Tailwind CSS, and Prisma.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Prisma
- PostgreSQL
- shadcn/ui-ready project structure

## Current Scope

This setup only includes the base application shell and project structure:

- Root app layout
- Dashboard route group scaffold
- Feature-based folders
- Shared component folders
- Prisma client helper
- Health route

Business modules and workflows are intentionally not implemented yet.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/essentials_inventory?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/essentials_inventory?schema=public"
NEXT_PUBLIC_APP_NAME="Essentials by Zatab Inventory Admin"
```

3. Generate the Prisma client:

```bash
pnpm prisma:generate
```

4. Run the app:

```bash
pnpm dev
```

## Project Structure

```txt
src/
  app/
  components/
  features/
  lib/
  server/
prisma/
```

The structure follows the modular feature-based layout defined in `AGENTS.md`.
