# HVNC UI Access Guide - How to Use HVNC from the Panel

## Overview

This guide explains how to access and use the HVNC (Hidden Virtual Network Computing) remote control feature from the LoopJS C2 panel interface.

---

## 🎯 Quick Start: Accessing HVNC

### Step 1: Navigate to Agents/Clients View

1. **Login** to the LoopJS C2 panel
2. Navigate to the **Dashboard** or **Agents** page
3. You'll see a list of connected clients/agents

### Step 2: Identify HVNC-Capable Agents

Look for agents that have the **HVNC feature enabled**. You can identify them by:

- **Feature Badge**: Agents with HVNC support will show a badge or indicator
- **Platform**: HVNC is primarily available for Windows agents
- **Status**: Agent must be **Online** (green status indicator)

### Step 3: Open Client Details

1. **Click** on an agent/client from the list
2. The **Client Details** panel will open on the right side
3. You'll see agent information including:
   - Computer Name
   - IP Address
   - Operating System
   - Status (Online/Offline)
   - Available Features

### Step 4: Click HVNC Button

1. In the **Quick Actions** section, look for the **HVNC** button
2. The button appears as:
   ```
   [🖥️ HVNC]
   ```
   - Purple/violet colored button
   - Monitor icon
   - Only visible if `client.features.hvnc === true`
3. **Click** the HVNC button

### Step 5: HVNC Modal Opens

The HVNC Remote Control modal will open in a full-screen overlay with:

- **Header**: Shows platform icon and "Remote Control" title
- **Connection Status**: Green (Connected) or Red (Disconnected) indicator
- **Platform Capabilities**: Badges showing available features
- **Feature Tabs**: Desktop, Files, Shell, Special features

---

## 📱 UI Components Breakdown

### 1. Client Details Panel

**Location**: Right side panel when an agent is selected

**Contains**:
```
┌─────────────────────────────────┐
│ Client Details                  │
├─────────────────────────────────┤
│ Computer Name: DESKTOP-ABC123   │
│ IP Address: 192.168.1.100       │
│ OS: Windows                     │
│ Status: ● Online                │
├─────────────────────────────────┤
│ Quick Actions                   │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ │HVNC │ │📷   │ │ℹ️   │ │⚡   ││
│ └─────┘ └─────┘ └─────┘ └─────┘│
└─────────────────────────────────┘
```

**HVNC Button**:
- **Color**: Purple (`bg-purple-600`)
- **Icon**: Monitor icon (FiMonitor)
- **Text**: "HVNC"
- **Disabled**: When agent is offline
- **Tooltip**: "Open HVNC Remote Control"

### 2. HVNC Modal Window

**Appearance**: Full-screen modal overlay

**Structure**:
```
┌─────────────────────────────────────────────────────┐
│ HVNC Remote Control                    [X] Close   │
├─────────────────────────────────────────────────────┤
│ 🖥️ Windows Remote Control    ● Connected          │
├─────────────────────────────────────────────────────┤
│ Platform Capabilities:                              │
│ [Desktop] [File System] [Shell] [Screen Capture]   │
├─────────────────────────────────────────────────────┤
│ [Desktop] [Files] [Shell] [Special]                │
├─────────────────────────────────────────────────────┤
│                                                     │
│         ┌─────────────────────┐                   │
│         │                       │                   │
│         │   Remote Screen      │                   │
│         │   (Canvas Display)   │                   │
│         │                       │                   │
│         └─────────────────────┘                   │
│                                                     │
│ [Mouse] [Keyboard] [Clipboard] [📷] [🎥] [⛶]      │
├─────────────────────────────────────────────────────┤
│ Quality: [Medium ▼] FPS: [15 ▼] [🔄] [Disconnect] │
└─────────────────────────────────────────────────────┘
```

### 3. Connection Flow

#### Before Connection (Disconnected State)

```
┌─────────────────────────────────┐
│         🖥️ Icon                 │
│                                 │
│  Start a remote HVNC session    │
│  to control this agent          │
│                                 │
│  Connection Mode:               │
│  [Hidden Mode ▼]                │
│                                 │
│  Quality Settings:              │
│  [Medium Quality ▼]             │
│                                 │
│      [Connect Button]           │
└─────────────────────────────────┘
```

**User Actions**:
1. Select **Connection Mode**: Hidden/Visible/Shared
2. Select **Quality**: High/Medium/Low
3. Click **Connect** button

#### During Connection

