#!/bin/bash

# Taichi Audit Site Update Script
# Run this script whenever you want to deploy changes

set -e  # Exit on any error

echo "🚀 Starting Taichi Audit site update..."

# Navigate to site directory
cd /root/Taichi-site

# echo "📥 Pulling latest changes from GitHub..."
# git pull origin main

echo "📦 Installing any new dependencies..."
npm ci --only=production

echo "🏗️ Building the updated site..."
npm run build

echo "🔄 Restarting the site with PM2..."
pm2 restart taichi-site

echo "🧹 Cleaning up..."
pm2 save

echo "✅ Site update complete!"
echo "🌐 Your changes are now live!"

# Show status
pm2 status taichi-site 