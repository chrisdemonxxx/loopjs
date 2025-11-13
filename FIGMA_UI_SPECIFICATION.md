# LoopJS C2 Panel - Complete UI Specification for Figma Design

## 🎨 Design Requirements
- **Style**: Premium, Modern, Figma-style
- **Theme**: Dark mode primary, with light mode support
- **Design System**: Glassmorphism effects, gradient buttons, rounded corners, smooth animations
- **Inspiration**: Modern SaaS dashboards, premium security tools, clean minimalist design

---

## 📱 Main Layout Structure

### **1. Header Bar**
- **Position**: Top of screen, sticky
- **Left Side**:
  - Panel logo/icon (customizable emoji or icon)
  - Panel name "C2 Panel" (customizable)
  - Subtitle: "Command & Control Panel"
- **Right Side**:
  - OPERATIONAL status indicator
  - User profile dropdown with:
    - User role badge (User/Admin)
    - Profile picture or avatar
    - Dropdown menu: Profile Settings, Logout

### **2. Navigation Tabs** (Primary Navigation)
- **Layout**: Horizontal tab bar below header
- **Tabs** (8 total):
  1. **Overview** 📊 - Dashboard overview with stats
  2. **Clients** 👥 - Connected clients/agents table
  3. **Agent** 🤖 - Agent builder and management
  4. **AI Terminal** 💻 - Command terminal interface
  5. **AI Insights** 🧠 - AI analytics and decision-making
  6. **Logs** 📝 - System logs and audit trail
  7. **Tasks** 📋 - Task management and scheduling
  8. **Settings** ⚙️ - Application settings
- **Design**: Rounded tabs, gradient highlight on active tab, icons + labels

### **3. Main Content Area**
- Full-width content area below navigation
- Responsive padding and spacing
- Card-based layout for sections

### **4. Footer** (Optional)
- Status bar: Connection status, last updated time, version number

---

## 📄 Page Sections & Features

### **SECTION 1: OVERVIEW (Dashboard)**

#### **Dashboard Stats Cards** (Grid Layout)
1. **Total Clients**
   - Icon: Users icon
   - Value: Dynamic number
   - Color: Indigo/Purple gradient

2. **Online Clients**
   - Icon: Active users icon
   - Value: Dynamic number
   - Color: Green gradient

3. **Offline Clients**
   - Icon: Inactive users icon
   - Value: Dynamic number
   - Color: Gray gradient

4. **Pending Tasks**
   - Icon: Clock icon
   - Value: Dynamic number
   - Subtitle: "In queue"
   - Color: Orange gradient

5. **Success Rate**
   - Icon: Checkmark icon
   - Value: Percentage (e.g., "95.5%")
   - Subtitle: "Command execution"
   - Color: Green gradient

6. **Average Execution Time**
   - Icon: Timer icon
   - Value: Time in ms (e.g., "1.2s")
   - Color: Blue gradient

#### **Real-time Activity Feed**
- Live activity stream
- Connection/disconnection events
- Command execution results
- System alerts

#### **Quick Actions Panel**
- Buttons for common actions:
  - View All Clients
  - Create New Task
  - View Recent Logs

---

### **SECTION 2: CLIENTS**

#### **Filter & Search Bar**
- **Search Input**: "Search by name, IP, or OS..."
- **Status Filter Dropdown**: All Status / Online / Offline
- **OS Filter Dropdown**: All OS / Windows / Linux / macOS
- **Actions**:
  - "Export CSV" button (with download icon)
  - "Show Offline (X)" toggle button

#### **Clients Table**
- **Columns**:
  1. **Computer Name** (sortable, clickable)
  2. **IP Address** (sortable)
  3. **Platform** (badge: Windows/Linux/macOS)
  4. **Status** (badge: Online/Offline with colored dot)
  5. **Last Seen** (relative time: "2 minutes ago")
  6. **Actions** (dropdown menu):
     - View Details
     - Execute Command
     - View Tasks
     - Remote Control
     - Screenshot
     - Keylogger Toggle
     - Disconnect

