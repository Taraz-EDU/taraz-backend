#!/bin/bash

# Quick Deployment Script for Fly.io
# Run this after fixing the code issues

set -e

echo "🚀 Deploying Taraz Backend to Fly.io"
echo "====================================="
echo ""

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI is not installed. Install it from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

echo "✅ Fly CLI is installed"
echo ""

# Check if secrets are set
echo "📋 Checking required secrets..."
echo ""

SECRETS=$(fly secrets list 2>/dev/null || echo "")

check_secret() {
    if echo "$SECRETS" | grep -q "$1"; then
        echo "  ✅ $1 is set"
        return 0
    else
        echo "  ❌ $1 is NOT set"
        return 1
    fi
}

MISSING_SECRETS=0

check_secret "DATABASE_URL" || MISSING_SECRETS=$((MISSING_SECRETS + 1))
check_secret "JWT_SECRET" || MISSING_SECRETS=$((MISSING_SECRETS + 1))
check_secret "JWT_REFRESH_SECRET" || MISSING_SECRETS=$((MISSING_SECRETS + 1))

echo ""

if [ $MISSING_SECRETS -gt 0 ]; then
    echo "❌ Missing $MISSING_SECRETS critical secret(s)"
    echo ""
    echo "To set secrets, run:"
    echo ""
    echo "  fly secrets set DATABASE_URL=\"postgresql://user:password@host:5432/database\""
    echo "  fly secrets set JWT_SECRET=\"\$(openssl rand -base64 32)\""
    echo "  fly secrets set JWT_REFRESH_SECRET=\"\$(openssl rand -base64 32)\""
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ All critical secrets are set"
fi

echo ""
echo "🔨 Building application..."
npm run build

echo ""
echo "🚀 Deploying to Fly.io..."
fly deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: fly status"
echo "📝 View logs: fly logs"
echo "🌐 Open app: fly open /api"
echo ""