```
┌─────────────────────────────────┐
│  [⏳ Spinner] Connecting...    │
│                                 │
│  Status: Connecting...          │
└─────────────────────────────────┘
```

**What Happens**:
- Loading spinner appears
- Status shows "Connecting..."
- Backend sends `hvnc_start` command to client
- Client creates hidden desktop
- Session ID is generated

#### After Connection (Connected State)

```
┌─────────────────────────────────┐
│ 🖥️ Windows Remote Control      │
│                    ● Connected  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   Live Screen Feed      │   │
│  │   (Interactive Canvas)  │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [Mouse] [Keyboard] [Clipboard] │
│  [📷 Screenshot] [🎥 Record]    │
│  [⛶ Fullscreen]                │
├─────────────────────────────────┤
│ Quality: [Medium] FPS: [15]    │
│              [Disconnect]       │
└─────────────────────────────────┘
```

---

## 🖱️ Using HVNC Controls

### Mouse Controls

**How to Use**:
1. **Move Mouse**: Move cursor over the canvas - mouse moves on remote desktop
2. **Click**: Click left/right/middle mouse button
3. **Drag**: Click and hold, then drag to select/move items
4. **Scroll**: Use mouse wheel to scroll

**Visual Feedback**:
- Cursor changes to `crosshair` on canvas
- Mouse movements are sent in real-time
- Coordinates are automatically transformed to match remote screen size

### Keyboard Controls

**How to Use**:
1. **Click on Canvas**: Click anywhere on the canvas to focus it
2. **Type**: Type normally - keys are sent to remote desktop
3. **Special Keys**: Ctrl, Alt, Shift, Windows key work automatically
4. **Key Combinations**: Ctrl+C, Alt+Tab, etc. work as expected

**Important**:
- Canvas must be focused (clicked) for keyboard input
- Some browser shortcuts may be intercepted (e.g., F11 for fullscreen)

### Clipboard Sync

**How to Use**:
1. **Copy to Remote**: 
   - Copy text on your local machine (Ctrl+C)
   - Click **Clipboard** button
   - Text is synced to remote clipboard
2. **Copy from Remote**:
   - Copy text on remote desktop
   - Automatically synced to your local clipboard (if implemented)

**Button Location**: In the Desktop Controls toolbar

### Screenshot

**How to Use**:
1. Click the **📷 Screenshot** button
2. Request is sent to client
3. Screenshot is captured and can be downloaded

**Button Location**: Desktop Controls toolbar

### Fullscreen Mode

**How to Use**:
1. Click **⛶ Fullscreen** button
2. Modal expands to full screen
3. Click **Exit Fullscreen** to return

**Benefits**:
- Larger viewing area
- Better for detailed work
- Immersive experience

---

## 🎨 Visual Indicators

### Connection Status

| Indicator | Meaning | Color |
|-----------|---------|-------|
| ● Green | Connected | `bg-success` |
| ● Red | Disconnected | `bg-danger` |
| ⏳ Spinner | Connecting | Animated |

### Platform Icons

- **Windows**: 🪟 Windows logo (SiWindows)
- **macOS**: 🍎 Apple logo (SiApple)
- **Linux**: 🐧 Linux logo (SiLinux)
- **Android**: 🤖 Android logo (SiAndroid)

### Feature Badges

- **Desktop Access**: Green badge
- **File System**: Blue badge
- **Shell Access**: Yellow badge
- **Screen Capture**: Cyan badge
- **Remote Input**: Purple badge

---

## 📋 Step-by-Step User Journey

### Complete Workflow

```
1. User logs into C2 Panel
   ↓
2. Navigates to Dashboard/Agents page
   ↓
3. Sees list of connected agents
   ↓
4. Clicks on a Windows agent
   ↓
5. Client Details panel opens on right
   ↓
6. Sees "HVNC" button in Quick Actions
   ↓
7. Clicks HVNC button
   ↓
8. HVNC Modal opens
   ↓
9. Sees connection form (if not connected)
   ↓
10. Selects quality and mode
    ↓
11. Clicks "Connect" button
    ↓
12. Loading spinner appears
    ↓
13. Connection established
    ↓
14. Remote screen appears on canvas
    ↓
15. Can interact with mouse/keyboard
    ↓
16. Uses controls (clipboard, screenshot, etc.)
    ↓
17. Clicks "Disconnect" when done
    ↓
18. Modal closes
```

---

## 🎯 UI Element Locations

### Main Dashboard/Agents Page

