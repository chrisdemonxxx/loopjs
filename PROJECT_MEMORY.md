# LoopJS Project Memory - Complete Deployment & Configuration Guide

## 🎯 Project Overview
LoopJS is a Command & Control (C2) panel system with:
- **Backend**: Node.js/Express API with WebSocket support
- **Frontend**: React/TypeScript C2 Panel
- **Client**: Qt C++ desktop application
- **Infrastructure**: Google Cloud Platform with automated deployment

## 🏗️ Architecture & Components

### Backend (Node.js/Express)
- **Location**: `backend/`
- **Port**: 3000 (development), 8080 (production)
- **Database**: MongoDB
- **WebSocket**: Real-time client communication
- **Authentication**: JWT-based
- **Deployment**: Google Cloud Run

### Frontend (React/TypeScript)
- **Location**: `frontend/`
- **Port**: 5173 (development), 80 (production)
- **Framework**: React + Vite + TypeScript
- **UI**: Tailwind CSS with custom hacker theme
- **Deployment**: Google Cloud Run with Nginx

### Client (Qt C++)
- **Location**: `clients/qt-client/`
- **Framework**: Qt 6.9.3 with MinGW
- **Features**: WebSocket communication, system monitoring
- **Build**: CMake with static linking for standalone deployment

## 🌐 Production URLs & Configuration

### Current Production Setup
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws
- **Project ID**: code-assist-470813
- **Region**: us-central1

### Frontend Configuration (`frontend/src/config.ts`)
```typescript
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.port === '4174';

const BACKEND_URL = isLocal ? 
  'http://localhost:8080' : 
  'https://loopjs-backend-361659024403.us-central1.run.app';

export const API_URL = `${BACKEND_URL}/api`;
export const WS_URL = isLocal ? 
  'ws://localhost:8080/ws' : 
  'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
```

### Backend Configuration
- **MongoDB**: Connected via environment variables
- **JWT Secret**: Stored in Google Secret Manager
- **Session Secret**: Stored in Google Secret Manager
- **CORS**: Configured for frontend domain

## 🚀 Deployment Automation

### GitHub Actions Workflows
- **Location**: `.github/workflows/`
- **Main Workflow**: `deploy-all.yml`
- **Backend Workflow**: `deploy-backend.yml`
- **Frontend Workflow**: `deploy-frontend.yml`

### Google Cloud Build
- **Backend**: `backend/cloudbuild.yaml`
- **Frontend**: Uses Dockerfile + Nginx
- **Features**: Health checks, zero-downtime deployment, rollback

### Deployment Process
1. **Push to main branch** triggers GitHub Actions
2. **Backend deploys first** to Cloud Run
3. **Frontend deploys second** with updated backend URL
4. **Health checks** ensure successful deployment
5. **Traffic promotion** with rollback on failure

## 🔧 Key Configuration Files

### Backend API Endpoints
- **Client List**: `GET /api/info/get-user-list`
- **Client Registration**: `POST /api/info/register-client`
- **Health Check**: `GET /health`
- **WebSocket**: `/ws`

### Frontend Service Configuration
- **Agent Service**: `frontend/src/services/agentService.ts`
- **API Integration**: `frontend/src/utils/integration.ts`
- **WebSocket Integration**: Real-time client updates

### Client Build Configuration
- **CMake**: `clients/qt-client/CMakeLists.txt`
- **Build Scripts**: `build-standalone.bat`, `create-final-single-exe.ps1`
- **Dependencies**: Qt6Core, Qt6Gui, Qt6Widgets, Qt6WebSockets, Qt6Network

## 🛠️ Development Setup

