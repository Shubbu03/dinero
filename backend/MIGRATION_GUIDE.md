# Database Migration Guide

## Overview

This application now uses a more robust approach to database migrations that separates concerns between development and production environments.

## Migration Strategies

### Development Environment

In development (default behavior):

- Migrations run automatically when starting the application
- Set `ENV=development` or leave unset
- Set `RUN_MIGRATIONS=true` or leave unset

### Production Environment

In production, you have two options:

#### Option 1: Separate Migration Step (Recommended)

```bash
# Run migrations separately before deploying
go run cmd/migrate/main.go

# Then start the application with migrations disabled
ENV=production RUN_MIGRATIONS=false go run cmd/main.go
```

#### Option 2: Controlled Migration on Startup

```bash
# Explicitly enable migrations for production deployment
ENV=production RUN_MIGRATIONS=true go run cmd/main.go
```

## Environment Variables

| Variable         | Description                                  | Default                  |
| ---------------- | -------------------------------------------- | ------------------------ |
| `ENV`            | Environment (development/production)         | development              |
| `RUN_MIGRATIONS` | Force enable/disable migrations (true/false) | Auto-detect based on ENV |
| `DB_URL`         | PostgreSQL connection string                 | Required                 |
| `PORT`           | Server port                                  | 8080                     |

## Migration Files

- `cmd/main.go` - Main application with conditional migrations
- `cmd/migrate/main.go` - Standalone migration script for production

## Database Connection Improvements

The database connection now includes:

- Connection pooling with configurable limits
- Connection health checks
- Graceful connection management
- Better error handling

## Best Practices

1. **Never run migrations automatically in production** - Use the separate migration script
2. **Test migrations** in a staging environment first
3. **Backup your database** before running migrations in production
4. **Use environment variables** to control migration behavior
5. **Monitor connection pool** usage in production

## Example Usage

### Development

```bash
# Auto-runs migrations
go run cmd/main.go
```

### Production Deployment

```bash
# Step 1: Run migrations
go run cmd/migrate/main.go

# Step 2: Start application
ENV=production RUN_MIGRATIONS=false go run cmd/main.go
```

### Docker Deployment

```dockerfile
# Run migrations in init container or separate job
RUN go run cmd/migrate/main.go

# Start main application
CMD ["go", "run", "cmd/main.go"]
ENV ENV=production
ENV RUN_MIGRATIONS=false
```