```
┌─────────────────────────────────────────────────────┐
│  LoopJS C2 Panel                                    │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  Agent List      │  Client Details Panel            │
│                  │  (Opens when agent selected)     │
│  ┌────────────┐  │                                  │
│  │ Agent 1   │  │  ┌──────────────────────────┐   │
│  │ ● Online  │  │  │ Client Details            │   │
│  └────────────┘  │  │                          │   │
│                  │  │  Computer: DESKTOP-ABC   │   │
│  ┌────────────┐  │  │  IP: 192.168.1.100      │   │
│  │ Agent 2   │  │  │  OS: Windows             │   │
│  │ ● Online  │  │  │                          │   │
│  └────────────┘  │  │  Quick Actions:         │   │
│                  │  │  [HVNC] [📷] [ℹ️] [⚡]   │   │
│                  │  └──────────────────────────┘   │
└──────────────────┴──────────────────────────────────┘
```

### HVNC Modal (Full Screen Overlay)

```
┌─────────────────────────────────────────────────────┐
│  [Overlay Background - Darkened]                   │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ HVNC Remote Control              [X] Close │   │
│  ├─────────────────────────────────────────────┤   │
│  │ 🖥️ Windows Remote Control    ● Connected   │   │
│  ├─────────────────────────────────────────────┤   │
│  │ [Desktop] [Files] [Shell] [Special]          │   │
│  ├─────────────────────────────────────────────┤   │
│  │                                              │   │
│  │        ┌──────────────────────┐               │   │
│  │        │                      │               │   │
│  │        │   Remote Screen      │               │   │
│  │        │   (Interactive)      │               │   │
│  │        │                      │               │   │
│  │        └──────────────────────┘               │   │
│  │                                              │   │
│  │  [Mouse] [Keyboard] [Clipboard] [📷] [🎥]   │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Quality: [Medium] FPS: [15] [🔄] [Disconnect]│   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Finding HVNC Button

### Where to Look

1. **Agent List View**:
   - Some implementations may have HVNC button directly in the table
   - Look for action buttons column

2. **Client Details Panel** (Most Common):
   - Right side panel when agent is selected
   - In "Quick Actions" section
   - Grid of action buttons

3. **Agent Card View**:
   - If using card layout
   - HVNC button in card footer/actions

### Button Appearance

```
┌─────────────┐
│ 🖥️  HVNC    │  ← Purple button with monitor icon
└─────────────┘
```

**When Visible**:
- ✅ Agent has `features.hvnc === true`
- ✅ Agent is online
- ✅ Agent platform supports HVNC (Windows)

**When Hidden/Disabled**:
- ❌ Agent doesn't support HVNC
- ❌ Agent is offline (button disabled)
- ❌ Platform not supported

---

## 🎮 Interactive Features

### Canvas Interaction

**Mouse Events**:
- **Hover**: Cursor shows crosshair
- **Click**: Sends click to remote
- **Drag**: Sends drag events
- **Scroll**: Sends scroll events
- **Right-click**: Sends right-click (context menu prevented)

**Keyboard Events**:
- **Focus Required**: Click canvas first
- **Typing**: Sends keystrokes to remote
- **Modifiers**: Ctrl, Alt, Shift work automatically
- **Special Keys**: Function keys, arrows, etc.

### Control Buttons

**Toolbar Buttons** (from left to right):

1. **Mouse** (Info only - shows mouse is active)
2. **Keyboard** (Info only - shows keyboard is active)
3. **Clipboard** - Sync clipboard to remote
4. **📷 Screenshot** - Capture remote screen
5. **🎥 Record** - Start/stop recording (future feature)
6. **⛶ Fullscreen** - Toggle fullscreen mode

### Settings Controls

**Bottom Bar** (left side):
- **Quality Dropdown**: High/Medium/Low
- **FPS Dropdown**: 30/15/5 frames per second
- **🔄 Refresh**: Reconnect/refresh connection

**Bottom Bar** (right side):
- **Disconnect Button**: Red button to end session

---

## ⚙️ Settings & Configuration

### Quality Settings

**Options**:
- **High**: 90% JPEG quality, more bandwidth
- **Medium**: 75% JPEG quality, balanced (default)
- **Low**: 50% JPEG quality, less bandwidth

**When to Use**:
- **High**: Fast network, need clarity
- **Medium**: Normal use (recommended)
- **Low**: Slow network, prioritize speed

### FPS Settings

**Options**:
- **30 FPS**: Smooth, high bandwidth
- **15 FPS**: Balanced (default)
- **5 FPS**: Low bandwidth, slower updates

**When to Use**:
- **30 FPS**: Fast network, need smoothness
- **15 FPS**: Normal use (recommended)
- **5 FPS**: Slow network, prioritize stability

### Connection Modes

**Options**:
- **Hidden Mode**: Target user cannot see activity (default)
- **Visible Mode**: Target user can see activity
- **Shared Mode**: Collaborative (future feature)

---

## 🚨 Error States & Messages

### Connection Failed

**Appearance**:
```
┌─────────────────────────────────┐
│  ⚠️ Connection Failed            │
│                                 │
│  Error: Agent is offline        │
│  or does not support HVNC       │
└─────────────────────────────────┘
```

**Common Errors**:
- "Agent is offline and cannot start HVNC session"
- "Agent does not support HVNC"
- "Client WebSocket connection not found"
- "Failed to communicate with agent"

### WebSocket Connection Issues

**Symptoms**:
- Canvas shows "Disconnected" status
- No frames appearing
- Connection status stays red

**Solutions**:
1. Check browser console for errors
2. Verify WebSocket URL in config
3. Check JWT token is valid
4. Ensure backend is running

### Frame Display Issues

**Symptoms**:
- Canvas is black/empty
- Frames not updating
- Image loading errors

**Solutions**:
1. Check WebSocket messages in Network tab
2. Verify frameData is base64 encoded
3. Check canvas dimensions
4. Inspect browser console

---

## 📱 Responsive Design

### Desktop View (>1024px)

- Full modal with all controls visible
- Large canvas for screen display
- Side-by-side controls

### Tablet View (768px - 1024px)

- Modal adapts to screen size
- Controls may stack vertically
- Canvas scales appropriately

### Mobile View (<768px)

- Modal may be full-screen
- Touch-friendly controls
- Optimized for touch input

---

## 🎯 Best Practices for Users

### Before Starting HVNC

1. ✅ Verify agent is **Online** (green status)
2. ✅ Check agent supports HVNC (feature badge visible)
3. ✅ Ensure stable network connection
4. ✅ Close unnecessary browser tabs (for performance)

### During HVNC Session

1. ✅ **Focus the canvas** before typing (click on it)
2. ✅ Use **Medium quality** for best balance
3. ✅ Use **15 FPS** for normal use
4. ✅ **Don't spam** mouse movements (causes lag)
5. ✅ Use **Clipboard sync** for text transfer

### Performance Tips

1. **Lower Quality** if experiencing lag
2. **Lower FPS** if bandwidth is limited
3. **Close other tabs** to free up resources
4. **Use Fullscreen** for better focus
5. **Disconnect** when not actively using

### Security Considerations

1. ⚠️ HVNC sessions are **hidden** by default
2. ⚠️ All traffic is **encrypted** via WebSocket
3. ⚠️ **Disconnect** when finished
4. ⚠️ Don't leave sessions **idle** for long periods

---

## 🔄 State Transitions

### Connection States

```
Disconnected
    ↓ (Click Connect)
