# LoopJS AI Memory - Persistent Project Knowledge

## Project Identity
**Name**: LoopJS C2 Panel System  
**Type**: Command & Control Panel  
**Status**: Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 1, 2025  

## Core Architecture
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

## Production Environment
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws
- **Project ID**: code-assist-470813
- **Region**: us-central1
- **Platform**: Google Cloud Run

## Component Details

### Backend (Node.js/Express)
- **Location**: `backend/`
- **Port**: 8080 (production), 3000 (development)
- **Database**: MongoDB with Mongoose
- **WebSocket**: Real-time client communication
- **Authentication**: JWT-based
- **Deployment**: Google Cloud Run
- **Key Files**: `index.js`, `cloudbuild.yaml`

### Frontend (React/TypeScript)
- **Location**: `frontend/`
- **Port**: 80 (production), 5173 (development)
- **Framework**: React + Vite + TypeScript
- **UI**: Tailwind CSS with custom hacker theme
- **Deployment**: Google Cloud Run with Nginx
- **Key Files**: `src/config.ts`, `src/App.tsx`, `Dockerfile`

### Client (Qt C++)
- **Location**: `clients/qt-client/`
- **Framework**: Qt 6.9.3 with MinGW
- **Features**: WebSocket communication, system monitoring
- **Build**: CMake with static linking for standalone deployment
- **Key Files**: `CMakeLists.txt`, `build-standalone.bat`

## Configuration Constants

### Frontend Configuration
```typescript
// frontend/src/config.ts
const BACKEND_URL = 'https://loopjs-backend-361659024403.us-central1.run.app';
export const WS_URL = 'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
export const API_URL = `${BACKEND_URL}/api`;
```

### Backend Configuration
- **MongoDB URI**: Stored in Google Secret Manager
- **JWT Secret**: Stored in Google Secret Manager
- **Session Secret**: Stored in Google Secret Manager
- **CORS**: Configured for loopjs.vidai.sbs

### Client Configuration
- **Qt Path**: `C:\Qt\6.9.3\mingw_64`
- **Build Output**: `dist/` directory
- **Dependencies**: Qt6Core, Qt6Gui, Qt6Widgets, Qt6WebSockets, Qt6Network
- **SSL/TLS**: Windows SChannel backend

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### Client Management
- `GET /api/info/get-user-list` - Get all clients
- `POST /api/info/register-client` - Register new client
- `GET /api/info/client/:uuid` - Get client details

### Health & Monitoring
- `GET /health` - Backend health check
- `GET /api/status` - System status

## WebSocket Communication

### Message Types
- **Client**: register, heartbeat, command_result
- **Admin**: auth, web_client, command
- **Server**: auth_success, register_success, client_status_update

### Connection Flow
1. Client connects to WebSocket
2. Client sends registration message
3. Server validates and stores client info
4. Server broadcasts client list to admin sessions
5. Admin can send commands to clients
6. Clients execute commands and send results

## Database Schema

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

## Deployment Automation

### GitHub Actions
- **Location**: `.github/workflows/`
- **Main Workflow**: `deploy-all.yml`
- **Backend Workflow**: `deploy-backend.yml`
- **Frontend Workflow**: `deploy-frontend.yml`
- **Trigger**: Push to main branch

### Google Cloud Build
- **Backend**: `backend/cloudbuild.yaml`
- **Frontend**: Uses Dockerfile + Nginx
- **Features**: Health checks, zero-downtime deployment, rollback

### Build Scripts
- **Standalone**: `clients/qt-client/build-standalone.bat`
- **Single Executable**: `clients/qt-client/create-final-single-exe.ps1`
- **Self-Extracting**: `clients/qt-client/create-sfx-exe.ps1`

## Common Issues & Solutions

### 1. Client Not Showing in C2 Panel
**Problem**: Frontend shows 0 clients
**Root Cause**: Wrong API endpoint or backend URL
**Solution**: 
1. Check `frontend/src/services/agentService.ts` uses `/info/get-user-list`
2. Verify `frontend/src/config.ts` has correct backend URL
3. Test API: `curl https://loopjs-backend-361659024403.us-central1.run.app/api/info/get-user-list`

### 2. WebSocket Connection Failed
**Problem**: WebSocket fails to connect
**Root Cause**: Wrong WebSocket URL or CORS issues
**Solution**:
1. Verify WebSocket URL in `frontend/src/config.ts`
2. Check CORS settings in backend
3. Test WebSocket: `wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws`

### 3. SSL/TLS Issues
**Problem**: "No functional TLS backend was found"
**Root Cause**: Missing SChannel backend DLLs
**Solution**: Include SChannel backend DLLs in client deployment
```batch
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qschannelbackend.dll" dist\tls\
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qcertonlybackend.dll" dist\tls\
```

### 4. Build Failures
**Problem**: CMake or build errors
**Root Cause**: Missing CMake or Qt installation
**Solution**:
1. Use existing build: `.\build-standalone.bat`
2. Install CMake: `winget install Kitware.CMake`
3. Check Qt installation path

## Development Commands

### Local Development
```bash
# Backend
cd backend && npm run dev  # Port 8080

# Frontend
cd frontend && npm run dev  # Port 5173

# Client
cd clients/qt-client && .\build-standalone.bat
```

### Production Deployment
```bash
# Automated (GitHub Actions)
git push origin main

# Manual
gcloud run deploy loopjs-backend --source ./backend --region us-central1
gcloud run deploy loopjs-frontend --source ./frontend --region us-central1
```

### Testing
```bash
# Backend health
curl https://loopjs-backend-361659024403.us-central1.run.app/health

# Frontend
curl https://loopjs.vidai.sbs/

# WebSocket
wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws
```

## Security Configuration

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Server-side session handling
- **Password Hashing**: bcrypt for password security

### Communication
- **SSL/TLS**: Encrypted WebSocket and HTTP communication
- **CORS**: Domain-specific cross-origin resource sharing
- **Input Validation**: All inputs sanitized and validated

### Access Control
- **Role-based Access**: Admin and user roles
- **Audit Logging**: Complete activity tracking
- **Rate Limiting**: API request throttling

## Monitoring & Logs

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

## File Structure
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
├── PROJECT_MEMORY.md       # Complete project documentation
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── CLIENT_BUILD_GUIDE.md   # Client build guide
├── README.md               # Project overview
├── .cursorrules            # Cursor AI rules
└── .cursorignore           # Cursor ignore rules
```

## Key Development Patterns

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

## Important Notes
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
