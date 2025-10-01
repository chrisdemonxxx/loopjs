#!/bin/bash

echo "========================================"
echo "Building SysManagePro with Docker"
echo "========================================"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed or not in PATH"
    echo "Please install Docker first"
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t sysmanagepro-builder .

if [ $? -ne 0 ]; then
    echo "Docker build failed!"
    exit 1
fi

# Create dist directory
mkdir -p dist

# Run build in container
echo "Building executable in Docker container..."
docker run --rm \
    -v "$(pwd)/dist:/workspace/dist" \
    sysmanagepro-builder \
    bash -c "cd build && cp SysManagePro ../dist/"

if [ $? -ne 0 ]; then
    echo "Docker build failed!"
    exit 1
fi

# Check if executable exists
if [ -f "dist/SysManagePro" ]; then
    echo "========================================"
    echo "DOCKER BUILD SUCCESSFUL!"
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
    echo "DOCKER BUILD FAILED!"
    echo "========================================"
    echo "Executable not found in dist directory."
    echo ""
    exit 1
fi