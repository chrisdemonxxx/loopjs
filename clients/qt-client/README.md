# LoopJS Qt Client

This is the Qt-based client application for the LoopJS remote management system.

## Overview

The Qt Client provides a Windows desktop application that connects to the LoopJS backend server via WebSockets. It offers remote management capabilities while maintaining a small footprint and reliable connectivity.

## Features

- WebSocket-based communication with the backend server
- Command execution capabilities
- Automatic reconnection
- Heartbeat mechanism
- System information reporting
- File download and execution
- Remote system control (shutdown, restart, etc.)

## Building

### Prerequisites

- CMake 3.16+
- Qt 5.15+ or Qt 6.x (with QtWebSockets and QtNetwork modules)
- C++ compiler (MSVC, MinGW, etc.)

### Build Steps

1. Run the build script:
   ```
   build.bat
   ```

2. The compiled executable will be available at:
   ```
   build/Release/SysManagePro.exe
   ```

## Configuration

Edit `config.json` to configure:
- WebSocket server URL
- Reconnection settings
- Logging options
- Feature toggles

## Usage

The client is designed to run as a background service but can be shown for debugging purposes.

## Security Notes

- Ensure secure WebSocket connections (wss://) for production use
- Keep the backend URL confidential
- Consider code signing for production deployment

## Development

- `mainwindow.cpp/h`: Main application logic and WebSocket handling
- `DownloadThread.h`: Thread for asynchronous file downloads
- `FileDownloader.h`: File download implementation
- `main_debug.cpp`: Entry point with console output for debugging
