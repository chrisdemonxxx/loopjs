#!/bin/bash

echo "========================================"
echo "Building SysManagePro - Release Version"
echo "========================================"

# Clean previous builds
if [ -d "build-release" ]; then
    rm -rf build-release
fi

if [ -d "dist" ]; then
    rm -rf dist
fi

# Create build directory
mkdir build-release
cd build-release

echo ""
echo "Configuring CMake for Release build..."

# Configure with static linking
cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_CXX_FLAGS="-static -static-libgcc -static-libstdc++" \
    -DCMAKE_EXE_LINKER_FLAGS="-static -static-libgcc -static-libstdc++" \
    -DQT_USE_STATIC_LIBS=ON

if [ $? -ne 0 ]; then
    echo "CMake configuration failed!"
    exit 1
fi

echo ""
echo "Building executable..."
cmake --build . --config Release

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
cp build-release/SysManagePro dist/

# Check if executable exists
if [ -f "dist/SysManagePro" ]; then
    echo "========================================"
    echo "BUILD SUCCESSFUL!"
    echo "========================================"
    echo ""
    echo "Executable created: dist/SysManagePro"
    echo ""
    echo "File size:"
    ls -lh dist/SysManagePro
    echo ""
    echo "Ready for production deployment!"
    echo ""
else
    echo "========================================"
    echo "BUILD FAILED!"
    echo "========================================"
    echo "Executable not found in dist directory."
    echo ""
    exit 1
fi