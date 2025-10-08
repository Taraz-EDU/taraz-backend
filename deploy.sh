#!/bin/bash

# Taraz Backend Deployment Script

echo "🚀 Starting deployment to Fly.io..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"

# Deploy to Fly.io
echo "🚁 Deploying to Fly.io..."
flyctl deploy

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed!"
  exit 1
fi

echo "✅ Deployment successful!"
echo "🎉 Your backend is now live at https://taraz-backend.fly.dev"
echo "📚 Swagger docs: https://taraz-backend.fly.dev/api"
echo "💚 Health check: https://taraz-backend.fly.dev/health"

