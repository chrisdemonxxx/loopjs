#!/bin/bash
###############################################################################
# Vercel Deployment Script for LoopJS Frontend
#
# Prerequisites:
#   - Vercel CLI installed: npm install -g vercel
#   - Vercel account created
#
# Usage:
#   ./deploy-vercel.sh [RENDER_BACKEND_URL]
#
# Example:
#   ./deploy-vercel.sh https://loopjs-backend.onrender.com
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🚀 Vercel Deployment Script for LoopJS Frontend"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo ""
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

# Get backend URL from argument or prompt
BACKEND_URL="$1"
if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  No backend URL provided"
    echo ""
    read -p "Enter your Render backend URL (e.g., https://loopjs-backend.onrender.com): " BACKEND_URL
fi

# Validate URL
if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required!"
    exit 1
fi

# Remove trailing slash
BACKEND_URL="${BACKEND_URL%/}"

echo ""
echo "🔧 Configuration:"
echo "   Frontend Directory: $FRONTEND_DIR"
echo "   Backend URL: $BACKEND_URL"
echo ""

# Change to frontend directory
cd "$FRONTEND_DIR"

# Create/update .env.production
echo "📝 Updating .env.production..."
cat > .env.production << EOF
# Production environment variables
# These are baked into the build at build time

# Backend API URL (without trailing slash)
VITE_API_URL=${BACKEND_URL}/api

# WebSocket URL
VITE_WS_URL=${BACKEND_URL/https:/wss:}/ws

# Use local backend
VITE_USE_LOCAL=false
EOF

echo "✅ .env.production updated"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    echo "✅ Dependencies installed"
    echo ""
fi

# Build the project
echo "🔨 Building frontend..."
npm run build
echo "✅ Build complete"
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "📋 You will be prompted to:"
echo "   1. Login to Vercel (if not already logged in)"
echo "   2. Set up your project settings"
echo "   3. Confirm deployment"
echo ""

# Deploy with production flag
vercel --prod \
    --build-env VITE_API_URL="${BACKEND_URL}/api" \
    --build-env VITE_WS_URL="${BACKEND_URL/https:/wss:}/ws" \
    --build-env VITE_USE_LOCAL="false"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy your Vercel URL from the output above"
echo "   2. Update Render backend CORS with your Vercel URL"
echo "   3. Test your production deployment"
echo ""
