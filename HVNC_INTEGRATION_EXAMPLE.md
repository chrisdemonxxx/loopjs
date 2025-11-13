# HVNC Integration Example - Quick Start

This document provides a quick-start example for integrating HVNC into your existing components.

## Quick Integration Steps

### 1. Import Required Components

```typescript
import HvncModal from '../components/HvncModal';
import { FiMonitor } from 'react-icons/fi';
```

### 2. Add State Management

```typescript
const [isHvncOpen, setIsHvncOpen] = useState(false);
```

### 3. Add HVNC Button

```typescript
{client.features?.hvnc && (
  <button
    onClick={() => setIsHvncOpen(true)}
    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
  >
    <FiMonitor className="w-4 h-4 inline mr-2" />
    Remote Control
  </button>
)}
```

### 4. Add Modal Component

```typescript
<HvncModal
  agentId={client.id || client.uuid}
  platform={client.platform || client.os}
  isOpen={isHvncOpen}
  onClose={() => setIsHvncOpen(false)}
/>
```

## Complete Example: ClientDetails Component

See `frontend/src/pages/components/ClientDetails.tsx` for a complete working example.

## Button Placement Options

### Option 1: In Quick Actions Grid
```typescript
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  {client.features?.hvnc && (
    <button onClick={() => setIsHvncOpen(true)}>
      <FiMonitor /> HVNC
    </button>
  )}
  {/* Other action buttons */}
</div>
```

### Option 2: In Header Actions
```typescript
<div className="flex items-center gap-2">
  {client.features?.hvnc && (
    <button onClick={() => setIsHvncOpen(true)}>
      Remote Control
    </button>
  )}
</div>
```

### Option 3: In Table Row Actions
```typescript
<td>
  {agent.features?.hvnc && (
    <button onClick={() => handleHvncClick(agent)}>
      <FiMonitor /> HVNC
    </button>
  )}
</td>
```

## Feature Detection

Always check if the client supports HVNC before showing the button:

```typescript
{client.features?.hvnc && (
  // Show HVNC button
)}
```

## Platform Support

The HVNC modal automatically adapts based on platform:
- `windows` - Full desktop support
- `mac` / `macos` - macOS desktop support
- `linux` - Linux desktop support
- `android` - Mobile screen mirroring

## Styling

Use Tailwind classes consistent with your design system:
- Primary action: `bg-primary text-white`
- Success: `bg-success text-white`
- Danger: `bg-danger text-white`
- Custom: `bg-purple-600 hover:bg-purple-700`

## Error Handling

The HvncControl component handles errors internally, but you can add additional error handling:

```typescript
<HvncModal
  agentId={client.id}
  platform={client.platform}
  isOpen={isHvncOpen}
  onClose={() => {
    setIsHvncOpen(false);
    // Optional: Add cleanup or logging
  }}
/>
```

## Testing Checklist

- [ ] HVNC button appears for clients with `features.hvnc === true`
- [ ] Modal opens when button is clicked
- [ ] Modal closes when close button is clicked
- [ ] WebSocket connection establishes
- [ ] Screen frames are displayed
- [ ] Mouse input works
- [ ] Keyboard input works
- [ ] Clipboard sync works
- [ ] Screenshot button works
- [ ] Disconnect button works

## Common Issues

**Button not showing:**
- Check `client.features?.hvnc` is `true`
- Verify client data structure

**Modal not opening:**
- Check `isOpen` state is `true`
- Verify `agentId` is valid
- Check browser console for errors

**Connection fails:**
- Verify WebSocket URL in config
- Check JWT token is valid
- Ensure backend is running