- **Table Features**:
  - Sortable columns (click header to sort)
  - Pagination or infinite scroll
  - Row hover effects
  - Empty state: "No online clients found. Start the client to see it appear here."

#### **Client Details Modal** (when clicking client)
- Client information card
- System information
- Capabilities list
- Action buttons

---

### **SECTION 3: AGENT**

#### **Agent Management Header**
- Title: "Agent Management"
- Subtitle: "Generate polymorphic MSI agents with advanced evasion techniques"
- Robot icon

#### **Sub-navigation Tabs**
1. **Generate** 🚀 - Agent generation form
2. **Configuration** ⚙️ - Agent settings
3. **Builds** 📦 - Build history
4. **Templates** 📄 - Saved templates

#### **Tab: Generate**
- **Advanced Agent Builder** (coming soon notice)
  - "Coming Soon" badge
  - Description text: "We're working on an advanced polymorphic agent builder with MSI packaging, evasion techniques, and stealth capabilities. Stay tuned!"

- **Generate New Agent Form**:
  - **Agent Name** input (with refresh icon button)
  - **Service Name** input (with refresh icon button)
  - **Description** textarea (multi-line)
  - **Generate Agent** button (gradient, large, with lightning icon)

#### **Tab: Configuration**
- **Basic Configuration**:
  - Agent name
  - Service name
  - Description

- **Evasion Settings** (checkboxes):
  - Polymorphic naming
  - UAC bypass
  - Defender exclusion
  - Process hollowing
  - Memory evasion

- **Stealth Settings** (checkboxes):
  - Anti-debug
  - Anti-VM
  - Anti-sandbox
  - Code obfuscation
  - String encryption

- **Persistence Settings** (checkboxes):
  - Service installation
  - Registry persistence
  - Scheduled task
  - Startup folder

- **Communication Settings**:
  - Server URL input
  - Server port input
  - Heartbeat interval input
  - Reconnect attempts input

- **Advanced Features** (checkboxes):
  - Keylogger
  - Screen capture
  - File manager
  - Process manager
  - Network monitor
  - System info

#### **Tab: Builds**
- Build history table:
  - Build name
  - Version
  - Status badge (Generating/Ready/Error)
  - Created date
  - Actions: Download, View Details, Delete

#### **Tab: Templates**
- Template cards grid:
  - Template name
  - Description
  - Last used date
  - Actions: Use, Edit, Delete

---

### **SECTION 4: AI TERMINAL**

#### **Terminal Header**
- Title: "AI Terminal"
- **Connection Status Indicator**:
  - Status: "AI Connected" / "AI Disconnected"
  - Colored dot (green/red)
  - Lightning bolt icon

#### **Mode Selection Buttons**
- **Chat Mode** 💬 - Natural language commands
- **Commands Mode** ⌨️ - Direct command execution
- Active mode highlighted with gradient

#### **Action Buttons**
- **Clear Logs** button (trash icon)

#### **Target Client Selector**
- Dropdown: "Target Client:"
- Options: List of online clients
- Default: "No online clients" (when none available)

#### **Terminal Output Area**
- Dark terminal background
- Command prompt: `>_`
- Command history display:
  - User input commands
  - AI-processed commands
  - Command output
  - Success/error indicators
  - Timestamps

#### **Terminal Input Bar**
- Command input field (full width)
- "Send" button or Enter key to execute
- Auto-suggestions dropdown (optional)

#### **Command History Panel** (optional sidebar)
- Recent commands list
- Quick re-execute buttons
- Command status indicators

---

### **SECTION 5: AI INSIGHTS**

#### **AI Insights Header**
- Title: "AI Insights Panel"
- Subtitle: "Real-time AI decision-making and learning analytics"

#### **Sub-navigation Tabs**
1. **Overview** 📊 - AI overview dashboard
2. **Strategies** 🎯 - AI strategy execution
3. **Learning** 📚 - AI learning analytics
4. **Research** 🔍 - AI research results

#### **Tab: Overview**
- **AI Stats Cards**:
  - Total commands processed
  - Success rate
  - Average strategies per command
  - Learning improvements

