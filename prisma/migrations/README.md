# Prisma Migrations

This directory contains Prisma database migrations for the Taraz Backend application.

## Migration Files

- `20251005190728_init/migration.sql` - Initial database schema creation
- `migration_lock.toml` - Migration lock file (do not edit manually)

## Usage

When your database is accessible, you can apply these migrations using:

```bash
# Apply all pending migrations
npm run prisma:migrate:deploy

# Or in development
npm run prisma:migrate
```

## Schema Overview

The initial migration creates:

1. **Enums**:
   - `UserStatus`: ACTIVE, INACTIVE, PENDING_VERIFICATION, SUSPENDED
   - `RoleName`: SUPER_ADMIN, ADMIN, TEACHER, MENTOR, STUDENT, MODERATOR

2. **Tables**:
   - `users`: User accounts with authentication data
   - `roles`: System roles with hierarchy levels
   - `user_roles`: Many-to-many relationship between users and roles

3. **Indexes**:
   - Unique email constraint on users
   - Unique name constraint on roles
   - Unique user-role pair constraint

4. **Foreign Keys**:
   - Cascade delete relationships between users, roles, and user_roles
