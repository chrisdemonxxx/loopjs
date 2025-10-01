# LoopJS Project Memory - Complete Documentation & File Structure

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
  'wss://loopjs-backend-361659024403.us-central1.run.app/ws`;
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

### Backend Configuration
- `backend/index.js` - Main server file with CORS, WebSocket, and API setup
- `backend/configs/ws.handler.js` - WebSocket message handling
- `backend/models/Client.js` - Client data model
- `backend/models/Task.js` - Task execution model
- `backend/controllers/info.controller.js` - Client information endpoints
- `backend/cloudbuild.yaml` - Google Cloud Build configuration
- `backend/Dockerfile` - Container configuration

### Frontend Configuration
- `frontend/src/config.ts` - API and WebSocket URL configuration
- `frontend/src/App.tsx` - Main React application
- `frontend/src/services/agentService.ts` - Client management service
- `frontend/src/utils/integration.ts` - Backend integration utilities
- `frontend/Dockerfile` - Frontend container configuration
- `frontend/nginx.conf` - Nginx configuration for production

### Client Configuration
- `clients/qt-client/mainwindow.cpp/h` - Main Qt application logic
- `clients/qt-client/CMakeLists.txt` - CMake build configuration
- `clients/qt-client/config.json` - Client configuration
- `clients/qt-client/build-standalone.bat` - Standalone build script
- `clients/qt-client/create-final-single-exe.ps1` - Single executable creation

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

### Security Features
- SSL/TLS encryption for all WebSocket connections
- JWT token-based authentication for admin sessions
- CORS configuration for cross-origin requests
- Rate limiting and input validation
- Process isolation for command execution
- Google Secret Manager for sensitive data

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

### User Model
- Authentication and admin management

### AuditLog Model
- System audit trail

## 🔄 WebSocket Communication Protocol

### Client Messages
- `register`: Client registration
- `heartbeat`: Keep-alive
- `capability_report`: Client capabilities
- `output`: Command output
- `command_result`: Command execution result

### Server Messages
- `register_success`: Client registered successfully
- `execute`: Execute command on client
- `messagebox`: Show message box on client
- `visit_page`: Open URL on client
- `download`: Download file to client
- `shutdown`: Shutdown client system
- `restart`: Restart client system
- `auth_success`: Authentication successful
- `client_status_update`: Client status change
- `client_list_update`: Full client list update

### Admin Messages
- `auth`: Authentication
- `web_client`: Admin session identification
- `command`: Send command to client

### Server to Admin
- `auth_success`: Authentication successful
- `client_list_update`: Full client list update
- `client_status_update`: Client status change
- `output`: Command output from clients

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

## 📚 Documentation Files

### Root Level Documentation
- `PROJECT_MEMORY.md` - Complete project memory with architecture, URLs, deployment info
- `DEPLOYMENT_GUIDE.md` - Production deployment guide with commands and troubleshooting
- `CLIENT_BUILD_GUIDE.md` - Qt client build guide with scripts and deployment packages
- `DEPLOYMENT_FIXES_SUMMARY.md` - GitHub & GCloud automation fixes and current status
- `README.md` - Main project overview
- `README-DEPLOYMENT.md` - Deployment instructions

### Documentation Directory (`docs/`)
- `DEPLOYMENT_SETUP.md` - Comprehensive deployment setup guide
- `GITHUB_CLEANUP_PLAN.md` - Repository cleanup and organization plan
- `QUICK_FIX_GUIDE.md` - Quick start guide for getting deployments working

### Backend Documentation (`backend/`)
- `README.md` - Backend overview
- `README-DEPLOYMENT.md` - Backend deployment guide
- `README-WORDFUL.md` - Wordful deployment specific guide
- `DEPLOYMENT_CHECKLIST.md` - Backend deployment checklist
- `MONGODB_SETUP.md` - MongoDB configuration guide
- `MONITORING_GUIDE.md` - System monitoring and health checks
- `VERIFICATION_GUIDE.md` - Deployment verification steps
- `WORDFUL_DEPLOYMENT.md` - Wordful platform deployment guide

### Client Documentation (`clients/`)
- `README.md` - Client implementations overview
- `qt-client/README.md` - Qt client specific documentation
- `stealth-client/README.md` - Stealth client documentation

