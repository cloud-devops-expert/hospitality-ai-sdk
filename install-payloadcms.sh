#!/bin/bash

# PayloadCMS Installation Script
# Run this with: bash install-payloadcms.sh

set -e

echo "🔧 Fixing npm cache permissions..."
sudo chown -R 501:20 "/Users/miguelgoncalves/.npm"

echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "📦 Installing PayloadCMS packages..."
npm install \
  payload@3.60.0 \
  @payloadcms/next@3.60.0 \
  @payloadcms/richtext-lexical@3.60.0 \
  @payloadcms/db-postgres@3.60.0 \
  @payloadcms/plugin-seo@3.60.0 \
  sharp \
  graphql \
  pg \
  --legacy-peer-deps

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Open admin panel: http://localhost:3000/admin"
echo "3. Create your first admin user"
