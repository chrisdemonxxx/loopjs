#!/bin/bash
###############################################################################
# LoopJS Deployment Setup Script
#
# This script installs necessary CLI tools and prepares your environment
# for deploying to Render and Vercel
###############################################################################

set -e

echo "🚀 LoopJS Deployment Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "🔍 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
echo ""

# Install Vercel CLI
echo "📦 Installing Vercel CLI..."
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI already installed${NC}"
else
    npm install -g vercel
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi
echo ""

# Note about Render
echo "📋 Render Deployment Options:"
echo "   1. Via Dashboard: https://dashboard.render.com (Recommended)"
echo "   2. Via Blueprint: Uses backend/render.yaml (Automatic)"
echo "   3. Via API: Use deploy-render.js script"
echo ""

# Set up API keys
echo "🔑 API Keys Setup"
echo "================="
echo ""
echo "You have:"
echo "  ✅ Render API Key: rnd_R2QLPilRlRJ0jglK1EckRfOBsJje"
echo ""
echo "For Vercel, you'll login via CLI when deploying (no API key needed)"
echo ""

# Create .env file for deployment scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📝 Creating deployment environment file..."

cat > "$SCRIPT_DIR/.env.deployment" << 'EOF'
# Deployment Configuration
# DO NOT COMMIT THIS FILE TO GIT

# Render API Key
RENDER_API_KEY=rnd_R2QLPilRlRJ0jglK1EckRfOBsJje

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://chrisdemonxxx_db_user:Demon%4046@cluster0.1vs04ow.mongodb.net/loopjs?retryWrites=true&w=majority&appName=Cluster0

# Vercel (login via CLI when deploying)
# VERCEL_TOKEN=your_token_here (optional for CI/CD)
EOF

echo -e "${GREEN}✅ Created .env.deployment${NC}"
echo ""

# Add to .gitignore
if ! grep -q ".env.deployment" "$SCRIPT_DIR/.gitignore" 2>/dev/null; then
    echo ".env.deployment" >> "$SCRIPT_DIR/.gitignore"
    echo -e "${GREEN}✅ Added .env.deployment to .gitignore${NC}"
fi
echo ""

# Make scripts executable
chmod +x "$SCRIPT_DIR/deploy-vercel.sh"
chmod +x "$SCRIPT_DIR/deploy-render.js"
echo -e "${GREEN}✅ Made deployment scripts executable${NC}"
echo ""

# Summary
echo "✨ Setup Complete!"
echo "================="
echo ""
echo "📋 Available deployment scripts:"
echo "   1. ./deploy-render.js     - Check Render API and show deployment steps"
echo "   2. ./deploy-vercel.sh     - Deploy frontend to Vercel"
echo "   3. Manual deployment via Render Dashboard (Recommended)"
echo ""
echo "🚀 Quick Start:"
echo "   1. Deploy backend: Go to https://dashboard.render.com"
echo "      - Click 'New +' → 'Blueprint'"
echo "      - Connect your GitHub repo"
echo "      - Render will auto-detect backend/render.yaml"
echo ""
echo "   2. Deploy frontend: ./deploy-vercel.sh [RENDER_URL]"
echo "      - Example: ./deploy-vercel.sh https://loopjs-backend.onrender.com"
echo ""
echo "📖 Full guide: See QUICK_DEPLOY.md"
echo ""
