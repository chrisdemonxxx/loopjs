# SysManagePro Build Instructions

## Windows Build (Recommended)

Since Qt is installed at `C:\Qt\6.9.3\mingw_64\bin`, you need to build on Windows.

### Prerequisites
- Windows 10/11
- Qt 6.9.3 installed at `C:\Qt\6.9.3\mingw_64\`
- CMake 3.16 or later
- MinGW compiler (included with Qt)

### Build Steps

1. **Open Command Prompt as Administrator**
2. **Navigate to the qt-client directory**
   ```cmd
   cd C:\path\to\loopjs\clients\qt-client
   ```

3. **Run the build script**
   ```cmd
   build-standalone.bat
   ```

### Expected Output
- `dist/SysManagePro.exe` - Standalone executable
- No external DLLs required
- Ready for production deployment

## Alternative: Docker Build

If you prefer to build in a containerized environment:

### Docker Build Script
```bash
# Create Dockerfile for Qt build
cat > Dockerfile << 'EOF'
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ninja-build \
    pkg-config \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libx11-dev \
    libxext-dev \
    libxfixes-dev \
    libxi-dev \
    libxrender-dev \
    libxcb1-dev \
    libx11-xcb-dev \
    libxcb-glx0-dev \
    libxcb-keysyms1-dev \
    libxcb-image0-dev \
    libxcb-shm0-dev \
    libxcb-icccm4-dev \
    libxcb-sync-dev \
    libxcb-xfixes0-dev \
    libxcb-shape0-dev \
    libxcb-randr0-dev \
    libxcb-render-util0-dev \
    libxcb-util-dev \
    libxcb-xinerama0-dev \
    libxcb-xkb-dev \
    libxkbcommon-x11-dev \
    libfontconfig1-dev \
    libfreetype6-dev \
    libx11-dev \
    libxext-dev \
    libxfixes-dev \
    libxi-dev \
    libxrender-dev \
    libxcb1-dev \
    libx11-xcb-dev \
    libxcb-glx0-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Qt 6.9.3
WORKDIR /opt
RUN wget https://download.qt.io/official_releases/qt/6.9/6.9.3/qt-opensource-linux-x64-6.9.3.run
RUN chmod +x qt-opensource-linux-x64-6.9.3.run

# Set environment
ENV PATH="/opt/qt/6.9.3/gcc_64/bin:$PATH"
ENV CMAKE_PREFIX_PATH="/opt/qt/6.9.3/gcc_64"

WORKDIR /workspace
COPY . .

# Build
RUN mkdir build && cd build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    cmake --build . --config Release

CMD ["/workspace/build/SysManagePro"]
EOF

# Build Docker image
docker build -t sysmanagepro-builder .

# Run build
docker run --rm -v $(pwd)/dist:/workspace/dist sysmanagepro-builder
```

## Manual Build (Windows)

If the batch script doesn't work, build manually:

### 1. Set Environment Variables
```cmd
set QT_DIR=C:\Qt\6.9.3\mingw_64
set PATH=%QT_DIR%\bin;%PATH%
set CMAKE_PREFIX_PATH=%QT_DIR%
```

### 2. Create Build Directory
```cmd
mkdir build
cd build
```

### 3. Configure CMake
```cmd
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="%QT_DIR%"
```

### 4. Build
```cmd
cmake --build . --config Release
```

### 5. Copy Executable
```cmd
cd ..
mkdir dist
copy build\SysManagePro.exe dist\
```

## Verification

After building, verify the executable:

1. **Check file size** - Should be several MB (contains all Qt libraries)
2. **Test on clean system** - Should run without external dependencies
3. **Check connections** - Should connect to production backend
4. **Test WebSocket** - Should establish WebSocket connection

## Troubleshooting

### Build Fails
- Ensure Qt 6.9.3 is installed at correct path
- Check MinGW compiler availability
- Verify CMake version (3.16+)

### Executable Won't Run
- Check Windows Defender/antivirus
- Ensure static linking worked
- Test on clean Windows system

### Connection Issues
- Verify backend URL in config.json
- Check firewall settings
- Test network connectivity

## Production Deployment

The resulting `SysManagePro.exe` is:
- **Self-contained** - No external dependencies
- **Optimized** - Release build with -O3
- **Versioned** - Embedded version information
- **Ready** - For immediate deployment

Deploy by simply copying the single .exe file to target systems.