# Deployment Guide - Fly.io

## Prerequisites

Before deploying, ensure you have:

1. [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
2. Fly.io account and authenticated (`fly auth login`)
3. A PostgreSQL database (can be created with `fly postgres create`)

## Required Environment Variables

Your application requires these environment variables to run. Most are already set in `fly.toml`, but **secrets must be set manually**:

### Critical Secrets (Required)

```bash
# 1. Database Connection
fly secrets set DATABASE_URL="postgresql://user:password@host:5432/database"

# 2. JWT Authentication
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
fly secrets set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"
```

### Optional Secrets (for Email)

```bash
fly secrets set SMTP_FROM="your-email@domain.com"
fly secrets set SMTP_ENDPOINT="your-smtp-endpoint"
fly secrets set SMTP_ACCESS_KEY="your-access-key"
fly secrets set SMTP_ACCESS_KEY_SECRET="your-secret-key"
```

### Variables Already in fly.toml

These are already configured in `fly.toml`:

- `NODE_ENV=production`
- `PORT=3030`
- `JWT_EXPIRES_IN=365d`
- `JWT_EXPIRES_IN_SECONDS=3600`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `BCRYPT_SALT_ROUNDS=12`
- `SMTP_PORT=587`
- `CORS_ORIGIN=https://your-frontend-domain.com` (update as needed)
- `LOG_LEVEL=info`

## Setting Up PostgreSQL on Fly.io

If you don't have a database yet:

```bash
# Create a new PostgreSQL cluster
fly postgres create --name taraz-database --region fra

# Attach it to your app
fly postgres attach taraz-database --app taraz-backend

# This automatically sets the DATABASE_URL secret
```

## Deployment Steps

### 1. Build and Deploy

```bash
# Build the application locally (optional, to verify)
npm run build

# Deploy to Fly.io
fly deploy
```

### 2. Run Database Migrations

After the first deployment:

```bash
# SSH into your app
fly ssh console

# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Seed the database
node dist/prisma/seed.js

# Exit
exit
```

### 3. Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Open the app in browser
fly open /api
```

## Troubleshooting

### "Could not find a good candidate" Error

This error means Fly.io can't connect to a healthy instance. Common causes:

1. **Missing DATABASE_URL**

   ```bash
   fly secrets list  # Check if DATABASE_URL is set
   fly logs          # Look for "DATABASE_URL is NOT SET" error
   ```

2. **Database Connection Failed**

   ```bash
   fly logs | grep -i "database\|prisma"
   ```

3. **App Crashes on Startup**
   ```bash
   fly logs          # Check for error messages
   fly status        # Check if machines are running
   ```

### Common Issues and Solutions

#### App Not Starting

```bash
# Check logs for errors
fly logs

# Check if secrets are set
fly secrets list

# Restart the app
fly apps restart taraz-backend
```

#### Database Connection Issues

```bash
# Verify DATABASE_URL is set
fly secrets list

# Check if database is running (if using Fly Postgres)
fly status --app taraz-database

# Test database connection
fly ssh console
npx prisma db pull  # Should succeed if connection works
```

#### Health Check Failing

```bash
# SSH into the app
fly ssh console

# Test health endpoint locally
curl http://localhost:3030/health

# Check if app is listening on correct port
netstat -tlnp | grep 3030
```

#### Memory Issues

If the app runs out of memory:

```bash
# Scale up memory in fly.toml
[[vm]]
  memory = '2gb'  # Increase from 1gb

# Redeploy
fly deploy
```

## Monitoring

### View Real-time Logs

```bash
fly logs
```

### Check App Metrics

```bash
fly status
fly vm status
```

### Access App Console

```bash
fly ssh console
```

## Scaling

### Adjust Machine Count

```bash
# Scale to 2 machines
fly scale count 2

# Or update fly.toml
[http_service]
  min_machines_running = 1  # Keep at least 1 running
```

### Adjust Memory/CPU

Edit `fly.toml`:

```toml
[[vm]]
  memory = '2gb'
  cpu_kind = 'shared'
  cpus = 2
```

## Rollback

If deployment fails:

```bash
# View release history
fly releases

# Rollback to previous version
fly releases rollback
```

## Environment-Specific Configuration

### Update CORS_ORIGIN

Edit `fly.toml` to allow your frontend domain:

```toml
[env]
  CORS_ORIGIN = "https://your-frontend-domain.com,https://your-other-domain.com"
```

### Update Database URL

If you need to change database:

```bash
fly secrets set DATABASE_URL="new-connection-string"
```

## Security Checklist

- [ ] All secrets are set using `fly secrets set` (never in fly.toml)
- [ ] DATABASE_URL uses SSL in production
- [ ] JWT_SECRET and JWT_REFRESH_SECRET are strong random values
- [ ] CORS_ORIGIN is set to your actual frontend domain
- [ ] SMTP credentials are kept secure
- [ ] Database has proper access controls

## Performance Optimization

1. **Enable connection pooling** (already configured in app)
2. **Use Redis for caching** (optional, can add Fly Redis)
3. **Monitor response times** with fly logs
4. **Scale horizontally** if needed

## Useful Commands Reference

```bash
# App Management
fly apps list
fly status
fly logs
fly ssh console

# Secrets Management
fly secrets list
fly secrets set KEY=VALUE
fly secrets unset KEY

# Deployment
fly deploy
fly deploy --remote-only  # Build in cloud
fly releases
fly releases rollback

# Scaling
fly scale count 2
fly scale memory 2048

# Database (if using Fly Postgres)
fly postgres db list
fly postgres connect -a taraz-database
```

## Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- App Logs: `fly logs`