Connecting...
    ↓ (Backend processes)
Starting session...
    ↓ (Client responds)
Connected
    ↓ (Click Disconnect)
Disconnecting...
    ↓
Disconnected
```

### Visual State Indicators

| State | Status Text | Indicator Color | Button State |
|-------|-------------|-----------------|--------------|
| Disconnected | "Disconnected" | Red ● | Connect enabled |
| Connecting | "Connecting..." | Yellow ⏳ | Connect disabled |
| Starting | "Starting session..." | Yellow ⏳ | Connect disabled |
| Connected | "Connected" | Green ● | Disconnect enabled |
| Error | "Error: [message]" | Red ● | Connect enabled |

---

## 🎨 UI Color Scheme

### Status Colors

- **Success/Connected**: Green (`bg-success`, `text-success`)
- **Error/Disconnected**: Red (`bg-danger`, `text-danger`)
- **Warning/Loading**: Yellow (`bg-warning`, `text-warning`)
- **Info**: Cyan (`bg-info`, `text-info`)
- **Primary Action**: Blue (`bg-primary`, `text-primary`)

### Button Colors

- **HVNC Button**: Purple (`bg-purple-600`)
- **Connect Button**: Primary Blue (`bg-primary`)
- **Disconnect Button**: Danger Red (`bg-danger`)
- **Control Buttons**: Primary with opacity (`bg-primary/10`)

---

## 📖 Complete User Flow Example

### Scenario: User wants to remotely control a Windows agent

```
1. User opens LoopJS C2 Panel
   → Sees dashboard with agent list

