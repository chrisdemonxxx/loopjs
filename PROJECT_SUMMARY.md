# LoopJS - Comprehensive Project Summary

## Executive Overview

LoopJS is a **Command & Control (C2) Panel System** designed for remote system administration and management. It's a full-stack application consisting of:

- **Backend**: Node.js/Express API server with WebSocket support
- **Frontend**: React/TypeScript web-based control panel
- **Clients**: Multiple client implementations (Qt C++, C#, Stealth C++)
- **Infrastructure**: Google Cloud Platform deployment with automated CI/CD

**Production Status**: ✅ Production Ready  
**Live URLs**:
- Frontend: https://loopjs.vidai.sbs/
- Backend: https://loopjs-backend-361659024403.us-central1.run.app
- WebSocket: wss://loopjs-backend-361659024403.us-central1.run.app/ws

---

## Architecture Overview

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Qt/C# Client  │◄──────────────►│   Backend API   │◄──────────────►│   Frontend      │
│   (C++/C#)      │                 │   (Node.js)     │                 │   (React)       │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
         │                                   │                                   │
         │                                   │                                   │
         ▼                                   ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐                 ┌─────────────────┐
│   System Info   │                 │   MongoDB       │                 │   C2 Panel      │
│   Monitoring    │                 │   Database      │                 │   Dashboard     │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

---

## Backend Architecture

### Core Components

#### **1. Server Entry Point** (`backend/index.js`)
- Express HTTP server with WebSocket support
- Fast startup with health check endpoint
- Async initialization of heavy components
- CORS configuration for production domains
- Environment-based configuration

#### **2. Database Models** (MongoDB/Mongoose)

**User Model** (`models/User.js`):
- Authentication: username, email, password (bcrypt hashed)
- Roles: admin, user, viewer
- Preferences: theme, language, notifications, auto-refresh
- Refresh tokens management
- Two-factor authentication support (schema ready)
- Last login tracking

**Client Model** (`models/Client.js`):
- **Identity**: UUID (unique), machineFingerprint (deduplication)
- **Network**: IP address, hostname, computerName, country
- **Platform**: operatingSystem, osVersion, architecture
- **Geolocation**: Enhanced geoLocation with ISP, ASN, timezone
- **Capabilities**: persistence, injection, evasion, commands, features
- **System Info**: username, domain, isAdmin, antivirus, processes, uptime
- **Metrics**: commandSuccess, commandFailed, avgLatencyMs
- **Status**: online/offline, lastHeartbeat, connectionCount
- **Timestamps**: firstSeen, connectedAt, disconnectedAt, bootTime

**Task Model** (`models/Task.js`):
- **Task Management**: taskId (unique), agentUuid, command, params
- **Queue System**: state (pending, sent, ack, completed, failed)
- **Execution**: executionTimeMs, output, errorMessage
- **Tracking**: createdBy, sentAt, ackAt, completedAt
- **Retry Logic**: attempts, lastAttemptAt, priority
- **Platform**: platform-specific command tracking

**CommandPattern Model** (`models/CommandPattern.js`):
- **AI Learning**: Stores successful command patterns
- **Pattern Recognition**: userIntent, softwareName, category
- **Success Tracking**: successRate, averageTime, executionCount
- **Failure Learning**: failedApproaches with error tracking
- **Metadata**: firstSeen, lastUsed, totalExecutions, successCount, failureCount
- **System Context**: requiresAdmin, requiresInternet, requiredTools

**AuditLog Model** (`models/AuditLog.js`):
- User action tracking
- Timestamp and details storage
- User reference for audit trail

**Settings Model** (`models/Settings.js`):
- General: siteName, adminEmail, timezone, language
- Security: sessionTimeout, maxLoginAttempts, requireStrongPasswords
- Appearance: theme, primaryColor, sidebarCollapsed
- AI: aiEnabled, aiProvider
- Telegram: telegramEnabled, botToken, chatId

**RefreshToken Model** (`models/RefreshToken.js`):
- JWT refresh token storage
- 7-day expiration
- User association

#### **3. Controllers**

**info.controller.js**:
- `getUserListAction`: Fetch all clients with formatting
- `registerClientAction`: Register/update client information
- `updateClientHeartbeatAction`: Update client heartbeat

**command.controller.js**:
- Platform-specific command mappings (Windows, Linux, macOS)
- Command validation and compatibility checking
- Capability-based command filtering
- Command categories: system_info, process_management, network, etc.

**task.controller.js**:
- Task creation and management
- Task queue processing
- Task status updates

**user.controller.js**:
- User profile management
- Password updates
- User preferences

**agent.controller.js**:
- Agent-specific operations
- Agent status management

**metrics.controller.js**:
- System metrics collection
- Performance monitoring

**settings.controller.js**:
- Application settings management
- Configuration updates

#### **4. Services**

**geminiAICommandProcessor.js**:
- Google Gemini AI integration for intelligent command processing
- Pattern recognition and learning
- Multi-step command generation
- Error handling and retry logic
- Conversation history per client
- Fallback to rule-based processing

**telegramService.js**:
- Telegram bot integration
- Notifications: newConnection, disconnection, taskCompletion, systemAlerts
- Screenshot sending
- File download notifications
- Command output notifications
- Configuration management

**geoLocationService.js**:
- IP-based geolocation
- ISP and ASN information
- Timezone detection

**microsoftServiceCloner.js**:
- Microsoft service cloning (advanced persistence)

**privilegeDetector.js**:
- Admin privilege detection
- UAC bypass detection

**urlValidator.js**:
- URL validation and sanitization

#### **5. Middleware**

**security.js**:
- JWT authentication (`protect` middleware)
- Rate limiting (auth, API, command)
- Helmet security headers
- Development mode fallback

**rbac.js**:
- Role-based access control
- Role authorization middleware

**audit.js**:
- Action logging middleware
- Audit trail creation

**validation.js**:
- Input validation
- WebSocket message validation

#### **6. WebSocket Handler** (`configs/ws.handler.js`)

**Connection Management**:
- Client registration and authentication
- Admin session authentication (JWT)
- Connection tracking (Map-based)
- Heartbeat handling

**Message Types**:
- `register` / `agent_register`: Client registration
- `auth`: Admin authentication
- `web_client`: Admin session identification
- `command`: Command execution
- `simple_command`: AI-powered simple commands
- `output`: Command output/results
- `heartbeat`: Client heartbeat
- `capability_report`: Client capability updates
- `hvnc_response`: HVNC session responses
- `hvnc_frame`: HVNC frame data

**Features**:
- Pending task processing on client connection
- Task correlation ID mapping
- Broadcast to admin sessions
- Client status updates
- Platform detection and capability extraction
- Command compatibility validation

#### **7. Routes**

**API Endpoints**:
- `/api/login`: User authentication
- `/api/register`: User registration
- `/api/me`: Current user info
- `/api/logout`: User logout
- `/api/refresh-token`: Token refresh
- `/api/info/get-user-list`: Get all clients
- `/api/info/register-client`: Client registration (public)
- `/api/info/client-heartbeat`: Client heartbeat (public)
- `/api/command/*`: Command execution
- `/api/task/*`: Task management
- `/api/agent/*`: Agent operations
- `/api/metrics/*`: Metrics and monitoring
- `/api/user/*`: User management
- `/api/settings/*`: Settings management
- `/api/ai/*`: AI processing
- `/api/telegram/*`: Telegram integration
- `/health`: Health check

---

## Frontend Architecture

### Core Components

#### **1. Pages**

**DashboardPage.tsx**:
- Main dashboard interface
- Client list display
- Task management
- Terminal interface
- Profile management
- Settings integration
- AI insights panel

**LoginPage.tsx**:
- User authentication
- JWT token management
- Session handling

**LogsPage.tsx**:
- Audit log display
- Activity tracking

**UnauthorizedPage.tsx**:
- Access denied page

#### **2. Components**

**Dashboard.tsx**:
- System statistics display
- Client overview cards
- Map component integration

**AgentSection.tsx**:
- Agent/client list display
- Client card rendering
- Status indicators

**ClientCard.tsx**:
- Individual client information display
- Status badges
- Quick actions

**CommandExecutor.tsx**:
- Command input interface
- Command history
- Output display

**UnifiedTerminal.tsx**:
- Terminal interface
- Command execution
- Output streaming

**TaskManagement.tsx**:
- Task list display
- Task status tracking
- Task scheduling

**TaskScheduler.tsx**:
- Scheduled task creation
- Task queue management

**SystemMonitoring.tsx**:
- Real-time system metrics
- Performance graphs

**MapComponent.tsx** / **WorldMap.tsx**:
- Geographic client visualization
- Location-based client display

**AIInsightsPanel.tsx**:
- AI-powered insights
- Command pattern analysis

**HvncControl.tsx**:
- HVNC (Hidden VNC) session control
- Remote desktop functionality

**UserManagement.tsx** / **UserTable.tsx**:
- User list display
- User management operations

**Settings.tsx** / **SettingsPage.tsx**:
- Application settings
- Configuration management

**TelegramConfig.tsx**:
- Telegram bot configuration
- Notification settings

**AuditLogs.tsx**:
- Audit log display
- Activity filtering

**Header.tsx**:
- Navigation header
- User profile dropdown

**Sidebar.tsx**:
- Navigation sidebar
- Menu items

**Layout.tsx**:
- Main layout wrapper
- Theme integration

**ProtectedRoute.tsx**:
- Route protection
- Authentication checks

**Router.tsx**:
- Application routing
- Route definitions

#### **3. Services**

**agentService.ts**:
- Agent API calls
- Command execution
- HVNC session management

**aiService.ts**:
- AI command processing
- Natural language processing

**hvncService.ts**:
- HVNC session management
- Frame handling

**soundService.ts**:
- Sound notifications

**toastService.ts**:
- Toast notifications

#### **4. Contexts**

**ThemeContext.tsx**:
- Theme management (dark/light)
- Theme persistence

**NotificationContext.tsx**:
- Notification management
- Toast notifications

#### **5. Types** (`types.ts`)

**Agent Interface**:
- Complete client/agent data structure
- System information
- Capabilities
- Geolocation
- Status tracking

**User Interface**:
- User data structure
- Authentication info

**Task Interface**:
- Task data structure
- Execution tracking

**CommandCategory Interface**:
- Command categorization
- Platform capabilities

---

## Client Implementations

### 1. Stealth Client (C++)

**Location**: `clients/stealth-client/`

**Features**:
- **Anti-Detection**: AMSI bypass, EDR unhooking, ETW evasion
- **Memory Protection**: ROP/JOP chains, DEP/ASLR bypass
- **Hardware Evasion**: Intel CET, SMEP, SMAP bypass
- **Encryption**: XOR cipher, dynamic key management
- **System Info Collection**: Comprehensive system information
- **WebSocket Communication**: Real-time bidirectional communication
- **Command Execution**: Secure command handling
- **Heartbeat**: Connection keep-alive

**Core Modules**:
- `anti_detection.cpp/h`: Evasion techniques
- `command_handler.cpp/h`: Command execution
- `system_info.cpp/h`: System information collection
- `websocket_client.cpp/h`: WebSocket communication
- `json_utils.cpp/h`: JSON parsing
- `core/evasion/`: Advanced evasion modules
- `core/encryption/`: Encryption modules

### 2. C# Client

**Location**: `clients/C# Client/`

**Features**:
- **Windows Service Support**: Can run as service or console
- **Anti-Detection**: AMSI bypass, EDR unhooking
- **System Info Collection**: Windows-specific information
- **WebSocket Communication**: Native WebSocket support
- **Command Execution**: PowerShell/CMD execution
- **Configuration**: JSON-based configuration

**Key Classes**:
- `Program`: Entry point
- `WebSocketManager`: WebSocket handling
- `SystemInfoCollector`: System information
- `AntiDetection`: Evasion techniques
- `C2Service`: Windows service wrapper

### 3. Qt Client (Mentioned but not in current structure)

**Features** (from documentation):
- Qt 6.9.3 MinGW 64-bit
- System information gathering
- WebSocket communication
- Command execution
- Self-updating capabilities
- Stealth operation mode

---

## Key Features & Functionality

### 1. Client Management
- ✅ Client registration and tracking
- ✅ Real-time status monitoring (online/offline)
- ✅ System information collection
- ✅ Geolocation tracking
- ✅ Capability detection
- ✅ Machine fingerprinting (deduplication)
- ✅ Connection history

### 2. Command Execution
- ✅ Platform-specific command mapping
- ✅ Command validation and compatibility checking
- ✅ Task queue system with retry logic
- ✅ Command output streaming
- ✅ Execution time tracking
- ✅ Success/failure metrics

### 3. AI Integration
- ✅ Google Gemini AI for command processing
- ✅ Natural language to command translation
- ✅ Pattern recognition and learning
- ✅ Error handling and retry
- ✅ Conversation history per client
- ⚠️ **Gap**: AI retry functionality partially removed/commented out

### 4. Real-Time Communication
- ✅ WebSocket bidirectional communication
- ✅ Admin session broadcasting
- ✅ Client status updates
- ✅ Task updates broadcasting
- ✅ Command output streaming

### 5. Security
- ✅ JWT authentication
- ✅ Refresh token management
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS protection
- ✅ Security headers (Helmet)
- ✅ Password hashing (bcrypt)

### 6. Monitoring & Analytics
- ✅ System metrics collection
- ✅ Task success/failure tracking
- ✅ Client connection statistics
- ✅ Execution time metrics
- ✅ Audit logging

### 7. Notifications
- ✅ Telegram bot integration
- ✅ New connection notifications
- ✅ Disconnection notifications
- ✅ Command output notifications
- ✅ Screenshot notifications

### 8. User Management
- ✅ User registration and authentication
- ✅ Role management (admin, user, viewer)
- ✅ User preferences
- ✅ Profile management
- ⚠️ **Gap**: Two-factor authentication schema ready but not implemented

### 9. HVNC (Hidden VNC)
- ✅ HVNC session management
- ✅ Frame data handling
- ⚠️ **Gap**: HVNC functionality partially implemented

### 10. Task Management
- ✅ Task creation and queuing
- ✅ Task status tracking
- ✅ Task scheduling
- ✅ Retry logic
- ✅ Priority system

---

## Identified Gaps & Missing Features

### 1. **AI Functionality**
- ⚠️ AI retry functionality partially removed/commented out in `ws.handler.js`
- ⚠️ AI error handling incomplete
- ⚠️ Command pattern learning not fully integrated

### 2. **Two-Factor Authentication**
- ⚠️ Schema ready in User model but not implemented
- ⚠️ No 2FA setup/verification endpoints

### 3. **HVNC (Hidden VNC)**
- ⚠️ HVNC session management partially implemented
- ⚠️ Frame handling incomplete
- ⚠️ No frontend HVNC viewer component

### 4. **File Transfer**
- ⚠️ No file upload/download functionality
- ⚠️ No file manager component

### 5. **Screenshot**
- ⚠️ Screenshot command exists but no viewer component
- ⚠️ Screenshot storage not implemented

### 6. **Keylogger**
- ⚠️ Keylogger capability mentioned but not implemented
- ⚠️ No keylogger data collection/storage

### 7. **Process Manager**
- ⚠️ Process listing exists but no management UI
- ⚠️ Process kill/start functionality not exposed

### 8. **Registry Editor**
- ⚠️ Registry commands exist but no UI
- ⚠️ No registry browsing/editing interface

### 9. **Mobile Client Support**
- ⚠️ Android/iOS clients mentioned but not implemented
- ⚠️ Mobile-specific capabilities not supported

### 10. **Multi-Tenant Support**
- ⚠️ No multi-tenant isolation
- ⚠️ No organization/team management

### 11. **Plugin System**
- ⚠️ No plugin architecture
- ⚠️ No extensibility mechanism

### 12. **Advanced Monitoring**
- ⚠️ Limited metrics visualization
- ⚠️ No alerting system
- ⚠️ No performance dashboards

### 13. **Backup & Recovery**
- ⚠️ No database backup system
- ⚠️ No configuration backup

### 14. **Documentation**
- ⚠️ API documentation incomplete
- ⚠️ Client implementation guides missing
- ⚠️ Deployment guides need updates

---

## Identified Bugs & Issues

### 1. **WebSocket Handler Issues**
- ⚠️ **Bug**: AI retry functionality commented out but still referenced
- ⚠️ **Bug**: Some message handlers have early returns that skip authentication checks
- ⚠️ **Bug**: Task correlation ID mapping may leak memory (no cleanup on timeout)

### 2. **Rate Limiting**
- ⚠️ **Bug**: Rate limiting disabled in production (`process.env.NODE_ENV === 'production'`)
- ⚠️ **Issue**: Rate limiting bypass script exists but shouldn't be in production

### 3. **Development Mode**
- ⚠️ **Security Issue**: Hardcoded admin credentials in development mode
- ⚠️ **Issue**: Development mode fallback may be active in production

### 4. **Database Connection**
- ⚠️ **Issue**: MongoDB connection failures don't prevent server startup
- ⚠️ **Issue**: No connection retry logic

### 5. **Error Handling**
- ⚠️ **Issue**: Some WebSocket errors not properly handled
- ⚠️ **Issue**: Client disconnection cleanup may fail silently

### 6. **CORS Configuration**
- ⚠️ **Issue**: CORS allows requests with no origin (security risk)
- ⚠️ **Issue**: Localhost origins hardcoded (should use environment variables)

### 7. **Task Queue**
- ⚠️ **Bug**: Pending tasks may not be processed if client reconnects quickly
- ⚠️ **Issue**: Task queue has no maximum size limit

### 8. **Memory Leaks**
- ⚠️ **Potential**: WebSocket connection maps may grow unbounded
- ⚠️ **Potential**: Task correlation map not cleaned up on errors

### 9. **Frontend Issues**
- ⚠️ **Issue**: Some components have hardcoded mock data
- ⚠️ **Issue**: Error boundaries not implemented everywhere

### 10. **Client Issues**
- ⚠️ **Issue**: Stealth client has hardcoded WebSocket URL
- ⚠️ **Issue**: C# client configuration not externalized properly

---

## Production-Ready Mission Features

### ✅ **Core C2 Functionality**
1. **Client Registration & Management**
   - ✅ UUID-based client identification
   - ✅ Machine fingerprinting for deduplication
   - ✅ Real-time status tracking
   - ✅ System information collection
   - ✅ Geolocation tracking

2. **Command Execution**
   - ✅ Platform-specific command mapping
   - ✅ Task queue system
   - ✅ Command validation
   - ✅ Output streaming
   - ✅ Execution tracking

3. **Real-Time Communication**
   - ✅ WebSocket bidirectional communication
   - ✅ Admin broadcasting
   - ✅ Client status updates
   - ✅ Task updates

4. **Security**
   - ✅ JWT authentication
   - ✅ Refresh tokens
   - ✅ RBAC
   - ✅ Rate limiting (disabled in prod - needs fix)
   - ✅ Input validation
   - ✅ CORS protection

5. **Monitoring**
   - ✅ Health checks
   - ✅ System metrics
   - ✅ Task metrics
   - ✅ Audit logging

6. **Notifications**
   - ✅ Telegram integration
   - ✅ Connection/disconnection alerts

7. **User Management**
   - ✅ User registration/login
   - ✅ Role management
   - ✅ Profile management

### ⚠️ **Partially Ready Features**
1. **AI Integration**
   - ✅ Gemini AI integration exists
   - ⚠️ Retry logic incomplete
   - ⚠️ Error handling needs work

2. **HVNC**
   - ✅ Session management exists
   - ⚠️ Frame handling incomplete
   - ⚠️ No viewer component

3. **Task Scheduling**
   - ✅ Basic scheduling exists
   - ⚠️ Advanced scheduling not implemented

### ❌ **Not Production Ready**
1. **Two-Factor Authentication**
   - Schema ready but not implemented

2. **File Transfer**
   - Not implemented

3. **Advanced Features**
   - Keylogger, Process Manager UI, Registry Editor UI

4. **Mobile Support**
   - Not implemented

5. **Multi-Tenant**
   - Not implemented

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **WebSocket**: ws library
- **Authentication**: JWT (jsonwebtoken), Passport.js
- **Security**: Helmet, express-rate-limit, bcryptjs
- **AI**: Google Gemini AI (@google/generative-ai)
- **Other**: axios, cheerio, puppeteer, archiver

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: ApexCharts, Recharts
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast, React Toastify
- **Icons**: Lucide React, React Icons

### Clients
- **Stealth Client**: C++ (with anti-detection libraries)
- **C# Client**: .NET (Windows Service support)
- **Qt Client**: C++/Qt 6.9.3 (mentioned in docs)

### Infrastructure
- **Cloud Provider**: Google Cloud Platform
- **Deployment**: Google Cloud Run
- **CI/CD**: GitHub Actions (mentioned)
- **Containerization**: Docker
- **Web Server**: Nginx (frontend)

---

## Deployment Configuration

### Production URLs
- Frontend: https://loopjs.vidai.sbs/
- Backend: https://loopjs-backend-361659024403.us-central1.run.app
- WebSocket: wss://loopjs-backend-361659024403.us-central1.run.app/ws

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `SESSION_SECRET`: Session secret
- `GEMINI_API_KEY`: Google Gemini API key
- `NODE_ENV`: Environment (production/development)
- `PORT`: Server port (default: 8080)

### Configuration Files
- `backend/config/telegram.json`: Telegram bot configuration
- `backend/configs/integration.js`: Integration layer
- `frontend/src/config.ts`: Frontend API configuration

---

## Recommendations

### Critical Fixes Needed
1. **Enable rate limiting in production** - Currently disabled
2. **Remove hardcoded admin credentials** - Security risk
3. **Fix CORS configuration** - Should not allow no-origin requests
4. **Implement connection cleanup** - Prevent memory leaks
5. **Add database connection retry logic** - Improve reliability

### High Priority Features
1. **Complete AI retry functionality** - Currently incomplete
2. **Implement 2FA** - Schema ready, needs implementation
3. **Add file transfer** - Core C2 feature
4. **Complete HVNC viewer** - Remote desktop functionality
5. **Add screenshot viewer** - Visual feedback

### Medium Priority
1. **Process Manager UI** - Better process management
2. **Registry Editor UI** - Windows registry management
3. **Keylogger implementation** - Data collection
4. **Advanced monitoring dashboards** - Better visibility
5. **Alerting system** - Proactive notifications

### Low Priority
1. **Mobile client support** - Android/iOS
2. **Multi-tenant support** - Organization isolation
3. **Plugin system** - Extensibility
4. **Backup system** - Data protection
5. **API documentation** - Developer experience

---

## Conclusion

LoopJS is a **production-ready C2 panel system** with solid core functionality including client management, command execution, real-time communication, and security features. However, several advanced features are incomplete or missing, and there are some security and reliability issues that need to be addressed before full production deployment.

**Strengths**:
- ✅ Comprehensive client management
- ✅ Real-time WebSocket communication
- ✅ Platform-specific command handling
- ✅ Security features (JWT, RBAC, rate limiting)
- ✅ AI integration foundation
- ✅ Telegram notifications
- ✅ Production deployment ready

**Weaknesses**:
- ⚠️ Some features incomplete (AI retry, HVNC viewer)
- ⚠️ Security issues (rate limiting disabled, hardcoded credentials)
- ⚠️ Missing advanced features (file transfer, keylogger)
- ⚠️ Memory leak potential
- ⚠️ Incomplete error handling

**Overall Assessment**: **Production Ready** with **recommended fixes** before full deployment.

---

*Generated: 2025-01-27*  
*Project Version: 1.0.0*
