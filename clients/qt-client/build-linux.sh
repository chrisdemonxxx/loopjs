#!/bin/bash

echo "========================================"
echo "Building SysManagePro - Linux Version"
echo "========================================"

# Clean previous builds
if [ -d "build-linux" ]; then
    rm -rf build-linux
fi

if [ -d "dist" ]; then
    rm -rf dist
fi

# Create build directory
mkdir build-linux
cd build-linux

echo ""
echo "Configuring CMake for Linux build..."

# Configure with static linking
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_CXX_FLAGS="-static -static-libgcc -static-libstdc++ -O3 -DNDEBUG -s" \
    -DCMAKE_EXE_LINKER_FLAGS="-static -static-libgcc -static-libstdc++"

if [ $? -ne 0 ]; then
    echo "CMake configuration failed!"
    exit 1
fi

echo ""
echo "Building executable..."
cmake --build . --config Release --parallel

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Build completed successfully!"
echo ""

# Create distribution directory
cd ..
mkdir dist

# Copy executable to dist
cp build-linux/SysManagePro dist/

# Check if executable exists
if [ -f "dist/SysManagePro" ]; then
    echo "========================================"
    echo "BUILD SUCCESSFUL!"
    echo "========================================"
    echo ""
    echo "Executable created: dist/SysManagePro"
    echo ""
    echo "File information:"
    ls -lh dist/SysManagePro
    echo ""
    echo "Ready for deployment!"
    echo ""
else
    echo "========================================"
    echo "BUILD FAILED!"
    echo "========================================"
    echo "Executable not found in dist directory."
    echo ""
    exit 1
fi