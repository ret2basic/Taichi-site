#!/bin/bash

# Taichi Audit Group Website Deployment Script
echo "🚀 Starting deployment for Taichi Audit Group..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Set environment
NODE_ENV=${NODE_ENV:-production}
echo "📦 Environment: $NODE_ENV"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linting warnings found, continuing..."

# Build the project
echo "🏗️  Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Start the production server (for VPS deployment)
if [ "$1" = "start" ]; then
    echo "🚀 Starting production server..."
    npm run start
fi

# For Vercel deployment
if [ "$1" = "vercel" ]; then
    echo "🌐 Deploying to Vercel..."
    npx vercel --prod
fi

# For static export
if [ "$1" = "export" ]; then
    echo "📤 Creating static export..."
    npm run build
    npx next export
    echo "✅ Static export created in 'out' directory"
fi

echo "🎉 Deployment process completed!"
echo ""
echo "📋 Next steps:"
echo "  - For VPS: Copy files to your server and run 'npm start'"
echo "  - For Vercel: Files are automatically deployed"
echo "  - For static hosting: Upload 'out' directory contents"
echo ""
echo "🔗 Don't forget to:"
echo "  - Set up environment variables"
echo "  - Configure domain settings"
echo "  - Set up SSL certificates"
echo "  - Configure analytics" 