SysManagePro - Standalone Deployment Package
============================================

This package contains a fully standalone version of SysManagePro that can run on any Windows machine without requiring Qt or other dependencies to be installed.

Contents:
---------
- SysManagePro.exe          - Main application executable
- Qt6Core.dll              - Qt Core library
- Qt6Gui.dll               - Qt GUI library  
- Qt6Widgets.dll           - Qt Widgets library
- Qt6WebSockets.dll        - Qt WebSockets library
- Qt6Network.dll           - Qt Network library
- libgcc_s_seh-1.dll       - GCC runtime library
- libstdc++-6.dll          - C++ standard library
- libwinpthread-1.dll      - Windows threading library
- platforms/qwindows.dll   - Windows platform plugin

Installation:
-------------
1. Extract all files to a folder on the target machine
2. Run SysManagePro.exe
3. No additional software installation required

System Requirements:
-------------------
- Windows 10 or later
- No additional dependencies required

Build Information:
------------------
- Built with Qt 6.9.3
- MinGW 64-bit compiler
- Release build with optimizations
- All dependencies statically linked or included

For support or questions, contact the development team.
