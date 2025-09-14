#!/bin/bash
# Build script for Linux

set -e

echo "Building StealthClient for Linux..."

# Create build directory
mkdir -p build_linux
cd build_linux

# Configure with CMake
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_STEALTH_BUILD=ON

# Build the project
make -j$(nproc)

echo "Build completed successfully!"
echo "Executable location: bin/stealth_client"

# Optional: Strip symbols for additional stealth
if command -v strip &> /dev/null; then
    echo "Stripping symbols for additional stealth..."
    strip bin/stealth_client
fi

echo "Linux build finished."