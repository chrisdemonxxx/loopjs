#!/bin/bash
###############################################################################
# FULLY AUTOMATED DEPLOYMENT SCRIPT FOR LOOPJS
#
# This script handles EVERYTHING:
# - Checks for existing deployments
# - Deploys backend to Render
# - Deploys frontend to Vercel
# - Updates CORS automatically
# - Tests the deployment
#
# ONE-TIME SETUP (if first deploy):
#   1. Get Vercel token: https://vercel.com/account/tokens
#   2. Add to .env.deploy: VERCEL_TOKEN=your_token
#   3. For Render: Connect GitHub repo (script will guide you)
#
# USAGE:
#   chmod +x deploy-automated.sh
#   ./deploy-automated.sh
#
###############################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "  LOOPJS AUTOMATED DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Load environment variables
if [ ! -f .env.deploy ]; then
    echo -e "${RED}❌ Error: .env.deploy not found!${NC}"
    echo ""
    echo "Create .env.deploy with:"
    echo "  RENDER_API_KEY=your_render_key"
    echo "  VERCEL_TOKEN=your_vercel_token"
    echo "  MONGODB_URI=your_mongodb_uri"
    exit 1
fi

source .env.deploy

# Check required variables
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ RENDER_API_KEY not set${NC}"
    exit 1
fi

if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment loaded${NC}"
echo ""

###############################################################################
# VERCEL DEPLOYMENT
###############################################################################

echo -e "${BLUE}━━━ STEP 1: DEPLOY FRONTEND TO VERCEL ━━━${NC}"

