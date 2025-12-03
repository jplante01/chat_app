# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a chat application built with React, TypeScript, Vite, Material-UI, and Supabase. The project implements a real-time messaging system with Supabase as the backend for database, authentication, and real-time subscriptions.

## Development Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server (default port 5173)
npm run build        # Build TypeScript and bundle for production
npm run preview      # Preview production build locally
```

### Supabase Local Development
```bash
npx supabase start   # Start local Supabase instance (DB, Auth, Storage, Studio)
npx supabase stop    # Stop local Supabase instance
npx supabase status  # Check status of local services
npx supabase db reset # Reset local database (reapplies migrations and seeds)
```

**Important Ports (Local Supabase):**
- API: http://127.0.0.1:54321
- DB: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio: http://127.0.0.1:54323
- Inbucket (email testing): http://127.0.0.1:54324

### Test Users (Local Development)
The following test accounts are available in local Supabase:
- Alice: alice@test.com / password123
- Bob: bob@test.com / password123
- Charlie: charlie@test.com / password123

## Architecture

### Type System

**Type Files:**
- `src/types/supabase.ts` - Auto-generated Supabase database types (do NOT manually edit)
- `src/types/database.types.ts` - Helper types extracted from Supabase types, including composite types for joins

### Database Layer (src/db/)

All database operations are abstracted into domain-specific modules that export a single object with methods. Each module is organized by database table or feature area.

**Central Export:**
- `src/db/index.ts` - Central export point for all database modules

**Usage Pattern:**
```typescript
import { messagesDb, conversationsDb } from '@/db';

// Database operations return promises
const data = await messagesDb.someOperation();
```

**Supabase Client:**
- `utils/supabase.ts` - Singleton Supabase client instance
- Configured via environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

### Key Architectural Patterns

1. **Type Safety:** All database operations use generated Supabase types + custom helper types to ensure type safety throughout the stack

2. **Data Access Layer:** Never call Supabase directly from components; always use the db/* modules. This provides:
   - Consistent error handling
   - Type-safe query builders
   - Documented use cases for each function
   - Easy mocking for tests

3. **Database Functions:** Each function in src/db/ should include JSDoc comments explaining its use case and parameters

## Working with Database Schema

### Creating Migrations
```bash
npx supabase db diff --file <migration_name>  # Create migration from changes
npx supabase migration new <migration_name>   # Create empty migration file
```

### Applying Migrations
```bash
npx supabase db reset  # Reset and reapply all migrations (local only)
npx supabase db push   # Push migrations to remote (production)
```

### Regenerating TypeScript Types
After changing the database schema, regenerate types:
```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Type Imports
- Use `src/types/database.types.ts` for application code (cleaner exports)
- Only import from `src/types/supabase.ts` when you need the full Database type

## Important Notes

1. **Migration Files:** Located in `supabase/migrations/`. Always create migrations for schema changes rather than editing the database directly.

2. **Environment Variables:** The app expects VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. For local development, these should point to the local Supabase instance (see ports above).

3. **Supabase Configuration:** Project configuration is in `supabase/config.toml`. This includes settings for auth, storage, edge functions, and more.

4. **Authentication:** Auth is handled by Supabase Auth. The application should maintain a user profile table linked to auth.users.
