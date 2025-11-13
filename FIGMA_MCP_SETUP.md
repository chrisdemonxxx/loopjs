# Figma MCP Server Setup Guide

## ✅ MCP Configuration Added

The Figma MCP server has been added to your Cursor MCP configuration at:
`~/.cursor/mcp.json`

**Configuration:**
```json
{
  "figma": {
    "url": "http://127.0.0.1:3845/mcp",
    "description": "Figma Desktop MCP server - enables design-to-code integration"
  }
}
```

---

## 📋 Setup Steps

### **Step 1: Install Figma Desktop** (if not already installed)

#### **Option A: Download from Figma Website**
1. Go to: https://www.figma.com/downloads/
2. Download Figma Desktop for Linux
3. Install the .deb package or AppImage

#### **Option B: Install via Snap** (Ubuntu/Debian)
```bash
sudo snap install figma-linux
```

#### **Option C: Install via AppImage**
```bash
# Download AppImage
wget https://www.figma.com/downloads/linux/desktop -O figma.AppImage

# Make executable
chmod +x figma.AppImage

# Run
./figma.AppImage
```

---

### **Step 2: Enable MCP Server in Figma**

1. **Open Figma Desktop**
   - Launch the Figma Desktop application
   - Sign in with your Figma account

2. **Open or Create a Design File**
   - Open an existing Figma file or create a new one
   - This will be where you work with designs

3. **Switch to Dev Mode**
   - Look for the "Dev Mode" toggle in the toolbar (top of screen)
   - Click to enable Dev Mode
   - The right sidebar should change to show development options

4. **Enable MCP Server**
   - In the right sidebar (Dev Mode panel)
   - Look for "MCP Server" or "MCP" option
   - Toggle it ON
   - A confirmation message should appear

5. **Get the Server URL**
   - The MCP server URL will be displayed (usually: `http://127.0.0.1:3845/mcp`)
   - Copy this URL (you may need it if it differs from the default)

---

### **Step 3: Update MCP Configuration** (if needed)

If your Figma MCP server uses a different URL or port:

1. **Edit the MCP config:**
   ```bash
   nano ~/.cursor/mcp.json
   ```

2. **Update the Figma server URL:**
   ```json
   {
     "figma": {
       "url": "http://127.0.0.1:YOUR_PORT/mcp",
       "description": "Figma Desktop MCP server"
     }
   }
   ```

3. **Save and close**

---

### **Step 4: Restart Cursor**

1. **Close Cursor completely**
2. **Reopen Cursor**
3. The MCP server should connect automatically when Cursor starts

---

### **Step 5: Verify Connection**

1. **Check MCP Servers:**
   - Open Cursor
   - The Figma MCP server should be listed in available MCP resources
   - You can verify by checking MCP resources in Cursor

2. **Test Connection:**
   - Try using MCP commands related to Figma
   - You should be able to share files and interact with Figma designs

---

## 🎨 Using Figma MCP

### **Share UI Specification File**

The UI specification file has been created:
- **File**: `FIGMA_UI_SPECIFICATION.md`
- **Location**: Project root directory
- **Purpose**: Complete UI specification for Figma designer

### **What You Can Do with Figma MCP**

1. **Design-to-Code Integration:**
   - Select a layer in Figma
   - Ask AI assistant to generate code based on selection
   - Get design tokens directly from Figma

2. **File Sharing:**
   - Share design files from Figma
   - Access Figma designs from Cursor
   - Sync design changes

3. **Design Tokens:**
   - Extract colors, typography, spacing from Figma
   - Use design tokens in code
   - Keep design and code in sync

4. **Component Information:**
   - Get component properties from Figma
   - Generate code for Figma components
   - Maintain design system consistency

---

## 🔧 Troubleshooting

### **MCP Server Not Connecting**

1. **Check Figma Desktop is Running:**
   ```bash
   ps aux | grep -i figma
   ```

2. **Verify MCP Server is Enabled:**
   - Open Figma Desktop
   - Check Dev Mode is ON
   - Verify MCP Server toggle is ON

3. **Check Port is Available:**
   ```bash
   netstat -an | grep 3845
   # or
   lsof -i :3845
   ```

4. **Test MCP Server URL:**
   ```bash
   curl http://127.0.0.1:3845/mcp
   ```

### **MCP Server URL Different**

If Figma shows a different URL:
1. Update `~/.cursor/mcp.json` with the correct URL
2. Restart Cursor
3. Verify connection

### **Figma Desktop Not Found**

1. **Install Figma Desktop:**
   - Follow Step 1 installation instructions above

2. **Check Installation:**
   ```bash
   which figma-linux
   # or
   snap list | grep figma
   ```

---

## 📚 Additional Resources

- **Figma MCP Documentation**: https://help.figma.com/hc/en-us/articles/35281186390679-Figma-MCP-collection-How-to-setup-the-Figma-desktop-MCP-server
- **Figma Desktop Download**: https://www.figma.com/downloads/
- **MCP Documentation**: https://modelcontextprotocol.io/

---

## ✅ Checklist

- [ ] Figma Desktop installed
- [ ] Figma Desktop running
- [ ] Dev Mode enabled in Figma
- [ ] MCP Server enabled in Figma
- [ ] MCP configuration added to `~/.cursor/mcp.json`
- [ ] Cursor restarted
- [ ] MCP connection verified
- [ ] UI specification file created (`FIGMA_UI_SPECIFICATION.md`)

---

## 🚀 Next Steps

1. **Share UI Specification with Designer:**
   - Send `FIGMA_UI_SPECIFICATION.md` to your Figma designer
   - Or use MCP to sync directly if both connected

2. **Design Work:**
   - Designer creates UI in Figma following the specification
   - Use MCP to access designs from Cursor

3. **Implementation:**
   - Use Figma designs to implement UI in React
   - Extract design tokens via MCP
   - Maintain design-code consistency

---

**Note**: The Figma MCP server must be running in Figma Desktop with Dev Mode enabled for the connection to work. Make sure to keep Figma Desktop open while using MCP features in Cursor.

