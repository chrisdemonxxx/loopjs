# Figma MCP Server Troubleshooting Guide

## ❌ Issue: localhost:3845 Not Working

### Current Status
- ✅ Figma Desktop: **Running**
- ❌ Port 3845: **NOT accessible** (Connection refused)
- ❌ MCP Server: **NOT enabled**

---

## 🔍 Root Cause

The MCP server is **not enabled** in Figma Desktop. The server only starts when:
1. A design file is open
2. Dev Mode is enabled
3. MCP Server is toggled ON in the sidebar

---

## ✅ Step-by-Step Fix

### **Step 1: Open a Design File in Figma**
1. Launch Figma Desktop (if not already running):
   ```bash
   figma-linux
   ```
2. **Open an existing design file** or **create a new file**
   - File must be open for Dev Mode to be available
   - Can't enable MCP Server without an open file

### **Step 2: Enable Dev Mode**
1. Look at the **top toolbar** in Figma
2. Find the **"Dev Mode"** toggle button (usually in the top right)
3. Click the toggle to **enable Dev Mode**
4. The right sidebar should change to show development tools

### **Step 3: Enable MCP Server**
1. In the **right sidebar** (Dev Mode panel), look for:
   - "MCP Server" option
   - Or "MCP" toggle
   - Or look for "Model Context Protocol" settings
2. **Toggle MCP Server ON**
3. A confirmation message should appear
4. The server URL should be displayed (usually: `http://127.0.0.1:3845/mcp`)

### **Step 4: Verify Server is Running**
After enabling, test the connection:
```bash
curl http://127.0.0.1:3845/mcp
```

If it works, you should get a response (not "Connection refused").

---

## 🔧 Important Notes

### **figma-linux Limitations**
The `figma-linux` app is an **unofficial community-built Electron wrapper**. It may:
- Not fully support all Figma features
- Have different UI/options than official Figma Desktop
- Require additional configuration for MCP server

### **Alternative: Use Figma Web**
If the Linux app doesn't support MCP server:
1. Use Figma in your browser: https://www.figma.com/
2. Note: Browser version **does not support MCP server**
3. Only the **official Figma Desktop app** (Windows/Mac) fully supports MCP

### **Check MCP Server URL**
When you enable MCP Server in Figma, it will show the server URL. Common URLs:
- `http://127.0.0.1:3845/mcp` (default)
- `http://localhost:3845/mcp`
- `ws://127.0.0.1:3845/mcp` (WebSocket)

**If the URL is different**, update `~/.cursor/mcp.json`:
```json
{
  "figma": {
    "url": "YOUR_ACTUAL_URL_HERE",
    "description": "Figma Desktop MCP server"
  }
}
```

---

## 🧪 Testing Steps

### **1. Check if Figma is Running**
```bash
ps aux | grep -i figma | grep -v grep
```
Should show Figma processes.

### **2. Check if Port 3845 is Listening**
```bash
lsof -i :3845
# or
netstat -an | grep 3845
```
Should show a listening process if MCP server is enabled.

### **3. Test Connection**
```bash
curl -v http://127.0.0.1:3845/mcp
```
Should return a response (not "Connection refused").

### **4. Test with Alternative Ports**
```bash
curl http://127.0.0.1:3846/mcp
curl http://localhost:3845/mcp
```

---

## 📋 Quick Checklist

- [ ] Figma Desktop is running
- [ ] A design file is open in Figma
- [ ] Dev Mode is enabled (toggle in toolbar)
- [ ] MCP Server is enabled (toggle in sidebar)
- [ ] Server URL is displayed in Figma
- [ ] Port 3845 is listening (check with `lsof -i :3845`)
- [ ] Connection test succeeds (`curl http://127.0.0.1:3845/mcp`)
- [ ] MCP configuration in `~/.cursor/mcp.json` matches Figma's URL
- [ ] Cursor has been restarted after enabling MCP server

---

## 🚨 Common Issues

### **Issue 1: "MCP Server" Option Not Visible**
**Cause**: Dev Mode might not be properly enabled, or figma-linux doesn't support it.

**Fix**:
- Make sure you're in a design file (not the home screen)
- Try toggling Dev Mode off and on again
- Check if figma-linux version supports MCP (may need update)

### **Issue 2: Port 3845 Still Not Accessible After Enabling**
**Cause**: Different port or URL, or firewall issue.

**Fix**:
- Check what URL Figma shows when you enable MCP Server
- Update `~/.cursor/mcp.json` with the correct URL
- Test with: `curl http://YOUR_URL_FROM_FIGMA`

### **Issue 3: figma-linux Doesn't Support MCP**
**Cause**: The unofficial Linux app may not have full MCP support.

**Fix**:
- Try using Figma in browser (note: no MCP support in browser)
- Consider using official Figma Desktop via Wine/Proton (if available)
- Use Figma API directly with your token instead

---

## 🔄 After Fixing

Once MCP server is working:

1. **Restart Cursor** to connect to the MCP server
2. **Verify connection** in Cursor's MCP resources
3. **Test MCP features** by trying to access Figma designs from Cursor

---

## 📞 Still Not Working?

If MCP server still doesn't work after following these steps:

1. **Check Figma version**: Make sure you have the latest version
2. **Check figma-linux support**: The Linux version might not support MCP
3. **Use Figma API instead**: You have a valid API token, can use that for design access
4. **Alternative approach**: Share UI specification file directly with designer instead of using MCP

---

## 📄 Related Files

- `FIGMA_MCP_SETUP.md` - Initial setup guide
- `FIGMA_UI_SPECIFICATION.md` - UI specification for designer
- `~/.cursor/mcp.json` - MCP configuration file

