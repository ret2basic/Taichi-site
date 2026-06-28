#!/usr/bin/env bash

# Taichi Audit Site Update Script
# Run this script whenever you want to deploy changes

set -euo pipefail

echo "🚀 Starting Taichi Audit site update..."

# Navigate to the site directory
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if command -v pm2 >/dev/null 2>&1; then
  PM2_CMD=(pm2)
else
  PM2_CMD=(npx --yes pm2@latest)
fi

# echo "📥 Pulling latest changes from GitHub..."
# git pull origin main

echo "📦 Installing any new dependencies..."
npm ci

echo "🏗️ Building the updated site..."
npm run build

echo "🔄 Restarting the site with PM2..."
mkdir -p logs
"${PM2_CMD[@]}" startOrReload ecosystem.config.js --only taichi-site --update-env

echo "🧹 Cleaning up..."
"${PM2_CMD[@]}" save

echo "✅ Site update complete!"
echo "🌐 Your changes are now live!"

# Show status
"${PM2_CMD[@]}" status taichi-site
