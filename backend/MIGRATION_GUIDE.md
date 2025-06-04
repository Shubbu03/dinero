# Database Migration Guide

## Quick Start

**Development:** Migrations run automatically when starting the app.

**Production:** Run migrations separately before deployment:

```bash
# Run migrations first
go run cmd/migrate/main.go

# Then start the app
ENV=production RUN_MIGRATIONS=false go run cmd/main.go
```

## Environment Variables

- `ENV` - Set to `production` for production environment
- `RUN_MIGRATIONS` - Set to `false` to disable auto-migrations
- `DB_URL` - PostgreSQL connection string (required)

## Files

- `cmd/main.go` - Main application
- `cmd/migrate/main.go` - Standalone migration script