- **Recent Commands List**:
  - Command preview
  - Status indicators
  - Strategy count
  - Execution time

- **Top Successful Patterns**:
  - Pattern name
  - Success rate
  - Usage count

#### **Tab: Strategies**
- **Active Strategies List**:
  - Strategy name
  - Priority badge
  - Status (Pending/Running/Success/Failed)
  - Success rate percentage
  - Estimated time
  - Tools used
  - Error messages (if failed)

#### **Tab: Learning**
- **Learning Statistics**:
  - Total commands processed
  - Success rate over time (chart)
  - Average strategies per command
  - Top successful patterns list

- **Recent Improvements**:
  - Date
  - Improvement description
  - Impact percentage

#### **Tab: Research**
- **Research Results**:
  - "Research results will appear when the AI needs to find solutions"
  - When active:
    - Source name
    - Solution description
    - Confidence level (percentage)
    - Source link/icon

---

### **SECTION 6: LOGS**

#### **Logs Header**
- Title: "System Logs"
- **Filter Controls**:
  - Log level filter: All / Info / Warning / Error / Debug
  - Date range picker
  - Search input
  - Refresh button

#### **Logs Table/List**
- **Columns**:
  - Timestamp
  - Level badge (Info/Warning/Error/Debug)
  - Component/Module
  - Message
  - Details (expandable)

- **Log Entry Design**:
  - Color-coded by level
  - Expandable details
  - Copy button per entry
  - Highlight on hover

#### **Log Actions**
- **Clear All Logs** button
- **Export Logs** button
- **Auto-refresh** toggle

---

### **SECTION 7: TASKS**

#### **Tasks Header**
- Title: "Task Management"
- **Actions**:
  - "Create Task" button (plus icon)
  - Filter dropdowns
  - Search input

#### **Task Filters**
- Status filter: All / Pending / Running / Completed / Failed / Paused
- Priority filter: All / Low / Medium / High / Critical
- Assignee filter
- Date range filter

#### **Tasks Table**
- **Columns**:
  1. **Task Name** (clickable for details)
  2. **Description**
  3. **Status** badge (with icon)
  4. **Priority** badge (color-coded)
  5. **Assigned To** (client name)
  6. **Progress** (progress bar + percentage)
  7. **Created** (date/time)
  8. **Updated** (date/time)
  9. **Actions** (dropdown):
     - View Details
     - Edit
     - Pause/Resume
     - Cancel
     - Delete

#### **Task Details Modal**
- Full task information
- Execution logs
- Progress timeline
- Retry/cancel actions

#### **Create Task Modal**
- Task name input
- Description textarea
- Priority selector
- Target client selector
- Command/script input
- Schedule options

---

### **SECTION 8: SETTINGS**

#### **Settings Header**
- Title: "Settings"
- Subtitle: "Configure your C2 Panel"

#### **Sub-navigation Tabs**
1. **Appearance** 🎨 - Theme and UI settings
2. **General** ⚙️ - General settings
3. **Security** 🔒 - Security settings
4. **Users** 👥 - User management
5. **Database** 💾 - Database settings
6. **Telegram** 📱 - Telegram integration

#### **Tab: Appearance**
- **Theme Selection**:
  - Theme cards (grid layout):
    1. **Light Premium** ☀️
       - Description: "Clean & minimal design"
       - Category: Professional

    2. **Dark Premium** 🌙
       - Description: "Easy on the eyes"
       - Category: Professional

    3. **Hacker Elite** 💚
       - Description: "Matrix rain effects"
       - Category: Hacker

    4. **Premium Cyber** 🚀
       - Description: "Futuristic cyberpunk"
       - Category: Cyberpunk

- **Panel Customization**:
  - Panel name input
  - Panel icon selector/input (emoji or icon)

- **Save** button

#### **Tab: General**
- **Panel Settings**:
  - Panel name input
  - Panel icon input
  - Auto-refresh toggle
  - Refresh interval input (seconds)
  - Notifications toggle

- **Save** button

#### **Tab: Security**
- **Session Settings**:
  - Session timeout input (minutes, default: 60)
  - Max login attempts input (default: 5)

