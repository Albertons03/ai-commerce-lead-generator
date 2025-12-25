# Supabase NPM Scripts

Recommended NPM scripts to add to your `package.json` for easier Supabase management.

## Add to package.json

```json
{
  "scripts": {
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:restart": "supabase stop && supabase start",
    "supabase:reset": "supabase db reset",
    "supabase:status": "supabase status",
    "supabase:logs": "supabase db logs",

    "db:push": "supabase db push",
    "db:pull": "supabase db pull",
    "db:reset": "supabase db reset",
    "db:seed": "supabase db reset && node scripts/seed.js",

    "migrate:new": "supabase migration new",
    "migrate:up": "supabase db push",
    "migrate:status": "supabase migration list",

    "types:generate": "supabase gen types typescript --local > lib/supabase/database.types.ts",
    "types:generate:prod": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/supabase/database.types.ts",

    "supabase:link": "supabase link --project-ref $SUPABASE_PROJECT_REF",
    "supabase:deploy": "supabase db push --linked",

    "test:rls": "supabase test db",
    "studio": "supabase studio"
  }
}
```

## Usage Examples

### Local Development

```bash
# Start Supabase
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Restart Supabase
npm run supabase:restart

# Check status
npm run supabase:status

# View logs
npm run supabase:logs

# Open Studio
npm run studio
```

### Database Operations

```bash
# Apply migrations
npm run db:push

# Reset database (WARNING: deletes all data)
npm run db:reset

# Reset and seed database
npm run db:seed

# Create a new migration
npm run migrate:new add_users_table

# Check migration status
npm run migrate:status
```

### Type Generation

```bash
# Generate types from local database
npm run types:generate

# Generate types from production database
npm run types:generate:prod
```

### Production Deployment

```bash
# Link to production project (one-time setup)
npm run supabase:link

# Deploy migrations to production
npm run supabase:deploy
```

### Testing

```bash
# Run RLS policy tests
npm run test:rls
```

## Environment Variables for Scripts

Add these to your `.env.local`:

```env
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_PROJECT_REF=your-project-ref
```

## Combined Workflow Scripts

Add these for common workflows:

```json
{
  "scripts": {
    "dev:fresh": "npm run db:reset && npm run dev",
    "dev:setup": "npm run supabase:start && npm run db:push && npm run types:generate && npm run dev",
    "deploy:full": "npm run types:generate:prod && npm run supabase:deploy && npm run build"
  }
}
```

Usage:

```bash
# Fresh development start (reset DB and start dev server)
npm run dev:fresh

# Complete setup (start Supabase, apply migrations, generate types, start dev)
npm run dev:setup

# Full production deployment
npm run deploy:full
```

## Git Hooks with Husky (Optional)

If using Husky for git hooks:

```json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "npm run types:generate && git add lib/supabase/database.types.ts"
  }
}
```

This auto-generates types before each commit to keep them in sync.

## CI/CD Scripts

For GitHub Actions or similar:

```json
{
  "scripts": {
    "ci:test": "npm run types:generate && npm run test",
    "ci:deploy": "npm run supabase:link && npm run supabase:deploy"
  }
}
```

## Docker Compose Alternative

If you prefer Docker Compose over Supabase CLI, create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: supabase/postgres:latest
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
```

Then add:

```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run supabase:start` | Start local Supabase |
| `npm run supabase:stop` | Stop local Supabase |
| `npm run db:push` | Apply migrations |
| `npm run db:reset` | Reset database |
| `npm run types:generate` | Generate TypeScript types |
| `npm run studio` | Open Supabase Studio |
| `npm run migrate:new <name>` | Create new migration |
| `npm run supabase:deploy` | Deploy to production |

## Troubleshooting Scripts

```json
{
  "scripts": {
    "debug:supabase": "supabase status && supabase db status",
    "debug:docker": "docker ps && docker logs supabase_db",
    "clean:supabase": "supabase stop --no-backup && docker system prune -f && supabase start",
    "check:env": "node scripts/check-env.js"
  }
}
```

Create `scripts/check-env.js`:

```javascript
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('All required environment variables are set');
```

Usage:
```bash
npm run check:env
```