### Backend Development
```bash
cd backend
npm install
npm run dev  # Runs on port 8080
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

### Client Development
```bash
cd clients/qt-client
# Use Qt Creator or CMake
mkdir build && cd build
cmake .. -G "MinGW Makefiles"
cmake --build .
```

## 🔐 Security & Authentication

### JWT Configuration
- **Secret**: Stored in Google Secret Manager
- **Expiration**: Configurable
- **Refresh Tokens**: Supported

### WebSocket Authentication
- **Admin Sessions**: JWT-based
- **Client Sessions**: UUID-based registration
- **Message Validation**: Input sanitization

### CORS Configuration
- **Frontend Domain**: loopjs.vidai.sbs
- **Development**: localhost:5173
- **Methods**: GET, POST, PUT, DELETE
- **Headers**: Authorization, Content-Type

## 📊 Database Schema

### Client Model
```javascript
{
  uuid: String,
  computerName: String,
  ipAddress: String,
  hostname: String,
  platform: String,
  operatingSystem: String,
  osVersion: String,
  architecture: String,
  capabilities: Object,
  status: String, // 'online' | 'offline'
  lastSeen: Date,
  lastHeartbeat: Date,
  connectionCount: Number,
  systemInfo: Object
}
```

### Task Model
```javascript
{
  uuid: String,
  command: String,
  status: String, // 'pending' | 'executing' | 'completed' | 'failed'
  result: String,
  createdAt: Date,
  completedAt: Date
}
```

## 🔄 WebSocket Message Types

### Client Messages
- `register`: Client registration
- `heartbeat`: Keep-alive
- `command_result`: Command execution result

### Admin Messages
- `auth`: Authentication
- `web_client`: Admin session identification
- `command`: Send command to client

### Server Messages
- `auth_success`: Authentication successful
- `register_success`: Client registered
- `client_status_update`: Client status change
- `client_list_update`: Full client list update

## 🐛 Common Issues & Solutions

### SSL/TLS Issues
- **Problem**: "No functional TLS backend was found"
- **Solution**: Include SChannel backend DLLs in deployment
- **Files**: `qschannelbackend.dll`, `qcertonlybackend.dll`

### Client Not Showing in C2 Panel
- **Problem**: Frontend shows 0 clients
- **Solution**: Check API endpoint configuration
- **Fix**: Update `agentService.ts` to use `/info/get-user-list`

### WebSocket Connection Issues
- **Problem**: WebSocket fails to connect
- **Solution**: Verify URL configuration and CORS settings
- **Check**: Backend URL, WebSocket URL, authentication

### Build Issues
- **Problem**: CMake not found
- **Solution**: Install CMake or use existing build
- **Alternative**: Use `build-standalone.bat` script

## 📝 Deployment Checklist

### Before Deployment
- [ ] Update backend URL in frontend config
- [ ] Verify Google Cloud credentials
- [ ] Check MongoDB connection
- [ ] Test local development setup

### During Deployment
- [ ] Monitor GitHub Actions workflow
- [ ] Check Cloud Run logs
- [ ] Verify health checks
- [ ] Test WebSocket connections

### After Deployment
- [ ] Test frontend at https://loopjs.vidai.sbs/
- [ ] Verify client connections
- [ ] Check C2 panel functionality
- [ ] Monitor error logs

## 🔧 Maintenance & Updates

### Regular Tasks
- Monitor Cloud Run metrics
- Check MongoDB performance
- Update dependencies
- Review security logs

### Scaling Considerations
- Cloud Run auto-scaling configured
- MongoDB Atlas for production
- CDN for frontend assets
- Load balancing for high traffic

## 📞 Support & Troubleshooting

### Log Locations
- **Backend**: Google Cloud Run logs
- **Frontend**: Browser console
- **Client**: Application output

### Debug Commands
```bash
# Check backend health
curl https://loopjs-backend-361659024403.us-central1.run.app/health

# Test WebSocket connection
wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws

# Check client list
curl https://loopjs-backend-361659024403.us-central1.run.app/api/info/get-user-list
```

### Contact Information
- **Project**: LoopJS C2 Panel
- **Repository**: GitHub repository
- **Documentation**: This file and README files

---

**Last Updated**: October 1, 2025
**Version**: 1.0.0
**Status**: Production Ready
