# LoopJS Project Structure

## Overview
LoopJS is a Command & Control (C2) panel system organized into three main sections:

## 📁 Project Organization

### 🎨 Frontend (`/frontend`)
React/TypeScript C2 Panel - Web-based control interface
- **Source Code**: `/src` - React components, pages, services
- **Configuration**: Build configs, TypeScript configs
- **Deployment**: Dockerfile, nginx config
- **Build Output**: `/dist` - Compiled frontend assets

### ⚙️ Backend (`/backend`)
Node.js/Express API Server with WebSocket support
- **Core**: `index.js`, `package.json` - Main server entry point
- **API**: `/controllers`, `/routes` - REST API endpoints
- **Models**: `/models` - Database schemas (MongoDB)
- **Middleware**: `/middleware` - Authentication, security, validation
- **Services**: `/services` - Business logic services
- **Configuration**: `/configs` - Server configuration files
- **Deployment**: Dockerfile, cloudbuild.yaml, app.yaml

### 💻 Clients (`/clients`)
Multiple client implementations for different platforms

#### Qt C++ Client (`/clients/qt-client`)
- **Source**: `.cpp`, `.h` files - Core client implementation
- **Build**: `.bat` scripts, CMakeLists.txt, .pro files
- **Config**: `config.json` - Client configuration

#### C# Client (`/clients/C# Client`)
- **Source**: `Program.cs` - Main client implementation
- **Project**: `.csproj`, `.sln` - Visual Studio project files
- **Config**: `Properties/launchSettings.json`

#### Stealth Client (`/clients/stealth-client`)
- **Headers**: Core injection and evasion headers
- **Minimal**: Lightweight implementation

### 🔧 Shared Resources (`/scripts`)
Deployment and utility scripts
- **Deployment**: `deploy-all.ps1`, `setup-*.ps1`
- **Configuration**: `update-client-config.ps1`
- **Verification**: `verify-deployment.ps1`

## 🚀 Quick Start

### Backend Development
```bash
cd backend
npm install
npm run dev  # Port 8080
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Port 5173
```

### Client Development
```bash
# Qt Client
cd clients/qt-client
./build-standalone.bat

# C# Client
cd clients/C# Client
dotnet build
```

## 📋 Production URLs
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws

## 🔧 Configuration
- **Frontend Config**: `frontend/src/config.ts`
- **Backend Config**: `backend/configs/`
- **Client Configs**: `clients/*/config.json`

## 📦 Deployment
- **Automated**: GitHub Actions (`.github/workflows/`)
- **Manual**: `scripts/deploy-all.ps1`
- **Platform**: Google Cloud Run