- **Two-Factor Authentication**:
  - "Require 2FA for all users" checkbox

- **Password Policy**:
  - Minimum length input (default: 8)
  - "Require special characters" checkbox
  - "Require numbers" checkbox
  - "Require uppercase letters" checkbox

- **Status Indicator**: "Saving..." when active
- **Save** button

#### **Tab: Users**
- **Users Table**:
  - Columns: Username, Email, Role, Status, Created, Last Login, Actions

- **User Actions**:
  - "Create User" button
  - Edit user (per row)
  - Delete user (per row)
  - Change role (per row)

- **Create User Modal**:
  - Username input
  - Email input
  - Password input (with show/hide toggle)
  - Role selector (Admin/User/Viewer)
  - "Create" button

#### **Tab: Database**
- **Database Settings**:
  - Auto-clear logs toggle
  - Log retention days input (default: 30)
  - Offline logs toggle

- **Database Actions**:
  - "Clear All Logs" button
  - "Backup Database" button
  - "Restore Database" button

#### **Tab: Telegram**
- **Telegram Integration**:
  - Enable Telegram toggle
  - Bot token input (with show/hide toggle)
  - Chat ID input
  - "Test Connection" button
  - Test result message (success/error)

- **Notification Settings** (when enabled):
  - New connection toggle
  - Disconnection toggle
  - Task completion toggle
  - System alerts toggle

- **Save** button

---

## 🎨 Design System Components

### **Buttons**
1. **Primary Button** (Gradient):
   - Background: Indigo to Purple gradient
   - Hover: Darker gradient
   - Shadow: Indigo glow
   - Text: White
   - Rounded corners: 12px

2. **Secondary Button**:
   - Background: Transparent with border
   - Hover: Light background
   - Text: Primary color

3. **Danger Button**:
   - Background: Red gradient
   - Hover: Darker red
   - Text: White

4. **Icon Button**:
   - Circular/square
   - Icon only
   - Hover: Background highlight

### **Input Fields**
- Rounded corners: 12px
- Border: Subtle gray
- Focus: Indigo border + glow
- Background: Glassmorphism effect
- Placeholder: Gray text

### **Cards**
- Background: Glassmorphism (semi-transparent with blur)
- Border: Subtle border
- Shadow: Soft shadow
- Rounded corners: 16px
- Hover: Slight elevation

### **Badges/Tags**
- Status badges:
  - Online: Green
  - Offline: Gray
  - Pending: Orange
  - Running: Blue
  - Completed: Green
  - Failed: Red
- Rounded: 8px
- Text: Small, bold

### **Tables**
- Header: Dark background
- Rows: Alternating subtle background
- Hover: Highlight row
- Border: Subtle dividers
- Scroll: Smooth scrolling

### **Modals/Dialogs**
- Background: Dark overlay (backdrop blur)
- Content: Glassmorphism card
- Header: Title + close button
- Footer: Action buttons
- Rounded corners: 16px
- Animation: Fade in + slide up

### **Dropdown Menus**
- Background: Glassmorphism
- Border: Subtle
- Hover: Highlight item
- Rounded corners: 8px
- Shadow: Soft shadow

### **Tabs**
- Active: Gradient background
- Inactive: Transparent
- Hover: Light background
- Border: Subtle bottom border on active
- Icons: Left of label

### **Status Indicators**
- Connected: Green dot + pulse animation
- Disconnected: Red dot
- Loading: Spinning indicator
- Success: Green checkmark
- Error: Red X icon

---

## 🎨 Color Palette

### **Primary Colors**
- Indigo: `#6366f1`
- Purple: `#8b5cf6`
- Blue: `#3b82f6`

### **Status Colors**
- Success/Online: `#10b981` (Green)
- Error/Offline: `#ef4444` (Red)
- Warning/Pending: `#f59e0b` (Orange)
- Info: `#3b82f6` (Blue)

### **Neutral Colors**
- Dark Background: `#0f172a` (Slate 900)
- Card Background: `#1e293b` (Slate 800)
- Border: `#334155` (Slate 700)
- Text Primary: `#f1f5f9` (Slate 100)
- Text Secondary: `#94a3b8` (Slate 400)

