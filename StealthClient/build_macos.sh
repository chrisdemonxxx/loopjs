#!/bin/bash
# Build script for macOS

set -e

echo "Building StealthClient for macOS..."

# Create build directory
mkdir -p build_macos
cd build_macos

# Configure with CMake
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_STEALTH_BUILD=ON

# Build the project
make -j$(sysctl -n hw.ncpu)

echo "Build completed successfully!"
echo "Executable location: bin/stealth_client"

# Optional: Strip symbols for additional stealth
if command -v strip &> /dev/null; then
    echo "Stripping symbols for additional stealth..."
    strip bin/stealth_client
fi

echo "macOS build finished."