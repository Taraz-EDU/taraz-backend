# Deployment Guide - Fly.io

This guide explains how to deploy the Taraz Backend application to Fly.io using GitHub Actions.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Fly.io CLI**: Install the Fly.io CLI locally for initial setup

## Initial Setup

### 1. Install Fly.io CLI

```bash
# macOS
brew install flyctl

# Linux/Windows
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
flyctl auth login
```

### 3. Create Fly.io App

```bash
# Initialize the app (this will create fly.toml)
flyctl apps create taraz-backend

# Set up the app with PostgreSQL
flyctl postgres create --name taraz-backend-db

# Connect the database to your app
flyctl postgres attach taraz-backend-db --app taraz-backend
```

### 4. Set Environment Variables

```bash
# Set production environment variables
flyctl secrets set NODE_ENV=production --app taraz-backend
flyctl secrets set JWT_SECRET=your-production-jwt-secret --app taraz-backend
flyctl secrets set CORS_ORIGIN=https://your-frontend-domain.com --app taraz-backend
```

## GitHub Actions Setup

### 1. Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `FLY_API_TOKEN`: Get this from [Fly.io Dashboard](https://fly.io/dashboard/personal/tokens)
- `CODECOV_TOKEN`: (Optional) For code coverage reporting

### 2. Configure GitHub Actions

The deployment workflow is already configured in `.github/workflows/deploy-fly.yml`. It will:

1. **Test**: Run linting, formatting, unit tests, integration tests, and security audit
2. **Build**: Create deployment artifacts
3. **Deploy**: Deploy to Fly.io with database migrations
4. **Health Check**: Verify deployment success

## Deployment Process

### Automatic Deployment

The app automatically deploys when you push to the `main` branch:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub Actions tab in your repository
2. Select "Deploy to Fly.io" workflow
3. Click "Run workflow"

### Local Deployment

For testing deployments locally:

```bash
# Build the application
npm run build

# Deploy to Fly.io
flyctl deploy

# Check deployment status
flyctl status

# View logs
flyctl logs
```

## Monitoring and Management

### View Application Logs

```bash
# Real-time logs
flyctl logs --app taraz-backend

# Follow logs
flyctl logs --app taraz-backend --follow
```

### Check Application Status

```bash
# Application status
flyctl status --app taraz-backend

# Application info
flyctl info --app taraz-backend
```

### Scale Application

```bash
# Scale to 2 instances
flyctl scale count 2 --app taraz-backend

# Scale memory
flyctl scale memory 1024 --app taraz-backend
```

### Database Management

```bash
# Connect to database
flyctl postgres connect --app taraz-backend-db

# Run migrations manually
flyctl ssh console --app taraz-backend --command "npm run migration:run"

# Backup database
flyctl postgres backup create --app taraz-backend-db
```

## Environment Configuration

### Production Environment Variables

Set these in Fly.io dashboard or via CLI:

```bash
# Required variables
NODE_ENV=production
DATABASE_URL=postgresql://...  # Set automatically by Fly.io
JWT_SECRET=your-production-secret
CORS_ORIGIN=https://your-frontend-domain.com

# Optional variables
LOG_LEVEL=info
REDIS_URL=redis://...  # If using Redis
```

### Local Development

Copy the example environment file:

```bash
cp env.example .env
# Edit .env with your local configuration
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check logs
   flyctl logs --app taraz-backend
   
   # Check status
   flyctl status --app taraz-backend
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   flyctl postgres status --app taraz-backend-db
   
   # Test connection
   flyctl postgres connect --app taraz-backend-db
   ```

3. **Health Check Failures**
   - Ensure your app has a `/health` endpoint
   - Check that the app starts correctly
   - Verify environment variables are set

### Debug Commands

```bash
# SSH into the running container
flyctl ssh console --app taraz-backend

# Check environment variables
flyctl ssh console --app taraz-backend --command "env"

# Check application logs
flyctl logs --app taraz-backend --follow
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to the repository
2. **Database Security**: Use Fly.io's managed PostgreSQL
3. **HTTPS**: Enabled by default with Fly.io
4. **CORS**: Configure appropriate origins for production
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Cost Optimization

1. **Auto-scaling**: Configure appropriate min/max instances
2. **Resource Limits**: Set appropriate CPU and memory limits
3. **Database**: Use appropriate database size for your needs
4. **Monitoring**: Set up alerts for unusual usage

## Backup and Recovery

```bash
# Create database backup
flyctl postgres backup create --app taraz-backend-db

# List backups
flyctl postgres backup list --app taraz-backend-db

# Restore from backup
flyctl postgres backup restore <backup-id> --app taraz-backend-db
```

## Support

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Community](https://community.fly.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