### **Gradients**
- Primary: `linear-gradient(135deg, #6366f1, #8b5cf6)`
- Success: `linear-gradient(135deg, #10b981, #059669)`
- Error: `linear-gradient(135deg, #ef4444, #dc2626)`

---

## ✨ Animation & Transitions

### **Page Transitions**
- Fade in: 200ms
- Slide in: 300ms

### **Button Interactions**
- Hover: Scale 1.05, shadow increase
- Active: Scale 0.95
- Transition: 200ms

### **Modal Animations**
- Enter: Fade in + slide up (300ms)
- Exit: Fade out + slide down (200ms)

### **Status Indicators**
- Pulse animation for active connections
- Loading spinner for async operations

---

## 📱 Responsive Design

### **Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### **Mobile Adaptations**
- Collapsible sidebar
- Stack navigation tabs vertically
- Full-width tables with horizontal scroll
- Bottom navigation for mobile

---

## 🔤 Typography

### **Font Family**
- Primary: System font stack (Inter, -apple-system, sans-serif)
- Monospace: For terminal/code (JetBrains Mono, Consolas, monospace)

### **Font Sizes**
- H1 (Page titles): 32px, bold
- H2 (Section titles): 24px, bold
- H3 (Card titles): 20px, semibold
- Body: 16px, regular
- Small: 14px, regular
- Caption: 12px, regular

### **Font Weights**
- Bold: 700
- Semibold: 600
- Regular: 400

---

## 🎯 Interactive States

### **Hover States**
- Buttons: Scale + shadow
- Cards: Elevation increase
- Table rows: Background highlight
- Links: Underline

### **Active States**
- Buttons: Pressed effect
- Tabs: Gradient highlight
- Inputs: Border glow

### **Disabled States**
- Reduced opacity (50%)
- No pointer cursor
- No interactions

### **Loading States**
- Skeleton screens for content
- Spinner for buttons
- Progress bars for operations

### **Empty States**
- Icon illustration
- Descriptive text
- Action button (if applicable)

---

## 📋 Additional UI Elements

### **Tooltips**
- Appear on hover
- Dark background
- White text
- Small arrow pointing to element

### **Toast Notifications**
- Position: Top-right
- Types: Success, Error, Warning, Info
- Auto-dismiss: 3-5 seconds
- Dismiss button

### **Progress Bars**
- Animated fill
- Percentage display
- Color-coded by status

### **Charts/Graphs** (if needed)
- Line charts for statistics
- Bar charts for comparisons
- Pie charts for distributions
- Dark theme compatible

---

## ✅ Final Checklist for Designer

- [ ] All 8 main navigation tabs designed
- [ ] Overview dashboard with stats cards
- [ ] Clients table with filters
- [ ] Agent builder with 4 sub-tabs
- [ ] AI Terminal with mode selection
- [ ] AI Insights with 4 sub-tabs
- [ ] Logs viewer with filters
- [ ] Tasks management table
- [ ] Settings with 6 sub-tabs
- [ ] Login page (Premium design)
- [ ] Modal/dialog designs
- [ ] Empty states for all sections
- [ ] Loading states
- [ ] Error states
- [ ] Mobile responsive layouts
- [ ] Dark theme color palette
- [ ] Light theme color palette (optional)
- [ ] Glassmorphism effects
- [ ] Gradient buttons
- [ ] Smooth animations
- [ ] Icon set (Lucide React compatible)

---

## 📦 Deliverables Expected

1. **Figma File** with:
   - All page layouts
   - Component library
   - Style guide
   - Color palette
   - Typography system
   - Icon set

2. **Design Specifications**:
   - Spacing system (4px grid)
   - Border radius values
   - Shadow elevations
   - Animation timings

3. **Assets** (if applicable):
   - Custom illustrations
   - Icons (SVG format)
   - Logos

---

**Note**: This UI specification covers all features and sections currently implemented in the LoopJS C2 Panel. The designer should create a premium, modern interface that matches the description above while maintaining usability and accessibility standards.