2. User sees "DESKTOP-ABC123" agent
   → Status: ● Online (green)
   → Platform: Windows

3. User clicks on "DESKTOP-ABC123"
   → Client Details panel opens on right

4. User sees Quick Actions section
   → Sees [🖥️ HVNC] button (purple)
   → Button is enabled (agent is online)

5. User clicks [🖥️ HVNC] button
   → HVNC Modal opens (full-screen overlay)
   → Shows connection form

6. User reviews settings
   → Mode: Hidden (default)
   → Quality: Medium (default)
   → FPS: 15 (default)

7. User clicks "Connect" button
   → Loading spinner appears
   → Status: "Connecting..."
   → Notification: "Connecting to remote session..."

8. Backend processes request
   → Sends hvnc_start to client
   → Client creates hidden desktop
   → Session ID generated

9. Connection established
   → Status: "Connected" (green)
   → Remote screen appears on canvas
   → Notification: "Successfully connected"

10. User interacts with remote desktop
    → Moves mouse over canvas → mouse moves on remote
    → Clicks on canvas → click sent to remote
    → Types text → keys sent to remote
    → Uses clipboard button → clipboard synced

11. User takes screenshot
    → Clicks 📷 Screenshot button
    → Screenshot captured and available

12. User finishes work
    → Clicks "Disconnect" button
    → Status: "Disconnecting..."
    → Session ends
    → Modal closes
    → Notification: "Successfully disconnected"
```

---

## 🐛 Troubleshooting UI Issues

### Button Not Appearing

**Check**:
1. Agent has `features.hvnc === true` in data
2. Agent platform is Windows (or supported platform)
3. Component is properly imported
4. No JavaScript errors in console

**Solution**: Verify agent capabilities in backend/database

### Modal Not Opening

**Check**:
1. `isOpen` state is `true`
2. `agentId` is valid UUID
3. Component is rendered in DOM
4. No z-index conflicts

**Solution**: Check React DevTools for component state

### Canvas Not Responding

**Check**:
1. Canvas is focused (clicked)
2. `isConnected === true`
3. WebSocket is open
4. No JavaScript errors

**Solution**: Click canvas to focus, check connection status

### Frames Not Displaying

**Check**:
1. WebSocket messages are received
2. `frameData` is base64 string
3. Canvas dimensions are set
4. Image loading works

**Solution**: Check Network tab for WebSocket frames, inspect console

---

## 📸 Screenshot Locations

### Where Screenshots Appear

1. **Browser Download**: Screenshot may download automatically
2. **Notification**: Success message appears
3. **Backend Storage**: May be stored on server
4. **Telegram**: If Telegram integration enabled

---

## 🎓 Training Guide for End Users

### For First-Time Users

1. **Start Simple**: 
   - Connect to an agent
   - Just observe the screen
   - Don't interact yet

2. **Learn Mouse Control**:
   - Move mouse slowly
   - Try clicking
   - Practice dragging

3. **Learn Keyboard**:
   - Click canvas to focus
   - Type simple text
   - Try keyboard shortcuts

4. **Use Features**:
   - Try clipboard sync
   - Take a screenshot
   - Toggle fullscreen

### Common Tasks

**Task: Open Notepad**
1. Connect to agent
2. Click Start menu (or press Windows key)
3. Type "notepad"
4. Press Enter

**Task: Copy File Path**
1. Navigate to file in remote desktop
2. Right-click file
3. Copy path
4. Use clipboard sync to get it locally

**Task: Take Screenshot**
1. Navigate to desired screen
2. Click 📷 Screenshot button
3. Screenshot captured

---

## 🔗 Related Documentation

- **Full Development Guide**: `HVNC_UI_DEVELOPMENT_GUIDE.md`
- **Integration Examples**: See `ClientDetails.tsx`
- **API Reference**: Backend controller documentation
- **Component Source**: `frontend/src/components/HvncControl.tsx`

---

## 📞 Support

If you encounter issues:

1. **Check Browser Console**: Press F12, look for errors
2. **Check Network Tab**: Verify WebSocket connection
3. **Verify Agent Status**: Ensure agent is online
4. **Check Backend Logs**: Server-side errors
5. **Review Documentation**: Component props and usage

---

**Last Updated**: 2024
**Version**: 1.0.0