### Frontend Documentation (`frontend/`)
- `README.md` - Frontend overview and setup

### Scripts Documentation (`scripts/`)
- `README.md` - Automation scripts overview

## 🚀 Build and Deployment Process

### Build Process
1. **Backend**: Docker container → Google Cloud Run
2. **Frontend**: React build → Nginx container → Google Cloud Run
3. **Client**: Qt CMake build → Standalone executable with DLLs
4. **Automation**: GitHub Actions → Cloud Build → Cloud Run deployment

### Deployment Automation
- `.github/workflows/deploy-all.yml` - Main deployment workflow
- `.github/workflows/deploy-backend.yml` - Backend specific deployment
- `.github/workflows/deploy-frontend.yml` - Frontend specific deployment
- `scripts/deploy-all.ps1` - PowerShell deployment script
- `scripts/verify-deployment.ps1` - Deployment verification script

## 📁 File Structure Summary
```
loopjs/
├── backend/                 # Node.js API server
│   ├── controllers/         # API controllers
│   ├── configs/            # Configuration files
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── cloudbuild.yaml     # Google Cloud Build config
│   └── index.js            # Main server file
├── frontend/               # React C2 panel
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── config.ts       # Configuration
│   │   └── App.tsx         # Main app component
│   ├── Dockerfile          # Container configuration
│   └── nginx.conf          # Nginx configuration
├── clients/qt-client/      # Qt C++ client
│   ├── build-standalone.bat # Build script
│   ├── CMakeLists.txt      # CMake configuration
│   └── src/                # Source code
├── .github/workflows/      # GitHub Actions
│   ├── deploy-all.yml      # Main deployment workflow
│   ├── deploy-backend.yml  # Backend deployment
│   └── deploy-frontend.yml # Frontend deployment
├── .cursor/                # Cursor AI configuration
│   ├── settings.json       # Project settings
│   ├── context.md          # Project context
│   └── ai-memory.md        # This file
├── docs/                   # Documentation
├── scripts/                # Automation scripts
├── PROJECT_MEMORY.md       # Complete project documentation
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── CLIENT_BUILD_GUIDE.md   # Client build guide
├── DEPLOYMENT_FIXES_SUMMARY.md # GitHub automation fixes
├── README.md               # Project overview
├── .cursorrules            # Cursor AI rules
└── .cursorignore           # Cursor ignore rules
```

## 🎯 Key Development Patterns

### Frontend Patterns
- **State Management**: React Context + Hooks
- **API Calls**: Axios with interceptors
- **WebSocket**: Real-time updates
- **Routing**: React Router
- **Styling**: Tailwind CSS

### Backend Patterns
- **API Design**: RESTful endpoints
- **WebSocket**: Real-time communication
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT middleware
- **Error Handling**: Centralized error handling

### Client Patterns
- **WebSocket**: Real-time communication
- **System Info**: Hardware/software detection
- **Command Execution**: Process management
- **File Operations**: File system access
- **Network**: HTTP and WebSocket clients

## 🔍 Monitoring & Logs

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

## 🎯 Important Notes
- Always use production URLs for deployment
- Client requires Qt 6.9.3 MinGW 64-bit
- Backend requires MongoDB connection
- Frontend requires backend URL configuration
- All services deployed to Google Cloud Run
- Automated deployment via GitHub Actions
- Health checks and rollback configured
- SSL/TLS support via Windows SChannel
- JWT authentication for security
- Real-time communication via WebSocket
- Project is production-ready and actively maintained

## 📞 Reference Files
- `/workspace/PROJECT_MEMORY.md` - Main project memory
- `/workspace/DEPLOYMENT_GUIDE.md` - Deployment guide
- `/workspace/CLIENT_BUILD_GUIDE.md` - Client build guide
- `/workspace/DEPLOYMENT_FIXES_SUMMARY.md` - GitHub automation fixes
- `/workspace/docs/QUICK_FIX_GUIDE.md` - Quick start guide
- `/workspace/docs/DEPLOYMENT_SETUP.md` - Comprehensive setup guide
- `/workspace/backend/` - Backend documentation directory
- `/workspace/clients/` - Client documentation directory

---

**Last Updated**: October 1, 2025
**Version**: 1.0.0
**Status**: Production Ready
