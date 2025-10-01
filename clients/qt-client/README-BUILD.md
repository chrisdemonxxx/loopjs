# SysManagePro - Production Build Guide

## Prerequisites

- Windows 10/11
- Qt 6.9.3 installed at `C:\Qt\6.9.3\mingw_64\`
- CMake 3.16 or later
- MinGW compiler (included with Qt)

## Building Standalone Executable

### Option 1: Quick Build (Recommended)
```batch
build-standalone.bat
```

### Option 2: Production Build
```batch
build-production.bat
```

### Option 3: Manual Build
```batch
# Set Qt environment
set QT_DIR=C:\Qt\6.9.3\mingw_64
set PATH=%QT_DIR%\bin;%PATH%
set CMAKE_PREFIX_PATH=%QT_DIR%

# Create build directory
mkdir build
cd build

# Configure
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="%QT_DIR%"

# Build
cmake --build . --config Release
```

## Build Features

- **Static Linking**: All Qt libraries and dependencies are statically linked
- **Single Executable**: No external DLLs required
- **Optimized**: Release build with -O3 optimization
- **Version Info**: Embedded version information
- **Windows Subsystem**: Configured for Windows GUI application

## Output

The build process creates:
- `dist/SysManagePro.exe` - Standalone executable ready for deployment

## Deployment

The resulting executable is completely self-contained and can be deployed to any Windows system without requiring:
- Qt runtime libraries
- Visual C++ redistributables
- Any external dependencies

## Configuration

The client is configured to connect to:
- **Production Backend**: `wss://loopjs-backend-kn2yg4ji5a-uc.a.run.app/ws`
- **Configuration File**: `config.json` (optional, can be embedded)

## Testing

After building, test the executable:
1. Run `dist/SysManagePro.exe`
2. Check that it connects to the backend
3. Verify WebSocket communication
4. Test command execution

## Troubleshooting

### Build Fails
- Ensure Qt 6.9.3 is installed at the correct path
- Check that MinGW compiler is available
- Verify CMake version (3.16+)

### Executable Won't Run
- Check Windows Defender/antivirus settings
- Ensure all dependencies are statically linked
- Test on a clean Windows system

### Connection Issues
- Verify backend URL in `config.json`
- Check firewall settings
- Test network connectivity

## File Structure

```
qt-client/
├── build-standalone.bat    # Standalone build script
├── build-production.bat    # Production build script
├── CMakeLists.txt          # CMake configuration
├── version.rc              # Version information
├── config.json             # Client configuration
├── mainwindow.cpp          # Main application code
├── mainwindow.h            # Header file
└── dist/                   # Output directory
    └── SysManagePro.exe    # Final executable
```