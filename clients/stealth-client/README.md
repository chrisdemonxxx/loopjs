# LoopJS Stealth Client

Advanced client implementation with stealth capabilities and evasion techniques.

## ⚠️ Legal Disclaimer

**FOR EDUCATIONAL AND RESEARCH PURPOSES ONLY**

This software is provided for educational, research, and authorized penetration testing purposes only. Users are responsible for ensuring compliance with all applicable laws and regulations.

## Architecture

The stealth client is composed of several modules:

- **Core**: Base functionality and injection techniques
- **Evasion**: Techniques to avoid detection
- **Headers**: Common header files

## Components

1. **Injection Module**
   - Process hollowing
   - DLL injection
   - Manual DLL mapping
   - Thread execution hijacking

2. **Network Module**
   - Encrypted communications
   - Traffic obfuscation
   - DNS tunneling

3. **Persistence Module**
   - Registry manipulation
   - Scheduled tasks
   - WMI event subscriptions

4. **RAT Features Module**
   - Keylogging
   - Screen capture
   - File operations

## Build Instructions

### Prerequisites

- Visual Studio 2019/2022
- CMake 3.16+
- Windows SDK

### Building

See the main [deployment guide](../../docs/DEPLOYMENT_SETUP.md) for details.

## Security Features

- String obfuscation
- Anti-VM/Sandbox detection
- Process injection
- Memory protection

## Integration with Backend

The stealth client communicates with the LoopJS backend using encrypted WebSocket connections for command and control operations.

## Development Guidelines

1. All sensitive strings should be obfuscated
2. Minimize import table entries
3. Test against common security solutions
4. Follow secure coding practices