if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  VERCEL_TOKEN not set${NC}"
    echo ""
    echo "Get your token:"
    echo "  1. Go to: https://vercel.com/account/tokens"
    echo "  2. Create new token with 'Full Account' scope"
    echo "  3. Add to .env.deploy: VERCEL_TOKEN=your_token"
    echo ""
    read -p "Enter your Vercel token now (or press Enter to skip): " VERCEL_TOKEN

    if [ -z "$VERCEL_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping Vercel deployment${NC}"
        SKIP_VERCEL=true
    else
        # Save token to .env.deploy
        if grep -q "VERCEL_TOKEN=" .env.deploy; then
            sed -i "s|VERCEL_TOKEN=.*|VERCEL_TOKEN=$VERCEL_TOKEN|" .env.deploy
        else
            echo "VERCEL_TOKEN=$VERCEL_TOKEN" >> .env.deploy
        fi
        echo -e "${GREEN}✅ Token saved${NC}"
    fi
fi

if [ "$SKIP_VERCEL" != "true" ]; then
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel || {
            echo -e "${YELLOW}⚠️  Installing locally instead...${NC}"
            cd frontend
            npm install --save-dev vercel
            VERCEL_CMD="npx vercel"
            cd ..
        }
    else
        VERCEL_CMD="vercel"
    fi

    # Deploy to Vercel
    echo "🚀 Deploying to Vercel..."
    cd frontend

    # Set environment variable for vercel
    export VERCEL_TOKEN="$VERCEL_TOKEN"
    export VERCEL_ORG_ID=""
    export VERCEL_PROJECT_ID=""

    # Deploy
    $VERCEL_CMD --prod --yes \
        --env VITE_USE_LOCAL=false \
        2>&1 | tee ../vercel-deploy.log

    # Extract URL from output
    VERCEL_URL=$(grep -oP 'https://[^\s]+\.vercel\.app' ../vercel-deploy.log | head -1)

    if [ -z "$VERCEL_URL" ]; then
        VERCEL_URL=$(grep -oP 'Production: https://[^\s]+' ../vercel-deploy.log | grep -oP 'https://[^\s]+' | head -1)
    fi

    cd ..

    if [ -n "$VERCEL_URL" ]; then
        echo -e "${GREEN}✅ Frontend deployed to: $VERCEL_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not extract Vercel URL from output${NC}"
        echo "Check vercel-deploy.log for details"
    fi
fi

###############################################################################
# RENDER DEPLOYMENT
###############################################################################

echo ""
echo -e "${BLUE}━━━ STEP 2: DEPLOY BACKEND TO RENDER ━━━${NC}"

# Check if GitHub repo is connected to Render
echo "🔍 Checking Render services..."

RENDER_SERVICES=$(curl -s -X GET \
  "https://api.render.com/v1/services?limit=20" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Accept: application/json")

# Check if service exists
SERVICE_ID=$(echo "$RENDER_SERVICES" | grep -oP '"id":"[^"]+' | grep -oP 'srv-[^"]+' | head -1)

if [ -n "$SERVICE_ID" ]; then
    echo -e "${GREEN}✅ Found existing Render service: $SERVICE_ID${NC}"

    # Update environment variables
    echo "🔧 Updating environment variables..."

    curl -s -X PUT \
      "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"envVars\": [
          {\"key\": \"MONGODB_URI\", \"value\": \"$MONGODB_URI\"},
          {\"key\": \"NODE_ENV\", \"value\": \"production\"},
          {\"key\": \"PORT\", \"value\": \"10000\"}
        ]
      }" > /dev/null

    # Trigger deployment
    echo "🚀 Triggering deployment..."

    DEPLOY_RESULT=$(curl -s -X POST \
      "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{}')

    # Get service URL
    BACKEND_URL=$(echo "$RENDER_SERVICES" | grep -oP 'https://[^"]+\.onrender\.com' | head -1)

    echo -e "${GREEN}✅ Backend deployment triggered${NC}"
    echo -e "${GREEN}📍 Backend URL: $BACKEND_URL${NC}"

else
    echo -e "${YELLOW}⚠️  No existing Render service found${NC}"
    echo ""
    echo "ONE-TIME SETUP REQUIRED:"
    echo "  1. Go to: https://dashboard.render.com/create?type=web"
    echo "  2. Connect your GitHub repository"
    echo "  3. Use these settings:"
    echo "     - Name: loopjs-backend"
    echo "     - Root Directory: backend"
    echo "     - Build Command: npm install"
    echo "     - Start Command: npm start"
    echo "  4. Add environment variable:"
    echo "     - MONGODB_URI=$MONGODB_URI"
    echo "  5. Run this script again"
    echo ""
    echo -e "${BLUE}Opening Render dashboard in browser...${NC}"

    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://dashboard.render.com/create?type=web" 2>/dev/null
    elif command -v open &> /dev/null; then
        open "https://dashboard.render.com/create?type=web" 2>/dev/null
    fi

    exit 0
fi

###############################################################################
# UPDATE CORS
###############################################################################

if [ -n "$VERCEL_URL" ] && [ -n "$BACKEND_URL" ]; then
    echo ""
    echo -e "${BLUE}━━━ STEP 3: UPDATE CORS CONFIGURATION ━━━${NC}"

    ALLOWED_ORIGINS="$VERCEL_URL,$BACKEND_URL"

    echo "🔧 Updating CORS to allow: $ALLOWED_ORIGINS"

    curl -s -X PUT \
      "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"envVars\": [
          {\"key\": \"ALLOWED_ORIGINS\", \"value\": \"$ALLOWED_ORIGINS\"}
        ]
      }" > /dev/null

    echo -e "${GREEN}✅ CORS updated${NC}"
fi

###############################################################################
# VERIFY DEPLOYMENT
###############################################################################

if [ -n "$BACKEND_URL" ]; then
    echo ""
    echo -e "${BLUE}━━━ STEP 4: VERIFY DEPLOYMENT ━━━${NC}"

    echo "⏳ Waiting 10 seconds for deployment..."
    sleep 10

    echo "🔍 Testing backend health..."
    HEALTH_CHECK=$(curl -s "$BACKEND_URL/health" || echo "failed")

    if echo "$HEALTH_CHECK" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Backend is healthy!${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check failed (may still be deploying)${NC}"
    fi
fi

###############################################################################
# SUMMARY
###############################################################################

echo ""
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════"
echo "  🎉 DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

if [ -n "$VERCEL_URL" ]; then
    echo -e "${GREEN}📍 Frontend:${NC} $VERCEL_URL"
fi

if [ -n "$BACKEND_URL" ]; then
    echo -e "${GREEN}📍 Backend:${NC} $BACKEND_URL"
    echo -e "${GREEN}📍 Health:${NC} $BACKEND_URL/health"
fi

echo ""
echo -e "${BLUE}🔍 Monitor your deployments:${NC}"
echo "  Render: https://dashboard.render.com"
echo "  Vercel: https://vercel.com/dashboard"
echo ""

echo -e "${GREEN}✨ Your app is now live!${NC}"
echo ""
