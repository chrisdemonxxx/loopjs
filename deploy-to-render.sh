#!/bin/bash

# Deploy LoopJS Backend to Render
# This script uses Render API to deploy the backend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LoopJS Backend Deployment to Render${NC}"
echo ""

# Check for Render API token
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${RED}❌ RENDER_API_KEY environment variable not set${NC}"
    echo "Please set it with: export RENDER_API_KEY=your_render_api_key"
    exit 1
fi

echo -e "${GREEN}✅ Render API key found${NC}"

# Repository information
REPO_URL="https://github.com/chrisdemonxxx/loopjs"
BRANCH="claude/frontend-ui-rebuild-01XAcyr1NCQ3VamfXgARfpg9"

echo -e "${BLUE}📦 Deploying from:${NC}"
echo "  Repository: $REPO_URL"
echo "  Branch: $BRANCH"
echo ""

# Create service using Blueprint (render.yaml)
echo -e "${BLUE}🔧 Creating Render service from blueprint...${NC}"

curl -X POST "https://api.render.com/v1/blueprints" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"repo\": \"$REPO_URL\",
    \"branch\": \"$BRANCH\",
    \"name\": \"loopjs-backend\"
  }"

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Go to https://dashboard.render.com to monitor deployment"
echo "2. Set ALLOWED_ORIGINS in Render dashboard after frontend is deployed"
echo "3. PostgreSQL database will be created automatically"
echo "4. Wait for build to complete (~5 minutes)"
echo ""
echo -e "${GREEN}🎉 Backend deployment in progress!${NC}"
