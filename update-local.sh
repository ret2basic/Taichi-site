#!/bin/bash

# Taichi Audit Site Local Update Script
# Run this script to update with local changes (no git pull)

set -e  # Exit on any error

echo "🚀 Starting local site update..."

# Navigate to site directory
cd /root/Taichi-site

echo "📦 Installing any new dependencies..."
npm ci --only=production

echo "🏗️ Building the updated site..."
npm run build

echo "🔄 Restarting the site with PM2..."
pm2 restart taichi-site

echo "🧹 Cleaning up..."
pm2 save

echo "✅ Local update complete!"
echo "🌐 Your changes are now live!"

# Show status
pm2 status taichi-site 