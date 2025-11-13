# LoopJS Project Context

## Project Overview
LoopJS is a Command & Control (C2) panel system designed for system administration and remote management. It consists of three main components:

### Architecture
- **Frontend**: React/TypeScript C2 Panel (https://loopjs.vidai.sbs/)
- **Backend**: Node.js/Express API with WebSocket support
- **Client**: Qt C++ desktop application for Windows

### Production Environment
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws
- **Project ID**: code-assist-470813
- **Region**: us-central1

## Key Components

### Backend (`backend/`)
- **Framework**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **WebSocket**: Real-time client communication
- **Authentication**: JWT-based security
- **Deployment**: Google Cloud Run
- **Port**: 8080 (production), 3000 (development)

### Frontend (`frontend/`)
- **Framework**: React + TypeScript + Vite
- **UI**: Tailwind CSS with custom hacker theme
- **State**: React Context + Hooks
- **Deployment**: Google Cloud Run with Nginx
- **Port**: 80 (production), 5173 (development)

### Client (`clients/qt-client/`)
- **Framework**: Qt 6.9.3 C++
- **Compiler**: MinGW 64-bit
- **Build**: CMake with static linking
- **Deployment**: Standalone executable
- **SSL/TLS**: Windows SChannel backend

## Configuration Files

### Frontend Configuration
```typescript
// frontend/src/config.ts
const BACKEND_URL = 'https://loopjs-backend-361659024403.us-central1.run.app';
export const WS_URL = 'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
```

### Backend Configuration
- **MongoDB**: Connected via environment variables
- **JWT Secret**: Stored in Google Secret Manager
- **Session Secret**: Stored in Google Secret Manager
- **CORS**: Configured for frontend domain

### Client Configuration
- **CMake**: `clients/qt-client/CMakeLists.txt`
- **Build Scripts**: `build-standalone.bat`, `create-final-single-exe.ps1`
- **Dependencies**: Qt6Core, Qt6Gui, Qt6Widgets, Qt6WebSockets, Qt6Network

## Deployment Automation

### GitHub Actions
- **Location**: `.github/workflows/`
- **Main Workflow**: `deploy-all.yml`
- **Backend Workflow**: `deploy-backend.yml`
- **Frontend Workflow**: `deploy-frontend.yml`

### Google Cloud Build
- **Backend**: `backend/cloudbuild.yaml`
- **Frontend**: Uses Dockerfile + Nginx
- **Features**: Health checks, zero-downtime deployment, rollback

### Build Scripts
- **Standalone**: `clients/qt-client/build-standalone.bat`
- **Single Executable**: `clients/qt-client/create-final-single-exe.ps1`
- **Self-Extracting**: `clients/qt-client/create-sfx-exe.ps1`

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

## Security Features

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

## Common Issues & Solutions

### Client Not Showing in C2 Panel
**Problem**: Frontend shows 0 clients
**Solution**: 
1. Check API endpoint configuration in `frontend/src/services/agentService.ts`
2. Verify backend URL in `frontend/src/config.ts`
3. Test API endpoint: `curl https://loopjs-backend-361659024403.us-central1.run.app/api/info/get-user-list`

### WebSocket Connection Failed
**Problem**: WebSocket fails to connect
**Solution**:
1. Verify WebSocket URL configuration
2. Check CORS settings in backend
3. Test WebSocket connection: `wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws`

### SSL/TLS Issues
**Problem**: "No functional TLS backend was found"
**Solution**: Include SChannel backend DLLs in client deployment
```batch
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qschannelbackend.dll" dist\tls\
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qcertonlybackend.dll" dist\tls\
```

### Build Failures
**Problem**: CMake or build errors
**Solution**:
1. Use existing build: `.\build-standalone.bat`
2. Install CMake: `winget install Kitware.CMake`
3. Check Qt installation path

## Development Workflow

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
├── PROJECT_MEMORY.md       # Complete project documentation
├── DEPLOYMENT_GUIDE.md     # Deployment instructions
├── CLIENT_BUILD_GUIDE.md   # Client build guide
├── README.md               # Project overview
├── .cursorrules            # Cursor AI rules
├── .cursorignore           # Cursor ignore rules
└── .cursor/                # Cursor configuration
    ├── settings.json       # Project settings
    └── context.md          # This file
```

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
